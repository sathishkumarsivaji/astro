/**
 * SKR ASTRO — Named Competitive Examination Task Evaluator
 * ==========================================================
 * Evaluates academic and competitive examination prospects.
 *
 * Implements strict non-negotiable rules:
 * - Fail-closed: returns INSUFFICIENT_DATA with zero calculated facts if chart data is missing.
 * - Preserves the exact examination name (e.g., "UGC NET", "UPSC", "NEET", "GATE")
 *   and target session/year (e.g., "December 2026", "DEC 2026") without truncating session names.
 * - NEVER substitutes marriage commentary, general boilerplate, or generic career text.
 * - Refuses pass/fail guarantees (zero deterministic "100% pass" or "guaranteed failure" claims).
 * - Analyzes 4th (learning/memory), 5th (intellect/discernment), 6th (competitive edge),
 *   Mercury (analytical recall), and Jupiter (wisdom).
 * - Timing resolution: strictly null when candidate windows are absent (never defaulted to MONTH_RANGE).
 */

import { computeTimingWindows } from "../timingEngine.js";
import { getHouseByNumber, getPlanetByName, hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

/**
 * Extracts the named examination from the query text.
 *
 * @param {string} text
 * @returns {string} Standardized exam name
 */
export function extractExamName(text = "") {
  const norm = String(text);
  const match = norm.match(/\b(UGC\s*NET|UPSC(?:\s*CSE)?|NEET(?:\s*PG)?|GATE|CAT|IIT(?:\s*JEE)?|JEE|GMAT|GRE|SAT|IAS|IPS|TNPSC|IBPS|BANK\s*EXAM|CA\s*EXAM|CHARTERED\s*ACCOUNTANCY|CFA)\b/i);
  if (match) {
    return match[1].toUpperCase().replace(/\s+/g, " ");
  }
  if (/போட்டித்\s*தேர்வு/i.test(text)) {
    return "போட்டித் தேர்வு (Competitive Exam)";
  }
  return "Competitive Examination";
}

/**
 * Extracts target exam session or year (e.g., "December 2026", "DEC 2026", "2026").
 * Correctly preserves full month and 3-letter month abbreviations without truncating to year.
 *
 * @param {string} text
 * @returns {string|null} Standardized session string
 */
export function extractExamSession(text = "") {
  const norm = String(text);

  const monthConfigs = [
    { regex: /\b(?:Jan(?:uary)?)\s*(20\d\d)\b/i, standard: "January" },
    { regex: /\b(?:Feb(?:ruary)?)\s*(20\d\d)\b/i, standard: "February" },
    { regex: /\b(?:Mar(?:ch)?)\s*(20\d\d)\b/i, standard: "March" },
    { regex: /\b(?:Apr(?:il)?)\s*(20\d\d)\b/i, standard: "April" },
    { regex: /\b(?:May)\s*(20\d\d)\b/i, standard: "May" },
    { regex: /\b(?:Jun(?:e)?)\s*(20\d\d)\b/i, standard: "June" },
    { regex: /\b(?:Jul(?:y)?)\s*(20\d\d)\b/i, standard: "July" },
    { regex: /\b(?:Aug(?:ust)?)\s*(20\d\d)\b/i, standard: "August" },
    { regex: /\b(?:Sep(?:tember)?)\s*(20\d\d)\b/i, standard: "September" },
    { regex: /\b(?:Oct(?:ober)?)\s*(20\d\d)\b/i, standard: "October" },
    { regex: /\b(?:Nov(?:ember)?)\s*(20\d\d)\b/i, standard: "November" },
    { regex: /\b(?:Dec(?:ember)?)\s*(20\d\d)\b/i, standard: "December" }
  ];

  for (const m of monthConfigs) {
    const match = norm.match(m.regex);
    if (match) {
      return `${m.standard} ${match[1]}`;
    }
  }

  // Tamil month names followed by year (avoid ASCII-only \b for Unicode scripts)
  const matchTamilMonth = norm.match(/(?:^|\s|[.,?!])(ஜனவரி|பிப்ரவரி|மார்ச்|ஏப்ரல்|மே|ஜூன்|ஜூலை|ஆகஸ்ட்|செப்டம்பர்|அக்டோபர்|நவம்பர்|டிசம்பர்)\s*(20\d\d)(?:$|\s|[.,?!])/i);
  if (matchTamilMonth) {
    return `${matchTamilMonth[1]} ${matchTamilMonth[2]}`;
  }

  // Bare year fallback only when month is completely absent
  const matchYear = norm.match(/\b(20\d\d)\b/);
  if (matchYear) {
    return matchYear[1];
  }
  return null;
}

export function evaluateNamedExamination({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_NAMED_EXAMINATION";
  const examName = extractExamName(question);
  const targetSession = extractExamSession(question);

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "NAMED_EXAMINATION_OUTLOOK",
      taskType: "COMPETITIVE_EXAMINATION_OUTLOOK",
      isTamil,
      missingInputs: ["birthChart", "planetaryPositions"],
      traditionalMethod: "5th/6th/4th Bhava and Mercury-Jupiter Knowledge Synthesis under Vimshottari Dasha",
      customDirectAnswerEn: `Insufficient birth chart data to evaluate prospects for ${examName}. Accurate assessment requires verified planetary coordinates and house placements.`,
      customDirectAnswerTa: `${examName} தேர்விற்கான ஜோதிட வாய்ப்புகளை கணிக்க தேவையான பிறப்பு ஜாதகத் தரவுகள் கிடைக்கவில்லை.`
    });
  }

  const chart = context.chartData || context.chart || context;
  const h4 = getHouseByNumber(chart, 4);
  const h5 = getHouseByNumber(chart, 5);
  const h6 = getHouseByNumber(chart, 6);

  const mercury = getPlanetByName(chart, "Mercury");
  const jupiter = getPlanetByName(chart, "Jupiter");

  const h4Sign = h4?.sign || h4?.signName || "4th Bhava";
  const h5Sign = h5?.sign || h5?.signName || "5th Bhava";
  const h5Lord = h5?.lord || h5?.ruler || null;
  const h6Sign = h6?.sign || h6?.signName || "6th Bhava";
  const h6Lord = h6?.lord || h6?.ruler || null;

  const dashaTimeline = chart.dashaTimeline || chart.dashas || chart.dashaTable || context.dashaTimeline || [];
  const transits = chart.transits || chart.gocharDashboard || context.transits || {};
  const vargas = chart.vargas || context.vargas || {};

  // Compute timing windows for education/intellectual focus
  const timingResult = computeTimingWindows({
    domain: "career",
    chart,
    dashaTimeline,
    transits,
    vargas,
    referenceYear: context.referenceYear || (new Date().getFullYear())
  });

  const candidateWindows = timingResult.timingWindows || [];
  const primaryWin = candidateWindows[0] || null;
  const windowStr = targetSession || (primaryWin && primaryWin.windowStart && primaryWin.windowEnd
    ? `${primaryWin.windowStart} – ${primaryWin.windowEnd}`
    : (primaryWin?.id || null));

  const sessionLabelEn = targetSession ? ` for the ${targetSession} session` : "";
  const sessionLabelTa = targetSession ? ` (${targetSession} பருவத்தேர்வு)` : "";

  const calculatedFacts = [
    { id: "FACT_EXAM_NAME", factor: "Preserved Exam Name", value: examName },
    { id: "FACT_EXAM_SESSION", factor: "Preserved Exam Session", value: targetSession || "UNSPECIFIED" },
    ...(h4 ? [{ id: "FACT_H4_EDUCATION", factor: "4th House (Education/Memory)", sign: h4Sign }] : []),
    ...(h5 ? [{ id: "FACT_H5_INTELLECT", factor: "5th House (Buddhi/Discernment)", sign: h5Sign, ...(h5Lord ? { lord: h5Lord } : {}) }] : []),
    ...(h6 ? [{ id: "FACT_H6_COMPETITION", factor: "6th House (Competitive Edge)", sign: h6Sign, ...(h6Lord ? { lord: h6Lord } : {}) }] : []),
    ...(mercury ? [{ id: "FACT_MERCURY_RECALL", factor: "Mercury (Analytical Recall)", dignity: mercury.dignity || "NATAL" }] : []),
    ...(jupiter ? [{ id: "FACT_JUPITER_KNOWLEDGE", factor: "Jupiter (Jnana Karaka)", dignity: jupiter.dignity || "NATAL" }] : [])
  ];

  const traditionalRules = [
    { id: "RULE_5TH_HOUSE_DISCERNMENT", source: "Brihat Parashara Hora Shastra", text: "5th house and its lord govern intellect, analytical capacity, examination memory, and competitive acumen." },
    { id: "RULE_6TH_HOUSE_COMPETITIVE_EDGE", source: "Phaladeepika", text: "6th house represents overcoming rivals, triumph in competitive contests, and examination stamina." },
    { id: "RULE_NO_PASS_FAIL_PROMISE", source: "Academic & Methodological Standard", text: "Astrological charts cannot guarantee examination results; intellectual rhythm provides supportive momentum, but syllabus mastery and exam-day execution determine the outcome." }
  ];

  const limitation = isTamil
    ? "ஜோதிடம் அறிவாற்றல் மற்றும் மன ஒருமுகப்பாட்டிற்கான சாதகமான காலக்கட்டத்தை மட்டுமே சுட்டிக்காட்டும்; எந்தவொரு தேர்விலும் தேர்ச்சி (Pass) அல்லது தோல்வி (Fail) என்பதை ஜாதகம் உறுதி செய்யாது. முழுமையான பாடத்திட்ட தயாரிப்பு, மாதிரி தேர்வு மதிப்பெண்கள், திருப்புதல் பயிற்சி மற்றும் தேர்வு மையத்தில் வெளிப்படுத்தும் துல்லியமான செயல்பாடு மட்டுமே உண்மையான வெற்றிக்கு வழிவகுக்கும்."
    : "Astrological factors evaluate intellectual rhythm, concentration stamina, and favorable cognitive periods; they can never guarantee an examination result (pass or fail). Actual success is strictly determined by comprehensive syllabus coverage, mock exam benchmark scores, timed revision discipline, and performance on the day of the exam.";

  let directAnswer = "";
  let reason = "";

  if (isTamil) {
    directAnswer = `உங்கள் ஜாதகத்தில் கல்வி மற்றும் சிந்தனைக்கான 5-ம் பாவகம் (${h5Sign}${h5Lord ? `, அதிபதி: ${h5Lord}` : ""}), போட்டித் தேர்வை குறிக்கும் 6-ம் பாவகம் (${h6Sign}) ஆகியவற்றின் நிலைகளின்படி, ${examName} தேர்விற்கான${sessionLabelTa} அறிவார்ந்த தயாரிப்பு சூழல் ஆராயப்பட்டது. ஜோதிட ரீதியாக எந்த தேர்ச்சி உத்தரவாதமும் வழங்க முடியாது; உங்களின் தீவிர பயிற்சியும் மாதிரித் தேர்வு மதிப்பெண்களுமே வெற்றியை தீர்மானிக்கும்.`;
    reason = `5-ம் பாவக புத்தி கூர்மை, 6-ம் பாவக போட்டித்திறன் மற்றும் வித்யா காரகர்களின் பலம் ஒருங்கிணைக்கப்பட்டு ${examName} ஆய்வு மேற்கொள்ளப்பட்டது.`;
  } else {
    directAnswer = `In your chart, the 5th house of discernment (${h5Sign}${h5Lord ? `, ruled by ${h5Lord}` : ""}) and 6th house of competitive stamina (${h6Sign}) indicate intellectual focus and analytical stamina for ${examName}${sessionLabelEn}. Astrological configurations reflect cognitive momentum, but never guarantee an examination result (pass/fail). Your diligent syllabus preparation and mock test performance remain the sole real-world arbiters of success.`;
    reason = `Evaluated 5th Bhava analytical acumen, 6th Bhava competitive stamina, and cognitive karakas specifically for ${examName}${sessionLabelEn}.`;
  }

  return {
    questionId,
    intent: "NAMED_EXAMINATION_OUTLOOK",
    taskType: "COMPETITIVE_EXAMINATION_OUTLOOK",
    examName,
    targetSession,
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation,
    recommendation: {
      examName,
      targetSession: targetSession || "Upcoming Session",
      actionGuidance: isTamil ? "பாடத்திட்டம் முழுவதையும் திருப்புதல் செய்து மாதிரித் தேர்வுகளை பயிற்சி செய்யவும்." : "Prioritize syllabus completion, regular mock exams, and timed answer practice."
    },
    candidateWindows: primaryWin ? [primaryWin] : [],
    timingResolution: primaryWin ? (primaryWin.resolution || "MONTH_RANGE") : null,
    supportingClaims: calculatedFacts.map(f => `${f.factor}: ${f.value || f.sign || f.dignity || "Evaluated"}`),
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: "5th/6th/4th Bhava and Mercury-Jupiter Knowledge Synthesis under Vimshottari Dasha",
    empiricalStatus: "NOT_VALIDATED",
    calculatedFacts,
    traditionalRules
  };
}
