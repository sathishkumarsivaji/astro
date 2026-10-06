/**
 * ASTROVERSE — Resolution Separation Verification Suite
 * ======================================================
 * Tests Part 2 mandates:
 * - Layer A (Astronomical Calculation Resolution)
 * - Layer B (Traditional Rule Resolution)
 * - Layer C (Empirical Predictive Resolution)
 * - Prohibiting exact day predictive claims from astronomical ephemeris precision
 */

import assert from "node:assert/strict";
import {
  RESOLUTION,
  RESOLUTION_LAYERS,
  createResolutionLayers
} from "./src/services/expertPrediction/expertPredictionSchema.js";
import {
  validateResolutionSeparation
} from "./src/services/realWorldValidation/discreteHazardSurvivalEngine.js";

console.log("===========================================================================");
console.log(" ASTRONOMICAL VS. PREDICTIVE RESOLUTION SEPARATION TEST SUITE (PART 2)");
console.log("===========================================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

// 1. Enum Structure
test("RESOLUTION_LAYERS enum defines 3 distinct architectural layers", () => {
  assert.equal(RESOLUTION_LAYERS.ASTRONOMICAL_CALCULATION, "ASTRONOMICAL_CALCULATION");
  assert.equal(RESOLUTION_LAYERS.TRADITIONAL_RULE_RESOLUTION, "TRADITIONAL_RULE_RESOLUTION");
  assert.equal(RESOLUTION_LAYERS.EMPIRICAL_PREDICTIVE_RESOLUTION, "EMPIRICAL_PREDICTIVE_RESOLUTION");
});

// 2. createResolutionLayers Structure
test("createResolutionLayers builds explicit 3-layer architecture", () => {
  const layers = createResolutionLayers({
    astronomical: {
      julianDay: 2460000.5,
      longitudePrecisionDeg: 0.0001,
      ephemerisVersion: "AstronomyEngine/VSOP87"
    },
    traditional: {
      resolution: RESOLUTION.MONTH_RANGE,
      startDate: "2028-06-01",
      endDate: "2028-08-31"
    },
    empirical: {
      predictiveResolution: RESOLUTION.MULTI_YEAR_RANGE,
      modelStatus: "NOT_EMPIRICALLY_VALIDATED",
      validationMAE: 6.89
    }
  });

  // Layer A: Computational Precision
  assert.equal(layers.layerA.resolutionType, "ASTRONOMICAL_CALCULATION");
  assert.equal(layers.layerA.julianDay, 2460000.5);
  assert.equal(layers.layerA.longitudePrecisionDeg, 0.0001);

  // Layer B: Traditional Rule Granularity
  assert.equal(layers.layerB.resolutionType, "TRADITIONAL_RULE_RESOLUTION");
  assert.equal(layers.layerB.ruleGranularity, RESOLUTION.MONTH_RANGE);

  // Layer C: Empirical Predictive Reality
  assert.equal(layers.layerC.resolutionType, "EMPIRICAL_PREDICTIVE_RESOLUTION");
  assert.equal(layers.layerC.predictiveResolution, RESOLUTION.MULTI_YEAR_RANGE);
  assert.equal(layers.layerC.exactDateBlocked, true);
});

// 3. Exact Day Claim Blocking
test("validateResolutionSeparation blocks exact day predictive assertions without empirical validation", () => {
  const unvalidatedExactDayPred = {
    hasExactDayPrediction: true,
    predictiveResolution: "DAY",
    validationStatus: "NOT_EMPIRICALLY_VALIDATED"
  };

  const check = validateResolutionSeparation(unvalidatedExactDayPred);
  assert.equal(check.isValid, false);
  assert.equal(check.blocked, true);
  assert.ok(check.reason.includes("UNSUPPORTED_TIMING_PRECISION"));
});

test("validateResolutionSeparation allows valid empirical predictive resolutions", () => {
  const honestPrediction = {
    hasExactDayPrediction: false,
    predictiveResolution: "MULTI_YEAR_RANGE",
    validationStatus: "NOT_EMPIRICALLY_VALIDATED"
  };

  const check = validateResolutionSeparation(honestPrediction);
  assert.equal(check.isValid, true);
  assert.equal(check.blocked, false);
});

console.log("\n===========================================================================");
if (failed === 0) {
  console.log(` ALL ${passed} RESOLUTION SEPARATION TESTS PASSED 100%!`);
  process.exitCode = 0;
} else {
  console.error(` FAILED: ${failed} checks failed, ${passed} passed.`);
  process.exitCode = 1;
}
