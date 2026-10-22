// Informations légales du cabinet, reprises dans les documents générés
// (DER, lettre de mission, courriers…) et dans les mentions de pied de page.
// Source : mentions légales du site gp-finances.fr.
export const CABINET = {
  nom: "GP Finances",
  dirigeant: "Gabriel PERBOST",
  qualite: "Courtier en assurance",
  statuts: "courtier en assurance et courtier en opérations de banque et services de paiement",
  orias: "23003789",
  siren: "899 363 907",
  rcs: "RCS Nanterre 899 363 907",
  adresse: "24 rue du Gouverneur Général Éboué",
  codePostal: "92130",
  ville: "Issy-les-Moulineaux",
  telephone: "06 51 22 42 13",
  email: "contact@gp-finances.fr",
  site: "https://gp-finances.fr",
  association: "CNCEF",
  autorite: "Autorité de contrôle prudentiel et de résolution (ACPR), 4 place de Budapest, CS 92459, 75436 Paris Cedex 09",
  // À compléter : non publiés sur le site.
  mediateur: process.env.GPF_MEDIATEUR || "[à compléter : médiateur de la consommation]",
  rcPro: process.env.GPF_RC_PRO || "[à compléter : assureur RC professionnelle et n° de police]"
} as const;

export const MENTIONS_LEGALES = `${CABINET.nom} — ${CABINET.qualite}, immatriculé à l'ORIAS sous le n° ${CABINET.orias} (www.orias.fr) — SIREN ${CABINET.siren} — ${CABINET.rcs}.`;
