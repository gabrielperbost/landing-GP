/**
 * Remplace les tirets normaux par des tirets insécables (U+2011) pour empêcher
 * la coupure en fin de ligne au milieu d'un nom de ville composé
 * (« Issy-les-Moulineaux » ne doit jamais se couper en « Issy- / les-Moulineaux »).
 * Le navigateur peut toujours faire passer le nom entier à la ligne suivante,
 * simplement jamais au milieu.
 */
export const nonBreakingName = (value: string) => value.replace(/-/g, "‑");
