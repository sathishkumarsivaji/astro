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

export function calculateRamanChart(birthData, options = {}) {
  const { birthDate, birthTime, latitude, longitude, utcOffset, timezoneId } = birthData;
  return calculatePlanetaryPositions(
    birthDate,
    birthTime,
    latitude,
    longitude,
    "raman",
    utcOffset,
    { ...options, timezoneId }
  );
}
