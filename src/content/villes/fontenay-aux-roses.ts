import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : zonage IRIS INSEE (voir faitsSources).
export const fontenayAuxRoses: VilleData = {
  slug: "fontenay-aux-roses",
  nom: "Fontenay-aux-Roses",
  type: "commune",
  codesPostaux: ["92260"],
  departement: "92",
  villesVoisines: ["chatenay-malabry", "sceaux", "clamart"],
  quartiers: ["Centre (Gare-La Roue)", "Ormeaux", "Paradis-Blagis", "Pervenches", "Val Content"],
  profilImmobilier:
    "Fontenay-aux-Roses a l’un des prix au m² les plus accessibles des communes proches de Paris dans ce secteur du 92. Le relief vallonné et les nombreux jardins en pente lui ont valu son nom, et le marché reste mixte entre petits collectifs et maisons de ville.",
  prixM2: {
    appartements: { valeur: 4283, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 5843, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 24070, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de primo-accédants qui profitent d’un budget plus accessible que les communes plus proches de Paris, ainsi que des familles qui achètent une maison de ville pour s’installer durablement. Les prêts dépassent souvent 20 ans, avec des dossiers à deux emprunteurs majoritaires.",
  accesBureau:
    "GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs de Fontenay-aux-Roses, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne peut être organisé si vous le préférez.",
  angleEditorial: "Budget accessible, à deux pas de Paris.",
  faqLocales: [
    {
      q: "C’est notre premier achat à Fontenay-aux-Roses et l’apport est limité : le questionnaire de santé est-il un frein ?",
      r: "Pas forcément : il est même supprimé si la part assurée est inférieure à 200 000 € par personne et que le prêt se termine avant vos 60 ans, ce qui concerne beaucoup de premiers achats."
    },
    {
      q: "Le budget est plus accessible à Fontenay qu’ailleurs dans le 92 : est-ce que comparer l’assurance change vraiment quelque chose ?",
      r: "Oui, même sur un capital plus mesuré, l’écart entre deux contrats représente souvent plusieurs milliers d’euros sur la durée du prêt."
    },
    {
      q: "Nous avons emprunté à deux pour notre maison de ville à Fontenay-aux-Roses : comment se répartit la couverture ?",
      r: "Vous êtes libres de fixer cette répartition (50/50 ou au prorata des revenus, par exemple). Une mauvaise répartition peut mal protéger le foyer, donc je regarde ça avec vous en détail."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Gare-La Roue (centre), Ormeaux, Paradis-Blagis, Pervenches, Val Content", source: "Zonage IRIS INSEE de Fontenay-aux-Roses (11 IRIS)" }
  ],
  meta: {
    title: "Assurance emprunteur à Fontenay-aux-Roses | GP Finances",
    description:
      "Changez d’assurance de prêt à Fontenay-aux-Roses avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
