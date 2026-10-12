/**
 * ASTROVERSE — Execution Provenance & Cache Integrity Test Suite
 * ==============================================================
 * Regression tests verifying:
 * 1. Immutable execution record binding (run ID, engine hash, calibration hash, datasets, counters).
 * 2. Strict reconciliation between metadata-level and run-level cache statistics.
 * 3. Fail-closed certification against tampering with:
 *    - cache counters (cacheHits, cacheMisses, recomputedCount)
 *    - engine and calibration hashes
 *    - run IDs and cohort labels
 *    - missing or corrupted provenance
 * 4. Anti-fabrication assertions:
 *    - heuristic scores cannot be labeled as empirical probabilities
 *    - uncalibrated margins cannot be labeled as measured precision
 *    - predefined palm profiles cannot be labeled as detected image features
 *    - missing milestones cannot yield fabricated birth dates
 *    - weak candidate rankings cannot be applied as verified birth times
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reverseCalculateBirthTimeAndDOB, analyzeDualPalmsForBirthRecovery } from './src/services/nashtaJatakaEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('\n============================================================');
console.log(' ASTROVERSE — EXECUTION PROVENANCE & CACHE INTEGRITY SUITE');
console.log('============================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

const adbPath = path.join(ROOT, 'data/real_world_validation/results/astro_databank_external_benchmark.json');
const benchPath = path.join(ROOT, 'data/real_world_validation/results/benchmark_results.json');
const extReportPath = path.join(ROOT, 'data/real_world_validation/results/external_validation_report.json');

const adb = JSON.parse(fs.readFileSync(adbPath, 'utf8'));
const bench = JSON.parse(fs.readFileSync(benchPath, 'utf8'));
const extReport = JSON.parse(fs.readFileSync(extReportPath, 'utf8'));

// Validation helper for execution record
function validateExecutionRecord(record, expectedCohort, expectedRunIdPrefix) {
  if (!record || typeof record !== 'object') {
    return { valid: false, reason: 'Execution record is missing or not an object' };
  }
  if (!record.runId || !record.runId.startsWith(expectedRunIdPrefix)) {
    return { valid: false, reason: `Invalid runId: ${record.runId}, expected prefix ${expectedRunIdPrefix}` };
  }
  if (record.cohortName !== expectedCohort) {
    return { valid: false, reason: `Cohort mismatch: expected ${expectedCohort}, got ${record.cohortName}` };
  }
  if (!record.predictionEngineHash || record.predictionEngineHash.length !== 64) {
    return { valid: false, reason: `Invalid predictionEngineHash: ${record.predictionEngineHash}` };
  }
  if (!record.calibrationModelHash || record.calibrationModelHash.length !== 64) {
    return { valid: false, reason: `Invalid calibrationModelHash: ${record.calibrationModelHash}` };
  }
  if (!record.benchmarkCodeHash || record.benchmarkCodeHash.length !== 64) {
    return { valid: false, reason: `Invalid benchmarkCodeHash: ${record.benchmarkCodeHash}` };
  }
  if (typeof record.predictionCount !== 'number' || record.predictionCount <= 0) {
    return { valid: false, reason: `Invalid predictionCount: ${record.predictionCount}` };
  }
  if (typeof record.cacheHits !== 'number' || typeof record.cacheMisses !== 'number' || typeof record.recomputedCount !== 'number') {
    return { valid: false, reason: 'Cache counter fields missing or non-numeric' };
  }
  if (record.cacheHits + record.cacheMisses !== record.predictionCount) {
    return { valid: false, reason: `Counter sum mismatch: ${record.cacheHits} hits + ${record.cacheMisses} misses != ${record.predictionCount}` };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Genuine Execution Record Integrity
// ─────────────────────────────────────────────────────────────────────────────
test('1A. Astro-Databank external execution record is intact and verified', () => {
  const res = validateExecutionRecord(adb.metadata.executionRecord, 'ASTRO_DATABANK_CERTIFIED_AAA', 'RUN-ADB-EXTERNAL-');
  assert.strictEqual(res.valid, true, res.reason);
  assert.strictEqual(adb.metadata.executionRecord.predictionCount, 3751);
  assert.strictEqual(adb.metadata.executionRecord.cacheHits, 0);
  assert.strictEqual(adb.metadata.executionRecord.cacheMisses, 3751);
  assert.strictEqual(adb.metadata.executionRecord.recomputedCount, 3751);
});

test('1B. Combined benchmark aggregate execution record is intact and verified', () => {
  const res = validateExecutionRecord(bench.metadata.executionRecord, 'FULL_COHORT_100_PERCENT', 'RUN-COMBINED-BENCHMARK-');
  assert.strictEqual(res.valid, true, res.reason);
  assert.strictEqual(bench.metadata.executionRecord.predictionCount, 1634 + 1555 + 3751);
  assert.strictEqual(bench.metadata.executionRecord.cacheHits, 1634 + 1555);
  assert.strictEqual(bench.metadata.executionRecord.cacheMisses, 3751);
});

test('1C. Internal benchmark aggregate execution record is intact and verified', () => {
  const res = validateExecutionRecord(bench.metadata.internalAggregateExecutionRecord, 'INTERNAL_EVALUATION_COMBINED', 'RUN-INTERNAL-AGGREGATE-');
  assert.strictEqual(res.valid, true, res.reason);
  assert.strictEqual(bench.metadata.internalAggregateExecutionRecord.predictionCount, 1634 + 1555);
  assert.strictEqual(bench.metadata.internalAggregateExecutionRecord.cacheHits, 1634 + 1555);
  assert.strictEqual(bench.metadata.internalAggregateExecutionRecord.cacheMisses, 0);
});

test('1D. External validation report execution record matches ADB run', () => {
  const res = validateExecutionRecord(extReport.metadata.executionRecord, 'ASTRO_DATABANK_CERTIFIED_AAA', 'RUN-ADB-EXTERNAL-');
  assert.strictEqual(res.valid, true, res.reason);
  assert.strictEqual(extReport.metadata.executionRecord.runId, adb.metadata.executionRecord.runId);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Metadata vs. Run-Level Cache Counter Reconciliation
// ─────────────────────────────────────────────────────────────────────────────
test('2A. External benchmark metadata cacheProvenance strictly matches run execution', () => {
  const meta = adb.metadata.cacheProvenance;
  const run = adb.primaryBenchmark;
  assert.strictEqual(meta.cacheHits, run.cacheHits, 'Metadata cacheHits must equal primaryBenchmark cacheHits (0)');
  assert.strictEqual(meta.cacheMisses, run.cacheMisses, 'Metadata cacheMisses must equal primaryBenchmark cacheMisses (3751)');
  assert.strictEqual(meta.recomputedCount, run.recomputedCount, 'Metadata recomputedCount must equal primaryBenchmark recomputedCount (3751)');
});

test('2B. Aggregate benchmark metadata cacheProvenance strictly derives from execution record', () => {
  const meta = bench.metadata.cacheProvenance;
  const exec = bench.metadata.executionRecord;
  assert.strictEqual(meta.cacheHits, exec.cacheHits, 'Metadata cacheHits must match executionRecord cacheHits (3189)');
  assert.strictEqual(meta.cacheMisses, exec.cacheMisses, 'Metadata cacheMisses must match executionRecord cacheMisses (3751)');
  assert.strictEqual(meta.recomputedCount, exec.recomputedCount, 'Metadata recomputedCount must match executionRecord recomputedCount (3751)');
  assert.strictEqual(bench.metadata.historicalCacheSnapshot.cumulativeCacheHits, 17623, 'Historical baseline cumulative hits must be preserved in historicalCacheSnapshot');
});

function validateScopeConsistency(metadata) {
  if (!metadata || !metadata.cacheProvenance || !metadata.executionRecord) {
    return { valid: false, reason: 'Missing provenance or execution record' };
  }
  const cp = metadata.cacheProvenance;
  const er = metadata.executionRecord;
  if (cp.cacheHits !== er.cacheHits) {
    return { valid: false, reason: `Scope contradiction: cacheProvenance.cacheHits (${cp.cacheHits}) !== executionRecord.cacheHits (${er.cacheHits})` };
  }
  if (cp.cacheMisses !== er.cacheMisses) {
    return { valid: false, reason: `Scope contradiction: cacheProvenance.cacheMisses (${cp.cacheMisses}) !== executionRecord.cacheMisses (${er.cacheMisses})` };
  }
  if (cp.recomputedCount !== er.recomputedCount) {
    return { valid: false, reason: `Scope contradiction: cacheProvenance.recomputedCount (${cp.recomputedCount}) !== executionRecord.recomputedCount (${er.recomputedCount})` };
  }
  return { valid: true };
}

test('2C. Scope consistency helper verifies legitimate benchmark metadata', () => {
  const res = validateScopeConsistency(bench.metadata);
  assert.strictEqual(res.valid, true, res.reason);
});

test('2D. Contradictory cache counters within same scope fail validation', () => {
  const tamperedMeta = {
    ...bench.metadata,
    cacheProvenance: {
      ...bench.metadata.cacheProvenance,
      cacheHits: 17623 // Stale historical counter injected into run scope
    }
  };
  const res = validateScopeConsistency(tamperedMeta);
  assert.strictEqual(res.valid, false);
  assert(res.reason.includes('Scope contradiction'));
});

test('2E. Internal and external cohorts cannot share datasets or execution counters', () => {
  const internalRecord = bench.metadata.internalAggregateExecutionRecord;
  const adbRecord = adb.metadata.executionRecord;
  assert.notStrictEqual(internalRecord.runId, adbRecord.runId, 'Run IDs must be distinct');
  assert.strictEqual(internalRecord.cacheMisses, 0, 'Internal aggregate must have zero misses');
  assert.strictEqual(adbRecord.cacheHits, 0, 'External ADB run must have zero hits');
  assert(!internalRecord.evaluationDatasetHash.includes('116595d3a3cbdd61'), 'Internal evaluation dataset must NOT include ADB external dataset');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Negative Tampering Tests: Alterations Must Fail Validation
// ─────────────────────────────────────────────────────────────────────────────
test('3A. Tampered run ID fails validation', () => {
  const tampered = { ...adb.metadata.executionRecord, runId: 'FORGED-RUN-ID-999' };
  const res = validateExecutionRecord(tampered, 'ASTRO_DATABANK_CERTIFIED_AAA', 'RUN-ADB-EXTERNAL-');
  assert.strictEqual(res.valid, false);
  assert(res.reason.includes('Invalid runId'));
});

test('3B. Tampered cohort label fails validation', () => {
  const tampered = { ...adb.metadata.executionRecord, cohortName: 'BLIND_TEST' };
  const res = validateExecutionRecord(tampered, 'ASTRO_DATABANK_CERTIFIED_AAA', 'RUN-ADB-EXTERNAL-');
  assert.strictEqual(res.valid, false);
  assert(res.reason.includes('Cohort mismatch'));
});

test('3C. Tampered cache counters (cache hits > prediction count) fails validation', () => {
  const tampered = { ...adb.metadata.executionRecord, cacheHits: 17623 };
  const res = validateExecutionRecord(tampered, 'ASTRO_DATABANK_CERTIFIED_AAA', 'RUN-ADB-EXTERNAL-');
  assert.strictEqual(res.valid, false);
  assert(res.reason.includes('Counter sum mismatch'));
});

test('3D. Tampered engine hash fails validation', () => {
  const tampered = { ...adb.metadata.executionRecord, predictionEngineHash: 'badhash' };
  const res = validateExecutionRecord(tampered, 'ASTRO_DATABANK_CERTIFIED_AAA', 'RUN-ADB-EXTERNAL-');
  assert.strictEqual(res.valid, false);
  assert(res.reason.includes('Invalid predictionEngineHash'));
});

test('3E. Missing provenance block fails validation', () => {
  const res = validateExecutionRecord(null, 'ASTRO_DATABANK_CERTIFIED_AAA', 'RUN-ADB-EXTERNAL-');
  assert.strictEqual(res.valid, false);
  assert(res.reason.includes('missing'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Anti-Fabrication & Epistemic Honesty Contracts
// ─────────────────────────────────────────────────────────────────────────────
test('4A. Heuristic score is never labeled as empirical probability', () => {
  const res = reverseCalculateBirthTimeAndDOB({
    lat: 13.0827, lng: 80.2707, tz: 5.5,
    answers: { q2_year: "2005", q2_month: "5", q3_year: "2007", q3_month: "5", q6_year: "2012", q6_month: "7" }
  });
  assert.strictEqual(res.empiricalConfidence, null, 'Empirical confidence must be null');
  assert.strictEqual(res.probabilityEstimate, null, 'Probability estimate must be null');
  assert.strictEqual(res.calibrationStatus, 'UNCALIBRATED', 'Calibration status must be UNCALIBRATED');
});

test('4B. Uncalibrated error margin is never displayed as guaranteed precision', () => {
  const res = reverseCalculateBirthTimeAndDOB({
    lat: 13.0827, lng: 80.2707, tz: 5.5,
    answers: { q2_year: "2005", q2_month: "5", q3_year: "2007", q3_month: "5" }
  });
  assert.strictEqual(res.errorMarginMonths, null, 'Numeric error margin months must not be asserted');
  assert.strictEqual(res.errorMarginStatus, 'UNCALIBRATED', 'Error margin status must be explicitly UNCALIBRATED');
});

test('4C. Predefined palm profiles are never claimed as detected image features', () => {
  const profile = analyzeDualPalmsForBirthRecovery({
    dominantHandImg: "data:image/jpeg;base64,sample",
    nonDominantHandImg: "data:image/jpeg;base64,sample",
    handDominance: "right"
  });
  assert.strictEqual(profile.imageFeaturesExtracted, false);
  assert.strictEqual(profile.isPersonalizedAnalysis, false);
  assert.strictEqual(profile.isIllustrativeReferenceOnly, true);
  assert.strictEqual(profile.candidateScoringApplicable, false);
});

test('4D. Missing milestones never produce a fabricated birth date', () => {
  const res = reverseCalculateBirthTimeAndDOB({
    lat: 13.0827, lng: 80.2707, tz: 5.5,
    answers: {}
  });
  assert.strictEqual(res.status, 'INSUFFICIENT_DATA');
  assert.strictEqual(res.estimatedBirthYear, null);
  assert.strictEqual(res.candidateBirthMonthNum, null);
  assert.strictEqual(res.candidateBirthDayNum, null);
  assert.strictEqual(res.timeWindow, null);
});

test('4E. Weak or non-discriminating candidate rankings are never applied as verified birth times', () => {
  const res = reverseCalculateBirthTimeAndDOB({
    lat: 13.0827, lng: 80.2707, tz: 5.5,
    answers: { q7_year: "2005", q7_month: "6", q8_year: "2008", q8_month: "6" }
  });
  if (res.status === 'NOT_DISCRIMINATING' || res.status === 'INSUFFICIENT_DATA') {
    assert.strictEqual(res.highestRankedCandidate, null);
    assert.strictEqual(res.timeWindow, null);
    assert.strictEqual(res.probableLagna, null);
    assert.strictEqual(res.probableMoonRashi, null);
  }
});

console.log('\n============================================================');
console.log(` SUMMARY: ${passed} passed, ${failed} failed.`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
