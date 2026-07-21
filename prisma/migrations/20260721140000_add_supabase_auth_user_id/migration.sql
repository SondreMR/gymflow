-- Existing prototype data intentionally remains attached to its legacy User row.
-- Run scripts/assign-prototype-data.ts explicitly to move it to a test account.
ALTER TABLE "User" ADD COLUMN "authUserId" TEXT;
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");
