import type { ReactNode } from "react";

import { MobileNavigation } from "@/components/app-shell/mobile-navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { Sidebar } from "@/components/app-shell/sidebar";

type AppShellProps = {
  actions?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  title: string;
};

export function AppShell({ actions, children, eyebrow, title }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#090a0d]">
      <Sidebar />
      <main className="min-h-screen pb-24 lg:pb-0 lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <PageHeader actions={actions} eyebrow={eyebrow} title={title} />
          <div className="py-7 sm:py-9">{children}</div>
        </div>
      </main>
      <MobileNavigation />
    </div>
  );
}
