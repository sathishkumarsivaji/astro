/**
 * ASTROVERSE — Epistemic Architecture & Anti-Overclaim Mandates Test Suite
 * ========================================================================
 * Verifies all P0 architectural mandates:
 * 1. Calculation Resolution vs Predictive Resolution separation
 * 2. Traditional Rule Convergence vs Calibrated Probability semantics
 * 3. 17-Domain Empirical Validation Registry completeness
 * 4. Structured Epistemic Status on all predictions
 * 5. AI Evidence Gate structural claim verification (VERIFIED vs UNSUPPORTED_CLAIM)
 * 6. Health domain non-clinical capability boundaries & statutory notices
 * 7. Advisory notices for finance, business, and legal domains
 * 8. Zero ungrounded accuracy or exact timing guarantees
 */

import assert from "node:assert/strict";
import {
  DOMAIN,
  ALL_DOMAINS,
  RESOLUTION,
  CONFIDENCE_TYPE
} from "./src/services/expertPrediction/expertPredictionSchema.js";

import {
  DOMAIN_VALIDATION_STATUS,
  DOMAIN_VALIDATION_REGISTRY,
  getDomainValidationInfo,
  getAllDomainValidationEntries,
  getDomainValidationSummary
} from "./src/services/expertPrediction/domainValidationRegistry.js";

import {
  generateExpertReport,
  generateDomainReport
} from "./src/services/expertPrediction/index.js";

import { calculateChartBySystem } from "./src/services/astroEngine.js";
import { verifyAndSanitizeAiNarrative } from "./src/services/aiEvidenceGate.js";

console.log("\n" + "=".repeat(75));
console.log(" P0 ARCHITECTURAL MANDATES & EPISTEMIC INTEGRITY AUDIT");
console.log("=".repeat(75));

let passes = 0;
let fails = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passes++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    fails++;
  }
}

const TEST_CHART_DATA = {
  birthDate: "1990-05-15",
  birthTime: "10:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5,
  system: "lahiri"
};

const chart = calculateChartBySystem("lahiri", TEST_CHART_DATA);

// ─────────────────────────────────────────────────────────────
// 1. 17-DOMAIN EMPIRICAL VALIDATION REGISTRY AUDIT
// ─────────────────────────────────────────────────────────────
console.log("\n[1] 17-Domain Empirical Validation Registry:");

test("Registry covers exactly all 17 domains", () => {
  assert.equal(ALL_DOMAINS.length, 17);
  const entries = getAllDomainValidationEntries();
  assert.equal(entries.length, 17);
  for (const dom of ALL_DOMAINS) {
    const info = getDomainValidationInfo(dom);
    assert.ok(info, `Domain info must exist for ${dom}`);
    assert.equal(info.domain, dom);
  }
});

test("Only Marriage has empirical benchmark available; 16 domains are UNVALIDATED", () => {
  const summary = getDomainValidationSummary();
  assert.equal(summary.totalDomains, 17);
  assert.equal(summary.empiricalCount, 1);
  assert.equal(summary.unvalidatedCount, 16);

  const marriage = getDomainValidationInfo(DOMAIN.MARRIAGE);
  assert.equal(marriage.status, DOMAIN_VALIDATION_STATUS.CALIBRATED_EMPIRICAL_BENCHMARK_AVAILABLE);
  assert.equal(marriage.empiricalOutcomeValidationAvailable, true);
  assert.ok(marriage.benchmarkCohortSize > 15000);

  const nonMarriage = ALL_DOMAINS.filter(d => d !== DOMAIN.MARRIAGE);
  for (const dom of nonMarriage) {
    const info = getDomainValidationInfo(dom);
    assert.equal(
      info.status,
      DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
      `Domain ${dom} must be TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED`
    );
    assert.equal(
      info.empiricalOutcomeValidationAvailable,
      false,
      `Domain ${dom} must have empiricalOutcomeValidationAvailable: false`
    );
    assert.equal(
      info.empiricalPredictiveResolution,
      "NOT_ESTABLISHED",
      `Domain ${dom} empirical resolution must be NOT_ESTABLISHED`
    );
  }
});

// ─────────────────────────────────────────────────────────────
// 2. DUAL / TRIPLE RESOLUTION SEPARATION IN OUTPUTS
// ─────────────────────────────────────────────────────────────
console.log("\n[2] Calculation vs Interpretive vs Empirical Resolution Separation:");

const expertReport = generateExpertReport(chart, "en");

test("Domain results strictly separate astronomical, traditional, and empirical resolutions", () => {
  for (const dom of ALL_DOMAINS) {
    const res = expertReport.domainResults[dom];
    assert.ok(res, `Result for domain ${dom} must exist`);
    assert.ok(res.astronomicalResolution, `astronomicalResolution must exist for ${dom}`);
    assert.ok(res.traditionalTimingResolution, `traditionalTimingResolution must exist for ${dom}`);
    assert.ok(res.empiricalPredictiveResolution, `empiricalPredictiveResolution must exist for ${dom}`);

    // Astronomical resolution is calculation-level (DAY)
    assert.equal(res.astronomicalResolution, RESOLUTION.DAY);

    // Empirical resolution for marriage is YEAR; for others is NOT_ESTABLISHED
    if (dom === DOMAIN.MARRIAGE) {
      assert.equal(res.empiricalPredictiveResolution, RESOLUTION.YEAR);
    } else {
      assert.equal(res.empiricalPredictiveResolution, "NOT_ESTABLISHED");
    }
  }
});

test("Timing windows carry distinct astronomical and empirical resolutions", () => {
  const marriageResult = expertReport.domainResults[DOMAIN.MARRIAGE];
  assert.ok(marriageResult.primaryWindows.length > 0);
  const win = marriageResult.primaryWindows[0];

  assert.equal(win.astronomicalResolution, RESOLUTION.DAY);
  assert.ok([RESOLUTION.YEAR, RESOLUTION.SEASON, RESOLUTION.MONTH_RANGE, RESOLUTION.DATE_RANGE, RESOLUTION.DAY].includes(win.traditionalTimingResolution));
  assert.equal(win.empiricalPredictiveResolution, RESOLUTION.YEAR);
});

// ─────────────────────────────────────────────────────────────
// 3. RULE CONVERGENCE VS CALIBRATED PROBABILITY SEMANTICS
// ─────────────────────────────────────────────────────────────
console.log("\n[3] Rule Convergence vs Predictive Probability Semantics:");

test("Raw saturation score is exposed as traditionalRuleConvergence / traditionalEvidenceStrength", () => {
  for (const dom of ALL_DOMAINS) {
    const res = expertReport.domainResults[dom];
    assert.ok(typeof res.traditionalRuleConvergence === "number", `traditionalRuleConvergence must be number for ${dom}`);
    assert.ok(typeof res.traditionalEvidenceStrength === "number", `traditionalEvidenceStrength must be number for ${dom}`);
    assert.ok(res.traditionalRuleConvergence >= 0.0 && res.traditionalRuleConvergence <= 1.0);
    assert.ok(res.traditionalEvidenceStrength >= 0.0 && res.traditionalEvidenceStrength <= 1.0);

    // predictiveProbability is strictly null unless independently calibrated
    assert.equal(res.predictiveProbability, null, `predictiveProbability must be null for uncalibrated domain ${dom}`);
  }
});

test("Timing windows carry bounded traditionalRuleConvergence with predictiveProbability: null", () => {
  const careerResult = expertReport.domainResults[DOMAIN.CAREER];
  assert.ok(careerResult.primaryWindows.length > 0);
  const win = careerResult.primaryWindows[0];

  assert.ok(typeof win.traditionalRuleConvergence === "number");
  assert.ok(typeof win.traditionalEvidenceStrength === "number");
  assert.ok(win.traditionalRuleConvergence >= 0.0 && win.traditionalRuleConvergence <= 1.0);
  assert.equal(win.predictiveProbability, null);
});

// ─────────────────────────────────────────────────────────────
// 4. STRUCTURED EPISTEMIC STATUS ON ALL PREDICTIONS
// ─────────────────────────────────────────────────────────────
console.log("\n[4] Structured Epistemic Status Schema Invariants:");

test("Every domain result contains a certified epistemicStatus object", () => {
  for (const dom of ALL_DOMAINS) {
    const res = expertReport.domainResults[dom];
    const ep = res.epistemicStatus;
    assert.ok(ep, `epistemicStatus must exist for ${dom}`);
    assert.equal(ep.astronomicalStatus, "CALCULATED");
    assert.equal(ep.traditionalInterpretationStatus, "RULE_BASED");

    if (dom === DOMAIN.MARRIAGE) {
      assert.equal(ep.empiricalValidationStatus, "CALIBRATED_EMPIRICAL_BENCHMARK_AVAILABLE");
    } else {
      assert.equal(ep.empiricalValidationStatus, "NOT_ESTABLISHED");
    }
    assert.ok(typeof ep.traditionalRuleConvergence === "number");
    assert.equal(ep.predictiveProbability, null);
  }
});

test("Every timing window contains a certified epistemicStatus object", () => {
  const propertyResult = expertReport.domainResults[DOMAIN.PROPERTY];
  assert.ok(propertyResult.primaryWindows.length > 0);
  const win = propertyResult.primaryWindows[0];
  const ep = win.epistemicStatus;

  assert.ok(ep);
  assert.equal(ep.astronomicalStatus, "CALCULATED");
  assert.equal(ep.traditionalInterpretationStatus, "RULE_BASED");
  assert.equal(ep.empiricalValidationStatus, "NOT_ESTABLISHED");
  assert.equal(ep.predictiveProbability, null);
});

// ─────────────────────────────────────────────────────────────
// 5. AI EVIDENCE VERIFICATION GATE AUDIT
// ─────────────────────────────────────────────────────────────
console.log("\n[5] AI Evidence Verification Gate:");

test("Gate verifies valid claims matching calculated chart", () => {
  // Extract real placements from calculated chart
  const sun = chart.planets.find(p => p.name === "Sun");
  const jup = chart.planets.find(p => p.name === "Jupiter");

  const validNarrative = `Native has Sun placed in House ${sun.house} and Jupiter in ${jup.sign}.`;
  const result = verifyAndSanitizeAiNarrative(validNarrative, chart, { strictGrounding: true });

  assert.equal(result.unsupportedClaims.length, 0);
  assert.ok(result.verifiedClaims.length >= 1);
  assert.equal(result.isValid, true);
  assert.equal(result.epistemicAudit.groundingRate, 1.0);
});

test("Gate detects and flags contradictory astrological assertions as UNSUPPORTED_CLAIM", () => {
  const sun = chart.planets.find(p => p.name === "Sun");
  const fakeHouse = sun.house === 10 ? 4 : 10;
  const contradictoryNarrative = `Native has Sun placed in House ${fakeHouse} and Moon in Pisces.`;

  const result = verifyAndSanitizeAiNarrative(contradictoryNarrative, chart, { strictGrounding: true });

  assert.ok(result.unsupportedClaims.length > 0);
  const sunClaim = result.unsupportedClaims.find(c => c.claimText.includes("Sun"));
  assert.ok(sunClaim);
  assert.equal(sunClaim.status, "UNSUPPORTED_CLAIM");
  assert.ok(sunClaim.reason.includes("CONTRADICTS_CALCULATED_CHART"));
  assert.equal(result.isValid, false);
});

test("Gate sanitizes fatalistic overclaims into honest probabilistic language", () => {
  const overclaimingText = "We offer an exact prediction of your marriage. The guaranteed date is 2028 with 100% accuracy and absolute certainty.";
  const result = verifyAndSanitizeAiNarrative(overclaimingText, chart);

  assert.ok(!result.sanitizedNarrative.includes("exact prediction"));
  assert.ok(!result.sanitizedNarrative.includes("guaranteed date"));
  assert.ok(!result.sanitizedNarrative.includes("100% accuracy"));
  assert.ok(!result.sanitizedNarrative.includes("absolute certainty"));
  assert.ok(result.sanitizedNarrative.includes("calculated timing window") || result.sanitizedNarrative.includes("traditional rule convergence"));
  assert.ok(result.sanitizedViolations.length >= 3);
});

test("Gate blocks and sanitizes medical clinical terms", () => {
  const medicalText = "During this period native will suffer from heart attack and cancer diagnosis.";
  const result = verifyAndSanitizeAiNarrative(medicalText, chart);

  assert.ok(!result.sanitizedNarrative.includes("heart attack"));
  assert.ok(!result.sanitizedNarrative.includes("cancer"));
  assert.ok(result.sanitizedViolations.some(v => v.includes("HEALTH_FORBIDDEN_TERM")));
});

// ─────────────────────────────────────────────────────────────
// 6. HEALTH DOMAIN STRUCTURAL SAFETY BOUNDARIES
// ─────────────────────────────────────────────────────────────
console.log("\n[6] Health Domain Structural Safety Boundaries & Statutory Notices:");

test("Health domain defines non-clinical structural capabilities", () => {
  const healthResult = expertReport.domainResults[DOMAIN.WELLNESS];
  assert.ok(healthResult.structuralCapabilities, "structuralCapabilities must exist on health domain");
  assert.equal(healthResult.structuralCapabilities.diseasePrediction, false);
  assert.equal(healthResult.structuralCapabilities.diagnosis, false);
  assert.equal(healthResult.structuralCapabilities.lifespanPrediction, false);
  assert.equal(healthResult.structuralCapabilities.deathPrediction, false);
});

test("Health domain contains explicit statutory medical notices in English and Tamil", () => {
  const healthResult = expertReport.domainResults[DOMAIN.WELLNESS];
  assert.ok(healthResult.statutoryNotice, "statutoryNotice must exist on health domain");
  assert.ok(healthResult.statutoryNotice.en.includes("STATUTORY MEDICAL NOTICE"));
  assert.ok(healthResult.statutoryNotice.ta.includes("சட்டபூர்வ மருத்துவ அறிவிப்பு"));
});

// ─────────────────────────────────────────────────────────────
// 7. STATUTORY ADVISORY NOTICES FOR FINANCE AND LEGAL
// ─────────────────────────────────────────────────────────────
console.log("\n[7] Statutory Advisory Notices for Commercial, Financial and Legal Domains:");

test("Finance domain carries explicit financial advisory notice", () => {
  const fin = expertReport.domainResults[DOMAIN.FINANCE];
  assert.ok(fin.statutoryNotice, "statutoryNotice must exist on finance domain");
  assert.ok(fin.statutoryNotice.en.includes("FINANCIAL ADVISORY NOTICE"));
});

test("Business domain carries explicit commercial advisory notice", () => {
  const biz = expertReport.domainResults[DOMAIN.BUSINESS];
  assert.ok(biz.statutoryNotice, "statutoryNotice must exist on business domain");
  assert.ok(biz.statutoryNotice.en.includes("COMMERCIAL ADVISORY NOTICE"));
});

test("Legal domain carries explicit legal advisory notice", () => {
  const leg = expertReport.domainResults[DOMAIN.LEGAL];
  assert.ok(leg.statutoryNotice, "statutoryNotice must exist on legal domain");
  assert.ok(leg.statutoryNotice.en.includes("LEGAL ADVISORY NOTICE"));
});

// ─────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(75));
console.log(` AUDIT RESULT: ${passes} Passed, ${fails} Failed`);
console.log("=".repeat(75));

process.exit(fails > 0 ? 1 : 0);
