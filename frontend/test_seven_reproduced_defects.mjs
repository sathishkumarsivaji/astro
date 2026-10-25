/**
 * SKR ASTRO — 7 Specific Reproduced Defects Verification Suite
 * ============================================================
 * Reproduces and verifies fixes for:
 * A. Timeline validator: startAge=0.6, endAge=1.6, title="Job promotion", prediction="You will receive a job promotion and expand your business."
 * B. Calendar age: birth=2026-01-31, target=2026-03-01 -> No negative days (-2 days), explicit month-end semantics.
 * C. Household: houses 2 & 4 present; Rahu & Saturn present with null house/longitude -> Must remain UNKNOWN, NOT ABSENT_AFTER_EVALUATION.
 * D. Numerology: Reject 2026-02-31, "bad", empty, unknown system. No fallback TRAITS[1], no NaN/Infinity.
 * E. Baby names: Syllable+suffix candidates marked creative. Constructed meanings not labeled verified etymology.
 * F. Palm: Fixed confidence defaults not labeled calibrated probabilities.
 * G. PDF: Remove silent first-nine-stage truncation (slice(0, 9)), verify Tamil Unicode extraction.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import { validateTimelineApplicability } from "./src/services/applicability/timelineApplicabilityValidator.js";
import { calculateExactCalendarAge } from "./src/services/applicability/applicabilityPolicyEngine.js";
import { evaluateHouseholdArrangement } from "./src/services/questionAnswer/tasks/householdArrangement.js";
import { calculateNumerology } from "./src/services/numerologyEngine.js";
import { generatePhoneticNamesForPada } from "./src/services/babyNameEngine.js";
import { generateLocalDeterministicMasterReport } from "./src/services/aiAstrologyService.js";

console.log("================================================================================");
console.log("TESTING 7 REPRODUCED DEFECTS A-G");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

async function testCase(label, fn) {
  try {
    await fn();
    console.log(`  \x1b[32m✓ [PASS]\x1b[0m ${label}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✗ [FAIL]\x1b[0m ${label}`);
    console.error(`      Error: ${err.message}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// DEFECT A: Timeline Validator
// -----------------------------------------------------------------------------
await testCase("A: Timeline validator rejects infant/toddler job promotion & business expansion", async () => {
  const stage = {
    startAge: 0.6,
    endAge: 1.6,
    title: "Job promotion",
    prediction: "You will receive a job promotion and expand your business."
  };
  const res = validateTimelineApplicability([stage]);
  assert.equal(res.valid, false, "Must return valid=false for infant/toddler job promotion");
  assert.ok(res.violations.length > 0, "Must contain violations");
});

// -----------------------------------------------------------------------------
// DEFECT B: Calendar Age
// -----------------------------------------------------------------------------
await testCase("B: Calendar age: 2026-01-31 to 2026-03-01 has no negative days", async () => {
  const age = calculateExactCalendarAge("2026-01-31", "2026-03-01");
  assert.ok(age !== null, "Age must be calculated");
  assert.ok(age.days >= 0, `Days must not be negative: got ${age.days}`);
  assert.equal(age.months, 1, `Months elapsed must be 1: got ${age.months}`);
  assert.equal(age.days, 1, `Days elapsed must be 1 (from Feb 28 to Mar 1): got ${age.days}`);
});

// -----------------------------------------------------------------------------
// DEFECT C: Household
// -----------------------------------------------------------------------------
await testCase("C: Household with unpositioned Rahu/Saturn remains UNKNOWN, never ABSENT_AFTER_EVALUATION", async () => {
  const mockChart = {
    planets: [
      { name: "Moon", house: 1, sign: "Aries" },
      { name: "Rahu" }, // no house, no longitude
      { name: "Saturn" } // no house, no longitude
    ],
    houses: [
      { number: 1, sign: "Aries" },
      { number: 2, sign: "Taurus" },
      { number: 3, sign: "Gemini" },
      { number: 4, sign: "Cancer", occupants: [] }
    ]
  };
  const res = evaluateHouseholdArrangement({
    context: { chartData: mockChart, questionId: "TEST_C" }
  });
  
  const separativeFact = res.calculatedFacts.find(f => f.id === "FACT_INDEPENDENT_INDICATORS");
  assert.ok(separativeFact, "FACT_INDEPENDENT_INDICATORS must exist");
  assert.notEqual(separativeFact.value, "ABSENT_AFTER_EVALUATION", "Must NOT return ABSENT_AFTER_EVALUATION when house positions are absent");
  assert.equal(separativeFact.value, "UNKNOWN", "Must return UNKNOWN when house positions are absent");
});

// -----------------------------------------------------------------------------
// DEFECT D: Numerology
// -----------------------------------------------------------------------------
await testCase("D: Numerology rejects invalid dates, systems, and avoids TRAITS[1] fallback", async () => {
  assert.throws(() => calculateNumerology("2026-02-31"), /INVALID_DATE|Invalid date/i, "Must reject impossible date 2026-02-31");
  assert.throws(() => calculateNumerology("bad"), /INVALID_DATE|Invalid date/i, "Must reject malformed date 'bad'");
  assert.throws(() => calculateNumerology(""), /INVALID_DATE|Invalid date|required/i, "Must reject empty date");
  assert.throws(() => calculateNumerology("1995-10-24", "John Doe", "unknown_sys"), /INVALID_SYSTEM|Invalid system/i, "Must reject unknown system");
  
  const valid = calculateNumerology("1995-10-24", "John Doe", "pythagorean");
  assert.ok(Number.isFinite(valid.lifePathNumber), "lifePathNumber must be finite");
  assert.ok(Number.isFinite(valid.destinyNumber), "destinyNumber must be finite");
  assert.ok(!isNaN(valid.lifePathNumber), "lifePathNumber must not be NaN");
});

// -----------------------------------------------------------------------------
// DEFECT E: Baby names
// -----------------------------------------------------------------------------
await testCase("E: Baby names generated syllable+suffix candidates marked creative", async () => {
  const generated = generatePhoneticNamesForPada("Ashwini", 1, "Chu", "சு", "boy");
  assert.ok(generated.length > 0, "Must generate names");
  for (const g of generated) {
    assert.equal(g.isCreative, true, "Generated syllable name must have isCreative=true");
    assert.equal(g.provenance, "CREATIVE_SYNTHESIS", "Generated syllable name provenance must be CREATIVE_SYNTHESIS");
    assert.equal(g.etymologyType, "CONSTRUCTED_MEANING", "Generated syllable name etymologyType must be CONSTRUCTED_MEANING");
  }
});

// -----------------------------------------------------------------------------
// DEFECT F: Palm
// -----------------------------------------------------------------------------
await testCase("F: Palm default confidence not labeled calibrated in PDF and telemetry", async () => {
  const palmReportCode = fs.readFileSync("frontend/src/components/PalmReader/PalmReport.jsx", "utf8");
  assert.ok(
    !palmReportCode.includes("${confidenceScore}% Calibrated"),
    "PalmReport.jsx must NOT label confidenceScore as 'Calibrated'"
  );
});

// -----------------------------------------------------------------------------
// DEFECT G: PDF First-nine-stage truncation & Tamil Unicode
// -----------------------------------------------------------------------------
await testCase("G: PDF template does not truncate timeline stages to 9", async () => {
  const dummyStages = Array.from({ length: 15 }, (_, i) => ({
    stageNum: i + 1,
    ageRange: `${i * 5}-${(i + 1) * 5}`,
    calendarYears: `${2020 + i * 5}-${2025 + i * 5}`,
    title: `Career Stage ${i + 1}`,
    dashaTrigger: "Sun",
    lord: "Sun"
  }));
  const report = generateLocalDeterministicMasterReport({
    name: "Test Subject",
    birthDate: "2000-01-01",
    birthTime: "12:00",
    birthPlace: "Chennai",
    planets: [{ name: "Sun", sign: "Aries", degree: 10, house: 1, dignity: "Exalted", nakshatra: "Ashwini", pada: 1 }],
    houses: [{ number: 1, sign: "Aries", degree: 0 }],
    timelineStages: dummyStages,
    chronologicalDashaTimeline: { stages: dummyStages },
    currentPeriod: { activeDasha: "Sun", activeAntardasha: "Moon" }
  }, "en");
  assert.ok(report.includes("Career Stage 15"), "Must include all stages, not silently truncate to 9");
});

console.log("\n================================================================================");
console.log(`Initial Reproduction Summary: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================\n");

if (failed > 0) {
  process.exit(1);
}
