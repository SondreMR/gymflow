"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

import type { WorkoutDay, WorkoutProgram } from "@/features/programs/types";
import type {
  ActiveWorkout,
  ActiveWorkoutExercise,
  WorkoutSetLog,
  WorkoutSummary,
} from "@/features/workout/types";

type WorkoutStoreValue = {
  activeWorkout: ActiveWorkout | null;
  addSet: (exerciseId: string) => void;
  cancelWorkout: () => void;
  finishWorkout: () => void;
  removeSet: (exerciseId: string, setId: string) => void;
  resetWorkout: () => void;
  startQuickWorkout: () => void;
  startWorkout: (program: WorkoutProgram, day: WorkoutDay) => void;
  summary: WorkoutSummary | null;
  updateExerciseNote: (exerciseId: string, note: string) => void;
  updateSet: (exerciseId: string, setId: string, patch: Partial<WorkoutSetLog>) => void;
};

const WorkoutStoreContext = createContext<WorkoutStoreValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function makeSet(): WorkoutSetLog {
  return { id: createId("set"), completed: false };
}

function makeActiveExercise(
  exercise: WorkoutDay["exercises"][number],
): ActiveWorkoutExercise {
  return {
    id: createId("active-exercise"),
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    targetSets: exercise.targetSets,
    targetRepMin: exercise.targetRepMin,
    targetRepMax: exercise.targetRepMax,
    note: "",
    sets: Array.from({ length: exercise.targetSets }, makeSet),
  };
}

function updateActiveExercise(
  workout: ActiveWorkout | null,
  exerciseId: string,
  updater: (exercise: ActiveWorkoutExercise) => ActiveWorkoutExercise,
) {
  if (!workout) return workout;
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) =>
      exercise.id === exerciseId ? updater(exercise) : exercise,
    ),
  };
}

export function WorkoutStoreProvider({ children }: { children: ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);

  function startWorkout(program: WorkoutProgram, day: WorkoutDay) {
    setSummary(null);
    setActiveWorkout({
      id: createId("workout"),
      programName: program.name,
      workoutDayName: day.name,
      startedAt: Date.now(),
      exercises: day.exercises.map(makeActiveExercise),
    });
  }

  function startQuickWorkout() {
    setSummary(null);
    setActiveWorkout({
      id: createId("workout"),
      workoutDayName: "Quick workout",
      startedAt: Date.now(),
      exercises: [],
    });
  }

  function updateSet(exerciseId: string, setId: string, patch: Partial<WorkoutSetLog>) {
    setActiveWorkout((workout) =>
      updateActiveExercise(workout, exerciseId, (exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) =>
          set.id === setId ? { ...set, ...patch } : set,
        ),
      })),
    );
  }

  function addSet(exerciseId: string) {
    setActiveWorkout((workout) =>
      updateActiveExercise(workout, exerciseId, (exercise) => ({
        ...exercise,
        sets: [...exercise.sets, makeSet()],
      })),
    );
  }

  function removeSet(exerciseId: string, setId: string) {
    setActiveWorkout((workout) =>
      updateActiveExercise(workout, exerciseId, (exercise) => ({
        ...exercise,
        sets: exercise.sets.filter((set) => set.id !== setId || set.completed),
      })),
    );
  }

  function updateExerciseNote(exerciseId: string, note: string) {
    setActiveWorkout((workout) =>
      updateActiveExercise(workout, exerciseId, (exercise) => ({ ...exercise, note })),
    );
  }

  function finishWorkout() {
    if (!activeWorkout) return;
    const allSets = activeWorkout.exercises.flatMap((exercise) => exercise.sets);
    const completedSets = allSets.filter((set) => set.completed);
    const completedExercises = activeWorkout.exercises.filter((exercise) =>
      exercise.sets.some((set) => set.completed),
    ).length;
    const totalVolume = completedSets.reduce(
      (volume, set) => volume + (set.weightKg ?? 0) * (set.reps ?? 0),
      0,
    );
    const durationSeconds = Math.max(
      1,
      Math.floor((Date.now() - activeWorkout.startedAt) / 1000),
    );

    setSummary({
      workoutDayName: activeWorkout.workoutDayName,
      durationSeconds,
      completedSets: completedSets.length,
      completedExercises,
      totalVolume,
      xpEarned: 100 + completedSets.length * 15,
    });
    setActiveWorkout(null);
  }

  function cancelWorkout() {
    setActiveWorkout(null);
    setSummary(null);
  }

  function resetWorkout() {
    setActiveWorkout(null);
    setSummary(null);
  }

  return (
    <WorkoutStoreContext.Provider
      value={{
        activeWorkout,
        summary,
        startWorkout,
        startQuickWorkout,
        updateSet,
        addSet,
        removeSet,
        updateExerciseNote,
        finishWorkout,
        cancelWorkout,
        resetWorkout,
      }}
    >
      {children}
    </WorkoutStoreContext.Provider>
  );
}

export function useWorkoutStore() {
  const context = useContext(WorkoutStoreContext);
  if (!context)
    throw new Error("useWorkoutStore must be used within WorkoutStoreProvider.");
  return context;
}
