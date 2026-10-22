import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";
import { CLIENT_EDITABLE_FIELDS } from "@/lib/gpf/contacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = params;

  const { data: client, error } = await supabaseAdmin.from("gpf_clients").select("*").eq("id", id).is("deleted_at", null).single();
  if (error || !client) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  // Un dossier peut lister ce client comme emprunteur principal OU co-emprunteur :
  // la fiche client doit refléter tout ce qu'il a chez GP Finances, quel que soit le rôle.
  const { data: dossiers } = await supabaseAdmin
    .from("gpf_dossiers")
    .select("*")
    .or(`client_id.eq.${id},co_client_id.eq.${id}`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, client, dossiers: dossiers ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of CLIENT_EDITABLE_FIELDS) if (key in body) patch[key] = typeof body[key] === "string" ? body[key].trim() || null : body[key];
  if ("prenom" in patch && !patch.prenom) return NextResponse.json({ ok: false, error: "prenom_requis" }, { status: 400 });
  if ("nom" in patch && !patch.nom) return NextResponse.json({ ok: false, error: "nom_requis" }, { status: 400 });

  const { data, error } = await supabaseAdmin.from("gpf_clients").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity("update", "client", id, `${data.prenom} ${data.nom}`.trim());
  return NextResponse.json({ ok: true, client: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = params;

  // Suppression douce : on bloque si des dossiers actifs (non supprimés)
  // existent encore, pour éviter un client "disparu" avec des dossiers en cours.
  const { count } = await supabaseAdmin
    .from("gpf_dossiers")
    .select("id", { count: "exact", head: true })
    .or(`client_id.eq.${id},co_client_id.eq.${id}`)
    .is("deleted_at", null);
  if (count && count > 0) {
    return NextResponse.json({ ok: false, error: "dossiers_actifs" }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("gpf_clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select("prenom, nom")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity("delete", "client", id, data ? `${data.prenom} ${data.nom}`.trim() : undefined);
  return NextResponse.json({ ok: true });
}
