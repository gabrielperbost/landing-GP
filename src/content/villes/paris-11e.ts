import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75111.csv, ventes 2024-2025. Population :
// INSEE, populations de référence 2023 (RP2023), via API Géo. Quartiers : noms des conseils de
// quartier (mairie11.paris.fr, 5 conseils, plus granulaires que les 4 quartiers administratifs).
export const paris11e: VilleData = {
  slug: "paris-11e",
  nom: "Paris 11e",
  type: "arrondissement",
  codesPostaux: ["75011"],
  departement: "75",
  villesVoisines: ["paris-3e", "paris-4e", "paris-10e", "paris-12e", "paris-20e"],
  quartiers: ["République-Saint-Ambroise", "Bastille-Popincourt", "Nation-Alexandre-Dumas", "Belleville-Saint-Maur (quartiers administratifs : Folie-Méricourt, Saint-Ambroise, Roquette, Sainte-Marguerite)"],
  profilImmobilier:
    "Le 11e est l’arrondissement le plus dense de Paris, avec un bâti qui mêle faubourgs anciens autour de la Roquette et larges percées haussmanniennes du boulevard Voltaire. Desservi par 8 lignes de métro, le marché est presque exclusivement composé de petites et moyennes surfaces.",
  prixM2: {
    appartements: { valeur: 9875, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 4 383 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 138170, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si c’est un premier achat sur une surface compacte, le 11e reste l’un des arrondissements les mieux desservis de Paris, ce qui pèse souvent dans le choix. Les prêts à deux emprunteurs sont fréquents sur ce type de surface, avec un apport qui varie beaucoup selon le secteur.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 11e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Le plus dense de Paris, pour un premier achat bien desservi.",
  faqLocales: [
    {
      q: "Nous achetons à deux notre premier appartement dans le 11e, sur une petite surface : comment se répartit la quotité ?",
      r: "Vous répartissez la quotité comme vous le souhaitez, par exemple 50/50 ou selon vos revenus respectifs, à condition que la somme atteigne au moins 100 % (chacun peut même aller jusqu’à 100 % de son côté). C’est un point qu’on étudie ensemble avant la mise en place."
    },
    {
      q: "Nous avons signé notre prêt dans le 11e il y a 4 ans : est-il trop tard pour changer d’assurance ?",
      r: "Non, l’ancienneté du prêt n’a aucune incidence : la loi Lemoine permet de comparer et de changer d’assurance à tout moment, sans attendre une date anniversaire."
    },
    {
      q: "Mon entreprise m’a inscrit à une prévoyance collective : est-ce que ça remplace les garanties de l’assurance de prêt dans le 11e ?",
      r: "Pas automatiquement les mêmes garanties : la prévoyance d’entreprise couvre surtout votre rémunération en cas d’arrêt de travail, tandis que l’assurance de prêt protège spécifiquement le remboursement du crédit."
    }
  ],
  faitsSources: [
    { fait: "Le 11e est l’arrondissement le plus dense de Paris (environ 37 600 à 38 850 hab./km² sur 3,67 km²)", source: "Wikipédia (en) « 11th arrondissement of Paris »" },
    { fait: "Desservi par 8 lignes de métro et 25 stations", source: "Wikipédia (en) « 11th arrondissement of Paris »" },
    { fait: "Quartiers administratifs officiels : Folie-Méricourt, Saint-Ambroise, Roquette, Sainte-Marguerite ; 5 conseils de quartier officiels, plus granulaires (République-Saint-Ambroise, Belleville-Saint-Maur, Léon Blum-Folie-Régnault, Nation-Alexandre-Dumas, Bastille-Popincourt)", source: "mairie11.paris.fr, « Les conseils de quartier »" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 11e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 11e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
