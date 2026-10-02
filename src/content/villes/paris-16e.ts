import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75116.csv, ventes 2024-2025. Population :
// INSEE, populations de référence 2023 (RP2023), via API Géo. Quartiers : Auteuil, Muette,
// Porte-Dauphine et Chaillot sont à la fois les quartiers administratifs officiels et les noms
// des conseils de quartier (mairie16.paris.fr, 7 conseils) les plus reconnaissables.
export const paris16e: VilleData = {
  slug: "paris-16e",
  nom: "Paris 16e",
  type: "arrondissement",
  codesPostaux: ["75016"],
  departement: "75",
  villesVoisines: ["paris-8e", "paris-17e"],
  quartiers: ["Auteuil", "Muette", "Chaillot", "Dauphine (quartiers administratifs : Auteuil, Muette, Porte-Dauphine, Chaillot)"],
  profilImmobilier:
    "Le 16e est le plus étendu des arrondissements parisiens, pour moitié occupé par le bois de Boulogne. Le bâti, majoritairement haussmannien, compte aussi de rares « villas » privées avec jardin, un type de bien atypique à Paris. C’est l’arrondissement avec la plus grande surface moyenne et le prix au m² le plus élevé de ce lot de dix.",
  prixM2: {
    appartements: { valeur: 10845, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 4 221 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 159386, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Le capital emprunté est souvent élevé dans le 16e, compte tenu du prix au m² et de la surface moyenne, parmi les plus hauts de ce lot de dix arrondissements. Sur ce type de montant, chaque point de taux d’assurance représente une somme bien plus importante qu’ailleurs.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 16e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Le plus étendu des arrondissements parisiens, entre bois de Boulogne et gros capitaux.",
  faqLocales: [
    {
      q: "Nous achetons une villa avec jardin dans le 16e, un bien assez atypique à Paris : cela complique-t-il l’étude d’assurance ?",
      r: "Non : le type ou l’atypisme du bien ne change rien à vos droits. Seuls comptent le capital emprunté et votre profil d’emprunteur, âge et santé."
    },
    {
      q: "Nous empruntons un capital important pour notre achat dans le 16e : le questionnaire de santé peut-il être supprimé ?",
      r: "Rarement sur ce type de capital : la suppression suppose une part assurée d’au maximum 200 000 € par personne et un prêt qui se termine avant 60 ans, deux conditions cumulatives peu compatibles avec un emprunt élevé. Le questionnaire s’applique donc le plus souvent."
    },
    {
      q: "Nous empruntons à plusieurs (nous et nos enfants majeurs) pour notre achat dans le 16e : comment se répartit l’assurance ?",
      r: "La quotité peut se répartir entre plus de deux emprunteurs, à condition que la somme atteigne au moins 100 % ; chacun peut être couvert jusqu’à 100 % de son côté et choisir un assureur différent."
    }
  ],
  faitsSources: [
    { fait: "Le 16e est le plus étendu des arrondissements parisiens (16,305 km²), pour moitié occupé par le bois de Boulogne", source: "Wikipédia « 16e arrondissement de Paris »" },
    { fait: "L’arrondissement compte de rares « villas » privées (maisons avec jardin), un type de bien peu courant à Paris", source: "Wikipédia « 16e arrondissement de Paris »" },
    { fait: "Quartiers administratifs officiels : Auteuil, Muette, Porte-Dauphine, Chaillot ; 7 conseils de quartier officiels (dont Auteuil Nord/Sud, Muette Nord/Sud, Dauphine, Chaillot)", source: "mairie16.paris.fr, « Les conseils de quartier du 16e »" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 16e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 16e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine. Utile sur les gros capitaux."
  }
};
