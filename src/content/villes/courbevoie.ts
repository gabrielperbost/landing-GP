import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : site officiel de la mairie (voir faitsSources).
export const courbevoie: VilleData = {
  slug: "courbevoie",
  nom: "Courbevoie",
  type: "commune",
  codesPostaux: ["92400"],
  departement: "92",
  villesVoisines: ["puteaux", "nanterre", "neuilly-sur-seine"],
  quartiers: ["Cœur de Ville", "Faubourg de l’Arche", "Bécon", "Gambetta"],
  profilImmobilier:
    "Courbevoie accueille une partie du quartier d’affaires de La Défense, qui s’étend en réalité sur plusieurs communes (Courbevoie, Puteaux et Nanterre, Puteaux en concentrant les deux tiers), ce qui en fait l’une des communes les plus chères de ce secteur du 92. Le marché est presque exclusivement composé d’appartements, avec des prix tirés par la proximité immédiate des tours de bureaux. Le secteur du Faubourg de l’Arche, plus récent, et le quartier historique de Bécon offrent deux visages très différents de la commune.",
  prixM2: {
    appartements: { valeur: 6667, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 9196, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 82902, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Si vous travaillez à La Défense et achetez à Courbevoie, le capital emprunté est souvent élevé compte tenu du prix au m². Les prêts à deux emprunteurs sont fréquents, et chaque point de taux d’assurance représente une somme importante sur ce type de capital.",
  accesBureau:
    "Le cabinet est à Issy-les-Moulineaux. Pour les emprunteurs de Courbevoie, souvent pris par leurs horaires à La Défense, le téléphone et la visio permettent d’avancer sans déplacement ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Aux portes de La Défense : des capitaux empruntés souvent élevés.",
  faqLocales: [
    {
      q: "Je travaille à La Défense et j’ai acheté un appartement à Courbevoie pour un capital important : l’assurance a-t-elle un vrai impact ?",
      r: "Oui, et c’est justement sur les capitaux élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme bien plus importante que sur un petit emprunt."
    },
    {
      q: "Le secteur Faubourg de l’Arche est récent : la loi Lemoine s’applique-t-elle aussi aux programmes neufs ?",
      r: "Oui. Le droit de changer d’assurance de prêt s’applique à tous les prêts immobiliers, quelle que soit l’ancienneté du programme ou de la construction."
    },
    {
      q: "Je suis cadre à La Défense, avec peu de disponibilité : comment se passe l’étude si je ne peux pas me déplacer ?",
      r: "L’étude peut se faire entièrement à distance : envoi des documents en ligne, échanges par téléphone ou en visio, signature électronique du dossier."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Cœur de Ville, Faubourg de l’Arche, Bécon, Gambetta", source: "Site officiel de la mairie de Courbevoie, « Les quartiers de Courbevoie »" },
    { fait: "La Défense s’étend sur Puteaux (environ deux tiers du territoire), Courbevoie et Nanterre — pas uniquement sur Courbevoie", source: "Wikipédia « La Défense » ; Larousse, « Quartier de la Défense »" }
  ],
  meta: {
    title: "Assurance emprunteur à Courbevoie | GP Finances",
    description:
      "Changez d’assurance de prêt à Courbevoie avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine. Utile si vous travaillez à La Défense."
  }
};
