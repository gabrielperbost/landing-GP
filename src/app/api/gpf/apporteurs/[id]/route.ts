import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { statsApporteurs } from "@/lib/gpf/apporteurs";
import { logActivity } from "@/lib/gpf/activityLog";
import { normSource } from "@/lib/gpf/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHAMPS = ["nom", "type", "contact_nom", "email", "telephone", "convention_signee", "date_convention", "taux_retrocession", "notes"];

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [a] = await statsApporteurs(params.id);
  if (!a) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });
  // Contacts non rattachés dont la provenance correspond au nom de l'apporteur (proposition de rattachement).
  const { data: clients } = await supabaseAdmin.from("gpf_clients").select("id, provenance, source, apporteur_id").is("deleted_at", null).is("apporteur_id", null);
  const cible = normSource(a.nom);
  const aRattacher = (clients ?? []).filter((c) => normSource(c.provenance ?? c.source) === cible).length;
  return NextResponse.json({ ok: true, apporteur: a, aRattacher });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });

  // Rattachement des contacts dont la provenance correspond (sur confirmation explicite).
  if (body.rattacher === true) {
    const { data: a } = await supabaseAdmin.from("gpf_apporteurs").select("nom").eq("id", params.id).single();
    if (!a) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });
    const { data: clients } = await supabaseAdmin.from("gpf_clients").select("id, provenance, source").is("deleted_at", null).is("apporteur_id", null);
    const ids = (clients ?? []).filter((c) => normSource(c.provenance ?? c.source) === normSource(a.nom)).map((c) => c.id);
    if (ids.length) await supabaseAdmin.from("gpf_clients").update({ apporteur_id: params.id }).in("id", ids);
    await logActivity("update", "apporteur", params.id, `${ids.length} contact(s) rattaché(s) à ${a.nom}`);
    return NextResponse.json({ ok: true, rattaches: ids.length });
  }

  const patch: Record<string, unknown> = {};
  for (const k of CHAMPS) if (k in body) patch[k] = body[k] === "" ? null : body[k];
  const { error } = await supabaseAdmin.from("gpf_apporteurs").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity("update", "apporteur", params.id, "Fiche apporteur modifiée");
  return NextResponse.json({ ok: true });
}

// Suppression douce : les contacts gardent leur rattachement.
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { error } = await supabaseAdmin.from("gpf_apporteurs").update({ deleted_at: new Date().toISOString() }).eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity("delete", "apporteur", params.id, "Apporteur supprimé");
  return NextResponse.json({ ok: true });
}
