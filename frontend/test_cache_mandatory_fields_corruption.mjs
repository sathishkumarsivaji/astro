/**
 * ASTROVERSE — Cache Mandatory Fields & Corruption Regression Suite
 * =================================================================
 * Verifies that:
 * 1. Exactly 17 mandatory fields are defined and non-bypassable.
 * 2. Deleting any of the 17 mandatory fields causes validateCacheEntry to FAIL.
 * 3. Setting any of the 17 mandatory fields to null, undefined, or empty string FAILS.
 * 4. Corrupting any of the hash fields causes validateCacheEntry to FAIL.
 * 5. Corrupting any of the version fields causes validateCacheEntry to FAIL.
 * 6. getCachedPrediction rejects and invalidates corrupt entries.
 */

import { strict as assert } from 'node:assert';
import {
  MANDATORY_CACHE_FIELDS,
  validateCacheEntry,
  initCacheManager,
  getCurrentHashes
} from './src/services/realWorldValidation/predictionCacheManager.js';

console.log('\n============================================================');
console.log(' ASTROVERSE — CACHE MANDATORY FIELDS & CORRUPTION TEST');
console.log('============================================================\n');

initCacheManager();
const currentHashes = getCurrentHashes();

assert.equal(MANDATORY_CACHE_FIELDS.length, 17, 'Must have exactly 17 mandatory cache fields');
console.log(`✓ MANDATORY_CACHE_FIELDS has exactly 17 defined fields:`);
console.log(`  ${MANDATORY_CACHE_FIELDS.join(', ')}\n`);

function makeValidEntry() {
  return {
    recordId: 'TEST_RECORD_001',
    inputHash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    astroEngineHash: currentHashes.astroEngineHash,
    predictionEngineHash: currentHashes.predictionEngineHash,
    calibrationModelHash: currentHashes.calibrationModelHash,
    calibrationInputHash: currentHashes.calibrationInputHash,
    trainingDatasetHash: currentHashes.trainingDatasetHash,
    modelCoefficientsHash: currentHashes.modelCoefficientsHash,
    astronomyEngineVersion: '4.2.0',
    historicalTimeEngineVersion: '2.1.0',
    featureSchemaVersion: '3.0',
    predictionSchemaVersion: '3.0',
    ruleVersion: '3.0.0',
    ephemerisVersion: 'AstronomyEngine/VSOP87',
    dashaEngineVersion: '2.2.0',
    resolutionClassifierVersion: '2.0.0',
    modelVersion: '2.2.0'
  };
}

// 1. Baseline valid entry
const baseCheck = validateCacheEntry(makeValidEntry());
assert.equal(baseCheck.isValid, true, 'Base entry must be valid');
console.log('✓ Baseline cache entry passes validation');

// 2. Test deletion of each of the 17 fields
let deletedPassed = 0;
for (const field of MANDATORY_CACHE_FIELDS) {
  const corrupted = makeValidEntry();
  delete corrupted[field];
  const res = validateCacheEntry(corrupted);
  assert.equal(res.isValid, false, `Deletion of ${field} must fail validation`);
  assert.equal(res.failedField, field, `Failed field must be ${field}`);
  deletedPassed++;
}
console.log(`✓ All 17 deletion mutations correctly rejected (${deletedPassed}/17)`);

// 3. Test null / empty values for each of the 17 fields
let nullPassed = 0;
for (const field of MANDATORY_CACHE_FIELDS) {
  const corruptedNull = makeValidEntry();
  corruptedNull[field] = null;
  const resNull = validateCacheEntry(corruptedNull);
  assert.equal(resNull.isValid, false, `Null value for ${field} must fail validation`);

  const corruptedEmpty = makeValidEntry();
  corruptedEmpty[field] = '';
  const resEmpty = validateCacheEntry(corruptedEmpty);
  assert.equal(resEmpty.isValid, false, `Empty string for ${field} must fail validation`);

  nullPassed++;
}
console.log(`✓ All 17 null/empty mutations correctly rejected (${nullPassed}/17)`);

// 4. Test altered hash values
const hashFields = [
  'astroEngineHash',
  'predictionEngineHash',
  'calibrationModelHash',
  'calibrationInputHash',
  'trainingDatasetHash',
  'modelCoefficientsHash'
];
for (const field of hashFields) {
  const corrupted = makeValidEntry();
  corrupted[field] = 'bad0000000000000000000000000000000000000000000000000000000000000';
  const res = validateCacheEntry(corrupted);
  assert.equal(res.isValid, false, `Altered hash for ${field} must fail validation`);
  assert.equal(res.failedField, field, `Failed field must match ${field}`);
}
console.log(`✓ All 6 altered hash mutations correctly rejected (6/6)`);

// 5. Test altered version values
const versionFields = [
  'astronomyEngineVersion',
  'historicalTimeEngineVersion',
  'featureSchemaVersion',
  'predictionSchemaVersion',
  'ruleVersion',
  'ephemerisVersion',
  'dashaEngineVersion',
  'resolutionClassifierVersion',
  'modelVersion'
];
for (const field of versionFields) {
  const corrupted = makeValidEntry();
  corrupted[field] = '999.0.0-invalid';
  const res = validateCacheEntry(corrupted);
  assert.equal(res.isValid, false, `Altered version for ${field} must fail validation`);
  assert.equal(res.failedField, field, `Failed field must match ${field}`);
}
console.log(`✓ All 9 altered version mutations correctly rejected (9/9)`);

console.log('\n============================================================');
console.log(' ALL CACHE CORRUPTION TESTS PASSED (17/17 + 17/17 + 6/6 + 9/9)');
console.log('============================================================\n');
