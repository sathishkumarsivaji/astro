/**
 * ASTROVERSE — Question-Specific Evidence Planner
 * =================================================
 * Determines the precise astrological facts and chart factors required
 * to answer a specific query without indiscriminate data dumping.
 *
 * Implements Section 4 of the Precision Q&A Engine Mandate.
 */

import { QUESTION_INTENTS, TASK_INTENTS, CHILDREN_TASKS } from "./intentClassifier.js";
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

  const isTask = Boolean(primaryIntent && TASK_INTENTS[primaryIntent]);

  const plan = {
    primaryIntent,
    primaryDomain,
    isTask,
    taskType: isTask ? primaryIntent : null,
    requiredPlanets: new Set(entities?.planets || []),
    requiredHouses: new Set(entities?.houses || []),
    requiredLords: new Set(entities?.lords || []),
    requiredVargas: new Set(entities?.vargas || []),
    requiredDashas: Boolean(entities?.dashaPair || req.dashaRequested || req.timingRequested),
    requiredTransits: Boolean(req.timingRequested || domains.has(DOMAINS.CAREER) || domains.has(DOMAINS.MARRIAGE) || primaryIntent === TASK_INTENTS.BUSINESS_EXPANSION_ELECTION || primaryIntent === TASK_INTENTS.RESEARCH_SUBMISSION_ELECTION),
    requiredDirectionAnalysis: Boolean(req.directionRequested || intents.has(QUESTION_INTENTS.SPOUSE_DIRECTION)),
    requiredDistanceAnalysis: Boolean(req.distanceRequested || intents.has(QUESTION_INTENTS.SPOUSE_DISTANCE)),
    requiredComparison: Boolean(req.comparisonRequested || intents.has(QUESTION_INTENTS.COMPARISON) || req.familyWealthRequested),
    includeTiming: Boolean(req.timingRequested || intents.has(QUESTION_INTENTS.TIMING) || primaryIntent === TASK_INTENTS.BUSINESS_EXPANSION_ELECTION || primaryIntent === TASK_INTENTS.RESEARCH_SUBMISSION_ELECTION),
    includeRemedies: Boolean(req.remedyRequested || intents.has(QUESTION_INTENTS.REMEDY)),
    dashaPair: entities?.dashaPair || null,
    userClaimedSign: entities?.signs?.[0] || null,
    targetYears: entities?.years || [],
    durationYears: entities?.durationYears || null,
    specificFactors: []
  };

  // Dedicated Tasks Planning
  if (primaryIntent === TASK_INTENTS.DAILY_DRESS_COLOR) {
    plan.requiredHouses.clear();
    plan.requiredPlanets.clear();
    plan.requiredDashas = false;
  } else if (primaryIntent === TASK_INTENTS.BUSINESS_EXPANSION_ELECTION) {
    plan.requiredHouses.add(7);
    plan.requiredHouses.add(10);
    plan.requiredHouses.add(11);
  } else if (primaryIntent === TASK_INTENTS.RESEARCH_SUBMISSION_ELECTION) {
    plan.requiredHouses.add(5);
    plan.requiredHouses.add(9);
  } else if (primaryIntent === TASK_INTENTS.FOREIGN_TRIP_TIMING) {
    plan.requiredHouses.add(3);
    plan.requiredHouses.add(9);
    plan.requiredHouses.add(12);
    plan.requiredDashas = true;
    plan.requiredTransits = true;
  } else if (primaryIntent === TASK_INTENTS.HOME_CONSTRUCTION_TIMING) {
    plan.requiredHouses.add(4);
    plan.requiredHouses.add(11);
    plan.requiredDashas = true;
    plan.requiredTransits = true;
  } else if (primaryIntent === TASK_INTENTS.VEHICLE_PURCHASE_TIMING) {
    plan.requiredHouses.add(4);
    plan.requiredHouses.add(11);
    plan.requiredDashas = true;
    plan.requiredTransits = true;
  } else if (primaryIntent === TASK_INTENTS.MONTHLY_OUTLOOK) {
    plan.requiredDashas = true;
    plan.requiredTransits = true;
  }

  // Children domain — sub-intent specific evidence plans
  // These MUST be set before the generic domain loops below to prevent empty-plan fallthrough.
  if (intents.has(CHILDREN_TASKS.CHILDREN_COUNT)) {
    // COUNT: Explicit policy — no integer count derivable from chart factors.
    plan.childrenEvidencePlan = {
      task: "CHILDREN_COUNT",
      answerState: "NOT_ESTABLISHED",
      requestedQuantity: "NUMBER_OF_CHILDREN",
      exactCount: null,
      estimatedCount: null,
      empiricalModelAvailable: false,
      countPolicyNote: "Exact child count is not derivable from chart symbolism. This task returns a clear limitation, not an invented number."
    };
    plan.requiredHouses.add(5);
    plan.requiredLords.add("5thLord");
    plan.requiredPlanets.add("Jupiter");
    plan.requiredVargas.add("D7");
    plan.specificFactors.push("CHILDREN_COUNT_POLICY_NOT_ESTABLISHED");
  } else if (intents.has(CHILDREN_TASKS.FAMILY_EXPANSION_TIMING)) {
    // TIMING: run event-specific dasha/transit window analysis.
    plan.childrenEvidencePlan = {
      task: "FAMILY_EXPANSION_TIMING",
      interpretationType: "TRADITIONAL",
      interpretationPolicy: "TRADITIONAL_ONLY",
      medicalFertilityAssessment: false,
      outcomeGuarantee: false
    };
    plan.requiredHouses.add(5);
    plan.requiredHouses.add(2);
    plan.requiredHouses.add(11);
    plan.requiredLords.add("5thLord");
    plan.requiredPlanets.add("Jupiter");
    plan.requiredVargas.add("D7");
    plan.requiredDashas = true;
    plan.requiredTransits = true;
    plan.includeTiming = true;
    plan.specificFactors.push("CHILDREN_TIMING_5TH_HOUSE", "FAMILY_EXPANSION_DASHA_TRANSIT");
  } else if (intents.has(CHILDREN_TASKS.CHILDREN_OUTLOOK)) {
    // OUTLOOK: traditional 5th house / Jupiter / D7 analysis.
    plan.childrenEvidencePlan = {
      task: "CHILDREN_OUTLOOK",
      interpretationType: "TRADITIONAL",
      interpretationPolicy: "TRADITIONAL_ONLY",
      medicalFertilityAssessment: false,
      outcomeGuarantee: false
    };
    plan.requiredHouses.add(5);
    plan.requiredHouses.add(2);
    plan.requiredHouses.add(11);
    plan.requiredLords.add("5thLord");
    plan.requiredPlanets.add("Jupiter");
    plan.requiredVargas.add("D7");
    plan.specificFactors.push("CHILDREN_OUTLOOK_5TH_HOUSE", "JUPITER_PROGENY_KARAKA", "D7_SAPTAMSHA");
  } else if (intents.has(CHILDREN_TASKS.CHILDREN_TRADITIONAL_INTERPRETATION)) {
    // TRADITIONAL: general chart-discussion about children domain.
    plan.childrenEvidencePlan = {
      task: "CHILDREN_TRADITIONAL_INTERPRETATION",
      interpretationType: "TRADITIONAL",
      interpretationPolicy: "TRADITIONAL_ONLY",
      medicalFertilityAssessment: false,
      outcomeGuarantee: false
    };
    plan.requiredHouses.add(5);
    plan.requiredLords.add("5thLord");
    plan.requiredPlanets.add("Jupiter");
    plan.specificFactors.push("CHILDREN_TRADITIONAL_5TH_HOUSE");
  } else if (intents.has(QUESTION_INTENTS.CHILDREN)) {
    // Broad CHILDREN intent (fallback) — still give a minimum evidence plan.
    plan.childrenEvidencePlan = {
      task: "CHILDREN_BROAD",
      interpretationType: "TRADITIONAL",
      interpretationPolicy: "TRADITIONAL_ONLY",
      medicalFertilityAssessment: false,
      outcomeGuarantee: false
    };
    plan.requiredHouses.add(5);
    plan.requiredLords.add("5thLord");
    plan.requiredPlanets.add("Jupiter");
    plan.specificFactors.push("CHILDREN_BROAD_5TH_HOUSE");
  }

  // 0. System Comparison (Lahiri vs KP)
  if (intents.has(QUESTION_INTENTS.SYSTEM_COMPARISON)) {
    plan.requiredHouses.add(1);
    plan.requiredHouses.add(7);
    plan.requiredHouses.add(10);
    plan.requiredLords.add("10thLord");
    plan.requiredLords.add("7thLord");
    plan.requiredMultiSystem = true;
    plan.specificFactors.push("LAHIRI_VS_KP_AYANAMSHA", "PLACIDUS_VS_EQUAL_CUSPS", "KP_SUB_LORDS", "PARASHARI_VS_KP_SIGNIFICATORS");
  }

  // Top Report Headings
  if (intents.has(QUESTION_INTENTS.TOP_HEADINGS)) {
    plan.specificFactors.push("TOP_REPORT_HEADINGS_RANKING");
  }

  // 1. Marriage & Spouse Intents
  if (domains.has(DOMAINS.MARRIAGE) || intents.has(QUESTION_INTENTS.MARRIAGE) || intents.has(QUESTION_INTENTS.SPOUSE_CHARACTERISTICS)) {
    plan.requiredHouses.add(1);
    plan.requiredHouses.add(7);
    plan.requiredLords.add("7thLord");
    plan.requiredPlanets.add("Venus");
    plan.requiredPlanets.add("Jupiter");
    plan.requiredHouses.add(2);
    plan.requiredHouses.add(11);
    plan.requiredVargas.add("D9");

    if (plan.includeTiming || intents.has(QUESTION_INTENTS.TIMING)) {
      plan.requiredDashas = true;
      plan.requiredTransits = true;
      plan.specificFactors.push("MARRIAGE_TIMING_DASHA_TRANSIT_CONVERGENCE");
    }
  }

  // 2. Spouse Family Wealth / Family Comparison
  if (intents.has(QUESTION_INTENTS.SPOUSE_FAMILY) || req.familyWealthRequested) {
    plan.requiredHouses.add(2); // Native family wealth
    plan.requiredHouses.add(4); // Native home/lineage
    plan.requiredHouses.add(7); // Spouse
    plan.requiredHouses.add(8); // Spouse's family wealth (2nd from 7th)
    plan.requiredHouses.add(5); // 11th from 7th (Spouse gains)
    plan.requiredLords.add("2ndLord");
    plan.requiredLords.add("7thLord");
    plan.requiredLords.add("8thLord");
    plan.requiredPlanets.add("Jupiter"); // Dhana karaka
    plan.requiredPlanets.add("Venus"); // Kalatra karaka
    plan.requiredVargas.add("D9");
    plan.requiredComparison = true;
    plan.specificFactors.push("NATIVE_2ND_VS_SPOUSE_8TH_WEALTH_TIER");
  }

  // 3. Spouse Direction
  if (intents.has(QUESTION_INTENTS.SPOUSE_DIRECTION) || req.directionRequested) {
    plan.requiredHouses.add(7);
    plan.requiredLords.add("7thLord");
    plan.requiredPlanets.add("Venus");
    plan.requiredVargas.add("D9");
    plan.requiredDirectionAnalysis = true;
    plan.specificFactors.push("7TH_HOUSE_SIGN_DIRECTION", "7TH_LORD_SIGN_DIRECTION", "VENUS_SIGN_DIRECTION");
  }

  // 4. Spouse Distance
  if (intents.has(QUESTION_INTENTS.SPOUSE_DISTANCE) || req.distanceRequested) {
    plan.requiredDistanceAnalysis = true;
    plan.specificFactors.push("GEOGRAPHIC_DISTANCE_EVALUATION");
  }

  // 5. Spouse Career
  if (/spouse.*(career|job|work)|துணை.*தொழில்/i.test(entities?.rawText || "")) {
    plan.requiredHouses.add(4); // 10th from 7th
    plan.requiredLords.add("4thLord");
    plan.requiredPlanets.add("Mercury");
    plan.requiredPlanets.add("Sun");
    plan.specificFactors.push("SPOUSE_10TH_FROM_7TH_VOCATION");
  }

  // 6. Property & Property Timing
  if (domains.has(DOMAINS.PROPERTY) || intents.has(QUESTION_INTENTS.PROPERTY)) {
    plan.requiredHouses.add(4);
    plan.requiredHouses.add(2);
    plan.requiredHouses.add(11);
    plan.requiredLords.add("4thLord");
    plan.requiredPlanets.add("Mars"); // Bhumi karaka
    plan.requiredPlanets.add("Venus"); // Sukha karaka
    plan.requiredVargas.add("D4");
    if (plan.includeTiming || intents.has(QUESTION_INTENTS.TIMING)) {
      plan.requiredDashas = true;
      plan.requiredTransits = true;
      plan.specificFactors.push("PROPERTY_ACQUISITION_TIMING_WINDOW");
    }
    plan.specificFactors.push("4TH_HOUSE_STRENGTH", "MARS_DIGNITY");
  }

  // 7. Career, Job Change & Business
  if (domains.has(DOMAINS.CAREER) || domains.has(DOMAINS.JOB) || intents.has(QUESTION_INTENTS.JOB) || intents.has(QUESTION_INTENTS.CAREER)) {
    plan.requiredHouses.add(6);
    plan.requiredHouses.add(10);
    plan.requiredHouses.add(11);
    plan.requiredLords.add("10thLord");
    plan.requiredPlanets.add("Saturn");
    plan.requiredPlanets.add("Sun");
    plan.requiredVargas.add("D10");
    if (plan.includeTiming || intents.has(QUESTION_INTENTS.TIMING)) {
      plan.requiredDashas = true;
      plan.requiredTransits = true;
      plan.specificFactors.push("CAREER_TRANSITION_TIMING");
    }
  }

  if (domains.has(DOMAINS.BUSINESS) || intents.has(QUESTION_INTENTS.BUSINESS)) {
    plan.requiredHouses.add(2);
    plan.requiredHouses.add(3); // Initiative
    plan.requiredHouses.add(7); // Partnerships / Market
    plan.requiredHouses.add(10); // Professional standing
    plan.requiredHouses.add(11); // Commercial gains
    plan.requiredPlanets.add("Mercury");
    plan.requiredPlanets.add("Jupiter");
    plan.requiredVargas.add("D10");
    if (plan.includeTiming || intents.has(QUESTION_INTENTS.TIMING)) {
      plan.requiredDashas = true;
      plan.requiredTransits = true;
      plan.specificFactors.push("BUSINESS_START_TIMING");
    }
  }

  // 8. Finance
  if (domains.has(DOMAINS.FINANCE) || intents.has(QUESTION_INTENTS.FINANCE)) {
    plan.requiredHouses.add(2);
    plan.requiredHouses.add(5);
    plan.requiredHouses.add(9);
    plan.requiredHouses.add(11);
    plan.requiredLords.add("2ndLord");
    plan.requiredLords.add("11thLord");
    plan.requiredPlanets.add("Jupiter");
    plan.requiredPlanets.add("Mercury");
    plan.specificFactors.push("DHANA_YOGAS", "ACCUMULATION_POTENTIAL", "LIQUID_FLOW");
  }

  // 9. Wellness
  if (domains.has(DOMAINS.WELLNESS) || intents.has(QUESTION_INTENTS.WELLNESS)) {
    plan.requiredHouses.add(1);
    plan.requiredHouses.add(6);
    plan.requiredHouses.add(8);
    plan.requiredPlanets.add("Sun");
    plan.requiredPlanets.add("Moon");
    plan.requiredPlanets.add("Saturn");
    plan.specificFactors.push("PHYSICAL_VITALITY", "CONSTITUTIONAL_VITALITY", "TRADITIONAL_WELLNESS_ONLY");
  }

  // 10. Legal / Caution
  if (domains.has(DOMAINS.LEGAL) || intents.has(QUESTION_INTENTS.LEGAL) || domains.has(DOMAINS.CAUTION)) {
    plan.requiredHouses.add(6);
    plan.requiredHouses.add(8);
    plan.requiredPlanets.add("Mars");
    plan.requiredPlanets.add("Saturn");
    plan.specificFactors.push("LITIGATION_DISPUTE_RISK", "CAUTION_WINDOW");
  }

  // 11. Dasha Effect / Current Dasha
  if (intents.has(QUESTION_INTENTS.DASHA_EFFECT) || intents.has(QUESTION_INTENTS.CURRENT_DASHA) || entities?.dashaPair) {
    plan.requiredDashas = true;
    if (entities?.dashaPair) {
      plan.requiredPlanets.add(entities.dashaPair.mahadasha);
      plan.requiredPlanets.add(entities.dashaPair.antardasha);
    }
    plan.specificFactors.push("MUTUAL_DASHA_RELATIONSHIP", "DASHA_LORD_DIGNITIES", "ACTIVATED_DOMAINS");
  }

  // 12. Major Milestones / Multi-Year Timeline
  if (intents.has(QUESTION_INTENTS.MAJOR_MILESTONE) || plan.durationYears || domains.has(DOMAINS.MILESTONES)) {
    plan.requiredDashas = true;
    plan.requiredTransits = true;
    plan.includeTiming = true;
    plan.specificFactors.push("CHRONOLOGICAL_LIFE_STAGE_TRANSITIONS", "MAJOR_TRANSIT_SHIFTS");
  }

  // 13. Luxury Vehicle vs Standard Vehicle
  if (intents.has(QUESTION_INTENTS.LUXURY_VEHICLE)) {
    plan.requiredHouses.add(4); // Sukha / Vahana
    plan.requiredHouses.add(2); // Wealth reserves
    plan.requiredHouses.add(11); // Flow of surplus gains
    plan.requiredLords.add("4thLord");
    plan.requiredPlanets.add("Venus"); // Vehicle luxury
    plan.requiredPlanets.add("Mars"); // Mechanical machinery
    plan.requiredVargas.add("D4");
    plan.requiredVargas.add("D16");
    plan.specificFactors.push("LUXURY_VEHICLE_VS_STANDARD_CONVEYANCE", "MAHA_DHANA_YOGA_TIER");
  }

  // 14. Research / PhD / Doctorate
  if (intents.has(QUESTION_INTENTS.RESEARCH_PHD)) {
    plan.requiredHouses.add(5); // Higher intellect
    plan.requiredHouses.add(8); // Deep research / occult / hidden knowledge
    plan.requiredHouses.add(9); // Higher philosophy / doctorate / university
    plan.requiredLords.add("5thLord");
    plan.requiredLords.add("9thLord");
    plan.requiredPlanets.add("Jupiter"); // Jnana
    plan.requiredPlanets.add("Mercury"); // Logic / analysis
    plan.requiredPlanets.add("Saturn"); // Deep sustained inquiry / labor
    plan.requiredVargas.add("D24");
    plan.specificFactors.push("DOCTORAL_RESEARCH_ALIGNMENT", "8TH_HOUSE_INVESTIGATION_DEPTH");
  }

  // 15. Business: Continue vs Change
  if (intents.has(QUESTION_INTENTS.BUSINESS_CONTINUE_VS_CHANGE)) {
    plan.requiredHouses.add(7); // Business trade / partnerships
    plan.requiredHouses.add(10); // Professional standing
    plan.requiredHouses.add(11); // Profit margins / growth
    plan.requiredHouses.add(6); // Competition / debt
    plan.requiredPlanets.add("Mercury"); // Commerce
    plan.requiredPlanets.add("Saturn"); // Persistence vs restructuring
    plan.requiredVargas.add("D10");
    plan.specificFactors.push("BUSINESS_CONTINUATION_VIABILITY", "BUSINESS_PIVOT_RESTRUCTURING");
  }

  // 16. Politics vs Administration
  if (intents.has(QUESTION_INTENTS.POLITICS_VS_ADMINISTRATION)) {
    plan.requiredHouses.add(10); // Executive status / governance
    plan.requiredHouses.add(6); // Public competition / service
    plan.requiredHouses.add(1); // Personal charisma / presence
    plan.requiredPlanets.add("Sun"); // Sovereign authority / administrative rank
    plan.requiredPlanets.add("Mars"); // Executive command
    plan.requiredPlanets.add("Rahu"); // Mass popularity / political strategy
    plan.requiredVargas.add("D10");
    plan.specificFactors.push("POLITICAL_VS_ADMINISTRATIVE_ALIGNMENT", "PUBLIC_AUTHORITY_POTENTIAL");
  }

  // 17. Foreign Settlement
  if (intents.has(QUESTION_INTENTS.FOREIGN_SETTLEMENT)) {
    plan.requiredHouses.add(9); // Long distance horizons
    plan.requiredHouses.add(12); // Distant lands / permanent relocation
    plan.requiredHouses.add(4); // Home land / roots
    plan.requiredPlanets.add("Rahu"); // Cross-cultural migration
    plan.requiredPlanets.add("Moon"); // Mind / residence
    plan.requiredVargas.add("D4");
    plan.specificFactors.push("FOREIGN_SETTLEMENT_VS_TEMPORARY_STAY", "4TH_HOUSE_DISTANCE_DISPLACEMENT");
  }

  // 18. Mega Wealth / Extreme Affluence
  if (intents.has(QUESTION_INTENTS.MEGA_WEALTH)) {
    plan.requiredHouses.add(2); // Treasury
    plan.requiredHouses.add(5); // Purva punya / speculative fortune
    plan.requiredHouses.add(9); // Fortune / Lakshmi
    plan.requiredHouses.add(11); // Highest gains
    plan.requiredLords.add("2ndLord");
    plan.requiredLords.add("11thLord");
    plan.requiredPlanets.add("Jupiter");
    plan.requiredPlanets.add("Venus");
    plan.specificFactors.push("MAHA_DHANA_YOGA_COMBINATIONS", "ACCUMULATION_CEILING_TIER");
  }

  return {
    ...plan,
    requiredPlanets: Array.from(plan.requiredPlanets),
    requiredHouses: Array.from(plan.requiredHouses),
    requiredLords: Array.from(plan.requiredLords),
    requiredVargas: Array.from(plan.requiredVargas)
  };
}
