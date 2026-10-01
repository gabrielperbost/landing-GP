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
    "Suresnes s’étend du bord de Seine jusqu’au Mont-Valérien, avec un marché mixte entre appartements du centre et maisons des quartiers résidentiels comme la Cité-Jardins, un ensemble historique du début du 20e siècle. Les prix restent plus accessibles que dans les communes immédiatement au nord.",
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
      q: "Nous achetons une maison dans la Cité-Jardins à Suresnes : l’ancienneté du quartier a-t-elle une incidence sur l’assurance ?",
      r: "Non, l’ancienneté du quartier ou du bien n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon à tous les prêts."
    },
    {
      q: "Suresnes a des quartiers très différents, du Mont-Valérien aux bords de Seine : l’assurance varie-t-elle d’un secteur à l’autre ?",
      r: "Non, ce qui compte, c’est votre profil (âge, santé) et le capital emprunté, pas le quartier précis où se situe le bien."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Suresnes ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
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
