import "server-only";

import { PROGRAM_OWNER_ID } from "@/features/programs/data";
import { prisma } from "@/lib/prisma";

export async function getPersonalRecords() {
  return prisma.personalRecord.findMany({
    where: { userId: PROGRAM_OWNER_ID },
    orderBy: { achievedAt: "desc" },
    include: { exercise: { select: { name: true } } },
  });
}
