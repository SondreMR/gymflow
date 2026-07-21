"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

import { builtInExercises, mockPrograms } from "@/features/programs/data/mock-programs";
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
  addDay: (programId: string, name: string) => void;
  addExercise: (programId: string, dayId: string, exercise: ExerciseDefinition) => void;
  createCustomExercise: (name: string, muscleGroup: string) => ExerciseDefinition;
  createProgram: (draft: ProgramDraft) => void;
  customExercises: ExerciseDefinition[];
  deleteDay: (programId: string, dayId: string) => void;
  deleteProgram: (programId: string) => void;
  duplicateProgram: (programId: string) => void;
  getProgram: (programId: string) => WorkoutProgram | undefined;
  programs: WorkoutProgram[];
  removeExercise: (programId: string, dayId: string, programExerciseId: string) => void;
  renameDay: (programId: string, dayId: string, name: string) => void;
  updateExercise: (
    programId: string,
    dayId: string,
    programExerciseId: string,
    patch: ProgramExercisePatch,
  ) => void;
  updateProgram: (programId: string, draft: ProgramDraft) => void;
};

const ProgramStoreContext = createContext<ProgramStoreValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function markUpdated(program: WorkoutProgram): WorkoutProgram {
  return { ...program, updatedAt: "Updated just now" };
}

function updateProgramById(
  programs: WorkoutProgram[],
  programId: string,
  updater: (program: WorkoutProgram) => WorkoutProgram,
) {
  return programs.map((program) =>
    program.id === programId ? markUpdated(updater(program)) : program,
  );
}

export function ProgramStoreProvider({ children }: { children: ReactNode }) {
  const [programs, setPrograms] = useState<WorkoutProgram[]>(mockPrograms);
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([]);

  function createProgram({ name, description }: ProgramDraft) {
    setPrograms((currentPrograms) => [
      {
        id: createId("program"),
        name,
        description: description || undefined,
        days: [],
        updatedAt: "Updated just now",
      },
      ...currentPrograms,
    ]);
  }

  function updateProgram(programId: string, { name, description }: ProgramDraft) {
    setPrograms((currentPrograms) =>
      updateProgramById(currentPrograms, programId, (program) => ({
        ...program,
        name,
        description: description || undefined,
      })),
    );
  }

  function deleteProgram(programId: string) {
    setPrograms((currentPrograms) =>
      currentPrograms.filter((program) => program.id !== programId),
    );
  }

  function duplicateProgram(programId: string) {
    setPrograms((currentPrograms) => {
      const source = currentPrograms.find((program) => program.id === programId);
      if (!source) return currentPrograms;

      const duplicate: WorkoutProgram = {
        ...source,
        id: createId("program"),
        name: `${source.name} copy`,
        updatedAt: "Updated just now",
        days: source.days.map((day) => ({
          ...day,
          id: createId("day"),
          exercises: day.exercises.map((exercise) => ({
            ...exercise,
            id: createId("exercise"),
          })),
        })),
      };

      return [duplicate, ...currentPrograms];
    });
  }

  function addDay(programId: string, name: string) {
    setPrograms((currentPrograms) =>
      updateProgramById(currentPrograms, programId, (program) => ({
        ...program,
        days: [...program.days, { id: createId("day"), name, exercises: [] }],
      })),
    );
  }

  function renameDay(programId: string, dayId: string, name: string) {
    setPrograms((currentPrograms) =>
      updateProgramById(currentPrograms, programId, (program) => ({
        ...program,
        days: program.days.map((day) => (day.id === dayId ? { ...day, name } : day)),
      })),
    );
  }

  function deleteDay(programId: string, dayId: string) {
    setPrograms((currentPrograms) =>
      updateProgramById(currentPrograms, programId, (program) => ({
        ...program,
        days: program.days.filter((day) => day.id !== dayId),
      })),
    );
  }

  function addExercise(programId: string, dayId: string, exercise: ExerciseDefinition) {
    setPrograms((currentPrograms) =>
      updateProgramById(currentPrograms, programId, (program) => ({
        ...program,
        days: program.days.map((day) =>
          day.id === dayId
            ? {
                ...day,
                exercises: [
                  ...day.exercises,
                  {
                    ...exercise,
                    id: createId("program-exercise"),
                    exerciseId: exercise.id,
                    targetSets: 3,
                  },
                ],
              }
            : day,
        ),
      })),
    );
  }

  function removeExercise(programId: string, dayId: string, programExerciseId: string) {
    setPrograms((currentPrograms) =>
      updateProgramById(currentPrograms, programId, (program) => ({
        ...program,
        days: program.days.map((day) =>
          day.id === dayId
            ? {
                ...day,
                exercises: day.exercises.filter(
                  (exercise) => exercise.id !== programExerciseId,
                ),
              }
            : day,
        ),
      })),
    );
  }

  function updateExercise(
    programId: string,
    dayId: string,
    programExerciseId: string,
    patch: ProgramExercisePatch,
  ) {
    setPrograms((currentPrograms) =>
      updateProgramById(currentPrograms, programId, (program) => ({
        ...program,
        days: program.days.map((day) => {
          if (day.id !== dayId) return day;

          return {
            ...day,
            exercises: day.exercises.map((exercise) => {
              if (exercise.id !== programExerciseId) return exercise;

              const next = { ...exercise, ...patch };
              if (
                next.targetRepMin &&
                next.targetRepMax &&
                next.targetRepMin > next.targetRepMax
              ) {
                return { ...next, targetRepMax: next.targetRepMin };
              }
              return next;
            }),
          };
        }),
      })),
    );
  }

  function createCustomExercise(name: string, muscleGroup: string) {
    const exercise = { id: createId("custom"), name, muscleGroup };
    setCustomExercises((currentExercises) => [...currentExercises, exercise]);
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
  return [...builtInExercises, ...customExercises];
}
