/**
 * ASTROVERSE — Financial Milestone Event Evaluator
 *
 * Evaluates timing and structural alignment for financial gains, investments, and wealth milestones:
 * 1. D1: 2nd house (Dhana), 11th house (Labha), 5th/9th houses (Lakshmi sthanas), Jupiter, Venus, Mercury
 * 2. D2 (Hora) & D9 (Navamsha): Wealth alignments in divisional charts
 * 3. Vimshottari Dasha: MD / AD / PD active at event date connected to 2H, 11H, 5H, 9H, Jupiter, Venus
 * 4. Gochara (Transit): Genuine historical transit positions of Jupiter and Venus
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

export function evaluateFinancialMilestoneEvent(event, chartData, candidateTime) {
  const premises = [];
  const counterIndicators = [];
  const evidenceGroups = [];
  const ruleIds = [];

  const planets = Array.isArray(chartData?.planets) ? chartData.planets : [];
  const ascLong = chartData?.ascendantLong ?? chartData?.ascendant?.longitude ?? chartData?.ascendantDeg;

  if (!chartData || planets.length === 0 || !Number.isFinite(ascLong)) {
    return {
      eventId: event.id,
      category: "MAJOR_FINANCIAL_EVENT",
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

  const h2Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 1) % 12]];
  const h11Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 10) % 12]];
  const h5Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 4) % 12]];
  const h9Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 8) % 12]];

  const primaryFinLords = new Set([h2Lord, h11Lord, "Jupiter"].filter(Boolean));
  const secondaryFinLords = new Set([h5Lord, h9Lord, "Venus", "Mercury"].filter(Boolean));

  // 1. D1 Natal Structure
  let d1Score = 0;
  const jupiter = planets.find(p => p.name === "Jupiter");
  const venus = planets.find(p => p.name === "Venus");
  if (jupiter && [1, 2, 5, 9, 11].includes(jupiter.house)) d1Score += 12;
  if (venus && [1, 2, 4, 5, 9, 11].includes(venus.house)) d1Score += 8;
  evidenceGroups.push({
    id: `EVD_FIN_D1_${event.id}`,
    category: "D1_STRUCTURE",
    score: Math.min(25, d1Score),
    weight: 0.25
  });

  // 2. D2 / D9 Varga Alignment
  let vargaScore = 0;
  const d9Chart = buildCanonicalVarga("D9", planets, ascLong);
  if (d9Chart && d9Chart.ascendant) {
    const d9Jup = d9Chart.getPlanet("Jupiter");
    if (d9Jup && [1, 2, 5, 9, 11].includes(d9Jup.house)) {
      vargaScore += 15;
    }
  }
  evidenceGroups.push({
    id: `EVD_FIN_VARGA_${event.id}`,
    category: "D2_D9_VARGA",
    score: Math.min(25, vargaScore),
    weight: 0.25
  });

  // 3. Vimshottari Dasha Timing
  const dashaRes = calculateEventDashaHierarchy(event.parsedDate, chartData, primaryFinLords, secondaryFinLords);
  if (dashaRes.timingEvidence.length > 0) {
    premises.push(...dashaRes.timingEvidence);
    ruleIds.push(...dashaRes.ruleIds);
  } else {
    counterIndicators.push(`Operating Dasha (${dashaRes.activeMD || "—"}/${dashaRes.activeAD || "—"}) lacks 2H/11H financial alignment`);
  }
  evidenceGroups.push({
    id: `EVD_FIN_DASHA_${event.id}`,
    category: "VIMSHOTTARI_DASHA",
    score: dashaRes.timingScore,
    weight: 0.30
  });

  // 4. Historical Transits
  const transits = calculateEventTransits(event.parsedDate, chartData, chartData.system || "lahiri");
  let transitScore = 0;
  const tJup = transits.houseTransits?.Jupiter;
  if (tJup && [1, 2, 5, 9, 11].includes(tJup.houseFromLagna)) {
    premises.push({ factor: `Transiting Jupiter in House ${tJup.houseFromLagna} conferring financial prosperity`, role: "Transit Jupiter" });
    ruleIds.push("TRANSIT_JUPITER_FIN");
    transitScore += 15;
  }
  evidenceGroups.push({
    id: `EVD_FIN_TRANSIT_${event.id}`,
    category: "GOCHARA_TRANSIT",
    score: Math.min(25, transitScore),
    weight: 0.20
  });

  const totalPositive = evidenceGroups.reduce((acc, g) => acc + g.score, 0);
  const isContradiction = counterIndicators.length > 1 && totalPositive < 20;
  const contradictionScore = isContradiction ? 25 : (counterIndicators.length > 0 ? 10 : 0);

  return {
    eventId: event.id,
    category: "MAJOR_FINANCIAL_EVENT",
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
