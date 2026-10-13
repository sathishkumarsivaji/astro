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
  EXPERIMENTAL: "EXPERIMENTAL",
  UNVERIFIED: "UNVERIFIED",
  UNSUPPORTED_TASK: "UNSUPPORTED_TASK"
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
  if (evidence.taskResult) {
    if (evidence.taskResult.answerState === "INSUFFICIENT_DATA") {
      return ANSWERABILITY_STATES.INSUFFICIENT_DATA;
    }
    if (evidence.taskResult.answerState === "UNSUPPORTED_TASK" || evidence.taskResult.answerState === "TASK_FAILURE") {
      return ANSWERABILITY_STATES.NOT_DISCRIMINATING;
    }
    if (evidence.taskResult.answerState === "NOT_ESTABLISHED" || evidence.taskResult.answerState === "NO_DISCRIMINATING_WINDOW") {
      return ANSWERABILITY_STATES.NOT_DISCRIMINATING;
    }
    if (evidence.taskResult.answerState === "CLARIFICATION_REQUIRED") {
      return ANSWERABILITY_STATES.PARTIALLY_ANSWERABLE;
    }
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
 * Strict Invariant: If no discriminating timing windows exist, timingResolution is strictly null.
 *
 * @param {Object} plan - Output of evidencePlanner
 * @param {Object} evidence - Output of evidenceRetriever
 * @returns {Object} { timingResolution, timingContract, evidenceStatus, rationale }
 */
export function classifyResolution(plan, evidence) {
  // If evidence status is insufficient
  if (!evidence || evidence.status === "INSUFFICIENT_DATA" || evidence.taskResult?.answerState === "INSUFFICIENT_DATA") {
    const missing = evidence?.taskResult?.missingEvidence || evidence?.missingEvidence || ["Required chart factors are absent."];
    return {
      timingResolution: TIMING_RESOLUTIONS.INSUFFICIENT_DATA,
      timingContract: {
        status: "INSUFFICIENT_DATA",
        resolution: null,
        windows: [],
        missingEvidence: missing
      },
      evidenceStatus: EVIDENCE_STATUSES.INSUFFICIENT_DATA,
      rationale: "Required chart factors are absent from the calculation context."
    };
  }

  // Handle Actionable Task results explicitly
  if (evidence.taskResult) {
    const tr = evidence.taskResult;
    const state = tr.answerState;
    if (state === "UNSUPPORTED_TASK" || state === "TASK_FAILURE") {
      return {
        timingResolution: null,
        timingContract: {
          status: state,
          resolution: null,
          windows: []
        },
        evidenceStatus: EVIDENCE_STATUSES.UNSUPPORTED_TASK,
        rationale: state === "TASK_FAILURE"
          ? "Task handler encountered an execution failure."
          : "Task is unhandled / unsupported in the current engine."
      };
    }
    if (state === "NOT_ESTABLISHED" || state === "NO_DISCRIMINATING_WINDOW") {
      return {
        timingResolution: null,
        timingContract: {
          status: "NO_DISCRIMINATING_WINDOW",
          resolution: null,
          windows: [],
          reasonCodes: ["NO_EVENT_SPECIFIC_CONVERGENCE"]
        },
        evidenceStatus: EVIDENCE_STATUSES.NOT_DISCRIMINATING,
        rationale: "Requested action assessment or timing window has not been calculated."
      };
    }
    if (state === "CLARIFICATION_REQUIRED") {
      return {
        timingResolution: null,
        timingContract: {
          status: "CLARIFICATION_REQUIRED",
          resolution: null,
          windows: []
        },
        evidenceStatus: EVIDENCE_STATUSES.NOT_DISCRIMINATING,
        rationale: "Ambiguous task parameters require user clarification."
      };
    }
    if (state === "ANSWERED") {
      const hasWindows = Array.isArray(tr.candidateWindows) && tr.candidateWindows.length > 0;
      const taskRes = tr.timingResolution !== undefined
        ? tr.timingResolution
        : (tr.evaluatedTimeframe?.kind === "LOCAL_DATE"
          ? TIMING_RESOLUTIONS.DATE
          : (tr.evaluatedTimeframe?.kind === "LOCAL_WEEK"
            ? TIMING_RESOLUTIONS.DATE_RANGE
            : (hasWindows ? TIMING_RESOLUTIONS.MONTH_RANGE : null)));
      return {
        timingResolution: taskRes,
        timingContract: {
          status: taskRes ? "TRADITIONAL_WINDOW" : "NO_DISCRIMINATING_WINDOW",
          resolution: taskRes,
          windows: tr.candidateWindows || [],
          empiricalStatus: "NOT_VALIDATED"
        },
        evidenceStatus: EVIDENCE_STATUSES.TRADITIONAL_ONLY,
        rationale: "Action answered under evaluated traditional rule without empirical outcome guarantee."
      };
    }
  }

  // Begin with UNEVALUATED / UNVERIFIED baseline
  let evidenceStatus = EVIDENCE_STATUSES.UNVERIFIED;

  if (plan.primaryIntent === "SPOUSE_DISTANCE" || evidence.distanceAnalysis?.distanceStatus === "NOT_ESTABLISHED") {
    evidenceStatus = EVIDENCE_STATUSES.NOT_DISCRIMINATING;
  } else if (plan.primaryIntent === "WELLNESS" || plan.primaryDomain === "wellness") {
    evidenceStatus = EVIDENCE_STATUSES.TRADITIONAL_ONLY;
  } else if (evidence.directionAnalysis?.confidenceCategory === "MIXED_DIRECTIONAL_INDICATION") {
    evidenceStatus = EVIDENCE_STATUSES.MIXED;
  } else if (plan.primaryIntent === "FACTUAL" || (plan.requiredHouses && plan.requiredHouses.size === 1 && !plan.includeTiming)) {
    evidenceStatus = EVIDENCE_STATUSES.FACT;
  } else if (evidence.planets || evidence.houses || evidence.activeDasha) {
    evidenceStatus = EVIDENCE_STATUSES.DIRECTLY_SUPPORTED;
  }

  // Determine Timing Resolution & Structured Timing Contract (Strict Invariant: No windows -> resolution null)
  let timingResolution = null;
  let timingContract = {
    status: "NO_DISCRIMINATING_WINDOW",
    resolution: null,
    windows: [],
    reasonCodes: ["NO_EVENT_SPECIFIC_CONVERGENCE"]
  };

  if (evidence.timingWindows && evidence.timingWindows.length > 0) {
    const firstWin = evidence.timingWindows[0];
    timingResolution = firstWin.resolution || TIMING_RESOLUTIONS.MONTH_RANGE;
    timingContract = {
      status: "TRADITIONAL_WINDOW",
      resolution: timingResolution,
      windows: evidence.timingWindows,
      empiricalStatus: "NOT_VALIDATED"
    };
  } else {
    timingResolution = null;
    timingContract = {
      status: "NO_DISCRIMINATING_WINDOW",
      resolution: null,
      windows: [],
      reasonCodes: ["NO_EVENT_SPECIFIC_CONVERGENCE"]
    };
  }

  return {
    timingResolution,
    timingContract,
    evidenceStatus,
    rationale: `Evidence classified as ${evidenceStatus} with timing resolution bound to ${timingResolution || "null"}.`
  };
}
