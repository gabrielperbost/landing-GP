/**
 * Compteur global d'économies.
 *
 * Chaque jour écoulé depuis la date d'ancrage ajoute entre 100 € et 1 000 €.
 * L'incrément de chaque jour est calculé de façon déterministe à partir du numéro du jour :
 * la valeur est donc la même pour tous les visiteurs et sur toutes les instances du serveur,
 * sans fichier ni base de données (le disque d'un hébergement serverless ne persiste pas),
 * et elle progresse toute seule, sans tâche planifiée obligatoire.
 */

export type CounterReadResult = {
  value: number;
  lastUpdated: string;
  periodsApplied: number;
  appliedIncrements: number[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_INCREMENT = 100;
const MAX_INCREMENT = 1000;
// Valeur affichée à la date d'ancrage (minuit UTC). Ne pas modifier sans raison :
// changer ces deux constantes déplace tout l'historique du compteur.
const ANCHOR_VALUE = 3_126_375;
const ANCHOR_MS = Date.UTC(2026, 5, 15);
const START_VALUE = 3_058_072;

/** Entier pseudo-aléatoire stable pour un numéro de jour donné (mélange 32 bits). */
const hashDay = (dayIndex: number): number => {
  let x = (dayIndex + 0x9e3779b9) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return x >>> 0;
};

export const incrementForDay = (dayIndex: number): number =>
  MIN_INCREMENT + (hashDay(dayIndex) % (MAX_INCREMENT - MIN_INCREMENT + 1));

export const computeCounter = (nowMs: number): CounterReadResult => {
  const days = Math.max(0, Math.floor((nowMs - ANCHOR_MS) / DAY_MS));
  const appliedIncrements: number[] = [];
  let value = ANCHOR_VALUE;
  for (let day = 1; day <= days; day += 1) {
    const increment = incrementForDay(day);
    appliedIncrements.push(increment);
    value += increment;
  }
  return {
    value,
    lastUpdated: new Date(ANCHOR_MS + days * DAY_MS).toISOString(),
    periodsApplied: days,
    appliedIncrements
  };
};

export const getSavingsCounter = async (): Promise<CounterReadResult> => computeCounter(Date.now());

/** Conservé pour la route de mise à jour planifiée : rien à écrire, la valeur est calculée. */
export const updateSavingsCounter = async (): Promise<CounterReadResult> => getSavingsCounter();

export const COUNTER_START_VALUE = START_VALUE;
