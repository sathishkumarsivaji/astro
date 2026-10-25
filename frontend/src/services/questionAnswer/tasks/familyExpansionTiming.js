/**
 * ASTROVERSE — Family Expansion & Children Timing Task Evaluator
 * ===============================================================
 * Evaluates timing questions for children/family expansion ("When will I have a child?",
 * follow-up "When?" after a children outlook question, "எப்போது குழந்தை பிறக்கும்?").
 *
 * Uses 5th house, 2nd/11th houses, 5th lord, Putra Karaka Jupiter, D7 Saptamsha,
 * and Vimshottari Dasha + Transit activation without fabricating windows or
 * guaranteeing conception/parenthood.
 */

import { evaluateChildrenTraditionalEvidence, calculateChildrenExpert } from "../../expertPrediction/domains/childrenDomain.js";
import { computeTimingWindows } from "../timingEngine.js";
import { resolveChildrenSubject } from "./childrenCount.js";

/**
 * Evaluates family expansion / children timing questions.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user question
 * @param {Object} [params.context={}] - Execution context
 * @param {boolean} [params.isTamil=false] - Language flag
 * @returns {Object} Standardized Task Result
 */
export function evaluateFamilyExpansionTiming({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_FAMILY_EXPANSION_TIMING";
  const subjectResolution = resolveChildrenSubject(question, context);
  const traditionalEvidence = evaluateChildrenTraditionalEvidence(context, { isTamil });

  // 1. Check required natal children factors first (5th house, 5th lord, Jupiter)
  if (traditionalEvidence.status === "INSUFFICIENT_DATA" || traditionalEvidence.missingEvidence.length > 0) {
    const missingStr = traditionalEvidence.missingEvidence.join(", ");
    const directAnswer = isTamil
      ? `குழந்தை மற்றும் குடும்ப விரிவாக்க காலக்கணிப்பிற்குத் தேவையான அடிப்படை ஜாதகக் காரணிகள் (${missingStr}) தற்போதைய தரவுகளில் இல்லை (INSUFFICIENT_DATA).`
      : `Required natal factors for family expansion timing (${missingStr}) are missing from the calculation context (INSUFFICIENT_DATA). Timing windows cannot be evaluated without these factors.`;

    return {
      questionId,
      intent: "FAMILY_EXPANSION_TIMING",
      answerState: "INSUFFICIENT_DATA",
      interpretationType: "TRADITIONAL",
      interpretationPolicy: "TRADITIONAL_ONLY",
      medicalFertilityAssessment: false,
      fertilityStatus: "NOT_ASSESSED",
      exactChildCount: null,
      outcomeGuarantee: false,
      subjectResolution,
      directAnswer,
      reason: directAnswer,
      limitation: "Astrological timing is symbolic and does not assess medical fertility or guarantee childbirth.",
      recommendation: null,
      candidateWindows: [],
      timingResolution: null,
      supportingRuleResults: [],
      limitingRuleResults: [],
      evaluatedRuleResults: [],
      missingEvidence: traditionalEvidence.missingEvidence,
      supportingClaims: [],
      limitingClaims: [`Missing required natal evidence: ${missingStr}`],
      missingInputs: traditionalEvidence.missingEvidence,
      calculatedFacts: [],
      traditionalRules: [],
      traditionalMethod: "Parashari 5th/2nd/11th Bhava & Jupiter Vimshottari Dasha Activation",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  const chart = context.chartData || context.chart || (context.planets ? context : {});
  const dashaTimeline = chart.dashaTimeline || chart.dashas || chart.dashaTable || context.dashaTimeline || [];
  const transits = chart.transits || chart.gocharDashboard || context.transits || {};
  const vargas = chart.vargas || context.vargas || {};

  // Enrich dasha timeline with activated houses if available
  let effectiveDashaTimeline = Array.isArray(dashaTimeline) ? [...dashaTimeline] : [];
  const fifthLordName = traditionalEvidence.fifthLord?.planet;

  // Evaluate via timingEngine
  const timingResult = computeTimingWindows({
    domain: "CHILDREN",
    chart,
    dashaTimeline: effectiveDashaTimeline,
    transits,
    vargas: {
      ...vargas,
      d7: vargas.D7 || vargas.d7 || (traditionalEvidence.d7Summary ? { ascendant: traditionalEvidence.d7Summary.ascendant } : null)
    },
    referenceYear: context.referenceYear || new Date().getFullYear()
  });

  let candidateWindows = Array.isArray(timingResult.timingWindows) ? [...timingResult.timingWindows] : [];

  // Fallback to expert domain timing if dashaTable has nested bukthis that computeTimingWindows didn't flatten
  if (candidateWindows.length === 0 && Array.isArray(chart.dashaTable) && chart.dashaTable.length > 0) {
    try {
      const expertRes = calculateChildrenExpert(chart, isTamil ? "ta" : "en");
      if (Array.isArray(expertRes?.primaryWindows) && expertRes.primaryWindows.length > 0) {
        candidateWindows = expertRes.primaryWindows
          .filter(w => w.startDate && w.endDate)
          .slice(0, 2)
          .map(w => ({
            id: w.windowId || `CHILDREN_WIN_${w.startDate}_${w.endDate}`,
            windowStart: w.startDate,
            windowEnd: w.endDate,
            resolution: w.resolution || "MONTH_RANGE",
            confidenceClass: "MODERATE",
            supportingEvidence: w.evidenceIds?.length ? w.evidenceIds : ["HOUSE_FACT_H5", "PLANET_FACT_JUPITER_KARAKA"],
            descriptionEn: `Traditional Dasha activation (${w.dashaFacts?.md?.lord || "MD"} - ${w.dashaFacts?.ad?.lord || "AD"}) connecting with 5th/2nd/11th progeny houses.`,
            descriptionTa: `5/2/11-ம் பாவகங்களை இயக்கும் ${w.dashaFacts?.md?.tamil || w.dashaFacts?.md?.lord || "மகாதசை"} - ${w.dashaFacts?.ad?.tamil || w.dashaFacts?.ad?.lord || "புக்தி"} காலம்.`
          }));
      }
    } catch (_err) {
      // Ignore expert adapter error and rely on candidateWindows
    }
  }

  const coupleNoticeEn = (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY")
    ? " Note: Only a single birth profile (ACTIVE_PROFILE) is evaluated (SINGLE_PROFILE_ONLY)."
    : "";

  const coupleNoticeTa = (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY")
    ? " குறிப்பு: இங்கு ஒருவரின் ஜாதகம் (ACTIVE_PROFILE) மட்டுமே ஆராயப்பட்டுள்ளது (SINGLE_PROFILE_ONLY)."
    : "";

  const limitation = isTamil
    ? "ஜோதிட காலக்கணிப்பு என்பது பாரம்பரிய தசா-கோச்சார குறியீடு மட்டுமே (TRADITIONAL_ONLY). இது மருத்துவ ரீதியான கருத்தரிப்பு காலத்தையோ, கருவளத்தையோ தீர்மானிக்காது மற்றும் குழந்தை பிறப்பை உத்தரவாதம் செய்யாது (fertilityStatus = NOT_ASSESSED, outcomeGuarantee = false)."
    : "Traditional timing windows reflect symbolic dasha-transit alignment only (TRADITIONAL_ONLY); they do not determine medical conception, assess clinical fertility, or guarantee childbirth (fertilityStatus = NOT_ASSESSED, outcomeGuarantee = false).";

  const h5 = traditionalEvidence.fifthHouse;
  const l5 = traditionalEvidence.fifthLord;
  const jup = traditionalEvidence.jupiter;

  if (candidateWindows.length === 0) {
    const directAnswer = isTamil
      ? `தற்போது கணக்கிடப்பட்ட தசா-கோச்சார காலக்கோட்டில் குடும்ப விரிவாக்கம் அல்லது புத்திர பாவகத்திற்கான தனித்துவமான காலக்கட்டம் எதுவும் உடனடியாகக் கண்டறியப்படவில்லை (NO_DISCRIMINATING_WINDOW). உங்கள் ஜாதகத்தில் 5-ம் வீடு ${h5.sign} (அதிபதி ${l5.planet} ${l5.house}-ம் வீட்டில்) மற்றும் குரு ${jup.house}-ம் வீட்டில் (${jup.sign}) உள்ளனர்; ஆனால் இது மருத்துவ கருவள கணிப்போ அல்லது குழந்தை பிறப்பு உத்தரவாதமோ அல்ல.${coupleNoticeTa}`
      : `The current calculated dasha-transit timeline does not isolate a discriminating timing window for family expansion within the evaluated horizon (NO_DISCRIMINATING_WINDOW). While your natal chart places the 5th house in ${h5.sign} (lord ${l5.planet} in House ${l5.house}) and Putra Karaka Jupiter in House ${jup.house} (${jup.sign}), this traditional analysis does not determine medical fertility or guarantee childbirth.${coupleNoticeEn}`;

    const reason = isTamil
      ? `5-ம் அதிபதி (${l5.planet}), புத்திர காரகன் குரு மற்றும் 2, 5, 11-ம் பாவகங்களின் தசா-கோச்சார இணைப்பு தற்போதைய கணக்கிடப்பட்ட காலக்கட்டத்தில் தனித்துவமாக ஒன்றிணையவில்லை.`
      : `A discriminating timing window requires simultaneous Vimshottari dasha and transit activation of the 5th lord (${l5.planet}), Putra Karaka Jupiter, and the 2nd/5th/11th houses. Current operative periods do not show a single isolated window.`;

    return {
      questionId,
      intent: "FAMILY_EXPANSION_TIMING",
      answerState: "NO_DISCRIMINATING_WINDOW",
      interpretationType: "TRADITIONAL",
      interpretationPolicy: "TRADITIONAL_ONLY",
      medicalFertilityAssessment: false,
      fertilityStatus: "NOT_ASSESSED",
      exactChildCount: null,
      outcomeGuarantee: false,
      subjectResolution,
      directAnswer,
      reason,
      limitation,
      recommendation: null,
      candidateWindows: [],
      timingResolution: null,
      supportingRuleResults: traditionalEvidence.supportingRuleResults,
      limitingRuleResults: traditionalEvidence.limitingRuleResults,
      evaluatedRuleResults: traditionalEvidence.evaluatedRuleResults,
      missingEvidence: [],
      supportingClaims: traditionalEvidence.supportingRuleResults.map(r => r.summaryEn),
      limitingClaims: [
        "No discriminating dasha-transit window isolated in the evaluated horizon.",
        limitation
      ],
      missingInputs: ["Complete multi-year Vimshottari antardasha/transit convergence"],
      calculatedFacts: traditionalEvidence.calculatedFacts,
      traditionalRules: traditionalEvidence.traditionalRules,
      traditionalMethod: "Parashari 5th/2nd/11th Bhava & Jupiter Vimshottari Dasha Activation",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  const primaryWin = candidateWindows[0];
  const windowStr = primaryWin.windowStart && primaryWin.windowEnd
    ? `${primaryWin.windowStart} – ${primaryWin.windowEnd}`
    : primaryWin.id;

  const directAnswer = isTamil
    ? `தேர்ந்தெடுக்கப்பட்ட பாரம்பரிய புத்திர பாவக மற்றும் தசா-கோச்சார விதிகளின்படி, குடும்ப விரிவாக்கத்திற்கு ஆதரவான பாரம்பரிய காலகட்டம்: ${windowStr}. எனினும், இது ஒரு பாரம்பரிய ஜோதிடக் குறியீடு மட்டுமே; இது மருத்துவ கருவளத்தைத் தீர்மானிக்காது அல்லது குழந்தை பிறப்பை உத்தரவாதம் செய்யாது.${coupleNoticeTa}`
    : `Under the selected traditional children-related and dasha-transit rules, a supportive traditional timing window for family expansion is ${windowStr}. However, this is a traditional symbolic window only; it does not determine medical fertility or guarantee whether or when you will have a child.${coupleNoticeEn}`;

  const reason = isTamil
    ? `${primaryWin.descriptionTa || "5-ம் பாவகம் மற்றும் குரு காரகத்துவம் தசா காலத்தில் இயக்கப்படுகிறது."} உங்கள் ஜாதகத்தில் 5-ம் வீடு ${h5.sign} (அதிபதி ${l5.planet}, ${l5.house}-ம் வீடு) மற்றும் புத்திர காரகன் குரு ${jup.house}-ம் வீட்டில் (${jup.sign}) அமைந்துள்ளனர்.`
    : `${primaryWin.descriptionEn || "Operative dasha periods activate the 5th house and Jupiter significators."} In your natal chart, the 5th house is in ${h5.sign} (lord ${l5.planet} in House ${l5.house}, ${l5.sign}) and Putra Karaka Jupiter is in House ${jup.house} (${jup.sign}).`;

  return {
    questionId,
    intent: "FAMILY_EXPANSION_TIMING",
    answerState: "ANSWERED",
    interpretationType: "TRADITIONAL",
    interpretationPolicy: "TRADITIONAL_ONLY",
    medicalFertilityAssessment: false,
    fertilityStatus: "NOT_ASSESSED",
    exactChildCount: null,
    outcomeGuarantee: false,
    subjectResolution,
    directAnswer,
    reason,
    limitation,
    recommendation: {
      preferredWindow: windowStr,
      primaryDashaPeriod: primaryWin.descriptionEn
    },
    candidateWindows,
    timingResolution: primaryWin.resolution || "YEAR",
    supportingRuleResults: traditionalEvidence.supportingRuleResults,
    limitingRuleResults: traditionalEvidence.limitingRuleResults,
    evaluatedRuleResults: traditionalEvidence.evaluatedRuleResults,
    missingEvidence: [],
    supportingClaims: [
      ...(primaryWin.supportingEvidence || []),
      ...traditionalEvidence.supportingRuleResults.map(r => r.summaryEn)
    ],
    limitingClaims: [
      ...traditionalEvidence.limitingRuleResults.map(r => r.summaryEn),
      limitation
    ],
    missingInputs: [],
    calculatedFacts: traditionalEvidence.calculatedFacts,
    traditionalRules: traditionalEvidence.traditionalRules,
    traditionalMethod: "Parashari 5th/2nd/11th Bhava & Jupiter Vimshottari Dasha Activation",
    empiricalStatus: "NOT_VALIDATED"
  };
}
