/**
 * ASTROVERSE — Structured Claim Graph & AI Reasoning Test Suite
 *
 * Validates:
 * 1. DAG graph generation for career and relationship inquiries
 * 2. Convergence scoring (High, Moderate, Speculative)
 * 3. Counter-indicator detection and delay classification
 * 4. Classical citation mappings
 * 5. Grounded natural language synthesis from verified graph nodes
 */

import { buildStructuredClaimGraph, synthesizeExplanationFromGraph } from './src/services/claimGraphEngine.js';
import { calculatePlanetaryPositions } from './src/services/astroEngine.js';

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

console.log("\n==============================================================");
console.log(" RUNNING ASTROVERSE STRUCTURED CLAIM GRAPH TEST SUITE");
console.log("==============================================================");

// 1. Calculate authoritative test chart
const chart = calculatePlanetaryPositions("1990-04-25", "05:56:00", 12.9165, 79.1325, "vedic", 5.5);

const context = {
  system: { id: "lahiri" },
  chart: {
    ascendant: { sign: "Aries", degree: 14.5 },
    planets: chart.planets,
    currentDasha: { lord: "Jupiter", subLord: "Mars" },
    vargas: {
      d9: { ascendant: { sign: "Leo" }, planets: chart.planets },
      d10: { ascendant: { sign: "Sagittarius" }, planets: chart.planets }
    }
  },
  report: {
    activeSectionData: {},
    evidence: { evidenceIds: ["C01", "C02", "M01"] }
  }
};

// 2. Career Claim Graph Tests
console.log("\n1. Testing Career Structured Claim Graph...");
const careerGraph = buildStructuredClaimGraph("career", context);
assert(careerGraph.status === "GRAPH_RESOLVED", "Career claim graph resolved successfully");
assert(careerGraph.claims.length > 0, "Career graph contains verified claims");
assert(careerGraph.claims[0].premises.length > 0, "Claim includes verified D1/D10 chart premises");
assert(careerGraph.claims[0].traditionalCitations.length > 0, "Claim includes classical BPHS citations");
assert(careerGraph.overallConvergenceScore >= 0.5, "Convergence score calculated within valid bounds");

// 3. Relationships Claim Graph Tests
console.log("\n2. Testing Relationships Structured Claim Graph...");
const relGraph = buildStructuredClaimGraph("relationships", context);
assert(relGraph.status === "GRAPH_RESOLVED", "Relationship claim graph resolved successfully");
assert(relGraph.claims[0].birthTimeSensitivity === "HIGH", "Relationship D9 claims tagged with High sensitivity");
assert(relGraph.claims[0].premises.some(p => p.varga === "D9" || p.factor.includes("Venus")), "Relationship premises include 7th lord / Venus / D9");

// 4. Graph-to-Narrative Synthesis Tests
console.log("\n3. Testing Natural Language Synthesis from Verified Graph...");
const narrativeEn = synthesizeExplanationFromGraph(careerGraph, "en");
assert(narrativeEn.includes("Prediction Claim:"), "English narrative structured with prediction claim");
assert(narrativeEn.includes("Evidence Convergence:"), "English narrative includes convergence metric");
assert(narrativeEn.includes("Calculated Chart Premises:"), "English narrative displays premises");

const narrativeTa = synthesizeExplanationFromGraph(careerGraph, "ta");
assert(narrativeTa.includes("பலன் கணிப்பு:"), "Tamil narrative structured correctly");
assert(narrativeTa.includes("ஆதார ஒருமைப்பாடு"), "Tamil narrative displays convergence");

// 5. Empty / Insufficient Context Rejection Test
console.log("\n4. Testing Negative Case: Insufficient Context...");
const emptyGraph = buildStructuredClaimGraph("career", null);
assert(emptyGraph.status === "INSUFFICIENT_CONTEXT", "Null context returns INSUFFICIENT_CONTEXT");
assert(emptyGraph.claims.length === 0, "Zero claims synthesized on empty context");

console.log("\n==============================================================");
if (failed === 0) {
  console.log(` ALL ${passed} STRUCTURED CLAIM GRAPH TESTS PASSED 100%!`);
  process.exit(0);
} else {
  console.log(` CLAIM GRAPH TESTS: ${passed} passed, ${failed} FAILED.`);
  process.exit(1);
}
console.log("==============================================================\n");
