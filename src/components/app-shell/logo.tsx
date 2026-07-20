import { Dumbbell } from "lucide-react";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      aria-label="GymFlow dashboard"
      className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
      href="/"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-zinc-950">
        <Dumbbell aria-hidden="true" size={19} strokeWidth={2.5} />
      </span>
      <span className="text-lg font-bold tracking-[-0.045em] text-white">
        Gym<span className="text-lime-300">Flow</span>
      </span>
    </Link>
  );
}
