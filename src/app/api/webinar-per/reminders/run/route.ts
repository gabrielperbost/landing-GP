import { NextRequest, NextResponse } from "next/server";
import { getWebinarPerParticipants, markWebinarPerReminderSent, type WebinarPerReminderKey } from "@/lib/webinarPerSheet";
import { buildWebinarPerEmail } from "@/lib/webinarPerEmails";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";
import { getBrevoSmsConfig, sendBrevoSms } from "@/lib/brevoSms";
import { WEBINAR_PER_SESSIONS, getWebinarPerUnsubscribeUrl, type WebinarPerSessionId } from "@/lib/webinarPerConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizeEnv = (value: string | undefined) => {
  const trimmed = (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
};

type ScheduleTemplate = "reminder_3d" | "reminder_2d" | "reminder_1d" | "reminder_morning" | "reminder_1h";

type ScheduleItem = {
  session: WebinarPerSessionId;
  dateKey: string; // date (heure de Paris) à laquelle envoyer, format AAAA-MM-JJ
  fromHour: number; // fenêtre d'envoi en heure de Paris : [fromHour, toHour[
  toHour: number;
  reminderKey: WebinarPerReminderKey;
  template: ScheduleTemplate;
  alsoSms: boolean;
};

// Webinaires les dimanches 1er et 8 novembre 2026, 15h00 (Europe/Paris). Rappels aux inscrits uniquement,
// chaque session lisant son propre Google Sheet.
// Tâche quotidienne à 8h10 (heure de Paris) + une tâche chaque jour de webinaire à 14h pour le rappel H-1.
// Le Google Sheet n'ayant pas de colonnes J-2 et H-1, on réutilise les colonnes « Rappel 5j » (J-2)
// et « Rappel 7j » (H-1), libres pour ces webinaires.
const SCHEDULE: ScheduleItem[] = [
  { session: "2026-11-01", dateKey: "2026-10-29", fromHour: 6, toHour: 23, reminderKey: "reminder_3d_sent_at", template: "reminder_3d", alsoSms: false },
  { session: "2026-11-01", dateKey: "2026-10-30", fromHour: 6, toHour: 23, reminderKey: "reminder_5d_sent_at", template: "reminder_2d", alsoSms: false },
  { session: "2026-11-01", dateKey: "2026-10-31", fromHour: 6, toHour: 23, reminderKey: "reminder_1d_sent_at", template: "reminder_1d", alsoSms: true },
  { session: "2026-11-01", dateKey: "2026-11-01", fromHour: 6, toHour: 12, reminderKey: "reminder_morning_sent_at", template: "reminder_morning", alsoSms: true },
  { session: "2026-11-01", dateKey: "2026-11-01", fromHour: 13, toHour: 15, reminderKey: "reminder_7d_sent_at", template: "reminder_1h", alsoSms: false },
  { session: "2026-11-08", dateKey: "2026-11-05", fromHour: 6, toHour: 23, reminderKey: "reminder_3d_sent_at", template: "reminder_3d", alsoSms: false },
  { session: "2026-11-08", dateKey: "2026-11-06", fromHour: 6, toHour: 23, reminderKey: "reminder_5d_sent_at", template: "reminder_2d", alsoSms: false },
  { session: "2026-11-08", dateKey: "2026-11-07", fromHour: 6, toHour: 23, reminderKey: "reminder_1d_sent_at", template: "reminder_1d", alsoSms: true },
  { session: "2026-11-08", dateKey: "2026-11-08", fromHour: 6, toHour: 12, reminderKey: "reminder_morning_sent_at", template: "reminder_morning", alsoSms: true },
  { session: "2026-11-08", dateKey: "2026-11-08", fromHour: 13, toHour: 15, reminderKey: "reminder_7d_sent_at", template: "reminder_1h", alsoSms: false }
];

const SESSION_8NOV_PREFIX = WEBINAR_PER_SESSIONS["2026-11-08"].sourcePrefix;
// Garde-fou : la source dit à quelle session appartient la ligne (« webinaire-per-8nov|… » pour le 8 novembre,
// « webinaire-per|… » pour le 1er novembre), une ligne d'une session ne reçoit jamais les rappels de l'autre.
const belongsTo = (session: WebinarPerSessionId, source: string) =>
  String(source || "").startsWith(SESSION_8NOV_PREFIX) === (session === "2026-11-08");

const SMS_TEXT_BY_TEMPLATE: Partial<Record<ScheduleItem["template"], string>> = {
  reminder_1d: `GP Finances : rappel, webinaire PER demain à 15h. Lien par e-mail. STOP au 06 51 22 42 13.`,
  reminder_morning: `GP Finances : votre webinaire PER commence aujourd'hui à 15h. Lien par e-mail. STOP au 06 51 22 42 13.`
};

const getLocalDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

const getLocalHour = (date = new Date()) =>
  Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" }).format(date));

const getReminderSecret = () => normalizeEnv(process.env.WEBINAR_PER_REMINDER_SECRET) ?? normalizeEnv(process.env.CRON_SECRET);

const isAuthorized = (request: NextRequest) => {
  const expected = getReminderSecret();
  if (!expected) return false;
  const url = new URL(request.url);
  const provided =
    request.headers.get("x-webinar-per-reminder-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("secret");
  return provided?.trim() === expected;
};

const parseBatchSize = () => {
  const parsed = Number(normalizeEnv(process.env.WEBINAR_PER_REMINDER_BATCH_SIZE));
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 500) : 200;
};

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const today = getLocalDateKey();
  const hour = getLocalHour();
  const due = SCHEDULE.find((item) => item.dateKey === today && hour >= item.fromHour && hour < item.toHour);
  if (!due) return NextResponse.json({ ok: true, ran: false, reason: "no_reminder_due_now", today, hour });
  const session = WEBINAR_PER_SESSIONS[due.session];

  // Inscriptions et marquages antérieurs au début de la campagne de la session : ignorés (session passée).
  const campaignStart = Date.parse(session.campaignStart);
  const isCurrent = (value: string | undefined) => {
    const time = Date.parse(String(value ?? ""));
    return Number.isFinite(time) && time >= campaignStart;
  };

  const emailConfig = getBrevoTransactionalConfig();
  const smsConfig = due.alsoSms ? getBrevoSmsConfig() : null;
  const batchSize = parseBatchSize();

  let participants;
  try {
    participants = await getWebinarPerParticipants(session.sheetEnv);
  } catch (error) {
    console.error("[webinar-per] échec lecture Google Sheet", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "sheet_unavailable" }, { status: 503 });
  }

  const targets = participants
    .filter((p) => p.status.trim().toLowerCase() === "registered")
    .filter((p) => belongsTo(session.id, p.source))
    .filter((p) => isCurrent(p.created_at))
    .filter((p) => !isCurrent(p[due.reminderKey] as string | undefined))
    .slice(0, batchSize);

  const results = { session: session.id, attempted: targets.length, emailsSent: 0, smsSent: 0, errors: 0 };

  for (const participant of targets) {
    const contact = { prenom: participant.prenom, email: participant.email };
    const unsubscribeUrl = getWebinarPerUnsubscribeUrl(participant.email, session);
    let emailOk = true;

    if (emailConfig) {
      try {
        const built = buildWebinarPerEmail(due.template, contact, { unsubscribeUrl, session });
        await sendBrevoTransactionalEmail({
          config: emailConfig,
          to: { email: participant.email, name: [participant.prenom, participant.nom].filter(Boolean).join(" ") },
          subject: built.subject,
          html: built.html,
          text: built.text,
          unsubscribeUrl,
          tags: ["webinaire-per", due.template, `session-${session.id}`]
        });
        results.emailsSent += 1;
      } catch (error) {
        emailOk = false;
        results.errors += 1;
        console.error("[webinar-per] échec e-mail de rappel", participant.email, error instanceof Error ? error.message : error);
      }
    }

    if (smsConfig && participant.consent_sms && participant.telephone) {
      const text = SMS_TEXT_BY_TEMPLATE[due.template];
      if (text) {
        try {
          await sendBrevoSms({ config: smsConfig, phone: participant.telephone, text, tag: `webinaire-per-${due.template}` });
          results.smsSent += 1;
        } catch (error) {
          results.errors += 1;
          console.error("[webinar-per] échec SMS de rappel", participant.email, error instanceof Error ? error.message : error);
        }
      }
    }

    if (emailOk) {
      try {
        await markWebinarPerReminderSent(participant.email, due.reminderKey, undefined, session.sheetEnv);
      } catch (error) {
        console.error("[webinar-per] échec marquage rappel envoyé", participant.email, error instanceof Error ? error.message : error);
      }
    }
  }

  return NextResponse.json({ ok: true, ran: true, template: due.template, ...results });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
