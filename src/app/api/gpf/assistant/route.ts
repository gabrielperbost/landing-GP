import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Branché au lot 8 : tant qu'aucune clé ANTHROPIC_API_KEY n'est configurée,
// l'assistant le signale au lieu de répondre.
export async function POST() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ ok: false, error: "assistant_non_configure" });
  return NextResponse.json({ ok: false, error: "assistant_non_configure" });
}
