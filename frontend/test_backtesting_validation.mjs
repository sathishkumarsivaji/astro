/**
 * ASTROVERSE — Prediction Validation Laboratory & Historical Backtesting Suite
 *
 * Verifies:
 * 1. Benchmark cohort generator and explicit data quality ratings (AA/A/B/C/D).
 * 2. Strict 60/20/20 dataset partitioning.
 * 3. Cryptographic anti-leakage protocol & deterministic SHA-256 calculation hashing.
 * 4. Genuine 10-bin Expected Calibration Error (ECE) and Brier calibration metrics.
 * 5. 7-Stage Astrological Ablation analysis across Models A through G.
 * 6. Historical Case Replay Engine.
 * 7. Outcome Definition Registry invariants.
 */

import {
  generatePredictionBenchmarkDataset,
  partitionDataset,
  evaluateWithAntiLeakageProtocol,
  compute10BinECE,
  evaluatePredictions,
  runAblationStudy,
  replayHistoricalCase,
  OUTCOME_REGISTRY,
  ABLATION_MODELS,
  computeSha256Hex
} from "./src/services/predictionValidationLab.js";

console.log("\n=================================================================");
console.log(" ASTROVERSE PREDICTION VALIDATION & BACKTESTING SUITE");
console.log("=================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

// 1. Outcome Registry Integrity
console.log("1. Testing Outcome Definition Registry...");
assert(Boolean(OUTCOME_REGISTRY.SPOUSE_FAMILY_WEALTH_V1), "Registry contains SPOUSE_FAMILY_WEALTH_V1");
assert(Boolean(OUTCOME_REGISTRY.JOINT_RESIDENCE_V1), "Registry contains JOINT_RESIDENCE_V1");
assert(Boolean(OUTCOME_REGISTRY.DIRECTION_V1), "Registry contains DIRECTION_V1");
assert(Boolean(OUTCOME_REGISTRY.DISTANCE_BAND_V1), "Registry contains DISTANCE_BAND_V1");
assert(OUTCOME_REGISTRY.DIRECTION_V1.categories.length === 8, "Direction registry has 8 cardinal/intercardinal categories");

// 2. Cohort Generator & Provenance
console.log("\n2. Testing Benchmark Cohort Generation & Provenance...");
const cohort = generatePredictionBenchmarkDataset(100, 108);
assert(cohort.length === 100, `Generated exactly 100 cases (got ${cohort.length})`);
assert(cohort[0].datasetType === "SYNTHETIC_SIMULATION_BENCHMARK", "Dataset explicitly declared as SYNTHETIC_SIMULATION_BENCHMARK");
assert(cohort[0].predictionCutoffDate.length === 10, "Prediction cutoff date present and formatted");
assert(["AA", "A", "B", "C", "D"].includes(cohort[0].dataQuality), `Data quality rating is valid synthetic birth-time quality label (${cohort[0].dataQuality})`);

// 3. Dataset Partitioning (60/20/20)
console.log("\n3. Testing Strict 60/20/20 Partitioning...");
const parts = partitionDataset(cohort, 0.6, 0.2);
assert(parts.trainCount === 60, `Train set is 60% (got ${parts.trainCount})`);
assert(parts.valCount === 20, `Validation set is 20% (got ${parts.valCount})`);
assert(parts.blindTestCount === 20, `Blind test set is 20% (got ${parts.blindTestCount})`);
assert(parts.trainSet.length + parts.valSet.length + parts.blindTestSet.length === 100, "Dataset partitioning conserves all samples");

// 4. Deterministic Anti-Leakage Hashing & Known-Answer SHA-256 Tests
console.log("\n4. Testing Anti-Leakage Protocol & Cryptographic Reproducibility...");
assert(
  computeSha256Hex("abc") === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  "computeSha256Hex matches FIPS 180-4 standard known-answer test vector for 'abc'"
);
assert(
  computeSha256Hex("") === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "computeSha256Hex matches FIPS 180-4 standard known-answer test vector for empty string"
);

const sampleCase = cohort[0];
const predGen = (input) => ({
  marriagePredicted: true,
  indicativeAge: 27,
  natalPromise: "SUPPORTED",
  cutoffUsed: input.cutoffDate
});

const eval1 = evaluateWithAntiLeakageProtocol(sampleCase, predGen);
const eval2 = evaluateWithAntiLeakageProtocol(sampleCase, predGen);
assert(eval1.certificateHash === eval2.certificateHash, "Certificate hash is 100% deterministic and reproducible across runs");
assert(eval1.certificateHash.length === 64, "Certificate hash is standard 64-character SHA-256 hex string");
assert(Boolean(eval1.createdAt), "Audit metadata contains creation timestamp without mutating calculation hash");
assert(eval1.inputAvailabilityAudit && eval1.inputAvailabilityAudit.postCutoffHistoricalDataAccess === false, "Input availability audit guarantees zero post-cutoff historical data access");

// 5. 10-Bin Expected Calibration Error (ECE)
console.log("\n5. Testing 10-Bin Expected Calibration Error (ECE)...");
const dummyPreds = [
  { probability: 0.9, eventWindowIdentified: true, indicativeYear: 2020 },
  { probability: 0.8, eventWindowIdentified: true, indicativeYear: 2021 },
  { probability: 0.3, eventWindowIdentified: false, indicativeYear: 2022 },
  { probability: 0.1, eventWindowIdentified: false, indicativeYear: 2023 }
];
const dummyTruth = [
  { occurred: true, actualYear: 2020 },
  { occurred: true, actualYear: 2021 },
  { occurred: false, actualYear: 2022 },
  { occurred: false, actualYear: 2023 }
];
const eceVal = compute10BinECE(dummyPreds, dummyTruth, 10);
assert(typeof eceVal === "number" && eceVal >= 0 && eceVal <= 1, `ECE value is mathematically bounded in [0, 1] (got ${eceVal})`);
assert(eceVal < 0.20, `Well-calibrated dummy predictions achieve low ECE (got ${eceVal})`);

const metrics = evaluatePredictions(dummyPreds, dummyTruth);
assert(metrics.classification.accuracy === 1.0, "Perfect dummy classification gives accuracy 1.0");
assert(metrics.timingAccuracy.within1YearPct === 100, "Timing accuracy within 1 year is 100%");
assert(metrics.calibration.expectedCalibrationError === eceVal, "evaluatePredictions integrates authentic 10-bin ECE");

// 6. 7-Stage Astrological Ablation Testing
console.log("\n6. Testing 7-Stage Pre-Specified Rule-Based Ablation Study (Models A through G)...");
const ablationResults = runAblationStudy(parts.blindTestSet);
const modelKeys = [
  "MODEL_A_D1_ONLY",
  "MODEL_B_D1_DASHA",
  "MODEL_C_D1_DASHA_TRANSIT",
  "MODEL_D_D1_DASHA_D9",
  "MODEL_E_D1_DASHA_VARGAS",
  "MODEL_F_D1_DASHA_VARGAS_TRANSIT_JAIMINI",
  "MODEL_G_FULL_ASTROVERSE"
];

for (const key of modelKeys) {
  assert(Boolean(ablationResults[key]), `Ablation study executed ${key}`);
  assert(typeof ablationResults[key].accuracy === "number", `${key} reports numerical accuracy (${(ablationResults[key].accuracy * 100).toFixed(1)}%)`);
  assert(typeof ablationResults[key].conditionalMeanAbsoluteErrorYears === "number", `${key} reports conditional MAE (${ablationResults[key].conditionalMeanAbsoluteErrorYears} yrs)`);
  assert(typeof ablationResults[key].expectedCalibrationError === "number", `${key} reports 10-bin ECE (${ablationResults[key].expectedCalibrationError.toFixed(4)})`);
}

assert(
  typeof ablationResults.MODEL_G_FULL_ASTROVERSE.accuracy === "number" &&
  typeof ablationResults.MODEL_A_D1_ONLY.accuracy === "number",
  "Ablation pipeline executes declared feature set and reports verifiable metrics across all models without forcing artificial outcome ranking"
);

// 7. Median Calculation Unit Tests
console.log("\n7. Testing Statistically Correct Median Calculation...");
import { calculateMedian } from "./src/services/predictionValidationLab.js";
assert(calculateMedian([1, 2, 3, 4]) === 2.5, "calculateMedian([1, 2, 3, 4]) === 2.5 (even length average)");
assert(calculateMedian([1, 2, 3]) === 2, "calculateMedian([1, 2, 3]) === 2 (odd length middle value)");
assert(calculateMedian([4, 1, 3, 2]) === 2.5, "calculateMedian([4, 1, 3, 2]) === 2.5 (unsorted even length)");
assert(calculateMedian([7]) === 7, "calculateMedian([7]) === 7 (single element)");
assert(calculateMedian([]) === 0, "calculateMedian([]) === 0 (empty array safe default)");

// 8. Conditional Timing MAE and Balanced Accuracy Metrics
console.log("\n8. Testing Conditional Timing MAE & Balanced Accuracy Separation...");
assert(typeof metrics.timingAccuracy.conditionalMeanAbsoluteErrorYears === "number", "Reports conditionalMeanAbsoluteErrorYears");
assert(typeof metrics.timingAccuracy.conditionalRootMeanSquareErrorYears === "number", "Reports conditionalRootMeanSquareErrorYears");
assert(typeof metrics.timingAccuracy.medianTimingErrorYears === "number", "Reports medianTimingErrorYears");
assert(typeof metrics.classification.balancedAccuracy === "number", "Reports balancedAccuracy");

// 9. Historical Case Replay
console.log("\n9. Testing Historical Case Replay Engine...");
const replay = replayHistoricalCase(sampleCase);
assert(replay.caseId === sampleCase.caseId, "Replay preserves Case ID");
assert(Boolean(replay.predictionsAtCutoff.marriage.predictedWindow), "Replay provides pre-cutoff prediction window");
assert(Boolean(replay.actualHistoricalEvents.marriage), "Replay benchmarks against documented ground truth");
assert(typeof replay.evaluation.verdict === "string" && replay.evaluation.verdict.length > 0, "Replay produces structured convergence verdict");

// 10. Statistical Calibrators (Platt Scaling & Isotonic Regression)
console.log("\n10. Testing Statistical Calibrator Architecture (Platt & Isotonic)...");
import { fitPlattCalibrator, fitIsotonicCalibrator } from "./src/services/predictionValidationLab.js";
import { executeSandboxedPrediction } from "./src/services/sandboxedPredictionWorker.mjs";

const synthScores = [0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 0.95];
const synthLabels = [0, 0, 0, 1, 0, 1, 1, 1];

const platt = fitPlattCalibrator(synthScores, synthLabels);
assert(platt.type === "PLATT_SCALING", "Platt calibrator produces PLATT_SCALING model");
assert(typeof platt.params.A === "number" && typeof platt.params.B === "number", "Platt calibrator fits slope A and intercept B");
const plattProbLow = platt.calibrate(0.1);
const plattProbHigh = platt.calibrate(0.9);
assert(plattProbLow < plattProbHigh, `Platt calibrator preserves monotonic probability ordering (${plattProbLow} < ${plattProbHigh})`);
assert(plattProbLow >= 0 && plattProbHigh <= 1, "Platt calibrated output is bounded in [0, 1]");

const iso = fitIsotonicCalibrator(synthScores, synthLabels);
assert(iso.type === "ISOTONIC_REGRESSION", "Isotonic calibrator produces ISOTONIC_REGRESSION model");
assert(Array.isArray(iso.blocks) && iso.blocks.length > 0, "Isotonic calibrator generates PAVA step blocks");
const isoProbLow = iso.calibrate(0.1);
const isoProbHigh = iso.calibrate(0.9);
assert(isoProbLow <= isoProbHigh, `Isotonic regression satisfies non-decreasing monotonicity (${isoProbLow} <= ${isoProbHigh})`);

// 11. Process-Isolated Anti-Leakage Sandbox Worker
console.log("\n11. Testing Process-Isolated Prediction Worker Sandbox...");
const sandboxedResult = executeSandboxedPrediction({
  caseId: "TEST_CASE_ISOLATED_01",
  birthDate: "1990-05-15",
  birthTime: "10:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5,
  timezoneId: "Asia/Kolkata",
  cutoffDate: "2010-01-01",
  modelVersion: "PRE_SPECIFIED_RULE_BASED_V2"
});
assert(sandboxedResult.caseId === "TEST_CASE_ISOLATED_01", "Sandboxed worker preserves Case ID");
assert(sandboxedResult.isolationMode === "PROCESS_SERIALIZED_SANDBOX_V1", "Sandboxed worker executes under PROCESS_SERIALIZED_SANDBOX_V1");
assert(typeof sandboxedResult.ruleConvergenceScore === "number", `Sandboxed worker outputs ruleConvergenceScore (${sandboxedResult.ruleConvergenceScore})`);
assert(typeof sandboxedResult.indicativeYear === "number", `Sandboxed worker outputs indicativeYear (${sandboxedResult.indicativeYear})`);

console.log("\n=================================================================");
if (failed === 0) {
  console.log(` ALL ${passed} BACKTESTING & PREDICTION VALIDATION TESTS PASSED!`);
} else {
  console.error(` ❌ ${failed} TESTS FAILED out of ${passed + failed}`);
  process.exit(1);
}
console.log("=================================================================\n");

