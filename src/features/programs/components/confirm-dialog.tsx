"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/features/programs/components/dialog";

type ConfirmDialogProps = {
  confirmLabel: string;
  description: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
};

export function ConfirmDialog({
  confirmLabel,
  description,
  onClose,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  async function confirm() {
    setError("");
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setError("We could not complete that action. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <Dialog description={description} onClose={onClose} title={title}>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <Button disabled={isConfirming} onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button
          className="bg-red-400 text-zinc-950 hover:bg-red-300 focus-visible:outline-red-300"
          disabled={isConfirming}
          onClick={confirm}
        >
          {isConfirming ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
