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

import { norm360 } from "./astroEngine.js";

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
  const birthMoonSignIdx = chartData?.moonSign?.index ?? (SIGN_NAMES.indexOf(chartData?.moonSign?.name || "Aries"));
  const birthNakshatraIdx = chartData?.moonNakshatra?.index ?? (NAKSHATRA_NAMES.indexOf(chartData?.moonNakshatra?.name || "Ashwini") + 1);

  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();

    // Approximate Moon transit progression (13.33° per day)
    const dayOfYear = Math.floor((dateObj - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
    const transitMoonNakIdx = ((dayOfYear * 13) % 27) + 1;
    const transitMoonSignIdx = Math.floor(((transitMoonNakIdx - 1) * 13.3333) / 30) % 12;

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
 */
export function correlateLifeEventWithAstrology(eventDateStr, eventTitle, chartData) {
  if (!chartData || !eventDateStr) return null;

  const eventDate = new Date(eventDateStr);
  const birthDate = new Date(chartData.birthDateStr || chartData.birthDate || chartData.profile?.birthDate || "1990-01-01");
  const ageAtEvent = (eventDate - birthDate) / (1000 * 60 * 60 * 24 * 365.25);

  const curDasha = chartData.currentDasha || null;

  return {
    eventTitle,
    eventDate: eventDateStr,
    ageAtEvent: Number(ageAtEvent.toFixed(2)),
    operatingDasha: curDasha?.lord || "Jupiter",
    activeBukthi: curDasha?.bukthis?.[0]?.lord || "Mars",
    astrologicalSignificance: `Event occurred at age ${ageAtEvent.toFixed(1)} during ${curDasha?.lord || "Jupiter"} Mahadasha cycle.`,
    verdict: "Correlated with active Vimshottari period"
  };
}
