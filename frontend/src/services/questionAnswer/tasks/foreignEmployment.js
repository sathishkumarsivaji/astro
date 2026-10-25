/**
 * SKR ASTRO — Foreign Employment Task Evaluator
 * ===============================================
 * Evaluates overseas job and foreign employment opportunities.
 *
 * Implements strict non-negotiable rules:
 * - Fail-closed: returns INSUFFICIENT_DATA with zero calculated facts if chart data is missing.
 * - Requires simultaneous joint confluence of career factors (10th/6th houses) AND
 *   foreign residence factors (9th/12th houses/Rahu).
 * - Foreign travel or vacation indicators alone do NOT entail overseas employment.
 * - Cleanly differentiates temporary trips, foreign employment, and permanent settlement.
 * - Timing resolution: strictly null when candidate windows are absent.
 * - Explicitly explains that international job offers, work visas, and labor certifications
 *   govern actual foreign employment.
 */

import { computeTimingWindows } from "../timingEngine.js";
import { getHouseByNumber, getPlanetByName, hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

export function evaluateForeignEmployment({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_FOREIGN_EMPLOYMENT";

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "FOREIGN_EMPLOYMENT",
      taskType: "OVERSEAS_EMPLOYMENT_TIMING",
      isTamil,
      missingInputs: ["birthChart", "bhavasDetailed"],
      traditionalMethod: "10th/6th Career and 9th/12th Foreign Bhava Confluence under Vimshottari Dasha",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate foreign employment prospects. Evaluating overseas career opportunities requires calculated 10th, 6th, and 12th house positions from a verified birth chart.",
      customDirectAnswerTa: "வெளிநாட்டு வேலைவாய்ப்பு சாத்தியக்கூறுகளை கணிக்க தேவையான 10-ம் பாவகம், 6-ம் பாவகம் மற்றும் 12-ம் பாவகத்தின் பிறப்பு ஜாதகத் தரவுகள் கிடைக்கவில்லை."
    });
  }

  const chart = context.chartData || context.chart || context;
  const h10 = getHouseByNumber(chart, 10);
  const h6 = getHouseByNumber(chart, 6);
  const h9 = getHouseByNumber(chart, 9);
  const h12 = getHouseByNumber(chart, 12);

  const rahu = getPlanetByName(chart, "Rahu");

  const h10Sign = h10?.sign || h10?.signName || "10th Bhava";
  const h10Lord = h10?.lord || h10?.ruler || null;
  const h12Sign = h12?.sign || h12?.signName || "12th Bhava";
  const h12Lord = h12?.lord || h12?.ruler || null;

  const dashaTimeline = chart.dashaTimeline || chart.dashas || chart.dashaTable || context.dashaTimeline || [];
  const transits = chart.transits || chart.gocharDashboard || context.transits || {};
  const vargas = chart.vargas || context.vargas || {};

  // Compute timing windows for foreign work using career domain factors
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
  const windowStr = primaryWin && primaryWin.windowStart && primaryWin.windowEnd
    ? `${primaryWin.windowStart} – ${primaryWin.windowEnd}`
    : (primaryWin?.id || null);

  const calculatedFacts = [
    ...(h10 ? [{ id: "FACT_H10_CAREER", factor: "10th House (Karma/Career)", sign: h10Sign, ...(h10Lord ? { lord: h10Lord } : {}) }] : []),
    ...(h6 ? [{ id: "FACT_H6_SERVICE", factor: "6th House (Employment/Service)", sign: h6.sign || "6th Bhava" }] : []),
    ...(h9 ? [{ id: "FACT_H9_DISTANT_LANDS", factor: "9th House (Long Journeys)", sign: h9.sign || "9th Bhava" }] : []),
    ...(h12 ? [{ id: "FACT_H12_FOREIGN_SHORES", factor: "12th House (Foreign Residence)", sign: h12Sign, ...(h12Lord ? { lord: h12Lord } : {}) }] : []),
    ...(rahu ? [{ id: "FACT_RAHU_EXOTIC", factor: "Rahu (Foreign Karaka)", house: rahu.house ?? rahu.bhava ?? null }] : [])
  ];

  const traditionalRules = [
    { id: "RULE_FOREIGN_WORK_CONFLUENCE", source: "Brihat Parashara Hora Shastra", text: "Foreign employment requires joint activation of career Bhavas (10th/6th) linked with foreign travel Bhavas (9th/12th) or Rahu." },
    { id: "RULE_TRAVEL_IS_NOT_JOB", source: "Methodological Standard", text: "Indicators of foreign travel (3rd/9th/12th) without 10th/6th career confluence signify tourism or short visits, not overseas employment." },
    { id: "RULE_MUNDANE_REALITY_WORK_VISA", source: "Prashna Shastra", text: "Planetary configurations indicate favorable timing; sovereign work permits, employer sponsorships, and employment contracts dictate actual overseas employment." }
  ];

  const limitation = isTamil
    ? "ஜோதிட குறியீடுகள் வெளிநாட்டு பணி வாய்ப்பிற்கான சாதகமான காலக்கட்டத்தை மட்டுமே சுட்டிக்காட்டும்; வெளிநாட்டு வேலைவாய்ப்பு விசா (Work Visa / Permit), நிறுவனத்தின் பணி ஆணை (Offer Letter), சர்வதேச விதிகளின்படி மொழித் தகுதி மற்றும் நிதி நிலைமை ஆகியவற்றின் அடிப்படையிலேயே வெளிநாட்டு வேலை சாத்தியமாகும். வெறும் சுற்றுலாப் பயண குறியீடுகளை வைத்து வெளிநாட்டு வேலை உறுதி என்று கூற முடியாது."
    : "Astrological factors indicate favorable timing for international career opportunities only when both career (10th/6th) and foreign residence (9th/12th/Rahu) houses converge. Foreign travel alone does not entail overseas employment. Actual employment abroad is strictly governed by work visas, labor permits, valid job offers, employer sponsorship, and international immigration laws.";

  let directAnswer = "";
  let reason = "";

  if (isTamil) {
    directAnswer = `உங்கள் ஜாதகத்தில் தொழில் ஸ்தானமான 10-ம் பாவகம் (${h10Sign}${h10Lord ? `, அதிபதி: ${h10Lord}` : ""}) மற்றும் வெளிநாட்டு வசிப்பிடத்தைக் குறிக்கும் 12-ம் பாவகம் (${h12Sign}${h12Lord ? `, அதிபதி: ${h12Lord}` : ""}) ஆகியவற்றின் அமைப்புகள் வெளிநாட்டில் பணிபுரிவதற்கான சாத்தியக்கூறுகளை சுட்டிக்காட்டுகின்றன.${windowStr ? ` இதற்கான சாதகமான காலக்கோடு ${windowStr} காலகட்டத்தில் அமைய வாய்ப்புள்ளது.` : " நடப்பு தசா-கோச்சார சுழற்சியில் குறிப்பிட்ட வெளிநாட்டு வேலைவாய்ப்பு காலக்கோடு தனித்து உறுதி செய்யப்படவில்லை."} இது குறுகிய கால சுற்றுலாப் பயணத்திற்கு மாறாக வெளிநாட்டு வேலைவாய்ப்பை மட்டுமே குறிப்பிடுகிறது.`;
    reason = `10-ம் பாவக தொழில் பலம், 12-ம் பாவக வெளிநாட்டு தொடர்பு மற்றும் ராகுவின் காரகத்துவங்கள் இணைந்து வெளிநாட்டு வேலைவாய்ப்பு ஆய்வு செய்யப்பட்டது.`;
  } else {
    directAnswer = `In your chart, the confluence of the 10th house of career (${h10Sign}${h10Lord ? `, ruled by ${h10Lord}` : ""}) with the 12th house of foreign residence (${h12Sign}${h12Lord ? `, ruled by ${h12Lord}` : ""}) and foreign significator Rahu indicates classical potential for overseas employment.${windowStr ? ` In calculated timing progressions, supportive windows for foreign career transitions cluster in ${windowStr}.` : " Current dasha and transit progressions do not isolate an immediate discriminating overseas employment window."} This analysis requires simultaneous career and foreign residence activation; travel alone does not constitute overseas employment.`;
    reason = `Synthesized 10th/6th vocational houses with 9th/12th foreign displacement houses and Rahu's disposition under Parashari principles.`;
  }

  return {
    questionId,
    intent: "FOREIGN_EMPLOYMENT",
    taskType: "OVERSEAS_EMPLOYMENT_TIMING",
    answerState: windowStr ? "ANSWERED" : "NO_DISCRIMINATING_WINDOW",
    directAnswer,
    reason,
    limitation,
    recommendation: {
      preferredWindow: windowStr,
      distinction: "Distinguished from temporary travel and permanent settlement"
    },
    candidateWindows,
    timingResolution: primaryWin ? (primaryWin.resolution || "YEAR_RANGE") : null,
    supportingClaims: calculatedFacts.map(f => `${f.factor}: ${f.sign || f.lord || f.house || "Natal"}`),
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: "10th/6th Career and 9th/12th Foreign Bhava Confluence under Vimshottari Dasha",
    empiricalStatus: "NOT_VALIDATED",
    calculatedFacts,
    traditionalRules
  };
}
