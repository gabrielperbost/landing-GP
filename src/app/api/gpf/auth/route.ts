import { NextRequest, NextResponse } from "next/server";
import {
  checkGpfPassword,
  GPF_COOKIE_NAME,
  GPF_SESSION_MAX_AGE_SECONDS,
  gpfSessionCookieValue,
  isGpfConfigured,
  isTotpConfigured,
  isTotpRequired,
  verifyTotp
} from "@/lib/gpf/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Permet au formulaire de connexion de savoir s'il doit afficher/exiger le
// champ code 2FA, sans jamais exposer le secret lui-même.
export async function GET() {
  return NextResponse.json({ ok: true, totpConfigured: isTotpConfigured(), totpRequired: isTotpRequired() });
}

export async function POST(request: NextRequest) {
  if (!isGpfConfigured()) {
    return NextResponse.json({ ok: false, error: "gpf_not_configured" }, { status: 503 });
  }
  let body: { password?: string; totp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (!body.password || !checkGpfPassword(body.password)) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
  }

  // Le second facteur est validé dès qu'un code est fourni (pour permettre de
  // le tester avant de l'imposer), et obligatoire une fois GPF_TOTP_REQUIRED
  // activé.
  if (isTotpRequired() || body.totp) {
    if (!verifyTotp(body.totp)) {
      return NextResponse.json({ ok: false, error: "invalid_totp" }, { status: 401 });
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(GPF_COOKIE_NAME, gpfSessionCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: GPF_SESSION_MAX_AGE_SECONDS,
    path: "/"
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(GPF_COOKIE_NAME);
  return response;
}
