export type ActiveWorkoutExercise = {
  exerciseId: string;
  id: string;
  muscleGroup: string;
  name: string;
  note: string;
  sets: WorkoutSetLog[];
  targetRepMax?: number;
  targetRepMin?: number;
  targetSets: number;
};

export type ActiveWorkout = {
  exercises: ActiveWorkoutExercise[];
  id: string;
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
  totalVolume: number;
  workoutDayName: string;
  xpEarned: number;
};
