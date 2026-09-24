import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { LEGAL } from "@/content/site";
import {
  PER_SESSION_BANK_MARKER,
  createOrReuseDepotSession
} from "@/lib/depotSession";
import { scheduleSessionReminders } from "@/lib/depotReminderStore";
import {
  buildMailEnvelopeForRecipient,
  hasMailDeliveryRejection,
  notifyMailFailureAlert
} from "@/lib/mailFailureAlert";
import {
  extractEmailFromColumn,
  findItemColumnValue,
  getBoardColumns,
  getBoardGroups,
  getItemById,
  moveItemToGroup,
  normalizeEnv,
  normalizeText,
  pickColumnByTitle,
  updateItemMultipleColumns
} from "@/lib/monday";
import {
  isPerDossierBoard,
  PER_AVIS_IMPOSITION_LABEL,
  PER_DOSSIER_ACCESS_PATH,
  PER_DOSSIER_BOARD_NAME
} from "@/lib/perDossier";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MondayEventPayload = {
  challenge?: string;
  event?: {
    pulseId?: number | string;
    itemId?: number | string;
    boardId?: number | string;
    columnId?: string;
  };
};

const readSecret = (req: NextRequest) => new URL(req.url).searchParams.get("secret")?.trim();

const isAuthorized = (req: NextRequest) => {
  const expectedSecret =
    normalizeEnv(process.env.MONDAY_PER_INCOMING_WEBHOOK_SECRET) ??
    normalizeEnv(process.env.MONDAY_INCOMING_WEBHOOK_SECRET) ??
    normalizeEnv(process.env.WEBHOOK_SECRET);
  if (!expectedSecret) return true;
  return readSecret(req) === expectedSecret;
};

const resolveColumnId = ({
  boardColumns,
  configuredIds,
  patterns,
  type
}: {
  boardColumns: Awaited<ReturnType<typeof getBoardColumns>>;
  configuredIds: Array<string | undefined>;
  patterns?: RegExp[];
  type?: string;
}) => {
  for (const configuredId of configuredIds) {
    const normalizedId = normalizeEnv(configuredId);
    if (normalizedId && boardColumns.some((column) => column.id === normalizedId)) {
      return normalizedId;
    }
  }

  if (type) {
    const typedColumn = boardColumns.find((column) => column.type === type);
    if (typedColumn) return typedColumn.id;
  }

  return patterns ? pickColumnByTitle(boardColumns, patterns)?.id ?? "" : "";
};

const isTriggerStatus = (statusText: string) => {
  const trigger =
    normalizeEnv(process.env.MONDAY_PER_TRIGGER_STATUS) ??
    normalizeEnv(process.env.MONDAY_TRIGGER_STATUS) ??
    "Attente documents";
  const normalizeStatusLabel = (value: string) =>
    normalizeText(value)
      .replaceAll(/[^a-z0-9]+/g, " ")
      .replaceAll(/\bde\b/g, " ")
      .replaceAll(/\s+/g, " ")
      .trim();

  const normalizedStatus = normalizeStatusLabel(statusText);
  const normalizedTrigger = normalizeStatusLabel(trigger);
  if (normalizedStatus === normalizedTrigger) return true;

  const isWaitingDocsStatus = (value: string) =>
    value.includes("attente document") || value.includes("attente documents") || value.includes("attente doc");

  return isWaitingDocsStatus(normalizedStatus) && isWaitingDocsStatus(normalizedTrigger);
};

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const hasDateValue = (value: { text: string | null; value: string | null } | null) => {
  if (!value) return false;
  if (value.text?.trim()) return true;
  if (!value.value) return false;
  try {
    const parsed = JSON.parse(value.value) as { date?: string };
    return Boolean(parsed.date?.trim());
  } catch {
    return false;
  }
};

const getSiteBaseUrl = () => (normalizeEnv(process.env.NEXT_PUBLIC_BASE_URL) ?? "https://gp-finances.fr").replace(/\/+$/, "");

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const resolvePerWaitingDocsGroupId = async (boardId: string) => {
  const configuredGroupId = normalizeEnv(process.env.MONDAY_PER_WAITING_DOCS_GROUP_ID);
  if (configuredGroupId) return configuredGroupId;

  const targetTitle = normalizeEnv(process.env.MONDAY_PER_WAITING_DOCS_GROUP_TITLE) ?? "Attente documents";
  const groups = await getBoardGroups(boardId);
  const targetGroup = groups.find((group) => normalizeText(group.title) === normalizeText(targetTitle));
  return targetGroup?.id ?? "";
};

const isInQualifiedDataGroup = (itemGroup: { id: string; title: string } | null | undefined) => {
  if (!itemGroup) return false;

  const configuredGroupId = normalizeEnv(process.env.MONDAY_PER_QUALIFIED_GROUP_ID);
  if (configuredGroupId && itemGroup.id === configuredGroupId) return true;

  const sourceTitle = normalizeEnv(process.env.MONDAY_PER_QUALIFIED_GROUP_TITLE) ?? "Data Qualifié";
  const currentTitle = normalizeText(itemGroup.title);
  return currentTitle === normalizeText(sourceTitle) || currentTitle.startsWith("data qualifie");
};

const moveItemToWaitingDocsGroupIfNeeded = async ({
  itemId,
  boardId,
  currentGroup
}: {
  itemId: string;
  boardId: string;
  currentGroup: { id: string; title: string } | null;
}) => {
  const waitingDocsGroupId = await resolvePerWaitingDocsGroupId(boardId);
  if (!waitingDocsGroupId) {
    return { attempted: false, moved: false, reason: "waiting_docs_group_missing" };
  }

  if (currentGroup?.id === waitingDocsGroupId) {
    return { attempted: false, moved: false, reason: "already_in_waiting_docs_group" };
  }

  if (!isInQualifiedDataGroup(currentGroup)) {
    return { attempted: false, moved: false, reason: "not_in_data_qualifie_group" };
  }

  await moveItemToGroup({
    itemId,
    groupId: waitingDocsGroupId
  });

  return { attempted: true, moved: true, reason: "" };
};

const sendClientPerDossierEmail = async ({
  clientName,
  clientEmail,
  link,
  expiresAt
}: {
  clientName: string;
  clientEmail: string;
  link: string;
  expiresAt: string;
}) => {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.FROM_EMAIL);
  if (!host || !user || !pass || !from) return false;

  const transporter = nodemailer.createTransport({
    host,
    port: parsePort(normalizeEnv(process.env.SMTP_PORT), 465),
    secure: normalizeEnv(process.env.SMTP_SECURE) !== "false",
    auth: { user, pass }
  });

  const formattedExpiry = new Date(expiresAt).toLocaleDateString("fr-FR");
  const suggestedDeadline = addDays(new Date(), 7).toLocaleDateString("fr-FR");
  const siteBaseUrl = getSiteBaseUrl();
  const subject = "GP Finances - Deposez votre avis d'imposition";

  try {
    const info = await transporter.sendMail({
      from,
      to: clientEmail,
      envelope: buildMailEnvelopeForRecipient(clientEmail),
      subject,
      html: `
      <div style="margin:0;padding:28px;background:#eef3fb;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:660px;margin:0 auto;background:#ffffff;border:1px solid #d9e2f2;border-radius:18px;overflow:hidden;">
          <div style="padding:20px 24px;background:linear-gradient(135deg,#1A3C5C,#C8A86B);color:#ffffff;">
            <h1 style="margin:0;font-size:22px;line-height:1.2;">Espace sécurisé PER GP Finances</h1>
            <p style="margin:8px 0 0;font-size:14px;opacity:.94;">Bonjour ${clientName || "Client"}, votre lien de dépôt pour votre dossier Plan Épargne Retraite est prêt.</p>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;font-size:15px;">
              Pour préparer votre étude PER et vérifier votre optimisation fiscale, déposez le document ci-dessous via votre espace sécurisé.
            </p>
            <div style="margin:20px 0 20px;text-align:center;">
              <a href="${link}" style="display:block;width:100%;max-width:360px;box-sizing:border-box;margin:0 auto;background:#1A3C5C;color:#ffffff;text-decoration:none;padding:16px 18px;border-radius:12px;font-weight:800;font-size:16px;text-align:center;box-shadow:0 8px 20px rgba(26,60,92,.25);">
                Accéder à mon espace PER
              </a>
            </div>
            <div style="border:1px solid #cfe7d4;background:#f6fff8;border-radius:12px;padding:14px;margin:0 0 14px;">
              <p style="margin:0 0 10px;font-size:13px;color:#166534;font-weight:700;">Progression de votre dossier PER</p>
              <div style="height:6px;border-radius:999px;background:#dbe5ea;overflow:hidden;margin:0 0 12px;">
                <div style="height:6px;width:54%;background:#16a34a;"></div>
              </div>
              <p style="margin:0;font-size:12px;color:#166534;">Étape en cours : réception de votre avis d'imposition puis analyse fiscale personnalisée.</p>
            </div>
            <div style="border:1px solid #d9e2f2;background:#f8fbff;border-radius:12px;padding:14px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:700;">Document demandé :</p>
              <ul style="margin:0 0 8px 18px;padding:0;font-size:14px;line-height:1.55;">
                <li><strong>${PER_AVIS_IMPOSITION_LABEL}</strong></li>
              </ul>
              <p style="margin:0;font-size:12px;color:#475569;">
                Ce document permet de confirmer le revenu net imposable, l'impôt payé et la tranche marginale d'imposition.
              </p>
            </div>
            <div style="margin:14px 0 0;border:1px solid #dbe7ff;border-radius:12px;background:#f5f9ff;padding:12px;">
              <p style="margin:0 0 8px;font-size:13px;color:#274168;font-weight:700;">Pourquoi nous le demandons</p>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:#334155;line-height:1.55;">
                <li>Calculer l'intérêt fiscal réel d'un versement PER.</li>
                <li>Éviter une recommandation inadaptée à votre tranche d'imposition.</li>
                <li>Préparer un montant de versement cohérent avec votre objectif.</li>
              </ul>
            </div>
            <p style="margin:16px 0 0;font-size:12px;color:#475569;line-height:1.45;">
              Pour un traitement prioritaire, nous vous recommandons de déposer votre document avant le ${suggestedDeadline}.<br />
              Lien personnel disponible jusqu'au ${formattedExpiry}.
            </p>
            <p style="margin:8px 0 0;font-size:12px;color:#475569;">
              Besoin d'aide ? Répondez simplement à cet email.
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#64748b;">
              ${LEGAL.company} • ${LEGAL.status} • ORIAS ${LEGAL.orias} • ${LEGAL.rcs} • ${siteBaseUrl}
            </p>
          </div>
        </div>
      </div>
    `
    });

    if (hasMailDeliveryRejection(info)) {
      throw new Error(`smtp_recipient_rejected:${Array.isArray(info.rejected) ? info.rejected.join(",") : "unknown"}`);
    }
  } catch (error) {
    await notifyMailFailureAlert({
      context: "per_monday_webhook_client_link",
      recipient: clientEmail,
      subject,
      error
    });
    throw error;
  }

  return true;
};

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = (await req.json()) as MondayEventPayload;
    if (body.challenge) {
      return NextResponse.json({ challenge: body.challenge });
    }

    const event = body.event ?? {};
    const mondayItemId = String(event.pulseId ?? event.itemId ?? "").trim();
    if (!mondayItemId) {
      return NextResponse.json({ ok: true, skipped: "missing_item" });
    }

    const item = await getItemById(mondayItemId);
    if (!item) {
      return NextResponse.json({ ok: true, skipped: "item_not_found" });
    }

    if (!isPerDossierBoard(item.board)) {
      return NextResponse.json({
        ok: true,
        skipped: "board_not_targeted",
        expected_board: normalizeEnv(process.env.MONDAY_PER_BOARD_NAME) ?? PER_DOSSIER_BOARD_NAME
      });
    }

    const boardColumns = await getBoardColumns(item.board.id);
    const statusColumnId = resolveColumnId({
      boardColumns,
      configuredIds: [process.env.MONDAY_PER_STATUS_COLUMN_ID, process.env.MONDAY_STATUS_COLUMN_ID],
      patterns: [/^statut$/i, /^status$/i, /^etat$/i, /status dossier/i]
    });

    if (!statusColumnId) {
      return NextResponse.json({ ok: true, skipped: "status_column_missing" });
    }

    const eventColumnId = event.columnId?.trim();
    if (eventColumnId && eventColumnId !== statusColumnId) {
      return NextResponse.json({ ok: true, skipped: "not_status_change" });
    }

    const statusColumn = findItemColumnValue(item.column_values, statusColumnId);
    const statusText = statusColumn?.text?.trim() ?? "";
    if (!isTriggerStatus(statusText)) {
      return NextResponse.json({ ok: true, skipped: "status_not_target" });
    }

    let groupMoveResult: { attempted: boolean; moved: boolean; reason: string } = {
      attempted: false,
      moved: false,
      reason: ""
    };
    try {
      groupMoveResult = await moveItemToWaitingDocsGroupIfNeeded({
        itemId: mondayItemId,
        boardId: item.board.id,
        currentGroup: item.group
      });
    } catch (groupMoveErr) {
      console.error("per-monday-group-move-failed", {
        item_id: mondayItemId,
        current_group: item.group,
        groupMoveErr
      });
      groupMoveResult = {
        attempted: true,
        moved: false,
        reason: "group_move_failed"
      };
    }

    const emailColumnId = resolveColumnId({
      boardColumns,
      configuredIds: [process.env.MONDAY_PER_EMAIL_COLUMN_ID, process.env.MONDAY_EMAIL_COLUMN_ID],
      type: "email"
    });
    const email = extractEmailFromColumn(findItemColumnValue(item.column_values, emailColumnId));
    if (!email) {
      return NextResponse.json({ ok: true, skipped: "email_missing" });
    }

    const linkColumnId = resolveColumnId({
      boardColumns,
      configuredIds: [process.env.MONDAY_PER_LINK_COLUMN_ID, process.env.MONDAY_LINK_COLUMN_ID],
      patterns: [/lien.*per/i, /lien depot/i, /lien de depot/i, /lien dep[oô]t/i, /lien espace client/i],
      type: "link"
    });
    if (!linkColumnId) {
      return NextResponse.json({ ok: true, skipped: "link_column_missing" });
    }

    let existingLinkUrl = "";
    const existingLinkValue = findItemColumnValue(item.column_values, linkColumnId)?.value;
    if (existingLinkValue) {
      try {
        const parsed = JSON.parse(existingLinkValue) as { url?: string };
        existingLinkUrl = parsed.url?.trim() ?? "";
      } catch {
        // Ignore malformed value, we'll overwrite.
      }
    }

    const session = await createOrReuseDepotSession({
      mondayItemId,
      clientName: item.name || "Client",
      clientEmail: email,
      bank: PER_SESSION_BANK_MARKER,
      requestUrl: req.url,
      accessPath: PER_DOSSIER_ACCESS_PATH
    });

    const waitingDocsDateColumnId = resolveColumnId({
      boardColumns,
      configuredIds: [
        process.env.MONDAY_PER_WAITING_DOCS_DATE_COLUMN_ID,
        process.env.MONDAY_WAITING_DOCS_DATE_COLUMN_ID
      ],
      patterns: [/date.*attente.*docs/i, /entree.*attente.*docs/i, /attente.*documents.*date/i],
      type: "date"
    });

    const columnValuesToUpdate: Record<string, unknown> = {};
    if (existingLinkUrl !== session.link) {
      columnValuesToUpdate[linkColumnId] = {
        url: session.link,
        text: "Lien espace PER"
      };
    }

    const waitingDateColumn = findItemColumnValue(item.column_values, waitingDocsDateColumnId);
    const waitingDateAlreadySet = hasDateValue(waitingDateColumn);
    const shouldSetWaitingDate = Boolean(waitingDocsDateColumnId && !waitingDateAlreadySet);
    if (shouldSetWaitingDate && waitingDocsDateColumnId) {
      columnValuesToUpdate[waitingDocsDateColumnId] = { date: new Date().toISOString().slice(0, 10) };
    }

    if (Object.keys(columnValuesToUpdate).length > 0) {
      await updateItemMultipleColumns({
        boardId: item.board.id,
        itemId: mondayItemId,
        columnValues: columnValuesToUpdate
      });
    }

    const shouldSendClientEmail =
      !eventColumnId || eventColumnId === statusColumnId || existingLinkUrl !== session.link || shouldSetWaitingDate || groupMoveResult.moved;
    let clientEmailSent = false;
    let clientEmailError = "";
    if (shouldSendClientEmail) {
      try {
        clientEmailSent = await sendClientPerDossierEmail({
          clientName: item.name || "Client",
          clientEmail: email,
          link: session.link,
          expiresAt: session.expiresAt
        });
      } catch (mailErr) {
        clientEmailError = mailErr instanceof Error ? mailErr.message.slice(0, 500) : "unknown_mail_error";
        console.error("per-monday-client-email-failed", mailErr);
      }
    }

    let remindersScheduled = false;
    if (clientEmailSent) {
      try {
        remindersScheduled = await scheduleSessionReminders({
          sessionId: session.sessionId,
          mondayItemId,
          baseDate: new Date()
        });
      } catch (scheduleErr) {
        console.error("per-monday-reminders-schedule-failed", scheduleErr);
      }
    }

    return NextResponse.json({
      ok: true,
      board_id: item.board.id,
      item_id: mondayItemId,
      generated_link: session.link,
      client_email_should_send: shouldSendClientEmail,
      client_email_sent: clientEmailSent,
      client_email_error: clientEmailError,
      group_move_attempted: groupMoveResult.attempted,
      group_moved_to_waiting_docs: groupMoveResult.moved,
      group_move_reason: groupMoveResult.reason,
      reminders_scheduled: remindersScheduled
    });
  } catch (err) {
    console.error("per-monday-native-webhook-failed", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
