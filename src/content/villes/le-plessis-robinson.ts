import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const lePlessisRobinson: VilleData = {
  slug: "le-plessis-robinson",
  nom: "Le Plessis-Robinson",
  type: "commune",
  codesPostaux: ["92350"],
  departement: "92",
  villesVoisines: ["chatenay-malabry", "clamart", "sceaux"],
  quartiers: ["Jean Jaurès", "Anatole France", "Hachette", "Architecte"],
  profilImmobilier:
    "Le Plessis-Robinson s’est fait connaître pour sa rénovation urbaine autour de la cité-jardin, l’ensemble historique des années 1920-1930 aux façades classiques organisées autour de jardins et de places. Le marché y est équilibré entre appartements de ces quartiers rénovés et maisons plus anciennes.",
  prixM2: {
    appartements: { valeur: 5599, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 6436, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 28848, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles séduites par le cadre urbain particulier de la commune, avec des prêts qui dépassent souvent 20 à 25 ans. Les dossiers à deux emprunteurs sont majoritaires, et beaucoup de ces familles n’ont jamais comparé leur assurance depuis l’achat.",
  accesBureau:
    "GP Finances reçoit à Issy-les-Moulineaux. Pour les emprunteurs du Plessis-Robinson, l’essentiel du suivi se fait par téléphone ou en visio ; un rendez-vous au cabinet reste possible si vous le préférez.",
  angleEditorial: "La cité-jardin : un cadre de vie qui attire les familles.",
  faqLocales: [
    {
      q: "Nous avons emprunté à deux pour notre appartement au Plessis-Robinson : comment se répartit la couverture entre nous ?",
      r: "C’est vous qui décidez de la répartition entre emprunteurs, par exemple 50/50 ou au prorata des revenus. On en discute ensemble avant de finaliser le contrat."
    },
    {
      q: "Nous n’avons jamais comparé notre assurance depuis l’achat au Plessis-Robinson : est-il encore temps ?",
      r: "Oui, l’ancienneté du prêt n’a aucune incidence. Vous pouvez changer d’assurance à tout moment, même plusieurs années après la signature."
    },
    {
      q: "Je suis cadre avec une prévoyance d’entreprise : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt au Plessis-Robinson ?",
      r: "Il y a souvent des recoupements, mais rarement une couverture identique : la prévoyance d’entreprise cesse en général si vous changez d’employeur, ce qui n’est pas le cas de l’assurance de votre prêt."
    }
  ],
  faitsSources: [
    { fait: "Le Plessis-Robinson s’est rénové autour de la cité-jardin, ensemble historique des années 1920-1930 (immeubles organisés autour de jardins et de places)", source: "Cité-jardin — confirmée" },
    { fait: "Quartiers Jean Jaurès, Anatole France, Hachette, Architecte", source: "Zonage IRIS INSEE du Plessis-Robinson (9 IRIS)" }
  ],
  meta: {
    title: "Assurance emprunteur au Plessis-Robinson | GP Finances",
    description:
      "Changez d’assurance de prêt au Plessis-Robinson avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
