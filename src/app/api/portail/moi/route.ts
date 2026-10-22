import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { clientPortail } from "@/lib/gpf/portail";
import { GPF_PRODUIT_LABEL, GPF_STATUTS_CLOS, GPF_STATUTS_SIGNES, type GpfProduit, type GpfStatut } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Étapes présentées au client, en termes simples.
const ETAPE_CLIENT: Record<string, string> = {
  a_traiter: "Demande reçue",
  nrp: "Demande reçue",
  devis_a_realiser: "Étude en cours",
  devis_envoye: "Proposition envoyée",
  attente_documents: "En attente de vos documents",
  en_cours_souscription: "Souscription en cours",
  attente_accord_banque: "En attente de l'accord de la banque",
  attente_prise_effet: "En attente de prise d'effet",
  attente_reglement: "Finalisation"
};

/**
 * Tout ce que le client voit dans son espace : ses contrats, ses demandes en
 * cours, les documents partagés ou à signer, les pièces demandées. Aucune
 * note interne, aucune commission.
 */
export async function GET() {
  const id = await clientPortail();
  if (!id) return NextResponse.json({ ok: false, error: "non_connecte" }, { status: 401 });
  const [{ data: c }, { data: dossiers }, { data: docs }, { data: demandes }, { data: conf }] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("prenom, nom, email").eq("id", id).single(),
    supabaseAdmin.from("gpf_dossiers").select("id, produit, statut, contrat_statut, assureur_nom, reference_contrat, date_effet, prime_mensuelle, prime_annuelle").eq("client_id", id).is("deleted_at", null),
    supabaseAdmin.from("gpf_documents").select("id, type, nom_fichier, date_reception, created_at, visible_client, depose_par_client").eq("client_id", id).is("deleted_at", null),
    supabaseAdmin.from("gpf_portal_requests").select("id, libelle, statut, created_at, recue_at").eq("client_id", id).neq("statut", "annulee").order("created_at", { ascending: false }),
    supabaseAdmin.from("gpf_compliance").select("type, document_id, signature_statut, statut").eq("client_id", id)
  ]);
  if (!c) return NextResponse.json({ ok: false, error: "non_connecte" }, { status: 401 });
  const aSigner = new Set((conf ?? []).filter((x) => x.signature_statut === "a_signer" && x.statut !== "fait" && x.document_id).map((x) => x.document_id));
  const produit = (p: string) => GPF_PRODUIT_LABEL[p as GpfProduit] ?? p;

  return NextResponse.json({
    ok: true,
    client: c,
    contrats: (dossiers ?? [])
      .filter((d) => d.contrat_statut || GPF_STATUTS_SIGNES.has(d.statut))
      .map((d) => ({ id: d.id, produit: produit(d.produit), compagnie: d.assureur_nom, reference: d.reference_contrat, date_effet: d.date_effet, prime_mensuelle: d.prime_mensuelle, prime_annuelle: d.prime_annuelle, resilie: d.contrat_statut === "resilie" })),
    enCours: (dossiers ?? [])
      .filter((d) => !d.contrat_statut && !GPF_STATUTS_SIGNES.has(d.statut) && !GPF_STATUTS_CLOS.has(d.statut as GpfStatut))
      .map((d) => ({ id: d.id, produit: produit(d.produit), etape: ETAPE_CLIENT[d.statut] ?? "En cours" })),
    documents: (docs ?? [])
      .filter((d) => d.visible_client || d.depose_par_client || aSigner.has(d.id))
      .map((d) => ({ id: d.id, type: d.type, nom: d.nom_fichier, date: d.date_reception ?? d.created_at.slice(0, 10), aSigner: aSigner.has(d.id), deposeParVous: d.depose_par_client })),
    demandes: demandes ?? []
  });
}
