import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Pas de marché de maisons statistiquement fiable (40 ventes, sous le seuil de 50).
export const montrouge: VilleData = {
  slug: "montrouge",
  nom: "Montrouge",
  type: "commune",
  codesPostaux: ["92120"],
  departement: "92",
  villesVoisines: ["malakoff", "chatillon", "bagneux"],
  quartiers: ["Le Vieux Montrouge", "Les Portes de Montrouge", "Ferry-Buffalo", "Jean Jaurès", "Plein Sud"],
  profilImmobilier:
    "Montrouge est directement limitrophe de Paris (14e), ce qui en fait l’une des communes les plus denses et les plus chères de ce secteur du 92. Le marché est tourné presque exclusivement vers l’appartement, avec un prix au m² parmi les plus élevés du sud du département.",
  prixM2: {
    appartements: { valeur: 7102, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: null
  },
  population: { valeur: 46324, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Si vous travaillez à Paris et achetez à Montrouge, le capital emprunté est souvent élevé compte tenu du prix au m². Les prêts à deux emprunteurs sont fréquents, et chaque point de taux d’assurance représente une somme importante sur ce type de capital.",
  accesBureau:
    "GP Finances est installé à Issy-les-Moulineaux. Depuis Montrouge, l’étude avance le plus souvent par téléphone ou en visio ; un déplacement au cabinet reste une option si vous le préférez.",
  angleEditorial: "Aux portes de Paris, prix élevés, surtout des appartements.",
  faqLocales: [
    {
      q: "Je travaille à Paris et j’ai une prévoyance d’entreprise depuis l’achat à Montrouge : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt ?",
      r: "Ça dépend de ce que couvre précisément votre contrat d’entreprise : je vous aide à repérer les garanties qui font vraiment doublon avec l’assurance de prêt, et celles qui ne le sont pas."
    },
    {
      q: "Nous avons emprunté à deux pour notre appartement à Montrouge : comment se répartit la couverture entre nous ?",
      r: "Vous êtes libres de fixer cette répartition (50/50 ou au prorata des revenus, par exemple). Une mauvaise répartition peut mal protéger le foyer, donc je regarde ça avec vous en détail."
    },
    {
      q: "Nous avons un prêt sur 20 ans signé il y a 5 ans à Montrouge : est-il trop tard pour comparer les contrats ?",
      r: "Non, l’ancienneté du prêt n’a aucune incidence : vous pouvez comparer et changer d’assurance à tout moment, même plusieurs années après la signature."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Le Vieux Montrouge, Les Portes de Montrouge, Ferry-Buffalo, Jean Jaurès, Plein Sud", source: "Site officiel de la mairie de Montrouge (ville-montrouge.fr), « Les 6 quartiers de Montrouge »" },
    { fait: "Seulement 40 ventes de maisons recensées en 2024-2025", source: "DGFiP, base DVF (data.gouv.fr), voir src/content/localData92.json" }
  ],
  meta: {
    title: "Assurance emprunteur à Montrouge | GP Finances",
    description:
      "Changez d’assurance de prêt à Montrouge avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
