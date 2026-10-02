import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const laGarenneColombes: VilleData = {
  slug: "la-garenne-colombes",
  nom: "La Garenne-Colombes",
  type: "commune",
  codesPostaux: ["92250"],
  departement: "92",
  villesVoisines: ["colombes", "bois-colombes", "courbevoie"],
  quartiers: ["Les Vallées", "Centre-Sud", "Centre-Nord", "Champs-Philippe"],
  profilImmobilier:
    "La plus petite commune du secteur nord du 92 en superficie, La Garenne-Colombes a un prix au m² parmi les plus élevés du secteur, avec un marché presque exclusivement composé d’appartements. Le centre-ville, autour de la mairie, concentre l’essentiel des commerces et de la vie locale.",
  prixM2: {
    appartements: { valeur: 6392, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 8220, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 30197, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de jeunes cadres et de couples, souvent sur un premier achat compte tenu du prix au m² élevé pour une commune de cette taille. Les prêts à deux emprunteurs sont fréquents, avec une attention particulière portée à la mensualité globale.",
  accesBureau:
    "Le cabinet de GP Finances se trouve à Issy-les-Moulineaux. Pour les habitants de La Garenne-Colombes, les démarches avancent le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste envisageable sur demande.",
  angleEditorial: "Petite commune recherchée, prix élevés au m².",
  faqLocales: [
    {
      q: "J’ai un peu dépassé mon budget pour acheter à La Garenne-Colombes : l’assurance peut-elle vraiment alléger ma mensualité ?",
      r: "Oui, souvent plus qu’on ne le pense : sur un capital déjà conséquent pour un premier achat, l’écart entre deux contrats se chiffre vite en milliers d’euros sur la durée du prêt."
    },
    {
      q: "Nous achetons notre premier appartement à La Garenne-Colombes à deux : comment se répartit la quotité d’assurance ?",
      r: "À vous de choisir la clé de répartition entre emprunteurs : 50/50 est fréquent, mais une répartition selon les revenus de chacun est tout aussi possible. On en parle avant la mise en place."
    },
    {
      q: "Je suis jeune cadre avec une prévoyance d’entreprise : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt ?",
      r: "Cela dépend de ce que couvre exactement votre contrat collectif : certaines prévoyances d’entreprise sont limitées, d’autres très complètes. Je compare les deux avec vous avant de trancher."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Les Vallées, Centre-Sud, Centre-Nord, Champs-Philippe", source: "Site officiel de la mairie de La Garenne-Colombes (lagarennecolombes.fr), « Conseils de quartier » (4 conseils officiels)" }
  ],
  meta: {
    title: "Assurance emprunteur à La Garenne-Colombes | GP Finances",
    description:
      "Changez d’assurance de prêt à La Garenne-Colombes avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
