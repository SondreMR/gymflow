import { ArrowUpRight, Clock3, Dumbbell } from "lucide-react";
import Link from "next/link";

import type { DashboardRecentWorkout } from "@/features/dashboard/types";

type RecentWorkoutsProps = {
  workouts: DashboardRecentWorkout[];
};

function formatDuration(durationSeconds: number) {
  return `${Math.max(1, Math.round(durationSeconds / 60))} min`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function RecentWorkouts({ workouts }: RecentWorkoutsProps) {
  return (
    <section
      aria-labelledby="recent-workouts-heading"
      className="rounded-2xl border border-white/[0.08] bg-[#111217] p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.13em] text-zinc-500 uppercase">
            History
          </p>
          <h2
            className="mt-1 text-lg font-bold tracking-[-0.03em] text-white"
            id="recent-workouts-heading"
          >
            Recent workouts
          </h2>
        </div>
        <Link
          className="inline-flex items-center gap-1 text-sm font-semibold text-lime-300 transition-colors hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-lime-300"
          href="/workout"
        >
          See all <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
      </div>
      {workouts.length ? (
        <ul className="divide-y divide-white/[0.08]">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <Link
                className="flex items-center gap-3 py-4 first:pt-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-lime-300"
                href={`/workout/history/${workout.id}`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-zinc-300">
                  <Dumbbell aria-hidden="true" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {workout.workoutDayName}
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {workout.programName ?? "Quick workout"} · {workout.completedSets}{" "}
                    sets
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock3 aria-hidden="true" size={13} />
                    <span>
                      {formatDate(workout.completedAt)} ·{" "}
                      {formatDuration(workout.durationSeconds)}
                    </span>
                  </div>
                </div>
                <p className="text-right text-sm font-semibold text-zinc-300">
                  {workout.totalVolume.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  kg
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.1] px-5 py-9 text-center">
          <p className="text-sm font-semibold text-zinc-200">
            No workouts completed yet
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Finish your first workout to see your recent training here.
          </p>
        </div>
      )}
    </section>
  );
}
