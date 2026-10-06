/**
 * ASTROVERSE — Universal Semantic Claim Firewall & 9 Negative Test Cases
 * =======================================================================
 * Implements Part 11 validation mandates:
 * - CASE 1: "This chart indicates strong career success during the coming period." (INTERPRETATION, fails without rule)
 * - CASE 2: "Marriage will happen on 14 June 2028." (UNSUPPORTED_TIMING_PRECISION)
 * - CASE 3: "The model is 91.22% accurate." (MISREPRESENTED_METRIC)
 * - CASE 4: "You will undergo chest surgery in 2028." (HEALTH blocked)
 * - CASE 5: "You are guaranteed to become wealthy." (FINANCIAL blocked)
 * - CASE 6: "The court case will definitely be won." (LEGAL blocked)
 * - CASE 7: "Jupiter is in the 10th house." (FACT verified against chart)
 * - CASE 8: "Jupiter in the 10th house traditionally supports career development." (INTERPRETATION verified with rule)
 * - CASE 9: "The next favorable period is June 14, 2028." (TIMING requires resolution evidence)
 * - Plus Fail-Closed rule when substantive declarative text yields totalClaims = 0
 */

import assert from "node:assert/strict";
import {
  verifyAndSanitizeAiNarrative,
  splitIntoSentences,
  classifySentence,
  CLAIM_TYPES
} from "./src/services/aiEvidenceGate.js";

console.log("===========================================================================");
console.log(" UNIVERSAL SEMANTIC CLAIM FIREWALL — 9 NEGATIVE TEST CASES (PART 11)");
console.log("===========================================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

// Mock chart context with authentic placements
const chartContextWithJupiter10 = {
  planets: [
    { name: "Sun", house: 1, sign: "Aries", longitude: 15.2 },
    { name: "Jupiter", house: 10, sign: "Sagittarius", longitude: 270.5 },
    { name: "Mars", house: 4, sign: "Cancer", longitude: 95.0 }
  ],
  evidenceNodes: [
    { nodeId: "EV_PLANET_JUPITER_H10", type: "HOUSE", description: "Jupiter in House 10" },
    { nodeId: "EV_PLANET_JUPITER_SAGITTARIUS", type: "SIGN", description: "Jupiter in Sagittarius" },
    { nodeId: "EV_PLANET_SUN_H1", type: "HOUSE", description: "Sun in House 1" }
  ]
};

const chartContextWithCareerRule = {
  planets: [
    { name: "Sun", house: 1, sign: "Aries", longitude: 15.2 },
    { name: "Jupiter", house: 10, sign: "Sagittarius", longitude: 270.5 }
  ],
  evidenceNodes: [
    { nodeId: "EV_PLANET_JUPITER_H10", type: "HOUSE", description: "Jupiter in House 10" },
    {
      nodeId: "RULE_JUPITER_10H_CAREER_GROWTH",
      ruleId: "RULE_JUPITER_10H_CAREER_GROWTH",
      nodeType: "CANONICAL_RULE_NODE",
      domain: "CAREER",
      description: "Jupiter in the 10th house traditionally supports career development and professional growth."
    }
  ]
};

// -------------------------------------------------------------------------
// CASE 1: Substantive Interpretation Claim Grounding
// -------------------------------------------------------------------------
test("CASE 1: 'This chart indicates strong career success during the coming period.' -> INTERPRETATION; fails without rule node", () => {
  const text = "This chart indicates strong career success during the coming period.";
  
  // Test sentence classification
  const sentences = splitIntoSentences(text);
  assert.equal(sentences.length, 1);
  const cs = classifySentence(sentences[0]);
  assert.equal(cs.sentenceType, CLAIM_TYPES.INTERPRETATION);
  assert.equal(cs.substantive, true);

  // Without career rule node in graph -> MUST fail closed
  const emptyChartContext = { planets: [{ name: "Sun", house: 1 }] };
  const res = verifyAndSanitizeAiNarrative(text, emptyChartContext);
  assert.equal(res.isValid, false, "Must fail closed when rule is absent");
  assert.ok(res.unsupportedClaims.length >= 1, "Must register unsupported interpretive claim");
  assert.equal(res.unsupportedClaims[0].claimType, CLAIM_TYPES.INTERPRETATION);
  assert.ok(res.unsupportedClaims[0].reason.includes("NO_INTERPRETIVE_RULE_IN_GRAPH"));
});

// -------------------------------------------------------------------------
// CASE 2: Exact Timing Precision Blocking
// -------------------------------------------------------------------------
test("CASE 2: 'Marriage will happen on 14 June 2028.' -> fails with UNSUPPORTED_TIMING_PRECISION", () => {
  const text = "Marriage will happen on 14 June 2028.";
  const res = verifyAndSanitizeAiNarrative(text, chartContextWithJupiter10);
  assert.equal(res.isValid, false);
  const timingClaim = res.unsupportedClaims.find(c => c.failure === "UNSUPPORTED_TIMING_PRECISION");
  assert.ok(timingClaim, "Must flag failure UNSUPPORTED_TIMING_PRECISION");
  assert.equal(timingClaim.claimType, CLAIM_TYPES.TIMING);
});

// -------------------------------------------------------------------------
// CASE 3: Misrepresented Empirical Metric Blocking
// -------------------------------------------------------------------------
test("CASE 3: 'The model is 91.22% accurate.' -> fails with MISREPRESENTED_METRIC", () => {
  const text = "The model is 91.22% accurate.";
  const res = verifyAndSanitizeAiNarrative(text, chartContextWithJupiter10);
  assert.equal(res.isValid, false);
  const empClaim = res.unsupportedClaims.find(c => c.failure === "MISREPRESENTED_METRIC");
  assert.ok(empClaim, "Must flag failure MISREPRESENTED_METRIC");
  assert.equal(empClaim.claimType, CLAIM_TYPES.EMPIRICAL);
});

// -------------------------------------------------------------------------
// CASE 4: Clinical Health / Surgery Blocking
// -------------------------------------------------------------------------
test("CASE 4: 'You will undergo chest surgery in 2028.' -> blocked by Health Safety Layer", () => {
  const text = "You will undergo chest surgery in 2028.";
  const res = verifyAndSanitizeAiNarrative(text, chartContextWithJupiter10);
  assert.equal(res.isValid, false);
  assert.ok(res.sanitizedViolations.some(v => v.includes("HEALTH")));
  assert.ok(!res.sanitizedNarrative.includes("surgery"), "Surgery term must be removed/sanitized");
});

// -------------------------------------------------------------------------
// CASE 5: Unsupported Financial Certainty Blocking
// -------------------------------------------------------------------------
test("CASE 5: 'You are guaranteed to become wealthy.' -> blocked for unsupported financial certainty", () => {
  const text = "You are guaranteed to become wealthy.";
  const res = verifyAndSanitizeAiNarrative(text, chartContextWithJupiter10);
  assert.equal(res.isValid, false);
  const finClaim = res.unsupportedClaims.find(c => c.failure === "UNSUPPORTED_FINANCIAL_CERTAINTY");
  assert.ok(finClaim, "Must flag failure UNSUPPORTED_FINANCIAL_CERTAINTY");
  assert.equal(finClaim.claimType, CLAIM_TYPES.FINANCIAL);
});

// -------------------------------------------------------------------------
// CASE 6: Unsupported Legal Certainty Blocking
// -------------------------------------------------------------------------
test("CASE 6: 'The court case will definitely be won.' -> blocked for unsupported legal certainty", () => {
  const text = "The court case will definitely be won.";
  const res = verifyAndSanitizeAiNarrative(text, chartContextWithJupiter10);
  assert.equal(res.isValid, false);
  const legalClaim = res.unsupportedClaims.find(c => c.failure === "UNSUPPORTED_LEGAL_CERTAINTY");
  assert.ok(legalClaim, "Must flag failure UNSUPPORTED_LEGAL_CERTAINTY");
  assert.equal(legalClaim.claimType, CLAIM_TYPES.LEGAL);
});

// -------------------------------------------------------------------------
// CASE 7: Fact Placement Verification
// -------------------------------------------------------------------------
test("CASE 7: 'Jupiter is in the 10th house.' -> FACT verified against calculated chart facts", () => {
  const text = "Jupiter is in the 10th house.";
  
  // Verification against correct chart context
  const validRes = verifyAndSanitizeAiNarrative(text, chartContextWithJupiter10);
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.verifiedClaims.length, 1);
  assert.equal(validRes.verifiedClaims[0].matchedFactor, "Jupiter in House 10");

  // Contradiction against false chart context (Jupiter in house 4)
  const falseChart = {
    planets: [{ name: "Jupiter", house: 4, sign: "Cancer" }],
    evidenceNodes: [{ nodeId: "EV_PLANET_JUPITER_H4" }]
  };
  const falseRes = verifyAndSanitizeAiNarrative(text, falseChart);
  assert.equal(falseRes.isValid, false);
  assert.ok(falseRes.unsupportedClaims.some(c => c.reason.includes("CONTRADICTS_CALCULATED_CHART")));
});

// -------------------------------------------------------------------------
// CASE 8: Grounded Traditional Interpretation Verification
// -------------------------------------------------------------------------
test("CASE 8: 'Jupiter in the 10th house traditionally supports career development.' -> INTERPRETATION verified with canonical rule", () => {
  const text = "Jupiter in the 10th house traditionally supports career development.";
  
  // With canonical career rule node -> Passes
  const groundedRes = verifyAndSanitizeAiNarrative(text, chartContextWithCareerRule);
  assert.equal(groundedRes.isValid, true);
  assert.ok(groundedRes.verifiedClaims.length >= 1);
  assert.ok(groundedRes.verifiedClaims.some(c => c.matchedFactor.includes("Canonical rule grounding for CAREER")));

  // Without career rule node -> Fails
  const ungroundedRes = verifyAndSanitizeAiNarrative(text, chartContextWithJupiter10);
  assert.equal(ungroundedRes.isValid, false);
  assert.ok(ungroundedRes.unsupportedClaims.some(c => c.reason.includes("NO_INTERPRETIVE_RULE_IN_GRAPH")));
});

// -------------------------------------------------------------------------
// CASE 9: Timing Claim Resolution Verification
// -------------------------------------------------------------------------
test("CASE 9: 'The next favorable period is June 14, 2028.' -> TIMING requires resolution evidence; fails unsupported exact day", () => {
  const text = "The next favorable period is June 14, 2028.";
  const res = verifyAndSanitizeAiNarrative(text, chartContextWithJupiter10);
  assert.equal(res.isValid, false);
  const timingClaim = res.unsupportedClaims.find(c => c.failure === "UNSUPPORTED_TIMING_PRECISION");
  assert.ok(timingClaim);
  assert.equal(timingClaim.claimType, CLAIM_TYPES.TIMING);
});

// -------------------------------------------------------------------------
// FAIL-CLOSED MANDATE: Substantive Text with totalClaims = 0 Fails Closed
// -------------------------------------------------------------------------
test("FAIL-CLOSED MANDATE: Declarative substantive sentences cannot escape with isValid=true", () => {
  // A declarative sentence that previously might not match strict regex
  const evasiveText = "This chart indicates remarkable professional accomplishments during the coming cycles.";
  const emptyChart = { planets: [] };
  const res = verifyAndSanitizeAiNarrative(evasiveText, emptyChart);

  assert.equal(res.isValid, false, "Must fail closed");
  assert.ok(res.unsupportedClaims.length > 0 || res.failureReason != null);
});

// -------------------------------------------------------------------------
// SUBSTANTIVE-SENTENCE COVERAGE GATE & BILLIONAIRE MULTI-SENTENCE LOOPHOLE
// -------------------------------------------------------------------------
test("MULTI-SENTENCE LOOPHOLE TEST: Verified fact cannot shield extreme billionaire financial prediction", () => {
  const mixedText = "Jupiter is in the 10th house. You will become a billionaire in 2027.";
  const res = verifyAndSanitizeAiNarrative(mixedText, chartContextWithJupiter10);

  assert.equal(res.isValid, false, "Must fail closed despite Jupiter 10th house verification");
  assert.equal(res.verifiedClaims.length, 1, "Jupiter in House 10 is verified");
  const finViolation = res.unsupportedClaims.find(c => c.failure === "UNSUPPORTED_FINANCIAL_CERTAINTY");
  assert.ok(finViolation, "Must flag UNSUPPORTED_FINANCIAL_CERTAINTY for billionaire prediction");
});

test("SUBSTANTIVE-SENTENCE COVERAGE GATE: Every substantive sentence must have verifiable evidence grounding", () => {
  const partiallyGroundedText = "Jupiter in the 10th house traditionally supports career development. An unprecedented mysterious fate awaits you tomorrow.";
  const res = verifyAndSanitizeAiNarrative(partiallyGroundedText, chartContextWithCareerRule);

  assert.equal(res.isValid, false, "Must fail closed when substantive sentence lacks grounding");
  assert.equal(res.failureReason, "UNCOVERED_SUBSTANTIVE_SENTENCES");
  assert.ok(res.uncoveredSubstantiveSentenceIds.length >= 1, "Must list uncovered substantive sentence IDs");
  assert.ok(res.unsupportedClaims.some(c => c.failure === "UNCOVERED_SUBSTANTIVE_SENTENCE"));
});

console.log("\n===========================================================================");
if (failed === 0) {
  console.log(` ALL ${passed} UNIVERSAL CLAIM FIREWALL TESTS PASSED 100%!`);
  process.exitCode = 0;
} else {
  console.error(` FAILED: ${failed} checks failed, ${passed} passed.`);
  process.exitCode = 1;
}
