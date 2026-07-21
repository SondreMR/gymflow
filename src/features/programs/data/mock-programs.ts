import type { ExerciseDefinition, WorkoutProgram } from "@/features/programs/types";

export const builtInExercises: ExerciseDefinition[] = [
  { id: "barbell-bench-press", name: "Barbell Bench Press", muscleGroup: "Chest" },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    muscleGroup: "Chest",
  },
  { id: "cable-fly", name: "Cable Fly", muscleGroup: "Chest" },
  { id: "lat-pulldown", name: "Lat Pulldown", muscleGroup: "Back" },
  { id: "barbell-row", name: "Barbell Row", muscleGroup: "Back" },
  { id: "seated-cable-row", name: "Seated Cable Row", muscleGroup: "Back" },
  { id: "back-squat", name: "Back Squat", muscleGroup: "Legs" },
  { id: "romanian-deadlift", name: "Romanian Deadlift", muscleGroup: "Hamstrings" },
  { id: "leg-press", name: "Leg Press", muscleGroup: "Legs" },
  { id: "overhead-press", name: "Overhead Press", muscleGroup: "Shoulders" },
  { id: "lateral-raise", name: "Lateral Raise", muscleGroup: "Shoulders" },
  { id: "cable-curl", name: "Cable Curl", muscleGroup: "Biceps" },
  { id: "triceps-pressdown", name: "Triceps Pressdown", muscleGroup: "Triceps" },
];

export const mockPrograms: WorkoutProgram[] = [
  {
    id: "push-pull-legs",
    name: "Push Pull Legs",
    description: "A balanced six-day split focused on progressive overload.",
    updatedAt: "Updated today",
    days: [
      {
        id: "ppl-push",
        name: "Push",
        exercises: [
          {
            id: "ppl-push-bench",
            exerciseId: "barbell-bench-press",
            name: "Barbell Bench Press",
            muscleGroup: "Chest",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 8,
          },
          {
            id: "ppl-push-shoulder",
            exerciseId: "overhead-press",
            name: "Overhead Press",
            muscleGroup: "Shoulders",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 10,
          },
          {
            id: "ppl-push-triceps",
            exerciseId: "triceps-pressdown",
            name: "Triceps Pressdown",
            muscleGroup: "Triceps",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
        ],
      },
      {
        id: "ppl-pull",
        name: "Pull",
        exercises: [
          {
            id: "ppl-pull-row",
            exerciseId: "barbell-row",
            name: "Barbell Row",
            muscleGroup: "Back",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 8,
          },
          {
            id: "ppl-pull-pulldown",
            exerciseId: "lat-pulldown",
            name: "Lat Pulldown",
            muscleGroup: "Back",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
        ],
      },
      {
        id: "ppl-legs",
        name: "Legs",
        exercises: [
          {
            id: "ppl-legs-squat",
            exerciseId: "back-squat",
            name: "Back Squat",
            muscleGroup: "Legs",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            id: "ppl-legs-rdl",
            exerciseId: "romanian-deadlift",
            name: "Romanian Deadlift",
            muscleGroup: "Hamstrings",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 10,
          },
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    name: "Upper Lower",
    description: "Four focused sessions for building strength and size.",
    updatedAt: "Updated 3 days ago",
    days: [
      {
        id: "ul-upper",
        name: "Upper A",
        exercises: [
          {
            id: "ul-upper-bench",
            exerciseId: "barbell-bench-press",
            name: "Barbell Bench Press",
            muscleGroup: "Chest",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            id: "ul-upper-row",
            exerciseId: "seated-cable-row",
            name: "Seated Cable Row",
            muscleGroup: "Back",
            targetSets: 4,
            targetRepMin: 8,
            targetRepMax: 12,
          },
        ],
      },
      {
        id: "ul-lower",
        name: "Lower A",
        exercises: [
          {
            id: "ul-lower-squat",
            exerciseId: "back-squat",
            name: "Back Squat",
            muscleGroup: "Legs",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
        ],
      },
    ],
  },
  {
    id: "full-body",
    name: "Full Body",
    description: "Three efficient sessions for a consistent weekly rhythm.",
    updatedAt: "Updated Jul 14",
    days: [
      {
        id: "fb-a",
        name: "Full Body A",
        exercises: [
          {
            id: "fb-squat",
            exerciseId: "back-squat",
            name: "Back Squat",
            muscleGroup: "Legs",
            targetSets: 3,
            targetRepMin: 6,
            targetRepMax: 10,
          },
          {
            id: "fb-press",
            exerciseId: "incline-dumbbell-press",
            name: "Incline Dumbbell Press",
            muscleGroup: "Chest",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
        ],
      },
    ],
  },
];
