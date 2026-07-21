import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

import { SummaryCards } from "@/features/dashboard/components/summary-cards";
import { RecentWorkouts } from "@/features/dashboard/components/recent-workouts";
import { WeeklyActivity } from "@/features/dashboard/components/weekly-activity";
import type { DashboardData } from "@/features/dashboard/types";

type DashboardOverviewProps = {
  dashboard: DashboardData;
};

export function DashboardOverview({ dashboard }: DashboardOverviewProps) {
  const remainingWorkouts = Math.max(
    dashboard.weeklyTarget - dashboard.currentWeekWorkouts,
    0,
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="flex flex-col justify-between gap-6 rounded-2xl border border-white/[0.08] bg-[#111217] p-6 sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="text-sm font-medium text-lime-300">{dashboard.todayLabel}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">
            Ready to train, {dashboard.profile.displayName}?
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400 sm:text-base">
            {remainingWorkouts
              ? `${remainingWorkouts} workout${remainingWorkouts === 1 ? "" : "s"} to reach this week’s training target.`
              : "You have reached this week’s training target. Keep the momentum going."}
          </p>
        </div>
        <Link
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200"
          href="/workout"
        >
          <Play aria-hidden="true" fill="currentColor" size={16} />
          Start workout
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </section>
      <SummaryCards dashboard={dashboard} />
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <RecentWorkouts workouts={dashboard.recentWorkouts} />
        <WeeklyActivity
          activity={dashboard.weeklyActivity}
          currentWeekWorkouts={dashboard.currentWeekWorkouts}
          weeklyTarget={dashboard.weeklyTarget}
        />
      </div>
    </div>
  );
}
