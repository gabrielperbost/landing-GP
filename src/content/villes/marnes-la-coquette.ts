import type { VilleData } from "./types.ts";

// Population : src/content/localData92.json (INSEE, récupéré le 2026-09-25). Prix au m² :
// volontairement à `null`. Marnes-la-Coquette est la commune la moins peuplée des Hauts-de-Seine
// (1 752 habitants) ; les ventes DVF 2024-2025 ne comptent que 4 appartements et 21 maisons, très
// en dessous du seuil de fiabilité de 50 ventes retenu pour toutes les communes — aucun prix
// médian ni exemple de financement chiffré n'est donc affiché pour cette page.
export const marnesLaCoquette: VilleData = {
  slug: "marnes-la-coquette",
  nom: "Marnes-la-Coquette",
  type: "commune",
  codesPostaux: ["92430"],
  departement: "92",
  villesVoisines: ["garches", "vaucresson", "saint-cloud"],
  quartiers: ["Village"],
  profilImmobilier:
    "Marnes-la-Coquette est la commune la moins peuplée des Hauts-de-Seine, un village résidentiel entouré par le parc de Saint-Cloud et la forêt de Fausses-Reposes. Le nombre de ventes y est trop faible pour donner un prix médian fiable : c’est une commune à part, où chaque transaction est singulière.",
  prixM2: {
    appartements: null,
    maisons: null
  },
  population: { valeur: 1752, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Très peu de transactions chaque année, ce qui rend tout profil type peu représentatif. Les emprunteurs qui achètent ici le font le plus souvent pour un bien unique, avec un accompagnement sur mesure plus que sur des repères statistiques.",
  accesBureau:
    "GP Finances est basé à Issy-les-Moulineaux, à une vingtaine de minutes de Marnes-la-Coquette. Les échanges se font le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Trop peu de ventes pour des repères chiffrés : un accompagnement sur mesure.",
  faqLocales: [
    {
      q: "Marnes-la-Coquette a très peu de ventes recensées : comment estimer le capital typique pour un prêt ici ?",
      r: "Je préfère ne pas donner de chiffre moyen qui ne serait pas fiable sur un si petit nombre de ventes. L’étude se fait directement à partir de votre dossier et de votre projet."
    },
    {
      q: "Notre bien à Marnes-la-Coquette est atypique : cela complique-t-il l’étude d’assurance ?",
      r: "Non, le type ou la singularité du bien n’a pas d’incidence sur vos droits. Ce qui compte, c’est le capital emprunté et votre profil (âge, santé)."
    },
    {
      q: "Nous empruntons à deux pour notre bien à Marnes-la-Coquette : comment se répartit la couverture entre nous ?",
      r: "C’est vous qui décidez de la répartition entre emprunteurs, par exemple 50/50 ou au prorata des revenus, la seule règle étant d’atteindre ensemble au moins 100 %. On en discute ensemble avant de finaliser le contrat."
    }
  ],
  faitsSources: [
    { fait: "Marnes-la-Coquette est la commune la moins peuplée des Hauts-de-Seine", source: "INSEE, via API Géo (geo.api.gouv.fr) — comparaison des populations communales du 92" },
    { fait: "Situation entre le parc de Saint-Cloud et la forêt de Fausses-Reposes", source: "Géographie — confirmée" }
  ],
  meta: {
    title: "Assurance emprunteur à Marnes-la-Coquette | GP Finances",
    description:
      "Changez d’assurance de prêt à Marnes-la-Coquette avec un courtier indépendant. Étude gratuite et sur mesure, garanties équivalentes, loi Lemoine."
  }
};
