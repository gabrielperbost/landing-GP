import { NextRequest, NextResponse } from "next/server";
import { getWebinarPerParticipants, markWebinarPerReminderSent, type WebinarPerReminderKey } from "@/lib/webinarPerSheet";
import { buildWebinarPerEmail } from "@/lib/webinarPerEmails";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";
import { getBrevoSmsConfig, sendBrevoSms } from "@/lib/brevoSms";
import { WEBINAR_PER, getWebinarPerBaseUrl } from "@/lib/webinarPerConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizeEnv = (value: string | undefined) => {
  const trimmed = (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
};

type ScheduleItem = {
  dateKey: string; // date (heure de Paris) à laquelle envoyer, format AAAA-MM-JJ
  reminderKey: WebinarPerReminderKey;
  template: "reminder_7d" | "reminder_3d" | "reminder_1d" | "reminder_morning";
  alsoSms: boolean;
};

// Webinaire le dimanche 11 octobre 2026, 15h00 (Europe/Paris). Rappels aux inscrits uniquement.
const SCHEDULE: ScheduleItem[] = [
  { dateKey: "2026-10-04", reminderKey: "reminder_7d_sent_at", template: "reminder_7d", alsoSms: false },
  { dateKey: "2026-10-08", reminderKey: "reminder_3d_sent_at", template: "reminder_3d", alsoSms: false },
  { dateKey: "2026-10-10", reminderKey: "reminder_1d_sent_at", template: "reminder_1d", alsoSms: true },
  { dateKey: "2026-10-11", reminderKey: "reminder_morning_sent_at", template: "reminder_morning", alsoSms: true }
];

const SMS_TEXT_BY_TEMPLATE: Partial<Record<ScheduleItem["template"], string>> = {
  reminder_1d: `GP Finances : rappel, webinaire PER demain ${WEBINAR_PER.timeLabel}. Lien par e-mail. STOP au 06 51 22 42 13.`,
  reminder_morning: `GP Finances : votre webinaire PER commence aujourd'hui à ${WEBINAR_PER.timeLabel.split(" ")[0]}. Lien par e-mail. STOP au 06 51 22 42 13.`
};

const getLocalDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

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
  const due = SCHEDULE.find((item) => item.dateKey === today);
  if (!due) return NextResponse.json({ ok: true, ran: false, reason: "no_reminder_due_today", today });

  const emailConfig = getBrevoTransactionalConfig();
  const smsConfig = due.alsoSms ? getBrevoSmsConfig() : null;
  const batchSize = parseBatchSize();

  let participants;
  try {
    participants = await getWebinarPerParticipants();
  } catch (error) {
    console.error("[webinar-per] échec lecture Google Sheet", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "sheet_unavailable" }, { status: 503 });
  }

  const targets = participants
    .filter((p) => p.status.trim().toLowerCase() === "registered")
    .filter((p) => !p[due.reminderKey])
    .slice(0, batchSize);

  const unsubscribeBase = `${getWebinarPerBaseUrl()}${WEBINAR_PER.unsubscribePath}`;
  const results = { attempted: targets.length, emailsSent: 0, smsSent: 0, errors: 0 };

  for (const participant of targets) {
    const contact = { prenom: participant.prenom, email: participant.email };
    const unsubscribeUrl = `${unsubscribeBase}?email=${encodeURIComponent(participant.email)}`;
    let emailOk = true;

    if (emailConfig) {
      try {
        const built = buildWebinarPerEmail(due.template, contact, { unsubscribeUrl });
        await sendBrevoTransactionalEmail({
          config: emailConfig,
          to: { email: participant.email, name: [participant.prenom, participant.nom].filter(Boolean).join(" ") },
          subject: built.subject,
          html: built.html,
          text: built.text,
          unsubscribeUrl,
          tags: ["webinaire-per", due.template]
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
        await markWebinarPerReminderSent(participant.email, due.reminderKey);
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
