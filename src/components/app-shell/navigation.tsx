"use client";

import {
  ChartNoAxesCombined,
  Dumbbell,
  LayoutDashboard,
  UserRound,
  Waypoints,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const navigationItems: NavigationItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/workout", icon: Dumbbell, label: "Workout" },
  { href: "/programs", icon: Waypoints, label: "Programs" },
  { href: "/progress", icon: ChartNoAxesCombined, label: "Progress" },
  { href: "/profile", icon: UserRound, label: "Profile" },
];

function isActiveRoute(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

type NavigationProps = {
  variant: "desktop" | "mobile";
};

export function Navigation({ variant }: NavigationProps) {
  const pathname = usePathname();
  const isDesktop = variant === "desktop";

  return (
    <nav aria-label="Primary navigation">
      <ul className={isDesktop ? "space-y-1" : "grid grid-cols-5"}>
        {navigationItems.map(({ href, icon: Icon, label }) => {
          const isActive = isActiveRoute(pathname, href);

          return (
            <li key={href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={
                  isDesktop
                    ? `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-lime-300 ${
                        isActive
                          ? "bg-lime-300 text-zinc-950"
                          : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
                      }`
                    : `flex flex-col items-center gap-1.5 py-2 text-[10px] font-semibold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-lime-300 ${
                        isActive ? "text-lime-300" : "text-zinc-500 hover:text-zinc-300"
                      }`
                }
                href={href}
              >
                <Icon
                  aria-hidden="true"
                  size={isDesktop ? 19 : 20}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
