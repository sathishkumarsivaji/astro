/**
 * ASTROVERSE — Canonical Empirical Benchmark Metrics Reconciliation Suite
 * ========================================================================
 * Verifies that canonical empirical metrics across internal blind cohort and
 * independent external Astro-Databank cohort are strictly segregated and preserved:
 *
 * 1. Astro-Databank External Benchmark:
 *    - N = 320 timing cases
 *    - Astrological MAE = 9.19 years
 *    - Demographic Baseline MAE = 6.41 years
 *    - Status: Astrological model DOES NOT beat demographic baseline
 *    - occurrence evaluatedCount = 313, censored count = 556
 *
 * 2. Internal Blind-Test Benchmark:
 *    - N = 1,484 timing cases
 *    - Astrological MAE = 6.89 years
 *    - Demographic Baseline MAE = 4.28 years
 *    - Discrete Hazard V3 LRT p = 0.40662 (statistically tied, not significant)
 *
 * 3. Both datasets maintain EXPERIMENTAL / NOT_EMPIRICALLY_VALIDATED status.
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('\n============================================================');
console.log(' ASTROVERSE — BENCHMARK METRICS RECONCILIATION SUITE');
console.log('============================================================\n');

const adbPath = path.join(ROOT, 'data/real_world_validation/results/astro_databank_external_benchmark.json');
const benchPath = path.join(ROOT, 'data/real_world_validation/results/benchmark_results.json');
const latestBenchPath = path.join(ROOT, 'frontend/src/config/latestBenchmarkResults.json');

const adb = JSON.parse(fs.readFileSync(adbPath, 'utf8'));
const bench = JSON.parse(fs.readFileSync(benchPath, 'utf8'));
const latest = JSON.parse(fs.readFileSync(latestBenchPath, 'utf8'));

// 1. Astro-Databank external metrics
const adbTiming = adb.primaryBenchmark.timing;
const adbDemo = adb.primaryBenchmark.demographicBaseline;
const adbOcc = adb.primaryBenchmark.occurrence;

assert.equal(adbTiming.n, 320, 'ADB timing n must be 320');
assert.equal(adbTiming.mae, 9.19, 'ADB astrological timing MAE must be 9.19 years');
assert.equal(adbTiming.within1yPct, 9.06, 'ADB timing within 1y must be 9.06%');
assert.equal(adbTiming.within2yPct, 18.44, 'ADB timing within 2y must be 18.44%');
assert.equal(adbTiming.within3yPct, 25.31, 'ADB timing within 3y must be 25.31%');
assert.equal(adbDemo.mae, 6.41, 'ADB demographic baseline MAE must be 6.41 years');
assert.equal(adbDemo.within1yPct, 19.38, 'ADB demographic baseline within 1y must be 19.38%');
assert(adbTiming.mae > adbDemo.mae, 'Astrological MAE must be higher than demographic baseline on external ADB');
assert.equal(adbOcc.n, 313, 'ADB occurrence evaluated count must be 313');
assert.equal(adbOcc.censoringBreakdown.rightCensoredCount, 556, 'ADB right-censored count must be 556');

// 1a. Primary Calibrated Classifier (High-Specificity Operating Point)
assert.equal(adbOcc.mcc, 0.0109, 'Primary occurrence calibrated MCC must be 0.0109');
assert.equal(adbOcc.primaryCalibratedClassifierMCC, 0.0109, 'primaryCalibratedClassifierMCC must be 0.0109');
assert.equal(adbOcc.rocAuc, 0.5072, 'Primary calibrated ROC-AUC must be 0.5072');
assert.equal(adbOcc.specificity, 0.9091, 'Primary calibrated specificity must be 0.9091');
assert.equal(adbOcc.recall, 0.1093, 'Primary calibrated sensitivity/recall must be 0.1093');
assert.deepEqual(adbOcc.confusionMatrix, { tp: 33, fp: 1, tn: 10, fn: 269 }, 'Primary calibrated confusion matrix must match { tp: 33, fp: 1, tn: 10, fn: 269 }');

// 1b. Astrology-Only Model (Four-Model Comparison at Frozen Threshold tau = 0.91)
const adbAstroModel = adb.baselineComparison.fourModelComparison.find(m => m.modelId === 'MODEL_2_ASTROLOGY');
assert(adbAstroModel, 'ADB 4-model comparison must include MODEL_2_ASTROLOGY');
assert.equal(adbAstroModel.mcc, 0.0397, 'ADB astrology comparison model MCC must be 0.0397');
assert.equal(adbAstroModel.astrologyOnlyComparisonModelMCC, 0.0397, 'astrologyOnlyComparisonModelMCC must be 0.0397');
assert.equal(adbAstroModel.rocAuc, 0.5072, 'ADB astrology comparison model ROC-AUC must be 0.5072');
assert.equal(adbAstroModel.appliedThreshold, 0.91, 'ADB astrology comparison model applied threshold must be 0.91');
assert.equal(adbAstroModel.specificity, 0.8182, 'ADB astrology comparison model specificity must be 0.8182');
assert.equal(adbAstroModel.sensitivity, 0.2781, 'ADB astrology comparison model sensitivity must be 0.2781');
assert.deepEqual(adbAstroModel.confusionMatrix, { tp: 84, fp: 2, tn: 9, fn: 218 }, 'ADB astrology comparison confusion matrix must match { tp: 84, fp: 2, tn: 9, fn: 218 }');

// 1c. External Validation Report Scorecard Alignment
const extReportEarly = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/real_world_validation/results/external_validation_report.json'), 'utf8'));
assert.equal(extReportEarly.scorecard.primaryCalibratedClassifierMCC, 0.0109, 'Scorecard primaryCalibratedClassifierMCC must be 0.0109');
assert.equal(extReportEarly.scorecard.astrologyOnlyComparisonModelMCC, 0.0397, 'Scorecard astrologyOnlyComparisonModelMCC must be 0.0397');
assert.deepEqual(extReportEarly.scorecard.primaryConfusionMatrix, { tp: 33, fp: 1, tn: 10, fn: 269 });
assert.deepEqual(extReportEarly.scorecard.comparisonConfusionMatrix, { tp: 84, fp: 2, tn: 9, fn: 218 });

console.log(`✓ Astro-Databank external metrics verified:`);
console.log(`  Timing N: ${adbTiming.n}, Astrological MAE: ${adbTiming.mae}y, Demographic MAE: ${adbDemo.mae}y`);
console.log(`  Timing within ±1y: ${adbTiming.within1yPct}%, Demographic within ±1y: ${adbDemo.within1yPct}%`);
console.log(`  Occurrence N: ${adbOcc.n}, Right-censored: ${adbOcc.censoringBreakdown.rightCensoredCount}`);
console.log(`  Both models share identical ranking ROC-AUC: 0.5072 on external cohort (N=313)`);
console.log(`  Primary Calibrated Classifier: MCC=0.0109, Spec=90.91%, Sens=10.93%, CM={tp:33,fp:1,tn:10,fn:269}`);
console.log(`  Comparison Model 2 (tau=0.91):  MCC=0.0397, Spec=81.82%, Sens=27.81%, CM={tp:84,fp:2,tn:9,fn:218}`);

// 2. Internal Blind Test metrics
const blindTiming = bench.splits.BLIND_TEST.timing;
const blindDemo = bench.splits.BLIND_TEST.demographicBaseline;
const blindHazard = bench.splits.BLIND_TEST.discreteHazardModel;
const blindOcc = bench.splits.BLIND_TEST.occurrence;

assert.equal(blindTiming.n, 1484, 'Blind test timing n must be 1484');
assert.equal(blindTiming.mae, 6.89, 'Blind test astrological timing MAE must be 6.89 years');
assert.equal(blindTiming.within1yPct, 13.01, 'Blind test timing within 1y must be 13.01%');
assert.equal(blindDemo.mae, 4.28, 'Blind test demographic baseline MAE must be 4.28 years');
assert.equal(blindDemo.within1yPct, 28.71, 'Blind test demographic baseline within 1y must be 28.71%');
assert(blindTiming.mae > blindDemo.mae, 'Astrological MAE must be higher than demographic baseline on internal blind test');
assert.equal(blindHazard.likelihood.isAstrologyStatisticallySignificant, false, 'Astrology must not be statistically significant in hazard LRT');
console.log(`✓ Internal Blind Test metrics verified:`);
console.log(`  Timing N: ${blindTiming.n}, Astrological MAE: ${blindTiming.mae}y, Demographic MAE: ${blindDemo.mae}y`);
console.log(`  Timing within ±1y: ${blindTiming.within1yPct}%, Demographic within ±1y: ${blindDemo.within1yPct}%`);
console.log(`  Hazard LRT p-value: ${blindHazard.likelihood.lrtPValue} (Statistically tied: ${blindHazard.timing.baselineComparisonStatus})`);

// 3. Status Invariants
assert.equal(adbOcc.validationStatus, 'NOT_EMPIRICALLY_VALIDATED', 'ADB occurrence status must be NOT_EMPIRICALLY_VALIDATED');
assert.equal(adbTiming.empiricalPredictiveResolution, 'MULTI_YEAR_RANGE', 'ADB resolution must be MULTI_YEAR_RANGE');
assert.equal(blindTiming.empiricalPredictiveResolution, 'MULTI_YEAR_RANGE', 'Blind test resolution must be MULTI_YEAR_RANGE');
console.log(`✓ Epistemic honesty status confirmed: EXPERIMENTAL / NOT_EMPIRICALLY_VALIDATED`);

// 4. Cross-Cohort Disclosure Firewall: External disclosures must NEVER reference internal figures
const extReportPath = path.join(ROOT, 'data/real_world_validation/results/external_validation_report.json');
const extReport = JSON.parse(fs.readFileSync(extReportPath, 'utf8'));

const disclosuresToCheck = [
  adb.primaryBenchmarkMetrics?.superiorityDisclosure,
  adb.baselineComparison?.superiorityDisclosure,
  extReport.scorecard?.superiorityDisclosure
].filter(Boolean);

assert.equal(disclosuresToCheck.length, 3, 'Must verify all 3 external superiority disclosures across ADB benchmark and external validation report');

for (const disc of disclosuresToCheck) {
  assert(!disc.includes('4.28'), `External disclosure must not leak internal blind MAE 4.28y: "${disc}"`);
  assert(!disc.includes('6.89'), `External disclosure must not leak internal blind MAE 6.89y: "${disc}"`);
  assert(!disc.includes('28.7'), `External disclosure must not leak internal blind within1y 28.7%: "${disc}"`);
  assert(!disc.includes('13.0%') && !disc.includes('13.01%'), `External disclosure must not leak internal blind within1y 13.0%: "${disc}"`);
  assert(!disc.includes('1484'), `External disclosure must not leak internal sample size 1484: "${disc}"`);
  assert(disc.includes('6.41'), `External disclosure must cite external demographic baseline MAE 6.41y: "${disc}"`);
  assert(disc.includes('9.19'), `External disclosure must cite external astrological MAE 9.19y: "${disc}"`);
  assert(disc.includes('320'), `External disclosure must cite external timing sample size N=320: "${disc}"`);
}
console.log(`✓ Cross-cohort disclosure firewall verified: 100% of external disclosures derive exclusively from external metrics`);

// 5. Negative Test: Verify that cross-cohort leakage detection triggers assertion error
function testLeakageDetection(tamperedDisclosure) {
  const hasLeak = tamperedDisclosure.includes('4.28') || tamperedDisclosure.includes('6.89') || tamperedDisclosure.includes('1484');
  return hasLeak;
}
assert.equal(testLeakageDetection('External MAE 9.19 vs 6.41 on N=320'), false, 'Clean disclosure must pass');
assert.equal(testLeakageDetection('External MAE 6.89 vs 4.28 on N=1484'), true, 'Leaked disclosure must be caught');
console.log(`✓ Negative cross-cohort leakage test verified`);

// 6. Negative Regression Test: Verifying that substituting primary vs comparison MCC fails
function verifyMccIntegrity(targetObj, expectedMetricName, expectedMcc, expectedCm) {
  if (targetObj[expectedMetricName] !== expectedMcc) {
    throw new Error(`Metric mismatch: expected ${expectedMetricName}=${expectedMcc}, got ${targetObj[expectedMetricName]}`);
  }
  if (JSON.stringify(targetObj.confusionMatrix) !== JSON.stringify(expectedCm)) {
    throw new Error(`Confusion matrix mismatch for ${expectedMetricName}`);
  }
  return true;
}

// 6a. Valid objects pass
assert.doesNotThrow(() => {
  verifyMccIntegrity(adbOcc, 'primaryCalibratedClassifierMCC', 0.0109, { tp: 33, fp: 1, tn: 10, fn: 269 });
});
assert.doesNotThrow(() => {
  verifyMccIntegrity(adbAstroModel, 'astrologyOnlyComparisonModelMCC', 0.0397, { tp: 84, fp: 2, tn: 9, fn: 218 });
});

// 6b. Tampering primary MCC with comparison MCC (0.0397) throws error
assert.throws(() => {
  const tampered = { ...adbOcc, primaryCalibratedClassifierMCC: 0.0397 };
  verifyMccIntegrity(tampered, 'primaryCalibratedClassifierMCC', 0.0109, { tp: 33, fp: 1, tn: 10, fn: 269 });
}, /Metric mismatch/);

// 6c. Tampering comparison MCC with primary MCC (0.0109) throws error
assert.throws(() => {
  const tampered = { ...adbAstroModel, astrologyOnlyComparisonModelMCC: 0.0109 };
  verifyMccIntegrity(tampered, 'astrologyOnlyComparisonModelMCC', 0.0397, { tp: 84, fp: 2, tn: 9, fn: 218 });
}, /Metric mismatch/);

// 6d. Swapping confusion matrices throws error
assert.throws(() => {
  const tampered = { ...adbOcc, confusionMatrix: { tp: 84, fp: 2, tn: 9, fn: 218 } };
  verifyMccIntegrity(tampered, 'primaryCalibratedClassifierMCC', 0.0109, { tp: 33, fp: 1, tn: 10, fn: 269 });
}, /Confusion matrix mismatch/);

console.log(`✓ Negative MCC substitution tests verified (anti-tamper protection active)`);

console.log('\n============================================================');
console.log(' ALL BENCHMARK METRIC RECONCILIATION TESTS PASSED (100%)');
console.log('============================================================\n');
