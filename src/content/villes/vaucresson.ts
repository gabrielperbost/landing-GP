import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Pas de marché de maisons statistiquement fiable (46 ventes, sous le seuil de 50).
export const vaucresson: VilleData = {
  slug: "vaucresson",
  nom: "Vaucresson",
  type: "commune",
  codesPostaux: ["92420"],
  departement: "92",
  villesVoisines: ["garches", "marnes-la-coquette", "saint-cloud"],
  quartiers: ["Château de Vaucresson", "Jardy-Centre Ville", "Plateau de Cazes", "Plateau Théry-Centre Ancien"],
  profilImmobilier:
    "Petite commune résidentielle et très boisée, Vaucresson a un marché très majoritairement tourné vers la maison, même si le nombre de ventes reste trop faible pour donner un prix médian fiable sur ce type de bien. Le secteur de Jardy, proche du golf, est particulièrement recherché.",
  prixM2: {
    appartements: { valeur: 4928, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: null
  },
  population: { valeur: 8432, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles qui achètent une maison pour un capital important, avec des prêts qui dépassent souvent 25 ans. Sur ce type de montant, chaque point de taux d’assurance représente une somme conséquente sur la durée totale du prêt.",
  accesBureau:
    "Le cabinet de GP Finances est à Issy-les-Moulineaux. Pour les habitants de Vaucresson, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Petite commune boisée, maisons et capitaux élevés.",
  faqLocales: [
    {
      q: "Nous avons acheté une maison à Vaucresson pour un capital important : l’assurance de prêt a-t-elle vraiment un impact ?",
      r: "Oui, et c’est justement sur les capitaux élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme bien plus importante que sur un petit emprunt."
    },
    {
      q: "Nous avons emprunté à deux pour notre maison à Vaucresson : comment se répartit la couverture entre nous ?",
      r: "C’est vous qui décidez de la répartition entre emprunteurs, par exemple 50/50 ou au prorata des revenus, la seule règle étant d’atteindre ensemble au moins 100 %. On en discute ensemble avant de finaliser le contrat."
    },
    {
      q: "Je suis dirigeant d’entreprise avec ma propre prévoyance : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt à Vaucresson ?",
      r: "Rarement une couverture identique : une prévoyance de dirigeant est souvent plafonnée différemment de l’assurance de prêt. Je compare les deux contrats pour éviter les trous de garantie."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Château de Vaucresson, Jardy-Centre Ville, Plateau de Cazes, Plateau Théry-Centre Ancien", source: "Zonage IRIS INSEE de Vaucresson (4 IRIS)" },
    { fait: "Seulement 46 ventes de maisons recensées en 2024-2025 (sous le seuil de 50)", source: "DGFiP, base DVF (data.gouv.fr), voir src/content/localData92.json" }
  ],
  meta: {
    title: "Assurance emprunteur à Vaucresson | GP Finances",
    description:
      "Changez d’assurance de prêt à Vaucresson avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
