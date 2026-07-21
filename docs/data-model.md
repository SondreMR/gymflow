# Data model

The installed Prisma schema is the source of truth: [`prisma/schema.prisma`](../prisma/schema.prisma). GymFlow uses PostgreSQL and stores a separate application `User` for each verified Supabase Auth identity.

## Identity and ownership

`User.authUserId` is unique and maps the Supabase Auth user ID to GymFlow’s internal `User.id`. Profile fields include display name, avatar URL, weekly workout goal, and preferred weight unit. User-owned records use the internal ID; actions resolve it from the server-side session rather than the browser.

## Core entities

| Model                    | Purpose                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `Exercise`               | Global system exercises (`isSystem`) or a private custom exercise owned by a user.        |
| `WorkoutProgram`         | A user-owned reusable plan.                                                               |
| `WorkoutDay`             | An ordered day in one program.                                                            |
| `WorkoutDayExercise`     | An ordered exercise placement with target sets and optional rep range.                    |
| `WorkoutSession`         | A completed workout record with source references, snapshot names, timing, and XP fields. |
| `WorkoutSessionExercise` | A session exercise snapshot with its logged sets.                                         |
| `WorkoutSet`             | One logged set, including kind, weight, repetitions, and completion state.                |
| `PersonalRecord`         | A user’s current and previous highest weight for a tracked exercise.                      |
| `UserTrophy`             | An idempotent user/trophy unlock.                                                         |

The schema enforces ordering and identity constraints, including unique day/exercise positions, unique custom-exercise names per owner, unique PRs per user/exercise, unique trophies per user/key, and unique workout client references.

## Ownership rules

Programs, custom exercises, sessions, trophies, and PRs belong to one user. Workout days and day exercises inherit program ownership; session exercises and sets inherit session ownership. System exercises are globally readable to authenticated users. Application actions validate ownership at both top-level and nested-resource boundaries.
