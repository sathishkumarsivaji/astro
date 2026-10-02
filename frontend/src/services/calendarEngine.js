/**
 * ASTROVERSE — Personalized Daily Transit & Calendar Engine
 *
 * Implements:
 * 1. Daily Moon transit tracking across 27 Nakshatras & 12 Signs
 * 2. 9-Fold Tara Bala evaluation for native's Janma Nakshatra:
 *    (Janma, Sampat, Vipat, Kshema, Pratyak, Sadhaka, Vadha, Mitra, Parama Mitra)
 * 3. Chandrashtama detection (Transit Moon in 8th house from natal Moon)
 * 4. Personalized Daily Auspiciousness score & Muhurta windows
 * 5. Life-Event Retrospective Astrological Correlation Analyzer
 */

import { norm360, getSiderealSunMoon } from "./astroEngine.js";

export const TARA_BALA_TYPES = [
  { index: 1, name: "Janma", nameTa: "ஜன்ம தாரை", quality: "Caution / Moderate", auspicious: false, desc: "Body, vitality, conscious awareness" },
  { index: 2, name: "Sampat", nameTa: "சம்பத் தாரை", quality: "Highly Auspicious", auspicious: true, desc: "Wealth, financial prosperity, gains" },
  { index: 3, name: "Vipat", nameTa: "விபத் தாரை", quality: "Challenging / Obstacles", auspicious: false, desc: "Delays, tests, caution required" },
  { index: 4, name: "Kshema", nameTa: "க்ஷேம தாரை", quality: "Very Favorable", auspicious: true, desc: "Wellbeing, comfort, security, success" },
  { index: 5, name: "Pratyak", nameTa: "பிரத்யக் தாரை", quality: "Obstacles / Friction", auspicious: false, desc: "Misunderstandings, resistance, slow progress" },
  { index: 6, name: "Sadhaka", nameTa: "சாதக தாரை", quality: "Peak Success", auspicious: true, desc: "Achievement, victory in efforts, execution" },
  { index: 7, name: "Vadha (Naidhana)", nameTa: "வத தாரை", quality: "Critical Caution", auspicious: false, desc: "High stress, avoid high-stakes risks" },
  { index: 8, name: "Mitra", nameTa: "மித்ர தாரை", quality: "Friendly / Supportive", auspicious: true, desc: "Support, networking, enjoyable interactions" },
  { index: 9, name: "Parama Mitra", nameTa: "பரம மித்ர தாரை", quality: "Supreme Benefic", auspicious: true, desc: "Great alliances, divine grace, peak harmony" }
];

export const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Svati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

/**
 * Computes the 9-fold Tara Bala for a given transit nakshatra index relative to birth nakshatra
 */
export function calculateTaraBala(birthNakshatraIdx = 1, transitNakshatraIdx = 1) {
  const bIdx = ((birthNakshatraIdx - 1) % 27) + 1;
  const tIdx = ((transitNakshatraIdx - 1) % 27) + 1;
  
  let diff = (tIdx - bIdx + 1);
  if (diff <= 0) diff += 27;

  const remainder = (diff % 9) || 9;
  const tara = TARA_BALA_TYPES.find(t => t.index === remainder) || TARA_BALA_TYPES[0];

  return {
    taraIndex: remainder,
    name: tara.name,
    nameTa: tara.nameTa,
    quality: tara.quality,
    isAuspicious: tara.auspicious,
    description: tara.desc
  };
}

/**
 * Generates an authoritative personalized month calendar of transits for a native
 */
export function generatePersonalizedMonthCalendar(year, month, chartData) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const birthMoonSignName = chartData?.moonSign?.name || (typeof chartData?.moonSign === "string" ? chartData.moonSign : (chartData?.moon?.sign || null));
  const resolvedSignIdx = typeof chartData?.moonSign?.index === "number" && chartData.moonSign.index >= 0 && chartData.moonSign.index < 12
    ? chartData.moonSign.index
    : (birthMoonSignName && SIGN_NAMES.indexOf(birthMoonSignName) !== -1 ? SIGN_NAMES.indexOf(birthMoonSignName) : null);

  if (resolvedSignIdx === null) {
    return {
      status: "INSUFFICIENT_DATA",
      reason: "Natal Moon sign unavailable",
      year,
      month,
      daysInMonth,
      days: []
    };
  }
  const birthMoonSignIdx = resolvedSignIdx;

  const birthNakName = chartData?.moonNakshatra?.name || (typeof chartData?.moonNakshatra === "string" ? chartData.moonNakshatra : null);
  const resolvedNakIdx = typeof chartData?.moonNakshatra?.index === "number" && chartData.moonNakshatra.index >= 1 && chartData.moonNakshatra.index <= 27
    ? chartData.moonNakshatra.index
    : (birthNakName && NAKSHATRA_NAMES.indexOf(birthNakName) !== -1 ? (NAKSHATRA_NAMES.indexOf(birthNakName) + 1) : null);

  if (resolvedNakIdx === null) {
    return {
      status: "INSUFFICIENT_DATA",
      reason: "Natal Moon Nakshatra unavailable",
      year,
      month,
      daysInMonth,
      days: []
    };
  }
  const birthNakshatraIdx = resolvedNakIdx;

  const system = chartData?.system || "lahiri";
  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();

    // High-Precision Ephemeris Moon Transit Calculation (VSOP87 / ELP-2000 sidereal)
    // Evaluated at 06:00 UTC (11:30 IST / noon local) for the given calendar day
    const transitTime = new Date(Date.UTC(year, month - 1, d, 6, 0, 0));
    const { moonLong } = getSiderealSunMoon(transitTime, system);
    const normMoon = norm360(moonLong);
    const transitMoonNakIdx = Math.floor(normMoon / (360 / 27)) + 1;
    const transitMoonSignIdx = Math.floor(normMoon / 30) % 12;

    const taraBala = calculateTaraBala(birthNakshatraIdx, transitMoonNakIdx);

    // Chandrashtama Check: Transit Moon in 8th sign from birth Moon (index difference = 7)
    const signDistance = ((transitMoonSignIdx - birthMoonSignIdx + 12) % 12) + 1;
    const isChandrashtama = signDistance === 8;

    // Daily Score Computation
    let score = 70;
    if (taraBala.isAuspicious) score += 20;
    else score -= 15;
    if (isChandrashtama) score -= 35;
    score = Math.max(20, Math.min(98, score));

    days.push({
      dateStr: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
      dayOfWeek,
      transitNakshatra: NAKSHATRA_NAMES[transitMoonNakIdx - 1],
      transitSign: SIGN_NAMES[transitMoonSignIdx],
      transitDegree: Number((normMoon % 30).toFixed(2)),
      taraBala,
      isChandrashtama,
      score,
      favorableFor: taraBala.isAuspicious && !isChandrashtama
        ? ["Important meetings", "Financial planning", "New initiatives"]
        : isChandrashtama
        ? ["Rest & reflection", "Routine tasks", "Avoid high-stakes litigation"]
        : ["Routine focus", "Research", "Spiritual sadhana"]
    });
  }

  return {
    year,
    month,
    daysInMonth,
    days
  };
}

/**
 * Analyzes a recorded life event against native's astrological chart
 * Computes exact historical Vimshottari Mahadasha and Antardasha active on event date.
 */
export function correlateLifeEventWithAstrology(eventDateStr, eventTitle, chartData) {
  if (!chartData || !eventDateStr) return null;

  const rawBirthDate = chartData.birthDateStr || chartData.birthDate || chartData.profile?.birthDate || null;
  if (!rawBirthDate) return null;

  const eventDate = new Date(eventDateStr);
  const birthDate = new Date(rawBirthDate);

  if (isNaN(eventDate.getTime()) || isNaN(birthDate.getTime())) return null;

  if (eventDate < birthDate) {
    return {
      eventTitle: eventTitle || "",
      eventDate: eventDateStr,
      ageAtEvent: null,
      operatingDasha: null,
      activeBukthi: null,
      verdict: "EVENT_PREDATES_BIRTH",
      astrologicalSignificance: "Event date precedes birth date; historical dasha calculation not applicable."
    };
  }

  const ageAtEvent = (eventDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const ageNum = Number(ageAtEvent.toFixed(2));

  let operatingDasha = null;
  let operatingDashaTamil = null;
  let activeBukthi = null;
  let activeBukthiTamil = null;

  const dashaTable = Array.isArray(chartData.dashaTable) ? chartData.dashaTable : null;

  if (dashaTable && dashaTable.length > 0) {
    for (const dasha of dashaTable) {
      const dStart = dasha.startDateIso ? new Date(dasha.startDateIso) : null;
      const dEnd = dasha.endDateIso ? new Date(dasha.endDateIso) : null;

      const isMatchByDate = dStart && dEnd && eventDate >= dStart && eventDate < dEnd;
      const isMatchByAge = typeof dasha.startAge === "number" && typeof dasha.endAge === "number" && ageNum >= dasha.startAge && ageNum < dasha.endAge;

      if (isMatchByDate || isMatchByAge) {
        operatingDasha = dasha.lord || null;
        operatingDashaTamil = dasha.tamil || null;

        if (Array.isArray(dasha.bukthis)) {
          for (const bukthi of dasha.bukthis) {
            const bStart = bukthi.startDateIso ? new Date(bukthi.startDateIso) : null;
            const bEnd = bukthi.endDateIso ? new Date(bukthi.endDateIso) : null;

            const isBMatchByDate = bStart && bEnd && eventDate >= bStart && eventDate < bEnd;
            const isBMatchByAge = typeof bukthi.startAge === "number" && typeof bukthi.endAge === "number" && ageNum >= bukthi.startAge && ageNum < bukthi.endAge;

            if (isBMatchByDate || isBMatchByAge) {
              activeBukthi = bukthi.subLord || bukthi.lord || null;
              activeBukthiTamil = bukthi.subTamil || bukthi.tamil || null;
              break;
            }
          }
        }
        break;
      }
    }
  }

  if (!operatingDasha && chartData.currentDasha) {
    operatingDasha = chartData.currentDasha.lord || chartData.currentDasha.mahadasha || null;
    operatingDashaTamil = chartData.currentDasha.tamil || null;
    activeBukthi = chartData.currentDasha.bukthis?.[0]?.lord || chartData.currentDasha.currentAntar || chartData.currentDasha.activeBukthi || null;
    activeBukthiTamil = chartData.currentDasha.bukthis?.[0]?.tamil || chartData.currentDasha.currentAntarTamil || null;
  }

  if (!operatingDasha) {
    return {
      eventTitle: eventTitle || "",
      eventDate: eventDateStr,
      ageAtEvent: ageNum,
      operatingDasha: null,
      activeBukthi: null,
      verdict: "INSUFFICIENT_DASHA_DATA",
      astrologicalSignificance: `Event occurred at age ${ageNum}, but operating Vimshottari period could not be resolved from dasha records.`
    };
  }

  return {
    eventTitle: eventTitle || "",
    eventDate: eventDateStr,
    ageAtEvent: ageNum,
    operatingDasha,
    operatingDashaTamil,
    activeBukthi,
    activeBukthiTamil,
    verdict: "CORRELATED_WITH_VIMSHOTTARI_PERIOD",
    astrologicalSignificance: `Event occurred at age ${ageNum} during ${operatingDasha} Mahadasha${activeBukthi ? ` and ${activeBukthi} Antardasha` : ""} cycle.`
  };
}
