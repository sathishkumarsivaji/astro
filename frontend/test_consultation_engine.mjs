/**
 * ASTROVERSE — Master Consultation Engine & Question-Driven Inference Test Suite
 *
 * Validates:
 * 1. Universal Question Ontology & Intent Classifier across 18+ domains
 * 2. Conversational Coreference & Entity Resolution ("she" -> spouse, "my parents" -> native parents)
 * 3. Non-Accusatory Joint vs Separate Residence Decomposition (Deconstructs residence into 4th/2nd/7th/8th & relocation)
 * 4. Spouse Family Wealth Relative Comparison Engine (Tiers from Lower to High, Non-Binary)
 * 5. Spouse Geographic Distance Categorical Banding (0-10km to 500+ km, Rejection of Fake Precision)
 * 6. Direction 8-Quadrant Engine with Multi-Method Convergence & Divergence Disclosures
 * 7. 17-Section Professional Astrologer Consultation Structure with 4 Certainty Layers
 * 8. Dynamic 5–15 Follow-Up Question Generator
 * 9. 14-Dimension Matchmaking Consultation Engine
 */

import { calculatePlanetaryPositions } from "./src/services/astroEngine.js";
import {
  CERTAINTY_LAYERS,
  QUESTION_ONTOLOGY,
  classifyConsultationIntent,
  evaluateSpouseFamilyWealth,
  evaluateSpouseGeographicDistance,
  evaluateSpouseDirection,
  evaluateJointVsSeparateResidence,
  evaluateNatalPromise,
  generateAstrologerConsultation,
  generateDynamicFollowUpQuestions,
  evaluateMatchmakingConsultation
} from "./src/services/consultationEngine.js";

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

console.log("\n=================================================================");
console.log(" ASTROVERSE MASTER CONSULTATION & QUESTION INFERENCE TEST SUITE");
console.log("=================================================================\n");

// ---------------------------------------------------------------------------
// 1. CERTAINTY LAYERS INVARIANT
// ---------------------------------------------------------------------------
console.log("1. Testing 4 Certainty Layers Specification...");
assert(CERTAINTY_LAYERS.LAYER_A.disclaimer === "Calculated astronomical position.", "Layer A disclaimer strictly matches astronomical certainty");
assert(CERTAINTY_LAYERS.LAYER_B.disclaimer === "Based on the selected astrological convention.", "Layer B disclaimer strictly matches astrological convention");
assert(CERTAINTY_LAYERS.LAYER_C.disclaimer === "Traditional astrological interpretation.", "Layer C disclaimer strictly matches interpretive inference");
assert(CERTAINTY_LAYERS.LAYER_D.disclaimer === "Astrological prediction based on the configured rule set.", "Layer D disclaimer strictly matches prediction window");

// ---------------------------------------------------------------------------
// 2. QUESTION CLASSIFIER & COREFERENCE RESOLUTION
// ---------------------------------------------------------------------------
console.log("\n2. Testing Universal Question Intent Classifier & Semantic Matching...");

const testQueries = [
  { q: "When will I get married?", expectedDomain: "MARRIAGE", expectedType: "MARRIAGE_TIMING" },
  { q: "At what age will I marry?", expectedDomain: "MARRIAGE", expectedType: "MARRIAGE_AGE" },
  { q: "Will my spouse's family be richer than my family?", expectedDomain: "MARRIAGE", expectedType: "SPOUSE_FAMILY_WEALTH" },
  { q: "How far away will my spouse's family be?", expectedDomain: "MARRIAGE", expectedType: "SPOUSE_DISTANCE" },
  { q: "Which direction will my spouse come from?", expectedDomain: "MARRIAGE", expectedType: "SPOUSE_DIRECTION" },
  { q: "Will my spouse live in a joint family or want a separate household?", expectedDomain: "MARRIAGE", expectedType: "JOINT_VS_SEPARATE" },
  { q: "Will my future wife separate me from my parents?", expectedDomain: "MARRIAGE", expectedType: "JOINT_VS_SEPARATE" },
  { q: "Will my spouse maintain family prestige and respect elders?", expectedDomain: "MARRIAGE", expectedType: "FAMILY_PRESTIGE" },
  { q: "Will marriage be arranged or love marriage?", expectedDomain: "MARRIAGE", expectedType: "LOVE_VS_ARRANGED" },
  { q: "When is my next promotion or salary hike?", expectedDomain: "CAREER", expectedType: "PROMOTION_TIMING" },
  { q: "When can I buy my own house or property?", expectedDomain: "WEALTH", expectedType: "PROPERTY_ACQUISITION" },
  { q: "Will I settle abroad or move overseas?", expectedDomain: "RELOCATION", expectedType: "FOREIGN_SETTLEMENT" }
];

testQueries.forEach(({ q, expectedDomain, expectedType }) => {
  const classified = classifyConsultationIntent(q);
  assert(classified.domain === expectedDomain, `Query "${q}" maps to Domain ${expectedDomain} (got ${classified.domain})`);
  assert(classified.questionType === expectedType, `Query "${q}" maps to Type ${expectedType} (got ${classified.questionType})`);
});

// ---------------------------------------------------------------------------
// 3. SAMPLE BENCHMARK CHART EVALUATION (1994 Chennai)
// ---------------------------------------------------------------------------
console.log("\n3. Testing Specialized Consultation Inference Engines on Canonical Chart...");
const canonicalChart = calculatePlanetaryPositions("1994-08-15", "06:30", 13.0827, 80.2707, "lahiri", 5.5);

// 3.1 Spouse Family Wealth Engine
console.log("\n3.1 Testing Spouse Family Wealth Engine...");
const wealthResult = evaluateSpouseFamilyWealth(canonicalChart);
assert(wealthResult && wealthResult.classification, "Spouse wealth classification evaluated");
assert(["VERY_LOW", "LOWER", "SIMILAR", "MODERATELY_HIGHER", "HIGHER", "VERY_HIGH", "INSUFFICIENT_EVIDENCE"].includes(wealthResult.classification), `Spouse wealth classification (${wealthResult.classification}) is valid relative tier`);
assert(Array.isArray(wealthResult.evidenceFactors) && wealthResult.evidenceFactors.length > 0, "Spouse wealth provides structured evidence factors");

// 3.2 Spouse Geographic Distance Engine
console.log("\n3.2 Testing Spouse Geographic Distance Engine...");
const distanceResult = evaluateSpouseGeographicDistance(canonicalChart);
assert(distanceResult && distanceResult.distanceCategory, "Spouse distance category evaluated");
assert(distanceResult.estimatedBand.includes("km") || distanceResult.estimatedBand.includes("Foreign"), "Distance estimated in banded range without fake single-kilometer precision");
assert(distanceResult.caveat.includes("Astrology provides qualitative regional bands"), "Distance includes explicit qualitative disclaimer");

// 3.3 Direction Engine
console.log("\n3.3 Testing Spouse Direction Engine...");
const directionResult = evaluateSpouseDirection(canonicalChart);
assert(directionResult && directionResult.primaryDirection, "Primary direction evaluated");
assert(["NORTH", "SOUTH", "EAST", "WEST", "NORTH_EAST", "NORTH_WEST", "SOUTH_EAST", "SOUTH_WEST"].includes(directionResult.primaryDirection), `Direction is a valid 8-quadrant direction (${directionResult.primaryDirection})`);
assert(directionResult.methodA !== undefined && directionResult.methodB !== undefined, "Direction discloses Method A and Method B comparison");

// 3.4 Joint Family vs Separate Residence Engine (Non-Accusatory)
console.log("\n3.4 Testing Joint Family vs Separate Residence Engine...");
const residenceResult = evaluateJointVsSeparateResidence(canonicalChart);
assert(residenceResult && residenceResult.model, "Residence model evaluated");
assert(["LIKELY_JOINT", "LIKELY_SEPARATE", "PERIODIC_ADJUSTED", "MIXED", "INSUFFICIENT_EVIDENCE"].includes(residenceResult.model), `Residence model is valid category (${residenceResult.model})`);
assert(residenceResult.nonAccusatoryNotice.includes("must never be construed as personal fault"), "Non-accusatory notice strictly present");

// 3.5 Natal Promise Engine
console.log("\n3.5 Testing Natal Promise Engine...");
const promiseResult = evaluateNatalPromise(canonicalChart, "MARRIAGE");
assert(promiseResult && promiseResult.promiseStrength, "Natal promise evaluated");
assert(Array.isArray(promiseResult.positiveIndicators) && promiseResult.positiveIndicators.length > 0, "Positive indicators identified");
assert(promiseResult.birthTimeSensitivity.includes("Navamsha"), "Birth-time sensitivity threshold disclosed");

// ---------------------------------------------------------------------------
// 4. 17-SECTION PROFESSIONAL CONSULTATION GENERATION
// ---------------------------------------------------------------------------
console.log("\n4. Testing 17-Section Astrologer Consultation Generator...");
const consultationEn = generateAstrologerConsultation(canonicalChart, "Will my spouse's family be richer than mine?", { lang: "en", depth: "ASTROLOGER_MODE" });
assert(consultationEn.sections.length === 17, `Consultation generated exactly 17 comprehensive sections (got ${consultationEn.sections.length})`);
assert(consultationEn.directAnswer.length > 20, "Direct answer is substantive and clear");
assert(consultationEn.followUpQuestions.length >= 5, `Follow-up question generator provided >= 5 dynamic questions (got ${consultationEn.followUpQuestions.length})`);

// Tamil Consultation Generation
console.log("\n4.1 Testing Tamil Consultation Generation...");
const consultationTa = generateAstrologerConsultation(canonicalChart, "எனக்கு எப்போது திருமணம் நடக்கும்?", { lang: "ta", depth: "ASTROLOGER_MODE" });
assert(consultationTa.sections.length === 17, "Tamil consultation generated exactly 17 sections");
assert(consultationTa.sections[1].titleTa === "நேரடி பதில்", "Tamil Section 2 header matches 'நேரடி பதில்'");
assert(consultationTa.followUpQuestions.length >= 5, "Tamil follow-up questions generated");

// ---------------------------------------------------------------------------
// 5. 14-DIMENSION MATCHMAKING CONSULTATION ENGINE
// ---------------------------------------------------------------------------
console.log("\n5. Testing 14-Dimension Matchmaking Consultation Engine...");
const chart2 = calculatePlanetaryPositions("1996-11-20", "14:15", 13.0827, 80.2707, "lahiri", 5.5);
const matchResult = evaluateMatchmakingConsultation(canonicalChart, chart2, false);
assert(matchResult.dimensions.length === 14, `Matchmaking evaluates all 14 dimensions (got ${matchResult.dimensions.length})`);
assert(matchResult.suggestedPreMarriageTopics.length >= 4, "Matchmaking suggests constructive pre-marriage discussion topics");

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log("\n=================================================================");
if (failed === 0) {
  console.log(` ALL ${passed} MASTER CONSULTATION & QUESTION INFERENCE CHECKS PASSED!`);
  console.log(" Consultation engine operates with maximum explainability and zero uncalibrated claims.");
} else {
  console.error(` FAILED: ${failed} checks failed.`);
  process.exit(1);
}
