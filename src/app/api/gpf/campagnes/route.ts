import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Campagnes e-mail et séquences automatiques.
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [c, s, e] = await Promise.all([
    supabaseAdmin.from("gpf_campagnes").select("*").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("gpf_sequences").select("*").order("created_at"),
    supabaseAdmin.from("gpf_sequence_envois").select("sequence_id, statut")
  ]);
  if (c.error) return NextResponse.json({ ok: true, disponible: false, campagnes: [], sequences: [] });
  const stats = new Map<string, { envoyes: number; erreurs: number }>();
  for (const x of e.data ?? []) {
    const v = stats.get(x.sequence_id) ?? { envoyes: 0, erreurs: 0 };
    if (x.statut === "erreur") v.erreurs++;
    else v.envoyes++;
    stats.set(x.sequence_id, v);
  }
  return NextResponse.json({
    ok: true,
    disponible: true,
    campagnes: c.data ?? [],
    sequences: (s.data ?? []).map((x) => ({ ...x, stats: stats.get(x.id) ?? { envoyes: 0, erreurs: 0 } }))
  });
}

// Création d'une campagne (brouillon) à partir d'un segment.
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.nom?.trim() || !body?.sujet?.trim() || !body?.corps?.trim()) return NextResponse.json({ ok: false, error: "champs_requis" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("gpf_campagnes")
    .insert({ nom: body.nom.trim(), filtres: body.filtres ?? {}, sujet: body.sujet.trim(), corps: body.corps.trim() })
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, campagne: data });
}
