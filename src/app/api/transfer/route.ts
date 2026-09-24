import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { PDFDocument } from "pdf-lib";
import { getBankLabel } from "@/lib/depot";
import {
  getBoardColumns,
  getItemById,
  normalizeEnv,
  pickColumnByTitle,
  updateItemMultipleColumns
} from "@/lib/monday";
import { isSessionOwnedByEmail, isTrustedPortalOrigin, resolvePortalTokenFromRequest } from "@/lib/portalAuth";
import {
  groupSessionDocuments,
  listSessionDocumentRefs,
  toLegacySessionDocument,
  withSignedSessionDocumentUrls,
  type SessionDocumentType,
  type SessionDocumentWithUrl
} from "@/lib/sessionDocuments";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const extendSessionTokenExpiryById = async (sessionId: string) => {
  const nextExpiry = new Date();
  nextExpiry.setFullYear(nextExpiry.getFullYear() + 10);
  await supabaseAdmin
    .from("sessions")
    .update({ token_expires_at: nextExpiry.toISOString() })
    .eq("id", sessionId);
};

type TransferPayload = {
  token?: string;
  bank?: string;
};

const DOC_TYPE_LABELS: Record<SessionDocumentType, string> = {
  offre: "Offre de prêt",
  tableau: "Tableau d'amortissement",
  avis_imposition: "Avis d'imposition",
  autre: "Autre document"
};

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

type EmailPdfAttachment = {
  label: string;
  filename: string;
  content: Buffer;
  contentType: "application/pdf";
};

type TransferDocument = Pick<SessionDocumentWithUrl, "docType" | "name" | "url">;

const normalizePathname = (rawUrl: string) => {
  try {
    return new URL(rawUrl).pathname.toLowerCase();
  } catch {
    return rawUrl.toLowerCase();
  }
};

const toSafeFilePart = (value: string) =>
  value
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .replaceAll(/[^a-zA-Z0-9]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "")
    .toLowerCase();

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const resolveTransferDocuments = async ({
  sessionId,
  legacyOffreUrl,
  legacyTableauUrl
}: {
  sessionId: string;
  legacyOffreUrl: string;
  legacyTableauUrl: string;
}) => {
  let grouped = groupSessionDocuments<SessionDocumentWithUrl>([]);
  try {
    const refs = await listSessionDocumentRefs(sessionId);
    const signedDocs = await withSignedSessionDocumentUrls(refs);
    grouped = groupSessionDocuments(signedDocs);
  } catch (documentsErr) {
    console.error("transfer-documents-read-failed", {
      session_id: sessionId,
      documentsErr
    });
  }

  const offre =
    grouped.offre.length > 0
      ? grouped.offre
      : legacyOffreUrl
        ? [toLegacySessionDocument({ docType: "offre", url: legacyOffreUrl })]
        : [];
  const tableau =
    grouped.tableau.length > 0
      ? grouped.tableau
      : legacyTableauUrl
        ? [toLegacySessionDocument({ docType: "tableau", url: legacyTableauUrl })]
        : [];
  const autre = grouped.autre;
  const all = [...offre, ...tableau, ...autre];

  const toTransferDocument = (document: SessionDocumentWithUrl): TransferDocument => ({
    docType: document.docType,
    name: document.name,
    url: document.url
  });

  return {
    offre: offre.map(toTransferDocument),
    tableau: tableau.map(toTransferDocument),
    autre: autre.map(toTransferDocument),
    all: all.map(toTransferDocument)
  };
};

const toPdfFromImage = async ({ bytes, mimeType }: { bytes: Buffer; mimeType: "image/jpeg" | "image/png" }) => {
  const pdf = await PDFDocument.create();
  const image = mimeType === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  const page = pdf.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height
  });
  const pdfBytes = await pdf.save();
  return Buffer.from(pdfBytes);
};

const buildPdfAttachment = async ({
  url,
  label,
  clientName
}: {
  url: string;
  label: string;
  clientName: string;
}): Promise<EmailPdfAttachment | null> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`download_failed_${response.status}`);
  }

  const rawBytes = Buffer.from(await response.arrayBuffer());
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  const pathname = normalizePathname(url);

  const isPdf = contentType.includes("application/pdf") || pathname.endsWith(".pdf");
  const isPng = contentType.includes("image/png") || pathname.endsWith(".png");
  const isJpeg = contentType.includes("image/jpeg") || pathname.endsWith(".jpg") || pathname.endsWith(".jpeg");

  let pdfContent: Buffer;
  if (isPdf) {
    pdfContent = rawBytes;
  } else if (isPng) {
    pdfContent = await toPdfFromImage({ bytes: rawBytes, mimeType: "image/png" });
  } else if (isJpeg) {
    pdfContent = await toPdfFromImage({ bytes: rawBytes, mimeType: "image/jpeg" });
  } else {
    return null;
  }

  const safeClientName = toSafeFilePart(clientName || "client");
  const safeLabel = toSafeFilePart(label);
  const datePart = new Date().toISOString().slice(0, 10);

  return {
    label,
    filename: `${safeClientName}-${safeLabel}-${datePart}.pdf`,
    content: pdfContent,
    contentType: "application/pdf"
  };
};

const preparePdfAttachments = async ({
  clientName,
  documents
}: {
  clientName: string;
  documents: TransferDocument[];
}) => {
  const attachments: EmailPdfAttachment[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];
  const typeCounters: Record<SessionDocumentType, number> = {
    offre: 0,
    tableau: 0,
    avis_imposition: 0,
    autre: 0
  };

  for (const doc of documents) {
    typeCounters[doc.docType] += 1;
    const docLabelBase = DOC_TYPE_LABELS[doc.docType];
    const docLabel =
      typeCounters[doc.docType] > 1 ? `${docLabelBase} #${typeCounters[doc.docType]}` : docLabelBase;
    try {
      const attachment = await buildPdfAttachment({
        url: doc.url,
        label: docLabel,
        clientName
      });
      if (attachment) {
        attachments.push(attachment);
      } else {
        skipped.push(docLabel);
      }
    } catch (err) {
      failed.push(docLabel);
      console.error("internal-email-attachment-build-failed", { label: docLabel, err });
    }
  }

  return { attachments, skipped, failed };
};

const sendInternalTransferEmail = async ({
  clientName,
  clientEmail,
  bank,
  mondayItemId,
  uploadedAt,
  documents
}: {
  clientName: string;
  clientEmail: string;
  bank: string;
  mondayItemId: string;
  uploadedAt: string;
  documents: TransferDocument[];
}) => {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.FROM_EMAIL);
  const to = normalizeEnv(process.env.INTERNAL_LEADS_EMAIL);
  if (!host || !user || !pass || !from || !to) return false;

  const port = parsePort(normalizeEnv(process.env.SMTP_PORT), 465);
  const secure = normalizeEnv(process.env.SMTP_SECURE) !== "false";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  const { attachments, skipped, failed } = await preparePdfAttachments({
    clientName,
    documents
  });

  const linksHtml =
    documents.length > 0
      ? `
          <ul style="margin:8px 0 0 18px;padding:0;">
            ${documents
              .map(
                (doc) =>
                  `<li style="margin:0 0 6px;"><strong>${DOC_TYPE_LABELS[doc.docType]}:</strong> <a href="${doc.url}">${escapeHtml(doc.name)}</a></li>`
              )
              .join("")}
          </ul>
        `
      : `<p style="margin:0 0 10px;">Aucun lien de document disponible.</p>`;

  const attachmentNotice =
    attachments.length > 0
      ? `<p style="margin:0 0 10px;"><strong>Pièces jointes PDF :</strong> ${attachments.length} document(s) joint(s).</p>`
      : `<p style="margin:0 0 10px;"><strong>Pièces jointes PDF :</strong> aucune pièce jointe générée.</p>`;
  const skippedNotice =
    skipped.length > 0
      ? `<p style="margin:0 0 10px;color:#9a6700;">Formats non convertis en PDF: ${skipped.join(", ")}.</p>`
      : "";
  const failedNotice =
    failed.length > 0
      ? `<p style="margin:0 0 10px;color:#b91c1c;">Échec de récupération de: ${failed.join(", ")}.</p>`
      : "";

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 12px;">Nouveau dépôt de documents</h2>
      <p style="margin:0 0 10px;"><strong>Client:</strong> ${clientName}</p>
      <p style="margin:0 0 10px;"><strong>Email:</strong> ${clientEmail || "non renseigné"}</p>
      <p style="margin:0 0 10px;"><strong>Banque:</strong> ${bank}</p>
      <p style="margin:0 0 10px;"><strong>Monday item ID:</strong> ${mondayItemId || "non renseigné"}</p>
      <p style="margin:0 0 10px;"><strong>Date dépôt:</strong> ${new Date(uploadedAt).toLocaleString("fr-FR")}</p>
      ${attachmentNotice}
      ${skippedNotice}
      ${failedNotice}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0;" />
      <p style="margin:0 0 6px;"><strong>Liens des documents:</strong></p>
      ${linksHtml}
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `📥 Documents reçus - ${clientName}`,
      html: htmlBody,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType
      }))
    });
    return true;
  } catch (batchErr) {
    console.error("internal-transfer-email-batch-failed", batchErr);
  }

  // Fallback: send summary first, then one attachment per email (helps with SMTP size limits).
  let sent = false;
  try {
    await transporter.sendMail({
      from,
      to,
      subject: `📥 Documents reçus (liens) - ${clientName}`,
      html: htmlBody
    });
    sent = true;
  } catch (summaryErr) {
    console.error("internal-transfer-email-summary-failed", summaryErr);
  }

  for (const attachment of attachments) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject: `📎 ${attachment.label} - ${clientName}`,
        text: `Document joint en PDF (${attachment.label})`,
        attachments: [
          {
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType
          }
        ]
      });
      sent = true;
    } catch (attachmentErr) {
      console.error("internal-transfer-email-single-attachment-failed", {
        filename: attachment.filename,
        attachmentErr
      });
    }
  }

  return sent;
};

const updateMondayItemStatus = async ({
  mondayItemId,
  bankLabel,
  uploadedAt,
  offreUrl,
  tableauUrl
}: {
  mondayItemId: string;
  bankLabel: string;
  uploadedAt: string;
  offreUrl: string;
  tableauUrl: string;
}) => {
  if (!normalizeEnv(process.env.MONDAY_API_TOKEN) || !mondayItemId) {
    return false;
  }

  const item = await getItemById(mondayItemId);
  if (!item) return false;

  const boardId = item.board.id;
  const boardColumns = await getBoardColumns(boardId);

  const mondayStatusColumnId =
    normalizeEnv(process.env.MONDAY_STATUS_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/^statut$/i])?.id;
  const mondayTargetStatus = normalizeEnv(process.env.MONDAY_TARGET_STATUS) ?? "Devis à réaliser";

  if (!mondayStatusColumnId) {
    return false;
  }

  const mondayBankColumnId =
    normalizeEnv(process.env.MONDAY_BANK_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/^banque$/i, /^assureur$/i])?.id;

  const offreReceivedColumnId =
    normalizeEnv(process.env.MONDAY_OFFRE_RECEIVED_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/offre re[cç]ue/i])?.id;
  const tableauReceivedColumnId =
    normalizeEnv(process.env.MONDAY_TABLEAU_RECEIVED_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/tableau re[cç]u/i])?.id;
  const depotDateColumnId =
    normalizeEnv(process.env.MONDAY_DATE_DEPOT_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/date de d[eé]p[oô]t/i])?.id;
  const offreLinkColumnId =
    normalizeEnv(process.env.MONDAY_OFFRE_LINK_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/lien offre/i])?.id;
  const tableauLinkColumnId =
    normalizeEnv(process.env.MONDAY_TABLEAU_LINK_COLUMN_ID) ??
    pickColumnByTitle(boardColumns, [/lien tableau/i])?.id;
  const columnValues: Record<string, unknown> = {
    [mondayStatusColumnId]: mondayTargetStatus
  };
  if (mondayBankColumnId) {
    columnValues[mondayBankColumnId] = bankLabel;
  }
  if (offreReceivedColumnId) {
    columnValues[offreReceivedColumnId] = { checked: "true" };
  }
  if (tableauReceivedColumnId) {
    columnValues[tableauReceivedColumnId] = { checked: "true" };
  }
  if (depotDateColumnId) {
    columnValues[depotDateColumnId] = { date: uploadedAt.slice(0, 10) };
  }
  if (offreLinkColumnId) {
    columnValues[offreLinkColumnId] = { url: offreUrl, text: "Offre de prêt" };
  }
  if (tableauLinkColumnId) {
    columnValues[tableauLinkColumnId] = { url: tableauUrl, text: "Tableau d'amortissement" };
  }
  await updateItemMultipleColumns({
    boardId,
    itemId: mondayItemId,
    columnValues
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

    const body = (await req.json()) as TransferPayload;
    const tokenFromBody = body.token?.trim() ?? "";
    const tokenAuth = resolvePortalTokenFromRequest({ req, legacyToken: tokenFromBody });
    const token = tokenAuth.token || tokenFromBody;
    const selectedBank = body.bank?.trim();

    if (!token) {
      return NextResponse.json({ error: "Session non authentifiée" }, { status: 401 });
    }

    const { data: session, error } = await supabaseAdmin.from("sessions").select("*").eq("token", token).single();

    if (error || !session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }
    if (!isSessionOwnedByEmail({ sessionEmail: session.client_email, expectedEmail: tokenAuth.email })) {
      return NextResponse.json({ error: "Session non autorisée" }, { status: 403 });
    }

    if (new Date(session.token_expires_at) < new Date()) {
      await extendSessionTokenExpiryById(session.id);
    }

    if (session.status === "transferred") {
      return NextResponse.json({
        success: true,
        already_transferred: true,
        transferred_at: session.uploaded_at ?? null,
        make_webhook_sent: false,
        internal_email_sent: true,
        monday_update_sent: false
      });
    }

    const transferDocuments = await resolveTransferDocuments({
      sessionId: session.id,
      legacyOffreUrl: String(session.offre_url ?? ""),
      legacyTableauUrl: String(session.tableau_url ?? "")
    });
    if (transferDocuments.offre.length === 0 || transferDocuments.tableau.length === 0) {
      return NextResponse.json(
        { error: "Documents obligatoires manquants (offre de prêt + tableau d'amortissement)" },
        { status: 422 }
      );
    }
    const latestOffreUrl = transferDocuments.offre[0]?.url ?? "";
    const latestTableauUrl = transferDocuments.tableau[0]?.url ?? "";

    const uploadedAt = new Date().toISOString();
    const bank = selectedBank || session.bank || "";

    let internalEmailSent = false;
    try {
      internalEmailSent = await sendInternalTransferEmail({
        clientName: session.client_name || "Client",
        clientEmail: session.client_email || "",
        bank: getBankLabel(bank),
        mondayItemId: session.monday_item_id || "",
        uploadedAt,
        documents: transferDocuments.all
      });
    } catch (mailError) {
      console.error("internal-transfer-email-failed", mailError);
    }

    if (!internalEmailSent) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification interne échouée. Réessayez dans quelques secondes."
        },
        { status: 502 }
      );
    }

    const { error: sessionUpdateError } = await supabaseAdmin
      .from("sessions")
      .update({
        status: "transferred",
        bank,
        uploaded_at: uploadedAt,
        offre_url: latestOffreUrl || session.offre_url,
        tableau_url: latestTableauUrl || session.tableau_url
      })
      .eq("id", session.id);
    if (sessionUpdateError) {
      console.error("transfer-session-update-failed", {
        session_id: session.id,
        sessionUpdateError
      });
      return NextResponse.json({ success: false, error: "Mise à jour session impossible" }, { status: 500 });
    }

    let makeWebhookSent = false;
    const makeWebhookUrl = normalizeEnv(process.env.MAKE_TRANSFER_WEBHOOK_URL);
    if (makeWebhookUrl && !makeWebhookUrl.includes("AREMPLACER")) {
      try {
        const makeResponse = await fetch(makeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monday_item_id: session.monday_item_id,
            client_name: session.client_name,
            client_email: session.client_email,
            bank,
            bank_label: getBankLabel(bank),
            offre_received: true,
            tableau_received: true,
            offre_url: latestOffreUrl,
            tableau_url: latestTableauUrl,
            uploaded_at: uploadedAt,
            new_status: "Devis à réaliser"
          })
        });

        if (makeResponse.ok) {
          makeWebhookSent = true;
        } else {
          const errorBody = await makeResponse.text().catch(() => "");
          console.error("make-webhook-http-error", {
            status: makeResponse.status,
            body: errorBody
          });
        }
      } catch (makeErr) {
        console.error("make-webhook-failed", makeErr);
      }
    }

    let mondayUpdateSent = false;
    try {
      mondayUpdateSent = await updateMondayItemStatus({
        mondayItemId: session.monday_item_id || "",
        bankLabel: getBankLabel(bank),
        uploadedAt,
        offreUrl: latestOffreUrl,
        tableauUrl: latestTableauUrl
      });
    } catch (mondayError) {
      console.error("monday-update-failed", mondayError);
    }

    return NextResponse.json({
      success: true,
      transferred_at: uploadedAt,
      make_webhook_sent: makeWebhookSent,
      internal_email_sent: internalEmailSent,
      monday_update_sent: mondayUpdateSent
    });
  } catch (err) {
    console.error("transfer-route-failed", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
