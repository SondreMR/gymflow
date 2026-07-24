export type ActiveWorkoutExercise = {
  exerciseId: string;
  id: string;
  muscleGroup: string;
  name: string;
  note: string;
  sourceDayExerciseId?: string;
  sets: WorkoutSetLog[];
  targetRepMax?: number;
  targetRepMin?: number;
  targetSets: number;
};

export type ActiveWorkout = {
  exercises: ActiveWorkoutExercise[];
  id: string;
  sessionId?: string;
  sourceProgramId?: string;
  sourceWorkoutDayId?: string;
  programName?: string;
  startedAt: number;
  workoutDayName: string;
};

export type WorkoutSetLog = {
  completed: boolean;
  id: string;
  reps?: number;
  weightKg?: number;
};

export type WorkoutSummary = {
  completedExercises: number;
  completedSets: number;
  durationSeconds: number;
  programName?: string;
  totalVolume: number;
  workoutDayName: string;
  baseXp: number;
  streakMultiplier: number;
  goalBonusXp: number;
  xpEarned: number;
};

export type SavedWorkoutSummary = WorkoutSummary & {
  completedAt: string;
  id: string;
};

export type WorkoutHistoryEntry = Omit<
  SavedWorkoutSummary,
  "baseXp" | "goalBonusXp" | "streakMultiplier" | "xpEarned"
>;

export type WorkoutHistoryDetail = WorkoutHistoryEntry & {
  exercises: Array<{
    id: string;
    muscleGroup: string;
    name: string;
    note?: string;
    sets: WorkoutSetLog[];
    targetRepMax?: number;
    targetRepMin?: number;
    targetSets?: number;
  }>;
};
