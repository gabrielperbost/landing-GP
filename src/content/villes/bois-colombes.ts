import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : site officiel de la mairie (voir faitsSources).
export const boisColombes: VilleData = {
  slug: "bois-colombes",
  nom: "Bois-Colombes",
  type: "commune",
  codesPostaux: ["92270"],
  departement: "92",
  villesVoisines: ["asnieres-sur-seine", "la-garenne-colombes", "colombes"],
  quartiers: ["Centre-Ville", "Quartier Nord", "Quartier Sud"],
  profilImmobilier:
    "Petite commune résidentielle et recherchée, Bois-Colombes a l’un des prix au m² les plus élevés de ce secteur du 92, pour les appartements comme pour les maisons. Le marché y est équilibré entre les deux, avec une proportion de maisons supérieure à la moyenne des communes denses du département. Le centre-ville, autour de la gare, concentre les commerces et la vie locale, tandis que les quartiers nord et sud restent plus résidentiels.",
  prixM2: {
    appartements: { valeur: 6184, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 8000, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 28909, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles et de cadres, avec des capitaux empruntés élevés en particulier pour l’achat d’une maison. Les prêts dépassent souvent 20 à 25 ans, et la quotité entre les deux emprunteurs est une question qui revient fréquemment pour les couples.",
  accesBureau:
    "GP Finances reçoit à Issy-les-Moulineaux. Pour les habitants de Bois-Colombes, le téléphone et la visio restent les moyens les plus simples d’avancer sur un dossier ; le cabinet reste ouvert pour qui préfère un rendez-vous en personne.",
  angleEditorial: "Petite ville recherchée, prix élevés : l’assurance pèse lourd.",
  faqLocales: [
    {
      q: "Nous avons acheté une maison à Bois-Colombes pour un capital important : l’assurance a-t-elle vraiment un impact ?",
      r: "Oui, et c’est justement sur les capitaux élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme bien plus importante que sur un petit emprunt."
    },
    {
      q: "Nous avons emprunté à deux pour notre maison à Bois-Colombes : comment se répartit la couverture entre nous ?",
      r: "La répartition n’est pas automatique : vous la fixez vous-même (50/50 ou selon vos revenus respectifs), et je vous aide à choisir ce qui protège le mieux votre foyer."
    },
    {
      q: "Je suis cadre et j’ai une prévoyance d’entreprise : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt ?",
      r: "Pas toujours les mêmes garanties : votre prévoyance d’entreprise et l’assurance de votre prêt ne couvrent pas exactement les mêmes risques. Je regarde avec vous ce qui est redondant et ce qui ne l’est pas."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre-Ville, Quartier Nord, Quartier Sud", source: "Site officiel de la mairie de Bois-Colombes, « 3 quartiers, 3 identités »" }
  ],
  meta: {
    title: "Assurance emprunteur à Bois-Colombes | GP Finances",
    description:
      "Changez d’assurance de prêt à Bois-Colombes avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
