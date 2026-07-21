import { ArrowLeft, Check, Clock3, Dumbbell, Layers3 } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell/app-shell";
import type { WorkoutHistoryDetail } from "@/features/workout/types";

type WorkoutHistoryDetailProps = { workout: WorkoutHistoryDetail | undefined };

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export function WorkoutHistoryDetail({ workout }: WorkoutHistoryDetailProps) {
  if (!workout)
    return (
      <AppShell eyebrow="Workout history" title="Workout not found">
        <section className="rounded-2xl border border-dashed border-white/[0.12] bg-[#111217] p-8 text-center">
          <h2 className="text-xl font-bold text-white">This workout is unavailable.</h2>
          <Link
            className="mt-4 inline-flex text-sm font-semibold text-lime-300 hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-lime-300"
            href="/workout"
          >
            Return to workout
          </Link>
        </section>
      </AppShell>
    );

  return (
    <AppShell eyebrow="Completed workout" title={workout.workoutDayName}>
      <div className="space-y-6 sm:space-y-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-lime-300"
          href="/workout"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Back to workouts
        </Link>
        <section className="rounded-2xl border border-white/[0.08] bg-[#111217] p-5 sm:p-7">
          <p className="text-xs font-bold tracking-[0.13em] text-lime-300 uppercase">
            {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
              new Date(workout.completedAt),
            )}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-white">
            {workout.workoutDayName}
          </h2>
          {workout.programName && workout.programName !== "Quick workout" ? (
            <p className="mt-2 text-sm text-zinc-400">{workout.programName}</p>
          ) : null}
          <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-5">
            <div>
              <dt className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock3 aria-hidden="true" size={13} />
                Duration
              </dt>
              <dd className="mt-2 text-sm font-bold text-zinc-100">
                {formatDuration(workout.durationSeconds)}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-zinc-500">
                <Layers3 aria-hidden="true" size={13} />
                Sets
              </dt>
              <dd className="mt-2 text-sm font-bold text-zinc-100">
                {workout.completedSets}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Volume</dt>
              <dd className="mt-2 text-sm font-bold text-zinc-100">
                {workout.totalVolume.toLocaleString()} kg
              </dd>
            </div>
          </dl>
        </section>
        <section aria-labelledby="logged-exercises-heading">
          <p className="text-xs font-bold tracking-[0.13em] text-zinc-500 uppercase">
            Training log
          </p>
          <h2
            className="mt-1 text-xl font-bold tracking-[-0.035em] text-white"
            id="logged-exercises-heading"
          >
            Exercises
          </h2>
          <div className="mt-4 space-y-4">
            {workout.exercises.map((exercise) => (
              <article
                className="rounded-2xl border border-white/[0.08] bg-[#111217] p-4 sm:p-5"
                key={exercise.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white">{exercise.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {exercise.muscleGroup} · {exercise.targetSets ?? 0} target sets
                    </p>
                  </div>
                  <Dumbbell aria-hidden="true" className="text-lime-300" size={18} />
                </div>
                {exercise.note ? (
                  <p className="mt-4 rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-zinc-400">
                    {exercise.note}
                  </p>
                ) : null}
                <ul className="mt-4 divide-y divide-white/[0.08]">
                  {exercise.sets.map((set, index) => (
                    <li
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      key={set.id}
                    >
                      <span className="text-sm font-semibold text-zinc-300">
                        Set {index + 1}
                      </span>
                      <span className="flex items-center gap-3 text-sm">
                        <span className="text-zinc-400">
                          {set.weightKg ?? "—"} kg × {set.reps ?? "—"}
                        </span>
                        <span
                          className={`grid size-6 place-items-center rounded-full ${set.completed ? "bg-lime-300 text-zinc-950" : "bg-white/[0.06] text-zinc-600"}`}
                        >
                          <Check aria-hidden="true" size={14} strokeWidth={3} />
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
