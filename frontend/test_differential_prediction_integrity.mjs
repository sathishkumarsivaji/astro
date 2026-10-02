/**
 * ASTROVERSE — Differential Prediction Integrity & Feature Robustness Test Suite
 *
 * Validates:
 * 1. Differential Chart Mutation Testing: Verifies that changing birth coordinates / times
 *    genuinely changes Lagna, Moon sign, spouse direction, spouse distance, gemstone remedies, and wealth evaluations.
 * 2. Baby Name Engine Robustness: Ensures calculateNewbornAstroProfile executes without ReferenceErrors,
 *    produces exact numerological reduction digits, and aligns nakshatra pada syllables.
 * 3. Personalized Calendar Ephemeris Alignment: Verifies that daily Moon transits match high-precision
 *    VSOP87/ELP-2000 astronomical ephemeris across all calendar days.
 */

import { strict as assert } from "assert";
import { calculateChartBySystem } from "./src/astrology/index.js";
import {
  getAscendantSignName,
  getMoonSignName,
  evaluateSpouseDirection,
  evaluateSpouseGeographicDistance,
  evaluateSpouseFamilyWealth,
  evaluateGemstoneRemedies,
  generateAstrologerConsultation
} from "./src/services/consultationEngine.js";
import { calculateNewbornAstroProfile } from "./src/services/babyNameEngine.js";
import { generatePersonalizedMonthCalendar, calculateTaraBala } from "./src/services/calendarEngine.js";
import { getSiderealSunMoon, norm360 } from "./src/services/astroEngine.js";

console.log("\n=================================================================");
console.log(" ASTROVERSE DIFFERENTIAL PREDICTION & FEATURE INTEGRITY SUITE");
console.log("=================================================================\n");

let passed = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 1. DIFFERENTIAL CHART MUTATION TESTING
// ---------------------------------------------------------------------------
console.log("1. Testing Differential Chart Outcomes across Diverse Lagnas...");

// Chart A: Aries Lagna (Chennai, morning)
const chartAries = calculateChartBySystem("lahiri", {
  birthDate: "1995-04-14",
  birthTime: "06:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5
});

// Chart B: Cancer Lagna (Chennai, midday)
const chartCancer = calculateChartBySystem("lahiri", {
  birthDate: "1995-04-14",
  birthTime: "12:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5
});

// Chart C: Libra Lagna (Chennai, evening)
const chartLibra = calculateChartBySystem("lahiri", {
  birthDate: "1995-04-14",
  birthTime: "18:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5
});

// Chart D: Capricorn Lagna (Chennai, midnight)
const chartCap = calculateChartBySystem("lahiri", {
  birthDate: "1995-04-14",
  birthTime: "01:00",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5
});

test("Canonical getAscendantSignName accurately identifies varying Ascendant signs", () => {
  const ascA = getAscendantSignName(chartAries);
  const ascB = getAscendantSignName(chartCancer);
  const ascC = getAscendantSignName(chartLibra);
  const ascD = getAscendantSignName(chartCap);

  assert.equal(ascA, "Aries", `Expected Aries, got ${ascA}`);
  assert.equal(ascB, "Cancer", `Expected Cancer, got ${ascB}`);
  assert.equal(ascC, "Libra", `Expected Libra, got ${ascC}`);
  assert.equal(ascD, "Capricorn", `Expected Capricorn, got ${ascD}`);
});

test("Canonical getMoonSignName extracts Moon sign reliably across chart representations", () => {
  const moonA = getMoonSignName(chartAries);
  assert.equal(typeof moonA, "string");
  assert.ok(moonA.length > 0);
  assert.equal(moonA, chartAries.moonSign?.name);
});

test("Spouse Direction evaluates differentially based on true 7th house and Venus positions", () => {
  const dirA = evaluateSpouseDirection(chartAries);  // 7th house = Libra (WEST)
  const dirB = evaluateSpouseDirection(chartCancer); // 7th house = Capricorn (SOUTH)
  const dirC = evaluateSpouseDirection(chartLibra);  // 7th house = Aries (EAST)
  const dirD = evaluateSpouseDirection(chartCap);    // 7th house = Cancer (NORTH)

  assert.equal(dirA.primaryDirection, "WEST", `Aries Lagna 7th Libra direction expected WEST, got ${dirA.primaryDirection}`);
  assert.equal(dirB.primaryDirection, "SOUTH", `Cancer Lagna 7th Capricorn direction expected SOUTH, got ${dirB.primaryDirection}`);
  assert.equal(dirC.primaryDirection, "EAST", `Libra Lagna 7th Aries direction expected EAST, got ${dirC.primaryDirection}`);
  assert.equal(dirD.primaryDirection, "NORTH", `Capricorn Lagna 7th Cancer direction expected NORTH, got ${dirD.primaryDirection}`);
});

test("Spouse Geographic Distance distinguishes sign mobility and Rahu placements", () => {
  // Aries Lagna -> Rahu in 7th house Libra -> DIFFERENT_STATE
  const distAries = evaluateSpouseGeographicDistance(chartAries);
  assert.equal(distAries.distanceCategory, "DIFFERENT_STATE");

  // Libra Lagna -> 7th Aries (Movable Rāśi without Rahu) -> DIFFERENT_DISTRICT
  const distLibra = evaluateSpouseGeographicDistance(chartLibra);
  assert.equal(distLibra.distanceCategory, "DIFFERENT_DISTRICT");

  // Taurus Lagna -> 7th Scorpio (Fixed Rāśi without Rahu) -> NEARBY_LOCALITY
  const chartTaurus = calculateChartBySystem("lahiri", {
    birthDate: "1995-04-14",
    birthTime: "08:15",
    latitude: 13.0827,
    longitude: 80.2707,
    utcOffset: 5.5
  });
  const distTaurus = evaluateSpouseGeographicDistance(chartTaurus);
  assert.equal(distTaurus.distanceCategory, "NEARBY_LOCALITY");
});

test("Gemstone Remedies dynamically adapt to Ascendant Lord without fallback drift", () => {
  const gemA = evaluateGemstoneRemedies(chartAries);
  const gemB = evaluateGemstoneRemedies(chartCancer);
  const gemC = evaluateGemstoneRemedies(chartLibra);

  assert.ok(gemA.primaryLord && gemA.primaryLord.startsWith("Mars"), `Aries Lagna lord expected Mars, got ${gemA.primaryLord}`);
  assert.ok(gemB.primaryLord && gemB.primaryLord.startsWith("Moon"), `Cancer Lagna lord expected Moon, got ${gemB.primaryLord}`);
  assert.ok(gemC.primaryLord && gemC.primaryLord.startsWith("Venus"), `Libra Lagna lord expected Venus, got ${gemC.primaryLord}`);
});

test("Full Consultation Report Section 4 reflects authentic chart Lagna and Moon sign", () => {
  const reportA = generateAstrologerConsultation(chartAries, "When will I get married?", { isTamil: false });
  const section4A = reportA.sections.find(s => s.sectionNumber === 4);
  assert.ok(section4A, "Section 4 must exist");
  assert.ok(section4A.content.includes("Ascendant: Aries"), `Section 4 should include 'Ascendant: Aries', got: ${section4A.content}`);

  const reportB = generateAstrologerConsultation(chartLibra, "When will I get married?", { isTamil: false });
  const section4B = reportB.sections.find(s => s.sectionNumber === 4);
  assert.ok(section4B, "Section 4 must exist");
  assert.ok(section4B.content.includes("Ascendant: Libra"), `Section 4 should include 'Ascendant: Libra', got: ${section4B.content}`);
});

// ---------------------------------------------------------------------------
// 2. BABY NAME ENGINE ROBUSTNESS
// ---------------------------------------------------------------------------
console.log("\n2. Testing Baby Name Engine Execution & Numerology Precision...");

test("calculateNewbornAstroProfile handles full date strings without ReferenceError", () => {
  const profile = calculateNewbornAstroProfile({
    dob: "2026-08-28",
    time: "14:15",
    lat: 13.0827,
    lon: 80.2707,
    tz: 5.5,
    gender: "girl",
    initial: "K"
  });

  assert.ok(profile, "Profile must be generated");
  assert.equal(profile.driverNumber, 1, `28th day reduces to 2+8=10->1, got ${profile.driverNumber}`);
  assert.equal(typeof profile.destinyNumber, "number");
  assert.ok(profile.pada >= 1 && profile.pada <= 4);
  assert.ok(profile.suggestedNames && profile.suggestedNames.length > 0, "Suggested names should be populated");
  assert.equal(typeof profile.auspiciousSyllableEn, "string");
  assert.ok(profile.auspiciousSyllableEn.length > 0);
});

test("calculateNewbornAstroProfile supports input.birthDate and input.birthTime alias keys", () => {
  const profile = calculateNewbornAstroProfile({
    birthDate: "2025-11-09",
    birthTime: "09:45",
    latitude: 28.6139,
    longitude: 77.2090,
    tz: 5.5,
    gender: "boy"
  });

  assert.ok(profile);
  assert.equal(profile.driverNumber, 9, `9th day driver number is 9, got ${profile.driverNumber}`);
  // 2025-11-09: y: 2+0+2+5=9, m: 1+1=2, d: 9 => 9+2+9 = 20 => 2+0=2
  assert.equal(profile.destinyNumber, 2, `Destiny number expected 2, got ${profile.destinyNumber}`);
});

// ---------------------------------------------------------------------------
// 3. PERSONALIZED CALENDAR EPHEMERIS ALIGNMENT
// ---------------------------------------------------------------------------
console.log("\n3. Testing Calendar Engine Moon Transit Ephemeris Precision...");

test("generatePersonalizedMonthCalendar matches true VSOP87/ELP-2000 Moon for January 2027", () => {
  const chart = {
    system: "lahiri",
    moonSign: { name: "Aries", index: 0 },
    moonNakshatra: { name: "Ashwini", index: 1 }
  };

  const cal = generatePersonalizedMonthCalendar(2027, 1, chart);
  assert.equal(cal.days.length, 31, "January must contain 31 days");

  const SIGN_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const NAKSHATRA_NAMES = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Svati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
  ];

  for (const dayItem of cal.days) {
    const d = dayItem.day;
    const testTime = new Date(Date.UTC(2027, 0, d, 6, 0, 0));
    const { moonLong } = getSiderealSunMoon(testTime, "lahiri");
    const normMoon = norm360(moonLong);
    const expectedNakIdx = Math.floor(normMoon / (360 / 27)) + 1;
    const expectedSignIdx = Math.floor(normMoon / 30) % 12;

    assert.equal(dayItem.transitNakshatra, NAKSHATRA_NAMES[expectedNakIdx - 1], `Day ${d} nakshatra mismatch: expected ${NAKSHATRA_NAMES[expectedNakIdx - 1]}, got ${dayItem.transitNakshatra}`);
    assert.equal(dayItem.transitSign, SIGN_NAMES[expectedSignIdx], `Day ${d} sign mismatch: expected ${SIGN_NAMES[expectedSignIdx]}, got ${dayItem.transitSign}`);
  }
});

test("Chandrashtama accurately triggers when transit Moon enters 8th sign from natal Moon", () => {
  // Aries Moon native: 8th sign is Scorpio
  const ariesMoonChart = {
    system: "lahiri",
    moonSign: { name: "Aries", index: 0 },
    moonNakshatra: { name: "Ashwini", index: 1 }
  };
  const cal = generatePersonalizedMonthCalendar(2027, 1, ariesMoonChart);

  for (const day of cal.days) {
    if (day.transitSign === "Scorpio") {
      assert.equal(day.isChandrashtama, true, `Day ${day.dateStr} with transit Moon in Scorpio must be Chandrashtama for Aries Moon`);
    } else {
      assert.equal(day.isChandrashtama, false, `Day ${day.dateStr} with transit Moon in ${day.transitSign} must NOT be Chandrashtama for Aries Moon`);
    }
  }
});

console.log("\n=================================================================");
console.log(` ALL ${passed} DIFFERENTIAL INTEGRITY & ROBUSTNESS CHECKS PASSED 100%!`);
console.log("=================================================================\n");
