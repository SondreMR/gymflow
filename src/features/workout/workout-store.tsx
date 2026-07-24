"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { WorkoutDay, WorkoutProgram } from "@/features/programs/types";
import {
  addQuickWorkoutExerciseAction,
  createQuickWorkoutAction,
  discardQuickWorkoutAction,
  removeQuickWorkoutExerciseAction,
  saveCompletedWorkoutAction,
} from "@/features/workout/actions";
import type { ExerciseDefinition } from "@/features/programs/types";
import type {
  ActiveWorkout,
  ActiveWorkoutExercise,
  WorkoutHistoryEntry,
  WorkoutSetLog,
  WorkoutSummary,
} from "@/features/workout/types";

type WorkoutStoreValue = {
  activeWorkout: ActiveWorkout | null;
  addExercise: (exercise: ExerciseDefinition) => Promise<void>;
  addSet: (exerciseId: string) => void;
  cancelWorkout: () => Promise<void>;
  finishWorkout: () => Promise<void>;
  history: WorkoutHistoryEntry[];
  saveError: string | null;
  isSaving: boolean;
  isStarting: boolean;
  removeExercise: (exerciseId: string) => Promise<void>;
  removeSet: (exerciseId: string, setId: string) => void;
  resetWorkout: () => void;
  startQuickWorkout: () => Promise<void>;
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

function makeQuickActiveExercise(exercise: ExerciseDefinition): ActiveWorkoutExercise {
  return {
    id: createId("active-exercise"),
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    targetSets: 1,
    note: "",
    sets: [makeSet()],
  };
}

const QUICK_WORKOUT_STORAGE_KEY = "gymflow-active-quick-workout";

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
  initialActiveWorkout,
  initialHistory,
}: {
  children: ReactNode;
  initialActiveWorkout: ActiveWorkout | null;
  initialHistory: WorkoutHistoryEntry[];
}) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(
    initialActiveWorkout,
  );
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>(initialHistory);
  const [isSaving, setIsSaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isSubmitting = useRef(false);
  const hasHydratedDraft = useRef(false);

  useEffect(() => {
    if (!activeWorkout?.sessionId) {
      if (!activeWorkout) localStorage.removeItem(QUICK_WORKOUT_STORAGE_KEY);
      return;
    }
    localStorage.setItem(QUICK_WORKOUT_STORAGE_KEY, JSON.stringify(activeWorkout));
  }, [activeWorkout]);

  useEffect(() => {
    if (hasHydratedDraft.current) return;
    hasHydratedDraft.current = true;
    const saved = localStorage.getItem(QUICK_WORKOUT_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as ActiveWorkout;
      if (parsed.sessionId && parsed.sessionId === initialActiveWorkout?.sessionId) {
        setActiveWorkout(parsed);
      }
    } catch {
      localStorage.removeItem(QUICK_WORKOUT_STORAGE_KEY);
    }
  }, [initialActiveWorkout?.sessionId]);

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

  async function startQuickWorkout() {
    setSaveError(null);
    setSummary(null);
    setIsStarting(true);
    try {
      const startedAt = Date.now();
      const sessionId = await createQuickWorkoutAction(startedAt);
      setActiveWorkout({
        id: createId("workout"),
        sessionId,
        workoutDayName: "Quick workout",
        startedAt,
        exercises: [],
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to start workout.");
    } finally {
      setIsStarting(false);
    }
  }

  async function addExercise(exercise: ExerciseDefinition) {
    const sessionId = activeWorkout?.sessionId;
    if (!activeWorkout || !sessionId) throw new Error("Start a quick workout first.");
    if (activeWorkout.exercises.some((current) => current.exerciseId === exercise.id)) {
      throw new Error("This exercise is already in the workout.");
    }
    await addQuickWorkoutExerciseAction(sessionId, exercise.id);
    setActiveWorkout((workout) =>
      workout
        ? {
            ...workout,
            exercises: [...workout.exercises, makeQuickActiveExercise(exercise)],
          }
        : workout,
    );
  }

  async function removeExercise(exerciseId: string) {
    const sessionId = activeWorkout?.sessionId;
    if (!activeWorkout || !sessionId) return;
    await removeQuickWorkoutExerciseAction(sessionId, exerciseId);
    setActiveWorkout((workout) =>
      workout
        ? {
            ...workout,
            exercises: workout.exercises.filter(
              (exercise) => exercise.exerciseId !== exerciseId,
            ),
          }
        : workout,
    );
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
    if (!activeWorkout.exercises.length) {
      setSaveError("Add at least one exercise before finishing this workout.");
      return;
    }
    setSaveError(null);
    isSubmitting.current = true;
    setIsSaving(true);
    try {
      const savedSummary = await saveCompletedWorkoutAction(activeWorkout);
      if (activeWorkout.sessionId)
        await discardQuickWorkoutAction(activeWorkout.sessionId);
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

  async function cancelWorkout() {
    setSaveError(null);
    if (activeWorkout?.sessionId)
      await discardQuickWorkoutAction(activeWorkout.sessionId);
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
        addExercise,
        history,
        isSaving,
        isStarting,
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
        removeExercise,
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
