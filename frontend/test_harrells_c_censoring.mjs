/**
 * ASTROVERSE — Unit Tests for Harrell's C Concordance Under Right Censoring
 *
 * Verifies the mathematical implementation of Harrell's C-index in discreteHazardSurvivalEngine.js:
 * 1. Comparable pairs logic under right censoring
 * 2. Concordance scoring (higher risk score predicts earlier event)
 * 3. Tied risk scores (0.5 score per Harrell 1982)
 * 4. Tied event times
 * 5. Censored pairs non-comparability
 * 6. Bootstrap 95% Confidence Interval
 */

import assert from "node:assert/strict";
import {
  computeHarrellsCIndex,
  computeHarrellsCIndexBootstrap
} from "./src/services/realWorldValidation/discreteHazardSurvivalEngine.js";

console.log("\n" + "=".repeat(75));
console.log(" TESTING HARRELL'S C-INDEX UNDER RIGHT CENSORING");
console.log("=".repeat(75) + "\n");

let passed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(err);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 1. Hand-Calculated Canonical Test Cases
// ---------------------------------------------------------------------------

test("Case 1: Event at 20 (risk 0.8) vs Event at 30 (risk 0.4) -> Concordant (C = 1.0)", () => {
  const subjects = [
    { time: 20, isEvent: true, riskScore: 0.8 },
    { time: 30, isEvent: true, riskScore: 0.4 }
  ];
  const c = computeHarrellsCIndex(subjects);
  assert.equal(c, 1.0);
});

test("Case 2: Event at 20 (risk 0.4) vs Event at 30 (risk 0.8) -> Discordant (C = 0.0)", () => {
  const subjects = [
    { time: 20, isEvent: true, riskScore: 0.4 },
    { time: 30, isEvent: true, riskScore: 0.8 }
  ];
  const c = computeHarrellsCIndex(subjects);
  assert.equal(c, 0.0);
});

test("Case 3: Censored at 20 (risk 0.8) vs Event at 30 (risk 0.4) -> Non-comparable (C = null)", () => {
  const subjects = [
    { time: 20, isEvent: false, riskScore: 0.8 },
    { time: 30, isEvent: true, riskScore: 0.4 }
  ];
  const c = computeHarrellsCIndex(subjects);
  assert.equal(c, null);
});

test("Case 4: Event at 20 (risk 0.8) vs Censored at 30 (risk 0.4) -> Concordant (C = 1.0)", () => {
  const subjects = [
    { time: 20, isEvent: true, riskScore: 0.8 },
    { time: 30, isEvent: false, riskScore: 0.4 }
  ];
  const c = computeHarrellsCIndex(subjects);
  assert.equal(c, 1.0);
});

test("Case 5: Both censored -> Non-comparable (C = null)", () => {
  const subjects = [
    { time: 20, isEvent: false, riskScore: 0.8 },
    { time: 30, isEvent: false, riskScore: 0.4 }
  ];
  const c = computeHarrellsCIndex(subjects);
  assert.equal(c, null);
});

test("Case 6: Tied events at 25 with tied risk scores -> Tied pair (C = 0.5)", () => {
  const subjects = [
    { time: 25, isEvent: true, riskScore: 0.6 },
    { time: 25, isEvent: true, riskScore: 0.6 }
  ];
  const c = computeHarrellsCIndex(subjects);
  assert.equal(c, 0.5);
});

test("Case 7: Tied events at 25 with different risk scores -> Untied tie (C = 0.0)", () => {
  const subjects = [
    { time: 25, isEvent: true, riskScore: 0.7 },
    { time: 25, isEvent: true, riskScore: 0.4 }
  ];
  const c = computeHarrellsCIndex(subjects);
  // In Harrell 1982, tied survival times with untied predictions are counted in denominator with 0 concordance
  assert.equal(c, 0.0);
});

test("Case 8: Mixed cohort with events and right censoring", () => {
  // S1: Event at 22, Risk 0.85
  // S2: Event at 26, Risk 0.60
  // S3: Censored at 30, Risk 0.30
  // S4: Censored at 24, Risk 0.70
  // Pairs:
  // (S1, S2): t1=22 < t2=26, e1=true => Comparable. r1=0.85 > r2=0.60 => Concordant (+1)
  // (S1, S3): t1=22 < t3=30, e1=true => Comparable. r1=0.85 > r3=0.30 => Concordant (+1)
  // (S1, S4): t1=22 < t4=24, e1=true => Comparable. r1=0.85 > r4=0.70 => Concordant (+1)
  // (S4, S2): t4=24 < t2=26, e4=false => NOT comparable
  // (S4, S3): t4=24 < t3=30, e4=false => NOT comparable
  // (S2, S3): t2=26 < t3=30, e2=true => Comparable. r2=0.60 > r3=0.30 => Concordant (+1)
  // Total comparable = 4, Concordant = 4 => C = 1.0
  const subjects = [
    { time: 22, isEvent: true, riskScore: 0.85 },
    { time: 26, isEvent: true, riskScore: 0.60 },
    { time: 30, isEvent: false, riskScore: 0.30 },
    { time: 24, isEvent: false, riskScore: 0.70 }
  ];
  const c = computeHarrellsCIndex(subjects);
  assert.equal(c, 1.0);
});

test("Case 9: Mixed cohort with one discordant pair", () => {
  // Same as Case 8, but S2 risk is 0.90 (higher than S1)
  // (S1, S2): t1=22 < t2=26, e1=true => Comparable. r1=0.85 < r2=0.90 => Discordant (0)
  // (S1, S3): Concordant (+1)
  // (S1, S4): Concordant (+1)
  // (S2, S3): t2=26 < t3=30, e2=true => Comparable. r2=0.90 > r3=0.30 => Concordant (+1)
  // Total comparable = 4, Concordant = 3 => C = 3/4 = 0.75
  const subjects = [
    { time: 22, isEvent: true, riskScore: 0.85 },
    { time: 26, isEvent: true, riskScore: 0.90 },
    { time: 30, isEvent: false, riskScore: 0.30 },
    { time: 24, isEvent: false, riskScore: 0.70 }
  ];
  const c = computeHarrellsCIndex(subjects);
  assert.equal(c, 0.75);
});

// ---------------------------------------------------------------------------
// 2. Bootstrap Confidence Interval Tests
// ---------------------------------------------------------------------------

test("Case 10: Bootstrap C-index returns point estimate, SE, and bounded 95% CI", () => {
  const subjects = [
    { time: 20, isEvent: true, riskScore: 0.9 },
    { time: 22, isEvent: true, riskScore: 0.8 },
    { time: 24, isEvent: true, riskScore: 0.7 },
    { time: 26, isEvent: true, riskScore: 0.6 },
    { time: 28, isEvent: true, riskScore: 0.5 },
    { time: 30, isEvent: true, riskScore: 0.4 },
    { time: 32, isEvent: false, riskScore: 0.3 },
    { time: 34, isEvent: false, riskScore: 0.2 },
    { time: 36, isEvent: false, riskScore: 0.1 }
  ];
  const res = computeHarrellsCIndexBootstrap(subjects, 200, 133742);
  assert.equal(res.cIndex, 1.0);
  assert.ok(Array.isArray(res.ci95));
  assert.equal(res.ci95.length, 2);
  assert.ok(res.ci95[0] <= res.ci95[1]);
  assert.ok(res.ci95[0] >= 0.0 && res.ci95[1] <= 1.0);
  assert.ok(typeof res.standardError === "number");
});

console.log("\n" + "=".repeat(75));
console.log(` ALL ${passed} HARRELL'S C-INDEX UNIT TESTS PASSED 100%!`);
console.log("=".repeat(75) + "\n");
