import { promises as fs } from "fs";
import path from "path";

type CounterState = {
  value: number;
  lastUpdated: string;
};

export type CounterReadResult = CounterState & {
  periodsApplied: number;
  appliedIncrements: number[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_INCREMENT = 100;
const MAX_INCREMENT = 1000;
const START_VALUE = 3_058_072;
const COUNTER_PATH = path.join(process.cwd(), "data", "counter.json");

let writeQueue: Promise<unknown> = Promise.resolve();

const withFileLock = async <T>(task: () => Promise<T>): Promise<T> => {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

const randomIncrement = () => Math.floor(Math.random() * (MAX_INCREMENT - MIN_INCREMENT + 1)) + MIN_INCREMENT;

const isValidState = (value: unknown): value is CounterState => {
  if (!value || typeof value !== "object") return false;
  const state = value as CounterState;
  if (typeof state.value !== "number" || !Number.isFinite(state.value) || state.value < 0) return false;
  if (typeof state.lastUpdated !== "string") return false;
  return !Number.isNaN(Date.parse(state.lastUpdated));
};

const createDefaultState = (): CounterState => ({
  value: START_VALUE,
  lastUpdated: new Date().toISOString()
});

const ensureCounterFile = async (): Promise<void> => {
  await fs.mkdir(path.dirname(COUNTER_PATH), { recursive: true });
  try {
    await fs.access(COUNTER_PATH);
  } catch {
    await fs.writeFile(COUNTER_PATH, JSON.stringify(createDefaultState(), null, 2), "utf8");
  }
};

const readState = async (): Promise<CounterState> => {
  await ensureCounterFile();
  try {
    const raw = await fs.readFile(COUNTER_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (isValidState(parsed)) {
      return parsed;
    }
  } catch {
    // ignore read/parse errors and reset below
  }

  const fallback = createDefaultState();
  await fs.writeFile(COUNTER_PATH, JSON.stringify(fallback, null, 2), "utf8");
  return fallback;
};

const writeState = async (state: CounterState): Promise<void> => {
  await fs.writeFile(COUNTER_PATH, JSON.stringify(state, null, 2), "utf8");
};

const applyElapsedPeriods = (state: CounterState, nowMs: number): CounterReadResult => {
  const previousUpdateMs = Date.parse(state.lastUpdated);
  const safePreviousMs = Number.isNaN(previousUpdateMs) ? nowMs : previousUpdateMs;
  const elapsedMs = Math.max(0, nowMs - safePreviousMs);
  const periodsApplied = Math.floor(elapsedMs / DAY_MS);

  if (periodsApplied <= 0) {
    return { ...state, periodsApplied: 0, appliedIncrements: [] };
  }

  const appliedIncrements: number[] = [];
  let nextValue = state.value;

  for (let i = 0; i < periodsApplied; i += 1) {
    const increment = randomIncrement();
    appliedIncrements.push(increment);
    nextValue += increment;
  }

  const nextUpdatedAtMs = safePreviousMs + periodsApplied * DAY_MS;

  return {
    value: nextValue,
    lastUpdated: new Date(nextUpdatedAtMs).toISOString(),
    periodsApplied,
    appliedIncrements
  };
};

export const getSavingsCounter = async (): Promise<CounterReadResult> =>
  withFileLock(async () => {
    const current = await readState();
    const next = applyElapsedPeriods(current, Date.now());

    if (next.periodsApplied > 0) {
      await writeState({ value: next.value, lastUpdated: next.lastUpdated });
    }

    return next;
  });

export const updateSavingsCounter = async (): Promise<CounterReadResult> => getSavingsCounter();

export const COUNTER_START_VALUE = START_VALUE;
