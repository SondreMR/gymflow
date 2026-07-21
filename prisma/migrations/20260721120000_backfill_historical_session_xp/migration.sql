-- Preserve the pre-multiplier XP formula for existing completed sessions.
-- New sessions calculate and persist their own immutable breakdown in the completion transaction.
UPDATE "WorkoutSession" AS session
SET
  "baseXp" = 100 + 15 * (
    SELECT COUNT(*)::INTEGER
    FROM "WorkoutSet" AS workout_set
    JOIN "WorkoutSessionExercise" AS session_exercise
      ON session_exercise."id" = workout_set."workoutSessionExerciseId"
    WHERE session_exercise."workoutSessionId" = session."id"
      AND workout_set."isCompleted" = TRUE
  ),
  "streakMultiplier" = 1.00,
  "goalBonusXp" = 0,
  "earnedXp" = 100 + 15 * (
    SELECT COUNT(*)::INTEGER
    FROM "WorkoutSet" AS workout_set
    JOIN "WorkoutSessionExercise" AS session_exercise
      ON session_exercise."id" = workout_set."workoutSessionExerciseId"
    WHERE session_exercise."workoutSessionId" = session."id"
      AND workout_set."isCompleted" = TRUE
  )
WHERE session."status" = 'COMPLETED'
  AND session."earnedXp" = 0;
