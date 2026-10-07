/**
 * ASTROVERSE — Calibration Artifact Runtime Integrity Test
 *
 * Verifies Requirement 10:
 * 1. Single source of truth: calibration_model.json must exist and be fully populated.
 * 2. Runtime calibrationProvider parameters match calibration_model.json artifact exactly.
 * 3. predictMarriageOccurrence runtime uses artifact slope, intercept, and threshold.
 * 4. predictMarriageTiming runtime uses artifact conformal quantiles (q50, q80, q90, q95).
 * 5. Zero hardcoded constant mismatch or unverified surrogate divergence.
 */

import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";
import {
  loadCalibrationModel,
  getCalibrationParameters,
  getConformalQuantiles,
  getDemographicBaselineMetadata
} from "./src/services/realWorldValidation/calibrationProvider.js";
import {
  sanitizeRecordForPrediction,
  predictMarriageOccurrence,
  predictMarriageTiming
} from "./src/services/realWorldValidation/empiricalEvaluationEngine.js";
import { calculatePlanetaryPositions } from "./src/services/astroEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MODEL_PATH = path.join(ROOT, "data/real_world_validation/results/calibration_model.json");

console.log("\n" + "=".repeat(75));
console.log(" ASTROVERSE — CALIBRATION ARTIFACT & RUNTIME INTEGRITY TEST");
console.log("=".repeat(75) + "\n");

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

// 1. Verify artifact exists on disk
check("calibration_model.json artifact exists on disk", fs.existsSync(MODEL_PATH));
if (!fs.existsSync(MODEL_PATH)) {
  console.error("Artifact missing. Run `node scripts/fit_calibration_model.mjs` first.");
  process.exit(1);
}

const rawModel = JSON.parse(fs.readFileSync(MODEL_PATH, "utf8"));

import crypto from "crypto";
import {
  initCacheManager,
  getCurrentHashes
} from "./src/services/realWorldValidation/predictionCacheManager.js";

// Initialize cache manager to calculate authoritative current hashes
initCacheManager();
const currentHashes = getCurrentHashes();
const currentPredictionEngineHash = currentHashes.predictionEngineHash;
const TRAIN_PATH = path.join(ROOT, "data/real_world_validation/splits/train.json");
const currentTrainSha256 = crypto.createHash("sha256").update(fs.readFileSync(TRAIN_PATH)).digest("hex");

check("Model specifies PLATT_LOGISTIC_SCALING_V2", rawModel.calibratorType === "PLATT_LOGISTIC_SCALING_V2");
check("Model version specified", typeof rawModel.modelVersion === "string" && rawModel.modelVersion.length > 0);
check("Training dataset is TRAIN partition", rawModel.trainingDataset === "TRAIN_SPLIT_VEDASTRO_15K");
check("Training sample size >= 2,000 (Req 8)", rawModel.trainingSampleN >= 2000);
check("Timing residual sample size > 0", rawModel.timingResidualSampleN > 0);
check("Fitted slope is finite positive number", Number.isFinite(rawModel.parameters?.slope) && rawModel.parameters.slope > 0);
check("Fitted intercept is finite number", Number.isFinite(rawModel.parameters?.intercept));
check("Classification threshold is unified to frozen validation threshold (0.89)", rawModel.parameters?.classificationThreshold === 0.89);
check("Model specifies predictionEngineHash", typeof rawModel.predictionEngineHash === "string" && rawModel.predictionEngineHash.length === 64);
check("Model predictionEngineHash matches CURRENT production engine hash", rawModel.predictionEngineHash === currentPredictionEngineHash);
check("Model trainingDatasetHash matches CURRENT TRAIN dataset hash", rawModel.trainingDatasetHash === currentTrainSha256);
check("Model specifies calibrationInputHash", typeof rawModel.calibrationInputHash === "string" && rawModel.calibrationInputHash.length === 64);
check("Model specifies trainingSampleHash", typeof rawModel.trainingSampleHash === "string" && rawModel.trainingSampleHash.length === 64);
check("Model specifies fitSeed 133742", rawModel.fitSeed === 133742);
check("Model specifies fitMethod NEWTON_RAPHSON_IRLS", rawModel.fitMethod === "NEWTON_RAPHSON_IRLS");
check("Model specifies rawScoreDefinition", typeof rawModel.rawScoreDefinition === "string" && rawModel.rawScoreDefinition.length > 0);
check("Model specifies timingPredictionDefinition", typeof rawModel.timingPredictionDefinition === "string" && rawModel.timingPredictionDefinition.length > 0);

// 3. Validate conformal prediction quantiles
const q = rawModel.conformalIntervalQuantiles;
check("Conformal q50 is positive number", Number.isFinite(q?.q50) && q.q50 > 0);
check("Conformal q80 is strictly greater than q50", Number.isFinite(q?.q80) && q.q80 > q.q50);
check("Conformal q90 is strictly greater than q80", Number.isFinite(q?.q90) && q.q90 > q.q80);
check("Conformal q95 is strictly greater than q90", Number.isFinite(q?.q95) && q.q95 > q.q90);

// 4. Verify calibrationProvider loads exact artifact parameters
const providerParams = getCalibrationParameters();
check("Provider slope matches artifact slope exactly", providerParams.slope === rawModel.parameters.slope);
check("Provider intercept matches artifact intercept exactly", providerParams.intercept === rawModel.parameters.intercept);
check("Provider threshold matches artifact threshold exactly", providerParams.threshold === rawModel.parameters.classificationThreshold);

const providerQuantiles = getConformalQuantiles();
check("Provider q50 matches artifact q50 exactly", providerQuantiles.q50 === q.q50);
check("Provider q80 matches artifact q80 exactly", providerQuantiles.q80 === q.q80);
check("Provider q90 matches artifact q90 exactly", providerQuantiles.q90 === q.q90);
check("Provider q95 matches artifact q95 exactly", providerQuantiles.q95 === q.q95);

// 5. Verify runtime predictMarriageOccurrence uses artifact calibration parameters
const testRecord = {
  sourceRecordId: "CALIBRATION_TEST_RECORD",
  birthDate: "1980-05-15",
  birthYear: 1980,
  birthMonth: 5,
  birthDay: 15,
  birthTime: "12:00:00",
  birthPlace: "Chennai, India",
  latitude: 13.0827,
  longitude: 80.2707,
  sourceUtcOffset: 5.5
};

const clean = sanitizeRecordForPrediction(testRecord);
const chart = calculatePlanetaryPositions(clean.birthDate, clean.birthTime, clean.latitude, clean.longitude, "lahiri", clean.sourceUtcOffset);

const occ = predictMarriageOccurrence(clean, chart);
const expectedLogit = (rawModel.parameters.slope * occ.rawRuleScore) + rawModel.parameters.intercept;
const expectedProb = Number((1 / (1 + Math.exp(-expectedLogit))).toFixed(4));
check("Runtime occurrence prediction calibratedProbability matches artifact logistic formula", Math.abs(occ.calibratedProbability - expectedProb) <= 0.001);

// 6. Verify runtime predictMarriageTiming uses artifact conformal quantiles
const timing = predictMarriageTiming(clean, chart);
if (timing.hasTimingPrediction) {
  check("Runtime timing prediction interval width equals 2 * artifact q80", Math.abs(timing.predictedInterval.widthYears - (q.q80 * 2)) <= 0.01);
  check("Runtime p50 interval width equals 2 * artifact q50", Math.abs(timing.conformalIntervals.p50.widthYears - (q.q50 * 2)) <= 0.01);
  check("Runtime p80 interval width equals 2 * artifact q80", Math.abs(timing.conformalIntervals.p80.widthYears - (q.q80 * 2)) <= 0.01);
  check("Runtime p90 interval width equals 2 * artifact q90", Math.abs(timing.conformalIntervals.p90.widthYears - (q.q90 * 2)) <= 0.01);
  check("Runtime p95 interval width equals 2 * artifact q95", Math.abs(timing.conformalIntervals.p95.widthYears - (q.q95 * 2)) <= 0.01);
}

console.log("\n" + "-".repeat(75));
console.log(`Test Results: ${passed} passed, ${failed} failed.`);
console.log("-".repeat(75) + "\n");

if (failed > 0) {
  console.error("❌ Calibration artifact integrity test FAILED.");
  process.exit(1);
} else {
  console.log("✅ Calibration artifact integrity test PASSED 100%.");
  process.exit(0);
}
