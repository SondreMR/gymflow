# Architecture

GymFlow is a Next.js App Router application with Supabase Auth, Prisma, and Supabase-hosted PostgreSQL. It is deployed on Vercel from the GitHub `main` branch.

## Request and data flow

```text
Browser
  → Next.js App Router
    → Server Components / Server Actions / route handlers
      → authentication and authorization helpers
        → Prisma
          → Supabase PostgreSQL
```

Client components own local interaction state, forms, dialogs, and workout-entry state. They receive serializable DTOs and invoke Server Actions; they do not import Prisma. Server-only modules (`src/lib/prisma.ts`, `src/lib/auth.ts`, feature data modules, and actions) perform database access and authorization.

## Authentication and sessions

Supabase Auth supports email/password accounts and Google OAuth. The browser uses the Supabase browser client; server rendering and route handlers use the server client with cookies.

1. A user signs in with Google or email/password.
2. Supabase establishes the identity and provides a stable Supabase Auth user ID.
3. `getCurrentUser` verifies that identity server-side and upserts the application `User` by its unique `authUserId`.
4. The resulting Prisma `User.id` is the internal ownership key used by application queries.
5. Session cookies are refreshed and persisted by `src/middleware.ts` and used by server-side Supabase clients on later requests.

Unauthenticated application requests are redirected to `/auth/sign-in`; authenticated visitors to `/auth/*` are redirected to the dashboard. `getCurrentUser` also redirects server-rendered protected work as a defense-in-depth fallback.

### Google OAuth in production

```text
GymFlow
  → Google
    → Supabase OAuth callback
      → GymFlow /auth/callback?code=...
        → exchangeCodeForSession
          → session cookies
            → protected dashboard
```

`signInWithOAuth` constructs `redirectTo` from `NEXT_PUBLIC_APP_URL` and appends `/auth/callback`. The callback route validates the presence of `code`, exchanges it with `exchangeCodeForSession`, writes session cookies, and redirects to a safe in-app destination. Supabase Auth must allow that callback URL.

## Authorization and ownership

The client never supplies a trusted owner ID. Every user-owned query derives its user ID from the verified server-side session. Program, workout history, profile, progress, trophy, and personal-record queries are scoped to that internal ID.

Nested resources are checked through their owning chain: workout days through programs, day exercises through days, session source programs/days/exercises through the current user, and session sets through the session transaction. System exercises (`isSystem`) are readable by all authenticated users; custom exercises are filtered to their owner. This authorization is implemented in application queries and actions; this repository does not document Prisma access as Supabase RLS enforcement.

## Domain boundaries

| Folder                                    | Responsibility                                                        |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `src/features/auth`                       | Sign-in/up UI and sign-out behavior.                                  |
| `src/features/programs`                   | Programs, days, exercise library, program actions, and client store.  |
| `src/features/workout`                    | Active workout state, logging, persistence, history, and summaries.   |
| `src/features/dashboard`                  | Aggregated workout metrics, weekly activity, and recent workouts.     |
| `src/features/profile`                    | Profile settings, sidebar identity, and achievements.                 |
| `src/features/progress` and `progression` | PR queries plus XP, levels, streaks, and trophy rules.                |
| `src/lib`                                 | Server-only Prisma, Supabase server client, and current-user helpers. |
| `src/app`                                 | App Router pages, layouts, and the `/auth/callback` route handler.    |

## Persistence

Prisma models in `prisma/schema.prisma` persist:

- `User`: Supabase mapping (`authUserId`) and profile settings
- `WorkoutProgram`, `WorkoutDay`, and `WorkoutDayExercise`: reusable plans and ordered prescriptions
- `Exercise`: global system exercises and private custom exercises
- `WorkoutSession`, `WorkoutSessionExercise`, and `WorkoutSet`: completed workout snapshots and logged sets
- `UserTrophy`: unlocked achievement keys
- `PersonalRecord`: per-user, per-exercise highest loaded set and its source session

XP breakdown, duration, weekly-goal bonus, and streak multiplier are saved on completed sessions. Dashboard/profile calculations read persisted completed sessions. Trophies are idempotently inserted with a unique user/trophy constraint.

## Reliability safeguards

Workout completion uses a database transaction. A unique `WorkoutSession.clientReference` makes repeated client submissions return the existing completed summary rather than award duplicate XP. Server actions validate input and ownership before mutating. Client dialogs await mutations, prevent duplicate confirmation/submission, preserve inputs after errors, and provide safe user-facing feedback.

## Deployment and configuration

GitHub `main` deploys to Vercel. Vercel runs `npm install`; `postinstall` runs `prisma generate`, producing the intentionally git-ignored custom client at `src/generated/prisma` before `next build` resolves it. Supabase provides both Auth and PostgreSQL.

Required runtime configuration is documented in [`.env.example`](../.env.example). Environment values live outside Git. `DATABASE_URL`, `DIRECT_URL`, service-role keys, and OAuth client secrets are server-only; the Supabase URL and publishable key are intentionally public client configuration.
