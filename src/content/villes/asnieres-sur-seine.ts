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
    "Asnières-sur-Seine est l’une des communes les plus denses et les plus peuplées du 92, avec un marché presque entièrement tourné vers l’appartement (plus de dix fois plus de ventes d’appartements que de maisons). La proximité de Paris (17e) en fait une commune recherchée pour un premier achat.",
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
      q: "J’ai un peu dépassé mon budget pour acheter à Asnières et mes mensualités sont tendues : l’assurance peut-elle vraiment faire une différence ?",
      r: "Oui, souvent plus qu’on ne le pense : sur un capital déjà conséquent pour un premier achat, l’écart entre deux contrats se chiffre vite en milliers d’euros sur la durée du prêt."
    },
    {
      q: "Je suis en CDD mais j’ai un prêt en cours à Asnières : puis-je quand même changer d’assurance ?",
      r: "Oui, votre statut professionnel actuel n’a pas d’incidence sur ce droit. Ce qui compte pour le nouveau contrat, c’est votre profil au moment de l’étude (âge, santé)."
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
