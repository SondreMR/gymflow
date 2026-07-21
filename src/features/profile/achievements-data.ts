import "server-only";

import { TROPHIES } from "@/features/progression/progression";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfileData } from "@/features/profile/data";

export async function getAchievementsData() {
  const user = await getCurrentUser();
  const [profile, unlocked] = await Promise.all([
    getProfileData(),
    prisma.userTrophy.findMany({
      where: { userId: user.id },
      select: { trophyKey: true, unlockedAt: true },
    }),
  ]);
  const unlocks = new Map(
    unlocked.map((trophy) => [trophy.trophyKey, trophy.unlockedAt]),
  );
  return {
    level: profile.level,
    trophies: TROPHIES.map((trophy) => ({
      ...trophy,
      unlockedAt: unlocks.get(trophy.key)?.toISOString(),
    })),
  };
}
