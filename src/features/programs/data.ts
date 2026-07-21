import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  ProgramExercise,
  WorkoutDay,
  WorkoutProgram,
} from "@/features/programs/types";

export const PROGRAM_OWNER_ID = "gymflow-prototype-owner";

function toUpdatedLabel(updatedAt: Date) {
  const secondsSinceUpdate = Math.max(
    0,
    Math.floor((Date.now() - updatedAt.getTime()) / 1000),
  );
  if (secondsSinceUpdate < 60) return "Updated just now";
  if (secondsSinceUpdate < 3600)
    return `Updated ${Math.floor(secondsSinceUpdate / 60)}m ago`;
  if (secondsSinceUpdate < 86400)
    return `Updated ${Math.floor(secondsSinceUpdate / 3600)}h ago`;
  return `Updated ${updatedAt.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
}

function toProgramExercise(link: {
  id: string;
  targetRepMax: number | null;
  targetRepMin: number | null;
  targetSets: number;
  exercise: { id: string; muscleGroup: string | null; name: string };
}): ProgramExercise {
  return {
    id: link.id,
    exerciseId: link.exercise.id,
    name: link.exercise.name,
    muscleGroup: link.exercise.muscleGroup || "Custom",
    targetSets: link.targetSets,
    targetRepMin: link.targetRepMin ?? undefined,
    targetRepMax: link.targetRepMax ?? undefined,
  };
}

function toWorkoutDay(day: {
  id: string;
  name: string;
  exercises: Array<{
    id: string;
    targetRepMax: number | null;
    targetRepMin: number | null;
    targetSets: number;
    exercise: { id: string; muscleGroup: string | null; name: string };
  }>;
}): WorkoutDay {
  return {
    id: day.id,
    name: day.name,
    exercises: day.exercises.map(toProgramExercise),
  };
}

function toWorkoutProgram(program: {
  id: string;
  name: string;
  description: string | null;
  updatedAt: Date;
  days: Array<{
    id: string;
    name: string;
    exercises: Array<{
      id: string;
      targetRepMax: number | null;
      targetRepMin: number | null;
      targetSets: number;
      exercise: { id: string; muscleGroup: string | null; name: string };
    }>;
  }>;
}): WorkoutProgram {
  return {
    id: program.id,
    name: program.name,
    description: program.description ?? undefined,
    updatedAt: toUpdatedLabel(program.updatedAt),
    days: program.days.map(toWorkoutDay),
  };
}

export async function getProgramBootstrap() {
  const [programs, exercises] = await Promise.all([
    prisma.workoutProgram.findMany({
      where: { userId: PROGRAM_OWNER_ID },
      orderBy: { updatedAt: "desc" },
      include: {
        days: {
          orderBy: { position: "asc" },
          include: {
            exercises: {
              orderBy: { position: "asc" },
              include: { exercise: true },
            },
          },
        },
      },
    }),
    prisma.exercise.findMany({
      where: { userId: PROGRAM_OWNER_ID },
      orderBy: { name: "asc" },
      select: { id: true, name: true, muscleGroup: true },
    }),
  ]);

  return {
    programs: programs.map(toWorkoutProgram),
    exercises: exercises.map(({ id, name, muscleGroup }) => ({
      id,
      name,
      muscleGroup: muscleGroup || "Custom",
    })),
  };
}

export async function ensureProgramOwner() {
  await prisma.user.upsert({
    where: { id: PROGRAM_OWNER_ID },
    update: {},
    create: { id: PROGRAM_OWNER_ID },
  });
}

export async function getProgramById(programId: string) {
  const program = await prisma.workoutProgram.findFirst({
    where: { id: programId, userId: PROGRAM_OWNER_ID },
    include: {
      days: {
        orderBy: { position: "asc" },
        include: {
          exercises: {
            orderBy: { position: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });

  return program ? toWorkoutProgram(program) : undefined;
}
