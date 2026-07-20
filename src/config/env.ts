const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "GymFlow";
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

/** Centralized access to public runtime configuration. */
export const env = {
  NEXT_PUBLIC_APP_NAME: appName,
  NEXT_PUBLIC_APP_URL: appUrl,
} as const;
