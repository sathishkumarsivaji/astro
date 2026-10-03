import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentPredictionEngineHash = null;
let currentCalibrationModelHash = null;
const predictionSchemaVersion = '3.0';
const modelVersion = '2.2.0';
const astronomyEngineVersion = '4.2.0';
const historicalTimeEngineVersion = '1.0.0';

let predictionCache = {};
let cacheStats = { hits: 0, misses: 0, invalidated: 0, total: 0 };
let cacheFilePath = null;

function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function initCacheManager(options = {}) {
  const astroEnginePath = options.astroEnginePath || path.resolve(__dirname, '../../astroEngine.js');
  const evalEnginePath = options.evalEnginePath || path.resolve(__dirname, './empiricalEvaluationEngine.js');
  const calibrationModelPath = options.calibrationModelPath || path.resolve(__dirname, '../../../../data/real_world_validation/results/calibration_model.json');

  const h1 = computeFileHash(astroEnginePath) || '';
  const h2 = computeFileHash(evalEnginePath) || '';
  currentPredictionEngineHash = crypto.createHash('sha256').update(h1 + h2).digest('hex');
  
  currentCalibrationModelHash = computeFileHash(calibrationModelPath);
}

export function computeInputHash(record) {
  const payload = [
    record.birthDate || '',
    record.birthTime || '',
    record.latitude || '',
    record.longitude || '',
    record.sourceUtcOffset ?? record.utcOffset ?? '',
    record.ayanamsha || 'lahiri'
  ].join('|');
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function loadCache(filePath) {
  cacheFilePath = filePath;
  predictionCache = {};
  cacheStats = { hits: 0, misses: 0, invalidated: 0, total: 0 };
  if (fs.existsSync(filePath)) {
    try {
      predictionCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      cacheStats.total = Object.keys(predictionCache).length;
    } catch (e) {
      console.warn("Could not parse prediction cache:", e.message);
      predictionCache = {};
    }
  }
}

export function getCachedPrediction(recordId, inputHash) {
  const cached = predictionCache[recordId];
  if (!cached) {
    cacheStats.misses++;
    return null;
  }
  
  const isValid = 
    cached.inputHash === inputHash &&
    cached.predictionEngineHash === currentPredictionEngineHash &&
    cached.calibrationModelHash === currentCalibrationModelHash &&
    cached.astronomyEngineVersion === astronomyEngineVersion &&
    cached.predictionSchemaVersion === predictionSchemaVersion;
    
  if (!isValid) {
    cacheStats.invalidated++;
    delete predictionCache[recordId];
    return null;
  }
  
  cacheStats.hits++;
  return cached;
}

export function setCachedPrediction(recordId, inputHash, prediction) {
  const occCommitment = prediction.commitments?.occCommitment || prediction.occ?.commitmentHash || null;
  const timingCommitment = prediction.commitments?.timingCommitment || prediction.timing?.commitmentHash || null;
  const divorceCommitment = prediction.commitments?.divCommitment || prediction.div?.commitmentHash || null;
  const unionCommitment = prediction.commitments?.modeCommitment || prediction.mode?.commitmentHash || null;

  predictionCache[recordId] = {
    recordId,
    inputHash,
    predictionEngineHash: currentPredictionEngineHash,
    calibrationModelHash: currentCalibrationModelHash,
    astronomyEngineVersion,
    historicalTimeEngineVersion,
    predictionSchemaVersion,
    modelVersion,
    generatedAt: new Date().toISOString(),
    occCommitment,
    timingCommitment,
    divorceCommitment,
    unionCommitment,
    occ: prediction.occ,
    timing: prediction.timing,
    div: prediction.div,
    mode: prediction.mode,
    commitments: prediction.commitments || {
      recordId,
      occCommitment,
      timingCommitment,
      divCommitment: divorceCommitment,
      modeCommitment: unionCommitment
    }
  };
  cacheStats.total = Object.keys(predictionCache).length;
}

export function flushCache() {
  if (cacheFilePath) {
    fs.mkdirSync(path.dirname(cacheFilePath), { recursive: true });
    fs.writeFileSync(cacheFilePath, JSON.stringify(predictionCache, null, 2));
  }
}

export function getCacheStats() {
  return { ...cacheStats };
}

export function getCurrentHashes() {
  return {
    predictionEngineHash: currentPredictionEngineHash,
    calibrationModelHash: currentCalibrationModelHash,
    predictionSchemaVersion
  };
}

export function invalidateAll() {
  predictionCache = {};
  cacheStats = { hits: 0, misses: 0, invalidated: 0, total: 0 };
}
