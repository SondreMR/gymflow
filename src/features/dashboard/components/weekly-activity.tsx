const activity = [
  { day: "Mon", height: "h-[38%]", isComplete: true },
  { day: "Tue", height: "h-[66%]", isComplete: true },
  { day: "Wed", height: "h-[52%]", isComplete: true },
  { day: "Thu", height: "h-[24%]", isComplete: false },
  { day: "Fri", height: "h-[82%]", isComplete: true },
  { day: "Sat", height: "h-[18%]", isComplete: false },
  { day: "Sun", height: "h-[46%]", isComplete: false },
];

export function WeeklyActivity() {
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
        <p className="mt-1 text-sm text-zinc-500">4 of 5 planned sessions completed</p>
      </div>
      <div
        aria-label="Weekly workout activity"
        className="flex h-44 items-end justify-between gap-2 sm:gap-3"
        role="img"
      >
        {activity.map(({ day, height, isComplete }) => (
          <div
            className="flex h-full flex-1 flex-col items-center justify-end gap-3"
            key={day}
          >
            <div className="flex h-full w-full items-end rounded-t-lg bg-white/[0.035] px-1.5">
              <div
                className={`w-full rounded-t-md ${height} ${isComplete ? "bg-lime-300" : "bg-zinc-700"}`}
              />
            </div>
            <span className="text-[11px] font-medium text-zinc-500">{day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
