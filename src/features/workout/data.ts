import "server-only";

import { PROGRAM_OWNER_ID } from "@/features/programs/data";
import { prisma } from "@/lib/prisma";
import type {
  WorkoutHistoryDetail,
  WorkoutHistoryEntry,
  WorkoutSetLog,
  SavedWorkoutSummary,
} from "@/features/workout/types";

type SessionWithExercises = {
  id: string;
  programName: string;
  workoutDayName: string;
  completedAt: Date | null;
  startedAt: Date;
  durationSeconds: number;
  exercises: Array<{
    id: string;
    exerciseName: string;
    note: string | null;
    position: number;
    targetRepMax: number | null;
    targetRepMin: number | null;
    targetSets: number | null;
    sourceExercise: { muscleGroup: string | null } | null;
    sets: Array<{
      id: string;
      isCompleted: boolean;
      position: number;
      reps: number | null;
      weightKg: { toString: () => string } | null;
    }>;
  }>;
};

function completedSets(session: SessionWithExercises) {
  return session.exercises
    .flatMap((exercise) => exercise.sets)
    .filter((set) => set.isCompleted);
}

function getVolume(session: SessionWithExercises) {
  return completedSets(session).reduce(
    (total, set) => total + Number(set.weightKg?.toString() ?? 0) * (set.reps ?? 0),
    0,
  );
}

function toSummary(session: SessionWithExercises): SavedWorkoutSummary {
  const sets = completedSets(session);
  return {
    id: session.id,
    completedAt: (session.completedAt ?? session.startedAt).toISOString(),
    workoutDayName: session.workoutDayName,
    programName: session.programName || undefined,
    durationSeconds: session.durationSeconds,
    completedSets: sets.length,
    completedExercises: session.exercises.filter((exercise) =>
      exercise.sets.some((set) => set.isCompleted),
    ).length,
    totalVolume: getVolume(session),
    xpEarned: 100 + sets.length * 15,
  };
}

function toHistoryEntry(session: SessionWithExercises): WorkoutHistoryEntry {
  const summary = toSummary(session);
  return {
    id: summary.id,
    completedAt: summary.completedAt,
    workoutDayName: summary.workoutDayName,
    programName: summary.programName,
    durationSeconds: summary.durationSeconds,
    completedSets: summary.completedSets,
    completedExercises: summary.completedExercises,
    totalVolume: summary.totalVolume,
  };
}

const sessionInclude = {
  exercises: {
    orderBy: { position: "asc" },
    include: {
      sourceExercise: { select: { muscleGroup: true } },
      sets: { orderBy: { position: "asc" } },
    },
  },
} as const;

export async function getWorkoutHistory() {
  const sessions = await prisma.workoutSession.findMany({
    where: { userId: PROGRAM_OWNER_ID, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 8,
    include: sessionInclude,
  });
  return sessions.map(toHistoryEntry);
}

export async function getWorkoutHistoryDetail(
  sessionId: string,
): Promise<WorkoutHistoryDetail | undefined> {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: PROGRAM_OWNER_ID, status: "COMPLETED" },
    include: sessionInclude,
  });
  if (!session) return undefined;

  return {
    ...toHistoryEntry(session),
    exercises: session.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.exerciseName,
      muscleGroup: exercise.sourceExercise?.muscleGroup || "Custom",
      note: exercise.note || undefined,
      targetSets: exercise.targetSets ?? undefined,
      targetRepMin: exercise.targetRepMin ?? undefined,
      targetRepMax: exercise.targetRepMax ?? undefined,
      sets: exercise.sets.map(
        (set): WorkoutSetLog => ({
          id: set.id,
          completed: set.isCompleted,
          weightKg: set.weightKg ? Number(set.weightKg.toString()) : undefined,
          reps: set.reps ?? undefined,
        }),
      ),
    })),
  };
}

export async function getSavedWorkoutSummary(clientReference: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { clientReference, userId: PROGRAM_OWNER_ID, status: "COMPLETED" },
    include: sessionInclude,
  });
  return session ? toSummary(session) : undefined;
}
