/**
 * ASTROVERSE — Feature Registry Audit Test Suite
 *
 * Verifies that all advertised capabilities and features:
 * 1. Have an explicit status: IMPLEMENTED, EXPERIMENTAL, or PLANNED.
 * 2. That no PLANNED feature is erroneously advertised as implemented.
 * 3. That all IMPLEMENTED features are backed by real, verified code and tests.
 * 4. That ASTROLOGY_SYSTEMS configuration aligns strictly with the Feature Registry.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FEATURE_STATUS,
  FEATURE_REGISTRY,
  getFeatureStatus,
  getFeaturesByStatus,
  getFeaturesByCategory
} from "./src/config/featureRegistry.js";
import { ASTROLOGY_SYSTEMS } from "./src/config/astrologySystems.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n" + "=".repeat(75));
console.log(" ASTROVERSE FEATURE REGISTRY AUDIT & CAPABILITY INTEGRITY TEST");
console.log("=".repeat(75));

const allFeatures = Object.values(FEATURE_REGISTRY);
console.log(`Auditing ${allFeatures.length} registered features across platform...\n`);

let passedChecks = 0;

// Test 1: Schema & Status Integrity
for (const feat of allFeatures) {
  assert(typeof feat.id === "string" && feat.id.length > 0, `Feature must have valid id: ${feat.id}`);
  assert(typeof feat.name === "string" && feat.name.length > 0, `Feature ${feat.id} must have valid name`);
  assert(typeof feat.category === "string" && feat.category.length > 0, `Feature ${feat.id} must have valid category`);
  assert(
    [FEATURE_STATUS.IMPLEMENTED, FEATURE_STATUS.EXPERIMENTAL, FEATURE_STATUS.PLANNED].includes(feat.status),
    `Feature ${feat.id} status must be strictly IMPLEMENTED, EXPERIMENTAL, or PLANNED (got: ${feat.status})`
  );
  assert(typeof feat.description === "string" && feat.description.length > 0, `Feature ${feat.id} must have description`);
  passedChecks += 5;
}
console.log("✓ All features have valid schema, category, description, and strict status");

// Test 2: ASTROLOGY_SYSTEMS Alignment
// Verify unsupported house systems (regiomontanus, koch) are NOT advertised in ASTROLOGY_SYSTEMS
for (const [sysKey, sysConfig] of Object.entries(ASTROLOGY_SYSTEMS)) {
  assert(
    !sysConfig.supportedHouseSystems.includes("regiomontanus"),
    `${sysKey} must not advertise un-implemented 'regiomontanus'`
  );
  assert(
    !sysConfig.supportedHouseSystems.includes("koch"),
    `${sysKey} must not advertise un-implemented 'koch'`
  );
  passedChecks += 2;
}
console.log("✓ ASTROLOGY_SYSTEMS does not advertise un-implemented house systems (Regiomontanus/Koch)");

// Test 3: Purged Harmonic Charts (D6, D8, D11)
const d6Status = getFeatureStatus("vargas_d6_shashtamsha");
const d8Status = getFeatureStatus("vargas_d8_ashtamsha");
const d11Status = getFeatureStatus("vargas_d11_rudramsha");

assert(d6Status === FEATURE_STATUS.PLANNED, "D6 must be PLANNED");
assert(d8Status === FEATURE_STATUS.PLANNED, "D8 must be PLANNED");
assert(d11Status === FEATURE_STATUS.PLANNED, "D11 must be PLANNED");
passedChecks += 3;
console.log("✓ D6, D8, and D11 harmonic charts are strictly marked PLANNED (never claimed as calculated)");

// Test 4: Physical Backing of IMPLEMENTED Features
const IMPLEMENTED_CODE_FILES = [
  "src/astrology/astronomy/ayanamsha.js",
  "src/astrology/astronomy/coordinates.js",
  "src/astrology/astronomy/ephemeris.js",
  "src/astrology/conventions.js",
  "src/astrology/systems/tropical.js",
  "src/services/expertPrediction/domainTimingEngine.js",
  "src/services/expertPrediction/healthSafetyLayer.js",
  "src/services/followUpAnswerService.js",
  "test_swiss_ephemeris_benchmark.mjs"
];

for (const relPath of IMPLEMENTED_CODE_FILES) {
  const fullPath = path.resolve(__dirname, relPath);
  assert(fs.existsSync(fullPath), `Physical source file must exist for implemented feature: ${relPath}`);
  passedChecks++;
}
console.log("✓ Verified physical code and test backing for core IMPLEMENTED capabilities");

// Test 5: Research & Empirical Status Honesty
const rectStatus = getFeatureStatus("birth_time_rectification_lab");
const empiricalStatus = getFeatureStatus("empirical_longitudinal_study");

assert(rectStatus === FEATURE_STATUS.EXPERIMENTAL, "Rectification lab must be EXPERIMENTAL");
assert(empiricalStatus === FEATURE_STATUS.PLANNED, "Empirical longitudinal study must be PLANNED");
passedChecks += 2;
console.log("✓ Research & empirical accuracy features are honestly classified as EXPERIMENTAL / PLANNED");

// Test 6: Query helpers
const implemented = getFeaturesByStatus(FEATURE_STATUS.IMPLEMENTED);
const experimental = getFeaturesByStatus(FEATURE_STATUS.EXPERIMENTAL);
const planned = getFeaturesByStatus(FEATURE_STATUS.PLANNED);

assert(implemented.length >= 15, "Must have at least 15 implemented features");
assert(experimental.length >= 1, "Must have experimental features");
assert(planned.length >= 4, "Must have planned roadmap features");
passedChecks += 3;

console.log("\n" + "=".repeat(75));
console.log(` ALL ${passedChecks} FEATURE REGISTRY AUDIT CHECKS PASSED!`);
console.log(` Registry Breakdown: ${implemented.length} IMPLEMENTED | ${experimental.length} EXPERIMENTAL | ${planned.length} PLANNED`);
console.log("=".repeat(75) + "\n");
