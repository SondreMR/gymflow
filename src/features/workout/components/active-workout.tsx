"use client";

import { CircleStop, Dumbbell, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/features/programs/components/confirm-dialog";
import { ExercisePickerDialog } from "@/features/programs/components/exercise-picker-dialog";
import { RestTimer, ElapsedTimer } from "@/features/workout/components/workout-timer";
import { WorkoutExerciseCard } from "@/features/workout/components/workout-exercise-card";
import { useWorkoutStore } from "@/features/workout/workout-store";

export function ActiveWorkout() {
  const {
    activeWorkout,
    addExercise,
    cancelWorkout,
    finishWorkout,
    isSaving,
    removeExercise,
    saveError,
  } = useWorkoutStore();
  const [isCanceling, setIsCanceling] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  if (!activeWorkout) return null;
  const allSets = activeWorkout.exercises.flatMap((exercise) => exercise.sets);
  const completedSets = allSets.filter((set) => set.completed).length;
  const incompleteSets = allSets.length - completedSets;
  const progress = allSets.length
    ? Math.round((completedSets / allSets.length) * 100)
    : 0;
  const startTime = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(activeWorkout.startedAt);

  async function requestFinish() {
    if (incompleteSets) setIsFinishing(true);
    else finishWorkout();
  }

  return (
    <main className="min-h-screen bg-[#090a0d] pb-8 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#090a0d]/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold tracking-[0.13em] text-lime-300 uppercase">
              {activeWorkout.programName ?? "Unplanned session"}
            </p>
            <h1 className="mt-1 truncate text-xl font-bold tracking-[-0.035em] text-white">
              {activeWorkout.workoutDayName}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Elapsed time</p>
            <ElapsedTimer startedAt={activeWorkout.startedAt} />
            <p className="mt-1 text-xs text-zinc-500">Started {startTime}</p>
          </div>
        </div>
        <div
          aria-label="Workout progress"
          className="mx-auto mt-4 h-1.5 max-w-3xl overflow-hidden rounded-full bg-white/[0.08]"
        >
          <div
            className="h-full rounded-full bg-lime-300 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            {completedSets} of {allSets.length} sets complete
          </p>
          <p className="text-sm font-semibold text-lime-300">{progress}%</p>
        </div>
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => setIsAddingExercise(true)}
        >
          <Plus aria-hidden="true" size={17} />
          Add exercise
        </Button>
        {activeWorkout.exercises.length ? (
          activeWorkout.exercises.map((exercise) => (
            <div className="space-y-2" key={exercise.id}>
              <WorkoutExerciseCard
                exercise={exercise}
                onSetCompleted={() => setRestStartedAt(Date.now())}
              />
              {activeWorkout.sessionId ? (
                <Button
                  className="text-zinc-500 hover:text-red-300"
                  onClick={() => removeExercise(exercise.exerciseId)}
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Remove exercise
                </Button>
              ) : null}
            </div>
          ))
        ) : (
          <section className="rounded-2xl border border-dashed border-white/[0.12] bg-[#131419] p-8 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-xl bg-white/[0.05] text-lime-300">
              <Dumbbell aria-hidden="true" size={20} />
            </span>
            <h2 className="mt-4 font-bold text-white">Quick workout started</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Build your workout as you go. Add the first exercise to begin logging.
            </p>
          </section>
        )}
        <RestTimer onReset={() => setRestStartedAt(null)} startedAt={restStartedAt} />
        {saveError ? (
          <p
            className="rounded-xl border border-red-300/20 bg-red-300/[0.06] px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {saveError}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-between">
          <Button
            className="min-h-12 text-zinc-400 hover:text-red-300 sm:order-1"
            disabled={isSaving}
            onClick={() => setIsCanceling(true)}
            variant="ghost"
          >
            <X aria-hidden="true" size={17} />
            Cancel workout
          </Button>
          <Button
            className="min-h-12 sm:order-2"
            disabled={isSaving}
            onClick={requestFinish}
          >
            <CircleStop aria-hidden="true" size={17} />
            {isSaving ? "Saving workout…" : "Finish workout"}
          </Button>
        </div>
      </div>
      {isCanceling ? (
        <ConfirmDialog
          confirmLabel="Cancel workout"
          description="Your logged sets in this workout session will be discarded."
          onClose={() => setIsCanceling(false)}
          onConfirm={cancelWorkout}
          title="Cancel workout?"
        />
      ) : null}
      {isAddingExercise ? (
        <ExercisePickerDialog
          destinationLabel="quick workout"
          existingExerciseIds={activeWorkout.exercises.map(
            (exercise) => exercise.exerciseId,
          )}
          onClose={() => setIsAddingExercise(false)}
          onSelect={addExercise}
        />
      ) : null}
      {isFinishing ? (
        <ConfirmDialog
          confirmLabel="Finish anyway"
          description={`${incompleteSets} set${incompleteSets === 1 ? " is" : "s are"} still incomplete. You can finish now or return to logging.`}
          onClose={() => setIsFinishing(false)}
          onConfirm={finishWorkout}
          title="Finish with incomplete sets?"
        />
      ) : null}
    </main>
  );
}
