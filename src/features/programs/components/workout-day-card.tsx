"use client";

import { Dumbbell, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/features/programs/components/confirm-dialog";
import { DayFormDialog } from "@/features/programs/components/day-form-dialog";
import { ExercisePickerDialog } from "@/features/programs/components/exercise-picker-dialog";
import { useProgramStore } from "@/features/programs/program-store";
import type { ProgramExercise, WorkoutDay } from "@/features/programs/types";

type WorkoutDayCardProps = { day: WorkoutDay; programId: string };

function ExerciseRow({
  dayId,
  exercise,
  programId,
}: {
  dayId: string;
  exercise: ProgramExercise;
  programId: string;
}) {
  const { removeExercise, updateExercise } = useProgramStore();
  const inputClass =
    "w-full rounded-lg border border-white/[0.1] bg-[#0d0e12] px-2.5 py-2 text-sm font-semibold text-zinc-100 outline-none focus:border-lime-300";

  return (
    <li className="grid gap-3 border-t border-white/[0.08] py-4 md:grid-cols-[minmax(0,1fr)_92px_92px_92px_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-100">{exercise.name}</p>
        <p className="mt-1 text-xs text-zinc-500">{exercise.muscleGroup}</p>
      </div>
      <label className="text-xs font-medium text-zinc-500">
        Sets
        <input
          aria-label={`${exercise.name} target sets`}
          className={`${inputClass} mt-1`}
          min={1}
          onChange={(event) =>
            updateExercise(programId, dayId, exercise.id, {
              targetSets: Math.max(1, Number(event.target.value) || 1),
            })
          }
          type="number"
          value={exercise.targetSets}
        />
      </label>
      <label className="text-xs font-medium text-zinc-500">
        Min reps
        <input
          aria-label={`${exercise.name} minimum reps`}
          className={`${inputClass} mt-1`}
          min={1}
          onChange={(event) =>
            updateExercise(programId, dayId, exercise.id, {
              targetRepMin: event.target.value ? Number(event.target.value) : undefined,
            })
          }
          placeholder="—"
          type="number"
          value={exercise.targetRepMin ?? ""}
        />
      </label>
      <label className="text-xs font-medium text-zinc-500">
        Max reps
        <input
          aria-label={`${exercise.name} maximum reps`}
          className={`${inputClass} mt-1`}
          min={1}
          onChange={(event) =>
            updateExercise(programId, dayId, exercise.id, {
              targetRepMax: event.target.value ? Number(event.target.value) : undefined,
            })
          }
          placeholder="—"
          type="number"
          value={exercise.targetRepMax ?? ""}
        />
      </label>
      <Button
        aria-label={`Remove ${exercise.name}`}
        className="justify-self-end px-2 text-zinc-500 hover:text-red-300 md:mt-5"
        onClick={() => removeExercise(programId, dayId, exercise.id)}
        variant="ghost"
      >
        <Trash2 aria-hidden="true" size={17} />
      </Button>
    </li>
  );
}

export function WorkoutDayCard({ day, programId }: WorkoutDayCardProps) {
  const { addExercise, deleteDay, renameDay } = useProgramStore();
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#111217] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white/[0.05] text-lime-300">
            <Dumbbell aria-hidden="true" size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-[-0.03em] text-white">
              {day.name}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {day.exercises.length} exercises
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            aria-label={`Rename ${day.name}`}
            className="px-2"
            onClick={() => setIsRenaming(true)}
            variant="ghost"
          >
            <Pencil aria-hidden="true" size={16} />
          </Button>
          <Button
            aria-label={`Delete ${day.name}`}
            className="px-2 text-zinc-500 hover:text-red-300"
            onClick={() => setIsDeleting(true)}
            variant="ghost"
          >
            <Trash2 aria-hidden="true" size={16} />
          </Button>
        </div>
      </div>
      {day.exercises.length ? (
        <ul className="mt-5">
          {day.exercises.map((exercise) => (
            <ExerciseRow
              dayId={day.id}
              exercise={exercise}
              key={exercise.id}
              programId={programId}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-white/[0.1] px-4 py-6 text-center text-sm text-zinc-500">
          No exercises yet. Add the first movement for this day.
        </p>
      )}
      <Button
        className="mt-5 w-full sm:w-auto"
        onClick={() => setIsAddingExercise(true)}
        variant="secondary"
      >
        <Plus aria-hidden="true" size={17} />
        Add exercise
      </Button>
      {isAddingExercise ? (
        <ExercisePickerDialog
          existingExerciseIds={day.exercises.map((exercise) => exercise.exerciseId)}
          onClose={() => setIsAddingExercise(false)}
          onSelect={(exercise) => addExercise(programId, day.id, exercise)}
        />
      ) : null}
      {isRenaming ? (
        <DayFormDialog
          initialName={day.name}
          onClose={() => setIsRenaming(false)}
          onSubmit={(name) => renameDay(programId, day.id, name)}
          title="Rename workout day"
        />
      ) : null}
      {isDeleting ? (
        <ConfirmDialog
          confirmLabel="Delete workout day"
          description={`Delete ${day.name} and its ${day.exercises.length} exercise${day.exercises.length === 1 ? "" : "s"}?`}
          onClose={() => setIsDeleting(false)}
          onConfirm={() => deleteDay(programId, day.id)}
          title="Delete workout day"
        />
      ) : null}
    </section>
  );
}
