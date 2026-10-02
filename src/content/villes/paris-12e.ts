import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75112.csv, ventes 2024-2025. Population :
// INSEE, populations de référence 2023 (RP2023), via API Géo. Quartiers : noms des conseils de
// quartier (mairie12.paris.fr, 7 conseils, plus granulaires que les 4 quartiers administratifs).
export const paris12e: VilleData = {
  slug: "paris-12e",
  nom: "Paris 12e",
  type: "arrondissement",
  codesPostaux: ["75012"],
  departement: "75",
  villesVoisines: ["paris-4e", "paris-11e", "paris-20e"],
  quartiers: ["Bercy", "Aligre-Gare de Lyon", "Bel-Air", "Jardin de Reuilly (quartiers administratifs : Bel-Air, Picpus, Bercy, Quinze-Vingts)"],
  profilImmobilier:
    "Le 12e doit une partie de sa superficie au bois de Vincennes, qui occupe près des deux tiers du territoire. Le bâti est contrasté : ateliers du Faubourg Saint-Antoine reconvertis en lofts atypiques, immeubles récents du quartier de Bercy, et secteurs plus classiques vers Daumesnil.",
  prixM2: {
    appartements: { valeur: 8960, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 2 934 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 138024, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si vous achetez un ancien atelier reconverti en loft dans le Faubourg Saint-Antoine, la configuration du bien (mezzanine, surface atypique) est à regarder avec attention au moment du prêt. Le secteur de Bercy, plus récent, concerne davantage les achats en programme neuf.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 12e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Entre ateliers reconvertis du Faubourg Saint-Antoine et constructions récentes de Bercy.",
  faqLocales: [
    {
      q: "Nous achetons un ancien atelier reconverti en loft dans le 12e : le dossier d’assurance est-il différent d’un appartement classique ?",
      r: "Non, l’assurance de prêt porte sur vous, l’emprunteur, pas sur le type de bien : le questionnaire et les garanties restent les mêmes, qu’il s’agisse d’un atelier reconverti ou d’un appartement haussmannien."
    },
    {
      q: "Nous achetons un appartement neuf à Bercy : la loi Lemoine s’applique-t-elle aussi aux programmes récents ?",
      r: "Oui, le droit de changer d’assurance de prêt s’applique à tous les prêts immobiliers, sans condition d’ancienneté du programme ou de la construction."
    },
    {
      q: "Nous empruntons à deux pour notre achat dans le 12e : comment répartir la quotité entre nous ?",
      r: "Vous choisissez librement la répartition, par exemple 50/50 ou selon vos revenus, du moment que la somme des deux quotités atteint au moins 100 % ; chacun peut aussi choisir un assureur différent."
    }
  ],
  faitsSources: [
    { fait: "Le bois de Vincennes occupe près des deux tiers de la superficie du 12e (16,32 km² au total)", source: "Wikipédia (en) « 12th arrondissement of Paris »" },
    { fait: "Le Faubourg Saint-Antoine est un ancien quartier d’artisans du meuble, aux ateliers aujourd’hui en partie reconvertis en logements", source: "Wikipédia (en) « 12th arrondissement of Paris »" },
    { fait: "Quartiers administratifs officiels : Bel-Air, Picpus, Bercy, Quinze-Vingts ; 7 conseils de quartier officiels, plus granulaires (dont Bercy, Aligre-Gare de Lyon, Jardin de Reuilly)", source: "mairie12.paris.fr, pages des conseils de quartier" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 12e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 12e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
