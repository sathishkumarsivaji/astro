/**
 * ASTROVERSE — Foreign Trip Timing Task Evaluator
 * ================================================
 * Evaluates foreign travel timing requests.
 * Distinguishes temporary travel (FOREIGN_TRIP), overseas employment (WORK_ABROAD),
 * and permanent settlement (FOREIGN_SETTLEMENT).
 *
 * Implements Section 10 & 11 of the Question-Answering Redesign Mandate.
 */

import { computeTimingWindows } from "../timingEngine.js";
import { hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

/**
 * Classifies the travel category requested in the inquiry.
 *
 * @param {string} text
 * @returns {"FOREIGN_TRIP"|"WORK_ABROAD"|"FOREIGN_SETTLEMENT"}
 */
export function classifyTravelType(text = "") {
  const norm = String(text).toLowerCase();
  if (/settle|permanent|pr\b|green\s*card|citizenship|வாழ்க்கை|குடியேற/i.test(norm)) {
    return "FOREIGN_SETTLEMENT";
  }
  if (/job|work|career|employment|posting|deputation|வேலை|தொழில்/i.test(norm)) {
    return "WORK_ABROAD";
  }
  return "FOREIGN_TRIP";
}

/**
 * Evaluates the foreign trip timing task.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user inquiry
 * @param {Object} [params.context] - Execution context (chart, dashas, transits)
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluateForeignTripTiming({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_FOREIGN_TRIP_TIMING";
  const travelType = classifyTravelType(question);

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "FOREIGN_TRIP_TIMING",
      taskType: "TRAVEL_TIMING_EVALUATION",
      isTamil,
      missingInputs: ["birthChart", "dashaTimeline"],
      traditionalMethod: "3rd/9th/12th Bhava and Moon-Rahu Activation under Vimshottari Dasha",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate foreign travel timing. Accurate window calculation requires a verified birth chart and dasha progression.",
      customDirectAnswerTa: "வெளிநாட்டுப் பயண காலக்கணிப்பிற்கு தேவையான பிறப்பு ஜாதக மற்றும் தசா கணிப்புத் தரவுகள் கிடைக்கவில்லை."
    });
  }

  const chart = context.chartData || context.chart || {};
  const dashaTimeline = chart.dashaTimeline || chart.dashas || chart.dashaTable || context.dashaTimeline || [];
  const transits = chart.transits || chart.gocharDashboard || context.transits || {};
  const vargas = chart.vargas || context.vargas || {};

  // Map domain based on travel subtype
  const domainKey = travelType === "FOREIGN_SETTLEMENT"
    ? "FOREIGN_SETTLEMENT"
    : (travelType === "WORK_ABROAD" ? "WORK_ABROAD" : "FOREIGN_TRAVEL");

  const timingResult = computeTimingWindows({
    domain: domainKey,
    chart,
    dashaTimeline,
    transits,
    vargas,
    referenceYear: context.referenceYear || (new Date().getFullYear())
  });

  const candidateWindows = timingResult.timingWindows || [];
  const hasWindows = candidateWindows.length > 0;

  const travelLabelEn = travelType === "FOREIGN_SETTLEMENT"
    ? "permanent overseas settlement"
    : (travelType === "WORK_ABROAD" ? "working abroad" : "a temporary foreign trip");

  const travelLabelTa = travelType === "FOREIGN_SETTLEMENT"
    ? "வெளிநாட்டில் நிரந்தரமாக குடியேறுதல்"
    : (travelType === "WORK_ABROAD" ? "வெளிநாட்டு பணி வாய்ப்பு" : "குறுகிய கால வெளிநாட்டு பயணம்");

  if (!hasWindows) {
    const directAnswer = isTamil
      ? `தற்போதைய தசா-கோச்சார கணிப்புகளில் ${travelLabelTa} செய்வதற்கான தனித்துவமான காலக்கோடு உடனடியாக அமையவில்லை (NO_DISCRIMINATING_WINDOW).`
      : `The current calculated dasha-transit progression does not indicate a discriminating window for ${travelLabelEn} within the immediate calculated horizon (NO_DISCRIMINATING_WINDOW).`;

    const reason = isTamil
      ? "வெளிநாட்டுப் பயணத்திற்கு 3-ம் பாவகம் (குறுகிய பயணம்), 9-ம் பாவகம் (நீண்ட தூர பயணம்), 12-ம் பாவகம் (வெளிநாடு) மற்றும் ராகு, சந்திரன் ஆகியவற்றின் தசா-கோச்சார இணைப்புகள் தேவை. கணக்கிடப்பட்ட காலக்கட்டத்தில் இவை போதுமான அளவு ஒன்றிணையவில்லை."
      : "Vedic travel determination requires convergence across the 3rd (movement), 9th (distant journeys), 12th (foreign shores) houses, and Rahu/Moon activators. Current operative periods do not show simultaneous activation.";

    const limitation = isTamil
      ? "ஜோதிட காலக்கணிப்பு ஒரு குறியீட்டு வழிகாட்டல் மட்டுமே; விசா அனுமதி, பாஸ்போர்ட், நிதி வசதி மற்றும் சட்டப்பூர்வ நடைமுறைகளே உண்மையான பயணத்தை சாத்தியமாக்கும்."
      : "Astrological timing reflects traditional symbolic indicators only; visa approval, travel documentation, logistics, and financial affordability govern actual foreign travel.";

    return {
      questionId,
      intent: "FOREIGN_TRIP_TIMING",
      travelType,
      answerState: "NO_DISCRIMINATING_WINDOW",
      directAnswer,
      reason,
      limitation,
      recommendation: null,
      candidateWindows: [],
      timingResolution: null,
      supportingClaims: [],
      limitingClaims: [
        "No discriminating dasha-transit convergence for foreign travel in the evaluated horizon.",
        limitation
      ],
      missingInputs: ["Higher-level dasha transition points", "Transit Rahu/Jupiter aspect triggers"],
      traditionalMethod: "3rd/9th/12th Bhava and Moon-Rahu Activation under Vimshottari Dasha",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // Windows exist
  const primaryWin = candidateWindows[0];
  const windowStr = primaryWin.windowStart && primaryWin.windowEnd
    ? `${primaryWin.windowStart} – ${primaryWin.windowEnd}`
    : primaryWin.id;

  const directAnswer = isTamil
    ? `உங்கள் ஜாதக தசா மற்றும் கோச்சார அமைப்புகளின்படி ${travelLabelTa} மேற்கொள்வதற்கு மிகவும் சாதகமான காலகட்டம்: ${windowStr} ஆகும்.`
    : `According to your calculated dasha and transit indicators, the most supportive window for ${travelLabelEn} is ${windowStr}.`;

  const reason = isTamil
    ? `${primaryWin.descriptionTa || "தொடர்புடைய பாவகங்கள் மற்றும் காரக கிரகங்களின் தசா இணைப்பு ஏற்பட்டுள்ளது."} கோச்சார கிரக சஞ்சாரங்களும் இதற்கு துணைபுரிகின்றன.`
    : `${primaryWin.descriptionEn || "Operative dasha periods activate relevant travel houses."} Transiting planetary triggers provide supporting momentum.`;

  const limitation = isTamil
    ? "ஜோதிட காலக்கணிப்பு ஒரு குறியீட்டு வழிகாட்டல் மட்டுமே; விசா நடைமுறைகள், நிதி நிலை மற்றும் அரசு அனுமதிகள் நிஜ பயணத்தை தீர்மானிக்கும்."
    : "Astrological windows indicate classical traditional alignment only; visa issuance, airfare budgeting, and legal immigration status govern actual travel.";

  return {
    questionId,
    intent: "FOREIGN_TRIP_TIMING",
    travelType,
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
    traditionalMethod: "3rd/9th/12th Bhava and Moon-Rahu Activation under Vimshottari Dasha",
    empiricalStatus: "NOT_VALIDATED"
  };
}
