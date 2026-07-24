"use client";

import { Dumbbell, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/features/programs/components/confirm-dialog";
import { DayFormDialog } from "@/features/programs/components/day-form-dialog";
import { ExercisePickerDialog } from "@/features/programs/components/exercise-picker-dialog";
import { useProgramStore } from "@/features/programs/program-store";
import type { ProgramExercise, WorkoutDay } from "@/features/programs/types";

type WorkoutDayCardProps = { day: WorkoutDay; programId: string };

function EditablePositiveInteger({
  ariaLabel,
  onSave,
  value,
}: {
  ariaLabel: string;
  onSave: (value: number | undefined) => Promise<void>;
  value?: number;
}) {
  const [draft, setDraft] = useState(value?.toString() ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setDraft(value?.toString() ?? ""), [value]);

  async function save() {
    const trimmed = draft.trim();
    if (trimmed && !/^[1-9]\d*$/.test(trimmed)) {
      setError("Use a positive whole number.");
      return;
    }
    const nextValue = trimmed ? Number(trimmed) : undefined;
    if (nextValue === value) return;
    setError("");
    setIsSaving(true);
    try {
      await onSave(nextValue);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save value.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <span>
      <input
        aria-label={ariaLabel}
        aria-describedby={error ? `${ariaLabel}-error` : undefined}
        className="mt-1 w-full rounded-lg border border-white/[0.1] bg-[#0d0e12] px-2.5 py-2 text-sm font-semibold text-zinc-100 outline-none focus:border-lime-300"
        disabled={isSaving}
        inputMode="numeric"
        onBlur={save}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        placeholder="—"
        value={draft}
      />
      {error ? (
        <span className="mt-1 block text-[11px] text-red-300" id={`${ariaLabel}-error`}>
          {error}
        </span>
      ) : null}
    </span>
  );
}

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
  return (
    <li className="grid gap-3 border-t border-white/[0.08] py-4 md:grid-cols-[minmax(0,1fr)_92px_92px_92px_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-100">{exercise.name}</p>
        <p className="mt-1 text-xs text-zinc-500">{exercise.muscleGroup}</p>
      </div>
      <label className="text-xs font-medium text-zinc-500">
        Sets
        <EditablePositiveInteger
          ariaLabel={`${exercise.name} target sets`}
          onSave={(targetSets) =>
            updateExercise(programId, dayId, exercise.id, {
              targetSets: targetSets ?? exercise.targetSets,
            })
          }
          value={exercise.targetSets}
        />
      </label>
      <label className="text-xs font-medium text-zinc-500">
        Min reps
        <EditablePositiveInteger
          ariaLabel={`${exercise.name} minimum reps`}
          onSave={(targetRepMin) =>
            updateExercise(programId, dayId, exercise.id, { targetRepMin })
          }
          value={exercise.targetRepMin}
        />
      </label>
      <label className="text-xs font-medium text-zinc-500">
        Max reps
        <EditablePositiveInteger
          ariaLabel={`${exercise.name} maximum reps`}
          onSave={(targetRepMax) =>
            updateExercise(programId, dayId, exercise.id, { targetRepMax })
          }
          value={exercise.targetRepMax}
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
