import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { totalXpRequiredForLevel } from "../src/features/progression/progression";

const PROTOTYPE_USER_ID = "gymflow-prototype-owner";
const TARGET_XP = totalXpRequiredForLevel(100);

async function main() {
  const sessions = await prisma.workoutSession.findMany({
    where: { status: "COMPLETED", userId: PROTOTYPE_USER_ID },
    orderBy: { completedAt: "desc" },
    select: { baseXp: true, earnedXp: true, id: true },
  });
  if (!sessions.length)
    throw new Error("Prototype user has no completed workout to adjust.");

  const currentXp = sessions.reduce((total, session) => total + session.earnedXp, 0);
  const adjustment = Math.max(0, TARGET_XP - currentXp);
  if (!adjustment) return;

  const session = sessions[0];
  await prisma.$transaction([
    prisma.workoutSession.update({
      where: { id: session.id },
      data: {
        baseXp: session.baseXp + adjustment,
        earnedXp: session.earnedXp + adjustment,
        goalBonusXp: 0,
        note: "Temporary Level 100 UI preview adjustment for the prototype user.",
        streakMultiplier: 1,
      },
    }),
    prisma.userTrophy.createMany({
      data: [
        "rookie-lifter",
        "consistent-athlete",
        "iron-regular",
        "strength-builder",
        "gym-veteran",
        "elite-athlete",
        "gymflow-legend",
      ].map((trophyKey) => ({ userId: PROTOTYPE_USER_ID, trophyKey })),
      skipDuplicates: true,
    }),
  ]);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
