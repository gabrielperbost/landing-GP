import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75118.csv, ventes 2024-2025. Population :
// INSEE, populations de référence 2023 (RP2023), via API Géo. Quartiers : « Montmartre » est à
// la fois un nom d'usage et l'un des 8 conseils de quartier officiels (mairie18.paris.fr).
export const paris18e: VilleData = {
  slug: "paris-18e",
  nom: "Paris 18e",
  type: "arrondissement",
  codesPostaux: ["75018"],
  departement: "75",
  villesVoisines: ["paris-9e", "paris-10e", "paris-17e", "paris-19e"],
  quartiers: ["Montmartre", "Goutte d’Or-Château Rouge", "La Chapelle", "Clignancourt-Jules Joffrin (quartiers administratifs : Grandes-Carrières, Clignancourt, Goutte-d’Or, La Chapelle)"],
  profilImmobilier:
    "Le 18e contraste la butte Montmartre, secteur atypique au bâti ancien et aux petites surfaces, et le reste de l’arrondissement, plus dense et plus classique entre Château Rouge et la Chapelle. C’est l’arrondissement au prix au m² le plus accessible de ce lot de dix.",
  prixM2: {
    appartements: { valeur: 8772, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 5 380 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 183127, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si c’est un premier achat avec un budget serré, le 18e reste l’un des arrondissements les plus accessibles du centre de Paris. Sur la butte Montmartre, les biens sont plus rares et plus atypiques (immeubles bas, surfaces irrégulières).",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 18e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Entre butte de Montmartre atypique et prix le plus accessible du lot.",
  faqLocales: [
    {
      q: "C’est notre premier achat dans le 18e et le budget est serré : est-ce que comparer l’assurance peut vraiment alléger notre mensualité ?",
      r: "Oui, souvent plus qu’on ne le pense : sur un premier achat, l’écart entre deux contrats se chiffre vite en milliers d’euros sur la durée du prêt."
    },
    {
      q: "Nous achetons un bien atypique sur la butte Montmartre, dans un immeuble bas et ancien : cela change-t-il quelque chose pour l’assurance ?",
      r: "Non, ni l’ancienneté ni la configuration du bâtiment n’entrent en compte : votre contrat d’assurance dépend de votre capital emprunté et de votre profil, pas du bâti."
    },
    {
      q: "Nous empruntons à deux pour notre premier achat dans le 18e : comment se répartit la quotité ?",
      r: "Vous choisissez la répartition (50/50 ou selon vos revenus respectifs), à condition que la somme des deux quotités atteigne au moins 100 %. C’est un point qu’on étudie ensemble avant la mise en place."
    }
  ],
  faitsSources: [
    { fait: "La butte Montmartre (Sacré-Cœur, Bateau-Lavoir) forme un secteur atypique, de faible densité et au bâti ancien, contrastant avec le reste de l’arrondissement", source: "Wikipédia (en) « 18th arrondissement of Paris »" },
    { fait: "Le 18e est le 3e arrondissement le plus peuplé de Paris après le 15e et le 20e", source: "Wikipédia « 18e arrondissement de Paris »" },
    { fait: "Quartiers administratifs officiels : Grandes-Carrières, Clignancourt, Goutte-d’Or, La Chapelle ; 8 conseils de quartier officiels, dont « Montmartre »", source: "mairie18.paris.fr, pages des conseils de quartier" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 18e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 18e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
