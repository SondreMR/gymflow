import { AppShell } from "@/components/app-shell/app-shell";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";

export default function HomePage() {
  return (
    <AppShell eyebrow="Your training space" title="Dashboard">
      <DashboardOverview />
    </AppShell>
  );
}
