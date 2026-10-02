import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75101.csv, ventes 2024-2025, traitées
// comme les communes du 92 (scripts/fetch-local-data-paris.cjs). Population : INSEE RP2023,
// via API Géo (geo.api.gouv.fr), cohérente avec le comparateur de territoires INSEE (75101).
// Quartiers : quartiers administratifs officiels (INSEE/Mairie de Paris) ; dans le 1er, les
// noms d'usage courant coïncident avec eux (confirmé par recoupement avec des sources
// immobilières indépendantes).
export const paris1e: VilleData = {
  slug: "paris-1er",
  nom: "Paris 1er",
  type: "arrondissement",
  codesPostaux: ["75001"],
  departement: "75",
  villesVoisines: ["paris-2e", "paris-3e", "paris-4e", "paris-6e", "paris-7e", "paris-8e"],
  quartiers: ["Saint-Germain-l’Auxerrois", "Les Halles", "Palais-Royal", "Place Vendôme"],
  profilImmobilier:
    "Le 1er arrondissement est le moins peuplé de Paris, avec un marché composé presque exclusivement de petits appartements anciens entre Les Halles, Palais-Royal, Place Vendôme et Saint-Germain-l’Auxerrois. Le secteur Vendôme concentre les biens les plus recherchés, tandis que le pôle Châtelet-Les Halles reste dominé par les commerces et les flux de transport.",
  prixM2: {
    appartements: { valeur: 12239, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 492 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 15114, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Beaucoup d’achats d’investissement locatif ou de pieds-à-terre, sur des surfaces réduites et avec un apport souvent élevé par rapport au capital emprunté. Les profils non-résidents ou expatriés reviennent régulièrement dans les dossiers du 1er.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 1er arrondissement, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Le plus petit arrondissement de Paris, entre pied-à-terre et investissement locatif.",
  faqLocales: [
    {
      q: "Mon achat dans le 1er est un investissement locatif, pas ma résidence principale : l’assurance de prêt fonctionne-t-elle différemment ?",
      r: "Le principe reste le même : l’assureur étudie votre profil d’emprunteur, pas l’usage du bien. Quelques questions supplémentaires sur le type de location peuvent être posées, mais la substitution d’assurance fonctionne à l’identique."
    },
    {
      q: "J’ai un apport très élevé pour mon achat dans le 1er, le crédit est modeste : est-ce que comparer les assurances vaut vraiment le coup ?",
      r: "Oui, même sur un capital emprunté réduit, l’écart de taux entre deux contrats représente souvent plusieurs centaines d’euros sur la durée du prêt."
    },
    {
      q: "Je suis non-résident et j’achète un pied-à-terre dans le 1er : puis-je quand même changer d’assurance de prêt ?",
      r: "Oui, le droit à la délégation ou à la substitution d’assurance s’applique quel que soit votre lieu de résidence ; les démarches se font par courrier ou en ligne, sans qu’il soit nécessaire d’être sur place."
    }
  ],
  faitsSources: [
    { fait: "Le 1er est le moins peuplé des arrondissements parisiens (15 114 habitants, -7 % depuis 2017)", source: "INSEE, comparateur de territoires, commune 75101 (RP2023)" },
    { fait: "Quartiers administratifs officiels : Saint-Germain-l’Auxerrois, Les Halles, Palais-Royal, Place-Vendôme", source: "Mairie de Paris / INSEE, liste des quartiers administratifs de Paris" },
    { fait: "Dans le 1er, les noms d’usage courant coïncident avec les 4 quartiers administratifs (contrairement à d’autres arrondissements)", source: "Recoupement avec des guides immobiliers indépendants (ubiq.fr, jerevedunemaison.com)" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 1er | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 1er avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
