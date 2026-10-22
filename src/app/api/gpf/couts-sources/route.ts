import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Coûts mensuels des sources payantes (rentabilité par source).
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const mois = request.nextUrl.searchParams.get("mois");
  let query = supabaseAdmin.from("gpf_source_costs").select("source, mois, cout").order("mois", { ascending: false });
  if (mois) query = query.eq("mois", `${mois}-01`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, couts: data ?? [] });
}

export async function PUT(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const source = body?.source?.trim();
  if (!source || !/^\d{4}-\d{2}$/.test(body?.mois ?? "")) return NextResponse.json({ ok: false, error: "parametres_invalides" }, { status: 400 });
  const cout = Number(String(body.cout ?? 0).replace(",", "."));
  if (!Number.isFinite(cout) || cout < 0) return NextResponse.json({ ok: false, error: "cout_invalide" }, { status: 400 });
  const { error } = await supabaseAdmin.from("gpf_source_costs").upsert({ source, mois: `${body.mois}-01`, cout }, { onConflict: "source,mois" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
