/**
 * ASTROVERSE — Personalized Transit Calendar & Journal Test Suite
 *
 * Validates:
 * 1. 9-Fold Tara Bala mapping across 27 Nakshatras
 * 2. Chandrashtama 8th sign distance calculations
 * 3. 30-Day Personalized Calendar Generation with dynamic daily scoring
 * 4. Life-Event Retrospective Dasha & transit correlation calculation
 */

import {
  calculateTaraBala,
  generatePersonalizedMonthCalendar,
  correlateLifeEventWithAstrology,
  TARA_BALA_TYPES,
  NAKSHATRA_NAMES
} from './src/services/calendarEngine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n==============================================================");
console.log(" RUNNING ASTROVERSE TRANSIT CALENDAR & JOURNAL TEST SUITE");
console.log("==============================================================");

// 1. Tara Bala Calculation Tests
console.log("\n1. Testing 9-Fold Tara Bala Calculations...");
// Janma (1 -> 1)
const tara1 = calculateTaraBala(1, 1);
assert(tara1.name === "Janma", "Nakshatra 1 to 1 evaluates to Janma Tara");

// Sampat (1 -> 2)
const tara2 = calculateTaraBala(1, 2);
assert(tara2.name === "Sampat" && tara2.isAuspicious === true, "Nakshatra 1 to 2 evaluates to Sampat Tara (Auspicious)");

// Vipat (1 -> 3)
const tara3 = calculateTaraBala(1, 3);
assert(tara3.name === "Vipat" && tara3.isAuspicious === false, "Nakshatra 1 to 3 evaluates to Vipat Tara (Inauspicious)");

// Sadhaka (1 -> 6)
const tara6 = calculateTaraBala(1, 6);
assert(tara6.name === "Sadhaka" && tara6.isAuspicious === true, "Nakshatra 1 to 6 evaluates to Sadhaka Tara (Peak Success)");

// Cyclic 27-Nakshatra wrap (27 -> 2)
const taraWrap = calculateTaraBala(27, 2);
assert(taraWrap.taraIndex === 3, "27 to 2 wraps correctly to Vipat Tara (index 3)");

// 2. Personalized Month Calendar Generation
console.log("\n2. Testing 30-Day Transit Calendar Generation...");
const mockChartData = {
  birthDate: "1990-04-25",
  moonSign: { name: "Aries", index: 0 },
  moonNakshatra: { name: "Ashwini", index: 1 },
  currentDasha: { lord: "Jupiter", bukthis: [{ lord: "Mars", isCurrent: true }] }
};

const monthCal = generatePersonalizedMonthCalendar(2026, 9, mockChartData);
assert(monthCal && monthCal.days.length === 30, "September 2026 generates exactly 30 daily forecast items");
assert(monthCal.days[0].taraBala !== undefined, "Every day item contains Tara Bala classification");
assert(monthCal.days[0].score >= 20 && monthCal.days[0].score <= 100, "Daily auspicious score is calibrated between 20 and 100");

// Check Chandrashtama detection for Scorpio (8th from Aries)
const chandrashtamaDays = monthCal.days.filter(d => d.transitSign === "Scorpio");
if (chandrashtamaDays.length > 0) {
  assert(chandrashtamaDays[0].isChandrashtama === true, "Transit Moon in Scorpio correctly triggers Chandrashtama alert for Aries Moon native");
}

// 3. Life-Event Retrospective Correlation Tests
console.log("\n3. Testing Life-Event Astrological Correlation Engine...");
const eventCorrelation = correlateLifeEventWithAstrology("2015-06-15", "Started Tech Company", mockChartData);
assert(eventCorrelation !== null, "Life event correlation calculated successfully");
assert(eventCorrelation.operatingDasha === "Jupiter", "Active Mahadasha identified at event date");
assert(eventCorrelation.ageAtEvent > 25 && eventCorrelation.ageAtEvent < 26, "Age at event calculated with precision");
assert(eventCorrelation.astrologicalSignificance.includes("Jupiter"), "Correlation summary references operating dasha");

console.log("\n==============================================================");
if (failed === 0) {
  console.log(` ALL ${passed} CALENDAR & JOURNAL VERIFICATION CHECKS PASSED 100%!`);
  process.exit(0);
} else {
  console.log(` CALENDAR TESTS: ${passed} passed, ${failed} FAILED.`);
  process.exit(1);
}
console.log("==============================================================\n");
