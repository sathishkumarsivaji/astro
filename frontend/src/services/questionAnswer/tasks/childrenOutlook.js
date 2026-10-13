/**
 * ASTROVERSE — Children Outlook & Traditional Interpretation Task Evaluator
 * =========================================================================
 * Evaluates general children outlook questions ("will I get a children",
 * "will I have children", "எனக்கு குழந்தை பிறக்குமா") strictly under disclosed
 * traditional rules (5th house, 5th lord, Jupiter karaka, optional D7).
 *
 * Step 2: Resolves subject ("we" -> COUPLE, SINGLE_PROFILE_ONLY scope).
 * Step 4: Enforces explicit traditional evidence plan (requiredHouses: [5],
 *         requiredLords: ["5thLord"], requiredPlanets: ["Jupiter"], optionalVargas: ["D7"],
 *         interpretationPolicy: "TRADITIONAL_ONLY", medicalFertilityAssessment: false).
 * Step 6: Reuses structured traditional rules from childrenDomain.js.
 * Step 7: Delivers direct bounded answer first.
 * Step 8: Enforces answerability/confidence invariants when rules or evidence are missing.
 */

import { evaluateChildrenTraditionalEvidence } from "../../expertPrediction/domains/childrenDomain.js";
import { resolveChildrenSubject } from "./childrenCount.js";

export const CHILDREN_OUTLOOK_EVIDENCE_PLAN = Object.freeze({
  requiredHouses: [5],
  requiredLords: ["5thLord"],
  requiredPlanets: ["Jupiter"],
  optionalVargas: ["D7"],
  interpretationPolicy: "TRADITIONAL_ONLY",
  medicalFertilityAssessment: false
});

/**
 * Evaluates a children outlook or traditional interpretation inquiry.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user question
 * @param {Object} [params.context={}] - Execution context
 * @param {boolean} [params.isTamil=false] - Language flag
 * @param {string} [params.intent="CHILDREN_OUTLOOK"] - Specific children sub-intent
 * @returns {Object} Standardized Task Result
 */
export function evaluateChildrenOutlook({
  question = "",
  context = {},
  isTamil = false,
  intent = "CHILDREN_OUTLOOK"
} = {}) {
  const questionId = context.questionId || "TASK_CHILDREN_OUTLOOK";
  const subjectResolution = resolveChildrenSubject(question, context);
  const traditionalEvidence = evaluateChildrenTraditionalEvidence(context, { isTamil });

  const asksGender = /\b(boy|girl|son|daughter|male\s+child|female\s+child)\b|ஆண்\s*குழந்தை|பெண்\s*குழந்தை|மகன்|மகள்/i.test(question);

  // Missing required 5th house, 5th lord, or Jupiter -> explicit INSUFFICIENT_DATA
  if (traditionalEvidence.status === "INSUFFICIENT_DATA" || traditionalEvidence.missingEvidence.length > 0) {
    const missingStr = traditionalEvidence.missingEvidence.join(", ");
    const directAnswer = isTamil
      ? `பாரம்பரிய புத்திர பாவக ஆய்விற்குத் தேவையான ஜாதகக் காரணிகள் (${missingStr}) தற்போதைய தரவுகளில் இல்லை (INSUFFICIENT_DATA). எனவே குழந்தை தொடர்பான பாரம்பரிய ஆய்வை உறுதிப்படுத்த இயலாது.`
      : `Required chart factors for traditional children-domain analysis (${missingStr}) are missing from the current calculation context (INSUFFICIENT_DATA). A traditional children outlook cannot be established without these factors.`;

    const reason = isTamil
      ? `புத்திர பாவக ஆய்விற்கு 5-ம் பாவகம், 5-ம் அதிபதி மற்றும் புத்திர காரகன் குரு ஆகியவற்றின் நிலைகள் கட்டாயம் தேவை. விடுபட்ட தரவுகள்: ${missingStr}.`
      : `Traditional children-domain interpretation requires the 5th house cusp, the 5th house lord placement, and Putra Karaka Jupiter. Missing evidence: ${missingStr}.`;

    const limitation = isTamil
      ? "ஜாதகக் கணிதம் மருத்துவ ரீதியான கருவளத்தைத் தீர்மானிக்காது அல்லது குழந்தை பிறப்பை உத்தரவாதம் செய்யாது (fertilityStatus = NOT_ASSESSED, outcomeGuarantee = false)."
      : "Astrological chart interpretation does not assess medical fertility or guarantee whether you will have a child (fertilityStatus = NOT_ASSESSED, outcomeGuarantee = false).";

    return {
      questionId,
      intent,
      answerState: "INSUFFICIENT_DATA",
      interpretationType: "TRADITIONAL",
      interpretationPolicy: "TRADITIONAL_ONLY",
      medicalFertilityAssessment: false,
      fertilityStatus: "NOT_ASSESSED",
      exactChildCount: null,
      outcomeGuarantee: false,
      subjectResolution,
      evidencePlan: CHILDREN_OUTLOOK_EVIDENCE_PLAN,
      directAnswer,
      reason,
      limitation,
      recommendation: null,
      candidateWindows: [],
      timingResolution: "INSUFFICIENT_DATA",
      supportingRuleResults: [],
      limitingRuleResults: [],
      evaluatedRuleResults: [],
      missingEvidence: traditionalEvidence.missingEvidence,
      supportingClaims: [],
      limitingClaims: [
        `Missing required children-domain evidence: ${missingStr}`,
        limitation
      ],
      missingInputs: traditionalEvidence.missingEvidence,
      calculatedFacts: [],
      traditionalRules: [],
      traditionalMethod: "Parashari 5th Bhava, 5th Lord & Putra Karaka Jupiter",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // Step 8 invariant: If TRADITIONAL interpretation has zero evaluated rules -> UNSUPPORTED_TASK
  if (!traditionalEvidence.evaluatedRuleResults || traditionalEvidence.evaluatedRuleResults.length === 0) {
    const directAnswer = isTamil
      ? "இந்தக் கேள்விக்கான பாரம்பரிய புத்திர பாவக விதிகள் எதுவும் மதிப்பீடு செய்யப்படவில்லை (UNSUPPORTED_TASK)."
      : "No traditional children-domain rules were evaluated for this query (UNSUPPORTED_TASK).";

    return {
      questionId,
      intent,
      answerState: "UNSUPPORTED_TASK",
      conclusion: null,
      confidenceClass: null,
      interpretationType: "TRADITIONAL",
      interpretationPolicy: "TRADITIONAL_ONLY",
      medicalFertilityAssessment: false,
      fertilityStatus: "NOT_ASSESSED",
      exactChildCount: null,
      outcomeGuarantee: false,
      subjectResolution,
      evidencePlan: CHILDREN_OUTLOOK_EVIDENCE_PLAN,
      directAnswer,
      reason: directAnswer,
      limitation: "Traditional rules were not evaluated.",
      recommendation: null,
      candidateWindows: [],
      timingResolution: null,
      supportingRuleResults: [],
      limitingRuleResults: [],
      evaluatedRuleResults: [],
      missingEvidence: [],
      supportingClaims: [],
      limitingClaims: ["Zero traditional children rules evaluated."],
      missingInputs: ["Evaluated traditional children rules"],
      calculatedFacts: traditionalEvidence.calculatedFacts || [],
      traditionalRules: [],
      traditionalMethod: null,
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  const h5 = traditionalEvidence.fifthHouse;
  const l5 = traditionalEvidence.fifthLord;
  const jup = traditionalEvidence.jupiter;
  const d7 = traditionalEvidence.d7Summary;

  const coupleNoticeEn = (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY")
    ? " Note: Although your question uses 'we', only one birth profile (ACTIVE_PROFILE) is available, so this reading is scoped to SINGLE_PROFILE_ONLY and is not a couple assessment."
    : "";

  const coupleNoticeTa = (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY")
    ? " குறிப்பு: உங்கள் கேள்வி தம்பதியரைக் குறிப்பிட்டாலும், ஒருவரின் ஜாதகம் (ACTIVE_PROFILE) மட்டுமே உள்ளதால் இது ஒரு ஜாதகத்திற்கு மட்டுமே பொருந்தும் (SINGLE_PROFILE_ONLY)."
    : "";

  const genderNoticeEn = asksGender
    ? " The app does not predict or guarantee the sex/gender (boy or girl) of a child."
    : "";

  const genderNoticeTa = asksGender
    ? " குழந்தை ஆணா அல்லது பெண்ணா என்ற பாலினக் கணிப்பையோ உத்தரவாதத்தையோ இந்த அமைப்பு வழங்குவதில்லை."
    : "";

  const hasSupport = traditionalEvidence.supportingRuleResults.length > 0;
  const hasLimiting = traditionalEvidence.limitingRuleResults.length > 0;

  const balanceSummaryEn = (hasSupport && !hasLimiting)
    ? `Under classical Parashari rules, your 5th house (${h5.sign}), 5th lord ${l5.planet} (in House ${l5.house}, ${l5.sign}), and Putra Karaka Jupiter (in House ${jup.house}, ${jup.sign}) show supportive traditional progeny symbolism.`
    : (hasSupport && hasLimiting)
      ? `Under classical Parashari rules, your chart shows mixed traditional indicators across the 5th house (${h5.sign}), 5th lord ${l5.planet} (in House ${l5.house}, ${l5.sign}), and Putra Karaka Jupiter (in House ${jup.house}, ${jup.sign}), combining supportive placements with moderating factors.`
      : `Under classical Parashari rules, your 5th house (${h5.sign}), 5th lord ${l5.planet} (in House ${l5.house}, ${l5.sign}), and Putra Karaka Jupiter (in House ${jup.house}, ${jup.sign}) indicate moderating traditional factors that classical texts associate with patience.`;

  const balanceSummaryTa = (hasSupport && !hasLimiting)
    ? `பாரம்பரிய பராசர விதிகளின்படி, உங்கள் 5-ம் புத்திர பாவகம் (${h5.sign}), 5-ம் அதிபதி ${l5.planet} (${l5.house}-ம் வீடு, ${l5.sign}), மற்றும் புத்திர காரகன் குரு (${jup.house}-ம் வீடு, ${jup.sign}) ஆகியவை சாதகமான பாரம்பரிய குறியீடுகளைக் கொண்டுள்ளன.`
    : (hasSupport && hasLimiting)
      ? `பாரம்பரிய பராசர விதிகளின்படி, உங்கள் 5-ம் பாவகம் (${h5.sign}), 5-ம் அதிபதி ${l5.planet} (${l5.house}-ம் வீடு, ${l5.sign}), மற்றும் புத்திர காரகன் குரு (${jup.house}-ம் வீடு, ${jup.sign}) ஆகியவை ஆதரவான மற்றும் நிதானமான கலவையான பாரம்பரிய குறியீடுகளைக் காட்டுகின்றன.`
      : `பாரம்பரிய பராசர விதிகளின்படி, உங்கள் 5-ம் பாவகம் (${h5.sign}), 5-ம் அதிபதி ${l5.planet} (${l5.house}-ம் வீடு, ${l5.sign}), மற்றும் புத்திர காரகன் குரு (${jup.house}-ம் வீடு, ${jup.sign}) ஆகியவை பொறுமையைக் குறிக்கும் பாரம்பரிய குறியீடுகளைக் கொண்டுள்ளன.`;

  // Step 7: Direct answer first (mandatory bounded framing)
  const directAnswer = isTamil
    ? `தேர்ந்தெடுக்கப்பட்ட பாரம்பரிய புத்திர பாவக விதிகளின்படி ஜாதகத்தை ஆராயலாம்; ஆனால் இது மருத்துவ ரீதியான கருவளத்தைத் தீர்மானிக்காது அல்லது குழந்தை பிறப்பை உத்தரவாதம் செய்யாது (The chart can be discussed under the selected traditional children-related rules, but it does not determine medical fertility or guarantee whether you will have a child). ${balanceSummaryTa}${coupleNoticeTa}${genderNoticeTa}`
    : `The chart can be discussed under the selected traditional children-related rules, but it does not determine medical fertility or guarantee whether you will have a child. ${balanceSummaryEn}${coupleNoticeEn}${genderNoticeEn}`;

  const supportLinesEn = traditionalEvidence.supportingRuleResults.map(r => r.summaryEn);
  const limitLinesEn = traditionalEvidence.limitingRuleResults.map(r => r.summaryEn);
  const supportLinesTa = traditionalEvidence.supportingRuleResults.map(r => r.summaryTa);
  const limitLinesTa = traditionalEvidence.limitingRuleResults.map(r => r.summaryTa);

  const d7LineEn = d7 ? ` Optional D7 Saptamsha Lagna is in ${d7.ascendant}.` : "";
  const d7LineTa = d7 ? ` துணை வர்க்கமான D7 சப்தாம்ச லக்னம் ${d7.ascendant} ராசியில் உள்ளது.` : "";

  const reason = isTamil
    ? [
        `5-ம் பாவகம் மற்றும் அதிபதி: 5-ம் வீடு ${h5.sign}, அதிபதி ${l5.planet} ${l5.house}-ம் பாவகத்தில் (${l5.sign}) உள்ளார்.`,
        `புத்திர காரகன் குரு: குரு பகவான் ${jup.house}-ம் பாவகத்தில் (${jup.sign}) அமர்ந்துள்ளார்.${d7LineTa}`,
        supportLinesTa.length ? `ஆதரவான பாரம்பரிய விதிகள்: ${supportLinesTa.join(" ")}` : null,
        limitLinesTa.length ? `கட்டுப்படுத்தும் பாரம்பரிய விதிகள்: ${limitLinesTa.join(" ")}` : null
      ].filter(Boolean).join("\n• ")
    : [
        `5th House & Lord: 5th house is in ${h5.sign}${h5.occupants.length ? ` (occupied by ${h5.occupants.join(", ")})` : " (unoccupied)"}, and 5th lord ${l5.planet} is placed in House ${l5.house} (${l5.sign}).`,
        `Putra Karaka Jupiter: Jupiter is placed in House ${jup.house} (${jup.sign}).${d7LineEn}`,
        supportLinesEn.length ? `Supporting Traditional Rules: ${supportLinesEn.join(" ")}` : null,
        limitLinesEn.length ? `Moderating Traditional Rules: ${limitLinesEn.join(" ")}` : null
      ].filter(Boolean).join("\n• ");

  const limitation = isTamil
    ? "இந்த விளக்கம் பாரம்பரிய ஜோதிட குறியீடுகளை மட்டுமே அடிப்படையாகக் கொண்டது (TRADITIONAL_ONLY). இது மருத்துவ கருவள பரிசோதனை அல்ல (medicalFertilityAssessment = false, fertilityStatus = NOT_ASSESSED), குழந்தைகளின் எண்ணிக்கையையோ பாலினத்தையோ கணிக்காது, மற்றும் குழந்தை பிறப்பை உத்தரவாதம் செய்யாது (outcomeGuarantee = false)."
    : "This discussion is strictly a traditional symbolic interpretation (TRADITIONAL_ONLY). It is not a medical fertility assessment (medicalFertilityAssessment = false, fertilityStatus = NOT_ASSESSED), does not predict exact child count or sex/gender, and does not guarantee parenthood (outcomeGuarantee = false).";

  const limitingClaims = [
    ...limitLinesEn,
    limitation
  ];
  if (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY") {
    limitingClaims.push("Evaluated on SINGLE_PROFILE_ONLY; partner chart is not included.");
  }

  return {
    questionId,
    intent,
    answerState: "ANSWERED",
    interpretationType: "TRADITIONAL",
    interpretationPolicy: "TRADITIONAL_ONLY",
    medicalFertilityAssessment: false,
    fertilityStatus: "NOT_ASSESSED",
    exactChildCount: null,
    outcomeGuarantee: false,
    subjectResolution,
    evidencePlan: CHILDREN_OUTLOOK_EVIDENCE_PLAN,
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
    supportingClaims: supportLinesEn,
    limitingClaims,
    missingInputs: [],
    calculatedFacts: traditionalEvidence.calculatedFacts,
    traditionalRules: traditionalEvidence.traditionalRules,
    traditionalMethod: "Parashari 5th Bhava, 5th Lord, Putra Karaka Jupiter & D7 Saptamsha",
    empiricalStatus: "NOT_VALIDATED"
  };
}
