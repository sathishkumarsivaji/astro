/**
 * ASTROVERSE — Convention Fixture Validation Test
 * 
 * Validates ayanamsha calculations against authoritative convention fixtures
 * for multiple epochs and systems. This is the "Level 2" external reference
 * validation recommended by the audit.
 * 
 * Convention fixtures:
 * - Raman: 397 AD zero-year, 50⅓"/year linear precession
 * - Lahiri: NC Lahiri / Chitrapaksha (Indian Astronomical Ephemeris)
 * - KP: Krishnamurti Padhdhati (50.2388475"/year from J2000 anchor 23°45'56")
 * - Tropical: Always 0.0°
 */

import {
  getLahiriAyanamsha,
  getKPAyanamsha,
  getRamanAyanamsha,
  getAyanamshaForSystem
} from "./src/astrology/astronomy/ayanamsha.js";
import { calculateJulianDate } from "./src/astrology/astronomy/time.js";

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

function assertClose(actual, expected, tolerance, modelId, epochLabel) {
  const diffDeg = Math.abs(actual - expected);
  const diffArcsec = diffDeg * 3600;
  const tolArcsec = tolerance * 3600;
  console.log(`  Model: ${modelId} | Actual: ${actual.toFixed(8)}° | Expected: ${expected.toFixed(8)}° | Diff: ${diffArcsec.toFixed(4)}" | Tol: ${tolArcsec.toFixed(1)}"`);
  assert(diffDeg <= tolerance, `${modelId} at ${epochLabel}: diff ${diffArcsec.toFixed(4)}" is within tolerance ${tolArcsec.toFixed(1)}"`);
}

function getJDForYear(year, month = 1, day = 1, hour = 0) {
  const d = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  return calculateJulianDate(d);
}

// ============================================================
// SECTION 1: Raman Ayanamsha Convention Fixtures
// ============================================================
console.log("\n1. Raman Ayanamsha Convention Fixtures");
console.log("   Convention: Zero year 397 AD, precession 50⅓\"/year (50.33333...)");
console.log("   Formula: (Year - 397) × (50.33333... / 3600)");
console.log("   " + "=".repeat(60));

// Manual calculation reference values:
// At 1900: (1900 - 397) × 50.333333/3600 = 1503 × 0.013981481 = 21.0102°
// At 1950: (1950 - 397) × 50.333333/3600 = 1553 × 0.013981481 = 21.7093°
// At 2000: (2000 - 397) × 50.333333/3600 = 1603 × 0.013981481 = 22.4084° (at Jan 1 00:00)
// At J2000 (2000 Jan 1 12:00): ≈ 22.4084 + tiny fraction = 22.4085°
// At 2024: (2024 - 397) × 50.333333/3600 = 1627 × 0.013981481 = 22.7439°
// At 2050: (2050 - 397) × 50.333333/3600 = 1653 × 0.013981481 = 23.1074°

const RAMAN_FIXTURES = [
  { year: 1900, month: 1, day: 1, hour: 0,  expected: 21.01418581, label: "1900-01-01 00:00 UTC" },
  { year: 1950, month: 1, day: 1, hour: 0,  expected: 21.71324074, label: "1950-01-01 00:00 UTC" },
  { year: 2000, month: 1, day: 1, hour: 12, expected: 22.41231481, label: "J2000.0 (2000-01-01 12:00 UTC)" },
  { year: 2024, month: 4, day: 14, hour: 0, expected: 22.75183227, label: "2024-04-14 Mesha Sankranti" },
  { year: 2050, month: 1, day: 1, hour: 0,  expected: 23.11138889, label: "2050-01-01 00:00 UTC" },
];

for (const fix of RAMAN_FIXTURES) {
  const jd = getJDForYear(fix.year, fix.month, fix.day, fix.hour);
  const actual = getRamanAyanamsha(jd);
  assertClose(actual, fix.expected, 0.0001, 'Raman', fix.label);
}

// Raman should always be less than Lahiri
for (const fix of RAMAN_FIXTURES) {
  const jd = getJDForYear(fix.year, fix.month, fix.day, fix.hour);
  const raman = getRamanAyanamsha(jd);
  const lahiri = getLahiriAyanamsha(jd);
  assert(lahiri > raman, `Lahiri (${lahiri.toFixed(4)}°) > Raman (${raman.toFixed(4)}°) at ${fix.label}`);
}

// Raman - Lahiri gap should be approximately 1.4-1.5° across all epochs
for (const fix of RAMAN_FIXTURES) {
  const jd = getJDForYear(fix.year, fix.month, fix.day, fix.hour);
  const raman = getRamanAyanamsha(jd);
  const lahiri = getLahiriAyanamsha(jd);
  const gap = lahiri - raman;
  assert(gap > 1.0 && gap < 2.0, `Lahiri-Raman gap at ${fix.label}: ${gap.toFixed(4)}° (should be ~1.4-1.5°)`);
}

// ============================================================
// SECTION 2: Lahiri Ayanamsha Convention Fixtures
// ============================================================
console.log("\n2. Lahiri Ayanamsha Convention Fixtures");
console.log("   Convention: NC Lahiri / Indian Astronomical Ephemeris / Chitrapaksha");
console.log("   " + "=".repeat(60));

const LAHIRI_FIXTURES = [
  { year: 1900, month: 1, day: 1, hour: 0,  expected: 22.46044887, label: "1900-01-01" },
  { year: 1950, month: 1, day: 1, hour: 0,  expected: 23.15868378, label: "1950-01-01" },
  { year: 2000, month: 1, day: 1, hour: 12, expected: 23.85709222, label: "J2000.0" },
  { year: 2024, month: 4, day: 14, hour: 0, expected: 24.19634210, label: "2024-04-14 Mesha Sankranti" },
  { year: 2050, month: 1, day: 1, hour: 0,  expected: 24.55565505, label: "2050-01-01" },
];

for (const fix of LAHIRI_FIXTURES) {
  const jd = getJDForYear(fix.year, fix.month, fix.day, fix.hour);
  const actual = getLahiriAyanamsha(jd);
  assertClose(actual, fix.expected, 0.005, 'Lahiri', fix.label);
}

// ============================================================
// SECTION 3: KP Ayanamsha Convention Fixtures
// ============================================================
console.log("\n3. KP Ayanamsha Convention Fixtures");
console.log("   Convention: KP Original, J2000 anchor 23°45'56\" = 23.76556°");
console.log("   " + "=".repeat(60));

const KP_FIXTURES = [
  { year: 2000, month: 1, day: 1, hour: 12, expected: 23.76555556, label: "J2000.0" },
];

for (const fix of KP_FIXTURES) {
  const jd = getJDForYear(fix.year, fix.month, fix.day, fix.hour);
  const actual = getKPAyanamsha(jd);
  assertClose(actual, fix.expected, 0.005, 'KP', fix.label);
}

// ============================================================
// SECTION 4: Ordering Invariant (Lahiri > KP > Raman)
// ============================================================
console.log("\n4. Ordering Invariant: Lahiri > KP > Raman across all epochs");
console.log("   " + "=".repeat(60));

const epochs = [1900, 1950, 1980, 2000, 2024, 2050];
for (const yr of epochs) {
  const jd = getJDForYear(yr);
  const lahiri = getLahiriAyanamsha(jd);
  const kp = getKPAyanamsha(jd);
  const raman = getRamanAyanamsha(jd);
  const tropical = getAyanamshaForSystem(jd, "tropical");
  
  assert(lahiri > kp, `Lahiri (${lahiri.toFixed(4)}°) > KP (${kp.toFixed(4)}°) at ${yr}`);
  assert(kp > raman, `KP (${kp.toFixed(4)}°) > Raman (${raman.toFixed(4)}°) at ${yr}`);
  assert(tropical === 0.0, `Tropical = 0.0° at ${yr}`);
}

// ============================================================
// SECTION 5: Monotonicity (all ayanamshas increase over time)
// ============================================================
console.log("\n5. Monotonicity: All ayanamshas increase from 1900 to 2050");
console.log("   " + "=".repeat(60));

let prevLahiri = 0, prevKP = 0, prevRaman = 0;
for (const yr of [1900, 1920, 1940, 1960, 1980, 2000, 2020, 2040, 2050]) {
  const jd = getJDForYear(yr);
  const lahiri = getLahiriAyanamsha(jd);
  const kp = getKPAyanamsha(jd);
  const raman = getRamanAyanamsha(jd);
  
  if (prevLahiri > 0) {
    assert(lahiri > prevLahiri, `Lahiri monotonically increases: ${yr} (${lahiri.toFixed(4)}°) > previous (${prevLahiri.toFixed(4)}°)`);
    assert(kp > prevKP, `KP monotonically increases: ${yr} (${kp.toFixed(4)}°) > previous (${prevKP.toFixed(4)}°)`);
    assert(raman > prevRaman, `Raman monotonically increases: ${yr} (${raman.toFixed(4)}°) > previous (${prevRaman.toFixed(4)}°)`);
  }
  prevLahiri = lahiri;
  prevKP = kp;
  prevRaman = raman;
}

// ============================================================
// SECTION 6: System Resolver throws on unknown
// ============================================================
console.log("\n6. System Resolver: Throws on unknown system");
console.log("   " + "=".repeat(60));

const jd2000 = getJDForYear(2000, 1, 1, 12);
try {
  getAyanamshaForSystem(jd2000, "unknown_system");
  assert(false, "Should have thrown for unknown system");
} catch (e) {
  assert(e.message.includes("Unknown astrological system"), `Throws correct error for unknown system: "${e.message}"`);
}

// Numeric passthrough
assertClose(getAyanamshaForSystem(jd2000, 23.5), 23.5, 0.0001, "Numeric", "passthrough");

// ============================================================
// SECTION 7: Raman J2000 README Convention Check
// ============================================================
console.log("\n7. Raman J2000 Convention: Value matches documented convention");
console.log("   " + "=".repeat(60));

const ramanJ2000 = getRamanAyanamsha(2451545.0);
// Classical linear 50⅓"/year from 397 AD yields 22°24'44.333" = 22.41231481° at J2000.0
assertClose(ramanJ2000, 22.41231481, 0.0001, "Raman", "J2000 README Check");

// Verify it does NOT produce the old incorrect value of 22.37°
assert(Math.abs(ramanJ2000 - 22.37) > 0.03, `Raman J2000 (${ramanJ2000.toFixed(4)}°) is NOT the old incorrect value (~22.37°)`);

// ============================================================
// SUMMARY
// ============================================================
console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log(`ALL CONVENTION FIXTURE TESTS PASSED! (${passed} checks passed, 0 failed)`);
} else {
  console.log(`CONVENTION FIXTURE TESTS: ${passed} passed, ${failed} FAILED`);
  process.exit(1);
}
console.log("=".repeat(60));
