import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : zonage IRIS INSEE (voir faitsSources).
export const chatillon: VilleData = {
  slug: "chatillon",
  nom: "Châtillon",
  type: "commune",
  codesPostaux: ["92320"],
  departement: "92",
  villesVoisines: ["montrouge", "malakoff", "clamart"],
  quartiers: ["République", "Gatinot", "Guynemer", "Parc"],
  profilImmobilier:
    "Aux portes de Paris (14e), Châtillon est une commune au marché mixte, entre appartements du centre et secteurs plus résidentiels vers le parc départemental. Les prix y restent plus accessibles que dans les communes limitrophes de Paris situées plus au nord. Le secteur République, proche de la mairie, et le quartier du Parc concentrent une bonne partie des transactions récentes.",
  prixM2: {
    appartements: { valeur: 5550, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7156, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 36705, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de primo-accédants et de jeunes actifs attirés par la proximité de Paris à un budget plus mesuré que dans les communes voisines. Les prêts à deux emprunteurs sont fréquents, souvent avec un apport limité compte tenu d’un premier achat.",
  accesBureau:
    "Le cabinet se trouve à Issy-les-Moulineaux, non loin de Châtillon. L’essentiel des échanges se fait à distance (téléphone, visio), avec la possibilité d’un rendez-vous en personne si vous le souhaitez.",
  angleEditorial: "Aux portes de Paris, entre accession et investissement.",
  faqLocales: [
    {
      q: "Nous achetons notre premier bien à Châtillon à deux : la quotité d’assurance se répartit-elle automatiquement ?",
      r: "Non, vous choisissez la répartition entre les deux emprunteurs (par exemple 50/50), du moment que la somme atteint au moins 100 % à vous deux. C’est un point que j’étudie avec vous avant la mise en place."
    },
    {
      q: "Je viens de changer d’emploi juste après avoir acheté à Châtillon : dois-je le signaler pour mon assurance de prêt ?",
      r: "Pas automatiquement : ce qui compte pour votre contrat, c’est votre état de santé et votre âge au moment de la souscription, pas votre situation professionnelle future."
    },
    {
      q: "Nous avons un prêt sur 25 ans à Châtillon, signé il y a 4 ans : est-il trop tard pour changer d’assurance ?",
      r: "Non, l’ancienneté du prêt n’a aucune incidence : vous pouvez comparer et changer à tout moment, même plusieurs années après la signature."
    }
  ],
  faitsSources: [
    { fait: "Quartiers République, Gatinot, Guynemer, Parc", source: "Zonage IRIS INSEE de Châtillon (11 IRIS)" }
  ],
  meta: {
    title: "Assurance emprunteur à Châtillon | GP Finances",
    description:
      "Changez d’assurance de prêt à Châtillon avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
