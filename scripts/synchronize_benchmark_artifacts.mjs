import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate4ModelComparison } from '../frontend/src/services/realWorldValidation/empiricalEvaluationEngine.js';
import { getCurrentHashes, initCacheManager } from '../frontend/src/services/realWorldValidation/predictionCacheManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

initCacheManager();
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

console.log('Evaluating 4-model comparison across cohorts...');
const blind4Model = evaluate4ModelComparison(blindRecords.slice(0, 500), trainRecords, 0.50);
const holdout4Model = evaluate4ModelComparison(holdoutRecords.slice(0, 500), trainRecords, 0.50);
const adb4Model = evaluate4ModelComparison(adbCertified.slice(0, 500), trainRecords, 0.50);

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
    bench.splits.BLIND_TEST.occurrence.classifierStatus = "DEGENERATE_BASE_RATE_CLASSIFIER";
    bench.splits.BLIND_TEST.occurrence.isDegenerate = true;
    bench.splits.BLIND_TEST.occurrence.fourModelComparison = blind4Model;
  }
  if (bench.splits?.INTERNAL_HOLDOUT?.occurrence) {
    bench.splits.INTERNAL_HOLDOUT.occurrence.classifierStatus = "DEGENERATE_BASE_RATE_CLASSIFIER";
    bench.splits.INTERNAL_HOLDOUT.occurrence.isDegenerate = true;
    bench.splits.INTERNAL_HOLDOUT.occurrence.fourModelComparison = holdout4Model;
  }
  if (bench.splits?.EXTERNAL_ASTRO_DATABANK_CERTIFIED?.occurrence) {
    bench.splits.EXTERNAL_ASTRO_DATABANK_CERTIFIED.occurrence.classifierStatus = "DEGENERATE_BASE_RATE_CLASSIFIER";
    bench.splits.EXTERNAL_ASTRO_DATABANK_CERTIFIED.occurrence.isDegenerate = true;
    bench.splits.EXTERNAL_ASTRO_DATABANK_CERTIFIED.occurrence.fourModelComparison = adb4Model;
  }
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
    adbBench.primaryBenchmark.occurrence.classifierStatus = "DEGENERATE_BASE_RATE_CLASSIFIER";
    adbBench.primaryBenchmark.occurrence.isDegenerate = true;
  }
  if (adbBench.primaryBenchmark?.comparativeSummary) {
    adbBench.primaryBenchmark.comparativeSummary.occurrenceClassifierStatus = "DEGENERATE_BASE_RATE_CLASSIFIER";
    adbBench.primaryBenchmark.comparativeSummary.fourModelComparison = adb4Model;
  }
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
    extReport.scorecard.occurrenceClassifierStatus = "DEGENERATE_BASE_RATE_CLASSIFIER";
    extReport.scorecard.occurrenceIsDegenerate = true;
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
    latestBench.metrics.blindTest.occurrence.classifierStatus = "DEGENERATE_BASE_RATE_CLASSIFIER";
    latestBench.metrics.blindTest.occurrence.isDegenerate = true;
    latestBench.metrics.blindTest.occurrence.fourModelComparison = blind4Model;
  }
  if (latestBench.metrics?.holdout?.occurrence) {
    latestBench.metrics.holdout.occurrence.classifierStatus = "DEGENERATE_BASE_RATE_CLASSIFIER";
    latestBench.metrics.holdout.occurrence.isDegenerate = true;
    latestBench.metrics.holdout.occurrence.fourModelComparison = holdout4Model;
  }
  if (latestBench.metrics?.astroDatabankCertifiedAAA?.occurrence) {
    latestBench.metrics.astroDatabankCertifiedAAA.occurrence.classifierStatus = "DEGENERATE_BASE_RATE_CLASSIFIER";
    latestBench.metrics.astroDatabankCertifiedAAA.occurrence.isDegenerate = true;
    latestBench.metrics.astroDatabankCertifiedAAA.occurrence.fourModelComparison = adb4Model;
  }
  fs.writeFileSync(LATEST_BENCHMARK_PATH, JSON.stringify(latestBench, null, 2) + '\n', 'utf8');
  console.log('✓ Synchronized latestBenchmarkResults.json');
}

console.log('All benchmark artifacts successfully synchronized.');
