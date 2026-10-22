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
  // Siège social (adresse légale, attestation RC Pro) et bureaux (accueil et courrier).
  adresse: "2 rue Éliane Jeannin Garreau",
  bureaux: "24 rue du Gouverneur Général Éboué",
  codePostal: "92130",
  ville: "Issy-les-Moulineaux",
  telephone: "06 51 22 42 13",
  email: "contact@gp-finances.fr",
  site: "https://gp-finances.fr",
  association: "ANACOFI-Courtage",
  autorite: "Autorité de contrôle prudentiel et de résolution (ACPR), 4 place de Budapest, CS 92459, 75436 Paris Cedex 09",
  // Attestation RC Pro 2026 (QBE via +Simple), valable jusqu'au 28/02/2027 : à mettre à jour au renouvellement.
  rcPro:
    process.env.GPF_RC_PRO ||
    "QBE Europe SA/NV (par l'intermédiaire de +Simple), contrat n° RCIOB00000426 — intermédiaire d'assurance : 1 564 610 € par sinistre et 2 315 610 € par année d'assurance",
  // Médiation via l'ANACOFI (association professionnelle) : La Médiation de l'Assurance pour les
  // litiges d'assurance avec un particulier, le Médiateur de l'ANACOFI pour les autres. À confirmer auprès de l'ANACOFI.
  mediateur:
    process.env.GPF_MEDIATEUR ||
    "pour un contrat d'assurance, La Médiation de l'Assurance, TSA 50110, 75441 Paris Cedex 09 (www.mediation-assurance.org) ; pour les autres litiges, le Médiateur de l'ANACOFI, 92 rue d'Amsterdam, 75009 Paris (mediation@anacofi.asso.fr)"
} as const;

export const MENTIONS_LEGALES = `${CABINET.nom} — ${CABINET.qualite}, immatriculé à l'ORIAS sous le n° ${CABINET.orias} (www.orias.fr) — SIREN ${CABINET.siren} — ${CABINET.rcs}.`;
