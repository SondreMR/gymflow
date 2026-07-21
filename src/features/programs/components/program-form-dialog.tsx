"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/features/programs/components/dialog";
import type { WorkoutProgram } from "@/features/programs/types";

type ProgramFormDialogProps = {
  onClose: () => void;
  onSubmit: (draft: Pick<WorkoutProgram, "description" | "name">) => void;
  program?: WorkoutProgram;
};

export function ProgramFormDialog({
  onClose,
  onSubmit,
  program,
}: ProgramFormDialogProps) {
  const [name, setName] = useState(program?.name ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [error, setError] = useState("");
  const isEditing = Boolean(program);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give your program a name before continuing.");
      return;
    }
    onSubmit({ name: trimmedName, description: description.trim() });
    onClose();
  }

  return (
    <Dialog
      description="Start with a simple template, then build each workout day."
      onClose={onClose}
      title={isEditing ? "Edit program" : "New program"}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-zinc-200"
            htmlFor="program-name"
          >
            Program name
          </label>
          <input
            aria-describedby={error ? "program-name-error" : undefined}
            autoFocus
            className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-lime-300"
            id="program-name"
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Push Pull Legs"
            value={name}
          />
          {error ? (
            <p className="mt-2 text-sm text-red-300" id="program-name-error">
              {error}
            </p>
          ) : null}
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-zinc-200"
            htmlFor="program-description"
          >
            Description <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <textarea
            className="min-h-24 w-full resize-y rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-lime-300"
            id="program-description"
            maxLength={1000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this program designed to help you achieve?"
            value={description}
          />
        </div>
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit">{isEditing ? "Save changes" : "Create program"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
