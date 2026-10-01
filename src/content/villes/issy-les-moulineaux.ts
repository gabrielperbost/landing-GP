import type { VilleData } from "./types";

// Chiffres repris tels quels de src/content/localData92.json (DVF/INSEE,
// récupérés le 2026-09-25) — aucune valeur recalculée ou arrondie différemment.
export const issyLesMoulineaux: VilleData = {
  slug: "issy-les-moulineaux",
  nom: "Issy-les-Moulineaux",
  type: "commune",
  codesPostaux: ["92130"],
  departement: "92",
  villesVoisines: ["boulogne-billancourt", "vanves", "clamart"],
  quartiers: ["Centre-Ville", "Le Fort d’Issy", "Les Épinettes", "Corentin Celton", "Léon Blum", "Val de Seine"],
  profilImmobilier:
    "Issy-les-Moulineaux mêle immeubles bourgeois du centre-ville, programmes récents de l’écoquartier du Fort d’Issy et grands ensembles tertiaires du quartier Val de Seine, qui concentre de nombreux sièges d’entreprises. La proximité immédiate de Paris (Porte de Versailles) et la desserte en transports en commun en font l’une des communes les plus recherchées du département.",
  prixM2: {
    appartements: { valeur: 7528, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 8938, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 67669, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de cadres travaillant à Val de Seine, à Paris ou à La Défense, ainsi que des familles en accession secondaire. Les prix élevés poussent souvent à emprunter sur des durées longues et des capitaux importants, ce qui rend le coût de l’assurance de prêt particulièrement sensible.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux : un rendez-vous en personne se fait sur place, sans déplacement à prévoir. Une visio ou un appel restent possibles si c’est plus simple pour vous.",
  angleEditorial: "Ville du bureau : rendez-vous en personne mis en avant.",
  faqLocales: [
    {
      q: "J’ai acheté un logement récent, par exemple dans le Fort d’Issy : puis-je quand même changer d’assurance ?",
      r: "Oui. La loi Lemoine s’applique à tous les prêts immobiliers, quelle que soit la date d’achat ou l’ancienneté du programme. Aucune clause de votre contrat de prêt ne peut vous l’interdire."
    },
    {
      q: "Je travaille à Val de Seine : puis-je passer au cabinet entre deux rendez-vous ?",
      r: "Oui, le cabinet est à Issy-les-Moulineaux même. Un rendez-vous en personne est tout à fait possible ; je peux aussi vous recevoir par téléphone ou en visio si c’est plus pratique pour vous."
    }
  ],
  meta: {
    title: "Assurance emprunteur à Issy-les-Moulineaux | GP Finances",
    description:
      "Changez d’assurance de prêt à Issy-les-Moulineaux avec un courtier basé sur place. Étude gratuite, garanties équivalentes, loi Lemoine. Rendez-vous en personne ou en visio."
  }
};
