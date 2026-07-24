import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthCallbackUrl } from "./oauth-redirect";

const fallbackAppUrl = "https://gymflow-90eh.vercel.app";

test("uses localhost as the OAuth callback origin", () => {
  assert.equal(
    buildAuthCallbackUrl({
      browserOrigin: "http://localhost:3000",
      fallbackAppUrl,
      next: "/",
    }),
    "http://localhost:3000/auth/callback?next=%2F",
  );
});

test("uses the production domain as the OAuth callback origin", () => {
  assert.equal(
    buildAuthCallbackUrl({
      browserOrigin: "https://gymflow-90eh.vercel.app",
      fallbackAppUrl,
      next: "/dashboard",
    }),
    "https://gymflow-90eh.vercel.app/auth/callback?next=%2Fdashboard",
  );
});

test("uses the generated Vercel deployment URL as the OAuth callback origin", () => {
  assert.equal(
    buildAuthCallbackUrl({
      browserOrigin: "https://gymflow-90eh-abc123-sondremrs-projects.vercel.app",
      fallbackAppUrl,
      next: "/workout",
    }),
    "https://gymflow-90eh-abc123-sondremrs-projects.vercel.app/auth/callback?next=%2Fworkout",
  );
});

test("preserves a safe next destination", () => {
  assert.equal(
    buildAuthCallbackUrl({
      browserOrigin: "https://gymflow-90eh.vercel.app",
      fallbackAppUrl,
      next: "/workout?session=active",
    }),
    "https://gymflow-90eh.vercel.app/auth/callback?next=%2Fworkout%3Fsession%3Dactive",
  );
});

test("uses NEXT_PUBLIC_APP_URL when a browser origin is unavailable", () => {
  assert.equal(
    buildAuthCallbackUrl({
      fallbackAppUrl: "https://gymflow-90eh.vercel.app/",
      next: "/",
    }),
    "https://gymflow-90eh.vercel.app/auth/callback?next=%2F",
  );
});
