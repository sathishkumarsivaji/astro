/**
 * ASTROVERSE — Authoritative Nakshatra, Pada & KP Sub-Lord Engine
 *
 * Implements:
 * - 27 Vedic Nakshatras & 108 Padas (Exact 13°20' and 3°20' mathematics)
 * - 249 KP Sub-Lords & Sub-Sub Lords (Vimshottari proportional arc division)
 * - Authoritative Nakshatra details & deity associations
 */

import { norm360 } from "../astronomy/time.js";

export const NAKSHATRA_SPAN_DEG = 360 / 27; // 13.333333333333334 (13° 20')
export const PADA_SPAN_DEG = NAKSHATRA_SPAN_DEG / 4; // 3.3333333333333335 (3° 20')
export const NAKSHATRA_SPAN_MINUTES = 800; // 800 arcminutes

export const DASHA_LORDS_ORDER = [
  { lord: "Ketu", years: 7 },
  { lord: "Venus", years: 20 },
  { lord: "Sun", years: 6 },
  { lord: "Moon", years: 10 },
  { lord: "Mars", years: 7 },
  { lord: "Rahu", years: 18 },
  { lord: "Jupiter", years: 16 },
  { lord: "Saturn", years: 19 },
  { lord: "Mercury", years: 17 }
];

export const SIGN_LORDS = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"
];

export const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export const NAKSHATRA_METADATA = [
  { name: "Ashwini", tamil: "அசுவினி", ruler: "Ketu", deity: "Ashvins" },
  { name: "Bharani", tamil: "பரணி", ruler: "Venus", deity: "Yama" },
  { name: "Krittika", tamil: "கிருத்திகை", ruler: "Sun", deity: "Agni" },
  { name: "Rohini", tamil: "ரோகிணி", ruler: "Moon", deity: "Brahma" },
  { name: "Mrigashira", tamil: "மிருகசீரிஷம்", ruler: "Mars", deity: "Soma" },
  { name: "Ardra", tamil: "திருவாதிரை", ruler: "Rahu", deity: "Rudra" },
  { name: "Punarvasu", tamil: "புனர்பூசம்", ruler: "Jupiter", deity: "Aditi" },
  { name: "Pushya", tamil: "பூசம்", ruler: "Saturn", deity: "Brihaspati" },
  { name: "Ashlesha", tamil: "ஆயில்யம்", ruler: "Mercury", deity: "Nagas" },
  { name: "Magha", tamil: "மகம்", ruler: "Ketu", deity: "Pitris" },
  { name: "Purva Phalguni", tamil: "பூரம்", ruler: "Venus", deity: "Bhaga" },
  { name: "Uttara Phalguni", tamil: "உத்திரம்", ruler: "Sun", deity: "Aryaman" },
  { name: "Hasta", tamil: "அஸ்தம்", ruler: "Moon", deity: "Savitr" },
  { name: "Chitra", tamil: "சித்திரை", ruler: "Mars", deity: "Tvashtr" },
  { name: "Swati", tamil: "சுவாதி", ruler: "Rahu", deity: "Vayu" },
  { name: "Vishakha", tamil: "விசாகம்", ruler: "Jupiter", deity: "Indragni" },
  { name: "Anuradha", tamil: "அனுஷம்", ruler: "Saturn", deity: "Mitra" },
  { name: "Jyeshtha", tamil: "கேட்டை", ruler: "Mercury", deity: "Indra" },
  { name: "Mula", tamil: "மூலம்", ruler: "Ketu", deity: "Nirriti" },
  { name: "Purva Ashadha", tamil: "பூராடம்", ruler: "Venus", deity: "Apas" },
  { name: "Uttara Ashadha", tamil: "உத்திராடம்", ruler: "Sun", deity: "Vishvadevas" },
  { name: "Shravana", tamil: "திருவோணம்", ruler: "Moon", deity: "Vishnu" },
  { name: "Dhanishta", tamil: "அவிட்டம்", ruler: "Mars", deity: "Vasus" },
  { name: "Shatabhisha", tamil: "சதயம்", ruler: "Rahu", deity: "Varuna" },
  { name: "Purva Bhadrapada", tamil: "பூரட்டாதி", ruler: "Jupiter", deity: "Aja Ekapada" },
  { name: "Uttara Bhadrapada", tamil: "உத்திரட்டாதி", ruler: "Saturn", deity: "Ahirbudhnya" },
  { name: "Revati", tamil: "ரேவதி", ruler: "Mercury", deity: "Pushan" }
];

/**
 * Calculates Nakshatra and Pada for a given sidereal longitude [0, 360).
 */
export function getNakshatraAndPada(longitude) {
  const normLong = norm360(longitude);
  const nakIdx = Math.min(26, Math.max(0, Math.floor(normLong / NAKSHATRA_SPAN_DEG)));
  const meta = NAKSHATRA_METADATA[nakIdx];
  const remDeg = normLong - nakIdx * NAKSHATRA_SPAN_DEG;
  const pada = Math.min(4, Math.max(1, Math.floor(remDeg / PADA_SPAN_DEG) + 1));
  
  // Total padas from 0° Aries:
  const totalPadas = nakIdx * 4 + (pada - 1);
  const navamshaSignIdx = totalPadas % 12;

  const signIdx = Math.floor(normLong / 30);

  return {
    nakshatraIndex: nakIdx,
    nakshatraName: meta.name,
    nakshatraTamil: meta.tamil,
    nakshatraLord: meta.ruler,
    deity: meta.deity,
    pada,
    degreeInNakshatra: remDeg,
    navamshaSignIndex: navamshaSignIdx,
    navamshaSignName: SIGN_NAMES[navamshaSignIdx],
    signIndex: signIdx,
    signName: SIGN_NAMES[signIdx],
    signLord: SIGN_LORDS[signIdx]
  };
}

/**
 * KP SUB-LORD AND SUB-SUB-LORD ENGINE
 * Calculates Sign Lord, Star Lord, Sub Lord, Sub-Sub Lord
 */
export function getKPSubLord(longitude) {
  const normLong = norm360(longitude);
  const signIdx = Math.floor(normLong / 30);
  const signLord = SIGN_LORDS[signIdx];
  const signName = SIGN_NAMES[signIdx];

  const nakIdx = Math.min(26, Math.max(0, Math.floor(normLong / NAKSHATRA_SPAN_DEG)));
  const nakMeta = NAKSHATRA_METADATA[nakIdx];
  const starLord = nakMeta.ruler;

  // Arc in minutes within this nakshatra [0, 800)
  const degInNak = normLong - (nakIdx * NAKSHATRA_SPAN_DEG);
  let minInNak = degInNak * 60;
  if (minInNak >= 800) minInNak = 799.999999;

  // Starting index in DASHA_LORDS_ORDER for this star lord
  const starLordIdx = DASHA_LORDS_ORDER.findIndex(d => d.lord === starLord);

  let accumulatedMin = 0;
  let subLord = starLord;
  let subStartMin = 0;
  let subSpanMin = 0;
  let subLordIndex = starLordIdx;

  for (let i = 0; i < 9; i++) {
    const idx = (starLordIdx + i) % 9;
    const span = (DASHA_LORDS_ORDER[idx].years / 120.0) * 800.0;
    if (minInNak < accumulatedMin + span || i === 8) {
      subLord = DASHA_LORDS_ORDER[idx].lord;
      subStartMin = accumulatedMin;
      subSpanMin = span;
      subLordIndex = idx;
      break;
    }
    accumulatedMin += span;
  }

  // Sub-Sub Lord
  const minInSub = minInNak - subStartMin;
  let accSubSubMin = 0;
  let subSubLord = subLord;

  for (let j = 0; j < 9; j++) {
    const sidx = (subLordIndex + j) % 9;
    const ssSpan = (DASHA_LORDS_ORDER[sidx].years / 120.0) * subSpanMin;
    if (minInSub < accSubSubMin + ssSpan || j === 8) {
      subSubLord = DASHA_LORDS_ORDER[sidx].lord;
      break;
    }
    accSubSubMin += ssSpan;
  }

  return {
    longitude: normLong,
    signName,
    signLord,
    starLord,
    subLord,
    subSubLord,
    nakshatraName: nakMeta.name,
    nakshatraIndex: nakIdx
  };
}
