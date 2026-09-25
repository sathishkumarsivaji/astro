/**
 * ASTROVERSE — Authoritative Ayanamsha Module
 *
 * Sole authoritative source of truth for sidereal ayanamsha calculations
 * across all supported astrological systems (Lahiri, KP, Raman, Tropical).
 */

/**
 * Classical Lahiri / Chitrapaksha Ayanamsha
 * Standard Indian Astronomical Ephemeris / NC Lahiri
 */
export function getLahiriAyanamsha(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.85709167 + 1.396971 * T + 0.0003086 * T * T;
}

/**
 * Krishnamurti Padhdhati (KP) Ayanamsha
 * J2000.0 anchor 23° 45' 56" = 23.76555556°, precession 50.2388475"/year
 */
export function getKPAyanamsha(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.76555556 + 1.3955235 * T;
}

/**
 * B.V. Raman Ayanamsha
 * Zero year: 397 AD, precession rate 50.2388475"/year
 */
export function getRamanAyanamsha(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const decimalYear = 2000.0 + T * 100.0;
  return (decimalYear - 397.0) * (50.2388475 / 3600.0);
}

/**
 * Universal Multi-System Ayanamsha Resolver
 * Throws on unknown system to prevent silent fallback contamination.
 */
export function getAyanamshaForSystem(jd, systemOrConfig = "lahiri") {
  if (typeof systemOrConfig === "number") return systemOrConfig;
  const sysNorm = (typeof systemOrConfig === "string" ? systemOrConfig : (systemOrConfig?.id || systemOrConfig?.system || "lahiri")).toLowerCase();
  
  if (sysNorm === "vedic" || sysNorm === "lahiri") {
    return getLahiriAyanamsha(jd);
  } else if (sysNorm === "kp") {
    return getKPAyanamsha(jd);
  } else if (sysNorm === "raman") {
    return getRamanAyanamsha(jd);
  } else if (sysNorm === "tropical" || sysNorm === "western" || sysNorm === "sayana") {
    return 0.0;
  }
  
  throw new Error(`Unknown astrological system for ayanamsha: "${sysNorm}". Valid systems are lahiri, kp, raman, tropical.`);
}
