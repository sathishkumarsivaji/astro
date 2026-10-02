/**
 * ASTROVERSE — Independent Multi-Epoch True & Mean Lunar Node Benchmark Suite
 *
 * Validates the canonical osculating state-vector true node (h = r x v) and
 * Chapront (2002) mean node algorithms across 12 diverse historical, present,
 * and future epochs (1900–2100) including high-perturbation and perigee/apogee windows.
 *
 * Ground-truth reference values are loaded directly from the independently generated
 * Swiss Ephemeris 2.10.03 reference fixture (`test_fixtures/swiss_ephemeris_2_10_03_reference.json`).
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

console.log("\n" + "=".repeat(75));
console.log(" ASTROVERSE INDEPENDENT MULTI-EPOCH TRUE & MEAN NODE BENCHMARK (1900–2100)");
console.log("=".repeat(75));
console.log(`Provenance:      ${canonicalData.provenance.source}`);
console.log(`Ephemeris Model: ${canonicalData.provenance.ephemerisSource}`);
console.log(`Fixture SHA-256: ${sha256} (Verified against pinned constant)`);
console.log(`Epochs Loaded:   ${canonicalData.benchmarks.length}\n`);

let passed = 0;
let failed = 0;
const trueResiduals = [];
const meanResiduals = [];

function checkResidual(actualDeg, expectedDeg, maxTolArcSec, label) {
  let diffDeg = Math.abs(actualDeg - expectedDeg);
  if (diffDeg > 180) diffDeg = 360 - diffDeg;
  const diffArcSec = diffDeg * 3600;

  if (diffArcSec <= maxTolArcSec) {
    console.log(`  ✓ ${label} — residual: ${diffArcSec.toFixed(2)}" (tolerance: ${maxTolArcSec}")`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label} — residual: ${diffArcSec.toFixed(2)}" exceeds ${maxTolArcSec}" (actual: ${actualDeg.toFixed(6)}°, expected: ${expectedDeg.toFixed(6)}°)`);
    failed++;
  }
  return diffArcSec;
}

canonicalData.benchmarks.forEach((bm, i) => {
  console.log(`\n${i + 1}. Epoch: ${bm.name} [System: ${bm.system.toUpperCase()}]`);

  const opts = bm.timezoneId ? { timezoneId: bm.timezoneId } : {};

  // 1. Mean Node test
  const chartMean = calculatePlanetaryPositions(bm.birthDate, bm.birthTime, bm.latitude, bm.longitude, bm.system, bm.utcOffset, { ...opts, nodeModel: "mean" });
  const actualMeanRahu = chartMean.planets.find(p => p.name === "Rahu").longitude;
  const expMeanRahu = bm.bodies.Rahu_Mean.systemSpecific.longitude;
  const maxMeanTol = bm.tolerancesArcSec?.MeanNode || 15.0;
  const meanRes = checkResidual(actualMeanRahu, expMeanRahu, maxMeanTol, "Mean Rahu");
  meanResiduals.push(meanRes);

  // 2. True Node test
  const chartTrue = calculatePlanetaryPositions(bm.birthDate, bm.birthTime, bm.latitude, bm.longitude, bm.system, bm.utcOffset, { ...opts, nodeModel: "true" });
  const actualTrueRahu = chartTrue.planets.find(p => p.name === "Rahu").longitude;
  const expTrueRahu = bm.bodies.Rahu_True.systemSpecific.longitude;
  const maxTrueTol = bm.tolerancesArcSec?.TrueNode || 30.0;
  const trueRes = checkResidual(actualTrueRahu, expTrueRahu, maxTrueTol, "True Rahu (Osculating State Vector)");
  trueResiduals.push(trueRes);
});

const meanMae = meanResiduals.reduce((a, b) => a + b, 0) / meanResiduals.length;
const trueMae = trueResiduals.reduce((a, b) => a + b, 0) / trueResiduals.length;
const maxTrueResidual = Math.max(...trueResiduals);
const maxMeanResidual = Math.max(...meanResiduals);

const sortedTrue = [...trueResiduals].sort((a, b) => a - b);
const medianTrue = sortedTrue.length % 2 === 0
  ? (sortedTrue[sortedTrue.length / 2 - 1] + sortedTrue[sortedTrue.length / 2]) / 2
  : sortedTrue[Math.floor(sortedTrue.length / 2)];

const sortedMean = [...meanResiduals].sort((a, b) => a - b);
const medianMean = sortedMean.length % 2 === 0
  ? (sortedMean[sortedMean.length / 2 - 1] + sortedMean[sortedMean.length / 2]) / 2
  : sortedMean[Math.floor(sortedMean.length / 2)];

console.log("\n" + "=".repeat(75));
console.log(" MULTI-EPOCH LUNAR NODE ACCURACY SUMMARY (vs Swiss Ephemeris 2.10.03)");
console.log("=".repeat(75));
console.log(`• Mean Lunar Node  — MAE: ${meanMae.toFixed(2)}" | Median: ${medianMean.toFixed(2)}" | Max: ${maxMeanResidual.toFixed(2)}"`);
console.log(`• True Lunar Node  — MAE: ${trueMae.toFixed(2)}" | Median: ${medianTrue.toFixed(2)}" | Max: ${maxTrueResidual.toFixed(2)}"`);
console.log("=".repeat(75));

if (failed === 0) {
  console.log(` ALL ${passed} INDEPENDENT MULTI-EPOCH LUNAR NODE CHECKS PASSED 100%!\n`);
  console.log(" AstroVerse output matched independently generated Swiss Ephemeris reference values.\n");
} else {
  console.error(` FAILED: ${failed} node benchmark checks exceeded tolerance.\n`);
  process.exit(1);
}
