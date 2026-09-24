import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getBankLabel } from "@/lib/depot";
import {
  ensureMondayApiToken,
  findItemColumnValue,
  getBoardColumns,
  getItemById,
  normalizeEnv,
  normalizeText,
  pickColumnByTitle,
  updateItemMultipleColumns
} from "@/lib/monday";
import { isSessionOwnedByEmail, isTrustedPortalOrigin, resolvePortalTokenFromRequest } from "@/lib/portalAuth";
import { groupSessionDocuments, listSessionDocumentRefs } from "@/lib/sessionDocuments";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resolveMaxFileSize = () => {
  const raw = Number(process.env.DEPOT_MAX_FILE_MB ?? "10");
  if (!Number.isFinite(raw) || raw <= 0) return 10 * 1024 * 1024;
  return Math.min(raw, 30) * 1024 * 1024;
};

const MAX_SIZE = resolveMaxFileSize();
const ALLOWED_DOC_TYPES = new Set(["offre", "tableau", "autre"]);
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MONDAY_DOC_RECEIVED_STATUS_LABEL = normalizeEnv(process.env.MONDAY_DOC_RECEIVED_STATUS_LABEL) ?? "Reçu";
const MONDAY_TARGET_STATUS_LABEL = normalizeEnv(process.env.MONDAY_TARGET_STATUS) ?? "Devis à réaliser";
const DOC_TYPE_LABELS: Record<UploadDocType, string> = {
  offre: "Offre de prêt",
  tableau: "Tableau d'amortissement",
  autre: "Autre document"
};

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const extendSessionTokenExpiryById = async (sessionId: string) => {
  const nextExpiry = new Date();
  nextExpiry.setFullYear(nextExpiry.getFullYear() + 10);
  await supabaseAdmin
    .from("sessions")
    .update({ token_expires_at: nextExpiry.toISOString() })
    .eq("id", sessionId);
};

type UploadDocType = "offre" | "tableau" | "autre";
type MondayColumnType = "checkbox" | "status" | "text" | "long_text" | "link" | "date" | "file" | "files";
type TransferApiResponse = {
  success?: boolean;
  error?: string;
  transferred_at?: string | null;
  internal_email_sent?: boolean;
  make_webhook_sent?: boolean;
  monday_update_sent?: boolean;
  already_transferred?: boolean;
};

const resolveMondayColumnsForDoc = ({
  docType,
  boardColumns
}: {
  docType: UploadDocType;
  boardColumns: Array<{ id: string; title: string; type: string }>;
}) => {
  if (docType === "offre") {
    return {
      receivedColumnId:
        normalizeEnv(process.env.MONDAY_OFFRE_RECEIVED_COLUMN_ID) ??
        pickColumnByTitle(boardColumns, [/offre re[cç]ue/i])?.id ??
        "",
      linkColumnId:
        normalizeEnv(process.env.MONDAY_OFFRE_LINK_COLUMN_ID) ??
        pickColumnByTitle(boardColumns, [/lien offre/i])?.id ??
        "",
      label: "Offre de prêt"
    };
  }

  return {
    receivedColumnId:
      normalizeEnv(process.env.MONDAY_TABLEAU_RECEIVED_COLUMN_ID) ??
      pickColumnByTitle(boardColumns, [/tableau re[cç]u/i, /amortissement re[cç]u/i])?.id ??
      "",
    linkColumnId:
      normalizeEnv(process.env.MONDAY_TABLEAU_LINK_COLUMN_ID) ??
      pickColumnByTitle(boardColumns, [/lien tableau/i, /lien amortissement/i])?.id ??
      "",
    label: "Tableau d'amortissement"
  };
};

const buildMondayValueByColumnType = ({
  columnType,
  fileUrl,
  label
}: {
  columnType: MondayColumnType | string;
  fileUrl: string;
  label: string;
}) => {
  if (columnType === "checkbox") return { checked: "true" };
  if (columnType === "status") return MONDAY_DOC_RECEIVED_STATUS_LABEL;
  if (columnType === "link") return { url: fileUrl, text: label };
  if (columnType === "date") return { date: new Date().toISOString().slice(0, 10) };
  if (columnType === "long_text" || columnType === "text") return fileUrl;

  // Unknown type fallback: keep something usable.
  return fileUrl;
};

const uploadMondayFileToColumn = async ({
  itemId,
  columnId,
  file
}: {
  itemId: string;
  columnId: string;
  file: File;
}) => {
  const token = ensureMondayApiToken();
  const formData = new FormData();
  formData.append(
    "query",
    `
      mutation AddFileToColumn($itemId: ID!, $columnId: String!, $file: File!) {
        add_file_to_column(item_id: $itemId, column_id: $columnId, file: $file) {
          id
        }
      }
    `
  );
  formData.append("variables[itemId]", itemId);
  formData.append("variables[columnId]", columnId);
  formData.append("variables[file]", file, file.name);

  const response = await fetch("https://api.monday.com/v2/file", {
    method: "POST",
    headers: {
      Authorization: token
    },
    body: formData
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`monday_file_upload_http_${response.status}:${body.slice(0, 240)}`);
  }
};

const syncUploadedDocToMonday = async ({
  mondayItemId,
  docType,
  file,
  fileUrl
}: {
  mondayItemId: string;
  docType: UploadDocType;
  file: File;
  fileUrl: string;
}) => {
  if (!mondayItemId || !normalizeEnv(process.env.MONDAY_API_TOKEN)) return;
  if (!["offre", "tableau"].includes(docType)) return;

  const item = await getItemById(mondayItemId);
  if (!item) return;

  const boardColumns = await getBoardColumns(item.board.id);
  const depotDateColumnId =
    normalizeEnv(process.env.MONDAY_DATE_DEPOT_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/date de d[eé]p[oô]t/i, /date.*depot/i])?.id ??
    "";

  const resolved = resolveMondayColumnsForDoc({
    docType,
    boardColumns
  });

  const receivedColumn = boardColumns.find((column) => column.id === resolved.receivedColumnId);
  const linkColumn = boardColumns.find((column) => column.id === resolved.linkColumnId);

  const columnValues: Record<string, unknown> = {};
  if (depotDateColumnId) {
    columnValues[depotDateColumnId] = { date: new Date().toISOString().slice(0, 10) };
  }

  if (receivedColumn && !["file", "files"].includes(receivedColumn.type)) {
    columnValues[receivedColumn.id] = buildMondayValueByColumnType({
      columnType: receivedColumn.type,
      fileUrl,
      label: resolved.label
    });
  }

  if (linkColumn) {
    columnValues[linkColumn.id] = buildMondayValueByColumnType({
      columnType: linkColumn.type,
      fileUrl,
      label: resolved.label
    });
  }

  if (Object.keys(columnValues).length > 0) {
    await updateItemMultipleColumns({
      boardId: item.board.id,
      itemId: mondayItemId,
      columnValues
    });
  }

  // If "offre reçue" / "tableau reçu" are file columns, attach the file directly.
  if (receivedColumn && ["file", "files"].includes(receivedColumn.type)) {
    await uploadMondayFileToColumn({
      itemId: mondayItemId,
      columnId: receivedColumn.id,
      file
    });
  }
};

const syncMondayStatusWhenRequiredDocsReady = async ({
  mondayItemId,
  offreDone,
  tableauDone
}: {
  mondayItemId: string;
  offreDone: boolean;
  tableauDone: boolean;
}) => {
  if (!mondayItemId || !normalizeEnv(process.env.MONDAY_API_TOKEN)) return;
  if (!offreDone || !tableauDone) return;

  const item = await getItemById(mondayItemId);
  if (!item) return;

  const boardColumns = await getBoardColumns(item.board.id);
  const statusColumnId =
    normalizeEnv(process.env.MONDAY_STATUS_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/^statut$/i, /^status$/i, /^etat$/i, /status dossier/i])?.id ??
    "";
  if (!statusColumnId) return;

  const currentStatus = normalizeText(findItemColumnValue(item.column_values, statusColumnId)?.text);
  if (currentStatus === normalizeText(MONDAY_TARGET_STATUS_LABEL)) return;

  const lockedStatuses = [
    "devis envoye",
    "proposition acceptee",
    "signature",
    "effectif",
    "transfere",
    "transferred"
  ];
  if (currentStatus && lockedStatuses.some((label) => currentStatus.includes(label))) return;

  await updateItemMultipleColumns({
    boardId: item.board.id,
    itemId: mondayItemId,
    columnValues: {
      [statusColumnId]: MONDAY_TARGET_STATUS_LABEL
    }
  });
};

const sendInternalUploadNoticeEmail = async ({
  clientName,
  clientEmail,
  bank,
  mondayItemId,
  docType,
  fileName,
  fileUrl
}: {
  clientName: string;
  clientEmail: string;
  bank: string;
  mondayItemId: string;
  docType: UploadDocType;
  fileName: string;
  fileUrl: string;
}) => {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.FROM_EMAIL);
  const to = normalizeEnv(process.env.INTERNAL_LEADS_EMAIL);
  if (!host || !user || !pass || !from || !to) return false;

  const transporter = nodemailer.createTransport({
    host,
    port: parsePort(normalizeEnv(process.env.SMTP_PORT), 465),
    secure: normalizeEnv(process.env.SMTP_SECURE) !== "false",
    auth: { user, pass }
  });

  const docLabel = DOC_TYPE_LABELS[docType] ?? docType;
  await transporter.sendMail({
    from,
    to,
    subject: `📎 Document déposé (${docLabel}) - ${clientName || clientEmail || "Client"}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;">
        <h2 style="margin:0 0 12px;">Nouveau document déposé</h2>
        <p style="margin:0 0 8px;"><strong>Type:</strong> ${docLabel}</p>
        <p style="margin:0 0 8px;"><strong>Nom du fichier:</strong> ${fileName}</p>
        <p style="margin:0 0 8px;"><strong>Client:</strong> ${clientName || "Non renseigné"}</p>
        <p style="margin:0 0 8px;"><strong>Email client:</strong> ${clientEmail || "Non renseigné"}</p>
        <p style="margin:0 0 8px;"><strong>Banque:</strong> ${getBankLabel(bank)}</p>
        <p style="margin:0 0 8px;"><strong>Monday item ID:</strong> ${mondayItemId || "Non renseigné"}</p>
        <p style="margin:0 0 8px;"><a href="${fileUrl}">Ouvrir le document</a></p>
      </div>
    `
  });

  return true;
};

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
    }
    if (!isTrustedPortalOrigin(req)) {
      return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
    }

    const formData = await req.formData();
    const tokenFromForm = String(formData.get("token") ?? "").trim();
    const tokenAuth = resolvePortalTokenFromRequest({ req, legacyToken: tokenFromForm });
    const token = tokenAuth.token || tokenFromForm;
    const docType = String(formData.get("doc_type") ?? "").trim();
    const file = formData.get("file");

    if (!token) {
      return NextResponse.json({ error: "Session non authentifiée" }, { status: 401 });
    }

    if (!docType || !(file instanceof File)) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    if (!ALLOWED_DOC_TYPES.has(docType)) {
      return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Format non accepté (PDF, JPG, PNG)" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      const maxMb = Math.round(MAX_SIZE / (1024 * 1024));
      return NextResponse.json({ error: `Fichier trop volumineux (max ${maxMb} Mo)` }, { status: 400 });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("id, status, token_expires_at, monday_item_id, offre_url, tableau_url, client_email, client_name, bank")
      .eq("token", token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
    }
    if (!isSessionOwnedByEmail({ sessionEmail: session.client_email, expectedEmail: tokenAuth.email })) {
      return NextResponse.json({ error: "Session non autorisée" }, { status: 403 });
    }

    if (new Date(session.token_expires_at) < new Date()) {
      await extendSessionTokenExpiryById(session.id);
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const storagePath = `sessions/${session.id}/${Date.now()}-${docType}.${extension}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage.from("documents").upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true
    });

    if (uploadError) {
      console.error("upload-failed", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
    }

    const { data: signedUrlData } = await supabaseAdmin.storage.from("documents").createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    const fileUrl = signedUrlData?.signedUrl || storagePath;

    const columnMap: Record<string, string> = {
      offre: "offre_url",
      tableau: "tableau_url"
    };

    const targetColumn = columnMap[docType];
    if (targetColumn) {
      await supabaseAdmin.from("sessions").update({ [targetColumn]: fileUrl }).eq("id", session.id);
    }

    let internalUploadNoticeSent = false;
    if (docType === "autre") {
      try {
        internalUploadNoticeSent = await sendInternalUploadNoticeEmail({
          clientName: session.client_name ?? "",
          clientEmail: session.client_email ?? "",
          bank: session.bank ?? "",
          mondayItemId: session.monday_item_id ?? "",
          docType: "autre",
          fileName: file.name,
          fileUrl
        });
      } catch (uploadNoticeErr) {
        console.error("upload-internal-notice-failed", {
          session_id: session.id,
          monday_item_id: session.monday_item_id,
          uploadNoticeErr
        });
      }
    }

    try {
      await syncUploadedDocToMonday({
        mondayItemId: session.monday_item_id ?? "",
        docType: docType as UploadDocType,
        file,
        fileUrl
      });
    } catch (mondaySyncError) {
      console.error("upload-monday-sync-failed", {
        session_id: session.id,
        monday_item_id: session.monday_item_id,
        doc_type: docType,
        error: mondaySyncError
      });
    }

    const fallbackOffreDone = docType === "offre" || Boolean(session.offre_url);
    const fallbackTableauDone = docType === "tableau" || Boolean(session.tableau_url);
    let offreCount = fallbackOffreDone ? 1 : 0;
    let tableauCount = fallbackTableauDone ? 1 : 0;
    let autreCount = docType === "autre" ? 1 : 0;
    try {
      const refs = await listSessionDocumentRefs(session.id);
      const groupedRefs = groupSessionDocuments(refs);
      offreCount = Math.max(offreCount, groupedRefs.offre.length);
      tableauCount = Math.max(tableauCount, groupedRefs.tableau.length);
      autreCount = Math.max(autreCount, groupedRefs.autre.length);
    } catch (documentsReadErr) {
      console.error("upload-session-documents-read-failed", {
        session_id: session.id,
        monday_item_id: session.monday_item_id,
        doc_type: docType,
        documentsReadErr
      });
    }

    const offreDone = offreCount > 0;
    const tableauDone = tableauCount > 0;
    try {
      await syncMondayStatusWhenRequiredDocsReady({
        mondayItemId: session.monday_item_id ?? "",
        offreDone,
        tableauDone
      });
    } catch (mondayStatusError) {
      console.error("upload-monday-status-ready-sync-failed", {
        session_id: session.id,
        monday_item_id: session.monday_item_id,
        doc_type: docType,
        error: mondayStatusError
      });
    }

    const normalizedStatus = String(session.status ?? "").trim().toLowerCase();
    const docsReady = offreDone && tableauDone;
    const shouldAutoTransfer = docsReady && normalizedStatus !== "transferred" && normalizedStatus !== "proposal_accepted";
    let autoTransferAttempted = false;
    let autoTransferSuccess = false;
    let autoTransferInternalEmailSent = false;
    let autoTransferTransferredAt = "";
    let autoTransferError = "";

    if (shouldAutoTransfer) {
      autoTransferAttempted = true;
      try {
        const transferResponse = await fetch(new URL("/api/transfer", req.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const transferPayload = ((await transferResponse.json().catch(() => ({}))) ?? {}) as TransferApiResponse;
        autoTransferSuccess = transferResponse.ok && Boolean(transferPayload.success);
        autoTransferInternalEmailSent = Boolean(transferPayload.internal_email_sent);
        autoTransferTransferredAt = String(transferPayload.transferred_at ?? "");
        autoTransferError = String(transferPayload.error ?? "");

        if (!autoTransferSuccess) {
          console.error("upload-auto-transfer-failed", {
            session_id: session.id,
            monday_item_id: session.monday_item_id,
            status: transferResponse.status,
            payload: transferPayload
          });
        }
      } catch (autoTransferErrorObj) {
        autoTransferError = "auto_transfer_request_failed";
        console.error("upload-auto-transfer-request-failed", {
          session_id: session.id,
          monday_item_id: session.monday_item_id,
          autoTransferErrorObj
        });
      }
    }

    let nextStatus = String(session.status ?? "").trim() || "pending";

    if (!autoTransferSuccess && normalizedStatus !== "transferred" && normalizedStatus !== "proposal_accepted") {
      if (docsReady) {
        nextStatus = "in_progress";
      } else if (!normalizedStatus) {
        nextStatus = "pending";
      }
    }

    if (nextStatus !== (session.status ?? "")) {
      await supabaseAdmin.from("sessions").update({ status: nextStatus }).eq("id", session.id);
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      doc_type: docType,
      auto_transfer_attempted: autoTransferAttempted,
      auto_transfer_success: autoTransferSuccess,
      auto_transfer_internal_email_sent: autoTransferInternalEmailSent,
      auto_transfer_transferred_at: autoTransferTransferredAt || null,
      auto_transfer_error: autoTransferError || null,
      internal_upload_notice_sent: internalUploadNoticeSent,
      uploaded_count_by_type: {
        offre: offreCount,
        tableau: tableauCount,
        autre: autreCount
      }
    });
  } catch (err) {
    console.error("upload-route-failed", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
