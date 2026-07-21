import { FolderPlus } from "lucide-react";

type ProgramsEmptyStateProps = { onCreate: () => void };

export function ProgramsEmptyState({ onCreate }: ProgramsEmptyStateProps) {
  return (
    <section className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/[0.14] bg-[#111217] p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/[0.05] text-lime-300">
          <FolderPlus aria-hidden="true" size={22} />
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-[-0.035em] text-white">
          Build your first program
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-400">
          Create a reusable plan, add workout days, and make every session easier to
          start.
        </p>
        <button
          className="mt-5 rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200"
          onClick={onCreate}
          type="button"
        >
          Create program
        </button>
      </div>
    </section>
  );
}
