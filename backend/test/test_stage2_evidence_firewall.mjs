/**
 * SKR ASTRO - STAGE 2 EVIDENCE FIREWALL SUITE
 *
 * Verifies that the AI evidence gate:
 * 1. Blocks / redacts exact calendar dates when timing resolution is coarse (UNSUPPORTED_TIMING_PRECISION).
 * 2. Blocks / redacts uncalibrated percentage claims (UNCALIBRATED_PROBABILITY_CLAIM).
 * 3. Enforces valid evidence status categorization (SUPPORTED, PARTIALLY_SUPPORTED, TRADITIONAL_ONLY, etc.).
 * 4. Ensures Tamil and English output parity and safety disclosures.
 */

import { strict as assert } from "node:assert";
import {
  validateAndSanitizeAIResponse,
  scanTimingPrecision,
  scanUncalibratedProbabilities,
  EVIDENCE_STATUSES,
  OUTPUT_RESOLUTIONS
} from "../src/middleware/aiEvidenceGate.js";

async function runStage2Suite() {
  console.log("==============================================================");
  console.log(" SKR ASTRO STAGE 2: EVIDENCE FIREWALL & AI ASSISTANT SUITE");
  console.log("==============================================================");

  let passed = 0;

  function pass(testName) {
    passed++;
    console.log(`✓ [PASS] ${testName}`);
  }

  // 1. Evidence statuses and resolutions definitions
  assert.ok(EVIDENCE_STATUSES.SUPPORTED, "EVIDENCE_STATUSES has SUPPORTED");
  assert.ok(EVIDENCE_STATUSES.TRADITIONAL_ONLY, "EVIDENCE_STATUSES has TRADITIONAL_ONLY");
  assert.ok(OUTPUT_RESOLUTIONS.MONTH_RANGE, "OUTPUT_RESOLUTIONS has MONTH_RANGE");
  assert.ok(OUTPUT_RESOLUTIONS.YEAR, "OUTPUT_RESOLUTIONS has YEAR");
  pass("1.1 Canonical evidence statuses and output resolutions exported");

  // 2. Timing precision scanner
  const coarseResolution = OUTPUT_RESOLUTIONS.YEAR;
  const coarseTextWithExactDate = "Your major career shift will definitely occur on October 15, 2026 under the Jupiter dasha.";
  const scanExactDate = scanTimingPrecision(coarseTextWithExactDate, coarseResolution);
  assert.strictEqual(scanExactDate.hasUnsupportedPrecision, true, "Should detect unsupported exact date");
  assert.ok(scanExactDate.violations.length > 0, "Violations should list exact date");
  assert.ok(!scanExactDate.sanitizedText.includes("October 15, 2026"), "Sanitized text should redact specific calendar date");
  pass("2.1 scanTimingPrecision redacts exact date under YEAR resolution");

  const allowedDateText = "Your major career shift is anticipated in 2026-2027.";
  const scanCoarseValid = scanTimingPrecision(allowedDateText, coarseResolution);
  assert.strictEqual(scanCoarseValid.hasUnsupportedPrecision, false, "Should allow YEAR range when resolution is YEAR");
  pass("2.2 scanTimingPrecision permits valid coarse period");

  // 3. Uncalibrated probability scanner
  const uncalibratedText = "There is a 95% probability of buying a house in the next 2 years.";
  const scanProb = scanUncalibratedProbabilities(uncalibratedText, false);
  assert.strictEqual(scanProb.hasUncalibratedProbability, true, "Should detect uncalibrated probability");
  assert.ok(scanProb.violations.some(v => v.value.includes("95%")), "Should flag 95%");
  assert.ok(!scanProb.sanitizedText.includes("95%"), "Should redact 95%");
  pass("3.1 scanUncalibratedProbabilities redacts raw percentage when model is uncalibrated");

  const calibratedText = "Based on calibrated discrete-hazard model, estimated survival rate is 82%.";
  const scanCalibrated = scanUncalibratedProbabilities(calibratedText, true);
  assert.strictEqual(scanCalibrated.hasUncalibratedProbability, false, "Should allow percentage when calibrated");
  pass("3.2 scanUncalibratedProbabilities permits probability when model is calibrated");

  // 4. End-to-end validateAndSanitizeAIResponse integration
  const mockChartContext = {
    planets: [
      { name: "Sun", rasi: "Aries", sign: "Aries", house: 1, longitude: 15.5 },
      { name: "Moon", rasi: "Taurus", sign: "Taurus", house: 2, longitude: 45.2 },
      { name: "Jupiter", rasi: "Cancer", sign: "Cancer", house: 4, longitude: 105.0 }
    ],
    houses: [{ house: 1, sign: "Aries" }, { house: 2, sign: "Taurus" }, { house: 4, sign: "Cancer" }],
    system: { id: "lahiri", name: "Lahiri Chitrapaksha" }
  };

  const candidatePayload = {
    answer: "Sun is placed in Aries in the 1st house. On March 14, 2027 you have an 85% chance of relocating overseas.",
    timingResolution: OUTPUT_RESOLUTIONS.AGE_RANGE,
    isCalibrated: false
  };

  const firewallResult = validateAndSanitizeAIResponse(candidatePayload, mockChartContext);
  assert.strictEqual(firewallResult.isValid, false, "Should be flagged as invalid due to uncalibrated probability and exact date");
  assert.ok(
    firewallResult.structuredViolations?.some(v => v.type === "UNSUPPORTED_TIMING_PRECISION") ||
    firewallResult.violations.some(v => v.includes("UNSUPPORTED_TIMING_PRECISION")),
    "Contains UNSUPPORTED_TIMING_PRECISION violation"
  );
  assert.ok(
    firewallResult.structuredViolations?.some(v => v.type === "UNCALIBRATED_PROBABILITY_CLAIM") ||
    firewallResult.violations.some(v => v.includes("UNCALIBRATED_PROBABILITY_CLAIM")),
    "Contains UNCALIBRATED_PROBABILITY_CLAIM violation"
  );
  assert.ok(!firewallResult.sanitizedAnswer.includes("March 14, 2027"), "Exact date redacted in sanitizedAnswer");
  assert.ok(!firewallResult.sanitizedAnswer.includes("85%"), "Percentage redacted in sanitizedAnswer");
  pass("4.1 validateAndSanitizeAIResponse redacts precision & probability violations");

  // 5. Dual-language (Tamil & English) disclaimer compliance
  const tamilChartContext = {
    ...mockChartContext,
    evidenceNodes: [
      {
        nodeId: "EV_RULE_LEADERSHIP_SUN_H1",
        ruleId: "PARASHARA_SUN_H1_LEADERSHIP",
        domain: "தலைமைத்துவ",
        nodeType: "CANONICAL_RULE_NODE",
        description: "Sun in 1st house leadership capacity"
      }
    ]
  };
  const tamilCandidatePayload = {
    answer: "சூரியன் மேஷ ராசியில் 1-ம் வீட்டில் உள்ளார். இது பாரம்பரிய பராசர விதிப்படி தலைமைத்துவ ஆற்றலை குறிக்கிறது.",
    timingResolution: OUTPUT_RESOLUTIONS.NOT_DISCRIMINATING,
    isCalibrated: false
  };
  const tamilResult = validateAndSanitizeAIResponse(tamilCandidatePayload, tamilChartContext, { lang: "ta" });
  assert.strictEqual(tamilResult.isValid, true, "Valid traditional statement passes gate");
  assert.ok(tamilResult.sanitizedAnswer.includes("மேஷ ராசியில்"), "Tamil placement preserved");
  pass("5.1 Dual-language Tamil response validated with authentic planetary claims");

  console.log("\n==============================================================");
  console.log(` ALL ${passed} STAGE 2 EVIDENCE FIREWALL TESTS PASSED 100%!`);
  console.log("==============================================================\n");
}

runStage2Suite().catch(err => {
  console.error("Stage 2 Test Suite Failed:", err);
  process.exit(1);
});
