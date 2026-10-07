import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluate4ModelComparison,
  setCachedPredictionProvider,
  detectDegenerateClassifier,
  DEFAULT_FROZEN_VALIDATION_THRESHOLDS
} from '../frontend/src/services/realWorldValidation/empiricalEvaluationEngine.js';
import { getCurrentHashes, initCacheManager, loadCache, getCachedPrediction } from '../frontend/src/services/realWorldValidation/predictionCacheManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CACHE_PATH = path.join(ROOT, 'data/real_world_validation/cache/prediction_cache.json');
initCacheManager();
loadCache(CACHE_PATH);
setCachedPredictionProvider(getCachedPrediction);

const { predictionEngineHash, calibrationModelHash } = getCurrentHashes();

console.log('Current predictionEngineHash:', predictionEngineHash);
console.log('Current calibrationModelHash:', calibrationModelHash);

const TRAIN_PATH = path.join(ROOT, 'data/real_world_validation/splits/train.json');
const BLIND_TEST_PATH = path.join(ROOT, 'data/real_world_validation/splits/blind_test.json');
const INTERNAL_HOLDOUT_PATH = path.join(ROOT, 'data/real_world_validation/splits/internal_holdout.json');
const ADB_PATH = path.join(ROOT, 'data/external_validation/astro_databank/astro_databank_true_independent.json');

const trainRecords = JSON.parse(fs.readFileSync(TRAIN_PATH, 'utf8'));
const blindRecords = JSON.parse(fs.readFileSync(BLIND_TEST_PATH, 'utf8'));
const holdoutRecords = JSON.parse(fs.readFileSync(INTERNAL_HOLDOUT_PATH, 'utf8'));
const adbRecords = JSON.parse(fs.readFileSync(ADB_PATH, 'utf8'));
const adbCertified = adbRecords.filter(r => r.birthTimeReliability === 'AA' || r.birthTimeReliability === 'A');

console.log(`Evaluating 4-model comparison across FULL cohorts with model-specific validation-frozen thresholds:`);
console.log(`  Thresholds:`, DEFAULT_FROZEN_VALIDATION_THRESHOLDS);
console.log(`  BLIND_TEST: ${blindRecords.length} records`);
console.log(`  INTERNAL_HOLDOUT: ${holdoutRecords.length} records`);
console.log(`  ASTRO_DATABANK_CERTIFIED: ${adbCertified.length} records`);

const modelThresholds = { ...DEFAULT_FROZEN_VALIDATION_THRESHOLDS };
const blind4Model = evaluate4ModelComparison(blindRecords, trainRecords, { modelThresholds, getCachedPrediction });
const holdout4Model = evaluate4ModelComparison(holdoutRecords, trainRecords, { modelThresholds, getCachedPrediction });
const adb4Model = evaluate4ModelComparison(adbCertified, trainRecords, { modelThresholds, getCachedPrediction });

// Helper to set timing resolution separation
function setTimingResolution(timingObj) {
  if (timingObj && typeof timingObj === 'object') {
    timingObj.historicalRecordGranularity = "DAY";
    timingObj.computedCalendarGranularity = "DAY";
    timingObj.empiricalPredictiveResolution = "MULTI_YEAR_RANGE";
    timingObj.empiricalTimingStatus = "EMPIRICALLY_UNVALIDATED_FOR_EXACT_DAY";
  }
}

// Helper to dynamically calculate occurrence status from confusion matrix without hardcoded overrides
function syncOccurrenceStatus(occurrenceObj, fourModelSummary) {
  if (!occurrenceObj || typeof occurrenceObj !== 'object') return;
  const statusCheck = detectDegenerateClassifier(occurrenceObj.confusionMatrix, {
    specificity: occurrenceObj.specificity,
    mcc: occurrenceObj.mcc,
    balancedAccuracy: occurrenceObj.balancedAccuracy,
    accuracy: occurrenceObj.accuracy
  });
  occurrenceObj.classifierStatus = statusCheck.classifierStatus;
  occurrenceObj.isDegenerate = statusCheck.isDegenerate;
  occurrenceObj.degeneracyReason = statusCheck.reason;
  occurrenceObj.status = statusCheck.status;
  occurrenceObj.validationStatus = statusCheck.empiricallyValidated ? "EMPIRICALLY_VALIDATED" : "NOT_EMPIRICALLY_VALIDATED";
  if (fourModelSummary) {
    occurrenceObj.fourModelComparison = fourModelSummary;
  }
}

// 1. Update benchmark_results.json
const BENCHMARK_PATH = path.join(ROOT, 'data/real_world_validation/results/benchmark_results.json');
if (fs.existsSync(BENCHMARK_PATH)) {
  const bench = JSON.parse(fs.readFileSync(BENCHMARK_PATH, 'utf8'));
  bench.metadata.predictionEngineHash = predictionEngineHash;
  bench.metadata.calibrationModelHash = calibrationModelHash;
  if (bench.metadata.cacheProvenance) {
    bench.metadata.cacheProvenance.predictionEngineHash = predictionEngineHash;
    bench.metadata.cacheProvenance.calibrationHash = calibrationModelHash;
  }
  if (bench.splits?.BLIND_TEST?.occurrence) {
    syncOccurrenceStatus(bench.splits.BLIND_TEST.occurrence, blind4Model);
  }
  setTimingResolution(bench.splits?.BLIND_TEST?.timing);

  if (bench.splits?.INTERNAL_HOLDOUT?.occurrence) {
    syncOccurrenceStatus(bench.splits.INTERNAL_HOLDOUT.occurrence, holdout4Model);
  }
  setTimingResolution(bench.splits?.INTERNAL_HOLDOUT?.timing);

  if (bench.splits?.EXTERNAL_ASTRO_DATABANK_CERTIFIED?.occurrence) {
    syncOccurrenceStatus(bench.splits.EXTERNAL_ASTRO_DATABANK_CERTIFIED.occurrence, adb4Model);
  }
  setTimingResolution(bench.splits?.EXTERNAL_ASTRO_DATABANK_CERTIFIED?.timing);

  fs.writeFileSync(BENCHMARK_PATH, JSON.stringify(bench, null, 2) + '\n', 'utf8');
  console.log('✓ Synchronized benchmark_results.json');
}

// 2. Update astro_databank_external_benchmark.json
const ADB_BENCHMARK_PATH = path.join(ROOT, 'data/real_world_validation/results/astro_databank_external_benchmark.json');
if (fs.existsSync(ADB_BENCHMARK_PATH)) {
  const adbBench = JSON.parse(fs.readFileSync(ADB_BENCHMARK_PATH, 'utf8'));
  adbBench.metadata.predictionEngineHash = predictionEngineHash;
  adbBench.metadata.calibrationModelHash = calibrationModelHash;
  if (adbBench.metadata.cacheProvenance) {
    adbBench.metadata.cacheProvenance.predictionEngineHash = predictionEngineHash;
    adbBench.metadata.cacheProvenance.calibrationHash = calibrationModelHash;
  }
  if (adbBench.primaryBenchmark?.occurrence) {
    syncOccurrenceStatus(adbBench.primaryBenchmark.occurrence, null);
  }
  if (adbBench.primaryBenchmark?.comparativeSummary) {
    adbBench.primaryBenchmark.comparativeSummary.occurrenceClassifierStatus = adbBench.primaryBenchmark?.occurrence?.classifierStatus || "NON_DISCRIMINATIVE";
    adbBench.primaryBenchmark.comparativeSummary.occurrenceIsDegenerate = adbBench.primaryBenchmark?.occurrence?.isDegenerate ?? false;
    adbBench.primaryBenchmark.comparativeSummary.fourModelComparison = adb4Model;
  }
  if (adbBench.primaryBenchmarkMetrics) {
    adbBench.primaryBenchmarkMetrics.occurrenceClassifierStatus = adbBench.primaryBenchmark?.occurrence?.classifierStatus || "NON_DISCRIMINATIVE";
    adbBench.primaryBenchmarkMetrics.occurrenceIsDegenerate = adbBench.primaryBenchmark?.occurrence?.isDegenerate ?? false;
    adbBench.primaryBenchmarkMetrics.occurrenceQualityGate = adbBench.primaryBenchmark?.occurrence?.validationStatus || "NOT_EMPIRICALLY_VALIDATED";
  }
  setTimingResolution(adbBench.primaryBenchmark?.timing);

  fs.writeFileSync(ADB_BENCHMARK_PATH, JSON.stringify(adbBench, null, 2) + '\n', 'utf8');
  console.log('✓ Synchronized astro_databank_external_benchmark.json');
}

// 3. Update external_validation_report.json
const EXT_REPORT_PATH = path.join(ROOT, 'data/real_world_validation/results/external_validation_report.json');
if (fs.existsSync(EXT_REPORT_PATH)) {
  const extReport = JSON.parse(fs.readFileSync(EXT_REPORT_PATH, 'utf8'));
  extReport.metadata.predictionEngineHash = predictionEngineHash;
  extReport.metadata.calibrationModelHash = calibrationModelHash;
  if (extReport.scorecard) {
    const statusCheck = detectDegenerateClassifier(extReport.scorecard.confusionMatrix, {
      specificity: extReport.scorecard.occurrenceSpecificity,
      mcc: extReport.scorecard.occurrenceMCC,
      balancedAccuracy: extReport.scorecard.occurrenceBalancedAccuracy,
      accuracy: extReport.scorecard.occurrenceAccuracy
    });
    extReport.scorecard.occurrenceClassifierStatus = statusCheck.classifierStatus;
    extReport.scorecard.occurrenceIsDegenerate = statusCheck.isDegenerate;
    extReport.scorecard.occurrenceQualityGate = statusCheck.empiricallyValidated ? "EMPIRICALLY_VALIDATED" : "NOT_EMPIRICALLY_VALIDATED";
    extReport.scorecard.fourModelComparison = adb4Model;
  }
  fs.writeFileSync(EXT_REPORT_PATH, JSON.stringify(extReport, null, 2) + '\n', 'utf8');
  console.log('✓ Synchronized external_validation_report.json');
}

// 4. Update latestBenchmarkResults.json
const LATEST_BENCHMARK_PATH = path.join(ROOT, 'frontend/src/config/latestBenchmarkResults.json');
if (fs.existsSync(LATEST_BENCHMARK_PATH)) {
  const latestBench = JSON.parse(fs.readFileSync(LATEST_BENCHMARK_PATH, 'utf8'));
  latestBench.provenance.predictionEngineHash = predictionEngineHash;
  latestBench.provenance.calibrationModelHash = calibrationModelHash;
  if (latestBench.metrics?.blindTest?.occurrence) {
    syncOccurrenceStatus(latestBench.metrics.blindTest.occurrence, blind4Model);
  }
  setTimingResolution(latestBench.metrics?.blindTest?.timing);

  if (latestBench.metrics?.holdout?.occurrence) {
    syncOccurrenceStatus(latestBench.metrics.holdout.occurrence, holdout4Model);
  }
  setTimingResolution(latestBench.metrics?.holdout?.timing);

  if (latestBench.metrics?.astroDatabankCertifiedAAA?.occurrence) {
    syncOccurrenceStatus(latestBench.metrics.astroDatabankCertifiedAAA.occurrence, adb4Model);
  }
  setTimingResolution(latestBench.metrics?.astroDatabankCertifiedAAA?.timing);

  fs.writeFileSync(LATEST_BENCHMARK_PATH, JSON.stringify(latestBench, null, 2) + '\n', 'utf8');
  console.log('✓ Synchronized latestBenchmarkResults.json');
}

console.log('All benchmark artifacts successfully synchronized.');
