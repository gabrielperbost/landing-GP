import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75102.csv, ventes 2024-2025. Population :
// INSEE RP2023, via API Géo. Quartiers : Gaillon, Vivienne, Mail, Bonne-Nouvelle sont les 4
// quartiers administratifs officiels ; Sentier et Montorgueil sont des noms d'usage courant,
// distincts de ce découpage, confirmés par plusieurs guides immobiliers du secteur.
export const paris2e: VilleData = {
  slug: "paris-2e",
  nom: "Paris 2e",
  type: "arrondissement",
  codesPostaux: ["75002"],
  departement: "75",
  villesVoisines: ["paris-1er", "paris-3e", "paris-9e", "paris-10e"],
  quartiers: ["Sentier", "Montorgueil", "Bourse", "Vivienne (quartiers administratifs : Gaillon, Vivienne, Mail, Bonne-Nouvelle)"],
  profilImmobilier:
    "Le 2e arrondissement, le plus petit de Paris par sa superficie, mêle anciens ateliers du Sentier reconvertis en lofts et immeubles haussmanniens autour de Bourse et Vivienne. Le marché est presque exclusivement composé de petits et moyens appartements, souvent prisés par de jeunes actifs et entrepreneurs du quartier.",
  prixM2: {
    appartements: { valeur: 11171, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 691 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 19847, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Le Sentier, historiquement textile, est aujourd’hui un pôle de start-ups et d’indépendants : les dossiers mêlent souvent salariés et travailleurs non-salariés, parfois au sein d’un même couple d’emprunteurs.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Les échanges avec les emprunteurs du 2e se font le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "D’anciens ateliers du Sentier aux lofts recherchés par les jeunes actifs.",
  faqLocales: [
    {
      q: "Nous achetons à deux dans le 2e, l’un de nous est indépendant et l’autre salarié : est-ce plus compliqué pour l’assurance ?",
      r: "Pas plus compliqué, mais les pièces demandées diffèrent : bilans comptables pour l’indépendant, bulletins de salaire pour l’autre. Chacun peut avoir une quotité différente selon sa situation."
    },
    {
      q: "J’achète mon premier bien dans le 2e, un ancien atelier reconverti : dois-je forcément prendre l’assurance proposée par ma banque ?",
      r: "Non, vous êtes libre de choisir un autre assureur dès la signature, à garanties équivalentes : c’est la délégation d’assurance."
    },
    {
      q: "Je suis en période d’essai dans mon nouvel emploi au moment de l’achat dans le 2e : cela pose-t-il un problème pour l’assurance ?",
      r: "Ça peut être regardé de près par l’assureur, mais ce n’est pas rédhibitoire : j’étudie les options selon votre ancienneté et le type de contrat."
    }
  ],
  faitsSources: [
    { fait: "Le 2e est le plus petit arrondissement de Paris par sa superficie (99 ha)", source: "Wikipédia « 2e arrondissement de Paris »" },
    { fait: "Quartiers administratifs officiels : Gaillon, Vivienne, Mail, Bonne-Nouvelle", source: "Mairie de Paris / INSEE, liste des quartiers administratifs de Paris" },
    { fait: "Sentier et Montorgueil sont des noms d’usage courant, distincts des quartiers administratifs, repris par les agences immobilières du secteur", source: "ulys.immo, joya.fr (guides immobiliers du 2e arrondissement)" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 2e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 2e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
