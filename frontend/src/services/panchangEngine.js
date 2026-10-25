/**
 * ASTROVERSE — High-Precision Vedic Panchanga & Timing Enrichment Engine
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
  calculateEventMuhurta,
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

function formatDecimalHours24(h) {
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

export function searchAuspiciousMuhurtas(eventType, startDate, daysAhead = 30, lat = null, lng = null, tz = null, timezoneId = null) {
  const startYmd = (typeof startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startDate))
    ? startDate
    : new Date().toISOString().split("T")[0];

  const totalDays = Math.max(1, Math.min(365, parseInt(daysAhead, 10) || 30));
  const startD = new Date(startYmd + "T12:00:00Z");
  const candidates = [];

  for (let i = 0; i <= totalDays; i++) {
    const cur = new Date(startD.getTime() + i * 86400000);
    const ymd = cur.toISOString().split("T")[0];
    const panchang = calculateEnrichedDailyPanchang(ymd, lat, lng, tz, timezoneId);

    let score = 70;
    const positiveFactors = [];
    const negativeFactors = [];

    if (panchang.yoga?.isAuspicious) {
      score += 10;
      positiveFactors.push(`Auspicious Yoga (${panchang.yoga.name})`);
    } else {
      score -= 15;
      negativeFactors.push(`Inauspicious Yoga (${panchang.yoga.name})`);
    }

    if (!panchang.karana?.isBhadra) {
      score += 10;
      positiveFactors.push("Free from Vishti/Bhadra Karana");
    } else {
      score -= 20;
      negativeFactors.push("Vishti (Bhadra) Karana present");
    }

    const tNum = (panchang.tithi?.index || 1) % 15;
    if ([4, 9, 14, 0].includes(tNum)) {
      score -= 20;
      negativeFactors.push(`Rikta / Forbidden Tithi (${panchang.tithi?.name})`);
    } else {
      score += 10;
      positiveFactors.push(`Benefic Tithi (${panchang.tithi?.name})`);
    }

    if (eventType.toLowerCase() === "marriage" && ["Ravivara (Sunday)", "Shanivara (Saturday)", "Mangalavara (Tuesday)"].some(v => panchang.vara?.name?.includes(v.split(" ")[0]))) {
      score -= 5;
    }

    let recommendation = "Favorable Date Window";
    if (score >= 85) recommendation = "Favorable Panchanga Date (Preliminary Screening)";
    else if (score >= 70) recommendation = "Moderate Panchanga Date (Preliminary Screening)";
    else recommendation = "Challenging Panchanga Factors (Requires Exact Lagna Shuddhi)";

    candidates.push({
      date: panchang.date,
      day: panchang.vara?.name,
      dayTamil: panchang.vara?.tamil,
      tithi: panchang.tithi?.name,
      tithiTamil: panchang.tithi?.nameTamil,
      tithiUntil12: panchang.tithi?.until12,
      nakshatra: `${panchang.nakshatra?.name} (Pada ${panchang.nakshatra?.pada})`,
      nakshatraTamil: panchang.nakshatra?.tamil,
      nakshatraUntil12: panchang.nakshatra?.until12,
      yoga: panchang.yoga?.name,
      karana: panchang.karana?.name,
      abhijitMuhurta12: panchang.abhijitMuhurta12,
      rahuKalam12: panchang.rahuKalam12,
      yamagandam12: panchang.yamagandam12,
      gulikaKalam12: panchang.gulikaKalam12,
      durmuhurtham12: panchang.durmuhurtham12,
      amritaKalam12: panchang.amritaKalam12,
      muhurtaScore: score,
      recommendation,
      positiveFactors,
      negativeFactors
    });
  }

  candidates.sort((a, b) => b.muhurtaScore - a.muhurtaScore);
  return {
    eventType,
    daysScreened: totalDays,
    totalDatesEvaluated: candidates.length,
    topScreenedDates: candidates.slice(0, 6),
    allCandidates: candidates
  };
}
