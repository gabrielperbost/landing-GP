import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
// Quartiers : zonage IRIS INSEE (voir faitsSources).
export const chatenayMalabry: VilleData = {
  slug: "chatenay-malabry",
  nom: "Châtenay-Malabry",
  type: "commune",
  codesPostaux: ["92290"],
  departement: "92",
  villesVoisines: ["sceaux", "le-plessis-robinson", "fontenay-aux-roses"],
  quartiers: ["Centre-Ville", "Butte Rouge", "Robinson", "Croix Blanche"],
  profilImmobilier:
    "Châtenay-Malabry fait partie des communes les plus vertes du 92, avec un budget d’entrée plus accessible que la moyenne du département. Le secteur de la Butte Rouge, cité-jardin historique, et le quartier de Robinson concentrent une partie des transactions.",
  prixM2: {
    appartements: { valeur: 4725, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 5897, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 35825, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Un cadre de vie verdoyant qui attire aussi bien des familles qui s’agrandissent que des couples en reconversion vers un premier pavillon, avec des capitaux plus mesurés que dans le nord du département. Les prêts dépassent souvent 20 à 25 ans. Beaucoup de ces emprunteurs n’ont jamais comparé leur assurance depuis la signature, parfois par méconnaissance de leurs droits : la loi Lemoine permet pourtant de le faire à tout moment, sans attendre une date anniversaire ni justifier d’un motif particulier.",
  accesBureau:
    "GP Finances est installé à Issy-les-Moulineaux. Depuis Châtenay-Malabry, la plupart des dossiers avancent par téléphone ou en visio ; un rendez-vous en personne peut être organisé si vous le souhaitez.",
  angleEditorial: "Cadre verdoyant, budget plus accessible que la moyenne du 92.",
  faqLocales: [
    {
      q: "Nous achetons notre premier appartement à Châtenay-Malabry : la loi Lemoine s’applique-t-elle dès la signature ?",
      r: "Oui, dès la signature du prêt, vous pouvez comparer et changer d’assurance à tout moment, sans attendre une date anniversaire."
    },
    {
      q: "Le quartier de la Butte Rouge est un secteur historique : cela a-t-il une incidence sur l’assurance de prêt ?",
      r: "Non, l’ancienneté ou le caractère patrimonial du quartier n’a pas d’impact sur vos droits ni sur le tarif de l’assurance."
    },
    {
      q: "Notre budget est plus serré à Châtenay-Malabry qu’ailleurs dans le 92 : est-ce que comparer l’assurance change vraiment quelque chose ?",
      r: "Oui, même sur un capital plus mesuré, l’écart entre deux contrats représente souvent plusieurs milliers d’euros sur la durée du prêt."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Butte Rouge, Robinson, Croix Blanche, Centre-Ville", source: "Zonage IRIS INSEE de Châtenay-Malabry (14 IRIS)" }
  ],
  meta: {
    title: "Assurance emprunteur à Châtenay-Malabry | GP Finances",
    description:
      "Changez d’assurance de prêt à Châtenay-Malabry avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
