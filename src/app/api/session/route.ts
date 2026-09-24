import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getSimulationFromMonday } from "@/lib/mondaySimulation";
import { isSessionOwnedByEmail, resolvePortalTokenFromRequest } from "@/lib/portalAuth";
import {
  groupSessionDocuments,
  listSessionDocumentRefs,
  toLegacySessionDocument,
  withSignedSessionDocumentUrls,
  type SessionDocumentWithUrl
} from "@/lib/sessionDocuments";
import {
  findItemColumnValue,
  getBoardColumns,
  getItemById,
  normalizeEnv,
  pickColumnByTitle,
  updateItemMultipleColumns
} from "@/lib/monday";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const extendTokenExpiry = async (token: string) => {
  const nextExpiry = new Date();
  nextExpiry.setFullYear(nextExpiry.getFullYear() + 10);
  await supabaseAdmin
    .from("sessions")
    .update({ token_expires_at: nextExpiry.toISOString() })
    .eq("token", token);
  return nextExpiry.toISOString();
};

const SIMULATION_SENT_STATUS =
  normalizeEnv(process.env.MONDAY_SIMULATION_SENT_STATUS) ?? "Devis envoyé - en attente de décision";

const toPublicDocument = (document: SessionDocumentWithUrl) => ({
  doc_type: document.docType,
  name: document.name,
  url: document.url,
  uploaded_at: document.uploadedAt,
  size: document.size
});

const syncMondayStatusOnSimulation = async (mondayItemId: string) => {
  if (!mondayItemId || !normalizeEnv(process.env.MONDAY_API_TOKEN)) return;

  try {
    const item = await getItemById(mondayItemId);
    if (!item) return;

    const boardColumns = await getBoardColumns(item.board.id);
    const statusColumnId =
      normalizeEnv(process.env.MONDAY_STATUS_COLUMN_ID) ??
      pickColumnByTitle(boardColumns, [/^statut$/i, /^status$/i, /^etat$/i, /status dossier/i])?.id ??
      "";
    if (!statusColumnId) return;

    const currentStatus = findItemColumnValue(item.column_values, statusColumnId)?.text?.trim().toLowerCase() ?? "";
    if (currentStatus === SIMULATION_SENT_STATUS.toLowerCase()) return;

    await updateItemMultipleColumns({
      boardId: item.board.id,
      itemId: item.id,
      columnValues: {
        [statusColumnId]: SIMULATION_SENT_STATUS
      }
    });
  } catch (error) {
    console.error("session-route-monday-status-sync-failed", { mondayItemId, error });
  }
};

export async function GET(req: NextRequest) {
  try {
    noStore();

    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
    }

    const requestUrl = new URL(req.url);
    const tokenFromQuery = requestUrl.searchParams.get("token")?.trim() ?? "";
    const tokenAuth = resolvePortalTokenFromRequest({ req, legacyToken: tokenFromQuery });
    const token = tokenAuth.token || tokenFromQuery;
    if (!token) {
      return NextResponse.json({ error: "Session non authentifiée" }, { status: 401 });
    }

    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("id, client_name, client_email, bank, status, offre_url, tableau_url, identite_url, token_expires_at, monday_item_id")
      .eq("token", token)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
    }
    if (!isSessionOwnedByEmail({ sessionEmail: session.client_email, expectedEmail: tokenAuth.email })) {
      return NextResponse.json({ error: "Session non autorisée" }, { status: 403 });
    }

    let expiresAt = session.token_expires_at;
    if (new Date(session.token_expires_at) < new Date()) {
      expiresAt = await extendTokenExpiry(token);
    }

    const simulation = await getSimulationFromMonday(session.monday_item_id ?? "");
    let groupedDocuments = groupSessionDocuments<SessionDocumentWithUrl>([]);
    try {
      const refs = await listSessionDocumentRefs(session.id);
      const documentsWithUrls = await withSignedSessionDocumentUrls(refs);
      groupedDocuments = groupSessionDocuments(documentsWithUrls);
    } catch (documentsErr) {
      console.error("session-route-documents-read-failed", {
        session_id: session.id,
        documentsErr
      });
    }

    const offreDocuments =
      groupedDocuments.offre.length > 0
        ? groupedDocuments.offre
        : session.offre_url
          ? [toLegacySessionDocument({ docType: "offre", url: session.offre_url })]
          : [];
    const tableauDocuments =
      groupedDocuments.tableau.length > 0
        ? groupedDocuments.tableau
        : session.tableau_url
          ? [toLegacySessionDocument({ docType: "tableau", url: session.tableau_url })]
          : [];
    const autreDocuments = groupedDocuments.autre;

    const currentStatus = String(session.status ?? "").trim().toLowerCase();
    const hasRequiredDocs = offreDocuments.length > 0 && tableauDocuments.length > 0;
    const hasSimulation = Boolean(simulation?.url);
    const shouldSyncMondaySimulationStatus = hasRequiredDocs && hasSimulation;

    let resolvedStatus = session.status ?? "pending";
    if (currentStatus === "transferred") {
      resolvedStatus = "transferred";
    } else if (currentStatus === "proposal_accepted" || currentStatus === "accepted") {
      resolvedStatus = "proposal_accepted";
    } else if (hasRequiredDocs && hasSimulation) {
      resolvedStatus = "simulation_available";
    } else if (hasRequiredDocs) {
      resolvedStatus = "in_progress";
    } else if (currentStatus === "password_set") {
      resolvedStatus = "password_set";
    } else {
      resolvedStatus = "pending";
    }

    if (shouldSyncMondaySimulationStatus) {
      await syncMondayStatusOnSimulation(session.monday_item_id ?? "");
    }

    return NextResponse.json({
      already_done: resolvedStatus === "transferred",
      client_name: session.client_name,
      bank: session.bank,
      status: resolvedStatus,
      offre_done: offreDocuments.length > 0,
      tableau_done: tableauDocuments.length > 0,
      identite_done: Boolean(session.identite_url),
      offre_url: offreDocuments[0]?.url ?? "",
      tableau_url: tableauDocuments[0]?.url ?? "",
      identite_url: session.identite_url ?? "",
      offre_documents: offreDocuments.map(toPublicDocument),
      tableau_documents: tableauDocuments.map(toPublicDocument),
      autre_documents: autreDocuments.map(toPublicDocument),
      simulation_url: simulation?.url ?? "",
      simulation_name: simulation?.name ?? "",
      expires_at: expiresAt
    });
  } catch (err) {
    console.error("session-route-failed", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
