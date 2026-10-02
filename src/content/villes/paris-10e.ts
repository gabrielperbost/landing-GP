import type { VilleData } from "./types.ts";

// Prix : base DVF (DGFiP, data.gouv.fr), communes/75/75110.csv, ventes 2024-2025. Population :
// INSEE RP2023, via API Géo. Quartiers : la mairie du 10e compte 6 conseils de quartier ;
// Canal Saint-Martin, Gare du Nord et Gare de l'Est sont des noms d'usage courant, distincts
// des 4 quartiers administratifs officiels.
export const paris10e: VilleData = {
  slug: "paris-10e",
  nom: "Paris 10e",
  type: "arrondissement",
  codesPostaux: ["75010"],
  departement: "75",
  villesVoisines: ["paris-2e", "paris-3e", "paris-9e"],
  quartiers: ["Canal Saint-Martin", "Gare du Nord", "Gare de l’Est", "Château d’Eau (quartiers administratifs : Saint-Vincent-de-Paul, Porte-Saint-Denis, Porte-Saint-Martin, Hôpital-Saint-Louis)"],
  profilImmobilier:
    "Le 10e arrondissement, le plus peuplé de ce lot, s’étend du canal Saint-Martin aux gares du Nord et de l’Est. Le marché, fait d’appartements anciens, affiche les prix les plus accessibles de ces dix arrondissements, avec une forte mixité sociale.",
  prixM2: {
    appartements: { valeur: 9264, source: "DGFiP, base DVF (data.gouv.fr), ventes 2024-2025, 2 618 transactions", date: "2026-10-02" },
    maisons: null
  },
  population: { valeur: 83873, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-10-02" },
  profilEmprunteurs:
    "Beaucoup de primo-accédants et de jeunes familles, attirés par des prix plus accessibles que dans le reste du centre de Paris. Les profils de revenus sont variés, avec une part importante d’indépendants et d’auto-entrepreneurs.",
  accesBureau:
    "Le cabinet de GP Finances est basé à Issy-les-Moulineaux. Pour les emprunteurs du 10e, l’étude se mène le plus souvent par téléphone ou en visio ; un rendez-vous en personne reste possible sur demande.",
  angleEditorial: "Le secteur le plus accessible du centre de Paris, entre canal et gares.",
  faqLocales: [
    {
      q: "Nous achetons notre premier appartement près du canal dans le 10e avec un budget serré : l’assurance peut-elle faire une vraie différence sur notre mensualité ?",
      r: "Oui, sur un prêt déjà tendu, l’écart entre deux contrats d’assurance peut représenter plusieurs dizaines d’euros par mois, ce qui compte vraiment sur un budget serré."
    },
    {
      q: "Je suis auto-entrepreneur avec des revenus irréguliers, j’achète dans le 10e : est-ce plus difficile d’obtenir une assurance de prêt ?",
      r: "Un peu plus de pièces à fournir (bilans, déclarations), mais pas un obstacle en soi : plusieurs assureurs acceptent bien les revenus non-salariés à condition de présenter un historique clair."
    },
    {
      q: "Nous sommes trois à emprunter ensemble, deux parents et un enfant, pour notre achat dans le 10e : comment ça se passe pour l’assurance ?",
      r: "Chaque emprunteur inscrit au prêt peut être assuré avec une quotité propre ; à trois, on répartit souvent selon la contribution de chacun au remboursement."
    }
  ],
  faitsSources: [
    { fait: "Le 10e est le plus peuplé de ces dix arrondissements (83 873 habitants), avec les gares du Nord et de l’Est et le canal Saint-Martin", source: "Wikipédia « 10e arrondissement de Paris » ; INSEE, comparateur de territoires, commune 75110 (RP2023)" },
    { fait: "La mairie du 10e compte 6 conseils de quartier ; Canal Saint-Martin, Gare du Nord et Gare de l’Est sont des noms d’usage courant, distincts des 4 quartiers administratifs officiels (Saint-Vincent-de-Paul, Porte-Saint-Denis, Porte-Saint-Martin, Hôpital-Saint-Louis)", source: "mairie10.paris.fr, « Conseils de quartier » ; conseilsdequartierparis10.fr" }
  ],
  meta: {
    title: "Assurance emprunteur à Paris 10e | GP Finances",
    description:
      "Changez d’assurance de prêt à Paris 10e avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
