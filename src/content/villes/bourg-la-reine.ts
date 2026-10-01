import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : découpage INSEE (voir faitsSources).
export const bourgLaReine: VilleData = {
  slug: "bourg-la-reine",
  nom: "Bourg-la-Reine",
  type: "commune",
  codesPostaux: ["92340"],
  departement: "92",
  villesVoisines: ["sceaux", "antony"],
  quartiers: ["Centre Ville", "La Faïencerie", "Les Blagis", "Mirebeau"],
  profilImmobilier:
    "Petite commune résidentielle à la limite du 92 et de l’Essonne, Bourg-la-Reine combine un centre-ville dense en appartements et des secteurs plus pavillonnaires. La desserte directe vers Paris en fait une commune recherchée par les familles comme par les cadres. Les secteurs de la Faïencerie et des Blagis, plus excentrés, offrent des prix légèrement plus accessibles que le centre-ville.",
  prixM2: {
    appartements: { valeur: 5171, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7217, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 21019, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Un mélange de familles qui achètent une maison pour s’installer durablement, et de cadres qui investissent dans un appartement proche de Paris. Les dossiers à deux emprunteurs sont fréquents, et la question de la répartition de la quotité revient souvent.",
  accesBureau:
    "Le cabinet de GP Finances se trouve à Issy-les-Moulineaux. Les échanges avec les emprunteurs de Bourg-la-Reine passent le plus souvent par téléphone ou par visio, un rendez-vous au cabinet restant possible sur demande.",
  angleEditorial: "Entre ville et maison : deux profils d’emprunteurs à Bourg-la-Reine.",
  faqLocales: [
    {
      q: "Nous hésitons entre acheter un appartement en centre-ville ou une maison à Bourg-la-Reine : cela change-t-il l’assurance ?",
      r: "Non, le type de bien n’a pas d’impact sur vos droits. Ce qui détermine le tarif de l’assurance, c’est le capital emprunté, votre âge et votre état de santé."
    },
    {
      q: "Nous empruntons à deux pour acheter à Bourg-la-Reine : comment se répartit la quotité ?",
      r: "Vous choisissez la répartition (par exemple 50/50 ou selon les revenus de chacun). C’est un point que j’étudie avec vous pour éviter une mauvaise protection en cas de coup dur."
    },
    {
      q: "Le changement d’assurance a-t-il un coût à Bourg-la-Reine comme ailleurs ?",
      r: "Non, c’est gratuit partout en France. Votre banque ne peut pas non plus modifier le taux de votre crédit parce que vous changez d’assurance."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre Ville, La Faïencerie, Les Blagis, Mirebeau", source: "Découpage INSEE de Bourg-la-Reine (8 quartiers statistiques)" }
  ],
  meta: {
    title: "Assurance emprunteur à Bourg-la-Reine | GP Finances",
    description:
      "Changez d’assurance de prêt à Bourg-la-Reine avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
