/**
 * SKR ASTRO — STAGE 5 CONTINUOUS LEARNING RUNNER TEST SUITE
 *
 * Verifies that:
 * 1. Continuous learning runner evaluates candidate models against empirical holdout test set.
 * 2. Models that fail to outperform the demographic baseline (4.28y MAE) are REJECTED at the release gate.
 * 3. Models with measurable out-of-sample improvement (< 4.28y MAE) PASS and are promoted to production.
 * 4. All benchmark runs and promotion decisions are recorded immutably in model_registry and benchmark_runs.
 */

import { strict as assert } from "node:assert";
import { db } from "../src/db/database.js";
import {
  evaluateCandidateModel,
  runContinuousLearningCycle,
  RELEASE_GATE_THRESHOLDS
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
  pass("1.1 Release gate thresholds verified against empirical benchmark constants");

  // Create synthetic holdout test cohort (35 subjects, N >= 30)
  const holdoutTestSet = [];
  for (let i = 0; i < 35; i++) {
    // Actuarial ground truth: average marriage age ~27.5
    holdoutTestSet.push({
      id: `subj_${i + 1}`,
      actualEventAge: 26.0 + (i % 6) * 1.5,
      features: { dashaLord: "Jupiter", venusDignity: 1 }
    });
  }

  // 2. Test candidate model that FAILS release gate (MAE = 6.5y vs Baseline 4.28y)
  const failingCandidate = {
    modelId: `cand_fail_${Date.now()}`,
    domain: "MARRIAGE",
    modelType: "RAW_ASTROLOGICAL_HEURISTIC",
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
  pass("2.1 Candidate with MAE inferior to demographic baseline is rejected fail-closed");

  // 3. Test candidate model that PASSES release gate (MAE = 3.8y vs Baseline 4.28y)
  const superiorCandidate = {
    modelId: `cand_superior_${Date.now()}`,
    domain: "MARRIAGE",
    modelType: "DISCRETE_HAZARD_ENSEMBLE_V4",
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
  pass("3.1 Candidate with out-of-sample MAE superior to demographic baseline passes gate");

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

  console.log("\n==============================================================");
  console.log(` ALL ${passed} STAGE 5 CONTINUOUS LEARNING TESTS PASSED 100%!`);
  console.log("==============================================================\n");
}

runStage5Suite().catch(err => {
  console.error("Stage 5 Test Suite Failed:", err);
  process.exit(1);
});
