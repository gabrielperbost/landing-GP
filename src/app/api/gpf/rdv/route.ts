import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUTS = ["a_venir", "provisoire", "passe", "annule"];

// Rendez-vous sur une période (agenda) ou pour un contact.
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const p = request.nextUrl.searchParams;
  let query = supabaseAdmin.from("gpf_appointments").select("*").is("deleted_at", null);
  if (p.get("client_id")) query = query.eq("client_id", p.get("client_id")!);
  if (p.get("du")) query = query.gte("debut", p.get("du")!);
  if (p.get("au")) query = query.lte("debut", p.get("au")!);
  const { data, error } = await query.order("debut", { ascending: true }).limit(500);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Un rendez-vous « à venir » dont l'heure est passée s'affiche comme passé.
  const now = Date.now();
  const clientIds = Array.from(new Set((data ?? []).map((r) => r.client_id).filter(Boolean) as string[]));
  const { data: clients } = clientIds.length ? await supabaseAdmin.from("gpf_clients").select("id, prenom, nom").in("id", clientIds) : { data: [] };
  const byId = new Map((clients ?? []).map((c) => [c.id, c]));
  const rdv = (data ?? []).map((r) => ({
    ...r,
    statut: r.statut === "a_venir" && new Date(r.debut).getTime() + r.duree_min * 60000 < now ? "passe" : r.statut,
    client: r.client_id ? byId.get(r.client_id) ?? null : null
  }));
  return NextResponse.json({ ok: true, rdv });
}

export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.titre?.trim() || !body?.debut) return NextResponse.json({ ok: false, error: "titre_et_date_requis" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("gpf_appointments")
    .insert({
      client_id: body.client_id ?? null,
      titre: body.titre.trim(),
      debut: new Date(body.debut).toISOString(),
      duree_min: Number(body.duree_min) || 30,
      lieu: body.lieu ?? null,
      lien_visio: body.lien_visio ?? null,
      statut: STATUTS.includes(body.statut) ? body.statut : "a_venir",
      notes: body.notes ?? null
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (body.client_id) await logActivity("update", "client", body.client_id, `Rendez-vous planifié : ${body.titre.trim()}`);
  return NextResponse.json({ ok: true, rdv: data });
}
