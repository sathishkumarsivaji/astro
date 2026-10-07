/**
 * ASTROVERSE — Dedicated Question Understanding Engine
 * =====================================================
 * Analyzes user questions with deterministic semantic and syntactic parsing.
 * Extracts comprehensive metadata, entity bindings, intent taxonomy,
 * ambiguity detection, malformed question handling, and decomposition flags.
 *
 * Implements Section 2, Section 18, and Section 19 of the Precision Q&A Engine Mandate.
 */

import crypto from "node:crypto";
import { normalizeQuestion } from "./questionNormalizer.js";
import { classifyIntent, QUESTION_INTENTS } from "./intentClassifier.js";
import { classifyDomains, DOMAINS } from "./domainClassifier.js";
import { extractEntities } from "./entityExtractor.js";

/**
 * Evaluates whether a question is syntactically or conceptually malformed.
 * (Section 19: Question Correction)
 *
 * @param {string} text - Raw or normalized question
 * @returns {Object} Malformed analysis { isMalformed, detectedIssue, correctedIntent, clarificationRequired }
 */
export function checkMalformedQuestion(text) {
  const lower = (text || "").toLowerCase();

  // Pattern: "Will my 7th lord marry me?" or "Will Saturn marry me?"
  if (/\b(?:will\s+my\s+)?([1-9]|1[0-2])(?:st|nd|rd|th)?\s+lord\s+marry\s+me\b/i.test(lower) ||
      /\b(?:will\s+)?(saturn|jupiter|venus|mars|mercury|sun|moon|rahu|ketu)\s+marry\s+me\b/i.test(lower) ||
      /(?:7-ம்\s*அதிபதி\s*என்னை\s*திருமணம்\s*செய்வாரா|கிரகம்\s*திருமணம்\s*செய்(யுமா|வாரா))/i.test(text)) {
    return {
      isMalformed: true,
      detectedIssue: "Personification of astrological significator or planet as marriage partner",
      correctedIntent: QUESTION_INTENTS.MARRIAGE,
      clarificationRequired: false,
      correctionNote: "Interpreting query as marriage timing and spouse characteristics signified by the 7th house and its lord."
    };
  }

  // Pattern: Impossible precision ("What exact second/minute will I die/marry?")
  if (/\b(?:what\s+exact\s+(?:second|minute|hour))\b/i.test(lower) ||
      /\b(?:துல்லியமான\s*(?:வினாடி|நிமிடம்))\b/i.test(text)) {
    return {
      isMalformed: true,
      detectedIssue: "Requested precision exceeds astrological calculation boundaries",
      correctedIntent: QUESTION_INTENTS.TIMING,
      clarificationRequired: false,
      correctionNote: "Timing will be constrained to the highest valid discriminatory window (Month/Year range)."
    };
  }

  // Pattern: Lottery numbers ("What exact lottery numbers will win?")
  if (/\b(?:lottery\s+numbers?|lotto\s+numbers?|lucky\s+numbers?)\b/i.test(lower) ||
      /லாட்டரி\s*எண்/i.test(text)) {
    return {
      isMalformed: true,
      detectedIssue: "Astrological charts cannot calculate random numerical draw sequences",
      correctedIntent: QUESTION_INTENTS.FINANCE,
      clarificationRequired: false,
      correctionNote: "Interpreting query as general financial and speculative potential."
    };
  }

  return {
    isMalformed: false,
    detectedIssue: null,
    correctedIntent: null,
    clarificationRequired: false,
    correctionNote: null
  };
}

/**
 * Checks for multi-part / compound question patterns for decomposition.
 * (Section 3: Question Decomposition)
 *
 * @param {string} raw - Raw question text
 * @returns {boolean} True if question contains multiple distinct sub-inquiries
 */
function detectCompoundQuestion(raw) {
  // Check multiple question marks
  const qMarkCount = (raw.match(/\?/g) || []).length;
  if (qMarkCount > 1) return true;

  // Check conjunctions linking distinct multi-domain questions
  // e.g., "Will I marry a wealthy person from another city, will they have a job, and when will I meet them?"
  const multiDomainDelimiters = /\b(?:will\s+i\s+marry.*and\s+when|marry.*job|wealthy.*and\s+when|will\s+they\s+have\s+a\s+job\s+and\s+when)\b/i;
  if (multiDomainDelimiters.test(raw)) return true;

  // Comma-separated query clauses with multiple distinct interrogative verbs
  const clauses = raw.split(/[,;]/).map(c => c.trim()).filter(Boolean);
  if (clauses.length >= 3 && /(will|when|where|who|எப்போது|யார்)/i.test(raw)) {
    return true;
  }

  return false;
}

/**
 * Primary Question Understanding Engine entry point.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user question
 * @param {Array} [params.conversationHistory=[]] - Conversational turns for context
 * @param {Object} [params.context=null] - Full chart context
 * @returns {Object} Structured question understanding representation
 */
export function understandQuestion({ question, conversationHistory = [], context = null }) {
  if (!question || typeof question !== "string") {
    throw new Error("Valid question string required for Question Understanding Engine.");
  }

  const raw = question.trim();
  const normalizedQ = normalizeQuestion(raw);
  const cues = normalizedQ.cues || {};
  const isTamil = normalizedQ.isTamil;
  const lang = normalizedQ.lang;

  // Generate deterministic question ID
  const questionId = "Q_" + crypto.createHash("sha256").update(raw.toLowerCase(), "utf8").digest("hex").slice(0, 12);

  // Check malformed structure
  const malformed = checkMalformedQuestion(raw);

  // Intent classification
  const intentResult = classifyIntent(normalizedQ, conversationHistory);
  let primaryIntent = intentResult.primaryIntent;
  if (malformed.isMalformed && malformed.correctedIntent) {
    primaryIntent = malformed.correctedIntent;
  }

  // Domain classification
  const domainResult = classifyDomains(normalizedQ, intentResult, conversationHistory);
  const primaryDomain = domainResult.primaryDomain;

  // Entity extraction
  const entities = extractEntities(normalizedQ);
  const req = entities.requestedQuantities || {};

  // Infer subject
  let subject = "native";
  if (/spouse|partner|wife|husband|bride|groom|துணை|களத்திரம்/i.test(raw)) {
    subject = "spouse";
  } else if (/child|children|son|daughter|குழந்தை|பிள்ளை/i.test(raw)) {
    subject = "child";
  } else if (/business|startup|venture|வியாபாரம்|சுயதொழில்/i.test(raw)) {
    subject = "business";
  } else if (/job|career|boss|employer|வேலை|தொழில்/i.test(raw)) {
    subject = "career";
  } else if (/property|house|land|flat|வீடு|சொத்து|நிலம்/i.test(raw)) {
    subject = "property";
  }

  // Infer event
  let event = null;
  if (primaryDomain === DOMAINS.MARRIAGE || primaryIntent === QUESTION_INTENTS.MARRIAGE) {
    event = "marriage";
  } else if (primaryDomain === DOMAINS.PROPERTY || primaryIntent === QUESTION_INTENTS.PROPERTY) {
    event = "property_purchase";
  } else if (primaryDomain === DOMAINS.CAREER || primaryIntent === QUESTION_INTENTS.JOB || primaryIntent === QUESTION_INTENTS.CAREER) {
    event = /change|switch|மாற்றம்/i.test(raw) ? "career_transition" : "career_milestone";
  } else if (primaryDomain === DOMAINS.BUSINESS || primaryIntent === QUESTION_INTENTS.BUSINESS) {
    event = /start|begin|துவங்க|ஆரம்பிக்க/i.test(raw) ? "business_start" : "business_expansion";
  } else if (primaryDomain === DOMAINS.FINANCE) {
    event = "financial_growth";
  }

  // Requested precision
  let requestedPrecision = "GENERAL";
  if (/\b(?:exact\s+date|exact\s+day|குறிப்பிட்ட\s*தேதி)\b/i.test(raw)) {
    requestedPrecision = "EXACT_DATE";
  } else if (/\b(?:which\s+year|which\s+month|எந்த\s*வருடம்|எந்த\s*மாதம்)\b/i.test(raw)) {
    requestedPrecision = "MONTH_RANGE";
  } else if (cues.isTiming) {
    requestedPrecision = "RANGE";
  }

  // Ambiguity detection
  const isAmbiguous = raw.split(/\s+/).length <= 2 && !cues.isTiming && !cues.isWhy;
  const ambiguity = {
    isAmbiguous,
    reason: isAmbiguous ? "Query contains fewer than 3 terms without specific factor or domain markers." : null,
    suggestedInterpretation: isAmbiguous ? `Interpreting as general inquiry regarding ${primaryDomain}.` : null
  };

  // Check if compound
  const isCompound = detectCompoundQuestion(raw);

  // Compute required evidence factor tags
  const requiredEvidence = [];
  if (primaryDomain === DOMAINS.MARRIAGE) {
    requiredEvidence.push("7th_house", "7th_lord", "venus", "d9_navamsha");
    if (cues.isTiming) requiredEvidence.push("vimshottari_dasha", "transit_jupiter", "transit_saturn");
  } else if (primaryDomain === DOMAINS.PROPERTY) {
    requiredEvidence.push("4th_house", "4th_lord", "mars", "venus");
    if (cues.isTiming) requiredEvidence.push("vimshottari_dasha", "transit_saturn");
  } else if (primaryDomain === DOMAINS.CAREER || primaryDomain === DOMAINS.JOB) {
    requiredEvidence.push("10th_house", "10th_lord", "d10_dashamsha", "saturn", "sun");
    if (cues.isTiming) requiredEvidence.push("vimshottari_dasha", "transit_jupiter", "transit_saturn");
  } else if (primaryDomain === DOMAINS.BUSINESS) {
    requiredEvidence.push("7th_house", "10th_house", "11th_house", "2nd_house", "mercury");
  } else if (primaryDomain === DOMAINS.FINANCE) {
    requiredEvidence.push("2nd_house", "11th_house", "2nd_lord", "11th_lord", "jupiter");
  } else if (primaryDomain === DOMAINS.WELLNESS) {
    requiredEvidence.push("1st_house", "6th_house", "lagna_lord", "sun");
  }

  // Answerability initial estimate
  let answerability = "ANSWERABLE";
  if (malformed.isMalformed && malformed.detectedIssue.includes("lottery")) {
    answerability = "NOT_DISCRIMINATING";
  } else if (requestedPrecision === "EXACT_DATE") {
    answerability = "PARTIALLY_ANSWERABLE"; // Can answer window, but not exact day
  }

  let requestedOutcome = null;
  if (/wealthy|rich|wealth|பணக்கார|வசதி/i.test(raw)) {
    requestedOutcome = "WEALTH";
  } else if (/government\s*job|அரசு\s*பணி/i.test(raw)) {
    requestedOutcome = "GOVERNMENT_JOB";
  } else if (/profit|இலாபம்/i.test(raw)) {
    requestedOutcome = "BUSINESS_PROFIT";
  }

  return {
    questionId,
    rawQuestion: raw,
    language: lang,
    isTamil,
    domain: primaryDomain,
    subDomain: intentResult.primaryIntent,
    intent: primaryIntent,
    intents: intentResult.intents,
    entities,
    subject,
    event,
    timeHorizon: entities.years?.length ? entities.years.join("-") : (entities.durationYears ? `Next ${entities.durationYears} years` : null),
    requestedPrecision,
    requestedComparison: Boolean(cues.isComparison || req.comparisonRequested || req.familyWealthRequested || /wealthy|rich|better|worse|compare|விட|வசதி/i.test(raw)),
    requestedDirection: Boolean(cues.isDirection || req.directionRequested),
    requestedLocation: Boolean(/city|location|place|country|ஊர்|நகரம்|வெளிநாடு/i.test(raw)),
    requestedPerson: subject === "spouse" ? "spouse" : (subject === "child" ? "child" : null),
    requestedOutcome,
    requestedProbability: /\b(will|can|is\s+it\s+possible|chance|வாய்ப்பு|முடியுமா)\b/i.test(raw),
    requestedTiming: Boolean(cues.isTiming || req.timingRequested),
    requestedReason: Boolean(cues.isWhy),
    requestedRemedy: Boolean(cues.isRemedy || req.remedyRequested),
    ambiguity,
    malformed,
    requiredEvidence,
    answerability,
    isCompound
  };
}
