import crypto from "node:crypto";

export const OUTCOME_RECORD_STATUSES = Object.freeze([
  "USER_REPORTED",
  "INDEPENDENTLY_VERIFIED",
  "UNVERIFIED",
  "CONFLICTING",
  "CENSORED",
  "UNKNOWN",
  "INVALID"
]);

const EXCLUDED_FEATURE_KEY = /(outcome|target|event|marriage|divorce|spouse|follow.?up|censor|observed|verified|status|date)/i;
const EPSILON = 1e-12;

function stableSerialize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : stableSerialize(value), "utf8").digest("hex");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function assertRecordId(record, field = "recordId") {
  if (!record?.[field] || typeof record[field] !== "string") {
    throw new Error(`OUTCOME_PIPELINE_INVALID_RECORD: ${field} is required.`);
  }
}

function assertConsent(consent) {
  if (!consent || consent.status !== "CURRENT" || consent.purpose !== "MODEL_TRAINING") {
    throw new Error("OUTCOME_PIPELINE_CONSENT_REQUIRED: current MODEL_TRAINING consent is required.");
  }
}

function assertPredictionSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("OUTCOME_PIPELINE_SNAPSHOT_REQUIRED: original feature snapshot is required.");
  }
  if (!snapshot.createdAt || !snapshot.cutoffDate || !snapshot.engineVersion || !snapshot.calculationSettings) {
    throw new Error("OUTCOME_PIPELINE_SNAPSHOT_INCOMPLETE: prediction time, cutoff, engine version, and calculation settings are required.");
  }
  if (!snapshot.featureSnapshot?.astrology || !snapshot.featureSnapshot?.demographic) {
    throw new Error("OUTCOME_PIPELINE_FEATURE_SNAPSHOT_REQUIRED: astrology and demographic feature groups are required.");
  }
}

function collectNumericFeatures(value, prefix, output) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (EXCLUDED_FEATURE_KEY.test(key)) {
      throw new Error(`OUTCOME_PIPELINE_LEAKAGE: forbidden outcome-shaped feature key '${prefix}.${key}'.`);
    }
    const path = `${prefix}.${key}`;
    if (typeof child === "number" && Number.isFinite(child)) {
      output[path] = child;
    } else if (child && typeof child === "object" && !Array.isArray(child)) {
      collectNumericFeatures(child, path, output);
    }
  }
}

function featureVector(record, group) {
  const values = {};
  collectNumericFeatures(record.originalPrediction.featureSnapshot[group], group, values);
  return values;
}

function assertPartitionIsolation(partitions) {
  const seen = new Map();
  for (const [partition, records] of Object.entries(partitions)) {
    for (const record of records || []) {
      const keys = [
        ["person", record.personId || record.recordId],
        ["spouse", record.spouseGroupId],
        ["event", record.eventGroupId]
      ];
      for (const [kind, key] of keys) {
        if (!key) continue;
        const owner = seen.get(`${kind}:${key}`);
        if (owner && owner !== partition) {
          throw new Error(`OUTCOME_PIPELINE_LEAKAGE: ${kind} ${key} occurs in ${owner} and ${partition}.`);
        }
        seen.set(`${kind}:${key}`, partition);
      }
    }
  }
  return true;
}

export function createOriginalPredictionRecord({
  recordId,
  personId = recordId,
  spouseGroupId = null,
  eventGroupId = null,
  originalPrediction,
  consent
}) {
  assertRecordId({ recordId });
  assertPredictionSnapshot(originalPrediction);
  assertConsent(consent);
  const immutable = {
    schemaVersion: "OUTCOME_LEARNING_RECORD_V1",
    recordId,
    personId,
    spouseGroupId,
    eventGroupId,
    originalPrediction: JSON.parse(JSON.stringify(originalPrediction)),
    consent: JSON.parse(JSON.stringify(consent)),
    originalPredictionHash: sha256(originalPrediction)
  };
  return deepFreeze(immutable);
}

export function attachOutcomeReport(predictionRecord, outcomeReport) {
  assertRecordId(predictionRecord);
  assertPredictionSnapshot(predictionRecord.originalPrediction);
  if (!outcomeReport || !OUTCOME_RECORD_STATUSES.includes(outcomeReport.status)) {
    throw new Error("OUTCOME_PIPELINE_INVALID_OUTCOME_STATUS: status must be registered.");
  }
  if (outcomeReport.status === "INDEPENDENTLY_VERIFIED" && outcomeReport.source?.type !== "AUTHORITATIVE") {
    throw new Error("OUTCOME_PIPELINE_SOURCE_REQUIRED: independently verified outcomes require an AUTHORITATIVE source.");
  }
  if (outcomeReport.eventOccurred === true && !outcomeReport.outcomeDate) {
    throw new Error("OUTCOME_PIPELINE_OUTCOME_DATE_REQUIRED: event outcomes require an outcome date.");
  }
  if (outcomeReport.outcomeDate && outcomeReport.outcomeDate < predictionRecord.originalPrediction.cutoffDate) {
    throw new Error("OUTCOME_PIPELINE_DATE_ORDER: outcome cannot precede the original prediction cutoff.");
  }
  return deepFreeze({
    ...predictionRecord,
    outcomeReport: JSON.parse(JSON.stringify(outcomeReport)),
    outcomeReportHash: sha256(outcomeReport)
  });
}

export function classifyOutcomeEligibility(record) {
  if (!record?.outcomeReport) return { eligible: false, reason: "MISSING_OUTCOME_REPORT" };
  if (!record.consent || record.consent.status !== "CURRENT" || record.consent.purpose !== "MODEL_TRAINING") {
    return { eligible: false, reason: "CURRENT_TRAINING_CONSENT_REQUIRED" };
  }
  if (!record.originalPrediction?.featureSnapshot) return { eligible: false, reason: "MISSING_ORIGINAL_FEATURE_SNAPSHOT" };
  if (["UNVERIFIED", "CONFLICTING", "CENSORED", "UNKNOWN", "INVALID"].includes(record.outcomeReport.status)) {
    return { eligible: false, reason: `OUTCOME_STATUS_${record.outcomeReport.status}` };
  }
  if (typeof record.outcomeReport.eventOccurred !== "boolean") {
    return { eligible: false, reason: "BINARY_OUTCOME_REQUIRED" };
  }
  return { eligible: true, reason: "ELIGIBLE" };
}

export function prepareTrainingRows(records) {
  if (!Array.isArray(records)) throw new Error("OUTCOME_PIPELINE_RECORDS_REQUIRED: records must be an array.");
  const rows = [];
  const exclusions = [];
  for (const record of records) {
    const eligibility = classifyOutcomeEligibility(record);
    if (!eligibility.eligible) {
      exclusions.push({ recordId: record?.recordId || record?.sourceRecordId || null, reason: eligibility.reason });
      continue;
    }
    const astrology = featureVector(record, "astrology");
    const demographic = featureVector(record, "demographic");
    if (!Object.keys(astrology).length || !Object.keys(demographic).length) {
      exclusions.push({ recordId: record.recordId, reason: "NUMERIC_FEATURES_REQUIRED" });
      continue;
    }
    rows.push({
      recordId: record.recordId,
      personId: record.personId || record.recordId,
      target: record.outcomeReport.eventOccurred ? 1 : 0,
      astrology,
      demographic,
      originalPredictionHash: record.originalPredictionHash,
      outcomeReportHash: record.outcomeReportHash
    });
  }
  return { rows, exclusions };
}

function alignFeatures(rows, group) {
  const names = [...new Set(rows.flatMap((row) => Object.keys(row[group])))].sort();
  return {
    names,
    matrix: rows.map((row) => names.map((name) => Number.isFinite(row[group][name]) ? row[group][name] : 0))
  };
}

function fitStandardizer(matrix) {
  const means = matrix[0].map((_, col) => matrix.reduce((sum, row) => sum + row[col], 0) / matrix.length);
  const deviations = matrix[0].map((_, col) => {
    const variance = matrix.reduce((sum, row) => sum + (row[col] - means[col]) ** 2, 0) / matrix.length;
    return Math.sqrt(variance) || 1;
  });
  return { means, deviations };
}

function transform(matrix, standardizer) {
  return matrix.map((row) => row.map((value, index) => (value - standardizer.means[index]) / standardizer.deviations[index]));
}

function sigmoid(value) {
  const bounded = Math.max(-30, Math.min(30, value));
  return 1 / (1 + Math.exp(-bounded));
}

export function fitFreshLogisticModel(rows, group, options = {}) {
  if (!rows.length) throw new Error("OUTCOME_PIPELINE_TRAINING_DATA_REQUIRED: no rows available.");
  const { names, matrix } = alignFeatures(rows, group);
  const standardizer = fitStandardizer(matrix);
  const x = transform(matrix, standardizer);
  const y = rows.map((row) => row.target);
  const learningRate = options.learningRate || 0.08;
  const epochs = options.epochs || 1200;
  const l2 = options.l2 || 0.01;
  const weights = new Array(names.length).fill(0);
  let intercept = 0;
  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradients = new Array(names.length).fill(0);
    let interceptGradient = 0;
    for (let rowIndex = 0; rowIndex < x.length; rowIndex++) {
      const probability = sigmoid(intercept + x[rowIndex].reduce((sum, value, index) => sum + value * weights[index], 0));
      const error = probability - y[rowIndex];
      interceptGradient += error;
      for (let index = 0; index < weights.length; index++) gradients[index] += error * x[rowIndex][index];
    }
    intercept -= learningRate * interceptGradient / x.length;
    for (let index = 0; index < weights.length; index++) {
      weights[index] -= learningRate * ((gradients[index] / x.length) + l2 * weights[index]);
    }
  }
  return {
    algorithm: "FRESH_LOGISTIC_REGRESSION_V1",
    group,
    featureNames: names,
    standardizer,
    intercept,
    weights,
    trainingRowCount: rows.length,
    trainingRowHash: sha256(rows.map((row) => row.recordId).sort())
  };
}

export function predictFreshLogisticModel(model, row) {
  const values = model.featureNames.map((name) => Number.isFinite(row[model.group]?.[name]) ? row[model.group][name] : 0);
  const standardized = values.map((value, index) => (value - model.standardizer.means[index]) / model.standardizer.deviations[index]);
  return sigmoid(model.intercept + standardized.reduce((sum, value, index) => sum + value * model.weights[index], 0));
}

function evaluatePredictions(rows, predictions, threshold = 0.5) {
  let tp = 0; let fp = 0; let tn = 0; let fn = 0;
  let brier = 0;
  rows.forEach((row, index) => {
    const probability = predictions[index];
    const predicted = probability >= threshold ? 1 : 0;
    if (predicted === 1 && row.target === 1) tp++;
    else if (predicted === 1) fp++;
    else if (row.target === 0) tn++;
    else fn++;
    brier += (probability - row.target) ** 2;
  });
  const total = rows.length;
  const accuracy = total ? (tp + tn) / total : null;
  const sensitivity = tp + fn ? tp / (tp + fn) : null;
  const specificity = tn + fp ? tn / (tn + fp) : null;
  const balancedAccuracy = sensitivity !== null && specificity !== null ? (sensitivity + specificity) / 2 : null;
  const ece = calculateECE(rows, predictions);
  return {
    sampleSize: total,
    confusionMatrix: { tp, fp, tn, fn },
    accuracy,
    sensitivity,
    specificity,
    balancedAccuracy,
    brierScore: total ? brier / total : null,
    expectedCalibrationError: ece,
    threshold
  };
}

export function calculateECE(rows, predictions, bins = 10) {
  if (!rows.length) return null;
  const counts = new Array(bins).fill(0);
  const confidence = new Array(bins).fill(0);
  const outcomes = new Array(bins).fill(0);
  predictions.forEach((probability, index) => {
    const bin = Math.min(bins - 1, Math.floor(probability * bins));
    counts[bin]++;
    confidence[bin] += probability;
    outcomes[bin] += rows[index].target;
  });
  return counts.reduce((sum, count, index) => {
    if (!count) return sum;
    return sum + (count / rows.length) * Math.abs(confidence[index] / count - outcomes[index] / count);
  }, 0);
}

function selectValidationThreshold(rows, predictions) {
  let best = { threshold: 0.5, balancedAccuracy: -1 };
  for (let step = 1; step < 100; step++) {
    const threshold = step / 100;
    const metrics = evaluatePredictions(rows, predictions, threshold);
    if ((metrics.balancedAccuracy ?? -1) > best.balancedAccuracy) {
      best = { threshold, balancedAccuracy: metrics.balancedAccuracy };
    }
  }
  return best.threshold;
}

export function trainAndEvaluateCandidate(partitions, options = {}) {
  assertPartitionIsolation(partitions);
  const prepared = Object.fromEntries(Object.entries(partitions).map(([name, records]) => [name, prepareTrainingRows(records)]));
  const train = prepared.TRAIN.rows;
  const validation = prepared.VALIDATION.rows;
  const blind = prepared.BLIND_TEST.rows;
  if (!train.length || !validation.length || !blind.length) {
    return {
      status: "BLOCKED",
      reason: "TRAIN_VALIDATION_BLIND_TEST_REQUIRE_ELIGIBLE_RECORDS",
      prepared
    };
  }
  const models = {
    BASELINE: fitFreshLogisticModel(train, "demographic", options),
    ASTROLOGY: fitFreshLogisticModel(train, "astrology", options),
    COMBINED: fitFreshLogisticModel(train.map((row) => ({
      ...row,
      combined: { ...row.demographic, ...row.astrology }
    })), "combined", options)
  };
  const validationPredictions = Object.fromEntries(Object.entries(models).map(([name, model]) => [
    name,
    validation.map((row) => predictFreshLogisticModel(model, name === "COMBINED" ? { ...row, combined: { ...row.demographic, ...row.astrology } } : row))
  ]));
  const thresholds = Object.fromEntries(Object.entries(models).map(([name]) => [
    name,
    selectValidationThreshold(validation, validationPredictions[name])
  ]));
  const blindMetrics = Object.fromEntries(Object.entries(models).map(([name, model]) => {
    const predictions = blind.map((row) => predictFreshLogisticModel(model, name === "COMBINED" ? { ...row, combined: { ...row.demographic, ...row.astrology } } : row));
    return [name, {
      ...evaluatePredictions(blind, predictions, thresholds[name]),
      predictionHash: sha256(predictions)
    }];
  }));
  const baseline = blindMetrics.BASELINE;
  const combined = blindMetrics.COMBINED;
  const promoted = combined.sampleSize >= 20
    && combined.balancedAccuracy !== null
    && baseline.balancedAccuracy !== null
    && combined.balancedAccuracy > baseline.balancedAccuracy
    && combined.brierScore <= baseline.brierScore;
  return {
    status: promoted ? "PROMOTED" : "REJECTED",
    reason: promoted ? "COMBINED_MODEL_BEATS_BASELINE_ON_FROZEN_BLIND_TEST" : "INDEPENDENT_BLIND_TEST_DID_NOT_ESTABLISH_IMPROVEMENT",
    models,
    thresholds,
    metrics: blindMetrics,
    prepared
  };
}

export function buildOutcomeLearningReport(result, metadata = {}) {
  const preparedSummary = result.prepared
    ? Object.fromEntries(Object.entries(result.prepared).map(([partition, value]) => [
      partition,
      {
        eligibleRows: value.rows.length,
        excludedRows: value.exclusions.length,
        exclusionReasons: value.exclusions.reduce((counts, item) => {
          counts[item.reason] = (counts[item.reason] || 0) + 1;
          return counts;
        }, {})
      }
    ]))
    : null;
  return {
    reportVersion: "OUTCOME_LEARNING_REPORT_V1",
    generatedAt: metadata.generatedAt || new Date().toISOString(),
    status: result.status,
    reason: result.reason,
    sourceHash: metadata.sourceHash || null,
    datasetHash: metadata.datasetHash || null,
    modelHash: sha256(result.models || result.reason),
    provenance: {
      featureHorizon: "ORIGINAL_PREDICTION_SNAPSHOT_ONLY",
      excludedStatuses: ["UNVERIFIED", "CONFLICTING", "CENSORED", "UNKNOWN", "INVALID"],
      leakageControls: ["PERSON", "SPOUSE", "EVENT", "OUTCOME_FEATURE_KEY_SCAN"],
      validationPolicy: "THRESHOLD_SELECTED_ON_VALIDATION_ONLY",
      blindTestPolicy: "FROZEN_AND_UNTOUCHED_UNTIL_FINAL_EVALUATION"
    },
    result: {
      status: result.status,
      reason: result.reason,
      thresholds: result.thresholds || null,
      metrics: result.metrics || null,
      models: result.models || null,
      preparedSummary
    }
  };
}
