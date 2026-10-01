import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const sevres: VilleData = {
  slug: "sevres",
  nom: "Sèvres",
  type: "commune",
  codesPostaux: ["92310"],
  departement: "92",
  villesVoisines: ["chaville", "meudon", "ville-d-avray"],
  quartiers: ["Brimborion", "Beauregard-Fontenelles", "Val Allard", "Centre"],
  profilImmobilier:
    "Sèvres, connue pour sa manufacture de porcelaine, s’étend en bord de Seine, entre le pont de Sèvres et les hauteurs plus résidentielles. Le marché y est équilibré entre appartements et maisons, à des prix proches de la moyenne de ce secteur du 92.",
  prixM2: {
    appartements: { valeur: 5442, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 8035, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 22303, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Un mélange de familles qui achètent une maison dans les secteurs plus résidentiels et de jeunes couples qui visent un premier appartement près du pont de Sèvres. Les prêts à deux emprunteurs sont fréquents, avec des durées qui dépassent souvent 20 ans. La proximité de la Manufacture et des quais attire aussi des acheteurs venus de Paris, habitués à des surfaces plus petites et surpris par les volumes disponibles à Sèvres pour un budget comparable.",
  accesBureau:
    "GP Finances est installé à Issy-les-Moulineaux. Depuis Sèvres, l’étude avance le plus souvent par téléphone ou en visio ; un déplacement au cabinet reste une option si vous le préférez.",
  angleEditorial: "Entre Seine et coteaux, un marché équilibré.",
  faqLocales: [
    {
      q: "Nous achetons un appartement près du pont de Sèvres : la loi Lemoine s’applique-t-elle aussi aux programmes récents ?",
      r: "Oui. Le droit de changer d’assurance de prêt s’applique à tous les prêts immobiliers, quelle que soit l’ancienneté du programme ou de la construction."
    },
    {
      q: "Les prix varient entre le bord de Seine et les coteaux à Sèvres : cela a-t-il une incidence sur l’assurance de prêt ?",
      r: "Non, ce qui compte pour le tarif, c’est le capital emprunté et votre profil (âge, santé), pas le secteur précis de Sèvres où se situe le bien."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Sèvres ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Brimborion, Beauregard-Fontenelles, Val Allard, Centre", source: "TODO_VERIFIER — noms simplifiés à partir du zonage IRIS INSEE (10 IRIS) ; la mairie de Sèvres confirme 8 quartiers officiels (sevres.fr) sans en donner les noms exacts dans les pages consultées cette session" },
    { fait: "Sèvres est connue pour sa manufacture de porcelaine", source: "TODO_VERIFIER — fait largement connu (Manufacture nationale de Sèvres), pas recoupé avec une source officielle précise cette session" }
  ],
  meta: {
    title: "Assurance emprunteur à Sèvres | GP Finances",
    description:
      "Changez d’assurance de prêt à Sèvres avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
