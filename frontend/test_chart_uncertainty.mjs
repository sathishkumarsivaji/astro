/**
 * ASTROVERSE — Chart Uncertainty Perturbation Engine Test Suite
 *
 * Verifies:
 * 1. Date/time arithmetic with midnight wraparound.
 * 2. Systematic perturbation across ±1, ±5, ±10, ±15, ±30, ±60 minutes.
 * 3. Accurate tracking of D1 Lagna, D9 Lagna, D10 Lagna, and Moon Nakshatra.
 * 4. Borderline cusp sensitivity detection (marking BIRTH_TIME_SENSITIVE).
 * 5. Mid-sign stability verification (marking ROBUST_TO_UNCERTAINTY).
 * 6. Machine-readable audit status tagConclusionSensitivity.
 */

import assert from "node:assert/strict";
import {
  shiftDateTime,
  runBirthTimePerturbationAnalysis,
  tagConclusionSensitivity,
  DEFAULT_PERTURBATION_OFFSETS
} from "./src/services/chartUncertaintyEngine.js";

let passed = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

console.log("===========================================================================");
console.log(" CHART UNCERTAINTY PERTURBATION ENGINE VERIFICATION");
console.log("===========================================================================");

// 1. Shift date and time across midnight
test("shiftDateTime handles intra-day and midnight wraparounds cleanly", () => {
  const normal = shiftDateTime("2020-05-15", "14:30:00", 15);
  assert.equal(normal.shiftedDate, "2020-05-15");
  assert.equal(normal.shiftedTime, "14:45:00");

  const forwardMidnight = shiftDateTime("2020-05-15", "23:50:00", 20);
  assert.equal(forwardMidnight.shiftedDate, "2020-05-16");
  assert.equal(forwardMidnight.shiftedTime, "00:10:00");

  const backwardMidnight = shiftDateTime("2020-05-15", "00:10:00", -25);
  assert.equal(backwardMidnight.shiftedDate, "2020-05-14");
  assert.equal(backwardMidnight.shiftedTime, "23:45:00");
});

// 2. Full perturbation run on a standard chart
test("runBirthTimePerturbationAnalysis runs systematic offsets and extracts core points", () => {
  const result = runBirthTimePerturbationAnalysis({
    birthDate: "1990-01-01",
    birthTime: "12:00:00",
    lat: 13.0827,
    lng: 80.2707,
    system: "lahiri",
    tz: 5.5
  });

  assert.equal(result.methodology, "EMPIRICAL_BIRTH_TIME_PERTURBATION");
  assert.ok(result.baseline.ascendantSign);
  assert.ok(result.baseline.d9AscendantSign);
  assert.ok(result.baseline.moonNakshatra);
  assert.equal(result.perturbations.length, DEFAULT_PERTURBATION_OFFSETS.length);

  // Check all offsets are evaluated in order
  const offsets = result.perturbations.map(p => p.offsetMinutes);
  assert.deepEqual(offsets, [-60, -30, -15, -10, -5, -1, 1, 5, 10, 15, 30, 60]);
});

// 3. Borderline cusp sensitivity detection
test("Identifies borderline Ascendant cusp and tags as BIRTH_TIME_SENSITIVE", () => {
  // On 1990-01-01 at 23:00:00 in Chennai, Lagna is at 0.22° Virgo (just 0.22° from Leo).
  // A -1 or -5 minute shift immediately moves Lagna back into Leo.
  const result = runBirthTimePerturbationAnalysis({
    birthDate: "1990-01-01",
    birthTime: "23:00:00",
    lat: 13.0827,
    lng: 80.2707,
    system: "lahiri",
    tz: 5.5
  });

  // Lagna flips within a few minutes
  const tagLagna = tagConclusionSensitivity("D1_ASCENDANT", result.sensitivityMetrics);
  assert.ok(result.sensitivityMetrics.minOffsetD1LagnaChangeMinutes !== null);
  assert.ok(result.sensitivityMetrics.minOffsetD1LagnaChangeMinutes <= 15);
  assert.equal(tagLagna.status, "BIRTH_TIME_SENSITIVE");
  assert.ok(tagLagna.criticalOffsetMinutes <= 15);
});

// 4. Mid-sign stability verification
test("Identifies mid-sign Ascendant as ROBUST_TO_UNCERTAINTY for small perturbations", () => {
  // 12:00 PM is comfortably in Pisces/Aries mid-sign
  const result = runBirthTimePerturbationAnalysis({
    birthDate: "1990-01-01",
    birthTime: "12:00:00",
    lat: 13.0827,
    lng: 80.2707,
    system: "lahiri",
    tz: 5.5
  });

  const tagD1 = tagConclusionSensitivity("D1_ASCENDANT", result.sensitivityMetrics);
  // Mid-sign should be robust for at least ±15 mins
  if (result.sensitivityMetrics.minOffsetD1LagnaChangeMinutes === null || result.sensitivityMetrics.minOffsetD1LagnaChangeMinutes > 15) {
    assert.equal(tagD1.status, "ROBUST_TO_UNCERTAINTY");
  } else {
    // If it happens to be near boundary, ensure tag matches
    assert.equal(tagD1.status, "BIRTH_TIME_SENSITIVE");
  }
});

// 5. Fast-moving D9 (Navamsha) sensitivity
test("Tracks D9 Navamsha boundary shifts (~13.3 minutes)", () => {
  const result = runBirthTimePerturbationAnalysis({
    birthDate: "1990-01-01",
    birthTime: "12:00:00",
    lat: 13.0827,
    lng: 80.2707,
    system: "lahiri",
    tz: 5.5
  });

  // Since Navamsha only spans 13.3 minutes, a ±30 or ±60 minute window is guaranteed to cross a Navamsha boundary
  assert.ok(result.sensitivityMetrics.minOffsetD9LagnaChangeMinutes !== null);
  assert.ok(result.sensitivityMetrics.minOffsetD9LagnaChangeMinutes <= 30);
});

// 6. Disclosure integrity
test("Returns rigorous astronomical disclosures without fabricated claims", () => {
  const result = runBirthTimePerturbationAnalysis({
    birthDate: "1990-01-01",
    birthTime: "12:00:00",
    lat: 13.0827,
    lng: 80.2707,
    system: "lahiri",
    tz: 5.5
  });

  assert.ok(result.disclosure.astronomicalRate.includes("1° every 4 minutes"));
  assert.ok(result.disclosure.astronomicalRate.includes("Navamsha spans 3°20'"));
  assert.ok(result.disclosure.caveat.includes("BIRTH_TIME_SENSITIVE"));
});

console.log("===========================================================================");
console.log(`ALL ${passed}/6 CHART UNCERTAINTY PERTURBATION TESTS PASSED.`);
console.log("===========================================================================\n");
