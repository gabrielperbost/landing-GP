import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_STATUTS_CLOS, GPF_STATUTS_SIGNES, type GpfStatut } from "@/lib/gpf/types";

export type DossierP = Record<string, unknown> & {
  id: string;
  client_id: string;
  produit: string;
  statut: string;
  contrat_statut?: string | null;
  date_signature?: string | null;
  date_effet: string | null;
  assureur_nom: string | null;
  precompte_lineaire_1ere_annee: number | null;
  frais_dossier: number | null;
  remuneration_apporteur_pct: number | null;
};
export type ClientP = Record<string, unknown> & { id: string; prenom: string; nom: string; type_contact?: string | null; provenance?: string | null; source?: string | null; apporteur_id?: string | null; created_at: string };
export type LigneP = {
  id: string;
  bordereau_id: string;
  dossier_id: string | null;
  client_nom_brut: string;
  type_commission: string;
  periode_debut: string | null;
  periode_fin: string | null;
  montant: number;
  montant_attendu: number | null;
  retrocession: number | null;
  net_cabinet: number | null;
  rapprochement: string | null;
  created_at: string;
  insurer_id: string | null;
};

/** Un dossier est un contrat en portefeuille (avec repli avant la migration 006). */
export const estContrat = (d: DossierP) => (d.contrat_statut != null ? d.contrat_statut !== "resilie" : GPF_STATUTS_SIGNES.has(d.statut));
export const estSigne = (d: DossierP) => d.contrat_statut != null || GPF_STATUTS_SIGNES.has(d.statut);
export const estPerdu = (d: DossierP) => GPF_STATUTS_CLOS.has(d.statut as GpfStatut);
export const commissionEstimee = (d: DossierP) => Number(d.precompte_lineaire_1ere_annee ?? 0) + Number(d.frais_dossier ?? 0);
export const moisDe = (l: Pick<LigneP, "periode_fin" | "periode_debut" | "created_at">) => (l.periode_fin ?? l.periode_debut ?? l.created_at).slice(0, 7);
export const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Les 12 (ou n) derniers mois au format AAAA-MM, du plus ancien au plus récent. */
export function derniersMois(n = 12, now = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

/** Compagnie normalisée d'un dossier, rattachée à la liste des compagnies partenaires. */
export function compagnieDe(nom: string | null | undefined, insurers: { nom: string }[]): string {
  const v = (nom ?? "").trim().toLowerCase();
  if (!v) return "Non renseignée";
  const hit = insurers.find((i) => v.includes(i.nom.toLowerCase()) || i.nom.toLowerCase().includes(v.split(/[\s/]/)[0]));
  return hit?.nom ?? nom!.trim();
}

/** Toutes les données utiles au pilotage des commissions et au reporting. */
export async function chargerPilotage() {
  const [d, c, i, a, b, l] = await Promise.all([
    supabaseAdmin.from("gpf_dossiers").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_clients").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_insurers").select("*").order("nom"),
    supabaseAdmin.from("gpf_apporteurs").select("*").is("deleted_at", null).order("nom"),
    supabaseAdmin.from("gpf_bordereaux").select("*"),
    supabaseAdmin.from("gpf_commission_lines").select("*")
  ]);
  const bordereaux = b.data ?? [];
  const valide = new Map(bordereaux.map((x) => [x.id, x.import_statut ? x.import_statut === "valide" : x.statut_traitement === "valide"]));
  const insurerDuBordereau = new Map(bordereaux.map((x) => [x.id, x.insurer_id as string | null]));
  const lignes: LigneP[] = (l.data ?? [])
    .filter((x) => valide.get(x.bordereau_id) && x.rapprochement !== "ignore")
    .map((x) => ({ ...x, montant: Number(x.montant ?? 0), insurer_id: insurerDuBordereau.get(x.bordereau_id) ?? null }));
  return {
    dossiers: (d.data ?? []) as DossierP[],
    clients: (c.data ?? []) as ClientP[],
    insurers: (i.data ?? []) as { id: string; nom: string; actif?: boolean; contact?: string | null; telephone?: string | null; notes?: string | null; mapping?: unknown }[],
    apporteurs: (a.data ?? []) as { id: string; nom: string; type: string | null; taux_retrocession: number | null; [k: string]: unknown }[],
    bordereaux,
    lignes
  };
}
