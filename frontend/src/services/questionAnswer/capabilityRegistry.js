/**
 * SKR ASTRO — Capability Registry
 * =================================
 * Explicitly declares which (domain × event × task) combinations have dedicated,
 * verified implementations vs planned features.
 *
 * Prevents "fake support" or silent fallback to generic chart summaries.
 * An unsupported question receives an honest UNSUPPORTED_TASK / NEEDS_INPUT status
 * rather than being promoted to a supported natal interpretation.
 */

import { SPEC_DOMAINS, SPEC_EVENTS, SPEC_TASKS } from "./questionSpecification.js";

export const CAPABILITY_REGISTRY = [
  // 1. Foreign Travel
  {
    domain: SPEC_DOMAINS.TRAVEL,
    event: SPEC_EVENTS.FOREIGN_TRIP,
    task: SPEC_TASKS.TIMING,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "foreignTripTiming",
    requiredInputs: ["birthProfile", "calculationSettings", "forecastHorizon"],
    requiredCalculations: ["natalFacts", "dashaTimeline", "eventTransitRelationships"],
    outputSchema: "EventTimingAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates prospective temporary travel timing using 3rd, 9th, and 12th houses, Moon, and Rahu."
  },
  {
    domain: SPEC_DOMAINS.TRAVEL,
    event: SPEC_EVENTS.FOREIGN_SETTLEMENT,
    task: SPEC_TASKS.TIMING,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "foreignSettlementTiming",
    requiredInputs: ["birthProfile", "calculationSettings"],
    requiredCalculations: ["natalFacts", "dashaTimeline"],
    outputSchema: "EventTimingAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates permanent relocation abroad using 4th dispositor afflictions and 12th house roots."
  },

  // 2. Property Construction & Purchase
  {
    domain: SPEC_DOMAINS.PROPERTY,
    event: SPEC_EVENTS.CONSTRUCTION_START,
    task: SPEC_TASKS.TIMING,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "homeConstructionTiming",
    requiredInputs: ["birthProfile", "calculationSettings", "constructionPhase"],
    requiredCalculations: ["natalFacts", "dashaTimeline", "marsSaturnDignity"],
    outputSchema: "EventTimingAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates home building/construction foundation timing using 4th house, Mars, and Saturn."
  },
  {
    domain: SPEC_DOMAINS.PROPERTY,
    event: SPEC_EVENTS.CONSTRUCTION_COMPLETION,
    task: SPEC_TASKS.TIMING,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "homeConstructionTiming",
    requiredInputs: ["birthProfile", "calculationSettings", "constructionPhase"],
    requiredCalculations: ["natalFacts", "dashaTimeline"],
    outputSchema: "EventTimingAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates house building completion with explicit notice regarding real-world engineering dependencies."
  },
  {
    domain: SPEC_DOMAINS.PROPERTY,
    event: SPEC_EVENTS.PROPERTY_PURCHASE,
    task: SPEC_TASKS.TIMING,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "homeConstructionTiming",
    requiredInputs: ["birthProfile", "calculationSettings"],
    requiredCalculations: ["natalFacts", "dashaTimeline", "marsStrength"],
    outputSchema: "EventTimingAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates real estate acquisition timing windows."
  },

  // 3. Vehicles
  {
    domain: SPEC_DOMAINS.VEHICLE,
    event: SPEC_EVENTS.VEHICLE_PURCHASE,
    task: SPEC_TASKS.TIMING,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "vehicleAcquisitionTiming",
    requiredInputs: ["birthProfile", "calculationSettings"],
    requiredCalculations: ["natalFacts", "dashaTimeline", "venusMarsDispositions"],
    outputSchema: "EventTimingAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates ordinary automobile/two-wheeler acquisition timing without requiring luxury yogas."
  },
  {
    domain: SPEC_DOMAINS.VEHICLE,
    event: SPEC_EVENTS.LUXURY_VEHICLE_PURCHASE,
    task: SPEC_TASKS.INTERPRETATION,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "luxuryVehicleEvaluation",
    requiredInputs: ["birthProfile", "calculationSettings"],
    requiredCalculations: ["natalFacts", "d10Dashamsha", "dhanaYogas"],
    outputSchema: "ConveyanceTierAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates high-end luxury conveyance tier without guaranteeing commercial trademarks."
  },

  // 4. Forecast Horizons
  {
    domain: SPEC_DOMAINS.FORECAST,
    event: SPEC_EVENTS.MONTHLY_OUTLOOK,
    task: SPEC_TASKS.FORECAST,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "monthlyOutlook",
    requiredInputs: ["birthProfile", "forecastHorizon", "actionTimezone"],
    requiredCalculations: ["natalFacts", "activeDasha", "monthlyTransits"],
    outputSchema: "MonthlyForecastAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Generates month-by-month outlook across dominant life domains over a disclosed horizon."
  },

  // 5. Daily Guidance & Elections
  {
    domain: SPEC_DOMAINS.DAILY_GUIDANCE,
    event: SPEC_EVENTS.DAILY_DRESS_COLOR,
    task: SPEC_TASKS.PERSONALIZATION,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "dailyDressColor",
    requiredInputs: ["referenceInstant", "actionTimezone"],
    requiredCalculations: ["weekdayRuler"],
    outputSchema: "ColorRecommendationAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Provides daily wardrobe color recommendation using disclosed planetary weekday traditions."
  },
  {
    domain: SPEC_DOMAINS.EDUCATION,
    event: SPEC_EVENTS.RESEARCH_SUBMISSION,
    task: SPEC_TASKS.ELECTION,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "researchSubmissionElection",
    requiredInputs: ["referenceInstant", "actionTimezone"],
    requiredCalculations: ["practicalChecklist", "dailyElection"],
    outputSchema: "ElectionAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Distinguishes practical submission readiness from electional windows without acceptance predictions."
  },
  {
    domain: SPEC_DOMAINS.BUSINESS,
    event: SPEC_EVENTS.BUSINESS_EXPANSION,
    task: SPEC_TASKS.TIMING,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "businessExpansionElection",
    requiredInputs: ["referenceInstant", "actionTimezone", "requestedWeek"],
    requiredCalculations: ["weeklyElection"],
    outputSchema: "ElectionAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates expansion timing for requested week without promising commercial profit or good luck."
  },
  {
    domain: SPEC_DOMAINS.BUSINESS,
    event: SPEC_EVENTS.BUSINESS_DIVERSIFICATION,
    task: SPEC_TASKS.DECISION_SUPPORT,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "businessExpansionDecision",
    requiredInputs: ["birthProfile", "businessType"],
    requiredCalculations: ["7thHouseMarket", "10thHouseStanding"],
    outputSchema: "DecisionSupportAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates branch scaling vs new industry diversification, asking clarification when ambiguous."
  },

  // 6. Relationship Harmony & Reconciliation
  {
    domain: SPEC_DOMAINS.RELATIONSHIPS,
    event: SPEC_EVENTS.RELATIONSHIP_HARMONY,
    task: SPEC_TASKS.INTERPRETATION,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "marriageRelationshipOutlook",
    requiredInputs: ["birthProfile", "calculationSettings"],
    requiredCalculations: ["natalFacts", "7thHouseLord", "venusJupiterDignity", "dashaTimeline"],
    outputSchema: "RelationshipHarmonyAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates relational harmony, mutual communication, and reconciliation scope distinct from marriage formation."
  },

  // 7. Spouse Family Economic Comparison
  {
    domain: SPEC_DOMAINS.MARRIAGE,
    event: SPEC_EVENTS.SPOUSE_CHARACTERISTICS,
    task: SPEC_TASKS.COMPARISON,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "spouseFamilyComparison",
    requiredInputs: ["birthProfile", "calculationSettings"],
    requiredCalculations: ["2ndHouseNative", "8thHouseSpouseFamily", "jupiterVenusDispositions"],
    outputSchema: "SocioEconomicComparisonAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates 2nd vs 8th house traditional assets without fabricating currency figures or declaring unverified parity."
  },

  // 8. Household Residence Arrangement
  {
    domain: SPEC_DOMAINS.FAMILY,
    event: SPEC_EVENTS.GENERAL_EVENT,
    task: SPEC_TASKS.INTERPRETATION,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "householdArrangement",
    requiredInputs: ["birthProfile", "calculationSettings"],
    requiredCalculations: ["4thHouseResidence", "2ndHouseKutumba", "moonNodalInfluences"],
    outputSchema: "ResidenceArrangementAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Evaluates joint family vs independent nuclear living without substituting D10 career commentary."
  },

  // 9. Foreign Employment
  {
    domain: SPEC_DOMAINS.EMPLOYMENT,
    event: SPEC_EVENTS.WORK_ABROAD,
    task: SPEC_TASKS.TIMING,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "foreignEmployment",
    requiredInputs: ["birthProfile", "calculationSettings"],
    requiredCalculations: ["10th6thCareer", "9th12thForeign", "rahuActivation", "dashaTimeline"],
    outputSchema: "EventTimingAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Requires simultaneous career (10th/6th) and foreign residence (9th/12th/Rahu) activation; travel alone does not entail employment."
  },

  // 10. Named Examination Outlook
  {
    domain: SPEC_DOMAINS.EDUCATION,
    event: SPEC_EVENTS.EXAM_SUCCESS,
    task: SPEC_TASKS.INTERPRETATION,
    implementationStatus: "IMPLEMENTED",
    evaluatorId: "namedExamination",
    requiredInputs: ["birthProfile", "calculationSettings", "examName", "targetSession"],
    requiredCalculations: ["5thHouseDiscernment", "6thHouseCompetition", "mercuryJupiterDignity", "dashaTimeline"],
    outputSchema: "ExaminationOutlookAnswer",
    empiricalStatus: "NOT_VALIDATED",
    description: "Preserves exact exam name and target session, refuses pass/fail guarantees, and emphasizes syllabus mastery and mock tests."
  }
];

/**
 * Looks up capability entry in registry.
 *
 * @param {string} domain - Specification domain
 * @param {string} event - Specification event
 * @param {string} task - Specification task
 * @returns {Object} Matching capability record or UNSUPPORTED descriptor
 */
export function getCapability(domain, event, task) {
  const normDom = (domain || "").toUpperCase();
  const normEv = (event || "").toUpperCase();
  const normTask = (task || "").toUpperCase();

  const match = CAPABILITY_REGISTRY.find(c =>
    c.domain.toUpperCase() === normDom &&
    c.event.toUpperCase() === normEv &&
    c.task.toUpperCase() === normTask
  );

  if (match) {
    return match;
  }

  // Fallback: check by event if specialized
  const eventMatch = CAPABILITY_REGISTRY.find(c => c.event.toUpperCase() === normEv);
  if (eventMatch) {
    return eventMatch;
  }

  return {
    domain,
    event,
    task,
    implementationStatus: "UNSUPPORTED_TASK",
    evaluatorId: null,
    requiredInputs: [],
    requiredCalculations: [],
    outputSchema: null,
    empiricalStatus: "NOT_VALIDATED",
    description: "This domain/event/task combination is not currently implemented in the dedicated pipeline."
  };
}
