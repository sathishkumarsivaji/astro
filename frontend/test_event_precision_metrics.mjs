/**
 * Mandatory Test 4: Event Precision Metrics & Anti-False-Precision Gate
 *
 * Asserts:
 * - Date precision is preserved: DAY, MONTH, YEAR, UNKNOWN
 * - Year-only records NEVER receive day-level or month-level precision claims (e.g. ±3m, ±6m)
 * - DAY-level events compute real day-level metrics (exact date, ±7d, ±30d, etc.)
 */

import { evaluateTiming } from "./src/services/realWorldValidation/empiricalEvaluationEngine.js";

console.log("\n" + "=".repeat(70));
console.log(" TEST 4: EVENT PRECISION METRICS & ANTI-FALSE-PRECISION INTEGRITY");
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

// 1. Synthetic Cohort with Year-Only Ground Truth
const yearOnlyGroundTruths = [
  {
    sourceRecordId: "Y01",
    birthYear: 1960,
    firstDocumentedMarriage: { marriageYear: 1985, datePrecision: "YEAR", marriageDate: "1985" }
  },
  {
    sourceRecordId: "Y02",
    birthYear: 1962,
    firstDocumentedMarriage: { marriageYear: 1990, datePrecision: "YEAR", marriageDate: "1990" }
  }
];

const yearOnlyPredictions = [
  {
    target: "MARRIAGE_TIMING_V2",
    hasTimingPrediction: true,
    centralEstimateYear: 1985,
    centralEstimateDate: "1985-06-15",
    predictedIntervalYears: 2.0
  },
  {
    target: "MARRIAGE_TIMING_V2",
    hasTimingPrediction: true,
    centralEstimateYear: 1991,
    centralEstimateDate: "1991-06-15",
    predictedIntervalYears: 2.0
  }
];

const yearMetrics = evaluateTiming(yearOnlyPredictions, yearOnlyGroundTruths);

assert(yearMetrics.precisionDistribution.yearPrecisionCount === 2, "Both records identified as YEAR precision");
assert(yearMetrics.precisionDistribution.dayPrecisionCount === 0, "Zero records identified as DAY precision");
assert(yearMetrics.dayPrecisionMetrics === null, "dayPrecisionMetrics is strictly null when ground truth is year-only (no fabricated day precision)");
assert(yearMetrics.exactYearPct === 50, "Exact year percentage is 50% for 1/2 match");
assert(yearMetrics.within1yPct === 100, "Within ±1 year percentage is 100% for 0 and 1 year deltas");

// 2. Synthetic Cohort with DAY-Level Ground Truth
const dayGroundTruths = [
  {
    sourceRecordId: "D01",
    birthYear: 1970,
    firstDocumentedMarriage: { marriageYear: 1995, marriageMonth: 6, marriageDay: 20, datePrecision: "DAY", marriageDate: "1995-06-20" }
  },
  {
    sourceRecordId: "D02",
    birthYear: 1975,
    firstDocumentedMarriage: { marriageYear: 2002, marriageMonth: 10, marriageDay: 15, datePrecision: "DAY", marriageDate: "2002-10-15" }
  }
];

const dayPredictions = [
  {
    target: "MARRIAGE_TIMING_V2",
    hasTimingPrediction: true,
    centralEstimateYear: 1995,
    centralEstimateDate: "1995-06-25", // +5 days
    predictedIntervalYears: 1.0
  },
  {
    target: "MARRIAGE_TIMING_V2",
    hasTimingPrediction: true,
    centralEstimateYear: 2002,
    centralEstimateDate: "2002-11-10", // +26 days
    predictedIntervalYears: 1.0
  }
];

const dayMetrics = evaluateTiming(dayPredictions, dayGroundTruths);

assert(dayMetrics.precisionDistribution.dayPrecisionCount === 2, "Both records identified as DAY precision");
assert(dayMetrics.dayPrecisionMetrics !== null, "dayPrecisionMetrics is populated for DAY-level events");
assert(dayMetrics.dayPrecisionMetrics.within7DaysPct === 50, "1 out of 2 records within ±7 days (50%)");
assert(dayMetrics.dayPrecisionMetrics.within30DaysPct === 100, "2 out of 2 records within ±30 days (100%)");
assert(dayMetrics.dayPrecisionMetrics.meanDaysError === 15.5, `Mean days error correctly computed as 15.5 days (got ${dayMetrics.dayPrecisionMetrics.meanDaysError})`);

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
