import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Etape = { jour: number; sujet: string; corps: string };
const DECLENCHEURS = ["nouveau_lead", "nrp", "devis_envoye"];

const nettoyer = (etapes: unknown): Etape[] =>
  (Array.isArray(etapes) ? etapes : [])
    .map((e) => ({ jour: Math.max(0, Math.min(60, Number(e?.jour) || 0)), sujet: String(e?.sujet ?? "").slice(0, 200), corps: String(e?.corps ?? "").slice(0, 5000) }))
    .filter((e) => e.sujet && e.corps)
    .slice(0, 8);

// Création ou modification d'une séquence. L'activation repart de maintenant :
// seuls les contacts arrivés après reçoivent les e-mails.
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.nom?.trim() || !DECLENCHEURS.includes(body.declencheur)) return NextResponse.json({ ok: false, error: "parametres_invalides" }, { status: 400 });
  const row = { nom: body.nom.trim(), declencheur: body.declencheur, etapes: nettoyer(body.etapes) };
  const q = body.id ? supabaseAdmin.from("gpf_sequences").update(row).eq("id", body.id) : supabaseAdmin.from("gpf_sequences").insert(row);
  const { error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.id || typeof body.actif !== "boolean") return NextResponse.json({ ok: false, error: "parametres_invalides" }, { status: 400 });
  // Activer remet la date de départ à maintenant (pas d'envoi rétroactif aux anciens contacts).
  const patch = body.actif ? { actif: true, created_at: new Date().toISOString() } : { actif: false };
  const { error } = await supabaseAdmin.from("gpf_sequences").update(patch).eq("id", body.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id_requis" }, { status: 400 });
  await supabaseAdmin.from("gpf_sequences").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
