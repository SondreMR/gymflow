import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateEarnedXp,
  getEligibleTrophies,
  getLevelProgress,
  getStreakMultiplier,
  totalXpRequiredForLevel,
  TROPHIES,
} from "@/features/progression/progression";

test("streak multiplier covers every boundary and caps at 3x", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 20].map(getStreakMultiplier),
    [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3],
  );
});

test("earned XP rounds after applying the multiplier and adds the weekly bonus", () => {
  assert.equal(calculateEarnedXp(101, 1.25), 126);
  assert.equal(calculateEarnedXp(101, 1.25, 50), 176);
});

test("every trophy threshold unlocks at its required level", () => {
  for (const trophy of TROPHIES) {
    assert.deepEqual(getEligibleTrophies(trophy.level).at(-1), trophy);
  }
  assert.equal(getEligibleTrophies(100).length, TROPHIES.length);
});

test("multiple trophies are eligible together and repeated evaluation is idempotent", () => {
  const first = getEligibleTrophies(50).map((trophy) => trophy.key);
  const second = getEligibleTrophies(50).map((trophy) => trophy.key);
  assert.deepEqual(first, second);
  assert.deepEqual(first, [
    "rookie-lifter",
    "consistent-athlete",
    "iron-regular",
    "strength-builder",
    "gym-veteran",
  ]);
});

test("level thresholds are cumulative and increasingly expensive", () => {
  assert.equal(totalXpRequiredForLevel(1), 0);
  assert.ok(totalXpRequiredForLevel(100) > totalXpRequiredForLevel(50));
  const progress = getLevelProgress(totalXpRequiredForLevel(20));
  assert.equal(progress.current, 20);
  assert.equal(progress.progressXp, 0);
});
