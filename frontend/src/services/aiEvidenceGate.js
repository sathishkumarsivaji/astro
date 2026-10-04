/**
 * ASTROVERSE — AI Evidence Verification & Epistemic Safety Gate
 * ==============================================================
 * Upgrades AI narrative generation from simple lexical sanitization to a
 * formal Evidence-Backed Verification Pipeline.
 *
 * Core Principles:
 * 1. Claim -> Evidence IDs -> VERIFIED vs UNSUPPORTED_CLAIM.
 * 2. Every astrological placement asserted (planet in house, planet in sign,
 *    dasha lord, transit trigger) MUST map to calculated astronomical chart facts.
 * 3. Misleading fatalistic claims ("exact prediction", "guaranteed date",
 *    "certain event", "100% accuracy") are strictly prohibited and sanitized.
 * 4. Medical diagnoses, disease prediction, and mortality/lifespan claims are blocked.
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
 * Normalizes planet name to capitalized format (e.g. "jupiter" -> "Jupiter")
 */
function normalizePlanetName(name) {
  if (!name) return "";
  const lower = name.toLowerCase();
  const match = PLANET_NAMES.find(p => p.toLowerCase() === lower);
  return match || name;
}

/**
 * Extracts planet-to-house assertions from text.
 * E.g. "Jupiter in the 10th house", "Sun is placed in 1st house", "Saturn in House 7"
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
 * E.g. "Jupiter in Aries", "Venus in Taurus", "Moon placed in Cancer"
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
 * E.g. "Jupiter Mahadasha", "Saturn Dasha", "Venus Antardasha"
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
 * the authentic evidence graph and calculated chart facts.
 *
 * @param {string} narrative - Raw text generated by AI / LLM
 * @param {Object} chartContext - Calculated chart facts (planets, houses, dashaTable, evidenceNodes)
 * @param {Object} [options]
 * @param {boolean} [options.strictGrounding=false] - If true, replaces unsupported claims with notice
 * @param {string} [options.lang="en"] - "en" or "ta"
 * @returns {Object} Structured verification result
 */
export function verifyAndSanitizeAiNarrative(narrative, chartContext = null, options = {}) {
  if (!narrative || typeof narrative !== "string") {
    return {
      isValid: true,
      sanitizedNarrative: "",
      verifiedClaims: [],
      unsupportedClaims: [],
      sanitizedViolations: [],
      epistemicAudit: {
        totalClaims: 0,
        verifiedCount: 0,
        unsupportedCount: 0,
        groundingRate: 1.0,
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

  // 4. Grounding verification against calculated chart data
  const verifiedClaims = [];
  const unsupportedClaims = [];

  const planetFacts = buildPlanetFactMap(chartContext);

  // Populate effective evidence nodes: respect provided nodes or build from calculated chart
  let effectiveNodes = Array.isArray(chartContext?.evidenceNodes)
    ? chartContext.evidenceNodes
    : (Array.isArray(chartContext?.evidenceIds) ? chartContext.evidenceIds.map(id => ({ nodeId: id })) : []);

  if (effectiveNodes.length === 0 && Array.isArray(chartContext?.planets)) {
    const autoNodes = [];
    for (const p of chartContext.planets) {
      if (p && p.name) {
        if (p.house != null) {
          autoNodes.push({ nodeId: `EV_PLANET_${p.name.toUpperCase()}_H${p.house}`, type: 'HOUSE', description: `${p.name} in House ${p.house}` });
        }
        if (p.sign) {
          autoNodes.push({ nodeId: `EV_PLANET_${p.name.toUpperCase()}_${p.sign.toUpperCase()}`, type: 'SIGN', description: `${p.name} in ${p.sign}` });
        }
      }
    }
    if (chartContext?.currentDasha?.lord) {
      autoNodes.push({ nodeId: `EV_DASHA_${chartContext.currentDasha.lord.toUpperCase()}`, type: 'DASHA_MD', description: `Active Mahadasha: ${chartContext.currentDasha.lord}` });
    }
    if (chartContext?.currentDasha?.subLord || chartContext?.currentDasha?.antarDasha) {
      const antar = chartContext.currentDasha.subLord || chartContext.currentDasha.antarDasha;
      autoNodes.push({ nodeId: `EV_DASHA_${antar.toUpperCase()}`, type: 'DASHA_AD', description: `Active Antardasha: ${antar}` });
    }
    effectiveNodes = autoNodes;
  }

  const evidenceNodeIds = new Set(
    effectiveNodes.map(n => n.nodeId || n.evidenceId || n.id).filter(Boolean)
  );

  // Check Planet-in-House assertions
  const houseAssertions = extractPlanetHouseAssertions(processedText);
  for (const assertion of houseAssertions) {
    const fact = planetFacts.get(assertion.planet);
    if (!fact || fact.house == null) {
      unsupportedClaims.push({
        claimText: assertion.fullText,
        reason: `PLANET_NOT_FOUND_IN_CHART: Cannot verify ${assertion.planet}`,
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
          reason: `NO_EVIDENCE_NODE_IN_GRAPH: ${fact.name} in House ${fact.house} has no corresponding evidence node in chartContext`,
          status: "UNSUPPORTED_CLAIM"
        });
      } else {
        verifiedClaims.push({
          claimText: assertion.fullText,
          matchedFactor: `${fact.name} in House ${fact.house}`,
          evidenceIds: evIds,
          status: "VERIFIED"
        });
      }
    } else {
      unsupportedClaims.push({
        claimText: assertion.fullText,
        reason: `CONTRADICTS_CALCULATED_CHART: Calculated ${fact.name} is in House ${fact.house}, not House ${assertion.house}`,
        status: "UNSUPPORTED_CLAIM"
      });
    }
  }

  // Check Planet-in-Sign assertions
  const signAssertions = extractPlanetSignAssertions(processedText);
  for (const assertion of signAssertions) {
    const fact = planetFacts.get(assertion.planet);
    if (!fact || !fact.sign) {
      unsupportedClaims.push({
        claimText: assertion.fullText,
        reason: `PLANET_SIGN_NOT_FOUND_IN_CHART: Cannot verify sign for ${assertion.planet}`,
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
          reason: `NO_EVIDENCE_NODE_IN_GRAPH: ${fact.name} in ${fact.sign} has no corresponding evidence node in chartContext`,
          status: "UNSUPPORTED_CLAIM"
        });
      } else {
        verifiedClaims.push({
          claimText: assertion.fullText,
          matchedFactor: `${fact.name} in ${fact.sign}`,
          evidenceIds: evIds,
          status: "VERIFIED"
        });
      }
    } else {
      unsupportedClaims.push({
        claimText: assertion.fullText,
        reason: `CONTRADICTS_CALCULATED_CHART: Calculated ${fact.name} is in ${fact.sign}, not ${assertion.sign}`,
        status: "UNSUPPORTED_CLAIM"
      });
    }
  }

  // Check Dasha assertions
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
      if (!isLordVerified && Array.isArray(chartContext.candidateWindows)) {
        const inWindow = chartContext.candidateWindows.some(w =>
          (w.mahadashaLord && w.mahadashaLord.toLowerCase() === assertion.planet.toLowerCase()) ||
          (w.antardashaLord && w.antardashaLord.toLowerCase() === assertion.planet.toLowerCase()) ||
          (w.dashaLord && w.dashaLord.toLowerCase() === assertion.planet.toLowerCase())
        );
        if (inWindow) {
          isLordVerified = true;
          matchedReason = `${assertion.planet} governs evaluated candidate timing window`;
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
            reason: `NO_EVIDENCE_NODE_IN_GRAPH: Active ${assertion.planet} Dasha has no corresponding evidence node in chartContext`,
            status: "UNSUPPORTED_CLAIM"
          });
        } else {
          verifiedClaims.push({
            claimText: assertion.fullText,
            matchedFactor: matchedReason,
            evidenceIds: evIds,
            status: "VERIFIED"
          });
        }
      } else {
        unsupportedClaims.push({
          claimText: assertion.fullText,
          reason: `CONTRADICTS_CALCULATED_CHART: ${assertion.planet} is not verified in active or indicated dasha periods`,
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
  const groundingRate = totalClaims > 0 ? Number((verifiedClaims.length / totalClaims).toFixed(2)) : 1.0;
  const isValid = violations.length === 0 && unsupportedClaims.length === 0;

  return {
    isValid,
    sanitizedNarrative: processedText,
    verifiedClaims,
    unsupportedClaims,
    sanitizedViolations: violations,
    epistemicAudit: {
      totalClaims,
      verifiedCount: verifiedClaims.length,
      unsupportedCount: unsupportedClaims.length,
      groundingRate,
      epistemicStatus: {
        astronomicalStatus: "CALCULATED",
        traditionalInterpretationStatus: "RULE_BASED",
        empiricalValidationStatus: "TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED"
      }
    }
  };
}
