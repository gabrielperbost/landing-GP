import { NextRequest, NextResponse } from "next/server";
import { checkGpfPassword, gpfSessionCookieValue, GPF_COOKIE_NAME, isGpfConfigured } from "@/lib/gpf/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isGpfConfigured()) {
    return NextResponse.json({ ok: false, error: "gpf_not_configured" }, { status: 503 });
  }
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (!body.password || !checkGpfPassword(body.password)) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GPF_COOKIE_NAME, gpfSessionCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90, // 90 jours : usage interne, pas besoin de reconnexion fréquente
    path: "/"
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(GPF_COOKIE_NAME);
  return response;
}
