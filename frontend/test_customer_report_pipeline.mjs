/**
 * ASTROVERSE — Customer Report Pipeline Verification Suite
 * =========================================================
 * Tests the complete customer report pipeline across all 17 domains,
 * data contract invariants, anti-repetition engine, safety gates,
 * and the 16-check validation suite.
 */

import assert from "node:assert";
import { calculatePlanetaryPositions } from "./src/services/astroEngine.js";
import {
  generateLifeIntelligenceReport,
  validateLifeReport,
  ALL_17_DOMAINS,
  EVIDENCE_STRENGTH,
  EMPIRICAL_STATUS,
  EMPIRICAL_RESOLUTION,
  STATUTORY_NOTICES,
  getCachedLifeReport,
  getLifeReportCacheStats,
  configureReportCacheBindings,
  DEFAULT_PREDICTION_ENGINE_HASH
} from "./src/services/customerReport/index.js";
import { processEvidenceLinkedQA } from "./src/services/questionAnswer/qaEngine.js";

console.log("\n============================================================");
console.log(" ASTROVERSE — CUSTOMER REPORT REVAMP VERIFICATION SUITE");
console.log("============================================================\n");

// Benchmark Native: 1990-10-15 06:30 IST, Chennai (Libra Lagna)
const sampleChart = calculatePlanetaryPositions("1990-10-15", "06:30", 13.0827, 80.2707, "vedic", 5.5);
sampleChart.clientName = "Aditya Sharma";
sampleChart.birthDateStr = "1990-10-15";
sampleChart.birthTimeStr = "06:30";
sampleChart.birthPlace = "Chennai, Tamil Nadu, India";

// ─────────────────────────────────────────────────────────────
// 1. Report Generation & Single Data Contract (LifeReportModel)
// ─────────────────────────────────────────────────────────────
console.log("1. Generating LifeIntelligenceReport (English)...");
const reportEn = generateLifeIntelligenceReport(sampleChart, { lang: "en" });

assert(reportEn !== null, "LifeReportModel must not be null");
assert(reportEn.clientProfile, "Must contain clientProfile");
assert.strictEqual(reportEn.clientProfile.name, "Aditya Sharma", "Client name must match");
assert(reportEn.calculationMetadata, "Must contain calculationMetadata");
assert(reportEn.dataQuality, "Must contain dataQuality");
assert(reportEn.executiveSummary, "Must contain executiveSummary");
assert(reportEn.coreNatalProfile, "Must contain coreNatalProfile");
assert(Array.isArray(reportEn.planetaryTable), "Must contain planetaryTable");
assert.strictEqual(reportEn.planetaryTable.length, 9, "Must contain all 9 classical Grahas");
assert(Array.isArray(reportEn.houseAnalysis), "Must contain houseAnalysis");
assert.strictEqual(reportEn.houseAnalysis.length, 12, "Must contain 12 house analyses");
assert(Array.isArray(reportEn.yogaAnalysis), "Must contain yogaAnalysis");
assert(reportEn.vargaAnalysis, "Must contain vargaAnalysis");
assert(reportEn.currentDasha, "Must contain currentDasha");
assert(reportEn.currentTransits, "Must contain currentTransits");
assert(Array.isArray(reportEn.domainReports), "Must contain domainReports");
assert(reportEn.lifeTimeline, "Must contain lifeTimeline");
assert(reportEn.majorMilestones, "Must contain majorMilestones");
assert(reportEn.evidenceSummary, "Must contain evidenceSummary");
assert(reportEn.safetySummary, "Must contain safetySummary");
assert(reportEn.empiricalValidationSummary, "Must contain empiricalValidationSummary");
assert(Array.isArray(reportEn.limitations), "Must contain limitations");
assert(reportEn.technicalAppendix, "Must contain technicalAppendix");
console.log("   ✓ LifeReportModel single data contract verified with all 19 top-level modules.");

// ─────────────────────────────────────────────────────────────
// 2. All 17 Domains Coverage & Contract Completeness
// ─────────────────────────────────────────────────────────────
console.log("\n2. Verifying All 17 Domains Coverage & Structure...");
assert.strictEqual(reportEn.domainReports.length, 17, "Must contain exactly 17 domain reports");

const domainIds = reportEn.domainReports.map(d => d.domainId);
for (const requiredDomain of ALL_17_DOMAINS) {
  assert(domainIds.includes(requiredDomain), `Domain ${requiredDomain} must be present`);
}

for (const dr of reportEn.domainReports) {
  assert(dr.domainId, "Domain must have domainId");
  assert(dr.domainName?.en, `Domain ${dr.domainId} must have English name`);
  assert(dr.executiveConclusion.length > 20, `Domain ${dr.domainId} must have rich executive conclusion`);
  assert(dr.overallTraditionalAssessment, `Domain ${dr.domainId} must have overallTraditionalAssessment`);
  assert(Object.values(EVIDENCE_STRENGTH).includes(dr.evidenceStrength), `Domain ${dr.domainId} evidenceStrength must be valid enum`);
  assert(Array.isArray(dr.positiveIndicators), `Domain ${dr.domainId} must have positiveIndicators`);
  assert(Array.isArray(dr.challengingIndicators), `Domain ${dr.domainId} must have challengingIndicators`);
  assert(Array.isArray(dr.neutralIndicators), `Domain ${dr.domainId} must have neutralIndicators`);
  assert(Array.isArray(dr.evidenceChain) && dr.evidenceChain.length === 10, `Domain ${dr.domainId} must have 10-step evidence chain`);
  assert(Array.isArray(dr.traditionalTimingWindows), `Domain ${dr.domainId} must have traditionalTimingWindows`);
  assert(dr.currentRelevance, `Domain ${dr.domainId} must have currentRelevance`);
  assert(Array.isArray(dr.practicalGuidance) && dr.practicalGuidance.length >= 2, `Domain ${dr.domainId} must have practical guidance`);
  assert(Array.isArray(dr.whatCannotBeConcluded) && dr.whatCannotBeConcluded.length >= 1, `Domain ${dr.domainId} must declare what cannot be concluded`);
  assert(Array.isArray(dr.customerQuestions) && dr.customerQuestions.length >= 3, `Domain ${dr.domainId} must have 3-8 customer follow-up questions`);
}
console.log("   ✓ All 17 domains verified with complete sections A through K and 10-step evidence chains.");

// ─────────────────────────────────────────────────────────────
// 3. Domain Separation (Property vs Vehicle, Business vs Job)
// ─────────────────────────────────────────────────────────────
console.log("\n3. Testing Domain Independence & Separation...");
const propertyRep = reportEn.domainReports.find(d => d.domainId === "property");
const vehicleRep = reportEn.domainReports.find(d => d.domainId === "vehicle");
const businessRep = reportEn.domainReports.find(d => d.domainId === "business");
const jobRep = reportEn.domainReports.find(d => d.domainId === "job");

assert.notStrictEqual(propertyRep.domainId, vehicleRep.domainId, "Property and Vehicle must be separate domains");
assert(propertyRep.technicalEvidence.varga === "D4", "Property must evaluate D4 Chaturthamsha");
assert(vehicleRep.technicalEvidence.varga === "D16", "Vehicle must evaluate D16 Shodashamsha");

assert.notStrictEqual(businessRep.domainId, jobRep.domainId, "Business and Job must be separate domains");
assert(businessRep.technicalEvidence.primaryHouse === 7 || businessRep.technicalEvidence.primaryHouse === 10, "Business must evaluate 7th/10th house");
assert(jobRep.technicalEvidence.primaryHouse === 6, "Job must evaluate 6th house (service)");
console.log("   ✓ Property vs Vehicle and Business vs Job strictly separated.");

// ─────────────────────────────────────────────────────────────
// 4. Global Resolution Gate & Anti-False-Precision
// ─────────────────────────────────────────────────────────────
console.log("\n4. Testing Global Resolution Gate & Anti-False-Precision...");
const marriageRep = reportEn.domainReports.find(d => d.domainId === "marriage");
assert.strictEqual(marriageRep.empiricalResolution, "MULTI_YEAR_RANGE", "Marriage empiricalResolution must be MULTI_YEAR_RANGE");
assert.strictEqual(marriageRep.empiricalStatus, "EXPERIMENTAL", "Marriage empiricalStatus must be EXPERIMENTAL");

for (const dr of reportEn.domainReports) {
  if (dr.domainId !== "marriage") {
    assert.strictEqual(dr.empiricalResolution, "NOT_ESTABLISHED", `Domain ${dr.domainId} empirical resolution must be NOT_ESTABLISHED`);
    assert.strictEqual(dr.empiricalStatus, "NOT_ESTABLISHED", `Domain ${dr.domainId} empirical status must be NOT_ESTABLISHED`);
  }
  for (const tw of dr.traditionalTimingWindows) {
    assert.strictEqual(tw.traditionalRuleLabel, "TRADITIONAL RULE WINDOW", "Timing window must be labeled TRADITIONAL RULE WINDOW");
    assert.strictEqual(tw.predictiveProbability, null, "Timing window predictiveProbability must be null");
  }
}
console.log("   ✓ Global resolution gate verified: Zero false empirical precision exposed.");

// ─────────────────────────────────────────────────────────────
// 5. Statutory Safety Gate (Wellness, Legal, Finance)
// ─────────────────────────────────────────────────────────────
console.log("\n5. Testing Statutory Safety Gate Guardrails...");
const wellnessRep = reportEn.domainReports.find(d => d.domainId === "wellness");
const wellnessStr = JSON.stringify(wellnessRep);
assert(!/\bcancer\b/i.test(wellnessStr), "Wellness must not mention cancer");
assert(!/\btumor\b/i.test(wellnessStr), "Wellness must not mention tumor");
assert(!/\bsurgery prediction\b/i.test(wellnessStr), "Wellness must not mention surgery prediction");
assert(!/\borgan failure\b/i.test(wellnessStr), "Wellness must not mention organ failure");
assert(!/\blifespan prediction\b/i.test(wellnessStr), "Wellness must not mention lifespan prediction");
assert(wellnessRep.statutoryNotice.includes("not medical diagnosis or medical advice"), "Wellness must carry medical notice");

const legalRep = reportEn.domainReports.find(d => d.domainId === "legal");
const legalStr = JSON.stringify(legalRep);
assert(!/you will win the case/i.test(legalStr), "Legal must not guarantee victory");
assert(legalRep.statutoryNotice.includes("NOT constitute legal advice"), "Legal must carry legal notice");

const financeRep = reportEn.domainReports.find(d => d.domainId === "finance");
const finStr = JSON.stringify(financeRep);
assert(!/guaranteed profit/i.test(finStr), "Finance must not guarantee profit");
assert(financeRep.statutoryNotice.includes("NOT guarantee monetary profits"), "Finance must carry financial notice");
console.log("   ✓ Statutory safety gate verified across Wellness, Legal, and Finance.");

// ─────────────────────────────────────────────────────────────
// 6. Anti-Repetition Engine Verification
// ─────────────────────────────────────────────────────────────
console.log("\n6. Testing Anti-Repetition Engine...");
const allExecutiveConclusions = reportEn.domainReports.map(d => d.executiveConclusion);
const uniqueConclusions = new Set(allExecutiveConclusions);
assert.strictEqual(uniqueConclusions.size, 17, "All 17 executive conclusions must be unique");

assert(reportEn.validationAudit.qualityScore.repetitionScore >= 85, "Repetition score must be >= 85%");
console.log(`   ✓ Anti-repetition engine verified (Repetition Score: ${reportEn.validationAudit.qualityScore.repetitionScore}%).`);

// ─────────────────────────────────────────────────────────────
// 7. Current Life Phase Engine & Milestone Horizons
// ─────────────────────────────────────────────────────────────
console.log("\n7. Testing Current Life Phase Engine & Milestone Horizons...");
const curPhase = reportEn.executiveSummary.currentLifePhase;
assert(curPhase.currentAgeYears >= 30, `Current age must be >= 30 for 1990 birth, got ${curPhase.currentAgeYears}`);
assert(curPhase.mahadasha, "Must compute active Mahadasha");
assert(curPhase.antardasha, "Must compute active Antardasha");
assert(curPhase.startDate && curPhase.endDate, "Must provide ISO date boundaries");
assert(Array.isArray(curPhase.activatedHouses) && curPhase.activatedHouses.length > 0, "Must identify activated houses");
assert(Array.isArray(curPhase.currentOpportunities), "Must identify current opportunities");

const timeline = reportEn.lifeTimeline;
assert(Array.isArray(timeline.PAST), "Timeline must have PAST stages");
assert(timeline.CURRENT, "Timeline must have CURRENT stage");
assert(Array.isArray(timeline.NEXT_3_YEARS), "Timeline must have NEXT_3_YEARS");
assert(Array.isArray(timeline.NEXT_5_YEARS), "Timeline must have NEXT_5_YEARS");
assert(Array.isArray(timeline.NEXT_10_YEARS), "Timeline must have NEXT_10_YEARS");
assert(Array.isArray(timeline.LONG_TERM), "Timeline must have LONG_TERM");

const nextImportant = reportEn.validationAudit.checks.find(c => c.name === "pdfLayoutValidation");
assert(nextImportant.passed, "pdfLayoutValidation must pass");
console.log("   ✓ Current Life Phase and 6 lifecycle horizons verified.");

// ─────────────────────────────────────────────────────────────
// 8. 16-Check Validation Suite & Quality Audit
// ─────────────────────────────────────────────────────────────
console.log("\n8. Testing 16-Check Validation Suite & Internal Quality Audit...");
const audit = reportEn.validationAudit;
assert.strictEqual(audit.totalChecks, 16, "Must run all 16 mandated checks");
assert.strictEqual(audit.failedChecks, 0, `Expected 0 failed checks, got ${audit.failedChecks}: ${JSON.stringify(audit.failures)}`);
assert.strictEqual(audit.isValid, true, "Report must be valid");
assert.strictEqual(reportEn.isCertified, true, "Report must be certified");

assert(audit.qualityScore.evidenceCompleteness === 100, "Evidence completeness must be 100");
assert(audit.qualityScore.domainCompleteness === 100, "Domain completeness must be 100");
assert(audit.qualityScore.safetyCompliance === 100, "Safety compliance must be 100");
assert(audit.qualityScore.overallQualityScore >= 95, "Overall quality score must be >= 95");
console.log(`   ✓ 16-check validation suite PASSED 100% (Quality Score: ${audit.qualityScore.overallQualityScore}/100).`);

// ─────────────────────────────────────────────────────────────
// 9. Tamil Localization Completeness
// ─────────────────────────────────────────────────────────────
console.log("\n9. Testing Tamil Localization Completeness...");
const reportTa = generateLifeIntelligenceReport(sampleChart, { lang: "ta", clientName: "ஆதித்யா சர்மா" });
assert(reportTa.isCertified, "Tamil report must pass validation");
assert(reportTa.executiveSummary.coreProfileSummary.includes("லக்னம்"), "Tamil summary must contain Tamil terms");

const wellnessTa = reportTa.domainReports.find(d => d.domainId === "wellness");
assert(wellnessTa.domainName.ta.includes("ஆரோக்கியம்"), "Wellness domain name must be localized in Tamil");
assert(wellnessTa.statutoryNotice.includes("மருத்துவ"), "Wellness statutory notice must be localized in Tamil");
console.log("   ✓ Tamil localization completeness verified.");

// ─────────────────────────────────────────────────────────────
// 10. Multi-Tier Deterministic Report Caching & Performance Gates
// ─────────────────────────────────────────────────────────────
console.log("\n10. Testing Multi-Tier Deterministic Report Caching & Performance Gates...");

// 1. Chart calculation performance gate (<300ms)
const chartStart = performance.now();
const freshChart = calculatePlanetaryPositions("1990-10-15", "06:30", 13.0827, 80.2707, "vedic", 5.5);
const chartDuration = performance.now() - chartStart;
assert(freshChart && freshChart.planets.length === 9, "Chart calculation succeeded");
assert(chartDuration < 300, `Chart calculation must be <300ms (got ${chartDuration.toFixed(1)}ms)`);
console.log(`   ✓ Chart calculation latency: ${chartDuration.toFixed(1)}ms (<300ms gate).`);

// 2. Cached report retrieval performance gate (<500ms)
const cachedStart = performance.now();
const cachedReport = getCachedLifeReport(sampleChart, { lang: "en" });
const cachedDuration = performance.now() - cachedStart;
assert(cachedReport !== null, "Cached report must be retrieved from memory");
assert(cachedReport.isCertified, "Cached report must be certified LifeReportModel");
assert(cachedDuration < 500, `Cached report retrieval must be <500ms (got ${cachedDuration.toFixed(2)}ms)`);
console.log(`   ✓ Cached report latency: ${cachedDuration.toFixed(2)}ms (<500ms gate).`);

// 3. Cache stats tracking
const stats = getLifeReportCacheStats();
assert(stats.hits >= 1, `Cache hits must be >= 1 (got ${stats.hits})`);
assert(stats.size >= 1, `Cache size must be >= 1 (got ${stats.size})`);
console.log(`   ✓ Cache stats verified: hits=${stats.hits}, misses=${stats.misses}, size=${stats.size}.`);

// 4. Invalidation on predictionEngineHash divergence
configureReportCacheBindings({ predictionEngineHash: "tampered_engine_hash_xyz" });
const invalidatedReport = getCachedLifeReport(sampleChart, { lang: "en" });
assert.strictEqual(invalidatedReport, null, "Cache must invalidate and return null if predictionEngineHash changes");
configureReportCacheBindings({ predictionEngineHash: DEFAULT_PREDICTION_ENGINE_HASH }); // restore
console.log("   ✓ Cryptographic cache invalidation on hash divergence verified.");

// 5. Subsequent Q&A requests reuse cached expert report
// Re-cache report after invalidation test
generateLifeIntelligenceReport(sampleChart, { lang: "en" });
const qaContext = { chart: sampleChart };
const qaStart = performance.now();
const qaRes = await processEvidenceLinkedQA({
  question: "What is my Lagna and 10th house lord?",
  context: qaContext,
  mode: "expert"
});
const qaDuration = performance.now() - qaStart;
assert(qaRes && qaRes.answer, "QA response generated");
assert(qaDuration < 1000, `Evidence Q&A must be <1000ms (got ${qaDuration.toFixed(1)}ms)`);
assert(qaContext.report !== undefined, "Q&A context must populate context.report from cached report");
console.log(`   ✓ Evidence Q&A latency: ${qaDuration.toFixed(1)}ms (<1000ms gate), cached report reused.`);

console.log("\n============================================================");
console.log(" ALL CUSTOMER REPORT REVAMP TESTS PASSED 100%!");
console.log("============================================================\n");
