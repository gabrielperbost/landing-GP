import type { VilleData } from "./types.ts";

// Chiffres repris tels quels de src/content/localData92.json (DVF/INSEE,
// récupérés le 2026-09-25) — aucune valeur recalculée ou arrondie différemment.
export const boulogneBillancourt: VilleData = {
  slug: "boulogne-billancourt",
  nom: "Boulogne-Billancourt",
  type: "commune",
  codesPostaux: ["92100"],
  departement: "92",
  villesVoisines: ["issy-les-moulineaux", "saint-cloud", "suresnes"],
  quartiers: ["Centre-Ville", "Les Princes", "Point-du-Jour", "Billancourt", "Marcel Sembat", "Rives de Seine / Île Seguin"],
  profilImmobilier:
    "Boulogne-Billancourt est l’une des communes les plus denses de France hors Paris. Le marché mêle grands immeubles bourgeois du secteur Les Princes et Point-du-Jour, à la frontière de Paris 16e, programmes récents du quartier Rives de Seine et de l’île Seguin (ancien site industriel Renault reconverti), et villas familiales recherchées vers Billancourt.",
  prixM2: {
    appartements: { valeur: 8251, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 13000, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 119019, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de cadres supérieurs et de dirigeants, avec des capitaux empruntés souvent élevés, en particulier pour l’achat d’une maison. Sur ce type de montant, chaque point de taux d’assurance représente une somme bien plus importante qu’ailleurs : la délégation d’assurance y a un impact financier particulièrement net. Les prêts dépassent souvent 25 à 30 ans pour l’achat d’une maison, avec une quotité répartie entre les deux emprunteurs selon les revenus de chacun. C’est aussi une ville où beaucoup de propriétaires n’ont jamais comparé leur assurance depuis la signature du prêt, parfois plusieurs années plus tôt, alors que la loi Lemoine leur permet de le faire sans attendre.",
  accesBureau:
    "Le cabinet de GP Finances est à Issy-les-Moulineaux, à quelques minutes de Boulogne-Billancourt. La plupart des échanges se font par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Capitaux élevés : chaque point de taux d’assurance pèse lourd.",
  faqLocales: [
    {
      q: "J’ai acheté une maison du côté de Billancourt pour un capital important : l’assurance de prêt a-t-elle vraiment un impact sur ce type de montant ?",
      r: "Oui, et c’est justement sur les capitaux élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme bien plus importante que sur un petit emprunt. C’est précisément le type de dossier où comparer les contrats compte le plus."
    },
    {
      q: "Mon appartement est dans un programme récent du quartier Rives de Seine ou de l’île Seguin : la loi Lemoine s’applique-t-elle aussi ?",
      r: "Oui. Le droit de changer d’assurance de prêt s’applique à tous les prêts immobiliers, quelle que soit l’ancienneté du programme ou de la construction."
    },
    {
      q: "Dois-je me déplacer jusqu’à Issy-les-Moulineaux pour une étude ?",
      r: "Non, la plupart des échanges se font par téléphone ou en visio. Un rendez-vous en personne reste possible si vous le préférez."
    }
  ],
  faitsSources: [
    { fait: "L’île Seguin a accueilli l’usine Renault (jusqu’en 1992, sites démolis en 2005) et a été reconvertie, notamment avec La Seine Musicale", source: "Wikipédia « Île Seguin » ; L’Argus, « Renault sera de retour sur ses terres historiques de Boulogne-Billancourt en 2026 »" },
    { fait: "Quartiers Les Princes et Marcel Sembat (place Marcel-Sembat, carrefour central)", source: "Wikipédia « Place Marcel-Sembat » ; JLL, « Le quartier tendance Marcel Sembat Centre-Ville »" },
    { fait: "Point-du-Jour et Billancourt comme secteurs de la commune", source: "TODO_VERIFIER — Wikipédia situe plutôt un découpage « République – Point du Jour » ; à recouper avec le zonage officiel de la mairie" },
    { fait: "Les Princes et Point-du-Jour sont à la frontière de Paris 16e", source: "TODO_VERIFIER — géographie communément admise, pas recoupée avec une source officielle cette session" }
  ],
  meta: {
    title: "Assurance emprunteur à Boulogne-Billancourt | GP Finances",
    description:
      "Changez d’assurance de prêt à Boulogne-Billancourt avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine. Particulièrement utile sur les gros capitaux."
  }
};
