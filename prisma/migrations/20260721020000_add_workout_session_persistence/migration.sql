ALTER TABLE "WorkoutSession"
  ADD COLUMN "clientReference" TEXT,
  ADD COLUMN "durationSeconds" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "note" TEXT;

ALTER TABLE "WorkoutSessionExercise" ADD COLUMN "note" TEXT;

CREATE UNIQUE INDEX "WorkoutSession_clientReference_key" ON "WorkoutSession"("clientReference");
