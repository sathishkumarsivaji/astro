import { RESOLUTION, RESOLUTION_RANK } from './expertPredictionSchema.js';

/**
 * Determines the finest supported resolution for a given timing window.
 * @param {Object} windowData - Timing window data containing start/end dates and evidence.
 * @returns {string} The finest supported resolution from the RESOLUTION enum.
 */
export function classifyResolution(windowData) {
  const { startDate, endDate, dashaFacts, transitFacts, vargaFacts, hasIndependentCorroboration } = windowData;

  if (!startDate || !endDate) {
    return RESOLUTION.INSUFFICIENT_DATA;
  }

  const durationMs = new Date(endDate) - new Date(startDate);
  const durationDays = durationMs / (1000 * 60 * 60 * 24);

  // If duration spans a very long time, e.g., > 10 years, and no finer tuning
  if (durationDays > 365 * 5) {
    return RESOLUTION.NOT_DISCRIMINATING;
  }

  let resolution = RESOLUTION.YEAR;

  // Cross-corroboration requirement:
  // Fine resolutions (DAY, DATE_RANGE) require independent corroboration.
  // If explicitly hasIndependentCorroboration === false, resolution cannot be finer than MONTH_RANGE.
  const hasTransits = Array.isArray(transitFacts) && transitFacts.length > 0;
  const hasVargas = Array.isArray(vargaFacts) && vargaFacts.length > 0;
  const isCorroborated = hasIndependentCorroboration !== false &&
    (hasIndependentCorroboration === true || hasTransits || hasVargas || (!transitFacts && !vargaFacts && !dashaFacts));

  // Narrowing based on duration (from Dasha levels)
  if (durationDays <= 30) {
    resolution = isCorroborated ? RESOLUTION.DATE_RANGE : RESOLUTION.MONTH_RANGE;
  } else if (durationDays <= 65) {
    resolution = RESOLUTION.MONTH_RANGE;
  } else if (durationDays <= 150) {
    resolution = RESOLUTION.SEASON;
  } else {
    resolution = RESOLUTION.YEAR;
  }

  // Cross-confirmation narrowing: DAY precision strictly requires narrow window (<= 10 days)
  // AND active transit concurrence AND independent corroboration
  if (hasTransits && durationDays <= 10 && hasIndependentCorroboration !== false) {
    resolution = RESOLUTION.DAY;
  } else if (hasTransits && (resolution === RESOLUTION.MONTH_RANGE || resolution === RESOLUTION.SEASON)) {
    if (isCorroborated) {
      resolution = RESOLUTION.DATE_RANGE;
    }
  }

  // If there are multiple peaks in a larger window (simplified logic)
  if (windowData.multiplePeaks) {
    return RESOLUTION.MULTI_MODAL;
  }

  // Muhurta level
  if (windowData.muhurtaFacts && windowData.muhurtaFacts.length > 0) {
    resolution = RESOLUTION.TIME_WINDOW;
  }

  return resolution;
}

export function isResolutionAtLeast(resolution, minimumResolution) {
  const rank = RESOLUTION_RANK[resolution];
  const minRank = RESOLUTION_RANK[minimumResolution];
  if (rank == null || minRank == null) return false;
  // Non-timing resolutions (MULTI_MODAL, NOT_DISCRIMINATING, INSUFFICIENT_DATA) cannot satisfy timing precision
  if (minRank <= 6 && rank > 6) return false;
  return rank <= minRank;
}

/**
 * Returns bilingual labels for a given resolution.
 * @param {string} resolution - The resolution string.
 * @param {boolean} isTamil - Whether to return Tamil text.
 * @returns {string} The localized label.
 */
export function getResolutionLabel(resolution, isTamil) {
  const labels = {
    [RESOLUTION.YEAR]: { en: 'Year Window', ta: 'ஆண்டு காலம்' },
    [RESOLUTION.SEASON]: { en: 'Seasonal Window', ta: 'பருவ காலம்' },
    [RESOLUTION.MONTH_RANGE]: { en: 'Monthly Range', ta: 'மாத காலம்' },
    [RESOLUTION.DATE_RANGE]: { en: 'Specific Dates', ta: 'குறிப்பிட்ட நாட்கள்' },
    [RESOLUTION.DAY]: { en: 'Specific Day', ta: 'குறிப்பிட்ட நாள்' },
    [RESOLUTION.TIME_WINDOW]: { en: 'Time Window', ta: 'நேர அளவு' },
    [RESOLUTION.MULTI_MODAL]: { en: 'Multiple Peaks', ta: 'பல உச்சங்கள்' },
    [RESOLUTION.NOT_DISCRIMINATING]: { en: 'Broad Period', ta: 'பொதுவான காலம்' },
    [RESOLUTION.INSUFFICIENT_DATA]: { en: 'Insufficient Data', ta: 'போதிய தகவல்கள் இல்லை' }
  };
  
  const labelObj = labels[resolution] || labels[RESOLUTION.INSUFFICIENT_DATA];
  return isTamil ? labelObj.ta : labelObj.en;
}
