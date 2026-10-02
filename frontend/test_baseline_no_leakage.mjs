/**
 * Mandatory Test 9: Baseline Leakage Prevention & Train-Only Fitting
 *
 * Asserts:
 * - Demographic baseline parameters are computed strictly from the TRAIN partition.
 * - The evaluation / test cohort outcomes are never used to fit the baseline median age.
 * - Confirms zero data leakage between training and evaluation splits.
 */

import { evaluateDemographicBaseline } from "./src/services/realWorldValidation/empiricalEvaluationEngine.js";

console.log("\n" + "=".repeat(70));
console.log(" TEST 9: DEMOGRAPHIC BASELINE NO-LEAKAGE VERIFICATION");
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

// 1. Synthetic Training Cohort with Median Age 24
const trainCohort = [
  { sourceRecordId: "TR_1", birthYear: 1960, firstDocumentedMarriage: { marriageYear: 1982 } }, // age 22
  { sourceRecordId: "TR_2", birthYear: 1960, firstDocumentedMarriage: { marriageYear: 1984 } }, // age 24
  { sourceRecordId: "TR_3", birthYear: 1960, firstDocumentedMarriage: { marriageYear: 1986 } }  // age 26
];

// 2. Synthetic Test Cohort with very different distribution (Median Age 35)
const testCohort = [
  { sourceRecordId: "TE_1", birthYear: 1970, firstDocumentedMarriage: { marriageYear: 2003 } }, // age 33
  { sourceRecordId: "TE_2", birthYear: 1970, firstDocumentedMarriage: { marriageYear: 2005 } }, // age 35
  { sourceRecordId: "TE_3", birthYear: 1970, firstDocumentedMarriage: { marriageYear: 2007 } }  // age 37
];

// 3. Evaluate testCohort using trainCohort as reference
const result = evaluateDemographicBaseline(testCohort, trainCohort);

// Check that baseline median age is 24 (from trainCohort), NOT 35 (from testCohort)
assert(result.baselineMedianAge === 24, `Baseline median age is 24 (from TRAIN), not 35 from TEST (got ${result.baselineMedianAge})`);
assert(result.leakageFreeProvenance === "ESTIMATED_STRICTLY_FROM_TRAIN", `Provenance is marked ESTIMATED_STRICTLY_FROM_TRAIN`);
assert(result.n === 3, "Evaluated 3 test records");

// MAE on test cohort against TRAIN median (24):
// TE_1: actual 2003, pred 1970 + 24 = 1994, diff = 9
// TE_2: actual 2005, pred 1970 + 24 = 1994, diff = 11
// TE_3: actual 2007, pred 1970 + 24 = 1994, diff = 13
// Mean diff = (9 + 11 + 13) / 3 = 11.0
assert(result.mae === 11.0, `Test MAE correctly computed as 11.0 against train baseline (got ${result.mae})`);

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
