/**
 * SKR ASTRO — Business Expansion Election Task Evaluator
 * ========================================================
 * Evaluates business expansion requests for a specific requested week timeframe.
 * Strictly avoids promising "good luck", profits, or commercial success.
 *
 * Implements Section 5C of the User-Facing Task Answering Mandate.
 */

import { resolveTemporalTimeframe } from "../temporalResolver.js";

/**
 * Evaluates the business expansion election task.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user inquiry
 * @param {Object} [params.context] - Execution context (chart, transits, weekly election)
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluateBusinessExpansionElection({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_BUSINESS_EXPANSION";

  // Resolve timeframe (evaluating "this week" at action location)
  const timeframe = resolveTemporalTimeframe({
    question,
    referenceInstant: context.referenceInstant || context.currentTime || null,
    actionTimezone: context.actionTimezone || context.timezone || null,
    actionLocation: context.actionLocation || context.currentCity || null,
    weekStartPreference: context.weekStartPreference || "Monday"
  });

  const rangeStr = `${timeframe.localStartDate} to ${timeframe.localEndDate}`;

  // Check if weekly transit / electional window has been calculated for this specific week
  const weeklyElection = context.weeklyElectionData || context.weeklyElection || null;
  const candidateWindows = weeklyElection?.candidateWindows || [];
  const assessment = weeklyElection?.assessment || (candidateWindows.length > 0 ? "FAVORABLE" : "NOT_ESTABLISHED");

  if (!weeklyElection || assessment === "NOT_ESTABLISHED" || candidateWindows.length === 0) {
    const directAnswer = isTamil
      ? `இந்த வாரம் (${rangeStr}) வியாபாரத்தை விரிவுபடுத்துவது அதிர்ஷ்டத்தைத் தரும் என்பதை தற்போதைய கணிப்பு உறுதிப்படுத்தவில்லை. கோரப்பட்ட வாரத்திற்கு தெளிவான சாதகமான காலக்கோடு எதுவும் அடையாளம் காணப்படவில்லை.`
      : `The current calculation does not establish that expanding this week (${rangeStr}) will bring good luck. No distinct expansion window has been identified for the requested week.`;

    const reason = isTamil
      ? "வியாபார விரிவாக்கத்திற்கு வாராந்திர கோச்சார கிரக நிலைகள், சந்திரன் சஞ்சாரம் மற்றும் தசா கால தொடர்புகள் ஆராயப்பட வேண்டும். ஒரு குறிப்பிட்ட வாரத்திற்கான துல்லியமான முகூர்த்த ஆய்வு கணக்கிடப்படாத நிலையில் ஊகங்கள் தவிர்க்கப்படுகின்றன."
      : `Evaluating weekly commercial expansion requires dedicated real-time transit correlations, lunar dignity traversals, and micro-electional calculations across ${rangeStr}. Broad natal chart potentials cannot substitute for an uncalculated weekly election.`;

    const limitation = isTamil
      ? "ஜோதிடம் 'அதிர்ஷ்டம்' அல்லது லாபத்திற்கான உத்தரவாதத்தை அளிக்காது. சந்தை சாத்தியக்கூறுகள், மூலதன மேலாண்மை மற்றும் வணிக திட்டமிடலே உண்மையான வெற்றியை தீர்மானிக்கும்."
      : "Astrology does not promise 'luck' or commercial success. Market demand, operational planning, capital reserves, and commercial execution govern business viability.";

    return {
      questionId,
      intent: "BUSINESS_EXPANSION_ELECTION",
      answerState: "NOT_ESTABLISHED",
      directAnswer,
      reason,
      limitation,
      recommendation: null,
      evaluatedTimeframe: timeframe,
      evaluatedRange: { start: timeframe.localStartDate, end: timeframe.localEndDate },
      candidateWindows: [],
      supportingClaims: [],
      limitingClaims: [
        "No distinct expansion window identified for the requested week.",
        "Good luck and commercial profit cannot be promised by astrological calculations.",
        limitation
      ],
      missingInputs: [
        `Weekly electional calculation for ${rangeStr}`,
        "Specific expansion type (branch expansion vs new sector diversification)"
      ],
      luckGuarantee: false,
      commercialSuccessGuarantee: false,
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // Weekly election data is calculated
  const assessmentEn = assessment === "FAVORABLE" ? "favorable" : (assessment === "MIXED" ? "mixed" : "challenging");
  const assessmentTa = assessment === "FAVORABLE" ? "சாதகமான" : (assessment === "MIXED" ? "கலவையான" : "சவாலான");

  const directAnswer = isTamil
    ? `தேர்ந்தெடுக்கப்பட்ட பாரம்பரிய விதிகள் இந்த வாரத்திற்கு (${rangeStr}) ஒரு ${assessmentTa} கால மதிப்பீட்டை வழங்குகின்றன. இது வணிக விரிவாக்கம் லாபகரமாகவோ அல்லது வெற்றியடையும் என்பதற்கோ சான்றல்ல.`
    : `The selected traditional rules give a ${assessmentEn} timing assessment for ${rangeStr}. This is not evidence that expansion will be profitable or successful.`;

  const reason = isTamil
    ? `இந்த வாரத்தில் சந்திரன் மற்றும் குருவின் சுப சேர்க்கை உள்ள நாட்கள் அடையாளம் காணப்பட்டுள்ளன: ${candidateWindows.map(w => w.dates || w.interval).join("; ")}.`
    : `The assessment evaluates operative transits across ${rangeStr}, isolating candidate windows: ${candidateWindows.map(w => w.dates || w.interval).join("; ")}.`;

  const limitation = isTamil
    ? "பாரம்பரிய காலக்கோடு ஒரு குறியீட்டு வழிகாட்டல் மட்டுமே; இது வணிக லாபம், நுகர்வோர் வரவேற்பு அல்லது வணிக வெற்றிக்கான உத்தரவாதம் அல்ல."
    : "Traditional electional windows provide symbolic alignment only; they do not guarantee revenue, market adoption, or commercial solvency.";

  return {
    questionId,
    intent: "BUSINESS_EXPANSION_ELECTION",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation,
    recommendation: {
      assessment: assessmentEn,
      range: rangeStr,
      candidateWindows
    },
    evaluatedTimeframe: timeframe,
    evaluatedRange: { start: timeframe.localStartDate, end: timeframe.localEndDate },
    candidateWindows,
    supportingClaims: [
      `Evaluated Range: ${rangeStr}`,
      `Traditional Assessment: ${assessmentEn}`,
      `Candidate Windows: ${candidateWindows.length}`
    ],
    limitingClaims: [limitation],
    missingInputs: [],
    luckGuarantee: false,
    commercialSuccessGuarantee: false,
    empiricalStatus: "NOT_VALIDATED"
  };
}
