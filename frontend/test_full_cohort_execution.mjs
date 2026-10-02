/**
 * Mandatory Test 6: Full Cohort Execution & Anti-Sampling Verification
 *
 * Asserts:
 * - Benchmark script does NOT contain `const EVAL_SIZE = 100` or `slice(0, EVAL_SIZE)`.
 * - The primary benchmark evaluation is executed across 100% of the partition records.
 * - Confirms full-cohort evaluation count matches the split size.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const BENCHMARK_SCRIPT = path.join(ROOT, "frontend/test_real_world_empirical_benchmark.mjs");
const BLIND_SPLIT_PATH = path.join(ROOT, "data/real_world_validation/splits/blind_test.json");
const HOLDOUT_SPLIT_PATH = path.join(ROOT, "data/real_world_validation/splits/internal_holdout.json");

console.log("\n" + "=".repeat(70));
console.log(" TEST 6: FULL-COHORT EXECUTION & ANTI-SAMPLING VERIFICATION");
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

// 1. Audit benchmark runner source code for forbidden sampling patterns
const scriptContent = fs.readFileSync(BENCHMARK_SCRIPT, "utf8");

assert(!scriptContent.includes("const EVAL_SIZE = 100"), "Script does NOT define `const EVAL_SIZE = 100`");
assert(!scriptContent.includes("blindRecords.slice(0, EVAL_SIZE)"), "Script does NOT slice blindRecords by EVAL_SIZE");
assert(!scriptContent.includes("holdoutRecords.slice(0, EVAL_SIZE)"), "Script does NOT slice holdoutRecords by EVAL_SIZE");
assert(scriptContent.includes("runCohortEvaluation(blindRecords"), "Script passes full blindRecords to runCohortEvaluation");
assert(scriptContent.includes("runCohortEvaluation(internalHoldoutRecords"), "Script passes full internalHoldoutRecords to runCohortEvaluation");

// 2. Check split sizes
const blindSplit = JSON.parse(fs.readFileSync(BLIND_SPLIT_PATH, "utf8"));
const holdoutSplit = JSON.parse(fs.readFileSync(HOLDOUT_SPLIT_PATH, "utf8"));

assert(blindSplit.length > 1500, `Blind test split contains full cohort (>1,500 records, got ${blindSplit.length})`);
assert(holdoutSplit.length > 1500, `Internal holdout split contains full cohort (>1,500 records, got ${holdoutSplit.length})`);

// 3. Verify benchmark_results.json if it exists
const RESULTS_PATH = path.join(ROOT, "data/real_world_validation/results/benchmark_results.json");
if (fs.existsSync(RESULTS_PATH)) {
  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
  assert(results.metadata?.cohortExecution === "FULL_COHORT_100_PERCENT", "Results metadata confirms FULL_COHORT_100_PERCENT execution");
  assert(results.splits?.BLIND_TEST?.n === blindSplit.length, `Blind test evaluated N (${results.splits?.BLIND_TEST?.n}) equals split record count (${blindSplit.length})`);
  assert(results.splits?.INTERNAL_HOLDOUT?.n === holdoutSplit.length, `Internal holdout evaluated N (${results.splits?.INTERNAL_HOLDOUT?.n}) equals split record count (${holdoutSplit.length})`);
} else {
  console.log("  ℹ benchmark_results.json not yet written (benchmark currently executing).");
}

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
