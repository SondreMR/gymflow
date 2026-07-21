import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const legacyUserId = "gymflow-prototype-owner";
const authUserId = process.argv[2];
if (!authUserId)
  throw new Error(
    "Usage: npm exec tsx scripts/assign-prototype-data.ts <supabase-auth-user-id>",
  );
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const target = await prisma.user.findUnique({ where: { authUserId } });
if (!target)
  throw new Error(
    "No GymFlow user exists for that Supabase Auth ID. Sign in once first.",
  );
await prisma.$transaction(async (tx) => {
  const legacy = await tx.user.findUnique({ where: { id: legacyUserId } });
  if (!legacy) throw new Error("Prototype user was not found.");
  await tx.workoutProgram.updateMany({
    where: { userId: legacyUserId },
    data: { userId: target.id },
  });
  await tx.workoutSession.updateMany({
    where: { userId: legacyUserId },
    data: { userId: target.id },
  });
  await tx.exercise.updateMany({
    where: { userId: legacyUserId, isSystem: false },
    data: { userId: target.id },
  });
  await tx.personalRecord.updateMany({
    where: { userId: legacyUserId },
    data: { userId: target.id },
  });
  await tx.userTrophy.updateMany({
    where: { userId: legacyUserId },
    data: { userId: target.id },
  });
  await tx.user.delete({ where: { id: legacyUserId } });
});
await prisma.$disconnect();
