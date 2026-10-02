/**
 * ASTROVERSE — Master Event Evaluator Dispatcher
 *
 * Routes a LifeEvent to its domain-specific evaluator and aggregates structured evaluation results.
 */

import { evaluateMarriageEvent } from "./marriageEvaluator.js";
import { evaluateCareerEvent } from "./careerEvaluator.js";
import { evaluateChildBirthEvent } from "./childBirthEvaluator.js";
import { evaluateEducationEvent } from "./educationEvaluator.js";
import { evaluateRelocationEvent } from "./relocationEvaluator.js";
import { evaluatePropertyEvent } from "./propertyEvaluator.js";
import { evaluateHealthEvent } from "./healthEvaluator.js";
import { evaluateFinancialMilestoneEvent } from "./financialMilestoneEvaluator.js";
import { evaluateCustomEvent } from "./customEventEvaluator.js";

export function evaluateEventForCandidate(event, chartData, candidateTime) {
  switch (event.type) {
    case "MARRIAGE":
      return evaluateMarriageEvent(event, chartData, candidateTime);

    case "CAREER_START":
    case "JOB_CHANGE":
    case "PROMOTION":
    case "BUSINESS_START":
      return evaluateCareerEvent(event, chartData, candidateTime);

    case "CHILD_BIRTH":
      return evaluateChildBirthEvent(event, chartData, candidateTime);

    case "EDUCATION":
      return evaluateEducationEvent(event, chartData, candidateTime);

    case "RELOCATION":
      return evaluateRelocationEvent(event, chartData, candidateTime);

    case "PROPERTY":
      return evaluatePropertyEvent(event, chartData, candidateTime);

    case "HEALTH_THEME":
      return evaluateHealthEvent(event, chartData, candidateTime);

    case "MAJOR_FINANCIAL_EVENT":
      return evaluateFinancialMilestoneEvent(event, chartData, candidateTime);

    case "MAJOR_FAMILY_EVENT":
    case "OTHER":
    default:
      return evaluateCustomEvent(event, chartData, candidateTime);
  }
}
