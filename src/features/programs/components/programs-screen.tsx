"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/features/programs/components/program-card";
import { ProgramFormDialog } from "@/features/programs/components/program-form-dialog";
import { ProgramsEmptyState } from "@/features/programs/components/programs-empty-state";
import { useProgramStore } from "@/features/programs/program-store";

export function NewProgramButton() {
  const { createProgram } = useProgramStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button className="px-3 sm:px-4" onClick={() => setIsOpen(true)}>
        <Plus aria-hidden="true" size={17} />
        <span className="hidden sm:inline">New program</span>
        <span className="sm:hidden">New</span>
      </Button>
      {isOpen ? (
        <ProgramFormDialog onClose={() => setIsOpen(false)} onSubmit={createProgram} />
      ) : null}
    </>
  );
}

export function ProgramsScreen() {
  const { createProgram, programs } = useProgramStore();
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-7 sm:space-y-9">
      <section className="max-w-2xl">
        <p className="text-xs font-bold tracking-[0.13em] text-lime-300 uppercase">
          Training library
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-white sm:text-3xl">
          Programs built around your rhythm.
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400 sm:text-base">
          Create reusable training plans, then make adjustments without losing your
          flow.
        </p>
      </section>
      {programs.length ? (
        <section
          aria-label="Your workout programs"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </section>
      ) : (
        <ProgramsEmptyState onCreate={() => setIsCreating(true)} />
      )}
      {isCreating ? (
        <ProgramFormDialog
          onClose={() => setIsCreating(false)}
          onSubmit={createProgram}
        />
      ) : null}
    </div>
  );
}
