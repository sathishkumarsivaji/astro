/**
 * ASTROVERSE — Single Authoritative Empirical Metrics Provider
 * =============================================================
 * Enforces Requirements P0-2 & P0-6:
 * - Never hardcode empirical performance statistics inside domain timing or reporting logic.
 * - Serves as the single authoritative provider for real-world empirical validation metrics.
 * - All numbers and hashes are strictly loaded from latestBenchmarkResults.json (zero hardcoded fallbacks).
 */

import latestBenchmarkResults from "../../config/latestBenchmarkResults.json" with { type: "json" };
import releaseManifest from "../../config/current_release_manifest.json" with { type: "json" };

if (!latestBenchmarkResults || !latestBenchmarkResults.provenance) {
  throw new Error("CRITICAL_INTEGRITY_FAILURE: latestBenchmarkResults.json missing or invalid.");
}

const prov = latestBenchmarkResults.provenance;
const mBlind = latestBenchmarkResults.metrics?.blindTest;
const mAdb = latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA;

// Cryptographic Release Hash Gate
const authHashes = releaseManifest?.authoritativeHashes || {};
const engineHashMatches = prov.predictionEngineHash === authHashes.predictionEngineHash;
const calibrationHashMatches = prov.calibrationModelHash === authHashes.calibrationModelHash;
export const isReleaseSynchronized = Boolean(engineHashMatches && calibrationHashMatches);
export const releaseGateStatus = isReleaseSynchronized ? "VERIFIED_SYNCHRONIZED" : "EMPIRICAL_METRICS_STALE";

export const AUTHORITATIVE_EMPIRICAL_METRICS = Object.freeze({
  releaseGate: Object.freeze({
    isSynchronized: isReleaseSynchronized,
    status: releaseGateStatus,
    engineHashMatches,
    calibrationHashMatches,
    predictionEngineHash: prov.predictionEngineHash,
    expectedPredictionEngineHash: authHashes.predictionEngineHash,
    calibrationModelHash: prov.calibrationModelHash,
    expectedCalibrationModelHash: authHashes.calibrationModelHash
  }),
  provenance: Object.freeze({
    dataset: prov.dataset,
    predictionEngineHash: prov.predictionEngineHash,
    calibrationModelHash: prov.calibrationModelHash,
    trainingDatasetHash: prov.trainingDatasetHash,
    blindDatasetHash: prov.blindDatasetHash,
    externalDatasetHash: prov.externalDatasetHash,
    modelFitHash: prov.modelFitHash,
    coefficientHash: prov.coefficientHash,
    generationTimestamp: prov.generationTimestamp
  }),
  domains: Object.freeze({
    MARRIAGE: Object.freeze({
      domain: "MARRIAGE",
      empiricalOutcomeValidationAvailable: isReleaseSynchronized,
      empiricalPredictiveResolution: isReleaseSynchronized ? (mBlind?.timing?.empiricalPredictiveResolution || "MULTI_YEAR_RANGE") : "NOT_ESTABLISHED",
      traditionalTimingResolution: "DATE_RANGE",
      validationStatus: isReleaseSynchronized ? (mBlind?.timing?.validationStatus || "EXPERIMENTAL / NOT_EMPIRICALLY_VALIDATED") : "EMPIRICAL_METRICS_STALE",
      releaseGateStatus,
      internalCohort: Object.freeze({
        datasetName: "VedAstro 15k Famous People (BLIND_TEST Partition)",
        sampleSizeN: mBlind?.n,
        timingEvaluatedN: mBlind?.timing?.n,
        astrologyModel: Object.freeze({
          modelId: "ASTROLOGY_DISCRETE_HAZARD_V3",
          modelName: "Astrological Discrete-Time Hazard Survival & Rule Timing",
          metric: "MAE",
          value: mBlind?.timing?.mae,
          unit: "years",
          within1yPct: mBlind?.timing?.within1yPct,
          validationStatus: mBlind?.timing?.validationStatus || "EXPERIMENTAL / NOT_EMPIRICALLY_VALIDATED"
        }),
        demographicBaseline: Object.freeze({
          modelId: "DEMOGRAPHIC_MEDIAN_AGE_BASELINE",
          modelName: "Actuarial Demographic Cohort Median Marriage Age Baseline",
          metric: "MAE",
          value: mBlind?.demographicBaseline?.mae,
          unit: "years",
          within1yPct: mBlind?.demographicBaseline?.within1yPct,
          validationStatus: "BENCHMARK_BASELINE"
        })
      }),
      externalCohort: Object.freeze({
        datasetName: "Astro-Databank Certified Independent External Cohort (Rodden A/AA)",
        sampleSizeN: mAdb?.n,
        timingEvaluatedN: mAdb?.timing?.n,
        astrologyModel: Object.freeze({
          modelId: "ASTROLOGY_DISCRETE_HAZARD_V3",
          modelName: "Astrological Discrete-Time Hazard Survival & Rule Timing",
          metric: "MAE",
          value: mAdb?.timing?.mae,
          unit: "years",
          within1yPct: mAdb?.timing?.within1yPct,
          validationStatus: mAdb?.timing?.validationStatus || "NOT_EMPIRICALLY_VALIDATED"
        }),
        demographicBaseline: Object.freeze({
          modelId: "DEMOGRAPHIC_MEDIAN_AGE_BASELINE",
          modelName: "Actuarial Demographic Cohort Median Marriage Age Baseline",
          metric: "MAE",
          value: mAdb?.demographicBaseline?.mae,
          unit: "years",
          within1yPct: mAdb?.demographicBaseline?.within1yPct,
          validationStatus: "BENCHMARK_BASELINE"
        }),
        occurrenceModel: Object.freeze({
          prevalence: mAdb?.occurrence?.prevalence,
          accuracy: mAdb?.occurrence?.accuracy,
          recall: mAdb?.occurrence?.recall,
          specificity: mAdb?.occurrence?.specificity,
          mcc: mAdb?.occurrence?.mcc,
          rocAuc: mAdb?.occurrence?.rocAuc,
          validationStatus: mAdb?.occurrence?.validationStatus || "NOT_EMPIRICALLY_VALIDATED",
          classifierStatus: mAdb?.occurrence?.classifierStatus || "NON_DISCRIMINATIVE"
        })
      })
    })
  })
});

export function getAuthoritativeEmpiricalMetrics(domain) {
  const norm = (domain || '').toUpperCase();
  if (norm === 'MARRIAGE') {
    return AUTHORITATIVE_EMPIRICAL_METRICS.domains.MARRIAGE;
  }
  return {
    domain: norm,
    empiricalOutcomeValidationAvailable: false,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    validationStatus: "TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED",
    disclaimer: "Empirical predictive validity not established. No certified real-world outcome dataset exists."
  };
}

export function getMarriageEmpiricalMetrics() {
  return AUTHORITATIVE_EMPIRICAL_METRICS.domains.MARRIAGE;
}

export function getReleaseGateStatus() {
  return AUTHORITATIVE_EMPIRICAL_METRICS.releaseGate;
}

