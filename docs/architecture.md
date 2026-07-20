# Architecture

## Current scope

This is a frontend foundation, not a product implementation. It contains the application shell, conventions, quality tooling, and delivery automation only. Authentication, persistence, domain models, API routes, and fitness-tracking workflows are explicitly out of scope at this stage.

## Design decisions

### Next.js App Router

The App Router is the routing and rendering boundary. It supports server-first rendering by default and gives future work clear homes for layouts, route handlers, loading states, and error boundaries. No routes beyond the root shell are created until there is a product need.

### Strict TypeScript

`strict` mode, no JavaScript source, and no emitted type-check output make invalid states more visible before runtime. Types should remain close to the owning feature until they are shared across features.

### Feature-oriented organization

`src/features` is reserved for vertical feature modules. A new feature should own its UI, hooks, schemas, and domain-specific types. `src/components` is only for reusable UI; `src/lib` is only for shared, non-UI utilities. This limits cross-feature coupling as the product grows.

### Absolute imports

`@/*` maps to `src/*`. This avoids fragile relative paths and makes module ownership obvious in imports. Relative imports remain appropriate within a small, cohesive feature folder.

### Styling

Tailwind CSS is imported once through `src/styles/globals.css`. Tailwind keeps styling colocated with components without creating a large global stylesheet. Design tokens and shared primitives should be introduced before product pages need them, rather than speculatively.

### Configuration and secrets

`src/config/env.ts` centralizes current public configuration. `.env.local` is ignored and `.env.example` documents non-sensitive keys. Public variables are intentionally limited: any `NEXT_PUBLIC_` value is shipped to browsers. Future server-only configuration must not be imported into client components.

### Quality and delivery

ESLint combines Next.js Core Web Vitals and TypeScript guidance. Prettier owns formatting so reviews focus on behavior. The CI workflow executes formatting checks, linting, and type-checking in a clean Node 22 environment, matching the project engine policy.

## Dependency direction

```text
app routes/layouts
        |
        +--> features (when introduced) --> components / lib / types
        |
        +--> config
```

Shared layers must not import feature modules or route modules. This one-way dependency rule prevents circular dependencies and keeps features independently understandable.

## Conventions for future work

1. Add a feature module only when a user-facing capability is approved.
2. Keep server concerns, schemas, and data access behind feature or service boundaries.
3. Add a test strategy with the first behavior that needs it; do not introduce a test framework without an executable test case.
4. Document material architectural changes in this file and update the roadmap when scope changes.
