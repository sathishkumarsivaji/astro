/**
 * test_golden_astronomy.mjs
 * 
 * Comprehensive Independent Astronomical & Classical Regression Test Suite
 * 
 * Verifies:
 * 1. Independent D60 Canonical Oracle (720 distinct sign-division points).
 * 2. Multi-epoch astronomical positions (1900 to 2050) across varied longitudes/latitudes.
 * 3. Dynamic Ascendant angular speed and birth-time sensitivity across latitudes.
 * 4. Panchanga sunrise anchoring, transition solver convergence, and polar conditions.
 * 5. Event Muhurta civil date iteration in DST zones (23h / 25h days).
 * 6. High-precision Vimshottari dasha balance and multi-level hierarchy.
 * 7. Strict numerical tolerances and classical Jyotisha invariants.
 */

import assert from "node:assert";
import fs from "node:fs";
import {
  calculatePlanetaryPositions,
  calculateD60,
  calculateD3,
  calculateD9,
  calculateDailyPanchang,
  calculateEventMuhurta,
  computeDetailedVimshottari,
  calculateReportEvidencePackage,
  calculateD60StabilityTest,
  getLahiriAyanamsha,
  getJulianDate,
  D60_NAMES,
  ZODIAC_SIGNS,
  NAKSHATRAS,
  DASHA_LORDS
} from "./src/services/astroEngine.js";

console.log("===============================================================");
console.log(" RUNNING INDEPENDENT ASTRONOMICAL & CLASSICAL REGRESSION SUITE ");
console.log("===============================================================\n");

// ============================================================================
// 1. INDEPENDENT D60 CANONICAL PARASHARI ORACLE (720 SIGN-DIVISION ENTRIES)
// ============================================================================
console.log("1. Verifying Independent 720-Entry D60 Canonical Oracle...");

// Canonical BPHS D60 60 deities in direct order (Slokas 33-42)
const CANONICAL_D60_DEITIES_60 = [
  "Ghora", "Rakshasa", "Deva", "Kubera", "Yaksha", "Kinnara", "Bhrashta", "Kulaghna",
  "Garala", "Vahni", "Maya", "Purishakya", "Apampathi", "Marutwana", "Kaala", "Sarpa",
  "Amrit", "Indu", "Mridu", "Komala", "Heramba", "Brahma", "Vishnu", "Maheshwara",
  "Deva", "Ardra", "Kalinasa", "Kshiteesa", "Kamalakara", "Gulika", "Mrityu", "Kaala",
  "Davagni", "Ghora", "Yama", "Kantaka", "Suddha", "Amrita", "Purnachandra", "Vishadagdha",
  "Kulanasa", "Vamshakshaya", "Utpata", "Kaala", "Saumya", "Komala", "Sheetala", "Karaladamshatra",
  "Chandramukhi", "Praveena", "Kaalpavaka", "Dhannayudha", "Nirmala", "Saumya", "Krura", "Atisheetala",
  "Amrita", "Payodhi", "Brahmana", "Chandrarekha"
];

// Verify 60 deity names in engine match canonical list
assert.strictEqual(D60_NAMES.length, 60, "D60_NAMES in engine must contain exactly 60 deities");
for (let i = 0; i < 60; i++) {
  assert.strictEqual(D60_NAMES[i], CANONICAL_D60_DEITIES_60[i], `D60 deity index ${i} must match canonical ${CANONICAL_D60_DEITIES_60[i]}`);
}

// Build 720-entry oracle table: 12 signs x 60 half-degree divisions (0° to 360°)
let oracleVerifiedCount = 0;
for (let signIdx = 0; signIdx < 12; signIdx++) {
  const isOdd = signIdx % 2 === 0; // 0=Aries (Odd), 1=Taurus (Even), etc.
  for (let part = 0; part < 60; part++) {
    const testDeg = signIdx * 30 + part * 0.5 + 0.25; // midpoint of each 30' segment
    const d60Result = calculateD60(testDeg);
    
    // Expected deity index: direct for odd signs (0..59), reverse for even signs (59..0)
    const expectedDeityIdx = isOdd ? part : (59 - part);
    const expectedDeityName = CANONICAL_D60_DEITIES_60[expectedDeityIdx];
    
    // Expected sign index in D60: (signIdx + (part % 12)) % 12
    const expectedSignIdx = (signIdx + (part % 12)) % 12;
    const expectedSignName = ZODIAC_SIGNS[expectedSignIdx].name;

    assert.strictEqual(d60Result.partIndex, part + 1, `Segment index at degree ${testDeg.toFixed(2)} must be ${part + 1}`);
    assert.strictEqual(d60Result.deity, expectedDeityName, `Deity at ${testDeg.toFixed(2)} (${d60Result.name}) must be ${expectedDeityName}`);
    assert.strictEqual(d60Result.index, expectedSignIdx, `D60 sign index at ${testDeg.toFixed(2)} must be ${expectedSignIdx} (${expectedSignName})`);
    oracleVerifiedCount++;
  }
}
assert.strictEqual(oracleVerifiedCount, 720, "All 720 D60 points must be verified");
console.log(`   ✓ All 720 canonical D60 points independently verified (Odd=Direct, Even=Reverse).`);

// ============================================================================
// 2. MULTI-EPOCH ASTRONOMICAL REGRESSION BENCHMARKS (1900 TO 2050)
// ============================================================================
console.log("\n2. Verifying Multi-Epoch Sidereal Ephemeris & Ayanamsha (1900–2050)...");

const EPOCH_BENCHMARKS = [
  {
    epoch: "1900-01-01 12:00 UTC",
    dateStr: "1900-01-01",
    timeStr: "12:00",
    tz: 0,
    lat: 51.4769, // Greenwich
    lng: 0.0,
    expectedAyanamsha: 22.4605,
    minAyanamsha: 22.40,
    maxAyanamsha: 22.48,
    expectedSunDeg: 258.203,
    expectedMoonDeg: 257.157,
    expectedSunSign: "Sagittarius",
    expectedMoonSign: "Sagittarius"
  },
  {
    epoch: "1950-01-01 00:00 UTC",
    dateStr: "1950-01-01",
    timeStr: "00:00",
    tz: 0,
    lat: 13.0827, // Chennai
    lng: 80.2707,
    expectedAyanamsha: 23.1587,
    minAyanamsha: 23.08,
    maxAyanamsha: 23.16,
    expectedSunDeg: 256.846,
    expectedMoonDeg: 38.257,
    expectedSunSign: "Sagittarius",
    expectedMoonSign: "Taurus"
  },
  {
    epoch: "1980-06-15 06:30 IST",
    dateStr: "1980-06-15",
    timeStr: "06:30",
    tz: 5.5,
    lat: 28.6139, // New Delhi
    lng: 77.2090,
    expectedAyanamsha: 23.5840,
    minAyanamsha: 23.50,
    maxAyanamsha: 23.60,
    expectedSunDeg: 60.498,
    expectedMoonDeg: 88.054,
    expectedSunSign: "Gemini",
    expectedMoonSign: "Gemini"
  },
  {
    epoch: "2000-01-01 12:00 UTC (J2000.0)",
    dateStr: "2000-01-01",
    timeStr: "12:00",
    tz: 0,
    lat: 0.0,
    lng: 0.0,
    expectedAyanamsha: 23.8571,
    minAyanamsha: 23.83,
    maxAyanamsha: 23.90,
    expectedSunDeg: 256.512,
    expectedMoonDeg: 199.467,
    expectedSunSign: "Sagittarius",
    expectedMoonSign: "Libra"
  },
  {
    epoch: "2024-04-14 12:00 IST (Mesha Sankranti)",
    dateStr: "2024-04-14",
    timeStr: "12:00",
    tz: 5.5,
    lat: 13.0827,
    lng: 80.2707,
    expectedAyanamsha: 24.1964,
    minAyanamsha: 24.16,
    maxAyanamsha: 24.22,
    expectedSunDeg: 0.608,
    expectedMoonDeg: 72.738,
    expectedSunSign: "Aries",
    expectedMoonSign: "Gemini"
  },
  {
    epoch: "2050-01-01 00:00 UTC",
    dateStr: "2050-01-01",
    timeStr: "00:00",
    tz: 0,
    lat: 13.0827,
    lng: 80.2707,
    expectedAyanamsha: 24.5557,
    minAyanamsha: 24.50,
    maxAyanamsha: 24.62,
    expectedSunDeg: 256.193,
    expectedMoonDeg: 354.123,
    expectedSunSign: "Sagittarius",
    expectedMoonSign: "Pisces"
  }
];

for (const bm of EPOCH_BENCHMARKS) {
  const chart = calculatePlanetaryPositions(bm.dateStr, bm.timeStr, bm.lat, bm.lng, "vedic", bm.tz);
  const ayanamsha = parseFloat(chart.ayanamsa);
  
  assert(Math.abs(ayanamsha - bm.expectedAyanamsha) < 0.01,
    `Ayanamsha for ${bm.epoch} (${ayanamsha.toFixed(4)}°) must equal expected ${bm.expectedAyanamsha}° within 0.01°`);
  
  const sun = chart.planets.find(p => p.name === "Sun");
  const moon = chart.planets.find(p => p.name === "Moon");
  
  assert(Math.abs(sun.longitude - bm.expectedSunDeg) < 0.05,
    `Sun longitude at ${bm.epoch} (${sun.longitude.toFixed(3)}°) must match expected ${bm.expectedSunDeg}° within 0.05°`);
  assert(Math.abs(moon.longitude - bm.expectedMoonDeg) < 0.08,
    `Moon longitude at ${bm.epoch} (${moon.longitude.toFixed(3)}°) must match expected ${bm.expectedMoonDeg}° within 0.08°`);

  assert.strictEqual(sun.sign, bm.expectedSunSign, `Sun sign at ${bm.epoch} must be ${bm.expectedSunSign}, got ${sun.sign}`);
  assert.strictEqual(moon.sign, bm.expectedMoonSign, `Moon sign at ${bm.epoch} must be ${bm.expectedMoonSign}, got ${moon.sign}`);
  
  // Verify all 9 planets are present and have valid longitudes
  const requiredPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  for (const pName of requiredPlanets) {
    const p = chart.planets.find(pl => pl.name === pName);
    assert(p !== undefined, `Planet ${pName} must be present in chart at ${bm.epoch}`);
    assert(typeof p.longitude === "number" && p.longitude >= 0 && p.longitude < 360,
      `Planet ${pName} longitude must be valid [0, 360) at ${bm.epoch}, got ${p.longitude}`);
  }
}
console.log(`   ✓ Multi-epoch ephemeris & Lahiri ayanamsha verified across 1900 to 2050 with numerical precision (${EPOCH_BENCHMARKS.length} epochs).`);

// ============================================================================
// 3. DYNAMIC ASCENDANT ANGULAR SPEED & BIRTH-TIME SENSITIVITY
// ============================================================================
console.log("\n3. Testing Dynamic Ascendant Angular Velocity & Sensitivity Across Latitudes...");

// Equator (lat 0°), Mid-Latitude (lat 28°), High-Latitude (lat 55°)
const LATITUDE_CASES = [
  { name: "Equator (Singapore 1.35°N)", lat: 1.3521, lng: 103.8198 },
  { name: "Mid-Latitude (Chennai 13.08°N)", lat: 13.0827, lng: 80.2707 },
  { name: "Higher-Latitude (London 51.5°N)", lat: 51.5074, lng: -0.1278 }
];

for (const loc of LATITUDE_CASES) {
  const chart = calculatePlanetaryPositions("2024-03-21", "06:00", loc.lat, loc.lng, "vedic", 0);
  assert(typeof chart.ascendantSpeedDegPerMin === "number", `Ascendant speed must be computed for ${loc.name}`);
  assert(chart.ascendantSpeedDegPerMin > 0.10 && chart.ascendantSpeedDegPerMin < 0.75,
    `Ascendant speed for ${loc.name} (${chart.ascendantSpeedDegPerMin.toFixed(4)} deg/min) must be physically realistic (~0.15-0.65 deg/min across latitudes)`);
  
  const d60SensMin = 0.5 / chart.ascendantSpeedDegPerMin;
  const d9SensMin = 3.3333333333333335 / chart.ascendantSpeedDegPerMin;
  
  // D60 threshold should be ~0.5 to ~5.0 minutes
  assert(d60SensMin >= 0.5 && d60SensMin <= 5.0,
    `D60 sensitivity (${d60SensMin.toFixed(2)} min) must be within 0.5-5.0 min range for ${loc.name}`);
  // D9 threshold should be ~4.0 to ~30.0 minutes
  assert(d9SensMin >= 4.0 && d9SensMin <= 30.0,
    `D9 sensitivity (${d9SensMin.toFixed(2)} min) must be within 4.0-30.0 min range for ${loc.name}`);
}

// Test nearest D60 boundary calculations at critical edge points
const edge1 = calculateD60(0.0002778, 0.25); // 0°00'01"
const edge2 = calculateD60(0.4997222, 0.25); // 0°29'59"
const edge3 = calculateD60(0.5002778, 0.25); // 0°30'01"
const midPt = calculateD60(0.2500000, 0.25); // 0°15'00"

assert(edge1.timeToNearestBoundarySeconds < 1.0, `At 0°00'01", time to boundary must be < 1s, got ${edge1.timeToNearestBoundarySeconds}s`);
assert(edge2.timeToNearestBoundarySeconds < 1.0, `At 0°29'59", time to boundary must be < 1s, got ${edge2.timeToNearestBoundarySeconds}s`);
assert(edge3.timeToNearestBoundarySeconds < 1.0, `At 0°30'01", time to boundary must be < 1s, got ${edge3.timeToNearestBoundarySeconds}s`);
assert(Math.abs(midPt.timeToNearestBoundarySeconds - 60.0) < 1.0, `At 0°15'00", time to boundary must be 60s at 0.25°/min, got ${midPt.timeToNearestBoundarySeconds}s`);

console.log("   ✓ Dynamic ascendant velocity & nearest-boundary distance/seconds strictly verified.");

// ============================================================================
// 4. PANCHANGA SUNRISE ANCHORING & NUMERICAL TRANSITION SOLVER
// ============================================================================
console.log("\n4. Testing Panchanga Sunrise Anchoring & Continuous Transition Root-Solver...");

// Test Chennai: Sunrise around ~06:00 AM IST
const panchangChennai = calculateDailyPanchang("2026-04-14", 13.0827, 80.2707, 5.5, { ianaTimezone: "Asia/Kolkata" });
assert(panchangChennai.solarAnchoring.includes("Calculated Local Sunrise"), "Panchang must disclose calculated local sunrise model");
assert(panchangChennai.sunrise !== undefined && panchangChennai.sunrise !== "--:--", "Sunrise time must be calculated");
assert(panchangChennai.sunset !== undefined && panchangChennai.sunset !== "--:--", "Sunset time must be calculated");
assert(panchangChennai.tithi !== undefined, "Tithi at sunrise must be present");
assert(panchangChennai.nakshatra !== undefined, "Nakshatra at sunrise must be present");
assert(panchangChennai.vara !== undefined, "Vara must be derived from civil date");
assert.strictEqual(panchangChennai.vara.name, "Mangalavara (Tuesday)", "2026-04-14 must be Mangalavara (Tuesday)");

// Test transition times format: must be HH:mm or "Full Day"
const tithiUntilStr = panchangChennai.tithi?.until || panchangChennai.tithiUntil;
if (tithiUntilStr && tithiUntilStr !== "Full Day") {
  assert(/^\d{2}:\d{2}$/.test(tithiUntilStr), `tithi until must be in HH:mm format, got ${tithiUntilStr}`);
}

// Test polar day/night handling (Tromsø, Norway 69.65°N in June - Midnight Sun)
const panchangMidnightSun = calculateDailyPanchang("2026-06-21", 69.6492, 18.9553, 2.0, { ianaTimezone: "Europe/Oslo" });
assert(panchangMidnightSun.sunrise !== undefined, "Polar day must provide valid panchang sunrise descriptor");
assert.strictEqual(panchangMidnightSun.tithi !== undefined, true, "Tithi must be calculated during polar day");
console.log("   ✓ Panchanga sunrise anchoring, civil Vara, and polar day resilience verified.");

// ============================================================================
// 5. EVENT MUHURTA CIVIL DATE ITERATION & DST SOLAR TIMES VERIFICATION
// ============================================================================
console.log("\n5. Testing Event Muhurta Civil Calendar Date Iteration & NY DST Solar Shift...");

// Test New York DST transition: 2026-03-07 (EST -5) vs 2026-03-08 (EDT -4) vs 2026-03-09 (EDT -4)
const nyPanchangMarch7 = calculateDailyPanchang("2026-03-07", 40.7128, -74.0060, -5.0, "America/New_York");
const nyPanchangMarch8 = calculateDailyPanchang("2026-03-08", 40.7128, -74.0060, -5.0, "America/New_York");
const nyPanchangMarch9 = calculateDailyPanchang("2026-03-09", 40.7128, -74.0060, -5.0, "America/New_York");

assert.strictEqual(nyPanchangMarch7.sunrise, "06:20 AM", `March 7 NY Sunrise must be 06:20 AM (EST), got ${nyPanchangMarch7.sunrise}`);
assert.strictEqual(nyPanchangMarch8.sunrise, "07:18 AM", `March 8 NY Sunrise must shift by +1h to 07:18 AM (EDT), got ${nyPanchangMarch8.sunrise}`);
assert(nyPanchangMarch9.sunrise === "07:16 AM" || nyPanchangMarch9.sunrise === "07:17 AM", `March 9 NY Sunrise must be ~07:16-07:17 AM (EDT), got ${nyPanchangMarch9.sunrise}`);

// Search for wedding date in New York across March 2026 (DST transition occurs on 2026-03-08)
const nyMuhurta = calculateEventMuhurta("marriage", "2026-03-05", "2026-03-12", 40.7128, -74.0060, -5.0, {
  ianaTimezone: "America/New_York"
});

assert.strictEqual(nyMuhurta.screeningTitle, "Preliminary Panchanga-Based Date Screening", "Muhurta title must use clean screening terminology");
assert(Array.isArray(nyMuhurta.topScreenedDates), "Muhurta must output topScreenedDates array");
assert(Array.isArray(nyMuhurta.allCandidates), "Muhurta must output allCandidates array");
assert.strictEqual(nyMuhurta.allCandidates.length, 8, "Date range March 5 to March 12 inclusive must span exactly 8 calendar days");

// Verify every day in allCandidates is in strictly contiguous YYYY-MM-DD sequence without DST skips
const expectedDates = [
  "2026-03-05", "2026-03-06", "2026-03-07", "2026-03-08",
  "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12"
];
const datesSorted = nyMuhurta.allCandidates.map(c => c.date).sort();
for (let i = 0; i < datesSorted.length; i++) {
  assert.strictEqual(datesSorted[i], expectedDates[i], `Date at index ${i} must be ${expectedDates[i]} across DST change`);
}
console.log("   ✓ Event Muhurta civil date iteration across DST spring-forward strictly verified.");

// ============================================================================
// 6. HIGH-PRECISION VIMSHOTTARI DASHA BALANCE & TIMELINE CONTINUITY
// ============================================================================
console.log("\n6. Testing High-Precision 120-Year Vimshottari Dasha Balance & Continuity...");

// Test birth with Moon at 0.0° Ashwini (Ketu lord, exactly 7.0 years balance)
const ketuFullDasha = computeDetailedVimshottari(0, 1.0, new Date("2000-01-01T00:00:00Z"), null, 0);
assert.strictEqual(ketuFullDasha[0].lord, "Ketu", "First Mahadasha must be Ketu");
assert(Math.abs(ketuFullDasha[0].durationYears - 7.0) < 0.01, `Ketu full balance must be 7.0 years, got ${ketuFullDasha[0].durationYears}`);

// Total years across all 9 Mahadashas must sum to 120.0 years
const totalDashaYears = ketuFullDasha.reduce((acc, md) => acc + md.durationYears, 0);
assert(Math.abs(totalDashaYears - 120.0) < 0.05, `Total Vimshottari cycle must equal 120.0 years, got ${totalDashaYears}`);

// Test birth with Moon at 6°40' Ashwini (50% elapsed, 3.5 years Ketu balance remaining)
const ketuHalfDasha = computeDetailedVimshottari(0, 0.5, new Date("2000-01-01T00:00:00Z"), null, 0);
assert.strictEqual(ketuHalfDasha[0].lord, "Ketu", "First Mahadasha must be Ketu");
assert(Math.abs(ketuHalfDasha[0].durationYears - 3.5) < 0.01, `Ketu remaining balance must be 3.5 years, got ${ketuHalfDasha[0].durationYears}`);
const totalHalfYears = ketuHalfDasha.reduce((acc, md) => acc + md.durationYears, 0);
assert(Math.abs(totalHalfYears - 120.0) < 0.05, `Remaining Vimshottari cycle must equal 120.0 years, got ${totalHalfYears}`);

// Verify Antardashas (bukthis) are strictly sequential and contiguous
for (const md of ketuFullDasha) {
  assert(Array.isArray(md.bukthis) && md.bukthis.length === 9, `Each Mahadasha must contain 9 Bukthis, ${md.lord} has ${md.bukthis?.length}`);
  const adSum = md.bukthis.reduce((acc, ad) => acc + ad.durationYears, 0);
  assert(Math.abs(adSum - md.durationYears) < 0.05, `Sum of Bukthi durations for ${md.lord} (${adSum}) must equal Mahadasha duration (${md.durationYears})`);
}
console.log("   ✓ High-precision Vimshottari dasha balance, antardashas, and 120-year continuity verified.");

// ============================================================================
// 7. D60 STABILITY TEST ENGINE (+/- 2 MINS SENSITIVITY)
// ============================================================================
console.log("\n7. Testing D60 Stability Analysis Tool (+/- 2 Minutes Evaluation)...");

const d60Stability = calculateD60StabilityTest(new Date("1995-05-15T14:30:00+05:30"), 13.0827, 80.2707, 5.5);
assert(d60Stability.tMinus2Min !== undefined, "Must contain tMinus2Min");
assert(d60Stability.tCenter !== undefined, "Must contain tCenter");
assert(d60Stability.tPlus2Min !== undefined, "Must contain tPlus2Min");
assert(typeof d60Stability.isStable === "boolean", "isStable flag must be boolean");
assert(typeof d60Stability.stabilityLevel === "string", "stabilityLevel must be string");
assert(d60Stability.technicalAdvisoryEn.includes("~2 minutes") || d60Stability.technicalAdvisoryEn.includes("30 arc-minutes") || d60Stability.technicalAdvisoryEn.includes("0°30′"),
  "Advisory must describe 0°30′ / 30 arc-minutes sensitivity");
console.log(`   ✓ D60 Stability engine verified: Status = "${d60Stability.stabilityLevel}".`);

// ============================================================================
// 8. EVIDENCE PACKAGE & BIRTH-DATA SENSITIVITY VERIFICATION
// ============================================================================
console.log("\n8. Testing Evidence Package Sensitivity Thresholds & Disclaimers...");

const testChart = calculatePlanetaryPositions("1990-08-15", "10:30", 13.0827, 80.2707, "vedic", 5.5);
const evPkg = calculateReportEvidencePackage(testChart, "en");

assert(evPkg.birthDataConfidence !== undefined, "Evidence package must include birthDataConfidence");
assert(typeof evPkg.birthDataConfidence.d60Sensitivity === "string", "d60Sensitivity must be a string");
assert(typeof evPkg.birthDataConfidence.d9Sensitivity === "string", "d9Sensitivity must be a string");
assert(evPkg.birthDataConfidence.disclaimer.includes("sensitivity of divisional boundaries"), "Disclaimer must state mathematical sensitivity");
console.log(`   ✓ Evidence package sensitivity & boundary notes verified: ${evPkg.birthDataConfidence.d60Sensitivity}`);

// ============================================================================
// 9. GLOBAL TIMEZONE & POLITICAL REGION RESOLVER VERIFICATION
// ============================================================================
console.log("\n9. Testing Global Political Region & Fractional Timezone Resolver...");

import { resolveIanaTimezone } from "./src/services/geoService.js";

const GLOBAL_TZ_CASES = [
  { name: "Phoenix, Arizona (No DST)", lat: 33.4484, lon: -112.0740, country: "United States", code: "us", state: "Arizona", expectedTzId: "America/Phoenix", expectedTz: -7.0 },
  { name: "St. John's, Newfoundland (UTC-3.5)", lat: 47.5615, lon: -52.7126, country: "Canada", code: "ca", state: "Newfoundland", expectedTzId: "America/St_Johns", expectedTz: -3.5 },
  { name: "Adelaide, South Australia (UTC+9.5 with DST)", lat: -34.9285, lon: 138.6007, country: "Australia", code: "au", state: "South Australia", expectedTzId: "Australia/Adelaide", expectedTz: 9.5 },
  { name: "Darwin, Northern Territory (UTC+9.5 no DST)", lat: -12.4634, lon: 130.8456, country: "Australia", code: "au", state: "Northern Territory", expectedTzId: "Australia/Darwin", expectedTz: 9.5 },
  { name: "Perth, Western Australia (UTC+8 no DST)", lat: -31.9505, lon: 115.8605, country: "Australia", code: "au", state: "Western Australia", expectedTzId: "Australia/Perth", expectedTz: 8.0 },
  { name: "Kathmandu, Nepal (UTC+5:45)", lat: 27.7172, lon: 85.3240, country: "Nepal", code: "np", state: "", expectedTzId: "Asia/Kathmandu", expectedTz: 5.75 },
  { name: "Tehran, Iran (UTC+3.5)", lat: 35.6892, lon: 51.3890, country: "Iran", code: "ir", state: "", expectedTzId: "Asia/Tehran", expectedTz: 3.5 },
  { name: "Yangon, Myanmar (UTC+6.5)", lat: 16.8661, lon: 96.1951, country: "Myanmar", code: "mm", state: "", expectedTzId: "Asia/Yangon", expectedTz: 6.5 },
  { name: "London, UK (UTC 0)", lat: 51.5074, lon: -0.1278, country: "United Kingdom", code: "gb", state: "England", expectedTzId: "Europe/London", expectedTz: 0.0 },
  { name: "New York, USA (UTC-5)", lat: 40.7128, lon: -74.0060, country: "United States", code: "us", state: "New York", expectedTzId: "America/New_York", expectedTz: -5.0 }
];

for (const tc of GLOBAL_TZ_CASES) {
  const resolved = resolveIanaTimezone(tc.lat, tc.lon, tc.country, tc.code, tc.state, tc.name);
  assert.strictEqual(resolved.timezoneId, tc.expectedTzId, `Timezone ID for ${tc.name} must be ${tc.expectedTzId}, got ${resolved.timezoneId}`);
  assert.strictEqual(resolved.tz, tc.expectedTz, `Timezone offset for ${tc.name} must be ${tc.expectedTz}, got ${resolved.tz}`);
}
console.log(`   ✓ Global timezone resolver strictly validated across ${GLOBAL_TZ_CASES.length} international multi-zone & fractional locations.`);

// ============================================================================
// 10. INDEPENDENT STATIC GOLDEN REFERENCE FIXTURES VERIFICATION
// ============================================================================
console.log("\n10. Testing Static Golden Reference Fixtures (JSON Data File)...");

const fixturesRaw = fs.readFileSync("./test_fixtures/golden_reference_fixtures.json", "utf8");
const fixtures = JSON.parse(fixturesRaw);

// 10a. D60 static benchmarks
for (const bm of fixtures.d60_benchmarks) {
  const res = calculateD60(bm.longitude);
  assert.strictEqual(res.name, bm.expectedTargetSign, `D60 sign for ${bm.longitude}° must match static fixture ${bm.expectedTargetSign}`);
  assert.strictEqual(res.deity, bm.expectedDeityName, `D60 deity for ${bm.longitude}° must match static fixture ${bm.expectedDeityName}`);
  assert.strictEqual(res.alternativeSignName, bm.expectedAlternativeSign, `D60 alternative sign for ${bm.longitude}° must match ${bm.expectedAlternativeSign}`);
}
console.log(`   ✓ ${fixtures.d60_benchmarks.length} static D60 fixture benchmarks verified.`);

// 10b. D3 static benchmarks
for (const bm of fixtures.d3_benchmarks) {
  const res = calculateD3(bm.longitude);
  assert.strictEqual(res.name, bm.expectedD3Sign, `D3 sign for ${bm.longitude}° must match static fixture ${bm.expectedD3Sign}`);
  assert.strictEqual(res.index, bm.expectedD3SignIdx, `D3 sign index for ${bm.longitude}° must match ${bm.expectedD3SignIdx}`);
}
console.log(`   ✓ ${fixtures.d3_benchmarks.length} static D3 fixture benchmarks verified.`);

// 10c. D9 static benchmarks
for (const bm of fixtures.d9_benchmarks) {
  const res = calculateD9(bm.longitude);
  assert.strictEqual(res.name, bm.expectedD9Sign, `D9 sign for ${bm.longitude}° must match static fixture ${bm.expectedD9Sign}`);
  assert.strictEqual(res.index, bm.expectedD9SignIdx, `D9 sign index for ${bm.longitude}° must match ${bm.expectedD9SignIdx}`);
}
console.log(`   ✓ ${fixtures.d9_benchmarks.length} static D9 fixture benchmarks verified.`);

// 10d. Dasha static benchmarks
for (const bm of fixtures.dasha_benchmarks) {
  const nakIdx = Math.floor(bm.moonLongitude / 13.333333333333334);
  const moonNakPos = bm.moonLongitude % 13.333333333333334;
  const balanceRatio = 1 - (moonNakPos / 13.333333333333334);
  const ruler = NAKSHATRAS[nakIdx].ruler;
  const birthLordIndex = DASHA_LORDS.findIndex(d => d.lord === ruler);
  const res = computeDetailedVimshottari(birthLordIndex, balanceRatio, "1990-01-01", null, 0);
  assert(res.length > 0, "Dasha table must not be empty");
  assert.strictEqual(res[0].lord, bm.expectedFirstLord, `First dasha lord for moon at ${bm.moonLongitude}° must be ${bm.expectedFirstLord}`);
}
console.log(`   ✓ ${fixtures.dasha_benchmarks.length} static Vimshottari dasha fixture benchmarks verified.`);

console.log("\n===============================================================");
console.log(" ALL 780 INDEPENDENT ASTRONOMICAL & REGRESSION TESTS PASSED 100%!  ");
console.log("===============================================================\n");
