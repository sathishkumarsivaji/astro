/**
 * ASTROVERSE — Vehicle Acquisition Timing Task Evaluator
 * ========================================================
 * Evaluates ordinary vehicle (car / automobile) acquisition timing requests.
 * Evaluates 4th house (Vahana sthana), Venus, and Mars without imposing
 * ultra-luxury wealth restrictions.
 *
 * Implements Section 10 & 11 of the Question-Answering Redesign Mandate.
 */

import { computeTimingWindows } from "../timingEngine.js";

/**
 * Evaluates the vehicle acquisition timing task.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user inquiry
 * @param {Object} [params.context] - Execution context
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluateVehicleAcquisitionTiming({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_VEHICLE_PURCHASE_TIMING";

  const chart = context.chartData || context.chart || {};
  const dashaTimeline = chart.dashaTimeline || chart.dashas || chart.dashaTable || context.dashaTimeline || [];
  const transits = chart.transits || chart.gocharDashboard || context.transits || {};
  const vargas = chart.vargas || context.vargas || {};

  const timingResult = computeTimingWindows({
    domain: "VEHICLE",
    chart,
    dashaTimeline,
    transits,
    vargas,
    referenceYear: context.referenceYear || (new Date().getFullYear())
  });

  const candidateWindows = timingResult.timingWindows || [];
  const hasWindows = candidateWindows.length > 0;

  if (!hasWindows) {
    const directAnswer = isTamil
      ? "தற்போதைய தசா-கோச்சார கணிப்புகளில் புதிய கார் அல்லது வாகனம் வாங்குவதற்கான தனித்துவமான காலக்கோடு உடனடியாக அமையவில்லை (NO_DISCRIMINATING_WINDOW)."
      : "The current calculated dasha-transit progression does not indicate a discriminating window for purchasing a new vehicle within the immediate calculated horizon (NO_DISCRIMINATING_WINDOW).";

    const reason = isTamil
      ? "வாகன யோகத்திற்கு 4-ம் பாவகம் (வாகன ஸ்தானம்), சுக போக காரகன் சுக்கிரன் மற்றும் இயந்திர காரகன் செவ்வாயின் தசா-கோச்சார ஒருங்கிணைவு தேவைப்படுகிறது. தற்போதைய கணிப்பில் இந்த ஒருங்கிணைவு போதுமான அளவு வலுப்பெறவில்லை."
      : "Ordinary vehicle acquisition in Vedic astrology is governed by the 4th house (Vahana sthana), natural vehicle significator Venus (Shukra), and mechanical significator Mars (Kuja). Operative periods do not show simultaneous convergence on the vehicle axis.";

    const limitation = isTamil
      ? "ஜோதிட காலக்கணிப்பு ஒரு குறியீட்டு வாய்ப்பு மட்டுமே; தனிநபர் பட்ஜெட், கடன் வசதி, வாகனப் பராமரிப்பு மற்றும் அன்றாட தேவையே வாகனம் வாங்குவதை தீர்மானிக்க வேண்டும்."
      : "Astrological vehicle indicators reflect traditional timing preferences; actual purchase must be guided by financial liquidity, down payment readiness, insurance, and road safety.";

    return {
      questionId,
      intent: "VEHICLE_PURCHASE_TIMING",
      vehicleType: "ORDINARY_VEHICLE",
      answerState: "NO_DISCRIMINATING_WINDOW",
      directAnswer,
      reason,
      limitation,
      recommendation: null,
      candidateWindows: [],
      timingResolution: null,
      supportingClaims: [],
      limitingClaims: [
        "No discriminating dasha-transit convergence for vehicle purchase in the evaluated horizon.",
        limitation
      ],
      missingInputs: ["4th house / Venus dasha convergence points", "Transit Jupiter / Venus support to 4th house"],
      traditionalMethod: "4th Bhava (Vahana Sthana), Venus & Mars Planetary Activation under Vimshottari Dasha",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // Windows exist
  const primaryWin = candidateWindows[0];
  const windowStr = primaryWin.windowStart && primaryWin.windowEnd
    ? `${primaryWin.windowStart} – ${primaryWin.windowEnd}`
    : primaryWin.id;

  const directAnswer = isTamil
    ? `உங்கள் ஜாதக தசா மற்றும் கோச்சார அமைப்புகளின்படி புதிய கார் அல்லது வாகனம் வாங்குவதற்கு மிகவும் சாதகமான காலகட்டம்: ${windowStr} ஆகும்.`
    : `According to your calculated dasha and transit indicators, the most supportive window for purchasing a new vehicle (car) is ${windowStr}.`;

  const reason = isTamil
    ? `${primaryWin.descriptionTa || "4-ம் பாவகம் மற்றும் வாகன காரகன் சுக்கிரனின் தசா கால தொடர்பு ஏற்பட்டுள்ளது."} கோச்சார கிரக நிலைகளும் வாகன யோகத்திற்கு சாதகமாக அமைந்துள்ளன.`
    : `${primaryWin.descriptionEn || "Operative dasha periods activate the 4th house (Vahana sthana) and Venus/Mars."} Supporting planetary transits confirm the activation.`;

  const limitation = isTamil
    ? "ஜோதிட காலம் ஒரு வழிகாட்டல் மட்டுமே; நிதித் திட்டமிடல், வாகன பயன்பாடு மற்றும் ஓட்டுநர் பாதுகாப்பு நடைமுறைகளே முதன்மையானவை."
    : "Astrological timing indicates classical traditional alignment only; purchase financing, maintenance budgeting, and operational need govern vehicle acquisition.";

  return {
    questionId,
    intent: "VEHICLE_PURCHASE_TIMING",
    vehicleType: "ORDINARY_VEHICLE",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation,
    recommendation: {
      preferredWindow: windowStr,
      primaryDashaPeriod: primaryWin.descriptionEn
    },
    candidateWindows,
    timingResolution: primaryWin.resolution || "YEAR",
    supportingClaims: primaryWin.supportingEvidence || [],
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: "4th Bhava (Vahana Sthana), Venus & Mars Planetary Activation under Vimshottari Dasha",
    empiricalStatus: "NOT_VALIDATED"
  };
}
