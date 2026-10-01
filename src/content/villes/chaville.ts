import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : site officiel de la mairie (conseils de quartier, voir faitsSources).
export const chaville: VilleData = {
  slug: "chaville",
  nom: "Chaville",
  type: "commune",
  codesPostaux: ["92370"],
  departement: "92",
  villesVoisines: ["sevres", "meudon", "ville-d-avray"],
  quartiers: ["Centre-Ville", "Rive Gauche", "Deux Forêts"],
  profilImmobilier:
    "Chaville doit son nom à sa situation entre deux massifs forestiers, un cadre très recherché par les familles. Le marché y est équilibré entre appartements et maisons, avec une proportion de maisons supérieure à la moyenne des communes denses du 92. Le centre-ville, autour de la gare, et le secteur Rive Gauche concentrent la plupart des appartements, tandis que les maisons se trouvent surtout en périphérie, vers les lisières forestières.",
  prixM2: {
    appartements: { valeur: 5469, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7143, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 20594, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles qui achètent pour s’installer durablement, avec des prêts qui dépassent souvent 20 à 25 ans. La question de la quotité entre les deux emprunteurs revient fréquemment, de même que le changement d’assurance plusieurs années après la signature initiale.",
  accesBureau:
    "GP Finances reçoit à Issy-les-Moulineaux. Pour les emprunteurs de Chaville, l’essentiel du suivi se fait par téléphone ou en visio ; un rendez-vous au cabinet reste possible si vous le préférez.",
  angleEditorial: "Entre deux forêts : un cadre de vie recherché par les familles.",
  faqLocales: [
    {
      q: "Nous avons acheté notre maison à Chaville il y a plusieurs années : est-il encore temps de changer d’assurance ?",
      r: "Oui, l’ancienneté du prêt n’a aucune incidence. La loi Lemoine permet de changer à tout moment, même longtemps après la signature."
    },
    {
      q: "Le cadre forestier de Chaville a-t-il une incidence sur le tarif de l’assurance de prêt ?",
      r: "Non, ce qui compte pour le tarif, c’est le capital emprunté et votre profil (âge, santé), pas l’environnement du bien."
    },
    {
      q: "Nous cherchons une maison à Chaville, entre les deux forêts : le type de bien a-t-il un impact sur l’assurance ?",
      r: "Non, le type de bien (appartement ou maison) n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon dans tous les cas."
    }
  ],
  faitsSources: [
    { fait: "Quartiers (conseils de quartier) Centre-Ville, Rive Gauche, Deux Forêts", source: "Site officiel de la mairie de Chaville, « Les conseils de quartier »" }
  ],
  meta: {
    title: "Assurance emprunteur à Chaville | GP Finances",
    description:
      "Changez d’assurance de prêt à Chaville avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
