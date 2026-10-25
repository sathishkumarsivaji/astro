/**
 * SKR ASTRO — Canonical Chart Data Accessors
 *
 * Provides authoritative, schema-agnostic accessors for horoscope chart data.
 * Supports legacy and current data formats but strictly returns `null` when a
 * calculated field is absent or indeterminate.
 *
 * NEVER substitutes a fabricated zodiac sign, planet, or default birth date.
 */

import { toTamilRasi, toTamilNakshatra } from "../services/tamilAstrologyUtils.js";

/**
 * Standard planet alias dictionary for normalization.
 */
const PLANET_ALIASES = {
  sun: "Sun",
  surya: "Sun",
  sooriyan: "Sun",
  "ஞாயிறு": "Sun",
  "சூரியன்": "Sun",

  moon: "Moon",
  chandra: "Moon",
  chandran: "Moon",
  "திங்கள்": "Moon",
  "சந்திரன்": "Moon",

  mars: "Mars",
  kuja: "Mars",
  mangal: "Mars",
  angarak: "Mars",
  chevvai: "Mars",
  "செவ்வாய்": "Mars",

  mercury: "Mercury",
  budha: "Mercury",
  budhan: "Mercury",
  "புதன்": "Mercury",

  jupiter: "Jupiter",
  guru: "Jupiter",
  brihaspati: "Jupiter",
  vyazhan: "Jupiter",
  "குரு": "Jupiter",
  "வியாழன்": "Jupiter",

  venus: "Venus",
  shukra: "Venus",
  sukran: "Venus",
  velli: "Venus",
  "சுக்கிரன்": "Venus",
  "வெள்ளி": "Venus",

  saturn: "Saturn",
  shani: "Saturn",
  sani: "Saturn",
  "சனி": "Saturn",

  rahu: "Rahu",
  raghu: "Rahu",
  "ராகு": "Rahu",

  ketu: "Ketu",
  kethu: "Ketu",
  "கேது": "Ketu",

  ascendant: "Ascendant",
  lagna: "Ascendant",
  asc: "Ascendant",
  "லக்னம்": "Ascendant",

  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto"
};

/**
 * Resolves a house by number (1..12) from chart data without assuming array order or index.
 * Handles shuffled arrays, 1-based or 0-based objects, and nested property structures.
 * Strictly returns `null` if the house is absent; never fabricates a default sign or lord.
 *
 * @param {Object} chart - Chart object containing houses/bhavas
 * @param {number|string} houseNumber - House number between 1 and 12
 * @returns {Object|null} House object or null
 */
export function getHouseByNumber(chart, houseNumber) {
  if (!chart || typeof chart !== "object") return null;

  const num = Number(houseNumber);
  if (!Number.isInteger(num) || num < 1 || num > 12) return null;

  const houseCollections = [
    chart.houses,
    chart.bhavas,
    chart.housesDetailed,
    chart.bhavasDetailed,
    chart.bhavaData,
    chart.houseData
  ];

  for (const coll of houseCollections) {
    if (!coll) continue;

    // Array collection: match by explicit house/bhava property, NEVER by index
    if (Array.isArray(coll)) {
      const match = coll.find(h => {
        if (!h || typeof h !== "object") return false;
        const val = h.house ?? h.bhava ?? h.houseNumber ?? h.number ?? h.bhavaNumber ?? h.num ?? h.id;
        return Number(val) === num;
      });
      if (match) return match;
    } else if (typeof coll === "object") {
      // Keyed object: check direct keys
      const direct = coll[num] ??
        coll[String(num)] ??
        coll[`house${num}`] ??
        coll[`house_${num}`] ??
        coll[`H${num}`] ??
        coll[`h${num}`] ??
        coll[`bhava${num}`] ??
        coll[`bhava_${num}`];

      if (direct && typeof direct === "object") return direct;

      // Also inspect object values if keyed arbitrarily
      const values = Object.values(coll);
      const match = values.find(h => {
        if (!h || typeof h !== "object") return false;
        const val = h.house ?? h.bhava ?? h.houseNumber ?? h.number ?? h.bhavaNumber ?? h.num ?? h.id;
        return Number(val) === num;
      });
      if (match) return match;
    }
  }

  // Also check top-level chart properties like chart.house1, chart.h1, etc.
  const topLevel = chart[`house${num}`] ?? chart[`house_${num}`] ?? chart[`H${num}`] ?? chart[`h${num}`];
  if (topLevel && typeof topLevel === "object") return topLevel;

  return null;
}

/**
 * Resolves a planet by canonical name or alias (case-insensitive) from chart data.
 * Strictly returns `null` if the planet is absent; never fabricates a default planet.
 *
 * @param {Object} chart - Chart object containing planets
 * @param {string} planetName - Name or alias of the planet
 * @returns {Object|null} Planet object or null
 */
export function getPlanetByName(chart, planetName) {
  if (!chart || typeof chart !== "object" || typeof planetName !== "string") return null;

  const raw = planetName.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const canonicalName = PLANET_ALIASES[lower] || raw;

  const planetCollections = [
    chart.planets,
    chart.planetaryPositions,
    chart.grahas,
    chart.planetPositions
  ];

  for (const coll of planetCollections) {
    if (!coll) continue;

    if (Array.isArray(coll)) {
      const match = coll.find(p => {
        if (!p || typeof p !== "object") return false;
        const pName = String(p.name ?? p.planet ?? p.planetName ?? p.graha ?? "").trim();
        if (!pName) return false;
        const pLower = pName.toLowerCase();
        return pLower === lower || pName === canonicalName || PLANET_ALIASES[pLower] === canonicalName;
      });
      if (match) return match;
    } else if (typeof coll === "object") {
      const direct = coll[canonicalName] ?? coll[raw] ?? coll[lower];
      if (direct && typeof direct === "object") return direct;

      for (const [key, val] of Object.entries(coll)) {
        if (!val || typeof val !== "object") continue;
        const kLower = key.trim().toLowerCase();
        if (kLower === lower || key === canonicalName || PLANET_ALIASES[kLower] === canonicalName) {
          return val;
        }
      }
    }
  }

  // Check direct chart properties like chart.sun, chart.moon, etc.
  const directProp = chart[canonicalName.toLowerCase()] ?? chart[canonicalName];
  if (directProp && typeof directProp === "object") return directProp;

  return null;
}

/**
 * Returns normalized planetary longitude [0, 360) or null.
 *
 * @param {Object} chart - Chart object
 * @param {string} planetName - Name or alias of the planet
 * @returns {number|null} Longitude in degrees [0, 360) or null
 */
export function getPlanetLongitude(chart, planetName) {
  const p = getPlanetByName(chart, planetName);
  if (!p) return null;

  const rawDeg = p.longitude ?? p.lon ?? p.lng ?? p.degree ?? p.degrees ?? p.totalDegrees ?? p.absoluteDegree ?? p.fullDegree ?? p.absoluteLongitude;
  if (rawDeg === null || rawDeg === undefined) return null;

  const num = typeof rawDeg === "number" ? rawDeg : Number(rawDeg);
  if (!Number.isFinite(num)) return null;

  if (num >= 0 && num < 360) {
    return num;
  }
  const normalized = ((num % 360) + 360) % 360;
  return Math.round(normalized * 1e8) / 1e8;
}

/**
 * Returns planetary house placement (1..12) or null.
 *
 * @param {Object} chart - Chart object
 * @param {string} planetName - Name or alias of the planet
 * @returns {number|null} House number 1..12 or null
 */
export function getPlanetHouse(chart, planetName) {
  const p = getPlanetByName(chart, planetName);
  if (!p) return null;

  const rawHouse = p.house ?? p.bhava ?? p.houseNumber ?? p.currentHouse ?? p.rasihouse;
  if (rawHouse === null || rawHouse === undefined) return null;

  const num = typeof rawHouse === "number" ? rawHouse : parseInt(String(rawHouse), 10);
  if (Number.isInteger(num) && num >= 1 && num <= 12) {
    return num;
  }
  return null;
}

/**
 * Returns dasha timeline array from chart data or an empty array.
 *
 * @param {Object} chart - Chart object
 * @returns {Array} Dasha timeline periods or empty array
 */
export function getDashaTimeline(chart) {
  if (!chart || typeof chart !== "object") return [];

  const raw = chart.dashaTimeline ||
    chart.dashaTable ||
    chart.dashas ||
    chart.vimshottari ||
    chart.currentDasha?.timeline ||
    chart.timeline;

  return Array.isArray(raw) ? [...raw] : [];
}

/**
 * Returns requested divisional chart (varga) or null.
 *
 * @param {Object} chart - Chart object
 * @param {string} vargaName - Varga name (e.g. "D1", "D9", "D10", "navamsha", "dasamsha")
 * @returns {Object|null} Divisional chart object or null
 */
export function getDivisionalChart(chart, vargaName) {
  if (!chart || typeof chart !== "object" || typeof vargaName !== "string") return null;

  const raw = vargaName.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  const VARGA_MAP = {
    d1: "D1",
    rasi: "D1",
    rashi: "D1",
    d2: "D2",
    hora: "D2",
    d3: "D3",
    drekkana: "D3",
    drekana: "D3",
    d4: "D4",
    chaturthamsha: "D4",
    chaturthamsa: "D4",
    d7: "D7",
    saptamsha: "D7",
    saptamsa: "D7",
    d9: "D9",
    navamsha: "D9",
    navamsa: "D9",
    d10: "D10",
    dashamsha: "D10",
    dasamsha: "D10",
    d12: "D12",
    dwadashamsha: "D12",
    dwadasamsa: "D12",
    d16: "D16",
    shodashamsha: "D16",
    shodasamsa: "D16",
    d20: "D20",
    vimshamsha: "D20",
    vimsamsa: "D20",
    d24: "D24",
    chaturvimshamsha: "D24",
    siddhamsha: "D24",
    d27: "D27",
    saptavimshamsha: "D27",
    nakshatramsha: "D27",
    d30: "D30",
    trimshamsha: "D30",
    trimsamsa: "D30",
    d60: "D60",
    shashtiamsha: "D60",
    shastiamsa: "D60"
  };

  const canonicalKey = VARGA_MAP[lower] || raw;

  const vargas = chart.vargas || chart.divisionalCharts;
  if (vargas && typeof vargas === "object") {
    const match = vargas[canonicalKey] ?? vargas[raw] ?? vargas[lower];
    if (match && typeof match === "object") return match;
  }

  // Specific fallbacks
  if (canonicalKey === "D9") {
    const d9 = chart.navamsha || chart.d9Navamsha || chart.d9;
    if (d9 && typeof d9 === "object") return d9;
  } else if (canonicalKey === "D10") {
    const d10 = chart.dashamsha || chart.dasamsha || chart.d10Dasamsha || chart.d10;
    if (d10 && typeof d10 === "object") return d10;
  } else if (canonicalKey === "D1") {
    const d1 = chart.rasiChart || chart.rashiChart;
    if (d1 && typeof d1 === "object") return d1;
  }

  return null;
}

/**
 * Determines whether a context contains genuine birth chart data (planets or houses).
 *
 * @param {Object} context - Execution context or chart
 * @returns {boolean} True if chart data is present, false otherwise
 */
export function hasChartData(context) {
  if (!context || typeof context !== "object") return false;
  const chart = context.chartData || context.chart || (context.planets || context.houses ? context : null);
  if (!chart || typeof chart !== "object") return false;

  const hasPlanets = (Array.isArray(chart.planets) && chart.planets.length > 0) ||
    (chart.planets && typeof chart.planets === "object" && Object.keys(chart.planets).length > 0) ||
    (Array.isArray(chart.planetaryPositions) && chart.planetaryPositions.length > 0) ||
    (chart.planetaryPositions && typeof chart.planetaryPositions === "object" && Object.keys(chart.planetaryPositions).length > 0);

  const hasHouses = (Array.isArray(chart.houses) && chart.houses.length > 0) ||
    (chart.houses && typeof chart.houses === "object" && Object.keys(chart.houses).length > 0) ||
    (Array.isArray(chart.bhavas) && chart.bhavas.length > 0) ||
    (Array.isArray(chart.housesDetailed) && chart.housesDetailed.length > 0) ||
    (Array.isArray(chart.bhavasDetailed) && chart.bhavasDetailed.length > 0);

  const hasLagna = Boolean(chart.ascendant || chart.ascendantSign || chart.lagna);

  return Boolean(hasPlanets || hasHouses || hasLagna);
}

/**
 * Builds a canonical fail-closed INSUFFICIENT_DATA task result.
 */
export function buildInsufficientDataAnswer({
  questionId = "TASK_INSUFFICIENT_DATA",
  intent = "UNKNOWN",
  taskType = "GENERAL_EVALUATION",
  isTamil = false,
  missingInputs = ["birthChart", "planetaryPositions"],
  traditionalMethod = null,
  customDirectAnswerEn = null,
  customDirectAnswerTa = null
} = {}) {
  const directAnswer = isTamil
    ? (customDirectAnswerTa || "இந்தக் கேள்விக்குரிய ஜோதிட மதிப்பீட்டை மேற்கொள்ள தேவையான பிறப்பு ஜாதகக் கணிப்புத் தரவுகள் கிடைக்கவில்லை. துல்லியமான மதிப்பீட்டிற்கு சரிபார்க்கப்பட்ட பிறப்பு விவரங்கள் அவசியமாகும்.")
    : (customDirectAnswerEn || "Insufficient chart data to evaluate this inquiry. A verified birth chart with calculated planetary positions and house cusps is required to perform this evaluation.");

  const reason = isTamil
    ? "ஜாதகக் கணிப்பு தரவுகள் முழுமையாகக் கிடைக்கவில்லை (INSUFFICIENT_DATA)."
    : "Missing essential astronomical chart data (bhavas and planetary coordinates).";

  const limitation = isTamil
    ? "ஜாதகத் தரவுகள் இல்லாத நிலையில் எந்தவொரு பலனையோ அல்லது காலக்கட்டத்தையோ ஜோதிட ரீதியாக தீர்மானிக்க முடியாது."
    : "Astrological determinations cannot be made without verified birth chart coordinates.";

  return {
    questionId,
    intent,
    taskType,
    answerState: "INSUFFICIENT_DATA",
    directAnswer,
    reason,
    limitation,
    recommendation: null,
    candidateWindows: [],
    timingResolution: null,
    supportingClaims: [],
    limitingClaims: ["Missing calculated birth chart data."],
    missingInputs,
    traditionalMethod,
    empiricalStatus: "NOT_VALIDATED",
    calculatedFacts: [],
    traditionalRules: []
  };
}

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
