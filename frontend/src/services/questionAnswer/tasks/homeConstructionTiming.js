/**
 * ASTROVERSE — Home Construction Timing Task Evaluator
 * ======================================================
 * Evaluates house construction timing requests.
 * Explicitly separates construction start (CONSTRUCTION_START),
 * completion (CONSTRUCTION_COMPLETION), property purchase (PROPERTY_PURCHASE),
 * and housewarming (HOUSEWARMING).
 *
 * Implements Section 10 & 11 of the Question-Answering Redesign Mandate.
 */

import { computeTimingWindows } from "../timingEngine.js";

/**
 * Classifies the construction/property stage in the inquiry.
 *
 * @param {string} text
 * @returns {"CONSTRUCTION_START"|"CONSTRUCTION_COMPLETION"|"PROPERTY_PURCHASE"|"HOUSEWARMING"}
 */
export function classifyConstructionStage(text = "") {
  const norm = String(text).toLowerCase();
  if (/finish|complete|completion|roof|முடிக்க|முழுமையடைய/i.test(norm)) {
    return "CONSTRUCTION_COMPLETION";
  }
  if (/buy|purchase|flat|plot|apartment|வாங்க/i.test(norm) && !/build|construct|கட்ட/i.test(norm)) {
    return "PROPERTY_PURCHASE";
  }
  if (/housewarming|griha|pravesh|move\s*in|குடியேற|கிரகப்பிரவேசம்/i.test(norm)) {
    return "HOUSEWARMING";
  }
  return "CONSTRUCTION_START";
}

/**
 * Evaluates the home construction timing task.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user inquiry
 * @param {Object} [params.context] - Execution context
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluateHomeConstructionTiming({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_HOME_CONSTRUCTION_TIMING";
  const stage = classifyConstructionStage(question);

  const chart = context.chartData || context.chart || {};
  const dashaTimeline = chart.dashaTimeline || chart.dashas || chart.dashaTable || context.dashaTimeline || [];
  const transits = chart.transits || chart.gocharDashboard || context.transits || {};
  const vargas = chart.vargas || context.vargas || {};

  const timingResult = computeTimingWindows({
    domain: "CONSTRUCTION",
    chart,
    dashaTimeline,
    transits,
    vargas,
    referenceYear: context.referenceYear || (new Date().getFullYear())
  });

  const candidateWindows = timingResult.timingWindows || [];
  const hasWindows = candidateWindows.length > 0;

  const stageLabelEn = stage === "CONSTRUCTION_COMPLETION"
    ? "completing home construction"
    : (stage === "HOUSEWARMING" ? "housewarming (Griha Pravesha)" : "initiating new home construction");

  const stageLabelTa = stage === "CONSTRUCTION_COMPLETION"
    ? "வீட்டு கட்டுமானப் பணியை நிறைவு செய்தல்"
    : (stage === "HOUSEWARMING" ? "கிரகப்பிரவேசம் / புதுமனை புகுவிழா" : "புதிய வீடு கட்டத் தொடங்குதல்");

  if (!hasWindows) {
    const directAnswer = isTamil
      ? `தற்போதைய தசா-கோச்சார கணிப்புகளில் ${stageLabelTa} செய்வதற்கான தனித்துவமான காலக்கோடு உடனடியாக அமையவில்லை (NO_DISCRIMINATING_WINDOW).`
      : `The current calculated dasha-transit timeline does not indicate a discriminating window for ${stageLabelEn} within the immediate calculated horizon (NO_DISCRIMINATING_WINDOW).`;

    const reason = isTamil
      ? "வீடு கட்டுவதற்கு 4-ம் பாவகம் (சுப ஸ்தானம் / குடியிருப்பு), பூமி காரகன் செவ்வாய் மற்றும் கட்டுமான காரகன் சனியின் ஒருங்கிணைந்த தசா-கோச்சார பார்வை தேவை. தற்போதைய கணிப்பில் இந்த ஒருங்கிணைவு போதுமான அளவு உறுதிப்படவில்லை."
      : "Initiating home construction requires multi-factor alignment between the 4th house (residence), Bhumi karaka Mars (land and brick structure), and Saturn (foundation and construction labor). Active periods do not show simultaneous convergence.";

    const limitation = isTamil
      ? "கட்டுமானப் பணிகள் அரசு அங்கீகாரம், வரைபட அனுமதி, நிதி வரவு-செலவு மற்றும் பொறியியல் ஒப்பந்தங்களைப் பொறுத்தது; ஜோதிட காலம் மட்டுமே கட்டிட அமைப்பை உருவாக்காது."
      : "Construction milestones depend fundamentally on municipal building permits, architectural drawings, engineering feasibility, material availability, and financial solvency.";

    return {
      questionId,
      intent: "HOME_CONSTRUCTION_TIMING",
      stage,
      answerState: "NO_DISCRIMINATING_WINDOW",
      directAnswer,
      reason,
      limitation,
      recommendation: null,
      candidateWindows: [],
      timingResolution: null,
      supportingClaims: [],
      limitingClaims: [
        "No discriminating dasha-transit convergence for home construction in the evaluated horizon.",
        limitation
      ],
      missingInputs: ["4th house / Mars dasha convergence points", "Transit Jupiter / Saturn aspect to 4th house"],
      traditionalMethod: "4th Bhava, Mars (Bhumi Karaka) & Saturn Structural Alignment under Vimshottari Dasha",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // Windows exist
  const primaryWin = candidateWindows[0];
  const windowStr = primaryWin.windowStart && primaryWin.windowEnd
    ? `${primaryWin.windowStart} – ${primaryWin.windowEnd}`
    : primaryWin.id;

  const directAnswer = isTamil
    ? `உங்கள் ஜாதக தசா மற்றும் கோச்சார அமைப்புகளின்படி ${stageLabelTa} மேற்கொள்வதற்கு மிகவும் சாதகமான காலகட்டம்: ${windowStr} ஆகும்.`
    : `According to your calculated dasha and transit indicators, the most favorable window for ${stageLabelEn} is ${windowStr}.`;

  const reason = isTamil
    ? `${primaryWin.descriptionTa || "4-ம் பாவகம் மற்றும் பூமி காரக செவ்வாயின் தசா கால தொடர்பு ஏற்பட்டுள்ளது."} கோச்சார கிரக சஞ்சாரங்களும் இதற்கு வலுவூட்டுகின்றன.`
    : `${primaryWin.descriptionEn || "Operative dasha periods activate the 4th house of residence and Bhumi karaka Mars."} Supporting transits reinforce this interval.`;

  const limitation = isTamil
    ? "பாரம்பரிய காலக்கணிப்பு ஒரு குறியீட்டு வாய்ப்பு மட்டுமே; கட்டிட பொறியியல் திட்டமிடல், அனுமதி மற்றும் நிதி மேலாண்மையே உண்மையான கட்டுமானத்தை நிறைவு செய்யும்."
    : "Astrological timing reflects traditional electional suitability only; architectural approvals, material supplies, contractor reliability, and capital reserves govern real-world construction.";

  return {
    questionId,
    intent: "HOME_CONSTRUCTION_TIMING",
    stage,
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
    traditionalMethod: "4th Bhava, Mars (Bhumi Karaka) & Saturn Structural Alignment under Vimshottari Dasha",
    empiricalStatus: "NOT_VALIDATED"
  };
}
