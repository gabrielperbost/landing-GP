import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : zonage IRIS INSEE (voir faitsSources).
export const gennevilliers: VilleData = {
  slug: "gennevilliers",
  nom: "Gennevilliers",
  type: "commune",
  codesPostaux: ["92230"],
  departement: "92",
  villesVoisines: ["villeneuve-la-garenne", "asnieres-sur-seine", "clichy"],
  quartiers: ["Village", "Chandon", "Fossé de l’Aumône", "Grésillons", "Luth", "Agnettes"],
  profilImmobilier:
    "Gennevilliers accueille le plus grand port fluvial d’Île-de-France, ce qui en fait historiquement une commune à vocation industrielle et portuaire. Le prix au m² y reste l’un des plus accessibles de ce secteur du 92, avec un marché mixte entre grands ensembles et quartiers pavillonnaires comme le Village.",
  prixM2: {
    appartements: { valeur: 4514, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 4603, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 50979, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de primo-accédants qui profitent d’un budget sensiblement plus accessible que les communes voisines plus proches de Paris. Les capitaux empruntés sont en conséquence plus mesurés, avec des dossiers à deux emprunteurs fréquents. C’est souvent un premier achat après plusieurs années de location, avec un apport limité ; je regarde alors de près si le questionnaire de santé reste nécessaire, pour éviter toute mauvaise surprise au moment de la mise en place du contrat.",
  accesBureau:
    "Mon cabinet est basé à Issy-les-Moulineaux. Pour un emprunteur de Gennevilliers, l’option la plus pratique reste un échange téléphonique ou une visio ; venir au cabinet en personne est possible si vous le souhaitez vraiment.",
  angleEditorial: "Budget accessible, marché mixte entre industrie et pavillons.",
  faqLocales: [
    {
      q: "Je viens de changer d’emploi juste après avoir acheté à Gennevilliers : dois-je le signaler pour mon assurance de prêt ?",
      r: "Pas automatiquement : ce qui compte pour votre contrat, c’est votre état de santé et votre âge au moment de la souscription, pas votre situation professionnelle future."
    },
    {
      q: "Notre budget est plus mesuré à Gennevilliers qu’ailleurs dans le 92 : est-ce que comparer l’assurance change vraiment quelque chose ?",
      r: "Oui, même sur un capital plus mesuré, l’écart entre deux contrats représente souvent plusieurs milliers d’euros sur la durée du prêt."
    },
    {
      q: "Nous avons emprunté à deux à Gennevilliers : comment se répartit la couverture entre nous ?",
      r: "À vous de choisir la clé de répartition entre emprunteurs : 50/50 est fréquent, mais une répartition selon les revenus de chacun est tout aussi possible, du moment que la somme atteint au moins 100 % à vous deux. On en parle avant la mise en place."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Village, Chandon, Fossé de l’Aumône, Grésillons, Luth, Agnettes", source: "Zonage IRIS INSEE de Gennevilliers (5 IRIS)" },
    { fait: "Gennevilliers accueille le plus grand port fluvial d’Île-de-France", source: "Port de Gennevilliers, HAROPA Port — confirmé" }
  ],
  meta: {
    title: "Assurance emprunteur à Gennevilliers | GP Finances",
    description:
      "Changez d’assurance de prêt à Gennevilliers avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
