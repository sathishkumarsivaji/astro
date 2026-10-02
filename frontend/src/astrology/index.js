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
  const nodeModel = options.nodeModel || birthData.nodeModel || normData.nodeModel || "mean";
  normData.nodeModel = nodeModel;
  const mergedOptions = { ...options, nodeModel };
  const observations = getAstronomicalObservations(normData, mergedOptions);
  const sys = (systemId || "lahiri").toLowerCase();

  switch (sys) {
    case "kp":
      return calculateKPChart(observations, normData, mergedOptions);
    case "tropical":
    case "sayana":
    case "western":
      return calculateTropicalChart(observations, normData, mergedOptions);
    case "raman":
      return calculateRamanChart(observations, normData, mergedOptions);
    case "lahiri":
    case "vedic":
      return calculateLahiriChart(observations, normData, mergedOptions);
    default:
      throw new Error(`Unknown astrological system: "${systemId}". Valid systems are lahiri, kp, raman, tropical.`);
  }
}

/**
 * Calculates complete multi-system bundle for 4-system side-by-side comparison
 */
export function calculateMultiSystemBundle(birthData, options = {}) {
  const normData = normalizeBirthData(birthData);
  const nodeModel = options.nodeModel || birthData.nodeModel || normData.nodeModel || "mean";
  normData.nodeModel = nodeModel;
  const mergedOptions = { ...options, nodeModel };
  const observations = getAstronomicalObservations(normData, mergedOptions);

  const lahiri = calculateLahiriChart(observations, normData, mergedOptions);
  const kp = calculateKPChart(observations, normData, mergedOptions);
  const raman = calculateRamanChart(observations, normData, mergedOptions);
  const tropical = calculateTropicalChart(observations, normData, mergedOptions);

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

export { SYSTEM_CONVENTIONS, generateCalculationCertificate, getConvention } from "./conventions.js";
