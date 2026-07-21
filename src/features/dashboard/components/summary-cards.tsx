import { Dumbbell, Flame, Layers3, Trophy } from "lucide-react";

import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { TrophyArt } from "@/features/profile/components/trophy-art";
import type { DashboardData } from "@/features/dashboard/types";

type SummaryCardsProps = {
  dashboard: DashboardData;
};

export function SummaryCards({ dashboard }: SummaryCardsProps) {
  const remainingWorkouts = Math.max(
    dashboard.weeklyTarget - dashboard.currentWeekWorkouts,
    0,
  );

  return (
    <section
      aria-label="Training summary"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <DashboardCard icon={Flame} label="Goal streak">
        <p className="text-3xl font-bold tracking-[-0.045em] text-white">
          {dashboard.currentStreak}{" "}
          <span className="text-base font-medium text-zinc-500">weeks</span>
        </p>
        <p className="mt-2 text-sm text-lime-300">
          {dashboard.streakMultiplier.toFixed(2)}x XP multiplier
        </p>
      </DashboardCard>
      <DashboardCard icon={Dumbbell} label="Workouts this week">
        <p className="text-3xl font-bold tracking-[-0.045em] text-white">
          {dashboard.currentWeekWorkouts}{" "}
          <span className="text-base font-medium text-zinc-500">
            of {dashboard.weeklyTarget}
          </span>
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          {remainingWorkouts
            ? `${remainingWorkouts} session${remainingWorkouts === 1 ? "" : "s"} to go`
            : "Weekly target reached"}
        </p>
      </DashboardCard>
      <DashboardCard icon={Layers3} label="Training volume">
        <p className="text-3xl font-bold tracking-[-0.045em] text-white">
          {dashboard.weeklyVolume.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })}{" "}
          <span className="text-base font-medium text-zinc-500">kg</span>
        </p>
        <p className="mt-2 text-sm text-zinc-500">This week</p>
      </DashboardCard>
      <DashboardCard icon={Trophy} label="Current level">
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-bold tracking-[-0.045em] text-white">
            {dashboard.level.current}
          </p>
          <p className="text-sm font-medium text-lime-300">
            {dashboard.level.totalXp.toLocaleString("en-US")} XP
          </p>
        </div>
        {dashboard.activeTrophy ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.04] px-2 py-1.5">
            <TrophyArt compact trophyKey={dashboard.activeTrophy.key} unlocked />
            <p className="min-w-0 text-xs">
              <span className="block truncate font-semibold text-zinc-100">
                {dashboard.activeTrophy.name}
              </span>
              <span className="text-zinc-500">{dashboard.activeTrophy.rarity}</span>
            </p>
          </div>
        ) : dashboard.nextTrophy ? (
          <p className="mt-3 text-xs text-zinc-500">
            {dashboard.nextTrophy.level - dashboard.level.current} levels to{" "}
            {dashboard.nextTrophy.name}
          </p>
        ) : null}
        <div
          aria-label={`${dashboard.level.progressXp} of ${dashboard.level.xpToNextLevel} experience points toward the next level`}
          aria-valuemax={dashboard.level.xpToNextLevel}
          aria-valuemin={0}
          aria-valuenow={dashboard.level.progressXp}
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-lime-300"
            style={{ width: `${dashboard.level.progressPercent}%` }}
          />
        </div>
      </DashboardCard>
    </section>
  );
}
