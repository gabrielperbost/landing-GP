import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { normalizeEnv } from "@/lib/monday";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { appendWebinarRegistrationToSheet } from "@/lib/googleSheetsWebinar";
import { buildWebinarAvocatsEmail } from "@/lib/webinarAvocatsCampaign";
import { getWebinarAvocatsCalendarLinks, WEBINAR_AVOCATS_MEETING_URL } from "@/lib/webinarAvocatsCalendar";
import { normalizeWebinarEmail } from "@/lib/webinarAvocatsTokens";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegisterPayload = {
  prenom?: string;
  nom?: string;
  email?: string;
  barreau?: string;
  cabinet?: string;
  telephone?: string;
  consent?: string | boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value: unknown) => String(value ?? "").trim();
const hasValidPhone = (value: string) => value.replace(/\D/g, "").length >= 10;
const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const isMissingTableError = (error: { code?: string; message?: string } | null) =>
  error?.code === "42P01" ||
  error?.code === "PGRST205" ||
  /relation .* does not exist/i.test(error?.message ?? "") ||
  /could not find the table/i.test(error?.message ?? "");

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
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });

const sendRegistrationConfirmation = async (payload: {
  email: string;
  prenom: string;
  nom: string;
  barreau: string;
  cabinet: string;
}) => {
  const confirmation = buildWebinarAvocatsEmail({
    template: "confirmation",
    contact: {
      email: payload.email,
      prenom: payload.prenom,
      nom: payload.nom,
      barreau: payload.barreau,
      cabinet: payload.cabinet
    }
  });
  const calendarLinks = getWebinarAvocatsCalendarLinks();
  const text = [
    "Bonjour Maître,",
    "",
    "Votre inscription au webinaire PER dédié aux avocats est bien enregistrée.",
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

  const brevoConfig = getBrevoTransactionalConfig();
  if (brevoConfig) {
    await sendBrevoTransactionalEmail({
      config: brevoConfig,
      to: {
        email: payload.email,
        name: [payload.prenom, payload.nom].filter(Boolean).join(" ").trim()
      },
      replyTo: normalizeEnv(process.env.WEBINAR_AVOCATS_REPLY_TO),
      subject: confirmation.subject,
      html: confirmation.html,
      text,
      tags: ["webinaire-per-avocats", "confirmation"]
    });

    return true;
  }

  const smtpConfig = getSmtpConfig();
  if (!smtpConfig) return false;

  const transporter = createTransporter(smtpConfig);

  await transporter.sendMail({
    from: smtpConfig.from,
    to: payload.email,
    subject: confirmation.subject,
    html: confirmation.html,
    text
  });

  return true;
};

const sendInternalRegistrationNotice = async (payload: {
  email: string;
  prenom: string;
  nom: string;
  barreau: string;
  cabinet: string;
  telephone: string;
}) => {
  const to = normalizeEnv(process.env.INTERNAL_LEADS_EMAIL) ?? normalizeEnv(process.env.MAIL_FAILURE_ALERT_TO);
  if (!to) return false;

  const subject = `Inscription webinaire avocats - ${payload.prenom || payload.nom || payload.email}`;
  const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;">
        <h2 style="margin:0 0 12px;">Nouvelle inscription webinaire PER avocats</h2>
        <p><strong>Prénom:</strong> ${escapeHtml(payload.prenom || "Non renseigné")}</p>
        <p><strong>Nom:</strong> ${escapeHtml(payload.nom || "Non renseigné")}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Barreau:</strong> ${escapeHtml(payload.barreau || "Non renseigné")}</p>
        <p><strong>Cabinet:</strong> ${escapeHtml(payload.cabinet || "Non renseigné")}</p>
        <p><strong>Téléphone:</strong> ${escapeHtml(payload.telephone || "Non renseigné")}</p>
        <p style="margin-top:16px;color:#64748b;font-size:12px;">Fallback email utilisé si les tables Supabase de campagne ne sont pas encore créées.</p>
      </div>
    `;
  const text = [
    "Nouvelle inscription webinaire PER avocats",
    `Prénom : ${payload.prenom}`,
    `Nom : ${payload.nom}`,
    `Email : ${payload.email}`,
    `Barreau : ${payload.barreau}`,
    `Cabinet : ${payload.cabinet}`,
    `Téléphone : ${payload.telephone}`
  ].join("\n");

  const brevoConfig = getBrevoTransactionalConfig();
  if (brevoConfig) {
    await sendBrevoTransactionalEmail({
      config: brevoConfig,
      to: { email: to },
      subject,
      html,
      text,
      tags: ["webinaire-per-avocats", "inscription-interne"]
    });
    return true;
  }

  const smtpConfig = getSmtpConfig();
  if (!smtpConfig) return false;
  const transporter = createTransporter(smtpConfig);
  await transporter.sendMail({ from: smtpConfig.from, to, subject, html, text });

  return true;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterPayload;
    const email = normalizeWebinarEmail(clean(body.email));
    const consent = body.consent === true || clean(body.consent) === "true";

    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Email invalide." }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ success: false, error: "Consentement d'inscription requis." }, { status: 400 });
    }
    if (!hasValidPhone(clean(body.telephone))) {
      return NextResponse.json({ success: false, error: "Téléphone requis pour le rappel SMS du webinaire." }, { status: 400 });
    }

    const payload = {
      email,
      prenom: clean(body.prenom),
      nom: clean(body.nom),
      barreau: clean(body.barreau),
      cabinet: clean(body.cabinet),
      telephone: clean(body.telephone),
      status: "registered",
      source: "webinaire-per-avocats",
      consent_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { data: existingUnsubscribe, error: unsubscribeError } = await supabaseAdmin
        .from("webinar_avocats_unsubscribes")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (unsubscribeError && !isMissingTableError(unsubscribeError)) {
        throw unsubscribeError;
      }
      if (existingUnsubscribe) {
        return NextResponse.json(
          { success: false, error: "Cette adresse est désinscrite de cette campagne." },
          { status: 409 }
        );
      }
    }

    let storedInSheet = false;
    try {
      storedInSheet = await appendWebinarRegistrationToSheet(payload);
    } catch (sheetsError) {
      console.error("webinar-avocats-google-sheets-sync-failed", sheetsError);
    }

    let storedInSupabase = false;
    if (isSupabaseConfigured) {
      const { error } = await supabaseAdmin.from("webinar_avocats_registrations").upsert(payload, {
        onConflict: "email"
      });

      if (error && !isMissingTableError(error)) throw error;

      if (!error) {
        storedInSupabase = true;
        const { error: contactsError } = await supabaseAdmin.from("webinar_avocats_contacts").upsert(
          {
            email,
            prenom: payload.prenom,
            nom: payload.nom,
            barreau: payload.barreau,
            cabinet: payload.cabinet,
            telephone: payload.telephone,
            status: "registered",
            registered_at: payload.consent_at,
            updated_at: payload.consent_at
          },
          { onConflict: "email" }
        );
        if (contactsError && !isMissingTableError(contactsError)) {
          console.error("webinar-avocats-contact-sync-failed", contactsError);
        }
      }
    }

    let internalNoticeSent = false;
    if (!storedInSupabase) {
      try {
        internalNoticeSent = await sendInternalRegistrationNotice(payload);
      } catch (noticeError) {
        console.error("webinar-avocats-internal-notice-failed", noticeError);
      }
    }

    if (!storedInSupabase && !storedInSheet && !internalNoticeSent) {
      throw new Error("Aucun enregistrement de l'inscription n'a pu être confirmé.");
    }

    try {
      const confirmationSent = await sendRegistrationConfirmation(payload);
      if (!confirmationSent) console.error("webinar-avocats-confirmation-not-configured");
    } catch (confirmationError) {
      console.error("webinar-avocats-confirmation-failed", confirmationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("webinar-avocats-register-failed", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
