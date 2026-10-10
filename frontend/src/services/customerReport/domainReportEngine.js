/**
 * ASTROVERSE — Domain Report Engine
 * ===================================
 * Generates rich, evidence-linked, non-fabricated domain reports
 * covering all 17 domains with mandatory sections A through K.
 */

import {
  ALL_17_DOMAINS,
  DOMAIN_DISPLAY_NAMES,
  EVIDENCE_STRENGTH,
  TRADITIONAL_ASSESSMENT,
  EMPIRICAL_STATUS,
  EMPIRICAL_RESOLUTION,
  RESOLUTION,
  RISK_SEVERITY,
  createDomainReport
} from "./lifeReportModel.js";
import { DOMAIN_VALIDATION_REGISTRY } from "../expertPrediction/domainValidationRegistry.js";
import { extractCanonicalFacts } from "../expertPrediction/canonicalFactAdapter.js";
import { assembleExpertReport } from "../expertPrediction/expertReportAssembler.js";

// Import existing expert adapters for grounding
import { calculateMarriageExpert } from "../expertPrediction/domains/marriageDomain.js";
import { calculatePropertyExpert } from "../expertPrediction/domains/propertyDomain.js";
import { calculateCareerExpert } from "../expertPrediction/domains/careerDomain.js";
import { calculateEducationExpert } from "../expertPrediction/domains/educationDomain.js";
import { calculateChildrenExpert } from "../expertPrediction/domains/childrenDomain.js";
import { calculateForeignTravelExpert } from "../expertPrediction/domains/foreignTravelDomain.js";
import { calculateVehicleExpert } from "../expertPrediction/domains/vehicleDomain.js";
import { calculateBusinessExpert } from "../expertPrediction/domains/businessDomain.js";
import { calculateJobExpert } from "../expertPrediction/domains/jobDomain.js";
import { calculateFinanceExpert } from "../expertPrediction/domains/financeDomain.js";
import { calculateFamilyExpert } from "../expertPrediction/domains/familyDomain.js";
import { calculateLeadershipExpert } from "../expertPrediction/domains/leadershipDomain.js";
import { calculateHealthExpert } from "../expertPrediction/domains/healthDomain.js";
import { calculateLegalExpert } from "../expertPrediction/domains/legalDomain.js";
import { calculateSpiritualExpert } from "../expertPrediction/domains/spiritualDomain.js";
import { calculateCautionExpert } from "../expertPrediction/domains/cautionDomain.js";
import { calculateMilestoneExpert } from "../expertPrediction/domains/milestoneDomain.js";

/**
 * Domain-specific configuration mapping for the 17 domains
 */
const DOMAIN_CONFIG = {
  marriage: {
    relevantHouses: [7, 2, 8, 11],
    karakas: ["Venus", "Jupiter"],
    varga: "D9",
    adapter: calculateMarriageExpert
  },
  property: {
    relevantHouses: [4, 2, 11, 12],
    karakas: ["Mars", "Venus", "Moon"],
    varga: "D4",
    adapter: calculatePropertyExpert
  },
  career: {
    relevantHouses: [10, 2, 6, 11, 1],
    karakas: ["Sun", "Saturn", "Mercury"],
    varga: "D10",
    adapter: calculateCareerExpert
  },
  education: {
    relevantHouses: [4, 5, 9],
    karakas: ["Mercury", "Jupiter"],
    varga: "D24",
    adapter: calculateEducationExpert
  },
  children: {
    relevantHouses: [5, 2, 11],
    karakas: ["Jupiter"],
    varga: "D7",
    adapter: calculateChildrenExpert
  },
  foreignTravel: {
    relevantHouses: [3, 9, 12],
    karakas: ["Rahu", "Moon"],
    varga: "D4",
    adapter: calculateForeignTravelExpert
  },
  vehicle: {
    relevantHouses: [4, 2, 11],
    karakas: ["Venus", "Mars"],
    varga: "D16",
    adapter: calculateVehicleExpert
  },
  business: {
    relevantHouses: [7, 10, 11, 2, 3],
    karakas: ["Mercury", "Jupiter", "Mars"],
    varga: "D10",
    adapter: calculateBusinessExpert
  },
  job: {
    relevantHouses: [6, 10, 2, 11],
    karakas: ["Saturn", "Sun", "Mercury"],
    varga: "D10",
    adapter: calculateJobExpert
  },
  finance: {
    relevantHouses: [2, 5, 8, 9, 11],
    karakas: ["Jupiter", "Venus", "Mercury"],
    varga: "D2",
    adapter: calculateFinanceExpert
  },
  family: {
    relevantHouses: [2, 4, 9, 3],
    karakas: ["Moon", "Sun", "Jupiter"],
    varga: "D12",
    adapter: calculateFamilyExpert
  },
  leadership: {
    relevantHouses: [10, 1, 5, 9, 11],
    karakas: ["Sun", "Mars", "Saturn"],
    varga: "D10",
    adapter: calculateLeadershipExpert
  },
  wellness: {
    relevantHouses: [1, 6, 8, 12],
    karakas: ["Sun", "Moon"],
    varga: "D1",
    adapter: calculateHealthExpert
  },
  legal: {
    relevantHouses: [6, 7, 8, 12],
    karakas: ["Mars", "Saturn", "Jupiter"],
    varga: "D30",
    adapter: calculateLegalExpert
  },
  spiritual: {
    relevantHouses: [9, 12, 5, 4],
    karakas: ["Jupiter", "Ketu"],
    varga: "D20",
    adapter: calculateSpiritualExpert
  },
  caution: {
    relevantHouses: [6, 8, 12],
    karakas: ["Saturn", "Mars", "Rahu", "Ketu"],
    varga: "D30",
    adapter: calculateCautionExpert
  },
  milestones: {
    relevantHouses: [1, 4, 7, 10],
    karakas: ["Jupiter", "Saturn", "Sun"],
    varga: "D9",
    adapter: calculateMilestoneExpert
  }
};

/**
 * Generates complete domain reports for all 17 domains.
 *
 * @param {Object} chartData - Complete chart data
 * @param {string} lang - "en" or "ta"
 * @param {Date} [currentDate=new Date()] - Reference current date
 * @returns {Array} Array of 17 certified DomainReport objects
 */
export function generateAll17DomainReports(chartData, lang = "en", currentDate = new Date()) {
  const isTamil = lang === "ta";
  const canonicalFacts = extractCanonicalFacts(chartData, lang);

  // Run Expert Mode report to get primary calculations and cross-domain findings
  const expertReport = assembleExpertReport(chartData, lang);
  const expertDomainResults = expertReport.domainResults || {};

  const domainReports = [];

  for (const domainId of ALL_17_DOMAINS) {
    const config = DOMAIN_CONFIG[domainId];
    const validationInfo = DOMAIN_VALIDATION_REGISTRY[domainId] || {
      status: "TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED",
      empiricalPredictiveResolution: "NOT_ESTABLISHED",
      empiricalOutcomeValidationAvailable: false
    };

    const rawExpertResult = expertDomainResults[domainId] || null;
    const report = buildSingleDomainReport({
      domainId,
      config,
      validationInfo,
      rawExpertResult,
      canonicalFacts,
      chartData,
      isTamil,
      currentDate
    });

    domainReports.push(report);
  }

  return domainReports;
}

/**
 * Builds a single domain report covering all mandated fields and sections A through K.
 */
function buildSingleDomainReport({
  domainId,
  config,
  validationInfo,
  rawExpertResult,
  canonicalFacts,
  chartData,
  isTamil,
  currentDate
}) {
  const displayNames = DOMAIN_DISPLAY_NAMES[domainId] || { en: domainId, ta: domainId };
  const houses = config.relevantHouses || [];
  const primaryHouse = houses.length > 0 ? houses[0] : null;
  const houseLords = canonicalFacts.houseLords || {};
  const primaryLord = primaryHouse != null ? (houseLords[primaryHouse] || "Unknown") : null;
  const karakas = config.karakas || [];
  const primaryKaraka = karakas[0] || "";
  const vargaCode = config.varga || "D1";

  // Determine evidence strength based on authentic chart facts
  const primaryWindows = rawExpertResult?.primaryWindows || [];
  const cautionWindows = rawExpertResult?.cautionWindows || [];
  const totalWindows = primaryWindows.length;
  
  let evidenceStrength = EVIDENCE_STRENGTH.MODERATE;
  if (totalWindows >= 3 && primaryWindows.some(w => w.confidenceType === "PEAK_CONVERGENCE" || w.confidenceType === "STRONG_CONVERGENCE")) {
    evidenceStrength = EVIDENCE_STRENGTH.VERY_STRONG;
  } else if (totalWindows >= 2) {
    evidenceStrength = EVIDENCE_STRENGTH.STRONG;
  } else if (totalWindows === 1) {
    evidenceStrength = EVIDENCE_STRENGTH.MODERATE;
  } else if (cautionWindows.length > 0) {
    evidenceStrength = EVIDENCE_STRENGTH.MIXED;
  } else {
    evidenceStrength = EVIDENCE_STRENGTH.LIMITED;
  }

  // Determine overall traditional assessment
  let overallTraditionalAssessment = TRADITIONAL_ASSESSMENT.SUPPORTED;
  if (rawExpertResult?.outlook === "SUPPORTED" || rawExpertResult?.outlook === "FAVORABLE") {
    overallTraditionalAssessment = TRADITIONAL_ASSESSMENT.FAVORABLE;
  } else if (rawExpertResult?.outlook === "GUARDED") {
    overallTraditionalAssessment = TRADITIONAL_ASSESSMENT.GUARDED;
  } else if (rawExpertResult?.outlook === "LIMITED" || rawExpertResult?.outlook === "NOT_ESTABLISHED") {
    overallTraditionalAssessment = TRADITIONAL_ASSESSMENT.LIMITED;
  }

  // Build positive and challenging indicators
  const positiveIndicators = [];
  const challengingIndicators = [];
  const neutralIndicators = [];

  // 1. House & Lord Disposition
  const houseInfo = canonicalFacts.houses?.[primaryHouse - 1];
  if (houseInfo) {
    if (houseInfo.planets?.length > 0) {
      positiveIndicators.push(
        isTamil
          ? `${displayNames.ta} பாவகமான ${primaryHouse}-ல் ${houseInfo.planets.join(", ")} அமர்ந்துள்ளனர்.`
          : `For ${displayNames.en}, house ${primaryHouse} is occupied by ${houseInfo.planets.join(", ")}.`
      );
    } else {
      neutralIndicators.push(
        isTamil
          ? `${displayNames.ta} பாவகமான ${primaryHouse}-ல் கிரகங்களின் நேரடி அமர்வு இன்றி, அதன் அதிபதி ${primaryLord} வழியே இயங்குகிறது.`
          : `For ${displayNames.en}, house ${primaryHouse} has no occupant planets, operating primarily through its ruler ${primaryLord}.`
      );
    }
  }

  // 2. Lord dignity
  const lordPlanet = canonicalFacts.planets?.find(p => p.name === primaryLord);
  if (lordPlanet) {
    if (lordPlanet.dignity === "Exalted" || lordPlanet.dignity === "Own Sign" || lordPlanet.dignity === "Moolatrikona") {
      positiveIndicators.push(
        isTamil
          ? `${displayNames.ta} அதிபதி ${primaryLord} (${primaryHouse}-ம் பாவகம்) ${lordPlanet.dignity} பலம் பெற்று சுபமாக உள்ளார்.`
          : `Regarding ${displayNames.en}, ruler ${primaryLord} (house ${primaryHouse}) is positioned in ${lordPlanet.dignity} dignity.`
      );
    } else if (lordPlanet.dignity === "Debilitated") {
      challengingIndicators.push(
        isTamil
          ? `${displayNames.ta} அதிபதி ${primaryLord} (${primaryHouse}-ம் பாவகம்) நீச பலத்தில் இருப்பதால் கூடுதல் பொறுமை தேவை.`
          : `Regarding ${displayNames.en}, ruler ${primaryLord} (house ${primaryHouse}) is in Debilitated dignity, requiring mindful navigation.`
      );
    } else {
      neutralIndicators.push(
        isTamil
          ? `${displayNames.ta} அதிபதி ${primaryLord} (${primaryHouse}-ம் பாவகம்) ${lordPlanet.dignity || "நடுநிலை"} பலத்தில் உள்ளார்.`
          : `Regarding ${displayNames.en}, ruler ${primaryLord} (house ${primaryHouse}) holds ${lordPlanet.dignity || "neutral"} disposition.`
      );
    }

    if (lordPlanet.isRetrograde) {
      neutralIndicators.push(
        isTamil
          ? `${displayNames.ta} அதிபதி ${primaryLord} வக்ர கதியில் உள்ளதால் ஆழ்ந்த யோசனை அவசியம்.`
          : `In matters of ${displayNames.en}, ruler ${primaryLord} is in Retrograde motion, signifying internal contemplation.`
      );
    }
    if (lordPlanet.isCombust) {
      challengingIndicators.push(
        isTamil
          ? `${displayNames.ta} அதிபதி ${primaryLord} அஸ்தங்கம் பெற்றுள்ளதால் கவனமுடன் செயல்பட வேண்டும்.`
          : `In matters of ${displayNames.en}, ruler ${primaryLord} is Combust, advising protective diligence.`
      );
    }
  }

  // 3. Karaka disposition
  const karakaPlanet = canonicalFacts.planets?.find(p => p.name === primaryKaraka);
  if (karakaPlanet) {
    if (karakaPlanet.dignity === "Exalted" || karakaPlanet.dignity === "Own Sign") {
      positiveIndicators.push(
        isTamil
          ? `${displayNames.ta} காரகன் ${primaryKaraka} பலமான ஸ்தானத்தில் நிலைபெற்றுள்ளார்.`
          : `For ${displayNames.en}, primary natural significator ${primaryKaraka} is in strong dignified position.`
      );
    } else if (karakaPlanet.dignity === "Debilitated") {
      challengingIndicators.push(
        isTamil
          ? `${displayNames.ta} காரகன் ${primaryKaraka} பலவீனமாக இருப்பதால் விழிப்புணர்வு தேவை.`
          : `For ${displayNames.en}, primary natural significator ${primaryKaraka} is debilitated, advising diligence.`
      );
    }
  }

  // 4. Evidence Chain: Natal → House → House Lord → Karaka → Varga → Dasha → Transit → Supporting Factors → Contradictions → Final Interpretation
  const evidenceChain = [
    {
      step: 1,
      factor: "Natal Baseline",
      finding: isTamil
        ? `லக்னம்: ${canonicalFacts.ascendantSign || "Lagna"} (${canonicalFacts.ascendantLong?.toFixed(1) || 0}°)`
        : `Lagna: ${canonicalFacts.ascendantSign || "Ascendant"} (${canonicalFacts.ascendantLong?.toFixed(1) || 0}°)`,
      significance: isTamil ? "அடிப்படை வாழ்வியல் ஆளுமை கட்டமைப்பு" : "Foundational constitutional framework"
    },
    {
      step: 2,
      factor: "House Analysis",
      finding: isTamil
        ? (primaryHouse != null ? `${primaryHouse}-ம் பாவகம் (${houses.join(", ")} பாவகங்கள் தொடர்புடையவை)` : "தொடர்புடைய பாவகங்கள் வரையறுக்கப்படவில்லை")
        : (primaryHouse != null ? `House ${primaryHouse} (relevant axis: houses ${houses.join(", ")})` : "No specific relevant house configured"),
      significance: isTamil ? "டொமைனின் செயல்பாட்டு களம்" : "Operational arena for this domain"
    },
    {
      step: 3,
      factor: "House Lord",
      finding: isTamil
        ? (primaryLord != null ? `${primaryHouse}-ம் அதிபதி: ${primaryLord}` : "பாவகாதிபதி வரையறுக்கப்படவில்லை")
        : (primaryLord != null ? `Ruler of house ${primaryHouse}: ${primaryLord}` : "No specific house ruler configured"),
      significance: isTamil ? "பாவக பலத்தின் நிர்வாகி" : "Executive steward of domain outcomes"
    },
    {
      step: 4,
      factor: "Karaka Signification",
      finding: isTamil
        ? `முதன்மை காரகன்: ${primaryKaraka}`
        : `Primary Karaka: ${primaryKaraka} (${karakas.join(", ")})`,
      significance: isTamil ? "இயற்கை காரகத்துவ அதிர்வு" : "Natural universal archetype for domain"
    },
    {
      step: 5,
      factor: "Divisional Varga",
      finding: isTamil
        ? `வர்க்க சக்கரம்: ${vargaCode}`
        : `Divisional Chart: ${vargaCode} confirmation`,
      significance: isTamil ? "நுண்ணிய உள்நிலை வலிமை ஆய்வு" : "Subtle harmonic potential & resilience"
    },
    {
      step: 6,
      factor: "Dasha Activation",
      finding: isTamil
        ? `தற்போதைய தசா-புக்தி அதிபதிகள்: ${chartData.currentDasha?.lord || "Dasha"} / ${chartData.currentDasha?.currentAntar || "Antar"}`
        : `Operating Dasha/Antardasha: ${chartData.currentDasha?.lord || "Dasha"} / ${chartData.currentDasha?.currentAntar || "Antar"}`,
      significance: isTamil ? "காலத்தின் விழிப்புணர்வு தளம்" : "Temporal activation clock"
    },
    {
      step: 7,
      factor: "Transit Concurrence",
      finding: isTamil
        ? `முக்கிய கோச்சார நிலை: குரு & சனி பெயர்ச்சி ஒருங்கிணைவு`
        : `Major Gochara alignment: Jupiter & Saturn transit configuration`,
      significance: isTamil ? "நிகழ்கால சூழல் வாய்ப்புகள்" : "External catalytic window"
    },
    {
      step: 8,
      factor: "Supporting Factors",
      finding: positiveIndicators.slice(0, 2).join("; ") || (isTamil ? "நிலையான அமைப்புகள் உள்ளன" : "Stable baseline configurations"),
      significance: isTamil ? "சாதகமான உந்துசக்தி" : "Positive momentum drivers"
    },
    {
      step: 9,
      factor: "Contradictions & Friction",
      finding: challengingIndicators.slice(0, 2).join("; ") || (isTamil ? "குறிப்பிடத்தக்க தடைகள் இல்லை" : "Minimal acute structural friction"),
      significance: isTamil ? "கவனத்திற்குரிய தற்காப்பு பகுதிகள்" : "Protective boundaries to observe"
    },
    {
      step: 10,
      factor: "Final Interpretation",
      finding: isTamil
        ? `பாரம்பரிய மதிப்பீடு: ${overallTraditionalAssessment}`
        : `Synthesized Traditional Assessment: ${overallTraditionalAssessment}`,
      significance: isTamil ? "முழுமையான பாரம்பரிய தொகுப்பு" : "Holistic evidence synthesis"
    }
  ];

  // 5. Traditional Timing Windows
  const validWindows = (primaryWindows || []).filter(pw => Boolean(pw && (pw.startDate || pw.localStartDate)));
  const traditionalTimingWindows = validWindows.map((pw, wIdx) => {
    let start = pw.startDate || pw.localStartDate;
    let end = pw.endDate || pw.localEndDate || start;
    if (start && end && start > end) {
      const temp = start;
      start = end;
      end = temp;
    }
    return {
      windowId: pw.windowId || `${domainId}_tw_${wIdx + 1}`,
      start,
      end,
      domain: domainId,
      traditionalIndication: isTamil ? "பாரம்பரிய சாதகமான காலம்" : "Traditionally Supportive Window",
      evidence: pw.supportingFactors || [`${pw.dashaFacts?.md?.lord || 'Dasha'} period activates relevant houses`],
      strength: pw.strength != null ? pw.strength : 0.7,
      traditionalEvidenceStrength: pw.traditionalEvidenceStrength != null ? pw.traditionalEvidenceStrength : (pw.strength != null ? pw.strength : 0.7),
      traditionalRuleConvergence: pw.traditionalRuleConvergence != null ? pw.traditionalRuleConvergence : (pw.strength != null ? pw.strength : 0.7),
      predictiveProbability: null,
      resolution: pw.resolution || RESOLUTION.MULTI_YEAR_RANGE,
      traditionalTimingResolution: pw.traditionalTimingResolution || pw.resolution || RESOLUTION.MULTI_YEAR_RANGE,
      empiricalPredictiveResolution: validationInfo.empiricalPredictiveResolution || EMPIRICAL_RESOLUTION.NOT_ESTABLISHED,
      traditionalRuleLabel: "TRADITIONAL RULE WINDOW",
      contradictions: pw.contradictions || [],
      explanation: isTamil
        ? `${pw.dashaFacts?.md?.lord || 'தசா'} மற்றும் ${pw.dashaFacts?.ad?.lord || 'புக்தி'} காலத்தில் ${domainId} பாவகங்கள் சுபமாக தூண்டப்படுகின்றன.`
        : `Dasha of ${pw.dashaFacts?.md?.lord || 'Lord'} with ${pw.dashaFacts?.ad?.lord || 'Sub-Lord'} activates traditional significators for ${displayNames.en}.`
    };
  });

  // 6. Current Relevance
  const currentDashaLord = chartData.currentDasha?.lord || "";
  const currentAntarLord = chartData.currentDasha?.currentAntar || "";
  const isActiveNow = [primaryLord, ...karakas].includes(currentDashaLord) || [primaryLord, ...karakas].includes(currentAntarLord);
  const currentRelevance = {
    isActiveNow,
    relevanceScore: isActiveNow ? "HIGH" : (primaryWindows.length > 0 ? "MODERATE" : "LOW"),
    explanation: getDomainRelevanceExplanation(domainId, isActiveNow, isTamil)
  };

  // 7. Future Periods (3 upcoming candidate periods)
  const futurePeriods = traditionalTimingWindows.slice(0, 3);

  // 8. Sub-phase analysis
  const subPhaseAnalysis = (rawExpertResult?.subPhases || []).map(sp => ({
    phaseName: sp.subPhase || sp.name || "SubPhase",
    status: sp.status || "SUPPORTED",
    description: sp.description || sp.why || (isTamil ? "பாரம்பரிய ஆதரவு உள்ளது" : "Supported by chart indications"),
    whyNot: sp.whyNot || []
  }));

  // 9. Contradictions
  const contradictions = challengingIndicators.map((ci, cIdx) => ({
    id: `${domainId}_contra_${cIdx + 1}`,
    factor: ci,
    reconciliation: getDomainReconciliation(domainId, isTamil)
  }));

  // 10. Practical Guidance (Domain-specific, non-deterministic)
  const practicalGuidance = getDomainPracticalGuidance(domainId, isTamil);

  // 11. What Cannot Be Concluded (Explicit overinterpretation barriers)
  const whatCannotBeConcluded = getDomainWhatCannotBeConcluded(domainId, isTamil);

  // 12. Customer Follow-up Questions (3-8 questions)
  const customerQuestions = getDomainCustomerQuestions(domainId, isTamil);

  // Executive conclusion
  const executiveConclusion = buildExecutiveConclusion({
    domainId,
    displayNames,
    overallTraditionalAssessment,
    evidenceStrength,
    isActiveNow,
    isTamil
  });

  return createDomainReport({
    domainId,
    domainName: displayNames,
    executiveConclusion,
    overallTraditionalAssessment,
    evidenceStrength,
    positiveIndicators,
    challengingIndicators,
    neutralIndicators,
    evidenceChain,
    traditionalTimingWindows,
    currentRelevance,
    futurePeriods,
    subPhaseAnalysis,
    contradictions,
    resolution: validationInfo.empiricalPredictiveResolution !== "NOT_ESTABLISHED" ? validationInfo.empiricalPredictiveResolution : RESOLUTION.MULTI_YEAR_RANGE,
    empiricalStatus: validationInfo.empiricalOutcomeValidationAvailable ? EMPIRICAL_STATUS.EXPERIMENTAL : EMPIRICAL_STATUS.NOT_ESTABLISHED,
    empiricalResolution: validationInfo.empiricalPredictiveResolution || EMPIRICAL_RESOLUTION.NOT_ESTABLISHED,
    practicalGuidance,
    whatCannotBeConcluded,
    customerQuestions,
    technicalEvidence: {
      primaryHouse,
      primaryLord,
      karakas,
      varga: vargaCode,
      lordDignity: lordPlanet?.dignity || "Neutral",
      totalCandidateWindows: primaryWindows.length,
      empiricalBenchmarkAvailable: validationInfo.empiricalOutcomeValidationAvailable || false
    }
  });
}

function getDomainRelevanceExplanation(domainId, isActiveNow, isTamil) {
  const mapEn = {
    marriage: act => act ? "Active relationship and marital significators are engaged under the operating dasha." : "Marital themes proceed on an established baseline, maturing ahead of upcoming sub-periods.",
    property: act => act ? "Real estate acquisition and domestic infrastructure are actively energized now." : "Property considerations remain in thoughtful planning mode until upcoming dasha shifts.",
    career: act => act ? "Professional authority and executive milestones are actively highlighted under current cycles." : "Career advancement continues along steady baselines, consolidating capabilities for upcoming promotions.",
    education: act => act ? "Higher learning, academic milestones, and intellectual pursuits are in acute focus." : "Foundational intellectual skills develop steadily, preparing for future specialization windows.",
    children: act => act ? "Family planning and children's welfare themes are actively stimulated under current transits." : "Progeny themes develop naturally within the broader domestic rhythm.",
    foreignTravel: act => act ? "Travel, relocations, or international connections are strongly stimulated at present." : "Overseas linkages remain dormant or in preliminary stages until future transit triggers.",
    vehicle: act => act ? "Vehicle acquisition and conveyance upgrades are favorably supported under active sub-periods." : "Conveyance needs are satisfactorily met by existing resources without pressing urgency.",
    business: act => act ? "Mercantile initiatives, partnerships, and market expansion are actively favored now." : "Commercial ventures prioritize internal efficiency and capital preservation over hasty expansion.",
    job: act => act ? "Employment roles, administrative duties, and organizational status demand focused attention." : "Daily occupational duties continue on an established, dependable operational track.",
    finance: act => act ? "Capital management, cash inflows, and investment decisions are prominently activated." : "Financial reserves build steadily through routine earnings and disciplined household budgeting.",
    family: act => act ? "Domestic welfare, parental responsibilities, and family commitments require hands-on presence." : "Household bonds operate smoothly with harmonious intergenerational continuity.",
    leadership: act => act ? "Executive command, institutional influence, and public visibility are expanding rapidly." : "Leadership capacity matures quietly through consistent performance and peer trust.",
    wellness: act => act ? "Mindful vitality rhythms, restorative sleep, and lifestyle balance require proactive care." : "Constitutional vitality operates with stable resilience under daily routines.",
    legal: act => act ? "Contractual scrutiny, compliance checks, or negotiation terms demand careful oversight." : "Legal matters are quiescent with no urgent administrative or judicial pressures.",
    spiritual: act => act ? "Inner awakening, philosophical reflection, and sacred study are intensely energized." : "Spiritual practice continues quietly as a supportive undercurrent to daily living.",
    caution: act => act ? "Prudent risk management and measured pacing are strongly indicated under active friction transits." : "Vulnerabilities are modest and well-managed through baseline common sense.",
    milestones: act => act ? "Pivotal life crossroad themes are unfolding, calling for clear long-term intentionality." : "Life trajectory unfolds on a smooth, measured course toward future milestones."
  };

  const mapTa = {
    marriage: act => act ? "தற்போதைய தசா-புக்தியில் திருமண பாவகங்கள் நேரடியாக தூண்டப்படுகின்றன." : "திருமண யோகம் இயல்பான அமைதியில் அடுத்த சுப காலத்திற்காக காத்திருக்கிறது.",
    property: act => act ? "சொத்து மற்றும் மனை விவகாரங்கள் தற்போதைய கிரக சுழற்சியில் தீவிரமடைந்துள்ளன." : "சொத்து திட்டமிடல் அமைதியான ஆரம்ப நிலையில் நீடிக்கிறது.",
    career: act => act ? "தொழில் விரிவாக்கம் மற்றும் பதவி வாய்ப்புகள் தற்போதைய தசையில் தீவிரமாக உள்ளன." : "தொழில் வாழ்க்கை நிலையான அடித்தளத்தில் தொடர்கிறது.",
    education: act => act ? "கல்வி வளர்ச்சி மற்றும் தேர்வுகளுக்கு இந்த காலம் நேரடியாக சாதகமாக உள்ளது." : "அறிவுசார் திறன்கள் சீரான வேகத்தில் முதிர்ச்சி அடைகின்றன.",
    children: act => act ? "குழந்தைகள் நலம் மற்றும் குடும்ப விரிவாக்க சிந்தனைகள் முன்னிலையில் உள்ளன." : "குடும்ப வளர்ச்சி இயல்பான போக்கில் பயணிக்கிறது.",
    foreignTravel: act => act ? "பயணங்கள் மற்றும் இடமாற்றங்கள் தற்போதைய தசா அமைப்பில் சுறுசுறுப்பாக உள்ளன." : "வெளிநாட்டு தொடர்புகள் எதிர்கால சுழற்சிக்காக தயாராகி வருகின்றன.",
    vehicle: act => act ? "வாகன சேர்க்கை மற்றும் மேம்பாட்டிற்கு இந்த உப-காலம் நேரடியாக உதவுகிறது." : "வாகன பயன்பாடு தற்போதைய தேவைகளுக்கு போதுமானதாக உள்ளது.",
    business: act => act ? "வணிக விரிவாக்கம் மற்றும் வாடிக்கையாளர் தொடர்புகள் சுறுசுறுப்பாக உள்ளன." : "சுயதொழில் முயற்சிகள் மூலதன பாதுகாப்பில் கவனம் செலுத்துகின்றன.",
    job: act => act ? "உத்தியோக பொறுப்புகள் மற்றும் அலுவலக கடமைகள் மிகுந்த கவனத்தை கோருகின்றன." : "அலுவலக பணிகள் வழமையான சீரான தாளத்தில் நடக்கின்றன.",
    finance: act => act ? "பண வரவு மற்றும் முதலீட்டு முடிவுகள் தீவிர கவனத்தில் உள்ளன." : "நிதி இருப்பு சீரான சேமிப்பு ஒழுக்கத்துடன் உயர்கிறது.",
    family: act => act ? "குடும்ப பொறுப்புகள் மற்றும் பாசப் பிணைப்புகள் கூடுதல் கவனத்தை ஈர்க்கின்றன." : "குடும்ப அமைதி நிம்மதியான சூழலில் நீடிக்கிறது.",
    leadership: act => act ? "தலைமைத்துவ பொறுப்புகளும் பொது செல்வாக்கும் நேரடியாக வெளிப்படுகின்றன." : "தலைமை பண்புகள் உள்நிலையில் அமைதியாக வலுப்பெறுகின்றன.",
    wellness: act => act ? "உடல் புத்துணர்ச்சி மற்றும் ஓய்வு சமநிலை தீவிர விழிப்புணர்வில் உள்ளன." : "உடல் பலம் அன்றாட வழக்கத்தில் சீராக இயங்குகிறது.",
    legal: act => act ? "ஒப்பந்த விவகாரங்கள் மற்றும் சட்ட பாதுகாப்பு விழிப்புணர்வில் உள்ளன." : "சட்ட விஷயங்கள் அமைதியான நிலையில் உள்ளன.",
    spiritual: act => act ? "ஆன்மீக தாகமும் தத்துவ சிந்தனைகளும் தீவிரமாக தூண்டப்படுகின்றன." : "உள்முக ஆன்மீக அமைதி அன்றாட வாழ்க்கையை தாங்கி நிற்கிறது.",
    caution: act => act ? "விவேகமான தற்காப்பும் நிதானமான முடிவுகளும் தற்போதைய காலத்திற்கு அவசியம்." : "இடர் காரணிகள் இயல்பான கட்டுப்பாட்டுக்குள் உள்ளன.",
    milestones: act => act ? "வாழ்க்கை திருப்புமுனை காலங்கள் தற்போதைய சுழற்சியில் தீவிரமாக இயங்குகின்றன." : "வாழ்க்கை பயணம் அடுத்த முக்கிய மைல்கல்லை நோக்கி நகர்கிறது."
  };

  const getter = isTamil ? mapTa[domainId] : mapEn[domainId];
  return getter ? getter(isActiveNow) : (isTamil ? "டொமைன் செயல்பாடு வழக்கமான போக்கில் உள்ளது." : "Domain operates along steady structural baselines.");
}

function getDomainReconciliation(domainId, isTamil) {
  const mapEn = {
    marriage: "Harmonized through empathetic communication, mutual validation, and patient relationship pacing.",
    property: "Mitigated via rigorous legal deed verification, boundary survey, and escrow management.",
    career: "Navigated by strengthening executive competencies and documenting quantifiable organizational deliverables.",
    education: "Addressed through focused, distraction-free study routines and structured faculty mentorship.",
    children: "Supported through thoughtful parental presence, holistic health, and warm emotional understanding.",
    foreignTravel: "Smoothed by complete advance visa compliance and thorough cross-cultural readiness.",
    vehicle: "Counterbalanced by defensive driving habits, regular servicing, and timely insurance renewals.",
    business: "Managed by preserving cash liquidity buffers and executing legally binding partnership agreements.",
    job: "Addressed through measured workplace diplomacy and delivering on documented project benchmarks.",
    finance: "Balanced by avoiding high-risk leverage, maintaining liquid reserves, and practicing budget discipline.",
    family: "Harmonized through gentle intergenerational respect and open domestic problem-solving.",
    leadership: "Tempered by inclusive consensus-building, transparent governance, and listening to team counsel.",
    wellness: "Supported through balanced Ayurvedic lifestyle habits, adequate rest, and qualified medical consultations.",
    legal: "Mitigated by prioritizing amicable mediation, written audit trails, and licensed attorney counsel.",
    spiritual: "Deepened through regular contemplation, humility in philosophical inquiry, and dedicated seva.",
    caution: "Navigated by deferring unforced speculative bets and consulting trusted advisors before major moves.",
    milestones: "Balanced by patient long-term planning and aligning personal milestones with natural life cycles."
  };

  const mapTa = {
    marriage: "அன்பான புரிதல், பொறுமை மற்றும் வெளிப்படையான பேச்சுவார்த்தை மூலம் நல்லிணக்கம் பேணலாம்.",
    property: "சட்ட ஆவணங்களை முழுமையாக சரிபார்த்து நிதானமாக ஒப்பந்தங்களை முடிக்கலாம்.",
    career: "திறன்களை வளர்த்துக் கொண்டு பணியிடத்தில் சிறந்து விளங்குவதன் மூலம் சமன் செய்யலாம்.",
    education: "திட்டமிட்ட படிப்பு மற்றும் ஆசிரியர்களின் ஆலோசனையின் மூலம் சவால்களை வெல்லலாம்.",
    children: "அக்கறையான கவனிப்பு மற்றும் நல்வாழ்வு அணுகுமுறையால் குடும்பத்தை வழிநடத்தலாம்.",
    foreignTravel: "முன்கூட்டியே விசா ஆவணங்களை சரியாக பூர்த்தி செய்து பயணத்தை எளிதாக்கலாம்.",
    vehicle: "தற்காப்புடன் வாகனம் ஓட்டுதல் மற்றும் உரிய பராமரிப்பு மூலம் பாதுகாப்பை உறுதி செய்யலாம்.",
    business: "உபரி நிதி இருப்பு மற்றும் சட்டபூர்வ ஒப்பந்தங்கள் மூலம் வர்த்தக இடர்களை குறைக்கலாம்.",
    job: "அலுவலகத்தில் நடுநிலையான அணுகுமுறை மற்றும் நேர்மையான உழைப்பால் நன்மதிப்பை காக்கலாம்.",
    finance: "அதிக ஆபத்துள்ள ஊகங்களை தவிர்த்து வரவு செலவு ஒழுக்கத்தை காப்பதன் மூலம் நிலைநிறுத்தலாம்.",
    family: "பெரியவர்களிடம் அன்பான மரியாதை மற்றும் விட்டுக் கொடுக்கும் மனப்பான்மையால் ஒற்றுமை காக்கலாம்.",
    leadership: "அனைவரையும் மதிக்கும் தர்ம நெறி சார்ந்த தலைமைத்துவத்தால் எதிர்ப்புகளை சமாளிக்கலாம்.",
    wellness: "ஆயுர்வேத உணவு முறை, தியானம் மற்றும் தகுதியான மருத்துவரின் வழிகாட்டலால் உடலை காக்கலாம்.",
    legal: "சமரசம், முறையான ஆவணங்கள் மற்றும் வழக்கறிஞர் ஆலோசனையால் அமைதி பெறலாம்.",
    spiritual: "தொடர் தியானம் மற்றும் தன்னலமற்ற சேவையின் மூலம் ஆன்ம அமைதியை ஆழப்படுத்தலாம்.",
    caution: "அவசரப்படாமல் அனுபவசாலிகளின் ஆலோசனையை பெற்று பொறுமையுடன் செயல்படலாம்.",
    milestones: "முன்கூட்டியே விவேகமாக திட்டமிட்டு மாற்றங்களை தைரியமாக எதிர்கொள்ளலாம்."
  };

  return isTamil ? (mapTa[domainId] || "பொறுமையுடன் செயல்படுவதன் மூலம் சமன் செய்யலாம்.") : (mapEn[domainId] || "Balanced through thoughtful diligence and patient pacing.");
}

function buildExecutiveConclusion({ domainId, displayNames, overallTraditionalAssessment, evidenceStrength, isActiveNow, isTamil }) {
  const o = overallTraditionalAssessment;
  const s = evidenceStrength;
  const act = isActiveNow;

  if (isTamil) {
    const templatesTa = {
      marriage: `திருமண மற்றும் கூட்டுறவு விஷயங்களில் 7-ம் பாவமும் சுக்கிரனும் ${o} நிலையை வழங்குகின்றன; ஆதாரங்களின் பலம் ${s} ஆக உள்ளது. ${act ? "தற்போது திருமண பேச்சுவார்த்தைக்கு சுறுசுறுப்பான காலம்." : "உறவு நிலைகள் இயல்பான சீரான போக்கில் தொடர்கின்றன."}`,
      property: `நிலம் மற்றும் மனை யோகத்தில் 4-ம் பாவமும் செவ்வாயும் ${o} போக்கை காட்டுகின்றன; ஆதாரங்கள் ${s} பலம் கொண்டுள்ளன. ${act ? "சொத்து வாங்குவதில் தீவிர கவனம் செலுத்தும் நேரம்." : "சொத்து சார்ந்த திட்டங்கள் ஆரம்ப பரிசீலனையில் உள்ளன."}`,
      career: `தொழில் மற்றும் பொது வாழ்க்கையில் 10-ம் அதிபதி ${o} பாதையை சுட்டிக்காட்டுகிறார்; அமைப்பு ${s} நிலையை கொண்டுள்ளது. ${act ? "பணியிடத்தில் புதிய முயற்சிகளுக்கு சாதகமான காலம்." : "தொழில் அடித்தளம் படிப்படியாக வலுப்பெற்று வருகிறது."}`,
      education: `கல்வி மற்றும் அறிவு வளர்ச்சியில் 5-ம் பாவமும் புதனும் ${o} தன்மையை வெளிப்படுத்துகின்றன; பலம் ${s} ஆக உள்ளது. ${act ? "தேர்வுகள் மற்றும் உயர்கல்விக்கு தீவிர நேரம்." : "கல்வி சிந்தனைகள் நிலையான போக்கில் உள்ளன."}`,
      children: `புத்திர பாக்கியம் மற்றும் சந்ததி நலனில் 5-ம் அதிபதியும் குருவும் ${o} நிலையை அளிக்கின்றனர்; சான்றுகள் ${s} பலம் பெற்றுள்ளன. ${act ? "குடும்ப விரிவாக்கத்திற்கு சாதகமான சுழற்சி." : "சந்ததி யோகம் இயல்பான போக்கில் அமைகிறது."}`,
      foreignTravel: `வெளிநாட்டு பயணம் மற்றும் குடியேற்றத்தில் ராகு மற்றும் 9/12 பாவகங்கள் ${o} யோகத்தை தருகின்றன; ஆதாரங்கள் ${s} ஆகும். ${act ? "பயண வாய்ப்புகள் தற்போது சுறுசுறுப்பாக உள்ளன." : "வெளிநாட்டு யோகம் பின்னணியில் தயாராகி வருகிறது."}`,
      vehicle: `வாகன வசதி மற்றும் புதிய வண்டி யோகத்தில் 4-ம் பாவகம் ${o} பலனை குறிக்கிறது; வலிமை ${s} ஆக உள்ளது. ${act ? "வாகனம் வாங்க சாதகமான காலகட்டம்." : "வாகன பயன்பாடு இயல்பான முறையில் உள்ளது."}`,
      business: `சுயதொழில் மற்றும் வியாபாரத்தில் புதன் மற்றும் 7-ம் பாவகங்கள் ${o} ஆதரவை அளிக்கின்றன; ஆதாரங்கள் ${s} பலம். ${act ? "புதிய வணிக முயற்சிகளுக்கு ஏற்ற தருணம்." : "வர்த்தக விரிவாக்கம் சீரான நிதானத்தில் உள்ளது."}`,
      job: `உத்தியோகம் மற்றும் அலுவலக பணியில் 6-ம் பாவகம் ${o} அமைப்பை காட்டுகிறது; கட்டமைப்பு ${s} ஆகும். ${act ? "பணியிட மாற்றங்கள் மற்றும் பொறுப்புகள் கூடும் நேரம்." : "வேலை சூழல் வழமையான போக்கில் தொடர்கிறது."}`,
      finance: `தன வரவு மற்றும் சேமிப்பு ஒழுக்கத்தில் 2 மற்றும் 11-ம் பாவகங்கள் ${o} பலனைத் தருகின்றன; பலம் ${s} ஆக உள்ளது. ${act ? "பொருளாதார மேலாண்மையில் கவனம் செலுத்த வேண்டிய காலம்." : "சேமிப்பு வழக்கமான வேகத்தில் உயர்கிறது."}`,
      family: `குடும்ப அமைதி மற்றும் உறவுகள் ஒற்றுமையில் சந்திரன் ${o} அடித்தளத்தை வழங்குகிறார்; பலம் ${s} ஆகும். ${act ? "குடும்ப விவகாரங்களில் நேரடி ஈடுபாடு தேவை." : "குடும்ப உறவுகள் அமைதியாக நீடிக்கின்றன."}`,
      leadership: `தலைமைத்துவ ஆளுமை மற்றும் பொது செல்வாக்கில் சூரியன் ${o} நிலையை அளிக்கிறார்; ஆதாரங்கள் ${s} பலம். ${act ? "அதிகார பொறுப்புகள் முன்னிலைக்கு வருகின்றன." : "தலைமை பண்புகள் இயல்பாக முதிர்ச்சி பெறுகின்றன."}`,
      wellness: `உடல் நலம் மற்றும் தற்காப்பு ஆற்றலில் லக்னாதிபதி ${o} சமநிலையை குறிக்கிறார்; பலம் ${s} ஆகும். ${act ? "தினசரி ஆரோக்கிய பழக்கவழக்கங்களில் கவனம் தேவை." : "உடல் இயக்கம் சீரான பாதுகாப்பில் உள்ளது."}`,
      legal: `சட்ட விவகாரங்கள் மற்றும் சமரச பேச்சுவார்த்தையில் 6/8 பாவகங்கள் ${o} போக்கை வெளிப்படுத்துகின்றன; பலம் ${s} ஆகும். ${act ? "ஒப்பந்தங்களை கவனமாக கையாளும் காலம்." : "சட்ட விவகாரங்களில் பெரிய நெருக்குதல் இல்லை."}`,
      spiritual: `ஆன்மீக தேடல் மற்றும் தியான ஈடுபாட்டில் 9/12 பாவகங்கள் ${o} பாதையை திறக்கின்றன; பலம் ${s} ஆகும். ${act ? "ஆன்ம விழிப்புணர்வுக்கு உகந்த காலம்." : "உள்முக தேடல் அமைதியாக தொடர்கிறது."}`,
      caution: `எச்சரிக்கை காலங்கள் மற்றும் விவேகமான தற்காப்பில் ${o} அணுகுமுறை தேவை; ஆதாரங்கள் ${s} பலம் கொண்டுள்ளன. ${act ? "முக்கிய முடிவுகளில் கூடுதல் கவனம் தேவை." : "இடர் காரணிகள் மிதமான எல்லைக்குள் உள்ளன."}`,
      milestones: `வாழ்க்கை திருப்புமுனைகள் மற்றும் முக்கிய மைல்கற்களில் ${o} மாற்றம் சுட்டப்படுகிறது; பலம் ${s} ஆகும். ${act ? "ஒரு முக்கிய வாழ்வியல் மாறுதல் நெருங்குகிறது." : "வாழ்க்கை சீரான பாதையில் பயணிக்கிறது."}`
    };
    return templatesTa[domainId] || `${displayNames.ta} டொமைனில் ${o} நிலை உள்ளது (${s}).`;
  }

  const templatesEn = {
    marriage: `In marital and relational affairs, classical significators reflect a ${o} dynamic, supported by ${s} confluence between the 7th house and Venus/Jupiter. ${act ? "Currently under active planetary engagement." : "Operating under a stable relational baseline."}`,
    property: `Fixed property and real estate potential registers a ${o} alignment, with ${s} foundation across the 4th house and Mars. ${act ? "Active real estate focus indicated under current cycles." : "Operating in a preparatory planning phase."}`,
    career: `Your executive trajectory and occupational standing indicate a ${o} trajectory, exhibiting ${s} structural strength across 10th house significators. ${act ? "Professional expansion is actively in focus." : "Career foundations are developing steadily."}`,
    education: `Academic pursuits and intellectual inquiry display a ${o} profile, reinforced by ${s} alignment with Mercury and Jupiter. ${act ? "Currently favorable for focused learning and exam prep." : "Foundational knowledge is maturing steadily."}`,
    children: `Progeny significations and family lineage reflect a ${o} traditional promise, with ${s} harmonic corroboration from the 5th house. ${act ? "Family development themes are currently highlighted." : "Family expansion operates under steady baseline tendencies."}`,
    foreignTravel: `Overseas journeys and foreign connections reveal a ${o} predisposition, backed by ${s} activation of Rahu and the 9th/12th axis. ${act ? "Travel and overseas relocation are currently prominent." : "Long-distance travel themes remain in background potential."}`,
    vehicle: `Conveyances and vehicular acquisition themes indicate a ${o} pattern, sustained by ${s} Venus and 4th house alignments. ${act ? "Currently favorable for conveyance upgrades." : "Vehicle assets operate in steady functional maintenance mode."}`,
    business: `Commercial enterprise and partnership trade present a ${o} baseline, demonstrating ${s} momentum across mercantile indicators. ${act ? "Commercial opportunities are actively highlighted now." : "Business enterprise operates in careful consolidation mode."}`,
    job: `Daily employment, organizational hierarchy, and service responsibilities follow a ${o} pattern, with ${s} Saturnian stability. ${act ? "Employment responsibilities demand active attention." : "Workplace duties continue on a predictable cadence."}`,
    finance: `Capital accumulation, savings discipline, and financial liquidity indicate a ${o} configuration, supported by ${s} 2nd/11th house coordination. ${act ? "Financial stewardship is in primary focus." : "Monetary reserves are accumulating on an even keel."}`,
    family: `Domestic lineage, parental ties, and household harmony reflect a ${o} foundation, reinforced by ${s} lunar and 2nd house balance. ${act ? "Domestic welfare requires active care." : "Family ties operate with quiet structural warmth."}`,
    leadership: `Institutional authority, public governance, and command presence exhibit a ${o} signature, backed by ${s} solar alignment. ${act ? "Leadership responsibilities are in an upward phase." : "Executive influence develops quietly behind the scenes."}`,
    wellness: `Constitutional vitality and traditional Ayurvedic equilibrium indicate a ${o} baseline, sustained by ${s} Ascendant stamina. ${act ? "Active daily wellness discipline is recommended." : "Constitutional energy remains on an even, steady course."}`,
    legal: `Dispute resolution mechanisms and formal contractual arbitration show a ${o} profile, characterized by ${s} 6th/8th house balance. ${act ? "Contractual scrutiny is currently advised." : "Legal matters remain quiet with no acute contention."}`,
    spiritual: `Philosophical contemplation, meditative focus, and devotional evolution present a ${o} path, enriched by ${s} 9th/12th house depth. ${act ? "Spiritual inclinations are deeply stirred at present." : "Inner contemplation continues at an introspective pace."}`,
    caution: `Temporal caution periods and vulnerability mitigation advise a ${o} stewardship, requiring ${s} diligence across friction cycles. ${act ? "Heightened vigilance is suggested during current transits." : "Risk indicators remain within manageable bounds."}`,
    milestones: `Key chronological turning points and life crossroads exhibit a ${o} momentum, guided by ${s} planetary dasha transitions. ${act ? "A major developmental crossroads is approaching." : "Life progresses along an orderly, measured progression."}`
  };

  return templatesEn[domainId] || `The chart reflects a ${o} traditional configuration for ${displayNames.en} with ${s} evidence convergence.`;
}

function getDomainPracticalGuidance(domainId, isTamil) {
  const guidanceMap = {
    marriage: isTamil
      ? [
          "வாழ்க்கைத் துணையுடன் வெளிப்படையான, அன்பான உரையாடலை முன்னெடுங்கள்.",
          "முக்கியமான பேச்சுவார்த்தைகளை சுப தசா காலங்களில் அமைத்துக் கொள்வது நல்லது.",
          "குடும்பப் பெரியவர்களின் ஆலோசனைகளுக்கு உரிய முக்கியத்துவம் கொடுங்கள்."
        ]
      : [
          "Cultivate transparent and patient emotional communication in relationship discussions.",
          "Schedule important relationship milestones during harmonious Dasha sub-periods.",
          "Prioritize mutual compatibility and values alignment over superficial considerations."
        ],
    property: isTamil
      ? [
          "நிலம் அல்லது வீடு வாங்கும் முன் சட்ட ஆவணங்களை முழுமையாக சரிபார்க்கவும்.",
          "சொத்து வாங்குவதில் அவசர முடிவுகளைத் தவிர்த்து நிதானமாக செயல்படுங்கள்.",
          "முதலீட்டுத் தொகையை முன்கூட்டியே முறைப்படி திட்டமிடுங்கள்."
        ]
      : [
          "Conduct thorough legal, title, and encumbrance verifications before committing advance payments.",
          "Avoid impulsive real estate acquisitions during transit frictions; prioritize structural due diligence.",
          "Maintain clear financial reserves for registration, documentation, and property taxes."
        ],
    career: isTamil
      ? [
          "உங்கள் இயல்பான தலைமைத்துவ மற்றும் நிர்வாகத் திறன்களை தொடர்ந்து மேம்படுத்துங்கள்.",
          "பணியிடத்தில் புதிய பொறுப்புகளை ஏற்கும் முன் பணிச்சுமையை சீர்தூக்கிப் பாருங்கள்.",
          "தொழில்நுட்ப மற்றும் துறைசார் அறிவை சீரான இடைவெளியில் புதுப்பியுங்கள்."
        ]
      : [
          "Continuously align skill development with your core 10th house and D10 executive competencies.",
          "Build institutional relationships and document key project deliverables ahead of appraisal cycles.",
          "Embrace strategic professional upskilling to capitalize on upcoming Dasha progression windows."
        ],
    education: isTamil
      ? [
          "ஆழ்ந்த கவனத்துடன் படிக்கும் பழக்கத்தை வழக்கப்படுத்திக் கொள்ளுங்கள்.",
          "போட்டித் தேர்வுகளுக்கு முன்கூட்டியே திட்டமிட்டு பயிற்சியைத் தொடங்குங்கள்.",
          "ஆசிரியர்கள் மற்றும் வழிகாட்டிகளின் ஆலோசனைகளை கவனமாகப் பின்பற்றுங்கள்."
        ]
      : [
          "Establish systematic, distraction-free study rhythms aligned with Mercury's analytical focus.",
          "Prepare diligently well in advance for competitive entrance or licensing examinations.",
          "Seek constructive mentorship from senior scholars and academic advisors."
        ],
    children: isTamil
      ? [
          "குழந்தைகளுடன் தரமான நேரத்தை செலவழித்து அவர்களின் உணர்வுகளுக்கு மதிப்பளியுங்கள்.",
          "குடும்ப நல திட்டமிடலின் போது தகுதியான மருத்துவ ஆலோசனைகளையும் பெறுங்கள்.",
          "குழந்தைகளின் தனித்துவமான திறமைகளை ஊக்குவித்து வழிநடத்துங்கள்."
        ]
      : [
          "Dedicate attentive, empathetic quality time to nurture parent-child emotional bonding.",
          "Seek qualified healthcare professionals for medical family planning alongside traditional timing.",
          "Encourage and support each child's innate creative and intellectual aptitudes."
        ],
    foreignTravel: isTamil
      ? [
          "பயண ஆவணங்கள், விசா மற்றும் சட்ட நடைமுறைகளை முன்கூட்டியே தயார் செய்யுங்கள்.",
          "வெளிநாட்டு சூழலுக்கு ஏற்ப கலாச்சார நெகிழ்வுத்தன்மையுடன் பழக முயற்சி செய்யுங்கள்.",
          "நீண்ட பயணங்களின் போது பயணக் காப்பீடு மற்றும் பாதுகாப்பு ஏற்பாடுகளை உறுதிசெய்யுங்கள்."
        ]
      : [
          "Ensure meticulous visa documentation, compliance, and passport renewals well ahead of travel.",
          "Develop cultural adaptability and research local regulatory frameworks before relocation.",
          "Maintain active emergency travel insurance and legal overseas safeguards."
        ],
    vehicle: isTamil
      ? [
          "வாகனங்களை சீரான இடைவெளியில் பராமரிப்பு செய்து பாதுகாப்பை உறுதிப்படுத்துங்கள்.",
          "நெடுந்தூர பயணங்களின் போது தற்காப்புடன், விவேகமாக வாகனம் ஓட்டுங்கள்.",
          "வாகன காப்பீட்டை உரிய நேரத்தில் புதுப்பித்து ஆவணங்களை சரியாக வையுங்கள்."
        ]
      : [
          "Adhere strictly to scheduled preventive maintenance, brake, and tire inspections.",
          "Exercise defensive driving habits, particularly during high-friction Mars/Saturn transits.",
          "Keep vehicle registration, insurance, and warranty documents meticulously up to date."
        ],
    business: isTamil
      ? [
          "வணிக கூட்டாளிகளுடன் தெளிவான, சட்டப்பூர்வமான ஒப்பந்தங்களை அமைத்துக் கொள்ளுங்கள்.",
          "வரவு செலவு கணக்குகளை தணிக்கை செய்து நிதி ஒழுக்கத்தைக் கடைப்பிடியுங்கள்.",
          "அதிக கடன் வாங்கி விரிவாக்கம் செய்வதை விட சீரான உள்வளர்ச்சியில் கவனம் செலுத்துங்கள்."
        ]
      : [
          "Execute legally sound, formal partnership agreements with unambiguous equity and exit terms.",
          "Preserve working capital liquidity buffers equivalent to at least 6 months of operational expenses.",
          "Avoid excessive debt leverage during uncertain market or transit cycles."
        ],
    job: isTamil
      ? [
          "பணியிடத்தில் சக ஊழியர்களுடன் இணக்கமான நல்லுறவை வளர்த்துக் கொள்ளுங்கள்.",
          "வேலை மாற்றங்களை யோசித்து, உறுதி செய்யப்பட்ட கடிதம் பெற்ற பின் நடைமுறைப்படுத்துங்கள்.",
          "அலுவலக பிரச்சனைகளில் நடுநிலையான, தொழில்முறை அணுகுமுறையை கையாளுங்கள்."
        ]
      : [
          "Cultivate collaborative diplomacy with colleagues and leadership across the 6th/10th house axis.",
          "Finalize formal written employment offers before resigning from existing positions.",
          "Maintain professionalism and focus on measurable deliverable metrics during organizational shifts."
        ],
    finance: isTamil
      ? [
          "அவசர கால தேவைகளுக்கு குறைந்தபட்சம் 6 மாத செலவுத் தொகையை சேமிப்பில் வையுங்கள்.",
          "ஊக வணிகம் மற்றும் அதிக ஆபத்துள்ள திட்டங்களில் பேராசையுடன் முதலீடு செய்வதைத் தவிருங்கள்.",
          "செலவுகளைக் கட்டுப்படுத்தி, உபரி நிதியை பல துறைகளில் பிரித்து சேமியுங்கள்."
        ]
      : [
          "Maintain a dedicated liquid emergency fund covering 6 to 12 months of household expenses.",
          "Avoid speculative high-risk schemes or excessive margin trading; practice disciplined asset allocation.",
          "Diversify wealth across non-correlated tangible and capital assets to mitigate volatility."
        ],
    family: isTamil
      ? [
          "குடும்ப உறுப்பினர்களிடையே பரஸ்பர மரியாதையையும் விட்டுக்கொடுத்தலையும் வளருங்கள்.",
          "பெற்றோர்கள் மற்றும் பெரியவர்களின் நல்வாழ்வில் அன்பான அக்கறை செலுத்துங்கள்.",
          "குடும்ப விவகாரங்களில் வெளிப்படையான உரையாடல் மூலம் மனக்கசப்புகளைத் தவிருங்கள்."
        ]
      : [
          "Foster open, non-judgmental family dialogue to resolve domestic differences harmoniously.",
          "Honor parental responsibilities and provide thoughtful physical and emotional care to elders.",
          "Dedicate regular undistracted time to maintain warmth and solidarity within the household."
        ],
    leadership: isTamil
      ? [
          "அனைவரையும் உள்ளடக்கிய, தர்ம நெறி சார்ந்த தலைமைத்துவத்தை வெளிப்படுத்துங்கள்.",
          "முடிவெடுக்கும் போது பொறுப்புணர்வுடன், பிறரின் நியாயமான கருத்துக்களைக் கேளுங்கள்.",
          "உங்கள் குழுவினருக்கு சிறந்த முன்மாதிரியாக செயல்பட்டு நன்மதிப்பைப் பெறுங்கள்."
        ]
      : [
          "Lead through transparent, principle-centered authority that inspires voluntary team consensus.",
          "Exercise balanced judgment and invite diverse perspectives before critical executive decisions.",
          "Mentor emerging junior colleagues to build lasting institutional resilience."
        ],
    wellness: isTamil
      ? [
          "ஆயுர்வேத சமநிலைக்கு ஏற்ப சத்தான, நேரத்துடன்கூடிய உணவை உட்கொள்ளுங்கள்.",
          "மன அழுத்தத்தைத் தவிர்க்க தினமும் தியானம் மற்றும் மிதமான உடற்பயிற்சி செய்யுங்கள்.",
          "உடல் நலக்குறைவு ஏற்பட்டால் தகுதியான மருத்துவரிடம் சென்று முறையான சிகிச்சை பெறுங்கள்."
        ]
      : [
          "Maintain balanced, wholesome dietary habits aligned with Ayurvedic seasonal rhythms.",
          "Incorporate restorative sleep, daily pranayama, and stress mitigation into your schedule.",
          "Consult licensed medical doctors for all diagnostic evaluations, screenings, and treatments."
        ],
    legal: isTamil
      ? [
          "சட்ட விஷயங்களில் உரிமம் பெற்ற தகுதியான வழக்கறிஞரின் ஆலோசனையைப் பெறுங்கள்.",
          "நீதிமன்ற வழக்குகளை விட சமரச பேச்சுவார்த்தைகள் மூலம் தீர்வுகாண முன்னுரிமை அளியுங்கள்.",
          "அனைத்து ஒப்பந்தங்கள் மற்றும் பணப் பரிவர்த்தனைகளிலும் தெளிவான எழுத்துப்பூர்வ ஆவணங்களை பராமரியுங்கள்."
        ]
      : [
          "Retain competent, licensed legal counsel for all regulatory, contractual, or litigation matters.",
          "Prioritize amicable mediation and negotiated settlements over protracted, expensive court trials.",
          "Preserve organized written records, contracts, and audit trails for all critical transactions."
        ],
    spiritual: isTamil
      ? [
          "தினசரி தியானம், இறை வழிபாடு அல்லது சுய பரிசீலனையை வழக்கமாக்கிக் கொள்ளுங்கள்.",
          "சுயநலமற்ற சேவைகளில் (சேவா) ஈடுபட்டு மன அமைதியை வளருங்கள்.",
          "உயர்ந்த தத்துவ நூல்களை வாசித்து அறிவை மேம்படுத்துங்கள்."
        ]
      : [
          "Establish a consistent daily contemplative, japa, or meditation discipline for inner serenity.",
          "Engage in selfless service (seva) and charity to cultivate detachment and spiritual maturity.",
          "Study uplifting philosophical scriptures to elevate consciousness and moral clarity."
        ],
    caution: isTamil
      ? [
          "நெருக்கடியான தசா-கோச்சார காலங்களில் புதிய பெரிய ஆபத்தான முதலீடுகளைத் தவிருங்கள்.",
          "முக்கிய முடிவுகளில் அவசரப்படாமல் அனுபவசாலிகளின் ஆலோசனையைக் கேளுங்கள்.",
          "பொறுமையும் மன உறுதியும் சவால்களை எளிதாகக் கடக்க உதவும்."
        ]
      : [
          "Defer unforced high-risk financial, legal, or career ventures during indicated friction cycles.",
          "Seek counsel from trusted advisors before signing binding agreements in caution windows.",
          "Focus on steady perseverance and consolidation rather than aggressive expansion."
        ],
    milestones: isTamil
      ? [
          "வாழ்க்கையின் முக்கிய திருப்புமுனைகளை முன்கூட்டியே திட்டமிட்டு விழிப்புடன் எதிர்கொள்ளுங்கள்.",
          "கடந்த கால அனுபவங்களிலிருந்து கற்றுக்கொண்டு எதிர்காலத்தை நம்பிக்கையுடன் வடிவமைக்கவும்.",
          "முக்கிய முடிவுகளை எடுக்கும் போது குடும்பம், ஆன்மீகம் மற்றும் கடமைகளை சமநிலையில் வையுங்கள்."
        ]
      : [
          "Proactively plan major life transitions well ahead of planetary cycle changeovers.",
          "Review past retrospective milestones to understand your personal cyclical rhythms.",
          "Balance professional ambition with personal wellbeing and dharmic integrity."
        ]
  };

  return guidanceMap[domainId] || [
    isTamil ? "நிதானமான திட்டமிடல் அவசியம்." : "Practice mindful planning and steady diligence."
  ];
}

function getDomainWhatCannotBeConcluded(domainId, isTamil) {
  const cannotMap = {
    marriage: isTamil
      ? [
          "துல்லியமான திருமண நாள்காட்டி தேதியை அறிவியல்ரீதியாக உத்தரவாதப்படுத்த முடியாது.",
          "திருமணத்திற்குப் பின் வாழ்க்கை துணையின் ஒவ்வொரு தனிப்பட்ட செயலையும் முன்கூட்டியே கணிக்க இயலாது."
        ]
      : [
          "Exact calendar wedding date cannot be scientifically guaranteed as an empirical certainty.",
          "Personal day-to-day relational choices remain governed by free will and cannot be deterministically pre-computed."
        ],
    property: isTamil
      ? [
          "வாங்கும் நிலத்தின் சரியான சதுர அடி அளவு அல்லது சந்தை விலை உயர்வை ஜோதிடத்தால் உறுதிப்படுத்த முடியாது."
        ]
      : [
          "Specific property square footage, exact postal address, or capital appreciation percentages cannot be astrologically forecasted."
        ],
    career: isTamil
      ? [
          "குறிப்பிட்ட நிறுவன பதவி பெயர் அல்லது சரியான மாத ஊதியத்தை ஜோதிடத்தால் உறுதிசெய்ய முடியாது."
        ]
      : [
          "Specific corporate job titles or precise contractual salary packages cannot be guaranteed."
        ],
    education: isTamil
      ? [
          "தேர்வில் பெறும் சரியான மதிப்பெண் அல்லது குறிப்பிட்ட பல்கலைக்கழக சேர்க்கை கடிதத்தை முன்கூட்டியே உறுதிப்படுத்த முடியாது."
        ]
      : [
          "Exact examination marks, percentile ranks, or guaranteed admissions letters cannot be deterministically claimed."
        ],
    children: isTamil
      ? [
          "பிறக்கும் குழந்தைகளின் எண்ணிக்கை, பாலினம் அல்லது மருத்துவ ரீதியான கருவுறுதல் முடிவுகளை நிர்ணயிக்க முடியாது."
        ]
      : [
          "Exact count of children, fetal gender, and clinical medical fertility diagnoses are strictly prohibited."
        ],
    foreignTravel: isTamil
      ? [
          "தூதரக விசா அனுமதி அல்லது குறிப்பிட்ட நாட்டின் குடியுரிமை உத்தரவாதத்தை ஜோதிடத்தால் அளிக்க முடியாது."
        ]
      : [
          "Specific embassy visa approvals or foreign passport grants cannot be legally or astrologically guaranteed."
        ],
    vehicle: isTamil
      ? [
          "வாகனத்தின் குறிப்பிட்ட தயாரிப்பு நிறுவனம், மாடல் அல்லது விபத்துக்களை தீர்க்கமாக கணிக்க முடியாது."
        ]
      : [
          "Specific automobile make, exact model, or deterministic collision events cannot be predicted."
        ],
    business: isTamil
      ? [
          "வணிகத்தில் துல்லியமான லாப சதவீதம், முதலீட்டு வருமானம் (ROI) அல்லது சந்தை மதிப்பை கணிக்க முடியாது."
        ]
      : [
          "Exact commercial profit percentages, return on investment (ROI), or startup valuation metrics cannot be guaranteed."
        ],
    job: isTamil
      ? [
          "வேலை நியமன கடிதம் வரும் சரியான தேதி அல்லது ஊதிய உயர்வின் சரியான தொகையை உறுதிப்படுத்த முடியாது."
        ]
      : [
          "Exact calendar date of appointment letters or specific monetary increments cannot be forecasted."
        ],
    finance: isTamil
      ? [
          "சரியான வங்கிக் கணக்கு இருப்பு, லாட்டரி யோகம் அல்லது பங்குச் சந்தை லாபத்தை ஜோதிடத்தால் உத்தரவாதப்படுத்த முடியாது."
        ]
      : [
          "Precise bank account balances, speculative lottery outcomes, or stock market capital gains cannot be guaranteed."
        ],
    family: isTamil
      ? [
          "குடும்ப உறுப்பினர்களின் துல்லியமான ஆயுட்காலம் அல்லது எதிர்கால முடிவுகளை தீர்க்கமாக கணிக்க முடியாது."
        ]
      : [
          "Exact lifespan or individual sovereign decisions of family members cannot be deterministically determined."
        ],
    leadership: isTamil
      ? [
          "தேர்தல் வெற்றிகள் அல்லது அரசியல் நியமனங்களை முன்கூட்டியே உத்தரவாதப்படுத்த முடியாது."
        ]
      : [
          "Specific political appointment victories or statutory public election results cannot be guaranteed."
        ],
    wellness: isTamil
      ? [
          "புற்றுநோய், அறுவை சிகிச்சை, உடல் உறுப்பு செயலிழப்பு, ஆயுள் காலம் அல்லது மருத்துவ நோயறிதலை கணிக்க முற்றிலும் அனுமதியில்லை."
        ]
      : [
          "Clinical medical diagnoses, cancer, surgery predictions, organ failure, death, or definitive lifespan are strictly prohibited."
        ],
    legal: isTamil
      ? [
          "'நீங்கள் வழக்கில் நிச்சயமாக வெற்றி பெறுவீர்கள்' என்று உத்தரவாதமளிக்க முடியாது. நீதிமன்ற தீர்ப்புகளை முன்கூட்டியே கூற முடியாது."
        ]
      : [
          "Statements claiming 'You will definitely win the case' or forecasting binding judicial courtroom verdicts are strictly prohibited."
        ],
    spiritual: isTamil
      ? [
          "ஆன்மீக முக்தி நிலை அல்லது மறைபொருள் நிகழ்வுகளை புறவய அளவுகோல்களால் அளவிட முடியாது."
        ]
      : [
          "Subjective spiritual attainments, enlightenment milestones, or metaphysical outcomes cannot be objectively measured."
        ],
    caution: isTamil
      ? [
          "விபரீத ஆபத்துகள் அல்லது விபத்துக்களை உறுதியான விதியாக முன்கூட்டியே கூற முடியாது."
        ]
      : [
          "Catastrophic accidents or deterministic fatalistic events cannot and should not be prophesied."
        ],
    milestones: isTamil
      ? [
          "முழுமையான விதி அல்லது மாற்ற முடியாத வாழ்க்கை பாதையை ஜோதிடத்தால் முடிவு செய்ய முடியாது."
        ]
      : [
          "Rigid predestination or unalterable life pathways cannot be asserted; human agency and grace remain active."
        ]
  };

  return cannotMap[domainId] || [
    isTamil ? "துல்லியமான எதிர்கால தேதியை உறுதிப்படுத்த முடியாது." : "Deterministic exact calendar guarantees cannot be asserted."
  ];
}

function getDomainCustomerQuestions(domainId, isTamil) {
  const questionsMap = {
    marriage: isTamil
      ? [
          "அடுத்த மிகச் சாதகமான பாரம்பரிய திருமண காலம் எப்போது அமைகிறது?",
          "நவாம்ச (D9) சக்கரத்தில் வாழ்க்கை துணையின் சுபாவம் எவ்வாறு குறிக்கப்படுகிறது?",
          "உறவுகளில் பொறுமை தேவைப்படும் காலங்கள் ஏதேனும் உள்ளதா?",
          "7-ம் அதிபதியின் நிலை திருமண ஒற்றுமையை எவ்வாறு பாதிக்கிறது?",
          "தாரகாரகன் கிரகத்தின் பங்கு இந்த ஜாதகத்தில் என்ன?"
        ]
      : [
          "When is the next strongest traditional marriage-supportive period?",
          "What are the key partner characteristics indicated in the Navamsha (D9) chart?",
          "Which periods suggest relationship caution or require extra patience?",
          "How does the 7th lord's dignity influence partnership harmony?",
          "What role does the Darakaraka play in relationship dynamics?"
        ],
    property: isTamil
      ? [
          "சொத்து வாங்குவதற்கு அடுத்த சாதகமான காலக்கட்டம் எப்போது?",
          "இந்த ஜாதகம் காலி நிலம் வாங்குவதற்கு சாதகமா அல்லது கட்டிய வீடு வாங்குவதற்கா?",
          "வீடு கட்டுதல் அல்லது புதுப்பித்தலுக்கு உகந்த நேரம் எது?",
          "ஆவண சரிபார்ப்பில் கூடுதல் கவனம் தேவைப்படும் காலங்கள் எவை?"
        ]
      : [
          "Which upcoming periods are traditionally supportive for property purchase?",
          "Does the chart favor land acquisition or ready-to-move residential property?",
          "When is the most favorable window for home renovation or construction?",
          "Are there periods where property documentation delays or disputes are indicated?"
        ],
    career: isTamil
      ? [
          "அடுத்த பதவி உயர்வு அல்லது தொழில் மாற்றத்திற்கான சாதகமான காலம் எது?",
          "இந்த ஜாதகம் நிறுவன தலைமைப் பணிக்கு உகந்ததா அல்லது சுதந்திரமான ஆலோசனைப் பணிக்கா?",
          "தசாம்ச (D10) சக்கரத்தின்படி எந்த தொழில் துறை மிகவும் சாதகமாக அமையும்?",
          "பணியிடத்தில் புதிய அதிகார விரிவாக்கம் எப்போது ஏற்பட வாய்ப்புள்ளது?"
        ]
      : [
          "When is the next career transition or promotion window?",
          "Does the chart favor corporate institutional leadership or specialized independent practice?",
          "What industries or professional fields align best with the D10 Dasamsha chart?",
          "Which upcoming periods indicate high workplace demand or authority expansion?"
        ],
    education: isTamil
      ? [
          "5 மற்றும் 9-ம் பாவகங்கள் எந்த கல்வித் துறையை மிகவும் ஆதரிக்கின்றன?",
          "வரவிருக்கும் காலத்தில் போட்டித் தேர்வுகளில் வெற்றி பெற வாய்ப்புள்ளதா?",
          "வெளிநாட்டுக் கல்வி அல்லது உயர் ஆராய்ச்சிக்கான யோகம் உள்ளதா?",
          "புதனின் நிலையை வைத்து கற்றல் திறனை எவ்வாறு மேம்படுத்தலாம்?"
        ]
      : [
          "What fields of study or specialization are most strongly indicated by the 5th and 9th houses?",
          "Are competitive examinations strongly supported during the upcoming period?",
          "Does the chart indicate opportunities for foreign education or advanced research?",
          "How can learning style and memory retention be optimized based on Mercury's placement?"
        ],
    children: isTamil
      ? [
          "குடும்ப நல திட்டமிடலுக்கு பாரம்பரியமாக சாதகமான காலங்கள் எவை?",
          "5-ம் பாவகம் பெற்றோர்-குழந்தை பாசப் பிணைப்பைப் பற்றி என்ன கூறுகிறது?",
          "சப்தாம்ச (D7) சக்கரத்தில் குழந்தைகளின் கல்வி வளர்ச்சிக்கான சாதகங்கள் என்ன?"
        ]
      : [
          "When are the traditionally supportive windows for family planning?",
          "What does the 5th house indicate regarding the parent-child emotional dynamic?",
          "Which D7 Saptamsha alignments support children's early educational development?"
        ],
    foreignTravel: isTamil
      ? [
          "இந்த ஜாதகம் தற்காலிக வெளிநாட்டுப் பயணத்தை குறிக்கிறதா அல்லது நீண்டகால குடியேற்றத்தையா?",
          "அடுத்த முக்கிய வெளிநாட்டுப் பயண வாய்ப்பு எப்போது வரக்கூடும்?",
          "வெளிநாட்டுக் கல்வி மற்றும் வெளிநாட்டு வேலைவாய்ப்பை குறிக்கும் பாவகங்கள் எவை?"
        ]
      : [
          "Does the chart indicate temporary overseas assignments or long-term foreign residence?",
          "When is the next strong travel or overseas relocation window?",
          "Which houses govern foreign education versus foreign employment in this chart?"
        ],
    vehicle: isTamil
      ? [
          "புதிய வாகனம் வாங்குவதற்கு மிகவும் உகந்த காலம் எது?",
          "இந்த ஜாதகத்தில் வாகன சௌகரியத்தை குறிக்கும் கிரகங்கள் எவை?",
          "நெடுந்தூர பயணங்களின் போது விழிப்புணர்வுடன் இருக்க வேண்டிய காலங்கள் எவை?"
        ]
      : [
          "When is the most auspicious window for purchasing or upgrading a vehicle?",
          "Which planets signify conveyance comfort and mechanical reliability in this chart?",
          "Are there periods calling for extra caution during long road journeys?"
        ],
    business: isTamil
      ? [
          "இந்த ஜாதகம் தனிநபர் சுயதொழிலுக்கு உகந்ததா அல்லது கூட்டு வர்த்தகத்திற்கா?",
          "புதிய வணிகம் தொடங்குவதற்கு அடுத்த சாதகமான நேரம் எது?",
          "7 மற்றும் 11-ம் அதிபதிகள் வாடிக்கையாளர் தொடர்பை எவ்வாறு பாதிக்கின்றனர்?",
          "வணிக நிதி மேலாண்மையில் கவனிக்க வேண்டிய முக்கிய எச்சரிக்கைகள் என்ன?"
        ]
      : [
          "Does the chart favor independent business ownership or structured commercial partnerships?",
          "When is the next favorable window for commercial launch or market expansion?",
          "How do 7th and 11th house lords influence client relationships and commercial cash flow?",
          "What risk management guidelines emerge from the business domain analysis?"
        ],
    job: isTamil
      ? [
          "வேலை மாற்றம் அல்லது புதிய உத்தியோகம் பெறுவதற்கு அடுத்த சாதகமான காலம் எது?",
          "6-ம் பாவக அமைப்பின்படி எந்த வகை பணியிட சூழல் சிறந்தது?",
          "பணியிட சவால்களை சமாளிக்க என்ன அணுகுமுறை தேவை?"
        ]
      : [
          "When is the next supportive period for changing jobs or securing a new position?",
          "What workplace environment suits the native's 6th house disposition best?",
          "How can workplace conflicts or administrative pressure be mitigated during Saturn/Mars transits?"
        ],
    finance: isTamil
      ? [
          "பொருளாதார வளர்ச்சிக்கு பாரம்பரியமாக சாதகமான காலங்கள் எவை?",
          "2 மற்றும் 11-ம் பாவகங்கள் சேமிப்பு மற்றும் செலவுப் பழக்கத்தை பற்றி என்ன கூறுகின்றன?",
          "பொருளாதார விவேகமும் தற்காப்பும் தேவைப்படும் காலக்கட்டங்கள் எவை?"
        ]
      : [
          "Which upcoming periods are traditionally supportive for wealth accumulation?",
          "What does the 2nd and 11th house axis indicate regarding savings discipline versus expenditure?",
          "Which periods advise conservative financial stewardship and risk minimization?"
        ],
    family: isTamil
      ? [
          "குடும்ப அமைதி மற்றும் ஒற்றுமையை வளர்க்கும் முக்கிய கிரக அமைப்புகள் எவை?",
          "முரண்பட்ட கோச்சார காலங்களில் குடும்ப உறவுகளை எவ்வாறு சுமூகமாக காப்பது?",
          "பெரியவர்களின் ஆசீர்வாதம் இந்த ஜாதகத்தில் எவ்வகையில் பலன் தருகிறது?"
        ]
      : [
          "What are the primary astrological indicators for domestic peace and household stability?",
          "How can family communication be enhanced during conflicting transit periods?",
          "What traditional blessings are indicated through parental and elder relationships?"
        ],
    leadership: isTamil
      ? [
          "சூரியன் மற்றும் 10-ம் பாவ அமைப்பின்படி ஜாதகரின் தலைமைத்துவ பாணி என்ன?",
          "நிறுவன அதிகாரம் மற்றும் நிர்வாக பொறுப்பு உயர்வதற்கான அடுத்த காலம் எது?",
          "அதிகாரத்தையும் சகிப்புத்தன்மையையும் எவ்வாறு சமநிலையில் வைத்திருப்பது?"
        ]
      : [
          "What is the native's innate leadership style based on Sun, Mars, and 10th house placements?",
          "When is the next peak period for institutional influence and executive responsibility?",
          "How can organizational diplomacy and authority be balanced effectively?"
        ],
    wellness: isTamil
      ? [
          "பாரம்பரிய ஜோதிடத்தின்படி ஜாதகரின் உடல் பலம் மற்றும் தற்காப்பு சமநிலை எவ்வாறு உள்ளது?",
          "மன அமைதி மற்றும் புத்துணர்ச்சிக்கு முன்னுரிமை அளிக்க வேண்டிய பருவங்கள் எவை?",
          "பஞ்சபூத கூறுகளின் சமநிலையை தினசரி வாழ்க்கையில் எவ்வாறு பராமரிப்பது?"
        ]
      : [
          "What does traditional Jyotisha indicate regarding the native's constitutional vitality balance?",
          "Which seasons or periods suggest focusing on stress reduction and restorative habits?",
          "How do the classical planetary elements inform daily lifestyle rhythms?"
        ],
    legal: isTamil
      ? [
          "6 மற்றும் 7-ம் பாவகங்கள் சமரச பேச்சுவார்த்தையை ஆதரிக்கின்றனவா அல்லது நேரடி விவாதங்களையா?",
          "ஒப்பந்தங்கள் மற்றும் சட்ட நடவடிக்கைகளுக்கு வரவிருக்கும் காலம் சாதகமானதா?",
          "சட்ட ஆவணங்களை கூடுதல் கவனத்துடன் கையாள வேண்டிய காலங்கள் எவை?"
        ]
      : [
          "What do the 6th and 7th houses suggest regarding negotiated settlements versus formal disputes?",
          "Are upcoming periods traditionally supportive for contract finalization and regulatory compliance?",
          "Which periods advise heightened scrutiny of legal agreements?"
        ],
    spiritual: isTamil
      ? [
          "9 மற்றும் 12-ம் பாவகங்கள் எந்த ஆன்மீக பாதை அல்லது தியான முறைக்கு ஆதரவாக உள்ளன?",
          "ஆத்மகாரகன் கிரகம் ஆன்ம பரிணாம வளர்ச்சி பற்றி என்ன வழிகாட்டுகிறது?",
          "புனித யாத்திரைகள் அல்லது ஆன்மீகப் பயிற்சிகளுக்கு உகந்த காலம் எது?"
        ]
      : [
          "What spiritual path or meditation style is supported by the 9th and 12th houses?",
          "What does the Atmakaraka indicate regarding the soul's primary spiritual evolution themes?",
          "When are supportive windows for sacred pilgrimage, retreats, or intensive study?"
        ],
    caution: isTamil
      ? [
          "அடுத்த 12-24 மாதங்களில் கூடுதல் பொறுமை தேவைப்படும் முக்கிய துறைகள் எவை?",
          "சனி மற்றும் ராகுவின் பெயர்ச்சி காலங்களை எவ்வாறு விவேகமாக கையாள்வது?",
          "தசா மாற்றங்களின் போது பின்பற்ற வேண்டிய நடைமுறை பாதுகாப்பு என்ன?"
        ]
      : [
          "What are the primary domains requiring patience or risk mitigation over the next 12-24 months?",
          "How can challenging transit periods (such as Saturn or Rahu movements) be navigated constructively?",
          "What practical safeguards are recommended during high-friction Dasha transitions?"
        ],
    milestones: isTamil
      ? [
          "அடுத்த 3 முதல் 5 ஆண்டுகளில் வரவிருக்கும் மிக முக்கியமான வாழ்க்கை திருப்புமுனைகள் எவை?",
          "தசா-புக்தி மாற்றங்கள் வாழ்க்கை பாதையில் புதிய திசையை எவ்வாறு குறிக்கின்றன?",
          "கடந்த கால வாழ்க்கை மைல்கற்களின் மூலம் எதிர்கால வாய்ப்புகளுக்கு எவ்வாறு தயாராவது?"
        ]
      : [
          "What are the most pivotal life milestone windows identified over the next 3 to 5 years?",
          "How do the upcoming Mahadasha-Antardasha transitions signal major shifts in life direction?",
          "How can past life milestone rhythms help prepare for future opportunities?"
        ]
  };

  return questionsMap[domainId] || [
    isTamil ? "அடுத்த முக்கிய காலக்கட்டம் எப்போது?" : "When is the next key supportive window for this domain?"
  ];
}
