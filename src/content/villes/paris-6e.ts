import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75106.csv, ventes 2024-2025. Population :
// INSEE RP2023, via API Géo. Quartiers : la mairie du 6e compte 6 conseils de quartier (Odéon,
// Saint-Germain-des-Prés, Rennes, Monnaie, Saint-Placide, Notre-Dame-des-Champs), en partie
// différents des 4 quartiers administratifs officiels.
export const paris6e: VilleData = {
  slug: "paris-6e",
  nom: "Paris 6e",
  type: "arrondissement",
  codesPostaux: ["75006"],
  departement: "75",
  villesVoisines: ["paris-1er", "paris-5e", "paris-7e"],
  quartiers: ["Saint-Germain-des-Prés", "Odéon", "Rennes", "Notre-Dame-des-Champs (quartiers administratifs : Monnaie, Odéon, Notre-Dame-des-Champs, Saint-Germain-des-Prés)"],
  profilImmobilier:
    "Le 6e arrondissement, entre Saint-Germain-des-Prés et le jardin du Luxembourg, est régulièrement cité comme l’un des plus chers de Paris. Le marché est presque exclusivement composé d’appartements anciens, souvent acquis avec un apport important.",
  prixM2: {
    appartements: { valeur: 14131, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 1 359 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 40389, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Des acheteurs globalement aisés, avec des apports élevés qui réduisent le capital emprunté par rapport au prix du bien. Beaucoup de foyers possèdent déjà un bien, en location ou en résidence secondaire, au moment de cet achat.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 6e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "L’un des arrondissements les plus chers de Paris, entre gros apports et capitaux maîtrisés.",
  faqLocales: [
    {
      q: "Nous empruntons un capital élevé pour notre achat dans le 6e : le calcul de l’assurance change-t-il par rapport à un prêt plus modeste ?",
      r: "Le principe reste le même, le taux s’applique au capital assuré, mais sur un montant élevé, chaque dixième de point représente une somme bien plus importante : d’où l’intérêt de comparer plusieurs offres."
    },
    {
      q: "J’ai déjà un bien en location et j’achète ma résidence principale dans le 6e : comment ça se passe pour les deux assurances ?",
      r: "Chaque prêt a sa propre assurance : celle du bien locatif continue normalement, celle du nouvel achat se négocie indépendamment. C’est souvent l’occasion de renégocier les deux."
    },
    {
      q: "Je suis en profession libérale et j’achète dans le 6e : le questionnaire de santé est-il différent de celui d’un salarié ?",
      r: "Le questionnaire est le même pour tous les emprunteurs ; en revanche, les justificatifs de revenus demandés (bilans, déclarations) diffèrent de ceux d’un salarié."
    }
  ],
  faitsSources: [
    { fait: "Le 6e est régulièrement cité comme l’un des arrondissements parisiens aux prix immobiliers les plus élevés", source: "Wikipédia « 6e arrondissement de Paris »" },
    { fait: "La mairie du 6e compte 6 conseils de quartier (Odéon, Saint-Germain-des-Prés, Rennes, Monnaie, Saint-Placide, Notre-Dame-des-Champs), en partie différents des 4 quartiers administratifs officiels", source: "mairie06.paris.fr, « Conseils de quartier »" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 6e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 6e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
