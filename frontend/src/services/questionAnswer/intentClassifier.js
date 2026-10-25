/**
 * SKR ASTRO — Question Intent Classifier
 * ========================================
 * Maps user queries to fine-grained intent categories.
 * Supports all 33 mandated canonical intents.
 */

export const CHILDREN_TASKS = Object.freeze({
  CHILDREN_COUNT: "CHILDREN_COUNT",
  CHILDREN_OUTLOOK: "CHILDREN_OUTLOOK",
  FAMILY_EXPANSION_TIMING: "FAMILY_EXPANSION_TIMING",
  CHILDREN_TRADITIONAL_INTERPRETATION: "CHILDREN_TRADITIONAL_INTERPRETATION"
});

export const TASK_INTENTS = Object.freeze({
  DAILY_DRESS_COLOR: "DAILY_DRESS_COLOR",
  RESEARCH_SUBMISSION_ELECTION: "RESEARCH_SUBMISSION_ELECTION",
  BUSINESS_EXPANSION_ELECTION: "BUSINESS_EXPANSION_ELECTION",
  BUSINESS_EXPANSION_DECISION: "BUSINESS_EXPANSION_DECISION",
  BUSINESS_DIVERSIFICATION_DECISION: "BUSINESS_DIVERSIFICATION_DECISION",
  FOREIGN_TRIP_TIMING: "FOREIGN_TRIP_TIMING",
  FOREIGN_EMPLOYMENT: "FOREIGN_EMPLOYMENT",
  PROPERTY_BUY_VS_BUILD_DECISION: "PROPERTY_BUY_VS_BUILD_DECISION",
  HOME_CONSTRUCTION_TIMING: "HOME_CONSTRUCTION_TIMING",
  VEHICLE_PURCHASE_TIMING: "VEHICLE_PURCHASE_TIMING",
  MONTHLY_OUTLOOK: "MONTHLY_OUTLOOK",
  JOB_TRANSITION_DECISION: "JOB_TRANSITION_DECISION",
  WEALTH_ACCUMULATION_DECISION: "WEALTH_ACCUMULATION_DECISION",
  WELLNESS_VITALITY_CYCLE: "WELLNESS_VITALITY_CYCLE",
  MARRIAGE_RELATIONSHIP_OUTLOOK: "MARRIAGE_RELATIONSHIP_OUTLOOK",
  SPOUSE_FAMILY_ECONOMIC_COMPARISON: "SPOUSE_FAMILY_ECONOMIC_COMPARISON",
  HOUSEHOLD_RESIDENCE_ARRANGEMENT: "HOUSEHOLD_RESIDENCE_ARRANGEMENT",
  NAMED_EXAMINATION_OUTLOOK: "NAMED_EXAMINATION_OUTLOOK",
  ...CHILDREN_TASKS
});

export const QUESTION_INTENTS = Object.freeze({
  ...TASK_INTENTS,
  ...CHILDREN_TASKS,
  GENERAL_INTERPRETATION: "GENERAL_INTERPRETATION",
  WHY_QUESTION: "WHY_QUESTION",
  TIMING: "TIMING",
  COMPARISON: "COMPARISON",
  SPOUSE_CHARACTERISTICS: "SPOUSE_CHARACTERISTICS",
  SPOUSE_FAMILY: "SPOUSE_FAMILY",
  SPOUSE_DIRECTION: "SPOUSE_DIRECTION",
  SPOUSE_DISTANCE: "SPOUSE_DISTANCE",
  MARRIAGE: "MARRIAGE",
  MARRIAGE_TIMING: "MARRIAGE_TIMING",
  MARRIAGE_AGE: "MARRIAGE_AGE",
  LOVE_VS_ARRANGED: "LOVE_VS_ARRANGED",
  JOINT_VS_SEPARATE: "JOINT_VS_SEPARATE",
  FAMILY_PRESTIGE: "FAMILY_PRESTIGE",
  SPOUSE_CAREER: "SPOUSE_CAREER",
  PROPERTY: "PROPERTY",
  PROPERTY_ACQUISITION: "PROPERTY_ACQUISITION",
  CAREER: "CAREER",
  CAREER_TIMING: "CAREER_TIMING",
  PROMOTION_TIMING: "PROMOTION_TIMING",
  GOVERNMENT_JOB: "GOVERNMENT_JOB",
  BUSINESS_GROWTH: "BUSINESS_GROWTH",
  BUSINESS_CONTINUE_VS_CHANGE: "BUSINESS_CONTINUE_VS_CHANGE",
  EDUCATION: "EDUCATION",
  RESEARCH_PHD: "RESEARCH_PHD",
  HIGHER_STUDIES: "HIGHER_STUDIES",
  COMPETITIVE_EXAMS: "COMPETITIVE_EXAMS",
  CHILDREN: "CHILDREN",
  FOREIGN_TRAVEL: "FOREIGN_TRAVEL",
  FOREIGN_SETTLEMENT: "FOREIGN_SETTLEMENT",
  VEHICLE: "VEHICLE",
  LUXURY_VEHICLE: "LUXURY_VEHICLE",
  BUSINESS: "BUSINESS",
  JOB: "JOB",
  FINANCE: "FINANCE",
  MEGA_WEALTH: "MEGA_WEALTH",
  FAMILY: "FAMILY",
  LEADERSHIP: "LEADERSHIP",
  POLITICS_VS_ADMINISTRATION: "POLITICS_VS_ADMINISTRATION",
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
  const text = typeof normalizedQ === "string" ? normalizedQ : (normalizedQ?.raw || normalizedQ?.text || "");
  const norm = typeof normalizedQ === "string" ? normalizedQ.toLowerCase() : (normalizedQ?.normalized || "");
  const cues = (typeof normalizedQ === "object" && normalizedQ) ? (normalizedQ.cues || {}) : {};

  const detectedIntents = new Set();

  // 0. Actionable Specific Task Intents (Highest Priority ahead of general domains)
  // A. Daily Dress Colour
  if (/(?:colour|color|dress|clothes|clothing|wear).*(?:today|tonight|this\s+morning|wear\s+today|suitable\s+today)|(?:what|which)\s+(?:colour|color).*(?:dress|wear|suitable)|today.*(?:dress|cloth).*(?:colour|color)|இன்று.*(?:நிற|ஆடை|உடை)|(?:எந்த|என்ன)\s*நிற.*(?:ஆடை|உடை)|ஆடை.*அணிய/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.DAILY_DRESS_COLOR);
  }

  // B. Research Paper Submission Election
  const hasAcademic = /(?:research\s*paper|journal\s*submission|paper\s*submission|manuscript|research|journal|paper|thesis|article|dissertation|ஆய்வுக்\s*கட்டுரை|கட்டுரை|ஆய்வு)/i.test(text);
  const hasSubmissionAction = /(?:submit|submission|upload|send|publish|publishing|suitable|சமர்ப்பிக்க|அனுப்ப)/i.test(text);
  const hasSubmissionTiming = /(?:today|tonight|now|date|suitable|time|when|day|இன்று)/i.test(text);
  if ((hasAcademic && hasSubmissionAction && (hasSubmissionTiming || /(?:submit|submission|upload|publish)/i.test(text))) ||
      /(?:submit|submission|upload).*(?:research|paper|manuscript|journal|article|thesis)/i.test(text) ||
      /(?:research\s*paper|journal|manuscript).*(?:submit|submission|upload|suitable)/i.test(text) ||
      /(?:ஆய்வுக்\s*கட்டுரை|கட்டுரை).*(?:சமர்ப்பிக்க|அனுப்ப)/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.RESEARCH_SUBMISSION_ELECTION);
  }

  // C. Business Expansion Election (with time bounded: this week, etc.)
  if (/(?:expand|expansion|branch|scale).*(?:business|trade|venture|shop).*(?:this\s+week|good\s+luck|luck|timing)|(?:should\s+i|shall\s+i|will|can\s+i).*(?:expand|expansion).*(?:this\s+week|good\s+luck)|(?:suitable|good|right)\s+week.*(?:branch|business|expand)|இந்த\s*வாரம்.*(?:வியாபார|தொழில்).*(?:விரிவு|விரிவுபடுத்த|அதிர்ஷ்டம்)|வியாபார.*விரிவுபடுத்தலாமா/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.BUSINESS_EXPANSION_ELECTION);
  }

  // D. Business Expansion vs Diversification Decision
  if (/(?:expand.*or.*(?:diversif|new|start)|(?:expand.*existing.*or.*(?:new|start))|new\s+branch.*or.*different\s+business|open\s+another\s+branch.*or.*different\s+business|expand.*same\s+business.*or|branch.*different\s+business|வேறு\s*தொழில்.*அல்லது.*விரிவாக்கம்|தொழில்\s*விரிவாக்க.*அல்லது)/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.BUSINESS_EXPANSION_DECISION);
    detectedIntents.add(TASK_INTENTS.BUSINESS_DIVERSIFICATION_DECISION);
  }

  // E. Foreign Trip Timing (Temporary trip / travel abroad)
  if (/(?:foreign|abroad|overseas|international).*(?:trip|tour|travel|journey|vacation|visit|holiday)|(?:when\s+will\s+i|when\s+can\s+i|shall\s+i|will\s+i).*(?:go\s+(?:for\s+a\s+)?foreign\s+trip|travel\s+abroad|go\s+abroad|trip\s+abroad)|foreign\s+trip|வெளிநாட்டுப்\s*பயணம்|வெளிநாடு.*(?:செல்ல|பயணம்)/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.FOREIGN_TRIP_TIMING);
  }

  // F0. Compound Property Comparison (Buy vs Build a house)
  if (/(?:buy.*or.*build|build.*or.*buy|வாங்க.*அல்லது.*கட்ட|கட்ட.*அல்லது.*வாங்க|வாங்குவதா.*கட்டுவதா)/i.test(text) &&
      /(?:house|home|property|flat|apartment|வீடு|மனை|நிலம்)/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.PROPERTY_BUY_VS_BUILD_DECISION);
  } else if (/(?:build|construct|erect).*(?:new\s+home|new\s+house|house|home)|house\s+construction|home\s+construction|(?:when\s+will\s+i|when\s+can\s+i|shall\s+i|will\s+i).*(?:build|construct).*(?:home|house)|புதிய\s*வீடு.*கட்ட|வீடு\s*கட்ட|கட்டிடப்\s*பணி/i.test(text)) {
    // F. Home Construction Timing (Building a home / house construction)
    detectedIntents.add(TASK_INTENTS.HOME_CONSTRUCTION_TIMING);
  }

  // G. Ordinary Vehicle Purchase Timing
  if (/(?:buy|purchase).*(?:new\s+car|car|new\s+vehicle|vehicle|bike|scooter|motorcycle|automobile)|(?:when\s+will\s+i|when\s+can\s+i|shall\s+i|will\s+i).*(?:buy|purchase).*(?:car|vehicle)|புதிய\s*கார்.*வாங்க|கார்\s*வாங்க|வாகனம்.*வாங்க/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.VEHICLE_PURCHASE_TIMING);
  }

  // H. Monthly Outlook (Upcoming months forecast)
  if (/(?:upcoming|coming|next\s+few|next\s+3|next\s+three)\s+months|(?:how\s+will\s+my|what\s+about\s+my)\s+(?:upcoming|coming|next)\s+months|monthly\s+(?:outlook|forecast|prediction)|அடுத்த\s*மாதங்கள்|வரவிருக்கும்\s*மாதங்கள்/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.MONTHLY_OUTLOOK);
  }

  // I. Job Transition & Career Movement Decision
  if (/(?:switch.*or.*stay|stay.*or.*switch|change.*or.*continue|continue.*or.*change|job\s+transition|should\s+i\s+(?:switch|change)\s+(?:my\s+)?job|leave\s+current\s+job|switch\s+companies|வேலை.*(?:மாற|தொடர|மாறுவதா|தொடர்வதா)|(?:மாறுவதா.*தொடர்வதா|தொடர்வதா.*மாறுவதா)|வேலை\s*மாற்ற|புதிய\s*பணிக்கு\s*மாறுவதா)/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.JOB_TRANSITION_DECISION);
  }

  // J. Wealth Accumulation & Financial Decision
  if (/(?:invest.*or.*save|save.*or.*invest|invest.*or.*clear.*debt|wealth\s+accumulation|financial\s+growth|invest\s+or\s+pay\s+debt|capital\s+allocation|முதலீடு.*(?:சேமிப்பு|கடன்|அடைப்பதா|சேமிப்பதா|வளர்ச்சி)|(?:சேமிப்பதா.*முதலீடா|முதலீடா.*சேமிப்பதா)|பண\s*சேர்க்கை|கடன்\s*அடைக்க|செல்வ\s*வளர்ச்சி)/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.WEALTH_ACCUMULATION_DECISION);
  }

  // K. Wellness & Vitality Rhythm Cycles
  if (/(?:vitality\s+cycle|energy\s+rhythm|physical\s+vitality|wellness\s+cycle|energy\s+levels|உடல்\s*ஆற்றல்|சக்தி\s*நிலை|புத்துணர்ச்சி\s*சுழற்சி|ஆரோக்கிய\s*சுழற்சி)/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.WELLNESS_VITALITY_CYCLE);
  }

  // 1. Specialized Spouse & Relationship Intents
  if (/spouse.*family.*wealth|compare.*spouse.*family|wealthier.*spouse|in-laws.*wealth|மாமனார்.*பொருளாதாரம்|துணையின்\s*குடும்ப\s*செல்வம்|குடும்பத்தை\s*விட\s*துணை/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.SPOUSE_FAMILY_ECONOMIC_COMPARISON);
    detectedIntents.add(QUESTION_INTENTS.SPOUSE_FAMILY);
    detectedIntents.add(QUESTION_INTENTS.COMPARISON);
  } else if (/spouse.*family|family.*wealth|wife.*family|husband.*family|துணையின்\s*குடும்பம்|மாமியார்|மாமனார்/i.test(text) ||
      (cues.isComparison && /spouse|துணை|partner|wife|husband/i.test(text))) {
    detectedIntents.add(TASK_INTENTS.SPOUSE_FAMILY_ECONOMIC_COMPARISON);
    detectedIntents.add(QUESTION_INTENTS.SPOUSE_FAMILY);
    if (cues.isComparison) detectedIntents.add(QUESTION_INTENTS.COMPARISON);
  }

  // Marital Relationship Improvement / Reconciliation (Distinguished from marriage formation)
  if (/(?:reconcil|harmony.*(?:marriage|relationship)|improve.*(?:relationship|marriage)|relationship.*improve|marriage.*improve|better.*relationship|relationship.*better|scope\s*for\s*reconciliation|patch\s*up|ஒற்றுமை|சீரடையுமா|சேர்வார்களா|சமரசம்|உறவு\s*மேம்படுமா)/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.MARRIAGE_RELATIONSHIP_OUTLOOK);
    detectedIntents.add(QUESTION_INTENTS.MARRIAGE);
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

  if (/(joint\s*family|separate\s*(?:house|household|home)|nuclear\s*family|live\s+with\s+(?:my\s+)?parents|live\s+separately|தனி[க்\s]*குடித்தன|கூட்டுக்\s*குடும்ப|மாமியார்\s*வீடு|தனி\s*வீடு)/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.HOUSEHOLD_RESIDENCE_ARRANGEMENT);
    detectedIntents.add(QUESTION_INTENTS.JOINT_VS_SEPARATE);
  }

  if (/(prestige|respect|reputation|elders|values|கௌரவம்|மதிப்பாரா|பெரியோரை)/i.test(text) && /spouse|family|துணை|குடும்ப/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.FAMILY_PRESTIGE);
  }

  if (/(love|arranged|proposal|self-choice|relatives|காதல்|நிச்சய)/i.test(text) && /(marri|wedding|spouse|திருமண|கல்யாண)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.LOVE_VS_ARRANGED);
  }

  if (/(what\s+age|age\s+will\s+i|marriage\s+age|வயதில்\s*திருமணம்)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.MARRIAGE_AGE);
    detectedIntents.add(QUESTION_INTENTS.TIMING);
  }

  if (/spouse.*(career|job|work|profession)|துணை.*(வேலை|தொழில்)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.SPOUSE_CAREER);
  }

  if (/marriage|wedding|spouse|partner|bride|groom|திருமணம்|கல்யாணம்|களத்திரம்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.MARRIAGE);
    if (cues.isTiming) detectedIntents.add(QUESTION_INTENTS.MARRIAGE_TIMING);
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

  // 4. Domains & Specific Life Scenarios
  if (/(rolls\s*royce|luxury\s*car|expensive\s*car|luxury\s*vehicle|விலையுயர்ந்த\s*கார்|சொகுசு\s*வாகனம்)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.LUXURY_VEHICLE);
    detectedIntents.add(QUESTION_INTENTS.VEHICLE);
  }

  if (/(billionaire|millionaire|crorepati|super\s*rich|ultra\s*rich|mega\s*wealth|கோடீஸ்வரன்|மகா\s*தன)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.MEGA_WEALTH);
    detectedIntents.add(QUESTION_INTENTS.FINANCE);
  }

  if (/(government\s*job|civil\s*services?|ias|ips|upsc|அரசு\s*பணி|அரசு\s*வேலை)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.GOVERNMENT_JOB);
    detectedIntents.add(QUESTION_INTENTS.CAREER);
  }

  if (/(continue.*business.*change|change.*business|business.*pivot|expand.*business|business.*expansion|expand.*to\s+more\s+business|new\s+business|second\s+business|தொழில்\s*மாற்ற|தொழில்\s*விரிவாக்க)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.BUSINESS_CONTINUE_VS_CHANGE);
    detectedIntents.add(QUESTION_INTENTS.BUSINESS);
  } else if (/business\s*growth|growth.*(?:of|in|for).*(?:the\s+|my\s+)?business|growth.*business|about.*business|व्यापार|சுயதொழில்\s*வளர்ச்சி|வியாபார\s*வளர்ச்சி/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.BUSINESS_GROWTH);
    detectedIntents.add(QUESTION_INTENTS.BUSINESS);
  }

  if (/(politics|minister|electoral|mla|mp|governance|அரசியல்|தேர்தல்)/i.test(text) && /(corporate|executive|administrative|நிர்வாக)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.POLITICS_VS_ADMINISTRATION);
    detectedIntents.add(QUESTION_INTENTS.LEADERSHIP);
  }

  if (/(phd|doctorate|doctoral|research\s*degree|thesis|முனைவர்\s*பட்டம்|ஆராய்ச்சி)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.RESEARCH_PHD);
    detectedIntents.add(QUESTION_INTENTS.EDUCATION);
  }

  if (/(higher\s*studies|master\s*degree|post\s*grad|foreign\s*degree|உயர்\s*கல்வி)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.HIGHER_STUDIES);
    detectedIntents.add(QUESTION_INTENTS.EDUCATION);
  }

  if (/\b(?:ugc\s*net|upsc|neet|gate|cat|iit|jee|ias|ips|tnpsc|bank\s*exam|ca\s*exam|sat|gre|gmat|competitive\s*exam|entrance)\b|போட்டித்\s*தேர்வு|தேர்வில்\s*வெற்றி/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.NAMED_EXAMINATION_OUTLOOK);
    detectedIntents.add(QUESTION_INTENTS.COMPETITIVE_EXAMS);
    detectedIntents.add(QUESTION_INTENTS.EDUCATION);
  }

  if (/(overseas\s*settlement|foreign\s*settlement|live\s*abroad|pr\s*visa|வெளிநாட்டு\s*குடியேற்றம்)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.FOREIGN_SETTLEMENT);
    detectedIntents.add(QUESTION_INTENTS.FOREIGN_TRAVEL);
  }

  if (/(buy.*house|buy.*land|buy.*flat|property\s*purchase|வீடு\s*வாங்க|நிலம்\s*வாங்க)/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.PROPERTY_ACQUISITION);
    detectedIntents.add(QUESTION_INTENTS.PROPERTY);
  }

  if (/career|job|profession|promotion|work|office|தொழில்|வேலை|உத்தியோகம்|பதவி\s*உயர்வு/i.test(text)) {
    if (/(promotion|salary\s*hike|பதவி\s*உயர்வு)/i.test(text)) {
      detectedIntents.add(QUESTION_INTENTS.PROMOTION_TIMING);
      detectedIntents.add(QUESTION_INTENTS.CAREER);
    } else if (/job|employment|service|அலுவலக\s*பணி|வேலை/i.test(text)) {
      detectedIntents.add(QUESTION_INTENTS.JOB);
      detectedIntents.add(QUESTION_INTENTS.CAREER);
    } else if (/business|startup|trade|venture|commerce|சுயதொழில்|வியாபாரம்/i.test(text)) {
      detectedIntents.add(QUESTION_INTENTS.BUSINESS);
    } else {
      detectedIntents.add(QUESTION_INTENTS.CAREER);
    }
    if (cues.isTiming) detectedIntents.add(QUESTION_INTENTS.CAREER_TIMING);
  }

  if (/property|real\s*estate|(?<!\b\d{1,2}(?:st|nd|rd|th)?\s+)\b(?:house|home)\b(?!.*\b(?:lord|cusp)\b)|land|flat|bhoomi|நிலம்|சொத்து|வீடு|மனை/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.PROPERTY);
  }

  if (/(?:vehicle|vehicles|conveyance|automobile|automobiles)|\b(car|cars|bike|bikes)\b|வாகனம்|கார்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.VEHICLE);
  }

  if (/finance|wealth|money|savings|income|cash|நிதி|பணம்|பொருளாதாரம்|சேமிப்பு|தன\s*வரவு/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.FINANCE);
  }

  if (/education|study|studies|exam|degree|college|school|academic|கல்வி|படிப்பு|தேர்வு|பல்கலைக்கழகம்/i.test(text)) {
    detectedIntents.add(QUESTION_INTENTS.EDUCATION);
  }

  // Children domain — fine-grained sub-intent detection (MUST come before broad CHILDREN catch)
  const hasChildrenKeyword = /children|child|progeny|pregnancy|conceive|conception|offspring|son|daughter|குழந்தை|புத்திர|பிள்ளை|மழலை|baby|babies|kid|kids|birth\s*of\s*a\s*child|give\s*birth|மகன்|மகள்|குழந்தைகள்/i.test(text);
  if (hasChildrenKeyword) {
    const hasQuantityLanguage = /how\s+many|number\s+of\s+(?:children|kids|babies|offspring)|count\s+of\s+children|total\s+children|எத்தனை\s*குழந்தை|எத்தனை\s*பிள்ளை|குழந்தைகளின்\s*எண்ணிக்கை/i.test(text);
    const hasTimingLanguage = /when\s+will\s+(?:i|we|she|he)\s+(?:have|get|be\s+blessed|conceive|give\s+birth)|when\s+(?:can|shall)\s+(?:i|we)\s+(?:have|get|conceive)|timing\s+(?:of|for)\s+(?:children|child|childbirth|progeny|pregnancy|family\s+expansion)|year\s+(?:of|for)\s+(?:child|children|childbirth)|எப்போது\s*குழந்தை|குழந்தை.*எப்போது|புத்திர.*எப்போது/i.test(text) || (cues.isTiming && !hasQuantityLanguage && /\bwhen\b|எப்போது/i.test(text));
    const hasOutlookLanguage = /will\s+(?:i|we|she|he)\s+(?:have|get|be\s+blessed\s+with|conceive|give\s+birth)|(?:shall|can)\s+(?:i|we|she|he)\s+(?:have|get|conceive|give\s+birth)|(?:i|we)\s+(?:get|have)\s+(?:a\s+)?child|chance\s+of\s+(?:having|getting)\s+(?:a\s+)?child|குழந்தை\s*(?:பிறக்குமா|பெறுவேனா|கிடைக்குமா|வருமா|பாக்கியம்\s*உண்டா|யோகம்\s*உண்டா)|எனக்கு\s*குழந்தை|எங்களுக்கு\s*குழந்தை|புத்திர\s*பாக்கியம்\s*கிடைக்குமா/i.test(text);

    if (hasQuantityLanguage) {
      detectedIntents.add(CHILDREN_TASKS.CHILDREN_COUNT);
    } else if (hasTimingLanguage) {
      detectedIntents.add(CHILDREN_TASKS.FAMILY_EXPANSION_TIMING);
      detectedIntents.add(QUESTION_INTENTS.TIMING);
    } else if (hasOutlookLanguage) {
      detectedIntents.add(CHILDREN_TASKS.CHILDREN_OUTLOOK);
    } else {
      detectedIntents.add(CHILDREN_TASKS.CHILDREN_TRADITIONAL_INTERPRETATION);
    }
    // Always also add the broad CHILDREN intent for backward compatibility
    detectedIntents.add(QUESTION_INTENTS.CHILDREN);
  } else if (Array.isArray(history) && history.length > 0 && /^(when|when\s*\?|when\s+will\s+(?:it|that)\s+happen\??|what\s+about\s+timing\??|எப்போது\??)$/i.test(text.trim())) {
    const lastTurn = history[history.length - 1] || {};
    const prevDomain = String(lastTurn.domain || lastTurn.primaryDomain || "").toLowerCase();
    const prevIntent = String(lastTurn.intent || lastTurn.primaryIntent || "");
    const prevQ = String(lastTurn.question || lastTurn.q || lastTurn.content || "");
    const wasChildrenTurn =
      prevDomain === "children" ||
      prevIntent.startsWith("CHILDREN_") ||
      prevIntent === "FAMILY_EXPANSION_TIMING" ||
      /children|child|progeny|pregnancy|conceive|baby|babies|give\s*birth|குழந்தை|புத்திர|பிள்ளை/i.test(prevQ);
    if (wasChildrenTurn) {
      detectedIntents.add(CHILDREN_TASKS.FAMILY_EXPANSION_TIMING);
      detectedIntents.add(QUESTION_INTENTS.CHILDREN);
      detectedIntents.add(QUESTION_INTENTS.TIMING);
    }
  }

  if (/(?:job\s*abroad|work\s*abroad|foreign\s*job|overseas\s*(?:job|employment|career|posting|deputation)|employment\s*abroad|வெளிநாட்டு.*(?:வேலை|பணி|உத்தியோகம்)|வெளிநாட்டில்.*(?:வேலை|பணி))/i.test(text)) {
    detectedIntents.add(TASK_INTENTS.FOREIGN_EMPLOYMENT);
    detectedIntents.add(QUESTION_INTENTS.FOREIGN_TRAVEL);
    detectedIntents.add(QUESTION_INTENTS.CAREER);
  } else if (/foreign|travel|abroad|overseas|visa|relocation|settlement|வெளிநாடு|பயணம்|குடியேற்றம்/i.test(text)) {
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
    TASK_INTENTS.NAMED_EXAMINATION_OUTLOOK,
    TASK_INTENTS.FOREIGN_EMPLOYMENT,
    TASK_INTENTS.HOUSEHOLD_RESIDENCE_ARRANGEMENT,
    TASK_INTENTS.SPOUSE_FAMILY_ECONOMIC_COMPARISON,
    TASK_INTENTS.MARRIAGE_RELATIONSHIP_OUTLOOK,
    TASK_INTENTS.DAILY_DRESS_COLOR,
    TASK_INTENTS.RESEARCH_SUBMISSION_ELECTION,
    TASK_INTENTS.BUSINESS_EXPANSION_ELECTION,
    TASK_INTENTS.BUSINESS_EXPANSION_DECISION,
    TASK_INTENTS.BUSINESS_DIVERSIFICATION_DECISION,
    TASK_INTENTS.FOREIGN_TRIP_TIMING,
    TASK_INTENTS.PROPERTY_BUY_VS_BUILD_DECISION,
    TASK_INTENTS.HOME_CONSTRUCTION_TIMING,
    TASK_INTENTS.VEHICLE_PURCHASE_TIMING,
    TASK_INTENTS.MONTHLY_OUTLOOK,
    TASK_INTENTS.JOB_TRANSITION_DECISION,
    TASK_INTENTS.WEALTH_ACCUMULATION_DECISION,
    TASK_INTENTS.WELLNESS_VITALITY_CYCLE,
    CHILDREN_TASKS.CHILDREN_COUNT,
    CHILDREN_TASKS.CHILDREN_OUTLOOK,
    CHILDREN_TASKS.FAMILY_EXPANSION_TIMING,
    CHILDREN_TASKS.CHILDREN_TRADITIONAL_INTERPRETATION,
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
