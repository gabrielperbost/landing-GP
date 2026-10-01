import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : grands quartiers INSEE (voir faitsSources). Pas de marché de maisons
// statistiquement fiable (11 ventes sur la période, sous le seuil de 50) : champ `maisons` à `null`.
export const clichy: VilleData = {
  slug: "clichy",
  nom: "Clichy",
  type: "commune",
  codesPostaux: ["92110"],
  departement: "92",
  villesVoisines: ["asnieres-sur-seine", "levallois-perret"],
  quartiers: ["Centre-Ville", "Bac d’Asnières", "Berges de Seine", "Victor-Hugo"],
  profilImmobilier:
    "Clichy est l’une des communes les plus denses du 92, avec un marché presque exclusivement composé d’appartements : les ventes de maisons y sont trop rares pour être statistiquement significatives. La proximité de Paris (17e) et les berges de Seine en font un secteur recherché.",
  prixM2: {
    appartements: { valeur: 6867, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: null
  },
  population: { valeur: 64410, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de jeunes actifs et de couples, souvent sur un premier achat compte tenu du prix au m² parmi les plus élevés de ce secteur du 92. Les prêts à deux emprunteurs sont fréquents, avec une attention particulière portée à la mensualité globale, assurance comprise. Sur un capital déjà conséquent pour un premier achat, l’écart entre deux contrats d’assurance se chiffre vite en milliers d’euros sur la durée, ce qui en fait souvent le premier poste que je regarde avec ces emprunteurs.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les habitants de Clichy, les démarches avancent le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste envisageable sur demande.",
  angleEditorial: "Marché d’appartements à forte densité, prix élevés.",
  faqLocales: [
    {
      q: "Le marché de Clichy est surtout fait d’appartements, avec peu de maisons : est-ce que ça change quelque chose pour l’assurance ?",
      r: "Non, le type de bien n’a pas d’impact sur vos droits : la loi Lemoine s’applique de la même façon, qu’il s’agisse d’un appartement ou d’une maison."
    },
    {
      q: "Le prix au m² est élevé à Clichy : l’assurance de prêt suit-elle le même mouvement ?",
      r: "Le coût de l’assurance dépend du capital emprunté, pas directement du prix au m². Sur un capital élevé, comparer les contrats a d’autant plus d’intérêt."
    },
    {
      q: "Le marché est tendu à Clichy : l’assurance de prêt coûte-t-elle plus cher dans une commune aussi dense ?",
      r: "Non, le tarif de l’assurance ne dépend pas de la densité de la commune, mais du capital emprunté et de votre profil (âge, santé)."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre-Ville, Bac d’Asnières, Berges de Seine, Victor-Hugo", source: "INSEE, grands quartiers de Clichy (6 grands quartiers, subdivisés en 22 IRIS)" },
    { fait: "Seulement 11 ventes de maisons recensées en 2024-2025", source: "DGFiP, base DVF (data.gouv.fr), voir src/content/localData92.json" }
  ],
  meta: {
    title: "Assurance emprunteur à Clichy | GP Finances",
    description:
      "Changez d’assurance de prêt à Clichy avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
