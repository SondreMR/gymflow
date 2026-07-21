"use client";

import { ArrowLeft, CalendarDays, Pencil, Plus, Target } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { Button } from "@/components/ui/button";
import { DayFormDialog } from "@/features/programs/components/day-form-dialog";
import { ProgramFormDialog } from "@/features/programs/components/program-form-dialog";
import { WorkoutDayCard } from "@/features/programs/components/workout-day-card";
import { useProgramStore } from "@/features/programs/program-store";

type ProgramEditorProps = { programId: string };

export function ProgramEditor({ programId }: ProgramEditorProps) {
  const { addDay, getProgram, updateProgram } = useProgramStore();
  const [isEditingProgram, setIsEditingProgram] = useState(false);
  const [isAddingDay, setIsAddingDay] = useState(false);
  const program = getProgram(programId);

  if (!program) {
    return (
      <AppShell eyebrow="Programs" title="Program not found">
        <section className="rounded-2xl border border-dashed border-white/[0.12] bg-[#111217] p-8 text-center">
          <h2 className="text-xl font-bold text-white">
            This program is no longer available.
          </h2>
          <Link
            className="mt-4 inline-flex text-sm font-semibold text-lime-300 hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-lime-300"
            href="/programs"
          >
            Return to programs
          </Link>
        </section>
      </AppShell>
    );
  }

  const exerciseCount = program.days.reduce(
    (total, day) => total + day.exercises.length,
    0,
  );

  return (
    <AppShell eyebrow="Program editor" title={program.name}>
      <div className="space-y-7 sm:space-y-9">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-lime-300"
          href="/programs"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          All programs
        </Link>
        <section className="rounded-2xl border border-white/[0.08] bg-[#111217] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-bold tracking-[0.13em] text-lime-300 uppercase">
                Reusable training plan
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-white sm:text-3xl">
                {program.name}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                {program.description ??
                  "Add a description to make this plan easier to recognize."}
              </p>
            </div>
            <Button onClick={() => setIsEditingProgram(true)} variant="secondary">
              <Pencil aria-hidden="true" size={16} />
              Edit program
            </Button>
          </div>
          <dl className="mt-7 grid gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.035] px-4 py-3">
              <dt className="flex items-center gap-2 text-xs text-zinc-500">
                <CalendarDays aria-hidden="true" size={14} />
                Workout days
              </dt>
              <dd className="mt-2 text-xl font-bold text-zinc-100">
                {program.days.length}
              </dd>
            </div>
            <div className="rounded-xl bg-white/[0.035] px-4 py-3">
              <dt className="flex items-center gap-2 text-xs text-zinc-500">
                <Target aria-hidden="true" size={14} />
                Exercises
              </dt>
              <dd className="mt-2 text-xl font-bold text-zinc-100">{exerciseCount}</dd>
            </div>
            <div className="rounded-xl bg-white/[0.035] px-4 py-3">
              <dt className="text-xs text-zinc-500">Last updated</dt>
              <dd className="mt-2 text-sm font-semibold text-zinc-100">
                {program.updatedAt.replace("Updated ", "")}
              </dd>
            </div>
          </dl>
        </section>
        <section aria-labelledby="workout-days-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.13em] text-zinc-500 uppercase">
                Template structure
              </p>
              <h2
                className="mt-1 text-xl font-bold tracking-[-0.035em] text-white"
                id="workout-days-heading"
              >
                Workout days
              </h2>
            </div>
            <Button onClick={() => setIsAddingDay(true)}>
              <Plus aria-hidden="true" size={17} />
              Add day
            </Button>
          </div>
          <div className="space-y-4">
            {program.days.length ? (
              program.days.map((day) => (
                <WorkoutDayCard day={day} key={day.id} programId={program.id} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#111217] p-8 text-center">
                <h3 className="font-bold text-white">Add your first workout day</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Start with Push, Pull, Legs, or any routine that fits your training.
                </p>
                <Button className="mt-5" onClick={() => setIsAddingDay(true)}>
                  <Plus aria-hidden="true" size={17} />
                  Add workout day
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
      {isEditingProgram ? (
        <ProgramFormDialog
          onClose={() => setIsEditingProgram(false)}
          onSubmit={(draft) => updateProgram(program.id, draft)}
          program={program}
        />
      ) : null}
      {isAddingDay ? (
        <DayFormDialog
          onClose={() => setIsAddingDay(false)}
          onSubmit={(name) => addDay(program.id, name)}
          title="Add workout day"
        />
      ) : null}
    </AppShell>
  );
}
