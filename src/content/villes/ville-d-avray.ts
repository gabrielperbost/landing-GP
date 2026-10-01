import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Pas de marché de maisons statistiquement fiable (32 ventes, sous le seuil de 50).
export const villeDAvray: VilleData = {
  slug: "ville-d-avray",
  nom: "Ville-d’Avray",
  type: "commune",
  codesPostaux: ["92410"],
  departement: "92",
  villesVoisines: ["sevres", "chaville", "saint-cloud"],
  quartiers: ["Thierry-Saint-Cloud", "La Ronce", "Centre-La Prairie", "Forêt de Fausses-Reposes"],
  profilImmobilier:
    "Ville-d’Avray est connue pour ses étangs, immortalisés par le peintre Corot, et sa situation entre deux massifs forestiers. C’est une petite commune résidentielle où le marché reste majoritairement tourné vers la maison, même si le nombre de ventes reste trop faible pour donner un prix médian fiable sur ce type de bien.",
  prixM2: {
    appartements: { valeur: 5172, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: null
  },
  population: { valeur: 11089, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles séduites par le cadre naturel de la commune, avec des prêts qui dépassent souvent 20 à 25 ans. Les dossiers à deux emprunteurs sont majoritaires, avec des capitaux empruntés souvent plus élevés que la moyenne.",
  accesBureau:
    "GP Finances est basé à Issy-les-Moulineaux. Pour les habitants de Ville-d’Avray, les échanges se font le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Entre étangs et forêt, un cadre naturel recherché.",
  faqLocales: [
    {
      q: "Ville-d’Avray a peu de ventes de maisons recensées : comment estimer le capital typique pour un prêt ici ?",
      r: "Je préfère ne pas donner de chiffre moyen qui ne serait pas assez fiable sur un petit nombre de ventes. L’étude se fait directement à partir de votre dossier et de votre projet."
    },
    {
      q: "Notre maison est proche des étangs de Ville-d’Avray : cela a-t-il une incidence sur l’assurance de prêt ?",
      r: "Non, l’environnement ou la situation précise du bien n’a pas d’impact sur vos droits ni sur le tarif de l’assurance."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Ville-d’Avray ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Thierry-Saint-Cloud, La Ronce, Centre-La Prairie, Forêt de Fausses-Reposes", source: "Zonage IRIS INSEE de Ville-d’Avray (6 IRIS)" },
    { fait: "Les étangs de Ville-d’Avray ont été peints par Camille Corot", source: "TODO_VERIFIER — fait artistique largement connu, pas recoupé avec une source muséale précise cette session" },
    { fait: "Seulement 32 ventes de maisons recensées en 2024-2025", source: "DGFiP, base DVF (data.gouv.fr), voir src/content/localData92.json" }
  ],
  meta: {
    title: "Assurance emprunteur à Ville-d’Avray | GP Finances",
    description:
      "Changez d’assurance de prêt à Ville-d’Avray avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
