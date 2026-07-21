export const DEMO_SYSTEM_EXERCISE_KEYS = [
  "barbell-bench-press",
  "incline-dumbbell-press",
  "overhead-press",
  "weighted-pull-up",
  "barbell-row",
  "lat-pulldown",
  "back-squat",
  "romanian-deadlift",
  "leg-press",
  "conventional-deadlift",
  "lying-leg-curl",
] as const;

export type DemoSystemExerciseKey = (typeof DEMO_SYSTEM_EXERCISE_KEYS)[number];

type ExerciseDefinition = { key: string };
type ExerciseResolutionRecord = {
  id: string;
  isSystem: boolean;
  systemKey: string | null;
  userId: string | null;
};

export function assertDemoExerciseDefinitions(definitions: ExerciseDefinition[]) {
  const definedKeys = new Set(definitions.map((exercise) => exercise.key));
  const missingKeys = DEMO_SYSTEM_EXERCISE_KEYS.filter((key) => !definedKeys.has(key));
  if (missingKeys.length) {
    throw new Error(
      `Seed catalog is missing demo system exercise keys: ${missingKeys.join(", ")}.`,
    );
  }
}

export function resolveDemoSystemExercises(records: ExerciseResolutionRecord[]) {
  const recordsByKey = new Map(
    records
      .filter((record) => record.systemKey)
      .map((record) => [record.systemKey!, record]),
  );
  const diagnostics = DEMO_SYSTEM_EXERCISE_KEYS.map((expectedIdentifier) => {
    const record = recordsByKey.get(expectedIdentifier);
    if (!record) {
      return {
        expectedIdentifier,
        matchingExerciseExists: false,
        failedCriterion: "systemKey",
      };
    }
    if (!record.isSystem) {
      return {
        expectedIdentifier,
        matchingExerciseExists: true,
        failedCriterion: "isSystem",
      };
    }
    if (record.userId !== null) {
      return {
        expectedIdentifier,
        matchingExerciseExists: true,
        failedCriterion: "global ownership (userId must be null)",
      };
    }
    return {
      expectedIdentifier,
      matchingExerciseExists: true,
      failedCriterion: null,
    };
  });
  return {
    diagnostics,
    exercises: DEMO_SYSTEM_EXERCISE_KEYS.map((key) => recordsByKey.get(key)).filter(
      (record): record is ExerciseResolutionRecord =>
        Boolean(record && record.isSystem && record.userId === null),
    ),
    isComplete: diagnostics.every(({ failedCriterion }) => !failedCriterion),
  };
}
