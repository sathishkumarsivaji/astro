/**
 * SKR ASTRO — Marriage & Relationship Outlook Task Evaluator
 * ============================================================
 * Evaluates relationship dynamics, marital harmony, and reconciliation scope.
 * Explicitly distinguishes existing marital relationship improvement / reconciliation
 * from marriage formation timing.
 *
 * Implements strict non-negotiable rules:
 * - Fail-closed: returns INSUFFICIENT_DATA with zero calculated facts if chart data is missing.
 * - Never substitutes marriage formation timing for relationship reconciliation inquiries.
 * - Refuses guaranteed reconciliation or divorce predictions.
 * - Timing resolution: strictly null when candidate windows are absent.
 * - Analyzes 7th (partnership), 2nd (kutumba), 4th (domestic peace), Venus & Jupiter.
 */

import { computeTimingWindows } from "../timingEngine.js";
import { getHouseByNumber, getPlanetByName, hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

export function evaluateMarriageRelationshipOutlook({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_MARRIAGE_RELATIONSHIP_OUTLOOK";

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "MARRIAGE_RELATIONSHIP_OUTLOOK",
      taskType: "RELATIONSHIP_HARMONY_RECONCILIATION",
      isTamil,
      missingInputs: ["birthChart", "bhavasDetailed"],
      traditionalMethod: "7th/2nd/4th Bhava and Venus-Jupiter Synthesis under Vimshottari Dasha",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate marital relationship outlook. Assessing relational harmony requires calculated 7th house and Venus placements from a verified birth chart.",
      customDirectAnswerTa: "திருமண உறவு நல்லிணக்கத்தை மதிப்பிட தேவையான 7-ம் பாவகம் மற்றும் சுக்கிரனின் பிறப்பு ஜாதகத் தரவுகள் கிடைக்கவில்லை."
    });
  }

  const chart = context.chartData || context.chart || context;
  const h7 = getHouseByNumber(chart, 7);
  const h2 = getHouseByNumber(chart, 2);
  const h4 = getHouseByNumber(chart, 4);

  const venus = getPlanetByName(chart, "Venus");
  const jupiter = getPlanetByName(chart, "Jupiter");

  const h7Sign = h7?.sign || h7?.signName || "7th Bhava";
  const h7Lord = h7?.lord || h7?.ruler || null;
  const h2Sign = h2?.sign || h2?.signName || "2nd Bhava";
  const h4Sign = h4?.sign || h4?.signName || "4th Bhava";

  const dashaTimeline = chart.dashaTimeline || chart.dashas || chart.dashaTable || context.dashaTimeline || [];
  const transits = chart.transits || chart.gocharDashboard || context.transits || {};
  const vargas = chart.vargas || context.vargas || {};

  // Compute timing windows for relational harmony using relationship domain factors
  const timingResult = computeTimingWindows({
    domain: "marriage",
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
    ...(h7 ? [{ id: "FACT_H7_PARTNERSHIP", factor: "7th House", sign: h7Sign, ...(h7Lord ? { lord: h7Lord } : {}) }] : []),
    ...(h2 ? [{ id: "FACT_H2_KUTUMBA", factor: "2nd House", sign: h2Sign }] : []),
    ...(h4 ? [{ id: "FACT_H4_DOMESTIC_HARMONY", factor: "4th House", sign: h4Sign }] : []),
    ...(venus ? [{ id: "FACT_VENUS_KARAKA", factor: "Venus", dignity: venus.dignity || "NATAL" }] : []),
    ...(jupiter ? [{ id: "FACT_JUPITER_BENEFIC", factor: "Jupiter", dignity: jupiter.dignity || "NATAL" }] : [])
  ];

  const traditionalRules = [
    { id: "RULE_7TH_HOUSE_PARTNERSHIP", source: "Brihat Parashara Hora Shastra", text: "7th house and its lord govern marital partnership, spousal rapport, and reciprocity." },
    { id: "RULE_2ND_4TH_DOMESTIC_PEACE", source: "Phaladeepika", text: "2nd house represents family cohesion (Kutumba) and 4th house signifies emotional contentment (Sukha Bhava)." },
    { id: "RULE_BENEFIC_ASPECT_RECONCILIATION", source: "Jataka Parijata", text: "Jupiter's aspect or benign dasha period mitigates temporary estrangement and promotes mutual understanding." }
  ];

  let directAnswer = "";
  let reason = "";
  const limitation = isTamil
    ? "ஜோதிட குறியீடுகள் நல்லிணக்கத்திற்கான சாதகமான காலகட்டங்களை மட்டுமே சுட்டிக்காட்டும்; தனிப்பட்ட உரையாடல், வெளிப்படையான மனநிலை, பரஸ்பர விட்டுக்கொடுத்தல் மற்றும் தேவைப்பட்டால் தொழில்முறை குடும்ப ஆலோசனை ஆகியவற்றின் மூலமே உறவின் அமைதி நடைமுறையில் சாத்தியமாகும். திருமண முறிவு அல்லது கட்டாய சமரசம் எதையும் ஜோதிடம் உத்திரவாதம் செய்யாது."
    : "Astrological factors delineate qualitative relational rhythms and periods opportune for constructive dialogue; interpersonal communication, emotional maturity, mutual compromise, and professional marital counseling govern actual relationship outcomes. Neither permanent reconciliation nor separation can be guaranteed.";

  if (isTamil) {
    directAnswer = `உங்கள் ஜாதகத்தில் 7-ம் பாவகம் (${h7Sign}${h7Lord ? `, அதிபதி: ${h7Lord}` : ""}), குடும்பத்தை குறிக்கும் 2-ம் பாவகம் மற்றும் மன அமைதியை குறிக்கும் 4-ம் பாவகத்தின் நிலைகளின்படி, உறவில் எழும் சிக்கல்களை பேசித் தீர்ப்பதற்கும் பரஸ்பர புரிதலை மேம்படுத்துவதற்கும் பாரம்பரிய ஜோதிட அமைப்புகள் வழிகாட்டுகின்றன.${windowStr ? ` குறிப்பாக ${windowStr} காலகட்டம் பரஸ்பர பேச்சுவார்த்தைக்கும் சமரசத்திற்கும் அதிக சாதகமான காலக்கட்டமாக அமைகிறது.` : " நடப்பு தசா-கோச்சார சுழற்சியில் அமைதியுடன் கூடிய விவேகமான அணுகுமுறை தேவைப்படுகிறது."} இது ஏற்கனவே உள்ள உறவின் நல்லிணக்க ஆய்வு மட்டுமே; புதிய திருமண அமைப்பிற்கு இது பொருந்தாது.`;
    reason = `7-ம் பாவக அமைப்பு, களத்திரகாரகன் சுக்கிரன் மற்றும் குடும்ப ஸ்தானங்களின் நிலைகள் ஆராயப்பட்டு உறவு நல்லிணக்க சாத்தியங்கள் தொகுக்கப்பட்டன.`;
  } else {
    directAnswer = `In your chart, the 7th house (${h7Sign}${h7Lord ? `, ruled by ${h7Lord}` : ""}), the 2nd house of family harmony, and the 4th house of domestic contentment indicate potential for resolving relationship tensions through deliberate communication.${windowStr ? ` In operative timing analysis, supportive horizons for constructive dialogue and rapprochement cluster in ${windowStr}.` : " Operative dasha periods counsel patient communication rather than impulsive confrontation."} This analysis specifically addresses existing marital/relational harmony and reconciliation, not marriage formation timing.`;
    reason = `Synthesized 7th house partnership disposition, 2nd house kutumba factors, and 4th house domestic harmony under traditional Parashari principles.`;
  }

  return {
    questionId,
    intent: "MARRIAGE_RELATIONSHIP_OUTLOOK",
    taskType: "RELATIONSHIP_HARMONY_RECONCILIATION",
    answerState: windowStr ? "ANSWERED" : "NO_DISCRIMINATING_WINDOW",
    directAnswer,
    reason,
    limitation,
    recommendation: {
      preferredWindow: windowStr,
      focusAreas: isTamil ? ["குடும்ப உரையாடல்", "விட்டுக்கொடுத்தல்", "பொறுமை"] : ["Constructive dialogue", "Mutual compromise", "Patience"]
    },
    candidateWindows,
    timingResolution: primaryWin ? (primaryWin.resolution || "YEAR_RANGE") : null,
    supportingClaims: calculatedFacts.map(f => `${f.factor} in ${f.sign || f.dignity || "Natal"}`),
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: "7th/2nd/4th Bhava and Venus-Jupiter Synthesis under Vimshottari Dasha",
    empiricalStatus: "NOT_VALIDATED",
    calculatedFacts,
    traditionalRules
  };
}
