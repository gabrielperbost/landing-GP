import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clearSimulateurSessionCookie } from "@/lib/simulateurAuth";

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  clearSimulateurSessionCookie(response);
  return response;
}
