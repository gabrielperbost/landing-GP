import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  ensureMondayApiToken,
  getBoardColumns,
  getBoardGroups,
  getItemById,
  moveItemToGroup,
  normalizeEnv,
  normalizeText,
  updateItemMultipleColumns
} from "@/lib/monday";
import { buildPerAvisMondayValues, PER_AVIS_IMPOSITION_LABEL } from "@/lib/perDossier";
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
const ALLOWED_DOC_TYPES = new Set(["avis_imposition", "autre"]);
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const DOC_TYPE_LABELS: Record<UploadDocType, string> = {
  avis_imposition: PER_AVIS_IMPOSITION_LABEL,
  autre: "Autre document"
};

type UploadDocType = "avis_imposition" | "autre";

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

const resolveGroupIdByTitle = async ({
  boardId,
  envId,
  envTitle,
  fallbackTitle
}: {
  boardId: string;
  envId: string;
  envTitle: string;
  fallbackTitle: string;
}) => {
  const configuredGroupId = normalizeEnv(process.env[envId]);
  if (configuredGroupId) return configuredGroupId;

  const targetTitle = normalizeEnv(process.env[envTitle]) ?? fallbackTitle;
  const groups = await getBoardGroups(boardId);
  const targetGroup = groups.find((group) => normalizeText(group.title) === normalizeText(targetTitle));
  return targetGroup?.id ?? "";
};

const movePerItemToQuoteGroupIfNeeded = async ({
  itemId,
  boardId,
  currentGroup
}: {
  itemId: string;
  boardId: string;
  currentGroup: { id: string; title: string } | null;
}) => {
  const quoteGroupId = await resolveGroupIdByTitle({
    boardId,
    envId: "MONDAY_PER_QUOTE_GROUP_ID",
    envTitle: "MONDAY_PER_QUOTE_GROUP_TITLE",
    fallbackTitle: "Devis à réaliser"
  });
  if (!quoteGroupId) return false;
  if (currentGroup?.id === quoteGroupId) return false;

  const waitingDocsGroupId = await resolveGroupIdByTitle({
    boardId,
    envId: "MONDAY_PER_WAITING_DOCS_GROUP_ID",
    envTitle: "MONDAY_PER_WAITING_DOCS_GROUP_TITLE",
    fallbackTitle: "Attente documents"
  });
  const waitingDocsSingularTitle =
    normalizeEnv(process.env.MONDAY_PER_WAITING_DOCS_GROUP_TITLE_SINGULAR) ?? "Attente document";
  const isWaitingDocsGroup =
    !currentGroup ||
    currentGroup.id === waitingDocsGroupId ||
    normalizeText(currentGroup.title) === normalizeText(waitingDocsSingularTitle) ||
    normalizeText(currentGroup.title) === normalizeText("Attente documents");

  if (!isWaitingDocsGroup) return false;

  await moveItemToGroup({
    itemId,
    groupId: quoteGroupId
  });
  return true;
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

const syncUploadedAvisToMonday = async ({
  mondayItemId,
  file,
  fileUrl
}: {
  mondayItemId: string;
  file: File;
  fileUrl: string;
}) => {
  if (!mondayItemId || !normalizeEnv(process.env.MONDAY_API_TOKEN)) return;

  const item = await getItemById(mondayItemId);
  if (!item) return;

  const boardColumns = await getBoardColumns(item.board.id);
  const { columnValues, fileColumnId } = buildPerAvisMondayValues({
    boardColumns,
    fileUrl,
    includeTargetStatus: true
  });

  if (Object.keys(columnValues).length > 0) {
    await updateItemMultipleColumns({
      boardId: item.board.id,
      itemId: mondayItemId,
      columnValues
    });
  }

  if (fileColumnId) {
    await uploadMondayFileToColumn({
      itemId: mondayItemId,
      columnId: fileColumnId,
      file
    });
  }

  await movePerItemToQuoteGroupIfNeeded({
    itemId: mondayItemId,
    boardId: item.board.id,
    currentGroup: item.group
  });
};

const sendInternalUploadNoticeEmail = async ({
  clientName,
  clientEmail,
  mondayItemId,
  docType,
  fileName,
  fileUrl
}: {
  clientName: string;
  clientEmail: string;
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
    subject: `Document PER déposé (${docLabel}) - ${clientName || clientEmail || "Client"}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;">
        <h2 style="margin:0 0 12px;">Nouveau document PER déposé</h2>
        <p style="margin:0 0 8px;"><strong>Type:</strong> ${docLabel}</p>
        <p style="margin:0 0 8px;"><strong>Nom du fichier:</strong> ${fileName}</p>
        <p style="margin:0 0 8px;"><strong>Client:</strong> ${clientName || "Non renseigné"}</p>
        <p style="margin:0 0 8px;"><strong>Email client:</strong> ${clientEmail || "Non renseigné"}</p>
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
    const docType = String(formData.get("doc_type") ?? "").trim() as UploadDocType;
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
      .select("id, status, token_expires_at, monday_item_id, client_email, client_name")
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
      console.error("per-upload-failed", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
    }

    const { data: signedUrlData } = await supabaseAdmin.storage.from("documents").createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    const fileUrl = signedUrlData?.signedUrl || storagePath;

    if (docType === "avis_imposition") {
      try {
        await syncUploadedAvisToMonday({
          mondayItemId: session.monday_item_id ?? "",
          file,
          fileUrl
        });
      } catch (mondaySyncError) {
        console.error("per-upload-monday-sync-failed", {
          session_id: session.id,
          monday_item_id: session.monday_item_id,
          error: mondaySyncError
        });
      }
    }

    let internalUploadNoticeSent = false;
    try {
      internalUploadNoticeSent = await sendInternalUploadNoticeEmail({
        clientName: session.client_name ?? "",
        clientEmail: session.client_email ?? "",
        mondayItemId: session.monday_item_id ?? "",
        docType,
        fileName: file.name,
        fileUrl
      });
    } catch (uploadNoticeErr) {
      console.error("per-upload-internal-notice-failed", {
        session_id: session.id,
        monday_item_id: session.monday_item_id,
        doc_type: docType,
        uploadNoticeErr
      });
    }

    let avisCount = docType === "avis_imposition" ? 1 : 0;
    let autreCount = docType === "autre" ? 1 : 0;
    try {
      const refs = await listSessionDocumentRefs(session.id);
      const groupedRefs = groupSessionDocuments(refs);
      avisCount = Math.max(avisCount, groupedRefs.avis_imposition.length);
      autreCount = Math.max(autreCount, groupedRefs.autre.length);
    } catch (documentsReadErr) {
      console.error("per-upload-session-documents-read-failed", {
        session_id: session.id,
        monday_item_id: session.monday_item_id,
        doc_type: docType,
        documentsReadErr
      });
    }

    const nextStatus = avisCount > 0 ? "in_progress" : String(session.status ?? "").trim() || "pending";
    if (nextStatus !== (session.status ?? "")) {
      await supabaseAdmin.from("sessions").update({ status: nextStatus }).eq("id", session.id);
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      doc_type: docType,
      internal_upload_notice_sent: internalUploadNoticeSent,
      uploaded_count_by_type: {
        avis_imposition: avisCount,
        autre: autreCount
      }
    });
  } catch (err) {
    console.error("per-upload-route-failed", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
