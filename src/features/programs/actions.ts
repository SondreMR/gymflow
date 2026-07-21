"use server";

import { revalidatePath } from "next/cache";

import { getProgramById } from "@/features/programs/data";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  ExerciseDefinition,
  ProgramExercise,
  WorkoutProgram,
} from "@/features/programs/types";

type ProgramDraft = Pick<WorkoutProgram, "description" | "name">;
type ProgramExercisePatch = Partial<
  Pick<ProgramExercise, "targetRepMax" | "targetRepMin" | "targetSets">
>;

function normalizeName(value: string, field: string) {
  const name = value.trim();
  if (!name) throw new Error(`${field} is required.`);
  if (name.length > 100) throw new Error(`${field} must be 100 characters or fewer.`);
  return name;
}

function normalizeDescription(value?: string) {
  const description = value?.trim();
  if (description && description.length > 1000) {
    throw new Error("Description must be 1,000 characters or fewer.");
  }
  return description || null;
}

function revalidatePrograms(programId?: string) {
  revalidatePath("/");
  revalidatePath("/programs");
  if (programId) revalidatePath(`/programs/${programId}`);
}

async function requireProgram(programId: string) {
  const user = await getCurrentUser();
  const program = await prisma.workoutProgram.findFirst({
    where: { id: programId, userId: user.id },
    select: { id: true },
  });
  if (!program) throw new Error("Program not found.");
}

async function requireWorkoutDay(programId: string, dayId: string) {
  const user = await getCurrentUser();
  const day = await prisma.workoutDay.findFirst({
    where: { id: dayId, programId, program: { userId: user.id } },
    select: { id: true },
  });
  if (!day) throw new Error("Workout day not found.");
}

async function requireAvailableExercise(exerciseId: string) {
  const user = await getCurrentUser();
  const exercise = await prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      OR: [
        { isSystem: true, userId: null },
        { isSystem: false, userId: user.id },
      ],
    },
    select: { id: true },
  });
  if (!exercise) throw new Error("Exercise not found.");
}

export async function createProgramAction(draft: ProgramDraft) {
  const user = await getCurrentUser();
  const program = await prisma.workoutProgram.create({
    data: {
      userId: user.id,
      name: normalizeName(draft.name, "Program name"),
      description: normalizeDescription(draft.description),
    },
  });
  revalidatePrograms(program.id);
  return getProgramById(program.id);
}

export async function updateProgramAction(programId: string, draft: ProgramDraft) {
  await requireProgram(programId);
  await prisma.workoutProgram.update({
    where: { id: programId },
    data: {
      name: normalizeName(draft.name, "Program name"),
      description: normalizeDescription(draft.description),
    },
  });
  revalidatePrograms(programId);
  return getProgramById(programId);
}

export async function deleteProgramAction(programId: string) {
  const user = await getCurrentUser();
  await prisma.workoutProgram.deleteMany({
    where: { id: programId, userId: user.id },
  });
  revalidatePrograms(programId);
}

export async function duplicateProgramAction(programId: string) {
  const user = await getCurrentUser();
  await requireProgram(programId);
  const source = await prisma.workoutProgram.findUniqueOrThrow({
    where: { id: programId },
    include: {
      days: {
        orderBy: { position: "asc" },
        include: { exercises: { orderBy: { position: "asc" } } },
      },
    },
  });
  const duplicate = await prisma.workoutProgram.create({
    data: {
      userId: user.id,
      name: `${source.name} copy`,
      description: source.description,
      days: {
        create: source.days.map((day) => ({
          name: day.name,
          position: day.position,
          exercises: {
            create: day.exercises.map((exercise) => ({
              exerciseId: exercise.exerciseId,
              position: exercise.position,
              targetSets: exercise.targetSets,
              targetRepMin: exercise.targetRepMin,
              targetRepMax: exercise.targetRepMax,
            })),
          },
        })),
      },
    },
  });
  revalidatePrograms(duplicate.id);
  return getProgramById(duplicate.id);
}

export async function addWorkoutDayAction(programId: string, name: string) {
  await requireProgram(programId);
  const position = await prisma.workoutDay.count({ where: { programId } });
  await prisma.workoutDay.create({
    data: { programId, name: normalizeName(name, "Workout day name"), position },
  });
  revalidatePrograms(programId);
  return getProgramById(programId);
}

export async function renameWorkoutDayAction(
  programId: string,
  dayId: string,
  name: string,
) {
  await requireWorkoutDay(programId, dayId);
  await prisma.workoutDay.update({
    where: { id: dayId },
    data: { name: normalizeName(name, "Workout day name") },
  });
  revalidatePrograms(programId);
  return getProgramById(programId);
}

export async function deleteWorkoutDayAction(programId: string, dayId: string) {
  await requireWorkoutDay(programId, dayId);
  await prisma.$transaction(async (tx) => {
    await tx.workoutDay.delete({ where: { id: dayId } });
    const remainingDays = await tx.workoutDay.findMany({
      where: { programId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    await Promise.all(
      remainingDays.map((day, position) =>
        tx.workoutDay.update({ where: { id: day.id }, data: { position } }),
      ),
    );
  });
  revalidatePrograms(programId);
  return getProgramById(programId);
}

export async function createExerciseAction(
  name: string,
  muscleGroup: string,
): Promise<ExerciseDefinition> {
  const user = await getCurrentUser();
  const normalizedName = normalizeName(name, "Exercise name");
  const normalizedMuscleGroup = normalizeName(muscleGroup, "Muscle group");
  const exercise = await prisma.exercise.upsert({
    where: { userId_name: { userId: user.id, name: normalizedName } },
    update: { muscleGroup: normalizeName(muscleGroup, "Muscle group") },
    create: {
      userId: user.id,
      name: normalizedName,
      muscleGroup: normalizedMuscleGroup,
      isSystem: false,
    },
  });
  revalidatePrograms();
  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup || "Custom",
    equipment: exercise.equipment || undefined,
    isSystem: exercise.isSystem,
  };
}

export async function addExerciseToDayAction(
  programId: string,
  dayId: string,
  exerciseId: string,
) {
  await requireWorkoutDay(programId, dayId);
  await requireAvailableExercise(exerciseId);
  const position = await prisma.workoutDayExercise.count({
    where: { workoutDayId: dayId },
  });
  await prisma.workoutDayExercise.create({
    data: { workoutDayId: dayId, exerciseId, position, targetSets: 3 },
  });
  revalidatePrograms(programId);
  return getProgramById(programId);
}

export async function removeExerciseFromDayAction(
  programId: string,
  dayId: string,
  programExerciseId: string,
) {
  await requireWorkoutDay(programId, dayId);
  await prisma.workoutDayExercise.deleteMany({
    where: { id: programExerciseId, workoutDayId: dayId },
  });
  revalidatePrograms(programId);
  return getProgramById(programId);
}

export async function updateDayExerciseAction(
  programId: string,
  dayId: string,
  programExerciseId: string,
  patch: ProgramExercisePatch,
) {
  await requireWorkoutDay(programId, dayId);
  const current = await prisma.workoutDayExercise.findFirst({
    where: { id: programExerciseId, workoutDayId: dayId },
  });
  if (!current) throw new Error("Exercise placement not found.");
  const targetSets = patch.targetSets ?? current.targetSets;
  const targetRepMin = Object.hasOwn(patch, "targetRepMin")
    ? (patch.targetRepMin ?? null)
    : current.targetRepMin;
  const targetRepMax = Object.hasOwn(patch, "targetRepMax")
    ? (patch.targetRepMax ?? null)
    : current.targetRepMax;
  if (!Number.isInteger(targetSets) || targetSets < 1 || targetSets > 20)
    throw new Error("Target sets must be between 1 and 20.");
  if ((targetRepMin === null) !== (targetRepMax === null))
    throw new Error("Set both rep range values or leave both empty.");
  if (
    targetRepMin !== null &&
    targetRepMax !== null &&
    (!Number.isInteger(targetRepMin) ||
      !Number.isInteger(targetRepMax) ||
      targetRepMin < 1 ||
      targetRepMax < targetRepMin)
  ) {
    throw new Error("Rep range is invalid.");
  }
  await prisma.workoutDayExercise.update({
    where: { id: programExerciseId },
    data: { targetSets, targetRepMin, targetRepMax },
  });
  revalidatePrograms(programId);
  return getProgramById(programId);
}
