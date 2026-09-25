/**
 * ASTROVERSE — B.V. Raman Sidereal Engine
 *
 * Implements genuine B.V. Raman sidereal recalculation:
 * - Ayanamsha calculated from 397 AD zero-year epoch: (Year - 397) * (50.2388475" / 3600)
 * - Independent planetary longitudes and Lagna calculation
 * - Full Vedic suite (Vargas, Shadbala, Ashtakavarga, Jaimini, Dasha, Panchanga)
 *   evaluated under Raman coordinates without coordinate mixing
 */

import { calculatePlanetaryPositions } from "../../services/astroEngine.js";

export function calculateRamanChart(observationsOrBirthData, maybeBirthData, options = {}) {
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
    "raman",
    utcOffset,
    { ...opts, timezoneId, utcDate, observations }
  );
}
