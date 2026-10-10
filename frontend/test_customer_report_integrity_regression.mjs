/**
 * ASTROVERSE — Customer Report & Current Period Integrity Regression Suite
 * =========================================================================
 * Verifies non-fabrication invariants across:
 * 1. Current Period Engine (no age 30 fallback, no Jan 1 birth assumption, no invented dasha dates)
 * 2. Customer Report Metadata (dynamic extraction of ayanamsha, houseSystem, nodes)
 * 3. Data Quality & Completeness (genuine counts, no houses || 12 fallback, missing input tracking)
 * 4. Core Natal Profile & House Analysis (no 0° Aries fallback, no 12 fabricated houses)
 * 5. Personalized Executive Summary Themes (derived from yogas/domains, NOT_EMPIRICALLY_VALIDATED)
 * 6. Multi-Factor Birth-Time Reliability (boundary margins across D1, D9, D60, Moon pada)
 */

import assert from "node:assert";
import {
  generateLifeIntelligenceReport,
  derivePersonalizedExecutiveThemes,
  evaluateBirthTimeReliability
} from "./src/services/customerReport/index.js";
import { calculateCurrentLifePhase } from "./src/services/customerReport/currentPeriodEngine.js";

console.log("\n================================================================================");
console.log(" ASTROVERSE — CUSTOMER REPORT & CURRENT PERIOD INTEGRITY REGRESSION SUITE");
console.log("================================================================================\n");

let passedCount = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${desc}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${desc}: ${err.message}`);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Current Period Engine Non-Fabrication Invariants
// ─────────────────────────────────────────────────────────────────────────────
console.log("1. Current Period Engine Invariants...");

check("1A. Missing birth date does not default currentAgeYears to 30", () => {
  const chartNoDate = {
    planets: [],
    dashaTimeline: { currentMahadasha: "Jupiter", currentAntardasha: "Saturn" }
  };
  const phase = calculateCurrentLifePhase(chartNoDate, new Date(2026, 9, 10));
  assert.strictEqual(phase.currentAgeYears, null, "currentAgeYears must be null when birth date is unknown");
  assert.strictEqual(phase.status, "INSUFFICIENT_DATA", "status must be INSUFFICIENT_DATA");
});

check("1B. Birth year without date does not assume Jan 1 or fabricate precise age", () => {
  const chartOnlyYear = {
    planets: [],
    canonicalFacts: { birthYear: 1990 }
  };
  const currentDate = new Date(2026, 9, 10);
  const phase = calculateCurrentLifePhase(chartOnlyYear, currentDate);
  assert.strictEqual(phase.currentAgeYears, null, "Precise currentAgeYears must be null");
  assert.strictEqual(phase.ageEstimateYears, 36, "Approximate ageEstimateYears must equal 2026 - 1990 = 36");
  assert.strictEqual(phase.isApproximateAge, true, "isApproximateAge must be true");
  assert.strictEqual(phase.birthDateKnown, false, "birthDateKnown must be false");
});

check("1C. Missing dasha does not invent start/end dates (no getFullYear() - 1 or + 2)", () => {
  const chartNoDasha = {
    birthDateStr: "1990-05-15",
    planets: []
  };
  const phase = calculateCurrentLifePhase(chartNoDasha, new Date(2026, 9, 10));
  assert.strictEqual(phase.startDate, null, "Dasha startDate must be null when timeline is absent");
  assert.strictEqual(phase.endDate, null, "Dasha endDate must be null when timeline is absent");
  assert.strictEqual(phase.mahadasha, null, "Mahadasha must be null");
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Authoritative Calculation Metadata Dynamic Extraction
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n2. Calculation Metadata Dynamic Invariants...");

check("2A. Custom ayanamsha and system are preserved in metadata", () => {
  const customChart = {
    ayanamsha: "Raman",
    system: "vedic",
    houseSystem: "Sripati",
    nodeType: "True Node",
    timezoneId: "Asia/Kolkata",
    planets: [
      { name: "Sun", longitude: 180.5, degreeInSign: 0.5, sign: "Libra" },
      { name: "Moon", longitude: 45.2, degreeInSign: 15.2, sign: "Taurus" }
    ],
    houses: []
  };
  const report = generateLifeIntelligenceReport(customChart, { bypassCache: true });
  assert.strictEqual(report.calculationMetadata.ayanamsha, "Raman", "Ayanamsha must be Raman");
  assert.strictEqual(report.calculationMetadata.houseSystem, "Sripati", "House system must be Sripati");
  assert.strictEqual(report.calculationMetadata.lunarNodeConvention, "True Node", "Node convention must be True Node");
});

check("2B. Western chart sets Tropical metadata conventions", () => {
  const westernChart = {
    system: "western",
    timezoneId: "Europe/London",
    planets: [
      { name: "Sun", longitude: 100.0, degreeInSign: 10.0, sign: "Cancer" }
    ],
    houses: []
  };
  const report = generateLifeIntelligenceReport(westernChart, { bypassCache: true });
  assert.strictEqual(report.calculationMetadata.ayanamsha, "None (Tropical)", "Ayanamsha must be None (Tropical)");
  assert.strictEqual(report.calculationMetadata.zodiacConvention, "Tropical", "Zodiac must be Tropical");
  assert.strictEqual(report.calculationMetadata.houseSystem, "Placidus", "House system must default to Placidus for western");
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Data Quality & Completeness Invariants
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n3. Data Quality & Completeness Invariants...");

check("3A. Missing houses does NOT default housesCount to 12", () => {
  const chartNoHouses = {
    timezoneId: "Asia/Kolkata",
    planets: [
      { name: "Sun", longitude: 100.0, degreeInSign: 10.0, sign: "Cancer" }
    ]
    // houses undefined
  };
  const report = generateLifeIntelligenceReport(chartNoHouses, { bypassCache: true });
  assert.strictEqual(report.dataQuality.completenessScore < 0.7, true, "Completeness must be low when houses & Grahas missing");
  assert.strictEqual(report.dataQuality.completenessLabel, "PARTIAL", "Completeness label must be PARTIAL");
  assert(report.dataQuality.missingInputs.some(m => m.includes("12")), "Missing inputs must report missing 12 houses");
  assert(report.dataQuality.affectedSections.includes("House Analysis"), "Affected sections must include House Analysis");
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Core Natal Profile & House Analysis Invariants
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n4. Core Natal Profile & House Analysis Invariants...");

check("4A. Missing ascendant longitude does not default to 0° or Aries", () => {
  const sparseChart = {
    timezoneId: "UTC",
    planets: [
      { name: "Sun", longitude: 50.0 }
    ]
  };
  const report = generateLifeIntelligenceReport(sparseChart, { bypassCache: true });
  assert.strictEqual(report.coreNatalProfile.ascendant.longitude, null, "Ascendant longitude must be null");
  assert.strictEqual(report.coreNatalProfile.ascendant.degree, null, "Ascendant degree must be null");
  assert.notStrictEqual(report.coreNatalProfile.ascendant.sign, "Aries", "Must not silently invent Aries");
});

check("4B. Missing moon longitude does not default to 0° or Aries", () => {
  const sparseChart = {
    timezoneId: "UTC",
    planets: [
      { name: "Sun", longitude: 50.0 }
    ]
  };
  const report = generateLifeIntelligenceReport(sparseChart, { bypassCache: true });
  assert.strictEqual(report.coreNatalProfile.moonSign.longitude, null, "Moon longitude must be null");
  assert.strictEqual(report.coreNatalProfile.moonSign.degree, null, "Moon degree must be null");
  assert.notStrictEqual(report.coreNatalProfile.moonSign.sign, "Aries", "Must not silently invent Aries");
});

check("4C. Empty houses array produces empty houseAnalysis, NOT 12 fabricated houses", () => {
  const sparseChart = {
    timezoneId: "UTC",
    planets: [
      { name: "Sun", longitude: 50.0 }
    ],
    houses: []
  };
  const report = generateLifeIntelligenceReport(sparseChart, { bypassCache: true });
  assert.strictEqual(report.houseAnalysis.length, 0, "houseAnalysis must be empty array when houses are missing");
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Personalized Executive Summary Themes
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n5. Personalized Executive Summary Themes Invariants...");

check("5A. Themes are derived from detected yogas with full provenance", () => {
  const yogaChart = {
    timezoneId: "UTC",
    detectedYogas: [
      {
        name: "Gajakesari Yoga",
        formation: "Jupiter in 4th kendra from Moon",
        manifestation: "Fully Active",
        strength: "Strong"
      },
      {
        name: "Dhana Yoga",
        formation: "2nd lord aspecting 11th house",
        manifestation: "Active",
        strength: "Supported"
      }
    ],
    planets: [{ name: "Sun", longitude: 10 }]
  };
  const themes = derivePersonalizedExecutiveThemes(yogaChart, [], {}, "en");
  assert(themes.length >= 2, "Must derive at least 2 yoga themes");
  assert(themes[0].title.includes("Gajakesari"), "Theme 1 must reference Gajakesari");
  assert(themes[1].title.includes("Dhana"), "Theme 2 must reference Dhana");
  assert.strictEqual(themes[0].empiricalStatus, "NOT_EMPIRICALLY_VALIDATED", "Empirical status must be NOT_EMPIRICALLY_VALIDATED");
  assert.strictEqual(themes[1].empiricalStatus, "NOT_EMPIRICALLY_VALIDATED", "Empirical status must be NOT_EMPIRICALLY_VALIDATED");
  assert(themes[0].ruleId.startsWith("RULE_YOGA_"), "Rule ID must be structured");
  assert(themes[0].evidenceId.startsWith("EV_YOGA_"), "Evidence ID must be structured");
});

check("5B. Tamil localization of personalized themes", () => {
  const yogaChart = {
    detectedYogas: [
      {
        name: "Gajakesari Yoga",
        formation: "Jupiter in kendra from Moon"
      }
    ],
    planets: []
  };
  const themesTa = derivePersonalizedExecutiveThemes(yogaChart, [], {}, "ta");
  assert(themesTa[0].title.includes("கஜகேசரி"), "Tamil theme must contain Tamil title");
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Multi-Factor Birth-Time Reliability Assessment
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n6. Multi-Factor Birth-Time Reliability Invariants...");

check("6A. Boundary proximity (<0.5°) triggers critical boundary alert and deductions", () => {
  const boundaryChart = {
    ascendantLong: 29.85, // 0.15° from sign boundary
    latitude: 13.08,
    longitude: 80.27
  };
  const evalResult = evaluateBirthTimeReliability(boundaryChart, {}, "en");
  assert.strictEqual(evalResult.boundaryProximityAlert, true, "Boundary proximity alert must be true");
  assert(["MODERATE", "LOW"].includes(evalResult.rating), "Rating must be downgraded for boundary proximity");
  assert(evalResult.factors.some(f => f.factor === "ASCENDANT_SIGN_BOUNDARY" && f.severity === "CRITICAL"), "Must record critical boundary factor");
});

check("6B. Centered ascendant (15.25°) with exact coordinates receives HIGH rating", () => {
  const stableChart = {
    ascendantLong: 15.25, // Centered in sign and D60
    moonLong: 75.25,     // Centered in Nakshatra and Pada
    latitude: 13.0827,
    longitude: 80.2707
  };
  const evalResult = evaluateBirthTimeReliability(stableChart, {}, "en");
  assert.strictEqual(evalResult.rating, "HIGH", "Rating must be HIGH for centered ascendant");
  assert.strictEqual(evalResult.boundaryProximityAlert, false, "Proximity alert must be false");
  assert(evalResult.score >= 80, `Score must be >= 80, got ${evalResult.score}`);
});

check("6C. Missing ascendant longitude returns INSUFFICIENT_DATA", () => {
  const noAscChart = {
    latitude: 13.08,
    longitude: 80.27
  };
  const evalResult = evaluateBirthTimeReliability(noAscChart, {}, "en");
  assert.strictEqual(evalResult.rating, "INSUFFICIENT_DATA", "Rating must be INSUFFICIENT_DATA");
  assert.strictEqual(evalResult.score, 0, "Score must be 0");
});

console.log("\n================================================================================");
console.log(` ALL ${passedCount} CUSTOMER REPORT & CURRENT PERIOD INTEGRITY TESTS PASSED!`);
console.log("================================================================================\n");
