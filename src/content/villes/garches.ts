import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : zonage IRIS INSEE (voir faitsSources).
export const garches: VilleData = {
  slug: "garches",
  nom: "Garches",
  type: "commune",
  codesPostaux: ["92380"],
  departement: "92",
  villesVoisines: ["saint-cloud", "vaucresson", "marnes-la-coquette"],
  quartiers: ["Mairie", "Buzenval", "Côte Saint-Louis", "La Verboise", "Les Bures"],
  profilImmobilier:
    "Petite commune résidentielle entre Saint-Cloud et Vaucresson, Garches a un marché largement tourné vers la maison, avec des prix parmi les plus élevés de ce secteur du 92. Le quartier de Buzenval et les abords du parc de Saint-Cloud sont particulièrement recherchés.",
  prixM2: {
    appartements: { valeur: 5420, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 8438, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 17743, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles et de cadres supérieurs qui achètent une maison pour un capital important, avec des prêts qui dépassent souvent 25 ans. Sur ce type de montant, chaque point de taux d’assurance représente une somme conséquente sur la durée totale du prêt.",
  accesBureau:
    "Le cabinet est à Issy-les-Moulineaux. Pour les habitants de Garches, l’étude se fait le plus souvent par téléphone ou en visio ; je reste disponible pour un rendez-vous en personne si vous le préférez.",
  angleEditorial: "Maisons et capitaux élevés : l’assurance pèse lourd.",
  faqLocales: [
    {
      q: "Nous avons acheté une maison à Garches pour un capital important : l’assurance de prêt a-t-elle vraiment un impact ?",
      r: "Oui, et c’est justement sur les capitaux élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme bien plus importante que sur un petit emprunt."
    },
    {
      q: "Je suis dirigeant d’entreprise et j’ai ma propre prévoyance : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt à Garches ?",
      r: "Pas forcément les mêmes garanties : votre prévoyance personnelle et l’assurance de votre prêt ne couvrent pas exactement les mêmes risques. Je regarde avec vous ce qui fait doublon et ce qui ne l’est pas."
    },
    {
      q: "Dois-je me déplacer jusqu’à Issy-les-Moulineaux pour une étude à Garches ?",
      r: "Non, les échanges se font le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible si vous le préférez."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Mairie, Buzenval, Côte Saint-Louis, La Verboise, Les Bures", source: "Zonage IRIS INSEE de Garches (8 IRIS)" }
  ],
  meta: {
    title: "Assurance emprunteur à Garches | GP Finances",
    description:
      "Changez d’assurance de prêt à Garches avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine. Utile sur les gros capitaux."
  }
};
