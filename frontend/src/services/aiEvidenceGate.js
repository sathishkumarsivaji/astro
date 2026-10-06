/**
 * ASTROVERSE — AI Evidence Verification & Universal Semantic Claim Firewall
 * =========================================================================
 * Upgrades AI narrative generation from simple lexical sanitization to a
 * formal Universal Semantic Claim Firewall.
 *
 * Requirements (Parts 3, 4, 5, 6, 11):
 * 1. Narrative -> Sentence Segmentation -> Semantic Claim Classification:
 *    [FACT, INTERPRETATION, TIMING, EMPIRICAL, HEALTH, FINANCIAL, LEGAL, GENERAL].
 * 2. Fail-Closed Grounding:
 *    If narrative contains substantive declarative statements, totalClaims = 0
 *    MUST fail closed with:
 *      claimExtractionStatus = "INCOMPLETE"
 *      isValid = false
 *      failureReason = "SUBSTANTIVE_CLAIM_EXTRACTION_FAILED"
 * 3. Exact Day/Date Claims:
 *    Without an independently validated DAY model, exact predictive dates fail with:
 *      failureReason = "UNSUPPORTED_TIMING_PRECISION"
 * 4. Empirical Claims:
 *    Raw prevalence-driven accuracy claimed as predictive accuracy fails with:
 *      failureReason = "MISREPRESENTED_METRIC"
 * 5. Statutory Safety:
 *    - Clinical health, diagnosis, surgery blocked by Health Safety Layer.
 *    - Guaranteed wealth or returns blocked for financial certainty.
 *    - Guaranteed court victory blocked for legal certainty.
 * 6. Evidence Grounding:
 *    - FACT claims must resolve to calculated chart facts.
 *    - INTERPRETATION claims must resolve to canonical rule nodes & evidence IDs.
 *    - TIMING claims must resolve to candidate timing windows & resolution evidence.
 */

import { HEALTH_FORBIDDEN_TERMS } from "./expertPrediction/expertPredictionSchema.js";
import { sanitizeHealthText } from "./expertPrediction/healthSafetyLayer.js";
import { validateAndSanitizeNarrative } from "./astroEngine.js";

// Canonical planets and sign names for regex extraction
const PLANET_NAMES = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"
];

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export const CLAIM_TYPES = Object.freeze({
  FACT: "FACT",
  INTERPRETATION: "INTERPRETATION",
  TIMING: "TIMING",
  EMPIRICAL: "EMPIRICAL",
  HEALTH: "HEALTH",
  FINANCIAL: "FINANCIAL",
  LEGAL: "LEGAL",
  GENERAL: "GENERAL"
});

export const SUPPORT_STATUS = Object.freeze({
  SUPPORTED: "SUPPORTED",
  PARTIALLY_SUPPORTED: "PARTIALLY_SUPPORTED",
  UNSUPPORTED: "UNSUPPORTED",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  NOT_APPLICABLE: "NOT_APPLICABLE"
});

// Forbidden fatalistic expressions and their honest epistemic replacements
const FORBIDDEN_OVERCLAIM_PATTERNS = [
  { pattern: /\bexact\s+prediction\b/gi, replacement: "calculated timing window" },
  { pattern: /\bexact\s+date\b/gi, replacement: "calculated date window" },
  { pattern: /\bguaranteed\s+date\b/gi, replacement: "indicated timing range" },
  { pattern: /\bguaranteed\s+event\b/gi, replacement: "traditionally supported event" },
  { pattern: /\bguaranteed\s+outcome\b/gi, replacement: "classically favored alignment" },
  { pattern: /\bcertain\s+event\b/gi, replacement: "indicated classical cycle" },
  { pattern: /\b100%\s+accuracy\b/gi, replacement: "traditional rule convergence" },
  { pattern: /\b100%\s+accurate\b/gi, replacement: "methodologically aligned" },
  { pattern: /\b100%\s+certainty\b/gi, replacement: "high rule convergence" },
  { pattern: /\bwill\s+definitely\s+happen\b/gi, replacement: "is classically supported to manifest" },
  { pattern: /\bwill\s+certainly\s+occur\b/gi, replacement: "is traditionally indicated to unfold" },
  { pattern: /\binevitable\s+event\b/gi, replacement: "strongly indicated cycle" },
  { pattern: /\babsolute\s+certainty\b/gi, replacement: "strong traditional alignment" }
];

/**
 * Splits text into discrete, trimmed sentences while preserving decimal numbers and abbreviations.
 */
export function splitIntoSentences(text) {
  if (!text || typeof text !== "string") return [];
  const normalized = text.replace(/\r\n/g, "\n");
  // Split on punctuation (.!?) followed by space and capital letter or Tamil script, or line breaks
  const rawSegments = normalized.split(/(?<=[.!?])\s+(?=[A-Z0-9\u0B80-\u0BFF])|\n+/);
  const sentences = [];
  for (const seg of rawSegments) {
    const trimmed = seg.trim();
    if (trimmed.length > 0) {
      sentences.push(trimmed);
    }
  }
  return sentences;
}

/**
 * Normalizes planet name to capitalized format (e.g. "jupiter" -> "Jupiter")
 */
export function normalizePlanetName(name) {
  if (!name) return "";
  const lower = name.toLowerCase();
  const match = PLANET_NAMES.find(p => p.toLowerCase() === lower);
  return match || name;
}

/**
 * Classifies a sentence semantically into one of the canonical claim types.
 */
export function classifySentence(sentence) {
  const s = sentence.trim();

  // 1. HEALTH checks: clinical terms, surgery, diagnosis, mortality
  const healthSurgeryRegex = /\b(?:undergo\s+)?(?:chest\s+|heart\s+|brain\s+|abdominal\s+|organ\s+)?surgery\b/i;
  const healthClinicalRegex = /\b(?:cancer|tumor|heart\s+attack|stroke|diabetes|illness|disease|diagnosis|diagnosed|prescri(?:be|ption)|treatment|hospital)\b/i;
  if (healthSurgeryRegex.test(s) || healthClinicalRegex.test(s)) {
    return {
      sentence: s,
      sentenceType: CLAIM_TYPES.HEALTH,
      substantive: true,
      domain: "HEALTH",
      safetyViolation: true,
      violationType: "HEALTH_SAFETY_VIOLATION",
      reason: "Clinical medical, surgical, or disease prediction is strictly prohibited."
    };
  }

  // 2. FINANCIAL checks: guaranteed wealth, returns, investment advisory
  const financialCertaintyRegex = /\b(?:guaranteed\s+(?:to\s+become\s+wealthy|wealth|profit|returns?|income|money)|become\s+wealthy\s+guaranteed|guaranteed\s+to\s+become\s+rich)\b/i;
  const financialAdvisoryRegex = /\b(?:buy\s+(?:stocks?|shares?|bonds?|crypto)|invest\s+in)\b/i;
  if (financialCertaintyRegex.test(s) || financialAdvisoryRegex.test(s)) {
    return {
      sentence: s,
      sentenceType: CLAIM_TYPES.FINANCIAL,
      substantive: true,
      domain: "FINANCE",
      safetyViolation: true,
      violationType: "UNSUPPORTED_FINANCIAL_CERTAINTY",
      reason: "Guaranteed wealth or financial advisory prediction is strictly prohibited."
    };
  }

  // 3. LEGAL checks: guaranteed court victory, lawsuit certainty
  const legalCertaintyRegex = /\b(?:court\s+case|lawsuit|case|trial)\s+(?:will\s+definitely\s+be\s+won|will\s+certainly\s+be\s+won|guaranteed\s+win|certain\s+to\s+win)\b/i;
  const legalAdvisoryRegex = /\b(?:file\s+a\s+lawsuit|court\s+will\s+rule\s+in\s+your\s+favor|guaranteed\s+legal\s+victory)\b/i;
  if (legalCertaintyRegex.test(s) || legalAdvisoryRegex.test(s)) {
    return {
      sentence: s,
      sentenceType: CLAIM_TYPES.LEGAL,
      substantive: true,
      domain: "LEGAL",
      safetyViolation: true,
      violationType: "UNSUPPORTED_LEGAL_CERTAINTY",
      reason: "Guaranteed legal victory or court outcome certainty is strictly prohibited."
    };
  }

  // 4. EMPIRICAL checks: model accuracy, benchmark metrics, percentage claims
  const empiricalMetricRegex = /\b(?:model|algorithm|system)?\s*(?:is|has|with)\s*(?:approximately\s*|approx\.?\s*|about\s*)?(\d+(?:\.\d+)?%)\s*(?:accurate|accuracy|predictive|precision|recall|mcc)\b/i;
  if (empiricalMetricRegex.test(s)) {
    return {
      sentence: s,
      sentenceType: CLAIM_TYPES.EMPIRICAL,
      substantive: true,
      domain: "EMPIRICAL",
      safetyViolation: true,
      violationType: "MISREPRESENTED_METRIC",
      reason: "Raw prevalence-driven accuracy cannot be claimed as model predictive accuracy."
    };
  }

  // 5. TIMING checks: exact dates, timing assertions, temporal prediction windows
  const exactDateRegex = /\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?:19|20)\d{2}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+(?:19|20)\d{2}|(?:19|20)\d{2}-\d{2}-\d{2})\b/i;
  const timingPredictiveRegex = /\b(?:will\s+happen\s+on|marriage\s+will\s+happen|favorable\s+period\s+is|timing\s+window|next\s+favorable\s+period)\b/i;
  if (timingPredictiveRegex.test(s) || (exactDateRegex.test(s) && /\b(?:happen|occur|period|window|marriage|career)\b/i.test(s))) {
    const hasExactDate = exactDateRegex.test(s);
    return {
      sentence: s,
      sentenceType: CLAIM_TYPES.TIMING,
      substantive: true,
      domain: "TIMING",
      hasExactDate,
      safetyViolation: hasExactDate,
      violationType: hasExactDate ? "UNSUPPORTED_TIMING_PRECISION" : null,
      reason: hasExactDate ? "Exact date prediction is not empirically supported by predictive models." : null
    };
  }

  // 6. FACT checks: planet in house, planet in sign, active dasha
  const factHouseRegex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(?:is\s+)?(?:placed\s+in|in|occupies)\s+(?:the\s+)?(?:house\s+)?(1[0-2]|[1-9])(?:st|nd|rd|th)?(?:\s+house)?/i;
  const signsPattern = SIGN_NAMES.join("|");
  const factSignRegex = new RegExp(`(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\\s+(?:is\\s+)?(?:placed\\s+in\\s+|in\\s+)(${signsPattern})`, "i");
  const factDashaRegex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(Mahadasha|Antardasha|Dasha|Bhukti)/i;

  // Distinguish factual placement from interpretation:
  // If sentence has "Jupiter in the 10th house traditionally supports career development", it has a FACT component and an INTERPRETATION component
  const hasInterpretiveVerb = /\b(?:supports|enhances|promotes|strengthens|favors|benefits|activates|triggers|causes|indicates|signifies|delays|obstructs|hinders|development|success)\b/i.test(s);

  if ((factHouseRegex.test(s) || factSignRegex.test(s) || factDashaRegex.test(s)) && !hasInterpretiveVerb) {
    return {
      sentence: s,
      sentenceType: CLAIM_TYPES.FACT,
      substantive: true,
      domain: "ASTRONOMY",
      safetyViolation: false
    };
  }

  // 7. INTERPRETATION checks: domain indications, career success, marriage support
  const interpretiveRegex = /\b(?:indicates|indicates\s+strong|supports|enhances|promotes|strengthens|favors|benefits|activates|triggers|causes|signifies|delays|obstructs|hinders)\b/i;
  const domainKeywords = ["career", "profession", "marriage", "matrimony", "relationship", "wealth", "finance", "property", "education", "health", "progeny", "children", "success", "development"];
  const matchedDomain = domainKeywords.find(d => s.toLowerCase().includes(d)) || "GENERAL_INTERPRETATION";

  if (interpretiveRegex.test(s) || hasInterpretiveVerb) {
    return {
      sentence: s,
      sentenceType: CLAIM_TYPES.INTERPRETATION,
      substantive: true,
      domain: matchedDomain.toUpperCase(),
      safetyViolation: false
    };
  }

  // 8. GENERAL checks: boilerplate, greetings, general philosophy
  const isGeneral = /\b(?:welcome|reading|chart|overview|analysis|namaste|report)\b/i.test(s) && s.length < 50;
  return {
    sentence: s,
    sentenceType: CLAIM_TYPES.GENERAL,
    substantive: !isGeneral,
    domain: "GENERAL",
    safetyViolation: false
  };
}

/**
 * Extracts planet-to-house assertions from text.
 */
function extractPlanetHouseAssertions(text) {
  const assertions = [];
  const regex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(?:is\s+)?(?:placed\s+in|in|occupies)\s+(?:the\s+)?(?:house\s+)?(1[0-2]|[1-9])(?:st|nd|rd|th)?(?:\s+house)?/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    assertions.push({
      fullText: match[0],
      planet: normalizePlanetName(match[1]),
      house: parseInt(match[2], 10),
      index: match.index
    });
  }
  return assertions;
}

/**
 * Extracts planet-to-sign assertions from text.
 */
function extractPlanetSignAssertions(text) {
  const assertions = [];
  const signsPattern = SIGN_NAMES.join("|");
  const regex = new RegExp(`(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\\s+(?:is\\s+)?(?:placed\\s+in\\s+|in\\s+)(${signsPattern})`, "gi");
  let match;
  while ((match = regex.exec(text)) !== null) {
    assertions.push({
      fullText: match[0],
      planet: normalizePlanetName(match[1]),
      sign: match[2],
      index: match.index
    });
  }
  return assertions;
}

/**
 * Extracts dasha lord assertions from text.
 */
function extractDashaAssertions(text) {
  const assertions = [];
  const regex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(Mahadasha|Antardasha|Dasha|Bhukti)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    assertions.push({
      fullText: match[0],
      planet: normalizePlanetName(match[1]),
      level: match[2].toLowerCase().includes("antar") || match[2].toLowerCase().includes("bhukti") ? "AD" : "MD",
      index: match.index
    });
  }
  return assertions;
}

/**
 * Builds a fast lookup map for planets from chartContext.
 */
function buildPlanetFactMap(chartContext) {
  const map = new Map();
  if (!chartContext) return map;

  const planetList = Array.isArray(chartContext.planets)
    ? chartContext.planets
    : (chartContext.planets instanceof Map ? Array.from(chartContext.planets.values()) : []);

  for (const p of planetList) {
    if (!p || !p.name) continue;
    const name = normalizePlanetName(p.name);
    map.set(name, {
      name,
      house: typeof p.house === "number" ? p.house : (typeof p.houseNum === "number" ? p.houseNum : null),
      sign: p.sign || p.signName || null,
      longitude: p.longitude ?? null,
      isRetrograde: Boolean(p.isRetrograde || p.retrograde)
    });
  }
  return map;
}

/**
 * Verifies and sanitizes an AI-generated astrological narrative against
 * the authentic evidence graph and calculated chart facts using a Universal Semantic Claim Firewall.
 *
 * @param {string} narrative - Raw text generated by AI / LLM
 * @param {Object} chartContext - Calculated chart facts (planets, houses, dashaTable, evidenceNodes)
 * @param {Object} [options]
 * @param {boolean} [options.strictGrounding=false] - If true, replaces unsupported claims with notice
 * @param {string} [options.lang="en"] - "en" or "ta"
 * @returns {Object} Structured verification result
 */
export function verifyAndSanitizeAiNarrative(narrative, chartContext = null, options = {}) {
  if (!narrative || typeof narrative !== "string" || narrative.trim().length === 0) {
    return {
      isValid: true,
      sanitizedNarrative: "",
      verifiedClaims: [],
      unsupportedClaims: [],
      sanitizedViolations: [],
      claimExtractionStatus: "COMPLETE",
      failureReason: null,
      classifiedSentences: [],
      epistemicAudit: {
        totalClaims: 0,
        verifiedCount: 0,
        unsupportedCount: 0,
        groundingRate: 1.0,
        claimExtractionStatus: "COMPLETE",
        failureReason: null,
        epistemicStatus: {
          astronomicalStatus: "CALCULATED",
          traditionalInterpretationStatus: "RULE_BASED",
          empiricalValidationStatus: "TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED"
        }
      }
    };
  }

  const { strictGrounding = false, lang = "en" } = options;
  const isTamil = lang === "ta";
  let processedText = narrative;
  const violations = [];

  // 1. Sanitize medical / forbidden health terms
  const healthSanitized = sanitizeHealthText(processedText);
  if (healthSanitized.violations.length > 0) {
    violations.push(...healthSanitized.violations.map(v => `HEALTH_FORBIDDEN_TERM: ${v}`));
    processedText = healthSanitized.sanitized;
  }

  // 2. Sanitize fatalistic and pseudo-scientific overclaims
  for (const { pattern, replacement } of FORBIDDEN_OVERCLAIM_PATTERNS) {
    if (pattern.test(processedText)) {
      violations.push(`OVERCLAIM_TERM_SANITIZED: ${pattern.source}`);
      processedText = processedText.replace(pattern, replacement);
    }
  }

  // 3. Run classical narrative validator from astroEngine
  processedText = validateAndSanitizeNarrative(processedText, lang);

  // 4. Universal Sentence Segmentation and Classification
  const rawSentences = splitIntoSentences(narrative);
  const classifiedSentences = rawSentences.map(classifySentence);

  const verifiedClaims = [];
  const unsupportedClaims = [];

  // Populate effective evidence nodes from chartContext
  let effectiveNodes = Array.isArray(chartContext?.evidenceNodes)
    ? chartContext.evidenceNodes.map(n => ({ ...n, nodeType: n.nodeType || "CANONICAL_EVIDENCE_NODE", source: n.source || "CANONICAL_EVIDENCE_NODE" }))
    : (Array.isArray(chartContext?.evidenceIds) ? chartContext.evidenceIds.map(id => ({ nodeId: id, nodeType: "CANONICAL_EVIDENCE_NODE", source: "CANONICAL_EVIDENCE_NODE" })) : []);

  if (effectiveNodes.length === 0 && Array.isArray(chartContext?.planets)) {
    const autoNodes = [];
    for (const p of chartContext.planets) {
      if (p && p.name) {
        if (p.house != null) {
          autoNodes.push({
            nodeId: `EV_PLANET_${p.name.toUpperCase()}_H${p.house}`,
            type: 'HOUSE',
            nodeType: 'AUTO_DERIVED_FACT_NODE',
            source: 'AUTO_DERIVED_FACT_NODE',
            description: `${p.name} in House ${p.house}`
          });
        }
        if (p.sign) {
          autoNodes.push({
            nodeId: `EV_PLANET_${p.name.toUpperCase()}_${p.sign.toUpperCase()}`,
            type: 'SIGN',
            nodeType: 'AUTO_DERIVED_FACT_NODE',
            source: 'AUTO_DERIVED_FACT_NODE',
            description: `${p.name} in ${p.sign}`
          });
        }
      }
    }
    if (chartContext?.currentDasha?.lord) {
      autoNodes.push({
        nodeId: `EV_DASHA_${chartContext.currentDasha.lord.toUpperCase()}`,
        type: 'DASHA_MD',
        nodeType: 'AUTO_DERIVED_FACT_NODE',
        source: 'AUTO_DERIVED_FACT_NODE',
        description: `Active Mahadasha: ${chartContext.currentDasha.lord}`
      });
    }
    if (chartContext?.currentDasha?.subLord || chartContext?.currentDasha?.antarDasha) {
      const antar = chartContext.currentDasha.subLord || chartContext.currentDasha.antarDasha;
      autoNodes.push({
        nodeId: `EV_DASHA_${antar.toUpperCase()}`,
        type: 'DASHA_AD',
        nodeType: 'AUTO_DERIVED_FACT_NODE',
        source: 'AUTO_DERIVED_FACT_NODE',
        description: `Active Antardasha: ${antar}`
      });
    }
    effectiveNodes = autoNodes;
  }

  const evidenceNodeIds = new Set(
    effectiveNodes.map(n => n.nodeId || n.evidenceId || n.id).filter(Boolean)
  );

  const planetFacts = buildPlanetFactMap(chartContext);

  // Evaluate each classified sentence through the Universal Semantic Firewall
  for (const cs of classifiedSentences) {
    if (cs.sentenceType === CLAIM_TYPES.HEALTH) {
      violations.push(`HEALTH_SAFETY_VIOLATION: ${cs.reason}`);
      unsupportedClaims.push({
        claimText: cs.sentence,
        claimType: CLAIM_TYPES.HEALTH,
        reason: cs.reason,
        failure: "HEALTH_SAFETY_VIOLATION",
        status: "UNSUPPORTED_CLAIM"
      });
    } else if (cs.sentenceType === CLAIM_TYPES.FINANCIAL && cs.safetyViolation) {
      violations.push(`UNSUPPORTED_FINANCIAL_CERTAINTY: ${cs.reason}`);
      unsupportedClaims.push({
        claimText: cs.sentence,
        claimType: CLAIM_TYPES.FINANCIAL,
        reason: cs.reason,
        failure: "UNSUPPORTED_FINANCIAL_CERTAINTY",
        status: "UNSUPPORTED_CLAIM"
      });
    } else if (cs.sentenceType === CLAIM_TYPES.LEGAL && cs.safetyViolation) {
      violations.push(`UNSUPPORTED_LEGAL_CERTAINTY: ${cs.reason}`);
      unsupportedClaims.push({
        claimText: cs.sentence,
        claimType: CLAIM_TYPES.LEGAL,
        reason: cs.reason,
        failure: "UNSUPPORTED_LEGAL_CERTAINTY",
        status: "UNSUPPORTED_CLAIM"
      });
    } else if (cs.sentenceType === CLAIM_TYPES.EMPIRICAL) {
      violations.push(`MISREPRESENTED_METRIC: ${cs.reason}`);
      unsupportedClaims.push({
        claimText: cs.sentence,
        claimType: CLAIM_TYPES.EMPIRICAL,
        reason: cs.reason,
        failure: "MISREPRESENTED_METRIC",
        status: "UNSUPPORTED_CLAIM"
      });
    } else if (cs.sentenceType === CLAIM_TYPES.TIMING) {
      if (cs.hasExactDate) {
        violations.push(`UNSUPPORTED_TIMING_PRECISION: ${cs.reason}`);
        unsupportedClaims.push({
          claimText: cs.sentence,
          claimType: CLAIM_TYPES.TIMING,
          reason: cs.reason,
          failure: "UNSUPPORTED_TIMING_PRECISION",
          status: "UNSUPPORTED_CLAIM"
        });
      } else {
        // Non-exact timing window assertion requires timing evidence
        const hasTimingEvidence = effectiveNodes.some(n => n.type?.startsWith("DASHA") || n.type === "TIMING_WINDOW");
        if (!hasTimingEvidence) {
          unsupportedClaims.push({
            claimText: cs.sentence,
            claimType: CLAIM_TYPES.TIMING,
            reason: "INSUFFICIENT_DATA: Timing claim requires candidate timing windows or active dasha periods in chartContext",
            failure: "INSUFFICIENT_TIMING_EVIDENCE",
            status: "UNSUPPORTED_CLAIM"
          });
        } else {
          verifiedClaims.push({
            claimText: cs.sentence,
            claimType: CLAIM_TYPES.TIMING,
            matchedFactor: "Verified timing window in chartContext",
            evidenceIds: effectiveNodes.filter(n => n.type?.startsWith("DASHA")).map(n => n.nodeId),
            status: "VERIFIED"
          });
        }
      }
    } else if (cs.sentenceType === CLAIM_TYPES.INTERPRETATION) {
      // INTERPRETATION requires matching canonical evidence rule node for asserted domain
      const targetDomain = cs.domain.toLowerCase();
      const canonicalRuleNodes = effectiveNodes.filter(n =>
        n.nodeType !== "AUTO_DERIVED_FACT_NODE" &&
        (
          (n.domain && n.domain.toLowerCase() === targetDomain) ||
          (n.nodeId && n.nodeId.toLowerCase().includes(targetDomain)) ||
          (n.ruleId && n.ruleId.toLowerCase().includes(targetDomain)) ||
          (n.description && n.description.toLowerCase().includes(targetDomain))
        )
      );

      if (canonicalRuleNodes.length === 0) {
        unsupportedClaims.push({
          claimText: cs.sentence,
          claimType: CLAIM_TYPES.INTERPRETATION,
          reason: `NO_INTERPRETIVE_RULE_IN_GRAPH: Interpretive claim for ${cs.domain} requires canonical evidence rule node in chartContext`,
          failure: "NO_INTERPRETIVE_RULE_IN_GRAPH",
          status: "UNSUPPORTED_CLAIM"
        });
      } else {
        verifiedClaims.push({
          claimText: cs.sentence,
          claimType: CLAIM_TYPES.INTERPRETATION,
          matchedFactor: `Canonical rule grounding for ${cs.domain}`,
          evidenceIds: canonicalRuleNodes.map(n => n.nodeId || n.id),
          status: "VERIFIED"
        });
      }
    }
  }

  // Check Planet-in-House assertions (FACT)
  const houseAssertions = extractPlanetHouseAssertions(processedText);
  for (const assertion of houseAssertions) {
    const fact = planetFacts.get(assertion.planet);
    if (!fact || fact.house == null) {
      unsupportedClaims.push({
        claimText: assertion.fullText,
        claimType: CLAIM_TYPES.FACT,
        reason: `PLANET_NOT_FOUND_IN_CHART: Cannot verify ${assertion.planet}`,
        failure: "PLANET_NOT_FOUND_IN_CHART",
        status: "UNSUPPORTED_CLAIM"
      });
    } else if (fact.house === assertion.house) {
      const matchingHouseNodes = effectiveNodes.filter(n =>
        (n.nodeId && n.nodeId.toLowerCase().includes(fact.name.toLowerCase())) ||
        (n.description && n.description.toLowerCase().includes(fact.name.toLowerCase())) ||
        (n.type === 'HOUSE' && n.description?.includes(String(assertion.house))) ||
        (n.type === 'LORD' && n.description?.toLowerCase().includes(fact.name.toLowerCase()))
      );
      const evIds = matchingHouseNodes.length > 0
        ? matchingHouseNodes.map(n => n.nodeId)
        : Array.from(evidenceNodeIds).filter(id => id.toLowerCase().includes(fact.name.toLowerCase())).slice(0, 2);

      if (evIds.length === 0) {
        unsupportedClaims.push({
          claimText: assertion.fullText,
          claimType: CLAIM_TYPES.FACT,
          reason: `NO_EVIDENCE_NODE_IN_GRAPH: ${fact.name} in House ${fact.house} has no corresponding evidence node in chartContext`,
          failure: "NO_EVIDENCE_NODE_IN_GRAPH",
          status: "UNSUPPORTED_CLAIM"
        });
      } else {
        verifiedClaims.push({
          claimText: assertion.fullText,
          claimType: CLAIM_TYPES.FACT,
          matchedFactor: `${fact.name} in House ${fact.house}`,
          evidenceIds: evIds,
          status: "VERIFIED"
        });
      }
    } else {
      unsupportedClaims.push({
        claimText: assertion.fullText,
        claimType: CLAIM_TYPES.FACT,
        reason: `CONTRADICTS_CALCULATED_CHART: Calculated ${fact.name} is in House ${fact.house}, not House ${assertion.house}`,
        failure: "CONTRADICTS_CALCULATED_CHART",
        status: "UNSUPPORTED_CLAIM"
      });
    }
  }

  // Check Planet-in-Sign assertions (FACT)
  const signAssertions = extractPlanetSignAssertions(processedText);
  for (const assertion of signAssertions) {
    const fact = planetFacts.get(assertion.planet);
    if (!fact || !fact.sign) {
      unsupportedClaims.push({
        claimText: assertion.fullText,
        claimType: CLAIM_TYPES.FACT,
        reason: `PLANET_SIGN_NOT_FOUND_IN_CHART: Cannot verify sign for ${assertion.planet}`,
        failure: "PLANET_SIGN_NOT_FOUND_IN_CHART",
        status: "UNSUPPORTED_CLAIM"
      });
    } else if (fact.sign.toLowerCase() === assertion.sign.toLowerCase()) {
      const matchingSignNodes = effectiveNodes.filter(n =>
        (n.nodeId && n.nodeId.toLowerCase().includes(fact.name.toLowerCase())) ||
        (n.description && n.description.toLowerCase().includes(fact.name.toLowerCase())) ||
        (n.description && n.description.toLowerCase().includes(fact.sign.toLowerCase()))
      );
      const evIds = matchingSignNodes.length > 0
        ? matchingSignNodes.map(n => n.nodeId)
        : Array.from(evidenceNodeIds).filter(id => id.toLowerCase().includes(fact.name.toLowerCase()) || id.toLowerCase().includes(fact.sign.toLowerCase())).slice(0, 2);

      if (evIds.length === 0) {
        unsupportedClaims.push({
          claimText: assertion.fullText,
          claimType: CLAIM_TYPES.FACT,
          reason: `NO_EVIDENCE_NODE_IN_GRAPH: ${fact.name} in ${fact.sign} has no corresponding evidence node in chartContext`,
          failure: "NO_EVIDENCE_NODE_IN_GRAPH",
          status: "UNSUPPORTED_CLAIM"
        });
      } else {
        verifiedClaims.push({
          claimText: assertion.fullText,
          claimType: CLAIM_TYPES.FACT,
          matchedFactor: `${fact.name} in ${fact.sign}`,
          evidenceIds: evIds,
          status: "VERIFIED"
        });
      }
    } else {
      unsupportedClaims.push({
        claimText: assertion.fullText,
        claimType: CLAIM_TYPES.FACT,
        reason: `CONTRADICTS_CALCULATED_CHART: Calculated ${fact.name} is in ${fact.sign}, not ${assertion.sign}`,
        failure: "CONTRADICTS_CALCULATED_CHART",
        status: "UNSUPPORTED_CLAIM"
      });
    }
  }

  // Check Dasha assertions (FACT)
  const dashaAssertions = extractDashaAssertions(processedText);
  const dashaTable = chartContext?.dashaTable || [];
  const activeDashaLord = chartContext?.currentDasha?.mahadashaLord || chartContext?.currentDasha?.lord || chartContext?.activeDasha?.lord || null;
  const activeAntarLord = chartContext?.currentDasha?.antardashaLord || chartContext?.currentDasha?.subLord || chartContext?.currentDasha?.antarDasha || chartContext?.activeDasha?.subLord || null;

  if (Array.isArray(dashaTable) && dashaTable.length > 0) {
    for (const assertion of dashaAssertions) {
      let isLordVerified = false;
      let matchedReason = "";

      if (activeDashaLord && (assertion.level === "MD" || !assertion.level)) {
        if (activeDashaLord.toLowerCase() === assertion.planet.toLowerCase()) {
          isLordVerified = true;
          matchedReason = `Active Mahadasha Lord is ${assertion.planet}`;
        }
      }
      if (!isLordVerified && activeAntarLord && (assertion.level === "AD" || !assertion.level)) {
        if (activeAntarLord.toLowerCase() === assertion.planet.toLowerCase()) {
          isLordVerified = true;
          matchedReason = `Active Antardasha Lord is ${assertion.planet}`;
        }
      }

      if (isLordVerified) {
        const matchingDashaNodes = effectiveNodes.filter(n =>
          (n.type?.startsWith("DASHA") || (n.nodeId && n.nodeId.toLowerCase().includes("dasha"))) &&
          (n.nodeId?.toLowerCase().includes(assertion.planet.toLowerCase()) || n.description?.toLowerCase().includes(assertion.planet.toLowerCase()))
        );
        const evIds = matchingDashaNodes.length > 0
          ? matchingDashaNodes.map(n => n.nodeId)
          : Array.from(evidenceNodeIds).filter(id => id.toLowerCase().includes(assertion.planet.toLowerCase())).slice(0, 2);

        if (evIds.length === 0) {
          unsupportedClaims.push({
            claimText: assertion.fullText,
            claimType: CLAIM_TYPES.FACT,
            reason: `NO_EVIDENCE_NODE_IN_GRAPH: Active ${assertion.planet} Dasha has no corresponding evidence node in chartContext`,
            failure: "NO_EVIDENCE_NODE_IN_GRAPH",
            status: "UNSUPPORTED_CLAIM"
          });
        } else {
          verifiedClaims.push({
            claimText: assertion.fullText,
            claimType: CLAIM_TYPES.FACT,
            matchedFactor: matchedReason,
            evidenceIds: evIds,
            status: "VERIFIED"
          });
        }
      } else {
        unsupportedClaims.push({
          claimText: assertion.fullText,
          claimType: CLAIM_TYPES.FACT,
          reason: `CONTRADICTS_CALCULATED_CHART: ${assertion.planet} is not verified in active or indicated dasha periods`,
          failure: "CONTRADICTS_CALCULATED_CHART",
          status: "UNSUPPORTED_CLAIM"
        });
      }
    }
  }

  // In strict grounding mode, replace or annotate contradictory claims in narrative
  if (strictGrounding && unsupportedClaims.length > 0) {
    for (const un of unsupportedClaims) {
      if (un.reason.startsWith("CONTRADICTS_CALCULATED_CHART")) {
        const replacementNotice = isTamil
          ? `[சரிபார்க்கப்படாத கூற்று: பாரம்பரிய விதிகளின்படி மாற்றியமைக்கப்பட்டது]`
          : `[UNSUPPORTED_CLAIM: ${un.reason}]`;
        processedText = processedText.replace(un.claimText, replacementNotice);
      }
    }
  }

  const totalClaims = verifiedClaims.length + unsupportedClaims.length;
  const substantiveSentences = classifiedSentences.filter(s => s.substantive);

  // Requirement 3.3 Fail-Closed Rule:
  // If the narrative contains substantive declarative statements but totalClaims = 0:
  let claimExtractionStatus = "COMPLETE";
  let failureReason = null;
  let isValid = violations.length === 0 && unsupportedClaims.length === 0;

  if (substantiveSentences.length > 0 && totalClaims === 0) {
    claimExtractionStatus = "INCOMPLETE";
    isValid = false;
    failureReason = "SUBSTANTIVE_CLAIM_EXTRACTION_FAILED";
  } else if (!isValid) {
    const firstFailure = unsupportedClaims.find(c => c.failure)?.failure ||
                         violations[0]?.split(":")[0] ||
                         "UNSUPPORTED_CLAIMS_DETECTED";
    failureReason = firstFailure;
  }

  const groundingRate = totalClaims > 0 ? Number((verifiedClaims.length / totalClaims).toFixed(2)) : (isValid ? 1.0 : 0.0);

  return {
    isValid,
    sanitizedNarrative: processedText,
    verifiedClaims,
    unsupportedClaims,
    sanitizedViolations: violations,
    claimExtractionStatus,
    failureReason,
    classifiedSentences,
    epistemicAudit: {
      totalClaims,
      verifiedCount: verifiedClaims.length,
      unsupportedCount: unsupportedClaims.length,
      groundingRate,
      claimExtractionStatus,
      failureReason,
      epistemicStatus: {
        astronomicalStatus: "CALCULATED",
        traditionalInterpretationStatus: "RULE_BASED",
        empiricalValidationStatus: "TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED"
      }
    }
  };
}
