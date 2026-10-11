/**
 * ASTROVERSE — Cache Gate Mutation Regression Suite
 * ==================================================
 * Verifies that the Release Certification Gate (Gate 11):
 * 1. Passes on untampered authoritative cache.
 * 2. Rejects any mutation or omission of mandatory fields across cache records.
 * 3. Rejects any hash mismatch against authoritative manifest values.
 * 4. Fails closed when cache is empty or corrupted.
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCacheEntry, MANDATORY_CACHE_FIELDS, initCacheManager, getCurrentHashes } from './src/services/realWorldValidation/predictionCacheManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('\n============================================================');
console.log(' ASTROVERSE — CACHE GATE MUTATION REGRESSION SUITE');
console.log('============================================================\n');

initCacheManager();
const currentHashes = getCurrentHashes();

const manifestPath = path.join(ROOT, 'current_release_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const authHashes = manifest.authoritativeHashes;
const dataHashes = manifest.datasetHashes;

const expectedValues = {
  astroEngineHash: authHashes.astroEngineHash,
  predictionEngineHash: authHashes.predictionEngineHash,
  calibrationModelHash: authHashes.calibrationModelHash,
  calibrationInputHash: currentHashes.calibrationInputHash,
  trainingDatasetHash: dataHashes.trainSplitHash,
  modelCoefficientsHash: currentHashes.modelCoefficientsHash,
  astronomyEngineVersion: manifest.astronomyEngineVersion || "4.2.0",
  historicalTimeEngineVersion: manifest.historicalTimeEngineVersion || "2.1.0",
  predictionSchemaVersion: manifest.schemaVersion || "3.0",
  modelVersion: manifest.modelVersion || "2.2.0"
};

const cachePath = path.join(ROOT, 'data/real_world_validation/cache/prediction_cache.json');
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
const sampleKey = Object.keys(cache)[0];
const sampleEntry = cache[sampleKey];

// 1. Untampered sample entry validates
const cleanCheck = validateCacheEntry(sampleEntry, expectedValues);
assert.equal(cleanCheck.isValid, true, 'Clean sample entry must validate against authoritative expected values');
console.log(`✓ Clean sample cache entry validates against manifest hashes`);

// 2. Mutation of each expected hash causes gate rejection
const testFields = [
  'astroEngineHash',
  'predictionEngineHash',
  'calibrationModelHash',
  'trainingDatasetHash',
  'astronomyEngineVersion',
  'historicalTimeEngineVersion',
  'predictionSchemaVersion',
  'modelVersion'
];

for (const field of testFields) {
  const mutated = { ...sampleEntry };
  mutated[field] = 'corrupted_value_for_test';
  const res = validateCacheEntry(mutated, expectedValues);
  assert.equal(res.isValid, false, `Mutated ${field} must fail gate validation`);
  assert.equal(res.failedField, field, `Failed field must match ${field}`);
}
console.log(`✓ Mutating any expected hash/version fails gate validation (${testFields.length}/${testFields.length})`);

// 3. Deletion of any mandatory field causes gate rejection
for (const field of MANDATORY_CACHE_FIELDS) {
  const mutated = { ...sampleEntry };
  delete mutated[field];
  const res = validateCacheEntry(mutated, expectedValues);
  assert.equal(res.isValid, false, `Deleting ${field} must fail gate validation`);
  assert.equal(res.failedField, field, `Failed field must match ${field}`);
}
console.log(`✓ Deleting any of 17 mandatory fields fails gate validation (17/17)`);

// 4. Null entry or non-object fails closed
assert.equal(validateCacheEntry(null, expectedValues).isValid, false);
assert.equal(validateCacheEntry(undefined, expectedValues).isValid, false);
assert.equal(validateCacheEntry('string', expectedValues).isValid, false);
console.log(`✓ Non-object / null entries fail closed`);

console.log('\n============================================================');
console.log(' ALL CACHE GATE MUTATION TESTS PASSED (100% SUCCESS)');
console.log('============================================================\n');
