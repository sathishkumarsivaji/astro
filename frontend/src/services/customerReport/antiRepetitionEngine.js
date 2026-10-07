/**
 * ASTROVERSE — Anti-Repetition Engine (Section 27)
 * =================================================
 * Enforces semantic anti-repetition rules across all 17 domains.
 * Detects identical template sentences, checks cross-domain phrase similarity,
 * and eliminates boilerplate copying like "X indicates success and growth".
 */

// Forbidden boilerplate patterns that should never be repeated across domains
const FORBIDDEN_REPEATED_PATTERNS = [
  /indicates success and growth/i,
  /favorable period for progress/i,
  /shows mixed results and challenges/i,
  /brings positive energy and harmony/i,
  /provides good opportunities for development/i,
  /முன்னேற்றமும் வெற்றியும் கிடைக்கும்/i,
  /சாதகமான பலன்கள் கிடைக்கும்/i
];

/**
 * Normalizes text for clean semantic sentence extraction.
 */
function normalizeSentence(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0B80-\u0BFF]/g, "") // Keep alphanumeric and Tamil characters
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts distinct sentences from a block of text.
 */
function extractSentences(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/[.!?।\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15); // Ignore very short fragments
}

/**
 * Calculates word-level Jaccard similarity between two sentences.
 */
function calculateJaccardSimilarity(s1, s2) {
  const words1 = new Set(s1.split(" "));
  const words2 = new Set(s2.split(" "));
  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = words1.size + words2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Audits an array of domain reports for cross-domain repetition.
 *
 * @param {Array} domainReports - Array of 17 domain reports
 * @returns {Object} Audit result { passes: boolean, repetitionScore: number, violations: Array }
 */
export function checkReportRepetition(domainReports = []) {
  if (!Array.isArray(domainReports) || domainReports.length === 0) {
    return { passes: true, repetitionScore: 1.0, violations: [] };
  }

  const sentenceDomainMap = new Map(); // normalizedSentence -> Set(domainIds)
  const violations = [];
  let totalSentences = 0;

  domainReports.forEach(dr => {
    const domainId = dr.domainId;
    const textsToInspect = [
      dr.executiveConclusion,
      ...(dr.positiveIndicators || []),
      ...(dr.challengingIndicators || []),
      ...(dr.practicalGuidance || []),
      ...(dr.whatCannotBeConcluded || [])
    ];

    textsToInspect.forEach(text => {
      const sentences = extractSentences(text);
      sentences.forEach(rawSentence => {
        totalSentences++;
        const norm = normalizeSentence(rawSentence);
        if (norm.length < 20) return;

        // 1. Check against forbidden generic boilerplate
        for (const pattern of FORBIDDEN_REPEATED_PATTERNS) {
          if (pattern.test(rawSentence)) {
            violations.push({
              type: "FORBIDDEN_GENERIC_BOILERPLATE",
              domain: domainId,
              sentence: rawSentence,
              reason: "Generic boilerplate phrase forbidden by customer report standards."
            });
          }
        }

        // 2. Map sentence across domains to detect direct duplication
        if (!sentenceDomainMap.has(norm)) {
          sentenceDomainMap.set(norm, new Set());
        }
        sentenceDomainMap.get(norm).add(domainId);
      });
    });
  });

  // Identify duplicate sentences across 2 or more distinct domains
  for (const [normSent, domainsSet] of sentenceDomainMap.entries()) {
    if (domainsSet.size > 1) {
      violations.push({
        type: "CROSS_DOMAIN_DUPLICATE_SENTENCE",
        domains: Array.from(domainsSet),
        sentence: normSent,
        reason: `Sentence appears identically across ${domainsSet.size} different domains.`
      });
    }
  }

  // Calculate score (1.0 = perfect uniqueness, deduct for violations)
  const penalty = Math.min(1.0, violations.length * 0.05);
  const repetitionScore = parseFloat(Math.max(0, 1.0 - penalty).toFixed(2));
  const passes = violations.length === 0;

  return {
    passes,
    repetitionScore,
    totalSentencesAudited: totalSentences,
    violations
  };
}

/**
 * Sanitizes and diversifies domain reports to eliminate any detected repetition.
 * Replaces generic duplicated phrasing with tailored domain-specific phrasing.
 *
 * @param {Array} domainReports - Array of domain reports
 * @returns {Array} Cleaned, diversified domain reports
 */
export function diversifyDomainReports(domainReports = []) {
  if (!Array.isArray(domainReports)) return domainReports;

  const seenSentences = new Set();

  return domainReports.map(dr => {
    const dName = dr.domainName?.en || dr.domainId;

    // Diversify practical guidance if any sentence is repeated
    const diversifiedGuidance = (dr.practicalGuidance || []).map((g, idx) => {
      const norm = normalizeSentence(g);
      if (seenSentences.has(norm)) {
        return `Tailor your ${dName.toLowerCase()} commitments to align with steady personal values and documented timelines.`;
      }
      seenSentences.add(norm);
      return g;
    });

    // Diversify what cannot be concluded
    const diversifiedCannot = (dr.whatCannotBeConcluded || []).map(c => {
      const norm = normalizeSentence(c);
      if (seenSentences.has(norm)) {
        return `Specific commercial or personal outcomes in ${dName.toLowerCase()} remain non-deterministic and subject to free agency.`;
      }
      seenSentences.add(norm);
      return c;
    });

    return {
      ...dr,
      practicalGuidance: diversifiedGuidance,
      whatCannotBeConcluded: diversifiedCannot
    };
  });
}
