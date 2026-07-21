import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShellProfileProvider } from "@/components/app-shell/app-shell-profile-provider";
import { env } from "@/config/env";
import { getProgramBootstrap } from "@/features/programs/data";
import { ProgramStoreProvider } from "@/features/programs/program-store";
import { getSidebarProfile } from "@/features/profile/data";
import { getOptionalAuthUser } from "@/lib/auth";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_APP_NAME,
  description: "GymFlow fitness tracking application.",
};

export const dynamic = "force-dynamic";

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const authUser = await getOptionalAuthUser();
  if (!authUser) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }
  const [{ exercises, programs }, sidebarProfile] = await Promise.all([
    getProgramBootstrap(),
    getSidebarProfile(),
  ]);

  return (
    <html lang="en">
      <body>
        <ProgramStoreProvider initialExercises={exercises} initialPrograms={programs}>
          <AppShellProfileProvider profile={sidebarProfile}>
            {children}
          </AppShellProfileProvider>
        </ProgramStoreProvider>
      </body>
    </html>
  );
}
