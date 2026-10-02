import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const rueilMalmaison: VilleData = {
  slug: "rueil-malmaison",
  nom: "Rueil-Malmaison",
  type: "commune",
  codesPostaux: ["92500"],
  departement: "92",
  villesVoisines: ["nanterre", "suresnes", "saint-cloud"],
  quartiers: ["Mont-Valérien", "Rueil-sur-Seine", "Plaine-Gare", "Buzenval", "Centre-Ville", "Bords de Seine"],
  profilImmobilier:
    "Rueil-Malmaison est l’une des plus grandes communes de ce secteur du 92, avec un marché mixte : près de 400 ventes de maisons recensées, un volume élevé pour une commune de cette taille. Le château de Malmaison, ancienne résidence de Napoléon et Joséphine, marque fortement l’identité de la ville.",
  prixM2: {
    appartements: { valeur: 5485, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7647, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 82874, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Un mélange large de profils, des familles qui achètent une maison aux jeunes actifs qui investissent dans un premier appartement. Les prêts dépassent souvent 20 à 25 ans, avec des dossiers à deux emprunteurs fréquents.",
  accesBureau:
    "GP Finances est basé à Issy-les-Moulineaux. Pour les habitants de Rueil-Malmaison, l’étude se mène généralement par téléphone ou en visio ; un rendez-vous en personne reste organisable sur demande.",
  angleEditorial: "Grande ville mixte, entre patrimoine et quartiers résidentiels.",
  faqLocales: [
    {
      q: "Nous avons emprunté à deux pour notre maison à Rueil-Malmaison : comment se répartit la couverture entre nous ?",
      r: "Vous choisissez la répartition de la quotité (par exemple 50/50 ou selon les revenus de chacun) : c’est un point que j’étudie avec vous avant la mise en place."
    },
    {
      q: "Je suis cadre avec une prévoyance d’entreprise : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt à Rueil-Malmaison ?",
      r: "Tout dépend des garanties incluses dans votre contrat collectif : certaines prévoyances d’entreprise sont minimalistes. Je vous aide à identifier les vrais doublons avant de choisir."
    },
    {
      q: "Nous avons un prêt sur 25 ans signé il y a 8 ans à Rueil-Malmaison : est-il trop tard pour comparer les contrats ?",
      r: "Non, l’ancienneté du prêt n’a aucune incidence : vous pouvez comparer et changer d’assurance à tout moment, même plusieurs années après la signature."
    }
  ],
  faitsSources: [
    { fait: "Quartiers (conseils de village) Mont-Valérien, Rueil-sur-Seine, Plaine-Gare, Buzenval, Centre-Ville, Bords de Seine", source: "Site officiel de la mairie de Rueil-Malmaison (villederueil.fr), « Les Conseils de village » (12 villages officiels)" },
    { fait: "Le château de Malmaison, ancienne résidence de Napoléon et Joséphine, est situé à Rueil-Malmaison", source: "Château de Malmaison — confirmé" }
  ],
  meta: {
    title: "Assurance emprunteur à Rueil-Malmaison | GP Finances",
    description:
      "Changez d’assurance de prêt à Rueil-Malmaison avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
