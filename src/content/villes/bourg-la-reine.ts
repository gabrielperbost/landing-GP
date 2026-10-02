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
    "Deux profils cohabitent à Bourg-la-Reine : des familles qui s’installent durablement dans une maison, et des cadres qui investissent dans un appartement pour profiter de la desserte directe vers Paris. Les dossiers à deux emprunteurs sont fréquents, et la question de la répartition de la quotité revient souvent.",
  accesBureau:
    "Le cabinet de GP Finances se trouve à Issy-les-Moulineaux. Les échanges avec les emprunteurs de Bourg-la-Reine passent le plus souvent par téléphone ou par visio, un rendez-vous au cabinet restant possible sur demande.",
  angleEditorial: "Entre ville et maison : deux profils d’emprunteurs à Bourg-la-Reine.",
  faqLocales: [
    {
      q: "Nous empruntons à deux pour acheter à Bourg-la-Reine : comment se répartit la quotité ?",
      r: "Il n’y a pas de règle imposée : la quotité se décide entre vous, à parts égales ou selon vos revenus respectifs. Je m’assure surtout qu’elle protège correctement votre foyer en cas de coup dur."
    },
    {
      q: "Mon entreprise m’a inscrit à une prévoyance collective : est-ce que ça remplace les garanties de l’assurance de prêt ?",
      r: "Non, pas automatiquement les mêmes : la prévoyance d’entreprise couvre surtout votre rémunération en cas d’arrêt de travail, tandis que l’assurance de prêt protège spécifiquement le remboursement du crédit. Les deux ont leur utilité propre."
    },
    {
      q: "Nous avons un prêt sur 20 ans signé il y a 6 ans à Bourg-la-Reine : est-ce trop tard pour comparer les contrats ?",
      r: "Non, l’ancienneté du prêt n’a aucune incidence : vous pouvez comparer et changer d’assurance à tout moment, même plusieurs années après la signature."
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
