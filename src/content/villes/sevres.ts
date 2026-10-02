import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const sevres: VilleData = {
  slug: "sevres",
  nom: "Sèvres",
  type: "commune",
  codesPostaux: ["92310"],
  departement: "92",
  villesVoisines: ["chaville", "meudon", "ville-d-avray"],
  quartiers: ["Centre-Ville", "Bruyères", "Garenne-Rive Gauche", "Brancas", "Croix-Bosset-Monesse"],
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
      q: "Nous avons emprunté à deux pour notre maison à Sèvres : comment se répartit la couverture entre nous ?",
      r: "À vous de choisir la clé de répartition entre emprunteurs : 50/50 est fréquent, mais une répartition selon les revenus de chacun est tout aussi possible, du moment que la somme atteint au moins 100 % à vous deux. On en parle avant la mise en place."
    },
    {
      q: "Je viens de Paris et j’ai acheté plus grand à Sèvres : mon capital a beaucoup augmenté, cela change-t-il mon besoin de garanties ?",
      r: "Oui, c’est justement le bon moment pour comparer : plus le capital est élevé, plus l’écart entre deux contrats pèse sur votre budget, et vos besoins de couverture peuvent aussi évoluer avec votre situation."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre-Ville, Bruyères, Garenne-Rive Gauche, Brancas, Croix-Bosset-Monesse", source: "Site officiel de la mairie de Sèvres (sevres.fr), plan « Les quartiers de Sèvres » (8 quartiers officiels, 4 secteurs)" },
    { fait: "Sèvres est connue pour sa manufacture de porcelaine", source: "Manufacture nationale de Sèvres — confirmé" }
  ],
  meta: {
    title: "Assurance emprunteur à Sèvres | GP Finances",
    description:
      "Changez d’assurance de prêt à Sèvres avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
