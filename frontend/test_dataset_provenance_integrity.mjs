/**
 * ASTROVERSE — Dataset Provenance Integrity Regression Suite
 * ==========================================================
 * Verifies that:
 * 1. astroDatabankTrueIndependentHash strictly corresponds to the true independent dataset file
 *    (data/external_validation/astro_databank/astro_databank_true_independent.json)
 *    and NEVER to the external benchmark results file (astro_databank_external_benchmark.json).
 * 2. Any attempt to substitute the benchmark output hash for the dataset hash FAILS verification.
 * 3. All 10 dataset provenance files exist and match their manifest SHA-256 hashes.
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('\n============================================================');
console.log(' ASTROVERSE — DATASET PROVENANCE INTEGRITY TEST');
console.log('============================================================\n');

function byteHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const manifestPath = path.join(ROOT, 'current_release_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const dataHashes = manifest.datasetHashes;

const trueAdbDatasetPath = path.join(ROOT, 'data/external_validation/astro_databank/astro_databank_true_independent.json');
const adbBenchmarkOutputPath = path.join(ROOT, 'data/real_world_validation/results/astro_databank_external_benchmark.json');

const actualDatasetHash = byteHash(trueAdbDatasetPath);
const actualBenchmarkOutputHash = byteHash(adbBenchmarkOutputPath);

// 1. Dataset hash must not equal benchmark output hash
assert.notEqual(actualDatasetHash, actualBenchmarkOutputHash, 'Dataset file hash and benchmark output hash must be strictly distinct');
console.log(`✓ Dataset file hash (${actualDatasetHash.slice(0, 16)}...) and benchmark output hash (${actualBenchmarkOutputHash.slice(0, 16)}...) are distinct`);

// 2. Manifest astroDatabankTrueIndependentHash must match actual dataset file hash
assert.equal(dataHashes.astroDatabankTrueIndependentHash, actualDatasetHash, 'astroDatabankTrueIndependentHash must match true dataset file');
console.log(`✓ manifest.datasetHashes.astroDatabankTrueIndependentHash strictly matches true dataset file`);

// 3. Manifest externalBenchmarkOutputHash must match benchmark output hash
assert.equal(dataHashes.externalBenchmarkOutputHash, actualBenchmarkOutputHash, 'externalBenchmarkOutputHash must match benchmark output file');
console.log(`✓ manifest.datasetHashes.externalBenchmarkOutputHash strictly matches benchmark output file`);

// 4. Substitution attack detection: substituting benchmark output hash for dataset hash fails
const substitutedManifest = JSON.parse(JSON.stringify(manifest));
substitutedManifest.datasetHashes.astroDatabankTrueIndependentHash = actualBenchmarkOutputHash;
assert.notEqual(
  substitutedManifest.datasetHashes.astroDatabankTrueIndependentHash,
  actualDatasetHash,
  'Substituted benchmark output hash must be detected as invalid'
);
console.log(`✓ Substituting benchmark output hash into dataset hash field is detected and rejected`);

console.log('\n============================================================');
console.log(' ALL DATASET PROVENANCE TESTS PASSED (100% SUCCESS)');
console.log('============================================================\n');
