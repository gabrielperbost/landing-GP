import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const sceaux: VilleData = {
  slug: "sceaux",
  nom: "Sceaux",
  type: "commune",
  codesPostaux: ["92330"],
  departement: "92",
  villesVoisines: ["antony", "bourg-la-reine", "chatenay-malabry"],
  quartiers: ["Centre", "Blagis", "Parc de Sceaux", "Robinson", "Vieux Sceaux"],
  profilImmobilier:
    "Sceaux doit une grande partie de son attrait à son parc, aux portes du bois de Verrières. Le marché y est équilibré entre appartements du centre-ville et maisons plus familiales, avec des prix parmi les plus élevés de ce secteur du 92.",
  prixM2: {
    appartements: { valeur: 5812, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7657, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 20884, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de familles qui achètent une maison pour s’installer durablement, souvent après un premier achat ailleurs. Les prêts dépassent fréquemment 25 ans, avec des dossiers à deux emprunteurs majoritaires.",
  accesBureau:
    "Le cabinet de GP Finances est à Issy-les-Moulineaux. Pour les habitants de Sceaux, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Cadre verdoyant, profil familial, prix élevés.",
  faqLocales: [
    {
      q: "Nous avons acheté une maison à Sceaux pour nous agrandir : l’assurance de prêt a-t-elle un impact sur ce type de capital ?",
      r: "Oui, et c’est sur les capitaux les plus élevés que l’impact est le plus net : chaque point de taux d’assurance représente une somme plus importante sur la durée."
    },
    {
      q: "Nous avons emprunté à deux pour nous agrandir à Sceaux : comment se répartit la couverture entre nous ?",
      r: "Rien d’automatique ici : la quotité se négocie entre vous deux, souvent 50/50 mais parfois ajustée selon les revenus, à condition que la somme atteigne au moins 100 %. C’est un choix qu’on affine ensemble."
    },
    {
      q: "Nous avons un prêt sur 25 ans signé il y a 6 ans à Sceaux, pour notre premier achat : est-il trop tard pour comparer les contrats ?",
      r: "Non, l’ancienneté du prêt n’a aucune incidence : vous pouvez comparer et changer d’assurance à tout moment, même plusieurs années après la signature."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre, Blagis, Parc de Sceaux, Robinson, Vieux Sceaux", source: "Zonage IRIS INSEE de Sceaux (8 IRIS)" }
  ],
  meta: {
    title: "Assurance emprunteur à Sceaux | GP Finances",
    description:
      "Changez d’assurance de prêt à Sceaux avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
