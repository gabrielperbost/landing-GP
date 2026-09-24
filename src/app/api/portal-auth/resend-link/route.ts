import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildClientAccessLink } from "@/lib/depotSession";
import {
  buildMailEnvelopeForRecipient,
  hasMailDeliveryRejection,
  notifyMailFailureAlert
} from "@/lib/mailFailureAlert";
import {
  checkPortalRateLimit,
  extendSessionTokenExpiryById,
  getClientIp,
  getLatestSessionByEmail,
  isSessionExpired,
  isTrustedPortalOrigin,
  normalizeEmail
} from "@/lib/portalAuth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResendPayload = {
  email?: string;
};

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
    }
    if (!isTrustedPortalOrigin(req)) {
      return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
    }

    const body = (await req.json()) as ResendPayload;
    const email = normalizeEmail(String(body.email ?? ""));

    const ip = getClientIp(req);
    const rate = checkPortalRateLimit({
      scope: "portal_resend_link",
      key: `${ip}:${email || "unknown"}`,
      maxAttempts: 6,
      windowMs: 20 * 60 * 1000
    });

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes. Réessayez dans quelques minutes." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds)
          }
        }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    const session = await getLatestSessionByEmail(email);
    if (!session?.token) {
      // Réponse neutre pour éviter l'énumération d'emails.
      return NextResponse.json({ ok: true, sent: false });
    }

    if (isSessionExpired(session)) {
      await extendSessionTokenExpiryById(session.id, 10);
    }

    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const fromEmail = process.env.FROM_EMAIL?.trim();
    if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
      return NextResponse.json({ error: "Configuration email incomplète." }, { status: 500 });
    }

    const link = buildClientAccessLink({
      token: session.token,
      requestUrl: req.url,
      email
    });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parsePort(process.env.SMTP_PORT, 465),
      secure: String(process.env.SMTP_SECURE ?? "").trim().toLowerCase() !== "false",
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const subject = "GP Finances - Activez votre acces client";
    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: email,
        envelope: buildMailEnvelopeForRecipient(email),
        subject,
        html: `
        <div style="margin:0;padding:24px;background:#eef3fb;font-family:Arial,sans-serif;color:#0f172a;">
          <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #d9e2f2;border-radius:14px;overflow:hidden;">
            <div style="padding:18px 20px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;">
              <h1 style="margin:0;font-size:20px;line-height:1.2;">Activation de votre espace client GP Finances</h1>
            </div>
            <div style="padding:20px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.5;">
                Voici votre lien sécurisé pour accéder à votre portail et finaliser votre connexion.
              </p>
              <div style="text-align:center;margin:18px 0;">
                <a href="${link}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px;font-weight:700;font-size:15px;">
                  Accéder à mon espace client
                </a>
              </div>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#475569;">
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
              </p>
            </div>
          </div>
        </div>
      `
      });

      if (hasMailDeliveryRejection(info)) {
        throw new Error(`smtp_recipient_rejected:${Array.isArray(info.rejected) ? info.rejected.join(",") : "unknown"}`);
      }
    } catch (mailError) {
      await notifyMailFailureAlert({
        context: "portal_resend_link",
        recipient: email,
        subject,
        error: mailError
      });
      throw mailError;
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    console.error("portal-auth-resend-link-route-failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
