import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

type SystemExercise = {
  equipment: string;
  key: string;
  muscleGroup: string;
  name: string;
};

const systemExercises: SystemExercise[] = [
  {
    key: "barbell-bench-press",
    name: "Bench Press",
    muscleGroup: "Chest",
    equipment: "Barbell",
  },
  {
    key: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    muscleGroup: "Chest",
    equipment: "Dumbbell",
  },
  {
    key: "dumbbell-chest-press",
    name: "Dumbbell Chest Press",
    muscleGroup: "Chest",
    equipment: "Dumbbell",
  },
  {
    key: "cable-chest-fly",
    name: "Cable Chest Fly",
    muscleGroup: "Chest",
    equipment: "Cable",
  },
  {
    key: "machine-chest-press",
    name: "Machine Chest Press",
    muscleGroup: "Chest",
    equipment: "Machine",
  },
  { key: "push-up", name: "Push-Up", muscleGroup: "Chest", equipment: "Bodyweight" },
  {
    key: "dumbbell-pullover",
    name: "Dumbbell Pullover",
    muscleGroup: "Chest",
    equipment: "Dumbbell",
  },
  {
    key: "incline-cable-fly",
    name: "Incline Cable Fly",
    muscleGroup: "Chest",
    equipment: "Cable",
  },
  { key: "pull-up", name: "Pull-Up", muscleGroup: "Back", equipment: "Bodyweight" },
  {
    key: "lat-pulldown",
    name: "Lat Pulldown",
    muscleGroup: "Back",
    equipment: "Cable",
  },
  {
    key: "barbell-row",
    name: "Barbell Row",
    muscleGroup: "Back",
    equipment: "Barbell",
  },
  {
    key: "seated-cable-row",
    name: "Seated Cable Row",
    muscleGroup: "Back",
    equipment: "Cable",
  },
  {
    key: "one-arm-dumbbell-row",
    name: "One-Arm Dumbbell Row",
    muscleGroup: "Back",
    equipment: "Dumbbell",
  },
  {
    key: "chest-supported-row",
    name: "Chest-Supported Row",
    muscleGroup: "Back",
    equipment: "Dumbbell",
  },
  {
    key: "machine-row",
    name: "Machine Row",
    muscleGroup: "Back",
    equipment: "Machine",
  },
  {
    key: "straight-arm-pulldown",
    name: "Straight-Arm Pulldown",
    muscleGroup: "Back",
    equipment: "Cable",
  },
  { key: "face-pull", name: "Face Pull", muscleGroup: "Back", equipment: "Cable" },
  {
    key: "back-extension",
    name: "Back Extension",
    muscleGroup: "Back",
    equipment: "Bodyweight",
  },
  {
    key: "overhead-press",
    name: "Overhead Press",
    muscleGroup: "Shoulders",
    equipment: "Barbell",
  },
  {
    key: "dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    muscleGroup: "Shoulders",
    equipment: "Dumbbell",
  },
  {
    key: "lateral-raise",
    name: "Lateral Raise",
    muscleGroup: "Shoulders",
    equipment: "Dumbbell",
  },
  {
    key: "cable-lateral-raise",
    name: "Cable Lateral Raise",
    muscleGroup: "Shoulders",
    equipment: "Cable",
  },
  {
    key: "reverse-fly",
    name: "Reverse Fly",
    muscleGroup: "Shoulders",
    equipment: "Dumbbell",
  },
  {
    key: "rear-delt-machine",
    name: "Rear Delt Machine",
    muscleGroup: "Shoulders",
    equipment: "Machine",
  },
  {
    key: "front-raise",
    name: "Front Raise",
    muscleGroup: "Shoulders",
    equipment: "Dumbbell",
  },
  {
    key: "barbell-curl",
    name: "Barbell Curl",
    muscleGroup: "Biceps",
    equipment: "Barbell",
  },
  {
    key: "dumbbell-curl",
    name: "Dumbbell Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbell",
  },
  {
    key: "hammer-curl",
    name: "Hammer Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbell",
  },
  { key: "cable-curl", name: "Cable Curl", muscleGroup: "Biceps", equipment: "Cable" },
  {
    key: "preacher-curl",
    name: "Preacher Curl",
    muscleGroup: "Biceps",
    equipment: "Machine",
  },
  {
    key: "triceps-pushdown",
    name: "Triceps Pushdown",
    muscleGroup: "Triceps",
    equipment: "Cable",
  },
  {
    key: "overhead-triceps-extension",
    name: "Overhead Triceps Extension",
    muscleGroup: "Triceps",
    equipment: "Dumbbell",
  },
  {
    key: "close-grip-bench-press",
    name: "Close-Grip Bench Press",
    muscleGroup: "Triceps",
    equipment: "Barbell",
  },
  { key: "dips", name: "Dips", muscleGroup: "Triceps", equipment: "Bodyweight" },
  {
    key: "triceps-machine-extension",
    name: "Triceps Machine Extension",
    muscleGroup: "Triceps",
    equipment: "Machine",
  },
  { key: "back-squat", name: "Squat", muscleGroup: "Quadriceps", equipment: "Barbell" },
  {
    key: "front-squat",
    name: "Front Squat",
    muscleGroup: "Quadriceps",
    equipment: "Barbell",
  },
  {
    key: "leg-press",
    name: "Leg Press",
    muscleGroup: "Quadriceps",
    equipment: "Machine",
  },
  {
    key: "leg-extension",
    name: "Leg Extension",
    muscleGroup: "Quadriceps",
    equipment: "Machine",
  },
  {
    key: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    muscleGroup: "Quadriceps",
    equipment: "Dumbbell",
  },
  {
    key: "walking-lunge",
    name: "Walking Lunge",
    muscleGroup: "Quadriceps",
    equipment: "Dumbbell",
  },
  {
    key: "hack-squat",
    name: "Hack Squat",
    muscleGroup: "Quadriceps",
    equipment: "Machine",
  },
  { key: "step-up", name: "Step-Up", muscleGroup: "Quadriceps", equipment: "Dumbbell" },
  {
    key: "romanian-deadlift",
    name: "Romanian Deadlift",
    muscleGroup: "Hamstrings",
    equipment: "Barbell",
  },
  {
    key: "lying-leg-curl",
    name: "Lying Leg Curl",
    muscleGroup: "Hamstrings",
    equipment: "Machine",
  },
  {
    key: "seated-leg-curl",
    name: "Seated Leg Curl",
    muscleGroup: "Hamstrings",
    equipment: "Machine",
  },
  {
    key: "good-morning",
    name: "Good Morning",
    muscleGroup: "Hamstrings",
    equipment: "Barbell",
  },
  {
    key: "single-leg-romanian-deadlift",
    name: "Single-Leg Romanian Deadlift",
    muscleGroup: "Hamstrings",
    equipment: "Dumbbell",
  },
  {
    key: "nordic-hamstring-curl",
    name: "Nordic Hamstring Curl",
    muscleGroup: "Hamstrings",
    equipment: "Bodyweight",
  },
  {
    key: "barbell-hip-thrust",
    name: "Barbell Hip Thrust",
    muscleGroup: "Glutes",
    equipment: "Barbell",
  },
  {
    key: "glute-bridge",
    name: "Glute Bridge",
    muscleGroup: "Glutes",
    equipment: "Bodyweight",
  },
  {
    key: "cable-kickback",
    name: "Cable Kickback",
    muscleGroup: "Glutes",
    equipment: "Cable",
  },
  {
    key: "hip-abduction-machine",
    name: "Hip Abduction Machine",
    muscleGroup: "Glutes",
    equipment: "Machine",
  },
  {
    key: "goblet-squat",
    name: "Goblet Squat",
    muscleGroup: "Glutes",
    equipment: "Dumbbell",
  },
  {
    key: "reverse-lunge",
    name: "Reverse Lunge",
    muscleGroup: "Glutes",
    equipment: "Dumbbell",
  },
  {
    key: "standing-calf-raise",
    name: "Standing Calf Raise",
    muscleGroup: "Calves",
    equipment: "Machine",
  },
  {
    key: "seated-calf-raise",
    name: "Seated Calf Raise",
    muscleGroup: "Calves",
    equipment: "Machine",
  },
  {
    key: "single-leg-calf-raise",
    name: "Single-Leg Calf Raise",
    muscleGroup: "Calves",
    equipment: "Bodyweight",
  },
  {
    key: "donkey-calf-raise",
    name: "Donkey Calf Raise",
    muscleGroup: "Calves",
    equipment: "Machine",
  },
  { key: "plank", name: "Plank", muscleGroup: "Core", equipment: "Bodyweight" },
  {
    key: "hanging-knee-raise",
    name: "Hanging Knee Raise",
    muscleGroup: "Core",
    equipment: "Bodyweight",
  },
  {
    key: "cable-crunch",
    name: "Cable Crunch",
    muscleGroup: "Core",
    equipment: "Cable",
  },
  {
    key: "ab-wheel-rollout",
    name: "Ab Wheel Rollout",
    muscleGroup: "Core",
    equipment: "Bodyweight",
  },
  { key: "dead-bug", name: "Dead Bug", muscleGroup: "Core", equipment: "Bodyweight" },
  {
    key: "russian-twist",
    name: "Russian Twist",
    muscleGroup: "Core",
    equipment: "Bodyweight",
  },
  {
    key: "pallof-press",
    name: "Pallof Press",
    muscleGroup: "Core",
    equipment: "Cable",
  },
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString)
  throw new Error("DATABASE_URL must be configured before seeding exercises.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  await prisma.$transaction(
    systemExercises.map((exercise) =>
      prisma.exercise.upsert({
        where: { systemKey: exercise.key },
        update: {
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          isSystem: true,
          userId: null,
          description: null,
        },
        create: {
          systemKey: exercise.key,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          isSystem: true,
        },
      }),
    ),
  );
}

main().finally(() => prisma.$disconnect());
