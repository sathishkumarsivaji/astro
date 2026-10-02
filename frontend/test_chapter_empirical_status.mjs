/**
 * Mandatory Test 11: Chapter Empirical Status Audit
 *
 * Asserts:
 * - Chapter 9 is marked EXPERIMENTAL (NOT EMPIRICALLY_VALIDATED).
 * - Chapter 16 is marked EXPERIMENTAL / RETROSPECTIVE CANDIDATE AUDIT.
 * - Non-marriage domain chapters are NOT_EMPIRICALLY_VALIDATED or TRADITIONAL_ONLY.
 * - No domain without independent outcome datasets claims empirical validation.
 */

import {
  CHAPTER_AVAILABILITY_MATRIX,
  getChapterAvailability
} from "./src/services/realWorldValidation/chapterAvailabilityMatrix.js";

console.log("\n" + "=".repeat(70));
console.log(" TEST 11: CHAPTER EMPIRICAL STATUS AUDIT & ANTI-OVERCLAIM");
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

// 1. Chapter 9 check
const ch9 = getChapterAvailability(9);
assert(ch9 !== null, "Chapter 9 exists in matrix");
assert(
  ch9.status === "EXPERIMENTAL",
  `Chapter 9 status is EXPERIMENTAL (NOT EMPIRICALLY_VALIDATED) (got ${ch9.status})`
);

// 2. Chapter 16 check
const ch16 = getChapterAvailability(16);
assert(ch16 !== null, "Chapter 16 exists in matrix");
assert(
  ch16.status === "EXPERIMENTAL",
  `Chapter 16 status is EXPERIMENTAL (got ${ch16.status})`
);

// 3. Non-marriage domain chapters must NOT claim EMPIRICALLY_VALIDATED
const nonMarriageDomains = [10, 11, 12, 13, 14, 15]; // Career, Property, Children, Education, Health, Finance
for (const chNum of nonMarriageDomains) {
  const ch = getChapterAvailability(chNum);
  if (!ch) continue;

  assert(
    ch.status !== "EMPIRICALLY_VALIDATED",
    `Chapter ${chNum} (${ch.chapterTitle}) does NOT claim EMPIRICALLY_VALIDATED (got ${ch.status})`
  );
  assert(
    ["NOT_EMPIRICALLY_VALIDATED", "TRADITIONAL_ONLY", "EXPERIMENTAL", "CALCULATED"].includes(ch.status),
    `Chapter ${chNum} status is valid honest classification: ${ch.status}`
  );
}

// 4. Zero chapters claim EMPIRICALLY_VALIDATED without independent verification
let empiricallyValidatedCount = 0;
for (const ch of CHAPTER_AVAILABILITY_MATRIX) {
  if (ch.status === "EMPIRICALLY_VALIDATED") {
    empiricallyValidatedCount++;
  }
}
assert(
  empiricallyValidatedCount === 0,
  `Zero chapters in matrix claim EMPIRICALLY_VALIDATED (got ${empiricallyValidatedCount})`
);

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
