# Dashboard metrics

Dashboard data is loaded server-side for the authenticated GymFlow user from completed `WorkoutSession` records and their sets. Browser components receive derived, serializable data rather than Prisma records.

## Rules

- Completed workouts are sessions with status `COMPLETED`.
- Completed-set volume is `weightKg × reps` for sets marked complete.
- Weekly activity and weekly goal streaks use UTC; weeks begin Monday.
- The current `User.weeklyWorkoutGoal` is applied when evaluating weekly goal streaks.
- Recent workouts are the five newest completed sessions; workout history shows the eight newest completed sessions.
- Dashboard/profile XP is the sum of persisted `earnedXp` values, not a recalculation of historical sessions.

## XP and rewards

When a workout is saved, the server persists base XP, streak multiplier, weekly-goal bonus, and earned XP. Base XP is `100 + (15 × completed sets)`. The multiplier is based on successful weekly-goal streaks and caps at 3x. A 50 XP bonus is granted only to the first workout that reaches the configured weekly goal in a UTC week. See [Progression](progression.md) for thresholds and trophy rules.
