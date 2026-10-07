/**
 * ASTROVERSE — Prediction Cache Invalidation Matrix Regression Test
 *
 * Implements Part E (Hash & Cache Integrity):
 * Deliberately modifies each of the required cache integrity components:
 * 1. inputHash
 * 2. predictionEngineHash
 * 3. calibrationModelHash
 * 4. calibrationInputHash
 * 5. trainingDatasetHash
 * 6. predictionSchemaVersion
 * 7. astronomyEngineVersion
 *
 * Verifies that ANY mismatch immediately rejects the cached prediction and invalidates the entry.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initCacheManager,
  loadCache,
  getCachedPrediction,
  setCachedPrediction,
  computeInputHash,
  getCurrentHashes,
  invalidateAll
} from './src/services/realWorldValidation/predictionCacheManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TEMP_CACHE = path.join(ROOT, 'data/real_world_validation/cache/temp_invalidation_test_cache.json');

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
console.log(' ASTROVERSE — CACHE INVALIDATION MATRIX REGRESSION TEST');
console.log('============================================================\n');

// 1. Initialize cache manager
initCacheManager({
  calibrationModelPath: path.join(ROOT, 'data/real_world_validation/results/calibration_model.json'),
  trainingDatasetPath: path.join(ROOT, 'data/real_world_validation/splits/train.json')
});
loadCache(TEMP_CACHE);
invalidateAll();

const currentHashes = getCurrentHashes();
console.log('Current System Hashes:');
console.log(`  predictionEngineHash:    ${currentHashes.predictionEngineHash?.substring(0, 16)}...`);
console.log(`  calibrationModelHash:    ${currentHashes.calibrationModelHash?.substring(0, 16)}...`);
console.log(`  calibrationInputHash:    ${currentHashes.calibrationInputHash?.substring(0, 16)}...`);
console.log(`  trainingDatasetHash:     ${currentHashes.trainingDatasetHash?.substring(0, 16)}...`);
console.log(`  predictionSchemaVersion: ${currentHashes.predictionSchemaVersion}`);
console.log(`  astronomyEngineVersion:  ${currentHashes.astronomyEngineVersion}\n`);

const dummyRecord = {
  birthDate: '1985-06-20',
  birthTime: '14:30:00',
  latitude: 13.0827,
  longitude: 80.2707,
  sourceUtcOffset: 5.5,
  ayanamsha: 'lahiri'
};
const validHash = computeInputHash(dummyRecord);

function seedCache(recordId, overrides = {}) {
  const dummyPrediction = {
    occ: { prediction: 'MARRIAGE_PREDICTED', pMarriage: 0.85, commitmentHash: 'dummy_occ_hash' },
    timing: { centralEstimateYear: 2012, commitmentHash: 'dummy_timing_hash' },
    div: null,
    mode: null,
    commitments: {
      occCommitment: 'dummy_occ_hash',
      timingCommitment: 'dummy_timing_hash'
    }
  };
  setCachedPrediction(recordId, validHash, dummyPrediction);

  if (Object.keys(overrides).length > 0) {
    // Read raw in-memory entry and modify
    const rawCache = JSON.parse(fs.existsSync(TEMP_CACHE) ? fs.readFileSync(TEMP_CACHE, 'utf8') : '{}');
    // LoadCache loads into predictionCache; we can write corrupted object to file and reload
    const currentMemory = JSON.parse(JSON.stringify(dummyPrediction));
    const corruptedEntry = {
      recordId,
      inputHash: overrides.inputHash !== undefined ? overrides.inputHash : validHash,
      predictionEngineHash: overrides.predictionEngineHash !== undefined ? overrides.predictionEngineHash : currentHashes.predictionEngineHash,
      calibrationModelHash: overrides.calibrationModelHash !== undefined ? overrides.calibrationModelHash : currentHashes.calibrationModelHash,
      calibrationInputHash: overrides.calibrationInputHash !== undefined ? overrides.calibrationInputHash : currentHashes.calibrationInputHash,
      trainingDatasetHash: overrides.trainingDatasetHash !== undefined ? overrides.trainingDatasetHash : currentHashes.trainingDatasetHash,
      modelCoefficientsHash: overrides.modelCoefficientsHash !== undefined ? overrides.modelCoefficientsHash : currentHashes.modelCoefficientsHash,
      astronomyEngineVersion: overrides.astronomyEngineVersion !== undefined ? overrides.astronomyEngineVersion : currentHashes.astronomyEngineVersion,
      predictionSchemaVersion: overrides.predictionSchemaVersion !== undefined ? overrides.predictionSchemaVersion : currentHashes.predictionSchemaVersion,
      modelVersion: '2.2.0',
      generatedAt: new Date().toISOString(),
      occ: dummyPrediction.occ,
      timing: dummyPrediction.timing
    };
    rawCache[recordId] = corruptedEntry;
    fs.writeFileSync(TEMP_CACHE, JSON.stringify(rawCache));
    loadCache(TEMP_CACHE);
  }
}

// Test 1: Baseline valid cache entry hits successfully
console.log('1. Baseline Integrity:');
seedCache('REC_BASELINE');
const hit = getCachedPrediction('REC_BASELINE', validHash);
assert(hit !== null && hit.occ.prediction === 'MARRIAGE_PREDICTED', 'Valid cache entry produces CACHE HIT');

// Test 2: Input hash mismatch (e.g. changed birth time / coordinates)
console.log('\n2. Invalidation upon altered inputHash:');
seedCache('REC_INPUT_CHANGE');
const changedInputHash = computeInputHash({ ...dummyRecord, birthTime: '15:45:00' });
const missInput = getCachedPrediction('REC_INPUT_CHANGE', changedInputHash);
assert(missInput === null, 'Altered inputHash (birth time changed) rejects cache entry');

// Test 3: Prediction engine hash mismatch (e.g. astroEngine or empiricalEngine modified)
console.log('\n3. Invalidation upon altered predictionEngineHash:');
seedCache('REC_STALE_ENGINE', { predictionEngineHash: 'stale_engine_hash_11111111111111111111111111111111' });
const missEngine = getCachedPrediction('REC_STALE_ENGINE', validHash);
assert(missEngine === null, 'Stale predictionEngineHash rejects cache entry and deletes record');

// Test 4: Calibration model hash mismatch (e.g. recalibration or different calibration parameters)
console.log('\n4. Invalidation upon altered calibrationModelHash:');
seedCache('REC_STALE_CALIB_MODEL', { calibrationModelHash: 'stale_calib_model_hash_22222222222222222222222222222222' });
const missCalib = getCachedPrediction('REC_STALE_CALIB_MODEL', validHash);
assert(missCalib === null, 'Stale calibrationModelHash rejects cache entry');

// Test 5: Calibration input hash mismatch (e.g. different training dataset partition used for calibration)
console.log('\n5. Invalidation upon altered calibrationInputHash:');
seedCache('REC_STALE_CALIB_INPUT', { calibrationInputHash: 'stale_calib_input_hash_33333333333333333333333333333333' });
const missCalibInput = getCachedPrediction('REC_STALE_CALIB_INPUT', validHash);
assert(missCalibInput === null, 'Stale calibrationInputHash rejects cache entry');

// Test 6: Training dataset hash mismatch
console.log('\n6. Invalidation upon altered trainingDatasetHash:');
seedCache('REC_STALE_TRAIN_DATA', { trainingDatasetHash: 'stale_train_dataset_hash_44444444444444444444444444444444' });
const missTrain = getCachedPrediction('REC_STALE_TRAIN_DATA', validHash);
assert(missTrain === null, 'Stale trainingDatasetHash rejects cache entry');

// Test 7: Prediction schema version mismatch
console.log('\n7. Invalidation upon altered predictionSchemaVersion:');
seedCache('REC_STALE_SCHEMA', { predictionSchemaVersion: '9.9.9' });
const missSchema = getCachedPrediction('REC_STALE_SCHEMA', validHash);
assert(missSchema === null, 'Stale predictionSchemaVersion rejects cache entry');

// Test 8: Astronomy engine version mismatch
console.log('\n8. Invalidation upon altered astronomyEngineVersion:');
seedCache('REC_STALE_ASTRO_VER', { astronomyEngineVersion: '1.0.0-legacy' });
const missAstroVer = getCachedPrediction('REC_STALE_ASTRO_VER', validHash);
assert(missAstroVer === null, 'Stale astronomyEngineVersion rejects cache entry');

// Test 9: Model coefficients hash mismatch (P1-1)
console.log('\n9. Invalidation upon altered modelCoefficientsHash:');
seedCache('REC_STALE_COEFF_HASH', { modelCoefficientsHash: 'stale_coefficients_hash_55555555555555555555555555555555' });
const missCoeff = getCachedPrediction('REC_STALE_COEFF_HASH', validHash);
assert(missCoeff === null, 'Stale modelCoefficientsHash rejects cache entry');

// Clean up
try {
  if (fs.existsSync(TEMP_CACHE)) fs.unlinkSync(TEMP_CACHE);
} catch {
  // ignore
}

console.log('\n============================================================');
console.log(` Results: ${passed} passed, ${failed} failed`);
console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
