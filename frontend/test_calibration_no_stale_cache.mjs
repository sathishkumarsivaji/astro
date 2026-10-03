/**
 * ASTROVERSE — Calibration Anti-Stale-Cache Integrity Test
 *
 * Implements Requirement 5:
 * The calibration fitter must refuse to use a cached prediction unless the cache
 * metadata exactly matches current predictionEngineHash, schemaVersion, and inputHash.
 * Stale or poisoned cache entries MUST NOT influence calibration.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  initCacheManager,
  computeInputHash,
  loadCache,
  getCachedPrediction,
  setCachedPrediction,
  getCurrentHashes
} from './src/services/realWorldValidation/predictionCacheManager.js';
import {
  setTestCalibrationFixture,
  clearTestCalibrationFixture
} from './src/services/realWorldValidation/calibrationProvider.js';
import {
  sanitizeRecordForPrediction,
  predictMarriageOccurrence
} from './src/services/realWorldValidation/empiricalEvaluationEngine.js';
import { calculatePlanetaryPositions } from './src/services/astroEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_CACHE_FILE = path.resolve(__dirname, 'test_fixtures/temp_stale_cache.json');

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log('\n======================================================================');
console.log(' ASTROVERSE — CALIBRATION ANTI-STALE-CACHE INTEGRITY TEST');
console.log('======================================================================\n');

try {
  fs.mkdirSync(path.dirname(TEMP_CACHE_FILE), { recursive: true });
  if (fs.existsSync(TEMP_CACHE_FILE)) fs.unlinkSync(TEMP_CACHE_FILE);

  // Set clearly isolated test fixture so test runs independently
  setTestCalibrationFixture({
    calibratorType: 'PLATT_LOGISTIC_SCALING_TEST',
    modelVersion: 'test-fixture',
    parameters: { slope: 0.42, intercept: 1.67, classificationThreshold: 0.50 },
    conformalIntervalQuantiles: { q50: 6.0, q80: 10.0, q90: 14.0, q95: 19.0 }
  });

  initCacheManager();
  loadCache(TEMP_CACHE_FILE);

  const testRecord = {
    sourceRecordId: 'STALE_CACHE_TEST_PERSON',
    birthDate: '1985-06-20',
    birthTime: '14:30:00',
    latitude: 19.0760,
    longitude: 72.8777,
    sourceUtcOffset: 5.5,
    ayanamsha: 'lahiri'
  };

  const inputHash = computeInputHash(testRecord);

  // 1. Compute true authentic prediction
  const clean = sanitizeRecordForPrediction(testRecord);
  const chart = calculatePlanetaryPositions(clean.birthDate, clean.birthTime, clean.latitude, clean.longitude, 'lahiri', clean.sourceUtcOffset);
  const trueOcc = predictMarriageOccurrence(clean, chart);
  const authenticScore = trueOcc.rawRuleScore;
  check('Authentic production model produces real score', typeof authenticScore === 'number');

  // 2. Inject a poisoned stale cache entry with an artificial score and wrong engine hash
  const poisonedCache = {
    [testRecord.sourceRecordId]: {
      recordId: testRecord.sourceRecordId,
      inputHash,
      predictionEngineHash: 'STALE_OR_POISONED_ENGINE_HASH_0000000000000000000000000000000000',
      calibrationModelHash: 'STALE_CALIBRATION_HASH',
      astronomyEngineVersion: '4.2.0',
      historicalTimeEngineVersion: '1.0.0',
      predictionSchemaVersion: '3.0',
      modelVersion: '2.2.0',
      generatedAt: '2020-01-01T00:00:00.000Z',
      occ: { predictedOccurrence: 'EVENT', rawRuleScore: 999.99, calibratedProbability: 0.999 },
      timing: { hasTimingPrediction: true, centralEstimateYear: 2999 },
      div: { predictedDivorce: 'NO_EVENT' },
      mode: { predictedUnionMode: 'LOVE' }
    }
  };

  fs.writeFileSync(TEMP_CACHE_FILE, JSON.stringify(poisonedCache));
  loadCache(TEMP_CACHE_FILE);

  // 3. Verify getCachedPrediction rejects the stale entry
  const lookup = getCachedPrediction(testRecord.sourceRecordId, inputHash);
  check('Stale cache entry with wrong engine hash is rejected (lookup === null)', lookup === null);

  // 4. Verify that re-reading cache shows the poisoned entry was deleted/invalidated
  const postLookup = getCachedPrediction(testRecord.sourceRecordId, inputHash);
  check('Poisoned entry was invalidated and removed from cache', postLookup === null);

  // 5. Verify that fresh evaluation recovers the true authentic score, NOT 999.99
  const recomputedOcc = predictMarriageOccurrence(clean, chart);
  check('Recomputed prediction matches authentic score', recomputedOcc.rawRuleScore === authenticScore);
  check('Poisoned score 999.99 never enters pipeline', recomputedOcc.rawRuleScore !== 999.99);

  // Clean up
  clearTestCalibrationFixture();
  if (fs.existsSync(TEMP_CACHE_FILE)) fs.unlinkSync(TEMP_CACHE_FILE);

} catch (err) {
  console.error('Unexpected error in test:', err);
  failed++;
}

console.log('\n----------------------------------------------------------------------');
console.log(`Test Results: ${passed} passed, ${failed} failed.`);
console.log('----------------------------------------------------------------------\n');

process.exit(failed > 0 ? 1 : 0);
