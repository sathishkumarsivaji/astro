/**
 * ASTROVERSE — Cache Coefficient Hash Integrity & 6-Scenario Invalidation Suite
 *
 * Implements Requirement P1-1:
 * Verifies the 6 mandatory cache invalidation scenarios:
 * 1. Invalidation when modelCoefficientsHash changes
 * 2. Invalidation when predictionEngineHash changes
 * 3. Invalidation when calibrationModelHash changes
 * 4. Invalidation when trainingDatasetHash changes
 * 5. Valid hit when all hashes match
 * 6. Cache key uniqueness across distinct inputs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initCacheManager,
  loadCache,
  getCachedPrediction,
  setCachedPrediction,
  flushCache,
  computeInputHash,
  getCurrentHashes,
  invalidateAll
} from './src/services/realWorldValidation/predictionCacheManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TEMP_CACHE = path.join(ROOT, 'data/real_world_validation/cache/temp_coeff_hash_test_cache.json');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗\x1b[0m ${label}`);
    failed++;
  }
}

console.log('\n============================================================');
console.log(' ASTROVERSE — P1-1 CACHE COEFFICIENT HASH & INVALIDATION SUITE');
console.log('============================================================\n');

// Initialize cache manager
initCacheManager({
  calibrationModelPath: path.join(ROOT, 'data/real_world_validation/results/calibration_model.json'),
  trainingDatasetPath: path.join(ROOT, 'data/real_world_validation/splits/train.json'),
  benchmarkResultsPath: path.join(ROOT, 'frontend/src/config/latestBenchmarkResults.json')
});
loadCache(TEMP_CACHE);
invalidateAll();

const currentHashes = getCurrentHashes();
console.log('Authoritative Hashes:');
console.log(`  predictionEngineHash:  ${currentHashes.predictionEngineHash?.substring(0, 16)}...`);
console.log(`  calibrationModelHash:  ${currentHashes.calibrationModelHash?.substring(0, 16)}...`);
console.log(`  trainingDatasetHash:   ${currentHashes.trainingDatasetHash?.substring(0, 16)}...`);
console.log(`  modelCoefficientsHash: ${currentHashes.modelCoefficientsHash?.substring(0, 16)}...\n`);

assert(
  typeof currentHashes.modelCoefficientsHash === 'string' && currentHashes.modelCoefficientsHash.length === 64,
  'Authoritative modelCoefficientsHash is non-null 64-char SHA-256 string'
);

const recordA = {
  birthDate: '1985-06-20',
  birthTime: '14:30:00',
  latitude: 13.0827,
  longitude: 80.2707,
  sourceUtcOffset: 5.5,
  ayanamsha: 'lahiri'
};

const recordB = {
  birthDate: '1985-06-20',
  birthTime: '14:30:01', // 1 second difference
  latitude: 13.0827,
  longitude: 80.2707,
  sourceUtcOffset: 5.5,
  ayanamsha: 'lahiri'
};

const hashA = computeInputHash(recordA);
const hashB = computeInputHash(recordB);

function makePredictionPayload(val = 2012) {
  return {
    occ: { prediction: 'MARRIAGE_PREDICTED', pMarriage: 0.85, commitmentHash: 'comm_occ_' + val },
    timing: { centralEstimateYear: val, commitmentHash: 'comm_tim_' + val },
    div: null,
    mode: null,
    commitments: {
      occCommitment: 'comm_occ_' + val,
      timingCommitment: 'comm_tim_' + val
    }
  };
}

function writeRawCacheEntry(recordId, entry) {
  const rawCache = fs.existsSync(TEMP_CACHE) ? JSON.parse(fs.readFileSync(TEMP_CACHE, 'utf8')) : {};
  rawCache[recordId] = entry;
  fs.writeFileSync(TEMP_CACHE, JSON.stringify(rawCache, null, 2));
  loadCache(TEMP_CACHE);
}

// -------------------------------------------------------------
// Scenario 1: Invalidation when modelCoefficientsHash changes
// -------------------------------------------------------------
console.log('\nScenario 1: Invalidation when modelCoefficientsHash changes');
setCachedPrediction('REC_COEFF_TEST', hashA, makePredictionPayload(2015));
flushCache();
// Verify it hits initially
assert(getCachedPrediction('REC_COEFF_TEST', hashA) !== null, 'Initial valid entry is cached');

// Corrupt modelCoefficientsHash
const entry1 = JSON.parse(fs.readFileSync(TEMP_CACHE, 'utf8'))['REC_COEFF_TEST'];
entry1.modelCoefficientsHash = 'corrupted_coefficients_hash_000000000000000000000000000000000000000';
writeRawCacheEntry('REC_COEFF_TEST', entry1);

const missCoeff = getCachedPrediction('REC_COEFF_TEST', hashA);
assert(missCoeff === null, 'Cache lookup MISSES and invalidates when modelCoefficientsHash mismatches');

// -------------------------------------------------------------
// Scenario 2: Invalidation when predictionEngineHash changes
// -------------------------------------------------------------
console.log('\nScenario 2: Invalidation when predictionEngineHash changes');
setCachedPrediction('REC_ENG_TEST', hashA, makePredictionPayload(2016));
flushCache();
const entry2 = JSON.parse(fs.readFileSync(TEMP_CACHE, 'utf8'))['REC_ENG_TEST'];
entry2.predictionEngineHash = 'corrupted_pred_engine_hash_1111111111111111111111111111111111111111';
writeRawCacheEntry('REC_ENG_TEST', entry2);

const missEng = getCachedPrediction('REC_ENG_TEST', hashA);
assert(missEng === null, 'Cache lookup MISSES and invalidates when predictionEngineHash mismatches');

// -------------------------------------------------------------
// Scenario 3: Invalidation when calibrationModelHash changes
// -------------------------------------------------------------
console.log('\nScenario 3: Invalidation when calibrationModelHash changes');
setCachedPrediction('REC_CALIB_TEST', hashA, makePredictionPayload(2017));
flushCache();
const entry3 = JSON.parse(fs.readFileSync(TEMP_CACHE, 'utf8'))['REC_CALIB_TEST'];
entry3.calibrationModelHash = 'corrupted_calib_model_hash_222222222222222222222222222222222222222';
writeRawCacheEntry('REC_CALIB_TEST', entry3);

const missCalib = getCachedPrediction('REC_CALIB_TEST', hashA);
assert(missCalib === null, 'Cache lookup MISSES and invalidates when calibrationModelHash mismatches');

// -------------------------------------------------------------
// Scenario 4: Invalidation when trainingDatasetHash changes
// -------------------------------------------------------------
console.log('\nScenario 4: Invalidation when trainingDatasetHash changes');
setCachedPrediction('REC_TRAIN_TEST', hashA, makePredictionPayload(2018));
flushCache();
const entry4 = JSON.parse(fs.readFileSync(TEMP_CACHE, 'utf8'))['REC_TRAIN_TEST'];
entry4.trainingDatasetHash = 'corrupted_train_dataset_hash_333333333333333333333333333333333333333';
writeRawCacheEntry('REC_TRAIN_TEST', entry4);

const missTrain = getCachedPrediction('REC_TRAIN_TEST', hashA);
assert(missTrain === null, 'Cache lookup MISSES and invalidates when trainingDatasetHash mismatches');

// -------------------------------------------------------------
// Scenario 5: Valid hit when all hashes match
// -------------------------------------------------------------
console.log('\nScenario 5: Valid hit when all hashes match');
setCachedPrediction('REC_VALID_HIT', hashA, makePredictionPayload(2020));
flushCache();
const validHit = getCachedPrediction('REC_VALID_HIT', hashA);
assert(
  validHit !== null &&
  validHit.timing.centralEstimateYear === 2020 &&
  validHit.modelCoefficientsHash === currentHashes.modelCoefficientsHash,
  'Valid hit returns correct prediction and preserves authoritative modelCoefficientsHash'
);

// -------------------------------------------------------------
// Scenario 6: Cache key uniqueness across distinct inputs
// -------------------------------------------------------------
console.log('\nScenario 6: Cache key uniqueness across distinct inputs');
assert(hashA !== hashB, 'Distinct birth times produce strictly distinct inputHashes');
setCachedPrediction('REC_PERSON_A', hashA, makePredictionPayload(2021));
setCachedPrediction('REC_PERSON_B', hashB, makePredictionPayload(2025));
flushCache();

const hitA = getCachedPrediction('REC_PERSON_A', hashA);
const hitB = getCachedPrediction('REC_PERSON_B', hashB);
const crossLookup = getCachedPrediction('REC_PERSON_A', hashB);

assert(hitA !== null && hitA.timing.centralEstimateYear === 2021, 'Record A returns its own prediction');
assert(hitB !== null && hitB.timing.centralEstimateYear === 2025, 'Record B returns its own distinct prediction');
assert(crossLookup === null, 'Cross-lookup with different inputHash fails-closed (cache miss)');

// Cleanup
try {
  if (fs.existsSync(TEMP_CACHE)) fs.unlinkSync(TEMP_CACHE);
} catch {}

console.log('\n============================================================');
console.log(` P1-1 Invalidation Suite Results: ${passed} passed, ${failed} failed`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
