import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const nanterre: VilleData = {
  slug: "nanterre",
  nom: "Nanterre",
  type: "commune",
  codesPostaux: ["92000"],
  departement: "92",
  villesVoisines: ["courbevoie", "puteaux", "rueil-malmaison"],
  quartiers: ["Centre", "Université", "Petit-Nanterre", "Plateau-Mont-Valérien", "Chemin de l’Île", "Les Groues"],
  profilImmobilier:
    "Préfecture des Hauts-de-Seine et commune la plus peuplée de ce secteur, Nanterre héberge l’université Paris Nanterre et une partie du quartier d’affaires de La Défense côté Groues. Le marché est mixte, avec des prix parmi les plus accessibles du nord du 92.",
  prixM2: {
    appartements: { valeur: 5000, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 6169, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 97783, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Un mélange très large de profils, des jeunes actifs qui achètent un premier appartement aux familles qui investissent dans une maison. Les prêts à deux emprunteurs sont fréquents, avec des budgets plus accessibles que dans les communes immédiatement limitrophes de La Défense. Les étudiants devenus jeunes actifs après un passage par l’université Paris Nanterre font aussi partie des profils que je rencontre régulièrement, souvent pour un tout premier achat.",
  accesBureau:
    "Le cabinet de GP Finances est à Issy-les-Moulineaux. Pour les habitants de Nanterre, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Grande ville mixte, entre université et quartiers d’affaires.",
  faqLocales: [
    {
      q: "Je suis tout juste diplômé de l’université Paris Nanterre et je viens d’acheter mon premier appartement : le questionnaire de santé est-il un frein ?",
      r: "Pas forcément : il est même supprimé si la part assurée est inférieure à 200 000 € par personne et que le prêt se termine avant vos 60 ans, ce qui concerne beaucoup de premiers achats."
    },
    {
      q: "Nous avons emprunté à deux pour notre maison à Nanterre : comment se répartit la couverture entre nous ?",
      r: "Rien d’automatique ici : la quotité se négocie entre vous deux, souvent 50/50 mais parfois ajustée selon les revenus. C’est un choix qu’on affine ensemble."
    },
    {
      q: "Je travaille côté Groues, proche de La Défense, et j’ai une prévoyance d’entreprise : ai-je vraiment besoin de toutes les garanties de l’assurance de prêt ?",
      r: "Pas nécessairement les mêmes garanties : une prévoyance d’entreprise cesse en général dès que vous quittez votre poste, ce qui n’est pas le cas de l’assurance liée à votre prêt."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre, Université, Petit-Nanterre, Plateau-Mont-Valérien, Chemin de l’Île, Les Groues", source: "data.gouv.fr, « Quartiers de la ville de Nanterre » — jeu de données officiel de la ville ; Wikipédia « Quartiers de Nanterre »" },
    { fait: "Nanterre est la préfecture des Hauts-de-Seine", source: "Fait institutionnel — confirmé" }
  ],
  meta: {
    title: "Assurance emprunteur à Nanterre | GP Finances",
    description:
      "Changez d’assurance de prêt à Nanterre avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
