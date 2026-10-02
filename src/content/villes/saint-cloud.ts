import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const saintCloud: VilleData = {
  slug: "saint-cloud",
  nom: "Saint-Cloud",
  type: "commune",
  codesPostaux: ["92210"],
  departement: "92",
  villesVoisines: ["garches", "suresnes", "boulogne-billancourt"],
  quartiers: ["Centre", "Coteaux", "Fouilleuse", "Montretout", "Pasteur", "Val d’Or"],
  profilImmobilier:
    "Saint-Cloud, qui doit une partie de sa réputation à son parc national, a un prix au m² parmi les plus élevés de ce secteur du 92, pour les appartements comme pour les maisons. Le secteur de Montretout et les abords du parc sont particulièrement recherchés.",
  prixM2: {
    appartements: { valeur: 6435, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 9895, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 29855, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Si vous achetez une maison à Saint-Cloud, le capital emprunté est souvent élevé. Sur ce type de montant, chaque point de taux d’assurance représente une somme bien plus importante qu’ailleurs.",
  accesBureau:
    "Le cabinet est à Issy-les-Moulineaux. Pour les emprunteurs de Saint-Cloud, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Cadre résidentiel haut de gamme, capitaux élevés.",
  faqLocales: [
    {
      q: "Nous avons acheté une maison près du parc de Saint-Cloud pour un capital important : l’assurance de prêt a-t-elle vraiment un impact ?",
      r: "Oui, et c’est justement sur les capitaux élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme bien plus importante que sur un petit emprunt."
    },
    {
      q: "Nous avons emprunté à deux pour notre maison à Saint-Cloud : comment se répartit la couverture entre nous ?",
      r: "La répartition n’est pas automatique : vous la fixez vous-même (50/50 ou selon vos revenus respectifs), à condition que la somme des deux quotités atteigne au moins 100 %. Je vous aide à choisir ce qui protège le mieux votre foyer."
    },
    {
      q: "Dois-je me déplacer jusqu’à Issy-les-Moulineaux pour une étude à Saint-Cloud ?",
      r: "Non, les échanges se font le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible si vous le préférez."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre, Coteaux, Fouilleuse, Montretout, Pasteur, Val d’Or", source: "Site officiel de la mairie de Saint-Cloud (saintcloud.fr), « Mon quartier » (6 quartiers officiels)" }
  ],
  meta: {
    title: "Assurance emprunteur à Saint-Cloud | GP Finances",
    description:
      "Changez d’assurance de prêt à Saint-Cloud avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine. Utile sur les gros capitaux."
  }
};
