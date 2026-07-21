ALTER TABLE "Exercise" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "Exercise"
  ADD COLUMN "equipment" TEXT,
  ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "systemKey" TEXT;

CREATE UNIQUE INDEX "Exercise_systemKey_key" ON "Exercise"("systemKey");
CREATE INDEX "Exercise_isSystem_muscleGroup_idx" ON "Exercise"("isSystem", "muscleGroup");
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");
