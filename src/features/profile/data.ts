import "server-only";

import {
  getWeeklyActivity,
  getWeeklyGoalStreaks,
  getWorkoutVolume,
} from "@/features/dashboard/dashboard-utils";
import {
  getEligibleTrophies,
  getActiveTrophy,
  getLevelProgress,
  getNextTrophy,
  getStreakMultiplier,
} from "@/features/progression/progression";
import type { DashboardWorkoutRecord } from "@/features/dashboard/types";
import { getCurrentUser } from "@/lib/auth";
import type { ProfileData, SidebarProfile } from "@/features/profile/types";
import { prisma } from "@/lib/prisma";

function toWorkoutRecord(session: {
  completedAt: Date | null;
  durationSeconds: number;
  earnedXp: number;
  exercises: Array<{
    sets: Array<{
      isCompleted: boolean;
      reps: number | null;
      weightKg: { toString: () => string } | null;
    }>;
  }>;
  id: string;
  programName: string;
  startedAt: Date;
  workoutDayName: string;
}): DashboardWorkoutRecord {
  return {
    completedAt: session.completedAt ?? session.startedAt,
    durationSeconds: session.durationSeconds,
    earnedXp: session.earnedXp,
    id: session.id,
    programName: session.programName,
    sets: session.exercises.flatMap((exercise) =>
      exercise.sets.map((set) => ({
        isCompleted: set.isCompleted,
        reps: set.reps,
        weightKg: set.weightKg ? Number(set.weightKg.toString()) : null,
      })),
    ),
    workoutDayName: session.workoutDayName,
  };
}

export async function getProfileData(now = new Date()): Promise<ProfileData> {
  const currentUser = await getCurrentUser();
  const [user, sessions] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: currentUser.id },
      select: {
        displayName: true,
        preferredWeightUnit: true,
        weeklyWorkoutGoal: true,
      },
    }),
    prisma.workoutSession.findMany({
      where: { status: "COMPLETED", userId: currentUser.id },
      select: {
        completedAt: true,
        durationSeconds: true,
        earnedXp: true,
        exercises: {
          select: {
            sets: { select: { isCompleted: true, reps: true, weightKg: true } },
          },
        },
        id: true,
        programName: true,
        startedAt: true,
        workoutDayName: true,
      },
    }),
  ]);
  const workouts = sessions.map(toWorkoutRecord);
  const weeklyActivity = getWeeklyActivity(workouts, now);
  const { current } = getWeeklyGoalStreaks(workouts, user.weeklyWorkoutGoal, now);
  const level = getLevelProgress(
    workouts.reduce((total, workout) => total + workout.earnedXp, 0),
  );
  await prisma.userTrophy.createMany({
    data: getEligibleTrophies(level.current).map((trophy) => ({
      userId: currentUser.id,
      trophyKey: trophy.key,
    })),
    skipDuplicates: true,
  });

  return {
    currentStreak: current,
    streakMultiplier: getStreakMultiplier(current),
    currentWeekWorkouts: weeklyActivity.reduce(
      (total, day) => total + day.completedWorkouts,
      0,
    ),
    displayName: user.displayName,
    level,
    activeTrophy: getActiveTrophy(level.current),
    nextTrophy: getNextTrophy(level.current),
    preferredWeightUnit: user.preferredWeightUnit,
    totalCompletedSetVolume:
      Math.round(
        workouts.reduce((total, workout) => total + getWorkoutVolume(workout.sets), 0) *
          100,
      ) / 100,
    totalPersonalRecords: 0,
    totalWorkouts: workouts.length,
    weeklyWorkoutGoal: user.weeklyWorkoutGoal,
  };
}

export async function getSidebarProfile(): Promise<SidebarProfile> {
  const profile = await getProfileData();
  return {
    displayName: profile.displayName,
    level: profile.level.current,
  };
}
