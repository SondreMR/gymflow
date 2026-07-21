# GymFlow

GymFlow is a fitness tracking app built with Next.js, Supabase Auth, PostgreSQL, and Prisma.

## Technology

- Next.js 15 with the App Router and React 19
- TypeScript in strict mode
- Tailwind CSS 4 for styling primitives
- ESLint with Next.js Core Web Vitals and TypeScript rules
- Prettier, including deterministic Tailwind class sorting
- GitHub Actions for formatting, linting, and type-checking on every pull request

## Getting started

### Prerequisites

- Node.js 20.9 or newer (Node 22 is used in CI)
- npm 10 or newer

### Install and run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` and sign in to access your training space.

## Scripts

| Command                | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start the local development server.         |
| `npm run build`        | Create an optimized production build.       |
| `npm run start`        | Serve the production build.                 |
| `npm run lint`         | Run ESLint.                                 |
| `npm run lint:fix`     | Apply safe ESLint fixes.                    |
| `npm run format`       | Format repository files with Prettier.      |
| `npm run format:check` | Verify formatting without modifying files.  |
| `npm run typecheck`    | Validate TypeScript without emitting files. |

## Project structure

```text
src/
  app/          App Router routes, layouts, and route-local UI
  components/   Shared, reusable presentation components
  config/       Typed application configuration and environment access
  features/     Feature modules, added only when a capability is introduced
  lib/          Framework-agnostic utilities and service clients
  styles/       Global styles and Tailwind entry point
  types/        Shared TypeScript types
docs/           Living architecture and product-planning documents
.github/        Continuous-integration workflows
```

The `src/` boundary prevents source code from mixing with configuration and repository assets. Use `@/` for imports from `src` (for example, `@/components/button`). Keep a feature's UI, logic, and types together under `src/features/<feature>` once it exists; promote code to `components`, `lib`, or `types` only when it is truly shared.

## Environment variables

Copy `.env.example` to `.env.local` for local development. The public environment variables currently provided are:

| Variable                               | Description                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_NAME`                 | Application name used in metadata.                                                  |
| `NEXT_PUBLIC_APP_URL`                  | Canonical local/deployment URL.                                                     |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL.                                                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable/anon key.                                         |
| `DATABASE_URL`                         | Server-only Prisma database connection.                                             |
| `DIRECT_URL`                           | Direct database connection for Prisma CLI.                                          |
| `SUPABASE_SERVICE_ROLE_KEY`            | Optional server-only administrative key; not required by normal app authentication. |

Variables prefixed with `NEXT_PUBLIC_` are safe to expose to browser code and are embedded at build time. Never place secrets behind this prefix or commit `.env.local`. When server infrastructure is introduced, add its private environment contract separately and validate it at startup.

## Quality gates

GitHub Actions runs formatting validation, linting, and type-checking for pushes to `main` and pull requests. Run the same commands locally before opening a pull request.

## Documentation

- [Architecture](docs/architecture.md) explains the boundaries and technical decisions.
- [Roadmap](docs/roadmap.md) outlines the deliberately staged path from this foundation to product delivery.

# Authentication and legacy data

GymFlow uses Supabase Auth (email/password and Google PKCE OAuth). Configure the Supabase URL, publishable key, database URL, and redirect URL (`http://localhost:3000/auth/callback` locally) before running. Every authenticated Supabase `user.id` is mapped once to `User.authUserId`; all application queries derive the internal user ID server-side.

Existing prototype data remains intact on `gymflow-prototype-owner` after the migration. To assign it deliberately, sign in once with the intended account, then run `npm exec tsx scripts/assign-prototype-data.ts <supabase-auth-user-id>`. This moves programs, sessions, custom exercises, PRs, and trophies transactionally.
