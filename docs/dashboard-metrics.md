# Dashboard metrics

## Query and ownership

The Dashboard is rendered on the server. `src/features/dashboard/data.ts` loads all completed `WorkoutSession` records for the prototype owner and includes their logged sets in one query. That normalized result is reused to derive recent workouts, streaks, weekly activity, weekly volume, and XP. A separate, small query counts workout days on the owner’s programs to establish the weekly target.

The workout-history provider is scoped to the `/workout` route, so its history query is not run on Dashboard requests.

No Prisma client is imported by Dashboard components or browser code.

## Calendar and timezone rules

- All Dashboard calendar calculations use **UTC**.
- A calendar day runs from `00:00:00` to `23:59:59.999` UTC.
- A week begins Monday at `00:00:00` UTC and ends immediately before the following Monday.
- Dates displayed by the Dashboard use UTC as well, so the visual date matches the calculation date.

Using one explicit timezone prevents a completed workout near midnight from being assigned to different days by the server and client. When authentication adds a user timezone, these utilities can accept that stored timezone instead.

## Training metrics

- **Completed workouts:** sessions whose persisted status is `COMPLETED`.
- **Completed set volume:** `weightKg × reps` for only sets with `isCompleted = true`. Decimal weights are retained to two decimal places by Prisma and rounded to two decimal places after aggregation for display.
- **Weekly workout goal:** the persisted `User.weeklyWorkoutGoal`, constrained to 1–14 and defaulting to four completed workouts.
- **Current goal streak:** consecutive successful UTC calendar weeks. A week is successful when its completed-session count is at least the current weekly goal. Multiple workouts on a day count separately. The in-progress current week does not break a streak until it is complete: it extends the streak only once its goal is reached; otherwise the immediately preceding run remains visible.
- **Goal changes:** GymFlow applies the user’s current weekly goal to all historical weeks whenever it calculates streaks. This is deterministic without needing a historical goal-setting model; a future version may snapshot goal changes if historical-at-the-time scoring is required.

## XP and levels

XP is deterministic and recalculated from persisted workout history:

```text
total XP = (100 × completed workouts)
         + (15 × completed sets)
         + (5 × floor(total completed volume in kg / 1,000))
         + (50 × floor(personal-best streak days / 7))
```

Every level requires 500 XP. Level 1 begins at 0 XP; level is `floor(total XP / 500) + 1`. The progress bar shows `total XP mod 500` toward the next level. The formula lives in `src/features/dashboard/dashboard-utils.ts` so it can be tuned without changing queries or UI.

The XP streak milestone still uses the internal daily personal-best calculation from the prior model, so changing the weekly goal does not change earned XP.
