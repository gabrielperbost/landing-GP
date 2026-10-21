import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_PRODUITS, GPF_STATUTS } from "@/lib/gpf/types";
import { logActivity } from "@/lib/gpf/activityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = [
  "produit", "statut", "source", "insurer_id", "reference_contrat", "montant_pret", "taux", "duree_mois", "date_effet",
  "placement_initial", "placement_mensuel", "frais_gestion_pct", "lien_dossier", "date_depot",
  "date_entree_attente_docs", "date_derniere_relance", "relances_envoyees", "remuneration_apporteur_pct",
  "assureur_nom", "frais_dossier", "precompte_lineaire_1ere_annee", "lineaire_n1", "frais_entree"
];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });

  if ("statut" in body && !(GPF_STATUTS as readonly string[]).includes(body.statut)) {
    return NextResponse.json({ ok: false, error: "statut_invalide" }, { status: 400 });
  }
  if ("produit" in body && !(GPF_PRODUITS as readonly string[]).includes(body.produit)) {
    return NextResponse.json({ ok: false, error: "produit_invalide" }, { status: 400 });
  }

  const { data: before } = await supabaseAdmin.from("gpf_dossiers").select("statut").eq("id", id).single();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of EDITABLE_FIELDS) if (key in body) patch[key] = body[key];

  const { data, error } = await supabaseAdmin.from("gpf_dossiers").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Historique : seulement si le statut a réellement changé (traçabilité, y compris
  // un retour en arrière volontaire, par ex. vers attente_documents).
  if ("statut" in body && before && before.statut !== body.statut) {
    await supabaseAdmin.from("gpf_status_history").insert({ dossier_id: id, ancien_statut: before.statut, nouveau_statut: body.statut });
  }

  await logActivity("update", "dossier", id, data.produit);
  return NextResponse.json({ ok: true, dossier: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = params;
  const deletedAt = new Date().toISOString();
  const { data, error } = await supabaseAdmin.from("gpf_dossiers").update({ deleted_at: deletedAt }).eq("id", id).select("produit").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Les documents du dossier partent avec lui en corbeille (même horodatage,
  // donc même échéance de purge à 30 jours) : sinon ils resteraient visibles
  // alors que leur dossier a disparu, ou pire, seraient purgés plus tard en
  // cascade DB sans jamais être passés par la corbeille.
  await supabaseAdmin.from("gpf_documents").update({ deleted_at: deletedAt }).eq("dossier_id", id).is("deleted_at", null);

  await logActivity("delete", "dossier", id, data?.produit);
  return NextResponse.json({ ok: true });
}
