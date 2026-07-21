# XP progression, weekly streaks, and trophies

## XP calculation

The server calculates and persists each completed workout’s immutable breakdown:

```text
base XP = 100 + (15 × completed sets)
earned XP = round(base XP × weekly-streak multiplier) + weekly-goal bonus
```

Cancelled sessions write nothing. The `clientReference` unique constraint makes repeat submissions return the original saved session, so they cannot award XP or a weekly bonus twice.

| Successful goal streak | Multiplier  |
| ---------------------- | ----------- |
| 0                      | 1.00x       |
| 1                      | 1.25x       |
| 2                      | 1.50x       |
| 3                      | 1.75x       |
| 4                      | 2.00x       |
| 5                      | 2.25x       |
| 6                      | 2.50x       |
| 7                      | 2.75x       |
| 8+                     | 3.00x (cap) |

The goal bonus is a fixed 50 XP awarded only when a workout is the first one to make the current Monday–Sunday UTC week reach its configured goal. Workouts later in that successful week keep the multiplier but receive no additional bonus. An unfinished week preserves a prior streak; a failed completed week resets future multipliers to 1.00x.

## Levels

Level thresholds are centralized in `src/features/progression/progression.ts`:

```text
totalXpRequiredForLevel(level) = round(20 × level² + 100 × level − 120)
```

Level 1 starts at 0 XP. The curve is deliberately cumulative and quadratic: early levels arrive quickly, while Levels 50, 75, and 100 represent sustained training.

The deterministic simulator assumes an average base workout of 220 XP (about eight completed sets), excluding the small weekly bonus:

| Scenario                | L20                | L50        | L75        | L100       |
| ----------------------- | ------------------ | ---------- | ---------- | ---------- |
| 3 workouts/week at 1.0x | 0.3y / 45 workouts | 1.6y / 250 | 3.5y / 545 | 6.1y / 955 |
| 4 workouts/week at 1.5x | 0.2y / 30 workouts | 1.1y / 167 | 2.4y / 364 | 4.2y / 637 |
| 4 workouts/week at 3.0x | 0.1y / 15 workouts | 0.5y / 84  | 1.2y / 182 | 2.1y / 319 |

The maximum-multiplier scenario is intentionally presented as an optimistic upper bound; a user must first build and then retain an eight-week successful-goal streak. The normal and moderate scenarios meet the long-term calibration, and even the optimistic case cannot reach Level 100 in a few months.

## Trophies

- Level 5 — Rookie Lifter
- Level 10 — Consistent Athlete
- Level 20 — Iron Regular
- Level 35 — Strength Builder
- Level 50 — Gym Veteran
- Level 75 — Elite Athlete
- Level 100 — GymFlow Legend

`UserTrophy` has a unique `(userId, trophyKey)` constraint. Trophy writes use `createMany({ skipDuplicates: true })`, both after XP changes and during profile loading, so eligible historical users receive missing trophies without duplicates. Session XP fields are never recalculated after saving; later streak resets or formula changes cannot rewrite history.
