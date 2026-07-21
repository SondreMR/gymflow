export type ProfileData = {
  currentStreak: number;
  streakMultiplier: number;
  currentWeekWorkouts: number;
  displayName: string;
  level: {
    current: number;
    progressPercent: number;
    progressXp: number;
    totalXp: number;
    xpToNextLevel: number;
  };
  activeTrophy?: { key: string; level: number; name: string; rarity: string };
  nextTrophy?: { key: string; level: number; name: string; rarity: string };
  preferredWeightUnit: "KG" | "LB";
  totalCompletedSetVolume: number;
  totalPersonalRecords: number;
  totalWorkouts: number;
  weeklyWorkoutGoal: number;
};

export type SidebarProfile = Pick<ProfileData, "displayName"> & {
  level: number;
};
