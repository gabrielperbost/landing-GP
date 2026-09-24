import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getWebinarParticipantsFromSheet, type WebinarSheetParticipant } from "@/lib/googleSheetsWebinar";
import { normalizeEnv } from "@/lib/monday";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { buildWebinarAvocatsEmail, type WebinarAvocatsEmailTemplate } from "@/lib/webinarAvocatsCampaign";
import { createWebinarUnsubscribeToken, normalizeWebinarEmail } from "@/lib/webinarAvocatsTokens";
import { getWebinarAvocatsCalendarLinks, WEBINAR_AVOCATS_MEETING_URL } from "@/lib/webinarAvocatsCalendar";
import { getBrevoSuppression, isBrevoSuppressed, type BrevoSuppression } from "@/lib/brevoSuppression";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CampaignContact = {
  email?: string;
  prenom?: string;
  nom?: string;
  barreau?: string;
  cabinet?: string;
};

type SendBatchPayload = {
  contacts?: CampaignContact[];
  template?: WebinarAvocatsEmailTemplate;
  dryRun?: boolean;
  confirm?: string;
  audienceLabel?: string;
  recipientRegionLabel?: string;
  campaignSource?: string;
};

// Concurrent batches can share the same in-progress authoritative read.
// No completed result is cached: each later group reads the current sheet again.
let pendingParticipantsRead: Promise<WebinarSheetParticipant[] | null> | undefined;
const readCurrentParticipants = () => {
  if (!pendingParticipantsRead) {
    pendingParticipantsRead = getWebinarParticipantsFromSheet().finally(() => {
      pendingParticipantsRead = undefined;
    });
  }
  return pendingParticipantsRead;
};

const MAX_BATCH_SIZE = 25;
const MANUALLY_EXCLUDED_EMAILS = new Set([
  "benjamin.valette@vulpi-avocats.com",
  "sophie-greiner@protonmail.com",
  "bremant@bremant-associes.com"
]);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BREVO_TRANSACTIONAL_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
const allowedBulkTemplates: WebinarAvocatsEmailTemplate[] = [
  "invitation",
  "relance_s1",
  "relance_s2",
  "relance_s3",
  "relance_s4",
  "relance_s5",
  "relance_s6",
  "relance_s7",
  "relance_3d",
  "registered_reminder_3d",
  "registered_reminder_morning",
  "registered_replay",
  "nonregistered_replay",
  "relance_30d",
  "relance_24h",
  "relance_j0"
];

const isMissingTableError = (error: { code?: string; message?: string } | null) =>
  error?.code === "42P01" ||
  error?.code === "PGRST205" ||
  /relation .* does not exist/i.test(error?.message ?? "") ||
  /could not find the table/i.test(error?.message ?? "");

const isAuthorized = (request: NextRequest) => {
  const expectedTokens = [
    normalizeEnv(process.env.WEBINAR_AVOCATS_ADMIN_TOKEN),
    normalizeEnv(process.env.CRON_SECRET)
  ].filter(Boolean);
  if (expectedTokens.length === 0) return false;

  const url = new URL(request.url);
  const provided =
    request.headers.get("x-webinar-avocats-admin-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("token");

  return Boolean(provided && expectedTokens.includes(provided.trim()));
};

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const getSmtpConfig = () => {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.FROM_EMAIL);
  if (!host || !user || !pass || !from) return null;

  return { host, user, pass, from };
};

const createTransporter = (config: NonNullable<ReturnType<typeof getSmtpConfig>>) =>
  nodemailer.createTransport({
    host: config.host,
    port: parsePort(normalizeEnv(process.env.SMTP_PORT), 465),
    secure: normalizeEnv(process.env.SMTP_SECURE) !== "false",
    auth: { user: config.user, pass: config.pass }
  });

const parseFromEmail = (from: string) => {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim();
};

const getCampaignEmailProvider = () => {
  const provider = normalizeEnv(process.env.WEBINAR_AVOCATS_EMAIL_PROVIDER)?.toLowerCase();
  if (provider === "brevo" || provider === "smtp") return provider;
  return "brevo";
};

const getBrevoConfig = () => {
  const apiKey = normalizeEnv(process.env.BREVO_API_KEY);
  const fallbackFrom = normalizeEnv(process.env.FROM_EMAIL) ?? "";
  const senderEmail = normalizeEnv(process.env.BREVO_SENDER_EMAIL) ?? parseFromEmail(fallbackFrom);
  const senderName = normalizeEnv(process.env.BREVO_SENDER_NAME) ?? "Gabriel PERBOST - GP Finances";
  if (!apiKey || !senderEmail) return null;

  return { apiKey, senderEmail, senderName };
};

const sendWithBrevo = async ({
  config,
  contact,
  subject,
  html,
  text,
  replyTo,
  unsubscribeUrl
}: {
  config: NonNullable<ReturnType<typeof getBrevoConfig>>;
  contact: Required<Pick<CampaignContact, "email">> & CampaignContact;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  unsubscribeUrl: string;
}) => {
  const response = await fetch(BREVO_TRANSACTIONAL_EMAIL_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": config.apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: config.senderName,
        email: config.senderEmail
      },
      to: [
        {
          email: contact.email,
          name: [contact.prenom, contact.nom].filter(Boolean).join(" ").trim() || undefined
        }
      ],
      replyTo: replyTo
        ? {
            email: replyTo
          }
        : undefined,
      subject,
      htmlContent: html,
      textContent: text,
      tags: ["webinaire-per-avocats"],
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
      }
    })
  });

  const responseBody = (await response.json().catch(() => ({}))) as { messageId?: string; code?: string; message?: string };
  if (!response.ok) {
    throw new Error(`brevo_send_failed:${response.status}:${responseBody.message ?? responseBody.code ?? "unknown_error"}`);
  }

  return responseBody.messageId;
};

const getUnsubscribedEmails = async (emails: string[], participants: WebinarSheetParticipant[]) => {
  const unsubscribedEmails = new Set(MANUALLY_EXCLUDED_EMAILS);
  participants
    .filter((participant) => participant.status.trim().toLowerCase() === "unsubscribed")
    .forEach((participant) => unsubscribedEmails.add(normalizeWebinarEmail(participant.email)));

  if (!isSupabaseConfigured || emails.length === 0) return unsubscribedEmails;

  const { data, error } = await supabaseAdmin
    .from("webinar_avocats_unsubscribes")
    .select("email")
    .in("email", emails);

  if (isMissingTableError(error)) return unsubscribedEmails;
  if (error) throw error;

  (data ?? []).forEach((row) => unsubscribedEmails.add(normalizeWebinarEmail(row.email)));
  return unsubscribedEmails;
};

const getAlreadySentEmails = async ({ emails, template }: { emails: string[]; template: WebinarAvocatsEmailTemplate }) => {
  const alreadySentEmails = new Set<string>();
  if (!isSupabaseConfigured || emails.length === 0) return alreadySentEmails;

  const { data, error } = await supabaseAdmin
    .from("webinar_avocats_email_events")
    .select("contact_email")
    .eq("template", template)
    .eq("status", "sent")
    .in("contact_email", emails);

  if (isMissingTableError(error)) return alreadySentEmails;
  if (error) throw error;

  (data ?? []).forEach((row) => alreadySentEmails.add(normalizeWebinarEmail(row.contact_email)));
  return alreadySentEmails;
};

const recordEmailEvent = async ({
  email,
  template,
  status,
  messageId,
  error
}: {
  email: string;
  template: WebinarAvocatsEmailTemplate;
  status: "sent" | "error" | "skipped_unsubscribed" | "skipped_already_sent";
  messageId?: string;
  error?: string;
}) => {
  if (!isSupabaseConfigured) return;

  const { error: insertError } = await supabaseAdmin.from("webinar_avocats_email_events").insert({
    contact_email: email,
    template,
    status,
    provider_message_id: messageId ?? null,
    error: error ?? null
  });

  if (isMissingTableError(insertError)) return;
  if (insertError) console.error("webinar-avocats-email-event-insert-failed", insertError);
};

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const payload = (await request.json()) as SendBatchPayload;
  const dryRun = payload.dryRun !== false;
  const template = payload.template ?? "invitation";
  const contacts = (payload.contacts ?? []).slice(0, MAX_BATCH_SIZE);

  if (!Array.isArray(payload.contacts) || payload.contacts.length === 0) {
    return NextResponse.json({ ok: false, error: "contacts_required" }, { status: 400 });
  }
  if (payload.contacts.length > MAX_BATCH_SIZE) {
    return NextResponse.json({ ok: false, error: "batch_too_large", maxBatchSize: MAX_BATCH_SIZE }, { status: 400 });
  }
  if (!allowedBulkTemplates.includes(template)) {
    return NextResponse.json({ ok: false, error: "bulk_template_not_enabled" }, { status: 400 });
  }
  if (!dryRun && normalizeEnv(process.env.WEBINAR_AVOCATS_SEND_ENABLED) !== "true") {
    return NextResponse.json({ ok: false, error: "bulk_send_disabled" }, { status: 403 });
  }
  if (!dryRun && payload.confirm !== "SEND_WEBINAR_AVOCATS") {
    return NextResponse.json({ ok: false, error: "send_confirmation_required" }, { status: 400 });
  }

  const normalizedContacts = contacts.map((contact) => ({
    ...contact,
    email: normalizeWebinarEmail(String(contact.email ?? ""))
  }));
  const invalidContacts = normalizedContacts.filter((contact) => !emailRegex.test(contact.email));
  if (invalidContacts.length > 0) {
    return NextResponse.json(
      { ok: false, error: "invalid_emails", invalidEmails: invalidContacts.map((contact) => contact.email) },
      { status: 400 }
    );
  }
  if (new Set(normalizedContacts.map((contact) => contact.email)).size !== normalizedContacts.length) {
    return NextResponse.json({ ok: false, error: "duplicate_contacts" }, { status: 400 });
  }
  if (normalizedContacts.every((contact) => MANUALLY_EXCLUDED_EMAILS.has(contact.email))) {
    const provider = getCampaignEmailProvider();
    return NextResponse.json({
      ok: true, dryRun, provider, processed: normalizedContacts.length, sent: 0,
      skipped: normalizedContacts.length, errors: 0,
      results: normalizedContacts.map((contact) => ({email: contact.email, action: "skipped_unsubscribed", provider}))
    });
  }
  let participants: WebinarSheetParticipant[] | null;
  let unsubscribedEmails: Set<string>;
  let suppression: BrevoSuppression | undefined;
  try {
    participants = await readCurrentParticipants();
    if (!participants) throw new Error("participants_unavailable");
    unsubscribedEmails = await getUnsubscribedEmails(normalizedContacts.map((contact) => contact.email), participants);
    if (template === "nonregistered_replay") suppression = await getBrevoSuppression();
  } catch {
    return NextResponse.json({ ok: false, error: "audience_verification_failed" }, { status: 503 });
  }
  const registeredEmails = new Set(participants
    .filter((participant) => participant.status.trim().toLowerCase() === "registered")
    .map((participant) => normalizeWebinarEmail(participant.email)));
  const isRegisteredReminder = template === "registered_reminder_3d" || template === "registered_reminder_morning" || template === "registered_replay";
  const alreadySentEmails = await getAlreadySentEmails({
    emails: normalizedContacts.map((contact) => contact.email),
    template
  });
  const provider = getCampaignEmailProvider();
  const smtpConfig = provider === "smtp" ? getSmtpConfig() : null;
  const brevoConfig = provider === "brevo" ? getBrevoConfig() : null;
  if (!dryRun && provider === "smtp" && !smtpConfig) {
    return NextResponse.json({ ok: false, error: "smtp_not_configured" }, { status: 500 });
  }
  if (!dryRun && provider === "brevo" && !brevoConfig) {
    return NextResponse.json({ ok: false, error: "brevo_not_configured" }, { status: 500 });
  }

  const transporter = smtpConfig ? createTransporter(smtpConfig) : null;
  const baseUrl = (normalizeEnv(process.env.NEXT_PUBLIC_BASE_URL) ?? "https://gp-finances.fr").replace(/\/+$/, "");
  const replyTo = normalizeEnv(process.env.WEBINAR_AVOCATS_REPLY_TO);
  const results: Array<{ email: string; action: string; provider: string; subject?: string; messageId?: string; error?: string }> = [];

  for (const contact of normalizedContacts) {
    if (unsubscribedEmails.has(contact.email)) {
      results.push({ email: contact.email, action: "skipped_unsubscribed", provider });
      if (!dryRun) await recordEmailEvent({ email: contact.email, template, status: "skipped_unsubscribed" });
      continue;
    }

    if (suppression && isBrevoSuppressed(contact.email, suppression)) {
      results.push({ email: contact.email, action: "skipped_blacklisted", provider });
      continue;
    }

    if (isRegisteredReminder && !registeredEmails.has(contact.email)) {
      results.push({ email: contact.email, action: "skipped_not_registered", provider });
      continue;
    }
    if (!isRegisteredReminder && registeredEmails.has(contact.email)) {
      results.push({ email: contact.email, action: "skipped_registered", provider });
      continue;
    }

    if (alreadySentEmails.has(contact.email)) {
      results.push({ email: contact.email, action: "skipped_already_sent", provider });
      if (!dryRun) await recordEmailEvent({ email: contact.email, template, status: "skipped_already_sent" });
      continue;
    }

    const unsubscribeToken = createWebinarUnsubscribeToken(contact.email);
    const unsubscribeUrl = `${baseUrl}/api/webinar-avocats/unsubscribe?email=${encodeURIComponent(contact.email)}&token=${unsubscribeToken}`;
    const email = buildWebinarAvocatsEmail({
      template,
      contact: {
        email: contact.email,
        prenom: String(contact.prenom ?? ""),
        nom: String(contact.nom ?? ""),
        barreau: String(contact.barreau ?? ""),
        cabinet: String(contact.cabinet ?? ""),
        registrationUrl: `${baseUrl}/webinaire-per-avocats`,
        unsubscribeUrl,
        audienceLabel: String(payload.audienceLabel ?? ""),
        recipientRegionLabel: String(payload.recipientRegionLabel ?? ""),
        campaignSource: String(payload.campaignSource ?? "")
      }
    });

    if (dryRun) {
      results.push({ email: contact.email, action: "dry_run", provider, subject: email.subject });
      continue;
    }

    try {
      const calendar = getWebinarAvocatsCalendarLinks();
      const actionLines = isRegisteredReminder ? [
        "Date : Jeudi 17 septembre 2026",
        "Horaire : 18h00 à 19h00",
        `Lien de connexion Zoom : ${WEBINAR_AVOCATS_MEETING_URL}`,
        "ID de réunion : 836 5620 5859",
        "Code secret : 1709",
        `Ajouter à Google Agenda : ${calendar.google}`,
        `Ajouter à Outlook : ${calendar.outlook}`,
        `Télécharger le fichier agenda : ${calendar.ics}`
      ] : [`Inscription : ${baseUrl}/webinaire-per-avocats`];
      const text = email.text ?? [
        "Bonjour Maître,",
        "",
        email.previewText,
        "",
        ...actionLines,
        `Désinscription : ${unsubscribeUrl}`,
        "",
        "Gabriel PERBOST - GP Finances"
      ].join("\n");
      let messageId: string | undefined;

      if (provider === "brevo" && brevoConfig) {
        messageId = await sendWithBrevo({
          config: brevoConfig,
          contact,
          subject: email.subject,
          html: email.html,
          text,
          replyTo,
          unsubscribeUrl
        });
      } else {
        const info = await transporter?.sendMail({
          from: smtpConfig?.from,
          to: contact.email,
          replyTo,
          subject: email.subject,
          html: email.html,
          text
        });
        messageId = info?.messageId;
      }

      results.push({ email: contact.email, action: "sent", provider, subject: email.subject, messageId });
      await recordEmailEvent({ email: contact.email, template, status: "sent", messageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown_error";
      results.push({
        email: contact.email,
        action: "error",
        provider,
        error: errorMessage
      });
      await recordEmailEvent({ email: contact.email, template, status: "error", error: errorMessage });
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    provider,
    processed: results.length,
    sent: results.filter((result) => result.action === "sent").length,
    skipped: results.filter((result) => result.action.startsWith("skipped")).length,
    errors: results.filter((result) => result.action === "error").length,
    results
  });
}
