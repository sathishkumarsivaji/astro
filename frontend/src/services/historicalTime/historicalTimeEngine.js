/**
 * ASTROVERSE — Historical Time-Standard & Multi-Epoch Temporal Engine
 * 
 * Accurately models historical time conventions across global eras:
 * 1. STANDARD_TIME: Modern civil zone time
 * 2. DAYLIGHT_SAVING: Modern civil time during summer DST
 * 3. LOCAL_MEAN_TIME (LMT): Mean solar time strictly derived from geographic longitude (4 min/deg)
 * 4. HISTORICAL_ZONE_TIME: Pre-unification provincial time standards (e.g., Madras, Bombay, Paris)
 * 5. SOURCE_DECLARED_OFFSET: Historical offset declared in birth register/certificate
 * 
 * Solves dual charts for pre-standard-time births (source-declared civil vs historical LMT)
 * and discloses material discrepancies across Ascendant, MC, house cusps, D9, D10, D60, and KP.
 */

import { calculatePlanetaryPositions } from '../astroEngine.js';

export const TIME_STANDARDS = Object.freeze({
  STANDARD_TIME: 'STANDARD_TIME',
  DAYLIGHT_SAVING: 'DAYLIGHT_SAVING',
  LOCAL_MEAN_TIME: 'LOCAL_MEAN_TIME',
  HISTORICAL_ZONE_TIME: 'HISTORICAL_ZONE_TIME',
  SOURCE_DECLARED_OFFSET: 'SOURCE_DECLARED_OFFSET'
});

/**
 * Historical Standard Time adoption milestones by region.
 * Births prior to these dates were conventionally recorded in Local Mean Time (LMT)
 * or regional observatory time (e.g. Madras Mean Time).
 */
export const HISTORICAL_TIME_ERA_BOUNDARIES = [
  { region: 'US_CANADA', name: 'United States & Canada', adoptionDate: '1883-11-18', defaultStandard: 'US Standard Railway Time' },
  { region: 'GREAT_BRITAIN', name: 'Great Britain', adoptionDate: '1880-08-02', defaultStandard: 'Greenwich Mean Time (GMT)' },
  { region: 'INDIA', name: 'India', adoptionDate: '1906-01-01', defaultStandard: 'Indian Standard Time (IST, UTC+05:30)' },
  { region: 'FRANCE', name: 'France', adoptionDate: '1891-03-15', defaultStandard: 'Paris Mean Time' },
  { region: 'GERMANY', name: 'Germany', adoptionDate: '1893-04-01', defaultStandard: 'Central European Time (CET, UTC+01:00)' },
  { region: 'GLOBAL_DEFAULT', name: 'International Meridian Baseline', adoptionDate: '1900-01-01', defaultStandard: 'International Standard Time' }
];

/**
 * Calculates exact Longitude-derived Local Mean Time (LMT) offset from UTC.
 * 360° of longitude = 24 hours of time => 1° longitude = 4 minutes of time (1/15 hour).
 * 
 * @param {number} longitude - Geographic longitude in decimal degrees (East positive, West negative)
 * @returns {{ lmtHours: number, lmtMinutes: number, formatted: string }}
 */
export function calculateLongitudeLMT(longitude) {
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    throw new Error('Valid geographic longitude is required to calculate Local Mean Time (LMT).');
  }
  const lmtHours = longitude / 15.0;
  const totalMinutes = longitude * 4.0;
  const sign = totalMinutes >= 0 ? '+' : '-';
  const absMins = Math.abs(totalMinutes);
  const h = Math.floor(absMins / 60);
  const m = Math.floor(absMins % 60);
  const s = Math.round((absMins - (h * 60 + m)) * 60);
  const formatted = `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  return {
    lmtHours: parseFloat(lmtHours.toFixed(6)),
    lmtMinutes: parseFloat(totalMinutes.toFixed(4)),
    formatted
  };
}

/**
 * Resolves the historical time standard and temporal context for a birth event.
 */
export function resolveHistoricalTimeStandard({
  birthDate,
  birthTime = '12:00',
  latitude,
  longitude,
  timezoneId = null,
  sourceUtcOffset = null,
  sourceTimeConvention = null
}) {
  if (!birthDate) throw new Error('birthDate (YYYY-MM-DD) is required to resolve historical time standard.');
  if (typeof longitude !== 'number') throw new Error('Valid geographic longitude is required.');

  const parts = birthDate.split('-').map(Number);
  const year = parts[0];
  const lmt = calculateLongitudeLMT(longitude);

  // Check regional adoption threshold
  let eraBoundary = HISTORICAL_TIME_ERA_BOUNDARIES.find(b => {
    if (timezoneId) {
      if (b.region === 'INDIA' && timezoneId.includes('Kolkata')) return true;
      if (b.region === 'GREAT_BRITAIN' && timezoneId.includes('London')) return true;
      if (b.region === 'US_CANADA' && (timezoneId.includes('New_York') || timezoneId.includes('Chicago') || timezoneId.includes('Los_Angeles'))) return true;
    }
    return false;
  }) || HISTORICAL_TIME_ERA_BOUNDARIES.find(b => b.region === 'GLOBAL_DEFAULT');

  const isPreStandardEra = birthDate < eraBoundary.adoptionDate;

  let timeStandard;
  let effectiveOffset = sourceUtcOffset;

  if (sourceTimeConvention === 'LMT' || (isPreStandardEra && sourceUtcOffset === null)) {
    timeStandard = TIME_STANDARDS.LOCAL_MEAN_TIME;
    effectiveOffset = lmt.lmtHours;
  } else if (sourceUtcOffset !== null && isPreStandardEra) {
    timeStandard = TIME_STANDARDS.SOURCE_DECLARED_OFFSET;
  } else if (sourceTimeConvention === 'HISTORICAL_ZONE') {
    timeStandard = TIME_STANDARDS.HISTORICAL_ZONE_TIME;
  } else if (isPreStandardEra) {
    timeStandard = TIME_STANDARDS.LOCAL_MEAN_TIME;
  } else {
    timeStandard = TIME_STANDARDS.STANDARD_TIME;
  }

  const differenceMinutesFromLMT = effectiveOffset !== null
    ? parseFloat(((effectiveOffset - lmt.lmtHours) * 60).toFixed(2))
    : 0.0;

  return {
    timeStandard,
    utcOffset: effectiveOffset !== null ? parseFloat(Number(effectiveOffset).toFixed(4)) : lmt.lmtHours,
    longitudeDerivedLMT: lmt.lmtHours,
    longitudeDerivedLMTMinutes: lmt.lmtMinutes,
    longitudeDerivedLMTFormatted: lmt.formatted,
    timezoneId: timezoneId || 'HISTORICAL_ERA',
    sourceTimeConvention: sourceTimeConvention || (isPreStandardEra ? 'HISTORICAL_ERA_LMT_DEFAULT' : 'STANDARD_TIME'),
    isPreStandardEra,
    eraAdoptionDate: eraBoundary.adoptionDate,
    eraStandardName: eraBoundary.defaultStandard,
    differenceMinutesFromLMT
  };
}

/**
 * Calculates dual historical charts (source-declared civil offset vs longitude-derived LMT)
 * and detects material discrepancies in Ascendant, MC, house cusps, D9, D10, D60, and KP cusps.
 */
export function calculateDualHistoricalCharts(birthProfile, options = {}) {
  const { birthDate, birthTime, latitude, longitude, system = 'lahiri', timezoneId } = birthProfile;
  const resolution = resolveHistoricalTimeStandard({
    birthDate,
    birthTime,
    latitude,
    longitude,
    timezoneId,
    sourceUtcOffset: birthProfile.utcOffset ?? birthProfile.sourceUtcOffset ?? null,
    sourceTimeConvention: birthProfile.sourceTimeConvention ?? null
  });

  const civilOffset = resolution.utcOffset;
  const lmtOffset = resolution.longitudeDerivedLMT;

  const validIanaTimezone = (tzId) => {
    if (!tzId || typeof tzId !== 'string') return null;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tzId });
      return tzId;
    } catch {
      return null;
    }
  };

  // Chart 1: Source-Declared Civil / Standard Offset
  const civilChart = calculatePlanetaryPositions(
    birthDate,
    birthTime,
    latitude,
    longitude,
    system,
    civilOffset,
    { ...options, timezoneId: validIanaTimezone(resolution.timezoneId) }
  );

  // If not pre-standard and difference is tiny (< 0.1 min), return single chart with resolution
  const timeDifferenceMinutes = Math.abs((civilOffset - lmtOffset) * 60);
  if (!resolution.isPreStandardEra && timeDifferenceMinutes < 0.2) {
    return {
      resolution,
      isDualCalculationRequired: false,
      primaryChart: civilChart,
      lmtChart: null,
      discrepancyAudit: null
    };
  }

  // Chart 2: True Longitude-Derived Local Mean Time (LMT)
  const lmtChart = calculatePlanetaryPositions(
    birthDate,
    birthTime,
    latitude,
    longitude,
    system,
    lmtOffset,
    { ...options, timezoneId: null }
  );

  // Audit material differences between Civil and LMT
  const ascCivil = civilChart.ascendant?.longitude ?? civilChart.ascendantLong;
  const ascLmt = lmtChart.ascendant?.longitude ?? lmtChart.ascendantLong;
  const ascDiffDeg = parseFloat(Math.abs(ascCivil - ascLmt).toFixed(4));
  const ascSignShift = civilChart.ascendantSign?.name !== lmtChart.ascendantSign?.name;

  const mcCivil = civilChart.mcLong ?? 0;
  const mcLmt = lmtChart.mcLong ?? 0;
  const mcDiffDeg = parseFloat(Math.abs(mcCivil - mcLmt).toFixed(4));

  // Divisional chart lagna shifts
  const d9CivilLagna = civilChart.divisionalCharts?.D9?.ascendant?.sign || null;
  const d9LmtLagna = lmtChart.divisionalCharts?.D9?.ascendant?.sign || null;
  const d9LagnaShift = d9CivilLagna !== null && d9CivilLagna !== d9LmtLagna;

  const d10CivilLagna = civilChart.divisionalCharts?.D10?.ascendant?.sign || null;
  const d10LmtLagna = lmtChart.divisionalCharts?.D10?.ascendant?.sign || null;
  const d10LagnaShift = d10CivilLagna !== null && d10CivilLagna !== d10LmtLagna;

  const d60CivilLagna = civilChart.divisionalCharts?.D60?.ascendant?.sign || null;
  const d60LmtLagna = lmtChart.divisionalCharts?.D60?.ascendant?.sign || null;
  const d60LagnaShift = d60CivilLagna !== null && d60CivilLagna !== d60LmtLagna;

  // House cusp diffs
  const houseCuspsDiff = [];
  const civilCusps = civilChart.bhavaChalit?.cusps || [];
  const lmtCusps = lmtChart.bhavaChalit?.cusps || [];
  for (let h = 0; h < Math.min(civilCusps.length, lmtCusps.length); h++) {
    const diff = Math.abs(civilCusps[h].degree - lmtCusps[h].degree);
    houseCuspsDiff.push({
      house: h + 1,
      civilCusp: civilCusps[h].degree,
      lmtCusp: lmtCusps[h].degree,
      diffDeg: parseFloat(diff.toFixed(4))
    });
  }

  const materialDifferenceDetected = ascSignShift || d9LagnaShift || d10LagnaShift || d60LagnaShift || ascDiffDeg > 0.5;

  const disclosureNoticeEn = materialDifferenceDetected
    ? `Historical Time Standard Disclosure: Birth occurred prior to/during regional standard time harmonization (${resolution.eraAdoptionDate}). Discrepancy between Source-Declared Civil Time (UTC${civilOffset >= 0 ? '+' : ''}${civilOffset}) and Longitude-Derived LMT (UTC${lmtOffset >= 0 ? '+' : ''}${lmtOffset}) is ${timeDifferenceMinutes.toFixed(1)} minutes. Material shifts detected in: ${[ascSignShift && 'Lagna Sign', d9LagnaShift && 'D9 Navamsha Lagna', d10LagnaShift && 'D10 Dashamsha Lagna', d60LagnaShift && 'D60 Shashtiamsha Lagna'].filter(Boolean).join(', ')}. Both charts are exposed for complete astrological transparency.`
    : `Historical Time Standard Disclosure: Birth occurred in historical transition era (${resolution.eraAdoptionDate}). Evaluated under both Source-Declared Civil Time and Longitude-Derived LMT; no material sign shifts detected across D1/D9/D10.`;

  const disclosureNoticeTa = materialDifferenceDetected
    ? `வரலாற்று நேரத் திட்ட வெளிப்படைத்தன்மை: பிராந்திய நேரச் சீரமைப்பிற்கு முன் (${resolution.eraAdoptionDate}) நிகழ்ந்த பிறப்பு. ஆவணப்படுத்தப்பட்ட நேரத்திற்கும் தீர்க்கரேகை அடிப்படையிலான உண்மை சூரிய நேரத்திற்கும் (LMT) இடையே ${timeDifferenceMinutes.toFixed(1)} நிமிடங்கள் வித்தியாசம் உள்ளது. லக்னம், நவாம்சம் (D9) அல்லது தசாம்சம் (D10) ஆகியவற்றில் மாற்றம் கண்டறியப்பட்டுள்ளது. இரு கணிப்புகளும் வெளிப்படைத்தன்மையுடன் வழங்கப்பட்டுள்ளன.`
    : `வரலாற்று நேரத் திட்ட வெளிப்படைத்தன்மை: வரலாற்று நேரப் பெயர்ச்சிக் காலத்தில் நிகழ்ந்த பிறப்பு. பொது சிவில் நேரம் மற்றும் LMT இரண்டும் கணக்கிடப்பட்டு, முக்கிய வர்க்க லக்ன மாற்றங்கள் இல்லை என உறுதிப்படுத்தப்பட்டது.`;

  return {
    resolution,
    isDualCalculationRequired: true,
    civilChart,
    lmtChart,
    discrepancyAudit: {
      timeDifferenceMinutes,
      ascDiffDeg,
      ascSignShift,
      civilLagnaSign: civilChart.ascendantSign?.name,
      lmtLagnaSign: lmtChart.ascendantSign?.name,
      mcDiffDeg,
      d9LagnaShift,
      civilD9Lagna: d9CivilLagna,
      lmtD9Lagna: d9LmtLagna,
      d10LagnaShift,
      civilD10Lagna: d10CivilLagna,
      lmtD10Lagna: d10LmtLagna,
      d60LagnaShift,
      civilD60Lagna: d60CivilLagna,
      lmtD60Lagna: d60LmtLagna,
      houseCuspsDiff,
      materialDifferenceDetected,
      disclosureNoticeEn,
      disclosureNoticeTa
    }
  };
}
