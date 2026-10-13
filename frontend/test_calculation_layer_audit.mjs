/**
 * SKR ASTRO — CALCULATION LAYER AUDIT SUITE
 *
 * Exhaustive independent verification of calculation-layer invariants:
 * 1. Missing coordinates rejection (null, "", boolean) & preservation of true 0° (Equator / Prime Meridian)
 * 2. Blank UTC offset rejection ("") & strict timezone resolution
 * 3. Calendar date bounds & clock time format validation (reject 2026-02-30, 25:99, 06:30:xx, 1994-08-15-99)
 * 4. Bhava Chalit exact unrounded boundary assignment (85.002° in House 12 vs 85.004° in House 1)
 * 5. Classical Sripati Cusps quadrant trisection geometry (no repeated midpoints, strictly distinct)
 * 6. Nashta Jataka user-confirmed verification proofs & non-empirical provenance tracking
 */

import assert from "assert";
import { normalizeBirthData } from "./src/astrology/astronomy/time.js";
import { calculateChartBySystem } from "./src/astrology/index.js";
import { calculateSripatiCusps } from "./src/astrology/astronomy/coordinates.js";
import { calculateBhavaChalit, calculatePlanetaryPositions } from "./src/services/astroEngine.js";
import { reverseCalculateBirthTimeAndDOB } from "./src/services/nashtaJatakaEngine.js";

console.log("=== RUNNING CALCULATION LAYER AUDIT SUITE ===\n");

// ============================================================================
// 1. COORDINATES VALIDATION & PRESERVATION OF NUMERIC 0°
// ============================================================================
console.log("1. Testing Coordinate Validation & Zero Preservation...");

const invalidCoordCases = [
  { desc: "latitude: null", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: null, longitude: 80.0, timezoneId: "UTC" } },
  { desc: "latitude: empty string", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: "", longitude: 80.0, timezoneId: "UTC" } },
  { desc: "latitude: boolean false", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: false, longitude: 80.0, timezoneId: "UTC" } },
  { desc: "latitude: whitespace", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: "   ", longitude: 80.0, timezoneId: "UTC" } },
  { desc: "latitude: out of range (>90)", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 90.5, longitude: 80.0, timezoneId: "UTC" } },
  { desc: "longitude: null", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 13.0, longitude: null, timezoneId: "UTC" } },
  { desc: "longitude: empty string", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 13.0, longitude: "", timezoneId: "UTC" } },
  { desc: "longitude: boolean false", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 13.0, longitude: false, timezoneId: "UTC" } },
  { desc: "longitude: out of range (>180)", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 13.0, longitude: 180.5, timezoneId: "UTC" } }
];

for (const tc of invalidCoordCases) {
  assert.throws(
    () => normalizeBirthData(tc.data),
    /Invalid latitude|Invalid longitude/,
    `normalizeBirthData must throw on ${tc.desc}`
  );
  assert.throws(
    () => calculateChartBySystem("lahiri", tc.data),
    /Invalid latitude|Invalid longitude/,
    `calculateChartBySystem must throw on ${tc.desc}`
  );
}

// Ensure valid numeric 0.0 coordinates (Equator / Prime Meridian) are strictly accepted
const zeroCoord = normalizeBirthData({
  birthDate: "2000-01-01",
  birthTime: "12:00",
  latitude: 0,
  longitude: 0,
  timezoneId: "UTC"
});
assert.strictEqual(zeroCoord.latitude, 0, "Numeric 0 latitude (Equator) must be preserved");
assert.strictEqual(zeroCoord.longitude, 0, "Numeric 0 longitude (Prime Meridian) must be preserved");

const zeroCoordStr = normalizeBirthData({
  birthDate: "2000-01-01",
  birthTime: "12:00",
  latitude: "0",
  longitude: "0",
  timezoneId: "UTC"
});
assert.strictEqual(zeroCoordStr.latitude, 0);
assert.strictEqual(zeroCoordStr.longitude, 0);

const zeroChart = calculateChartBySystem("lahiri", {
  birthDate: "2000-01-01",
  birthTime: "12:00",
  latitude: 0,
  longitude: 0,
  timezoneId: "UTC"
});
assert(zeroChart && zeroChart.ascendant, "Chart on Equator/Prime Meridian must calculate successfully");
console.log("   ✓ Missing/blank coordinates rejected; genuine 0.0° coordinates preserved.");

// ============================================================================
// 2. UTC OFFSET & TIMEZONE VALIDATION
// ============================================================================
console.log("\n2. Testing UTC Offset & Timezone Validation...");

const invalidOffsetCases = [
  { desc: "utcOffset: empty string without timezone", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 13.0, longitude: 80.0, utcOffset: "" } },
  { desc: "utcOffset: empty string with timezone", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 13.0, longitude: 80.0, utcOffset: "", timezoneId: "Asia/Kolkata" } },
  { desc: "utcOffset: boolean false", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 13.0, longitude: 80.0, utcOffset: false } },
  { desc: "utcOffset: non-numeric string", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 13.0, longitude: 80.0, utcOffset: "invalid" } },
  { desc: "utcOffset: out of bounds (>14)", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 13.0, longitude: 80.0, utcOffset: 15 } },
  { desc: "missing both timezone and offset", data: { birthDate: "1995-05-15", birthTime: "12:00", latitude: 13.0, longitude: 80.0 } }
];

for (const tc of invalidOffsetCases) {
  assert.throws(
    () => normalizeBirthData(tc.data),
    /Invalid UTC offset|Timezone or UTC offset required/,
    `normalizeBirthData must throw on ${tc.desc}`
  );
}

// Ensure valid numeric 0 UTC offset is preserved
const zeroOffset = normalizeBirthData({
  birthDate: "2000-01-01",
  birthTime: "12:00",
  latitude: 51.5,
  longitude: 0,
  utcOffset: 0
});
assert.strictEqual(zeroOffset.utcOffset, 0, "Numeric 0 utcOffset must be accepted");
console.log("   ✓ Blank/boolean UTC offset rejected; numeric 0 offset accepted.");

// ============================================================================
// 3. CALENDAR DATE & CLOCK TIME VALIDATION (BOTH ENTRY POINTS)
// ============================================================================
console.log("\n3. Testing Calendar Date & Clock Time Validation...");

const invalidDateTimeCases = [
  { desc: "February 30 (nonexistent date)", date: "2026-02-30", time: "12:00" },
  { desc: "February 29 in non-leap year 2023", date: "2023-02-29", time: "12:00" },
  { desc: "April 31 (month has 30 days)", date: "2024-04-31", time: "12:00" },
  { desc: "Date with extra segments (1994-08-15-99)", date: "1994-08-15-99", time: "12:00" },
  { desc: "Invalid clock hour/minute (25:99)", date: "2024-05-15", time: "25:99" },
  { desc: "Clock time with extra non-digits (06:30:xx)", date: "2024-05-15", time: "06:30:xx" },
  { desc: "Empty time string", date: "2024-05-15", time: "" }
];

for (const tc of invalidDateTimeCases) {
  assert.throws(
    () => normalizeBirthData({
      birthDate: tc.date,
      birthTime: tc.time,
      latitude: 13.0,
      longitude: 80.0,
      timezoneId: "UTC"
    }),
    /Invalid calendar date|Invalid birth date format|Birth time values out of clock bounds|Invalid birth time format|Birth time is required/,
    `normalizeBirthData must reject ${tc.desc}`
  );

  assert.throws(
    () => calculatePlanetaryPositions(tc.date, tc.time, 13.0, 80.0, "vedic", 5.5),
    /Invalid calendar date|Invalid date format|Time values out of clock bounds|Invalid time format|Time string is required/,
    `calculatePlanetaryPositions must reject ${tc.desc}`
  );
}

// Valid leap year February 29 must be accepted
const leapNorm = normalizeBirthData({
  birthDate: "2024-02-29",
  birthTime: "12:00",
  latitude: 13.0,
  longitude: 80.0,
  timezoneId: "UTC"
});
assert.strictEqual(leapNorm.day, 29);

const leapChart = calculatePlanetaryPositions("2024-02-29", "12:00", 13.0, 80.0, "vedic", 5.5);
assert(leapChart && leapChart.planets, "Leap year Feb 29 must calculate");

// calculatePlanetaryPositions coordinate guards
assert.throws(() => calculatePlanetaryPositions("2024-05-15", "12:00", null, 80.0, "vedic", 5.5), /Valid geographic latitude/);
assert.throws(() => calculatePlanetaryPositions("2024-05-15", "12:00", 13.0, "", "vedic", 5.5), /Valid geographic latitude/);
assert.throws(() => calculatePlanetaryPositions("2024-05-15", "12:00", false, 80.0, "vedic", 5.5), /Valid geographic latitude/);
assert.throws(() => calculatePlanetaryPositions("2024-05-15", "12:00", 13.0, 80.0, "vedic", ""), /Timezone .* is required/);
console.log("   ✓ Calendar bounds, leap year rules, and clock time formats strictly verified.");

// ============================================================================
// 4. BHAVA CHALIT EXACT BOUNDARY ASSIGNMENT
// ============================================================================
console.log("\n4. Testing Bhava Chalit Exact Boundary Assignment...");

// Ascendant at 100.004°
// House 1 Arambha is exactly: 100.004 - 15 = 85.004°
// A planet at 85.002° is BEFORE House 1 Arambha -> must be in House 12!
// A planet at 85.004° is ON House 1 Arambha -> must be in House 1!
// A planet at 85.005° is AFTER House 1 Arambha -> must be in House 1!
const testAsc = 100.004;
const probePlanets = [
  { name: "PlanetA", longitude: 85.002, sign: "Gemini", degreeInSign: 25.002 },
  { name: "PlanetB", longitude: 85.004, sign: "Gemini", degreeInSign: 25.004 },
  { name: "PlanetC", longitude: 85.005, sign: "Gemini", degreeInSign: 25.005 }
];

const chalitResult = calculateBhavaChalit(testAsc, probePlanets, 13.0, 80.0);
const pA = chalitResult.planets.find(p => p.planet === "PlanetA");
const pB = chalitResult.planets.find(p => p.planet === "PlanetB");
const pC = chalitResult.planets.find(p => p.planet === "PlanetC");

assert.strictEqual(pA.chalitBhava, 12, `Planet at 85.002° with House 1 Arambha 85.004° must be in House 12, got House ${pA.chalitBhava}`);
assert.strictEqual(pB.chalitBhava, 1, `Planet at 85.004° with House 1 Arambha 85.004° must be in House 1, got House ${pB.chalitBhava}`);
assert.strictEqual(pC.chalitBhava, 1, `Planet at 85.005° with House 1 Arambha 85.004° must be in House 1, got House ${pC.chalitBhava}`);

// Ensure missing/invalid planet longitude is rejected without silent fallback
assert.throws(
  () => calculateBhavaChalit(testAsc, [{ name: "InvalidPlanet", longitude: null }]),
  /Missing or invalid planet longitude/,
  "Must throw on invalid planet longitude"
);
console.log("   ✓ Exact unrounded Bhava Chalit boundary verified: 85.002° in House 12, 85.004° in House 1.");

// ============================================================================
// 5. SRIPATI CUSPS QUADRANT GEOMETRY
// ============================================================================
console.log("\n5. Testing Sripati Cusps Quadrant Geometry...");

// Test case: Ascendant = 100°, MC = 10°
// Quadrant 1 (MC to Ascendant): Arc = 100 - 10 = 90°. Trisection = 30°.
// H10 = 10°, H11 = 40°, H12 = 70°, H1 = 100°
// Quadrant 2 (Ascendant to IC): IC = 190°. Arc = 190 - 100 = 90°. Trisection = 30°.
// H1 = 100°, H2 = 130°, H3 = 160°, H4 = 190°
// Opposite Houses (180° away):
// H5 = 220°, H6 = 250°, H7 = 280°, H8 = 310°, H9 = 340°
const sripati = calculateSripatiCusps(100, 10);
const m = sripati.midpoints;

assert.strictEqual(m[1], 100, "House 1 mid must equal Ascendant (100°)");
assert.strictEqual(m[10], 10, "House 10 mid must equal MC (10°)");
assert.strictEqual(m[11], 40, "House 11 mid must equal 40° (MC + arc/3)");
assert.strictEqual(m[12], 70, "House 12 mid must equal 70° (MC + 2*arc/3)");
assert.strictEqual(m[4], 190, "House 4 mid must equal IC (190°)");
assert.strictEqual(m[2], 130, "House 2 mid must equal 130°");
assert.strictEqual(m[3], 160, "House 3 mid must equal 160°");
assert.strictEqual(m[5], 220, "House 5 mid must equal 220°");
assert.strictEqual(m[6], 250, "House 6 mid must equal 250°");
assert.strictEqual(m[7], 280, "House 7 mid must equal Descendant (280°)");
assert.strictEqual(m[8], 310, "House 8 mid must equal 310°");
assert.strictEqual(m[9], 340, "House 9 mid must equal 340°");

// All 12 midpoints must be unique (no repeated cusps)
const uniqueMidpoints = new Set(Object.values(m));
assert.strictEqual(uniqueMidpoints.size, 12, "All 12 Sripati house midpoints must be strictly distinct");
console.log("   ✓ Classical Sripati trisection geometry verified: no repeated midpoints, strictly distinct.");

// ============================================================================
// 6. NASHTA JATAKA VERIFICATION PROOFS & PROVENANCE
// ============================================================================
console.log("\n6. Testing Nashta Jataka Verification Proofs & Provenance...");

const uncalibrated = reverseCalculateBirthTimeAndDOB({
  palmProfile: { mounts: {} },
  answers: {},
  lat: 13.0827,
  lng: 80.2707,
  tz: 5.5
});
assert.strictEqual(uncalibrated.provenance, "system_assumption");
assert.strictEqual(uncalibrated.verificationProofs.length, 0, "No synthetic proofs when zero answers");

const userCalibrated = reverseCalculateBirthTimeAndDOB({
  palmProfile: { mounts: {} },
  answers: {
    q2_year: "2010",
    q2_month: "4",
    q3_year: "2012",
    q3_month: "4"
  },
  lat: 13.0827,
  lng: 80.2707,
  tz: 5.5
});
assert.strictEqual(userCalibrated.provenance, "user_confirmed");
assert(userCalibrated.verificationProofs.length > 0, "User-confirmed milestones must produce verification proofs");
assert.strictEqual(userCalibrated.verificationProofs[0].source, "user_confirmed");
assert.strictEqual(userCalibrated.verificationProofs[0].userConfirmed, true);
assert.strictEqual(userCalibrated.verificationProofs[0].verified, false);
assert(userCalibrated.methodologyNotice.includes("hypothesis-based and not empirically validated"));
console.log("   ✓ Nashta Jataka provenance and user-confirmed verification proofs verified.");

console.log("\n=======================================================");
console.log(" ALL CALCULATION LAYER AUDIT TESTS PASSED 100%!");
console.log("=======================================================\n");
