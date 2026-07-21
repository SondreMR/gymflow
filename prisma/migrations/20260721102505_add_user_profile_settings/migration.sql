-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('KG', 'LB');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "displayName" TEXT NOT NULL DEFAULT 'GymFlow Athlete',
ADD COLUMN     "preferredWeightUnit" "WeightUnit" NOT NULL DEFAULT 'KG',
ADD COLUMN     "weeklyWorkoutGoal" INTEGER NOT NULL DEFAULT 4;
