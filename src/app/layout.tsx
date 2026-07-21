import type { Metadata } from "next";
import type { ReactNode } from "react";

import { env } from "@/config/env";
import { getProgramBootstrap } from "@/features/programs/data";
import { ProgramStoreProvider } from "@/features/programs/program-store";
import { WorkoutStoreProvider } from "@/features/workout/workout-store";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_APP_NAME,
  description: "GymFlow fitness tracking application.",
};

export const dynamic = "force-dynamic";

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const { exercises, programs } = await getProgramBootstrap();

  return (
    <html lang="en">
      <body>
        <ProgramStoreProvider initialExercises={exercises} initialPrograms={programs}>
          <WorkoutStoreProvider>{children}</WorkoutStoreProvider>
        </ProgramStoreProvider>
      </body>
    </html>
  );
}
