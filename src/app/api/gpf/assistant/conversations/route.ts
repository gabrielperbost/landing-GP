import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { iaDisponible, MODELE_ASSISTANT } from "@/lib/gpf/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Conversations enregistrées : la dernière d'une fiche (client_id), ou la
 * liste récente avec la consommation du mois (estimation de coût).
 */
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const clientId = request.nextUrl.searchParams.get("client_id");
  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    const { data } = await supabaseAdmin.from("gpf_assistant_conversations").select("*").eq("id", id).single();
    return NextResponse.json({ ok: true, conversation: data ?? null });
  }
  if (clientId) {
    const { data } = await supabaseAdmin.from("gpf_assistant_conversations").select("*").eq("client_id", clientId).order("updated_at", { ascending: false }).limit(1);
    return NextResponse.json({ ok: true, conversation: data?.[0] ?? null });
  }
  const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [{ data: liste }, { data: mois }] = await Promise.all([
    supabaseAdmin.from("gpf_assistant_conversations").select("id, client_id, titre, updated_at").order("updated_at", { ascending: false }).limit(50),
    supabaseAdmin.from("gpf_assistant_conversations").select("tokens_entree, tokens_sortie").gte("updated_at", debutMois)
  ]);
  const entree = (mois ?? []).reduce((s, c) => s + c.tokens_entree, 0);
  const sortie = (mois ?? []).reduce((s, c) => s + c.tokens_sortie, 0);
  return NextResponse.json({ ok: true, iaDisponible: iaDisponible(), modele: MODELE_ASSISTANT, conversations: liste ?? [], consommation: { entree, sortie } });
}

export async function DELETE(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id_requis" }, { status: 400 });
  await supabaseAdmin.from("gpf_assistant_conversations").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
