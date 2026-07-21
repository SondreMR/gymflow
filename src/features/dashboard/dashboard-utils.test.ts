import assert from "node:assert/strict";
import test from "node:test";

import {
  getDailyStreaks,
  getWeeklyActivity,
  getWeeklyGoalStreaks,
  getWorkoutVolume,
  getXpProgress,
} from "@/features/dashboard/dashboard-utils";
import type { DashboardWorkoutRecord } from "@/features/dashboard/types";

const now = new Date("2026-07-21T12:00:00.000Z");

function workout(completedAt: string, sets: DashboardWorkoutRecord["sets"] = []) {
  return {
    completedAt: new Date(completedAt),
    durationSeconds: 3600,
    earnedXp: 0,
    id: completedAt,
    programName: "Strength",
    sets,
    workoutDayName: "Upper",
  } satisfies DashboardWorkoutRecord;
}

test("empty workout history has no streak and starts at level one", () => {
  assert.deepEqual(getDailyStreaks([], now), { current: 0, personalBest: 0 });
  assert.deepEqual(getXpProgress([], 0), {
    current: 1,
    progressPercent: 0,
    progressXp: 0,
    totalXp: 0,
    xpToNextLevel: 500,
  });
});

test("multiple workouts on one calendar day count as one streak day", () => {
  const workouts = [
    workout("2026-07-21T06:00:00.000Z"),
    workout("2026-07-21T18:00:00.000Z"),
    workout("2026-07-20T12:00:00.000Z"),
  ];

  assert.deepEqual(getDailyStreaks(workouts, now), { current: 2, personalBest: 2 });
});

test("a gap breaks the current streak", () => {
  const workouts = [
    workout("2026-07-20T12:00:00.000Z"),
    workout("2026-07-18T12:00:00.000Z"),
  ];

  assert.deepEqual(getDailyStreaks(workouts, now), { current: 1, personalBest: 1 });
});

test("an ongoing streak includes consecutive workouts through today", () => {
  const workouts = [
    workout("2026-07-21T12:00:00.000Z"),
    workout("2026-07-20T12:00:00.000Z"),
    workout("2026-07-19T12:00:00.000Z"),
  ];

  assert.deepEqual(getDailyStreaks(workouts, now), { current: 3, personalBest: 3 });
});

test("weekly activity starts on Monday and excludes the preceding Sunday", () => {
  const activity = getWeeklyActivity(
    [workout("2026-07-19T12:00:00.000Z"), workout("2026-07-20T12:00:00.000Z")],
    now,
  );

  assert.equal(activity[0].date, "2026-07-20");
  assert.equal(activity[0].completedWorkouts, 1);
  assert.equal(
    activity.reduce((total, day) => total + day.completedWorkouts, 0),
    1,
  );
});

test("volume preserves decimal weights and ignores incomplete sets", () => {
  assert.equal(
    getWorkoutVolume([
      { isCompleted: true, reps: 5, weightKg: 82.5 },
      { isCompleted: true, reps: 10, weightKg: 100 },
      { isCompleted: false, reps: 20, weightKg: 20 },
    ]),
    1412.5,
  );
});

test("XP advances level at each 500 XP boundary", () => {
  const workouts = Array.from({ length: 5 }, (_, index) =>
    workout(`2026-07-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`),
  );

  assert.deepEqual(getXpProgress(workouts, 0), {
    current: 2,
    progressPercent: 0,
    progressXp: 0,
    totalXp: 500,
    xpToNextLevel: 500,
  });
});

function workoutsInWeek(weekStart: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    workout(`${weekStart}T${String(8 + index).padStart(2, "0")}:00:00.000Z`),
  );
}

test("an unfinished current week preserves the prior successful-week streak", () => {
  const workouts = [
    ...workoutsInWeek("2026-07-13", 4),
    ...workoutsInWeek("2026-07-20", 3),
  ];

  assert.deepEqual(getWeeklyGoalStreaks(workouts, 4, now), {
    current: 1,
    personalBest: 1,
  });
});

test("the current week extends the streak only after reaching the goal", () => {
  const workouts = [
    ...workoutsInWeek("2026-07-13", 4),
    ...workoutsInWeek("2026-07-20", 4),
  ];

  assert.deepEqual(getWeeklyGoalStreaks(workouts, 4, now), {
    current: 2,
    personalBest: 2,
  });
});

test("a failed previous week resets the streak unless the current week succeeds", () => {
  const previousWeek = workoutsInWeek("2026-07-13", 3);
  assert.deepEqual(getWeeklyGoalStreaks(previousWeek, 4, now), {
    current: 0,
    personalBest: 0,
  });
  assert.deepEqual(
    getWeeklyGoalStreaks([...previousWeek, ...workoutsInWeek("2026-07-20", 4)], 4, now),
    { current: 1, personalBest: 1 },
  );
});

test("consecutive successful weeks and personal best include weekly gaps", () => {
  const workouts = [
    ...workoutsInWeek("2026-06-22", 4),
    ...workoutsInWeek("2026-06-29", 4),
    ...workoutsInWeek("2026-07-06", 4),
    ...workoutsInWeek("2026-07-13", 2),
  ];

  assert.deepEqual(getWeeklyGoalStreaks(workouts, 4, now), {
    current: 0,
    personalBest: 3,
  });
});

test("multiple workouts on one day count separately toward the weekly goal", () => {
  const workouts = workoutsInWeek("2026-07-13", 4);

  assert.deepEqual(getWeeklyGoalStreaks(workouts, 4, now), {
    current: 1,
    personalBest: 1,
  });
});

test("weekly-goal streaks handle empty history and current goal changes deterministically", () => {
  const workouts = workoutsInWeek("2026-07-13", 3);
  assert.deepEqual(getWeeklyGoalStreaks([], 4, now), {
    current: 0,
    personalBest: 0,
  });
  assert.deepEqual(getWeeklyGoalStreaks(workouts, 3, now), {
    current: 1,
    personalBest: 1,
  });
  assert.deepEqual(getWeeklyGoalStreaks(workouts, 4, now), {
    current: 0,
    personalBest: 0,
  });
});
