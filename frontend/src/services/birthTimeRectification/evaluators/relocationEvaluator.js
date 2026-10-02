/**
 * ASTROVERSE — Relocation & Travel Event Evaluator
 *
 * Evaluates timing and structural alignment for relocation and travel milestones:
 * 1. D1: 4th house (domestic residence), 9th house (long distance), 12th house (foreign/distant stay), Moon, Rahu
 * 2. D12/D9: Varga alignment for journeys and displacement
 * 3. Vimshottari Dasha: MD / AD / PD active at event date connected to 4H, 9H, 12H, Rahu, Moon
 * 4. Gochara (Transit): Genuine historical transit positions of Rahu, Saturn, Jupiter
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

export function evaluateRelocationEvent(event, chartData, candidateTime) {
  const premises = [];
  const counterIndicators = [];
  const evidenceGroups = [];
  const ruleIds = [];

  const planets = Array.isArray(chartData?.planets) ? chartData.planets : [];
  const ascLong = chartData?.ascendantLong ?? chartData?.ascendant?.longitude ?? chartData?.ascendantDeg;

  if (!chartData || planets.length === 0 || !Number.isFinite(ascLong)) {
    return {
      eventId: event.id,
      category: "RELOCATION",
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
  const h9Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 8) % 12]];
  const h12Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 11) % 12]];

  const primaryRelocLords = new Set([h9Lord, h12Lord, "Rahu"].filter(Boolean));
  const secondaryRelocLords = new Set([h4Lord, "Moon", "Saturn", "Jupiter"].filter(Boolean));

  // 1. D1 Natal Structure
  let d1Score = 0;
  const rahu = planets.find(p => p.name === "Rahu");
  const moon = planets.find(p => p.name === "Moon");
  if (rahu && [3, 9, 12].includes(rahu.house)) {
    premises.push({ factor: `Rahu in mobility house (${rahu.house})`, role: "D1 Foreign Karaka" });
    ruleIds.push("RELOC_D1_RAHU_PROMISE");
    d1Score += 10;
  }
  if (moon && [3, 9, 12].includes(moon.house)) d1Score += 10;
  evidenceGroups.push({
    id: `EVD_RELOC_D1_${event.id}`,
    category: "D1_STRUCTURE",
    score: Math.min(25, d1Score),
    weight: 0.25
  });

  // 2. D12 / D9 Alignment
  let vargaScore = 0;
  const d9Chart = buildCanonicalVarga("D9", planets, ascLong);
  if (d9Chart && d9Chart.ascendant) {
    const d9Rahu = d9Chart.getPlanet("Rahu");
    if (d9Rahu && [3, 9, 12].includes(d9Rahu.house)) {
      vargaScore += 15;
    }
  }
  evidenceGroups.push({
    id: `EVD_RELOC_VARGA_${event.id}`,
    category: "D9_D12_VARGA",
    score: Math.min(25, vargaScore),
    weight: 0.25
  });

  // 3. Vimshottari Dasha Timing
  const dashaRes = calculateEventDashaHierarchy(event.parsedDate, chartData, primaryRelocLords, secondaryRelocLords);
  if (dashaRes.timingEvidence.length > 0) {
    premises.push(...dashaRes.timingEvidence);
    ruleIds.push(...dashaRes.ruleIds);
  } else {
    counterIndicators.push(`Operating Dasha (${dashaRes.activeMD || "—"}/${dashaRes.activeAD || "—"}) lacks 9H/12H/Rahu relocation alignment`);
  }
  evidenceGroups.push({
    id: `EVD_RELOC_DASHA_${event.id}`,
    category: "VIMSHOTTARI_DASHA",
    score: dashaRes.timingScore,
    weight: 0.30
  });

  // 4. Historical Transits
  const transits = calculateEventTransits(event.parsedDate, chartData, chartData.system || "lahiri");
  let transitScore = 0;
  const tRahu = transits.houseTransits?.Rahu;
  const tSat = transits.houseTransits?.Saturn;
  if (tRahu && [3, 4, 9, 12].includes(tRahu.houseFromLagna)) {
    premises.push({ factor: `Transiting Rahu in House ${tRahu.houseFromLagna} causing regional shift`, role: "Transit Rahu" });
    ruleIds.push("TRANSIT_RAHU_RELOC");
    transitScore += 15;
  }
  if (tSat && [4, 9, 12].includes(tSat.houseFromLagna)) {
    transitScore += 10;
  }
  evidenceGroups.push({
    id: `EVD_RELOC_TRANSIT_${event.id}`,
    category: "GOCHARA_TRANSIT",
    score: Math.min(25, transitScore),
    weight: 0.20
  });

  const totalPositive = evidenceGroups.reduce((acc, g) => acc + g.score, 0);
  const isContradiction = counterIndicators.length > 1 && totalPositive < 20;
  const contradictionScore = isContradiction ? 25 : (counterIndicators.length > 0 ? 10 : 0);

  return {
    eventId: event.id,
    category: "RELOCATION",
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
