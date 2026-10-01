import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Pas de marché de maisons statistiquement fiable (34 ventes, sous le seuil de 50).
export const puteaux: VilleData = {
  slug: "puteaux",
  nom: "Puteaux",
  type: "commune",
  codesPostaux: ["92800"],
  departement: "92",
  villesVoisines: ["courbevoie", "nanterre", "neuilly-sur-seine"],
  quartiers: ["Bergères", "Centre", "Défense", "Mairie"],
  profilImmobilier:
    "Puteaux concentre environ les deux tiers du quartier d’affaires de La Défense sur son territoire, ce qui en fait l’une des communes les plus denses et les plus chères de ce secteur du 92. Le marché est presque exclusivement composé d’appartements, souvent dans des tours récentes.",
  prixM2: {
    appartements: { valeur: 7034, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: null
  },
  population: { valeur: 44002, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de cadres qui travaillent à La Défense, avec des capitaux empruntés élevés compte tenu du prix au m². Les prêts à deux emprunteurs sont fréquents, et chaque point de taux d’assurance représente une somme importante sur ce type de capital.",
  accesBureau:
    "Le cabinet de GP Finances est à Issy-les-Moulineaux. Pour les habitants de Puteaux, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Au cœur de La Défense : prix élevés, surtout des tours.",
  faqLocales: [
    {
      q: "Je travaille à La Défense et j’ai acheté un appartement à Puteaux pour un capital important : l’assurance a-t-elle un vrai impact ?",
      r: "Oui, et c’est justement sur les capitaux élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme bien plus importante que sur un petit emprunt."
    },
    {
      q: "Le marché à Puteaux est surtout fait d’appartements en tour, avec très peu de maisons : est-ce que ça change quelque chose pour l’assurance ?",
      r: "Non, le type de bien n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon, qu’il s’agisse d’un appartement ou d’une maison."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Puteaux ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Bergères, Centre, Défense, Mairie", source: "TODO_VERIFIER — liste reprise d’un agrégateur, pas recoupée directement avec le site officiel de la mairie de Puteaux cette session" },
    { fait: "Puteaux concentre environ les deux tiers de La Défense", source: "Wikipédia « La Défense » ; Larousse, « Quartier de la Défense »" },
    { fait: "Seulement 34 ventes de maisons recensées en 2024-2025", source: "DGFiP, base DVF (data.gouv.fr), voir src/content/localData92.json" }
  ],
  meta: {
    title: "Assurance emprunteur à Puteaux | GP Finances",
    description:
      "Changez d’assurance de prêt à Puteaux avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine. Utile pour les cadres de La Défense."
  }
};
