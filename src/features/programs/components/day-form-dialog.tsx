"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/features/programs/components/dialog";

type DayFormDialogProps = {
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
  title: string;
};

export function DayFormDialog({
  initialName = "",
  onClose,
  onSubmit,
  title,
}: DayFormDialogProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Workout day name is required.");
      return;
    }
    onSubmit(trimmedName);
    onClose();
  }

  return (
    <Dialog onClose={onClose} title={title}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-zinc-200"
            htmlFor="workout-day-name"
          >
            Workout day name
          </label>
          <input
            aria-describedby={error ? "workout-day-error" : undefined}
            autoFocus
            className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-lime-300"
            id="workout-day-name"
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Push"
            value={name}
          />
          {error ? (
            <p className="mt-2 text-sm text-red-300" id="workout-day-error">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit">Save workout day</Button>
        </div>
      </form>
    </Dialog>
  );
}
