import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : jeu de données officiel de la ville, refonte 2020 (voir faitsSources).
export const colombes: VilleData = {
  slug: "colombes",
  nom: "Colombes",
  type: "commune",
  codesPostaux: ["92700"],
  departement: "92",
  villesVoisines: ["bois-colombes", "la-garenne-colombes", "asnieres-sur-seine"],
  quartiers: ["Centre", "Petit-Colombes", "Europe", "Fossés Jean", "Stade"],
  profilImmobilier:
    "Colombes est l’une des communes les plus peuplées du 92, avec un marché mixte : plus de 500 ventes de maisons recensées sur la période, un volume élevé pour une commune aussi dense. Les quartiers Europe et Petit-Colombes concentrent une partie des transactions.",
  prixM2: {
    appartements: { valeur: 5000, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 6957, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 91053, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Un mélange de familles qui achètent une maison et de primo-accédants qui visent un premier appartement, avec un budget d’entrée plus accessible que les communes limitrophes de Paris. Les dossiers à deux emprunteurs sont fréquents, avec des durées de prêt qui dépassent souvent 20 ans. Ce mélange de profils se retrouve aussi dans les demandes que je reçois : certains cherchent avant tout à sécuriser leur famille (garanties plus complètes), d’autres à réduire la mensualité au maximum sur un premier achat.",
  accesBureau:
    "GP Finances est installé à Issy-les-Moulineaux. Depuis Colombes, l’étude avance généralement par téléphone ou en visio ; un déplacement au cabinet reste une option si vous le préférez.",
  angleEditorial: "Grande ville mixte : beaucoup de maisons, malgré la densité.",
  faqLocales: [
    {
      q: "Nous avons acheté une maison à Colombes : l’assurance de prêt a-t-elle un impact sur ce type de capital ?",
      r: "Oui, et c’est sur les capitaux les plus élevés, souvent liés à l’achat d’une maison, que l’impact est le plus net sur la durée du prêt."
    },
    {
      q: "Nous avons emprunté à deux pour notre maison à Colombes : comment se répartit la couverture entre nous ?",
      r: "La répartition n’est pas automatique : vous la fixez vous-même (50/50 ou selon vos revenus respectifs), et je vous aide à choisir ce qui protège le mieux votre foyer."
    },
    {
      q: "C’est notre premier achat à Colombes et l’apport est limité : le questionnaire de santé est-il un frein ?",
      r: "Pas forcément : il est même supprimé si la part assurée est inférieure à 200 000 € par personne et que le prêt se termine avant vos 60 ans, ce qui concerne beaucoup de premiers achats."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre, Petit-Colombes, Europe, Fossés Jean, Stade", source: "data.gouv.fr, « Quartiers de Colombes (code postal 92700), refonte de 2020 » — jeu de données officiel de la ville" }
  ],
  meta: {
    title: "Assurance emprunteur à Colombes | GP Finances",
    description:
      "Changez d’assurance de prêt à Colombes avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
