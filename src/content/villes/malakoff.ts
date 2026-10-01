import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const malakoff: VilleData = {
  slug: "malakoff",
  nom: "Malakoff",
  type: "commune",
  codesPostaux: ["92240"],
  departement: "92",
  villesVoisines: ["montrouge", "chatillon", "vanves"],
  quartiers: ["Centre", "Le Fort", "Le Clos", "Petit Vanves", "Nord"],
  profilImmobilier:
    "Aux portes de Paris (14e), Malakoff est une commune dense où le marché reste malgré tout partagé entre appartements et maisons de ville, ces dernières étant assez recherchées pour une commune aussi proche de la capitale. Le secteur du Fort, autour de l’ancien fort militaire, est l’un des plus prisés.",
  prixM2: {
    appartements: { valeur: 6475, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7933, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 30557, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de jeunes actifs et de familles, avec un mélange de premiers achats en appartement et de projets de maison pour s’agrandir. Les prêts à deux emprunteurs sont fréquents, et la proximité de Paris pousse souvent à emprunter sur des capitaux plus élevés que dans des communes plus éloignées.",
  accesBureau:
    "Le cabinet de GP Finances est à Issy-les-Moulineaux. Pour les habitants de Malakoff, l’étude avance généralement par téléphone ou en visio ; un déplacement au cabinet reste une option si vous le préférez.",
  angleEditorial: "Aux portes de Paris, entre appartements et maisons de ville.",
  faqLocales: [
    {
      q: "Nous achetons une maison de ville dans le secteur du Fort à Malakoff : l’assurance a-t-elle un impact particulier sur ce type de bien ?",
      r: "Non, le type de bien n’a pas d’impact sur vos droits. Ce qui compte pour le tarif de l’assurance, c’est le capital emprunté et votre profil."
    },
    {
      q: "Malakoff est tout près de Paris : les prix de l’assurance sont-ils différents de ceux de Paris ?",
      r: "Non, le tarif de l’assurance dépend de votre profil et du capital emprunté, pas de la commune où se situe le bien."
    },
    {
      q: "Puis-je changer d’assurance de prêt à tout moment à Malakoff ?",
      r: "Oui, comme partout en France, sans attendre une date anniversaire et sans frais, en proposant des garanties équivalentes."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre, Le Fort, Le Clos, Petit Vanves, Nord", source: "Zonage IRIS INSEE de Malakoff (11 IRIS)" }
  ],
  meta: {
    title: "Assurance emprunteur à Malakoff | GP Finances",
    description:
      "Changez d’assurance de prêt à Malakoff avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
