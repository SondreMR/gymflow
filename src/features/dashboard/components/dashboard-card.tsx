import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type DashboardCardProps = {
  children: ReactNode;
  icon: LucideIcon;
  label: string;
};

export function DashboardCard({ children, icon: Icon, label }: DashboardCardProps) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#111217] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        <span className="grid size-9 place-items-center rounded-xl bg-white/[0.05] text-lime-300">
          <Icon aria-hidden="true" size={18} />
        </span>
      </div>
      {children}
    </article>
  );
}
