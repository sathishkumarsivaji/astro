/**
 * ASTROVERSE — Education & Academic Milestone Event Evaluator
 *
 * Evaluates timing and structural alignment for education events:
 * 1. D1: 4th house (Vidya), 5th house (intellect), 9th house (higher learning), Mercury, Jupiter
 * 2. D24 (Chaturvimshamsha): D24 Lagna, 4th/5th house in D24, Mercury and Jupiter in D24
 * 3. Vimshottari Dasha: MD / AD / PD active at event date connected to 4H, 5H, 9H, Mercury, Jupiter
 * 4. Gochara (Transit): Genuine historical transit positions of Mercury & Jupiter at event date
 */

import { buildCanonicalVarga } from "../engine/rectificationVargaAdapter.js";
import { calculateEventTransits } from "../engine/transitCalculator.js";
import { calculateEventDashaHierarchy } from "../engine/dashaTimingCalculator.js";
import { norm360 } from "../../astroEngine.js";

const SIGN_LORDS = {
  "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
  "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
  "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
};

const SIGN_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export function evaluateEducationEvent(event, chartData, candidateTime) {
  const premises = [];
  const counterIndicators = [];
  const evidenceGroups = [];
  const ruleIds = [];

  const planets = Array.isArray(chartData?.planets) ? chartData.planets : [];
  const ascLong = chartData?.ascendantLong ?? chartData?.ascendant?.longitude ?? chartData?.ascendantDeg;

  if (!chartData || planets.length === 0 || !Number.isFinite(ascLong)) {
    return {
      eventId: event.id,
      category: "EDUCATION",
      positiveScore: 0,
      contradictionScore: 0,
      premises: [],
      counterIndicators: ["Ascendant or planetary positions unavailable"],
      evidenceGroups: [],
      ruleIds: [],
      isContradiction: false,
      status: "INSUFFICIENT_DATA"
    };
  }

  const ascSignIdx = Math.floor(norm360(ascLong) / 30);

  const h4Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 3) % 12]];
  const h5Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 4) % 12]];
  const h9Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 8) % 12]];

  const primaryEduLords = new Set([h4Lord, h5Lord, "Mercury", "Jupiter"].filter(Boolean));
  const secondaryEduLords = new Set([h9Lord, "Sun", "Venus"].filter(Boolean));

  // 1. D1 Natal Structure
  let d1Score = 0;
  const mercury = planets.find(p => p.name === "Mercury");
  const jupiter = planets.find(p => p.name === "Jupiter");
  if (mercury && [1, 4, 5, 9, 10, 11].includes(mercury.house)) d1Score += 10;
  if (jupiter && [1, 4, 5, 9, 11].includes(jupiter.house)) d1Score += 10;
  evidenceGroups.push({
    id: `EVD_EDU_D1_${event.id}`,
    category: "D1_STRUCTURE",
    score: Math.min(25, d1Score),
    weight: 0.25
  });

  // 2. D24 Chaturvimshamsha Alignment (via Canonical Adapter)
  let d24Score = 0;
  const d24Chart = buildCanonicalVarga("D24", planets, ascLong);
  if (d24Chart && d24Chart.ascendant) {
    const d24Mercury = d24Chart.getPlanet("Mercury");
    const d24Jupiter = d24Chart.getPlanet("Jupiter");

    if (d24Mercury && [1, 4, 5, 9, 10, 11].includes(d24Mercury.house)) {
      premises.push({ factor: `D24 Mercury well-placed in House ${d24Mercury.house}`, role: "D24 Vidya Karaka" });
      ruleIds.push("EDU_D24_MERCURY_PROMISE");
      d24Score += 12;
    }
    if (d24Jupiter && [1, 4, 5, 9, 11].includes(d24Jupiter.house)) {
      premises.push({ factor: `D24 Jupiter in House ${d24Jupiter.house}`, role: "D24 Guru Karaka" });
      ruleIds.push("EDU_D24_JUPITER_PROMISE");
      d24Score += 13;
    }
  }
  evidenceGroups.push({
    id: `EVD_EDU_D24_${event.id}`,
    category: "D24_CHATURVIMSHAMSHA",
    score: Math.min(25, d24Score),
    weight: 0.25
  });

  // 3. Vimshottari Dasha Timing
  const dashaRes = calculateEventDashaHierarchy(event.parsedDate, chartData, primaryEduLords, secondaryEduLords);
  if (dashaRes.timingEvidence.length > 0) {
    premises.push(...dashaRes.timingEvidence);
    ruleIds.push(...dashaRes.ruleIds);
  } else {
    counterIndicators.push(`Operating Dasha (${dashaRes.activeMD || "—"}/${dashaRes.activeAD || "—"}) lacks 4H/5H/Mercury alignment`);
  }
  evidenceGroups.push({
    id: `EVD_EDU_DASHA_${event.id}`,
    category: "VIMSHOTTARI_DASHA",
    score: dashaRes.timingScore,
    weight: 0.30
  });

  // 4. Historical Transits
  const transits = calculateEventTransits(event.parsedDate, chartData, chartData.system || "lahiri");
  let transitScore = 0;
  const jup = transits.houseTransits?.Jupiter;
  const merc = transits.houseTransits?.Mercury;
  if (jup && [1, 4, 5, 9, 10, 11].includes(jup.houseFromLagna)) {
    premises.push({ factor: `Transiting Jupiter in House ${jup.houseFromLagna} blessing scholastic achievements`, role: "Transit Jupiter" });
    ruleIds.push("TRANSIT_JUPITER_EDU");
    transitScore += 15;
  }
  if (merc && [1, 4, 5, 10, 11].includes(merc.houseFromLagna)) {
    transitScore += 10;
  }
  evidenceGroups.push({
    id: `EVD_EDU_TRANSIT_${event.id}`,
    category: "GOCHARA_TRANSIT",
    score: Math.min(25, transitScore),
    weight: 0.20
  });

  const totalPositive = evidenceGroups.reduce((acc, g) => acc + g.score, 0);
  const isContradiction = counterIndicators.length > 1 && totalPositive < 20;
  const contradictionScore = isContradiction ? 25 : (counterIndicators.length > 0 ? 10 : 0);

  return {
    eventId: event.id,
    category: "EDUCATION",
    positiveScore: totalPositive,
    contradictionScore,
    premises,
    counterIndicators,
    evidenceGroups,
    ruleIds,
    isContradiction,
    status: "EVALUATED"
  };
}
