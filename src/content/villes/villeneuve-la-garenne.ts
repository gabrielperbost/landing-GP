import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Pas de marché de maisons statistiquement fiable (26 ventes, sous le seuil de 50).
export const villeneuveLaGarenne: VilleData = {
  slug: "villeneuve-la-garenne",
  nom: "Villeneuve-la-Garenne",
  type: "commune",
  codesPostaux: ["92390"],
  departement: "92",
  villesVoisines: ["gennevilliers", "asnieres-sur-seine", "clichy"],
  quartiers: ["Centre", "Les Fauvelles", "Bord de Seine"],
  profilImmobilier:
    "Villeneuve-la-Garenne a le prix au m² le plus accessible de ce secteur du 92, nettement en dessous de ses communes voisines. Entourée par une boucle de la Seine, la commune mêle grands ensembles et quartiers pavillonnaires plus calmes.",
  prixM2: {
    appartements: { valeur: 3252, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: null
  },
  population: { valeur: 26021, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de primo-accédants qui profitent d’un budget très accessible par rapport au reste du département. Les capitaux empruntés sont en conséquence nettement plus mesurés, ce qui ne réduit pas pour autant l’intérêt de comparer les contrats d’assurance.",
  accesBureau:
    "Le cabinet de GP Finances est à Issy-les-Moulineaux. Pour les habitants de Villeneuve-la-Garenne, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Le budget le plus accessible de ce secteur du 92.",
  faqLocales: [
    {
      q: "Notre budget est nettement plus accessible à Villeneuve-la-Garenne qu’ailleurs dans le 92 : est-ce que comparer l’assurance change vraiment quelque chose ?",
      r: "Oui, même sur un capital plus mesuré, l’écart entre deux contrats représente souvent plusieurs milliers d’euros sur la durée du prêt."
    },
    {
      q: "Villeneuve-la-Garenne a peu de ventes de maisons recensées : pourquoi n’y a-t-il pas de prix médian affiché pour ce type de bien ?",
      r: "Je préfère ne pas afficher de chiffre qui ne serait pas assez fiable sur un petit nombre de ventes, plutôt que de donner une moyenne trompeuse."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Villeneuve-la-Garenne ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre, Les Fauvelles, Bord de Seine", source: "TODO_VERIFIER — liste simplifiée à partir du zonage IRIS INSEE, pas recoupée avec le site officiel de la mairie cette session" },
    { fait: "Villeneuve-la-Garenne est entourée par une boucle de la Seine", source: "TODO_VERIFIER — géographie communément admise, pas recoupée avec une source officielle précise cette session" }
  ],
  meta: {
    title: "Assurance emprunteur à Villeneuve-la-Garenne | GP Finances",
    description:
      "Changez d’assurance de prêt à Villeneuve-la-Garenne avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
