import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75105.csv, ventes 2024-2025. Population :
// INSEE RP2023, via API Géo. Quartiers : « Quartier Latin », Mouffetard et Jussieu sont des
// noms d'usage courant ; les conseils de quartier du 5e portent en réalité les mêmes noms que
// les 4 quartiers administratifs officiels (confirmé sur mairie05.paris.fr).
export const paris5e: VilleData = {
  slug: "paris-5e",
  nom: "Paris 5e",
  type: "arrondissement",
  codesPostaux: ["75005"],
  departement: "75",
  villesVoisines: ["paris-4e", "paris-6e"],
  quartiers: ["Quartier Latin", "Mouffetard", "Jussieu", "Panthéon (quartiers administratifs : Saint-Victor, Jardin-des-Plantes, Val-de-Grâce, Sorbonne)"],
  profilImmobilier:
    "Le 5e arrondissement correspond au Quartier Latin, autour de la Sorbonne, avec un marché d’appartements anciens où se mêlent grands logements familiaux, petites surfaces étudiantes et biens vers Mouffetard ou Jussieu. C’est l’un des arrondissements historiquement liés à l’université et aux professions académiques.",
  prixM2: {
    appartements: { valeur: 11739, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 1 608 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 55252, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Beaucoup de familles qui achètent un studio ou un deux-pièces pour un enfant étudiant, ainsi que des foyers de longue date liés aux métiers de l’enseignement ou de la recherche. Les dossiers à plusieurs co-emprunteurs, parents et enfants, ne sont pas rares.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 5e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Achats familiaux pour les études, entre Sorbonne et Mouffetard.",
  faqLocales: [
    {
      q: "Nous achetons un studio dans le 5e pour y loger notre enfant étudiant : qui doit être assuré sur le prêt ?",
      r: "Ce sont les emprunteurs inscrits au prêt, le plus souvent vous, les parents, qui doivent être assurés — même si c’est votre enfant qui occupe le logement."
    },
    {
      q: "Je rembourse encore un prêt étudiant personnel en plus de mon prêt immobilier dans le 5e : est-ce pris en compte dans l’assurance ?",
      r: "L’assureur regarde votre taux d’endettement global, mais un crédit étudiant limité n’empêche généralement pas d’obtenir une bonne offre d’assurance."
    },
    {
      q: "Mes parents se portent co-emprunteurs avec moi pour mon achat dans le 5e : comment répartir l’assurance entre nous trois ?",
      r: "La quotité peut se répartir entre plusieurs emprunteurs, pas seulement deux : on définit ensemble une répartition qui protège chacun selon son rôle dans le remboursement."
    }
  ],
  faitsSources: [
    { fait: "Le 5e est le berceau historique du Quartier Latin et de la Sorbonne, fondée en 1257", source: "Wikipédia « 5e arrondissement de Paris »" },
    { fait: "Les conseils de quartier du 5e portent les mêmes noms que les 4 quartiers administratifs officiels (Saint-Victor, Jardin-des-Plantes, Val-de-Grâce, Sorbonne) ; Quartier Latin, Mouffetard et Jussieu sont des noms d’usage courant utilisés dans l’immobilier", source: "mairie05.paris.fr, « Les conseils de quartier » ; homeselect.paris, guide du 5e arrondissement" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 5e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 5e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
