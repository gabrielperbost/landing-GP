import { NextRequest, NextResponse } from "next/server";
import {
  checkPortalRateLimit,
  extendSessionTokenExpiryById,
  getClientIp,
  getPortalAuthStateByEmail,
  getSessionByToken,
  isSessionOwnedByEmail,
  isSessionExpired,
  isSessionStatusFirstLogin,
  isStrongPortalPassword,
  isTrustedPortalOrigin,
  normalizeEmail,
  resolvePortalTokenFromRequest,
  setPortalSessionCookie,
  updatePortalAuthPassword
} from "@/lib/portalAuth";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PasswordSetPayload = {
  token?: string;
  email?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
    }
    if (!isTrustedPortalOrigin(req)) {
      return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
    }

    const body = (await req.json()) as PasswordSetPayload;
    const tokenAuth = resolvePortalTokenFromRequest({
      req,
      legacyToken: String(body.token ?? "")
    });
    const token = tokenAuth.token;
    const email = normalizeEmail(String(body.email ?? "") || tokenAuth.email);
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    const ip = getClientIp(req);
    const rate = checkPortalRateLimit({
      scope: "portal_password_set",
      key: `${ip}:${email || "unknown"}:${token || "missing-token"}`,
      maxAttempts: 8,
      windowMs: 30 * 60 * 1000
    });

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Trop de tentatives. Réessayez dans quelques minutes."
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds)
          }
        }
      );
    }

    if (!token || !email) {
      return NextResponse.json({ error: "Lien incomplet. Reprenez le lien reçu par email." }, { status: 400 });
    }

    if (!isStrongPortalPassword(newPassword)) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères, avec lettres et chiffres." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Les mots de passe ne correspondent pas." }, { status: 400 });
    }

    const session = await getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
    }

    const sessionEmail = normalizeEmail(String(session.client_email ?? ""));
    if (!isSessionOwnedByEmail({ sessionEmail, expectedEmail: email })) {
      return NextResponse.json({ error: "Accès non autorisé pour cet email." }, { status: 403 });
    }

    const authState = await getPortalAuthStateByEmail(email);
    if (authState.passwordSet) {
      return NextResponse.json(
        {
          error: "Le mot de passe est déjà configuré pour ce dossier. Connectez-vous depuis la page Connexion."
        },
        { status: 409 }
      );
    }

    await updatePortalAuthPassword({ email, password: newPassword });

    const keepCurrentStatus = !isSessionStatusFirstLogin(session.status);
    const nextStatus = keepCurrentStatus ? String(session.status ?? "password_set") : "password_set";
    const nextExpiry = isSessionExpired(session)
      ? await extendSessionTokenExpiryById(session.id, 10)
      : session.token_expires_at;

    await supabaseAdmin
      .from("sessions")
      .update({
        ...(keepCurrentStatus ? {} : { status: nextStatus }),
        token_expires_at: nextExpiry ?? session.token_expires_at
      })
      .eq("id", session.id);

    const response = NextResponse.json({
      ok: true,
      status: nextStatus,
      redirect: "/espace-client/portail"
    });
    setPortalSessionCookie({ response, token, email });

    return response;
  } catch (error) {
    console.error("session-password-set-route-failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
