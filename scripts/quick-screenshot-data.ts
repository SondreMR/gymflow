import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, WeightUnit } from "../src/generated/prisma/client";
import {
  totalXpRequiredForLevel,
  getEligibleTrophies,
} from "../src/features/progression/progression";

const TARGET_AUTH_USER_ID = "d81d1d82-91a2-4514-895b-e2447b417070";
const TARGET_LEVEL = 55;
const TARGET_XP = totalXpRequiredForLevel(TARGET_LEVEL);

type DayName = "Push" | "Pull" | "Legs" | "Upper" | "Lower";
type ExercisePlan = { key: string; reps: number; sets: number; weightKg: number };

const workouts: Array<{ day: DayName; weekOffset: number }> = [
  { day: "Push", weekOffset: -2 },
  { day: "Pull", weekOffset: -2 },
  { day: "Legs", weekOffset: -1 },
  { day: "Upper", weekOffset: -1 },
  { day: "Lower", weekOffset: 0 },
  { day: "Push", weekOffset: 0 },
  { day: "Pull", weekOffset: 0 },
  { day: "Upper", weekOffset: 0 },
];

const exercisesByDay: Record<DayName, ExercisePlan[]> = {
  Push: [
    { key: "barbell-bench-press", reps: 6, sets: 4, weightKg: 105 },
    { key: "incline-dumbbell-press", reps: 10, sets: 3, weightKg: 34 },
    { key: "overhead-press", reps: 8, sets: 3, weightKg: 62.5 },
  ],
  Pull: [
    { key: "weighted-pull-up", reps: 6, sets: 4, weightKg: 25 },
    { key: "barbell-row", reps: 8, sets: 4, weightKg: 95 },
    { key: "lat-pulldown", reps: 10, sets: 3, weightKg: 70 },
  ],
  Legs: [
    { key: "back-squat", reps: 6, sets: 4, weightKg: 150 },
    { key: "romanian-deadlift", reps: 8, sets: 3, weightKg: 125 },
    { key: "leg-press", reps: 12, sets: 3, weightKg: 210 },
  ],
  Upper: [
    { key: "barbell-bench-press", reps: 8, sets: 3, weightKg: 100 },
    { key: "weighted-pull-up", reps: 7, sets: 3, weightKg: 20 },
    { key: "overhead-press", reps: 8, sets: 3, weightKg: 60 },
    { key: "barbell-row", reps: 10, sets: 3, weightKg: 90 },
  ],
  Lower: [
    { key: "conventional-deadlift", reps: 4, sets: 3, weightKg: 185 },
    { key: "back-squat", reps: 8, sets: 3, weightKg: 135 },
    { key: "lying-leg-curl", reps: 12, sets: 3, weightKg: 52.5 },
  ],
};

const prWeights: Record<string, number> = {
  "barbell-bench-press": 120,
  "back-squat": 170,
  "barbell-row": 110,
  "conventional-deadlift": 210,
  "overhead-press": 75,
  "weighted-pull-up": 35,
};

function assertConfirmed() {
  if (!process.argv.slice(2).includes("--confirm")) {
    throw new Error("Refusing to change data without --confirm.");
  }
}

function startOfUtcWeek(now: Date) {
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date;
}

function sessionDate(now: Date, weekOffset: number, index: number) {
  const date = startOfUtcWeek(now);
  const currentWeekday = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1;
  const dayOffset =
    weekOffset === 0 ? Math.min(index, currentWeekday) : (index * 2) % 6;
  date.setUTCDate(date.getUTCDate() + weekOffset * 7 + dayOffset);
  date.setUTCHours(6 + (index % 3), 30, 0, 0);
  return date;
}

async function main() {
  assertConfirmed();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL must be configured.");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  let step = "target validation";

  try {
    const users = await prisma.user.findMany({
      where: { authUserId: TARGET_AUTH_USER_ID },
      select: { id: true },
    });
    if (users.length !== 1) {
      throw new Error(
        `Expected one GymFlow User for the fixed target; found ${users.length}.`,
      );
    }
    const userId = users[0].id;
    const requiredKeys = [
      ...new Set(
        workouts.flatMap(({ day }) => exercisesByDay[day].map(({ key }) => key)),
      ),
    ];

    step = "global exercise preflight";
    const globalExercises = await prisma.exercise.findMany({
      where: { isSystem: true, systemKey: { in: requiredKeys }, userId: null },
      select: { id: true, name: true, systemKey: true },
    });
    if (globalExercises.length !== requiredKeys.length) {
      throw new Error(
        "Required canonical global exercises are missing. Run npm run prisma:seed first.",
      );
    }
    const exerciseByKey = new Map(
      globalExercises.map((exercise) => [exercise.systemKey!, exercise]),
    );
    console.log("Preflight complete.");

    step = "target cleanup";
    await prisma.personalRecord.deleteMany({ where: { userId } });
    await prisma.userTrophy.deleteMany({ where: { userId } });
    await prisma.workoutSession.deleteMany({ where: { userId } });
    await prisma.workoutProgram.deleteMany({ where: { userId } });
    console.log("Target-owned programs, sessions, PRs, and trophies removed.");

    step = "profile update";
    await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: "GymFlow Demo",
        preferredWeightUnit: WeightUnit.KG,
        weeklyWorkoutGoal: 5,
      },
    });
    console.log("Profile updated.");

    step = "program creation";
    const programIds = new Map<string, string>();
    for (const programName of ["Push Pull Legs", "Upper Lower"]) {
      const program = await prisma.workoutProgram.create({
        data: { name: programName, userId },
      });
      programIds.set(programName, program.id);
    }
    const dayRecords = new Map<DayName, { id: string; programId: string }>();
    for (const [programName, dayNames] of [
      ["Push Pull Legs", ["Push", "Pull", "Legs"]],
      ["Upper Lower", ["Upper", "Lower"]],
    ] as const) {
      for (const [position, name] of dayNames.entries()) {
        const day = await prisma.workoutDay.create({
          data: { name, position, programId: programIds.get(programName)! },
        });
        dayRecords.set(name, { id: day.id, programId: programIds.get(programName)! });
      }
    }
    for (const [dayName, day] of dayRecords) {
      await prisma.workoutDayExercise.createMany({
        data: exercisesByDay[dayName].map((exercise, position) => ({
          exerciseId: exerciseByKey.get(exercise.key)!.id,
          position,
          targetRepMax: exercise.reps + 2,
          targetRepMin: Math.max(1, exercise.reps - 2),
          targetSets: exercise.sets,
          workoutDayId: day.id,
        })),
      });
    }
    console.log("Programs and workout days created.");

    step = "workout history creation";
    const prSources = new Map<
      string,
      {
        exerciseId: string;
        achievedAt: Date;
        sessionId: string;
        sessionExerciseId: string;
      }
    >();
    for (const [index, workout] of workouts.entries()) {
      const day = dayRecords.get(workout.day)!;
      const completedAt = sessionDate(new Date(), workout.weekOffset, index);
      const durationSeconds = 3300 + index * 180;
      const session = await prisma.workoutSession.create({
        data: {
          baseXp: 100,
          completedAt,
          durationSeconds,
          earnedXp:
            Math.floor(TARGET_XP / workouts.length) +
            (index < TARGET_XP % workouts.length ? 1 : 0),
          goalBonusXp: 0,
          programName:
            workout.day === "Upper" || workout.day === "Lower"
              ? "Upper Lower"
              : "Push Pull Legs",
          sourceProgramId: day.programId,
          sourceWorkoutDayId: day.id,
          startedAt: new Date(completedAt.getTime() - durationSeconds * 1000),
          status: "COMPLETED",
          streakMultiplier: 1,
          userId,
          workoutDayName: workout.day,
        },
      });
      for (const [position, exercise] of exercisesByDay[workout.day].entries()) {
        const sourceExercise = exerciseByKey.get(exercise.key)!;
        const sessionExercise = await prisma.workoutSessionExercise.create({
          data: {
            exerciseName: sourceExercise.name,
            position,
            sourceExerciseId: sourceExercise.id,
            targetRepMax: exercise.reps + 2,
            targetRepMin: Math.max(1, exercise.reps - 2),
            targetSets: exercise.sets,
            workoutSessionId: session.id,
          },
        });
        await prisma.workoutSet.createMany({
          data: Array.from({ length: exercise.sets }, (_, setIndex) => ({
            isCompleted: true,
            position: setIndex,
            reps: exercise.reps - (setIndex % 2),
            weightKg: exercise.weightKg - setIndex * 2.5,
            workoutSessionExerciseId: sessionExercise.id,
          })),
        });
        if (exercise.key in prWeights) {
          prSources.set(exercise.key, {
            achievedAt: completedAt,
            exerciseId: sourceExercise.id,
            sessionId: session.id,
            sessionExerciseId: sessionExercise.id,
          });
        }
      }
    }
    console.log("8 completed workouts created.");

    step = "personal records and trophies";
    for (const [key, weight] of Object.entries(prWeights)) {
      const source = prSources.get(key);
      if (!source)
        throw new Error(`No completed session exists for PR exercise ${key}.`);
      const topSet = await prisma.workoutSet.findFirstOrThrow({
        where: { workoutSessionExerciseId: source.sessionExerciseId },
        orderBy: { position: "desc" },
      });
      await prisma.workoutSet.update({
        where: { id: topSet.id },
        data: { reps: key === "conventional-deadlift" ? 3 : 5, weightKg: weight },
      });
      await prisma.personalRecord.create({
        data: {
          achievedAt: source.achievedAt,
          currentWeight: weight,
          exerciseId: source.exerciseId,
          previousWeight: weight - 5,
          userId,
          workoutSessionId: source.sessionId,
        },
      });
    }
    await prisma.userTrophy.createMany({
      data: getEligibleTrophies(TARGET_LEVEL).map((trophy) => ({
        trophyKey: trophy.key,
        userId,
      })),
    });
    console.log(
      `Setup complete: 8 workouts, 6 PRs, ${getEligibleTrophies(TARGET_LEVEL).length} trophies, Level ${TARGET_LEVEL} at ${TARGET_XP} XP.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    console.error(`Quick screenshot setup failed during ${step}: ${message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith("quick-screenshot-data.ts")) void main();
