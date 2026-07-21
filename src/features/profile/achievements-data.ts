import "server-only";

import { TROPHIES } from "@/features/progression/progression";
import { ensureProgramOwner, PROGRAM_OWNER_ID } from "@/features/programs/data";
import { prisma } from "@/lib/prisma";
import { getProfileData } from "@/features/profile/data";

export async function getAchievementsData() {
  await ensureProgramOwner();
  const [profile, unlocked] = await Promise.all([
    getProfileData(),
    prisma.userTrophy.findMany({
      where: { userId: PROGRAM_OWNER_ID },
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
