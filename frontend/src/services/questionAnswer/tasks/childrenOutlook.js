/**
 * SKR ASTRO — Children Domain General Outlook Evaluator
 * ========================================================
 * Evaluates general qualitative children-domain inquiries ("can I have children",
 * "எங்களுக்கு குழந்தை பாக்கியம் உண்டா").
 *
 * Distinctly separates:
 * 1. Traditional qualitative Parashari interpretation (5th house, 5th lord, Jupiter)
 * 2. Childbirth occurrence and prospective timing windows (conditional on dasha/transit)
 * 3. Exact count & sex/gender exclusion (unsupported)
 * 4. Clinical fertility boundaries (strictly non-medical guidance)
 *
 * Strictly purges raw internal tokens or code expressions from customer prose.
 */

import { evaluateChildrenTraditionalEvidence } from "../../expertPrediction/domains/childrenDomain.js";
import { resolveChildrenSubject } from "./childrenCount.js";

export const CHILDREN_OUTLOOK_EVIDENCE_PLAN = Object.freeze({
  domain: "CHILDREN",
  primaryHouse: 5,
  primaryKaraka: "Jupiter",
  requiredPlanets: ["Jupiter"],
  optionalDivisionalCharts: ["d7"]
});

/**
 * Evaluates the children outlook task under strict non-medical traditional framing.
 *
 * @param {Object} params
 * @param {string} params.question
 * @param {Object} [params.context={}]
 * @param {boolean} [params.isTamil=false]
 * @returns {Object} Standardized Task Result
 */
export function evaluateChildrenOutlook({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_CHILDREN_OUTLOOK";
  const intent = "CHILDREN_OUTLOOK";

  const raw = String(question || "");
  const asksGender = /\b(boy|girl|son|daughter|male|female)\b|ஆண்|பெண்/i.test(raw);

  // Subject resolution ("we" -> COUPLE)
  const subjectResolution = resolveChildrenSubject(question, context);

  // Traditional evidence retrieval
  const traditionalEvidence = evaluateChildrenTraditionalEvidence(context, { isTamil });

  if (traditionalEvidence.status === "INSUFFICIENT_DATA") {
    const missingStr = traditionalEvidence.missingEvidence.join(", ");
    const directAnswer = isTamil
      ? `புத்திர பாவகம் தொடர்பான ஜோதிட ஆய்வுக்கு தேவையான அடிப்படைக் கணித விவரங்கள் முழுமையாகக் கிடைக்கவில்லை.`
      : `Sufficient chart factors for traditional children-domain evaluation are not available in the current calculation context.`;

    const reason = isTamil
      ? `பாரம்பரிய ஜோதிட கணிப்பிற்கு 5-ம் பாவகம், அதன் அதிபதி மற்றும் புத்திர காரகன் குருவின் துல்லிய நிலைகள் தேவைப்படுகின்றன. விடுபட்ட விவரங்கள்: ${missingStr}.`
      : `Traditional children-domain evaluation requires the 5th house cusp, 5th lord placement, and Putra Karaka Jupiter. Missing factors: ${missingStr}.`;

    const limitation = isTamil
      ? "ஜாதகக் கணிதம் மருத்துவ ரீதியான கருவளத்தைத் தீர்மானிக்காது அல்லது குழந்தை பிறப்பை உத்தரவாதம் செய்யாது. குடும்ப நலன் மற்றும் கருவளம் சார்ந்த அனைத்து வழிகாட்டல்களுக்கும் தகுதியான மருத்துவ நிபுணர்களை அணுக வேண்டும்."
      : "Astrological chart interpretation does not assess medical fertility, diagnose reproductive health, or guarantee parenthood. All fertility concerns require consultation with a licensed healthcare practitioner.";

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
      timingResolution: null,
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

  if (!traditionalEvidence.evaluatedRuleResults || traditionalEvidence.evaluatedRuleResults.length === 0) {
    const directAnswer = isTamil
      ? "இந்தக் கேள்விக்கான பாரம்பரிய புத்திர பாவக விதிகள் தற்போதைய கணிப்பில் கிடைக்கவில்லை."
      : "No traditional children-domain rules could be evaluated from the provided chart data.";

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
    ? " (Note: Although your inquiry refers to a couple, only one birth chart is loaded, so this reading reflects the individual chart profile only.)"
    : "";

  const coupleNoticeTa = (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY")
    ? " (குறிப்பு: உங்கள் கேள்வி தம்பதியரைக் குறிப்பிட்டாலும், ஒரு நபரின் ஜாதகம் மட்டுமே உள்ளதால் இது தனிநபர் ஜாதகக் குறியீடுகளை மட்டுமே குறிக்கும்.)"
    : "";

  const genderNoticeEn = asksGender
    ? " (The application does not predict or guarantee biological sex or gender of a child.)"
    : "";

  const genderNoticeTa = asksGender
    ? " (குழந்தை ஆணா அல்லது பெண்ணா என்ற பாலினக் கணிப்பையோ உத்தரவாதத்தையோ இந்த அமைப்பு வழங்குவதில்லை.)"
    : "";

  const hasSupport = traditionalEvidence.supportingRuleResults.length > 0;
  const hasLimiting = traditionalEvidence.limitingRuleResults.length > 0;

  const balanceSummaryEn = (hasSupport && !hasLimiting)
    ? `Under classical Parashari principles, your 5th house (${h5.sign}), 5th lord ${l5.planet} (House ${l5.house} in ${l5.sign}), and Putra Karaka Jupiter (House ${jup.house} in ${jup.sign}) indicate supportive traditional progeny symbolism.`
    : (hasSupport && hasLimiting)
      ? `Under classical Parashari principles, your chart presents mixed traditional indicators across the 5th house (${h5.sign}), 5th lord ${l5.planet} (House ${l5.house} in ${l5.sign}), and Putra Karaka Jupiter (House ${jup.house} in ${jup.sign}), combining supportive placements with moderating traditional factors.`
      : `Under classical Parashari principles, your 5th house (${h5.sign}), 5th lord ${l5.planet} (House ${l5.house} in ${l5.sign}), and Putra Karaka Jupiter (House ${jup.house} in ${jup.sign}) reflect moderating traditional factors that classical texts associate with patience.`;

  const balanceSummaryTa = (hasSupport && !hasLimiting)
    ? `பாரம்பரிய பராசர விதிகளின்படி, உங்கள் 5-ம் புத்திர பாவகம் (${h5.sign}), 5-ம் அதிபதி ${l5.planet} (${l5.house}-ம் வீடு, ${l5.sign}), மற்றும் புத்திர காரகன் குரு (${jup.house}-ம் வீடு, ${jup.sign}) ஆகியவை சாதகமான பாரம்பரிய குறியீடுகளைக் கொண்டுள்ளன.`
    : (hasSupport && hasLimiting)
      ? `பாரம்பரிய பராசர விதிகளின்படி, உங்கள் 5-ம் பாவகம் (${h5.sign}), 5-ம் அதிபதி ${l5.planet} (${l5.house}-ம் வீடு, ${l5.sign}), மற்றும் புத்திர காரகன் குரு (${jup.house}-ம் வீடு, ${jup.sign}) ஆகியவை ஆதரவான மற்றும் நிதானமான கலவையான பாரம்பரிய குறியீடுகளைக் காட்டுகின்றன.`
      : `பாரம்பரிய பராசர விதிகளின்படி, உங்கள் 5-ம் பாவகம் (${h5.sign}), 5-ம் அதிபதி ${l5.planet} (${l5.house}-ம் வீடு, ${l5.sign}), மற்றும் புத்திர காரகன் குரு (${jup.house}-ம் வீடு, ${jup.sign}) ஆகியவை பொறுமையைக் குறிக்கும் பாரம்பரிய குறியீடுகளைக் கொண்டுள்ளன.`;

  // Direct answer first: balanced, warm, professional, zero code tokens
  const directAnswer = isTamil
    ? `பாரம்பரிய புத்திர பாவக விதிகளின்படி உங்கள் ஜாதகக் குறியீடுகளை ஆராயலாம்; ஆனால் இது மருத்துவ ரீதியான கருவளத்தைத் தீர்மானிக்காது அல்லது குழந்தை பிறப்பை உத்தரவாதம் செய்யாது. ${balanceSummaryTa}${coupleNoticeTa}${genderNoticeTa}`
    : `The chart can be discussed under classical traditional children-related astrological rules, but this analysis does not determine medical fertility or guarantee childbirth outcomes. ${balanceSummaryEn}${coupleNoticeEn}${genderNoticeEn}`;

  const supportLinesEn = traditionalEvidence.supportingRuleResults.map(r => r.summaryEn);
  const limitLinesEn = traditionalEvidence.limitingRuleResults.map(r => r.summaryEn);
  const supportLinesTa = traditionalEvidence.supportingRuleResults.map(r => r.summaryTa);
  const limitLinesTa = traditionalEvidence.limitingRuleResults.map(r => r.summaryTa);

  const d7LineEn = d7 ? ` Optional D7 Saptamsha Lagna is placed in ${d7.ascendant}.` : "";
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
    ? "இந்த ஆய்வு பாரம்பரிய ஜோதிடக் குறியீடுகளை மட்டுமே அடிப்படையாகக் கொண்டது. இது மருத்துவ கருவள பரிசோதனை அல்ல; குழந்தைகளின் எண்ணிக்கையையோ பாலினத்தையோ கணிக்காது, மற்றும் குழந்தை பிறப்பை உத்தரவாதம் செய்யாது. அனைத்து மருத்துவ முடிவுகளுக்கும் மருத்துவர்களை அணுக வேண்டும்."
    : "This discussion reflects classical traditional astrological correspondence only. It does not constitute a clinical medical fertility assessment, does not predict exact child count or biological sex/gender, and does not guarantee parenthood. Qualified healthcare professionals must guide all family planning and reproductive decisions.";

  const limitingClaims = [
    ...limitLinesEn,
    limitation
  ];

  return {
    questionId,
    intent,
    answerState: "ANSWERED",
    conclusion: hasSupport ? "POSSIBLE" : "MODERATE",
    confidenceClass: "MODERATE",
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
    traditionalMethod: "Parashari 5th Bhava, 5th Lord & Putra Karaka Jupiter",
    empiricalStatus: "NOT_VALIDATED"
  };
}
