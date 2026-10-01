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
      q: "Nous avons acheté dans l’un des quartiers rénovés de la cité-jardin au Plessis-Robinson : cela a-t-il une incidence sur l’assurance ?",
      r: "Non, le style architectural ou l’ancienneté du programme n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon."
    },
    {
      q: "Nous n’avons jamais comparé notre assurance depuis l’achat au Plessis-Robinson : est-il encore temps ?",
      r: "Oui, l’ancienneté du prêt n’a aucune incidence. Vous pouvez changer d’assurance à tout moment, même plusieurs années après la signature."
    },
    {
      q: "Le changement d’assurance a-t-il un coût au Plessis-Robinson ?",
      r: "Non, c’est gratuit. Votre banque ne peut pas non plus modifier le taux de votre crédit parce que vous changez d’assurance."
    }
  ],
  faitsSources: [
    { fait: "Le Plessis-Robinson s’est rénové autour de la cité-jardin, ensemble historique des années 1920-1930 (immeubles organisés autour de jardins et de places)", source: "TODO_VERIFIER — caractérisation ajustée sur votre indication, pas recoupée avec une source patrimoniale précise cette session" },
    { fait: "Quartiers Jean Jaurès, Anatole France, Hachette, Architecte", source: "Zonage IRIS INSEE du Plessis-Robinson (9 IRIS)" }
  ],
  meta: {
    title: "Assurance emprunteur au Plessis-Robinson | GP Finances",
    description:
      "Changez d’assurance de prêt au Plessis-Robinson avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
