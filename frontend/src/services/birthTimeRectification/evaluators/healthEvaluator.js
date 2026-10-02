/**
 * ASTROVERSE — Health & Vitality Event Evaluator
 *
 * Evaluates timing and structural alignment for health/wellness milestones:
 * 1. D1: 6th house (Roga/disease), 8th house (vulnerability), 12th house (treatment/rest), Lagna Lord, Sun
 * 2. D30 (Trimsamsha): D30 Lagna, 6th/8th house in D30, malefic placements
 * 3. Vimshottari Dasha: MD / AD / PD active at event date connected to 6H, 8H, 12H, Maraka/Badhaka lords
 * 4. Gochara (Transit): Genuine historical transit positions of Saturn and Rahu
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

export function evaluateHealthEvent(event, chartData, candidateTime) {
  const premises = [];
  const counterIndicators = [];
  const evidenceGroups = [];
  const ruleIds = [];

  const planets = Array.isArray(chartData?.planets) ? chartData.planets : [];
  const ascLong = chartData?.ascendantLong ?? chartData?.ascendant?.longitude ?? chartData?.ascendantDeg;

  if (!chartData || planets.length === 0 || !Number.isFinite(ascLong)) {
    return {
      eventId: event.id,
      category: "HEALTH_THEME",
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

  const h6Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 5) % 12]];
  const h8Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 7) % 12]];
  const h12Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 11) % 12]];
  const h2Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 1) % 12]];
  const h7Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 6) % 12]];

  const primaryHealthLords = new Set([h6Lord, h8Lord, "Saturn", "Rahu"].filter(Boolean));
  const secondaryHealthLords = new Set([h12Lord, h2Lord, h7Lord, "Mars", "Ketu"].filter(Boolean));

  // 1. D1 Natal Structure
  let d1Score = 0;
  const dusthanaPlanets = planets.filter(p => [6, 8, 12].includes(p.house));
  if (dusthanaPlanets.length > 0) {
    premises.push({ factor: `Planets placed in Dusthana houses (${dusthanaPlanets.map(p => p.name).join(", ")})`, role: "D1 Dusthana Tension" });
    ruleIds.push("HEALTH_D1_DUSTHANA_ACTIVATION");
    d1Score += 12;
  }
  const sun = planets.find(p => p.name === "Sun");
  if (sun && [6, 8, 12].includes(sun.house)) d1Score += 8;
  evidenceGroups.push({
    id: `EVD_HEALTH_D1_${event.id}`,
    category: "D1_STRUCTURE",
    score: Math.min(25, d1Score),
    weight: 0.25
  });

  // 2. D30 Trimsamsha Alignment (via Canonical Adapter)
  let d30Score = 0;
  const d30Chart = buildCanonicalVarga("D30", planets, ascLong);
  if (d30Chart && d30Chart.ascendant) {
    const d30Saturn = d30Chart.getPlanet("Saturn");
    const d30Mars = d30Chart.getPlanet("Mars");
    if (d30Saturn && [6, 8, 12, 1].includes(d30Saturn.house)) {
      premises.push({ factor: `D30 Saturn in house ${d30Saturn.house}`, role: "D30 Rogakaraka" });
      ruleIds.push("HEALTH_D30_SATURN_PROMISE");
      d30Score += 12;
    }
    if (d30Mars && [6, 8, 12].includes(d30Mars.house)) {
      d30Score += 13;
    }
  }
  evidenceGroups.push({
    id: `EVD_HEALTH_D30_${event.id}`,
    category: "D30_TRIMSAMSHA",
    score: Math.min(25, d30Score),
    weight: 0.25
  });

  // 3. Vimshottari Dasha Timing
  const dashaRes = calculateEventDashaHierarchy(event.parsedDate, chartData, primaryHealthLords, secondaryHealthLords);
  if (dashaRes.timingEvidence.length > 0) {
    premises.push(...dashaRes.timingEvidence);
    ruleIds.push(...dashaRes.ruleIds);
  } else {
    counterIndicators.push(`Operating Dasha (${dashaRes.activeMD || "—"}/${dashaRes.activeAD || "—"}) lacks 6H/8H/12H alignment`);
  }
  evidenceGroups.push({
    id: `EVD_HEALTH_DASHA_${event.id}`,
    category: "VIMSHOTTARI_DASHA",
    score: dashaRes.timingScore,
    weight: 0.30
  });

  // 4. Historical Transits (Saturn / Rahu)
  const transits = calculateEventTransits(event.parsedDate, chartData, chartData.system || "lahiri");
  let transitScore = 0;
  const tSat = transits.houseTransits?.Saturn;
  const tRahu = transits.houseTransits?.Rahu;
  if (tSat && [1, 6, 8, 12].includes(tSat.houseFromLagna)) {
    premises.push({ factor: `Transiting Saturn in House ${tSat.houseFromLagna} creating physical discipline/remedial pressure`, role: "Transit Saturn" });
    ruleIds.push("TRANSIT_SATURN_HEALTH");
    transitScore += 15;
  }
  if (tRahu && [1, 6, 8].includes(tRahu.houseFromLagna)) {
    transitScore += 10;
  }
  evidenceGroups.push({
    id: `EVD_HEALTH_TRANSIT_${event.id}`,
    category: "GOCHARA_TRANSIT",
    score: Math.min(25, transitScore),
    weight: 0.20
  });

  const totalPositive = evidenceGroups.reduce((acc, g) => acc + g.score, 0);
  const isContradiction = counterIndicators.length > 1 && totalPositive < 20;
  const contradictionScore = isContradiction ? 25 : (counterIndicators.length > 0 ? 10 : 0);

  return {
    eventId: event.id,
    category: "HEALTH_THEME",
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
