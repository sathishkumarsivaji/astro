/**
 * ASTROVERSE — Answer Synthesizer
 * =================================
 * Assembles the standardized 9-section answer strictly grounded in
 * structured chart evidence, resolution gates, and anti-template rules.
 */

import { toTamilRasi, toTamilPlanet, toTamilDignity, toTamilBhava } from "../tamilAstrologyUtils.js";
import { buildAnswerObject } from "./structuredAnswerObject.js";
import { evaluateComparison } from "./comparisonEngine.js";
import { evaluatePersonCharacteristic } from "./personCharacteristicEngine.js";
import { calculateDomainImportanceScores } from "./domainRanker.js";
import { generateMilestoneTimeline } from "./milestoneTimelineEngine.js";
import { buildTimingWindowId, buildHouseFactId } from "./evidenceGraph.js";

/**
 * Synthesizes a structured 9-section answer based on retrieved evidence.
 *
 * @param {Object} synthInput
 * @param {Object} synthInput.normalizedQ
 * @param {Object} synthInput.intentResult
 * @param {Object} synthInput.domainResult
 * @param {Object} synthInput.entities
 * @param {Object} synthInput.plan
 * @param {Object} synthInput.evidence
 * @param {Object} synthInput.contradictions
 * @param {Object} synthInput.resolution
 * @returns {Object} Structured answer object
 */
export function synthesizeAnswer({
  normalizedQ,
  intentResult,
  domainResult,
  entities,
  plan,
  evidence,
  contradictions,
  resolution,
  mode = "novice"
}) {
  const isTamil = normalizedQ.isTamil;
  const lang = isTamil ? "ta" : "en";
  const rawQ = normalizedQ.raw || "";
  const req = entities.requestedQuantities || {};

  // If evidence is completely insufficient
  if (!evidence || evidence.status === "INSUFFICIENT_DATA") {
    const insufficientAnswer = isTamil
      ? "[நேரடி பதில் / அறிக்கை முடிவு]\nஇந்த கேள்விக்கு கிடைக்கக்கூடிய ஜாதகத் தரவுகள் போதுமானதாக இல்லை.\n\n[ஜோதிட ஆதாரங்கள்]\nதேவையான கணிதத் தரவுகள் கிடைக்கவில்லை.\n\n[எப்படி இந்த முடிவு வந்தது / பாரம்பரிய சூழல்]\nஜாதக கணிதத்தில் தேவையான குறியீடுகள் விடுபட்டுள்ளதால் ஊகங்கள் தவிர்க்கப்படுகின்றன.\n\n[ஆதார நிலை]\nINSUFFICIENT_DATA\n\n[துல்லிய நிலை]\nINSUFFICIENT_DATA\n\n[எதை உறுதியாக கூற முடியாது]\nமுழுமையான தரவுகள் இன்றி எந்தவொரு முடிவையும் உறுதி செய்ய முடியாது."
      : "[Direct Answer / Report Finding]\nSufficient chart data is not available to answer this question deterministically.\n\n[Astrological Evidence]\nRequired planetary or house factors are missing from the calculation context.\n\n[Evidence Reasoning / Traditional Context]\nSpeculative interpretation is withheld to prevent ungrounded astrological assertions.\n\n[Evidence Status]\nINSUFFICIENT_DATA\n\n[Timing Resolution]\nINSUFFICIENT_DATA\n\n[What Cannot Be Concluded]\nNo definitive astrological deduction can be established without complete chart data.";

    const directAns = isTamil
      ? "இந்த கேள்விக்கு கிடைக்கக்கூடிய ஜாதகத் தரவுகள் போதுமானதாக இல்லை."
      : "Sufficient chart data is not available to answer this question deterministically.";

    const ansObj = buildAnswerObject({
      question: {
        questionId: plan?.questionId || "Q_INSUFFICIENT",
        rawQuestion: rawQ,
        language: lang,
        domain: plan?.primaryDomain || "GENERAL",
        subDomain: intentResult?.primaryIntent || "GENERAL",
        intent: intentResult?.primaryIntent || "GENERAL_INTERPRETATION",
        mode
      },
      interpretation: {
        directSummary: directAns,
        detailedReasoning: "Required chart factors are missing from calculation context.",
        primaryFactor: "INSUFFICIENT_DATA",
        secondaryFactors: [],
        limitingFactors: [isTamil ? "முழுமையான தரவுகள் இன்றி எந்தவொரு முடிவையும் உறுதி செய்ய முடியாது." : "No definitive astrological deduction can be established without complete chart data."],
        whatChangesNext: "INSUFFICIENT_DATA"
      },
      answerability: "INSUFFICIENT_DATA",
      resolution: "INSUFFICIENT_DATA",
      conclusion: "INSUFFICIENT_DATA",
      confidenceClass: "INSUFFICIENT_DATA",
      supportingEvidenceIds: ["EVIDENCE_STATUS_INSUFFICIENT_DATA"],
      counterEvidenceIds: [],
      timingWindows: [],
      calculatedFacts: [],
      traditionalRules: [],
      contradictions: [],
      limitations: [isTamil ? "முழுமையான தரவுகள் இன்றி எந்தவொரு முடிவையும் உறுதி செய்ய முடியாது." : "No definitive astrological deduction can be established without complete chart data."],
      missingEvidence: ["Required chart factors are absent."],
      safetyFlags: []
    });

    return {
      answer: insufficientAnswer,
      directAnswer: directAns,
      status: "INSUFFICIENT_DATA",
      relevantSections: ["technicalAppendix"],
      timingResolution: "INSUFFICIENT_DATA",
      evidenceStatus: "INSUFFICIENT_DATA",
      evidenceIds: ["EVIDENCE_STATUS_INSUFFICIENT_DATA"],
      dataUsed: ["INSUFFICIENT_DATA"],
      limitations: [isTamil ? "முழுமையான தரவுகள் இன்றி எந்தவொரு முடிவையும் உறுதி செய்ய முடியாது." : "No definitive astrological deduction can be established without complete chart data."],
      answerObject: ansObj
    };
  }

  let directAnswer = "";
  let astroEvidenceList = [];
  let reasoningChain = "";
  let timingWindow = "";
  let contradictionNotes = "";
  let whatCannotBeConcluded = "";
  let relevantSections = evidence.reportSections || ["blueprint"];
  let evidenceIds = [];

  const ascSign = evidence.ascendant || null;
  const pMap = evidence.planetMap || {};
  const hMap = evidence.houseMap || {};

  // =========================================================================
  // 1. DOMAIN & INTENT SPECIFIC DIRECT ANSWERS
  // =========================================================================

  // CASE 1: SPOUSE FAMILY WEALTH COMPARISON
  if (intentResult.intents?.includes("SPOUSE_FAMILY") || req.familyWealthRequested) {
    const comp = evidence.comparisonAnalysis;
    if (isTamil) {
      directAnswer = comp?.verdictTa || "துணையின் குடும்பம் உங்களின் குடும்பத்திற்கு சமமான அல்லது ஒத்த சமூக, பொருளாதார அந்தஸ்தில் அமைய வாய்ப்புள்ளது.";
      reasoningChain = "உங்கள் 2-ம் பாவகம் (பூர்வீக குடும்ப தன ஸ்தானம்) மற்றும் துணையின் குடும்பத்தை குறிக்கும் 7-க்கு 2-ம் பாவகமான 8-ம் பாவகத்தின் கிரக பலங்கள், குரு மற்றும் சுக்கிரனின் நிலைகள் ஒப்பீடு செய்யப்பட்டு இந்த முடிவு பெறப்பட்டது.";
      whatCannotBeConcluded = "பாரம்பரிய ஜோதிட கணிப்பில் பொருளாதார நிலையின் ஒப்பீட்டு தரத்தை மட்டுமே கணிக்க முடியும்; குறிப்பிட்ட ரொக்கத் தொகை அல்லது சொத்து மதிப்பை துல்லியமாக நிர்ணயிக்க முடியாது.";
    } else {
      directAnswer = comp?.verdictEn || "Spouse's family is indicated to be of comparable or similar socio-economic and financial background.";
      reasoningChain = "Evaluated native's 2nd Bhava (ancestral family treasury) against the 8th Bhava (2nd from 7th, signifying partner's ancestral wealth), synthesizing dispositor dignities of Jupiter and Venus.";
      whatCannotBeConcluded = "Astrology evaluates comparative socio-economic tiers; specific currency amounts or monetary figures cannot be concluded.";
    }

    astroEvidenceList = [
      `Native 2nd House: ${hMap[2]?.sign || "-"} ${hMap[2]?.lord ? `(Lord: ${hMap[2].lord})` : ""}`.trim(),
      `Spouse 8th House (2nd from 7th): ${hMap[8]?.sign || "-"} ${hMap[8]?.lord ? `(Lord: ${hMap[8].lord})` : ""}`.trim(),
      `Jupiter (Wealth Karaka): ${pMap["Jupiter"] ? `House ${pMap["Jupiter"].house || "-"}${pMap["Jupiter"].dignity ? ` (${pMap["Jupiter"].dignity})` : ""}` : "Calculated Position"}`,
      `Venus (Kalatra Karaka): ${pMap["Venus"] ? `House ${pMap["Venus"].house || "-"}${pMap["Venus"].dignity ? ` (${pMap["Venus"].dignity})` : ""}` : "Calculated Position"}`
    ];
    relevantSections = ["relationships", "family", "finance"];
    evidenceIds = ["HOUSE_FACT_H2", "HOUSE_FACT_H8", "CHART_FACT_JUPITER", "CHART_FACT_VENUS"];
  }

  // CASE 2: SPOUSE DIRECTION AND/OR DISTANCE
  else if (intentResult.intents?.includes("SPOUSE_DIRECTION") || req.directionRequested || req.distanceRequested) {
    const dir = evidence.directionAnalysis;
    const dist = evidence.distanceAnalysis;
    const isDirectionInsufficient = !dir || !dir.primaryDirection || dir.confidenceCategory === "INSUFFICIENT_DATA";

    if (isDirectionInsufficient) {
      if (isTamil) {
        directAnswer = "துணை அமையக்கூடிய திசையைக் கணக்கிட தேவையான 7-ம் பாவக மற்றும் சுக்கிரனின் கிரகத் தரவுகள் போதிய அளவில் கிடைக்கவில்லை (INSUFFICIENT_DATA).";
        reasoningChain = "7-ம் பாவக ராசி, 7-ம் அதிபதி மற்றும் சுக்கிரனின் திசைக் காரணிகள் விடுபட்டுள்ளதால் திசை ஒருங்கிணைவு கணக்கிடப்படவில்லை.";
        whatCannotBeConcluded = "போதிய தரவுகள் இன்றி துணையின் திசை அல்லது இருப்பிடத்தை ஊகிக்க முடியாது.";
      } else {
        directAnswer = "Sufficient chart indicators (7th house and Venus) are not available to determine spouse directional convergence deterministically (INSUFFICIENT_DATA).";
        reasoningChain = "Directional analysis requires 7th house sign, 7th lord dispositor, and Venus natural karakatva. Incomplete chart indicators prevent deterministic convergence calculation.";
        whatCannotBeConcluded = "Matrimonial direction cannot be established without verified 7th house and Venus placements.";
      }
      astroEvidenceList = ["Spouse Direction: INSUFFICIENT_DATA"];
      relevantSections = ["relationships", "marriage"];
      evidenceIds = ["DIRECTION_FACT_INSUFFICIENT_DATA"];
    } else {
      const primDir = dir.primaryDirection;
      const primDirTa = primDir === "WEST" ? "மேற்கு" : primDir === "EAST" ? "கிழக்கு" : primDir === "NORTH" ? "வடக்கு" : "தெற்கு";

      if (isTamil) {
        let ansParts = [];
        if (req.directionRequested || intentResult.intents?.includes("SPOUSE_DIRECTION")) {
          ansParts.push(`உங்கள் ஜாதக அமைப்பின்படி துணை அமையக்கூடிய முதன்மை சாதகமான திசை: ${primDirTa} (${primDir}) திசையாகும்.`);
        }
        if (req.distanceRequested) {
          ansParts.push(dist?.caveat || "இந்த முறையில் திசை தொடர்பான பாரம்பரிய குறியீட்டை மட்டும் விளக்க முடிகிறது. நம்பகமான கிலோமீட்டர் தூர மதிப்பீடு கணக்கிடப்படவில்லை.");
        }
        directAnswer = ansParts.join(" ");
        if (dir?.convergenceScore != null) {
          reasoningChain = `7-ம் பாவக ராசி, 7-ம் அதிபதி அமர்ந்த திசை, மற்றும் களத்திரகாரகன் சுக்கிரனின் காரக திசை ஆகியவற்றின் ஒருங்கிணைவு அடிப்படையில் கணக்கிடப்பட்டது (ஒருங்கிணைவு விகிதம்: ${(dir.convergenceScore * 100).toFixed(0)}%).`;
        } else {
          reasoningChain = "7-ம் பாவக ராசி, 7-ம் அதிபதி அமர்ந்த திசை, மற்றும் களத்திரகாரகன் சுக்கிரனின் காரக திசை ஆகியவற்றின் திசைக் குறிகாட்டிகள் மதிப்பீடு செய்யப்பட்டுள்ளன.";
        }
        whatCannotBeConcluded = "பாரம்பரிய ஜோதிடம் திசை சார்ந்த குறியீடுகளை மட்டுமே வழங்குகிறது. புவியியல் வரைபட கிலோமீட்டர் தூரங்களை ஜோதிட ரீதியாக உறுதி செய்ய முடியாது.";
      } else {
        let ansParts = [];
        if (req.directionRequested || intentResult.intents?.includes("SPOUSE_DIRECTION")) {
          ansParts.push(`According to directional convergence, the primary matrimonial direction points towards ${primDir}.`);
        }
        if (req.distanceRequested) {
          ansParts.push("Distance status is NOT_ESTABLISHED: Traditional astrology provides qualitative directional indicators; quantitative kilometer distances cannot be established without fabrication.");
        }
        directAnswer = ansParts.join(" ");
        if (dir?.convergenceScore != null) {
          reasoningChain = `Synthesized 7th house sign, 7th lord dispositor, Venus natural karakatva direction, and D9 Navamsha orientation (convergence score: ${(dir.convergenceScore * 100).toFixed(0)}%).`;
        } else {
          reasoningChain = "Synthesized 7th house sign, 7th lord dispositor, Venus natural karakatva direction, and D9 Navamsha orientation.";
        }
        whatCannotBeConcluded = "Exact geographical kilometer boundaries cannot be concluded deterministically from astrological chart factors.";
      }

      astroEvidenceList = (dir?.indicators || []).map(i => `${i.factor}: ${i.sign || "-"} (${i.direction})`);
      relevantSections = ["relationships", "marriage"];
      evidenceIds = ["HOUSE_FACT_H7", "DIRECTION_FACT_PRIMARY", "CHART_FACT_VENUS"];
    }
  }

  // CASE 2.5: SYSTEM COMPARISON (LAHIRI VS KP)
  else if (intentResult.intents?.includes("SYSTEM_COMPARISON") || (rawQ.includes("லஹிரி") && rawQ.includes("கே.பி"))) {
    const comp = evidence.systemComparison;
    if (comp && comp.status === "SUCCESS") {
      directAnswer = isTamil ? comp.directAnswerTa : comp.directAnswerEn;
      reasoningChain = isTamil
        ? `லஹிரி சித்திரபக்ஷ அயனாம்சம் (${comp.ayanamsha.lahiriFormatted}) மற்றும் கே.பி. அயனாம்சம் (${comp.ayanamsha.kpFormatted}) இடையே ${comp.ayanamsha.diffFormatted} வேறுபாடு துல்லியமாக கணக்கிடப்பட்டது. ${comp.hasMaterialDifference ? "கிரகங்கள் பிளாசிடஸ் பாவக கணிதத்தின்படி பாவ சலித இடப்பெயர்ச்சி பெற்றுள்ளன." : "கிரகங்கள் ராசி அல்லது நட்சத்திர எல்லையைக் கடக்கவில்லை (பொருள் சார்ந்த மாற்றம் இல்லை)."}`
        : `Calculated exact ayanamsha offset of ${comp.ayanamsha.diffFormatted} (${comp.ayanamsha.lahiriFormatted} vs ${comp.ayanamsha.kpFormatted}). ${comp.hasMaterialDifference ? "Planets underwent Bhava Chalit house shifts under Placidus cusps." : "No planets crossed star boundaries; strictly numerical offset."}`;
      whatCannotBeConcluded = isTamil
        ? "சிறிய பாகை வித்தியாசத்தை மட்டும் வைத்து ஒரு கணிப்பு முறை மற்றொன்றை விட சிறந்தது என்றோ தவறானது என்றோ முடிவெடுக்க முடியாது. மேலும் முறையான தசா-கோச்சார அல்லது ஆளும் கிரக விதிகளின்றி தன்னிச்சையான காலக்கணிப்பை (உதாரணமாக 18-24 மாதங்கள்) உருவாக்க முடியாது."
        : "A small numerical angular offset does not render either system universally superior or invalid. Unsubstantiated timing projections (e.g. arbitrary 18-24 month windows) cannot be inferred without operative Dasha-transit or Ruling Planet convergence.";

      astroEvidenceList = [
        `Lahiri Ayanamsha: ${comp.ayanamsha.lahiriFormatted}`,
        `KP Ayanamsha: ${comp.ayanamsha.kpFormatted}`,
        `Ayanamsha Difference: ${comp.ayanamsha.diffFormatted}`,
        `KP 1st Cusp (Lagna) Sub-Lord: ${comp.ascendantSubLord || "Not calculated"}`,
        `KP 7th Cusp (Kalatra) Sub-Lord: ${comp.seventhSubLord || "Not calculated"}`,
        `KP 10th Cusp (Karma) Sub-Lord: ${comp.tenthSubLord || "Not calculated"}`,
        `Material Difference Status: ${comp.hasMaterialDifference ? "MATERIAL_BOUNDARY_CROSSINGS_DETECTED" : "NO_MATERIAL_DIFFERENCE_IN_LONGITUDES"}`
      ];
      relevantSections = ["multiSystemComparison", "technicalAppendix", "blueprint"];
      evidenceIds = ["AYANAMSHA_LAHIRI_KP", "HOUSE_CUSPS_PLACIDUS", "KP_CUSP_SUB_LORD_10", "KP_CUSP_SUB_LORD_7", "KP_CUSP_SUB_LORD_1", "MATERIAL_DIFFERENCE_CLASSIFIER"];
    } else {
      const kpData = evidence.kpData || {};
      const kpSubLords = kpData.subLords || {};
      const tenthSubLord = kpSubLords[10] || kpSubLords["10"] || kpSubLords["tenth"] || (kpData.cusps || []).find(c => c.house === 10)?.subLord || null;
      const h10 = hMap[10] || {};
      const tenthLord = h10.lord || h10.lordName || null;
      const subLordDisplayEn = tenthSubLord || "Not calculated";
      const subLordDisplayTa = tenthSubLord || "கணக்கிடப்படவில்லை";
      const lordDisplayEn = tenthLord || "Not calculated";
      const lordDisplayTa = tenthLord || "கணக்கிடப்படவில்லை";
      const lahiriVal = evidence.lahiriAyanamsha != null ? `${Number(evidence.lahiriAyanamsha).toFixed(2)}°` : "AYANAMSHA_NOT_CALCULATED";
      const kpVal = evidence.kpAyanamsha != null ? `${Number(evidence.kpAyanamsha).toFixed(2)}°` : "AYANAMSHA_NOT_CALCULATED";
      const lahiriValTa = evidence.lahiriAyanamsha != null ? `${Number(evidence.lahiriAyanamsha).toFixed(2)}°` : "கணக்கிடப்படவில்லை";
      const kpValTa = evidence.kpAyanamsha != null ? `${Number(evidence.kpAyanamsha).toFixed(2)}°` : "கணக்கிடப்படவில்லை";

      if (isTamil) {
        directAnswer = `லஹிரி (Chitrapaksha) மற்றும் கே.பி. (Krishnamurti Padhdhati) முறைகளுக்கு இடையே உங்கள் ஜாதகத்தில் உள்ள முக்கிய மாற்றங்கள்:\n\n1. அயனாம்சம்: லஹிரி முறை சித்திரபக்ஷ அயனாம்சத்தையும் (${lahiriValTa}), கே.பி. முறை கிருஷ்ணமூர்த்தி அயனாம்சத்தையும் (${kpValTa}) பயன்படுத்துகிறது; இரண்டும் நிரயன (Sidereal) இராசி மண்டலத்தை அடிப்படையாகக் கொண்டவை.\n2. பாவ ஆரம்ப கணிதம்: லஹிரி மரபு கட்டமைப்பில் தேர்ந்தெடுக்கப்பட்ட பாவக முறை (Whole Sign / Equal / Sripathi) பயன்படுத்தப்படுகிறது; கே.பி. முறை பிளாசிடஸ் (Placidus) அரை-விகித சமன்பாட்டைப் பயன்படுத்தி 12 பாவக ஆரம்பங்களை துல்லியமாக கணக்கிடுகிறது.\n3. பலன் காணும் நெறிமுறை: லஹிரி முறையில் 10-ம் அதிபதி (${lordDisplayTa}) மற்றும் D10 தசாம்ச வர்க்க பலம் முதன்மையாக ஆராயப்படுகிறது; கே.பி. முறையில் 10-ம் பாவ உப அதிபதி (Sub-Lord: ${subLordDisplayTa}) மற்றும் 2, 6, 10, 11-ம் பாவ காரகத்துவங்கள் மூலம் தொழில் பலன்கள் முடிவெடுக்கப்படுகின்றன.\n\nசுருக்கமாக: லஹிரி முறை பாரம்பரிய வர்க்க மற்றும் பார்வைகளுக்கு முக்கியத்துவம் அளிக்கிறது; கே.பி. முறை 249 உப அதிபதிகள் மற்றும் நட்சத்திர காரகத்துவங்களை மட்டுமே முதன்மையாகக் கொள்கிறது.`;
        reasoningChain = `இரு முறைகளின் கணித வேறுபாடுகள்: (1) அயனாம்சம் (${lahiriValTa} vs ${kpValTa}), (2) சம பாவகம் vs பிளாசிடஸ் முனைய பாகைகள், (3) பராசர அதிபதி (${lordDisplayTa}) vs கே.பி. உப அதிபதி (${subLordDisplayTa}) கோட்பாடு.`;
        whatCannotBeConcluded = "ஒரு முறை மட்டுமே சரியானது என்றும் மற்றொன்று தவறானது என்றும் கூற முடியாது. லஹிரி முறை பாரம்பரிய வாழ்வியல் மேலோட்டத்திற்கும், கே.பி. முறை நிகழ்வுகளின் கால நிர்ணய நுட்பத்திற்கும் பயன்படுத்தப்படுகின்றன.";
      } else {
        directAnswer = `The foundational differences between the Lahiri (Chitrapaksha) and KP (Krishnamurti Padhdhati) systems for your chart are:\n\n1. Ayanamsha: Both systems operate in the Sidereal zodiac. Lahiri applies Chitrapaksha sidereal ayanamsha (${lahiriVal}), whereas KP applies Krishnamurti sidereal ayanamsha (${kpVal}).\n2. House Cuspal System: Lahiri/Parashari analysis applies configured classical house division (Whole Sign / Equal / Sripathi), while KP strictly applies Placidus semi-arc cusp divisions.\n3. Predictive Methodology: In Lahiri, career is judged via the 10th house lord (${lordDisplayEn}), aspects, and D10 Dashamsha divisional chart. In KP, events depend strictly on the 10th cusp Sub-Lord (${subLordDisplayEn}) and its star lord signifying the 2-6-10-11 houses.\n\nSummary: Lahiri emphasizes classical Vargas, Shadbala, and mutual aspects; KP relies entirely on the 249 Cuspal Sub-Lords and 4-tier house significators.`;
        reasoningChain = `Synthesized Ayanamsha offset (${lahiriVal} vs ${kpVal}), Placidus semi-arc boundary calculation, and KP 10th cusp sub-lord (${subLordDisplayEn}) against Lahiri 10th lord (${lordDisplayEn}).`;
        whatCannotBeConcluded = "Neither system is objectively 'superior'; Lahiri provides qualitative archetypal depth via Vargas, while KP offers event-level binary timing via sub-lords.";
      }

      astroEvidenceList = [
        `Lahiri Ayanamsha: Chitrapaksha (${lahiriVal})`,
        `KP Ayanamsha: Krishnamurti (${kpVal})`,
        `KP 10th Cusp Sub-Lord: ${subLordDisplayEn}`,
        `Lahiri 10th House Lord: ${lordDisplayEn}`,
        `House System: Equal/Whole Sign (Lahiri) vs Placidus Semi-Arc (KP)`
      ];
      relevantSections = ["multiSystemComparison", "technicalAppendix", "blueprint"];
      evidenceIds = ["AYANAMSHA_LAHIRI_KP", "HOUSE_CUSPS_PLACIDUS", "KP_CUSP_SUB_LORD_10", "HOUSE_FACT_H10"];
    }
  }

  // CASE 2.6: TOP REPORT HEADINGS (DYNAMIC DOMAIN PROMINENCE)
  else if (intentResult.intents?.includes("TOP_HEADINGS") || /three.*(heading|section|topic)|முக்கிய.*தலைப்பு/i.test(rawQ)) {
    const rawChart = evidence.chart || {};
    const rankedDomains = calculateDomainImportanceScores(rawChart);

    if (!rankedDomains || rankedDomains.length === 0) {
      if (isTamil) {
        directAnswer = "முக்கிய தலைப்புகளைத் தரவரிசைப்படுத்த போதுமான ஜாதகத் தரவுகள் கிடைக்கவில்லை.";
        reasoningChain = "தலைப்புகள் தரவரிசைக்கு பாவக மற்றும் தசா கணித விவரங்கள் தேவை.";
        whatCannotBeConcluded = "ஜாதகத் தரவின்றி முக்கிய பிரிவுகளை நிர்ணயிக்க முடியாது.";
      } else {
        directAnswer = "INSUFFICIENT_DATA: Sufficient chart data is not available to rank report headings dynamically.";
        reasoningChain = "Dynamic domain ranking requires calculated house positions and Dasha cycles.";
        whatCannotBeConcluded = "Cannot establish prominent domains without chart calculations.";
      }
      astroEvidenceList = ["Domain Ranking: INSUFFICIENT_DATA"];
      relevantSections = ["blueprint"];
      evidenceIds = [];
    } else {
      const top3 = rankedDomains.slice(0, 3);
      if (isTamil) {
        directAnswer = `உங்கள் ஜாதகக் கணிதத்தின்படி (கிரக ஆதிபத்தியங்கள், அஷ்டகவர்க்க பலம் மற்றும் தசா இயக்கம்) உங்கள் வாழ்க்கை நுண்ணறிவு அறிக்கையில் உள்ள ${top3.length} மிக முக்கியமான முதன்மைத் தலைப்புகள்:\n\n` +
          top3.map((d, i) => `${i + 1}. ${d.titleTa} (${d.titleEn}):\n• முக்கியத்துவ மதிப்பீடு: ${d.score} (${d.primaryHouse})\n• காரணம்: ${d.reasonsTa}`).join("\n\n");
        reasoningChain = `உங்கள் ஜாதகத்தின் நடப்பு தசா நாதரின் ஆதிபத்தியங்கள், பாவக அஷ்டகவர்க்க பரல்கள் மற்றும் கிரக செறிவின் அடிப்படையில் 17 தலைப்புகளில் இந்த முதன்மைப் பிரிவுகள் கணித ரீதியாக வரிசைப்படுத்தப்பட்டன.`;
        whatCannotBeConcluded = "இந்த தலைப்புகள் உங்கள் ஜாதகத்தில் அதிக கிரக ஆற்றல் குவிந்துள்ள துறைகளாகும்; ஏனைய பிரிவுகளின் வாழ்வியல் ஆலோசனைகளை இது குறைக்காது.";
      } else {
        directAnswer = `Based on your calculated natal configuration (active dasha rulership, planetary density, and bhava prominence), the top ${top3.length} most important headings in your report are:\n\n` +
          top3.map((d, i) => `${i + 1}. ${d.titleEn} (${d.titleTa}):\n• Prominence Score: ${d.score} (${d.primaryHouse})\n• Reason: ${d.reasonsEn}`).join("\n\n");
        reasoningChain = `Evaluated mathematical domain prominence across report sections using active dasha lords, bhava strength, and planetary occupancy.`;
        whatCannotBeConcluded = "These represent the most structurally activated domains in your chart; supplementary sections provide necessary complementary context.";
      }

      astroEvidenceList = top3.map((d, i) => `Rank ${i + 1}: ${d.titleEn} (Score: ${d.score}, ${d.primaryHouse})`);
      relevantSections = top3.map(d => d.domain.toLowerCase());

      const domainHouseMap = {
        CAREER: "HOUSE_FACT_H10",
        MARRIAGE: "HOUSE_FACT_H7",
        FINANCE: "HOUSE_FACT_H2",
        PROPERTY: "HOUSE_FACT_H4",
        WELLNESS: "HOUSE_FACT_H6",
        EDUCATION: "HOUSE_FACT_H4",
        CHILDREN: "HOUSE_FACT_H5",
        FOREIGN_TRAVEL: "HOUSE_FACT_H9",
        SPIRITUALITY: "HOUSE_FACT_H9",
        LEGAL: "HOUSE_FACT_H6"
      };
      evidenceIds = top3.map(d => domainHouseMap[d.domain] || `HOUSE_FACT_H${d.primaryHouse.replace(/[^0-9]/g, "")}`);
    }
  }

  // CASE 3: VARGA INTERPRETATION (e.g. D10 CANCER LAGNA CAREER)
  else if (intentResult.intents?.includes("VARGA_INTERPRETATION") || req.vargaRequested) {
    const varga = evidence.vargaAnalysis || {};
    if (!varga.lagna) {
      if (isTamil) {
        directAnswer = `தசாம்ச (D10) சக்கரத் தரவு உங்கள் ஜாதகக் கணிதத்தில் கிடைக்கவில்லை. D10 லக்னம் கணக்கிடப்படாத நிலையில் தொழில் நிர்வாக அதிகாரம் மற்றும் உத்தியோக அந்தஸ்தை தசாம்ச ரீதியாக கணிக்க போதிய தரவு இல்லை.`;
        reasoningChain = `தசாம்சம் தொழில் உழைப்பையும் அதிகார நிலையையும் ஆராயும் நுட்பமான வர்க்கமாகும். தேவையான D10 கணிதத் தரவு விடுபட்டுள்ளதால் ஊகங்கள் தவிர்க்கப்படுகின்றன.`;
        whatCannotBeConcluded = "D10 லக்னம் இன்றி தொழில் பதவி உயர்வு அல்லது நிர்வாகப் பொறுப்புகளை அறுதியிட முடியாது.";
      } else {
        directAnswer = `Dashamsha (D10) divisional chart data is not calculated or available in this context. Consequently, executive authority and vocational trajectory cannot be concluded from D10 without verified divisional data.`;
        reasoningChain = `D10 specifically refines career execution and social prestige. Speculative interpretation is withheld in the absence of verified D10 lagna calculations.`;
        whatCannotBeConcluded = "Definitive career trajectory and executive authority cannot be concluded without calculated D10 divisional positions.";
      }
      astroEvidenceList = ["D10 Divisional Chart: INSUFFICIENT_DATA"];
      relevantSections = ["career", "technicalAppendix"];
      evidenceIds = ["D10_FACT_INSUFFICIENT_DATA"];
    } else {
      const d10Lagna = varga.lagna;
      const d10Lord = varga.lagnaLord;
      const d1010thSign = varga.tenthHouseSign;
      const d1010thLord = varga.tenthLord;

      const userClaimStatus = varga.userClaimedSign
        ? (varga.userClaimMismatch
            ? { en: ` (Contradiction / CONTRADICTION: While inquiry referenced D10 ${varga.userClaimedSign}, your calculated chart confirms D10 ${d10Lagna} Lagna)`,
                ta: ` (முரண்பாட்டு அறிக்கை / CONTRADICTION: கேள்வியில் குறிப்பிடப்பட்ட D10 ${varga.userClaimedSign} லக்னத்திற்கு மாறாக, உங்கள் கணிதத்தில் D10 லக்னம் ${d10Lagna} ஆக அமைந்துள்ளது)` }
            : { en: ` (Agreement / AGREEMENT: Inquiry-stated D10 ${varga.userClaimedSign} matches your calculated D10 ${d10Lagna} Ascendant)`,
                ta: ` (பொருந்தும் அறிக்கை / AGREEMENT: கேள்வியில் குறிப்பிடப்பட்ட D10 ${varga.userClaimedSign} லக்னம் உங்கள் கணித D10 லக்னத்துடன் (${d10Lagna}) முழுமையாக ஒத்துப்போகிறது)` })
        : { en: "", ta: "" };

      const claimNoteTa = userClaimStatus.ta;
      const claimNoteEn = userClaimStatus.en;

      if (isTamil) {
        directAnswer = `உங்கள் தசாம்சம் (D10) ${d10Lagna} லக்னமாக அமைந்து, அதன் லக்னாதிபதி ${d10Lord} பகவான் ஆவார்${claimNoteTa}. 10-ம் பாவகம் ${d1010thSign} ஆக அமைந்து அதன் அதிபதியாக ${d1010thLord} விளங்குகிறார். இந்த அமைப்புகள் பாரம்பரிய தசாம்ச விளக்கத்தில் தொழில் முனைப்பு மற்றும் பொறுப்பான பணிகளுக்கான சாதகமான திறனை சுட்டிக்காட்டுகின்றன; ஆனால் ‘நிலையான அந்தஸ்து உறுதி’ என்று மட்டும் D10 அடிப்படையில் கூற முடியாது.`;
        reasoningChain = `தசாம்சத்தின் லக்னம் தொழில் உழைப்பின் போக்கையும், 10-ம் பாவகம் செயல் வடிவத்தையும் குறிக்கின்றன. சூரியன் மற்றும் சனியின் காரக அமைப்புகளுடன் D10 லக்னாதிபதியின் வலிமை இணைக்கப்பட்டு பாரம்பரிய தொழில் திறன் மதிப்பிடப்பட்டுள்ளது.`;
        whatCannotBeConcluded = "D10 கட்டமைப்பு தொழில் திறனையும் உழைப்பின் போக்கையும் மட்டுமே பாரம்பரியமாக காட்டுகிறது; குறிப்பிட்ட நிறுவன பதவி அல்லது நிலையான அந்தஸ்தை தசா மற்றும் கோச்சார முழுமையான ஆய்வு இன்றி உறுதியாக கூற முடியாது.";
      } else {
        directAnswer = `Your Dashamsha (D10) features ${d10Lagna} Ascendant ruled by ${d10Lord}${claimNoteEn}, with the 10th house in ${d1010thSign} ruled by ${d1010thLord}. In classical Jyotish, these alignments outline vocational inclinations toward responsible execution, but stable institutional authority cannot be claimed with certainty solely from D10 placements.`;
        reasoningChain = `D10 Ascendant and 10th house disposition arithmetically govern vocational execution, synthesized with Sun (karaka of authority) and Saturn (karaka of sustained enterprise).`;
        whatCannotBeConcluded = "Divisional charts outline vocational aptitude and focus; fixed promotions or definitive institutional standing cannot be concluded without synthesizing D1, active dasha, and transits.";
      }

      astroEvidenceList = [
        `D10 Ascendant: ${d10Lagna} (Lord: ${d10Lord})`,
        `D10 10th House: ${d1010thSign} (Lord: ${d1010thLord})`,
        varga.userClaimedSign
          ? (varga.userClaimMismatch
              ? `User Stated Sign: ${varga.userClaimedSign} (Contradiction: Calculated D10 Lagna is ${d10Lagna})`
              : `User Stated Sign: ${varga.userClaimedSign} (Agreement: Calculated D10 Lagna is ${d10Lagna})`)
          : null,
        `D10 Sun Placement: ${varga.d10SunPlacement ? `House ${varga.d10SunPlacement.house} in ${varga.d10SunPlacement.sign}` : "Calculated in D10"}`,
        `D10 Saturn Placement: ${varga.d10SaturnPlacement ? `House ${varga.d10SaturnPlacement.house} in ${varga.d10SaturnPlacement.sign}` : "Calculated in D10"}`,
        `D1 Natal Sun: House ${pMap["Sun"]?.house || "-"} in ${pMap["Sun"]?.sign || "-"}`,
        `D1 Natal Saturn: House ${pMap["Saturn"]?.house || "-"} in ${pMap["Saturn"]?.sign || "-"}`
      ].filter(Boolean);
      relevantSections = ["career", "vocation", "technicalAppendix"];
      evidenceIds = [`D10_FACT_ASC_${d10Lagna}`, `D10_FACT_H10_${d1010thSign}`, `D10_FACT_LORD_${d10Lord}`, "CHART_FACT_D1_H10"];
    }
  }

  // CASE 4: DASHA EFFECT (e.g. MOON-VENUS OR SPECIFIC DASHA PAIR)
  else if (entities.dashaPair || (intentResult.intents?.includes("DASHA_EFFECT") && entities.planets?.length >= 2)) {
    const dPair = entities.dashaPair || { mahadasha: entities.planets[0], antardasha: entities.planets[1] };
    const p1 = pMap[dPair.mahadasha] || null;
    const p2 = pMap[dPair.antardasha] || null;
    const inter = evidence.dashaInteraction || {};

    if (!p1 || !p2) {
      if (isTamil) {
        directAnswer = `${dPair.mahadasha} அல்லது ${dPair.antardasha} கிரகங்களின் முழுமையான கணிதத் தரவு ஜாதகப் பதிவேட்டில் கிடைக்கவில்லை. எனவே அவற்றின் தசா-புக்தி பலன்களை துல்லியமாக கணிக்க போதிய தரவு இல்லை.`;
        reasoningChain = `தசா நாதர்களின் ராசி, பாவகம் மற்றும் பலம் விடுபட்டுள்ளதால் பலன் கணிப்பு தவிர்க்கப்படுகிறது.`;
        whatCannotBeConcluded = "கிரக நிலைத் தரவுகள் இன்றி தசா-புக்தி தாக்கங்களை அறுதியிட முடியாது.";
      } else {
        directAnswer = `Calculated chart positions for ${dPair.mahadasha} and/or ${dPair.antardasha} are not present in the natal ledger. Consequently, specific sub-period dynamics cannot be concluded without data.`;
        reasoningChain = `Planetary sign, house, and dignity are required for classical period evaluation. Speculation is withheld.`;
        whatCannotBeConcluded = "Dasha sub-period interactions cannot be concluded without verified natal planetary positions.";
      }
      astroEvidenceList = [`Dasha Lords: ${dPair.mahadasha} / ${dPair.antardasha} (Missing Positions)`];
      relevantSections = ["timeline", "dasha"];
      evidenceIds = ["DASHA_FACT_INSUFFICIENT_DATA"];
    } else {
      const p1Houses = Object.values(hMap).filter(h => h.lord === p1.name).map(h => h.house);
      const p2Houses = Object.values(hMap).filter(h => h.lord === p2.name).map(h => h.house);
      const p1HouseStr = p1Houses.length ? p1Houses.join(", ") : null;
      const p2HouseStr = p2Houses.length ? p2Houses.join(", ") : null;
      const domain = domainResult.domains?.[0] || plan?.primaryDomain || "general";

      let domainFocusEn = "";
      let domainFocusTa = "";
      if (domain === "marriage" || domain === "relationships") {
        domainFocusEn = " alliance prospects, relationship commitments, and domestic harmony";
        domainFocusTa = " திருமண வரன் தேடல், தம்பதியர் ஒற்றுமை மற்றும் குடும்ப சுப காரியங்கள்";
      } else if (domain === "career" || domain === "job" || domain === "business") {
        domainFocusEn = " professional execution, occupational responsibilities, and institutional status";
        domainFocusTa = " தொழில் வளர்ச்சி, பொறுப்புகள் மற்றும் சமூக அந்தஸ்து";
      } else if (domain === "finance" || domain === "wealth") {
        domainFocusEn = " financial liquidity, capital growth, and resource preservation";
        domainFocusTa = " நிதி வரவு, மூலதன பெருக்கம் மற்றும் சேமிப்பு மேலாண்மை";
      } else {
        domainFocusEn = " personal initiative, life stability, and situational progress";
        domainFocusTa = " வாழ்வியல் முன்னேற்றம், மன உறுதி மற்றும் சூழ்நிலை மாற்றங்கள்";
      }

      if (isTamil) {
        const p1LordDesc = p1HouseStr ? `${p1HouseStr}-ம் பாவகாதிபதி` : "லக்ன ஆதிபத்தியம்";
        const p2LordDesc = p2HouseStr ? `${p2HouseStr}-ம் பாவகாதிபதி` : "லக்ன ஆதிபத்தியம்";
        directAnswer = `${dPair.mahadasha} மகாதசை - ${dPair.antardasha} அந்தர்தசா காலத்தில், ${toTamilPlanet(p1.name)} (${p1LordDesc}, அமர்வு: ${toTamilRasi(p1.sign)} ${p1.house}-ம் இடம்) மற்றும் ${toTamilPlanet(p2.name)} (${p2LordDesc}, அமர்வு: ${toTamilRasi(p2.sign)} ${p2.house}-ம் இடம்) ஆகிய இரு கிரகங்களின் பாவக இணைவு${domainFocusTa} சார்ந்த துறைகளில் முக்கிய தாக்கத்தை ஏற்படுத்துகிறது.`;
        reasoningChain = `மகாதசா நாதர் ${toTamilPlanet(p1.name)} (மனோகாரகன்) மற்றும் புக்தி நாதர் ${toTamilPlanet(p2.name)} ஆகியவற்றின் பாவக ஆதிபத்தியங்கள் (${p1HouseStr || "-"} மற்றும் ${p2HouseStr || "-"}), இயற்கை காரகத்துவங்கள் (காரகன்), மற்றும் அவற்றின் பரஸ்பர அச்சு தொடர்புகள் (${inter.axisRelationship || "அச்சு தொடர்பு"}) வழியாக பலன்கள் வெளிப்படுகின்றன.`;
        whatCannotBeConcluded = "தசா-புக்தி அமைப்புகள் வாழ்வின் தூண்டுதல்களையும் வாய்ப்புகளையும் மட்டுமே குறிக்கின்றன; சுய முயற்சியும் தகுந்த நடைமுறை முடிவுகளுமே இறுதி விளைவை தீர்மானிக்கும்.";
      } else {
        const p1LordDesc = p1HouseStr ? `ruler of House(s) ${p1HouseStr}` : "natal dispositor";
        const p2LordDesc = p2HouseStr ? `ruler of House(s) ${p2HouseStr}` : "natal dispositor";
        const p1DigStr = p1.dignity ? `, ${p1.dignity}` : "";
        const p2DigStr = p2.dignity ? `, ${p2.dignity}` : "";
        directAnswer = `During the ${dPair.mahadasha} Mahadasha — ${dPair.antardasha} Antardasha, ${p1.name} (${p1LordDesc}, positioned in ${p1.sign} House ${p1.house}${p1DigStr}) and ${p2.name} (${p2LordDesc}, positioned in ${p2.sign} House ${p2.house}${p2DigStr}) activate dynamics specifically influencing${domainFocusEn}.`;
        reasoningChain = `Synthesized specific functional house lordships (${p1.name}: ${p1HouseStr || "-"}; ${p2.name}: ${p2HouseStr || "-"}), natural karakatvas, planetary mutual axis relationship (${inter.axisRelationship || "Aspect/Conjunction"}), and contextual domain relevance.`;
        whatCannotBeConcluded = "Dasha sub-periods frame operational themes and opportune cycles; fatalistic certainty is not supported without individual agency.";
      }

      astroEvidenceList = [
        `Mahadasha Lord: ${p1.name} in ${p1.sign} (House ${p1.house}${p1.dignity ? `, ${p1.dignity}` : ""}${p1HouseStr ? `; Rules: H${p1HouseStr}` : ""})`,
        `Antardasha Lord: ${p2.name} in ${p2.sign} (House ${p2.house}${p2.dignity ? `, ${p2.dignity}` : ""}${p2HouseStr ? `; Rules: H${p2HouseStr}` : ""})`,
        `Mutual Axis: ${inter.axisRelationship || "Harmonious Disposition"}`,
        `Activated Domains: ${(inter.activatedDomains || [domain]).join(", ")}`
      ];
      relevantSections = ["timeline", "dasha"];
      evidenceIds = [`DASHA_FACT_${p1.name}`, `DASHA_FACT_${p2.name}`, "DASHA_FACT_AXIS"];
      if (p1HouseStr) evidenceIds.push(`LORD_FACT_L${p1HouseStr.split(",")[0].trim()}`);
      if (p2HouseStr) evidenceIds.push(`LORD_FACT_L${p2HouseStr.split(",")[0].trim()}`);
    }
  }

  // CASE 5: CURRENT DASHA ACROSS LIFE DOMAINS (e.g. MOON DASHA OVERVIEW)
  else if (intentResult.intents?.includes("CURRENT_DASHA") || intentResult.intents?.includes("DASHA_EFFECT") || (entities.planets?.length === 1 && (normalizedQ.normalized.includes("dasha") || normalizedQ.raw.includes("தசை")))) {
    const activeD = evidence.activeDasha || null;
    const pName = entities.planets[0] || activeD?.mahadasha || null;
    const pData = pName ? pMap[pName] : null;

    if (!pName || !pData) {
      if (isTamil) {
        directAnswer = "நடப்பு தசா நாதரின் கணித விவரங்கள் ஜாதகத்தில் கிடைக்கவில்லை. எனவே தசா பலன்களை கணிக்க போதிய தரவு இல்லை.";
        reasoningChain = "தசா நாதரின் இருப்பு விடுபட்டுள்ளதால் ஆய்வு தவிர்க்கப்படுகிறது.";
        whatCannotBeConcluded = "முழுமையான தசா தரவு இன்றி பலன்களை அறுதியிட முடியாது.";
      } else {
        directAnswer = "Active Dasha planetary data is not available in the calculated chart context.";
        reasoningChain = "Required Dasha positions are missing from the ledger.";
        whatCannotBeConcluded = "Dasha effects cannot be concluded without verified running period data.";
      }
      astroEvidenceList = ["Active Dasha: INSUFFICIENT_DATA"];
      relevantSections = ["timeline", "dasha"];
      evidenceIds = ["DASHA_FACT_INSUFFICIENT_DATA"];
    } else {
      const pLordHouses = Object.values(hMap).filter(h => h.lord === pName).map(h => h.house);
      const pLordStr = pLordHouses.length ? pLordHouses.join(", ") : null;
      const pDigStr = pData.dignity ? `, ${pData.dignity}` : "";

      if (isTamil) {
        const lordTa = pLordStr ? `${pLordStr}-ம் பாவக அதிபதியான ` : "";
        directAnswer = `உங்கள் நடப்பு ${toTamilPlanet(pName)} தசைக்காலத்தில், ${lordTa}${toTamilPlanet(pName)} பகவான் ${toTamilRasi(pData.sign)} ராசியில் ${pData.house}-ம் பாவகத்தில் அமர்ந்து, மனோபலம், குடும்ப சூழல், நிதி மேலாண்மை மற்றும் தொழில் நிலைத்தன்மை ஆகிய முக்கிய பகுதிகளில் தீவிர தாக்கத்தை ஏற்படுத்துகிறார்.`;
        reasoningChain = `${toTamilPlanet(pName)} பகவானின் பாவக ஆதிபத்தியங்கள் (${pLordStr || "லக்ன ஆட்சி"}), அவரது அமர்வு ஸ்தானம் (${pData.house}-ம் இடம்), மன அமைதி மற்றும் இயற்கை காரகத்துவங்கள் (மனோகாரகன், தாயார், திரவ வளம்) ஆகியவற்றை அடிப்படையாகக் கொண்டு தசா பலன்கள் பகுப்பாய்வு செய்யப்பட்டன.`;
        whatCannotBeConcluded = "தசா காலம் மனநிலை மற்றும் சூழ்நிலை வாய்ப்புகளை தூண்டுகிறது; தனிநபர் முயற்சியின்றி எந்தவொரு நிகழ்வும் தானாக நிகழும் விதியாக மாறாது.";
      } else {
        const lordEn = pLordStr ? `ruler of House(s) ${pLordStr}, ` : "";
        directAnswer = `Your running ${pName} Mahadasha is governed by ${pName} as ${lordEn}occupying House ${pData.house} in ${pData.sign}${pDigStr}. This activation directly channels mental fortitude, domestic stability, financial management, and career endurance across its ruled and occupied bhavas.`;
        reasoningChain = `Traced ${pName}'s functional house lordships (${pLordStr || "dispositor"}), placement in House ${pData.house}, and natural karakatvas across psychological and worldly spheres.`;
        whatCannotBeConcluded = "Dasha periods frame psychological predispositions and environmental themes; deterministic fatalism is not supported.";
      }

      astroEvidenceList = [
        `Mahadasha Planet: ${pName} in ${pData.sign} (House ${pData.house}${pDigStr})`,
        pLordStr ? `Functional Lordships: House(s) ${pLordStr}` : `House Position: ${pData.house}`,
        `Sign Lord: ${hMap[pData.house]?.lord || "Calculated"}`
      ];
      relevantSections = ["timeline", "dasha", "blueprint"];
      evidenceIds = [`DASHA_FACT_${pName}`, "CHART_FACT_DASHA_LORD"];
      if (pLordStr) evidenceIds.push(`LORD_FACT_L${pLordStr.split(",")[0].trim()}`);
    }
  }

  // CASE 6: PROPERTY TIMING
  else if (domainResult.domains?.includes("property") || intentResult.intents?.includes("PROPERTY")) {
    const h4 = hMap[4] || {};
    const mars = pMap["Mars"] || {};
    const win = evidence.timingWindows?.find(w => w.domain === "property" || w.category === "ASSETS") || null;
    const hasCalculatedWindow = Boolean(win && (win.years || win.calendarYears || (win.yearStart && win.yearEnd)));
    const startYear = win?.yearStart || (win?.years ? String(win.years).split("-")[0]?.trim() : null);
    const endYear = win?.yearEnd || (win?.years ? String(win.years).split("-")[1]?.trim() : null);
    const winYearsStr = (startYear && endYear) ? `${startYear}–${endYear}` : (win?.years || null);

    if (isTamil) {
      if (hasCalculatedWindow) {
        directAnswer = `உங்கள் ஜாதகத்தில் 4-ம் பாவகம் (${h4.sign || "சுக ஸ்தானம்"}) மற்றும் பூமி காரகன் செவ்வாயின் அமைப்பைப் பார்க்கும்போது, சொத்து வாங்குவதற்கான சாதகமான யோகம் உள்ளது. குறிப்பாக ${winYearsStr} காலகட்டத்தில் சொத்து மற்றும் மனை சேர்க்கை வாய்ப்புகள் சாதகமாக உள்ளன.`;
        timingWindow = `${winYearsStr} (சாதகமான சொத்து சேர்க்கை காலம்)`;
      } else {
        directAnswer = `உங்கள் ஜாதகத்தில் 4-ம் பாவகம் (${h4.sign || "சுக ஸ்தானம்"}) மற்றும் பூமி காரகன் செவ்வாயின் நிலைகள் சொத்து வாங்கும் அடிப்படை திறனை சுட்டிக்காட்டுகின்றன. ஆனால் துல்லியமான சொத்து சேர்க்கைக்கான குறிப்பிட்ட ஆண்டுக் காலம் தசா மற்றும் கோச்சார கணிதத்தில் தனித்து உறுதி செய்யப்படவில்லை.`;
        timingWindow = "NO_DISCRIMINATING_WINDOW";
      }
      reasoningChain = `4-ம் அதிபதியின் நிலை, செவ்வாயின் பலம் மற்றும் சுக்கிரனின் காரகத்துவங்கள் ஆராயப்பட்டு, நடப்பு தசா-புக்தி மற்றும் குரு பெயர்ச்சியின் சுப பார்வை இணையும் சாத்தியக்கூறுகள் பகுப்பாய்வு செய்யப்பட்டன.`;
      whatCannotBeConcluded = "ஜோதிடம் வாய்ப்புகளின் காலக்கட்டத்தை மட்டுமே சுட்டிக்காட்டுகிறது; சந்தை மதிப்பு, வங்கி கடன் அனுமதி போன்ற நடைமுறை நிபந்தனைகளை ஜாதகம் முடிவு செய்யாது.";
    } else {
      if (hasCalculatedWindow) {
        directAnswer = `Your 4th house of immovable property (${h4.sign || "Matru/Sukha Bhava"}) and Bhumi Karaka Mars indicate strong property acquisition potential, with opportunities clustering in the ${winYearsStr} window.`;
        timingWindow = `${winYearsStr} (Prime Property Window)`;
      } else {
        directAnswer = `Your 4th house of immovable property (${h4.sign || "Matru/Sukha Bhava"}) and Bhumi Karaka Mars indicate foundational property potential, though no discriminating chronological timing window has been specifically isolated without additional transit activation.`;
        timingWindow = "NO_DISCRIMINATING_WINDOW";
      }
      reasoningChain = `Synthesized 4th house dispositor, Mars strength, and supportive transit aspects of Jupiter crossing natal property significators.`;
      whatCannotBeConcluded = "Real estate astrological indicators mark opportune momentum; bank loan authorizations and commercial titles depend strictly on mundane legal processes.";
    }

    astroEvidenceList = [
      `4th House: ${h4.sign || "-"} ${h4.lord ? `(Lord: ${h4.lord})` : ""}`.trim(),
      `Mars (Bhumi Karaka): House ${mars.house || "-"}${mars.sign ? ` in ${mars.sign}` : ""}${mars.dignity ? ` (${mars.dignity})` : ""}`,
      hasCalculatedWindow ? `Property Timing Window: ${winYearsStr}` : "Property Timing Window: NO_DISCRIMINATING_WINDOW"
    ];
    relevantSections = ["property", "assets", "timeline"];
    evidenceIds = ["HOUSE_FACT_H4", "PLANET_FACT_MARS", hasCalculatedWindow ? "TIMING_WIN_PROPERTY" : "TIMING_WIN_NO_WINDOW"];
    if (h4.lord) evidenceIds.push(`LORD_FACT_L4`);
  }

  // CASE 7: FINANCE & WEALTH (TRADITIONAL CORRESPONDENCE)
  else if (domainResult.domains?.includes("finance") || intentResult.intents?.includes("FINANCE")) {
    const h2 = hMap[2] || {};
    const h11 = hMap[11] || {};
    const jup = pMap["Jupiter"] || {};

    if (isTamil) {
      directAnswer = `பாரம்பரிய ஜோதிட விதிகளின்படி, செல்வ வளம் மற்றும் நிதித் திறன் ஆகியவை உங்கள் 2-ம் பாவகமான தன ஸ்தானம் (${h2.sign ? `${toTamilRasi(h2.sign)}, அதிபதி: ${toTamilPlanet(h2.lord)}` : "தன ஸ்தானம்"}), 11-ம் பாவகமான லாப ஸ்தானம் (${h11.sign ? `${toTamilRasi(h11.sign)}, அதிபதி: ${toTamilPlanet(h11.lord)}` : "லாப ஸ்தானம்"}) மற்றும் தனகாரகன் குருவின் அமைப்பைக் கொண்டு சீராக மதிப்பிடப்படுகின்றன.`;
      reasoningChain = `வருமான ஓட்டத்தை குறிக்கும் 11-ம் இடமும், சேமிப்பு மற்றும் பூர்வீக செல்வத்தை குறிக்கும் 2-ம் இடமும், லக்ன தர்மகர்மாதிபதிகளுடன் கொண்டுள்ள தொடர்புகள் பகுப்பாய்வு செய்யப்பட்டன.`;
      whatCannotBeConcluded = "முதலீட்டு லாபங்கள் அல்லது குறிப்பிட்ட வருமானத் தொகையை ஜோதிட ரீதியாக உத்தரவாதம் அளிக்க முடியாது; வணிக முடிவுகள் சுய நிதி ஆலோசனையை சார்ந்தவை.";
    } else {
      directAnswer = `Under classical Jyotish correspondence, wealth capacity and monetary inflow are evaluated through your 2nd house of accumulated reserves (${h2.sign ? `${h2.sign}, ruled by ${h2.lord}` : "Dhana Bhava"}), 11th house of recurrent gains (${h11.sign ? `${h11.sign}, ruled by ${h11.lord}` : "Labha Bhava"}), and natural Dhanakaraka Jupiter${jup.house ? ` (positioned in House ${jup.house}${jup.dignity ? `, ${jup.dignity}` : ""})` : ""}.`;
      reasoningChain = `Evaluated reciprocal dispositions between the 2nd and 11th wealth houses along with Dhanakaraka Jupiter governing financial liquidity and resource preservation.`;
      whatCannotBeConcluded = "Astrological indicators reflect wealth capacity and flow patterns; guaranteed investment returns or specific rupee profits cannot be concluded.";
    }

    astroEvidenceList = [
      `2nd House (Dhana Bhava): ${h2.sign || "-"} ${h2.lord ? `(Lord: ${h2.lord})` : ""}`.trim(),
      `11th House (Labha Bhava): ${h11.sign || "-"} ${h11.lord ? `(Lord: ${h11.lord})` : ""}`.trim(),
      `Jupiter (Dhana Karaka): House ${jup.house || "-"}${jup.sign ? ` in ${jup.sign}` : ""}${jup.dignity ? ` (${jup.dignity})` : ""}`
    ];
    relevantSections = ["finance", "wealth"];
    evidenceIds = ["HOUSE_FACT_H2", "HOUSE_FACT_H11", "PLANET_FACT_JUPITER"];
    if (h2.lord) evidenceIds.push(`LORD_FACT_L2`);
    if (h11.lord) evidenceIds.push(`LORD_FACT_L11`);
  }

  // CASE 8: WELLNESS & VITALITY (STRICT MEDICAL SAFETY & TRADITIONAL CORRESPONDENCE)
  else if (domainResult.domains?.includes("wellness") || intentResult.intents?.includes("WELLNESS")) {
    const h1 = hMap[1] || {};
    const h6 = hMap[6] || {};
    const sun = pMap["Sun"] || {};

    if (isTamil) {
      directAnswer = `பாரம்பரிய ஜோதிட விதிகளின்படி, உடலியல் சமநிலை மற்றும் தேக ஆரோக்கியம் ஆகியவை லக்ன பாவகமான தேக ஸ்தானம் (${h1.sign ? `${toTamilRasi(h1.sign)}, அதிபதி: ${toTamilPlanet(h1.lord)}` : "லக்னம்"}), 6-ம் பாவகமான ரோக ஸ்தானம் (${h6.sign ? `${toTamilRasi(h6.sign)}, அதிபதி: ${toTamilPlanet(h6.lord)}` : "ரோக ஸ்தானம்"}) மற்றும் இயற்கை காரகன் சூரியனின் அமைப்பைக் கொண்டு பாரம்பரிய முறையில் மட்டுமே விளக்கப்படுகின்றன. (இது மருத்துவ ஆலோசனை அல்லது நோய் கண்டறிதல் அல்ல; பாரம்பரிய ஜோதிட வழிகாட்டல் மட்டுமே).`;
      reasoningChain = `லக்னாதிபதியின் சுப பார்வை மற்றும் 6-ம் பாவகத்தின் சாத்வீக கிரக தொடர்பு மூலம் பாரம்பரிய உடல் சமநிலை மற்றும் அன்றாட சுறுசுறுப்பு போக்குகள் மதிப்பிடப்பட்டன.`;
      whatCannotBeConcluded = "ஜோதிடம் நோய்களை கண்டறியவோ, அறுவை சிகிச்சை அல்லது மருத்துவ முடிவுகளை கணிக்கவோ முடியாது. உடல்நலக் குறைபாடுகளுக்கு தகுதியான மருத்துவரை அணுக வேண்டும்.";
    } else {
      directAnswer = `Under classical Jyotish correspondence, physical vitality is traditionally examined through the 1st house of constitutional disposition (${h1.sign ? `${h1.sign}, ruled by ${h1.lord}` : "Tanu Bhava"}), the 6th house of bodily imbalances (${h6.sign ? `${h6.sign}, ruled by ${h6.lord}` : "Roga Bhava"}), and natural karaka Sun${sun.house ? ` (House ${sun.house}${sun.dignity ? `, ${sun.dignity}` : ""})` : ""}. (Traditional astrological correspondence only; strictly not medical advice or clinical diagnosis).`;
      reasoningChain = `Evaluated 1st house lord disposition relative to 6th house factors under classical Parashari principles for constitutional endurance and physical balance.`;
      whatCannotBeConcluded = "Astrology never diagnoses medical diseases, predicts surgeries, or guarantees pathological outcomes. All health concerns require licensed medical consultation.";
    }

    astroEvidenceList = [
      `1st House (Tanu Bhava): ${h1.sign || "-"} ${h1.lord ? `(Lord: ${h1.lord})` : ""}`.trim(),
      `6th House (Roga Bhava): ${h6.sign || "-"} ${h6.lord ? `(Lord: ${h6.lord})` : ""}`.trim(),
      `Sun (Vitality Karaka): House ${sun.house || "-"}${sun.sign ? ` in ${sun.sign}` : ""}${sun.dignity ? ` (${sun.dignity})` : ""}`
    ];
    relevantSections = ["health", "wellness"];
    evidenceIds = ["HOUSE_FACT_H1", "HOUSE_FACT_H6", "PLANET_FACT_SUN"];
    if (h1.lord) evidenceIds.push(`LORD_FACT_L1`);
    if (h6.lord) evidenceIds.push(`LORD_FACT_L6`);
  }

  // CASE 9: LEGAL & CAUTION WINDOW (STRICT LEGAL SAFETY & CALCULATED TRANSITS)
  else if (domainResult.domains?.includes("legal") || domainResult.domains?.includes("caution") || intentResult.intents?.includes("LEGAL")) {
    const h6 = hMap[6] || {};
    const h8 = hMap[8] || {};
    const sat = pMap["Saturn"] || {};
    const rawChart = evidence.chart || {};
    const gochar = rawChart.gocharDashboard || {};
    const satGochar = gochar.saturnGochar || gochar.planets?.Saturn || null;
    const rahuGochar = gochar.planets?.Rahu || null;

    let transitDetailEn = "transiting Saturn and Rahu";
    let transitDetailTa = "கோச்சார சனி மற்றும் ராகுவின் சஞ்சார நிலைகள்";
    if (satGochar && satGochar.sign) {
      transitDetailEn = `transit Saturn in ${satGochar.sign}${satGochar.houseFromLagna ? ` (House ${satGochar.houseFromLagna})` : ""}${rahuGochar?.sign ? ` and transit Rahu in ${rahuGochar.sign}` : ""}`;
      transitDetailTa = `கோச்சார சனி ${satGochar.signTamil || toTamilRasi(satGochar.sign)} ராசியிலும்${rahuGochar?.sign ? `, ராகு ${rahuGochar.signTamil || toTamilRasi(rahuGochar.sign)} ராசியிலும்` : ""} சஞ்சரிக்கும் சூழல்`;
    }

    if (isTamil) {
      directAnswer = `பாரம்பரிய ஜோதிட விதிகளின்படி, வழக்குகள் மற்றும் சட்ட விவகாரங்களுக்கான சாத்தியக்கூறுகள் 6-ம் பாவகமான சத்ரு/வழக்கு ஸ்தானம் (${h6.sign ? `${toTamilRasi(h6.sign)}, அதிபதி: ${toTamilPlanet(h6.lord)}` : "6-ம் பாவகம்"}), 8-ம் பாவகமான நீதிமன்ற இழுபறி ஸ்தானம் (${h8.sign ? `${toTamilRasi(h8.sign)}, அதிபதி: ${toTamilPlanet(h8.lord)}` : "8-ம் பாவகம்"}) மற்றும் ${transitDetailTa} கொண்டு கவனமாக ஆராயப்படுகின்றன. (நீதிமன்ற தீர்ப்புகளையோ சட்ட முடிவுகளையோ ஜோதிடத்தால் உறுதியாக கணிக்க முடியாது; சட்ட ஆலோசனைகளுக்கு தகுதியான வழக்கறிஞரை அணுக வேண்டும்).`;
      reasoningChain = `6-ம் பாவக அதிபதியின் தொடர்பு மற்றும் 8-ம் பாவகம் மீதான கோச்சார கிரகங்களின் பார்வை/சஞ்சாரம் கணக்கிடப்பட்டு முன்னெச்சரிக்கை வழிகாட்டல் கட்டமைக்கப்பட்டது.`;
      timingWindow = "கோச்சார சனி/ராகுவின் கடின பார்வை காலங்களில் கூடுதல் விழிப்புணர்வு தேவை";
      whatCannotBeConcluded = "நீதிமன்ற முடிவுகள், வழக்கு வெற்றிகள் அல்லது சட்டப்பூர்வ தீர்ப்புகளை ஜோதிடத்தால் உறுதியாக கணிக்க முடியாது. சட்ட விஷயங்களுக்கு வழக்கறிஞரை அணுக வேண்டும்.";
    } else {
      directAnswer = `Under classical Jyotish correspondence, formal disputes, contractual liabilities, and contestation are examined through your 6th house of litigation (${h6.sign ? `${h6.sign}, ruled by ${h6.lord}` : "Ripu Bhava"}), 8th house of unforeseen delays (${h8.sign ? `${h8.sign}, ruled by ${h8.lord}` : "Randhra Bhava"}), and ${transitDetailEn}. (Astrology cannot guarantee legal or judicial outcomes or predict court verdicts; licensed legal counsel must be consulted).`;
      reasoningChain = `Traced 6th house of contestation, 8th house of litigation vulnerability, and calculated transits to delineate prudent advisory windows.`;
      timingWindow = "Caution advisory window active during intense transits";
      whatCannotBeConcluded = "Court verdicts, litigation victories, and statutory rulings cannot be deterministically predicted. Licensed legal counsel must be consulted.";
    }

    astroEvidenceList = [
      `6th House (Contestation): ${h6.sign || "-"} ${h6.lord ? `(Lord: ${h6.lord})` : ""}`.trim(),
      `8th House (Vulnerability): ${h8.sign || "-"} ${h8.lord ? `(Lord: ${h8.lord})` : ""}`.trim(),
      satGochar?.sign
        ? `Transit Saturn: ${satGochar.sign} (House from Lagna: ${satGochar.houseFromLagna || satGochar.houseFromMoon || "-"})`
        : `Natal Saturn: House ${sat.house || "-"} in ${sat.sign || "-"}`
    ];
    relevantSections = ["caution", "legal", "dosha"];
    evidenceIds = ["HOUSE_FACT_H6", "HOUSE_FACT_H8", "CHART_FACT_SATURN", "TRANSIT_FACT_SATURN"];
    if (h6.lord) evidenceIds.push(`LORD_FACT_L6`);
    if (h8.lord) evidenceIds.push(`LORD_FACT_L8`);
  }

  // CASE 10: MAJOR MILESTONES (NEXT 3 YEARS TIMELINE)
  else if (domainResult.domains?.includes("milestones") || entities.durationYears || intentResult.intents?.includes("MAJOR_MILESTONE")) {
    const rawChart = evidence.chart || {};
    const curYear = new Date().getFullYear();
    const durationYears = entities.durationYears || 3;
    const timelineRes = generateMilestoneTimeline({ chart: rawChart, startYear: curYear, durationYears, isTamil });

    if (timelineRes.status === "INSUFFICIENT_DATA") {
      if (isTamil) {
        directAnswer = timelineRes.narrativeTa;
        reasoningChain = "மைல்கல் காலக்கோடு நிர்ணயிக்க முழுமையான விம்சோத்தரி தசா கணக்கீடுகள் தேவைப்படுகின்றன.";
        whatCannotBeConcluded = "தசா காலங்கள் இன்றி காலவரிசை வாழ்வியல் நிகழ்வுகளை உறுதியாக கணிக்க முடியாது.";
      } else {
        directAnswer = timelineRes.narrativeEn;
        reasoningChain = "Chronological milestone timeline requires verified Vimshottari Dasha periods.";
        whatCannotBeConcluded = "Cannot establish multi-year milestones without authentic Dasha periods.";
      }
      timingWindow = "NOT_ESTABLISHED";
      astroEvidenceList = ["Vimshottari Dasha: INSUFFICIENT_DATA"];
      relevantSections = ["timeline", "milestones"];
      evidenceIds = [];
    } else {
      if (isTamil) {
        directAnswer = `அடுத்த ${durationYears} வருடங்களில் (${curYear}–${curYear + durationYears - 1}), உங்கள் ஜாதகத்தில் தசா கால மாற்றங்களும் குரு மற்றும் சனி பகவானின் முக்கிய கோச்சார பெயர்ச்சிகளும் தொழில் முன்னேற்றம், சமூக அங்கீகாரம், நிதி வளர்ச்சி மற்றும் குடும்பப் பொறுப்புகளில் கணிசமான வாழ்வியல் மாற்றங்களை ஏற்படுத்துகின்றன.\n\n${timelineRes.narrativeTa}`;
        reasoningChain = `அடுத்த ${durationYears} ஆண்டுகளின் காலவரிசைப்படி நடப்பு தசா-அந்தர்தசைகள், குரு மற்றும் சனி கோச்சார சஞ்சாரங்கள் இணைக்கப்பட்டு இந்த பல்துறை மைல்கல் தொகுப்பு உருவாக்கப்பட்டது.`;
        timingWindow = `${curYear} - ${curYear + durationYears - 1} (ஆண்டுவாரியான பல்துறை மைல்கல் காலக்கோடு)`;
        whatCannotBeConcluded = "காலக்கோடு வாழ்வியல் வாய்ப்புகளின் போக்கை விவரிக்கிறது; தனிப்பட்ட முடிவுகளின்றி தானியங்கி மாற்றங்களை உறுதி செய்ய முடியாது.";
      } else {
        directAnswer = `Across the upcoming ${durationYears} years (${curYear}–${curYear + durationYears - 1}), chronological Dasha progressions combined with major Saturn and Jupiter transits indicate meaningful developmental milestones across career trajectory, asset acquisition, finance, and relationships:\n\n${timelineRes.narrativeEn}`;
        reasoningChain = `Mapped progressive sub-dasha horizons and major planet ingress dates to construct an integrated chronological milestone continuum.`;
        timingWindow = `${curYear} - ${curYear + durationYears - 1} (Chronological Milestone Continuum)`;
        whatCannotBeConcluded = "Milestone horizons outline optimal developmental cycles; real-world actualization depends on human agency.";
      }

      astroEvidenceList = [
        `Chronological Horizon: ${curYear} to ${curYear + durationYears - 1}`,
        `Active Dasha: ${evidence.activeDasha?.mahadasha || "Ascendant Lord"} Mahadasha`,
        `Transit Regimes: Saturn & Jupiter cyclical ingress mapped per year`,
        ...(timelineRes.years || []).map(y => isTamil
          ? `ஆண்டு ${y.year}: ${y.dashaPeriodTa} (${y.transitsTa})`
          : `Year ${y.year}: ${y.dashaPeriod} (${y.transitsEn})`
        )
      ];
      relevantSections = ["timeline", "milestones", "career"];
      evidenceIds = Array.from(new Set([
        buildTimingWindowId(curYear, curYear + durationYears - 1),
        ...(timelineRes.evidenceIds || [])
      ]));
    }
  }

  // DEFAULT / GENERAL / FACTUAL FALLBACK
  else {
    const p1 = Object.values(pMap)[0] || { name: "Lagna", sign: ascSign, house: 1 };
    if (isTamil) {
      directAnswer = `உங்கள் ஜாதக அமைப்பின்படி லக்னம் ${ascSign} ராசியாக அமைந்து, முக்கிய கிரக அமைப்புகள் இந்த கேள்விக்குரிய பாவகத்தில் சாதகமான தாக்கத்தை ஏற்படுத்துகின்றன.`;
      reasoningChain = `லக்னாதிபதி, ராசி அதிபதி மற்றும் பாவக அமைப்புகளின் கணித ஆதாரங்கள் அடிப்படையில் இந்த பகுப்பாய்வு கட்டமைக்கப்பட்டுள்ளது.`;
      whatCannotBeConcluded = "ஜாதகக் குறியீடுகள் வாழ்வின் பொதுவான போக்கை காட்டுகின்றன; புறநிலை காரணிகள் முடிவுகளை மாற்றக்கூடும்.";
    } else {
      directAnswer = `According to your calculated report, your Ascendant (Lagna) is ${ascSign}, with primary planetary dispositors defining the energetic framework for this inquiry.`;
      reasoningChain = `Synthesized chart blueprint dispositions and calculated planetary houses from the natal ledger.`;
      whatCannotBeConcluded = "Traditional chart factors indicate tendencies; external mundane variables influence final outcomes.";
    }

    astroEvidenceList = [
      `Ascendant: ${ascSign}`,
      `Primary Factor: ${p1.name} in House ${p1.house}`
    ];
    relevantSections = ["blueprint", "overview"];
    evidenceIds = [`CHART_FACT_ASC_${ascSign}`];
  }

  // Contradiction text
  if (contradictions && contradictions.hasContradictions) {
    contradictionNotes = isTamil ? contradictions.summaryTa : contradictions.summaryEn;
  } else {
    contradictionNotes = isTamil
      ? "முரண்பட்ட அல்லது எதிர்மறை கிரக அழுத்தங்கள் எதுவும் கணிசமாக இல்லை."
      : "No substantial contradictory or conflicting planetary indicators detected.";
  }

  // Section Headers
  const hDirect = isTamil ? "[நேரடி பதில் / அறிக்கை முடிவு]" : "[Direct Answer / Report Finding]";
  const hEvidence = isTamil ? "[ஜோதிட ஆதாரங்கள்]" : "[Astrological Evidence]";
  const hReasoning = isTamil ? "[எப்படி இந்த முடிவு வந்தது / பாரம்பரிய சூழல்]" : "[Evidence Reasoning / Traditional Context]";
  const hTiming = isTamil ? "[முக்கிய காலக்கோடு]" : "[Timing Window]";
  const hContradiction = isTamil ? "[முரண்பட்ட குறியீடுகள்]" : "[Contradictions & Counterweights]";
  const hStatus = isTamil ? "[ஆதார நிலை]" : "[Evidence Status]";
  const hResolution = isTamil ? "[துல்லிய நிலை]" : "[Timing Resolution]";
  const hLimitations = isTamil ? "[எதை உறுதியாக கூற முடியாது]" : "[What Cannot Be Concluded]";
  const hReportSections = isTamil ? "[அறிக்கைப் பிரிவுகள்]" : "[Relevant Report Sections]";

  // Build the 9-section Answer
  const answerParts = [
    `${hDirect}\n${directAnswer.trim()}`,
    `${hEvidence}\n${astroEvidenceList.map(e => `• ${e}`).join("\n")}`,
    `${hReasoning}\n${reasoningChain.trim()}`
  ];

  if (plan.includeTiming || timingWindow) {
    answerParts.push(`${hTiming}\n${timingWindow || (isTamil ? "தசா-கோச்சார சுப பார்வை காலம்" : "Favorable Dasha-Transit Window")}`);
  }

  answerParts.push(
    `${hContradiction}\n${contradictionNotes.trim()}`,
    `${hStatus}\n${resolution.evidenceStatus}`,
    `${hResolution}\n${resolution.timingResolution}`,
    `${hLimitations}\n${whatCannotBeConcluded.trim()}`,
    `${hReportSections}\n${relevantSections.join(", ")}`
  );

  // If Expert Mode, append technical precision section (Section 25)
  if (mode === "expert" || plan.mode === "expert") {
    const expertHeader = isTamil ? "[நுட்பமான ஜோதிட விவரங்கள் / Expert Astronomical Ledger]" : "[Expert Technical Synthesis / Astronomical Ledger]";
    const expertLines = [
      `• Ascendant: ${ascSign}`,
      ...Object.values(pMap).slice(0, 7).map(p => `• ${p.name}: ${p.sign} ${p.degree != null ? p.degree.toFixed(2) + '°' : ''} (House ${p.house}, Dignity: ${p.dignity})`),
      evidence.vargas?.D9?.ascendant ? `• D9 Navamsha Lagna: ${evidence.vargas.D9.ascendant}` : null,
      evidence.vargas?.D10?.ascendant ? `• D10 Dashamsha Lagna: ${evidence.vargas.D10.ascendant}` : null,
      evidence.kpData?.subLords?.["10"] ? `• KP 10th Sub-Lord: ${evidence.kpData.subLords["10"]}` : null,
      `• Evidence IDs: ${evidenceIds.join(", ")}`
    ].filter(Boolean);
    answerParts.push(`${expertHeader}\n${expertLines.join("\n")}`);
  }

  const fullAnswerText = answerParts.join("\n\n");

  const ansObj = buildAnswerObject({
    question: {
      questionId: plan?.questionId || "Q_SYNTH",
      rawQuestion: rawQ,
      language: lang,
      domain: plan?.primaryDomain || "GENERAL",
      subDomain: intentResult?.primaryIntent || "GENERAL",
      intent: intentResult?.primaryIntent || "GENERAL_INTERPRETATION",
      mode
    },
    interpretation: {
      directSummary: directAnswer,
      detailedReasoning: reasoningChain,
      primaryFactor: astroEvidenceList[0] || "",
      secondaryFactors: astroEvidenceList.slice(1),
      limitingFactors: [whatCannotBeConcluded],
      whatChangesNext: timingWindow
    },
    answerability: evidence.status === "INSUFFICIENT_DATA" ? "INSUFFICIENT_DATA" : "ANSWERABLE",
    resolution: resolution.timingResolution,
    conclusion: evidence.status === "INSUFFICIENT_DATA" ? "INSUFFICIENT_DATA" : (plan.primaryDomain === "wellness" ? "POSSIBLE" : "LIKELY"),
    confidenceClass: (contradictions?.confidenceClass) || "MODERATE",
    supportingEvidenceIds: evidenceIds,
    counterEvidenceIds: contradictions?.contradictions?.map(c => c.type) || [],
    timingWindows: Array.isArray(evidence.timingWindows) ? evidence.timingWindows : [],
    calculatedFacts: evidence.calculatedFacts || [],
    traditionalRules: evidence.traditionalRules || [],
    contradictions: contradictions?.contradictions || [],
    limitations: [whatCannotBeConcluded],
    missingEvidence: [],
    safetyFlags: []
  });

  return {
    answer: fullAnswerText,
    directAnswer,
    status: resolution.evidenceStatus,
    timingResolution: resolution.timingResolution,
    evidenceStatus: resolution.evidenceStatus,
    relevantSections,
    evidenceIds,
    dataUsed: astroEvidenceList,
    limitations: [whatCannotBeConcluded],
    answerObject: ansObj
  };
}
