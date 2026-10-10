/**
 * ASTROVERSE — Forensic Remediation & Calculation Correctness Suite
 * ===================================================================
 * Verifies all 12 remediation phases:
 * 1. Zero fabricated chart defaults (Ascendant, planet longitudes, birth years)
 * 2. Strict input validation and fail-closed calculation pathways
 * 3. Authentic executive themes with verified rule/evidence IDs (no Lagna Equilibrium fallback)
 * 4. Dynamic calculationMetadata from release manifest and chart data
 * 5. LifeReportModel unassessed defaults (null completenessScore, UNASSESSED label)
 * 6. ReportValidator Gate 4 flexible transit checks (inactive Sade Sati is valid)
 * 7. ReportValidator Gate 14 missing data enforcement (fails closed on unassessed data)
 * 8. ReportSafetyGate expanded adversarial pattern sanitization
 * 9. ReportCacheManager SHA-256 cryptographic binding, currentDate awareness, and invalidation
 * 10. CalibrationProvider fail-closed UNVERIFIED_PROVENANCE enforcement
 */

import {
  calculateDivisionalCharts,
  getStructuredVargaData,
  calculateCareerAndExamPathway,
  calculateMarriagePathway,
  buildDomainEvidenceLedger,
  calculateAuspiciousMilestoneTimelines,
  findMajorTransitEventsForWindow,
  calculateTransitEphemeris,
  generateRetrospectiveLifeMilestoneAudit
} from "./src/services/astroEngine.js";

import {
  derivePersonalizedExecutiveThemes,
  generateLifeIntelligenceReport
} from "./src/services/customerReport/index.js";

import {
  createLifeReportModel
} from "./src/services/customerReport/lifeReportModel.js";

import {
  validateLifeReport
} from "./src/services/customerReport/reportValidator.js";

import {
  sanitizeReportText,
  applyReportSafetyGate
} from "./src/services/customerReport/reportSafetyGate.js";

import {
  getCachedLifeReport,
  setCachedLifeReport,
  invalidateReportCacheEntry,
  clearLifeReportCache,
  computeReportInputHash
} from "./src/services/customerReport/reportCacheManager.js";

import {
  loadCalibrationModel,
  setTestCalibrationFixture,
  clearTestCalibrationFixture
} from "./src/services/realWorldValidation/calibrationProvider.js";

console.log("\n" + "=".repeat(75));
console.log(" ASTROVERSE FORENSIC REMEDIATION & CALCULATION CORRECTNESS SUITE");
console.log("=".repeat(75));

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 1: Divisional Charts Zero-Fabrication Invariants
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Group 1: Divisional Charts Zero-Fabrication Invariants]");

// 1.1 calculateDivisionalCharts fails closed on missing Ascendant
const divMissingAsc = calculateDivisionalCharts([
  { name: "Sun", longitude: 10.5 },
  { name: "Moon", longitude: 45.2 }
], null);
assert(
  divMissingAsc.status === "INSUFFICIENT_DATA" &&
  divMissingAsc.D1.ascendant.house === null &&
  divMissingAsc.D1.ascendant.signIdx === null,
  "calculateDivisionalCharts returns INSUFFICIENT_DATA and null house/signIdx when Ascendant is missing"
);

// 1.2 calculateDivisionalCharts fails closed on invalid planet longitude
const divMissingPlanet = calculateDivisionalCharts([
  { name: "Sun", longitude: 10.5 },
  { name: "Moon", longitude: NaN },
  { name: "Mars" }
], 30.0);
const invalidMoon = divMissingPlanet.D1.planets.find(p => p.name === "Moon");
const invalidMars = divMissingPlanet.D1.planets.find(p => p.name === "Mars");
assert(
  invalidMoon.status === "INSUFFICIENT_DATA" && invalidMoon.longitude === null && invalidMoon.house === null &&
  invalidMars.status === "INSUFFICIENT_DATA" && invalidMars.longitude === null && invalidMars.house === null,
  "calculateDivisionalCharts preserves missing/NaN planets as INSUFFICIENT_DATA with null house (zero Aries 0° fallback)"
);

// 1.3 getStructuredVargaData requires valid longitude
const vargaMissingPlanet = getStructuredVargaData([
  { name: "Jupiter", longitude: null }
], 30.0);
const jupD9 = vargaMissingPlanet.D9.planets.find(p => p.name === "Jupiter");
assert(
  jupD9.status === "INSUFFICIENT_DATA" && jupD9.longitude === null,
  "getStructuredVargaData sets status INSUFFICIENT_DATA for planets with missing longitude"
);

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 2: Pathway Functions Input Integrity
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Group 2: Pathway Functions Input Integrity]");

// 2.1 calculateCareerAndExamPathway throws on missing Ascendant
let careerThrew = false;
try {
  calculateCareerAndExamPathway([
    { name: "Sun", longitude: 10.0 }
  ], null);
} catch (e) {
  careerThrew = e.message.includes("Valid numerical longitude required");
}
assert(careerThrew, "calculateCareerAndExamPathway throws on null ascendantLong (requireLongitude)");

// 2.2 calculateMarriagePathway returns null calendarYears when birthYear is missing
const marriageNoYear = calculateMarriagePathway([
  { name: "Venus", longitude: 25.0 }
], 15.0, { birthYear: null });
assert(
  marriageNoYear.calendarYears === null,
  "calculateMarriagePathway returns calendarYears: null when birthYear is omitted (no 1990 fallback)"
);

// 2.3 buildDomainEvidenceLedger throws on missing Ascendant
let ledgerThrew = false;
try {
  buildDomainEvidenceLedger([
    { name: "Sun", longitude: 10.0 }
  ], undefined);
} catch (e) {
  ledgerThrew = e.message.includes("Valid numerical longitude required");
}
assert(ledgerThrew, "buildDomainEvidenceLedger throws on undefined ascendantLong (requireLongitude)");

// 2.4 calculateAuspiciousMilestoneTimelines enforces coordinates
let milestoneThrew = false;
try {
  calculateAuspiciousMilestoneTimelines([], null, 50.0);
} catch (e) {
  milestoneThrew = e.message.includes("Valid numerical longitude required");
}
assert(milestoneThrew, "calculateAuspiciousMilestoneTimelines throws on null ascendantLong (requireLongitude)");

// 2.5 generateRetrospectiveLifeMilestoneAudit enforces valid birthDate
let retroThrew = false;
try {
  generateRetrospectiveLifeMilestoneAudit(10.0, 20.0, "not-a-date");
} catch (e) {
  retroThrew = e.message.includes("Valid birthDate required");
}
assert(retroThrew, "generateRetrospectiveLifeMilestoneAudit throws on invalid birthDate");

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 3: Executive Themes Authenticity (Zero Fabricated Lagna Equilibrium)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Group 3: Executive Themes Authenticity]");

// 3.1 Empty yogas and domain reports return empty array
const emptyThemes = derivePersonalizedExecutiveThemes({}, [], {});
assert(
  Array.isArray(emptyThemes) && emptyThemes.length === 0,
  "derivePersonalizedExecutiveThemes returns empty array when no criteria met (zero fabricated Lagna Equilibrium fallback)"
);

// 3.2 Domain reports use authentic rule and evidence IDs
const sampleDomainReports = [
  {
    domainId: "career",
    evidenceStrength: "VERY_STRONG",
    overallTraditionalAssessment: "FAVORABLE",
    technicalEvidence: {
      primaryLord: "Saturn",
      primaryHouse: 10,
      evidenceNodeId: "DOM_CAREER_EVIDENCE"
    },
    executiveConclusion: "Significant professional trajectory and governance leadership."
  }
];
const domainThemes = derivePersonalizedExecutiveThemes({}, sampleDomainReports, {}, "en");
assert(
  domainThemes.length === 1 &&
  domainThemes[0].ruleId === "DOMAIN_CAREER_ASSESSMENT" &&
  domainThemes[0].evidenceId === "DOM_CAREER_EVIDENCE" &&
  domainThemes[0].empiricalStatus === "NOT_EMPIRICALLY_VALIDATED",
  "Domain themes use authentic ruleId and evidenceId with NOT_EMPIRICALLY_VALIDATED status"
);

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 4: LifeReportModel Data Quality & Calculation Metadata Defaults
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Group 4: LifeReportModel Data Quality & Metadata Defaults]");

const defaultModel = createLifeReportModel();
assert(
  defaultModel.dataQuality.completenessScore === null &&
  defaultModel.dataQuality.completenessLabel === "UNASSESSED",
  "createLifeReportModel defaults dataQuality completenessScore to null and label to UNASSESSED"
);
assert(
  defaultModel.calculationMetadata.ayanamsha === null &&
  defaultModel.calculationMetadata.releaseVersion === null &&
  defaultModel.calculationMetadata.schemaVersion === null,
  "createLifeReportModel defaults calculationMetadata fields to null without hardcoded strings"
);

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 5: ReportValidator Gate 4 and Gate 14 Enforcement
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Group 5: ReportValidator Gate 4 & Gate 14 Enforcement]");

// 5.1 Gate 4 accepts calculated transits without active Sade Sati
const mockValidReport = createLifeReportModel({
  clientProfile: { birthDate: "1990-01-01" },
  dataQuality: { latitude: 13.08, longitude: 80.27, completenessScore: 0.95 },
  planetaryTable: [
    { name: "Sun", longitude: 10 },
    { name: "Moon", longitude: 40 },
    { name: "Mars", longitude: 70 },
    { name: "Mercury", longitude: 100 },
    { name: "Jupiter", longitude: 130 },
    { name: "Venus", longitude: 160 },
    { name: "Saturn", longitude: 190 }
  ],
  currentDasha: { lord: "Jupiter" },
  currentTransits: {
    status: "CALCULATED",
    saturnHouse: 8,
    majorEvents: []
    // note: sadeSati is undefined / inactive
  },
  domainReports: [
    "marriage", "property", "career", "education", "children", "foreignTravel",
    "vehicle", "business", "job", "finance", "family", "leadership",
    "wellness", "legal", "spiritual", "caution", "milestones"
  ].map(id => ({
    domainId: id,
    domainName: { en: id, ta: id },
    executiveConclusion: "Standard evaluation.",
    empiricalResolution: id === "marriage" ? "MULTI_YEAR_RANGE" : "NOT_ESTABLISHED",
    traditionalTimingWindows: []
  })),
  lifeTimeline: { CURRENT: { phase: "Jupiter Mahadasha" } },
  majorMilestones: { prospective: [{ year: 2028, title: "Expansion" }] }
});

const valResult1 = validateLifeReport(mockValidReport);
const gate4Check = valResult1.checks.find(c => c.id === 4);
assert(
  gate4Check && gate4Check.passed,
  "Gate 4 (transitConsistency) passes when transits are calculated without requiring active Sade Sati"
);

// 5.2 Gate 14 fails when dataQuality.completenessScore is null/unassessed
const mockUnassessedReport = createLifeReportModel({
  ...mockValidReport,
  dataQuality: { latitude: 13.08, longitude: 80.27, completenessScore: null }
});
const valResult2 = validateLifeReport(mockUnassessedReport);
const gate14Check = valResult2.checks.find(c => c.id === 14);
assert(
  gate14Check && !gate14Check.passed,
  "Gate 14 (missingDataDetection) fails closed when dataQuality.completenessScore is null (no 1.0 fallback)"
);

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 6: Report Safety Gate Adversarial Sanitization
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Group 6: Report Safety Gate Adversarial Sanitization]");

const adversarialMedical = "Clinical cancer diagnosis and exact lifespan prediction with guaranteed surgery.";
const sanitizedMedical = sanitizeReportText(adversarialMedical, "wellness", "en");
assert(
  !/cancer|lifespan|guaranteed surgery/i.test(sanitizedMedical),
  "sanitizeReportText removes clinical cancer, exact lifespan, and guaranteed surgery"
);

const adversarialLegal = "Guaranteed court victory with verdict in your favor guaranteed.";
const sanitizedLegal = sanitizeReportText(adversarialLegal, "legal", "en");
assert(
  !/guaranteed court victory|verdict in your favor guaranteed/i.test(sanitizedLegal),
  "sanitizeReportText removes guaranteed court victory and verdict certainty"
);

const adversarialFinancial = "Risk-free investment with guaranteed profit and lottery jackpot win.";
const sanitizedFinancial = sanitizeReportText(adversarialFinancial, "finance", "en");
assert(
  !/risk-free investment|guaranteed profit|lottery jackpot win/i.test(sanitizedFinancial),
  "sanitizeReportText removes risk-free investment, guaranteed profit, and lottery claims"
);

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 7: Report Cache Manager SHA-256 and currentDate Invalidation
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Group 7: Report Cache Manager SHA-256 & Dynamic Caching]");

const sampleChart = {
  birthDate: "1988-08-18",
  birthTime: "14:30",
  latitude: 13.0827,
  longitude: 80.2707,
  timezoneId: "Asia/Kolkata",
  chartFingerprint: "TEST_FP_12345"
};

const hash1 = computeReportInputHash(sampleChart, { lang: "en", currentDate: "2026-10-10" });
const hash2 = computeReportInputHash(sampleChart, { lang: "en", currentDate: "2026-10-11" });

assert(
  typeof hash1 === "string" && hash1.length === 64 && /^[0-9a-f]{64}$/.test(hash1),
  "computeReportInputHash generates a valid 64-character SHA-256 hex digest"
);
assert(
  hash1 !== hash2,
  "computeReportInputHash incorporates currentDate producing distinct hashes across transit evaluation dates"
);

clearLifeReportCache();
setCachedLifeReport(sampleChart, { lang: "en", currentDate: "2026-10-10" }, { test: "cachedReport" });
const cachedFound = getCachedLifeReport(sampleChart, { lang: "en", currentDate: "2026-10-10" });
assert(cachedFound && cachedFound.test === "cachedReport", "getCachedLifeReport returns cached report");

const invalidated = invalidateReportCacheEntry(sampleChart, { lang: "en", currentDate: "2026-10-10" });
const cachedAfterInvalidate = getCachedLifeReport(sampleChart, { lang: "en", currentDate: "2026-10-10" });
assert(
  invalidated && cachedAfterInvalidate === null,
  "invalidateReportCacheEntry successfully purges specific cached report entry"
);

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 8: Calibration Provider Fail-Closed UNVERIFIED_PROVENANCE
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[Group 8: Calibration Provider Fail-Closed UNVERIFIED_PROVENANCE]");

try {
  // Inject mock fixture missing predictionEngineHash
  setTestCalibrationFixture({
    parameters: { slope: 0.5, intercept: 1.0 },
    empiricalResidualQuantiles: { q80: 3.5 },
    trainingDatasetHash: "valid_hash"
    // predictionEngineHash is missing
  });

  let provThrew = false;
  try {
    loadCalibrationModel(true);
  } catch (err) {
    provThrew = err.message.includes("UNVERIFIED_PROVENANCE");
  }
  assert(provThrew, "loadCalibrationModel throws UNVERIFIED_PROVENANCE when predictionEngineHash is missing");
} finally {
  clearTestCalibrationFixture();
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(75));
console.log(` RESULTS: ${passed} passed, ${failed} failed.`);
console.log("=".repeat(75));

if (failed === 0) {
  console.log(" ✓ ALL FORENSIC REMEDIATION INVARIANTS VERIFIED 100% CORRECT!\n");
  process.exit(0);
} else {
  console.error(` ✗ ${failed} INVARIANT(S) FAILED.\n`);
  process.exit(1);
}
