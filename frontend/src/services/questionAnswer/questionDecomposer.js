/**
 * ASTROVERSE — Question Decomposition Engine
 * ============================================
 * Decomposes complex multi-part questions into atomic sub-questions.
 * Each atomic question receives its own focused evidence chain, and
 * the results are synthesized into a coherent composite Answer Object.
 *
 * Implements Section 3 of the Precision Q&A Engine Mandate.
 */

import { QUESTION_INTENTS } from "./intentClassifier.js";
import { DOMAINS } from "./domainClassifier.js";

/**
 * Checks if a query contains specific sub-intent indicators.
 */
function extractSubThemes(raw) {
  const text = (raw || "").toLowerCase();
  const subThemes = [];

  // Theme 1: Marriage / General Alliance Possibility
  if (/will\s+i\s+marry|marriage\s+possibility|திருமணம்\s*நடக்குமா|திருமணம்\s*வாய்ப்பு/i.test(text) ||
      (/marry|திருமணம்/i.test(text) && !/when/i.test(text))) {
    subThemes.push({
      intent: QUESTION_INTENTS.MARRIAGE,
      domain: DOMAINS.MARRIAGE,
      key: "marriage_possibility",
      enLabel: "Marriage Potential & Possibility",
      taLabel: "திருமண சாத்தியக்கூறு மற்றும் யோகம்",
      sampleQuery: "Will I get married?"
    });
  }

  // Theme 2: Spouse Wealth / Financial Status
  if (/wealthy\s+person|rich\s+spouse|wealth|financial\s+background|வசதியான|பணக்கார|துணையின்\s*பொருளாதாரம்/i.test(text)) {
    subThemes.push({
      intent: QUESTION_INTENTS.SPOUSE_FAMILY,
      domain: DOMAINS.MARRIAGE,
      key: "spouse_wealth",
      enLabel: "Spouse Financial Background & Wealth",
      taLabel: "துணையின் பொருளாதார மற்றும் குடும்ப பின்னணி",
      sampleQuery: "Will my spouse be from a wealthy family?"
    });
  }

  // Theme 3: Spouse Career / Profession
  if (/have\s+a\s+job|work\s+after\s+marriage|spouse\s+career|profession|வேலை\s*செய்வார்களா|துணை.*தொழில்/i.test(text)) {
    subThemes.push({
      intent: QUESTION_INTENTS.SPOUSE_CHARACTERISTICS,
      domain: DOMAINS.MARRIAGE,
      key: "spouse_career",
      enLabel: "Spouse Career & Employment",
      taLabel: "துணையின் உத்தியோகம் மற்றும் வேலை",
      sampleQuery: "Will my spouse have a job or career?"
    });
  }

  // Theme 4: Spouse Direction / Geographic Connection
  if (/another\s+city|different\s+place|direction|distance|where\s+from|வேறு\s*ஊர்|வெளி\s*மாவட்டம்|திசை/i.test(text)) {
    subThemes.push({
      intent: QUESTION_INTENTS.SPOUSE_DIRECTION,
      domain: DOMAINS.MARRIAGE,
      key: "spouse_geography",
      enLabel: "Spouse Geographic Connection & Direction",
      taLabel: "துணை அமையும் திசை மற்றும் இருப்பிட தொடர்பு",
      sampleQuery: "Will my spouse be from another city or direction?"
    });
  }

  // Theme 5: Meeting / Marriage Timing
  if (/when\s+will\s+i|timing|which\s+year|meet\s+them|எப்போது|எந்த\s*வருடம்|எப்போது\s*சந்திப்பேன்/i.test(text)) {
    subThemes.push({
      intent: QUESTION_INTENTS.TIMING,
      domain: DOMAINS.MARRIAGE,
      key: "marriage_timing",
      enLabel: "Marriage & Meeting Timing Window",
      taLabel: "திருமண காலக்கட்டம் மற்றும் தசா இணைப்பு",
      sampleQuery: "When will I get married or meet my spouse?"
    });
  }

  return subThemes;
}

/**
 * Decomposes a raw question into an array of atomic question descriptors.
 *
 * @param {string} rawQuestion - Full user input question
 * @param {Object} understandResult - Output from understandQuestion
 * @returns {Array<Object>} Array of atomic question definitions
 */
export function decomposeQuestion(rawQuestion, understandResult) {
  if (!understandResult?.isCompound) {
    return [
      {
        atomicId: "Q1",
        questionText: rawQuestion,
        domain: understandResult.domain,
        intent: understandResult.intent,
        subject: understandResult.subject,
        enLabel: "Primary Inquiry",
        taLabel: "முதன்மை கேள்வி"
      }
    ];
  }

  const detectedSubThemes = extractSubThemes(rawQuestion);

  // If sub-themes were detected cleanly, return them
  if (detectedSubThemes.length >= 2) {
    return detectedSubThemes.map((st, idx) => ({
      atomicId: `Q${idx + 1}`,
      questionText: st.sampleQuery,
      domain: st.domain,
      intent: st.intent,
      subject: understandResult.subject,
      enLabel: st.enLabel,
      taLabel: st.taLabel,
      key: st.key
    }));
  }

  // Fallback clause splitting
  const parts = rawQuestion
    .split(/[,;?]|(?:\band\s+when\b|\band\s+will\b|\band\s+what\b|\bமற்றும்\b)/i)
    .map(p => p.trim())
    .filter(p => p.length > 5);

  if (parts.length >= 2) {
    return parts.map((p, idx) => ({
      atomicId: `Q${idx + 1}`,
      questionText: p.endsWith("?") ? p : p + "?",
      domain: understandResult.domain,
      intent: understandResult.intent,
      subject: understandResult.subject,
      enLabel: `Part ${idx + 1}`,
      taLabel: `பகுதி ${idx + 1}`
    }));
  }

  return [
    {
      atomicId: "Q1",
      questionText: rawQuestion,
      domain: understandResult.domain,
      intent: understandResult.intent,
      subject: understandResult.subject,
      enLabel: "Primary Inquiry",
      taLabel: "முதன்மை கேள்வி"
    }
  ];
}

/**
 * Combines multiple atomic answer objects into a unified composite response.
 *
 * @param {Array<Object>} atomicResults - Array of evaluated atomic answers
 * @param {boolean} isTamil - Language flag
 * @returns {Object} Composite answer payload
 */
export function combineAtomicAnswers(atomicResults, isTamil) {
  if (!atomicResults || atomicResults.length === 0) {
    return null;
  }
  if (atomicResults.length === 1) {
    return atomicResults[0];
  }

  const combinedEvidenceIds = new Set();
  const combinedLimitations = new Set();
  const combinedSections = new Set();
  const atomicSummaries = [];

  for (const ar of atomicResults) {
    if (Array.isArray(ar.evidenceIds)) {
      ar.evidenceIds.forEach(id => combinedEvidenceIds.add(id));
    }
    if (Array.isArray(ar.limitations)) {
      ar.limitations.forEach(lim => combinedLimitations.add(lim));
    }
    if (Array.isArray(ar.relevantSections)) {
      ar.relevantSections.forEach(sec => combinedSections.add(sec));
    }

    const label = isTamil ? (ar.atomicMeta?.taLabel || ar.atomicMeta?.atomicId) : (ar.atomicMeta?.enLabel || ar.atomicMeta?.atomicId);
    atomicSummaries.push(`### [${label}]\n${ar.directAnswer || ar.answer}`);
  }

  const header = isTamil
    ? "## [விரிவான பல-பகுதி கேள்வி ஆய்வு]\nஉங்கள் வினாவில் உள்ள ஒவ்வொரு தனித்துவமான கேள்வியும் தனித்தனியாக பரிசீலிக்கப்பட்டு, அவற்றுக்கான சான்றுகள் கீழே ஒருங்கிணைக்கப்பட்டுள்ளன:"
    : "## [Composite Multi-Part Analysis]\nEach distinct inquiry within your question has been independently evaluated against specific chart evidence:";

  const fullText = header + "\n\n" + atomicSummaries.join("\n\n---\n\n");

  const allInsufficient = atomicResults.every(a => a.status === "INSUFFICIENT_DATA" || a.evidenceStatus === "INSUFFICIENT_DATA");

  return {
    isCompound: true,
    atomicCount: atomicResults.length,
    atomicResults,
    answer: fullText,
    directAnswer: atomicResults.map(a => a.directAnswer).join(" | "),
    status: allInsufficient ? "INSUFFICIENT_DATA" : "REPORT_SUPPORTED",
    evidenceStatus: allInsufficient ? "INSUFFICIENT_DATA" : "REPORT_SUPPORTED",
    timingResolution: allInsufficient ? "INSUFFICIENT_DATA" : (atomicResults.find(a => a.timingResolution && a.timingResolution !== "INSUFFICIENT_DATA")?.timingResolution || "YEAR"),
    evidenceIds: Array.from(combinedEvidenceIds),
    relevantSections: Array.from(combinedSections),
    limitations: Array.from(combinedLimitations)
  };
}
