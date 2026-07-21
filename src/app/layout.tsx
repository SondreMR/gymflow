import type { Metadata } from "next";
import type { ReactNode } from "react";

import { env } from "@/config/env";
import { ProgramStoreProvider } from "@/features/programs/program-store";
import { WorkoutStoreProvider } from "@/features/workout/workout-store";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_APP_NAME,
  description: "GymFlow fitness tracking application.",
};

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <ProgramStoreProvider>
          <WorkoutStoreProvider>{children}</WorkoutStoreProvider>
        </ProgramStoreProvider>
      </body>
    </html>
  );
}
