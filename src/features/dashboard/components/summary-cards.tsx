import { Dumbbell, Flame, Layers3, Trophy } from "lucide-react";

import { DashboardCard } from "@/features/dashboard/components/dashboard-card";

export function SummaryCards() {
  return (
    <section
      aria-label="Training summary"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <DashboardCard icon={Flame} label="Current streak">
        <p className="text-3xl font-bold tracking-[-0.045em] text-white">
          6 <span className="text-base font-medium text-zinc-500">days</span>
        </p>
        <p className="mt-2 text-sm text-lime-300">Personal best: 11 days</p>
      </DashboardCard>
      <DashboardCard icon={Dumbbell} label="Workouts this week">
        <p className="text-3xl font-bold tracking-[-0.045em] text-white">
          4 <span className="text-base font-medium text-zinc-500">of 5</span>
        </p>
        <p className="mt-2 text-sm text-zinc-500">One session to go</p>
      </DashboardCard>
      <DashboardCard icon={Layers3} label="Training volume">
        <p className="text-3xl font-bold tracking-[-0.045em] text-white">
          12,480 <span className="text-base font-medium text-zinc-500">kg</span>
        </p>
        <p className="mt-2 text-sm text-zinc-500">This week</p>
      </DashboardCard>
      <DashboardCard icon={Trophy} label="Current level">
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-bold tracking-[-0.045em] text-white">12</p>
          <p className="text-sm font-medium text-lime-300">1,240 XP</p>
        </div>
        <div
          aria-label="1,240 of 1,600 experience points"
          aria-valuemax={1600}
          aria-valuemin={0}
          aria-valuenow={1240}
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
          role="progressbar"
        >
          <div className="h-full w-[77.5%] rounded-full bg-lime-300" />
        </div>
      </DashboardCard>
    </section>
  );
}
