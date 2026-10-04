/**
 * ASTROVERSE — Release Manifest Integrity Verification Suite
 *
 * Verifies that current_release_manifest.json is strictly synchronized with:
 * 1. Runtime calculation & prediction engine component hashes (LF normalized)
 * 2. Prediction engine aggregate hash
 * 3. Fitted calibration model artifact hash
 * 4. Partition dataset hashes (TRAIN, VAL, BLIND, HOLDOUT, BENCHMARKS)
 *
 * Exits non-zero if ANY manifest value is stale or mismatched.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "current_release_manifest.json");

console.log("\n" + "=".repeat(75));
console.log(" CURRENT RELEASE MANIFEST INTEGRITY VERIFICATION SUITE");
console.log("=".repeat(75) + "\n");

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error("✗ FAIL: current_release_manifest.json does not exist at repo root");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
let passed = 0;
let failed = 0;

function assert(condition, label, actual, expected) {
  if (condition) {
    console.log(`  ✓ ${label}: ${actual}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    console.error(`     Actual:   ${actual}`);
    console.error(`     Manifest: ${expected}`);
    failed++;
  }
}

function lfHash(filePath) {
  const content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function byteHash(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

// 1. Authoritative Component Hashes
console.log("[1] Checking Authoritative Runtime Component Hashes:");

const astroEnginePath = path.join(ROOT, "frontend/src/services/astroEngine.js");
const actualAstroHash = lfHash(astroEnginePath);
assert(
  actualAstroHash === manifest.authoritativeHashes.astroEngineHash,
  "astroEngineHash matches runtime",
  actualAstroHash,
  manifest.authoritativeHashes.astroEngineHash
);

const empiricalEvaluationEnginePath = path.join(ROOT, "frontend/src/services/realWorldValidation/empiricalEvaluationEngine.js");
const actualEmpiricalHash = lfHash(empiricalEvaluationEnginePath);
assert(
  actualEmpiricalHash === manifest.authoritativeHashes.empiricalEvaluationEngineHash,
  "empiricalEvaluationEngineHash matches runtime",
  actualEmpiricalHash,
  manifest.authoritativeHashes.empiricalEvaluationEngineHash
);

const discreteHazardSurvivalEnginePath = path.join(ROOT, "frontend/src/services/realWorldValidation/discreteHazardSurvivalEngine.js");
const actualDiscreteHazardHash = lfHash(discreteHazardSurvivalEnginePath);
if (manifest.authoritativeHashes.discreteHazardSurvivalEngineHash) {
  assert(
    actualDiscreteHazardHash === manifest.authoritativeHashes.discreteHazardSurvivalEngineHash,
    "discreteHazardSurvivalEngineHash matches runtime",
    actualDiscreteHazardHash,
    manifest.authoritativeHashes.discreteHazardSurvivalEngineHash
  );
}

const expectedAggregate = crypto.createHash("sha256")
  .update(actualAstroHash + actualEmpiricalHash + actualDiscreteHazardHash, "utf8")
  .digest("hex");
assert(
  expectedAggregate === manifest.authoritativeHashes.predictionEngineHash,
  "predictionEngineHash aggregate matches composite runtime",
  expectedAggregate,
  manifest.authoritativeHashes.predictionEngineHash
);

const calibrationModelPath = path.join(ROOT, "data/real_world_validation/results/calibration_model.json");
const actualCalibrationHash = byteHash(calibrationModelPath);
assert(
  actualCalibrationHash === manifest.authoritativeHashes.calibrationModelHash,
  "calibrationModelHash matches fitted artifact",
  actualCalibrationHash,
  manifest.authoritativeHashes.calibrationModelHash
);

// 2. Dataset Hashes
console.log("\n[2] Checking Dataset Partition Hashes:");

const datasets = [
  { key: "trainSplitHash", file: "data/real_world_validation/splits/train.json" },
  { key: "valSplitHash", file: "data/real_world_validation/splits/val.json" },
  { key: "blindTestSplitHash", file: "data/real_world_validation/splits/blind_test.json" },
  { key: "internalHoldoutSplitHash", file: "data/real_world_validation/splits/internal_holdout.json" },
  { key: "astroDatabankTrueIndependentHash", file: "data/real_world_validation/results/astro_databank_external_benchmark.json" },
  { key: "overlapManifestHash", file: "data/real_world_validation/splits/split_manifest.json" }
];

for (const ds of datasets) {
  const dsPath = path.join(ROOT, ds.file);
  const actualHash = byteHash(dsPath);
  assert(
    actualHash === manifest.datasetHashes[ds.key],
    `${ds.key} (${ds.file})`,
    actualHash,
    manifest.datasetHashes[ds.key]
  );
}

console.log("\n" + "=".repeat(75));
console.log(` RESULT: ${passed} passed, ${failed} failed`);
console.log("=".repeat(75) + "\n");

process.exit(failed > 0 ? 1 : 0);
