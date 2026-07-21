"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

import {
  addExerciseToDayAction,
  addWorkoutDayAction,
  createExerciseAction,
  createProgramAction,
  deleteProgramAction,
  deleteWorkoutDayAction,
  duplicateProgramAction,
  removeExerciseFromDayAction,
  renameWorkoutDayAction,
  updateDayExerciseAction,
  updateProgramAction,
} from "@/features/programs/actions";
import type {
  ExerciseDefinition,
  ProgramExercise,
  WorkoutProgram,
} from "@/features/programs/types";

type ProgramDraft = Pick<WorkoutProgram, "description" | "name">;
type ProgramExercisePatch = Partial<
  Pick<ProgramExercise, "targetRepMax" | "targetRepMin" | "targetSets">
>;

type ProgramStoreValue = {
  addDay: (programId: string, name: string) => Promise<void>;
  addExercise: (
    programId: string,
    dayId: string,
    exercise: ExerciseDefinition,
  ) => Promise<void>;
  createCustomExercise: (
    name: string,
    muscleGroup: string,
  ) => Promise<ExerciseDefinition>;
  createProgram: (draft: ProgramDraft) => Promise<void>;
  customExercises: ExerciseDefinition[];
  deleteDay: (programId: string, dayId: string) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;
  duplicateProgram: (programId: string) => Promise<void>;
  getProgram: (programId: string) => WorkoutProgram | undefined;
  programs: WorkoutProgram[];
  removeExercise: (
    programId: string,
    dayId: string,
    programExerciseId: string,
  ) => Promise<void>;
  renameDay: (programId: string, dayId: string, name: string) => Promise<void>;
  updateExercise: (
    programId: string,
    dayId: string,
    programExerciseId: string,
    patch: ProgramExercisePatch,
  ) => Promise<void>;
  updateProgram: (programId: string, draft: ProgramDraft) => Promise<void>;
};

type ProgramStoreProviderProps = {
  children: ReactNode;
  initialExercises: ExerciseDefinition[];
  initialPrograms: WorkoutProgram[];
};

const ProgramStoreContext = createContext<ProgramStoreValue | null>(null);

function replaceProgram(
  programs: WorkoutProgram[],
  nextProgram: WorkoutProgram | undefined,
) {
  if (!nextProgram) return programs;
  const currentIndex = programs.findIndex((program) => program.id === nextProgram.id);
  if (currentIndex === -1) return [nextProgram, ...programs];
  return programs.map((program) =>
    program.id === nextProgram.id ? nextProgram : program,
  );
}

export function ProgramStoreProvider({
  children,
  initialExercises,
  initialPrograms,
}: ProgramStoreProviderProps) {
  const [programs, setPrograms] = useState<WorkoutProgram[]>(initialPrograms);
  const [customExercises, setCustomExercises] =
    useState<ExerciseDefinition[]>(initialExercises);

  async function createProgram(draft: ProgramDraft) {
    const program = await createProgramAction(draft);
    setPrograms((currentPrograms) => replaceProgram(currentPrograms, program));
  }

  async function updateProgram(programId: string, draft: ProgramDraft) {
    const program = await updateProgramAction(programId, draft);
    setPrograms((currentPrograms) => replaceProgram(currentPrograms, program));
  }

  async function deleteProgram(programId: string) {
    await deleteProgramAction(programId);
    setPrograms((currentPrograms) =>
      currentPrograms.filter((program) => program.id !== programId),
    );
  }

  async function duplicateProgram(programId: string) {
    const program = await duplicateProgramAction(programId);
    setPrograms((currentPrograms) => replaceProgram(currentPrograms, program));
  }

  async function addDay(programId: string, name: string) {
    const program = await addWorkoutDayAction(programId, name);
    setPrograms((currentPrograms) => replaceProgram(currentPrograms, program));
  }

  async function renameDay(programId: string, dayId: string, name: string) {
    const program = await renameWorkoutDayAction(programId, dayId, name);
    setPrograms((currentPrograms) => replaceProgram(currentPrograms, program));
  }

  async function deleteDay(programId: string, dayId: string) {
    const program = await deleteWorkoutDayAction(programId, dayId);
    setPrograms((currentPrograms) => replaceProgram(currentPrograms, program));
  }

  async function addExercise(
    programId: string,
    dayId: string,
    exercise: ExerciseDefinition,
  ) {
    const program = await addExerciseToDayAction(programId, dayId, exercise.id);
    setPrograms((currentPrograms) => replaceProgram(currentPrograms, program));
  }

  async function removeExercise(
    programId: string,
    dayId: string,
    programExerciseId: string,
  ) {
    const program = await removeExerciseFromDayAction(
      programId,
      dayId,
      programExerciseId,
    );
    setPrograms((currentPrograms) => replaceProgram(currentPrograms, program));
  }

  async function updateExercise(
    programId: string,
    dayId: string,
    programExerciseId: string,
    patch: ProgramExercisePatch,
  ) {
    const program = await updateDayExerciseAction(
      programId,
      dayId,
      programExerciseId,
      patch,
    );
    setPrograms((currentPrograms) => replaceProgram(currentPrograms, program));
  }

  async function createCustomExercise(name: string, muscleGroup: string) {
    const exercise = await createExerciseAction(name, muscleGroup);
    setCustomExercises((currentExercises) => {
      const index = currentExercises.findIndex((current) => current.id === exercise.id);
      return index === -1
        ? [...currentExercises, exercise].sort((first, second) =>
            first.name.localeCompare(second.name),
          )
        : currentExercises.map((current) =>
            current.id === exercise.id ? exercise : current,
          );
    });
    return exercise;
  }

  return (
    <ProgramStoreContext.Provider
      value={{
        programs,
        customExercises,
        createProgram,
        updateProgram,
        deleteProgram,
        duplicateProgram,
        addDay,
        renameDay,
        deleteDay,
        addExercise,
        removeExercise,
        updateExercise,
        createCustomExercise,
        getProgram: (programId) => programs.find((program) => program.id === programId),
      }}
    >
      {children}
    </ProgramStoreContext.Provider>
  );
}

export function useProgramStore() {
  const context = useContext(ProgramStoreContext);
  if (!context)
    throw new Error("useProgramStore must be used within ProgramStoreProvider.");
  return context;
}

export function useAvailableExercises() {
  const { customExercises } = useProgramStore();
  return customExercises;
}
