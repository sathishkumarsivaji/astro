/**
 * ASTROVERSE — Single Authoritative Empirical Metrics Provider
 * =============================================================
 * Enforces Requirements P0-2 & P0-6:
 * - Never hardcode empirical performance statistics inside domain timing or reporting logic.
 * - Serves as the single authoritative provider for real-world empirical validation metrics.
 *
 * For Marriage, separately records:
 * internal (VedAstro BLIND_TEST N=1634, timing N=1484):
 *   - raw astrology timing MAE = 6.89 years
 *   - demographic baseline MAE = 4.28 years
 * external Astro-Databank Certified A/AA (N=3751, timing N=309):
 *   - raw astrology timing MAE = 9.19 years
 *   - demographic baseline MAE = 6.41 years
 *
 * For all other 16 domains:
 *   - empirical validation status: NOT_ESTABLISHED
 *   - empirical predictive resolution: NOT_ESTABLISHED
 */

import latestBenchmarkResults from "../../config/latestBenchmarkResults.json" with { type: "json" };

export const AUTHORITATIVE_EMPIRICAL_METRICS = Object.freeze({
  provenance: {
    dataset: latestBenchmarkResults.provenance?.dataset || "VedAstro 15k Public Research Cohort & Astro-Databank Official Export",
    predictionEngineHash: latestBenchmarkResults.provenance?.predictionEngineHash || "1e0edef2324ae83883294c8e60b5ec5cd5a2757fde8c5efe6e275a836129deae",
    calibrationModelHash: latestBenchmarkResults.provenance?.calibrationModelHash || "1523adaa0cda8254ba3b919ac5b076bb28266b3ed091272f9ef8620c8d111b59",
    trainingDatasetHash: latestBenchmarkResults.provenance?.trainingDatasetHash || "7cdd3611bce0690e2ed21bbf53050bfc15382808c82c748765d1d8bfccbc6849",
    blindDatasetHash: latestBenchmarkResults.provenance?.blindDatasetHash || "dc3fbde4531282c862bf8665e9874ace4b4524879529b3341e0574ca270373b2",
    externalDatasetHash: latestBenchmarkResults.provenance?.externalDatasetHash || "116595d3a3cbdd61b78a4424b579d53f58610e16beb12085451ea0a31b59d392",
    modelFitHash: latestBenchmarkResults.provenance?.modelFitHash || "c13c1d9a0ea4c3c5269636a0e061c0e04f7579631230d419ec7854897661ac03",
    coefficientHash: latestBenchmarkResults.provenance?.coefficientHash || "ce15d202c56d9b2a56c3a25e76b46dcf9585f1e52c307054ef438ef1a8a9240f",
    generationTimestamp: latestBenchmarkResults.provenance?.generationTimestamp || "2026-10-06T14:25:00.300Z"
  },
  domains: {
    MARRIAGE: {
      domain: "MARRIAGE",
      empiricalOutcomeValidationAvailable: true,
      empiricalPredictiveResolution: "MULTI_YEAR_RANGE",
      traditionalTimingResolution: "DATE_RANGE",
      validationStatus: "EXPERIMENTAL / NOT_EMPIRICALLY_VALIDATED",
      internalCohort: {
        datasetName: "VedAstro 15k Famous People (BLIND_TEST Partition)",
        sampleSizeN: latestBenchmarkResults.metrics?.blindTest?.n ?? 1634,
        timingEvaluatedN: latestBenchmarkResults.metrics?.blindTest?.timing?.n ?? 1484,
        astrologyModel: {
          modelId: "ASTROLOGY_DISCRETE_HAZARD_V3",
          modelName: "Astrological Discrete-Time Hazard Survival & Rule Timing",
          metric: "MAE",
          value: latestBenchmarkResults.metrics?.blindTest?.timing?.mae ?? 6.89,
          unit: "years",
          within1yPct: latestBenchmarkResults.metrics?.blindTest?.timing?.within1yPct ?? 13.01,
          validationStatus: "EXPERIMENTAL / NOT_EMPIRICALLY_VALIDATED"
        },
        demographicBaseline: {
          modelId: "DEMOGRAPHIC_MEDIAN_AGE_BASELINE",
          modelName: "Actuarial Demographic Cohort Median Marriage Age Baseline",
          metric: "MAE",
          value: latestBenchmarkResults.metrics?.blindTest?.demographicBaseline?.mae ?? 4.28,
          unit: "years",
          within1yPct: latestBenchmarkResults.metrics?.blindTest?.demographicBaseline?.within1yPct ?? 28.71,
          validationStatus: "BENCHMARK_BASELINE"
        }
      },
      externalCohort: {
        datasetName: "Astro-Databank Certified Independent External Cohort (Rodden A/AA)",
        sampleSizeN: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.n ?? 3751,
        timingEvaluatedN: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.timing?.n ?? 309,
        astrologyModel: {
          modelId: "ASTROLOGY_DISCRETE_HAZARD_V3",
          modelName: "Astrological Discrete-Time Hazard Survival & Rule Timing",
          metric: "MAE",
          value: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.timing?.mae ?? 9.19,
          unit: "years",
          within1yPct: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.timing?.within1yPct ?? 9.06,
          validationStatus: "NOT_EMPIRICALLY_VALIDATED"
        },
        demographicBaseline: {
          modelId: "DEMOGRAPHIC_MEDIAN_AGE_BASELINE",
          modelName: "Actuarial Demographic Cohort Median Marriage Age Baseline",
          metric: "MAE",
          value: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.demographicBaseline?.mae ?? 6.41,
          unit: "years",
          within1yPct: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.demographicBaseline?.within1yPct ?? 19.38,
          validationStatus: "BENCHMARK_BASELINE"
        },
        occurrenceModel: {
          prevalence: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.occurrence?.prevalence ?? 0.9649,
          accuracy: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.occurrence?.accuracy ?? 0.9649,
          recall: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.occurrence?.recall ?? 1.0,
          specificity: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.occurrence?.specificity ?? 0.0,
          mcc: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.occurrence?.mcc ?? 0.0,
          rocAuc: latestBenchmarkResults.metrics?.astroDatabankCertifiedAAA?.occurrence?.rocAuc ?? 0.5072,
          validationStatus: "NOT_EMPIRICALLY_VALIDATED",
          classifierStatus: "DEGENERATE_BASE_RATE_CLASSIFIER"
        }
      }
    }
  }
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
