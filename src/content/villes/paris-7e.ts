import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75107.csv, ventes 2024-2025. Population :
// INSEE RP2023, via API Géo. Quartiers : les conseils de quartier du 7e portent les mêmes noms
// que les 4 quartiers administratifs officiels (confirmé sur mairie07.paris.fr) ; « Faubourg
// Saint-Germain » est un nom d'usage courant pour le secteur des ministères et hôtels particuliers.
export const paris7e: VilleData = {
  slug: "paris-7e",
  nom: "Paris 7e",
  type: "arrondissement",
  codesPostaux: ["75007"],
  departement: "75",
  villesVoisines: ["paris-1er", "paris-6e", "paris-8e"],
  quartiers: ["Faubourg Saint-Germain", "Invalides", "École-Militaire", "Gros-Caillou (quartiers administratifs : Saint-Thomas-d’Aquin, Invalides, École-Militaire, Gros-Caillou)"],
  profilImmobilier:
    "Le 7e arrondissement, autour des Invalides, de l’École Militaire et du Champ-de-Mars, concentre les plus hauts revenus moyens de Paris. Le marché est fait de grands appartements familiaux anciens, en particulier vers le Faubourg Saint-Germain.",
  prixM2: {
    appartements: { valeur: 13639, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 1 552 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 48015, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si vous empruntez pour un grand appartement familial dans le 7e, les montants empruntés sont souvent élevés, avec des répartitions de quotité qui demandent une attention particulière entre co-emprunteurs.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 7e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Grands appartements familiaux et gros capitaux autour des Invalides.",
  faqLocales: [
    {
      q: "Nous empruntons un capital élevé pour notre achat dans le 7e : le montant change-t-il la façon dont l’assurance est calculée ?",
      r: "Le mécanisme reste identique, mais sur un montant élevé, chaque dixième de point de taux représente une somme bien plus importante sur la durée du prêt — d’où l’intérêt de comparer plusieurs offres."
    },
    {
      q: "Je suis fonctionnaire et j’achète dans le 7e : ma prévoyance d’agent public dispense-t-elle de l’assurance de prêt ?",
      r: "Non, la prévoyance des agents publics ne remplace pas l’assurance de prêt exigée par la banque : les deux répondent à des besoins différents."
    },
    {
      q: "Nous sommes un couple avec des revenus très inégaux pour notre achat dans le 7e : faut-il répartir la quotité à parts égales ?",
      r: "Pas obligatoirement : vous pouvez répartir selon vos revenus respectifs, ou autrement, selon ce qui protège le mieux votre foyer en cas de coup dur."
    }
  ],
  faitsSources: [
    { fait: "Le 7e est l’arrondissement parisien au revenu moyen par ménage le plus élevé", source: "Wikipédia « 7e arrondissement de Paris »" },
    { fait: "Les conseils de quartier du 7e portent les mêmes noms que les 4 quartiers administratifs officiels (Saint-Thomas-d’Aquin, Invalides, École-Militaire, Gros-Caillou) ; « Faubourg Saint-Germain » est un nom d’usage courant pour le secteur des ministères", source: "mairie07.paris.fr, « Les conseils de quartier » ; junot.fr, guide du Faubourg Saint-Germain" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 7e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 7e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
