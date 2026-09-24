import { NextRequest, NextResponse } from "next/server";
import {
  checkPortalRateLimit,
  extendSessionTokenExpiryById,
  getClientIp,
  getSessionByToken,
  isSessionExpired,
  isTrustedPortalOrigin,
  normalizeEmail,
  setPortalSessionCookie
} from "@/lib/portalAuth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BootstrapPayload = {
  token?: string;
  email?: string;
};

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
    }
    if (!isTrustedPortalOrigin(req)) {
      return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
    }

    const body = (await req.json()) as BootstrapPayload;
    const token = String(body.token ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));

    const ip = getClientIp(req);
    const rate = checkPortalRateLimit({
      scope: "portal_bootstrap",
      key: `${ip}:${token || "missing-token"}`,
      maxAttempts: 15,
      windowMs: 15 * 60 * 1000
    });
    if (!rate.allowed) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
    }

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const session = await getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
    }

    const sessionEmail = normalizeEmail(String(session.client_email ?? ""));
    if (email && sessionEmail && email !== sessionEmail) {
      return NextResponse.json({ error: "Email non autorisé" }, { status: 403 });
    }

    if (isSessionExpired(session)) {
      await extendSessionTokenExpiryById(session.id, 10);
    }

    const response = NextResponse.json({ ok: true, email: sessionEmail });
    setPortalSessionCookie({
      response,
      token,
      email: sessionEmail
    });
    return response;
  } catch (error) {
    console.error("portal-auth-bootstrap-route-failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
