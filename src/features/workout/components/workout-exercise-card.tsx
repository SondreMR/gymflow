"use client";

import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { previousResults } from "@/features/workout/data/previous-results";
import { useWorkoutStore } from "@/features/workout/workout-store";
import type { ActiveWorkoutExercise, WorkoutSetLog } from "@/features/workout/types";

type WorkoutExerciseCardProps = {
  exercise: ActiveWorkoutExercise;
  onSetCompleted: () => void;
};

function SetRow({
  exercise,
  index,
  onSetCompleted,
  set,
}: {
  exercise: ActiveWorkoutExercise;
  index: number;
  onSetCompleted: () => void;
  set: WorkoutSetLog;
}) {
  const { removeSet, updateSet } = useWorkoutStore();
  const inputClass =
    "min-h-11 w-full rounded-xl border border-white/[0.1] bg-[#0c0d10] px-3 text-center text-sm font-semibold text-white outline-none focus:border-lime-300";
  const previous = previousResults[exercise.exerciseId] ?? "—";

  function toggleComplete() {
    const nextCompleted = !set.completed;
    updateSet(exercise.id, set.id, { completed: nextCompleted });
    if (nextCompleted) onSetCompleted();
  }

  return (
    <li className="grid grid-cols-[34px_minmax(0,1fr)_72px_72px_46px] items-center gap-2 py-2.5 sm:grid-cols-[40px_minmax(100px,1fr)_92px_92px_48px]">
      <span className="text-center text-sm font-bold text-zinc-400">{index + 1}</span>
      <span className="truncate text-center text-xs text-zinc-500">{previous}</span>
      <input
        aria-label={`${exercise.name} set ${index + 1} weight in kilograms`}
        className={inputClass}
        inputMode="decimal"
        min={0}
        onChange={(event) =>
          updateSet(exercise.id, set.id, {
            weightKg: event.target.value ? Number(event.target.value) : undefined,
          })
        }
        placeholder="kg"
        type="number"
        value={set.weightKg ?? ""}
      />
      <input
        aria-label={`${exercise.name} set ${index + 1} repetitions`}
        className={inputClass}
        inputMode="numeric"
        min={0}
        onChange={(event) =>
          updateSet(exercise.id, set.id, {
            reps: event.target.value ? Number(event.target.value) : undefined,
          })
        }
        placeholder="reps"
        type="number"
        value={set.reps ?? ""}
      />
      <div className="flex justify-center">
        <button
          aria-label={`${set.completed ? "Mark incomplete" : "Mark complete"} ${exercise.name} set ${index + 1}`}
          className={`grid size-11 place-items-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 ${set.completed ? "border-lime-300 bg-lime-300 text-zinc-950" : "border-white/[0.12] bg-white/[0.03] text-zinc-500 hover:border-zinc-400"}`}
          onClick={toggleComplete}
          type="button"
        >
          <Check aria-hidden="true" size={19} strokeWidth={3} />
        </button>
      </div>
      {!set.completed ? (
        <button
          aria-label={`Remove ${exercise.name} set ${index + 1}`}
          className="col-start-5 row-start-2 mx-auto rounded-lg p-1 text-zinc-600 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-lime-300 sm:col-start-auto sm:row-start-auto"
          onClick={() => removeSet(exercise.id, set.id)}
          type="button"
        >
          <Trash2 aria-hidden="true" size={14} />
        </button>
      ) : null}
    </li>
  );
}

export function WorkoutExerciseCard({
  exercise,
  onSetCompleted,
}: WorkoutExerciseCardProps) {
  const { addSet, updateExerciseNote } = useWorkoutStore();
  const [isNoteOpen, setIsNoteOpen] = useState(Boolean(exercise.note));
  const repRange =
    exercise.targetRepMin && exercise.targetRepMax
      ? `${exercise.targetRepMin}–${exercise.targetRepMax} reps`
      : "Open rep range";

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#131419] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold tracking-[-0.02em] text-white">{exercise.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {exercise.muscleGroup} · {exercise.targetSets} sets · {repRange}
          </p>
        </div>
        <p className="shrink-0 text-xs text-zinc-500">
          Previous: {previousResults[exercise.exerciseId] ?? "—"}
        </p>
      </div>
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[390px]">
          <div className="grid grid-cols-[34px_minmax(0,1fr)_72px_72px_46px] gap-2 border-b border-white/[0.08] pb-2 text-center text-[10px] font-bold tracking-[0.1em] text-zinc-600 uppercase sm:grid-cols-[40px_minmax(100px,1fr)_92px_92px_48px]">
            <span>Set</span>
            <span>Previous</span>
            <span>Weight</span>
            <span>Reps</span>
            <span>Done</span>
          </div>
          <ul>
            {exercise.sets.map((set, index) => (
              <SetRow
                exercise={exercise}
                index={index}
                key={set.id}
                onSetCompleted={onSetCompleted}
                set={set}
              />
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="min-h-11"
          onClick={() => addSet(exercise.id)}
          variant="secondary"
        >
          <Plus aria-hidden="true" size={16} />
          Add set
        </Button>
        <Button
          className="min-h-11"
          onClick={() => setIsNoteOpen((current) => !current)}
          variant="ghost"
        >
          {isNoteOpen ? (
            <ChevronUp aria-hidden="true" size={16} />
          ) : (
            <ChevronDown aria-hidden="true" size={16} />
          )}
          Note
        </Button>
      </div>
      {isNoteOpen ? (
        <div className="mt-4">
          <label
            className="mb-2 block text-sm font-medium text-zinc-400"
            htmlFor={`note-${exercise.id}`}
          >
            Exercise note <span className="text-zinc-600">(optional)</span>
          </label>
          <textarea
            className="min-h-20 w-full rounded-xl border border-white/[0.1] bg-[#0c0d10] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-lime-300"
            id={`note-${exercise.id}`}
            onChange={(event) => updateExerciseNote(exercise.id, event.target.value)}
            placeholder="How did this exercise feel?"
            value={exercise.note}
          />
        </div>
      ) : null}
    </section>
  );
}
