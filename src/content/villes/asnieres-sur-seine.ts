import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const asnieresSurSeine: VilleData = {
  slug: "asnieres-sur-seine",
  nom: "Asnières-sur-Seine",
  type: "commune",
  codesPostaux: ["92600"],
  departement: "92",
  villesVoisines: ["bois-colombes", "clichy", "colombes"],
  quartiers: ["Bac-Bécon-Flachat", "Centre-Mairie", "Grésillons-Bords de Seine", "Les Hauts d’Asnières", "Voltaire-Bourguignons"],
  profilImmobilier:
    "Asnières-sur-Seine est l’une des communes les plus denses et les plus peuplées du 92, avec un marché presque entièrement tourné vers l’appartement (plus de dix fois plus de ventes d’appartements que de maisons). La proximité de Paris (17e) en fait une commune recherchée par les jeunes actifs.",
  prixM2: {
    appartements: { valeur: 6202, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 7988, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 93941, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de primo-accédants et de jeunes couples, souvent sur des surfaces plus modestes compte tenu du prix au m². Les prêts à deux emprunteurs sont fréquents, tout comme les changements d’assurance en cours de prêt pour réduire une mensualité déjà tendue par le prix d’achat. Les durées de prêt dépassent rarement 25 ans sur ce profil de premier achat, et beaucoup d’emprunteurs cherchent justement à compenser un prix au m² élevé par une assurance moins chère, sans toucher au crédit lui-même.",
  accesBureau:
    "GP Finances est basé à Issy-les-Moulineaux, dans le 92. Les rendez-vous se tiennent généralement par téléphone ou en visioconférence ; je peux aussi vous recevoir au cabinet, sur demande.",
  angleEditorial: "Marché d’appartements tendu : chaque économie compte.",
  faqLocales: [
    {
      q: "Nous venons d’acheter un petit appartement à Asnières à deux : la loi Lemoine s’applique-t-elle aussi ?",
      r: "Oui, sans condition de surface ni d’ancienneté du bien. Le droit de changer d’assurance s’applique à tout prêt immobilier en cours."
    },
    {
      q: "Le prix au m² est élevé à Asnières : est-ce que cela augmente le coût de l’assurance ?",
      r: "Le coût de l’assurance dépend du capital emprunté, pas directement du prix au m². Sur un capital élevé, comparer les contrats a d’autant plus d’intérêt."
    },
    {
      q: "Le marché à Asnières est tendu, avec des appartements souvent plus petits qu’ailleurs : cela a-t-il un impact sur l’assurance ?",
      r: "Non, la surface du bien n’entre pas dans le calcul de l’assurance de prêt. Ce qui compte, c’est le capital emprunté et votre profil (âge, santé)."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Bac-Bécon-Flachat, Centre-Mairie, Grésillons-Bords de Seine, Les Hauts d’Asnières, Voltaire-Bourguignons", source: "Site officiel de la mairie d’Asnières-sur-Seine, « Les conseils consultatifs de quartiers » (5 CCQ)" }
  ],
  meta: {
    title: "Assurance emprunteur à Asnières-sur-Seine | GP Finances",
    description:
      "Changez d’assurance de prêt à Asnières-sur-Seine avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
