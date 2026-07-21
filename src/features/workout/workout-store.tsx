"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { WorkoutDay, WorkoutProgram } from "@/features/programs/types";
import { saveCompletedWorkoutAction } from "@/features/workout/actions";
import type {
  ActiveWorkout,
  ActiveWorkoutExercise,
  WorkoutHistoryEntry,
  WorkoutSetLog,
  WorkoutSummary,
} from "@/features/workout/types";

type WorkoutStoreValue = {
  activeWorkout: ActiveWorkout | null;
  addSet: (exerciseId: string) => void;
  cancelWorkout: () => void;
  finishWorkout: () => Promise<void>;
  history: WorkoutHistoryEntry[];
  saveError: string | null;
  isSaving: boolean;
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
    sourceDayExerciseId: exercise.id,
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

export function WorkoutStoreProvider({
  children,
  initialHistory,
}: {
  children: ReactNode;
  initialHistory: WorkoutHistoryEntry[];
}) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>(initialHistory);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isSubmitting = useRef(false);

  function startWorkout(program: WorkoutProgram, day: WorkoutDay) {
    setSaveError(null);
    setSummary(null);
    setActiveWorkout({
      id: createId("workout"),
      sourceProgramId: program.id,
      sourceWorkoutDayId: day.id,
      programName: program.name,
      workoutDayName: day.name,
      startedAt: Date.now(),
      exercises: day.exercises.map(makeActiveExercise),
    });
  }

  function startQuickWorkout() {
    setSaveError(null);
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

  async function finishWorkout() {
    if (!activeWorkout || isSubmitting.current) return;
    setSaveError(null);
    isSubmitting.current = true;
    setIsSaving(true);
    try {
      const savedSummary = await saveCompletedWorkoutAction(activeWorkout);
      setSummary(savedSummary);
      setActiveWorkout(null);
      const historyEntry: WorkoutHistoryEntry = {
        id: savedSummary.id,
        completedAt: savedSummary.completedAt,
        workoutDayName: savedSummary.workoutDayName,
        programName: savedSummary.programName,
        durationSeconds: savedSummary.durationSeconds,
        completedSets: savedSummary.completedSets,
        completedExercises: savedSummary.completedExercises,
        totalVolume: savedSummary.totalVolume,
      };
      setHistory((currentHistory) => [
        historyEntry,
        ...currentHistory.filter((entry) => entry.id !== historyEntry.id),
      ]);
    } catch {
      setSaveError(
        "Your workout could not be saved. Check your connection and try again.",
      );
    } finally {
      isSubmitting.current = false;
      setIsSaving(false);
    }
  }

  function cancelWorkout() {
    setSaveError(null);
    setActiveWorkout(null);
    setSummary(null);
  }

  function resetWorkout() {
    setSaveError(null);
    setActiveWorkout(null);
    setSummary(null);
  }

  return (
    <WorkoutStoreContext.Provider
      value={{
        activeWorkout,
        history,
        isSaving,
        saveError,
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
