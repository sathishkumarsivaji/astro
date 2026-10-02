/**
 * ASTROVERSE — Multi-System Astrology Definitions & Metadata
 *
 * Authoritative registry of supported astrology systems:
 * 1. Lahiri / Chitrapaksha (Sidereal)
 * 2. KP / Krishnamurti Padhdhati (Sidereal + Placidus Cusps)
 * 3. Raman (Sidereal, 397 AD zero-year)
 * 4. Tropical / Sayana (Western, 0° Aries = Vernal Equinox)
 */

export const ASTROLOGY_SYSTEMS = {
  LAHIRI: {
    id: "lahiri",
    name: "Lahiri / Chitrapaksha Sidereal",
    tamilName: "சித்திரபக்ஷ லஹிரி முறை",
    zodiacType: "sidereal",
    ayanamshaType: "lahiri_chitrapaksha",
    defaultHouseSystem: "whole_sign",
    supportedHouseSystems: ["whole_sign", "sripati", "equal"],
    dashaSystem: "vimshottari_solar_365.2422",
    description: "Classical Indian National Calendar standard based on Spica (Chitra) at 180° longitude.",
    applicableTechniques: [
      "nakshatra", "vargas_d1_to_d60", "shadbala", "ashtakavarga",
      "jaimini_chara_karaka", "avasthas", "vimshottari_dasha", "panchanga",
      "bhava_chalit_sripati"
    ],
    inapplicableTechniques: [
      "kp_sub_lords", "kp_significators", "western_aspect_orbs", "western_dignities"
    ]
  },
  KP: {
    id: "kp",
    name: "KP (Krishnamurti Padhdhati)",
    tamilName: "கே.பி. (கிருஷ்ணமூர்த்தி பத்ததி)",
    zodiacType: "sidereal",
    ayanamshaType: "kp_original",
    defaultHouseSystem: "placidus",
    supportedHouseSystems: ["placidus"],
    dashaSystem: "vimshottari_kp",
    description: "Krishnamurti Padhdhati combining Placidus cuspal divisions with 249 Star/Sub-lord subdivisions and 4-tier significators.",
    applicableTechniques: [
      "nakshatra", "kp_star_lord", "kp_sub_lord", "kp_sub_sub_lord",
      "placidus_cusps", "kp_4_tier_significators", "ruling_planets",
      "vimshottari_dasha", "cuspal_interlinks"
    ],
    inapplicableTechniques: [
      "shadbala", "ashtakavarga", "jaimini_chara_karaka", "western_aspect_orbs"
    ]
  },
  RAMAN: {
    id: "raman",
    name: "B.V. Raman Sidereal",
    tamilName: "பி.வி. ராமன் முறை",
    zodiacType: "sidereal",
    ayanamshaType: "raman",
    defaultHouseSystem: "whole_sign",
    supportedHouseSystems: ["whole_sign", "sripati", "equal"],
    dashaSystem: "vimshottari_solar_365.2422",
    description: "Sidereal system popularized by Dr. B.V. Raman with zero-year epoch of 397 AD.",
    applicableTechniques: [
      "nakshatra", "vargas_d1_to_d60", "shadbala", "ashtakavarga",
      "jaimini_chara_karaka", "avasthas", "vimshottari_dasha", "panchanga"
    ],
    inapplicableTechniques: [
      "kp_sub_lords", "kp_significators", "western_aspect_orbs"
    ]
  },
  TROPICAL: {
    id: "tropical",
    name: "Tropical / Sayana (Western)",
    tamilName: "சாயன முறை (மேற்கத்திய)",
    zodiacType: "tropical",
    ayanamshaType: "none",
    defaultHouseSystem: "placidus",
    supportedHouseSystems: ["placidus", "equal"],
    dashaSystem: null,
    description: "Western Tropical zodiac tied to the Vernal Equinox (0° Aries = Spring Equinox). No Ayanamsha applied.",
    applicableTechniques: [
      "western_aspects", "western_essential_dignities", "placidus_houses",
      "element_modality_distribution", "declination_parallels"
    ],
    inapplicableTechniques: [
      "nakshatra", "vargas_d1_to_d60", "shadbala", "ashtakavarga",
      "jaimini_chara_karaka", "avasthas", "vimshottari_dasha", "panchanga",
      "kp_sub_lords"
    ]
  }
};

export const DEFAULT_ASTROLOGY_SYSTEM = "lahiri";

export function getSystemConfig(systemId) {
  if (!systemId) {
    throw new Error('INVALID_ASTROLOGY_SYSTEM: systemId is required. Valid systems: lahiri, kp, raman, tropical.');
  }
  const normalized = String(systemId).trim().toUpperCase();
  if (normalized === "VEDIC") return ASTROLOGY_SYSTEMS.LAHIRI;
  if (normalized === "SAYANA" || normalized === "WESTERN") return ASTROLOGY_SYSTEMS.TROPICAL;

  const config = ASTROLOGY_SYSTEMS[normalized];
  if (!config) {
    throw new Error(`Unknown astrology system: "${systemId}". Valid systems are lahiri, kp, raman, tropical.`);
  }
  return config;
}

export function isTechniqueApplicable(systemId, techniqueKey) {
  const sys = getSystemConfig(systemId);
  return sys.applicableTechniques.includes(techniqueKey);
}
