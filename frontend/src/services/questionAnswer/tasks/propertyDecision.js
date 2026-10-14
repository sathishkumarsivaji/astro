/**
 * ASTROVERSE — Property Decision Evaluator: Buy vs Build
 * ========================================================
 * Evaluates compound property inquiries such as:
 * "Will I buy a house or build a house?"
 * "வீடு வாங்குவதா அல்லது கட்டுவதா?"
 *
 * Distinctly separates and compares:
 * 1. Buying an Existing House / Apartment (BUY_EXISTING_PROPERTY)
 * 2. Constructing a House from Foundation (BUILD_HOUSE)
 *
 * Implements Section 10 & 11 of the Question-Answering Mandate.
 * Explicitly states when available astrological evidence cannot distinguish them.
 */

/**
 * Evaluates the comparative property decision: Buy vs Build.
 *
 * @param {Object} params
 * @param {string} params.question - User question
 * @param {Object} [params.context] - Execution context
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluatePropertyBuyVsBuildDecision({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_PROPERTY_BUY_VS_BUILD";

  const chart = context.chartData || context.chart || {};
  const planets = Array.isArray(chart.planets) ? chart.planets : [];
  const pMap = {};
  for (const p of planets) {
    if (p.name || p.planetName) pMap[p.name || p.planetName] = p;
  }

  const mars = pMap["Mars"] || {};
  const venus = pMap["Venus"] || {};
  const saturn = pMap["Saturn"] || {};

  // Alternative Profiles
  const buyExistingAnalysis = {
    category: "BUY_EXISTING_PROPERTY",
    titleEn: "Buying a Ready-Built House / Flat",
    titleTa: "கட்டிய வீடு அல்லது அடுக்குமாடி குடியிருப்பு வாங்குதல்",
    astrologicalFactorsEn: "4th house (residence/comfort), Venus (aesthetic structures, immediate living ease), 2nd/11th houses (liquid asset readiness)",
    astrologicalFactorsTa: "4-ம் பாவகம் (குடியிருப்பு சுகம்), சுக்கிரன் (கட்டிய வீட்டின் வசதிகள், அழகு), 2 மற்றும் 11-ம் பாவகங்கள் (நிதி இருப்பு)",
    prosEn: "Immediate occupancy, locked purchase valuation, absence of contractor delays or construction risks",
    prosTa: "உடனடி குடியேற்றம், நிலையான விலை, கட்டுமான தாமதங்கள் அல்லது மேற்பார்வை பணிச்சுமை இன்மை",
    consEn: "Less architectural customization, substantial upfront down-payment, established layout limitations",
    consTa: "விருப்பத்திற்கேற்ப மாற்ற இயலாமை, ஆரம்பத்திலேயே மொத்த நிதி தேவை",
    limitationsEn: "Astrological markers signify residential suitability; mortgage eligibility, property titles, and neighborhood infrastructure determine actual purchase viability.",
    limitationsTa: "ஜாதகம் குடியிருப்பு யோகத்தை மட்டுமே காட்டும்; வங்கி கடன் அனுமதி, வில்லங்க சான்றிதழ் மற்றும் உள்ளூர் வசதிகளே நிஜமான முடிவை தீர்மானிக்கும்."
  };

  const buildHouseAnalysis = {
    category: "BUILD_HOUSE",
    titleEn: "Constructing a House from Foundation",
    titleTa: "நிலம் வாங்கி புதிய வீடு கட்டுதல்",
    astrologicalFactorsEn: "4th house (land/residence), Mars (Bhumi Karaka - soil, bricks, structural foundation), Saturn (labor execution, endurance)",
    astrologicalFactorsTa: "4-ம் பாவகம், செவ்வாய் (பூமி காரகன் - நிலம், செங்கல், அஸ்திவாரம்), சனி (உழைப்பு, கட்டுமான பணித்திறன்)",
    prosEn: "Full architectural customization, staged financial capital deployment, tailored long-term family living",
    prosTa: "முழு சுயவிருப்ப வடிவமைப்பு, தவணை முறையில் நிதி செலவு, நீண்டகால குடும்ப தேவைக்கேற்ற திட்டமிடல்",
    consEn: "Vulnerability to material cost escalation, contractor coordination challenges, municipal approval delays",
    consTa: "கட்டுமான பொருட்கள் விலை உயர்வு, ஒப்பந்ததாரர் ஒருங்கிணைப்பு சவால்கள், அரசு வரைபட அனுமதி தாமதங்கள்",
    limitationsEn: "Planetary endurance indicators do not eliminate municipal permit delays, structural engineering requirements, or contractor execution variances.",
    limitationsTa: "ஜாதக பலம் மட்டுமே கட்டிடத்தை கட்டிவிடாது; பொறியியல் உறுதிப்பாடு, வரைபட அனுமதி மற்றும் நிதி ஒழுங்கே கட்டுமானத்தை நிறைவு செய்யும்."
  };

  // Evaluate if chart strongly discriminates between the two
  let discriminationState = "EQUALLY_FEASIBLE"; // "FAVORS_BUYING" | "FAVORS_BUILDING" | "EQUALLY_FEASIBLE"
  let discriminationReasonEn = "";
  let discriminationReasonTa = "";

  const marsIn4th = mars.house === 4;
  const venusIn4th = venus.house === 4;
  const saturnIn4th = saturn.house === 4;

  if (venusIn4th && !marsIn4th && !saturnIn4th) {
    discriminationState = "FAVORS_BUYING";
    discriminationReasonEn = "Venus placed directly in the 4th house emphasizes ready residential luxury and comfort over raw brickwork construction.";
    discriminationReasonTa = "4-ம் பாவகத்தில் சுக்கிரன் அமர்ந்துள்ளதால், உழைப்பு மிகுந்த கட்டுமானத்தை விட கட்டிய வீடு அல்லது அடுக்குமாடி குடியிருப்பு வாங்குவது சாதகமாக உள்ளது.";
  } else if ((marsIn4th || saturnIn4th) && !venusIn4th) {
    discriminationState = "FAVORS_BUILDING";
    discriminationReasonEn = "Mars/Saturn direct connection to the 4th house aligns with physical foundation labor, land development, and custom brickwork construction.";
    discriminationReasonTa = "4-ம் பாவகத்தில் செவ்வாய்/சனி தொடர்பு உள்ளதால், பூமி அஸ்திவாரம் அமைத்து சொந்தமாக வீடு கட்டும் அமைப்புக்கு சாதகமாக உள்ளது.";
  } else {
    discriminationState = "EQUALLY_FEASIBLE";
    discriminationReasonEn = "The available chart evidence does not conclusively distinguish between buying a ready home versus building from scratch, as both paths share the same core 4th-house residential indicators.";
    discriminationReasonTa = "ஜாதகக் குறியீடுகள் பொதுவான குடியிருப்பு யோகத்தை ஆதரிக்கின்றன; ஆனால் கட்டிய வீடு வாங்குவதா அல்லது நிலம் வாங்கி வீடு கட்டுவதா என்பதை தனித்து பிரித்துக்காட்டும் அளவிற்கு கிரக நிலைகளில் அறுதியான வேறுபாடு இல்லை.";
  }

  // Construct Direct Answer
  let directAnswer = "";
  if (isTamil) {
    if (discriminationState === "FAVORS_BUYING") {
      directAnswer = `உங்கள் ஜாதகத்தில் 4-ம் பாவகத்தில் சுக்கிரனின் ஆதிக்கம் காரணமாக, புதிய வீடு கட்டுவதை விட கட்டிய வீடு அல்லது தயாரான குடியிருப்பை வாங்குவது (Buy an existing house) ஒப்பீட்டளவில் அதிக சாதகமாக உள்ளது.`;
    } else if (discriminationState === "FAVORS_BUILDING") {
      directAnswer = `உங்கள் ஜாதகத்தில் பூமி காரகன் செவ்வாய் மற்றும் 4-ம் பாவக தொடர்பு காரணமாக, தயாரான வீட்டை வாங்குவதை விட நிலம் வாங்கி சொந்தமாக வீடு கட்டுவது (Build a house) ஒப்பீட்டளவில் அதிக சாதகமாக உள்ளது.`;
    } else {
      directAnswer = `வீடு வாங்குவதா அல்லது கட்டுவதா என்ற கேள்விக்கு உங்கள் ஜாதகத்தில் இரண்டுக்குமே சாதகமான அடிப்படை அமைப்புகள் உள்ளன; ஆனால் ஜோதிடக் கணிதம் இவை இரண்டில் ஒன்றை மட்டுமே உறுதியாகத் தேர்ந்தெடுக்க போதுமான தனித்துவமான வேறுபாட்டைக் காட்டவில்லை. நடைமுறை நிதி நிலை மற்றும் நேரடி மேற்பார்வை வசதியே இதை முடிவு செய்ய வேண்டும்.`;
    }
  } else {
    if (discriminationState === "FAVORS_BUYING") {
      directAnswer = `Evaluating both alternatives reveals that purchasing an existing home or flat is comparatively more supported by your chart factors than constructing from scratch, primarily due to supportive 4th-house Venus indications.`;
    } else if (discriminationState === "FAVORS_BUILDING") {
      directAnswer = `Evaluating both alternatives reveals that constructing your own house is comparatively more supported by your chart factors, primarily due to strong Bhumi Karaka Mars involvement with the 4th house axis.`;
    } else {
      directAnswer = `Evaluating both alternatives indicates that your chart supports general residential property acquisition, but the astrological evidence cannot conclusively distinguish between buying a ready-built home versus constructing from scratch. Both options share the same 4th-house significators, so practical feasibility must guide your decision.`;
    }
  }

  const reason = isTamil
    ? [
        `1. கட்டிய வீடு வாங்குதல் (Buying Existing Home): ${buyExistingAnalysis.prosTa}. சாத்தியக்கூறு: ${buyExistingAnalysis.astrologicalFactorsTa}.`,
        `2. சொந்தமாக வீடு கட்டுதல் (Building from Foundation): ${buildHouseAnalysis.prosTa}. சாத்தியக்கூறு: ${buildHouseAnalysis.astrologicalFactorsTa}.`,
        `ஒப்பீட்டு முடிவு: ${discriminationReasonTa}`
      ].join("\n• ")
    : [
        `1. Buying an Existing Home: ${buyExistingAnalysis.prosEn}. Astrological alignment: ${buyExistingAnalysis.astrologicalFactorsEn}.`,
        `2. Constructing a House: ${buildHouseAnalysis.prosEn}. Astrological alignment: ${buildHouseAnalysis.astrologicalFactorsEn}.`,
        `Comparative Determination: ${discriminationReasonEn}`
      ].join("\n• ");

  const limitation = isTamil
    ? "ஜோதிடக் கணிதம் குடியிருப்பு யோகத்தை மட்டுமே காட்டுகிறது; தயாரிப்பு சந்தை மதிப்பு, வங்கி கடன் அனுமதி, ஆவணங்களின் சட்டப்பூர்வ உண்மைத்தன்மை மற்றும் கட்டுமான ஒப்பந்ததாரர் நம்பகத்தன்மையே இறுதி முடிவை வழிநடத்த வேண்டும்."
    : "Astrological indications reflect traditional residential potential only; clear title deeds, bank loan authorizations, material budgeting, and architectural approvals determine real-world execution.";

  return {
    questionId,
    intent: "PROPERTY_BUY_VS_BUILD_DECISION",
    decisionType: "COMPARATIVE_PROPERTY_DECISION",
    discriminationState,
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation,
    recommendation: {
      paths: [
        {
          path: "BUY_EXISTING_PROPERTY",
          title: isTamil ? buyExistingAnalysis.titleTa : buyExistingAnalysis.titleEn,
          pros: isTamil ? buyExistingAnalysis.prosTa : buyExistingAnalysis.prosEn,
          cons: isTamil ? buyExistingAnalysis.consTa : buyExistingAnalysis.consEn
        },
        {
          path: "BUILD_HOUSE",
          title: isTamil ? buildHouseAnalysis.titleTa : buildHouseAnalysis.titleEn,
          pros: isTamil ? buildHouseAnalysis.prosTa : buildHouseAnalysis.prosEn,
          cons: isTamil ? buildHouseAnalysis.consTa : buildHouseAnalysis.consEn
        }
      ],
      discriminationReason: isTamil ? discriminationReasonTa : discriminationReasonEn
    },
    supportingClaims: isTamil ? [
      `கட்டிய வீடு வாங்கும் வாய்ப்பு: ${buyExistingAnalysis.astrologicalFactorsTa}`,
      `வீடு கட்டும் வாய்ப்பு: ${buildHouseAnalysis.astrologicalFactorsTa}`,
      discriminationReasonTa
    ] : [
      `Buying Option: ${buyExistingAnalysis.astrologicalFactorsEn}`,
      `Building Option: ${buildHouseAnalysis.astrologicalFactorsEn}`,
      discriminationReasonEn
    ],
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: isTamil
      ? "4-ம் பாவகம், செவ்வாய் (பூமி/அஸ்திவாரம்) மற்றும் சுக்கிரன் (சுகம்/குடியிருப்பு) ஒப்பீட்டு ஆய்வு"
      : "Comparative 4th Bhava, Mars (Bhumi/Structural) vs Venus (Sukha/Vastu) Synthesis",
    empiricalStatus: "NOT_VALIDATED"
  };
}
