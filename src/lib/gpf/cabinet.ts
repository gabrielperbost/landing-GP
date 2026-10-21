// Informations légales du cabinet, reprises dans les documents générés
// (DER, lettre de mission, courriers…) et dans les mentions de pied de page.
export const CABINET = {
  nom: "GP Finances",
  dirigeant: "Gabriel PERBOST",
  qualite: "Courtier en assurance",
  orias: "23003789",
  siren: "899 363 907",
  rcs: "RCS Nanterre 899 363 907",
  ville: "Issy-les-Moulineaux",
  email: "contact@gp-finances.fr",
  site: "https://gp-finances.fr"
} as const;

export const MENTIONS_LEGALES = `${CABINET.nom} — ${CABINET.qualite}, immatriculé à l'ORIAS sous le n° ${CABINET.orias} (www.orias.fr) — SIREN ${CABINET.siren} — ${CABINET.rcs}.`;
