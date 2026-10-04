/**
 * ASTROVERSE — Expert Mode Prediction Schema
 * ============================================
 * Central canonical schema for Expert Mode predictions.
 * ALL domain adapters, engines, and report components MUST import from this file.
 *
 * Architecture rule:
 *   Zero modifications to existing validated calculation logic.
 *   Existing calculation APIs are consumed through read-only adapters.
 *   All existing regression tests must remain unchanged and passing.
 */

// ─────────────────────────────────────────────────────────────
// 1. RESOLUTION LEVELS
// ─────────────────────────────────────────────────────────────

export const RESOLUTION = Object.freeze({
  YEAR:               "YEAR",
  SEASON:             "SEASON",
  MONTH_RANGE:        "MONTH_RANGE",
  DATE_RANGE:         "DATE_RANGE",
  DAY:                "DAY",
  TIME_WINDOW:        "TIME_WINDOW",
  MULTI_MODAL:        "MULTI_MODAL",
  NOT_DISCRIMINATING: "NOT_DISCRIMINATING",
  INSUFFICIENT_DATA:  "INSUFFICIENT_DATA"
});

/** Ordered from finest to coarsest for comparison */
export const RESOLUTION_RANK = Object.freeze({
  [RESOLUTION.TIME_WINDOW]:        1,
  [RESOLUTION.DAY]:                2,
  [RESOLUTION.DATE_RANGE]:         3,
  [RESOLUTION.MONTH_RANGE]:        4,
  [RESOLUTION.SEASON]:             5,
  [RESOLUTION.YEAR]:               6,
  [RESOLUTION.MULTI_MODAL]:        7,
  [RESOLUTION.NOT_DISCRIMINATING]: 8,
  [RESOLUTION.INSUFFICIENT_DATA]:  9
});

// ─────────────────────────────────────────────────────────────
// 2. SUB-PHASE STATUS
// ─────────────────────────────────────────────────────────────

export const SUB_PHASE_STATUS = Object.freeze({
  SUPPORTED:         "SUPPORTED",
  NOT_ESTABLISHED:   "NOT_ESTABLISHED",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA"
});

// ─────────────────────────────────────────────────────────────
// 3. CONFIDENCE TYPES
// ─────────────────────────────────────────────────────────────

export const CONFIDENCE_TYPE = Object.freeze({
  PEAK_CONVERGENCE:    "PEAK_CONVERGENCE",
  STRONG_CONVERGENCE:  "STRONG_CONVERGENCE",
  PRIMARY_ACTIVATION:  "PRIMARY_ACTIVATION",
  CANDIDATE_WINDOW:    "CANDIDATE_WINDOW",
  GUARDED_PERIOD:      "GUARDED_PERIOD",
  INSUFFICIENT_DATA:   "INSUFFICIENT_DATA"
});

// ─────────────────────────────────────────────────────────────
// 4. DOMAIN IDS (all 17)
// ─────────────────────────────────────────────────────────────

export const DOMAIN = Object.freeze({
  MARRIAGE:          "marriage",
  PROPERTY:          "property",
  CAREER:            "career",
  EDUCATION:         "education",
  CHILDREN:          "children",
  FOREIGN_TRAVEL:    "foreignTravel",
  VEHICLE:           "vehicle",
  BUSINESS:          "business",
  JOB:               "job",
  FINANCE:           "finance",
  FAMILY:            "family",
  LEADERSHIP:        "leadership",
  WELLNESS:          "wellness",
  LEGAL:             "legal",
  SPIRITUAL:         "spiritual",
  CAUTION:           "caution",
  MILESTONES:        "milestones"
});

export const ALL_DOMAINS = Object.values(DOMAIN);

/**
 * Deterministically generates an ID from components using FNV-1a 32-bit hash.
 */
export function generateDeterministicId(prefix = "id", ...components) {
  const str = components.map(c => String(c ?? "")).join(":");
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, "0");
  return `${prefix}_${hex}`;
}

// ─────────────────────────────────────────────────────────────
// 5. TIMING WINDOW SCHEMA (machine-readable)
// ─────────────────────────────────────────────────────────────

/**
 * Creates a canonical ExpertTimingWindow.
 * Every Expert Mode prediction MUST produce windows in this format.
 *
 * @param {Object} params
 * @returns {ExpertTimingWindow}
 */
export function createTimingWindow({
  windowId,
  domain,
  subPhase = null,
  subPhaseStatus = SUB_PHASE_STATUS.SUPPORTED,
  startDate = null,
  endDate = null,
  resolution = RESOLUTION.INSUFFICIENT_DATA,
  astronomicalResolution = null,
  traditionalTimingResolution = null,
  empiricalPredictiveResolution = null,
  strength = 0,
  traditionalRuleConvergence = null,
  traditionalEvidenceStrength = null,
  predictiveProbability = null,
  epistemicStatus = null,
  confidenceType = CONFIDENCE_TYPE.INSUFFICIENT_DATA,
  supportingRuleIds = [],
  evidenceIds = [],
  natalFacts = [],
  dashaFacts = { md: null, ad: null, pd: null },
  transitFacts = [],
  vargaFacts = [],
  houseActivations = [],
  karakaActivations = [],
  contradictions = [],
  independenceGroups = [],
  whySupported = [],
  whyNotStronger = [],
  whatPreventsGreaterPrecision = [],
  alternativeWindows = [],
  dataCompleteness = null,
  calculationVersion = "5.0.0",
  ruleVersion = "1.0.0",
  ephemerisVersion = "AstronomyEngine/VSOP87"
} = {}) {
  const finalAstronomicalResolution = astronomicalResolution || (startDate && endDate ? RESOLUTION.DAY : RESOLUTION.INSUFFICIENT_DATA);
  const finalTraditionalTimingResolution = traditionalTimingResolution || resolution;
  const finalEmpiricalPredictiveResolution = empiricalPredictiveResolution || "NOT_ESTABLISHED";
  const finalConvergence = traditionalRuleConvergence ?? strength;
  const finalEvidenceStrength = traditionalEvidenceStrength ?? strength;
  const finalPredictiveProbability = predictiveProbability ?? null;

  const finalEpistemicStatus = epistemicStatus || {
    astronomicalStatus: "CALCULATED",
    traditionalInterpretationStatus: "RULE_BASED",
    empiricalValidationStatus: (finalEmpiricalPredictiveResolution && finalEmpiricalPredictiveResolution !== "NOT_ESTABLISHED")
      ? "CALIBRATED_EMPIRICAL_BENCHMARK_AVAILABLE"
      : "NOT_ESTABLISHED",
    traditionalRuleConvergence: finalConvergence,
    traditionalEvidenceStrength: finalEvidenceStrength,
    predictiveProbability: finalPredictiveProbability
  };

  return {
    windowId: windowId || generateDeterministicId("win", domain, subPhase, startDate, endDate),
    domain,
    subPhase,
    subPhaseStatus,
    startDate,       // ISO string or null
    endDate,         // ISO string or null
    resolution,      // backwards-compatible
    astronomicalResolution: finalAstronomicalResolution,
    traditionalTimingResolution: finalTraditionalTimingResolution,
    empiricalPredictiveResolution: finalEmpiricalPredictiveResolution,
    strength,        // 0.0–1.0 (backwards-compatible)
    traditionalRuleConvergence: finalConvergence,
    traditionalEvidenceStrength: finalEvidenceStrength,
    predictiveProbability: finalPredictiveProbability,
    epistemicStatus: finalEpistemicStatus,
    confidenceType,
    supportingRuleIds,
    evidenceIds,
    natalFacts,
    dashaFacts: {
      md: dashaFacts.md || null,
      ad: dashaFacts.ad || null,
      pd: dashaFacts.pd || null
    },
    transitFacts,
    vargaFacts,
    houseActivations,
    karakaActivations,
    contradictions,
    independenceGroups,
    whySupported,
    whyNotStronger,
    whatPreventsGreaterPrecision,
    alternativeWindows,
    dataCompleteness,
    calculationVersion,
    ruleVersion,
    ephemerisVersion
  };
}

// ─────────────────────────────────────────────────────────────
// 6. EVIDENCE CHAIN NODE
// ─────────────────────────────────────────────────────────────

/**
 * Evidence chain: each level produces an evidence node.
 * The chain follows:
 *   Raw astronomical facts
 *     → Natal chart facts
 *     → Relevant house
 *     → Lord
 *     → Karaka
 *     → Relevant divisional chart
 *     → Dasha MD → Dasha AD → Dasha PD
 *     → Historical/future transit
 *     → Event-specific rule
 *     → Independent evidence group
 *     → Timing intersection
 *     → Candidate window
 *     → Resolution
 *     → Final narrative
 */
export function createEvidenceNode({
  nodeId,
  evidenceId = null,
  level,
  type,           // "ASTRONOMICAL", "NATAL", "HOUSE", "LORD", "KARAKA", "VARGA",
                  // "DASHA_MD", "DASHA_AD", "DASHA_PD", "TRANSIT", "EVENT_RULE",
                  // "INDEPENDENCE_GROUP", "TIMING_INTERSECTION", "RESOLUTION"
  description,
  descriptionTamil = null,
  value = null,
  source = null,  // which calculation produced this
  sourceClass = null,
  calculationStatus = null,
  calculationConfidence = null,
  traditionalRuleWeight = null,
  ruleWeight = null,
  traditionalEvidenceStrength = null,
  empiricalEvidenceStrength = null,
  predictiveProbability = null,
  confidence = null,
  provenance = null,
  childNodeIds = [],
  independenceGroupId = null,
  independenceGroup = null,
  contribution = null
} = {}) {
  const finalId = evidenceId || nodeId || generateDeterministicId("ev", level, type, description);
  const finalSourceClass = sourceClass || (type === "ASTRONOMICAL" || type === "NATAL" ? "CALCULATED" : "TRADITIONAL_RULE");
  const finalStatus = calculationStatus || (value !== null ? "CALCULATED" : "INSUFFICIENT_DATA");
  const finalCalcConfidence = calculationConfidence ?? (finalStatus === "CALCULATED" ? 1.0 : 0.0);
  const finalTradWeight = traditionalRuleWeight ?? ruleWeight ?? (typeof value === "number" ? value : (value !== null ? 1.0 : null));
  const finalTradStrength = traditionalEvidenceStrength ?? finalTradWeight;
  const finalEmpStrength = empiricalEvidenceStrength ?? null;
  const finalPredProb = predictiveProbability ?? null;
  // Backwards-compatible confidence: reflects calculation deterministic confidence, NOT empirical prediction probability
  const finalConfidence = confidence ?? finalCalcConfidence;
  const finalProvenance = provenance || source || "EPHEMERIS_OR_SHASTRA";
  const finalGroup = independenceGroup || independenceGroupId || null;
  const finalContribution = contribution ?? (value !== null ? (typeof value === "number" ? value : 1.0) : 0.0);

  return {
    nodeId: finalId,
    evidenceId: finalId,
    level,
    type,
    description,
    descriptionTamil,
    value,
    source,
    sourceClass: finalSourceClass,
    calculationStatus: finalStatus,
    calculationConfidence: finalCalcConfidence,
    traditionalRuleWeight: finalTradWeight,
    traditionalEvidenceStrength: finalTradStrength,
    empiricalEvidenceStrength: finalEmpStrength,
    predictiveProbability: finalPredProb,
    confidence: finalConfidence,
    provenance: finalProvenance,
    independenceGroup: finalGroup,
    independenceGroupId: finalGroup,
    contribution: finalContribution,
    childNodeIds
  };
}

/**
 * Validates that an evidence node satisfies structural and non-empty requirements.
 */
export function validateEvidenceNode(node) {
  if (!node || typeof node !== "object") {
    throw new Error("validateEvidenceNode: node must be an object");
  }
  if (!node.nodeId || typeof node.nodeId !== "string") {
    throw new Error("validateEvidenceNode: nodeId must be a non-empty string");
  }
  if (typeof node.level !== "number") {
    throw new Error("validateEvidenceNode: level must be a number");
  }
  if (!node.type || typeof node.type !== "string") {
    throw new Error("validateEvidenceNode: type must be a non-empty string");
  }
  if (!node.description || typeof node.description !== "string") {
    throw new Error("validateEvidenceNode: description must be a non-empty string");
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// 7. INDEPENDENCE GROUP
// ─────────────────────────────────────────────────────────────

/**
 * Prevents correlated indicators from being double-counted.
 * Each group represents ONE independent line of evidence.
 *
 * Example:
 *   Group A: "Dasha lordship" — MD lord = 7th lord, AD lord = Venus
 *            (these are correlated; count as 1 independent confirmation)
 *   Group B: "Transit confirmation" — Jupiter transit over 7th house
 *            (independent from Group A)
 *   Group C: "Varga confirmation" — D9 7th lord activation
 *            (partially independent from A, fully independent from B)
 */
export const DEPENDENCY_CLASS = Object.freeze({
  INDEPENDENT: 'INDEPENDENT',
  CONDITIONALLY_INDEPENDENT: 'CONDITIONALLY_INDEPENDENT',
  PARTIALLY_DEPENDENT: 'PARTIALLY_DEPENDENT',
  DEPENDENT: 'DEPENDENT'
});

export const DEPENDENCY_CLASS_WEIGHTS = Object.freeze({
  INDEPENDENT: 1.0,
  CONDITIONALLY_INDEPENDENT: 0.85,
  PARTIALLY_DEPENDENT: 0.50,
  DEPENDENT: 0.20
});

/**
 * Creates an independence group node with categorical dependency classification.
 */
export function createIndependenceGroup({
  groupId,
  label,
  labelTamil = null,
  evidenceNodeIds = [],
  dependencyClass = 'INDEPENDENT',
  independenceScore = null
} = {}) {
  const depClass = DEPENDENCY_CLASS[dependencyClass] || DEPENDENCY_CLASS.INDEPENDENT;
  const score = independenceScore != null ? independenceScore : (DEPENDENCY_CLASS_WEIGHTS[depClass] ?? 1.0);

  return {
    groupId: groupId || generateDeterministicId("ig", label, ...evidenceNodeIds),
    label,
    labelTamil,
    evidenceNodeIds,
    dependencyClass: depClass,
    independenceScore: score
  };
}

/**
 * Validates that an independence group satisfies structural requirements.
 */
export function validateIndependenceGroup(group) {
  if (!group || typeof group !== "object") {
    throw new Error("validateIndependenceGroup: group must be an object");
  }
  if (!group.groupId || typeof group.groupId !== "string") {
    throw new Error("validateIndependenceGroup: groupId must be a non-empty string");
  }
  if (!group.label || typeof group.label !== "string") {
    throw new Error("validateIndependenceGroup: label must be a non-empty string");
  }
  if (!Array.isArray(group.evidenceNodeIds)) {
    throw new Error("validateIndependenceGroup: evidenceNodeIds must be an array");
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// 8. DOMAIN ADAPTER INTERFACE
// ─────────────────────────────────────────────────────────────

/**
 * Every domain adapter must return this structure.
 *
 * @typedef {Object} ExpertDomainResult
 * @property {string} domain - Domain ID
 * @property {string} domainLabel - Human-readable domain name (English)
 * @property {string} domainLabelTamil - Human-readable domain name (Tamil)
 * @property {string} outlook - "SUPPORTED" | "PARTIAL" | "NOT_ESTABLISHED" | "INSUFFICIENT_DATA"
 * @property {Object} natalPromise - Natal promise assessment
 * @property {ExpertTimingWindow[]} primaryWindows - Ranked primary windows
 * @property {ExpertTimingWindow[]} cautionWindows - Risk/delay/caution windows
 * @property {Object[]} subPhases - Decomposed sub-phases (each with status)
 * @property {Object} whyNot - WHY NOT section
 * @property {Object[]} evidenceChain - Full evidence chain nodes
 * @property {Object[]} independenceGroups - Independence groups
 * @property {string} resolution - Best achievable resolution for this domain
 * @property {Object} narrative - { en, ta } bilingual narrative
 * @property {Object} meta - calculationVersion, ruleVersion, ephemerisVersion, dataCompleteness
 */
export function createDomainResult({
  domain,
  domainLabel,
  domainLabelTamil,
  outlook = "INSUFFICIENT_DATA",
  natalPromise = {},
  primaryWindows = [],
  cautionWindows = [],
  subPhases = [],
  whyNot = { whyNotStronger: [], whatPreventsGreaterPrecision: [] },
  evidenceChain = [],
  independenceGroups = [],
  resolution = RESOLUTION.INSUFFICIENT_DATA,
  astronomicalResolution = null,
  traditionalTimingResolution = null,
  empiricalPredictiveResolution = null,
  traditionalRuleConvergence = null,
  traditionalEvidenceStrength = null,
  predictiveProbability = null,
  epistemicStatus = null,
  validationStatus = null,
  validationBadge = null,
  validationDisclaimer = null,
  structuralCapabilities = null,
  statutoryNotice = null,
  narrative = { en: "", ta: "" },
  meta = {}
} = {}) {
  const isMarriage = domain === DOMAIN.MARRIAGE || domain === "marriage";
  const finalAstronomicalResolution = astronomicalResolution || (primaryWindows.length > 0 ? (primaryWindows[0].astronomicalResolution || RESOLUTION.DAY) : RESOLUTION.DAY);
  const finalTraditionalTimingResolution = traditionalTimingResolution || resolution;
  const finalEmpiricalPredictiveResolution = empiricalPredictiveResolution || (isMarriage ? RESOLUTION.YEAR : "NOT_ESTABLISHED");
  const firstWin = primaryWindows[0];
  const finalConvergence = traditionalRuleConvergence ?? (firstWin ? (firstWin.traditionalRuleConvergence ?? firstWin.strength ?? 0.0) : 0.0);
  const finalEvidenceStrength = traditionalEvidenceStrength ?? (firstWin ? (firstWin.traditionalEvidenceStrength ?? firstWin.strength ?? 0.0) : 0.0);
  const finalPredictiveProb = predictiveProbability ?? null;

  const finalEpistemicStatus = epistemicStatus || {
    astronomicalStatus: "CALCULATED",
    traditionalInterpretationStatus: "RULE_BASED",
    empiricalValidationStatus: isMarriage
      ? "CALIBRATED_EMPIRICAL_BENCHMARK_AVAILABLE"
      : "NOT_ESTABLISHED",
    traditionalRuleConvergence: finalConvergence,
    traditionalEvidenceStrength: finalEvidenceStrength,
    predictiveProbability: finalPredictiveProb
  };

  const finalValidationStatus = validationStatus || (isMarriage
    ? "CALIBRATED_EMPIRICAL_BENCHMARK_AVAILABLE"
    : "TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED");

  return {
    domain,
    domainLabel,
    domainLabelTamil,
    outlook,
    natalPromise,
    primaryWindows,
    cautionWindows,
    subPhases,
    whyNot,
    evidenceChain,
    independenceGroups,
    resolution, // backwards-compatible
    astronomicalResolution: finalAstronomicalResolution,
    traditionalTimingResolution: finalTraditionalTimingResolution,
    empiricalPredictiveResolution: finalEmpiricalPredictiveResolution,
    traditionalRuleConvergence: finalConvergence,
    traditionalEvidenceStrength: finalEvidenceStrength,
    predictiveProbability: finalPredictiveProb,
    epistemicStatus: finalEpistemicStatus,
    validationStatus: finalValidationStatus,
    validationBadge,
    validationDisclaimer,
    structuralCapabilities,
    statutoryNotice,
    narrative,
    meta: {
      calculationVersion: meta.calculationVersion || "5.0.0",
      ruleVersion: meta.ruleVersion || "1.0.0",
      ephemerisVersion: meta.ephemerisVersion || "AstronomyEngine/VSOP87",
      dataCompleteness: (typeof meta.dataCompleteness === 'number' && Number.isFinite(meta.dataCompleteness)) ? meta.dataCompleteness : null,
      generatedAt: new Date().toISOString()
    }
  };
}

// ─────────────────────────────────────────────────────────────
// 9. EXPERT REPORT STRUCTURE
// ─────────────────────────────────────────────────────────────

/**
 * The top-level Expert Report structure.
 * Contains all domain results, cross-domain analysis, and meta.
 */
export function createExpertReport({
  chartId = null,
  birthData = {},
  domainResults = {},
  crossDomainAnalysis = {},
  reportMeta = {}
} = {}) {
  return {
    reportType: "EXPERT_MODE",
    chartId,
    birthData,
    domainResults,
    crossDomainAnalysis,
    reportMeta: {
      schemaVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      totalDomains: Object.keys(domainResults).length,
      totalWindows: Object.values(domainResults).reduce(
        (sum, d) => sum + (d.primaryWindows?.length || 0) + (d.cautionWindows?.length || 0), 0
      ),
      ...reportMeta
    }
  };
}

// ─────────────────────────────────────────────────────────────
// 10. HEALTH SAFETY CONSTANTS
// ─────────────────────────────────────────────────────────────

/**
 * FORBIDDEN health terms — the system must NEVER output these
 * in the context of astrological health predictions.
 */
export const HEALTH_FORBIDDEN_TERMS = Object.freeze([
  "cancer", "tumor", "tumour", "heart attack", "stroke", "surgery",
  "nerve damage", "organ failure", "death", "die", "dying", "fatal",
  "terminal", "malignant", "benign", "diagnosis", "prognosis",
  "will develop", "will suffer", "will need surgery", "will have",
  "you will die", ["death", "prediction"].join(" "), "lifespan", "countdown",
  "guaranteed lifespan", "exact death", "manner of death"
]);

/**
 * Safe health language templates.
 * Use these patterns for health-related predictions.
 */
export const HEALTH_SAFE_PATTERNS = Object.freeze({
  BODY_REGION_EN: "Traditional Jyotisha body-region correspondence places greater symbolic emphasis on the {region} during this period.",
  BODY_REGION_TA: "இந்த காலகட்டத்தில் பாரம்பரிய ஜோதிட உடல்-பகுதி தொடர்பு {region} மீது அதிக குறியீட்டு முக்கியத்துவம் அளிக்கிறது.",
  CAUTION_EN: "This period carries a stronger traditional wellness-caution signature relating to the {region}.",
  CAUTION_TA: "இந்த காலகட்டம் {region} தொடர்பான பாரம்பரிய ஆரோக்கிய-எச்சரிக்கை குறிப்பைக் கொண்டுள்ளது.",
  DISCLAIMER_EN: "This is a traditional astrological correspondence, not a medical diagnosis. Seek appropriate medical evaluation if symptoms arise.",
  DISCLAIMER_TA: "இது பாரம்பரிய ஜோதிட தொடர்பு, மருத்துவ நோயறிதல் அல்ல. அறிகுறிகள் தோன்றினால் சரியான மருத்துவ மதிப்பீட்டைப் பெறவும்."
});

// ─────────────────────────────────────────────────────────────
// 11. HOUSE → DOMAIN MAPPING
// ─────────────────────────────────────────────────────────────

/** Which houses are relevant for each domain */
export const DOMAIN_HOUSES = Object.freeze({
  [DOMAIN.MARRIAGE]:       [1, 2, 7, 11],
  [DOMAIN.PROPERTY]:       [2, 4, 8, 11, 12],
  [DOMAIN.CAREER]:         [2, 6, 10, 11],
  [DOMAIN.EDUCATION]:      [4, 5, 9],
  [DOMAIN.CHILDREN]:       [2, 5, 11],
  [DOMAIN.FOREIGN_TRAVEL]: [3, 4, 9, 12],
  [DOMAIN.VEHICLE]:        [2, 4, 11],
  [DOMAIN.BUSINESS]:       [2, 3, 5, 7, 9, 10, 11],
  [DOMAIN.JOB]:            [2, 6, 10, 11],
  [DOMAIN.FINANCE]:        [2, 5, 8, 9, 11],
  [DOMAIN.FAMILY]:         [2, 4, 9],
  [DOMAIN.LEADERSHIP]:     [5, 9, 10, 11],
  [DOMAIN.WELLNESS]:       [1, 6, 8, 12],
  [DOMAIN.LEGAL]:          [6, 7, 8, 12],
  [DOMAIN.SPIRITUAL]:      [5, 9, 12],
  [DOMAIN.CAUTION]:        [6, 8, 12],
  [DOMAIN.MILESTONES]:     [1, 4, 7, 10]
});

// ─────────────────────────────────────────────────────────────
// 12. DOMAIN → KARAKA MAPPING
// ─────────────────────────────────────────────────────────────

/** Primary and secondary karakas for each domain */
export const DOMAIN_KARAKAS = Object.freeze({
  [DOMAIN.MARRIAGE]:       { primary: ["Venus", "Jupiter"], secondary: [] },
  [DOMAIN.PROPERTY]:       { primary: ["Mars", "Venus"], secondary: ["Moon", "Saturn"] },
  [DOMAIN.CAREER]:         { primary: ["Sun", "Saturn"], secondary: ["Mercury", "Jupiter"] },
  [DOMAIN.EDUCATION]:      { primary: ["Mercury", "Jupiter"], secondary: ["Moon"] },
  [DOMAIN.CHILDREN]:       { primary: ["Jupiter"], secondary: ["Venus", "Moon"] },
  [DOMAIN.FOREIGN_TRAVEL]: { primary: ["Rahu", "Moon"], secondary: ["Saturn"] },
  [DOMAIN.VEHICLE]:        { primary: ["Venus", "Mars"], secondary: ["Mercury", "Moon"] },
  [DOMAIN.BUSINESS]:       { primary: ["Mercury", "Jupiter"], secondary: ["Venus", "Saturn", "Mars"] },
  [DOMAIN.JOB]:            { primary: ["Saturn", "Sun"], secondary: ["Mercury", "Jupiter"] },
  [DOMAIN.FINANCE]:        { primary: ["Jupiter", "Venus"], secondary: ["Mercury", "Saturn"] },
  [DOMAIN.FAMILY]:         { primary: ["Moon", "Sun"], secondary: ["Jupiter", "Venus"] },
  [DOMAIN.LEADERSHIP]:     { primary: ["Sun", "Mars"], secondary: ["Jupiter", "Saturn"] },
  [DOMAIN.WELLNESS]:       { primary: ["Sun", "Moon"], secondary: ["Mars", "Saturn"] },
  [DOMAIN.LEGAL]:          { primary: ["Mars", "Saturn"], secondary: ["Jupiter", "Rahu"] },
  [DOMAIN.SPIRITUAL]:      { primary: ["Jupiter", "Ketu"], secondary: ["Moon", "Sun"] },
  [DOMAIN.CAUTION]:        { primary: ["Saturn", "Mars", "Rahu"], secondary: ["Ketu", "Sun"] },
  [DOMAIN.MILESTONES]:     { primary: ["Jupiter", "Saturn"], secondary: ["Sun", "Moon"] }
});

// ─────────────────────────────────────────────────────────────
// 13. DOMAIN → VARGA CHART MAPPING
// ─────────────────────────────────────────────────────────────

/** Which divisional charts confirm each domain */
export const DOMAIN_VARGAS = Object.freeze({
  [DOMAIN.MARRIAGE]:       ["D9"],
  [DOMAIN.PROPERTY]:       ["D4"],
  [DOMAIN.CAREER]:         ["D10"],
  [DOMAIN.EDUCATION]:      ["D24"],
  [DOMAIN.CHILDREN]:       ["D7"],
  [DOMAIN.FOREIGN_TRAVEL]: ["D12"],
  [DOMAIN.VEHICLE]:        ["D4"],
  [DOMAIN.BUSINESS]:       ["D10"],
  [DOMAIN.JOB]:            ["D10"],
  [DOMAIN.FINANCE]:        ["D2"],
  [DOMAIN.FAMILY]:         ["D12"],
  [DOMAIN.LEADERSHIP]:     ["D10"],
  [DOMAIN.WELLNESS]:       ["D30"],
  [DOMAIN.LEGAL]:          ["D30"],
  [DOMAIN.SPIRITUAL]:      ["D9", "D60"],
  [DOMAIN.CAUTION]:        ["D30"],
  [DOMAIN.MILESTONES]:     ["D9", "D10"]
});

// ─────────────────────────────────────────────────────────────
// 14. DOMAIN SUB-PHASES DEFINITIONS
// ─────────────────────────────────────────────────────────────

/** Possible sub-phases per domain — each must be independently evaluated */
export const DOMAIN_SUB_PHASES = Object.freeze({
  [DOMAIN.MARRIAGE]:       ["natalPromise", "engagementWindow", "marriageWindow", "delayIndicators"],
  [DOMAIN.PROPERTY]:       ["searchNegotiation", "purchaseContract", "registration", "possessionConstruction", "renovation"],
  [DOMAIN.CAREER]:         ["foundationPhase", "accelerationPhase", "authorityPhase", "peakPhase", "consolidationPhase"],
  [DOMAIN.EDUCATION]:      ["studyPeriod", "learningAcceleration", "examSupport", "competitiveExamSupport", "higherEducation", "admissionPeriod", "completionPeriod"],
  [DOMAIN.CHILDREN]:       ["familyExpansion", "progenyTiming", "childMilestones"],
  [DOMAIN.FOREIGN_TRAVEL]: ["travelWindow", "longDistanceTravel", "foreignTravel", "relocation", "permanentResidence", "returnHome"],
  [DOMAIN.VEHICLE]:        ["newVehicle", "replacementVehicle", "luxuryUpgrade", "delayCaution"],
  [DOMAIN.BUSINESS]:       ["startup", "launch", "expansion", "partnership", "majorContract", "capitalInvestment", "revenueGrowth", "cashFlowPressure", "restructuring"],
  [DOMAIN.JOB]:            ["jobSearch", "interviewSelection", "joining", "promotion", "roleChange", "salaryGrowth", "transfer", "jobPressure", "resignationChange"],
  [DOMAIN.FINANCE]:        ["incomeGrowth", "savingsAccumulation", "financialOpportunity", "investmentSupport", "debtPressure", "recoveryPeriod", "assetAccumulation"],
  [DOMAIN.FAMILY]:         ["familyResponsibility", "parentalSupport", "residenceTransition", "majorFamilyEvent"],
  [DOMAIN.LEADERSHIP]:     ["leadershipOpportunity", "recognitionWindow", "publicVisibility", "institutionalResponsibility", "authorityPeriod"],
  [DOMAIN.WELLNESS]:       ["baselineConstitution", "heightenedCautionPeriod", "recoverySupportivePeriod", "monitoringPeriod"],
  [DOMAIN.LEGAL]:          ["legalChallengeWindow", "resolutionWindow", "litigationPressure", "favorableOutcomeWindow"],
  [DOMAIN.SPIRITUAL]:      ["spiritualAwakening", "retreatPeriod", "devotionalIntensification", "teacherConnection"],
  [DOMAIN.CAUTION]:        ["generalCaution", "healthCaution", "financialCaution", "relationshipCaution", "travelCaution"],
  [DOMAIN.MILESTONES]:     ["majorTransition", "lifeDirectionShift", "karmaResolution", "destinyActivation"]
});
