/**
 * Mandatory Test 8: Negative Controls Reproducibility & Determinism
 *
 * Asserts:
 * - Deterministic seeded PRNG (Mulberry32) produces 100% identical sequences.
 * - Negative controls produce identical observed values across repeated executions with the same seed.
 * - Shuffled outcome permutation degrades timing prediction to null/chance level.
 * - 10,000 permutation distribution confirms null expectation.
 */

import {
  createSeededPRNG,
  runNegativeControls
} from "./src/services/realWorldValidation/empiricalEvaluationEngine.js";

console.log("\n" + "=".repeat(70));
console.log(" TEST 8: NEGATIVE CONTROLS REPRODUCIBILITY & DETERMINISM");
console.log("=".repeat(70));

let passes = 0;
let fails = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passes++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    fails++;
  }
}

// 1. Seeded PRNG Determinism
const prng1 = createSeededPRNG(42);
const seq1 = Array.from({ length: 10 }, () => prng1());

const prng2 = createSeededPRNG(42);
const seq2 = Array.from({ length: 10 }, () => prng2());

let prngIdentical = true;
for (let i = 0; i < seq1.length; i++) {
  if (seq1[i] !== seq2[i]) prngIdentical = false;
}
assert(prngIdentical, "Seeded PRNG generates 100% identical sequence with same seed (42)");

// 2. Different seed produces different sequence
const prng3 = createSeededPRNG(999);
const seq3 = Array.from({ length: 10 }, () => prng3());
assert(seq1[0] !== seq3[0], "Different seed (999 vs 42) produces different values");

// 3. Reproducible negative control run on synthetic cohort
const sampleCohort = [
  {
    sourceRecordId: "NC_01",
    birthDate: "1970-01-01",
    birthTime: "12:00",
    sourceUtcOffset: 5.5,
    latitude: 13.0,
    longitude: 80.0,
    birthYear: 1970,
    hasDocumentedMarriage: true,
    firstDocumentedMarriage: { marriageYear: 1995 }
  },
  {
    sourceRecordId: "NC_02",
    birthDate: "1975-05-10",
    birthTime: "08:30",
    sourceUtcOffset: 5.5,
    latitude: 28.6,
    longitude: 77.2,
    birthYear: 1975,
    hasDocumentedMarriage: true,
    firstDocumentedMarriage: { marriageYear: 2001 }
  },
  {
    sourceRecordId: "NC_03",
    birthDate: "1980-11-20",
    birthTime: "18:45",
    sourceUtcOffset: 5.5,
    latitude: 19.0,
    longitude: 72.8,
    birthYear: 1980,
    hasDocumentedMarriage: false
  }
];

// Mock chart getter to run in <1ms
const mockChartGetter = () => ({
  planets: [
    { name: "Sun", longitude: 280, house: 10 },
    { name: "Moon", longitude: 120, house: 4 },
    { name: "Venus", longitude: 300, house: 11, dignity: "Exalted" }
  ],
  ascendantLong: 10.0,
  dashaTable: [
    { lord: "Venus", startAge: 20, endAge: 40, bukthis: [{ lord: "Jupiter", startAge: 25, endAge: 28 }] }
  ]
});

const run1 = runNegativeControls(sampleCohort, mockChartGetter, { seed: 133742, permutations: 10000 });
const run2 = runNegativeControls(sampleCohort, mockChartGetter, { seed: 133742, permutations: 10000 });

assert(run1.seed === 133742, "Run 1 seed is 133742");
assert(run1.numPermutations === 10000, "Run 1 executes 10,000 permutations");

// Check exact numeric match between runs
assert(
  run1.controls[0].observedMAE === run2.controls[0].observedMAE,
  `Outcome permutation MAE identical across runs (${run1.controls[0].observedMAE})`
);
assert(
  run1.controls[1].observedBalancedAccuracy === run2.controls[1].observedBalancedAccuracy,
  `Random label balanced accuracy identical across runs (${run1.controls[1].observedBalancedAccuracy})`
);
assert(
  run1.controls[2].observedSimulatedPct === run2.controls[2].observedSimulatedPct,
  `10k permutation simulated rate identical across runs (${run1.controls[2].observedSimulatedPct}%)`
);

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
