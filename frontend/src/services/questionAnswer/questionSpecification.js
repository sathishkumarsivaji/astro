/**
 * ASTROVERSE — Canonical Question Specification
 * ===============================================
 * Standardizes the user's query into a strongly-typed domain × event × task specification.
 * Ensures the system evaluates the exact event requested without conflating distinct life events:
 * - Foreign trip !== Foreign settlement !== Work abroad
 * - Building a home !== Buying a property !== Home construction completion
 * - Buying an ordinary car !== Purchasing an ultra-luxury vehicle
 * - Upcoming months forecast !== Full-life natal overview
 */

/**
 * Supported Domain Taxonomy
 */
export const SPEC_DOMAINS = Object.freeze({
  CAREER: "CAREER",
  BUSINESS: "BUSINESS",
  EDUCATION: "EDUCATION",
  TRAVEL: "TRAVEL",
  PROPERTY: "PROPERTY",
  VEHICLE: "VEHICLE",
  RELATIONSHIPS: "RELATIONSHIPS",
  FAMILY: "FAMILY",
  FINANCE: "FINANCE",
  WELLNESS: "WELLNESS",
  LEGAL: "LEGAL",
  SPIRITUALITY: "SPIRITUALITY",
  DAILY_GUIDANCE: "DAILY_GUIDANCE",
  FORECAST: "FORECAST",
  GENERAL: "GENERAL"
});

/**
 * Supported Event Taxonomy
 */
export const SPEC_EVENTS = Object.freeze({
  // Travel
  FOREIGN_TRIP: "FOREIGN_TRIP",
  WORK_ABROAD: "WORK_ABROAD",
  FOREIGN_SETTLEMENT: "FOREIGN_SETTLEMENT",
  DOMESTIC_TRIP: "DOMESTIC_TRIP",

  // Property
  CONSTRUCTION_START: "CONSTRUCTION_START",
  CONSTRUCTION_COMPLETION: "CONSTRUCTION_COMPLETION",
  PROPERTY_PURCHASE: "PROPERTY_PURCHASE",
  HOUSEWARMING: "HOUSEWARMING",
  PROPERTY_SALE: "PROPERTY_SALE",

  // Vehicle
  VEHICLE_PURCHASE: "VEHICLE_PURCHASE",
  VEHICLE_DELIVERY_ELECTION: "VEHICLE_DELIVERY_ELECTION",
  LUXURY_VEHICLE_PURCHASE: "LUXURY_VEHICLE_PURCHASE",

  // Forecast & Actions
  MONTHLY_OUTLOOK: "MONTHLY_OUTLOOK",
  DAILY_DRESS_COLOR: "DAILY_DRESS_COLOR",
  RESEARCH_SUBMISSION: "RESEARCH_SUBMISSION",
  BUSINESS_EXPANSION: "BUSINESS_EXPANSION",
  BUSINESS_START: "BUSINESS_START",
  BUSINESS_DIVERSIFICATION: "BUSINESS_DIVERSIFICATION",
  CAREER_OPPORTUNITY: "CAREER_OPPORTUNITY",
  JOB_CHANGE: "JOB_CHANGE",
  MARRIAGE_TIMING: "MARRIAGE_TIMING",

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
 * Creates a validated Question Specification instance.
 *
 * @param {Object} params
 * @returns {Object} Structured QuestionSpecification
 */
export function createQuestionSpecification(params = {}) {
  const {
    id = "SPEC_" + Math.random().toString(36).slice(2, 10),
    rawQuestion = "",
    language = "en",
    domain = SPEC_DOMAINS.GENERAL,
    event = SPEC_EVENTS.GENERAL_EVENT,
    task = SPEC_TASKS.INTERPRETATION,
    subject = "ACTIVE_PROFILE",
    horizon = null,
    actionLocation = null,
    actionTimezone = null,
    alternatives = [],
    requestedPrecision = null,
    unresolvedSlots = [],
    safetyFlags = []
  } = params;

  return {
    id,
    rawQuestion,
    language,
    domain,
    event,
    task,
    subject,
    horizon,
    actionLocation,
    actionTimezone,
    alternatives,
    requestedPrecision,
    unresolvedSlots,
    safetyFlags,
    createdAt: new Date().toISOString()
  };
}
