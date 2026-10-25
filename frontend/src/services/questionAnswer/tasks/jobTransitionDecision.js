/**
 * SKR ASTRO — Job Transition & Career Movement Decision Evaluator
 * ================================================================
 * Evaluates career decision questions:
 * 1. Switching to a New Job / External Pivot (Path A: SWITCH_JOB)
 * 2. Staying in Current Organization / Internal Promotion (Path B: STAY_AND_GROW)
 *
 * Provides side-by-side comparative trade-offs, D10 & Dasha convergence,
 * and actionable career realities without fabricating guaranteed hiring outcomes.
 */

import { hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

export function evaluateJobTransitionDecision({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_JOB_TRANSITION_DECISION";

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "JOB_TRANSITION_DECISION",
      taskType: "CAREER_DECISION_EVALUATION",
      isTamil,
      missingInputs: ["birthChart", "planetaryPositions"],
      traditionalMethod: "10th/6th/3rd Bhavas, Mercury & Saturn Career Synthesis",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate career transition prospects. Evaluating job change vs retention requires calculated career house positions from a verified birth chart.",
      customDirectAnswerTa: "வேலை மாற்றம் அல்லது பணியில் தொடர்வதை மதிப்பிட தேவையான பிறப்பு ஜாதகத் தரவுகள் கிடைக்கவில்லை."
    });
  }
  const raw = String(question || "").toLowerCase();

  const isSwitchExplicit = /\b(switch|change\s+job|new\s+job|new\s+company|leave|resign|move\s+out|மாற|வேலை\s*மாற்ற|புதிய\s*பணி)\b/i.test(raw);
  const isStayExplicit = /\b(stay|continue|remain|same\s+company|current\s+job|current\s+company|தொடர|அதே\s*இடத்|தற்போதைய\s*வேலை)\b/i.test(raw);
  const isComparative = (isSwitchExplicit && isStayExplicit) || /(?:switch.*or.*stay|stay.*or.*switch|change.*or.*continue|continue.*or.*change|மாறவா.*தொடரவா|தொடர்வதா.*மாறுவதா)/i.test(raw);

  const switchJobAnalysis = {
    category: "SWITCH_JOB",
    titleEn: "External Job Transition (New Organization / Role Pivot)",
    titleTa: "புதிய நிறுவனத்திற்கு மாறுதல் (பணி மாற்றம்)",
    astrologicalHouses: [3, 6, 10],
    keyPlanets: ["Mercury", "Rahu", "Saturn"],
    prosEn: "Potential for compensation reset, expanded network, exposure to modern skillsets",
    prosTa: "ஊதிய உயர்வு சாத்தியம், புதிய தொடர்புகள், நவீன தொழில் நுட்பக் கற்றல்",
    consEn: "Probation vulnerability, cultural adaptation friction, loss of accrued organizational goodwill",
    consTa: "புதிய சூழல் தழுவல் சவால், முந்தைய நிறுவன நன்மதிப்பு இழப்பு, தகுதிகாண் பருவ ஆபத்து",
    limitationEn: "Planetary indicators of movement do not substitute for vetted compensation contracts and company solvency.",
    limitationTa: "கிரக அமைப்புகள் வாய்ப்புகளை மட்டுமே குறிக்கின்றன; நிறுவனத்தின் நிதி நிலைத்தன்மையே உங்கள் பணி பாதுகாப்பை உறுதி செய்யும்."
  };

  const stayAndGrowAnalysis = {
    category: "STAY_AND_GROW",
    titleEn: "Internal Retention & Promotion (Consolidating Current Role)",
    titleTa: "தற்போதைய நிறுவனத்தில் தொடர்தல் (உள் பதவி உயர்வு & ஸ்திரத்தன்மை)",
    astrologicalHouses: [10, 11, 2],
    keyPlanets: ["Jupiter", "Sun", "Saturn"],
    prosEn: "Institutional familiarity, secure standing during market volatility, established team trust",
    prosTa: "நிறுவன ஸ்திரத்தன்மை, நிரூபிக்கப்பட்ட நன்மதிப்பு, சந்தை நிச்சயமற்ற நிலைகளில் பணி பாதுகாப்பு",
    consEn: "Slower compensation compounding, role stagnation risk, limited cross-industry visibility",
    consTa: "ஊதிய வளர்ச்சி மெதுவாக இருத்தல், ஒரே மாதிரியான பணிச்சூழல், புதிய அனுபவங்கள் குறைவு",
    limitationEn: "Staying requires active alignment with leadership roadmaps and proactive upskilling.",
    limitationTa: "தொடர்வதற்கு நிர்வாக ஆதரவும், உங்களின் தொடர்ச்சியான திறன்பேணலும் மிக அவசியம்."
  };

  // Inspect context for operating Dasha / D10 indicators if available
  const activePlanets = context?.activePlanets || context?.chart?.activePlanets || [];
  const activeHouses = context?.activeHouses || context?.chart?.activeHouses || [];
  const has6thOr3rd = activeHouses.includes(6) || activeHouses.includes(3) || activePlanets.includes("Mercury") || activePlanets.includes("Rahu");
  const has10thOr11th = activeHouses.includes(10) || activeHouses.includes(11) || activePlanets.includes("Jupiter") || activePlanets.includes("Sun");

  // If asking specifically about switching only
  if (!isComparative && isSwitchExplicit && !isStayExplicit) {
    const directAnswer = isTamil
      ? "வேலை மாற்றம் செய்வதற்கான சாதக நிலைகள் உங்கள் முயற்சி பாவகங்கள் (3 மற்றும் 6-ம் பாவகம்), புதன் மற்றும் ராகுவின் கோச்சார தொடர்புகளை அடிப்படையாகக் கொண்டவை."
      : "Evaluating an external job transition centers on initiative/transition houses (3rd and 6th bhavas), Mercury's role in contracts, and professional adaptability.";

    const reason = isTamil
      ? `நன்மைகள்: ${switchJobAnalysis.prosTa}.\nசவால்கள்: ${switchJobAnalysis.consTa}.`
      : `Advantages: ${switchJobAnalysis.prosEn}.\nRisks & Considerations: ${switchJobAnalysis.consEn}.`;

    return {
      questionId,
      intent: "JOB_TRANSITION_DECISION",
      decisionType: "SWITCH_JOB",
      answerState: "ANSWERED",
      directAnswer,
      reason,
      limitation: switchJobAnalysis.limitationEn,
      recommendation: {
        preferredPath: "SWITCH_JOB",
        pros: switchJobAnalysis.prosEn,
        cons: switchJobAnalysis.consEn
      },
      supportingClaims: [
        "3rd House (Initiative/Relocation) and 6th House (Competitive Service) dynamics",
        "Market negotiation and contract adaptability"
      ],
      limitingClaims: [switchJobAnalysis.limitationEn],
      missingInputs: [],
      traditionalMethod: "6th & 10th Bhavas, Mercury & D10 Dasamsha Evaluation",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // If asking specifically about staying only
  if (!isComparative && isStayExplicit && !isSwitchExplicit) {
    const directAnswer = isTamil
      ? "தற்போதைய நிறுவனத்தில் தொடர்வது உங்கள் 10-ம் பாவகம் (கர்ம ஸ்தானம்), 11-ம் பாவகம் (ஊதிய உயர்வு) மற்றும் குரு/சூரியனின் தலைமைத்துவ அமைப்பைச் சார்ந்தது."
      : "Consolidating your current position prioritizes leadership consolidation (10th house), predictable increments (11th house), and solar/Jupiterian institutional standing.";

    const reason = isTamil
      ? `நன்மைகள்: ${stayAndGrowAnalysis.prosTa}.\nசவால்கள்: ${stayAndGrowAnalysis.consTa}.`
      : `Advantages: ${stayAndGrowAnalysis.prosEn}.\nRisks & Considerations: ${stayAndGrowAnalysis.consEn}.`;

    return {
      questionId,
      intent: "JOB_TRANSITION_DECISION",
      decisionType: "STAY_AND_GROW",
      answerState: "ANSWERED",
      directAnswer,
      reason,
      limitation: stayAndGrowAnalysis.limitationEn,
      recommendation: {
        preferredPath: "STAY_AND_GROW",
        pros: stayAndGrowAnalysis.prosEn,
        cons: stayAndGrowAnalysis.consEn
      },
      supportingClaims: [
        "10th House (Organizational Authority) and 11th House (Accrued Gains) stability",
        "Capitalizing on established trust and institutional familiarity"
      ],
      limitingClaims: [stayAndGrowAnalysis.limitationEn],
      missingInputs: [],
      traditionalMethod: "10th & 11th Bhavas, Sun & Jupiter Executive Synthesis",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // Default: Comparative Analysis (Should I switch or stay?)
  const directAnswer = isTamil
    ? "வேலை மாற்றம் செய்வதா அல்லது தற்போதைய இடத்திலேயே தொடர்வதா என்ற முடிவிற்கு, புதிய சவால்கள் (பாதை A) மற்றும் நிறுவன ஸ்திரத்தன்மை (பாதை B) ஆகியவற்றின் சமநிலையை ஒப்பிட்டுப் பார்க்க வேண்டும்."
    : "Deciding whether to switch to a new organization or remain in your current position requires weighing external career momentum (Path A) against institutional stability and internal growth (Path B).";

  const reason = isTamil
    ? `[பாதை A - வேலை மாற்றம்]: ${switchJobAnalysis.prosTa}. சவால்: ${switchJobAnalysis.consTa}.\n\n` +
      `[பாதை B - தற்போதைய இடத்தில் தொடர்தல்]: ${stayAndGrowAnalysis.prosTa}. சவால்: ${stayAndGrowAnalysis.consTa}.`
    : `[Path A - Switch Organization]: ${switchJobAnalysis.prosEn}. Risk: ${switchJobAnalysis.consEn}.\n\n` +
      `[Path B - Retain Current Role]: ${stayAndGrowAnalysis.prosEn}. Risk: ${stayAndGrowAnalysis.consEn}.`;

  const preferredPath = has6thOr3rd && !has10thOr11th
    ? "SWITCH_JOB"
    : (has10thOr11th ? "STAY_AND_GROW" : "COMPARATIVE_EQUILIBRIUM");

  return {
    questionId,
    intent: "JOB_TRANSITION_DECISION",
    decisionType: "COMPARATIVE_ANALYSIS",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation: isTamil
      ? "ஜோதிட காலக்கோடு சாதகமான காலகட்டங்களை சுட்டிக்காட்டினாலும், உங்கள் இறுதி முடிவு சந்தை வாய்ப்புகள் மற்றும் புதிய வேலை ஒப்பந்தத்தின் தெளிவைப் பொறுத்தே அமைய வேண்டும்."
      : "Astrological alignments reflect broad cyclical themes; commercial decisions must always be grounded in binding offer letters, team dynamics, and economic runway.",
    recommendation: {
      preferredPath,
      pathA: switchJobAnalysis,
      pathB: stayAndGrowAnalysis
    },
    supportingClaims: [
      "10th Bhava (Professional Standing), 6th Bhava (Service Dynamics), and D10 Dashamsha Analysis",
      "Objective trade-off matrix balancing compensation acceleration with job security"
    ],
    limitingClaims: [
      "No astrological engine can verify the internal solvency or culture of prospective employers.",
      "Always vet written offer terms before executing employment resignations."
    ],
    missingInputs: [],
    traditionalMethod: "10th, 6th, and 11th Bhavas, Mercury/Sun/Saturn Synthesis, and D10 Confirmation",
    empiricalStatus: "NOT_VALIDATED"
  };
}
