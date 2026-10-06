/**
 * ASTROVERSE — Server-Side AI Evidence Gate & Universal Semantic Claim Firewall
 * ==============================================================================
 * Backend must NEVER return ungrounded, contradictory, or safety-violating AI text.
 * Every AI response passes through:
 * 1. Sentence segmentation & semantic classification [FACT, INTERPRETATION, TIMING, EMPIRICAL, HEALTH, FINANCIAL, LEGAL, GENERAL]
 * 2. Fail-closed substantive grounding gate (totalClaims = 0 with substantive text fails closed)
 * 3. Exact predictive date blocking (UNSUPPORTED_TIMING_PRECISION)
 * 4. Misrepresented empirical accuracy blocking (MISREPRESENTED_METRIC)
 * 5. Health, Financial, Legal statutory safety scanning & blocking
 * 6. Evidence verification against calculated chartContext
 * 7. Fabricated value detection & coordinate redaction
 * 8. Statutory disclaimers injection
 */

const PLANET_NAMES = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'
];

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
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

// Forbidden categorical prediction language
const FORBIDDEN_PATTERNS = [
  /\bwill definitely\b/gi,
  /\bwill certainly\b/gi,
  /\bguarantees\b/gi,
  /\bensures\b/gi,
  /\bdestined to\b/gi,
  /\binevitable\b/gi,
  /\bcertain to\b/gi,
  /\bproves that\b/gi,
  /\bscientifically proven\b/gi,
  /\bmedically confirmed\b/gi,
  /\b100%\s+accurate\b/gi,
  /\b100%\s+accuracy\b/gi,
  /\babsolute\s+certainty\b/gi,
  /\bexact\s+prediction\b/gi
];

// Health safety patterns
const HEALTH_DIAGNOSTIC_PATTERNS = [
  /\byou (will |may )?have [A-Z][a-z]+ (disease|cancer|syndrome|disorder)/gi,
  /\byou (will |should )?take [A-Z][a-z]+ (medicine|medication|drug|tablet)/gi,
  /\bdiagnos(is|ed|e)\b/gi,
  /\bprescri(be|ption|bed)\b/gi,
  /\bsurgery is (needed|required|indicated)\b/gi,
  /\bundergo\s+(?:chest\s+|heart\s+|brain\s+|abdominal\s+|organ\s+)?surgery\b/gi,
  /\b(cancer|tumor|heart\s+attack|stroke|diabetes)\b/gi
];

// Financial advisory patterns  
const FINANCIAL_ADVISORY_PATTERNS = [
  /\binvest in [A-Z]/gi,
  /\bbuy (stocks?|shares?|bonds?|crypto)\b/gi,
  /\bsell (stocks?|shares?|bonds?)\b/gi,
  /\b(guaranteed|certain) returns?\b/gi,
  /\bguaranteed\s+(?:to\s+become\s+wealthy|wealth|profit|returns?|income|money)\b/gi,
  /\bbecome\s+wealthy\s+guaranteed\b/gi,
  /\b(?:will\s+become\s+(?:a\s+)?(?:billionaire|millionaire|rich|wealthy)|become\s+(?:a\s+)?(?:billionaire|millionaire)|billionaire|millionaire|earn\s+millions|accumulate\s+vast\s+wealth|destined\s+to\s+(?:be|become)\s+(?:rich|wealthy|billionaire|millionaire)|(?:wealth|income|finances?|investments?|money)\s+will\s+(?:rise\s+dramatically|skyrocket|multiply|double|triple)|lottery|jackpot)\b/gi
];

// Legal advisory patterns
const LEGAL_ADVISORY_PATTERNS = [
  /\bfile (a )?(lawsuit|suit|case|petition)\b/gi,
  /\byou (will |should )?(win|lose) (the|your) (case|trial|lawsuit|litigation)\b/gi,
  /\blegal (advice|counsel|representation)\b/gi,
  /\bcourt will rule in your favor\b/gi,
  /\bsettle out of court\b/gi,
  /\bguaranteed legal victory\b/gi,
  /\bbypass legal proceedings\b/gi,
  /\bcourt\s+case\s+(?:will\s+definitely\s+be\s+won|will\s+certainly\s+be\s+won|guaranteed\s+win)\b/gi
];

// Fabricated astronomical value patterns
const FABRICATED_VALUE_PATTERNS = [
  /\b\d{1,3}°\s*\d{1,2}'\s*\d{1,2}(?:\.\d+)?"/g, // DMS format that AI might fabricate
  /longitude[:\s]+\d+\.\d{4,}/gi,                 // High-precision longitude AI might invent
];

export function normalizePlanetName(name) {
  if (!name) return '';
  const lower = name.toLowerCase();
  const match = PLANET_NAMES.find(p => p.toLowerCase() === lower);
  return match || name;
}

/**
 * Splits narrative into individual sentences.
 */
export function splitIntoSentences(text) {
  if (!text || typeof text !== "string") return [];
  const normalized = text.replace(/\r\n/g, "\n");
  const rawSegments = normalized.split(/(?<=[.!?])\s+(?=[A-Z0-9\u0B80-\u0BFF])|\n+/);
  const sentences = [];
  for (const seg of rawSegments) {
    const trimmed = seg.trim();
    if (trimmed.length > 0) sentences.push(trimmed);
  }
  return sentences;
}

/**
 * Classifies a sentence semantically into one of the canonical claim types.
 */
export function classifySentence(sentence) {
  const s = sentence.trim();

  // 1. HEALTH checks
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

  // 2. FINANCIAL checks
  const financialCertaintyRegex = /\b(?:guaranteed\s+(?:to\s+become\s+wealthy|wealth|profit|returns?|income|money)|become\s+wealthy\s+guaranteed|guaranteed\s+to\s+become\s+rich)\b/i;
  const financialAdvisoryRegex = /\b(?:buy\s+(?:stocks?|shares?|bonds?|crypto)|invest\s+in)\b/i;
  const financialPredictiveRegex = /\b(?:will\s+become\s+(?:a\s+)?(?:billionaire|millionaire|rich|wealthy)|become\s+(?:a\s+)?(?:billionaire|millionaire)|billionaire|millionaire|earn\s+millions|accumulate\s+vast\s+wealth|destined\s+to\s+(?:be|become)\s+(?:rich|wealthy|billionaire|millionaire)|(?:wealth|income|finances?|investments?|money)\s+will\s+(?:rise\s+dramatically|skyrocket|multiply|double|triple)|lottery|jackpot)\b/i;
  if (financialCertaintyRegex.test(s) || financialAdvisoryRegex.test(s) || financialPredictiveRegex.test(s)) {
    return {
      sentence: s,
      sentenceType: CLAIM_TYPES.FINANCIAL,
      substantive: true,
      domain: "FINANCE",
      safetyViolation: true,
      violationType: "UNSUPPORTED_FINANCIAL_CERTAINTY",
      reason: "Guaranteed wealth, extreme windfall, or speculative financial predictions are strictly prohibited."
    };
  }

  // 3. LEGAL checks
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

  // 4. EMPIRICAL checks
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

  // 5. TIMING checks
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

  // 6. FACT checks
  const factHouseRegex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(?:is\s+)?(?:placed\s+in|in|occupies)\s+(?:the\s+)?(?:house\s+)?(1[0-2]|[1-9])(?:st|nd|rd|th)?(?:\s+house)?/i;
  const signsPattern = SIGN_NAMES.join("|");
  const factSignRegex = new RegExp(`(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\\s+(?:is\\s+)?(?:placed\\s+in\\s+|in\\s+)(${signsPattern})`, "i");
  const factDashaRegex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(Mahadasha|Antardasha|Dasha|Bhukti)/i;
  const hasInterpretiveVerb = /\b(?:supports|enhances|promotes|strengthens|favors|benefits|activates|triggers|causes|indicates|signifies|delays|obstructs|hinders|development|success|will\s+rise|destined\s+to|will\s+achieve|will\s+experience|promises|confers|leads\s+to|brings|produces|will\s+rise\s+dramatically)\b/i.test(s);

  if ((factHouseRegex.test(s) || factSignRegex.test(s) || factDashaRegex.test(s)) && !hasInterpretiveVerb) {
    return {
      sentence: s,
      sentenceType: CLAIM_TYPES.FACT,
      substantive: true,
      domain: "ASTRONOMY",
      safetyViolation: false
    };
  }

  // 7. INTERPRETATION checks
  const interpretiveRegex = /\b(?:indicates|indicates\s+strong|supports|enhances|promotes|strengthens|favors|benefits|activates|triggers|causes|signifies|delays|obstructs|hinders|will\s+rise|destined\s+to|will\s+achieve|will\s+experience|promises|confers|will\s+rise\s+dramatically)\b/i;
  const domainKeywords = ["career", "profession", "marriage", "matrimony", "relationship", "wealth", "finance", "property", "education", "health", "progeny", "children", "success", "development", "life", "future"];
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

  // 8. GENERAL checks
  const isBoilerplate = /\b(?:welcome|reading|chart|overview|analysis|namaste|report|disclaimer|methodology|framework|summary|note)\b/i.test(s) && s.length < 60;
  return {
    sentence: s,
    sentenceType: CLAIM_TYPES.GENERAL,
    substantive: !isBoilerplate,
    domain: "GENERAL",
    safetyViolation: false
  };
}

/**
 * Sanitizes AI text by replacing forbidden categorical patterns with safe alternatives.
 */
function sanitizeAIText(text) {
  const violations = [];
  let sanitized = text;
  
  const replacements = [
    [/\bwill definitely\b/gi, 'is indicated to'],
    [/\bwill certainly\b/gi, 'is strongly indicated to'],
    [/\bguarantees\b/gi, 'supports'],
    [/\bensures\b/gi, 'is traditionally associated with'],
    [/\bdestined to\b/gi, 'traditionally indicated for'],
    [/\binevitable\b/gi, 'strongly indicated'],
    [/\bcertain to\b/gi, 'indicated to'],
    [/\bproves that\b/gi, 'supports the interpretation that'],
    [/\bscientifically proven\b/gi, 'traditionally interpreted'],
    [/\bmedically confirmed\b/gi, 'noted in traditional practice'],
    [/\b100%\s+accurate\b/gi, 'methodologically aligned'],
    [/\b100%\s+accuracy\b/gi, 'traditional rule convergence'],
    [/\babsolute\s+certainty\b/gi, 'strong traditional alignment'],
    [/\bexact\s+prediction\b/gi, 'calculated timing window']
  ];
  
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(sanitized)) {
      violations.push(`Replaced forbidden pattern: ${pattern.source}`);
      sanitized = sanitized.replace(pattern, replacement);
    }
  }
  
  return { sanitized, violations };
}

/**
 * Scans for health, legal, and financial safety violations.
 */
function scanSafety(text) {
  const violations = [];
  
  for (const pattern of HEALTH_DIAGNOSTIC_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      violations.push({ type: 'HEALTH_DIAGNOSTIC', pattern: pattern.source });
    }
  }
  
  for (const pattern of FINANCIAL_ADVISORY_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      violations.push({ type: 'FINANCIAL_ADVISORY', pattern: pattern.source });
    }
  }

  for (const pattern of LEGAL_ADVISORY_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      violations.push({ type: 'LEGAL_ADVISORY', pattern: pattern.source });
    }
  }
  
  return violations;
}

/**
 * Scans for fabricated high-precision astronomical coordinates not backed by calculated chart.
 */
function scanFabricatedValues(text, chartContext) {
  const fabricated = [];
  let sanitized = text;

  for (const pattern of FABRICATED_VALUE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(sanitized)) !== null) {
      const coordStr = match[0];
      let matchesCalculated = false;
      if (chartContext && Array.isArray(chartContext.planets)) {
        for (const p of chartContext.planets) {
          if (p.longitude != null) {
            const degInt = Math.floor(p.longitude);
            if (coordStr.includes(String(degInt)) || coordStr.includes(p.longitude.toFixed(2))) {
              matchesCalculated = true;
              break;
            }
          }
        }
      }
      if (!matchesCalculated) {
        fabricated.push({ type: 'FABRICATED_ASTRONOMICAL_VALUE', value: coordStr });
        sanitized = sanitized.replace(coordStr, '[UNVERIFIED_COORDINATE_REDACTED]');
      }
    }
  }

  return { sanitized, fabricated };
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
      house: typeof p.house === 'number' ? p.house : (typeof p.houseNum === 'number' ? p.houseNum : null),
      sign: p.sign || p.signName || null,
      longitude: p.longitude ?? null,
      isRetrograde: Boolean(p.isRetrograde || p.retrograde)
    });
  }
  return map;
}

/**
 * Main AI evidence gate function.
 * Call this on any AI-generated text BEFORE returning to the client.
 */
export function validateAndSanitizeAIResponse(rawText, chartContext = null, options = {}) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return { 
      text: '', 
      isValid: false, 
      violations: ['Empty or non-string AI response'],
      sanitized: false,
      verifiedClaims: [],
      unsupportedClaims: [],
      contradictoryClaims: [],
      disclaimersAdded: false,
      claimExtractionStatus: 'COMPLETE',
      failureReason: 'EMPTY_INPUT',
      classifiedSentences: []
    };
  }
  
  // 1. Sanitize forbidden prediction language
  const { sanitized: textAfterLanguageScan, violations: sanitizationViolations } = sanitizeAIText(rawText);
  let workingText = textAfterLanguageScan;

  // 2. Safety scan (Health, Financial, Legal)
  const safetyViolations = scanSafety(workingText);

  // 3. Fabricated coordinate scan
  const { sanitized: textAfterFabricationScan, fabricated: fabricatedViolations } = scanFabricatedValues(workingText, chartContext);
  workingText = textAfterFabricationScan;

  // 4. Universal Sentence Segmentation and Classification
  const rawSentences = splitIntoSentences(rawText);
  const classifiedSentences = rawSentences.map((s, idx) => ({
    ...classifySentence(s),
    sentenceId: `SENTENCE_${idx + 1}`,
    index: idx
  }));

  // 5. Grounding verification against calculated chart data
  const verifiedClaims = [];
  const unsupportedClaims = [];
  const contradictoryClaims = [];
  const coveredSentenceIndices = new Set();

  const planetFacts = buildPlanetFactMap(chartContext);

  // Populate effective evidence nodes
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

  // Check classified sentences through claim firewall
  for (let i = 0; i < classifiedSentences.length; i++) {
    const cs = classifiedSentences[i];
    if (cs.sentenceType === CLAIM_TYPES.HEALTH) {
      unsupportedClaims.push({
        claimText: cs.sentence,
        sentenceId: cs.sentenceId,
        claimType: CLAIM_TYPES.HEALTH,
        reason: cs.reason,
        failure: "HEALTH_SAFETY_VIOLATION",
        status: "UNSUPPORTED_CLAIM"
      });
      coveredSentenceIndices.add(i);
    } else if (cs.sentenceType === CLAIM_TYPES.FINANCIAL && cs.safetyViolation) {
      unsupportedClaims.push({
        claimText: cs.sentence,
        sentenceId: cs.sentenceId,
        claimType: CLAIM_TYPES.FINANCIAL,
        reason: cs.reason,
        failure: "UNSUPPORTED_FINANCIAL_CERTAINTY",
        status: "UNSUPPORTED_CLAIM"
      });
      coveredSentenceIndices.add(i);
    } else if (cs.sentenceType === CLAIM_TYPES.LEGAL && cs.safetyViolation) {
      unsupportedClaims.push({
        claimText: cs.sentence,
        sentenceId: cs.sentenceId,
        claimType: CLAIM_TYPES.LEGAL,
        reason: cs.reason,
        failure: "UNSUPPORTED_LEGAL_CERTAINTY",
        status: "UNSUPPORTED_CLAIM"
      });
      coveredSentenceIndices.add(i);
    } else if (cs.sentenceType === CLAIM_TYPES.EMPIRICAL) {
      unsupportedClaims.push({
        claimText: cs.sentence,
        sentenceId: cs.sentenceId,
        claimType: CLAIM_TYPES.EMPIRICAL,
        reason: cs.reason,
        failure: "MISREPRESENTED_METRIC",
        status: "UNSUPPORTED_CLAIM"
      });
      coveredSentenceIndices.add(i);
    } else if (cs.sentenceType === CLAIM_TYPES.TIMING) {
      coveredSentenceIndices.add(i);
      if (cs.hasExactDate) {
        unsupportedClaims.push({
          claimText: cs.sentence,
          sentenceId: cs.sentenceId,
          claimType: CLAIM_TYPES.TIMING,
          reason: cs.reason,
          failure: "UNSUPPORTED_TIMING_PRECISION",
          status: "UNSUPPORTED_CLAIM"
        });
      } else {
        const hasTimingEvidence = effectiveNodes.some(n => n.type?.startsWith("DASHA") || n.type === "TIMING_WINDOW");
        if (!hasTimingEvidence) {
          unsupportedClaims.push({
            claimText: cs.sentence,
            sentenceId: cs.sentenceId,
            claimType: CLAIM_TYPES.TIMING,
            reason: "INSUFFICIENT_DATA: Timing claim requires candidate timing windows in chartContext",
            failure: "INSUFFICIENT_TIMING_EVIDENCE",
            status: "UNSUPPORTED_CLAIM"
          });
        } else {
          verifiedClaims.push({
            claimText: cs.sentence,
            sentenceId: cs.sentenceId,
            claimType: CLAIM_TYPES.TIMING,
            matchedFactor: "Verified timing window in chartContext",
            evidenceIds: effectiveNodes.filter(n => n.type?.startsWith("DASHA")).map(n => n.nodeId),
            status: "VERIFIED"
          });
        }
      }
    } else if (cs.sentenceType === CLAIM_TYPES.INTERPRETATION) {
      coveredSentenceIndices.add(i);
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
          sentenceId: cs.sentenceId,
          claimType: CLAIM_TYPES.INTERPRETATION,
          reason: `NO_INTERPRETIVE_RULE_IN_GRAPH: Interpretive claim for ${cs.domain} requires canonical evidence rule node in chartContext`,
          failure: "NO_INTERPRETIVE_RULE_IN_GRAPH",
          status: "UNSUPPORTED_CLAIM"
        });
      } else {
        verifiedClaims.push({
          claimText: cs.sentence,
          sentenceId: cs.sentenceId,
          claimType: CLAIM_TYPES.INTERPRETATION,
          matchedFactor: `Canonical rule grounding for ${cs.domain}`,
          evidenceIds: canonicalRuleNodes.map(n => n.nodeId || n.id),
          status: "VERIFIED"
        });
      }
    }
  }

  // 5A. Planet-to-house assertions (FACT)
  const houseRegex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(?:is\s+)?(?:placed\s+in|in|occupies)\s+(?:the\s+)?(?:house\s+)?(1[0-2]|[1-9])(?:st|nd|rd|th)?(?:\s+house)?/gi;
  let m;
  while ((m = houseRegex.exec(workingText)) !== null) {
    for (let i = 0; i < classifiedSentences.length; i++) {
      if (classifiedSentences[i].sentence.includes(m[0]) || m[0].includes(classifiedSentences[i].sentence)) {
        coveredSentenceIndices.add(i);
      }
    }
    const pName = normalizePlanetName(m[1]);
    const assertedHouse = parseInt(m[2], 10);
    const fact = planetFacts.get(pName);

    if (!fact || fact.house == null) {
      unsupportedClaims.push({
        claimText: m[0],
        claimType: CLAIM_TYPES.FACT,
        reason: `PLANET_NOT_FOUND_IN_CHART: Cannot verify ${pName}`,
        failure: "PLANET_NOT_FOUND_IN_CHART",
        status: 'UNSUPPORTED_CLAIM'
      });
    } else if (fact.house === assertedHouse) {
      const matchingEvId = Array.from(evidenceNodeIds).find(id => id.toLowerCase().includes(pName.toLowerCase()));
      if (!matchingEvId) {
        unsupportedClaims.push({
          claimText: m[0],
          claimType: CLAIM_TYPES.FACT,
          reason: `NO_EVIDENCE_NODE_IN_GRAPH: ${pName} in House ${fact.house} has no corresponding evidence node in chartContext`,
          failure: "NO_EVIDENCE_NODE_IN_GRAPH",
          status: 'UNSUPPORTED_CLAIM'
        });
      } else {
        verifiedClaims.push({
          claimText: m[0],
          claimType: CLAIM_TYPES.FACT,
          matchedFactor: `${pName} in House ${fact.house}`,
          evidenceIds: [matchingEvId],
          status: 'VERIFIED'
        });
      }
    } else {
      contradictoryClaims.push({
        claimText: m[0],
        claimType: CLAIM_TYPES.FACT,
        reason: `Calculated ${pName} is in House ${fact.house}, not House ${assertedHouse}`,
        failure: "CONTRADICTS_CALCULATED_CHART",
        status: 'CONTRADICTS_CALCULATED_CHART'
      });
    }
  }

  // 5B. Planet-to-sign assertions (FACT)
  const signsPattern = SIGN_NAMES.join('|');
  const signRegex = new RegExp(`(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\\s+(?:is\\s+)?(?:placed\\s+in\\s+|in\\s+)(${signsPattern})`, 'gi');
  let sm;
  while ((sm = signRegex.exec(workingText)) !== null) {
    for (let i = 0; i < classifiedSentences.length; i++) {
      if (classifiedSentences[i].sentence.includes(sm[0]) || sm[0].includes(classifiedSentences[i].sentence)) {
        coveredSentenceIndices.add(i);
      }
    }
    const pName = normalizePlanetName(sm[1]);
    const assertedSign = sm[2];
    const fact = planetFacts.get(pName);

    if (!fact || !fact.sign) {
      unsupportedClaims.push({
        claimText: sm[0],
        claimType: CLAIM_TYPES.FACT,
        reason: `PLANET_SIGN_NOT_FOUND_IN_CHART: Cannot verify sign for ${pName}`,
        failure: "PLANET_SIGN_NOT_FOUND_IN_CHART",
        status: 'UNSUPPORTED_CLAIM'
      });
    } else if (fact.sign.toLowerCase() === assertedSign.toLowerCase()) {
      const matchingEvId = Array.from(evidenceNodeIds).find(id =>
        id.toLowerCase().includes(pName.toLowerCase()) || id.toLowerCase().includes(fact.sign.toLowerCase())
      );
      if (!matchingEvId) {
        unsupportedClaims.push({
          claimText: sm[0],
          claimType: CLAIM_TYPES.FACT,
          reason: `NO_EVIDENCE_NODE_IN_GRAPH: ${pName} in ${fact.sign} has no corresponding evidence node in chartContext`,
          failure: "NO_EVIDENCE_NODE_IN_GRAPH",
          status: 'UNSUPPORTED_CLAIM'
        });
      } else {
        verifiedClaims.push({
          claimText: sm[0],
          claimType: CLAIM_TYPES.FACT,
          matchedFactor: `${pName} in ${fact.sign}`,
          evidenceIds: [matchingEvId],
          status: 'VERIFIED'
        });
      }
    } else {
      contradictoryClaims.push({
        claimText: sm[0],
        claimType: CLAIM_TYPES.FACT,
        reason: `Calculated ${pName} is in ${fact.sign}, not ${assertedSign}`,
        failure: "CONTRADICTS_CALCULATED_CHART",
        status: 'CONTRADICTS_CALCULATED_CHART'
      });
    }
  }

  // 5C. Dasha lord assertions (FACT)
  const dashaRegex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(Mahadasha|Antardasha|Dasha|Bhukti)/gi;
  const activeMdLord = chartContext?.currentDasha?.mahadashaLord || chartContext?.currentDasha?.lord || chartContext?.activeDasha?.lord || chartContext?.activeMdLord || null;
  const activeAdLord = chartContext?.currentDasha?.antardashaLord || chartContext?.currentDasha?.subLord || chartContext?.currentDasha?.antarDasha || chartContext?.activeDasha?.subLord || chartContext?.activeAdLord || null;
  let dm;
  while ((dm = dashaRegex.exec(workingText)) !== null) {
    for (let i = 0; i < classifiedSentences.length; i++) {
      if (classifiedSentences[i].sentence.includes(dm[0]) || dm[0].includes(classifiedSentences[i].sentence)) {
        coveredSentenceIndices.add(i);
      }
    }
    const pName = normalizePlanetName(dm[1]);
    const dashaType = dm[2].toLowerCase();

    let isLordActive = false;
    let dashaReason = '';

    if (activeMdLord && (dashaType.includes('maha') || dashaType === 'dasha')) {
      if (activeMdLord.toLowerCase() === pName.toLowerCase()) {
        isLordActive = true;
        dashaReason = `Active Mahadasha: ${pName}`;
      }
    }
    if (!isLordActive && activeAdLord && (dashaType.includes('antar') || dashaType.includes('bhukti') || dashaType === 'dasha')) {
      if (activeAdLord.toLowerCase() === pName.toLowerCase()) {
        isLordActive = true;
        dashaReason = `Active Antardasha: ${pName}`;
      }
    }

    if (!activeMdLord && !activeAdLord) {
      unsupportedClaims.push({
        claimText: dm[0],
        claimType: CLAIM_TYPES.FACT,
        reason: `ACTIVE_DASHA_NOT_CALCULATED: Cannot verify active dasha period for ${pName}`,
        failure: "ACTIVE_DASHA_NOT_CALCULATED",
        status: 'UNSUPPORTED_CLAIM'
      });
    } else if (!isLordActive) {
      contradictoryClaims.push({
        claimText: dm[0],
        claimType: CLAIM_TYPES.FACT,
        reason: `${pName} is not the active Mahadasha (${activeMdLord || 'none'}) or Antardasha (${activeAdLord || 'none'}) lord in calculated chart`,
        failure: "CONTRADICTS_CALCULATED_CHART",
        status: 'CONTRADICTS_CALCULATED_CHART'
      });
    } else {
      const matchingEvId = Array.from(evidenceNodeIds).find(id =>
        id.toLowerCase().includes(pName.toLowerCase()) || id.toLowerCase().includes('dasha')
      );
      if (!matchingEvId) {
        unsupportedClaims.push({
          claimText: dm[0],
          claimType: CLAIM_TYPES.FACT,
          reason: `NO_EVIDENCE_NODE_IN_GRAPH: Active ${pName} Dasha has no corresponding evidence node in chartContext`,
          failure: "NO_EVIDENCE_NODE_IN_GRAPH",
          status: 'UNSUPPORTED_CLAIM'
        });
      } else {
        verifiedClaims.push({
          claimText: dm[0],
          claimType: CLAIM_TYPES.FACT,
          matchedFactor: dashaReason,
          evidenceIds: [matchingEvId],
          status: 'VERIFIED'
        });
      }
    }
  }

  // Substantive Sentence Coverage Gate:
  // Every substantive declarative statement must produce at least one verifiable claim or violation.
  const uncoveredSubstantiveSentenceIds = [];
  for (let i = 0; i < classifiedSentences.length; i++) {
    const cs = classifiedSentences[i];
    if (cs.substantive && !coveredSentenceIndices.has(i)) {
      const sentenceId = cs.sentenceId || `SENTENCE_${i + 1}`;
      uncoveredSubstantiveSentenceIds.push(sentenceId);
      unsupportedClaims.push({
        claimText: cs.sentence,
        sentenceId,
        claimType: cs.sentenceType || CLAIM_TYPES.GENERAL,
        reason: `UNCOVERED_SUBSTANTIVE_SENTENCE: Substantive sentence "${cs.sentence}" is not grounded by canonical evidence rule nodes or chart facts`,
        failure: "UNCOVERED_SUBSTANTIVE_SENTENCE",
        status: "UNSUPPORTED_CLAIM"
      });
    }
  }

  // Redact contradictory and unsupported claims from narrative text
  for (const c of contradictoryClaims) {
    if (c.claimText && workingText.includes(c.claimText)) {
      workingText = workingText.split(c.claimText).join(`[REMOVED: CONTRADICTORY CLAIM (${c.reason})]`);
    }
  }
  for (const u of unsupportedClaims) {
    if (u.claimText && workingText.includes(u.claimText)) {
      workingText = workingText.split(u.claimText).join(`[REMOVED: UNSUPPORTED CLAIM (${u.reason})]`);
    }
  }

  // Statutory disclaimers
  let finalText = workingText;
  const hasHealthContent = safetyViolations.some(v => v.type === 'HEALTH_DIAGNOSTIC');
  const hasFinancialContent = safetyViolations.some(v => v.type === 'FINANCIAL_ADVISORY');
  const hasLegalContent = safetyViolations.some(v => v.type === 'LEGAL_ADVISORY');

  if (hasHealthContent) {
    finalText += '\n\n⚠️ Statutory Notice: Traditional astrological interpretation only. This does NOT constitute medical diagnosis, treatment recommendation, or health advice. Always consult qualified medical professionals.';
  }
  if (hasFinancialContent) {
    finalText += '\n\n⚠️ Statutory Notice: Traditional astrological interpretation only. This does NOT constitute financial advice, investment recommendation, or trading guidance. Consult qualified financial advisors.';
  }
  if (hasLegalContent) {
    finalText += '\n\n⚠️ Statutory Notice: Traditional astrological interpretation only. This does NOT constitute legal advice or formal attorney counsel. Always consult qualified legal professionals for legal matters.';
  }

  const substantiveSentences = classifiedSentences.filter(s => s.substantive);
  const totalClaims = verifiedClaims.length + unsupportedClaims.length + contradictoryClaims.length;

  // Requirement 3.3 Fail-Closed Rule:
  let claimExtractionStatus = "COMPLETE";
  let failureReason = null;
  let isValid = safetyViolations.length === 0 &&
                fabricatedViolations.length === 0 &&
                contradictoryClaims.length === 0 &&
                unsupportedClaims.length === 0;

  if (uncoveredSubstantiveSentenceIds.length > 0) {
    isValid = false;
    failureReason = "UNCOVERED_SUBSTANTIVE_SENTENCES";
  } else if (substantiveSentences.length > 0 && totalClaims === 0) {
    claimExtractionStatus = "INCOMPLETE";
    isValid = false;
    failureReason = "SUBSTANTIVE_CLAIM_EXTRACTION_FAILED";
  } else if (!isValid) {
    const firstFailure = unsupportedClaims.find(c => c.failure)?.failure ||
                         contradictoryClaims[0]?.failure ||
                         (safetyViolations[0]?.type) ||
                         "UNSUPPORTED_CLAIMS_DETECTED";
    failureReason = firstFailure;
  }

  return {
    text: finalText,
    isValid,
    violations: [
      ...sanitizationViolations,
      ...safetyViolations.map(v => `${v.type}: ${v.pattern}`),
      ...fabricatedViolations.map(v => `${v.type}: ${v.value}`),
      ...contradictoryClaims.map(c => `${c.status}: ${c.claimText} — ${c.reason}`),
      ...unsupportedClaims.map(u => `${u.status}: ${u.claimText} — ${u.reason}`)
    ],
    sanitized: sanitizationViolations.length > 0 ||
               fabricatedViolations.length > 0 ||
               contradictoryClaims.length > 0 ||
               unsupportedClaims.length > 0,
    verifiedClaims,
    unsupportedClaims,
    contradictoryClaims,
    disclaimersAdded: hasHealthContent || hasFinancialContent || hasLegalContent,
    claimExtractionStatus,
    failureReason,
    classifiedSentences,
    uncoveredSubstantiveSentenceIds
  };
}

export const verifyNarrativeEvidence = validateAndSanitizeAIResponse;
export const verifyAndSanitizeAiNarrative = validateAndSanitizeAIResponse;
