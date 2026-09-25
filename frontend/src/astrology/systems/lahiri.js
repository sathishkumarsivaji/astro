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

export function calculateLahiriChart(birthData, options = {}) {
  const { birthDate, birthTime, latitude, longitude, utcOffset, timezoneId } = birthData;
  return calculatePlanetaryPositions(
    birthDate,
    birthTime || "12:00",
    latitude,
    longitude,
    "lahiri",
    utcOffset,
    { ...options, timezoneId }
  );
}
