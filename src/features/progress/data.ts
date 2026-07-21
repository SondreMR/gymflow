import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getPersonalRecords() {
  const user = await getCurrentUser();
  return prisma.personalRecord.findMany({
    where: { userId: user.id },
    orderBy: { achievedAt: "desc" },
    include: { exercise: { select: { name: true } } },
  });
}
