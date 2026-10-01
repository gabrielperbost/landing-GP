import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const vanves: VilleData = {
  slug: "vanves",
  nom: "Vanves",
  type: "commune",
  codesPostaux: ["92170"],
  departement: "92",
  villesVoisines: ["issy-les-moulineaux", "malakoff", "clamart"],
  quartiers: ["Centre Ancien", "Hauts-de-Vanves", "Jean Jaurès", "Insurrection"],
  profilImmobilier:
    "Vanves est directement limitrophe de Paris (14e et 15e), avec un marché presque exclusivement composé d’appartements. Le quartier du Parc des Expositions et le secteur des Hauts-de-Vanves comptent parmi les plus recherchés.",
  prixM2: {
    appartements: { valeur: 6224, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7956, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 28622, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de jeunes actifs et de couples, souvent sur un premier achat compte tenu de la proximité immédiate de Paris. Les prêts à deux emprunteurs sont fréquents, avec des capitaux empruntés plus élevés que dans les communes plus éloignées de la capitale.",
  accesBureau:
    "Le cabinet est à Issy-les-Moulineaux, commune limitrophe de Vanves. Un rendez-vous en personne est tout à fait envisageable ; la visio ou le téléphone restent possibles si c’est plus pratique pour vous.",
  angleEditorial: "Aux portes de Paris, à deux pas d’Issy.",
  faqLocales: [
    {
      q: "Vanves est juste à côté d’Issy-les-Moulineaux : puis-je passer au cabinet facilement ?",
      r: "Oui, le cabinet est à Issy, commune limitrophe de Vanves. Un rendez-vous en personne est tout à fait possible, ou par téléphone/visio si c’est plus pratique."
    },
    {
      q: "Le marché à Vanves est surtout fait d’appartements proches de Paris : est-ce que ça change quelque chose pour l’assurance ?",
      r: "Non, le type de bien ou la proximité de Paris n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon partout."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Vanves ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre Ancien, Hauts-de-Vanves, Jean Jaurès, Insurrection", source: "Ville de Vanves (vanves.fr), « Conseil de quartier des Hauts-de-Vanves » (confirme au moins ce nom officiel) ; autres noms IRIS INSEE" }
  ],
  meta: {
    title: "Assurance emprunteur à Vanves | GP Finances",
    description:
      "Changez d’assurance de prêt à Vanves avec un courtier indépendant, basé juste à côté à Issy-les-Moulineaux. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
