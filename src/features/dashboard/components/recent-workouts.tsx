import { ArrowUpRight, Clock3, Dumbbell } from "lucide-react";
import Link from "next/link";

const recentWorkouts = [
  {
    date: "Today",
    duration: "54 min",
    name: "Upper Body Strength",
    volume: "4,280 kg",
  },
  {
    date: "Fri, Jul 18",
    duration: "48 min",
    name: "Lower Body Power",
    volume: "5,140 kg",
  },
  {
    date: "Wed, Jul 16",
    duration: "42 min",
    name: "Push Hypertrophy",
    volume: "3,060 kg",
  },
];

export function RecentWorkouts() {
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
      <ul className="divide-y divide-white/[0.08]">
        {recentWorkouts.map((workout) => (
          <li
            className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
            key={workout.name}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-zinc-300">
              <Dumbbell aria-hidden="true" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-100">
                {workout.name}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                <Clock3 aria-hidden="true" size={13} />
                <span>
                  {workout.date} · {workout.duration}
                </span>
              </div>
            </div>
            <p className="text-right text-sm font-semibold text-zinc-300">
              {workout.volume}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
