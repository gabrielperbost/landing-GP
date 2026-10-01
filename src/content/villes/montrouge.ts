import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Pas de marché de maisons statistiquement fiable (40 ventes, sous le seuil de 50).
export const montrouge: VilleData = {
  slug: "montrouge",
  nom: "Montrouge",
  type: "commune",
  codesPostaux: ["92120"],
  departement: "92",
  villesVoisines: ["malakoff", "chatillon", "bagneux"],
  quartiers: ["Le Vieux Montrouge", "Les Portes de Montrouge", "Ferry-Buffalo", "Jean Jaurès", "Plein Sud"],
  profilImmobilier:
    "Montrouge est directement limitrophe de Paris (14e), ce qui en fait l’une des communes les plus denses et les plus chères de ce secteur du 92. Le marché est tourné presque exclusivement vers l’appartement, avec un prix au m² parmi les plus élevés du sud du département.",
  prixM2: {
    appartements: { valeur: 7102, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: null
  },
  population: { valeur: 46324, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de jeunes actifs et de cadres qui travaillent à Paris, avec des capitaux empruntés élevés compte tenu du prix au m². Les prêts à deux emprunteurs sont fréquents, et chaque point de taux d’assurance représente une somme importante sur ce type de capital.",
  accesBureau:
    "GP Finances est installé à Issy-les-Moulineaux. Depuis Montrouge, l’étude avance le plus souvent par téléphone ou en visio ; un déplacement au cabinet reste une option si vous le préférez.",
  angleEditorial: "Aux portes de Paris, prix élevés, surtout des appartements.",
  faqLocales: [
    {
      q: "Montrouge est directement collée à Paris : les prix de l’assurance sont-ils différents de ceux de Paris 14e ?",
      r: "Non, le tarif de l’assurance dépend de votre profil et du capital emprunté, pas de la commune précise où se situe le bien."
    },
    {
      q: "Le marché à Montrouge est surtout fait d’appartements, avec très peu de maisons : est-ce que ça change quelque chose pour l’assurance ?",
      r: "Non, le type de bien n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon, qu’il s’agisse d’un appartement ou d’une maison."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Montrouge ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Le Vieux Montrouge, Les Portes de Montrouge, Ferry-Buffalo, Jean Jaurès, Plein Sud", source: "Site officiel de la mairie de Montrouge (ville-montrouge.fr), « Les 6 quartiers de Montrouge »" },
    { fait: "Seulement 40 ventes de maisons recensées en 2024-2025", source: "DGFiP, base DVF (data.gouv.fr), voir src/content/localData92.json" }
  ],
  meta: {
    title: "Assurance emprunteur à Montrouge | GP Finances",
    description:
      "Changez d’assurance de prêt à Montrouge avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
