/**
 * ASTROVERSE — Official Capability & Feature Registry
 *
 * Epistemically declares the exact development and validation status of every
 * feature across the platform:
 * - IMPLEMENTED: Fully backed by authoritative calculation engines and UI.
 * - EXPERIMENTAL: Research / lab prototype with synthetic calibration controls.
 * - PLANNED: On the architectural roadmap; strictly not advertised as computed.
 */

export const FEATURE_STATUS = Object.freeze({
  IMPLEMENTED: "IMPLEMENTED",
  EXPERIMENTAL: "EXPERIMENTAL",
  PLANNED: "PLANNED"
});

export const FEATURE_REGISTRY = Object.freeze({
  // 1. ASTRONOMICAL COMPUTATION LAYER
  "ephemeris_swiss_benchmark": {
    id: "ephemeris_swiss_benchmark",
    name: "Independent Reference Benchmark Verification Suite (pyswisseph 2.10.03)",
    category: "ASTRONOMY",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Multi-epoch verification of planetary longitudes, nodes, angles against pyswisseph analytical reference."
  },
  "planetary_ephemeris_j2000": {
    id: "planetary_ephemeris_j2000",
    name: "Analytical Planetary Ephemeris (Sun through Pluto)",
    category: "ASTRONOMY",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "High-precision geocentric ecliptic coordinates and speeds using Astronomy Engine."
  },
  "lunar_node_models": {
    id: "lunar_node_models",
    name: "Dual Lunar Node Models (Mean & Osculating True Node)",
    category: "ASTRONOMY",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Full user-selectable support for Chapront Mean Node and Jean Meeus Osculating True Node."
  },
  "tropical_sayana_engine": {
    id: "tropical_sayana_engine",
    name: "Tropical / Sayana Western Astrology Engine",
    category: "ASTRONOMY",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "0° Aries tied strictly to Vernal Equinox with Ptolemaic aspects, orbs, and Western dignities."
  },

  // 2. AYANAMSHA SYSTEMS
  "ayanamsha_lahiri": {
    id: "ayanamsha_lahiri",
    name: "Lahiri / Chitrapaksha Ayanamsha",
    category: "AYANAMSHA",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Indian National Calendar standard (Spica at 180°)."
  },
  "ayanamsha_kp": {
    id: "ayanamsha_kp",
    name: "KP (Krishnamurti) Ayanamsha",
    category: "AYANAMSHA",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Krishnamurti Padhdhati canonical ayanamsha."
  },
  "ayanamsha_raman": {
    id: "ayanamsha_raman",
    name: "B.V. Raman Ayanamsha",
    category: "AYANAMSHA",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Canonical Raman formula (Year - 397) * 50⅓\"/year with J2000 anchor at 22° 24' 44.333\"."
  },

  // 3. HOUSE SYSTEMS
  "houses_whole_sign": {
    id: "houses_whole_sign",
    name: "Whole Sign House System",
    category: "HOUSES",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Classical Vedic and Hellenistic 30° zodiacal sign house system."
  },
  "houses_sripati": {
    id: "houses_sripati",
    name: "Sripati Quadrant Trisection & Bhava Chalit",
    category: "HOUSES",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Unequal quadrant house system with non-inverted midpoints (Sandhi and Madhya)."
  },
  "houses_equal": {
    id: "houses_equal",
    name: "Equal House System",
    category: "HOUSES",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "30° house divisions starting from exact Ascendant degree."
  },
  "houses_placidus": {
    id: "houses_placidus",
    name: "Placidus Semidiurnal Arc Cusp Solver",
    category: "HOUSES",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Iterative cusp solver with graceful polar fallback to Equal system for circumpolar latitudes."
  },
  "houses_regiomontanus": {
    id: "houses_regiomontanus",
    name: "Regiomontanus House System",
    category: "HOUSES",
    status: FEATURE_STATUS.PLANNED,
    description: "Equatorial house system planned for future Western astrology expansion."
  },
  "houses_koch": {
    id: "houses_koch",
    name: "Koch (GOH) House System",
    category: "HOUSES",
    status: FEATURE_STATUS.PLANNED,
    description: "Birthplace house system planned for future release."
  },

  // 4. DIVISIONAL CHARTS (VARGAS)
  "vargas_canonical_parashara": {
    id: "vargas_canonical_parashara",
    name: "Parashari Shodashavarga (D1 to D60)",
    category: "VARGAS",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Rigorous harmonic divisions for D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60."
  },
  "vargas_d6_shashtamsha": {
    id: "vargas_d6_shashtamsha",
    name: "D6 Shashtamsha Harmonic",
    category: "VARGAS",
    status: FEATURE_STATUS.PLANNED,
    description: "D6 harmonic is not implemented; references strictly purged from consultation and predictions."
  },
  "vargas_d8_ashtamsha": {
    id: "vargas_d8_ashtamsha",
    name: "D8 Ashtamsha Harmonic",
    category: "VARGAS",
    status: FEATURE_STATUS.PLANNED,
    description: "D8 harmonic is not implemented; never advertised as calculated."
  },
  "vargas_d11_rudramsha": {
    id: "vargas_d11_rudramsha",
    name: "D11 Rudramsha / Labhamsha Harmonic",
    category: "VARGAS",
    status: FEATURE_STATUS.PLANNED,
    description: "D11 harmonic is not implemented; never advertised as calculated."
  },

  // 5. CLASSICAL JYOTISH METRICS
  "vimshottari_dasha_solar": {
    id: "vimshottari_dasha_solar",
    name: "Vimshottari Dasha (365.24219878-day Tropical Solar Year)",
    category: "TIMING",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "MD, AD, and PD timing windows aligned to the canonical 365.2422 solar year standard."
  },
  "shadbala_sixfold": {
    id: "shadbala_sixfold",
    name: "Six-Fold Parashari Shadbala with Graha Yuddha",
    category: "METRICS",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Sthana, Dig, Kala, Cheshta, Naisargika, Drik bala with planetary war corrections."
  },
  "ashtakavarga_337": {
    id: "ashtakavarga_337",
    name: "BPHS Canonical Ashtakavarga (337 Bindus)",
    category: "METRICS",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Complete 56 contributor rows summing strictly to 337 Sarvashtakavarga bindus."
  },
  "jaimini_chara_karakas": {
    id: "jaimini_chara_karakas",
    name: "Jaimini 7/8 Chara Karakas",
    category: "METRICS",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Atmakaraka through Darakaraka based on longitudes."
  },

  // 6. EXPERT PREDICTION & TIMELINE ENGINES
  "expert_prediction_17_domains": {
    id: "expert_prediction_17_domains",
    name: "Expert Mode 17 Life Domain Prediction Engines",
    category: "PREDICTION",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Evidence-derived, chronological timing across Marriage, Career, Wealth, Property, Health, etc."
  },
  "resolution_classifier": {
    id: "resolution_classifier",
    name: "Multi-Tier Resolution Classifier",
    category: "PREDICTION",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Classifies timing resolution from YEAR down to TIME_WINDOW without unsupported date fabrication."
  },
  "independence_controller": {
    id: "independence_controller",
    name: "Anti-Double-Counting Independence Controller",
    category: "PREDICTION",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Groups correlated astrological indicators into independent lines of evidence."
  },

  // 7. TRUST, SAFETY & REPRODUCIBILITY
  "calculation_certificate_fips": {
    id: "calculation_certificate_fips",
    name: "FIPS 180-4 SHA-256 Calculation Certificate",
    category: "TRUST",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Reproducible cryptographic inputHash and chartHash with full engine and ephemeris provenance."
  },
  "health_safety_layer": {
    id: "health_safety_layer",
    name: "Non-Diagnostic Health & Wellness Boundary",
    category: "SAFETY",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Enforces statutory medical boundaries; prohibits diagnostic claims, disease naming, and mortality forecasting."
  },
  "anti_fabrication_validator": {
    id: "anti_fabrication_validator",
    name: "Anti-Fabrication Claim Validator",
    category: "SAFETY",
    status: FEATURE_STATUS.IMPLEMENTED,
    description: "Validates all textual interpretations against underlying calculated chart facts."
  },

  // 8. RESEARCH & RECTIFICATION
  "birth_time_rectification_lab": {
    id: "birth_time_rectification_lab",
    name: "Birth-Time Rectification Research Lab",
    category: "RESEARCH",
    status: FEATURE_STATUS.EXPERIMENTAL,
    description: "Search space exploration for birth time fine-tuning calibrated with synthetic ground-truth controls."
  },
  "empirical_longitudinal_study": {
    id: "empirical_longitudinal_study",
    name: "Independent Empirical Longitudinal Real-World Accuracy Study",
    category: "RESEARCH",
    status: FEATURE_STATUS.PLANNED,
    description: "Segmented quality status marked NOT_YET_VALIDATED pending prospective, pre-registered field trials."
  }
});

export function getFeatureStatus(featureId) {
  const feat = FEATURE_REGISTRY[featureId];
  return feat ? feat.status : null;
}

export function getFeaturesByStatus(status) {
  return Object.values(FEATURE_REGISTRY).filter(f => f.status === status);
}

export function getFeaturesByCategory(category) {
  return Object.values(FEATURE_REGISTRY).filter(f => f.category === category);
}
