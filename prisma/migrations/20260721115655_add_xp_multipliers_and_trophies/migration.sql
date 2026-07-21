-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "baseXp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "earnedXp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "goalBonusXp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streakMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.00;

-- CreateTable
CREATE TABLE "UserTrophy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trophyKey" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrophy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserTrophy_userId_unlockedAt_idx" ON "UserTrophy"("userId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrophy_userId_trophyKey_key" ON "UserTrophy"("userId", "trophyKey");

-- AddForeignKey
ALTER TABLE "UserTrophy" ADD CONSTRAINT "UserTrophy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
