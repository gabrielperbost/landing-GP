import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75109.csv, ventes 2024-2025. Population :
// INSEE RP2023, via API Géo. Quartiers : la mairie du 9e compte 5 conseils de quartier ;
// « Nouvelle Athènes » et « SoPi » sont des noms d'usage du secteur nord-ouest, distincts des
// 4 quartiers administratifs officiels.
export const paris9e: VilleData = {
  slug: "paris-9e",
  nom: "Paris 9e",
  type: "arrondissement",
  codesPostaux: ["75009"],
  departement: "75",
  villesVoisines: ["paris-2e", "paris-8e", "paris-10e"],
  quartiers: ["Opéra", "Nouvelle Athènes", "Pigalle", "Faubourg-Montmartre (quartiers administratifs : Saint-Georges, Chaussée-d’Antin, Faubourg-Montmartre, Rochechouart)"],
  profilImmobilier:
    "Le 9e arrondissement, autour de l’Opéra Garnier et des Grands Boulevards, mêle immeubles haussmanniens et quartiers plus informels comme la Nouvelle Athènes ou Pigalle. Le marché, surtout composé d’appartements anciens, attire une clientèle plus jeune que dans le cœur historique de Paris.",
  prixM2: {
    appartements: { valeur: 10673, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 2 023 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 57271, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Beaucoup de jeunes actifs et de primo-accédants, souvent avec un apport plus limité que dans les arrondissements voisins du centre. Les statuts professionnels variés (CDD, CDI, auto-entrepreneuriat) se retrouvent fréquemment dans les dossiers.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 9e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Primo-accédants et jeunes actifs entre Opéra et Nouvelle Athènes.",
  faqLocales: [
    {
      q: "Nous sommes un jeune couple primo-accédant dans le 9e, avec un apport limité : l’assurance de prêt pèse-t-elle beaucoup sur notre budget ?",
      r: "Oui, c’est souvent un poste sous-estimé sur un premier achat : comparer les contrats permet fréquemment de gagner plusieurs dizaines d’euros par mois."
    },
    {
      q: "Je suis en CDD renouvelé plusieurs fois pour mon achat dans le 9e : est-ce un frein pour l’assurance de prêt ?",
      r: "Pas un frein en soi : les assureurs regardent la stabilité globale de votre situation (ancienneté, secteur, renouvellements), pas uniquement le type de contrat."
    },
    {
      q: "Nous achetons notre premier bien à deux dans le 9e, sans enfant pour l’instant : faut-il déjà prévoir une quotité pensée pour une famille future ?",
      r: "Pas nécessairement dès l’achat : la quotité peut être ajustée plus tard si votre situation familiale change, via un avenant ou un changement de contrat."
    }
  ],
  faitsSources: [
    { fait: "Le 9e, surnommé « arrondissement de l’Opéra », s’est développé autour du Palais Garnier et des grands magasins pendant la Belle Époque", source: "Wikipédia « 9e arrondissement de Paris »" },
    { fait: "La mairie du 9e compte 5 conseils de quartier ; « Nouvelle Athènes » et « SoPi » sont des noms d’usage du secteur nord-ouest, distincts des 4 quartiers administratifs officiels (Saint-Georges, Chaussée-d’Antin, Faubourg-Montmartre, Rochechouart)", source: "mairie09.paris.fr, « Les conseils de quartier » ; Wikipédia « La Nouvelle Athènes »" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 9e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 9e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
