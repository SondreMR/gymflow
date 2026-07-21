export const XP_PER_COMPLETED_WORKOUT = 100;
export const XP_PER_COMPLETED_SET = 15;
export const WEEKLY_GOAL_BONUS_XP = 50;

export const TROPHIES = [
  { key: "rookie-lifter", level: 5, name: "Rookie Lifter", rarity: "Bronze" },
  {
    key: "consistent-athlete",
    level: 10,
    name: "Consistent Athlete",
    rarity: "Silver",
  },
  { key: "iron-regular", level: 20, name: "Iron Regular", rarity: "Gold" },
  { key: "strength-builder", level: 35, name: "Strength Builder", rarity: "Platinum" },
  { key: "gym-veteran", level: 50, name: "Gym Veteran", rarity: "Diamond" },
  { key: "elite-athlete", level: 75, name: "Elite Athlete", rarity: "Mythic" },
  { key: "gymflow-legend", level: 100, name: "GymFlow Legend", rarity: "Legendary" },
] as const;

export function getStreakMultiplier(streakWeeks: number) {
  return Math.min(3, 1 + Math.max(0, streakWeeks) * 0.25);
}

export function calculateBaseXp(completedSets: number) {
  return XP_PER_COMPLETED_WORKOUT + Math.max(0, completedSets) * XP_PER_COMPLETED_SET;
}

export function calculateEarnedXp(
  baseXp: number,
  streakMultiplier: number,
  goalBonusXp = 0,
) {
  return Math.round(baseXp * streakMultiplier) + goalBonusXp;
}

// Cumulative threshold. Level 1 starts at 0 XP; the curve stays rewarding early
// while making higher levels a long-term commitment.
export function totalXpRequiredForLevel(level: number) {
  if (level <= 1) return 0;
  return Math.round(20 * level ** 2 + 100 * level - 120);
}

export function getLevelProgress(totalXp: number) {
  let level = 1;
  while (totalXp >= totalXpRequiredForLevel(level + 1)) level += 1;
  const currentThreshold = totalXpRequiredForLevel(level);
  const nextThreshold = totalXpRequiredForLevel(level + 1);
  const progressXp = Math.max(0, totalXp - currentThreshold);
  const xpToNextLevel = nextThreshold - currentThreshold;
  return {
    current: level,
    progressPercent: Math.min(100, (progressXp / xpToNextLevel) * 100),
    progressXp,
    totalXp,
    xpToNextLevel,
  };
}

export function getEligibleTrophies(level: number) {
  return TROPHIES.filter((trophy) => trophy.level <= level);
}

export function getActiveTrophy(level: number) {
  return [...TROPHIES].reverse().find((trophy) => trophy.level <= level);
}

export function getNextTrophy(level: number) {
  return TROPHIES.find((trophy) => trophy.level > level);
}

export function simulateProgression({
  averageBaseXp = 220,
  multiplier,
  workoutsPerWeek,
}: {
  averageBaseXp?: number;
  multiplier: number;
  workoutsPerWeek: number;
}) {
  const xpPerWorkout = Math.round(averageBaseXp * multiplier);
  return [20, 50, 75, 100].map((level) => {
    const workouts = Math.ceil(totalXpRequiredForLevel(level) / xpPerWorkout);
    return { level, workouts, years: workouts / (workoutsPerWeek * 52) };
  });
}
