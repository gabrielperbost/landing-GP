import type { VilleData } from "./types.ts";

// Population : geo.api.gouv.fr (code INSEE 75115), confirmée par recherche croisée (source
// INSEE, populations de référence 2026). Prix au m² : base DVF (DGFiP, data.gouv.fr),
// communes/75/75115.csv, ventes 2024-2025, traitées avec exactement la même méthode que les
// communes du 92 (scripts/fetch-local-data-paris.cjs) — 5 655 ventes d'appartements analysées,
// largement au-dessus du seuil de fiabilité (50 ventes). Pas de marché de maisons individuelles
// à Paris 15e (15 ventes sur la période, sous le seuil) : champ `maisons` à `null`.
export const paris15e: VilleData = {
  slug: "paris-15e",
  nom: "Paris 15e",
  type: "arrondissement",
  codesPostaux: ["75015"],
  departement: "75",
  villesVoisines: [],
  quartiers: ["Convention", "Vaugirard", "Commerce", "Beaugrenelle", "Dupleix", "Cambronne (quartiers administratifs : Saint-Lambert, Necker, Grenelle, Javel)"],
  profilImmobilier:
    "Paris 15e est le plus peuplé des arrondissements parisiens : un marché presque exclusivement d’appartements, entre un mélange d’immeubles anciens et d’immeubles des années 1960-70 du secteur Convention-Vaugirard, tours plus récentes du Front de Seine à Beaugrenelle, et petits collectifs plus familiaux vers Saint-Lambert. Il n’y a pas de marché de maisons individuelles.",
  prixM2: {
    appartements: { valeur: 9467, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 5 655 transactions", date: "2026-10-01" },
    maisons: null
  },
  population: { valeur: 229713, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-01" },
  profilEmprunteurs:
    "Beaucoup de familles et de couples qui passent d’un premier appartement à un logement plus grand, souvent à deux emprunteurs. La répartition de la quotité d’assurance entre co-emprunteurs est une question qui revient souvent, tout comme le choix entre un 2 et un 3 pièces selon le budget. Les prêts s’étalent le plus souvent sur 20 à 25 ans, et la question de la quotité (50/50, ou une répartition liée aux revenus de chacun) revient à presque chaque étude pour un couple. Autre situation fréquente : un premier emprunteur qui a déjà un crédit en cours et souscrit un second prêt avec son conjoint, ce qui complique parfois la lecture des garanties déjà en place.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux, à la limite du 15e. Pour les emprunteurs parisiens, les échanges se font le plus souvent par téléphone ou en visio ; un rendez-vous en personne à Issy reste possible si vous le préférez.",
  angleEditorial: "Familles et co-emprunteurs : la quotité, un choix à ne pas négliger.",
  faqLocales: [
    {
      q: "Nous empruntons à deux : comment se répartit l’assurance entre co-emprunteurs ?",
      r: "Vous choisissez la répartition de la quotité entre les deux emprunteurs, par exemple 50/50 ou jusqu’à 100/100 chacun : la seule règle est que la somme atteigne au moins 100 %. C’est un point que j’étudie avec vous : une mauvaise répartition peut coûter cher ou mal protéger le foyer en cas de coup dur."
    },
    {
      q: "Nous passons d’un 2 pièces à un 3 pièces dans le 15e : faut-il refaire une demande d’assurance de A à Z ?",
      r: "S’il s’agit d’un nouveau prêt, oui, c’est une nouvelle étude. En revanche, si vous gardez le même prêt et changez seulement d’assurance, la démarche de substitution reste la même quel que soit le type de bien."
    },
    {
      q: "Je suis cadre avec une prévoyance d’entreprise : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt ?",
      r: "Les garanties ne sont pas identiques : la prévoyance d’entreprise s’arrête en général avec le contrat de travail, l’assurance de prêt reste liée au crédit lui-même. On regarde ensemble ce qui est déjà couvert."
    }
  ],
  faitsSources: [
    { fait: "Le Front de Seine (tours des années 1970, dont Beaugrenelle) longe la Seine au nord-ouest de l’arrondissement", source: "Wikipédia « Front de Seine », « Beaugrenelle (centre commercial) »" },
    { fait: "Les 4 quartiers administratifs officiels du 15e sont Saint-Lambert, Necker, Grenelle et Javel", source: "Mairie de Paris / INSEE, découpage officiel des quartiers administratifs de Paris" },
    { fait: "Convention, Vaugirard, Commerce, Beaugrenelle, Dupleix, Cambronne sont les noms d’usage courant retenus pour la page (plus parlants pour les habitants que les 4 quartiers administratifs)", source: "Validé — choix éditorial, noms d’usage courant de quartier ou de station de métro, quartiers administratifs rappelés entre parenthèses" },
    { fait: "Secteur Convention-Vaugirard : mélange d’immeubles anciens et d’immeubles des années 1960-70", source: "Validé — caractérisation confirmée" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 15e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 15e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine. Utile pour les co-emprunteurs et la quotité."
  }
};
