/**
 * ASTROVERSE — Task Evaluator Registry & Dispatcher
 * ==================================================
 * Directs task-level questions to their dedicated evaluators.
 * Guarantees direct-answer-first output contract.
 */

import { TASK_INTENTS } from "../intentClassifier.js";
import { evaluateDailyDressColor } from "./dailyDressColor.js";
import { evaluateResearchSubmissionElection } from "./researchSubmissionElection.js";
import { evaluateBusinessExpansionElection } from "./businessExpansionElection.js";
import { evaluateBusinessExpansionDecision } from "./businessExpansionDecision.js";
import { evaluateForeignTripTiming } from "./foreignTripTiming.js";
import { evaluateHomeConstructionTiming } from "./homeConstructionTiming.js";
import { evaluateVehicleAcquisitionTiming } from "./vehicleAcquisitionTiming.js";
import { evaluateMonthlyOutlook } from "./monthlyOutlook.js";

export {
  TASK_INTENTS,
  evaluateDailyDressColor,
  evaluateResearchSubmissionElection,
  evaluateBusinessExpansionElection,
  evaluateBusinessExpansionDecision,
  evaluateForeignTripTiming,
  evaluateHomeConstructionTiming,
  evaluateVehicleAcquisitionTiming,
  evaluateMonthlyOutlook
};

/**
 * Checks whether an intent is a dedicated task intent.
 *
 * @param {string} intent
 * @returns {boolean}
 */
export function isTaskIntent(intent) {
  return Boolean(intent && TASK_INTENTS[intent]);
}

/**
 * Dispatches an actionable task to its dedicated evaluator.
 *
 * @param {Object} params
 * @param {string} params.intent - Task intent name
 * @param {string} params.question - Raw question text
 * @param {Object} params.context - Full report or execution context
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function dispatchTaskEvaluation({ intent, question, context = {}, isTamil = false }) {
  switch (intent) {
    case TASK_INTENTS.DAILY_DRESS_COLOR:
      return evaluateDailyDressColor({ question, context, isTamil });

    case TASK_INTENTS.RESEARCH_SUBMISSION_ELECTION:
      return evaluateResearchSubmissionElection({ question, context, isTamil });

    case TASK_INTENTS.BUSINESS_EXPANSION_ELECTION:
      return evaluateBusinessExpansionElection({ question, context, isTamil });

    case TASK_INTENTS.BUSINESS_EXPANSION_DECISION:
    case TASK_INTENTS.BUSINESS_DIVERSIFICATION_DECISION:
      return evaluateBusinessExpansionDecision({ question, context, isTamil });

    case TASK_INTENTS.FOREIGN_TRIP_TIMING:
      return evaluateForeignTripTiming({ question, context, isTamil });

    case TASK_INTENTS.HOME_CONSTRUCTION_TIMING:
      return evaluateHomeConstructionTiming({ question, context, isTamil });

    case TASK_INTENTS.VEHICLE_PURCHASE_TIMING:
      return evaluateVehicleAcquisitionTiming({ question, context, isTamil });

    case TASK_INTENTS.MONTHLY_OUTLOOK:
      return evaluateMonthlyOutlook({ question, context, isTamil });

    default:
      return {
        questionId: context.questionId || "TASK_UNSUPPORTED",
        intent: intent || "UNKNOWN_TASK",
        answerState: "UNSUPPORTED_TASK",
        directAnswer: isTamil
          ? "இந்த குறிப்பிட்ட பணி தற்போதைய அமைப்பில் செயல்படுத்தப்படவில்லை."
          : "This specific task is not implemented in the current engine.",
        recommendation: null,
        evaluatedTimeframe: null,
        supportingClaims: [],
        limitingClaims: ["Task handler not available."],
        missingInputs: ["Implemented task evaluator"],
        traditionalMethod: null,
        empiricalStatus: "NOT_VALIDATED"
      };
  }
}
