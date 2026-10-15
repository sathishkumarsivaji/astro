import assert from "node:assert/strict";
import {
  attachOutcomeReport,
  buildOutcomeLearningReport,
  createOriginalPredictionRecord,
  prepareTrainingRows,
  trainAndEvaluateCandidate
} from "./src/services/outcomeLearningPipeline.js";

const consent = {
  status: "CURRENT",
  purpose: "MODEL_TRAINING",
  grantedAt: "2026-01-01T00:00:00.000Z"
};

function makeRecord(index, split, eventOccurred) {
  const prediction = {
    createdAt: "2020-01-01T00:00:00.000Z",
    cutoffDate: "2020-01-01",
    engineVersion: "test-engine-1",
    calculationSettings: { system: "lahiri", ayanamsha: "lahiri", houseSystem: "placidus" },
    featureSnapshot: {
      astrology: { ascendantStrength: eventOccurred ? 2 : -2, dashaSignal: eventOccurred ? 1 : -1 },
      demographic: { ageAtCutoff: 28 + (index % 3), cohortPrior: 0.5 }
    }
  };
  return attachOutcomeReport(
    createOriginalPredictionRecord({
      recordId: `${split}-${index}`,
      personId: `${split}-person-${index}`,
      spouseGroupId: `${split}-spouse-${index}`,
      eventGroupId: `${split}-event-${index}`,
      originalPrediction: prediction,
      consent
    }),
    {
      status: "INDEPENDENTLY_VERIFIED",
      source: { type: "AUTHORITATIVE", id: `fixture-${index}` },
      eventOccurred,
      outcomeDate: eventOccurred ? "2022-01-01" : null
    }
  );
}

const partitions = {
  TRAIN: Array.from({ length: 40 }, (_, index) => makeRecord(index, "train", index % 2 === 0)),
  VALIDATION: Array.from({ length: 20 }, (_, index) => makeRecord(index, "validation", index % 2 === 0)),
  BLIND_TEST: Array.from({ length: 20 }, (_, index) => makeRecord(index, "blind", index % 2 === 0))
};

const prepared = prepareTrainingRows(partitions.TRAIN);
assert.equal(prepared.rows.length, 40);
assert.equal(prepared.exclusions.length, 0);
assert.throws(() => {
  const leaked = { ...partitions.TRAIN[0], originalPrediction: { ...partitions.TRAIN[0].originalPrediction, featureSnapshot: { astrology: { outcome: 1 }, demographic: { ageAtCutoff: 20 } } } };
  prepareTrainingRows([leaked]);
}, /LEAKAGE/);

const result = trainAndEvaluateCandidate(partitions, { epochs: 600 });
assert.ok(["PROMOTED", "REJECTED"].includes(result.status));
assert.ok(result.metrics.BASELINE);
assert.ok(result.metrics.COMBINED);
assert.equal(result.models.BASELINE.algorithm, "FRESH_LOGISTIC_REGRESSION_V1");
assert.equal(result.models.COMBINED.trainingRowCount, 40);

const report = buildOutcomeLearningReport(result, { sourceHash: "fixture", datasetHash: "fixture" });
assert.equal(report.reportVersion, "OUTCOME_LEARNING_REPORT_V1");
assert.equal(report.provenance.featureHorizon, "ORIGINAL_PREDICTION_SNAPSHOT_ONLY");

const blocked = trainAndEvaluateCandidate({ TRAIN: [], VALIDATION: [], BLIND_TEST: [] });
assert.equal(blocked.status, "BLOCKED");

console.log("Outcome learning pipeline contract passed.");
