import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  let query = supabaseAdmin.from("gpf_clients").select("*").order("nom", { ascending: true });
  if (q) query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, clients: data });
}

export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.prenom?.trim() || !body?.nom?.trim()) {
    return NextResponse.json({ ok: false, error: "prenom_nom_requis" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("gpf_clients")
    .insert({
      civilite: body.civilite || null,
      prenom: body.prenom.trim(),
      nom: body.nom.trim(),
      email: body.email || null,
      telephone: body.telephone || null,
      adresse: body.adresse || null,
      ville: body.ville || null,
      code_postal: body.code_postal || null,
      annee_naissance: body.annee_naissance || null,
      profession: body.profession || null,
      fumeur: typeof body.fumeur === "boolean" ? body.fumeur : null,
      notes: body.notes || null
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, client: data });
}
