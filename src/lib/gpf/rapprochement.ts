import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { normNom, normRef, type LigneNormalisee } from "@/lib/gpf/bordereaux";

type DossierRef = {
  id: string;
  client_id: string;
  produit: string;
  reference_contrat: string | null;
  assureur_nom: string | null;
  date_effet: string | null;
  precompte_lineaire_1ere_annee: number | null;
  remuneration_apporteur_pct: number | null;
  contrat_statut?: string | null;
};

export type Contexte = {
  dossiers: DossierRef[];
  nomParClient: Map<string, string>;
  apporteurParClient: Map<string, number | null>;
  regles: { insurer_id: string | null; produit: string; taux_annee1: number | null; taux_suivantes: number | null }[];
  insurerNom: string | null;
  insurerId: string | null;
};

/** Charge en une fois ce qu'il faut pour rapprocher les lignes d'un bordereau. */
export async function chargerContexte(insurerId: string | null): Promise<Contexte> {
  const [{ data: dossiers }, { data: clients }, { data: apporteurs }, { data: regles }, { data: insurer }] = await Promise.all([
    supabaseAdmin.from("gpf_dossiers").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_clients").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_apporteurs").select("id, taux_retrocession"),
    supabaseAdmin.from("gpf_commission_rules").select("insurer_id, produit, taux_annee1, taux_suivantes"),
    insurerId ? supabaseAdmin.from("gpf_insurers").select("nom").eq("id", insurerId).single() : Promise.resolve({ data: null })
  ]);
  const tauxApporteur = new Map((apporteurs ?? []).map((a) => [a.id, a.taux_retrocession as number | null]));
  return {
    dossiers: (dossiers ?? []) as DossierRef[],
    nomParClient: new Map((clients ?? []).map((c) => [c.id, normNom(`${c.prenom} ${c.nom}`)])),
    apporteurParClient: new Map((clients ?? []).map((c) => [c.id, c.apporteur_id ? tauxApporteur.get(c.apporteur_id) ?? null : null])),
    regles: regles ?? [],
    insurerNom: (insurer as { nom?: string } | null)?.nom ?? null,
    insurerId
  };
}

const memeCompagnie = (d: DossierRef, nom: string | null) => Boolean(nom && d.assureur_nom && d.assureur_nom.toLowerCase().includes(nom.toLowerCase().split(/[\s/]/)[0]));
const ecartJours = (a: string | null, b: string | null) => (a && b ? Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000 : Infinity);
// Les taux des règles, des apporteurs et des dossiers sont saisis en % (15 = 15 %).
const pct = (v: number | null | undefined) => (v == null ? null : Number(v) / 100);

/**
 * Rapproche une ligne : par numéro de contrat, sinon par nom (+ compagnie et
 * date d'effet pour départager). Les lignes douteuses partent « À vérifier ».
 */
export function rapprocher(l: LigneNormalisee, ctx: Contexte) {
  let dossier: DossierRef | undefined;
  const ref = normRef(l.reference_contrat);
  if (ref.length >= 4) dossier = ctx.dossiers.find((d) => normRef(d.reference_contrat) === ref);
  if (!dossier && l.client_nom_brut) {
    const nom = normNom(l.client_nom_brut);
    const tokens = new Set(nom.split(" "));
    const candidats = ctx.dossiers.filter((d) => {
      const n = ctx.nomParClient.get(d.client_id);
      if (!n) return false;
      if (n === nom) return true;
      const t = n.split(" ");
      return t.length >= 2 && t.every((x) => tokens.has(x));
    });
    const tri = (d: DossierRef) => (memeCompagnie(d, ctx.insurerNom) ? 0 : 1) * 1000 + Math.min(999, ecartJours(d.date_effet, l.date_effet)) + (d.contrat_statut ? 0 : 0.5);
    dossier = candidats.sort((a, b) => tri(a) - tri(b))[0];
  }

  let attendu: number | null = null;
  if (dossier) {
    const regle =
      ctx.regles.find((r) => r.insurer_id === ctx.insurerId && r.produit === dossier!.produit) ?? ctx.regles.find((r) => !r.insurer_id && r.produit === dossier!.produit);
    const taux = pct(l.type_commission === "nouvelle_affaire" ? regle?.taux_annee1 : regle?.taux_suivantes);
    if (l.base_commission != null && taux != null) attendu = Math.round(l.base_commission * taux * 100) / 100;
    else if (l.type_commission === "nouvelle_affaire" && dossier.precompte_lineaire_1ere_annee) attendu = Number(dossier.precompte_lineaire_1ere_annee);
  }

  const statut = !dossier
    ? "sans_contrat"
    : attendu != null && Math.abs(l.montant - attendu) > Math.max(1, Math.abs(attendu) * 0.02) && l.type_commission !== "decommission"
      ? "ecart"
      : "rapproche";

  const tauxRetro = dossier ? pct(dossier.remuneration_apporteur_pct) ?? pct(ctx.apporteurParClient.get(dossier.client_id)) : null;
  const retrocession = tauxRetro ? Math.round(l.montant * tauxRetro * 100) / 100 : 0;

  return { dossier_id: dossier?.id ?? null, rapprochement: statut, montant_attendu: attendu, retrocession, net_cabinet: Math.round((l.montant - retrocession) * 100) / 100 };
}

/** Recalcule les compteurs d'un bordereau après import ou correction manuelle. */
export async function majCompteurs(bordereauId: string) {
  const { data } = await supabaseAdmin.from("gpf_commission_lines").select("rapprochement, montant").eq("bordereau_id", bordereauId);
  const lignes = data ?? [];
  await supabaseAdmin
    .from("gpf_bordereaux")
    .update({
      nb_lignes: lignes.length,
      nb_rapprochees: lignes.filter((l) => l.rapprochement === "rapproche").length,
      nb_ecarts: lignes.filter((l) => l.rapprochement === "ecart").length,
      nb_sans_contrat: lignes.filter((l) => l.rapprochement === "sans_contrat").length,
      montant_total: Math.round(lignes.reduce((s, l) => s + Number(l.montant ?? 0), 0) * 100) / 100
    })
    .eq("id", bordereauId);
}
