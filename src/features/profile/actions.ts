"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ProfileUpdate = {
  displayName: string;
  preferredWeightUnit: "KG" | "LB";
  weeklyWorkoutGoal: number;
};

function normalizeDisplayName(value: string) {
  const displayName = value.trim();
  if (!displayName) throw new Error("Display name is required.");
  if (displayName.length > 80) {
    throw new Error("Display name must be 80 characters or fewer.");
  }
  return displayName;
}

export async function updateProfileAction(update: ProfileUpdate) {
  const user = await getCurrentUser();
  if (!Number.isInteger(update.weeklyWorkoutGoal)) {
    throw new Error("Weekly workout goal must be a whole number.");
  }
  if (update.weeklyWorkoutGoal < 1 || update.weeklyWorkoutGoal > 14) {
    throw new Error("Weekly workout goal must be between 1 and 14.");
  }
  if (update.preferredWeightUnit !== "KG" && update.preferredWeightUnit !== "LB") {
    throw new Error("Choose kilograms or pounds as your preferred unit.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: normalizeDisplayName(update.displayName),
      preferredWeightUnit: update.preferredWeightUnit,
      weeklyWorkoutGoal: update.weeklyWorkoutGoal,
    },
  });
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/workout");
}
