import type { VilleData } from "./types.ts";

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
    "Beaucoup de cadres travaillant à Val de Seine, à Paris ou à La Défense, ainsi que des familles en accession secondaire. Les prix élevés poussent souvent à emprunter sur des durées longues et des capitaux importants, ce qui rend le coût de l’assurance de prêt particulièrement sensible. Les prêts dépassent fréquemment 20 à 25 ans, et les dossiers à deux emprunteurs sont majoritaires chez les couples de cadres. Les situations les plus fréquentes : un premier achat avec un apport conséquent, ou un changement d’assurance sur un prêt déjà en cours pour profiter d’un meilleur taux sans toucher au crédit lui-même.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux : un rendez-vous en personne se fait sur place, sans déplacement à prévoir. Une visio ou un appel restent possibles si c’est plus simple pour vous.",
  angleEditorial: "Le cabinet est sur place : le rendez-vous en personne n’est jamais loin.",
  faqLocales: [
    {
      q: "J’ai acheté un logement récent, par exemple dans le Fort d’Issy : puis-je quand même changer d’assurance ?",
      r: "Oui. La loi Lemoine s’applique à tous les prêts immobiliers, quelle que soit la date d’achat ou l’ancienneté du programme. Aucune clause de votre contrat de prêt ne peut vous l’interdire."
    },
    {
      q: "Je travaille à Val de Seine : puis-je passer au cabinet entre deux rendez-vous ?",
      r: "Oui, le cabinet est à Issy-les-Moulineaux même. Un rendez-vous en personne est tout à fait possible ; je peux aussi vous recevoir par téléphone ou en visio si c’est plus pratique pour vous."
    },
    {
      q: "Comment venir au cabinet si je ne suis pas en voiture ?",
      r: "Le cabinet est facilement accessible par la ligne 12 (Mairie d’Issy ou Corentin Celton), le RER C ou le tramway T2, qui desservent tous Issy-les-Moulineaux."
    }
  ],
  faitsSources: [
    { fait: "Ligne 12 du métro (stations Mairie d’Issy, terminus, et Corentin Celton)", source: "RATP ; Wikipédia « Ligne 12 du métro de Paris », « Mairie d’Issy (métro) », « Corentin Celton (métro) »" },
    { fait: "RER C (gares Issy et Issy-Val de Seine)", source: "SNCF Transilien ; Wikipédia « Issy (gare) », « Issy-Val de Seine (gare) »" },
    { fait: "Tramway T2 (arrêt Issy-Val de Seine notamment, correspondance RER C)", source: "RATP, ligne T2 ; Wikipédia « Tramway d’Île-de-France ligne 2 »" },
    { fait: "Val de Seine est un quartier d’affaires qui concentre des sièges d’entreprises (ex. Microsoft, Coca-Cola France, Sodexo, TF1, Accor)", source: "Wikipédia « Val-de-Seine » ; L’Annuaire/Hoodspot, sièges sociaux à Issy-les-Moulineaux" },
    { fait: "Proximité immédiate de Paris, limitrophe du 15e arrondissement (Porte de Versailles)", source: "Géographie — confirmée" },
    { fait: "Le Fort d’Issy est un écoquartier récent ; Les Épinettes et Léon Blum comme noms de quartiers d’usage courant", source: "Noms d’usage — confirmés" }
  ],
  meta: {
    title: "Assurance emprunteur à Issy-les-Moulineaux | GP Finances",
    description:
      "Changez d’assurance de prêt à Issy-les-Moulineaux avec un courtier basé sur place. Étude gratuite, garanties équivalentes, loi Lemoine. Rendez-vous en personne ou en visio."
  }
};
