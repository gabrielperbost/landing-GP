import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Application d'une proposition de l'assistant après validation (lot 8).
export async function POST() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: false, error: "assistant_non_configure" });
}
