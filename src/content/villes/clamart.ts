import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const clamart: VilleData = {
  slug: "clamart",
  nom: "Clamart",
  type: "commune",
  codesPostaux: ["92140"],
  departement: "92",
  villesVoisines: ["issy-les-moulineaux", "chatillon", "meudon"],
  quartiers: ["Centre", "Gare", "Galvents-Corby", "Percy-Schneider", "Jardin Parisien", "Plaine", "Trivaux-Garenne"],
  profilImmobilier:
    "Clamart se distingue par une part de maisons élevée pour une commune de cette taille : plus d’une vente sur trois concerne une maison, loin devant la moyenne des communes proches de Paris. Le secteur du Petit Clamart et les abords de la forêt sont particulièrement recherchés par les familles.",
  prixM2: {
    appartements: { valeur: 5533, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7108, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 58576, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles qui achètent une maison pour s’agrandir, à quelques minutes seulement d’Issy-les-Moulineaux. Les prêts dépassent souvent 20 à 25 ans, avec des dossiers à deux emprunteurs majoritaires. La proximité du cabinet facilite souvent un premier rendez-vous en personne, ce qui compte pour certains emprunteurs quand le dossier comporte des questions de santé plus sensibles à expliquer de vive voix.",
  accesBureau:
    "Le cabinet de GP Finances est à Issy-les-Moulineaux, commune limitrophe de Clamart. Un rendez-vous en personne est tout à fait envisageable ; la visio ou le téléphone restent possibles si c’est plus pratique pour vous.",
  angleEditorial: "Beaucoup de maisons, profil familial, à deux pas d’Issy.",
  faqLocales: [
    {
      q: "Nous avons acheté une maison dans le secteur du Petit Clamart : l’assurance de prêt a-t-elle un impact sur ce type de capital ?",
      r: "Oui, et c’est sur les capitaux les plus élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme plus importante."
    },
    {
      q: "Clamart est proche d’Issy-les-Moulineaux : puis-je passer au cabinet directement ?",
      r: "Oui, le cabinet est à Issy, commune limitrophe de Clamart. Un rendez-vous en personne est tout à fait possible, ou par téléphone/visio si c’est plus pratique."
    },
    {
      q: "Le marché de Clamart est surtout fait de maisons : est-ce que ça change quelque chose pour l’assurance ?",
      r: "Non, le type de bien n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon, qu’il s’agisse d’un appartement ou d’une maison."
    }
  ],
  faitsSources: [
    { fait: "7 quartiers officiels : Centre, Gare, Galvents-Corby, Percy-Schneider, Jardin Parisien, Plaine, Trivaux-Garenne", source: "Site officiel de la mairie de Clamart (clamart.fr), « Conseils de quartiers »" },
    { fait: "Le Petit Clamart est un secteur connu (nom d’usage historique), pas l’un des 7 quartiers officiels actuels", source: "TODO_VERIFIER — nom d’usage courant et historique, pas recoupé avec le zonage officiel actuel de la mairie" },
    { fait: "Clamart a une part de maisons élevée pour une commune de cette taille", source: "TODO_VERIFIER — déduit du ratio ventes maisons/appartements dans localData92.json, pas recoupé avec une moyenne départementale officielle" }
  ],
  meta: {
    title: "Assurance emprunteur à Clamart | GP Finances",
    description:
      "Changez d’assurance de prêt à Clamart avec un courtier indépendant, basé juste à côté à Issy-les-Moulineaux. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
