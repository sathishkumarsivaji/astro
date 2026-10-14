/**
 * SKR ASTRO / ASTROVERSE — Versioned Domain Feature Registry
 * ==========================================================
 * Implements Phase 6 of the Empirical Validation Framework:
 * - Versioned candidate features per life event domain (MARRIAGE, CAREER, etc.)
 * - Explicit definitions, valid mathematical ranges, and missingness semantics
 * - Clear distinction between genuine numerical zero (CALCULATED_ZERO) and missing data (MISSING)
 * - Prohibits access to future event data or target labels
 * - Explicit counter-indications and calculation provenance
 */

export const FEATURE_SCHEMA_VERSION = "v3.0.0-audited";

export const FEATURE_STATE = Object.freeze({
  CALCULATED_ZERO: "CALCULATED_ZERO",       // Genuinely evaluated and confirmed zero (e.g. 0 bindus or 0 aspect strength)
  CALCULATED_NONZERO: "CALCULATED_NONZERO", // Genuinely evaluated and present (> 0)
  MISSING: "MISSING",                       // Required underlying data (e.g. exact birth time or longitude) was absent
  NOT_APPLICABLE: "NOT_APPLICABLE",         // Construct not applicable for subject or inquiry
  CALCULATION_ERROR: "CALCULATION_ERROR"    // Computation encountered an error or non-finite state
});

export const MARRIAGE_FEATURE_REGISTRY = Object.freeze([
  {
    id: "DASHA_7TH_LORD",
    name: "Operating Dasha/Antardasha Lord Connection to 7th House",
    domain: "MARRIAGE",
    description: "Evaluates whether active Vimshottari Mahadasha or Antardasha lord owns, occupies, or aspects the 7th house.",
    validRange: [0.0, 1.0],
    missingSemantics: FEATURE_STATE.MISSING,
    source: "astronomy/dashaEngine.js + astroEngine.js",
    prohibitsFutureEventData: true,
    isCounterIndication: false,
    version: FEATURE_SCHEMA_VERSION
  },
  {
    id: "TRANSIT_JUPITER_7TH",
    name: "Transiting Jupiter Aspect or Conjunction on 7th House / Venus",
    domain: "MARRIAGE",
    description: "Checks whether transiting Jupiter aspects or conjoins natal 7th house cusp, 7th lord, or natal Venus within orb.",
    validRange: [0.0, 1.0],
    missingSemantics: FEATURE_STATE.MISSING,
    source: "astroEngine.js:calculateTransitAspects",
    prohibitsFutureEventData: true,
    isCounterIndication: false,
    version: FEATURE_SCHEMA_VERSION
  },
  {
    id: "TRANSIT_SATURN_7TH",
    name: "Transiting Saturn Aspect / Affliction on 7th House",
    domain: "MARRIAGE",
    description: "Checks whether transiting Saturn afflicts or delays the 7th house, 7th lord, or Venus by 3rd, 7th, or 10th aspect.",
    validRange: [0.0, 1.0],
    missingSemantics: FEATURE_STATE.MISSING,
    source: "astroEngine.js:calculateTransitAspects",
    prohibitsFutureEventData: true,
    isCounterIndication: true, // Delay/Obstruction indicator
    version: FEATURE_SCHEMA_VERSION
  },
  {
    id: "D9_NAVAMSHA_SUPPORT",
    name: "D9 Navamsha Dignity of 7th Lord / Venus",
    domain: "MARRIAGE",
    description: "Assesses whether natal 7th lord and Venus are well-placed in the D9 Navamsha (exalted, own sign, or vargottama).",
    validRange: [0.0, 1.0],
    missingSemantics: FEATURE_STATE.MISSING,
    source: "astrology/divisionalCharts.js:calculateD9",
    prohibitsFutureEventData: true,
    isCounterIndication: false,
    version: FEATURE_SCHEMA_VERSION
  },
  {
    id: "VENUS_NATAL_PROMISE",
    name: "Natal Venus Dignity & 7th House Occupants",
    domain: "MARRIAGE",
    description: "Calculates static natal dignity of Venus (shadbala / sign status) and benefic influence on 7th bhava.",
    validRange: [0.0, 1.0],
    missingSemantics: FEATURE_STATE.MISSING,
    source: "astroEngine.js:calculatePlanetaryPositions",
    prohibitsFutureEventData: true,
    isCounterIndication: false,
    version: FEATURE_SCHEMA_VERSION
  },
  {
    id: "ASHTAKAVARGA_7TH_SAV",
    name: "7th House Sarvashtakavarga (SAV) Bindus",
    domain: "MARRIAGE",
    description: "Determines whether 7th sign in Sarvashtakavarga has adequate benefic bindus (>= 28).",
    validRange: [0.0, 56.0],
    missingSemantics: FEATURE_STATE.MISSING,
    source: "astroEngine.js:calculateClassicalAshtakavarga",
    prohibitsFutureEventData: true,
    isCounterIndication: false,
    version: FEATURE_SCHEMA_VERSION
  }
]);

export const CAREER_FEATURE_REGISTRY = Object.freeze([
  {
    id: "DASHA_10TH_LORD",
    name: "Operating Dasha/Antardasha Lord Connection to 10th House",
    domain: "CAREER",
    description: "Evaluates whether operating dasha lord owns, occupies, or aspects the 10th house or Sun.",
    validRange: [0.0, 1.0],
    missingSemantics: FEATURE_STATE.MISSING,
    source: "astronomy/dashaEngine.js",
    prohibitsFutureEventData: true,
    isCounterIndication: false,
    version: FEATURE_SCHEMA_VERSION
  },
  {
    id: "TRANSIT_SATURN_10TH",
    name: "Transiting Saturn Aspect / Conjunction with 10th House",
    domain: "CAREER",
    description: "Transiting Saturn aspect on 10th house indicating structural career milestone or elevated responsibility.",
    validRange: [0.0, 1.0],
    missingSemantics: FEATURE_STATE.MISSING,
    source: "astroEngine.js:calculateTransitAspects",
    prohibitsFutureEventData: true,
    isCounterIndication: false,
    version: FEATURE_SCHEMA_VERSION
  },
  {
    id: "D10_DASHAMSHA_STRENGTH",
    name: "D10 Dashamsha Dignity of 10th Lord",
    domain: "CAREER",
    description: "Evaluates D10 placement and dignity of natal 10th lord.",
    validRange: [0.0, 1.0],
    missingSemantics: FEATURE_STATE.MISSING,
    source: "astrology/divisionalCharts.js:calculateD10",
    prohibitsFutureEventData: true,
    isCounterIndication: false,
    version: FEATURE_SCHEMA_VERSION
  }
]);

export const DOMAIN_FEATURE_REGISTRIES = Object.freeze({
  MARRIAGE: MARRIAGE_FEATURE_REGISTRY,
  CAREER: CAREER_FEATURE_REGISTRY
});

/**
 * Retrieves the feature registry list for a given event domain.
 */
export function getDomainFeatures(domain = "MARRIAGE") {
  const d = String(domain || "MARRIAGE").toUpperCase().trim();
  return DOMAIN_FEATURE_REGISTRIES[d] || MARRIAGE_FEATURE_REGISTRY;
}

/**
 * Validates a feature value and resolves its state, strictly differentiating
 * genuine numerical zero from missing or non-applicable values.
 */
export function resolveFeatureValueState(featureDef, rawValue) {
  if (rawValue === undefined || rawValue === null) {
    return {
      value: null,
      state: FEATURE_STATE.MISSING,
      isValid: false
    };
  }

  if (rawValue === "NOT_APPLICABLE") {
    return {
      value: null,
      state: FEATURE_STATE.NOT_APPLICABLE,
      isValid: false
    };
  }

  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    return {
      value: null,
      state: FEATURE_STATE.CALCULATION_ERROR,
      isValid: false
    };
  }

  // Check valid range
  if (featureDef && Array.isArray(featureDef.validRange)) {
    const [min, max] = featureDef.validRange;
    if (rawValue < min || rawValue > max) {
      return {
        value: rawValue,
        state: FEATURE_STATE.CALCULATION_ERROR,
        isValid: false,
        error: `Value ${rawValue} outside valid range [${min}, ${max}]`
      };
    }
  }

  // Genuine numerical zero
  if (rawValue === 0.0) {
    return {
      value: 0.0,
      state: FEATURE_STATE.CALCULATED_ZERO,
      isValid: true
    };
  }

  // Genuine non-zero value
  return {
    value: rawValue,
    state: FEATURE_STATE.CALCULATED_NONZERO,
    isValid: true
  };
}

/**
 * Audits a complete feature map for a domain to ensure zero future data leakage
 * and complete schema compliance.
 */
export function auditFeatureMap(featureMap = {}, domain = "MARRIAGE") {
  const registry = getDomainFeatures(domain);
  const auditReport = {
    domain,
    featureCount: registry.length,
    validCount: 0,
    missingCount: 0,
    errorCount: 0,
    features: {},
    leakageCheckPassed: true
  };

  for (const def of registry) {
    const rawVal = featureMap[def.id];
    const resolved = resolveFeatureValueState(def, rawVal);
    auditReport.features[def.id] = resolved;

    if (resolved.isValid) {
      auditReport.validCount++;
    } else if (resolved.state === FEATURE_STATE.MISSING) {
      auditReport.missingCount++;
    } else {
      auditReport.errorCount++;
    }
  }

  // Anti-leakage: verify no future event dates or target outcome variables exist in feature keys
  const BANNED_LEAKAGE_KEYS = [
    "actualEventDate", "actualEventAge", "actualDate", "marriageDate",
    "eventOccurred", "targetLabel", "isEvent", "groundTruth"
  ];
  for (const key of Object.keys(featureMap)) {
    if (BANNED_LEAKAGE_KEYS.some(banned => key.toLowerCase().includes(banned.toLowerCase()))) {
      auditReport.leakageCheckPassed = false;
      auditReport.leakageViolation = `LEAKAGE_DETECTED: Feature map contains forbidden target/outcome key '${key}'`;
      break;
    }
  }

  return auditReport;
}
