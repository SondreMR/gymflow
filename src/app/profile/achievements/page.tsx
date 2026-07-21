import Link from "next/link";

import { AppShell } from "@/components/app-shell/app-shell";
import { getAchievementsData } from "@/features/profile/achievements-data";
import { AchievementsGrid } from "@/features/profile/components/achievements-grid";

export default async function AchievementsPage() {
  const achievements = await getAchievementsData();
  return (
    <AppShell eyebrow="Long-term milestones" title="Achievements">
      <div className="space-y-6">
        <section className="rounded-2xl border border-white/[0.08] bg-[#111217] p-6 sm:p-8">
          <p className="text-sm text-zinc-400">
            Level {achievements.level.current} · {achievements.level.progressXp} of{" "}
            {achievements.level.xpToNextLevel} XP toward the next level
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full bg-lime-300"
              style={{ width: `${achievements.level.progressPercent}%` }}
            />
          </div>
        </section>
        {/* Trophy presentation and first-unlock reveal are client-side only. */}
        <AchievementsGrid
          level={achievements.level.current}
          trophies={achievements.trophies}
        />
        <Link
          className="inline-flex text-sm font-semibold text-lime-300"
          href="/profile"
        >
          Back to profile
        </Link>
      </div>
    </AppShell>
  );
}
