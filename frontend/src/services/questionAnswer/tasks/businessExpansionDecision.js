/**
 * SKR ASTRO — Business Decision & Expansion Evaluator
 * ======================================================
 * Evaluates business expansion vs starting a new business venture.
 * Clearly separates:
 * 1. Starting a New Business (Path A: NEW_BUSINESS / Diversification)
 * 2. Expanding an Existing Enterprise (Path B: BRANCH_EXPANSION / Scaling)
 *
 * Implements Section 5C & Section 6 of the User-Facing Task Answering Mandate.
 */

import { hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

/**
 * Evaluates the business decision task with distinct comparative paths.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user question
 * @param {Object} [params.context] - Execution context
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluateBusinessExpansionDecision({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_BUSINESS_DECISION";
  const raw = String(question || "").toLowerCase();

  const isBranchExplicit = /\b(branch|store|location|outlet|second\s+office|another\s+branch|அலுவலகம்|கிளை)\b/i.test(raw);
  const isExistingExplicit = /\b(existing\s+enterprise|current\s+branch|same\s+business|தற்போதைய\s*தொழில்\s*கிளை)\b/i.test(raw);
  const isNewExplicit = /\b(new\s+business|start\s+business|new\s+industry|another\s+field|diversif|வேறு\s*தொழில்|புதிய\s*துறை|புதிய\s*தொழில்)\b/i.test(raw);
  const isComparative = ((isBranchExplicit || isExistingExplicit) && isNewExplicit) || /(?:expand.*or.*(?:new|start)|(?:new|start).*or.*expand|வேறு.*அல்லது.*விரிவாக்கம்)/i.test(raw);

  const hasChart = hasChartData(context);
  const isAmbiguousQuery = /\b(more\s+business|expand\s+to\s+more)\b/i.test(raw);

  // If question is ambiguous (e.g. "expand to more business")
  if (isAmbiguousQuery || (!hasChart && !isBranchExplicit && !isExistingExplicit && !isNewExplicit)) {
    const directAnswer = isTamil
      ? "நீங்கள் ஏற்கனவே உள்ள தொழிலில் மற்றொரு கிளையைத் திறக்க விரும்புகிறீர்களா, அல்லது முற்றிலும் வேறுபட்ட புதிய தொழிலைத் தொடங்க விரும்புகிறீர்களா?"
      : "Do you mean opening another branch of the same business, or starting a different business?";

    const reason = isTamil
      ? "ஏற்கனவே உள்ள தொழிலை விரிவுபடுத்துவது 7 மற்றும் 10-ம் பாவகங்களின் வலுவை அடிப்படையாகக் கொண்டது; புதிய தொழிலில் இறங்குவது (பன்முகப்படுத்தல்) 3, 5 மற்றும் 9-ம் பாவகங்கள் மற்றும் கூடுதல் மூலதனத்தை சார்ந்தது."
      : "Scaling an existing business synthesizes established 7th and 10th house infrastructure; diversifying into a different industry requires distinct significators and alternate capital risk management.";

    const limitation = isTamil
      ? "சரியான வணிக வகையை தெளிவுபடுத்தாமல் துல்லியமான ஜோதிட ஒப்பீட்டை வழங்க முடியாது."
      : "Astrological trade assessment requires distinguishing between operational branch scaling and new industry diversification.";

    return {
      questionId,
      intent: "BUSINESS_EXPANSION_DECISION",
      decisionType: "CLARIFICATION_REQUIRED",
      answerState: "CLARIFICATION_REQUIRED",
      directAnswer,
      reason,
      limitation,
      recommendation: null,
      clarificationPrompt: directAnswer,
      options: isTamil
        ? ["தற்போதைய தொழிலில் புதிய கிளை", "முற்றிலும் வேறுபட்ட புதிய தொழில்"]
        : ["Opening another branch of the same business", "Starting a completely different business"],
      supportingClaims: [],
      limitingClaims: [limitation],
      missingInputs: ["Clarification: Branch scaling vs New industry diversification"],
      traditionalMethod: "JYOTISH_COMMERCIAL_SYNTHESIS",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // If specific branch/new question but chart is completely missing
  if (!hasChart) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "BUSINESS_EXPANSION_DECISION",
      taskType: "BUSINESS_DECISION_EVALUATION",
      isTamil,
      missingInputs: ["birthChart", "planetaryPositions"],
      traditionalMethod: "3rd/5th/7th/10th/11th Bhavas Enterprise Synthesis",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate business expansion prospects. Assessing commercial timing and branch viability requires a verified birth chart.",
      customDirectAnswerTa: "வணிக விரிவாக்கத்தை மதிப்பீடு செய்ய தேவையான பிறப்பு ஜாதகத் தரவுகள் கிடைக்கவில்லை."
    });
  }

  // Decision breakdown profiles
  const newBusinessAnalysis = {
    category: "NEW_BUSINESS",
    titleEn: "Starting a New Business (Enterprise Initiative)",
    titleTa: "புதிய தொழில் தொடங்குதல் (தொழில்முனைவு)",
    astrologicalHouses: [3, 5, 10],
    keyPlanets: ["Mercury", "Sun"],
    prosEn: "Full creative initiative, fresh market opportunity, high growth ceiling",
    prosTa: "முழு சுதந்திர முடிவுகள், புதிய சந்தை வாய்ப்புகள், உயர் வளர்ச்சி சாத்தியக்கூறு",
    consEn: "High initial capital exposure, gestation period before profitability, no established client base",
    consTa: "அதிக ஆரம்ப மூலதன தேவை, லாபம் ஈட்டுவதற்கான கால அவகாசம், வாடிக்கையாளர் நம்பிக்கை உருவாக்கத் தேவை",
    limitationEn: "Planetary initiative markers do not substitute for product-market fit or working capital runway.",
    limitationTa: "ஜாதக பலம் மட்டுமே வணிக வெற்றியை ஈட்டாது; தயாரிப்பு தரம் மற்றும் பணப்புழக்க மேலாண்மையே முதன்மையானது."
  };

  const branchExpansionAnalysis = {
    category: "BRANCH_EXPANSION",
    titleEn: "Expanding Existing Business (Branch / Operational Scaling)",
    titleTa: "தற்போதைய தொழிலை விரிவுபடுத்துதல் (கிளை / விரிவாக்கம்)",
    astrologicalHouses: [7, 10, 11],
    keyPlanets: ["Mercury", "Jupiter"],
    prosEn: "Leverages existing customer trust, established supply chains, proven unit economics",
    prosTa: "நிரூபிக்கப்பட்ட வாடிக்கையாளர் நன்மதிப்பு, இருக்கும் விநியோகக் கட்டமைப்பு, உடனடி பணப்புழக்கம்",
    consEn: "Increased managerial complexity, overhead duplication, risk of local market saturation",
    consTa: "கூடுதல் நிர்வாக பணிச்சுமை, பணியாளர் மேலாண்மை சவால்கள், கிளைகளுக்கு இடையிலான போட்டி",
    limitationEn: "Commercial scale demands strict inventory control and decentralized operational oversight.",
    limitationTa: "கிளை விரிவாக்கத்திற்கு நிலையான நிதி திட்டமிடலும், பணியாளர் நம்பகத்தன்மையும் மிக அவசியம்."
  };

  // If specifically asking about branch/existing expansion ONLY (not comparative)
  if (!isComparative && (isBranchExplicit || isExistingExplicit) && !isNewExplicit) {
    const directAnswer = isTamil
      ? "உங்கள் தற்போதைய தொழிலை விரிவுபடுத்துவது (புதிய கிளை தொடங்குதல்) வணிக கூட்டாண்மை (7-ம் பாவகம்), நிர்வாக திறன் (10-ம் பாவகம்) மற்றும் நிலையான லாபத்தை (11-ம் பாவகம்) அடிப்படையாகக் கொண்டது."
      : "Evaluating branch expansion for your existing enterprise centers on commercial trade partnerships (7th house), administrative authority (10th house), and recurrent revenue gains (11th house).";

    const reason = isTamil
      ? `நன்மை: ${branchExpansionAnalysis.prosTa}.\nசவால்: ${branchExpansionAnalysis.consTa}.`
      : `Advantages: ${branchExpansionAnalysis.prosEn}.\nRisks & Challenges: ${branchExpansionAnalysis.consEn}.`;

    return {
      questionId,
      intent: "BUSINESS_EXPANSION_DECISION",
      decisionType: "BRANCH_EXPANSION",
      answerState: "ANSWERED",
      directAnswer,
      reason,
      limitation: branchExpansionAnalysis.limitationEn,
      recommendation: {
        preferredPath: "BRANCH_EXPANSION",
        pros: branchExpansionAnalysis.prosEn,
        cons: branchExpansionAnalysis.consEn
      },
      supportingClaims: [
        "7th House (Commercial Trade) and 11th House (Revenue Flow) synergy",
        "Operational leverage of existing business infrastructure"
      ],
      limitingClaims: [branchExpansionAnalysis.limitationEn],
      missingInputs: [],
      traditionalMethod: "7th & 10th Bhavas, Mercury & Jupiter Commercial Synthesis",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // If specifically asking about starting a new business ONLY (not comparative)
  if (!isComparative && isNewExplicit && !isBranchExplicit && !isExistingExplicit) {
    const directAnswer = isTamil
      ? "முற்றிலும் புதிய தொழில் தொடங்குவது உங்கள் சுயமுயற்சி (3-ம் பாவகம்), வணிக அறிவு (5-ம் பாவகம்) மற்றும் தொழில் ஆதிபத்தியம் (10-ம் பாவகம்) சார்ந்த புதிய கட்டமைப்பைக் கோருகிறது."
      : "Initiating a completely new business venture requires synthesizing entrepreneurial drive (3rd house), strategic intellect (5th house), and occupational leadership (10th house).";

    const reason = isTamil
      ? `நன்மை: ${newBusinessAnalysis.prosTa}.\nசவால்: ${newBusinessAnalysis.consTa}.`
      : `Advantages: ${newBusinessAnalysis.prosEn}.\nRisks & Challenges: ${newBusinessAnalysis.consEn}.`;

    return {
      questionId,
      intent: "BUSINESS_DIVERSIFICATION_DECISION",
      decisionType: "NEW_BUSINESS",
      answerState: "ANSWERED",
      directAnswer,
      reason,
      limitation: newBusinessAnalysis.limitationEn,
      recommendation: {
        preferredPath: "NEW_BUSINESS",
        pros: newBusinessAnalysis.prosEn,
        cons: newBusinessAnalysis.consEn
      },
      supportingClaims: [
        "3rd House (Self-Enterprise) and 5th House (Strategic Foresight) alignment",
        "Market diversification evaluation"
      ],
      limitingClaims: [newBusinessAnalysis.limitationEn],
      missingInputs: [],
      traditionalMethod: "3rd, 5th & 10th Bhavas, Mercury & Sun Enterprise Synthesis",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // General or combined inquiry: provide explicit side-by-side comparative breakdown
  const directAnswer = isTamil
    ? "வணிக முடிவெடுத்தலில் இரண்டு முக்கிய பாதைகள் உள்ளன: 1) தற்போதைய தொழிலை விரிவுபடுத்துதல் (கிளை தொடங்குதல்), அல்லது 2) முற்றிலும் புதிய தொழிலைத் தொடங்குதல். உங்கள் ஜாதகக் குறியீடுகளின்படி இவை இரண்டுக்கும் தனித்துவமான நன்மைகளும் சவால்களும் உள்ளன."
    : "In business decision-making, there are two distinct paths: 1) Expanding an existing enterprise (branch scaling), or 2) Starting a new business venture. Astrological evaluation reveals distinct opportunities, trade-offs, and operational limitations for each.";

  const reason = isTamil
    ? [
        `1. தற்போதைய தொழில் விரிவாக்கம்: ${branchExpansionAnalysis.prosTa}. ஆனால் சவால்: ${branchExpansionAnalysis.consTa}.`,
        `2. புதிய தொழில் தொடங்குதல்: ${newBusinessAnalysis.prosTa}. ஆனால் சவால்: ${newBusinessAnalysis.consTa}.`
      ].join("\n• ")
    : [
        `1. Expanding Existing Enterprise: ${branchExpansionAnalysis.prosEn}. However: ${branchExpansionAnalysis.consEn}.`,
        `2. Starting New Business: ${newBusinessAnalysis.prosEn}. However: ${newBusinessAnalysis.consEn}.`
      ].join("\n• ");

  const limitation = isTamil
    ? "ஜோதிட அமைப்புகள் வணிகப் போக்கையும் மனோதைரியத்தையும் மட்டுமே காட்டுகின்றன; சந்தை நிலவரம், பணப்புழக்கம் மற்றும் நிர்வாகத் திறமையே வணிக வெற்றியைத் தீர்மானிக்கும்."
    : "Astrological trade alignments signify commercial aptitude and momentum; product-market validation, cash runway, and operational discipline determine commercial solvency.";

  return {
    questionId,
    intent: "BUSINESS_EXPANSION_DECISION",
    decisionType: "COMPARATIVE_DECISION",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation,
    recommendation: {
      paths: [
        { path: "BRANCH_EXPANSION", pros: branchExpansionAnalysis.prosEn, cons: branchExpansionAnalysis.consEn },
        { path: "NEW_BUSINESS", pros: newBusinessAnalysis.prosEn, cons: newBusinessAnalysis.consEn }
      ]
    },
    supportingClaims: [
      "Branch Expansion: 7th & 11th House operational cash flow analysis",
      "New Business: 3rd & 5th House initiative and venture foresight"
    ],
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: "Comparative Jyotish Commercial Synthesis (3rd/5th vs 7th/11th Bhavas)",
    empiricalStatus: "NOT_VALIDATED"
  };
}
