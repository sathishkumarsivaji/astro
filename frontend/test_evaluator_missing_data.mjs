/**
 * ASTROVERSE — Task Evaluator Missing-Data & Metamorphic Test Suite
 * =================================================================
 * Verifies that:
 * 1. Missing chart context (context = {}) strictly triggers fail-closed
 *    behavior (answerState: "INSUFFICIENT_DATA", calculatedFacts: [],
 *    candidateWindows: [], timingResolution: null, recommendation: null).
 * 2. Target exam sessions ("December 2026", "DEC 2026") are preserved without truncation.
 * 3. Household arrangement implements three-valued evidence without forced joint-family assumptions.
 * 4. Spouse family comparison disclaims wealth parity quantification from a single chart.
 */

import assert from "node:assert/strict";

import { evaluateHouseholdArrangement } from "./src/services/questionAnswer/tasks/householdArrangement.js";
import { evaluateNamedExamination, extractExamName, extractExamSession } from "./src/services/questionAnswer/tasks/namedExamination.js";
import { evaluateForeignEmployment } from "./src/services/questionAnswer/tasks/foreignEmployment.js";
import { evaluateSpouseFamilyComparison } from "./src/services/questionAnswer/tasks/spouseFamilyComparison.js";
import { evaluateMarriageRelationshipOutlook } from "./src/services/questionAnswer/tasks/marriageRelationshipOutlook.js";
import { evaluateForeignTripTiming } from "./src/services/questionAnswer/tasks/foreignTripTiming.js";
import { evaluateVehicleAcquisitionTiming } from "./src/services/questionAnswer/tasks/vehicleAcquisitionTiming.js";
import { evaluateHomeConstructionTiming } from "./src/services/questionAnswer/tasks/homeConstructionTiming.js";
import { evaluatePropertyBuyVsBuildDecision } from "./src/services/questionAnswer/tasks/propertyDecision.js";
import { evaluateJobTransitionDecision } from "./src/services/questionAnswer/tasks/jobTransitionDecision.js";
import { evaluateWealthAccumulationDecision } from "./src/services/questionAnswer/tasks/wealthAccumulationDecision.js";
import { evaluateWellnessVitalityCycle } from "./src/services/questionAnswer/tasks/wellnessVitalityCycle.js";
import { evaluateMonthlyOutlook } from "./src/services/questionAnswer/tasks/monthlyOutlook.js";
import { evaluateFamilyExpansionTiming } from "./src/services/questionAnswer/tasks/familyExpansionTiming.js";

console.log("=================================================");
console.log("RUNNING TASK EVALUATOR MISSING-DATA TEST SUITE");
console.log("=================================================");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// 1. Fail-Closed on context = {}
const evaluators = [
  { name: "householdArrangement", fn: evaluateHouseholdArrangement, question: "Will I live with joint family or separate?" },
  { name: "namedExamination", fn: evaluateNamedExamination, question: "Will I clear UGC NET DEC 2026?" },
  { name: "foreignEmployment", fn: evaluateForeignEmployment, question: "When will I get a job abroad?" },
  { name: "spouseFamilyComparison", fn: evaluateSpouseFamilyComparison, question: "Is my spouse's family wealthier than mine?" },
  { name: "marriageRelationshipOutlook", fn: evaluateMarriageRelationshipOutlook, question: "Will my relationship improve?" },
  { name: "foreignTripTiming", fn: evaluateForeignTripTiming, question: "When can I travel abroad for vacation?" },
  { name: "vehicleAcquisitionTiming", fn: evaluateVehicleAcquisitionTiming, question: "When will I buy a new car?" },
  { name: "homeConstructionTiming", fn: evaluateHomeConstructionTiming, question: "When should I begin house construction?" },
  { name: "propertyDecision", fn: evaluatePropertyBuyVsBuildDecision, question: "Should I buy a ready home or build a house?" },
  { name: "jobTransitionDecision", fn: evaluateJobTransitionDecision, question: "Should I switch jobs or stay?" },
  { name: "wealthAccumulationDecision", fn: evaluateWealthAccumulationDecision, question: "Should I invest aggressively or preserve capital?" },
  { name: "wellnessVitalityCycle", fn: evaluateWellnessVitalityCycle, question: "What is my current vitality cycle?" },
  { name: "monthlyOutlook", fn: evaluateMonthlyOutlook, question: "What is my monthly outlook for next 3 months?" },
  { name: "familyExpansionTiming", fn: evaluateFamilyExpansionTiming, question: "When will we have children?" }
];

evaluators.forEach(({ name, fn, question }, idx) => {
  test(`1.${idx + 1} ${name} returns INSUFFICIENT_DATA and fails closed when context is empty`, () => {
    const res = fn({ question, context: {} });
    assert.equal(res.answerState, "INSUFFICIENT_DATA", `${name} answerState must be INSUFFICIENT_DATA`);
    assert.ok(res.directAnswer && res.directAnswer.length > 10, `${name} must provide informative directAnswer`);
    assert.deepEqual(res.candidateWindows, [], `${name} candidateWindows must be empty array`);
    assert.equal(res.timingResolution, null, `${name} timingResolution must be strictly null`);
    assert.equal(res.recommendation, null, `${name} recommendation must be null`);
    if (res.calculatedFacts) {
      assert.deepEqual(res.calculatedFacts, [], `${name} calculatedFacts must be strictly empty`);
    }
    assert.ok(Array.isArray(res.missingInputs) && res.missingInputs.length > 0, `${name} missingInputs must list required chart data`);
  });
});

// 2. Exact Session Extraction in namedExamination
test("2.1 Preserves exact examination name and target session without truncation", () => {
  assert.equal(extractExamName("Will I clear UGC NET DEC 2026?"), "UGC NET");
  assert.equal(extractExamSession("Will I clear UGC NET DEC 2026?"), "December 2026");
  assert.equal(extractExamSession("UGC NET December 2026 session"), "December 2026");
  assert.equal(extractExamSession("Will I pass UPSC May 2027?"), "May 2027");
  assert.equal(extractExamSession("GATE 2026 score outlook"), "2026");
  assert.equal(extractExamSession("போட்டித் தேர்வு டிசம்பர் 2026"), "டிசம்பர் 2026");
});

test("2.2 namedExamination preserves December 2026 in direct answer when chart is provided", () => {
  const chart = {
    houses: [
      { house: 4, sign: "Taurus" },
      { house: 5, sign: "Gemini", lord: "Mercury" },
      { house: 6, sign: "Cancer", lord: "Moon" }
    ],
    planets: [
      { name: "Mercury", sign: "Gemini", house: 5, dignity: "OWN" },
      { name: "Jupiter", sign: "Pisces", house: 2, dignity: "OWN" }
    ]
  };

  const res = evaluateNamedExamination({
    question: "Will I clear UGC NET DEC 2026?",
    context: { chart }
  });

  assert.equal(res.answerState, "ANSWERED");
  assert.equal(res.examName, "UGC NET");
  assert.equal(res.targetSession, "December 2026");
  assert.ok(res.directAnswer.includes("December 2026"), "Direct answer must cite December 2026");
  assert.ok(res.directAnswer.includes("UGC NET"), "Direct answer must cite UGC NET");
  // Refuses pass/fail guarantee
  assert.ok(!res.directAnswer.includes("100% pass") && !res.directAnswer.includes("guaranteed pass"));
});

// 3. Three-Valued Evidence in householdArrangement
test("3.1 householdArrangement identifies PRESENT separative influence", () => {
  const chartWithRahuIn4th = {
    houses: [
      { house: 2, sign: "Taurus", lord: "Venus" },
      { house: 4, sign: "Cancer", lord: "Moon" },
      { house: 12, sign: "Pisces", lord: "Jupiter" }
    ],
    planets: [
      { name: "Moon", house: 1, sign: "Aries" },
      { name: "Rahu", house: 4, sign: "Cancer" },
      { name: "Saturn", house: 9, sign: "Sagittarius" }
    ]
  };

  const res = evaluateHouseholdArrangement({
    question: "Will I live with joint family or separate?",
    context: { chart: chartWithRahuIn4th }
  });

  assert.equal(res.answerState, "ANSWERED");
  const sepFact = res.calculatedFacts.find(f => f.id === "FACT_INDEPENDENT_INDICATORS");
  assert.equal(sepFact.value, "PRESENT");
  assert.equal(res.recommendation.indicatedArrangement, "INDEPENDENT_HOUSEHOLD");
});

test("3.2 householdArrangement sets ABSENT_AFTER_EVALUATION when no separative markers exist (no forced joint family)", () => {
  const chartWithoutSeparation = {
    houses: [
      { house: 2, sign: "Taurus", lord: "Venus" },
      { house: 4, sign: "Cancer", lord: "Moon" },
      { house: 12, sign: "Pisces", lord: "Jupiter" }
    ],
    planets: [
      { name: "Moon", house: 1, sign: "Aries" },
      { name: "Rahu", house: 10, sign: "Capricorn" },
      { name: "Saturn", house: 9, sign: "Sagittarius" }
    ]
  };

  const res = evaluateHouseholdArrangement({
    question: "Will I live with joint family or separate?",
    context: { chart: chartWithoutSeparation }
  });

  assert.equal(res.answerState, "ANSWERED");
  const sepFact = res.calculatedFacts.find(f => f.id === "FACT_INDEPENDENT_INDICATORS");
  assert.equal(sepFact.value, "ABSENT_AFTER_EVALUATION");
  assert.equal(res.recommendation.indicatedArrangement, "FLEXIBLE_ARRANGEMENT");
  assert.ok(res.directAnswer.includes("does not guarantee or mandate a joint family"), "Must disclaim forcing joint family");
});

// 4. Single Chart Limitation in spouseFamilyComparison
test("4.1 spouseFamilyComparison disclaims wealth parity when single chart provided", () => {
  const chart = {
    houses: [
      { house: 2, sign: "Taurus", lord: "Venus" },
      { house: 7, sign: "Libra", lord: "Venus" },
      { house: 8, sign: "Scorpio", lord: "Mars" }
    ],
    planets: [
      { name: "Venus", house: 2, sign: "Taurus" },
      { name: "Jupiter", house: 11, sign: "Pisces" }
    ]
  };

  const res = evaluateSpouseFamilyComparison({
    question: "Is my spouse's family wealthier than mine?",
    context: { chart }
  });

  assert.equal(res.answerState, "ANSWERED");
  assert.ok(res.directAnswer.includes("cannot be asserted from a single natal chart alone"));
  assert.equal(res.recommendation.comparativeTier, "Indeterminate without independent spouse financial data");
});

console.log("=================================================");
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}
