import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

type PageHeaderProps = {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
};

export function PageHeader({ actions, eyebrow, title }: PageHeaderProps) {
  const today = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(new Date());
  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-white/[0.08] py-4 sm:min-h-24 sm:py-5">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium text-zinc-500">{eyebrow}</p>
        ) : null}
        <h1 className="text-xl font-bold tracking-[-0.035em] text-white sm:text-2xl">
          {title}
        </h1>
      </div>
      {actions ?? (
        <div className="hidden items-center gap-2 text-sm text-zinc-400 sm:flex">
          <CalendarDays aria-hidden="true" size={17} />
          <span>{today}</span>
        </div>
      )}
    </header>
  );
}
