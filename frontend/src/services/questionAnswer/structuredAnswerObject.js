/**
 * ASTROVERSE — Structured Answer Object Model & Validator
 * ========================================================
 * Formal data contract representing the validated pre-synthesis astrological answer.
 * Strictly separates calculated facts from traditional interpretations.
 *
 * Implements Section 6, Section 9, Section 10, Section 17, and Section 21 of the Mandate.
 */

export const ANSWERABILITY_STATES = Object.freeze({
  ANSWERABLE: "ANSWERABLE",
  PARTIALLY_ANSWERABLE: "PARTIALLY_ANSWERABLE",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  NOT_DISCRIMINATING: "NOT_DISCRIMINATING",
  CONTRADICTORY: "CONTRADICTORY"
});

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

export const CONCLUSION_STATUSES = Object.freeze({
  LIKELY: "LIKELY",
  POSSIBLE: "POSSIBLE",
  UNLIKELY: "UNLIKELY",
  NOT_DISCRIMINATING: "NOT_DISCRIMINATING",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA"
});

export const CONFIDENCE_CLASSES = Object.freeze({
  HIGH: "HIGH",
  MODERATE: "MODERATE",
  LOW: "LOW",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA"
});

/**
 * Creates and strictly validates a canonical Answer Object before language generation.
 *
 * @param {Object} input - Raw Answer Object fields
 * @returns {Object} Validated Answer Object
 */
export function buildAnswerObject(input) {
  const errors = [];

  // 1. Question Metadata
  const question = input.question || {};
  if (!question.rawQuestion) errors.push("question.rawQuestion is required.");
  if (!question.intent) errors.push("question.intent is required.");

  // 2. Answerability Gate
  const answerability = input.answerability || ANSWERABILITY_STATES.ANSWERABLE;
  if (!Object.values(ANSWERABILITY_STATES).includes(answerability)) {
    errors.push(`Invalid answerability state: ${answerability}`);
  }

  // 3. Conclusion & Confidence
  const conclusion = input.conclusion || CONCLUSION_STATUSES.POSSIBLE;
  const confidenceClass = input.confidenceClass || CONFIDENCE_CLASSES.MODERATE;

  // INVARIANT: If INSUFFICIENT_DATA, conclusion CANNOT be LIKELY or POSSIBLE
  if (answerability === ANSWERABILITY_STATES.INSUFFICIENT_DATA) {
    if (conclusion === CONCLUSION_STATUSES.LIKELY || conclusion === CONCLUSION_STATUSES.POSSIBLE) {
      errors.push(`Safety Violation: Conclusion '${conclusion}' is forbidden when answerability is INSUFFICIENT_DATA.`);
    }
  }

  // 4. Timing Resolution
  const resolution = input.resolution || TIMING_RESOLUTIONS.NOT_DISCRIMINATING;
  const timingWindows = Array.isArray(input.timingWindows) ? input.timingWindows : [];
  if (timingWindows.length === 0 && (resolution === TIMING_RESOLUTIONS.DATE || resolution === TIMING_RESOLUTIONS.MONTH_RANGE)) {
    errors.push(`Resolution Violation: Resolution cannot be '${resolution}' when zero timing windows exist.`);
  }

  // 5. Fact / Interpretation Separation Check (Section 6)
  const calculatedFacts = Array.isArray(input.calculatedFacts) ? input.calculatedFacts : [];
  const traditionalRules = Array.isArray(input.traditionalRules) ? input.traditionalRules : [];

  // Ensure facts do NOT contain interpretive text
  for (const f of calculatedFacts) {
    if (f.interpretation || f.ruleText) {
      errors.push(`Architectural Violation: Fact '${f.id || f.factor}' contains interpretive fields.`);
    }
  }

  // 6. Evidence IDs
  const supportingEvidenceIds = Array.isArray(input.supportingEvidenceIds) ? input.supportingEvidenceIds : [];
  const counterEvidenceIds = Array.isArray(input.counterEvidenceIds) ? input.counterEvidenceIds : [];

  if (errors.length > 0) {
    throw new Error(`Structured Answer Object validation failed:\n - ${errors.join("\n - ")}`);
  }

  return {
    question: {
      questionId: question.questionId || "Q_UNKNOWN",
      rawQuestion: question.rawQuestion,
      language: question.language || "en",
      domain: question.domain || "GENERAL",
      subDomain: question.subDomain || "GENERAL",
      intent: question.intent,
      mode: question.mode || "novice"
    },
    interpretation: {
      directSummary: input.interpretation?.directSummary || "",
      detailedReasoning: input.interpretation?.detailedReasoning || "",
      primaryFactor: input.interpretation?.primaryFactor || "",
      secondaryFactors: input.interpretation?.secondaryFactors || [],
      limitingFactors: input.interpretation?.limitingFactors || [],
      whatChangesNext: input.interpretation?.whatChangesNext || ""
    },
    answerability,
    resolution,
    conclusion,
    confidenceClass,
    supportingEvidenceIds,
    counterEvidenceIds,
    timingWindows,
    calculatedFacts,
    traditionalRules,
    contradictions: Array.isArray(input.contradictions) ? input.contradictions : [],
    limitations: Array.isArray(input.limitations) ? input.limitations : [],
    missingEvidence: Array.isArray(input.missingEvidence) ? input.missingEvidence : [],
    safetyFlags: Array.isArray(input.safetyFlags) ? input.safetyFlags : [],
    optionsComparison: input.optionsComparison || null,
    validatedAt: new Date().toISOString()
  };
}
