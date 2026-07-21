"use client";

import { Copy, Dumbbell, Pencil, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/features/programs/components/confirm-dialog";
import { ProgramFormDialog } from "@/features/programs/components/program-form-dialog";
import { useProgramStore } from "@/features/programs/program-store";
import type { WorkoutProgram } from "@/features/programs/types";

type ProgramCardProps = { program: WorkoutProgram };

export function ProgramCard({ program }: ProgramCardProps) {
  const { deleteProgram, duplicateProgram, updateProgram } = useProgramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const exerciseCount = program.days.reduce(
    (total, day) => total + day.exercises.length,
    0,
  );

  return (
    <article className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#111217] p-5 transition-colors hover:border-white/[0.16] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-10 place-items-center rounded-xl bg-lime-300 text-zinc-950">
          <Dumbbell aria-hidden="true" size={19} strokeWidth={2.5} />
        </span>
        <p className="text-xs font-medium text-zinc-500">{program.updatedAt}</p>
      </div>
      <div className="mt-6 flex-1">
        <h2 className="text-xl font-bold tracking-[-0.035em] text-white">
          {program.name}
        </h2>
        <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-400">
          {program.description ??
            "A flexible training plan ready for your next workout."}
        </p>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3 border-y border-white/[0.08] py-4">
        <div>
          <dt className="text-xs text-zinc-500">Workout days</dt>
          <dd className="mt-1 text-lg font-bold text-zinc-100">
            {program.days.length}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Exercises</dt>
          <dd className="mt-1 text-lg font-bold text-zinc-100">{exerciseCount}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime-300 px-3 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200"
          href={`/programs/${program.id}`}
        >
          Open <SquareArrowOutUpRight aria-hidden="true" size={16} />
        </Link>
        <Button
          aria-label={`Edit ${program.name}`}
          className="px-3"
          onClick={() => setIsEditing(true)}
          variant="secondary"
        >
          <Pencil aria-hidden="true" size={16} />
        </Button>
        <Button
          aria-label={`Duplicate ${program.name}`}
          className="px-3"
          onClick={() => duplicateProgram(program.id)}
          variant="secondary"
        >
          <Copy aria-hidden="true" size={16} />
        </Button>
        <Button
          aria-label={`Delete ${program.name}`}
          className="px-3 text-zinc-400 hover:text-red-300"
          onClick={() => setIsDeleting(true)}
          variant="ghost"
        >
          <Trash2 aria-hidden="true" size={16} />
        </Button>
      </div>
      {isEditing ? (
        <ProgramFormDialog
          onClose={() => setIsEditing(false)}
          onSubmit={(draft) => updateProgram(program.id, draft)}
          program={program}
        />
      ) : null}
      {isDeleting ? (
        <ConfirmDialog
          confirmLabel="Delete program"
          description={`Delete ${program.name}? Its workout days will be removed from your account.`}
          onClose={() => setIsDeleting(false)}
          onConfirm={() => deleteProgram(program.id)}
          title="Delete program"
        />
      ) : null}
    </article>
  );
}
