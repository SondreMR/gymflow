import type { ReactNode } from "react";

import { getWorkoutHistory } from "@/features/workout/data";
import { WorkoutStoreProvider } from "@/features/workout/workout-store";

export default async function WorkoutLayout({ children }: { children: ReactNode }) {
  const history = await getWorkoutHistory();

  return (
    <WorkoutStoreProvider initialHistory={history}>{children}</WorkoutStoreProvider>
  );
}
