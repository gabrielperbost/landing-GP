import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const meudon: VilleData = {
  slug: "meudon",
  nom: "Meudon",
  type: "commune",
  codesPostaux: ["92190", "92360"],
  departement: "92",
  villesVoisines: ["clamart", "sevres", "chaville"],
  quartiers: ["Meudon Centre", "Bellevue", "Val-Fleury", "Meudon-sur-Seine", "Meudon-la-Forêt"],
  profilImmobilier:
    "Meudon est l’une des communes les plus boisées du 92, entre le centre historique et le secteur de Meudon-la-Forêt, plus excentré et plus abordable. Les ventes de maisons y sont nombreuses, un profil assez familial pour une commune de cette taille.",
  prixM2: {
    appartements: { valeur: 5507, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 8060, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 46334, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles qui achètent une maison, en particulier vers Meudon-la-Forêt où les prix sont plus accessibles qu’au centre. Les prêts dépassent souvent 20 à 25 ans, avec des dossiers à deux emprunteurs majoritaires.",
  accesBureau:
    "Le cabinet est à Issy-les-Moulineaux. Pour les emprunteurs de Meudon, l’essentiel des échanges se fait par téléphone ou en visio ; un rendez-vous en personne reste possible si vous le préférez.",
  angleEditorial: "Cadre boisé, deux visages : le centre et Meudon-la-Forêt.",
  faqLocales: [
    {
      q: "Les prix sont différents entre Meudon centre et Meudon-la-Forêt : cela a-t-il une incidence sur l’assurance de prêt ?",
      r: "Non, ce qui compte pour le tarif, c’est le capital emprunté et votre profil (âge, santé), pas le secteur précis de Meudon où se situe le bien."
    },
    {
      q: "Nous avons acheté une maison à Meudon-la-Forêt : l’assurance de prêt a-t-elle un impact sur ce type de capital ?",
      r: "Oui, et c’est sur les capitaux les plus élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme plus importante sur la durée."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Meudon ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Meudon Centre, Bellevue, Val-Fleury, Meudon-sur-Seine, Meudon-la-Forêt", source: "Site officiel de la mairie de Meudon (meudon.fr), « Conseils de quartier » (5 quartiers officiels)" }
  ],
  meta: {
    title: "Assurance emprunteur à Meudon | GP Finances",
    description:
      "Changez d’assurance de prêt à Meudon avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
