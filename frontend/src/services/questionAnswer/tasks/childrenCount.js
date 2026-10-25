/**
 * SKR ASTRO — Children Count Task Evaluator
 * ============================================
 * Enforces the strict non-fabrication policy for child-count questions
 * ("how many children will we give birth", "எத்தனை குழந்தைகள் பிறக்கும்").
 *
 * Clearly separates:
 * 1. Exact count (unsupported by empirical or mathematical astrology)
 * 2. Childbirth occurrence & traditional qualitative symbolism
 * 3. Timing windows (conditional on verified dasha-transit activation)
 * 4. Medical fertility (strictly reserved for licensed clinical professionals)
 *
 * Never exposes raw internal tokens or code variables (exactCount=null, etc.) in prose.
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

  // Subject resolution ("we" -> COUPLE with single profile awareness)
  const subjectResolution = resolveChildrenSubject(question, context);

  // Count policy
  const countPolicy = {
    ...CHILDREN_COUNT_POLICY
  };

  // Qualitative chart check for traditional 5th-house / Jupiter context (never used to derive a count)
  const traditionalEvidence = evaluateChildrenTraditionalEvidence(context, { isTamil });
  const hasQualitativeContext = traditionalEvidence.status === "EVALUATED";

  const coupleNoticeEn = (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY")
    ? " (Note: Your question refers to a couple, but because only one birth chart is loaded, this reading reflects the individual chart only and cannot evaluate a combined couple profile.)"
    : "";

  const coupleNoticeTa = (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY")
    ? " (குறிப்பு: உங்கள் கேள்வி தம்பதியரைக் குறிப்பிட்டாலும், தற்போது ஒருவரின் ஜாதகம் மட்டுமே உள்ளதால், இது தனிநபர் ஜாதகக் குறியீடுகளை மட்டுமே குறிக்கும்; இருவரின் கூட்டு மதிப்பீடாகக் கருத முடியாது.)"
    : "";

  // Direct answer first: clear limitation, no code tokens in prose
  const directAnswer = isTamil
    ? `ஜாதகக் கணித மாதிரிகளின் மூலம் குழந்தைகளின் துல்லியமான எண்ணிக்கையை உறுதியாகக் கணக்கிட முடியாது.${coupleNoticeTa}`
    : `The application cannot reliably determine an exact number of children from astrological chart models.${coupleNoticeEn}`;

  const qualitativeNoteEn = hasQualitativeContext
    ? ` For classical qualitative context (without implying an integer count), your chart places the 5th house in ${traditionalEvidence.fifthHouse.sign} ruled by ${traditionalEvidence.fifthLord.planet} (House ${traditionalEvidence.fifthLord.house} in ${traditionalEvidence.fifthLord.sign}) and Putra Karaka Jupiter in House ${traditionalEvidence.jupiter.house} (${traditionalEvidence.jupiter.sign}).`
    : " Required 5th-house and Jupiter astrological factors are incomplete in the current context.";

  const qualitativeNoteTa = hasQualitativeContext
    ? ` பாரம்பரிய வழிகாட்டல் தகவலுக்காக மட்டும்: உங்கள் ஜாதகத்தில் 5-ம் புத்திர பாவகம் ${traditionalEvidence.fifthHouse.sign} ராசியிலும், அதன் அதிபதி ${traditionalEvidence.fifthLord.planet} ${traditionalEvidence.fifthLord.house}-ம் பாவகத்திலும் (${traditionalEvidence.fifthLord.sign}), புத்திர காரகன் குரு ${traditionalEvidence.jupiter.house}-ம் பாவகத்திலும் (${traditionalEvidence.jupiter.sign}) அமர்ந்துள்ளனர்.`
    : " மேலும் 5-ம் பாவகம் மற்றும் குரு தொடர்பான அடிப்படைத் தரவுகள் முழுமையாகக் கிடைக்கவில்லை.";

  const reason = isTamil
    ? `5-ம் பாவக கிரக அமைப்புகள், பார்வைகள் அல்லது வர்க்கச் சக்கரங்கள் மூலம் குழந்தைகளின் குறிப்பிட்ட எண்ணிக்கையை (1, 2, 3 போன்ற எண்களை) துல்லியமாக கணக்கிடுவதற்கு எவ்வித அறிவியல் கணித மாதிரியும் ஜோதிடத்தில் இல்லை.${qualitativeNoteTa}`
    : `No empirically validated model exists to convert 5th-house occupants, planetary aspects, Jupiter scores, or D7 Saptamsha divisions into an exact or estimated integer number of children.${qualitativeNoteEn}`;

  const limitation = isTamil
    ? "ஜோதிடக் கணிதம் குழந்தைகளின் எண்ணிக்கையையோ, பாலினத்தையோ அல்லது மருத்துவ ரீதியான கருவளத்தையோ தீர்மானிக்காது. குழந்தைப்பேறு மற்றும் குடும்ப நலம் தொடர்பான அனைத்து முடிவுகளுக்கும் தகுதியான மருத்துவ நிபுணர்களை அணுக வேண்டும்."
    : "Astrological chart interpretation does not establish an exact number of children, predict biological sex or gender, assess clinical fertility, or guarantee childbirth outcomes. All reproductive and family planning decisions require qualified healthcare consultation.";

  const limitingClaims = [
    "Exact or estimated number of children is not derivable from astrological symbolism.",
    "Do not derive child count from 5th-house occupants, planetary aspects, or divisional sign characteristics.",
    limitation
  ];

  if (subjectResolution.subject === "COUPLE" && subjectResolution.interpretationScope === "SINGLE_PROFILE_ONLY") {
    limitingClaims.push("Couple inquiry evaluated against a single chart profile; partner profile was not provided.");
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
    traditionalMethod: "Parashari 5th Bhava & Putra Karaka (Qualitative Guidance Only)",
    empiricalStatus: "NOT_VALIDATED"
  };
}
