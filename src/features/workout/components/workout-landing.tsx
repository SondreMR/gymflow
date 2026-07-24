"use client";

import { Dumbbell, Play, Zap } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell/app-shell";
import { Button } from "@/components/ui/button";
import { useProgramStore } from "@/features/programs/program-store";
import { WorkoutHistory } from "@/features/workout/components/workout-history";
import { useWorkoutStore } from "@/features/workout/workout-store";

export function WorkoutLanding() {
  const { programs } = useProgramStore();
  const { isStarting, startQuickWorkout, startWorkout } = useWorkoutStore();
  const programsWithDays = programs.filter((program) => program.days.length > 0);

  return (
    <AppShell eyebrow="Training session" title="Workout">
      <div className="space-y-7 sm:space-y-9">
        <section className="rounded-2xl border border-white/[0.08] bg-[#111217] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.13em] text-lime-300 uppercase">
                Ready when you are
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">
                Start a workout
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
                Choose a workout day from one of your programs, or begin an empty
                session and build as you go.
              </p>
            </div>
            <Button
              className="min-h-12 shrink-0"
              disabled={isStarting}
              onClick={startQuickWorkout}
            >
              <Zap aria-hidden="true" size={17} />
              {isStarting ? "Starting workout…" : "Quick workout"}
            </Button>
          </div>
        </section>
        {programsWithDays.length ? (
          <section aria-labelledby="program-workouts-heading">
            <div className="mb-4">
              <p className="text-xs font-bold tracking-[0.13em] text-zinc-500 uppercase">
                Your plans
              </p>
              <h2
                className="mt-1 text-xl font-bold tracking-[-0.035em] text-white"
                id="program-workouts-heading"
              >
                Choose a workout day
              </h2>
            </div>
            <div className="space-y-4">
              {programsWithDays.map((program) => (
                <article
                  className="rounded-2xl border border-white/[0.08] bg-[#111217] p-5 sm:p-6"
                  key={program.id}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-white/[0.05] text-lime-300">
                      <Dumbbell aria-hidden="true" size={19} />
                    </span>
                    <div>
                      <h3 className="font-bold tracking-[-0.02em] text-white">
                        {program.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {program.description ??
                          `${program.days.length} workout days ready to go.`}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-5 divide-y divide-white/[0.08]">
                    {program.days.map((day) => (
                      <li
                        className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        key={day.id}
                      >
                        <div>
                          <p className="font-semibold text-zinc-100">{day.name}</p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {day.exercises.length} exercises
                          </p>
                        </div>
                        <Button
                          className="min-h-11 w-full sm:w-auto"
                          disabled={!day.exercises.length}
                          onClick={() => startWorkout(program, day)}
                        >
                          {day.exercises.length ? (
                            <>
                              <Play aria-hidden="true" fill="currentColor" size={15} />
                              Start workout
                            </>
                          ) : (
                            "No exercises yet"
                          )}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/[0.12] bg-[#111217] p-8 text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/[0.05] text-lime-300">
                <Dumbbell aria-hidden="true" size={22} />
              </span>
              <h2 className="mt-5 text-xl font-bold text-white">
                Build a program first
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-400">
                Add a workout day and a few exercises to start structured sessions from
                GymFlow.
              </p>
              <Link
                className="mt-5 inline-flex rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200"
                href="/programs"
              >
                Go to programs
              </Link>
            </div>
          </section>
        )}
        <WorkoutHistory />
      </div>
    </AppShell>
  );
}
