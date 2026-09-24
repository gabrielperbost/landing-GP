import { NextRequest, NextResponse } from "next/server";
import {
  checkPortalRateLimit,
  extendSessionTokenExpiryById,
  getPortalAuthStateByEmail,
  getClientIp,
  getLatestSessionByEmail,
  isSessionOwnedByEmail,
  isSessionExpired,
  isTrustedPortalOrigin,
  normalizeEmail,
  setPortalSessionCookie,
  verifyPortalAuthCredentials
} from "@/lib/portalAuth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginPayload = {
  email?: string;
  password?: string;
};

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
    }
    if (!isTrustedPortalOrigin(req)) {
      return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
    }

    const body = (await req.json()) as LoginPayload;
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");

    const ip = getClientIp(req);
    const rate = checkPortalRateLimit({
      scope: "portal_login",
      key: `${ip}:${email || "unknown"}`,
      maxAttempts: 8,
      windowMs: 10 * 60 * 1000
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

    if (!isValidEmail(email) || !password.trim()) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const latestSession = await getLatestSessionByEmail(email);
    const authState = await getPortalAuthStateByEmail(email);
    const credentialsOk = await verifyPortalAuthCredentials({ email, password });
    if (!credentialsOk) {
      if (latestSession && (!authState.exists || !authState.passwordSet)) {
        return NextResponse.json(
          {
            error: "Compte non activé. Utilisez le lien reçu par email ou demandez un nouveau lien.",
            code: "activation_required"
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const session = latestSession;
    if (!session?.token || !isSessionOwnedByEmail({ sessionEmail: session.client_email, expectedEmail: email })) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    if (isSessionExpired(session)) {
      await extendSessionTokenExpiryById(session.id, 10);
    }

    const response = NextResponse.json({
      ok: true,
      redirect: "/espace-client/portail"
    });
    setPortalSessionCookie({ response, token: session.token, email });

    return response;
  } catch (error) {
    console.error("portal-auth-login-route-failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
