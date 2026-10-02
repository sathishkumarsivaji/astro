/**
 * Mandatory Test 5: Censoring Integrity & Anti-False-Negative Gate
 *
 * Asserts:
 * - Records with RIGHT_CENSORED are excluded from binary classification metrics.
 * - The pipeline NEVER naively converts RIGHT_CENSORED records to NO_EVENT negatives.
 * - Evaluated count matches strictly EVENT + NO_EVENT_WITH_COMPLETE_FOLLOWUP.
 */

import { evaluateOccurrence } from "./src/services/realWorldValidation/empiricalEvaluationEngine.js";

console.log("\n" + "=".repeat(70));
console.log(" TEST 5: CENSORING INTEGRITY & ANTI-FALSE-NEGATIVE VERIFICATION");
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

// Construct test cohort with mixed censoring
const mixedCohort = [
  // 1. Confirmed Event
  {
    sourceRecordId: "C01",
    censoringStatus: "EVENT",
    hasDocumentedMarriage: true,
    observationEndAge: 45
  },
  // 2. Confirmed Negative with Complete Follow-up (e.g., lived to 80 without marriage)
  {
    sourceRecordId: "C02",
    censoringStatus: "NO_EVENT_WITH_COMPLETE_FOLLOWUP",
    hasDocumentedMarriage: false,
    observationEndAge: 80
  },
  // 3. Right-Censored (e.g., currently age 28, unmarried so far — must NOT be called negative!)
  {
    sourceRecordId: "C03",
    censoringStatus: "RIGHT_CENSORED",
    hasDocumentedMarriage: false,
    observationEndAge: 28
  },
  // 4. Unknown / Insufficient follow-up
  {
    sourceRecordId: "C04",
    censoringStatus: "UNKNOWN",
    hasDocumentedMarriage: false,
    observationEndAge: 20
  }
];

const mockPredictions = [
  { target: "MARRIAGE_WITHIN_HORIZON_V2", prediction: "MARRIAGE_PREDICTED", pMarriage: 0.80 },
  { target: "MARRIAGE_WITHIN_HORIZON_V2", prediction: "NO_EVENT_PREDICTED", pMarriage: 0.20 },
  { target: "MARRIAGE_WITHIN_HORIZON_V2", prediction: "MARRIAGE_PREDICTED", pMarriage: 0.75 }, // prediction on censored person
  { target: "MARRIAGE_WITHIN_HORIZON_V2", prediction: "NO_EVENT_PREDICTED", pMarriage: 0.30 }
];

const result = evaluateOccurrence(mockPredictions, mixedCohort);

// Breakdown checks
assert(result.censoringBreakdown.totalRecords === 4, "Total records received is 4");
assert(result.censoringBreakdown.rightCensoredCount === 1, "Right-censored count is 1");
assert(result.censoringBreakdown.unknownCount === 1, "Unknown count is 1");
assert(result.censoringBreakdown.eventCount === 1, "Event count is 1");
assert(result.censoringBreakdown.noEventCount === 1, "Confirmed no-event count is 1");

// Crucial: Only the 2 non-censored records are in binary evaluation N!
assert(result.n === 2, `Binary evaluation cohort size N is exactly 2 (got ${result.n})`);
assert(result.confusionMatrix.tp + result.confusionMatrix.tn + result.confusionMatrix.fp + result.confusionMatrix.fn === 2, "Confusion matrix sum equals exactly 2");

// Check that person C03 was NOT marked as false positive
assert(result.confusionMatrix.fp === 0, `False positives is 0 (right-censored C03 was NOT treated as negative) (got fp=${result.confusionMatrix.fp})`);
assert(result.confusionMatrix.tp === 1, "True positives is 1 (C01 was correctly predicted)");
assert(result.confusionMatrix.tn === 1, "True negatives is 1 (C02 was correctly predicted)");
assert(result.accuracy === 1.0, `Accuracy is 1.0 on eligible cases (got ${result.accuracy})`);

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
