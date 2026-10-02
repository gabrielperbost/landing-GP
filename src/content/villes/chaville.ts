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
    "Chaville doit son nom à sa situation entre deux massifs forestiers, un environnement boisé recherché pour s’installer durablement. Le marché y est équilibré entre appartements et maisons, avec une proportion de maisons supérieure à la moyenne des communes denses du 92. Le centre-ville, autour de la gare, et le secteur Rive Gauche concentrent la plupart des appartements, tandis que les maisons se trouvent surtout en périphérie, vers les lisières forestières.",
  prixM2: {
    appartements: { valeur: 5469, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7143, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 20594, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles qui achètent pour s’installer durablement, avec des prêts qui dépassent souvent 20 à 25 ans. La question de la quotité entre les deux emprunteurs revient fréquemment, de même que le changement d’assurance plusieurs années après la signature initiale.",
  accesBureau:
    "GP Finances reçoit à Issy-les-Moulineaux. Pour les emprunteurs de Chaville, l’essentiel du suivi se fait par téléphone ou en visio ; un rendez-vous au cabinet reste possible si vous le préférez.",
  angleEditorial: "Entre deux forêts : un cadre de vie recherché pour s’installer durablement.",
  faqLocales: [
    {
      q: "Nous avons acheté notre maison à Chaville il y a plusieurs années : est-il encore temps de changer d’assurance ?",
      r: "Oui, l’ancienneté du prêt n’a aucune incidence. La loi Lemoine permet de changer à tout moment, même longtemps après la signature."
    },
    {
      q: "Nous avons emprunté à deux pour notre maison à Chaville : comment se répartit la couverture entre nous ?",
      r: "C’est vous qui décidez de la répartition entre emprunteurs, par exemple 50/50 ou au prorata des revenus. On en discute ensemble avant de finaliser le contrat."
    },
    {
      q: "J’ai arrêté de fumer il y a un an, depuis l’achat de notre maison à Chaville : cela peut-il faire baisser mon tarif d’assurance ?",
      r: "Potentiellement oui : le statut fumeur ou non fumeur fait partie des critères du questionnaire de santé. Si votre situation a changé, ça vaut le coup de refaire une étude."
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
