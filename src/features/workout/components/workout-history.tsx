"use client";

import { ArrowUpRight, Clock3, Dumbbell, Layers3 } from "lucide-react";
import Link from "next/link";

import { useWorkoutStore } from "@/features/workout/workout-store";

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

export function WorkoutHistory() {
  const { history } = useWorkoutStore();
  if (!history.length) return null;

  return (
    <section
      aria-labelledby="workout-history-heading"
      className="rounded-2xl border border-white/[0.08] bg-[#111217] p-5 sm:p-6"
    >
      <div className="mb-5">
        <p className="text-xs font-bold tracking-[0.13em] text-zinc-500 uppercase">
          Training log
        </p>
        <h2
          className="mt-1 text-xl font-bold tracking-[-0.035em] text-white"
          id="workout-history-heading"
        >
          Recent workouts
        </h2>
      </div>
      <ul className="divide-y divide-white/[0.08]">
        {history.map((session) => (
          <li key={session.id}>
            <Link
              className="flex items-center gap-3 py-4 first:pt-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-lime-300"
              href={`/workout/history/${session.id}`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-lime-300">
                <Dumbbell aria-hidden="true" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-zinc-100">
                  {session.workoutDayName}
                </span>
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span>{formatDate(session.completedAt)}</span>
                  {session.programName && session.programName !== "Quick workout" ? (
                    <span>{session.programName}</span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Clock3 aria-hidden="true" size={12} />
                    {formatDuration(session.durationSeconds)}
                  </span>
                </span>
              </span>
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-semibold text-zinc-200">
                  {session.totalVolume.toLocaleString()} kg
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500">
                  <Layers3 aria-hidden="true" size={12} />
                  {session.completedSets} sets
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="shrink-0 text-zinc-600"
                size={17}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
