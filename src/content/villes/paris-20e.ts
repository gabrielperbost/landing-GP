import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75120.csv, ventes 2024-2025. Population :
// INSEE, populations de référence 2023 (RP2023), via API Géo. Quartiers : noms des conseils de
// quartier (mairie20.paris.fr, 7 conseils, plus granulaires que les 4 quartiers administratifs).
export const paris20e: VilleData = {
  slug: "paris-20e",
  nom: "Paris 20e",
  type: "arrondissement",
  codesPostaux: ["75020"],
  departement: "75",
  villesVoisines: ["paris-11e", "paris-12e", "paris-19e"],
  quartiers: ["Ménilmontant", "Belleville", "Gambetta", "Père-Lachaise (quartiers administratifs : Belleville, Saint-Fargeau, Père-Lachaise, Charonne)"],
  profilImmobilier:
    "Le 20e s’est transformé d’un secteur viticole puis industriel en quartier résidentiel au fil du 20e siècle, autour de Belleville, Ménilmontant et Gambetta. Le cimetière du Père-Lachaise, le plus visité au monde, structure une partie du bâti alentour, plus aéré.",
  prixM2: {
    appartements: { valeur: 8286, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 3 631 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 185140, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si vous achetez un ancien atelier ou local industriel reconverti dans le 20e, la configuration du bien est à regarder avec attention. Le marché privé y reste proportionnellement plus restreint que dans le centre de Paris.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 20e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "D’un secteur industriel à un quartier résidentiel, autour du Père-Lachaise.",
  faqLocales: [
    {
      q: "Nous achetons un ancien atelier industriel reconverti dans le 20e : faut-il prévenir l’assureur d’un historique particulier du bâtiment ?",
      r: "Non, l’assureur ne s’intéresse pas à l’historique du bâtiment : votre dossier repose sur votre situation d’emprunteur (âge, santé, profession) et sur le montant emprunté, pas sur le passé industriel du bien."
    },
    {
      q: "Le marché privé est plus restreint dans le 20e qu’ailleurs à Paris : est-ce que ça change quelque chose pour mon assurance de prêt ?",
      r: "Non, la part de logement social dans l’arrondissement n’a aucune incidence sur votre contrat d’assurance : seul compte votre dossier personnel."
    },
    {
      q: "Nous avons emprunté à deux pour notre achat dans le 20e : comment se répartit la couverture entre nous ?",
      r: "Vous décidez ensemble de la répartition, par exemple 50/50 ou selon vos revenus respectifs, la seule contrainte étant d’atteindre au moins 100 % à vous deux."
    }
  ],
  faitsSources: [
    { fait: "Le cimetière du Père-Lachaise, le plus visité au monde, occupe une partie importante du territoire de l’arrondissement", source: "Wikipédia (en) « 20th arrondissement of Paris »" },
    { fait: "Le 20e, d’abord viticole puis industriel jusqu’au milieu du 20e siècle, s’est converti en quartier résidentiel après la fermeture de ses usines", source: "Wikipédia (en) « 20th arrondissement of Paris »" },
    { fait: "Quartiers administratifs officiels : Belleville, Saint-Fargeau, Père-Lachaise, Charonne ; 7 conseils de quartier officiels, plus granulaires (dont Amandiers-Ménilmontant, Gambetta, Réunion-Père Lachaise)", source: "mairie20.paris.fr, pages des conseils de quartier" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 20e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 20e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
