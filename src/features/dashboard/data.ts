import "server-only";

import {
  getWeeklyActivity,
  getWeeklyGoalStreaks,
  getWorkoutVolume,
} from "@/features/dashboard/dashboard-utils";
import {
  getActiveTrophy,
  getLevelProgress,
  getNextTrophy,
  getStreakMultiplier,
} from "@/features/progression/progression";
import type {
  DashboardData,
  DashboardRecentWorkout,
  DashboardWorkoutRecord,
} from "@/features/dashboard/types";
import { ensureProgramOwner, PROGRAM_OWNER_ID } from "@/features/programs/data";
import { prisma } from "@/lib/prisma";

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  weekday: "long",
});

function toDashboardWorkoutRecord(session: {
  completedAt: Date | null;
  durationSeconds: number;
  earnedXp: number;
  id: string;
  programName: string;
  startedAt: Date;
  workoutDayName: string;
  exercises: Array<{
    sets: Array<{
      isCompleted: boolean;
      reps: number | null;
      weightKg: { toString: () => string } | null;
    }>;
  }>;
}): DashboardWorkoutRecord {
  return {
    completedAt: session.completedAt ?? session.startedAt,
    durationSeconds: session.durationSeconds,
    earnedXp: session.earnedXp,
    id: session.id,
    programName: session.programName,
    workoutDayName: session.workoutDayName,
    sets: session.exercises.flatMap((exercise) =>
      exercise.sets.map((set) => ({
        isCompleted: set.isCompleted,
        reps: set.reps,
        weightKg: set.weightKg ? Number(set.weightKg.toString()) : null,
      })),
    ),
  };
}

function toRecentWorkout(workout: DashboardWorkoutRecord): DashboardRecentWorkout {
  const completedSets = workout.sets.filter((set) => set.isCompleted).length;
  return {
    completedAt: workout.completedAt.toISOString(),
    completedSets,
    durationSeconds: workout.durationSeconds,
    id: workout.id,
    programName: workout.programName || undefined,
    totalVolume: getWorkoutVolume(workout.sets),
    workoutDayName: workout.workoutDayName,
  };
}

export async function getDashboardData(now = new Date()): Promise<DashboardData> {
  await ensureProgramOwner();
  const [sessions, user] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { status: "COMPLETED", userId: PROGRAM_OWNER_ID },
      orderBy: { completedAt: "desc" },
      select: {
        completedAt: true,
        durationSeconds: true,
        earnedXp: true,
        exercises: {
          select: {
            sets: {
              select: { isCompleted: true, reps: true, weightKg: true },
            },
          },
        },
        id: true,
        programName: true,
        startedAt: true,
        workoutDayName: true,
      },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: PROGRAM_OWNER_ID },
      select: {
        displayName: true,
        weeklyWorkoutGoal: true,
      },
    }),
  ]);
  const workouts = sessions.map(toDashboardWorkoutRecord);
  const weeklyActivity = getWeeklyActivity(workouts, now);
  const { current } = getWeeklyGoalStreaks(workouts, user.weeklyWorkoutGoal, now);
  const level = getLevelProgress(
    workouts.reduce((total, workout) => total + workout.earnedXp, 0),
  );

  return {
    currentStreak: current,
    streakMultiplier: getStreakMultiplier(current),
    currentWeekWorkouts: weeklyActivity.reduce(
      (total, day) => total + day.completedWorkouts,
      0,
    ),
    level,
    activeTrophy: getActiveTrophy(level.current),
    nextTrophy: getNextTrophy(level.current),
    profile: {
      displayName: user.displayName,
    },
    recentWorkouts: workouts.slice(0, 5).map(toRecentWorkout),
    todayLabel: dateFormatter.format(now),
    weeklyActivity,
    weeklyTarget: user.weeklyWorkoutGoal,
    weeklyVolume:
      Math.round(
        weeklyActivity.reduce((total, day) => total + day.totalVolume, 0) * 100,
      ) / 100,
  };
}
