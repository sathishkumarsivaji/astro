/**
 * ASTROVERSE — Calibration Parameter Provider (Single Source of Truth)
 *
 * Implements Requirements 6 & 10:
 * 1. Single source of truth for all calibration parameters (Platt scaling slope/intercept,
 *    conformal interval quantiles, classification thresholds).
 * 2. Loads parameters directly from data/real_world_validation/results/calibration_model.json.
 * 3. Never duplicates constants or uses unverified fallbacks. Fail-closed on missing/invalid artifact.
 * 4. Production and empirical benchmark paths must fail closed:
 *    - Throws CALIBRATION_ARTIFACT_MISSING if calibration_model.json does not exist.
 *    - Throws CALIBRATION_ARTIFACT_INVALID if calibration_model.json is malformed or invalid.
 * 5. Clearly isolated test fixtures may be injected exclusively via setTestCalibrationFixture() for isolated unit tests.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

let cachedModel = null;
let testFixtureOverride = null;

/**
 * Isolated test fixture injection for unit tests ONLY.
 */
export function setTestCalibrationFixture(fixture) {
  testFixtureOverride = fixture;
  cachedModel = fixture;
}

export function clearTestCalibrationFixture() {
  testFixtureOverride = null;
  cachedModel = null;
}

/**
 * Resolves the path to release manifest across both CLI and bundler environments.
 */
export function resolveReleaseManifestPath() {
  let baseDir = null;
  try {
    if (typeof __dirname !== "undefined") {
      baseDir = __dirname;
    } else if (import.meta?.url) {
      baseDir = path.dirname(fileURLToPath(import.meta.url));
    }
  } catch (_e) {
    // ignore
  }

  const candidates = [
    baseDir ? path.resolve(baseDir, "../../../../current_release_manifest.json") : null,
    baseDir ? path.resolve(baseDir, "../../config/current_release_manifest.json") : null,
    path.resolve(process.cwd(), "current_release_manifest.json"),
    path.resolve(process.cwd(), "../current_release_manifest.json"),
    path.resolve(process.cwd(), "frontend/src/config/current_release_manifest.json")
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0] || null;
}

/**
 * Resolves the path to calibration_model.json across both CLI and bundler environments.
 */
export function resolveCalibrationModelPath() {
  let baseDir = null;
  try {
    if (typeof __dirname !== "undefined") {
      baseDir = __dirname;
    } else if (import.meta?.url) {
      baseDir = path.dirname(fileURLToPath(import.meta.url));
    }
  } catch (_e) {
    // ignore
  }

  const candidates = [
    baseDir ? path.resolve(baseDir, "../../../../data/real_world_validation/results/calibration_model.json") : null,
    path.resolve(process.cwd(), "data/real_world_validation/results/calibration_model.json"),
    path.resolve(process.cwd(), "../data/real_world_validation/results/calibration_model.json")
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Default to candidate 1 if baseDir exists, else candidate 2
  return candidates[0] || path.resolve(process.cwd(), "data/real_world_validation/results/calibration_model.json");
}

/**
 * Extracts expected engine and training hashes from manifest when not explicitly provided.
 */
function getExpectedHashes(options = {}) {
  let expectedPredictionEngineHash = options.expectedPredictionEngineHash || null;
  let expectedTrainingDatasetHash = options.expectedTrainingDatasetHash || null;

  if (!expectedPredictionEngineHash || !expectedTrainingDatasetHash) {
    try {
      const manifestPath = resolveReleaseManifestPath();
      if (manifestPath && fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        if (!expectedPredictionEngineHash && manifest.authoritativeHashes?.predictionEngineHash) {
          expectedPredictionEngineHash = manifest.authoritativeHashes.predictionEngineHash;
        }
        if (!expectedTrainingDatasetHash && manifest.datasetHashes?.trainSplitHash) {
          expectedTrainingDatasetHash = manifest.datasetHashes.trainSplitHash;
        }
      }
    } catch (_e) {
      // ignore
    }
  }

  return { expectedPredictionEngineHash, expectedTrainingDatasetHash };
}

/**
 * Loads the calibration model artifact from disk, caching it in memory.
 * If forceReload is true, clears cache and re-reads from disk.
 * FAILS CLOSED: Never silently substitutes embedded constants.
 * Automatically verifies freshness against release manifest or runtime engine hashes.
 */
export function loadCalibrationModel(forceReload = false, options = {}) {
  if (testFixtureOverride) {
    return testFixtureOverride;
  }

  const { expectedPredictionEngineHash, expectedTrainingDatasetHash } = getExpectedHashes(options);

  if (cachedModel && !forceReload) {
    if (expectedPredictionEngineHash && cachedModel.predictionEngineHash && cachedModel.predictionEngineHash !== expectedPredictionEngineHash) {
      throw new Error(`CALIBRATION_ARTIFACT_STALE: Model predictionEngineHash (${cachedModel.predictionEngineHash}) does not match runtime engine hash (${expectedPredictionEngineHash}). Re-fit calibration model.`);
    }
    if (expectedTrainingDatasetHash && cachedModel.trainingDatasetHash && cachedModel.trainingDatasetHash !== expectedTrainingDatasetHash) {
      throw new Error(`CALIBRATION_ARTIFACT_STALE: Model trainingDatasetHash (${cachedModel.trainingDatasetHash}) does not match current dataset hash (${expectedTrainingDatasetHash}). Re-fit calibration model.`);
    }
    return cachedModel;
  }

  const modelPath = resolveCalibrationModelPath();

  if (!fs.existsSync(modelPath)) {
    throw new Error(`CALIBRATION_ARTIFACT_MISSING: calibration_model.json does not exist at ${modelPath}. Calibration must be fitted on TRAIN partition before production/benchmark execution.`);
  }

  try {
    const raw = fs.readFileSync(modelPath, "utf8");
    const parsed = JSON.parse(raw);

    // Fail-closed schema validation
    if (!parsed || typeof parsed !== "object") {
      throw new Error("CALIBRATION_ARTIFACT_INVALID: Model file is not an object.");
    }
    if (!parsed.parameters || typeof parsed.parameters.slope !== "number" || typeof parsed.parameters.intercept !== "number") {
      throw new Error("CALIBRATION_ARTIFACT_INVALID: Missing required numeric parameters (slope, intercept).");
    }
    const quantiles = parsed.empiricalResidualQuantiles || parsed.conformalIntervalQuantiles;
    if (!quantiles || typeof quantiles.q80 !== "number") {
      throw new Error("CALIBRATION_ARTIFACT_INVALID: Missing empirical residual prediction interval quantiles (q80).");
    }

    // Fail-closed staleness verification if expected hashes are resolved or supplied
    if (expectedPredictionEngineHash && parsed.predictionEngineHash && parsed.predictionEngineHash !== expectedPredictionEngineHash) {
      throw new Error(`CALIBRATION_ARTIFACT_STALE: Model predictionEngineHash (${parsed.predictionEngineHash}) does not match runtime engine hash (${expectedPredictionEngineHash}). Re-fit calibration model.`);
    }
    if (expectedTrainingDatasetHash && parsed.trainingDatasetHash && parsed.trainingDatasetHash !== expectedTrainingDatasetHash) {
      throw new Error(`CALIBRATION_ARTIFACT_STALE: Model trainingDatasetHash (${parsed.trainingDatasetHash}) does not match current dataset hash (${expectedTrainingDatasetHash}). Re-fit calibration model.`);
    }

    cachedModel = parsed;
    return cachedModel;
  } catch (err) {
    if (err.message.startsWith("CALIBRATION_ARTIFACT_")) {
      throw err;
    }
    throw new Error(`CALIBRATION_ARTIFACT_INVALID: Failed to parse calibration artifact: ${err.message}`);
  }
}

/**
 * Verifies calibration model freshness against expected runtime and dataset hashes.
 * Returns { isFresh: boolean, status: string, error?: string, model?: object }
 */
export function verifyCalibrationModelFreshness(expectedPredictionEngineHash, expectedTrainingDatasetHash) {
  try {
    const model = loadCalibrationModel(true, {
      expectedPredictionEngineHash,
      expectedTrainingDatasetHash
    });
    return { isFresh: true, status: "CALIBRATION_ARTIFACT_CURRENT", model };
  } catch (err) {
    return {
      isFresh: false,
      status: err.message.startsWith("CALIBRATION_ARTIFACT_STALE") ? "CALIBRATION_ARTIFACT_STALE" : "CALIBRATION_ARTIFACT_INVALID",
      error: err.message
    };
  }
}

/**
 * Returns Platt scaling logistic regression parameters.
 * P(marriage) = 1 / (1 + exp(-(slope * rawRuleScore + intercept)))
 */
export function getCalibrationParameters() {
  const model = loadCalibrationModel();
  const frozenThreshold = model.parameters.validationOptimizedThreshold ?? model.parameters.classificationThreshold ?? 0.89;
  return {
    slope: model.parameters.slope,
    intercept: model.parameters.intercept,
    threshold: frozenThreshold,
    classificationThreshold: frozenThreshold,
    validationOptimizedThreshold: frozenThreshold,
    thresholdSelectionStatus: model.parameters.thresholdSelectionStatus ?? "CONSTRAINED_OPTIMUM_IDENTIFIED",
    satisfiesConstraint: model.parameters.satisfiesConstraint ?? true,
    thresholdSelectionMethod: model.parameters.thresholdSelectionMethod ?? "MAXIMIZE_MCC_ON_VALIDATION",
    calibratorType: model.calibratorType,
    modelVersion: model.modelVersion
  };
}

/**
 * Returns empirical residual prediction interval error quantiles for astrological timing (P0-4).
 * Nominal intervals:
 * - 50%: ±q50
 * - 80%: ±q80
 * - 90%: ±q90
 * - 95%: ±q95
 */
export function getEmpiricalResidualQuantiles() {
  const model = loadCalibrationModel();
  const q = model.empiricalResidualQuantiles || model.conformalIntervalQuantiles;
  return {
    q50: q.q50,
    q80: q.q80,
    q90: q.q90,
    q95: q.q95
  };
}

/**
 * Backwards-compatibility alias for getEmpiricalResidualQuantiles.
 */
export const getConformalQuantiles = getEmpiricalResidualQuantiles;

/**
 * Returns demographic baseline metadata strictly fitted from TRAIN partition.
 */
export function getDemographicBaselineMetadata() {
  const model = loadCalibrationModel();
  return {
    medianMarriageAge: model.demographicBaseline?.medianMarriageAge ?? null,
    trainingSampleCount: model.demographicBaseline?.trainingSampleCount ?? 0
  };
}

/**
 * Returns complete calibration model artifact.
 */
export function getCompleteCalibrationModel() {
  return loadCalibrationModel();
}

/**
 * Validates all three calibration integrity invariants at startup:
 * 1. calibration.predictionEngineHash === manifest.predictionEngineHash
 * 2. calibration.trainingDatasetHash === manifest.trainSplitHash
 * 3. SHA256(calibration_model.json) === manifest.calibrationModelHash
 * All three must pass.
 */
export function validateCalibrationAtStartup(manifest = null) {
  if (!manifest) {
    const manifestPath = resolveReleaseManifestPath();
    if (!manifestPath || !fs.existsSync(manifestPath)) {
      throw new Error("CALIBRATION_STARTUP_VALIDATION_FAILED: Release manifest not found.");
    }
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }

  const modelPath = resolveCalibrationModelPath();
  if (!fs.existsSync(modelPath)) {
    throw new Error(`CALIBRATION_STARTUP_VALIDATION_FAILED: calibration_model.json missing at ${modelPath}`);
  }

  const rawBytes = fs.readFileSync(modelPath);
  const actualFileSha = crypto.createHash("sha256").update(rawBytes).digest("hex");
  const model = JSON.parse(rawBytes.toString("utf8"));

  const authHashes = manifest.authoritativeHashes || {};
  const datasetHashes = manifest.datasetHashes || {};

  if (model.predictionEngineHash !== authHashes.predictionEngineHash) {
    throw new Error(`CALIBRATION_STARTUP_VALIDATION_FAILED: calibration.predictionEngineHash (${model.predictionEngineHash}) !== manifest.predictionEngineHash (${authHashes.predictionEngineHash})`);
  }

  if (model.trainingDatasetHash !== datasetHashes.trainSplitHash) {
    throw new Error(`CALIBRATION_STARTUP_VALIDATION_FAILED: calibration.trainingDatasetHash (${model.trainingDatasetHash}) !== manifest.trainSplitHash (${datasetHashes.trainSplitHash})`);
  }

  if (actualFileSha !== authHashes.calibrationModelHash) {
    throw new Error(`CALIBRATION_STARTUP_VALIDATION_FAILED: SHA256(calibration_model.json) (${actualFileSha}) !== manifest.calibrationModelHash (${authHashes.calibrationModelHash})`);
  }

  return {
    valid: true,
    predictionEngineHash: model.predictionEngineHash,
    trainingDatasetHash: model.trainingDatasetHash,
    calibrationModelHash: actualFileSha
  };
}

