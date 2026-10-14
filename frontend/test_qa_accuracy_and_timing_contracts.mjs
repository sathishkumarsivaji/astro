/**
 * ASTROVERSE — Q&A Accuracy, Evidence Contracts & Timing Invariants Regression Suite
 * ====================================================================================
 * Verifies all 15 critical customer answer quality and evidence contract requirements:
 * 1.  Canonical answer contract separation (Calculation vs Traditional vs Empirical).
 * 2.  Timing status NOT_DISCRIMINATING enforces null timingWindow and NOT_DISCRIMINATING resolution.
 * 3.  Vehicle purchase timing eliminates 7-year broad window from being claimed as discriminating.
 * 4.  Vehicle purchase timing never leaks DASHA_FACT_MARS_ALL or raw internal tokens into customer prose or evidence.
 * 5.  Property inquiry differentiates BUY_EXISTING_PROPERTY.
 * 6.  Property inquiry differentiates BUY_LAND (vacant plots / agriculture land).
 * 7.  Property inquiry differentiates BUILD_HOUSE (construction milestones).
 * 8.  Property inquiry returns NOT_DISCRIMINATING and null window when no narrow window is isolated.
 * 9.  Business decision separates starting a new business (Venture) with distinct pros/cons/limitations.
 * 10. Business decision separates expanding an existing business (Branch) with distinct pros/cons/limitations.
 * 11. Business decision comparative evaluation provides side-by-side analysis for ambiguous inquiries.
 * 12. Children count inquiry strictly rejects deriving an integer count and never leaks code variables in prose.
 * 13. Children outlook separates traditional qualitative symbolism from childbirth timing and clinical fertility.
 * 14. Couple pronouns ("we") are gracefully scoped to single profile without claiming couple-level fertility.
 * 15. All evidence tokens (DASHA_FACT_*, LORD_FACT_*, TASK_*, VARGA_FACT_*) are humanized in customer prose.
 */

import assert from "node:assert/strict";
import { evaluateVehicleAcquisitionTiming } from "./src/services/questionAnswer/tasks/vehicleAcquisitionTiming.js";
import { evaluateHomeConstructionTiming, classifyPropertyType } from "./src/services/questionAnswer/tasks/homeConstructionTiming.js";
import { evaluateBusinessExpansionDecision } from "./src/services/questionAnswer/tasks/businessExpansionDecision.js";
import { evaluateChildrenCount } from "./src/services/questionAnswer/tasks/childrenCount.js";
import { evaluateChildrenOutlook } from "./src/services/questionAnswer/tasks/childrenOutlook.js";
import { humanizeEvidenceToken } from "./src/services/questionAnswer/evidenceGraph.js";
import { synthesizeAnswer } from "./src/services/questionAnswer/answerSynthesizer.js";

let passed = 0;
let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`✓ [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`✗ [FAIL] ${desc}:`, err.message);
    failed++;
  }
}

console.log("===========================================================================");
console.log(" SKR ASTRO: Q&A ACCURACY & EVIDENCE CONTRACT REGRESSION SUITE (15 CHECKS)");
console.log("===========================================================================\n");

// Mock chart data with a broad 7-year Mars Mahadasha without narrow antardasha
const mockBroadMarsChart = {
  ascendant: { sign: "Aries", signName: "Aries" },
  planets: [
    { name: "Mars", house: 1, sign: "Aries", dignity: "Own Sign" },
    { name: "Venus", house: 2, sign: "Taurus", dignity: "Own Sign" },
    { name: "Jupiter", house: 5, sign: "Leo", dignity: "Friendly" },
    { name: "Saturn", house: 10, sign: "Capricorn", dignity: "Own Sign" },
    { name: "Sun", house: 1, sign: "Aries", dignity: "Exalted" },
    { name: "Moon", house: 4, sign: "Cancer", dignity: "Own Sign" },
    { name: "Mercury", house: 2, sign: "Taurus", dignity: "Friendly" }
  ],
  dashaTimeline: [
    {
      mahadasha: "Mars",
      antardasha: "ALL",
      startYear: 2024,
      endYear: 2031, // 7-year broad window!
      startDate: "2024-01-01",
      endDate: "2031-01-01"
    }
  ],
  transits: {},
  vargas: {}
};

// Mock chart with narrow discriminating 1-year window
const mockNarrowChart = {
  ascendant: { sign: "Aries", signName: "Aries" },
  planets: [
    { name: "Mars", house: 1, sign: "Aries" },
    { name: "Venus", house: 4, sign: "Cancer" },
    { name: "Jupiter", house: 11, sign: "Aquarius" },
    { name: "Saturn", house: 10, sign: "Capricorn" },
    { name: "Sun", house: 1, sign: "Aries" },
    { name: "Moon", house: 4, sign: "Cancer" },
    { name: "Mercury", house: 2, sign: "Taurus" }
  ],
  dashaTimeline: [
    {
      mahadasha: "Venus",
      antardasha: "Mars",
      startYear: 2026,
      endYear: 2027,
      startDate: "2026-02-01",
      endDate: "2027-04-01"
    }
  ],
  transits: {},
  vargas: {}
};

// 1. Canonical answer contract separation
check("1. Canonical answer contract cleanly separates calculated facts from traditional rules", () => {
  const result = evaluateChildrenCount({
    question: "How many children will I have?",
    context: { chartData: mockBroadMarsChart }
  });
  assert.equal(result.interpretationPolicy, "TRADITIONAL_ONLY");
  assert.equal(result.empiricalStatus, "NOT_VALIDATED");
  assert.equal(Array.isArray(result.calculatedFacts), true);
  assert.equal(Array.isArray(result.traditionalRules), true);
});

// 2. Timing status NOT_DISCRIMINATING enforces null timingWindow and NOT_DISCRIMINATING resolution
check("2. NOT_DISCRIMINATING timingStatus guarantees null timingWindow and NOT_DISCRIMINATING resolution", () => {
  const result = evaluateVehicleAcquisitionTiming({
    question: "When should I buy a car?",
    context: { chartData: mockBroadMarsChart } // Only 7-year broad window available
  });
  assert.equal(result.timingStatus, "NOT_DISCRIMINATING");
  assert.equal(result.timingWindow, null);
  assert.equal(result.timingResolution, "NOT_DISCRIMINATING");
});

// 3. Vehicle purchase timing eliminates 7-year broad window from being claimed as discriminating
check("3. Vehicle purchase eliminates 7-year broad Mahadasha from discriminating candidate windows", () => {
  const result = evaluateVehicleAcquisitionTiming({
    question: "When will I buy a new car?",
    context: { chartData: mockBroadMarsChart }
  });
  assert.equal(result.answerState, "NO_DISCRIMINATING_WINDOW");
  assert.equal(result.candidateWindows.length, 0);
  assert.equal(result.recommendation, null);
});

// 4. Vehicle purchase timing never leaks DASHA_FACT_MARS_ALL or raw internal tokens into prose or claims
check("4. Vehicle purchase never exposes DASHA_FACT_MARS_ALL in prose, directAnswer, or claims", () => {
  const resultNarrow = evaluateVehicleAcquisitionTiming({
    question: "When can I purchase a car?",
    context: { chartData: mockNarrowChart }
  });
  const allText = JSON.stringify(resultNarrow);
  assert(!allText.includes("DASHA_FACT_MARS_ALL"), "Must not leak DASHA_FACT_MARS_ALL");
  assert(!allText.includes("DASHA_FACT_VENUS_MARS"), "Must not leak raw DASHA_FACT token");
  for (const claim of resultNarrow.supportingClaims) {
    assert(!claim.startsWith("DASHA_FACT_"), `Supporting claim must be human readable: ${claim}`);
  }
});

// 5. Property inquiry differentiates BUY_EXISTING_PROPERTY
check("5. Property inquiry differentiates BUY_EXISTING_PROPERTY for ready homes and apartments", () => {
  assert.equal(classifyPropertyType("When should I buy a 2BHK flat or apartment?"), "BUY_EXISTING_PROPERTY");
  assert.equal(classifyPropertyType("Will I buy a ready home this year?"), "BUY_EXISTING_PROPERTY");
});

// 6. Property inquiry differentiates BUY_LAND (vacant plots / agriculture land)
check("6. Property inquiry differentiates BUY_LAND for vacant land, plots, or agricultural property", () => {
  assert.equal(classifyPropertyType("When will I buy a vacant plot of land?"), "BUY_LAND");
  assert.equal(classifyPropertyType("Will I purchase agricultural land?"), "BUY_LAND");
  assert.equal(classifyPropertyType("நிலம் அல்லது மனை எப்போது வாங்குவேன்?"), "BUY_LAND");
});

// 7. Property inquiry differentiates BUILD_HOUSE (construction milestones)
check("7. Property inquiry differentiates BUILD_HOUSE for construction work and building a home", () => {
  assert.equal(classifyPropertyType("When can I build my own house?"), "BUILD_HOUSE");
  assert.equal(classifyPropertyType("When will home construction start?"), "BUILD_HOUSE");
  assert.equal(classifyPropertyType("வீடு கட்டும் பணி எப்போது தொடங்கும்?"), "BUILD_HOUSE");
});

// 8. Property inquiry returns NOT_DISCRIMINATING and null window when no narrow window is isolated
check("8. Property inquiry returns NOT_DISCRIMINATING and null window when no narrow window is present", () => {
  const result = evaluateHomeConstructionTiming({
    question: "When will I buy a plot of land?",
    context: { chartData: mockBroadMarsChart }
  });
  assert.equal(result.timingStatus, "NOT_DISCRIMINATING");
  assert.equal(result.timingWindow, null);
  assert.equal(result.timingResolution, "NOT_DISCRIMINATING");
  assert.equal(result.answerState, "NO_DISCRIMINATING_WINDOW");
});

// 9. Business decision separates starting a new business (Venture) with distinct pros/cons/limitations
check("9. Business decision evaluates starting a new business with distinct pros, cons, and limitations", () => {
  const result = evaluateBusinessExpansionDecision({
    question: "Should I start a completely new business in a different industry?",
    context: { chartData: mockNarrowChart }
  });
  assert.equal(result.decisionType, "NEW_BUSINESS");
  assert(result.recommendation.pros.length > 0, "Pros must be detailed");
  assert(result.recommendation.cons.length > 0, "Cons must be detailed");
  assert(result.limitation.includes("capital"), "Must include capital/commercial limitation");
});

// 10. Business decision separates expanding an existing business (Branch) with distinct pros/cons/limitations
check("10. Business decision evaluates branch expansion with distinct pros, cons, and limitations", () => {
  const result = evaluateBusinessExpansionDecision({
    question: "Should I open another branch outlet for my existing business?",
    context: { chartData: mockNarrowChart }
  });
  assert.equal(result.decisionType, "BRANCH_EXPANSION");
  assert(result.recommendation.pros.length > 0, "Pros must be detailed");
  assert(result.recommendation.cons.length > 0, "Cons must be detailed");
});

// 11. Business decision comparative evaluation provides side-by-side analysis for ambiguous inquiries
check("11. Business decision provides side-by-side comparative analysis when inquiry is general", () => {
  const result = evaluateBusinessExpansionDecision({
    question: "Should I expand my business?",
    context: { chartData: mockNarrowChart }
  });
  assert.equal(result.decisionType, "COMPARATIVE_DECISION");
  assert(result.reason.includes("Expanding Existing Enterprise"), "Must include existing enterprise path");
  assert(result.reason.includes("Starting New Business"), "Must include new business path");
  assert.equal(result.recommendation.paths.length, 2);
});

// 12. Children count inquiry strictly rejects deriving an integer count and never leaks code variables in prose
check("12. Children count rejects integer count and never leaks exactCount=null or code tokens in prose", () => {
  const result = evaluateChildrenCount({
    question: "How many children will we have?",
    context: { chartData: mockNarrowChart }
  });
  assert.equal(result.exactCount, null);
  assert.equal(result.estimatedCount, null);
  assert.equal(result.answerState, "NOT_ESTABLISHED");

  // Verify prose cleanliness: NO code tokens in user-facing text
  const prose = `${result.directAnswer} ${result.reason} ${result.limitation}`;
  assert(!prose.includes("exactCount = null"), "Prose must not contain exactCount = null");
  assert(!prose.includes("empiricalModelAvailable = false"), "Prose must not contain empiricalModelAvailable = false");
  assert(!prose.includes("fertilityStatus = NOT_ASSESSED"), "Prose must not contain fertilityStatus = NOT_ASSESSED");
  assert(!prose.includes("outcomeGuarantee = false"), "Prose must not contain outcomeGuarantee = false");
  assert(!prose.includes("SINGLE_PROFILE_ONLY"), "Prose must not contain raw token SINGLE_PROFILE_ONLY");
  assert(!prose.includes("ACTIVE_PROFILE"), "Prose must not contain raw token ACTIVE_PROFILE");
});

// 13. Children outlook separates traditional qualitative symbolism from childbirth timing and clinical fertility
check("13. Children outlook separates traditional symbolism from clinical fertility and purges code tokens", () => {
  const result = evaluateChildrenOutlook({
    question: "Can I have children?",
    context: { chartData: mockNarrowChart }
  });
  assert.equal(result.interpretationPolicy, "TRADITIONAL_ONLY");
  assert.equal(result.medicalFertilityAssessment, false);

  const prose = `${result.directAnswer} ${result.reason} ${result.limitation}`;
  assert(!prose.includes("fertilityStatus = NOT_ASSESSED"), "Must not leak fertilityStatus = NOT_ASSESSED");
  assert(!prose.includes("outcomeGuarantee = false"), "Must not leak outcomeGuarantee = false");
  assert(!prose.includes("medicalFertilityAssessment = false"), "Must not leak medicalFertilityAssessment = false");
  assert(!prose.includes("TRADITIONAL_ONLY"), "Must not leak raw token TRADITIONAL_ONLY in prose");
  assert(!prose.includes("UNSUPPORTED_TASK"), "Must not leak UNSUPPORTED_TASK in prose");
});

// 14. Couple pronouns ("we") are gracefully scoped to single profile without claiming couple-level fertility
check("14. Couple pronouns ('we') explain single profile scope in natural, human prose", () => {
  const result = evaluateChildrenCount({
    question: "How many children will we give birth to?",
    context: { chartData: mockNarrowChart }
  });
  assert.equal(result.subjectResolution.subject, "COUPLE");
  assert(result.directAnswer.includes("single birth chart is provided") || result.directAnswer.includes("individual chart only"),
    "Direct answer must explain single chart limitation in natural prose");
});

// 15. All evidence tokens (DASHA_FACT_*, LORD_FACT_*, TASK_*, VARGA_FACT_*) are humanized in customer prose
check("15. Evidence token humanizer translates all internal IDs to natural astrological descriptions", () => {
  assert.equal(humanizeEvidenceToken("DASHA_FACT_MARS_ALL"), "Mars Mahadasha period activation");
  assert.equal(humanizeEvidenceToken("DASHA_FACT_VENUS_MARS"), "Venus Mahadasha – Mars Antardasha sub-period");
  assert.equal(humanizeEvidenceToken("LORD_FACT_H4_MARS"), "4th House Lord (Mars)");
  assert.equal(humanizeEvidenceToken("HOUSE_FACT_H7"), "7th House astrological significations");
  assert.equal(humanizeEvidenceToken("PLANET_FACT_JUPITER"), "Jupiter planetary placement & significations");
  assert.equal(humanizeEvidenceToken("TRANSIT_FACT_SATURN_AQUARIUS"), "Transit Saturn in Aquarius");
  assert.equal(humanizeEvidenceToken("VARGA_FACT_D16_VEHICLE_CONFIRMED"), "D16 Shodashamsha confirmation for vehicle acquisition");
  assert.equal(humanizeEvidenceToken("VARGA_FACT_D4_PROPERTY_CONFIRMED"), "D4 Chaturthamsha confirmation for real estate & fixed assets");
  assert.equal(humanizeEvidenceToken("TASK_CHILDREN_COUNT"), "Children count inquiry (qualitative assessment)");

  // Tamil localization
  assert.equal(humanizeEvidenceToken("DASHA_FACT_MARS_ALL", true), "Mars மகாதசை கால இயக்கம்");
  assert.equal(humanizeEvidenceToken("LORD_FACT_H4_MARS", true), "4-ம் பாவக அதிபதியான Mars பகவான்");
});

console.log("\n===========================================================================");
console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("===========================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
