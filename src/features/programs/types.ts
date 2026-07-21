export type ExerciseDefinition = {
  equipment?: string;
  id: string;
  isSystem?: boolean;
  muscleGroup: string;
  name: string;
};

export type ProgramExercise = ExerciseDefinition & {
  exerciseId: string;
  id: string;
  targetRepMax?: number;
  targetRepMin?: number;
  targetSets: number;
};

export type WorkoutDay = {
  exercises: ProgramExercise[];
  id: string;
  name: string;
};

export type WorkoutProgram = {
  days: WorkoutDay[];
  description?: string;
  id: string;
  name: string;
  updatedAt: string;
};
