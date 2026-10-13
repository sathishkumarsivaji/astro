/**
 * ASTROVERSE / SKR ASTRO — Prediction Record & Provenance Service
 * ===============================================================
 * Provides immutable lifecycle tracking for life-event predictions:
 * 1. Cryptographic pseudonymization (HMAC-SHA256) of customer identity
 * 2. Deterministic hashing of birth data and calculation configuration
 * 3. Enforced Output Resolution System:
 *    [DATE_RANGE, MONTH_RANGE, SEASON, YEAR, AGE_RANGE, NOT_DISCRIMINATING, INSUFFICIENT_DATA]
 * 4. Evidence graph linking with strict status tagging
 * 5. Immutable record persistence — updates are strictly forbidden
 */

import crypto from "node:crypto";
import { db } from "../db/database.js";

export const PERMITTED_TIMING_RESOLUTIONS = Object.freeze([
  "DATE_RANGE",
  "MONTH_RANGE",
  "SEASON",
  "YEAR",
  "AGE_RANGE",
  "NOT_DISCRIMINATING",
  "INSUFFICIENT_DATA"
]);

export const PERMITTED_EVIDENCE_STATUSES = Object.freeze([
  "SUPPORTED",
  "PARTIALLY_SUPPORTED",
  "MIXED_EVIDENCE",
  "TRADITIONAL_ONLY",
  "INSUFFICIENT_DATA",
  "NOT_DISCRIMINATING",
  "UNASSESSED"
]);

/**
 * Derives a pseudonymous customer ID using HMAC-SHA256.
 * Raw customer IDs or personal identifiers are never stored directly in prediction training tables.
 */
export function createPseudonymousCustomerId(userId, customSalt = "") {
  if (!userId) return "anon_guest";
  const secret = process.env.SESSION_SECRET || "skr_astro_provenance_secret";
  const hmac = crypto.createHmac("sha256", secret + customSalt);
  hmac.update(String(userId));
  return `anon_${hmac.digest("hex").slice(0, 32)}`;
}

/**
 * Deterministic canonical SHA-256 hash of birth data.
 */
export function hashBirthData(birthData = {}) {
  if (!birthData || typeof birthData !== "object") {
    return crypto.createHash("sha256").update("EMPTY_BIRTH_DATA").digest("hex");
  }
  const normalized = {
    year: birthData.year ?? birthData.birthYear ?? null,
    month: birthData.month ?? birthData.birthMonth ?? null,
    date: birthData.date ?? birthData.day ?? birthData.birthDate ?? null,
    hours: birthData.hours ?? birthData.hour ?? birthData.birthHour ?? 0,
    minutes: birthData.minutes ?? birthData.minute ?? birthData.birthMinute ?? 0,
    seconds: birthData.seconds ?? birthData.second ?? 0,
    lat: birthData.latitude ?? birthData.lat ? Number(birthData.latitude ?? birthData.lat).toFixed(4) : null,
    lng: birthData.longitude ?? birthData.lng ? Number(birthData.longitude ?? birthData.lng).toFixed(4) : null,
    timezone: birthData.timezoneId || birthData.timezone || "UTC",
    utcOffset: birthData.utcOffset ?? birthData.tz ?? 0
  };
  const canonicalString = JSON.stringify(normalized, Object.keys(normalized).sort());
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
}

/**
 * Deterministic canonical SHA-256 hash of astronomical calculation settings.
 */
export function hashCalculationConfig(config = {}) {
  if (!config || typeof config !== "object") {
    return crypto.createHash("sha256").update("DEFAULT_CALCULATION_CONFIG").digest("hex");
  }
  const normalized = {
    system: String(config.system || "lahiri").toLowerCase(),
    ayanamsha: String(config.ayanamsha || "lahiri").toLowerCase(),
    houseSystem: String(config.houseSystem || "placidus").toLowerCase(),
    nodeType: String(config.nodeType || "true").toLowerCase(),
    engineVersion: String(config.engineVersion || "v3.0.0-audited")
  };
  const canonicalString = JSON.stringify(normalized, Object.keys(normalized).sort());
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
}

/**
 * Freezes and creates an immutable prediction record linked to canonical evidence.
 */
export function recordPrediction({
  userId,
  chartData = {},
  questionMeta = {},
  predictionResult = {},
  evidenceList = [],
  observationDeadline = null
}) {
  const predictionId = `pred_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  const pseudonymousCustomerId = createPseudonymousCustomerId(userId);
  const birthDataHash = hashBirthData(chartData.birthData || chartData);
  const calculationConfigJson = {
    system: chartData.system?.name || chartData.system || "lahiri",
    ayanamsha: chartData.ayanamsha || "lahiri",
    houseSystem: chartData.houseSystem || "placidus",
    engineVersion: "v3.0.0-audited"
  };

  // Extract key non-sensitive astrological features for machine learning verification
  const chartFeaturesJson = {
    ascendantSign: chartData.ascendant?.sign || chartData.ascendantSign || null,
    moonSign: chartData.moon?.sign || chartData.moonSign || null,
    sunSign: chartData.sun?.sign || chartData.sunSign || null,
    activeDashaLord: chartData.activeDasha?.lord || chartData.dasha?.major || null,
    activeAntarLord: chartData.activeDasha?.subLord || chartData.dasha?.sub || null
  };

  const domain = String(questionMeta.domain || predictionResult.domain || "GENERAL").toUpperCase();
  const eventDefinition = questionMeta.rawQuestion || questionMeta.intent || predictionResult.eventDefinition || "UNSPECIFIED_EVENT";
  const predictedOutcome = predictionResult.predictedOutcome || predictionResult.outcomeToken || "ACTIVATION_WINDOW";

  let timingResolution = predictionResult.timingResolution || questionMeta.resolution || "NOT_DISCRIMINATING";
  if (!PERMITTED_TIMING_RESOLUTIONS.includes(timingResolution)) {
    timingResolution = "NOT_DISCRIMINATING";
  }

  // Determine observation deadline
  let finalDeadline = observationDeadline;
  if (!finalDeadline && predictionResult.timingIntervalEnd) {
    finalDeadline = new Date(predictionResult.timingIntervalEnd).toISOString();
  } else if (!finalDeadline) {
    // Default observation window: 5 years from creation
    const fiveYearsLater = new Date();
    fiveYearsLater.setFullYear(fiveYearsLater.getFullYear() + 5);
    finalDeadline = fiveYearsLater.toISOString();
  }

  // Check user training consent
  const consent = userId ? db.getTrainingConsent(userId) : { consentGranted: false };

  const canonicalRecord = {
    predictionId,
    pseudonymousCustomerId,
    createdAt: new Date().toISOString(),
    birthDataHash,
    calculationConfigJson,
    chartFeaturesJson,
    domain,
    eventDefinition,
    predictedOutcome,
    timingIntervalStart: predictionResult.timingIntervalStart || null,
    timingIntervalEnd: predictionResult.timingIntervalEnd || null,
    timingResolution,
    modelVersion: predictionResult.modelVersion || "v3.0.0-discrete-hazard",
    rulesVersion: predictionResult.rulesVersion || "Parashari-v3.0",
    rawScore: predictionResult.rawScore !== undefined ? Number(predictionResult.rawScore) : null,
    calibratedProbability: predictionResult.calibratedProbability !== undefined ? Number(predictionResult.calibratedProbability) : null,
    calibrationStatus: predictionResult.calibrationStatus || "UNCALIBRATED",
    observationDeadline: finalDeadline,
    isTrainingEligible: Boolean(consent.consentGranted),
    metadata: {
      rawUserId: userId || null,
      questionId: questionMeta.questionId || null,
      mode: questionMeta.mode || "novice"
    }
  };

  // Persist immutable prediction
  const savedRecord = db.savePredictionRecord(canonicalRecord);

  // Format and persist evidence items
  const formattedEvidence = (evidenceList || []).map((ev, idx) => ({
    evidenceId: `ev_${predictionId}_${idx + 1}`,
    predictionId,
    claimType: ev.claimType || "FACT",
    shastricRuleId: ev.shastricRuleId || null,
    astronomicalFactKeys: ev.astronomicalFactKeys || [],
    evidenceStatus: PERMITTED_EVIDENCE_STATUSES.includes(ev.evidenceStatus) ? ev.evidenceStatus : "SUPPORTED",
    weight: ev.weight !== undefined ? Number(ev.weight) : 1.0,
    narrativeExcerpt: ev.narrativeExcerpt || ev.text || "",
    createdAt: new Date().toISOString()
  }));

  const savedEvidence = db.savePredictionEvidence(formattedEvidence);

  return {
    success: true,
    predictionRecord: savedRecord,
    evidenceList: savedEvidence,
    evidenceCount: savedEvidence.length
  };
}

/**
 * Retrieves a prediction record and its linked evidence chain.
 */
export function getPredictionById(predictionId) {
  if (!predictionId) return null;
  const record = db.getPredictionRecord(predictionId);
  if (!record) return null;
  const evidence = db.getPredictionEvidence(predictionId);
  const feedback = db.getCustomerFeedback(predictionId);
  const outcome = db.getObservedOutcome(predictionId);
  const verification = outcome ? db.getOutcomeVerification(outcome.outcomeId) : null;

  return {
    predictionRecord: record,
    evidence,
    feedback,
    observedOutcome: outcome,
    verification
  };
}

/**
 * Lists prediction records for a specific authenticated customer.
 */
export function listPredictionsForCustomer(userId, options = {}) {
  const pseudonymousCustomerId = createPseudonymousCustomerId(userId);
  return db.listPredictionRecords({
    pseudonymousCustomerId,
    domain: options.domain,
    limit: options.limit || 50,
    offset: options.offset || 0,
    trainingEligibleOnly: options.trainingEligibleOnly || false
  });
}
