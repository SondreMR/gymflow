export type DashboardWorkoutSet = {
  isCompleted: boolean;
  reps: number | null;
  weightKg: number | null;
};

export type DashboardWorkoutRecord = {
  completedAt: Date;
  durationSeconds: number;
  earnedXp: number;
  id: string;
  programName: string;
  sets: DashboardWorkoutSet[];
  workoutDayName: string;
};

export type DashboardRecentWorkout = {
  completedAt: string;
  completedSets: number;
  durationSeconds: number;
  id: string;
  programName?: string;
  totalVolume: number;
  workoutDayName: string;
};

export type WeeklyActivityDay = {
  date: string;
  dayLabel: string;
  completedWorkouts: number;
  totalVolume: number;
};

export type DashboardData = {
  currentStreak: number;
  streakMultiplier: number;
  currentWeekWorkouts: number;
  level: {
    current: number;
    progressPercent: number;
    progressXp: number;
    totalXp: number;
    xpToNextLevel: number;
  };
  activeTrophy?: { key: string; level: number; name: string; rarity: string };
  nextTrophy?: { key: string; level: number; name: string; rarity: string };
  profile: {
    displayName: string;
  };
  recentWorkouts: DashboardRecentWorkout[];
  todayLabel: string;
  weeklyActivity: WeeklyActivityDay[];
  weeklyTarget: number;
  weeklyVolume: number;
};
