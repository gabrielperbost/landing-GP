import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_CONTRAT_STATUTS, GPF_MOTIFS_REFUS, GPF_PRODUITS, GPF_STATUTS, GPF_STATUTS_SIGNES } from "@/lib/gpf/types";
import { logActivity } from "@/lib/gpf/activityLog";
import { addDays, closeAutoRelances, createTask } from "@/lib/gpf/tasks";
import { notify } from "@/lib/gpf/notify";
import { manquantPourSouscription } from "@/lib/gpf/conformite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = [
  "produit", "statut", "source", "insurer_id", "reference_contrat", "montant_pret", "taux", "duree_mois", "date_effet",
  "placement_initial", "placement_mensuel", "frais_gestion_pct", "lien_dossier", "date_depot",
  "date_entree_attente_docs", "date_derniere_relance", "relances_envoyees", "remuneration_apporteur_pct",
  "assureur_nom", "frais_dossier", "precompte_lineaire_1ere_annee", "lineaire_n1", "frais_entree",
  "motif_refus", "prime_mensuelle", "prime_annuelle",
  "contrat_statut", "date_signature", "date_echeance", "date_resiliation",
  "banque", "date_offre_pret", "date_signature_notaire", "cout_assurance_banque", "cout_assurance_delegation",
  "prochaine_action", "prochaine_action_date"
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
  if ("motif_refus" in body && body.motif_refus != null && !(GPF_MOTIFS_REFUS as readonly string[]).includes(body.motif_refus)) {
    return NextResponse.json({ ok: false, error: "motif_refus_invalide" }, { status: 400 });
  }

  if ("contrat_statut" in body && body.contrat_statut != null && !(GPF_CONTRAT_STATUTS as readonly string[]).includes(body.contrat_statut)) {
    return NextResponse.json({ ok: false, error: "contrat_statut_invalide" }, { status: 400 });
  }

  const { data: before } = await supabaseAdmin.from("gpf_dossiers").select("*").eq("id", id).single();

  // Motif obligatoire au moment où un dossier passe en Refusé (pas pour les
  // anciens refus importés de Monday, qui doivent rester modifiables).
  if (body.statut === "refuse" && before?.statut !== "refuse" && !body.motif_refus) {
    return NextResponse.json({ ok: false, error: "motif_refus_requis" }, { status: 400 });
  }

  // Conformité : pas de souscription sans DER signé ni pièce d'identité.
  if (body.statut === "en_cours_souscription" && before && before.statut !== "en_cours_souscription") {
    const manquant = await manquantPourSouscription(before.client_id);
    if (manquant.length) return NextResponse.json({ ok: false, error: "conformite_incomplete", manquant }, { status: 409 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of EDITABLE_FIELDS) if (key in body) patch[key] = body[key];

  const today = new Date().toISOString().slice(0, 10);
  // Une affaire qui passe en Effectif devient un contrat actif.
  if (before && "contrat_statut" in before && GPF_STATUTS_SIGNES.has(body.statut) && !before.contrat_statut && !("contrat_statut" in body)) {
    patch.contrat_statut = "actif";
    if (!before.date_signature) patch.date_signature = today;
  }
  if (body.contrat_statut === "resilie" && before && !before.date_resiliation && !body.date_resiliation) patch.date_resiliation = today;
  // Date d'entrée dans l'étape du pipeline (nombre de jours affiché sur les cartes).
  if (before && "etape_depuis" in before && "statut" in body && before.statut !== body.statut) patch.etape_depuis = new Date().toISOString();

  const { data, error } = await supabaseAdmin.from("gpf_dossiers").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Historique : seulement si le statut a réellement changé (traçabilité, y compris
  // un retour en arrière volontaire, par ex. vers attente_documents).
  if ("statut" in body && before && before.statut !== body.statut) {
    await supabaseAdmin.from("gpf_status_history").insert({ dossier_id: id, ancien_statut: before.statut, nouveau_statut: body.statut });
  }

  // Pièces manquantes : relance « Demander la pièce » à J+2.
  if (body.statut === "attente_documents" && before?.statut !== "attente_documents") {
    const { data: c } = await supabaseAdmin.from("gpf_clients").select("prenom, nom").eq("id", data.client_id).single();
    await createTask({
      client_id: data.client_id,
      dossier_id: id,
      titre: `Demander les pièces manquantes à ${c ? `${c.prenom} ${c.nom}` : "ce client"}`,
      categorie: "document",
      echeance: addDays(new Date(), 2),
      auto: true,
      origine: "piece_manquante"
    });
    await notify("piece_manquante", `Pièces manquantes : ${c ? `${c.prenom} ${c.nom}` : "dossier"}`, "Relance programmée à J+2", `/gpf/contacts/${data.client_id}?onglet=documents`);
  }
  if (before?.statut === "attente_documents" && "statut" in body && body.statut !== "attente_documents") {
    await closeAutoRelances(data.client_id, ["piece_manquante"]);
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
