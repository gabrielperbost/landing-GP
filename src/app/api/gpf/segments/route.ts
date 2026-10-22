import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { membresSegment, type Filtres } from "@/lib/gpf/segments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Segments enregistrés + aperçu d'un segment (?apercu=1 avec les filtres en JSON).
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const filtres = request.nextUrl.searchParams.get("filtres");
  if (filtres) {
    const m = await membresSegment(JSON.parse(filtres) as Filtres);
    const joignables = m.filter((x) => x.email && !x.desabonne);
    return NextResponse.json({ ok: true, total: m.length, joignables: joignables.length, desabonnes: m.filter((x) => x.desabonne).length, apercu: m.slice(0, 25) });
  }
  const { data } = await supabaseAdmin.from("gpf_segments").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ ok: true, segments: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.nom?.trim()) return NextResponse.json({ ok: false, error: "nom_requis" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("gpf_segments").insert({ nom: body.nom.trim(), filtres: body.filtres ?? {} }).select("*").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, segment: data });
}

export async function DELETE(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id_requis" }, { status: 400 });
  await supabaseAdmin.from("gpf_segments").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
