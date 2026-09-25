import fs from "fs";
import path from "path";
import {
  calculatePlanetaryPositions,
  calculateReportEvidencePackage,
  calculateExecutiveSummary,
  calculatePredictionReasoningChain,
  calculateShadbala,
  calculateClassicalAshtakavarga,
  calculateJaiminiSystem,
  calculateBhavaChalit,
  calculatePlanetaryAvasthas
} from "./src/services/astroEngine.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failedCount++;
    throw new Error(message);
  } else {
    console.log(`✓ ${message}`);
    passedCount++;
  }
}

console.log("=======================================================");
console.log(" RUNNING DETAILED REPORT INTEGRITY & ANTI-FABRICATION SUITE");
console.log("=======================================================\n");

// ----------------------------------------------------
// TEST 1: Static Source Code Scan for Prohibited Fallbacks
// ----------------------------------------------------
console.log("1. Static Source Code Scan in DetailedReportModal.jsx...");
const modalCode = fs.readFileSync(path.resolve("src/components/Horoscope/DetailedReportModal.jsx"), "utf8");

assert(!modalCode.includes("sthanaBala: 165"), "Zero hardcoded sample Shadbala rows in DetailedReportModal.jsx");
assert(!modalCode.includes("611.4"), "Zero hardcoded Moon Shadbala total in DetailedReportModal.jsx");
assert(!modalCode.includes("sav[sIdx] ?? 28"), "Zero hardcoded default 28 bindus fallback in Ashtakavarga");
assert(!modalCode.includes("H${((b * 2) % 12) + 1}"), "Zero hardcoded arithmetic arudha fallback in Jaimini");
assert(!modalCode.includes("degreeInSign: 27.5"), "Zero hardcoded sample Jaimini karaka rows in DetailedReportModal.jsx");
assert(!modalCode.includes("Yuva (Youthful / 100%)"), "Zero hardcoded default avasthas in DetailedReportModal.jsx");
assert(modalCode.includes("18. Technical Calculation Appendix"), "Chapter 18 header is present in tab list");
assert(modalCode.includes("18.2 Complete 9-Graha Calculated Position & Dispositor Table"), "Section 18.2 correctly named");
assert(modalCode.includes("18.6 7-Graha BAV + Lagna Contribution and 337-Bindu SAV Matrix"), "Section 18.6 correctly named");

// ----------------------------------------------------
// TEST 2: Static Source Code Scan in astroEngine.js
// ----------------------------------------------------
console.log("\n2. Static Source Code Scan in astroEngine.js...");
const engineCode = fs.readFileSync(path.resolve("src/services/astroEngine.js"), "utf8");

assert(engineCode.includes('version: "4.2.0-Scientific"'), "Evidence package returns 4.2.0-Scientific version string");
assert(!engineCode.includes('version: "2.0-CommercialGrade"'), "Purged legacy CommercialGrade version string");

// ----------------------------------------------------
// TEST 3: Dynamic Calculation of Reasoning Chain (All 9 Layers)
// ----------------------------------------------------
console.log("\n3. Dynamic Execution of calculatePredictionReasoningChain across domains...");
const chart = calculatePlanetaryPositions("1995-10-24", "10:30", 13.0827, 80.2707, "vedic", 5.5, { timezoneId: "Asia/Kolkata" });

const domains = ["career", "marriage", "wealth", "property", "education", "health", "spirituality"];
for (const dom of domains) {
  const chainEn = calculatePredictionReasoningChain(chart, dom, { lang: "en" });
  assert(chainEn.layerCount === 9, `${dom} reasoning chain contains all 9 levels`);
  assert(chainEn.evidenceLevels.length === 9, `${dom} evidenceLevels array has length 9`);
  assert(Array.isArray(chainEn.evidenceIds) && chainEn.evidenceIds.length === 9, `${dom} top-level evidenceIds present with 9 IDs`);
  assert(typeof chainEn.classification === "string", `${dom} top-level classification string present`);
  assert(typeof chainEn.summary === "string", `${dom} top-level summary string present`);
  assert(typeof chainEn.statusBadge === "string", `${dom} top-level statusBadge present`);

  const chainTa = calculatePredictionReasoningChain(chart, dom, { lang: "ta" });
  assert(chainTa.layerCount === 9, `${dom} Tamil reasoning chain contains all 9 levels`);
  assert(chainTa.evidenceLevels.length === 9, `${dom} Tamil evidenceLevels array has length 9`);
}

// ----------------------------------------------------
// TEST 4: Dynamic Execution of calculateReportEvidencePackage
// ----------------------------------------------------
console.log("\n4. Dynamic Execution of calculateReportEvidencePackage...");
const evidencePkg = calculateReportEvidencePackage(chart, "en");

assert(evidencePkg.meta.version === "4.2.0-Scientific", "Evidence package meta version is 4.2.0-Scientific");
assert(evidencePkg.meta.engineVersion === "4.2.0", "Evidence package meta engineVersion is 4.2.0");
assert(evidencePkg.structuredVargas !== null, "Structured Vargas present in evidence package");
assert(evidencePkg.reasoningChains.career.layerCount === 9, "Career reasoning chain embedded in package has 9 layers");
assert(evidencePkg.reasoningChains.marriage.layerCount === 9, "Marriage reasoning chain embedded in package has 9 layers");
assert(evidencePkg.reasoningChains.wealth.layerCount === 9, "Wealth reasoning chain embedded in package has 9 layers");

// ----------------------------------------------------
// TEST 5: Sparse/Empty Chart Payload Resilience (Zero Crash, Clean Fallbacks)
// ----------------------------------------------------
console.log("\n5. Sparse/Empty Chart Payload Resilience...");
const sparseChart = {
  date: new Date("2000-01-01T00:00:00.000Z"),
  ascendantLong: 0,
  moonLong: 30,
  sunLong: 60,
  lat: 51.5074,
  lng: -0.1278,
  tz: 0,
  planets: []
};

const execSummary = calculateExecutiveSummary(sparseChart, "en");
assert(execSummary !== null, "Executive summary calculates safely with sparse payload");
assert(execSummary.coreProfile.lagna !== undefined, "Lagna safely populated in sparse core profile");

const sparseChain = calculatePredictionReasoningChain(sparseChart, "career", { lang: "en" });
assert(sparseChain.layerCount === 9, "Reasoning chain produces 9 levels even with sparse planet payload");
assert(sparseChain.evidenceLevels[2].virupas === null, "Level 3 virupas correctly null when Shadbala is absent");

// ----------------------------------------------------
// TEST 6: AI Astrology Service Prompt Verification (18 Chapters)
// ----------------------------------------------------
console.log("\n6. Static Verification of AI Prompt 18-Chapter Structure...");
const aiServiceCode = fs.readFileSync(path.resolve("src/services/aiAstrologyService.js"), "utf8");
assert(aiServiceCode.includes("Structure Your Master Report into 18 Exhaustive Chapters") || aiServiceCode.includes("Structure Your Master Report into 19 Comprehensive Chapters"), "English prompt enforces 18 or 19 Comprehensive Chapters");
assert(aiServiceCode.includes("அத்தியாயம் 18: தொழில்நுட்ப கணக்கீட்டு பிற்சேர்க்கை"), "Tamil prompt enforces Chapter 18 Technical Appendix");
assert(aiServiceCode.includes("Chapter 17: Astrologer Evidence Dossier"), "English prompt contains Chapter 17");
assert(aiServiceCode.includes("Chapter 18: Comprehensive Technical Calculation Appendix"), "English prompt contains Chapter 18");

// ----------------------------------------------------
// TEST 7: Matrimonial Timing & Lifecycle Milestone Curation Invariant
// ----------------------------------------------------
console.log("\n7. Matrimonial Timing & Lifecycle Milestone Curation Invariant...");
const sampleChart = calculatePlanetaryPositions("1995-05-15", "10:30", 13.0827, 80.2707, "vedic", 5.5);

assert(Array.isArray(sampleChart.marriagePathway.primeWindows), "Marriage pathway must export primeWindows array");
assert(sampleChart.marriagePathway.primeWindows.length > 0 && sampleChart.marriagePathway.primeWindows.length <= 4, "Prime matrimonial windows must be curated to 1-4 windows");
for (const win of sampleChart.marriagePathway.primeWindows) {
  assert(win.startAge >= 18.0 && win.startAge <= 55.0, `Prime marriage window age (${win.startAge}) must be within realistic adult lifecycle [18, 55]`);
}

const ageSplits = sampleChart.marriagePathway.auspiciousAgeRange.split(" & ");
assert(ageSplits.length <= 4, "Auspicious age range must not flood the report with dozens of candidate windows");
assert(!sampleChart.marriagePathway.verdict.includes("?"), "Marriage verdict must contain zero unresolved '?' placeholders");
assert(!sampleChart.marriagePathway.auspiciousAgeRange.includes("?"), "Auspicious age range must contain zero unresolved '?' placeholders");

// Check Auspicious Life Milestones (Chapter 13)
assert(Array.isArray(sampleChart.auspiciousTimelines.milestones), "Auspicious milestones must be an array");
for (const m of sampleChart.auspiciousTimelines.milestones) {
  if (m.ageRange && m.ageRange !== "—") {
    const splits = m.ageRange.split(" & ");
    assert(splits.length <= 4, `Milestone ${m.id} age range must be curated to <= 4 peak windows (got ${splits.length})`);
    assert(!m.ageRange.includes("?"), `Milestone ${m.id} must not contain '?' placeholders`);
  }
}

console.log("\n=======================================================");
console.log(` ALL ${passedCount} DETAILED REPORT INTEGRITY & ANTI-FABRICATION TESTS PASSED!`);
console.log("=======================================================");
