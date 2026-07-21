import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export class AuthenticationError extends Error {
  constructor() {
    super("Please sign in to continue.");
  }
}

function defaultName(email?: string) {
  return email?.split("@")[0]?.slice(0, 80) || "GymFlow Athlete";
}

/** Returns the internal user only after verifying the Supabase session server-side. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");
  return prisma.user.upsert({
    where: { authUserId: user.id },
    update: {},
    create: {
      authUserId: user.id,
      displayName:
        (typeof user.user_metadata.full_name === "string" &&
          user.user_metadata.full_name.slice(0, 80)) ||
        defaultName(user.email),
      avatarUrl:
        typeof user.user_metadata.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
    },
  });
});

export async function getOptionalAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
