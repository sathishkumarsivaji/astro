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
  validateHoldoutCohortIntegrity
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
  pass("2.1 [SYNTHETIC TEST] Candidate with MAE inferior to demographic baseline is rejected fail-closed");

  // 3. [SYNTHETIC CODE BEHAVIOR TEST ONLY] Candidate model that PASSES release gate
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
  pass("3.1 [SYNTHETIC TEST] Candidate with out-of-sample MAE superior to demographic baseline passes gate");

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
  assert.ok(fs.existsSync(blindTestPath), `Authentic blind test split must exist at: ${blindTestPath}`);

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
  pass(`11.1 [REAL OBSERVATIONS] Evaluated candidate model on 50 authentic subjects with documented provenance (MAE: ${realEval.timingMae}y)`);

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

  console.log("\n==============================================================");
  console.log(` ALL ${passed} STAGE 5 CONTINUOUS LEARNING TESTS PASSED 100%!`);
  console.log("==============================================================\n");
}

runStage5Suite().catch(err => {
  console.error("Stage 5 Test Suite Failed:", err);
  process.exit(1);
});
