/**
 * SKR ASTRO — Wealth Accumulation & Financial Decision Evaluator
 * ===============================================================
 * Evaluates financial decision questions:
 * 1. Aggressive Investment & Capital Allocation (Path A: ACTIVE_INVESTMENT)
 * 2. Capital Preservation, Debt Clearance & Liquidity Buffers (Path B: CAPITAL_PRESERVATION)
 *
 * Grounded in 2nd, 5th, 8th, 9th, 11th, and 12th Bhavas, D2 Hora, and Jupiter/Venus Karakas.
 * Strictly enforces statutory financial disclaimers.
 */

import { hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

export function evaluateWealthAccumulationDecision({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_WEALTH_ACCUMULATION_DECISION";

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "WEALTH_ACCUMULATION_DECISION",
      taskType: "FINANCIAL_DECISION_EVALUATION",
      isTamil,
      missingInputs: ["birthChart", "planetaryPositions"],
      traditionalMethod: "2nd/11th/5th/8th Bhavas, Jupiter & Venus Dhana Synthesis",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate financial capital allocation. A verified birth chart with calculated 2nd and 11th houses is required to assess traditional wealth indicators.",
      customDirectAnswerTa: "நிதி முதலீடு அல்லது சேமிப்பு தொடர்பான ஜோதிட மதிப்பீட்டிற்கு தேவையான பிறப்பு ஜாதகத் தரவுகள் கிடைக்கவில்லை."
    });
  }
  const raw = String(question || "").toLowerCase();

  const isInvestExplicit = /\b(invest|investment|stocks|trading|mutual\s+fund|crypto|real\s+estate\s+investment|முதலீடு|பங்குச்சந்தை)\b/i.test(raw);
  const isPreserveExplicit = /\b(save|savings|debt|loan|clear\s+debt|preserve|reserve|emergency\s+fund|கடன்|சேமிப்பு|கடன்\s*அடைக்க)\b/i.test(raw);
  const isComparative = (isInvestExplicit && isPreserveExplicit) || /(?:invest.*or.*save|save.*or.*invest|invest.*or.*clear.*debt|முதலீடு.*அல்லது.*சேமிப்பு|சேமிப்பதா.*முதலீடா)/i.test(raw);

  const activeInvestmentAnalysis = {
    category: "ACTIVE_INVESTMENT",
    titleEn: "Active Investment & Capital Allocation (Wealth Compounding)",
    titleTa: "முதலீடுகள் மற்றும் மூலதன பெருக்கம் (செல்வ வளர்ச்சி)",
    astrologicalHouses: [5, 9, 11],
    keyPlanets: ["Jupiter", "Mercury", "Venus"],
    prosEn: "Potential inflation-beating asset growth, compounding returns, dividend or rental yields",
    prosTa: "பணவீக்கத்தை விஞ்சிய மூலதன வளர்ச்சி, கூட்டு வட்டி பலன், நீண்டகால சொத்து உருவாக்கம்",
    consEn: "Market downside volatility, capital lock-in, liquidity constraints during emergencies",
    consTa: "சந்தை ஏற்ற இறக்க அபாயம், முதலீடு முடங்கும் வாய்ப்பு, அவசர கால பணப்புழக்க சிரமம்",
    limitationEn: "Planetary indicators of gains (11th house) do not protect against market risk or asset bubbles.",
    limitationTa: "ஜோதிட அமைப்புகள் சந்தை இழப்புகளுக்கு எதிரான காப்பீடு அல்ல; முதலீட்டு முடிவுகளில் நிபுணர் ஆலோசனை அவசியம்."
  };

  const capitalPreservationAnalysis = {
    category: "CAPITAL_PRESERVATION",
    titleEn: "Capital Preservation, Debt Clearance & Liquidity Buffers",
    titleTa: "மூலதன பாதுகாப்பு, கடன் தீர்த்தல் மற்றும் ரொக்க இருப்பு",
    astrologicalHouses: [2, 8, 12],
    keyPlanets: ["Saturn", "Sun"],
    prosEn: "Guaranteed interest savings from debt retirement, unshakeable peace of mind, immediate liquidity",
    prosTa: "கடன் வட்டி சேமிப்பு, உடனடி பணப்புழக்கம், மன அமைதி மற்றும் பொருளாதார ஸ்திரத்தன்மை",
    consEn: "Cash drag against inflation, opportunity cost of missed asset rallies",
    consTa: "பணவீக்கத்தால் பணமதிப்பு குறைதல், சிறந்த சந்தை வாய்ப்புகளை இழக்கும் வாய்ப்பு",
    limitationEn: "Excessive cash hoarding without structured fixed-yield planning diminishes real purchasing power.",
    limitationTa: "பணத்தை சும்மா வைத்திருப்பது அதன் வாங்கும் திறனைக் குறைக்கும்; பாதுகாப்பான சேமிப்பு திட்டங்கள் தேவை."
  };

  // Inspect context for operating Dasha / 2nd/11th/8th indicators if available
  const activePlanets = context?.activePlanets || context?.chart?.activePlanets || [];
  const activeHouses = context?.activeHouses || context?.chart?.activeHouses || [];
  const hasDebtOrExpensePressure = activeHouses.includes(8) || activeHouses.includes(12) || activePlanets.includes("Rahu") || activePlanets.includes("Saturn");
  const hasGainsSynergy = activeHouses.includes(2) && activeHouses.includes(11) && (activePlanets.includes("Jupiter") || activePlanets.includes("Venus"));

  // Statutory Financial Disclaimer
  const statutoryNotice = {
    en: "STATUTORY FINANCIAL NOTICE: Astrological evaluations describe symbolic traditional archetypes and cyclical indicators. They NEVER constitute financial, investment, tax, or accounting advice. Always consult a certified financial advisor before deploying capital.",
    ta: "சட்டப்பூர்வ நிதி அறிவிப்பு: ஜோதிட குறிப்புகள் பாரம்பரிய போக்குகளை மட்டுமே விவரிக்கின்றன. இது ஒருபோதும் நிதி அல்லது முதலீட்டு ஆலோசனை அல்ல. நிதி முதலீடுகளுக்கு உரிமம் பெற்ற நிதி ஆலோசகரை அணுகவும்."
  };

  // If asking specifically about investing only
  if (!isInvestExplicit && isPreserveExplicit && !isComparative) {
    const directAnswer = isTamil
      ? "கடன் தீர்த்தல் மற்றும் அவசரகால சேமிப்பை உருவாக்குவது உங்கள் 2-ம் பாவகம் (சேமிப்பு) மற்றும் 8/12-ம் பாவகங்களின் (விரய மேலாண்மை) சமநிலையை பலப்படுத்துகிறது."
      : "Prioritizing debt reduction and liquidity buffers aligns with strengthening your 2nd house of savings and neutralizing 8th/12th house liability pressures.";

    const reason = isTamil
      ? `நன்மைகள்: ${capitalPreservationAnalysis.prosTa}.\nசவால்கள்: ${capitalPreservationAnalysis.consTa}.`
      : `Advantages: ${capitalPreservationAnalysis.prosEn}.\nRisks & Considerations: ${capitalPreservationAnalysis.consEn}.`;

    return {
      questionId,
      intent: "WEALTH_ACCUMULATION_DECISION",
      decisionType: "CAPITAL_PRESERVATION",
      answerState: "ANSWERED",
      directAnswer,
      reason,
      limitation: capitalPreservationAnalysis.limitationEn,
      recommendation: {
        preferredPath: "CAPITAL_PRESERVATION",
        pros: capitalPreservationAnalysis.prosEn,
        cons: capitalPreservationAnalysis.consEn
      },
      supportingClaims: [
        "2nd House (Dhana Bhava) stability and 12th House (Expense control) discipline",
        "Elimination of high-interest borrowing liabilities"
      ],
      limitingClaims: [capitalPreservationAnalysis.limitationEn, statutoryNotice.en],
      missingInputs: [],
      traditionalMethod: "2nd & 12th Bhavas, Saturnian Financial Discipline, D2 Hora",
      statutoryNotice,
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  if (isInvestExplicit && !isPreserveExplicit && !isComparative) {
    const directAnswer = isTamil
      ? "புதிய முதலீடுகளில் மூலதனத்தை ஈடுபடுத்துவது 5-ம் பாவகம் (அறிவார்ந்த முதலீடு), 9-ம் பாவகம் (பாக்யம்) மற்றும் 11-ம் பாவகத்தின் (வருவாய் பெருக்கம்) ஒருங்கிணைவை அடிப்படையாகக் கொண்டது."
      : "Deploying capital into wealth-compounding avenues leverages your 5th house of analytical intellect, 9th house of fortune, and 11th house of recurrent gains.";

    const reason = isTamil
      ? `நன்மைகள்: ${activeInvestmentAnalysis.prosTa}.\nசவால்கள்: ${activeInvestmentAnalysis.consTa}.`
      : `Advantages: ${activeInvestmentAnalysis.prosEn}.\nRisks & Considerations: ${activeInvestmentAnalysis.consEn}.`;

    return {
      questionId,
      intent: "WEALTH_ACCUMULATION_DECISION",
      decisionType: "ACTIVE_INVESTMENT",
      answerState: "ANSWERED",
      directAnswer,
      reason,
      limitation: activeInvestmentAnalysis.limitationEn,
      recommendation: {
        preferredPath: "ACTIVE_INVESTMENT",
        pros: activeInvestmentAnalysis.prosEn,
        cons: activeInvestmentAnalysis.consEn
      },
      supportingClaims: [
        "5th & 11th House axis of strategic capital compounding",
        "Jupiter and Mercury significations for diversified growth"
      ],
      limitingClaims: [activeInvestmentAnalysis.limitationEn, statutoryNotice.en],
      missingInputs: [],
      traditionalMethod: "5th, 9th, and 11th Bhavas, Jupiter Dhana Yoga, D2 Hora",
      statutoryNotice,
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // Default: Comparative Analysis (Should I invest or preserve/clear debts?)
  const directAnswer = isTamil
    ? "முதலீடுகள் மூலம் மூலதனத்தை பெருக்குவதா (பாதை A) அல்லது கடன்களை அடைத்து ரொக்க இருப்பை பாதுகாப்பதா (பாதை B) என்பதை தீர்மானிக்க இரு பாதைகளின் நிதி சமநிலையை பரிசீலிக்க வேண்டும்."
    : "Navigating between active capital investment for long-term growth (Path A) versus aggressive debt liquidation and liquidity buffering (Path B) requires balancing compounding opportunity against risk insulation.";

  const reason = isTamil
    ? `[பாதை A - முதலீடுகள்]: ${activeInvestmentAnalysis.prosTa}. சவால்: ${activeInvestmentAnalysis.consTa}.\n\n` +
      `[பாதை B - மூலதன பாதுகாப்பு & கடன் தீர்த்தல்]: ${capitalPreservationAnalysis.prosTa}. சவால்: ${capitalPreservationAnalysis.consTa}.`
    : `[Path A - Active Investment]: ${activeInvestmentAnalysis.prosEn}. Risk: ${activeInvestmentAnalysis.consEn}.\n\n` +
      `[Path B - Capital Preservation & Debt Retirement]: ${capitalPreservationAnalysis.prosEn}. Risk: ${capitalPreservationAnalysis.consEn}.`;

  const preferredPath = hasDebtOrExpensePressure && !hasGainsSynergy
    ? "CAPITAL_PRESERVATION"
    : (hasGainsSynergy ? "ACTIVE_INVESTMENT" : "BALANCED_PORTFOLIO");

  return {
    questionId,
    intent: "WEALTH_ACCUMULATION_DECISION",
    decisionType: "COMPARATIVE_ANALYSIS",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation: isTamil
      ? `${statutoryNotice.ta}\n\nஜோதிட குறியீடுகள் பாரம்பரிய போக்குகளை மட்டுமே சுட்டிக்காட்டுகின்றன; நிதி முடிவுகள் எப்போதும் உங்கள் கடன் சுமை, மாதாந்திர செலவுகள் மற்றும் அவசர நிதியைப் பொறுத்தே அமைய வேண்டும்.`
      : `${statutoryNotice.en}\n\nAstrological indications represent traditional archetypes; actual deployment must always be governed by emergency liquidity reserves, personal risk tolerance, and audited financial health. Always consult a licensed financial advisor.`,
    recommendation: {
      preferredPath,
      pathA: activeInvestmentAnalysis,
      pathB: capitalPreservationAnalysis
    },
    supportingClaims: [
      "2nd (Accumulated Wealth) and 11th (Revenue Inflow) Bhavas vs 8th/12th (Liabilities/Outflow) analysis",
      "Disciplined financial architecture separating wealth generation from speculative risk"
    ],
    limitingClaims: [
      "No astrological algorithm guarantees positive investment returns or predicts asset markets.",
      statutoryNotice.en
    ],
    missingInputs: [],
    traditionalMethod: "2nd, 5th, 9th, 11th, and 12th Bhavas, Jupiter/Venus Dhana Yogas, D2 Hora",
    statutoryNotice,
    empiricalStatus: "NOT_VALIDATED"
  };
}
