import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75113.csv, ventes 2024-2025. Population :
// INSEE, populations de référence 2023 (RP2023), via API Géo. Quartiers : noms des conseils de
// quartier (mairie13.paris.fr, 8 conseils, plus granulaires que les 4 quartiers administratifs).
export const paris13e: VilleData = {
  slug: "paris-13e",
  nom: "Paris 13e",
  type: "arrondissement",
  codesPostaux: ["75013"],
  departement: "75",
  villesVoisines: ["paris-5e", "paris-14e"],
  quartiers: ["Butte-aux-Cailles", "Olympiades", "Italie", "Croulebarbe (quartiers administratifs : Salpêtrière, Gare, Maison-Blanche, Croulebarbe)"],
  profilImmobilier:
    "Le 13e contraste un secteur des Olympiades aux tours des années 1970 et le vaste chantier de renouvellement urbain de Paris Rive Gauche, autour de la BnF, l’une des zones de construction neuve les plus actives de Paris. Le quartier de la Butte-aux-Cailles conserve un bâti bas, plus ancien.",
  prixM2: {
    appartements: { valeur: 8642, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 2 740 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 181271, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Si vous achetez un logement récent dans le secteur Paris Rive Gauche, l’achat se fait souvent en programme neuf tout juste livré. Le 13e affiche par ailleurs le prix au m² le plus accessible de ce lot de dix arrondissements.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 13e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Entre tours des Olympiades et constructions neuves de Paris Rive Gauche.",
  faqLocales: [
    {
      q: "Nous achetons un logement neuf dans le secteur Paris Rive Gauche avec un apport limité : le questionnaire de santé est-il un frein ?",
      r: "Pas nécessairement : la suppression du questionnaire de santé suppose deux conditions réunies — une part assurée d’au plus 200 000 € par personne, et un prêt qui se termine avant vos 60 ans. Beaucoup de premiers achats remplissent ces deux critères."
    },
    {
      q: "Le 13e est l’un des arrondissements les plus accessibles de Paris : est-ce que comparer l’assurance change vraiment quelque chose sur un capital plus mesuré ?",
      r: "Oui, même sur un capital plus mesuré, l’écart entre deux contrats représente souvent plusieurs milliers d’euros sur la durée du prêt."
    },
    {
      q: "Nous avons emprunté à deux pour notre appartement aux Olympiades : comment se répartit la couverture entre nous ?",
      r: "Vous fixez la répartition vous-même (50/50 ou selon vos revenus respectifs), à condition que la somme des deux quotités atteigne au moins 100 %. Je vous aide à choisir ce qui protège le mieux votre foyer."
    }
  ],
  faitsSources: [
    { fait: "Le secteur des Olympiades a été reconstruit dans les années 1970 selon des principes modernistes (opération « Italie 13 »), avec des tours parmi les plus hautes de Paris", source: "Wikipédia (en) « 13th arrondissement of Paris »" },
    { fait: "Paris Rive Gauche, autour de la BnF François-Mitterrand, est l’une des plus grandes zones de renouvellement urbain de Paris depuis les années 1990", source: "Wikipédia (en) « 13th arrondissement of Paris »" },
    { fait: "Quartiers administratifs officiels : Salpêtrière, Gare, Maison-Blanche, Croulebarbe ; 8 conseils de quartier officiels, plus granulaires (dont Butte-aux-Cailles, Olympiades-Choisy)", source: "mairie13.paris.fr, « Les conseils de quartier »" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 13e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 13e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
