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
import { SIGN_NAMES } from "./derived/nakshatra.js";

/**
 * Calculates a single system chart
 */
export function calculateChartBySystem(systemId, birthData, options = {}) {
  const normData = normalizeBirthData(birthData);
  const nodeModel = options.nodeModel || birthData.nodeModel || normData.nodeModel || "mean";
  normData.nodeModel = nodeModel;
  const mergedOptions = { ...options, nodeModel };
  const observations = getAstronomicalObservations(normData, mergedOptions);
  if (!systemId) {
    throw new Error('INVALID_ASTROLOGY_SYSTEM: systemId is required. Valid systems: lahiri, kp, raman, tropical.');
  }
  const sys = String(systemId).toLowerCase();

  let chart;
  switch (sys) {
    case "kp":
      chart = calculateKPChart(observations, normData, mergedOptions);
      break;
    case "tropical":
    case "sayana":
    case "western":
      chart = calculateTropicalChart(observations, normData, mergedOptions);
      break;
    case "raman":
      chart = calculateRamanChart(observations, normData, mergedOptions);
      break;
    case "lahiri":
    case "vedic":
      chart = calculateLahiriChart(observations, normData, mergedOptions);
      break;
    default:
      throw new Error(`Unknown astrological system: "${systemId}". Valid systems are lahiri, kp, raman, tropical.`);
  }

  // Cross-system property standardization: ensure both ascendant/midheaven object and scalar degrees exist
  const ascLon = chart.ascendant?.longitude ?? chart.ascendantLong ?? chart.ascendantDeg;
  if (ascLon !== undefined) {
    if (chart.ascendantLong === undefined) chart.ascendantLong = ascLon;
    if (chart.ascendantDeg === undefined) chart.ascendantDeg = ascLon;
    if (!chart.ascendant) chart.ascendant = { house: 1, longitude: ascLon };
  }

  const mcLon = chart.midheaven?.longitude ?? chart.mcLong ?? chart.mcDeg;
  if (mcLon !== undefined) {
    if (chart.mcLong === undefined) chart.mcLong = mcLon;
    if (chart.mcDeg === undefined) chart.mcDeg = mcLon;
    if (!chart.midheaven) chart.midheaven = { house: 10, longitude: mcLon };
  }

  if (!chart.houses) {
    if (Array.isArray(chart.bhavasDetailed)) {
      chart.houses = chart.bhavasDetailed.map(b => {
        const signIdx = SIGN_NAMES.indexOf(b.signName);
        const lon = (signIdx >= 0) ? signIdx * 30 : ((b.num - 1) * 30);
        return {
          house: b.num,
          longitude: lon,
          signName: b.signName,
          signIndex: signIdx >= 0 ? signIdx : b.num - 1,
          degreeInSign: 0
        };
      });
    } else if (chart.bhavaChalit?.bhavas) {
      chart.houses = chart.bhavaChalit.bhavas.map(b => ({
        house: b.bhavaNum,
        longitude: b.madhyaDegree,
        signName: b.sign,
        signIndex: Math.floor(b.madhyaDegree / 30),
        degreeInSign: b.madhyaDegree % 30
      }));
    }
  }

  return chart;
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
