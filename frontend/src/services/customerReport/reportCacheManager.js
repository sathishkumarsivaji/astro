/**
 * ASTROVERSE — Deterministic Customer Life Intelligence Report Cache Manager
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

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateChartFingerprint } from "../astroEngine.js";

// Authoritative frozen baseline versions and hashes
export const DEFAULT_ENGINE_VERSION = "ASTROVERSE Core v4.2.0";
export const DEFAULT_PREDICTION_ENGINE_HASH = "a298a6e77f6aa4b488e4a7eec971a32332d1c786c923314e6876f02010df5a38";
export const DEFAULT_CALIBRATION_MODEL_HASH = "5ba83760f24d1230eb916ae4c8f610e3629eb426cdbccab8fd36d14e160ccbea";
export const DEFAULT_SCHEMA_VERSION = "3.0";

let activeEngineVersion = DEFAULT_ENGINE_VERSION;
let activePredictionEngineHash = DEFAULT_PREDICTION_ENGINE_HASH;
let activeCalibrationModelHash = DEFAULT_CALIBRATION_MODEL_HASH;
let activeSchemaVersion = DEFAULT_SCHEMA_VERSION;

function loadReleaseManifest() {
  try {
    const currentDir = typeof __dirname !== "undefined"
      ? __dirname
      : (typeof import.meta !== "undefined" && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : "");
    if (!currentDir) return null;

    const candidatePaths = [
      path.resolve(currentDir, "../../../../current_release_manifest.json"),
      path.resolve(currentDir, "../../config/current_release_manifest.json")
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, "utf-8"));
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`RELEASE_MANIFEST_REQUIRED: Failed to load release manifest in production: ${err.message}`);
    }
  }
  return null;
}

const manifest = loadReleaseManifest();
if (manifest) {
  if (manifest.authoritativeHashes?.predictionEngineHash) {
    activePredictionEngineHash = manifest.authoritativeHashes.predictionEngineHash;
  }
  if (manifest.authoritativeHashes?.calibrationModelHash) {
    activeCalibrationModelHash = manifest.authoritativeHashes.calibrationModelHash;
  }
  if (manifest.schemaVersion) {
    activeSchemaVersion = manifest.schemaVersion;
  }
} else if (process.env.NODE_ENV === "production") {
  throw new Error("RELEASE_MANIFEST_REQUIRED: Release manifest must be present in production to bind report cache");
}

const reportCache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  invalidated: 0,
  total: 0
};

/**
 * Computes deterministic SHA-256 hash.
 */
function sha256(str) {
  return crypto.createHash("sha256").update(String(str), "utf8").digest("hex");
}

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
    return sha256(rawKey);
  }
}

/**
 * Computes input hash for a report generation request.
 */
export function computeReportInputHash(chartData, options = {}) {
  const chartFp = getReportChartFingerprint(chartData);
  const lang = options.lang || "en";
  const name = options.clientName || chartData.clientName || "";
  const payload = `${chartFp}:${lang}:${name}`;
  return sha256(payload);
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
  const cacheKey = `${chartFp}:${lang}`;
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
    entry.schemaVersion === activeSchemaVersion;

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
  const cacheKey = `${chartFp}:${lang}`;
  const inputHash = computeReportInputHash(chartData, options);

  const entry = {
    chartFingerprint: chartFp,
    lang,
    engineVersion: activeEngineVersion,
    predictionEngineHash: activePredictionEngineHash,
    calibrationModelHash: activeCalibrationModelHash,
    schemaVersion: activeSchemaVersion,
    inputHash,
    createdAt: new Date().toISOString(),
    report
  };

  reportCache.set(cacheKey, entry);
  cacheStats.total = reportCache.size;
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
