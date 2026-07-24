export type TargetValues = {
  targetRepMax: number | null;
  targetRepMin: number | null;
  targetSets: number;
};

export function validateTargetValues(values: TargetValues) {
  if (
    !Number.isInteger(values.targetSets) ||
    values.targetSets < 1 ||
    values.targetSets > 20
  ) {
    throw new Error("Target sets must be between 1 and 20.");
  }
  if (
    (values.targetRepMin !== null &&
      (!Number.isInteger(values.targetRepMin) || values.targetRepMin < 1)) ||
    (values.targetRepMax !== null &&
      (!Number.isInteger(values.targetRepMax) || values.targetRepMax < 1)) ||
    (values.targetRepMin !== null &&
      values.targetRepMax !== null &&
      values.targetRepMax < values.targetRepMin)
  ) {
    throw new Error("Rep range is invalid.");
  }
  return values;
}
