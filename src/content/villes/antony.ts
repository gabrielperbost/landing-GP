import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : PLU d'Antony (voir faitsSources).
export const antony: VilleData = {
  slug: "antony",
  nom: "Antony",
  type: "commune",
  codesPostaux: ["92160"],
  departement: "92",
  villesVoisines: ["sceaux", "bourg-la-reine", "chatenay-malabry"],
  quartiers: ["Centre-Ville", "Croix de Berny", "Pajeaud", "Noyer-Doré", "Les Rabats"],
  profilImmobilier:
    "Antony est l’une des communes les plus familiales du 92 : près d’un tiers des ventes récentes concernent des maisons, un ratio élevé pour le département. Le secteur Croix de Berny, proche du parc de Sceaux, et le centre-ville concentrent la plupart des transactions. Le quartier du Noyer-Doré, plus au sud, connaît depuis plusieurs années un programme de rénovation urbaine qui attire de nouveaux acheteurs.",
  prixM2: {
    appartements: { valeur: 4975, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 5873, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 64263, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles qui achètent une maison pour s’agrandir, avec des prêts qui dépassent souvent 25 ans. C’est aussi une commune où je vois régulièrement des emprunteurs qui changent d’assurance plusieurs années après la signature, sans avoir jamais comparé depuis.",
  accesBureau:
    "Le cabinet est basé à Issy-les-Moulineaux. Pour les emprunteurs d’Antony, l’étude se fait le plus souvent à distance, par téléphone ou en visio ; un rendez-vous en personne reste organisable si vous le préférez.",
  angleEditorial: "Maisons et familles : un profil différent du reste du 92.",
  faqLocales: [
    {
      q: "Nous avons acheté une maison à Antony il y a plusieurs années : est-il encore temps de changer d’assurance ?",
      r: "Oui, l’ancienneté du prêt n’a aucune incidence. La loi Lemoine permet de changer à tout moment, même plusieurs années après la signature."
    },
    {
      q: "Nous avons emprunté à deux pour notre maison à Antony : comment se répartit la couverture entre nous ?",
      r: "Vous choisissez la répartition de la quotité (par exemple 50/50 ou selon les revenus de chacun). La seule règle à respecter : la somme des deux quotités doit atteindre au moins 100 %, chacun pouvant même aller jusqu’à 100 % de son côté. C’est un point que j’étudie avec vous avant la mise en place."
    },
    {
      q: "Puis-je comparer mon assurance sans remettre en cause mon crédit immobilier ?",
      r: "Oui, le changement d’assurance est indépendant du crédit lui-même : votre banque ne peut pas modifier votre taux pour cette raison, et ne peut refuser le nouveau contrat que si ses garanties ne sont pas au moins équivalentes à celles en place."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Croix de Berny, Pajeaud, Noyer-Doré, Les Rabats, Centre-Ville", source: "PLU d’Antony (9 quartiers officiels) ; Wikipédia « Antony »" },
    { fait: "Antony a une part de maisons individuelles plus élevée que la moyenne du 92", source: "Déduit du ratio ventes maisons/appartements dans localData92.json — confirmé" }
  ],
  meta: {
    title: "Assurance emprunteur à Antony | GP Finances",
    description:
      "Changez d’assurance de prêt à Antony avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine. Profil maison et famille bienvenu."
  }
};
