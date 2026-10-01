import type { VilleData } from "./types.ts";

// Prix/population : src/content/localData92.json (DVF/INSEE, récupérés le 2026-09-25).
export const bagneux: VilleData = {
  slug: "bagneux",
  nom: "Bagneux",
  type: "commune",
  codesPostaux: ["92220"],
  departement: "92",
  villesVoisines: ["montrouge", "malakoff", "chatillon"],
  quartiers: ["Centre-Ville", "Victor Hugo", "Pasteur", "Henri Wallon"],
  profilImmobilier:
    "Bagneux reste l’une des communes les plus accessibles du 92 : son prix médian au m² est parmi les plus bas du département. La ville est aussi en pleine transformation urbaine, avec plusieurs secteurs rénovés ces dernières années.",
  prixM2: {
    appartements: { valeur: 4947, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" },
    maisons: { valeur: 6071, source: "DGFiP, base DVF (data.gouv.fr)", date: "2026-09-25" }
  },
  population: { valeur: 44572, source: "INSEE, via API Géo (geo.api.gouv.fr)", date: "2026-09-25" },
  profilEmprunteurs:
    "Beaucoup de primo-accédants attirés par un budget plus accessible que les communes voisines, et des capitaux empruntés en conséquence plus mesurés. Sur ce type de capital, l’écart entre deux contrats d’assurance pèse moins en valeur absolue, mais reste un levier simple pour réduire la mensualité globale. C’est souvent un premier achat pour un jeune couple ou une personne seule, avec un apport encore limité ; le questionnaire de santé, lorsqu’il reste nécessaire, est alors un point que je regarde avec attention pour éviter toute surprise au moment de la mise en place.",
  accesBureau:
    "Le cabinet est situé à Issy-les-Moulineaux. Depuis Bagneux, l’étude avance le plus souvent à distance ; un déplacement au cabinet reste possible si vous préférez un échange en personne.",
  angleEditorial: "Budget plus accessible : chaque euro économisé compte davantage.",
  faqLocales: [
    {
      q: "Nous avons acheté un appartement récent à Bagneux dans un secteur rénové : y a-t-il une particularité pour l’assurance ?",
      r: "Non, l’ancienneté ou la rénovation du quartier n’a pas d’impact sur vos droits. La loi Lemoine s’applique de la même façon à tous les prêts."
    },
    {
      q: "Notre capital emprunté à Bagneux est plus modeste qu’ailleurs dans le 92 : est-ce que comparer l’assurance vaut vraiment le coup ?",
      r: "Oui. Même sur un capital plus mesuré, l’écart entre deux contrats représente souvent plusieurs milliers d’euros sur la durée du prêt."
    },
    {
      q: "Le budget est plus serré à Bagneux : puis-je prendre une assurance moins chère au détriment des garanties ?",
      r: "Non, je ne propose que des contrats aux garanties équivalentes ou supérieures à celles exigées par votre banque : l’objectif est de réduire le coût, pas la protection."
    }
  ],
  faitsSources: [
    { fait: "Quartiers Centre-Ville, Victor Hugo, Pasteur, Henri Wallon", source: "TODO_VERIFIER — liste reprise d’un agrégateur immobilier, pas recoupée avec un découpage officiel de la mairie" },
    { fait: "Bagneux a un prix médian au m² parmi les plus bas du 92", source: "TODO_VERIFIER — déduit de la comparaison des chiffres DVF dans localData92.json, pas recoupé avec un classement départemental officiel" }
  ],
  meta: {
    title: "Assurance emprunteur à Bagneux | GP Finances",
    description:
      "Changez d’assurance de prêt à Bagneux avec un courtier indépendant. Étude gratuite, garanties équivalentes, loi Lemoine."
  }
};
