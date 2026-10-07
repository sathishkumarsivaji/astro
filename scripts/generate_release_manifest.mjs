/**
 * ASTROVERSE — Authoritative Release Manifest Generator
 *
 * Programmatically computes current runtime component hashes (LF-normalized)
 * and dataset partition hashes, and writes the authoritative current_release_manifest.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function lfHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function byteHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function generateReleaseManifest() {
  const astroEnginePath = path.join(ROOT, 'frontend/src/services/astroEngine.js');
  const empiricalEvaluationEnginePath = path.join(ROOT, 'frontend/src/services/realWorldValidation/empiricalEvaluationEngine.js');
  const discreteHazardSurvivalEnginePath = path.join(ROOT, 'frontend/src/services/realWorldValidation/discreteHazardSurvivalEngine.js');
  const calibrationModelPath = path.join(ROOT, 'data/real_world_validation/results/calibration_model.json');

  const astroEngineHash = lfHash(astroEnginePath);
  const empiricalEvaluationEngineHash = lfHash(empiricalEvaluationEnginePath);
  const discreteHazardSurvivalEngineHash = lfHash(discreteHazardSurvivalEnginePath);
  const predictionEngineHash = crypto.createHash('sha256')
    .update(astroEngineHash + empiricalEvaluationEngineHash + discreteHazardSurvivalEngineHash, 'utf8')
    .digest('hex');
  const calibrationModelHash = byteHash(calibrationModelPath);

  const trainSplitHash = byteHash(path.join(ROOT, 'data/real_world_validation/splits/train.json'));
  const valSplitHash = byteHash(path.join(ROOT, 'data/real_world_validation/splits/val.json'));
  const blindTestSplitHash = byteHash(path.join(ROOT, 'data/real_world_validation/splits/blind_test.json'));
  const internalHoldoutSplitHash = byteHash(path.join(ROOT, 'data/real_world_validation/splits/internal_holdout.json'));
  const astroDatabankTrueIndependentHash = byteHash(path.join(ROOT, 'data/real_world_validation/results/astro_databank_external_benchmark.json'));
  const overlapManifestHash = byteHash(path.join(ROOT, 'data/real_world_validation/splits/split_manifest.json'));

  const nowIso = new Date().toISOString();
  const manifest = {
    releaseVersion: "3.0.0",
    modelVersion: "2.2.0",
    schemaVersion: "3.0",
    astronomyEngineVersion: "4.2.0",
    historicalTimeEngineVersion: "2.1.0",
    generatedAt: nowIso,
    status: {
      astronomicalEngine: "CALCULATION_VALIDATED",
      softwareInfrastructure: "SOFTWARE_VALIDATED",
      traditionalRuleEngine: "TRADITIONAL_RULE_FRAMEWORK_VERIFIED",
      empiricalPrediction: "EXPERIMENTAL_NOT_EMPIRICALLY_VALIDATED"
    },
    authoritativeHashes: {
      astroEngineHash,
      empiricalEvaluationEngineHash,
      discreteHazardSurvivalEngineHash,
      predictionEngineHash,
      calibrationModelHash
    },
    datasetHashes: {
      trainSplitHash,
      valSplitHash,
      blindTestSplitHash,
      internalHoldoutSplitHash,
      astroDatabankTrueIndependentHash,
      overlapManifestHash
    },
    updatedAt: nowIso
  };

  const manifestPath = path.join(ROOT, 'current_release_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('✓ current_release_manifest.json successfully generated.');

  const feManifestPath = path.join(ROOT, 'frontend/src/config/current_release_manifest.json');
  fs.writeFileSync(feManifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('✓ frontend/src/config/current_release_manifest.json mirrored.');
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateReleaseManifest();
}
