"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { TrophyArt } from "@/features/profile/components/trophy-art";

type Trophy = {
  key: string;
  level: number;
  name: string;
  rarity: string;
  unlockedAt?: string;
};

export function AchievementsGrid({
  level,
  trophies,
}: {
  level: number;
  trophies: Trophy[];
}) {
  const [revealed, setRevealed] = useState<Trophy>();
  const [isHovered, setIsHovered] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  function dismiss() {
    setRevealed(undefined);
  }
  useEffect(() => {
    const known = new Set(
      JSON.parse(window.localStorage.getItem("gymflow-trophies") ?? "[]"),
    );
    const newest = trophies.find(
      (trophy) => trophy.unlockedAt && !known.has(trophy.key),
    );
    window.localStorage.setItem(
      "gymflow-trophies",
      JSON.stringify(
        trophies.filter((trophy) => trophy.unlockedAt).map((trophy) => trophy.key),
      ),
    );
    if (!newest) return;
    setRevealed(newest);
  }, [trophies]);

  useEffect(() => {
    if (!revealed || isHovered) return;
    const timer = window.setTimeout(dismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [isHovered, revealed]);

  useEffect(() => {
    if (!revealed) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [revealed]);
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {trophies.map((trophy) => {
          const unlocked = Boolean(trophy.unlockedAt);
          return (
            <article
              className={`overflow-hidden rounded-2xl border p-5 ${unlocked ? "trophy-card-unlocked border-lime-300/30 bg-lime-300/[0.06]" : "trophy-card-locked border-white/[0.08] bg-[#111217]"}`}
              key={trophy.key}
            >
              <TrophyArt trophyKey={trophy.key} unlocked={unlocked} />
              <p className="text-xs font-bold tracking-[0.13em] text-zinc-500 uppercase">
                Level {trophy.level} · {unlocked ? trophy.rarity : "Unknown rarity"}
              </p>
              <h2
                className={`mt-2 text-lg font-bold ${unlocked ? "text-lime-100" : "text-zinc-400"}`}
              >
                {unlocked ? trophy.name : "Classified trophy"}
              </h2>
              <p className="mt-3 text-sm text-zinc-500">
                {unlocked
                  ? `Unlocked ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(trophy.unlockedAt!))}`
                  : level >= trophy.level
                    ? "Achievement awaiting verification"
                    : "Its material and title reveal at the required level."}
              </p>
            </article>
          );
        })}
      </section>
      {revealed ? (
        <div
          className="trophy-celebration fixed inset-0 z-50 grid place-items-center bg-[#060708]/90 p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) dismiss();
          }}
        >
          <div
            aria-labelledby="trophy-unlock-title"
            aria-modal="true"
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-lime-300/40 bg-[#101316] p-8 text-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <button
              aria-label="Close trophy celebration"
              className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-lime-300"
              onClick={dismiss}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
            <span className="trophy-particle trophy-particle-one" />
            <span className="trophy-particle trophy-particle-two" />
            <span className="trophy-particle trophy-particle-three" />
            <TrophyArt trophyKey={revealed.key} unlocked />
            <p className="mt-2 text-xs font-bold tracking-[0.16em] text-lime-300 uppercase">
              Trophy unlocked
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white" id="trophy-unlock-title">
              {revealed.name}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {revealed.rarity} · Level {revealed.level}
            </p>
            <button
              className="mt-7 min-h-11 rounded-xl bg-lime-300 px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
              onClick={dismiss}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
