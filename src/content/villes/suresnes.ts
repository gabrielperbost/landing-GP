import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const suresnes: VilleData = {
  slug: "suresnes",
  nom: "Suresnes",
  type: "commune",
  codesPostaux: ["92150"],
  departement: "92",
  villesVoisines: ["puteaux", "saint-cloud", "rueil-malmaison"],
  quartiers: ["Centre-Ville", "Mont-Valérien", "République", "Écluse-Belvédère", "Liberté", "Cité-Jardins"],
  profilImmobilier:
    "Suresnes s’étend du bord de Seine jusqu’au Mont-Valérien, avec un marché mixte entre appartements du centre et maisons des quartiers résidentiels comme la Cité-Jardins, un ensemble historique construit dans l’entre-deux-guerres. Les prix restent plus accessibles que dans les communes immédiatement au nord.",
  prixM2: {
    appartements: { valeur: 6649, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 8410, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 48956, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Un mélange de familles qui achètent une maison dans les quartiers résidentiels et de jeunes actifs qui visent un premier appartement. Les prêts à deux emprunteurs sont fréquents, avec des durées qui dépassent souvent 20 à 25 ans.",
  accesBureau:
    "Le cabinet de GP Finances est à Issy-les-Moulineaux. Pour les habitants de Suresnes, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Du bord de Seine au Mont-Valérien, un marché mixte.",
  faqLocales: [
    {
      q: "Nous avons emprunté à deux pour notre maison dans la Cité-Jardins à Suresnes : comment se répartit la couverture entre nous ?",
      r: "Rien d’automatique ici : la quotité se négocie entre vous deux, souvent 50/50 mais parfois ajustée selon les revenus, à condition que la somme atteigne au moins 100 %. C’est un choix qu’on affine ensemble."
    },
    {
      q: "Je suis cadre avec une prévoyance d’entreprise : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt à Suresnes ?",
      r: "Non, pas systématiquement : la prévoyance d’entreprise est souvent liée à votre poste et peut s’arrêter en cas de changement d’emploi, contrairement à l’assurance de votre prêt qui reste stable."
    },
    {
      q: "Nous avons un prêt sur 20 ans signé il y a 5 ans à Suresnes : est-il trop tard pour comparer les contrats ?",
      r: "Non, l’ancienneté du prêt n’a aucune incidence : vous pouvez comparer et changer d’assurance à tout moment, même plusieurs années après la signature."
    }
  ],
  faitsSources: [
    { fait: "Quartiers consultatifs Centre-Ville, Mont-Valérien, République, Écluse-Belvédère, Liberté, Cité-Jardins", source: "Ville de Suresnes (suresnes.fr), « Conseils consultatifs de quartier » (6 quartiers officiels)" }
  ],
  meta: {
    title: "Assurance emprunteur à Suresnes | GP Finances",
    description:
      "Changez d’assurance de prêt à Suresnes avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
