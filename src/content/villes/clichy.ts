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
      q: "Nous avons emprunté à deux pour notre premier appartement à Clichy : comment se répartit la couverture entre nous ?",
      r: "Rien d’automatique ici : la quotité se négocie entre vous deux, souvent 50/50 mais parfois ajustée selon les revenus. C’est un choix qu’on affine ensemble."
    },
    {
      q: "J’ai un peu dépassé mon budget pour acheter à Clichy : l’assurance peut-elle vraiment alléger ma mensualité ?",
      r: "Oui, souvent plus qu’on ne le pense : sur un capital déjà conséquent pour un premier achat, l’écart entre deux contrats se chiffre vite en milliers d’euros sur la durée du prêt."
    },
    {
      q: "Je suis en période d’essai dans mon nouvel emploi depuis l’achat à Clichy : dois-je le signaler pour mon assurance ?",
      r: "Pas automatiquement : ce qui compte pour votre contrat, c’est votre état de santé et votre âge au moment de l’étude, pas votre situation professionnelle future."
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
