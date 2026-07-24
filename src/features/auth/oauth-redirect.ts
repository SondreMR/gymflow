function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, "");
}

export function buildAuthCallbackUrl({
  browserOrigin,
  fallbackAppUrl,
  next,
}: {
  browserOrigin?: string;
  fallbackAppUrl: string;
  next: string;
}) {
  const origin = normalizeOrigin(browserOrigin || fallbackAppUrl);
  const safeNext = next.startsWith("/") ? next : "/";

  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
