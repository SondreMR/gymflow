"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/features/programs/components/dialog";

type ConfirmDialogProps = {
  confirmLabel: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({
  confirmLabel,
  description,
  onClose,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  return (
    <Dialog description={description} onClose={onClose} title={title}>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button
          className="bg-red-400 text-zinc-950 hover:bg-red-300 focus-visible:outline-red-300"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
