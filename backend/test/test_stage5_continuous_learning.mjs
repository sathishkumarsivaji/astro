/**
 * Stage 5 real-data continuous-learning evaluation contract.
 *
 * This is an empirical-data harness, not a synthetic accuracy test. It never
 * creates outcomes, feature snapshots, consent, or verification records. The
 * current public historical splits are expected to be BLOCKED until they are
 * joined to the authorized immutable outcome store.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  buildOutcomeLearningReport,
  trainAndEvaluateCandidate
} from "../../frontend/src/services/outcomeLearningPipeline.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SPLIT_DIR = path.join(ROOT, "data/real_world_validation/splits");
const EXTERNAL_PATH = path.join(
  ROOT,
  "data/external_validation/astro_databank/astro_databank_true_independent.json"
);
const REPORT_PATH = path.join(
  ROOT,
  "data/real_world_validation/results/stage5_continuous_learning_report.json"
);

const PARTITIONS = Object.freeze({
  TRAIN: path.join(SPLIT_DIR, "train.json"),
  VALIDATION: path.join(SPLIT_DIR, "val.json"),
  BLIND_TEST: path.join(SPLIT_DIR, "blind_test.json"),
  EXTERNAL_HOLDOUT: EXTERNAL_PATH
});

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function loadPartition(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`STAGE5_DATASET_MISSING: ${filePath}`);
  }
  const records = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(records)) {
    throw new Error(`STAGE5_DATASET_INVALID: ${filePath}`);
  }
  return records;
}

function hasImmutableLearningEnvelope(record) {
  return Boolean(
    record?.originalPrediction?.featureSnapshot &&
    record.originalPrediction.cutoffDate &&
    record.originalPrediction.engineVersion &&
    record.originalPrediction.calculationSettings &&
    record?.consent?.status === "CURRENT" &&
    record.consent.purpose === "MODEL_TRAINING" &&
    record?.outcomeReport
  );
}

function assertPartitionIsolation(partitions) {
  const seen = new Map();
  for (const [partition, records] of Object.entries(partitions)) {
    for (const record of records) {
      const personKey = record.personId || record.sourceRecordId || record.recordId;
      if (!personKey) continue;
      const prior = seen.get(`person:${personKey}`);
      if (prior && prior !== partition) {
        throw new Error(`STAGE5_LEAKAGE: person ${personKey} occurs in ${prior} and ${partition}`);
      }
      seen.set(`person:${personKey}`, partition);
    }
  }
}

const partitions = Object.fromEntries(
  Object.entries(PARTITIONS).map(([name, filePath]) => [name, loadPartition(filePath)])
);
assertPartitionIsolation(partitions);

const eligibleCounts = Object.fromEntries(
  Object.entries(partitions).map(([name, records]) => [
    name,
    records.filter(hasImmutableLearningEnvelope).length
  ])
);

const report = {
  reportVersion: "STAGE5_CONTINUOUS_LEARNING_REPORT_V1",
  softwareTest: false,
  generatedAt: new Date().toISOString(),
  evaluationPolicy: {
    cohortSelection: "FULL_PARTITIONS",
    selectionLimit: null,
    checkpointReuse: false,
    thresholdSelection: "VALIDATION_ONLY",
    blindPolicy: "FROZEN_UNTOUCHED",
    externalHoldoutPolicy: "FROZEN_INDEPENDENT",
    syntheticOutcomesCreated: false,
    syntheticFeatureSnapshotsCreated: false
  },
  datasets: Object.fromEntries(
    Object.entries(PARTITIONS).map(([name, filePath]) => [
      name,
      { path: path.relative(ROOT, filePath).replace(/\\/g, "/"), sha256: sha256File(filePath), rows: partitions[name].length }
    ])
  ),
  eligibleImmutableEnvelopeRows: eligibleCounts
};

if (Object.values(eligibleCounts).some(count => count === 0)) {
  report.status = "BLOCKED";
  report.reason = "AUTHORIZED_IMMUTABLE_OUTCOME_STORE_LINKAGE_REQUIRED";
  report.exclusions = Object.fromEntries(
    Object.entries(partitions).map(([name, records]) => [
      name,
      {
        excludedRows: records.length - eligibleCounts[name],
        reason: "MISSING_ORIGINAL_PREDICTION_FEATURE_SNAPSHOT_OR_CURRENT_CONSENT_OR_OUTCOME_REPORT"
      }
    ])
  );
  report.metrics = {
    occurrence: "NOT_RUN",
    timing: "NOT_RUN",
    independentImprovement: "NOT_ESTABLISHED"
  };
} else {
  const result = trainAndEvaluateCandidate({
    TRAIN: partitions.TRAIN,
    VALIDATION: partitions.VALIDATION,
    BLIND_TEST: partitions.BLIND_TEST
  });
  const evaluated = buildOutcomeLearningReport(result, {
    sourceHash: sha256File(path.join(ROOT, "frontend/src/services/outcomeLearningPipeline.js")),
    datasetHash: Object.values(PARTITIONS).map(sha256File).join(":")
  });
  report.status = evaluated.status;
  report.reason = evaluated.reason || null;
  report.result = evaluated.result;
  report.externalHoldout = "NOT_RUN";
  report.metrics = {
    occurrence: evaluated.result?.metrics || null,
    timing: "NOT_RUN",
    independentImprovement: evaluated.status === "PROMOTED" ? "SUPPORTED_BY_FROZEN_BLIND_TEST" : "NOT_ESTABLISHED"
  };
}

fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  status: report.status,
  reason: report.reason,
  trainRows: partitions.TRAIN.length,
  validationRows: partitions.VALIDATION.length,
  blindRows: partitions.BLIND_TEST.length,
  externalHoldoutRows: partitions.EXTERNAL_HOLDOUT.length,
  eligibleImmutableEnvelopeRows: eligibleCounts,
  report: path.relative(ROOT, REPORT_PATH).replace(/\\/g, "/")
}, null, 2));

if (!["BLOCKED", "REJECTED", "PROMOTED"].includes(report.status)) {
  process.exitCode = 1;
}
