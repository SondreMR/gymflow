"use client";

import { Pause } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [seconds, setSeconds] = useState(() =>
    Math.floor((Date.now() - startedAt) / 1000),
  );

  useEffect(() => {
    const interval = window.setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [startedAt]);

  return (
    <time className="text-xl font-bold tracking-[-0.03em] text-white tabular-nums">
      {formatDuration(seconds)}
    </time>
  );
}

export function RestTimer({
  onReset,
  startedAt,
}: {
  onReset: () => void;
  startedAt: number | null;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;
  const seconds = Math.floor((now - startedAt) / 1000);

  return (
    <aside
      aria-label="Rest timer"
      className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-lime-300/30 bg-[#17191b] p-3 shadow-xl"
    >
      <div>
        <p className="text-xs font-bold tracking-[0.12em] text-lime-300 uppercase">
          Rest timer
        </p>
        <p className="mt-0.5 text-lg font-bold text-white tabular-nums">
          {formatDuration(seconds)}
        </p>
      </div>
      <Button className="min-h-11 px-3" onClick={onReset} variant="secondary">
        <Pause aria-hidden="true" size={16} />
        Stop
      </Button>
    </aside>
  );
}
