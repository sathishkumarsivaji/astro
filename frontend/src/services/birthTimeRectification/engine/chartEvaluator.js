/**
 * ASTROVERSE — Rectification Chart Evaluator & Cache
 *
 * Calls existing validated astronomical / astrological calculation functions:
 * - calculatePlanetaryPositions (from astroEngine.js)
 * - Caches chart results per minute for performance across search stages & validation
 * - Preserves all 16 divisional charts (D1..D60), Vimshottari Dasha, and Bhava cusps
 */

import { calculatePlanetaryPositions } from "../../astroEngine.js";

const chartCache = new Map();

export function getCachedOrComputeChart({
  birthDate,
  timeString,
  lat,
  lng,
  system = "vedic",
  tz = 5.5,
  options = {}
}) {
  const cacheKey = `${birthDate}_${timeString}_${lat}_${lng}_${system}_${tz}`;
  if (chartCache.has(cacheKey)) {
    return chartCache.get(cacheKey);
  }

  const chart = calculatePlanetaryPositions(
    birthDate,
    timeString,
    Number(lat),
    Number(lng),
    system,
    Number(tz),
    options
  );

  chartCache.set(cacheKey, chart);
  return chart;
}

export function clearChartCache() {
  chartCache.clear();
}
