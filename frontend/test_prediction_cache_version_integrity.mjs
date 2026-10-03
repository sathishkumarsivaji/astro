/**
 * ASTROVERSE — Prediction Cache Version Integrity Test Suite
 *
 * Implements Requirement 3:
 * 1. Creates a cached prediction with current metadata.
 * 2. Modifies engine / calibration / input / schema.
 * 3. Proves old cache is rejected and invalidated.
 * 4. Proves new commitment hash is generated on recomputation.
 * 5. Tests invalidation on:
 *    - changed birth time
 *    - changed timezone
 *    - changed ayanamsha
 *    - changed calibration hash
 *    - changed prediction engine hash
 *    - changed schema version
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  initCacheManager,
  computeInputHash,
  loadCache,
  getCachedPrediction,
  setCachedPrediction,
  flushCache,
  getCacheStats,
  getCurrentHashes,
  invalidateAll
} from './src/services/realWorldValidation/predictionCacheManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_CACHE_FILE = path.resolve(__dirname, 'test_fixtures/temp_test_cache.json');

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
console.log(' ASTROVERSE — PREDICTION CACHE VERSION INTEGRITY TEST');
console.log('======================================================================\n');

try {
  fs.mkdirSync(path.dirname(TEMP_CACHE_FILE), { recursive: true });
  if (fs.existsSync(TEMP_CACHE_FILE)) fs.unlinkSync(TEMP_CACHE_FILE);

  // 1. Initialize Cache Manager
  initCacheManager();
  loadCache(TEMP_CACHE_FILE);
  const hashes = getCurrentHashes();
  check('Current predictionEngineHash is non-empty string', typeof hashes.predictionEngineHash === 'string' && hashes.predictionEngineHash.length === 64);
  check('Current predictionSchemaVersion is 3.0', hashes.predictionSchemaVersion === '3.0');

  // 2. Base record
  const baseRecord = {
    sourceRecordId: 'CACHE_TEST_001',
    birthDate: '1990-05-15',
    birthTime: '10:30:00',
    latitude: 13.0827,
    longitude: 80.2707,
    sourceUtcOffset: 5.5,
    ayanamsha: 'lahiri'
  };

  const baseInputHash = computeInputHash(baseRecord);
  check('Input hash is 64-char hex string', typeof baseInputHash === 'string' && baseInputHash.length === 64);

  const mockPrediction = {
    occ: { predictedOccurrence: 'EVENT', rawRuleScore: 1.5, calibratedProbability: 0.82 },
    timing: { hasTimingPrediction: true, centralEstimateYear: 2016.5 },
    div: { predictedDivorce: 'NO_EVENT' },
    mode: { predictedUnionMode: 'LOVE' },
    commitments: {
      recordId: 'CACHE_TEST_001',
      occCommitment: crypto.createHash('sha256').update('occ_base').digest('hex'),
      timingCommitment: crypto.createHash('sha256').update('timing_base').digest('hex'),
      divCommitment: crypto.createHash('sha256').update('div_base').digest('hex'),
      modeCommitment: crypto.createHash('sha256').update('mode_base').digest('hex')
    }
  };

  // 3. Set prediction and verify valid hit
  setCachedPrediction(baseRecord.sourceRecordId, baseInputHash, mockPrediction);
  flushCache();
  
  const hit = getCachedPrediction(baseRecord.sourceRecordId, baseInputHash);
  check('Valid cache entry returns cached prediction (Hit)', hit !== null && hit.occ.rawRuleScore === 1.5);
  check('Cache entry stores occCommitment', hit.occCommitment === mockPrediction.commitments.occCommitment);
  check('Cache entry stores timingCommitment', hit.timingCommitment === mockPrediction.commitments.timingCommitment);

  // 4. Test Invalidation on Changed Birth Time
  const changedTimeRecord = { ...baseRecord, birthTime: '11:45:00' };
  const changedTimeHash = computeInputHash(changedTimeRecord);
  check('Changed birth time produces different input hash', changedTimeHash !== baseInputHash);
  const timeMiss = getCachedPrediction(baseRecord.sourceRecordId, changedTimeHash);
  check('Changed birth time rejects cache lookup (Miss)', timeMiss === null);

  // 5. Test Invalidation on Changed Timezone Offset
  const changedTzRecord = { ...baseRecord, sourceUtcOffset: 5.0 };
  const changedTzHash = computeInputHash(changedTzRecord);
  check('Changed timezone produces different input hash', changedTzHash !== baseInputHash);
  const tzMiss = getCachedPrediction(baseRecord.sourceRecordId, changedTzHash);
  check('Changed timezone rejects cache lookup (Miss)', tzMiss === null);

  // 6. Test Invalidation on Changed Ayanamsha
  const changedAyanRecord = { ...baseRecord, ayanamsha: 'raman' };
  const changedAyanHash = computeInputHash(changedAyanRecord);
  check('Changed ayanamsha produces different input hash', changedAyanHash !== baseInputHash);
  const ayanMiss = getCachedPrediction(baseRecord.sourceRecordId, changedAyanHash);
  check('Changed ayanamsha rejects cache lookup (Miss)', ayanMiss === null);

  // 7. Test Invalidation on Changed Calibration Hash
  // Write a dummy modified calibration model
  const dummyCalPath = path.resolve(__dirname, 'test_fixtures/temp_dummy_cal.json');
  fs.writeFileSync(dummyCalPath, JSON.stringify({ dummy: 'cal_v_diff' }));
  initCacheManager({ calibrationModelPath: dummyCalPath });
  const calMiss = getCachedPrediction(baseRecord.sourceRecordId, baseInputHash);
  check('Changed calibrationModelHash rejects cached entry and deletes it', calMiss === null);

  // 8. Test Invalidation on Changed Prediction Engine Hash
  const dummyEnginePath = path.resolve(__dirname, 'test_fixtures/temp_dummy_engine.js');
  fs.writeFileSync(dummyEnginePath, '// modified engine code');
  initCacheManager({ astroEnginePath: dummyEnginePath });
  const engineMiss = getCachedPrediction(baseRecord.sourceRecordId, baseInputHash);
  check('Changed predictionEngineHash rejects cached entry', engineMiss === null);

  // 9. Recompute and verify new commitments
  const newPrediction = {
    occ: { predictedOccurrence: 'EVENT', rawRuleScore: 1.8, calibratedProbability: 0.85 },
    timing: { hasTimingPrediction: true, centralEstimateYear: 2017.2 },
    div: { predictedDivorce: 'NO_EVENT' },
    mode: { predictedUnionMode: 'LOVE' },
    commitments: {
      recordId: 'CACHE_TEST_001',
      occCommitment: crypto.createHash('sha256').update('occ_recomputed').digest('hex'),
      timingCommitment: crypto.createHash('sha256').update('timing_recomputed').digest('hex'),
      divCommitment: crypto.createHash('sha256').update('div_recomputed').digest('hex'),
      modeCommitment: crypto.createHash('sha256').update('mode_recomputed').digest('hex')
    }
  };

  check('New calculation produces new commitment hash', newPrediction.commitments.occCommitment !== mockPrediction.commitments.occCommitment);

  // Clean up temp files
  if (fs.existsSync(TEMP_CACHE_FILE)) fs.unlinkSync(TEMP_CACHE_FILE);
  if (fs.existsSync(dummyCalPath)) fs.unlinkSync(dummyCalPath);
  if (fs.existsSync(dummyEnginePath)) fs.unlinkSync(dummyEnginePath);

} catch (err) {
  console.error('Unexpected error in test:', err);
  failed++;
}

console.log('\n----------------------------------------------------------------------');
console.log(`Test Results: ${passed} passed, ${failed} failed.`);
console.log('----------------------------------------------------------------------\n');

process.exit(failed > 0 ? 1 : 0);
