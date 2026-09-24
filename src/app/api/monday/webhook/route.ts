import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { LEGAL } from "@/content/site";
import { createOrReuseDepotSession } from "@/lib/depotSession";
import { scheduleSessionReminders } from "@/lib/depotReminderStore";
import { getBankLabel } from "@/lib/depot";
import {
  buildMailEnvelopeForRecipient,
  hasMailDeliveryRejection,
  notifyMailFailureAlert
} from "@/lib/mailFailureAlert";
import { getSimulationFromMonday } from "@/lib/mondaySimulation";
import { getSavingsCounter } from "@/lib/savingsCounterStore";
import {
  extractEmailFromColumn,
  findItemColumnValue,
  getBoardColumns,
  getItemById,
  normalizeEnv,
  normalizeText,
  pickColumnByTitle,
  updateItemMultipleColumns
} from "@/lib/monday";
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
const SIMULATION_SENT_STATUS =
  normalizeEnv(process.env.MONDAY_SIMULATION_SENT_STATUS) ?? "Devis envoyé - en attente de décision";

const isAuthorized = (req: NextRequest) => {
  const expectedSecret = normalizeEnv(process.env.MONDAY_INCOMING_WEBHOOK_SECRET);
  if (!expectedSecret) return true;
  return readSecret(req) === expectedSecret;
};

const isTriggerStatus = (statusText: string) => {
  const trigger = normalizeEnv(process.env.MONDAY_TRIGGER_STATUS) ?? "Attente documents";
  const normalizeStatusLabel = (value: string) =>
    normalizeText(value)
      .replaceAll(/[^a-z0-9]+/g, " ")
      .replaceAll(/\bde\b/g, " ")
      .replaceAll(/\s+/g, " ")
      .trim();

  const normalizedStatus = normalizeStatusLabel(statusText);
  const normalizedTrigger = normalizeStatusLabel(trigger);

  if (normalizedStatus === normalizedTrigger) return true;

  // Tolérance métier: "attente document", "attente documents", "en attente document(s)".
  const isWaitingDocsStatus = (value: string) =>
    value.includes("attente document") || value.includes("attente documents") || value.includes("attente doc");

  return isWaitingDocsStatus(normalizedStatus) && isWaitingDocsStatus(normalizedTrigger);
};

const parseBankValue = ({
  bankColumnId,
  itemValues
}: {
  bankColumnId: string | undefined;
  itemValues: Array<{ id: string; text: string | null }>;
}) => {
  if (!bankColumnId) return "";
  const bankValue = itemValues.find((value) => value.id === bankColumnId)?.text ?? "";
  return bankValue.trim();
};

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const formatFrNumber = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

const getSiteBaseUrl = () => (normalizeEnv(process.env.NEXT_PUBLIC_BASE_URL) ?? "https://gp-finances.fr").replace(/\/+$/, "");

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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

const sendClientDepotEmail = async ({
  clientName,
  clientEmail,
  bank,
  link,
  expiresAt
}: {
  clientName: string;
  clientEmail: string;
  bank: string;
  link: string;
  expiresAt: string;
}) => {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.FROM_EMAIL);
  if (!host || !user || !pass || !from) return false;

  const port = parsePort(normalizeEnv(process.env.SMTP_PORT), 465);
  const secure = normalizeEnv(process.env.SMTP_SECURE) !== "false";
  const bankLabel = getBankLabel(bank);
  const formattedExpiry = new Date(expiresAt).toLocaleDateString("fr-FR");
  const siteBaseUrl = getSiteBaseUrl();
  const suggestedDeadline = addDays(new Date(), 7).toLocaleDateString("fr-FR");
  const videos = [
    { href: `${siteBaseUrl}#avis-video`, poster: `${siteBaseUrl}/videos/posters/Tem1-poster-v3.png`, amount: "21 200 €" },
    { href: `${siteBaseUrl}#avis-video`, poster: `${siteBaseUrl}/videos/posters/Tem2-poster.png`, amount: "17 000 €" },
    { href: `${siteBaseUrl}#avis-video`, poster: `${siteBaseUrl}/videos/posters/Tem3-poster.png`, amount: "8 000 €" }
  ];

  let savingsValue: number | null = null;
  try {
    const counter = await getSavingsCounter();
    savingsValue = counter.value;
  } catch (counterErr) {
    console.error("savings-counter-read-for-email-failed", counterErr);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  const subject = "GP Finances - Deposez vos documents";
  try {
    const info = await transporter.sendMail({
      from,
      to: clientEmail,
      envelope: buildMailEnvelopeForRecipient(clientEmail),
      subject,
      html: `
      <div style="margin:0;padding:28px;background:#eef3fb;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:660px;margin:0 auto;background:#ffffff;border:1px solid #d9e2f2;border-radius:18px;overflow:hidden;">
          <div style="padding:20px 24px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#ffffff;">
            <h1 style="margin:0;font-size:22px;line-height:1.2;">Dépôt sécurisé GP Finances</h1>
            <p style="margin:8px 0 0;font-size:14px;opacity:.92;">Bonjour ${clientName || "Client"}, votre lien de dépôt pour votre assurance emprunteur est prêt.</p>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;font-size:15px;">
              Pour accélérer l'étude de votre dossier d'assurance de prêt immobilier, déposez vos documents via le lien ci-dessous.
            </p>
            <div style="margin:20px 0 20px;text-align:center;">
              <a href="${link}" style="display:block;width:100%;max-width:340px;box-sizing:border-box;margin:0 auto;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:16px 18px;border-radius:12px;font-weight:800;font-size:16px;letter-spacing:.1px;text-align:center;box-shadow:0 8px 20px rgba(29,78,216,.25);">
                Accéder au dépôt de documents
              </a>
            </div>
            <div style="border:1px solid #cfe7d4;background:#f6fff8;border-radius:12px;padding:14px;margin:0 0 14px;">
              <p style="margin:0 0 10px;font-size:13px;color:#166534;font-weight:700;">Progression de votre dossier (5 étapes)</p>
              <div style="height:6px;border-radius:999px;background:#dbe5ea;overflow:hidden;margin:0 0 12px;">
                <div style="height:6px;width:46%;background:#16a34a;"></div>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:0 3px 4px;">
                    <div style="width:24px;height:24px;line-height:24px;border-radius:999px;background:#16a34a;color:#fff;font-size:12px;font-weight:700;">✓</div>
                  </td>
                  <td align="center" style="padding:0 3px 4px;">
                    <div style="width:24px;height:24px;line-height:24px;border-radius:999px;background:#16a34a;color:#fff;font-size:12px;font-weight:700;">✓</div>
                  </td>
                  <td align="center" style="padding:0 3px 4px;">
                    <div style="width:24px;height:24px;line-height:24px;border-radius:999px;border:2px solid #16a34a;background:#dcfce7;color:#166534;font-size:12px;font-weight:700;">3</div>
                  </td>
                  <td align="center" style="padding:0 3px 4px;">
                    <div style="width:24px;height:24px;line-height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;">4</div>
                  </td>
                  <td align="center" style="padding:0 3px 4px;">
                    <div style="width:24px;height:24px;line-height:24px;border-radius:999px;border:1px solid #cbd5e1;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;">5</div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 3px;font-size:10px;color:#166534;line-height:1.35;">Appel<br/>validé</td>
                  <td align="center" style="padding:0 3px;font-size:10px;color:#166534;line-height:1.35;">Mail<br/>envoyé</td>
                  <td align="center" style="padding:0 3px;font-size:10px;color:#166534;line-height:1.35;">Attente<br/>docs</td>
                  <td align="center" style="padding:0 3px;font-size:10px;color:#64748b;line-height:1.35;">Envoi<br/>docs</td>
                  <td align="center" style="padding:0 3px;font-size:10px;color:#64748b;line-height:1.35;">Analyse<br/>étude</td>
                </tr>
              </table>
              <p style="margin:10px 0 0;font-size:11px;color:#166534;">Vous êtes à l'étape 3: nous attendons vos documents pour lancer l'analyse.</p>
            </div>
            <div style="border:1px solid #d9e2f2;background:#f8fbff;border-radius:12px;padding:14px 14px 8px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:700;">Documents à transmettre pour l'analyse de votre assurance emprunteur :</p>
              <ul style="margin:0 0 8px 18px;padding:0;font-size:14px;line-height:1.55;">
                <li>Offre de prêt (obligatoire)</li>
                <li>Tableau d'amortissement (obligatoire)</li>
              </ul>
            </div>

            <div style="margin:14px 0 0;border:1px solid #dbe7ff;border-radius:12px;background:#f5f9ff;padding:12px;">
              <p style="margin:0 0 8px;font-size:13px;color:#274168;font-weight:700;">Loi Lemoine - en bref</p>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:#334155;line-height:1.55;">
                <li>Vous pouvez changer d'assurance emprunteur à tout moment.</li>
                <li>Vous n'avez pas besoin de changer de banque.</li>
                <li>Votre banque doit accepter si les garanties sont équivalentes.</li>
              </ul>
            </div>

            <div style="margin:14px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:0 0 10px;">
                    <a href="${siteBaseUrl}#compteur-economies" style="display:block;text-decoration:none;border:1px solid #dce8ff;background:#ffffff;border-radius:12px;padding:12px;">
                      <div style="font-size:12px;font-weight:700;color:#294f97;margin:0 0 4px;">Compteur d'économies en direct</div>
                      <div style="font-size:14px;color:#0f172a;font-weight:700;">
                        ${savingsValue !== null ? `${formatFrNumber(savingsValue)} € déjà économisés pour nos clients` : "Voir le compteur en direct sur notre site"}
                      </div>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 10px;">
                    <a href="${siteBaseUrl}#process-gp" style="display:block;text-decoration:none;border:1px solid #dce8ff;background:#ffffff;border-radius:12px;padding:12px;">
                      <div style="font-size:12px;font-weight:700;color:#294f97;margin:0 0 4px;">Fonctionnement et avantages</div>
                      <div style="font-size:13px;color:#334155;">Découvrez notre méthode complète et les bénéfices concrets pour votre dossier.</div>
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${siteBaseUrl}#avis-video" style="display:block;text-decoration:none;border:1px solid #dce8ff;background:#ffffff;border-radius:12px;padding:12px;">
                      <div style="font-size:12px;font-weight:700;color:#294f97;margin:0 0 4px;">Avis clients vidéo</div>
                      <div style="font-size:13px;color:#334155;">Regardez les témoignages de clients déjà accompagnés par GP Finances.</div>
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <div style="margin:14px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  ${videos
                    .map(
                      (video) => `
                        <td style="width:33.33%;padding-right:6px;vertical-align:top;">
                          <a href="${video.href}" style="text-decoration:none;display:block;border:1px solid #dce8ff;border-radius:8px;overflow:hidden;background:#fff;">
                            <img src="${video.poster}" alt="Avis client vidéo GP Finances" style="display:block;width:100%;height:auto;" />
                            <div style="padding:6px 8px;font-size:11px;color:#334155;">Économie ${video.amount}</div>
                          </a>
                        </td>
                      `
                    )
                    .join("")}
                </tr>
              </table>
            </div>

            <p style="margin:16px 0 0;font-size:12px;color:#475569;line-height:1.45;">
              Pour un traitement prioritaire, nous vous recommandons de déposer vos documents avant le ${suggestedDeadline}.<br />
              Lien personnel disponible jusqu'au ${formattedExpiry}.
            </p>
            <p style="margin:8px 0 0;font-size:12px;color:#475569;">
              Besoin d'aide pour retrouver vos documents ? Répondez à cet email, je vous accompagne.
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#64748b;">
              ${LEGAL.company} • ${LEGAL.status} • ORIAS ${LEGAL.orias} • ${LEGAL.rcs}
            </p>
          </div>
        </div>
      </div>
    `
    });

    if (hasMailDeliveryRejection(info)) {
      const rejectionError = new Error(
        `smtp_recipient_rejected:${Array.isArray(info.rejected) ? info.rejected.join(",") : "unknown"}`
      );
      throw rejectionError;
    }
  } catch (error) {
    await notifyMailFailureAlert({
      context: "monday_webhook_client_link",
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

    const configuredBoardId = normalizeEnv(process.env.MONDAY_BOARD_ID);
    if (configuredBoardId && item.board.id !== configuredBoardId) {
      return NextResponse.json({ ok: true, skipped: "board_not_targeted" });
    }

    const boardColumns = await getBoardColumns(item.board.id);

    const statusColumnId =
      normalizeEnv(process.env.MONDAY_STATUS_COLUMN_ID) ??
      pickColumnByTitle(boardColumns, [/^statut$/i, /^status$/i, /^etat$/i, /status dossier/i])?.id;

    if (!statusColumnId) {
      return NextResponse.json({ ok: true, skipped: "status_column_missing" });
    }

    const eventColumnId = event.columnId?.trim();
    const simulationColumnId =
      normalizeEnv(process.env.MONDAY_SIMULATION_COLUMN_ID) ??
      pickColumnByTitle(boardColumns, [/simulation/i, /proposition/i, /devis/i])?.id ??
      "";

    if (eventColumnId && simulationColumnId && eventColumnId === simulationColumnId) {
      const simulation = await getSimulationFromMonday(mondayItemId);
      if (!simulation?.url) {
        return NextResponse.json({ ok: true, skipped: "simulation_empty" });
      }

      const statusColumn = findItemColumnValue(item.column_values, statusColumnId);
      const currentStatus = statusColumn?.text?.trim().toLowerCase() ?? "";
      if (currentStatus !== SIMULATION_SENT_STATUS.toLowerCase()) {
        await updateItemMultipleColumns({
          boardId: item.board.id,
          itemId: mondayItemId,
          columnValues: {
            [statusColumnId]: SIMULATION_SENT_STATUS
          }
        });
      }

      return NextResponse.json({
        ok: true,
        board_id: item.board.id,
        item_id: mondayItemId,
        simulation_detected: true
      });
    }

    if (eventColumnId && eventColumnId !== statusColumnId) {
      return NextResponse.json({ ok: true, skipped: "not_status_change" });
    }

    const statusColumn = findItemColumnValue(item.column_values, statusColumnId);
    const statusText = statusColumn?.text?.trim() ?? "";
    if (!isTriggerStatus(statusText)) {
      return NextResponse.json({ ok: true, skipped: "status_not_target" });
    }

    const emailColumnId =
      normalizeEnv(process.env.MONDAY_EMAIL_COLUMN_ID) ??
      boardColumns.find((column) => column.type === "email")?.id;
    const email = extractEmailFromColumn(findItemColumnValue(item.column_values, emailColumnId));
    if (!email) {
      return NextResponse.json({ ok: true, skipped: "email_missing" });
    }

    const linkColumnId =
      normalizeEnv(process.env.MONDAY_LINK_COLUMN_ID) ??
      pickColumnByTitle(boardColumns, [/lien depot/i, /lien de depot/i, /lien dep[oô]t/i, /lien espace client/i])?.id;

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

    const bankColumnId =
      normalizeEnv(process.env.MONDAY_BANK_COLUMN_ID) ??
      pickColumnByTitle(boardColumns, [/^banque$/i, /^assureur$/i])?.id;
    const bank = parseBankValue({ bankColumnId, itemValues: item.column_values });

    const session = await createOrReuseDepotSession({
      mondayItemId,
      clientName: item.name || "Client",
      clientEmail: email,
      bank: bank || undefined,
      requestUrl: req.url
    });

    const waitingDocsDateColumnId =
      normalizeEnv(process.env.MONDAY_WAITING_DOCS_DATE_COLUMN_ID) ??
      pickColumnByTitle(boardColumns, [/date.*attente.*docs/i, /entree.*attente.*docs/i, /attente.*documents.*date/i])?.id;

    const clientAccessLink = session.link;

    const columnValuesToUpdate: Record<string, unknown> = {};
    if (existingLinkUrl !== session.link) {
      columnValuesToUpdate[linkColumnId] = {
        url: session.link,
        text: "Lien espace client"
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

    const shouldSendClientEmail = existingLinkUrl !== session.link || shouldSetWaitingDate;

    let clientEmailSent = false;
    if (shouldSendClientEmail) {
      try {
        clientEmailSent = await sendClientDepotEmail({
          clientName: item.name || "Client",
          clientEmail: email,
          bank,
          link: clientAccessLink,
          expiresAt: session.expiresAt
        });
      } catch (mailErr) {
        console.error("monday-client-email-failed", mailErr);
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
        console.error("monday-reminders-schedule-failed", scheduleErr);
      }
    }

    return NextResponse.json({
      ok: true,
      board_id: item.board.id,
      item_id: mondayItemId,
      generated_link: clientAccessLink,
      client_email_should_send: shouldSendClientEmail,
      client_email_sent: clientEmailSent,
      reminders_scheduled: remindersScheduled
    });
  } catch (err) {
    console.error("monday-native-webhook-failed", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
