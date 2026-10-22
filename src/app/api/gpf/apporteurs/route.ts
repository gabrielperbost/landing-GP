import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { statsApporteurs } from "@/lib/gpf/apporteurs";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const liste = await statsApporteurs();
  // La liste n'a pas besoin du détail des leads ni des paiements.
  return NextResponse.json({ ok: true, apporteurs: liste.map(({ leads: _l, paiements: _p, ...a }) => a) });
}

export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const nom = String(body?.nom ?? "").trim();
  if (!nom) return NextResponse.json({ ok: false, error: "nom_requis" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("gpf_apporteurs")
    .insert({ nom, type: body.type || null, contact_nom: body.contact_nom || null, email: body.email || null, telephone: body.telephone || null, taux_retrocession: body.taux_retrocession ?? null })
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity("create", "apporteur", data.id, nom);
  return NextResponse.json({ ok: true, apporteur: data });
}
