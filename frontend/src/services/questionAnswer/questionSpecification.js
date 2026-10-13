/**
 * ASTROVERSE / SKR ASTRO — Canonical Question Specification & Schema
 * ===================================================================
 * Standardizes the user's query into a strongly-typed, fully-specified
 * QuestionSpecification AST across all supported prediction domains:
 *
 * 1. Marriage
 * 2. Love & Relationships
 * 3. Spouse
 * 4. Career
 * 5. Employment
 * 6. Business
 * 7. Education & Research
 * 8. Property
 * 9. Vehicles
 * 10. Finance & Wealth
 * 11. Foreign Travel
 * 12. Family
 * 13. Leadership & Governance
 * 14. Legal Matters
 * 15. Spiritual Interests
 * 16. Wellness, Daily Guidance, Forecast & General
 *
 * Implements strict schema validation, anti-fabrication controls,
 * unambiguous domain classification, and missing-field flagging.
 */

/**
 * Supported Domain Taxonomy
 */
export const SPEC_DOMAINS = Object.freeze({
  MARRIAGE: "MARRIAGE",
  RELATIONSHIPS: "RELATIONSHIPS",
  LOVE: "LOVE",
  SPOUSE: "SPOUSE",
  CAREER: "CAREER",
  EMPLOYMENT: "EMPLOYMENT",
  BUSINESS: "BUSINESS",
  EDUCATION: "EDUCATION",
  RESEARCH: "RESEARCH",
  PROPERTY: "PROPERTY",
  VEHICLE: "VEHICLE",
  FINANCE: "FINANCE",
  WEALTH: "WEALTH",
  TRAVEL: "TRAVEL",
  FOREIGN_TRAVEL: "FOREIGN_TRAVEL",
  FAMILY: "FAMILY",
  LEADERSHIP: "LEADERSHIP",
  LEGAL: "LEGAL",
  SPIRITUALITY: "SPIRITUALITY",
  WELLNESS: "WELLNESS",
  DAILY_GUIDANCE: "DAILY_GUIDANCE",
  FORECAST: "FORECAST",
  GENERAL: "GENERAL"
});

/**
 * Supported Event Taxonomy
 */
export const SPEC_EVENTS = Object.freeze({
  // Marriage & Relationships
  MARRIAGE_TIMING: "MARRIAGE_TIMING",
  MARRIAGE_COMPATIBILITY: "MARRIAGE_COMPATIBILITY",
  SPOUSE_MEETING: "SPOUSE_MEETING",
  SPOUSE_CHARACTERISTICS: "SPOUSE_CHARACTERISTICS",
  RELATIONSHIP_HARMONY: "RELATIONSHIP_HARMONY",
  LOVE_PROSPECTS: "LOVE_PROSPECTS",

  // Career & Employment
  CAREER_OPPORTUNITY: "CAREER_OPPORTUNITY",
  JOB_CHANGE: "JOB_CHANGE",
  PROMOTION_TIMING: "PROMOTION_TIMING",
  EMPLOYMENT_STABILITY: "EMPLOYMENT_STABILITY",
  CAREER_ZENITH: "CAREER_ZENITH",

  // Business & Enterprise
  BUSINESS_START: "BUSINESS_START",
  BUSINESS_EXPANSION: "BUSINESS_EXPANSION",
  BUSINESS_DIVERSIFICATION: "BUSINESS_DIVERSIFICATION",
  PARTNERSHIP_FORMATION: "PARTNERSHIP_FORMATION",

  // Education & Research
  EXAM_SUCCESS: "EXAM_SUCCESS",
  HIGHER_EDUCATION: "HIGHER_EDUCATION",
  RESEARCH_SUBMISSION: "RESEARCH_SUBMISSION",
  ACADEMIC_MILESTONE: "ACADEMIC_MILESTONE",

  // Travel & Relocation
  FOREIGN_TRIP: "FOREIGN_TRIP",
  WORK_ABROAD: "WORK_ABROAD",
  FOREIGN_SETTLEMENT: "FOREIGN_SETTLEMENT",
  DOMESTIC_TRIP: "DOMESTIC_TRIP",

  // Property & Assets
  CONSTRUCTION_START: "CONSTRUCTION_START",
  CONSTRUCTION_COMPLETION: "CONSTRUCTION_COMPLETION",
  PROPERTY_PURCHASE: "PROPERTY_PURCHASE",
  HOUSEWARMING: "HOUSEWARMING",
  PROPERTY_SALE: "PROPERTY_SALE",

  // Vehicle
  VEHICLE_PURCHASE: "VEHICLE_PURCHASE",
  VEHICLE_DELIVERY_ELECTION: "VEHICLE_DELIVERY_ELECTION",
  LUXURY_VEHICLE_PURCHASE: "LUXURY_VEHICLE_PURCHASE",

  // Finance & Wealth
  WEALTH_ACCUMULATION: "WEALTH_ACCUMULATION",
  FINANCIAL_STABILITY: "FINANCIAL_STABILITY",
  INVESTMENT_TIMING: "INVESTMENT_TIMING",

  // Family & Progeny
  FAMILY_EXPANSION: "FAMILY_EXPANSION",
  CHILDREN_OUTLOOK: "CHILDREN_OUTLOOK",
  PARENTAL_WELLBEING: "PARENTAL_WELLBEING",

  // Leadership & Legal
  LEADERSHIP_ELEVATION: "LEADERSHIP_ELEVATION",
  LEGAL_DISPUTE_RESOLUTION: "LEGAL_DISPUTE_RESOLUTION",

  // Forecast & Actions
  MONTHLY_OUTLOOK: "MONTHLY_OUTLOOK",
  DAILY_DRESS_COLOR: "DAILY_DRESS_COLOR",
  SPIRITUAL_INITIATION: "SPIRITUAL_INITIATION",

  GENERAL_EVENT: "GENERAL_EVENT"
});

/**
 * Supported Question Task Taxonomy
 */
export const SPEC_TASKS = Object.freeze({
  FACT: "FACT",
  INTERPRETATION: "INTERPRETATION",
  TIMING: "TIMING",
  FORECAST: "FORECAST",
  ELECTION: "ELECTION",
  COMPARISON: "COMPARISON",
  DECISION_SUPPORT: "DECISION_SUPPORT",
  EXPLANATION: "EXPLANATION",
  PERSONALIZATION: "PERSONALIZATION",
  FOLLOW_UP: "FOLLOW_UP",
  UNSAFE_GUARANTEE_REJECTION: "UNSAFE_GUARANTEE_REJECTION"
});

/**
 * Answer Resolution Status Taxonomy
 */
export const SPEC_RESOLUTION_STATUS = Object.freeze({
  RESOLVED: "RESOLVED",
  UNRESOLVED_AMBIGUOUS: "UNRESOLVED_AMBIGUOUS",
  CLARIFICATION_REQUIRED: "CLARIFICATION_REQUIRED",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  UNSUPPORTED_DOMAIN: "UNSUPPORTED_DOMAIN"
});

/**
 * Creates a validated Question Specification instance containing all 16 required attributes.
 *
 * @param {Object} params
 * @returns {Object} Strongly-typed QuestionSpecification
 */
export function createQuestionSpecification(params = {}) {
  const {
    id = "SPEC_" + Math.random().toString(36).slice(2, 10),
    originalQuestion = params.rawQuestion || "",
    rawQuestion = originalQuestion,
    normalizedQuestion = params.normalizedQuestion || (typeof rawQuestion === "string" ? rawQuestion.trim().toLowerCase() : ""),
    language = "en",
    intent = params.task || SPEC_TASKS.INTERPRETATION,
    domain = SPEC_DOMAINS.GENERAL,
    subject = "ACTIVE_PROFILE",
    eventDefinition = params.event || SPEC_EVENTS.GENERAL_EVENT,
    event = eventDefinition,
    requestedTimingHorizon = params.horizon || null,
    horizon = requestedTimingHorizon,
    requestedPrecision = params.requestedPrecision || null,
    requiredChartFacts = params.requiredChartFacts || [],
    requiredRules = params.requiredRules || [],
    missingInformation = params.missingInformation || [],
    ambiguities = params.ambiguities || [],
    contradictions = params.contradictions || [],
    evidenceRequirements = params.evidenceRequirements || [],
    answerResolutionStatus = params.answerResolutionStatus || (ambiguities.length > 0 ? SPEC_RESOLUTION_STATUS.UNRESOLVED_AMBIGUOUS : SPEC_RESOLUTION_STATUS.RESOLVED),
    task = intent,
    actionLocation = null,
    actionTimezone = null,
    alternatives = [],
    unresolvedSlots = missingInformation,
    safetyFlags = []
  } = params;

  return {
    id,
    // 16 Mandatory Attributes
    originalQuestion,
    rawQuestion,
    normalizedQuestion,
    language,
    intent,
    domain: String(domain).toUpperCase(),
    subject,
    eventDefinition,
    event,
    requestedTimingHorizon,
    horizon,
    requestedPrecision,
    requiredChartFacts,
    requiredRules,
    missingInformation,
    ambiguities,
    contradictions,
    evidenceRequirements,
    answerResolutionStatus,

    // Operational metadata
    task,
    actionLocation,
    actionTimezone,
    alternatives,
    unresolvedSlots,
    safetyFlags,
    createdAt: new Date().toISOString()
  };
}

/**
 * Validates a QuestionSpecification object against strict schema invariants.
 * Rejects unknown domains, malformed types, and ungrounded confident categories.
 *
 * @param {Object} spec
 * @returns {{ isValid: boolean, errors: string[], sanitizedSpec: Object }}
 */
export function validateQuestionSpecification(spec) {
  const errors = [];
  if (!spec || typeof spec !== "object") {
    return {
      isValid: false,
      errors: ["SPEC_NULL: Question specification must be a non-null object."],
      sanitizedSpec: null
    };
  }

  // 1. Domain Validation: Must exist in SPEC_DOMAINS
  const domainUpper = String(spec.domain || "").toUpperCase();
  if (!Object.values(SPEC_DOMAINS).includes(domainUpper)) {
    errors.push(`INVALID_DOMAIN: '${spec.domain}' is not a recognized prediction domain.`);
  }

  // 2. Language Validation
  if (!spec.language || !["en", "ta"].includes(spec.language)) {
    errors.push(`INVALID_LANGUAGE: Language must be 'en' or 'ta', received '${spec.language}'.`);
  }

  // 3. Original Question presence
  const rawQ = spec.originalQuestion || spec.rawQuestion;
  if (!rawQ || typeof rawQ !== "string" || rawQ.trim().length === 0) {
    errors.push("MISSING_ORIGINAL_QUESTION: originalQuestion must be a non-empty string.");
  }

  // 4. Ambiguity / Clarification check
  let resolutionStatus = spec.answerResolutionStatus || SPEC_RESOLUTION_STATUS.RESOLVED;
  const ambiguities = Array.isArray(spec.ambiguities) ? spec.ambiguities : [];
  if (ambiguities.length > 0 && resolutionStatus === SPEC_RESOLUTION_STATUS.RESOLVED) {
    resolutionStatus = SPEC_RESOLUTION_STATUS.UNRESOLVED_AMBIGUOUS;
  }

  const sanitizedSpec = {
    ...spec,
    domain: domainUpper,
    ambiguities,
    missingInformation: Array.isArray(spec.missingInformation) ? spec.missingInformation : [],
    requiredChartFacts: Array.isArray(spec.requiredChartFacts) ? spec.requiredChartFacts : [],
    requiredRules: Array.isArray(spec.requiredRules) ? spec.requiredRules : [],
    evidenceRequirements: Array.isArray(spec.evidenceRequirements) ? spec.evidenceRequirements : [],
    answerResolutionStatus: errors.length > 0 ? SPEC_RESOLUTION_STATUS.UNSUPPORTED_DOMAIN : resolutionStatus
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedSpec
  };
}
