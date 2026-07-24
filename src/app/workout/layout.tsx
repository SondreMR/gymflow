import type { ReactNode } from "react";

import { getActiveQuickWorkout, getWorkoutHistory } from "@/features/workout/data";
import { WorkoutStoreProvider } from "@/features/workout/workout-store";

export default async function WorkoutLayout({ children }: { children: ReactNode }) {
  const [history, activeWorkout] = await Promise.all([
    getWorkoutHistory(),
    getActiveQuickWorkout(),
  ]);

  return (
    <WorkoutStoreProvider initialActiveWorkout={activeWorkout} initialHistory={history}>
      {children}
    </WorkoutStoreProvider>
  );
}
