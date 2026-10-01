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
      q: "Nous avons acheté une maison à Rueil-Malmaison, proche du château : cela a-t-il une incidence sur l’assurance de prêt ?",
      r: "Non, le patrimoine ou l’emplacement précis du bien n’a pas d’impact sur vos droits ni sur le tarif de l’assurance."
    },
    {
      q: "Rueil-Malmaison a des quartiers très différents, du Mont-Valérien aux bords de Seine : l’assurance varie-t-elle d’un secteur à l’autre ?",
      r: "Non, ce qui compte, c’est votre profil (âge, santé) et le capital emprunté, pas le quartier précis où se situe le bien."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Rueil-Malmaison ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
    }
  ],
  faitsSources: [
    { fait: "Quartiers (conseils de village) Mont-Valérien, Rueil-sur-Seine, Plaine-Gare, Buzenval, Centre-Ville, Bords de Seine", source: "Site officiel de la mairie de Rueil-Malmaison (villederueil.fr), « Les Conseils de village » (12 villages officiels)" },
    { fait: "Le château de Malmaison, ancienne résidence de Napoléon et Joséphine, est situé à Rueil-Malmaison", source: "TODO_VERIFIER — fait historique largement connu, pas recoupé avec une source patrimoniale précise cette session" }
  ],
  meta: {
    title: "Assurance emprunteur à Rueil-Malmaison | GP Finances",
    description:
      "Changez d’assurance de prêt à Rueil-Malmaison avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
