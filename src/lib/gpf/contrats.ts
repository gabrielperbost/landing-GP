// Règles de calcul communes aux contrats (affichage et alertes).

type ContratLike = {
  produit: string;
  date_effet: string | null;
  date_echeance?: string | null;
  prime_mensuelle?: number | null;
  prime_annuelle?: number | null;
  placement_mensuel?: number | null;
};

/** Prime annualisée : prime annuelle, sinon 12 × prime mensuelle (versements programmés pour l'épargne). */
export function primeAnnuelle(d: ContratLike): number | null {
  if (d.prime_annuelle != null) return Number(d.prime_annuelle);
  if (d.prime_mensuelle != null) return Number(d.prime_mensuelle) * 12;
  if (d.placement_mensuel != null) return Number(d.placement_mensuel) * 12;
  return null;
}

/** Prochaine échéance : date saisie, sinon prochain anniversaire de la date d'effet. */
export function prochaineEcheance(d: ContratLike, now = new Date()): string | null {
  if (d.date_echeance) return d.date_echeance;
  if (!d.date_effet) return null;
  const effet = new Date(d.date_effet + "T00:00:00");
  const next = new Date(now.getFullYear(), effet.getMonth(), effet.getDate());
  if (next < now) next.setFullYear(next.getFullYear() + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

/** Possibilité de résiliation selon le produit (texte affiché sur la fiche contrat). */
export function resiliationPossible(d: ContratLike): string | null {
  if (d.produit === "assurance_emprunteur") {
    return "à tout moment (loi Lemoine), sous réserve de garanties équivalentes acceptées par la banque.";
  }
  if (d.produit === "mutuelle" || d.produit === "prevoyance") {
    const ech = prochaineEcheance(d);
    const unAn = d.date_effet ? new Date(d.date_effet + "T00:00:00") : null;
    if (unAn) unAn.setFullYear(unAn.getFullYear() + 1);
    const apresUnAn = unAn && unAn <= new Date();
    return apresUnAn
      ? "à tout moment après un an de contrat (résiliation infra-annuelle)."
      : `à l'échéance${ech ? ` du ${new Date(ech + "T00:00:00").toLocaleDateString("fr-FR")}` : ""}, ou à tout moment après un an de contrat.`;
  }
  return null;
}
