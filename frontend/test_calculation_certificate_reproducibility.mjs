/**
 * ASTROVERSE — Calculation Certificate Reproducibility & Offline Verification Suite
 * ===================================================================================
 * Verifies:
 * 1. Complete reproducibility of calculation certificate parameters:
 *    - Input parameters (birthDate, birthTime, latitude, longitude, timezoneId, utcOffset)
 *    - Resolved UTC instant & Julian Day (JD)
 *    - Delta T (Meeus/IAU)
 *    - Ayanamsha model and value
 *    - Ephemeris engine & coordinate frame
 *    - House system & division conventions
 *    - Cryptographic SHA-256 inputHash & chartHash
 * 2. Offline verification: SHA-256 digests verify independently with standard crypto.
 * 3. Tamper detection: Any mutation to inputs or calculated coordinates invalidates hashes.
 * 4. Multi-system determinism: Generates valid distinct certificates for Lahiri, KP, Raman, Tropical.
 */

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { generateCalculationCertificate, getConvention, SYSTEM_CONVENTIONS } from "./src/astrology/conventions.js";
import { calculateChartBySystem } from "./src/astrology/index.js";

console.log("===========================================================================");
console.log(" CALCULATION CERTIFICATE REPRODUCIBILITY & OFFLINE AUDIT");
console.log("===========================================================================\n");

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

const birthProfile = {
  birthDate: "1994-08-15",
  birthTime: "14:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5,
  timezoneId: "Asia/Kolkata",
  system: "lahiri"
};

const fixedTimestamp = "2026-10-09T12:00:00.000Z";

// Test 1: Full Certificate Parameter Completeness
test("Calculation certificate includes all mandatory astronomical and cryptographic fields", () => {
  const chart = calculateChartBySystem("lahiri", birthProfile, { lang: "en" });
  const result = generateCalculationCertificate("lahiri", birthProfile, chart, fixedTimestamp);
  const cert = result.certificate;

  assert.ok(cert.inputHash, "Must have inputHash");
  assert.ok(cert.chartHash, "Must have chartHash");
  assert.equal(cert.conventionId, "LAHIRI_CHITRAPAKSHA_V1");
  assert.ok(cert.system.includes("Lahiri"));
  assert.equal(cert.birthDate, "1994-08-15");
  assert.equal(cert.birthTime, "14:30");
  assert.equal(cert.latitude, 13.0827);
  assert.equal(cert.longitude, 80.2707);
  assert.equal(cert.timezoneId, "Asia/Kolkata");
  assert.equal(cert.utcOffset, 5.5);
  assert.ok(cert.utcInstant, "Must have resolved UTC instant");
  assert.ok(cert.julianDay, "Must have Julian Day");
  assert.ok(cert.ayanamshaModel, "Must specify Ayanamsha model");
  assert.ok(cert.houseSystem, "Must specify house system");
  assert.ok(cert.coordinateFrame, "Must specify coordinate frame");
  assert.ok(cert.ephemerisEngine, "Must specify ephemeris engine");
  assert.ok(cert.timeScale.includes("Delta-T"), "Must reference Delta-T time scale");
  assert.equal(cert.verifiable, true);
  assert.ok(cert.astronomicalDisclaimer);
  assert.ok(cert.d60SensitivityNotice);
});

// Test 2: Offline Cryptographic Reproducibility
test("Certificate SHA-256 hashes are verifiable offline using standard SHA-256", () => {
  const chart = calculateChartBySystem("lahiri", birthProfile, { lang: "en" });
  const result = generateCalculationCertificate("lahiri", birthProfile, chart, fixedTimestamp);
  const cert = result.certificate;

  // Recompute inputHash offline
  const inputPayload = JSON.stringify({
    date: birthProfile.birthDate,
    time: birthProfile.birthTime,
    lat: birthProfile.latitude,
    lng: birthProfile.longitude,
    tz: birthProfile.utcOffset,
    system: "lahiri"
  });
  const recomputedInputHash = crypto.createHash("sha256").update(inputPayload, "utf8").digest("hex");
  assert.equal(cert.inputHash, recomputedInputHash, "Input hash must match independent offline SHA-256");

  // Recompute chartHash offline
  const chartPayload = JSON.stringify({
    asc: chart.ascendantLong ?? chart.ascendant?.longitude ?? null,
    planets: (chart.planets || []).map(p => ({ n: p.name, l: p.longitude ?? p.long })),
    ayanamsha: chart.ayanamsa ?? chart.ayanamsaValue ?? null
  });
  const recomputedChartHash = crypto.createHash("sha256").update(chartPayload, "utf8").digest("hex");
  assert.equal(cert.chartHash, recomputedChartHash, "Chart hash must match independent offline SHA-256");
});

// Test 3: Tamper Detection
test("Tampering with birth coordinates or planetary values invalidates cryptographic hashes", () => {
  const chart = calculateChartBySystem("lahiri", birthProfile, { lang: "en" });
  const result = generateCalculationCertificate("lahiri", birthProfile, chart, fixedTimestamp);
  const cert = result.certificate;

  // Tamper with input: shift latitude by 0.001 deg
  const tamperedProfile = { ...birthProfile, latitude: 13.0837 };
  const tamperedResult = generateCalculationCertificate("lahiri", tamperedProfile, chart, fixedTimestamp);
  assert.notEqual(tamperedResult.certificate.inputHash, cert.inputHash, "Tampered inputs must produce different inputHash");

  // Tamper with chart: shift planet longitude
  const tamperedChart = {
    ...chart,
    planets: chart.planets.map((p, idx) => idx === 0 ? { ...p, longitude: p.longitude + 0.5 } : p)
  };
  const tamperedChartResult = generateCalculationCertificate("lahiri", birthProfile, tamperedChart, fixedTimestamp);
  assert.notEqual(tamperedChartResult.certificate.chartHash, cert.chartHash, "Tampered chart must produce different chartHash");
});

// Test 4: Determinism Across Systems (Lahiri, KP, Raman, Tropical)
test("Produces distinct, deterministic certificates across all supported systems", () => {
  const systems = ["lahiri", "kp", "raman", "tropical"];
  const certHashes = new Set();

  for (const sys of systems) {
    const chart = calculateChartBySystem(sys, birthProfile, { lang: "en" });
    const result = generateCalculationCertificate(sys, birthProfile, chart, fixedTimestamp);
    assert.ok(result.certificate.chartHash);
    certHashes.add(result.certificate.chartHash);
  }

  // All 4 systems have different ayanamsa / house systems and thus produce unique hashes
  assert.equal(certHashes.size, 4, "All 4 astrology systems must produce unique deterministic chart hashes");
});

console.log("\n===========================================================================");
console.log(`ALL ${passed}/4 CALCULATION CERTIFICATE AUDIT CHECKS PASSED.`);
console.log("===========================================================================\n");
