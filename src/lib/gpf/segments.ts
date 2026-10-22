import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { normSource } from "@/lib/gpf/sources";
import { GPF_STATUTS_CLOS, GPF_STATUTS_SIGNES, formatNom, type GpfStatut } from "@/lib/gpf/types";

export type Filtres = {
  type?: "tous" | "leads" | "clients";
  produit?: string; // a une affaire ou un contrat sur ce produit
  sansProduit?: string; // n'a pas ce produit (vente croisée)
  statut?: string; // étape d'une affaire
  source?: string;
  score?: string;
  typeContact?: string;
  creeDepuisJours?: number;
  inactifDepuisJours?: number; // aucun contact depuis N jours
  avecEmail?: boolean;
};

export type Membre = { id: string; nom: string; email: string | null; telephone: string | null; prenom: string; nomFamille: string; desabo_token: string | null; desabonne: boolean };

/** Contacts correspondant aux filtres d'un segment (désabonnés signalés à part). */
export async function membresSegment(f: Filtres): Promise<Membre[]> {
  const [{ data: clients }, { data: dossiers }] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_dossiers").select("client_id, produit, statut, contrat_statut").is("deleted_at", null)
  ]);
  const par = new Map<string, { produit: string; statut: string; contrat_statut: string | null }[]>();
  for (const d of dossiers ?? []) par.set(d.client_id, [...(par.get(d.client_id) ?? []), d]);
  const maintenant = Date.now();

  return (clients ?? [])
    .filter((c) => {
      const ds = par.get(c.id) ?? [];
      const client = ds.some((d) => (d.contrat_statut ? d.contrat_statut !== "resilie" : GPF_STATUTS_SIGNES.has(d.statut)));
      if (f.type === "leads" && client) return false;
      if (f.type === "clients" && !client) return false;
      if (f.produit && !ds.some((d) => d.produit === f.produit && !GPF_STATUTS_CLOS.has(d.statut as GpfStatut))) return false;
      if (f.sansProduit && ds.some((d) => d.produit === f.sansProduit)) return false;
      if (f.statut && !ds.some((d) => d.statut === f.statut)) return false;
      if (f.source && normSource(c.provenance ?? c.source) !== f.source) return false;
      if (f.score && c.score !== f.score) return false;
      if (f.typeContact && (c.type_contact ?? "particulier") !== f.typeContact) return false;
      if (f.creeDepuisJours && maintenant - new Date(c.created_at).getTime() > f.creeDepuisJours * 86400000) return false;
      if (f.inactifDepuisJours) {
        const dernier = c.dernier_contact_at ?? c.created_at;
        if (maintenant - new Date(dernier).getTime() < f.inactifDepuisJours * 86400000) return false;
      }
      if (f.avecEmail && !c.email) return false;
      return true;
    })
    .map((c) => ({ id: c.id, nom: formatNom(c), prenom: c.prenom, nomFamille: c.nom, email: c.email, telephone: c.telephone, desabo_token: c.desabo_token ?? null, desabonne: Boolean(c.desabonne_at) }));
}
