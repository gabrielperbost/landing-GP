import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { applyPendingMigrations, migrationStatus } from "@/lib/gpf/migrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// État des migrations de la base (lecture seule).
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await migrationStatus()) });
}

// Applique les migrations en attente — uniquement celles livrées avec le
// code (aucun SQL reçu de la requête n'est exécuté).
export async function POST() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const result = await applyPendingMigrations();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
