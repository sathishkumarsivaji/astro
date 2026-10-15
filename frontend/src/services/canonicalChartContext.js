import { generateCalculationCertificate } from "../astrology/conventions.js";
import { getSystemConfig } from "../config/astrologySystems.js";
import { runBirthTimePerturbationAnalysis } from "./chartUncertaintyEngine.js";
import { normalizeBirthProfile, validateBirthProfile } from "../types/birthProfile.js";

export const CANONICAL_CHART_CONTEXT_VERSION = "1.0.0";

function resolveSystemId(chartData, profile) {
  const raw = chartData?.systemId
    || (typeof chartData?.system === "string" ? chartData.system : chartData?.system?.id)
    || profile.system
    || "lahiri";
  const normalized = String(raw).toLowerCase();
  return normalized === "vedic" ? "lahiri" : normalized === "sayana" || normalized === "western" ? "tropical" : normalized;
}

function buildDataQuality(profile, validation) {
  const hasMinutePrecision = profile.birthTimePrecision === "MINUTE" || profile.birthTimePrecision === "SECOND";
  const uncertaintyReasons = [];
  if (profile.birthTimePrecision !== "SECOND") uncertaintyReasons.push("Birth time is not recorded to second precision.");
  if (!profile.timezoneId) uncertaintyReasons.push("IANA timezone is unavailable.");
  if (profile.coordinateSource === "missing") uncertaintyReasons.push("Coordinate source is unavailable.");

  return {
    status: validation.isValid ? "READY" : "INSUFFICIENT_DATA",
    inputValid: validation.isValid,
    birthTimePrecision: profile.birthTimePrecision,
    hasMinutePrecision,
    uncertaintyReasons
  };
}

function buildSensitivityAudit(profile, systemId, validation) {
  if (!validation.isValid) {
    return {
      status: "UNAVAILABLE",
      reason: "Birth-time sensitivity requires a valid birth profile."
    };
  }

  const analysis = runBirthTimePerturbationAnalysis({
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    lat: profile.latitude,
    lng: profile.longitude,
    system: systemId,
    tz: profile.timezoneId
  });

  return {
    status: analysis.sensitivityMetrics.overallSensitivityLevel,
    methodology: analysis.methodology,
    sensitivityMetrics: analysis.sensitivityMetrics,
    boundaryAlternatives: analysis.boundaryAlternatives,
    disclosure: analysis.disclosure
  };
}

/**
 * Attaches the authoritative profile, certificate, and provenance contract to
 * a calculated chart without changing the chart's existing calculation shape.
 */
export function attachCanonicalChartContext(chartData, profile, calculationTimestamp = null) {
  if (!chartData || typeof chartData !== "object") {
    throw new Error("CANONICAL_CHART_CONTEXT_REQUIRES_CHART: chart data is required.");
  }

  const normalizedProfile = normalizeBirthProfile(profile || chartData.profile || {});
  const validation = validateBirthProfile(normalizedProfile);
  const systemId = resolveSystemId(chartData, normalizedProfile);
  getSystemConfig(systemId);

  const certificateResult = generateCalculationCertificate(
    systemId,
    normalizedProfile,
    calculationTimestamp,
    chartData
  );
  const certificate = certificateResult.certificate;
  const dataQuality = buildDataQuality(normalizedProfile, validation);
  const sensitivityAudit = buildSensitivityAudit(normalizedProfile, systemId, validation);

  return {
    ...chartData,
    profile: normalizedProfile,
    systemId,
    calculationCertificate: certificate,
    chartHash: certificate.chartHash,
    canonicalContext: {
      contextVersion: CANONICAL_CHART_CONTEXT_VERSION,
      inputHash: certificate.inputHash,
      chartHash: certificate.chartHash,
      systemId,
      conventionId: certificate.conventionId,
      generatedAt: certificate.generatedAt || calculationTimestamp || null,
      dataQuality,
      sensitivityAudit
    }
  };
}

export function getCanonicalChartStatus(chartData) {
  return chartData?.canonicalContext?.dataQuality?.status || "INSUFFICIENT_DATA";
}
