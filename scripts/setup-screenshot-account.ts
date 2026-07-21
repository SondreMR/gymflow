import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, WeightUnit } from "../src/generated/prisma/client";
import { DEMO_SYSTEM_EXERCISE_KEYS } from "../src/lib/system-exercises";
import {
  calculateBaseXp,
  getEligibleTrophies,
  getStreakMultiplier,
  totalXpRequiredForLevel,
} from "../src/features/progression/progression";

const TARGET_AUTH_USER_ID = "d81d1d82-91a2-4514-895b-e2447b417070";
const LEVEL = 55;
const TARGET_XP = totalXpRequiredForLevel(LEVEL);
const STREAK_WEEKS = 11;
const SESSION_MULTIPLIER = getStreakMultiplier(STREAK_WEEKS);
const SESSION_COUNT = 16;

type DayKey = "Push" | "Pull" | "Legs" | "Upper" | "Lower";

const dayDefinitions: Record<
  DayKey,
  Array<{
    key: (typeof DEMO_SYSTEM_EXERCISE_KEYS)[number];
    repRange: [number, number];
    sets: number;
  }>
> = {
  Push: [
    { key: "barbell-bench-press", repRange: [5, 8], sets: 4 },
    { key: "incline-dumbbell-press", repRange: [8, 12], sets: 3 },
    { key: "overhead-press", repRange: [6, 10], sets: 3 },
  ],
  Pull: [
    { key: "weighted-pull-up", repRange: [5, 8], sets: 4 },
    { key: "barbell-row", repRange: [6, 10], sets: 4 },
    { key: "lat-pulldown", repRange: [8, 12], sets: 3 },
  ],
  Legs: [
    { key: "back-squat", repRange: [5, 8], sets: 4 },
    { key: "romanian-deadlift", repRange: [6, 10], sets: 3 },
    { key: "leg-press", repRange: [10, 15], sets: 3 },
  ],
  Upper: [
    { key: "barbell-bench-press", repRange: [6, 10], sets: 3 },
    { key: "weighted-pull-up", repRange: [6, 10], sets: 3 },
    { key: "overhead-press", repRange: [8, 10], sets: 3 },
    { key: "barbell-row", repRange: [8, 12], sets: 3 },
  ],
  Lower: [
    { key: "conventional-deadlift", repRange: [3, 6], sets: 3 },
    { key: "back-squat", repRange: [6, 10], sets: 3 },
    { key: "lying-leg-curl", repRange: [10, 15], sets: 3 },
  ],
};

const workoutPlan: Array<{ day: DayKey; dayOffset: number; weekOffset: number }> = [
  { day: "Push", dayOffset: 0, weekOffset: -3 },
  { day: "Pull", dayOffset: 2, weekOffset: -3 },
  { day: "Legs", dayOffset: 4, weekOffset: -3 },
  { day: "Upper", dayOffset: 5, weekOffset: -3 },
  { day: "Lower", dayOffset: 0, weekOffset: -2 },
  { day: "Push", dayOffset: 1, weekOffset: -2 },
  { day: "Pull", dayOffset: 3, weekOffset: -2 },
  { day: "Legs", dayOffset: 5, weekOffset: -2 },
  { day: "Upper", dayOffset: 0, weekOffset: -1 },
  { day: "Lower", dayOffset: 2, weekOffset: -1 },
  { day: "Push", dayOffset: 4, weekOffset: -1 },
  { day: "Pull", dayOffset: 5, weekOffset: -1 },
  { day: "Legs", dayOffset: 0, weekOffset: 0 },
  { day: "Upper", dayOffset: 1, weekOffset: 0 },
  { day: "Lower", dayOffset: 3, weekOffset: 0 },
  { day: "Push", dayOffset: 5, weekOffset: 0 },
];

const personalRecords: Record<string, number> = {
  "barbell-bench-press": 120,
  "back-squat": 170,
  "conventional-deadlift": 210,
  "overhead-press": 75,
  "barbell-row": 110,
  "weighted-pull-up": 35,
};

function startOfUtcWeek(now: Date) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start;
}

function completedAt(now: Date, weekOffset: number, dayOffset: number, index: number) {
  const date = startOfUtcWeek(now);
  const currentWeekday = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1;
  const completedDayOffset =
    weekOffset === 0 ? Math.min(dayOffset, currentWeekday) : dayOffset;
  date.setUTCDate(date.getUTCDate() + weekOffset * 7 + completedDayOffset);
  date.setUTCHours(6 + (index % 3), 30, 0, 0);
  return date;
}

function workingWeight(key: string, workoutIndex: number, setIndex: number) {
  const target =
    personalRecords[key] ??
    {
      "incline-dumbbell-press": 36,
      "lat-pulldown": 75,
      "leg-press": 220,
      "lying-leg-curl": 55,
      "romanian-deadlift": 135,
    }[key] ??
    40;
  return Math.round(target * (0.7 + ((workoutIndex + setIndex * 2) % 8) / 100) * 2) / 2;
}

function requireConfirmation() {
  if (!process.argv.slice(2).includes("--confirm")) {
    throw new Error(
      "This one-time screenshot setup only runs with --confirm. No data was changed.",
    );
  }
}

async function main() {
  requireConfirmation();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL must be configured.");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const users = await prisma.user.findMany({
      where: { authUserId: TARGET_AUTH_USER_ID },
      select: { id: true },
    });
    if (users.length !== 1) {
      throw new Error(
        `Expected exactly one GymFlow User for the fixed target auth ID; found ${users.length}. No data was changed.`,
      );
    }
    const userId = users[0].id;
    const summary = await prisma.$transaction(async (tx) => {
      const systemExercises = await tx.exercise.findMany({
        where: {
          isSystem: true,
          systemKey: { in: [...DEMO_SYSTEM_EXERCISE_KEYS] },
          userId: null,
        },
        select: { id: true, name: true, systemKey: true },
      });
      if (systemExercises.length !== DEMO_SYSTEM_EXERCISE_KEYS.length) {
        throw new Error(
          "Required canonical global exercises are missing. Run npm run prisma:seed first.",
        );
      }
      const exerciseByKey = new Map(
        systemExercises.map((exercise) => [exercise.systemKey!, exercise]),
      );

      await tx.personalRecord.deleteMany({ where: { userId } });
      await tx.userTrophy.deleteMany({ where: { userId } });
      await tx.workoutSession.deleteMany({ where: { userId } });
      await tx.workoutProgram.deleteMany({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: {
          displayName: "GymFlow Demo",
          preferredWeightUnit: WeightUnit.KG,
          weeklyWorkoutGoal: 5,
        },
      });

      const programs = new Map<
        string,
        {
          id: string;
          days: Map<DayKey, { id: string; exerciseLinks: Map<string, string> }>;
        }
      >();
      for (const [name, dayNames] of [
        ["Push Pull Legs", ["Push", "Pull", "Legs"]],
        ["Upper Lower", ["Upper", "Lower"]],
      ] as const) {
        const program = await tx.workoutProgram.create({
          data: { name, userId },
        });
        const programDays = new Map<
          DayKey,
          { id: string; exerciseLinks: Map<string, string> }
        >();
        for (const [position, dayName] of dayNames.entries()) {
          const day = await tx.workoutDay.create({
            data: { name: dayName, position, programId: program.id },
          });
          const exerciseLinks = new Map<string, string>();
          for (const [exercisePosition, definition] of dayDefinitions[
            dayName
          ].entries()) {
            const link = await tx.workoutDayExercise.create({
              data: {
                exerciseId: exerciseByKey.get(definition.key)!.id,
                position: exercisePosition,
                targetRepMax: definition.repRange[1],
                targetRepMin: definition.repRange[0],
                targetSets: definition.sets,
                workoutDayId: day.id,
              },
            });
            exerciseLinks.set(definition.key, link.id);
          }
          programDays.set(dayName, { id: day.id, exerciseLinks });
        }
        programs.set(name, { id: program.id, days: programDays });
      }

      const prSources = new Map<
        string,
        { achievedAt: Date; sessionExerciseId: string; sessionId: string }
      >();
      for (const [index, plan] of workoutPlan.entries()) {
        const programName = ["Push", "Pull", "Legs"].includes(plan.day)
          ? "Push Pull Legs"
          : "Upper Lower";
        const program = programs.get(programName)!;
        const day = program.days.get(plan.day)!;
        const finishedAt = completedAt(
          new Date(),
          plan.weekOffset,
          plan.dayOffset,
          index,
        );
        const durationSeconds = 3300 + ((index * 257) % 1500);
        const session = await tx.workoutSession.create({
          data: {
            baseXp: calculateBaseXp(
              dayDefinitions[plan.day].reduce(
                (total, exercise) => total + exercise.sets,
                0,
              ),
            ),
            completedAt: finishedAt,
            durationSeconds,
            earnedXp:
              Math.floor(TARGET_XP / SESSION_COUNT) +
              (index < TARGET_XP % SESSION_COUNT ? 1 : 0),
            goalBonusXp: 0,
            programName,
            sourceProgramId: program.id,
            sourceWorkoutDayId: day.id,
            startedAt: new Date(finishedAt.getTime() - durationSeconds * 1000),
            status: "COMPLETED",
            streakMultiplier: SESSION_MULTIPLIER,
            userId,
            workoutDayName: plan.day,
          },
        });
        for (const [exercisePosition, definition] of dayDefinitions[
          plan.day
        ].entries()) {
          const sourceExercise = exerciseByKey.get(definition.key)!;
          const sessionExercise = await tx.workoutSessionExercise.create({
            data: {
              exerciseName: sourceExercise.name,
              position: exercisePosition,
              sourceDayExerciseId: day.exerciseLinks.get(definition.key),
              sourceExerciseId: sourceExercise.id,
              targetRepMax: definition.repRange[1],
              targetRepMin: definition.repRange[0],
              targetSets: definition.sets,
              workoutSessionId: session.id,
            },
          });
          for (let setIndex = 0; setIndex < definition.sets; setIndex += 1) {
            await tx.workoutSet.create({
              data: {
                isCompleted: true,
                position: setIndex,
                reps:
                  definition.repRange[0] +
                  ((index + setIndex) %
                    (definition.repRange[1] - definition.repRange[0] + 1)),
                weightKg: workingWeight(definition.key, index, setIndex),
                workoutSessionExerciseId: sessionExercise.id,
              },
            });
          }
          if (definition.key in personalRecords) {
            prSources.set(definition.key, {
              achievedAt: finishedAt,
              sessionExerciseId: sessionExercise.id,
              sessionId: session.id,
            });
          }
        }
      }

      for (const [key, weight] of Object.entries(personalRecords)) {
        const source = prSources.get(key);
        const exercise = exerciseByKey.get(key);
        if (!source || !exercise)
          throw new Error(`Missing PR source for canonical exercise ${key}.`);
        const topSet = await tx.workoutSet.findFirstOrThrow({
          where: { workoutSessionExerciseId: source.sessionExerciseId },
          orderBy: { position: "desc" },
        });
        await tx.workoutSet.update({
          where: { id: topSet.id },
          data: { reps: key === "conventional-deadlift" ? 3 : 5, weightKg: weight },
        });
        await tx.personalRecord.create({
          data: {
            achievedAt: source.achievedAt,
            currentWeight: weight,
            exerciseId: exercise.id,
            previousWeight: weight - 5,
            userId,
            workoutSessionId: source.sessionId,
          },
        });
      }
      const trophies = getEligibleTrophies(LEVEL);
      await tx.userTrophy.createMany({
        data: trophies.map((trophy) => ({ trophyKey: trophy.key, userId })),
      });
      const xp = await tx.workoutSession.aggregate({
        where: { status: "COMPLETED", userId },
        _sum: { earnedXp: true },
      });
      if (xp._sum.earnedXp !== TARGET_XP)
        throw new Error("Screenshot XP validation failed.");
      return {
        personalRecords: Object.keys(personalRecords).length,
        sessions: workoutPlan.length,
        trophies: trophies.length,
      };
    });
    console.log(
      `Screenshot account configured: ${summary.sessions} completed workouts, ${summary.personalRecords} personal records, ${summary.trophies} trophies, Level ${LEVEL} at ${TARGET_XP} XP.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith("setup-screenshot-account.ts")) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Screenshot setup failed.");
    process.exitCode = 1;
  });
}
