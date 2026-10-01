import type { VilleData } from "./types.ts";

// Population : geo.api.gouv.fr (code INSEE 75115), confirmée par recherche croisée (source
// INSEE, populations de référence 2026). Prix au m² : Notaires du Grand Paris (base BIEN),
// indicateur trimestriel T1 2026, recoupé avec plusieurs observatoires indépendants
// (fourchette 9 235-9 803 €/m² sur la période) — à vérifier sur paris.notaires.fr (carte des
// prix) si une précision au quartier est nécessaire. Pas de marché de maisons individuelles
// à Paris 15e (immeubles collectifs uniquement) : champ `maisons` volontairement à `null`.
export const paris15e: VilleData = {
  slug: "paris-15e",
  nom: "Paris 15e",
  type: "arrondissement",
  codesPostaux: ["75015"],
  departement: "75",
  villesVoisines: [],
  quartiers: ["Necker", "Vaugirard", "Saint-Lambert", "Grenelle", "Javel", "Beaugrenelle", "Convention", "Dupleix", "Cambronne", "Commerce"],
  profilImmobilier:
    "Paris 15e est le plus peuplé des arrondissements parisiens : un marché presque exclusivement d’appartements, entre immeubles haussmanniens du secteur Convention-Vaugirard, tours plus récentes du Front de Seine à Beaugrenelle, et petits collectifs plus familiaux vers Saint-Lambert. Il n’y a pas de marché de maisons individuelles.",
  prixM2: {
    appartements: { valeur: 9500, source: "Notaires du Grand Paris (base BIEN), indicateur T1 2026", date: "2026-10-01" },
    maisons: null
  },
  population: { valeur: 229713, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-01" },
  profilEmprunteurs:
    "Beaucoup de familles et de couples qui passent d’un premier appartement à un logement plus grand, souvent à deux emprunteurs. La répartition de la quotité d’assurance entre co-emprunteurs est une question qui revient souvent, tout comme le choix entre un 2 et un 3 pièces selon le budget.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux, à la limite du 15e. Pour les emprunteurs parisiens, les échanges se font le plus souvent par téléphone ou en visio ; un rendez-vous en personne à Issy reste possible si vous le préférez.",
  angleEditorial: "Familles et co-emprunteurs : la quotité, un choix à ne pas négliger.",
  sectionOrder: ["financing", "profil", "stats", "faq", "neighbors"],
  faqLocales: [
    {
      q: "Nous empruntons à deux : comment se répartit l’assurance entre co-emprunteurs ?",
      r: "Vous choisissez la répartition de la quotité (par exemple 50/50 ou 100/100) entre les deux emprunteurs. C’est un point que j’étudie avec vous : une mauvaise répartition peut coûter cher ou mal protéger le foyer en cas de coup dur."
    },
    {
      q: "Nous passons d’un 2 pièces à un 3 pièces dans le 15e : faut-il refaire une demande d’assurance de A à Z ?",
      r: "S’il s’agit d’un nouveau prêt, oui, c’est une nouvelle étude. En revanche, si vous gardez le même prêt et changez seulement d’assurance, la démarche de substitution reste la même quel que soit le type de bien."
    },
    {
      q: "Le marché du 15e est surtout fait d’appartements : est-ce que ça change quelque chose pour l’assurance ?",
      r: "Non, le type de bien (appartement ou maison) n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon. Ce qui compte, c’est le capital emprunté, votre âge et votre état de santé."
    }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 15e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 15e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine. Utile pour les co-emprunteurs et la quotité."
  }
};
