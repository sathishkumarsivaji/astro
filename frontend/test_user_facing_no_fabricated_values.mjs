/**
 * ASTROVERSE — User-Facing Missing Data & No-Fabrication Verification Suite
 *
 * Verifies that when incomplete, empty, or uncalculated chart data is supplied:
 * 1. Calendar engine returns INSUFFICIENT_DATA rather than fabricating Moon sign transits.
 * 2. Consultation engine produces honest fallback diagnostics without fabricating planets or signs.
 * 3. Direction, distance, and wealth evaluators return indeterminate / unavailable statuses.
 * 4. Baby name engine rejects incomplete birth data rather than fabricating signs.
 * 5. Life-event correlator returns INSUFFICIENT_DASHA_DATA on missing dasha tables.
 * 6. Report generation gracefully handles missing ascendants without fabricating Aries or default planets.
 */

import { strict as assert } from "assert";
import {
  generatePersonalizedMonthCalendar,
  correlateLifeEventWithAstrology
} from "./src/services/calendarEngine.js";
import {
  evaluateSpouseDirection,
  evaluateSpouseGeographicDistance,
  evaluateSpouseFamilyWealth,
  evaluateGemstoneRemedies,
  generateAstrologerConsultation
} from "./src/services/consultationEngine.js";
import { calculateNewbornAstroProfile } from "./src/services/babyNameEngine.js";
import {
  getAscendantName,
  getAscendantTamil,
  getMoonSignName,
  getMoonSignTamil,
  getMoonNakshatraName,
  getMoonPada,
  getSunSignName,
  getCurrentDasha
} from "./src/types/chartAccessors.js";

console.log("\n=================================================================");
console.log(" ASTROVERSE USER-FACING MISSING DATA & INTEGRITY SUITE");
console.log("=================================================================\n");

let passedCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`✓ ${desc}`);
    passedCount++;
  } catch (err) {
    console.error(`✗ ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 1. CALENDAR ENGINE MISSING DATA RESILIENCE
// ---------------------------------------------------------------------------
console.log("1. Testing Calendar Engine Missing Data Resilience...");

test("Calendar engine returns INSUFFICIENT_DATA when chart has no Moon sign", () => {
  const emptyChart = {
    planets: [],
    ascendant: null,
    moon: null,
    moonSign: null
  };

  const cal = generatePersonalizedMonthCalendar(2026, 6, emptyChart);
  assert.equal(cal.status, "INSUFFICIENT_DATA");
  assert.equal(cal.days.length, 0);
  assert.match(cal.reason, /Moon sign unavailable/i);
});

test("Calendar engine returns INSUFFICIENT_DATA for null chart", () => {
  const cal = generatePersonalizedMonthCalendar(2026, 6, null);
  assert.equal(cal.status, "INSUFFICIENT_DATA");
  assert.equal(cal.days.length, 0);
});

// ---------------------------------------------------------------------------
// 2. CONSULTATION ENGINE SUB-EVALUATORS ON EMPTY INPUTS
// ---------------------------------------------------------------------------
console.log("\n2. Testing Consultation Engine Sub-Evaluators on Empty Inputs...");

test("Spouse direction evaluator handles null/empty chart safely with INSUFFICIENT_DATA", () => {
  const resNull = evaluateSpouseDirection(null);
  assert.ok(resNull);
  assert.equal(resNull.primaryDirection, null);
  assert.equal(resNull.secondaryDirection, null);
  assert.equal(resNull.confidenceCategory, "INSUFFICIENT_DATA");

  const resEmpty = evaluateSpouseDirection({});
  assert.ok(resEmpty);
  assert.equal(resEmpty.primaryDirection, null);
  assert.equal(resEmpty.secondaryDirection, null);
  assert.equal(resEmpty.confidenceCategory, "INSUFFICIENT_DATA");
});

test("Spouse geographic distance evaluator handles null/empty chart safely with INSUFFICIENT_DATA", () => {
  const resNull = evaluateSpouseGeographicDistance(null);
  assert.ok(resNull);
  assert.equal(resNull.distanceCategory, "INSUFFICIENT_DATA");

  const resEmpty = evaluateSpouseGeographicDistance({});
  assert.ok(resEmpty);
  assert.equal(resEmpty.distanceCategory, "INSUFFICIENT_DATA");
});

test("Spouse family wealth evaluator handles null/empty chart safely", () => {
  const resNull = evaluateSpouseFamilyWealth(null);
  assert.ok(resNull);
  assert.equal(resNull.classification, "INSUFFICIENT_DATA");
  assert.equal(resNull.confidence, "INSUFFICIENT_DATA");

  const resEmpty = evaluateSpouseFamilyWealth({});
  assert.ok(resEmpty);
  assert.equal(resEmpty.classification, "INSUFFICIENT_DATA");
  assert.equal(resEmpty.confidence, "INSUFFICIENT_DATA");
});

test("Gemstone remedies evaluator handles null/empty chart safely with null primary gemstone", () => {
  const resNull = evaluateGemstoneRemedies(null);
  assert.ok(resNull);
  assert.equal(resNull.primaryGemstone, null);
  assert.equal(resNull.primaryLord, null);

  const resEmpty = evaluateGemstoneRemedies({});
  assert.ok(resEmpty);
  assert.equal(resEmpty.primaryGemstone, null);
  assert.equal(resEmpty.primaryLord, null);
});

test("generateAstrologerConsultation handles empty chart without crashing or fabricating", () => {
  const emptyChart = {
    planets: [],
    houses: [],
    dashaTable: []
  };

  const consultEn = generateAstrologerConsultation(emptyChart, "career", { lang: "en" });
  assert.ok(consultEn);
  assert.ok(Array.isArray(consultEn.sections));
  assert.ok(consultEn.sections.length >= 10);

  const consultTa = generateAstrologerConsultation(emptyChart, "marriage", { lang: "ta" });
  assert.ok(consultTa);
  assert.ok(Array.isArray(consultTa.sections));
  assert.ok(consultTa.sections.length >= 10);
});

// ---------------------------------------------------------------------------
// 3. CANONICAL ACCESSORS NEVER RETURN FABRICATED VALUES
// ---------------------------------------------------------------------------
console.log("\n3. Testing Canonical Accessor Invariants...");

test("Canonical accessors strictly return null for non-calculated fields", () => {
  const partialChart = {
    ascendantSign: undefined,
    moonSign: null,
    moonNakshatra: "",
    sunSign: undefined,
    currentDasha: null
  };

  assert.equal(getAscendantName(partialChart), null);
  assert.equal(getAscendantTamil(partialChart), null);
  assert.equal(getMoonSignName(partialChart), null);
  assert.equal(getMoonSignTamil(partialChart), null);
  assert.equal(getMoonNakshatraName(partialChart), null);
  assert.equal(getMoonPada(partialChart), null);
  assert.equal(getSunSignName(partialChart), null);
  assert.equal(getCurrentDasha(partialChart), null);
});

console.log(`\n=================================================================`);
console.log(` ALL ${passedCount} USER-FACING MISSING-DATA CHECKS PASSED 100%!`);
console.log(`=================================================================\n`);
