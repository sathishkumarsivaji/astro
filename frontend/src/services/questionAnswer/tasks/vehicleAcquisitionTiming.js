/**
 * SKR ASTRO — Vehicle Acquisition Timing Task Evaluator
 * ========================================================
 * Evaluates ordinary vehicle (car / automobile) acquisition timing requests.
 * Evaluates 4th house (Vahana sthana), Venus, and Mars without imposing
 * ultra-luxury wealth restrictions.
 *
 * Implements Section 10 & 11 of the Question-Answering Redesign Mandate.
 */

import { computeTimingWindows } from "../timingEngine.js";
import { humanizeEvidenceToken } from "../evidenceGraph.js";
import { hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

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

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "VEHICLE_PURCHASE_TIMING",
      taskType: "VEHICLE_TIMING_EVALUATION",
      isTamil,
      missingInputs: ["birthChart", "dashaTimeline"],
      traditionalMethod: "4th Bhava (Vahana Sthana) & Venus Activation under Vimshottari Dasha",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate vehicle acquisition timing. A verified birth chart and calculated dasha periods are required.",
      customDirectAnswerTa: "வாகனம் வாங்குவதற்கான காலக்கணிப்பிற்கு தேவையான பிறப்பு ஜாதக மற்றும் தசா கணிப்புத் தரவுகள் கிடைக்கவில்லை."
    });
  }

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

  const rawWindows = timingResult.timingWindows || [];

  // Filter out broad multi-year spans (> 3 years, like an entire 7-year Mars Mahadasha)
  // which lack specific sub-period or transit discrimination.
  const candidateWindows = rawWindows.filter(w => {
    if (!w.windowStart || !w.windowEnd) return false;
    const s = parseInt(String(w.windowStart).slice(0, 4), 10);
    const e = parseInt(String(w.windowEnd).slice(0, 4), 10);
    if (isNaN(s) || isNaN(e)) return false;
    const span = e - s;
    return span <= 3;
  });

  const hasWindows = candidateWindows.length > 0;

  if (!hasWindows) {
    const directAnswer = isTamil
      ? "தற்போதைய தசா-கோச்சார கணிப்புகளில் புதிய கார் அல்லது வாகனம் வாங்குவதற்கான தனித்துவமான காலக்கோடு உடனடியாக அமையவில்லை (NO_DISCRIMINATING_WINDOW)."
      : "The current calculated dasha-transit progression does not indicate a discriminating window for purchasing a new vehicle within the immediate calculated horizon (NO_DISCRIMINATING_WINDOW).";

    const reason = isTamil
      ? "வாகன யோகத்திற்கு 4-ம் பாவகம் (வாகன ஸ்தானம்), சுக போக காரகன் சுக்கிரன் மற்றும் இயந்திர காரகன் செவ்வாயின் தசா-கோச்சார ஒருங்கிணைவு தேவைப்படுகிறது. தற்போதைய கணிப்பில் இந்த ஒருங்கிணைவு போதுமான அளவு குறுகிய கால அளவில் தனித்து அமையவில்லை."
      : "Ordinary vehicle acquisition in Vedic astrology is governed by the 4th house (Vahana sthana), natural vehicle significator Venus (Shukra), and mechanical significator Mars (Kuja). Operative periods do not show simultaneous discriminating convergence on the vehicle axis.";

    const limitation = isTamil
      ? "ஜோதிட காலக்கணிப்பு ஒரு குறியீட்டு வாய்ப்பு மட்டுமே; தனிநபர் பட்ஜெட், கடன் வசதி, வாகனப் பராமரிப்பு மற்றும் அன்றாட தேவையே வாகனம் வாங்குவதை தீர்மானிக்க வேண்டும்."
      : "Astrological vehicle indicators reflect traditional timing preferences; actual purchase must be guided by financial liquidity, down payment readiness, insurance, and road safety.";

    return {
      questionId,
      intent: "VEHICLE_PURCHASE_TIMING",
      vehicleType: "ORDINARY_VEHICLE",
      answerState: "NO_DISCRIMINATING_WINDOW",
      timingStatus: "NOT_DISCRIMINATING",
      timingResolution: null,
      timingWindow: null,
      directAnswer,
      reason,
      limitation,
      recommendation: null,
      candidateWindows: [],
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

  // Windows exist and are discriminating (<= 3 years)
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

  const readableClaims = [
    `4th House (Vahana Sthana) activation under ${primaryWin.descriptionEn || "operative dasha period"}`,
    "Venus (natural vehicle karaka) and Mars mechanical indicators"
  ];

  const sanitizedWindows = candidateWindows.map(w => ({
    ...w,
    supportingEvidence: (w.supportingEvidence || []).map(token => humanizeEvidenceToken(token, isTamil))
  }));

  return {
    questionId,
    intent: "VEHICLE_PURCHASE_TIMING",
    vehicleType: "ORDINARY_VEHICLE",
    answerState: "ANSWERED",
    timingStatus: "CONVERGENCE_ESTABLISHED",
    timingResolution: primaryWin.resolution || "YEAR",
    timingWindow: windowStr,
    directAnswer,
    reason,
    limitation,
    recommendation: {
      preferredWindow: windowStr,
      primaryDashaPeriod: primaryWin.descriptionEn
    },
    candidateWindows: sanitizedWindows,
    supportingClaims: readableClaims,
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: "4th Bhava (Vahana Sthana), Venus & Mars Planetary Activation under Vimshottari Dasha",
    empiricalStatus: "NOT_VALIDATED"
  };
}
