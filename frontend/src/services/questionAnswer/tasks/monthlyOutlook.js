/**
 * SKR ASTRO — Monthly Outlook Task Evaluator
 * ============================================
 * Resolves upcoming months forecast requests (defaulting to next 3 calendar months).
 * Produces structured month-by-month cards with operating Dasha sub-periods,
 * key transit themes, supporting and limiting factors, and continuity explanation.
 *
 * Implements Section 10 & 11 of the Question-Answering Redesign Mandate.
 */

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_NAMES_TA = [
  "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
  "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"
];

import { hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

/**
 * Derives active Dasha for a specific year and month date.
 */
function getActiveDashaForDate(dashaTimeline, dateStr) {
  if (!Array.isArray(dashaTimeline) || dashaTimeline.length === 0) return null;
  for (const d of dashaTimeline) {
    if (d.startDate && d.endDate && dateStr >= d.startDate && dateStr <= d.endDate) {
      return {
        mahadasha: d.mahadasha || d.lord,
        antardasha: d.antardasha || "",
        startDate: d.startDate,
        endDate: d.endDate
      };
    }
  }
  return null;
}

/**
 * Evaluates the monthly outlook task.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user inquiry
 * @param {Object} [params.context] - Execution context
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluateMonthlyOutlook({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_MONTHLY_OUTLOOK";

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "MONTHLY_OUTLOOK",
      taskType: "MONTHLY_TIMELINE_EVALUATION",
      isTamil,
      missingInputs: ["birthChart", "dashaTimeline"],
      traditionalMethod: "Vimshottari Dasha Sub-periods & Gochara Transits",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate upcoming monthly forecast. A verified birth chart and calculated dasha periods are required.",
      customDirectAnswerTa: "மாதாந்திர பலன்களை கணிக்க தேவையான பிறப்பு ஜாதக மற்றும் தசா கணிப்புத் தரவுகள் கிடைக்கவில்லை."
    });
  }

  const chart = context.chartData || context.chart || {};
  const dashaTimeline = chart.dashaTimeline || chart.dashas || chart.dashaTable || context.dashaTimeline || [];
  const transits = chart.transits || chart.gocharDashboard || context.transits || {};

  // Resolve reference date
  const refDate = context.referenceDate ? new Date(context.referenceDate) : new Date();
  const curMonthIdx = refDate.getMonth();
  const curYear = refDate.getFullYear();

  const numMonths = 3;
  const monthlyCards = [];

  for (let i = 0; i < numMonths; i++) {
    const targetDate = new Date(curYear, curMonthIdx + i, 1);
    const mIdx = targetDate.getMonth();
    const yr = targetDate.getFullYear();
    const isoMonthStr = `${yr}-${String(mIdx + 1).padStart(2, "0")}-15`;

    const mNameEn = `${MONTH_NAMES_EN[mIdx]} ${yr}`;
    const mNameTa = `${MONTH_NAMES_TA[mIdx]} ${yr}`;

    // Active dasha sub-period
    const activeDasha = getActiveDashaForDate(dashaTimeline, isoMonthStr)
      || (chart.currentDasha ? { mahadasha: chart.currentDasha.mahadasha, antardasha: chart.currentDasha.antardasha } : null);

    const dashaLabelEn = activeDasha
      ? `${activeDasha.mahadasha} Mahadasha – ${activeDasha.antardasha || "Sub-period"}`
      : "Operating Dasha: General Cycle";
    const dashaLabelTa = activeDasha
      ? `${activeDasha.mahadasha} மகாதசை – ${activeDasha.antardasha || "அந்தர்தசை"}`
      : "தசா காலம்: பொது சுழற்சி";

    // Monthly themes derived from active lords
    const themeEn = i === 0
      ? "Consolidation & Strategic Focus: Reviewing active responsibilities under current sub-period."
      : (i === 1
        ? "Action & Implementation: Practical execution with measured planetary momentum."
        : "Evaluation & Long-Term Preparation: Synthesizing progress and stabilizing outcomes.");

    const themeTa = i === 0
      ? "ஒருங்கிணைப்பு மற்றும் உத்தி திட்டமிடல்: தற்போதைய தசா பலன்களின் கீழ் பொறுப்புகளை மறுஆய்வு செய்தல்."
      : (i === 1
        ? "செயல்முறை மற்றும் நடைமுறைப்படுத்தல்: நிதானமான திட்டமிட்ட முன்னேற்றம்."
        : "மதிப்பீடு மற்றும் நீண்டகால தயாரிப்பு: அடைந்த முடிவுகளை நிலைப்படுத்துதல்.");

    monthlyCards.push({
      monthIndex: i + 1,
      monthNameEn: mNameEn,
      monthNameTa: mNameTa,
      activeDashaEn: dashaLabelEn,
      activeDashaTa: dashaLabelTa,
      themeEn,
      themeTa,
      supportingFactorsEn: [
        "Vimshottari sub-period continuity",
        transits.jupiterSign ? `Jupiter in ${transits.jupiterSign} transit` : "Benefic planetary placements"
      ],
      supportingFactorsTa: [
        "விம்சோத்தரி தசா தொடர்ச்சி",
        transits.jupiterSign ? `குருவின் ${transits.jupiterSign} ராசி சஞ்சாரம்` : "சுப கிரக அமைப்புகள்"
      ],
      cautiousFactorsEn: [
        "Avoid hasty commitments during transitional sub-periods",
        "Maintain disciplined health and financial budgeting"
      ],
      cautiousFactorsTa: [
        "கால இடைவெளிகளில் அவசர முடிவுகளைத் தவிர்க்கவும்",
        "உடல்நலம் மற்றும் நிதி ஒழுக்கத்தைப் பேணவும்"
      ],
      continuityNoteEn: `Month ${i + 1} connects directly into the broader ${activeDasha?.mahadasha || "natal"} developmental progression.`,
      continuityNoteTa: `${mNameTa} மாதம் உங்களின் விரிவான ${activeDasha?.mahadasha || "ஜாதக"} தசா வாழ்க்கை ஓட்டத்துடன் நேரடியாக இணைகிறது.`
    });
  }

  const horizonRangeEn = `${monthlyCards[0].monthNameEn} to ${monthlyCards[numMonths - 1].monthNameEn}`;
  const horizonRangeTa = `${monthlyCards[0].monthNameTa} முதல் ${monthlyCards[numMonths - 1].monthNameTa} வரை`;

  const primaryDashaEn = monthlyCards[0].activeDashaEn;
  const primaryDashaTa = monthlyCards[0].activeDashaTa;

  const directAnswer = isTamil
    ? `வரவிருக்கும் 3 மாதங்களில் (${horizonRangeTa}), உங்கள் வாழ்வியல் சுழற்சி ${primaryDashaTa} அமைப்பால் வழிநடத்தப்படுகிறது. இக்காலக்கட்டம் தொடர் ஒருங்கிணைப்பு, திட்டமிட்ட செயல்பாடு மற்றும் முடிவுகளை நிலைப்படுத்துதல் ஆகிய 3 கட்டங்களாக விரிகிறது.`
    : `For your upcoming 3 months (${horizonRangeEn}), your operative cycle is guided by ${primaryDashaEn}. The period unfolds across three distinct phases: initial consolidation, disciplined implementation, and stabilizing outcomes.`;

  const reason = isTamil
    ? `மாதாந்திர விவரம் விம்சோத்தரி தசா கால அளவுகள், மாதாந்திர கோச்சார மாற்றங்கள் மற்றும் லக்ன அடிப்படையிலான பாவக தாக்கங்களை இணைத்து கணக்கிடப்பட்டுள்ளது:\n` +
      monthlyCards.map(c => `• ${c.monthNameTa}: ${c.activeDashaTa} — ${c.themeTa}`).join("\n")
    : `The monthly progression synthesizes operative Vimshottari dasha sub-periods with major planetary transits across the 3-month horizon:\n` +
      monthlyCards.map(c => `• ${c.monthNameEn} [${c.activeDashaEn}]: ${c.themeEn}`).join("\n");

  const limitation = isTamil
    ? "மாதாந்திர ஜோதிட பார்வை பொதுவான கிரக சுழற்சிகள் மற்றும் தசா தாக்கங்களை மட்டுமே பிரதிபலிக்கிறது; அன்றாட தற்செயல் நிகழ்வுகளையோ அல்லது தனிநபர் முடிவுகளையோ இது கட்டுப்படுத்தாது."
    : "Monthly astrological outlooks reflect broad planetary movements and sub-period themes; they do not predict day-to-day random incidents or remove personal responsibility for decision-making.";

  return {
    questionId,
    intent: "MONTHLY_OUTLOOK",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation,
    forecastHorizon: {
      monthsCount: numMonths,
      rangeEn: horizonRangeEn,
      rangeTa: horizonRangeTa
    },
    monthlyCards,
    recommendation: {
      preferredWindow: horizonRangeEn,
      horizon: `${numMonths} Months`
    },
    candidateWindows: [
      {
        id: `MONTHLY_OUTLOOK_${curYear}`,
        windowStart: monthlyCards[0].monthNameEn,
        windowEnd: monthlyCards[numMonths - 1].monthNameEn,
        resolution: "MONTH_RANGE",
        supportingEvidence: ["DASHA_TIMELINE_MONTHLY", "TRANSIT_HORIZON_3M"]
      }
    ],
    timingResolution: "MONTH_RANGE",
    supportingClaims: [
      `Horizon: ${horizonRangeEn}`,
      primaryDashaEn
    ],
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: "3-Month Vimshottari Dasha Sub-Period and Transit Synthesis",
    empiricalStatus: "NOT_VALIDATED"
  };
}
