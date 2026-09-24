import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { isSessionOwnedByEmail, resolvePortalTokenFromRequest } from "@/lib/portalAuth";
import {
  groupSessionDocuments,
  listSessionDocumentRefs,
  withSignedSessionDocumentUrls,
  type SessionDocumentWithUrl
} from "@/lib/sessionDocuments";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toPublicDocument = (document: SessionDocumentWithUrl) => ({
  doc_type: document.docType,
  name: document.name,
  url: document.url,
  uploaded_at: document.uploadedAt,
  size: document.size
});

const extendTokenExpiry = async (token: string) => {
  const nextExpiry = new Date();
  nextExpiry.setFullYear(nextExpiry.getFullYear() + 10);
  await supabaseAdmin
    .from("sessions")
    .update({ token_expires_at: nextExpiry.toISOString() })
    .eq("token", token);
  return nextExpiry.toISOString();
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
      .select("id, client_name, client_email, status, token_expires_at, monday_item_id")
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

    let groupedDocuments = groupSessionDocuments<SessionDocumentWithUrl>([]);
    try {
      const refs = await listSessionDocumentRefs(session.id);
      const documentsWithUrls = await withSignedSessionDocumentUrls(refs);
      groupedDocuments = groupSessionDocuments(documentsWithUrls);
    } catch (documentsErr) {
      console.error("per-session-documents-read-failed", {
        session_id: session.id,
        documentsErr
      });
    }

    const avisDocuments = groupedDocuments.avis_imposition;
    const autreDocuments = groupedDocuments.autre;
    const currentStatus = String(session.status ?? "").trim().toLowerCase();
    const resolvedStatus =
      currentStatus === "transferred" ? "transferred" : avisDocuments.length > 0 ? "in_progress" : "pending";

    return NextResponse.json({
      already_done: resolvedStatus === "transferred",
      client_name: session.client_name,
      client_email: session.client_email,
      status: resolvedStatus,
      avis_imposition_done: avisDocuments.length > 0,
      avis_imposition_documents: avisDocuments.map(toPublicDocument),
      autre_documents: autreDocuments.map(toPublicDocument),
      expires_at: expiresAt
    });
  } catch (err) {
    console.error("per-session-route-failed", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
