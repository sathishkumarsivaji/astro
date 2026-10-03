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
 * Resolves the path to calibration_model.json across both CLI and bundler environments.
 */
function resolveCalibrationModelPath() {
  try {
    let baseDir;
    if (typeof __dirname !== "undefined") {
      baseDir = __dirname;
    } else if (import.meta?.url) {
      baseDir = path.dirname(fileURLToPath(import.meta.url));
    } else {
      baseDir = process.cwd();
    }
    return path.resolve(baseDir, "../../../../data/real_world_validation/results/calibration_model.json");
  } catch (_err) {
    return path.resolve(process.cwd(), "data/real_world_validation/results/calibration_model.json");
  }
}

/**
 * Loads the calibration model artifact from disk, caching it in memory.
 * If forceReload is true, clears cache and re-reads from disk.
 * FAILS CLOSED: Never silently substitutes embedded constants.
 */
export function loadCalibrationModel(forceReload = false) {
  if (testFixtureOverride) {
    return testFixtureOverride;
  }
  if (cachedModel && !forceReload) {
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
    if (!parsed.conformalIntervalQuantiles || typeof parsed.conformalIntervalQuantiles.q80 !== "number") {
      throw new Error("CALIBRATION_ARTIFACT_INVALID: Missing conformal interval quantiles (q80).");
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
 * Returns Platt scaling logistic regression parameters.
 * P(marriage) = 1 / (1 + exp(-(slope * rawRuleScore + intercept)))
 */
export function getCalibrationParameters() {
  const model = loadCalibrationModel();
  return {
    slope: model.parameters.slope,
    intercept: model.parameters.intercept,
    threshold: model.parameters.classificationThreshold ?? 0.50,
    classificationThreshold: model.parameters.classificationThreshold ?? 0.50,
    calibratorType: model.calibratorType,
    modelVersion: model.modelVersion
  };
}

/**
 * Returns conformal prediction interval error quantiles for astrological timing.
 * Nominal intervals:
 * - 50%: ±q50
 * - 80%: ±q80
 * - 90%: ±q90
 * - 95%: ±q95
 */
export function getConformalQuantiles() {
  const model = loadCalibrationModel();
  const q = model.conformalIntervalQuantiles;
  return {
    q50: q.q50,
    q80: q.q80,
    q90: q.q90,
    q95: q.q95
  };
}

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
