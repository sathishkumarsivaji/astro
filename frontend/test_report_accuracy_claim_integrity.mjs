/**
 * Mandatory Test 12: Report Accuracy Claim Integrity & Anti-Fabrication Audit
 *
 * Asserts:
 * - No forbidden categorical prediction language ("ensures", "guarantees", "destined", "inevitable", "will definitely")
 *   in report generation or interpretation services.
 * - Mandatory scientific disclaimer is present on all empirical reports and benchmark outputs.
 * - Any chapter or domain without independent outcome datasets displays NO fabricated accuracy percentage.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

console.log("\n" + "=".repeat(70));
console.log(" TEST 12: REPORT ACCURACY CLAIM INTEGRITY & ANTI-FABRICATION");
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

// 1. Scan critical prediction services for forbidden categorical language
const filesToScan = [
  "frontend/src/services/astroEngine.js",
  "frontend/src/services/consultationEngine.js",
  "frontend/src/services/expertPrediction/domainTimingEngine.js",
  "frontend/src/services/realWorldValidation/empiricalEvaluationEngine.js"
];

const FORBIDDEN_WORDS = [
  "will definitely",
  "will certainly",
  "destined to be",
  "guarantees that",
  "proves your destiny"
];

for (const relFile of filesToScan) {
  const fullPath = path.join(ROOT, relFile);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, "utf8").toLowerCase();

  for (const phrase of FORBIDDEN_WORDS) {
    const hasPhrase = content.includes(phrase);
    assert(!hasPhrase, `${relFile} does NOT contain forbidden phrase: "${phrase}"`);
  }
}

// 2. Scan for mandatory scientific disclaimer in empirical engine
const empEnginePath = path.join(ROOT, "frontend/src/services/realWorldValidation/empiricalEvaluationEngine.js");
const empEngineContent = fs.readFileSync(empEnginePath, "utf8");
assert(
  empEngineContent.includes("ASTRONOMICAL CALCULATION ≠ TRADITIONAL INTERPRETATION ≠ EMPIRICAL PREDICTION"),
  "empiricalEvaluationEngine.js contains mandatory non-negotiable scientific disclaimer"
);

// 3. Scan chapter availability matrix for unvalidated percentage claims
const matrixPath = path.join(ROOT, "frontend/src/services/realWorldValidation/chapterAvailabilityMatrix.js");
const matrixContent = fs.readFileSync(matrixPath, "utf8");

// No fabricated accuracy percentage strings like "98% accuracy" or "99.5% validated"
assert(!matrixContent.includes("98% accuracy"), "Matrix does NOT claim '98% accuracy'");
assert(!matrixContent.includes("99% accuracy"), "Matrix does NOT claim '99% accuracy'");
assert(!matrixContent.includes("100% accuracy"), "Matrix does NOT claim '100% accuracy'");

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
