/**
 * ASTROVERSE — Empirical Discrimination & 4-Model Comparative Benchmark Suite
 * ============================================================================
 * Tests Part 1 mandates:
 * 1. Degenerate classifier hard gate (detectDegenerateClassifier)
 * 2. Partition non-leakage audits (assertNoBlindLeakage, assertNoValidationLeakage)
 * 3. Validation threshold selection & freezing (selectValidationThreshold)
 * 4. 4-Model comparative framework (Null, Demographic, Astrology, Combined)
 * 5. Occurrence vs. Timing schema decoupling
 */

import assert from "node:assert/strict";
import {
  EMPIRICAL_STATUS,
  detectDegenerateClassifier,
  assertNoBlindLeakage,
  assertNoValidationLeakage,
  assertNoExternalLeakage,
  selectValidationThreshold,
  fitNullOccurrenceModel,
  fitDemographicOccurrenceModel,
  fitAstrologyOccurrenceModel,
  fitCombinedOccurrenceModel,
  evaluate4ModelComparison,
  predictMarriageOccurrence,
  predictMarriageTiming,
  evaluateTiming
} from "./src/services/realWorldValidation/empiricalEvaluationEngine.js";

console.log("===========================================================================");
console.log(" EMPIRICAL OCCURRENCE DISCRIMINATION & 4-MODEL SUITE (PART 1)");
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

// -------------------------------------------------------------------------
// 1. Degenerate Classifier Hard Gate
// -------------------------------------------------------------------------
test("detectDegenerateClassifier detects degenerate base-rate dominance when TN = 0 and Specificity = 0%", () => {
  const degenerateMatrix = { tp: 1000, fp: 180, tn: 0, fn: 0 };
  const degenerateMetrics = { specificity: 0.0, mcc: 0.0, balancedAccuracy: 0.50, accuracy: 0.847 };

  const res = detectDegenerateClassifier(degenerateMatrix, degenerateMetrics);
  assert.equal(res.isDegenerate, true);
  assert.equal(res.classifierStatus, "DEGENERATE_BASE_RATE_CLASSIFIER");
  assert.equal(res.empiricallyValidated, false);
  assert.equal(res.status, EMPIRICAL_STATUS.BASE_RATE_DOMINATED);
  assert.ok(res.reason.includes("Degenerate base-rate classification detected"));
});

test("detectDegenerateClassifier confirms non-degenerate discriminative classifiers", () => {
  const validMatrix = { tp: 800, fp: 50, tn: 130, fn: 200 };
  const validMetrics = { specificity: 0.722, mcc: 0.38, balancedAccuracy: 0.761, accuracy: 0.788 };

  const res = detectDegenerateClassifier(validMatrix, validMetrics);
  assert.equal(res.isDegenerate, false);
  assert.equal(res.classifierStatus, "DISCRIMINATIVE_CLASSIFIER");
  assert.equal(res.empiricallyValidated, true);
  assert.equal(res.status, EMPIRICAL_STATUS.VALIDATED);
});

// -------------------------------------------------------------------------
// 2. Partition Non-Leakage Audits
// -------------------------------------------------------------------------
test("assertNoBlindLeakage passes on disjoint partitions and throws on overlap", () => {
  const train = [{ sourceRecordId: "TR_1" }, { sourceRecordId: "TR_2" }];
  const blindClean = [{ sourceRecordId: "BL_1" }, { sourceRecordId: "BL_2" }];
  const blindLeaked = [{ sourceRecordId: "BL_1" }, { sourceRecordId: "TR_1" }];

  assert.equal(assertNoBlindLeakage(train, blindClean), true);
  assert.throws(() => assertNoBlindLeakage(train, blindLeaked), /CRITICAL_LEAKAGE_DETECTED/);
});

test("assertNoValidationLeakage passes on disjoint partitions and throws on overlap", () => {
  const train = [{ sourceRecordId: "TR_1" }, { sourceRecordId: "TR_2" }];
  const valClean = [{ sourceRecordId: "VAL_1" }, { sourceRecordId: "VAL_2" }];
  const valLeaked = [{ sourceRecordId: "TR_2" }];

  assert.equal(assertNoValidationLeakage(train, valClean), true);
  assert.throws(() => assertNoValidationLeakage(train, valLeaked), /CRITICAL_LEAKAGE_DETECTED/);
});

// -------------------------------------------------------------------------
// 3. Validation Threshold Selection & Freezing
// -------------------------------------------------------------------------
test("selectValidationThreshold optimizes and freezes threshold on validation probability pairs", () => {
  const pairs = [
    { prob: 0.85, actual: 1 },
    { prob: 0.82, actual: 1 },
    { prob: 0.78, actual: 1 },
    { prob: 0.65, actual: 0 },
    { prob: 0.60, actual: 0 },
    { prob: 0.55, actual: 0 }
  ];

  const sel = selectValidationThreshold(pairs, { method: "MAXIMIZE_MCC_ON_VALIDATION" });
  assert.equal(sel.frozen, true);
  assert.ok(sel.optimalThreshold >= 0.65 && sel.optimalThreshold <= 0.80);
  assert.ok(sel.metricValue > 0.5);
  assert.ok(sel.confusionMatrix.tn > 0);
});

// -------------------------------------------------------------------------
// 4. 4-Model Comparative Occurrence Framework
// -------------------------------------------------------------------------
test("4-Model Framework fits Model 0, 1, 2, 3 and evaluates comparative metrics", () => {
  const mockTrain = [
    { sourceRecordId: "T1", birthYear: 1960, censoringStatus: "EVENT" },
    { sourceRecordId: "T2", birthYear: 1965, censoringStatus: "EVENT" },
    { sourceRecordId: "T3", birthYear: 1970, censoringStatus: "EVENT" },
    { sourceRecordId: "T4", birthYear: 1980, censoringStatus: "NO_EVENT" },
    { sourceRecordId: "T5", birthYear: 1985, censoringStatus: "NO_EVENT" }
  ];

  const m0 = fitNullOccurrenceModel(mockTrain);
  assert.equal(m0.modelId, "MODEL_0_NULL");
  assert.equal(m0.baseRate, 0.60);

  const m1 = fitDemographicOccurrenceModel(mockTrain);
  assert.equal(m1.modelId, "MODEL_1_DEMOGRAPHIC");
  assert.ok(typeof m1.predict === "function");

  const m2 = fitAstrologyOccurrenceModel(mockTrain);
  assert.equal(m2.modelId, "MODEL_2_ASTROLOGY");
  assert.ok(typeof m2.predict === "function");

  const m3 = fitCombinedOccurrenceModel(mockTrain);
  assert.equal(m3.modelId, "MODEL_3_COMBINED");
  assert.ok(typeof m3.predict === "function");

  const comp = evaluate4ModelComparison(mockTrain, mockTrain, 0.50);
  assert.equal(comp.length, 4);
  assert.equal(comp[0].modelId, "MODEL_0_NULL");
  assert.equal(comp[1].modelId, "MODEL_1_DEMOGRAPHIC");
  assert.equal(comp[2].modelId, "MODEL_2_ASTROLOGY");
  assert.equal(comp[3].modelId, "MODEL_3_COMBINED");
});

// -------------------------------------------------------------------------
// 5. Schema Decoupling: Occurrence vs. Timing
// -------------------------------------------------------------------------
test("predictMarriageOccurrence outputs decoupled OccurrencePrediction schema", () => {
  const cleanRecord = {
    sourceRecordId: "REC_TEST_01",
    birthDate: "1990-05-15",
    birthTime: "10:30:00",
    latitude: 13.08,
    longitude: 80.27,
    sourceUtcOffset: 5.5
  };
  const mockChart = {
    ascendantLong: 45.0,
    planets: [{ name: "Jupiter", longitude: 120.0 }]
  };

  const occ = predictMarriageOccurrence(cleanRecord, mockChart);
  assert.equal(occ.target, "MARRIAGE_WITHIN_HORIZON_V2");
  assert.ok("pMarriage" in occ);
  assert.ok("calibratedProbability" in occ);
  assert.ok("threshold" in occ);
  assert.ok("classifierStatus" in occ);
  assert.ok("modelId" in occ);
  assert.equal(occ.prediction === "MARRIAGE_PREDICTED" || occ.prediction === "NO_EVENT_PREDICTED", true);
});

test("predictMarriageTiming outputs decoupled TimingPrediction schema", () => {
  const cleanRecord = {
    sourceRecordId: "REC_TEST_02",
    birthYear: 1990,
    birthDate: "1990-05-15",
    birthTime: "10:30:00",
    latitude: 13.08,
    longitude: 80.27,
    sourceUtcOffset: 5.5
  };
  const mockChart = {
    ascendantLong: 45.0,
    planets: [{ name: "Jupiter", longitude: 120.0 }]
  };

  const timing = predictMarriageTiming(cleanRecord, mockChart);
  assert.equal(timing.target, "MARRIAGE_TIMING_V2");
  assert.ok("hasTimingPrediction" in timing);
  assert.ok("centralEstimateYear" in timing);
  assert.ok("predictedInterval" in timing);
  assert.ok("predictedIntervalYears" in timing);
});

// -------------------------------------------------------------------------
// 6. Threshold Identification Failure on Degenerate Data
// -------------------------------------------------------------------------
test("selectValidationThreshold returns THRESHOLD_NOT_IDENTIFIABLE when no threshold satisfies minSpecificity", () => {
  const degeneratePairs = [
    { prob: 0.92, actual: 1 },
    { prob: 0.91, actual: 1 },
    { prob: 0.90, actual: 1 },
    { prob: 0.99, actual: 0 }
  ];

  const res = selectValidationThreshold(degeneratePairs, { minSpecificity: 0.40 });
  assert.equal(res.status, "THRESHOLD_NOT_IDENTIFIABLE");
  assert.equal(res.satisfiesConstraint, false);
  assert.equal(res.optimalThreshold, null);
});

// -------------------------------------------------------------------------
// 7. Data-Dependent IRLS Fitting
// -------------------------------------------------------------------------
test("IRLS models produce data-dependent coefficients on distinct data partitions", () => {
  const setA = [
    { censoringStatus: "EVENT", birthYear: 1950, sourceRecordId: "A1" },
    { censoringStatus: "EVENT", birthYear: 1955, sourceRecordId: "A2" },
    { censoringStatus: "NO_EVENT", birthYear: 1980, sourceRecordId: "A3" }
  ];
  const setB = [
    { censoringStatus: "EVENT", birthYear: 1980, sourceRecordId: "B1" },
    { censoringStatus: "EVENT", birthYear: 1985, sourceRecordId: "B2" },
    { censoringStatus: "NO_EVENT", birthYear: 1950, sourceRecordId: "B3" }
  ];

  const demoA = fitDemographicOccurrenceModel(setA);
  const demoB = fitDemographicOccurrenceModel(setB);
  assert.notEqual(demoA.betaCohort, demoB.betaCohort, "Demographic coefficients are data-dependent");
});

// -------------------------------------------------------------------------
// 8. Timing Granularity vs. Empirical Predictive Resolution Separation
// -------------------------------------------------------------------------
test("evaluateTiming distinguishes computedCalendarGranularity (DAY) from empiricalPredictiveResolution (MULTI_YEAR_RANGE)", () => {
  const timingPreds = [{
    hasTimingPrediction: true,
    centralEstimateYear: 2015,
    predictedIntervalYears: 4,
    conformalIntervals: { p80: { lowerYear: 2011, upperYear: 2019 } }
  }];
  const groundTruths = [{
    birthYear: 1985,
    hasDocumentedMarriage: true,
    marriages: [{ marriageYear: 2016, marriageDate: "2016-06-15", precision: "DAY" }]
  }];

  const tEval = evaluateTiming(timingPreds, groundTruths);
  assert.equal(tEval.computedCalendarGranularity, "DAY");
  assert.equal(tEval.empiricalPredictiveResolution, "MULTI_YEAR_RANGE");
  assert.equal(tEval.empiricalTimingStatus, "EMPIRICALLY_UNVALIDATED_FOR_EXACT_DAY");
});

console.log("\n===========================================================================");
if (failed === 0) {
  console.log(` ALL ${passed} EMPIRICAL OCCURRENCE & 4-MODEL TESTS PASSED 100%!`);
  process.exitCode = 0;
} else {
  console.error(` FAILED: ${failed} checks failed, ${passed} passed.`);
  process.exitCode = 1;
}
