/**
 * ASTROVERSE — Lahiri / Chitrapaksha Sidereal Engine
 *
 * Implements traditional Vedic calculations using the Chitrapaksha / Lahiri Ayanamsha:
 * - Whole Sign / Sripati house cusps
 * - Full 16 Divisional Vargas (D1 to D60 with classical deities)
 * - Parashari 6-fold Shadbala suite
 * - 337-Bindu Samudayashtakavarga (SAV) & Bhinnashtakavarga (BAV)
 * - Jaimini Chara Karakas, Arudha Lagna (AL), and Upapada Lagna (UL)
 * - Vimshottari Dasha suite (120-year cycle)
 * - Vedic Panchanga
 */

import { calculatePlanetaryPositions } from "../../services/astroEngine.js";

export function calculateLahiriChart(observationsOrBirthData, maybeBirthData, options = {}) {
  let birthData;
  let opts;
  let observations;
  if (observationsOrBirthData && observationsOrBirthData.tropicalBodies) {
    observations = observationsOrBirthData;
    birthData = maybeBirthData || {};
    opts = options;
  } else {
    birthData = observationsOrBirthData || {};
    opts = maybeBirthData || {};
  }
  const { birthDate, birthTime, latitude, longitude, utcOffset, timezoneId, utcDate } = birthData;
  return calculatePlanetaryPositions(
    birthDate,
    birthTime,
    latitude,
    longitude,
    "lahiri",
    utcOffset,
    { ...opts, timezoneId, utcDate, observations }
  );
}
