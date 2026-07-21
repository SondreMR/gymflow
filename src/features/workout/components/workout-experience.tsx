"use client";

import { ActiveWorkout } from "@/features/workout/components/active-workout";
import { WorkoutLanding } from "@/features/workout/components/workout-landing";
import { WorkoutSummary } from "@/features/workout/components/workout-summary";
import { useWorkoutStore } from "@/features/workout/workout-store";

export function WorkoutExperience() {
  const { activeWorkout, summary } = useWorkoutStore();
  if (summary) return <WorkoutSummary />;
  if (activeWorkout) return <ActiveWorkout />;
  return <WorkoutLanding />;
}
