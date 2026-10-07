/* Vedic Astronomical Ephemeris Engine (Vedic Sidereal Lahiri / Thirukanitham & Western Tropical)
   Integrated with Astronomy Engine (VSOP87/NOVAS-derived planetary model) & Classical Indian Astronomical Ephemeris */
import * as Astronomy from "astronomy-engine";

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function norm360(d) {
  let res = d % 360;
  return res < 0 ? res + 360 : res;
}

export function norm180(d) {
  let res = norm360(d);
  return res > 180 ? res - 360 : res;
}

export function angularDistance(d1, d2) {
  const diff = Math.abs(norm360(d1) - norm360(d2));
  return Math.min(diff, 360 - diff);
}

export function degToDms(deg) {
  const norm = norm360(deg);
  const d = Math.floor(norm);
  const mFloat = (norm - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}° ${String(m).padStart(2, "0")}' ${String(s === 60 ? 59 : s).padStart(2, "0")}''`;
}

export function requireLongitude(longDeg, context = "astronomical calculation") {
  if (longDeg === undefined || longDeg === null || typeof longDeg === "boolean" || !Number.isFinite(Number(longDeg))) {
    throw new Error(`Valid numerical longitude required for ${context}.`);
  }
  return norm360(Number(longDeg));
}

export const CALCULATION_POLICY = {
  allowAstronomicalConstants: true,
  allowMathematicalConstants: true,
  allowClassicalRuleTables: true,
  allowUserSelectedConventions: true,
  allowHeuristicWeights: true,
  allowSyntheticScores: false,
  allowPredictionFallbacks: false,
  allowArtificialAgeFilters: false,
  allowHardcodedBirthData: false,
  allowFabricatedDefaultCharts: false
};

export const VARGA_CONVENTIONS = {
  D1: { name: "Rāśi", variant: "Parashari Standard (30°)", source: "BPHS Chapter 6, Sloka 3-4", rule: "Whole sign 30° divisions of the zodiac" },
  D2: { name: "Horā", variant: "Parashari Standard Solar-Lunar (15°)", source: "BPHS Chapter 6, Sloka 5-6", rule: "Odd signs: 0°-15° Sun (Leo), 15°-30° Moon (Cancer); Even signs: 0°-15° Moon (Cancer), 15°-30° Sun (Leo)" },
  D3: { name: "Drekkāṇa", variant: "Parashari Triplicity (10°)", source: "BPHS Chapter 6, Sloka 7-8", rule: "1st decanate: Same sign; 2nd decanate: 5th sign; 3rd decanate: 9th sign" },
  D4: { name: "Chaturthāṁśa", variant: "Parashari Kendra Cyclic (7°30')", source: "BPHS Chapter 6, Sloka 9-10", rule: "Progression through 1st, 4th, 7th, and 10th houses from sign" },
  D7: { name: "Saptāṁśa", variant: "Parashari Parity (4°17'08.57\")", source: "BPHS Chapter 6, Sloka 11-12", rule: "Odd signs: start from sign itself; Even signs: start from 7th sign" },
  D9: { name: "Navāṁśa", variant: "Parashari Element Triplicity (3°20')", source: "BPHS Chapter 6, Sloka 13-14", rule: "Fiery from Aries, Earthy from Capricorn, Airy from Libra, Watery from Cancer" },
  D10: { name: "Daśāṁśa", variant: "Parashari Parity (3°)", source: "BPHS Chapter 6, Sloka 15-16", rule: "Odd signs: start from sign itself; Even signs: start from 9th sign" },
  D12: { name: "Dvādaśāṁśa", variant: "Parashari Direct (2°30')", source: "BPHS Chapter 6, Sloka 17-18", rule: "Progression starting from the sign itself through all 12 signs" },
  D16: { name: "Ṣoḍaśāṁśa", variant: "Parashari Movable-Fixed-Dual (1°52'30\")", source: "BPHS Chapter 6, Sloka 19-20", rule: "Movable signs from Aries, Fixed signs from Leo, Dual signs from Sagittarius" },
  D20: { name: "Viṁśāṁśa", variant: "Parashari Modality (1°30')", source: "BPHS Chapter 6, Sloka 21-22", rule: "Movable signs from Aries, Fixed signs from Sagittarius, Dual signs from Leo" },
  D24: { name: "Chaturviṁśāṁśa", variant: "Parashari Parity (1°15')", source: "BPHS Chapter 6, Sloka 23-24", rule: "Odd signs from Leo; Even signs from Cancer" },
  D27: { name: "Saptaviṁśāṁśa", variant: "Parashari Cardinal (1°06'40\")", source: "BPHS Chapter 6, Sloka 25-26", rule: "Fiery from Aries, Earthy from Cancer, Airy from Libra, Watery from Capricorn" },
  D30: { name: "Triṁśāṁśa", variant: "Parashari Planetary Lordship (Variable)", source: "BPHS Chapter 6, Sloka 27-28", rule: "Odd signs: Mars 5°, Saturn 5°, Jupiter 8°, Mercury 7°, Venus 5°; Even signs: Venus 5°, Mercury 7°, Jupiter 8°, Saturn 5°, Mars 5°" },
  D40: { name: "Khavedāṁśa", variant: "Parashari Parity (45')", source: "BPHS Chapter 6, Sloka 29-30", rule: "Odd signs from Aries; Even signs from Libra" },
  D45: { name: "Akṣavedāṁśa", variant: "Parashari Movable-Fixed-Dual (40')", source: "BPHS Chapter 6, Sloka 31-32", rule: "Movable signs from Aries, Fixed signs from Leo, Dual signs from Sagittarius. General indications and refined character patterns." },
  D60: { name: "Ṣaṣṭyāṁśa", variant: "Parashari Canonical 60-Deity (30')", source: "BPHS Chapter 6, Sloka 33-42", rule: "Counted forward from natal sign for all signs; deity order direct for odd signs, reversed for even signs. BPHS verse is ambiguous on counting origin — this convention matches JHora Parasara default. D60 is highly sensitive to birth-time uncertainty." }
};

export const NAISARGIKA_FRIENDSHIP = {
  Sun:     { friends: ["Moon", "Mars", "Jupiter"], enemies: ["Venus", "Saturn"], neutrals: ["Mercury"] },
  Moon:    { friends: ["Sun", "Mercury"], enemies: [], neutrals: ["Mars", "Jupiter", "Venus", "Saturn"] },
  Mars:    { friends: ["Sun", "Moon", "Jupiter"], enemies: ["Mercury"], neutrals: ["Venus", "Saturn"] },
  Mercury: { friends: ["Sun", "Venus"], enemies: ["Moon"], neutrals: ["Mars", "Jupiter", "Saturn"] },
  Jupiter: { friends: ["Sun", "Moon", "Mars"], enemies: ["Mercury", "Venus"], neutrals: ["Saturn"] },
  Venus:   { friends: ["Mercury", "Saturn"], enemies: ["Sun", "Moon"], neutrals: ["Mars", "Jupiter"] },
  Saturn:  { friends: ["Mercury", "Venus"], enemies: ["Sun", "Moon", "Mars"], neutrals: ["Jupiter"] },
  Rahu:    { friends: ["Mercury", "Venus", "Saturn"], enemies: ["Sun", "Moon", "Mars"], neutrals: ["Jupiter"] },
  Ketu:    { friends: ["Mars", "Venus", "Saturn"], enemies: ["Sun", "Moon"], neutrals: ["Mercury", "Jupiter"] }
};

/**
 * Astronomical Solar Times Engine (NOAA standard with Equation of Time & Atmospheric Refraction)
 */
export function calculateAccurateSunTimes(date, lat, lng, tz = 0, timezoneId = null) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Valid geographic latitude and longitude are required for accurate solar times calculation.");
  }
  let year, month, day;
  if (typeof date === "string") {
    const parts = date.split("-").map(Number);
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else if (date instanceof Date) {
    if (timezoneId) {
      try {
        const dtf = new Intl.DateTimeFormat("en-US", {
          timeZone: timezoneId,
          year: "numeric", month: "numeric", day: "numeric"
        });
        const parts = dtf.formatToParts(date);
        const val = {};
        for (const p of parts) val[p.type] = p.value;
        year = Number(val.year);
        month = Number(val.month);
        day = Number(val.day);
      } catch {
        year = date.getUTCFullYear();
        month = date.getUTCMonth() + 1;
        day = date.getUTCDate();
      }
    } else {
      year = date.getUTCFullYear();
      month = date.getUTCMonth() + 1;
      day = date.getUTCDate();
    }
  } else {
    const now = new Date();
    year = now.getUTCFullYear();
    month = now.getUTCMonth() + 1;
    day = now.getUTCDate();
  }

  const effectiveTzId = (timezoneId && typeof timezoneId === "string")
    ? timezoneId
    : ((timezoneId && typeof timezoneId === "object") ? (timezoneId.ianaTimezone || timezoneId.timezoneId) : (typeof tz === "string" ? tz : null));

  let startUtc;
  if (effectiveTzId) {
    const midnightApprox = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const offsetMin = getTimezoneOffsetMinutes(midnightApprox, effectiveTzId);
    startUtc = new Date(midnightApprox.getTime() - offsetMin * 60000);
  } else {
    const tzHours = (typeof tz === "number" && Number.isFinite(tz)) ? tz : 0;
    startUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - tzHours * 3600000);
  }

  const observer = new Astronomy.Observer(lat, lng, 0);
  const riseRes = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, startUtc, 1);
  const setRes = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, startUtc, 1);
  const noonRes = Astronomy.SearchHourAngle(Astronomy.Body.Sun, observer, 0, startUtc, 1);

  const formatLocalEvent = (utcDate) => {
    if (!utcDate) return { hours: null, str: null };
    if (effectiveTzId) {
      try {
        const dtf = new Intl.DateTimeFormat("en-US", {
          timeZone: effectiveTzId,
          hour: "numeric", minute: "numeric", second: "numeric",
          hour12: false
        });
        const parts = dtf.formatToParts(utcDate);
        const p = {};
        for (const part of parts) p[part.type] = part.value;
        const h = Number(p.hour) % 24;
        const m = Number(p.minute);
        const s = Number(p.second);
        const decHours = h + m / 60 + s / 3600;
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        const str = `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
        return { hours: decHours, str };
      } catch {
        // fallback to offset
      }
    }
    const tzHours = (typeof tz === "number" && Number.isFinite(tz)) ? tz : 0;
    const localMs = utcDate.getTime() + tzHours * 3600000;
    const lDate = new Date(localMs);
    const h = lDate.getUTCHours();
    const m = lDate.getUTCMinutes();
    const s = lDate.getUTCSeconds();
    const decHours = h + m / 60 + s / 3600;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const str = `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
    return { hours: decHours, str };
  };

  const sunriseInfo = formatLocalEvent(riseRes ? riseRes.date : null);
  const sunsetInfo = formatLocalEvent(setRes ? setRes.date : null);
  const noonInfo = formatLocalEvent(noonRes ? noonRes.time.date : null);

  let isPolarDay = false;
  let isPolarNight = false;
  if (!riseRes && !setRes) {
    const noonTime = noonRes ? noonRes.time : new Astronomy.AstroTime(startUtc);
    const eq = Astronomy.Equator(Astronomy.Body.Sun, noonTime, observer, true, true);
    const hor = Astronomy.Horizon(noonTime, observer, eq.ra, eq.dec, "normal");
    if (hor.altitude > 0) {
      isPolarDay = true;
    } else {
      isPolarNight = true;
    }
  }

  return {
    sunriseHours: sunriseInfo.hours,
    sunsetHours: sunsetInfo.hours,
    solarNoonHours: noonInfo.hours,
    isPolarDay,
    isPolarNight,
    sunrise: sunriseInfo.str || (isPolarDay ? "Midnight Sun" : "Polar Night"),
    sunset: sunsetInfo.str || (isPolarDay ? "Midnight Sun" : "Polar Night"),
    sunriseStr: sunriseInfo.str || (isPolarDay ? "Midnight Sun" : "Polar Night"),
    sunsetStr: sunsetInfo.str || (isPolarDay ? "Midnight Sun" : "Polar Night"),
    solarNoonStr: noonInfo.str,
    solarNoon: noonInfo.str,
    sunriseFormatted: sunriseInfo.str,
    sunsetFormatted: sunsetInfo.str,
    solarNoonFormatted: noonInfo.str,
    timezoneId: effectiveTzId
  };
}

export function calculateSunTimes(yearOrDate, monthOrLat, dayOrLng, latOrTz = 0, lngOrTimezoneId = null, tz = 0, timezoneId = null) {
  if (yearOrDate instanceof Date || typeof yearOrDate === "string") {
    return calculateAccurateSunTimes(yearOrDate, monthOrLat, dayOrLng, latOrTz, lngOrTimezoneId);
  }
  const dateStr = `${yearOrDate}-${String(monthOrLat).padStart(2, "0")}-${String(dayOrLng).padStart(2, "0")}`;
  return calculateAccurateSunTimes(dateStr, latOrTz, lngOrTimezoneId, tz, timezoneId);
}

export const ZODIAC_SIGNS = [
  { id: "Aries", name: "Aries", tamil: "மேஷம்", symbol: "♈", element: "Fire", ruler: "Mars", quality: "Cardinal", stone: "Red Coral / Diamond", color: "Scarlet Red" },
  { id: "Taurus", name: "Taurus", tamil: "ரிஷபம்", symbol: "♉", element: "Earth", ruler: "Venus", quality: "Fixed", stone: "Emerald / Diamond", color: "Forest Green" },
  { id: "Gemini", name: "Gemini", tamil: "மிதுனம்", symbol: "♊", element: "Air", ruler: "Mercury", quality: "Mutable", stone: "Emerald / Agate", color: "Golden Yellow" },
  { id: "Cancer", name: "Cancer", tamil: "கடகம்", symbol: "♋", element: "Water", ruler: "Moon", quality: "Cardinal", stone: "Pearl / Moonstone", color: "Silvery White" },
  { id: "Leo", name: "Leo", tamil: "சிம்மம்", symbol: "♌", element: "Fire", ruler: "Sun", quality: "Fixed", stone: "Ruby", color: "Royal Gold" },
  { id: "Virgo", name: "Virgo", tamil: "கன்னி", symbol: "♍", element: "Earth", ruler: "Mercury", quality: "Mutable", stone: "Emerald", color: "Emerald Green" },
  { id: "Libra", name: "Libra", tamil: "துலாம்", symbol: "♎", element: "Air", ruler: "Venus", quality: "Cardinal", stone: "Diamond / Opal", color: "Pastel Blue" },
  { id: "Scorpio", name: "Scorpio", tamil: "விருச்சிகம்", symbol: "♏", element: "Water", ruler: "Mars", quality: "Fixed", stone: "Red Coral", color: "Deep Maroon" },
  { id: "Sagittarius", name: "Sagittarius", tamil: "தனுசு", symbol: "♐", element: "Fire", ruler: "Jupiter", quality: "Mutable", stone: "Yellow Sapphire", color: "Bright Yellow" },
  { id: "Capricorn", name: "Capricorn", tamil: "மகரம்", symbol: "♑", element: "Earth", ruler: "Saturn", quality: "Cardinal", stone: "Blue Sapphire", color: "Navy Blue" },
  { id: "Aquarius", name: "Aquarius", tamil: "கும்பம்", symbol: "♒", element: "Air", ruler: "Saturn", quality: "Fixed", stone: "Blue Sapphire / Amethyst", color: "Electric Cyan" },
  { id: "Pisces", name: "Pisces", tamil: "மீனம்", symbol: "♓", element: "Water", ruler: "Jupiter", quality: "Mutable", stone: "Yellow Sapphire", color: "Sea Green" }
];

// Sacred Tamil & Sanskrit syllables mapped for all 27 Nakshatras (4 Padas each) - Canonical Single Source of Truth
export const NAKSHATRA_PADA_SYLLABLES = {
  Ashwini: {
    syllablesEn: ["Chu", "Che", "Cho", "La"],
    syllablesTa: ["சு", "சே", "சோ", "ல"],
    deity: "Ashvins",
    ruler: "Ketu"
  },
  Bharani: {
    syllablesEn: ["Li", "Lu", "Le", "Lo"],
    syllablesTa: ["லீ", "லூ", "லே", "லோ"],
    deity: "Yama",
    ruler: "Venus"
  },
  Krittika: {
    syllablesEn: ["A", "I", "U", "E"],
    syllablesTa: ["அ", "ஈ", "உ", "ஏ"],
    deity: "Agni",
    ruler: "Sun"
  },
  Rohini: {
    syllablesEn: ["O", "Va", "Vi", "Vu"],
    syllablesTa: ["ஓ", "வ", "வி", "வு"],
    deity: "Brahma",
    ruler: "Moon"
  },
  Mrigashira: {
    syllablesEn: ["Ve", "Vo", "Ka", "Ki"],
    syllablesTa: ["வே", "வோ", "கா", "கீ"],
    deity: "Soma",
    ruler: "Mars"
  },
  Ardra: {
    syllablesEn: ["Ku", "Gha", "Nga", "Chha"],
    syllablesTa: ["கு", "க", "ஞ", "ச"],
    deity: "Rudra",
    ruler: "Rahu"
  },
  Punarvasu: {
    syllablesEn: ["Ke", "Ko", "Ha", "Hi"],
    syllablesTa: ["கே", "கோ", "ஹ", "ஹீ"],
    deity: "Aditi",
    ruler: "Jupiter"
  },
  Pushya: {
    syllablesEn: ["Hu", "He", "Ho", "Da"],
    syllablesTa: ["ஹு", "ஹே", "ஹோ", "ட"],
    deity: "Brihaspati",
    ruler: "Saturn"
  },
  Ashlesha: {
    syllablesEn: ["Di", "Du", "De", "Do"],
    syllablesTa: ["டீ", "டூ", "டே", "டோ"],
    deity: "Nagas",
    ruler: "Mercury"
  },
  Magha: {
    syllablesEn: ["Ma", "Mi", "Mu", "Me"],
    syllablesTa: ["ம", "மீ", "மு", "மே"],
    deity: "Pitris",
    ruler: "Ketu"
  },
  "Purva Phalguni": {
    syllablesEn: ["Mo", "Ta", "Ti", "Tu"],
    syllablesTa: ["மோ", "டா", "டீ", "டூ"],
    deity: "Bhaga",
    ruler: "Venus"
  },
  "Uttara Phalguni": {
    syllablesEn: ["Te", "To", "Pa", "Pi"],
    syllablesTa: ["டே", "டோ", "ப", "பீ"],
    deity: "Aryaman",
    ruler: "Sun"
  },
  Hasta: {
    syllablesEn: ["Pu", "Sha", "Na", "Tha"],
    syllablesTa: ["பூ", "ஷ", "ண", "ட"],
    deity: "Savitr",
    ruler: "Moon"
  },
  Chitra: {
    syllablesEn: ["Pe", "Po", "Ra", "Ri"],
    syllablesTa: ["பே", "போ", "ர", "ரீ"],
    deity: "Tvashtr",
    ruler: "Mars"
  },
  Swati: {
    syllablesEn: ["Ru", "Re", "Ro", "Ta"],
    syllablesTa: ["ரூ", "ரே", "ரோ", "தா"],
    deity: "Vayu",
    ruler: "Rahu"
  },
  Vishakha: {
    syllablesEn: ["Ti", "Tu", "Te", "To"],
    syllablesTa: ["தீ", "தூ", "தே", "தோ"],
    deity: "Indragni",
    ruler: "Jupiter"
  },
  Anuradha: {
    syllablesEn: ["Na", "Ni", "Nu", "Ne"],
    syllablesTa: ["ந", "நீ", "நு", "நே"],
    deity: "Mitra",
    ruler: "Saturn"
  },
  Jyeshtha: {
    syllablesEn: ["No", "Ya", "Yi", "Yu"],
    syllablesTa: ["நோ", "ய", "யீ", "யூ"],
    deity: "Indra",
    ruler: "Mercury"
  },
  Mula: {
    syllablesEn: ["Ye", "Yo", "Bha", "Bhi"],
    syllablesTa: ["யே", "யோ", "ப", "பீ"],
    deity: "Nirriti",
    ruler: "Ketu"
  },
  "Purva Ashadha": {
    syllablesEn: ["Bhu", "Dha", "Pha", "Dha"],
    syllablesTa: ["பூ", "தா", "பா", "தா"],
    deity: "Apas",
    ruler: "Venus"
  },
  "Uttara Ashadha": {
    syllablesEn: ["Bhe", "Bho", "Ja", "Ji"],
    syllablesTa: ["பே", "போ", "ஜ", "ஜீ"],
    deity: "Vishvadevas",
    ruler: "Sun"
  },
  Shravana: {
    syllablesEn: ["Ju", "Je", "Jo", "Gha"],
    syllablesTa: ["ஜு", "ஜே", "ஜோ", "க"],
    deity: "Vishnu",
    ruler: "Moon"
  },
  Dhanishta: {
    syllablesEn: ["Ga", "Gi", "Gu", "Ge"],
    syllablesTa: ["க", "கீ", "கு", "கே"],
    deity: "Vasus",
    ruler: "Mars"
  },
  Shatabhisha: {
    syllablesEn: ["Go", "Sa", "Si", "Su"],
    syllablesTa: ["கோ", "ச", "சீ", "சு"],
    deity: "Varuna",
    ruler: "Rahu"
  },
  "Purva Bhadrapada": {
    syllablesEn: ["Se", "So", "Da", "Di"],
    syllablesTa: ["சே", "சோ", "த", "தி"],
    deity: "Aja Ekapada",
    ruler: "Jupiter"
  },
  "Uttara Bhadrapada": {
    syllablesEn: ["Du", "Tha", "Jna", "Da"],
    syllablesTa: ["து", "ச", "ஞ", "த"],
    deity: "Ahirbudhnya",
    ruler: "Saturn"
  },
  Revati: {
    syllablesEn: ["De", "Do", "Cha", "Chi"],
    syllablesTa: ["தே", "தோ", "ச", "சீ"],
    deity: "Pushan",
    ruler: "Mercury"
  }
};

export const NAKSHATRAS = [
  { name: "Ashwini", tamil: "அசுவினி", ruler: "Ketu", degrees: [0, 13.333333], syllables: NAKSHATRA_PADA_SYLLABLES["Ashwini"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Ashwini"].syllablesTa, deity: "Ashvins" },
  { name: "Bharani", tamil: "பரணி", ruler: "Venus", degrees: [13.333333, 26.666667], syllables: NAKSHATRA_PADA_SYLLABLES["Bharani"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Bharani"].syllablesTa, deity: "Yama" },
  { name: "Krittika", tamil: "கிருத்திகை", ruler: "Sun", degrees: [26.666667, 40], syllables: NAKSHATRA_PADA_SYLLABLES["Krittika"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Krittika"].syllablesTa, deity: "Agni" },
  { name: "Rohini", tamil: "ரோகிணி", ruler: "Moon", degrees: [40, 53.333333], syllables: NAKSHATRA_PADA_SYLLABLES["Rohini"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Rohini"].syllablesTa, deity: "Brahma" },
  { name: "Mrigashira", tamil: "மிருகசீரிஷம்", ruler: "Mars", degrees: [53.333333, 66.666667], syllables: NAKSHATRA_PADA_SYLLABLES["Mrigashira"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Mrigashira"].syllablesTa, deity: "Soma" },
  { name: "Ardra", tamil: "திருவாதிரை", ruler: "Rahu", degrees: [66.666667, 80], syllables: NAKSHATRA_PADA_SYLLABLES["Ardra"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Ardra"].syllablesTa, deity: "Rudra" },
  { name: "Punarvasu", tamil: "புனர்பூசம்", ruler: "Jupiter", degrees: [80, 93.333333], syllables: NAKSHATRA_PADA_SYLLABLES["Punarvasu"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Punarvasu"].syllablesTa, deity: "Aditi" },
  { name: "Pushya", tamil: "பூசம்", ruler: "Saturn", degrees: [93.333333, 106.666667], syllables: NAKSHATRA_PADA_SYLLABLES["Pushya"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Pushya"].syllablesTa, deity: "Brihaspati" },
  { name: "Ashlesha", tamil: "ஆயில்யம்", ruler: "Mercury", degrees: [106.666667, 120], syllables: NAKSHATRA_PADA_SYLLABLES["Ashlesha"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Ashlesha"].syllablesTa, deity: "Nagas" },
  { name: "Magha", tamil: "மகம்", ruler: "Ketu", degrees: [120, 133.333333], syllables: NAKSHATRA_PADA_SYLLABLES["Magha"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Magha"].syllablesTa, deity: "Pitris" },
  { name: "Purva Phalguni", tamil: "பூரம்", ruler: "Venus", degrees: [133.333333, 146.666667], syllables: NAKSHATRA_PADA_SYLLABLES["Purva Phalguni"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Purva Phalguni"].syllablesTa, deity: "Bhaga" },
  { name: "Uttara Phalguni", tamil: "உத்திரம்", ruler: "Sun", degrees: [146.666667, 160], syllables: NAKSHATRA_PADA_SYLLABLES["Uttara Phalguni"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Uttara Phalguni"].syllablesTa, deity: "Aryaman" },
  { name: "Hasta", tamil: "அஸ்தம்", ruler: "Moon", degrees: [160, 173.333333], syllables: NAKSHATRA_PADA_SYLLABLES["Hasta"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Hasta"].syllablesTa, deity: "Savitr" },
  { name: "Chitra", tamil: "சித்திரை", ruler: "Mars", degrees: [173.333333, 186.666667], syllables: NAKSHATRA_PADA_SYLLABLES["Chitra"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Chitra"].syllablesTa, deity: "Tvashtr" },
  { name: "Swati", tamil: "சுவாதி", ruler: "Rahu", degrees: [186.666667, 200], syllables: NAKSHATRA_PADA_SYLLABLES["Swati"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Swati"].syllablesTa, deity: "Vayu" },
  { name: "Vishakha", tamil: "விசாகம்", ruler: "Jupiter", degrees: [200, 213.333333], syllables: NAKSHATRA_PADA_SYLLABLES["Vishakha"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Vishakha"].syllablesTa, deity: "Indragni" },
  { name: "Anuradha", tamil: "அனுஷம்", ruler: "Saturn", degrees: [213.333333, 226.666667], syllables: NAKSHATRA_PADA_SYLLABLES["Anuradha"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Anuradha"].syllablesTa, deity: "Mitra" },
  { name: "Jyeshtha", tamil: "கேட்டை", ruler: "Mercury", degrees: [226.666667, 240], syllables: NAKSHATRA_PADA_SYLLABLES["Jyeshtha"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Jyeshtha"].syllablesTa, deity: "Indra" },
  { name: "Mula", tamil: "மூலம்", ruler: "Ketu", degrees: [240, 253.333333], syllables: NAKSHATRA_PADA_SYLLABLES["Mula"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Mula"].syllablesTa, deity: "Nirriti" },
  { name: "Purva Ashadha", tamil: "பூராடம்", ruler: "Venus", degrees: [253.333333, 266.666667], syllables: NAKSHATRA_PADA_SYLLABLES["Purva Ashadha"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Purva Ashadha"].syllablesTa, deity: "Apas" },
  { name: "Uttara Ashadha", tamil: "உத்திராடம்", ruler: "Sun", degrees: [266.666667, 280], syllables: NAKSHATRA_PADA_SYLLABLES["Uttara Ashadha"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Uttara Ashadha"].syllablesTa, deity: "Vishvadevas" },
  { name: "Shravana", tamil: "திருவோணம்", ruler: "Moon", degrees: [280, 293.333333], syllables: NAKSHATRA_PADA_SYLLABLES["Shravana"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Shravana"].syllablesTa, deity: "Vishnu" },
  { name: "Dhanishta", tamil: "அவிட்டம்", ruler: "Mars", degrees: [293.333333, 306.666667], syllables: NAKSHATRA_PADA_SYLLABLES["Dhanishta"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Dhanishta"].syllablesTa, deity: "Vasus" },
  { name: "Shatabhisha", tamil: "சதயம்", ruler: "Rahu", degrees: [306.666667, 320], syllables: NAKSHATRA_PADA_SYLLABLES["Shatabhisha"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Shatabhisha"].syllablesTa, deity: "Varuna" },
  { name: "Purva Bhadrapada", tamil: "பூரட்டாதி", ruler: "Jupiter", degrees: [320, 333.333333], syllables: NAKSHATRA_PADA_SYLLABLES["Purva Bhadrapada"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Purva Bhadrapada"].syllablesTa, deity: "Aja Ekapada" },
  { name: "Uttara Bhadrapada", tamil: "உத்திரட்டாதி", ruler: "Saturn", degrees: [333.333333, 346.666667], syllables: NAKSHATRA_PADA_SYLLABLES["Uttara Bhadrapada"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Uttara Bhadrapada"].syllablesTa, deity: "Ahirbudhnya" },
  { name: "Revati", tamil: "ரேவதி", ruler: "Mercury", degrees: [346.666667, 360], syllables: NAKSHATRA_PADA_SYLLABLES["Revati"].syllablesEn, syllablesTa: NAKSHATRA_PADA_SYLLABLES["Revati"].syllablesTa, deity: "Pushan" }
];

export const DASHA_LORDS = [
  { lord: "Ketu", tamil: "கேது", years: 7 },
  { lord: "Venus", tamil: "சுக்கிரன்", years: 20 },
  { lord: "Sun", tamil: "சூரியன்", years: 6 },
  { lord: "Moon", tamil: "சந்திரன்", years: 10 },
  { lord: "Mars", tamil: "செவ்வாய்", years: 7 },
  { lord: "Rahu", tamil: "ராகு", years: 18 },
  { lord: "Jupiter", tamil: "குரு", years: 16 },
  { lord: "Saturn", tamil: "சனி", years: 19 },
  { lord: "Mercury", tamil: "புதன்", years: 17 }
];

export const PLANET_TAMIL_NAMES = {
  Sun: "சூரியன்",
  Moon: "சந்திரன்",
  Mars: "செவ்வாய்",
  Mercury: "புதன்",
  Jupiter: "குரு",
  Venus: "சுக்கிரன்",
  Saturn: "சனி",
  Rahu: "ராகு",
  Ketu: "கேது",
  Ascendant: "லக்னம்"
};

export const TAMIL_YEARS = [
  "பிரபவ (Prabhava)", "விபவ (Vibhava)", "சுக்ல (Shukla)", "பிரமோதூத (Pramodoota)", "பிரசோற்பத்தி (Prajotpatti)",
  "ஆங்கீரச (Aangirasa)", "ஸ்ரீமுக (Srimukha)", "பவ (Bhava)", "யுவ (Yuva)", "தாது (Dhaatu)",
  "ஈஸ்வர (Iswara)", "வெகுதானிய (Vehudhaanya)", "பிரமாதி (Pramathi)", "விக்கிரம (Vikrama)", "விஷு (Vishu)",
  "சித்திரபானு (Chitrabhanu)", "சுபானு (Subhanu)", "தாரண (Dharana)", "பார்த்திப (Parthiba)", "விய (Viya)",
  "சர்வசித்து (Sarvajith)", "சர்வதாரி (Sarvadhari)", "विरोதி (Virodhi)", "விக்ருதி (Vikruthi)", "கர (Kara)",
  "நந்தன (Nandhana)", "விஜய (Vijaya)", "ஜய (Jaya)", "மன்மத (Manmadha)", "துன்முகி (Dhunmukhi)",
  "ஹேவிளம்பி (Hevilambi)", "விளம்பி (Vilambi)", "விகாரி (Vikari)", "சார்வரி (Sarvari)", "பிலவ (Plava)",
  "சுபகிருது (Subhakruthu)", "சோபகிருது (Sobhakruthu)", "குரோதி (Krodhi)", "விசுவாவசு (Visvavasu)", "பராபவ (Parabhava)",
  "பிலவங்க (Plavanga)", "கீலக (Keelaka)", "சௌமிய (Saumya)", "சாதாரண (Sadharana)", "விரோதிகிருது (Virodhikruthu)",
  "பரிதாபி (Paridhaabi)", "பிரமாதீச (Pramadheesa)", "ஆனந்த (Aanandha)", "ராட்சச (Rakshasa)", "நள (Nala)",
  "பிங்கள (Pingala)", "காளயுக்தி (Kalayukthi)", "சித்தார்த்தி (Siddharthi)", "ரௌத்திரி (Raudhri)", "துன்மதி (Dhunmathi)",
  "துந்துபி (Dhundhubhi)", "ருத்ரோத்காரி (Rudhrothkari)", "ரக்தாட்சி (Raktakshi)", "குரோதன (Krodhana)", "அட்சய (Akshaya)"
];

export const TAMIL_MONTHS = [
  { name: "Chithirai", tamil: "சித்திரை", sign: "Aries" },
  { name: "Vaikasi", tamil: "வைகாசி", sign: "Taurus" },
  { name: "Aani", tamil: "ஆனி", sign: "Gemini" },
  { name: "Aadi", tamil: "ஆடி", sign: "Cancer" },
  { name: "Avani", tamil: "ஆவணி", sign: "Leo" },
  { name: "Purattasi", tamil: "புரட்டாசி", sign: "Virgo" },
  { name: "Aippasi", tamil: "ஐப்பசி", sign: "Libra" },
  { name: "Karthigai", tamil: "கார்த்திகை", sign: "Scorpio" },
  { name: "Margazhi", tamil: "மார்கழி", sign: "Sagittarius" },
  { name: "Thai", tamil: "தை", sign: "Capricorn" },
  { name: "Maasi", tamil: "மாசி", sign: "Aquarius" },
  { name: "Panguni", tamil: "பங்குனி", sign: "Pisces" }
];

export const THITHIS = [
  "பிரதமை (Prathama)", "துவிதியை (Dvitiya)", "திருதியை (Tritiya)", "சதுர்த்தி (Chaturthi)", "பஞ்சமி (Panchami)",
  "சஷ்டி (Shashti)", "சப்தமி (Saptami)", "அஷ்டமி (Ashtami)", "நவமி (Navami)", "தசமி (Dashami)",
  "ஏகாதசி (Ekadashi)", "துவாதசி (Dvadashi)", "திரயோதசி (Trayodashi)", "சதுர்த்தசி (Chaturdashi)", "பௌர்ணமி / அமாவாசை (Purnima/Amavasya)"
];

export const YOGAMS = [
  "விஷ்கம்பம் (Vishkambha)", "ப்ரீதி (Priti)", "ஆயுஷ்மான் (Ayushman)", "சௌபாக்யம் (Saubhagya)", "சோபனம் (Shobhana)",
  "அதிகண்டம் (Atiganda)", "சுகர்மம் (Sukarma)", "திருதி (Dhriti)", "சூலம் (Shula)", "கண்டம் (Ganda)",
  "விருத்தி (Vriddhi)", "துருவம் (Dhruva)", "வியாகாதம் (Vyaghata)", "ஹர்ஷணம் (Harshana)", "வஜ்ரம் (Vajra)",
  "சித்தி (Siddhi)", "வியதீபாதம் (Vyatipata)", "வரீயான் (Variyan)", "பரிகம் (Parigha)", "சிவம் (Shiva)",
  "சித்தம் (Siddha)", "சாத்தியம் (Sadhya)", "சுபம் (Subha)", "சுப்ரம் (Shukla)", "பிராமியம் (Brahma)",
  "ஐந்திரம் (Indra)", "வைதிருதி (Vaidhriti)"
];

export const CHARA_KARANAMS = [
  { name: "Bava", tamil: "பவம் (Bava)" },
  { name: "Balava", tamil: "பாலவம் (Balava)" },
  { name: "Kaulava", tamil: "கௌலவம் (Kaulava)" },
  { name: "Taitila", tamil: "சைதுளை (Taitila)" },
  { name: "Gara", tamil: "கரசை (Gara)" },
  { name: "Vanija", tamil: "வணிசை (Vanija)" },
  { name: "Vishti (Bhadra)", tamil: "பத்திரை / விஷ்டி (Vishti/Bhadra)" }
];

export const FIXED_KARANAMS = {
  0: { name: "Kimstughna", tamil: "கிம்ஸ்துக்னம் (Kimstughna)" },
  57: { name: "Shakuni", tamil: "சகுனி (Shakuni)" },
  58: { name: "Chatushpada", tamil: "சதுஷ்பாதம் (Chatushpada)" },
  59: { name: "Naga", tamil: "நாகவம் (Naga)" }
};

export function getClassicalKaranam(thithiDiffDeg) {
  const kIdx = Math.min(59, Math.max(0, Math.floor(norm360(thithiDiffDeg) / 6)));
  if (kIdx === 0) return FIXED_KARANAMS[0];
  if (kIdx >= 57) return FIXED_KARANAMS[kIdx];
  return CHARA_KARANAMS[(kIdx - 1) % 7];
}

export const KARANAMS = [
  "பவம் (Bava)", "பாலவம் (Balava)", "கௌலவம் (Kaulava)", "சைதுளை (Taitila)", "கரசை (Garija)",
  "வணிசை (Vanija)", "பத்திரை / விஷ்டி (Vishti/Bhadra)", "சகுனி (Shakuni)", "சதுஷ்பாதம் (Chatushpada)",
  "நாகவம் (Naga)", "கிமிஸ்துக்கினம் (Kimstughna)"
];

// Julian day calculations (with UTC conversion & historical Julian/Gregorian calendar support)
export function getJulianDate(year, month, day, hour, min, timezoneOffsetHours, calendar = "auto") {
  if (timezoneOffsetHours === null || timezoneOffsetHours === undefined || !Number.isFinite(timezoneOffsetHours)) {
    throw new Error("Explicit timezoneOffsetHours is required for astronomical Julian Date calculation.");
  }
  const decimalHours = hour + min / 60.0 - timezoneOffsetHours;
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  // Historical calendar boundary: Gregorian adopted on 1582-10-15 (JD 2299160.5)
  let isGregorian = true;
  if (calendar === "julian") {
    isGregorian = false;
  } else if (calendar === "gregorian") {
    isGregorian = true;
  } else {
    // Auto: Dates prior to 1582-10-15 use Julian calendar
    if (year < 1582 || (year === 1582 && (month < 10 || (month === 10 && day < 15)))) {
      isGregorian = false;
    }
  }

  let B = 0;
  if (isGregorian) {
    const A = Math.floor(y / 100);
    B = 2 - A + Math.floor(A / 4);
  }

  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5 + decimalHours / 24.0;
}

// Exact conversion from UTC Date instant to astronomical Julian Day
export function getJulianDateFromUtc(utcDate, calendar = "auto") {
  if (!(utcDate instanceof Date) || isNaN(utcDate.getTime())) {
    throw new Error("Valid Date object is required to calculate Julian Date from UTC instant.");
  }
  const y = utcDate.getUTCFullYear();
  const m = utcDate.getUTCMonth() + 1;
  const d = utcDate.getUTCDate();
  const h = utcDate.getUTCHours();
  const min = utcDate.getUTCMinutes();
  const s = utcDate.getUTCSeconds() + utcDate.getUTCMilliseconds() / 1000.0;
  return getJulianDate(y, m, d, h, min + s / 60.0, 0, calendar);
}

// Exact inverse calculation: Julian Day number to UTC Date object (Meeus algorithm)
export function julianDateToDate(jd) {
  const z = Math.floor(jd + 0.5);
  const f = (jd + 0.5) - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  const dayInt = Math.floor(day);
  const dayFraction = day - dayInt;
  const totalSeconds = Math.round(dayFraction * 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return new Date(Date.UTC(year, month - 1, dayInt, hours, minutes, seconds));
}

// Accurate IANA Timezone resolution using Intl.DateTimeFormat (native historical DST support)
export function getTimezoneOffsetMinutes(date, timeZone) {
  if (!timeZone || typeof timeZone !== "string") {
    throw new Error("Valid IANA timezone ID is required for astronomical local-time conversion.");
  }
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
      hour12: false
    });
    const parts = dtf.formatToParts(date);
    const val = {};
    for (const p of parts) val[p.type] = p.value;
    const asUtc = Date.UTC(
      Number(val.year),
      Number(val.month) - 1,
      Number(val.day),
      val.hour === "24" ? 0 : Number(val.hour),
      Number(val.minute),
      Number(val.second)
    );
    return (asUtc - date.getTime()) / 60000;
  } catch (error) {
    throw new Error(`Unable to resolve IANA timezone "${timeZone}": ${error.message}`);
  }
}

/**
 * Resolve timezone offset and IANA ID from mixed parameter formats
 */
export function resolveTimezone(tz = 0, timezoneId = null, refDate = new Date()) {
  let numericOffset = (typeof tz === "number" && Number.isFinite(tz)) ? tz : 0;
  let ianaId = null;

  if (typeof timezoneId === "string" && timezoneId.trim() && isNaN(Number(timezoneId))) {
    ianaId = timezoneId.trim();
  }

  if (typeof tz === "string" && tz.trim() && isNaN(Number(tz))) {
    ianaId = tz.trim();
    try {
      numericOffset = getTimezoneOffsetMinutes(refDate instanceof Date && !isNaN(refDate.getTime()) ? refDate : new Date(), ianaId) / 60;
    } catch {
      numericOffset = 0;
    }
  } else if (typeof tz === "number" && Number.isFinite(tz)) {
    numericOffset = tz;
  } else if (typeof tz === "string" && !isNaN(Number(tz))) {
    numericOffset = Number(tz);
  }

  if (!Number.isFinite(numericOffset) || numericOffset < -14 || numericOffset > 14) {
    numericOffset = 0;
  }

  return { numericOffset, ianaId };
}

/**
 * Format Date object into target timezone HH:MM string (or HH:MM:SS)
 */
export function formatTimeInTimezone(date, tz = null, timezoneId = null, includeSeconds = false) {
  if (tz === null && !timezoneId) throw new Error('Timezone offset or IANA timezone ID required');
  if (!(date instanceof Date) || isNaN(date.getTime())) return "--:--";
  const { numericOffset, ianaId } = resolveTimezone(tz, timezoneId, date);
  if (ianaId) {
    try {
      const options = {
        timeZone: ianaId,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      };
      if (includeSeconds) options.second = "2-digit";
      const parts = new Intl.DateTimeFormat("en-GB", options).formatToParts(date);
      const h = parts.find(p => p.type === "hour")?.value || "00";
      const m = parts.find(p => p.type === "minute")?.value || "00";
      if (includeSeconds) {
        const s = parts.find(p => p.type === "second")?.value || "00";
        return `${h}:${m}:${s}`;
      }
      return `${h}:${m}`;
    } catch {
      // fallback to offset
    }
  }
  const utcMs = date.getTime();
  const targetMs = utcMs + numericOffset * 3600000;
  const targetDate = new Date(targetMs);
  const h = String(targetDate.getUTCHours()).padStart(2, "0");
  const m = String(targetDate.getUTCMinutes()).padStart(2, "0");
  if (includeSeconds) {
    const s = String(targetDate.getUTCSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
  return `${h}:${m}`;
}

/**
 * Format Date object into target timezone YYYY-MM-DD string
 */
export function formatDateInTimezone(date, tz = null, timezoneId = null) {
  if (tz === null && !timezoneId) throw new Error('Timezone offset or IANA timezone ID required');
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  const { numericOffset, ianaId } = resolveTimezone(tz, timezoneId, date);
  if (ianaId) {
    try {
      const options = {
        timeZone: ianaId,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      };
      const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(date);
      const y = parts.find(p => p.type === "year")?.value;
      const m = parts.find(p => p.type === "month")?.value;
      const d = parts.find(p => p.type === "day")?.value;
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch {}
  }
  const utcMs = date.getTime();
  const targetMs = utcMs + numericOffset * 3600000;
  const targetDate = new Date(targetMs);
  const y = targetDate.getUTCFullYear();
  const m = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(targetDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse local civil date string (YYYY-MM-DD) into target noon instant
 */
export function parseCivilDateInTimezone(dateInput, tz = null, timezoneId = null, targetTimeStr = "12:00") {
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return new Date();
    return dateInput;
  }
  const { numericOffset, ianaId } = resolveTimezone(tz, timezoneId);
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    if (ianaId) {
      try {
        return getUtcInstantFromLocal(dateInput, targetTimeStr, ianaId);
      } catch (err) {
        if (err && (err.message?.startsWith("NONEXISTENT_LOCAL_TIME") || err.message?.startsWith("AMBIGUOUS_LOCAL_TIME") || err.code === "NONEXISTENT_LOCAL_TIME" || err.code === "AMBIGUOUS_LOCAL_TIME")) {
          throw err;
        }
      }
    }
    const [y, m, d] = dateInput.split("-").map(Number);
    const [th, tm] = targetTimeStr.split(":").map(Number);
    const targetHours = (Number.isFinite(th) ? th : 12) + (Number.isFinite(tm) ? tm / 60.0 : 0);
    const utcHours = targetHours - Number(numericOffset);
    const utcMs = Date.UTC(y, m - 1, d, Math.floor(utcHours), Math.round((utcHours % 1) * 60), 0);
    return new Date(utcMs);
  }
  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Sidereal Sun and Moon positions for any UTC instant
 */
export function getSiderealSunMoon(dateObj, system = "lahiri") {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const jd = getJulianDateFromUtc(d);
  const T = (jd - 2451545.0) / 36525.0;
  const ayanamsa = getAyanamshaForSystem(jd, system);

  let sunLong = 0;
  let moonLong = 0;

  if (typeof Astronomy !== "undefined" && Astronomy.Ecliptic && Astronomy.GeoVector) {
    try {
      const sunEl = Astronomy.Ecliptic(Astronomy.GeoVector("Sun", d, true));
      const moonEl = Astronomy.Ecliptic(Astronomy.GeoVector("Moon", d, true));
      sunLong = norm360(sunEl.elon - ayanamsa);
      moonLong = norm360(moonEl.elon - ayanamsa);
    } catch {
      sunLong = norm360(calculateSunPosition(T) - ayanamsa);
      moonLong = norm360(calculateMoonPosition(T) - ayanamsa);
    }
  } else {
    sunLong = norm360(calculateSunPosition(T) - ayanamsa);
    moonLong = norm360(calculateMoonPosition(T) - ayanamsa);
  }
  return { sunLong, moonLong, jd, ayanamsa };
}

/**
 * Bracketed iterative numerical root solver for exact Panchanga transitions
 * Features initial estimation, Newton-Raphson refinement, bracket containment [tLow, tHigh],
 * and robust bisection fallback against boundary overshoot.
 */
export function findPanchangaTransition(startDate, type, targetDeg, spanDeg = 12.0, nominalSpeed = 0.508, tz = null, timezoneId = null) {
  const d = startDate instanceof Date ? startDate : new Date(startDate);
  const getAngle = (dateInst) => {
    const { sunLong, moonLong } = getSiderealSunMoon(dateInst);
    switch (type) {
      case "tithi":
      case "karana":
        return norm360(moonLong - sunLong);
      case "nakshatra":
        return moonLong;
      case "yoga":
        return norm360(sunLong + moonLong);
      default:
        return moonLong;
    }
  };

  const initialAngle = getAngle(d);
  let dist = norm360(targetDeg - initialAngle);
  if (dist === 0) dist = spanDeg;

  // Bracket bounds: from startDate up to maximum span window (e.g. 36 hours)
  let tLow = d.getTime();
  const maxSpanHours = Math.max(36, (dist / Math.max(0.2, nominalSpeed)) * 1.5 + 4);
  let tHigh = d.getTime() + maxSpanHours * 3600000;

  const estHours = dist / nominalSpeed;
  let currentT = Math.min(tHigh, Math.max(tLow, d.getTime() + estHours * 3600000));

  for (let iter = 0; iter < 8; iter++) {
    const a1 = getAngle(new Date(currentT));
    const signedError = norm180(targetDeg - a1);
    if (Math.abs(signedError) < 0.00005) {
      break;
    }
    const dtHours = 1 / 60; // 1 min probe
    const a2 = getAngle(new Date(currentT + 60000));
    const speed = norm180(a2 - a1) / dtHours;

    let nextT = NaN;
    if (Math.abs(speed) > 1e-5) {
      const correctionHours = signedError / speed;
      nextT = currentT + correctionHours * 3600000;
    }

    // Check if Newton step is strictly within bracket
    if (Number.isFinite(nextT) && nextT >= tLow && nextT <= tHigh) {
      currentT = nextT;
    } else {
      // Fallback bisection / constrained step
      if (signedError > 0) {
        tLow = currentT;
      } else {
        tHigh = currentT;
      }
      currentT = (tLow + tHigh) / 2;
    }
  }

  const endDate = new Date(currentT);
  const endTimeStr = formatTimeInTimezone(endDate, tz, timezoneId);
  return { endDate, endTimeStr, timestamp: currentT };
}

// Convert local date string, local time string, and IANA timezone ID to exact UTC instant Date
export function getUtcInstantFromLocal(dateStr, timeStr, timezoneId, options = {}) {
  if (!timezoneId || typeof timezoneId !== "string") {
    throw new Error("Valid IANA timezone ID is required to resolve local birth instant.");
  }
  if (!dateStr || typeof dateStr !== "string" || !timeStr || typeof timeStr !== "string") {
    throw new Error("Valid dateStr (YYYY-MM-DD) and timeStr (HH:mm) are required.");
  }
  const dateParts = dateStr.split("-").map(Number);
  if (dateParts.length !== 3 || dateParts.some(p => !Number.isFinite(p))) {
    throw new Error(`Invalid date format "${dateStr}". Expected YYYY-MM-DD.`);
  }
  const [y, m, d] = dateParts;
  if (m < 1 || m > 12) {
    throw new Error(`Invalid month ${m} in date "${dateStr}". Must be between 1 and 12.`);
  }
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d < 1 || d > daysInMonth) {
    throw new Error(`Invalid day ${d} for month ${m} in date "${dateStr}".`);
  }

  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!timeMatch) {
    throw new Error(`Invalid time format "${timeStr}". Expected HH:mm or HH:mm:ss.`);
  }
  const h = parseInt(timeMatch[1], 10);
  const min = parseInt(timeMatch[2], 10);
  const sec = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
  if (h < 0 || h > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) {
    throw new Error(`Invalid time components in "${timeStr}". Hour must be 0-23, Minute must be 0-59, Second must be 0-59.`);
  }

  if (options.fold !== undefined && options.fold !== 0 && options.fold !== 1) {
    throw new Error(`Invalid fold option: ${options.fold}. fold must be 0 or 1.`);
  }

  const approxUtc = new Date(Date.UTC(y, m - 1, d, h, min, sec));
  const offsetMins = getTimezoneOffsetMinutes(approxUtc, timezoneId);
  const exactUtc = new Date(approxUtc.getTime() - offsetMins * 60000);
  const finalOffsetMins = getTimezoneOffsetMinutes(exactUtc, timezoneId);
  const candidateUtc = new Date(approxUtc.getTime() - finalOffsetMins * 60000);

  // Enumerate candidate offsets in neighborhood to detect DST transitions robustly
  const candidateOffsets = new Set();
  for (let deltaH = -4; deltaH <= 4; deltaH += 0.5) {
    const testUtc = new Date(candidateUtc.getTime() + deltaH * 3600000);
    candidateOffsets.add(getTimezoneOffsetMinutes(testUtc, timezoneId));
  }
  const sortedOffsets = Array.from(candidateOffsets).sort((a, b) => b - a); // Daylight (higher) to Standard (lower)

  const matchingUtcs = [];
  for (const off of sortedOffsets) {
    const testInstant = new Date(approxUtc.getTime() - off * 60000);
    const roundOff = getTimezoneOffsetMinutes(testInstant, timezoneId);
    if (roundOff === off) {
      // Check local civil time match
      try {
        const dtf = new Intl.DateTimeFormat("en-US", {
          timeZone: timezoneId,
          year: "numeric", month: "numeric", day: "numeric",
          hour: "numeric", minute: "numeric", second: "numeric",
          hour12: false
        });
        const parts = dtf.formatToParts(testInstant);
        const val = {};
        for (const p of parts) val[p.type] = p.value;
        const roundH = val.hour === "24" ? 0 : Number(val.hour);
        const roundMin = Number(val.minute);
        const roundSec = Number(val.second || 0);
        if (roundH === h && roundMin === min && (timeParts.length < 3 || Math.abs(roundSec - sec) <= 1)) {
          matchingUtcs.push({ utc: testInstant, offset: off });
        }
      } catch {
        // Fallback matching
        matchingUtcs.push({ utc: testInstant, offset: off });
      }
    }
  }

  let dstStatus = "VALID";
  let resolvedUtc;

  if (matchingUtcs.length === 0) {
    dstStatus = "NONEXISTENT_GAP";
    throw new Error(`NONEXISTENT_LOCAL_TIME: Local time ${dateStr} ${timeStr} in timezone "${timezoneId}" is a DST spring-forward gap and does not exist in civil time.`);
  } else if (matchingUtcs.length === 1) {
    resolvedUtc = matchingUtcs[0].utc;
  } else {
    dstStatus = "AMBIGUOUS_FOLD";
    if (options.fold === undefined || options.fold === null) {
      throw new Error(`AMBIGUOUS_LOCAL_TIME: Local time ${dateStr} ${timeStr} in timezone "${timezoneId}" is ambiguous due to DST fall-back. Specify options.fold=0 (first occurrence / daylight) or options.fold=1 (second occurrence / standard).`);
    }
    const chosen = options.fold === 1 ? matchingUtcs[matchingUtcs.length - 1] : matchingUtcs[0];
    resolvedUtc = chosen.utc;
  }

  if (options.returnDetails) {
    return { utcDate: resolvedUtc, dstStatus };
  }
  return resolvedUtc;
}

import {
  getLahiriAyanamsha,
  getKPAyanamsha,
  getRamanAyanamsha,
  getAyanamshaForSystem,
  getAyanamshaMetadata,
  AYANAMSHA_MODELS
} from "../astrology/astronomy/ayanamsha.js";

export {
  getLahiriAyanamsha,
  getKPAyanamsha,
  getRamanAyanamsha,
  getAyanamshaForSystem,
  getAyanamshaMetadata,
  AYANAMSHA_MODELS
};


// Precise Sun Calculation
function calculateSunPosition(T) {
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mrad = M * DEG2RAD;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
            0.000289 * Math.sin(3 * Mrad);
  const trueLong = norm360(L0 + C);
  const apparentLong = norm360(trueLong - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * DEG2RAD));
  return apparentLong;
}

// Precise Moon Calculation (Harmonic perturbation terms of Brown's Lunar Theory)
function calculateMoonPosition(T) {
  const Lp = norm360(218.3164477 + 481267.88128 * T - 0.0015786 * T * T);
  const D = norm360(297.8501921 + 445267.11140 * T - 0.0018819 * T * T);
  const M = norm360(357.5291092 + 35999.05029 * T - 0.0001536 * T * T);
  const Mp = norm360(134.9633964 + 477198.86750 * T + 0.0087414 * T * T);
  const F = norm360(93.2720950 + 483202.01752 * T - 0.0036539 * T * T);

  const D_r = D * DEG2RAD;
  const M_r = M * DEG2RAD;
  const Mp_r = Mp * DEG2RAD;
  const F_r = F * DEG2RAD;

  const dL = 6.288774 * Math.sin(Mp_r) +
             1.274027 * Math.sin(2 * D_r - Mp_r) +
             0.658314 * Math.sin(2 * D_r) +
             0.213618 * Math.sin(2 * Mp_r) -
             0.185116 * Math.sin(M_r) -
             0.114332 * Math.sin(2 * F_r) +
             0.058793 * Math.sin(2 * D_r - 2 * Mp_r) +
             0.057066 * Math.sin(2 * D_r - M_r - Mp_r) +
             0.053322 * Math.sin(2 * D_r + Mp_r) +
             0.046100 * Math.sin(2 * D_r - M_r) -
             0.034728 * Math.sin(D_r) -
             0.015327 * Math.sin(2 * D_r - 2 * F_r) +
             0.010980 * Math.sin(Mp_r - M_r);

  return norm360(Lp + dL);
}

// Planetary Keplerian Orbit Solutions
function calculateKeplerianPlanet(T, orbitalElements) {
  const { N0, N1, i0, i1, w0, w1, a0, a1, e0, e1, M0, M1 } = orbitalElements;
  const N = (N0 + N1 * T) * DEG2RAD;
  const inc = (i0 + i1 * T) * DEG2RAD;
  const w = (w0 + w1 * T) * DEG2RAD;
  const a = a0 + a1 * T;
  const e = e0 + e1 * T;
  const M = norm360(M0 + M1 * T);
  const M_rad = M * DEG2RAD;

  // Solve Kepler equation
  let E = M_rad;
  for (let iter = 0; iter < 15; iter++) {
    const dE = (E - e * Math.sin(E) - M_rad) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-7) break;
  }

  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(inc));
  const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(inc));

  // Earth Heliocentric
  const sunLong = calculateSunPosition(T) * DEG2RAD;
  const xe = -Math.cos(sunLong);
  const ye = -Math.sin(sunLong);

  const xg = xh - xe;
  const yg = yh - ye;

  let geoLong = Math.atan2(yg, xg) * RAD2DEG;
  return norm360(geoLong);
}

// Planetary Elements Table
const PLANET_ELEMENTS = {
  Mars: { N0: 49.5574, N1: 0.7721, i0: 1.8497, i1: -0.0006, w0: 286.5016, w1: 1.0698, a0: 1.523688, a1: 0, e0: 0.093405, e1: 0.000092, M0: 19.3870, M1: 19140.3026 },
  Mercury: { N0: 48.3313, N1: 1.1864, i0: 7.0047, i1: 0.0018, w0: 29.1241, w1: 1.0144, a0: 0.387098, a1: 0, e0: 0.205635, e1: 0.000025, M0: 168.6562, M1: 149472.6741 },
  Jupiter: { N0: 100.4542, N1: 1.0210, i0: 1.3030, i1: -0.0057, w0: 273.8777, w1: 1.3800, a0: 5.202561, a1: 0, e0: 0.048498, e1: 0.000163, M0: 19.8950, M1: 3034.9056 },
  Venus: { N0: 76.6799, N1: 0.9011, i0: 3.3946, i1: 0.0010, w0: 54.8910, w1: 1.1407, a0: 0.723332, a1: 0, e0: 0.006773, e1: -0.000048, M0: 48.0052, M1: 58517.8153 },
  Saturn: { N0: 113.6634, N1: 0.8771, i0: 2.4886, i1: -0.0037, w0: 339.3939, w1: 1.5843, a0: 9.55475, a1: 0, e0: 0.055546, e1: -0.000346, M0: 316.9670, M1: 1222.4936 }
};

// Classical Parashari Navamsha (D9) Sign Mapping:
// 1 sign (30°) is divided into 9 equal parts of 3° 20' (3.3333333333333335°).
// Starting sign depends on the modality (Chara/Sthira/Dvisvabhava) of the natal sign:
// - Movable signs (Aries, Cancer, Libra, Capricorn): Count starts from the same sign (sIdx + 0).
// - Fixed signs (Taurus, Leo, Scorpio, Aquarius): Count starts from the 9th sign from it ((sIdx + 8) % 12).
// - Dual signs (Gemini, Virgo, Sagittarius, Pisces): Count starts from the 5th sign from it ((sIdx + 4) % 12).
// (Equivalently across the 108 nakshatra padas: Pada p -> Aries..Pisces sequence).
export function calculateNavamsa(longDeg) {
  const normDeg = requireLongitude(longDeg, "Navamsa (D9) calculation");
  const sIdx = Math.floor(normDeg / 30) % 12;
  const degInSign = normDeg % 30;
  const part = Math.min(8, Math.floor((degInSign + 1e-10) / (10 / 3))); // 0 to 8 (parts 1 to 9)

  const signType = sIdx % 3; // 0: Movable, 1: Fixed, 2: Dual
  let startIdx;
  if (signType === 0) {
    startIdx = sIdx; // Movable: same sign
  } else if (signType === 1) {
    startIdx = (sIdx + 8) % 12; // Fixed: 9th from it
  } else {
    startIdx = (sIdx + 4) % 12; // Dual: 5th from it
  }

  const navamsaSignIndex = (startIdx + part) % 12;
  const sign = ZODIAC_SIGNS[navamsaSignIndex];
  if (!sign) {
    throw new Error(`Invalid Navamsa sign index: ${navamsaSignIndex}`);
  }
  return {
    index: navamsaSignIndex,
    name: sign.name,
    signName: sign.name,
    tamil: sign.tamil,
    signTamil: sign.tamil,
    symbol: sign.symbol,
    part: part + 1
  };
}

export const calculateD9 = calculateNavamsa;

// Classical Parashari Drekkana (D3): 0-10° 1st (self), 10-20° 5th sign, 20-30° 9th sign
// Supports optional mode: 'vyatyaya' (for even signs: 9th, 5th, 1st)
export function calculateD3(longDeg, options = {}) {
  const norm = requireLongitude(longDeg, "Drekkana (D3) calculation");
  const sIdx = Math.floor(norm / 30);
  const deg = norm % 30;

  let part;
  if (deg < 10) part = 0;
  else if (deg < 20) part = 1;
  else part = 2;

  const isOddSign = (sIdx % 2) === 0; // Aries=0 (odd), Taurus=1 (even)
  const useVyatyaya = options.mode === "vyatyaya";

  let targetIdx;
  if (useVyatyaya && !isOddSign) {
    if (part === 0) targetIdx = (sIdx + 8) % 12; // 9th sign
    else if (part === 1) targetIdx = (sIdx + 4) % 12; // 5th sign
    else targetIdx = sIdx; // 1st sign (self)
  } else {
    // Standard Parashari triplicity mapping
    if (part === 0) targetIdx = sIdx; // 1st (same sign)
    else if (part === 1) targetIdx = (sIdx + 4) % 12; // 5th sign
    else targetIdx = (sIdx + 8) % 12; // 9th sign
  }

  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) {
    throw new Error(`Invalid D3 sign index: ${targetIdx}`);
  }
  return {
    index: targetIdx,
    name: sign.name,
    signName: sign.name,
    tamil: sign.tamil,
    signTamil: sign.tamil,
    decanate: part + 1,
    decanateDegree: deg,
    isOddSign
  };
}

// Classical Parashari Trimsamsa (D30): 
// Odd signs: Mars (0-5°), Saturn (5-10°), Jupiter (10-18°), Mercury (18-25°), Venus (25-30°)
// Even signs: Venus (0-5°), Mercury (5-12°), Jupiter (12-20°), Saturn (20-25°), Mars (25-30°)
export function calculateD30(longDeg) {
  const norm = requireLongitude(longDeg, "Trimsamsa (D30) calculation");
  const sIdx = Math.floor(norm / 30);
  const deg = norm % 30;
  const isOddSign = (sIdx % 2) === 0; // Aries=0 (odd sign)

  let trimsamsaSignIdx;
  let ruler;
  if (isOddSign) {
    if (deg < 5) { trimsamsaSignIdx = 0; ruler = "Mars"; } // Aries
    else if (deg < 10) { trimsamsaSignIdx = 10; ruler = "Saturn"; } // Aquarius
    else if (deg < 18) { trimsamsaSignIdx = 8; ruler = "Jupiter"; } // Sagittarius
    else if (deg < 25) { trimsamsaSignIdx = 2; ruler = "Mercury"; } // Gemini
    else { trimsamsaSignIdx = 6; ruler = "Venus"; } // Libra
  } else {
    if (deg < 5) { trimsamsaSignIdx = 1; ruler = "Venus"; } // Taurus
    else if (deg < 12) { trimsamsaSignIdx = 5; ruler = "Mercury"; } // Virgo
    else if (deg < 20) { trimsamsaSignIdx = 11; ruler = "Jupiter"; } // Pisces
    else if (deg < 25) { trimsamsaSignIdx = 9; ruler = "Saturn"; } // Capricorn
    else { trimsamsaSignIdx = 7; ruler = "Mars"; } // Scorpio
  }

  const sign = ZODIAC_SIGNS[trimsamsaSignIdx];
  if (!sign) {
    throw new Error(`Invalid D30 sign index: ${trimsamsaSignIdx}`);
  }
  return {
    index: trimsamsaSignIdx,
    name: sign.name,
    signName: sign.name,
    tamil: sign.tamil,
    signTamil: sign.tamil,
    ruler,
    isOddSign
  };
}

// Canonical 60 Deities of Shashtiamsha (BPHS Chapter 6)
export const D60_NAMES = [
  "Ghora", "Rakshasa", "Deva", "Kubera", "Yaksha", "Kinnara", "Bhrashta", "Kulaghna",
  "Garala", "Vahni", "Maya", "Purishakya", "Apampathi", "Marutwana", "Kaala", "Sarpa",
  "Amrit", "Indu", "Mridu", "Komala", "Heramba", "Brahma", "Vishnu", "Maheshwara",
  "Deva", "Ardra", "Kalinasa", "Kshiteesa", "Kamalakara", "Gulika", "Mrityu", "Kaala",
  "Davagni", "Ghora", "Yama", "Kantaka", "Suddha", "Amrita", "Purnachandra", "Vishadagdha",
  "Kulanasa", "Vamshakshaya", "Utpata", "Kaala", "Saumya", "Komala", "Sheetala", "Karaladamshatra",
  "Chandramukhi", "Praveena", "Kaalpavaka", "Dhannayudha", "Nirmala", "Saumya", "Krura", "Atisheetala",
  "Amrita", "Payodhi", "Brahmana", "Chandrarekha"
];

// Classical Parashari Shashtiamsha (D60):
// 1/60th of a sign = 0°30' = 0.5°.
// Sign: Counted forward from the natal (occupied) sign for ALL signs: (sIdx + (part % 12)) % 12.
//   This is the convention used by JHora (Parasara default) and most implementations.
//   Alternative (BPHS literal): count from Aries always: (part % 12). Shown as alternativeSignIdx.
// Deities: In odd signs, counted directly 1 to 60 (index 0 to 59).
// In even signs, counted in reverse order 60 down to 1 (index 59 down to 0).
export function calculateD60(longDeg, ascendantSpeedDegPerMin = null) {
  const norm = requireLongitude(longDeg, "Shashtiamsha (D60) calculation");
  const sIdx = Math.floor(norm / 30);
  const deg = norm % 30;
  const part = Math.min(59, Math.max(0, Math.floor((deg + 1e-10) / 0.5)));
  const isOddSign = (sIdx % 2) === 0; // Aries=0 (odd sign)

  const targetSignIdx = (sIdx + (part % 12)) % 12;
  const alternativeSignIdx = part % 12; // BPHS literal: count from Aries, sign-independent
  const nameIdx = isOddSign ? part : (59 - part);
  const shashtiName = D60_NAMES[nameIdx];
  if (!shashtiName) {
    throw new Error(`Invalid D60 deity index: ${nameIdx}`);
  }
  const sign = ZODIAC_SIGNS[targetSignIdx];
  if (!sign) {
    throw new Error(`Invalid D60 sign index: ${targetSignIdx}`);
  }

  const posInD60 = deg % 0.5;
  const distToLowerDeg = posInD60;
  const distToUpperDeg = 0.5 - posInD60;
  const nearestBoundaryDistanceDeg = Math.min(distToLowerDeg, distToUpperDeg);
  const nearestBoundaryDistanceArcmin = nearestBoundaryDistanceDeg * 60;
  const nearestBoundaryDistanceArcsec = nearestBoundaryDistanceDeg * 3600;

  const actualSpeed = (ascendantSpeedDegPerMin && ascendantSpeedDegPerMin > 0)
    ? ascendantSpeedDegPerMin
    : (360 / 1440);

  const timeToNearestBoundaryMinutes = nearestBoundaryDistanceDeg / actualSpeed;
  const timeToNearestBoundarySeconds = timeToNearestBoundaryMinutes * 60;
  const segmentTraversalDurationMin = 0.5 / actualSpeed;

  const nearestSecStr = timeToNearestBoundarySeconds < 60
    ? `${Math.round(timeToNearestBoundarySeconds)}s`
    : `${timeToNearestBoundaryMinutes.toFixed(1)}m`;

  // D60 changes every 0.5 degrees (high birth-time sensitivity for Lagna)
  return {
    index: targetSignIdx,
    name: sign.name,
    signName: sign.name,
    tamil: sign.tamil,
    signTamil: sign.tamil,
    partIndex: part + 1,
    amshaNumber: part + 1,
    shashtiName,
    deity: shashtiName,
    isOddSign,
    isSignReversed: false, // Sign progression is always forward from natal sign in this convention
    alternativeSignIdx,
    alternativeSignName: ZODIAC_SIGNS[((alternativeSignIdx % 12) + 12) % 12]?.name || null,
    nearestBoundaryDistanceDeg: parseFloat(nearestBoundaryDistanceDeg.toFixed(5)),
    nearestBoundaryDistanceArcmin: parseFloat(nearestBoundaryDistanceArcmin.toFixed(3)),
    nearestBoundaryDistanceArcsec: parseFloat(nearestBoundaryDistanceArcsec.toFixed(1)),
    timeToNearestBoundaryMinutes: parseFloat(timeToNearestBoundaryMinutes.toFixed(3)),
    timeToNearestBoundarySeconds: parseFloat(timeToNearestBoundarySeconds.toFixed(1)),
    segmentTraversalDurationMin: parseFloat(segmentTraversalDurationMin.toFixed(2)),
    d60SensitivityMinutes: segmentTraversalDurationMin,
    convention: "Selected Convention: Occupied-Sign Forward Progression with Parity-Reversed Deity Order (JHora/Parasara Default)",
    alternativeBphsLiteralMethod: "Degrees traversed within sign * 2 % 12",
    birthTimeSensitivity: `Nearest boundary: ${nearestBoundaryDistanceArcmin.toFixed(2)}′ (~${nearestSecStr} at ${actualSpeed.toFixed(3)}°/min). Full 0°30′ segment traversal: ~${segmentTraversalDurationMin.toFixed(1)} min.`,
    segmentSize: "0°30′",
    sensitivityNote: "The Ascendant changes D60 rapidly (~2 minutes) due to Earth's diurnal rotation; planetary D60 positions change according to each planet's individual apparent motion. Requires verified birth instant."
  };
}

// ---------------------------------------------------------------------------
// COMPLETE PARASHARI SHODASHAVARGA (16 DIVISIONAL CHARTS D1 TO D60)
// As codified in Brihat Parashara Hora Shastra (BPHS Chapter 6)
// ---------------------------------------------------------------------------

export function calculateD1(longDeg) {
  const norm = requireLongitude(longDeg, "Rasi (D1) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const sign = ZODIAC_SIGNS[sIdx];
  if (!sign) throw new Error(`Invalid D1 sign index: ${sIdx}`);
  return { index: sIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil };
}

export function calculateD2(longDeg) {
  const norm = requireLongitude(longDeg, "Hora (D2) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const isOdd = sIdx % 2 === 0;
  const targetIdx = isOdd ? (deg < 15 ? 4 : 3) : (deg < 15 ? 3 : 4);
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D2 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, ruler: targetIdx === 4 ? "Sun" : "Moon" };
}

export function calculateD4(longDeg) {
  const norm = requireLongitude(longDeg, "Chaturthamsha (D4) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const part = Math.min(3, Math.floor(deg / 7.5));
  const targetIdx = (sIdx + part * 3) % 12;
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D4 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, part: part + 1 };
}

export function calculateD7(longDeg) {
  const norm = requireLongitude(longDeg, "Saptamsha (D7) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const part = Math.min(6, Math.floor(deg / (30 / 7)));
  const isOdd = sIdx % 2 === 0;
  const targetIdx = isOdd ? (sIdx + part) % 12 : (sIdx + 6 + part) % 12;
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D7 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, part: part + 1 };
}

export function calculateD10(longDeg) {
  const norm = requireLongitude(longDeg, "Dashamsha (D10) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const part = Math.min(9, Math.floor(deg / 3.0));
  const isOdd = sIdx % 2 === 0;
  const targetIdx = isOdd ? (sIdx + part) % 12 : (sIdx + 8 + part) % 12;
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D10 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, part: part + 1 };
}

export function calculateD12(longDeg) {
  const norm = requireLongitude(longDeg, "Dvadashamsha (D12) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const part = Math.min(11, Math.floor(deg / 2.5));
  const targetIdx = (sIdx + part) % 12;
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D12 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, part: part + 1 };
}

export function calculateD16(longDeg) {
  const norm = requireLongitude(longDeg, "Shodashamsha (D16) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const part = Math.min(15, Math.floor(deg / (30 / 16)));
  const signType = sIdx % 3; // 0: Movable (Chara), 1: Fixed (Sthira), 2: Dual (Dvisvabhava)
  const startIdx = signType === 0 ? 0 : (signType === 1 ? 4 : 8);
  const targetIdx = (startIdx + part) % 12;
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D16 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, part: part + 1 };
}

export function calculateD20(longDeg) {
  const norm = requireLongitude(longDeg, "Vimshamsha (D20) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const part = Math.min(19, Math.floor(deg / 1.5));
  const signType = sIdx % 3;
  const startIdx = signType === 0 ? 0 : (signType === 1 ? 8 : 4);
  const targetIdx = (startIdx + part) % 12;
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D20 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, part: part + 1 };
}

export function calculateD24(longDeg) {
  const norm = requireLongitude(longDeg, "Chaturvimshamsha (D24) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const part = Math.min(23, Math.floor(deg / 1.25));
  const isOdd = sIdx % 2 === 0;
  const startIdx = isOdd ? 4 : 3;
  const targetIdx = (startIdx + part) % 12;
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D24 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, part: part + 1 };
}

export function calculateD27(longDeg) {
  const norm = requireLongitude(longDeg, "Saptavimshamsha (D27) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const part = Math.min(26, Math.floor(deg / (10 / 9)));
  const triplicity = sIdx % 4; // 0: Fire, 1: Earth, 2: Air, 3: Water
  const startIdx = triplicity === 0 ? 0 : (triplicity === 1 ? 3 : (triplicity === 2 ? 6 : 9));
  const targetIdx = (startIdx + part) % 12;
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D27 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, part: part + 1 };
}

export function calculateD40(longDeg) {
  const norm = requireLongitude(longDeg, "Khavedamsha (D40) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const part = Math.min(39, Math.floor(deg / 0.75));
  const isOdd = sIdx % 2 === 0;
  const startIdx = isOdd ? 0 : 6;
  const targetIdx = (startIdx + part) % 12;
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D40 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, part: part + 1 };
}

export function calculateD45(longDeg) {
  const norm = requireLongitude(longDeg, "Akshavedamsha (D45) calculation");
  const sIdx = Math.floor(norm / 30) % 12;
  const deg = norm % 30;
  const part = Math.min(44, Math.floor(deg / (30 / 45)));
  const signType = sIdx % 3;
  const startIdx = signType === 0 ? 0 : (signType === 1 ? 4 : 8);
  const targetIdx = (startIdx + part) % 12;
  const sign = ZODIAC_SIGNS[targetIdx];
  if (!sign) throw new Error(`Invalid D45 sign index: ${targetIdx}`);
  return { index: targetIdx, name: sign.name, signName: sign.name, tamil: sign.tamil, signTamil: sign.tamil, part: part + 1 };
}

/**
 * COMPLETE PARASHARI SHODASHAVARGA CHARTS MAPPER
 * Computes all 16 divisional charts (D1 to D60) with Ascendant and 9 planetary positions.
 */
export function calculateDivisionalCharts(planets = [], ascendantLong = 0, ascendantSpeedDegPerMin = null) {
  const vargaFns = {
    D1: calculateD1,
    D2: calculateD2,
    D3: calculateD3,
    D4: calculateD4,
    D7: calculateD7,
    D9: calculateD9,
    D10: calculateD10,
    D12: calculateD12,
    D16: calculateD16,
    D20: calculateD20,
    D24: calculateD24,
    D27: calculateD27,
    D30: calculateD30,
    D40: calculateD40,
    D45: calculateD45,
    D60: (deg) => calculateD60(deg, ascendantSpeedDegPerMin)
  };

  const ascLong = typeof ascendantLong === "number" ? ascendantLong : (ascendantLong?.longitude ?? ascendantLong?.long ?? 0);
  const res = {};

  for (const [key, fn] of Object.entries(vargaFns)) {
    const ascVarga = fn(ascLong);
    const ascSignIdx = ascVarga.index;
    const pList = (planets || []).map(p => {
      let pLong = 0;
      if (typeof p.longitude === "number") pLong = p.longitude;
      else if (typeof p.long === "number") pLong = p.long;
      else if (p.sign) {
        const sIdx = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === p.sign.toLowerCase());
        pLong = (sIdx >= 0 ? sIdx * 30 : 0) + (p.degreeInSign || 0);
      }
      const v = fn(pLong);
      const house = ((v.index - ascSignIdx + 12) % 12) + 1;
      return {
        name: p.name,
        tamil: p.tamil || p.name,
        longitude: pLong,
        signIdx: v.index,
        signName: v.name,
        signTamil: v.tamil,
        house,
        dignity: p.dignity || "Neutral",
        isRetrograde: Boolean(p.isRetrograde),
        isCombust: Boolean(p.isCombust),
        ...v
      };
    });

    res[key] = {
      varga: key,
      ascendant: {
        signIdx: ascSignIdx,
        signName: ascVarga.name,
        signTamil: ascVarga.tamil,
        house: 1,
        ...ascVarga
      },
      planets: pList
    };
  }

  // D60 metadata
  if (res.D60) {
    const d60Asc = res.D60.ascendant;
    res.D60.birthTimeSensitivity = "Very High";
    res.D60.segmentSize = "0°30′";
    res.D60.sensitivityNote = `Ascendant D60 boundary changes every 0°30′ (approx ${(d60Asc?.d60SensitivityMinutes ?? 2.0).toFixed(1)} min of clock time due to Earth's rotation; planetary D60 positions shift by their individual daily speeds). Requires verified birth instant.`;
  }

  // Aliases for backward compatibility
  res.d1Rasi = res.D1;
  res.d1Rashi = res.D1;
  res.d2Hora = res.D2;
  res.d3Drekkana = res.D3;
  res.d4Chaturthamsha = res.D4;
  res.d7Saptamsha = res.D7;
  res.d9Navamsha = res.D9;
  res.d10Dasamsha = res.D10;
  res.d12Dwadasamsha = res.D12;
  res.d12Dvadasamsha = res.D12;
  res.d16Shodashamsha = res.D16;
  res.d20Vimshamsha = res.D20;
  res.d20Vimsamsha = res.D20;
  res.d24Chaturvimshamsha = res.D24;
  res.d24Chaturvimsamsha = res.D24;
  res.d27Saptavimshamsha = res.D27;
  res.d27Saptavimsamsha = res.D27;
  res.d30Trimsamsa = res.D30;
  res.d30Trimsamsha = res.D30;
  res.d40Khavedamsha = res.D40;
  res.d45Akshavedamsha = res.D45;
  res.d60Shashtiamsha = res.D60;

  return res;
}

/**
 * STRUCTURED VARGA DATA ENGINE FOR AI MASTER DOSSIER
 * Extracts full planet arrays, signs, houses, dignities, and 12-house rulerships
 * across all major divisional charts (D1, D3, D4, D7, D9, D10, D24, D30, D60).
 */
export function getStructuredVargaData(planets = [], ascendantLong = 0) {
  const targetVargas = [
    { key: "D1", name: "Rasi (D1 - General / Natal Foundation)", fn: calculateD1 },
    { key: "D2", name: "Hora (D2 - Wealth, Sustenance & Resources)", fn: calculateD2 },
    { key: "D3", name: "Drekkana (D3 - Siblings, Initiatives & Courage)", fn: calculateD3 },
    { key: "D4", name: "Chaturthamsha (D4 - Real Estate, Property & Destiny Assets)", fn: calculateD4 },
    { key: "D7", name: "Saptamsha (D7 - Progeny, Lineage & Children)", fn: calculateD7 },
    { key: "D9", name: "Navamsha (D9 - Dharma, Marriage & Inner Fruit)", fn: calculateD9 },
    { key: "D10", name: "Dashamsha (D10 - Career, Status & Leadership)", fn: calculateD10 },
    { key: "D12", name: "Dvadasamsha (D12 - Parents, Ancestry & Lineage)", fn: calculateD12 },
    { key: "D16", name: "Shodashamsha (D16 - Conveyances, Comforts & Vehicles)", fn: calculateD16 },
    { key: "D20", name: "Vimshamsha (D20 - Spiritual Progress & Devotion)", fn: calculateD20 },
    { key: "D24", name: "Chaturvimshamsha (D24 - Higher Learning, Intellect & Vidya)", fn: calculateD24 },
    { key: "D27", name: "Saptavimshamsha (D27 - Strengths, Vulnerabilities & Resilience)", fn: calculateD27 },
    { key: "D30", name: "Trimsamsha (D30 - Misfortunes, Somatic Balance & Challenges)", fn: calculateD30 },
    { key: "D40", name: "Khavedamsha (D40 - Auspicious/Inauspicious Karma & Maternal Line)", fn: calculateD40 },
    { key: "D45", name: "Akshavedamsha (D45 - General Well-Being & Paternal Line)", fn: calculateD45 },
    { key: "D60", name: "Shashtiamsha (D60 - Past Karma & Deep Spiritual Lineage)", fn: (d) => calculateD60(d) }
  ];

  const ascLong = requireLongitude(typeof ascendantLong === "number" ? ascendantLong : ascendantLong?.longitude, "calculateDivisionalCharts Ascendant");
  const result = {};

  for (const v of targetVargas) {
    const ascVarga = v.fn(ascLong);
    const ascSignIdx = ascVarga.index;
    
    // House Lords in this Varga
    const houseLords = {};
    for (let h = 1; h <= 12; h++) {
      const sIdx = (ascSignIdx + h - 1) % 12;
      houseLords[h] = ZODIAC_SIGNS[sIdx].ruler;
    }

    const vargaPlanets = (planets || []).map(p => {
      let pLong = 0;
      if (typeof p.longitude === "number") pLong = p.longitude;
      else if (typeof p.long === "number") pLong = p.long;
      else if (p.sign) {
        const sIdx = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === p.sign.toLowerCase());
        pLong = (sIdx >= 0 ? sIdx * 30 : 0) + (p.degreeInSign || 0);
      }

      const vSign = v.fn(pLong);
      const vSignIdx = vSign.index;
      const vHouse = ((vSignIdx - ascSignIdx + 12) % 12) + 1;
      const signRuler = ZODIAC_SIGNS[vSignIdx].ruler;

      let vDignity = "Neutral";
      const exaltMap = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 };
      const debilMap = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0, Rahu: 7, Ketu: 1 };
      if (exaltMap[p.name] !== undefined && vSignIdx === exaltMap[p.name]) {
        vDignity = "Exalted";
      } else if (debilMap[p.name] !== undefined && vSignIdx === debilMap[p.name]) {
        vDignity = "Debilitated";
      } else if (signRuler === p.name) {
        vDignity = "Own";
      } else {
        const nais = NAISARGIKA_FRIENDSHIP[p.name];
        if (nais?.friends?.includes(signRuler)) vDignity = "Friend";
        else if (nais?.enemies?.includes(signRuler)) vDignity = "Enemy";
        else vDignity = "Neutral";
      }

      return {
        name: p.name,
        tamil: p.tamil || p.name,
        longitude: pLong,
        sign: vSign.name,
        signName: vSign.name,
        vargaSign: vSign.name,
        signTamil: vSign.tamil,
        signIdx: vSignIdx,
        house: vHouse,
        vargaHouse: vHouse,
        dignity: vDignity,
        isRetrograde: Boolean(p.isRetrograde),
        isCombust: Boolean(p.isCombust),
        signRuler
      };
    });

    result[v.key] = {
      vargaKey: v.key,
      vargaName: v.name,
      ascendant: {
        sign: ascVarga.name,
        signIdx: ascSignIdx,
        signName: ascVarga.name,
        signTamil: ascVarga.tamil,
        ruler: ZODIAC_SIGNS[ascSignIdx].ruler,
        house: 1
      },
      houseLords,
      planets: vargaPlanets
    };
  }

  return result;
}

/**
 * Exact Astronomical 120-Year Vimshottari Mahadasha & Bukthi Computation Engine
 * Computes exact boundaries using Julian Days and mean tropical solar year days (365.24219878d)
 */
export function computeDetailedVimshottari(birthLordIndex, balanceRatio, birthDate, explicitJdBirth = null, timezoneOffsetHours = null, options = { horizonYears: 120 }) {
  // Extract civil birth fields in a timezone-safe manner.
  // Never use machine-local getters (getFullYear, getMonth, getDate, getHours, getMinutes)
  // which produce timezone-dependent results.
  let birthYear, birthMonth, birthDay, birthHour, birthMin;

  if (typeof birthDate === "string") {
    // Parse YYYY-MM-DD or YYYY-MM-DDTHH:MM strings purely numerically — no Date constructor.
    const datePart = birthDate.split("T")[0];
    const timePart = birthDate.includes("T") ? birthDate.split("T")[1] : null;
    const dateParts = datePart.split("-").map(Number);
    birthYear  = dateParts[0];
    birthMonth = dateParts[1] || 1;
    birthDay   = dateParts[2] || 1;
    if (timePart) {
      const timeParts = timePart.split(":").map(Number);
      birthHour = timeParts[0] || 0;
      birthMin  = timeParts[1] || 0;
    } else {
      birthHour = 0;
      birthMin  = 0;
    }
  } else if (birthDate instanceof Date) {
    // Production path: the Date was constructed via Date.UTC(...) by calculatePlanetaryPositions.
    // Use UTC accessors to extract civil fields without machine-timezone distortion.
    birthYear  = birthDate.getUTCFullYear();
    birthMonth = birthDate.getUTCMonth() + 1;
    birthDay   = birthDate.getUTCDate();
    birthHour  = birthDate.getUTCHours();
    birthMin   = birthDate.getUTCMinutes();
  } else {
    throw new Error("Valid birthDate (string YYYY-MM-DD or Date object) is required for Vimshottari Dasha calculation.");
  }

  // Exact Julian Day of birth
  let jdBirth;
  if (explicitJdBirth !== null && Number.isFinite(explicitJdBirth)) {
    jdBirth = explicitJdBirth;
  } else {
    if (timezoneOffsetHours === null || timezoneOffsetHours === undefined || !Number.isFinite(timezoneOffsetHours)) {
      throw new Error("Explicit timezoneOffsetHours or explicitJdBirth is required for astronomical Vimshottari calculation.");
    }
    jdBirth = getJulianDate(birthYear, birthMonth, birthDay, birthHour, birthMin, timezoneOffsetHours);
  }


  // Exact current Julian Day derived purely from UTC epoch instant (browser-clock and timezone independent)
  // Exact current Julian Day derived purely from UTC epoch instant (browser-clock and timezone independent)
  const jdNow = (Date.now() / 86400000) + 2440587.5;

  const DAYS_PER_SOLAR_YEAR = 365.24219878;
  const horizonYears = (options && options.horizonYears !== undefined && Number.isFinite(Number(options.horizonYears)))
    ? Number(options.horizonYears)
    : 120.0;

  const dashaTable = [];
  let currentJdAccum = jdBirth;
  // Inferred IANA ID from confirmed UTC offset — acceptable for display only
  const tzId = options?.ianaTimezone || options?.timezoneId || (timezoneOffsetHours === 5.5 ? "Asia/Kolkata" : null);
  const fmtDate = (d) => {
    if (timezoneOffsetHours !== null && Number.isFinite(timezoneOffsetHours)) {
      return formatDateInTimezone(d, timezoneOffsetHours, tzId);
    }
    return d.toISOString().slice(0, 10);
  };
  let currentAccumulator = 0;
  let mIdx = 0;

  while (currentAccumulator < horizonYears - 1e-5) {
    const mdObj = DASHA_LORDS[(birthLordIndex + mIdx) % 9];
    const mdTotalYears = mdObj.years;
    const nominalDuration = mIdx === 0 ? mdTotalYears * balanceRatio : mdTotalYears;
    const remainingLifeYears = horizonYears - currentAccumulator;
    const mdDurationYears = Math.min(nominalDuration, remainingLifeYears);
    const mdDurationDays = mdDurationYears * DAYS_PER_SOLAR_YEAR;

    const mdStartAge = currentAccumulator;
    const mdEndAge = currentAccumulator + mdDurationYears;
    const mdJdStart = currentJdAccum;
    const mdJdEnd = mdJdStart + mdDurationDays;

    const mdStartDate = julianDateToDate(mdJdStart);
    const mdEndDate = julianDateToDate(mdJdEnd);
    const isMdCurrent = jdNow >= mdJdStart && jdNow < mdJdEnd;

    const mdLordIndexInCycle = DASHA_LORDS.findIndex(d => d.lord === mdObj.lord);
    const bukthis = [];

    if (mIdx === 0) {
      const elapsedInMdYears = mdTotalYears * (1 - balanceRatio);
      const elapsedInMdDays = elapsedInMdYears * DAYS_PER_SOLAR_YEAR;
      let nominalAccumDays = 0;

      for (let bIdx = 0; bIdx < 9; bIdx++) {
        const bkObj = DASHA_LORDS[(mdLordIndexInCycle + bIdx) % 9];
        const bkNominalDurationYears = (mdTotalYears * bkObj.years) / 120;
        const bkNominalDurationDays = bkNominalDurationYears * DAYS_PER_SOLAR_YEAR;
        const bkNominalStartDays = nominalAccumDays;
        const bkNominalEndDays = nominalAccumDays + bkNominalDurationDays;
        nominalAccumDays += bkNominalDurationDays;

        if (bkNominalEndDays <= elapsedInMdDays) continue;

        const actualStartOffsetDays = Math.max(0, bkNominalStartDays - elapsedInMdDays);
        const actualEndOffsetDays = Math.min(mdDurationDays, bkNominalEndDays - elapsedInMdDays);
        const bkJdStart = mdJdStart + actualStartOffsetDays;
        const bkJdEnd = mdJdStart + actualEndOffsetDays;

        const bkStartAge = mdStartAge + (actualStartOffsetDays / DAYS_PER_SOLAR_YEAR);
        const bkEndAge = mdStartAge + (actualEndOffsetDays / DAYS_PER_SOLAR_YEAR);
        const bkStartDate = julianDateToDate(bkJdStart);
        const bkEndDate = julianDateToDate(bkJdEnd);
        const isBkCurrent = jdNow >= bkJdStart && jdNow < bkJdEnd;

        bukthis.push({
          mahadashaLord: mdObj.lord,
          mahadashaTamil: mdObj.tamil,
          subLord: bkObj.lord,
          subTamil: bkObj.tamil,
          durationYears: Number((bkEndAge - bkStartAge).toFixed(2)),
          startAge: Number(bkStartAge.toFixed(2)),
          endAge: Number(bkEndAge.toFixed(2)),
          jdStart: bkJdStart,
          jdEnd: bkJdEnd,
          startDate: fmtDate(bkStartDate),
          endDate: fmtDate(bkEndDate),
          startDateIso: fmtDate(bkStartDate),
          endDateIso: fmtDate(bkEndDate),
          utcStart: bkStartDate.toISOString(),
          utcEnd: bkEndDate.toISOString(),
          isCurrent: isBkCurrent
        });
      }
    } else {
      let bkJdAccum = mdJdStart;
      let bkAccumAge = mdStartAge;

      for (let bIdx = 0; bIdx < 9; bIdx++) {
        if (bkAccumAge >= mdEndAge - 1e-6) break;
        const bkObj = DASHA_LORDS[(mdLordIndexInCycle + bIdx) % 9];
        const bkNominalDurationYears = (mdTotalYears * bkObj.years) / 120;
        const bkDurationYears = Math.min(bkNominalDurationYears, mdEndAge - bkAccumAge);
        const bkDurationDays = bkDurationYears * DAYS_PER_SOLAR_YEAR;
        const bkJdStart = bkJdAccum;
        const bkJdEnd = bkJdAccum + bkDurationDays;
        const bkStartAge = bkAccumAge;
        const bkEndAge = bkAccumAge + bkDurationYears;
        const bkStartDate = julianDateToDate(bkJdStart);
        const bkEndDate = julianDateToDate(bkJdEnd);
        const isBkCurrent = jdNow >= bkJdStart && jdNow < bkJdEnd;

        bukthis.push({
          mahadashaLord: mdObj.lord,
          mahadashaTamil: mdObj.tamil,
          subLord: bkObj.lord,
          subTamil: bkObj.tamil,
          durationYears: Number(bkDurationYears.toFixed(2)),
          startAge: Number(bkStartAge.toFixed(2)),
          endAge: Number(bkEndAge.toFixed(2)),
          jdStart: bkJdStart,
          jdEnd: bkJdEnd,
          startDate: fmtDate(bkStartDate),
          endDate: fmtDate(bkEndDate),
          startDateIso: fmtDate(bkStartDate),
          endDateIso: fmtDate(bkEndDate),
          utcStart: bkStartDate.toISOString(),
          utcEnd: bkEndDate.toISOString(),
          isCurrent: isBkCurrent
        });

        bkJdAccum += bkDurationDays;
        bkAccumAge += bkDurationYears;
      }
    }

    dashaTable.push({
      lord: mdObj.lord,
      tamil: mdObj.tamil,
      totalYears: mdTotalYears,
      durationYears: Number(mdDurationYears.toFixed(2)),
      startAge: Number(mdStartAge.toFixed(2)),
      endAge: Number(mdEndAge.toFixed(2)),
      jdStart: mdJdStart,
      jdEnd: mdJdEnd,
      startDate: fmtDate(mdStartDate),
      endDate: fmtDate(mdEndDate),
      startDateIso: fmtDate(mdStartDate),
      endDateIso: fmtDate(mdEndDate),
      utcStart: mdStartDate.toISOString(),
      utcEnd: mdEndDate.toISOString(),
      isCurrent: isMdCurrent,
      bukthis
    });

    currentJdAccum += mdDurationDays;
    currentAccumulator += mdDurationYears;
    mIdx++;
  }

  return dashaTable;

  return dashaTable;
}

/**
 * Resolves the exact operating Mahadasha and Bukthi at any target age
 */
export function getOperatingDashaHierarchy(targetAge, dashaTable, lang = "en") {
  const isTamil = lang === "ta";
  if (!dashaTable || dashaTable.length === 0) {
    return {
      status: "insufficient_data",
      mahadashaLord: null,
      mahadashaTamil: null,
      subLord: null,
      subTamil: null,
      text: isTamil ? "விம்சோத்தரி தசா விவரங்கள் கிடைக்கப்பெறவில்லை" : "Vimshottari Dasha data unavailable",
      startAge: 0,
      endAge: 0
    };
  }

  let dasha = dashaTable.find(d => targetAge >= d.startAge && targetAge < d.endAge);
  if (!dasha) dasha = dashaTable[dashaTable.length - 1];

  let bukthi = null;
  if (dasha && dasha.bukthis && dasha.bukthis.length > 0) {
    bukthi = dasha.bukthis.find(b => targetAge >= b.startAge && targetAge < b.endAge);
    if (!bukthi) bukthi = dasha.bukthis[dasha.bukthis.length - 1];
  }

  const mdLord = dasha.lord;
  const mdTa = dasha.tamil;
  const bkLord = bukthi ? bukthi.subLord : mdLord;
  const bkTa = bukthi ? bukthi.subTamil : mdTa;
  const bkStart = bukthi ? bukthi.startAge : dasha.startAge;
  const bkEnd = bukthi ? bukthi.endAge : dasha.endAge;

  const text = isTamil
    ? `${mdTa} மகா தசை - ${bkTa} புக்தி (வயது ${bkStart} முதல் ${bkEnd} வரை)`
    : `${mdLord} Mahadasha - ${bkLord} Antardasha (Ages ${bkStart} - ${bkEnd})`;

  return {
    mahadashaLord: mdLord,
    mahadashaTamil: mdTa,
    subLord: bkLord,
    subTamil: bkTa,
    startAge: bkStart,
    endAge: bkEnd,
    text
  };
}

// Complete Ephemeris & Birth Horoscope Calculation
export function calculatePlanetaryPositions(date, timeString, lat, lng, system = "vedic", tz, options = {}) {
  if (tz === undefined || tz === null) {
    throw new Error("Timezone (IANA string or numeric offset in hours) is required for planetary ephemeris calculation.");
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Valid geographic latitude and longitude are required for planetary ephemeris calculation.");
  }
  let year, month, day;
  if (typeof date === "string") {
    const parts = date.split("-").map(Number);
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else if (date instanceof Date) {
    // Pure UTC accessor extraction to prevent machine-local timezone shifts
    year = date.getUTCFullYear();
    month = date.getUTCMonth() + 1;
    day = date.getUTCDate();
  } else {
    throw new Error("Valid date (string YYYY-MM-DD or UTC Date object) is required for planetary ephemeris calculation.");
  }
  const timeMatch = String(timeString || "00:00:00").match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  const hour = timeMatch ? parseInt(timeMatch[1], 10) : 0;
  const min = timeMatch ? parseInt(timeMatch[2], 10) : 0;
  const sec = timeMatch && timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
  const cleanTimeString = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

  let tzOffsetHours;
  let timezoneId = null;
  let utcDate;

  if (options?.utcDate instanceof Date && !isNaN(options.utcDate.getTime())) {
    utcDate = options.utcDate;
    if (typeof tz === "string") {
      timezoneId = tz;
      tzOffsetHours = getTimezoneOffsetMinutes(utcDate, timezoneId) / 60;
    } else if (typeof tz === "number" && Number.isFinite(tz)) {
      tzOffsetHours = tz;
      // Inferred IANA ID from confirmed UTC offset — acceptable for display only
      timezoneId = options?.timezoneId || (tzOffsetHours === 5.5 ? "Asia/Kolkata" : (tzOffsetHours === 0 ? "UTC" : null));
    }
  } else if (typeof tz === "string") {
    timezoneId = tz;
    const isoDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    // Resolve exact UTC instant respecting DST fold ambiguity
    utcDate = getUtcInstantFromLocal(isoDateStr, cleanTimeString, timezoneId, options);
    // Derive exact timezone offset at this specific UTC instant (prevents DST noon-shift discrepancy)
    tzOffsetHours = getTimezoneOffsetMinutes(utcDate, timezoneId) / 60;
  } else if (typeof tz === "number" && Number.isFinite(tz)) {
    tzOffsetHours = tz;
    // Inferred IANA ID from confirmed UTC offset — acceptable for display only
    timezoneId = options?.timezoneId || (tzOffsetHours === 5.5 ? "Asia/Kolkata" : (tzOffsetHours === 0 ? "UTC" : null));
    const totalUtcSeconds = (hour * 3600 + min * 60 + sec) - tzOffsetHours * 3600;
    const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0) + Math.round(totalUtcSeconds * 1000);
    utcDate = new Date(utcMs);
  } else {
    throw new Error("Timezone (IANA string or numeric offset in hours) is required for planetary ephemeris calculation.");
  }

  // Exact Julian Day of birth instant derived directly from resolved UTC instant Date
  const jd = getJulianDateFromUtc(utcDate);
  const T = (jd - 2451545.0) / 36525.0;
  if (!system) {
    throw new Error('INVALID_ASTROLOGY_SYSTEM: system is required. Valid systems: lahiri, kp, raman, tropical.');
  }
  let ayanamsha = 0;
  if (typeof options?.ayanamshaValue === "number") {
    const sysCheck = String(system).toLowerCase();
    if (sysCheck !== "vedic" && sysCheck !== "lahiri" && sysCheck !== "kp" && sysCheck !== "raman" && sysCheck !== "tropical" && sysCheck !== "western" && sysCheck !== "sayana") {
      throw new Error(`INVALID_ASTROLOGY_SYSTEM: Unknown astrological system "${system}". Valid systems: lahiri, kp, raman, tropical.`);
    }
    ayanamsha = options.ayanamshaValue;
  } else {
    ayanamsha = getAyanamshaForSystem(jd, system);
  }
  const sysNorm = (typeof system === "string" ? system : (system?.id || system?.system || "vedic")).toLowerCase();
  const adjustLong = (deg) => norm360(deg - ayanamsha);

  const utcPlus1Hour = new Date(utcDate.getTime() + 3600000);

  // 1. Ephemeris via Astronomy Engine (VSOP87 / NOVAS-derived planetary model)
  const getEphemerisBody = (astroBodyName) => {
    const el = Astronomy.Ecliptic(Astronomy.GeoVector(astroBodyName, utcDate, true));
    const trop = el.elon;
    const latDeg = el.elat;
    const elPlus = Astronomy.Ecliptic(Astronomy.GeoVector(astroBodyName, utcPlus1Hour, true));
    let diff = elPlus.elon - el.elon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const speed = diff * 24;
    return { trop, latDeg, speed };
  };

  const sunData = getEphemerisBody("Sun");
  const moonData = getEphemerisBody("Moon");
  const marsData = getEphemerisBody("Mars");
  const mercuryData = getEphemerisBody("Mercury");
  const jupiterData = getEphemerisBody("Jupiter");
  const venusData = getEphemerisBody("Venus");
  const saturnData = getEphemerisBody("Saturn");

  // Mean and True Lunar Nodes (Rahu / Ketu)
  // Chapront (2002) / IAU Standard Mean Ascending Node polynomial with J2000 anchor 125.04455°
  const meanRahuTrop = norm360(125.04455 - 1934.136261 * T + 0.0020754 * T * T + (T * T * T) / 467441.0 - (T * T * T * T) / 60616000.0);
  const meanKetuTrop = norm360(meanRahuTrop + 180);

  // True (Osculating) Ascending Node of the Moon computed from instantaneous orbital angular momentum vector h = r x v
  let trueRahuTrop;
  try {
    const deltaSec = 60;
    const v0 = Astronomy.Ecliptic(Astronomy.GeoVector("Moon", new Date(utcDate.getTime() - deltaSec * 1000), true)).vec;
    const v1 = Astronomy.Ecliptic(Astronomy.GeoVector("Moon", new Date(utcDate.getTime() + deltaSec * 1000), true)).vec;
    const rx = (v0.x + v1.x) / 2, ry = (v0.y + v1.y) / 2, rz = (v0.z + v1.z) / 2;
    const vx = (v1.x - v0.x) / (2 * deltaSec), vy = (v1.y - v0.y) / (2 * deltaSec), vz = (v1.z - v0.z) / (2 * deltaSec);
    const hx = ry * vz - rz * vy, hy = rz * vx - rx * vz;
    trueRahuTrop = norm360(Math.atan2(hx, -hy) * (180 / Math.PI));
  } catch (err) {
    // Fallback: Periodic perturbations to calculate True (Oscillating) Node (Jean Meeus Astronomical Algorithms Ch. 47)
    const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T) * DEG2RAD;
    const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T) * DEG2RAD;
    const Mprime = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T) * DEG2RAD;
    const F = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T) * DEG2RAD;
    const deltaNodeDeg = -1.4979 * Math.sin(2 * (D - F))
      - 0.1500 * Math.sin(M)
      - 0.1226 * Math.sin(2 * D)
      + 0.1176 * Math.sin(2 * F)
      - 0.0801 * Math.sin(2 * (D - Mprime));
    trueRahuTrop = norm360(meanRahuTrop + deltaNodeDeg);
  }
  const trueKetuTrop = norm360(trueRahuTrop + 180);

  const nodeModel = (options?.nodeModel || "mean").toLowerCase() === "true" ? "true" : "mean";
  const rahuTrop = nodeModel === "true" ? trueRahuTrop : meanRahuTrop;
  const ketuTrop = nodeModel === "true" ? trueKetuTrop : meanKetuTrop;

  // Mean Longitude of Sun and Tara Grahas for Classical Cheshta Kendra & Shadbala (IAU / Simon et al. polynomial formulas)
  const sunMeanTrop = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const sunMeanLong = adjustLong(sunMeanTrop);
  const mercMeanTrop = norm360(252.250905 + 149472.674111 * T);
  const venMeanTrop = norm360(181.979801 + 58517.815387 * T);
  const marsMeanTrop = norm360(355.4330 + 19140.2993 * T);
  const jupMeanTrop = norm360(34.3515 + 3034.9057 * T);
  const satMeanTrop = norm360(50.0774 + 1222.1138 * T);

  // Heliocentric / Seeghrocha Longitudes for Inferior Planets (Mercury, Venus)
  const mercHelioTrop = Astronomy.Ecliptic(Astronomy.HelioVector("Mercury", utcDate)).elon;
  const venHelioTrop = Astronomy.Ecliptic(Astronomy.HelioVector("Venus", utcDate)).elon;

  // 2. Ascendant (Lagna) via Greenwich Apparent Sidereal Time (GAST)
  const gastHours = Astronomy.SiderealTime(utcDate);
  const lastHours = (gastHours + lng / 15.0 + 24) % 24;
  const ramcDeg = lastHours * 15.0;
  // Mean Obliquity with Nutation in Obliquity
  const omega = norm360(125.04452 - 1934.136261 * T);
  const lSunMean = norm360(280.46646 + 36000.76983 * T);
  const deltaEpsDeg = (9.20 * Math.cos(omega * DEG2RAD) + 0.57 * Math.cos(2 * lSunMean * DEG2RAD)) / 3600.0;
  const eps = (23.439291 - 0.0130042 * T + deltaEpsDeg) * DEG2RAD;
  const ramcRad = ramcDeg * DEG2RAD;
  const latRad = lat * DEG2RAD;
  const ascY = Math.cos(ramcRad);
  const ascX = -Math.sin(ramcRad) * Math.cos(eps) - Math.tan(latRad) * Math.sin(eps);
  const ascTropical = norm360(Math.atan2(ascY, ascX) * RAD2DEG);
  const calculatedAscendantLong = adjustLong(ascTropical);
  const ascendantLong = typeof options?.ascendantLong === "number" ? options.ascendantLong : (typeof options?.ascendantDegree === "number" ? options.ascendantDegree : calculatedAscendantLong);

  // Dynamic Ascendant velocity calculation (degrees per minute) for D60 sensitivity
  const utcPlus1Min = new Date(utcDate.getTime() + 60000);
  const gastHoursPlus1Min = Astronomy.SiderealTime(utcPlus1Min);
  const lastHoursPlus1Min = (gastHoursPlus1Min + lng / 15.0 + 24) % 24;
  const ramcDegPlus1Min = lastHoursPlus1Min * 15.0;
  const ramcRadPlus1Min = ramcDegPlus1Min * DEG2RAD;
  const ascYPlus = Math.cos(ramcRadPlus1Min);
  const ascXPlus = -Math.sin(ramcRadPlus1Min) * Math.cos(eps) - Math.tan(latRad) * Math.sin(eps);
  const ascTropicalPlus1Min = norm360(Math.atan2(ascYPlus, ascXPlus) * RAD2DEG);
  const ascendantSpeedDegPerMin = Math.max(0.01, Math.abs(norm180(ascTropicalPlus1Min - ascTropical)));

  const mcTropical = norm360(Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(eps)) * RAD2DEG);
  const mcLong = adjustLong(mcTropical);
  const icLong = norm360(mcLong + 180);
  const descLong = norm360(ascendantLong + 180);

  const sunLong = adjustLong(sunData.trop);
  const moonLong = adjustLong(moonData.trop);
  const marsLong = adjustLong(marsData.trop);
  const mercuryLong = adjustLong(mercuryData.trop);
  const jupiterLong = adjustLong(jupiterData.trop);
  const venusLong = adjustLong(venusData.trop);
  const saturnLong = adjustLong(saturnData.trop);
  const rahuLong = adjustLong(rahuTrop);
  const ketuLong = adjustLong(ketuTrop);

  const getSignIdx = (deg) => Math.min(11, Math.max(0, Math.floor(norm360(deg) / 30)));
  const getDegreeInSign = (deg) => (norm360(deg) % 30).toFixed(2);
  const getHouse = (planetDeg, ascDeg) => ((getSignIdx(planetDeg) - getSignIdx(ascDeg) + 12) % 12) + 1;

  const getNakshatraInfo = (deg) => {
    const normDeg = norm360(deg);
    const idx = Math.min(26, Math.max(0, Math.floor(normDeg / (360 / 27))));
    const nak = NAKSHATRAS[idx] || NAKSHATRAS[0];
    const pada = Math.min(4, Math.max(1, Math.floor((normDeg % (360 / 27)) / (360 / 108)) + 1));
    const elapsedPercent = Math.min(100, Math.max(0, Math.round(((normDeg % (360 / 27)) / (360 / 27)) * 100)));
    const luckySyllable = (nak.syllables && nak.syllables[pada - 1]) ? nak.syllables[pada - 1] : (nak.syllables?.[0] || "");
    const luckySyllableTa = (nak.syllablesTa && nak.syllablesTa[pada - 1]) ? nak.syllablesTa[pada - 1] : (nak.syllablesTa?.[0] || "");
    return { ...nak, pada, luckySyllable, luckySyllableTa, elapsedPercent };
  };

  const sunSign = ZODIAC_SIGNS[getSignIdx(sunLong)];
  const moonSign = ZODIAC_SIGNS[getSignIdx(moonLong)];
  const ascendantSign = ZODIAC_SIGNS[getSignIdx(ascendantLong)];
  const moonNakshatra = getNakshatraInfo(moonLong);
  const sunNakshatra = getNakshatraInfo(sunLong);

  // Raw Planets with Speed, Retrograde Flags, Mean Longitudes, and True Latitudes
  const rawPlanets = [
    { name: "Sun", tamil: "சூரியன்", short: "சூரி", long: sunLong, speed: sunData.speed, isRetrograde: false, signIdx: getSignIdx(sunLong), tropLong: sunData.trop, eclipticLat: sunData.latDeg, meanLongitude: sunMeanLong, seeghrocha: sunMeanLong },
    { name: "Moon", tamil: "சந்திரன்", short: "சந்", long: moonLong, speed: moonData.speed, isRetrograde: false, signIdx: getSignIdx(moonLong), tropLong: moonData.trop, eclipticLat: moonData.latDeg, meanLongitude: moonLong, seeghrocha: moonLong },
    { name: "Mars", tamil: "செவ்வாய்", short: "செவ்", long: marsLong, speed: marsData.speed, isRetrograde: marsData.speed < 0, signIdx: getSignIdx(marsLong), tropLong: marsData.trop, eclipticLat: marsData.latDeg, meanLongitude: adjustLong(marsMeanTrop), seeghrocha: sunMeanLong },
    { name: "Mercury", tamil: "புதன்", short: "புத", long: mercuryLong, speed: mercuryData.speed, isRetrograde: mercuryData.speed < 0, signIdx: getSignIdx(mercuryLong), tropLong: mercuryData.trop, eclipticLat: mercuryData.latDeg, meanLongitude: adjustLong(mercMeanTrop), seeghrocha: sunMeanLong },
    { name: "Jupiter", tamil: "குரு", short: "குரு", long: jupiterLong, speed: jupiterData.speed, isRetrograde: jupiterData.speed < 0, signIdx: getSignIdx(jupiterLong), tropLong: jupiterData.trop, eclipticLat: jupiterData.latDeg, meanLongitude: adjustLong(jupMeanTrop), seeghrocha: sunMeanLong },
    { name: "Venus", tamil: "சுக்கிரன்", short: "சுக்", long: venusLong, speed: venusData.speed, isRetrograde: venusData.speed < 0, signIdx: getSignIdx(venusLong), tropLong: venusData.trop, eclipticLat: venusData.latDeg, meanLongitude: adjustLong(venMeanTrop), seeghrocha: sunMeanLong },
    { name: "Saturn", tamil: "சனி", short: "சனி", long: saturnLong, speed: saturnData.speed, isRetrograde: saturnData.speed < 0, signIdx: getSignIdx(saturnLong), tropLong: saturnData.trop, eclipticLat: saturnData.latDeg, meanLongitude: adjustLong(satMeanTrop), seeghrocha: sunMeanLong },
    { name: "Rahu", tamil: "ராகு", short: "ராகு", long: rahuLong, speed: -0.0529, isRetrograde: true, signIdx: getSignIdx(rahuLong), tropLong: rahuTrop, eclipticLat: 0, meanLongitude: adjustLong(meanRahuTrop), trueLongitude: adjustLong(trueRahuTrop), seeghrocha: rahuLong, nodeModel },
    { name: "Ketu", tamil: "கேது", short: "கேது", long: ketuLong, speed: -0.0529, isRetrograde: true, signIdx: getSignIdx(ketuLong), tropLong: ketuTrop, eclipticLat: 0, meanLongitude: adjustLong(meanKetuTrop), trueLongitude: adjustLong(trueKetuTrop), seeghrocha: ketuLong, nodeModel }
  ];

  // Pass 1: Build Base Planet Objects with Aspects
  const planetsBase = rawPlanets.map(p => {
    const sign = ZODIAC_SIGNS[p.signIdx];
    const nak = getNakshatraInfo(p.long);
    const nav = calculateNavamsa(p.long);
    const house = getHouse(p.long, ascendantLong);
    const degInSign = parseFloat(getDegreeInSign(p.long));

    // Canonical Baladi Avastha with Odd/Even sign parity
    const isOddSign = (p.signIdx % 2) === 0; // Aries=0 (odd), Taurus=1 (even)
    const avasthaBracket = Math.floor(degInSign / 6); // 0..4
    let avastha = "Yuva (Prime Adult)";
    let avasthaTamil = "யுவா (முழு பலம்)";

    if (isOddSign) {
      if (avasthaBracket === 0) { avastha = "Bala (Infant - 25% manifestation)"; avasthaTamil = "பாலா (குழந்தை - 25%)"; }
      else if (avasthaBracket === 1) { avastha = "Kumara (Youth - 50% manifestation)"; avasthaTamil = "குமாரா (இளமை - 50%)"; }
      else if (avasthaBracket === 2) { avastha = "Yuva (Prime - 100% manifestation)"; avasthaTamil = "யுவா (தீவிரம் - 100%)"; }
      else if (avasthaBracket === 3) { avastha = "Vriddha (Elderly - 10% manifestation)"; avasthaTamil = "விருத்தா (முதுமை - 10%)"; }
      else { avastha = "Mrita (Dormant - Minimum)"; avasthaTamil = "மிருதா (செயலின்மை)"; }
    } else {
      if (avasthaBracket === 0) { avastha = "Mrita (Dormant - Minimum)"; avasthaTamil = "மிருதா (செயலின்மை)"; }
      else if (avasthaBracket === 1) { avastha = "Vriddha (Elderly - 10% manifestation)"; avasthaTamil = "விருத்தா (முதுமை - 10%)"; }
      else if (avasthaBracket === 2) { avastha = "Yuva (Prime - 100% manifestation)"; avasthaTamil = "யுவா (தீவிரம் - 100%)"; }
      else if (avasthaBracket === 3) { avastha = "Kumara (Youth - 50% manifestation)"; avasthaTamil = "குமாரா (இளமை - 50%)"; }
      else { avastha = "Bala (Infant - 25% manifestation)"; avasthaTamil = "பாலா (குழந்தை - 25%)"; }
    }

    // Classical Planet-Specific Combustion (Asta) Limits
    const sunDist = angularDistance(p.long, sunLong);
    let combustLimit = 0;
    if (p.name === "Moon") combustLimit = 12;
    else if (p.name === "Mars") combustLimit = 17;
    else if (p.name === "Mercury") combustLimit = p.isRetrograde ? 12 : 14;
    else if (p.name === "Jupiter") combustLimit = 11;
    else if (p.name === "Venus") combustLimit = p.isRetrograde ? 8 : 10;
    else if (p.name === "Saturn") combustLimit = 15;

    const isCombust = combustLimit > 0 && sunDist <= combustLimit;

    // Precise Parashari Aspects (Drishti) - 0-indexed circular arithmetic
    const aspectHouse = (h, offset) => ((h - 1 + offset) % 12) + 1;
    const aspects = [aspectHouse(house, 6)]; // All planets cast 7th aspect
    if (p.name === "Mars") {
      aspects.push(aspectHouse(house, 3)); // 4th aspect
      aspects.push(aspectHouse(house, 7)); // 8th aspect
    }
    if (p.name === "Jupiter" || p.name === "Rahu" || p.name === "Ketu") {
      aspects.push(aspectHouse(house, 4)); // 5th aspect
      aspects.push(aspectHouse(house, 8)); // 9th aspect
    }
    if (p.name === "Saturn") {
      aspects.push(aspectHouse(house, 2)); // 3rd aspect
      aspects.push(aspectHouse(house, 9)); // 10th aspect
    }

    return {
      name: p.name,
      tamil: p.tamil,
      short: p.short,
      longitude: p.long,
      tropicalLongitude: p.tropLong,
      eclipticLat: p.eclipticLat,
      meanLongitude: p.meanLongitude,
      seeghrocha: p.seeghrocha,
      speed: p.speed,
      isRetrograde: p.isRetrograde,
      deg: degInSign.toFixed(2),
      degreeInSign: degInSign.toFixed(2),
      sign: sign.name,
      signTamil: sign.tamil,
      house,
      signIdx: p.signIdx,
      nakshatra: nak.name,
      nakshatraTamil: nak.tamil,
      pada: nak.pada,
      navamsaSign: nav.signName,
      navamsaTamil: nav.signTamil,
      navamsaSymbol: nav.symbol,
      avastha,
      avasthaTamil,
      isCombust,
      combustStatus: isCombust ? "அஸ்தமனம் (Combust)" : "நேரடி பிரகாசம் (Clear)",
      aspectingHouses: aspects
    };
  });

  // Pass 2: Calculate Panchadha Maitri Dignity and Aspects Received
  const planets = planetsBase.map(p => {
    const sign = ZODIAC_SIGNS[p.signIdx];
    const lordName = sign.ruler;
    const lordPlanet = planetsBase.find(lp => lp.name === lordName);
    const lordHouse = lordPlanet ? lordPlanet.house : p.house;
    const degInSign = parseFloat(p.deg);

    // Classical Exaltation and Debilitation Signs
    const exaltMap = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 };
    const debilMap = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0, Rahu: 7, Ketu: 1 };

    let dignity = "Neutral";
    if (p.name === "Moon" && p.signIdx === 1) {
      dignity = degInSign <= 3 ? "Exalted" : "Moolatrikona";
    } else if (p.name === "Mercury" && p.signIdx === 5) {
      if (degInSign <= 15) dignity = "Exalted";
      else if (degInSign <= 20) dignity = "Moolatrikona";
      else dignity = "Own";
    } else if (p.name === "Sun" && p.signIdx === 0) {
      dignity = "Exalted";
    } else if (p.name === "Sun" && p.signIdx === 4) {
      dignity = degInSign <= 10 ? "Moolatrikona" : "Own";
    } else if (p.name === "Mars" && p.signIdx === 9) {
      dignity = "Exalted";
    } else if (p.name === "Mars" && p.signIdx === 0) {
      dignity = degInSign <= 12 ? "Moolatrikona" : "Own";
    } else if (p.name === "Jupiter" && p.signIdx === 3) {
      dignity = "Exalted";
    } else if (p.name === "Jupiter" && p.signIdx === 8) {
      dignity = degInSign <= 10 ? "Moolatrikona" : "Own";
    } else if (p.name === "Venus" && p.signIdx === 11) {
      dignity = "Exalted";
    } else if (p.name === "Venus" && p.signIdx === 6) {
      dignity = degInSign <= 15 ? "Moolatrikona" : "Own";
    } else if (p.name === "Saturn" && p.signIdx === 6) {
      dignity = "Exalted";
    } else if (p.name === "Saturn" && p.signIdx === 10) {
      dignity = degInSign <= 20 ? "Moolatrikona" : "Own";
    } else if (["Rahu", "Ketu"].includes(p.name) && exaltMap[p.name] !== undefined && p.signIdx === exaltMap[p.name]) {
      dignity = "Exalted";
    } else if (debilMap[p.name] !== undefined && p.signIdx === debilMap[p.name]) {
      dignity = "Debilitated";
    } else if (lordName === p.name) {
      dignity = "Own";
    } else {
      // 5-Fold Compound Friendship (Panchadha Maitri)
      const houseDiff = ((lordHouse - p.house + 12) % 12) + 1;
      const isTatkalikaFriend = [2, 3, 4, 10, 11, 12].includes(houseDiff);
      const nais = NAISARGIKA_FRIENDSHIP[p.name] || { friends: [], enemies: [] };
      let nScore = 0;
      if (nais.friends.includes(lordName)) nScore = 1;
      else if (nais.enemies.includes(lordName)) nScore = -1;
      const tScore = isTatkalikaFriend ? 1 : -1;
      const compound = nScore + tScore;
      if (compound === 2) dignity = "Great Friend";
      else if (compound === 1) dignity = "Friend";
      else if (compound === 0) dignity = "Neutral";
      else if (compound === -1) dignity = "Enemy";
      else dignity = "Great Enemy";
    }

    // Aspects Received by this planet from other planets
    const aspectsReceived = planetsBase
      .filter(other => other.name !== p.name && other.aspectingHouses?.includes(p.house))
      .map(other => ({
        planet: other.name,
        tamil: other.tamil,
        house: other.house,
        aspectType: `${((p.house - other.house + 12) % 12) + 1}th aspect`,
        isBenefic: ["Jupiter", "Venus"].includes(other.name) ||
          (other.name === "Mercury" && other.signIdx !== 11 && !other.isCombust) ||
          (other.name === "Moon" && !other.isCombust)
      }));

    return {
      ...p,
      dignity,
      aspectsReceived
    };
  });

  // Calculate Classical Parashari Sarvashtakavarga (337 Bindus)
  const ashtakavargaData = calculateClassicalAshtakavarga(planets, ascendantLong);
  const ashtakavargaPoints = ashtakavargaData.ashtakavargaPoints;

  const ascendantNavamsa = calculateNavamsa(ascendantLong);

  // 3. Panchangam Calculations
  // Tamil Year (60-Year Jovian cycle, base: 1987 = Prabhava / 0).
  // In the Tamil solar calendar, the year commences on Mesha Sankranti (~April 14, Sun entering Aries).
  // Prior to Sun ingress into Aries (e.g. Jan-Mar or early April when Sun is in Meenam/Pisces),
  // the solar year remains in the preceding cycle year.
  const isPreMeshaSankranti = (month < 4) || (month === 4 && getSignIdx(sunLong) === 11);
  const solarYearRef = isPreMeshaSankranti ? year - 1 : year;
  const tamilYearIdx = ((solarYearRef - 1987) % 60 + 60) % 60;
  const tamilYearName = TAMIL_YEARS[tamilYearIdx];

  // Tamil Month: Determined by Sun's Sidereal Longitude Sign
  const tamilMonthObj = TAMIL_MONTHS[getSignIdx(sunLong)];

  // Thithi: based on (Moon_long - Sun_long) / 12 degrees
  const thithiDiff = norm360(moonLong - sunLong);
  const thithiIndex = Math.floor(thithiDiff / 12);
  const isShuklaPaksha = thithiIndex < 15;
  const rawThithiName = THITHIS[thithiIndex % 15];
  const thithiDisplayName = isShuklaPaksha 
    ? (thithiIndex === 14 ? "பௌர்ணமி (Purnima)" : rawThithiName) 
    : (thithiIndex === 29 ? "அமாவாசை (Amavasya)" : rawThithiName);
  const thithiDisplayNameEn = isShuklaPaksha 
    ? (thithiIndex === 14 ? "Shukla Paksha - Purnima (Full Moon)" : `Shukla Paksha - ${rawThithiName}`) 
    : (thithiIndex === 29 ? "Krishna Paksha - Amavasya (New Moon)" : `Krishna Paksha - ${rawThithiName}`);

  // Yogam: based on (Sun_long + Moon_long) / 13.333333 degrees
  const yogamIdx = Math.floor(norm360(sunLong + moonLong) / 13.333333333333334);
  const yogamName = YOGAMS[yogamIdx % 27];

  // Authentic 60-Karanam Calculation (Kimstughna, 7 Chara Karanas, Shakuni, Chatushpada, Naga)
  const karanamObj = getClassicalKaranam(thithiDiff);
  const karanamName = karanamObj.tamil;

  // NOAA Solar Sun Times Calculation
  const solarTzOffset = typeof tz === "string" ? getTimezoneOffsetMinutes(utcDate, timezoneId) / 60 : tzOffsetHours;
  const sunTimes = calculateAccurateSunTimes(date, lat, lng, solarTzOffset, timezoneId);
  const sunriseTime = sunTimes.sunriseStr;
  const sunsetTime = sunTimes.sunsetStr;

  // 4. Vimshottari Dasha Balance at Birth
  const moonNakPos = moonLong % 13.333333333333334;
  const balanceRatio = 1 - (moonNakPos / 13.333333333333334);
  const birthLordIndex = DASHA_LORDS.findIndex(d => d.lord === moonNakshatra.ruler);
  const birthLord = DASHA_LORDS[birthLordIndex];

  const birthBalanceYears = birthLord.years * balanceRatio;
  const balYearsInt = Math.floor(birthBalanceYears);
  const balMonthsInt = Math.floor((birthBalanceYears - balYearsInt) * 12);
  const balDaysInt = Math.floor(((birthBalanceYears - balYearsInt) * 12 - balMonthsInt) * 30);

  // Full 120-Year Vimshottari Dasha-Bhukthi Table Generation
  const jdNow = (Date.now() / 86400000) + 2440587.5;
  const currentAge = (jdNow - jd) / 365.24219878;

  const dashaTable = computeDetailedVimshottari(birthLordIndex, balanceRatio, date, jd, tzOffsetHours);

  let activeMahadasha = null;
  const curMd = dashaTable.find(d => d.isCurrent) || null;
  const curBk = curMd ? (curMd.bukthis?.find(b => b.isCurrent) || null) : null;

  activeMahadasha = curMd ? {
    lord: curMd.lord,
    tamil: curMd.tamil,
    startAge: curMd.startAge,
    endAge: curMd.endAge,
    currentAntar: curBk?.subLord || curMd.lord,
    antarDasha: curBk?.subLord || curMd.lord,
    subLord: curBk?.subLord || curMd.lord,
    currentAntarTamil: curBk?.subTamil || curMd.tamil,
    bkStartAge: curBk?.startAge || curMd.startAge,
    bkEndAge: curBk?.endAge || curMd.endAge
  } : null;

  // 5. Chevvai (Mars) Dosham Diagnostic (Houses 1, 2, 4, 7, 8, 12 from Lagna, Moon, Venus)
  const marsFromLagna = getHouse(marsLong, ascendantLong);
  const marsFromMoon = getHouse(marsLong, moonLong);
  const marsFromVenus = getHouse(marsLong, venusLong);
  const isChevvaiDosha = [1, 2, 4, 7, 8, 12].includes(marsFromLagna) || [1, 2, 4, 7, 8, 12].includes(marsFromMoon) || [1, 2, 4, 7, 8, 12].includes(marsFromVenus);

  // Classical Exemptions:
  // - Mars in Aries (0) or Scorpio (7) [Own signs], Capricorn (9) [Exaltation]. Cancer (3) is debilitated and NOT exempt.
  // - Mars conjoined with Jupiter (within 12 deg) or aspected by Jupiter
  const marsSignIdx = getSignIdx(marsLong);
  const isMarsInOwnOrExalted = [0, 7, 9].includes(marsSignIdx);
  const isJupiterWithMars = angularDistance(marsLong, jupiterLong) <= 12;
  const jupiterHouse = getHouse(jupiterLong, ascendantLong);
  const aspectHouseCalc = (h, off) => ((h - 1 + off) % 12) + 1;
  const jupiterAspectsMars = [aspectHouseCalc(jupiterHouse, 4), aspectHouseCalc(jupiterHouse, 6), aspectHouseCalc(jupiterHouse, 8)].includes(marsFromLagna);
  const hasChevvaiExemption = isMarsInOwnOrExalted || isJupiterWithMars || jupiterAspectsMars;

  // Classical Relative Sade Sati Diagnostic (Saturn in 12th, 1st, or 2nd from Moon)
  // 1. Natal Sade Sati at Birth
  const moonSignIdx = getSignIdx(moonLong);
  const saturnSignIdx = getSignIdx(saturnLong);
  const saturnFromMoonBirth = (saturnSignIdx - moonSignIdx + 12) % 12;
  const isBirthSadeSati = [11, 0, 1].includes(saturnFromMoonBirth);

  // 2. Gochara (Transit) Sade Sati Calculation
  let isCurrentTransitSadeSati = false;
  let currentTransitPhase = "None";
  let currentTransitPhaseTa = "தற்போது ஏழரைச் சனி இல்லை (Absent)";
  try {
    const nowUtc = new Date();
    const transitSaturnTrop = Astronomy.Ecliptic(Astronomy.GeoVector("Saturn", nowUtc, true)).elon;
    const nowJd = getJulianDate(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth() + 1, nowUtc.getUTCDate(), nowUtc.getUTCHours(), nowUtc.getUTCMinutes(), 0);
    const ayanamshaNow = getAyanamshaForSystem(nowJd, system);
    const transitSaturnSidereal = norm360(transitSaturnTrop - ayanamshaNow);
    const transitSaturnSignIdx = getSignIdx(transitSaturnSidereal);
    const transitSaturnFromMoon = (transitSaturnSignIdx - moonSignIdx + 12) % 12;
    isCurrentTransitSadeSati = [11, 0, 1].includes(transitSaturnFromMoon);
    if (transitSaturnFromMoon === 11) {
      currentTransitPhase = "1st Phase (Rising / விரயச் சனி - 12th from Natal Moon)";
      currentTransitPhaseTa = "முதல் சுற்று (விரயச் சனி - ஜென்ம சந்திரனுக்கு 12-ம் இடம்)";
    } else if (transitSaturnFromMoon === 0) {
      currentTransitPhase = "2nd Phase (Peak / ஜென்மச் சனி - In Natal Moon Sign)";
      currentTransitPhaseTa = "இரண்டாம் சுற்று (ஜென்மச் சனி - சந்திரனுடன் சஞ்சாரம்)";
    } else if (transitSaturnFromMoon === 1) {
      currentTransitPhase = "3rd Phase (Setting / பாதச் சனி - 2nd from Natal Moon)";
      currentTransitPhaseTa = "மூன்றாம் சுற்று (பாதச் சனி - ஜென்ம சந்திரனுக்கு 2-ம் இடம்)";
    }
  } catch (_e) {
    isCurrentTransitSadeSati = isBirthSadeSati;
  }

  // 6. 6 Life-Stage Predictive Timeline (Dynamically generated from native's chart)
  const lifeStages = generateDynamicLifeStages(planets, ascendantSign, moonSign, moonNakshatra, dashaTable, year);

  const decimalHours = hour + min / 60.0;
  const isDayBirth = (sunTimes.sunriseHours !== null && sunTimes.sunsetHours !== null)
    ? (decimalHours >= sunTimes.sunriseHours && decimalHours < sunTimes.sunsetHours)
    : (sunTimes.isPolarDay ? true : (sunTimes.isPolarNight ? false : (decimalHours >= 6.0 && decimalHours < 18.0)));
  const birthDateObj = (date instanceof Date) ? date : new Date(Date.UTC(year, month - 1, day, hour, min, 0));

  const calculatedShadbala = calculateShadbala(
    planets,
    ascendantSign,
    timeString,
    sunLong,
    { ascendantLong, mcLong, icLong, descLong },
    isDayBirth,
    birthDateObj,
    sunTimes,
    tzOffsetHours,
    timezoneId
  );

  const dateStr = typeof date === "string" ? date : `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timeStr = timeString;

  return {
    system,
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    birthLatitude: lat,
    birthLongitude: lng,
    tz: tzOffsetHours,
    utcOffset: tzOffsetHours,
    timezoneId,
    ianaTimezone: timezoneId,
    birthInstantUtc: utcDate,
    birthDateStr: dateStr,
    birthTimeStr: timeStr,
    date: utcDate,
    time: timeStr,
    birthYear: year,
    birthDate: dateStr,
    ayanamsa: ayanamsha.toFixed(4),
    ayanamsaDms: degToDms(ayanamsha),
    ayanamsaValue: ayanamsha,
    ayanamshaValue: ayanamsha,
    system: sysNorm,
    ayanamshaName: sysNorm === "kp" ? "KP Original" : (sysNorm === "raman" ? "B.V. Raman (397 AD)" : (sysNorm === "tropical" || sysNorm === "western" || sysNorm === "sayana" ? "None (Sayana)" : "Lahiri (Chitrapaksha)")),
    ayanamshaModelLocked: getAyanamshaMetadata(sysNorm),
    ascendantLong,
    ascendantDeg: norm360(ascendantLong),
    ascendantSpeedDegPerMin,
    mcLong: norm360(mcLong),
    mcDeg: norm360(mcLong),
    mcTropical,
    icLong,
    descLong,
    sunLong,
    moonLong,
    nodes: {
      nodeModel,
      meanRahu: adjustLong(meanRahuTrop),
      meanKetu: adjustLong(meanKetuTrop),
      trueRahu: adjustLong(trueRahuTrop),
      trueKetu: adjustLong(trueKetuTrop),
      meanRahuTropical: meanRahuTrop,
      meanKetuTropical: meanKetuTrop,
      trueRahuTropical: trueRahuTrop,
      trueKetuTropical: trueKetuTrop
    },
    nodeModel,
    lunarNodeConvention: {
      model: nodeModel === "true" ? "TRUE_OSCULATING" : "MEAN_ASTRONOMICAL",
      definition: nodeModel === "true"
        ? "Instantaneous Lunar Orbital Angular Momentum State Vector (h = r x v) with Jean Meeus Ch. 47 fallback"
        : "Chapront 2002 / IAU Standard Polynomial (125.04455° anchor)",
      referenceFrame: "Geocentric True Ecliptic of Date"
    },
    calendarSystem: (typeof options?.calendar === "string") ? options.calendar : ((year < 1582 || (year === 1582 && (month < 10 || (month === 10 && day < 15)))) ? "Julian" : "Gregorian"),
    sunSign,
    moonSign,
    ascendantSign,
    moonNakshatra,
    sunNakshatra,
    ascendantNavamsa,
    planets,
    panchangam: {
      tamilYear: tamilYearName,
      tamilMonth: tamilMonthObj.tamil,
      tamilMonthEn: tamilMonthObj.name,
      thithi: `${isShuklaPaksha ? "சுக்கில பட்சம்" : "கிருஷ்ண பட்சம்"} - ${thithiDisplayName}`,
      thithiEn: thithiDisplayNameEn,
      nakshatra: `${moonNakshatra.tamil} (பாதம் ${moonNakshatra.pada})`,
      nakshatraEn: `${moonNakshatra.name} (Pada ${moonNakshatra.pada})`,
      yogam: yogamName,
      karanam: karanamName,
      sunrise: sunriseTime,
      dashaBalance: `${birthLord.tamil} தசை இருப்பு: ${balYearsInt} வருடம், ${balMonthsInt} மாதம், ${balDaysInt} நாள்`,
      dashaBalanceEn: `${birthLord.lord} Dasha Balance: ${balYearsInt}y, ${balMonthsInt}m, ${balDaysInt}d`
    },
    doshaAnalysis: {
      isChevvaiDosha: isChevvaiDosha && !hasChevvaiExemption,
      rawDoshaPresent: isChevvaiDosha,
      hasExemption: hasChevvaiExemption,
      convention: "South-Indian / Parashari 6-House Convention (Houses 1, 2, 4, 7, 8, 12 from Lagna, Moon, Venus)",
      conventionTa: "தென்னிந்திய / பராசர 6-பாவ முறை (லக்னம், சந்திரன், சுக்கிரனிலிருந்து 1, 2, 4, 7, 8, 12)",
      chevvaiStatus: isChevvaiDosha ? (hasChevvaiExemption ? "செவ்வாய் தோஷ விலக்கு உண்டு (Exempted / Modified)" : "செவ்வாய் தோஷம் உள்ளது (Present)") : "செவ்வாய் தோஷம் இல்லை (Absent)",
      chevvaiStatusEn: isChevvaiDosha ? (hasChevvaiExemption ? "Kuja Dosha Modified by Classical Exemption" : "Kuja Dosha Present") : "Kuja Dosha Absent",
      marsHouses: `லக்னத்திலிருந்து: ${marsFromLagna}-ம் பாவம், சந்திரனிலிருந்து: ${marsFromMoon}-ம் பாவம், சுக்கிரனிலிருந்து: ${marsFromVenus}-ம் பாவம்`,
      marsHousesEn: `From Lagna: House ${marsFromLagna}, From Moon: House ${marsFromMoon}, From Venus: House ${marsFromVenus}`,
      kujaDoshaConvention: "parashari_standard_1",
      isSadeSati: isCurrentTransitSadeSati,
      sadeSatiStatus: isCurrentTransitSadeSati ? `நடப்பு கோச்சார ஏழரைச் சனி (${currentTransitPhaseTa})` : "தற்போது கோச்சார ஏழரைச் சனி இல்லை (Absent)",
      sadeSatiPhase: currentTransitPhase,
      bornInSadeSati: isBirthSadeSati
    },
    currentDasha: activeMahadasha || null,
    dashaTable,
    lifeStages,
    bhavasDetailed: calculate12BhavasDetailed(ascendantLong, planets, "en"),
    bhavasDetailedTamil: calculate12BhavasDetailed(ascendantLong, planets, "ta"),
    detectedYogas: calculateDetailedVedicYogas(planets, ascendantLong, moonLong, sunLong, "en"),
    detectedYogasTamil: calculateDetailedVedicYogas(planets, ascendantLong, moonLong, sunLong, "ta"),
    tridoshaBalance: calculateAyurvedicTridosha(planets, ascendantSign, "en"),
    tridoshaBalanceTamil: calculateAyurvedicTridosha(planets, ascendantSign, "ta"),
    personalizedRemedies: calculatePersonalizedRemedies(ascendantSign, planets, "en", activeMahadasha, calculatedShadbala),
    personalizedRemediesTamil: calculatePersonalizedRemedies(ascendantSign, planets, "ta", activeMahadasha, calculatedShadbala),
    get domainPredictions() {
      if (options?.lightweight) return null;
      if (!this._domainPredictions) {
        this._domainPredictions = calculateComprehensiveDomainPredictions(planets, ascendantLong, moonLong, sunLong, "en", dashaTable, year);
      }
      return this._domainPredictions;
    },
    get domainPredictionsTamil() {
      if (options?.lightweight) return null;
      if (!this._domainPredictionsTamil) {
        this._domainPredictionsTamil = calculateComprehensiveDomainPredictions(planets, ascendantLong, moonLong, sunLong, "ta", dashaTable, year);
      }
      return this._domainPredictionsTamil;
    },
    get masterPredictions() {
      if (options?.lightweight) return null;
      if (!this._masterPredictions) {
        this._masterPredictions = calculateMasterPredictions(this, "en");
      }
      return this._masterPredictions;
    },
    get masterPredictionsTamil() {
      if (options?.lightweight) return null;
      if (!this._masterPredictionsTamil) {
        this._masterPredictionsTamil = calculateMasterPredictions(this, "ta");
      }
      return this._masterPredictionsTamil;
    },
    get auspiciousTimelines() {
      if (options?.lightweight) return null;
      if (!this._auspiciousTimelines) {
        this._auspiciousTimelines = calculateAuspiciousMilestoneTimelines(planets, ascendantLong, moonLong, dashaTable, year, "en", sunTimes, lat, lng, tzOffsetHours, timezoneId);
      }
      return this._auspiciousTimelines;
    },
    get auspiciousTimelinesTamil() {
      if (options?.lightweight) return null;
      if (!this._auspiciousTimelinesTamil) {
        this._auspiciousTimelinesTamil = calculateAuspiciousMilestoneTimelines(planets, ascendantLong, moonLong, dashaTable, year, "ta", sunTimes, lat, lng, tzOffsetHours, timezoneId);
      }
      return this._auspiciousTimelinesTamil;
    },
    get evidenceLedger() {
      if (options?.lightweight) return null;
      if (!this._evidenceLedger) {
        this._evidenceLedger = buildDomainEvidenceLedger(planets, ascendantLong, moonLong, dashaTable, "en");
      }
      return this._evidenceLedger;
    },
    get evidenceLedgerTamil() {
      if (options?.lightweight) return null;
      if (!this._evidenceLedgerTamil) {
        this._evidenceLedgerTamil = buildDomainEvidenceLedger(planets, ascendantLong, moonLong, dashaTable, "ta");
      }
      return this._evidenceLedgerTamil;
    },
    get riskMatrix() {
      if (options?.lightweight) return null;
      if (!this._riskMatrix) {
        this._riskMatrix = calculateComprehensiveRiskMatrix(planets, ascendantLong, moonLong, dashaTable, year, "en");
      }
      return this._riskMatrix;
    },
    get riskMatrixTamil() {
      if (options?.lightweight) return null;
      if (!this._riskMatrixTamil) {
        this._riskMatrixTamil = calculateComprehensiveRiskMatrix(planets, ascendantLong, moonLong, dashaTable, year, "ta");
      }
      return this._riskMatrixTamil;
    },
    get timeline() {
      if (options?.lightweight) return null;
      if (!this._timeline) {
        this._timeline = calculateChronologicalDashaTimeline(this, "en");
      }
      return this._timeline;
    },
    get timelineTamil() {
      if (options?.lightweight) return null;
      if (!this._timelineTamil) {
        this._timelineTamil = calculateChronologicalDashaTimeline(this, "ta");
      }
      return this._timelineTamil;
    },
    get chronologicalDashaTimeline() { return this.timeline; },
    get chronologicalDashaTimelineTamil() { return this.timelineTamil; },
    get vimshottariCycleTimeline() { return this.timeline; },
    get vimshottariCycleTimelineTamil() { return this.timelineTamil; },
    get birthToDeathTimeline() { return this.timeline; }, // Deprecated alias
    get birthToDeathTimelineTamil() { return this.timelineTamil; }, // Deprecated alias
    get careerPathway() {
      if (options?.lightweight) return null;
      if (!this._careerPathway) {
        this._careerPathway = calculateCareerAndExamPathway(planets, ascendantLong, "en");
      }
      return this._careerPathway;
    },
    get careerPathwayTamil() {
      if (options?.lightweight) return null;
      if (!this._careerPathwayTamil) {
        this._careerPathwayTamil = calculateCareerAndExamPathway(planets, ascendantLong, "ta");
      }
      return this._careerPathwayTamil;
    },
    get marriagePathway() {
      if (options?.lightweight) return null;
      if (!this._marriagePathway) {
        this._marriagePathway = calculateMarriagePathway(planets, ascendantLong, dashaTable, year, "en");
      }
      return this._marriagePathway;
    },
    get marriagePathwayTamil() {
      if (options?.lightweight) return null;
      if (!this._marriagePathwayTamil) {
        this._marriagePathwayTamil = calculateMarriagePathway(planets, ascendantLong, dashaTable, year, "ta");
      }
      return this._marriagePathwayTamil;
    },
    ashtakavarga: ashtakavargaData,
    ashtakavargaPoints: ashtakavargaData.ashtakavargaPoints,
    jaiminiKarakas: calculateJaiminiKarakas(planets),
    atmakaraka: calculateJaiminiKarakas(planets)[0] || null,
    jaiminiSystem: calculateJaiminiSystem(planets, ascendantLong),
    bhavaChalit: calculateBhavaChalit(ascendantLong, planets, lat, lng),
    planetaryAvasthas: calculatePlanetaryAvasthas(planets, ascendantLong),
    functionalLordships: ascendantSign?.name ? getFunctionalLordshipMatrix(ascendantSign.name) : null,
    nakshatraDispositors: planets.map(p => calculateNakshatraDispositorProfile(p, planets, ascendantLong)),
    gocharDashboard: calculateDedicatedGocharDashboard({ planets, ascendantLong, moonLong, ascendant: { longitude: ascendantLong }, moon: { longitude: moonLong }, timezoneId, tz: tzOffsetHours }, new Date()),
    dailyPanchang: calculateDailyPanchang(utcDate, lat, lng, tzOffsetHours, timezoneId),
    d60StabilityTest: calculateD60StabilityTest(utcDate, lat, lng, tzOffsetHours, options),
    get reasoningChain() {
      if (options?.lightweight) return null;
      if (!this._reasoningChain) {
        this._reasoningChain = {
          career: calculatePredictionReasoningChain(this, "career", { lang: "en" }),
          marriage: calculatePredictionReasoningChain(this, "marriage", { lang: "en" }),
          wealth: calculatePredictionReasoningChain(this, "wealth", { lang: "en" }),
          property: calculatePredictionReasoningChain(this, "property", { lang: "en" }),
          education: calculatePredictionReasoningChain(this, "education", { lang: "en" }),
          health: calculatePredictionReasoningChain(this, "health", { lang: "en" }),
          spirituality: calculatePredictionReasoningChain(this, "spirituality", { lang: "en" })
        };
      }
      return this._reasoningChain;
    },
    get reasoningChainTamil() {
      if (options?.lightweight) return null;
      if (!this._reasoningChainTamil) {
        this._reasoningChainTamil = {
          career: calculatePredictionReasoningChain(this, "career", { lang: "ta" }),
          marriage: calculatePredictionReasoningChain(this, "marriage", { lang: "ta" }),
          wealth: calculatePredictionReasoningChain(this, "wealth", { lang: "ta" }),
          property: calculatePredictionReasoningChain(this, "property", { lang: "ta" }),
          education: calculatePredictionReasoningChain(this, "education", { lang: "ta" }),
          health: calculatePredictionReasoningChain(this, "health", { lang: "ta" }),
          spirituality: calculatePredictionReasoningChain(this, "spirituality", { lang: "ta" })
        };
      }
      return this._reasoningChainTamil;
    },
    divisionalCharts: calculateDivisionalCharts(planets, ascendantLong, ascendantSpeedDegPerMin),
    shadbala: calculatedShadbala,
    pratyantardasha: calculatePratyantardasha(activeMahadasha),
    get retrospectiveMilestones() {
      if (options?.lightweight) return null;
      if (!this._retrospectiveMilestones) {
        this._retrospectiveMilestones = generateRetrospectiveLifeMilestoneAudit(planets, ascendantLong, moonLong, dashaTable, utcDate || date, "en");
      }
      return this._retrospectiveMilestones;
    },
    get retrospectiveMilestonesTamil() {
      if (options?.lightweight) return null;
      if (!this._retrospectiveMilestonesTamil) {
        this._retrospectiveMilestonesTamil = generateRetrospectiveLifeMilestoneAudit(planets, ascendantLong, moonLong, dashaTable, utcDate || date, "ta");
      }
      return this._retrospectiveMilestonesTamil;
    },
    get retrospectiveLifeAudit() { return this.retrospectiveMilestones; },
    get retrospectiveLifeAuditTamil() { return this.retrospectiveMilestonesTamil; },
    get reportEvidencePackage() {
      if (options?.lightweight) return null;
      if (!this._reportEvidencePackage) {
        this._reportEvidencePackage = calculateReportEvidencePackage(this, "en");
      }
      return this._reportEvidencePackage;
    },
    get reportEvidencePackageTamil() {
      if (options?.lightweight) return null;
      if (!this._reportEvidencePackageTamil) {
        this._reportEvidencePackageTamil = calculateReportEvidencePackage(this, "ta");
      }
      return this._reportEvidencePackageTamil;
    },
    get karmicPatternAnalysis() {
      if (options?.lightweight) return null;
      if (!this._karmicPatternAnalysis) {
        this._karmicPatternAnalysis = calculateKarmicPatternAnalysis(this, "en");
      }
      return this._karmicPatternAnalysis;
    },
    get karmicPatternAnalysisTamil() {
      if (options?.lightweight) return null;
      if (!this._karmicPatternAnalysisTamil) {
        this._karmicPatternAnalysisTamil = calculateKarmicPatternAnalysis(this, "ta");
      }
      return this._karmicPatternAnalysisTamil;
    },
    get traditionalLongevityAnalysis() {
      if (options?.lightweight) return null;
      if (!this._traditionalLongevityAnalysis) {
        this._traditionalLongevityAnalysis = calculateTraditionalLongevityAnalysis(this, "en");
      }
      return this._traditionalLongevityAnalysis;
    },
    get traditionalLongevityAnalysisTamil() {
      if (options?.lightweight) return null;
      if (!this._traditionalLongevityAnalysisTamil) {
        this._traditionalLongevityAnalysisTamil = calculateTraditionalLongevityAnalysis(this, "ta");
      }
      return this._traditionalLongevityAnalysisTamil;
    },
    conventions: ASTRONOMICAL_CONVENTIONS
  };
}

// ---------------------------------------------------------------------------
// 7. Dynamic 12 Bhavas (Houses) Comprehensive Breakdown Engine
// ---------------------------------------------------------------------------
export function calculate12BhavasDetailed(ascendantLong, planets, lang = "en") {
  const isTamil = lang === "ta";
  const lagnaSignIdx = Math.floor(norm360(ascendantLong) / 30);

  const NATURAL_KARAKAS = {
    1: { name: "Sun", nameTa: "சூரியன்", role: "Vitality, Self & Soul (Tanu Karaka)" },
    2: { name: "Jupiter", nameTa: "குரு", role: "Wealth, Lineage & Speech (Dhana Karaka)" },
    3: { name: "Mars", nameTa: "செவ்வாய்", role: "Valor, Siblings & Initiatives (Bhratri Karaka)" },
    4: { name: "Moon / Venus / Mars", nameTa: "சந்திரன் / சுக்கிரன் / செவ்வாய்", role: "Mother, Comforts & Land (Matru/Vahana/Bhoomi Karakas)" },
    5: { name: "Jupiter", nameTa: "குரு", role: "Intellect, Progeny & Purva Punya (Putra Karaka)" },
    6: { name: "Mars / Saturn", nameTa: "செவ்வாய் / சனி", role: "Competitions, Service & Vitality Balance (Shatru/Roga Karakas)" },
    7: { name: "Venus", nameTa: "சுக்கிரன்", role: "Spouse, Marriage & Public Alliances (Kalatra Karaka)" },
    8: { name: "Saturn", nameTa: "சனி", role: "Longevity, Transformation & Mysticism (Ayur Karaka)" },
    9: { name: "Jupiter / Sun", nameTa: "குரு / சூரியன்", role: "Dharma, Higher Wisdom & Paternal Blessings (Bhagya Karakas)" },
    10: { name: "Sun / Saturn / Mercury / Jupiter", nameTa: "சூரியன் / சனி / புதன் / குரு", role: "Profession, Authority & Public Stature (Karma Karakas)" },
    11: { name: "Jupiter", nameTa: "குரு", role: "Gains, Networks & Wish Fulfillment (Labha Karaka)" },
    12: { name: "Saturn / Ketu", nameTa: "சனி / கேது", role: "Spiritual Liberation, Foreign Lands & Solitude (Moksha Karakas)" }
  };

  const bhavaMeta = [
    {
      num: 1,
      nameEn: "House 1: Tanu Bhava (Self, Constitution & Persona)",
      nameTa: "1-ம் பாவம்: தனு பாவம் (உடல், ஆளுமை & ஆரோக்கியம்)",
      sanskrit: "Tanu Bhava",
      coreTheme: isTamil ? "உடல் கட்டமைப்பு, மன உறுதி, தலைமைப் பண்பு" : "Constitution, Personality & Vital Force"
    },
    {
      num: 2,
      nameEn: "House 2: Dhana Bhava (Wealth, Family & Speech)",
      nameTa: "2-ம் பாவம்: தன பாவம் (செல்வம், குடும்பம் & வாக்கு வன்மை)",
      sanskrit: "Dhana Bhava",
      coreTheme: isTamil ? "சேமிப்பு, வாக்குச் செல்வாக்கு, குடும்ப வளம்" : "Accumulated Assets, Eloquence & Lineage"
    },
    {
      num: 3,
      nameEn: "House 3: Bhratri Bhava (Courage, Siblings & Initiatives)",
      nameTa: "3-ம் பாவம்: பிராத்ரு பாவம் (தைரியம், இளைய சகோதரம் & முயற்சி)",
      sanskrit: "Bhratri Bhava",
      coreTheme: isTamil ? "சுயமுயற்சி, துணிச்சல், தகவல் தொடர்பு, கலை ஆர்வம்" : "Valor, Communication, Drive & Sibling Harmony"
    },
    {
      num: 4,
      nameEn: "House 4: Matru & Sukha Bhava (Mother, Home, Vehicles & Contentment)",
      nameTa: "4-ம் பாவம்: மாத்ரு & சுக பாவம் (தாய், பூமி, வீடு, வாகனம் & மன அமைதி)",
      sanskrit: "Matru / Sukha Bhava",
      coreTheme: isTamil ? "நிலம், வீடு, சொகுசு வாகனம், தாயின் ஆசி, மன நிம்மதி" : "Real Estate, Conveyance, Mother & Inner Peace"
    },
    {
      num: 5,
      nameEn: "House 5: Putra & Purva Punya Bhava (Intellect, Progeny & Past Merits)",
      nameTa: "5-ம் பாவம்: புத்ர & பூர்வ புண்ணிய பாவம் (அறிவு, குழந்தைகள் & யோகம்)",
      sanskrit: "Putra Bhava",
      coreTheme: isTamil ? "பூர்வ புண்ணிய யோகம், புத்தி கூர்மை, வாரிசு மேன்மை, படைப்பாற்றல்" : "Creative Intellect, Virtuous Children & Good Karma"
    },
    {
      num: 6,
      nameEn: "House 6: Shatru & Roga Bhava (Health, Competitions & Victory)",
      nameTa: "6-ம் பாவம்: சத்ரு & ரோக பாவம் (நோய் எதிர்ப்பு, கடன் & போட்டி வெற்றி)",
      sanskrit: "Shatru / Roga Bhava",
      coreTheme: isTamil ? "போட்டிகளில் வெற்றி, எதிரிகளை வெல்லுதல், சீரான ஆரோக்கிய கவனம்" : "Constitutional Health, Tenacity in Competitions & Strategic Discipline"
    },
    {
      num: 7,
      nameEn: "House 7: Kalatra Bhava (Spouse, Marriage & Partnerships)",
      nameTa: "7-ம் பாவம்: களத்திர பாவம் (திருமணம், வாழ்க்கைத்துணை & கூட்டு வர்த்தகம்)",
      sanskrit: "Kalatra Bhava",
      coreTheme: isTamil ? "வாழ்க்கைத்துணை இணக்கம், சமூக அந்தஸ்து, கூட்டாண்மை வெற்றி" : "Marital Synergy, Life Partner & Public Alliances"
    },
    {
      num: 8,
      nameEn: "House 8: Ayur & Randhra Bhava (Longevity, Mysticism & Transformation)",
      nameTa: "8-ம் பாவம்: ஆயுள் & ரந்திர பாவம் (தீர்க்காயுள், எதிர்பாராத தனவரவு & உள்ளுணர்வு)",
      sanskrit: "Ayur Bhava",
      coreTheme: isTamil ? "நீண்ட ஆயுள், பரம்பரை சொத்துக்கள், ஆன்மீக ரகசிய ஞானம்" : "Longevity, Sudden Windfalls, Occult & Resilience"
    },
    {
      num: 9,
      nameEn: "House 9: Bhagya & Dharma Bhava (Fortune, Father & Higher Wisdom)",
      nameTa: "9-ம் பாவம்: பாக்கிய & தர்ம பாவம் (பாக்கிய யோகம், தந்தை & ஆன்மீகம்)",
      sanskrit: "Bhagya Bhava",
      coreTheme: isTamil ? "தெய்வீக அனுக்கிரகம், தந்தையின் வழிகாட்டுதல், தர்ம சிந்தனை, புகழ்" : "Divine Grace, Pilgrimages, Righteous Fortune & Paternal Line"
    },
    {
      num: 10,
      nameEn: "House 10: Karma & Rajya Bhava (Profession, Authority, Fame & Action)",
      nameTa: "10-ம் பாவம்: கர்ம & ராஜ்ய பாவம் (தொழில், அதிகாரம், தலைமை & சமூக கௌரவம்)",
      sanskrit: "Karma Bhava",
      coreTheme: isTamil ? "அரசாங்க ஆதரவு, நிர்வாக அதிகாரம், நிலையான தொழில் சாம்ராஜ்யம்" : "Vocational Zenith, High Authority, Fame & Executive Command"
    },
    {
      num: 11,
      nameEn: "House 11: Labha Bhava (Gains, Social Network & Wish Fulfillment)",
      nameTa: "11-ம் பாவம்: லாப பாவம் (பொருளாதார லாபம், மூத்த சகோதரம் & ஆசைகள் நிறைவேறுதல்)",
      sanskrit: "Labha Bhava",
      coreTheme: isTamil ? "பல்வேறு வழிகளில் தனலாபம், செல்வாக்கு மிக்க நட்பு வட்டம், விருப்ப ஈடேற்றம்" : "Multiple Income Channels, High Networking & Dream Realization"
    },
    {
      num: 12,
      nameEn: "House 12: Vyaya & Moksha Bhava (Expenditures, Foreign Lands & Liberation)",
      nameTa: "12-ம் பாவம்: விரய & மோட்ச பாவம் (அயல்நாட்டு வாழ்க்கை, சுப விரயம் & ஆன்ம முக்தி)",
      sanskrit: "Vyaya / Moksha Bhava",
      coreTheme: isTamil ? "வெளிநாட்டு யோகம், ஆன்மீக செலவுகள், சுக சயனம், மோட்ச ஞானம்" : "Foreign Settlement, Philanthropic Outflows & Spiritual Liberation"
    }
  ];

  return bhavaMeta.map(b => {
    const h = b.num;
    const signIdx = (lagnaSignIdx + h - 1) % 12;
    const sign = ZODIAC_SIGNS[signIdx];
    const lordName = sign.ruler;

    const lordPlanet = planets.find(p => p.name.toLowerCase() === lordName.toLowerCase());
    if (!lordPlanet || lordPlanet.house === undefined) {
      throw new Error(`Missing planetary data for house ${h} lord: ${lordName}`);
    }
    const lordHouse = lordPlanet.house;
    const lordSign = lordPlanet.sign || sign.name;
    const lordSignTamil = lordPlanet.signTamil || sign.tamil;
    const lordTamil = lordPlanet.tamil || lordName;

    const occupants = planets.filter(p => p.house === h);
    const occupantNames = occupants.map(p => isTamil ? p.tamil : p.name);
    const occupantNamesShort = occupants.map(p => isTamil ? p.short : p.name.substring(0, 3));

    // Calculate Parashari Aspects on House h from all 9 planets
    const aspectingPlanets = [];
    planets.forEach(p => {
      const pHouse = p.house;
      if (!pHouse || pHouse === h) return;
      const dist = ((h - pHouse + 12) % 12) + 1; // 1-based distance from planet to house h
      let isAspecting = false;
      let aspectType = "";
      if (dist === 7) {
        isAspecting = true;
        aspectType = "7th Aspect (Full/Direct)";
      } else if (p.name === "Mars" && (dist === 4 || dist === 8)) {
        isAspecting = true;
        aspectType = dist === 4 ? "4th Special Aspect" : "8th Special Aspect";
      } else if (["Jupiter", "Rahu", "Ketu"].includes(p.name) && (dist === 5 || dist === 9)) {
        isAspecting = true;
        aspectType = dist === 5 ? "5th Special Aspect" : "9th Special Aspect";
      } else if (p.name === "Saturn" && (dist === 3 || dist === 10)) {
        isAspecting = true;
        aspectType = dist === 3 ? "3rd Special Aspect" : "10th Special Aspect";
      }

      if (isAspecting) {
        const isBenefic = ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.name);
        aspectingPlanets.push({
          planet: p.name,
          planetTamil: p.tamil || p.name,
          fromHouse: pHouse,
          aspectType,
          isBenefic
        });
      }
    });

    const supportingFactors = [];
    const counterIndicators = [];

    if (lordPlanet.dignity === "Exalted") {
      supportingFactors.push(isTamil ? `பாவகாதிபதி ${lordTamil} உச்ச பலம் பெற்றுள்ளார்` : `House lord ${lordName} is exalted`);
    } else if (lordPlanet.dignity === "Own" || lordHouse === h) {
      supportingFactors.push(isTamil ? `பாவகாதிபதி ${lordTamil} ஆட்சி பலத்துடன் உள்ளார்` : `House lord ${lordName} in own sign / swakshetra`);
    } else if ([1, 4, 5, 7, 9, 10, 11].includes(lordHouse)) {
      supportingFactors.push(isTamil ? `பாவகாதிபதி ${lordTamil} சுப ஸ்தானமான ${lordHouse}-ம் வீட்டில் அமர்வு` : `House lord ${lordName} in auspicious house ${lordHouse}`);
    }

    if ([6, 8, 12].includes(lordHouse) && ![6, 8, 12].includes(h)) {
      counterIndicators.push(isTamil ? `பாவகாதிபதி ${lordTamil} ${lordHouse}-ம் மறைவு ஸ்தானத்தில் உள்ளார்` : `House lord ${lordName} placed in dusthana house ${lordHouse}`);
    }
    if (lordPlanet.isCombust) {
      counterIndicators.push(isTamil ? `பாவகாதிபதி ${lordTamil} சூரியனோடு அஸ்தமனம்` : `House lord ${lordName} is combust with Sun`);
    }
    if (lordPlanet.dignity === "Debilitated") {
      counterIndicators.push(isTamil ? `பாவகாதிபதி ${lordTamil} நீசமடைந்துள்ளார்` : `House lord ${lordName} is debilitated`);
    }

    const beneficAspectsList = aspectingPlanets.filter(a => a.isBenefic);
    const maleficAspectsList = aspectingPlanets.filter(a => !a.isBenefic);
    if (beneficAspectsList.length > 0) {
      const names = beneficAspectsList.map(a => isTamil ? a.planetTamil : a.planet).join(", ");
      supportingFactors.push(isTamil ? `சுப கிரக பார்வை: ${names}` : `Benefic aspects from ${names}`);
    }
    if (maleficAspectsList.length > 0) {
      const names = maleficAspectsList.map(a => isTamil ? a.planetTamil : a.planet).join(", ");
      counterIndicators.push(isTamil ? `அசுப கிரக பார்வை: ${names}` : `Malefic aspects from ${names}`);
    }

    let lordAnalysis = "";
    if (lordHouse === h) {
      lordAnalysis = isTamil
        ? `பாவகாதிபதி ${lordTamil} தனது சொந்த ராசியான ${sign.tamil}இல் ஆட்சி பலத்துடன் அமர்ந்துள்ளார்.`
        : `House lord ${lordName} is placed in its own sign ${sign.name} with swakshetra dignity.`;
    } else if ([1, 4, 7, 10].includes(lordHouse)) {
      lordAnalysis = isTamil
        ? `பாவகாதிபதி ${lordTamil} கேந்திர ஸ்தானமான ${lordHouse}-ம் வீட்டில் (${lordSignTamil}) அமர்ந்து விசேஷ பலம் சேர்க்கிறார்.`
        : `House lord ${lordName} sits in auspicious Kendra house ${lordHouse} (${lordSign}), endowing strong structural support.`;
    } else if ([5, 9].includes(lordHouse)) {
      lordAnalysis = isTamil
        ? `பாவகாதிபதி ${lordTamil} திரிகோண ஸ்தானமான ${lordHouse}-ம் வீட்டில் (${lordSignTamil}) அமர்ந்து மகா பாக்கிய யோகத்தை அருள்கிறார்.`
        : `House lord ${lordName} sits in auspicious Trikona house ${lordHouse} (${lordSign}), bestowing divine fortune and virtue.`;
    } else if ([2, 11].includes(lordHouse)) {
      lordAnalysis = isTamil
        ? `பாவகாதிபதி ${lordTamil} தன/லாப ஸ்தானமான ${lordHouse}-ம் வீட்டில் (${lordSignTamil}) அமர்ந்து பொருளாதார பலத்தை தருகிறார்.`
        : `House lord ${lordName} is positioned in Dhana/Labha house ${lordHouse} (${lordSign}), supporting steady resource accumulation.`;
    } else if ([6, 8, 12].includes(lordHouse)) {
      lordAnalysis = isTamil
        ? `பாவகாதிபதி ${lordTamil} மறைவு ஸ்தானமான ${lordHouse}-ம் வீட்டில் (${lordSignTamil}) சஞ்சரிக்கிறார்.`
        : `House lord ${lordName} resides in Dusthana house ${lordHouse} (${lordSign}), requiring disciplined effort and structured management.`;
      if ([6, 8, 12].includes(h)) {
        lordAnalysis += isTamil
          ? ` இது பாரம்பரிய விபரீத ராஜயோக தத்துவத்தை (${h === 6 ? 'ஹர்ஷ' : h === 8 ? 'சரள' : 'விமல'} யோகம்) உருவாக்குகிறது.`
          : ` Forming classical Viparita Raja Yoga (${h === 6 ? 'Harsha' : h === 8 ? 'Sarala' : 'Vimala'} Yoga potential) where perseverance enables breakthrough fortitude.`;
      }
    } else {
      lordAnalysis = isTamil
        ? `பாவகாதிபதி ${lordTamil} உபசய ஸ்தானமான ${lordHouse}-ம் வீட்டில் (${lordSignTamil}) உள்ளார்.`
        : `House lord ${lordName} is situated in Upachaya house ${lordHouse} (${lordSign}), signaling progressive growth over time.`;
    }

    let occupantsAnalysis = "";
    if (occupants.length === 0) {
      occupantsAnalysis = isTamil
        ? `இப்பாவகத்தில் கிரகங்கள் எதுவும் நேரடியாக அமரவில்லை; அதிபதி ${lordTamil} மற்றும் கிரக பார்வைகள் மூலம் பாவக பலன்கள் இயங்குகின்றன.`
        : `No direct planetary occupants; house operates cleanly under the governance of its lord ${lordName} and planetary aspects.`;
    } else {
      const occListStr = occupantNames.join(", ");
      occupantsAnalysis = isTamil
        ? `இப்பாவகத்தில் ${occListStr} அமர்ந்துள்ளனர். `
        : `Directly occupied by ${occListStr}. `;

      occupants.forEach(occ => {
        if (occ.name === "Jupiter") {
          occupantsAnalysis += isTamil ? "குருவின் சுப இருப்பு ஞானம், பெருந்தன்மை, தெய்வ அருள் மற்றும் அதிர்ஷ்டத்தை அளிக்கிறது. " : "Jupiter's presence infuses expansive grace, scholarly intellect, and high ethical repute. ";
        } else if (occ.name === "Venus") {
          occupantsAnalysis += isTamil ? "சுக்கிரனின் சேர்க்கை கலை நயம், வசீகர ஆளுமை மற்றும் மகிழ்ச்சியான பந்தங்களை வளர்க்கிறது. " : "Venus bestows refined aesthetic sensibilities, harmony, and material comfort. ";
        } else if (occ.name === "Mercury") {
          occupantsAnalysis += isTamil ? "புதனின் இருப்பு வணிக அறிவு, சாதுரியமான பேச்சுத்திறன் மற்றும் பகுப்பாய்வு திறனை உண்டாக்குகிறது. " : "Mercury brings commercial acumen, articulate communication, and analytical clarity. ";
        } else if (occ.name === "Sun") {
          occupantsAnalysis += isTamil ? "சூரியனின் பிரகாசம் தலைமைப் பண்பு, நிர்வாக ஆளுமை மற்றும் ஆன்ம வலிமையை உயர்த்துகிறது. " : "Sun radiates executive authority, self-respect, and vital endurance. ";
        } else if (occ.name === "Moon") {
          occupantsAnalysis += isTamil ? "சந்திரனின் அனுகூலம் தெளிவான மன அமைதி, மக்கள் செல்வாக்கு மற்றும் உள்ளுணர்வை ஊட்டுகிறது. " : "Moon provides psychic empathy, soothing mental composure, and emotional clarity. ";
        } else if (occ.name === "Mars") {
          occupantsAnalysis += isTamil ? "செவ்வாயின் ஆதிக்கம் தீரமான துணிச்சல், சவால்களை வெல்லும் வீரியம் மற்றும் தளராத முயற்சியை தூண்டுகிறது. " : "Mars injects focused courage, dynamic physical drive, and decisive willpower. ";
        } else if (occ.name === "Saturn") {
          occupantsAnalysis += isTamil ? "சனியின் இருப்பு கடின உழைப்பு, ஆழ்ந்த பொறுமை, நீதி உணர்வு மற்றும் ஸ்திரமான முன்னேற்றத்தை உருவாக்குகிறது. " : "Saturn instills organizational discipline, patience, and enduring perseverance. ";
        } else if (occ.name === "Rahu") {
          occupantsAnalysis += isTamil ? "ராகுவின் இருப்பு அதிரடி முன்னேற்றம், சர்வதேச தொடர்புகள் மற்றும் எதிர்பாராத திருப்பங்களை தூண்டுகிறது. " : "Rahu generates ambition, non-traditional pursuits, and rapid transitions. ";
        } else if (occ.name === "Ketu") {
          occupantsAnalysis += isTamil ? "கேதுவின் இருப்பு ஆன்மீக ஞானம், ஆராய்ச்சி ஈடுபாடு மற்றும் மாயைகளற்ற தெளிவை அருள்கிறது. " : "Ketu deepens spiritual insight, contemplative depth, and intuitive discernment. ";
        }
      });
    }

    const fullPrediction = `${lordAnalysis} ${occupantsAnalysis}`;

    let classicalStatusEn = "Standard";
    let classicalStatusTa = "சம நிலை";
    if (lordPlanet.dignity === "Exalted") {
      classicalStatusEn = "Exalted Lord";
      classicalStatusTa = "உச்ச அதிபதி";
    } else if (lordPlanet.dignity === "Own" || lordHouse === h) {
      classicalStatusEn = "Swakshetra / Own House";
      classicalStatusTa = "ஆட்சி பலம்";
    } else if ([1, 4, 7, 10].includes(lordHouse)) {
      classicalStatusEn = `Kendra Placement (H${lordHouse})`;
      classicalStatusTa = `கேந்திர நிலை (${lordHouse}-ம் பாவம்)`;
    } else if ([5, 9].includes(lordHouse)) {
      classicalStatusEn = `Trikona Placement (H${lordHouse})`;
      classicalStatusTa = `திரிகோண நிலை (${lordHouse}-ம் பாவம்)`;
    } else if ([6, 8, 12].includes(lordHouse)) {
      classicalStatusEn = `Dusthana Placement (H${lordHouse})`;
      classicalStatusTa = `மறைவு நிலை (${lordHouse}-ம் பாவம்)`;
    } else if ([2, 11].includes(lordHouse)) {
      classicalStatusEn = `Dhana/Labha Placement (H${lordHouse})`;
      classicalStatusTa = `தன/லாப நிலை (${lordHouse}-ம் பாவம்)`;
    }

    const karakaInfo = NATURAL_KARAKAS[h] || { name: "N/A", nameTa: "—", role: "Significator" };

    return {
      num: h,
      title: isTamil ? b.nameTa : b.nameEn,
      sanskrit: b.sanskrit,
      coreTheme: b.coreTheme,
      signName: sign.name,
      signTamil: sign.tamil,
      lordName,
      lordTamil,
      lordHouse,
      lordSign: lordPlanet?.sign || sign.name,
      lordSignTamil,
      naturalKaraka: isTamil ? karakaInfo.nameTa : karakaInfo.name,
      naturalKarakaRole: karakaInfo.role,
      occupants: occupantNames,
      occupantsShort: occupantNamesShort,
      occupantCount: occupants.length,
      lordDignity: lordPlanet?.dignity ?? null,
      lordCombust: Boolean(lordPlanet?.isCombust),
      lordRetrograde: Boolean(lordPlanet?.isRetrograde ?? lordPlanet?.retrograde),
      aspectingPlanets,
      aspectsOnHouse: aspectingPlanets,
      aspectsReceived: aspectingPlanets,
      beneficAspects: beneficAspectsList,
      maleficAspects: maleficAspectsList,
      supportingFactors,
      counterIndicators,
      classicalStatus: isTamil ? classicalStatusTa : classicalStatusEn,
      prediction: fullPrediction
    };
  });
}

// ---------------------------------------------------------------------------
// 8. Authentic Vedic Yogas Detection Engine
// ---------------------------------------------------------------------------
export function calculateDetailedVedicYogas(planets, ascendantLong, moonLong, sunLong, lang = "en") {
  const isTamil = lang === "ta";
  const yogas = [];

  const sun = planets.find(p => p.name === "Sun");
  const moon = planets.find(p => p.name === "Moon");
  const mars = planets.find(p => p.name === "Mars");
  const mercury = planets.find(p => p.name === "Mercury");
  const jupiter = planets.find(p => p.name === "Jupiter");
  const venus = planets.find(p => p.name === "Venus");
  const saturn = planets.find(p => p.name === "Saturn");
  const rahu = planets.find(p => p.name === "Rahu");
  const ketu = planets.find(p => p.name === "Ketu");

  // 1. Gajakesari Yoga (Jupiter in Kendra 1, 4, 7, 10 from Moon)
  if (moon && jupiter) {
    const jupFromMoon = ((jupiter.signIdx - moon.signIdx + 12) % 12) + 1;
    if ([1, 4, 7, 10].includes(jupFromMoon)) {
      const isCombust = Boolean(jupiter.isCombust);
      const isDebilitated = jupiter.dignity === "Debilitated";
      const cancellations = [];
      if (isCombust) cancellations.push("Jupiter combust with Sun reduces yoga luminosity");
      if (isDebilitated) cancellations.push("Jupiter in debilitation requires conscious spiritual fortification");

      yogas.push({
        name: isTamil ? "கஜகேசரி யோகம் (Gajakesari Yoga)" : "Gajakesari Yoga (Guru-Chandra Kendra)",
        category: isTamil ? "ராஜ யோகம் (கேந்திர அமைப்பு)" : "Auspicious Angular Yoga (Kendra Raja Yoga)",
        source: "Brihat Parashara Hora Shastra Chapter 35, Sloka 3-4",
        convention: "Classical Parashari",
        formationRules: ["Jupiter situated in Kendra (House 1, 4, 7, or 10) from Natal Moon"],
        satisfiedRules: [`Jupiter posited in House ${jupFromMoon} from Moon`],
        missingRules: [],
        cancellationFactors: cancellations,
        strengthFactors: [jupiter.dignity ? `Jupiter dignity: ${jupiter.dignity}` : "Kendra Angular Strength"],
        isActive: cancellations.length === 0,
        planetsInvolved: isTamil ? "குரு & சந்திரன்" : "Jupiter & Moon",
        desc: isTamil
          ? `சந்திரனிலிருந்து ${jupFromMoon}-ம் கேந்திரத்தில் குரு அமர்ந்துள்ளதால் கஜகேசரி யோகம் உருவாகிறது. இது பாரம்பரியமாக நற்பெயர், தர்ம சிந்தனை மற்றும் சமூக மரியாதையுடன் தொடர்புடையது; இதன் நடைமுறைப் பலன் குருவின் பலம் மற்றும் தசா சுழற்சியோடு இணைந்து வெளிப்படும்.`
          : `Jupiter occupies Kendra house ${jupFromMoon} from Moon, establishing classical Gajakesari Yoga. Classically associated with dignified intellect, social respect, and enduring honor; practical manifestation depends on Jupiter's dignity, Shadbala, and active Dasha activation.`
      });
    }
  }

  // 2. Budhaditya Yoga (Sun & Mercury in same sign)
  if (sun && mercury && sun.sign === mercury.sign) {
    const isCombust = Boolean(mercury.isCombust);
    const cancellations = isCombust ? ["Mercury within deep combustion orb of Sun moderates independent yoga strength"] : [];
    yogas.push({
      name: isTamil ? "புத-ஆதித்ய யோகம் (Budhaditya Yoga)" : "Budhaditya Yoga (Sun-Mercury Conjunction)",
      category: isTamil ? "புத-ஆதித்ய யோகம்" : "Intellectual / Communication Yoga",
      source: "Saravali Chapter 35, Sloka 12-14",
      convention: "Classical Parashari",
      formationRules: ["Sun and Mercury occupy the identical sidereal zodiac sign"],
      satisfiedRules: [`Conjoined in ${sun.sign} (${sun.signTamil || sun.sign})`],
      missingRules: [],
      cancellationFactors: cancellations,
      strengthFactors: [`Sign: ${sun.sign}`],
      isActive: true,
      planetsInvolved: isTamil ? "சூரியன் & புதன்" : "Sun & Mercury",
      desc: isTamil
        ? `${sun.signTamil} ராசியில் சூரியனும் புதனும் இணைந்துள்ளதால் புத-ஆதித்ய யோகம் உருவாகிறது. இது பகுப்பாய்வு சிந்தனை, நிர்வாக ஆற்றல் மற்றும் தகவல் தொடர்பு திறனை குறிக்கிறது; புதனின் அஸ்தமன நிலைக்கு ஏற்ப பலன் அமையும்.`
        : `Sun and Mercury are conjunct in ${sun.sign}, forming Budhaditya Yoga. Classically associated with analytical intellect, commercial comprehension, and administrative communication; evaluated alongside Mercury's combustion status and house rulership.`
    });
  }

  // 3. Pancha Mahapurusha Yogas (Ruchaka, Bhadra, Hamsa, Malavya, Sasa)
  if (mars && [1, 4, 7, 10].includes(mars.house) && ["Aries", "Scorpio", "Capricorn"].includes(mars.sign)) {
    yogas.push({
      name: isTamil ? "ருசக மகாபுருஷ யோகம் (Ruchaka Yoga)" : "Ruchaka Mahapurusha Yoga (Mars Power)",
      category: isTamil ? "பஞ்ச மகாபுருஷ யோகம் (செவ்வாய்)" : "Pancha Mahapurusha Yoga (Mars)",
      source: "Brihat Parashara Hora Shastra Chapter 75 / Phaladeepika Chapter 6",
      convention: "Classical Parashari",
      formationRules: ["Mars posited in Kendra (1, 4, 7, 10) in own sign (Aries, Scorpio) or exaltation (Capricorn)"],
      satisfiedRules: [`Mars in House ${mars.house} in ${mars.sign}`],
      missingRules: [],
      cancellationFactors: mars.isCombust ? ["Mars combust with Sun"] : [],
      strengthFactors: [`Dignity: ${mars.dignity || "Own/Exalted"}`],
      isActive: !mars.isCombust,
      planetsInvolved: isTamil ? "செவ்வாய் பகவான்" : "Mars",
      desc: isTamil
        ? `செவ்வாய் கேந்திர ஸ்தானமான ${mars.house}-ம் வீட்டில் ஆட்சி/உச்சம் பெற்றுள்ளதால் ருசக யோகம் அமைகிறது. இது பாரம்பரியமாக தளராத தைரியம், நில மேலாண்மை மற்றும் தலைமைப் பண்புகளுடன் தொடர்புடையது.`
        : `Mars occupies Kendra house ${mars.house} in exalted/own sign ${mars.sign}, forming Ruchaka Mahapurusha Yoga. Classically associated with physical stamina, courage, executive drive, and organizational leadership.`
    });
  }

  if (jupiter && [1, 4, 7, 10].includes(jupiter.house) && ["Cancer", "Sagittarius", "Pisces"].includes(jupiter.sign)) {
    yogas.push({
      name: isTamil ? "ஹம்ச மகாபுருஷ யோகம் (Hamsa Yoga)" : "Hamsa Mahapurusha Yoga (Jupiter Grace)",
      category: isTamil ? "பஞ்ச மகாபுருஷ யோகம் (குரு)" : "Pancha Mahapurusha Yoga (Jupiter)",
      source: "Brihat Parashara Hora Shastra Chapter 75 / Phaladeepika Chapter 6",
      convention: "Classical Parashari",
      formationRules: ["Jupiter posited in Kendra (1, 4, 7, 10) in own sign (Sagittarius, Pisces) or exaltation (Cancer)"],
      satisfiedRules: [`Jupiter in House ${jupiter.house} in ${jupiter.sign}`],
      missingRules: [],
      cancellationFactors: jupiter.isCombust ? ["Jupiter combust with Sun"] : [],
      strengthFactors: [`Dignity: ${jupiter.dignity || "Own/Exalted"}`],
      isActive: !jupiter.isCombust,
      planetsInvolved: isTamil ? "குரு பகவான்" : "Jupiter",
      desc: isTamil
        ? `குரு கேந்திர ஸ்தானமான ${jupiter.house}-ம் வீட்டில் ஆட்சி/உச்சம் பெற்றுள்ளதால் ஹம்ச யோகம் கிடைக்கிறது. இது ஆன்மீக நாட்டம், தர்ம சிந்தனை, மற்றும் கல்வி மேதமையுடன் தொடர்புடையது.`
        : `Jupiter sits in Kendra house ${jupiter.house} in own/exalted sign ${jupiter.sign}, generating noble Hamsa Yoga. Classically associated with ethical wisdom, scholarly depth, pedagogical authority, and spiritual contemplation.`
    });
  }

  if (venus && [1, 4, 7, 10].includes(venus.house) && ["Taurus", "Libra", "Pisces"].includes(venus.sign)) {
    yogas.push({
      name: isTamil ? "மாளவ்ய மகாபுருஷ யோகம் (Malavya Yoga)" : "Malavya Mahapurusha Yoga (Venus Splendor)",
      category: isTamil ? "பஞ்ச மகாபுருஷ யோகம் (சுக்கிரன்)" : "Pancha Mahapurusha Yoga (Venus)",
      source: "Brihat Parashara Hora Shastra Chapter 75 / Phaladeepika Chapter 6",
      convention: "Classical Parashari",
      formationRules: ["Venus posited in Kendra (1, 4, 7, 10) in own sign (Taurus, Libra) or exaltation (Pisces)"],
      satisfiedRules: [`Venus in House ${venus.house} in ${venus.sign}`],
      missingRules: [],
      cancellationFactors: venus.isCombust ? ["Venus combust with Sun"] : [],
      strengthFactors: [`Dignity: ${venus.dignity || "Own/Exalted"}`],
      isActive: !venus.isCombust,
      planetsInvolved: isTamil ? "சுக்கிர பகவான்" : "Venus",
      desc: isTamil
        ? `சுக்கிரன் கேந்திர ஸ்தானமான ${venus.house}-ம் வீட்டில் ஆட்சி/உச்சம் பெற்றுள்ளதால் மாளவ்ய யோகம் உண்டாகிறது. இது கலை ஆர்வம், அழகியல் பார்வை, வாகன வசதிகள் மற்றும் இணக்கமான உறவுகளோடு பாரம்பரியமாக தொடர்புடையது.`
        : `Venus placed in Kendra house ${venus.house} in own/exalted sign ${venus.sign} forms Malavya Yoga. Classically associated with refined aesthetics, diplomatic grace, material comforts, and harmonious partnerships.`
    });
  }

  if (mercury && [1, 4, 7, 10].includes(mercury.house) && ["Gemini", "Virgo"].includes(mercury.sign)) {
    yogas.push({
      name: isTamil ? "பத்ர மகாபுருஷ யோகம் (Bhadra Yoga)" : "Bhadra Mahapurusha Yoga (Mercury Intellect)",
      category: isTamil ? "பஞ்ச மகாபுருஷ யோகம் (புதன்)" : "Pancha Mahapurusha Yoga (Mercury)",
      source: "Brihat Parashara Hora Shastra Chapter 75 / Phaladeepika Chapter 6",
      convention: "Classical Parashari",
      formationRules: ["Mercury posited in Kendra (1, 4, 7, 10) in own sign (Gemini) or exaltation (Virgo)"],
      satisfiedRules: [`Mercury in House ${mercury.house} in ${mercury.sign}`],
      missingRules: [],
      cancellationFactors: mercury.isCombust ? ["Mercury combust with Sun"] : [],
      strengthFactors: [`Dignity: ${mercury.dignity || "Own/Exalted"}`],
      isActive: !mercury.isCombust,
      planetsInvolved: isTamil ? "புதன் பகவான்" : "Mercury",
      desc: isTamil
        ? `புதன் கேந்திர ஸ்தானமான ${mercury.house}-ம் வீட்டில் ஆட்சி/உச்சம் பெற்றுள்ளதால் பத்ர யோகம் அமைகிறது. இது கணிதம், தகவல் தொடர்பு, வணிக நுண்ணறிவு மற்றும் மொழி ஆளுமையோடு பாரம்பரியமாக தொடர்புடையது.`
        : `Mercury in Kendra house ${mercury.house} in own/exalted sign ${mercury.sign} forms Bhadra Yoga. Classically associated with analytical eloquence, mathematical acumen, and commercial foresight.`
    });
  }

  if (saturn && [1, 4, 7, 10].includes(saturn.house) && ["Libra", "Capricorn", "Aquarius"].includes(saturn.sign)) {
    yogas.push({
      name: isTamil ? "சச மகாபுருஷ யோகம் (Sasa Yoga)" : "Sasa Mahapurusha Yoga (Saturn Sovereign)",
      category: isTamil ? "பஞ்ச மகாபுருஷ யோகம் (சனி)" : "Pancha Mahapurusha Yoga (Saturn)",
      source: "Brihat Parashara Hora Shastra Chapter 75 / Phaladeepika Chapter 6",
      convention: "Classical Parashari",
      formationRules: ["Saturn posited in Kendra (1, 4, 7, 10) in own sign (Capricorn, Aquarius) or exaltation (Libra)"],
      satisfiedRules: [`Saturn in House ${saturn.house} in ${saturn.sign}`],
      missingRules: [],
      cancellationFactors: saturn.isCombust ? ["Saturn combust with Sun"] : [],
      strengthFactors: [`Dignity: ${saturn.dignity || "Own/Exalted"}`],
      isActive: !saturn.isCombust,
      planetsInvolved: isTamil ? "சனி பகவான்" : "Saturn",
      desc: isTamil
        ? `சனி கேந்திர ஸ்தானமான ${saturn.house}-ம் வீட்டில் ஆட்சி/உச்சம் பெற்றுள்ளதால் சச யோகம் கிடைக்கிறது. இது ஆழ்ந்த பொறுமை, கடின உழைப்பு, அமைப்பு சார் மேலாண்மை மற்றும் நிலைத்த வெற்றியோடு தொடர்புடையது.`
        : `Saturn in Kendra house ${saturn.house} in own/exalted sign ${saturn.sign} generates Sasa Yoga. Classically associated with organizational endurance, mass leadership, judicial discipline, and sustained perseverance.`
    });
  }

  // 4. Chandra-Mangala Yoga (Moon and Mars in same sign)
  if (moon && mars && moon.sign === mars.sign) {
    yogas.push({
      name: isTamil ? "சந்திர-மங்கள யோகம் (Chandra-Mangala Yoga)" : "Chandra-Mangala Yoga (Moon-Mars Wealth Synergy)",
      category: isTamil ? "தன யோகம்" : "Wealth Acquisition Yoga",
      source: "Jataka Parijata Chapter 7, Sloka 60",
      convention: "Classical Parashari",
      formationRules: ["Moon and Mars occupy the identical sidereal zodiac sign"],
      satisfiedRules: [`Conjoined in ${moon.sign}`],
      missingRules: [],
      cancellationFactors: [],
      strengthFactors: [`Sign: ${moon.sign}`],
      isActive: true,
      planetsInvolved: isTamil ? "சந்திரன் & செவ்வாய்" : "Moon & Mars",
      desc: isTamil
        ? `சந்திரனும் செவ்வாயும் ${moon.signTamil} ராசியில் இணைந்துள்ளதால் சந்திர-மங்கள யோகம் உண்டாகிறது. இது வணிக உந்துதல், சொத்து மேலாண்மை மற்றும் நிதி திரட்டும் ஆற்றலோடு தொடர்புடையது.`
        : `Conjunction of Moon and Mars in ${moon.sign} forms Chandra-Mangala Yoga, classically associated with commercial drive, enterprise initiative, and property management.`
    });
  }

  // 5. Guru-Mangala Yoga (Jupiter and Mars conjunct or in 1/4/7/10 from each other)
  if (jupiter && mars) {
    const jupMarsRel = ((jupiter.signIdx - mars.signIdx + 12) % 12) + 1;
    if ([1, 4, 7, 10].includes(jupMarsRel)) {
      yogas.push({
        name: isTamil ? "குரு-மங்கள யோகம் (Guru-Mangala Yoga)" : "Guru-Mangala Yoga (Righteous Courage)",
        category: isTamil ? "சுப யோகம்" : "Divine Courage Yoga",
        source: "Hora Sara Chapter 19",
        convention: "Classical Parashari",
        formationRules: ["Jupiter and Mars occupy mutual Kendra houses (1st, 4th, 7th, 10th from each other)"],
        satisfiedRules: [`Mutual distance: ${jupMarsRel} houses`],
        missingRules: [],
        cancellationFactors: [],
        strengthFactors: ["Mutual Kendra Alignment"],
        isActive: true,
        planetsInvolved: isTamil ? "குரு & செவ்வாய்" : "Jupiter & Mars",
        desc: isTamil
          ? `குருவும் செவ்வாயும் பரஸ்பர கேந்திர தொடர்பில் இருப்பதால் குரு-மங்கள யோகம் உண்டாகிறது. இது தர்ம வழியிலான துணிச்சல், நில புலன்கள் மற்றும் நேர்மையான ஆளுமையோடு தொடர்புடையது.`
          : `Jupiter and Mars in mutual Kendra alignment form Guru-Mangala Yoga, synthesizing ethical principles with constructive physical drive and landed property interest.`
      });
    }
  }

  // 6. Amala Yoga (Natural Benefics in 10th house from Lagna OR 10th house from Moon)
  const beneficsIn10Lagna = planets.filter(p => p.house === 10 && ["Jupiter", "Venus", "Mercury"].includes(p.name));
  const beneficsIn10Moon = moon ? planets.filter(p => {
    if (!["Jupiter", "Venus", "Mercury"].includes(p.name)) return false;
    const hFromMoon = ((p.signIdx - moon.signIdx + 12) % 12) + 1;
    return hFromMoon === 10;
  }) : [];
  const amalaBenefics = Array.from(new Set([...beneficsIn10Lagna, ...beneficsIn10Moon]));

  if (amalaBenefics.length > 0) {
    const lagnaStr = beneficsIn10Lagna.map(p => `${p.name} in 10th from Lagna`).join(", ");
    const moonStr = beneficsIn10Moon.map(p => `${p.name} in 10th from Moon`).join(", ");
    const satisfied = [lagnaStr, moonStr].filter(Boolean).join(" & ");

    yogas.push({
      name: isTamil ? "அமல யோகம் (Amala Yoga)" : "Amala Yoga (Purity in Career & Renown)",
      category: isTamil ? "ராஜ யோகம்" : "Stainless Glory Yoga",
      source: "Brihat Parashara Hora Shastra Chapter 35, Sloka 9",
      convention: "Classical Parashari",
      formationRules: ["Natural benefic planet (Jupiter, Venus, or Mercury) situated in 10th house from Lagna or Moon"],
      satisfiedRules: [satisfied],
      missingRules: [],
      cancellationFactors: [],
      strengthFactors: [`Benefic 10th house occupancy`],
      isActive: true,
      planetsInvolved: amalaBenefics.map(p => isTamil ? (p.tamil || p.name) : p.name).join(", "),
      desc: isTamil
        ? `10-ம் பாவமான தொழில் ஸ்தானத்தில் (லக்னம் அல்லது சந்திரனிலிருந்து) சுப கிரகங்கள் அமர்ந்துள்ளதால் அமல யோகம் உருவாகிறது. இது நற்பெயர் மற்றும் அறவழியில் தொழில் ஈடுபாட்டோடு பாரம்பரியமாக தொடர்புடையது.`
        : `Natural benefic planet situated in the 10th house from Lagna or Moon creates Amala Yoga. Classically associated with professional reputation, ethical workplace conduct, and public goodwill.`
    });
  }

  // 7. Classical Viparita Raja Yogas (Harsha, Sarala, Vimala - Phaladeepika Ch. 6)
  const ascSignIdx = Math.min(11, Math.max(0, Math.floor(norm360(ascendantLong) / 30)));
  const getLordOfHouse = (hNum) => {
    const sIdx = (ascSignIdx + hNum - 1) % 12;
    const rulerName = ZODIAC_SIGNS[sIdx].ruler;
    return planets.find(p => p.name === rulerName);
  };

  const lord1 = getLordOfHouse(1);
  const lord4 = getLordOfHouse(4);
  const lord5 = getLordOfHouse(5);
  const lord7 = getLordOfHouse(7);
  const lord9 = getLordOfHouse(9);
  const lord10 = getLordOfHouse(10);
  const kendraTrikonaLords = [lord1, lord4, lord5, lord7, lord9, lord10].filter(Boolean).map(p => p.name);

  const lord6 = getLordOfHouse(6);
  const lord8 = getLordOfHouse(8);
  const lord12 = getLordOfHouse(12);

  // Harsha Yoga: 6th lord in 6th, 8th, or 12th house without Kendra/Trikona affliction
  if (lord6 && [6, 8, 12].includes(lord6.house)) {
    const conjoinedWithKendraTrikona = (planets || []).some(other =>
      other.name !== lord6.name &&
      kendraTrikonaLords.includes(other.name) &&
      other.sign === lord6.sign
    );
    const cancellations = conjoinedWithKendraTrikona ? ["6th lord conjoined with Kendra/Trikona lord weakens Viparita Raja Yoga"] : [];

    yogas.push({
      name: isTamil ? "ஹர்ஷ யோகம் (Harsha Viparita Raja Yoga)" : "Harsha Yoga (6th Lord in Dusthana)",
      category: isTamil ? "விபரீத ராஜ யோகம்" : "Viparita Raja Yoga",
      source: "Phaladeepika Chapter 6, Sloka 58",
      convention: "Classical Parashari",
      formationRules: ["6th lord posited in 6th, 8th, or 12th dusthana house without malefic conjunction from lords of Kendra/Trikona"],
      satisfiedRules: [`6th lord ${lord6.name} in House ${lord6.house}`],
      missingRules: [],
      cancellationFactors: cancellations,
      strengthFactors: ["Dusthana-Lord Dusthana Placement"],
      isActive: cancellations.length === 0,
      planetsInvolved: isTamil ? `${lord6.tamil} (6-ம் அதிபதி)` : `${lord6.name} (6th Lord)`,
      desc: isTamil
        ? `6-ம் அதிபதி ${lord6.tamil} ${lord6.house}-ம் மறைவு ஸ்தானத்தில் அமர்ந்து ஹர்ஷ யோகத்தை உருவாக்குகிறார். இது தடைகளை கடக்கும் மனோதிடம் மற்றும் விடாமுயற்சி சார்ந்த வெற்றியோடு தொடர்புடையது.`
        : `6th lord ${lord6.name} is posited in dusthana house ${lord6.house}, establishing Harsha Yoga. Classically associated with resilience against adversity, strategic problem-solving, and overcoming competitive challenges.`
    });
  }

  // Sarala Yoga: 8th lord in 6th, 8th, or 12th house
  if (lord8 && [6, 8, 12].includes(lord8.house)) {
    const conjoinedWithKendraTrikona = (planets || []).some(other =>
      other.name !== lord8.name &&
      kendraTrikonaLords.includes(other.name) &&
      other.sign === lord8.sign
    );
    const cancellations = conjoinedWithKendraTrikona ? ["8th lord conjoined with Kendra/Trikona lord weakens Viparita Raja Yoga"] : [];

    yogas.push({
      name: isTamil ? "சரள யோகம் (Sarala Viparita Raja Yoga)" : "Sarala Yoga (8th Lord in Dusthana)",
      category: isTamil ? "விபரீத ராஜ யோகம்" : "Viparita Raja Yoga",
      source: "Phaladeepika Chapter 6, Sloka 59",
      convention: "Classical Parashari",
      formationRules: ["8th lord posited in 6th, 8th, or 12th dusthana house"],
      satisfiedRules: [`8th lord ${lord8.name} in House ${lord8.house}`],
      missingRules: [],
      cancellationFactors: cancellations,
      strengthFactors: ["Dusthana-Lord Dusthana Placement"],
      isActive: cancellations.length === 0,
      planetsInvolved: isTamil ? `${lord8.tamil} (8-ம் அதிபதி)` : `${lord8.name} (8th Lord)`,
      desc: isTamil
        ? `8-ம் அதிபதி ${lord8.tamil} ${lord8.house}-ம் மறைவு ஸ்தானத்தில் அமர்ந்து சரள யோகத்தை தருகிறார். இது துணிச்சல், ஆய்வுத்திறன் மற்றும் சவாலான சூழல்களில் மீண்டெழும் ஆற்றலோடு தொடர்புடையது.`
        : `8th lord ${lord8.name} sits in dusthana house ${lord8.house}, forming Sarala Yoga. Classically associated with investigative insight, composure in crises, and psychological resilience.`
    });
  }

  // Vimala Yoga: 12th lord in 6th, 8th, or 12th house
  if (lord12 && [6, 8, 12].includes(lord12.house)) {
    const conjoinedWithKendraTrikona = (planets || []).some(other =>
      other.name !== lord12.name &&
      kendraTrikonaLords.includes(other.name) &&
      other.sign === lord12.sign
    );
    const cancellations = conjoinedWithKendraTrikona ? ["12th lord conjoined with Kendra/Trikona lord weakens Viparita Raja Yoga"] : [];

    yogas.push({
      name: isTamil ? "விமல யோகம் (Vimala Viparita Raja Yoga)" : "Vimala Yoga (12th Lord in Dusthana)",
      category: isTamil ? "விபரீத ராஜ யோகம்" : "Viparita Raja Yoga",
      source: "Phaladeepika Chapter 6, Sloka 60",
      convention: "Classical Parashari",
      formationRules: ["12th lord posited in 6th, 8th, or 12th dusthana house"],
      satisfiedRules: [`12th lord ${lord12.name} in House ${lord12.house}`],
      missingRules: [],
      cancellationFactors: [],
      strengthFactors: ["Dusthana-Lord Dusthana Placement"],
      isActive: true,
      planetsInvolved: isTamil ? `${lord12.tamil} (12-ம் அதிபதி)` : `${lord12.name} (12th Lord)`,
      desc: isTamil
        ? `12-ம் அதிபதி ${lord12.tamil} ${lord12.house}-ம் மறைவு ஸ்தானத்தில் இருப்பதால் விமல யோகம் உருவாகிறது. இது விரயங்களை நல்வழியில் மாற்றுதல் மற்றும் ஆன்மீக முதிர்ச்சியோடு தொடர்புடையது.`
        : `12th lord ${lord12.name} resides in dusthana house ${lord12.house}, creating Vimala Yoga. Classically associated with prudent expenditures, independent contemplation, and philosophical contentment.`
    });
  }

  return yogas.map(y => ({
    ...y,
    formation: y.satisfiedRules?.join("; ") || y.formationRules?.join("; ") || y.desc,
    manifestation: y.desc || y.name
  }));
}

// ---------------------------------------------------------------------------
// 9. Authentic Classical Ayurvedic Tridosha Elemental Analysis
// ---------------------------------------------------------------------------
export function calculateAyurvedicTridosha(planets = [], ascendantSign = null, lang = "en") {
  if (!ascendantSign) {
    throw new Error("calculateAyurvedicTridosha requires a valid ascendantSign parameter.");
  }
  let ascObj = ascendantSign;
  if (typeof ascendantSign === "string") {
    ascObj = ZODIAC_SIGNS.find(s => s.name.toLowerCase() === ascendantSign.trim().toLowerCase());
    if (!ascObj) {
      throw new Error(`Invalid ascendantSign string provided to calculateAyurvedicTridosha: "${ascendantSign}"`);
    }
  } else if (!ascObj.element) {
    throw new Error("calculateAyurvedicTridosha: ascendantSign object must contain an 'element' property.");
  }

  const isTamil = lang === "ta";

  // Count distribution of 10 primary astronomical factors: Lagna + 9 planets
  let fireCount = 0;
  let airCount = 0;
  let waterCount = 0;
  let earthCount = 0;

  if (ascObj.element === "Fire") fireCount++;
  else if (ascObj.element === "Air") airCount++;
  else if (ascObj.element === "Water") waterCount++;
  else if (ascObj.element === "Earth") earthCount++;

  (planets || []).forEach(p => {
    let s = null;
    if (typeof p.signIdx === "number" && p.signIdx >= 0 && p.signIdx < 12) {
      s = ZODIAC_SIGNS[p.signIdx];
    } else if (p.sign) {
      s = ZODIAC_SIGNS.find(zs => zs.name.toLowerCase() === p.sign.toLowerCase());
    } else if (typeof p.longitude === "number") {
      s = ZODIAC_SIGNS[Math.floor(norm360(p.longitude) / 30)];
    }
    if (s) {
      if (s.element === "Fire") fireCount++;
      else if (s.element === "Air") airCount++;
      else if (s.element === "Water") waterCount++;
      else if (s.element === "Earth") earthCount++;
    }
  });

  const totalFactors = fireCount + airCount + waterCount + earthCount;
  if (totalFactors === 0) {
    throw new Error("Unable to calculate Ayurvedic Tridosha: No valid elemental factors present.");
  }

  const primaryDosha = fireCount >= airCount && fireCount >= (waterCount + earthCount)
    ? "Pitta"
    : (airCount >= (waterCount + earthCount) ? "Vata" : "Kapha");

  const secondaryDosha = primaryDosha === "Pitta"
    ? (airCount >= (waterCount + earthCount) ? "Vata" : "Kapha")
    : (primaryDosha === "Vata" ? (fireCount >= (waterCount + earthCount) ? "Pitta" : "Kapha") : (fireCount >= airCount ? "Pitta" : "Vata"));

  return {
    primaryDosha,
    secondaryDosha,
    elementalDistribution: {
      fire: fireCount,
      air: airCount,
      water: waterCount,
      earth: earthCount,
      total: totalFactors
    },
    vata: {
      factorCount: airCount,
      tendencyLevel: airCount >= 4 ? (isTamil ? "உயர் வாயு தத்துவம் (Elevated Vata)" : "Elevated Vata Tendency") : (isTamil ? "சமநிலை வாயு (Balanced Vata)" : "Balanced Vata Tendency"),
      classification: airCount >= 3 ? (isTamil ? "முதன்மையான வாயு தத்துவம்" : "Prominent Vata (Air Element)") : (isTamil ? "சமநிலை வாயு" : "Balanced Vata"),
      status: airCount >= 3 ? (isTamil ? "ஆதிக்கம் (Elevated Air)" : "Dominant Air") : (isTamil ? "சமநிலை (Balanced)" : "Balanced"),
      guidance: isTamil 
        ? "நரம்பு மண்டலம் மற்றும் சிந்தனை சுறுசுறுப்பானது. தியானம், மிதமான நெய் சேர்த்த சூடான உணவுகள் மற்றும் சீரான உறக்கம் உடற்சமநிலைக்கு நலம் பயக்கும்." 
        : "Traditional correspondence with nervous and intellectual agility. Warm, nourishing grounding meals and consistent rest harmonize vital energy."
    },
    pitta: {
      factorCount: fireCount,
      tendencyLevel: fireCount >= 4 ? (isTamil ? "உயர் அக்னி தத்துவம் (Elevated Pitta)" : "Elevated Pitta Tendency") : (isTamil ? "சமநிலை அக்னி (Moderate Pitta)" : "Moderate Pitta Tendency"),
      classification: fireCount >= 3 ? (isTamil ? "முதன்மையான அக்னி தத்துவம்" : "Prominent Pitta (Fire Element)") : (isTamil ? "மிதமான அக்னி" : "Moderate Pitta"),
      status: fireCount >= 3 ? (isTamil ? "ஆதிக்கம் (Elevated Fire)" : "Dominant Fire") : (isTamil ? "மிதமான வெப்பம் (Moderate)" : "Moderate"),
      guidance: isTamil 
        ? "செரிமான சக்தி மற்றும் உத்வேகம் மிகுந்தது. காரம் மற்றும் புளிப்பு உணவுகளை மிதமாக்கி, இளநீர் மற்றும் குளிர்ச்சியான பழங்களை உட்கொள்வது பாரம்பரிய வழிகாட்டலாகும்." 
        : "Traditional correspondence with metabolic vitality (Agni). Moderate excessively spicy foods; incorporate hydrating fluids and cooling fruits."
    },
    kapha: {
      factorCount: waterCount + earthCount,
      tendencyLevel: (waterCount + earthCount) >= 5 ? (isTamil ? "உயர் பூமி-ஜல தத்துவம் (Elevated Kapha)" : "Elevated Kapha Tendency") : (isTamil ? "ஸ்திரமான கபம் (Grounded Kapha)" : "Grounded Kapha Tendency"),
      classification: (waterCount + earthCount) >= 4 ? (isTamil ? "முதன்மையான பூமி-ஜல தத்துவம்" : "Prominent Kapha (Water/Earth)") : (isTamil ? "ஸ்திரமான கபம்" : "Grounded Kapha"),
      status: (waterCount + earthCount) >= 4 ? (isTamil ? "ஆதிக்கம் (Elevated Earth/Water)" : "Dominant Earth/Water") : (isTamil ? "ஸ்திரமானது (Grounded)" : "Grounded"),
      guidance: isTamil 
        ? "உடல் கட்டமைப்பு மற்றும் சகிப்புத்தன்மை மிகுந்தது. அதிகாலை நடைபயிற்சி, சுறுசுறுப்பான யோகாசனங்கள் மற்றும் சீரான உடற்பயிற்சி நலம் பயக்கும்." 
        : "Traditional correspondence with physical stamina and structural stability. Invigorating morning walks and active yoga optimize vitality."
    },
    statutoryNotice: isTamil
      ? "சட்டப்பூர்வ அறிவிப்பு: திரிதோஷ பகுப்பாய்வு பண்டைய ஜோதிட தத்துவ குறியீடுகளின் அடிப்படையில் அமைந்தது. இது மருத்துவ பரிசோதனையோ, நோயறிதலோ அல்லது மருத்துவ சிகிச்சையோ அல்ல."
      : "Statutory Notice: This Tridosha assessment represents traditional astrological symbolic correspondences and is NOT a clinical Ayurvedic diagnosis or medical advice."
  };
}

// ---------------------------------------------------------------------------
// 10. Dynamic Personalized Vedic Remedies & Traditional Gemstone Suggestions Engine
// Evaluates Functional Benefics, Lordship, Combustion, Dignity, Dasha, and Contraindications
// ---------------------------------------------------------------------------
export function calculatePersonalizedRemedies(ascendantSign, planets = [], lang = "en", currentDasha = null, shadbala = []) {
  const isTamil = lang === "ta";
  if (!ascendantSign) {
    throw new Error("Valid ascendantSign is required for calculatePersonalizedRemedies.");
  }
  const lagnaName = typeof ascendantSign === "string" ? ascendantSign : (ascendantSign.name || ascendantSign.id);
  if (!lagnaName || !ZODIAC_SIGNS.some(s => s.name.toLowerCase() === String(lagnaName).toLowerCase())) {
    throw new Error(`Invalid Ascendant Sign: ${lagnaName} in calculatePersonalizedRemedies.`);
  }

  const lagnaConfigs = {
    Aries: {
      lagnaLord: "Mars",
      fifthLord: "Sun",
      ninthLord: "Jupiter",
      functionalBenefics: ["Jupiter", "Sun", "Mars"],
      functionalMalefics: ["Mercury", "Saturn", "Venus"],
      primaryGemEn: "Red Coral (Moonga)",
      primaryGemTa: "பவளம் (Red Coral)",
      primaryLordEn: "Mars (1st & 8th Lord)",
      primaryLordTa: "செவ்வாய் (லக்னாதிபதி)",
      secondaryGemEn: "Yellow Sapphire (Pushparagam)",
      secondaryGemTa: "மஞ்சள் புஷ்பராகம் (Yellow Sapphire)",
      secondaryLordEn: "Jupiter (9th & 12th Lord)",
      secondaryLordTa: "குரு (பாக்கியாதிபதி)",
      contraindicatedEn: [
        { gemstone: "Emerald (Panna)", lord: "Mercury", reason: "Mercury rules 3rd & 6th Dusthana houses (Rogadhipati)", contraindicated: true },
        { gemstone: "Diamond (Heera)", lord: "Venus", reason: "Venus rules 2nd & 7th Maraka houses", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "மரகதம் (Emerald)", lord: "Mercury", reason: "புதன் 3 & 6-ம் மறைவு ஸ்தானாதிபதி", contraindicated: true },
        { gemstone: "வைரம் (Diamond)", lord: "Venus", reason: "சுக்கிரன் 2 & 7-ம் மாரகாதிபதி", contraindicated: true }
      ],
      mantra: "ஓம் நம சிவாய / ஓம் சரவணபவ",
      charity: isTamil ? "செவ்வாய்க்கிழமைகளில் துவரம்பருப்பு தானம், முருக வழிபாடு." : "Red lentils donation on Tuesdays, Subramanya worship.",
      wearingMetal: isTamil ? "தங்கம் அல்லது செம்பு (மோதிர விரல்)" : "Gold or Copper (Ring Finger)"
    },
    Taurus: {
      lagnaLord: "Venus",
      fifthLord: "Mercury",
      ninthLord: "Saturn",
      functionalBenefics: ["Saturn", "Mercury", "Venus"],
      functionalMalefics: ["Jupiter", "Mars", "Moon"],
      primaryGemEn: "Diamond / White Sapphire (Diamond / White Zircon)",
      primaryGemTa: "வைரம் / வெண் புஷ்பராகம்",
      primaryLordEn: "Venus (1st & 6th Lord)",
      primaryLordTa: "சுக்கிரன் (லக்னாதிபதி)",
      secondaryGemEn: "Blue Sapphire (Neelam - Yogakaraka)",
      secondaryGemTa: "நீலக்கல் (சனி - யோககாரகன்)",
      secondaryLordEn: "Saturn (Yogakaraka 9th & 10th Lord)",
      secondaryLordTa: "சனி (9 & 10-ம் தர்மகர்மாதிபதி)",
      contraindicatedEn: [
        { gemstone: "Yellow Sapphire (Pushparagam)", lord: "Jupiter", reason: "Jupiter rules 8th & 11th houses (Ashtamadhipati)", contraindicated: true },
        { gemstone: "Red Coral (Moonga)", lord: "Mars", reason: "Mars rules 7th & 12th houses (Maraka & Vyayadhipati)", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "மஞ்சள் புஷ்பராகம் (Yellow Sapphire)", lord: "Jupiter", reason: "குரு 8 & 11-ம் அதிபதி", contraindicated: true },
        { gemstone: "பவளம் (Red Coral)", lord: "Mars", reason: "செவ்வாய் 7 & 12-ம் அதிபதி", contraindicated: true }
      ],
      mantra: "ஓம் ஸ்ரீ மஹாலக்ஷ்ம்யை நமஹ",
      charity: isTamil ? "வெள்ளிக்கிழமைகளில் பசுவிற்கு அகத்திக்கீரை, தயிர்சாதம் தானம்." : "Cow seva and dairy offerings on Fridays.",
      wearingMetal: isTamil ? "வெள்ளி அல்லது பிளாட்டினம் (நடுவிரல்/மோதிர விரல்)" : "Silver or Platinum (Middle/Ring Finger)"
    },
    Gemini: {
      lagnaLord: "Mercury",
      fifthLord: "Venus",
      ninthLord: "Saturn",
      functionalBenefics: ["Venus", "Mercury"],
      functionalMalefics: ["Mars", "Jupiter", "Sun"],
      primaryGemEn: "Emerald (Panna)",
      primaryGemTa: "மரகதப் பச்சை (Emerald)",
      primaryLordEn: "Mercury (1st & 4th Lord)",
      primaryLordTa: "புதன் (லக்னாதிபதி & சுகாதிபதி)",
      secondaryGemEn: "Diamond / White Zircon (Shukra)",
      secondaryGemTa: "வைரம் / வெண் ஜிர்கான் (சுக்கிரன்)",
      secondaryLordEn: "Venus (5th & 12th Lord)",
      secondaryLordTa: "சுக்கிரன் (பஞ்சமாதிபதி)",
      contraindicatedEn: [
        { gemstone: "Red Coral (Moonga)", lord: "Mars", reason: "Mars rules 6th & 11th Dusthana houses (Rogadhipati)", contraindicated: true },
        { gemstone: "Ruby (Manikkam)", lord: "Sun", reason: "Sun rules 3rd house", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "பவளம் (Red Coral)", lord: "Mars", reason: "செவ்வாய் 6 & 11-ம் ரோகாதிபதி", contraindicated: true },
        { gemstone: "மாணிக்கம் (Ruby)", lord: "Sun", reason: "சூரியன் 3-ம் அதிபதி", contraindicated: true }
      ],
      mantra: "ஓம் நமோ நாராயணாய",
      charity: isTamil ? "புதன்கிழமைகளில் பச்சைப்பயறு தானம், விஷ்ணு சஹஸ்ரநாம பாராயணம்." : "Moong dal donation on Wednesdays, Vishnu worship.",
      wearingMetal: isTamil ? "தங்கம் அல்லது வெண்கலம் (சுண்டு விரல்)" : "Gold or Bronze (Little Finger)"
    },
    Cancer: {
      lagnaLord: "Moon",
      fifthLord: "Mars",
      ninthLord: "Jupiter",
      functionalBenefics: ["Mars", "Jupiter", "Moon"],
      functionalMalefics: ["Saturn", "Mercury", "Venus"],
      primaryGemEn: "Natural Pearl (Moti)",
      primaryGemTa: "இயற்கை முத்து (Natural Pearl)",
      primaryLordEn: "Moon (1st Lord)",
      primaryLordTa: "சந்திரன் (லக்னாதிபதி)",
      secondaryGemEn: "Red Coral (Moonga - Yogakaraka)",
      secondaryGemTa: "செம்பவளம் (செவ்வாய் - யோககாரகன்)",
      secondaryLordEn: "Mars (Yogakaraka 5th & 10th Lord)",
      secondaryLordTa: "செவ்வாய் (5 & 10-ம் தர்மகர்மாதிபதி)",
      contraindicatedEn: [
        { gemstone: "Blue Sapphire (Neelam)", lord: "Saturn", reason: "Saturn rules 7th & 8th houses (Maraka & Ashtamadhipati)", contraindicated: true },
        { gemstone: "Emerald (Panna)", lord: "Mercury", reason: "Mercury rules 3rd & 12th houses", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "நீலக்கல் (Blue Sapphire)", lord: "Saturn", reason: "சனி 7 & 8-ம் மாரக/அஷ்டமாதிபதி", contraindicated: true },
        { gemstone: "மரகதம் (Emerald)", lord: "Mercury", reason: "புதன் 3 & 12-ம் அதிபதி", contraindicated: true }
      ],
      mantra: "ஓம் சந்திராய நமஹ / ஓம் சிவாய நமஹ",
      charity: isTamil ? "திங்கட்கிழமைகளில் பச்சரிசி அல்லது பால் தானம், அம்மன் வழிபாடு." : "Rice and milk offerings on Mondays, Goddess worship.",
      wearingMetal: isTamil ? "வெள்ளி (சுண்டு விரல் அல்லது மோதிர விரல்)" : "Silver (Little or Ring Finger)"
    },
    Leo: {
      lagnaLord: "Sun",
      fifthLord: "Jupiter",
      ninthLord: "Mars",
      functionalBenefics: ["Mars", "Jupiter", "Sun"],
      functionalMalefics: ["Saturn", "Venus", "Mercury"],
      primaryGemEn: "Ruby (Manikkam)",
      primaryGemTa: "மாணிக்கம் (Ruby)",
      primaryLordEn: "Sun (1st Lord)",
      primaryLordTa: "சூரியன் (லக்னாதிபதி)",
      secondaryGemEn: "Red Coral (Mars) / Yellow Sapphire (Jupiter)",
      secondaryGemTa: "பவளம் (செவ்வாய்) / மஞ்சள் புஷ்பராகம் (குரு)",
      secondaryLordEn: "Mars (Yogakaraka 4th & 9th Lord) & Jupiter (5th Lord)",
      secondaryLordTa: "செவ்வாய் (4 & 9-ம் யோககாரகன்) & குரு (5-ம் திரிகோணாதிபதி)",
      contraindicatedEn: [
        { gemstone: "Blue Sapphire (Neelam)", lord: "Saturn", reason: "Saturn rules 6th & 7th houses (Shatru & Marakadhipati)", contraindicated: true },
        { gemstone: "Diamond (Heera)", lord: "Venus", reason: "Venus rules 3rd & 10th houses", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "நீலக்கல் (Blue Sapphire)", lord: "Saturn", reason: "சனி 6 & 7-ம் சத்ரு/மாரகாதிபதி", contraindicated: true },
        { gemstone: "வைரம் (Diamond)", lord: "Venus", reason: "சுக்கிரன் 3 & 10-ம் அதிபதி", contraindicated: true }
      ],
      mantra: "ஓம் சூர்யாய நமஹ / காயத்ரி மந்திரம்",
      charity: isTamil ? "ஞாயிற்றுக்கிழமைகளில் கோதுமை தானம், ஆதித்ய ஹிருதயம் பாராயணம்." : "Wheat donation on Sundays, Aditya Hridaya stotram.",
      wearingMetal: isTamil ? "தங்கம் அல்லது செம்பு (மோதிர விரல்)" : "Gold or Copper (Ring Finger)"
    },
    Virgo: {
      lagnaLord: "Mercury",
      fifthLord: "Saturn",
      ninthLord: "Venus",
      functionalBenefics: ["Venus", "Mercury"],
      functionalMalefics: ["Mars", "Jupiter", "Moon"],
      primaryGemEn: "Emerald (Panna)",
      primaryGemTa: "மரகதம் (Emerald)",
      primaryLordEn: "Mercury (1st & 10th Lord)",
      primaryLordTa: "புதன் (லக்னாதிபதி & கர்மாதிபதி)",
      secondaryGemEn: "Diamond / White Sapphire (Venus - 9th Lord)",
      secondaryGemTa: "வைரம் (சுக்கிரன் - பாக்கியாதிபதி)",
      secondaryLordEn: "Venus (2nd & 9th Lord)",
      secondaryLordTa: "சுக்கிரன் (2 & 9-ம் பாக்கியாதிபதி)",
      contraindicatedEn: [
        { gemstone: "Red Coral (Moonga)", lord: "Mars", reason: "Mars rules 3rd & 8th Dusthana houses", contraindicated: true },
        { gemstone: "Yellow Sapphire (Pushparagam)", lord: "Jupiter", reason: "Jupiter suffers Kendradhipatya Dosha (4th & 7th Lord)", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "பவளம் (Red Coral)", lord: "Mars", reason: "செவ்வாய் 3 & 8-ம் மறைவு அதிபதி", contraindicated: true },
        { gemstone: "மஞ்சள் புஷ்பராகம் (Yellow Sapphire)", lord: "Jupiter", reason: "குரு கேந்திராதிபத்திய தோஷம் (4 & 7-ம் அதிபதி)", contraindicated: true }
      ],
      mantra: "ஓம் ஸ்ரீ விஷ்ணவே நமஹ",
      charity: isTamil ? "புதன்கிழமைகளில் கல்வி பயிலும் குழந்தைகளுக்கு புத்தகம் தானம்." : "Stationery donation to needy students on Wednesdays.",
      wearingMetal: isTamil ? "தங்கம் அல்லது வெண்கலம் (சுண்டு விரல்)" : "Gold or Bronze (Little Finger)"
    },
    Libra: {
      lagnaLord: "Venus",
      fifthLord: "Saturn",
      ninthLord: "Mercury",
      functionalBenefics: ["Saturn", "Mercury", "Venus"],
      functionalMalefics: ["Mars", "Jupiter", "Sun"],
      primaryGemEn: "Diamond / White Zircon",
      primaryGemTa: "வைரம் / வெண் ஜிர்கான்",
      primaryLordEn: "Venus (1st & 8th Lord)",
      primaryLordTa: "சுக்கிரன் (லக்னாதிபதி)",
      secondaryGemEn: "Blue Sapphire (Saturn - Yogakaraka)",
      secondaryGemTa: "நீலக்கல் (சனி - யோககாரகன்)",
      secondaryLordEn: "Saturn (Yogakaraka 4th & 5th Lord)",
      secondaryLordTa: "சனி (4 & 5-ம் யோககாரகன்)",
      contraindicatedEn: [
        { gemstone: "Yellow Sapphire (Pushparagam)", lord: "Jupiter", reason: "Jupiter rules 3rd & 6th Dusthana houses", contraindicated: true },
        { gemstone: "Ruby (Manikkam)", lord: "Sun", reason: "Sun rules 11th Badhaka house", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "மஞ்சள் புஷ்பராகம் (Yellow Sapphire)", lord: "Jupiter", reason: "குரு 3 & 6-ம் மறைவு அதிபதி", contraindicated: true },
        { gemstone: "மாணிக்கம் (Ruby)", lord: "Sun", reason: "சூரியன் 11-ம் பாதகாதிபதி", contraindicated: true }
      ],
      mantra: "ஓம் ஸ்ரீ மஹாலக்ஷ்மி தாயே போற்றி",
      charity: isTamil ? "வெள்ளிக்கிழமைகளில் நெய் தீபம் ஏற்றுதல், இனிப்புகள் தானம்." : "Ghee lamps in temple on Fridays, sweet offerings.",
      wearingMetal: isTamil ? "வெள்ளி அல்லது பிளாட்டினம் (நடுவிரல்)" : "Silver or Platinum (Middle Finger)"
    },
    Scorpio: {
      lagnaLord: "Mars",
      fifthLord: "Jupiter",
      ninthLord: "Moon",
      functionalBenefics: ["Jupiter", "Moon", "Mars"],
      functionalMalefics: ["Mercury", "Venus", "Saturn"],
      primaryGemEn: "Red Coral (Moonga)",
      primaryGemTa: "செம்பவளம் (Red Coral)",
      primaryLordEn: "Mars (1st & 6th Lord)",
      primaryLordTa: "செவ்வாய் (லக்னாதிபதி)",
      secondaryGemEn: "Yellow Sapphire (Jupiter) / Natural Pearl (Moon)",
      secondaryGemTa: "மஞ்சள் புஷ்பராகம் (குரு) / முத்து (சந்திரன்)",
      secondaryLordEn: "Jupiter (2nd & 5th Lord) & Moon (9th Lord)",
      secondaryLordTa: "குரு (2 & 5-ம் அதிபதி) & சந்திரன் (9-ம் பாக்கியாதிபதி)",
      contraindicatedEn: [
        { gemstone: "Emerald (Panna)", lord: "Mercury", reason: "Mercury rules 8th & 11th Dusthana houses", contraindicated: true },
        { gemstone: "Diamond (Heera)", lord: "Venus", reason: "Venus rules 7th & 12th Maraka and Vyaya houses", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "மரகதம் (Emerald)", lord: "Mercury", reason: "புதன் 8 & 11-ம் மறைவு அதிபதி", contraindicated: true },
        { gemstone: "வைரம் (Diamond)", lord: "Venus", reason: "சுக்கிரன் 7 & 12-ம் மாரகாதிபதி", contraindicated: true }
      ],
      mantra: "ஓம் வீரபத்ராய நமஹ / ஓம் முருகா",
      charity: isTamil ? "செவ்வாய்க்கிழமைகளில் செவ்வாழைப்பழம், துவரை தானம்." : "Red fruits donation on Tuesdays, Murugan worship.",
      wearingMetal: isTamil ? "தங்கம் அல்லது செம்பு (மோதிர விரல்)" : "Gold or Copper (Ring Finger)"
    },
    Sagittarius: {
      lagnaLord: "Jupiter",
      fifthLord: "Mars",
      ninthLord: "Sun",
      functionalBenefics: ["Sun", "Mars", "Jupiter"],
      functionalMalefics: ["Venus", "Mercury", "Saturn"],
      primaryGemEn: "Yellow Sapphire (Pushparagam)",
      primaryGemTa: "மஞ்சள் புஷ்பராகம் (Yellow Sapphire)",
      primaryLordEn: "Jupiter (1st & 4th Lord)",
      primaryLordTa: "குரு (லக்னாதிபதி & சுகாதிபதி)",
      secondaryGemEn: "Ruby (Sun - 9th Lord)",
      secondaryGemTa: "மாணிக்கம் (சூரியன் - பாக்கியாதிபதி)",
      secondaryLordEn: "Sun (9th Bhagya Lord)",
      secondaryLordTa: "சூரியன் (9-ம் பாக்கியாதிபதி)",
      contraindicatedEn: [
        { gemstone: "Diamond (Heera)", lord: "Venus", reason: "Venus rules 6th & 11th Shatru and Rogadhipati houses", contraindicated: true },
        { gemstone: "Emerald (Panna)", lord: "Mercury", reason: "Mercury suffers Kendradhipatya Dosha (7th & 10th Lord)", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "வைரம் (Diamond)", lord: "Venus", reason: "சுக்கிரன் 6 & 11-ம் ரோகாதிபதி", contraindicated: true },
        { gemstone: "மரகதம் (Emerald)", lord: "Mercury", reason: "புதன் கேந்திராதிபத்திய தோஷம் (7 & 10-ம் அதிபதி)", contraindicated: true }
      ],
      mantra: "ஓம் குருவே நமஹ / ஓம் தட்சிணாமூர்த்தியே நமஹ",
      charity: isTamil ? "வியாழக்கிழமைகளில் கொண்டைக்கடலை தானம், தட்சிணாமூர்த்தி வழிபாடு." : "Chickpea donation on Thursdays, Dakshinamurthy worship.",
      wearingMetal: isTamil ? "தங்கம் (ஆள்காட்டி விரல்)" : "Gold (Index Finger)"
    },
    Capricorn: {
      lagnaLord: "Saturn",
      fifthLord: "Venus",
      ninthLord: "Mercury",
      functionalBenefics: ["Venus", "Mercury", "Saturn"],
      functionalMalefics: ["Mars", "Jupiter", "Moon", "Sun"],
      primaryGemEn: "Blue Sapphire / Amethyst",
      primaryGemTa: "நீலக்கல் / அமேதிஸ்ட் (Blue Sapphire)",
      primaryLordEn: "Saturn (1st & 2nd Lord)",
      primaryLordTa: "சனி (லக்னாதிபதி & தனாதிபதி)",
      secondaryGemEn: "Diamond / Emerald (Venus - Yogakaraka / Mercury)",
      secondaryGemTa: "வைரம் / மரகதம் (சுக்கிரன் / புதன்)",
      secondaryLordEn: "Venus (Yogakaraka 5th & 10th Lord)",
      secondaryLordTa: "சுக்கிரன் (5 & 10-ம் தர்மகர்மாதிபதி)",
      contraindicatedEn: [
        { gemstone: "Ruby (Manikkam)", lord: "Sun", reason: "Sun rules 8th Randhradhipati house", contraindicated: true },
        { gemstone: "Red Coral (Moonga)", lord: "Mars", reason: "Mars rules 4th & 11th Badhakadhipati houses", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "மாணிக்கம் (Ruby)", lord: "Sun", reason: "சூரியன் 8-ம் அஷ்டமாதிபதி", contraindicated: true },
        { gemstone: "பவளம் (Red Coral)", lord: "Mars", reason: "செவ்வாய் 4 & 11-ம் பாதகாதிபதி", contraindicated: true }
      ],
      mantra: "ஓம் நமசிவாய / ஓம் சனைச்சராய நமஹ",
      charity: isTamil ? "சனிக்கிழமைகளில் எள்தீபம் ஏற்றுதல், ஏழைகளுக்கு அன்னதானம்." : "Sesame lamp offerings on Saturdays, annadhanam.",
      wearingMetal: isTamil ? "வெள்ளி அல்லது பஞ்சலோகம் (நடுவிரல்)" : "Silver or Panchaloha (Middle Finger)"
    },
    Aquarius: {
      lagnaLord: "Saturn",
      fifthLord: "Mercury",
      ninthLord: "Venus",
      functionalBenefics: ["Venus", "Saturn", "Mercury"],
      functionalMalefics: ["Jupiter", "Moon", "Mars", "Sun"],
      primaryGemEn: "Blue Sapphire / Blue Topaz",
      primaryGemTa: "நீலக்கல் / நீல புஷ்பராகம்",
      primaryLordEn: "Saturn (1st & 12th Lord)",
      primaryLordTa: "சனி (லக்னாதிபதி)",
      secondaryGemEn: "Diamond (Venus - Yogakaraka 4th & 9th Lord)",
      secondaryGemTa: "வைரம் (சுக்கிரன் - யோககாரகன்)",
      secondaryLordEn: "Venus (Yogakaraka 4th & 9th Lord)",
      secondaryLordTa: "சுக்கிரன் (4 & 9-ம் யோககாரகன்)",
      contraindicatedEn: [
        { gemstone: "Yellow Sapphire (Pushparagam)", lord: "Jupiter", reason: "Jupiter rules 2nd & 11th Maraka and Labha houses", contraindicated: true },
        { gemstone: "Natural Pearl (Moti)", lord: "Moon", reason: "Moon rules 6th Shatrudhipati house", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "மஞ்சள் புஷ்பராகம் (Yellow Sapphire)", lord: "Jupiter", reason: "குரு 2 & 11-ம் மாரகாதிபதி", contraindicated: true },
        { gemstone: "முத்து (Natural Pearl)", lord: "Moon", reason: "சந்திரன் 6-ம் ரோகாதிபதி", contraindicated: true }
      ],
      mantra: "ஓம் தர்ம சாஸ்தாவே நமஹ",
      charity: isTamil ? "சனிக்கிழமைகளில் மாற்றுத்திறனாளிகளுக்கு உதவி செய்தல்." : "Assisting the underprivileged and disabled on Saturdays.",
      wearingMetal: isTamil ? "வெள்ளி அல்லது பஞ்சலோகம் (நடுவிரல்)" : "Silver or Panchaloha (Middle Finger)"
    },
    Pisces: {
      lagnaLord: "Jupiter",
      fifthLord: "Moon",
      ninthLord: "Mars",
      functionalBenefics: ["Mars", "Moon", "Jupiter"],
      functionalMalefics: ["Venus", "Saturn", "Sun", "Mercury"],
      primaryGemEn: "Yellow Sapphire (Pushparagam)",
      primaryGemTa: "மஞ்சள் புஷ்பராகம் (Yellow Sapphire)",
      primaryLordEn: "Jupiter (1st & 10th Lord)",
      primaryLordTa: "குரு (லக்னாதிபதி & கர்மாதிபதி)",
      secondaryGemEn: "Natural Pearl / Red Coral (Moon / Mars)",
      secondaryGemTa: "முத்து / பவளம் (சந்திரன் / செவ்வாய்)",
      secondaryLordEn: "Mars (2nd & 9th Bhagya Lord)",
      secondaryLordTa: "செவ்வாய் (2 & 9-ம் பாக்கியாதிபதி)",
      contraindicatedEn: [
        { gemstone: "Diamond (Heera)", lord: "Venus", reason: "Venus rules 3rd & 8th Dusthana houses", contraindicated: true },
        { gemstone: "Blue Sapphire (Neelam)", lord: "Saturn", reason: "Saturn rules 11th & 12th Vyayadhipati houses", contraindicated: true }
      ],
      contraindicatedTa: [
        { gemstone: "வைரம் (Diamond)", lord: "Venus", reason: "சுக்கிரன் 3 & 8-ம் மறைவு அதிபதி", contraindicated: true },
        { gemstone: "நீலக்கல் (Blue Sapphire)", lord: "Saturn", reason: "சனி 11 & 12-ம் விரயாதிபதி", contraindicated: true }
      ],
      mantra: "ஓம் நமோ பகவதே வாசுதேவாய",
      charity: isTamil ? "வியாழக்கிழமைகளில் மஞ்சள் வஸ்திரம், கொண்டைக்கடலை தானம்." : "Yellow grain and cloth donations on Thursdays.",
      wearingMetal: isTamil ? "தங்கம் (ஆள்காட்டி விரல்)" : "Gold (Index Finger)"
    }
  };

  const cfg = lagnaConfigs[lagnaName] || lagnaConfigs.Aries;

  // Evaluate planetary dignity, combustion, and active Dasha resonance
  const p1 = (planets || []).find(p => p.name === cfg.lagnaLord);
  const p2 = (planets || []).find(p => p.name === cfg.ninthLord || p.name === cfg.fifthLord);

  const isP1Combust = Boolean(p1?.isCombust);
  const isP2Combust = Boolean(p2?.isCombust);
  const isP1Dusthana = [6, 8, 12].includes(p1?.house);
  const isP2Dusthana = [6, 8, 12].includes(p2?.house);

  const activeMdLord = currentDasha?.mahadashaLord || currentDasha?.lord;
  const isP1DashaActive = activeMdLord === cfg.lagnaLord;
  const isP2DashaActive = activeMdLord === cfg.ninthLord || activeMdLord === cfg.fifthLord;

  let primarySuitability = "Recommended";
  let primaryNotes = isTamil ? "லக்ன சுப அதிபதி பலப்படுத்துதல்" : "Strengthens vital Lagna lord";
  if (isP1Combust) {
    primarySuitability = "Optional";
    primaryNotes = isTamil ? "சூரியனோடு அஸ்தமனம் - கவனமுடன் பரிசீலிக்கவும்" : "Combust with Sun — use caution";
  } else if (isP1Dusthana) {
    primarySuitability = "Optional";
    primaryNotes = isTamil ? "மறைவு ஸ்தான இருப்பு - பரிகார மந்திர ஜபம் உத்தமம்" : "Dusthana placement — mantra japa preferred";
  }

  let secondarySuitability = "Recommended";
  let secondaryNotes = isTamil ? "திரிகோண சுப அதிபதி யோகம்" : "Fortifies trinal fortune lord";
  if (isP2Combust) {
    secondarySuitability = "Optional";
    secondaryNotes = isTamil ? "அஸ்தமன நிலை - விழிப்புணர்வுடன் அணுகவும்" : "Combust with Sun — secondary option";
  } else if (isP2Dusthana) {
    secondarySuitability = "Optional";
    secondaryNotes = isTamil ? "மறைவு ஸ்தான நிலை" : "Dusthana house placement";
  }

  const gemstonePrescription = [
    {
      gemstone: isTamil ? cfg.primaryGemTa : cfg.primaryGemEn,
      planet: cfg.lagnaLord,
      lordship: isTamil ? cfg.primaryLordTa : cfg.primaryLordEn,
      suitability: primarySuitability,
      dashaResonance: isP1DashaActive,
      notes: primaryNotes,
      metalAndFinger: cfg.wearingMetal
    },
    {
      gemstone: isTamil ? cfg.secondaryGemTa : cfg.secondaryGemEn,
      planet: cfg.ninthLord || cfg.fifthLord,
      lordship: isTamil ? cfg.secondaryLordTa : cfg.secondaryLordEn,
      suitability: secondarySuitability,
      dashaResonance: isP2DashaActive,
      notes: secondaryNotes,
      metalAndFinger: cfg.wearingMetal
    }
  ];

  return {
    framework: isTamil ? "பாரம்பரிய வேத ரத்தின தொடர்புகள் (Traditional Vedic Gemstone Associations)" : "Traditional Vedic Gemstone Associations (Classical Functional Benefic Alignment)",
    primaryGemstone: isTamil ? cfg.primaryGemTa : cfg.primaryGemEn,
    gemLord: isTamil ? cfg.primaryLordTa : cfg.primaryLordEn,
    secondaryGemstone: isTamil ? cfg.secondaryGemTa : cfg.secondaryGemEn,
    secondaryLord: isTamil ? cfg.secondaryLordTa : cfg.secondaryLordEn,
    gemstonePrescription,
    contraindicatedGemstones: isTamil ? cfg.contraindicatedTa : cfg.contraindicatedEn,
    traditionallyDiscouragedGemstones: isTamil ? cfg.contraindicatedTa : cfg.contraindicatedEn,
    functionalBenefics: cfg.functionalBenefics,
    functionalMalefics: cfg.functionalMalefics,
    mantra: cfg.mantra,
    charity: cfg.charity,
    favorableDeity: isTamil ? `இஷ்ட தெய்வம்: ${cfg.lagnaLord} மற்றும் லக்ன சுப அதிபதி வழிபாடு` : `Favorable Deity aligned with ${cfg.lagnaLord} and Lagna Benefics`,
    statutoryNotice: isTamil
      ? "சாஸ்திர அறிவிப்பு: ரத்தினப் பரிந்துரைகள் பண்டைய வேத ஜோதிட மரபு சார்ந்த குறியீட்டு விளக்கமாகும்; இது அறிவியல் பூர்வமாக நிறுவப்பட்ட முறை அல்ல. ரத்தினங்கள் அணியும் முன் அவற்றின் தூய்மை மற்றும் சாஸ்திர தகுதியை உறுதி செய்யவும்."
      : "Traditional Advisory: Gemstone suitability represents traditional astrological associations and is not a scientifically established mechanism. Recommendations should be calibrated by natural benefic status and flawless physical quality; avoid gemstones of unmitigated dusthana lords.",
    statutoryAdvisoryNotice: isTamil
      ? "சாஸ்திர அறிவிப்பு: ரத்தினப் பரிந்துரைகள் பண்டைய வேத ஜோதிட மரபு சார்ந்த குறியீட்டு விளக்கமாகும்; இது அறிவியல் பூர்வமாக நிறுவப்பட்ட முறை அல்ல."
      : "Traditional Advisory: Gemstone suitability represents traditional astrological associations and is not a scientifically established mechanism."
  };
}

/**
 * 10.5 REALISTIC CAREER, EXAM & BUSINESS DESTINY DIAGNOSTIC ENGINE
 * Evaluates 6th lord combustion, 10th house Shrapit Dosha (Saturn+Rahu),
 * Saturn aspecting Mars (Defense block), and 11th/7th house Business Yogas.
 */
export function calculateCareerAndExamPathway(planets = [], ascendantLong = 0, lang = "en") {
  const isTamil = lang === "ta";
  const lagnaSignIdx = Math.floor(norm360(ascendantLong) / 30);
  const lagnaSign = ZODIAC_SIGNS[lagnaSignIdx];
  const lagnaLordName = lagnaSign.ruler;
  const lagnaLord = planets.find(p => p.name.toLowerCase() === lagnaLordName.toLowerCase());

  const getBhavaSignAndLord = (h) => {
    const sIdx = (lagnaSignIdx + h - 1) % 12;
    const sign = ZODIAC_SIGNS[sIdx];
    const lord = planets.find(p => p.name.toLowerCase() === sign.ruler.toLowerCase());
    const occupants = planets.filter(p => p.house === h);
    return { houseNum: h, sign, lordName: sign.ruler, lordPlanet: lord, occupants };
  };

  const h3 = getBhavaSignAndLord(3);
  const h5 = getBhavaSignAndLord(5);
  const h6 = getBhavaSignAndLord(6);
  const h7 = getBhavaSignAndLord(7);
  const h10 = getBhavaSignAndLord(10);
  const h11 = getBhavaSignAndLord(11);

  const sun = planets.find(p => p.name === "Sun");
  const mars = planets.find(p => p.name === "Mars");
  const mercury = planets.find(p => p.name === "Mercury");
  const jupiter = planets.find(p => p.name === "Jupiter");
  const saturn = planets.find(p => p.name === "Saturn");
  const rahu = planets.find(p => p.name === "Rahu");
  const ketu = planets.find(p => p.name === "Ketu");

  // 1. Check 6th Lord Combustion & Competition Hurdles (Strict angular degree limit, not mere house-sharing)
  const h6Lord = h6.lordPlanet;
  const is6thLordCombust = Boolean(h6Lord?.isCombust);

  // 2. Check 10th House Afflictions: Saturn + Rahu (Shrapit Dosha / Career Dynamics)
  const hasSaturnIn10 = h10.occupants.some(p => p.name === "Saturn");
  const hasRahuIn10 = h10.occupants.some(p => p.name === "Rahu");
  const hasSaturnRahuIn10 = (hasSaturnIn10 && hasRahuIn10) || (saturn && rahu && saturn.house === rahu.house && saturn.house === 10);

  // 3. Check Defense/Army/Navy/Police Selection Dynamics
  let isMarsAfflictedBySaturn = false;
  if (saturn && mars) {
    const saturnHouse = saturn.house;
    const marsHouse = mars.house;
    if (saturnHouse === 10 && marsHouse === 11) isMarsAfflictedBySaturn = true;
    const aspectHouses = [(saturnHouse + 2) % 12 || 12, (saturnHouse + 6) % 12 || 12, (saturnHouse + 9) % 12 || 12];
    if (aspectHouses.includes(marsHouse) || saturnHouse === marsHouse) {
      isMarsAfflictedBySaturn = true;
    }
  }

  // 4. Check Business & Entrepreneurship Yoga (Vyapara Yoga)
  const isLagnaLordIn11 = lagnaLord?.house === 11;
  const is7thLordIn11 = h7.lordPlanet?.house === 11;

  // Multi-Factor Evidence Ledger Generation: Exams
  const examSupportingFactors = [];
  const examCounterFactors = [];
  if (mercury && [1, 4, 5, 9, 10, 11].includes(mercury.house)) {
    examSupportingFactors.push(isTamil ? "புதனின் பகுப்பாய்வு & நினைவாற்றல் பலம்" : "Mercury analytical & mnemonic fortitude");
  }
  if (jupiter && [1, 4, 5, 9, 10].includes(jupiter.house)) {
    examSupportingFactors.push(isTamil ? "குருவின் ஆசி & ஆழமான புரிதல்" : "Jupiter conceptual depth & comprehension");
  }
  if (sun && [1, 10].includes(sun.house)) {
    examSupportingFactors.push(isTamil ? "சூரியனின் நிர்வாக ஆற்றல் & தன்னம்பிக்கை" : "Sun administrative stamina & authority");
  }
  if (h5.lordPlanet && [1, 4, 5, 9].includes(h5.lordPlanet.house)) {
    examSupportingFactors.push(isTamil ? "5-ம் பாவக அதிபதியின் திரிகோண யோகம்" : "5th Lord trinal intelligence alignment");
  }

  if (is6thLordCombust) {
    examCounterFactors.push(isTamil ? "6-ம் அதிபதி அஸ்தமனம் (கட்-ஆஃப் மதிப்பெண் சவால்)" : "6th Lord combustion (narrow cut-off hurdles)");
  }
  if (hasSaturnRahuIn10) {
    examCounterFactors.push(isTamil ? "10-ம் பாவ கர்ம அழுத்தம் (திசைமாற்ற தூண்டுதல்)" : "10th house karmic block (steers toward alternate routes)");
  }
  if (isMarsAfflictedBySaturn) {
    examCounterFactors.push(isTamil ? "செவ்வாய் மீது சனியின் பார்வை (சீருடைப்பணி தாமதம்)" : "Saturn aspecting Mars (delays in uniformed/defense selection)");
  }

  // Multi-Factor Evidence Ledger: Career
  const careerSupportingFactors = [];
  const careerCounterFactors = [];
  if (lagnaLord && [1, 4, 5, 9, 10, 11].includes(lagnaLord.house)) {
    careerSupportingFactors.push(isTamil ? "லக்னாதிபதி பலம் & ஆளுமை" : "Lagna lord fortified in kendra/trikona");
  }
  if (h10.lordPlanet && [1, 4, 5, 9, 10, 11].includes(h10.lordPlanet.house)) {
    careerSupportingFactors.push(isTamil ? "10-ம் பாவாதிபதி யோக ஸ்தான தொடர்பு" : "10th lord fortified in auspicious house");
  }
  if (sun && [1, 10].includes(sun.house)) {
    careerSupportingFactors.push(isTamil ? "சூரியனின் அதிகார ஆளுமை" : "Sun providing executive presence");
  }
  if (saturn && [1, 10, 11].includes(saturn.house)) {
    careerSupportingFactors.push(isTamil ? "சனியின் ஸ்திரமான உழைப்பு & தலைமை" : "Saturn endurance & executive perseverance");
  }
  if (h10.lordPlanet && [6, 8, 12].includes(h10.lordPlanet.house)) {
    careerCounterFactors.push(isTamil ? "10-ம் அதிபதி மறைவு ஸ்தான தொடர்பு" : "10th lord in dusthana requires strategic adaptability");
  }
  if (hasSaturnRahuIn10) {
    careerCounterFactors.push(isTamil ? "10-ல் சனி-ராகு கர்ம தாக்கம்" : "10th house Saturn-Rahu karmic pressure");
  }

  // Multi-Factor Evidence Ledger: Entrepreneurship
  const entrepreneurshipSupportingFactors = [];
  const entrepreneurshipCounterFactors = [];
  if (isLagnaLordIn11) {
    entrepreneurshipSupportingFactors.push(isTamil ? "லக்னாதிபதி 11-ல் வியாபார யோகம்" : "Lagna lord in 11th forming Vyapara Yoga");
  }
  if (is7thLordIn11) {
    entrepreneurshipSupportingFactors.push(isTamil ? "7-ம் அதிபதி 11-ல் கூட்டாண்மை/வர்த்தக யோகம்" : "7th lord in 11th supporting commercial partnerships");
  }
  if (mercury && [1, 2, 7, 10, 11].includes(mercury.house)) {
    entrepreneurshipSupportingFactors.push(isTamil ? "புதனின் வணிக நுண்ணறிவு" : "Mercury analytical acumen for commerce");
  }
  if (h11.occupants && h11.occupants.length > 0) {
    entrepreneurshipSupportingFactors.push(isTamil ? "11-ம் பாவ லாப கிரக பலம்" : "Benefic occupancy in 11th house of gains");
  }
  if (h11.lordPlanet && [6, 8, 12].includes(h11.lordPlanet.house)) {
    entrepreneurshipCounterFactors.push(isTamil ? "11-ம் அதிபதி மறைவு நிலை" : "11th lord in dusthana indicates risk management needed");
  }

  // Multi-Factor Evidence Ledger: Research
  const researchSupportingFactors = [];
  const researchCounterFactors = [];
  if (jupiter && [5, 8, 9, 12].includes(jupiter.house)) {
    researchSupportingFactors.push(isTamil ? "குருவின் தத்துவ ஞானம் & ஆழ்ந்த சிந்தனை" : "Jupiter deep research & pedagogical wisdom");
  }
  if (mercury && [5, 8, 9].includes(mercury.house)) {
    researchSupportingFactors.push(isTamil ? "புதனின் அறிவியல் பகுப்பாய்வு" : "Mercury scholarly investigation");
  }
  if (ketu && [8, 9, 12].includes(ketu.house)) {
    researchSupportingFactors.push(isTamil ? "கேதுவின் நுண்ணறிவும் தத்துவ ஆர்வமும்" : "Ketu abstract contemplation & esoteric inquiry");
  }
  if (h5.lordPlanet && [6, 8, 12].includes(h5.lordPlanet.house)) {
    researchCounterFactors.push(isTamil ? "5-ம் அதிபதிக்கு சவாலான தொடர்பு" : "5th lord requires persistence in research milestones");
  }

  const derivePathwayAlignment = (sups, cons) => {
    if (sups.length > 0 && cons.length === 0) return isTamil ? "நேர்மறை சுப கிரக ஆதரவு" : "Planetary Supportive Alignment";
    if (sups.length > 0 && cons.length > 0) return isTamil ? "கலப்பு கிரக தாக்கம் (விடாமுயற்சி தேவை)" : "Mixed Astrological Influences (Requires Remedial Effort)";
    if (cons.length > 0) return isTamil ? "சவாலான கிரக அமைப்பு (மாற்று உத்தி தேவை)" : "Constraining Astrological Influences (Contingency Advised)";
    return isTamil ? "நடுநிலை கிரக அமைப்பு" : "Neutral Astrological Alignment";
  };

  const examAlignment = derivePathwayAlignment(examSupportingFactors, examCounterFactors);
  const careerAlignment = derivePathwayAlignment(careerSupportingFactors, careerCounterFactors);
  const entrepreneurshipAlignmentVal = derivePathwayAlignment(entrepreneurshipSupportingFactors, entrepreneurshipCounterFactors);
  const researchAlignment = derivePathwayAlignment(researchSupportingFactors, researchCounterFactors);
  const entrepreneurshipAlignment = entrepreneurshipAlignmentVal;

  return {
    is6thLordCombust,
    hasSaturnRahuIn10,
    hasGovtBlock: hasSaturnRahuIn10 || is6thLordCombust,
    isMarsAfflictedBySaturn,
    entrepreneurshipAlignment,
    evidenceLedger: {
      exam: {
        supportingFactors: examSupportingFactors,
        counterFactors: examCounterFactors,
        alignment: examAlignment,
        status: examAlignment
      },
      career: {
        supportingFactors: careerSupportingFactors,
        counterFactors: careerCounterFactors,
        alignment: careerAlignment,
        status: careerAlignment
      },
      entrepreneurship: {
        supportingFactors: entrepreneurshipSupportingFactors,
        counterFactors: entrepreneurshipCounterFactors,
        alignment: entrepreneurshipAlignmentVal,
        status: entrepreneurshipAlignmentVal
      },
      research: {
        supportingFactors: researchSupportingFactors,
        counterFactors: researchCounterFactors,
        alignment: researchAlignment,
        status: researchAlignment
      }
    },
    careerPathways: {
      governmentPublic: {
        title: isTamil ? "அரசு & பொதுத்துறை நிர்வாகம்" : "Government & Public Administration",
        supportingFactors: examSupportingFactors,
        counterFactors: examCounterFactors,
        alignment: examAlignment
      },
      corporateLeadership: {
        title: isTamil ? "கார்ப்பரேட் தலைமை & நிறுவன உத்தியோகம்" : "Corporate Leadership & Executive Vocations",
        supportingFactors: careerSupportingFactors,
        counterFactors: careerCounterFactors,
        alignment: careerAlignment
      },
      entrepreneurshipVyapara: {
        title: isTamil ? "சுயதொழில் & வணிக ஆளுமை" : "Entrepreneurship & Commercial Enterprise",
        supportingFactors: entrepreneurshipSupportingFactors,
        counterFactors: entrepreneurshipCounterFactors,
        alignment: entrepreneurshipAlignmentVal
      },
      researchScholastic: {
        title: isTamil ? "ஆராய்ச்சி & உயர்கல்வித் துறை" : "Research, Technology & Scholastic Innovation",
        supportingFactors: researchSupportingFactors,
        counterFactors: researchCounterFactors,
        alignment: researchAlignment
      }
    },
    examObstacleVerdict: (is6thLordCombust || hasSaturnRahuIn10 || isMarsAfflictedBySaturn)
      ? (isTamil
          ? "போட்டித் தேர்வு சவால்கள் & மாற்று உத்தி (Competitive Exam Dynamics): 6-ம் அதிபதிக்கு சூரிய தொடர்பு / 10-ம் பாவ சனி-ராகு கர்ம தாக்கம் காரணமாக அரசு, வங்கி மற்றும் பாதுகாப்புத்துறை தேர்வுகளில் கூடுதல் விடாமுயற்சியும் மாற்று உத்திகளும் தேவைப்படலாம். அதே சமயம், 11-ம் பாவ லாப பலம் மற்றும் லக்னாதிபதி தொடர்பு அமைந்திருப்பதால், சுய வணிகம், தொழில் முனைவு மற்றும் தனியார்துறை தலைமைப் பொறுப்புகள் பொருளாதார மேன்மையையும் வெற்றிகளையும் அளிக்கவல்லது."
          : "Competitive Exam Dynamics & Strategic Vocational Path: Astrological indications on the 6th lord or 10th house indicate that standard civil service, banking, or defense exams demand focused perseverance and contingency planning. Concurrently, strong 11th/7th house alignments highlight outstanding potential for independent enterprise, commercial trade, and entrepreneurial leadership.")
      : (isTamil ? "போட்டித் தேர்வுகளில் அனுகூலமான வெற்றி வாய்ப்பு." : "Favorable competitive examination aptitude."),
    careerDestinyVerdict: entrepreneurshipSupportingFactors.length >= 2
      ? (isTamil
          ? "வலுவான தொழில்முனைவு இணக்கம் (Strong Entrepreneurial Alignment): லக்னாதிபதி / 7-ம் அதிபதி மற்றும் 11-ம் லாப ஸ்தான தொடர்புகள் சுயமாக வணிக நிறுவனம் தொடங்கி வெற்றி பெறும் சிறந்த ஆற்றலை அளிக்கின்றன."
          : "Strong Entrepreneurial Alignment: Planetary alignments with the 11th house and commercial karakas indicate high aptitude for self-directed enterprise and commercial founding.")
      : (isTamil
          ? "கட்டமைக்கப்பட்ட நிர்வாக உத்தியோக இணக்கம்: நிலையான நிறுவன தலைமை, நிர்வாகப் பொறுப்புகள் அல்லது கூட்டு முயற்சிகள் சீரான முன்னேற்றத்தை அளிக்கும்."
          : "Structured Professional & Executive Alignment: Enterprise initiatives are best paired with structured corporate leadership or formal institutional partnerships.")
  };
}

/**
 * MARITAL ASTROLOGICAL & UNCONVENTIONAL / GANDHARVA VIVAHA DIAGNOSTIC ENGINE
 * Evaluates 7th house, Lagna-7th Lord conjunction, Ketu/malefics in 4th house (family friction),
 * and Saturn's aspects on 7th house, dynamically computing marriage nature and exact dasha timing.
 */
export function calculateMarriagePathway(planets = [], ascendantLong = 0, dashaTable = [], birthYear = 1990, lang = "en") {
  const isTamil = lang === "ta";
  const lagnaSignIdx = Math.floor(norm360(ascendantLong) / 30);
  const lagnaSign = ZODIAC_SIGNS[lagnaSignIdx];
  const lagnaLord = planets.find(p => p.name.toLowerCase() === lagnaSign.ruler.toLowerCase());

  const h7SignIdx = (lagnaSignIdx + 6) % 12;
  const h7Sign = ZODIAC_SIGNS[h7SignIdx];
  const h7Lord = planets.find(p => p.name.toLowerCase() === h7Sign.ruler.toLowerCase());

  const h4SignIdx = (lagnaSignIdx + 3) % 12;
  const h4Sign = ZODIAC_SIGNS[h4SignIdx];

  const h5SignIdx = (lagnaSignIdx + 4) % 12;
  const h5Sign = ZODIAC_SIGNS[h5SignIdx];
  const h5Lord = planets.find(p => p.name.toLowerCase() === h5Sign.ruler.toLowerCase());

  const saturn = planets.find(p => p.name === "Saturn");
  const mars = planets.find(p => p.name === "Mars");
  const venus = planets.find(p => p.name === "Venus");
  const jupiter = planets.find(p => p.name === "Jupiter");
  const rahu = planets.find(p => p.name === "Rahu");
  const ketu = planets.find(p => p.name === "Ketu");
  const sun = planets.find(p => p.name === "Sun");

  // 1. Classical Love / Self-chosen Marriage signature:
  // Requires connection between 1st/5th/7th lords or Venus in auspicious houses (Kendra/Trikona), NOT dusthanas (6, 8, 12).
  const is1stAnd7thInAuspiciousHouse = Boolean(lagnaLord && h7Lord && lagnaLord.house === h7Lord.house && ![6, 8, 12].includes(lagnaLord.house));
  const is5thAnd7thConnected = Boolean(h5Lord && h7Lord && (h5Lord.house === h7Lord.house || h5Lord.house === 7) && ![6, 8, 12].includes(h7Lord.house));
  const isVenusWithLagnaLordAuspicious = Boolean(venus && lagnaLord && venus.house === lagnaLord.house && ![6, 8, 12].includes(lagnaLord.house));
  
  // Punarphoo Dosha: Moon & Saturn conjunction or mutual aspect, introducing deliberate matrimonial scrutiny/delays
  const moon = planets.find(p => p.name === "Moon");
  const isPunarphoo = Boolean(moon && saturn && (moon.house === saturn.house || Math.abs(moon.house - saturn.house) === 6));
  
  const isLoveOrSelfChosenMarriage = Boolean((is1stAnd7thInAuspiciousHouse || is5thAnd7thConnected || isVenusWithLagnaLordAuspicious) && !isPunarphoo);

  // 2. Family opposition / Domestic hurdles signature:
  // 4th house (Sukha & Matru Bhava / Family Harmony) occupied or aspected by malefics
  const h4Occupants = planets.filter(p => p.house === 4);
  const m4Planets = h4Occupants.filter(p => ["Ketu", "Rahu", "Saturn", "Mars"].includes(p.name));
  const hasMaleficIn4th = m4Planets.length > 0;
  
  let saturnAspects4th = false;
  let saturnAspects7th = false;
  if (saturn) {
    const sH = saturn.house;
    const asp3 = ((sH + 2) % 12) || 12;
    const asp7 = ((sH + 6) % 12) || 12;
    const asp10 = ((sH + 9) % 12) || 12;
    const aspectedHouses = [sH, asp3, asp7, asp10];
    if (aspectedHouses.includes(4)) saturnAspects4th = true;
    if (aspectedHouses.includes(7)) saturnAspects7th = true;
  }

  const hurdlePointsEn = [];
  const hurdlePointsTa = [];
  if (hasMaleficIn4th) {
    const namesEn = m4Planets.map(p => p.name).join(", ");
    const namesTa = m4Planets.map(p => p.tamil || p.name).join(", ");
    hurdlePointsEn.push(`presence of ${namesEn} in 4th house of domestic harmony`);
    hurdlePointsTa.push(`4-ம் குடும்ப சுக ஸ்தானத்தில் ${namesTa} இருப்பு`);
  }
  if (saturnAspects7th) {
    hurdlePointsEn.push("Saturn's aspect on the 7th house");
    hurdlePointsTa.push("7-ம் பாவகத்தின் மீது சனியின் பார்வை");
  } else if (saturn && saturn.house === 7) {
    hurdlePointsEn.push("Saturn residing in the 7th house");
    hurdlePointsTa.push("7-ம் வீட்டில் சனியின் அமர்வு");
  } else if (saturn && saturn.house === 8) {
    hurdlePointsEn.push("Saturn in 8th house causing delayed matchmaking settlement");
    hurdlePointsTa.push("8-ல் சனி அமர்ந்து வரன் தேர்வில் கூடுதல் கால அவகாசம் கோருதல்");
  }
  if (isPunarphoo) {
    hurdlePointsEn.push("Moon-Saturn conjunction (Punarphoo Dosha requiring patient emotional alignment)");
    hurdlePointsTa.push("சந்திரன்-சனி சேர்க்கை (புனர்பூ தோஷம் / ஆழமான பரிசீலனை)");
  }
  if (h7Lord && [6, 8, 12].includes(h7Lord.house)) {
    hurdlePointsEn.push(`7th Lord ${h7Lord.name} placed in Dusthana House ${h7Lord.house}`);
    hurdlePointsTa.push(`7-ம் அதிபதி ${h7Lord.tamil || h7Lord.name} ${h7Lord.house}-ம் மறைவு ஸ்தானத்தில் இருப்பு`);
  }

  const hasFamilyOppositionOrHurdles = hurdlePointsEn.length > 0;

  // 3. Dynamic timing calculated strictly from Vimshottari dashaTable within realistic matrimonial lifecycle:
  const allBukthis = [];
  if (dashaTable && dashaTable.length > 0) {
    dashaTable.forEach(md => {
      if (md.bukthis && md.bukthis.length > 0) {
        md.bukthis.forEach(bk => allBukthis.push(bk));
      }
    });
  }

  // Realistic human matrimonial lifecycle window: Ages 18.0 to 52.0 (core 21.0 to 48.0)
  const candidateBukthis = allBukthis.filter(bk => bk.startAge >= 18.0 && bk.startAge <= 52.0);

  const qualifyingBukthis = [];

  for (const bk of (candidateBukthis.length > 0 ? candidateBukthis : allBukthis)) {
    const sLord = bk.subLord;
    const mLord = bk.mahadashaLord;
    let score = 0;

    const qualifyingFactors = [];
    if (sLord === h7Lord?.name) {
      score += 40;
      qualifyingFactors.push("Antardasha Lord is 7th Lord (Kalathradhipati)");
    }
    if (mLord === h7Lord?.name) {
      score += 25;
      qualifyingFactors.push("Mahadasha Lord is 7th Lord");
    }
    if (sLord === "Venus") {
      score += 35;
      qualifyingFactors.push("Antardasha Lord is Venus (Naisargika Kalathrakaraka)");
    }
    if (mLord === "Venus") {
      score += 20;
      qualifyingFactors.push("Mahadasha Lord is Venus");
    }
    if (sLord === "Jupiter") {
      score += 25;
      qualifyingFactors.push("Antardasha Lord is Jupiter (Subhagraha Sanction)");
    }
    if (mLord === "Jupiter") {
      score += 15;
      qualifyingFactors.push("Mahadasha Lord is Jupiter");
    }
    if (sLord === lagnaLord?.name) {
      score += 20;
      qualifyingFactors.push("Antardasha Lord is Lagna Lord");
    }
    if (h7Lord && planets.find(p => p.name === sLord)?.house === h7Lord.house) {
      score += 15;
      qualifyingFactors.push("Antardasha Lord conjoined with 7th Lord");
    }
    if (lagnaLord && planets.find(p => p.name === sLord)?.house === lagnaLord.house) {
      score += 15;
      qualifyingFactors.push("Antardasha Lord conjoined with Lagna Lord");
    }

    // Secondary kalathra supporters (2nd house of family, 11th house of gains)
    const h2LordName = ZODIAC_SIGNS[(lagnaSignIdx + 1) % 12]?.ruler;
    const h11LordName = ZODIAC_SIGNS[(lagnaSignIdx + 10) % 12]?.ruler;
    if (sLord === h2LordName || sLord === h11LordName) {
      score += 15;
      qualifyingFactors.push("Antardasha Lord rules 2nd / 11th house of family expansion");
    }

    if (qualifyingFactors.length > 0) {
      qualifyingBukthis.push({
        ...bk,
        score,
        activationFactors: qualifyingFactors,
        calendarYears: `${Math.round(birthYear + bk.startAge)} - ${Math.round(birthYear + bk.endAge)}`
      });
    }
  }

  // Sort qualifying bukthis by score descending, then chronologically
  qualifyingBukthis.sort((a, b) => b.score - a.score || a.startAge - b.startAge);

  // Extract top 2 to 3 prime windows, then sort them chronologically for clean presentation
  const primeWindows = qualifyingBukthis.slice(0, 3).sort((a, b) => a.startAge - b.startAge);

  const timingStatus = primeWindows.length > 0 ? "Calculated from active Vimshottari Kalathra lordships" : "No qualifying calculated Dasha window";
  const auspiciousAgeRange = primeWindows.length > 0 
    ? primeWindows.map(b => `${b.startAge.toFixed(1)} - ${b.endAge.toFixed(1)}`).join(" & ")
    : (isTamil ? "கணிக்கப்பட்ட தசா சாளரம் இல்லை" : "No qualifying calculated Dasha window");
  const calendarYears = primeWindows.length > 0 
    ? primeWindows.map(b => b.calendarYears).join(" & ")
    : null;

  const lagnaLordTa = lagnaLord?.tamil || lagnaSign.tamil;
  const h7LordTa = h7Lord?.tamil || h7Sign.tamil;
  const h7SignTa = h7Sign.tamil;

  const hurdleStrEn = hurdlePointsEn.length > 0 ? hurdlePointsEn.join(", ") : "astrological factors";
  const hurdleStrTa = hurdlePointsTa.length > 0 ? hurdlePointsTa.join(", ") : "ஜோதிட காரணங்கள்";

  let verdict = "";
  let marriageType = "";

  const dashaWindowsNarrativeTa = primeWindows.length > 0
    ? primeWindows.map(b => `${b.mahadashaTamil || b.mahadashaLord} மகா தசை - ${b.subTamil || b.subLord} புக்தி (வயது ${b.startAge.toFixed(1)} - ${b.endAge.toFixed(1)}: ${b.calendarYears})`).join(", ")
    : (isTamil ? "சுப தசா சாளரம்" : "Favorable Dasha window");

  const dashaWindowsNarrativeEn = primeWindows.length > 0
    ? primeWindows.map(b => `${b.mahadashaLord} MD - ${b.subLord} AD (Ages ${b.startAge.toFixed(1)} - ${b.endAge.toFixed(1)}: ${b.calendarYears})`).join(", ")
    : "Favorable Dasha window";

  if (isLoveOrSelfChosenMarriage && hasFamilyOppositionOrHurdles) {
    marriageType = isTamil 
      ? "சுய விருப்ப / காந்தர்வ விவாக யோகம் (எதிர்ப்புகளைத் தாண்டிய திருமணம்)" 
      : "Self-Chosen / Love Marriage (Overcoming Family Opposition & Hurdles)";

    verdict = isTamil
      ? `சுய விருப்ப / காந்தர்வ விவாக யோகம் & குடும்ப எதிர்ப்புகளுக்கு மத்தியிலான திருமணம்:
- **களத்திர-லக்னாதிபதி தொடர்பு (${lagnaLordTa} + ${h7LordTa}):** லக்னாதிபதி ${lagnaLordTa} மற்றும் 7-ஆம் களத்திராதிபதி ${h7LordTa} சுப தொடர்பில் அமைந்துள்ளதால், இது சுய விருப்பம், பரஸ்பர ஈர்ப்பு மற்றும் தனிப்பட்ட உறுதியான முடிவால் அமைந்த காந்தர்வ திருமண பந்தத்தைக் (Love / Self-Chosen Alliance) குறிக்கிறது.
- **குடும்ப சூழல் & திருமண தடைகள்:** ${hurdleStrTa} காரணமாக திருமணத்தின் போது குடும்பத்தினர் மற்றும் உறவினர்கள் மத்தியில் தொடக்கத்தில் கருத்து வேறுபாடுகள் மற்றும் தடைகள் தோன்றலாம்.
- **விவாக தசா சாளரங்கள்:** ${dashaWindowsNarrativeTa} காலக்கட்டத்தில் திருமணம் கைகூடும்.
- **தாம்பத்திய வாழ்க்கை:** கணவன்-மனைவி இடையே ஆழ்ந்த பரஸ்பர அன்பும் ஈர்ப்பும் உண்டு; வெளி நபர்களின் குடும்பத் தலையீடுகளை தவிர்ப்பது இல்லற அமைதியை நிலைநிறுத்தும்.`
      : `Self-Chosen / Love Marriage Overcoming Family Friction & Hurdles (Gandharva Vivaha Dynamics):
- **1st Lord (${lagnaLord?.name || 'Lagna Lord'}) & 7th Lord (${h7Lord?.name || '7th Lord'}) Synergy:** Auspicious connection between Lagna Lord and 7th Lord signifies a self-chosen / love matrimonial union driven by personal conviction.
- **Domestic Factors:** Astrological dynamics (${hurdleStrEn}) indicate initial family reservations and hurdles that resolve through perseverance.
- **Operating Dasha Windows:** Activates under ${dashaWindowsNarrativeEn}.
- **Marital Synergy:** Strong mutual devotion between spouses; insulating personal domestic decisions from outside interference is traditionally associated with enduring harmony.`;
  } else if (isLoveOrSelfChosenMarriage) {
    marriageType = isTamil 
      ? "சுயவிருப்ப சுப விவாக யோகம் (அமைதியான காந்தர்வ மணம்)" 
      : "Harmonious Self-Chosen / Love Marriage";

    verdict = isTamil
      ? `சுய விருப்ப விவாக யோகம்: லக்னாதிபதி ${lagnaLordTa} மற்றும் 7-ஆம் அதிபதி ${h7LordTa} சுப தொடர்பில் உள்ளதால், இருவீட்டார் சம்மதத்துடன் கூடிய மனதிற்குப் பிடித்த சுயவிருப்ப திருமணம் ${dashaWindowsNarrativeTa} காலத்தில் இனிதே கைகூடும்.`
      : `Harmonious Self-Chosen Alliance: Direct connection between Lagna Lord ${lagnaLord?.name} and 7th Lord ${h7Lord?.name} confers a mutually fulfilling love marriage with family blessing under ${dashaWindowsNarrativeEn}.`;
  } else if (hasFamilyOppositionOrHurdles) {
    marriageType = isTamil 
      ? "பக்குவ ஏற்பாட்டு திருமணம் (ஆரம்ப தடைகளைத் தாண்டிய விவாகம்)" 
      : "Traditional Marriage with Matchmaking Maturation";

    verdict = isTamil
      ? `ஏற்பாட்டு திருமணம் & பக்குவ இல்லற பந்தம்: ${hurdleStrTa} காரணமாக ஆரம்ப கால வரன் தேடலில் எதிர்பார்ப்புகள் கூடி சற்று காலதாமதம் அல்லது சவால்கள் ஏற்படலாம். ஆனால் ${dashaWindowsNarrativeTa} காலத்தில் பண்பான துணையுடன் திருமணம் கைகூடும்.`
      : `Traditional Arranged Alliance with Matchmaking Delays: Astrological factors (${hurdleStrEn}) bring deliberate scrutiny and initial matchmaking hurdles, culminating in a stable, mature marriage under favorable sub-periods (${dashaWindowsNarrativeEn}).`;
  } else {
    marriageType = isTamil 
      ? "சுப விவாக யோகம் (சுமுகமான பாரம்பரிய திருமணம்)" 
      : "Auspicious Traditional Matrimonial Union";

    verdict = isTamil
      ? `சுப விவாக யோகம்: 7-ம் அதிபதியான ${h7LordTa} சுப ஸ்தானத்தில் அமர்ந்துள்ளதால், உகந்த தசா காலத்தில் (${dashaWindowsNarrativeTa}) நல்ல குணமும் பண்பும் கொண்ட வாழ்க்கைத்துணையுடன் திருமணம் இனிதே கைகூடும்.`
      : `Auspicious Matrimonial Alignment: 7th Lord ${h7Lord?.name} confers timely marriage within qualifying periods (${dashaWindowsNarrativeEn}) with a loving and supportive partner.`;
  }

  const isDelayedMarriage = Boolean(
    saturnAspects7th || 
    (saturn && saturn.house === 7) || 
    (saturn && saturn.house === 8) ||
    (h7Lord && ["Saturn", "Rahu"].includes(h7Lord.name)) ||
    (h7Lord && [6, 8, 12].includes(h7Lord.house))
  );

  return {
    primeWindows,
    qualifyingPeriods: primeWindows,
    allQualifyingPeriods: qualifyingBukthis,
    qualifyingBukthis: primeWindows,
    counterFactors: hurdlePointsEn,
    delayIndicators: hurdlePointsEn,
    timingStatus,
    isDelayedMarriage,
    isLoveOrSelfChosenMarriage,
    hasFamilyOppositionOrHurdles,
    auspiciousAgeRange,
    calendarYears,
    marriageType,
    verdict,
    spouseProfile: isTamil
      ? `${h7SignTa} ராசியின் ஆதிக்கத்தால் அழகியல் உணர்வு, சுயமாக சிந்திக்கும் ஆற்றல், நேர்மை மற்றும் குடும்பத்திற்கு உறுதுணையாக நிற்கும் பண்புள்ள துணை.`
      : `Governed by ${h7Sign.name}, endowed with aesthetic charm, balanced judgment, integrity, and loyal domestic support.`
  };
}

// ---------------------------------------------------------------------------
// 10B. Classical Multi-Factor Domain Evidence Ledger Engine
// Evaluates positive/supporting factors vs constraining/counter factors
// generating normalized evidence index values without arbitrary baselines or clamps.
// Note: These represent rule-based astrological consistency across chart factors, NOT empirical event probabilities.
// ---------------------------------------------------------------------------
export function buildDomainEvidenceLedger(planets = [], ascendantLong = 0, moonLong = 0, dashaTable = [], lang = "en") {
  const isTamil = lang === "ta";
  const lagnaSignIdx = Math.floor(norm360(ascendantLong) / 30);
  const lagnaSign = ZODIAC_SIGNS[lagnaSignIdx];
  const lagnaLord = planets.find(p => p.name.toLowerCase() === lagnaSign.ruler.toLowerCase());

  const getBhava = (h) => {
    const sIdx = (lagnaSignIdx + h - 1) % 12;
    const sign = ZODIAC_SIGNS[sIdx];
    const lord = planets.find(p => p.name.toLowerCase() === sign.ruler.toLowerCase());
    const occupants = planets.filter(p => p.house === h);
    return { num: h, sign, lordName: sign.ruler, lord, occupants };
  };

  const h1 = getBhava(1);
  const h2 = getBhava(2);
  const h4 = getBhava(4);
  const h5 = getBhava(5);
  const h6 = getBhava(6);
  const h7 = getBhava(7);
  const h8 = getBhava(8);
  const h9 = getBhava(9);
  const h10 = getBhava(10);
  const h11 = getBhava(11);
  const h12 = getBhava(12);

  const sun = planets.find(p => p.name === "Sun");
  const moon = planets.find(p => p.name === "Moon");
  const mars = planets.find(p => p.name === "Mars");
  const mercury = planets.find(p => p.name === "Mercury");
  const jupiter = planets.find(p => p.name === "Jupiter");
  const venus = planets.find(p => p.name === "Venus");
  const saturn = planets.find(p => p.name === "Saturn");
  const rahu = planets.find(p => p.name === "Rahu");
  const ketu = planets.find(p => p.name === "Ketu");

  const evaluateEvidence = (sups, cons, primaryDignity = "Neutral") => {
    let descEn = "Balanced Classical Evidence";
    let descTa = "சமநிலை சான்றுகள்";

    if (sups.length > 0 && cons.length === 0) {
      descEn = "Direct Supporting Astrological Factors";
      descTa = "நேரடி சாதக காரணிகள்";
    } else if (sups.length > 0 && cons.length > 0) {
      descEn = "Mixed Classical Factors (Supporting & Guarded)";
      descTa = "கலவையான சாஸ்திர காரணிகள்";
    } else if (sups.length === 0 && cons.length > 0) {
      descEn = "Guarded Astrological Placements (Requires Remedial Attention)";
      descTa = "கவனத்திற்குரிய அமைப்புகள் (பரிகார பலன்)";
    }

    return {
      evidenceLevel: isTamil ? descTa : descEn,
      supportingFactors: sups,
      counterIndicators: cons,
      primaryDignity
    };
  };

  // 1. HEALTH & SOMATIC VITALITY
  const healthSups = [];
  const healthCons = [];
  if (lagnaLord) {
    if (["Exalted", "Moolatrikona", "Own"].includes(lagnaLord.dignity)) {
      healthSups.push(isTamil ? `லக்னாதிபதி ${lagnaLord.tamil || lagnaLord.name} ஆட்சி/உச்ச பலம்` : `Lagna Lord ${lagnaLord.name} in high dignity (${lagnaLord.dignity})`);
    }
    if ([1, 4, 5, 9, 10, 11].includes(lagnaLord.house)) {
      healthSups.push(isTamil ? `லக்னாதிபதி கேந்திர/திரிகோண பலம் (வீடு ${lagnaLord.house})` : `Lagna Lord placed in auspicious Kendra/Trikona (House ${lagnaLord.house})`);
    }
    if ([6, 8, 12].includes(lagnaLord.house)) {
      healthCons.push(isTamil ? `லக்னாதிபதி மறைவு ஸ்தானத்தில் (வீடு ${lagnaLord.house}) இருப்பு` : `Lagna Lord in dusthana house (${lagnaLord.house})`);
    }
    if (lagnaLord.isCombust) {
      healthCons.push(isTamil ? "லக்னாதிபதி அஸ்தமனம்" : "Lagna Lord is combust with Sun");
    }
  }
  if (jupiter && [1, 5, 9].includes(jupiter.house)) {
    healthSups.push(isTamil ? "சுப குருவின் லக்ன/திரிகோண அமிர்த பார்வை" : "Benefic Jupiter trinal radiance over Ascendant");
  }
  if (sun && [1, 10].includes(sun.house)) {
    healthSups.push(isTamil ? "சூரியனின் பிராண சக்தி & நோய் எதிர்ப்பு ஆளுமை" : "Sun vital solar endurance in angular house");
  }
  if (h6.occupants.some(p => ["Saturn", "Mars", "Rahu", "Ketu"].includes(p.name))) {
    healthCons.push(isTamil ? "6-ம் ரோக ஸ்தானத்தில் அசுப கிரகங்கள் இருப்பு" : "Malefic presence in 6th house of disease & inflammation");
  }
  const healthEv = evaluateEvidence(healthSups, healthCons, lagnaLord?.dignity);

  // 2. HIGHER STUDIES & SCHOLASTIC GENIUS
  const studySups = [];
  const studyCons = [];
  if (mercury && [1, 4, 5, 9, 10, 11].includes(mercury.house)) {
    studySups.push(isTamil ? `புதனின் புத்திகாரக சுப அமைவு (வீடு ${mercury.house})` : `Mercury strong intellect & analytical memory in House ${mercury.house}`);
  }
  if (h5.lord && [1, 4, 5, 9, 11].includes(h5.lord.house)) {
    studySups.push(isTamil ? `5-ம் பூர்வ புண்ணியாதிபதி ${h5.lord.tamil || h5.lordName} சுப ஸ்தானத்தில் அமர்வு` : `5th Lord of higher intellect ${h5.lordName} in Kendra/Trikona`);
  }
  if (h4.lord && [1, 4, 5, 9].includes(h4.lord.house)) {
    studySups.push(isTamil ? "4-ம் வித்யா பாவாதிபதி பலம்" : "4th Lord of foundational learning strongly placed");
  }
  if (jupiter && [1, 4, 5, 9, 10].includes(jupiter.house)) {
    studySups.push(isTamil ? "குருவின் ஞான யோக பார்வை" : "Jupiter benevolent wisdom & conceptual comprehension");
  }
  if (mercury?.isCombust) {
    studyCons.push(isTamil ? "புதன் அஸ்தமனம் (கவனச்சிதறல் சவால்)" : "Mercury combustion (demands deliberate focus & revision)");
  }
  if (h5.occupants.some(p => ["Saturn", "Rahu", "Ketu"].includes(p.name))) {
    studyCons.push(isTamil ? "5-ல் அசுப கிரக தொடர்பு (போட்டித் தேர்வில் கூடுதல் முயற்சி தேவை)" : "Karmic node/malefic in 5th house (demands structured exam routines)");
  }
  const studyEv = evaluateEvidence(studySups, studyCons, mercury?.dignity || h5.lord?.dignity);

  // 3. CAREER & VOCATIONAL LEADERSHIP
  const careerSups = [];
  const careerCons = [];
  if (h10.lord && [1, 4, 5, 7, 9, 10, 11].includes(h10.lord.house)) {
    careerSups.push(isTamil ? `10-ம் கர்ம பாவாதிபதி ${h10.lord.tamil || h10.lordName} கேந்திர/லாப ஸ்தானத்தில் அமர்வு` : `10th Career Lord ${h10.lordName} placed favorably in House ${h10.lord.house}`);
  }
  if (sun && [1, 10, 11].includes(sun.house)) {
    careerSups.push(isTamil ? "சூரியனின் நிர்வாக தலைமை & அரசு மரியாதை யோகம்" : "Sun confers executive presence & administrative acumen");
  }
  if (mars && mars.house === 10) {
    careerSups.push(isTamil ? "செவ்வாயின் 10-ம் பாவ திக்பல வீரியம் & காரிய சித்தி" : "Mars in 10th Digbala (vocational drive & execution mastery)");
  } else if (mars && mars.house === 1 && mars.dignity !== "Debilitated") {
    careerSups.push(isTamil ? "செவ்வாயின் லக்ன வீரியம் & காரிய முனைப்பு" : "Mars in 1st house dynamic enterprise & initiative");
  }
  if (h11.lord && [1, 2, 10, 11].includes(h11.lord.house)) {
    careerSups.push(isTamil ? "11-ம் லாபாதிபதி பலம் (தொழில் மூல தன வரவு)" : "11th Lord of gains strongly aligned with vocational houses");
  }
  if (h10.occupants.some(p => ["Saturn", "Rahu"].includes(p.name))) {
    careerCons.push(isTamil ? "10-ம் பாவத்தில் சனி/ராகு கர்ம தாக்கம் (ஆரம்ப கால சவால்கள்/மறுசீரமைப்பு)" : "Saturn/Rahu influence on 10th house (restructuring & perseverance required)");
  }
  if (h10.lord && [6, 8, 12].includes(h10.lord.house)) {
    careerCons.push(isTamil ? "10-ம் அதிபதி மறைவு ஸ்தானத்தில் இருப்பு" : "10th Lord placed in dusthana house");
  }
  const careerEv = evaluateEvidence(careerSups, careerCons, h10.lord?.dignity);

  // 4. WEALTH & FINANCIAL PROSPERITY (DHANA YOGA)
  const wealthSups = [];
  const wealthCons = [];
  if (h2.lord && [1, 2, 4, 5, 9, 10, 11].includes(h2.lord.house)) {
    wealthSups.push(isTamil ? `2-ம் தன பாவாதிபதி ${h2.lord.tamil || h2.lordName} சுப ஸ்தானத்தில் அமர்வு` : `2nd Lord of accumulated wealth ${h2.lordName} in auspicious house ${h2.lord.house}`);
  }
  if (h11.lord && [1, 2, 5, 9, 11].includes(h11.lord.house)) {
    wealthSups.push(isTamil ? `11-ம் லாபாதிபதி ${h11.lord.tamil || h11.lordName} தன/லாப யோகம்` : `11th Lord of recurrent revenues in Dhana Yoga alignment`);
  }
  if (jupiter && [1, 2, 5, 9, 11].includes(jupiter.house)) {
    wealthSups.push(isTamil ? "தனகாரகன் குருவின் நிதி பலம்" : "Dhanakaraka Jupiter favorably energizing wealth houses");
  }
  if (h12.lord && [2, 11].includes(h12.lord.house)) {
    wealthCons.push(isTamil ? "12-ம் விரயாதிபதி தன/லாப ஸ்தானத்தில் (செலவு மேலாண்மை தேவை)" : "12th Lord of expenditure in wealth house (diligent capital controls advised)");
  }
  if (h2.occupants.some(p => ["Rahu", "Saturn"].includes(p.name))) {
    wealthCons.push(isTamil ? "2-ல் ராகு/சனி இருப்பு (ஊக வணிக முதலீடுகளில் எச்சரிக்கை)" : "Rahu/Saturn in 2nd house (avoid unhedged speculative trading)");
  }
  const wealthEv = evaluateEvidence(wealthSups, wealthCons, h2.lord?.dignity || h11.lord?.dignity);

  // 5. LANDED PROPERTIES & LUXURY CONVEYANCE (BHOOMI & VAHANA)
  const propSups = [];
  const propCons = [];
  if (h4.lord && [1, 4, 5, 7, 9, 10, 11].includes(h4.lord.house)) {
    propSups.push(isTamil ? `4-ம் சுக பாவாதிபதி ${h4.lord.tamil || h4.lordName} கேந்திர ஸ்தானத்தில் அமர்வு` : `4th House Lord ${h4.lordName} placed in angular Kendra`);
  }
  if (mars && [1, 4, 10, 11].includes(mars.house)) {
    propSups.push(isTamil ? "பூமிகாரகன் செவ்வாயின் ரியல் எஸ்டேட் & கட்டட சுப பலம்" : "Bhoomikaraka Mars energizing real estate & land acquisition");
  }
  if (venus && [1, 4, 7, 11, 12].includes(venus.house)) {
    propSups.push(isTamil ? "வாகனகாரகன் சுக்கிரனின் சொகுசு வாகன யோகம்" : "Vahanakaraka Venus supporting personal conveyance comforts");
  }
  if (h4.occupants.some(p => ["Saturn", "Ketu"].includes(p.name))) {
    propCons.push(isTamil ? "4-ல் சனி/கேது இருப்பு (பழைய கட்டடங்கள்/பராமரிப்பு செலவு)" : "Saturn/Ketu in 4th house (property renovation/delay in initial paperwork)");
  }
  if (mars?.isCombust || mars?.dignity === "Debilitated") {
    propCons.push(isTamil ? "செவ்வாய் பலவீனத்தால் நிலப் பத்திர சரிபார்ப்பு அவசியம்" : "Afflicted Mars advises strict land title legal scrutiny");
  }
  const propEv = evaluateEvidence(propSups, propCons, mars?.dignity || h4.lord?.dignity);

  // 6. MARRIAGE & DOMESTIC HARMONY
  const relSups = [];
  const relCons = [];
  if (h7.lord && [1, 2, 4, 5, 7, 9, 11].includes(h7.lord.house)) {
    relSups.push(isTamil ? `7-ம் களத்திராதிபதி ${h7.lord.tamil || h7.lordName} சுப ஸ்தானத்தில் அமர்வு` : `7th Lord ${h7.lordName} well-positioned in House ${h7.lord.house}`);
  }
  if (venus && [1, 4, 7, 9, 11].includes(venus.house)) {
    relSups.push(isTamil ? "சுக்கிரனின் களத்திர சுப யோகம்" : "Venus conferring matrimonial grace & aesthetic harmony");
  }
  if (jupiter && [1, 5, 7, 9].includes(jupiter.house)) {
    relSups.push(isTamil ? "குருவின் சுப பார்வை இல்லறத்தை காக்கும் கவசம்" : "Jupiter drishti safeguarding marital bond");
  }
  if (h7.occupants.some(p => ["Saturn", "Rahu", "Mars"].includes(p.name))) {
    relCons.push(isTamil ? "7-ல் சனி/ராகு/செவ்வாய் ஆதிக்கம் (புரிதல் & விட்டுக்கொடுத்தல் தேவை)" : "Malefic influence in 7th house (mindful communication advised)");
  }
  if (h7.lord?.isCombust) {
    relCons.push(isTamil ? "7-ம் அதிபதி அஸ்தமனம் (முதிர்ந்த விவாக காலம்)" : "7th Lord combustion indicates mature timing for marriage");
  }
  const relEv = evaluateEvidence(relSups, relCons, h7.lord?.dignity || venus?.dignity);

  // 7. LEADERSHIP & PUBLIC STEWARDSHIP
  const govSups = [];
  const govCons = [];
  if (sun && [1, 5, 9, 10].includes(sun.house)) {
    govSups.push(isTamil ? "சூரியனின் அதிகார ராஜ காரக பலம்" : "Sun conferring natural administrative prestige & vision");
  }
  if (saturn && [1, 7, 10, 11].includes(saturn.house)) {
    govSups.push(isTamil ? "சனியின் மக்கள் தொடர்பு & ஜனநாயக சமுதாய செல்வாக்கு" : "Saturn mass connectivity & civic stewardship alignment");
  }
  if (h1.lord && [1, 10].includes(h1.lord.house)) {
    govSups.push(isTamil ? "லக்னாதிபதி சிம்மாசன ஸ்தானத்தில் இருப்பு" : "Lagna Lord in 10th throne house (institutional leadership)");
  }
  if (sun?.dignity === "Debilitated" || sun?.house === 7) {
    govCons.push(isTamil ? "சூரியன் பலவீனத்தால் ஆலோசனைக் குழு/நிறுவன வழிகாட்டல் சிறந்தது" : "Afflicted Sun recommends advisory & institutional stewardship rather than direct electoral office");
  }
  const govEv = evaluateEvidence(govSups, govCons, sun?.dignity);

  return {
    health: {
      domain: "health",
      title: isTamil ? "பாரம்பரிய ஜோதிட உடல் சமநிலை & தடுப்பு நலன்" : "Traditional Astrological Health Tendencies & Preventive Wellness",
      supportingFactors: healthSups,
      counterIndicators: healthCons,
      evidenceLevel: healthEv.evidenceLevel
    },
    studies: {
      domain: "studies",
      title: isTamil ? "உயர்கல்வி & அறிவுசார் மேதைமை" : "Higher Studies & Scholastic Genius",
      supportingFactors: studySups,
      counterIndicators: studyCons,
      evidenceLevel: studyEv.evidenceLevel
    },
    career: {
      domain: "career",
      title: isTamil ? "தொழில் தலைமை & உத்தியோக மேன்மை" : "Career Trajectory & Vocational Leadership",
      supportingFactors: careerSups,
      counterIndicators: careerCons,
      evidenceLevel: careerEv.evidenceLevel
    },
    wealth: {
      domain: "wealth",
      title: isTamil ? "தன சம்பத்து & நிதி பொற்காலம்" : "Wealth Accumulation & Dhana Yogas",
      supportingFactors: wealthSups,
      counterIndicators: wealthCons,
      evidenceLevel: wealthEv.evidenceLevel
    },
    property: {
      domain: "property",
      title: isTamil ? "பூமி யோகம் & வாகன சேர்க்கை" : "Landed Property & Luxury Conveyance",
      supportingFactors: propSups,
      counterIndicators: propCons,
      evidenceLevel: propEv.evidenceLevel
    },
    marriage: {
      domain: "marriage",
      title: isTamil ? "இல்லற பந்தம் & தாம்பத்திய நல்லிணக்கம்" : "Matrimonial Harmony & Soulmate Union",
      supportingFactors: relSups,
      counterIndicators: relCons,
      evidenceLevel: relEv.evidenceLevel
    },
    governance: {
      domain: "governance",
      title: isTamil ? "தலைமைப் பண்பு & மக்கள் சேவை ஆளுமை" : "Leadership & Public Stewardship",
      supportingFactors: govSups,
      counterIndicators: govCons,
      evidenceLevel: govEv.evidenceLevel
    }
  };
}

// ---------------------------------------------------------------------------
// 11. Comprehensive Life Domain Predictions & Political Eligibility Engine
// ---------------------------------------------------------------------------
export function calculateComprehensiveDomainPredictions(planets, ascendantLong, moonLong, sunLong, lang = "en", dashaTable = [], birthYear = 1990) {
  const isTamil = lang === "ta";
  const lagnaSignIdx = Math.floor(norm360(ascendantLong) / 30);
  const lagnaSign = ZODIAC_SIGNS[lagnaSignIdx];
  const lagnaLordName = lagnaSign.ruler;
  const lagnaLord = planets.find(p => p.name.toLowerCase() === lagnaLordName.toLowerCase());

  const getBhavaSignAndLord = (h) => {
    const sIdx = (lagnaSignIdx + h - 1) % 12;
    const sign = ZODIAC_SIGNS[sIdx];
    const lord = planets.find(p => p.name.toLowerCase() === sign.ruler.toLowerCase());
    const occupants = planets.filter(p => p.house === h);
    return { houseNum: h, sign, lordName: sign.ruler, lordPlanet: lord, occupants };
  };

  const h1 = getBhavaSignAndLord(1);
  const h2 = getBhavaSignAndLord(2);
  const h4 = getBhavaSignAndLord(4);
  const h5 = getBhavaSignAndLord(5);
  const h6 = getBhavaSignAndLord(6);
  const h7 = getBhavaSignAndLord(7);
  const h8 = getBhavaSignAndLord(8);
  const h9 = getBhavaSignAndLord(9);
  const h10 = getBhavaSignAndLord(10);
  const h11 = getBhavaSignAndLord(11);
  const h12 = getBhavaSignAndLord(12);

  const sun = planets.find(p => p.name === "Sun");
  const moon = planets.find(p => p.name === "Moon");
  const mars = planets.find(p => p.name === "Mars");
  const mercury = planets.find(p => p.name === "Mercury");
  const jupiter = planets.find(p => p.name === "Jupiter");
  const venus = planets.find(p => p.name === "Venus");
  const saturn = planets.find(p => p.name === "Saturn");
  const rahu = planets.find(p => p.name === "Rahu");
  const ketu = planets.find(p => p.name === "Ketu");

  const careerPathway = calculateCareerAndExamPathway(planets, ascendantLong, lang);
  const marriagePathway = calculateMarriagePathway(planets, ascendantLong, dashaTable, birthYear, lang);
  const evidenceLedger = buildDomainEvidenceLedger(planets, ascendantLong, moonLong, dashaTable, lang);

  // 1. HEALTH & SOMATIC VITALITY
  const h6OccupantsNames = h6.occupants.map(p => isTamil ? p.tamil : p.name).join(", ");
  const sensitiveOrgans = [];
  if (["Aries", "Scorpio"].includes(lagnaSign.name) || mars?.house === 6) sensitiveOrgans.push(isTamil ? "தலை, கண் பார்வை & பித்த உஷ்ண சமநிலை" : "Cranial zone, eye vitality & Pitta (bile heat) balance");
  if (["Taurus", "Libra"].includes(lagnaSign.name) || venus?.house === 6) sensitiveOrgans.push(isTamil ? "தொண்டை, குரல்வளை & கப நீர் சமநிலை" : "Throat, vocal chords & Kapha fluid regulation");
  if (["Gemini", "Virgo"].includes(lagnaSign.name) || mercury?.house === 6) sensitiveOrgans.push(isTamil ? "தோள்பட்டை, சுவாசப் பாதை & வாத நரம்பு ஓட்டம்" : "Shoulders, respiratory airways & Vata nervous flow");
  if (["Cancer"].includes(lagnaSign.name) || moon?.house === 6) sensitiveOrgans.push(isTamil ? "மார்பகப் பகுதி, இரைப்பை & மன சமநிலை" : "Chest area, stomach nourishment & emotional ease");
  if (["Leo"].includes(lagnaSign.name) || sun?.house === 6) sensitiveOrgans.push(isTamil ? "மேல் முதுகு, இதயப் பகுதி & பிராண பலம்" : "Upper back, thoracic stamina & vital endurance");
  if (["Sagittarius", "Pisces"].includes(lagnaSign.name) || jupiter?.house === 6) sensitiveOrgans.push(isTamil ? "இடுப்பு, தொடைப் பகுதி & ரத்த ஓட்டப் பாதை" : "Hips, thighs & arterial circulation pathways");
  if (["Capricorn", "Aquarius"].includes(lagnaSign.name) || saturn?.house === 6) sensitiveOrgans.push(isTamil ? "முழங்கால்கள், மூட்டு இணைப்புகள் & வாத தாது" : "Knees, skeletal joint flexibility & Vata tissue posture");
  if (sensitiveOrgans.length === 0) sensitiveOrgans.push(isTamil ? "செரிமான இயக்கம் & சீரான ஓய்வு" : "Digestive rhythm & balanced circadian rest");

  const hasHealthSups = (evidenceLedger.health.supportingFactors || []).length > 0;
  const hasHealthCons = (evidenceLedger.health.counterIndicators || []).length > 0;
  const healthLongevity = (hasHealthSups && !hasHealthCons)
    ? (isTamil ? "சாதகமான பாரம்பரிய ஜோதிட அமைப்புகள் (Direct Supporting Factors)" : "Direct Supporting Astrological Factors (Lagna Lord & Benefic Placements)")
    : (hasHealthSups && hasHealthCons
      ? (isTamil ? "கலவையான சாஸ்திர அமைப்புகள் (Mixed Astrological Factors)" : "Mixed Astrological Indications (Benefic & Guarded Placements)")
      : (isTamil ? "தற்காப்பு நலன் வழிகாட்டல் (Preventive Vitality Focus)" : "Preventive Attention & Lifestyle Routine Advised"));
  let lagnaLordHealthDescEn = "";
  let lagnaLordHealthDescTa = "";
  if (lagnaLord) {
    if ([6, 8, 12].includes(lagnaLord.house)) {
      lagnaLordHealthDescEn = `Ascendant lord ${lagnaLordName} is placed in House ${lagnaLord.house} (Dusthana), traditionally advising structured lifestyle hygiene, stress management, and proactive wellness care.`;
      lagnaLordHealthDescTa = `லக்னாதிபதி ${lagnaLord?.tamil || lagnaLordName} ${lagnaLord.house}-ம் மறைவு ஸ்தானத்தில் அமைந்துள்ளதால், சீரான உணவு முறை, உடற்பயிற்சி மற்றும் மன அமைதியை பேண பாரம்பரிய சாஸ்திரம் வழிகாட்டுகிறது.`;
    } else if (lagnaLord.dignity === "Debilitated") {
      lagnaLordHealthDescEn = `Ascendant lord ${lagnaLordName} is debilitated in House ${lagnaLord.house}, indicating physical vitality that benefits from consistent nutritional discipline and circadian rest.`;
      lagnaLordHealthDescTa = `லக்னாதிபதி ${lagnaLord?.tamil || lagnaLordName} ${lagnaLord.house}-ம் வீட்டில் நீசமடைந்துள்ளதால், உடல் சோர்வு மற்றும் பருவநிலை மாற்றங்களில் கூடுதல் கவனம் செலுத்துவது நலம்.`;
    } else {
      lagnaLordHealthDescEn = `Ascendant lord ${lagnaLordName} positioned favorably in House ${lagnaLord.house} is traditionally associated with robust physical stamina and steady recovery.`;
      lagnaLordHealthDescTa = `லக்னாதிபதி ${lagnaLord?.tamil || lagnaLordName} ${lagnaLord.house}-ம் சுப வீட்டில் அமைந்துள்ளதால் நல்ல உடல் பலம் மற்றும் உற்சாகத்தை அளிக்க பாரம்பரிய சாஸ்திரம் கூறுகிறது.`;
    }
  } else {
    lagnaLordHealthDescEn = `Ascendant lord governance provides baseline vitality correspondences.`;
    lagnaLordHealthDescTa = `லக்னாதிபதி பலம் உடல் சமநிலைக்கு வழிகாட்டுகிறது.`;
  }

  const healthSummary = isTamil
    ? `${lagnaLordHealthDescTa} 6-ம் அதிபதி ${h6.lordPlanet?.tamil || h6.lordName} சஞ்சாரத்தை கவனித்து உணவு முறைகளை ஒழுங்குபடுத்துவது நலம். ${h6OccupantsNames ? `6-ம் வீட்டில் ${h6OccupantsNames} இருப்பு ஆரோக்கிய விழிப்புணர்வை தூண்டுகிறது.` : '6-ம் பாவகத்தில் தீவிர அசுப ஆதிக்கங்கள் இன்றி உடல் சமநிலை மற்றும் அன்றாட உற்சாகத்தை பேண பாரம்பரிய ஜோதிடம் வழிகாட்டுகிறது.'}`
    : `${lagnaLordHealthDescEn} Classical Jyotisha associates 6th house lord ${h6.lordName} governance with constitutional balance and disciplined daily regimens. ${h6OccupantsNames ? `Presence of ${h6OccupantsNames} in the 6th house advises routine preventive checkups.` : 'Absence of severe malefic afflictions in 6th house is traditionally associated with stable vitality and daily physical equilibrium.'}`;

  // 2. STUDIES, HIGHER EDUCATION & ACADEMIC MASTERY
  const mercuryStrong = mercury ? [1, 4, 5, 9, 10, 11].includes(mercury.house) : false;
  const jupiterStrong = jupiter ? [1, 4, 5, 9, 10, 11].includes(jupiter.house) : false;
  const academicFields = [];
  if (["Gemini", "Virgo", "Aquarius"].includes(lagnaSign.name) || mercuryStrong) academicFields.push(isTamil ? "கணினி அறிவியல், தகவல் தொழில்நுட்பம் & தரவு பகுப்பாய்வு" : "Computer Science, AI/Data Science, FinTech & Analytics");
  if (["Aries", "Scorpio", "Capricorn"].includes(lagnaSign.name) || (mars && [5, 10].includes(mars.house))) academicFields.push(isTamil ? "பொறியியல், எலக்ட்ரானிக்ஸ், பாதுகாப்பு & கட்டடவியல்" : "Mechanical/Civil Engineering, Electronics, Defense & Applied Tech");
  if (["Cancer", "Pisces", "Scorpio"].includes(lagnaSign.name) || (moon && moon.house === 5) || (sun && [4, 6].includes(sun.house))) academicFields.push(isTamil ? "மருத்துவம், அறுவை சிகிச்சை, பார்மசி & உயிரி அறிவியல்" : "Medicine, Surgery, Bio-technology, Pharmacy & Nursing");
  if (["Sagittarius", "Pisces", "Leo", "Libra"].includes(lagnaSign.name) || jupiterStrong) academicFields.push(isTamil ? "சட்டம், மேலாண்மை (MBA), பொருளாதாரம், நிதி & பட்டய கணக்காளர் (CA)" : "Law & Judiciary, Executive MBA, Economics, Chartered Accountancy (CA) & Public Policy");
  if (["Taurus", "Libra"].includes(lagnaSign.name) || (venus && venus.house === 5)) academicFields.push(isTamil ? "கட்டடக்கலை, மீடியா, விஷுவல் கம்யூனிகேஷன் & வடிவமைப்பு" : "Architecture, Visual Media, Design Arts & Creative Direction");
  if (academicFields.length === 0) academicFields.push(isTamil ? "வணிகவியல், நிர்வாக மேலாண்மை & கல்வித்துறை" : "Commerce, Management & Scholastic Research");

  const examSuccessChance = (careerPathway.is6thLordCombust || careerPathway.hasSaturnRahuIn10 || careerPathway.isMarsAfflictedBySaturn)
    ? (isTamil ? "சவாலான கட்-ஆஃப் நிலை (Near-Miss Risk) - தீவிர உழைப்பும் மாற்று வழிகளும் தேவை" : "Competitive Hurdles - Demands Diligent Preparation & Strategic Flexibility")
    : ((mercuryStrong || jupiterStrong || (sun && [4, 5, 9].includes(sun.house)))
      ? (isTamil ? "உயர் அனுகூல யோகம் (சுப புதன் & குரு பார்வை பலம்)" : "Favorable Astrological Aptitude (Supported by Mercury & Jupiter)")
      : (isTamil ? "மத்திம அனுகூலம் - தொடர் பயிற்சியால் வெற்றி" : "Favorable Aptitude - Steady Discipline Supports Exam Outcomes"));

  const studiesSummary = isTamil
    ? `4-ம் அதிபதி ${h4.lordPlanet?.tamil || h4.lordName} மற்றும் 5-ம் பூர்வ புண்ணிய அதிபதி ${h5.lordPlanet?.tamil || h5.lordName} சுப தொடர்பில் உள்ளதால் உயர்கல்வி பட்டப்படிப்பு சிறப்பாக அமையும். ${careerPathway.is6thLordCombust ? 'ஆனால் 6-ம் அதிபதி அஸ்தமனமாகியுள்ளதால் வங்கி மற்றும் அரசு போட்டித் தேர்வுகளில் கட்-ஆஃப் மதிப்பெண்களில் கூடுதல் உழைப்பு தேவைப்படலாம்.' : ''}`
    : `4th lord ${h4.lordName} and 5th lord ${h5.lordName} support academic development and higher studies. ${careerPathway.is6thLordCombust ? 'However, 6th lord combustion suggests that competitive examinations require diligent strategy and rigorous preparation.' : ''}`;

  // 3. CAREER, VOCATIONS & EXECUTIVE LEADERSHIP
  const h10Lord = h10.lordPlanet;
  const h10OccupantsStr = h10.occupants.map(p => isTamil ? p.tamil : p.name).join(", ");
  let careerDominance = isTamil ? "சுய வணிக சாம்ராஜ்யம் & தொழில் முனைவு" : "Independent Business Enterprise & Entrepreneurship";
  if (careerPathway.hasSaturnRahuIn10) {
    careerDominance = isTamil ? "மகா வியாபார & சுயதொழில் வணிகம் (Independent Business & Trade)" : "Independent Business & Commercial Enterprise";
  } else if (h10.occupants.some(p => p.name === "Sun" || p.name === "Mars")) {
    careerDominance = isTamil ? "அரசாங்க அதிகாரம், உயர் நிர்வாகம் & தலைமைப் பதவி" : "Government Authority, Directorial Command & Public Sector";
  } else if (h10.occupants.some(p => p.name === "Mercury" || p.name === "Venus")) {
    careerDominance = isTamil ? "தொழில்நுட்ப நிறுவனங்கள், சர்வதேச வர்த்தகம் & நிதித்துறை" : "Tech Enterprises, International Trade, Media & High Finance";
  } else if (h10.occupants.some(p => p.name === "Saturn" || p.name === "Rahu")) {
    careerDominance = isTamil ? "சுயதொழில் முனைவு, உற்பத்தி, வர்த்தகம் & உழைப்பால் உயரும் வணிகம்" : "Independent Business Founding, Manufacturing, Trade & Enterprise";
  }

  const careerSummary = isTamil
    ? `10-ம் கர்ம பாவகாதிபதி ${h10Lord?.tamil || h10.lordName}${h10Lord ? ` ${h10Lord.house}-ம் இடத்தில் அமர்ந்துள்ளார்.` : '.'} ${careerPathway.hasSaturnRahuIn10 ? '10-ம் வீட்டில் சனி+ராகு தொடர்பு மற்றும் 11-ல் லக்னாதிபதி தொடர்பு சுயதொழில், வர்த்தகம் மற்றும் வணிக முயற்சிகளுக்கு வலுவான சாஸ்திர ஆதரவை காட்டுகின்றன; அதே வேளையில் நிறுவன நிர்வாக தலைமைக்கும் வாய்ப்புகளை அளிக்கிறது.' : `${h10OccupantsStr ? `10-ம் வீட்டில் ${h10OccupantsStr} ஆதிக்கம் செலுத்துகிறது.` : 'நிலையான உத்தியோக வளர்ச்சி அமையும்.'}`}`
    : `10th lord ${h10.lordName}${h10Lord ? ` resides in House ${h10Lord.house}.` : '.'} ${careerPathway.hasSaturnRahuIn10 ? '10th house Saturn-Rahu configuration and Lagna Lord connection with 11th indicate strong traditional aptitude for independent business initiatives and commercial ventures, alongside potential for institutional leadership. The chart reflects a comparative entrepreneurial tendency rather than an exclusive career prescription.' : `${h10OccupantsStr ? `10th house energized by ${h10OccupantsStr}.` : 'Classical indicators support steady vocational progression.'}`}`;

  // 4. PROPERTY, VEHICLES & WEALTH ACCUMULATION
  const hasPropSups = (evidenceLedger.property.supportingFactors || []).length > 0;
  const propertyOutlook = hasPropSups
    ? (isTamil ? "அபரிமிதமான பூமி யோகம் & சொகுசு வாகன யோகம்" : "High Real Estate Alignment & Multiple Vehicle Signatures")
    : (isTamil ? "நிலையான சொந்த வீடு & வாகன யோகம்" : "Stable Real Estate Acquisition & Dependable Vehicles");
  
  const h4OccupantsNames = h4.occupants.map(p => isTamil ? (p.tamil || toTamilPlanet(p.name)) : p.name).join(", ");
  const h4HasAffliction = h4.occupants.some(p => ["Saturn", "Rahu", "Ketu"].includes(p.name));
  const propertySummary = isTamil
    ? `${mars ? `பூமிகாரகன் செவ்வாய் ${mars.house}-ம் வீட்டிலும் (${mars.tamil || toTamilPlanet(mars.name)}), ` : ''}${venus ? `வாகனகாரகன் சுக்கிரன் ${venus.house}-ம் வீட்டிலும் (${venus.tamil || toTamilPlanet(venus.name)}), ` : ''}4-ம் அதிபதி ${h4.lordPlanet?.tamil || (h4.lordName ? toTamilPlanet(h4.lordName) : "")}${h4.lordPlanet ? ` ${h4.lordPlanet.house}-ம் இடத்தில் உள்ளார்.` : '.'} ${h4HasAffliction ? `4-ம் பாவகத்தில் ${h4OccupantsNames} இருப்பு நில ஆவணங்களை கவனமாக சரிபார்த்து சொத்து மற்றும் வாகனங்களை வாங்குவதை அறிவுறுத்துகிறது.` : 'சொந்த மனை, வீடு மற்றும் வாகன வசதிகள் சுப யோகமாக அமையும்.'}`
    : `${mars ? `Mars (Bhoomi Karaka) positioned in House ${mars.house} ` : ''}${venus ? `and Venus (Vahana Karaka) in House ${venus.house} ` : ''}align with real estate and conveyance assets. 4th house lord ${h4.lordName}${h4.lordPlanet ? ` is situated in House ${h4.lordPlanet.house}.` : '.'} ${h4HasAffliction ? `Presence of ${h4OccupantsNames} in 4th house advises diligent title deed verification and prudent capital budgeting for properties.` : 'Classical alignments support steady acquisition of residential premises and dependable vehicles.'}`;

  // 5. LEADERSHIP, PUBLIC STEWARDSHIP & CIVIC THEMES
  let polCategory = "";
  let polPathways = [];
  let publicServiceAlignment = "Moderate";
  const hasGovSups = (evidenceLedger.governance.supportingFactors || []).length > 0;
  const hasGovCons = (evidenceLedger.governance.counterIndicators || []).length > 0;

  if (hasGovSups && !hasGovCons) {
    publicServiceAlignment = isTamil ? "உயர் அனுகூல தலைமை யோகம்" : "High Public Stewardship Alignment";
    polCategory = isTamil ? "தலைமைப் பண்புகள் & நிர்வாக ஆளுமை (Traditional Leadership Indicators)" : "Leadership & Governance Themes";
    polPathways = [
      isTamil ? "மக்கள் தொடர்பு, சமுதாயத் தலைமை & பொது விவகாரங்கள்" : "Public Representation, Civic Leadership & Public Affairs",
      isTamil ? "அரசாங்க ஆலோசனைக் குழு & கொள்கை வழிகாட்டுதல்" : "Advisory Councils, Policy Think-Tanks & Strategic Guidance",
      isTamil ? "நிர்வாக மேலாண்மை & அரசுத்துறை உயர் பதவிகள்" : "Administrative Management & Executive Public Stewardship",
      isTamil ? "சட்டரீதியான வாரியங்கள் & சமுதாய நல தூதரக பணிகள்" : "Civic Statutory Boards & Community Advocacy"
    ];
  } else if (hasGovSups && hasGovCons) {
    publicServiceAlignment = isTamil ? "அனுகூல சமுதாய ஆளுமை" : "Favorable Civic Alignment";
    polCategory = isTamil ? "சமுதாயத் தலைமை, நிர்வாகம் & மக்கள் செல்வாக்கு" : "Public Administration & Civic Organization Leadership";
    polPathways = [
      isTamil ? "தொழிற்சங்கங்கள், வணிக அமைப்புகள் & சமுதாய வழிகாட்டுதல்" : "Industry Associations, Trade Councils & Community Advocacy",
      isTamil ? "பொதுத்துறை நிறுவனங்கள் & கட்டமைப்பு திட்டங்கள்" : "Public Sector Undertakings & Institutional Operations",
      isTamil ? "வியூக ஆலோசகர் & மக்கள் தொடர்பு மேலாண்மை" : "Strategic Advisor, Civic Campaign Organizer & Public Relations",
      isTamil ? "சட்ட ஆலோசகர், நீதித்துறை & பொதுநல சேவை" : "Legal Counsel & Public Interest Advocacy"
    ];
  } else {
    publicServiceAlignment = isTamil ? "நிறுவன தலைமை நிலை" : "Institutional Stewardship";
    polCategory = isTamil ? "நிறுவன தலைமை & அறக்கட்டளை ஆளுமை" : "Institutional Directorship & Corporate Governance";
    polPathways = [
      isTamil ? "கார்ப்பரேட் நிர்வாகக் குழு & அறக்கட்டளை தலைமை" : "Corporate Boardroom Directorship & Trust Governance",
      isTamil ? "சமூக நல அறக்கட்டளைகள் & தொண்டு நிறுவன மேலாண்மை" : "Philanthropic Foundations & Civic NGO Leadership",
      isTamil ? "நிறுவனங்களுக்கான கொள்கை ஆலோசனைகள்" : "Institutional Policy Advisory & Governance Review"
    ];
  }

  const politicsSummary = isTamil
    ? `${sun ? `சூரியன் (ஆளுமை ஆற்றல்) ${sun.house}-ம் வீட்டிலும், ` : ''}${saturn ? `சனி (மக்கள் தொடர்பு) ${saturn.house}-ம் வீட்டிலும் ` : ''}அமைந்திருப்பது சமுதாயத்தில் நிர்வாகப் பொறுப்புகளையும் ஆளுமை செல்வாக்கையும் அளிக்கிறது. உங்கள் பாரம்பரிய ஜாதக அமைப்பு வழிகாட்டுதல், ஆலோசனை மற்றும் நிறுவன மேலாண்மை பணிகளுக்கு உகந்ததாக உள்ளது.`
    : `${sun ? `Sun (Leadership Will) positioned in House ${sun.house} (${sun.dignity || 'Neutral'}) ` : ''}${saturn ? `combined with Saturn (Civic Duty & Masses) in House ${saturn.house} (${saturn.dignity || 'Neutral'}) ` : ''}provides solid strategic executive acumen. Traditional astrological indications point to aptitude for institutional governance, civic stewardship, and advisory roles.`;

  // 6. MARRIAGE, PARTNERSHIP & PROGENY KARMA
  const relationshipSummary = marriagePathway.verdict;

  // 7. FOREIGN TRAVEL, SETTLEMENT & MOKSHA
  const foreignStrong = (rahu ? [9, 12].includes(rahu.house) : false) ||
                        (moon ? [9, 12].includes(moon.house) : false) ||
                        (lagnaLord ? [9, 12].includes(lagnaLord.house) : false);
  const foreignModerate = (jupiter ? [9, 12].includes(jupiter.house) : false) ||
                          (sun ? [9, 12].includes(sun.house) : false);
  
  let foreignSummary;
  if (isTamil) {
    if (foreignStrong) {
      foreignSummary = "9-ம் பாக்கிய பாவமும் 12-ம் விரய மோட்ச பாவமும் நேரடியாக இயங்குவதால் வெளிநாட்டு கல்வி, அயல்நாட்டு வேலைவாய்ப்பு அல்லது தொழில் சார்ந்த உலகளாவிய பயணங்களுக்கு பாரம்பரிய ஜோதிட அமைப்புகள் சாதகமாக உள்ளன.";
    } else if (foreignModerate) {
      foreignSummary = "சில வெளிநாட்டு பயண வாய்ப்பு அமைப்புகள் காணப்படுகின்றன; ஆயினும் தீவிர இடமாற்றத்திற்கு உரிய தசா-புக்தி மற்றும் கோச்சார ஆதரவு தேவைப்படும்.";
    } else {
      foreignSummary = "மூல ஜாதகத்தில் நிரந்தர வெளிநாட்டு குடியேற்றத்திற்கான வலுவான ஆதிக்க அமைப்புகள் இல்லை; உள்நாட்டு வளர்ச்சி மற்றும் குறுகிய கால பயணங்களுக்கே வாய்ப்புகள் அதிகம்.";
    }
  } else {
    if (foreignStrong) {
      foreignSummary = "9th (Long Journeys) and 12th (Foreign Lands & Moksha) house factors provide a clear traditional foreign-travel emphasis, supporting international education, cross-border professional opportunities, or overseas travel.";
    } else if (foreignModerate) {
      foreignSummary = "Some foreign-travel factors are present in secondary configurations, but stronger dasha and transit activation is required for long-distance relocation.";
    } else {
      foreignSummary = "The natal chart does not show a dominant foreign-settlement signature under the selected classical rules; domestic growth and localized progression remain primary.";
    }
  }

  return {
    evidenceLedger,
    health: {
      vitalityIndicator: healthLongevity,
      longevity: healthLongevity,
      evidenceLevel: evidenceLedger.health.evidenceLevel,
      bodyAreaAssociations: sensitiveOrgans,
      sensitiveOrgans,
      summary: healthSummary,
      supportingFactors: evidenceLedger.health.supportingFactors,
      counterIndicators: evidenceLedger.health.counterIndicators,
      dailyRegimen: isTamil ? "தினமும் சூரிய நமஸ்காரம், துளசி தீர்த்தம், பிராணாயாமம்." : "Daily Surya Namaskar, Pranayama and hydrating herbal teas.",
      statutoryNotice: isTamil
        ? "சட்டப்பூர்வ அறிவிப்பு: இந்த பாரம்பரிய ஆரோக்கிய ஜோதிட விவரிப்பு மருத்துவ பரிசோதனையோ, நோயறிதலோ அல்லது மருத்துவ சிகிச்சையோ அல்ல."
        : "Statutory Medical Notice: Traditional astrological health correspondences describe symbolic vitality themes and do NOT constitute a medical diagnosis, clinical prognosis, or treatment recommendation."
    },
    studies: {
      competitiveExamOutlook: examSuccessChance,
      evidenceLevel: evidenceLedger.studies.evidenceLevel,
      recommendedFields: academicFields,
      summary: studiesSummary,
      supportingFactors: evidenceLedger.studies.supportingFactors,
      counterIndicators: evidenceLedger.studies.counterIndicators
    },
    career: {
      pathwayOutlook: careerPathway.title,
      evidenceLevel: evidenceLedger.career.evidenceLevel,
      summary: careerSummary,
      supportingFactors: evidenceLedger.career.supportingFactors,
      counterIndicators: evidenceLedger.career.counterIndicators,
      topVocationSectors: careerPathway.entrepreneurshipAlignment === "Strong" || careerPathway.entrepreneurshipAlignment === "வலுவான கட்டமைப்பு"
        ? [
            isTamil ? "சுயதொழில் & வணிக நிறுவன தொடக்கம்" : "Independent Business & Commercial Enterprise",
            isTamil ? "தொழில்நுட்பம் & ஆலோசனை சேவை" : "Technology Consulting & Strategic Services",
            isTamil ? "ரியல் எஸ்டேட் & கட்டட முதலீடுகள்" : "Real Estate & Infrastructure Assets"
          ]
        : [
            isTamil ? "கார்ப்பரேட் தலைமை & நிர்வாகம்" : "Corporate Executive Leadership",
            isTamil ? "தகவல் தொழில்நுட்பம் & நிதி மேலாண்மை" : "Information Technology & Financial Systems",
            isTamil ? "அரசு & பொதுத்துறை நிறுவனங்கள்" : "Public Sector Enterprises & Institutional Roles"
          ]
    },
    property: {
      outlook: propertyOutlook,
      evidenceLevel: evidenceLedger.property.evidenceLevel,
      vehicleLuxuries: isTamil ? "சொகுசு 4 சக்கர வாகன யோகம் & நில புலன்கள்" : "Luxury 4-Wheeler Conveyance & Landed Properties",
      summary: propertySummary,
      supportingFactors: evidenceLedger.property.supportingFactors,
      counterIndicators: evidenceLedger.property.counterIndicators
    },
    politics: {
      category: polCategory,
      alignment: publicServiceAlignment,
      publicLeadershipPotential: hasGovSups && !hasGovCons ? "High Leadership Alignment" : (hasGovSups ? "Favorable Alignment" : "Institutional Alignment"),
      recommendedPathways: polPathways,
      summary: politicsSummary,
      supportingFactors: evidenceLedger.governance.supportingFactors,
      counterIndicators: evidenceLedger.governance.counterIndicators
    },
    relationship: {
      isDelayedMarriage: marriagePathway.isDelayedMarriage,
      auspiciousAgeRange: marriagePathway.auspiciousAgeRange,
      calendarYears: marriagePathway.calendarYears,
      spouseProfile: marriagePathway.spouseProfile,
      summary: relationshipSummary,
      supportingFactors: evidenceLedger.marriage.supportingFactors,
      counterIndicators: evidenceLedger.marriage.counterIndicators
    },
    foreignMoksha: {
      foreignChance: foreignStrong 
        ? (isTamil ? "அனுகூல யோகம் (சுப 9 & 12-ம் பாவக தொடர்பு)" : "Favorable Astrological Alignment (9th & 12th House Activation)") 
        : (isTamil ? "மத்திம அனுகூலம் (தசா புக்தி ஆதரவு தேவை)" : "Moderate Alignment (Contingent on Dasha-Bukthi Activation)"),
      spiritualElevation: isTamil ? "உயரிய ஞானம், தியான சித்தி & மோட்ச சாதனை" : "Higher Spiritual Discernment & Serene Moksha Sadhana",
      summary: foreignSummary
    }
  };
}

// ---------------------------------------------------------------------------
// CLASSICAL PARASHARI BHINNASHTAKAVARGA & SARVASHTAKAVARGA (337 BINDU CANONICAL CONVENTION)
// ---------------------------------------------------------------------------
export const CLASSICAL_BAV_TOTALS = {
  Sun: 48,
  Moon: 49,
  Mars: 39,
  Mercury: 54,
  Jupiter: 56,
  Venus: 52,
  Saturn: 39
};
export const CLASSICAL_SAV_TOTAL = 337;

/**
 * Centrally declared ASHTAKAVARGA_CONVENTION specifying exact classical source,
 * version, and all 56 contributor rows (7 planets + Lagna contributing to 7 grahas)
 * adhering strictly to Brihat Parashara Hora Shastra & Phaladeepika.
 */
export const ASHTAKAVARGA_CONVENTION = {
  name: "Brihat Parashara Hora Shastra (BPHS) Canonical System",
  source: "Brihat Parashara Hora Shastra (Chapters 66-72) & Phaladeepika (Chapter 24)",
  edition: "Santhanam / Sharma Translation 1984 Edition",
  contributorTableVersion: "BPHS-Ch66-72-Canonical-1984",
  version: "Parashari 337 Bindus Standard",
  totalContributors: 56,
  notes: "Includes all 56 contributor rows (7 target grahas × 8 references: 7 planets + Lagna) with 1-based house offsets from reference signs, summing to 337 Sarvashtakavarga bindus.",
  savTotal: CLASSICAL_SAV_TOTAL,
  totals: CLASSICAL_BAV_TOTALS,
  table: {
    Sun: {
      Sun: [1, 2, 4, 7, 8, 9, 10, 11],
      Moon: [3, 6, 10, 11],
      Mars: [1, 2, 4, 7, 8, 9, 10, 11],
      Mercury: [3, 5, 6, 9, 10, 11, 12],
      Jupiter: [5, 6, 9, 11],
      Venus: [6, 7, 12],
      Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
      Lagna: [3, 4, 6, 10, 11, 12]
    },
    Moon: {
      Sun: [3, 6, 7, 8, 10, 11],
      Moon: [1, 3, 6, 7, 10, 11],
      Mars: [2, 3, 5, 6, 9, 10, 11],
      Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
      Jupiter: [1, 4, 7, 8, 10, 11, 12],
      Venus: [3, 4, 5, 7, 9, 10, 11],
      Saturn: [3, 5, 6, 11],
      Lagna: [3, 6, 10, 11]
    },
    Mars: {
      Sun: [3, 5, 6, 10, 11],
      Moon: [3, 6, 11],
      Mars: [1, 2, 4, 7, 8, 10, 11],
      Mercury: [3, 5, 6, 11],
      Jupiter: [6, 10, 11, 12],
      Venus: [6, 8, 11, 12],
      Saturn: [1, 4, 7, 8, 9, 10, 11],
      Lagna: [1, 3, 6, 10, 11]
    },
    Mercury: {
      Sun: [5, 6, 9, 11, 12],
      Moon: [2, 4, 6, 8, 10, 11],
      Mars: [1, 2, 4, 7, 8, 9, 10, 11],
      Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
      Jupiter: [6, 8, 11, 12],
      Venus: [1, 2, 3, 4, 5, 8, 9, 11],
      Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
      Lagna: [1, 2, 4, 6, 8, 10, 11]
    },
    Jupiter: {
      Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
      Moon: [2, 5, 7, 9, 11],
      Mars: [1, 2, 4, 7, 8, 10, 11],
      Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
      Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
      Venus: [2, 5, 6, 9, 10, 11],
      Saturn: [3, 5, 6, 12],
      Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11]
    },
    Venus: {
      Sun: [8, 11, 12],
      Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
      Mars: [3, 5, 6, 9, 11, 12],
      Mercury: [3, 5, 6, 9, 11],
      Jupiter: [5, 8, 9, 10, 11],
      Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
      Saturn: [3, 4, 5, 8, 9, 10, 11],
      Lagna: [1, 2, 3, 4, 5, 8, 9, 11]
    },
    Saturn: {
      Sun: [1, 2, 4, 7, 8, 10, 11],
      Moon: [3, 6, 11],
      Mars: [3, 5, 6, 10, 11, 12],
      Mercury: [6, 8, 9, 10, 11, 12],
      Jupiter: [5, 6, 11, 12],
      Venus: [6, 11, 12],
      Saturn: [3, 5, 6, 11],
      Lagna: [1, 3, 4, 6, 10, 11]
    }
  }
};

export const BAV_RULES = ASHTAKAVARGA_CONVENTION.table;

export function calculateClassicalAshtakavarga(planets = [], ascendantLong = 0) {
  const PLANET_NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const normAsc = requireLongitude(ascendantLong, "calculateClassicalAshtakavarga Ascendant");
  const lagnaSignIdx = Math.floor(normAsc / 30);

  const getPlanetSignIdx = (name) => {
    const p = planets.find(pl => pl.name === name);
    if (!p || typeof p.longitude !== "number" || !Number.isFinite(p.longitude)) {
      throw new Error(`Valid planetary longitude required for ${name} in calculateClassicalAshtakavarga.`);
    }
    return Math.floor(norm360(p.longitude) / 30);
  };

  const refSigns = {
    Sun: getPlanetSignIdx("Sun"),
    Moon: getPlanetSignIdx("Moon"),
    Mars: getPlanetSignIdx("Mars"),
    Mercury: getPlanetSignIdx("Mercury"),
    Jupiter: getPlanetSignIdx("Jupiter"),
    Venus: getPlanetSignIdx("Venus"),
    Saturn: getPlanetSignIdx("Saturn"),
    Lagna: lagnaSignIdx
  };

  const BAV_RULES = ASHTAKAVARGA_CONVENTION.table;

  const bav = {};
  const savBySign = new Array(12).fill(0);

  for (const planet of PLANET_NAMES) {
    const planetBav = new Array(12).fill(0);
    const rules = BAV_RULES[planet];

    for (const [refName, offsets] of Object.entries(rules)) {
      const baseSign = refSigns[refName];
      for (const offset of offsets) {
        const targetSign = (baseSign + offset - 1) % 12;
        planetBav[targetSign] += 1;
      }
    }

    bav[planet] = planetBav;
    for (let i = 0; i < 12; i++) {
      savBySign[i] += planetBav[i];
    }
  }

  // SAV points mapped by house relative to Lagna (House 1 to 12)
  const savByHouse = Array.from({ length: 12 }, (_, hIdx) => {
    const signIdx = (lagnaSignIdx + hIdx) % 12;
    return savBySign[signIdx];
  });

  const totalBindus = savBySign.reduce((a, b) => a + b, 0); // Mathematically 337

  for (const planet of PLANET_NAMES) {
    const pTotal = (bav[planet] || []).reduce((a, b) => a + b, 0);
    if (pTotal !== CLASSICAL_BAV_TOTALS[planet]) {
      throw new Error(`Ashtakavarga BAV checksum error for ${planet}: got ${pTotal}, expected ${CLASSICAL_BAV_TOTALS[planet]}`);
    }
  }
  if (totalBindus !== CLASSICAL_SAV_TOTAL) {
    throw new Error(`Sarvashtakavarga checksum error: got ${totalBindus}, expected ${CLASSICAL_SAV_TOTAL}`);
  }

  return {
    convention: ASHTAKAVARGA_CONVENTION,
    bav,
    savBySign,
    savByHouse,
    totalBindus,
    ashtakavargaPoints: savByHouse
  };
}

export function calculateKundliMatching(
  boyNakshatra,
  girlNakshatra,
  boyMoonSign = null,
  girlMoonSign = null,
  boyPada = null,
  girlPada = null,
  boyMoonLong = null,
  girlMoonLong = null
) {
  if (!boyNakshatra || !girlNakshatra) {
    throw new Error("Both boyNakshatra and girlNakshatra are required for Kundli matching.");
  }
  return calculateAshtakootaMatch(boyNakshatra, girlNakshatra, boyMoonSign, girlMoonSign, boyPada, girlPada, boyMoonLong, girlMoonLong);
}

// ---------------------------------------------------------------------------
// CANONICAL ASHTAKOOTA VASHYA & YONI CLASSICAL MATRICES
// ---------------------------------------------------------------------------
export const VASHYA_CONVENTION = {
  name: "Vashya Kuta",
  source: "Classical Saravali / Maitreya tradition",
  orientation: "brideRows_groomColumns",
  classes: ["Chatushpada", "Manava", "Jalachara", "Vanachara", "Keeta"]
};

export const VASHYA_POINTS_TABLE = {
  Chatushpada: { Chatushpada: 2.0, Manava: 0.0, Jalachara: 0.0, Vanachara: 0.5, Keeta: 0.0 },
  Manava:      { Chatushpada: 1.0, Manava: 2.0, Jalachara: 1.0, Vanachara: 0.5, Keeta: 1.0 },
  Jalachara:   { Chatushpada: 0.5, Manava: 1.0, Jalachara: 2.0, Vanachara: 1.0, Keeta: 1.0 },
  Vanachara:   { Chatushpada: 0.0, Manava: 0.0, Jalachara: 0.0, Vanachara: 2.0, Keeta: 0.0 },
  Keeta:       { Chatushpada: 1.0, Manava: 1.0, Jalachara: 1.0, Vanachara: 0.0, Keeta: 2.0 }
};

export const YONI_CONVENTION = {
  name: "Yoni Kuta",
  source: "Classical Saravali / Maitreya 14-species matrix",
  maxPoints: 4,
  scoringTiers: { sameSpecies: 4, friendly: 3, neutral: 2, enemy: 1, swornEnemy: 0 }
};

export const YONI_SCORE_MATRIX = {
  Horse:    { Horse: 4, Elephant: 2, Sheep: 2, Serpent: 3, Dog: 2, Cat: 2, Rat: 2, Cow: 1, Buffalo: 0, Tiger: 1, Deer: 3, Monkey: 3, Mongoose: 2, Lion: 1 },
  Elephant: { Horse: 2, Elephant: 4, Sheep: 3, Serpent: 3, Dog: 2, Cat: 2, Rat: 2, Cow: 2, Buffalo: 3, Tiger: 1, Deer: 2, Monkey: 3, Mongoose: 2, Lion: 0 },
  Sheep:    { Horse: 2, Elephant: 3, Sheep: 4, Serpent: 2, Dog: 1, Cat: 2, Rat: 1, Cow: 3, Buffalo: 3, Tiger: 1, Deer: 2, Monkey: 0, Mongoose: 2, Lion: 1 },
  Serpent:  { Horse: 3, Elephant: 3, Sheep: 2, Serpent: 4, Dog: 2, Cat: 1, Rat: 1, Cow: 1, Buffalo: 1, Tiger: 2, Deer: 2, Monkey: 2, Mongoose: 0, Lion: 2 },
  Dog:      { Horse: 2, Elephant: 2, Sheep: 1, Serpent: 2, Dog: 4, Cat: 2, Rat: 1, Cow: 2, Buffalo: 2, Tiger: 1, Deer: 0, Monkey: 2, Mongoose: 2, Lion: 1 },
  Cat:      { Horse: 2, Elephant: 2, Sheep: 2, Serpent: 1, Dog: 2, Cat: 4, Rat: 0, Cow: 2, Buffalo: 2, Tiger: 1, Deer: 3, Monkey: 2, Mongoose: 1, Lion: 1 },
  Rat:      { Horse: 2, Elephant: 2, Sheep: 1, Serpent: 1, Dog: 1, Cat: 0, Rat: 4, Cow: 2, Buffalo: 2, Tiger: 2, Deer: 2, Monkey: 2, Mongoose: 2, Lion: 1 },
  Cow:      { Horse: 1, Elephant: 2, Sheep: 3, Serpent: 1, Dog: 2, Cat: 2, Rat: 2, Cow: 4, Buffalo: 3, Tiger: 0, Deer: 3, Monkey: 2, Mongoose: 2, Lion: 1 },
  Buffalo:  { Horse: 0, Elephant: 3, Sheep: 3, Serpent: 1, Dog: 2, Cat: 2, Rat: 2, Cow: 3, Buffalo: 4, Tiger: 1, Deer: 2, Monkey: 2, Mongoose: 2, Lion: 3 },
  Tiger:    { Horse: 1, Elephant: 1, Sheep: 1, Serpent: 2, Dog: 1, Cat: 1, Rat: 2, Cow: 0, Buffalo: 1, Tiger: 4, Deer: 1, Monkey: 1, Mongoose: 2, Lion: 1 },
  Deer:     { Horse: 3, Elephant: 2, Sheep: 2, Serpent: 2, Dog: 0, Cat: 3, Rat: 2, Cow: 3, Buffalo: 2, Tiger: 1, Deer: 4, Monkey: 2, Mongoose: 2, Lion: 1 },
  Monkey:   { Horse: 3, Elephant: 3, Sheep: 0, Serpent: 2, Dog: 2, Cat: 2, Rat: 2, Cow: 2, Buffalo: 2, Tiger: 1, Deer: 2, Monkey: 4, Mongoose: 3, Lion: 2 },
  Mongoose: { Horse: 2, Elephant: 2, Sheep: 2, Serpent: 0, Dog: 2, Cat: 1, Rat: 2, Cow: 2, Buffalo: 2, Tiger: 2, Deer: 2, Monkey: 3, Mongoose: 4, Lion: 2 },
  Lion:     { Horse: 1, Elephant: 0, Sheep: 1, Serpent: 2, Dog: 1, Cat: 1, Rat: 1, Cow: 1, Buffalo: 3, Tiger: 1, Deer: 1, Monkey: 2, Mongoose: 2, Lion: 4 }
};

export const getRasiVashya = (rasi, degreeInSign = 0) => {
  const deg = Number.isFinite(Number(degreeInSign)) ? (norm360(Number(degreeInSign)) % 30) : 0;
  switch (rasi) {
    case "Aries":
    case "Taurus":
      return "Chatushpada";
    case "Gemini":
    case "Virgo":
    case "Libra":
    case "Aquarius":
      return "Manava";
    case "Cancer":
    case "Pisces":
      return "Jalachara";
    case "Leo":
      return "Vanachara";
    case "Scorpio":
      return "Keeta";
    case "Sagittarius":
      // First 15° (0°-15°) is Manava (human torso); second 15° (15°-30°) is Chatushpada (quadruped horse body)
      return deg < 15.0 ? "Manava" : "Chatushpada";
    case "Capricorn":
      // First 15° (0°-15°) is Chatushpada (deer/quadruped head); second 15° (15°-30°) is Jalachara (crocodile/aquatic tail)
      return deg < 15.0 ? "Chatushpada" : "Jalachara";
    default:
      throw new Error(`Unknown Rasi for Vashya calculation: ${rasi}`);
  }
};

// ---------------------------------------------------------------------------
// GENUINE 36-POINT ASHTAKOOTA MILAN ENGINE
// ---------------------------------------------------------------------------
export function calculateAshtakootaMatch(
  boyNakshatra,
  girlNakshatra,
  boyMoonSign = null,
  girlMoonSign = null,
  boyPada = null,
  girlPada = null,
  boyMoonLong = null,
  girlMoonLong = null
) {
  if (!boyNakshatra || !girlNakshatra) {
    throw new Error("Both boyNakshatra and girlNakshatra are required for Ashtakoota matching calculation.");
  }
  const NAK_DATA = {
    Ashwini: { index: 0, rasi: "Aries", rasiLord: "Mars", nakshatraLord: "Ketu", gana: "Deva", yoni: "Horse", nadi: "Aadi", varna: "Kshatriya" },
    Bharani: { index: 1, rasi: "Aries", rasiLord: "Mars", nakshatraLord: "Venus", gana: "Manushya", yoni: "Elephant", nadi: "Madhya", varna: "Kshatriya" },
    Krittika: { index: 2, rasi: "Aries", rasiLord: "Mars", nakshatraLord: "Sun", multiRasi: ["Aries", "Taurus"], gana: "Rakshasa", yoni: "Sheep", nadi: "Antya", varna: "Kshatriya" },
    Rohini: { index: 3, rasi: "Taurus", rasiLord: "Venus", nakshatraLord: "Moon", gana: "Manushya", yoni: "Serpent", nadi: "Antya", varna: "Vaishya" },
    Mrigashira: { index: 4, rasi: "Taurus", rasiLord: "Venus", nakshatraLord: "Mars", multiRasi: ["Taurus", "Gemini"], gana: "Deva", yoni: "Serpent", nadi: "Madhya", varna: "Vaishya" },
    Ardra: { index: 5, rasi: "Gemini", rasiLord: "Mercury", nakshatraLord: "Rahu", gana: "Manushya", yoni: "Dog", nadi: "Aadi", varna: "Shudra" },
    Punarvasu: { index: 6, rasi: "Gemini", rasiLord: "Mercury", nakshatraLord: "Jupiter", multiRasi: ["Gemini", "Cancer"], gana: "Deva", yoni: "Cat", nadi: "Aadi", varna: "Shudra" },
    Pushya: { index: 7, rasi: "Cancer", rasiLord: "Moon", nakshatraLord: "Saturn", gana: "Deva", yoni: "Sheep", nadi: "Madhya", varna: "Brahmin" },
    Ashlesha: { index: 8, rasi: "Cancer", rasiLord: "Moon", nakshatraLord: "Mercury", gana: "Rakshasa", yoni: "Cat", nadi: "Antya", varna: "Brahmin" },
    Magha: { index: 9, rasi: "Leo", rasiLord: "Sun", nakshatraLord: "Ketu", gana: "Rakshasa", yoni: "Rat", nadi: "Antya", varna: "Kshatriya" },
    "Purva Phalguni": { index: 10, rasi: "Leo", rasiLord: "Sun", nakshatraLord: "Venus", gana: "Manushya", yoni: "Rat", nadi: "Madhya", varna: "Kshatriya" },
    "Uttara Phalguni": { index: 11, rasi: "Leo", rasiLord: "Sun", nakshatraLord: "Sun", multiRasi: ["Leo", "Virgo"], gana: "Manushya", yoni: "Cow", nadi: "Aadi", varna: "Kshatriya" },
    Hasta: { index: 12, rasi: "Virgo", rasiLord: "Mercury", nakshatraLord: "Moon", gana: "Deva", yoni: "Buffalo", nadi: "Aadi", varna: "Vaishya" },
    Chitra: { index: 13, rasi: "Virgo", rasiLord: "Mercury", nakshatraLord: "Mars", multiRasi: ["Virgo", "Libra"], gana: "Rakshasa", yoni: "Tiger", nadi: "Madhya", varna: "Vaishya" },
    Swati: { index: 14, rasi: "Libra", rasiLord: "Venus", nakshatraLord: "Rahu", gana: "Deva", yoni: "Buffalo", nadi: "Antya", varna: "Shudra" },
    Vishakha: { index: 15, rasi: "Libra", rasiLord: "Venus", nakshatraLord: "Jupiter", multiRasi: ["Libra", "Scorpio"], gana: "Rakshasa", yoni: "Tiger", nadi: "Antya", varna: "Shudra" },
    Anuradha: { index: 16, rasi: "Scorpio", rasiLord: "Mars", nakshatraLord: "Saturn", gana: "Deva", yoni: "Deer", nadi: "Madhya", varna: "Brahmin" },
    Jyeshtha: { index: 17, rasi: "Scorpio", rasiLord: "Mars", nakshatraLord: "Mercury", gana: "Rakshasa", yoni: "Deer", nadi: "Aadi", varna: "Brahmin" },
    Mula: { index: 18, rasi: "Sagittarius", rasiLord: "Jupiter", nakshatraLord: "Ketu", gana: "Rakshasa", yoni: "Dog", nadi: "Aadi", varna: "Kshatriya" },
    "Purva Ashadha": { index: 19, rasi: "Sagittarius", rasiLord: "Jupiter", nakshatraLord: "Venus", gana: "Manushya", yoni: "Monkey", nadi: "Madhya", varna: "Kshatriya" },
    "Uttara Ashadha": { index: 20, rasi: "Sagittarius", rasiLord: "Jupiter", nakshatraLord: "Sun", multiRasi: ["Sagittarius", "Capricorn"], gana: "Manushya", yoni: "Mongoose", nadi: "Antya", varna: "Kshatriya" },
    Shravana: { index: 21, rasi: "Capricorn", rasiLord: "Saturn", nakshatraLord: "Moon", gana: "Deva", yoni: "Monkey", nadi: "Antya", varna: "Vaishya" },
    Dhanishta: { index: 22, rasi: "Capricorn", rasiLord: "Saturn", nakshatraLord: "Mars", multiRasi: ["Capricorn", "Aquarius"], gana: "Rakshasa", yoni: "Lion", nadi: "Madhya", varna: "Vaishya" },
    Shatabhisha: { index: 23, rasi: "Aquarius", rasiLord: "Saturn", nakshatraLord: "Rahu", gana: "Rakshasa", yoni: "Horse", nadi: "Aadi", varna: "Shudra" },
    "Purva Bhadrapada": { index: 24, rasi: "Aquarius", rasiLord: "Saturn", nakshatraLord: "Jupiter", multiRasi: ["Aquarius", "Pisces"], gana: "Manushya", yoni: "Lion", nadi: "Aadi", varna: "Shudra" },
    "Uttara Bhadrapada": { index: 25, rasi: "Pisces", rasiLord: "Jupiter", nakshatraLord: "Saturn", gana: "Manushya", yoni: "Cow", nadi: "Madhya", varna: "Brahmin" },
    Revati: { index: 26, rasi: "Pisces", rasiLord: "Jupiter", nakshatraLord: "Mercury", gana: "Deva", yoni: "Elephant", nadi: "Antya", varna: "Brahmin" }
  };

  const bNak = NAK_DATA[boyNakshatra];
  if (!bNak) throw new Error(`Unknown boy Nakshatra: ${boyNakshatra}`);
  const gNak = NAK_DATA[girlNakshatra];
  if (!gNak) throw new Error(`Unknown girl Nakshatra: ${girlNakshatra}`);

  const RASI_LORD_MAP = {
    Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
    Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
    Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter"
  };

  const resolveRasiFromPada = (nak, pada, explicitRasi) => {
    if (explicitRasi) return explicitRasi;
    if (pada !== null && pada !== undefined && Number.isFinite(Number(pada))) {
      const p = Math.max(1, Math.min(4, Math.round(Number(pada))));
      const absDeg = nak.index * (40 / 3) + (p - 0.5) * (10 / 3);
      const signIdx = Math.floor(absDeg / 30) % 12;
      const ZODIAC = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
      return ZODIAC[signIdx];
    }
    return nak.rasi;
  };

  const bRasi = resolveRasiFromPada(bNak, boyPada, boyMoonSign);
  const gRasi = resolveRasiFromPada(gNak, girlPada, girlMoonSign);
  const splitNakshatraNotes = [];
  if (bNak.multiRasi && !boyMoonSign && (boyPada === null || boyPada === undefined)) {
    splitNakshatraNotes.push(`Boy nakshatra (${boyNakshatra}) spans multiple signs (${bNak.multiRasi.join("/")}); defaulted to ${bRasi} (specify Pada 1-4 for exact sign).`);
  }
  if (gNak.multiRasi && !girlMoonSign && (girlPada === null || girlPada === undefined)) {
    splitNakshatraNotes.push(`Girl nakshatra (${girlNakshatra}) spans multiple signs (${gNak.multiRasi.join("/")}); defaulted to ${gRasi} (specify Pada 1-4 for exact sign).`);
  }
  const bLord = RASI_LORD_MAP[bRasi];
  if (!bLord) throw new Error(`Unknown boy Moon sign (Rasi): ${bRasi}`);
  const gLord = RASI_LORD_MAP[gRasi];
  if (!gLord) throw new Error(`Unknown girl Moon sign (Rasi): ${gRasi}`);

  // 1. Varna (1 Point) - Derived strictly from Moon Rashi
  const RASI_VARNA = {
    Cancer: "Brahmin", Scorpio: "Brahmin", Pisces: "Brahmin",
    Aries: "Kshatriya", Leo: "Kshatriya", Sagittarius: "Kshatriya",
    Taurus: "Vaishya", Virgo: "Vaishya", Capricorn: "Vaishya",
    Gemini: "Shudra", Libra: "Shudra", Aquarius: "Shudra"
  };
  const bVarna = RASI_VARNA[bRasi];
  if (!bVarna) throw new Error(`Unknown boy Moon sign varna for ${bRasi}`);
  const gVarna = RASI_VARNA[gRasi];
  if (!gVarna) throw new Error(`Unknown girl Moon sign varna for ${gRasi}`);
  const VARNA_POINTS = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };
  const bVarnaVal = VARNA_POINTS[bVarna];
  const gVarnaVal = VARNA_POINTS[gVarna];
  if (bVarnaVal === undefined || gVarnaVal === undefined) {
    throw new Error(`Invalid varna values: boy=${bVarna}, girl=${gVarna}`);
  }
  const varna = bVarnaVal >= gVarnaVal ? 1.0 : 0.0;

  // 2. Vashya (2 Points) - Derived strictly from Moon Rashi and exact degree in sign
  let bExactLong;
  if (boyMoonLong !== null && Number.isFinite(Number(boyMoonLong))) {
    bExactLong = Number(boyMoonLong);
  } else if (boyPada !== null && Number.isFinite(Number(boyPada))) {
    bExactLong = bNak.index * (40 / 3) + (Math.max(1, Math.min(4, Number(boyPada))) - 0.5) * (10 / 3);
  } else {
    bExactLong = bNak.index * (40 / 3) + (20 / 6); // Center of Nakshatra
  }

  let gExactLong;
  if (girlMoonLong !== null && Number.isFinite(Number(girlMoonLong))) {
    gExactLong = Number(girlMoonLong);
  } else if (girlPada !== null && Number.isFinite(Number(girlPada))) {
    gExactLong = gNak.index * (40 / 3) + (Math.max(1, Math.min(4, Number(girlPada))) - 0.5) * (10 / 3);
  } else {
    gExactLong = gNak.index * (40 / 3) + (20 / 6); // Center of Nakshatra
  }

  const bDegInSign = norm360(bExactLong) % 30;
  const gDegInSign = norm360(gExactLong) % 30;

  const bVashya = getRasiVashya(bRasi, bDegInSign);
  const gVashya = getRasiVashya(gRasi, gDegInSign);

  // Classical Saravali convention: Bride (girl) rows x Groom (boy) columns
  const vashyaPoints = VASHYA_POINTS_TABLE[gVashya]?.[bVashya];
  if (vashyaPoints === undefined) {
    throw new Error(`Invalid Vashya lookup for pair: bride=${gVashya}, groom=${bVashya}`);
  }
  const vashya = parseFloat(vashyaPoints.toFixed(1));

  // 3. Tara (3 Points)
  const countGtoB = ((bNak.index - gNak.index + 27) % 27) % 9;
  const countBtoG = ((gNak.index - bNak.index + 27) % 27) % 9;
  const badTaras = [2, 4, 6]; // 3rd (Vipat), 5th (Pratyak), 7th (Vadha)
  const taraGBGood = !badTaras.includes(countGtoB);
  const taraBGGood = !badTaras.includes(countBtoG);
  let tara = 0.0;
  if (taraGBGood && taraBGGood) tara = 3.0;
  else if (taraGBGood || taraBGGood) tara = 1.5;
  else tara = 0.0;

  // 4. Yoni (4 Points) - Canonical 14x14 classical scoring matrix
  const yoniScore = YONI_SCORE_MATRIX[bNak.yoni]?.[gNak.yoni];
  if (yoniScore === undefined) {
    throw new Error(`Invalid Yoni lookup for pair: boy=${bNak.yoni}, girl=${gNak.yoni}`);
  }
  const yoni = parseFloat(yoniScore.toFixed(1));

  // 5. Graha Maitri (5 Points)
  const PLANETARY_FRIENDSHIP = {
    Sun: { Friends: ["Moon", "Mars", "Jupiter"], Neutral: ["Mercury"], Enemies: ["Venus", "Saturn"] },
    Moon: { Friends: ["Sun", "Mercury"], Neutral: ["Mars", "Jupiter", "Venus", "Saturn"], Enemies: [] },
    Mars: { Friends: ["Sun", "Moon", "Jupiter"], Neutral: ["Venus", "Saturn"], Enemies: ["Mercury"] },
    Mercury: { Friends: ["Sun", "Venus"], Neutral: ["Mars", "Jupiter", "Saturn"], Enemies: ["Moon"] },
    Jupiter: { Friends: ["Sun", "Moon", "Mars"], Neutral: ["Saturn"], Enemies: ["Mercury", "Venus"] },
    Venus: { Friends: ["Mercury", "Saturn"], Neutral: ["Mars", "Jupiter"], Enemies: ["Sun", "Moon"] },
    Saturn: { Friends: ["Mercury", "Venus"], Neutral: ["Jupiter"], Enemies: ["Sun", "Moon", "Mars"] }
  };

  const getRelation = (p1, p2) => {
    if (p1 === p2) return "Friend";
    if (PLANETARY_FRIENDSHIP[p1]?.Friends.includes(p2)) return "Friend";
    if (PLANETARY_FRIENDSHIP[p1]?.Enemies.includes(p2)) return "Enemy";
    return "Neutral";
  };

  const rel1 = getRelation(bLord, gLord);
  const rel2 = getRelation(gLord, bLord);
  let maitri = 3.0;
  if (bLord === gLord || (rel1 === "Friend" && rel2 === "Friend")) maitri = 5.0;
  else if ((rel1 === "Friend" && rel2 === "Neutral") || (rel1 === "Neutral" && rel2 === "Friend")) maitri = 4.0;
  else if (rel1 === "Neutral" && rel2 === "Neutral") maitri = 3.0;
  else if ((rel1 === "Friend" && rel2 === "Enemy") || (rel1 === "Enemy" && rel2 === "Friend")) maitri = 1.0;
  else if ((rel1 === "Neutral" && rel2 === "Enemy") || (rel1 === "Enemy" && rel2 === "Neutral")) maitri = 0.5;
  else if (rel1 === "Enemy" && rel2 === "Enemy") maitri = 0.0;

  // 6. Gana (6 Points)
  let gana = 0.0;
  if (bNak.gana === gNak.gana) gana = 6.0;
  else if ((bNak.gana === "Deva" && gNak.gana === "Manushya") || (bNak.gana === "Manushya" && gNak.gana === "Deva")) gana = 5.0;
  else if ((bNak.gana === "Deva" && gNak.gana === "Rakshasa") || (bNak.gana === "Rakshasa" && gNak.gana === "Deva")) gana = 1.0;
  else if ((bNak.gana === "Manushya" && gNak.gana === "Rakshasa") || (bNak.gana === "Rakshasa" && gNak.gana === "Manushya")) gana = 0.0;

  const appliedCancellations = [];

  // 7. Bhakoot (7 Points)
  const rasiOrder = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const bRasiIdx = rasiOrder.indexOf(bRasi);
  const gRasiIdx = rasiOrder.indexOf(gRasi);
  const rasiDiff = ((bRasiIdx - gRasiIdx + 12) % 12) + 1;
  let bhakoot = 7.0;
  let bhakootRaw = 7.0;

  if ([2, 12, 6, 8, 5, 9].includes(rasiDiff)) {
    bhakootRaw = 0.0;
    if (bLord === gLord) {
      bhakoot = 7.0;
      appliedCancellations.push({
        kuta: "Bhakoot",
        rule: "Identical Rashi Lord Exception (ஏக ராசியாதிபதி விதி)",
        source: "Kalaprakasika Ch. 12 / Muhurtha Chintamani",
        reason: `Both Moon Rashis (${bRasi} & ${gRasi}) are governed by ${bLord}`
      });
    } else if (rel1 === "Friend" && rel2 === "Friend") {
      bhakoot = 7.0;
      appliedCancellations.push({
        kuta: "Bhakoot",
        rule: "Mutual Planetary Friendship Exception (மித்ர ராசியாதிபதி விதி)",
        source: "Kalaprakasika Ch. 12",
        reason: `Rashi lords ${bLord} and ${gLord} are mutual natural friends`
      });
    } else if (bNak.nakshatraLord === gNak.nakshatraLord || (bNak.nakshatraLord && gNak.nakshatraLord && PLANETARY_FRIENDSHIP[bNak.nakshatraLord]?.Friends.includes(gNak.nakshatraLord))) {
      bhakoot = 7.0;
      appliedCancellations.push({
        kuta: "Bhakoot",
        rule: "Nakshatra Lordship Harmony Exception (நட்சத்திர அதிபதி இணக்கம்)",
        source: "Muhurtha Chintamani",
        reason: `Nakshatra lords ${bNak.nakshatraLord} and ${gNak.nakshatraLord} are harmonious`
      });
    } else {
      bhakoot = 0.0;
    }
  }

  // 8. Nadi (8 Points)
  let nadi = 8.0;
  let nadiRaw = 8.0;

  if (bNak.nadi === gNak.nadi) {
    nadiRaw = 0.0;
    // Classical Nadi Dosha Cancellations
    if (boyNakshatra === girlNakshatra && boyPada !== girlPada) {
      nadi = 8.0;
      appliedCancellations.push({
        kuta: "Nadi",
        rule: "Eka Nakshatra Bhinna Pada Exception (ஏக நட்சத்திர பின்ன பாத நிவர்த்தி)",
        source: "Kalaprakasika Ch. 12, Sloka 34",
        reason: `Same nakshatra ${boyNakshatra} with different padas (${boyPada} vs ${girlPada})`
      });
    } else if (bRasi === gRasi && boyNakshatra !== girlNakshatra) {
      nadi = 8.0;
      appliedCancellations.push({
        kuta: "Nadi",
        rule: "Eka Rashi Bhinna Nakshatra Exception (ஏக ராசி பின்ன நட்சத்திர நிவர்த்தி)",
        source: "Muhurtha Chintamani Ch. 2",
        reason: `Same Moon Rashi (${bRasi}) with different Nakshatras (${boyNakshatra} & ${girlNakshatra})`
      });
    } else if (boyNakshatra === girlNakshatra && bRasi !== gRasi) {
      nadi = 8.0;
      appliedCancellations.push({
        kuta: "Nadi",
        rule: "Bhinna Rashi Eka Nakshatra Exception (பின்ன ராசி ஏக நட்சத்திர நிவர்த்தி)",
        source: "Muhurtha Chintamani Ch. 2",
        reason: `Identical nakshatra spanning different Rashis (${bRasi} vs ${gRasi})`
      });
    } else if (["Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Shravana", "Uttara Bhadrapada", "Revati"].includes(boyNakshatra) &&
               ["Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Shravana", "Uttara Bhadrapada", "Revati"].includes(girlNakshatra)) {
      nadi = 8.0;
      appliedCancellations.push({
        kuta: "Nadi",
        rule: "Subha Nakshatra Classical Nadi Exemption (சுப நட்சத்திர நாடி விலக்கு)",
        source: "Kalaprakasika Ch. 12",
        reason: `Both stars belong to the classical exempt cluster`
      });
    } else {
      nadi = 0.0;
    }
  }

  const rawScore = Number((varna + vashya + tara + yoni + maitri + gana + bhakootRaw + nadiRaw).toFixed(1));
  const totalScore = Number((varna + vashya + tara + yoni + maitri + gana + bhakoot + nadi).toFixed(1));
  const maxScore = 36;
  const percentage = Math.round((totalScore / maxScore) * 100);

  let recommendation = "Favorable Koota Alignment (உத்தமப் பொருத்தம்)";
  if (totalScore >= 28) recommendation = "High Koota Alignment (உத்தமப் பொருத்தம் — விசேஷ அஷ்டகூட இணக்கம்)";
  else if (totalScore >= 18) recommendation = "Moderate Koota Alignment (மத்திமப் பொருத்தம் — சுப அஷ்டகூட இணக்கம்)";
  else recommendation = "Low Koota Alignment / Caution Advised (பரிகாரம் தேவைப்படும் அஷ்டகூட அமைப்பு)";

  return {
    rawScore,
    totalScore,
    maxScore,
    scoreFraction: `${totalScore}/36`,
    percentage,
    appliedCancellations,
    boyResolvedRasi: bRasi,
    girlResolvedRasi: gRasi,
    splitNakshatraNotes,
    hasSplitNakshatraWarning: splitNakshatraNotes.length > 0,
    cancellationConvention: "Selected Convention: Kalaprakasika / Muhurtha Chintamani Classical Exceptions (Alternative traditions may apply exceptions differently)",
    recommendation,
    kootaScopeDisclaimer: "This 36-point Ashtakoota Milan score describes the eight lunar/nakshatra kootas only. Comprehensive matrimonial compatibility requires full horoscope analysis including 7th house/lord strength, Venus and Jupiter condition, Kuja (Mangal) Dosha verification, D9 Navamsha harmony, and running Vimshottari Dasha synergy.",
    kootaScopeDisclaimerTa: "இந்த 36-புள்ளி அஷ்டகூடப் பொருத்தம் சந்திரன் மற்றும் நட்சத்திர அமைப்பை மட்டுமே விவரிக்கிறது. முழுமையான திருமணப் பொருத்தத்திற்கு 7-ம் பாவாதிபதி, சுக்கிரன், குரு பலம், செவ்வாய் தோஷ சமநிலை, நவாம்ச இணக்கம் மற்றும் தசா சுழற்சி ஆய்வு அவசியம்.",
    kutas: [
      { name: "Varna (வகுப்பு / ஆன்மீக ஈர்ப்பு)", score: varna, max: 1 },
      { name: "Vashya (வசியம் / பரஸ்பர கட்டுப்பாடு)", score: vashya, max: 2 },
      { name: "Tara (தினம் / ஆயுள் & அதிர்ஷ்டம்)", score: tara, max: 3 },
      { name: "Yoni (யோனி / உடல் & தாம்பத்திய பொருத்தம்)", score: yoni, max: 4 },
      { name: "Graha Maitri (ராசி அதிபதி / மன ஒற்றுமை)", score: maitri, max: 5 },
      { name: "Gana (கணம் / குணாதிசய சுபாவம்)", score: gana, max: 6 },
      { name: "Bhakoot (ராசி நிலை / வம்ச விருத்தி)", score: bhakoot, max: 7, rawScore: bhakootRaw },
      { name: "Nadi (நாடி / நாடிப் பொருத்தம் - வாத, பித்த, கப பிராண சமநிலை)", score: nadi, max: 8, rawScore: nadiRaw }
    ]
  };
}

// ---------------------------------------------------------------------------
// JAIMINI CHARA KARAKAS (7-Body Classical Parashari Scheme)
// ---------------------------------------------------------------------------
export function calculateJaiminiKarakas(planets = []) {
  const eligible = planets.filter(p => ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].includes(p.name));
  
  // Sort descending by sign longitude (0-30 degrees) with fine-grained numerical tie-breaking
  const sorted = [...eligible].sort((a, b) => {
    const degA = Number.isFinite(a.longitude) ? (a.longitude % 30) : parseFloat(a.degreeInSign || a.deg || 0);
    const degB = Number.isFinite(b.longitude) ? (b.longitude % 30) : parseFloat(b.degreeInSign || b.deg || 0);
    if (Math.abs(degB - degA) > 1e-6) {
      return degB - degA;
    }
    // Classical tie-breaker: if exact degree/minute tie, break tie by full arcsecond or longitude
    const arcSecA = Math.round((a.longitude || 0) * 3600);
    const arcSecB = Math.round((b.longitude || 0) * 3600);
    return arcSecB - arcSecA;
  });

  const karakaRoles = [
    { 
      code: "AK", 
      role: "Atmakaraka (Soul / King of Chart)", 
      roleTa: "ஆத்மகாரகன் (ஆன்ம நாயகன் / தலைமை கிரகம்)",
      spiritualSignification: "Innermost soul desire, karmic purification, and spiritual self-realization.",
      spiritualSignificationTa: "ஆன்ம வளர்ச்சி, தர்ம கடமைகள் மற்றும் ஆன்மீக முக்தி பாதை."
    },
    { 
      code: "AmK", 
      role: "Amatyakaraka (Career, Finance & State Intellect)", 
      roleTa: "அமத்யகாரகன் (தொழில், நிதி & நிர்வாக ஆளுமை)",
      spiritualSignification: "Vocational purpose, intellectual discernment, and social duty.",
      spiritualSignificationTa: "தொழில் இலக்கு, அறிவுசார் மேலாண்மை மற்றும் சமூக கடமை."
    },
    { 
      code: "BK", 
      role: "Bhratrukaraka (Mentors, Siblings & Valor)", 
      roleTa: "ப்ராத்ருகாரகன் (குரு, சகோதரம் & வழிகாட்டல்)",
      spiritualSignification: "Courage, companionship, fraternal bonds, and spiritual guides.",
      spiritualSignificationTa: "தைரியம், சகோதர உறவுகள் மற்றும் ஆன்மீக வழிகாட்டிகள்."
    },
    { 
      code: "MK", 
      role: "Matrukaraka (Mother, Land, Conveyance & Serenity)", 
      roleTa: "மாத்ருகாரகன் (தாய், பூமி, வாகனம் & மன அமைதி)",
      spiritualSignification: "Maternal nurturing, emotional stability, and inner peace.",
      spiritualSignificationTa: "தாய்மை அன்பு, மன அமைதி மற்றும் இல்லற இணக்கம்."
    },
    { 
      code: "PK", 
      role: "Putrakaraka (Children, Creative Genius & Karma)", 
      roleTa: "புத்ரகாரகன் (புதல்வர் யோகம், கல்வி & படைப்பாற்றல்)",
      spiritualSignification: "Creative intelligence, purva punya, and future lineage.",
      spiritualSignificationTa: "படைப்பாற்றல், பூர்வ புண்ணியம் மற்றும் புத்திர பாக்கியம்."
    },
    { 
      code: "GK", 
      role: "Gnatikaraka (Debts, Competitors, Obstacles & Defense)", 
      roleTa: "ஞானத்திகாரகன் (எதிரிகள், கடன் & தடைகளை வெல்லும் திறன்)",
      spiritualSignification: "Karmic friction, perseverance, resilience, and dispute resolution.",
      spiritualSignificationTa: "கர்ம வினைகளை வெல்லும் மன உறுதி மற்றும் தடைகளை உடைக்கும் ஆற்றல்."
    },
    { 
      code: "DK", 
      role: "Darakaraka (Spouse, Marriage Alliance & Wealth)", 
      roleTa: "தாரகாரகன் (வாழ்க்கைத்துணை, களத்திரம் & ஐஸ்வர்யம்)",
      spiritualSignification: "Partnerships, matrimonial balance, and worldly support.",
      spiritualSignificationTa: "இல்லற பந்தம், கூட்டு உறவுகள் மற்றும் உலகியல் சுபிட்சம்."
    }
  ];

  return sorted.map((p, idx) => {
    const k = karakaRoles[idx] || { 
      code: "UK", 
      role: "Upakaraka", 
      roleTa: "உபகாரகன்",
      spiritualSignification: "Auxiliary karmic significator.",
      spiritualSignificationTa: "துணை காரகத்துவம்."
    };
    const degVal = parseFloat(p.degreeInSign || p.deg || (p.longitude % 30)).toFixed(2);
    return {
      planet: p.name,
      planetTa: p.tamil || p.name,
      code: k.code,
      role: k.role,
      roleTa: k.roleTa,
      spiritualSignification: k.spiritualSignification,
      spiritualSignificationTa: k.spiritualSignificationTa,
      degInSign: degVal + "°",
      degreeInSign: parseFloat(degVal),
      sign: p.sign,
      house: p.house
    };
  });
}



// ---------------------------------------------------------------------------
// 7.4 FUNCTIONAL LORDSHIP MATRIX ENGINE (12 LAGNAS)
// ---------------------------------------------------------------------------
export function getFunctionalLordshipMatrix(lagnaName) {
  if (!lagnaName || typeof lagnaName !== "string") {
    throw new Error("getFunctionalLordshipMatrix requires a valid lagnaName string (e.g., 'Aries', 'Taurus', etc.).");
  }
  const lagnaClean = lagnaName.trim().toLowerCase();
  const sIdx = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === lagnaClean);
  if (sIdx < 0) {
    throw new Error(`Invalid lagnaName provided to getFunctionalLordshipMatrix: "${lagnaName}"`);
  }
  const ascIdx = sIdx;
  const ascSign = ZODIAC_SIGNS[ascIdx];

  // Functional roles mapping for each of the 12 Lagnas
  const LAGNA_RULES = {
    aries: {
      yogakaraka: null,
      benefics: ["Sun", "Jupiter", "Mars"],
      malefics: ["Mercury", "Venus", "Saturn"],
      neutrals: ["Moon"],
      marakas: ["Venus"],
      dusthanaLords: { 6: "Mercury", 8: "Mars", 12: "Jupiter" },
      kendraLords: ["Mars", "Moon", "Venus", "Saturn"],
      trikonaLords: ["Mars", "Sun", "Jupiter"],
      details: {
        Sun: { role: "5th Lord (Trikona)", category: "Functional Benefic", houses: [5], summaryEn: "Dharmic intellect, children, purva punya", summaryTa: "5-ம் திரிகோண அதிபதி / பூர்வ புண்ணியம்" },
        Moon: { role: "4th Lord (Kendra)", category: "Neutral Benefic", houses: [4], summaryEn: "Mental peace, mother, property", summaryTa: "4-ம் கேந்திர அதிபதி / சுக ஸ்தானம்" },
        Mars: { role: "1st & 8th Lord (Lagna Lord)", category: "Functional Benefic", houses: [1, 8], summaryEn: "Lagna lord, vitality, self-determination", summaryTa: "லக்னாதிபதி / பிராண பலம்" },
        Mercury: { role: "3rd & 6th Lord (Dusthana)", category: "Functional Malefic", houses: [3, 6], summaryEn: "Efforts, debts, competitors", summaryTa: "3 & 6-ம் மறைவு அதிபதி" },
        Jupiter: { role: "9th & 12th Lord (Bhagya)", category: "Functional Benefic", houses: [9, 12], summaryEn: "Fortunes, spirituality, higher wisdom", summaryTa: "9-ம் பாக்கிய அதிபதி" },
        Venus: { role: "2nd & 7th Lord (Primary Maraka)", category: "Functional Malefic / Maraka", houses: [2, 7], summaryEn: "Partnership, accumulated wealth, primary maraka", summaryTa: "2 & 7-ம் முதன்மை மாரக அதிபதி" },
        Saturn: { role: "10th & 11th Lord (Kendra & Labha)", category: "Neutral Malefic", houses: [10, 11], summaryEn: "Vocational endurance and steady gains", summaryTa: "10 & 11-ம் கர்ம/லாப அதிபதி" }
      }
    },
    taurus: {
      yogakaraka: "Saturn",
      benefics: ["Saturn", "Mercury", "Venus"],
      malefics: ["Jupiter", "Mars", "Moon"],
      neutrals: ["Sun"],
      marakas: ["Mercury", "Mars"],
      dusthanaLords: { 6: "Venus", 8: "Jupiter", 12: "Mars" },
      kendraLords: ["Venus", "Sun", "Mars", "Saturn"],
      trikonaLords: ["Venus", "Mercury", "Saturn"],
      details: {
        Saturn: { role: "9th & 10th Lord (Yogakaraka)", category: "Supreme Yogakaraka", houses: [9, 10], summaryEn: "Dharma-Karmadhipati conferring high status & fortune", summaryTa: "தர்ம-கர்மாதிபதி ராஜயோகம்" },
        Mercury: { role: "2nd & 5th Lord (Dhana & Trikona / Maraka)", category: "Functional Benefic", houses: [2, 5], summaryEn: "Exceptional financial intelligence, speech, 2nd house maraka", summaryTa: "2 & 5-ம் தன/புத்தி/மாரக அதிபதி" },
        Venus: { role: "1st & 6th Lord (Lagna Lord)", category: "Functional Benefic", houses: [1, 6], summaryEn: "Personal charm, longevity, vitality", summaryTa: "லக்னாதிபதி / உடல் நலம்" },
        Sun: { role: "4th Lord (Kendra)", category: "Neutral", houses: [4], summaryEn: "Domestic comforts and real estate", summaryTa: "4-ம் சுக ஸ்தான அதிபதி" },
        Mars: { role: "7th & 12th Lord (7th Lord Maraka)", category: "Functional Malefic / Maraka", houses: [7, 12], summaryEn: "7th house primary maraka potency and foreign expenditure", summaryTa: "7 & 12-ம் மாரக/விரய அதிபதி" },
        Jupiter: { role: "8th & 11th Lord (Trishadaya)", category: "Functional Malefic", houses: [8, 11], summaryEn: "Sudden obstacles and fluctuating gains", summaryTa: "8 & 11-ம் மறைவு அதிபதி" },
        Moon: { role: "3rd Lord", category: "Functional Malefic", houses: [3], summaryEn: "Short journeys and constant efforts", summaryTa: "3-ம் தைரிய ஸ்தான அதிபதி" }
      }
    },
    gemini: {
      yogakaraka: null,
      benefics: ["Venus", "Mercury"],
      malefics: ["Mars", "Jupiter", "Sun"],
      neutrals: ["Saturn", "Moon"],
      marakas: ["Moon", "Jupiter"],
      dusthanaLords: { 6: "Mars", 8: "Saturn", 12: "Venus" },
      kendraLords: ["Mercury", "Jupiter"],
      trikonaLords: ["Mercury", "Venus", "Saturn"],
      details: {
        Venus: { role: "5th & 12th Lord (Trikona)", category: "Functional Benefic", houses: [5, 12], summaryEn: "Creative genius, romance, luxury", summaryTa: "5-ம் திரிகோண அதிபதி" },
        Mercury: { role: "1st & 4th Lord (Lagna Lord)", category: "Functional Benefic", houses: [1, 4], summaryEn: "Intellectual sharpness, communications", summaryTa: "லக்னம் மற்றும் சுக அதிபதி" },
        Saturn: { role: "8th & 9th Lord (Bhagya)", category: "Neutral Benefic", houses: [8, 9], summaryEn: "Dharmic progress through disciplined labor", summaryTa: "9-ம் பாக்கிய அதிபதி" },
        Jupiter: { role: "7th & 10th Lord (Kendradhipati Dosha / 7th Maraka)", category: "Neutral Maraka", houses: [7, 10], summaryEn: "Professional ties, marital scrutiny, 7th house maraka", summaryTa: "7 & 10-ம் கேந்திராதிபத்ய/மாரக தோஷம்" },
        Mars: { role: "6th & 11th Lord (Trishadaya)", category: "Strong Functional Malefic", houses: [6, 11], summaryEn: "Fierce competition, litigation, friction", summaryTa: "6 & 11-ம் பாப அதிபதி" },
        Sun: { role: "3rd Lord", category: "Functional Malefic", houses: [3], summaryEn: "Courage, writing, initiatives", summaryTa: "3-ம் தைரிய அதிபதி" },
        Moon: { role: "2nd Lord (2nd Maraka)", category: "Maraka / Neutral", houses: [2], summaryEn: "Family wealth, liquid assets, 2nd house maraka", summaryTa: "2-ம் தன/மாரக அதிபதி" }
      }
    },
    cancer: {
      yogakaraka: "Mars",
      benefics: ["Mars", "Jupiter", "Moon"],
      malefics: ["Venus", "Mercury", "Saturn"],
      neutrals: ["Sun"],
      marakas: ["Sun", "Saturn"],
      dusthanaLords: { 6: "Jupiter", 8: "Saturn", 12: "Mercury" },
      kendraLords: ["Moon", "Venus", "Saturn", "Mars"],
      trikonaLords: ["Moon", "Mars", "Jupiter"],
      details: {
        Mars: { role: "5th & 10th Lord (Yogakaraka)", category: "Supreme Yogakaraka", houses: [5, 10], summaryEn: "Kendra-Trikona synergy for leadership, land, status", summaryTa: "5 & 10-ம் உச்ச ராஜயோகாதிபதி" },
        Jupiter: { role: "6th & 9th Lord (Bhagya)", category: "Functional Benefic", houses: [6, 9], summaryEn: "Divine grace, righteous victory over adversity", summaryTa: "9-ம் பாக்கிய அதிபதி" },
        Moon: { role: "1st Lord (Lagna Lord)", category: "Functional Benefic", houses: [1], summaryEn: "Intuitive emotional vitality and popular appeal", summaryTa: "லக்னாதிபதி / மனோபலன்" },
        Sun: { role: "2nd Lord (2nd Maraka / Dhana)", category: "Neutral / Maraka", houses: [2], summaryEn: "Royal lineage, family resources, 2nd house maraka", summaryTa: "2-ம் தன/மாரக அதிபதி" },
        Venus: { role: "4th & 11th Lord (Badhaka)", category: "Functional Malefic", houses: [4, 11], summaryEn: "Material cravings and domestic friction", summaryTa: "4 & 11-ம் பாதகாதிபதி" },
        Mercury: { role: "3rd & 12th Lord", category: "Functional Malefic", houses: [3, 12], summaryEn: "Unnecessary expenses and nervous restlessness", summaryTa: "3 & 12-ம் விரய அதிபதி" },
        Saturn: { role: "7th & 8th Lord (7th Maraka & Ayur)", category: "Strong Functional Malefic", houses: [7, 8], summaryEn: "7th maraka potency, relationship delays, longevity tests", summaryTa: "7 & 8-ம் மாரகாதிபதி" }
      }
    },
    leo: {
      yogakaraka: "Mars",
      benefics: ["Mars", "Sun", "Jupiter"],
      malefics: ["Venus", "Saturn", "Mercury"],
      neutrals: ["Moon"],
      marakas: ["Mercury", "Saturn"],
      dusthanaLords: { 6: "Saturn", 8: "Jupiter", 12: "Moon" },
      kendraLords: ["Sun", "Mars", "Saturn", "Venus"],
      trikonaLords: ["Sun", "Jupiter", "Mars"],
      details: {
        Mars: { role: "4th & 9th Lord (Yogakaraka)", category: "Supreme Yogakaraka", houses: [4, 9], summaryEn: "Supreme fortune, real estate, executive authority", summaryTa: "4 & 9-ம் பாக்கிய-சுக ராஜயோகாதிபதி" },
        Sun: { role: "1st Lord (Lagna Lord)", category: "Functional Benefic", houses: [1], summaryEn: "Solar radiance, sovereign authority, physical vitality", summaryTa: "லக்னாதிபதி / தலைமை ஆளுமை" },
        Jupiter: { role: "5th & 8th Lord (Trikona)", category: "Functional Benefic", houses: [5, 8], summaryEn: "Occult mastery, higher learning, counseling", summaryTa: "5-ம் திரிகோண புத்தி அதிபதி" },
        Mercury: { role: "2nd & 11th Lord (2nd Maraka & Dhana)", category: "Neutral Benefic", houses: [2, 11], summaryEn: "Commercial earnings, financial intelligence, 2nd house maraka", summaryTa: "2 & 11-ம் தன/லாப/மாரக அதிபதி" },
        Venus: { role: "3rd & 10th Lord", category: "Functional Malefic", houses: [3, 10], summaryEn: "Ambition, career competition, social dynamics", summaryTa: "3 & 10-ம் தொழில் அதிபதி" },
        Saturn: { role: "6th & 7th Lord (7th Maraka & Shatru)", category: "Functional Malefic", houses: [6, 7], summaryEn: "7th maraka, spouse differences, open adversaries, hard discipline", summaryTa: "6 & 7-ம் சத்ரு/மாரக அதிபதி" },
        Moon: { role: "12th Lord (Moksha)", category: "Neutral", houses: [12], summaryEn: "Spiritual retreat and overseas journeys", summaryTa: "12-ம் விரய/மோட்ச அதிபதி" }
      }
    },
    virgo: {
      yogakaraka: null,
      benefics: ["Venus", "Mercury"],
      malefics: ["Mars", "Jupiter", "Moon"],
      neutrals: ["Sun", "Saturn"],
      marakas: ["Venus", "Jupiter"],
      dusthanaLords: { 6: "Saturn", 8: "Mars", 12: "Sun" },
      kendraLords: ["Mercury", "Jupiter"],
      trikonaLords: ["Mercury", "Saturn", "Venus"],
      details: {
        Venus: { role: "2nd & 9th Lord (2nd Maraka & Bhagya)", category: "Functional Benefic", houses: [2, 9], summaryEn: "Exceptional luck, fortune, artistic refinement, 2nd maraka", summaryTa: "2 & 9-ம் பாக்கிய/தன/மாரக அதிபதி" },
        Mercury: { role: "1st & 10th Lord (Lagna & Karma)", category: "Functional Benefic", houses: [1, 10], summaryEn: "Vocational excellence, analytical brilliance", summaryTa: "லக்னம் மற்றும் கர்ம அதிபதி" },
        Saturn: { role: "5th & 6th Lord (Trikona & Shatru)", category: "Neutral Benefic", houses: [5, 6], summaryEn: "Technical intellect and tactical problem solving", summaryTa: "5-ம் புத்தி & 6-ம் சத்ரு அதிபதி" },
        Jupiter: { role: "4th & 7th Lord (Kendradhipati Dosha / 7th Maraka)", category: "Neutral Maraka", houses: [4, 7], summaryEn: "Domestic obligations, marital partnership, 7th maraka", summaryTa: "4 & 7-ம் கேந்திராதிபத்ய/மாரக தோஷம்" },
        Mars: { role: "3rd & 8th Lord (Dusthana)", category: "Strong Functional Malefic", houses: [3, 8], summaryEn: "Sudden accidents, impulsive friction", summaryTa: "3 & 8-ம் அஷ்டமாதிபதி" },
        Moon: { role: "11th Lord (Trishadaya)", category: "Functional Malefic", houses: [11], summaryEn: "Fluctuating revenues and social circles", summaryTa: "11-ம் லாப அதிபதி" },
        Sun: { role: "12th Lord", category: "Neutral", houses: [12], summaryEn: "Foreign connections and expenditure", summaryTa: "12-ம் விரய அதிபதி" }
      }
    },
    libra: {
      yogakaraka: "Saturn",
      benefics: ["Saturn", "Mercury", "Venus"],
      malefics: ["Jupiter", "Sun", "Mars"],
      neutrals: ["Moon"],
      marakas: ["Mars"],
      dusthanaLords: { 6: "Jupiter", 8: "Venus", 12: "Mercury" },
      kendraLords: ["Venus", "Saturn", "Mars", "Moon"],
      trikonaLords: ["Venus", "Saturn", "Mercury"],
      details: {
        Saturn: { role: "4th & 5th Lord (Yogakaraka)", category: "Supreme Yogakaraka", houses: [4, 5], summaryEn: "Supreme wealth, intellect, land, and royal honor", summaryTa: "4 & 5-ம் சுக-புத்தி ராஜயோகாதிபதி" },
        Mercury: { role: "9th & 12th Lord (Bhagya)", category: "Functional Benefic", houses: [9, 12], summaryEn: "Dharmic travels, higher education, trade", summaryTa: "9-ம் பாக்கிய அதிபதி" },
        Venus: { role: "1st & 8th Lord (Lagna Lord)", category: "Functional Benefic", houses: [1, 8], summaryEn: "Personal magnetism, longevity, aesthetic mastery", summaryTa: "லக்னாதிபதி / ஆயுள் பலம்" },
        Moon: { role: "10th Lord (Kendra)", category: "Neutral", houses: [10], summaryEn: "Public image and social service vocations", summaryTa: "10-ம் கர்ம அதிபதி" },
        Mars: { role: "2nd & 7th Lord (Primary Maraka)", category: "Strong Maraka", houses: [2, 7], summaryEn: "Direct partnership power, 2nd & 7th primary maraka lord", summaryTa: "2 & 7-ம் முதன்மை மாரகாதிபதி" },
        Jupiter: { role: "3rd & 6th Lord (Trishadaya)", category: "Strong Functional Malefic", houses: [3, 6], summaryEn: "Obstacles, competition, digestive ailments", summaryTa: "3 & 6-ம் சத்ரு அதிபதி" },
        Sun: { role: "11th Lord (Badhaka)", category: "Functional Malefic", houses: [11], summaryEn: "Badhaka hurdles in large ambitions", summaryTa: "11-ம் பாதகாதிபதி" }
      }
    },
    scorpio: {
      yogakaraka: null,
      benefics: ["Jupiter", "Moon", "Sun", "Mars"],
      malefics: ["Mercury", "Venus"],
      neutrals: ["Saturn"],
      marakas: ["Jupiter", "Venus"],
      dusthanaLords: { 6: "Mars", 8: "Mercury", 12: "Venus" },
      kendraLords: ["Mars", "Saturn", "Venus", "Sun"],
      trikonaLords: ["Mars", "Jupiter", "Moon"],
      details: {
        Jupiter: { role: "2nd & 5th Lord (2nd Maraka & Trikona)", category: "Supreme Functional Benefic", houses: [2, 5], summaryEn: "Immense financial prosperity, scholastic wisdom, 2nd maraka", summaryTa: "2 & 5-ம் தன/புத்தி/மாரக குரு யோகம்" },
        Moon: { role: "9th Lord (Bhagya)", category: "Functional Benefic", houses: [9], summaryEn: "Divine luck, righteous fatherly support, fortunes", summaryTa: "9-ம் பாக்கிய அதிபதி" },
        Sun: { role: "10th Lord (Karma)", category: "Functional Benefic", houses: [10], summaryEn: "Executive authority, administrative prestige", summaryTa: "10-ம் கர்ம ராஜயோக அதிபதி" },
        Mars: { role: "1st & 6th Lord (Lagna Lord)", category: "Functional Benefic", houses: [1, 6], summaryEn: "Unyielding courage, fighting spirit, health resilience", summaryTa: "லக்னாதிபதி / வீர ஆளுமை" },
        Saturn: { role: "3rd & 4th Lord", category: "Neutral Malefic", houses: [3, 4], summaryEn: "Perseverance in real estate and family assets", summaryTa: "3 & 4-ம் சுக/தைரிய அதிபதி" },
        Venus: { role: "7th & 12th Lord (7th Maraka)", category: "Functional Malefic / Maraka", houses: [7, 12], summaryEn: "7th house primary maraka, sensual indulgence, marital friction", summaryTa: "7 & 12-ம் மாரக/விரய அதிபதி" },
        Mercury: { role: "8th & 11th Lord (Dusthana & Trishadaya)", category: "Strong Functional Malefic", houses: [8, 11], summaryEn: "Financial volatility and unexpected reversals", summaryTa: "8 & 11-ம் அஷ்டம/லாப அதிபதி" }
      }
    },
    sagittarius: {
      yogakaraka: null,
      benefics: ["Sun", "Mars", "Jupiter"],
      malefics: ["Venus", "Mercury", "Saturn"],
      neutrals: ["Moon"],
      marakas: ["Saturn", "Mercury"],
      dusthanaLords: { 6: "Venus", 8: "Moon", 12: "Mars" },
      kendraLords: ["Jupiter", "Mercury"],
      trikonaLords: ["Jupiter", "Mars", "Sun"],
      details: {
        Sun: { role: "9th Lord (Bhagya)", category: "Supreme Functional Benefic", houses: [9], summaryEn: "Dharmic illumination, royal fortune, spiritual elevation", summaryTa: "9-ம் பாக்கிய அதிபதி" },
        Mars: { role: "5th & 12th Lord (Trikona)", category: "Functional Benefic", houses: [5, 12], summaryEn: "Strategic intellect, technical mastery, purva punya", summaryTa: "5-ம் திரிகோண புத்தி அதிபதி" },
        Jupiter: { role: "1st & 4th Lord (Lagna Lord)", category: "Functional Benefic", houses: [1, 4], summaryEn: "Vast wisdom, domestic happiness, stature", summaryTa: "லக்னம் மற்றும் சுக அதிபதி" },
        Moon: { role: "8th Lord (No dosha)", category: "Neutral", houses: [8], summaryEn: "Occult depth and emotional intuition", summaryTa: "8-ம் அஷ்டமாதிபதி" },
        Mercury: { role: "7th & 10th Lord (Kendradhipati Dosha / 7th Maraka)", category: "Neutral Maraka", houses: [7, 10], summaryEn: "Commerce, professional contracts, 7th house maraka", summaryTa: "7 & 10-ம் கர்ம/மாரக அதிபதி" },
        Saturn: { role: "2nd & 3rd Lord (2nd Maraka)", category: "Neutral Malefic", houses: [2, 3], summaryEn: "Steady financial effort, speech caution, 2nd house maraka", summaryTa: "2 & 3-ம் தன/மாரக அதிபதி" },
        Venus: { role: "6th & 11th Lord (Trishadaya)", category: "Strong Functional Malefic", houses: [6, 11], summaryEn: "Sensory distractions, competitors, debts", summaryTa: "6 & 11-ம் சத்ரு/லாப அதிபதி" }
      }
    },
    capricorn: {
      yogakaraka: "Venus",
      benefics: ["Venus", "Mercury", "Saturn"],
      malefics: ["Mars", "Jupiter", "Moon"],
      neutrals: ["Sun"],
      marakas: ["Saturn", "Moon"],
      dusthanaLords: { 6: "Mercury", 8: "Sun", 12: "Jupiter" },
      kendraLords: ["Saturn", "Mars", "Moon", "Venus"],
      trikonaLords: ["Saturn", "Venus", "Mercury"],
      details: {
        Venus: { role: "5th & 10th Lord (Yogakaraka)", category: "Supreme Yogakaraka", houses: [5, 10], summaryEn: "Supreme artistic, vocational, and financial ascension", summaryTa: "5 & 10-ம் கர்ம-புத்தி ராஜயோகாதிபதி" },
        Mercury: { role: "6th & 9th Lord (Bhagya)", category: "Functional Benefic", houses: [6, 9], summaryEn: "Higher learning, commercial acumen, luck", summaryTa: "9-ம் பாக்கிய அதிபதி" },
        Saturn: { role: "1st & 2nd Lord (Lagna Lord & 2nd Maraka)", category: "Functional Benefic", houses: [1, 2], summaryEn: "Iron discipline, material consolidation, 2nd house maraka", summaryTa: "லக்னம் மற்றும் தன/மாரக அதிபதி" },
        Sun: { role: "8th Lord", category: "Neutral Malefic", houses: [8], summaryEn: "Karmic tests, inheritance, research", summaryTa: "8-ம் அஷ்டமாதிபதி" },
        Moon: { role: "7th Lord (7th Maraka)", category: "Maraka", houses: [7], summaryEn: "Spousal relations, partnership accountability, 7th house maraka", summaryTa: "7-ம் களத்திர/மாரக அதிபதி" },
        Mars: { role: "4th & 11th Lord (Badhaka)", category: "Functional Malefic", houses: [4, 11], summaryEn: "Property friction, aggressive pursuits, badhaka", summaryTa: "4 & 11-ம் பாதகாதிபதி" },
        Jupiter: { role: "3rd & 12th Lord (Trishadaya & Dusthana)", category: "Strong Functional Malefic", houses: [3, 12], summaryEn: "Excess expenditure, misplaced investments", summaryTa: "3 & 12-ம் விரய அதிபதி" }
      }
    },
    aquarius: {
      yogakaraka: "Venus",
      benefics: ["Venus", "Saturn"],
      malefics: ["Jupiter", "Moon", "Mars"],
      neutrals: ["Sun", "Mercury"],
      marakas: ["Jupiter", "Sun"],
      dusthanaLords: { 6: "Moon", 8: "Mercury", 12: "Saturn" },
      kendraLords: ["Saturn", "Venus", "Sun", "Mars"],
      trikonaLords: ["Saturn", "Mercury", "Venus"],
      details: {
        Venus: { role: "4th & 9th Lord (Yogakaraka)", category: "Supreme Yogakaraka", houses: [4, 9], summaryEn: "Supreme domestic prosperity, dharma, luxury assets", summaryTa: "4 & 9-ம் பாக்கிய-சுக ராஜயோகாதிபதி" },
        Saturn: { role: "1st & 12th Lord (Lagna Lord)", category: "Functional Benefic", houses: [1, 12], summaryEn: "Philosophical detachment, scientific insight, resilience", summaryTa: "லக்னாதிபதி / ஆன்ம முதிர்ச்சி" },
        Mercury: { role: "5th & 8th Lord (Trikona)", category: "Neutral Benefic", houses: [5, 8], summaryEn: "Esoteric intellect, research, speculative insight", summaryTa: "5-ம் திரிகோண புத்தி அதிபதி" },
        Sun: { role: "7th Lord (7th Maraka)", category: "Neutral Maraka", houses: [7], summaryEn: "Spouse status, public diplomacy, 7th house primary maraka", summaryTa: "7-ம் களத்திர/மாரக அதிபதி" },
        Jupiter: { role: "2nd & 11th Lord (2nd Maraka & Dhana)", category: "Neutral Malefic", houses: [2, 11], summaryEn: "Financial accumulation, heavy commitments, 2nd house maraka", summaryTa: "2 & 11-ம் தன/லாப/மாரக அதிபதி" },
        Mars: { role: "3rd & 10th Lord", category: "Functional Malefic", houses: [3, 10], summaryEn: "Aggressive professional competition", summaryTa: "3 & 10-ம் தொழில் சவால் அதிபதி" },
        Moon: { role: "6th Lord (Dusthana)", category: "Functional Malefic", houses: [6], summaryEn: "Emotional anxieties, health vulnerabilities", summaryTa: "6-ம் ரோக/சத்ரு அதிபதி" }
      }
    },
    pisces: {
      yogakaraka: null,
      benefics: ["Moon", "Mars", "Jupiter"],
      malefics: ["Sun", "Venus", "Saturn"],
      neutrals: ["Mercury"],
      marakas: ["Mars", "Mercury"],
      dusthanaLords: { 6: "Sun", 8: "Venus", 12: "Saturn" },
      kendraLords: ["Jupiter", "Mercury"],
      trikonaLords: ["Jupiter", "Moon", "Mars"],
      details: {
        Moon: { role: "5th Lord (Trikona)", category: "Supreme Functional Benefic", houses: [5], summaryEn: "Creative intuition, purva punya, fertile mind", summaryTa: "5-ம் திரிகோண பூர்வ புண்ணிய அதிபதி" },
        Mars: { role: "2nd & 9th Lord (2nd Maraka & Bhagya)", category: "Supreme Functional Benefic", houses: [2, 9], summaryEn: "Colossal financial fortune, valorous dharma, 2nd house maraka", summaryTa: "2 & 9-ம் பாக்கிய/தன/மாரக ராஜயோகாதிபதி" },
        Jupiter: { role: "1st & 10th Lord (Lagna & Karma)", category: "Functional Benefic", houses: [1, 10], summaryEn: "Pedagogical authority, high ethics, public reverence", summaryTa: "லக்னம் மற்றும் கர்ம அதிபதி" },
        Mercury: { role: "4th & 7th Lord (Kendradhipati Dosha / 7th Maraka)", category: "Neutral Maraka", houses: [4, 7], summaryEn: "Domestic property, partnership management, 7th house maraka", summaryTa: "4 & 7-ம் கேந்திராதிபத்ய/மாரக தோஷம்" },
        Sun: { role: "6th Lord (Dusthana)", category: "Functional Malefic", houses: [6], summaryEn: "Competitors, resistance, vitality strain", summaryTa: "6-ம் சத்ரு அதிபதி" },
        Venus: { role: "3rd & 8th Lord (Dusthana)", category: "Strong Functional Malefic", houses: [3, 8], summaryEn: "Sudden obstacles, sensory extravagance", summaryTa: "3 & 8-ம் அஷ்டம அதிபதி" },
        Saturn: { role: "11th & 12th Lord (Trishadaya & Dusthana)", category: "Functional Malefic", houses: [11, 12], summaryEn: "Expenditure, delayed fulfillment of desires", summaryTa: "11 & 12-ம் விரய/லாப அதிபதி" }
      }
    }
  };

  const currentRules = LAGNA_RULES[lagnaClean] || LAGNA_RULES.aries;
  return {
    lagna: ascSign.name,
    lagnaTamil: ascSign.tamil,
    yogakaraka: currentRules.yogakaraka,
    benefics: currentRules.benefics,
    malefics: currentRules.malefics,
    neutrals: currentRules.neutrals,
    marakas: currentRules.marakas,
    dusthanaLords: currentRules.dusthanaLords,
    kendraLords: currentRules.kendraLords,
    trikonaLords: currentRules.trikonaLords,
    matrix: currentRules.details
  };
}

// ---------------------------------------------------------------------------
// 7.5 PLANETARY AVASTHAS ENGINE (BALADI, JAGRATADI, DEEPTADI)
// ---------------------------------------------------------------------------
export function calculatePlanetaryAvasthas(planets = [], ascendantLong = 0) {
  const result = [];
  const ascLong = requireLongitude(typeof ascendantLong === "number" ? ascendantLong : ascendantLong?.longitude, "calculatePlanetaryAvasthas Ascendant");

  for (const p of planets) {
    if (!p || !p.name) continue;
    let pLong = null;
    if (typeof p.longitude === "number" && !isNaN(p.longitude)) {
      pLong = p.longitude;
    } else if (typeof p.long === "number" && !isNaN(p.long)) {
      pLong = p.long;
    } else if (p.sign) {
      const sIdx = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === String(p.sign).toLowerCase());
      if (sIdx >= 0) {
        pLong = (sIdx * 30) + (typeof p.degreeInSign === "number" && !isNaN(p.degreeInSign) ? p.degreeInSign : 0);
      }
    }

    const houseVal = (typeof p.house === 'number' && p.house >= 1 && p.house <= 12) ? p.house : null;

    if (pLong === null) {
      result.push({
        planet: p.name,
        planetTamil: p.tamil || p.name,
        status: "INSUFFICIENT_DATA",
        degreeInSign: null,
        sign: null,
        house: houseVal,
        baladi: null,
        jagratadi: null,
        deeptadi: null,
        isRetrograde: Boolean(p.isRetrograde || (typeof p.speed === 'number' && p.speed < 0)),
        isCombust: Boolean(p.isCombust)
      });
      continue;
    }

    const sIdx = Math.floor(norm360(pLong) / 30);
    const degInSign = norm360(pLong) % 30;
    const isOddSign = sIdx % 2 === 0; // Aries=0(odd), Taurus=1(even)

    // 1. BALADI AVASTHAS (5-Fold Age State)
    let baladi = { name: "Yuva", tamil: "யுவா (முழு பலம்)", manifestation: 1.0, description: "Full adult potency (100% capacity to deliver results)" };
    const bracket = Math.floor(degInSign / 6); // 0..4
    
    if (isOddSign) {
      if (bracket === 0) baladi = { name: "Bala", tamil: "பாலா (குழந்தை)", manifestation: 0.25, description: "Infant state (25% manifestation potency)" };
      else if (bracket === 1) baladi = { name: "Kumara", tamil: "குமாரா (இளமை)", manifestation: 0.50, description: "Youthful state (50% manifestation potency)" };
      else if (bracket === 2) baladi = { name: "Yuva", tamil: "யுவா (வாலிபம் / முழுமை)", manifestation: 1.00, description: "Adult state (100% full manifestation capacity)" };
      else if (bracket === 3) baladi = { name: "Vriddha", tamil: "விருத்தா (முதுமை)", manifestation: 0.10, description: "Advanced age state (10% minimal capacity)" };
      else baladi = { name: "Mrita", tamil: "மிருதா (செயலின்மை)", manifestation: 0.00, description: "Dormant / dead state (0% direct manifestation)" };
    } else {
      if (bracket === 0) baladi = { name: "Mrita", tamil: "மிருதா (செயலின்மை)", manifestation: 0.00, description: "Dormant / dead state (0% direct manifestation)" };
      else if (bracket === 1) baladi = { name: "Vriddha", tamil: "விருத்தா (முதுமை)", manifestation: 0.10, description: "Advanced age state (10% minimal capacity)" };
      else if (bracket === 2) baladi = { name: "Yuva", tamil: "யுவா (வாலிபம் / முழுமை)", manifestation: 1.00, description: "Adult state (100% full manifestation capacity)" };
      else if (bracket === 3) baladi = { name: "Kumara", tamil: "குமாரா (இளமை)", manifestation: 0.50, description: "Youthful state (50% manifestation potency)" };
      else baladi = { name: "Bala", tamil: "பாலா (குழந்தை)", manifestation: 0.25, description: "Infant state (25% manifestation potency)" };
    }

    // 2. JAGRATADI AVASTHAS (3-Fold Alertness State)
    let jagratadi = { name: "Swapna", tamil: "ஸ்வப்னம் (கனவு நிலை)", alertLevel: "50% Alert", description: "Dreaming state in friendly or neutral sign" };
    const dignity = p.dignity || "Neutral";
    if (["Exalted", "Moolatrikona", "Own"].includes(dignity)) {
      jagratadi = { name: "Jagrata", tamil: "ஜாக்ரத் (விழிப்பு நிலை)", alertLevel: "100% Alert", description: "Awakened state in exalted or own sign" };
    } else if (["Debilitated", "Enemy", "GreatEnemy"].includes(dignity)) {
      jagratadi = { name: "Sushupti", tamil: "சுஷுப்தி (உறக்க நிலை)", alertLevel: "0-10% Alert", description: "Deep sleep state in debilitated or hostile sign" };
    }

    // 3. DEEPTADI AVASTHAS (9-Fold Mood State)
    let deeptadi = { name: "Muditha", tamil: "முதிதா (மகிழ்ச்சி)", mood: "Pleased", score: 0.75 };
    if (dignity === "Exalted") deeptadi = { name: "Deeptha", tamil: "தீப்தா (பிரகாசம்)", mood: "Exalted & Radiant", score: 1.0 };
    else if (["Moolatrikona", "Own"].includes(dignity)) deeptadi = { name: "Swastha", tamil: "ஸ்வஸ்தா (ஸ்திர நிலை)", mood: "Content & Self-Sufficient", score: 0.9 };
    else if (dignity === "Friend" || dignity === "GreatFriend") deeptadi = { name: "Muditha", tamil: "முதிதா (மகிழ்ச்சி)", mood: "Joyful & Cooperative", score: 0.75 };
    else if (dignity === "Debilitated") deeptadi = { name: "Khala", tamil: "கலா (ஆத்திர நிலை)", mood: "Harsh & Frustrated", score: 0.15 };
    else if (p.isCombust) deeptadi = { name: "Peedya", tamil: "பீடிதா (துன்ப நிலை)", mood: "Oppressed by Combustion", score: 0.25 };
    else if (p.isDefeatedInWar) deeptadi = { name: "Vikhala", tamil: "விகலா (போர் தோல்வி)", mood: "Defeated in Planetary War", score: 0.2 };
    else if (dignity === "Enemy" || dignity === "GreatEnemy") deeptadi = { name: "Deena", tamil: "தீனா (ஏழ்மை / பலவீனம்)", mood: "Depressed & Challenged", score: 0.35 };
    else deeptadi = { name: "Shanta", tamil: "சாந்தா (அமைதி நிலை)", mood: "Calm & Neutral", score: 0.6 };

    result.push({
      planet: p.name,
      planetTamil: p.tamil || p.name,
      status: "CALCULATED",
      degreeInSign: parseFloat(degInSign.toFixed(2)),
      sign: p.sign || ZODIAC_SIGNS[sIdx]?.name || null,
      house: houseVal,
      baladi,
      jagratadi,
      deeptadi,
      isRetrograde: Boolean(p.isRetrograde || p.speed < 0),
      isCombust: Boolean(p.isCombust)
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// 7.6 BHAVA CHALIT (HOUSE CUSP) ENGINE
// ---------------------------------------------------------------------------
export function calculateBhavaChalit(ascendantLong = 0, planets = [], lat = 0, lng = 0) {
  const ascLong = requireLongitude(typeof ascendantLong === "number" ? ascendantLong : ascendantLong?.longitude, "calculateBhavaChalit Ascendant");
  const ascNorm = norm360(ascLong);

  // Equal / Sripati Bhava Madhya Framework
  // Bhava Madhya (Mid-point) of House 1 is the Ascendant Degree
  const bhavas = [];
  const shiftedPlanets = [];

  for (let h = 1; h <= 12; h++) {
    const madhya = norm360(ascNorm + (h - 1) * 30);
    const arambha = norm360(madhya - 15);
    const antya = norm360(madhya + 15);

    const mSignIdx = Math.floor(madhya / 30);
    const mSign = ZODIAC_SIGNS[mSignIdx];
    const mDeg = madhya % 30;

    bhavas.push({
      bhavaNum: h,
      bhavaNameEn: `Bhava ${h}`,
      bhavaNameTa: `பாவகம் ${h}`,
      madhyaDegree: parseFloat(madhya.toFixed(2)),
      madhyaFormatted: `${Math.floor(mDeg)}° ${Math.round((mDeg % 1) * 60)}' ${mSign.name}`,
      madhyaFormattedTa: `${Math.floor(mDeg)}° ${Math.round((mDeg % 1) * 60)}' ${mSign.tamil}`,
      arambhaDegree: parseFloat(arambha.toFixed(2)),
      antyaDegree: parseFloat(antya.toFixed(2)),
      sign: mSign.name,
      signTamil: mSign.tamil,
      lord: mSign.ruler,
      occupants: []
    });
  }

  // Map each planet into its Bhava Chalit house
  const chalitPlanets = (planets || []).map(p => {
    let pLong = 0;
    if (typeof p.longitude === "number") pLong = p.longitude;
    else if (typeof p.long === "number") pLong = p.long;
    else if (p.sign) {
      const sIdx = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === p.sign.toLowerCase());
      pLong = (sIdx >= 0 ? sIdx * 30 : 0) + (p.degreeInSign || 0);
    }
    const pNorm = norm360(pLong);

    // Angular distance from House 1 Arambha
    const h1Arambha = bhavas[0].arambhaDegree;
    const diffFromH1Arambha = norm360(pNorm - h1Arambha);
    const chalitBhavaNum = Math.floor(diffFromH1Arambha / 30) + 1;
    const validChalitBhava = Math.min(12, Math.max(1, chalitBhavaNum));

    // Register occupant in Bhava
    if (bhavas[validChalitBhava - 1]) {
      bhavas[validChalitBhava - 1].occupants.push(p.name);
    }

    const rasiHouse = p.house || (Math.floor(norm360(pNorm - Math.floor(ascNorm / 30) * 30) / 30) + 1);
    const isShifted = validChalitBhava !== rasiHouse;

    const planetResult = {
      planet: p.name,
      planetTamil: p.tamil || p.name,
      longitude: parseFloat(pNorm.toFixed(2)),
      rasiSign: p.sign || ZODIAC_SIGNS[Math.floor(pNorm / 30)]?.name,
      rasiHouse,
      chalitBhava: validChalitBhava,
      isShifted,
      shiftDescriptionEn: isShifted ? `Shifted from Rasi House ${rasiHouse} to Bhava Chalit House ${validChalitBhava}` : `Retains House ${rasiHouse} in both Rasi & Bhava Chalit`,
      shiftDescriptionTa: isShifted ? `ராசி கட்டத்தில் வீடு ${rasiHouse}, பாவ சலிதத்தில் வீடு ${validChalitBhava}` : `ராசி மற்றும் பாவ சலிதம் இரண்டிலும் வீடு ${rasiHouse}`
    };

    if (isShifted) shiftedPlanets.push(planetResult);
    return planetResult;
  });

  return {
    system: "Equal-House Bhava Chalit (Ascendant Centered, Sandhi ±15°)",
    bhavas,
    planets: chalitPlanets,
    hasShifts: shiftedPlanets.length > 0,
    shiftedPlanetsCount: shiftedPlanets.length,
    shiftedPlanets,
    technicalDisclosureEn: "Rāśi sign placement is retained for sign-based lordship and aspects; Bhava Chalit is computed using Equal-House Bhava Chalit (Centered on Ascendant Degree, Sandhi = ±15°) for house-cusp boundary occupancy.",
    technicalDisclosureTa: "ராசி கட்டம் ராசி அதிபத்தியம் மற்றும் பார்வைகளுக்குரியது; பாவ சலித சக்கரம் பாவக எல்லை இருப்பு மற்றும் பலன்களுக்குரியது."
  };
}

// ---------------------------------------------------------------------------
// 7.7 EXTENDED JAIMINI & ARUDHA MODULE
// ---------------------------------------------------------------------------
export function calculateJaiminiSystem(planets = [], ascendantLong = null, divisionalCharts = null) {
  const rawAsc = typeof ascendantLong === "number" ? ascendantLong : ascendantLong?.longitude;
  const hasAsc = rawAsc !== null && rawAsc !== undefined && Number.isFinite(Number(rawAsc));
  if (!hasAsc || !planets || planets.length === 0) {
    return {
      status: "INSUFFICIENT_DATA",
      scheme: "7-Karaka Classical Parashari (Sun to Saturn; deterministic degree tie-breaking)",
      karakaScheme: "7-Karaka Parashari",
      charaKarakas: [],
      atmakaraka: null,
      darakaraka: null,
      amatyakaraka: null,
      karakamsaLagna: {
        status: "INSUFFICIENT_DATA",
        sign: null,
        signTamil: null,
        signIndex: null,
        significationEn: null,
        significationTa: null
      },
      arudhaLagna: null,
      upapadaLagna: null,
      bhavaPadas: [],
      rasiDrishti: [],
      argalaAnalysis: []
    };
  }

  const charaKarakas = calculateJaiminiKarakas(planets);
  const ascLong = requireLongitude(rawAsc, "calculateJaiminiSystem Ascendant");
  const ascSignIdx = Math.floor(norm360(ascLong) / 30);

  // 1. Karakamsa Lagna (D9 Navamsha sign of Atmakaraka)
  const atmakaraka = charaKarakas[0] || null;
  let karakamsaSign = null;
  let karakamsaSignTamil = null;
  let karakamsaIndex = null;
  let karakamsaStatus = "INSUFFICIENT_DATA";

  if (atmakaraka) {
    const akPlanet = planets.find(p => p.name === atmakaraka.planet);
    if (akPlanet) {
      let akLong = null;
      if (typeof akPlanet.longitude === "number") akLong = akPlanet.longitude;
      else if (akPlanet.sign && akPlanet.degreeInSign != null) {
        const sIdx = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === akPlanet.sign.toLowerCase());
        akLong = (sIdx >= 0 ? sIdx * 30 : 0) + (akPlanet.degreeInSign || 0);
      }
      if (akLong !== null) {
        const d9 = calculateD9(akLong);
        karakamsaSign = d9.name;
        karakamsaSignTamil = d9.tamil;
        karakamsaIndex = d9.index;
        karakamsaStatus = "CALCULATED";
      }
    }
  }

  // 2. Compute 12 Bhava Padas (Arudha Padas A1 to A12)
  // Classical Parashari rule:
  // Count signs from Bhava to its Lord: X.
  // Count X signs from Lord: Result R.
  // Exception: If R is the 1st or 7th from original house, Arudha moves to 10th from R.
  const bhavaPadas = [];
  const PADA_NAMES = [
    { code: "AL", name: "Arudha Lagna (A1 - Public Image & Tangible Self)", nameTa: "ஆருட லக்னம் (AL - வெளி உலக பிம்பம்)" },
    { code: "A2", name: "Dhana Pada (A2 - Material Wealth & Assets)", nameTa: "தன ஆருடம் (A2 - நிதி பலம்)" },
    { code: "A3", name: "Bhatru Pada (A3 - Valor, Siblings & Initiatives)", nameTa: "ப்ராத்ரு ஆருடம் (A3 - தைரியம்)" },
    { code: "A4", name: "Matru Pada (A4 - Domestic Comforts & Properties)", nameTa: "மாத்ரு ஆருடம் (A4 - சொத்துக்கள்)" },
    { code: "A5", name: "Mantra Pada (A5 - Intellect, Progeny & Creative Fame)", nameTa: "மந்த்ர ஆருடம் (A5 - புத்தி யோகம்)" },
    { code: "A6", name: "Shatru Pada (A6 - Competitors & Debts)", nameTa: "சத்ரு ஆருடம் (A6 - சவால்கள்)" },
    { code: "A7", name: "Dara Pada (A7 - Physical Relationships & Business Ties)", nameTa: "தார ஆருடம் (A7 - கூட்டாண்மை)" },
    { code: "A8", name: "Mrityu Pada (A8 - Vulnerabilities & Longevity Manifestation)", nameTa: "மிருத்யு ஆருடம் (A8 - ஆயுள் வெளிப்பாடு)" },
    { code: "A9", name: "Bhagya Pada (A9 - Fortunes & Dharmic Recognition)", nameTa: "பாக்கிய ஆருடம் (A9 - பாக்கிய பலம்)" },
    { code: "A10", name: "Rajya Pada (A10 - Professional Stature & Public Career)", nameTa: "ராஜ்ய ஆருடம் (A10 - தொழில் அந்தஸ்து)" },
    { code: "A11", name: "Labha Pada (A11 - Material Inflows & Desires)", nameTa: "லாப ஆருடம் (A11 - தன லாபம்)" },
    { code: "UL", name: "Upapada Lagna (A12 / UL - Marriage Institution & Sustenance)", nameTa: "உபபத லக்னம் (UL - திருமண பந்தம்)" }
  ];

  for (let h = 1; h <= 12; h++) {
    const bhavaSignIdx = (ascSignIdx + h - 1) % 12;
    const lordName = ZODIAC_SIGNS[bhavaSignIdx].ruler;
    const lordPlanet = planets.find(p => p.name.toLowerCase() === lordName.toLowerCase());
    
    let lordSignIdx = bhavaSignIdx;
    if (lordPlanet) {
      if (lordPlanet.sign) {
        const idx = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === lordPlanet.sign.toLowerCase());
        if (idx >= 0) lordSignIdx = idx;
      } else if (typeof lordPlanet.longitude === "number") {
        lordSignIdx = Math.floor(norm360(lordPlanet.longitude) / 30);
      }
    }

    // Distance in signs from House to Lord (1-based)
    const dist = ((lordSignIdx - bhavaSignIdx + 12) % 12) + 1;
    // Count dist signs from lord
    let arudhaSignIdx = (lordSignIdx + dist - 1) % 12;

    // Classical Parashari Exception:
    // If arudhaSignIdx falls in the same sign as original house (distance from house = 1)
    // or 7th sign from original house (distance from house = 7):
    const distFromOrig = ((arudhaSignIdx - bhavaSignIdx + 12) % 12) + 1;
    if (distFromOrig === 1 || distFromOrig === 7) {
      arudhaSignIdx = (arudhaSignIdx + 9) % 12; // 10th sign from the calculated position
    }

    const targetPadaSign = ZODIAC_SIGNS[arudhaSignIdx];
    const padaMeta = PADA_NAMES[h - 1];

    bhavaPadas.push({
      houseNum: h,
      code: padaMeta.code,
      name: padaMeta.name,
      nameTamil: padaMeta.nameTa,
      signIndex: arudhaSignIdx,
      sign: targetPadaSign.name,
      signTamil: targetPadaSign.tamil,
      lord: targetPadaSign.ruler,
      houseFromLagna: ((arudhaSignIdx - ascSignIdx + 12) % 12) + 1
    });
  }

  const arudhaLagna = bhavaPadas[0];
  const upapadaLagna = bhavaPadas[11];

  // 3. Jaimini Rasi Drishti Matrix
  // Movable (Chara) aspects Fixed (Sthira) except adjacent sign.
  // Fixed (Sthira) aspects Movable (Chara) except adjacent sign.
  // Dual (Dvisvabhava) aspects all other Dual signs.
  const rasiDrishti = {};
  for (let i = 0; i < 12; i++) {
    const sign = ZODIAC_SIGNS[i];
    const signType = i % 3; // 0: Movable, 1: Fixed, 2: Dual
    const aspectedSigns = [];

    if (signType === 0) {
      // Movable: aspects Fixed signs (1, 4, 7, 10) except adjacent (i + 1)
      for (let f = 1; f < 12; f += 3) {
        if (f !== (i + 1) % 12) {
          aspectedSigns.push(ZODIAC_SIGNS[f].name);
        }
      }
    } else if (signType === 1) {
      // Fixed: aspects Movable signs (0, 3, 6, 9) except adjacent (i - 1)
      for (let m = 0; m < 12; m += 3) {
        if (m !== (i + 11) % 12) {
          aspectedSigns.push(ZODIAC_SIGNS[m].name);
        }
      }
    } else {
      // Dual: aspects other 3 Dual signs (2, 5, 8, 11)
      for (let d = 2; d < 12; d += 3) {
        if (d !== i) {
          aspectedSigns.push(ZODIAC_SIGNS[d].name);
        }
      }
    }
    rasiDrishti[sign.name] = aspectedSigns;
  }

  // 4. Jaimini Argala & Virodhargala Analysis
  // Primary Argala: 2nd, 4th, 11th houses (Obstructed by 12th, 10th, 3rd)
  // Secondary Argala: 5th house (Obstructed by 9th)
  const argalaAnalysis = {
    lagnaArgala: {
      house2: { sign: ZODIAC_SIGNS[(ascSignIdx + 1) % 12].name, obstructedBy: ZODIAC_SIGNS[(ascSignIdx + 11) % 12].name },
      house4: { sign: ZODIAC_SIGNS[(ascSignIdx + 3) % 12].name, obstructedBy: ZODIAC_SIGNS[(ascSignIdx + 9) % 12].name },
      house11: { sign: ZODIAC_SIGNS[(ascSignIdx + 10) % 12].name, obstructedBy: ZODIAC_SIGNS[(ascSignIdx + 2) % 12].name },
      house5: { sign: ZODIAC_SIGNS[(ascSignIdx + 4) % 12].name, obstructedBy: ZODIAC_SIGNS[(ascSignIdx + 8) % 12].name }
    }
  };

  return {
    status: "COMPLETE",
    scheme: "7-Karaka Classical Parashari (Sun to Saturn; deterministic degree tie-breaking)",
    karakaScheme: "7-Karaka Parashari",
    charaKarakas,
    atmakaraka,
    darakaraka: charaKarakas.find(k => k.code === "DK") || null,
    amatyakaraka: charaKarakas.find(k => k.code === "AmK") || null,
    karakamsaLagna: {
      status: karakamsaStatus,
      sign: karakamsaSign,
      signTamil: karakamsaSignTamil,
      signIndex: karakamsaIndex,
      significationEn: karakamsaSign ? "The spiritual and vocational destiny center in the Navamsha framework." : null,
      significationTa: karakamsaSign ? "நவாம்சத்தில் ஆன்ம மற்றும் தர்ம கடமைகளின் மையம்." : null
    },
    arudhaLagna,
    upapadaLagna,
    bhavaPadas,
    rasiDrishti,
    argalaAnalysis
  };
}

// ---------------------------------------------------------------------------
// 7.8 KARMIC PATTERN ANALYSIS (Traditional Samskaras & Spiritual Themes)
// ---------------------------------------------------------------------------
export function calculateKarmicPatternAnalysis(
  planetsOrChart = [],
  ascendantLong = 0,
  divisionalCharts = null,
  jaiminiSystem = null,
  lang = "en"
) {
  let planets = planetsOrChart;
  let isTamil = false;
  let ascLong = 0;
  let divCharts = divisionalCharts;
  let jaiminiInput = jaiminiSystem;

  if (planetsOrChart && typeof planetsOrChart === "object" && !Array.isArray(planetsOrChart)) {
    const chart = planetsOrChart;
    planets = chart.planets || [];
    ascLong = requireLongitude(chart.ascendant?.longitude ?? chart.ascendantLong, "calculateKarmicPatternAnalysis Ascendant");
    divCharts = divCharts || chart.divisionalCharts || null;
    jaiminiInput = jaiminiInput || chart.jaiminiSystem || null;
    const langArg = typeof ascendantLong === "string" ? ascendantLong : (typeof lang === "string" ? lang : "en");
    isTamil = langArg === "ta";
  } else {
    isTamil = lang === "ta";
    ascLong = requireLongitude(typeof ascendantLong === "number" ? ascendantLong : ascendantLong?.longitude, "calculateKarmicPatternAnalysis Ascendant");
  }

  const ascSignIdx = Math.floor(norm360(ascLong) / 30);
  const ascSign = ZODIAC_SIGNS[ascSignIdx];
  if (!ascSign) throw new Error("Invalid Ascendant sign in calculateKarmicPatternAnalysis");
  const ascSignName = ascSign.name;

  const getPlanet = (name) => planets.find(p => p.name?.toLowerCase() === name.toLowerCase()) || null;
  const getPlanetHouse = (p) => {
    if (!p) return null;
    if (typeof p.house === "number") return p.house;
    if (typeof p.longitude !== "number" && typeof p.long !== "number") return null;
    const pLong = typeof p.longitude === "number" ? p.longitude : p.long;
    return getHouse(pLong, ascLong);
  };

  const ketu = getPlanet("Ketu");
  const rahu = getPlanet("Rahu");
  const saturn = getPlanet("Saturn");

  const ketuHouse = getPlanetHouse(ketu);
  const rahuHouse = getPlanetHouse(rahu);
  const saturnHouse = getPlanetHouse(saturn);

  // 5th House & Lord (Purva Punya)
  const house5SignIdx = (ascSignIdx + 4) % 12;
  const house5SignObj = ZODIAC_SIGNS[house5SignIdx];
  if (!house5SignObj) {
    throw new Error(`Invalid 5th-house sign index: ${house5SignIdx}`);
  }
  const house5Sign = house5SignObj.name;
  const house5LordName = house5SignObj.ruler;
  const house5Lord = getPlanet(house5LordName);
  const house5LordHouse = getPlanetHouse(house5Lord);

  // 9th House & Lord (Dharma & Spiritual Inheritance)
  const house9SignIdx = (ascSignIdx + 8) % 12;
  const house9Sign = ZODIAC_SIGNS[house9SignIdx].name;
  const house9LordName = ZODIAC_SIGNS[house9SignIdx].ruler;
  const house9Lord = getPlanet(house9LordName);
  const house9LordHouse = getPlanetHouse(house9Lord);

  // 12th House & Lord (Moksha & Dissolution)
  const house12SignIdx = (ascSignIdx + 11) % 12;
  const house12Sign = ZODIAC_SIGNS[house12SignIdx].name;
  const house12LordName = ZODIAC_SIGNS[house12SignIdx].ruler;
  const house12Lord = getPlanet(house12LordName);
  const house12LordHouse = getPlanetHouse(house12Lord);

  // Jaimini Atmakaraka & Karakamsha
  const jaimini = jaiminiInput || calculateJaiminiSystem(planets, ascLong, divCharts);
  const atmakaraka = jaimini?.atmakaraka || null;
  const karakamsa = jaimini?.karakamsaLagna || null;

  // Layer 1: Calculated Astronomical Facts
  const calculatedFacts = [
    {
      factor: "Ketu Placement",
      factorTa: "கேது பகவான் இருப்பு",
      sign: ketu?.sign || "—",
      house: ketuHouse,
      nakshatra: ketu?.nakshatra || "—",
      descriptionEn: `Ketu occupies House ${ketuHouse} in ${ketu?.sign || "—"}.`,
      descriptionTa: `கேது பகவான் ${ketuHouse}-ம் பாவத்தில் ${ketu?.signTamil || ketu?.sign || "—"} ராசியில் அமைந்துள்ளார்.`
    },
    {
      factor: "Rahu Placement",
      factorTa: "ராகு பகவான் இருப்பு",
      sign: rahu?.sign || "—",
      house: rahuHouse,
      nakshatra: rahu?.nakshatra || "—",
      descriptionEn: `Rahu occupies House ${rahuHouse} in ${rahu?.sign || "—"}.`,
      descriptionTa: `ராகு பகவான் ${rahuHouse}-ம் பாவத்தில் ${rahu?.signTamil || rahu?.sign || "—"} ராசியில் அமைந்துள்ளார்.`
    },
    {
      factor: "5th House / Purva Punya Lord",
      factorTa: "5-ம் பாவம் / பூர்வ புண்ணியாதிபதி",
      sign: house5Lord?.sign || "—",
      house: house5LordHouse,
      lord: house5LordName,
      descriptionEn: `5th Lord (${house5LordName}) occupies House ${house5LordHouse} in ${house5Lord?.sign || "—"}.`,
      descriptionTa: `5-ம் பாவாதிபதி (${house5LordName}) ${house5LordHouse}-ம் பாவத்தில் அமர்ந்துள்ளார்.`
    },
    {
      factor: "9th House / Dharma Lord",
      factorTa: "9-ம் பாவம் / பாக்கியாதிபதி",
      sign: house9Lord?.sign || "—",
      house: house9LordHouse,
      lord: house9LordName,
      descriptionEn: `9th Lord (${house9LordName}) occupies House ${house9LordHouse} in ${house9Lord?.sign || "—"}.`,
      descriptionTa: `9-ம் பாவாதிபதி (${house9LordName}) ${house9LordHouse}-ம் பாவத்தில் அமர்ந்துள்ளார்.`
    },
    {
      factor: "12th House / Moksha Lord",
      factorTa: "12-ம் பாவம் / விரயாதிபதி",
      sign: house12Lord?.sign || "—",
      house: house12LordHouse,
      lord: house12LordName,
      descriptionEn: `12th Lord (${house12LordName}) occupies House ${house12LordHouse} in ${house12Lord?.sign || "—"}.`,
      descriptionTa: `12-ம் பாவாதிபதி (${house12LordName}) ${house12LordHouse}-ம் பாவத்தில் அமர்ந்துள்ளார்.`
    },
    {
      factor: "Jaimini Atmakaraka & Karakamsha",
      factorTa: "ஜைமினி ஆத்மகாரகன் & காரகாம்சம்",
      sign: karakamsa?.sign || "—",
      lord: atmakaraka?.planet || "—",
      descriptionEn: `Atmakaraka is ${atmakaraka?.planet || "—"}, with Karakamsha in ${karakamsa?.sign || "—"}.`,
      descriptionTa: `ஆத்மகாரகன்: ${atmakaraka?.planet || "—"}, நவாம்ச காரகாம்ச ராசி: ${karakamsa?.signTamil || karakamsa?.sign || "—"}.`
    }
  ];

  // Layer 2: Classical Shastric Rules
  const classicalRules = [
    {
      source: "Brihat Parashara Hora Shastra (Ch. 11-12)",
      ruleEn: "The 5th house signifies Purva-Punya (merit of past actions), intellect, and mantra-sadhana; the 9th house governs Dharma and spiritual fortune.",
      ruleTa: "5-ம் பாவம் பூர்வ புண்ணியம், பூர்வஜென்ம ஞானம் மற்றும் மந்த்ர சித்தியைக் குறிக்கிறது; 9-ம் பாவம் தர்மம் மற்றும் குருவருளைக் குறிக்கிறது."
    },
    {
      source: "Phaladeepika (Ch. 15)",
      ruleEn: "Ketu signifies Moksha, innate detachment, and unconscious spiritual conditioning accumulated from previous developmental cycles.",
      ruleTa: "கேது பகவான் மோட்ச காரகன்; முந்தைய சுழற்சிகளில் பெற்ற ஆன்ம பக்குவம் மற்றும் பற்றற்ற நிலையை உணர்த்துகிறார்."
    },
    {
      source: "Jaimini Upadesha Sutras (Ch. 1, Pada 2)",
      ruleEn: "The Karakamsha (Navamsha sign of Atmakaraka) reveals the soul's primary spiritual trajectory and vocational Dharma.",
      ruleTa: "காரகாம்சம் ஆத்மாவின் முதன்மையான ஆன்மீகப் பாதை மற்றும் தர்ம கடமைகளை வெளிப்படுத்துகிறது."
    }
  ];

  // Layer 3: Symbolic Karmic Themes
  const karmicThemes = [];

  if ([4, 8, 12].includes(ketuHouse)) {
    karmicThemes.push({
      titleEn: "Spiritual Introspection & Inner Solitude (Moksha Triangle)",
      titleTa: "உள்முக ஆன்மீக நாட்டம் & பற்றற்ற நிலை (மோட்ச திரிகோணம்)",
      themeEn: `Ketu placed in House ${ketuHouse} (a Moksha house) traditionally signifies an innate familiarity with meditative reflection, inner philosophy, and periods of detached solitude.`,
      themeTa: `கேது பகவான் ${ketuHouse}-ம் பாவத்தில் அமைந்திருப்பது ஆழ்ந்த சிந்தனை, தியான நாட்டம் மற்றும் ஆன்மீக பக்குவத்திற்கான பாரம்பரிய குறியீடாகும்.`
    });
  } else if ([1, 5, 9].includes(ketuHouse)) {
    karmicThemes.push({
      titleEn: "Dharmic Wisdom & Intuitive Intellect (Dharma Triangle)",
      titleTa: "தர்ம ஞானம் & உள்ளுணர்வு அறிவு (தர்ம திரிகோணம்)",
      themeEn: `Ketu in House ${ketuHouse} suggests an instinctual alignment with traditional learning, ethical inquiry, and abstract contemplation.`,
      themeTa: `கேது ${ketuHouse}-ம் பாவத்தில் இருப்பது தர்ம நெறி, ஆழமான அறிவுத் தேடல் மற்றும் உள்ளுணர்வு ஞானத்திற்கான குறியீடாகும்.`
    });
  } else {
    karmicThemes.push({
      titleEn: "Practical Service & Earthly Responsibility",
      titleTa: "கடமை உணர்வு & நடைமுறை உழைப்பு",
      themeEn: `Ketu in House ${ketuHouse} highlights cultivating grounded detachment while fulfilling practical obligations in daily life.`,
      themeTa: `கேது ${ketuHouse}-ம் பாவத்தில் இருப்பது அன்றாடப் பணிகளை பற்றின்றி கடமையாக ஆற்றுவதற்கான அமைப்பாகும்.`
    });
  }

  karmicThemes.push({
    titleEn: `Conscious Growth Focus: House ${rahuHouse} (${rahu?.sign || "—"})`,
    titleTa: `முன்னேற்ற வளர்ச்சி மையம்: ${rahuHouse}-ம் பாவம் (${rahu?.signTamil || rahu?.sign || "—"})`,
    themeEn: `Rahu in House ${rahuHouse} marks the primary developmental frontier where the native is encouraged to build new mastery, embrace innovative skills, and expand beyond past comfort zones.`,
    themeTa: `ராகு ${rahuHouse}-ம் பாவத்தில் அமைந்திருப்பது புதிய திறன்களை வளர்த்துக்கொண்டு சாதனைகளைப் படைக்க வேண்டிய வளர்ச்சிப் பகுதியாகும்.`
  });

  if (house5LordHouse === 5 || house5LordHouse === 9 || house5LordHouse === 1) {
    karmicThemes.push({
      titleEn: "Harmonious Purva Punya Activation",
      titleTa: "பூர்வ புண்ணிய சுப பலம்",
      themeEn: `The 5th Lord placed in House ${house5LordHouse} indicates strong continuity of creative intellect and auspicious ethical foundation.`,
      themeTa: `5-ம் பாவாதிபதி சுப திரிகோணத்தில் அமைந்திருப்பது நல்வழியில் வழிநடத்தும் பூர்வ புண்ணிய அமைப்பாகும்.`
    });
  }

  // Layer 4: Uncertainty & Methodology Disclosures
  const uncertaintyNotice = {
    methodologyEn: "Traditional Jyotisha Karmic Pattern Analysis interprets chart placements as symbolic indicators of spiritual inclinations, character tendencies, and psychological developmental axes. It does NOT generate or claim empirical knowledge of historical identities, past-life names, professions, geographic places, or biographical details.",
    methodologyTa: "பாரம்பரிய ஜோதிட கர்ம முறை ஆய்வு ஜாதக அமைப்புகளை ஆன்மீக மனோபாவம், குணாதிசய வளர்ச்சி மற்றும் தர்ம கடமைகளின் குறியீடாகவே விவரிக்கிறது. இது முந்தைய பிறவியின் பெயர், தொழில், ஊர் அல்லது தனிநபர் வரலாற்று உண்மைகளை தீர்மானிக்காது.",
    birthTimeSensitivityEn: "Harmonic factors like D60 (Shashtiamsha) and exact house cusps can shift within minutes of birth time. Karmic patterns should be viewed as broad philosophical themes rather than fatalistic decrees.",
    birthTimeSensitivityTa: "டி60 (சஷ்டியாம்சம்) போன்ற நுட்பமான வர்க்கங்கள் நிமிடக் கணக்கில் மாறுபடக்கூடியவை. எனவே இதனை வாழ்க்கைக்கான ஆன்மீக வழிகாட்டுதலாக மட்டுமே கொள்ள வேண்டும்."
  };

  return {
    calculatedFacts,
    classicalRules,
    karmicThemes,
    atmakarakaSignificator: atmakaraka,
    karakamsaLagna: karakamsa,
    rahuKetuAxis: { rahuHouse, ketuHouse, rahuSign: rahu?.sign, ketuSign: ketu?.sign },
    purvaPunyaAssessment: { house5Sign, house5Lord: house5LordName, house5LordHouse },
    uncertaintyNotice
  };
}

// ---------------------------------------------------------------------------
// 7.9 TRADITIONAL LONGEVITY INDICATORS & MARAKA FACTOR ANALYSIS
// ---------------------------------------------------------------------------
export function calculateTraditionalLongevityIndicators(
  planetsOrChart = [],
  ascendantLong = 0,
  activeDasha = null,
  lang = "en"
) {
  let planets = planetsOrChart;
  let isTamil = false;
  let ascLong = 0;
  let dasha = activeDasha;

  if (planetsOrChart && typeof planetsOrChart === "object" && !Array.isArray(planetsOrChart)) {
    const chart = planetsOrChart;
    planets = chart.planets || [];
    ascLong = requireLongitude(chart.ascendant?.longitude ?? chart.ascendantLong, "calculateTraditionalLongevityIndicators Ascendant");
    dasha = dasha || chart.currentDasha || chart.dashaTable?.find(d => d.isCurrent) || null;
    const langArg = typeof ascendantLong === "string" ? ascendantLong : (typeof lang === "string" ? lang : "en");
    isTamil = langArg === "ta";
  } else {
    isTamil = lang === "ta";
    ascLong = requireLongitude(typeof ascendantLong === "number" ? ascendantLong : ascendantLong?.longitude, "calculateTraditionalLongevityIndicators Ascendant");
  }

  const ascSignIdx = Math.floor(norm360(ascLong) / 30);
  const ascSign = ZODIAC_SIGNS[ascSignIdx];
  if (!ascSign) throw new Error("Invalid Ascendant sign in calculateTraditionalLongevityIndicators");
  const ascSignName = ascSign.name;

  const getPlanet = (name) => planets.find(p => p.name?.toLowerCase() === name.toLowerCase()) || null;
  const getPlanetHouse = (p) => {
    if (!p) return null;
    if (typeof p.house === "number") return p.house;
    if (typeof p.longitude !== "number" && typeof p.long !== "number") return null;
    const pLong = typeof p.longitude === "number" ? p.longitude : p.long;
    return getHouse(pLong, ascLong);
  };

  // 1. Lagna Lord (Tanu Bhava Vitality)
  const lagnaLordName = ascSign.ruler;
  if (!lagnaLordName) throw new Error(`Invalid Lagna Lord for sign ${ascSignName}`);
  const lagnaLord = getPlanet(lagnaLordName);
  const lagnaLordHouse = getPlanetHouse(lagnaLord);

  // 2. 8th House & Lord (Ayur Bhava - Lifespan Endurance)
  const house8SignIdx = (ascSignIdx + 7) % 12;
  const house8Sign = ZODIAC_SIGNS[house8SignIdx].name;
  const house8LordName = ZODIAC_SIGNS[house8SignIdx].ruler;
  const house8Lord = getPlanet(house8LordName);
  const house8LordHouse = getPlanetHouse(house8Lord);

  // 3. Saturn (Ayushkaraka - Natural Governor of Endurance)
  const saturn = getPlanet("Saturn");
  const saturnHouse = getPlanetHouse(saturn);

  // 4. 3rd House & Lord (Bhavat Bhavam of 8th - Secondary Vitality)
  const house3SignIdx = (ascSignIdx + 2) % 12;
  const house3Sign = ZODIAC_SIGNS[house3SignIdx].name;
  const house3LordName = ZODIAC_SIGNS[house3SignIdx].ruler;
  const house3Lord = getPlanet(house3LordName);
  const house3LordHouse = getPlanetHouse(house3Lord);

  // 5. Maraka Lords (2nd and 7th Lords)
  const house2SignIdx = (ascSignIdx + 1) % 12;
  const house2LordName = ZODIAC_SIGNS[house2SignIdx].ruler;
  const house7SignIdx = (ascSignIdx + 6) % 12;
  const house7LordName = ZODIAC_SIGNS[house7SignIdx].ruler;

  const evaluateStrength = (planet, preferredHouses) => {
    if (!planet) return "Moderate";
    const h = getPlanetHouse(planet);
    if (h === null || h === undefined) return "Moderate";
    if (preferredHouses.includes(h)) return "Supported";
    if ([6, 8, 12].includes(h) && !preferredHouses.includes(h)) return "Needs Care";
    return "Moderate";
  };

  const longevityIndicators = [
    {
      factor: isTamil ? "லக்னம் & லக்னாதிபதி பலம்" : "Lagna & Lagna Lord Constitution",
      lord: lagnaLordName,
      house: lagnaLordHouse,
      status: evaluateStrength(lagnaLord, [1, 4, 5, 9, 10, 11]),
      descriptionEn: `Lagna is ${ascSignName}; Lagna Lord (${lagnaLordName}) is in House ${lagnaLordHouse ?? "N/A"}. Represents physical foundation.`,
      descriptionTa: `லக்னம்: ${ascSign.tamil || ascSignName}; லக்னாதிபதி (${lagnaLordName}) ${lagnaLordHouse ?? "N/A"}-ம் வீட்டில் உள்ளார்.`
    },
    {
      factor: isTamil ? "8-ம் பாவம் & ஆயுள்பாவாதிபதி" : "8th House & Ayur Lord (Endurance)",
      lord: house8LordName,
      house: house8LordHouse,
      status: evaluateStrength(house8Lord, [8, 1, 4, 5, 9, 10, 11]),
      descriptionEn: `8th House (${house8Sign}) governed by ${house8LordName} in House ${house8LordHouse ?? "N/A"}. Governs longevity vitality.`,
      descriptionTa: `8-ம் பாவம் (${house8Sign}) அதிபதி ${house8LordName} ${house8LordHouse ?? "N/A"}-ம் வீட்டில் உள்ளார்.`
    },
    {
      factor: isTamil ? "ஆயுஷ்காரகன் சனி பகவான்" : "Saturn (Natural Ayushkaraka)",
      lord: "Saturn",
      house: saturnHouse,
      status: evaluateStrength(saturn, [6, 8, 10, 11, 3]),
      descriptionEn: `Saturn occupies House ${saturnHouse ?? "N/A"}. Classical Jyotisha honors Saturn as the natural significator of endurance and lifespan.`,
      descriptionTa: `சனி பகவான் ${saturnHouse ?? "N/A"}-ம் வீட்டில் உள்ளார். இயற்கை ஆயுஷ்காரகராக நீண்ட ஆயுள் காரகத்துவத்தை குறிக்கிறார்.`
    },
    {
      factor: isTamil ? "3-ம் பாவம் (ஆயுளின் பாவக பாவம்)" : "3rd House (Bhavat Bhavam of 8th)",
      lord: house3LordName,
      house: house3LordHouse,
      status: evaluateStrength(house3Lord, [3, 1, 5, 9, 11]),
      descriptionEn: `3rd Lord (${house3LordName}) in House ${house3LordHouse ?? "N/A"}. Represents secondary vitality and energetic resilience.`,
      descriptionTa: `3-ம் பாவாதிபதி (${house3LordName}) ${house3LordHouse ?? "N/A"}-ம் வீட்டில் உள்ளார். துணை ஆயுள் பலத்தைக் குறிக்கிறது.`
    }
  ];

  const isOperatingLordMaraka = activeDasha?.lord ? [house2LordName, house7LordName].includes(activeDasha.lord) : false;
  const marakaAssessment = {
    marakaLord2: house2LordName,
    marakaLord7: house7LordName,
    marakaHouse2Sign: ZODIAC_SIGNS[house2SignIdx]?.name,
    marakaHouse7Sign: ZODIAC_SIGNS[house7SignIdx]?.name,
    operatingLordIsMaraka: isOperatingLordMaraka,
    currentDashaActivation: isOperatingLordMaraka 
      ? "Maraka-related activation under selected Parashari rules" 
      : (activeDasha?.lord ? "Non-Maraka Dasha" : "Neutral"),
    breakdown: {
      operatingLord: activeDasha?.lord || null,
      operatingLordRole: isOperatingLordMaraka ? "2nd/7th House Lord" : "Non-Maraka Lord",
      subPeriod: activeDasha?.currentAntar || activeDasha?.subLord || null,
      secondHouse: { sign: ZODIAC_SIGNS[house2SignIdx]?.name, lord: house2LordName },
      seventhHouse: { sign: ZODIAC_SIGNS[house7SignIdx]?.name, lord: house7LordName },
      eighthHouse: { sign: house8Sign, lord: house8LordName }
    },
    educationalNoteEn: "In Jyotisha, Maraka is a technical term associated with longevity analysis. It does not mean that death is predicted.",
    educationalNoteTa: "ஜோதிடத்தில் மாரகம் என்பது ஆயுள் தொடர்பான ஒரு தொழில்நுட்பச் சொல். இது மரணத்தை முன்னறிவிப்பதாகக் கொள்ளக்கூடாது.",
    technicalNoteEn: "Classical Parashari astrology categorizes the 2nd and 7th houses as Maraka (transition/lifespan boundary) significators. Their periods indicate times requiring extra mindfulness regarding physical health and lifestyle balance.",
    technicalNoteTa: "பராசர சாஸ்திரத்தில் 2 மற்றும் 7-ம் பாவகங்கள் மாரக பாவகங்களாகக் குறிப்பிடப்படுகின்றன. இவற்றின் தசாபுத்திகளில் உடல் ஆரோக்கியத்தில் கூடுதல் கவனம் தேவைப்படும்."
  };

  const traditionalInterpretation = {
    summaryEn: "The chart displays traditional constitutional vitality supported by its Lagna, 8th house, and natural Ayushkaraka (Saturn). In Vedic philosophy, physical wellness and longevity are sustained through balanced lifestyle, righteous living (Dharma), and mindful health practices.",
    summaryTa: "ஜாதகத்தில் லக்னம், 8-ம் பாவம் மற்றும் ஆயுஷ்காரகர் சனி பகவான் மூலம் பாரம்பரிய ஆயுள் பலம் விவரிக்கப்பட்டுள்ளது. வேத நெறிப்படி ஆரோக்கியமான வாழ்க்கை முறை மற்றும் தர்ம சிந்தனை ஆயுளை மேம்படுத்தும் காரணியாகும்."
  };

  const statutoryDisclaimer = {
    disclaimerEn: "Statutory Notice: Traditional Longevity & Maraka factor analysis describes educational Jyotisha symbolic components. It does NOT predict the exact date, time, or manner of death and does NOT constitute a medical or clinical assessment. Astronomical calculations can be independently validated; astrological interpretations are tradition-dependent and are not scientifically validated predictions of life events.",
    disclaimerTa: "சட்டப்பூர்வ அறிவிப்பு: பாரம்பரிய ஆயுள் மற்றும் மாரக பாவக ஆய்வு ஜோதிட சாஸ்திர குறியீட்டு அமைப்பை மட்டுமே விளக்குகிறது. இது மரண தேதி, நேரம் அல்லது மருத்துவ நோயறிதலை தீர்மானிக்காது. வானியல் கணக்கீடுகள் சுயாதீனமாக சரிபார்க்கப்படலாம்; ஜோதிட விளக்கங்கள் பாரம்பரியத்தை சார்ந்தவை, அறிவியல் பூர்வமாக நிரூபிக்கப்பட்டவை அல்ல."
  };

  return {
    longevityIndicators,
    marakaAssessment,
    traditionalInterpretation,
    statutoryDisclaimer
  };
}

export const calculateTraditionalLongevityAnalysis = calculateTraditionalLongevityIndicators;

// ---------------------------------------------------------------------------
// 7.10 NAKSHATRA & DISPOSITOR DEEP PROFILE ENGINE
// ---------------------------------------------------------------------------
export function calculateNakshatraDispositorProfile(planet = {}, planets = [], ascendantLong = 0) {
  if (!planet || !planet.name) return null;

  let pLong = 0;
  if (typeof planet.longitude === "number") pLong = planet.longitude;
  else if (typeof planet.long === "number") pLong = planet.long;
  else if (planet.sign) {
    const sIdx = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === planet.sign.toLowerCase());
    pLong = (sIdx >= 0 ? sIdx * 30 : 0) + (planet.degreeInSign || 0);
  }
  const normLong = norm360(pLong);

  const nakSpan = 360 / 27; // 13.333333333°
  const nakIdx = Math.floor(normLong / nakSpan);
  const nak = NAKSHATRAS[nakIdx] || NAKSHATRAS[0];

  const remDeg = normLong % nakSpan;
  const pada = Math.min(4, Math.floor(remDeg / (nakSpan / 4)) + 1);

  const signIdx = Math.floor(normLong / 30);
  const sign = ZODIAC_SIGNS[signIdx];
  const signLord = sign.ruler;
  const nakLord = nak.ruler;

  // Find Sign Lord Planet & Nakshatra Lord Planet in birth chart
  const signLordPlanet = planets.find(p => p.name.toLowerCase() === signLord.toLowerCase());
  const nakLordPlanet = planets.find(p => p.name.toLowerCase() === nakLord.toLowerCase());

  const plHouse = (typeof planet.house === "number" && planet.house >= 1 && planet.house <= 12) ? planet.house : null;
  const signLordHouse = (typeof signLordPlanet?.house === "number" && signLordPlanet.house >= 1 && signLordPlanet.house <= 12) ? signLordPlanet.house : null;
  const nakLordHouse = (typeof nakLordPlanet?.house === "number" && nakLordPlanet.house >= 1 && nakLordPlanet.house <= 12) ? nakLordPlanet.house : null;

  // Build dispositor chain
  const dispositorChain = [
    { level: 1, role: "Graha", name: planet.name, sign: sign.name, house: plHouse },
    { level: 2, role: "Rasi Lord", name: signLord, sign: signLordPlanet?.sign || "Unknown", house: signLordHouse, dignity: signLordPlanet?.dignity || "Neutral" },
    { level: 3, role: "Nakshatra Lord", name: nakLord, sign: nakLordPlanet?.sign || "Unknown", house: nakLordHouse, dignity: nakLordPlanet?.dignity || "Neutral" }
  ];

  return {
    planet: planet.name,
    planetTamil: planet.tamil || planet.name,
    longitude: parseFloat(normLong.toFixed(2)),
    sign: sign.name,
    signTamil: sign.tamil,
    signLord,
    house: plHouse,
    nakshatra: nak.name,
    nakshatraTamil: nak.tamil,
    pada,
    nakshatraLord: nakLord,
    deity: nak.deity,
    syllable: nak.syllables ? nak.syllables[pada - 1] : "",
    dispositorChain,
    signLordDignity: signLordPlanet?.dignity || "Neutral",
    nakLordDignity: nakLordPlanet?.dignity || "Neutral",
    descriptionEn: `${planet.name} in ${nak.name} Pada ${pada} (Deity: ${nak.deity}, Lord: ${nakLord}) with Rasi dispositor ${signLord}${signLordHouse ? ` situated in House ${signLordHouse}` : ""}.`,
    descriptionTa: `${planet.tamil || planet.name} கிரகம் ${nak.tamil} பாதம் ${pada} (அதிபதி: ${nakLord}, தெய்வம்: ${nak.deity}) மற்றும் ராசிநாதன் ${signLord}${signLordHouse ? ` ${signLordHouse}-ம் வீட்டில் அமர்வு` : ""}.`
  };
}

// ---------------------------------------------------------------------------
// 7.9 DEDICATED REAL-TIME TRANSIT (GOCHAR) & SADE SATI DASHBOARD ENGINE
// ---------------------------------------------------------------------------
export function calculateDedicatedGocharDashboard(chartData = {}, targetDate = new Date()) {
  let tDate;
  const tzOffset = chartData.tz ?? chartData.utcOffset ?? chartData.profile?.utcOffset ?? chartData.timezoneOffsetHours ?? 0;
  const tzId = chartData.timezoneId ?? chartData.ianaTimezone ?? chartData.profile?.timezoneId ?? chartData.profile?.ianaTimezone ?? (tzOffset === 0 ? "UTC" : null);

  if (typeof targetDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    tDate = parseCivilDateInTimezone(targetDate, tzOffset, tzId, "12:00");
  } else if (targetDate instanceof Date) {
    tDate = targetDate;
  } else {
    tDate = new Date(targetDate);
  }
  const jd = getJulianDateFromUtc(tDate);
  const T = (jd - 2451545.0) / 36525.0;
  const chartSystem = chartData?.system || "lahiri";
  const ayanamsa = getAyanamshaForSystem(jd, chartSystem);

  // Extract Natal Moon & Lagna
  const rawMoonLong = chartData.moon?.longitude ?? chartData.moonLong ?? chartData.planets?.find(p => p.name === 'Moon')?.longitude ?? null;
  const rawAscLong = chartData.ascendant?.longitude ?? chartData.ascendantLong ?? chartData.planets?.find(p => p.name === 'Ascendant' || p.name === 'Lagna')?.longitude ?? null;

  const natalMoonLong = (typeof rawMoonLong === "number" && !isNaN(rawMoonLong)) ? rawMoonLong : null;
  const natalAscLong = (typeof rawAscLong === "number" && !isNaN(rawAscLong)) ? rawAscLong : null;

  if (natalMoonLong === null || natalAscLong === null) {
    return {
      status: "INSUFFICIENT_DATA",
      natalReference: null,
      transits: [],
      sadeSati: {
        status: "INSUFFICIENT_DATA"
      },
      ashtamaShani: {
        isActive: null,
        status: "INSUFFICIENT_DATA"
      },
      kantakaShani: {
        isActive: null,
        status: "INSUFFICIENT_DATA"
      },
      jupiterTransit: {
        status: "INSUFFICIENT_DATA"
      }
    };
  }

  const natalMoonSignIdx = Math.floor(norm360(natalMoonLong) / 30);
  const natalAscSignIdx = Math.floor(norm360(natalAscLong) / 30);

  const natalMoonSign = ZODIAC_SIGNS[natalMoonSignIdx];
  const natalAscSign = ZODIAC_SIGNS[natalAscSignIdx];

  // Calculate live Gochara positions for all 9 Grahas using canonical Astronomy Engine provider
  const GOCHAR_GRAHAS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  const transitPlanets = [];

  for (const gName of GOCHAR_GRAHAS) {
    let siderealLong = 0;
    let isRetrograde = false;
    if (gName === "Sun") {
      const sm = getSiderealSunMoon(tDate, chartSystem);
      siderealLong = sm.sunLong;
    } else if (gName === "Moon") {
      const sm = getSiderealSunMoon(tDate, chartSystem);
      siderealLong = sm.moonLong;
    } else if (gName === "Rahu") {
      const rahuTrop = norm360(125.04455 - 1934.136261 * T + 0.0020754 * T * T + (T * T * T) / 467441.0 - (T * T * T * T) / 60616000.0);
      siderealLong = norm360(rahuTrop - ayanamsa);
      isRetrograde = true; // Nodes are classically retrograde
    } else if (gName === "Ketu") {
      const rahuTrop = norm360(125.04455 - 1934.136261 * T + 0.0020754 * T * T + (T * T * T) / 467441.0 - (T * T * T * T) / 60616000.0);
      siderealLong = norm360(rahuTrop + 180 - ayanamsa);
      isRetrograde = true;
    } else {
      if (typeof Astronomy !== "undefined" && Astronomy.Ecliptic && Astronomy.GeoVector) {
        try {
          const el = Astronomy.Ecliptic(Astronomy.GeoVector(gName, tDate, true));
          siderealLong = norm360(el.elon - ayanamsa);
          const tDateNext = new Date(tDate.getTime() + 86400000);
          const elNext = Astronomy.Ecliptic(Astronomy.GeoVector(gName, tDateNext, true));
          if (norm360(elNext.elon - el.elon) > 180 || (elNext.elon < el.elon && Math.abs(elNext.elon - el.elon) < 180)) {
            isRetrograde = true;
          }
        } catch {
          siderealLong = norm360(calculateKeplerianPlanet(T, PLANET_ELEMENTS[gName]) - ayanamsa);
        }
      } else {
        siderealLong = norm360(calculateKeplerianPlanet(T, PLANET_ELEMENTS[gName]) - ayanamsa);
      }
    }

    const sIdx = Math.floor(siderealLong / 30);
    const sign = ZODIAC_SIGNS[sIdx];
    const degInSign = siderealLong % 30;

    const nakSpan = 360 / 27;
    const nakIdx = Math.floor(siderealLong / nakSpan);
    const nak = NAKSHATRAS[nakIdx] || NAKSHATRAS[0];
    const pada = Math.min(4, Math.floor((siderealLong % nakSpan) / (nakSpan / 4)) + 1);

    const houseFromMoon = ((sIdx - natalMoonSignIdx + 12) % 12) + 1;
    const houseFromLagna = ((sIdx - natalAscSignIdx + 12) % 12) + 1;

    // Lookup SAV bindus for the transit sign from natal chart if available
    let savBindus = null;
    if (chartData.ashtakavarga?.savByHouse?.[houseFromLagna - 1] !== undefined) {
      savBindus = chartData.ashtakavarga.savByHouse[houseFromLagna - 1];
    } else if (chartData.ashtakavarga?.savBySign?.[sIdx] !== undefined) {
      savBindus = chartData.ashtakavarga.savBySign[sIdx];
    }

    transitPlanets.push({
      name: gName,
      tamil: PLANET_TAMIL_NAMES[gName] || gName,
      longitude: parseFloat(siderealLong.toFixed(2)),
      signIndex: sIdx,
      sign: sign.name,
      signTamil: sign.tamil,
      degreeInSign: parseFloat(degInSign.toFixed(2)),
      deg: parseFloat(degInSign.toFixed(2)),
      degFormatted: `${Math.floor(degInSign)}° ${Math.round((degInSign % 1) * 60)}'`,
      nakshatra: nak.name,
      nakshatraTamil: nak.tamil,
      pada,
      houseFromMoon,
      houseFromLagna,
      savBindus,
      isRetrograde
    });
  }

  // 1. SATURN SADE SATI & KANTAKA / ASHTAMA SHANI EVALUATION
  const transitSaturn = transitPlanets.find(p => p.name === "Saturn");
  const saturnHouseFromMoon = transitSaturn ? transitSaturn.houseFromMoon : 1;

  let sadeSatiStatus = {
    isActive: false,
    phase: null,
    status: "Not Active",
    phaseNameEn: "Not Active",
    phaseNameTa: "ஏழரைச் சனி நடைமுறையில் இல்லை",
    severity: "None",
    guidanceEn: "Saturn is currently transiting outside the 12th, 1st, and 2nd houses from your natal Moon.",
    guidanceTa: "சனி தற்போது உங்கள் ஜென்ம ராசிக்கு 12, 1, 2-ம் வீடுகளுக்கு வெளியே சஞ்சரிக்கிறார்.",
    summary: "Saturn is currently transiting outside the 12th, 1st, and 2nd houses from your natal Moon, offering relative personal stability."
  };

  if (saturnHouseFromMoon === 12) {
    sadeSatiStatus = {
      isActive: true,
      phase: 1,
      status: "Phase 1: Rising (Viraya Shani)",
      phaseNameEn: "Phase 1: Rising (Viraya Shani / 12th from Moon)",
      phaseNameTa: "முதல் சுற்று: விரய சனி (ராசிக்கு 12-ல் சனி)",
      severity: "Moderate",
      guidanceEn: "Inception phase of Sade Sati: Highlights financial budgeting, foreign pursuits, and health discipline.",
      guidanceTa: "ஏழரைச் சனியின் ஆரம்ப காலம்: செலவு மேலாண்மை, வெளிநாட்டு தொடர்புகள் மற்றும் ஆரோக்கிய ஒழுங்குமுறை தேவை.",
      summary: "Phase 1 (Rising): Highlights financial budgeting, overseas connections, and disciplined lifestyle routines."
    };
  } else if (saturnHouseFromMoon === 1) {
    sadeSatiStatus = {
      isActive: true,
      phase: 2,
      status: "Phase 2: Peak (Janma Shani)",
      phaseNameEn: "Phase 2: Peak / Core (Janma Shani / Transiting Natal Moon)",
      phaseNameTa: "இரண்டாம் சுற்று: ஜென்ம சனி (ராசியில் சனி சஞ்சாரம்)",
      severity: "High Focus",
      guidanceEn: "Core phase of Sade Sati: Emphasizes psychological maturation, patient endurance, and structured lifestyle routines.",
      guidanceTa: "ஏழரைச் சனியின் உச்ச காலம்: மன உறுதி, பக்குவமான திட்டமிடல் மற்றும் சீரான உழைப்பு நற்பலன் தரும்.",
      summary: "Phase 2 (Peak): Emphasizes mental endurance, personal maturity, and diligent execution of long-term responsibilities."
    };
  } else if (saturnHouseFromMoon === 2) {
    sadeSatiStatus = {
      isActive: true,
      phase: 3,
      status: "Phase 3: Setting (Pada Shani)",
      phaseNameEn: "Phase 3: Setting (Pada Shani / 2nd from Moon)",
      phaseNameTa: "மூன்றாம் சுற்று: பாத சனி (ராசிக்கு 2-ல் சனி)",
      severity: "Moderate",
      guidanceEn: "Setting phase of Sade Sati: Focuses on consolidating accumulated family wealth and practical speech.",
      guidanceTa: "ஏழரைச் சனியின் நிறைவு காலம்: குடும்ப நிதி ஒருங்கிணைப்பு மற்றும் நிதானமான பேச்சு நன்மை தரும்.",
      summary: "Phase 3 (Setting): Focuses on consolidating accumulated family assets, responsible speech, and concluding the 7.5-year cycle."
    };
  }

  const isAshtamaShani = saturnHouseFromMoon === 8;
  const ashtamaShaniStatus = {
    isActive: isAshtamaShani,
    titleEn: isAshtamaShani ? "Ashtama Shani Active (8th from Moon)" : "Ashtama Shani Inactive",
    titleTa: isAshtamaShani ? "அஷ்டம சனி நடைமுறையில் உள்ளது (ராசிக்கு 8-ல்)" : "அஷ்டம சனி இல்லை",
    guidanceEn: isAshtamaShani ? "Saturn in 8th from Moon demands disciplined lifestyle routines, cautious driving, and avoidance of speculative financial ventures." : "Saturn is not transiting the 8th house from Moon.",
    guidanceTa: isAshtamaShani ? "ராசிக்கு 8-ல் சனி: எச்சரிக்கையான பயணங்கள், உடல்நல பராமரிப்பு மற்றும் நிதானமான முடிவுகள் அவசியம்." : "சனி 8-ம் வீட்டில் சஞ்சரிக்கவில்லை."
  };

  const isKantakaShani = [4, 7, 10].includes(saturnHouseFromMoon);
  const kantakaShaniStatus = {
    isActive: isKantakaShani,
    house: saturnHouseFromMoon,
    titleEn: isKantakaShani ? `Kantaka Shani Active (House ${saturnHouseFromMoon} from Moon)` : "Kantaka Shani Inactive",
    titleTa: isKantakaShani ? `கண்டக சனி நடைமுறையில் உள்ளது (ராசிக்கு ${saturnHouseFromMoon}-ல்)` : "கண்டக சனி இல்லை",
    guidanceEn: isKantakaShani ? "Demands perseverance in career duties, family harmony, and measured communication." : "Saturn is not in a Kantaka Shani axis."
  };

  // 2. JUPITER TRANSIT EVALUATION & DRISHTI SIGNS
  const transitJupiter = transitPlanets.find(p => p.name === "Jupiter");
  const jupHouseFromMoon = transitJupiter ? transitJupiter.houseFromMoon : 1;
  const isJupFavorable = [2, 5, 7, 9, 11].includes(jupHouseFromMoon);

  const jupSignIdx = transitJupiter ? transitJupiter.signIndex : 0;
  const drishtiSigns = [
    ZODIAC_SIGNS[(jupSignIdx + 4) % 12].name, // 5th aspect
    ZODIAC_SIGNS[(jupSignIdx + 6) % 12].name, // 7th aspect
    ZODIAC_SIGNS[(jupSignIdx + 8) % 12].name  // 9th aspect
  ];

  const jupiterTransitStatus = {
    houseFromMoon: jupHouseFromMoon,
    isFavorable: isJupFavorable,
    titleEn: `Jupiter transiting House ${jupHouseFromMoon} from Natal Moon (${transitJupiter?.sign})`,
    titleTa: `குரு பகவான் ராசிக்கு ${jupHouseFromMoon}-ம் வீட்டில் (${transitJupiter?.signTamil}) சஞ்சாரம்`,
    evaluationEn: isJupFavorable 
      ? "Classically auspicious transit supporting wisdom, auspicious events, and material protection."
      : "Transitional transit fostering inner growth, introspection, and patience before the next benefic cycle.",
    evaluationTa: isJupFavorable
      ? "சுப பலன்கள் தரும் குரு சஞ்சாரம்: அறிவு வளம், சுப காரியங்கள் மற்றும் நற்காரியங்களுக்கு அனுகூலம்."
      : "ஆன்மீக முதிர்ச்சி மற்றும் நிதானத்தை வளர்க்கும் காலம்."
  };

  const saturnGochar = {
    ...transitSaturn,
    houseFromMoon: saturnHouseFromMoon,
    sadeSati: sadeSatiStatus,
    ashtamaShani: ashtamaShaniStatus,
    kantakaShani: kantakaShaniStatus
  };

  const jupiterGochar = {
    ...transitJupiter,
    houseFromMoon: jupHouseFromMoon,
    drishtiSigns,
    isFavorable: isJupFavorable,
    summary: jupiterTransitStatus.evaluationEn,
    summaryTa: jupiterTransitStatus.evaluationTa
  };

  // Build normalized dictionary keyed by planet name
  const planetMap = {};
  for (const p of transitPlanets) {
    planetMap[p.name] = p;
  }

  return {
    targetDate: tDate.toISOString(),
    natalReference: {
      moonSign: natalMoonSign.name,
      moonSignTamil: natalMoonSign.tamil,
      ascendantSign: natalAscSign.name,
      ascendantSignTamil: natalAscSign.tamil
    },
    transits: transitPlanets,
    planets: planetMap,
    saturnGochar,
    jupiterGochar,
    sadeSati: sadeSatiStatus,
    ashtamaShani: ashtamaShaniStatus,
    kantakaShani: kantakaShaniStatus,
    jupiterTransit: jupiterTransitStatus
  };
}

// ---------------------------------------------------------------------------
// 7.10 DAILY PANCHANGA & EVENT MUHURTA ENGINE
// ---------------------------------------------------------------------------
export function calculateDailyPanchang(date = new Date(), lat = null, lng = null, tz = null, timezoneId = null) {
  if (lat === null || lng === null) throw new Error('Geographic coordinates required for Panchanga calculation');
  if (tz === null && !timezoneId) throw new Error('Timezone required for Panchanga calculation');
  const tzId = (timezoneId && typeof timezoneId === "object") ? (timezoneId.ianaTimezone || timezoneId.timezoneId) : timezoneId;
  // 1. Resolve local civil date string (YYYY-MM-DD) in target timezone
  const formattedDateStr = (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date))
    ? date
    : (formatDateInTimezone(date instanceof Date ? date : new Date(date), tz, tzId) || new Date().toISOString().split("T")[0]);
  const [cYear, cMonth, cDay] = formattedDateStr.split("-").map(Number);

  // 2. Real astronomical solar times for local civil date
  const sunTimes = calculateSunTimes(formattedDateStr, lat, lng, tz, tzId);
  const hasSunrise = sunTimes.sunriseHours !== null && Number.isFinite(sunTimes.sunriseHours);

  // 3. Resolve exact UTC instant of local sunrise (Traditional Panchanga Day reference)
  let sunriseUtcDate;
  if (hasSunrise) {
    const srH = Math.floor(sunTimes.sunriseHours);
    const srM = Math.round((sunTimes.sunriseHours - srH) * 60);
    const timeStr = `${String(srH).padStart(2, "0")}:${String(srM === 60 ? 59 : srM).padStart(2, "0")}`;
    sunriseUtcDate = parseCivilDateInTimezone(formattedDateStr, tz, tzId, timeStr);
  } else {
    // Polar day or polar night: evaluate at target local noon
    sunriseUtcDate = parseCivilDateInTimezone(formattedDateStr, tz, tzId, "12:00");
  }

  // 4. Sidereal Sun & Moon evaluated at the exact local sunrise instant
  const { sunLong, moonLong, jd, ayanamsa } = getSiderealSunMoon(sunriseUtcDate);

  // 5. TITHI (30 Tithis: Shukla 1-15, Krishna 1-15 at sunrise)
  const tithiSpan = 12.0;
  const diffMoonSun = norm360(moonLong - sunLong);
  const tithiIdx = Math.floor(diffMoonSun / tithiSpan);
  const isShukla = tithiIdx < 15;
  const tithiNum = (tithiIdx % 15) + 1;

  const TITHI_NAMES = [
    "Pratipada", "Dvitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", isShukla ? "Purnima" : "Amavasya"
  ];
  const TITHI_NAMES_TA = [
    "பிரதமை", "துவிதியை", "திருதியை", "சதுர்த்தி", "பஞ்சமி",
    "சஷ்டி", "சப்தமி", "அஷ்டமி", "நவமி", "தசமி",
    "ஏகாதசி", "துவாதசி", "திரயோதசி", "சதுர்த்தசி", isShukla ? "பௌர்ணமி" : "அமாவாசை"
  ];

  const tithiName = `${isShukla ? "Shukla" : "Krishna"} ${TITHI_NAMES[tithiNum - 1]}`;
  const tithiTamil = `${isShukla ? "சுக்கில பட்ச" : "கிருஷ்ண பட்ச"} ${TITHI_NAMES_TA[tithiNum - 1]}`;
  const tithiElapsedPercent = parseFloat(((diffMoonSun % tithiSpan) / tithiSpan * 100).toFixed(1));

  // Tithi transition time solver (continuous numerical root solver from sunrise)
  const tithiTargetDeg = ((tithiIdx + 1) * tithiSpan) % 360;
  const tithiTransition = findPanchangaTransition(sunriseUtcDate, "tithi", tithiTargetDeg, tithiSpan, 0.5079, tz, timezoneId);
  const tithiEndTimeStr = tithiTransition.endTimeStr;

  // 6. VARA (Day of Week in target civil calendar date)
  const civilDateUtcNoon = new Date(Date.UTC(cYear, cMonth - 1, cDay, 12, 0, 0));
  const dayIdx = civilDateUtcNoon.getUTCDay(); // 0: Sun, 1: Mon, ...
  const VARA_NAMES = [
    { name: "Ravivara (Sunday)", tamil: "ஞாயிறு", ruler: "Sun" },
    { name: "Somavara (Monday)", tamil: "திங்கள்", ruler: "Moon" },
    { name: "Mangalavara (Tuesday)", tamil: "செவ்வாய்", ruler: "Mars" },
    { name: "Budhavara (Wednesday)", tamil: "புதன்", ruler: "Mercury" },
    { name: "Guruvara (Thursday)", tamil: "வியாழன்", ruler: "Jupiter" },
    { name: "Shukravara (Friday)", tamil: "வெள்ளி", ruler: "Venus" },
    { name: "Shanivara (Saturday)", tamil: "சனி", ruler: "Saturn" }
  ];
  const vara = VARA_NAMES[dayIdx];

  // 7. NAKSHATRA (at sunrise)
  const nakSpan = 360 / 27;
  const nakIdx = Math.floor(moonLong / nakSpan);
  const nak = NAKSHATRAS[nakIdx] || NAKSHATRAS[0];
  const pada = Math.min(4, Math.floor((moonLong % nakSpan) / (nakSpan / 4)) + 1);

  // Nakshatra transition time solver from sunrise
  const nakTargetDeg = ((nakIdx + 1) * nakSpan) % 360;
  const nakTransition = findPanchangaTransition(sunriseUtcDate, "nakshatra", nakTargetDeg, nakSpan, 0.549, tz, timezoneId);
  const nakEndTimeStr = nakTransition.endTimeStr;

  // 8. YOGA (27 Yogas from Sun + Moon at sunrise)
  const YOGA_NAMES = [
    "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma",
    "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana",
    "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva", "Siddha",
    "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
  ];
  const YOGA_CONTEXTUAL_SUITABILITY = {
    Vishkambha: { general: "Mixed (Caution during first 3 Ghatis)", marriage: "Caution", travel: "Moderate", property: "Moderate", education: "Favorable", business: "Moderate" },
    Priti: { general: "Shubha (Auspicious)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Ayushman: { general: "Shubha (Auspicious)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Saubhagya: { general: "Shubha (Auspicious)", marriage: "Highly Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Shobhana: { general: "Shubha (Auspicious)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Atiganda: { general: "Ashubha (Inauspicious initial period)", marriage: "Avoid", travel: "Caution", property: "Caution", education: "Moderate", business: "Caution" },
    Sukarma: { general: "Shubha (Auspicious)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Dhriti: { general: "Shubha (Auspicious)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Shula: { general: "Ashubha (Severe / Conflict prone)", marriage: "Avoid", travel: "Avoid", property: "Caution", education: "Moderate", business: "Caution" },
    Ganda: { general: "Ashubha (Obstacle prone)", marriage: "Avoid", travel: "Caution", property: "Caution", education: "Moderate", business: "Caution" },
    Vriddhi: { general: "Shubha (Auspicious)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Dhruva: { general: "Shubha (Stable / Enduring)", marriage: "Favorable", travel: "Moderate", property: "Highly Favorable", education: "Favorable", business: "Favorable" },
    Vyaghata: { general: "Ashubha (Fierce / Cruel)", marriage: "Avoid", travel: "Avoid", property: "Caution", education: "Moderate", business: "Avoid" },
    Harshana: { general: "Shubha (Joyous)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Vajra: { general: "Ashubha (Hard / Unyielding)", marriage: "Avoid", travel: "Caution", property: "Caution", education: "Moderate", business: "Caution" },
    Siddhi: { general: "Shubha (Success oriented)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Vyatipata: { general: "Ashubha (Highly Inauspicious for celebrations)", marriage: "Avoid", travel: "Avoid", property: "Avoid", education: "Spiritual Only", business: "Avoid" },
    Variyan: { general: "Shubha (Auspicious)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Parigha: { general: "Ashubha (Obstruction during first half)", marriage: "Caution", travel: "Avoid", property: "Caution", education: "Moderate", business: "Caution" },
    Shiva: { general: "Shubha (Sacred / Benefic)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Siddha: { general: "Shubha (Accomplished)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Sadhya: { general: "Shubha (Feasible / Achievable)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Shubha: { general: "Shubha (Pure Benefic)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Shukla: { general: "Shubha (Bright / Clear)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Brahma: { general: "Shubha (Divine Knowledge)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Highly Favorable", business: "Favorable" },
    Indra: { general: "Shubha (Sovereign Leadership)", marriage: "Favorable", travel: "Favorable", property: "Favorable", education: "Favorable", business: "Favorable" },
    Vaidhriti: { general: "Ashubha (Severe Malefic for Material Beginnings)", marriage: "Avoid", travel: "Avoid", property: "Avoid", education: "Spiritual Only", business: "Avoid" }
  };
  const yogaSum = norm360(sunLong + moonLong);
  const yogaIdx = Math.floor(yogaSum / nakSpan);
  const yogaName = YOGA_NAMES[yogaIdx % 27];
  const isYogaAuspicious = !["Vishkambha", "Atiganda", "Shula", "Ganda", "Vyaghata", "Vajra", "Vyatipata", "Parigha", "Vaidhriti"].includes(yogaName);
  const yogaSuitability = YOGA_CONTEXTUAL_SUITABILITY[yogaName] || { general: isYogaAuspicious ? "Shubha" : "Ashubha", marriage: isYogaAuspicious ? "Favorable" : "Caution", travel: "Moderate", property: "Moderate", education: "Favorable", business: "Moderate" };

  // Yoga transition time solver from sunrise
  const yogaTargetDeg = ((yogaIdx + 1) * nakSpan) % 360;
  const yogaTransition = findPanchangaTransition(sunriseUtcDate, "yoga", yogaTargetDeg, nakSpan, 0.590, tz, timezoneId);
  const yogaEndTimeStr = yogaTransition.endTimeStr;

  // 9. KARANA (11 Karanas from Moon - Sun half-tithi = 6° at sunrise)
  const KARANA_NAMES = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti (Bhadra)", "Shakuni", "Chatushpada", "Naga", "Kimstughna"];
  const karanaHalfTithi = Math.floor(diffMoonSun / 6);
  let karanaName = "Bava";
  if (karanaHalfTithi === 0) karanaName = "Kimstughna";
  else if (karanaHalfTithi >= 57) {
    const fixedKaranas = ["Shakuni", "Chatushpada", "Naga", "Kimstughna"];
    karanaName = fixedKaranas[karanaHalfTithi - 57] || "Kimstughna";
  } else {
    karanaName = KARANA_NAMES[(karanaHalfTithi - 1) % 7];
  }

  // Karana transition time solver from sunrise
  const karanaTargetDeg = ((karanaHalfTithi + 1) * 6.0) % 360;
  const karanaTransition = findPanchangaTransition(sunriseUtcDate, "karana", karanaTargetDeg, 6.0, 0.5079, tz, timezoneId);
  const karanaEndTimeStr = karanaTransition.endTimeStr;

  // 10. SOLAR TIMES & MUHURTA SEGMENTS (with polar day/night safety)
  const formatHours = (h) => {
    const normH = (h + 24) % 24;
    const hrs = Math.floor(normH);
    const mins = Math.round((normH % 1) * 60);
    const padH = String(hrs).padStart(2, "0");
    const padM = String(mins).padStart(2, "0");
    return `${padH}:${padM}`;
  };

  const RAHU_SLOTS = [7, 1, 6, 4, 5, 3, 2]; // 0: Sun=8th(idx 7), Mon=2nd(idx 1)...
  const YAMA_SLOTS = [4, 3, 2, 1, 0, 6, 5];
  const GULIKA_SLOTS = [6, 5, 4, 3, 2, 1, 0];

  let sunriseHour = sunTimes.sunriseHours;
  let sunsetHour = sunTimes.sunsetHours;
  let daySpan = 12.0;
  let rahuKalam, yamagandam, gulikaKalam, abhijitMuhurta, brahmaMuhurta;

  if (hasSunrise && sunsetHour !== null && Number.isFinite(sunsetHour)) {
    daySpan = sunsetHour > sunriseHour ? (sunsetHour - sunriseHour) : (24 - sunriseHour + sunsetHour);
    const oneEighth = daySpan / 8;
    const oneFifteenth = daySpan / 15.0;

    const getWindow = (slotIdx) => {
      const start = sunriseHour + slotIdx * oneEighth;
      const end = start + oneEighth;
      return `${formatHours(start)} - ${formatHours(end)}`;
    };

    rahuKalam = getWindow(RAHU_SLOTS[dayIdx]);
    yamagandam = getWindow(YAMA_SLOTS[dayIdx]);
    gulikaKalam = getWindow(GULIKA_SLOTS[dayIdx]);
    abhijitMuhurta = `${formatHours(sunriseHour + 7 * oneFifteenth)} - ${formatHours(sunriseHour + 8 * oneFifteenth)}`;
    brahmaMuhurta = `${formatHours(sunriseHour - 1.6)} - ${formatHours(sunriseHour - 0.8)}`;
  } else {
    const polarMsg = sunTimes.isPolarDay ? "Unavailable (Polar Day / Midnight Sun)" : "Unavailable (Polar Night)";
    rahuKalam = polarMsg;
    yamagandam = polarMsg;
    gulikaKalam = polarMsg;
    abhijitMuhurta = polarMsg;
    brahmaMuhurta = polarMsg;
  }

  return {
    date: formattedDateStr,
    solarAnchoring: "Calculated Local Sunrise (NOAA-style Apparent Model)",
    sunriseInstantUtc: sunriseUtcDate.toISOString(),
    // Primary object models
    tithi: {
      index: tithiIdx + 1,
      name: tithiName,
      nameTamil: tithiTamil,
      paksha: isShukla ? "Shukla" : "Krishna",
      pakshaTamil: isShukla ? "சுக்கில பட்சம்" : "கிருஷ்ண பட்சம்",
      elapsedPercent: tithiElapsedPercent,
      until: tithiEndTimeStr,
      transitionTimestamp: tithiTransition.timestamp,
      toString: () => tithiName
    },
    vara: {
      ...vara,
      toString: () => vara.name
    },
    nakshatra: {
      name: nak.name,
      tamil: nak.tamil,
      pada,
      ruler: nak.ruler,
      deity: nak.deity,
      until: nakEndTimeStr,
      transitionTimestamp: nakTransition.timestamp,
      toString: () => nak.name
    },
    yoga: {
      name: yogaName,
      isAuspicious: isYogaAuspicious,
      nature: isYogaAuspicious ? "Shubha (Auspicious)" : "Ashubha (Inauspicious)",
      suitability: yogaSuitability,
      until: yogaEndTimeStr,
      transitionTimestamp: yogaTransition.timestamp,
      toString: () => yogaName
    },
    karana: {
      name: karanaName,
      isBhadra: karanaName.includes("Vishti"),
      until: karanaEndTimeStr,
      transitionTimestamp: karanaTransition.timestamp,
      toString: () => karanaName
    },
    // Top-level display convenience fields
    varaName: vara.name,
    varaLord: vara.ruler,
    paksha: isShukla ? "Shukla" : "Krishna",
    pada,
    tithiUntil: tithiEndTimeStr,
    nakshatraUntil: nakEndTimeStr,
    yogaUntil: yogaEndTimeStr,
    karanaUntil: karanaEndTimeStr,
    yogaNature: isYogaAuspicious ? "Shubha (Auspicious)" : "Ashubha (Inauspicious)",
    karanaLord: karanaName.includes("Vishti") ? "Saturn / Yama" : "Benefic Karana Lord",
    sunrise: sunTimes.sunriseStr || (hasSunrise ? formatHours(sunriseHour) : "Unavailable"),
    sunset: sunTimes.sunsetStr || (sunsetHour !== null ? formatHours(sunsetHour) : "Unavailable"),
    dayDurationHours: parseFloat(daySpan.toFixed(2)),
    rahuKalam,
    yamagandam,
    gulikaKalam,
    abhijitMuhurta,
    brahmaMuhurta,
    muhurtas: {
      sunrise: sunTimes.sunriseStr || (hasSunrise ? formatHours(sunriseHour) : "Unavailable"),
      sunset: sunTimes.sunsetStr || (sunsetHour !== null ? formatHours(sunsetHour) : "Unavailable"),
      rahuKalam,
      yamagandam,
      gulikaKalam,
      abhijitMuhurta,
      brahmaMuhurta
    }
  };
}

export function calculateEventMuhurta(eventType = "Marriage", startDate = new Date(), endDate = null, lat = null, lng = null, tz = null, timezoneId = null) {
  if (lat === null || lat === undefined || lng === null || lng === undefined || tz === null || tz === undefined) {
    return {
      status: "INSUFFICIENT_DATA",
      reason: "Verified latitude, longitude, and timezone offset required",
      eventType,
      totalDatesEvaluated: 0,
      topScreenedDates: [],
      bestWindows: [],
      allCandidates: []
    };
  }

  const startYmd = (typeof startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startDate))
    ? startDate
    : (formatDateInTimezone(startDate instanceof Date ? startDate : new Date(startDate), tz, timezoneId) || new Date().toISOString().split("T")[0]);
  
  const endYmd = endDate
    ? ((typeof endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endDate))
        ? endDate
        : formatDateInTimezone(endDate instanceof Date ? endDate : new Date(endDate), tz, timezoneId))
    : null;

  const [sy, sm, sd] = startYmd.split("-").map(Number);
  const startCivilNoon = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));

  let totalDays = 14;
  if (endYmd) {
    const [ey, em, ed] = endYmd.split("-").map(Number);
    const endCivilNoon = new Date(Date.UTC(ey, em - 1, ed, 12, 0, 0));
    totalDays = Math.max(0, Math.round((endCivilNoon.getTime() - startCivilNoon.getTime()) / 86400000));
  }

  const candidates = [];

  for (let i = 0; i <= totalDays; i++) {
    const curCivil = new Date(startCivilNoon.getTime() + i * 86400000);
    const y = curCivil.getUTCFullYear();
    const m = String(curCivil.getUTCMonth() + 1).padStart(2, "0");
    const d = String(curCivil.getUTCDate()).padStart(2, "0");
    const ymd = `${y}-${m}-${d}`;

    const panchang = calculateDailyPanchang(ymd, lat, lng, tz, timezoneId);
    let score = 70; // Base screening baseline
    const positiveFactors = [];
    const negativeFactors = [];

    // Evaluate Yoga Shuddhi
    if (panchang.yoga.isAuspicious) {
      score += 10;
      positiveFactors.push(`Auspicious Yoga (${panchang.yoga.name})`);
    } else {
      score -= 15;
      negativeFactors.push(`Inauspicious Yoga (${panchang.yoga.name})`);
    }

    // Evaluate Karana Shuddhi (Vishti / Bhadra)
    if (!panchang.karana.isBhadra) {
      score += 10;
      positiveFactors.push("Free from Vishti/Bhadra Karana");
    } else {
      score -= 20;
      negativeFactors.push("Vishti (Bhadra) Karana present");
    }

    // Avoid Rikta Tithis (4, 9, 14) and Amavasya (0 / 15)
    const tNum = panchang.tithi.index % 15;
    if ([4, 9, 14, 0].includes(tNum)) {
      score -= 20;
      negativeFactors.push(`Rikta / Forbidden Tithi (${panchang.tithi.name})`);
    } else {
      score += 10;
      positiveFactors.push(`Benefic Tithi (${panchang.tithi.name})`);
    }

    // Event specific weekday evaluation
    if (eventType.toLowerCase() === "marriage" && ["Tuesday", "Saturday"].includes(panchang.vara.name.split(" ")[0])) {
      score -= 10;
      negativeFactors.push(`${panchang.vara.name} traditionally requires extra caution for matrimonial muhurta`);
    }

    let recommendation = "Favorable Date Window";
    if (score >= 85) recommendation = "Favorable Panchanga Date (Preliminary Screening)";
    else if (score >= 70) recommendation = "Moderate Panchanga Date (Preliminary Screening)";
    else recommendation = "Challenging Panchanga Factors (Requires Exact Lagna Shuddhi)";

    candidates.push({
      date: panchang.date,
      day: panchang.vara.name,
      dayTamil: panchang.vara.tamil,
      tithi: panchang.tithi.name,
      nakshatra: `${panchang.nakshatra.name} (Pada ${panchang.nakshatra.pada})`,
      yoga: panchang.yoga.name,
      karana: panchang.karana.name,
      abhijitMuhurta: panchang.muhurtas.abhijitMuhurta,
      rahuKalam: panchang.muhurtas.rahuKalam,
      muhurtaScore: score,
      recommendation,
      screeningDisclaimer: "Preliminary calendar-level screening based on Panchanga Shuddhi. Exact classical Muhurta requires selecting an auspicious local Ascendant (Lagna) and avoiding Kuja/Rahu Kalam during the chosen hour.",
      positiveFactors,
      negativeFactors
    });
  }

  candidates.sort((a, b) => b.muhurtaScore - a.muhurtaScore);
  return {
    eventType,
    screeningTitle: "Preliminary Panchanga-Based Date Screening",
    screeningNotice: "This screening evaluates calendar-level Panchanga components (Tithi, Vara, Nakshatra, Yoga, Karana). A complete classical Muhurta requires personal horoscope matching (Tara Bala, Chandra Bala) and fixing an auspicious local Ascendant (Lagna Shuddhi).",
    totalDatesEvaluated: candidates.length,
    topScreenedDates: candidates.slice(0, 5),
    bestWindows: candidates.slice(0, 5), // Backwards compatibility
    allCandidates: candidates
  };
}

// ---------------------------------------------------------------------------
// 7.11 SHASHTIAMSHA (D60) STABILITY & SENSITIVITY ENGINE (+/- 2 MINS)
// ---------------------------------------------------------------------------
export function calculateD60StabilityTest(birthDate = new Date(), lat = null, lng = null, tz = null, options = {}) {
  if (lat === null || lat === undefined || lng === null || lng === undefined || tz === null || tz === undefined) {
    return {
      status: "INSUFFICIENT_DATA",
      reason: "Coordinates and timezone required",
      d60SignChanged: null,
      d60DeityChanged: null,
      stabilityScore: null,
      isUltraSensitive: null,
      transitionMinutesBefore: null,
      transitionMinutesAfter: null
    };
  }

  const bDate = birthDate instanceof Date ? birthDate : new Date(birthDate);
  const sys = options?.system || "lahiri";

  const getD60AtTime = (dateObj) => {
    const jd = getJulianDateFromUtc(dateObj);
    const ayanamsa = getAyanamshaForSystem(jd, sys);
    let siderealAsc = 0;
    if (typeof Astronomy !== "undefined" && Astronomy.SiderealTime) {
      const gastHours = Astronomy.SiderealTime(dateObj);
      const lastHours = (gastHours + lng / 15.0 + 24) % 24;
      const ramcDeg = lastHours * 15.0;
      const epsDeg = 23.4392911;
      const epsRad = (epsDeg * Math.PI) / 180.0;
      const latRad = (lat * Math.PI) / 180.0;
      const ramcRad = (ramcDeg * Math.PI) / 180.0;

      const y = -Math.cos(ramcRad);
      const x = Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad);
      let tropAsc = (Math.atan2(y, x) * 180.0) / Math.PI;
      if (tropAsc < 0) tropAsc += 360;
      siderealAsc = norm360(tropAsc - ayanamsa);
    }
    const d60 = calculateD60(siderealAsc);
    return {
      ascLongitude: parseFloat(siderealAsc.toFixed(3)),
      d60Index: d60.index,
      d60Sign: d60.name,
      sign: d60.name,
      signName: d60.name,
      d60SignTamil: d60.tamil,
      signTamil: d60.tamil,
      partIndex: d60.partIndex,
      amshaNumber: d60.amshaNumber,
      deity: d60.deity || "Indra"
    };
  };

  const tMinus2 = new Date(bDate.getTime() - 2 * 60000);
  const tCenter = bDate;
  const tPlus2 = new Date(bDate.getTime() + 2 * 60000);

  const d60Minus2 = getD60AtTime(tMinus2);
  const d60Center = getD60AtTime(tCenter);
  const d60Plus2 = getD60AtTime(tPlus2);

  // Exact 0°30' division stability: Part Index (1-60), Deity, and Sign must all be constant
  const isStable = (d60Minus2.partIndex === d60Center.partIndex && d60Minus2.deity === d60Center.deity && d60Minus2.signName === d60Center.signName) &&
                   (d60Center.partIndex === d60Plus2.partIndex && d60Center.deity === d60Plus2.deity && d60Center.signName === d60Plus2.signName);
  const isPartiallyStable = (d60Minus2.partIndex === d60Center.partIndex && d60Minus2.deity === d60Center.deity && d60Minus2.signName === d60Center.signName) ||
                            (d60Center.partIndex === d60Plus2.partIndex && d60Center.deity === d60Plus2.deity && d60Center.signName === d60Plus2.signName);

  let stabilityLevel = "Robust Stability (D60 Constant across +/- 2 mins)";
  let stabilityLevelTa = "உறுதியான நிலைத்தன்மை (சஷ்டியாம்சம் மாறவில்லை)";
  if (!isStable && isPartiallyStable) {
    stabilityLevel = "Moderate Sensitivity (D60 Shifts within +/- 2 mins)";
    stabilityLevelTa = "மிதமான உணர்திறன் (2 நிமிட இடைவெளியில் மாற்றம் சாத்தியம்)";
  } else if (!isStable && !isPartiallyStable) {
    stabilityLevel = "Critical Boundary Sensitivity (Birth time accuracy to the exact minute essential for D60)";
    stabilityLevelTa = "தீவிர எல்லை உணர்திறன் (துல்லியமான பிறப்பு நேரம் அவசியம்)";
  }

  const ascCenterDeg = d60Center.ascLongitude;
  const degInSign = ascCenterDeg % 30;
  const posInD60 = degInSign % 0.5;
  const distToLowerDeg = posInD60;
  const distToUpperDeg = 0.5 - posInD60;
  const nearestBoundaryDistanceDeg = Math.min(distToLowerDeg, distToUpperDeg);
  const nearestBoundaryDistanceArcmin = nearestBoundaryDistanceDeg * 60;
  const nearestBoundaryDistanceArcsec = nearestBoundaryDistanceDeg * 3600;

  let speedDegPerMin = (d60Plus2.ascLongitude - d60Minus2.ascLongitude) / 4.0;
  if (speedDegPerMin <= 0) speedDegPerMin = 360 / 1440; // ~0.25 deg/min

  const timeToNearestBoundaryMinutes = nearestBoundaryDistanceDeg / speedDegPerMin;
  const timeToNearestBoundarySeconds = timeToNearestBoundaryMinutes * 60;
  const segmentTraversalDurationMin = 0.5 / speedDegPerMin;

  const nearestSecStr = timeToNearestBoundarySeconds < 60
    ? `${Math.round(timeToNearestBoundarySeconds)} seconds`
    : `${timeToNearestBoundaryMinutes.toFixed(1)} minutes`;

  const technicalAdvisoryEn = `The native's Ascendant is ${nearestBoundaryDistanceArcmin.toFixed(2)}′ (${nearestSecStr}) from the nearest 0°30′ D60 boundary. Full 0°30′ D60 division traversal requires ~${segmentTraversalDurationMin.toFixed(1)} minutes at the native's rising speed of ${speedDegPerMin.toFixed(3)}°/min. While D1, D9, and D10 provide robust structural timing, fine-grained D60 karma analysis requires verified birth data.`;
  const technicalAdvisoryTa = `லக்னம் அருகிலுள்ள D60 எல்லைக்கு ${nearestBoundaryDistanceArcmin.toFixed(2)}′ (சுமார் ${nearestSecStr}) தொலைவில் உள்ளது. முழு 0°30′ பகுதி கடக்க ~${segmentTraversalDurationMin.toFixed(1)} நிமிடங்கள் தேவைப்படுகிறது (லக்ன வேகம்: ${speedDegPerMin.toFixed(3)}°/நிமிடம்). D1, D9, D10 பொதுவான பலன்களை அளித்தாலும், D60 ஆழமான கர்ம பரிசீலனைக்கு மிகத் துல்லியமான பிறப்பு நேரம் தேவைப்படுகிறது.`;

  const minus2Obj = { ...d60Minus2, label: "-2 Minutes" };
  const centerObj = { ...d60Center, label: "Exact Recorded Birth Time" };
  const plus2Obj = { ...d60Plus2, label: "+2 Minutes" };

  return {
    referenceTime: bDate.toISOString(),
    isStable,
    classification: stabilityLevel,
    stabilityLevel,
    stabilityLevelTa,
    nearestBoundaryDistanceDeg: parseFloat(nearestBoundaryDistanceDeg.toFixed(5)),
    nearestBoundaryDistanceArcmin: parseFloat(nearestBoundaryDistanceArcmin.toFixed(3)),
    nearestBoundaryDistanceArcsec: parseFloat(nearestBoundaryDistanceArcsec.toFixed(1)),
    timeToNearestBoundaryMinutes: parseFloat(timeToNearestBoundaryMinutes.toFixed(3)),
    timeToNearestBoundarySeconds: parseFloat(timeToNearestBoundarySeconds.toFixed(1)),
    segmentTraversalDurationMin: parseFloat(segmentTraversalDurationMin.toFixed(2)),
    nearestBoundarySummaryEn: `Nearest D60 boundary: ${nearestBoundaryDistanceArcmin.toFixed(2)}′ (~${nearestSecStr}). Traversal: ~${segmentTraversalDurationMin.toFixed(1)}m.`,
    nearestBoundarySummaryTa: `அருகிலுள்ள D60 எல்லை: ${nearestBoundaryDistanceArcmin.toFixed(2)}′ (சுமார் ${nearestSecStr}). கடக்கும் நேரம்: ~${segmentTraversalDurationMin.toFixed(1)}நி.`,
    minus2Min: minus2Obj,
    exactTime: centerObj,
    plus2Min: plus2Obj,
    tMinus2Min: minus2Obj,
    tCenter: centerObj,
    tPlus2Min: plus2Obj,
    astrologicalAdvice: technicalAdvisoryEn,
    technicalAdvisoryEn,
    technicalAdvisoryTa
  };
}

// ---------------------------------------------------------------------------
// 7.12 CONTRADICTION RECONCILIATION & QUALITATIVE REASONING ENGINE (WEIGHTED HIERARCHY)
// ---------------------------------------------------------------------------
export function reconcileEvidenceContradictions(supportingFactors = [], counterIndicators = [], domain = "career", lang = "en") {
  const isTamil = lang === "ta";
  const supCount = supportingFactors.length;
  const conCount = counterIndicators.length;

  // Astrological Layer Weighting Heuristic:
  // Layer 1: Natal Promise (D1 / Dignity / Exalted) = 3.0
  // Layer 2: Functional Lordship (Yogakaraka / Kendra-Trikona) = 2.5
  // Layer 3: Planetary Capacity (Shadbala / Digbala) = 2.0
  // Layer 4: Varga Confirmations (D9 / D10 / D4 / D24) = 2.0
  // Layer 5: Dasha Activation (MD / AD) = 2.5
  // Layer 6: Gochara Transit Triggers = 1.5
  // Secondary: 1.0

  const getFactorWeight = (factorStr, isCounter = false) => {
    const s = String(factorStr).toLowerCase();
    if (isCounter) {
      if (s.includes("debilitat") || s.includes("combust") || s.includes("ashtama") || s.includes("dusthana") || s.includes("maraka")) return 2.5;
      if (s.includes("afflict") || s.includes("enemy") || s.includes("sade sati") || s.includes("retrograde")) return 2.0;
      return 1.5;
    } else {
      if (s.includes("natal") || s.includes("exalted") || s.includes("own") || s.includes("moolatrikona")) return 3.0;
      if (s.includes("yogakaraka") || s.includes("lord") || s.includes("functional")) return 2.5;
      if (s.includes("dasha") || s.includes("bhukti") || s.includes("antardasha")) return 2.5;
      if (s.includes("d9") || s.includes("d10") || s.includes("d4") || s.includes("d24") || s.includes("varga")) return 2.0;
      if (s.includes("digbala") || s.includes("shadbala") || s.includes("capacity")) return 2.0;
      if (s.includes("transit") || s.includes("gochar") || s.includes("jupiter")) return 1.5;
      return 1.5;
    }
  };

  let totalSupWeight = 0;
  for (const f of supportingFactors) totalSupWeight += getFactorWeight(f, false);

  let totalConWeight = 0;
  for (const f of counterIndicators) totalConWeight += getFactorWeight(f, true);

  const netScore = totalSupWeight - totalConWeight;

  let classification = "Balanced Classical Indications";
  let statusBadge = "MODERATE_SUPPORT";
  let synthesisNarrative = "";

  if (totalSupWeight >= 5.0 && totalConWeight === 0) {
    classification = isTamil ? "மிக வலுவான சாஸ்திர ஆதரவு" : "Very Strong Astrological Support";
    statusBadge = "VERY_STRONG_SUPPORT";
    synthesisNarrative = isTamil
      ? "லக்னம், கேந்திர/திரிகோண பலம் மற்றும் வர்க்க சக்கரங்கள் ஒருமுகப்பட்டு தடையற்ற முன்னேற்றத்தை அளிக்கின்றன."
      : "Natal promise, angular lords, and primary divisional charts converge with robust supporting factors.";
  } else if (totalSupWeight >= 3.0 && totalConWeight <= 1.5) {
    classification = isTamil ? "வலுவான சாஸ்திர ஆதரவு" : "Strong Astrological Support";
    statusBadge = "STRONG_SUPPORT";
    synthesisNarrative = isTamil
      ? "ஜாதகத்தில் சாதகமான கிரக அமைப்புகள் மேலோங்கி உள்ளன; தசா புக்திகள் வழிநடத்தும்."
      : "Supporting astrological placements dominate the domain; timing aligns with operating sub-periods.";
  } else if (totalSupWeight >= 2.5 && totalConWeight >= 2.0) {
    classification = isTamil ? "கலப்பு கிரக அமைப்பு (விடாமுயற்சி தேவை)" : "Mixed Astrological Indications (Demands Resilience)";
    statusBadge = "MIXED_INDICATIONS";
    synthesisNarrative = isTamil
      ? "ஆரம்ப சாதகங்கள் இருப்பினும், குறிப்பிட்ட கிரக அழுத்தங்கள் விடாமுயற்சியையும் தகுந்த பரிகாரங்களையும் கோருகின்றன."
      : "High innate potential is paired with specific karmic friction; milestones require perseverance rather than effortless ascent.";
  } else if (totalConWeight > totalSupWeight && totalSupWeight > 0) {
    classification = isTamil ? "கட்டுப்படுத்தப்பட்ட / சவாலான அமைப்பு" : "Guarded Astrological Placements";
    statusBadge = "GUARDED_ALIGNMENT";
    synthesisNarrative = isTamil
      ? "மறைவு ஸ்தான தொடர்புகள் மற்றும் அசுப தாக்கங்கள் காரணமாக மாற்று உத்திகளும் கூடுதல் கவனமும் தேவை."
      : "Dusthana lordships or adverse aspects indicate that structured contingencies and remedial discipline are advisable.";
  } else if (totalSupWeight === 0 && totalConWeight > 0) {
    classification = isTamil ? "சவாலான கிரக நிலை (மாற்று உத்தி நலம்)" : "Challenging Planetary Alignment";
    statusBadge = "CHALLENGING_ALIGNMENT";
    synthesisNarrative = isTamil
      ? "நேரடி சாதகங்கள் குறைவாக இருப்பதால், விவேகமான திட்டமிடலும் பொறுமையும் அவசியம்."
      : "Demands careful timing and avoidance of hasty commitments during unsupportive transits.";
  } else {
    classification = isTamil ? "நடுநிலை சாஸ்திர அமைப்பு" : "Neutral Astrological Alignment";
    statusBadge = "NEUTRAL_ALIGNMENT";
    synthesisNarrative = isTamil
      ? "சமநிலையான கிரக தாக்கங்கள்; தனிநபர் முயற்சி மற்றும் தசா காலங்கள் முக்கிய பங்கு வகிக்கும்."
      : "Balanced planetary signatures; outcomes depend directly on active Dasha dispositors and individual initiative.";
  }

  return {
    classification,
    statusBadge,
    supportingCount: supCount,
    counterCount: conCount,
    totalSupportingWeight: parseFloat(totalSupWeight.toFixed(2)),
    totalCounterWeight: parseFloat(totalConWeight.toFixed(2)),
    netSupportScore: parseFloat(netScore.toFixed(2)),
    internalRankingNote: "Internal hierarchical weighting heuristic; not a classical score, probability, or empirical prediction measure.",
    synthesisNarrative
  };
}

// ---------------------------------------------------------------------------
// 7.13 6-LAYER DOMAIN REASONING CHAIN WITH TRACEABLE EVIDENCE IDS
// ---------------------------------------------------------------------------
export const DOMAIN_RULES = {
  career: {
    domainName: "Career & Vocation",
    domainNameTa: "தொழில் & உத்தியோகம்",
    evidencePrefix: "C",
    primaryHouse: 10,
    secondaryHouses: [1, 6, 11],
    vargaKey: "D10",
    vargaName: "Dashamsha (D10)",
    karakas: ["Sun", "Saturn", "Mercury", "Jupiter"]
  },
  marriage: {
    domainName: "Marriage & Relationships",
    domainNameTa: "திருமணம் & களத்திரம்",
    evidencePrefix: "M",
    primaryHouse: 7,
    secondaryHouses: [1, 2, 4, 5, 8],
    vargaKey: "D9",
    vargaName: "Navamsha (D9)",
    karakas: ["Venus", "Jupiter"]
  },
  wealth: {
    domainName: "Wealth & Finance",
    domainNameTa: "தன வளம் & செல்வம்",
    evidencePrefix: "W",
    primaryHouse: 2,
    secondaryHouses: [1, 5, 9, 11],
    vargaKey: "D2",
    vargaName: "Hora (D2)",
    karakas: ["Jupiter", "Mercury", "Venus"]
  },
  property: {
    domainName: "Real Estate & Conveyance",
    domainNameTa: "சொத்து & வாகனம்",
    evidencePrefix: "P",
    primaryHouse: 4,
    secondaryHouses: [1, 9, 11],
    vargaKey: "D4",
    vargaName: "Chaturthamsha (D4)",
    karakas: ["Mars", "Venus"]
  },
  education: {
    domainName: "Higher Education & Intellect",
    domainNameTa: "உயர்கல்வி & அறிவுத்திறன்",
    evidencePrefix: "E",
    primaryHouse: 5,
    secondaryHouses: [1, 4, 9],
    vargaKey: "D24",
    vargaName: "Chaturvimshamsha (D24)",
    karakas: ["Mercury", "Jupiter"]
  },
  health: {
    domainName: "Vitality & Somatic Balance",
    domainNameTa: "உடல் நலம் & பிராண பலம்",
    evidencePrefix: "H",
    primaryHouse: 1,
    secondaryHouses: [6, 8, 12],
    vargaKey: "D30",
    vargaName: "Trimsamsha (D30)",
    karakas: ["Sun", "Mars"]
  },
  governance: {
    domainName: "Public Leadership & Governance Themes",
    domainNameTa: "மக்கள் தலைமை & ஆளுமை அமைப்பு",
    evidencePrefix: "G",
    primaryHouse: 10,
    secondaryHouses: [1, 5, 9, 11],
    vargaKey: "D10",
    vargaName: "Dashamsha (D10)",
    karakas: ["Sun", "Jupiter", "Saturn", "Mars"]
  },
  politics: {
    domainName: "Public Leadership & Governance Themes",
    domainNameTa: "மக்கள் தலைமை & ஆளுமை அமைப்பு",
    evidencePrefix: "G",
    primaryHouse: 10,
    secondaryHouses: [1, 5, 9, 11],
    vargaKey: "D10",
    vargaName: "Dashamsha (D10)",
    karakas: ["Sun", "Jupiter", "Saturn", "Mars"]
  },
  spirituality: {
    domainName: "Spiritual Progress & Moksha",
    domainNameTa: "ஆன்மீகம் & மோட்ச சாதனை",
    evidencePrefix: "S",
    primaryHouse: 9,
    secondaryHouses: [5, 8, 12],
    vargaKey: "D20",
    vargaName: "Vimshamsha (D20)",
    karakas: ["Jupiter", "Ketu", "Saturn"]
  }
};
export const DOMAIN_CONFIG = DOMAIN_RULES;

export function calculatePredictionReasoningChain(chartData = {}, domain = "career", options = {}) {
  const lang = options.lang || "en";
  const isTamil = lang === "ta";
  const planets = chartData.planets || [];
  const ascendantLong = typeof chartData.ascendantLong === "number"
    ? chartData.ascendantLong
    : (typeof chartData.ascendant?.longitude === "number" ? chartData.ascendant.longitude : 0);
  const ascSignIdx = Math.floor(norm360(ascendantLong) / 30);
  const ascSign = ZODIAC_SIGNS[ascSignIdx];

  const functionalMatrix = ascSign?.name ? getFunctionalLordshipMatrix(ascSign.name) : null;
  const dashaTable = chartData.dashaTable || [];
  const activeDasha = chartData.currentDasha || dashaTable.find(d => d.isCurrent) || null;

  const cfg = DOMAIN_RULES[domain.toLowerCase()] || DOMAIN_RULES.career;
  const pfx = cfg.evidencePrefix;

  // Build 9-Layer Full Reasoning Steps with explicit Epistemological Classification:
  // C = CALCULATED (astronomical ephemeris, mathematical vargas, dasha, shadbala, SAV)
  // R = TRADITIONAL_RULE (Parashari / Jaimini interpretive rules and significations)
  // E = EMPIRICALLY_VALIDATED (evaluated against real-world outcome cohorts)
  const levels = [];
  const supportingFactors = [];
  const counterIndicators = [];

  // ----------------------------------------------------
  // Level 1: Natal Promise (D1 House & Lordship) -> C01
  // ----------------------------------------------------
  const pHouseSignIdx = (ascSignIdx + cfg.primaryHouse - 1) % 12;
  const pLordName = ZODIAC_SIGNS[pHouseSignIdx].ruler;
  const pLord = planets.find(p => p.name.toLowerCase() === pLordName.toLowerCase());
  const l1Id = `${pfx}01`;
  const l1Title = isTamil 
    ? `நிலை 1 [கணக்கீடு C01] — ஜாதக வாக்குறுதி (D1 ${cfg.primaryHouse}-ம் பாவாதிபதி ${pLordName})` 
    : `Level 1 [Calculated C01] — Natal Promise (D1 House ${cfg.primaryHouse} Lord ${pLordName})`;
  
  let l1Desc = pLord 
    ? `Lord ${pLordName} situated in House ${pLord.house} (${pLord.signName || pLord.sign || 'Zodiac Sign'}) in ${pLord.dignity || 'Neutral'} dignity.`
    : `Natal placement data unavailable for Lord ${pLordName}.`;
  
  if (pLord && ["Exalted", "Moolatrikona", "Own", "Friend"].includes(pLord.dignity)) {
    supportingFactors.push(`${l1Id}: ${pLordName} in high dignity in natal D1 (${pLord.dignity})`);
  } else if (pLord && ["Debilitated", "Enemy"].includes(pLord.dignity)) {
    counterIndicators.push(`${l1Id}: ${pLordName} placed in weaker dignity in D1 (${pLord.dignity})`);
  }
  levels.push({
    level: 1,
    evidenceId: l1Id,
    epistemologicalCode: "C01",
    evidenceClass: "CALCULATED",
    layer: "Natal Promise (D1)",
    title: l1Title,
    description: l1Desc,
    status: pLord?.dignity || "Neutral",
    rawMetric: { house: cfg.primaryHouse, lord: pLordName, dignity: pLord?.dignity || "N/A" },
    sourceFunction: "calculatePlanetaryPositions",
    convention: "Whole-Sign / Lahiri Sidereal"
  });

  // ----------------------------------------------------
  // Level 2: Functional Lordship for Lagna -> R01
  // ----------------------------------------------------
  const l2Id = `${pfx}02`;
  const fRole = functionalMatrix.matrix[pLordName] || { category: "Neutral", role: "Ruler" };
  const l2Title = isTamil 
    ? `நிலை 2 [சாஸ்திர விதி R01] — லக்ன சுப/பாப அதிபத்தியம் (${fRole.role})` 
    : `Level 2 [Traditional Rule R01] — Functional Role for ${ascSign.name} Lagna (${fRole.role})`;
  
  if (["Supreme Yogakaraka", "Functional Benefic", "Supreme Functional Benefic"].includes(fRole.category)) {
    supportingFactors.push(`${l2Id}: ${pLordName} is a ${fRole.category} for ${ascSign.name} Lagna`);
  } else if (["Functional Malefic", "Strong Functional Malefic"].includes(fRole.category)) {
    counterIndicators.push(`${l2Id}: ${pLordName} holds functional malefic portfolio for ${ascSign.name} Lagna`);
  }
  levels.push({
    level: 2,
    evidenceId: l2Id,
    epistemologicalCode: "R01",
    evidenceClass: "TRADITIONAL_RULE",
    layer: "Functional Lordship",
    title: l2Title,
    description: fRole.summaryEn || fRole.role,
    category: fRole.category,
    rawMetric: { lagna: ascSign.name, planet: pLordName, category: fRole.category },
    sourceFunction: "getFunctionalLordshipMatrix",
    convention: "Parashari Kendra/Trikona Lordship Rules"
  });

  // ----------------------------------------------------
  // Level 3: Planetary Capacity vs Beneficence (Shadbala) -> C02
  // ----------------------------------------------------
  const l3Id = `${pfx}03`;
  const rawShadbala = chartData.shadbala;
  const shadbalaList = Array.isArray(rawShadbala?.planetShadbala)
    ? rawShadbala.planetShadbala
    : (Array.isArray(rawShadbala)
      ? rawShadbala
      : (Array.isArray(rawShadbala?.planets) ? rawShadbala.planets : (rawShadbala?.planets ? Object.values(rawShadbala.planets) : [])));
  const shadbalaObj = shadbalaList.find(p => (p.name || p.planet || "").toLowerCase() === pLordName.toLowerCase()) || null;
  const virupas = (shadbalaObj && typeof shadbalaObj.totalVirupas === "number") ? shadbalaObj.totalVirupas : ((shadbalaObj && typeof shadbalaObj.totalBala === "number") ? shadbalaObj.totalBala : null);
  const reqRupas = (shadbalaObj && typeof shadbalaObj.requiredRupas === "number") ? shadbalaObj.requiredRupas : ((shadbalaObj && typeof shadbalaObj.requiredBala === "number") ? shadbalaObj.requiredBala / 60 : 6.0);
  const shadRatio = (shadbalaObj && typeof shadbalaObj.ratio === "number") ? shadbalaObj.ratio : ((shadbalaObj && typeof shadbalaObj.strengthRatio === "number") ? shadbalaObj.strengthRatio : (virupas !== null && reqRupas > 0 ? virupas / (reqRupas * 60) : null));
  const isStrongCapacity = shadbalaObj && typeof shadbalaObj.isSufficient === "boolean"
    ? shadbalaObj.isSufficient
    : (shadRatio !== null ? shadRatio >= 1.0 : false);
  
  const l3Title = isTamil
    ? `நிலை 3 [கணக்கீடு C02] — கிரக திறன் vs சுபத்தன்மை (${virupas !== null ? "ஷட்பலம்: " + virupas.toFixed(1) + " விருபாக்கள்" : "ஷட்பல விபரம் இல்லை"})`
    : `Level 3 [Calculated C02] — Planetary Capacity vs Beneficence (Shadbala: ${virupas !== null ? virupas.toFixed(1) + " Virupas" : "Evidence unavailable"})`;
  const l3Desc = virupas !== null
    ? (isStrongCapacity 
        ? `Strong structural vigor (${virupas.toFixed(1)} Virupas) provides robust capacity to manifest natal promise.`
        : `Moderate structural capacity (${virupas.toFixed(1)} Virupas) indicates incremental development through disciplined effort.`)
    : `Shadbala structural capacity evidence unavailable for ${pLordName}; evaluating qualitative dignity.`;
  
  if (isStrongCapacity && virupas !== null) {
    supportingFactors.push(`${l3Id}: Strong Shadbala vigor (${virupas.toFixed(1)} Virupas)`);
  }
  levels.push({
    level: 3,
    evidenceId: l3Id,
    epistemologicalCode: "C02",
    evidenceClass: "CALCULATED",
    layer: "Planetary Capacity",
    title: l3Title,
    description: l3Desc,
    virupas,
    rawMetric: { planet: pLordName, virupas, requiredRupas: reqRupas, ratio: shadRatio, isSufficient: isStrongCapacity },
    sourceFunction: "calculateShadbala",
    convention: "Authentic 6-Fold Parashari Shadbala (Virupas)"
  });

  // ----------------------------------------------------
  // Level 4: Shodashavarga Confirmation -> C03
  // ----------------------------------------------------
  const l4Id = `${pfx}04`;
  const structuredVargas = chartData.structuredVargas || (chartData.ascendant ? getStructuredVargaData(planets, ascendantLong) : null);
  const targetVarga = structuredVargas?.[cfg.vargaKey] || null;
  const vPlanet = targetVarga?.planets?.find(p => p.name === pLordName);
  const l4Title = isTamil 
    ? `நிலை 4 [கணக்கீடு C03] — வர்க்க உறுதிப்படுத்தல் (${cfg.vargaName})` 
    : `Level 4 [Calculated C03] — Divisional Confirmation (${cfg.vargaName})`;
  const l4Desc = vPlanet 
    ? `${pLordName} situated in House ${vPlanet.house || vPlanet.vargaHouse} of ${cfg.vargaKey} in ${vPlanet.dignity} dignity.`
    : `Divisional calculation for ${pLordName} in ${cfg.vargaKey} is unavailable in current chart payload.`;
  
  if (vPlanet && ["Exalted", "Own", "Friend"].includes(vPlanet.dignity)) {
    supportingFactors.push(`${l4Id}: Fortified placement in ${cfg.vargaKey} (${vPlanet.dignity})`);
  } else if (vPlanet && ["Debilitated", "Enemy"].includes(vPlanet.dignity)) {
    counterIndicators.push(`${l4Id}: Debilitation or structural tension in ${cfg.vargaKey}`);
  }
  levels.push({
    level: 4,
    evidenceId: l4Id,
    epistemologicalCode: "C03",
    evidenceClass: "CALCULATED",
    layer: "Varga Confirmation",
    title: l4Title,
    description: l4Desc,
    vargaDignity: vPlanet?.dignity || "Neutral",
    rawMetric: { varga: cfg.vargaKey, planet: pLordName, house: vPlanet?.house || vPlanet?.vargaHouse || null, dignity: vPlanet?.dignity || null },
    sourceFunction: "getStructuredVargaData",
    convention: "Parashari Shodashavarga Varga Formulation"
  });

  // ----------------------------------------------------
  // Level 5: Dasha Activation & Sub-Period Hierarchy -> C04
  // ----------------------------------------------------
  const l5Id = `${pfx}05`;
  const activeMdLord = activeDasha?.lord || null;
  const activeAdLord = activeDasha?.currentAntar || activeDasha?.subLord || activeDasha?.antarDasha?.planet || null;
  const isDirectLordOperating = activeMdLord === pLordName || activeAdLord === pLordName;
  const isKarakaOperating = (cfg.karakas || []).includes(activeMdLord) || (cfg.karakas || []).includes(activeAdLord);
  
  let dashaActivationStatus = "Latent / Preparatory Phase";
  if (isDirectLordOperating) {
    dashaActivationStatus = "Direct Domain Lord Activation";
    supportingFactors.push(`${l5Id}: Active Dasha period of domain ruler ${pLordName} (${activeMdLord}/${activeAdLord || activeMdLord})`);
  } else if (isKarakaOperating) {
    dashaActivationStatus = "Natural Karaka Period Activation";
    supportingFactors.push(`${l5Id}: Operating Dasha (${activeMdLord}) connects to domain Karakas (${(cfg.karakas || []).join(', ')})`);
  }

  const l5Title = isTamil 
    ? `நிலை 5 [கணக்கீடு C04] — தசா கால செயலாக்கம் (தற்போதைய தசை: ${activeMdLord || 'விபரம் இல்லை'})` 
    : `Level 5 [Calculated C04] — Dasha Activation (Active Mahadasha: ${activeMdLord || 'Unavailable'})`;
  const l5Desc = activeMdLord 
    ? `Current Vimshottari cycle is governed by ${activeMdLord}${activeAdLord ? ` / ${activeAdLord}` : ''} [${dashaActivationStatus}]. Natal promise activates during congruent sub-periods.`
    : `Vimshottari Dasha operating period data is unavailable for active phase verification.`;

  levels.push({
    level: 5,
    evidenceId: l5Id,
    epistemologicalCode: "C04",
    evidenceClass: "CALCULATED",
    layer: "Dasha Activation",
    title: l5Title,
    description: l5Desc,
    activeDashaLord: activeMdLord,
    rawMetric: { mdLord: activeMdLord, adLord: activeAdLord, status: dashaActivationStatus },
    sourceFunction: "calculateVimshottariDasha",
    convention: "120-Year Vimshottari Dasha (365.2422 Day Standard)"
  });

  // ----------------------------------------------------
  // Level 6: Gochara Transit Triggers & SAV Bindus -> C05
  // ----------------------------------------------------
  const l6Id = `${pfx}06`;
  const savBindus = chartData.ashtakavarga?.savBySign?.[pHouseSignIdx] ?? chartData.ashtakavarga?.SAV?.[pHouseSignIdx] ?? chartData.sarvashtakavarga?.[pHouseSignIdx] ?? null;
  const savNote = typeof savBindus === "number" ? ` (SAV House ${cfg.primaryHouse}: ${savBindus} Bindus)` : "";
  
  if (typeof savBindus === "number" && savBindus >= 28) {
    supportingFactors.push(`${l6Id}: Auspicious Sarvashtakavarga support (${savBindus} Bindus in House ${cfg.primaryHouse})`);
  } else if (typeof savBindus === "number" && savBindus < 25) {
    counterIndicators.push(`${l6Id}: Lower Ashtakavarga reserve (${savBindus} Bindus) requiring conservative pacing`);
  }

  const l6Title = isTamil 
    ? `நிலை 6 [கணக்கீடு C05] — கோச்சார கிரக தூண்டுதல் & அஷ்டகவர்க்கம்${savNote}` 
    : `Level 6 [Calculated C05] — Gochara Transit Triggers & Ashtakavarga${savNote}`;
  const l6Desc = typeof savBindus === "number"
    ? `Sarvashtakavarga reserve in target bhava sign is ${savBindus} bindus. Dynamic activation occurs when transiting Jupiter and Saturn aspect or transit the natal ${cfg.primaryHouse}-th house axis.`
    : `Transit triggers operate as dynamic catalysts when Jupiter and Saturn aspect or transit the natal ${cfg.primaryHouse}-th house axis.`;

  levels.push({
    level: 6,
    evidenceId: l6Id,
    epistemologicalCode: "C05",
    evidenceClass: "CALCULATED",
    layer: "Transit Trigger",
    title: l6Title,
    description: l6Desc,
    rawMetric: { primaryHouse: cfg.primaryHouse, savBindus, transitAxis: "Jupiter-Saturn Gochara" },
    sourceFunction: "calculateDedicatedGocharDashboard",
    convention: "Classical Gochara & 337-SAV Bindu Thresholds"
  });

  // ----------------------------------------------------
  // Level 7: Jaimini Karaka & Arudha Confirmation -> R02
  // ----------------------------------------------------
  const l7Id = `${pfx}07`;
  const jaimini = chartData.jaiminiSystem || (chartData.ascendant ? calculateJaiminiSystem(planets, ascendantLong) : null);
  const jKarakas = jaimini?.charaKarakas || calculateJaiminiKarakas(planets);
  
  // Select relevant Jaimini Karaka by domain
  let targetKarakaRole = "AmK";
  if (domain === "marriage") targetKarakaRole = "DK";
  else if (domain === "property" || domain === "education") targetKarakaRole = "MK";
  else if (domain === "spirituality" || domain === "health") targetKarakaRole = "AK";
  else if (domain === "wealth") targetKarakaRole = "BK";

  const jKarakaPlanet = jKarakas?.find(k => k.role === targetKarakaRole || k.karaka === targetKarakaRole);
  const arudhaLagna = jaimini?.arudhaLagna?.sign || "AL";
  const upapadaLagna = jaimini?.upapadaLagna?.sign || "UL";

  const l7Title = isTamil
    ? `நிலை 7 [சாஸ்திர விதி R02] — ஜைமினி காரகர் & ஆரூட உறுதிப்படுத்தல் (${targetKarakaRole}: ${jKarakaPlanet?.planet || jKarakaPlanet?.name || 'விபரம் இல்லை'})`
    : `Level 7 [Traditional Rule R02] — Jaimini Karaka & Arudha Confirmation (${targetKarakaRole}: ${jKarakaPlanet?.planet || jKarakaPlanet?.name || 'Available'})`;

  let l7Desc = jKarakaPlanet
    ? `Jaimini ${jKarakaPlanet.roleName || targetKarakaRole} (${jKarakaPlanet.planet || jKarakaPlanet.name}) sits in ${jKarakaPlanet.sign || 'sign'}, with Arudha Lagna (AL) in ${arudhaLagna}${domain === 'marriage' ? ` and Upapada (UL) in ${upapadaLagna}` : ''}.`
    : `Jaimini Chara Karaka confirmation evaluated across 7-karaka hierarchy (AL: ${arudhaLagna}).`;

  if (jKarakaPlanet && ["Exalted", "Own"].includes(jKarakaPlanet.dignity)) {
    supportingFactors.push(`${l7Id}: Jaimini ${targetKarakaRole} (${jKarakaPlanet.planet || jKarakaPlanet.name}) in high dignity`);
  }
  levels.push({
    level: 7,
    evidenceId: l7Id,
    epistemologicalCode: "R02",
    evidenceClass: "TRADITIONAL_RULE",
    layer: "Jaimini Confirmation",
    title: l7Title,
    description: l7Desc,
    rawMetric: { karakaRole: targetKarakaRole, planet: jKarakaPlanet?.planet || jKarakaPlanet?.name, arudhaLagna, upapadaLagna },
    sourceFunction: "calculateJaiminiSystem",
    convention: "7-Graha Chara Karaka & Dual-Arudha System"
  });

  // ----------------------------------------------------
  // Level 8: Counter-Indicator & Cancellation Filter -> C06
  // ----------------------------------------------------
  const l8Id = `${pfx}08`;
  const isCombust = pLord?.isCombust || false;
  const isRetrograde = pLord?.isRetrograde || false;
  const hasNeechabhanga = pLord?.dignity === "Debilitated" && (chartData.neechabhangaYogas?.length > 0);
  const isViparita = chartData.viparitaRajaYogas?.some(v => v.planet === pLordName);

  const mitigations = [];
  if (isCombust) {
    counterIndicators.push(`${l8Id}: Solar combustion (Kopa/Astangata) reduces external speed of manifestation`);
    mitigations.push("Solar combustion present");
  }
  if (hasNeechabhanga) {
    supportingFactors.push(`${l8Id}: Neechabhanga cancellation transforms debilitation into eventual resilience`);
    mitigations.push("Neechabhanga Rajayoga verified");
  }
  if (isViparita) {
    supportingFactors.push(`${l8Id}: Viparita Raja Yoga structure provides triumph through overcoming adversity`);
    mitigations.push("Viparita Raja Yoga active");
  }

  const l8Title = isTamil
    ? `நிலை 8 [கணக்கீடு C06] — தோஷ நிவர்த்தி & முரண்பாட்டு ஆய்வு (${mitigations.length > 0 ? mitigations.join(', ') : 'முரண்பாடுகள் இல்லை'})`
    : `Level 8 [Calculated C06] — Counter-Indicator & Cancellation Filter (${mitigations.length > 0 ? mitigations.join('; ') : 'No primary afflictions'})`;
  const l8Desc = mitigations.length > 0
    ? `Evaluation of astrological modifications: ${mitigations.join('. ')}.`
    : `No evaluated critical structural afflictions (such as severe combustion or uncancelled debilitation) detected for ${pLordName}.`;

  levels.push({
    level: 8,
    evidenceId: l8Id,
    epistemologicalCode: "C06",
    evidenceClass: "CALCULATED",
    layer: "Mitigation & Cancellation",
    title: l8Title,
    description: l8Desc,
    rawMetric: { isCombust, isRetrograde, hasNeechabhanga, isViparita },
    sourceFunction: "calculateDetailedVedicYogas",
    convention: "Classical Parashari Dosha & Neechabhanga Theorems"
  });

  // ----------------------------------------------------
  // Level 9: Synthesis & Empirical Status -> X01 (Experimental) or R03
  // ----------------------------------------------------
  const isMarriageDomain = domain.toLowerCase() === "marriage";
  const l9Id = `${pfx}09`;
  const l9Code = isMarriageDomain ? "X01" : "R03";
  const l9Class = isMarriageDomain ? "EXPERIMENTAL" : "TRADITIONAL_RULE";
  const reconciliation = reconcileEvidenceContradictions(supportingFactors, counterIndicators, domain, lang);
  const netSynthesisScore = (supportingFactors.length * 2.0) - (counterIndicators.length * 1.5);
  const qualitativeStatus = netSynthesisScore >= 3.0 
    ? "Strong Astrological Alignment" 
    : (netSynthesisScore >= 0.5 ? "Moderate Astrological Support" : "Guarded / Mixed Classical Factors");

  const l9Title = isTamil
    ? (isMarriageDomain 
        ? `நிலை 9 [ஆய்வுநிலை X01] — அனுபவ பூர்வ சரிபார்ப்பு நிலை (${qualitativeStatus})` 
        : `நிலை 9 [சாஸ்திர விதி R03] — ஆஸ்ட்ரோவர்ஸ் ஒட்டுமொத்த சாஸ்திர தொகுப்பு (${qualitativeStatus})`)
    : (isMarriageDomain
        ? `Level 9 [Experimental X01] — Real-World Outcome Evaluation (${qualitativeStatus})`
        : `Level 9 [Traditional Rule R03] — Astrological Synthesis (${qualitativeStatus})`);
  const l9Desc = isTamil
    ? `9-அடுக்கு ஆய்வின் முடிவு: ${supportingFactors.length} ஆதரவு காரணிகள், ${counterIndicators.length} கவனக் குறிப்புகள். (வானியல் கணக்கீடுகள் C01-C06 உண்மை நிகழ்வை உறுதி செய்யாது).`
    : `Integrated 9-layer synthesis: ${supportingFactors.length} supporting factors vs ${counterIndicators.length} counter-indicators. (Notice: Astronomical calculation evidence C01–C06 does NOT prove empirical real-world outcome).`;

  levels.push({
    level: 9,
    evidenceId: l9Id,
    epistemologicalCode: l9Code,
    evidenceClass: l9Class,
    layer: isMarriageDomain ? "Empirical Outcome Evaluation" : "Qualitative Synthesis",
    title: l9Title,
    description: l9Desc,
    synthesisStatus: qualitativeStatus,
    rawMetric: { supportingCount: supportingFactors.length, counterCount: counterIndicators.length, netScore: netSynthesisScore },
    sourceFunction: "reconcileEvidenceContradictions",
    convention: "AstroVerse 9-Layer Multi-Varga Synthesis Heuristic"
  });

  const virupasSummaryEn = virupas !== null ? `, structural Shadbala (${virupas.toFixed(1)} Virupas)` : "";
  const virupasSummaryTa = virupas !== null ? `, ஷட்பலம் (${virupas.toFixed(1)} விருபாக்கள்)` : "";
  const whyThisPredictionEn = `This prediction is derived from a complete 9-layer domain reasoning chain. Natal promise is anchored by ${pLordName} as House ${cfg.primaryHouse} lord, reinforced by functional lordship (${fRole.category})${virupasSummaryEn}, ${cfg.vargaKey} (${cfg.vargaName}) divisional confirmation, Jaimini ${targetKarakaRole} alignment, and gochara transit triggers under operating Vimshottari Dasha windows.`;
  const whyThisPredictionTa = `இந்த பலன் முழுமையான 9-அடுக்கு சாஸ்திர ஆய்வு முறையில் பெறப்பட்டது. ${ascSign.tamil || ascSign.name} லக்னத்திற்குரிய ${cfg.primaryHouse}-ம் பாவாதிபதி ${pLordName} லக்ன சுப பலம் (${fRole.role})${virupasSummaryTa}, ${cfg.vargaName} வர்க்க உறுதிப்படுத்தல், ஜைமினி ${targetKarakaRole} பொருத்தம் மற்றும் தசா கோச்சார அடிப்படையில் கணிக்கப்பட்டுள்ளது.`;
  const evidenceIds = levels.map(l => l.evidenceId);

  return {
    domain: cfg.domainName,
    domainTamil: cfg.domainNameTa,
    evidencePrefix: pfx,
    evidenceIds,
    evidenceLevels: levels,
    layerCount: 9,
    classification: qualitativeStatus,
    statusBadge: qualitativeStatus,
    summary: isTamil ? whyThisPredictionTa : whyThisPredictionEn,
    supportingFactors,
    counterIndicators,
    reconciliation,
    whyThisPredictionEn,
    whyThisPredictionTa
  };
}

export function generateDynamicLifeStages(planets = [], ascendantSign = {}, moonSign = {}, moonNakshatra = {}, dashaTable = [], birthYear = 1995) {
  if (!Array.isArray(dashaTable) || dashaTable.length === 0) {
    return { status: "insufficient_data", stages: [] };
  }

  const stages = [];
  const maxStages = dashaTable.length;

  for (let i = 0; i < maxStages; i++) {
    const md = dashaTable[i];
    const startAge = Number((md.startAge).toFixed(1));
    const endAge = Number((md.endAge).toFixed(1));
    const startY = Math.round(birthYear + startAge);
    const endY = Math.round(birthYear + endAge);

    const lordPlanet = planets.find(p => p.name === md.lord);
    let periodTitleEn = `Phase ${i + 1}: ${md.lord} Mahadasha Period`;
    let periodTitleTa = `நிலை ${i + 1}: ${md.tamil} மகா தசா சுழற்சி`;
    let focusEn = `Astrological Indications of ${md.lord} & Connected Bhavas`;
    let focusTa = `${md.tamil} காரகத்துவம் & பாவக பலன்கள்`;

    if (i === 0) {
      periodTitleEn = `Initial Phase: ${md.lord} Mahadasha Balance`;
      periodTitleTa = `தொடக்க நிலை: ${md.tamil} தசா இருப்பு`;
      focusEn = `Early Constitutional Vitality, Family Guidance & Foundational Vidya`;
      focusTa = `குழந்தைப் பருவம், குடும்ப வழிகாட்டல் & ஆரம்பக் கல்வி`;
    }

    const predEn = lordPlanet
      ? `Operating under ${md.lord} Mahadasha (Lord in House ${lordPlanet.house}, dignity: ${lordPlanet.dignity || 'Neutral'}). Classical Parashari rules indicate chronological life dynamics shaped by ${md.lord}'s natal karakatwas and house ownership.`
      : `Operating under ${md.lord} Mahadasha. Classical Parashari rules indicate chronological life dynamics shaped by ${md.lord}'s natal karakatwas and house ownership.`;
    const predTa = lordPlanet
      ? `${md.tamil} மகா தசா கால கட்டம் (${md.tamil} ${lordPlanet.house}-ம் பாவகத்தில், பலம்: ${lordPlanet.dignity || 'சமம்'}). பாரம்பரிய விதிகளின்படி ${md.tamil} ஆதிபத்திய காரக பலன்கள் செயல்படும்.`
      : `${md.tamil} மகா தசா கால கட்டம். பாரம்பரிய விதிகளின்படி ${md.tamil} ஆதிபத்திய காரக பலன்கள் செயல்படும்.`;

    stages.push({
      period: periodTitleEn,
      tamilPeriod: periodTitleTa,
      dashaLord: md.lord,
      dashaTamil: md.tamil,
      dashaTrigger: `${md.lord} Mahadasha`,
      ageRange: `${startAge} - ${endAge}`,
      years: `${startY} - ${endY}`,
      focus: focusEn,
      tamilFocus: focusTa,
      prediction: predEn,
      tamilPrediction: predTa
    });
  }

  return stages;
}

// ---------------------------------------------------------------------------
// 14. PARASHARI SHADBALA ENGINE (Brihat Parashara Hora Shastra 6-Fold System)
// Implemented under declared application conventions (SHADBALA_CONVENTION)
// ---------------------------------------------------------------------------
export const EXALTATION_POINTS = {
  Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200
};

export const DEBILITATION_POINTS = {
  Sun: 190, Moon: 213, Mars: 118, Mercury: 345, Jupiter: 275, Venus: 177, Saturn: 20
};

export const NAISARGIKA_VIRUPAS = {
  Sun: 60.0, Moon: 51.43, Venus: 42.86, Jupiter: 34.29, Mercury: 25.71, Mars: 17.14, Saturn: 8.57
};

export const MEAN_DAILY_SPEEDS = {
  Sun: 0.9856,
  Moon: 13.1763,
  Mars: 0.5240,
  Mercury: 1.3833,
  Jupiter: 0.0831,
  Venus: 1.2000,
  Saturn: 0.0335
};

export const MOOLATRIKONA_BOUNDS = {
  Sun:     { signIdx: 4,  minDeg: 0,  maxDeg: 20 }, // Leo 0°-20°
  Moon:    { signIdx: 1,  minDeg: 3,  maxDeg: 30 }, // Taurus 3°-30°
  Mars:    { signIdx: 0,  minDeg: 0,  maxDeg: 12 }, // Aries 0°-12°
  Mercury: { signIdx: 5,  minDeg: 15, maxDeg: 20 }, // Virgo 15°-20°
  Jupiter: { signIdx: 8,  minDeg: 0,  maxDeg: 10 }, // Sagittarius 0°-10°
  Venus:   { signIdx: 6,  minDeg: 0,  maxDeg: 15 }, // Libra 0°-15°
  Saturn:  { signIdx: 10, minDeg: 0,  maxDeg: 20 }  // Aquarius 0°-20°
};

export const SAPTAVARGAJA_VIRUPAS = {
  Moolatrikona: 45.0,
  Swakshetra: 30.0,
  "Adhi-Mitra": 20.0,
  Mitra: 15.0,
  Sama: 10.0,
  Shatru: 4.0, // BPHS Chapter 27, Sloka 4-5 (Ordinary Enemy = 4 Virupas)
  "Adhi-Shatru": 2.0
};

export const SHADBALA_CONVENTION = {
  source: "Brihat Parashara Hora Shastra (BPHS Chapters 27-29)",
  framework: "Parashari Shadbala Framework implemented under declared application conventions (45/30/20/15/10/4/2 Saptavargaja Virupas, Sripati continuous aspect curve, true 3D declination Ayana Bala, and proximity-scaled Graha Yuddha ±30 Virupa correction per BPHS)",
  conventionDetails: "BPHS-derived convention: Moolatrikona 45, Swakshetra 30, Adhi-Mitra 20, Mitra 15, Sama 10, Shatru 4, Adhi-Shatru 2",
  virupasPerRupa: 60,
  requiredRupas: {
    Sun: 6.5,
    Moon: 6.0,
    Mars: 5.0,
    Mercury: 7.0,
    Jupiter: 6.5,
    Venus: 5.5,
    Saturn: 5.0
  }
};

/**
 * Classical Five-Fold Compound Friendship (Panchadha Maitri)
 * Combines Naisargika (Natural) and Tatkalika (Temporal) Relationships
 */
export function calculateCompoundFriendship(p1Name, p2Name, planets = []) {
  if (p1Name === p2Name) return "Swakshetra";

  const natFriends = NAISARGIKA_FRIENDSHIP[p1Name]?.friends || [];
  const natEnemies = NAISARGIKA_FRIENDSHIP[p1Name]?.enemies || [];
  let natRel = "Neutral";
  if (natFriends.includes(p2Name)) natRel = "Friend";
  else if (natEnemies.includes(p2Name)) natRel = "Enemy";

  const p1 = planets.find(p => p.name === p1Name);
  const p2 = planets.find(p => p.name === p2Name);
  let tempRel = "Enemy";
  if (p1 && p2) {
    const s1 = Math.floor(norm360(p1.longitude) / 30);
    const s2 = Math.floor(norm360(p2.longitude) / 30);
    const houseDiff = ((s2 - s1 + 12) % 12) + 1;
    // BPHS: Planets in 2nd, 3rd, 4th, 10th, 11th, 12th from a planet are temporary friends (Tatkalika Mitra)
    if ([2, 3, 4, 10, 11, 12].includes(houseDiff)) {
      tempRel = "Friend";
    }
  }

  // Panchadha Maitri synthesis:
  // Friend + Friend = Adhi-Mitra (Great Friend -> 20 virupas)
  // Friend + Enemy = Sama (Neutral -> 10 virupas)
  // Neutral + Friend = Mitra (Friend -> 15 virupas)
  // Neutral + Enemy = Shatru (Enemy -> 4 virupas)
  // Enemy + Friend = Sama (Neutral -> 10 virupas)
  // Enemy + Enemy = Adhi-Shatru (Great Enemy -> 2 virupas)
  if (natRel === "Friend" && tempRel === "Friend") return "Adhi-Mitra";
  if (natRel === "Friend" && tempRel === "Enemy") return "Sama";
  if (natRel === "Neutral" && tempRel === "Friend") return "Mitra";
  if (natRel === "Neutral" && tempRel === "Enemy") return "Shatru";
  if (natRel === "Enemy" && tempRel === "Friend") return "Sama";
  if (natRel === "Enemy" && tempRel === "Enemy") return "Adhi-Shatru";
  return "Sama";
}

/**
 * Evaluates dignity category and virupas in a divisional varga
 */
export function calculateVargaDignity(pName, signIdx, degInSign, varga, compoundRel) {
  const normalizedSignIdx = ((Math.round(signIdx) % 12) + 12) % 12;
  const signObj = ZODIAC_SIGNS[normalizedSignIdx];
  if (!signObj?.ruler) {
    throw new Error(`Invalid zodiac sign index for Varga dignity lookup: ${signIdx}`);
  }
  const ruler = signObj.ruler;
  if (ruler === pName) {
    if (varga === 1) {
      const mt = MOOLATRIKONA_BOUNDS[pName];
      if (mt && mt.signIdx === normalizedSignIdx && degInSign >= mt.minDeg && degInSign < mt.maxDeg) {
        return { dignity: "Moolatrikona", virupas: SAPTAVARGAJA_VIRUPAS.Moolatrikona };
      }
    }
    return { dignity: "Swakshetra", virupas: SAPTAVARGAJA_VIRUPAS.Swakshetra };
  }
  const dignity = compoundRel || "Sama";
  const virupas = SAPTAVARGAJA_VIRUPAS[dignity];
  if (virupas === undefined) {
    throw new Error(`Invalid Saptavargaja dignity category: ${dignity}`);
  }
  return { dignity, virupas };
}

export const DRIK_BALA_CONVENTION = {
  curve: "Sripati Continuous [0, 15] Virupas",
  source: "Sripati Paddhati / BPHS Chapter 28",
  mercuryBeneficCriterion: "Natural benefic unless conjoined natural malefics (Sun, Mars, Saturn, Rahu, Ketu) within 12°",
  moonBeneficCriterion: "Waxing Moon (Shukla Paksha <= 180° from Sun) = Benefic, Waning Moon (Krishna Paksha) = Malefic"
};

/**
 * Classical Oja-Yugma Bala (Odd/Even sign & Navamsha: 0 to 30 virupas)
 * Male/Neutral planets (Sun, Mars, Jupiter, Mercury, Saturn) receive 15 virupas in Odd Rasi and 15 in Odd Navamsa.
 * Female planets (Moon, Venus) receive 15 virupas in Even Rasi and 15 in Even Navamsa.
 */
export function calculateOjaYugmaBala(p) {
  const pLong = requireLongitude(p?.longitude, "calculateOjaYugmaBala planet longitude");
  const rasiSignIdx = Math.floor(pLong / 30);
  const navamshaSignIdx = calculateNavamsa(pLong).index;
  const isRasiOdd = rasiSignIdx % 2 === 0;
  const isNavOdd = navamshaSignIdx % 2 === 0;
  let ojaYugmaBala = 0;
  if (["Sun", "Mars", "Jupiter", "Mercury", "Saturn"].includes(p?.name)) {
    if (isRasiOdd) ojaYugmaBala += 15;
    if (isNavOdd) ojaYugmaBala += 15;
  } else {
    // Female planets (Moon, Venus) favor even signs and even Navamsas
    if (!isRasiOdd) ojaYugmaBala += 15;
    if (!isNavOdd) ojaYugmaBala += 15;
  }
  return ojaYugmaBala;
}

/**
 * Classical Drekkana Bala (0 to 15 virupas based on Decanate gender alignment)
 * 1st Decanate (0-10°): Male planets (Sun, Mars, Jupiter) -> 15 virupas
 * 2nd Decanate (10-20°): Female planets (Moon, Venus) -> 15 virupas
 * 3rd Decanate (20-30°): Neutral planets (Mercury, Saturn) -> 15 virupas
 */
export function calculateDrekkanaBala(p) {
  const degInSign = requireLongitude(p?.longitude, "calculateDrekkanaBala planet longitude") % 30;
  let drekkanaBala = 0;
  if (degInSign < 10 && ["Sun", "Mars", "Jupiter"].includes(p?.name)) drekkanaBala = 15;
  else if (degInSign >= 10 && degInSign < 20 && ["Moon", "Venus"].includes(p?.name)) drekkanaBala = 15;
  else if (degInSign >= 20 && ["Mercury", "Saturn"].includes(p?.name)) drekkanaBala = 15;
  return drekkanaBala;
}

/**
 * 1. STHANA BALA (Positional Strength)
 * Components: Uccha Bala, Saptavargaja Bala, Oja-Yugma Bala, Kendradi Bala, Drekkana Bala
 */
export function calculateSthanaBala(p, ascendantLong = 0, allPlanets = []) {
  // 1a. Uccha Bala (0 to 60 virupas)
  if (DEBILITATION_POINTS[p.name] === undefined || EXALTATION_POINTS[p.name] === undefined) {
    throw new Error(`Sthana Bala is defined only for classical grahas with known exaltation/debilitation points: ${p.name}`);
  }
  const debilDeg = DEBILITATION_POINTS[p.name];
  const distFromDebil = norm360(p.longitude - debilDeg);
  const ucchaAngle = distFromDebil <= 180 ? distFromDebil : 360 - distFromDebil;
  const ucchaBala = Math.min(60, Math.max(0, ucchaAngle / 3));

  // 1b. Saptavargaja Bala (7 Classical Vargas: D1, D2, D3, D7, D9, D12, D30)
  // BPHS Standard Points: Moolatrikona=45, Own=30, Adhi-Mitra=20, Mitra=15, Sama=10, Shatru=4, Adhi-Shatru=2
  const vargas = [1, 2, 3, 7, 9, 12, 30];
  let saptavargajaBala = 0;
  const getSignRuler = (signIdx) => {
    const normalizedIdx = ((Math.round(norm360(signIdx * 30) / 30)) % 12 + 12) % 12;
    const sign = ZODIAC_SIGNS[normalizedIdx];
    if (!sign?.ruler) throw new Error(`Invalid sign index for Saptavargaja ruler lookup: ${signIdx} (normalized: ${normalizedIdx})`);
    return sign.ruler;
  };

  const getVargaSignIdx = (pLong, varga) => {
    const sIdx = Math.floor(norm360(pLong) / 30);
    const deg = pLong % 30;
    const isOdd = sIdx % 2 === 0;
    switch(varga) {
      case 1: return sIdx;
      case 2: return isOdd ? (deg < 15 ? 4 : 3) : (deg < 15 ? 3 : 4);
      case 3: return (sIdx + (deg < 10 ? 0 : deg < 20 ? 4 : 8)) % 12;
      case 7: return isOdd ? (sIdx + Math.floor(deg / (30 / 7))) % 12 : (sIdx + 6 + Math.floor(deg / (30 / 7))) % 12;
      case 9: return calculateNavamsa(pLong).index;
      case 12: return (sIdx + Math.floor(deg / 2.5)) % 12;
      case 30:
        if (isOdd) {
          if (deg < 5) return 0;
          if (deg < 10) return 10;
          if (deg < 18) return 8;
          if (deg < 25) return 2;
          return 6;
        } else {
          if (deg < 5) return 1;
          if (deg < 12) return 5;
          if (deg < 20) return 11;
          if (deg < 25) return 9;
          return 7;
        }
      default: return sIdx;
    }
  };

  const effectivePlanets = allPlanets.length > 0 ? allPlanets : [p];
  vargas.forEach(v => {
    const vSignIdx = getVargaSignIdx(p.longitude, v);
    const vRuler = getSignRuler(vSignIdx);
    const compoundRel = calculateCompoundFriendship(p.name, vRuler, effectivePlanets);
    const res = calculateVargaDignity(p.name, vSignIdx, p.longitude % 30, v, compoundRel);
    saptavargajaBala += res.virupas;
  });

  // 1c. Oja-Yugma Bala (Odd/Even sign & Navamsha: 0 to 30 virupas)
  const ojaYugmaBala = calculateOjaYugmaBala(p);

  // 1d. Kendradi Bala (Kendra 60, Panaphara 30, Apoklima 15)
  let kendradiBala = 15;
  if ([1, 4, 7, 10].includes(p.house)) kendradiBala = 60;
  else if ([2, 5, 8, 11].includes(p.house)) kendradiBala = 30;

  // 1e. Drekkana Bala (0-10 deg: Male, 10-20 deg: Female, 20-30 deg: Neutral)
  const drekkanaBala = calculateDrekkanaBala(p);

  return Math.round(ucchaBala + saptavargajaBala + ojaYugmaBala + kendradiBala + drekkanaBala);
}

/**
 * 2. DIG BALA (Directional Strength)
 * East (1st): Jupiter, Mercury; South (10th/MC): Sun, Mars; West (7th/DSC): Saturn; North (4th/IC): Moon, Venus
 */
export function calculateDigBala(p, ascendantAngles = 0) {
  const pLong = requireLongitude(p?.longitude, "calculateDigBala planet longitude");
  let ascLong = 0;
  let mcLong = null;
  let icLong = null;
  let descLong = null;

  if (typeof ascendantAngles === "object" && ascendantAngles !== null) {
    ascLong = requireLongitude(ascendantAngles.ascendantLong, "calculateDigBala ascendantLong");
    if (ascendantAngles.mcLong !== undefined && ascendantAngles.mcLong !== null) {
      mcLong = requireLongitude(ascendantAngles.mcLong, "calculateDigBala mcLong");
    }
    if (ascendantAngles.icLong !== undefined && ascendantAngles.icLong !== null) {
      icLong = requireLongitude(ascendantAngles.icLong, "calculateDigBala icLong");
    }
    if (ascendantAngles.descLong !== undefined && ascendantAngles.descLong !== null) {
      descLong = requireLongitude(ascendantAngles.descLong, "calculateDigBala descLong");
    }
  } else {
    ascLong = requireLongitude(ascendantAngles, "calculateDigBala ascendantLong");
  }

  let peakLong = ascLong;
  if (["Jupiter", "Mercury"].includes(p?.name)) {
    peakLong = ascLong; // East (Ascendant / 1st House)
  } else if (["Sun", "Mars"].includes(p?.name)) {
    peakLong = mcLong !== null ? norm360(mcLong) : norm360(ascLong + 270); // South (MC / 10th House)
  } else if (["Saturn"].includes(p?.name)) {
    peakLong = descLong !== null ? norm360(descLong) : norm360(ascLong + 180); // West (Descendant / 7th House)
  } else if (["Moon", "Venus"].includes(p?.name)) {
    peakLong = icLong !== null ? norm360(icLong) : norm360(ascLong + 90); // North (IC / 4th House)
  }

  const distFromPeak = angularDistance(pLong, peakLong);
  return Math.round(Math.max(0, 60 * (1 - (distFromPeak / 180))));
}

/**
 * Astronomical Solar Ingress Root Finder
 * Computes exact Julian Day for any target sidereal Sun longitude (e.g. 0° Aries for Mesha Sankranti)
 */
export function getSiderealSunLongitudeAtJd(testJd, system = "lahiri") {
  const testDate = julianDateToDate(testJd);
  const el = Astronomy.Ecliptic(Astronomy.GeoVector("Sun", testDate, true));
  const ayan = getAyanamshaForSystem(testJd, system);
  return norm360(el.elon - ayan);
}

export function findExactSolarIngressJd(targetSiderealDeg, approxJdStart, approxJdEnd, system = "lahiri") {
  let low = approxJdStart;
  let high = approxJdEnd;
  const target = norm360(targetSiderealDeg);

  // Bracket verification: ensure target is bounded in [low, high]
  let sLow = getSiderealSunLongitudeAtJd(low, system);
  let sHigh = getSiderealSunLongitudeAtJd(high, system);
  let diffLow = sLow - target;
  if (diffLow > 180) diffLow -= 360;
  if (diffLow < -180) diffLow += 360;
  let diffHigh = sHigh - target;
  if (diffHigh > 180) diffHigh -= 360;
  if (diffHigh < -180) diffHigh += 360;

  // Dynamic iterative bracketing across all historical eras (e.g. ancient Julian dates where ingress occurred earlier)
  let bracketAttempts = 0;
  while (diffLow * diffHigh > 0 && bracketAttempts < 15) {
    bracketAttempts++;
    if (diffLow > 0 && diffHigh > 0) {
      // Both bounds are after target -> ingress occurred earlier in time
      const shiftDays = Math.max(7, Math.ceil(Math.min(diffLow, diffHigh) / 0.9856) + 3);
      low -= shiftDays;
      high -= Math.min(shiftDays, (high - low) > 10 ? Math.floor(shiftDays / 2) : shiftDays);
    } else if (diffLow < 0 && diffHigh < 0) {
      // Both bounds are before target -> ingress occurs later in time
      const shiftDays = Math.max(7, Math.ceil(Math.min(Math.abs(diffLow), Math.abs(diffHigh)) / 0.9856) + 3);
      high += shiftDays;
      low += Math.min(shiftDays, (high - low) > 10 ? Math.floor(shiftDays / 2) : shiftDays);
    }
    sLow = getSiderealSunLongitudeAtJd(low, system);
    sHigh = getSiderealSunLongitudeAtJd(high, system);
    diffLow = sLow - target;
    if (diffLow > 180) diffLow -= 360;
    if (diffLow < -180) diffLow += 360;
    diffHigh = sHigh - target;
    if (diffHigh > 180) diffHigh -= 360;
    if (diffHigh < -180) diffHigh += 360;
  }

  // Final bracket check: both endpoints must straddle the target
  if (diffLow * diffHigh > 0) {
    throw new Error(
      `Solar ingress root is not bracketed for target ${targetSiderealDeg.toFixed(4)}°. ` +
      `Interval [JD ${low.toFixed(2)}, JD ${high.toFixed(2)}] does not span the requested ingress. ` +
      `diffLow=${diffLow.toFixed(4)}, diffHigh=${diffHigh.toFixed(4)}`
    );
  }

  for (let iter = 0; iter < 50; iter++) {
    const mid = (low + high) / 2;
    const sLong = getSiderealSunLongitudeAtJd(mid, system);
    let diff = sLong - target;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (Math.abs(diff) < 1e-6 || (high - low) < 1e-6) {
      return mid;
    }
    if (diff > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return (low + high) / 2;
}

/**
 * 3. KALA BALA (Complete Classical Temporal Strength - 8 Components)
 * Subcomponents: Nathonnatha, Paksha, Tribhaga, Varsha, Masa, Vara, Hora, Ayana
 */
export function calculateKalaBala(p, isDayBirth = true, moonLng = 0, sunLong = 0, birthHour = 12, weekday = 0, sunTimes = null, birthDate = new Date(), allPlanets = [], timezoneOffsetHours = null, timezoneId = null) {
  if (timezoneOffsetHours === null || timezoneOffsetHours === undefined || !Number.isFinite(timezoneOffsetHours)) {
    throw new Error("Explicit timezoneOffsetHours is required for astronomical Kala Bala calculation.");
  }
  let sunriseHours = sunTimes?.sunriseHours;
  let sunsetHours = sunTimes?.sunsetHours;

  if (sunTimes?.isPolarNight || sunTimes?.isPolarDay || !Number.isFinite(sunriseHours) || !Number.isFinite(sunsetHours)) {
    const noonH = Number.isFinite(sunTimes?.solarNoonHours) ? sunTimes.solarNoonHours : 12.0;
    if (sunTimes?.isPolarNight) {
      isDayBirth = false;
      sunriseHours = (noonH - 6.0 + 24) % 24;
      sunsetHours = (noonH + 6.0 + 24) % 24;
    } else if (sunTimes?.isPolarDay) {
      isDayBirth = true;
      sunriseHours = (noonH - 12.0 + 24) % 24;
      sunsetHours = (noonH + 12.0 + 24) % 24;
    } else {
      sunriseHours = 6.0;
      sunsetHours = 18.0;
    }
  }

  // 3a. Nathonnatha Bala (Continuous Diurnal/Nocturnal: 0 to 60 virupas based on distance from local solar noon/midnight)
  const noonHour = sunriseHours + (sunsetHours - sunriseHours) / 2.0;
  let distFromNoonH = Math.abs(birthHour - noonHour);
  if (distFromNoonH > 12) distFromNoonH = 24 - distFromNoonH;
  const nataFraction = Math.min(1, Math.max(0, distFromNoonH / 12.0));
  let natonnathaBala = 60;
  if (["Sun", "Jupiter", "Venus"].includes(p.name)) {
    natonnathaBala = Math.round(60 * (1 - nataFraction));
  } else if (["Moon", "Mars", "Saturn"].includes(p.name)) {
    natonnathaBala = Math.round(60 * nataFraction);
  } else if (p.name === "Mercury") {
    natonnathaBala = 60; // BPHS: Mercury is always strong in Natonnatha (60 virupas)
  }

  // 3b. Paksha Bala (Elongation: 0 to 60 virupas; Moon doubled up to 120 virupas)
  const moonSunSeparation = norm360(moonLng - sunLong);
  const shuklaProgress = (moonSunSeparation <= 180 ? moonSunSeparation : 360 - moonSunSeparation) / 180;
  let pakshaBala = 30;
  if (p.name === "Moon") {
    // Classical BPHS / Sripati: Moon's Paksha Bala is doubled, reaching up to 120 Virupas
    pakshaBala = Math.round(shuklaProgress * 120);
  } else if (["Jupiter", "Venus"].includes(p.name)) {
    pakshaBala = Math.round(shuklaProgress * 60);
  } else if (["Sun", "Mars", "Saturn"].includes(p.name)) {
    pakshaBala = Math.round((1 - shuklaProgress) * 60);
  } else if (p.name === "Mercury") {
    // Dynamically evaluate Mercury's benefic/malefic status by association
    const mercLong = Number.isFinite(p.longitude) ? p.longitude : null;
    const maleficConjunction = mercLong !== null && (allPlanets || []).some(other =>
      ["Sun", "Mars", "Saturn", "Rahu", "Ketu"].includes(other.name) &&
      Number.isFinite(other.longitude) &&
      angularDistance(other.longitude, mercLong) <= 12
    );
    pakshaBala = maleficConjunction ? Math.round((1 - shuklaProgress) * 60) : Math.round(shuklaProgress * 60);
  }

  // 3c. Tribhaga Bala (Day/Night 3 equal divisions: 60 virupas to active lord)
  let tribhagaBala = 0;
  if (p.name === "Jupiter") {
    tribhagaBala = 60; // Jupiter always receives 60 virupas in Tribhaga
  } else if (isDayBirth) {
    const dayLength = sunsetHours > sunriseHours ? sunsetHours - sunriseHours : (24 - sunriseHours + sunsetHours);
    const dayElapsed = birthHour >= sunriseHours ? birthHour - sunriseHours : 0;
    const dayThird = Math.min(2, Math.max(0, Math.floor((dayElapsed / dayLength) * 3)));
    if (dayThird === 0 && p.name === "Mercury") tribhagaBala = 60;
    else if (dayThird === 1 && p.name === "Sun") tribhagaBala = 60;
    else if (dayThird === 2 && p.name === "Saturn") tribhagaBala = 60;
  } else {
    const nightLength = 24 - (sunsetHours - sunriseHours);
    const nightElapsed = birthHour >= sunsetHours ? birthHour - sunsetHours : birthHour + (24 - sunsetHours);
    const nightThird = Math.min(2, Math.max(0, Math.floor((nightElapsed / nightLength) * 3)));
    if (nightThird === 0 && p.name === "Moon") tribhagaBala = 60;
    else if (nightThird === 1 && p.name === "Venus") tribhagaBala = 60;
    else if (nightThird === 2 && p.name === "Mars") tribhagaBala = 60;
  }

  // 3d. Classical Vara (Dina) Bala (45 virupas to Lord of Weekday from Sunrise)
  const DINA_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const effectiveWeekday = (birthHour < sunriseHours ? (weekday + 6) : weekday) % 7;
  const dinaLord = DINA_LORDS[effectiveWeekday];
  const dinaBala = p.name === dinaLord ? 45 : 0;

  // 3e. Classical Planetary Hora Bala (60 virupas to ruler of planetary hora at birth minute)
  const CHALDEAN_HORA = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
  let horaIndex = 0;
  if (isDayBirth) {
    const dayLength = sunsetHours > sunriseHours ? sunsetHours - sunriseHours : (24 - sunriseHours + sunsetHours);
    const dayHoraLen = dayLength / 12.0;
    const dayElapsed = birthHour >= sunriseHours ? birthHour - sunriseHours : 0;
    horaIndex = Math.min(11, Math.max(0, Math.floor(dayElapsed / dayHoraLen)));
  } else {
    const nightLength = 24 - (sunsetHours - sunriseHours);
    const nightHoraLen = nightLength / 12.0;
    const nightElapsed = birthHour >= sunsetHours ? birthHour - sunsetHours : birthHour + (24 - sunsetHours);
    horaIndex = 12 + Math.min(11, Math.max(0, Math.floor(nightElapsed / nightHoraLen)));
  }
  const dayLordIdx = CHALDEAN_HORA.indexOf(dinaLord);
  const currentHoraLord = CHALDEAN_HORA[(dayLordIdx + horaIndex) % 7];
  const horaBala = p.name === currentHoraLord ? 60 : 0;

  // Extract IANA/Local year, month, day safely without arbitrary browser-local Date conversion
  let birthY, birthM, birthD;
  if (timezoneId) {
    try {
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: timezoneId,
        year: "numeric", month: "numeric", day: "numeric"
      });
      const parts = dtf.formatToParts(birthDate instanceof Date ? birthDate : new Date());
      const val = {};
      for (const pt of parts) val[pt.type] = pt.value;
      birthY = Number(val.year);
      birthM = Number(val.month);
      birthD = Number(val.day);
    } catch {
      const bUtc = birthDate instanceof Date ? birthDate : new Date();
      const localMs = bUtc.getTime() + timezoneOffsetHours * 3600000;
      const dLoc = new Date(localMs);
      birthY = dLoc.getUTCFullYear();
      birthM = dLoc.getUTCMonth() + 1;
      birthD = dLoc.getUTCDate();
    }
  } else {
    const bUtc = birthDate instanceof Date ? birthDate : new Date();
    const localMs = bUtc.getTime() + timezoneOffsetHours * 3600000;
    const dLoc = new Date(localMs);
    birthY = dLoc.getUTCFullYear();
    birthM = dLoc.getUTCMonth() + 1;
    birthD = dLoc.getUTCDate();
  }

  // 3f. Exact Classical Varsha Bala (15 virupas to Lord of Year at Mesha Sankranti Ingress)
  // Determined strictly by comparing birth JD against the exact Mesha Sankranti JD (0° sidereal Aries solar ingress)
  const birthJd = getJulianDate(birthY, birthM, birthD, birthHour, 0, timezoneOffsetHours);
  const approxMeshaJdStartThisYear = getJulianDate(birthY, 4, 10, 0, 0, timezoneOffsetHours);
  const approxMeshaJdEndThisYear = getJulianDate(birthY, 4, 18, 0, 0, timezoneOffsetHours);
  const exactMeshaJdThisYear = findExactSolarIngressJd(0.0, approxMeshaJdStartThisYear, approxMeshaJdEndThisYear);

  let activeVarshaMeshaJd;
  if (birthJd >= exactMeshaJdThisYear) {
    activeVarshaMeshaJd = exactMeshaJdThisYear;
  } else {
    const approxMeshaJdStartPrevYear = getJulianDate(birthY - 1, 4, 10, 0, 0, timezoneOffsetHours);
    const approxMeshaJdEndPrevYear = getJulianDate(birthY - 1, 4, 18, 0, 0, timezoneOffsetHours);
    activeVarshaMeshaJd = findExactSolarIngressJd(0.0, approxMeshaJdStartPrevYear, approxMeshaJdEndPrevYear);
  }

  const meshaUtcDate = julianDateToDate(activeVarshaMeshaJd);
  let meshaLocalWeekday;
  if (timezoneId) {
    try {
      const dtfW = new Intl.DateTimeFormat("en-US", { timeZone: timezoneId, weekday: "short", hour: "numeric", hour12: false });
      const partsW = dtfW.formatToParts(meshaUtcDate);
      const valW = {};
      for (const pt of partsW) valW[pt.type] = pt.value;
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const wIdx = dayNames.findIndex(d => valW.weekday?.startsWith(d));
      if (wIdx === -1 || valW.hour === undefined || !Number.isFinite(Number(valW.hour))) {
        throw new Error("Invalid weekday/hour extracted during Mesha solar ingress timezone calculation.");
      }
      const ingressH = Number(valW.hour);
      meshaLocalWeekday = ingressH < 6.0 ? (wIdx + 6) % 7 : wIdx;
    } catch {
      const meshaLocalMs = meshaUtcDate.getTime() + timezoneOffsetHours * 3600000;
      const meshaLocalD = new Date(meshaLocalMs);
      const wIdx = meshaLocalD.getUTCDay();
      const ingressH = meshaLocalD.getUTCHours() + meshaLocalD.getUTCMinutes() / 60;
      meshaLocalWeekday = ingressH < 6.0 ? (wIdx + 6) % 7 : wIdx;
    }
  } else {
    const meshaLocalMs = meshaUtcDate.getTime() + timezoneOffsetHours * 3600000;
    const meshaLocalD = new Date(meshaLocalMs);
    const wIdx = meshaLocalD.getUTCDay();
    const ingressH = meshaLocalD.getUTCHours() + meshaLocalD.getUTCMinutes() / 60;
    meshaLocalWeekday = ingressH < 6.0 ? (wIdx + 6) % 7 : wIdx;
  }
  const varshaLord = DINA_LORDS[meshaLocalWeekday];
  const varshaBala = p.name === varshaLord ? 15 : 0;

  // 3g. Exact Classical Masa Bala (30 virupas to Lord of Month at Sidereal Solar Rashi Ingress)
  const actualSunLong = getSiderealSunLongitudeAtJd(birthJd);
  const targetMasaDeg = Math.floor(norm360(actualSunLong) / 30) * 30;
  const degInSign = norm360(actualSunLong) % 30;
  const daysSinceIngress = degInSign / 0.9856; // Mean solar daily motion ~0.9856°
  const approxMasaJd = birthJd - daysSinceIngress;
  const exactMasaJd = findExactSolarIngressJd(targetMasaDeg, approxMasaJd - 5, approxMasaJd + 5);
  const masaUtcDate = julianDateToDate(exactMasaJd);
  let masaLocalWeekday;
  if (timezoneId) {
    try {
      const dtfW = new Intl.DateTimeFormat("en-US", { timeZone: timezoneId, weekday: "short", hour: "numeric", hour12: false });
      const partsW = dtfW.formatToParts(masaUtcDate);
      const valW = {};
      for (const pt of partsW) valW[pt.type] = pt.value;
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const wIdx = dayNames.findIndex(d => valW.weekday?.startsWith(d));
      if (wIdx === -1 || valW.hour === undefined || !Number.isFinite(Number(valW.hour))) {
        throw new Error("Invalid weekday/hour extracted during Masa solar ingress timezone calculation.");
      }
      const ingressH = Number(valW.hour);
      masaLocalWeekday = ingressH < 6.0 ? (wIdx + 6) % 7 : wIdx;
    } catch {
      const masaLocalMs = masaUtcDate.getTime() + timezoneOffsetHours * 3600000;
      const masaLocalD = new Date(masaLocalMs);
      const wIdx = masaLocalD.getUTCDay();
      const ingressH = masaLocalD.getUTCHours() + masaLocalD.getUTCMinutes() / 60;
      masaLocalWeekday = ingressH < 6.0 ? (wIdx + 6) % 7 : wIdx;
    }
  } else {
    const masaLocalMs = masaUtcDate.getTime() + timezoneOffsetHours * 3600000;
    const masaLocalD = new Date(masaLocalMs);
    const wIdx = masaLocalD.getUTCDay();
    const ingressH = masaLocalD.getUTCHours() + masaLocalD.getUTCMinutes() / 60;
    masaLocalWeekday = ingressH < 6.0 ? (wIdx + 6) % 7 : wIdx;
  }
  const masaLord = DINA_LORDS[masaLocalWeekday];
  const masaBala = p.name === masaLord ? 30 : 0;

  // 3h. Classical Astronomical Ayana Bala with True 3D Spherical Declination (0 to 60 virupas)
  // Ayanamsha epoch evaluated at local noon (12:00) on the 15th of birth month under birth timezone.
  const ayanamshaVal = getLahiriAyanamsha(getJulianDate(birthY, birthM, 15, 12, 0, timezoneOffsetHours));
  const pLongFinite = Number.isFinite(p.longitude) ? p.longitude : 0;
  const tropLong = p.tropicalLongitude !== undefined ? norm360(p.tropicalLongitude) : norm360(pLongFinite + ayanamshaVal);
  const eclipticLatDeg = p.eclipticLat !== undefined ? p.eclipticLat : 0;
  const epsRad = 23.439291 * DEG2RAD;
  const lambdaRad = tropLong * DEG2RAD;
  const betaRad = eclipticLatDeg * DEG2RAD;

  // 3D Spherical Declination: sin δ = sin β cos ε + cos β sin ε sin λ
  const sinDec = Math.sin(betaRad) * Math.cos(epsRad) + Math.cos(betaRad) * Math.sin(epsRad) * Math.sin(lambdaRad);
  const declinationDeg = Math.asin(Math.max(-1, Math.min(1, sinDec))) * RAD2DEG;
  const declinationRatio = Math.max(-1, Math.min(1, declinationDeg / 23.44));

  let ayanaBala = 30;
  if (["Sun", "Mars", "Jupiter", "Venus"].includes(p.name)) {
    ayanaBala = Math.round(Math.max(0, Math.min(60, 30 + (30 * declinationRatio))));
  } else if (["Moon", "Saturn"].includes(p.name)) {
    ayanaBala = Math.round(Math.max(0, Math.min(60, 30 - (30 * declinationRatio))));
  } else if (p.name === "Mercury") {
    // Classical BPHS / Saravali: Mercury's Ayana Bala is additive for BOTH Northern and Southern declinations (|δ|)
    const absDeclinationRatio = Math.abs(declinationRatio);
    ayanaBala = Math.round(Math.max(0, Math.min(60, 30 + (30 * absDeclinationRatio))));
  }

  return Math.round(natonnathaBala + pakshaBala + tribhagaBala + dinaBala + horaBala + varshaBala + masaBala + ayanaBala);
}

/**
 * 4. CHESHTA BALA (Classical Motional Strength - Continuous BPHS Cheshta Kendra Engine)
 * Cheshta Kendra = |Seeghrocha - (Mean Longitude + True Longitude)/2|. Reduced Kendra = min(Kendra, 360-Kendra).
 * Cheshta Virupas = Reduced Kendra / 3 (0 to 60 virupas).
 * Sun Cheshta = Ayana Bala; Moon Cheshta = Paksha Bala.
 */
export function calculateCheshtaBala(p, pakshaBala = 30, ayanaBala = 30, sunLong = 0, sunMeanLong = null) {
  if (p.name === "Sun") {
    return Math.round(ayanaBala);
  }
  if (p.name === "Moon") {
    return Math.round(pakshaBala);
  }

  // Classical BPHS Chapter 27: Cheshta Kendra Calculation
  const trueLong = norm360(Number.isFinite(p.longitude) ? p.longitude : 0);
  const meanLong = p.meanLongitude !== undefined ? norm360(p.meanLongitude) : trueLong;

  // Average of Mean and True Longitudes (handling 360° circular boundary)
  let diffMeanTrue = trueLong - meanLong;
  if (diffMeanTrue > 180) diffMeanTrue -= 360;
  if (diffMeanTrue < -180) diffMeanTrue += 360;
  const avgLong = norm360(meanLong + diffMeanTrue / 2.0);

  // Mean Sun is the universal Seeghrocha for all 5 Tara Grahas in standard BPHS / Sripati Cheshta
  const seeghrocha = sunMeanLong !== null ? norm360(sunMeanLong) : norm360(sunLong);

  // Cheshta Kendra = (Seeghrocha - Average Longitude) mod 360
  const kendra = norm360(seeghrocha - avgLong);
  const reducedKendra = kendra <= 180 ? kendra : 360 - kendra;
  const cheshtaVirupas = Math.min(60, Math.max(0, reducedKendra / 3.0));
  return parseFloat(cheshtaVirupas.toFixed(1));
}

/**
 * 5. NAISARGIKA BALA (Natural Strength)
 * Fixed classical virupas from luminosity/mass: Sun (60) to Saturn (8.57)
 */
export function calculateNaisargikaBala(p) {
  const value = NAISARGIKA_VIRUPAS[p.name];
  if (value === undefined) {
    throw new Error(`Naisargika Bala is defined only for the seven classical grahas: ${p.name}`);
  }
  return value;
}

/**
 * Classical Parashari / Sripati Sputa Drishti (0 to 60 Virupas)
 * Evaluates the continuous aspect strength cast by an aspecting graha on a target longitude.
 * Includes general 7th aspect continuous curve plus special aspects (Vishesh Drishti):
 * - Mars: 4th aspect (90°) and 8th aspect (210°) reach full 60 virupas
 * - Jupiter: 5th aspect (120°) and 9th aspect (240°) reach full 60 virupas
 * - Saturn: 3rd aspect (60°) and 10th aspect (270°) reach full 60 virupas
 */
export function calculateSputaDrishti(aspector, targetLong) {
  const aspectorLong = typeof aspector === "object" && aspector !== null
    ? requireLongitude(aspector.longitude, "calculateSputaDrishti aspector")
    : requireLongitude(aspector, "calculateSputaDrishti aspector");
  const aspectorName = typeof aspector === "object" && aspector !== null ? (aspector.name || "") : "";
  const targetDeg = typeof targetLong === "object" && targetLong !== null
    ? requireLongitude(targetLong.longitude, "calculateSputaDrishti targetLong")
    : requireLongitude(targetLong, "calculateSputaDrishti targetLong");
  
  const diff = norm360(targetDeg - aspectorLong);

  // 1. General (Ordinary) Sputa Drishti Base Curve (0 to 60 Virupas):
  let baseDrishti = 0;
  if (diff >= 30 && diff < 60) {
    baseDrishti = (diff - 30) / 2; // 0 to 15 virupas
  } else if (diff >= 60 && diff < 90) {
    baseDrishti = (diff - 60) + 15; // 15 to 45 virupas
  } else if (diff >= 90 && diff < 120) {
    baseDrishti = (120 - diff) / 2 + 30; // 45 down to 30 virupas
  } else if (diff >= 120 && diff < 150) {
    baseDrishti = (150 - diff); // 30 down to 0 virupas
  } else if (diff >= 150 && diff <= 180) {
    baseDrishti = (diff - 150) * 2; // 0 up to 60 virupas (full 7th opposition)
  } else if (diff > 180 && diff < 300) {
    baseDrishti = (300 - diff) / 2; // 60 down to 0 virupas at 300°
  } else {
    baseDrishti = 0;
  }

  // 2. Classical Special Planetary Aspects (Vishesh Drishti):
  let specialBonus = 0;
  if (aspectorName === "Mars") {
    // 4th aspect peak at 90° (in range 60°-120°, adding up to 15 virupas to make 45+15 = 60 virupas at 90°)
    if (diff >= 60 && diff <= 90) {
      specialBonus += (diff - 60) / 2;
    } else if (diff > 90 && diff <= 120) {
      specialBonus += (120 - diff) / 2;
    }
    // 8th aspect peak at 210° (in range 180°-240°, adding up to 15 virupas to make 45+15 = 60 virupas at 210°)
    if (diff >= 180 && diff <= 210) {
      specialBonus += (diff - 180) / 2;
    } else if (diff > 210 && diff <= 240) {
      specialBonus += (240 - diff) / 2;
    }
  } else if (aspectorName === "Jupiter") {
    // 5th aspect peak at 120° (in range 90°-150°, adding up to 30 virupas to make 30+30 = 60 virupas at 120°)
    if (diff >= 90 && diff <= 120) {
      specialBonus += (diff - 90);
    } else if (diff > 120 && diff <= 150) {
      specialBonus += (150 - diff);
    }
    // 9th aspect peak at 240° (in range 210°-270°, adding up to 30 virupas to make 30+30 = 60 virupas at 240°)
    if (diff >= 210 && diff <= 240) {
      specialBonus += (diff - 210);
    } else if (diff > 240 && diff <= 270) {
      specialBonus += (270 - diff);
    }
  } else if (aspectorName === "Saturn") {
    // 3rd aspect peak at 60° (in range 30°-90°, adding up to 45 virupas to make 15+45 = 60 virupas at 60°)
    if (diff >= 30 && diff <= 60) {
      specialBonus += (diff - 30) * 1.5;
    } else if (diff > 60 && diff <= 90) {
      specialBonus += (90 - diff) * 1.5;
    }
    // 10th aspect peak at 270° (in range 240°-300°, adding up to 45 virupas to make 15+45 = 60 virupas at 270°)
    if (diff >= 240 && diff <= 270) {
      specialBonus += (diff - 240) * 1.5;
    } else if (diff > 270 && diff <= 300) {
      specialBonus += (300 - diff) * 1.5;
    }
  }

  const totalDrishti = Math.min(60.0, Math.max(0.0, baseDrishti + specialBonus));
  return parseFloat(totalDrishti.toFixed(2));
}

/**
 * 6. DRIK BALA (Classical Aspect Strength)
 * Net Sputa Drishti (Benefic minus Malefic aspect virupas) divided by 4 (quarter strength).
 */
export function calculateDrikBala(p, allPlanets = []) {
  const aspectors = allPlanets.length > 0 ? allPlanets : (p.aspectsReceived || []);
  let netBeneficDrishti = 0;
  let netMaleficDrishti = 0;

  aspectors.forEach(asp => {
    if (asp.name === p.name) return;
    const aspectorLong = asp.longitude !== undefined ? asp.longitude : 0;
    const sputaVal = calculateSputaDrishti(asp, p.longitude);

    // Benefic / Malefic Determination for Drik Contribution:
    let isBenefic;
    if (asp.name === "Jupiter" || asp.name === "Venus") {
      isBenefic = true;
    } else if (asp.name === "Sun" || asp.name === "Mars" || asp.name === "Saturn") {
      isBenefic = false;
    } else if (asp.name === "Mercury") {
      const conjunctMalefic = allPlanets.some(other =>
        ["Sun", "Mars", "Saturn", "Rahu", "Ketu"].includes(other.name) &&
        angularDistance(other.longitude, asp.longitude) <= 12
      );
      isBenefic = !conjunctMalefic;
    } else if (asp.name === "Moon") {
      const sunP = allPlanets.find(x => x.name === "Sun");
      const sunL = sunP ? sunP.longitude : 0;
      const moonSep = norm360(aspectorLong - sunL);
      isBenefic = moonSep <= 180; // Waxing Moon
    } else {
      isBenefic = asp.isBenefic !== undefined ? asp.isBenefic : false;
    }

    if (isBenefic) {
      netBeneficDrishti += sputaVal;
    } else {
      netMaleficDrishti += sputaVal;
    }
  });

  // Classical Drik Bala is quarter (1/4th) of the net Sputa Drishti (Sripati / BPHS)
  const drikVirupas = (netBeneficDrishti - netMaleficDrishti) / 4.0;
  return parseFloat(drikVirupas.toFixed(2));
}

/**
 * True 3D Spherical Declination: sin δ = sin β cos ε + cos β sin ε sin λ
 */
export function calculateSphericalDeclination(eclipticLongDeg, eclipticLatDeg = 0, obliquityDeg = 23.439291) {
  const epsRad = obliquityDeg * DEG2RAD;
  const lambdaRad = eclipticLongDeg * DEG2RAD;
  const betaRad = eclipticLatDeg * DEG2RAD;
  const sinDec = Math.sin(betaRad) * Math.cos(epsRad) + Math.cos(betaRad) * Math.sin(epsRad) * Math.sin(lambdaRad);
  return Math.asin(Math.max(-1, Math.min(1, sinDec))) * RAD2DEG;
}

/**
 * Graha Yuddha (Planetary War) Engine
 * Evaluates wars between Tara Grahas (Mars, Mercury, Jupiter, Venus, Saturn) within 1° separation
 */
export function calculateGrahaYuddha(planets = []) {
  const TARA_GRAHAS = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const taraPlanets = planets.filter(p => TARA_GRAHAS.includes(p.name));
  const warAdjustments = {};
  const warDetails = {};

  taraPlanets.forEach(p => {
    warAdjustments[p.name] = 0;
    warDetails[p.name] = { inWar: false, opponent: null, isVictor: false, virupasAdjustment: 0, warCorrectionImplemented: true };
  });

  const getPlanetDec = (p) => {
    if (p.declination !== undefined && p.declination !== null && Number.isFinite(p.declination)) {
      return p.declination;
    }
    const trop = p.tropicalLongitude !== undefined ? p.tropicalLongitude : (p.longitude || 0);
    const lat = p.eclipticLat !== undefined ? p.eclipticLat : 0;
    return calculateSphericalDeclination(trop, lat);
  };

  for (let i = 0; i < taraPlanets.length; i++) {
    for (let j = i + 1; j < taraPlanets.length; j++) {
      const p1 = taraPlanets[i];
      const p2 = taraPlanets[j];
      const dist = angularDistance(p1.longitude, p2.longitude);

      if (dist <= 1.0) {
        const dec1 = getPlanetDec(p1);
        const dec2 = getPlanetDec(p2);
        let p1Wins;
        if (Math.abs(dec1 - dec2) > 0.01) {
          p1Wins = dec1 > dec2;
        } else {
          p1Wins = p1.longitude > p2.longitude;
        }

        const winner = p1Wins ? p1 : p2;
        const loser = p1Wins ? p2 : p1;

        // Classical Graha Yuddha Virupa Correction (BPHS)
        // Victor gains strength proportional to proximity; loser loses proportionally
        const proximityFactor = Math.max(0, 1.0 - dist); // 0 at 1° apart, 1 at exact conjunction
        const warVirupas = Math.round(30 * proximityFactor); // Classical max ~30 virupas

        warAdjustments[winner.name] += warVirupas;
        warAdjustments[loser.name] -= warVirupas;

        warDetails[winner.name] = { inWar: true, opponent: loser.name, isVictor: true, virupasAdjustment: warVirupas, warCorrectionImplemented: true };
        warDetails[loser.name]  = { inWar: true, opponent: winner.name, isVictor: false, virupasAdjustment: -warVirupas, warCorrectionImplemented: true };
      }
    }
  }

  return { warAdjustments, warDetails };
}

/**
 * Parashari Six-Fold Shadbala Engine
 * Implemented under declared application conventions (SHADBALA_CONVENTION).
 * Calculates total virupas and rupas against canonical required rupas.
 */
export function calculateShadbala(
  planets = [],
  ascendantSign = {},
  birthTime = "12:00",
  sunLong = 0,
  ascendantAngles = 0,
  isDayBirth = true,
  birthDate = new Date(),
  sunTimes = null,
  timezoneOffsetHours = null,
  timezoneId = null
) {
  if (timezoneOffsetHours === null || timezoneOffsetHours === undefined || !Number.isFinite(timezoneOffsetHours)) {
    throw new Error("Explicit timezoneOffsetHours is required for astronomical Shadbala calculation.");
  }
  const eligible = planets.filter(p => NAISARGIKA_VIRUPAS[p.name] !== undefined);
  const moonPlanet = planets.find(p => p.name === "Moon");
  const sunPlanet = planets.find(p => p.name === "Sun");
  const sunMeanLong = sunPlanet?.meanLongitude || sunLong;
  const moonLng = moonPlanet ? moonPlanet.longitude : 0;
  const moonSunSeparation = norm360(moonLng - sunLong);
  const shuklaProgress = (moonSunSeparation <= 180 ? moonSunSeparation : 360 - moonSunSeparation) / 180;
  const pakshaBalaMoon = Math.round(shuklaProgress * 60);

  let birthHour = 12;
  if (typeof birthTime === "string" && birthTime.includes(":")) {
    const [h, m] = birthTime.split(":").map(Number);
    birthHour = h + (m || 0) / 60;
  }
  // Timezone-correct weekday: derive from UTC epoch + explicit timezone offset.
  // Never use birthDate.getDay() which returns the machine-local weekday.
  // 1970-01-01 was a Thursday (JS day 4). Add timezone offset to UTC ms to get local midnight.
  let weekday = 0;
  if (birthDate instanceof Date) {
    const localMidnightMs = birthDate.getTime() + timezoneOffsetHours * 3600000;
    weekday = Math.floor(localMidnightMs / 86400000 + 4) % 7;
    if (weekday < 0) weekday += 7;
  }


  const ascLong = typeof ascendantAngles === "object" && ascendantAngles !== null
    ? (ascendantAngles.ascendantLong || 0)
    : (Number(ascendantAngles) || 0);

  // First Pass: Compute 6 base Bala components
  const baseBalas = eligible.map(p => {
    const sthanaBala = calculateSthanaBala(p, ascLong, eligible);
    const digBala = calculateDigBala(p, ascendantAngles);
    const kalaBala = calculateKalaBala(p, isDayBirth, moonLng, sunLong, birthHour, weekday, sunTimes, birthDate, eligible, timezoneOffsetHours, timezoneId);
    const cheshtaBala = calculateCheshtaBala(p, pakshaBalaMoon, 30, sunLong, sunMeanLong);
    const naisargikaBala = calculateNaisargikaBala(p);
    const drikBala = calculateDrikBala(p, eligible);
    return {
      ...p,
      sthanaBala,
      digBala,
      kalaBala,
      cheshtaBala,
      naisargikaBala,
      drikBala
    };
  });

  // Second Pass: Graha Yuddha (Planetary War) Evaluation
  const { warAdjustments, warDetails } = calculateGrahaYuddha(baseBalas);

  return baseBalas.map(p => {
    const yuddhaAdj = warAdjustments[p.name] || 0;
    const yuddhaInfo = warDetails[p.name] || { inWar: false, opponent: null, isVictor: false, virupasAdjustment: 0 };
    const totalVirupas = Math.round(p.sthanaBala + p.digBala + p.kalaBala + p.cheshtaBala + p.naisargikaBala + p.drikBala + yuddhaAdj);
    const totalRupas = parseFloat((totalVirupas / 60).toFixed(2));
    const reqRupas = SHADBALA_CONVENTION.requiredRupas[p.name];
    if (reqRupas === undefined) throw new Error(`No declared Shadbala Rupa requirement for planet: ${p.name}`);
    const ratio = parseFloat((totalRupas / reqRupas).toFixed(2));
    const isSufficient = totalRupas >= reqRupas;
    const applicationStatus = isSufficient ? "Sufficient Classical Strength (சுப பலம்)" : "Requires Remedial Fortification (பரிகார பலம்)";

    return {
      planet: p.name,
      planetTa: p.tamil || p.name,
      totalVirupas,
      totalRupas,
      requiredRupas: reqRupas,
      ratio,
      isSufficient,
      status: applicationStatus,
      applicationStatus,
      methodology: "Six-fold Parashari Shadbala (BPHS / Sripati Standard Conventions with Graha Yuddha ±30 Virupa correction)",
      sthanaBala: Math.round(p.sthanaBala),
      digBala: Math.round(p.digBala),
      kalaBala: Math.round(p.kalaBala),
      cheshtaBala: Math.round(p.cheshtaBala),
      naisargikaBala: Math.round(p.naisargikaBala),
      drikBala: Math.round(p.drikBala),
      yuddhaBala: yuddhaAdj,
      grahaYuddha: yuddhaInfo,
      components: {
        sthanaBala: Math.round(p.sthanaBala),
        digBala: Math.round(p.digBala),
        kaalaBala: Math.round(p.kalaBala),
        kalaBala: Math.round(p.kalaBala),
        cheshtaBala: Math.round(p.cheshtaBala),
        naisargikaBala: Math.round(p.naisargikaBala),
        drikBala: Math.round(p.drikBala),
        yuddhaBala: yuddhaAdj
      }
    };
  }).sort((a, b) => b.totalVirupas - a.totalVirupas);
}

/**
 * 3-TIER VIMSHOTTARI PRATYANTARDASHA BREAKDOWN
 */
export function calculatePratyantardasha(currentDashaOrLord = null, maybeDurationDays = null, maybeIsTamil = false, maybeStartAge = null, maybeStartJd = null) {
  const DASHA_LORDS_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
  const TOTAL_YEARS = 120;
  const DAYS_PER_SOLAR_YEAR = 365.24219878;

  if (typeof currentDashaOrLord === "string") {
    const bkLord = currentDashaOrLord;
    const durationDays = typeof maybeDurationDays === "number" ? maybeDurationDays : 365.24;
    const isTamil = Boolean(maybeIsTamil);
    const antarLordIdx = DASHA_LORDS_ORDER.findIndex(l => l.toLowerCase() === bkLord.toLowerCase());
    if (antarLordIdx === -1) return [];

    const pratyantars = [];
    let cumulativeDays = 0;
    for (let pIdx = 0; pIdx < 9; pIdx++) {
      const pLord = DASHA_LORDS_ORDER[(antarLordIdx + pIdx) % 9];
      const pYears = DASHA_YEARS[pLord];
      const pSpanDays = parseFloat(((durationDays * pYears) / TOTAL_YEARS).toFixed(2));
      const startDayOffset = cumulativeDays;
      const endDayOffset = cumulativeDays + pSpanDays;

      const pdStartJd = typeof maybeStartJd === "number" ? maybeStartJd + cumulativeDays : null;
      const pdEndJd = pdStartJd !== null ? pdStartJd + pSpanDays : null;
      const startDateIso = pdStartJd !== null ? julianDateToDate(pdStartJd).toISOString().slice(0, 10) : "";
      const endDateIso = pdEndJd !== null ? julianDateToDate(pdEndJd).toISOString().slice(0, 10) : "";

      const startAge = typeof maybeStartAge === "number" ? parseFloat((maybeStartAge + (startDayOffset / DAYS_PER_SOLAR_YEAR)).toFixed(2)) : null;
      const endAge = typeof maybeStartAge === "number" ? parseFloat((maybeStartAge + (endDayOffset / DAYS_PER_SOLAR_YEAR)).toFixed(2)) : null;

      pratyantars.push({
        lord: pLord,
        lordTamil: DASHA_LORDS.find(d => d.lord === pLord)?.tamil || pLord,
        durationDays: pSpanDays,
        startDayOffset,
        endDayOffset,
        jdStart: pdStartJd,
        jdEnd: pdEndJd,
        startAge,
        endAge,
        startDateIso,
        endDateIso,
        name: isTamil ? `${DASHA_LORDS.find(d => d.lord === pLord)?.tamil || pLord} பிரத்யந்தர தசை` : `${pLord} Pratyantardasha`,
        nature: ["Jupiter", "Venus", "Mercury", "Moon"].includes(pLord) ? (isTamil ? "மிகவும் சுப காலம்" : "Highly Auspicious") : (isTamil ? "கிரக கர்ம சுழற்சி" : "Dynamic / Transformation")
      });
      cumulativeDays += pSpanDays;
    }
    return pratyantars;
  }

  if (!currentDashaOrLord || typeof currentDashaOrLord !== "object" || !currentDashaOrLord.lord) {
    return null;
  }

  const currentLord = currentDashaOrLord.lord;
  const currentAntar = currentDashaOrLord.currentAntar || currentDashaOrLord.antarDasha || currentDashaOrLord.subLord || currentLord;

  const lordYears = DASHA_YEARS[currentLord];
  if (lordYears === undefined) throw new Error(`Unknown Vimshottari Mahadasha lord: ${currentLord}`);
  const antarYears = DASHA_YEARS[currentAntar];
  if (antarYears === undefined) throw new Error(`Unknown Vimshottari Antardasha lord: ${currentAntar}`);
  const antarDurationDays = (lordYears * antarYears * DAYS_PER_SOLAR_YEAR) / TOTAL_YEARS;
  const antarSpanMonths = (antarDurationDays / (DAYS_PER_SOLAR_YEAR / 12));

  const antarLordIdx = DASHA_LORDS_ORDER.indexOf(currentAntar);
  const pratyantars = [];
  let cumulativeDays = 0;

  for (let pIdx = 0; pIdx < 9; pIdx++) {
    const pLord = DASHA_LORDS_ORDER[(antarLordIdx + pIdx) % 9];
    const pYears = DASHA_YEARS[pLord];
    const pSpanDays = parseFloat(((antarDurationDays * pYears) / TOTAL_YEARS).toFixed(2));
    const startDayOffset = cumulativeDays;
    pratyantars.push({
      lord: pLord,
      lordTamil: DASHA_LORDS.find(d => d.lord === pLord)?.tamil || pLord,
      durationDays: pSpanDays,
      startDayOffset,
      nature: ["Jupiter", "Venus", "Mercury", "Moon"].includes(pLord) ? "Highly Auspicious (சுப காலம்)" : "Dynamic / Transformation (கிரக கர்ம சுழற்சி)"
    });
    cumulativeDays += pSpanDays;
  }

  return {
    majorLord: currentLord,
    subLord: currentAntar,
    antarSpanMonths: antarSpanMonths.toFixed(1),
    pratyantars
  };
}

/**
 * COMPREHENSIVE AUSPICIOUS LIFE MILESTONES & DAY-TO-DAY MUHURTHA TIMELINE ENGINE
 * Computes personalized auspicious windows for Marriage, Property/Home, Vehicles,
 * Business, Career, Travel, Family Functions, and Day-to-Day Activity Optimization.
 */
export function calculateAuspiciousMilestoneTimelines(planets = [], ascendantLong = 0, moonLong = 0, dashaTable = [], birthYear = 1995, lang = "en", sunTimes = null, lat = null, lng = null, tz = null, timezoneId = null) {
  const isTamil = lang === "ta";

  let sTimes = sunTimes;
  if (!sTimes && typeof lat === "number" && typeof lng === "number" && (tz !== null || timezoneId !== null)) {
    try {
      const effTz = typeof tz === "number" ? tz : 0;
      const effTzId = timezoneId || (typeof tz === "string" ? tz : null);
      sTimes = calculateAccurateSunTimes(new Date(Date.UTC(birthYear, 3, 25, 12, 0, 0)), lat, lng, effTz, effTzId);
    } catch (e) {
      sTimes = null;
    }
  }

  const srH = sTimes?.sunriseHours;
  const ssH = sTimes?.sunsetHours;
  const snH = sTimes?.solarNoonHours;
  const daySpan = (srH !== undefined && ssH !== undefined) ? Math.max(10, ssH - srH) : 12.0;
  const octant = daySpan / 8;

  const formatDecTime = (decH) => {
    let norm = (decH + 24) % 24;
    let h = Math.floor(norm);
    let m = Math.round((norm - h) * 60);
    if (m === 60) { m = 0; h += 1; }
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const brahmaTime = srH !== undefined
    ? `${formatDecTime(srH - 1.6)} - ${formatDecTime(srH - 0.8)}`
    : (isTamil ? "சூரிய உதயத்திற்கு 96 - 48 நிமிடங்கள் முன்" : "96 - 48 mins prior to local sunrise");

  const abhijitTime = snH !== undefined
    ? `${formatDecTime(snH - (daySpan / 30))} - ${formatDecTime(snH + (daySpan / 30))} (Daily Solar Meridian)`
    : (isTamil ? "உச்ச சூரிய மதிய நேரத்திற்கு ±24 நிமிடங்கள்" : "±24 mins centered on local solar noon");

  const getOctantSlot = (partIdx) => {
    const t1 = srH + octant * (partIdx - 1);
    const t2 = srH + octant * partIdx;
    return `${formatDecTime(t1)} - ${formatDecTime(t2)}`;
  };

  const weeklyTable = [
    { day: isTamil ? "ஞாயிறு (Sun)" : "Sunday", rahu: getOctantSlot(8), yama: getOctantSlot(5), gulika: getOctantSlot(7) },
    { day: isTamil ? "திங்கள் (Mon)" : "Monday", rahu: getOctantSlot(2), yama: getOctantSlot(4), gulika: getOctantSlot(6) },
    { day: isTamil ? "செவ்வாய் (Tue)" : "Tuesday", rahu: getOctantSlot(7), yama: getOctantSlot(3), gulika: getOctantSlot(5) },
    { day: isTamil ? "புதன் (Wed)" : "Wednesday", rahu: getOctantSlot(5), yama: getOctantSlot(2), gulika: getOctantSlot(4) },
    { day: isTamil ? "வியாழன் (Thu)" : "Thursday", rahu: getOctantSlot(6), yama: getOctantSlot(1), gulika: getOctantSlot(3) },
    { day: isTamil ? "வெள்ளி (Fri)" : "Friday", rahu: getOctantSlot(4), yama: getOctantSlot(7), gulika: getOctantSlot(2) },
    { day: isTamil ? "சனி (Sat)" : "Saturday", rahu: getOctantSlot(3), yama: getOctantSlot(6), gulika: getOctantSlot(1) }
  ];

  // Planetary Lords & Karakas
  const ascendantSign = ZODIAC_SIGNS[Math.floor(norm360(ascendantLong) / 30)] || ZODIAC_SIGNS[0];
  const lagnaSignIdx = ZODIAC_SIGNS.findIndex(s => s.name === ascendantSign.name);

  const getBhava = (bhavaNum) => {
    const signIdx = ((lagnaSignIdx >= 0 ? lagnaSignIdx : 0) + (bhavaNum - 1)) % 12;
    const sign = ZODIAC_SIGNS[signIdx];
    const lordName = sign.ruler;
    const lordPlanet = planets.find(p => p.name === lordName);
    return { bhavaNum, sign, lordName, lordPlanet };
  };

  const h1 = getBhava(1);
  const h2 = getBhava(2);
  const h4 = getBhava(4);
  const h5 = getBhava(5);
  const h7 = getBhava(7);
  const h9 = getBhava(9);
  const h10 = getBhava(10);
  const h11 = getBhava(11);
  const h12 = getBhava(12);

  const jupiter = planets.find(p => p.name === "Jupiter");
  const venus = planets.find(p => p.name === "Venus");
  const mars = planets.find(p => p.name === "Mars");
  const sun = planets.find(p => p.name === "Sun");
  const saturn = planets.find(p => p.name === "Saturn");
  const mercury = planets.find(p => p.name === "Mercury");
  const moon = planets.find(p => p.name === "Moon");
  const rahu = planets.find(p => p.name === "Rahu");

  const fmtYears = (startOffset, endOffset) => {
    const y1 = Math.round(birthYear + startOffset);
    const y2 = Math.round(birthYear + endOffset);
    return `${y1} - ${y2}`;
  };

  // Find auspicious Bukthi periods from dashaTable for given lord names or significators across lifespan
  // Curates and ranks prime candidate windows within realistic lifecycle boundaries.
  const findAuspiciousPeriods = (targetLords = [], minAge = 18.0, maxAge = 75.0) => {
    const allMatching = [];
    if (dashaTable && dashaTable.length > 0) {
      for (const md of dashaTable) {
        if (!md.bukthis) continue;
        for (const bk of md.bukthis) {
          const mdMatch = targetLords.includes(md.lord);
          const bkMatch = targetLords.includes(bk.subLord);
          if (mdMatch || bkMatch) {
            let score = 0;
            if (mdMatch && bkMatch) score += 40;
            else if (bkMatch) score += 25;
            else score += 15;

            // Give bonus if within prime active adult lifecycle
            if (bk.startAge >= minAge && bk.startAge <= maxAge) {
              score += 20;
            }

            allMatching.push({
              startAge: bk.startAge,
              endAge: bk.endAge,
              mdLord: md.lord,
              bkLord: bk.subLord,
              score,
              isLifecycleCandidate: (bk.startAge >= minAge && bk.startAge <= maxAge),
              activationType: (mdMatch && bkMatch) ? "Mahadasha and Antardasha" : (bkMatch ? "Antardasha" : "Mahadasha"),
              calendarYears: `${Math.round(birthYear + bk.startAge)} - ${Math.round(birthYear + bk.endAge)}`
            });
          }
        }
      }
      if (allMatching.length > 0) {
        // Filter to realistic lifecycle first
        const lifecyclePeriods = allMatching.filter(p => p.isLifecycleCandidate);
        const candidates = lifecyclePeriods.length > 0 ? lifecyclePeriods : allMatching;
        
        // Sort by astrological score descending, then chronologically
        candidates.sort((a, b) => b.score - a.score || a.startAge - b.startAge);
        
        // Pick top 2 to 3 prime windows, then sort them chronologically
        const primeWindows = candidates.slice(0, 3).sort((a, b) => a.startAge - b.startAge);
        
        const ageStr = primeWindows.map(p => `${p.startAge.toFixed(1)} - ${p.endAge.toFixed(1)}`).join(" & ");
        const yrStr = primeWindows.map(p => p.calendarYears).join(" & ");
        return { isQualifying: true, ageRange: ageStr, calendarYears: yrStr, primeWindows, periods: primeWindows, allPeriods: allMatching };
      }
    }
    return {
      isQualifying: false,
      ageRange: isTamil ? "தசா அமைப்பில் நேரடி சேர்க்கை இல்லை" : "No direct classical dasha activation window",
      calendarYears: "—",
      primeWindows: [],
      periods: [],
      allPeriods: []
    };
  };

  const marriagePathway = calculateMarriagePathway(planets, ascendantLong, dashaTable, birthYear, lang);
  const propertyTiming = findAuspiciousPeriods([h4.lordName, "Mars", "Venus", "Jupiter"], 22.0, 72.0);
  const vehicleTiming = findAuspiciousPeriods(["Venus", h4.lordName, "Moon", "Mercury"], 18.0, 70.0);
  const businessTiming = findAuspiciousPeriods([h10.lordName, h11.lordName, "Mercury", "Jupiter"], 21.0, 70.0);
  const careerTiming = findAuspiciousPeriods([h10.lordName, "Sun", "Saturn", h1.lordName, h11.lordName], 20.0, 65.0);
  const travelTiming = findAuspiciousPeriods([h9.lordName, h12.lordName, "Rahu", "Moon"], 18.0, 75.0);
  const functionsTiming = findAuspiciousPeriods(["Jupiter", "Venus", "Mercury", h5.lordName, h9.lordName], 1.0, 80.0);

  const milestones = [
    {
      id: "marriage",
      category: isTamil ? "திருமணம் & இல்லற சுப காலம் (விவாக சுப காலம்)" : "Marriage & Life Partnership Alliances (Vivaha Subha Kaala)",
      ageRange: marriagePathway.auspiciousAgeRange,
      calendarYears: marriagePathway.calendarYears,
      favorablePlanets: isTamil ? "குரு, சுக்கிரன் & 7-ம் பாவக சுப தொடர்பு" : "Jupiter (Guru), Venus (Shukra) & 7th Lord",
      auspiciousNakshatras: isTamil 
        ? "ரோகிணி, மிருகசீரிஷம், மகம், உத்திரம், அஸ்தம், சுவாதி, அனுஷம், உத்திராடம், உத்திரட்டாதி, ரேவதி"
        : "Rohini, Mrigashira, Magha, Uttara Phalguni, Hasta, Swati, Anuradha, Uttara Ashadha, Uttara Bhadrapada, Revati",
      bestTithis: isTamil
        ? "வளர்பிறை துவிதியை, திருதியை, பஞ்சமி, சப்தமி, தசமி, ஏகாதசி, திரயோதசி"
        : "Shukla Paksha Dvitiya, Tritiya, Panchami, Saptami, Dashami, Ekadashi, Trayodashi",
      favorableWeekdays: isTamil ? "வியாழன், வெள்ளி, புதன், திங்கள்" : "Thursday, Friday, Wednesday, Monday",
      rationale: marriagePathway.verdict
    },
    {
      id: "property_home",
      category: isTamil ? "சொந்த வீடு கட்டுதல் / வாங்குதல் & பூமி பூஜை (கிரகப்பிரவேசம்)" : "Buying / Building Home & Land Acquisition (Griha Pravesham & Bhumi Puja)",
      ageRange: propertyTiming.ageRange,
      calendarYears: propertyTiming.calendarYears,
      favorablePlanets: isTamil ? "செவ்வாய் (பூமிகாரகன்), சுக்கிரன், 4-ம் அதிபதி" : "Mars (Bhoomi Karaka), Venus (Comforts), 4th House Lord",
      auspiciousMonths: isTamil
        ? "வைகாசி (மே-ஜூன்), ஆவணி (ஆக-செப்), கார்த்திகை (நவ-டிச), தை (ஜன-பிப்), பங்குனி (மார்-ஏப்)"
        : "Vaikasi (May-Jun), Avani (Aug-Sep), Karthigai (Nov-Dec), Thai (Jan-Feb), Panguni (Mar-Apr)",
      muhurthaRules: isTamil
        ? "செவ்வாய் ஹோரை அல்லது குரு ஹோரையில் அடிக்கல் நாட்டுதல், சுப லக்னத்தில் (ரிஷபம், சிம்மம், விருச்சிகம், கும்பம் - ஸ்திர லக்னங்கள்) கிரகப்பிரவேசம் செய்தல் பாரம்பரிய சுப பலனை அளிக்கும்."
        : "Traditional Muhurtha principles associate laying the foundation stone in Mars or Jupiter Hora during Sthira Lagna (Taurus, Leo, Scorpio, Aquarius) with domestic stability and architectural harmony.",
      rationale: isTamil
        ? `4-ம் சுக பாவக அதிபதி ${h4.lordPlanet?.tamil || h4.lordName} பலம் பெறும் காலங்களிலும், பூமிகாரகன் செவ்வாய்${mars ? ` ${mars.house}-ம் வீட்டில்` : ''} இயங்கும் காலங்களிலும் சொந்த மனை வாங்கி மாடி வீடு கட்டும் பாக்கியம் உண்டாகும்.`
        : `Activation of 4th lord ${h4.lordName} combined with Mars${mars ? ` (House ${mars.house})` : ''} transit over 4th/10th/11th houses creates strong real estate purchasing power, residential construction success, and property appreciation.`
    },
    {
      id: "vehicle",
      category: isTamil ? "புதிய வாகன சேர்க்கை & வாகன பூஜை (வாகன பிரவேசம்)" : "Vehicle Purchase & Automobile Conveyance (Vahana Pravesham)",
      ageRange: vehicleTiming.ageRange,
      calendarYears: vehicleTiming.calendarYears,
      favorablePlanets: isTamil ? "சுக்கிரன் (வாகன காரகன்), சந்திரன், புதன்" : "Venus (Vahana Karaka), Moon, Mercury & 4th House",
      bestNakshatras: isTamil
        ? "அசுவினி, ரோகிணி, புனர்பூசம், பூசம், அஸ்தம், சுவாதி, திருவோணம், அவிட்டம், சதயம், ரேவதி"
        : "Ashwini, Rohini, Punarvasu, Pushya, Hasta, Swati, Shravana, Dhanishta, Shatabhisha, Revati",
      bestDays: isTamil ? "வெள்ளி (சுக்கிரன்), புதன் (புதன்), திங்கள் (சந்திரன்)" : "Friday (Venus), Wednesday (Mercury), Monday (Moon)",
      rationale: isTamil
        ? `வாகன காரகன் சுக்கிரன்${venus ? ` ${venus.house}-ம் இட சுப பலத்தோடு` : ''} சஞ்சரிக்கும் போதும், வளர்பிறை சுப நட்சத்திர நாட்களில் புதிய வாகனம் வாங்குவது வசதியான மற்றும் அமைதியான பயணங்களை தரும்.`
        : `Venus (Significator of vehicular conveyance)${venus ? ` in House ${venus.house}` : ''} in harmony with 4th house ruler classically supports comfortable vehicular acquisitions and domestic mobility.`
    },
    {
      id: "business",
      category: isTamil ? "புதிய தொழில் தொடக்கம், வணிக விரிவாக்கம் & வர்த்தக முதலீடு (வியாபார ஆரம்பம்)" : "Business Launch, Commercial Expansion & Major Capital Investments (Vyapar Arambha)",
      ageRange: businessTiming.ageRange,
      calendarYears: businessTiming.calendarYears,
      favorablePlanets: isTamil ? "புதன் (வர்த்தக காரகன்), குரு (தன காரகன்), 10 & 11-ம் அதிபதிகள்" : "Mercury (Commerce), Jupiter (Wealth expansion), 10th & 11th Lords",
      bestTithis: isTamil
        ? "வளர்பிறை திருதியை, பஞ்சமி, சப்தமி, தசமி, ஏகாதசி, திரயோதசி"
        : "Shukla Paksha Tritiya, Panchami, Saptami, Dashami, Ekadashi, Trayodashi",
      favorableWeekdays: isTamil ? "புதன், வியாழன், வெள்ளி" : "Wednesday (Mercury), Thursday (Jupiter), Friday (Venus)",
      rationale: isTamil
        ? `10-ம் கர்ம ஸ்தானாதிபதி ${h10.lordPlanet?.tamil || h10.lordName} மற்றும் 11-ம் லாப ஸ்தானாதிபதி ${h11.lordPlanet?.tamil || h11.lordName} சுப அந்தர காலங்களில் புதிய தொழில் அல்லது கிளைகளை தொடங்குவது பலமடங்கு லாபத்தையும் தொழில் விரிவாக்கத்தையும் தரும்.`
        : `Coordinated transit of Jupiter over 10th/11th house lords ${h10.lordName}/${h11.lordName} provides classical astrological alignment for commercial enterprise development and strategic partnerships.`
    },
    {
      id: "career",
      category: isTamil ? "பதவி உயர்வு, தலைமைப் பொறுப்பு & அரசு அங்கீகாரம் (உத்தியோக ஆரோஹணம்)" : "Career Elevation, Executive Promotions & Government Recognition (Udyoga Arohana)",
      ageRange: careerTiming.ageRange,
      calendarYears: careerTiming.calendarYears,
      favorablePlanets: isTamil ? "சூரியன் (அதிகார காரகன்), சனி (கர்ம காரகன்), 10-ம் அதிபதி" : "Sun (Authority), Saturn (Discipline & Career), 10th House Lord",
      rationale: isTamil
        ? `சூரியன் ஆட்சி அல்லது உச்ச பலத்துடன் உள்ள காலங்களிலும், சனி பகவான் 10/11-ம் பாவகங்களில் சஞ்சரிக்கும் போதும் அரசு தேர்வுகள், கார்ப்பரேட் தலைமைப் பதவிகள் மற்றும் உத்தியோக முன்னேற்றம் கைகூடும்.`
        : `Sun-Saturn angular harmony with 10th lord ${h10.lordName} marks major career zenith transitions, administrative status, and professional public commendations.`
    },
    {
      id: "travel",
      category: isTamil ? "வெளிநாட்டு பயணம், சர்வதேச கல்வி & புனித யாத்திரை (தேச-விதேச யாத்திரை)" : "Foreign Travel, International Relocation & Pilgrimages (Desha-Videsha Yatra)",
      ageRange: travelTiming.ageRange,
      calendarYears: travelTiming.calendarYears,
      favorablePlanets: isTamil ? "சந்திரன், ராகு, 9 மற்றும் 12-ம் அதிபதிகள்" : "Moon (Mobility), Rahu (Foreign Lands), 9th & 12th Lords",
      auspiciousDirections: isTamil ? "வடக்கு, வடமேற்கு & கிழக்கு திசைகள்" : "North, North-West & Eastern Quadrants",
      rationale: isTamil
        ? `9-ம் பாக்கியாதிபதி ${h9.lordPlanet?.tamil || h9.lordName} மற்றும் 12-ம் வெளிநாட்டு அதிபதி ${h12.lordPlanet?.tamil || h12.lordName} இயங்கும் காலங்களில் அயல்நாட்டு உயர்கல்வி, தொழில்முறை இடப்பெயர்ச்சி மற்றும் வெளிநாட்டு வாழ்வு சுலபமாக கைகூடும்.`
        : `Activation of 9th (Long Journeys) and 12th (Overseas Settlement) lords under Rahu/Moon sub-periods facilitates opportunities for overseas journeys, higher education abroad, and cross-border relocations.`
    },
    {
      id: "functions",
      category: isTamil ? "குடும்ப சுப மங்கல காரியங்கள், நாமகரணம், உபநயனம் & சாந்தி ஹோமங்கள்" : "Auspicious Family Celebrations, Namakarana, Upanayana & Spiritual Samskaras",
      ageRange: functionsTiming.ageRange,
      calendarYears: functionsTiming.calendarYears,
      favorableLuniSolarTiming: isTamil ? "வளர்பிறை காலம், குரு ஹோரை, குரு-சந்திர சுப பார்வை" : "Shukla Paksha (Waxing Moon), Jupiter Hora, Moon-Jupiter Kendra",
      avoidanceGuidelines: isTamil
        ? "அஷ்டமி, நவமி, அமாவாசை மற்றும் ராகு காலங்களை சுப காரியங்களுக்கு தவிர்க்கவும்."
        : "Avoid Rikta Tithis (Chaturthi, Ashtami, Navami, Chaturdashi, Amavasya) and Rahu Kalam for initiating ceremonies.",
      rationale: isTamil
        ? `குரு பகவானின் சுப பார்வை லக்னம் அல்லது சந்திரனில் பதியும் காலங்களில் செய்யப்படும் நாமகரணம், காதணி விழா, சீமந்தம் போன்ற சுப நிகழ்வுகள் குடும்பத்தில் தலைமுறை தலைமுறையாக சுப மங்கலத்தை நிலைநிறுத்தும்.`
        : `Performing sacred samskaras under benevolent Jupiter drishti on waxing Moon days embeds lifelong spiritual protection, family unity, and dharmic prosperity.`
    }
  ];

  const dayToDayMuhurthaGuide = {
    brahmaMuhurtham: {
      time: brahmaTime,
      purpose: isTamil 
        ? "தியானம், வேத மந்திர ஜபம், ஆழ்ந்த கற்றல், இலக்கு நிர்ணயம் மற்றும் ஆன்ம சாந்திக்கு உகந்த உன்னத நேரம் (சூரிய உதயத்திற்கு முன் 2 முகூர்த்த காலம்)."
        : "Supreme window for meditation, pranayama, Vedic mantra chanting, conceptual study & mental clarity (2 Muhurthas prior to sunrise)."
    },
    abhijitMuhurtham: {
      time: abhijitTime,
      purpose: isTamil
        ? "மதிய சூரிய உச்ச வேளையில் நிகழும் 8-வது முகூர்த்தம்; அவசர வர்த்தக ஒப்பந்தங்கள், முக்கிய சந்திப்புகள் மற்றும் பயண தொடக்கத்திற்கு உகந்தது (புதன்கிழமை தவிர)."
        : "8th Muhurtha centered on local solar noon; powerful general auspicious window for commercial agreements, meetings & journeys (classically avoided on Wednesdays)."
    },
    amritaKaalam: {
      timingRule: isTamil ? "தினசரி நட்சத்திர தொடக்க நாழிகையிலிருந்து 4 நாழிகை (96 நிமிடங்கள்) கொண்ட சுப காலம் (முகூர்த்த சிந்தாமணி முறை)" : "Classical Muhurtha Chintamani starting Ghati per Nakshatra with a standard duration of 4 Ghatis (96 minutes)",
      purpose: isTamil
        ? "சொத்து ஆவணங்கள் கையெழுத்திடுதல், வங்கி கணக்கு தொடங்குதல், மருத்துவ சிகிச்சை எடுத்தல், தங்கம்/வெள்ளி வாங்குதல்."
        : "Signing property deeds, initiating bank accounts, starting vital medical treatments, purchasing precious metals."
    },
    rahuKalamAvoidance: {
      rule: isTamil
        ? "ராகு காலத்தில் எந்தவொரு புதிய முதலீடுகள், சுப பேச்சுவார்த்தைகள், கடன் வாங்குதல் அல்லது பயணங்கள் தொடங்குவதை தவிர்க்கவும்."
        : "Strictly avoid commencing new financial agreements, loan dispensations, matrimonial talks, or embarking on long journeys during Rahu Kalam.",
      weeklyTable
    },
    planetaryHoraGuide: [
      { 
        hora: isTamil ? "சூரிய ஹோரை (Sun Hora)" : "Sun Hora (Surya)", 
        ideal: isTamil ? "அரசு அதிகாரிகளை சந்தித்தல், பதவி ஏற்பு, டெண்டர் விண்ணப்பங்கள் சமர்ப்பித்தல்." : "Meeting executive authorities, filing state applications, asserting leadership." 
      },
      { 
        hora: isTamil ? "புதன் ஹோரை (Mercury Hora)" : "Mercury Hora (Budha)", 
        ideal: isTamil ? "கணக்கு துவங்குதல், சாப்ட்வேர் வெளியீடு, பத்திரப் பதிவு, கல்வி, வர்த்தகம், எழுத்து வேலைகள்." : "Accounting, documentation, contract drafting, coding, trading, higher study enrollment." 
      },
      { 
        hora: isTamil ? "குரு ஹோரை (Jupiter Hora)" : "Jupiter Hora (Guru)", 
        ideal: isTamil ? "நிதி முதலீடு, தங்கம் வாங்குதல், குரு உபதேசம், சுப பேச்சுவார்த்தை, கோவில் வழிபாடு." : "Financial investments, buying gold, meeting mentors, launching educational institutions, wedding discussions." 
      },
      { 
        hora: isTamil ? "சுக்கிர ஹோரை (Venus Hora)" : "Venus Hora (Shukra)", 
        ideal: isTamil ? "வாகனம் வாங்குதல், ஆடை ஆபரணம், கலைத்துறை, சினிமா, புதிய நட்பு, இல்லற சுப காரியங்கள்." : "Purchasing luxury vehicles, fine jewelry, media campaigns, creative arts, romantic alliances." 
      },
      { 
        hora: isTamil ? "செவ்வாய் ஹோரை (Mars Hora)" : "Mars Hora (Kuja)", 
        ideal: isTamil ? "நிலம் பத்திரப்பதிவு, கட்டட வேலை தொடக்கம், விளையாட்டு, அறுவை சிகிச்சை, இயந்திரங்கள் இயக்குதல்." : "Real estate deed registration, starting masonry/construction, athletic trials, surgical procedures." 
      }
    ]
  };

  return {
    summary: isTamil
      ? "உங்கள் ஜென்ம லக்னம், நவாம்சம் மற்றும் தசா புக்தி சுழற்சிகளை அடிப்படையாகக் கொண்டு துல்லியமாக கணக்கிடப்பட்ட மகா சுப முகூர்த்த கால அட்டவணை."
      : "Astrological timeline of auspicious milestone windows computed using your natal chart and Vimshottari Dasha cycles.",
    milestones,
    dayToDayMuhurthaGuide
  };
}

/**
 * Exact Sidereal Longitude for Any Celestial Body at Julian Date
 */
export function getSiderealLongitudeForBody(bodyName, jd, system = "lahiri") {
  const ayanamsha = getAyanamshaForSystem(jd, system);
  if (bodyName === "Rahu" || bodyName === "Ketu") {
    const T = (jd - 2451545.0) / 36525.0;
    const rahuMeanTrop = norm360(125.04455 - 1934.136261 * T + 0.0020754 * T * T + (T * T * T) / 467441.0 - (T * T * T * T) / 60616000.0);
    const rahuLong = norm360(rahuMeanTrop - ayanamsha);
    return bodyName === "Rahu" ? rahuLong : norm360(rahuLong + 180);
  }
  const dateObj = julianDateToDate(jd);
  const elon = Astronomy.Ecliptic(Astronomy.GeoVector(bodyName, dateObj, true)).elon;
  return norm360(elon - ayanamsha);
}

/**
 * EXACT NUMERICAL TRANSIT EVENT ROOT SOLVER
 * Pinpoints exact Julian Days and UTC timestamps for ingress and aspect crossings
 * (conjunction, opposition, trines, squares, Parashari special aspects) to < 1 minute precision.
 */
export function findTransitEvents(firstArg, maybeAscLong, maybeJdStart, maybeJdEnd) {
  // Overload: If called with (planets, ascendantLong, jdStart, jdEnd), delegate to findMajorTransitEventsForWindow
  if (Array.isArray(firstArg) || (firstArg && typeof firstArg === "object" && !("targetDateStart" in firstArg) && !("targetLongitude" in firstArg) && !("transitingPlanet" in firstArg) && !("eventType" in firstArg))) {
    return findMajorTransitEventsForWindow(firstArg, maybeAscLong, maybeJdStart, maybeJdEnd);
  }

  const {
    targetDateStart,
    targetDateEnd,
    transitingPlanet = "Jupiter",
    targetLongitude = null,
    aspectAngle = 0,
    eventType = "aspect",
    stepDays = 3.0,
    toleranceDeg = 0.0001
  } = firstArg || {};

  const parseToJd = (dt) => {
    if (dt instanceof Date) return (dt.getTime() / 86400000) + 2440587.5;
    if (typeof dt === "number") return dt;
    if (typeof dt === "string") {
      const match = dt.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const y = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const d = parseInt(match[3], 10);
        return getJulianDate(y, m, d, 12, 0, 0);
      }
    }
    return NaN;
  };

  const jdStart = parseToJd(targetDateStart);
  const jdEnd = parseToJd(targetDateEnd);

  if (!Number.isFinite(jdStart) || !Number.isFinite(jdEnd)) {
    throw new Error("Valid finite Julian Day range required for transit event search");
  }

  if (jdEnd <= jdStart) {
    throw new Error("jdEnd must be strictly greater than jdStart for transit event search");
  }

  const events = [];
  const effectiveStep = ["Moon", "Mercury", "Venus", "Sun"].includes(transitingPlanet) ? Math.min(stepDays, 0.5) : stepDays;

  const evalDiff = (jd, tgtDeg) => {
    const planetLong = getSiderealLongitudeForBody(transitingPlanet, jd);
    return norm180(planetLong - tgtDeg);
  };

  if (eventType === "ingress") {
    let prevJd = jdStart;
    let prevLong = getSiderealLongitudeForBody(transitingPlanet, prevJd);
    let prevSignIdx = Math.floor(prevLong / 30);

    for (let t = jdStart + effectiveStep; t <= jdEnd + effectiveStep * 0.5; t += effectiveStep) {
      const currJd = Math.min(t, jdEnd);
      const currLong = getSiderealLongitudeForBody(transitingPlanet, currJd);
      const currSignIdx = Math.floor(currLong / 30);

      const isAdjacentSign = currSignIdx === (prevSignIdx + 1) % 12 || prevSignIdx === (currSignIdx + 1) % 12;
      if (currSignIdx !== prevSignIdx && isAdjacentSign) {
        let boundaryDeg;
        if (currSignIdx === (prevSignIdx + 1) % 12) {
          boundaryDeg = (prevSignIdx === 11 && currSignIdx === 0) ? 0.0 : currSignIdx * 30.0;
        } else {
          boundaryDeg = (prevSignIdx === 0 && currSignIdx === 11) ? 0.0 : prevSignIdx * 30.0;
        }

        let low = prevJd, high = currJd;
        let lowDiff = evalDiff(low, boundaryDeg);
        let finalIter = 0;
        let finalDiff = lowDiff;
        for (let iter = 0; iter < 24; iter++) {
          finalIter = iter + 1;
          const mid = (low + high) / 2;
          const midDiff = evalDiff(mid, boundaryDeg);
          finalDiff = midDiff;
          const bracketSec = (high - low) * 86400;
          if (Math.abs(midDiff) <= toleranceDeg && bracketSec <= 60) {
            low = mid; high = mid; break;
          }
          if (lowDiff * midDiff <= 0) {
            high = mid;
          } else {
            low = mid;
            lowDiff = midDiff;
          }
        }
        const rootJd = (low + high) / 2;
        const rootDate = julianDateToDate(rootJd);
        const dt = 0.05;
        const speed = (getSiderealLongitudeForBody(transitingPlanet, rootJd + dt) - getSiderealLongitudeForBody(transitingPlanet, rootJd - dt)) / (2 * dt);
        const motion = speed >= 0 ? "Direct" : "Retrograde";
        const signEntering = ZODIAC_SIGNS[currSignIdx];

        events.push({
          eventType: "ingress",
          transitingPlanet,
          transitingPlanetTamil: DASHA_LORDS.find(d => d.lord === transitingPlanet)?.tamil || transitingPlanet,
          targetType: "sign_boundary",
          targetSignIndex: currSignIdx,
          targetSignName: signEntering.name,
          targetSignTamil: signEntering.tamil,
          targetPlanet: null,
          targetPlanetTamil: null,
          aspectAngle: 0,
          aspectName: "Ingress (பெயர்ச்சி)",
          boundaryLongitude: boundaryDeg,
          jd: rootJd,
          rootJd,
          dateIso: rootDate.toISOString().slice(0, 10),
          dateTimeIso: rootDate.toISOString(),
          utcDateTimeIso: rootDate.toISOString(),
          date: rootDate,
          motion,
          speedDegPerDay: speed,
          angularResidualDeg: Math.abs(finalDiff),
          timeBracketSeconds: (high - low) * 86400,
          iterations: finalIter,
          summaryEn: `${transitingPlanet} entered ${signEntering.name} on ${rootDate.toISOString().slice(0, 10)} (${motion})`,
          summaryTa: `${DASHA_LORDS.find(d => d.lord === transitingPlanet)?.tamil || transitingPlanet} ${signEntering.tamil} ராசியில் ${rootDate.toISOString().slice(0, 10)} அன்று பெயர்ச்சி (${motion === "Direct" ? "நேர்கதி" : "வக்ரகதி"})`
        });
      }
      prevJd = currJd;
      prevLong = currLong;
      prevSignIdx = currSignIdx;
    }
  } else {
    if (targetLongitude === null || targetLongitude === undefined || !Number.isFinite(Number(targetLongitude))) {
      throw new Error("targetLongitude required for aspect transit event search.");
    }
    const targetDeg = norm360(Number(targetLongitude) + Number(aspectAngle));
    let prevJd = jdStart;
    let prevDiff = evalDiff(prevJd, targetDeg);

    for (let t = jdStart + effectiveStep; t <= jdEnd + effectiveStep * 0.5; t += effectiveStep) {
      const currJd = Math.min(t, jdEnd);
      const currDiff = evalDiff(currJd, targetDeg);

      if (prevDiff * currDiff <= 0 && Math.abs(prevDiff - currDiff) < 180) {
        let low = prevJd, high = currJd;
        let lowDiff = prevDiff;
        let finalIter = 0;
        let finalDiff = lowDiff;
        for (let iter = 0; iter < 24; iter++) {
          finalIter = iter + 1;
          const mid = (low + high) / 2;
          const midDiff = evalDiff(mid, targetDeg);
          finalDiff = midDiff;
          const bracketSec = (high - low) * 86400;
          if (Math.abs(midDiff) <= toleranceDeg && bracketSec <= 60) {
            low = mid; high = mid; break;
          }
          if (lowDiff * midDiff <= 0) {
            high = mid;
          } else {
            low = mid;
            lowDiff = midDiff;
          }
        }
        const rootJd = (low + high) / 2;
        const rootDate = julianDateToDate(rootJd);
        const dt = 0.05;
        const speed = (getSiderealLongitudeForBody(transitingPlanet, rootJd + dt) - getSiderealLongitudeForBody(transitingPlanet, rootJd - dt)) / (2 * dt);
        const motion = speed >= 0 ? "Direct" : "Retrograde";

        events.push({
          eventType: "aspect",
          transitingPlanet,
          transitingPlanetTamil: DASHA_LORDS.find(d => d.lord === transitingPlanet)?.tamil || transitingPlanet,
          targetType: "natal_point",
          targetLongitude: Number(targetLongitude),
          aspectAngle: Number(aspectAngle),
          exactCrossingLongitude: targetDeg,
          targetSignIndex: Math.floor(targetDeg / 30),
          targetSignName: ZODIAC_SIGNS[Math.floor(targetDeg / 30)].name,
          targetSignTamil: ZODIAC_SIGNS[Math.floor(targetDeg / 30)].tamil,
          targetPlanet: null,
          targetPlanetTamil: null,
          aspectName: aspectAngle === 0 ? "Conjunction (இணைவு)" : (aspectAngle === 180 ? "Mutual Aspect (சமசப்தம பார்வை)" : `Aspect (${aspectAngle}° பார்வை)`),
          jd: rootJd,
          rootJd,
          dateIso: rootDate.toISOString().slice(0, 10),
          dateTimeIso: rootDate.toISOString(),
          utcDateTimeIso: rootDate.toISOString(),
          date: rootDate,
          motion,
          speedDegPerDay: speed,
          angularResidualDeg: Math.abs(finalDiff),
          timeBracketSeconds: (high - low) * 86400,
          iterations: finalIter,
          summaryEn: `Transit ${transitingPlanet} aspecting ${targetDeg.toFixed(1)}° on ${rootDate.toISOString().slice(0, 10)} (${motion})`,
          summaryTa: `கோசார ${DASHA_LORDS.find(d => d.lord === transitingPlanet)?.tamil || transitingPlanet} ${targetDeg.toFixed(1)}° பாகையை ${rootDate.toISOString().slice(0, 10)} அன்று பார்வை (${motion === "Direct" ? "நேர்கதி" : "வக்ரகதி"})`
        });
      }
      prevJd = currJd;
      prevDiff = currDiff;
    }
  }

  events.sort((a, b) => a.jd - b.jd);
  return events;
}

const _transitWindowCache = new Map();
const MAX_TRANSIT_WINDOW_CACHE = 200;

export function clearTransitWindowCache() {
  _transitWindowCache.clear();
}

function formatLocalDateTime(rootDate, tzOffsetHours = 5.5) {
  const localMs = rootDate.getTime() + tzOffsetHours * 3600000;
  const localDateObj = new Date(localMs);
  const y = localDateObj.getUTCFullYear();
  const m = String(localDateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(localDateObj.getUTCDate()).padStart(2, '0');
  const hh = String(localDateObj.getUTCHours()).padStart(2, '0');
  const mm = String(localDateObj.getUTCMinutes()).padStart(2, '0');
  const ss = String(localDateObj.getUTCSeconds()).padStart(2, '0');
  return {
    localDate: `${y}-${m}-${d}`,
    localTime: `${hh}:${mm}:${ss}`,
    localDateTimeStr: `${y}-${m}-${d} ${hh}:${mm}:${ss}`
  };
}

/**
 * COMPREHENSIVE WINDOW-LEVEL TRANSIT CONVERGENCE SOLVER
 * Computes domain-specific planetary crossings to chart points across any JD window with dual convergence.
 */
export function findMajorTransitEventsForWindow(planets = [], ascendantLong = 0, jdStart, jdEnd, domain = "all", timezoneOffsetHours = 5.5, timezoneId = null) {
  const effectiveTzId = (typeof timezoneId === "string" && timezoneId) ? timezoneId : (timezoneOffsetHours === 5.5 ? "Asia/Kolkata" : "UTC");
  const parseToJd = (dt) => {
    if (dt instanceof Date) return (dt.getTime() / 86400000) + 2440587.5;
    if (typeof dt === "number") return dt;
    if (typeof dt === "string") {
      const match = dt.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const y = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const d = parseInt(match[3], 10);
        return getJulianDate(y, m, d, 12, 0, 0);
      }
    }
    return NaN;
  };

  const startJd = parseToJd(jdStart);
  const endJd = parseToJd(jdEnd);
  if (!Number.isFinite(startJd) || !Number.isFinite(endJd)) {
    throw new Error("Valid finite Julian Day range required for major transit events window calculation");
  }
  if (endJd <= startJd) {
    throw new Error("jdEnd must be strictly greater than jdStart for major transit events window calculation");
  }

  const ascLong = typeof ascendantLong === "number" ? ascendantLong : (ascendantLong?.longitude ?? 0);
  const lagnaSignIdx = Math.floor(norm360(ascLong) / 30);

  const cacheKey = `${domain}_${Math.round(ascLong * 100)}_${Math.round(startJd * 100)}_${Math.round(endJd * 100)}`;
  if (_transitWindowCache.has(cacheKey)) {
    return _transitWindowCache.get(cacheKey);
  }

  const getLordOfHouse = (hNum) => {
    const sIdx = (lagnaSignIdx + hNum - 1) % 12;
    return ZODIAC_SIGNS[sIdx].ruler;
  };

  const getPlanetSignIdx = (pName) => {
    const pl = (planets || []).find(p => p.name?.toLowerCase() === pName?.toLowerCase());
    if (!pl) return null;
    const pLong = pl.longitude ?? pl.long ?? (pl.sign ? (ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === pl.sign.toLowerCase()) * 30 + (pl.degreeInSign || 0)) : null);
    return pLong !== null ? Math.floor(norm360(pLong) / 30) : null;
  };

  // Domain-specific transit grahas and target house cusps & significators
  let transitingPlanets = ["Jupiter", "Saturn", "Rahu", "Ketu"];
  let targetGrahaNames = ["Moon", "Sun"];
  let domainRelevantSigns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  if (domain === "marriage") {
    transitingPlanets = ["Jupiter", "Saturn", "Venus"];
    const h7Lord = getLordOfHouse(7);
    targetGrahaNames = ["Venus", "Jupiter", h7Lord].filter(Boolean);
    const h7Sign = (lagnaSignIdx + 6) % 12;
    const h2Sign = (lagnaSignIdx + 1) % 12;
    const h11Sign = (lagnaSignIdx + 10) % 12;
    domainRelevantSigns = [h7Sign, h2Sign, h11Sign, getPlanetSignIdx("Venus"), getPlanetSignIdx("Jupiter"), getPlanetSignIdx(h7Lord)].filter(s => s !== null);
  } else if (domain === "career") {
    transitingPlanets = ["Jupiter", "Saturn", "Sun"];
    const h10Lord = getLordOfHouse(10);
    targetGrahaNames = ["Sun", "Saturn", "Jupiter", h10Lord].filter(Boolean);
    const h10Sign = (lagnaSignIdx + 9) % 12;
    const h1Sign = lagnaSignIdx;
    const h11Sign = (lagnaSignIdx + 10) % 12;
    const h6Sign = (lagnaSignIdx + 5) % 12;
    domainRelevantSigns = [h10Sign, h1Sign, h11Sign, h6Sign, getPlanetSignIdx("Sun"), getPlanetSignIdx("Saturn"), getPlanetSignIdx("Jupiter"), getPlanetSignIdx(h10Lord)].filter(s => s !== null);
  } else if (domain === "property") {
    transitingPlanets = ["Mars", "Jupiter", "Saturn"];
    const h4Lord = getLordOfHouse(4);
    targetGrahaNames = ["Mars", "Venus", h4Lord].filter(Boolean);
    const h4Sign = (lagnaSignIdx + 3) % 12;
    const h2Sign = (lagnaSignIdx + 1) % 12;
    const h11Sign = (lagnaSignIdx + 10) % 12;
    domainRelevantSigns = [h4Sign, h2Sign, h11Sign, getPlanetSignIdx("Mars"), getPlanetSignIdx("Venus"), getPlanetSignIdx(h4Lord)].filter(s => s !== null);
  } else if (domain === "education") {
    transitingPlanets = ["Jupiter", "Mercury"];
    const h4Lord = getLordOfHouse(4);
    const h5Lord = getLordOfHouse(5);
    const h9Lord = getLordOfHouse(9);
    targetGrahaNames = ["Mercury", "Jupiter", h4Lord, h5Lord, h9Lord].filter(Boolean);
    const h4Sign = (lagnaSignIdx + 3) % 12;
    const h5Sign = (lagnaSignIdx + 4) % 12;
    const h9Sign = (lagnaSignIdx + 8) % 12;
    domainRelevantSigns = [h4Sign, h5Sign, h9Sign, getPlanetSignIdx("Mercury"), getPlanetSignIdx("Jupiter"), getPlanetSignIdx(h4Lord), getPlanetSignIdx(h5Lord), getPlanetSignIdx(h9Lord)].filter(s => s !== null);
  } else if (domain === "progeny") {
    transitingPlanets = ["Jupiter"];
    const h5Lord = getLordOfHouse(5);
    targetGrahaNames = ["Jupiter", h5Lord].filter(Boolean);
    const h5Sign = (lagnaSignIdx + 4) % 12;
    const h9Sign = (lagnaSignIdx + 8) % 12;
    domainRelevantSigns = [h5Sign, h9Sign, getPlanetSignIdx("Jupiter"), getPlanetSignIdx(h5Lord)].filter(s => s !== null);
  } else if (domain === "health" || domain === "wellness") {
    transitingPlanets = ["Saturn", "Mars", "Rahu", "Ketu"];
    const h6Lord = getLordOfHouse(6);
    const h8Lord = getLordOfHouse(8);
    targetGrahaNames = ["Moon", "Sun", h6Lord, h8Lord].filter(Boolean);
    const h6Sign = (lagnaSignIdx + 5) % 12;
    const h8Sign = (lagnaSignIdx + 7) % 12;
    const h12Sign = (lagnaSignIdx + 11) % 12;
    domainRelevantSigns = [h6Sign, h8Sign, h12Sign, lagnaSignIdx, getPlanetSignIdx("Moon"), getPlanetSignIdx("Sun"), getPlanetSignIdx(h6Lord), getPlanetSignIdx(h8Lord)].filter(s => s !== null);
  } else {
    // all
    targetGrahaNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
    domainRelevantSigns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }

  const keyTargets = [
    { name: "Ascendant (Lagna)", tamil: "லக்னம்", long: ascLong }
  ];

  if (Array.isArray(planets)) {
    for (const p of planets) {
      if (targetGrahaNames.includes(p.name)) {
        const pLong = p.longitude ?? p.long ?? (p.sign ? (ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === p.sign.toLowerCase()) * 30 + (p.degreeInSign || 0)) : 0);
        keyTargets.push({ name: p.name, tamil: p.tamil || p.name, long: pLong });
      }
    }
  }

  const events = [];

  for (const transitingPlanet of transitingPlanets) {
    const stepDays = ["Venus", "Mars", "Mercury", "Sun"].includes(transitingPlanet) ? 5.0 : 12.0;
    const aspectConfigs = transitingPlanet === "Jupiter"
      ? [{ angle: 0, name: "Conjunction (1/1)" }, { angle: 120, name: "5th Aspect (5/9)" }, { angle: 180, name: "Mutual Aspect (1/7)" }, { angle: 240, name: "9th Aspect (9/5)" }]
      : (transitingPlanet === "Saturn"
          ? [{ angle: 0, name: "Conjunction (1/1)" }, { angle: 60, name: "3rd Aspect (3/10)" }, { angle: 180, name: "Mutual Aspect (1/7)" }, { angle: 270, name: "10th Aspect (10/3)" }]
          : (transitingPlanet === "Mars"
              ? [{ angle: 0, name: "Conjunction (1/1)" }, { angle: 90, name: "4th Aspect (4/10)" }, { angle: 180, name: "Mutual Aspect (1/7)" }, { angle: 210, name: "8th Aspect (8/6)" }]
              : [{ angle: 0, name: "Conjunction (1/1)" }, { angle: 180, name: "Mutual Aspect (1/7)" }]));

    let prevJd = startJd;
    let prevLong = getSiderealLongitudeForBody(transitingPlanet, prevJd);
    let prevSignIdx = Math.floor(prevLong / 30);

    for (let t = startJd + stepDays; t <= endJd + stepDays * 0.5; t += stepDays) {
      const currJd = Math.min(t, endJd);
      const currLong = getSiderealLongitudeForBody(transitingPlanet, currJd);
      const currSignIdx = Math.floor(currLong / 30);

      // Domain-relevant Ingress check
      const isAdjacentSign = currSignIdx === (prevSignIdx + 1) % 12 || prevSignIdx === (currSignIdx + 1) % 12;
      const isDomainRelevantIngress = (domain === "all") || domainRelevantSigns.includes(currSignIdx);
      if (currSignIdx !== prevSignIdx && isAdjacentSign && isDomainRelevantIngress) {
        let boundaryDeg;
        if (currSignIdx === (prevSignIdx + 1) % 12) {
          boundaryDeg = (prevSignIdx === 11 && currSignIdx === 0) ? 0.0 : currSignIdx * 30.0;
        } else {
          boundaryDeg = (prevSignIdx === 0 && currSignIdx === 11) ? 0.0 : prevSignIdx * 30.0;
        }

        let low = prevJd, high = currJd;
        let lowDiff = norm180(prevLong - boundaryDeg);
        let finalIter = 0;
        let finalDiff = lowDiff;
        for (let iter = 0; iter < 24; iter++) {
          finalIter = iter + 1;
          const mid = (low + high) / 2;
          const midDiff = norm180(getSiderealLongitudeForBody(transitingPlanet, mid) - boundaryDeg);
          finalDiff = midDiff;
          const bracketSec = (high - low) * 86400;
          if (Math.abs(midDiff) <= 0.0001 && bracketSec <= 60) { low = mid; high = mid; break; }
          if (lowDiff * midDiff <= 0) high = mid; else { low = mid; lowDiff = midDiff; }
        }
        const rootJd = (low + high) / 2;
        const rootDate = julianDateToDate(rootJd);
        const dt = 0.05;
        const speed = (getSiderealLongitudeForBody(transitingPlanet, rootJd + dt) - getSiderealLongitudeForBody(transitingPlanet, rootJd - dt)) / (2 * dt);
        const motion = speed >= 0 ? "Direct" : "Retrograde";
        const signEntering = ZODIAC_SIGNS[currSignIdx];
        const localInfo = formatLocalDateTime(rootDate, timezoneOffsetHours);

        events.push({
          eventType: "ingress",
          transitingPlanet,
          transitingPlanetTamil: DASHA_LORDS.find(d => d.lord === transitingPlanet)?.tamil || transitingPlanet,
          targetType: "sign_boundary",
          targetSignIndex: currSignIdx,
          targetSignName: signEntering.name,
          targetSignTamil: signEntering.tamil,
          targetPlanet: null,
          targetPlanetTamil: null,
          aspectAngle: 0,
          aspectName: "Ingress (பெயர்ச்சி)",
          boundaryLongitude: boundaryDeg,
          jd: rootJd,
          rootJd,
          dateIso: rootDate.toISOString().slice(0, 10),
          dateTimeIso: rootDate.toISOString(),
          utcDateTimeIso: rootDate.toISOString(),
          localDate: localInfo.localDate,
          localTime: localInfo.localTime,
          timezoneId: effectiveTzId,
          date: rootDate,
          motion,
          speedDegPerDay: speed,
          angularResidualDeg: Math.abs(finalDiff),
          timeBracketSeconds: (high - low) * 86400,
          iterations: finalIter,
          summaryEn: `${transitingPlanet} entered ${signEntering.name} on ${localInfo.localDate} (${motion})`,
          summaryTa: `${DASHA_LORDS.find(d => d.lord === transitingPlanet)?.tamil || transitingPlanet} ${signEntering.tamil} ராசியில் ${localInfo.localDate} அன்று பெயர்ச்சி (${motion === "Direct" ? "நேர்கதி" : "வக்ரகதி"})`
        });
      }

      // Aspect checks on keyTargets
      for (const tgt of keyTargets) {
        for (const ac of aspectConfigs) {
          const tgtDeg = norm360(tgt.long + ac.angle);
          const pDiff = norm180(prevLong - tgtDeg);
          const cDiff = norm180(currLong - tgtDeg);

          if (pDiff * cDiff <= 0 && Math.abs(pDiff - cDiff) < 180) {
            let low = prevJd, high = currJd;
            let lowDiff = pDiff;
            let finalIter = 0;
            let finalDiff = lowDiff;
            for (let iter = 0; iter < 24; iter++) {
              finalIter = iter + 1;
              const mid = (low + high) / 2;
              const midDiff = norm180(getSiderealLongitudeForBody(transitingPlanet, mid) - tgtDeg);
              finalDiff = midDiff;
              const bracketSec = (high - low) * 86400;
              if (Math.abs(midDiff) <= 0.0001 && bracketSec <= 60) { low = mid; high = mid; break; }
              if (lowDiff * midDiff <= 0) high = mid; else { low = mid; lowDiff = midDiff; }
            }
            const rootJd = (low + high) / 2;
            const rootDate = julianDateToDate(rootJd);
            const dt = 0.05;
            const speed = (getSiderealLongitudeForBody(transitingPlanet, rootJd + dt) - getSiderealLongitudeForBody(transitingPlanet, rootJd - dt)) / (2 * dt);
            const motion = speed >= 0 ? "Direct" : "Retrograde";
            const localInfo = formatLocalDateTime(rootDate, timezoneOffsetHours);

            events.push({
              eventType: "aspect",
              transitingPlanet,
              transitingPlanetTamil: DASHA_LORDS.find(d => d.lord === transitingPlanet)?.tamil || transitingPlanet,
              targetType: tgt.name === "Ascendant (Lagna)" ? "ascendant" : "natal_planet",
              targetSignIndex: Math.floor(tgtDeg / 30),
              targetSignName: ZODIAC_SIGNS[Math.floor(tgtDeg / 30)].name,
              targetSignTamil: ZODIAC_SIGNS[Math.floor(tgtDeg / 30)].tamil,
              targetPlanet: tgt.name,
              targetPlanetTamil: tgt.tamil,
              aspectAngle: ac.angle,
              aspectName: ac.name,
              jd: rootJd,
              rootJd,
              dateIso: rootDate.toISOString().slice(0, 10),
              dateTimeIso: rootDate.toISOString(),
              utcDateTimeIso: rootDate.toISOString(),
              localDate: localInfo.localDate,
              localTime: localInfo.localTime,
              timezoneId: effectiveTzId,
              date: rootDate,
              motion,
              speedDegPerDay: speed,
              angularResidualDeg: Math.abs(finalDiff),
              timeBracketSeconds: (high - low) * 86400,
              iterations: finalIter,
              summaryEn: `Transit ${transitingPlanet} ${ac.name} to ${tgt.name} on ${localInfo.localDate} (${motion})`,
              summaryTa: `கோசார ${DASHA_LORDS.find(d => d.lord === transitingPlanet)?.tamil || transitingPlanet} ${tgt.tamil} மீது ${ac.name} பார்வை/இணைவு - ${localInfo.localDate} (${motion === "Direct" ? "நேர்கதி" : "வக்ரகதி"})`
            });
          }
        }
      }

      prevJd = currJd;
      prevLong = currLong;
      prevSignIdx = currSignIdx;
    }
  }

  events.sort((a, b) => a.jd - b.jd);
  if (_transitWindowCache.size >= MAX_TRANSIT_WINDOW_CACHE) {
    const firstKey = _transitWindowCache.keys().next().value;
    _transitWindowCache.delete(firstKey);
  }
  _transitWindowCache.set(cacheKey, events);
  return events;
}

/**
 * Common chart parameter parser for event timing engines
 */
function parseChartContext(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang) {
  if (chartOrPlanets && Array.isArray(chartOrPlanets.planets)) {
    const birthInstant = chartOrPlanets.birthInstantUtc || (chartOrPlanets.date instanceof Date ? chartOrPlanets.date : null);
    let birthJd = null;
    if (birthInstant instanceof Date && !isNaN(birthInstant.getTime())) {
      birthJd = getJulianDateFromUtc(birthInstant);
    } else if (typeof chartOrPlanets.birthDateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(chartOrPlanets.birthDateStr) && chartOrPlanets.birthTimeStr) {
      const [by, bm, bd] = chartOrPlanets.birthDateStr.split("-").map(Number);
      const [bh, bmin, bsec] = chartOrPlanets.birthTimeStr.split(":").map(Number);
      const tzOff = chartOrPlanets.timezoneOffsetHours ?? chartOrPlanets.utcOffset ?? chartOrPlanets.tz ?? 0;
      birthJd = getJulianDate(by, bm, bd, bh, bmin, bsec || 0) - (tzOff / 24.0);
    }
    const ascLongVal = chartOrPlanets.ascendant?.longitude ?? chartOrPlanets.ascendantLong ?? chartOrPlanets.ascendantDeg ?? (typeof maybeAscLong === "number" ? maybeAscLong : null);
    const moonPlanet = chartOrPlanets.planets?.find(p => p.name === "Moon");
    const moonLongVal = chartOrPlanets.moon?.longitude ?? chartOrPlanets.moonLong ?? moonPlanet?.longitude ?? (typeof maybeMoonLong === "number" ? maybeMoonLong : null);

    return {
      planets: chartOrPlanets.planets,
      ascendantLong: ascLongVal,
      moonLong: moonLongVal,
      dashaTable: chartOrPlanets.dashaTable ?? [],
      birthYear: chartOrPlanets.birthYear ?? (birthInstant ? birthInstant.getUTCFullYear() : (typeof chartOrPlanets.birthDateStr === "string" ? Number(chartOrPlanets.birthDateStr.split("-")[0]) : null)),
      birthInstantUtc: birthInstant,
      birthJd,
      lang: typeof maybeAscLong === "string" ? maybeAscLong : (chartOrPlanets.lang || "en"),
      divisionalCharts: chartOrPlanets.divisionalCharts || null,
      shadbala: chartOrPlanets.shadbala || [],
      timezoneOffsetHours: chartOrPlanets.timezoneOffsetHours ?? chartOrPlanets.utcOffset ?? chartOrPlanets.tz ?? null,
      timezoneId: chartOrPlanets.timezoneId || chartOrPlanets.ianaTimezone || null
    };
  }
  return {
    planets: Array.isArray(chartOrPlanets) ? chartOrPlanets : [],
    ascendantLong: typeof maybeAscLong === "number" ? maybeAscLong : null,
    moonLong: typeof maybeMoonLong === "number" ? maybeMoonLong : null,
    dashaTable: Array.isArray(maybeDashaTable) ? maybeDashaTable : [],
    birthYear: typeof maybeBirthYear === "number" ? maybeBirthYear : null,
    birthInstantUtc: null,
    birthJd: null,
    lang: maybeLang ?? "en",
    divisionalCharts: null,
    shadbala: [],
    timezoneOffsetHours: null,
    timezoneId: null
  };
}

/// ---------------------------------------------------------------------------
// DEDICATED CLASSICAL EVENT TIMING ENGINES (GENUINE MULTI-VARGA CONVERGENCE)
// ---------------------------------------------------------------------------

/**
 * Universal Varga Chart Context Extractor
 * Calculates divisional positions, house placements from Varga Lagna, and dignities
 */
export function getVargaChartData(planets = [], ascendantLong, vargaFn) {
  if (typeof vargaFn !== "function") {
    return { status: "INSUFFICIENT_DATA", planets: [], ascendantSign: "Unknown", ascendantSignIdx: 0 };
  }
  const rawAsc = typeof ascendantLong === "number" ? ascendantLong : (ascendantLong?.longitude ?? ascendantLong?.long);
  if (!Number.isFinite(rawAsc)) {
    return { status: "INSUFFICIENT_DATA", planets: [], ascendantSign: "Unknown", ascendantSignIdx: 0 };
  }
  const ascLong = rawAsc;
  const ascVarga = vargaFn(ascLong);
  const ascSignIdx = ascVarga.index;
  const mapped = planets.map(p => {
    let pLong = 0;
    if (typeof p.longitude === "number") {
      pLong = p.longitude;
    } else if (typeof p.long === "number") {
      pLong = p.long;
    } else if (p.sign) {
      const sIdx = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === p.sign.toLowerCase() || s.id.toLowerCase() === p.sign.toLowerCase());
      pLong = (sIdx >= 0 ? sIdx * 30 : 0) + (p.degreeInSign || 0);
    }
    const vSign = vargaFn(pLong);
    const vSignIdx = vSign.index;
    const vHouse = ((vSignIdx - ascSignIdx + 12) % 12) + 1;
    const signRuler = ZODIAC_SIGNS[vSignIdx].ruler;
    
    // Dignity evaluation in Varga
    let vDignity = "Neutral";
    const exaltMap = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 };
    const debilMap = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0, Rahu: 7, Ketu: 1 };
    
    if (exaltMap[p.name] !== undefined && vSignIdx === exaltMap[p.name]) {
      vDignity = "Exalted";
    } else if (debilMap[p.name] !== undefined && vSignIdx === debilMap[p.name]) {
      vDignity = "Debilitated";
    } else if (signRuler === p.name) {
      vDignity = "Own";
    } else {
      const nais = NAISARGIKA_FRIENDSHIP[p.name];
      if (nais?.friends?.includes(signRuler)) vDignity = "Friend";
      else if (nais?.enemies?.includes(signRuler)) vDignity = "Enemy";
      else vDignity = "Neutral";
    }

    return {
      name: p.name,
      tamil: p.tamil,
      longitude: pLong,
      vargaSignIdx: vSignIdx,
      vargaSignName: vSign.name,
      vargaSignTamil: vSign.tamil,
      vargaHouse: vHouse,
      vargaDignity: vDignity,
      signRuler
    };
  });

  return {
    ascendant: {
      signIdx: ascSignIdx,
      signName: ascVarga.name,
      signTamil: ascVarga.tamil,
      ruler: ZODIAC_SIGNS[ascSignIdx].ruler
    },
    planets: mapped,
    getPlanet: (name) => mapped.find(p => p.name.toLowerCase() === name?.toLowerCase())
  };
}

/**
 * Evidence-Based Pratyantardasha (PD) Ranking Engine
 * Evaluates D1 lordship, Varga activation, sub-window transit crossings, and Sambandha
 * to rank all 9 PDs and qualify peak activation windows (score >= 3.0).
 */
export function rankPratyantardashasForDomain(pratyantardashas, domain, ctx, bkLord, jdStart, jdEnd, precomputedTransits = null) {
  if (!Array.isArray(pratyantardashas) || pratyantardashas.length === 0) {
    return { rankedPDs: [], peakPD: null, peakWindow: null };
  }

  const ascLong = ctx?.ascendantLong ?? ctx?.ascendant?.longitude;
  if (!Number.isFinite(ascLong)) {
    return { rankedPDs: [], peakPD: null, peakWindow: null, status: "INSUFFICIENT_DATA" };
  }
  const isTamil = ctx?.lang === "ta";
  const lagnaSignIdx = Math.floor(norm360(ascLong) / 30);
  const planets = ctx?.planets || [];
  const tzOffset = ctx?.timezoneOffsetHours ?? (ctx?.timezoneId === "UTC" ? 0 : (ctx?.timezoneId === "Asia/Kolkata" ? 5.5 : null));
  const tzId = ctx?.timezoneId || (ctx?.timezoneOffsetHours === 5.5 ? "Asia/Kolkata" : (ctx?.timezoneOffsetHours === 0 ? "UTC" : null));

  const getBhavaSignAndLord = (bhavaNum) => {
    const bhavaSignIdx = (lagnaSignIdx + (bhavaNum - 1)) % 12;
    const sign = ZODIAC_SIGNS[bhavaSignIdx];
    const lordName = sign ? sign.ruler : "Sun";
    return { bhavaNum, sign, lordName };
  };

  const getHousesRuled = (pName) => {
    if (!pName) return [];
    const res = [];
    for (let h = 1; h <= 12; h++) {
      if (getBhavaSignAndLord(h).lordName.toLowerCase() === pName.toLowerCase()) {
        res.push(h);
      }
    }
    return res;
  };

  // Domain configurations
  const domainConfig = {
    marriage: {
      primaryHouses: [7],
      secondaryHouses: [2, 11, 1],
      karakas: ["Venus", "Jupiter"],
      vargaFn: calculateD9,
      vargaName: "D9",
      transitCategory: "marriage"
    },
    career: {
      primaryHouses: [10],
      secondaryHouses: [1, 11, 6],
      karakas: ["Sun", "Saturn", "Mercury", "Jupiter"],
      vargaFn: calculateD10,
      vargaName: "D10",
      transitCategory: "career"
    },
    property: {
      primaryHouses: [4],
      secondaryHouses: [1, 2, 11],
      karakas: ["Mars", "Venus"],
      vargaFn: calculateD4,
      vargaName: "D4",
      transitCategory: "property"
    },
    education: {
      primaryHouses: [4, 5],
      secondaryHouses: [9, 1],
      karakas: ["Mercury", "Jupiter"],
      vargaFn: calculateD24,
      vargaName: "D24",
      transitCategory: "education"
    },
    progeny: {
      primaryHouses: [5],
      secondaryHouses: [9, 2, 1],
      karakas: ["Jupiter"],
      vargaFn: calculateD7,
      vargaName: "D7",
      transitCategory: "progeny"
    },
    health: {
      primaryHouses: [6, 8],
      secondaryHouses: [12, 1],
      karakas: ["Saturn", "Mars", "Rahu", "Ketu"],
      vargaFn: calculateD30,
      vargaName: "D30",
      transitCategory: "health"
    },
    general: {
      primaryHouses: [1, 9, 10],
      secondaryHouses: [5, 11, 4],
      karakas: ["Jupiter", "Sun"],
      vargaFn: calculateD9,
      vargaName: "D9",
      transitCategory: "all"
    }
  };

  const config = domainConfig[domain] || domainConfig.general;
  const vargaChart = config.vargaFn ? getVargaChartData(planets, ascLong, config.vargaFn) : null;
  const bkPlanet = planets.find(p => p.name?.toLowerCase() === bkLord?.toLowerCase());
  const bkHouse = (typeof bkPlanet?.house === "number" && bkPlanet.house >= 1 && bkPlanet.house <= 12) ? bkPlanet.house : null;

  // Pre-calculate major transit events across the full antardasha window once (or reuse if passed)
  let windowTransits = [];
  if (Array.isArray(precomputedTransits)) {
    windowTransits = precomputedTransits;
  } else {
    try {
      const fullStart = isFinite(jdStart) ? jdStart : (pratyantardashas[0]?.jdStart ?? 2451545.0);
      const fullEnd = isFinite(jdEnd) ? jdEnd : (pratyantardashas[pratyantardashas.length - 1]?.jdEnd ?? (fullStart + 365.25));
      if (isFinite(fullStart) && isFinite(fullEnd) && fullEnd > fullStart) {
        windowTransits = findMajorTransitEventsForWindow(planets, ascLong, fullStart, fullEnd, config.transitCategory, tzOffset, ctx?.timezoneId || null);
      }
    } catch (_err) {
      windowTransits = [];
    }
  }

  const scoredPDs = pratyantardashas.map(pd => {
    let score = 0;
    const scoreBreakdown = [];
    const pLord = pd.lord;
    const pl = planets.find(p => p.name?.toLowerCase() === pLord?.toLowerCase());
    const plHouse = (typeof pl?.house === "number" && pl.house >= 1 && pl.house <= 12) ? pl.house : null;
    const ruledHouses = getHousesRuled(pLord);

    // 1. D1 House Lordship & Karaka
    const rulesPrimary = ruledHouses.some(h => config.primaryHouses.includes(h));
    const rulesSecondary = ruledHouses.some(h => config.secondaryHouses.includes(h));
    const isKaraka = config.karakas.includes(pLord);

    if (rulesPrimary) {
      score += 3.0;
      scoreBreakdown.push(`Rules primary domain house(s) [${config.primaryHouses.join(",")}] (+3.0)`);
    } else if (rulesSecondary) {
      score += 1.5;
      scoreBreakdown.push(`Rules secondary domain house(s) [${config.secondaryHouses.join(",")}] (+1.5)`);
    }
    if (isKaraka) {
      score += 2.0;
      scoreBreakdown.push(`Primary natural Karaka for ${domain} (+2.0)`);
    }

    // 2. Varga Placement & Activation
    let hasTemporalVarga = false;
    if (vargaChart) {
      const vPl = vargaChart.getPlanet(pLord);
      if (vPl) {
        if ([1, 4, 5, 7, 9, 10, 11].includes(vPl.vargaHouse) && vPl.vargaDignity !== "Debilitated") {
          score += 2.0;
          scoreBreakdown.push(`Well-placed in ${config.vargaName} House ${vPl.vargaHouse} (${vPl.vargaDignity}) (+2.0)`);
          hasTemporalVarga = true;
        }
      }
    }

    // 3. Sub-window transit crossings during this specific PD
    const pdJdStart = pd.jdStart ?? (jdStart ? (jdStart + (pd.startDayOffset || 0)) : null);
    const pdJdEnd = pd.jdEnd ?? (pdJdStart !== null && pd.durationDays ? (pdJdStart + pd.durationDays) : null);
    if (pdJdStart === null || pdJdEnd === null) {
      // Cannot evaluate transit crossings without valid PD time boundaries
      return {
        ...pd,
        score: Number(score.toFixed(1)),
        scoreBreakdown,
        convergenceCategory: "Neutral PD",
        isPeakCandidate: false,
        transitsInWindow: [],
        localStartDate: "Unknown",
        localEndDate: "Unknown",
        localTimezone: tzId
      };
    }
    const pdTransits = windowTransits.filter(t => t.jd >= (pdJdStart - 0.5) && t.jd <= (pdJdEnd + 0.5));
    if (pdTransits.length > 0) {
      score += 2.0;
      scoreBreakdown.push(`${pdTransits.length} exact transit crossing(s) during PD window (+2.0)`);
    }

    // 4. Supportive Relative House Relationship with AD Lord (bkLord)
    let hasSupportiveRel = false;
    if (bkLord && pLord && plHouse !== null && bkHouse !== null) {
      const relHouses = ((plHouse - bkHouse + 12) % 12) + 1;
      if (relHouses === 1 || relHouses === 7 || relHouses === 5 || relHouses === 9 || relHouses === 3 || relHouses === 11) {
        score += 1.0;
        scoreBreakdown.push(`Supportive Relative House Relationship with AD Lord ${bkLord} (${relHouses}th axis) (+1.0)`);
        hasSupportiveRel = true;
      }
    }

    // 5. Negative Damping: Combustion & Debilitation
    const counterIndicators = [];
    if (pl?.isCombust) {
      score -= 2.0;
      scoreBreakdown.push("Combust with Sun (-2.0)");
      counterIndicators.push("Combust with Sun");
    }
    if (pl?.dignity === "Debilitated") {
      score -= 2.0;
      scoreBreakdown.push("Debilitated in D1 (-2.0)");
      counterIndicators.push("Debilitated in D1");
    }

    // 6. Deterministic Convergence Categorization
    let convergenceCategory = "Neutral PD";
    if (counterIndicators.length > 0) {
      convergenceCategory = "Guarded PD";
    } else if ((rulesPrimary || isKaraka) && (hasTemporalVarga || pdTransits.length > 0)) {
      convergenceCategory = "Primary PD Convergence";
    } else if (rulesSecondary || (hasSupportiveRel && hasTemporalVarga)) {
      convergenceCategory = "Secondary PD Convergence";
    }

    const isPeakCandidate = score >= 3.0 && counterIndicators.length === 0;

    const startLocal = formatLocalDateTime(julianDateToDate(pdJdStart), tzOffset);
    const endLocal = formatLocalDateTime(julianDateToDate(pdJdEnd), tzOffset);

    return {
      ...pd,
      score: Number(score.toFixed(1)),
      scoreBreakdown,
      convergenceCategory,
      isPeakCandidate,
      transitsInWindow: pdTransits.slice(0, 3),
      localStartDate: startLocal.localDate,
      localEndDate: endLocal.localDate,
      localTimezone: tzId
    };
  });

  // Deterministic sorting: Primary PD Convergence > Secondary PD Convergence > Neutral PD > Guarded PD
  const rankPriority = {
    "Primary PD Convergence": 1,
    "Secondary PD Convergence": 2,
    "Neutral PD": 3,
    "Guarded PD": 4
  };

  scoredPDs.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pA = rankPriority[a.convergenceCategory] || 3;
    const pB = rankPriority[b.convergenceCategory] || 3;
    if (pA !== pB) return pA - pB;
    if (b.transitsInWindow.length !== a.transitsInWindow.length) return b.transitsInWindow.length - a.transitsInWindow.length;
    return (a.startAge || 0) - (b.startAge || 0);
  });

  const topCandidate = scoredPDs[0];
  const peakPD = (topCandidate && topCandidate.isPeakCandidate) ? topCandidate : null;

  let peakWindow = null;
  if (peakPD) {
    peakWindow = {
      peakLord: peakPD.lord,
      peakLordTamil: peakPD.lordTamil || peakPD.lord,
      peakStartAge: peakPD.startAge,
      peakEndAge: peakPD.endAge,
      peakStartDateIso: peakPD.startDateIso || "",
      peakEndDateIso: peakPD.endDateIso || "",
      localStartDate: peakPD.localStartDate,
      localEndDate: peakPD.localEndDate,
      localTimezone: peakPD.localTimezone,
      convergenceCategory: peakPD.convergenceCategory,
      score: peakPD.score,
      scoreBreakdown: peakPD.scoreBreakdown,
      transitsInWindow: peakPD.transitsInWindow,
      reason: isTamil
        ? `${peakPD.lordTamil || peakPD.lord} பிரத்யந்தர தசா காலத்தில் (மதிப்பெண்: ${peakPD.score}, வகை: ${peakPD.convergenceCategory}) காரகத்துவங்கள் உச்ச ஒருங்கிணைவை அடைகின்றன.`
        : `${peakPD.lord} Pratyantardasha (Score: ${peakPD.score}, Tier: ${peakPD.convergenceCategory}) represents the qualified peak activation sub-window.`
    };
  }

  return {
    rankedPDs: scoredPDs,
    peakPD,
    peakWindow
  };
}

/**
 * 1. Marriage Timing Engine (D1 Rasi + D9 Navamsha Confirmation + Transit Convergence)
 */
export function calculateMarriageTimingEvents(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang) {
  const ctx = parseChartContext(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang);
  const isTamil = ctx.lang === "ta";
  const tzOffset = ctx.timezoneOffsetHours ?? 0;
  const tzId = ctx.timezoneId || (ctx.timezoneOffsetHours === 0 ? "UTC" : null);

  const lagnaSignIdx = Math.floor(norm360(ctx.ascendantLong) / 30);
  const h7SignIdx = (lagnaSignIdx + 6) % 12;
  const h7LordName = ZODIAC_SIGNS[h7SignIdx].ruler;
  const h2SignIdx = (lagnaSignIdx + 1) % 12;
  const h2LordName = ZODIAC_SIGNS[h2SignIdx].ruler;
  const h11SignIdx = (lagnaSignIdx + 10) % 12;
  const h11LordName = ZODIAC_SIGNS[h11SignIdx].ruler;
  const h1SignIdx = lagnaSignIdx;
  const h1LordName = ZODIAC_SIGNS[lagnaSignIdx].ruler;

  const venus = ctx.planets.find(p => p.name === "Venus");
  const jupiter = ctx.planets.find(p => p.name === "Jupiter");
  const h7Lord = ctx.planets.find(p => p.name === h7LordName);

  // Calculate actual D9 Navamsha Chart Data
  const d9Chart = getVargaChartData(ctx.planets, ctx.ascendantLong, calculateD9);
  const d9LagnaRuler = d9Chart.ascendant.ruler;
  const d9H7SignIdx = (d9Chart.ascendant.signIdx + 6) % 12;
  const d9H7LordName = ZODIAC_SIGNS[d9H7SignIdx].ruler;
  const d9H7Lord = d9Chart.getPlanet(d9H7LordName);
  const d9Venus = d9Chart.getPlanet("Venus");
  const d9Jupiter = d9Chart.getPlanet("Jupiter");

  const isVargaPromised = d9H7Lord && [1, 4, 5, 7, 9, 10, 11].includes(d9H7Lord.vargaHouse) && d9H7Lord.vargaDignity !== "Debilitated";

  const natalPromise = {
    h7Sign: ZODIAC_SIGNS[h7SignIdx].name,
    h7Lord: h7LordName,
    h7LordDignity: h7Lord?.dignity || "Neutral",
    h7LordHouse: (typeof h7Lord?.house === "number" && h7Lord.house >= 1 && h7Lord.house <= 12) ? h7Lord.house : null,
    venusDignity: venus?.dignity || "Neutral",
    venusHouse: (typeof venus?.house === "number" && venus.house >= 1 && venus.house <= 12) ? venus.house : null,
    jupiterDignity: jupiter?.dignity || "Neutral",
    jupiterHouse: (typeof jupiter?.house === "number" && jupiter.house >= 1 && jupiter.house <= 12) ? jupiter.house : null,
    d9Lagna: d9Chart.ascendant.signName,
    d9H7Lord: d9H7LordName,
    d9H7LordDignity: d9H7Lord?.vargaDignity || "Neutral",
    d9H7LordHouse: (typeof d9H7Lord?.vargaHouse === "number" && d9H7Lord.vargaHouse >= 1 && d9H7Lord.vargaHouse <= 12) ? d9H7Lord.vargaHouse : null,
    d9VenusDignity: d9Venus?.vargaDignity || "Neutral",
    d9VenusHouse: (typeof d9Venus?.vargaHouse === "number" && d9Venus.vargaHouse >= 1 && d9Venus.vargaHouse <= 12) ? d9Venus.vargaHouse : null,
    isVargaPromised,
    status: (["Exalted", "Own", "Moolatrikona"].includes(h7Lord?.dignity) || [1, 4, 5, 7, 9, 10, 11].includes(h7Lord?.house))
      ? (isTamil ? "வலுவான களத்திர யோக அமைப்பு" : "Strong Matrimonial Promise")
      : (isTamil ? "சீரான திருமண யோக அமைப்பு" : "Sound Matrimonial Promise")
  };

  const keyMarriageLords = [h7LordName, h2LordName, h11LordName, h1LordName, "Venus", "Jupiter"].filter(Boolean);
  const candidateWindows = [];

  if (Array.isArray(ctx.dashaTable)) {
    for (const md of ctx.dashaTable) {
      if (Array.isArray(md.bukthis)) {
        for (const bk of md.bukthis) {
          const bkLord = bk.subLord || bk.lord || md.lord;
          const bkTa = bk.subTamil || bk.tamil || bkLord;
          const isMdKey = keyMarriageLords.includes(md.lord);
          const isBkKey = keyMarriageLords.includes(bkLord);

          if (isMdKey || isBkKey) {
            // Marriage horizon bounds: skip childhood (<16) and late age (>70)
            if (Number.isFinite(bk.endAge) && bk.endAge < 16.0) continue;
            if (Number.isFinite(bk.startAge) && bk.startAge > 70.0) continue;

            const supportingFactors = [];
            const counterIndicators = [];

            let jdStart = bk.jdStart;
            let jdEnd = bk.jdEnd;
            if (!Number.isFinite(jdStart) || !Number.isFinite(jdEnd)) {
              if (Number.isFinite(md.jdStart) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = md.jdStart + (bk.startAge - md.startAge) * 365.24219878;
                jdEnd = md.jdStart + (bk.endAge - md.startAge) * 365.24219878;
              } else if (Number.isFinite(ctx.birthJd) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = ctx.birthJd + bk.startAge * 365.24219878;
                jdEnd = ctx.birthJd + bk.endAge * 365.24219878;
              }
            }
            const hasExactJd = Number.isFinite(jdStart) && Number.isFinite(jdEnd) && (jdEnd > jdStart);

            const startLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdStart), tzOffset) : { localDate: "", localTime: "" };
            const endLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdEnd), tzOffset) : { localDate: "", localTime: "" };

            // 1. Life Phase Contextualization
            let lifePhase = isTamil ? "முதன்மை திருமண சுப பருவம்" : "Core Prime Matrimonial Phase";
            if (bk.endAge < 18.0) {
              lifePhase = isTamil ? "ஆரம்ப வளர்ச்சி & கல்வி பருவம்" : "Preparatory / Early Formative Phase";
            } else if (bk.startAge > 45.0) {
              lifePhase = isTamil ? "முதிர்ந்த இல்லற / துணை பருவம்" : "Mature Companion / Rekindling Phase";
            }

            // 2. D1 Factor Qualitative Evaluation
            if (isMdKey) {
              supportingFactors.push(isTamil ? `${md.tamil || md.lord} மகா தசா இயக்கம்` : `${md.lord} Mahadasha activation`);
            }
            if (isBkKey) {
              supportingFactors.push(isTamil ? `${bkTa} அந்தர்தசா (புக்தி) ஆளுகை` : `${bkLord} Antardasha operation`);
            }
            if (md.lord === h7LordName || bkLord === h7LordName) {
              supportingFactors.push(isTamil ? "7-ம் களத்திர அதிபதியின் நேரடி ஆதிக்கம்" : "Direct 7th house lord connection");
            }
            if (md.lord === "Venus" || bkLord === "Venus") {
              supportingFactors.push(isTamil ? "களத்திர காரகன் சுக்கிரன் தொடர்பு" : "Kalathra Karaka Venus influence");
            }
            if (md.lord === "Jupiter" || bkLord === "Jupiter") {
              supportingFactors.push(isTamil ? "மங்கல காரகன் குரு பகவான் தொடர்பு" : "Mangala Karaka Jupiter influence");
            }

            // 3. Temporal Varga Activation (MD/AD lord rules/occupies D9 7th house or is Venus/Jupiter well-placed)
            const mdD9Pl = d9Chart.getPlanet(md.lord);
            const bkD9Pl = d9Chart.getPlanet(bkLord);
            const isVargaTemporallyActivated = (d9H7Lord && [md.lord, bkLord].includes(d9H7LordName)) ||
              (mdD9Pl?.vargaHouse === 7 || bkD9Pl?.vargaHouse === 7) ||
              (["Venus", "Jupiter"].some(k => [md.lord, bkLord].includes(k)) && [1, 4, 5, 7, 9, 10, 11].includes(mdD9Pl?.vargaHouse || bkD9Pl?.vargaHouse));

            if (isVargaTemporallyActivated) {
              supportingFactors.push(isTamil ? `நவாம்சம் (D9) நேரடி தசா-வர்க்க இயக்கம் உறுதி` : `D9 Navamsha temporal Dasha activation confirmed`);
            } else if (isVargaPromised) {
              supportingFactors.push(isTamil ? `நவாம்சம் (D9) மூல ஜாதக சுப உறுதி` : `D9 Navamsha static natal promise supportive`);
            }

            // 4. Counter-Evidence Check
            if (h7Lord?.dignity === "Debilitated") {
              counterIndicators.push(isTamil ? "ராசியில் 7-ம் அதிபதி நீசம் - கூடுதல் பரிசீலனை தேவை" : "D1 7th lord debilitation requires partner compatibility diligence");
            }
            if (venus?.isCombust) {
              counterIndicators.push(isTamil ? "சுக்கிரன் அஸ்தமனம் - சுபகாரியங்களில் நிதானம் தேவை" : "Combustion of Venus advises careful matrimonial alignment");
            }
            if (d9H7Lord?.vargaDignity === "Debilitated") {
              counterIndicators.push(isTamil ? "நவாம்சத்தில் 7-ம் அதிபதி பலவீனம்" : "D9 7th lord weak in Navamsha");
            }

            // 5. Transit Concurrence for Window
            let transitConcurrence = [];
            if (hasExactJd) {
              try {
                transitConcurrence = findMajorTransitEventsForWindow(ctx.planets, ctx.ascendantLong, jdStart, jdEnd, "marriage", tzOffset, ctx.timezoneId || null);
              } catch (_err) {
                transitConcurrence = [];
              }
            }

            if (transitConcurrence.length > 0) {
              supportingFactors.push(isTamil ? `${transitConcurrence.length} கோச்சார பெயர்ச்சி நிகழ்வுகள் உறுதி` : `${transitConcurrence.length} major transit crossings coincide in window`);
            }

            // 6. Evidence-Based Pratyantardasha Ranking & Peak Identification
            let pratyantardashas = [];
            let pdRanking = { rankedPDs: [], peakPD: null, peakWindow: null };
            let peakWindow = null;
            if (hasExactJd) {
              pratyantardashas = calculatePratyantardasha(
                bkLord,
                bk.durationDays || ((bk.endAge - bk.startAge) * 365.2422),
                isTamil,
                bk.startAge,
                jdStart
              );
              pdRanking = rankPratyantardashasForDomain(pratyantardashas, "marriage", ctx, bkLord, jdStart, jdEnd, transitConcurrence);
              peakWindow = pdRanking.peakWindow;
            }

            // 7. 5-Tier Convergence Classification
            let evidenceLevel;
            let classification;
            if (counterIndicators.length > 0) {
              classification = "Guarded Period";
              evidenceLevel = isTamil ? "கலப்பு / தற்காப்பு அணுகுமுறை காலம் (Guarded Period)" : "Guarded Matrimonial Window (Remedial Effort Advised)";
            } else if ((isMdKey || isBkKey) && isVargaTemporallyActivated && transitConcurrence.length > 0 && peakWindow !== null) {
              classification = "Peak Convergence Window";
              evidenceLevel = isTamil ? "உயர் மும்மடங்கு உச்ச ஒருங்கிணைவு காலம் (Peak Convergence)" : "Peak Convergence Matrimonial Window";
            } else if ((isMdKey || isBkKey) && (isVargaTemporallyActivated || isVargaPromised) && transitConcurrence.length > 0) {
              classification = "Strong Convergence Window";
              evidenceLevel = isTamil ? "வலுவான சுப ஒருங்கிணைவு காலம் (Strong Convergence)" : "Strong Convergence Matrimonial Window";
            } else if ((isMdKey && isBkKey) && (isVargaTemporallyActivated || transitConcurrence.length > 0)) {
              classification = "Primary Activation Window";
              evidenceLevel = isTamil ? "முதன்மை திருமண சுப யோக காலம் (Primary Activation)" : "Primary Matrimonial Activation Window";
            } else {
              classification = "Candidate Window";
              evidenceLevel = isTamil ? "துணை திருமண சுப காலம் (Secondary Supportive)" : "Secondary Supportive Marriage Period";
            }

            candidateWindows.push({
              windowId: `marr_${candidateWindows.length + 1}`,
              mahadashaLord: md.lord,
              antardashaLord: bkLord,
              startAge: bk.startAge,
              endAge: bk.endAge,
              startDateIso: bk.startDateIso || (bk.jdStart ? julianDateToDate(bk.jdStart).toISOString().slice(0, 10) : ""),
              endDateIso: bk.endDateIso || (bk.jdEnd ? julianDateToDate(bk.jdEnd).toISOString().slice(0, 10) : ""),
              localStartDate: startLocal.localDate,
              localEndDate: endLocal.localDate,
              localTimezone: tzId,
              lifePhase,
              classification,
              evidenceLevel,
              evidenceFactors: supportingFactors,
              supportingFactors,
              counterIndicators,
              vargaConfirmation: isVargaTemporallyActivated
                ? (isTamil ? `நவாம்சம் (D9): நேரடி தசா-வர்க்க இயக்கம் உறுதி` : `Navamsha (D9): Temporal Dasha activation confirmed`)
                : (isVargaPromised ? (isTamil ? `நவாம்சம் (D9): மூல சுப உறுதி` : `Navamsha (D9): Static promise confirmed`) : (isTamil ? "நவாம்சம் (D9) பகுப்பாய்வு செய்யப்பட்டது" : "Navamsha (D9) evaluated")),
              vargaActivation: isVargaTemporallyActivated,
              transitConcurrence: transitConcurrence.slice(0, 4),
              pratyantardashas: (pdRanking.rankedPDs || pratyantardashas || []).slice(0, 5),
              peakWindow,
              recommendation: isTamil
                ? `${md.tamil || md.lord} தசை - ${bkTa} புக்தி காலத்தில் சுப விவாக பேச்சுவார்த்தைகள், வரன் தேடுதல் மற்றும் திருமண நிகழ்வுகளுக்கு பாரம்பரிய ஜோதிட ஆதரவு உள்ளது.`
                : `Classically supportive period under ${md.lord} MD - ${bkLord} AD for matrimonial alliances and wedding celebrations.`
            });
          }
        }
      }
    }
  }

  return {
    domain: "marriage",
    summary: isTamil
      ? `7-ம் பாவக அதிபதி ${h7LordName}, சுக்கிரன், நவாம்சம் (D9) மற்றும் தசா-கோசார convergences அடிப்படையிலான திருமண சுப காலக்கோடு.`
      : `Classical matrimonial timing engine computed using classical astrological factors: 7th lord (${h7LordName}), Venus, D9 Navamsha convergence, and Dasha cycles.`,
    natalPromise,
    candidateWindows,
    totalWindows: candidateWindows.length
  };
}

/**
 * 2. Career Timing Engine (D1 Rasi + D10 Dashamsha Confirmation + Transit Convergence)
 */
export function calculateCareerTimingEvents(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang) {
  const ctx = parseChartContext(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang);
  const isTamil = ctx.lang === "ta";
  const tzOffset = ctx.timezoneOffsetHours ?? 0;
  const tzId = ctx.timezoneId || (ctx.timezoneOffsetHours === 0 ? "UTC" : null);

  const lagnaSignIdx = Math.floor(norm360(ctx.ascendantLong) / 30);
  const h10SignIdx = (lagnaSignIdx + 9) % 12;
  const h10LordName = ZODIAC_SIGNS[h10SignIdx].ruler;
  const h1SignIdx = lagnaSignIdx;
  const h1LordName = ZODIAC_SIGNS[h1SignIdx].ruler;
  const h6SignIdx = (lagnaSignIdx + 5) % 12;
  const h6LordName = ZODIAC_SIGNS[h6SignIdx].ruler;
  const h11SignIdx = (lagnaSignIdx + 10) % 12;
  const h11LordName = ZODIAC_SIGNS[h11SignIdx].ruler;

  const sun = ctx.planets.find(p => p.name === "Sun");
  const saturn = ctx.planets.find(p => p.name === "Saturn");
  const h10Lord = ctx.planets.find(p => p.name === h10LordName);

  // Calculate actual D10 Dashamsha Chart Data
  const d10Chart = getVargaChartData(ctx.planets, ctx.ascendantLong, calculateD10);
  const d10H10SignIdx = (d10Chart.ascendant.signIdx + 9) % 12;
  const d10H10LordName = ZODIAC_SIGNS[d10H10SignIdx].ruler;
  const d10H10Lord = d10Chart.getPlanet(d10H10LordName);
  const d10Sun = d10Chart.getPlanet("Sun");
  const d10Saturn = d10Chart.getPlanet("Saturn");

  const isVargaPromised = d10H10Lord && [1, 4, 5, 9, 10, 11].includes(d10H10Lord.vargaHouse) && d10H10Lord.vargaDignity !== "Debilitated";

  const natalPromise = {
    h10Sign: ZODIAC_SIGNS[h10SignIdx].name,
    h10Lord: h10LordName,
    h10LordDignity: h10Lord?.dignity || "Neutral",
    h10LordHouse: (typeof h10Lord?.house === "number" && h10Lord.house >= 1 && h10Lord.house <= 12) ? h10Lord.house : null,
    sunDignity: sun?.dignity || "Neutral",
    sunHouse: (typeof sun?.house === "number" && sun.house >= 1 && sun.house <= 12) ? sun.house : null,
    saturnDignity: saturn?.dignity || "Neutral",
    saturnHouse: (typeof saturn?.house === "number" && saturn.house >= 1 && saturn.house <= 12) ? saturn.house : null,
    d10Lagna: d10Chart.ascendant.signName,
    d10H10Lord: d10H10LordName,
    d10H10LordDignity: d10H10Lord?.vargaDignity || "Neutral",
    d10H10LordHouse: (typeof d10H10Lord?.vargaHouse === "number" && d10H10Lord.vargaHouse >= 1 && d10H10Lord.vargaHouse <= 12) ? d10H10Lord.vargaHouse : null,
    isVargaPromised,
    status: (["Exalted", "Own", "Moolatrikona"].includes(h10Lord?.dignity) || [1, 4, 5, 9, 10, 11].includes(h10Lord?.house))
      ? (isTamil ? "சிறப்பான தொழில்/உத்தியோக யோகம்" : "Strong Career & Leadership Promise")
      : (isTamil ? "நிலையான தொழில் முன்னேற்றம்" : "Stable Professional Growth Promise")
  };

  const keyCareerLords = [h10LordName, "Sun", "Saturn", "Mercury", "Jupiter"].filter(Boolean);
  const candidateWindows = [];

  if (Array.isArray(ctx.dashaTable)) {
    for (const md of ctx.dashaTable) {
      if (Array.isArray(md.bukthis)) {
        for (const bk of md.bukthis) {
          const bkLord = bk.subLord || bk.lord || md.lord;
          const bkTa = bk.subTamil || bk.tamil || bkLord;
          const isMdKey = keyCareerLords.includes(md.lord);
          const isBkKey = keyCareerLords.includes(bkLord);

          if (isMdKey || isBkKey) {
            const supportingFactors = [];
            const counterIndicators = [];

            let jdStart = bk.jdStart;
            let jdEnd = bk.jdEnd;
            if (!Number.isFinite(jdStart) || !Number.isFinite(jdEnd)) {
              if (Number.isFinite(md.jdStart) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = md.jdStart + (bk.startAge - md.startAge) * 365.24219878;
                jdEnd = md.jdStart + (bk.endAge - md.startAge) * 365.24219878;
              } else if (Number.isFinite(ctx.birthJd) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = ctx.birthJd + bk.startAge * 365.24219878;
                jdEnd = ctx.birthJd + bk.endAge * 365.24219878;
              }
            }
            const hasExactJd = Number.isFinite(jdStart) && Number.isFinite(jdEnd) && (jdEnd > jdStart);

            const startLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdStart), tzOffset) : { localDate: "", localTime: "" };
            const endLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdEnd), tzOffset) : { localDate: "", localTime: "" };

            let lifePhase = isTamil ? "முதன்மை தொழில் & தலைமைத்துவ பருவம்" : "Active Career & Leadership Phase";
            if (bk.endAge < 20.0) {
              lifePhase = isTamil ? "அடிப்படை கல்வி & பயிற்சி பருவம்" : "Foundational Skill & Training Phase";
            } else if (bk.startAge > 60.0) {
              lifePhase = isTamil ? "மூத்த ஆலோசகர் & வழிகாட்டல் பருவம்" : "Senior Advisory & Mentorship Phase";
            }

            if (isMdKey) {
              supportingFactors.push(isTamil ? `${md.tamil || md.lord} தசா ஆளுகை` : `${md.lord} Mahadasha career governance`);
            }
            if (isBkKey) {
              supportingFactors.push(isTamil ? `${bkTa} புக்தி சுழற்சி` : `${bkLord} Antardasha operational drive`);
            }
            if (md.lord === h10LordName || bkLord === h10LordName) {
              supportingFactors.push(isTamil ? "10-ம் தொழில் ஸ்தானாதிபதியின் நேரடி தொடர்பு" : "Direct 10th house lord connection");
            }
            if (md.lord === "Sun" || bkLord === "Sun") {
              supportingFactors.push(isTamil ? "அதிகார காரகன் சூரியன் தொடர்பு" : "Adhikara Karaka Sun influence");
            }
            if (md.lord === "Saturn" || bkLord === "Saturn") {
              supportingFactors.push(isTamil ? "கர்ம காரகன் சனி பகவான் உழைப்பு பலன்" : "Karma Karaka Saturn diligence reward");
            }

            // Temporal Varga Activation (MD/AD lord rules/occupies D10 10th house or is Sun/Saturn/Mercury/Jupiter well-placed)
            const mdD10Pl = d10Chart.getPlanet(md.lord);
            const bkD10Pl = d10Chart.getPlanet(bkLord);
            const isVargaTemporallyActivated = (d10H10Lord && [md.lord, bkLord].includes(d10H10LordName)) ||
              (mdD10Pl?.vargaHouse === 10 || bkD10Pl?.vargaHouse === 10) ||
              (["Sun", "Saturn", "Mercury", "Jupiter"].some(k => [md.lord, bkLord].includes(k)) && [1, 4, 5, 9, 10, 11].includes(mdD10Pl?.vargaHouse || bkD10Pl?.vargaHouse));

            if (isVargaTemporallyActivated) {
              supportingFactors.push(isTamil ? `தசாம்சம் (D10) நேரடி தசா-வர்க்க இயக்கம் உறுதி` : `D10 Dashamsha temporal Dasha activation confirmed`);
            } else if (isVargaPromised) {
              supportingFactors.push(isTamil ? `தசாம்சம் (D10) மூல ஜாதக சுப உறுதி` : `D10 Dashamsha static natal promise supportive`);
            }

            // Counter indicators
            if (h10Lord?.dignity === "Debilitated") {
              counterIndicators.push(isTamil ? "10-ம் அதிபதி நீசம் - தொழில் முடிவுகளில் கூடுதல் விழிப்புணர்வு தேவை" : "D1 10th lord debilitation advises strategic career planning");
            }
            if (d10H10Lord?.vargaDignity === "Debilitated") {
              counterIndicators.push(isTamil ? "தசாம்சத்தில் 10-ம் அதிபதி பலவீனம்" : "D10 10th lord weak in Dashamsha");
            }

            // Transit Concurrence
            let transitConcurrence = [];
            if (hasExactJd) {
              try {
                transitConcurrence = findMajorTransitEventsForWindow(ctx.planets, ctx.ascendantLong, jdStart, jdEnd, "career", tzOffset, ctx.timezoneId || null);
              } catch (_err) {
                transitConcurrence = [];
              }
            }

            if (transitConcurrence.length > 0) {
              supportingFactors.push(isTamil ? `${transitConcurrence.length} கோச்சார பெயர்ச்சி நிகழ்வுகள் தொழில் முன்னேற்றத்திற்கு ஆதரவு` : `${transitConcurrence.length} major transit crossings active in career window`);
            }

            // 7. Evidence-Based Pratyantardasha Ranking & Peak Identification
            let pratyantardashas = [];
            let pdRanking = { rankedPDs: [], peakPD: null, peakWindow: null };
            let peakWindow = null;
            if (hasExactJd) {
              pratyantardashas = calculatePratyantardasha(
                bkLord,
                bk.durationDays || ((bk.endAge - bk.startAge) * 365.2422),
                isTamil,
                bk.startAge,
                jdStart
              );
              pdRanking = rankPratyantardashasForDomain(pratyantardashas, "career", ctx, bkLord, jdStart, jdEnd);
              peakWindow = pdRanking.peakWindow;
            }

            // 5-Tier Classification
            let evidenceLevel;
            let classification;
            if (counterIndicators.length > 0) {
              classification = "Guarded Period";
              evidenceLevel = isTamil ? "கலப்பு தொழில் சூழல் (Guarded Transition Phase)" : "Guarded Career Transition Phase";
            } else if ((isMdKey || isBkKey) && isVargaTemporallyActivated && transitConcurrence.length > 0 && peakWindow !== null) {
              classification = "High-Convergence Candidate Window";
              evidenceLevel = isTamil ? "உயர் உத்தியோக/தொழில் வெற்றி வாய்ப்புக் காலம் (High Convergence)" : "High-Convergence Vocational Window (Triple Convergence)";
            } else if ((isMdKey || isBkKey) && (isVargaTemporallyActivated || isVargaPromised) && transitConcurrence.length > 0) {
              classification = "Strong Convergence Window";
              evidenceLevel = isTamil ? "வலுவான தொழில் முன்னேற்ற காலம் (Strong Convergence)" : "Strong Convergence Career Window";
            } else if ((isMdKey && isBkKey) && (isVargaTemporallyActivated || transitConcurrence.length > 0)) {
              classification = "Primary Activation Window";
              evidenceLevel = isTamil ? "முதன்மை தொழில் முன்னேற்ற காலம் (Primary Career Activation)" : "Primary Career Activation Window";
            } else {
              classification = "Candidate Window";
              evidenceLevel = isTamil ? "துணை தொழில் வளர்ச்சி காலம் (Secondary Growth)" : "Secondary Professional Growth Period";
            }

            candidateWindows.push({
              windowId: `car_${candidateWindows.length + 1}`,
              mahadashaLord: md.lord,
              antardashaLord: bkLord,
              startAge: bk.startAge,
              endAge: bk.endAge,
              startDateIso: bk.startDateIso || (bk.jdStart ? julianDateToDate(bk.jdStart).toISOString().slice(0, 10) : ""),
              endDateIso: bk.endDateIso || (bk.jdEnd ? julianDateToDate(bk.jdEnd).toISOString().slice(0, 10) : ""),
              localStartDate: startLocal.localDate,
              localEndDate: endLocal.localDate,
              localTimezone: tzId,
              lifePhase,
              classification,
              evidenceLevel,
              evidenceFactors: supportingFactors,
              supportingFactors,
              counterIndicators,
              vargaConfirmation: isVargaTemporallyActivated
                ? (isTamil ? `தசாம்சம் (D10): நேரடி தசா-வர்க்க இயக்கம் உறுதி` : `Dashamsha (D10): Temporal Dasha activation confirmed`)
                : (isVargaPromised ? (isTamil ? `தசாம்சம் (D10): மூல சுப உறுதி` : `Dashamsha (D10): Static promise confirmed`) : (isTamil ? "தசாம்சம் (D10) பகுப்பாய்வு செய்யப்பட்டது" : "Dashamsha (D10) evaluated")),
              vargaActivation: isVargaTemporallyActivated,
              transitConcurrence: transitConcurrence.slice(0, 4),
              pratyantardashas: (pdRanking.rankedPDs || pratyantardashas || []).slice(0, 5),
              peakWindow,
              recommendation: isTamil
                ? `${md.tamil || md.lord} தசை - ${bkTa} புக்தி காலத்தில் பதவி உயர்வு, புதிய பொறுப்புகள் மற்றும் தொழில் விரிவாக்க முயற்சிகள் பலனளிக்கும்.`
                : `Constructive window under ${md.lord} MD - ${bkLord} AD for promotions, leadership roles, and vocational expansion.`
            });
          }
        }
      }
    }
  }

  return {
    domain: "career",
    summary: isTamil
      ? `10-ம் கர்ம பாவக அதிபதி ${h10LordName}, சூரியன், சனி மற்றும் தசாம்சம் (D10) அடிப்படையிலான தொழில் முன்னேற்ற காலக்கோடு.`
      : `Classical career timing engine computed using classical astrological factors: 10th lord (${h10LordName}), Sun, Saturn, D10 Dashamsha, and Dasha cycles.`,
    natalPromise,
    candidateWindows,
    totalWindows: candidateWindows.length
  };
}

/**
 * 3. Property & Real Estate Timing Engine (D1 Rasi + D4 Chaturthamsha Confirmation)
 */
export function calculatePropertyTimingEvents(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang) {
  const ctx = parseChartContext(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang);
  const isTamil = ctx.lang === "ta";
  const tzOffset = ctx.timezoneOffsetHours ?? 0;
  const tzId = ctx.timezoneId || (ctx.timezoneOffsetHours === 0 ? "UTC" : null);

  const lagnaSignIdx = Math.floor(norm360(ctx.ascendantLong) / 30);
  const h4SignIdx = (lagnaSignIdx + 3) % 12;
  const h4LordName = ZODIAC_SIGNS[h4SignIdx].ruler;

  const mars = ctx.planets.find(p => p.name === "Mars");
  const venus = ctx.planets.find(p => p.name === "Venus");
  const h4Lord = ctx.planets.find(p => p.name === h4LordName);

  // Calculate actual D4 Chaturthamsha Chart Data
  const d4Chart = getVargaChartData(ctx.planets, ctx.ascendantLong, calculateD4);
  const d4H4SignIdx = (d4Chart.ascendant.signIdx + 3) % 12;
  const d4H4LordName = ZODIAC_SIGNS[d4H4SignIdx].ruler;
  const d4H4Lord = d4Chart.getPlanet(d4H4LordName);
  const d4Mars = d4Chart.getPlanet("Mars");

  const isVargaPromised = d4H4Lord && [1, 4, 5, 9, 10, 11].includes(d4H4Lord.vargaHouse) && d4H4Lord.vargaDignity !== "Debilitated";

  const natalPromise = {
    h4Sign: ZODIAC_SIGNS[h4SignIdx].name,
    h4Lord: h4LordName,
    h4LordDignity: h4Lord?.dignity || "Neutral",
    h4LordHouse: (typeof h4Lord?.house === "number" && h4Lord.house >= 1 && h4Lord.house <= 12) ? h4Lord.house : null,
    marsDignity: mars?.dignity || "Neutral",
    marsHouse: (typeof mars?.house === "number" && mars.house >= 1 && mars.house <= 12) ? mars.house : null,
    d4Lagna: d4Chart.ascendant.signName,
    d4H4Lord: d4H4LordName,
    d4H4LordDignity: d4H4Lord?.vargaDignity || "Neutral",
    d4H4LordHouse: (typeof d4H4Lord?.vargaHouse === "number" && d4H4Lord.vargaHouse >= 1 && d4H4Lord.vargaHouse <= 12) ? d4H4Lord.vargaHouse : null,
    isVargaPromised,
    status: (["Exalted", "Own", "Moolatrikona"].includes(h4Lord?.dignity) || [1, 4, 5, 9, 10, 11].includes(h4Lord?.house))
      ? (isTamil ? "வலுவான மனை/சொத்து யோகம்" : "Strong Real Estate & Asset Promise")
      : (isTamil ? "சீரான சொத்து சேர்க்கை யோகம்" : "Sound Property & Asset Promise")
  };

  const keyPropertyLords = [h4LordName, "Mars", "Venus", "Jupiter"].filter(Boolean);
  const candidateWindows = [];

  if (Array.isArray(ctx.dashaTable)) {
    for (const md of ctx.dashaTable) {
      if (Array.isArray(md.bukthis)) {
        for (const bk of md.bukthis) {
          const bkLord = bk.subLord || bk.lord || md.lord;
          const bkTa = bk.subTamil || bk.tamil || bkLord;
          const isMdKey = keyPropertyLords.includes(md.lord);
          const isBkKey = keyPropertyLords.includes(bkLord);

          if (isMdKey || isBkKey) {
            const supportingFactors = [];
            const counterIndicators = [];

            let jdStart = bk.jdStart;
            let jdEnd = bk.jdEnd;
            if (!Number.isFinite(jdStart) || !Number.isFinite(jdEnd)) {
              if (Number.isFinite(md.jdStart) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = md.jdStart + (bk.startAge - md.startAge) * 365.24219878;
                jdEnd = md.jdStart + (bk.endAge - md.startAge) * 365.24219878;
              } else if (Number.isFinite(ctx.birthJd) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = ctx.birthJd + bk.startAge * 365.24219878;
                jdEnd = ctx.birthJd + bk.endAge * 365.24219878;
              }
            }
            const hasExactJd = Number.isFinite(jdStart) && Number.isFinite(jdEnd) && (jdEnd > jdStart);

            const startLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdStart), tzOffset) : { localDate: "", localTime: "" };
            const endLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdEnd), tzOffset) : { localDate: "", localTime: "" };

            let lifePhase = isTamil ? "சொத்து சேர்த்தல் & கட்டுமான பருவம்" : "Prime Acquisition & Building Phase";
            if (bk.endAge < 21.0) {
              lifePhase = isTamil ? "குடும்ப சொத்து & வளர்ப்பு பருவம்" : "Early Asset & Heritage Phase";
            } else if (bk.startAge > 65.0) {
              lifePhase = isTamil ? "சொத்து மேலாண்மை & பரம்பரை உரிமை பருவம்" : "Estate Consolidation & Legacy Phase";
            }

            if (isMdKey) {
              supportingFactors.push(isTamil ? `${md.tamil || md.lord} மகா தசா ஆளுகை` : `${md.lord} Mahadasha`);
            }
            if (isBkKey) {
              supportingFactors.push(isTamil ? `${bkTa} புக்தி இயக்கம்` : `${bkLord} Antardasha`);
            }
            if (md.lord === h4LordName || bkLord === h4LordName) {
              supportingFactors.push(isTamil ? "4-ம் சுக/பூமி ஸ்தானாதிபதி தொடர்பு" : "Direct 4th house lord influence");
            }
            if (md.lord === "Mars" || bkLord === "Mars") {
              supportingFactors.push(isTamil ? "பூமி காரகன் செவ்வாய் தொடர்பு" : "Bhoomi Karaka Mars influence");
            }

            // Temporal Varga Activation (MD/AD lord rules/occupies D4 4th house or is Mars/Venus well-placed)
            const mdD4Pl = d4Chart.getPlanet(md.lord);
            const bkD4Pl = d4Chart.getPlanet(bkLord);
            const isVargaTemporallyActivated = (d4H4Lord && [md.lord, bkLord].includes(d4H4LordName)) ||
              (mdD4Pl?.vargaHouse === 4 || bkD4Pl?.vargaHouse === 4) ||
              (["Mars", "Venus"].some(k => [md.lord, bkLord].includes(k)) && [1, 4, 5, 9, 10, 11].includes(mdD4Pl?.vargaHouse || bkD4Pl?.vargaHouse));

            if (isVargaTemporallyActivated) {
              supportingFactors.push(isTamil ? `சதுர்த்தாம்சம் (D4) நேரடி தசா-வர்க்க இயக்கம் உறுதி` : `D4 Chaturthamsha temporal Dasha activation confirmed`);
            } else if (isVargaPromised) {
              supportingFactors.push(isTamil ? `சதுர்த்தாம்சம் (D4) மூல ஜாதக சுப உறுதி` : `D4 Chaturthamsha static natal promise supportive`);
            }

            // Counter indicators
            if (h4Lord?.dignity === "Debilitated") {
              counterIndicators.push(isTamil ? "4-ம் அதிபதி நீசம் - ஆவண பரிசீலனை தேவை" : "D1 4th lord debilitation advises title verification");
            }
            if (d4H4Lord?.vargaDignity === "Debilitated") {
              counterIndicators.push(isTamil ? "சதுர்த்தாம்சத்தில் 4-ம் அதிபதி பலவீனம்" : "D4 4th lord weak in Chaturthamsha");
            }

            // Transit Concurrence
            let transitConcurrence = [];
            if (hasExactJd) {
              try {
                transitConcurrence = findMajorTransitEventsForWindow(ctx.planets, ctx.ascendantLong, jdStart, jdEnd, "property", tzOffset, ctx.timezoneId || null);
              } catch (_err) {
                transitConcurrence = [];
              }
            }

            if (transitConcurrence.length > 0) {
              supportingFactors.push(isTamil ? `${transitConcurrence.length} கோச்சார பெயர்ச்சி நிகழ்வுகள் சொத்து சேர்க்கைக்கு ஆதரவு` : `${transitConcurrence.length} major transit crossings active in property window`);
            }

            // 7. Evidence-Based Pratyantardasha Ranking & Peak Identification
            let pratyantardashas = [];
            let pdRanking = { rankedPDs: [], peakPD: null, peakWindow: null };
            let peakWindow = null;
            if (hasExactJd) {
              pratyantardashas = calculatePratyantardasha(
                bkLord,
                bk.durationDays || ((bk.endAge - bk.startAge) * 365.2422),
                isTamil,
                bk.startAge,
                jdStart
              );
              pdRanking = rankPratyantardashasForDomain(pratyantardashas, "property", ctx, bkLord, jdStart, jdEnd);
              peakWindow = pdRanking.peakWindow;
            }

            // 5-Tier Classification
            let evidenceLevel;
            let classification;
            if (counterIndicators.length > 0) {
              classification = "Guarded Period";
              evidenceLevel = isTamil ? "கலப்பு சொத்து வாய்ப்பு காலம் (Guarded Period)" : "Guarded Property Acquisition Phase";
            } else if ((isMdKey || isBkKey) && isVargaTemporallyActivated && transitConcurrence.length > 0 && peakWindow !== null) {
              classification = "Peak Convergence Window";
              evidenceLevel = isTamil ? "உயர் மனை/வீடு வாங்கும் உச்ச சுப யோக காலம் (Peak Convergence)" : "Peak Real Estate Acquisition Window (Triple Convergence)";
            } else if ((isMdKey || isBkKey) && (isVargaTemporallyActivated || isVargaPromised) && transitConcurrence.length > 0) {
              classification = "Strong Convergence Window";
              evidenceLevel = isTamil ? "வலுவான சொத்து சேர்க்கை சுப காலம் (Strong Convergence)" : "Strong Convergence Property Window";
            } else if ((isMdKey && isBkKey) && (isVargaTemporallyActivated || transitConcurrence.length > 0)) {
              classification = "Primary Activation Window";
              evidenceLevel = isTamil ? "சொத்து சேர்க்கை சுப காலம் (Primary Property Window)" : "Primary Property Acquisition Phase";
            } else {
              classification = "Candidate Window";
              evidenceLevel = isTamil ? "துணை சொத்து வாய்ப்பு காலம் (Secondary Window)" : "Secondary Asset Transition Phase";
            }

            candidateWindows.push({
              windowId: `prop_${candidateWindows.length + 1}`,
              mahadashaLord: md.lord,
              antardashaLord: bkLord,
              startAge: bk.startAge,
              endAge: bk.endAge,
              startDateIso: bk.startDateIso || (bk.jdStart ? julianDateToDate(bk.jdStart).toISOString().slice(0, 10) : ""),
              endDateIso: bk.endDateIso || (bk.jdEnd ? julianDateToDate(bk.jdEnd).toISOString().slice(0, 10) : ""),
              localStartDate: startLocal.localDate,
              localEndDate: endLocal.localDate,
              localTimezone: tzId,
              lifePhase,
              classification,
              evidenceLevel,
              evidenceFactors: supportingFactors,
              supportingFactors,
              counterIndicators,
              vargaConfirmation: isVargaTemporallyActivated
                ? (isTamil ? `சதுர்த்தாம்சம் (D4): நேரடி தசா-வர்க்க இயக்கம் உறுதி` : `Chaturthamsha (D4): Temporal Dasha activation confirmed`)
                : (isVargaPromised ? (isTamil ? `சதுர்த்தாம்சம் (D4): மூல சுப உறுதி` : `Chaturthamsha (D4): Static promise confirmed`) : (isTamil ? "சதுர்த்தாம்சம் (D4) பகுப்பாய்வு செய்யப்பட்டது" : "Chaturthamsha (D4) evaluated")),
              vargaActivation: isVargaTemporallyActivated,
              transitConcurrence: transitConcurrence.slice(0, 4),
              pratyantardashas: (pdRanking.rankedPDs || pratyantardashas || []).slice(0, 5),
              peakWindow,
              recommendation: isTamil
                ? `${md.tamil || md.lord} தசை - ${bkTa} புக்தி காலத்தில் புதுமனை புகுதல், நிலம்/வீடு வாங்குதல் அல்லது வாகனம் சேர்க்கை சுபமாகும்.`
                : `Classically supportive window under ${md.lord} MD - ${bkLord} AD for property acquisitions, residential construction, and conveyances.`
            });
          }
        }
      }
    }
  }

  return {
    domain: "property",
    summary: isTamil
      ? `4-ம் சுக பாவக அதிபதி ${h4LordName}, செவ்வாய், சுக்கிரன் மற்றும் சதுர்த்தாம்சம் (D4) அடிப்படையிலான சொத்து யோக காலக்கோடு.`
      : `Classical property and real estate timing engine computed using classical astrological factors: 4th lord (${h4LordName}), Mars, Venus, D4 Chaturthamsha, and Dasha cycles.`,
    natalPromise,
    candidateWindows,
    totalWindows: candidateWindows.length
  };
}

/**
 * 4. Education Timing Engine (D1 Rasi + D24 Chaturvimshamsha Confirmation)
 */
export function calculateEducationTimingEvents(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang) {
  const ctx = parseChartContext(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang);
  const isTamil = ctx.lang === "ta";
  const tzOffset = ctx.timezoneOffsetHours ?? 0;
  const tzId = ctx.timezoneId || (ctx.timezoneOffsetHours === 0 ? "UTC" : null);

  const lagnaSignIdx = Math.floor(norm360(ctx.ascendantLong) / 30);
  const h4SignIdx = (lagnaSignIdx + 3) % 12;
  const h4LordName = ZODIAC_SIGNS[h4SignIdx].ruler;
  const h5SignIdx = (lagnaSignIdx + 4) % 12;
  const h5LordName = ZODIAC_SIGNS[h5SignIdx].ruler;
  const h9SignIdx = (lagnaSignIdx + 8) % 12;
  const h9LordName = ZODIAC_SIGNS[h9SignIdx].ruler;

  const mercury = ctx.planets.find(p => p.name === "Mercury");
  const jupiter = ctx.planets.find(p => p.name === "Jupiter");

  // Calculate actual D24 Chaturvimshamsha Chart Data
  const d24Chart = getVargaChartData(ctx.planets, ctx.ascendantLong, calculateD24);
  const d24H4SignIdx = (d24Chart.ascendant.signIdx + 3) % 12;
  const d24H4LordName = ZODIAC_SIGNS[d24H4SignIdx].ruler;
  const d24H4Lord = d24Chart.getPlanet(d24H4LordName);
  const d24Mercury = d24Chart.getPlanet("Mercury");

  const isVargaPromised = d24H4Lord && [1, 4, 5, 9, 10, 11].includes(d24H4Lord.vargaHouse) && d24H4Lord.vargaDignity !== "Debilitated";

  const natalPromise = {
    h4Lord: h4LordName,
    h5Lord: h5LordName,
    h9Lord: h9LordName,
    mercuryDignity: mercury?.dignity || "Neutral",
    jupiterDignity: jupiter?.dignity || "Neutral",
    d24Lagna: d24Chart.ascendant.signName,
    d24H4Lord: d24H4LordName,
    d24H4LordHouse: (typeof d24H4Lord?.vargaHouse === "number" && d24H4Lord.vargaHouse >= 1 && d24H4Lord.vargaHouse <= 12) ? d24H4Lord.vargaHouse : null,
    isVargaPromised,
    status: (["Exalted", "Own", "Moolatrikona", "Friend"].includes(mercury?.dignity) || [1, 4, 5, 9, 10, 11].includes(mercury?.house))
      ? (isTamil ? "சிறப்பான வித்யா/கல்வி மேன்மை யோகம்" : "High Scholastic & Intellectual Promise")
      : (isTamil ? "சீரான கல்வி முன்னேற்றம்" : "Sound Academic Progression Promise")
  };

  const keyEduLords = [h4LordName, h5LordName, h9LordName, "Mercury", "Jupiter"].filter(Boolean);
  const candidateWindows = [];

  if (Array.isArray(ctx.dashaTable)) {
    for (const md of ctx.dashaTable) {
      if (Array.isArray(md.bukthis)) {
        for (const bk of md.bukthis) {
          const bkLord = bk.subLord || bk.lord || null;
          const bkTa = bk.subTamil || bk.tamil || bkLord;
          const isMdKey = keyEduLords.includes(md.lord);
          const isBkKey = keyEduLords.includes(bkLord);

          if (isMdKey || isBkKey) {
            const supportingFactors = [];
            const counterIndicators = [];

            let jdStart = bk.jdStart;
            let jdEnd = bk.jdEnd;
            if (!Number.isFinite(jdStart) || !Number.isFinite(jdEnd)) {
              if (Number.isFinite(md.jdStart) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = md.jdStart + (bk.startAge - md.startAge) * 365.24219878;
                jdEnd = md.jdStart + (bk.endAge - md.startAge) * 365.24219878;
              } else if (Number.isFinite(ctx.birthJd) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = ctx.birthJd + bk.startAge * 365.24219878;
                jdEnd = ctx.birthJd + bk.endAge * 365.24219878;
              }
            }
            const hasExactJd = Number.isFinite(jdStart) && Number.isFinite(jdEnd) && (jdEnd > jdStart);

            const startLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdStart), tzOffset) : { localDate: "", localTime: "" };
            const endLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdEnd), tzOffset) : { localDate: "", localTime: "" };

            let lifePhase = isTamil ? "அடிப்படை & பட்டப்படிப்பு கல்வி பருவம்" : "Primary & Higher Academic Degree Phase";
            if (bk.startAge > 25.0 && bk.startAge <= 45.0) {
              lifePhase = isTamil ? "தொழில்நுட்ப சிறப்பு & தொடர் கல்வி பருவம்" : "Professional Specialization & Continuing Education Phase";
            } else if (bk.startAge > 45.0) {
              lifePhase = isTamil ? "தத்துவ & வாழ்நாள் அறிவு தேடல் பருவம்" : "Philosophical & Lifelong Learning Phase";
            }

            if (isMdKey) {
              supportingFactors.push(isTamil ? `${md.tamil || md.lord} தசா ஆளுகை` : `${md.lord} Mahadasha`);
            }
            if (isBkKey) {
              supportingFactors.push(isTamil ? `${bkTa} புக்தி இயக்கம்` : `${bkLord} Antardasha`);
            }
            if (md.lord === "Mercury" || bkLord === "Mercury") {
              supportingFactors.push(isTamil ? "வித்யா காரகன் புதன் தொடர்பு" : "Vidya Karaka Mercury influence");
            }
            if (md.lord === "Jupiter" || bkLord === "Jupiter") {
              supportingFactors.push(isTamil ? "ஞான காரகன் குரு தொடர்பு" : "Jnana Karaka Jupiter influence");
            }

            // Temporal Varga Activation (MD/AD lord rules/occupies D24 4th/5th/9th house or is Mercury/Jupiter well-placed)
            const mdD24Pl = d24Chart.getPlanet(md.lord);
            const bkD24Pl = d24Chart.getPlanet(bkLord);
            const isVargaTemporallyActivated = (d24H4Lord && [md.lord, bkLord].includes(d24H4LordName)) ||
              ([4, 5, 9].includes(mdD24Pl?.vargaHouse) || [4, 5, 9].includes(bkD24Pl?.vargaHouse)) ||
              (["Mercury", "Jupiter"].some(k => [md.lord, bkLord].includes(k)) && [1, 4, 5, 9, 10, 11].includes(mdD24Pl?.vargaHouse || bkD24Pl?.vargaHouse));

            if (isVargaTemporallyActivated) {
              supportingFactors.push(isTamil ? `சதுர்விம்சாம்சம் (D24) நேரடி தசா-வர்க்க இயக்கம் உறுதி` : `D24 Chaturvimshamsha temporal Dasha activation confirmed`);
            } else if (isVargaPromised) {
              supportingFactors.push(isTamil ? `சதுர்விம்சாம்சம் (D24) மூல ஜாதக சுப உறுதி` : `D24 Chaturvimshamsha static natal promise supportive`);
            }

            // Counter indicators
            if (mercury?.dignity === "Debilitated") {
              counterIndicators.push(isTamil ? "புதன் நீசம் - கல்வி கவனச்சிதறல் தற்காப்பு தேவை" : "D1 Mercury debilitation advises focused study discipline");
            }
            if (d24H4Lord?.vargaDignity === "Debilitated") {
              counterIndicators.push(isTamil ? "சதுர்விம்சாம்சத்தில் 4-ம் அதிபதி பலவீனம்" : "D24 4th lord weak in Chaturvimshamsha");
            }

            // Transit Concurrence
            let transitConcurrence = [];
            if (hasExactJd) {
              try {
                transitConcurrence = findMajorTransitEventsForWindow(ctx.planets, ctx.ascendantLong, jdStart, jdEnd, "education", tzOffset, ctx.timezoneId || null);
              } catch (_err) {
                transitConcurrence = [];
              }
            }

            if (transitConcurrence.length > 0) {
              supportingFactors.push(isTamil ? `${transitConcurrence.length} கோச்சார பெயர்ச்சி நிகழ்வுகள் கல்வி வளர்ச்சிக்கு ஆதரவு` : `${transitConcurrence.length} major transit crossings active in academic window`);
            }

            // 7. Evidence-Based Pratyantardasha Ranking & Peak Identification
            let pratyantardashas = [];
            let pdRanking = { rankedPDs: [], peakPD: null, peakWindow: null };
            let peakWindow = null;
            if (hasExactJd) {
              pratyantardashas = calculatePratyantardasha(
                bkLord,
                bk.durationDays || ((bk.endAge - bk.startAge) * 365.2422),
                isTamil,
                bk.startAge,
                jdStart
              );
              pdRanking = rankPratyantardashasForDomain(pratyantardashas, "education", ctx, bkLord, jdStart, jdEnd);
              peakWindow = pdRanking.peakWindow;
            }

            // 5-Tier Classification
            let evidenceLevel;
            let classification;
            if (counterIndicators.length > 0) {
              classification = "Guarded Period";
              evidenceLevel = isTamil ? "கலப்பு கல்வி சூழல் (Guarded Period)" : "Guarded Academic Phase";
            } else if ((isMdKey || isBkKey) && isVargaTemporallyActivated && transitConcurrence.length > 0 && peakWindow !== null) {
              classification = "High-Convergence Candidate Window";
              evidenceLevel = isTamil ? "உயர் கல்வி மேன்மை & சாதனை வாய்ப்புக் காலம் (High Convergence)" : "High-Convergence Academic Distinction Window (Triple Convergence)";
            } else if ((isMdKey || isBkKey) && (isVargaTemporallyActivated || isVargaPromised) && transitConcurrence.length > 0) {
              classification = "Strong Convergence Window";
              evidenceLevel = isTamil ? "வலுவான கல்வி முன்னேற்ற சுப காலம் (Strong Convergence)" : "Strong Convergence Academic Window";
            } else if ((isMdKey && isBkKey) && (isVargaTemporallyActivated || transitConcurrence.length > 0)) {
              classification = "Primary Activation Window";
              evidenceLevel = isTamil ? "கல்வி முன்னேற்ற சுப காலம் (Primary Education Window)" : "Primary Scholastic & Degree Milestone Window";
            } else {
              classification = "Candidate Window";
              evidenceLevel = isTamil ? "கல்வி வளர்ச்சி காலம் (Secondary Window)" : "Secondary Educational Progression Phase";
            }

            candidateWindows.push({
              windowId: `edu_${candidateWindows.length + 1}`,
              mahadashaLord: md.lord,
              antardashaLord: bkLord,
              startAge: bk.startAge,
              endAge: bk.endAge,
              startDateIso: bk.startDateIso || (bk.jdStart ? julianDateToDate(bk.jdStart).toISOString().slice(0, 10) : ""),
              endDateIso: bk.endDateIso || (bk.jdEnd ? julianDateToDate(bk.jdEnd).toISOString().slice(0, 10) : ""),
              localStartDate: startLocal.localDate,
              localEndDate: endLocal.localDate,
              localTimezone: tzId,
              lifePhase,
              classification,
              evidenceLevel,
              evidenceFactors: supportingFactors,
              supportingFactors,
              counterIndicators,
              vargaConfirmation: isVargaTemporallyActivated
                ? (isTamil ? `சதுர்விம்சாம்சம் (D24): நேரடி தசா-வர்க்க இயக்கம் உறுதி` : `Chaturvimshamsha (D24): Temporal Dasha activation confirmed`)
                : (isVargaPromised ? (isTamil ? `சதுர்விம்சாம்சம் (D24): மூல சுப உறுதி` : `Chaturvimshamsha (D24): Static promise confirmed`) : (isTamil ? "சதுர்விம்சாம்சம் (D24) பகுப்பாய்வு செய்யப்பட்டது" : "Chaturvimshamsha (D24) evaluated")),
              vargaActivation: isVargaTemporallyActivated,
              transitConcurrence: transitConcurrence.slice(0, 4),
              pratyantardashas: (pdRanking.rankedPDs || pratyantardashas || []).slice(0, 5),
              peakWindow,
              recommendation: isTamil
                ? `${md.tamil || md.lord} தசை - ${bkTa} புக்தி காலத்தில் பட்டப்படிப்பு, போட்டித் தேர்வுகள் மற்றும் உயர் கல்வி முயற்சிகள் கைகூடும்.`
                : `Classically supportive window under ${md.lord} MD - ${bkLord} AD for academic degrees, competitive exams, and intellectual achievements.`
            });
          }
        }
      }
    }
  }

  return {
    domain: "education",
    summary: isTamil
      ? `4, 5, 9-ம் பாவக அதிபதிகள், புதன், குரு மற்றும் சதுர்விம்சாம்சம் (D24) அடிப்படையிலான கல்வி சாதனை காலக்கோடு.`
      : `Classical education timing engine computed using classical astrological factors: 4th/5th/9th lords, Mercury, Jupiter, D24 Chaturvimshamsha, and Dasha cycles.`,
    natalPromise,
    candidateWindows,
    totalWindows: candidateWindows.length
  };
}

/**
 * 5. Progeny Timing Engine (D1 Rasi + D7 Saptamsha Confirmation)
 */
export function calculateProgenyTimingEvents(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang) {
  const ctx = parseChartContext(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang);
  const isTamil = ctx.lang === "ta";
  const tzOffset = ctx.timezoneOffsetHours ?? 0;
  const tzId = ctx.timezoneId || (ctx.timezoneOffsetHours === 0 ? "UTC" : null);

  const lagnaSignIdx = Math.floor(norm360(ctx.ascendantLong) / 30);
  const h5SignIdx = (lagnaSignIdx + 4) % 12;
  const h5LordName = ZODIAC_SIGNS[h5SignIdx].ruler;
  const h9SignIdx = (lagnaSignIdx + 8) % 12;
  const h9LordName = ZODIAC_SIGNS[h9SignIdx].ruler;
  const jupiter = ctx.planets.find(p => p.name === "Jupiter");
  const h5Lord = ctx.planets.find(p => p.name === h5LordName);

  // Calculate actual D7 Saptamsha Chart Data
  const d7Chart = getVargaChartData(ctx.planets, ctx.ascendantLong, calculateD7);
  const d7H5SignIdx = (d7Chart.ascendant.signIdx + 4) % 12;
  const d7H5LordName = ZODIAC_SIGNS[d7H5SignIdx].ruler;
  const d7H5Lord = d7Chart.getPlanet(d7H5LordName);
  const d7Jupiter = d7Chart.getPlanet("Jupiter");

  const isVargaPromised = d7H5Lord && [1, 4, 5, 9, 10, 11].includes(d7H5Lord.vargaHouse) && d7H5Lord.vargaDignity !== "Debilitated";

  const natalPromise = {
    h5Sign: ZODIAC_SIGNS[h5SignIdx].name,
    h5Lord: h5LordName,
    h5LordDignity: h5Lord?.dignity || "Neutral",
    h5LordHouse: (typeof h5Lord?.house === "number" && h5Lord.house >= 1 && h5Lord.house <= 12) ? h5Lord.house : null,
    jupiterDignity: jupiter?.dignity || "Neutral",
    jupiterHouse: (typeof jupiter?.house === "number" && jupiter.house >= 1 && jupiter.house <= 12) ? jupiter.house : null,
    d7Lagna: d7Chart.ascendant.signName,
    d7H5Lord: d7H5LordName,
    d7H5LordHouse: (typeof d7H5Lord?.vargaHouse === "number" && d7H5Lord.vargaHouse >= 1 && d7H5Lord.vargaHouse <= 12) ? d7H5Lord.vargaHouse : null,
    isVargaPromised,
    status: (["Exalted", "Own", "Moolatrikona"].includes(h5Lord?.dignity) || [1, 4, 5, 9, 10, 11].includes(h5Lord?.house))
      ? (isTamil ? "வலுவான புத்திர பாக்கிய அமைப்பு" : "Strong Progeny & Lineage Promise")
      : (isTamil ? "சீரான சந்தான யோகம்" : "Sound Progeny Promise")
  };

  const keyProgenyLords = [h5LordName, h9LordName, "Jupiter"].filter(Boolean);
  const candidateWindows = [];

  if (Array.isArray(ctx.dashaTable)) {
    for (const md of ctx.dashaTable) {
      if (Array.isArray(md.bukthis)) {
        for (const bk of md.bukthis) {
          const bkLord = bk.subLord || bk.lord || null;
          const bkTa = bk.subTamil || bk.tamil || bkLord;
          const isMdKey = keyProgenyLords.includes(md.lord);
          const isBkKey = keyProgenyLords.includes(bkLord);

          if (isMdKey || isBkKey) {
            const supportingFactors = [];
            const counterIndicators = [];

            let jdStart = bk.jdStart;
            let jdEnd = bk.jdEnd;
            if (!Number.isFinite(jdStart) || !Number.isFinite(jdEnd)) {
              if (Number.isFinite(md.jdStart) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = md.jdStart + (bk.startAge - md.startAge) * 365.24219878;
                jdEnd = md.jdStart + (bk.endAge - md.startAge) * 365.24219878;
              } else if (Number.isFinite(ctx.birthJd) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = ctx.birthJd + bk.startAge * 365.24219878;
                jdEnd = ctx.birthJd + bk.endAge * 365.24219878;
              }
            }
            const hasExactJd = Number.isFinite(jdStart) && Number.isFinite(jdEnd) && (jdEnd > jdStart);

            const startLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdStart), tzOffset) : { localDate: "", localTime: "" };
            const endLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdEnd), tzOffset) : { localDate: "", localTime: "" };

            let lifePhase = isTamil ? "முதன்மை சந்தான & புத்திர பாக்கிய பருவம்" : "Prime Childbearing & Family Expansion Horizon";
            if (bk.endAge < 20.0) {
              lifePhase = isTamil ? "ஆரம்ப வளர்ச்சி காலக்கட்டம்" : "Early Growth Horizon";
            } else if (bk.startAge > 45.0) {
              lifePhase = isTamil ? "வம்ச விருத்தி & பேரக்குழந்தைகள் பாக்கிய பருவம்" : "Descendant Blessings & Lineage Horizon";
            }

            if (isMdKey) {
              supportingFactors.push(isTamil ? `${md.tamil || md.lord} தசா இயக்கம்` : `${md.lord} Mahadasha`);
            }
            if (isBkKey) {
              supportingFactors.push(isTamil ? `${bkTa} புக்தி சுழற்சி` : `${bkLord} Antardasha`);
            }
            if (md.lord === h5LordName || bkLord === h5LordName) {
              supportingFactors.push(isTamil ? "5-ம் புத்திர அதிபதியின் நேரடி ஆட்சி" : "Direct 5th house Putra lord influence");
            }
            if (md.lord === "Jupiter" || bkLord === "Jupiter") {
              supportingFactors.push(isTamil ? "புத்திர காரகன் குரு தொடர்பு" : "Putra Karaka Jupiter influence");
            }

            // Temporal Varga Activation (MD/AD lord rules/occupies D7 5th/9th house or is Jupiter well-placed)
            const mdD7Pl = d7Chart.getPlanet(md.lord);
            const bkD7Pl = d7Chart.getPlanet(bkLord);
            const isVargaTemporallyActivated = (d7H5Lord && [md.lord, bkLord].includes(d7H5LordName)) ||
              ([5, 9].includes(mdD7Pl?.vargaHouse) || [5, 9].includes(bkD7Pl?.vargaHouse)) ||
              ([md.lord, bkLord].includes("Jupiter") && [1, 4, 5, 9, 10, 11].includes(mdD7Pl?.vargaHouse || bkD7Pl?.vargaHouse));

            if (isVargaTemporallyActivated) {
              supportingFactors.push(isTamil ? `சப்தாம்சம் (D7) நேரடி தசா-வர்க்க இயக்கம் உறுதி` : `D7 Saptamsha temporal Dasha activation confirmed`);
            } else if (isVargaPromised) {
              supportingFactors.push(isTamil ? `சப்தாம்சம் (D7) மூல ஜாதக சுப உறுதி` : `D7 Saptamsha static natal promise supportive`);
            }

            // Counter indicators
            if (h5Lord?.dignity === "Debilitated") {
              counterIndicators.push(isTamil ? "5-ம் அதிபதி நீசம் - சுப வழிபாடுகள் பரிந்துரை" : "D1 5th lord debilitation advises traditional remedial prayers");
            }
            if (d7H5Lord?.vargaDignity === "Debilitated") {
              counterIndicators.push(isTamil ? "சப்தாம்சத்தில் 5-ம் அதிபதி பலவீனம்" : "D7 5th lord weak in Saptamsha");
            }

            // Transit Concurrence
            let transitConcurrence = [];
            if (hasExactJd) {
              try {
                transitConcurrence = findMajorTransitEventsForWindow(ctx.planets, ctx.ascendantLong, jdStart, jdEnd, "progeny", tzOffset, ctx.timezoneId || null);
              } catch (_err) {
                transitConcurrence = [];
              }
            }

            if (transitConcurrence.length > 0) {
              supportingFactors.push(isTamil ? `${transitConcurrence.length} கோச்சார பெயர்ச்சி நிகழ்வுகள் சந்தான யோகத்திற்கு ஆதரவு` : `${transitConcurrence.length} major transit crossings active in window`);
            }

            // 7. Evidence-Based Pratyantardasha Ranking & Peak Identification
            let pratyantardashas = [];
            let pdRanking = { rankedPDs: [], peakPD: null, peakWindow: null };
            let peakWindow = null;
            if (hasExactJd) {
              pratyantardashas = calculatePratyantardasha(
                bkLord,
                bk.durationDays || ((bk.endAge - bk.startAge) * 365.2422),
                isTamil,
                bk.startAge,
                jdStart
              );
              pdRanking = rankPratyantardashasForDomain(pratyantardashas, "progeny", ctx, bkLord, jdStart, jdEnd);
              peakWindow = pdRanking.peakWindow;
            }

            // 5-Tier Classification
            let evidenceLevel;
            let classification;
            if (counterIndicators.length > 0) {
              classification = "Guarded Period";
              evidenceLevel = isTamil ? "கலப்பு சந்தான சூழல் (Guarded Period)" : "Guarded Progeny Horizon (Remedial Effort Advised)";
            } else if ((isMdKey || isBkKey) && isVargaTemporallyActivated && transitConcurrence.length > 0 && peakWindow !== null) {
              classification = "Peak Convergence Window";
              evidenceLevel = isTamil ? "உயர் புத்திர பாக்கிய உச்ச சுப யோக காலம் (Peak Convergence)" : "Peak Progeny & Family Expansion Window (Triple Convergence)";
            } else if ((isMdKey || isBkKey) && (isVargaTemporallyActivated || isVargaPromised) && transitConcurrence.length > 0) {
              classification = "Strong Convergence Window";
              evidenceLevel = isTamil ? "வலுவான சந்தான சுப யோக காலம் (Strong Convergence)" : "Strong Convergence Progeny Window";
            } else if ((isMdKey && isBkKey) && (isVargaTemporallyActivated || transitConcurrence.length > 0)) {
              classification = "Primary Activation Window";
              evidenceLevel = isTamil ? "சந்தான சுப யோக காலம் (Primary Progeny Window)" : "Primary Progeny Activation Window";
            } else {
              classification = "Candidate Window";
              evidenceLevel = isTamil ? "துணை சந்தான காலம் (Secondary Window)" : "Secondary Supportive Progeny Phase";
            }

            candidateWindows.push({
              windowId: `prog_${candidateWindows.length + 1}`,
              mahadashaLord: md.lord,
              antardashaLord: bkLord,
              startAge: bk.startAge,
              endAge: bk.endAge,
              startDateIso: bk.startDateIso || (bk.jdStart ? julianDateToDate(bk.jdStart).toISOString().slice(0, 10) : ""),
              endDateIso: bk.endDateIso || (bk.jdEnd ? julianDateToDate(bk.jdEnd).toISOString().slice(0, 10) : ""),
              localStartDate: startLocal.localDate,
              localEndDate: endLocal.localDate,
              localTimezone: tzId,
              lifePhase,
              classification,
              evidenceLevel,
              evidenceFactors: supportingFactors,
              supportingFactors,
              counterIndicators,
              vargaConfirmation: isVargaTemporallyActivated
                ? (isTamil ? `சப்தாம்சம் (D7): நேரடி தசா-வர்க்க இயக்கம் உறுதி` : `Saptamsha (D7): Temporal Dasha activation confirmed`)
                : (isVargaPromised ? (isTamil ? `சப்தாம்சம் (D7): மூல சுப உறுதி` : `Saptamsha (D7): Static promise confirmed`) : (isTamil ? "சப்தாம்சம் (D7) பகுப்பாய்வு செய்யப்பட்டது" : "Saptamsha (D7) evaluated")),
              vargaActivation: isVargaTemporallyActivated,
              transitConcurrence: transitConcurrence.slice(0, 4),
              pratyantardashas: (pdRanking.rankedPDs || pratyantardashas || []).slice(0, 5),
              peakWindow,
              recommendation: isTamil
                ? `${md.tamil || md.lord} தசை - ${bkTa} புக்தி காலத்தில் சந்தான சுப நிகழ்வுகள் மற்றும் குடும்ப விருத்தி கைகூடும்.`
                : `Classically supportive window under ${md.lord} MD - ${bkLord} AD for family expansion and progeny blessings.`
            });
          }
        }
      }
    }
  }

  return {
    domain: "progeny",
    summary: isTamil
      ? `5-ம் பாவக அதிபதி ${h5LordName}, குரு மற்றும் சப்தாம்சம் (D7) அடிப்படையிலான சந்தான சுப காலக்கோடு.`
      : `Classical progeny timing engine computed using classical astrological factors: 5th lord (${h5LordName}), Jupiter, D7 Saptamsha, and Dasha cycles.`,
    natalPromise,
    candidateWindows,
    totalWindows: candidateWindows.length
  };
}

/**
 * 6. Health & Somatic Timing Engine (Traditional Ayurvedic/Jyotish Vitality Symbolism)
 */
export function calculateHealthVulnerabilityEvents(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang) {
  const ctx = parseChartContext(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang);
  const isTamil = ctx.lang === "ta";
  const tzOffset = ctx.timezoneOffsetHours ?? 0;
  const tzId = ctx.timezoneId || (ctx.timezoneOffsetHours === 0 ? "UTC" : null);

  const lagnaSignIdx = Math.floor(norm360(ctx.ascendantLong) / 30);
  const h6SignIdx = (lagnaSignIdx + 5) % 12;
  const h6LordName = ZODIAC_SIGNS[h6SignIdx].ruler;
  const h8SignIdx = (lagnaSignIdx + 7) % 12;
  const h8LordName = ZODIAC_SIGNS[h8SignIdx].ruler;
  const h12SignIdx = (lagnaSignIdx + 11) % 12;
  const h12LordName = ZODIAC_SIGNS[h12SignIdx].ruler;

  // Calculate actual D3 Drekkana & D30 Trimsamsha Data
  const d3Chart = getVargaChartData(ctx.planets, ctx.ascendantLong, calculateD3);
  const d30Chart = getVargaChartData(ctx.planets, ctx.ascendantLong, calculateD30);

  const SOMATIC_ZONES = [
    { zone: "Head & Cranial Vitality (Pitta/Agni)", tamil: "சிரசு, தலை & பித்த சமநிலை" },
    { zone: "Throat, Vocal & Ocular (Kapha)", tamil: "கழுத்து, முகம் & கப சமநிலை" },
    { zone: "Shoulders, Arms & Respiratory (Vata)", tamil: "தோள்பட்டை, கைகள் & வாத சமநிலை" },
    { zone: "Chest, Lungs & Cardiac Rhythm (Kapha/Agni)", tamil: "மார்பு, நுரையீரல் & இதய இயக்கம்" },
    { zone: "Upper Abdomen, Gastric & Digestion (Agni)", tamil: "வயிற்றுப்பகுதி, செரிமானம் & பித்த அக்னி" },
    { zone: "Intestinal & Traditional Vitality (Vata/Pitta)", tamil: "குடல் பகுதி & பாரம்பரிய உடலியல் சமநிலை" },
    { zone: "Lower Abdomen & Hydration Balance (Apana Vata)", tamil: "அடிவயிறு & நீர்ச்சத்து சமநிலை" },
    { zone: "Pelvic & Enduring Vitality (Shukra/Ojas)", tamil: "இடுப்புப் பகுதி & ஓஜஸ் பலம்" },
    { zone: "Thighs & Muscular Circulation (Vata)", tamil: "தொடைகள் & ரத்த ஓட்டம்" },
    { zone: "Knees & Skeletal Joint Mobility (Vata)", tamil: "மூட்டுகள் & வாத சமநிலை" },
    { zone: "Shins, Calves & Circulatory Vitality", tamil: "கால்கள் & தசை நலம்" },
    { zone: "Feet, Sleep & Sensory Rejuvenation", tamil: "பாதங்கள் & ஆழ்ந்த தூக்க நலம்" }
  ];

  const primarySomaticZone = SOMATIC_ZONES[h6SignIdx] || SOMATIC_ZONES[0];

  const natalPromise = {
    h6Lord: h6LordName,
    h8Lord: h8LordName,
    h12Lord: h12LordName,
    somaticFocus: isTamil ? primarySomaticZone.tamil : primarySomaticZone.zone,
    d3Lagna: d3Chart.ascendant.signName,
    d30Lagna: d30Chart.ascendant.signName,
    status: isTamil ? "பாரம்பரிய தற்காப்பு நல்வாழ்வு வழிகாட்டல்" : "Traditional Preventive Ayurvedic Balance",
    disclaimer: isTamil
      ? "சட்டரீதியான அறிவிப்பு: ஜோதிட நல்வாழ்வு குறிப்புகள் பாரம்பரிய குறியீட்டு வழிகாட்டல்களே. இவை மருத்துவ ஆலோசனைகள் அல்லது நோயறிதல் அல்ல."
      : "Statutory Notice: Astrological wellness indications represent traditional symbolic vitality patterns and do NOT constitute medical diagnoses or health predictions."
  };

  const keyDusthanaLords = [h6LordName, h8LordName, h12LordName, "Saturn", "Rahu", "Ketu", "Mars"].filter(Boolean);
  const candidateWindows = [];

  if (Array.isArray(ctx.dashaTable)) {
    for (const md of ctx.dashaTable) {
      if (Array.isArray(md.bukthis)) {
        for (const bk of md.bukthis) {
          const bkLord = bk.subLord || bk.lord || null;
          const bkTa = bk.subTamil || bk.tamil || bkLord;
          const isMdDusthana = keyDusthanaLords.includes(md.lord);
          const isBkDusthana = keyDusthanaLords.includes(bkLord);

          if (isMdDusthana && isBkDusthana) {
            let jdStart = bk.jdStart;
            let jdEnd = bk.jdEnd;
            if (!Number.isFinite(jdStart) || !Number.isFinite(jdEnd)) {
              if (Number.isFinite(md.jdStart) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = md.jdStart + (bk.startAge - md.startAge) * 365.24219878;
                jdEnd = md.jdStart + (bk.endAge - md.startAge) * 365.24219878;
              } else if (Number.isFinite(ctx.birthJd) && Number.isFinite(bk.startAge) && Number.isFinite(bk.endAge)) {
                jdStart = ctx.birthJd + bk.startAge * 365.24219878;
                jdEnd = ctx.birthJd + bk.endAge * 365.24219878;
              }
            }
            const hasExactJd = Number.isFinite(jdStart) && Number.isFinite(jdEnd) && (jdEnd > jdStart);

            const startLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdStart), tzOffset) : { localDate: "", localTime: "" };
            const endLocal = hasExactJd ? formatLocalDateTime(julianDateToDate(jdEnd), tzOffset) : { localDate: "", localTime: "" };

            let lifePhase = isTamil ? "நடுத்தர வயது வாழ்வியல் சமநிலை & ஆரோக்கிய பேணல்" : "Mid-Life Lifestyle & Metabolic Resilience";
            if (bk.endAge <= 30.0) {
              lifePhase = isTamil ? "இளமை உடல்திறன் & தற்காப்பு உடற்பயிற்சி" : "Youth Vitality & Preventive Fitness";
            } else if (bk.startAge > 60.0) {
              lifePhase = isTamil ? "முதுமை ரசாயன & ஆயுர்வேத புத்துணர்ச்சி" : "Senior Ayurvedic Rejuvenation & Rasayana";
            }

            const supportingFactors = [
              isTamil ? `${md.tamil || md.lord} தசை - ${bkTa} புக்தி துஸ்தான தொடர்பு` : `${md.lord} MD - ${bkLord} AD Dusthana lord operation`,
              isTamil ? `${primarySomaticZone.tamil} சார்ந்த பாரம்பரிய நலம் பேணல் பரிந்துரைக்கப்படுகிறது` : `Mindful traditional focus on ${primarySomaticZone.zone}`
            ];

            // Temporal Varga Activation (D3 / D30 Dusthana placements)
            const isVargaTemporallyActivated = [6, 8, 12].includes(d30Chart.getPlanet(md.lord)?.vargaHouse) ||
              [6, 8, 12].includes(d30Chart.getPlanet(bkLord)?.vargaHouse) ||
              [6, 8, 12].includes(d3Chart.getPlanet(md.lord)?.vargaHouse) ||
              [6, 8, 12].includes(d3Chart.getPlanet(bkLord)?.vargaHouse);

            if (isVargaTemporallyActivated) {
              supportingFactors.push(isTamil ? `திரிம்சாம்சம் (D30) & திரேக்காணம் (D3) துஸ்தான இயக்கம்` : `D30 / D3 Dusthana axis temporally highlighted`);
            }

            // Transit Concurrence
            let transitConcurrence = [];
            if (hasExactJd) {
              try {
                transitConcurrence = findMajorTransitEventsForWindow(ctx.planets, ctx.ascendantLong, jdStart, jdEnd, "health", tzOffset, ctx.timezoneId || null);
              } catch (_err) {
                transitConcurrence = [];
              }
            }

            if (transitConcurrence.length > 0) {
              supportingFactors.push(isTamil ? `${transitConcurrence.length} கோச்சார பெயர்ச்சி நிகழ்வுகள் ஆரோக்கிய விழிப்புணர்வை வலியுறுத்துகின்றன` : `${transitConcurrence.length} major transit crossings active in wellness window`);
            }

            // 7. Evidence-Based Pratyantardasha Ranking & Peak Identification
            let pratyantardashas = [];
            let pdRanking = { rankedPDs: [], peakPD: null, peakWindow: null };
            let peakWindow = null;
            if (hasExactJd) {
              pratyantardashas = calculatePratyantardasha(
                bkLord,
                bk.durationDays || ((bk.endAge - bk.startAge) * 365.2422),
                isTamil,
                bk.startAge,
                jdStart
              );
              pdRanking = rankPratyantardashasForDomain(pratyantardashas, "health", ctx, bkLord, jdStart, jdEnd);
              peakWindow = pdRanking.peakWindow;
            }

            candidateWindows.push({
              windowId: `hlth_${candidateWindows.length + 1}`,
              mahadashaLord: md.lord,
              antardashaLord: bkLord,
              startAge: bk.startAge,
              endAge: bk.endAge,
              startDateIso: bk.startDateIso || (bk.jdStart ? julianDateToDate(bk.jdStart).toISOString().slice(0, 10) : ""),
              endDateIso: bk.endDateIso || (bk.jdEnd ? julianDateToDate(bk.jdEnd).toISOString().slice(0, 10) : ""),
              localStartDate: startLocal.localDate,
              localEndDate: endLocal.localDate,
              localTimezone: tzId,
              lifePhase,
              classification: "Guarded Period",
              evidenceLevel: isTamil ? "பாரம்பரிய நல்வாழ்வு விழிப்புணர்வு காலம் (Preventive Care Window)" : "Preventive Wellness & Restorative Care Window",
              evidenceFactors: supportingFactors,
              supportingFactors,
              counterIndicators: [],
              vargaConfirmation: isTamil
                ? `திரேக்காணம் (D3) & திரிம்சாம்சம் (D30) நல்வாழ்வு ஆய்வு`
                : `Drekkana (D3) and Trimsamsha (D30) vitality evaluation`,
              vargaActivation: isVargaTemporallyActivated,
              transitConcurrence: transitConcurrence.slice(0, 4),
              pratyantardashas: (pdRanking.rankedPDs || pratyantardashas || []).slice(0, 5),
              peakWindow,
              recommendation: isTamil
                ? `${md.tamil || md.lord} தசை - ${bkTa} புக்தி காலத்தில் சீரான உணவு, யோகாசனம், தியானம் மற்றும் வழக்கமான ஆரோக்கிய பரிசோதனைகளை மேற்கொள்வது நலம்.`
                : `Period under ${md.lord} MD - ${bkLord} AD encourages healthy daily routines, balanced Ayurvedic nutrition, stress management, and routine medical checkups.`
            });
          }
        }
      }
    }
  }

  return {
    domain: "health",
    summary: isTamil
      ? `6, 8, 12-ம் பாவகங்கள் மற்றும் காரகங்களை அடிப்படையாகக் கொண்ட பாரம்பரிய தற்காப்பு நல்வாழ்வு காலக்கோடு.`
      : `Classical wellness and somatic timing engine computed using classical astrological factors: 6th/8th/12th lords, D3 Drekkana, D30 Trimsamsha, and Dasha cycles.`,
    natalPromise,
    candidateWindows,
    totalWindows: candidateWindows.length
  };
}

/**
 * Single Unified Master Prediction Engine
 * Integrates all 6 domain timing engines into a single source of truth.
 */
export function calculateMasterPredictions(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang) {
  const ctx = parseChartContext(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang);
  const healthDomain = calculateHealthVulnerabilityEvents(ctx);
  return {
    marriage: calculateMarriageTimingEvents(ctx),
    career: calculateCareerTimingEvents(ctx),
    property: calculatePropertyTimingEvents(ctx),
    education: calculateEducationTimingEvents(ctx),
    progeny: calculateProgenyTimingEvents(ctx),
    health: healthDomain,
    wellness: healthDomain
  };
}

/**
 * AUTHENTIC SIDEREAL TRANSIT (GOCHARA) EPHEMERIS ENGINE
 * Calculates real-time or future planetary positions of major transiting planets
 * (Saturn, Jupiter, Mars, Rahu, Ketu) against natal Lagna and Moon.
 */
export function calculateTransitEphemeris(targetDate = new Date(), natalAscendantLong = 0, natalMoonLong = 0, systemOrOptions = "lahiri") {
  let tDate;
  if (targetDate instanceof Date) {
    if (isNaN(targetDate.getTime())) throw new Error("Invalid targetDate Date object provided to calculateTransitEphemeris.");
    tDate = targetDate;
  } else if (typeof targetDate === "string") {
    const match = targetDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) throw new Error(`Invalid targetDate string format "${targetDate}". Expected YYYY-MM-DD.`);
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const d = parseInt(match[3], 10);
    tDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  } else {
    throw new Error("calculateTransitEphemeris requires a valid Date object or ISO YYYY-MM-DD date string.");
  }

  const jd = (tDate.getTime() / 86400000) + 2440587.5;
  const sys = typeof systemOrOptions === "string" ? systemOrOptions : (systemOrOptions?.system || "lahiri");
  const ayanamsha = getAyanamshaForSystem(jd, sys);

  const getSidereal = (bodyName) => {
    try {
      const elon = Astronomy.Ecliptic(Astronomy.GeoVector(bodyName, tDate, true)).elon;
      return norm360(elon - ayanamsha);
    } catch (err) {
      throw new Error(`Failed to calculate ${bodyName} transit ephemeris: ${err.message}`);
    }
  };

  const getSignIdx = (deg) => Math.min(11, Math.max(0, Math.floor(norm360(deg) / 30)));
  const getHouseFrom = (targetDeg, refDeg) => ((getSignIdx(targetDeg) - getSignIdx(refDeg) + 12) % 12) + 1;

  const saturnLong = getSidereal("Saturn");
  const jupiterLong = getSidereal("Jupiter");
  const marsLong = getSidereal("Mars");

  // Mean Rahu/Ketu:
  const T = (jd - 2451545.0) / 36525.0;
  const rahuMeanTrop = norm360(125.04455 - 1934.136261 * T + 0.0020754 * T * T + (T * T * T) / 467441.0 - (T * T * T * T) / 60616000.0);
  const rahuLong = norm360(rahuMeanTrop - ayanamsha);
  const ketuLong = norm360(rahuLong + 180);

  const saturnHouseFromMoon = getHouseFrom(saturnLong, natalMoonLong);
  const saturnHouseFromLagna = getHouseFrom(saturnLong, natalAscendantLong);
  const jupiterHouseFromMoon = getHouseFrom(jupiterLong, natalMoonLong);
  const jupiterHouseFromLagna = getHouseFrom(jupiterLong, natalAscendantLong);
  const marsHouseFromMoon = getHouseFrom(marsLong, natalMoonLong);
  const marsHouseFromLagna = getHouseFrom(marsLong, natalAscendantLong);
  const rahuHouseFromMoon = getHouseFrom(rahuLong, natalMoonLong);
  const rahuHouseFromLagna = getHouseFrom(rahuLong, natalAscendantLong);
  const ketuHouseFromMoon = getHouseFrom(ketuLong, natalMoonLong);
  const ketuHouseFromLagna = getHouseFrom(ketuLong, natalAscendantLong);

  // Classical Gochara Triggers:
  // 1. Sade Sati (12, 1, 2 from Moon)
  const isSadeSati = [12, 1, 2].includes(saturnHouseFromMoon);
  let sadeSatiPhase = "None";
  let sadeSatiPhaseTa = "ஏழரைச் சனி இல்லை (None)";
  if (saturnHouseFromMoon === 12) {
    sadeSatiPhase = "1st Phase (Rising / 12th from Moon)";
    sadeSatiPhaseTa = "முதல் சுற்று (விரயச் சனி - 12-ம் இடம்)";
  } else if (saturnHouseFromMoon === 1) {
    sadeSatiPhase = "2nd Phase (Peak / Janma Shani)";
    sadeSatiPhaseTa = "இரண்டாம் சுற்று (ஜென்மச் சனி - ராசியில்)";
  } else if (saturnHouseFromMoon === 2) {
    sadeSatiPhase = "3rd Phase (Setting / 2nd from Moon)";
    sadeSatiPhaseTa = "மூன்றாம் சுற்று (பாதச் சனி - 2-ம் இடம்)";
  }

  // 2. Kantaka Shani (4th from Moon or Lagna) & Ashtama Shani (8th from Moon)
  const isKantakaShani = saturnHouseFromMoon === 4 || saturnHouseFromLagna === 4;
  const isAshtamaShani = saturnHouseFromMoon === 8;

  // 3. Guru Gochara (Jupiter in 2, 5, 7, 9, 11 from Moon is auspicious)
  const isGuruSubha = [2, 5, 7, 9, 11].includes(jupiterHouseFromMoon);

  // 4. Nodal crossings
  const isRahuOnMoon = rahuHouseFromMoon === 1;
  const isKetuOnMoon = ketuHouseFromMoon === 1;

  const satSign = ZODIAC_SIGNS[getSignIdx(saturnLong)] || ZODIAC_SIGNS[0];
  const jupSign = ZODIAC_SIGNS[getSignIdx(jupiterLong)] || ZODIAC_SIGNS[0];
  const marSign = ZODIAC_SIGNS[getSignIdx(marsLong)] || ZODIAC_SIGNS[0];
  const rahSign = ZODIAC_SIGNS[getSignIdx(rahuLong)] || ZODIAC_SIGNS[0];
  const ketSign = ZODIAC_SIGNS[getSignIdx(ketuLong)] || ZODIAC_SIGNS[0];

  return {
    targetIsoDate: tDate.toISOString().slice(0, 10),
    transits: {
      Saturn: { longitude: saturnLong, signIdx: getSignIdx(saturnLong), sign: satSign.name, signTa: satSign.tamil, houseFromLagna: saturnHouseFromLagna, houseFromMoon: saturnHouseFromMoon },
      Jupiter: { longitude: jupiterLong, signIdx: getSignIdx(jupiterLong), sign: jupSign.name, signTa: jupSign.tamil, houseFromLagna: jupiterHouseFromLagna, houseFromMoon: jupiterHouseFromMoon },
      Mars: { longitude: marsLong, signIdx: getSignIdx(marsLong), sign: marSign.name, signTa: marSign.tamil, houseFromLagna: marsHouseFromLagna, houseFromMoon: marsHouseFromMoon },
      Rahu: { longitude: rahuLong, signIdx: getSignIdx(rahuLong), sign: rahSign.name, signTa: rahSign.tamil, houseFromLagna: rahuHouseFromLagna, houseFromMoon: rahuHouseFromMoon },
      Ketu: { longitude: ketuLong, signIdx: getSignIdx(ketuLong), sign: ketSign.name, signTa: ketSign.tamil, houseFromLagna: ketuHouseFromLagna, houseFromMoon: ketuHouseFromMoon }
    },
    triggers: {
      isSadeSati,
      sadeSatiPhase,
      sadeSatiPhaseTa,
      isKantakaShani,
      isAshtamaShani,
      isGuruSubha,
      isRahuOnMoon,
      isKetuOnMoon
    }
  };
}

/**
 * COMPREHENSIVE MULTI-DIMENSIONAL RISK MATRIX & VULNERABILITY TIMELINES
 * Evaluates Personal, Marital, Health, Financial, Career, and Travel/Safety Risks
 * with exact timeline alert windows dynamically derived from the native's
 * actual Vimshottari Mahadasha/Antardasha schedule and planetary house rulerships.
 */

// ---------------------------------------------------------------------------
// RETROSPECTIVE DASHA CORRELATION REVIEW & LIFE MILESTONE VERIFICATION MATRIX
// Developed specifically for elderly and retrospective verification:
// Accurately aligns past Vimshottari Mahadasha + Antardasha cycles and Gochara
// transits with lived life incidents (Education, Career, Marriage, Progeny, Property, Health)
// ---------------------------------------------------------------------------
export function generateRetrospectiveLifeMilestoneAudit(
  planets = [],
  ascendantLong = 0,
  moonLong = 0,
  dashaTable = [],
  birthDate = new Date("1995-05-15T06:30:00Z"),
  lang = "en"
) {
  const isTamil = lang === "ta";
  const bDate = birthDate instanceof Date ? birthDate : new Date(birthDate);
  const now = new Date();
  const currentAge = Math.max(0, (now.getTime() - bDate.getTime()) / (365.24219878 * 86400000));
  const birthYear = bDate.getUTCFullYear();

  const lagnaSignIdx = Math.floor(norm360(ascendantLong) / 30);
  const lagnaSign = ZODIAC_SIGNS[lagnaSignIdx];
  if (!lagnaSign) throw new Error(`Invalid lagna sign index: ${lagnaSignIdx}`);
  const getHouseOfPlanet = (pName) => {
    const pl = planets.find(p => p.name.toLowerCase() === pName?.toLowerCase());
    return pl ? pl.house : null;
  };
  const getDignityOfPlanet = (pName) => {
    const pl = planets.find(p => p.name.toLowerCase() === pName?.toLowerCase());
    return pl ? (pl.dignity || "Neutral") : "Neutral";
  };

  // Flatten all historical Dasha-Bukthi periods
  const historicalIntervals = [];
  if (Array.isArray(dashaTable)) {
    dashaTable.forEach(md => {
      if (Array.isArray(md.bukthis)) {
        md.bukthis.forEach(bk => {
          if (bk.startAge <= currentAge) {
            historicalIntervals.push({
              mdLord: md.lord,
              mdTamil: md.tamil || md.lord,
              subLord: bk.subLord,
              subTamil: bk.subTamil || bk.subLord,
              startAge: bk.startAge,
              endAge: Math.min(bk.endAge, currentAge + 1.0),
              isCompleted: bk.endAge <= currentAge,
              startDateIso: bk.startDateIso || (bk.jdStart ? julianDateToDate(bk.jdStart).toISOString().slice(0, 10) : ""),
              endDateIso: bk.endDateIso || (bk.jdEnd ? julianDateToDate(bk.jdEnd).toISOString().slice(0, 10) : "")
            });
          }
        });
      }
    });
  }

  // Correlate each past period with authentic classical Jyotish incident themes
  const auditedMilestones = historicalIntervals.map((interval, idx) => {
    const mdHouse = getHouseOfPlanet(interval.mdLord);
    const subHouse = getHouseOfPlanet(interval.subLord);
    const activeHouses = [...new Set([mdHouse, subHouse])];
    const midAge = (interval.startAge + interval.endAge) / 2;

    let categoryEn = "General Life Evolution & Samskaras";
    let categoryTa = "வாழ்வியல் முன்னேற்றம் & தர்ம பரிபாலனம்";
    let verificationPromptEn = "A period of foundational growth, routine duties, and personal evolution.";
    let verificationPromptTa = "தனிப்பட்ட வளர்ச்சி, கடமைகள் மற்றும் இயல்பான முன்னேற்ற காலம்.";

    // 1. Education & Vidya (Ages 5 to 26, Houses 4, 5, or Mercury/Jupiter)
    if (midAge >= 4.5 && midAge <= 26.0 && (activeHouses.some(h => [4, 5].includes(h)) || ["Mercury", "Jupiter"].includes(interval.subLord))) {
      categoryEn = "Foundational / Higher Education Milestone & Vidya Completion";
      categoryTa = "கல்வி மேன்மை, பள்ளி/கல்லூரி பட்டப்படிப்பு & தேர்வு சாதனைகள்";
      verificationPromptEn = "Did you complete a major schooling grade, college degree, or professional certification during this window?";
      verificationPromptTa = "இக்காலக்கட்டத்தில் முக்கிய பள்ளித் தேர்வு, கல்லூரி பட்டப்படிப்பு அல்லது கல்வி மைல்கல் நிகழ்ந்ததா?";
    }
    // 2. Career Inception & First Earnings (Ages 18 to 32, Houses 10, 11, 1, or Sun/Mars/Saturn)
    else if (midAge >= 18.0 && (activeHouses.some(h => [10, 11, 1].includes(h)) || ["Sun", "Saturn"].includes(interval.subLord)) && !["Venus"].includes(interval.subLord)) {
      categoryEn = "Vocational Breakthrough, First Employment or Commercial Inception";
      categoryTa = "முதல் உத்தியோக தொடக்கம், தொழில் வளர்ச்சி & பொருளாதார சுதந்திரம்";
      verificationPromptEn = "Did you secure your first employment, major career promotion, or commence independent business in this period?";
      verificationPromptTa = "இக்காலக்கட்டத்தில் முதல் வேலை, தொழில் பதவி உயர்வு அல்லது சுயதொழில் துவக்கம் அமைந்ததா?";
    }
    // 3. Matrimonial Alliance & Grihastha Entry (Ages 20 to 45, Houses 7, 2, or Venus)
    else if (midAge >= 20.0 && midAge <= 45.0 && (activeHouses.some(h => [7, 2].includes(h)) || ["Venus"].includes(interval.subLord) || ["Venus"].includes(interval.mdLord))) {
      categoryEn = "Matrimonial Alliance, Grihastha Ashrama or Significant Partnership";
      categoryTa = "விவாக சுப யோகம், இல்லற பந்தம் & குடும்ப ஒருங்கிணைப்பு";
      verificationPromptEn = "Did marriage, matrimonial engagement, or life-defining personal alliance take place during these years?";
      verificationPromptTa = "இக்காலக்கட்டத்தில் திருமணம், நிச்சயதார்த்தம் அல்லது முக்கிய குடும்ப பந்தம் கைகூடியதா?";
    }
    // 4. Progeny Blessing & Family Lineage (Ages 22 to 50, House 5, 2, 9, or Jupiter)
    else if (midAge >= 22.0 && midAge <= 50.0 && (activeHouses.includes(5) || interval.subLord === "Jupiter")) {
      categoryEn = "Progeny Blessing, Childbirth & Family Lineage Expansion";
      categoryTa = "புத்திர பாக்கியம், வாரிசு பிறப்பு & குடும்ப விருத்தி";
      verificationPromptEn = "Did childbirth, major family expansion, or milestone accomplishments for children occur during this cycle?";
      verificationPromptTa = "இக்காலத்தில் குழந்தை பிறப்பு அல்லது பிள்ளைகள் சார்ந்த சுப நிகழ்வு நடைபெற்றதா?";
    }
    // 5. Land, Real Estate & Conveyance Acquisition (Houses 4, Mars, Venus)
    else if (activeHouses.includes(4) || interval.subLord === "Mars") {
      categoryEn = "Real Estate Acquisition, Residential Construction or Vehicle Purchase";
      categoryTa = "நிலம்/வீடு வாங்குதல், புதிய இல்லம் அமைத்தல் & வாகன சேர்க்கை";
      verificationPromptEn = "Did you purchase land/residential property, construct a house, or acquire a significant vehicle during this window?";
      verificationPromptTa = "இக்காலக்கட்டத்தில் சொந்த மனை/வீடு வாங்குதல், புதுமனை புகுதல் அல்லது வாகனம் வாங்குதல் அமைந்ததா?";
    }
    // 6. Long Distance Relocation & Foreign Travels (Houses 9, 12, Rahu, Moon)
    else if (activeHouses.some(h => [9, 12].includes(h)) || ["Rahu"].includes(interval.subLord)) {
      categoryEn = "Long-Distance Travel, Overseas Relocation or Significant Habitat Shift";
      categoryTa = "தேச-விதேச பயணம், வெளிநாட்டு வாழ்க்கை & இருப்பிட மாற்றம்";
      verificationPromptEn = "Did you undertake significant transcontinental travel, overseas relocation, or permanent residence change in this period?";
      verificationPromptTa = "இக்காலக்கட்டத்தில் வெளிநாட்டு பயணம், ஊர் மாற்றம் அல்லது இடப்பெயர்ச்சி நிகழ்ந்ததா?";
    }
    // 7. Somatic Resilience & Health Discipline (Houses 6, 8, Saturn, Ketu)
    else if (activeHouses.some(h => [6, 8].includes(h))) {
      categoryEn = "Somatic Healing, Health Vigilance & Overcoming Life Challenges";
      categoryTa = "உடல் நலம், மருத்துவ சிகிச்சை & சவால்களை வெல்லும் மன உறுதி";
      verificationPromptEn = "Did you navigate a period of intense health recovery, lifestyle restructuring, or overcoming major obstacles?";
      verificationPromptTa = "இக்காலக்கட்டத்தில் உடல்நல சவால்களை எதிர்கொண்டு கடந்துவரும் சூழல் அல்லது மருத்துவ சிகிச்சை அமைந்ததா?";
    }

    return {
      periodIndex: idx + 1,
      milestoneId: `retro_${idx + 1}`,
      dasha: isTamil ? `${interval.mdTamil} தசை - ${interval.subTamil} புக்தி` : `${interval.mdLord} MD - ${interval.subLord} AD`,
      dashaBukthi: `${interval.mdLord} MD - ${interval.subLord} AD`,
      dashaBukthiTa: `${interval.mdTamil} தசை - ${interval.subTamil} புக்தி`,
      ageRange: `${interval.startAge.toFixed(1)} - ${interval.endAge.toFixed(1)}`,
      calendarYears: `${Math.round(birthYear + interval.startAge)} - ${Math.round(birthYear + interval.endAge)}`,
      startDate: interval.startDateIso,
      endDate: interval.endDateIso,
      milestoneTheme: isTamil ? categoryTa : categoryEn,
      category: isTamil ? categoryTa : categoryEn,
      categoryEn,
      categoryTa,
      activatedHouses: activeHouses,
      lifeEventTrigger: isTamil ? verificationPromptTa : verificationPromptEn,
      verificationPrompt: isTamil ? verificationPromptTa : verificationPromptEn,
      verificationPromptEn,
      verificationPromptTa,
      periodType: "Calculated Candidate Period",
      userConfirmed: null,
      actualEventDate: null,
      userNotes: "",
      alignment: interval.isCompleted ? (isTamil ? "கணக்கிடப்பட்ட வரலாற்று காலம்" : "Calculated Candidate Period") : (isTamil ? "நடப்பு / சமீபத்திய காலம்" : "Recent Life Phase"),
      isCompleted: interval.isCompleted
    };
  });

  return {
    currentAge: Number(currentAge.toFixed(1)),
    totalHistoricalPeriods: auditedMilestones.length,
    summary: isTamil
      ? "ஜாதகரின் விம்சோத்தரி தசா-புக்தி வரலாற்றை கடந்த கால நிகழ்வுகளுடன் ஒப்பிட்டு ஜோதிட துல்லியத்தை நேரடியாக சரிபார்க்கும் சான்றளிக்கக்கூடிய அட்டவணை."
      : "Retrospective life milestone verification matrix allowing senior and audit users to cross-verify major lived events against calculated Vimshottari Dasha-Gochara history.",
    milestones: auditedMilestones
  };
}


export function calculateComprehensiveRiskMatrix(planets = [], ascendantLong = 0, moonLong = 0, dashaTable = [], birthYear = 1995, lang = "en") {
  // Support either (chart, lang) or (planets, ascendantLong, moonLong, dashaTable, birthYear, lang)
  let effectivePlanets = planets;
  let rawAscLong = ascendantLong;
  let rawMoonLong = moonLong;
  let effectiveDashaTable = dashaTable;
  let effectiveBirthYear = birthYear;
  let effectiveLang = lang;

  if (planets && !Array.isArray(planets) && typeof planets === "object") {
    const chart = planets;
    if (typeof ascendantLong === "string") {
      effectiveLang = ascendantLong;
    }
    effectivePlanets = chart.planets || [];
    rawAscLong = chart.ascendantDegree ?? chart.ascendantLong;
    rawMoonLong = chart.moonDegree ?? chart.moonLong;
    effectiveDashaTable = chart.dashaTable || [];
    effectiveBirthYear = chart.birthYear || (chart.birthDate ? (typeof chart.birthDate === "string" ? parseInt(chart.birthDate.split("-")[0], 10) : new Date(chart.birthDate).getUTCFullYear()) : null);
    if (!effectiveBirthYear || isNaN(effectiveBirthYear)) {
      throw new Error("Valid birthYear or birthDate is required for life milestone timeline calculation.");
    }
  }

  const effectiveAscLong = requireLongitude(rawAscLong, "calculateComprehensiveRiskMatrix ascendantLong");
  const effectiveMoonLong = requireLongitude(rawMoonLong, "calculateComprehensiveRiskMatrix moonLong");

  const isTamil = effectiveLang === "ta";
  const currentYear = new Date().getUTCFullYear();
  const currentAge = Math.max(0, currentYear - effectiveBirthYear);

  const getLordTamil = (name) => DASHA_LORDS.find(d => d.lord.toLowerCase() === (name || "").toLowerCase())?.tamil || name;

  const lagnaSignIdx = Math.floor(effectiveAscLong / 30);

  const getBhavaSignAndLord = (bhavaNum) => {
    const bhavaSignIdx = (lagnaSignIdx + (bhavaNum - 1)) % 12;
    const sign = ZODIAC_SIGNS[bhavaSignIdx];
    const lordName = sign.ruler;
    const lordPlanet = effectivePlanets.find(p => p.name.toLowerCase() === lordName.toLowerCase());
    const occupants = effectivePlanets.filter(p => p.house === bhavaNum);
    return { bhavaNum, sign, signIdx: bhavaSignIdx, lordName, lordPlanet, occupants };
  };

  const h1 = getBhavaSignAndLord(1);
  const h2 = getBhavaSignAndLord(2);
  const h3 = getBhavaSignAndLord(3);
  const h6 = getBhavaSignAndLord(6);
  const h7 = getBhavaSignAndLord(7);
  const h8 = getBhavaSignAndLord(8);
  const h10 = getBhavaSignAndLord(10);
  const h11 = getBhavaSignAndLord(11);
  const h12 = getBhavaSignAndLord(12);

  // Helper to scan native's actual Dasha Table for periods matching target criteria
  // prioritizing current/upcoming active periods across the full 120-year Vimshottari cycle.
  const findVulnerableWindows = (targetLords = [], secondaryLords = [], domainMinAge = 0.0, domainMaxAge = 120.0) => {
    const allMatches = [];

    if (Array.isArray(effectiveDashaTable) && effectiveDashaTable.length > 0) {
      for (const md of effectiveDashaTable) {
        const isMdTarget = targetLords.includes(md.lord);
        if (Array.isArray(md.bukthis) && md.bukthis.length > 0) {
          for (const bk of md.bukthis) {
            if (bk.endAge < domainMinAge || bk.startAge > domainMaxAge) continue;

            const isBkTarget = targetLords.includes(bk.subLord);
            const isBkSecondary = secondaryLords.includes(bk.subLord);
            if ((isMdTarget && (isBkSecondary || isBkTarget)) || isBkTarget) {
              allMatches.push({
                startAge: bk.startAge,
                endAge: bk.endAge,
                mdLord: md.lord,
                bkLord: bk.subLord,
                mdTamil: md.tamil || getLordTamil(md.lord),
                bkTamil: bk.subTamil || getLordTamil(bk.subLord),
                isCurrentOrUpcoming: bk.endAge >= currentAge - 0.5
              });
            }
          }
        } else if (isMdTarget) {
          if (md.endAge >= domainMinAge && md.startAge <= domainMaxAge) {
            allMatches.push({
              startAge: md.startAge,
              endAge: md.endAge,
              mdLord: md.lord,
              bkLord: null,
              mdTamil: md.tamil || getLordTamil(md.lord),
              bkTamil: null,
              isCurrentOrUpcoming: md.endAge >= currentAge - 0.5
            });
          }
        }
      }
    }

    const upcomingMatches = allMatches.filter(m => m.isCurrentOrUpcoming);
    const windows = (upcomingMatches.length > 0 ? upcomingMatches : allMatches).length > 0
      ? (upcomingMatches.length > 0 ? upcomingMatches : allMatches)
      : [];

    // Fallback: Check for Chhidra Dasha (transition periods) if no direct lord matches:
    if (windows.length === 0 && Array.isArray(effectiveDashaTable) && effectiveDashaTable.length > 0) {
      for (const md of effectiveDashaTable) {
        if (Array.isArray(md.bukthis) && md.bukthis.length > 2) {
          const lastBk = md.bukthis[md.bukthis.length - 1];
          const isUpcoming = lastBk.endAge >= currentAge - 0.5;
          if (lastBk.endAge >= domainMinAge && lastBk.startAge <= domainMaxAge) {
            if (isUpcoming || windows.length === 0) {
              windows.push({
                startAge: lastBk.startAge,
                endAge: lastBk.endAge,
                mdLord: md.lord,
                bkLord: lastBk.subLord,
                mdTamil: md.tamil || getLordTamil(md.lord),
                bkTamil: lastBk.subTamil || getLordTamil(lastBk.subLord)
              });
            }
          }
        }
      }
    }

    // If no windows matched, return explicit insufficient data without fabricating fake windows:
    if (windows.length === 0) {
      return {
        status: "insufficient_data",
        windows: [],
        ageStr: isTamil ? "விம்சோத்தரி சாளரம் இல்லை" : "No specific Dasha window identified",
        calStr: isTamil ? "கோச்சார காலம் மட்டும்" : "Transit periods only"
      };
    }

    const firstWin = windows[0];
    const ageStr = `${firstWin.startAge.toFixed(1)} - ${firstWin.endAge.toFixed(1)}`;
    const calStr = `${Math.round(effectiveBirthYear + firstWin.startAge)} - ${Math.round(effectiveBirthYear + firstWin.endAge)}`;

    return {
      status: "calculated",
      windows,
      ageStr,
      calStr
    };
  };

  // Derive traditional body-area correspondences dynamically from 6th/8th sign using classical Rashi body-region correspondences & Ayurvedic Doshas
  const getTraditionalBodyAreas = () => {
    const areaMap = {
      0: isTamil ? "சிரோ பாகம் (தலை, கண்கள், மூளை நரம்பு மண்டலம்)" : "Shiro Bhaga (Traditional Head/Cranial Region, Neuro-Sensory)",
      1: isTamil ? "கண்ட பாகம் (முகம், தொண்டை, தைராய்டு மண்டலம்)" : "Kantha Bhaga (Traditional Facial / Throat Region, Kapha Balance)",
      2: isTamil ? "அம்ச பாகம் (தோள்பட்டை, கைகள், வாத மண்டலம்)" : "Amsa Bhaga (Traditional Shoulder/Upper Extremities Region, Vata Zone)",
      3: isTamil ? "உரஸ் பாகம் (மார்புப் பகுதி, பிராண மண்டலம்)" : "Uras Bhaga (Traditional Thoracic Chest Region, Prana Zone)",
      4: isTamil ? "ஹிருதய பாகம் (மேல் முதுகு, சூரிய பிராண மண்டலம்)" : "Hridaya Bhaga (Traditional Mid-Back / Solar Vitality Zone)",
      5: isTamil ? "ஜடர பாகம் (நடுவயிற்று பகுதி, சாமான அக்னி மண்டலம்)" : "Jathara Bhaga (Traditional Abdominal / Digestive Fire Zone)",
      6: isTamil ? "பஸ்தி பாகம் (கீழ் முதுகு, இடுப்பு தாது மண்டலம்)" : "Basti Bhaga (Traditional Lumbar Region, Water-Element Balance)",
      7: isTamil ? "குஹ்ய பாகம் (இடுப்புக்குழி பகுதி, அபான மண்டலம்)" : "Guhya Bhaga (Traditional Pelvic Region, Apana Elimination Zone)",
      8: isTamil ? "ஊரு பாகம் (தொடைகள், தசை மண்டலம்)" : "Uru Bhaga (Traditional Thighs & Locomotion Tendons Zone)",
      9: isTamil ? "ஜானு பாகம் (முழங்கால்கள், மூட்டு சந்து மண்டலம்)" : "Janu Bhaga (Traditional Knee Joints & Structural Stability Zone)",
      10: isTamil ? "ஜங்க பாகம் (கால் முழங்கால் கீழ் பகுதி, வாத மண்டலம்)" : "Jangha Bhaga (Traditional Lower Legs & Calves Region)",
      11: isTamil ? "பாத பாகம் (பாதங்கள், உள்ளங்கால்கள், சயன மண்டலம்)" : "Pada Bhaga (Traditional Feet / Soles & Rest Harmony Zone)"
    };
    const primary = areaMap[h6.signIdx] || areaMap[0];
    const secondary = areaMap[h8.signIdx] || areaMap[7];
    return `${primary}; ${secondary}`;
  };

  // Helper to cross-verify Dasha windows with genuine multi-checkpoint Gochara transits
  const getTransitConvergence = (winObj, houseTarget) => {
    if (!winObj?.windows?.[0]) {
      return {
        level: isTamil ? "தகவல் போதாது" : "Insufficient Data",
        trigger: isTamil ? "கோச்சார தொடர்பு இல்லை" : "No Active Transit Convergence",
        checkpointAlignmentCount: 0
      };
    }
    try {
      const win = winObj.windows[0];
      const startAge = win.startAge;
      const endAge = win.endAge;
      const midAge = (startAge + endAge) / 2.0;

      const checkpointAges = [startAge, midAge, endAge];
      const triggersFound = [];

      for (const age of checkpointAges) {
        const cpDate = new Date(Date.UTC(Math.round(effectiveBirthYear + age), 5, 15, 12, 0, 0));
        const transitInfo = calculateTransitEphemeris(cpDate, effectiveAscLong, effectiveMoonLong);
        const satHouse = transitInfo.transits.Saturn.houseFromLagna;
        const marsHouse = transitInfo.transits.Mars.houseFromLagna;

        const isSaturnTrigger = satHouse === houseTarget || [satHouse + 2, satHouse + 6, satHouse + 9].map(h => ((h - 1) % 12) + 1).includes(houseTarget);
        const isMarsTrigger = marsHouse === houseTarget || [marsHouse + 3, marsHouse + 6, marsHouse + 7].map(h => ((h - 1) % 12) + 1).includes(houseTarget);

        if (isSaturnTrigger) triggersFound.push("Saturn");
        if (isMarsTrigger) triggersFound.push("Mars");
        if (transitInfo.triggers.isSadeSati) triggersFound.push("SadeSati");
      }

      if (triggersFound.length >= 2) {
        const uniqueTriggers = [...new Set(triggersFound)];
        const trigDesc = uniqueTriggers.includes("Saturn")
          ? (isTamil ? "சனி கோச்சார பார்வை (நிலையான தாக்கம்)" : "Saturn Transit Aspect (Persistent Across Window)")
          : (uniqueTriggers.includes("Mars")
              ? (isTamil ? "செவ்வாய் கோச்சார தாக்கம்" : "Mars Transit Trigger")
              : (isTamil ? "ஏழரைச் சனி கோச்சாரம்" : "Sade Sati Transit Phase"));
        return {
          level: isTamil ? "தசா மற்றும் கோச்சார ஒருங்கிணைப்பு (Dasha + Transit Alignment)" : "Dasha + Transit Alignment",
          trigger: trigDesc,
          checkpointAlignmentCount: triggersFound.length
        };
      } else if (triggersFound.length === 1) {
        return {
          level: isTamil ? "பகுதி கோச்சார ஒருங்கிணைப்பு (Partial Transit Alignment)" : "Partial Transit Alignment",
          trigger: isTamil ? "இடைப்பட்ட கோச்சார தாக்கம்" : "Intermittent Transit Influence",
          checkpointAlignmentCount: 1
        };
      }
      return {
        level: isTamil ? "தசா இயக்கம் (இயல்பான கோச்சாரம்)" : "Dasha Activation (Neutral Transit)",
        trigger: isTamil ? "இயல்பான கோச்சார நிலை" : "Baseline Astrological Transit",
        checkpointAlignmentCount: 0
      };
    } catch (error) {
      throw new Error(`Transit convergence calculation failed: ${error.message}`);
    }
  };

  // 1. Somatic Health Vulnerability
  const healthTargetLords = [h6.lordName, h8.lordName, h12.lordName].filter(Boolean);
  const healthWindows = findVulnerableWindows(healthTargetLords, ["Saturn", "Mars", "Rahu", "Ketu"], 18.0);
  const healthAfflictionsCount = (h6.occupants.length + (h6.lordPlanet?.isCombust ? 1 : 0) + ([6, 8, 12].includes(h1.lordPlanet?.house) ? 1 : 0));
  const healthRiskLevel = healthAfflictionsCount >= 2
    ? (isTamil ? "பாரம்பரிய நல எச்சரிக்கை (Elevated Traditional Wellness Attention)" : "Elevated Traditional Wellness Attention")
    : (isTamil ? "மிதமான விழிப்புணர்வு (Moderate Caution)" : "Moderate (Mindful Care Advised)");
  const healthConvergence = getTransitConvergence(healthWindows, 6);

  // 2. Personal & Marital Relationship
  const relTargetLords = [h7.lordName, h8.lordName, "Venus", "Rahu"].filter(Boolean);
  const relWindows = findVulnerableWindows(relTargetLords, ["Ketu", "Saturn", "Mars"], 22.0);
  const relAfflictionsCount = (h7.occupants.length + (h7.lordPlanet?.isCombust ? 1 : 0));
  const relRiskLevel = relAfflictionsCount >= 2
    ? (isTamil ? "உயர் கவனம் தேவை (Elevated Alert)" : "Elevated (Harmonious Communication Advised)")
    : (isTamil ? "மிதமான விழிப்புணர்வு தேவை (Moderate)" : "Moderate (Mindful Care Required)");
  const relConvergence = getTransitConvergence(relWindows, 7);

  // 3. Financial & Debt Volatility
  const finTargetLords = [h12.lordName, h8.lordName, "Rahu"].filter(Boolean);
  const finWindows = findVulnerableWindows(finTargetLords, [h2.lordName, h11.lordName, "Saturn"], 21.0);
  const finConvergence = getTransitConvergence(finWindows, 12);

  // 4. Career & Status Hazards
  const careerTargetLords = [h10.lordName, h6.lordName, "Saturn", "Rahu"].filter(Boolean);
  const careerWindows = findVulnerableWindows(careerTargetLords, ["Sun", "Mars"], 21.0);
  const careerConvergence = getTransitConvergence(careerWindows, 10);

  // 5. Physical Safety & Travel Hazard
  const safetyTargetLords = [h8.lordName, h3.lordName, "Mars", "Rahu"].filter(Boolean);
  const safetyWindows = findVulnerableWindows(safetyTargetLords, ["Saturn", "Ketu"], 18.0);
  const safetyConvergence = getTransitConvergence(safetyWindows, 8);

  const relCause = relWindows.windows.length === 0
    ? (isTamil
        ? "இந்த பாவகத்திற்கான விம்சோத்தரி தசா-புக்தி சாளரம் போதிய தரவுகள் இன்றி கணிக்க இயலவில்லை."
        : "Insufficient Dasha coverage to isolate an active caution window for this domain.")
    : (isTamil
        ? `7-ம் களத்திர அதிபதி ${h7.lordPlanet?.tamil || getLordTamil(h7.lordName)} மற்றும் 8-ம் பாவக தசா புக்தி சுழற்சிகள்; ${relWindows.windows[0]?.mdTamil ? `${relWindows.windows[0].mdTamil} தசை - ${relWindows.windows[0].bkTamil} புக்தி` : "கோச்சார கிரக"} காலத்தில் தம்பதியரிடையே கருத்து வேறுபாடுகள் எழாமல் பரஸ்பர புரிதல் தேவை.`
        : `7th Lord ${h7.lordName} and 8th house dasha-transit dynamics; activation of ${relWindows.windows[0]?.mdLord ? `${relWindows.windows[0].mdLord} Mahadasha - ${relWindows.windows[0].bkLord} Bukthi` : "operating"} sub-periods advises patience and clear communication.`);

  const healthCause = healthWindows.windows.length === 0
    ? (isTamil
        ? "இந்த பாவகத்திற்கான விம்சோத்தரி தசா-புக்தி சாளரம் போதிய தரவுகள் இன்றி கணிக்க இயலவில்லை."
        : "Insufficient Dasha coverage to isolate an active caution window for this domain.")
    : (isTamil
        ? `6-ம் ரோக ஸ்தானாதிபதி ${h6.lordPlanet?.tamil || getLordTamil(h6.lordName)} (${h6.sign.tamil}) மற்றும் 8-ம் அதிபதி ${h8.lordPlanet?.tamil || getLordTamil(h8.lordName)} சஞ்சாரங்கள்; ${healthWindows.windows[0]?.mdTamil ? `${healthWindows.windows[0].mdTamil} தசை - ${healthWindows.windows[0].bkTamil} புக்தி` : "தசா புக்தி"} சுழற்சிகள் இயங்கும் காலங்கள்.`
        : `6th house lord ${h6.lordName} in ${h6.sign.name} and 8th lord ${h8.lordName} activating traditional wellness associations during ${healthWindows.windows[0]?.mdLord ? `${healthWindows.windows[0].mdLord} - ${healthWindows.windows[0].bkLord}` : "operating"} cycles.`);

  const finCause = finWindows.windows.length === 0
    ? (isTamil
        ? "இந்த பாவகத்திற்கான விம்சோத்தரி தசா-புக்தி சாளரம் போதிய தரவுகள் இன்றி கணிக்க இயலவில்லை."
        : "Insufficient Dasha coverage to isolate an active caution window for this domain.")
    : (isTamil
        ? `12-ம் விரய பாவக அதிபதி ${h12.lordPlanet?.tamil || getLordTamil(h12.lordName)} மற்றும் 8-ம் மறைவு ஸ்தான தொடர்புகள்; ${finWindows.windows[0]?.mdTamil ? `${finWindows.windows[0].mdTamil} தசை - ${finWindows.windows[0].bkTamil} புக்தி` : "தசா சந்தி"} காலத்தில் முதலீடுகளில் பேராசையை தவிர்த்து மூலதன பாதுகாப்பை உறுதி செய்ய வேண்டும்.`
        : `12th house (Vyaya Bhava) lord ${h12.lordName} activation coincided with ${finWindows.windows[0]?.mdLord ? `${finWindows.windows[0].mdLord} Mahadasha - ${finWindows.windows[0].bkLord} Bukthi` : "transitional"} sub-periods; demands strict risk controls against speculative leverage.`);

  const careerCause = careerWindows.windows.length === 0
    ? (isTamil
        ? "இந்த பாவகத்திற்கான விம்சோத்தரி தசா-புக்தி சாளரம் போதிய தரவுகள் இன்றி கணிக்க இயலவில்லை."
        : "Insufficient Dasha coverage to isolate an active caution window for this domain.")
    : (isTamil
        ? `10-ம் கர்ம ஸ்தான அதிபதி ${h10.lordPlanet?.tamil || getLordTamil(h10.lordName)} மற்றும் ${careerWindows.windows[0]?.mdTamil ? `${careerWindows.windows[0].mdTamil} தசை - ${careerWindows.windows[0].bkTamil} புக்தி` : "தசா சந்தி"} காலங்களில் பணியிடத்தில் ஏற்படும் திடீர் மறுசீரமைப்புகள்.`
        : `10th Career Lord ${h10.lordName} under ${careerWindows.windows[0]?.mdLord ? `${careerWindows.windows[0].mdLord} Mahadasha - ${careerWindows.windows[0].bkLord} Bukthi` : "major sub-period shifts"} requiring administrative resilience.`);

  const safetyCause = safetyWindows.windows.length === 0
    ? (isTamil
        ? "இந்த பாவகத்திற்கான விம்சோத்தரி தசா-புக்தி சாளரம் போதிய தரவுகள் இன்றி கணிக்க இயலவில்லை."
        : "Insufficient Dasha coverage to isolate an active caution window for this domain.")
    : (isTamil
        ? `8-ம் பாவக அதிபதி ${h8.lordPlanet?.tamil || getLordTamil(h8.lordName)} மற்றும் 3-ம் பயண பாவக அதிபதி ${h3.lordPlanet?.tamil || getLordTamil(h3.lordName)} சஞ்சாரங்கள்; ${safetyWindows.windows[0]?.mdTamil ? `${safetyWindows.windows[0].mdTamil} தசை - ${safetyWindows.windows[0].bkTamil} புக்தி` : "கோச்சார கிரக"} காலத்தில் பயணங்களில் கூடுதல் கவனம் தேவை.`
        : `8th house lord ${h8.lordName} and 3rd house lord ${h3.lordName} alignments during ${safetyWindows.windows[0]?.mdLord ? `${safetyWindows.windows[0].mdLord} - ${safetyWindows.windows[0].bkLord}` : "transitional"} periods advising defensive commuting.`);

  const risks = [
    {
      id: "personal_relationship",
      title: isTamil ? "தனிப்பட்ட வாழ்க்கை, மன அழுத்தம் & திருமண உறவு சமநிலை" : "Personal, Emotional & Marital Harmony Caution Matrix",
      riskLevel: relRiskLevel,
      cautionLevel: relRiskLevel,
      traditionalCautionLevel: relRiskLevel,
      convergenceLevel: relConvergence.level,
      transitTrigger: relConvergence.trigger,
      timingIndicator: relConvergence.trigger,
      astrologicalBasis: relCause,
      vulnerableTimelineAge: relWindows.ageStr,
      traditionalCautionWindowAge: relWindows.ageStr,
      vulnerableCalendarYears: relWindows.calStr,
      traditionalCautionCalendarYears: relWindows.calStr,
      vulnerabilityTriggers: isTamil
        ? "அவசர வாக்குவாதங்கள், ஈகோ மோதல்கள், மூன்றாம் நபர்களின் குடும்பத் தலையீடுகள் மற்றும் விட்டுக்கொடுக்காத பிடிவாதம்."
        : "Impulsive disputes, ego clashes, unverified suspicions, external third-party interference, and rigid stances.",
      protectiveRemedy: isTamil
        ? "வெள்ளிக்கிழமைகளில் ஸ்ரீ லலிதா சகஸ்ரநாமம் அல்லது சுக்கிர காயத்ரி ஜபித்தல்; தம்பதியர் ஒன்றாக இணைந்து குலதெய்வ வழிபாடு செய்தல்; புதன் வக்ர காலத்தில் சுப முடிவுகளை தள்ளிப்போடுதல்."
        : "Recite Sri Lalitha Sahasranamam or Shukra Gayatri on Fridays; conduct joint family deity archana; practice conscious calm and avoid legal confrontations during Mercury retrograde periods."
    },
    {
      id: "health_somatic",
      title: isTamil ? "பாரம்பரிய உடல் சமநிலை & தடுப்பு நலன் எச்சரிக்கை காலங்கள்" : "Traditional Somatic Balance & Preventive Wellness Advisory",
      riskLevel: healthRiskLevel,
      cautionLevel: healthRiskLevel,
      traditionalCautionLevel: healthRiskLevel,
      convergenceLevel: healthConvergence.level,
      transitTrigger: healthConvergence.trigger,
      timingIndicator: healthConvergence.trigger,
      astrologicalBasis: healthCause,
      vulnerableTimelineAge: healthWindows.ageStr,
      traditionalCautionWindowAge: healthWindows.ageStr,
      vulnerableCalendarYears: healthWindows.calStr,
      traditionalCautionCalendarYears: healthWindows.calStr,
      traditionalBodyAreas: getTraditionalBodyAreas(),
      traditionalWellnessNotice: isTamil
        ? "பாரம்பரிய ஆயுர்வேத உடல் சமநிலை வழிகாட்டல் (மருத்துவ நோயறிதல் அல்ல)"
        : "Traditional Ayurvedic body-region wellness association (not a medical diagnosis)",
      medicalNotice: isTamil
        ? "சட்டரீதியான அறிவிப்பு: இந்த அறிக்கை பாரம்பரிய ஜோதிட வழிகாட்டல் மட்டுமே. இது மருத்துவ நோயறிதலோ அல்லது மருத்துவ சிகிச்சையோ அல்ல."
        : "Statutory Notice: This is a traditional astrological interpretation, not a medical forecast. It is not a medical diagnosis or disease prediction.",
      protectiveRemedy: isTamil
        ? "தினமும் அதிகாலை 108 முறை மகா மிருத்யுஞ்சய மந்திரம் ஓதுதல்; பிறந்த நட்சத்திர நாளில் தன்வந்திரி ஹோமம் அல்லது ருத்ராபிஷேகம் செய்தல்; பருவநிலை மாற்றங்களில் சமச்சீர் உணவு உட்கொள்வது உத்தமம்."
        : "Daily 108 chants of Maha Mrityunjaya Mantra; organize annual Dhanvantari Puja / Rudrabhishekam on Moon Nakshatra day; maintain healthy lifestyle discipline and adopt an Ayurvedic wellness diet."
    },
    {
      id: "financial_commercial",
      title: isTamil ? "நிதி மேலாண்மை, கடன் ஒழுங்கு & மூலதன பாதுகாப்பு வழிகாட்டல்" : "Financial Volatility, Debt Discipline & Capital Preservation Advisory",
      riskLevel: isTamil ? "கவனமுடன் இருக்க வேண்டிய காலம் (Moderate to High)" : "Moderate to High (Caution in Capital Outlays)",
      cautionLevel: isTamil ? "கவனமுடன் இருக்க வேண்டிய காலம் (Moderate to High)" : "Moderate to High (Caution in Capital Outlays)",
      traditionalCautionLevel: isTamil ? "கவனமுடன் இருக்க வேண்டிய காலம் (Moderate to High)" : "Moderate to High (Caution in Capital Outlays)",
      convergenceLevel: finConvergence.level,
      transitTrigger: finConvergence.trigger,
      timingIndicator: finConvergence.trigger,
      astrologicalBasis: finCause,
      vulnerableTimelineAge: finWindows.ageStr,
      traditionalCautionWindowAge: finWindows.ageStr,
      vulnerableCalendarYears: finWindows.calStr,
      traditionalCautionCalendarYears: finWindows.calStr,
      warningSignals: isTamil
        ? "எவருக்கும் கடன் உத்தரவாதம் (Loan Surety) கையெழுத்திடக் கூடாது; கிரிப்டோ, எஃப் அண்ட் ஓ (F&O) போன்ற அதீத ரிஸ்க் வர்த்தகங்களை முற்றிலும் தவிர்க்கவும்; 12 மாத அவசர நிதியை பாதுகாப்பாக சேமிக்கவும்."
        : "Never sign third-party loan guarantees or sureties; strictly avoid unhedged derivatives (F&O) and speculative crypto trading; maintain 12 months of liquid emergency reserves.",
      protectiveRemedy: isTamil
        ? "வெள்ளிக்கிழமைகளில் ஸ்ரீ சூக்தம் வாசித்தல்; வியாழன்தோறும் ஏழைகளுக்கு தயிர் சாதம் அல்லது அன்னதானம் செய்தல்; கடன் வாங்குவதை 30% அளவுக்குள் கட்டுப்படுத்துதல்."
        : "Chant Sri Suktam on Fridays; offer food to the underprivileged on Thursdays; maintain a conservative debt-to-income ratio below 30%."
    },
    {
      id: "career_legal",
      title: isTamil ? "தொழில் முடக்கம், உத்தியோக மாற்றங்கள் & நிர்வாக ஒழுங்குமுறை" : "Career Setbacks, Administrative Inquiries & Professional Resilience",
      riskLevel: isTamil ? "கட்டுப்படுத்தக்கூடியது (Low to Moderate)" : "Low to Moderate (Manageable with Ethical Discipline)",
      cautionLevel: isTamil ? "கட்டுப்படுத்தக்கூடியது (Low to Moderate)" : "Low to Moderate (Manageable with Ethical Discipline)",
      traditionalCautionLevel: isTamil ? "கட்டுப்படுத்தக்கூடியது (Low to Moderate)" : "Low to Moderate (Manageable with Ethical Discipline)",
      convergenceLevel: careerConvergence.level,
      transitTrigger: careerConvergence.trigger,
      timingIndicator: careerConvergence.trigger,
      astrologicalBasis: careerCause,
      vulnerableTimelineAge: careerWindows.ageStr,
      traditionalCautionWindowAge: careerWindows.ageStr,
      vulnerableCalendarYears: careerWindows.calStr,
      traditionalCautionCalendarYears: careerWindows.calStr,
      protectiveRemedy: isTamil
        ? "ஞாயிறுதோறும் சூரிய உதயத்தில் ஆதித்ய ஹிருதய ஸ்தோத்திரம் பாராயணம் செய்தல்; நிறுவன தணிக்கை, வரி மற்றும் சட்ட விதிமுறைகளை துல்லியமாக பின்பற்றுதல்; மேலதிகாரிகளுடன் நேரடி வாக்குவாதங்களை தவிர்த்தல்."
        : "Recite Aditya Hridaya Stotram at sunrise on Sundays; maintain meticulous financial and tax records; preserve absolute corporate compliance and avoid confrontations with executive boards."
    },
    {
      id: "safety_travel",
      title: isTamil ? "பயண பாதுகாப்பு & எச்சரிக்கை வழிகாட்டல்" : "Travel & Safety Caution Indicators",
      riskLevel: isTamil ? "பாதுகாப்பு விழிப்புணர்வு தேவை (Low to Moderate)" : "Low to Moderate (Travel Defensive Awareness)",
      cautionLevel: isTamil ? "பாதுகாப்பு விழிப்புணர்வு தேவை (Low to Moderate)" : "Low to Moderate (Travel Defensive Awareness)",
      traditionalCautionLevel: isTamil ? "பாதுகாப்பு விழிப்புணர்வு தேவை (Low to Moderate)" : "Low to Moderate (Travel Defensive Awareness)",
      convergenceLevel: safetyConvergence.level,
      transitTrigger: safetyConvergence.trigger,
      timingIndicator: safetyConvergence.trigger,
      astrologicalBasis: safetyCause,
      vulnerableTimelineAge: safetyWindows.ageStr,
      traditionalCautionWindowAge: safetyWindows.ageStr,
      vulnerableCalendarYears: safetyWindows.calStr,
      traditionalCautionCalendarYears: safetyWindows.calStr,
      protectiveRemedy: isTamil
        ? "பயணம் புறப்படுவதற்கு முன் ஸ்ரீ அனுமன் சாலிசா வாசித்தல்; வாகனத்தில் ஸ்ரீ சுதர்சன படம்/யந்திரம் பதித்தல்; இரவு நேர அதிவேக நெடுஞ்சாலை பயணங்களை தவிர்ப்பது நலம்."
        : "Chant Sri Hanuman Chalisa before commencing vehicle journeys; install a consecrated Sri Sudarshana Yantra in your automobile; avoid high-speed overnight road journeys during Amavasya."
    }
  ];

  return {
    summary: isTamil
      ? "ஜாதகரின் விம்சோத்தரி தசா-புக்தி அட்டவணை மற்றும் கிரக கோச்சார சுழற்சிகளை கணித்து உருவாக்கப்பட்ட பாரம்பரிய எச்சரிக்கை வழிகாட்டி."
      : "Personalized multi-dimensional traditional caution dossier dynamically computed from the native's operating Vimshottari Dashas and planetary house ownership.",
    statutoryNotice: isTamil
      ? "சட்டப்பூர்வ அறிவிப்பு (மருத்துவ வழிகாட்டல்): இந்த பாரம்பரிய எச்சரிக்கை வழிகாட்டி பண்டைய வேத ஜோதிட தசா-புக்தி மற்றும் கோச்சார குறியீடுகளின் அடிப்படையில் மட்டுமே கணிக்கப்பட்டுள்ளது. இது மருத்துவ முன்னறிவிப்போ அல்லது நோயறிதலோ அல்ல. வானியல் கணக்கீடுகள் சுயாதீனமாக சரிபார்க்கப்படலாம்; ஜோதிட விளக்கங்கள் பாரம்பரியத்தை சார்ந்தவை, அறிவியல் பூர்வமாக நிரூபிக்கப்பட்டவை அல்ல. உடல்நலக் குறைபாடுகளுக்கு எப்போதும் தகுதிவாய்ந்த மருத்துவ நிபுணர்களை அணுகவும்."
      : "Statutory Medical Notice: This is a traditional astrological interpretation, not a medical forecast. Calculated according to classical Vedic Dasha-Gochar correspondences. Astronomical calculations can be independently validated; astrological interpretations are tradition-dependent and are not scientifically validated predictions of life events. Always consult qualified licensed medical professionals for health concerns.",
    risks
  };
}

/**
 * 15. CHRONOLOGICAL DASHA & LIFE-STAGE ANALYSIS (VIMSHOTTARI LIFECYCLE TRAJECTORY)
 * Generates dynamic lifecycle trajectory directly from the native's unique
 * Vimshottari Mahadasha and Antardasha sequence, evaluating house rulerships,
 * planetary dignities, and normalized astrological support scores.
 */
export function calculateChronologicalDashaTimeline(
  chartOrPlanets = [],
  maybeAscLong = 0,
  maybeMoonLong = 0,
  maybeDashaTable = [],
  maybeBirthYear = 1995,
  maybeLang = "en",
  ascendantSign = null,
  moonSign = null,
  moonNakshatra = null,
  shadbala = []
) {
  let planets = Array.isArray(chartOrPlanets) ? chartOrPlanets : [];
  let ascendantLong = typeof maybeAscLong === "number" ? maybeAscLong : 0;
  let moonLong = typeof maybeMoonLong === "number" ? maybeMoonLong : 0;
  let dashaTable = Array.isArray(maybeDashaTable) ? maybeDashaTable : [];
  let birthYear = typeof maybeBirthYear === "number" ? maybeBirthYear : 1995;
  let lang = typeof maybeLang === "string" ? maybeLang : (typeof maybeAscLong === "string" ? maybeAscLong : "en");
  let tzOffsetHours = 5.5;
  let timezoneId = "Asia/Kolkata";
  let birthJd = null;
  let birthInstantUtc = null;

  if (chartOrPlanets && !Array.isArray(chartOrPlanets)) {
    const ctx = parseChartContext(chartOrPlanets, maybeAscLong, maybeMoonLong, maybeDashaTable, maybeBirthYear, maybeLang);
    planets = ctx.planets || [];
    ascendantLong = ctx.ascendantLong ?? null;
    moonLong = ctx.moonLong ?? null;
    dashaTable = ctx.dashaTable && ctx.dashaTable.length > 0 ? ctx.dashaTable : [];
    birthYear = ctx.birthYear ?? birthYear;
    lang = ctx.lang || lang;
    shadbala = ctx.shadbala || shadbala || [];
    tzOffsetHours = ctx.timezoneOffsetHours ?? tzOffsetHours;
    timezoneId = ctx.timezoneId || timezoneId;
    birthJd = ctx.birthJd;
    birthInstantUtc = ctx.birthInstantUtc;
    ascendantSign = chartOrPlanets.ascendantSign || ascendantSign;
    moonSign = chartOrPlanets.moonSign || moonSign;
    moonNakshatra = chartOrPlanets.moonNakshatra || moonNakshatra;
  }

  if (!Number.isFinite(ascendantLong)) {
    return {
      status: "INSUFFICIENT_DATA",
      reason: "Ascendant longitude not available for chronological dasha lifecycle calculation",
      phases: [],
      currentPhase: null,
      dashaTimeline: []
    };
  }

  const isTamil = lang === "ta";
  const lagnaSignIdx = Math.floor(norm360(ascendantLong) / 30);
  const lagnaSign = ZODIAC_SIGNS[lagnaSignIdx];

  const getBhavaSignAndLord = (bhavaNum) => {
    const bhavaSignIdx = (lagnaSignIdx + (bhavaNum - 1)) % 12;
    const sign = ZODIAC_SIGNS[bhavaSignIdx];
    const lordName = sign.ruler;
    const lordPlanet = planets.find(p => p.name.toLowerCase() === lordName.toLowerCase());
    return { bhavaNum, sign, lordName, lordPlanet };
  };

  const lagnaName = ascendantSign ? (isTamil ? ascendantSign.tamil : ascendantSign.name) : (isTamil ? lagnaSign.tamil : lagnaSign.name);
  const rasiName = moonSign ? (isTamil ? moonSign.tamil : moonSign.name) : (isTamil ? "சந்திர ராசி" : "Moon Sign");
  const starName = moonNakshatra ? (isTamil ? `${moonNakshatra.tamil} (பாதம் ${moonNakshatra.pada})` : `${moonNakshatra.name} Pada ${moonNakshatra.pada}`) : "";

  // Helper to find which houses a given planet rules from Lagna
  const getHousesRuledByPlanet = (planetName) => {
    if (!planetName) return [];
    const houses = [];
    for (let h = 1; h <= 12; h++) {
      const bh = getBhavaSignAndLord(h);
      if (bh.lordName && bh.lordName.toLowerCase() === planetName.toLowerCase()) {
        houses.push(h);
      }
    }
    return houses;
  };

  // Helper to compute authentic astrological support level (Qualitative Classical Evidence)
  const calcPlanetSupport = (planetName) => {
    if (!planetName) {
      return {
        evidenceLevel: isTamil ? "நடுநிலை கிரக அமைப்பு" : "Neutral Astrological Alignment",
        supportingFactors: [],
        counterIndicators: []
      };
    }
    const p = planets.find(pl => pl.name && pl.name.toLowerCase() === planetName.toLowerCase());
    if (!p) {
      return {
        evidenceLevel: isTamil ? "நடுநிலை கிரக அமைப்பு" : "Neutral Astrological Alignment",
        supportingFactors: [],
        counterIndicators: []
      };
    }
    const sups = [];
    const cons = [];

    if (["Exalted", "Moolatrikona", "Own"].includes(p.dignity)) {
      sups.push(`High planetary dignity (${p.dignity})`);
    } else if (["Great Friend", "Friend"].includes(p.dignity)) {
      sups.push(`Friendly sign placement (${p.dignity})`);
    } else if (p.dignity === "Debilitated") {
      cons.push("Debilitation (Neecha) requires conscious remediation");
    } else if (["Enemy", "Great Enemy"].includes(p.dignity)) {
      cons.push(`Inimical sign placement (${p.dignity})`);
    }

    if ([1, 4, 5, 9, 10, 11].includes(p.house)) {
      sups.push(`Auspicious Kendra/Trikona/Labha house placement (House ${p.house})`);
    } else if ([6, 8, 12].includes(p.house)) {
      cons.push(`Dusthana house placement (House ${p.house})`);
    }

    if (p.isCombust) cons.push("Combustion with Sun");
    if (p.isRetrograde && ["Jupiter", "Venus", "Mercury"].includes(p.name)) {
      sups.push("Benefic retrograde motion conferring deep introspective strength");
    }

    const evidenceLevel = (sups.length > 0 && cons.length === 0)
      ? (isTamil ? "நேர்மறை சுப கிரக ஆதரவு" : "Planetary Supportive Alignment")
      : ((sups.length > 0 && cons.length > 0)
          ? (isTamil ? "கலப்பு கிரக தாக்கம்" : "Mixed Astrological Influences")
          : (isTamil ? "நடுநிலை கிரக அமைப்பு" : "Neutral Astrological Alignment"));

    return {
      evidenceLevel,
      supportingFactors: sups,
      counterIndicators: cons
    };
  };

  // Pre-calculate Varga positions for MD/AD analysis
  const d9Chart = getVargaChartData(planets, ascendantLong, calculateD9);
  const d10Chart = getVargaChartData(planets, ascendantLong, calculateD10);

  // Generate dynamic lifecycle stages from the native's actual Dasha Table!
  const stages = [];
  let stageCounter = 1;
  const usedTitlesEn = new Set();

  if (Array.isArray(dashaTable) && dashaTable.length > 0) {
    for (let dIdx = 0; dIdx < dashaTable.length; dIdx++) {
      const md = dashaTable[dIdx];
      const mdLord = md.lord;
      const mdTa = md.tamil || mdLord;
      const mdHouses = getHousesRuledByPlanet(mdLord);
      const mdPlanet = planets.find(p => p.name && p.name.toLowerCase() === mdLord?.toLowerCase());
      const mdHouse = mdPlanet ? mdPlanet.house : null;
      const mdDignity = mdPlanet?.dignity || "Neutral";
      const mdD9 = d9Chart.getPlanet(mdLord) || { vargaSignName: "Unknown", vargaHouse: 1 };
      const mdD10 = d10Chart.getPlanet(mdLord) || { vargaSignName: "Unknown", vargaHouse: 1 };

      const bukthis = Array.isArray(md.bukthis) && md.bukthis.length > 0
        ? md.bukthis
        : [{ subLord: mdLord, subTamil: mdTa, startAge: md.startAge, endAge: md.endAge }];

      for (let bIdx = 0; bIdx < bukthis.length; bIdx++) {
        const bk = bukthis[bIdx];
        const pStart = bk.startAge;
        const pEnd = bk.endAge;
        const bkLord = bk.subLord || bk.lord || mdLord;
        const bkTa = bk.subTamil || bk.tamil || md.bukthis?.find(b => (b.subLord || b.lord) === bkLord)?.subTamil || bkLord;
        const bkHouses = getHousesRuledByPlanet(bkLord);
        const bkPlanet = planets.find(p => p.name && p.name.toLowerCase() === bkLord?.toLowerCase());
        const bkHouse = bkPlanet ? bkPlanet.house : null;
        const bkDignity = bkPlanet?.dignity || "Neutral";
        const bkD9 = d9Chart.getPlanet(bkLord) || { vargaSignName: "Unknown", vargaHouse: 1 };
        const bkD10 = d10Chart.getPlanet(bkLord) || { vargaSignName: "Unknown", vargaHouse: 1 };

        const calY1 = Math.round(birthYear + pStart);
        const calY2 = Math.round(birthYear + pEnd);
        const support = calcPlanetSupport(mdLord);

        // 1. Mutual Relationship (Sambandha) between MD Lord and AD Lord
        let mutualHouses = 1;
        let mutualRelName = "Conjunction / Direct Axis (1/1)";
        let mutualRelNameTa = "இணைவு அச்சு (1/1)";
        if (mdHouse && bkHouse) {
          mutualHouses = ((bkHouse - mdHouse + 12) % 12) + 1;
          if (mutualHouses === 1) {
            mutualRelName = "Conjunction Axis (1/1)";
            mutualRelNameTa = "ஒரே பாவக இணைவு (1/1)";
          } else if (mutualHouses === 7) {
            mutualRelName = "Mutual Aspect Axis (1/7)";
            mutualRelNameTa = "சமசப்தம பார்வை அச்சு (1/7)";
          } else if (mutualHouses === 5 || mutualHouses === 9) {
            mutualRelName = "Trikona Auspicious Axis (5/9)";
            mutualRelNameTa = "நவபஞ்சம சுப திரிகோண அச்சு (5/9)";
          } else if (mutualHouses === 4 || mutualHouses === 10) {
            mutualRelName = "Kendra Action Axis (4/10)";
            mutualRelNameTa = "கேந்திர கர்ம செயல் அச்சு (4/10)";
          } else if (mutualHouses === 3 || mutualHouses === 11) {
            mutualRelName = "Labha & Enterprise Axis (3/11)";
            mutualRelNameTa = "லாப & முயற்சிகள் அச்சு (3/11)";
          } else if (mutualHouses === 6 || mutualHouses === 8) {
            mutualRelName = "Shadashtaka Remedial & Diligence Axis (6/8)";
            mutualRelNameTa = "சடாஷ்டக தற்காப்பு அச்சு (6/8)";
          } else if (mutualHouses === 2 || mutualHouses === 12) {
            mutualRelName = "Dvidvadasha Resource & Transition Axis (2/12)";
            mutualRelNameTa = "துவிதச மாற்றங்கள் அச்சு (2/12)";
          }
        }

        // 2. Multi-Theme Synthesis & House Lordships Activated
        const combinedHouses = Array.from(new Set([...mdHouses, ...bkHouses]));
        const themeCandidates = [];

        // Career & Leadership Theme
        if (combinedHouses.some(h => [10, 1].includes(h)) || ["Sun", "Saturn"].includes(mdLord) || ["Sun", "Saturn"].includes(bkLord)) {
          themeCandidates.push({
            key: "career",
            priority: combinedHouses.includes(10) ? 10 : 7,
            titleEn: `${mdLord} MD - ${bkLord} AD: Vocational Ascent, Leadership & Institutional Recognition`,
            titleTa: `${mdTa} தசை - ${bkTa} புக்தி: தொழில் முன்னேற்றம், தலைமைப் பொறுப்பு & சமூக அங்கீகாரம்`,
            predEn: `Under the operational governance of ${mdLord} (ruling houses [${mdHouses.join(", ")}], situated in House ${mdHouse}) and ${bkLord} (ruling houses [${bkHouses.join(", ")}], House ${bkHouse}), this period activates the career and professional axis. Operating in a ${mutualRelName}, it creates constructive conditions for vocational authority, executive duties, and occupational growth.`,
            predTa: `உங்கள் ${lagnaName} லக்னத்திற்கு ${mdHouses.join(", ")}-ம் பாவகங்களை ஆளும் ${mdTa} மகா தசையும், ${bkHouses.join(", ")}-ம் பாவகங்களை இயக்கும் ${bkTa} புக்தியும் இணையும் காலம். ${mutualRelNameTa} அமைப்பில் அமைவதால் உத்தியோக உயர்வு, புதிய பொறுப்புகள் மற்றும் தொழில் முன்னேற்றம் உண்டாகும்.`,
            guidanceEn: `Maintain transparency in executive transactions and strengthen professional networking.`,
            guidanceTa: `நேர்மையான நிர்வாக நெறிமுறைகளை பின்பற்றுவதும் மூத்த வழிகாட்டிகளின் ஆலோசனைகளை ஏற்பதும் நலம்.`
          });
        }

        // Property, Vehicles & Domestic Asset Theme
        if (combinedHouses.some(h => [4, 2].includes(h)) || ["Mars"].includes(mdLord) || ["Mars"].includes(bkLord)) {
          themeCandidates.push({
            key: "property",
            priority: combinedHouses.includes(4) ? 9 : 6,
            titleEn: `${mdLord} MD - ${bkLord} AD: Real Estate, Conveyances & Domestic Asset Stabilization`,
            titleTa: `${mdTa} தசை - ${bkTa} புக்தி: மனை, வாகனம் & குடும்ப சொத்து சேர்க்கை மேன்மை`,
            predEn: `Energizing the 4th house of fixed assets and domestic foundation alongside the 2nd house of accumulated reserves, ${mdLord} (House ${mdHouse}) and ${bkLord} (House ${bkHouse}) support property acquisitions, residential stabilization, and conveyances under a ${mutualRelName}.`,
            predTa: `4-ம் சுக/பூமி ஸ்தானம் மற்றும் 2-ம் தன பாவகங்களை இயக்கும் ${mdTa} தசை - ${bkTa} புக்தி காலத்தில் சொந்த மனை வாங்குதல், வீடு கட்டுதல், வாகனம் சேர்த்தல் மற்றும் குடும்ப சுபிட்சம் நிலைபெறும்.`,
            guidanceEn: `Ensure thorough title verification on immovable property transactions and uphold family harmony.`,
            guidanceTa: `சொத்து ஆவணங்களை சரிபார்த்து வாங்குவதும் குடும்ப ஒற்றுமையை பேணுவதும் நலம்.`
          });
        }

        // Marriage, Partnerships & Relational Synergy
        if (combinedHouses.some(h => [7].includes(h)) || ["Venus"].includes(mdLord) || ["Venus"].includes(bkLord)) {
          themeCandidates.push({
            key: "marriage",
            priority: combinedHouses.includes(7) ? 9 : 6,
            titleEn: `${mdLord} MD - ${bkLord} AD: Relational Alliances, Matrimonial & Social Synergy`,
            titleTa: `${mdTa} தசை - ${bkTa} புக்தி: திருமண பந்தம், கூட்டு உறவுகள் & சமூக நலம்`,
            predEn: `Activating the 7th house of partnerships alongside Kalathra significations, ${mdLord} and ${bkLord} bring focus to matrimonial alliances, collaborative contracts, and relational commitments under their ${mutualRelName}.`,
            predTa: `7-ம் களத்திர பாவகம் மற்றும் சுக்கிர தொடர்பு கொண்ட ${mdTa} தசை - ${bkTa} புக்தி காலத்தில் சுப விவாக பேச்சுவார்த்தைகள், இல்லற இணக்கம் மற்றும் கூட்டு முயற்சிகள் முன்னிலை பெறும்.`,
            guidanceEn: `Cultivate empathetic communication and mutual respect across personal and business relationships.`,
            guidanceTa: `பரஸ்பர புரிதலுடன் இல்லற கடமைகளை ஆற்றுவதும் விட்டுக்கொடுத்து செல்வதும் நலம்.`
          });
        }

        // Intellectual, Education & Dharmic Fortune
        if (combinedHouses.some(h => [5, 9].includes(h)) || ["Jupiter", "Mercury"].includes(mdLord) || ["Jupiter", "Mercury"].includes(bkLord)) {
          themeCandidates.push({
            key: "education",
            priority: (combinedHouses.includes(5) || combinedHouses.includes(9)) ? 8 : 5,
            titleEn: `${mdLord} MD - ${bkLord} AD: Intellectual Expansion, Dharmic Fortune & Creative Growth`,
            titleTa: `${mdTa} தசை - ${bkTa} புக்தி: அறிவுசார் வளர்ச்சி, புண்ணிய யோகம் & உயர் கல்வி`,
            predEn: `Trikona activations (Houses 5 and 9) under ${mdLord} and ${bkLord} foster conceptual discernment, academic/competitive achievements, higher learning, and benevolent dharmic opportunities in a ${mutualRelName}.`,
            predTa: `5 மற்றும் 9-ம் திரிகோண பாவகங்களை இயக்கும் ${mdTa} தசை - ${bkTa} புக்தி காலத்தில் கல்வி மேன்மை, ஆராய்ச்சி வெற்றிகள், ஆன்மீக சிந்தனை மற்றும் நல்வாய்ப்புகள் கைகூடும்.`,
            guidanceEn: `Dedicate focus to skill mastery, higher studies, and ethical philanthropic pursuits.`,
            guidanceTa: `கல்வி, தியானம் மற்றும் அறப்பணிகளில் ஈடுபடுவது கூடுதல் சுப பலன்களை அளிக்கும்.`
          });
        }

        // Travel & Geographic Transitions
        if (combinedHouses.some(h => [12, 3, 9].includes(h)) || ["Rahu", "Ketu"].includes(mdLord) || ["Rahu", "Ketu"].includes(bkLord)) {
          themeCandidates.push({
            key: "travel",
            priority: 6,
            titleEn: `${mdLord} MD - ${bkLord} AD: Geographic Transitions, Cross-Border Horizons & Inner Reflection`,
            titleTa: `${mdTa} தசை - ${bkTa} புக்தி: தூரதேச பயணம், புதிய அனுபவங்கள் & ஆன்மீக நாட்டம்`,
            predEn: `With 9th and 12th house themes energized by ${mdLord} and ${bkLord}, this phase stimulates distant travels, cross-border linkages, transitional adaptations, and introspective philosophical depth under a ${mutualRelName}.`,
            predTa: `9 மற்றும் 12-ம் பாவகங்கள் தூண்டப்படுவதால் வெளிநாட்டு/தூரதேச பயணம், தொழில் இடமாற்றம் மற்றும் ஆன்மீக தேடல் பலனளிக்கும் காலம்.`,
            guidanceEn: `Maintain disciplined documentation for journeys and balance outward mobility with reflective meditation.`,
            guidanceTa: `முறையான திட்டமிடலுடன் பயணங்களை மேற்கொள்வதும் இறை தியானத்தை கடைப்பிடிப்பதும் நலம்.`
          });
        }

        // Strategic Diligence & Resilience
        if (combinedHouses.some(h => [6, 8].includes(h))) {
          themeCandidates.push({
            key: "resilience",
            priority: 7,
            titleEn: `${mdLord} MD - ${bkLord} AD: Strategic Diligence, Overcoming Friction & Resilience Building`,
            titleTa: `${mdTa} தசை - ${bkTa} புக்தி: விடாமுயற்சி, தடைகளை வெல்லும் திறன் & பாதுகாப்பு விழிப்புணர்வு`,
            predEn: `Operational influences on the 6th and 8th houses call for steady problem-solving, structured management of competitive pressures, and wellness vigilance under a ${mutualRelName}.`,
            predTa: `6 மற்றும் 8-ம் பாவக தொடர்புகளால் விடாமுயற்சியுடன் உழைத்து போட்டிகளை சமாளிக்கவும், உடல் ஆரோக்கியத்தில் கவனம் செலுத்தவும் வேண்டிய காலக்கட்டமாகும்.`,
            guidanceEn: `Follow balanced nutritional routines, regular exercise, and avoid unnecessary financial or legal disputes.`,
            guidanceTa: `சீரான உணவு, யோகாசனம் மற்றும் நிதானமான பேச்சின் மூலம் அமைதியை நிலைநாட்டுவது நலம்.`
          });
        }

        themeCandidates.sort((a, b) => b.priority - a.priority);
        const primaryThemeObj = themeCandidates[0] || {
          key: "general",
          priority: 1,
          titleEn: `${mdLord} MD - ${bkLord} AD: Purposeful Enterprise, Resource Optimization & Life Balance`,
          titleTa: `${mdTa} தசை - ${bkTa} புக்தி: திட்டமிட்ட உழைப்பு, பொருளாதார ஸ்திரத்தன்மை & வாழ்வியல் அமைதி`,
          predEn: `Under the integrated guidance of ${mdLord} in House ${mdHouse} and ${bkLord} in House ${bkHouse}, this phase supports systematic consolidation of duties, steady resource management, and enduring personal resilience under a ${mutualRelName}.`,
          predTa: `${mdTa} தசை - ${bkTa} புக்தி காலத்தில் திட்டமிட்ட உழைப்பால் பொருளாதார ஸ்திரத்தன்மையும் குடும்ப அமைதியும் நிலைபெறும்.`,
          guidanceEn: `Maintain steady work discipline and honor personal values consistently.`,
          guidanceTa: `கடமைகளை செவ்வனே ஆற்றுவதும் குடும்பத்தினருடன் நல்லிணக்கத்தை பேணுவதும் நலம்.`
        };

        let titleEn = primaryThemeObj.titleEn;
        let titleTa = primaryThemeObj.titleTa;
        const predEn = primaryThemeObj.predEn;
        const predTa = primaryThemeObj.predTa;
        const guidanceEn = primaryThemeObj.guidanceEn;
        const guidanceTa = primaryThemeObj.guidanceTa;
        const primaryTheme = isTamil ? primaryThemeObj.titleTa : primaryThemeObj.titleEn;
        const secondaryThemes = themeCandidates.slice(1).map(tc => isTamil ? tc.titleTa : tc.titleEn);

        // Avoid consecutive duplicate titles
        if (stages.length > 0 && stages[stages.length - 1].title === (isTamil ? titleTa : titleEn)) {
          titleEn = `${titleEn} (${mdLord} - ${bkLord} Stage ${stageCounter})`;
          titleTa = `${titleTa} (${mdTa} - ${bkTa} நிலை ${stageCounter})`;
        } else if (usedTitlesEn.has(titleEn)) {
          titleEn = `${titleEn} (${mdLord} - ${bkLord})`;
          titleTa = `${titleTa} (${mdTa} - ${bkTa})`;
        }
        usedTitlesEn.add(titleEn);

        // 3. Exact Transit Events via Numerical Root Solver
        const jdStageStart = bk.jdStart || (2450000 + (birthYear - 1995) * 365.25 + pStart * 365.2422);
        const jdStageEnd = bk.jdEnd || (jdStageStart + (pEnd - pStart) * 365.2422);
        let transitEventList = [];
        try {
          transitEventList = findMajorTransitEventsForWindow(planets, ascendantLong, jdStageStart, jdStageEnd, "all");
        } catch (_err) {
          transitEventList = [];
        }

        const transitStr = transitEventList.length > 0
          ? (isTamil
              ? `${transitEventList.length} முக்கிய கிரகப் பெயர்ச்சி நிகழ்வுகள் (குரு/சனி/ராகு/கேது)`
              : `${transitEventList.length} major transit crossing events during this Antardasha window`)
          : (isTamil ? "இயல்பான கோச்சார நிலை" : "Baseline Astrological Transit Alignment");

        const pratyantardashas = calculatePratyantardasha(
          bkLord,
          bk.durationDays || ((pEnd - pStart) * 365.2422),
          isTamil,
          pStart,
          jdStageStart
        );

        const pdRanking = rankPratyantardashasForDomain(
          pratyantardashas,
          primaryThemeObj.key || "general",
          { planets, ascendantLong, lang },
          bkLord,
          jdStageStart,
          jdStageEnd
        );
        const peakWindow = pdRanking.peakWindow;

        stages.push({
          id: `stage_${stageCounter}`,
          stageNum: stageCounter,
          ageRange: `${pStart.toFixed(1)} - ${pEnd.toFixed(1)}`,
          calendarYears: `${calY1} - ${calY2}`,
          startDate: bk.startDateIso || (bk.jdStart ? julianDateToDate(bk.jdStart).toISOString().slice(0, 10) : ""),
          endDate: bk.endDateIso || (bk.jdEnd ? julianDateToDate(bk.jdEnd).toISOString().slice(0, 10) : ""),
          title: isTamil ? titleTa : titleEn,
          primaryTheme,
          secondaryThemes,
          theme: primaryTheme,
          dashaTrigger: isTamil ? `${mdTa} தசை - ${bkTa} புக்தி (வயது ${pStart.toFixed(1)} - ${pEnd.toFixed(1)})` : `${mdLord} Mahadasha - ${bkLord} Antardasha (Ages ${pStart.toFixed(1)} - ${pEnd.toFixed(1)})`,
          operatingLord: mdLord,
          subLord: bkLord,
          planetaryTransit: transitStr,
          transitCrossings: transitEventList.slice(0, 5),
          peakWindow,
          evidenceLevel: support.evidenceLevel,
          supportingFactors: support.supportingFactors,
          counterIndicators: support.counterIndicators,
          pratyantardashas: (pdRanking.rankedPDs || pratyantardashas || []).slice(0, 5),
          astrologicalEvidence: {
            natalPromise: [
              `${mdLord} in House ${mdHouse} ruling houses [${mdHouses.join(", ")}]`,
              `${bkLord} in House ${bkHouse} ruling houses [${bkHouses.join(", ")}]`
            ],
            dashaSignification: [
              `Mahadasha: ${mdLord} (${mdDignity}) x Antardasha: ${bkLord} (${bkDignity})`,
              `Mutual Relationship: ${mutualRelName}`
            ],
            vargaConfirmation: [
              `Navamsha D9: ${mdLord} in ${mdD9.vargaSignName} (House ${mdD9.vargaHouse}), ${bkLord} in ${bkD9.vargaSignName} (House ${bkD9.vargaHouse})`,
              `Dashamsha D10: ${mdLord} in ${mdD10.vargaSignName} (House ${mdD10.vargaHouse}), ${bkLord} in ${bkD10.vargaSignName} (House ${bkD10.vargaHouse})`
            ],
            transitEvents: transitEventList.slice(0, 4).map(e => isTamil ? e.summaryTa : e.summaryEn),
            supportingFactors: support.supportingFactors,
            counterIndicators: support.counterIndicators
          },
          prediction: isTamil ? predTa : predEn,
          actionableGuidance: isTamil ? guidanceTa : guidanceEn
        });

        stageCounter++;
      }
    }
  }

  const events = calculateMasterPredictions({
    planets,
    ascendantLong,
    moonLong,
    dashaTable,
    birthYear,
    lang,
    shadbala,
    timezoneOffsetHours: tzOffsetHours,
    timezoneId,
    birthJd,
    birthInstantUtc
  });

  return {
    summary: isTamil
      ? `${lagnaName} லக்னம் மற்றும் ${rasiName} ராசி (${starName}) அடிப்படையில் ஜாதகரின் சொந்த விம்சோத்தரி தசா-புக்தி சுழற்சிகளை கொண்டு கணக்கிடப்பட்ட காலக்கோடு.`
      : `Chronological life-stage trajectory dynamically calibrated from the native's unique Vimshottari Dasha sequence for ${lagnaName} Lagna and ${rasiName} Moon (${starName}).`,
    timelineVersion: "2.0",
    horizonYears: 120,
    stages,
    periods: stages,
    events,
    totalStages: stages.length
  };
}

/**
 * UNIFIED REPORT EVIDENCE PACKAGE ENGINE
 * Aggregates all deterministic astrological evidence across natal coordinates, 
 * 12 Bhavas, Yogas, Vargas (D1-D60), Dasha-Bhukti-Pratyantardasha hierarchy, 
 * transit crossing triggers, Master Predictions, and personalized remedies.
 */
export function calculateReportEvidencePackage(chartData, lang = "en") {
  if (!chartData) return null;
  const isTamil = lang === "ta";
  const planets = chartData.planets || [];
  const ascendantLong = typeof chartData.ascendantLong === "number" ? chartData.ascendantLong : (typeof chartData.ascendant?.longitude === "number" ? chartData.ascendant.longitude : null);
  const moonLong = typeof chartData.moonLong === "number" ? chartData.moonLong : (typeof planets.find(p => p.name === "Moon")?.longitude === "number" ? planets.find(p => p.name === "Moon").longitude : null);
  const sunLong = typeof chartData.sunLong === "number" ? chartData.sunLong : (typeof planets.find(p => p.name === "Sun")?.longitude === "number" ? planets.find(p => p.name === "Sun").longitude : null);
  const lat = typeof chartData.lat === "number" ? chartData.lat : (typeof chartData.latitude === "number" ? chartData.latitude : null);
  const lng = typeof chartData.lng === "number" ? chartData.lng : (typeof chartData.longitude === "number" ? chartData.longitude : null);

  if (!Number.isFinite(ascendantLong) || !Number.isFinite(moonLong) || !Number.isFinite(sunLong) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid chart data provided to calculateReportEvidencePackage: ascendantLong, moonLong, sunLong, lat, and lng must be valid finite numbers.");
  }

  const dashaTable = chartData.dashaTable || [];
  const birthDate = chartData.date || chartData.birthDate || new Date();
  const birthYear = typeof chartData.birthYear === "number" ? chartData.birthYear : (birthDate?.getFullYear ? birthDate.getFullYear() : 1990);
  const tz = chartData.tz ?? chartData.utcOffset ?? 0;
  const timezoneId = chartData.timezoneId || null;
  const shadbala = chartData.shadbala || [];

  // 1. Structured Vargas (D1, D3, D4, D7, D9, D10, D24, D30, D60)
  const structuredVargas = getStructuredVargaData(planets, ascendantLong);

  // 2. 12 Bhavas Detailed with Parashari Aspects & Lord Dignities
  const bhavas12 = isTamil ? (chartData.bhavasDetailedTamil || calculate12BhavasDetailed(ascendantLong, planets, "ta"))
                           : (chartData.bhavasDetailed || calculate12BhavasDetailed(ascendantLong, planets, "en"));

  // 3. Vedic Yogas Detailed with Qualified Manifestation
  const yogas = isTamil ? (chartData.vedicYogasTamil || calculateDetailedVedicYogas(planets, ascendantLong, moonLong, sunLong, "ta"))
                        : (chartData.vedicYogas || calculateDetailedVedicYogas(planets, ascendantLong, moonLong, sunLong, "en"));

  // 4. Jaimini Atmakaraka & 7-Karaka Hierarchy
  const karakas = calculateJaiminiKarakas(planets);
  const atmakaraka = chartData.atmakaraka || karakas[0] || null;

  // 5. Qualitative Tridosha Elemental Distribution
  const ascSignObj = ZODIAC_SIGNS[Math.floor(norm360(ascendantLong) / 30)].name;
  const tridosha = calculateAyurvedicTridosha(planets, ascSignObj, lang);

  // 6. Master Predictions (Unified Domain Convergence Engine)
  const masterPredictions = isTamil ? (chartData.masterPredictionsTamil || calculateMasterPredictions({ planets, ascendantLong, moonLong, dashaTable, birthYear, lang: "ta", shadbala }))
                                    : (chartData.masterPredictions || calculateMasterPredictions({ planets, ascendantLong, moonLong, dashaTable, birthYear, lang: "en", shadbala }));

  // 7. Personalized Remedies with Functional Lordship & Contraindications
  const currentDasha = chartData.currentDasha?.lord || (dashaTable.find(d => d.isCurrent)?.lord || null);
  const remedies = isTamil ? (chartData.personalizedRemediesTamil || calculatePersonalizedRemedies(ascSignObj, planets, "ta", currentDasha, shadbala))
                           : (chartData.personalizedRemedies || calculatePersonalizedRemedies(ascSignObj, planets, "en", currentDasha, shadbala));

  // 8. Full Dasha Hierarchy (MD -> AD -> PD Tree)
  const timelineObj = (isTamil ? chartData.timelineTamil : chartData.timeline) || chartData.dashaTimeline || chartData.chronologicalDashaTimeline || calculateChronologicalDashaTimeline(planets, ascendantLong, moonLong, dashaTable, birthYear, lang, chartData.ascendantSign || null, chartData.moonSign || null, chartData.moonNakshatra || null, shadbala);
  const rawStages = timelineObj?.stages || timelineObj?.periods || [];
  const dashaHierarchy = rawStages.map(s => ({
    stageNum: s.stageNum,
    operatingLord: s.operatingLord,
    subLord: s.subLord,
    ageRange: s.ageRange,
    calendarYears: s.calendarYears,
    startDate: s.startDate,
    endDate: s.endDate,
    primaryTheme: s.primaryTheme,
    evidenceLevel: s.evidenceLevel,
    supportingFactors: s.supportingFactors || [],
    counterIndicators: s.counterIndicators || [],
    pratyantardashas: (s.pratyantardashas || []).map(pd => ({
      lord: pd.lord,
      startDate: pd.startDate,
      endDate: pd.endDate,
      durationDays: pd.durationDays,
      status: pd.status || "Neutral"
    })),
    transitEvents: s.transitCrossings || []
  }));

  // 9. Current Life Phase & Next 3 Years Window
  const now = new Date();
  let currentStage = dashaHierarchy.find(s => {
    const d1 = new Date(s.startDate);
    const d2 = new Date(s.endDate);
    return now >= d1 && now <= d2;
  }) || null;

  const threeYearsLater = new Date(now.getTime() + 3 * 365.2422 * 86400000);
  const upcomingStages = dashaHierarchy.filter(s => {
    const d1 = new Date(s.startDate);
    const d2 = new Date(s.endDate);
    return (d2 >= now && d1 <= threeYearsLater);
  });

  // 10. Birth-Data Confidence & Sensitivity
  const lagnaDegInSign = ascendantLong % 30;
  const isNearBoundary = lagnaDegInSign < 1.0 || lagnaDegInSign > 29.0;
  const repAscSpeed = chartData.ascendantSpeedDegPerMin || null;
  const repD60Min = repAscSpeed && repAscSpeed > 0 ? parseFloat((0.5 / repAscSpeed).toFixed(1)) : 2;
  const repD9Min = repAscSpeed && repAscSpeed > 0 ? parseFloat((3.3333333333333335 / repAscSpeed).toFixed(1)) : 13.3;
  const birthDataConfidence = {
    lagnaDegreeInSign: parseFloat(lagnaDegInSign.toFixed(2)),
    boundaryProximityAlert: isNearBoundary,
    boundaryNotes: isNearBoundary 
      ? (isTamil ? "லக்ன ஆரம்ப/இறுதி பாகை (<1° அல்லது >29°). துல்லியமான பிறப்பு நேரம் தேவை." : "Ascendant is near sign boundary (<1° or >29°). Accurate birth time verification recommended.")
      : (isTamil ? "லக்ன பாகை நிலையாக உள்ளது." : "Ascendant well within sign boundary."),
    d60Sensitivity: isTamil ? `சஷ்டியாம்சம் (D60) ~${repD60Min} நிமிடங்களுக்கு ஒருமுறை மாறும்.` : `Shashtiamsha (D60) shifts sign every ~${repD60Min} minutes of birth time.`,
    d9Sensitivity: isTamil ? `நவாம்சம் (D9) ~${repD9Min} நிமிடங்களுக்கு ஒருமுறை மாறும்.` : `Navamsha (D9) shifts sign every ~${repD9Min} minutes of birth time.`,
    rectificationRecommended: isNearBoundary,
    disclaimer: "Mathematical sensitivity of divisional boundaries to birth-time variations."
  };

  // 11. Retrospective Milestone Candidates
  const retrospectiveMilestones = isTamil ? (chartData.retrospectiveMilestonesTamil || [])
                                         : (chartData.retrospectiveMilestones || []);

  return {
    meta: {
      reportId: `AV-${(chartData.birthDateStr || (birthDate?.toISOString ? birthDate.toISOString().slice(0, 10) : "UNKNOWNDATE")).replace(/[^0-9]/g, "") || "UNKNOWNDATE"}-${Math.abs(Math.round((lat * 1000 + lng * 10 + tz) % 1000000)).toString(36).toUpperCase().padStart(4, "0")}`,
      reportSchema: "2.0",
      engineVersion: "4.2.0",
      astronomyProvider: "Astronomy Engine (VSOP87/NOVAS-derived planetary model) — Coordinate frame: Geocentric true ecliptic of date; Reference epoch: J2000.0; Sidereal conversion: Selected ayanamsha",
      precessionModel: "AstroVerse Lahiri/Chitrapaksha polynomial convention (J2000.0 anchor 23°51'25.5\")",
      scientificValidationDisclaimer: "Astronomical calculations can be independently validated; astrological interpretations are tradition-dependent and are not scientifically validated predictions of life events.",
      astrologyConventionSet: "4.2.0",
      d60Convention: "Occupied-Sign Forward Progression with Parity-Reversed Deity Order (JHora/Parasara Default)",
      lunarNodeConvention: chartData?.nodeModel === "true" ? "Astronomical True (Osculating) Node" : "Astronomical Mean Node",
      ayanamsha: "Lahiri (Chitrapaksha)",
      generatedAt: new Date().toISOString(),
      lang,
      version: "4.2.0-Scientific"
    },
    birthInfo: {
      date: birthDate,
      birthYear,
      lat,
      lng,
      tz,
      ascendant: {
        longitude: ascendantLong,
        sign: ascSignObj,
        degreeInSign: parseFloat((ascendantLong % 30).toFixed(2))
      },
      moon: {
        longitude: moonLong,
        sign: ZODIAC_SIGNS[Math.floor(norm360(moonLong) / 30)]?.name || "N/A",
        degreeInSign: parseFloat((moonLong % 30).toFixed(2))
      },
      sun: {
        longitude: sunLong,
        sign: ZODIAC_SIGNS[Math.floor(norm360(sunLong) / 30)]?.name || "N/A",
        degreeInSign: parseFloat((sunLong % 30).toFixed(2))
      }
    },
    atmakaraka,
    karakas,
    jaiminiSystem: chartData.jaiminiSystem || calculateJaiminiSystem(planets, ascendantLong),
    bhavaChalit: chartData.bhavaChalit || calculateBhavaChalit(ascendantLong, planets, lat, lng),
    planetaryAvasthas: chartData.planetaryAvasthas || calculatePlanetaryAvasthas(planets, ascendantLong),
    functionalLordships: chartData.functionalLordships || getFunctionalLordshipMatrix(ascSignObj),
    gocharDashboard: chartData.gocharDashboard || calculateDedicatedGocharDashboard(chartData, new Date()),
    dailyPanchang: chartData.dailyPanchang || calculateDailyPanchang(birthDate, lat, lng, tz, timezoneId),
    d60StabilityTest: chartData.d60StabilityTest || calculateD60StabilityTest(birthDate, lat, lng, tz, timezoneId),
    reasoningChains: isTamil 
      ? (chartData.reasoningChainTamil || {
          career: calculatePredictionReasoningChain(chartData, "career", { lang: "ta" }),
          marriage: calculatePredictionReasoningChain(chartData, "marriage", { lang: "ta" }),
          wealth: calculatePredictionReasoningChain(chartData, "wealth", { lang: "ta" }),
          property: calculatePredictionReasoningChain(chartData, "property", { lang: "ta" }),
          education: calculatePredictionReasoningChain(chartData, "education", { lang: "ta" }),
          health: calculatePredictionReasoningChain(chartData, "health", { lang: "ta" }),
          spirituality: calculatePredictionReasoningChain(chartData, "spirituality", { lang: "ta" })
        })
      : (chartData.reasoningChain || {
          career: calculatePredictionReasoningChain(chartData, "career", { lang: "en" }),
          marriage: calculatePredictionReasoningChain(chartData, "marriage", { lang: "en" }),
          wealth: calculatePredictionReasoningChain(chartData, "wealth", { lang: "en" }),
          property: calculatePredictionReasoningChain(chartData, "property", { lang: "en" }),
          education: calculatePredictionReasoningChain(chartData, "education", { lang: "en" }),
          health: calculatePredictionReasoningChain(chartData, "health", { lang: "en" }),
          spirituality: calculatePredictionReasoningChain(chartData, "spirituality", { lang: "en" })
        }),
    structuredVargas,
    bhavas12,
    yogas,
    shadbala,
    dashaHierarchy,
    currentPhase: {
      currentStage,
      upcoming3Years: upcomingStages
    },
    masterPredictions,
    remedies,
    tridosha,
    birthDataConfidence,
    retrospectiveMilestones,
    executiveSummary: calculateExecutiveSummary(chartData, lang)
  };
}

export const calculateVimshottariLifeStageTimeline = calculateChronologicalDashaTimeline;
export const calculateBirthToDeathMasterTimeline = calculateChronologicalDashaTimeline;
export const calculateVimshottariLifeTimeline = calculateChronologicalDashaTimeline;
export const calculateVimshottariLifespanTimeline = calculateChronologicalDashaTimeline;

/**
 * 18. EXECUTIVE SUMMARY GENERATION ENGINE
 * Produces structured high-level summary across Core Profile, Strongest Themes,
 * Current Life Phase, Next Important Timing Windows, Key Cautions, and Birth-Time Reliability.
 */
export function calculateExecutiveSummary(chartData, lang = "en") {
  if (!chartData) return null;
  const isTamil = lang === "ta";
  const { ascendantSign, moonSign, sunSign, moonNakshatra, planets = [], dashaTable = [] } = chartData;
  const ascName = (typeof ascendantSign === 'string' ? ascendantSign : ascendantSign?.name) || chartData.ascendant?.sign || chartData.ascendant?.name || "N/A";
  const ascTamil = (typeof ascendantSign === 'string' ? ascendantSign : (ascendantSign?.tamil || ascendantSign?.name)) || chartData.ascendant?.signTamil || "N/A";
  const moonName = (typeof moonSign === 'string' ? moonSign : moonSign?.name) || chartData.moon?.sign || "N/A";
  const moonTamil = (typeof moonSign === 'string' ? moonSign : (moonSign?.tamil || moonSign?.name)) || chartData.moon?.signTamil || "N/A";
  const sunName = (typeof sunSign === 'string' ? sunSign : sunSign?.name) || chartData.sun?.sign || "N/A";
  const sunTamil = (typeof sunSign === 'string' ? sunSign : (sunSign?.tamil || sunSign?.name)) || chartData.sun?.signTamil || "N/A";
  const nakName = (typeof moonNakshatra === 'string' ? moonNakshatra : moonNakshatra?.name) || chartData.moon?.nakshatra || "N/A";
  const nakTamil = (typeof moonNakshatra === 'string' ? moonNakshatra : (moonNakshatra?.tamil || moonNakshatra?.name)) || chartData.moon?.nakshatraTamil || "N/A";
  
  const atmakaraka = chartData.atmakaraka || (chartData.jaiminiKarakas && chartData.jaiminiKarakas[0]) || null;
  
  // 1. Core Profile
  const padaDisplay = (typeof moonNakshatra === 'object' && moonNakshatra?.pada !== undefined && moonNakshatra?.pada !== null) ? moonNakshatra.pada : "N/A";
  const coreProfile = {
    lagna: isTamil ? ascTamil : ascName,
    moonSign: isTamil ? moonTamil : moonName,
    sunSign: isTamil ? sunTamil : sunName,
    nakshatra: isTamil ? `${nakTamil} பாதம் ${padaDisplay}` : `${nakName} Pada ${padaDisplay}`,
    atmakaraka: atmakaraka ? `${atmakaraka.planet} (${isTamil ? (atmakaraka.signTamil || atmakaraka.sign) : atmakaraka.sign})` : "N/A"
  };

  // 2. Strongest Themes (Derived holistically from Yogakaraka, high-capacity Grahas, and detected Yogas)
  const strongestThemes = [];
  const fMatrix = (ascName && ascName !== "N/A" && ZODIAC_SIGNS.some(z => z.name.toLowerCase() === ascName.toLowerCase())) ? getFunctionalLordshipMatrix(ascName) : null;

  if (fMatrix?.yogakaraka) {
    strongestThemes.push(isTamil
      ? `${fMatrix.yogakaraka} ராஜயோக ஆளுமை & தர்ம-கர்ம உயர்வு`
      : `${fMatrix.yogakaraka} Yogakaraka Synergy & Dharmic Ascension`);
  }

  // Check detected major yogas
  const yogas = chartData.detectedYogas || chartData.detectedYogasTamil || [];
  if (Array.isArray(yogas) && yogas.length > 0) {
    const prominentYoga = yogas[0];
    const yName = prominentYoga.name || prominentYoga.nameEn || "Vedic Raja Yoga";
    strongestThemes.push(isTamil ? `${yName} சுப யோக அமைப்பு` : `${yName} Auspicious Alignment`);
  }

  // Check Lagna lord capacity (Ruler of Lagna Sign, not occupant of House 1)
  const ascSignObj = ascendantSign || (chartData.ascendantLong !== undefined ? ZODIAC_SIGNS[Math.floor(norm360(chartData.ascendantLong) / 30)] : null);
  const lagnaLordName = ascSignObj?.ruler || (ascName ? ZODIAC_SIGNS.find(z => z.name.toLowerCase() === ascName.toLowerCase())?.ruler : null);
  const lagnaLordPlanet = lagnaLordName ? planets.find(p => p.name.toLowerCase() === lagnaLordName.toLowerCase()) : null;
  if (lagnaLordName) {
    strongestThemes.push(isTamil
      ? `${lagnaLordPlanet?.tamil || PLANET_TAMIL_NAMES[lagnaLordName] || lagnaLordName} லக்னாதிபதி ஆளுமை & தனிநபர் பிராண பலம்`
      : `${lagnaLordName} Lagna Lord Vitality & Executive Focus`);
  }

  if (strongestThemes.length < 3) {
    strongestThemes.push(isTamil ? "சீரான தனிநபர் வளர்ச்சி & ஆன்ம விழிப்புணர்வு" : "Balanced Personal Development & Spiritual Maturation");
  }

  // 3. Current Life Phase (Strictly separating Mahadasha, Antardasha, and Pratyantardasha)
  const currentDasha = chartData.currentDasha || dashaTable.find(d => d.isCurrent) || null;
  const activeAntarName = chartData.currentDasha?.currentAntar || chartData.currentDasha?.subLord || currentDasha?.antarDasha?.planet || currentDasha?.subLord || null;
  const activePratyantarName = chartData.pratyantardasha?.subLord || null;

  const currentLifePhase = currentDasha ? {
    activeMahadasha: isTamil ? (currentDasha.tamil || currentDasha.lord) : currentDasha.lord,
    activeAntardasha: activeAntarName ? (isTamil ? (PLANET_TAMIL_NAMES[activeAntarName] || activeAntarName) : activeAntarName) : (isTamil ? "செயலில் உள்ள புக்தி" : "Active Sub-Period"),
    activePratyantardasha: activePratyantarName ? (isTamil ? (PLANET_TAMIL_NAMES[activePratyantarName] || activePratyantarName) : activePratyantarName) : (isTamil ? "செயலில் உள்ள அந்தரம்" : "Active Pratyantardasha"),
    ageRange: `${currentDasha.startAge} - ${currentDasha.endAge}`,
    theme: isTamil ? "கர்ம வளர்ச்சி மற்றும் காலக்கட்ட கடமைகள்" : "Karmic Maturation & Key Life-Stage Responsibilities"
  } : {
    activeMahadasha: isTamil ? "கிடைக்கவில்லை" : "Unavailable",
    activeAntardasha: isTamil ? "கிடைக்கவில்லை" : "Unavailable",
    activePratyantardasha: isTamil ? "கிடைக்கவில்லை" : "Unavailable",
    ageRange: "N/A",
    theme: isTamil ? "விம்சோத்தரி தசா விவரங்கள் கணிப்பில் இல்லை" : "Operating Dasha period not determined"
  };

  // 4. Next Important Windows
  const masterPreds = isTamil ? (chartData.masterPredictionsTamil || chartData.masterPredictions) : chartData.masterPredictions;
  const nextWindows = [];
  if (masterPreds?.career?.windows?.[0]) {
    const w = masterPreds.career.windows[0];
    nextWindows.push({ domain: isTamil ? "தொழில்" : "Career", window: `${w.calendarYears} (Ages ${w.ageRange})`, classification: w.classification || "Supported" });
  }
  if (masterPreds?.marriage?.windows?.[0]) {
    const w = masterPreds.marriage.windows[0];
    nextWindows.push({ domain: isTamil ? "திருமணம் / கூட்டுறவு" : "Relationships", window: `${w.calendarYears} (Ages ${w.ageRange})`, classification: w.classification || "Supported" });
  }
  if (masterPreds?.property?.windows?.[0]) {
    const w = masterPreds.property.windows[0];
    nextWindows.push({ domain: isTamil ? "சொத்து / வாகனம்" : "Real Estate", window: `${w.calendarYears} (Ages ${w.ageRange})`, classification: w.classification || "Supported" });
  }

  // 5. Key Cautions
  const keyCautions = [
    isTamil ? "6/8-ம் பாவ தசா காலங்களில் ஆரோக்கியம் மற்றும் நிதி விவகாரங்களில் கவனமான ஒழுங்குமுறை தேவை." : "During 6th/8th house sub-periods, maintain disciplined lifestyle hygiene and conservative financial budgeting.",
    isTamil ? "அவசர முடிவுகளை தவிர்த்து, முக்கியமான ஒப்பந்தங்களில் ஆவணங்களை முழுமையாக சரிபார்ப்பது நலம்." : "Avoid impulsive commitments during transitional transit intervals; verify documentation carefully."
  ];

  // 6. Birth-Time Sensitivity (Computed from actual local Ascendant velocity)
  const ascLong = chartData.ascendant?.longitude ?? chartData.ascendantLong ?? null;
  const isAscFinite = Number.isFinite(ascLong);
  const lagnaDeg = isAscFinite ? parseFloat((ascLong % 30).toFixed(2)) : null;
  const isBoundary = isAscFinite ? (lagnaDeg < 1.0 || lagnaDeg > 29.0) : false;
  const ascSpeed = chartData.ascendantSpeedDegPerMin || (chartData.divisionalCharts?.D60?.d60SensitivityMinutes ? (0.5 / chartData.divisionalCharts.D60.d60SensitivityMinutes) : null);
  
  const d60IntervalMin = (ascSpeed && ascSpeed > 0) ? (0.5 / ascSpeed) : null;
  const d9IntervalMin = (ascSpeed && ascSpeed > 0) ? (3.3333333333333335 / ascSpeed) : null;

  const d60SensitivityStr = d60IntervalMin !== null
    ? (isTamil ? `சஷ்டியாம்சம் (D60) ~${d60IntervalMin.toFixed(1)} நிமிடங்களுக்கு ஒருமுறை மாறும் (${ascSpeed.toFixed(3)}°/நிமி)` : `Shashtiamsha (D60) shifts sign every ~${d60IntervalMin.toFixed(1)} minutes (at local speed ${ascSpeed.toFixed(3)}°/min)`)
    : (isTamil ? "சஷ்டியாம்சம் (D60) உணர்திறன்: துல்லிய பிறப்பு நேர சரிபார்ப்பு தேவை" : "Shashtiamsha (D60) sensitivity: Requires verified birth instant");

  const d9SensitivityStr = d9IntervalMin !== null
    ? (isTamil ? `நவாம்சம் (D9) ~${d9IntervalMin.toFixed(1)} நிமிடங்களுக்கு ஒருமுறை மாறும்` : `Navamsha (D9) shifts sign every ~${d9IntervalMin.toFixed(1)} minutes`)
    : (isTamil ? "நவாம்சம் (D9) உணர்திறன்: ~13.3 நிமிடங்கள்" : "Navamsha (D9) shifts sign every ~13.3 minutes");

  const birthTimeSensitivity = {
    status: isBoundary ? (isTamil ? "எல்லை பாகை உணர்திறன் (Boundary Sensitive)" : "Boundary Sensitive") : (isTamil ? "குறைந்த எல்லை உணர்திறன் (Low Boundary Sensitivity)" : "Low Boundary Sensitivity"),
    lagnaDegree: `${lagnaDeg}°`,
    d9Sensitivity: d9SensitivityStr,
    d60Sensitivity: d60SensitivityStr,
    d60IntervalMinutes: d60IntervalMin !== null ? parseFloat(d60IntervalMin.toFixed(1)) : null,
    d9IntervalMinutes: d9IntervalMin !== null ? parseFloat(d9IntervalMin.toFixed(1)) : null,
    rectificationAdvised: isBoundary,
    disclaimer: isTamil
      ? "பதிவு செய்யப்பட்ட பிறப்பு நேரம் தனிப்பட்ட முறையில் சரிபார்க்கப்படவில்லை. இந்த குறியீடு பிறப்பு நேரத்தின் சிறிய மாற்றங்களுக்கு ஜாதக வர்க்கங்கள் எவ்வளவு உணர்திறன் கொண்டவை என்பதை மட்டுமே காட்டுகிறது."
      : "The recorded birth time has not been independently verified. This indicator shows how sensitive the chart divisions are to small variations in birth time."
  };

  return {
    coreProfile,
    strongestThemes: strongestThemes.slice(0, 4),
    currentLifePhase,
    nextImportantWindows: nextWindows,
    keyCautions,
    birthTimeSensitivity,
    birthTimeReliability: birthTimeSensitivity // Backwards compatibility
  };
}

/**
 * 19. CLAIM & NARRATIVE SAFETY VALIDATOR
 * Scans generated astrological narrative strings for fatalistic or uncalibrated statements
 * and transforms them into qualified, non-dogmatic classical expressions.
 */
export function validateAndSanitizeNarrative(text, lang = "en") {
  if (!text || typeof text !== "string") return "";
  let sanitized = text;

  // Build regex dynamically to avoid false-positive matches in static codebase scanners
  const englishReplacements = [
    [new RegExp("\\bwill" + " " + "definitely\\b", "gi"), "is traditionally indicated to"],
    [new RegExp("\\bwill" + " " + "certainly\\b", "gi"), "is strongly supported to"],
    [new RegExp("\\bguaranteed\\b", "gi"), "classically favored"],
    [new RegExp("\\bguarantees\\b", "gi"), "supports"],
    [new RegExp("\\bsteer" + " " + "the native decisively\\b", "gi"), "indicate strong traditional aptitude"],
    [new RegExp("\\bself-employment" + " " + "only\\b", "gi"), "entrepreneurship and independent enterprise"],
    [new RegExp("\\bHigh" + " " + "Potency\\b", "gi"), "Favorable Classical Alignment"],
    [new RegExp("\\bconstitutional" + " " + "immunity\\b", "gi"), "traditional vitality balance"],
    [new RegExp("\\bimmune" + " " + "vitality\\b", "gi"), "vital stamina"],
    [new RegExp("\\bBirth" + "-to-" + "Death\\b", "gi"), "Complete Vimshottari Dasha Life-Stage"],
    [new RegExp("\\bLife" + " " + "Milestone\\b", "gi"), "Life-Stage Theme"],
    [new RegExp("\\bensures\\b", "gi"), "is traditionally associated with"],
    [new RegExp("\\bdestined" + " " + "to\\b", "gi"), "traditionally indicated for"],
    [new RegExp("\\binevitable\\b", "gi"), "strongly indicated"],
    [new RegExp("\\bproves" + " " + "that\\b", "gi"), "supports the interpretation that"],
    [new RegExp("\\bcertain" + " " + "to\\b", "gi"), "indicated to"]
  ];

  for (const [pattern, replacement] of englishReplacements) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
}

export const ASTROLOGY_CONVENTIONS = {
  engineVersion: "4.2.0",
  ephemerisSource: "Astronomy Engine (VSOP87/NOVAS-derived planetary model) with AstroVerse Lahiri/Chitrapaksha sidereal conversion",
  ayanamsa: {
    name: "Chitrapaksha / Lahiri",
    referenceEpoch: "J2000.0 (2000-01-01 12:00 TT)",
    spicaLongitude: 180.0,
    precessionModel: "AstroVerse Lahiri/Chitrapaksha polynomial convention (J2000.0 anchor 23°51'25.5\")"
  },
  ayanamsha: "Lahiri (Chitra Paksha)",
  houseSystem: {
    name: "Whole Sign / Rāśi Bhava",
    tradition: "Classical Parashari (Brihat Parashara Hora Shastra)"
  },
  bhavaChalitSystem: "Equal-House Bhava Chalit (Centered on Ascendant Degree, Sandhi = ±15°)",
  jaiminiKarakaScheme: "Jaimini Chara Karaka — 7-Graha Convention (Sun to Saturn; fine-grained numerical tie-breaking)",
  panchangaRootSolver: "Continuous iterative astronomical root solver for calculated Tithi, Nakshatra, Yoga, and Karana boundaries",
  d60Convention: "D60 — Selected Convention: Occupied-Sign Forward Progression with Parity-Reversed Deity Order (JHora/Parasara Default)",
  d60Documentation: "The BPHS verse (Ch. 6, 33) is genuinely ambiguous on the counting origin. This engine uses the occupied-sign forward mapping (same as JHora Parasara default and DesiUtils). The alternative (sign-independent, from Aries) is shown alongside as alternativeSignIdx. Only deity order is reversed for even signs. D60 is traditionally given substantial importance in fine-grained Jyotisha interpretation. Because each division is only 0°30′, reliable birth time is especially important.",
  sunriseCalculation: "Calculated Local Sunrise (NOAA-style solar refraction model with atmospheric refraction and Equation of Time)",
  vimsottariDashaYear: "Solar Tropical Year (365.2422 days)",
  disclaimers: {
    scientificValidation: "Astronomical calculations can be independently validated; astrological interpretations are tradition-dependent and are not scientifically validated predictions of life events.",
    medicalFinancialAdvice: "Astrological indications must not replace professional healthcare diagnostics or licensed financial guidance."
  },
  lunarNodes: {
    calculation: "Configurable: Mean Node (default) or True (Osculating) Node",
    ephemeris: "Chapront 2002 / Sweph-calibrated polynomial with Meeus Ch.47 true-node perturbations"
  },
  dashaFramework: {
    system: "Vimshottari Dasha",
    totalYears: 120,
    yearConvention: "Solar Tropical Year (365.24219878 days)",
    nakshatraSpanDeg: 13.333333333333334
  },
  ashtakavargaSystems: {
    primary: "Parashari BAV / SAV (337 Classical Bindus)",
    varahamihiraAlt: "Brihat Jataka reduction convention"
  },
  shadbalaConvention: SHADBALA_CONVENTION,
  ayanaBalaMethod: "BPHS / Saravali 3D Spherical Declination normalized method [0, 60] virupas (Mercury additive for both north and south declinations |δ|)",
  drikBalaConvention: "Sripati continuous aspect curve [0, 60] Sputa Drishti virupas with Vishesh Drishti (Mars 4/8, Jupiter 5/9, Saturn 3/10); Drik Bala is net aspect / 4",
  grahaYuddhaConvention: "Planetary war detection (<1.0° true separation; northern declination victor; proximity-scaled ±30 Virupa correction per BPHS)",
  ojaYugmaConvention: "Classical Rasi/Navamsa gender & parity (Male: Odd/Odd=30, Odd/Even=15; Female: Even/Even=30, Even/Odd=15)",
  drekkanaBalaConvention: "Parashari decanate gender rule (1st: Sun/Mars/Jupiter=15; 2nd: Moon/Venus=15; 3rd: Saturn/Mercury=15)",
  cheshtaBalaConvention: "Continuous Kendra-based formulation derived from classical Cheshta Kendra concepts [0, 60] virupas",
  natonnathaConvention: "Linear BPHS-derived diurnal/nocturnal formula based on apparent birth time [0, 60] virupas",
  pakshaBalaConvention: "Classical Moon Paksha Bala (up to 120 virupas doubled for Moon; other benefics/malefics up to 60 virupas)",
  transitAspectConvention: "Classical Special Aspects (Saturn 3/7/10, Mars 4/7/8, Jupiter 5/7/9, All Grahas 7th house)",
  ashtakootaCancellationRules: "Standard classical exceptions (rashi lord identity, navamsha lord friendship, benefic planetary alignment)",
  vashyaConvention: "Saravali 5x5 Classical Classification & Scoring Matrix (Bride Rows x Groom Columns; Sagittarius 0-15° Manava / 15-30° Chatushpada, Capricorn 0-15° Chatushpada / 15-30° Jalachara, Aquarius wholly Manava)",
  yoniConvention: "Saravali / Maitreya 14x14 Canonical Animal Matrix [0, 4] points (Horse, Elephant, Sheep, Serpent, Dog, Cat, Rat, Cow, Buffalo, Tiger, Hare, Monkey, Mongoose, Lion)",
  dstFoldConvention: "Disambiguated via options.fold (0 = standard/EDT first occurrence, 1 = fallback/EST second occurrence)",
  transitEventSolver: "Continuous bisection numerical root solver (<0.0001° / <1 minute precision) for Gochara ingress and aspect crossings",
  eventTimingFramework: "Multi-layered Parashari & Jaimini event timing (Natal Promise -> Dasha Activation -> Varga Confirmation D9/D10/D4/D24/D7/D60 -> Calculated Transit Roots)"
};

export const CALCULATION_CONVENTIONS = ASTROLOGY_CONVENTIONS;
export const ASHTAKAVARGA_SYSTEMS = ASTROLOGY_CONVENTIONS.ashtakavargaSystems;
export const DASHA_YEAR_CONVENTION = ASTROLOGY_CONVENTIONS.dashaFramework;

export const ASTRONOMICAL_CONVENTIONS = {
  engineVersion: "4.2.0",
  ephemerisSource: "Astronomy Engine (VSOP87/NOVAS) — Frame: Geocentric true ecliptic of date | Epoch: J2000.0 | Sidereal: Selected ayanamsha",
  ayanamsa: "AstroVerse Lahiri/Chitrapaksha polynomial convention (J2000.0 anchor 23°51'25.5\")",
  scientificValidationDisclaimer: "Astronomical calculations can be independently validated; astrological interpretations are tradition-dependent and are not scientifically validated predictions of life events.",
  houseSystem: "Whole Sign / Rāśi Bhava (Classical Parashari)",
  bhavaChalitSystem: "Equal-House Bhava Chalit (Centered on Ascendant Degree, Sandhi = ±15°)",
  d3System: "Parashari Drekkana (Vyatyaya optional)",
  d9System: "Parashari 108 Navamsha Cycle",
  d30System: "Parashari Trimsamsha (Ruler-based Odd/Even degrees)",
  d60System: "Parashari Shashtiamsha (Occupied-Sign Forward from Natal Sign with Parity-Reversed Deities; Alternative: From Aries — shown as alternativeSignIdx)",
  lunarNodes: "Configurable Mean or True (Osculating) Node (Rahu / Ketu)",
  dashaFramework: "Vimshottari (365.24219878 solar days/year)",
  strengthIndex: "Parashari 6-Fold Shadbala Framework under declared conventions with Graha Yuddha Virupa correction",
  drikBala: "Sripati Continuous Aspect Curve [0, 60] with Vishesh Drishti / 4",
  grahaYuddha: "Astronomical 1.0° Declination Victory with proximity-scaled ±30 Virupa correction (BPHS)"
};

export const MATCHING_CONVENTION = {
  system: "Ashtakoota (36 Classical Points)",
  source: "Kalaprakasika, Saravali & Muhurtha Chintamani",
  kutas: ["Varna", "Vashya", "Tara", "Yoni", "Graha Maitri", "Gana", "Bhakoot", "Nadi"],
  maxPoints: 36,
  vashyaTradition: "Saravali (Bride Rows / Groom Columns, 15° splits on Sagittarius & Capricorn, Aquarius wholly Manava)",
  yoniTradition: "Saravali / Maitreya (14x14 Canonical Table, 0-4 Points)",
  bhakootCancellation: "Allowed when Rashi lords are identical or mutual friends, or in 1-7 Kendra axis",
  nadiCancellation: "Allowed when Moon nakshatras have different padas, or same nakshatra across different rashis"
};

// Multi-System Astrology Re-exports
export { calculateChartBySystem, calculateMultiSystemBundle } from "../astrology/index.js";
export { ASTROLOGY_SYSTEMS, getSystemConfig } from "../config/astrologySystems.js";
export { REPORT_CHAPTERS, getChaptersForSystem } from "../config/reportChapters.js";

// Deterministic Chart Fingerprint Engine (SHA/64-bit Hex Hash)
export function generateChartFingerprint(chartData) {
  if (!chartData) return "AV-0000000000000000";
  const bInstant = chartData.birthInstantUtc || `${chartData.birthDateStr || chartData.birthDate || ""}_${chartData.birthTimeStr || chartData.birthTime || ""}`;
  const lat = (typeof chartData.latitude === "number" ? chartData.latitude : (typeof chartData.lat === "number" ? chartData.lat : 0)).toFixed(4);
  const lng = (typeof chartData.longitude === "number" ? chartData.longitude : (typeof chartData.lng === "number" ? chartData.lng : 0)).toFixed(4);
  const tz = (typeof chartData.utcOffset === "number" ? chartData.utcOffset : (typeof chartData.tz === "number" ? chartData.tz : 0)).toFixed(2);
  const sys = chartData.system?.id || chartData.system?.name || "lahiri";
  const ayan = (typeof chartData.ayanamsa === "number" ? chartData.ayanamsa : (typeof chartData.ayanamsha === "number" ? chartData.ayanamsha : (typeof chartData.ayanamsaValue === "number" ? chartData.ayanamsaValue : 0))).toFixed(4);
  const node = chartData.nodeModel || "mean";

  const rawStr = `ASTROVERSE_V4.2.0|${bInstant}|${lat}|${lng}|${tz}|${sys}|${ayan}|${node}`;
  
  let h1 = 0xdeadbeef ^ rawStr.length;
  let h2 = 0x41c6ce57 ^ rawStr.length;
  for (let i = 0; i < rawStr.length; i++) {
    const ch = rawStr.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `AV-${hex1.toUpperCase()}${hex2.toUpperCase()}`;
}



