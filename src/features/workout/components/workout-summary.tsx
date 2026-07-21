"use client";

import { Award, CheckCircle2, Clock3, Dumbbell, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWorkoutStore } from "@/features/workout/workout-store";

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function WorkoutSummary() {
  const { resetWorkout, summary } = useWorkoutStore();
  if (!summary) return null;

  const metrics = [
    { icon: Clock3, label: "Duration", value: formatDuration(summary.durationSeconds) },
    { icon: Dumbbell, label: "Completed sets", value: String(summary.completedSets) },
    {
      icon: CheckCircle2,
      label: "Exercises",
      value: String(summary.completedExercises),
    },
    {
      icon: Award,
      label: "Total volume",
      value: `${summary.totalVolume.toLocaleString()} kg`,
    },
  ];

  return (
    <main className="grid min-h-screen place-items-center bg-[#090a0d] px-5 py-8 text-zinc-100">
      <section className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#131419] p-6 text-center sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lime-300 text-zinc-950">
          <CheckCircle2 aria-hidden="true" size={28} strokeWidth={2.5} />
        </span>
        <p className="mt-6 text-xs font-bold tracking-[0.13em] text-lime-300 uppercase">
          Workout complete
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-white">
          Nice work.
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          {summary.workoutDayName} is in the books.
        </p>
        <dl className="mt-7 grid grid-cols-2 gap-3 text-left">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div className="rounded-2xl bg-white/[0.04] p-4" key={label}>
              <dt className="flex items-center gap-2 text-xs text-zinc-500">
                <Icon aria-hidden="true" size={14} />
                {label}
              </dt>
              <dd className="mt-2 text-lg font-bold tracking-[-0.03em] text-white">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 rounded-2xl border border-lime-300/20 bg-lime-300/[0.06] px-4 py-4">
          <p className="text-xs font-bold tracking-[0.13em] text-lime-300 uppercase">
            Earned today
          </p>
          <p className="mt-1 text-2xl font-bold text-white">+{summary.xpEarned} XP</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-left text-xs text-zinc-400">
            <p>
              Base XP{" "}
              <span className="font-semibold text-zinc-200">{summary.baseXp}</span>
            </p>
            <p>
              Streak{" "}
              <span className="font-semibold text-lime-300">
                {summary.streakMultiplier.toFixed(2)}x
              </span>
            </p>
            {summary.goalBonusXp ? (
              <p className="col-span-2 font-semibold text-lime-300">
                Weekly goal bonus +{summary.goalBonusXp} XP
              </p>
            ) : null}
          </div>
        </div>
        <Button className="mt-7 min-h-12 w-full" onClick={resetWorkout}>
          <RotateCcw aria-hidden="true" size={17} />
          Back to workouts
        </Button>
      </section>
    </main>
  );
}
