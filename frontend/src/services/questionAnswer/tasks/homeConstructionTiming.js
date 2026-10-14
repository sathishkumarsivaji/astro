/**
 * ASTROVERSE — Property & Home Construction Timing Task Evaluator
 * =================================================================
 * Evaluates house construction and property timing requests.
 * Explicitly separates:
 * 1. BUY_EXISTING_PROPERTY (apartment, flat, built house)
 * 2. BUY_LAND (plot, vacant land, site)
 * 3. BUILD_HOUSE (initiating or completing construction, housewarming)
 *
 * Implements Section 10 & 11 of the Question-Answering Redesign Mandate.
 */

import { computeTimingWindows } from "../timingEngine.js";

/**
 * Classifies the property/construction inquiry type.
 *
 * @param {string} text
 * @returns {"BUY_LAND"|"BUILD_HOUSE"|"BUY_EXISTING_PROPERTY"|"CONSTRUCTION_COMPLETION"|"HOUSEWARMING"}
 */
export function classifyPropertyType(text = "") {
  const norm = String(text).toLowerCase();
  if (/finish|complete|completion|roof|முடிக்க|முழுமையடைய/i.test(norm)) {
    return "CONSTRUCTION_COMPLETION";
  }
  if (/housewarming|griha|pravesh|move\s*in|குடியேற|கிரகப்பிரவேசம்/i.test(norm)) {
    return "HOUSEWARMING";
  }
  if (/land|plot|site|ground|agriculture|acre|நிலம்|மனை|விவசாய\s*நிலம்/i.test(norm)) {
    return "BUY_LAND";
  }
  if (/build|construct|erect|foundation|கட்ட|கட்டுமானம்/i.test(norm)) {
    return "BUILD_HOUSE";
  }
  return "BUY_EXISTING_PROPERTY";
}

/**
 * Evaluates the property and home construction timing task.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user inquiry
 * @param {Object} [params.context] - Execution context
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluateHomeConstructionTiming({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_HOME_CONSTRUCTION_TIMING";
  const propertyType = classifyPropertyType(question);

  const chart = context.chartData || context.chart || {};
  const dashaTimeline = chart.dashaTimeline || chart.dashas || chart.dashaTable || context.dashaTimeline || [];
  const transits = chart.transits || chart.gocharDashboard || context.transits || {};
  const vargas = chart.vargas || context.vargas || {};

  // For land or construction, use CONSTRUCTION/PROPERTY domain factors
  const domainKey = (propertyType === "BUY_LAND" || propertyType === "BUY_EXISTING_PROPERTY") ? "PROPERTY" : "CONSTRUCTION";

  const timingResult = computeTimingWindows({
    domain: domainKey,
    chart,
    dashaTimeline,
    transits,
    vargas,
    referenceYear: context.referenceYear || (new Date().getFullYear())
  });

  const rawWindows = timingResult.timingWindows || [];

  // Filter out broad un-narrowed spans (> 3 years)
  const candidateWindows = rawWindows.filter(w => {
    if (!w.windowStart || !w.windowEnd) return false;
    const s = parseInt(String(w.windowStart).slice(0, 4), 10);
    const e = parseInt(String(w.windowEnd).slice(0, 4), 10);
    if (isNaN(s) || isNaN(e)) return false;
    return (e - s) <= 3;
  });

  const hasWindows = candidateWindows.length > 0;

  let actionLabelEn = "initiating new home construction";
  let actionLabelTa = "புதிய வீடு கட்டத் தொடங்குதல்";

  if (propertyType === "BUY_LAND") {
    actionLabelEn = "purchasing vacant land or plot";
    actionLabelTa = "நிலம் அல்லது மனை வாங்குதல்";
  } else if (propertyType === "BUY_EXISTING_PROPERTY") {
    actionLabelEn = "purchasing an existing residential property (flat / built home)";
    actionLabelTa = "கட்டிய வீடு அல்லது குடியிருப்பு வாங்குதல்";
  } else if (propertyType === "CONSTRUCTION_COMPLETION") {
    actionLabelEn = "completing home construction";
    actionLabelTa = "வீட்டு கட்டுமானப் பணியை நிறைவு செய்தல்";
  } else if (propertyType === "HOUSEWARMING") {
    actionLabelEn = "housewarming (Griha Pravesha)";
    actionLabelTa = "கிரகப்பிரவேசம் / புதுமனை புகுவிழா";
  }

  if (!hasWindows) {
    const directAnswer = isTamil
      ? `தற்போதைய தசா-கோச்சார கணிப்புகளில் ${actionLabelTa} செய்வதற்கான தனித்துவமான காலக்கோடு உடனடியாக அமையவில்லை (NO_DISCRIMINATING_WINDOW).`
      : `The current calculated dasha-transit timeline does not indicate a discriminating window for ${actionLabelEn} within the immediate calculated horizon (NO_DISCRIMINATING_WINDOW).`;

    const reason = isTamil
      ? "சொத்து மற்றும் கட்டுமான அமைப்புகளுக்கு 4-ம் பாவகம் (சுப ஸ்தானம் / குடியிருப்பு), பூமி காரகன் செவ்வாய் மற்றும் கட்டுமான காரகன் சனியின் ஒருங்கிணைந்த தசா-கோச்சார பார்வை தேவை. தற்போதைய கணிப்பில் இந்த ஒருங்கிணைவு போதுமான அளவு உறுதிப்படவில்லை."
      : "Real estate and construction milestones require multi-factor alignment between the 4th house (residence), Bhumi karaka Mars (land and physical foundation), and Saturn (structural execution). Active periods do not show simultaneous discriminating convergence.";

    const limitation = isTamil
      ? "நிலம் மற்றும் கட்டுமானப் பணிகள் அரசு அங்கீகாரம், வரைபட அனுமதி, நிதி வரவு-செலவு மற்றும் சட்டப்பூர்வ ஆவணங்களை மட்டுமே சார்ந்தது; ஜோதிட காலம் மட்டுமே கட்டிட அமைப்பை உருவாக்காது."
      : "Property acquisition and construction depend fundamentally on municipal permits, clear title deeds, architectural drawings, material availability, and financial liquidity.";

    return {
      questionId,
      intent: "HOME_CONSTRUCTION_TIMING",
      propertyType,
      stage: propertyType,
      answerState: "NO_DISCRIMINATING_WINDOW",
      timingStatus: "NOT_DISCRIMINATING",
      timingResolution: "NOT_DISCRIMINATING",
      timingWindow: null,
      directAnswer,
      reason,
      limitation,
      recommendation: null,
      candidateWindows: [],
      supportingClaims: [],
      limitingClaims: [
        `No discriminating dasha-transit convergence for ${actionLabelEn} in the evaluated horizon.`,
        limitation
      ],
      missingInputs: ["4th house / Mars dasha convergence points", "Transit Jupiter / Saturn aspect to 4th house"],
      traditionalMethod: "4th Bhava, Mars (Bhumi Karaka) & Saturn Structural Alignment under Vimshottari Dasha",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // Discriminating window exists
  const primaryWin = candidateWindows[0];
  const windowStr = primaryWin.windowStart && primaryWin.windowEnd
    ? `${primaryWin.windowStart} – ${primaryWin.windowEnd}`
    : primaryWin.id;

  const directAnswer = isTamil
    ? `உங்கள் ஜாதக தசா மற்றும் கோச்சார அமைப்புகளின்படி ${actionLabelTa} மேற்கொள்வதற்கு மிகவும் சாதகமான காலகட்டம்: ${windowStr} ஆகும்.`
    : `According to your calculated dasha and transit indicators, the most favorable window for ${actionLabelEn} is ${windowStr}.`;

  const reason = isTamil
    ? `${primaryWin.descriptionTa || "4-ம் பாவகம் மற்றும் பூமி காரக செவ்வாயின் தசா கால தொடர்பு ஏற்பட்டுள்ளது."} கோச்சார கிரக சஞ்சாரங்களும் இதற்கு வலுவூட்டுகின்றன.`
    : `${primaryWin.descriptionEn || "Operative dasha periods activate the 4th house of residence and Bhumi karaka Mars."} Supporting transits reinforce this interval.`;

  const limitation = isTamil
    ? "பாரம்பரிய காலக்கணிப்பு ஒரு குறியீட்டு வாய்ப்பு மட்டுமே; சட்டப்பூர்வ ஆவண சரிபார்ப்பு, வங்கி கடன் அனுமதி மற்றும் நிதி மேலாண்மையே உண்மையான சொத்து சேர்க்கையை நிறைவு செய்யும்."
    : "Astrological timing reflects traditional electional suitability only; legal title clearance, mortgage authorizations, and construction contracts govern real-world property milestones.";

  const readableClaims = [
    `4th House (Residences & Immovable Assets) activation under ${primaryWin.descriptionEn || "operative dasha period"}`,
    "Mars (Bhumi Karaka) and Saturn structural endurance indicators"
  ];

  return {
    questionId,
    intent: "HOME_CONSTRUCTION_TIMING",
    propertyType,
    stage: propertyType,
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
    candidateWindows,
    supportingClaims: readableClaims,
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: "4th Bhava, Mars (Bhumi Karaka) & Saturn Structural Alignment under Vimshottari Dasha",
    empiricalStatus: "NOT_VALIDATED"
  };
}
