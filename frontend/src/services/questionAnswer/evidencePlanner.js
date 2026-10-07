/**
 * ASTROVERSE — Question-Specific Evidence Planner
 * =================================================
 * Determines the precise astrological facts and chart factors required
 * to answer a specific query without indiscriminate data dumping.
 */

import { QUESTION_INTENTS } from "./intentClassifier.js";
import { DOMAINS } from "./domainClassifier.js";

/**
 * Plans the required evidence based on intent, domains, and entities.
 *
 * @param {Object} planInput
 * @param {Object} planInput.intentResult
 * @param {Object} planInput.domainResult
 * @param {Object} planInput.entities
 * @returns {Object} Evidence plan detailing required chart factors
 */
export function planRequiredEvidence({ intentResult, domainResult, entities }) {
  const primaryIntent = intentResult?.primaryIntent || QUESTION_INTENTS.GENERAL_INTERPRETATION;
  const intents = new Set(intentResult?.intents || []);
  const primaryDomain = domainResult?.primaryDomain || DOMAINS.GENERAL;
  const domains = new Set(domainResult?.domains || []);
  const req = entities?.requestedQuantities || {};

  const plan = {
    primaryIntent,
    primaryDomain,
    requiredPlanets: new Set(entities?.planets || []),
    requiredHouses: new Set(entities?.houses || []),
    requiredLords: new Set(entities?.lords || []),
    requiredVargas: new Set(entities?.vargas || []),
    requiredDashas: Boolean(entities?.dashaPair || req.dashaRequested || req.timingRequested),
    requiredTransits: Boolean(req.timingRequested || domains.has(DOMAINS.CAREER) || domains.has(DOMAINS.MARRIAGE)),
    requiredDirectionAnalysis: Boolean(req.directionRequested || intents.has(QUESTION_INTENTS.SPOUSE_DIRECTION)),
    requiredDistanceAnalysis: Boolean(req.distanceRequested || intents.has(QUESTION_INTENTS.SPOUSE_DISTANCE)),
    requiredComparison: Boolean(req.comparisonRequested || intents.has(QUESTION_INTENTS.COMPARISON) || req.familyWealthRequested),
    includeTiming: Boolean(req.timingRequested || intents.has(QUESTION_INTENTS.TIMING)),
    includeRemedies: Boolean(req.remedyRequested || intents.has(QUESTION_INTENTS.REMEDY)),
    dashaPair: entities?.dashaPair || null,
    specifiedSign: entities?.signs?.[0] || null,
    targetYears: entities?.years || [],
    durationYears: entities?.durationYears || null,
    specificFactors: []
  };

  // Specific Intent Plans

  // 1. Spouse Family / Family Wealth Comparison
  if (intents.has(QUESTION_INTENTS.SPOUSE_FAMILY) || req.familyWealthRequested) {
    plan.requiredHouses.add(2); // Native family wealth
    plan.requiredHouses.add(4); // Native home/lineage
    plan.requiredHouses.add(7); // Spouse
    plan.requiredHouses.add(8); // Spouse's family wealth (2nd from 7th)
    plan.requiredLords.add("2ndLord");
    plan.requiredLords.add("7thLord");
    plan.requiredLords.add("8thLord");
    plan.requiredPlanets.add("Jupiter"); // Dhana karaka
    plan.requiredPlanets.add("Venus"); // Kalatra karaka
    plan.requiredVargas.add("D9");
    plan.requiredComparison = true;
    plan.specificFactors.push("NATIVE_2ND_VS_SPOUSE_8TH_WEALTH_TIER");
  }

  // 2. Spouse Direction
  if (intents.has(QUESTION_INTENTS.SPOUSE_DIRECTION) || req.directionRequested) {
    plan.requiredHouses.add(7);
    plan.requiredLords.add("7thLord");
    plan.requiredPlanets.add("Venus");
    plan.requiredVargas.add("D9");
    plan.requiredDirectionAnalysis = true;
    plan.specificFactors.push("7TH_HOUSE_SIGN_DIRECTION", "7TH_LORD_SIGN_DIRECTION", "VENUS_SIGN_DIRECTION");
  }

  // 3. Spouse Distance
  if (intents.has(QUESTION_INTENTS.SPOUSE_DISTANCE) || req.distanceRequested) {
    plan.requiredDistanceAnalysis = true;
    plan.specificFactors.push("GEOGRAPHIC_DISTANCE_EVALUATION");
  }

  // 4. Dasha Effect / Current Dasha
  if (intents.has(QUESTION_INTENTS.DASHA_EFFECT) || intents.has(QUESTION_INTENTS.CURRENT_DASHA) || entities?.dashaPair) {
    plan.requiredDashas = true;
    if (entities?.dashaPair) {
      plan.requiredPlanets.add(entities.dashaPair.mahadasha);
      plan.requiredPlanets.add(entities.dashaPair.antardasha);
    }
    plan.specificFactors.push("MUTUAL_DASHA_RELATIONSHIP", "DASHA_LORD_DIGNITIES", "ACTIVATED_DOMAINS");
  }

  // 5. Varga Interpretation (e.g. D10)
  if (intents.has(QUESTION_INTENTS.VARGA_INTERPRETATION) || entities?.vargas?.includes("D10")) {
    plan.requiredVargas.add("D10");
    plan.requiredHouses.add(10);
    plan.requiredPlanets.add("Sun");
    plan.requiredPlanets.add("Saturn");
    plan.specificFactors.push("D10_LAGNA", "D10_LAGNA_LORD", "D10_10TH_HOUSE", "D10_10TH_LORD", "D1_TO_D10_ALIGNMENT");
  }

  // 6. Property
  if (domains.has(DOMAINS.PROPERTY) || intents.has(QUESTION_INTENTS.PROPERTY)) {
    plan.requiredHouses.add(4);
    plan.requiredLords.add("4thLord");
    plan.requiredPlanets.add("Mars"); // Bhumi karaka
    plan.requiredPlanets.add("Venus");
    plan.requiredVargas.add("D4");
    plan.specificFactors.push("4TH_HOUSE_STRENGTH", "MARS_DIGNITY", "PROPERTY_ACQUISITION_TIMING");
  }

  // 7. Finance
  if (domains.has(DOMAINS.FINANCE) || intents.has(QUESTION_INTENTS.FINANCE)) {
    plan.requiredHouses.add(2);
    plan.requiredHouses.add(11);
    plan.requiredHouses.add(5);
    plan.requiredHouses.add(9);
    plan.requiredLords.add("2ndLord");
    plan.requiredLords.add("11thLord");
    plan.requiredPlanets.add("Jupiter");
    plan.requiredPlanets.add("Mercury");
    plan.specificFactors.push("DHANA_YOGAS", "ACCUMULATION_POTENTIAL", "LIQUID_FLOW");
  }

  // 8. Wellness
  if (domains.has(DOMAINS.WELLNESS) || intents.has(QUESTION_INTENTS.WELLNESS)) {
    plan.requiredHouses.add(1);
    plan.requiredHouses.add(6);
    plan.requiredHouses.add(8);
    plan.requiredPlanets.add("Sun");
    plan.requiredPlanets.add("Moon");
    plan.requiredPlanets.add("Saturn");
    plan.specificFactors.push("PHYSICAL_VITALITY", "IMMUNE_RESILIENCE", "TRADITIONAL_WELLNESS_ONLY");
  }

  // 9. Legal / Caution
  if (domains.has(DOMAINS.LEGAL) || intents.has(QUESTION_INTENTS.LEGAL) || domains.has(DOMAINS.CAUTION)) {
    plan.requiredHouses.add(6);
    plan.requiredHouses.add(8);
    plan.requiredPlanets.add("Mars");
    plan.requiredPlanets.add("Saturn");
    plan.specificFactors.push("LITIGATION_DISPUTE_RISK", "CAUTION_WINDOW");
  }

  // 10. Major Milestones / Multi-Year Timeline
  if (intents.has(QUESTION_INTENTS.MAJOR_MILESTONE) || plan.durationYears || domains.has(DOMAINS.MILESTONES)) {
    plan.requiredDashas = true;
    plan.requiredTransits = true;
    plan.includeTiming = true;
    plan.specificFactors.push("CHRONOLOGICAL_LIFE_STAGE_TRANSITIONS", "MAJOR_TRANSIT_SHIFTS");
  }

  return {
    ...plan,
    requiredPlanets: Array.from(plan.requiredPlanets),
    requiredHouses: Array.from(plan.requiredHouses),
    requiredLords: Array.from(plan.requiredLords),
    requiredVargas: Array.from(plan.requiredVargas)
  };
}
