/**
 * ASTROVERSE — Task Evaluator Registry & Dispatcher
 * ==================================================
 * Directs task-level questions to their dedicated evaluators.
 * Guarantees direct-answer-first output contract.
 */

import { TASK_INTENTS, CHILDREN_TASKS } from "../intentClassifier.js";
import { evaluateDailyDressColor } from "./dailyDressColor.js";
import { evaluateResearchSubmissionElection } from "./researchSubmissionElection.js";
import { evaluateBusinessExpansionElection } from "./businessExpansionElection.js";
import { evaluateBusinessExpansionDecision } from "./businessExpansionDecision.js";
import { evaluateForeignTripTiming } from "./foreignTripTiming.js";
import { evaluateHomeConstructionTiming } from "./homeConstructionTiming.js";
import { evaluatePropertyBuyVsBuildDecision } from "./propertyDecision.js";
import { evaluateVehicleAcquisitionTiming } from "./vehicleAcquisitionTiming.js";
import { evaluateMonthlyOutlook } from "./monthlyOutlook.js";
import { evaluateChildrenCount, CHILDREN_COUNT_POLICY, resolveChildrenSubject } from "./childrenCount.js";
import { evaluateChildrenOutlook, CHILDREN_OUTLOOK_EVIDENCE_PLAN } from "./childrenOutlook.js";
import { evaluateFamilyExpansionTiming } from "./familyExpansionTiming.js";

export {
  TASK_INTENTS,
  CHILDREN_TASKS,
  CHILDREN_COUNT_POLICY,
  CHILDREN_OUTLOOK_EVIDENCE_PLAN,
  resolveChildrenSubject,
  evaluateDailyDressColor,
  evaluateResearchSubmissionElection,
  evaluateBusinessExpansionElection,
  evaluateBusinessExpansionDecision,
  evaluateForeignTripTiming,
  evaluateHomeConstructionTiming,
  evaluatePropertyBuyVsBuildDecision,
  evaluateVehicleAcquisitionTiming,
  evaluateMonthlyOutlook,
  evaluateChildrenCount,
  evaluateChildrenOutlook,
  evaluateFamilyExpansionTiming
};

/**
 * Builds an explicit unsupported-task answer object instead of falling back to generic natal prose.
 *
 * @param {Object} [questionSpec={}]
 * @returns {Object} Standardized Unsupported Task Result
 */
export function buildUnsupportedTaskAnswer(questionSpec = {}) {
  const isTamil = Boolean(questionSpec.isTamil || questionSpec.language === "ta" || questionSpec.lang === "ta");
  const intent = questionSpec.intent || questionSpec.task || "UNKNOWN_TASK";
  const questionId = questionSpec.questionId || questionSpec.id || "TASK_UNSUPPORTED";

  return {
    questionId,
    intent,
    answerState: "UNSUPPORTED_TASK",
    conclusion: null,
    confidenceClass: null,
    directAnswer: isTamil
      ? "இந்த குறிப்பிட்ட பணி தற்போதைய அமைப்பில் செயல்படுத்தப்படவில்லை (UNSUPPORTED_TASK). பொதுவான ஜாதக சுருக்கம் இதற்கு மாற்றாக வழங்கப்படாது."
      : "This specific task is not implemented in the current engine (UNSUPPORTED_TASK). A generic natal-chart summary is not substituted for an unsupported task.",
    reason: isTamil
      ? `கோரப்பட்ட பணி (${intent}) தற்போதைய பதிப்பில் தனிப்பட்ட மதிப்பீட்டாளரைக் கொண்டிருக்கவில்லை.`
      : `The requested task (${intent}) does not have a dedicated evaluator in the current release.`,
    limitation: isTamil
      ? "ஆதரிக்கப்படாத பணிகளுக்கு பொதுவான லக்ன அல்லது ராசி பலன்கள் மாற்றாக வழங்கப்படுவதில்லை."
      : "General natal-chart prose is never substituted when a task handler is unavailable.",
    recommendation: null,
    candidateWindows: [],
    evaluatedTimeframe: null,
    timingResolution: null,
    supportingClaims: [],
    limitingClaims: ["Task handler not available."],
    missingInputs: ["Implemented task evaluator"],
    traditionalMethod: null,
    empiricalStatus: "NOT_VALIDATED"
  };
}

/**
 * Checks whether an intent is a dedicated task intent.
 *
 * @param {string} intent
 * @returns {boolean}
 */
export function isTaskIntent(intent) {
  return Boolean(intent && (TASK_INTENTS[intent] || CHILDREN_TASKS[intent]));
}

/**
 * Dispatches an actionable task to its dedicated evaluator.
 * Handler errors are caught and converted into an explicit TASK_FAILURE state,
 * never allowing silent fallthrough to generic natal prose.
 *
 * @param {Object} params
 * @param {string} params.intent - Task intent name
 * @param {string} params.question - Raw question text
 * @param {Object} params.context - Full report or execution context
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function dispatchTaskEvaluation({ intent, question, context = {}, isTamil = false }) {
  try {
    if (typeof context?.simulateTaskHandlerError === "function") {
      context.simulateTaskHandlerError(intent);
    } else if (context?.simulateTaskHandlerError === true) {
      throw new Error(`Simulated task handler failure for ${intent}`);
    }

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

      case TASK_INTENTS.PROPERTY_BUY_VS_BUILD_DECISION:
        return evaluatePropertyBuyVsBuildDecision({ question, context, isTamil });

      case TASK_INTENTS.VEHICLE_PURCHASE_TIMING:
        return evaluateVehicleAcquisitionTiming({ question, context, isTamil });

      case TASK_INTENTS.MONTHLY_OUTLOOK:
        return evaluateMonthlyOutlook({ question, context, isTamil });

      case CHILDREN_TASKS.CHILDREN_COUNT:
        return evaluateChildrenCount({ question, context, isTamil });

      case CHILDREN_TASKS.CHILDREN_OUTLOOK:
      case CHILDREN_TASKS.CHILDREN_TRADITIONAL_INTERPRETATION:
        return evaluateChildrenOutlook({ question, context, isTamil, intent });

      case CHILDREN_TASKS.FAMILY_EXPANSION_TIMING:
        return evaluateFamilyExpansionTiming({ question, context, isTamil });

      default:
        return buildUnsupportedTaskAnswer({
          questionId: context.questionId,
          intent,
          isTamil
        });
    }
  } catch (err) {
    const errMsg = err?.message || "Unexpected task handler error";
    return {
      questionId: context.questionId || "TASK_ERROR",
      intent: intent || "UNKNOWN_TASK",
      answerState: "TASK_FAILURE",
      conclusion: null,
      confidenceClass: null,
      directAnswer: isTamil
        ? `இந்த குறிப்பிட்ட பணியைச் செயல்படுத்தும்போது பிழை ஏற்பட்டது (TASK_FAILURE): ${errMsg}. பொதுவான ஜாதக சுருக்கம் மாற்றாக வழங்கப்படாது.`
        : `Task handler execution failed (TASK_FAILURE): ${errMsg}. A generic natal-chart summary is not substituted on handler error.`,
      reason: isTamil
        ? `பணி மதிப்பீட்டாளர் பிழை: ${errMsg}`
        : `Task evaluator encountered an execution error: ${errMsg}`,
      limitation: isTamil
        ? "பணி செயலாக்கப் பிழையின் போது தவறான அல்லது பொதுவான ஜாதக உரை வழங்கப்படுவதில்லை."
        : "When a dedicated task handler fails, the engine fails closed rather than emitting unrelated natal prose.",
      recommendation: null,
      candidateWindows: [],
      evaluatedTimeframe: null,
      timingResolution: null,
      supportingClaims: [],
      limitingClaims: [`Task execution failure: ${errMsg}`],
      missingInputs: [],
      traditionalMethod: null,
      empiricalStatus: "NOT_VALIDATED",
      error: errMsg
    };
  }
}

