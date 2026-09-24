import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";
import { normalizeEnv } from "@/lib/monday";
import {
  appendWebinarRegistrationToSheet,
  getWebinarParticipantsFromSheet,
  markWebinarReminderSentInSheet,
  type WebinarReminderSheetKey,
  type WebinarSheetParticipant
} from "@/lib/googleSheetsWebinar";
import { buildWebinarAvocatsEmail, type WebinarAvocatsEmailTemplate } from "@/lib/webinarAvocatsCampaign";
import { getWebinarAvocatsCalendarLinks, WEBINAR_AVOCATS_MEETING_URL } from "@/lib/webinarAvocatsCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReminderScheduleItem = {
  dateKey: string;
  label: string;
  template: WebinarAvocatsEmailTemplate;
  reminderKey: WebinarReminderSheetKey;
};

const REGISTERED_REMINDER_SCHEDULE: ReminderScheduleItem[] = [
  {
    dateKey: "2026-08-18",
    label: "30 jours avant",
    template: "registered_reminder_30d",
    reminderKey: "reminder_30d_sent_at"
  },
  {
    dateKey: "2026-09-03",
    label: "2 semaines avant",
    template: "registered_reminder_14d",
    reminderKey: "reminder_14d_sent_at"
  },
  {
    dateKey: "2026-09-10",
    label: "1 semaine avant",
    template: "registered_reminder_7d",
    reminderKey: "reminder_7d_sent_at"
  },
  {
    dateKey: "2026-09-14",
    label: "3 jours avant",
    template: "registered_reminder_3d",
    reminderKey: "reminder_3d_sent_at"
  },
  {
    dateKey: "2026-09-16",
    label: "La veille",
    template: "registered_reminder_1d",
    reminderKey: "reminder_1d_sent_at"
  },
  {
    dateKey: "2026-09-17",
    label: "Le matin même",
    template: "registered_reminder_morning",
    reminderKey: "reminder_morning_sent_at"
  }
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const parseBatchSize = () => {
  const parsed = Number(normalizeEnv(process.env.WEBINAR_AVOCATS_REMINDER_BATCH_SIZE));
  if (!Number.isInteger(parsed) || parsed <= 0) return 100;
  return Math.min(parsed, 500);
};

const getLocalDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

const getReminderSecret = () =>
  normalizeEnv(process.env.WEBINAR_AVOCATS_REMINDER_SECRET) ?? normalizeEnv(process.env.CRON_SECRET);

const isAuthorized = (request: NextRequest) => {
  const expected = getReminderSecret();
  if (!expected) return false;

  const url = new URL(request.url);
  const provided =
    request.headers.get("x-webinar-avocats-reminder-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("secret");

  return provided?.trim() === expected;
};

const getSmtpConfig = () => {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.FROM_EMAIL);
  if (!host || !user || !pass || !from) return null;

  return { host, user, pass, from };
};

const getReminderEmailProvider = () => {
  const reminderProvider = normalizeEnv(process.env.WEBINAR_AVOCATS_REMINDER_EMAIL_PROVIDER)?.toLowerCase();
  const campaignProvider = normalizeEnv(process.env.WEBINAR_AVOCATS_EMAIL_PROVIDER)?.toLowerCase();
  const provider = reminderProvider || campaignProvider;
  if (provider === "smtp" || provider === "brevo") return provider;
  return "brevo";
};

const createTransporter = (config: NonNullable<ReturnType<typeof getSmtpConfig>>) =>
  nodemailer.createTransport({
    host: config.host,
    port: parsePort(normalizeEnv(process.env.SMTP_PORT), 465),
    secure: normalizeEnv(process.env.SMTP_SECURE) !== "false",
    auth: { user: config.user, pass: config.pass }
  });

const MANUALLY_EXCLUDED_EMAILS = new Set([
  "benjamin.valette@vulpi-avocats.com",
  "sophie-greiner@protonmail.com",
  "bremant@bremant-associes.com"
]);

const isRegisteredParticipant = (participant: WebinarSheetParticipant) =>
  participant.status.trim().toLowerCase() === "registered" &&
  emailRegex.test(participant.email.trim().toLowerCase()) &&
  !MANUALLY_EXCLUDED_EMAILS.has(participant.email.trim().toLowerCase());

const reminderMarkerEmail = ({ email, reminderKey }: { email: string; reminderKey: WebinarReminderSheetKey }) =>
  `reminder-${reminderKey}-${Buffer.from(email).toString("base64url").slice(0, 48)}@gp-tracking.local`;

const getReminderMarkerSet = (participants: WebinarSheetParticipant[]) =>
  new Set(
    participants
      .filter((participant) => participant.status.trim().toLowerCase() === "tracking")
      .filter((participant) => participant.source.trim().toLowerCase() === "webinaire-per-avocats-reminder-sent")
      .map((participant) => {
        const reminderKey = participant.barreau.trim();
        const email = participant.cabinet.trim().toLowerCase();
        return `${reminderKey}:${email}`;
      })
      .filter((key) => key.includes("@"))
  );

const appendReminderMarker = async ({
  email,
  reminderKey,
  sentAt,
  provider
}: {
  email: string;
  reminderKey: WebinarReminderSheetKey;
  sentAt: string;
  provider: string;
}) =>
  appendWebinarRegistrationToSheet({
    consent_at: sentAt,
    prenom: "",
    nom: "",
    email: reminderMarkerEmail({ email, reminderKey }),
    barreau: reminderKey,
    cabinet: email,
    telephone: provider,
    status: "tracking",
    source: "webinaire-per-avocats-reminder-sent"
  });

const sendReminderEmail = async ({
  participant,
  template,
  provider,
  brevoConfig,
  transporter,
  from
}: {
  participant: WebinarSheetParticipant;
  template: WebinarAvocatsEmailTemplate;
  provider: "brevo" | "smtp";
  brevoConfig: ReturnType<typeof getBrevoTransactionalConfig>;
  transporter: ReturnType<typeof createTransporter> | null;
  from?: string;
}) => {
  const email = buildWebinarAvocatsEmail({
    template,
    contact: {
      email: participant.email,
      prenom: participant.prenom,
      nom: participant.nom,
      barreau: participant.barreau,
      cabinet: participant.cabinet
    }
  });
  const calendarLinks = getWebinarAvocatsCalendarLinks();
  const text = [
    "Bonjour Maître,",
    "",
    email.previewText,
    "",
    "Date : Jeudi 17 septembre 2026",
    "Horaire : 18h00 à 19h00",
    "Format : 45 minutes d'explications et d'exemples chiffrés + 15 minutes de questions",
    "",
    `Lien de connexion Zoom : ${WEBINAR_AVOCATS_MEETING_URL}`,
    "",
    `Ajouter à Google Agenda : ${calendarLinks.google}`,
    `Ajouter à Outlook : ${calendarLinks.outlook}`,
    `Télécharger le fichier agenda : ${calendarLinks.ics}`,
    "",
    "Gabriel PERBOST - GP Finances"
  ].join("\n");

  if (provider === "brevo" && brevoConfig) {
    await sendBrevoTransactionalEmail({
      config: brevoConfig,
      to: {
        email: participant.email,
        name: [participant.prenom, participant.nom].filter(Boolean).join(" ").trim()
      },
      replyTo: normalizeEnv(process.env.WEBINAR_AVOCATS_REPLY_TO),
      subject: email.subject,
      html: email.html,
      text,
      tags: ["webinaire-per-avocats", "registered-reminder"]
    });

    return email.subject;
  }

  if (!transporter || !from) throw new Error("smtp_not_configured");

  await transporter.sendMail({
    from,
    to: participant.email,
    replyTo: normalizeEnv(process.env.WEBINAR_AVOCATS_REPLY_TO),
    subject: email.subject,
    html: email.html,
    text
  });

  return email.subject;
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const dateKey = url.searchParams.get("date") || getLocalDateKey();
  const dryRun = url.searchParams.get("dryRun") === "1";
  const force = url.searchParams.get("force") === "1";
  const markOnly = url.searchParams.get("markOnly") === "1";
  const dueReminders = REGISTERED_REMINDER_SCHEDULE.filter((item) => item.dateKey === dateKey);

  if (dueReminders.length === 0) {
    return NextResponse.json({
      ok: true,
      dateKey,
      due: [],
      processed: 0,
      sent: 0,
      skipped: 0,
      dryRun
    });
  }

  let participants: WebinarSheetParticipant[] | null = null;
  try {
    participants = await getWebinarParticipantsFromSheet();
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "google_sheets_fetch_failed",
        details: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 500 }
    );
  }

  if (!participants) {
    return NextResponse.json({ ok: false, error: "google_sheets_not_configured" }, { status: 500 });
  }

  const provider = getReminderEmailProvider();
  const smtpConfig = provider === "smtp" ? getSmtpConfig() : null;
  const brevoConfig = provider === "brevo" ? getBrevoTransactionalConfig() : null;
  if (provider === "smtp" && !smtpConfig && !dryRun) {
    return NextResponse.json({ ok: false, error: "smtp_not_configured" }, { status: 500 });
  }
  if (provider === "brevo" && !brevoConfig && !dryRun) {
    return NextResponse.json({ ok: false, error: "brevo_not_configured" }, { status: 500 });
  }

  const transporter = smtpConfig ? createTransporter(smtpConfig) : null;
  const maxToSend = parseBatchSize();
  const reminderMarkers = getReminderMarkerSet(participants);
  const unsubscribedEmails = new Set(participants
    .filter((participant) => participant.status.trim().toLowerCase() === "unsubscribed")
    .map((participant) => participant.email.trim().toLowerCase()));
  const results: Array<{ email: string; reminder: string; action: string; provider: string; subject?: string; error?: string }> = [];
  let sent = 0;
  let marked = 0;
  let skipped = 0;

  for (const reminder of dueReminders) {
    for (const participant of participants) {
      const email = participant.email.trim().toLowerCase();

      if (!isRegisteredParticipant(participant) || unsubscribedEmails.has(email)) {
        skipped += 1;
        results.push({ email: email || "unknown", reminder: reminder.label, action: "skipped_not_registered", provider });
        continue;
      }

      if (!force && participant[reminder.reminderKey]) {
        skipped += 1;
        results.push({ email, reminder: reminder.label, action: "skipped_already_sent", provider });
        continue;
      }

      if (!force && reminderMarkers.has(`${reminder.reminderKey}:${email}`)) {
        skipped += 1;
        results.push({ email, reminder: reminder.label, action: "skipped_already_sent_marker", provider });
        continue;
      }

      if (sent >= maxToSend) {
        skipped += 1;
        results.push({ email, reminder: reminder.label, action: "skipped_batch_limit", provider });
        continue;
      }

      try {
        if (markOnly) {
          const sentAt = new Date().toISOString();
          await markWebinarReminderSentInSheet({ email, reminderKey: reminder.reminderKey, sentAt });
          await appendReminderMarker({ email, reminderKey: reminder.reminderKey, sentAt, provider });
          marked += 1;
          results.push({ email, reminder: reminder.label, action: "marked_without_send", provider });
          continue;
        }

        if (dryRun) {
          results.push({ email, reminder: reminder.label, action: "dry_run", provider });
          continue;
        }

        const sentAt = new Date().toISOString();
        const subject = await sendReminderEmail({
          participant,
          template: reminder.template,
          provider,
          brevoConfig,
          transporter,
          from: smtpConfig?.from ?? normalizeEnv(process.env.FROM_EMAIL)
        });
        await markWebinarReminderSentInSheet({ email, reminderKey: reminder.reminderKey, sentAt });
        await appendReminderMarker({ email, reminderKey: reminder.reminderKey, sentAt, provider });
        sent += 1;
        results.push({ email, reminder: reminder.label, action: "sent", provider, subject });
      } catch (error) {
        results.push({
          email,
          reminder: reminder.label,
          action: "error",
          provider,
          error: error instanceof Error ? error.message : "unknown_error"
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dateKey,
    due: dueReminders.map((item) => ({ label: item.label, date: item.dateKey, template: item.template })),
    provider,
    processed: results.length,
    sent,
    marked,
    skipped,
    markOnly,
    dryRun,
    results
  });
}

export const POST = GET;
