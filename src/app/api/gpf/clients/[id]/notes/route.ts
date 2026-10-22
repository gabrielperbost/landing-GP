import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["reunion", "suivi", "conformite", "contrats", "autre"];

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("gpf_notes")
    .select("*")
    .eq("client_id", params.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, notes: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const contenu = body?.contenu?.trim();
  if (!contenu) return NextResponse.json({ ok: false, error: "contenu_requis" }, { status: 400 });
  const categorie = CATEGORIES.includes(body.categorie) ? body.categorie : "suivi";
  const { data, error } = await supabaseAdmin
    .from("gpf_notes")
    .insert({ client_id: params.id, dossier_id: body.dossier_id ?? null, categorie, contenu })
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await supabaseAdmin.from("gpf_clients").update({ dernier_contact_at: new Date().toISOString() }).eq("id", params.id);
  await logActivity("update", "client", params.id, `Note (${categorie}) ajoutée`);
  return NextResponse.json({ ok: true, note: data });
}
