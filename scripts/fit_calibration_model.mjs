/**
 * ASTROVERSE — Calibration Model Fitting Pipeline (V3 - Actual Production Model Outputs)
 * 
 * Requirements 8, 9 & 10:
 * - Strictly fitted on TRAIN partition (N=9,366)
 * - Fitted on ACTUAL production model outputs: rawRuleScore and centralEstimateYear
 *   (NEVER on synthetic/demographic proxy distributions)
 * - Evaluated/frozen on VALIDATION partition (N=3,155)
 * - NEVER fitted on BLIND or HOLDOUT
 * 
 * Fits:
 * 1. Platt Scaling Logistic Regression for Occurrence Target:
 *    logit = slope * rawRuleScore + intercept
 *    P(marriage) = 1 / (1 + exp(-logit))
 *    Optimized via Newton-Raphson (IRLS) on actual (rawRuleScore, occurrence) pairs.
 * 2. Conformal Prediction Error Quantiles for Timing Intervals:
 *    Computes empirical quantiles of absolute error on actual astrological predictions:
 *    e_i = |centralEstimateYear_i - actualMarriageYear_i|
 *    q50, q80, q90, q95
 *    so nominal 50%, 80%, 90%, 95% intervals reflect true astrological error dispersion.
 * 
 * Outputs:
 * - data/real_world_validation/results/calibration_model.json
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { calculatePlanetaryPositions } from '../frontend/src/services/astroEngine.js';
import {
  sanitizeRecordForPrediction,
  predictMarriageOccurrence,
  predictMarriageTiming,
  getEarliestDocumentedMarriage,
  createSeededPRNG
} from '../frontend/src/services/realWorldValidation/empiricalEvaluationEngine.js';
import {
  initCacheManager,
  loadCache,
  getCachedPrediction,
  setCachedPrediction,
  flushCache,
  computeInputHash,
  getCurrentHashes,
  invalidateAll
} from '../frontend/src/services/realWorldValidation/predictionCacheManager.js';
import {
  setTestCalibrationFixture,
  clearTestCalibrationFixture
} from '../frontend/src/services/realWorldValidation/calibrationProvider.js';

const ROOT = path.resolve(import.meta.dirname || '.', '..');
const TRAIN_PATH = path.join(ROOT, 'data/real_world_validation/splits/train.json');
const VAL_PATH = path.join(ROOT, 'data/real_world_validation/splits/val.json');
const OUTPUT_PATH = path.join(ROOT, 'data/real_world_validation/results/calibration_model.json');
const CACHE_DIR = path.join(ROOT, 'data/real_world_validation/cache');
const PREDICTION_CACHE_FILE = path.join(CACHE_DIR, 'prediction_cache.json');

function computeFileSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function quantile(arr, q) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

export function fitCalibrationModel(sampleSize = 2500) {
  console.log('============================================================');
  console.log('ASTROVERSE — CALIBRATION MODEL FITTER (ACTUAL PRODUCTION OUTPUTS)');
  console.log('============================================================\n');

  // Set bootstrap fixture so uncalibrated raw model scores can be extracted without disk artifact
  setTestCalibrationFixture({
    calibratorType: 'BOOTSTRAP_FITTING_PASS',
    modelVersion: 'bootstrap',
    parameters: { slope: 1.0, intercept: 0.0, classificationThreshold: 0.50 },
    conformalIntervalQuantiles: { q50: 5.0, q80: 10.0, q90: 14.0, q95: 19.0 }
  });

  const trainSha256 = computeFileSha256(TRAIN_PATH);
  const valSha256 = fs.existsSync(VAL_PATH) ? computeFileSha256(VAL_PATH) : null;
  const trainRecords = JSON.parse(fs.readFileSync(TRAIN_PATH, 'utf8'));

  console.log(`1. Loaded TRAIN (N=${trainRecords.length})`);

  // Initialize prediction cache manager
  initCacheManager({ calibrationModelPath: OUTPUT_PATH, trainingDatasetPath: TRAIN_PATH });
  loadCache(PREDICTION_CACHE_FILE);

  // 1. Select reproducible stratified sample of TRAIN (minimum N >= 2,000 per Req 8)
  const prng = createSeededPRNG(133742);
  const targetN = Math.min(sampleSize, trainRecords.length);
  console.log(`2. Sampling N=${targetN} records from TRAIN using deterministic PRNG (seed=133742)...`);

  // Group by strata: (censoringStatus x century)
  const strata = new Map();
  for (const r of trainRecords) {
    const status = r.censoringStatus || 'UNKNOWN';
    const bYear = r.birthYear || 1950;
    const century = bYear < 1900 ? 'pre1900' : (bYear < 1950 ? 'early20th' : 'late20th');
    const key = `${status}_${century}`;
    if (!strata.has(key)) strata.set(key, []);
    strata.get(key).push(r);
  }

  const sample = [];
  const strataKeys = Array.from(strata.keys()).sort();
  for (const key of strataKeys) {
    const group = strata.get(key);
    // Shuffle deterministically
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    const quota = Math.max(1, Math.round((group.length / trainRecords.length) * targetN));
    sample.push(...group.slice(0, quota));
  }

  // Trim or fill to exact targetN
  const finalSample = sample.slice(0, targetN);
  console.log(`   Sample finalized: ${finalSample.length} records across ${strataKeys.length} strata.`);

  // 2. Demographic baseline median age on full TRAIN
  const trainMarriageAges = [];
  for (const r of trainRecords) {
    const m = getEarliestDocumentedMarriage(r);
    if (m && m.marriageYear && r.birthYear) {
      const age = m.marriageYear - r.birthYear;
      if (age >= 15 && age <= 70) {
        trainMarriageAges.push(age);
      }
    }
  }
  trainMarriageAges.sort((a, b) => a - b);
  const trainMedianMarriageAge = trainMarriageAges[Math.floor(trainMarriageAges.length / 2)] || 26.0;
  console.log(`   Train demographic median marriage age: ${trainMedianMarriageAge} years (N=${trainMarriageAges.length}).`);

  // 3. Run production model on sample records
  console.log(`\n3. Running production model on N=${finalSample.length} TRAIN sample records...`);
  const t0 = Date.now();

  const scores = [];
  const labels = [];
  const timingErrors = [];
  let cacheHits = 0;
  let cacheMisses = 0;
  let pendingWrites = 0;

  for (let i = 0; i < finalSample.length; i++) {
    const r = finalSample[i];
    const cacheKey = r.sourceRecordId;
    const inputHash = computeInputHash(r);

    let occ, timing;
    const cached = getCachedPrediction(cacheKey, inputHash);
    
    if (cached) {
      occ = cached.occ;
      timing = cached.timing;
      cacheHits++;
    } else {
      const clean = sanitizeRecordForPrediction(r);
      const chart = calculatePlanetaryPositions(
        clean.birthDate,
        clean.birthTime,
        clean.latitude,
        clean.longitude,
        'lahiri',
        clean.sourceUtcOffset
      );
      occ = predictMarriageOccurrence(clean, chart);
      timing = predictMarriageTiming(clean, chart);

      setCachedPrediction(cacheKey, inputHash, {
        occ,
        timing,
        commitments: {
          recordId: clean.sourceRecordId,
          occCommitment: occ.commitmentHash,
          timingCommitment: timing.commitmentHash
        }
      });
      cacheMisses++;
      pendingWrites++;
      if (pendingWrites >= 100) {
        flushCache();
        pendingWrites = 0;
      }
    }

    if ((i + 1) % 500 === 0 || i + 1 === finalSample.length) {
      console.log(`   Processed ${i + 1}/${finalSample.length} (Hits: ${cacheHits}, Misses: ${cacheMisses})...`);
    }

    // Ground truth occurrence in adult horizon [18, 50]
    const m = getEarliestDocumentedMarriage(r);
    const mYear = m?.marriageYear;
    const bYear = r.birthYear;
    const mAge = (mYear && bYear) ? (mYear - bYear) : null;
    const occurredInHorizon = mAge !== null && mAge >= 18 && mAge <= 50;

    // Actual model rawRuleScore (NOT synthetic surrogate!)
    scores.push(occ.rawRuleScore);
    labels.push(occurredInHorizon ? 1 : 0);

    // Actual astrological timing error: |centralEstimateYear - actualMarriageYear|
    if (timing?.hasTimingPrediction && mYear && mAge >= 15 && mAge <= 70) {
      const absErr = Math.abs(timing.centralEstimateYear - mYear);
      timingErrors.push(absErr);
    }
  }

  if (pendingWrites > 0) {
    flushCache();
  }

  const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`   Completed model evaluations in ${elapsedSec}s. Extracted ${scores.length} scores and ${timingErrors.length} timing residuals.`);

  // 4. Fit Platt Scaling Logistic Regression via Newton-Raphson (IRLS)
  console.log('\n4. Fitting Platt Scaling (logistic regression) on actual model rawRuleScores...');
  let slope = 1.0;
  let intercept = 0.0;
  const n = scores.length;

  for (let iter = 0; iter < 50; iter++) {
    let gradSlope = 0;
    let gradIntercept = 0;
    let h11 = 1e-6; // ridge regularizer
    let h12 = 0;
    let h22 = 1e-6;

    for (let i = 0; i < n; i++) {
      const s = scores[i];
      const y = labels[i];
      const logit = slope * s + intercept;
      const p = 1 / (1 + Math.exp(-Math.max(Math.min(logit, 20), -20)));
      const diff = p - y;
      const w = p * (1 - p);

      gradSlope += diff * s;
      gradIntercept += diff;

      h11 += w * s * s;
      h12 += w * s;
      h22 += w;
    }

    const det = h11 * h22 - h12 * h12;
    if (Math.abs(det) < 1e-12) break;

    const deltaSlope = (h22 * gradSlope - h12 * gradIntercept) / det;
    const deltaIntercept = (-h12 * gradSlope + h11 * gradIntercept) / det;

    slope -= deltaSlope;
    intercept -= deltaIntercept;

    if (Math.abs(deltaSlope) < 1e-6 && Math.abs(deltaIntercept) < 1e-6) {
      console.log(`   Newton-Raphson converged at iteration ${iter + 1}.`);
      break;
    }
  }

  console.log(`   Fitted parameters: slope = ${slope.toFixed(4)}, intercept = ${intercept.toFixed(4)}`);

  // 5. Fit Conformal Prediction Intervals from ACTUAL astrological residuals
  console.log('\n5. Computing Conformal Error Quantiles from ACTUAL astrological model residuals...');
  timingErrors.sort((a, b) => a - b);
  const q50 = parseFloat(quantile(timingErrors, 0.50).toFixed(2));
  const q80 = parseFloat(quantile(timingErrors, 0.80).toFixed(2));
  const q90 = parseFloat(quantile(timingErrors, 0.90).toFixed(2));
  const q95 = parseFloat(quantile(timingErrors, 0.95).toFixed(2));

  const sumAE = timingErrors.reduce((acc, v) => acc + v, 0);
  const meanAE = parseFloat((sumAE / timingErrors.length).toFixed(2));
  const medianAE = timingErrors[Math.floor(timingErrors.length / 2)] || 0;
  const rmse = parseFloat(Math.sqrt(timingErrors.reduce((acc, v) => acc + v * v, 0) / timingErrors.length).toFixed(2));

  console.log(`   Astrological Model MAE on TRAIN sample: ${meanAE} years (Median: ${medianAE}y, RMSE: ${rmse}y)`);
  console.log(`   q50 (nominal 50% half-width): ±${q50} years (width ${q50 * 2}y)`);
  console.log(`   q80 (nominal 80% half-width): ±${q80} years (width ${q80 * 2}y)`);
  console.log(`   q90 (nominal 90% half-width): ±${q90} years (width ${q90 * 2}y)`);
  console.log(`   q95 (nominal 95% half-width): ±${q95} years (width ${q95 * 2}y)`);

  const currentEngineHash = getCurrentHashes().predictionEngineHash;
  if (!currentEngineHash) {
    throw new Error('CRITICAL: Current prediction engine hash could not be calculated.');
  }

  const model = {
    calibratorType: 'PLATT_LOGISTIC_SCALING_V2',
    modelVersion: '2.2.0-actual-model-fitted',
    predictionEngineVersion: '4.2.0',
    predictionEngineHash: currentEngineHash,
    calibrationInputHash: crypto.createHash('sha256').update(trainSha256).digest('hex'),
    trainingSampleHash: crypto.createHash('sha256').update(JSON.stringify(finalSample.map(s => s.sourceRecordId))).digest('hex'),
    fitTimestamp: new Date().toISOString(),
    fitSeed: 133742,
    fitMethod: 'NEWTON_RAPHSON_IRLS',
    rawScoreDefinition: 'rawRuleScore_from_predictMarriageOccurrence',
    timingPredictionDefinition: 'centralEstimateYear_from_predictMarriageTiming',
    trainingDataset: 'TRAIN_SPLIT_VEDASTRO_15K',
    trainingDatasetHash: trainSha256,
    validationDatasetHash: valSha256,
    trainingTotalN: trainRecords.length,
    trainingSampleN: finalSample.length,
    trainingSampleMethod: 'DETERMINISTIC_STRATIFIED_PRNG_SEED_133742',
    timingResidualSampleN: timingErrors.length,
    trainingOutcomeDefinition: 'MARRIAGE_WITHIN_HORIZON_18_50',
    parameters: {
      slope: parseFloat(slope.toFixed(4)),
      intercept: parseFloat(intercept.toFixed(4)),
      classificationThreshold: 0.50
    },
    conformalIntervalQuantiles: {
      q50,
      q80,
      q90,
      q95
    },
    demographicBaseline: {
      medianMarriageAge: trainMedianMarriageAge,
      trainingSampleCount: trainMarriageAges.length
    },
    astrologicalTimingStats: {
      meanAbsoluteError: meanAE,
      medianAbsoluteError: medianAE,
      rootMeanSquaredError: rmse
    },
    provenanceNotice: 'Parameters strictly fitted on actual production model outputs (rawRuleScore and centralEstimateYear) from TRAIN partition. Zero BLIND or HOLDOUT data used in fitting.'
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(model, null, 2));
  clearTestCalibrationFixture();
  console.log(`\n✓ Calibration model saved to: ${OUTPUT_PATH}`);

  return model;
}

if (process.argv[1]?.endsWith('fit_calibration_model.mjs')) {
  fitCalibrationModel();
}
