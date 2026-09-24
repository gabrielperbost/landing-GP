import { test } from "node:test";
import assert from "node:assert/strict";
import { computeCounter, incrementForDay } from "../../src/lib/savingsCounterStore.ts";

const DAY = 86_400_000;
const ANCHOR = Date.UTC(2026, 5, 15);

test("le compteur augmente de 100 à 1 000 € chaque jour, sans saut ni recul", () => {
  let previous = computeCounter(ANCHOR).value;
  assert.equal(previous, 3_126_375);
  for (let day = 1; day <= 400; day += 1) {
    const now = computeCounter(ANCHOR + day * DAY + 3 * 3_600_000).value;
    const step = now - previous;
    assert.ok(step >= 100 && step <= 1000, `jour ${day} : +${step}`);
    previous = now;
  }
});
test("valeur stable dans la journée, identique pour tous, et étalée sur la plage", () => {
  const a = computeCounter(ANCHOR + 50 * DAY + 60_000).value;
  const b = computeCounter(ANCHOR + 50 * DAY + 20 * 3_600_000).value;
  assert.equal(a, b);
  const steps = new Set(Array.from({ length: 200 }, (_, i) => incrementForDay(i + 1)));
  assert.ok(steps.size > 100, "les incréments doivent varier");
  const values = [...steps];
  assert.ok(Math.min(...values) >= 100 && Math.max(...values) <= 1000);
});
test("avant la date d'ancrage, la valeur reste celle d'ancrage", () => {
  assert.equal(computeCounter(ANCHOR - 5 * DAY).value, 3_126_375);
});
