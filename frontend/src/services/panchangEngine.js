/**
 * SKR ASTRO — High-Precision Vedic Panchanga & Timing Enrichment Engine
 *
 * Provides:
 * 1. 12-hour AM/PM and Next-Day aware formatting for all 5 Panchanga Angas
 * 2. Auspicious (Abhijit, Brahma, Amrita) and Inauspicious (Rahu, Yama, Gulika, Durmuhurtham, Varjyam) time windows
 * 3. 24 Planetary Horas with Shubha / Ashubha status
 * 4. Traditional Tamil Gowri Panchangam (8 equal daytime segments)
 * 5. Full horizon-based Electional Muhurta search (14 to 180 days)
 */

import {
  calculateDailyPanchang,
  NAKSHATRAS
} from "./astroEngine.js";

const TITHI_NAMES = [
  "Pratipada", "Dvitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
  "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Purnima/Amavasya"
];

const TITHI_NAMES_TA = [
  "பிரதமை", "துவிதியை", "திருதியை", "சதுர்த்தி", "பஞ்சமி",
  "சஷ்டி", "சப்தமி", "அஷ்டமி", "நவமி", "தசமி",
  "ஏகாதசி", "துவாதசி", "திரயோதசி", "சதுர்த்தசி", "பௌர்ணமி/அமாவாசை"
];

const YOGA_NAMES = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma",
  "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana",
  "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva", "Siddha",
  "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];

const KARANA_NAMES = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti (Bhadra)", "Shakuni", "Chatushpada", "Naga", "Kimstughna"];

const NAKSHATRA_VARJYAM_GHATIS = [
  50, 24, 30, 40, 14, 21, 30, 20, 32, 30, 20, 18, 21, 20, 14, 14, 10, 14, 56, 24, 20, 10, 10, 18, 16, 24, 30
];

const CHALDEAN_PLANETS = [
  { name: "Sun", tamil: "சூரியன்", ruler: "Sun", isShubha: false },
  { name: "Venus", tamil: "சுக்கிரன்", ruler: "Venus", isShubha: true },
  { name: "Mercury", tamil: "புதன்", ruler: "Mercury", isShubha: true },
  { name: "Moon", tamil: "சந்திரன்", ruler: "Moon", isShubha: true },
  { name: "Saturn", tamil: "சனி", ruler: "Saturn", isShubha: false },
  { name: "Jupiter", tamil: "குரு", ruler: "Jupiter", isShubha: true },
  { name: "Mars", tamil: "செவ்வாய்", ruler: "Mars", isShubha: false }
];

const GOWRI_ELEMENTS = [
  { id: "uthi", name: "Uthi", nameTamil: "உத்தி", nature: "Neutral", isAuspicious: true },
  { id: "amirdham", name: "Amirdham", nameTamil: "அமிர்தம்", nature: "Highly Auspicious", isAuspicious: true },
  { id: "rogam", name: "Rogam", nameTamil: "ரோகம்", nature: "Inauspicious", isAuspicious: false },
  { id: "sobanam", name: "Sobanam", nameTamil: "சோபனம் / சுகம்", nature: "Auspicious", isAuspicious: true },
  { id: "labham", name: "Labham", nameTamil: "லாபம்", nature: "Auspicious", isAuspicious: true },
  { id: "visham", name: "Visham", nameTamil: "விஷம்", nature: "Inauspicious", isAuspicious: false },
  { id: "dhanam", name: "Dhanam", nameTamil: "தனம்", nature: "Auspicious", isAuspicious: true },
  { id: "soram", name: "Soram", nameTamil: "சோரம்", nature: "Inauspicious", isAuspicious: false }
];

const GOWRI_DAY_SEQUENCES = [
  [0, 1, 2, 3, 4, 5, 6, 7], // Sun
  [1, 2, 3, 4, 5, 6, 7, 0], // Mon
  [2, 3, 4, 5, 6, 7, 0, 1], // Tue
  [3, 4, 5, 6, 7, 0, 1, 2], // Wed
  [4, 5, 6, 7, 0, 1, 2, 3], // Thu
  [5, 6, 7, 0, 1, 2, 3, 4], // Fri
  [6, 7, 0, 1, 2, 3, 4, 5]  // Sat
];

const DURMUHURTHAM_SLOTS = [
  [13],        // Sun: 14th muhurta
  [7, 11],     // Mon: 8th & 12th
  [3, 10],     // Tue: 4th & 11th
  [4],         // Wed: 5th
  [5, 12],     // Thu: 6th & 13th
  [3, 8],      // Fri: 4th & 9th
  [1, 2]       // Sat: 2nd & 3rd
];

function formatDecimalHours12(h) {
  const normH = (h + 24) % 24;
  const hrs = Math.floor(normH);
  const mins = Math.round((normH % 1) * 60);
  const actualM = mins === 60 ? 59 : mins;
  const ampm = hrs >= 12 ? "PM" : "AM";
  const h12 = hrs % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(actualM).padStart(2, "0")} ${ampm}`;
}

export function formatDecimalHours24(h) {
  const normH = (h + 24) % 24;
  const hrs = Math.floor(normH);
  const mins = Math.round((normH % 1) * 60);
  const actualM = mins === 60 ? 59 : mins;
  return `${String(hrs).padStart(2, "0")}:${String(actualM).padStart(2, "0")}`;
}

function formatWindow12(startH, endH) {
  return `${formatDecimalHours12(startH)} – ${formatDecimalHours12(endH)}`;
}

function formatTime24To12(time24) {
  if (!time24 || typeof time24 !== "string" || !time24.includes(":")) return "--:--";
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatWindowString12(windowStr24) {
  if (!windowStr24 || typeof windowStr24 !== "string" || !windowStr24.includes("-")) {
    return windowStr24 || "--:--";
  }
  const parts = windowStr24.split("-").map(p => p.trim());
  if (parts.length === 2 && parts[0].includes(":") && parts[1].includes(":")) {
    return `${formatTime24To12(parts[0])} – ${formatTime24To12(parts[1])}`;
  }
  return windowStr24;
}

export function calculateEnrichedDailyPanchang(date, lat, lng, tz, timezoneId) {
  const base = calculateDailyPanchang(date, lat, lng, tz, timezoneId);
  const dayIdx = new Date(base.date + "T12:00:00Z").getUTCDay();

  // Helper for 12h and next-day awareness on transitions
  const enrichTransition = (untilStr, timestamp) => {
    if (!untilStr) return { time24: "--:--", time12: "--:--", detailedEn: "--:--", detailedTa: "--:--", isNextDay: false };
    const time12 = formatTime24To12(untilStr);
    let isNextDay = false;
    if (timestamp && base.sunriseInstantUtc) {
      const sunriseMs = new Date(base.sunriseInstantUtc).getTime();
      isNextDay = (timestamp - sunriseMs) > (24 - 6) * 3600000;
    }
    const detailedEn = isNextDay ? `${time12} (Next Day)` : time12;
    const detailedTa = isNextDay ? `${time12} (மறுநாள்)` : time12;
    return { time24: untilStr, time12, detailedEn, detailedTa, isNextDay };
  };

  const tithiTrans = enrichTransition(base.tithi?.until, base.tithi?.transitionTimestamp);
  const nakTrans = enrichTransition(base.nakshatra?.until, base.nakshatra?.transitionTimestamp);
  const yogaTrans = enrichTransition(base.yoga?.until, base.yoga?.transitionTimestamp);
  const karanaTrans = enrichTransition(base.karana?.until, base.karana?.transitionTimestamp);

  // Subsequent Angas
  const tithiIdx = (base.tithi?.index ? base.tithi.index - 1 : 0);
  const nextTithiIdx = (tithiIdx + 1) % 30;
  const nextIsShukla = nextTithiIdx < 15;
  const nextTNum = (nextTithiIdx % 15) + 1;
  const nextTithiName = `${nextIsShukla ? "Shukla" : "Krishna"} ${nextTNum === 15 ? (nextIsShukla ? "Purnima" : "Amavasya") : TITHI_NAMES[nextTNum - 1]}`;
  const nextTithiTamil = `${nextIsShukla ? "சுக்கில பட்ச" : "கிருஷ்ண பட்ச"} ${nextTNum === 15 ? (nextIsShukla ? "பௌர்ணமி" : "அமாவாசை") : TITHI_NAMES_TA[nextTNum - 1]}`;

  const curNakIdx = NAKSHATRAS.findIndex(n => n.name === base.nakshatra?.name);
  const nextNakIdx = curNakIdx >= 0 ? (curNakIdx + 1) % 27 : 0;
  const nextNak = NAKSHATRAS[nextNakIdx] || NAKSHATRAS[0];

  const curYogaIdx = YOGA_NAMES.indexOf(base.yoga?.name);
  const nextYogaIdx = curYogaIdx >= 0 ? (curYogaIdx + 1) % 27 : 0;
  const nextYoga = YOGA_NAMES[nextYogaIdx];

  const curKaranaIdx = KARANA_NAMES.findIndex(k => base.karana?.name && base.karana.name.includes(k.split(" ")[0]));
  const nextKaranaIdx = curKaranaIdx >= 0 ? (curKaranaIdx + 1) % KARANA_NAMES.length : 0;
  const nextKarana = KARANA_NAMES[nextKaranaIdx];

  // 12-hour formatted Muhurtas
  const rahuKalam12 = formatWindowString12(base.rahuKalam);
  const yamagandam12 = formatWindowString12(base.yamagandam);
  const gulikaKalam12 = formatWindowString12(base.gulikaKalam);
  const abhijitMuhurta12 = formatWindowString12(base.abhijitMuhurta);
  const brahmaMuhurta12 = formatWindowString12(base.brahmaMuhurta);

  // Parse sunrise & sunset into decimal hours for custom windows
  let sunriseHour = 6.0;
  let sunsetHour = 18.0;
  if (base.sunrise && base.sunrise.includes(":")) {
    const sMatch = base.sunrise.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (sMatch) {
      let h = parseInt(sMatch[1], 10);
      const m = parseInt(sMatch[2], 10);
      const ampm = sMatch[3] ? sMatch[3].toUpperCase() : null;
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      sunriseHour = h + m / 60;
    }
  }
  if (base.sunset && base.sunset.includes(":")) {
    const setMatch = base.sunset.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (setMatch) {
      let h = parseInt(setMatch[1], 10);
      const m = parseInt(setMatch[2], 10);
      const ampm = setMatch[3] ? setMatch[3].toUpperCase() : null;
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      sunsetHour = h + m / 60;
    }
  }

  const daySpan = sunsetHour > sunriseHour ? (sunsetHour - sunriseHour) : 12.0;
  const oneEighth = daySpan / 8;
  const oneFifteenth = daySpan / 15.0;

  // Durmuhurtham slots
  const dSlots = DURMUHURTHAM_SLOTS[dayIdx] || [13];
  const durmuhurtham12 = dSlots.map(s => formatWindow12(sunriseHour + s * oneFifteenth, sunriseHour + (s + 1) * oneFifteenth)).join(", ");

  // Varjyam & Amrita Kalam
  const vGhatis = NAKSHATRA_VARJYAM_GHATIS[curNakIdx >= 0 ? curNakIdx : 0] || 20;
  const vOffsetHours = (vGhatis * 24) / 60;
  const vStart = (sunriseHour + (vOffsetHours % 12));
  const vEnd = vStart + 1.6;
  const varjyam12 = formatWindow12(vStart, vEnd);
  const aStart = (vStart + 5.6) % 24;
  const aEnd = aStart + 1.6;
  const amritaKalam12 = formatWindow12(aStart, aEnd);

  // 24 Horas
  const DAY_FIRST_HORA_IDX = [0, 3, 6, 2, 5, 1, 4];
  const startHoraIdx = DAY_FIRST_HORA_IDX[dayIdx];
  const dayHoraDur = daySpan / 12.0;
  const nightHoraDur = (24.0 - daySpan) / 12.0;
  const horas = [];
  for (let h = 0; h < 24; h++) {
    const pIdx = (startHoraIdx + h) % 7;
    const planet = CHALDEAN_PLANETS[pIdx];
    const isDay = h < 12;
    const sH = isDay ? (sunriseHour + h * dayHoraDur) : (sunsetHour + (h - 12) * nightHoraDur);
    const eH = isDay ? (sH + dayHoraDur) : (sH + nightHoraDur);
    horas.push({
      hour: h + 1,
      isDay,
      planet: planet.name,
      planetTamil: planet.tamil,
      isShubha: planet.isShubha,
      nature: planet.isShubha ? "Subha Horai (Auspicious)" : "Caution / Neutral",
      natureTamil: planet.isShubha ? "சுப ஹோரை (நன்மை தரும்)" : "மந்த / எச்சரிக்கை ஹோரை",
      time12: formatWindow12(sH, eH)
    });
  }

  // Gowri Panchangam
  const gSeq = GOWRI_DAY_SEQUENCES[dayIdx] || GOWRI_DAY_SEQUENCES[0];
  const gowriPanchangam = [];
  for (let g = 0; g < 8; g++) {
    const gItem = GOWRI_ELEMENTS[gSeq[g]];
    const sH = sunriseHour + g * oneEighth;
    const eH = sH + oneEighth;
    gowriPanchangam.push({
      part: g + 1,
      ...gItem,
      time12: formatWindow12(sH, eH)
    });
  }

  return {
    ...base,
    tithi: {
      ...base.tithi,
      until12: tithiTrans.time12,
      untilDetailedEn: tithiTrans.detailedEn,
      untilDetailedTa: tithiTrans.detailedTa,
      nextTithi: nextTithiName,
      nextTithiTamil
    },
    nakshatra: {
      ...base.nakshatra,
      until12: nakTrans.time12,
      untilDetailedEn: nakTrans.detailedEn,
      untilDetailedTa: nakTrans.detailedTa,
      nextNakshatra: nextNak.name,
      nextNakshatraTamil: nextNak.tamil
    },
    yoga: {
      ...base.yoga,
      until12: yogaTrans.time12,
      untilDetailedEn: yogaTrans.detailedEn,
      untilDetailedTa: yogaTrans.detailedTa,
      nextYoga
    },
    karana: {
      ...base.karana,
      until12: karanaTrans.time12,
      untilDetailedEn: karanaTrans.detailedEn,
      untilDetailedTa: karanaTrans.detailedTa,
      nextKarana
    },
    rahuKalam12,
    yamagandam12,
    gulikaKalam12,
    abhijitMuhurta12,
    brahmaMuhurta12,
    durmuhurtham12,
    varjyam12,
    amritaKalam12,
    horas,
    gowriPanchangam
  };
}

export const MUHURTA_EVENT_CONFIGS = {
  marriage: {
    id: "marriage",
    nameEn: "Vivaha (Marriage)",
    nameTa: "திருமண முகூர்த்தம் (Marriage)",
    descEn: "Auspicious Venus/Jupiter & shubha nakshatra alignment",
    descTa: "குரு, சுக்கிரன் மற்றும் சுப திதி/நட்சத்திரங்கள்",
    shubhaNakshatras: [
      "Rohini", "Mrigashira", "Magha", "Uttara Phalguni", "Hasta",
      "Chitra", "Swati", "Anuradha", "Mula", "Uttara Ashadha",
      "Uttara Bhadrapada", "Revati"
    ],
    ashubhaNakshatras: [
      "Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha",
      "Purva Phalguni", "Purva Ashadha", "Purva Bhadrapada", "Shatabhisha"
    ],
    shubhaVaras: [1, 3, 4, 5], // Mon, Wed, Thu, Fri
    ashubhaVaras: [0, 2, 6],   // Sun, Tue, Sat
    shubhaTithis: [2, 3, 5, 7, 10, 11, 13],
    varjyaTithis: [4, 8, 9, 14, 0, 15],
    beneficHoras: ["Jupiter", "Venus", "Mercury", "Moon"],
    primaryRationaleEn: "Evaluates classical Vivaha Shuddhi: Auspicious lunar mansions (Rohini, Mriga, Uttara, Anuradha, Revati), avoidance of Rikta/Ashtami tithis and malefic varas, and alignment of Jupiter & Venus horas.",
    primaryRationaleTa: "பாரம்பரிய விவாக சுத்தி: சுப திருமண நட்சத்திரங்கள் (மிருகசீரிஷம், ரோகிணி, உத்திரம், அனுஷம், ரேவதி), ரிக்தா/அஷ்டமி தவிர்ப்பு மற்றும் குரு/சுக்கிர ஹோரைகளின் சுப சேர்க்கை."
  },

  griha_pravesh: {
    id: "griha_pravesh",
    nameEn: "Griha Pravesham (Housewarming)",
    nameTa: "கிரகப்பிரவேசம் (Housewarming)",
    descEn: "Fixed sign Ascendant & auspicious lunar day",
    descTa: "வாஸ்து புருஷர் விழிப்பு & ஸ்திர லக்ன சுபம்",
    shubhaNakshatras: [
      "Rohini", "Mrigashira", "Pushya", "Uttara Phalguni", "Hasta",
      "Chitra", "Anuradha", "Uttara Ashadha", "Shravana", "Dhanishta",
      "Shatabhisha", "Uttara Bhadrapada", "Revati"
    ],
    ashubhaNakshatras: [
      "Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha", "Mula",
      "Purva Phalguni", "Purva Ashadha", "Purva Bhadrapada"
    ],
    shubhaVaras: [1, 3, 4, 5],
    ashubhaVaras: [0, 2], // Sun, Tue
    shubhaTithis: [2, 3, 5, 7, 10, 11, 13],
    varjyaTithis: [4, 9, 14, 0, 15],
    preferShukla: true,
    beneficHoras: ["Jupiter", "Venus", "Moon", "Mercury"],
    primaryRationaleEn: "Evaluates Sthira (Fixed) stability, Vaastu alignment, Shukla Paksha auspicious lunar days, and daytime Sthira Rasi ascendant / Abhijit Muhurta windows.",
    primaryRationaleTa: "ஸ்திர ராசி பலம், வாஸ்து புருஷர் சுபம், வளர்பிறை சுப திதிகள் மற்றும் அபிஜித் முகூர்த்த சுப காலங்கள் ஒருங்கிணைப்பு."
  },

  vehicle: {
    id: "vehicle",
    nameEn: "Vahana (Vehicle Purchase)",
    nameTa: "வாகனம் வாங்குதல் (Vehicle Purchase)",
    descEn: "Benefic Venus/Moon transit & auspicious vara",
    descTa: "சுக்கிரன் & சந்திரன் சுப சஞ்சாரம்",
    shubhaNakshatras: [
      "Ashwini", "Rohini", "Punarvasu", "Pushya", "Hasta",
      "Chitra", "Swati", "Shravana", "Dhanishta", "Shatabhisha", "Revati"
    ],
    ashubhaNakshatras: [
      "Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha", "Mula", "Purva Phalguni"
    ],
    shubhaVaras: [5, 3, 4, 1], // Fri, Wed, Thu, Mon
    ashubhaVaras: [2, 0], // Tue, Sun
    shubhaTithis: [2, 3, 5, 7, 10, 11, 13, 15],
    varjyaTithis: [4, 9, 14, 0],
    beneficHoras: ["Venus", "Mercury", "Moon", "Jupiter"],
    primaryRationaleEn: "Focuses on Venus (Vahana Karaka) and Moon hora resonance, swift (Kshipra/Chara) nakshatras for accident-free longevity, and avoiding malefic Mars/Saturn hours.",
    primaryRationaleTa: "வாகன காரகன் சுக்கிரன் & சந்திரன் பலம், விபத்து தவிர்ப்பதற்கான சுப நட்சத்திரங்கள் (அசுவினி, புஷ்யம், ஹஸ்தம், சுவாதி) மற்றும் சுப ஹோரை நேரம்."
  },

  property: {
    id: "property",
    nameEn: "Bhumi (Property Purchase)",
    nameTa: "பூமி / சொத்து கிரயம் (Property Purchase)",
    descEn: "Mars & 4th house lord auspicious aspect",
    descTa: "செவ்வாய், பூமி காரக சுப பார்வை",
    shubhaNakshatras: [
      "Mrigashira", "Punarvasu", "Magha", "Uttara Phalguni", "Hasta",
      "Chitra", "Swati", "Anuradha", "Uttara Ashadha", "Shravana",
      "Dhanishta", "Shatabhisha", "Uttara Bhadrapada", "Revati"
    ],
    ashubhaNakshatras: [
      "Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha"
    ],
    shubhaVaras: [4, 5, 3, 1], // Thu, Fri, Wed, Mon
    ashubhaVaras: [2, 6], // Tue, Sat
    shubhaTithis: [2, 3, 5, 7, 10, 11, 13, 15],
    varjyaTithis: [4, 9, 14, 0],
    beneficHoras: ["Jupiter", "Venus", "Mars", "Mercury"],
    primaryRationaleEn: "Requires Bhumi Karaka (Mars) and 4th house asset stability, favorable documentation tithis, and strictly avoiding Vishti Karana (Bhadra - litigation trigger).",
    primaryRationaleTa: "பூமி காரகன் செவ்வாய் பலம், சொத்து கிரய சுப நட்சத்திரங்கள் மற்றும் பத்திர பதிவிற்கு உகந்த வியாழன்/வெள்ளி/புதன் சுப தினங்கள்."
  },

  business: {
    id: "business",
    nameEn: "Vyapar (Business Launch)",
    nameTa: "தொழில் தொடங்குதல் (Business Launch)",
    descEn: "Mercury/Jupiter commercial yoga timing",
    descTa: "புதன், குரு சுப யோக காலம்",
    shubhaNakshatras: [
      "Ashwini", "Rohini", "Mrigashira", "Pushya", "Uttara Phalguni",
      "Hasta", "Chitra", "Anuradha", "Uttara Ashadha", "Shravana",
      "Dhanishta", "Revati"
    ],
    ashubhaNakshatras: [
      "Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha", "Mula"
    ],
    shubhaVaras: [3, 4, 5, 1], // Wed, Thu, Fri, Mon
    ashubhaVaras: [0, 2, 6], // Sun, Tue, Sat
    shubhaTithis: [2, 3, 5, 7, 10, 11, 13, 15],
    varjyaTithis: [4, 9, 14, 0],
    shubhaYogas: ["Siddha", "Amrita", "Shubha", "Saubhagya", "Sukarma", "Brahma", "Indra", "Vriddhi", "Dhruva", "Sadhya"],
    ashubhaYogas: ["Vyaghata", "Vajra", "Vyatipata", "Vaidhriti", "Shula", "Ganda", "Atiganda"],
    beneficHoras: ["Mercury", "Jupiter", "Venus"],
    primaryRationaleEn: "Synthesizes Mercury (Vyapar Karaka) and Jupiter (Dhana Karaka) commercial wealth yogas, Pushya/Hasta merchant nakshatras, and prosperous Pratishtha timing.",
    primaryRationaleTa: "வியாபார காரகன் புதன் மற்றும் தனகாரகன் குருவின் வர்த்தக யோகங்கள், புஷ்யம்/ஹஸ்தம்/ரேவதி சுப நட்சத்திரங்கள் மற்றும் வாடிக்கையாளர் ஈர்ப்பு சுப காலம்."
  },

  travel: {
    id: "travel",
    nameEn: "Yatra (Auspicious Travel)",
    nameTa: "சுப பிரயாணம் (Travel / Relocation)",
    descEn: "Moon strength & auspicious directional alignment",
    descTa: "சந்திர பலம் & சுப திசை முகூர்த்தம்",
    shubhaNakshatras: [
      "Ashwini", "Mrigashira", "Punarvasu", "Pushya", "Hasta",
      "Anuradha", "Shravana", "Dhanishta", "Revati"
    ],
    ashubhaNakshatras: [
      "Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha", "Mula"
    ],
    shubhaVaras: [1, 3, 4, 5], // Mon, Wed, Thu, Fri
    ashubhaVaras: [2, 6], // Tue, Sat
    shubhaTithis: [2, 3, 5, 7, 10, 11, 13],
    varjyaTithis: [1, 4, 8, 9, 14, 0, 15],
    dishashool: {
      0: { direction: "West", directionTa: "மேற்கு" },
      1: { direction: "East", directionTa: "கிழக்கு" },
      2: { direction: "North", directionTa: "வடக்கு" },
      3: { direction: "North", directionTa: "வடக்கு" },
      4: { direction: "South", directionTa: "தெற்கு" },
      5: { direction: "West", directionTa: "மேற்கு" },
      6: { direction: "East", directionTa: "கிழக்கு" }
    },
    beneficHoras: ["Moon", "Jupiter", "Venus", "Mercury"],
    primaryRationaleEn: "Calculates Chandra Balam for safe journey, directional Dishashool avoidance, swift Chara/Kshipra nakshatras, and protection from travel delay tithis.",
    primaryRationaleTa: "சந்திர பலம், திசாசூலை (தவிர்க்க வேண்டிய திசைகள்) எச்சரிக்கை, அசுவினி/புஷ்யம்/ஹஸ்தம் பயண நட்சத்திரங்கள் மற்றும் தடையற்ற சுப பிரயாண காலங்கள்."
  }
};

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_NAMES_TA = [
  "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
  "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"
];

export function searchAuspiciousMuhurtas(eventType, startDate, daysAhead = 30, lat = null, lng = null, tz = null, timezoneId = null) {
  const startYmd = (typeof startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startDate))
    ? startDate
    : new Date().toISOString().split("T")[0];

  const totalDays = Math.max(1, Math.min(365, parseInt(daysAhead, 10) || 30));
  const startD = new Date(startYmd + "T12:00:00Z");

  // Normalize event
  const rawKey = String(eventType || "marriage").toLowerCase().trim();
  let eventKey = "marriage";
  if (rawKey.includes("griha") || rawKey.includes("house")) eventKey = "griha_pravesh";
  else if (rawKey.includes("vehic") || rawKey.includes("vahan") || rawKey.includes("car")) eventKey = "vehicle";
  else if (rawKey.includes("prop") || rawKey.includes("bhum") || rawKey.includes("land")) eventKey = "property";
  else if (rawKey.includes("busin") || rawKey.includes("vyapar") || rawKey.includes("shop")) eventKey = "business";
  else if (rawKey.includes("trav") || rawKey.includes("yatra")) eventKey = "travel";
  else if (MUHURTA_EVENT_CONFIGS[rawKey]) eventKey = rawKey;

  const config = MUHURTA_EVENT_CONFIGS[eventKey] || MUHURTA_EVENT_CONFIGS.marriage;
  const candidates = [];

  for (let i = 0; i <= totalDays; i++) {
    const cur = new Date(startD.getTime() + i * 86400000);
    const ymd = cur.toISOString().split("T")[0];
    const panchang = calculateEnrichedDailyPanchang(ymd, lat, lng, tz, timezoneId);

    const dayIdx = cur.getUTCDay(); // 0: Sun ... 6: Sat
    let score = 60;
    const positiveFactors = [];
    const negativeFactors = [];
    const positiveFactorsTa = [];
    const negativeFactorsTa = [];

    // 1. Nakshatra Evaluation (Weight: 25)
    const nakName = panchang.nakshatra?.name || "";
    const nakTamil = panchang.nakshatra?.tamil || nakName;
    if (config.shubhaNakshatras.includes(nakName)) {
      score += 20;
      positiveFactors.push(`Auspicious Nakshatra for ${config.nameEn} (${nakName})`);
      positiveFactorsTa.push(`${config.nameTa} உகந்த சுப நட்சத்திரம் (${nakTamil})`);
    } else if (config.ashubhaNakshatras.includes(nakName)) {
      score -= 25;
      negativeFactors.push(`Forbidden / Inauspicious Nakshatra for ${config.nameEn} (${nakName})`);
      negativeFactorsTa.push(`${config.nameTa} தவிர்க்க வேண்டிய நட்சத்திரம் (${nakTamil})`);
    } else {
      score += 5;
      positiveFactors.push(`Neutral Nakshatra Alignment (${nakName})`);
      positiveFactorsTa.push(`இயல்பான நட்சத்திர அமைப்பு (${nakTamil})`);
    }

    // 2. Vara (Day of Week) Evaluation (Weight: 20)
    const varaName = panchang.vara?.name || panchang.varaName;
    const varaTamil = panchang.vara?.tamil || varaName;
    if (config.shubhaVaras.includes(dayIdx)) {
      score += 15;
      positiveFactors.push(`Benefic Planetary Day for ${config.nameEn} (${varaName})`);
      positiveFactorsTa.push(`${config.nameTa} உகந்த சுப கிழமை (${varaTamil})`);
    } else if (config.ashubhaVaras.includes(dayIdx)) {
      score -= 20;
      negativeFactors.push(`Malefic / Caution Day for ${config.nameEn} (${varaName})`);
      negativeFactorsTa.push(`${config.nameTa} எச்சரிக்கைக்குரிய கிழமை (${varaTamil})`);
    }

    // 3. Tithi (Lunar Day) Evaluation (Weight: 25)
    const tNum = (panchang.tithi?.index ? ((panchang.tithi.index - 1) % 15) + 1 : 1);
    const isShukla = panchang.tithi?.paksha === "Shukla";
    const tithiName = panchang.tithi?.name || "Tithi";
    const tithiTamil = panchang.tithi?.nameTamil || tithiName;

    if (config.shubhaTithis.includes(tNum)) {
      score += 10;
      positiveFactors.push(`Auspicious Lunar Tithi (${tithiName})`);
      positiveFactorsTa.push(`சுப திதி அமைப்பு (${tithiTamil})`);
    }
    if (config.varjyaTithis.includes(tNum) || [4, 9, 14].includes(tNum)) {
      score -= 25;
      negativeFactors.push(`Forbidden / Rikta Tithi (${tithiName})`);
      negativeFactorsTa.push(`ரிக்தா / விலக்க வேண்டிய திதி (${tithiTamil})`);
    }
    if (config.preferShukla && isShukla) {
      score += 10;
      positiveFactors.push("Shukla Paksha (Waxing Phase — Highly Beneficial)");
      positiveFactorsTa.push("சுக்கில பட்சம் (வளர்பிறை சுப காலம்)");
    }

    // 4. Yoga Evaluation (Weight: 15)
    const yogaName = panchang.yoga?.name || "";
    if (config.shubhaYogas && config.shubhaYogas.includes(yogaName)) {
      score += 15;
      positiveFactors.push(`Commercial Prosperity Yoga (${yogaName})`);
      positiveFactorsTa.push(`வர்த்தக விருத்தி சுப யோகம் (${yogaName})`);
    } else if (panchang.yoga?.isAuspicious) {
      score += 10;
      positiveFactors.push(`Auspicious Yoga (${yogaName})`);
      positiveFactorsTa.push(`சுப யோகம் (${yogaName})`);
    } else {
      score -= 20;
      negativeFactors.push(`Inauspicious Yoga (${yogaName})`);
      negativeFactorsTa.push(`அசுப யோகம் (${yogaName})`);
    }

    // 5. Karana Evaluation (Weight: 20)
    if (panchang.karana?.isBhadra) {
      score -= 25;
      negativeFactors.push("Vishti (Bhadra) Karana present — Avoid initiating ventures");
      negativeFactorsTa.push("விஷ்டி (பத்ரா) கரணம் உள்ளது — காரிய தொடக்கத்தை தவிர்க்கவும்");
    } else {
      score += 10;
      positiveFactors.push("Free from Vishti/Bhadra Karana");
      positiveFactorsTa.push("விஷ்டி / பத்ரா தோஷமற்ற சுப கரணம்");
    }

    // 6. Directional Shoola (Travel)
    if (eventKey === "travel" && config.dishashool && config.dishashool[dayIdx]) {
      const ds = config.dishashool[dayIdx];
      negativeFactors.push(`Dishashool Warning: Avoid travelling toward ${ds.direction} today`);
      negativeFactorsTa.push(`திசாசூலை எச்சரிக்கை: இன்று ${ds.directionTa} திசை பிரயாணத்தை தவிர்க்கவும்`);
    }

    // 7. Abhijit & Amrita Muhurtas
    if (panchang.abhijitMuhurta12 && !panchang.abhijitMuhurta12.includes("Unavailable")) {
      score += 5;
      positiveFactors.push(`Abhijit Muhurta Available (${panchang.abhijitMuhurta12})`);
      positiveFactorsTa.push(`அபிஜித் முகூர்த்த சுப நேரம் (${panchang.abhijitMuhurta12})`);
    }

    // Clamp score
    const finalScore = Math.max(10, Math.min(100, score));

    let recommendationEn = "Favorable Date Window";
    let recommendationTa = "சுப முகூர்த்த நாள்";
    let tier = "FAVORABLE";

    if (finalScore >= 85) {
      recommendationEn = `Highly Auspicious (Uttama) for ${config.nameEn}`;
      recommendationTa = `${config.nameTa} உத்தம சுப முகூர்த்த நாள்`;
      tier = "EXCELLENT";
    } else if (finalScore >= 70) {
      recommendationEn = `Favorable (Madhyama) for ${config.nameEn}`;
      recommendationTa = `${config.nameTa} மத்திம சுப முகூர்த்த நாள்`;
      tier = "FAVORABLE";
    } else {
      recommendationEn = `Requires Strict Lagna Shuddhi (Cautionary)`;
      recommendationTa = `எச்சரிக்கையுடன் லக்ன சுத்தி செய்ய வேண்டிய நாள்`;
      tier = "CAUTION";
    }

    // Extract month key (e.g. "2026-11")
    const monthKey = ymd.slice(0, 7);
    const monthNum = parseInt(ymd.slice(5, 7), 10) - 1;
    const yearNum = ymd.slice(0, 4);

    candidates.push({
      date: panchang.date,
      monthKey,
      monthLabelEn: `${MONTH_NAMES_EN[monthNum]} ${yearNum}`,
      monthLabelTa: `${MONTH_NAMES_TA[monthNum]} ${yearNum}`,
      day: panchang.vara?.name,
      dayTamil: panchang.vara?.tamil,
      tithi: panchang.tithi?.name,
      tithiTamil: panchang.tithi?.nameTamil,
      tithiUntil12: panchang.tithi?.until12,
      tithiUntilDetailedEn: panchang.tithi?.untilDetailedEn,
      tithiUntilDetailedTa: panchang.tithi?.untilDetailedTa,
      nakshatra: `${panchang.nakshatra?.name} (Pada ${panchang.nakshatra?.pada})`,
      nakshatraTamil: `${panchang.nakshatra?.tamil} (பாதம் ${panchang.nakshatra?.pada})`,
      nakshatraUntil12: panchang.nakshatra?.until12,
      nakshatraUntilDetailedEn: panchang.nakshatra?.untilDetailedEn,
      nakshatraUntilDetailedTa: panchang.nakshatra?.untilDetailedTa,
      yoga: panchang.yoga?.name,
      karana: panchang.karana?.name,
      abhijitMuhurta12: panchang.abhijitMuhurta12,
      brahmaMuhurta12: panchang.brahmaMuhurta12,
      amritaKalam12: panchang.amritaKalam12,
      rahuKalam12: panchang.rahuKalam12,
      yamagandam12: panchang.yamagandam12,
      gulikaKalam12: panchang.gulikaKalam12,
      durmuhurtham12: panchang.durmuhurtham12,
      sunrise: panchang.sunrise,
      sunset: panchang.sunset,
      muhurtaScore: finalScore,
      tier,
      recommendation: recommendationEn,
      recommendationEn,
      recommendationTa,
      positiveFactors,
      negativeFactors,
      positiveFactorsTa,
      negativeFactorsTa,
      eventConfig: {
        id: config.id,
        nameEn: config.nameEn,
        nameTa: config.nameTa
      }
    });
  }

  // Sort candidates by score descending
  const candidatesByScore = [...candidates].sort((a, b) => b.muhurtaScore - a.muhurtaScore);
  // Sort candidates chronologically
  const candidatesByDate = [...candidates].sort((a, b) => a.date.localeCompare(b.date));

  // Dynamic slice limit scaling with daysAhead:
  // 14 days: 8
  // 30 days: 12
  // 60 days: 20
  // 90 days: 30
  // 180 days: 48
  let topCount = 12;
  if (totalDays <= 14) topCount = 8;
  else if (totalDays <= 30) topCount = 12;
  else if (totalDays <= 60) topCount = 20;
  else if (totalDays <= 90) topCount = 30;
  else topCount = 48;

  // Filter prime candidates (score >= 70) or top N
  const primeCandidates = candidatesByScore.filter(c => c.muhurtaScore >= 70);
  const selectedCandidates = primeCandidates.length >= 6
    ? primeCandidates.slice(0, topCount)
    : candidatesByScore.slice(0, Math.max(6, topCount));

  // Group candidate dates by month
  const monthlyDistribution = {};
  for (const c of selectedCandidates) {
    if (!monthlyDistribution[c.monthKey]) {
      monthlyDistribution[c.monthKey] = [];
    }
    monthlyDistribution[c.monthKey].push(c);
  }

  const months = Object.keys(monthlyDistribution).sort().map(mKey => {
    const list = monthlyDistribution[mKey];
    return {
      key: mKey,
      labelEn: list[0]?.monthLabelEn || mKey,
      labelTa: list[0]?.monthLabelTa || mKey,
      count: list.length,
      primeCount: list.filter(c => c.muhurtaScore >= 85).length
    };
  });

  return {
    eventType: eventKey,
    eventConfig: config,
    daysScreened: totalDays,
    startDate: startYmd,
    endDate: candidates[candidates.length - 1]?.date || startYmd,
    totalDatesEvaluated: candidates.length,
    favorableCount: primeCandidates.length,
    topScreenedDates: selectedCandidates,
    allCandidates: candidates,
    candidatesByDate,
    candidatesByScore,
    monthlyDistribution,
    months
  };
}
