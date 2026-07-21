"use server";

import { revalidatePath } from "next/cache";

import { ensureProgramOwner, PROGRAM_OWNER_ID } from "@/features/programs/data";
import { getSavedWorkoutSummary } from "@/features/workout/data";
import { prisma } from "@/lib/prisma";
import type { ActiveWorkout, SavedWorkoutSummary } from "@/features/workout/types";

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

async function validateSources(workout: ActiveWorkout) {
  if (workout.sourceProgramId) {
    const program = await prisma.workoutProgram.findFirst({
      where: { id: workout.sourceProgramId, userId: PROGRAM_OWNER_ID },
      select: { id: true },
    });
    if (!program) throw new Error("Workout program is no longer available.");
  }
  if (workout.sourceWorkoutDayId) {
    const day = await prisma.workoutDay.findFirst({
      where: {
        id: workout.sourceWorkoutDayId,
        program: { id: workout.sourceProgramId, userId: PROGRAM_OWNER_ID },
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
          { userId: PROGRAM_OWNER_ID, isSystem: false },
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
  const existing = await getSavedWorkoutSummary(workout.id);
  if (existing) return existing;

  await ensureProgramOwner();
  await validateSources(workout);
  const completedAt = new Date();
  const startedAt = new Date(workout.startedAt);
  const durationSeconds = Math.max(
    1,
    Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000),
  );

  try {
    const session = await prisma.$transaction((tx) =>
      tx.workoutSession.create({
        data: {
          clientReference: workout.id,
          userId: PROGRAM_OWNER_ID,
          sourceProgramId: workout.sourceProgramId,
          sourceWorkoutDayId: workout.sourceWorkoutDayId,
          programName: workout.programName || "Quick workout",
          workoutDayName: assertText(workout.workoutDayName, "Workout name", 100),
          status: "COMPLETED",
          startedAt,
          completedAt,
          durationSeconds,
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
      }),
    );
    const summary = await getSavedWorkoutSummary(session.clientReference ?? workout.id);
    if (!summary) throw new Error("Completed workout could not be loaded.");
    revalidatePath("/workout");
    revalidatePath(`/workout/history/${session.id}`);
    return summary;
  } catch (error) {
    const duplicate = await getSavedWorkoutSummary(workout.id);
    if (duplicate) return duplicate;
    throw error;
  }
}
