import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

import { SummaryCards } from "@/features/dashboard/components/summary-cards";
import { RecentWorkouts } from "@/features/dashboard/components/recent-workouts";
import { WeeklyActivity } from "@/features/dashboard/components/weekly-activity";

export function DashboardOverview() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="flex flex-col justify-between gap-6 rounded-2xl border border-white/[0.08] bg-[#111217] p-6 sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="text-sm font-medium text-lime-300">Sunday, July 20</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">
            Good evening, Alex.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400 sm:text-base">
            You are one workout away from completing this week&apos;s training plan.
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
      <SummaryCards />
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <RecentWorkouts />
        <WeeklyActivity />
      </div>
    </div>
  );
}
