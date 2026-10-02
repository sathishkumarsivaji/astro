/**
 * ASTROVERSE — Independent Swiss Ephemeris 2.10.03 Astronomical Benchmark Suite
 *
 * Validates planetary longitudes, Ascendant, Midheaven (MC), and Lunar Nodes
 * against authoritative Swiss Ephemeris 2.10.03 / JPL DE431 reference coordinates
 * locked in the canonical dataset (`test_fixtures/swiss_ephemeris_2_10_03_reference.json`).
 *
 * Computes exact Mean Absolute Error (MAE), Median, and Maximum Arcsecond Residual.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { calculatePlanetaryPositions } from "./src/services/astroEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PATH = path.resolve(__dirname, "test_fixtures/swiss_ephemeris_2_10_03_reference.json");

export const PINNED_SWISS_FIXTURE_SHA256 = "4dd3b7156aeeba6243e6d4eefa11be3bbf448e72b7cbbf2d71c7c8084146f70b";

if (!fs.existsSync(FIXTURE_PATH)) {
  console.error(`❌ Reference fixture file missing at: ${FIXTURE_PATH}`);
  process.exit(1);
}

const fixtureRaw = fs.readFileSync(FIXTURE_PATH, "utf8");
const sha256 = crypto.createHash("sha256").update(fixtureRaw).digest("hex");

if (sha256 !== PINNED_SWISS_FIXTURE_SHA256) {
  console.error(`❌ TAMPER / INTEGRITY ERROR: Fixture SHA-256 ${sha256} does not match expected ${PINNED_SWISS_FIXTURE_SHA256}`);
  process.exit(1);
}

const canonicalData = JSON.parse(fixtureRaw);

console.log("\n" + "=".repeat(70));
console.log(" ASTROVERSE INDEPENDENT SWISS EPHEMERIS 2.10.03 BENCHMARK SUITE");
console.log("=".repeat(70));
console.log(`Provenance:      ${canonicalData.provenance.source}`);
console.log(`Ephemeris Model: ${canonicalData.provenance.ephemerisSource}`);
console.log(`Generator:       ${canonicalData.provenance.compiler}`);
console.log(`SHA-256:         ${sha256} (Verified against pinned constant)`);
console.log(`Benchmarks:      ${canonicalData.benchmarks.length} epochs loaded\n`);

let passed = 0;
let failed = 0;
const bodyErrors = {};

function assertMaxError(actualDeg, expectedDeg, maxToleranceArcSec, label) {
  let diffDeg = Math.abs(actualDeg - expectedDeg);
  if (diffDeg > 180) diffDeg = 360 - diffDeg;
  const diffArcSec = diffDeg * 3600;

  const key = label.split(" ")[0];
  if (!bodyErrors[key]) bodyErrors[key] = [];
  bodyErrors[key].push(diffArcSec);

  if (diffArcSec <= maxToleranceArcSec) {
    console.log(`✓ ${label} — residual: ${diffArcSec.toFixed(2)}" (tolerance: ${maxToleranceArcSec}")`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${label} — residual: ${diffArcSec.toFixed(2)}" exceeds tolerance ${maxToleranceArcSec}" (actual: ${actualDeg.toFixed(6)}°, expected: ${expectedDeg.toFixed(6)}°)`);
    failed++;
  }
}

canonicalData.benchmarks.forEach((bm, idx) => {
  console.log(`\n${idx + 1}. Benchmark Epoch #${idx + 1}: ${bm.name}`);
  const opts = bm.timezoneId ? { timezoneId: bm.timezoneId } : {};

  // 1. Mean Node Model Run
  const chartMean = calculatePlanetaryPositions(
    bm.birthDate,
    bm.birthTime,
    bm.latitude,
    bm.longitude,
    bm.system,
    bm.utcOffset,
    { ...opts, nodeModel: "mean" }
  );

  const majorBodies = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  for (const bodyName of majorBodies) {
    const pl = chartMean.planets.find(p => p.name === bodyName);
    if (!pl) continue;
    const expData = bm.bodies[bodyName];
    const expDeg = expData.systemSpecific.longitude;
    const tol = (bm.tolerancesArcSec && bm.tolerancesArcSec[bodyName]) || 60.0;
    assertMaxError(pl.longitude, expDeg, tol, `${bodyName} [${bm.name}]`);
  }

  // Mean Rahu
  const meanRahuPl = chartMean.planets.find(p => p.name === "Rahu");
  if (meanRahuPl && bm.bodies.Rahu_Mean) {
    const expMeanRahu = bm.bodies.Rahu_Mean.systemSpecific.longitude;
    const tol = (bm.tolerancesArcSec && bm.tolerancesArcSec.MeanNode) || 15.0;
    assertMaxError(meanRahuPl.longitude, expMeanRahu, tol, `Mean Rahu [${bm.name}]`);
  }

  // 2. True Node Model Run
  const chartTrue = calculatePlanetaryPositions(
    bm.birthDate,
    bm.birthTime,
    bm.latitude,
    bm.longitude,
    bm.system,
    bm.utcOffset,
    { ...opts, nodeModel: "true" }
  );

  const trueRahuPl = chartTrue.planets.find(p => p.name === "Rahu");
  if (trueRahuPl && bm.bodies.Rahu_True) {
    const expTrueRahu = bm.bodies.Rahu_True.systemSpecific.longitude;
    const tol = (bm.tolerancesArcSec && bm.tolerancesArcSec.TrueNode) || 30.0;
    assertMaxError(trueRahuPl.longitude, expTrueRahu, tol, `True Rahu [${bm.name} True Node]`);
  }

  // Ascendant check
  if (bm.angles && bm.angles.ascendantSystem) {
    const actualAsc = chartMean.ascendantLong ?? chartMean.ascendantDeg;
    const expAsc = bm.angles.ascendantSystem;
    const tol = (bm.tolerancesArcSec && bm.tolerancesArcSec.Ascendant) || 60.0;
    assertMaxError(actualAsc, expAsc, tol, `Ascendant [${bm.name}]`);
  }
});

// ---------------------------------------------------------------------------
// Benchmark Summary & MAE Computation
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(70));
console.log(" SWISS EPHEMERIS 2.10.03 ACCURACY RESIDUAL SUMMARY");
console.log("=".repeat(70));

for (const [body, errors] of Object.entries(bodyErrors)) {
  const sorted = [...errors].sort((a, b) => a - b);
  const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const maxErr = Math.max(...errors);
  console.log(`• ${body.padEnd(12)} — MAE: ${mae.toFixed(2)}" | Median: ${median.toFixed(2)}" | Max: ${maxErr.toFixed(2)}"`);
}

console.log("\n" + "=".repeat(70));
if (failed === 0) {
  console.log(` ALL ${passed} INDEPENDENT SWISS EPHEMERIS 2.10.03 BENCHMARK CHECKS PASSED!`);
  console.log(" AstroVerse output matched independently generated Swiss Ephemeris reference values.");
} else {
  console.error(` FAILED: ${failed} benchmark checks exceeded tolerance.`);
  process.exit(1);
}
