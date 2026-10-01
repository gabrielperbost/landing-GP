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
      q: "Le prix au m² est élevé à La Garenne-Colombes pour une si petite commune : l’assurance de prêt suit-elle le même mouvement ?",
      r: "Le coût de l’assurance dépend du capital emprunté, pas directement du prix au m². Sur un capital élevé, comparer les contrats a d’autant plus d’intérêt."
    },
    {
      q: "Nous achetons notre premier appartement à La Garenne-Colombes à deux : comment se répartit la quotité d’assurance ?",
      r: "Vous choisissez la répartition entre les deux emprunteurs (par exemple 50/50). C’est un point que j’étudie avec vous avant la mise en place."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à La Garenne-Colombes ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
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
