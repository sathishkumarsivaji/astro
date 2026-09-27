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

  // Check for short follow-ups
  const yearMatch = text.match(/\b(20\d\d)\b/);
  const isWhyFollowUp = /^(why|why\s+is\s+that|why\s+so|how\s+come)\b/i.test(text);
  const isPlanetFollowUp = /^(why|is\s+that\s+because\s+of|what\s+about)\s+(saturn|jupiter|mars|venus|mercury|sun|moon|rahu|ketu)\b/i.test(text);
  const isContinuation = /^(does\s+this\s+continue|will\s+this\s+continue|what\s+happens\s+next|and\s+then)\b/i.test(text);

  let resolvedDomain = activeSectionId;
  let resolvedText = text;
  let isFollowUp = false;

  // Determine domain from recent dialogue if active section is general
  if (activeSectionId === "fullReport" || activeSectionId === "all" || activeSectionId === "execSummary") {
    if (/career|job|profession|work|promotion/i.test(lastUserQ) || /career|profession/i.test(lastAssistantA)) {
      resolvedDomain = "career";
    } else if (/marriage|spouse|relationship|partner/i.test(lastUserQ) || /marriage|partnership/i.test(lastAssistantA)) {
      resolvedDomain = "relationships";
    } else if (/health|wellness|vitality|disease/i.test(lastUserQ) || /health|wellness/i.test(lastAssistantA)) {
      resolvedDomain = "health";
    } else if (/wealth|money|finance|property/i.test(lastUserQ) || /wealth|finance/i.test(lastAssistantA)) {
      resolvedDomain = "property";
    } else if (/dasha|period|transit/i.test(lastUserQ) || /dasha|mahadasha/i.test(lastAssistantA)) {
      resolvedDomain = "timeline";
    }
  }

  if (yearMatch) {
    const yr = yearMatch[1];
    isFollowUp = true;
    resolvedText = `${text} (Context: User is asking about the year ${yr} regarding ${resolvedDomain} from previous discussion: "${lastUserQ.slice(0, 60)}...")`;
  } else if (isWhyFollowUp || isPlanetFollowUp || isContinuation) {
    isFollowUp = true;
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
  const sysId = context.system?.id || "lahiri";
  const isTamil = context.lang === "ta";

  // 1. Resolve conversational references
  const { resolvedText, resolvedDomain, isFollowUp } = resolveConversationalReferences(rawQ, conversationHistory, context.report?.activeSectionId);

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
  if (/(what|which)\s+(is|are)?\s*(my|the)?\s*(ascendant|lagna|rising\s+sign)\b/i.test(qLower) || /என்\s+(லக்னம்|உதய\s+ராசி)/i.test(qLower)) {
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
          ? `உங்கள் ஜென்ம லக்னம் ${asc.sign}${degStr}${nakStr} ஆகும். இது உங்கள் மூல ஜாதகத்தின் முதல் பாவகமாகவும் அடிப்படை ஜோதிட அடையாளமாகவும் அமைகிறது.`
          : `According to your calculated report, your Ascendant (Lagna) is ${asc.sign}${degStr}${nakStr}. This defines the 1st house cusp of your natal chart under the ${context.system.name} system.`,
        limitations: []
      };
    }
  }

  // B. Moon Sign / Rashi
  if (/(what|which)\s+(is|are)?\s*(my|the)?\s*(moon\s+sign|rashi|rasi|janma\s+rashi)\b/i.test(qLower) || /என்\s+(ராசி|சந்திர\s+ராசி)/i.test(qLower)) {
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
          ? `உங்கள் ஜென்ம ராசி ${moon.sign} ஆகும்.`
          : `According to your calculated chart, your Moon sign (Janma Rashi) is ${moon.sign} under the ${context.system.name} system.`,
        limitations: []
      };
    }
  }

  // C. Nakshatra & Pada
  if (/(what|which)\s+(is|are)?\s*(my|the)?\s*(nakshatra|janma\s+nakshatra|birth\s+star)\b/i.test(qLower) || /என்\s+நட்சத்திரம்/i.test(qLower)) {
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
          ? `உங்கள் ஜென்ம நட்சத்திரம் ${moon.nakshatra}${moon.pada ? ` பாதம் ${moon.pada}` : ""} ஆகும்.`
          : `According to your calculated report, your Janma Nakshatra is ${moon.nakshatra}${padaStr} (Moon in ${moon.sign}).`,
        limitations: []
      };
    }
  }

  // D. Sun Sign
  if (/(what|which)\s+(is|are)?\s*(my|the)?\s*(sun\s+sign|surya\s+rashi)\b/i.test(qLower) || /என்\s+சூரிய\s+ராசி/i.test(qLower)) {
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
          ? `உங்கள் சூரிய ராசி ${sun.sign} ஆகும்.`
          : `Your Sun sign is ${sun.sign} under the ${context.system.name} calculation.`,
        limitations: []
      };
    }
  }

  // E. Current Mahadasha & Antardasha
  if (/(what|which)\s+(is|are)?\s*(my|the)?\s*(current\s+mahadasha|current\s+dasha|active\s+dasha|current\s+period)\b/i.test(qLower) || /நடப்பு\s+தசை/i.test(qLower)) {
    const dasha = context.chart?.currentDasha;
    if (dasha && dasha.lord) {
      const subStr = dasha.subLord ? ` and active Antardasha is ${dasha.subLord}` : "";
      const ageStr = dasha.startAge && dasha.endAge ? ` (Ages ${dasha.startAge} to ${dasha.endAge})` : "";
      return {
        type: "FACTUAL",
        status: "DETERMINISTIC_FACT",
        system: sysId,
        relevantSections: ["timeline", "execSummary"],
        evidenceIds: [],
        dataUsed: ["Vimshottari Dasha table"],
        answer: isTamil
          ? `உங்கள் தற்போதைய மகா தசை ${dasha.lord} தசை${dasha.subLord ? ` (புக்தி: ${dasha.subLord})` : ""}${ageStr} ஆகும்.`
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
        ? `இந்த அறிக்கை "${context.system.tamilName || context.system.name}" முறையைக் கொண்டு கணக்கிடப்பட்டுள்ளது.`
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
          ? `கே.பி. கணிதத்தின்படி உங்கள் 10-ம் பாவ உப அதிபதி (10th Cusp Sub Lord) ${sub10} ஆவார்.`
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
          ? `கே.பி. கணிதத்தின்படி உங்கள் 7-ம் பாவ உப அதிபதி (7th Cusp Sub Lord) ${sub7} ஆவார்.`
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
        ? `இந்த அறிக்கையில் பயன்படுத்தப்படும் அயனாம்சம்: ${context.system.ayanamshaType} (${context.system.name}).`
        : `The ayanamsha convention applied in this report is ${context.system.ayanamshaType} under the ${context.system.name} system.`,
      limitations: []
    };
  }

  // 4. System Comparison Router
  if (/compare|difference\s+between|why\s+do\s+(lahiri|kp|raman|tropical)\s+(and|differ)|changes?\s+signs?/i.test(qLower)) {
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
  if (resolvedDomain && resolvedDomain !== "fullReport" && resolvedDomain !== "all") {
    relevantSections.push(resolvedDomain);
  }

  // Topic-specific keyword mappings
  if (/career|job|profession|work|business|vocation/i.test(qLower)) {
    relevantSections.push("career");
    if (!relevantSections.includes("timeline")) relevantSections.push("timeline");
  }
  if (/d10|dashamsha|dasamsha|career\s+varga/i.test(qLower) && sysId !== "tropical") {
    relevantSections.push("career");
  }
  if (/marriage|spouse|relationship|partner|wedding/i.test(qLower)) {
    relevantSections.push("relationships");
    if (!relevantSections.includes("timeline")) relevantSections.push("timeline");
  }
  if (/d9|navamsha|navamsa|marriage\s+varga/i.test(qLower) && sysId !== "tropical") {
    relevantSections.push("relationships");
    if (!relevantSections.includes("blueprint")) relevantSections.push("blueprint");
  }
  if (/health|wellness|vitality|body|diet|constitution/i.test(qLower)) {
    relevantSections.push("health");
    if (sysId !== "tropical" && !relevantSections.includes("dosha")) relevantSections.push("dosha");
  }
  if (/dosha|vata|pitta|kapha|ayurved/i.test(qLower) && sysId !== "tropical") {
    relevantSections.push("dosha");
  }
  if (/wealth|money|finance|property|vehicle|real\s+estate/i.test(qLower)) {
    relevantSections.push("property");
  }
  if (/education|study|studies|exam|degree/i.test(qLower)) {
    relevantSections.push("studies");
  }
  if (/politics|leadership|power|authority|status/i.test(qLower)) {
    relevantSections.push("politics");
  }
  if (/foreign|overseas|travel|relocation|abroad|moksha/i.test(qLower)) {
    relevantSections.push("foreign");
  }
  if (/remedy|remedies|gemstone|mantra|charity|rudraksha/i.test(qLower) && sysId !== "tropical") {
    relevantSections.push("remedies");
  }
  if (/dasha|period|transit|timing|window/i.test(qLower)) {
    if (!relevantSections.includes("timeline")) relevantSections.push("timeline");
  }
  if (/bhava|chalit|kendra|trikona|dusthana|house\s+breakdown/i.test(qLower)) {
    relevantSections.push("bhavas");
  }
  if (/yoga|raja\s+yoga|dhana\s+yoga|gajakesari|pancha\s+mahapurusha/i.test(qLower) && sysId !== "tropical") {
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
    dataUsed: relevantSections.map(s => `Chapter: ${s}`)
  };
}
