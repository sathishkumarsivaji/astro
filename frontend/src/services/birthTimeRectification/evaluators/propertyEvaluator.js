/**
 * ASTROVERSE — Property, Real Estate & Conveyance Event Evaluator
 *
 * Evaluates timing and structural alignment for property events:
 * 1. D1: 4th house (Bhumi/Griha), 4th lord, Mars (Bhoomi Karaka), Venus (Comforts/Vahana)
 * 2. D4 (Chaturthamsha): D4 Lagna, 4th house in D4, Mars and Venus in D4
 * 3. Vimshottari Dasha: MD / AD / PD active at event date connected to 4H, 4th lord, Mars, Venus
 * 4. Gochara (Transit): Genuine historical transit positions of Mars and Jupiter
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

export function evaluatePropertyEvent(event, chartData, candidateTime) {
  const premises = [];
  const counterIndicators = [];
  const evidenceGroups = [];
  const ruleIds = [];

  const planets = Array.isArray(chartData?.planets) ? chartData.planets : [];
  const ascLong = chartData?.ascendantLong ?? chartData?.ascendant?.longitude ?? chartData?.ascendantDeg;

  if (!chartData || planets.length === 0 || !Number.isFinite(ascLong)) {
    return {
      eventId: event.id,
      category: "PROPERTY",
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
  const primaryPropLords = new Set([h4Lord, "Mars"].filter(Boolean));
  const secondaryPropLords = new Set(["Venus", "Jupiter", "Moon"].filter(Boolean));

  // 1. D1 Natal Structure
  let d1Score = 0;
  const mars = planets.find(p => p.name === "Mars");
  const venus = planets.find(p => p.name === "Venus");
  if (mars && [1, 4, 10, 11].includes(mars.house)) d1Score += 10;
  if (venus && [1, 4, 5, 9, 11].includes(venus.house)) d1Score += 10;
  evidenceGroups.push({
    id: `EVD_PROP_D1_${event.id}`,
    category: "D1_STRUCTURE",
    score: Math.min(25, d1Score),
    weight: 0.25
  });

  // 2. D4 Chaturthamsha Alignment (via Canonical Adapter)
  let d4Score = 0;
  const d4Chart = buildCanonicalVarga("D4", planets, ascLong);
  if (d4Chart && d4Chart.ascendant) {
    const d4Mars = d4Chart.getPlanet("Mars");
    const d4Venus = d4Chart.getPlanet("Venus");
    if (d4Mars && [1, 4, 10, 11].includes(d4Mars.house)) {
      premises.push({ factor: `D4 Mars in auspicious house (${d4Mars.house})`, role: "D4 Bhoomi Karaka" });
      ruleIds.push("PROP_D4_MARS_PROMISE");
      d4Score += 12;
    }
    if (d4Venus && [1, 4, 5, 9, 11].includes(d4Venus.house)) {
      premises.push({ factor: `D4 Venus in House ${d4Venus.house}`, role: "D4 Vahana/Sukha Karaka" });
      ruleIds.push("PROP_D4_VENUS_PROMISE");
      d4Score += 13;
    }
  }
  evidenceGroups.push({
    id: `EVD_PROP_D4_${event.id}`,
    category: "D4_CHATURTHAMSHA",
    score: Math.min(25, d4Score),
    weight: 0.25
  });

  // 3. Vimshottari Dasha Timing
  const dashaRes = calculateEventDashaHierarchy(event.parsedDate, chartData, primaryPropLords, secondaryPropLords);
  if (dashaRes.timingEvidence.length > 0) {
    premises.push(...dashaRes.timingEvidence);
    ruleIds.push(...dashaRes.ruleIds);
  } else {
    counterIndicators.push(`Operating Dasha (${dashaRes.activeMD || "—"}/${dashaRes.activeAD || "—"}) lacks direct 4H/Mars real-estate alignment`);
  }
  evidenceGroups.push({
    id: `EVD_PROP_DASHA_${event.id}`,
    category: "VIMSHOTTARI_DASHA",
    score: dashaRes.timingScore,
    weight: 0.30
  });

  // 4. Historical Transits
  const transits = calculateEventTransits(event.parsedDate, chartData, chartData.system || "lahiri");
  let transitScore = 0;
  const tMars = transits.houseTransits?.Mars;
  const tJup = transits.houseTransits?.Jupiter;
  if (tMars && [4, 1, 10, 11].includes(tMars.houseFromLagna)) {
    premises.push({ factor: `Transiting Mars in House ${tMars.houseFromLagna} activating landed property`, role: "Transit Mars" });
    ruleIds.push("TRANSIT_MARS_PROP");
    transitScore += 15;
  }
  if (tJup && [4, 1, 10, 11, 2].includes(tJup.houseFromLagna)) {
    transitScore += 10;
  }
  evidenceGroups.push({
    id: `EVD_PROP_TRANSIT_${event.id}`,
    category: "GOCHARA_TRANSIT",
    score: Math.min(25, transitScore),
    weight: 0.20
  });

  const totalPositive = evidenceGroups.reduce((acc, g) => acc + g.score, 0);
  const isContradiction = counterIndicators.length > 1 && totalPositive < 20;
  const contradictionScore = isContradiction ? 25 : (counterIndicators.length > 0 ? 10 : 0);

  return {
    eventId: event.id,
    category: "PROPERTY",
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
