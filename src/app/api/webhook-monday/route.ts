import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEPRECATED_MESSAGE =
  "Endpoint deprecated. Utilisez /api/monday/webhook (webhook Monday natif) pour éviter les doublons d'envoi.";

export async function POST() {
  return NextResponse.json({ error: DEPRECATED_MESSAGE }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({ error: DEPRECATED_MESSAGE }, { status: 410 });
}
