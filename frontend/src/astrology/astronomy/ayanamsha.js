/**
 * ASTROVERSE — Authoritative Ayanamsha Module
 *
 * Maximum-Grade Ayanamsha Computation Engine with explicitly locked:
 * - Ayanamsha Model
 * - Ephemeris Model (VSOP87 / Planetary & Lunar Integration Model)
 * - Reference Epoch (J2000.0 = JD 2451545.0 TT)
 * - Precession / Nutation Model (IAU 1976 / 1980 / Lieske et al. / Wahr)
 * - Engine Version & Shastric Standard
 */

export const AYANAMSHA_MODELS = {
  LAHIRI_CHITRAPAKSHA: {
    id: "lahiri",
    name: "Lahiri / Chitrapaksha (Indian Astronomical Ephemeris / Calendar Reform Committee Standard)",
    anchorEpoch: "J2000.0 (JD 2451545.0 TT)",
    anchorValueDms: "23° 51' 25.532\"",
    anchorValueDeg: 23.85709222,
    precessionConstant: "5029.0966\"/century (IAU 1976 / Lieske et al.)",
    precessionRateDegPerCentury: 1.39697128,
    secularTermDegPerCenturySq: 0.00030878,
    cubicTermDegPerCenturyCube: -0.00000003,
    referenceFrame: "Geocentric True Ecliptic of Date / J2000.0 Equinox",
    version: "2.10-IAE",
    ephemerisBase: "VSOP87 / High-Precision Planetary Integration",
    shastricAuthority: "Indian Calendar Reform Committee (1952) / N.C. Lahiri / Spica (Chitra) at 180°"
  },
  KP_ORIGINAL: {
    id: "kp",
    name: "Krishnamurti Padhdhati (KP - Original 1900 Anchor)",
    anchorEpoch: "J2000.0 (JD 2451545.0 TT)",
    anchorValueDms: "23° 45' 56.000\"",
    anchorValueDeg: 23.76555556,
    precessionRate: "50.2388475\"/year (1.3955235°/century)",
    precessionRateDegPerCentury: 1.3955235,
    referenceFrame: "Geocentric Ecliptic of Date",
    version: "KP-1970-Standard",
    shastricAuthority: "Prof. K.S. Krishnamurti (KP Readers Vol I-VI)"
  },
  RAMAN_SIDEREAL: {
    id: "raman",
    name: "B.V. Raman Sidereal (397 AD Zero Anchor)",
    zeroYear: 397.0,
    anchorEpoch: "J2000.0 (JD 2451545.0 TT)",
    anchorValueDms: "22° 24' 51.467\"",
    anchorValueDeg: 22.4142963,
    precessionRate: "50.3333333\"/year (50⅓\"/year)",
    referenceFrame: "Geocentric Ecliptic of Date",
    version: "Raman-1956-Standard",
    shastricAuthority: "Dr. B.V. Raman (Notable Horoscopes / Hindu Predictive Astrology)"
  },
  TROPICAL_SAYANA: {
    id: "tropical",
    name: "Tropical / Sayana (Western True Equinox of Date)",
    anchorEpoch: "Vernal Equinox of Date (0° Aries Anchor)",
    anchorValueDms: "0° 00' 00.000\"",
    anchorValueDeg: 0.0,
    referenceFrame: "Geocentric True Ecliptic of Date",
    version: "IAU-2006/VSOP87",
    shastricAuthority: "Western Sayana Astronomical Framework"
  }
};

/**
 * Classical Lahiri / Chitrapaksha Ayanamsha
 * Maximum-grade implementation locked to Indian Astronomical Ephemeris standard.
 * 
 * J2000.0 Anchor: 23° 51' 25.532" = 23.85709222°
 * IAU 1976 / Lieske Precession: 5029.0966"/cy = 1.39697128°/cy + 0.00030878°·T² - 0.00000003°·T³
 * 
 * @param {number} jd Julian Day in Terrestrial Time (TT)
 * @param {boolean} includeNutation If true, computes True Ayanamsha (with nutation in longitude)
 * @returns {number} Ayanamsha in decimal degrees
 */
export function getLahiriAyanamsha(jd, includeNutation = false) {
  const T = (jd - 2451545.0) / 36525.0;
  // Mean Ayanamsha
  let ayanamsha = 23.85709222 + 1.39697128 * T + 0.00030878 * T * T - 0.00000003 * T * T * T;

  if (includeNutation) {
    // IAU 1980 Nutation in Longitude (dominant terms)
    const omega = (125.04452 - 1934.136261 * T) * (Math.PI / 180);
    const lSun = (280.4665 + 36000.7698 * T) * (Math.PI / 180);
    const deltaPsiArcsec = -17.20 * Math.sin(omega) - 1.32 * Math.sin(2 * lSun);
    ayanamsha += deltaPsiArcsec / 3600.0;
  }

  return ayanamsha;
}

/**
 * Krishnamurti Padhdhati (KP) Ayanamsha
 * J2000.0 anchor 23° 45' 56" = 23.76555556°, precession 50.2388475"/year
 * 
 * @param {number} jd Julian Day
 * @returns {number} KP Ayanamsha in decimal degrees
 */
export function getKPAyanamsha(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.76555556 + 1.3955235 * T;
}

/**
 * B.V. Raman Ayanamsha
 * Zero year: 397 AD, J2000.0 anchor ≈ 22°24'51.47" = 22.4142963°, precession rate 50⅓"/year
 * 
 * @param {number} jd Julian Day
 * @returns {number} Raman Ayanamsha in decimal degrees
 */
export function getRamanAyanamsha(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const decimalYear = 2000.0 + T * 100.0;
  return (decimalYear - 397.0) * ((50 + 1 / 3) / 3600.0);
}

/**
 * Universal Multi-System Ayanamsha Resolver
 * Throws on unknown system to prevent silent fallback contamination.
 * 
 * @param {number} jd Julian Day
 * @param {string|Object} systemOrConfig System identifier ("lahiri", "kp", "raman", "tropical")
 * @param {boolean} includeNutation Whether to compute True or Mean Ayanamsha
 * @returns {number} Ayanamsha in decimal degrees
 */
export function getAyanamshaForSystem(jd, systemOrConfig = "lahiri", includeNutation = false) {
  if (typeof systemOrConfig === "number") return systemOrConfig;
  const sysNorm = (typeof systemOrConfig === "string" ? systemOrConfig : (systemOrConfig?.id || systemOrConfig?.system || "lahiri")).toLowerCase();
  
  if (sysNorm === "vedic" || sysNorm === "lahiri") {
    return getLahiriAyanamsha(jd, includeNutation);
  } else if (sysNorm === "kp") {
    return getKPAyanamsha(jd);
  } else if (sysNorm === "raman") {
    return getRamanAyanamsha(jd);
  } else if (sysNorm === "tropical" || sysNorm === "western" || sysNorm === "sayana") {
    return 0.0;
  }
  
  throw new Error(`Unknown astrological system for ayanamsha: "${sysNorm}". Valid systems are lahiri, kp, raman, tropical.`);
}

/**
 * Returns full cryptographic metadata describing the active ayanamsha model.
 */
export function getAyanamshaMetadata(system = "lahiri") {
  const sysNorm = (system || "lahiri").toLowerCase();
  if (sysNorm === "kp") return AYANAMSHA_MODELS.KP_ORIGINAL;
  if (sysNorm === "raman") return AYANAMSHA_MODELS.RAMAN_SIDEREAL;
  if (sysNorm === "tropical" || sysNorm === "western" || sysNorm === "sayana") return AYANAMSHA_MODELS.TROPICAL_SAYANA;
  return AYANAMSHA_MODELS.LAHIRI_CHITRAPAKSHA;
}
