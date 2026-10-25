/**
 * ASTROVERSE — Applicability Policy Engine
 * =========================================
 * Version: 2.1.0
 * 
 * Provides deterministic evaluation of life-event applicability,
 * exact chronological age calculation, half-open interval checks,
 * and boundary-crossing splitting.
 */

import {
  EVENT_REGISTRY_VERSION,
  EVENT_DEFINITIONS,
  CONTEXT_STATUS,
  resolveContextStatus
} from "./eventPrerequisiteRegistry.js";

export const POLICY_VERSION = "2.1.0";

export const APPLICABILITY_STATUS = Object.freeze({
  APPLICABLE: "APPLICABLE",
  NOT_APPLICABLE: "NOT_APPLICABLE",
  CONTEXT_REQUIRED: "CONTEXT_REQUIRED",
  INSUFFICIENT_AGE_DATA: "INSUFFICIENT_AGE_DATA",
  INSUFFICIENT_EVENT_EVIDENCE: "INSUFFICIENT_EVENT_EVIDENCE"
});

/**
 * Calculates exact chronological age between a birth instant and target date.
 * Handles calendar leap days, year boundaries, and months accurately.
 *
 * @param {Date|string} birthDateInput - Birth date / ISO string
 * @param {Date|string} targetDateInput - Target date / ISO string
 * @returns {Object} { years: number, months: number, days: number, fractionalYears: number, totalMonths: number }
 */
export function calculateExactCalendarAge(birthDateInput, targetDateInput) {
  if (!birthDateInput || !targetDateInput) return null;

  const bDate = birthDateInput instanceof Date ? birthDateInput : new Date(birthDateInput);
  const tDate = targetDateInput instanceof Date ? targetDateInput : new Date(targetDateInput);

  if (isNaN(bDate.getTime()) || isNaN(tDate.getTime())) return null;
  if (tDate.getTime() < bDate.getTime()) {
    return { years: 0, months: 0, days: 0, fractionalYears: 0, totalMonths: 0, isNegative: true };
  }

  let years = tDate.getUTCFullYear() - bDate.getUTCFullYear();
  let months = tDate.getUTCMonth() - bDate.getUTCMonth();
  let days = tDate.getUTCDate() - bDate.getUTCDate();

  if (days < 0) {
    months -= 1;
    // Days in previous month
    const prevMonthDays = new Date(Date.UTC(tDate.getUTCFullYear(), tDate.getUTCMonth(), 0)).getUTCDate();
    days += prevMonthDays;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const diffMs = tDate.getTime() - bDate.getTime();
  const fractionalYears = diffMs / (365.2422 * 24 * 60 * 60 * 1000);
  const totalMonths = (years * 12) + months;

  return {
    years,
    months,
    days,
    fractionalYears,
    totalMonths,
    isNegative: false
  };
}

/**
 * Formats an age interval clearly and honestly according to developmental milestones.
 * In infancy/toddlerhood (<3 years), displays months to prevent confusing "0.5 yrs" as "5 months".
 *
 * @param {number} startAge - Fractional or integer start age
 * @param {number} endAge - Fractional or integer end age
 * @param {string} [lang="en"] - "en" or "ta"
 * @returns {string} Formatted age display
 */
export function formatAgeIntervalDisplay(startAge, endAge, lang = "en") {
  const isTa = lang === "ta";
  if (startAge == null || endAge == null || isNaN(startAge) || isNaN(endAge)) {
    return isTa ? "வயது விவரம் இல்லை" : "Age unknown";
  }

  const s = Math.max(0, Number(startAge));
  const e = Math.max(s, Number(endAge));

  // Infancy & toddlerhood (< 3.0 years): format in calendar months
  if (e <= 3.0) {
    const sMonths = Math.round(s * 12);
    const eMonths = Math.round(e * 12);
    if (isTa) {
      return `${sMonths} முதல் ${eMonths} மாதங்கள்`;
    }
    return `${sMonths} to ${eMonths} months`;
  }

  // Child crossing into early childhood
  if (s < 3.0 && e > 3.0) {
    const sMonths = Math.round(s * 12);
    if (isTa) {
      return `${sMonths} மாதங்கள் முதல் ${e.toFixed(1)} வயது வரை`;
    }
    return `${sMonths} mos to ${e.toFixed(1)} yrs`;
  }

  // Standard years
  if (isTa) {
    return `${s.toFixed(1)} - ${e.toFixed(1)} வயது`;
  }
  return `${s.toFixed(1)} - ${e.toFixed(1)} yrs`;
}

/**
 * Checks whether an interval crosses an applicability boundary (e.g. crossing age 18)
 *
 * @param {number} startAge
 * @param {number} endAge
 * @param {number} [boundaryAge=18]
 * @returns {Object} { crosses: boolean, boundaryAge: number, splitStart: Object, splitEnd: Object }
 */
export function checkBoundaryCrossing(startAge, endAge, boundaryAge = 18) {
  if (startAge == null || endAge == null) {
    return { crosses: false };
  }
  const s = Number(startAge);
  const e = Number(endAge);

  if (s < boundaryAge && e > boundaryAge) {
    return {
      crosses: true,
      boundaryAge,
      minorSegment: { startAge: s, endAge: boundaryAge },
      adultSegment: { startAge: boundaryAge, endAge: e }
    };
  }

  return { crosses: false };
}

/**
 * Evaluates the applicability of a proposed event type during an age interval
 * under given life context.
 *
 * @param {string} eventTypeId - Event type ID from EVENT_DEFINITIONS
 * @param {Object} intervalAge - { startAge, endAge } or scalar startAge
 * @param {Object} [context={}] - Known life context
 * @param {Object} [options={}] - Extra options
 * @returns {Object} Evaluated applicability outcome
 */
export function evaluateEventApplicability(eventTypeId, intervalAge, context = {}, options = {}) {
  const eventDef = EVENT_DEFINITIONS[eventTypeId];
  if (!eventDef) {
    return {
      status: APPLICABILITY_STATUS.NOT_APPLICABLE,
      eventTypeId,
      policyVersion: POLICY_VERSION,
      reasonCode: "UNKNOWN_EVENT_TYPE",
      reasonText: `Unregistered event type: "${eventTypeId}".`,
      unmetPrerequisites: ["EVENT_DEFINITION_NOT_FOUND"],
      allowedClaimScope: "NON_EVENT_CALCULATED_PERIOD"
    };
  }

  let startAge = null;
  let endAge = null;

  if (typeof intervalAge === "number") {
    startAge = intervalAge;
    endAge = intervalAge;
  } else if (intervalAge && typeof intervalAge === "object") {
    startAge = intervalAge.startAge ?? intervalAge.pStart ?? null;
    endAge = intervalAge.endAge ?? intervalAge.pEnd ?? null;
  }

  if (startAge == null || isNaN(startAge)) {
    return {
      status: APPLICABILITY_STATUS.INSUFFICIENT_AGE_DATA,
      eventTypeId,
      policyVersion: POLICY_VERSION,
      reasonCode: "MISSING_AGE_DATA",
      reasonText: "Birth date or interval age data is missing or indeterminate.",
      unmetPrerequisites: ["VALID_CHRONOLOGICAL_AGE"],
      allowedClaimScope: "NON_EVENT_CALCULATED_PERIOD"
    };
  }

  const s = Number(startAge);
  const e = endAge != null && !isNaN(endAge) ? Number(endAge) : s;

  // 1. Minimum Age Rule (Hard Exclusion)
  if (eventDef.minAge != null && s < eventDef.minAge) {
    const isBoundarySplit = e > eventDef.minAge;
    return {
      status: APPLICABILITY_STATUS.NOT_APPLICABLE,
      eventTypeId,
      policyVersion: POLICY_VERSION,
      evaluatedAge: { startAge: s, endAge: e },
      minAgeRequired: eventDef.minAge,
      boundaryCrossing: isBoundarySplit ? checkBoundaryCrossing(s, e, eventDef.minAge) : null,
      reasonCode: "AGE_BELOW_MINIMUM_THRESHOLD",
      reasonText: eventDef.inapplicableReason || `Subject age (${s.toFixed(1)}) is below minimum required threshold (${eventDef.minAge}).`,
      reasonTextTa: eventDef.inapplicableReasonTa || `ஜாதகரின் வயது (${s.toFixed(1)}) குறைந்தபட்ச வயதைவிட (${eventDef.minAge}) குறைவு.`,
      unmetPrerequisites: [{
        type: "MIN_AGE",
        required: eventDef.minAge,
        actual: s
      }],
      allowedClaimScope: "NON_EVENT_CALCULATED_PERIOD"
    };
  }

  // 2. Maximum Age Rule (Where applicable, e.g. elementary school)
  if (eventDef.maxAge != null && s >= eventDef.maxAge) {
    return {
      status: APPLICABILITY_STATUS.NOT_APPLICABLE,
      eventTypeId,
      policyVersion: POLICY_VERSION,
      evaluatedAge: { startAge: s, endAge: e },
      maxAgePermitted: eventDef.maxAge,
      reasonCode: "AGE_EXCEEDS_MAXIMUM_THRESHOLD",
      reasonText: eventDef.inapplicableReason || `Subject age (${s.toFixed(1)}) exceeds maximum threshold (${eventDef.maxAge}).`,
      unmetPrerequisites: [{
        type: "MAX_AGE",
        limit: eventDef.maxAge,
        actual: s
      }],
      allowedClaimScope: "NON_EVENT_CALCULATED_PERIOD"
    };
  }

  // 3. Required Life Context Evaluation
  const unmetContext = [];
  if (Array.isArray(eventDef.requiredContext) && eventDef.requiredContext.length > 0) {
    for (const ctxKey of eventDef.requiredContext) {
      const status = resolveContextStatus(context, ctxKey);
      if (status === CONTEXT_STATUS.UNKNOWN) {
        unmetContext.push({
          key: ctxKey,
          status: CONTEXT_STATUS.UNKNOWN,
          resolution: "CONTEXT_REQUIRED"
        });
      } else if (status === CONTEXT_STATUS.ABSENT) {
        unmetContext.push({
          key: ctxKey,
          status: CONTEXT_STATUS.ABSENT,
          resolution: "DISQUALIFIED"
        });
      }
    }
  }

  if (unmetContext.length > 0) {
    const hasDisqualified = unmetContext.some(u => u.resolution === "DISQUALIFIED");
    if (hasDisqualified) {
      return {
        status: APPLICABILITY_STATUS.NOT_APPLICABLE,
        eventTypeId,
        policyVersion: POLICY_VERSION,
        evaluatedAge: { startAge: s, endAge: e },
        reasonCode: "REQUIRED_CONTEXT_ABSENT",
        reasonText: `Disqualified: Required context (${unmetContext.map(u => u.key).join(", ")}) is explicitly absent.`,
        unmetPrerequisites: unmetContext,
        allowedClaimScope: "NON_EVENT_CALCULATED_PERIOD"
      };
    }

    return {
      status: APPLICABILITY_STATUS.CONTEXT_REQUIRED,
      eventTypeId,
      policyVersion: POLICY_VERSION,
      evaluatedAge: { startAge: s, endAge: e },
      reasonCode: "CONTEXT_UNCONFIRMED",
      reasonText: `Context required: Event depends on active ${unmetContext.map(u => u.key).join(", ")}. Without verified context, no occurrence is asserted.`,
      unmetPrerequisites: unmetContext,
      allowedClaimScope: "CONDITIONAL_PERSPECTIVE"
    };
  }

  // All prerequisites passed
  return {
    status: APPLICABILITY_STATUS.APPLICABLE,
    eventTypeId,
    policyVersion: POLICY_VERSION,
    evaluatedAge: { startAge: s, endAge: e },
    reasonCode: "PREREQUISITES_SATISFIED",
    reasonText: "Chronological age and context prerequisites satisfied.",
    unmetPrerequisites: [],
    allowedClaimScope: eventDef.scope
  };
}
