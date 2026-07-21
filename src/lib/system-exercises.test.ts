import assert from "node:assert/strict";
import test from "node:test";

import { systemExercises } from "../../prisma/seed";
import {
  assertDemoExerciseDefinitions,
  DEMO_SYSTEM_EXERCISE_KEYS,
  resolveDemoSystemExercises,
} from "./system-exercises";

test("the standard seed catalog includes every demo-required system exercise", () => {
  assert.doesNotThrow(() => assertDemoExerciseDefinitions(systemExercises));
  const definedKeys = new Set(systemExercises.map(({ key }) => key));
  for (const key of DEMO_SYSTEM_EXERCISE_KEYS) assert.ok(definedKeys.has(key));
});

test("demo system-exercise resolution succeeds from standard seed definitions", () => {
  const result = resolveDemoSystemExercises(
    systemExercises.map((exercise) => ({
      id: exercise.key,
      isSystem: true,
      systemKey: exercise.key,
      userId: null,
    })),
  );

  assert.equal(result.isComplete, true);
  assert.deepEqual(result.diagnostics, [
    ...DEMO_SYSTEM_EXERCISE_KEYS.map((expectedIdentifier) => ({
      expectedIdentifier,
      matchingExerciseExists: true,
      failedCriterion: null,
    })),
  ]);
});

test("a similar user-owned custom exercise never resolves as a global system exercise", () => {
  const result = resolveDemoSystemExercises([
    {
      id: "custom-exercise",
      isSystem: false,
      systemKey: "barbell-bench-press",
      userId: "another-user",
    },
  ]);

  assert.equal(result.isComplete, false);
  assert.deepEqual(result.diagnostics[0], {
    expectedIdentifier: "barbell-bench-press",
    matchingExerciseExists: true,
    failedCriterion: "isSystem",
  });
  assert.equal(
    result.exercises.some(({ id }) => id === "custom-exercise"),
    false,
  );
});
