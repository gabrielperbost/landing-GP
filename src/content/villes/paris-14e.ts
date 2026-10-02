import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75114.csv, ventes 2024-2025. Population :
// INSEE, populations de référence 2023 (RP2023), via API Géo. Quartiers : noms des conseils de
// quartier (mairie14.paris.fr, 6 conseils, plus granulaires que les 4 quartiers administratifs).
export const paris14e: VilleData = {
  slug: "paris-14e",
  nom: "Paris 14e",
  type: "arrondissement",
  codesPostaux: ["75014"],
  departement: "75",
  villesVoisines: ["paris-5e", "paris-6e", "paris-13e", "paris-15e"],
  quartiers: ["Montparnasse-Raspail", "Mouton-Duvernet", "Pernety", "Didot-Plaisance (quartiers administratifs : Montparnasse, Parc-de-Montsouris, Petit-Montrouge, Plaisance)"],
  profilImmobilier:
    "Le 14e s’étend du pôle de la gare Montparnasse jusqu’aux portes du périphérique, avec un bâti qui mêle immeubles haussmanniens vers Raspail et constructions plus récentes vers Plaisance et Porte de Vanves.",
  prixM2: {
    appartements: { valeur: 9343, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 2 834 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 136455, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si vous achetez un bien plus grand pour vous rapprocher du pôle Montparnasse, le marché reste équilibré entre petites surfaces et appartements familiaux selon les secteurs.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 14e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Du pôle Montparnasse aux portes du périphérique.",
  faqLocales: [
    {
      q: "Nous achetons un bien plus grand pour nous rapprocher du pôle Montparnasse, dans le 14e : le capital plus élevé change-t-il le calcul de l’assurance ?",
      r: "Le principe reste le même, mais sur un capital plus élevé, chaque point de taux d’assurance représente une somme plus importante sur la durée du prêt : c’est le type de dossier où comparer compte le plus."
    },
    {
      q: "Je viens de changer d’emploi juste après avoir acheté dans le 14e : dois-je le signaler pour mon assurance de prêt ?",
      r: "Pas automatiquement : ce qui compte pour votre contrat, c’est votre état de santé et votre âge au moment de la souscription, pas votre situation professionnelle future."
    },
    {
      q: "Nous revendons notre appartement pour acheter plus grand dans le 14e, avec un crédit relais en attendant la vente : faut-il aussi assurer ce crédit relais ?",
      r: "Oui : un crédit relais reste un prêt à part entière, qu’il convient d’assurer comme n’importe quel autre crédit. On regarde ensemble si le même niveau de couverture que le prêt principal est pertinent dans votre cas."
    }
  ],
  faitsSources: [
    { fait: "Le 14e abrite une partie du pôle de la gare Montparnasse, terminus ferroviaire majeur", source: "Wikipédia (en) « 14th arrondissement of Paris »" },
    { fait: "Quartiers administratifs officiels : Montparnasse, Parc-de-Montsouris, Petit-Montrouge, Plaisance ; 6 conseils de quartier officiels, plus granulaires (dont Montparnasse-Raspail, Didot-Plaisance-Porte de Vanves)", source: "mairie14.paris.fr, « Conseils de quartier » ; le14participe.paris" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 14e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 14e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
