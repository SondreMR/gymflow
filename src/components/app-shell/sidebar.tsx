"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/app-shell/logo";
import { Navigation } from "@/components/app-shell/navigation";
import { getInitials } from "@/features/profile/profile-utils";
import type { SidebarProfile } from "@/features/profile/types";

type SidebarProps = {
  profile: SidebarProfile;
};

export function Sidebar({ profile }: SidebarProps) {
  const initials = getInitials(profile.displayName);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/[0.08] bg-[#0c0d11] px-5 py-6 lg:flex lg:flex-col">
      <Logo />
      <div className="mt-12">
        <p className="mb-3 px-3 text-[11px] font-bold tracking-[0.14em] text-zinc-600 uppercase">
          Menu
        </p>
        <Navigation variant="desktop" />
      </div>
      <Link
        className="mt-auto flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-lime-300"
        href="/profile"
      >
        <span
          aria-label={`${profile.displayName} avatar`}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-700 text-sm font-bold text-zinc-200"
        >
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-100">
            {profile.displayName}
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500">
            Level {profile.level} · Athlete
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="text-zinc-600" size={17} />
      </Link>
    </aside>
  );
}
