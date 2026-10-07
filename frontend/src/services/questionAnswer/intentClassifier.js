/**
 * ASTROVERSE — Question Intent Classifier
 * ========================================
 * Maps user queries to fine-grained intent categories.
 * Supports all 33 mandated canonical intents.
 */

export const QUESTION_INTENTS = Object.freeze({
  GENERAL_INTERPRETATION: "GENERAL_INTERPRETATION",
  WHY_QUESTION: "WHY_QUESTION",
  TIMING: "TIMING",
  COMPARISON: "COMPARISON",
  SPOUSE_CHARACTERISTICS: "SPOUSE_CHARACTERISTICS",
  SPOUSE_FAMILY: "SPOUSE_FAMILY",
  SPOUSE_DIRECTION: "SPOUSE_DIRECTION",
  SPOUSE_DISTANCE: "SPOUSE_DISTANCE",
  MARRIAGE: "MARRIAGE",
  PROPERTY: "PROPERTY",
  CAREER: "CAREER",
  EDUCATION: "EDUCATION",
  CHILDREN: "CHILDREN",
  FOREIGN_TRAVEL: "FOREIGN_TRAVEL",
  VEHICLE: "VEHICLE",
  BUSINESS: "BUSINESS",
  JOB: "JOB",
  FINANCE: "FINANCE",
  FAMILY: "FAMILY",
  LEADERSHIP: "LEADERSHIP",
  WELLNESS: "WELLNESS",
  LEGAL: "LEGAL",
  SPIRITUAL: "SPIRITUAL",
  CAUTION: "CAUTION",
  MAJOR_MILESTONE: "MAJOR_MILESTONE",
  CURRENT_DASHA: "CURRENT_DASHA",
  DASHA_EFFECT: "DASHA_EFFECT",
  VARGA_INTERPRETATION: "VARGA_INTERPRETATION",
  PLANET_INTERPRETATION: "PLANET_INTERPRETATION",
  HOUSE_INTERPRETATION: "HOUSE_INTERPRETATION",
  YOGA_INTERPRETATION: "YOGA_INTERPRETATION",
  REMEDY: "REMEDY",
  SYSTEM_COMPARISON: "SYSTEM_COMPARISON",
  TOP_HEADINGS: "TOP_HEADINGS",
  FOLLOW_UP: "FOLLOW_UP",
  CLARIFICATION: "CLARIFICATION"
});

/**
 * Classifies the intent of a normalized question.
 *
 * @param {Object} normalizedQ - Output of normalizeQuestion
 * @param {Array} [history=[]] - Conversation history for follow-up resolution
 * @returns {Object} Intent classification { primaryIntent, intents: [], confidence: number }
 */
export function classifyIntent(normalizedQ, history = []) {
  const text = normalizedQ.raw || "";
  const norm = normalizedQ.normalized || "";
  const cues = normalizedQ.cues || {};

  const detectedIntents = new Set();

  // 1. Specialized Spouse & Relationship Intents
  if (/spouse.*family|family.*wealth|wife.*family|husband.*family|துணையின்\s*குடும்பம்|மாமியார்|மாமனார்/i.test(text) ||
      (cues.isComparison && /spouse|துணை|partner|wife|husband/i.test(text))) {
    detectedIntents.add(QUESTION_INTENTS.SPOUSE_FAMILY);
    if (cues.isComparison) detectedIntents.add(QUESTION_INTENTS.COMPARISON);
  }

  if (cues.isDirection || /direction|திசை|எந்த\s*திசை/i.test(text)) {
    if (/spouse|partner|wife|husband|marriage|துணை|திருமண/i.test(text)) {
      detectedIntents.add(QUESTION_INTENTS.SPOUSE_DIRECTION);
    }
  }

  if (cues.isDistance || /distance|how\s+far|தூரம்|தொலைவு|கிலோமீட்டர்/i.test(text)) {
    if (/spouse|partner|wife|husband|marriage|துணை|திருமண/i.test(text)) {
      detectedIntents.add(QUESTION_INTENTS.SPOUSE_DISTANCE);
    }
  }

  if (/spouse\s*(nature|behavior|looks|appearance|character)|துணை.*குணம்|துணை.*தோற்றம்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.SPOUSE_CHARACTERISTICS);
  }

  if (/marriage|wedding|spouse|partner|bride|groom|திருமணம்|கல்யாணம்|களத்திரம்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.MARRIAGE);
  }

  // 2. Dasha & Planetary Period Intents
  const hasDashaMention = /dasha|mahadasha|antardasha|bhukti|pratyantar|தசா|தசை|புக்தி|அந்தர்தசா/i.test(text);
  const hasPlanetPair = /\b(sun|moon|mars|mercury|jupiter|venus|saturn|rahu|ketu)\s*[-–/]\s*(sun|moon|mars|mercury|jupiter|venus|saturn|rahu|ketu)\b/i.test(norm) ||
    /(சூரியன்|சந்திரன்|செவ்வாய்|புதன்|குரு|சுக்கிரன்|சனி|ராகு|கேது)\s*[-–/]\s*(சூரியன்|சந்திரன்|செவ்வாய்|புதன்|குரு|சுக்கிரன்|சனி|ராகு|கேது)/i.test(text) ||
    /\bmoon\s+venus\b|\bvenus\s+moon\b/i.test(norm);

  if (hasDashaMention || hasPlanetPair) {
    detectedIntents.add(QUESTION_INTENTS.DASHA_EFFECT);
    if (/current|active|running|நடப்பு|தற்போதைய/i.test(text) || !hasPlanetPair) {
      detectedIntents.add(QUESTION_INTENTS.CURRENT_DASHA);
    }
  }

  // 3. Varga Divisional Interpretation
  if (/\b(d[1-9]|d[1-6][0-9]|navamsha|dashamsha|chaturthamsha|hora|saptamsha|shodashamsha|trimsamsha|shashtiamsha)\b/i.test(norm) ||
      /நவாம்சம்|தசாம்சம்|வர்க்க|வர்க்கம்|d9|d10|d4|d2|d16|d30|d60/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.VARGA_INTERPRETATION);
  }

  // 4. Domains
  if (/career|job|profession|promotion|work|office|தொழில்|வேலை|உத்தியோகம்|பதவி\s*உயர்வு/i.test(text)) {
    if (/job|employment|service|அலுவலக\s*பணி|வேலை/i.test(text)) {
      detectedIntents.add(QUESTION_INTENTS.JOB);
    } else if (/business|startup|trade|venture|commerce|சுயதொழில்|வியாபாரம்/i.test(text)) {
      detectedIntents.add(QUESTION_INTENTS.BUSINESS);
    } else {
      detectedIntents.add(QUESTION_INTENTS.CAREER);
    }
  }

  if (/property|real\s*estate|house|land|flat|bhoomi|நிலம்|சொத்து|வீடு|மனை/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.PROPERTY);
  }

  if (/vehicle|car|bike|conveyance|வாகனம்|கார்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.VEHICLE);
  }

  if (/finance|wealth|money|savings|income|cash|நிதி|பணம்|பொருளாதாரம்|சேமிப்பு|தன\s*வரவு/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.FINANCE);
  }

  if (/education|study|studies|exam|degree|college|school|academic|கல்வி|படிப்பு|தேர்வு|பல்கலைக்கழகம்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.EDUCATION);
  }

  if (/children|child|progeny|pregnancy|son|daughter|குழந்தை|புத்திர|பிள்ளை/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.CHILDREN);
  }

  if (/foreign|travel|abroad|overseas|visa|relocation|settlement|வெளிநாடு|பயணம்|குடியேற்றம்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.FOREIGN_TRAVEL);
  }

  if (/family|domestic|parents|mother|father|relatives|குடும்பம்|பெற்றோர்|தாய்|தந்தை/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.FAMILY);
  }

  if (/leadership|politics|power|authority|status|தலைமை|அரசியல்|ஆளுமை|அதிகாரம்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.LEADERSHIP);
  }

  if (/health|wellness|vitality|disease|immunity|illness|ஆரோக்கியம்|உடல்நலம்|நோய்|சுகாதாரம்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.WELLNESS);
  }

  if (/legal|court|litigation|case|dispute|lawsuit|சட்டம்|நீதிமன்றம்|வழக்கு|தகராறு/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.LEGAL);
  }

  if (/spiritual|meditation|moksha|god|guru|temple|ஆன்மீகம்|தியானம்|முக்தி|இறை/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.SPIRITUAL);
  }

  if (/caution|risk|danger|loss|accident|problem|எச்சரிக்கை|ஆபத்து|இடர்|பிரச்சனை|சிக்கல்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.CAUTION);
  }

  const isSystemMentioned = /lahiri|chitrapaksha|raman|tropical|\bkp\b|krishnamurti|லஹிரி|சித்திரபக்ஷ|கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி/i.test(text);
  if (!isSystemMentioned && (/milestone|next\s*\d+\s*years|life\s*stages|அடுத்த\s*\d+\s*(?:வருட|ஆண்டு)|வாழ்வில்\s*முக்கியமான\s*மாற்றங்கள்|மைல்கல்|திருப்புமுனை/i.test(text))) {
    detectedIntents.add(QUESTION_INTENTS.MAJOR_MILESTONE);
  }

  // 5. Astrological Techniques
  if (/yoga|yogas|யோகம்|யோகங்கள்|ராஜ\s*யோகம்|கஜகேசரி/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.YOGA_INTERPRETATION);
  }

  if (/\b(bhava|house|lord)\b|பாவகம்|பாவா|அதிபதி/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.HOUSE_INTERPRETATION);
  }

  if (/\b(sun|moon|mars|mercury|jupiter|venus|saturn|rahu|ketu)\b|சூரியன்|சந்திரன்|செவ்வாய்|புதன்|குரு|சுக்கிரன்|சனி|ராகு|கேது/i.test(text)) {
    if (!hasPlanetPair && !hasDashaMention) {
      detectedIntents.add(QUESTION_INTENTS.PLANET_INTERPRETATION);
    }
  }

  // 6. Remedy
  if (cues.isRemedy) {
    detectedIntents.add(QUESTION_INTENTS.REMEDY);
  }

  // 7. General qualifiers
  if (cues.isTiming) {
    detectedIntents.add(QUESTION_INTENTS.TIMING);
  }

  if (cues.isComparison) {
    detectedIntents.add(QUESTION_INTENTS.COMPARISON);
  }

  // System Comparison (Lahiri vs KP vs other systems)
  const isSystemComparisonDetected =
    /(lahiri|chitrapaksha).*(kp|krishnamurti)|(kp|krishnamurti).*(lahiri|chitrapaksha)/i.test(text) ||
    /difference.*between.*(lahiri|kp|raman|tropical)|compare.*(lahiri|kp|raman|tropical)|(changes?|switch).*(between|from).*(lahiri|kp)/i.test(text) ||
    /(லஹிரி|சித்திரபக்ஷ).*(கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி)|(கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி).*(லஹிரி|சித்திரபக்ஷ)/i.test(text) ||
    /((லஹிரி|சித்திரபக்ஷ).*மற்றும்.*(கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி))|((கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி).*மற்றும்.*(லஹிரி|சித்திரபக்ஷ))/i.test(text) ||
    /(லஹிரி|கே\.?பி|கேபி).*முறைகளுக்கு\s*இடையே.*(மாற்றங்கள்|வேறுபாடு|ஒப்பீடு)/i.test(text) ||
    /முறை.*ஒப்பீடு|வேறுபாடு.*(லஹிரி|கே\.?பி)|system.*comparison|between\s+(lahiri|kp)\s+and\s+(lahiri|kp)/i.test(text) ||
    ((/லஹிரி|சித்திரபக்ஷ/i.test(text) || /\blahiri\b/i.test(text)) && (/கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி/i.test(text) || /\bkp\b/i.test(text)));

  if (isSystemComparisonDetected) {
    detectedIntents.add(QUESTION_INTENTS.SYSTEM_COMPARISON);
    detectedIntents.add(QUESTION_INTENTS.COMPARISON);
  }

  // Top Report Headings
  if (/three.*(important|major|key).*(heading|section|topic|chapter)|3.*முக்கிய.*(தலைப்பு|பிரிவு)|முக்கியமான.*தலைப்புகள்|most\s+important\s+headings|top\s+headings/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.TOP_HEADINGS);
  }

  if (cues.isWhy) {
    detectedIntents.add(QUESTION_INTENTS.WHY_QUESTION);
  }

  if (cues.isFollowUp) {
    detectedIntents.add(QUESTION_INTENTS.FOLLOW_UP);
  }

  // Fallback to GENERAL_INTERPRETATION if nothing specific caught
  if (detectedIntents.size === 0) {
    detectedIntents.add(QUESTION_INTENTS.GENERAL_INTERPRETATION);
  }

  // Prioritize primary intent
  let primaryIntent = QUESTION_INTENTS.GENERAL_INTERPRETATION;
  const priorityList = [
    QUESTION_INTENTS.SYSTEM_COMPARISON,
    QUESTION_INTENTS.TOP_HEADINGS,
    QUESTION_INTENTS.SPOUSE_FAMILY,
    QUESTION_INTENTS.SPOUSE_DIRECTION,
    QUESTION_INTENTS.SPOUSE_DISTANCE,
    QUESTION_INTENTS.SPOUSE_CHARACTERISTICS,
    QUESTION_INTENTS.VARGA_INTERPRETATION,
    QUESTION_INTENTS.DASHA_EFFECT,
    QUESTION_INTENTS.CURRENT_DASHA,
    QUESTION_INTENTS.REMEDY,
    QUESTION_INTENTS.MAJOR_MILESTONE,
    QUESTION_INTENTS.TIMING,
    QUESTION_INTENTS.COMPARISON,
    QUESTION_INTENTS.LEGAL,
    QUESTION_INTENTS.WELLNESS,
    QUESTION_INTENTS.PROPERTY,
    QUESTION_INTENTS.CAREER,
    QUESTION_INTENTS.JOB,
    QUESTION_INTENTS.BUSINESS,
    QUESTION_INTENTS.FINANCE,
    QUESTION_INTENTS.MARRIAGE,
    QUESTION_INTENTS.EDUCATION,
    QUESTION_INTENTS.CHILDREN,
    QUESTION_INTENTS.FOREIGN_TRAVEL,
    QUESTION_INTENTS.VEHICLE,
    QUESTION_INTENTS.FAMILY,
    QUESTION_INTENTS.LEADERSHIP,
    QUESTION_INTENTS.SPIRITUAL,
    QUESTION_INTENTS.CAUTION,
    QUESTION_INTENTS.YOGA_INTERPRETATION,
    QUESTION_INTENTS.HOUSE_INTERPRETATION,
    QUESTION_INTENTS.PLANET_INTERPRETATION,
    QUESTION_INTENTS.WHY_QUESTION,
    QUESTION_INTENTS.FOLLOW_UP,
    QUESTION_INTENTS.GENERAL_INTERPRETATION
  ];

  for (const prio of priorityList) {
    if (detectedIntents.has(prio)) {
      primaryIntent = prio;
      break;
    }
  }

  return {
    primaryIntent,
    intents: Array.from(detectedIntents),
    confidence: detectedIntents.size > 0 ? 0.95 : 0.6,
    isTimingRequested: cues.isTiming,
    isComparisonRequested: cues.isComparison,
    isDirectionRequested: cues.isDirection,
    isDistanceRequested: cues.isDistance,
    isRemedyRequested: cues.isRemedy
  };
}
