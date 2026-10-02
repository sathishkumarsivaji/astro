/**
 * Mandatory Test 3: Marriage Event Ordering & Anti-Index-0 Assumption
 *
 * Asserts:
 * - The pipeline NEVER naively assumes marriages[0] is the first marriage.
 * - Confirms chronological sorting identifies the earliest valid marriage.
 * - Explicitly tests known inverted cases from the source dataset (e.g., Alan Bean).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getEarliestDocumentedMarriage } from "./src/services/realWorldValidation/empiricalEvaluationEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const DATASET_PATH = path.join(ROOT, "data/real_world_validation/processed/real_world_validation_dataset.json");

console.log("\n" + "=".repeat(70));
console.log(" TEST 3: MARRIAGE EVENT ORDERING & ANTI-INDEX-0 VERIFICATION");
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

// 1. Synthetic out-of-order record test
const invertedRecord = {
  sourceRecordId: "TestInverted1950",
  birthDate: "1950-01-01",
  birthYear: 1950,
  marriages: [
    {
      marriageDate: "1988-06-20",
      marriageYear: 1988,
      spouse: "Second Spouse",
      outcome: "Dissolution"
    },
    {
      marriageDate: "1972-04-15",
      marriageYear: 1972,
      spouse: "First Spouse",
      outcome: "Dissolution"
    },
    {
      marriageDate: "2005-09-10",
      marriageYear: 2005,
      spouse: "Third Spouse",
      outcome: "Ongoing"
    }
  ]
};

const earliest = getEarliestDocumentedMarriage(invertedRecord);
assert(earliest !== null, "Earliest marriage resolved from multiple marriages");
assert(earliest.marriageYear === 1972, `Earliest marriage year is 1972, NOT marriages[0] 1988 (got ${earliest.marriageYear})`);
assert(earliest.spouse === "First Spouse", `Earliest spouse is 'First Spouse' (got ${earliest.spouse})`);

// 2. Real dataset audit for known inverted records
const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));

// Find Alan Bean or any multi-marriage person where raw data had inverted ordering
const multiMarriagePersons = dataset.filter(r => r.marriages && r.marriages.length > 1);
assert(multiMarriagePersons.length > 500, `Found substantial multi-marriage cohort in public dataset (${multiMarriagePersons.length})`);

// Check that firstDocumentedMarriage in all processed records is chronologically earliest
let properlySortedCount = 0;
let violations = 0;

for (const p of multiMarriagePersons) {
  const fdm = p.firstDocumentedMarriage;
  if (!fdm || !fdm.marriageYear) continue;

  for (const other of p.marriages) {
    if (other.marriageYear && other.marriageYear < fdm.marriageYear) {
      violations++;
      console.error(`  Violation in ${p.sourceRecordId}: fdm is ${fdm.marriageYear} but found earlier ${other.marriageYear}`);
    }
  }
  properlySortedCount++;
}

assert(violations === 0, `Zero chronology violations across all ${properlySortedCount} multi-marriage records`);
assert(properlySortedCount > 500, `Verified chronological first marriage for ${properlySortedCount} persons`);

// Specific check for Alan Bean if present
const alanBean = dataset.find(r => r.name && r.name.toLowerCase().includes("alan bean"));
if (alanBean) {
  const alanEarliest = alanBean.firstDocumentedMarriage;
  assert(alanEarliest.marriageYear === 1955, `Alan Bean first marriage correctly identified as 1955 (got ${alanEarliest.marriageYear})`);
}

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
