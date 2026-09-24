import { NextRequest, NextResponse } from "next/server";
import {
  extendSessionTokenExpiryById,
  getPortalAuthStateByEmail,
  getSessionByToken,
  isSessionExpired,
  isSessionStatusFirstLogin,
  normalizeEmail,
  setPortalSessionCookie
} from "@/lib/portalAuth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const buildRedirect = (req: NextRequest, path: string) => {
  const url = new URL(path, req.url);
  return NextResponse.redirect(url, { status: 302 });
};

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return buildRedirect(req, "/espace-client/connexion?error=config");
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim() ?? "";
    const emailFromQuery = normalizeEmail(url.searchParams.get("email")?.trim() ?? "");

    if (!token) {
      return buildRedirect(req, "/espace-client/connexion?error=invalid_link");
    }

    const session = await getSessionByToken(token);
    if (!session) {
      return buildRedirect(req, "/espace-client/connexion?error=invalid_link");
    }

    const sessionEmail = normalizeEmail(String(session.client_email ?? ""));
    const email = emailFromQuery || sessionEmail;
    if (!email || (emailFromQuery && sessionEmail && sessionEmail !== emailFromQuery)) {
      return buildRedirect(req, "/espace-client/connexion?error=invalid_link");
    }

    if (isSessionExpired(session)) {
      await extendSessionTokenExpiryById(session.id, 10);
    }

    const authState = await getPortalAuthStateByEmail(email);
    const shouldForceFirstLogin = isSessionStatusFirstLogin(session.status) || !authState.passwordSet;
    const redirectPath = shouldForceFirstLogin
      ? `/espace-client/portail?firstLogin=1&email=${encodeURIComponent(email)}`
      : "/espace-client/portail";

    const response = buildRedirect(req, redirectPath);
    setPortalSessionCookie({
      response,
      token,
      email
    });

    return response;
  } catch (error) {
    console.error("espace-client-acces-route-failed", error);
    return buildRedirect(req, "/espace-client/connexion?error=server");
  }
}
