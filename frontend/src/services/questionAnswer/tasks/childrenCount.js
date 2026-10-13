/**
 * ASTROVERSE — Children Count Task Evaluator
 * ============================================
 * Enforces the strict non-fabrication policy for child-count questions
 * ("how many children will we give birth", "எத்தனை குழந்தைகள் பிறக்கும்").
 *
 * Step 2: Resolves subject ("we" -> COUPLE, SINGLE_PROFILE_ONLY scope).
 * Step 3: Establishes Count Policy BEFORE chart retrieval (exactCount: null,
 *         estimatedCount: null, empiricalModelAvailable: false).
 *         Never derives a number from 5th-house occupants, aspects, Jupiter score, or D7.
 * Step 7: Delivers the direct limitation answer first.
 */

import { evaluateChildrenTraditionalEvidence } from "../../expertPrediction/domains/childrenDomain.js";

export const CHILDREN_COUNT_POLICY = Object.freeze({
  answerState: "NOT_ESTABLISHED",
  requestedQuantity: "NUMBER_OF_CHILDREN",
  exactCount: null,
  estimatedCount: null,
  empiricalModelAvailable: false
});

/**
 * Resolves subject scope when a question uses plural/couple pronouns ("we", "us", "எங்களுக்கு").
 * Never represents a single birth profile as a couple assessment.
 *
 * @param {string} question
 * @param {Object} [context={}]
 * @returns {Object} { subject, availableProfiles, interpretationScope }
 */
export function resolveChildrenSubject(question = "", context = {}) {
  const raw = String(question || "");
  const isCouple = /\b(we|us|our|couple|both\s+of\s+us)\b|எங்களுக்கு|நமக்கு|நாங்கள்|நாம்/i.test(raw);
  const hasPartnerProfile = Boolean(
    context?.partnerChart ||
    context?.spouseChart ||
    (Array.isArray(context?.availableProfiles) && context.availableProfiles.includes("PARTNER_PROFILE"))
  );

  if (isCouple) {
    return {
      subject: "COUPLE",
      availableProfiles: hasPartnerProfile ? ["ACTIVE_PROFILE", "PARTNER_PROFILE"] : ["ACTIVE_PROFILE"],
      interpretationScope: hasPartnerProfile ? "COUPLE_PROFILES" : "SINGLE_PROFILE_ONLY"
    };
  }

  return {
    subject: "INDIVIDUAL",
    availableProfiles: ["ACTIVE_PROFILE"],
    interpretationScope: "SINGLE_PROFILE_ONLY"
  };
}

/**
 * Evaluates a children-count question under the strict count policy.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user question
 * @param {Object} [params.context={}] - Execution context
 * @param {boolean} [params.isTamil=false] - Language flag
 * @returns {Object} Standardized Task Result
 */
export function evaluateChildrenCount({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_CHILDREN_COUNT";

  // Step 2: Subject resolution ("we" -> COUPLE with SINGLE_PROFILE_ONLY scope)
  const subjectResolution = resolveChildrenSubject(question, context);

  // Step 3: Count policy BEFORE chart retrieval
  const countPolicy = {
    ...CHILDREN_COUNT_POLICY
  };

  // Optional qualitative chart check for traditional 5th-house / Jupiter context (never used to derive a number)
  const traditionalEvidence = evaluateChildrenTraditionalEvidence(context, { isTamil });
  const hasQualitativeContext = traditionalEvidence.status === "EVALUATED";

  const coupleNoticeEn = (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY")
    ? " Because your question refers to 'we' (a couple) while only a single birth chart (ACTIVE_PROFILE) is loaded, this response applies strictly to SINGLE_PROFILE_ONLY and cannot represent a combined couple assessment."
    : "";

  const coupleNoticeTa = (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY")
    ? " உங்கள் கேள்வி 'நாம்/எங்களுக்கு' (தம்பதியர்) என்று குறிப்பிட்டாலும், தற்போது ஒருவரின் ஜாதகம் (ACTIVE_PROFILE) மட்டுமே உள்ளதால், இது ஒரு ஜாதகத்திற்கு மட்டுமே பொருந்தும் (SINGLE_PROFILE_ONLY); இருவரின் கூட்டு மதிப்பீடாகக் கருத முடியாது."
    : "";

  // Step 7: Direct answer first
  const directAnswer = isTamil
    ? `நடைமுறையில் உள்ள ஜாதக மாதிரியின் மூலம் குழந்தைகளின் துல்லியமான எண்ணிக்கையை உறுதியாகக் கணக்கிட முடியாது (The app cannot reliably determine an exact number of children from the implemented chart model).${coupleNoticeTa}`
    : `The app cannot reliably determine an exact number of children from the implemented chart model.${coupleNoticeEn}`;

  const qualitativeNoteEn = hasQualitativeContext
    ? ` For traditional qualitative context only (without implying any count), your chart places the 5th house in ${traditionalEvidence.fifthHouse.sign} ruled by ${traditionalEvidence.fifthLord.planet} (House ${traditionalEvidence.fifthLord.house} in ${traditionalEvidence.fifthLord.sign}) and Putra Karaka Jupiter in House ${traditionalEvidence.jupiter.house} (${traditionalEvidence.jupiter.sign}).`
    : " Required 5th-house or Jupiter chart factors are also incomplete in the current context.";

  const qualitativeNoteTa = hasQualitativeContext
    ? ` பாரம்பரிய குறியீட்டு தகவலுக்காக மட்டும் (எண்ணிக்கையைக் குறிக்காமல்): உங்கள் ஜாதகத்தில் 5-ம் புத்திர பாவகம் ${traditionalEvidence.fifthHouse.sign} ராசியிலும், அதன் அதிபதி ${traditionalEvidence.fifthLord.planet} ${traditionalEvidence.fifthLord.house}-ம் பாவகத்திலும் (${traditionalEvidence.fifthLord.sign}), புத்திர காரகன் குரு ${traditionalEvidence.jupiter.house}-ம் பாவகத்திலும் (${traditionalEvidence.jupiter.sign}) உள்ளனர்.`
    : " மேலும் 5-ம் பாவகம் அல்லது குரு தொடர்பான அடிப்படைத் தரவுகளும் முழுமையாக இல்லை.";

  const reason = isTamil
    ? `5-ம் பாவகத்தில் உள்ள கிரகங்களின் எண்ணிக்கை, சுப பார்வைகள், குரு பகவானின் பலம் அல்லது D7 சப்தாம்ச ராசி அமைப்புகளைக் கொண்டு குழந்தைகளின் எண்ணிக்கையை (1, 2, 3 போன்ற எண்களை) கணக்கிடுவதற்கு நிரூபிக்கப்பட்ட அறிவியல் மாதிரி எதுவும் இல்லை (empiricalModelAvailable = false, exactCount = null).${qualitativeNoteTa}`
    : `No empirically validated model exists to convert 5th-house occupants, planetary aspects, Jupiter scores, or D7 Saptamsha sign characteristics into an exact or estimated integer number of children (empiricalModelAvailable = false, exactCount = null).${qualitativeNoteEn}`;

  const limitation = isTamil
    ? "ஜோதிடக் கணிதம் குழந்தைகளின் எண்ணிக்கையையோ, பாலினத்தையோ அல்லது மருத்துவ ரீதியான கருவளத்தையோ தீர்மானிக்காது (fertilityStatus = NOT_ASSESSED, outcomeGuarantee = false)."
    : "Astrological chart interpretation does not establish an exact number of children, predict child sex/gender, assess medical fertility, or guarantee parenthood (fertilityStatus = NOT_ASSESSED, outcomeGuarantee = false).";

  const limitingClaims = [
    "Exact or estimated number of children is not derivable from chart symbolism (answerState = NOT_ESTABLISHED).",
    "Do not derive child count from 5th-house occupants, planetary aspects, Jupiter score, or D7 sign characteristics.",
    limitation
  ];

  if (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY") {
    limitingClaims.push("Couple query ('we') evaluated against SINGLE_PROFILE_ONLY; partner profile is not assessed.");
  }

  return {
    questionId,
    intent: "CHILDREN_COUNT",
    answerState: "NOT_ESTABLISHED",
    requestedQuantity: "NUMBER_OF_CHILDREN",
    exactCount: null,
    exactChildCount: null,
    estimatedCount: null,
    empiricalModelAvailable: false,
    quantityModelValidation: false,
    interpretationType: "TRADITIONAL",
    interpretationPolicy: "TRADITIONAL_ONLY",
    medicalFertilityAssessment: false,
    fertilityStatus: "NOT_ASSESSED",
    outcomeGuarantee: false,
    subjectResolution,
    countPolicy,
    directAnswer,
    reason,
    limitation,
    recommendation: null,
    candidateWindows: [],
    timingResolution: null,
    supportingRuleResults: traditionalEvidence.supportingRuleResults || [],
    limitingRuleResults: traditionalEvidence.limitingRuleResults || [],
    evaluatedRuleResults: traditionalEvidence.evaluatedRuleResults || [],
    missingEvidence: traditionalEvidence.missingEvidence || [],
    supportingClaims: hasQualitativeContext
      ? [
          `5th House in ${traditionalEvidence.fifthHouse.sign} (Lord: ${traditionalEvidence.fifthLord.planet} in House ${traditionalEvidence.fifthLord.house})`,
          `Putra Karaka Jupiter in House ${traditionalEvidence.jupiter.house} (${traditionalEvidence.jupiter.sign})`
        ]
      : [],
    limitingClaims,
    missingInputs: ["Empirically validated child-count model"],
    calculatedFacts: traditionalEvidence.calculatedFacts || [],
    traditionalRules: traditionalEvidence.traditionalRules || [],
    traditionalMethod: "Parashari 5th Bhava & Putra Karaka (Count Policy: NOT_ESTABLISHED)",
    empiricalStatus: "NOT_VALIDATED"
  };
}
