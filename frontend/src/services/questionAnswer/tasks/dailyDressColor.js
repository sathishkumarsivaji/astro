/**
 * ASTROVERSE — Daily Dress Colour Task Evaluator
 * ===============================================
 * Evaluates clothing colour recommendations using disclosed traditional methods.
 * Never substitutes natal chart overviews for a colour recommendation.
 *
 * Implements Section 5A of the User-Facing Task Answering Mandate.
 */

import { resolveTemporalTimeframe } from "../temporalResolver.js";

export const COLOR_TRADITION_RULES = Object.freeze([
  {
    ruleId: "COLOR_WEEKDAY_RULE_SUN",
    weekday: "Sunday",
    dayOfWeek: 0,
    rulerPlanet: "Sun",
    recommendedColorsEn: ["Orange", "Red", "Gold"],
    alternativeColorsEn: ["Yellow", "Copper"],
    recommendedColorsTa: ["ஆரஞ்சு", "சிவப்பு", "தங்க நிறம்"],
    alternativeColorsTa: ["மஞ்சள்", "செம்பு நிறம்"],
    sourceReference: "Brihat Parashara Hora Shastra, Graha Vastra Adhyaya",
    empiricalStatus: "NOT_VALIDATED"
  },
  {
    ruleId: "COLOR_WEEKDAY_RULE_MON",
    weekday: "Monday",
    dayOfWeek: 1,
    rulerPlanet: "Moon",
    recommendedColorsEn: ["White", "Silver", "Cream"],
    alternativeColorsEn: ["Light Grey", "Pearl White"],
    recommendedColorsTa: ["வெள்ளை", "வெள்ளி நிறம்", "கிரீம்"],
    alternativeColorsTa: ["இளஞ்சாம்பல்", "முத்து வெள்ளை"],
    sourceReference: "Brihat Parashara Hora Shastra, Graha Vastra Adhyaya",
    empiricalStatus: "NOT_VALIDATED"
  },
  {
    ruleId: "COLOR_WEEKDAY_RULE_TUE",
    weekday: "Tuesday",
    dayOfWeek: 2,
    rulerPlanet: "Mars",
    recommendedColorsEn: ["Red", "Coral", "Maroon"],
    alternativeColorsEn: ["Crimson", "Orange"],
    recommendedColorsTa: ["சிவப்பு", "பவள நிறம்", "மெரூன்"],
    alternativeColorsTa: ["அடர் சிவப்பு", "ஆரஞ்சு"],
    sourceReference: "Brihat Parashara Hora Shastra, Graha Vastra Adhyaya",
    empiricalStatus: "NOT_VALIDATED"
  },
  {
    ruleId: "COLOR_WEEKDAY_RULE_WED",
    weekday: "Wednesday",
    dayOfWeek: 3,
    rulerPlanet: "Mercury",
    recommendedColorsEn: ["Green", "Emerald"],
    alternativeColorsEn: ["Light Green", "Turquoise"],
    recommendedColorsTa: ["பச்சை", "மரகதப் பச்சை"],
    alternativeColorsTa: ["இளம்பச்சை", "நீலப்பச்சை"],
    sourceReference: "Brihat Parashara Hora Shastra, Graha Vastra Adhyaya",
    empiricalStatus: "NOT_VALIDATED"
  },
  {
    ruleId: "COLOR_WEEKDAY_RULE_THU",
    weekday: "Thursday",
    dayOfWeek: 4,
    rulerPlanet: "Jupiter",
    recommendedColorsEn: ["Yellow", "Gold", "Mustard"],
    alternativeColorsEn: ["Saffron", "Cream"],
    recommendedColorsTa: ["மஞ்சள்", "தங்க நிறம்", "கடுகு நிறம்"],
    alternativeColorsTa: ["காவி", "கிரீம்"],
    sourceReference: "Brihat Parashara Hora Shastra, Graha Vastra Adhyaya",
    empiricalStatus: "NOT_VALIDATED"
  },
  {
    ruleId: "COLOR_WEEKDAY_RULE_FRI",
    weekday: "Friday",
    dayOfWeek: 5,
    rulerPlanet: "Venus",
    recommendedColorsEn: ["White", "Pink", "Pastel Shades"],
    alternativeColorsEn: ["Light Blue", "Cream"],
    recommendedColorsTa: ["வெள்ளை", "இளஞ்சிவப்பு", "மென்மையான வண்ணங்கள்"],
    alternativeColorsTa: ["இளம் நீலம்", "கிரீம்"],
    sourceReference: "Brihat Parashara Hora Shastra, Graha Vastra Adhyaya",
    empiricalStatus: "NOT_VALIDATED"
  },
  {
    ruleId: "COLOR_WEEKDAY_RULE_SAT",
    weekday: "Saturday",
    dayOfWeek: 6,
    rulerPlanet: "Saturn",
    recommendedColorsEn: ["Dark Blue", "Navy", "Black"],
    alternativeColorsEn: ["Charcoal Grey", "Dark Violet"],
    recommendedColorsTa: ["அடர் நீலம்", "நேவி புளூ", "கருப்பு"],
    alternativeColorsTa: ["சாம்பல்", "ஊதா"],
    sourceReference: "Brihat Parashara Hora Shastra, Graha Vastra Adhyaya",
    empiricalStatus: "NOT_VALIDATED"
  }
]);

/**
 * Evaluates the daily dress colour task.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user inquiry
 * @param {Object} [params.context] - Execution context (chart, location, timezone, options)
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluateDailyDressColor({ question = "", context = {}, isTamil = false } = {}) {
  const method = context.colorMethod || "WEEKDAY_TRADITION";
  const questionId = context.questionId || "TASK_DRESS_COLOR";

  // Check if color recommendation is disabled or explicitly unsupported in context
  if (context.unsupportedTasks && context.unsupportedTasks.includes("DAILY_DRESS_COLOR")) {
    const directAnswer = isTamil
      ? "தினசரி ஆடை நிற வழிகாட்டுதல் இந்த அமைப்பில் இன்னும் உருவாக்கப்படவில்லை. உங்கள் பிறப்பு ஜாதக சுருக்கம் இன்றைய தினத்திற்கான ஆடை நிற பரிந்துரையை வழங்காது."
      : "Daily dress-colour guidance is not implemented yet. Your natal-chart summary does not establish a colour recommendation for today.";

    return {
      questionId,
      intent: "DAILY_DRESS_COLOR",
      answerState: "UNSUPPORTED_TASK",
      directAnswer,
      recommendation: null,
      evaluatedTimeframe: null,
      supportingClaims: [],
      limitingClaims: ["Daily colour selection is not implemented in the current engine."],
      missingInputs: ["Implemented colour engine"],
      traditionalMethod: null,
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // Resolve target timeframe (defaults to today at action location/timezone)
  const timeframe = resolveTemporalTimeframe({
    question,
    referenceInstant: context.referenceInstant || context.currentTime || null,
    actionTimezone: context.actionTimezone || context.timezone || null,
    actionLocation: context.actionLocation || context.currentCity || null,
    weekStartPreference: context.weekStartPreference || "Monday"
  });

  const dayOfWeek = timeframe.dayOfWeek;
  const rule = COLOR_TRADITION_RULES.find(r => r.dayOfWeek === dayOfWeek);

  if (!rule) {
    const directAnswer = isTamil
      ? "தேர்ந்தெடுக்கப்பட்ட தினத்திற்கான கிழமைத் தரவுகள் கிடைக்கவில்லை. ஆடை நிற பரிந்துரை வழங்க இயலவில்லை."
      : "The weekday data for the selected date could not be resolved. Colour guidance cannot be established.";

    return {
      questionId,
      intent: "DAILY_DRESS_COLOR",
      answerState: "NOT_ESTABLISHED",
      directAnswer,
      recommendation: null,
      evaluatedTimeframe: timeframe,
      supportingClaims: [],
      limitingClaims: ["Unresolved day of week for action date."],
      missingInputs: ["Valid weekday calculation"],
      traditionalMethod: method,
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  const primaryColor = isTamil ? rule.recommendedColorsTa[0] : rule.recommendedColorsEn[0];
  const altColor = isTamil ? rule.alternativeColorsTa[0] : rule.alternativeColorsEn[0];
  const allRecommended = isTamil ? rule.recommendedColorsTa.join(", ") : rule.recommendedColorsEn.join(", ");
  const allAlternatives = isTamil ? rule.alternativeColorsTa.join(", ") : rule.alternativeColorsEn.join(", ");

  const directAnswer = isTamil
    ? `இன்றைய தினத்திற்கு (${timeframe.weekdayNameTa || rule.weekday}), பாரம்பரிய வார நாள் வழக்கத்தின்படி பரிந்துரைக்கப்படும் நிறம் ${primaryColor}, மாற்று விருப்பமாக ${altColor} உள்ளது. இது ஒரு கலாச்சார/பாரம்பரிய வழிகாட்டுதல் மட்டுமே; அதிர்ஷ்டத்திற்கான உத்தரவாதம் அல்ல.`
    : `For today (${rule.weekday}), the configured weekday tradition recommends ${primaryColor}, with ${altColor} as another option. This is a cultural/traditional preference, not a guarantee of luck.`;

  const reason = isTamil
    ? `பாரம்பரிய பராசர ஹோரா சாஸ்திர வார அதிபதி விதிகளின்படி, ${timeframe.weekdayNameTa || rule.weekday} கிழமையின் அதிபதி ${rule.rulerPlanet} ஆவார். ${rule.rulerPlanet} கிரகத்தின் ஆதிக்க வண்ணங்கள்: ${allRecommended}; மாற்று வண்ணங்கள்: ${allAlternatives}.`
    : `Under classical weekday planetary rulership (${rule.sourceReference}), ${rule.weekday} is governed by the ${rule.rulerPlanet}. Associated traditional hues include ${allRecommended}, with secondary harmonious tones of ${allAlternatives}.`;

  const limitation = isTamil
    ? "ஆடை நிறத் தேர்வுகள் பாரம்பரிய ஜோதிட வழக்கம் மட்டுமே; இவை தனிப்பட்ட வெற்றி, அதிர்ஷ்டம் அல்லது வணிக நிகழ்வுகளை தீர்மானிக்காது."
    : "Dress colour selection is a traditional cultural convention; it does not promise or govern luck, professional outcomes, or personal fortune.";

  return {
    questionId,
    intent: "DAILY_DRESS_COLOR",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation,
    recommendation: {
      primaryColor,
      alternativeColor: altColor,
      allRecommended: isTamil ? rule.recommendedColorsTa : rule.recommendedColorsEn,
      allAlternatives: isTamil ? rule.alternativeColorsTa : rule.alternativeColorsEn,
      weekday: rule.weekday,
      rulerPlanet: rule.rulerPlanet,
      method: "WEEKDAY_TRADITION"
    },
    candidateWindows: [
      {
        id: `COLOR_WINDOW_${timeframe.localStartDate}`,
        windowStart: timeframe.localStartDate,
        windowEnd: timeframe.localStartDate,
        resolution: "DATE",
        supportingEvidence: [`RULE_${rule.ruleId}`]
      }
    ],
    evaluatedTimeframe: timeframe,
    supportingClaims: [
      `Weekday: ${rule.weekday} (${timeframe.localStartDate})`,
      `Traditional Ruler: ${rule.rulerPlanet}`,
      `Configured Rule: ${rule.ruleId}`
    ],
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: "WEEKDAY_TRADITION",
    sourceReference: rule.sourceReference,
    empiricalStatus: "NOT_VALIDATED"
  };
}
