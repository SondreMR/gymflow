import type { WeeklyActivityDay } from "@/features/dashboard/types";

type WeeklyActivityProps = {
  activity: WeeklyActivityDay[];
  currentWeekWorkouts: number;
  weeklyTarget: number;
};

export function WeeklyActivity({
  activity,
  currentWeekWorkouts,
  weeklyTarget,
}: WeeklyActivityProps) {
  const greatestDailyVolume = Math.max(1, ...activity.map((day) => day.totalVolume));

  return (
    <section
      aria-labelledby="weekly-activity-heading"
      className="rounded-2xl border border-white/[0.08] bg-[#111217] p-5 sm:p-6"
    >
      <div className="mb-7">
        <p className="text-xs font-bold tracking-[0.13em] text-zinc-500 uppercase">
          Consistency
        </p>
        <h2
          className="mt-1 text-lg font-bold tracking-[-0.03em] text-white"
          id="weekly-activity-heading"
        >
          Weekly activity
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {currentWeekWorkouts} of {weeklyTarget} training sessions completed
        </p>
      </div>
      <div
        aria-label="Weekly workout activity"
        className="flex h-44 items-end justify-between gap-2 sm:gap-3"
        role="img"
      >
        {activity.map((day) => {
          const height = day.totalVolume
            ? Math.max(12, (day.totalVolume / greatestDailyVolume) * 100)
            : 0;
          const isComplete = day.completedWorkouts > 0;
          return (
            <div
              className="flex h-full flex-1 flex-col items-center justify-end gap-3"
              key={day.date}
            >
              <div className="flex h-full w-full items-end rounded-t-lg bg-white/[0.035] px-1.5">
                <div
                  aria-label={`${day.dayLabel}: ${day.completedWorkouts} completed workout${day.completedWorkouts === 1 ? "" : "s"}, ${day.totalVolume.toLocaleString("en-US", { maximumFractionDigits: 2 })} kilograms`}
                  className={`w-full rounded-t-md ${isComplete ? "bg-lime-300" : "bg-zinc-700"}`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-zinc-500">
                {day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
