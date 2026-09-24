import { NextRequest, NextResponse } from "next/server";
import { clearPortalSessionCookie, isTrustedPortalOrigin } from "@/lib/portalAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  if (!isTrustedPortalOrigin(_req)) {
    return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  clearPortalSessionCookie(response);
  return response;
}
