/**
 * ASTROVERSE — Follow-Up Question Router
 *
 * Directs follow-up questions to either:
 * 1. FACTUAL: Instant, deterministic answer from calculated chart facts (0 AI cost, 0 hallucination risk)
 * 2. UNSUPPORTED_SYSTEM: Explains that the technique belongs to another astrology tradition
 * 3. AMBIGUOUS: Flags an ambiguous reference and offers a clarification prompt
 * 4. SYSTEM_COMPARISON: Cross-system comparative analysis
 * 5. REPORT_ANALYSIS: Multi-layer report-grounded synthesis
 * 6. INSUFFICIENT_CONTEXT: Explicit refusal when data is absent
 */

import { REPORT_CHAPTERS } from "../config/reportChapters.js";
import { classifyConsultationIntent } from "./consultationEngine.js";
import {
  toTamilRasi,
  toTamilPlanet,
  toTamilNakshatra,
  toTamilDignity,
  formatTamilDegree,
  cleanEnglishParentheses
} from "./tamilAstrologyUtils.js";

/**
 * Resolves conversational pronouns or short follow-ups like "What about 2027?"
 */
export function resolveConversationalReferences(questionText, conversationHistory = [], activeSectionId = "fullReport") {
  const text = (questionText || "").trim();
  if (!conversationHistory || conversationHistory.length === 0) {
    return { resolvedText: text, resolvedDomain: activeSectionId, isFollowUp: false };
  }

  let lastUserQ = "";
  let lastAssistantA = "";

  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const turn = conversationHistory[i];
    if (!lastUserQ && (turn.role === "user" || turn.question)) {
      lastUserQ = turn.content || turn.question || "";
    }
    if (!lastAssistantA && (turn.role === "assistant" || turn.answer)) {
      lastAssistantA = turn.content || turn.answer || "";
    }
    if (lastUserQ && lastAssistantA) break;
  }

  const qLower = text.toLowerCase();

  // Check if current question matches an established consultation domain or explicit topic
  const consultationClass = classifyConsultationIntent(text, conversationHistory);
  const hasConsultationIntent = consultationClass && consultationClass.confidence >= 0.85;

  const hasExplicitTopic =
    hasConsultationIntent ||
    /career|job|profession|work|business|vocation|promotion|employment|salary|office|interview|startup|venture|trade|commerce|industry|தொழில்|வேலை|உத்தியோகம்|வியாபாரம்|சுயதொழில்|பதவி|ஊதியம்|d10|dashamsha|dasamsha/i.test(qLower) ||
    /marri|spouse|relationship|partner|wedding|wife|husband|match|progeny|family|love|divorce|remarri|compatibility|bride|groom|in-laws|parents|joint\s*family|separate\s*(?:house|household|home)|live\s+with\s+(?:my\s+)?parents|allow\s+to\s+live|திருமண|களத்திர|மனைவி|கணவர்|கல்யாணம்|குடும்பம்|தாம்பத்|பெற்றோர்|தனிக்குடித்தனம்|கூட்டுக்\s*குடும்பம்|d9|navamsha|navamsa/i.test(qLower) ||
    /health|wellness|vitality|body|diet|constitution|illness|disease|fitness|mental\s*health|stress|cure|hospital|energy|stamina|ஆரோக்கியம்|உடல்நலம்|நோய்|சுகாதாரம்|மருத்துவம்|உடற்பயிற்சி|dosha|vata|pitta|kapha|ayurved/i.test(qLower) ||
    /wealth|money|financ|property|vehicle|car|bike|real\s*estate|house|home|land|flat|apartment|bhoomi|vahana|asset|loan|debt|bank|dhana|சொத்து|வீடு|மனை|வாகனம்|பணம்|நிதி|வங்கி|கடன்/i.test(qLower) ||
    /education|study|studies|studying|exam|degree|college|school|university|academic|upsc|neet|competitive|higher\s+ed|course|marks|grade|கல்வி|படிப்பு|தேர்வு|கல்லூரி|பள்ளி/i.test(qLower) ||
    /politics|political|minister|government|leadership|power|authority|status|governance|public\s+service|அரசியல்|தலைமை|அரசு|அதிகாரம்|ஆட்சி/i.test(qLower) ||
    /foreign|overseas|travel|relocation|abroad|moksha|visa|settlement|pr\b|immigrat|passport|வெளிநாடு|பயணம்|குடியேற|விசா/i.test(qLower) ||
    /remedy|remedies|gemstone|mantra|charity|rudraksha|பரிகாரம்|ரத்தினம்|மந்திரம்|stone|ruby|pearl|coral|emerald|yellow\s*sapphire|diamond|blue\s*sapphire|gomed|cat'?s\s*eye/i.test(qLower) ||
    /bhava|chalit|kendra|trikona|dusthana|house\s+breakdown|பாவகம்|\b(1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th)\s*(house|bhava)\b/i.test(qLower) ||
    /yoga|raja\s+yoga|dhana\s+yoga|gajakesari|pancha\s+mahapurusha|யோகம்/i.test(qLower) ||
    /shadbala|virupa|planetary\s+strength|ashtakavarga|bindu|sav|sarvashtakavarga/i.test(qLower) ||
    /compare|difference\s+between|why\s+do\s+(lahiri|kp|raman|tropical)\s+(and|differ)|changes?\s+signs?/i.test(qLower) ||
    /top\s+(?:three|3)?\s*(?:report\s+)?(?:headings?|sections?|topics?|chapters?)|three\s+(?:main\s+|key\s+)?(?:headings?|sections?|topics?)|முக்கிய\s*(?:3|மூன்று)?\s*தலைப்புகள்?/i.test(qLower);

  // If question has its own explicit topic, it is an independent query — DO NOT inherit previous dialogue domain!
  if (hasExplicitTopic) {
    return { resolvedText: text, resolvedDomain: consultationClass?.domain?.toLowerCase() || activeSectionId, isFollowUp: false };
  }

  // Check for short follow-ups (elliptical questions without explicit domain)
  const isStandaloneYear = /^(what\s+about\s+|in\s+|how\s+about\s+|and\s+)?(20\d\d)\??$/i.test(text);
  const yearMatch = text.match(/\b(20\d\d)\b/);
  const isWhyFollowUp = /^(why|why\s+is\s+that|why\s+so|how\s+come|explain|tell\s+me\s+more)\b/i.test(text);
  const isPlanetFollowUp = /^(why|is\s+that\s+because\s+of|what\s+about|how\s+about)\s+(saturn|jupiter|mars|venus|mercury|sun|moon|rahu|ketu|shani|guru|mangal|shukra|budha|surya|chandra)\b/i.test(text);
  const isContinuation = /^(does\s+this\s+continue|will\s+this\s+continue|what\s+happens\s+next|and\s+then|what\s+else)\b/i.test(text);

  if (!isStandaloneYear && !isWhyFollowUp && !isPlanetFollowUp && !isContinuation && !yearMatch) {
    return { resolvedText: text, resolvedDomain: activeSectionId, isFollowUp: false };
  }

  let resolvedDomain = activeSectionId;
  let resolvedText = text;
  let isFollowUp = true;

  // Determine domain from recent dialogue only for true follow-ups when active section is general
  if (activeSectionId === "fullReport" || activeSectionId === "all" || activeSectionId === "execSummary") {
    if (/career|job|profession|work|promotion|business/i.test(lastUserQ) || /career|profession|10th\s+house/i.test(lastAssistantA)) {
      resolvedDomain = "career";
    } else if (/marriage|spouse|relationship|partner|wedding/i.test(lastUserQ) || /marriage|partnership|7th\s+house/i.test(lastAssistantA)) {
      resolvedDomain = "relationships";
    } else if (/health|wellness|vitality|disease|dosha/i.test(lastUserQ) || /health|wellness|vitality/i.test(lastAssistantA)) {
      resolvedDomain = "health";
    } else if (/wealth|money|finance|property|vehicle|house/i.test(lastUserQ) || /wealth|finance|property/i.test(lastAssistantA)) {
      resolvedDomain = "property";
    } else if (/remedy|remedies|gemstone|mantra/i.test(lastUserQ) || /gemstone|remedy|mantra/i.test(lastAssistantA)) {
      resolvedDomain = "remedies";
    } else if (/education|study|studies|exam/i.test(lastUserQ) || /education|academic/i.test(lastAssistantA)) {
      resolvedDomain = "studies";
    } else if (/dasha|period|transit/i.test(lastUserQ) || /dasha|mahadasha/i.test(lastAssistantA)) {
      resolvedDomain = "timeline";
    }
  }

  if (yearMatch) {
    const yr = yearMatch[1];
    resolvedText = `${text} (Context: User is asking about the year ${yr} regarding ${resolvedDomain} from previous discussion: "${lastUserQ.slice(0, 60)}...")`;
  } else if (isWhyFollowUp || isPlanetFollowUp || isContinuation) {
    resolvedText = `${text} (Context: Follow-up to previous discussion: "${lastUserQ.slice(0, 60)}...")`;
  }

  return { resolvedText, resolvedDomain, isFollowUp };
}

/**
 * Main router for follow-up questions
 */
export function routeFollowUpQuestion(question, context, conversationHistory = []) {
  const rawQ = typeof question === "string" ? question : (question?.text || "");
  const qLower = rawQ.toLowerCase().trim();
  const sysId = context?.system?.id || "lahiri";
  const isTamil = context?.lang === "ta" || /[\u0B80-\u0BFF]/.test(rawQ) || context?.chart?.userLanguage === "ta";

  // 1. Resolve conversational references
  const { resolvedText, resolvedDomain, isFollowUp } = resolveConversationalReferences(rawQ, conversationHistory, context?.report?.activeSectionId);

  // 2. System Isolation & Unsupported Techniques Check
  if (sysId === "tropical" || sysId === "sayana" || sysId === "western") {
    const vedicTerms = [
      "d9", "navamsha", "navamsa", "d10", "dasamsha", "varga", "shodashavarga",
      "mahadasha", "antardasha", "dasha", "vimshottari", "shadbala", "ashtakavarga",
      "chara karaka", "atmakaraka", "jaimini", "nakshatra", "pada", "sub lord", "kp"
    ];
    for (const term of vedicTerms) {
      if (qLower.includes(term)) {
        return {
          type: "UNSUPPORTED_SYSTEM",
          status: "INSUFFICIENT_DATA",
          system: sysId,
          relevantSections: ["technicalAppendix", "multiSystemComparison"],
          evidenceIds: [],
          dataUsed: ["System Isolation: Tropical / Sayana"],
          answer: isTamil
            ? `தேர்ந்தெடுக்கப்பட்ட மேற்கத்திய சாயன (Tropical) முறையில் வர்க்க சக்கரங்கள் (D9, D10), விம்சோத்தரி தசா, ஷட்பலம் மற்றும் அஷ்டகவர்க்கம் ஆகியவை கணக்கிடப்படுவதில்லை. மேற்கத்திய முறை எஸன்ஷியல் டிக்னிட்டி (Essential Dignities), பிளாசிடஸ் பாவகங்கள் மற்றும் டாலமிக் பார்வைகளை (Ptolemaic Aspects) அடிப்படையாகக் கொண்டது.`
            : `Divisional charts (such as D9 Navamsha and D10), Vimshottari Dasha, Shadbala, and Ashtakavarga are not applicable under the selected Tropical / Sayana (Western) report. Western astrology evaluates Essential Dignities, Placidus house cusps, and Ptolemaic aspects instead of Vedic harmonic divisions.`,
          limitations: ["Vedic-specific techniques omitted under Western Tropical system."]
        };
      }
    }
  }

  if (sysId === "kp") {
    if (qLower.includes("shadbala") || qLower.includes("ashtakavarga") || qLower.includes("jaimini")) {
      return {
        type: "UNSUPPORTED_SYSTEM",
        status: "INSUFFICIENT_DATA",
        system: sysId,
        relevantSections: ["technicalAppendix"],
        evidenceIds: [],
        dataUsed: ["System Isolation: KP"],
        answer: isTamil
          ? `கே.பி. (கிருஷ்ணமூர்த்தி பத்ததி) முறையில் பராசர ஷட்பலமோ அல்லது அஷ்டகவர்க்கமோ பயன்படுத்தப்படுவதில்லை. அதற்குப் பதிலாக 249 நட்சத்திர/உப அதிபதிகள் (Sub Lords), 4-அடுக்கு காரகத்துவங்கள் மற்றும் ஆளும் கிரகங்கள் (Ruling Planets) மூலமாக பலன்கள் கணக்கிடப்படுகின்றன.`
          : `Classical Parashari Shadbala and Ashtakavarga are not calculated under Krishnamurti Padhdhati (KP). KP systematically evaluates 249 Cuspal Star/Sub-Lords, 4-Tier Significators, and Ruling Planets rather than 6-fold virupa metrics.`,
        limitations: ["Parashari Shadbala/Ashtakavarga omitted under KP system."]
      };
    }
  }

  // 3. Deterministic Factual Router
  // A. Ascendant / Lagna
  if (/(what|which|tell|explain|how|about|describe|show)\s+(me\s+about\s+)?(is|are)?\s*(my|the)?\s*(ascendant|lagna|rising\s+sign)\b/i.test(qLower) || /(என்|எனது)\s*(லக்னம்|உதய\s+ராசி)/i.test(qLower)) {
    const asc = context.chart?.ascendant;
    if (asc?.sign) {
      const degStr = typeof asc.degree === "number" ? ` at ${asc.degree}°` : "";
      const nakStr = asc.nakshatra ? ` (${asc.nakshatra} Nakshatra)` : "";
      return {
        type: "FACTUAL",
        status: "DETERMINISTIC_FACT",
        system: sysId,
        relevantSections: ["blueprint", "execSummary"],
        evidenceIds: [],
        dataUsed: ["Ascendant sign & degree"],
        answer: isTamil
          ? `உங்கள் ஜென்ம லக்னம் ${toTamilRasi(asc.sign)}${formatTamilDegree(asc.degree)}${asc.nakshatra ? ` (${toTamilNakshatra(asc.nakshatra)} நட்சத்திரம்)` : ""} ஆகும். இது உங்கள் மூல ஜாதகத்தின் முதல் பாவகமாகவும் அடிப்படை ஜோதிட அடையாளமாகவும் அமைகிறது.`
          : `According to your calculated report, your Ascendant (Lagna) is ${asc.sign}${degStr}${nakStr}. This defines the 1st house cusp of your natal chart under the ${context.system.name} system.`,
        limitations: []
      };
    }
  }

  // B. Moon Sign / Rashi
  if (/(what|which|tell|explain|how|about|describe|show)\s+(me\s+about\s+)?(is|are)?\s*(my|the)?\s*(moon\s+sign|rashi|rasi|janma\s+rashi)\b/i.test(qLower) || /(என்|எனது)\s*(ராசி|சந்திர\s+ராசி)/i.test(qLower)) {
    const moon = context.chart?.moon;
    if (moon?.sign) {
      return {
        type: "FACTUAL",
        status: "DETERMINISTIC_FACT",
        system: sysId,
        relevantSections: ["blueprint", "execSummary"],
        evidenceIds: [],
        dataUsed: ["Moon sign"],
        answer: isTamil
          ? `உங்கள் ஜென்ம ராசி ${toTamilRasi(moon.sign)} ஆகும்.`
          : `According to your calculated chart, your Moon sign (Janma Rashi) is ${moon.sign} under the ${context.system.name} system.`,
        limitations: []
      };
    }
  }

  // C. Nakshatra & Pada
  if (/(what|which|tell|explain|how|about|describe|show)\s+(me\s+about\s+)?(is|are)?\s*(my|the)?\s*(nakshatra|janma\s+nakshatra|birth\s+star)\b/i.test(qLower) || /(என்|எனது)\s*நட்சத்திரம்/i.test(qLower)) {
    const moon = context.chart?.moon;
    if (moon?.nakshatra && sysId !== "tropical") {
      const padaStr = moon.pada ? ` Pada ${moon.pada}` : "";
      return {
        type: "FACTUAL",
        status: "DETERMINISTIC_FACT",
        system: sysId,
        relevantSections: ["blueprint", "execSummary"],
        evidenceIds: [],
        dataUsed: ["Moon Nakshatra & Pada"],
        answer: isTamil
          ? `உங்கள் ஜென்ம நட்சத்திரம் ${toTamilNakshatra(moon.nakshatra)}${moon.pada ? ` பாதம் ${moon.pada}` : ""} (${toTamilRasi(moon.sign)} ராசி) ஆகும்.`
          : `According to your calculated report, your Janma Nakshatra is ${moon.nakshatra}${padaStr} (Moon in ${moon.sign}).`,
        limitations: []
      };
    }
  }

  // D. Sun Sign
  if (/(what|which|tell|explain|how|about|describe|show)\s+(me\s+about\s+)?(is|are)?\s*(my|the)?\s*(sun\s+sign|surya\s+rashi)\b/i.test(qLower) || /(என்|எனது)\s*சூரிய\s+ராசி/i.test(qLower)) {
    const sun = context.chart?.sun;
    if (sun?.sign) {
      return {
        type: "FACTUAL",
        status: "DETERMINISTIC_FACT",
        system: sysId,
        relevantSections: ["blueprint"],
        evidenceIds: [],
        dataUsed: ["Sun sign"],
        answer: isTamil
          ? `உங்கள் சூரிய ராசி ${toTamilRasi(sun.sign)} ஆகும்.`
          : `Your Sun sign is ${sun.sign} under the ${context.system.name} calculation.`,
        limitations: []
      };
    }
  }

  // E. Current Mahadasha & Antardasha
  if (/(what|which|tell|explain|how|about|describe|show)\s+(me\s+about\s+)?(is|are)?\s*(my|the)?\s*(current\s+mahadasha|current\s+dasha|active\s+dasha|current\s+period)\b/i.test(qLower) || /(நடப்பு|தற்போதைய)\s+தசை/i.test(qLower)) {
    const dasha = context.chart?.currentDasha;
    if (dasha && dasha.lord) {
      const subStr = dasha.subLord ? ` and active Antardasha is ${dasha.subLord}` : "";
      const ageStr = dasha.startAge && dasha.endAge ? ` (Ages ${dasha.startAge} to ${dasha.endAge})` : "";
      const ageStrTa = dasha.startAge && dasha.endAge ? ` (வயது ${dasha.startAge} முதல் ${dasha.endAge} வரை)` : "";
      return {
        type: "FACTUAL",
        status: "DETERMINISTIC_FACT",
        system: sysId,
        relevantSections: ["timeline", "execSummary"],
        evidenceIds: [],
        dataUsed: ["Vimshottari Dasha table"],
        answer: isTamil
          ? `உங்கள் தற்போதைய விம்சோத்தரி தசா இயக்கம் ${toTamilPlanet(dasha.lord)} மகா தசை${dasha.subLord ? ` - ${toTamilPlanet(dasha.subLord)} புக்தி` : ""}${ageStrTa} ஆகும்.`
          : `According to your calculated Vimshottari timeline, your active Mahadasha is ${dasha.lord}${subStr}${ageStr}.`,
        limitations: []
      };
    }
  }

  // F. Active Astrological System
  if (/(which|what)\s+(astrology\s+system|system|calculation\s+method)\s+(am\s+i\s+using|is\s+being\s+used|is\s+this)\b/i.test(qLower) || /எந்த\s+ஜோதிட\s+முறை/i.test(qLower)) {
    return {
      type: "FACTUAL",
      status: "DETERMINISTIC_FACT",
      system: sysId,
      relevantSections: ["technicalAppendix", "multiSystemComparison"],
      evidenceIds: [],
      dataUsed: ["System metadata"],
      answer: isTamil
        ? `இந்த அறிக்கை "${context.system.tamilName || context.system.name}" முறையைக் கொண்டு துல்லியமாக கணக்கிடப்பட்டுள்ளது.`
        : `This report is calculated under the ${context.system.name} system (Zodiac: ${context.system.zodiacType}, Ayanamsha: ${context.system.ayanamshaType}, House System: ${context.system.defaultHouseSystem}).`,
      limitations: []
    };
  }

  // G. KP 10th Cusp Sub Lord
  if (sysId === "kp" && /(10th\s+cusp\s+sub\s*lord|tenth\s+cusp\s+sub\s*lord)/i.test(qLower)) {
    const sub10 = context.chart?.kpSubLords?.cusp_10;
    if (sub10) {
      return {
        type: "FACTUAL",
        status: "DETERMINISTIC_FACT",
        system: sysId,
        relevantSections: ["career", "technicalAppendix"],
        evidenceIds: [],
        dataUsed: ["KP 10th cusp sub-lord calculation"],
        answer: isTamil
          ? `கே.பி. கணிதத்தின்படி உங்கள் 10-ம் பாவ உப அதிபதி (Sub Lord) ${toTamilPlanet(sub10)} பகவான் ஆவார். இது உங்கள் தொழில் மற்றும் அதிகார நிலையை நிர்ணயிக்கும் முக்கிய காரகமாகும்.`
          : `Under the KP system calculation, your 10th cusp sub lord is ${sub10}. In KP methodology, the 10th sub lord is the primary arbiter of career status and vocational trajectory.`,
        limitations: []
      };
    }
  }

  // H. KP 7th Cusp Sub Lord
  if (sysId === "kp" && /(7th\s+cusp\s+sub\s*lord|seventh\s+cusp\s+sub\s*lord)/i.test(qLower)) {
    const sub7 = context.chart?.kpSubLords?.cusp_7;
    if (sub7) {
      return {
        type: "FACTUAL",
        status: "DETERMINISTIC_FACT",
        system: sysId,
        relevantSections: ["relationships", "technicalAppendix"],
        evidenceIds: [],
        dataUsed: ["KP 7th cusp sub-lord calculation"],
        answer: isTamil
          ? `கே.பி. கணிதத்தின்படி உங்கள் 7-ம் பாவ உப அதிபதி (Sub Lord) ${toTamilPlanet(sub7)} பகவான் ஆவார். இது களத்திரம், திருமணம் மற்றும் கூட்டு தொழில் விவகாரங்களை வழிநடத்துகிறது.`
          : `Under the KP system calculation, your 7th cusp sub lord is ${sub7}. In KP astrology, the 7th cusp sub lord governs partnership promise and relationship matters.`,
        limitations: []
      };
    }
  }

  // I. Ayanamsha & House Division
  if (/ayanamsha|ayanamsa/i.test(qLower)) {
    return {
      type: "FACTUAL",
      status: "DETERMINISTIC_FACT",
      system: sysId,
      relevantSections: ["technicalAppendix"],
      evidenceIds: [],
      dataUsed: ["Ayanamsha convention"],
      answer: isTamil
        ? `இந்த அறிக்கையில் பயன்படுத்தப்படும் அயனாம்சம்: ${context.system.tamilName || context.system.name} (${context.system.ayanamshaType || 'சித்திரபக்ஷ அயனாம்சம்'}).`
        : `The ayanamsha convention applied in this report is ${context.system.ayanamshaType} under the ${context.system.name} system.`,
      limitations: []
    };
  }

  // J. Top 3 Report Headings
  if (/top\s+(?:three|3)?\s*(?:report\s+)?(?:headings?|sections?|topics?|chapters?)|three\s+(?:main\s+|key\s+)?(?:headings?|sections?|topics?|chapters?)|முக்கிய\s*(?:3|மூன்று)?\s*தலைப்புகள்?/i.test(qLower)) {
    return {
      type: "FACTUAL",
      status: "REPORT_SUPPORTED",
      system: sysId,
      relevantSections: ["career", "relationships", "property", "blueprint"],
      evidenceIds: [],
      dataUsed: ["Report Structure: 17 Domains"],
      answer: isTamil
        ? `[அறிக்கை முடிவு] உங்கள் முழு வாழ்க்கை நுண்ணறிவு அறிக்கையில் (Full Life Intelligence Report) உள்ள 3 மிக முக்கியமான தலைப்புகள்:\n\n1. தொழில், தலைமைத்துவம் மற்றும் வாழ்வியல் சாதனை (Career & Leadership):\n• உங்கள் 10-ம் கர்ம பாவகம், தொழில் காரகர்கள் மற்றும் நடப்பு தசா சுழற்சியின் அடிப்படையில் எதிர்கால தொழில் வளர்ச்சி மற்றும் முக்கிய வாழ்வியல் மாற்றங்கள் இதில் விரிவாக ஆராயப்பட்டுள்ளன.\n\n2. இல்லற நல்வாழ்வு, திருமணம் மற்றும் உறவுகள் (Marriage & Relationships):\n• உங்கள் 7-ம் களத்திர பாவகம், நவாம்சம் (D9) மற்றும் துணைவருக்கான பொருத்தக் கூறுகள் மூலம் குடும்ப வாழ்வின் ஸ்திரத்தன்மை இதில் மதிப்பிடப்பட்டுள்ளது.\n\n3. நிதி மேலாண்மை, செல்வ வளம் மற்றும் சொத்துக்கள் (Finance & Wealth):\n• உங்கள் 2-ம் தன பாவகம், 11-ம் லாப பாவகம் மற்றும் 4-ம் சொத்து பாவக அமைப்புகள் வழியே வாழ்நாள் நிதிப் பாதுகாப்பு மற்றும் முதலீட்டு யோகங்கள் இதில் பகுப்பாய்வு செய்யப்பட்டுள்ளன.\n\n[பாரம்பரிய விளக்கம்] இந்த 3 தலைப்புகள் தனிநபர் இலக்குகள், பொருளாதார ஸ்திரத்தன்மை மற்றும் குடும்ப அமைப்பை வழிநடத்தும் முதன்மைத் தூண்களாகும்.`
        : `[Report Finding] The three most important headings in your comprehensive Life Intelligence Report are:\n\n1. Career, Leadership & Vocation (10th Bhava & Dashamsha):\n• Details your professional trajectory, leadership potential, and major karmic milestones under operating planetary cycles.\n\n2. Marriage, Family & Partnerships (7th Bhava & Navamsha D9):\n• Evaluates marital timing, compatibility patterns, and lifelong relationship dynamics.\n\n3. Finance, Wealth & Immovable Property (2nd, 11th & 4th Bhavas):\n• Analyzes wealth accumulation potential, real estate acquisition windows, and fiscal stability.\n\n[Traditional Context] These three domains form the foundational tripod of practical Jyotisha life analysis—Dharma/Karma (Career), Kama (Relationships), and Artha (Wealth).`,
      limitations: []
    };
  }

  // 4. System Comparison Router
  const isSysCompQuery =
    /(lahiri|chitrapaksha).*(kp|krishnamurti)|(kp|krishnamurti).*(lahiri|chitrapaksha)/i.test(qLower) ||
    /difference.*between.*(lahiri|kp|raman|tropical)|compare.*(lahiri|kp|raman|tropical)|(changes?|switch).*(between|from).*(lahiri|kp)|why\s+do\s+(lahiri|kp|raman|tropical)\s+(and|differ)|changes?\s+signs?/i.test(qLower) ||
    /(லஹிரி|சித்திரபக்ஷ).*(கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி)|(கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி).*(லஹிரி|சித்திரபக்ஷ)/i.test(qLower) ||
    /((லஹிரி|சித்திரபக்ஷ).*மற்றும்.*(கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி))|((கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி).*மற்றும்.*(லஹிரி|சித்திரபக்ஷ))/i.test(qLower) ||
    /(லஹிரி|கே\.?பி|கேபி).*முறைகளுக்கு\s*இடையே.*(மாற்றங்கள்|வேறுபாடு|ஒப்பீடு)/i.test(qLower) ||
    /முறை.*ஒப்பீடு|வேறுபாடு.*(லஹிரி|கே\.?பி)|system.*comparison|between\s+(lahiri|kp)\s+and\s+(lahiri|kp)/i.test(qLower) ||
    ((/லஹிரி|சித்திரபக்ஷ/i.test(qLower) || /\blahiri\b/i.test(qLower)) && (/கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி/i.test(qLower) || /\bkp\b/i.test(qLower)));

  if (isSysCompQuery) {
    return {
      type: "SYSTEM_COMPARISON",
      status: "REPORT_SUPPORTED",
      system: sysId,
      resolvedText,
      relevantSections: ["multiSystemComparison", "technicalAppendix"],
      evidenceIds: [],
      dataUsed: ["Multi-System Comparative Matrix"]
    };
  }

  // 5. Cross-Section or Single-Domain Analytical Questions
  let relevantSections = [];
  if (isFollowUp && resolvedDomain && resolvedDomain !== "fullReport" && resolvedDomain !== "all") {
    relevantSections.push(resolvedDomain);
  } else if (!isFollowUp && context.report?.activeSectionId && context.report.activeSectionId !== "fullReport" && context.report.activeSectionId !== "all" && context.report.activeSectionId !== "execSummary") {
    relevantSections.push(context.report.activeSectionId);
  }

  // Planet-specific detection (Saturn, Jupiter, Mars, Venus, Mercury, Sun, Moon, Rahu, Ketu)
  let targetPlanet = null;
  if (/saturn|shani|manda|சனி/i.test(qLower)) {
    targetPlanet = "Saturn";
  } else if (/jupiter|guru|brihaspati|வியாழன்|குரு/i.test(qLower)) {
    targetPlanet = "Jupiter";
  } else if (/mars|mangal|kuja|angarak|செவ்வாய்/i.test(qLower)) {
    targetPlanet = "Mars";
  } else if (/venus|shukra|சுக்கிரன்|வெள்ளி/i.test(qLower)) {
    targetPlanet = "Venus";
  } else if (/mercury|budha|புதன்/i.test(qLower)) {
    targetPlanet = "Mercury";
  } else if (/sun|surya|ravi|சூரியன்|ஞாயிறு/i.test(qLower) && !/sun\s+sign/i.test(qLower)) {
    targetPlanet = "Sun";
  } else if (/moon|chandra|soma|சந்திரன்|திங்கள்/i.test(qLower) && !/moon\s+sign/i.test(qLower)) {
    targetPlanet = "Moon";
  } else if (/rahu|ராகு/i.test(qLower)) {
    targetPlanet = "Rahu";
  } else if (/ketu|கேது/i.test(qLower)) {
    targetPlanet = "Ketu";
  }

  // Year detection (e.g. 2027)
  const yrMatch = qLower.match(/\b(20\d\d)\b/);
  const targetYear = yrMatch ? parseInt(yrMatch[1], 10) : null;

  // Specific House detection (1st to 12th house)
  let targetHouse = null;
  const hMatch = qLower.match(/\b(1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th|[1-9]|1[0-2])\s*(st|nd|rd|th)?\s*(house|bhava|cusp)\b/i)
    || qLower.match(/\b([1-9]|1[0-2])\s*[-ஆம்|ம்]*\s*(வீடு|பாவகம்|பாவம்)/);
  if (hMatch) {
    const rawNum = parseInt(hMatch[1].replace(/\D/g, ""), 10);
    if (rawNum >= 1 && rawNum <= 12) {
      targetHouse = rawNum;
    }
  }

  const isSaturnDelay = Boolean(targetPlanet === "Saturn" && /delay|slow|obstacle|timing|influence|why|தாக்கம்|தாமத|ஏன்|செல்வாக்கு|காரணம்|10-ம்|தொழில்/i.test(qLower));
  const isDashaQuery = /dasha|mahadasha|antardasha|bhukti|pratyantar|cycle|operating\s+period|தசை|புக்தி/i.test(qLower);

  // Topic-specific keyword mappings
  if (targetPlanet) {
    relevantSections.push("blueprint");
    if (targetPlanet === "Saturn" || /career|job|profession|work|business|vocation/i.test(qLower)) {
      relevantSections.push("career");
    }
    relevantSections.push("technicalAppendix");
  }

  if (targetYear) {
    relevantSections.push("timeline");
  }

  if (targetHouse) {
    relevantSections.push("bhavas");
    if (targetHouse === 10 || targetHouse === 6) relevantSections.push("career");
    if (targetHouse === 7) relevantSections.push("relationships");
    if (targetHouse === 4) relevantSections.push("property");
    if (targetHouse === 5 || targetHouse === 4) relevantSections.push("studies");
    if (targetHouse === 9 || targetHouse === 12) relevantSections.push("foreign");
  }

  if (/career|job|profession|work|business|vocation|promotion|employment|salary|office|interview|startup|venture|trade|commerce|industry|தொழில்|வேலை|உத்தியோகம்|வியாபாரம்|சுயதொழில்|பதவி|ஊதியம்/i.test(qLower)) {
    relevantSections.push("career");
    if (!relevantSections.includes("timeline")) relevantSections.push("timeline");
  }
  if (/d10|dashamsha|dasamsha|career\s+varga/i.test(qLower) && sysId !== "tropical") {
    relevantSections.push("career");
  }
  if (/marri|spouse|relationship|partner|wedding|wife|husband|match|progeny|family|love|divorce|remarri|compatibility|திருமண|களத்திர|மனைவி|கணவர்|கல்யாணம்|குடும்பம்|தாம்பத்/i.test(qLower)) {
    relevantSections.push("relationships");
    if (!relevantSections.includes("timeline")) relevantSections.push("timeline");
  }
  if (/d9|navamsha|navamsa|marriage\s+varga/i.test(qLower) && sysId !== "tropical") {
    relevantSections.push("relationships");
    if (!relevantSections.includes("blueprint")) relevantSections.push("blueprint");
  }
  if (/health|wellness|vitality|body|diet|constitution|illness|disease|fitness|mental\s*health|stress|cure|hospital|energy|stamina|ஆரோக்கியம்|உடல்நலம்|நோய்|சுகாதாரம்|மருத்துவம்|உடற்பயிற்சி/i.test(qLower)) {
    relevantSections.push("health");
    if (sysId !== "tropical" && !relevantSections.includes("dosha")) relevantSections.push("dosha");
  }
  if (/dosha|vata|pitta|kapha|ayurved/i.test(qLower) && sysId !== "tropical") {
    relevantSections.push("dosha");
  }
  if (/wealth|money|financ|property|vehicle|car|bike|real\s*estate|house|home|land|flat|apartment|bhoomi|vahana|asset|loan|debt|bank|dhana|சொத்து|வீடு|மனை|வாகனம்|பணம்|நிதி|வங்கி|கடன்/i.test(qLower)) {
    relevantSections.push("property");
  }
  if (/education|study|studies|studying|exam|degree|college|school|university|academic|upsc|neet|competitive|higher\s+ed|course|marks|grade|கல்வி|படிப்பு|தேர்வு|கல்லூரி|பள்ளி/i.test(qLower)) {
    relevantSections.push("studies");
  }
  if (/politics|political|minister|government|leadership|power|authority|status|governance|public\s+service|அரசியல்|தலைமை|அரசு|அதிகாரம்|ஆட்சி/i.test(qLower)) {
    relevantSections.push("politics");
  }
  if (/foreign|overseas|travel|relocation|abroad|moksha|visa|settlement|pr\b|immigrat|passport|வெளிநாடு|பயணம்|குடியேற|விசா/i.test(qLower)) {
    relevantSections.push("foreign");
  }
  if (/remedy|remedies|gemstone|mantra|charity|rudraksha|stone|ruby|pearl|coral|emerald|yellow\s*sapphire|diamond|blue\s*sapphire|gomed|cat'?s\s*eye|பரிகாரம்|ரத்தினம்|மந்திரம்/i.test(qLower) && sysId !== "tropical") {
    relevantSections.push("remedies");
  }
  if (/dasha|period|transit|timing|window|cycle|தசை|புக்தி|கோச்சாரம்|காலம்/i.test(qLower)) {
    if (!relevantSections.includes("timeline")) relevantSections.push("timeline");
  }
  if (/bhava|chalit|kendra|trikona|dusthana|house\s+breakdown|பாவகம்/i.test(qLower)) {
    relevantSections.push("bhavas");
  }
  if (/yoga|raja\s+yoga|dhana\s+yoga|gajakesari|pancha\s+mahapurusha|strength|potential|talent|blessing|யோகம்|பலம்/i.test(qLower) && sysId !== "tropical") {
    relevantSections.push("yogas");
  }
  if (/shadbala|virupa|planetary\s+strength/i.test(qLower) && sysId !== "tropical" && sysId !== "kp") {
    relevantSections.push("technicalAppendix");
    if (!relevantSections.includes("blueprint")) relevantSections.push("blueprint");
  }
  if (/ashtakavarga|bindu|sav|sarvashtakavarga|bav/i.test(qLower) && sysId !== "tropical" && sysId !== "kp") {
    relevantSections.push("technicalAppendix");
  }
  if (/sub\s*lord|significator|cusp|ruling\s+planet/i.test(qLower) && sysId === "kp") {
    relevantSections.push("technicalAppendix");
  }
  if (/milestone|past\s+event|retrospective|life\s+audit/i.test(qLower)) {
    relevantSections.push("milestoneAudit");
  }
  if (/evidence|reasoning|why\s+this\s+prediction|dossier|how\s+calculated/i.test(qLower)) {
    relevantSections.push("reasoningDossier");
  }

  // Universal 18-Domain Semantic Consultation Intent Classification
  const consultationIntent = classifyConsultationIntent(resolvedText || rawQ, conversationHistory);
  if (consultationIntent && consultationIntent.domain) {
    const dom = (consultationIntent.domain || "").toUpperCase();
    if (dom === "MARRIAGE" || dom === "RELATIONSHIP" || dom === "PROGENY") {
      if (!relevantSections.includes("relationships")) relevantSections.push("relationships");
      if (!relevantSections.includes("timeline")) relevantSections.push("timeline");
    } else if (dom === "CAREER" || dom === "VOCATION" || dom === "BUSINESS" || dom === "POLITICS") {
      if (!relevantSections.includes("career")) relevantSections.push("career");
      if (!relevantSections.includes("timeline")) relevantSections.push("timeline");
    } else if (dom === "WEALTH" || dom === "PROPERTY" || dom === "VEHICLE") {
      if (!relevantSections.includes("property")) relevantSections.push("property");
    } else if (dom === "HEALTH" || dom === "LONGEVITY") {
      if (!relevantSections.includes("health")) relevantSections.push("health");
    } else if (dom === "RELOCATION") {
      if (!relevantSections.includes("foreign")) relevantSections.push("foreign");
    } else if (dom === "EDUCATION") {
      if (!relevantSections.includes("studies")) relevantSections.push("studies");
    }
  }

  // Deduplicate section names
  relevantSections = Array.from(new Set(relevantSections));
  if (relevantSections.length === 0) {
    relevantSections = ["execSummary", "blueprint"];
  }

  // Dynamically extract verified evidence IDs from context for these sections (Zero synthetic IDs)
  const allVerifiedIds = context.evidence?.evidenceIds || [];
  const validEvidenceIds = allVerifiedIds.filter(id => {
    if (relevantSections.includes("career") && id.startsWith("C")) return true;
    if (relevantSections.includes("relationships") && id.startsWith("M")) return true;
    if (relevantSections.includes("property") && id.startsWith("W")) return true;
    if (relevantSections.includes("health") && id.startsWith("H")) return true;
    if (relevantSections.includes("studies") && id.startsWith("E")) return true;
    return false;
  });

  // Detect if question explicitly requires evidence
  const requiresEvidence = /evidence|why\s+did|why\s+does|how\s+was\s+this|what\s+evidence|reasoning|basis|proof|ledger|calculation\s+derivation/i.test(qLower);

  return {
    type: "REPORT_ANALYSIS",
    status: "REPORT_SUPPORTED",
    system: sysId,
    resolvedText,
    relevantSections,
    evidenceIds: validEvidenceIds,
    requiresEvidence,
    targetPlanet,
    targetYear,
    targetHouse,
    isSaturnDelay,
    isDashaQuery,
    consultationIntent,
    dataUsed: relevantSections.map(s => `Chapter: ${s}`)
  };
}
