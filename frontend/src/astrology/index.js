/**
 * ASTROVERSE — Master Multi-System Computational Astrology Orchestrator
 *
 * Provides unified access to all 4 astrological calculation profiles:
 * - Lahiri (Chitrapaksha Sidereal)
 * - KP (Krishnamurti Padhdhati)
 * - Raman Sidereal
 * - Tropical / Sayana (Western)
 *
 * plus the multi-system cross-comparison matrix.
 */

import { normalizeBirthData } from "./astronomy/time.js";
import { getAstronomicalObservations } from "./astronomy/ephemeris.js";
import { calculateLahiriChart } from "./systems/lahiri.js";
import { calculateKPChart } from "./systems/kp.js";
import { calculateRamanChart } from "./systems/raman.js";
import { calculateTropicalChart } from "./systems/tropical.js";
import { compareSystems } from "./comparison/compareSystems.js";
import { ASTROLOGY_SYSTEMS, getSystemConfig } from "../config/astrologySystems.js";
import { REPORT_CHAPTERS, getChaptersForSystem } from "../config/reportChapters.js";

/**
 * Calculates a single system chart
 */
export function calculateChartBySystem(systemId = "lahiri", birthData, options = {}) {
  const normData = normalizeBirthData(birthData);
  const observations = getAstronomicalObservations(normData);
  const sys = (systemId || "lahiri").toLowerCase();

  switch (sys) {
    case "kp":
      return calculateKPChart(observations, normData);
    case "tropical":
    case "sayana":
    case "western":
      return calculateTropicalChart(observations, normData);
    case "raman":
      return calculateRamanChart(birthData, options);
    case "lahiri":
    case "vedic":
    default:
      return calculateLahiriChart(birthData, options);
  }
}

/**
 * Calculates complete multi-system bundle for 4-system side-by-side comparison
 */
export function calculateMultiSystemBundle(birthData, options = {}) {
  const normData = normalizeBirthData(birthData);
  const observations = getAstronomicalObservations(normData);

  const lahiri = calculateLahiriChart(birthData, options);
  const kp = calculateKPChart(observations, normData);
  const raman = calculateRamanChart(birthData, options);
  const tropical = calculateTropicalChart(observations, normData);

  const comparison = compareSystems({
    lahiriChart: lahiri,
    kpChart: kp,
    ramanChart: raman,
    tropicalChart: tropical
  });

  return {
    birthData: normData,
    observations,
    systems: {
      lahiri,
      kp,
      raman,
      tropical
    },
    comparison
  };
}

export {
  ASTROLOGY_SYSTEMS,
  REPORT_CHAPTERS,
  getSystemConfig,
  getChaptersForSystem,
  compareSystems
};
