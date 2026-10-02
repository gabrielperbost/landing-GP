import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75108.csv, ventes 2024-2025. Population :
// INSEE RP2023, via API Géo. Quartiers : la mairie du 8e compte 7 conseils de quartier, dont
// Triangle d'Or et Monceau, des noms d'usage distincts des 4 quartiers administratifs officiels.
export const paris8e: VilleData = {
  slug: "paris-8e",
  nom: "Paris 8e",
  type: "arrondissement",
  codesPostaux: ["75008"],
  departement: "75",
  villesVoisines: ["paris-1er", "paris-7e", "paris-9e"],
  quartiers: ["Triangle d’Or", "Monceau", "Champs-Élysées", "Europe (quartiers administratifs : Champs-Élysées, Faubourg-du-Roule, Madeleine, Europe)"],
  profilImmobilier:
    "Le 8e arrondissement, autour des Champs-Élysées et du parc Monceau, est un quartier d’affaires où la population résidente reste restreinte par rapport à son activité économique. Le marché, fait de grands appartements anciens, est parmi les plus chers de Paris.",
  prixM2: {
    appartements: { valeur: 12006, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 1 156 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 35317, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si vous achetez un grand appartement patrimonial dans le 8e, l’opération est parfois financée en partie par une donation familiale.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 8e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Grands achats patrimoniaux entre Champs-Élysées et Monceau.",
  faqLocales: [
    {
      q: "J’achète un grand appartement familial dans le 8e en tant que dirigeant d’entreprise : ma prévoyance de mandataire social suffit-elle ?",
      r: "Rarement une couverture équivalente : la prévoyance de dirigeant est souvent plafonnée différemment de l’assurance de prêt. Je compare les deux contrats pour éviter les trous de garantie."
    },
    {
      q: "Notre achat dans le 8e est financé en partie par une donation familiale : cela a-t-il un impact sur l’assurance de prêt ?",
      r: "Non, l’assurance porte sur le prêt et sur vous, l’emprunteur, pas sur l’origine des fonds apportés."
    },
    {
      q: "Je reviens d’expatriation pour acheter dans le 8e : puis-je comparer les assurances comme n’importe quel emprunteur ?",
      r: "Oui, votre statut de retour d’expatriation n’a pas d’incidence particulière sur le droit à la délégation d’assurance : le dossier se construit comme pour tout achat en France."
    }
  ],
  faitsSources: [
    { fait: "Le 8e concentre plus de 180 000 emplois pour une population résidente de 35 300 habitants", source: "Wikipédia « 8e arrondissement de Paris »" },
    { fait: "La mairie du 8e compte 7 conseils de quartier ; Triangle d’Or et Monceau sont des noms d’usage utilisés dans l’immobilier de luxe, distincts des 4 quartiers administratifs officiels (Champs-Élysées, Faubourg-du-Roule, Madeleine, Europe)", source: "mairie08.paris.fr, « Conseils de quartier » ; leshermines.fr, guide du 8e arrondissement" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 8e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 8e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
