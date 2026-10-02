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
      q: "Nous avons emprunté à deux pour notre maison à Ville-d’Avray : comment se répartit la couverture entre nous ?",
      r: "Vous choisissez la répartition de la quotité (par exemple 50/50 ou selon les revenus de chacun) : c’est un point que j’étudie avec vous avant la mise en place."
    },
    {
      q: "Nous avons un prêt sur 25 ans signé il y a 7 ans à Ville-d’Avray : est-il trop tard pour comparer les contrats ?",
      r: "Non, l’ancienneté du prêt n’a aucune incidence : vous pouvez comparer et changer d’assurance à tout moment, même plusieurs années après la signature."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Thierry-Saint-Cloud, La Ronce, Centre-La Prairie, Forêt de Fausses-Reposes", source: "Zonage IRIS INSEE de Ville-d’Avray (6 IRIS)" },
    { fait: "Les étangs de Ville-d’Avray ont été peints par Camille Corot", source: "Camille Corot, Étangs de Ville-d’Avray — confirmé" },
    { fait: "Seulement 32 ventes de maisons recensées en 2024-2025", source: "DGFiP, base DVF (data.gouv.fr), voir src/content/localData92.json" }
  ],
  meta: {
    title: "Assurance emprunteur à Ville-d’Avray | GP Finances",
    description:
      "Changez d’assurance de prêt à Ville-d’Avray avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
