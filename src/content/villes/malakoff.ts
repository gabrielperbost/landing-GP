import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const malakoff: VilleData = {
  slug: "malakoff",
  nom: "Malakoff",
  type: "commune",
  codesPostaux: ["92240"],
  departement: "92",
  villesVoisines: ["montrouge", "chatillon", "vanves"],
  quartiers: ["Centre", "Le Fort", "Le Clos", "Petit Vanves", "Nord"],
  profilImmobilier:
    "Aux portes de Paris (14e), Malakoff est une commune dense où le marché reste malgré tout partagé entre appartements et maisons de ville, ces dernières étant assez recherchées pour une commune aussi proche de la capitale. Le secteur du Fort, autour de l’ancien fort militaire, est l’un des plus prisés.",
  prixM2: {
    appartements: { valeur: 6475, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7933, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 30557, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de jeunes actifs et de familles, avec un mélange de premiers achats en appartement et de projets de maison pour s’agrandir. Les prêts à deux emprunteurs sont fréquents, et la proximité de Paris pousse souvent à emprunter sur des capitaux plus élevés que dans des communes plus éloignées.",
  accesBureau:
    "Le cabinet de GP Finances est à Issy-les-Moulineaux. Pour les habitants de Malakoff, l’étude avance généralement par téléphone ou en visio ; un déplacement au cabinet reste une option si vous le préférez.",
  angleEditorial: "Aux portes de Paris, entre appartements et maisons de ville.",
  faqLocales: [
    {
      q: "Nous avons emprunté à deux pour notre maison de ville à Malakoff : comment se répartit la couverture entre nous ?",
      r: "Vous choisissez la répartition de la quotité (par exemple 50/50 ou selon les revenus de chacun). La seule règle à respecter : la somme des deux quotités doit atteindre au moins 100 %, chacun pouvant même aller jusqu’à 100 % de son côté. C’est un point que j’étudie avec vous avant la mise en place."
    },
    {
      q: "J’ai un peu dépassé mon budget pour acheter à Malakoff : l’assurance peut-elle vraiment alléger ma mensualité ?",
      r: "Oui, souvent plus qu’on ne le pense : sur un capital déjà conséquent, l’écart entre deux contrats se chiffre vite en milliers d’euros sur la durée du prêt."
    },
    {
      q: "Je viens de changer d’emploi juste après avoir acheté à Malakoff : dois-je le signaler pour mon assurance ?",
      r: "Pas automatiquement : ce qui compte pour votre contrat, c’est votre état de santé et votre âge au moment de l’étude, pas votre situation professionnelle future."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre, Le Fort, Le Clos, Petit Vanves, Nord", source: "Zonage IRIS INSEE de Malakoff (11 IRIS)" }
  ],
  meta: {
    title: "Assurance emprunteur à Malakoff | GP Finances",
    description:
      "Changez d’assurance de prêt à Malakoff avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
