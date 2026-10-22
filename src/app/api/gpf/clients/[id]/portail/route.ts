import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { envoyerLienPortail } from "@/lib/gpf/portail";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// État de l'espace client d'un contact : pièces demandées, documents partagés, dernière connexion.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [c, demandes, docs, liens] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("email, portail_derniere_connexion").eq("id", params.id).single(),
    supabaseAdmin.from("gpf_portal_requests").select("*").eq("client_id", params.id).neq("statut", "annulee").order("created_at", { ascending: false }),
    supabaseAdmin.from("gpf_documents").select("id, type, nom_fichier, visible_client, depose_par_client, created_at").eq("client_id", params.id).is("deleted_at", null).order("created_at", { ascending: false }),
    supabaseAdmin.from("gpf_portal_tokens").select("created_at").eq("client_id", params.id).order("created_at", { ascending: false }).limit(1)
  ]);
  if (demandes.error) return NextResponse.json({ ok: true, disponible: false });
  return NextResponse.json({
    ok: true,
    disponible: true,
    email: c.data?.email ?? null,
    derniereConnexion: c.data?.portail_derniere_connexion ?? null,
    dernierLien: liens.data?.[0]?.created_at ?? null,
    demandes: demandes.data ?? [],
    documents: docs.data ?? []
  });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  switch (body?.action) {
    case "lien": {
      const r = await envoyerLienPortail(params.id).catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : "erreur" }));
      if (r.ok) await logActivity("update", "client", params.id, "Lien d'accès à l'espace client envoyé");
      return NextResponse.json(r, { status: r.ok ? 200 : 400 });
    }
    case "demander": {
      const libelle = String(body.libelle ?? "").trim().slice(0, 120);
      if (!libelle) return NextResponse.json({ ok: false, error: "libelle_requis" }, { status: 400 });
      // Jamais de questionnaire de santé : il se remplit directement chez l'assureur.
      if (/sant[ée]|m[ée]dical/i.test(libelle)) return NextResponse.json({ ok: false, error: "sante_interdit" }, { status: 400 });
      const { error } = await supabaseAdmin.from("gpf_portal_requests").insert({ client_id: params.id, libelle });
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    case "annuler_demande": {
      await supabaseAdmin.from("gpf_portal_requests").update({ statut: "annulee" }).eq("id", body.id).eq("client_id", params.id);
      return NextResponse.json({ ok: true });
    }
    case "partager": {
      const { error } = await supabaseAdmin.from("gpf_documents").update({ visible_client: Boolean(body.visible) }).eq("id", body.document_id).eq("client_id", params.id);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ ok: false, error: "action_invalide" }, { status: 400 });
}
