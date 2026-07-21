"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type DialogProps = {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  title: string;
};

export function Dialog({ children, description, onClose, title }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 sm:items-center sm:justify-center sm:p-6">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        aria-describedby={description ? "dialog-description" : undefined}
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-white/[0.1] bg-[#14151a] p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl font-bold tracking-[-0.035em] text-white"
              id="dialog-title"
            >
              {title}
            </h2>
            {description ? (
              <p
                className="mt-1.5 text-sm leading-6 text-zinc-400"
                id="dialog-description"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Close dialog"
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-lime-300"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
