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
  destinationLabel?: string;
  existingExerciseIds: string[];
  onClose: () => void;
  onSelect: (exercise: ExerciseDefinition) => Promise<void>;
};

export function ExercisePickerDialog({
  destinationLabel = "workout day",
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
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("All muscle groups");
  const [error, setError] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const muscleGroups = useMemo(
    () => Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup))).sort(),
    [exercises],
  );
  const availableExercises = useMemo(
    () =>
      exercises
        .filter(
          (exercise) =>
            !existingExerciseIds.includes(exercise.id) &&
            (!normalizedQuery ||
              exercise.name.toLowerCase().includes(normalizedQuery)) &&
            (selectedMuscleGroup === "All muscle groups" ||
              exercise.muscleGroup === selectedMuscleGroup),
        )
        .sort((first, second) => {
          const firstScore =
            first.name.toLowerCase() === normalizedQuery
              ? 0
              : first.name.toLowerCase().startsWith(normalizedQuery)
                ? 1
                : 2;
          const secondScore =
            second.name.toLowerCase() === normalizedQuery
              ? 0
              : second.name.toLowerCase().startsWith(normalizedQuery)
                ? 1
                : 2;
          return firstScore - secondScore || first.name.localeCompare(second.name);
        }),
    [existingExerciseIds, exercises, normalizedQuery, selectedMuscleGroup],
  );

  async function selectExercise(exercise: ExerciseDefinition) {
    setSelectionError("");
    setIsSelecting(true);
    try {
      await onSelect(exercise);
      onClose();
    } catch {
      setSelectionError(
        "This exercise is no longer available. Refresh the page and try again.",
      );
    } finally {
      setIsSelecting(false);
    }
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
        (exercise) =>
          !exercise.isSystem &&
          exercise.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setError("An exercise with this name is already available.");
      return;
    }
    try {
      await selectExercise(await createCustomExercise(trimmedName, trimmedMuscleGroup));
    } catch {
      setError("Unable to create this exercise. Please try again.");
    }
  }

  return (
    <Dialog
      description={
        isCreating
          ? "Custom exercises are saved to your reusable exercise library."
          : `Choose an exercise to add to this ${destinationLabel}.`
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
          {error ? (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setIsCreating(false)} variant="secondary">
              Back
            </Button>
            <Button disabled={isSelecting} type="submit">
              Create and add
            </Button>
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
          <label className="sr-only" htmlFor="exercise-muscle-group-filter">
            Filter by muscle group
          </label>
          <select
            className="mt-3 w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3 py-3 text-sm text-zinc-200 outline-none focus:border-lime-300"
            id="exercise-muscle-group-filter"
            onChange={(event) => setSelectedMuscleGroup(event.target.value)}
            value={selectedMuscleGroup}
          >
            <option>All muscle groups</option>
            {muscleGroups.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>
          {selectionError ? (
            <p className="mt-3 text-sm text-red-300" role="alert">
              {selectionError}
            </p>
          ) : null}
          <div className="mt-4 max-h-72 space-y-1 overflow-y-auto pr-1">
            {availableExercises.length ? (
              availableExercises.map((exercise) => (
                <button
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-lime-300"
                  key={exercise.id}
                  onClick={() => selectExercise(exercise)}
                  disabled={isSelecting}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-semibold text-zinc-100">
                      {exercise.name}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {exercise.muscleGroup}
                      {` · ${exercise.equipment ?? "Custom"}`}
                    </span>
                  </span>
                  {!exercise.isSystem ? (
                    <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-bold tracking-[0.08em] text-zinc-400 uppercase">
                      Custom
                    </span>
                  ) : null}
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
