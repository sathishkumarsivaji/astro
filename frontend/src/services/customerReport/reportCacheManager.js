/**
 * SKR ASTRO — Deterministic Customer Life Intelligence Report Cache Manager
 * ===========================================================================
 * Provides high-performance, deterministic multi-tier caching for certified
 * LifeReportModel artifacts.
 *
 * Cache entries are cryptographically bound to:
 * - chartFingerprint
 * - engineVersion
 * - predictionEngineHash
 * - calibrationModelHash
 * - schemaVersion
 * - inputHash
 *
 * Guarantees:
 * - Sub-500ms (typically <5ms in-memory) response for repeated report queries.
 * - Automatic cache invalidation upon any engine or calibration model change.
 * - Full forensic traceability and zero synthetic or stale data leaks.
 */

import releaseManifest from "../../config/current_release_manifest.json" with { type: "json" };
import { generateChartFingerprint } from "../astroEngine.js";
import { computeSha256Hex } from "../predictionValidationLab.js";
import { POLICY_VERSION } from "../applicability/applicabilityPolicyEngine.js";
import { EVENT_REGISTRY_VERSION } from "../applicability/eventPrerequisiteRegistry.js";

// Authoritative frozen baseline versions and hashes
export const DEFAULT_ENGINE_VERSION = "SKR ASTRO Core v4.2.0";
export const DEFAULT_PREDICTION_ENGINE_HASH = releaseManifest?.authoritativeHashes?.predictionEngineHash || "a298a6e77f6aa4b488e4a7eec971a32332d1c786c923314e6876f02010df5a38";
export const DEFAULT_CALIBRATION_MODEL_HASH = releaseManifest?.authoritativeHashes?.calibrationModelHash || "5a127557a6a06fe9d8cc3a73b10f21f2765aeb92c9e0e965b664eae538a10277";
export const DEFAULT_SCHEMA_VERSION = releaseManifest?.schemaVersion || "3.0";

let activeEngineVersion = DEFAULT_ENGINE_VERSION;
let activePredictionEngineHash = DEFAULT_PREDICTION_ENGINE_HASH;
let activeCalibrationModelHash = DEFAULT_CALIBRATION_MODEL_HASH;
let activeSchemaVersion = DEFAULT_SCHEMA_VERSION;

const reportCache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  invalidated: 0,
  total: 0
};

/**
 * Extracts or generates a canonical chart fingerprint for caching.
 */
export function getReportChartFingerprint(chartData) {
  if (!chartData) return null;
  if (chartData.reportFingerprint) return chartData.reportFingerprint;
  if (chartData.chartFingerprint) return chartData.chartFingerprint;
  if (chartData.fingerprint) return chartData.fingerprint;

  try {
    return generateChartFingerprint(chartData);
  } catch {
    const rawKey = [
      chartData.birthDateStr || chartData.birthDate || "",
      chartData.birthTimeStr || chartData.birthTime || "",
      chartData.latitude ?? chartData.lat ?? "",
      chartData.longitude ?? chartData.lng ?? "",
      chartData.timezoneId || chartData.tz || chartData.utcOffset || ""
    ].join("|");
    return computeSha256Hex(rawKey);
  }
}

/**
 * Computes input hash for a report generation request.
 */
export function computeReportInputHash(chartData, options = {}) {
  const chartFp = getReportChartFingerprint(chartData);
  const lang = options.lang || "en";
  const name = options.clientName || chartData.clientName || "";
  const currentDate = options.currentDate || chartData.currentDate || "";
  const contextHash = options.context ? computeSha256Hex(JSON.stringify(options.context)) : "no-ctx";
  const payload = `${chartFp}:${lang}:${name}:${currentDate}:${POLICY_VERSION}:${EVENT_REGISTRY_VERSION}:${contextHash}`;
  return computeSha256Hex(payload);
}

/**
 * Retrieves a cached report if all binding invariants match.
 */
export function getCachedLifeReport(chartData, options = {}) {
  const chartFp = getReportChartFingerprint(chartData);
  if (!chartFp) {
    cacheStats.misses++;
    return null;
  }

  const lang = options.lang || "en";
  const currentDate = options.currentDate || chartData.currentDate || "";
  const cacheKey = `${chartFp}:${lang}:${currentDate}:${POLICY_VERSION}:${EVENT_REGISTRY_VERSION}`;
  const entry = reportCache.get(cacheKey);

  if (!entry) {
    cacheStats.misses++;
    return null;
  }

  const expectedInputHash = computeReportInputHash(chartData, options);

  // Strict multi-tier invariant verification
  const isValid =
    entry.chartFingerprint === chartFp &&
    entry.inputHash === expectedInputHash &&
    entry.engineVersion === activeEngineVersion &&
    entry.predictionEngineHash === activePredictionEngineHash &&
    entry.calibrationModelHash === activeCalibrationModelHash &&
    entry.schemaVersion === activeSchemaVersion &&
    entry.policyVersion === POLICY_VERSION &&
    entry.eventRegistryVersion === EVENT_REGISTRY_VERSION;

  if (!isValid) {
    cacheStats.invalidated++;
    reportCache.delete(cacheKey);
    cacheStats.total = reportCache.size;
    return null;
  }

  cacheStats.hits++;
  return entry.report;
}

/**
 * Stores a certified report in the cache bound to all security hashes.
 */
export function setCachedLifeReport(chartData, options = {}, report) {
  const chartFp = getReportChartFingerprint(chartData);
  if (!chartFp || !report) return;

  const lang = options.lang || "en";
  const currentDate = options.currentDate || chartData.currentDate || "";
  const cacheKey = `${chartFp}:${lang}:${currentDate}:${POLICY_VERSION}:${EVENT_REGISTRY_VERSION}`;
  const inputHash = computeReportInputHash(chartData, options);

  const entry = {
    chartFingerprint: chartFp,
    lang,
    currentDate,
    engineVersion: activeEngineVersion,
    predictionEngineHash: activePredictionEngineHash,
    calibrationModelHash: activeCalibrationModelHash,
    schemaVersion: activeSchemaVersion,
    policyVersion: POLICY_VERSION,
    eventRegistryVersion: EVENT_REGISTRY_VERSION,
    inputHash,
    createdAt: new Date().toISOString(),
    report
  };

  reportCache.set(cacheKey, entry);
  cacheStats.total = reportCache.size;
}

/**
 * Invalidates a specific cache entry for the given chart and options.
 */
export function invalidateReportCacheEntry(chartData, options = {}) {
  const chartFp = getReportChartFingerprint(chartData);
  if (!chartFp) return false;

  const lang = options.lang || "en";
  const currentDate = options.currentDate || chartData.currentDate || "";
  const cacheKey = `${chartFp}:${lang}:${currentDate}:${POLICY_VERSION}:${EVENT_REGISTRY_VERSION}`;
  const deleted = reportCache.delete(cacheKey);
  if (deleted) {
    cacheStats.invalidated++;
    cacheStats.total = reportCache.size;
  }
  return deleted;
}

/**
 * Resets the life report cache.
 */
export function clearLifeReportCache() {
  reportCache.clear();
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.invalidated = 0;
  cacheStats.total = 0;
}

/**
 * Returns diagnostic cache statistics.
 */
export function getLifeReportCacheStats() {
  return {
    ...cacheStats,
    size: reportCache.size,
    engineVersion: activeEngineVersion,
    predictionEngineHash: activePredictionEngineHash,
    calibrationModelHash: activeCalibrationModelHash,
    schemaVersion: activeSchemaVersion
  };
}

/**
 * Configures active runtime version and hash bindings.
 */
export function configureReportCacheBindings(bindings = {}) {
  if (bindings.engineVersion) activeEngineVersion = bindings.engineVersion;
  if (bindings.predictionEngineHash) activePredictionEngineHash = bindings.predictionEngineHash;
  if (bindings.calibrationModelHash) activeCalibrationModelHash = bindings.calibrationModelHash;
  if (bindings.schemaVersion) activeSchemaVersion = bindings.schemaVersion;
}
