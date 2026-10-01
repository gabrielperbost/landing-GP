import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Pas de marché de maisons statistiquement fiable (13 ventes sur la période, sous le seuil de 50).
export const levalloisPerret: VilleData = {
  slug: "levallois-perret",
  nom: "Levallois-Perret",
  type: "commune",
  codesPostaux: ["92300"],
  departement: "92",
  villesVoisines: ["clichy", "neuilly-sur-seine", "courbevoie"],
  quartiers: ["Centre-Ville", "Front de Seine", "Louise Michel", "Alsace", "République", "Île de la Jatte"],
  profilImmobilier:
    "Levallois-Perret est l’une des communes les plus denses et les plus chères du nord du 92, avec un marché presque exclusivement composé d’appartements. Le secteur de l’Île de la Jatte, au bord de la Seine, et le Front de Seine sont particulièrement recherchés.",
  prixM2: {
    appartements: { valeur: 8940, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: null
  },
  population: { valeur: 68092, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de cadres et de couples de cadres, avec des capitaux empruntés souvent élevés compte tenu du prix au m² parmi les plus hauts de ce secteur du 92. Les prêts à deux emprunteurs sont fréquents, et chaque point de taux d’assurance représente une somme importante sur ce type de capital.",
  accesBureau:
    "Le cabinet est à Issy-les-Moulineaux. Pour les emprunteurs de Levallois-Perret, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Marché d’appartements à prix élevé, quasiment sans maisons.",
  faqLocales: [
    {
      q: "Le marché de Levallois est surtout fait d’appartements, avec très peu de maisons : est-ce que ça change quelque chose pour l’assurance ?",
      r: "Non, le type de bien n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon, qu’il s’agisse d’un appartement ou d’une maison."
    },
    {
      q: "Nous avons un capital important à Levallois-Perret : l’assurance de prêt a-t-elle un vrai impact sur ce type de montant ?",
      r: "Oui, et c’est justement sur les capitaux élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme bien plus importante que sur un petit emprunt."
    },
    {
      q: "Dois-je me déplacer jusqu’à Issy-les-Moulineaux pour une étude à Levallois ?",
      r: "Non, les échanges se font le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible si vous le préférez."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre-Ville, Front de Seine, Louise Michel, Alsace, République, Île de la Jatte", source: "Ville de Levallois (ville-levallois.fr), page « Conseils de quartier » ; lelevallois.fr, « Carte des quartiers de Levallois-Perret »" },
    { fait: "Seulement 13 ventes de maisons recensées en 2024-2025", source: "DGFiP, base DVF (data.gouv.fr), voir src/content/localData92.json" }
  ],
  meta: {
    title: "Assurance emprunteur à Levallois-Perret | GP Finances",
    description:
      "Changez d’assurance de prêt à Levallois-Perret avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
