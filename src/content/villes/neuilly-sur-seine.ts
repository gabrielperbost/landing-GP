import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Pas de marché de maisons statistiquement fiable (36 ventes, sous le seuil de 50).
export const neuillySurSeine: VilleData = {
  slug: "neuilly-sur-seine",
  nom: "Neuilly-sur-Seine",
  type: "commune",
  codesPostaux: ["92200"],
  departement: "92",
  villesVoisines: ["levallois-perret", "courbevoie", "puteaux"],
  quartiers: ["Île de la Jatte", "Sablons", "Bagatelle", "Perronet-Chézy", "Longchamp"],
  profilImmobilier:
    "Neuilly-sur-Seine a le prix au m² le plus élevé de tout le département, pour les appartements comme pour les rares maisons vendues. Le secteur de Bagatelle, aux abords du Bois de Boulogne, et l’Île de la Jatte comptent parmi les plus recherchés d’Île-de-France.",
  prixM2: {
    appartements: { valeur: 10417, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: null
  },
  population: { valeur: 59538, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de cadres dirigeants et de professions libérales, avec des capitaux empruntés très élevés. Sur ce type de montant, chaque point de taux d’assurance représente une somme considérable sur la durée du prêt, ce qui rend la délégation d’assurance particulièrement pertinente.",
  accesBureau:
    "Le cabinet est à Issy-les-Moulineaux. Pour les emprunteurs de Neuilly-sur-Seine, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Capitaux très élevés : la délégation d’assurance change tout.",
  faqLocales: [
    {
      q: "Nous empruntons un capital important à Neuilly-sur-Seine : l’écart entre deux contrats d’assurance représente-t-il vraiment une somme importante ?",
      r: "Oui, et c’est justement sur les capitaux les plus élevés que l’écart se chiffre en dizaines de milliers d’euros sur la durée du prêt. C’est le type de dossier où comparer compte le plus."
    },
    {
      q: "Le marché à Neuilly est surtout fait d’appartements : est-ce que ça change quelque chose pour l’assurance ?",
      r: "Non, le type de bien n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon, qu’il s’agisse d’un appartement ou d’une maison."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Neuilly-sur-Seine ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Île de la Jatte, Sablons, Bagatelle, Perronet-Chézy, Longchamp", source: "Ville de Neuilly-sur-Seine (neuillysurseine.fr), page « Rencontrez le Maire dans votre quartier » (tournée officielle des 11 quartiers)" },
    { fait: "Neuilly-sur-Seine a le prix médian au m² le plus élevé du 92 dans ce lot de villes", source: "DGFiP, base DVF (data.gouv.fr), voir src/content/localData92.json" }
  ],
  meta: {
    title: "Assurance emprunteur à Neuilly-sur-Seine | GP Finances",
    description:
      "Changez d’assurance de prêt à Neuilly-sur-Seine avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine. Particulièrement utile sur les gros capitaux."
  }
};
