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
assert.equal(adbDemo.mae, 6.41, 'ADB demographic baseline MAE must be 6.41 years');
assert(adbTiming.mae > adbDemo.mae, 'Astrological MAE must be higher than demographic baseline on external ADB');
assert.equal(adbOcc.n, 313, 'ADB occurrence evaluated count must be 313');
assert.equal(adbOcc.censoringBreakdown.rightCensoredCount, 556, 'ADB right-censored count must be 556');
console.log(`✓ Astro-Databank external metrics verified:`);
console.log(`  Timing N: ${adbTiming.n}, Astrological MAE: ${adbTiming.mae}y, Demographic MAE: ${adbDemo.mae}y`);
console.log(`  Occurrence N: ${adbOcc.n}, Right-censored: ${adbOcc.censoringBreakdown.rightCensoredCount}`);

// 2. Internal Blind Test metrics
const blindTiming = bench.splits.BLIND_TEST.timing;
const blindDemo = bench.splits.BLIND_TEST.demographicBaseline;
const blindHazard = bench.splits.BLIND_TEST.discreteHazardModel;

assert.equal(blindTiming.n, 1484, 'Blind test timing n must be 1484');
assert.equal(blindTiming.mae, 6.89, 'Blind test astrological timing MAE must be 6.89 years');
assert.equal(blindDemo.mae, 4.28, 'Blind test demographic baseline MAE must be 4.28 years');
assert(blindTiming.mae > blindDemo.mae, 'Astrological MAE must be higher than demographic baseline on internal blind test');
assert.equal(blindHazard.likelihood.isAstrologyStatisticallySignificant, false, 'Astrology must not be statistically significant in hazard LRT');
console.log(`✓ Internal Blind Test metrics verified:`);
console.log(`  Timing N: ${blindTiming.n}, Astrological MAE: ${blindTiming.mae}y, Demographic MAE: ${blindDemo.mae}y`);
console.log(`  Hazard LRT p-value: ${blindHazard.likelihood.lrtPValue} (Statistically tied: ${blindHazard.timing.baselineComparisonStatus})`);

// 3. Status Invariants
assert.equal(adbOcc.validationStatus, 'NOT_EMPIRICALLY_VALIDATED', 'ADB occurrence status must be NOT_EMPIRICALLY_VALIDATED');
assert.equal(adbTiming.empiricalPredictiveResolution, 'MULTI_YEAR_RANGE', 'ADB resolution must be MULTI_YEAR_RANGE');
assert.equal(blindTiming.empiricalPredictiveResolution, 'MULTI_YEAR_RANGE', 'Blind test resolution must be MULTI_YEAR_RANGE');
console.log(`✓ Epistemic honesty status confirmed: EXPERIMENTAL / NOT_EMPIRICALLY_VALIDATED`);

console.log('\n============================================================');
console.log(' ALL BENCHMARK METRIC RECONCILIATION TESTS PASSED (100%)');
console.log('============================================================\n');
