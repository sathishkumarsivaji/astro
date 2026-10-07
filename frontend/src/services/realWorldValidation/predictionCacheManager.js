import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentAstroEngineHash = null;
let currentPredictionEngineHash = null;
let currentCalibrationModelHash = null;
let currentCalibrationInputHash = null;
let currentTrainingDatasetHash = null;
let currentModelCoefficientsHash = null;

const predictionSchemaVersion = '3.0';
const modelVersion = '2.2.0';
const astronomyEngineVersion = '4.2.0';
const historicalTimeEngineVersion = '2.1.0';
const featureSchemaVersion = '3.0';
const ruleVersion = '3.0.0';
const ephemerisVersion = 'AstronomyEngine/VSOP87';
const dashaEngineVersion = '2.2.0';
const resolutionClassifierVersion = '2.0.0';

let predictionCache = {};
let cacheStats = { hits: 0, misses: 0, invalidated: 0, total: 0 };
let cacheFilePath = null;

function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  if (/\.(js|jsx|mjs|json|md|txt)$/i.test(filePath)) {
    const text = content.toString('utf8').replace(/\r\n/g, '\n');
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
  }
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function initCacheManager(options = {}) {
  const astroEnginePath = options.astroEnginePath || path.resolve(__dirname, '../astroEngine.js');
  const evalEnginePath = options.evalEnginePath || path.resolve(__dirname, './empiricalEvaluationEngine.js');
  const hazardEnginePath = options.hazardEnginePath || path.resolve(__dirname, './discreteHazardSurvivalEngine.js');
  const calibrationModelPath = options.calibrationModelPath || path.resolve(__dirname, '../../../../data/real_world_validation/results/calibration_model.json');
  const trainingDatasetPath = options.trainingDatasetPath || path.resolve(__dirname, '../../../../data/real_world_validation/splits/train.json');
  const benchmarkResultsPath = options.benchmarkResultsPath || path.resolve(__dirname, '../../config/latestBenchmarkResults.json');

  currentAstroEngineHash = computeFileHash(astroEnginePath) || '';
  const h2 = computeFileHash(evalEnginePath) || '';
  const h3 = computeFileHash(hazardEnginePath) || '';
  currentPredictionEngineHash = crypto.createHash('sha256').update(currentAstroEngineHash + h2 + h3).digest('hex');
  
  currentCalibrationModelHash = computeFileHash(calibrationModelPath);
  currentTrainingDatasetHash = computeFileHash(trainingDatasetPath);

  if (fs.existsSync(benchmarkResultsPath)) {
    try {
      const benchData = JSON.parse(fs.readFileSync(benchmarkResultsPath, 'utf8'));
      currentModelCoefficientsHash = benchData.provenance?.coefficientHash || benchData.discreteHazardModelV3?.trainFit?.sampleProvenance?.coefficientHash || benchData.discreteHazardModelV3?.coefficientHash || benchData.provenance?.modelFitHash || benchData.discreteHazardModelV3?.modelFitHash || null;
    } catch {
      currentModelCoefficientsHash = null;
    }
  }

  if (fs.existsSync(calibrationModelPath)) {
    try {
      const modelData = JSON.parse(fs.readFileSync(calibrationModelPath, 'utf8'));
      currentCalibrationInputHash = modelData.calibrationInputHash || null;
    } catch {
      currentCalibrationInputHash = null;
    }
  } else {
    currentCalibrationInputHash = null;
  }
}

export function computeInputHash(record) {
  const payload = [
    record.birthDate || '',
    record.birthTime || '',
    record.latitude || '',
    record.longitude || '',
    record.sourceUtcOffset ?? record.utcOffset ?? '',
    record.ayanamsha || 'lahiri',
    record.calendar || 'gregorian',
    record.nodeModel || 'true',
    record.houseSystem || 'placidus',
    record.system || 'vedic',
    record.historicalTimeStandard || 'STANDARD_TIME',
    record.calculationVersion || astronomyEngineVersion,
    record.ruleVersion || ruleVersion,
    featureSchemaVersion,
    dashaEngineVersion,
    resolutionClassifierVersion,
    ephemerisVersion
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
      global.__PREDICTION_CACHE__ = predictionCache;
    } catch (e) {
      console.warn("Could not parse prediction cache:", e.message);
      predictionCache = {};
      global.__PREDICTION_CACHE__ = null;
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
    (!currentAstroEngineHash || cached.astroEngineHash === currentAstroEngineHash) &&
    cached.predictionEngineHash === currentPredictionEngineHash &&
    cached.calibrationModelHash === currentCalibrationModelHash &&
    cached.calibrationInputHash === currentCalibrationInputHash &&
    cached.trainingDatasetHash === currentTrainingDatasetHash &&
    (!currentModelCoefficientsHash || cached.modelCoefficientsHash === currentModelCoefficientsHash) &&
    cached.astronomyEngineVersion === astronomyEngineVersion &&
    cached.historicalTimeEngineVersion === historicalTimeEngineVersion &&
    cached.predictionSchemaVersion === predictionSchemaVersion &&
    cached.featureSchemaVersion === featureSchemaVersion &&
    cached.ruleVersion === ruleVersion &&
    cached.ephemerisVersion === ephemerisVersion &&
    cached.dashaEngineVersion === dashaEngineVersion &&
    cached.resolutionClassifierVersion === resolutionClassifierVersion &&
    cached.modelVersion === modelVersion;
    
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

  // Memory safety: strip verbose candidateWindows tree from persisted cache entry
  let compactTiming = prediction.timing;
  if (compactTiming && compactTiming.candidateWindows) {
    const { candidateWindows, ...restTiming } = compactTiming;
    compactTiming = restTiming;
  }

  predictionCache[recordId] = {
    recordId,
    inputHash,
    astroEngineHash: currentAstroEngineHash,
    predictionEngineHash: currentPredictionEngineHash,
    calibrationModelHash: currentCalibrationModelHash,
    calibrationInputHash: currentCalibrationInputHash,
    trainingDatasetHash: currentTrainingDatasetHash,
    modelCoefficientsHash: currentModelCoefficientsHash,
    astronomyEngineVersion,
    historicalTimeEngineVersion,
    predictionSchemaVersion,
    featureSchemaVersion,
    ruleVersion,
    ephemerisVersion,
    dashaEngineVersion,
    resolutionClassifierVersion,
    modelVersion,
    generatedAt: new Date().toISOString(),
    occCommitment,
    timingCommitment,
    divorceCommitment,
    unionCommitment,
    occ: prediction.occ,
    timing: compactTiming,
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
    try {
      fs.mkdirSync(path.dirname(cacheFilePath), { recursive: true });
      const tempPath = `${cacheFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(predictionCache));
      try {
        if (fs.existsSync(cacheFilePath)) {
          fs.unlinkSync(cacheFilePath);
        }
        fs.renameSync(tempPath, cacheFilePath);
      } catch {
        fs.writeFileSync(cacheFilePath, JSON.stringify(predictionCache));
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    } catch (err) {
      console.warn(`Warning: Could not flush cache: ${err.message}`);
    }
  }
}

export function getCacheStats() {
  return { ...cacheStats };
}

export function getCurrentHashes() {
  return {
    predictionEngineHash: currentPredictionEngineHash,
    calibrationModelHash: currentCalibrationModelHash,
    calibrationInputHash: currentCalibrationInputHash,
    trainingDatasetHash: currentTrainingDatasetHash,
    modelCoefficientsHash: currentModelCoefficientsHash,
    predictionSchemaVersion,
    astronomyEngineVersion,
    modelVersion
  };
}

export function invalidateAll() {
  predictionCache = {};
  cacheStats = { hits: 0, misses: 0, invalidated: 0, total: 0 };
}

export function computeSystemFingerprint(overrides = {}) {
  const parts = [
    overrides.astroEngineHash ?? currentAstroEngineHash ?? '',
    overrides.predictionEngineHash ?? currentPredictionEngineHash ?? '',
    overrides.calibrationModelHash ?? currentCalibrationModelHash ?? '',
    overrides.calibrationInputHash ?? currentCalibrationInputHash ?? '',
    overrides.trainingDatasetHash ?? currentTrainingDatasetHash ?? '',
    overrides.modelCoefficientsHash ?? currentModelCoefficientsHash ?? '',
    overrides.astronomyEngineVersion ?? astronomyEngineVersion,
    overrides.historicalTimeEngineVersion ?? historicalTimeEngineVersion,
    overrides.predictionSchemaVersion ?? predictionSchemaVersion,
    overrides.featureSchemaVersion ?? featureSchemaVersion,
    overrides.ruleVersion ?? ruleVersion,
    overrides.ephemerisVersion ?? ephemerisVersion,
    overrides.dashaEngineVersion ?? dashaEngineVersion,
    overrides.resolutionClassifierVersion ?? resolutionClassifierVersion,
    overrides.modelVersion ?? modelVersion
  ];
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

