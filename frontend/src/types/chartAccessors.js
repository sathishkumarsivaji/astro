/**
 * ASTROVERSE — Canonical Chart Data Accessors
 *
 * Provides authoritative, schema-agnostic accessors for horoscope chart data.
 * Supports legacy and current data formats but strictly returns `null` when a
 * calculated field is absent or indeterminate.
 *
 * NEVER substitutes a fabricated zodiac sign, planet, or default birth date.
 */

import { toTamilRasi, toTamilNakshatra } from "../services/tamilAstrologyUtils.js";

/**
 * Returns canonical English name of the Ascendant (Lagna) sign (e.g. "Aries", "Taurus") or null.
 */
export function getAscendantName(chart) {
  if (!chart) return null;
  const asc = chart.ascendantSign;
  if (typeof asc === "string" && asc.trim().length > 0) return asc.trim();
  if (asc?.name && typeof asc.name === "string" && asc.name.trim().length > 0) return asc.name.trim();
  if (asc?.sign && typeof asc.sign === "string" && asc.sign.trim().length > 0) return asc.sign.trim();

  const directAsc = chart.ascendant;
  if (typeof directAsc === "string" && directAsc.trim().length > 0) return directAsc.trim();
  if (directAsc?.name && typeof directAsc.name === "string" && directAsc.name.trim().length > 0) return directAsc.name.trim();
  if (directAsc?.signName && typeof directAsc.signName === "string" && directAsc.signName.trim().length > 0) return directAsc.signName.trim();
  if (directAsc?.sign && typeof directAsc.sign === "string" && directAsc.sign.trim().length > 0) return directAsc.sign.trim();

  if (chart.lagna && typeof chart.lagna === "string" && chart.lagna.trim().length > 0) return chart.lagna.trim();
  if (chart.lagna?.name && typeof chart.lagna.name === "string") return chart.lagna.name.trim();

  return null;
}

/**
 * Returns canonical Tamil name of the Ascendant (Lagna) sign (e.g. "மேஷம்") or null.
 */
export function getAscendantTamil(chart) {
  if (!chart) return null;
  const directTamil = chart.ascendantSign?.tamil || chart.ascendant?.tamil || chart.lagna?.tamil;
  if (directTamil && typeof directTamil === "string" && directTamil.trim().length > 0) {
    return directTamil.trim();
  }
  const enName = getAscendantName(chart);
  return enName ? toTamilRasi(enName) : null;
}

/**
 * Returns canonical English name of the Moon sign (Rasi) or null.
 */
export function getMoonSignName(chart) {
  if (!chart) return null;
  const m = chart.moonSign;
  if (typeof m === "string" && m.trim().length > 0) return m.trim();
  if (m?.name && typeof m.name === "string" && m.name.trim().length > 0) return m.name.trim();
  if (m?.sign && typeof m.sign === "string" && m.sign.trim().length > 0) return m.sign.trim();

  const directMoon = chart.moon;
  if (typeof directMoon === "string" && directMoon.trim().length > 0) return directMoon.trim();
  if (directMoon?.name && typeof directMoon.name === "string" && directMoon.name.trim().length > 0) return directMoon.name.trim();
  if (directMoon?.signName && typeof directMoon.signName === "string" && directMoon.signName.trim().length > 0) return directMoon.signName.trim();
  if (directMoon?.sign && typeof directMoon.sign === "string" && directMoon.sign.trim().length > 0) return directMoon.sign.trim();

  if (chart.rasi && typeof chart.rasi === "string" && chart.rasi.trim().length > 0) return chart.rasi.trim();
  if (chart.rasi?.name && typeof chart.rasi.name === "string") return chart.rasi.name.trim();

  const moonPlanet = (chart.planets || []).find(p => p.name === "Moon");
  if (moonPlanet?.sign && typeof moonPlanet.sign === "string" && moonPlanet.sign.trim().length > 0) {
    return moonPlanet.sign.trim();
  }

  return null;
}

/**
 * Returns canonical Tamil name of the Moon sign (Rasi) or null.
 */
export function getMoonSignTamil(chart) {
  if (!chart) return null;
  const directTamil = chart.moonSign?.tamil || chart.moon?.tamil || chart.rasi?.tamil;
  if (directTamil && typeof directTamil === "string" && directTamil.trim().length > 0) {
    return directTamil.trim();
  }
  const enName = getMoonSignName(chart);
  return enName ? toTamilRasi(enName) : null;
}

/**
 * Returns canonical English name of the Moon Nakshatra (e.g. "Rohini") or null.
 */
export function getMoonNakshatraName(chart) {
  if (!chart) return null;
  const nak = chart.moonNakshatra || chart.nakshatra;
  if (typeof nak === "string" && nak.trim().length > 0) return nak.trim();
  if (nak?.name && typeof nak.name === "string" && nak.name.trim().length > 0) return nak.name.trim();

  const moonPlanet = (chart.planets || []).find(p => p.name === "Moon");
  if (moonPlanet?.nakshatra && typeof moonPlanet.nakshatra === "string" && moonPlanet.nakshatra.trim().length > 0) {
    return moonPlanet.nakshatra.trim();
  }
  return null;
}

/**
 * Returns canonical Pada (1..4) of the Moon Nakshatra or null.
 */
export function getMoonPada(chart) {
  if (!chart) return null;
  const pada = chart.moonNakshatra?.pada ?? chart.nakshatra?.pada ?? chart.pada;
  if (typeof pada === "number" && pada >= 1 && pada <= 4) return pada;
  const moonPlanet = (chart.planets || []).find(p => p.name === "Moon");
  if (typeof moonPlanet?.pada === "number" && moonPlanet.pada >= 1 && moonPlanet.pada <= 4) {
    return moonPlanet.pada;
  }
  return null;
}

/**
 * Returns canonical English name of the Sun sign or null.
 */
export function getSunSignName(chart) {
  if (!chart) return null;
  const s = chart.sunSign || chart.sun;
  if (typeof s === "string" && s.trim().length > 0) return s.trim();
  if (s?.name && typeof s.name === "string" && s.name.trim().length > 0) return s.name.trim();
  if (s?.sign && typeof s.sign === "string" && s.sign.trim().length > 0) return s.sign.trim();

  const sunPlanet = (chart.planets || []).find(p => p.name === "Sun");
  if (sunPlanet?.sign && typeof sunPlanet.sign === "string" && sunPlanet.sign.trim().length > 0) {
    return sunPlanet.sign.trim();
  }
  return null;
}

/**
 * Returns ISO birth date string (YYYY-MM-DD) or null.
 */
export function getBirthDate(chart) {
  if (!chart) return null;
  const d = chart.birthDate || chart.birthDateStr || chart.profile?.birthDate || chart.profile?.dob;
  if (typeof d === "string" && d.trim().length > 0) return d.trim();
  return null;
}

/**
 * Returns birth time string (HH:MM) or null.
 */
export function getBirthTime(chart) {
  if (!chart) return null;
  const t = chart.birthTime || chart.birthTimeStr || chart.time || chart.profile?.birthTime || chart.profile?.time;
  if (typeof t === "string" && t.trim().length > 0) return t.trim();
  return null;
}

/**
 * Returns birth location { latitude, longitude, timezoneId, utcOffset, city } or null.
 */
export function getBirthLocation(chart) {
  if (!chart) return null;
  const lat = chart.latitude ?? chart.lat ?? chart.profile?.latitude ?? chart.profile?.lat ?? null;
  const lon = chart.longitude ?? chart.lon ?? chart.lng ?? chart.profile?.longitude ?? chart.profile?.lon ?? chart.profile?.lng ?? null;
  const tz = chart.utcOffset ?? chart.tz ?? chart.profile?.utcOffset ?? chart.profile?.tz ?? null;
  const tzId = chart.timezoneId ?? chart.profile?.timezoneId ?? null;
  const city = chart.city || chart.place || chart.profile?.city || chart.profile?.place || null;

  if (lat === null && lon === null && tz === null && tzId === null && city === null) {
    return null;
  }

  return {
    latitude: typeof lat === "number" ? lat : (lat ? Number(lat) : null),
    longitude: typeof lon === "number" ? lon : (lon ? Number(lon) : null),
    utcOffset: typeof tz === "number" ? tz : (tz ? Number(tz) : null),
    timezoneId: tzId,
    city
  };
}

/**
 * Returns current Mahadasha { lord, startAge, endAge, startDate, endDate } or null.
 */
export function getCurrentDasha(chart) {
  if (!chart) return null;
  const cur = chart.currentDasha;
  if (cur && typeof cur === "object") {
    const lord = cur.lord || cur.mahadasha || cur.name || null;
    if (lord) {
      return {
        lord,
        startAge: cur.startAge ?? null,
        endAge: cur.endAge ?? null,
        startDate: cur.startDate ?? null,
        endDate: cur.endDate ?? null,
        ...cur
      };
    }
  }
  if (typeof cur === "string" && cur.trim().length > 0) {
    return { lord: cur.trim() };
  }

  if (Array.isArray(chart.dashaTable) && chart.dashaTable.length > 0) {
    // If native birthDate is available, find currently active dasha
    const bDate = getBirthDate(chart);
    if (bDate) {
      const birthMs = new Date(bDate).getTime();
      const nowMs = Date.now();
      const currentAge = (nowMs - birthMs) / (1000 * 60 * 60 * 24 * 365.25);
      const active = chart.dashaTable.find(d => typeof d.startAge === "number" && typeof d.endAge === "number" && currentAge >= d.startAge && currentAge < d.endAge);
      if (active) return active;
    }
    return chart.dashaTable[0];
  }
  return null;
}

/**
 * Returns current Antardasha or null.
 */
export function getCurrentAntardasha(chart) {
  if (!chart) return null;
  const cur = chart.currentDasha;
  if (cur?.antardasha) return { lord: cur.antardasha };
  if (cur?.bukthis && Array.isArray(cur.bukthis) && cur.bukthis.length > 0) {
    return cur.bukthis[0];
  }
  return null;
}

/**
 * Returns current Pratyantardasha or null.
 */
export function getCurrentPratyantardasha(chart) {
  if (!chart) return null;
  const cur = chart.currentDasha;
  if (cur?.pratyantardasha) return { lord: cur.pratyantardasha };
  return null;
}
