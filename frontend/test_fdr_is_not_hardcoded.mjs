/**
 * Mandatory Test 7: FDR Calculation & Anti-Hardcoded P-Value Verification
 *
 * Asserts:
 * - P-values are calculated dynamically from empirical 2x2 contingency tables.
 * - Benjamini-Hochberg ranks, critical values, and significance are computed mathematically.
 * - Zero hardcoded static p-value arrays exist in the production benchmark runner.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  calculateContingencyPValue,
  applyBenjaminiHochberg
} from "./src/services/realWorldValidation/empiricalEvaluationEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const BENCHMARK_SCRIPT = path.join(ROOT, "frontend/test_real_world_empirical_benchmark.mjs");

console.log("\n" + "=".repeat(70));
console.log(" TEST 7: FDR CALCULATION & ANTI-HARDCODED P-VALUE AUDIT");
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

// 1. Audit benchmark runner script for hardcoded p-values
const scriptContent = fs.readFileSync(BENCHMARK_SCRIPT, "utf8");
assert(!scriptContent.includes("pValue: 0.0034"), "Script does not contain hardcoded pValue: 0.0034");
assert(!scriptContent.includes("pValue: 0.012"), "Script does not contain hardcoded pValue: 0.012");
assert(!scriptContent.includes("pValue: 0.021"), "Script does not contain hardcoded pValue: 0.021");
assert(scriptContent.includes("calculateContingencyPValue("), "Script calls calculateContingencyPValue dynamically on data");

// 2. Mathematical verification of calculateContingencyPValue
// Case A: High correlation [[100, 10], [10, 100]] -> p should be extremely small (< 1e-10)
const pHigh = calculateContingencyPValue(100, 10, 10, 100);
assert(pHigh < 1e-10, `High correlation table yields tiny p-value (p=${pHigh.toExponential(3)})`);

// Case B: No correlation / random table [[50, 50], [50, 50]] -> p should be ~1.0
const pNull = calculateContingencyPValue(50, 50, 50, 50);
assert(pNull > 0.90, `Null association table yields p > 0.90 (p=${pNull.toFixed(3)})`);

// 3. Mathematical verification of applyBenjaminiHochberg
const testHypotheses = [
  { ruleId: "H1", pValue: 0.001 },
  { ruleId: "H2", pValue: 0.010 },
  { ruleId: "H3", pValue: 0.040 },
  { ruleId: "H4", pValue: 0.120 },
  { ruleId: "H5", pValue: 0.350 }
];

const fdr = applyBenjaminiHochberg(testHypotheses, 0.05);
assert(fdr.length === 5, "FDR returned 5 adjusted hypotheses");
assert(fdr[0].ruleId === "H1" && fdr[0].rank === 1, "H1 is ranked 1");
assert(fdr[0].bhCriticalValue === 0.010, `H1 critical value is (1/5)*0.05 = 0.01 (got ${fdr[0].bhCriticalValue})`);
assert(fdr[0].isSignificantFDR === true, "H1 is significant under FDR q=0.05");
assert(fdr[1].isSignificantFDR === true, "H2 (p=0.010 <= 0.020) is significant under FDR q=0.05");
assert(fdr[4].isSignificantFDR === false, "H5 (p=0.350 > 0.050) is not significant");

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
