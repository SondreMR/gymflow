import { Construction } from "lucide-react";

import { AppShell } from "@/components/app-shell/app-shell";

type PlaceholderPageProps = {
  description: string;
  title: string;
};

export function PlaceholderPage({ description, title }: PlaceholderPageProps) {
  return (
    <AppShell eyebrow="GymFlow" title={title}>
      <section className="grid min-h-[50vh] place-items-center rounded-2xl border border-dashed border-white/[0.12] bg-[#111217] p-8 text-center">
        <div>
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/[0.05] text-lime-300">
            <Construction aria-hidden="true" size={22} />
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-[-0.04em] text-white">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-400">
            {description}
          </p>
        </div>
      </section>
    </AppShell>
  );
}
