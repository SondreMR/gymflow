# Roadmap

This roadmap intentionally separates foundational work from product implementation. No later phase is implied to be approved by the current codebase.

## Phase 0 — Foundation (complete)

- Next.js 15, React 19, TypeScript, and Tailwind CSS configured
- Scalable `src/` layout and `@/` absolute imports established
- Environment-file conventions and public configuration entry point added
- ESLint, Prettier, and GitHub Actions quality checks configured
- Architecture and delivery roadmap documented

## Phase 1 — Product discovery (not started)

- Define supported training workflows and core terminology
- Establish accessibility, responsive-design, privacy, and performance requirements
- Identify analytics and data-retention expectations
- Convert decisions into small, prioritised product slices

## Phase 2 — Application capabilities (not started)

- Introduce route and feature modules only after product-slice approval
- Establish a component and design-token system as repeated UI patterns emerge
- Add automated tests alongside the first behavior with acceptance criteria

## Phase 3 — Platform services (not started)

- Select and document authentication only when account requirements are defined
- Select and document persistence only when data ownership and retention are defined
- Add server-only environment validation, observability, and deployment configuration

## Phase 4 — Operational maturity (not started)

- Expand CI with tests and production-build verification
- Add release, incident-response, dependency-update, and security-review practices
- Define performance budgets and accessibility regression checks
