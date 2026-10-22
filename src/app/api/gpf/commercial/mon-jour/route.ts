import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_STATUTS_CLOS, GPF_STATUTS_SIGNES, type GpfStatut } from "@/lib/gpf/types";
import { estBloquee } from "@/lib/gpf/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * « Mon jour » : ce qu'il faut traiter aujourd'hui — relances du jour et en
 * retard, nouveaux leads non contactés, rendez-vous du jour, affaires
 * bloquées et affaires sans prochaine action.
 */
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  const fin = new Date(debut);
  fin.setDate(fin.getDate() + 1);
  const il30j = new Date(Date.now() - 30 * 86400000).toISOString();

  const [taches, rdv, clients, dossiers, appels] = await Promise.all([
    supabaseAdmin.from("gpf_tasks").select("*").is("deleted_at", null).neq("etat", "terminee").lt("echeance", fin.toISOString()).order("echeance"),
    supabaseAdmin.from("gpf_appointments").select("*").is("deleted_at", null).gte("debut", debut.toISOString()).lt("debut", fin.toISOString()).order("debut"),
    supabaseAdmin.from("gpf_clients").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_dossiers").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_calls").select("client_id")
  ]);

  const clientById = new Map((clients.data ?? []).map((c) => [c.id, c]));
  const nom = (id: string | null) => {
    const c = id ? clientById.get(id) : null;
    return c ? { id: c.id, prenom: c.prenom, nom: c.nom, telephone: c.telephone, nrp_count: c.nrp_count ?? 0 } : null;
  };

  const signes = new Set((dossiers.data ?? []).filter((d) => GPF_STATUTS_SIGNES.has(d.statut) || d.contrat_statut).map((d) => d.client_id));
  const appeles = new Set((appels.data ?? []).map((a) => a.client_id));
  const nouveauxLeads = (clients.data ?? [])
    .filter((c) => c.created_at >= il30j && !signes.has(c.id) && !c.dernier_contact_at && !appeles.has(c.id))
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    .map((c) => ({ id: c.id, prenom: c.prenom, nom: c.nom, telephone: c.telephone, provenance: c.provenance ?? null, created_at: c.created_at }));

  const affaires = (dossiers.data ?? []).filter((d) => !d.contrat_statut && !GPF_STATUTS_SIGNES.has(d.statut) && !GPF_STATUTS_CLOS.has(d.statut as GpfStatut));
  const mapAffaire = (d: (typeof affaires)[number]) => ({
    id: d.id,
    produit: d.produit,
    statut: d.statut,
    assureur_nom: d.assureur_nom,
    etape_depuis: d.etape_depuis ?? d.updated_at,
    prochaine_action: d.prochaine_action ?? null,
    client: nom(d.client_id)
  });

  return NextResponse.json({
    ok: true,
    relances: (taches.data ?? []).map((t) => ({ ...t, en_retard: new Date(t.echeance).getTime() < debut.getTime(), client: nom(t.client_id) })),
    nouveauxLeads,
    rdv: (rdv.data ?? []).map((r) => ({ ...r, client: nom(r.client_id) })),
    bloquees: affaires.filter((d) => estBloquee(d)).map(mapAffaire),
    sansAction: affaires.filter((d) => !d.prochaine_action).map(mapAffaire),
    tablesManquantes: Boolean(taches.error || rdv.error)
  });
}
