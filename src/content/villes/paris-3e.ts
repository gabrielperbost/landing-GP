import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75103.csv, ventes 2024-2025. Population :
// INSEE RP2023, via API Géo. Quartiers : « Haut Marais » est le nom d'usage courant désignant
// le 3e, distinct des 4 quartiers administratifs officiels.
export const paris3e: VilleData = {
  slug: "paris-3e",
  nom: "Paris 3e",
  type: "arrondissement",
  codesPostaux: ["75003"],
  departement: "75",
  villesVoisines: ["paris-1er", "paris-2e", "paris-4e", "paris-10e"],
  quartiers: ["Haut Marais", "Temple", "Arts-et-Métiers (quartiers administratifs : Arts-et-Métiers, Enfants-Rouges, Archives, Sainte-Avoye)"],
  profilImmobilier:
    "Le 3e arrondissement correspond au Haut Marais et au quartier Arts-et-Métiers, avec un marché d’appartements anciens, souvent de petite surface, très recherchés. C’est l’un des arrondissements historiques de Paris, avec une forte mixité entre galeries, ateliers d’artisans et habitat ancien.",
  prixM2: {
    appartements: { valeur: 11782, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 1 228 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 32179, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Beaucoup de jeunes couples ou d’actifs en premier achat, souvent à deux, sur des petites surfaces au prix au m² élevé. Les situations de crédit relais, pour ceux qui enchaînent deux achats, reviennent régulièrement dans les dossiers du 3e.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 3e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Premier achat à deux dans le Haut Marais, sur une petite surface au prix élevé.",
  faqLocales: [
    {
      q: "Nous achetons à deux notre premier appartement dans le Haut Marais, nos salaires sont très différents : comment fixer la quotité ?",
      r: "Il n’y a pas de règle imposée : vous pouvez répartir à parts égales ou selon vos revenus respectifs. L’important est que la répartition protège correctement votre foyer en cas de coup dur."
    },
    {
      q: "J’ai un crédit relais en cours pour cet achat dans le 3e : l’assurance de prêt s’applique-t-elle aussi dessus ?",
      r: "Oui, un crédit relais est un prêt comme un autre et doit être assuré ; on regarde ensemble s’il est pertinent de l’assurer au même niveau que le prêt principal."
    },
    {
      q: "Je viens de changer de mutuelle santé au moment de signer mon prêt dans le 3e : y a-t-il un lien avec l’assurance de prêt ?",
      r: "Non, ce sont deux contrats différents : la mutuelle couvre vos frais médicaux courants, l’assurance de prêt couvre le remboursement du crédit en cas de décès, d’invalidité ou d’incapacité."
    }
  ],
  faitsSources: [
    { fait: "« Haut Marais » est le nom d’usage courant désignant le 3e arrondissement, distinct des 4 quartiers administratifs (Arts-et-Métiers, Enfants-Rouges, Archives, Sainte-Avoye)", source: "Wikipédia « 3e arrondissement de Paris » ; junot.fr, guide du 3e arrondissement" },
    { fait: "Le 3e abrite la maison de Nicolas Flamel (1407), considérée comme la plus ancienne maison datée de Paris", source: "Wikipédia « 3e arrondissement de Paris »" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 3e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 3e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
