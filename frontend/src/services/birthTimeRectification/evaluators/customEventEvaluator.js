/**
 * ASTROVERSE — Custom / Generic Event Evaluator
 *
 * Evaluates general life events using strictly discriminating astrological triggers:
 * - Natal Ascendant Lord activation in operating Vimshottari Dasha
 * - Tight transit conjunctions/aspects (orb <= 4.0°) to Natal Ascendant
 * - Zero unconditional or existence-based points.
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

export function evaluateCustomEvent(event, chartData, candidateTime) {
  const premises = [];
  const counterIndicators = [];
  const evidenceGroups = [];
  const ruleIds = [];

  const planets = Array.isArray(chartData?.planets) ? chartData.planets : [];
  const ascLong = chartData?.ascendantLong ?? chartData?.ascendant?.longitude ?? chartData?.ascendantDeg;

  if (!chartData || planets.length === 0 || !Number.isFinite(ascLong)) {
    return {
      eventId: event.id,
      category: "OTHER",
      positiveScore: 0,
      contradictionScore: 0,
      premises: [],
      counterIndicators: ["Chart data or Ascendant unavailable"],
      evidenceGroups: [],
      ruleIds: [],
      isContradiction: false,
      status: "INSUFFICIENT_DATA"
    };
  }

  const ascSignIdx = Math.floor(norm360(ascLong) / 30);
  const ascSign = SIGN_ORDER[ascSignIdx];
  const lagnaLord = SIGN_LORDS[ascSign];

  // 1. D1 Lagna Lord Activity (Only if Lagna Lord is explicitly involved)
  let d1Score = 0;
  const h10Lord = SIGN_LORDS[SIGN_ORDER[(ascSignIdx + 9) % 12]];
  const primaryLords = new Set([lagnaLord, h10Lord].filter(Boolean));

  // 2. D9 Lagna Resonance
  let d9Score = 0;
  const d9Chart = buildCanonicalVarga("D9", planets, ascLong);
  if (d9Chart?.ascendant?.sign === ascSign) {
    premises.push({ factor: `D9 Navamsha Lagna resonates with D1 natal Ascendant (${ascSign})`, role: "Varga Resonance" });
    ruleIds.push("CUSTOM_D9_LAGNA_RESONANCE");
    d9Score += 10;
  }
  evidenceGroups.push({
    id: `EVD_CUSTOM_D9_${event.id}`,
    category: "D9_NAVAMSHA",
    score: Math.min(20, d9Score),
    weight: 0.25
  });

  // 3. Vimshottari Dasha Timing (Requires Lagna / 10th Lord Connectivity)
  const dashaRes = calculateEventDashaHierarchy(event.parsedDate, chartData, primaryLords);
  if (dashaRes.timingScore > 0) {
    premises.push(...dashaRes.timingEvidence);
    ruleIds.push(...dashaRes.ruleIds);
  }
  evidenceGroups.push({
    id: `EVD_CUSTOM_DASHA_${event.id}`,
    category: "VIMSHOTTARI_DASHA",
    score: dashaRes.timingScore,
    weight: 0.35
  });

  // 4. Historical Transits (Only tight aspects to Natal Ascendant within <= 4.0°)
  const transits = calculateEventTransits(event.parsedDate, chartData, chartData.system || "lahiri");
  let transitScore = 0;
  const ascAspects = (transits.aspectHits || []).filter(a => a.natalTarget === "Ascendant" && a.isTightOrb);

  if (ascAspects.length > 0) {
    for (const hit of ascAspects) {
      premises.push({
        factor: `Transiting ${hit.transitingPlanet} forms tight ${hit.aspectName} to Natal Ascendant (${hit.orb}° orb)`,
        role: "Gochara Lagna Alignment"
      });
      ruleIds.push(`TRANSIT_${hit.transitingPlanet.toUpperCase()}_ASC_HIT`);
      transitScore += 15;
    }
  }
  evidenceGroups.push({
    id: `EVD_CUSTOM_TRANSIT_${event.id}`,
    category: "GOCHARA_TRANSIT",
    score: Math.min(25, transitScore),
    weight: 0.25
  });

  const totalPositive = evidenceGroups.reduce((acc, g) => acc + g.score, 0);

  return {
    eventId: event.id,
    category: "OTHER",
    positiveScore: totalPositive,
    contradictionScore: 0,
    premises,
    counterIndicators,
    evidenceGroups,
    ruleIds,
    isContradiction: false,
    status: totalPositive > 0 ? "EVALUATED" : "INSUFFICIENT_EVENT_RULES"
  };
}
