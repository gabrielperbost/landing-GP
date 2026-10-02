import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75117.csv, ventes 2024-2025. Population :
// INSEE, populations de référence 2023 (RP2023), via API Géo. Quartiers : noms des conseils de
// quartier (mairie17.paris.fr, 9 conseils, plus granulaires que les 4 quartiers administratifs).
export const paris17e: VilleData = {
  slug: "paris-17e",
  nom: "Paris 17e",
  type: "arrondissement",
  codesPostaux: ["75017"],
  departement: "75",
  villesVoisines: ["paris-8e", "paris-16e", "paris-18e"],
  quartiers: ["Ternes-Maillot", "Courcelles-Wagram", "Batignolles", "Épinettes-Bessières (quartiers administratifs : Ternes, Plaine-de-Monceaux, Batignolles, Épinettes)"],
  profilImmobilier:
    "Le 17e réunit trois visages très différents : le secteur Ternes-Monceau, dense en immeubles haussmanniens ; les Batignolles, ancien quartier populaire transformé par l’écoquartier Clichy-Batignolles et ses constructions récentes ; et les Épinettes, plus industriel à l’origine.",
  prixM2: {
    appartements: { valeur: 10070, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 4 571 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 159212, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si vous achetez un appartement récent dans l’écoquartier Clichy-Batignolles, c’est souvent un programme neuf ou tout juste livré. Le secteur Ternes-Monceau, à l’inverse, concerne presque exclusivement de l’ancien haussmannien.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 17e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Trois visages du 17e : haussmannien, écoquartier récent et ancien quartier industriel.",
  faqLocales: [
    {
      q: "Nous achetons un appartement dans l’écoquartier Clichy-Batignolles : la loi Lemoine s’applique-t-elle à un programme aussi récent ?",
      r: "Oui, la loi Lemoine ne fait aucune distinction selon l’ancienneté du programme : le droit de changer d’assurance s’applique aussi aux constructions neuves."
    },
    {
      q: "Nous avons un prêt sur 20 ans signé il y a 6 ans pour notre appartement du secteur Ternes-Monceau : est-il trop tard pour comparer les contrats ?",
      r: "Non, le temps écoulé depuis la signature ne change rien à vos droits : vous pouvez comparer et changer d’assurance à tout moment, même plusieurs années après."
    },
    {
      q: "Je travaille près du Palais des Congrès et j’ai une prévoyance d’entreprise : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt dans le 17e ?",
      r: "Pas nécessairement les mêmes garanties : une prévoyance d’entreprise cesse en général si vous changez d’employeur, ce qui n’est pas le cas de l’assurance liée à votre prêt."
    }
  ],
  faitsSources: [
    { fait: "Les Batignolles ont fait l’objet d’un vaste écoquartier (Clichy-Batignolles), avec de nombreuses constructions récentes autour du parc Martin Luther King", source: "Wikipédia (en) « 17th arrondissement of Paris »" },
    { fait: "Le Palais des Congrès, grand centre d’exposition et de congrès, ancre un pôle d’affaires dans l’arrondissement", source: "Wikipédia (en) « 17th arrondissement of Paris »" },
    { fait: "Quartiers administratifs officiels : Ternes, Plaine-de-Monceaux, Batignolles, Épinettes ; 9 conseils de quartier officiels, plus granulaires (dont Ternes-Maillot, Courcelles-Wagram, Épinettes-Bessières)", source: "mairie17.paris.fr, « Les conseils de quartier »" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 17e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 17e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
