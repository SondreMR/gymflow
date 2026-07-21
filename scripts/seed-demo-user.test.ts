import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSafeDefaultSeedTarget,
  createDemoProjection,
  getSeedStartingXp,
  runTakeoverCleanup,
} from "./seed-demo-user";

test("normal seeding refuses a target with existing non-demo data", () => {
  assert.throws(
    () =>
      assertSafeDefaultSeedTarget({
        customExercises: 0,
        nonDemoPrograms: 0,
        nonDemoRecords: 0,
        nonDemoSessions: 1,
      }),
    /safe default seeding is refusing takeover/,
  );
});

test("takeover dry-run projects a clean Level 55 dataset without writing", async () => {
  const calls: Array<{ model: string; where: unknown }> = [];
  const tx = createTransactionSpy(calls);

  const didDelete = await runTakeoverCleanup({
    dryRun: true,
    tx,
    userId: "selected-user",
  });
  const projection = createDemoProjection({
    existingXp: 999_999,
    now: new Date("2026-07-21T12:00:00.000Z"),
    replaceExistingTarget: true,
  });

  assert.equal(didDelete, false);
  assert.deepEqual(calls, []);
  assert.equal(
    getSeedStartingXp({ existingXp: 999_999, replaceExistingTarget: true }),
    0,
  );
  assert.equal(projection.projectedLevel, 55);
  assert.ok(projection.plans.length > 0);
  assert.ok(projection.targetTrophies.length > 0);
});

test("takeover confirmation removes only the selected user's application data", async () => {
  const calls: Array<{ model: string; where: unknown }> = [];
  const tx = createTransactionSpy(calls);

  const didDelete = await runTakeoverCleanup({
    dryRun: false,
    tx,
    userId: "selected-user",
  });

  assert.equal(didDelete, true);
  assert.deepEqual(calls, [
    { model: "personalRecord", where: { userId: "selected-user" } },
    { model: "userTrophy", where: { userId: "selected-user" } },
    { model: "workoutSession", where: { userId: "selected-user" } },
    { model: "workoutProgram", where: { userId: "selected-user" } },
    {
      model: "exercise",
      where: { userId: "selected-user", isSystem: false },
    },
  ]);
});

function createTransactionSpy(calls: Array<{ model: string; where: unknown }>) {
  const model = (name: string) => ({
    deleteMany: async ({ where }: { where: unknown }) => {
      calls.push({ model: name, where });
      return { count: 0 };
    },
  });
  return {
    exercise: model("exercise"),
    personalRecord: model("personalRecord"),
    userTrophy: model("userTrophy"),
    workoutProgram: model("workoutProgram"),
    workoutSession: model("workoutSession"),
  } as never;
}
