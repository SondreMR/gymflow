"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import {
  getStartOfUtcWeek,
  getWeeklyGoalStreaksFromDates,
} from "@/features/dashboard/dashboard-utils";
import {
  calculateBaseXp,
  calculateEarnedXp,
  getEligibleTrophies,
  getLevelProgress,
  getStreakMultiplier,
  WEEKLY_GOAL_BONUS_XP,
} from "@/features/progression/progression";
import { getSavedWorkoutSummary } from "@/features/workout/data";
import { prisma } from "@/lib/prisma";
import type { ActiveWorkout, SavedWorkoutSummary } from "@/features/workout/types";

async function requireActiveQuickSession(sessionId: string, userId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: {
      id: sessionId,
      userId,
      status: "ACTIVE",
      sourceProgramId: null,
      sourceWorkoutDayId: null,
    },
    select: { id: true },
  });
  if (!session) throw new Error("Active quick workout not found.");
}

export async function createQuickWorkoutAction(startedAt: number) {
  const user = await getCurrentUser();
  const existing = await prisma.workoutSession.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
      sourceProgramId: null,
      sourceWorkoutDayId: null,
    },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });
  if (existing) return existing.id;
  if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > Date.now() + 60000) {
    throw new Error("Workout start time is invalid.");
  }
  const session = await prisma.workoutSession.create({
    data: {
      userId: user.id,
      programName: "Quick workout",
      workoutDayName: "Quick workout",
      startedAt: new Date(startedAt),
      status: "ACTIVE",
    },
    select: { id: true },
  });
  return session.id;
}

export async function addQuickWorkoutExerciseAction(
  sessionId: string,
  exerciseId: string,
) {
  const user = await getCurrentUser();
  await requireActiveQuickSession(sessionId, user.id);
  const exercise = await prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      OR: [
        { isSystem: true, userId: null },
        { isSystem: false, userId: user.id },
      ],
    },
    select: { id: true, name: true },
  });
  if (!exercise) throw new Error("Exercise not found.");
  const duplicate = await prisma.workoutSessionExercise.findFirst({
    where: { workoutSessionId: sessionId, sourceExerciseId: exercise.id },
    select: { id: true },
  });
  if (duplicate) throw new Error("This exercise is already in the workout.");
  const position = await prisma.workoutSessionExercise.count({
    where: { workoutSessionId: sessionId },
  });
  const sessionExercise = await prisma.workoutSessionExercise.create({
    data: {
      workoutSessionId: sessionId,
      sourceExerciseId: exercise.id,
      exerciseName: exercise.name,
      position,
      targetSets: 1,
    },
    select: { id: true },
  });
  await prisma.workoutSet.create({
    data: { workoutSessionExerciseId: sessionExercise.id, position: 0 },
  });
}

export async function removeQuickWorkoutExerciseAction(
  sessionId: string,
  exerciseId: string,
) {
  const user = await getCurrentUser();
  await requireActiveQuickSession(sessionId, user.id);
  await prisma.workoutSessionExercise.deleteMany({
    where: { workoutSessionId: sessionId, sourceExerciseId: exerciseId },
  });
}

export async function discardQuickWorkoutAction(sessionId: string) {
  const user = await getCurrentUser();
  await prisma.workoutSession.deleteMany({
    where: { id: sessionId, userId: user.id, status: "ACTIVE" },
  });
}

function assertText(value: string, field: string, maxLength: number) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) throw new Error(`${field} is invalid.`);
  return trimmed;
}

function assertOptionalText(
  value: string | undefined,
  field: string,
  maxLength: number,
) {
  const trimmed = value?.trim();
  if (trimmed && trimmed.length > maxLength) throw new Error(`${field} is too long.`);
  return trimmed || null;
}

function assertPositiveInteger(value: number, field: string, maximum: number) {
  if (!Number.isInteger(value) || value < 0 || value > maximum)
    throw new Error(`${field} is invalid.`);
}

async function validateSources(workout: ActiveWorkout, userId: string) {
  if (workout.sourceProgramId) {
    const program = await prisma.workoutProgram.findFirst({
      where: { id: workout.sourceProgramId, userId },
      select: { id: true },
    });
    if (!program) throw new Error("Workout program is no longer available.");
  }
  if (workout.sourceWorkoutDayId) {
    const day = await prisma.workoutDay.findFirst({
      where: {
        id: workout.sourceWorkoutDayId,
        program: { id: workout.sourceProgramId, userId },
      },
      select: { id: true },
    });
    if (!day) throw new Error("Workout day is no longer available.");
  }

  const sourceExerciseIds = workout.exercises.map((exercise) => exercise.exerciseId);
  if (sourceExerciseIds.length) {
    const exercises = await prisma.exercise.findMany({
      where: {
        id: { in: sourceExerciseIds },
        OR: [
          { isSystem: true, userId: null },
          { userId, isSystem: false },
        ],
      },
      select: { id: true },
    });
    if (exercises.length !== new Set(sourceExerciseIds).size)
      throw new Error("An exercise is unavailable.");
  }

  const sourceDayExerciseIds = workout.exercises
    .map((exercise) => exercise.sourceDayExerciseId)
    .filter((id): id is string => Boolean(id));
  if (sourceDayExerciseIds.length && workout.sourceWorkoutDayId) {
    const dayExercises = await prisma.workoutDayExercise.findMany({
      where: {
        id: { in: sourceDayExerciseIds },
        workoutDayId: workout.sourceWorkoutDayId,
      },
      select: { id: true },
    });
    if (dayExercises.length !== new Set(sourceDayExerciseIds).size)
      throw new Error("Workout exercise source is invalid.");
  }
}

function validateWorkout(workout: ActiveWorkout) {
  assertText(workout.id, "Workout reference", 160);
  assertText(workout.workoutDayName, "Workout name", 100);
  if (workout.programName) assertText(workout.programName, "Program name", 100);
  if (
    !Number.isFinite(workout.startedAt) ||
    workout.startedAt <= 0 ||
    workout.startedAt > Date.now() + 60000
  )
    throw new Error("Workout start time is invalid.");
  if (workout.exercises.length > 100) throw new Error("Too many exercises.");

  workout.exercises.forEach((exercise) => {
    assertText(exercise.name, "Exercise name", 100);
    assertText(exercise.muscleGroup, "Muscle group", 100);
    assertPositiveInteger(exercise.targetSets, "Target sets", 20);
    if (exercise.targetSets < 1) throw new Error("Target sets are invalid.");
    if (
      exercise.targetRepMin !== undefined &&
      (!Number.isInteger(exercise.targetRepMin) || exercise.targetRepMin < 1)
    )
      throw new Error("Minimum reps are invalid.");
    if (
      exercise.targetRepMax !== undefined &&
      (!Number.isInteger(exercise.targetRepMax) ||
        exercise.targetRepMax < 1 ||
        (exercise.targetRepMin !== undefined &&
          exercise.targetRepMax < exercise.targetRepMin))
    )
      throw new Error("Maximum reps are invalid.");
    if (exercise.sets.length > 100) throw new Error("Too many sets.");
    exercise.sets.forEach((set) => {
      if (
        set.weightKg !== undefined &&
        (!Number.isFinite(set.weightKg) || set.weightKg < 0 || set.weightKg > 99999.99)
      )
        throw new Error("Weight is invalid.");
      if (
        set.reps !== undefined &&
        (!Number.isInteger(set.reps) || set.reps < 0 || set.reps > 1000)
      )
        throw new Error("Reps are invalid.");
    });
  });
}

export async function saveCompletedWorkoutAction(
  workout: ActiveWorkout,
): Promise<SavedWorkoutSummary> {
  validateWorkout(workout);
  const currentUser = await getCurrentUser();
  const existing = await getSavedWorkoutSummary(workout.id);
  if (existing) return existing;

  await validateSources(workout, currentUser.id);
  const completedAt = new Date();
  const startedAt = new Date(workout.startedAt);
  const durationSeconds = Math.max(
    1,
    Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000),
  );

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: currentUser.id },
        select: { weeklyWorkoutGoal: true },
      });
      const previousSessions = await tx.workoutSession.findMany({
        where: { userId: currentUser.id, status: "COMPLETED" },
        select: { completedAt: true, startedAt: true },
      });
      const previousDates = previousSessions.map(
        (session) => session.completedAt ?? session.startedAt,
      );
      const afterStreak = getWeeklyGoalStreaksFromDates(
        [...previousDates, completedAt],
        user.weeklyWorkoutGoal,
        completedAt,
      );
      const currentWeek = getStartOfUtcWeek(completedAt).getTime();
      const workoutsBeforeThisWeek = previousDates.filter(
        (date) => getStartOfUtcWeek(date).getTime() === currentWeek,
      ).length;
      const goalBonusXp =
        workoutsBeforeThisWeek < user.weeklyWorkoutGoal &&
        workoutsBeforeThisWeek + 1 >= user.weeklyWorkoutGoal
          ? WEEKLY_GOAL_BONUS_XP
          : 0;
      const completedSets = workout.exercises.reduce(
        (total, exercise) =>
          total + exercise.sets.filter((set) => set.completed).length,
        0,
      );
      const baseXp = calculateBaseXp(completedSets);
      const streakMultiplier = getStreakMultiplier(afterStreak.current);
      const earnedXp = calculateEarnedXp(baseXp, streakMultiplier, goalBonusXp);
      const session = await tx.workoutSession.create({
        data: {
          clientReference: workout.id,
          userId: currentUser.id,
          sourceProgramId: workout.sourceProgramId,
          sourceWorkoutDayId: workout.sourceWorkoutDayId,
          programName: workout.programName || "Quick workout",
          workoutDayName: assertText(workout.workoutDayName, "Workout name", 100),
          status: "COMPLETED",
          startedAt,
          completedAt,
          durationSeconds,
          baseXp,
          streakMultiplier,
          goalBonusXp,
          earnedXp,
          exercises: {
            create: workout.exercises.map((exercise, exercisePosition) => ({
              sourceDayExerciseId: exercise.sourceDayExerciseId,
              sourceExerciseId: exercise.exerciseId,
              exerciseName: assertText(exercise.name, "Exercise name", 100),
              targetSets: exercise.targetSets,
              targetRepMin: exercise.targetRepMin,
              targetRepMax: exercise.targetRepMax,
              note: assertOptionalText(exercise.note, "Exercise note", 1000),
              position: exercisePosition,
              sets: {
                create: exercise.sets.map((set, setPosition) => ({
                  position: setPosition,
                  weightKg: set.weightKg ?? null,
                  reps: set.reps ?? null,
                  isCompleted: set.completed,
                })),
              },
            })),
          },
        },
      });
      const eligibleExercises = await tx.exercise.findMany({
        where: {
          id: { in: workout.exercises.map((exercise) => exercise.exerciseId) },
          tracksPersonalRecords: true,
        },
        select: { id: true },
      });
      const eligibleIds = new Set(eligibleExercises.map((exercise) => exercise.id));
      for (const exercise of workout.exercises) {
        if (!eligibleIds.has(exercise.exerciseId)) continue;
        const highestWeight = Math.max(
          0,
          ...exercise.sets
            .filter((set) => set.completed && (set.weightKg ?? 0) > 0)
            .map((set) => set.weightKg ?? 0),
        );
        if (!highestWeight) continue;
        const record = await tx.personalRecord.findUnique({
          where: {
            userId_exerciseId: {
              userId: currentUser.id,
              exerciseId: exercise.exerciseId,
            },
          },
        });
        if (!record) {
          await tx.personalRecord.create({
            data: {
              userId: currentUser.id,
              exerciseId: exercise.exerciseId,
              currentWeight: highestWeight,
              workoutSessionId: session.id,
              achievedAt: completedAt,
            },
          });
        } else if (highestWeight > Number(record.currentWeight.toString())) {
          await tx.personalRecord.update({
            where: { id: record.id },
            data: {
              currentWeight: highestWeight,
              previousWeight: record.currentWeight,
              workoutSessionId: session.id,
              achievedAt: completedAt,
            },
          });
        }
      }
      const previousTotal = await tx.workoutSession.aggregate({
        where: { userId: currentUser.id, status: "COMPLETED" },
        _sum: { earnedXp: true },
      });
      const level = getLevelProgress(previousTotal._sum.earnedXp ?? 0);
      const trophies = getEligibleTrophies(level.current);
      await tx.userTrophy.createMany({
        data: trophies.map((trophy) => ({
          userId: currentUser.id,
          trophyKey: trophy.key,
        })),
        skipDuplicates: true,
      });
      return { session, goalBonusXp, streakMultiplier };
    });
    const summary = await getSavedWorkoutSummary(
      result.session.clientReference ?? workout.id,
    );
    if (!summary) throw new Error("Completed workout could not be loaded.");
    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/workout");
    revalidatePath(`/workout/history/${result.session.id}`);
    return summary;
  } catch (error) {
    const duplicate = await getSavedWorkoutSummary(workout.id);
    if (duplicate) return duplicate;
    throw error;
  }
}
