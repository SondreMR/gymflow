import assert from "node:assert/strict";
import test from "node:test";

import { validateTargetValues } from "./program-validation";

test("program exercise targets allow saving sets without rep targets", () => {
  assert.deepEqual(
    validateTargetValues({ targetSets: 4, targetRepMin: null, targetRepMax: null }),
    { targetSets: 4, targetRepMin: null, targetRepMax: null },
  );
});

test("program exercise targets allow independent and complete rep ranges", () => {
  assert.equal(
    validateTargetValues({ targetSets: 3, targetRepMin: 6, targetRepMax: null })
      .targetRepMin,
    6,
  );
  assert.equal(
    validateTargetValues({ targetSets: 3, targetRepMin: 6, targetRepMax: 10 })
      .targetRepMax,
    10,
  );
});

test("program exercise targets clear empty rep fields to null", () => {
  assert.deepEqual(
    validateTargetValues({ targetSets: 3, targetRepMin: null, targetRepMax: null }),
    { targetSets: 3, targetRepMin: null, targetRepMax: null },
  );
});

test("program exercise targets reject an inverted rep range", () => {
  assert.throws(
    () => validateTargetValues({ targetSets: 3, targetRepMin: 10, targetRepMax: 6 }),
    /Rep range is invalid/,
  );
});
