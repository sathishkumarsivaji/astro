/**
 * SKR ASTRO — STAGE 5 CONTINUOUS LEARNING RUNNER TEST SUITE
 * =========================================================
 * Verifies that:
 * 1. Continuous learning runner evaluates candidate models against holdout test set.
 * 2. Models that fail to outperform the domain baseline are REJECTED at the release gate.
 * 3. Synthetic tests are explicitly labeled as [SYNTHETIC CODE BEHAVIOR TEST ONLY].
 * 4. Models bind to actual serialized model artifacts and SHA-256 hashes.
 * 5. End-to-end evaluation using real observations with documented provenance is executed.
 * 6. All benchmark runs and promotion decisions are recorded immutably in model_registry and benchmark_runs.
 */

import { strict as assert } from "node:assert";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

import { db } from "../src/db/database.js";
import {
  evaluateCandidateModel,
  runContinuousLearningCycle,
  RELEASE_GATE_THRESHOLDS,
  BASELINE_REGISTRY,
  getReleaseGateThresholds,
  validateHoldoutCohortIntegrity,
  computeDetailedTimingMetrics,
  computeDetailedOccurrenceMetrics,
  assembleOutcomeTrainingCohort,
  fitCandidateRegressionModel,
  calibrateCandidateModel,
  performFeatureAblationStudy,
  executeOutcomeDrivenLearningPipeline
} from "../src/services/continuousLearningRunner.js";

async function runStage5Suite() {
  console.log("==============================================================");
  console.log(" SKR ASTRO STAGE 5: CONTINUOUS LEARNING & RELEASE GATE SUITE");
  console.log("==============================================================");

  let passed = 0;
  function pass(testName) {
    passed++;
    console.log(`✓ [PASS] ${testName}`);
  }

  // 1. Thresholds verification
  assert.strictEqual(RELEASE_GATE_THRESHOLDS.DEMOGRAPHIC_BASELINE_MAE, 4.28);
  assert.strictEqual(RELEASE_GATE_THRESHOLDS.MIN_TEST_SAMPLE_SIZE, 30);
  const marriageThresholds = getReleaseGateThresholds("MARRIAGE");
  assert.strictEqual(marriageThresholds.baselineMae, 4.28);
  pass("1.1 Release gate thresholds verified against empirical benchmark constants");

  // Create synthetic holdout test cohort (35 subjects, N >= 30) with affirmative consent
  const holdoutTestSet = [];
  for (let i = 0; i < 35; i++) {
    const id = `subj_${i + 1}`;
    db.setTrainingConsent(id, true);
    // Actuarial ground truth: average marriage age ~27.5
    holdoutTestSet.push({
      id,
      actualEventAge: 26.0 + (i % 6) * 1.5,
      consentGranted: true,
      features: { dashaLord: "Jupiter", venusDignity: 1 }
    });
  }

  // 2. [SYNTHETIC CODE BEHAVIOR TEST ONLY] Candidate model that FAILS release gate
  const failingArtifact = { weights: [0.95, 0.82], modelArchitecture: "LINEAR_TIMING_HEURISTIC" };
  const failingCandidate = {
    modelId: `cand_fail_${Date.now()}`,
    domain: "MARRIAGE",
    modelType: "RAW_ASTROLOGICAL_HEURISTIC",
    modelArtifact: failingArtifact,
    artifactSha256: crypto.createHash("sha256").update(JSON.stringify(failingArtifact)).digest("hex"),
    hyperparameters: { ruleConvergenceThreshold: 0.5 },
    predictTiming: (features) => 34.0 // High error relative to ~28y average
  };

  const failEval = evaluateCandidateModel({
    candidateModel: failingCandidate,
    holdoutDataset: holdoutTestSet,
    demographicBaselineMae: RELEASE_GATE_THRESHOLDS.DEMOGRAPHIC_BASELINE_MAE
  });

  assert.strictEqual(failEval.passedReleaseGate, false, "Failing candidate must be rejected");
  assert.strictEqual(failEval.baselineComparisonStatus, "INFERIOR_OR_EQUAL_TO_DEMOGRAPHIC_BASELINE");
  assert.ok(failEval.rejectionReason.includes("RELEASE_GATE_REJECTED"), "Contains rejection reason");
  assert.ok(failEval.timingMae > RELEASE_GATE_THRESHOLDS.DEMOGRAPHIC_BASELINE_MAE, "Candidate MAE is greater than baseline");
  pass("2.1 [SOFTWARE TEST: RELEASE GATE] Candidate with MAE inferior to demographic baseline is rejected fail-closed");

  // 3. [SOFTWARE TEST] Candidate model that PASSES release gate
  const superiorArtifact = { weights: [0.05, 0.12], numBins: 16, modelArchitecture: "DISCRETE_HAZARD" };
  const superiorCandidate = {
    modelId: `cand_superior_${Date.now()}`,
    domain: "MARRIAGE",
    modelType: "DISCRETE_HAZARD_ENSEMBLE_V4",
    modelArtifact: superiorArtifact,
    artifactSha256: crypto.createHash("sha256").update(JSON.stringify(superiorArtifact)).digest("hex"),
    hyperparameters: { l2Lambda: 0.05, numBins: 16 },
    predictTiming: (features) => 28.5 // Low error relative to ~28.5y average
  };

  const passEval = evaluateCandidateModel({
    candidateModel: superiorCandidate,
    holdoutDataset: holdoutTestSet,
    demographicBaselineMae: RELEASE_GATE_THRESHOLDS.DEMOGRAPHIC_BASELINE_MAE
  });

  assert.strictEqual(passEval.passedReleaseGate, true, "Superior candidate must pass gate");
  assert.strictEqual(passEval.baselineComparisonStatus, "OUTPERFORMS_DEMOGRAPHIC_BASELINE");
  assert.strictEqual(passEval.rejectionReason, null, "Zero rejection reason on pass");
  assert.ok(passEval.timingMae < RELEASE_GATE_THRESHOLDS.DEMOGRAPHIC_BASELINE_MAE, "Candidate MAE is less than baseline");
  pass("3.1 [SOFTWARE TEST: RELEASE GATE] Candidate with out-of-sample MAE superior to demographic baseline passes gate");

  // 4. Test automated continuous learning promotion lifecycle
  const cycleResult = await runContinuousLearningCycle({
    candidateModel: superiorCandidate,
    holdoutTestSet,
    domain: "MARRIAGE"
  });

  assert.strictEqual(cycleResult.status, "PROMOTED_TO_PRODUCTION", "Model promoted upon gate pass");
  assert.ok(cycleResult.deployment, "Deployment object created");
  assert.strictEqual(cycleResult.deployment.modelId, superiorCandidate.modelId);

  // Check active model in database
  const activeModel = db.getActiveModel("MARRIAGE");
  assert.ok(activeModel, "Active model returned for MARRIAGE");
  assert.strictEqual(activeModel.modelId, superiorCandidate.modelId, "Newly promoted model is active in database");
  assert.strictEqual(activeModel.status, "PRODUCTION", "Model marked PRODUCTION in database");
  pass("4.1 Continuous learning cycle registers, verifies, and promotes candidate to active production");

  // 5. Test rejection prevents production deployment
  const failingCycleResult = await runContinuousLearningCycle({
    candidateModel: failingCandidate,
    holdoutTestSet,
    domain: "MARRIAGE"
  });

  assert.strictEqual(failingCycleResult.status, "REJECTED_AT_RELEASE_GATE");
  assert.strictEqual(failingCycleResult.deployment, null, "Zero deployment created for rejected candidate");

  // Ensure active model remained the previously promoted superior model
  const activeAfterReject = db.getActiveModel("MARRIAGE");
  assert.strictEqual(activeAfterReject.modelId, superiorCandidate.modelId, "Active model unchanged after rejected candidate");
  pass("5.1 Rejected candidate does not overwrite active production model");

  // 6. Versioned baseline registry test
  const careerArtifact = { weights: [0.1], domain: "CAREER" };
  const careerBaseline = evaluateCandidateModel({
    candidateModel: {
      modelId: "test_career_cand",
      domain: "CAREER",
      modelArtifact: careerArtifact,
      artifactSha256: crypto.createHash("sha256").update(JSON.stringify(careerArtifact)).digest("hex"),
      predictTiming: () => 25
    },
    holdoutDataset: holdoutTestSet
  });
  assert.strictEqual(careerBaseline.demographicBaselineMae, 3.85, "Uses domain-specific 3.85y baseline for CAREER");
  pass("6.1 Baseline registry enforces domain-specific baselines (CAREER: 3.85y)");

  // 7. Insufficient unique customers test (e.g. 1 user repeated 35 times)
  const nonUniqueHoldout = [];
  for (let i = 0; i < 35; i++) {
    nonUniqueHoldout.push({
      id: "single_customer_repeated",
      actualEventAge: 27.0,
      consentGranted: true,
      features: {}
    });
  }
  const nonUniqueEval = evaluateCandidateModel({
    candidateModel: superiorCandidate,
    holdoutDataset: nonUniqueHoldout
  });
  assert.strictEqual(nonUniqueEval.passedReleaseGate, false);
  assert.ok(nonUniqueEval.rejectionReason.includes("INSUFFICIENT_UNIQUE_CUSTOMERS"));
  pass("7.1 Rejects evaluation with insufficient unique customers fail-closed");

  // 8. Customer-level leakage detection
  const leakingTrainingIds = new Set(["subj_1", "subj_2"]);
  const leakageEval = evaluateCandidateModel({
    candidateModel: superiorCandidate,
    holdoutDataset: holdoutTestSet,
    trainingCustomerIds: leakingTrainingIds
  });
  assert.strictEqual(leakageEval.passedReleaseGate, false);
  assert.ok(leakageEval.rejectionReason.includes("CUSTOMER_LEAKAGE_DETECTED"));
  pass("8.1 Rejects evaluation when customer-level leakage is detected");

  // 9. Model artifact integrity verification (corrupted artifact hash)
  const corruptedCandidate = {
    modelId: `cand_corrupt_${Date.now()}`,
    domain: "MARRIAGE",
    artifactSha256: "intentional_corrupted_hash_00000000000000000000000000000000",
    modelArtifact: { weights: [0.1, 0.2, 0.3] },
    predictTiming: () => 27.5
  };
  const corruptCycle = await runContinuousLearningCycle({
    candidateModel: corruptedCandidate,
    holdoutTestSet,
    domain: "MARRIAGE"
  });
  assert.strictEqual(corruptCycle.status, "REJECTED_AT_RELEASE_GATE");
  assert.ok(corruptCycle.rejectionReason.includes("ARTIFACT_INTEGRITY_FAILED") || corruptCycle.rejectionReason.includes("ARTIFACT_HASH_MISMATCH"));
  pass("9.1 Rejects candidate with corrupted/mismatched model artifact hash");

  // 10. Automated Rollback to previous deployment
  const secondaryArtifact = { weights: [0.4, 0.5] };
  const secondaryCandidate = {
    modelId: `cand_secondary_${Date.now()}`,
    domain: "MARRIAGE",
    modelArtifact: secondaryArtifact,
    artifactSha256: crypto.createHash("sha256").update(JSON.stringify(secondaryArtifact)).digest("hex"),
    predictTiming: () => 27.8
  };
  const secondCycle = await runContinuousLearningCycle({
    candidateModel: secondaryCandidate,
    holdoutTestSet,
    domain: "MARRIAGE"
  });
  assert.strictEqual(secondCycle.status, "PROMOTED_TO_PRODUCTION");
  assert.strictEqual(db.getActiveModel("MARRIAGE").modelId, secondaryCandidate.modelId);

  // Now execute rollback
  const rollbackResult = db.rollbackModel("MARRIAGE", "admin_auditor");
  assert.ok(rollbackResult.isActive);
  assert.strictEqual(rollbackResult.modelId, superiorCandidate.modelId, "Rollback restores previous active production model");
  assert.strictEqual(db.getActiveModel("MARRIAGE").modelId, superiorCandidate.modelId);
  pass("10.1 Successfully executes instant model rollback to previous production deployment");

  // 11. End-to-End Real Observation Experiment with Documented Provenance (Section 8)
  const blindTestPath = path.join(ROOT, "data/real_world_validation/splits/blind_test.json");
  const splitManifestPath = path.join(ROOT, "data/real_world_validation/splits/split_manifest.json");
  assert.ok(fs.existsSync(blindTestPath), `Authentic blind test split must exist at: ${blindTestPath}`);
  assert.ok(fs.existsSync(splitManifestPath), `Split manifest must exist at: ${splitManifestPath}`);

  // Cryptographic manifest binding: Verify blind_test.json SHA-256 matches split_manifest.json
  const splitManifest = JSON.parse(fs.readFileSync(splitManifestPath, "utf8"));
  const expectedBlindHash = splitManifest.splits?.BLIND_TEST?.sha256;
  assert.ok(expectedBlindHash, "split_manifest.json must specify BLIND_TEST sha256");

  const actualBlindHash = crypto.createHash("sha256").update(fs.readFileSync(blindTestPath)).digest("hex");
  assert.strictEqual(actualBlindHash, expectedBlindHash, "Authentic blind test split SHA-256 must match split_manifest.json exactly");
  pass("11.1 [MANIFEST BINDING] blind_test.json cryptographic hash matches split_manifest.json exactly");

  const rawData = JSON.parse(fs.readFileSync(blindTestPath, "utf8"));
  const realCohort = [];
  const exclusionReasons = { NO_MARRIAGE: 0, MISSING_DATE: 0, OUT_OF_RANGE: 0 };

  for (const item of rawData) {
    if (item.hasDocumentedMarriage !== true || !item.firstDocumentedMarriage) {
      exclusionReasons.NO_MARRIAGE++;
      continue;
    }
    const m = item.firstDocumentedMarriage;
    const bYear = item.birthYear || (item.birthDate ? parseInt(item.birthDate.slice(0, 4), 10) : null);
    const mYear = m.marriageYear || (m.marriageDate ? parseInt(m.marriageDate.slice(0, 4), 10) : null);
    if (!bYear || !mYear || mYear < bYear) {
      exclusionReasons.MISSING_DATE++;
      continue;
    }

    let actualMarriageAge = null;
    if (item.birthDate && m.marriageDate && /^\d{4}-\d{2}-\d{2}/.test(item.birthDate) && /^\d{4}-\d{2}-\d{2}/.test(m.marriageDate)) {
      const bTime = new Date(item.birthDate).getTime();
      const mTime = new Date(m.marriageDate).getTime();
      if (!isNaN(bTime) && !isNaN(mTime) && mTime > bTime) {
        actualMarriageAge = Number(((mTime - bTime) / (365.2425 * 86400000)).toFixed(2));
      }
    }
    if (actualMarriageAge == null) {
      actualMarriageAge = mYear - bYear;
    }
    if (actualMarriageAge < 16 || actualMarriageAge > 65) {
      exclusionReasons.OUT_OF_RANGE++;
      continue;
    }

    realCohort.push({
      id: item.sourceRecordId || item.id,
      actualEventAge: actualMarriageAge,
      consentGranted: true,
      isExternalBenchmark: true,
      sourceDataset: item.sourceDataset || "VedAstro 15000-Famous-People",
      features: {
        birthYear: bYear,
        gender: item.gender,
        latitude: item.latitude,
        longitude: item.longitude
      }
    });

    if (realCohort.length >= 50) break;
  }

  assert.strictEqual(realCohort.length, 50, "Extracted exactly 50 authentic observations from blind test");
  assert.ok(realCohort.every(r => typeof r.actualEventAge === "number" && r.actualEventAge >= 16 && r.actualEventAge <= 65), "All authentic marriage ages are strictly valid and non-synthetic");

  // Load authentic fitted parameters from v3 hazard pipeline checkpoint
  const checkpointPath = path.join(ROOT, "data/real_world_validation/cache/v3_hazard_pipeline_checkpoint.json");
  assert.ok(fs.existsSync(checkpointPath), "v3 hazard pipeline checkpoint must exist");
  const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
  const baselineTable = checkpoint.discreteHazardModelV3.trainFit.baselineTable;
  const betaAstro = checkpoint.discreteHazardModelV3.trainFit.coefficients.betaAstro; // 0.0912

  const realCandidateArtifact = {
    modelType: "COMBINED_DISCRETE_HAZARD",
    baselineTableLength: baselineTable.length,
    betaAstro,
    schema: "v3.0.0-audited"
  };
  const realCandidate = {
    modelId: `cand_real_eval_${Date.now()}`,
    domain: "MARRIAGE",
    modelArtifact: realCandidateArtifact,
    artifactSha256: crypto.createHash("sha256").update(JSON.stringify(realCandidateArtifact)).digest("hex"),
    predictTiming: (features) => {
      const featScore = (features && features.gender === "Female") ? 0.7 : 0.3;
      let surv = 1.0;
      const eventProbs = [];
      for (const bin of baselineTable) {
        const logit = bin.logit + betaAstro * (featScore - 0.5);
        const h = 1 / (1 + Math.exp(-logit));
        const pEvent = surv * h;
        eventProbs.push({ midpoint: bin.midpoint, pEvent });
        surv *= (1 - h);
      }
      const sumP = eventProbs.reduce((acc, b) => acc + b.pEvent, 0);
      if (sumP <= 1e-4) return 27.5;
      const wSum = eventProbs.reduce((acc, b) => acc + b.midpoint * b.pEvent, 0);
      return Number((wSum / sumP).toFixed(2));
    }
  };

  const realEval = evaluateCandidateModel({
    candidateModel: realCandidate,
    holdoutDataset: realCohort,
    demographicBaselineMae: RELEASE_GATE_THRESHOLDS.DEMOGRAPHIC_BASELINE_MAE
  });

  assert.ok(typeof realEval.timingMae === "number", "Calculates valid timing MAE on real observations");
  assert.strictEqual(realEval.sampleSize, 50);
  assert.ok(realEval.timingMae > 3.0 && realEval.timingMae < 6.0, `Real timing MAE must be in realistic actuarial range (got: ${realEval.timingMae})`);
  pass(`11.2 [REAL OBSERVATIONS] Evaluated candidate model on 50 authentic subjects with documented provenance (MAE: ${realEval.timingMae}y)`);

  // Detailed timing metrics calculation
  const timingEvals = realCohort.map(r => ({
    predictedAge: realCandidate.predictTiming(r.features),
    actualAge: r.actualEventAge,
    interval: { lower: realCandidate.predictTiming(r.features) - 3.0, upper: realCandidate.predictTiming(r.features) + 3.0 }
  }));
  const detailedTiming = computeDetailedTimingMetrics(timingEvals);
  assert.ok(typeof detailedTiming.mae === "number", "Calculates valid MAE");
  assert.ok(typeof detailedTiming.medianAbsoluteError === "number", "Calculates valid median absolute error");
  assert.ok(typeof detailedTiming.within1yPct === "number", "Calculates valid within-1y rate");
  assert.ok(typeof detailedTiming.within2yPct === "number", "Calculates valid within-2y rate");
  assert.ok(typeof detailedTiming.within3yPct === "number", "Calculates valid within-3y rate");
  assert.ok(typeof detailedTiming.forecastIntervalCoverage === "number", "Calculates interval coverage");
  assert.strictEqual(detailedTiming.meanIntervalWidth, 6.0, "Interval width matches 6.0 years");
  pass(`11.3 [TIMING METRICS] Detailed timing metrics evaluated: MAE=${detailedTiming.mae}y, MedAE=${detailedTiming.medianAbsoluteError}y, ±1y=${detailedTiming.within1yPct}%, ±2y=${detailedTiming.within2yPct}%, ±3y=${detailedTiming.within3yPct}%, IntervalCoverage=${detailedTiming.forecastIntervalCoverage}%`);

  // 11.4 Software Unit Test: Occurrence metric calculations on standard synthetic verification vector
  const probPairs = [
    { prob: 0.85, actual: 1 },
    { prob: 0.75, actual: 1 },
    { prob: 0.60, actual: 1 },
    { prob: 0.20, actual: 0 },
    { prob: 0.15, actual: 0 },
    { prob: 0.40, actual: 0 }
  ];
  const detailedOcc = computeDetailedOccurrenceMetrics(probPairs, 0.5);
  assert.ok(typeof detailedOcc.brierScore === "number", "Calculates valid Brier score");
  assert.ok(typeof detailedOcc.rocAuc === "number" && detailedOcc.rocAuc >= 0.5, "Calculates valid ROC-AUC");
  assert.ok(typeof detailedOcc.mcc === "number", "Calculates valid MCC");
  assert.strictEqual(detailedOcc.confusionMatrix.tp, 3);
  assert.strictEqual(detailedOcc.confusionMatrix.tn, 3);
  pass(`11.4 [SOFTWARE TEST: OCCURRENCE METRICS] Implementation verified on standard vector: Brier=${detailedOcc.brierScore}, ROC-AUC=${detailedOcc.rocAuc}, MCC=${detailedOcc.mcc}`);

  // 12. Authoritative Consent Fail-Closed Checks (Phase 3)
  const custWithoutDbConsent = [
    { id: "cust_unregistered_consent_1", isCustomerRecord: true, consentGranted: true, actualEventAge: 27.0, features: {} }
  ];
  const auditNoDb = validateHoldoutCohortIntegrity({ holdoutDataset: custWithoutDbConsent, requireAuthoritativeConsent: true });
  assert.strictEqual(auditNoDb.validObservations.length, 0);
  assert.ok(auditNoDb.issues.some(i => i.includes("CONSENT_NOT_CONFIRMED")));
  pass("12.1 Customer without authoritative DB consent record is rejected fail-closed");

  // Withdrawn consent
  db.setTrainingConsent("cust_withdrawn_1", false);
  const custWithdrawn = [
    { id: "cust_withdrawn_1", isCustomerRecord: true, consentGranted: true, actualEventAge: 27.0, features: {} }
  ];
  const auditWithdrawn = validateHoldoutCohortIntegrity({ holdoutDataset: custWithdrawn, requireAuthoritativeConsent: true });
  assert.strictEqual(auditWithdrawn.validObservations.length, 0);
  assert.ok(auditWithdrawn.issues.some(i => i.includes("CONSENT_REVOKED")));
  pass("12.2 Customer with withdrawn DB consent is excluded with CONSENT_REVOKED");

  // Deleted user
  const deletedUserId = `usr_deleted_${Date.now()}`;
  db.saveUser(deletedUserId, { userId: deletedUserId, isDeleted: true });
  db.setTrainingConsent(deletedUserId, true);
  const custDeleted = [
    { id: deletedUserId, isCustomerRecord: true, consentGranted: true, actualEventAge: 27.0, features: {} }
  ];
  const auditDeleted = validateHoldoutCohortIntegrity({ holdoutDataset: custDeleted, requireAuthoritativeConsent: true });
  assert.strictEqual(auditDeleted.validObservations.length, 0);
  assert.ok(auditDeleted.issues.some(i => i.includes("USER_DELETED")));
  pass("12.3 Deleted user is excluded with USER_DELETED");

  // 13. PHASE 2 — End-to-End Real Outcome-Driven Learning Integration Test
  console.log("\n--- Testing Phase 2 Outcome-Driven Learning Pipeline ---");
  const domain = "MARRIAGE";
  const numCohort = 35;
  const trainCustomerIds = [];

  for (let i = 0; i < numCohort; i++) {
    const custId = `cust_real_learn_${i + 1}_${Date.now()}`;
    trainCustomerIds.push(custId);

    // a. Authoritative training consent in DB
    db.setTrainingConsent(custId, true, "v2.0");

    // b. Immutable prediction record with feature snapshot
    const predId = `pred_learn_${i + 1}_${Date.now()}`;
    const dashaVal = 0.2 + (i % 5) * 0.15;
    const transitJup = (i % 3 === 0) ? 0.8 : 0.2;
    const transitSat = (i % 4 === 0) ? 0.7 : 0.1;
    const d9Val = 0.3 + (i % 4) * 0.2;

    const featureSnapshot = {
      DASHA_7TH_LORD: dashaVal,
      TRANSIT_JUPITER_7TH: transitJup,
      TRANSIT_SATURN_7TH: transitSat,
      D9_NAVAMSHA_SUPPORT: d9Val,
      VENUS_NATAL_PROMISE: 0.6,
      ASHTAKAVARGA_7TH_SAV: 30.0
    };

    db.savePredictionRecord({
      predictionId: predId,
      pseudonymousCustomerId: custId,
      canonicalEvent: domain,
      featureVectorSnapshot: featureSnapshot,
      birthDate: "1995-01-01",
      isTrainingEligible: true
    });

    // c. Actual observed outcome (ground truth: e.g. age 25.0 to 30.5)
    const actualAge = 25.0 + (i % 6) * 1.1;
    const outcomeId = `out_learn_${i + 1}_${Date.now()}`;
    db.saveObservedOutcome({
      outcomeId,
      predictionId: predId,
      customerId: custId,
      eventOccurred: true,
      actualEventAge: actualAge,
      isCensored: false,
      reportedDate: `202${Math.floor(actualAge - 20)}-06-15`
    });

    // d. Independent verification using recognized allowlist method + evidence reference
    db.saveOutcomeVerification({
      verificationId: `ver_learn_${i + 1}_${Date.now()}`,
      outcomeId,
      verificationMethod: "CIVIL_MARRIAGE_REGISTRATION_CERTIFICATE",
      verificationStatus: "INDEPENDENTLY_VERIFIED",
      verifiedBy: "GOVT_REGISTRY_OFFICE",
      evidenceReference: `CERT_REF_REG_${1000 + i}`,
      notes: "Legitimate certified government civil marriage registration"
    });
  }

  // Assemble training dataset from verified outcomes
  const assembled = assembleOutcomeTrainingCohort({ domain, minObservations: 30 });
  assert.strictEqual(assembled.isSufficient, true, "Assembled training cohort must be sufficient");
  assert.ok(assembled.sampleSize >= 30, "At least 30 verified observations assembled");
  assert.ok(typeof assembled.trainingDatasetHash === "string" && assembled.trainingDatasetHash.length === 64);
  pass("13.1 Successfully assembled versioned training dataset from verified customer outcomes");

  // Stale dataset snapshot protection: If customer withdraws consent, record is excluded
  const revokedCust = trainCustomerIds[0];
  db.setTrainingConsent(revokedCust, false);
  const reAssembled = assembleOutcomeTrainingCohort({ domain, minObservations: 20 });
  assert.ok(!reAssembled.records.some(r => r.customerId === revokedCust), "Withdrawn customer must be immediately purged from training cohort");
  assert.ok(reAssembled.exclusionLedger.some(e => e.customerId === revokedCust && e.reason === "CONSENT_REVOKED"), "Excluded record logged with CONSENT_REVOKED");
  pass("13.2 Stale snapshot protection: Withdrawn customer purged fail-closed from training cohort");

  // Restore consent for the test
  db.setTrainingConsent(revokedCust, true);

  // Actual candidate model fitting: fits analytical Ridge weights from features
  const candidate = fitCandidateRegressionModel({
    trainingCohort: assembled.records,
    domain,
    regularizationLambda: 0.05
  });
  assert.ok(candidate.modelId.startsWith("cand_fit_"), "Generated unique candidate model ID");
  assert.strictEqual(candidate.domain, "MARRIAGE");
  assert.ok(candidate.modelArtifact.coefficients.length >= 6, "Learned weights for all 6 registered features");
  assert.ok(typeof candidate.modelArtifact.intercept === "number", "Calculated analytical intercept");
  assert.ok(typeof candidate.modelArtifact.trainMae === "number", "Calculated training MAE");
  assert.ok(typeof candidate.artifactSha256 === "string" && candidate.artifactSha256.length === 64, "Generated SHA-256 artifact digest");
  assert.strictEqual(typeof candidate.predictTiming, "function", "Provides executable predictTiming function");
  pass("13.3 Candidate model fitted analytically from registered planetary features using Ridge regression");

  // Model Calibration on validation cohort
  const valCohort = holdoutTestSet.slice(0, 15);
  const calibrated = calibrateCandidateModel({ candidateModel: candidate, validationCohort: valCohort });
  assert.strictEqual(calibrated.isCalibrated, true, "Model successfully calibrated on validation cohort");
  assert.ok(calibrated.modelArtifact.calibrationParameters, "Calibration parameters attached to artifact");
  pass("13.4 Candidate model calibrated on validation split via affine adjustment");

  // Independent Evaluation & Release Gate Decision
  const pipelineResult = await executeOutcomeDrivenLearningPipeline({
    domain,
    trainingCohort: assembled.records,
    validationCohort: valCohort,
    holdoutTestSet,
    regularizationLambda: 0.05
  });
  assert.ok(["PROMOTED_TO_PRODUCTION", "REJECTED_AT_RELEASE_GATE"].includes(pipelineResult.pipelineStatus));
  assert.ok(typeof pipelineResult.evaluation.timingMae === "number", "Independent timing MAE evaluated");
  assert.ok(pipelineResult.ablation, "Feature ablation study executed");
  assert.strictEqual(pipelineResult.ablation.domain, "MARRIAGE");
  pass(`13.5 [SYNTHETIC SOFTWARE TEST] Complete outcome-driven learning pipeline mechanics verified: Status=${pipelineResult.pipelineStatus} (Synthetic Candidate MAE=${pipelineResult.evaluation.timingMae}y vs Baseline=${pipelineResult.ablation.demographicBaselineMae}y)`);

  console.log("\n==============================================================");
  console.log(` ALL ${passed} STAGE 5 CONTINUOUS LEARNING TESTS PASSED 100%!`);
  console.log("==============================================================\n");
}

runStage5Suite().catch(err => {
  console.error("Stage 5 Test Suite Failed:", err);
  process.exit(1);
});
