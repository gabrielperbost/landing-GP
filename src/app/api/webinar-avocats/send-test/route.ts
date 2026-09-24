import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { normalizeEnv } from "@/lib/monday";
import {
  WEBINAR_AVOCATS_EMAIL_TEMPLATES,
  buildWebinarAvocatsEmail,
  type WebinarAvocatsEmailTemplate
} from "@/lib/webinarAvocatsCampaign";
import { createWebinarUnsubscribeToken, normalizeWebinarEmail } from "@/lib/webinarAvocatsTokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const parseBody = async (request: NextRequest) => {
  if (request.method === "GET") return {};
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const isTemplate = (value: string): value is WebinarAvocatsEmailTemplate =>
  WEBINAR_AVOCATS_EMAIL_TEMPLATES.includes(value as WebinarAvocatsEmailTemplate);

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const body = await parseBody(request);
  const to = normalizeWebinarEmail(String(body.to || url.searchParams.get("to") || ""));
  const templateParam = String(body.template || url.searchParams.get("template") || "invitation");

  if (!emailRegex.test(to)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (!to.endsWith("@gp-finances.fr")) {
    return NextResponse.json({ ok: false, error: "test_recipient_must_be_gp_finances" }, { status: 400 });
  }
  if (!isTemplate(templateParam)) {
    return NextResponse.json({ ok: false, error: "invalid_template" }, { status: 400 });
  }

  const smtpConfig = getSmtpConfig();
  if (!smtpConfig) return NextResponse.json({ ok: false, error: "smtp_not_configured" }, { status: 500 });

  const baseUrl = (normalizeEnv(process.env.NEXT_PUBLIC_BASE_URL) ?? "https://gp-finances.fr").replace(/\/+$/, "");
  const unsubscribeToken = createWebinarUnsubscribeToken(to);
  const unsubscribeUrl = `${baseUrl}/api/webinar-avocats/unsubscribe?email=${encodeURIComponent(to)}&token=${unsubscribeToken}`;
  const email = buildWebinarAvocatsEmail({
    template: templateParam,
    contact: {
      email: to,
      prenom: String(body.prenom || url.searchParams.get("prenom") || "Gabriel"),
      nom: String(body.nom || url.searchParams.get("nom") || "PERBOST"),
      barreau: String(body.barreau || url.searchParams.get("barreau") || "Lyon"),
      cabinet: String(body.cabinet || url.searchParams.get("cabinet") || "GP Finances"),
      registrationUrl: `${baseUrl}/webinaire-per-avocats`,
      unsubscribeUrl
    }
  });

  const transporter = createTransporter(smtpConfig);
  const info = await transporter.sendMail({
    from: smtpConfig.from,
    to,
    replyTo: normalizeEnv(process.env.WEBINAR_AVOCATS_REPLY_TO),
    subject: email.subject,
    html: email.html,
    text: [
      "Bonjour Maître,",
      "",
      email.previewText,
      "",
      `Inscription : ${baseUrl}/webinaire-per-avocats`,
      `Désinscription : ${unsubscribeUrl}`,
      "",
      "Gabriel PERBOST - GP Finances"
    ].join("\n")
  });

  return NextResponse.json({ ok: true, to, template: templateParam, subject: email.subject, messageId: info.messageId });
}

export const POST = GET;
