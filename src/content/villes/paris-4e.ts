import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75104.csv, ventes 2024-2025. Population :
// INSEE RP2023, via API Géo. Quartiers : Île Saint-Louis, Marais, Saint-Paul et Arsenal sont
// des noms d'usage courant, cités comme tels par plusieurs sources (y compris immobilières),
// distincts des 4 quartiers administratifs officiels.
export const paris4e: VilleData = {
  slug: "paris-4e",
  nom: "Paris 4e",
  type: "arrondissement",
  codesPostaux: ["75004"],
  departement: "75",
  villesVoisines: ["paris-1er", "paris-3e", "paris-5e"],
  quartiers: ["Île Saint-Louis", "Marais", "Saint-Paul", "Arsenal (quartiers administratifs : Saint-Merri, Saint-Gervais, Arsenal, Notre-Dame)"],
  profilImmobilier:
    "Le 4e arrondissement regroupe l’Île Saint-Louis, une partie de l’Île de la Cité et le Marais historique, avec un marché d’appartements anciens, souvent de belle facture, parmi les plus recherchés de Paris. Les acheteurs sont le plus souvent des secundo ou tertio-accédants, sur des biens de prestige.",
  prixM2: {
    appartements: { valeur: 12630, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 963 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 27332, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si vous revendez un bien plus petit pour vous installer durablement dans le 4e, l’opération s’inscrit parfois dans le cadre d’une succession familiale ou d’un nouvel achat à deux.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 4e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Revendre pour s’agrandir, entre biens de prestige de l’Île Saint-Louis et du Marais.",
  faqLocales: [
    {
      q: "Nous revendons notre résidence principale pour acheter plus grand dans le 4e : faut-il changer d’assurance de prêt à ce moment-là ?",
      r: "Oui, un nouveau prêt signifie une nouvelle étude d’assurance : c’est l’occasion de comparer les contrats plutôt que de reprendre automatiquement celui proposé par la banque."
    },
    {
      q: "Le bien que nous achetons dans le 4e provient d’une succession familiale : cela change-t-il le dossier d’assurance ?",
      r: "Non, l’assurance de prêt porte sur vous, l’emprunteur, pas sur l’historique du bien : le dossier se construit comme pour n’importe quel achat."
    },
    {
      q: "J’ai 58 ans et j’emprunte pour un achat dans le 4e : est-ce plus compliqué de trouver une assurance ?",
      r: "Le questionnaire de santé n’est supprimé que si deux conditions sont réunies : la part assurée ne dépasse pas 200 000 € par personne, et le prêt se termine avant vos 60 ans. À 58 ans, la seconde condition est rarement atteinte sur un prêt classique, donc le questionnaire s’applique le plus souvent, avec éventuellement une surprime selon les réponses. Je compare plusieurs assureurs pour trouver l’offre la plus adaptée à votre profil."
    }
  ],
  faitsSources: [
    { fait: "L’Île Saint-Louis, entièrement comprise dans le 4e, est un secteur résidentiel bâti au 17e siècle", source: "Wikipédia « 4e arrondissement de Paris »" },
    { fait: "Quartiers administratifs officiels : Saint-Merri, Saint-Gervais, Arsenal, Notre-Dame", source: "Mairie de Paris / INSEE, liste des quartiers administratifs de Paris" },
    { fait: "Île Saint-Louis, Marais, Saint-Paul et Arsenal sont des noms d’usage courant, repris par les guides immobiliers du secteur", source: "arthur-loyd.com, guide du 4e arrondissement" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 4e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 4e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
