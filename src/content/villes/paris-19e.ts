import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75119.csv, ventes 2024-2025. Population :
// INSEE, populations de référence 2023 (RP2023), via API Géo. Quartiers : noms des conseils de
// quartier (mairie19.paris.fr, 11 conseils, plus granulaires que les 4 quartiers administratifs).
export const paris19e: VilleData = {
  slug: "paris-19e",
  nom: "Paris 19e",
  type: "arrondissement",
  codesPostaux: ["75019"],
  departement: "75",
  villesVoisines: ["paris-10e", "paris-18e", "paris-20e"],
  quartiers: ["Bassin de la Villette", "Place des Fêtes", "Danube", "Pont de Flandre (quartiers administratifs : La Villette, Pont-de-Flandre, Amérique, Combat)"],
  profilImmobilier:
    "Le 19e est traversé par deux canaux (Saint-Denis et de l’Ourcq) qui se rejoignent près du parc de la Villette, et compte aussi le parc des Buttes-Chaumont. Le bâti contraste un secteur plus ancien autour des Buttes-Chaumont et des constructions plus récentes près du bassin de la Villette.",
  prixM2: {
    appartements: { valeur: 7955, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 2 803 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 178691, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si vous achetez près du bassin de la Villette ou de l’un des deux canaux, c’est souvent dans un immeuble plus récent qu’ailleurs dans l’arrondissement. Le marché privé reste proportionnellement plus restreint que dans le reste de Paris, avec une part de logement social parmi les plus élevées de la capitale.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 19e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Entre deux canaux et deux parcs, un marché privé plus restreint.",
  faqLocales: [
    {
      q: "Nous achetons à deux près du bassin de la Villette, nos revenus sont très différents : comment répartir la quotité ?",
      r: "Rien d’automatique : vous répartissez selon vos revenus respectifs ou à parts égales, du moment que la somme atteint au moins 100 % à vous deux."
    },
    {
      q: "C’est notre premier achat dans le 19e avec un apport limité : le questionnaire de santé est-il un frein ?",
      r: "Pas forcément : les deux conditions à réunir sont une part assurée plafonnée à 200 000 € par personne et un prêt qui s’achève avant vos 60 ans. Sur un premier achat, c’est souvent le cas."
    },
    {
      q: "J’ai terminé le protocole thérapeutique de mon cancer il y a plus de 5 ans, sans rechute : dois-je le déclarer pour mon prêt dans le 19e ?",
      r: "Non, grâce au droit à l’oubli : depuis la fin du protocole thérapeutique, un délai de 5 ans sans rechute suffit à ne plus avoir à déclarer un cancer, ou une hépatite C, dans le questionnaire de santé."
    }
  ],
  faitsSources: [
    { fait: "Le 19e est traversé par le canal Saint-Denis et le canal de l’Ourcq, qui se rejoignent près du parc de la Villette", source: "Wikipédia (en) « 19th arrondissement of Paris »" },
    { fait: "Le 19e a la part de logement social la plus élevée des arrondissements de ce lot (45,2 % des résidences principales au 1er janvier 2023)", source: "Atelier Parisien d’Urbanisme (APUR), note n°253, « Les chiffres du logement social à Paris, en 2023 » (juin 2024)" },
    { fait: "Quartiers administratifs officiels : La Villette, Pont-de-Flandre, Amérique, Combat ; 11 conseils de quartier officiels, plus granulaires (dont Bassin de la Villette, Place des Fêtes, Danube)", source: "mairie19.paris.fr, « Les conseils de quartier du 19e »" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 19e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 19e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
