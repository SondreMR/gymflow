"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/features/programs/components/dialog";
import {
  useAvailableExercises,
  useProgramStore,
} from "@/features/programs/program-store";
import type { ExerciseDefinition } from "@/features/programs/types";

type ExercisePickerDialogProps = {
  existingExerciseIds: string[];
  onClose: () => void;
  onSelect: (exercise: ExerciseDefinition) => void;
};

export function ExercisePickerDialog({
  existingExerciseIds,
  onClose,
  onSelect,
}: ExercisePickerDialogProps) {
  const exercises = useAvailableExercises();
  const { createCustomExercise } = useProgramStore();
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [error, setError] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const availableExercises = useMemo(
    () =>
      exercises.filter(
        (exercise) =>
          !existingExerciseIds.includes(exercise.id) &&
          (!normalizedQuery ||
            `${exercise.name} ${exercise.muscleGroup}`
              .toLowerCase()
              .includes(normalizedQuery)),
      ),
    [existingExerciseIds, exercises, normalizedQuery],
  );

  function selectExercise(exercise: ExerciseDefinition) {
    onSelect(exercise);
    onClose();
  }

  async function createExercise(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedMuscleGroup = muscleGroup.trim();
    if (!trimmedName || !trimmedMuscleGroup) {
      setError("Exercise name and muscle group are required.");
      return;
    }
    if (
      exercises.some(
        (exercise) => exercise.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setError("An exercise with this name is already available.");
      return;
    }
    selectExercise(await createCustomExercise(trimmedName, trimmedMuscleGroup));
  }

  return (
    <Dialog
      description={
        isCreating
          ? "Custom exercises stay available for this prototype session."
          : "Choose an exercise to add to this workout day."
      }
      onClose={onClose}
      title={isCreating ? "Create custom exercise" : "Add exercise"}
    >
      {isCreating ? (
        <form className="space-y-5" onSubmit={createExercise}>
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-zinc-200"
              htmlFor="custom-exercise-name"
            >
              Exercise name
            </label>
            <input
              autoFocus
              className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-3 text-sm text-white outline-none focus:border-lime-300"
              id="custom-exercise-name"
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Cable Y-Raise"
              value={name}
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-zinc-200"
              htmlFor="custom-exercise-muscle"
            >
              Muscle group
            </label>
            <input
              className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-3 text-sm text-white outline-none focus:border-lime-300"
              id="custom-exercise-muscle"
              maxLength={100}
              onChange={(event) => setMuscleGroup(event.target.value)}
              placeholder="e.g. Shoulders"
              value={muscleGroup}
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setIsCreating(false)} variant="secondary">
              Back
            </Button>
            <Button type="submit">Create and add</Button>
          </div>
        </form>
      ) : (
        <div>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500"
              size={18}
            />
            <input
              autoFocus
              className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] py-3 pr-3 pl-10 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-lime-300"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search exercises"
              value={query}
            />
          </div>
          <div className="mt-4 max-h-72 space-y-1 overflow-y-auto pr-1">
            {availableExercises.length ? (
              availableExercises.map((exercise) => (
                <button
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-lime-300"
                  key={exercise.id}
                  onClick={() => selectExercise(exercise)}
                  type="button"
                >
                  <span className="text-sm font-semibold text-zinc-100">
                    {exercise.name}
                  </span>
                  <span className="text-xs text-zinc-500">{exercise.muscleGroup}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-8 text-center text-sm text-zinc-500">
                No available exercises match your search.
              </p>
            )}
          </div>
          <button
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lime-300 hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-lime-300"
            onClick={() => setIsCreating(true)}
            type="button"
          >
            <Plus aria-hidden="true" size={16} />
            Create a custom exercise
          </button>
        </div>
      )}
    </Dialog>
  );
}
