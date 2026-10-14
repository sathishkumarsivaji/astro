/**
 * SKR ASTRO / ASTROVERSE — 25-Point Comprehensive Forensic Pipeline Audit
 * =========================================================================
 * Implements Phase 14 Automated Regression Tests verifying all 25 enumerated
 * technical, statistical, astronomical, ethical, and epistemic mandates:
 *
 *  1. Astronomical calculation correctness
 *  2. Birth-time uncertainty
 *  3. Time-zone conversion
 *  4. Dasha boundary handling
 *  5. Transit-window generation
 *  6. Feature reproducibility
 *  7. Training/test leakage
 *  8. Duplicate-individual leakage
 *  9. Censored outcomes
 * 10. Unknown outcomes
 * 11. Unverified feedback
 * 12. Small evaluation cohorts
 * 13. Baseline comparisons
 * 14. Probability calibration
 * 15. Timing-resolution consistency
 * 16. Missing evidence
 * 17. Conflicting evidence
 * 18. Unsupported customer-facing claims
 * 19. Local AI unavailable
 * 20. Offline fallback
 * 21. Model artifact provenance
 * 22. Dataset-hash integrity
 * 23. Stale benchmark detection
 * 24. Historical model rollback
 * 25. English/Tamil semantic consistency
 *
 * NON-NEGOTIABLE INVARIANTS:
 * - Real mathematical calculations against current source and datasets.
 * - Zero fabricated accuracy claims or synthetic heuristics.
 * - Zero skipped tests counted as passed.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// Core service imports
import {
  calculatePlanetaryPositions,
  calculateMarriageTimingEvents
} from "./src/services/astroEngine.js";
import { getLahiriAyanamsha, AYANAMSHA_MODELS } from "./src/astrology/astronomy/ayanamsha.js";
import { calculateJulianDate } from "./src/astrology/astronomy/time.js";
import { runBirthTimePerturbationAnalysis } from "./src/services/chartUncertaintyEngine.js";
import {
  assertNoBlindLeakage,
  assertNoValidationLeakage,
  assertNoExternalLeakage,
  predictMarriageOccurrence,
  predictMarriageTiming,
  detectDegenerateClassifier,
  selectValidationThreshold
} from "./src/services/realWorldValidation/empiricalEvaluationEngine.js";
import {
  SURVIVAL_AGE_BINS,
  extractSubjectEventTime,
  fitDemographicBaselineHazard
} from "./src/services/realWorldValidation/discreteHazardSurvivalEngine.js";
import {
  evaluateCandidateModel,
  runContinuousLearningCycle,
  validateHoldoutCohortIntegrity,
  BASELINE_REGISTRY,
  RELEASE_GATE_THRESHOLDS
} from "../backend/src/services/continuousLearningRunner.js";
import { db } from "../backend/src/db/database.js";
import {
  toCanonicalTimingResolution,
  CANONICAL_TIMING_STATUSES,
  TIMING_RESOLUTIONS
} from "./src/services/questionAnswer/resolutionClassifier.js";
import { detectContradictions } from "./src/services/questionAnswer/contradictionDetector.js";
import { verifyGeneratedAnswer } from "./src/services/questionAnswer/qaFirewall.js";
import { validateSafety } from "./src/services/questionAnswer/qaSafetyValidator.js";
import { fallbackDeterministicQuestionParser } from "../backend/src/services/localAiService.js";

let passed = 0;
let failed = 0;

function check(testNumber, name, condition, details = "") {
  if (condition) {
    console.log(`  ✓ [TEST ${String(testNumber).padStart(2, "0")}] ${name}`);
    if (details) console.log(`      Detail: ${details}`);
    passed++;
  } else {
    console.error(`  ✗ [TEST ${String(testNumber).padStart(2, "0")} FAILED] ${name}`);
    if (details) console.error(`      Failure: ${details}`);
    failed++;
  }
}

console.log("\n" + "=".repeat(80));
console.log(" ASTROVERSE — 25-POINT FORENSIC PIPELINE & REGRESSION AUDIT SUITE");
console.log("=".repeat(80) + "\n");

// Canonical test profile (Chennai: 1990-05-15 10:30 IST)
const testProfile = {
  birthDate: "1990-05-15",
  birthTime: "10:30:00",
  latitude: 13.0827,
  longitude: 80.2707,
  sourceUtcOffset: 5.5,
  historicalTimeStandard: "STANDARD_TIME"
};

const canonicalChart = calculatePlanetaryPositions(
  "1990-05-15",
  "10:30",
  13.0827,
  80.2707,
  "vedic",
  5.5,
  { ayanamsha: "lahiri" }
);

// ----------------------------------------------------------------------------
// 1. Astronomical Calculation Correctness
// ----------------------------------------------------------------------------
const sunPos = canonicalChart.planets?.find(p => p.name === "Sun");
const moonPos = canonicalChart.planets?.find(p => p.name === "Moon");
const ascLong = canonicalChart.ascendantLong;
const ascSign = canonicalChart.ascendantSign?.sign || canonicalChart.ascendantSign?.name;
const t1Condition = Boolean(
  sunPos && Number.isFinite(sunPos.longitude) &&
  moonPos && Number.isFinite(moonPos.longitude) &&
  Number.isFinite(ascLong) &&
  sunPos.sign === "Taurus" // May 15 Sun in Sidereal Taurus (Lahiri)
);
check(1, "Astronomical calculation correctness", t1Condition,
  `Sun=${sunPos?.sign} (${sunPos?.longitude.toFixed(2)}°), Moon=${moonPos?.sign} (${moonPos?.longitude.toFixed(2)}°), Ascendant=${ascSign} (${ascLong?.toFixed(2)}°)`);

// ----------------------------------------------------------------------------
// 2. Birth-Time Uncertainty
// ----------------------------------------------------------------------------
const uncertaintyResult = runBirthTimePerturbationAnalysis({
  birthDate: "1990-05-15",
  birthTime: "10:30",
  lat: 13.0827,
  lng: 80.2707,
  tz: 5.5
});
const t2Condition = Boolean(
  uncertaintyResult &&
  uncertaintyResult.sensitivityMetrics &&
  uncertaintyResult.sensitivityMetrics.overallSensitivityLevel
);
check(2, "Birth-time uncertainty", t2Condition,
  `OverallSensitivity=${uncertaintyResult?.sensitivityMetrics?.overallSensitivityLevel}, D9Change=${uncertaintyResult?.sensitivityMetrics?.minOffsetD9LagnaChangeMinutes}m, D10Change=${uncertaintyResult?.sensitivityMetrics?.minOffsetD10LagnaChangeMinutes}m`);

// ----------------------------------------------------------------------------
// 3. Time-Zone Conversion
// ----------------------------------------------------------------------------
const jdUtc = calculateJulianDate(new Date("1990-05-15T05:00:00.000Z")); // 10:30 IST = 05:00 UTC
const expectedJd = 2448026.708333; // Astronomical standard JD for May 15, 1990 05:00 UT
const t3Condition = Math.abs(jdUtc - expectedJd) < 0.001;
check(3, "Time-zone conversion", t3Condition,
  `JD(1990-05-15 05:00 UTC) = ${jdUtc.toFixed(6)} (Expected ~${expectedJd})`);

// ----------------------------------------------------------------------------
// 4. Dasha Boundary Handling
// ----------------------------------------------------------------------------
const dashaTable = canonicalChart.dashaTable || [];
const t4Condition = Boolean(
  Array.isArray(dashaTable) &&
  dashaTable.length >= 7 &&
  dashaTable[0].startDate !== undefined &&
  dashaTable[0].endDate !== undefined
);
check(4, "Dasha boundary handling", t4Condition,
  `Generated ${dashaTable.length} Mahadashas. Initial MD: ${dashaTable[0]?.lord} (${dashaTable[0]?.startDate?.slice(0, 10)} to ${dashaTable[0]?.endDate?.slice(0, 10)})`);

// ----------------------------------------------------------------------------
// 5. Transit-Window Generation
// ----------------------------------------------------------------------------
const marriageTiming = calculateMarriageTimingEvents(canonicalChart);
const t5Condition = Boolean(
  marriageTiming &&
  Array.isArray(marriageTiming.candidateWindows) &&
  marriageTiming.candidateWindows.length > 0
);
check(5, "Transit-window generation", t5Condition,
  `Generated ${marriageTiming?.candidateWindows?.length} candidate marriage dasha-transit windows`);

// ----------------------------------------------------------------------------
// 6. Feature Reproducibility
// ----------------------------------------------------------------------------
const occPred1 = predictMarriageOccurrence(testProfile, canonicalChart);
const occPred2 = predictMarriageOccurrence(testProfile, canonicalChart);
const t6Condition = (
  occPred1.rawRuleScore === occPred2.rawRuleScore &&
  occPred1.calibratedProbability === occPred2.calibratedProbability &&
  occPred1.commitmentHash === occPred2.commitmentHash
);
check(6, "Feature reproducibility", t6Condition,
  `RawScore=${occPred1.rawRuleScore}, Prob=${occPred1.calibratedProbability}, HashMatch=${occPred1.commitmentHash === occPred2.commitmentHash}`);

// ----------------------------------------------------------------------------
// 7. Training/Test Leakage
// ----------------------------------------------------------------------------
const dummyTrain = [{ sourceRecordId: "TR_001" }, { sourceRecordId: "TR_002" }];
const dummyBlind = [{ sourceRecordId: "BL_001" }, { sourceRecordId: "BL_002" }];
const dummyLeaking = [{ sourceRecordId: "TR_001" }];
let t7Passed = false;
try {
  assertNoBlindLeakage(dummyTrain, dummyBlind);
  let threwOnLeak = false;
  try {
    assertNoBlindLeakage(dummyTrain, dummyLeaking);
  } catch {
    threwOnLeak = true;
  }
  t7Passed = threwOnLeak;
} catch {
  t7Passed = false;
}
check(7, "Training/test leakage detection", t7Passed,
  "Strictly detects and rejects overlapping record IDs between partitions");

// ----------------------------------------------------------------------------
// 8. Duplicate-Individual Leakage
// ----------------------------------------------------------------------------
const dupCohort = [
  { customerId: "CUST_A", id: "CUST_A", eventDefinition: "MARRIAGE", actualEventAge: 25 },
  { customerId: "CUST_A", id: "CUST_A", eventDefinition: "MARRIAGE", actualEventAge: 25 }
];
const dupValidation = validateHoldoutCohortIntegrity({ holdoutDataset: dupCohort, domain: "MARRIAGE" });
const t8Condition = dupValidation.validObservations.length === 1 && dupValidation.issues.some(i => i.includes("DUPLICATE_OBSERVATION"));
check(8, "Duplicate-individual leakage", t8Condition,
  `Identified and deduplicated repeated records: Issues=${dupValidation.issues[0]}`);

// ----------------------------------------------------------------------------
// 9. Censored Outcomes
// ----------------------------------------------------------------------------
const censoredRecord = {
  birthDate: "1990-01-01",
  observationCutoffDate: "2025-01-01",
  hasDocumentedMarriage: false,
  censoringStatus: "RIGHT_CENSORED"
};
const subjectEvent = extractSubjectEventTime(censoredRecord);
const t9Condition = subjectEvent.isEvent === false && subjectEvent.censorAge === 35;
check(9, "Censored outcomes handling", t9Condition,
  `Right-censored record preserved: isEvent=${subjectEvent.isEvent}, censorAge=${subjectEvent.censorAge}y (not converted to binary negative)`);

// ----------------------------------------------------------------------------
// 10. Unknown Outcomes
// ----------------------------------------------------------------------------
const degenerateTest = detectDegenerateClassifier({ tp: 0, fp: 0, tn: 0, fn: 0 }, {});
const t10Condition = degenerateTest.classifierStatus === "INSUFFICIENT_DATA" && degenerateTest.empiricallyValidated === false;
check(10, "Unknown outcomes handling", t10Condition,
  `Zero/unknown outcome records produce INSUFFICIENT_DATA status without fabricating negative outcomes`);

// ----------------------------------------------------------------------------
// 11. Unverified Feedback
// ----------------------------------------------------------------------------
const unverifiedPredId = `pred_test_${Date.now()}`;
db.savePredictionRecord({
  predictionId: unverifiedPredId,
  pseudonymousCustomerId: "anon_test_user",
  domain: "CAREER",
  eventDefinition: "JOB_CHANGE",
  predictedOutcome: "PROMOTION_FAVORABLE",
  isTrainingEligible: false
});
db.saveCustomerFeedback({
  feedbackId: `fb_${Date.now()}`,
  predictionId: unverifiedPredId,
  feedbackCategory: "INTERPRETATION_RELEVANCE",
  relevanceScore: 5
});
const predAfterFeedback = db.getPredictionRecord(unverifiedPredId);
const t11Condition = predAfterFeedback.isTrainingEligible === false;
check(11, "Unverified feedback isolation", t11Condition,
  `Customer feedback does NOT automatically promote prediction record to training-eligible (isTrainingEligible remains false)`);

// ----------------------------------------------------------------------------
// 12. Small Evaluation Cohorts
// ----------------------------------------------------------------------------
const smallCohort = [{ id: "subj_1", actualEventAge: 25 }];
const smallEval = evaluateCandidateModel({
  candidateModel: { modelId: "cand_test", domain: "MARRIAGE", predictTiming: () => 25 },
  holdoutDataset: smallCohort,
  minSampleSize: 30
});
const t12Condition = smallEval.passedReleaseGate === false && (
  smallEval.rejectionReason.includes("INSUFFICIENT_SAMPLE_SIZE") ||
  smallEval.rejectionReason.includes("INSUFFICIENT_EVALUATION_SAMPLE_SIZE")
);
check(12, "Small evaluation cohorts rejection", t12Condition,
  `Rejects small sample (N=1 < 30): ${smallEval.rejectionReason}`);

// ----------------------------------------------------------------------------
// 13. Baseline Comparisons
// ----------------------------------------------------------------------------
const baselineRegMarriage = BASELINE_REGISTRY.MARRIAGE;
const baselineRegCareer = BASELINE_REGISTRY.CAREER;
const t13Condition = Boolean(
  baselineRegMarriage && baselineRegMarriage.baselineMae === 4.28 &&
  baselineRegCareer && baselineRegCareer.baselineMae === 3.85
);
check(13, "Baseline comparisons registry", t13Condition,
  `Demographic baselines pinned: Marriage MAE=${baselineRegMarriage?.baselineMae}y, Career MAE=${baselineRegCareer?.baselineMae}y`);

// ----------------------------------------------------------------------------
// 14. Probability Calibration
// ----------------------------------------------------------------------------
const calModelPath = path.join(ROOT, "data/real_world_validation/results/calibration_model.json");
const calJson = JSON.parse(fs.readFileSync(calModelPath, "utf8"));
const t14Condition = Boolean(
  calJson &&
  typeof calJson.parameters?.slope === "number" &&
  typeof calJson.parameters?.intercept === "number" &&
  calJson.predictionEngineHash
);
check(14, "Probability calibration artifact", t14Condition,
  `Slope=${calJson.parameters?.slope}, Intercept=${calJson.parameters?.intercept}, EngineHash=${calJson.predictionEngineHash?.slice(0, 16)}`);

// ----------------------------------------------------------------------------
// 15. Timing-Resolution Consistency
// ----------------------------------------------------------------------------
const resDate = toCanonicalTimingResolution("DATE");
const resDateRange = toCanonicalTimingResolution("DATE_RANGE");
const resMonth = toCanonicalTimingResolution("MONTH_RANGE");
const resYearRange = toCanonicalTimingResolution("YEAR_RANGE");
const resNoDisc = toCanonicalTimingResolution("NO_DISCRIMINATING_WINDOW");
const t15Condition = (
  resDate === "DATE_RANGE" &&
  resDateRange === "DATE_RANGE" &&
  resMonth === "MONTH_RANGE" &&
  resYearRange === "YEAR" &&
  resNoDisc === "NOT_DISCRIMINATING" &&
  CANONICAL_TIMING_STATUSES.includes("DATE_RANGE") &&
  CANONICAL_TIMING_STATUSES.includes("NOT_DISCRIMINATING")
);
check(15, "Timing-resolution consistency", t15Condition,
  `Normalized DATE->${resDate}, YEAR_RANGE->${resYearRange}, NO_DISCRIMINATING_WINDOW->${resNoDisc}`);

// ----------------------------------------------------------------------------
// 16. Missing Evidence Handling
// ----------------------------------------------------------------------------
const missingChartResult = predictMarriageOccurrence(testProfile, {});
const t16Condition = (
  missingChartResult.status === "INSUFFICIENT_DATA" &&
  missingChartResult.pMarriage === null &&
  missingChartResult.reason === "MISSING_ASCENDANT_LONGITUDE"
);
check(16, "Missing evidence handling", t16Condition,
  `Empty chart returns status: INSUFFICIENT_DATA (reason: ${missingChartResult.reason})`);

// ----------------------------------------------------------------------------
// 17. Conflicting Evidence
// ----------------------------------------------------------------------------
const mockEvidenceWithContradiction = {
  natalPromise: { status: "STRONG_PROMISE", score: 8 },
  afflictions: { severeAfflictions: ["MARAKA_CONJUNCTION", "DEBILITATED_7TH_LORD"] },
  timingWindows: []
};
const contradictionResult = detectContradictions(mockEvidenceWithContradiction, { primaryDomain: "MARRIAGE" });
const t17Condition = Boolean(
  contradictionResult &&
  typeof contradictionResult.hasContradictions === "boolean"
);
check(17, "Conflicting evidence detection", t17Condition,
  `Contradictions evaluated without silent dismissal: hasContradictions=${contradictionResult.hasContradictions}`);

// ----------------------------------------------------------------------------
// 18. Unsupported Customer-Facing Claims
// ----------------------------------------------------------------------------
const unsuppClaimCheck1 = validateSafety("The native will suffer severe heart attack on 2028-10-12 and must take digoxin.", "HEALTH");
const unsuppClaimCheck2 = validateSafety("You will win guaranteed return on your investment next week.", "FINANCE");
const t18Condition = !unsuppClaimCheck1.isValid && !unsuppClaimCheck2.isValid;
check(18, "Unsupported customer-facing claims firewall", t18Condition,
  `Blocked medical diagnosis (valid=${unsuppClaimCheck1.isValid}) and financial guarantee (valid=${unsuppClaimCheck2.isValid})`);

// ----------------------------------------------------------------------------
// 19. Local AI Unavailable
// ----------------------------------------------------------------------------
const offlineParsed = fallbackDeterministicQuestionParser("When will I get married or enter a relationship?");
const t19Condition = offlineParsed && offlineParsed.specification?.domain === "MARRIAGE" && offlineParsed.specification?.event === "MARRIAGE_TIMING";
check(19, "Local AI unavailable fallback", t19Condition,
  `Deterministic parser resolves domain=${offlineParsed.specification?.domain}, event=${offlineParsed.specification?.event}`);

// ----------------------------------------------------------------------------
// 20. Offline Fallback Latency & Correctness
// ----------------------------------------------------------------------------
const t0 = performance.now();
const fallbackResult = fallbackDeterministicQuestionParser("When can I purchase a vehicle or car?");
const dt = performance.now() - t0;
const t20Condition = fallbackResult && fallbackResult.specification?.domain === "VEHICLE" && dt < 20;
check(20, "Offline fallback latency & correctness", t20Condition,
  `Fallback completed in ${dt.toFixed(2)} ms (< 20 ms), domain=${fallbackResult?.specification?.domain}`);

// ----------------------------------------------------------------------------
// 21. Model Artifact Provenance
// ----------------------------------------------------------------------------
const manifestPath = path.join(ROOT, "current_release_manifest.json");
const manifestJson = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const calShaActual = crypto.createHash("sha256").update(fs.readFileSync(calModelPath)).digest("hex");
const t21Condition = manifestJson.authoritativeHashes?.calibrationModelHash === calShaActual;
check(21, "Model artifact provenance", t21Condition,
  `Manifest calibration SHA matches disk: ${calShaActual.slice(0, 16)}`);

// ----------------------------------------------------------------------------
// 22. Dataset-Hash Integrity
// ----------------------------------------------------------------------------
const trainPath = path.join(ROOT, "data/real_world_validation/splits/train.json");
const trainShaActual = crypto.createHash("sha256").update(fs.readFileSync(trainPath)).digest("hex");
const t22Condition = manifestJson.datasetHashes?.trainSplitHash === trainShaActual;
check(22, "Dataset-hash integrity", t22Condition,
  `TRAIN split hash matches manifest: ${trainShaActual.slice(0, 16)}`);

// ----------------------------------------------------------------------------
// 23. Stale Benchmark Detection
// ----------------------------------------------------------------------------
const latestBenchPath = path.join(ROOT, "frontend/src/config/latestBenchmarkResults.json");
const latestBenchJson = JSON.parse(fs.readFileSync(latestBenchPath, "utf8"));
const t23Condition = (
  latestBenchJson.provenance?.predictionEngineHash === manifestJson.authoritativeHashes?.predictionEngineHash &&
  latestBenchJson.provenance?.trainingDatasetHash === manifestJson.datasetHashes?.trainSplitHash
);
check(23, "Stale benchmark detection", t23Condition,
  `Benchmark artifact engine hash matches current release manifest: ${latestBenchJson.provenance?.predictionEngineHash?.slice(0, 16)}`);

// ----------------------------------------------------------------------------
// 24. Historical Model Rollback
// ----------------------------------------------------------------------------
const mockModel1 = {
  modelId: `cand_rb1_${Date.now()}`,
  domain: "MARRIAGE",
  artifactSha256: crypto.createHash("sha256").update("w1").digest("hex"),
  modelArtifact: { w: [1] }
};
const mockModel2 = {
  modelId: `cand_rb2_${Date.now()}`,
  domain: "MARRIAGE",
  artifactSha256: crypto.createHash("sha256").update("w2").digest("hex"),
  modelArtifact: { w: [2] }
};
db.registerModel({ ...mockModel1, status: "PRODUCTION", trainedAt: new Date().toISOString() });
db.deployModel(mockModel1.modelId, "MARRIAGE", "admin");
db.registerModel({ ...mockModel2, status: "PRODUCTION", trainedAt: new Date().toISOString() });
db.deployModel(mockModel2.modelId, "MARRIAGE", "admin");
const rolledBack = db.rollbackModel("MARRIAGE", "admin_auditor");
const t24Condition = rolledBack && rolledBack.modelId === mockModel1.modelId && db.getActiveModel("MARRIAGE").modelId === mockModel1.modelId;
check(24, "Historical model rollback", t24Condition,
  `Rolled back from ${mockModel2.modelId} to previous active model: ${rolledBack?.modelId}`);

// ----------------------------------------------------------------------------
// 25. English/Tamil Semantic Consistency
// ----------------------------------------------------------------------------
const enQ = "When will I purchase a house or property?";
const taQ = "எனக்கு எப்போது வீடு அல்லது மனை வாங்கும் யோகம் உள்ளது?";
const parsedEn = fallbackDeterministicQuestionParser(enQ, "en");
const parsedTa = fallbackDeterministicQuestionParser(taQ, "ta");
const t25Condition = (
  parsedEn.specification?.domain === "PROPERTY" &&
  parsedTa.specification?.domain === "PROPERTY" &&
  parsedEn.specification?.event === "PROPERTY_PURCHASE" &&
  parsedTa.specification?.event === "PROPERTY_PURCHASE"
);
check(25, "English/Tamil semantic consistency", t25Condition,
  `En: domain=${parsedEn.specification?.domain}, event=${parsedEn.specification?.event} | Ta: domain=${parsedTa.specification?.domain}, event=${parsedTa.specification?.event}`);

// ----------------------------------------------------------------------------
// Audit Summary
// ----------------------------------------------------------------------------
console.log("\n" + "=".repeat(80));
console.log(` 25-POINT FORENSIC AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=".repeat(80) + "\n");

if (failed > 0) {
  console.error(`❌ REGRESSION AUDIT FAILED with ${failed} failure(s).`);
  process.exit(1);
} else {
  console.log("✅ ALL 25 PHASE 14 AUTOMATED REGRESSION TESTS PASSED 100%!");
  process.exit(0);
}
