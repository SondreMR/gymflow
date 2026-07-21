"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { SidebarProfile } from "@/features/profile/types";

const AppShellProfileContext = createContext<SidebarProfile | null>(null);

export function AppShellProfileProvider({
  children,
  profile,
}: {
  children: ReactNode;
  profile: SidebarProfile;
}) {
  return (
    <AppShellProfileContext.Provider value={profile}>
      {children}
    </AppShellProfileContext.Provider>
  );
}

export function useAppShellProfile() {
  const profile = useContext(AppShellProfileContext);
  if (!profile) throw new Error("useAppShellProfile must be used within its provider.");
  return profile;
}
