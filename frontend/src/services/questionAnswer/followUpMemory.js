/**
 * ASTROVERSE — Conversational Follow-Up Memory Engine
 * ====================================================
 * Preserves conversational state, domain context, entity referents,
 * and astrological evidence chains across multi-turn interactions.
 * Resolves pronouns ("she", "he", "it") and elliptical queries ("When?", "2027?").
 *
 * Implements Section 18 of the Precision Q&A Engine Mandate.
 */

import { DOMAINS } from "./domainClassifier.js";
import { QUESTION_INTENTS } from "./intentClassifier.js";

/**
 * Resolves conversational context and entity anaphora in follow-up queries.
 *
 * @param {Object} params
 * @param {string} params.question - Current user question
 * @param {Array<Object>} [params.conversationHistory=[]] - Prior Q&A turns
 * @returns {Object} Context resolution { resolvedQuestion, activeSubject, activeDomain, inheritedEvidenceIds, isFollowUp }
 */
export function resolveFollowUpContext({ question, conversationHistory = [] }) {
  const raw = (question || "").trim();
  const lower = raw.toLowerCase();

  if (!conversationHistory || conversationHistory.length === 0) {
    return {
      resolvedQuestion: raw,
      activeSubject: "native",
      activeDomain: DOMAINS.GENERAL,
      inheritedEvidenceIds: [],
      isFollowUp: false
    };
  }

  // Inspect last 1-3 turns for context
  const previousTurns = conversationHistory.slice(-3).reverse();
  const lastTurn = previousTurns[0] || {};

  // Infer previous domain & subject
  let rawDomain = lastTurn.domain || lastTurn.primaryDomain || null;
  let lastDomain = rawDomain ? rawDomain.toLowerCase() : null;
  let lastSubject = lastTurn.subject || null;
  let lastEvidenceIds = lastTurn.evidenceIds || [];

  if (!lastDomain) {
    const prevQ = (lastTurn.question || lastTurn.q || "").toLowerCase();
    if (/marry|marriage|spouse|wife|husband|திருமண|துணை/i.test(prevQ)) {
      lastDomain = DOMAINS.MARRIAGE;
      lastSubject = "spouse";
    } else if (/job|career|promotion|வேலை|தொழில்/i.test(prevQ)) {
      lastDomain = DOMAINS.CAREER;
      lastSubject = "career";
    } else if (/property|house|land|வீடு|சொத்து/i.test(prevQ)) {
      lastDomain = DOMAINS.PROPERTY;
      lastSubject = "property";
    } else if (/business|startup|வியாபாரம்/i.test(prevQ)) {
      lastDomain = DOMAINS.BUSINESS;
      lastSubject = "business";
    }
  }

  let isFollowUp = false;
  let resolvedQuestion = raw;
  let activeDomain = lastDomain || DOMAINS.GENERAL;
  let activeSubject = lastSubject || "native";

  // Check 1: Elliptical "When?" / "எப்போது?"
  if (/^(when|when\s*\?|எப்போது\??)$/i.test(raw)) {
    isFollowUp = true;
    if (lastDomain === DOMAINS.MARRIAGE || lastSubject === "spouse") {
      resolvedQuestion = "When will I get married?";
      activeDomain = DOMAINS.MARRIAGE;
      activeSubject = "spouse";
    } else if (lastDomain === DOMAINS.CAREER) {
      resolvedQuestion = "When will my career transition occur?";
      activeDomain = DOMAINS.CAREER;
    } else if (lastDomain === DOMAINS.PROPERTY) {
      resolvedQuestion = "When will I purchase property?";
      activeDomain = DOMAINS.PROPERTY;
    }
  }

  // Check 2: Elliptical Year query ("2027?", "What about 2028?")
  const yearMatch = raw.match(/\b(20[2-3][0-9])\b/);
  if (yearMatch && (raw.length < 25 || /what\s+about\s+20\d\d/i.test(raw))) {
    isFollowUp = true;
    const year = yearMatch[1];
    if (lastDomain === DOMAINS.CAREER) {
      resolvedQuestion = `How will the year ${year} affect my career?`;
      activeDomain = DOMAINS.CAREER;
    } else if (lastDomain === DOMAINS.MARRIAGE) {
      resolvedQuestion = `Is the year ${year} favorable for marriage?`;
      activeDomain = DOMAINS.MARRIAGE;
      activeSubject = "spouse";
    } else {
      resolvedQuestion = `What are the astrological transits for ${year}?`;
    }
  }

  // Check 3: Pronoun resolution ("she", "her", "he", "his")
  if (/\b(she|her|wife|கணவர்|மனைவி)\b/i.test(lower)) {
    isFollowUp = true;
    activeSubject = "spouse";
    activeDomain = DOMAINS.MARRIAGE;
    if (/work|job|career|வேலை/i.test(lower)) {
      resolvedQuestion = "Will my future spouse have a job or career?";
    } else if (/wealthy|family|பணக்கார|வசதி/i.test(lower)) {
      resolvedQuestion = "Will my future spouse be from a wealthy family?";
    } else if (/city|direction|place|ஊர்|திசை/i.test(lower)) {
      resolvedQuestion = "Will my future spouse be from another city?";
    }
  }

  // Check 4: Elliptical "Why?" / "Why Saturn?"
  if (/^(why|how\s+come|ஏன்)\??$/i.test(raw)) {
    isFollowUp = true;
    resolvedQuestion = `Why did the report reach this conclusion regarding ${lastDomain || "the chart"}?`;
  } else if (/^why\s+(saturn|jupiter|mars|venus|mercury|sun|moon|rahu|ketu)\??$/i.test(raw)) {
    isFollowUp = true;
    const planetName = raw.match(/why\s+(\w+)/i)?.[1] || "";
    resolvedQuestion = `Why is ${planetName} considered an influential factor in ${lastDomain || "this reading"}?`;
  }

  return {
    resolvedQuestion,
    activeSubject,
    activeDomain,
    inheritedEvidenceIds: lastEvidenceIds,
    isFollowUp
  };
}
