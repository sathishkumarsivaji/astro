/**
 * ASTROVERSE — Canonical Fact Adapter
 * =====================================
 * Read-only adapter that extracts canonical astrological facts
 * from the existing validated astrology engine output.
 *
 * This adapter NEVER duplicates calculations.
 * It ONLY reads from the chartData object produced by calculateChartBySystem().
 *
 * Consumed divisional charts: D1, D2, D4, D7, D9, D10, D12, D24, D30, D60
 * Consumed timing data: Vimshottari MD/AD/PD, transit ephemeris, Ashtakavarga, Shadbala
 * Consumed Jaimini/KP: Jaimini karakas, KP sub-lords where implemented
 */

import {
  getVargaChartData,
  calculateTransitEphemeris,
  calculateD2, calculateD4, calculateD7, calculateD9,
  calculateD10, calculateD12, calculateD24, calculateD30, calculateD60,
  ZODIAC_SIGNS, norm360
} from "../astroEngine.js";

// ─────────────────────────────────────────────────────────────
// 1. CHART FACT EXTRACTION
// ─────────────────────────────────────────────────────────────

/**
 * Extracts all canonical facts from a calculated chart.
 * Returns a frozen read-only object.
 *
 * @param {Object} chartData - Output of calculateChartBySystem()
 * @returns {CanonicalFacts}
 */
export function extractCanonicalFacts(chartData) {
  if (!chartData || !Array.isArray(chartData.planets)) {
    return { status: "INSUFFICIENT_DATA", planets: [], houses: [], dashaTable: [], divisionalCharts: {} };
  }

  const planets = chartData.planets || [];
  const ascLong = chartData.ascendant?.longitude ?? chartData.ascendantLong ?? chartData.ascendantDeg ?? null;

  if (!Number.isFinite(ascLong)) {
    return { status: "INSUFFICIENT_DATA", planets, houses: [], dashaTable: [], divisionalCharts: {} };
  }

  const lagnaSignIdx = Math.floor(norm360(ascLong) / 30);
  const moonPlanet = planets.find(p => p.name === "Moon");
  const moonLong = moonPlanet?.longitude ?? chartData.moonLong ?? null;

  // Build house lordship map
  const houses = buildHouseLordshipMap(lagnaSignIdx, planets);

  // Extract divisional charts
  const divisionalCharts = extractDivisionalCharts(planets, ascLong, chartData);

  // Extract dasha timeline
  const dashaTable = chartData.dashaTable || [];

  // Extract shadbala
  const shadbala = chartData.shadbala || [];

  // Extract ashtakavarga
  const ashtakavarga = chartData.ashtakavarga || chartData.classicalAshtakavarga || null;

  // Extract Jaimini karakas
  const jaiminiKarakas = chartData.jaiminiKarakas || null;

  // Birth data
  const birthYear = chartData.birthYear || null;
  const birthJd = chartData.birthJd ?? null;
  const timezoneOffsetHours = chartData.timezoneOffsetHours ?? chartData.utcOffset ?? chartData.tz ?? null;
  const timezoneId = chartData.timezoneId || chartData.ianaTimezone || null;

  const houseLordsMap = {};
  for (const h of houses) {
    houseLordsMap[h.house] = h.lordName;
  }

  return Object.freeze({
    status: "OK",
    ascendantLong: ascLong,
    ascendantSignIdx: lagnaSignIdx,
    ascendantSign: ZODIAC_SIGNS[lagnaSignIdx].name,
    ascendant: Object.freeze({
      longitude: ascLong,
      sign: ZODIAC_SIGNS[lagnaSignIdx].name,
      signName: ZODIAC_SIGNS[lagnaSignIdx].name,
      signIdx: lagnaSignIdx,
      ruler: houses[0]?.lordName
    }),
    ascendantLord: houses[0]?.lordName,
    houseLords: Object.freeze(houseLordsMap),
    moonLong,
    moonSignIdx: Number.isFinite(moonLong) ? Math.floor(norm360(moonLong) / 30) : null,
    moon: Object.freeze({
      longitude: moonLong,
      signIdx: Number.isFinite(moonLong) ? Math.floor(norm360(moonLong) / 30) : null,
      signName: Number.isFinite(moonLong) ? ZODIAC_SIGNS[Math.floor(norm360(moonLong) / 30)].name : null
    }),
    planets: Object.freeze(planets.map(p => Object.freeze({ ...p }))),
    houses: Object.freeze(houses),
    dashaTable: Object.freeze(dashaTable),
    divisionalCharts: Object.freeze(divisionalCharts),
    shadbala: Object.freeze(shadbala),
    ashtakavarga: ashtakavarga ? Object.freeze(ashtakavarga) : null,
    jaiminiKarakas: jaiminiKarakas ? Object.freeze(jaiminiKarakas) : null,
    birthYear,
    birthJd,
    timezoneOffsetHours,
    timezoneId,
    birthDateStr: chartData.birthDateStr || null,
    birthTimeStr: chartData.birthTimeStr || null,
    birthInstantUtc: chartData.birthInstantUtc || null
  });
}

// ─────────────────────────────────────────────────────────────
// 2. HOUSE LORDSHIP MAP
// ─────────────────────────────────────────────────────────────

/**
 * Builds house lordship information for all 12 houses.
 *
 * @param {number} lagnaSignIdx
 * @param {Object[]} planets
 * @returns {Object[]} Array of 12 house objects
 */
function buildHouseLordshipMap(lagnaSignIdx, planets) {
  const houses = [];
  for (let i = 0; i < 12; i++) {
    const houseNum = i + 1;
    const signIdx = (lagnaSignIdx + i) % 12;
    const sign = ZODIAC_SIGNS[signIdx];
    const lordName = sign.ruler;
    const lord = planets.find(p => p.name === lordName);
    const occupants = planets.filter(p => p.house === houseNum);

    houses.push({
      house: houseNum,
      signIdx,
      signName: sign.name,
      lordName,
      lordDignity: lord?.dignity || "Neutral",
      lordHouse: lord?.house || houseNum,
      lordLongitude: lord?.longitude ?? null,
      lordRetrograde: lord?.isRetrograde || false,
      lordCombust: lord?.isCombust || false,
      occupants: occupants.map(p => p.name),
      occupantCount: occupants.length
    });
  }
  return houses;
}

// ─────────────────────────────────────────────────────────────
// 3. DIVISIONAL CHART EXTRACTION
// ─────────────────────────────────────────────────────────────

/**
 * Extracts all relevant divisional charts.
 * Uses the existing engine's calculation functions — NEVER re-implements the math.
 *
 * @param {Object[]} planets
 * @param {number} ascLong
 * @param {Object} chartData
 * @returns {Object} Map of varga key → varga chart data
 */
function extractDivisionalCharts(planets, ascLong, chartData) {
  const vargaFunctions = {
    D2:  calculateD2,
    D4:  calculateD4,
    D7:  calculateD7,
    D9:  calculateD9,
    D10: calculateD10,
    D12: calculateD12,
    D24: calculateD24,
    D30: calculateD30,
    D60: calculateD60
  };

  const charts = {};

  for (const [key, fn] of Object.entries(vargaFunctions)) {
    try {
      charts[key] = getVargaChartData(planets, ascLong, fn);
    } catch (_err) {
      charts[key] = { status: "CALCULATION_ERROR", planets: [] };
    }
  }

  return charts;
}

// ─────────────────────────────────────────────────────────────
// 4. HOUSE FACT HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Gets the lord of a specific house from canonical facts.
 */
export function getHouseLord(canonicalFacts, houseNum) {
  const house = canonicalFacts.houses?.[houseNum - 1];
  if (!house) return null;
  return canonicalFacts.planets.find(p => p.name === house.lordName) || null;
}

/**
 * Gets all planets occupying a specific house.
 */
export function getHouseOccupants(canonicalFacts, houseNum) {
  return canonicalFacts.planets.filter(p => p.house === houseNum);
}

/**
 * Gets the sign index for a house number.
 */
export function getHouseSignIdx(canonicalFacts, houseNum) {
  return canonicalFacts.houses?.[houseNum - 1]?.signIdx ?? null;
}

/**
 * Gets a planet from canonical facts by name.
 */
export function getPlanet(canonicalFacts, planetName) {
  return canonicalFacts.planets.find(p => p.name === planetName) || null;
}

/**
 * Gets a divisional chart from canonical facts.
 */
export function getVargaChart(canonicalFacts, vargaKey) {
  return canonicalFacts.divisionalCharts?.[vargaKey] || null;
}

// ─────────────────────────────────────────────────────────────
// 5. DASHA TIMELINE HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Finds all Antardasha (AD) periods where the AD lord matches a given list of planet names.
 * Returns structured dasha facts with MD/AD/PD details and exact dates.
 *
 * @param {Object[]} dashaTable - The Vimshottari dasha table
 * @param {string[]} relevantLords - Planet names relevant to a domain
 * @returns {Object[]} Matching dasha periods
 */
export function findRelevantDashaPeriods(dashaTable, relevantLords) {
  if (!Array.isArray(dashaTable) || !Array.isArray(relevantLords) || relevantLords.length === 0) {
    return [];
  }

  const matches = [];

  for (const md of dashaTable) {
    const mdLord = md.lord;
    const isMdRelevant = relevantLords.includes(mdLord);

    if (Array.isArray(md.bukthis)) {
      for (const bk of md.bukthis) {
        const bkLord = bk.subLord || bk.lord || mdLord;
        const isBkRelevant = relevantLords.includes(bkLord);

        if (isMdRelevant || isBkRelevant) {
          matches.push({
            mdLord,
            mdTamil: md.tamil || mdLord,
            adLord: bkLord,
            adTamil: bk.subTamil || bk.tamil || bkLord,
            startAge: bk.startAge,
            endAge: bk.endAge,
            jdStart: bk.jdStart ?? null,
            jdEnd: bk.jdEnd ?? null,
            startDateIso: bk.startDateIso || null,
            endDateIso: bk.endDateIso || null,
            durationDays: bk.durationDays || null,
            isMdRelevant,
            isBkRelevant,
            isBothRelevant: isMdRelevant && isBkRelevant,
            mdStartAge: md.startAge,
            mdEndAge: md.endAge,
            mdJdStart: md.jdStart ?? null
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Extracts the currently active dasha period for a given Julian date or age.
 */
export function getActiveDashaAtAge(dashaTable, targetAge) {
  if (!Array.isArray(dashaTable) || !Number.isFinite(targetAge)) return null;

  for (const md of dashaTable) {
    if (targetAge >= md.startAge && targetAge < md.endAge) {
      let activeBk = null;
      if (Array.isArray(md.bukthis)) {
        for (const bk of md.bukthis) {
          if (targetAge >= bk.startAge && targetAge < bk.endAge) {
            activeBk = bk;
            break;
          }
        }
      }
      return {
        mdLord: md.lord,
        mdTamil: md.tamil || md.lord,
        adLord: activeBk ? (activeBk.subLord || activeBk.lord || md.lord) : md.lord,
        adTamil: activeBk ? (activeBk.subTamil || activeBk.tamil || activeBk.lord) : md.tamil,
        startAge: activeBk?.startAge ?? md.startAge,
        endAge: activeBk?.endAge ?? md.endAge
      };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// 6. TRANSIT COMPUTATION ADAPTER
// ─────────────────────────────────────────────────────────────

/**
 * Computes transit positions for a range of dates.
 * Delegates to the existing calculateTransitEphemeris — NEVER re-implements.
 *
 * @param {string} startDateIso - Start date (YYYY-MM-DD)
 * @param {string} endDateIso - End date (YYYY-MM-DD)
 * @param {number} natalAscLong - Natal ascendant longitude
 * @param {number} natalMoonLong - Natal moon longitude
 * @param {string} system - Ayanamsha system
 * @param {number} stepDays - Step size in days (default 30 for monthly)
 * @returns {Object[]} Array of transit snapshots
 */
export function computeTransitTimeline(startDateIso, endDateIso, natalAscLong, natalMoonLong, system = "lahiri", stepDays = 30) {
  if (!startDateIso || !endDateIso) return [];

  const snapshots = [];
  const startMs = new Date(startDateIso + "T12:00:00Z").getTime();
  const endMs = new Date(endDateIso + "T12:00:00Z").getTime();

  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return [];

  const stepMs = stepDays * 86400000;
  let currentMs = startMs;

  while (currentMs <= endMs) {
    const dateStr = new Date(currentMs).toISOString().slice(0, 10);
    try {
      const transit = calculateTransitEphemeris(dateStr, natalAscLong, natalMoonLong, system);
      snapshots.push({
        date: dateStr,
        positions: transit
      });
    } catch (_err) {
      // Transit calculation failed for this date — skip
    }
    currentMs += stepMs;
  }

  return snapshots;
}

/**
 * Checks if a specific planet transits over a natal house during a window.
 * Returns the dates when the transit occurs.
 *
 * @param {string} planetName - e.g., "Jupiter", "Saturn"
 * @param {number} targetHouseFromLagna - House number (1-12) from Lagna
 * @param {Object[]} transitTimeline - From computeTransitTimeline
 * @param {number} lagnaSignIdx - Natal lagna sign index
 * @returns {Object[]} Dates where transit planet is in the target house
 */
export function findTransitOverHouse(planetName, targetHouseFromLagna, transitTimeline, lagnaSignIdx) {
  if (!Array.isArray(transitTimeline) || transitTimeline.length === 0) return [];

  const targetSignIdx = (lagnaSignIdx + targetHouseFromLagna - 1) % 12;
  const hits = [];

  for (const snap of transitTimeline) {
    const pos = snap.positions;
    if (!pos) continue;

    // Find the planet in transit data
    const planetData = pos.planets?.find(p => p.name === planetName) ||
                       pos.transitPlanets?.find(p => p.name === planetName);
    if (!planetData) continue;

    const pLong = planetData.longitude ?? planetData.siderealLong;
    if (typeof pLong !== "number" || !Number.isFinite(pLong)) {
      continue;
    }

    const transitSignIdx = Math.floor(norm360(pLong) / 30);
    if (transitSignIdx === targetSignIdx) {
      hits.push({
        date: snap.date,
        planetName,
        transitSign: ZODIAC_SIGNS[transitSignIdx].name,
        targetHouse: targetHouseFromLagna,
        longitude: pLong
      });
    }
  }

  return hits;
}
