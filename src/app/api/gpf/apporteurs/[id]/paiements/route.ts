import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Enregistre (ou corrige) le versement d'un mois à l'apporteur.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const mois = String(body?.mois ?? "");
  const montant = Number(body?.montant);
  if (!/^\d{4}-\d{2}$/.test(mois) || !Number.isFinite(montant)) return NextResponse.json({ ok: false, error: "parametres_invalides" }, { status: 400 });
  const { error } = await supabaseAdmin
    .from("gpf_apporteur_paiements")
    .upsert({ apporteur_id: params.id, mois: `${mois}-01`, montant, paye_le: body.paye_le || new Date().toISOString().slice(0, 10), reference: body.reference || null }, { onConflict: "apporteur_id,mois" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity("update", "apporteur", params.id, `Rétrocession ${mois} payée : ${montant} €`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const mois = request.nextUrl.searchParams.get("mois");
  if (!mois || !/^\d{4}-\d{2}$/.test(mois)) return NextResponse.json({ ok: false, error: "mois_requis" }, { status: 400 });
  const { error } = await supabaseAdmin.from("gpf_apporteur_paiements").delete().eq("apporteur_id", params.id).eq("mois", `${mois}-01`);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
