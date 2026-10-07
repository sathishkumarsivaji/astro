/**
 * ASTROVERSE — Resolution & Answerability Classifier
 * ====================================================
 * Clamps timing resolution to epistemically validated boundaries:
 * YEAR, YEAR_RANGE, SEASON, MONTH_RANGE, DATE_RANGE, DATE, TIME, NOT_DISCRIMINATING, INSUFFICIENT_DATA.
 * Determines answerability state: ANSWERABLE, PARTIALLY_ANSWERABLE, INSUFFICIENT_DATA, NOT_DISCRIMINATING, CONTRADICTORY.
 *
 * Implements Section 9 and Section 10 of the Precision Q&A Engine Mandate.
 */

export const TIMING_RESOLUTIONS = Object.freeze({
  YEAR: "YEAR",
  YEAR_RANGE: "YEAR_RANGE",
  SEASON: "SEASON",
  MONTH_RANGE: "MONTH_RANGE",
  DATE_RANGE: "DATE_RANGE",
  DATE: "DATE",
  TIME: "TIME",
  NOT_DISCRIMINATING: "NOT_DISCRIMINATING",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA"
});

export const ANSWERABILITY_STATES = Object.freeze({
  ANSWERABLE: "ANSWERABLE",
  PARTIALLY_ANSWERABLE: "PARTIALLY_ANSWERABLE",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  NOT_DISCRIMINATING: "NOT_DISCRIMINATING",
  CONTRADICTORY: "CONTRADICTORY"
});

export const EVIDENCE_STATUSES = Object.freeze({
  FACT: "FACT",
  DIRECTLY_SUPPORTED: "DIRECTLY_SUPPORTED",
  PARTIALLY_SUPPORTED: "PARTIALLY_SUPPORTED",
  MIXED: "MIXED",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  NOT_DISCRIMINATING: "NOT_DISCRIMINATING",
  TRADITIONAL_ONLY: "TRADITIONAL_ONLY",
  EMPIRICALLY_VALIDATED: "EMPIRICALLY_VALIDATED",
  EXPERIMENTAL: "EXPERIMENTAL"
});

/**
 * Classifies the answerability of the inquiry given current chart evidence.
 *
 * @param {Object} plan - Evidence plan
 * @param {Object} evidence - Retrieved evidence
 * @param {Object} contradictions - Detected contradictions
 * @returns {string} One of ANSWERABILITY_STATES
 */
export function classifyAnswerability(plan, evidence, contradictions = {}) {
  if (!evidence || evidence.status === "INSUFFICIENT_DATA") {
    return ANSWERABILITY_STATES.INSUFFICIENT_DATA;
  }
  if (contradictions?.hasContradictions && contradictions?.netSignal === "CHALLENGING") {
    return ANSWERABILITY_STATES.CONTRADICTORY;
  }
  if (plan?.primaryIntent === "SPOUSE_DISTANCE" || evidence?.distanceAnalysis?.distanceStatus === "NOT_ESTABLISHED") {
    return ANSWERABILITY_STATES.NOT_DISCRIMINATING;
  }
  if (plan?.requestedPrecision === "EXACT_DATE") {
    return ANSWERABILITY_STATES.PARTIALLY_ANSWERABLE;
  }
  return ANSWERABILITY_STATES.ANSWERABLE;
}

/**
 * Classifies timing resolution and evidence status for a given query and evidence payload.
 *
 * @param {Object} plan - Output of evidencePlanner
 * @param {Object} evidence - Output of evidenceRetriever
 * @returns {Object} { timingResolution, evidenceStatus, rationale }
 */
export function classifyResolution(plan, evidence) {
  // If evidence status is insufficient
  if (!evidence || evidence.status === "INSUFFICIENT_DATA") {
    return {
      timingResolution: TIMING_RESOLUTIONS.INSUFFICIENT_DATA,
      evidenceStatus: EVIDENCE_STATUSES.INSUFFICIENT_DATA,
      rationale: "Required chart factors are absent from the calculation context."
    };
  }

  // Determine Evidence Status
  let evidenceStatus = EVIDENCE_STATUSES.DIRECTLY_SUPPORTED;
  if (plan.primaryIntent === "SPOUSE_DISTANCE" || evidence.distanceAnalysis?.distanceStatus === "NOT_ESTABLISHED") {
    evidenceStatus = EVIDENCE_STATUSES.NOT_DISCRIMINATING;
  } else if (plan.primaryIntent === "WELLNESS" || plan.primaryDomain === "wellness") {
    evidenceStatus = EVIDENCE_STATUSES.TRADITIONAL_ONLY;
  } else if (evidence.directionAnalysis?.confidenceCategory === "MIXED_DIRECTIONAL_INDICATION") {
    evidenceStatus = EVIDENCE_STATUSES.MIXED;
  } else if (plan.primaryIntent === "FACTUAL" || (plan.requiredHouses && plan.requiredHouses.size === 1 && !plan.includeTiming)) {
    evidenceStatus = EVIDENCE_STATUSES.FACT;
  }

  // Determine Timing Resolution
  let timingResolution = TIMING_RESOLUTIONS.NOT_DISCRIMINATING;
  if (plan.includeTiming || (plan.targetYears && plan.targetYears.length > 0) || plan.durationYears) {
    if (evidence.timingWindows && evidence.timingWindows.length > 0) {
      const firstWin = evidence.timingWindows[0];
      timingResolution = firstWin.resolution || TIMING_RESOLUTIONS.MONTH_RANGE;
    } else if (evidence.activeDasha) {
      timingResolution = TIMING_RESOLUTIONS.YEAR;
    } else {
      timingResolution = TIMING_RESOLUTIONS.YEAR;
    }
  }

  return {
    timingResolution,
    evidenceStatus,
    rationale: `Evidence classified as ${evidenceStatus} with timing resolution bound to ${timingResolution}.`
  };
}
