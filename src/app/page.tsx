import { AppShell } from "@/components/app-shell/app-shell";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getDashboardData } from "@/features/dashboard/data";

export default async function HomePage() {
  const dashboard = await getDashboardData();

  return (
    <AppShell eyebrow="Your training space" title="Dashboard">
      <DashboardOverview dashboard={dashboard} />
    </AppShell>
  );
}
