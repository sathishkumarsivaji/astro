/**
 * ASTROVERSE — Child Birth (Progeny) Event Evaluator
 *
 * Evaluates timing and structural alignment for childbirth milestones:
 * 1. D1: 5th house, 5th lord, 2nd house (family growth), 9th house, Jupiter (Putrakaraka)
 * 2. D7 (Saptamsha): D7 Lagna, 5th house in D7, 5th lord in D7, Jupiter placement
 * 3. Vimshottari Dasha: MD / AD / PD active at event date connected to 5H, 5th lord, Jupiter
 * 4. Gochara (Transit): Genuine historical transit positions of Jupiter influencing 5H axis
 *
 * ZERO unconditional points or synthetic fallbacks.
 */

import { buildCanonicalVarga } from "../engine/rectificationVargaAdapter.js";
import { calculateEventTransits, evaluateChildBirthTransits } from "../engine/transitCalculator.js";
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

export function evaluateChildBirthEvent(event, chartData, candidateTime) {
  const premises = [];
  const counterIndicators = [];
  const evidenceGroups = [];
  const ruleIds = [];

  const planets = Array.isArray(chartData?.planets) ? chartData.planets : [];
  const ascLong = chartData?.ascendantLong ?? chartData?.ascendant?.longitude ?? chartData?.ascendantDeg;

  if (!chartData || planets.length === 0 || !Number.isFinite(ascLong)) {
    return {
      eventId: event.id,
      category: "CHILD_BIRTH",
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
  const ascSign = SIGN_ORDER[ascSignIdx];

  // 1. Identify 5th House (Putra), 5th Lord, 2nd Lord, 9th Lord, Jupiter
  const h5SignIdx = (ascSignIdx + 4) % 12;
  const h5Sign = SIGN_ORDER[h5SignIdx];
  const h5Lord = SIGN_LORDS[h5Sign];

  const h2SignIdx = (ascSignIdx + 1) % 12;
  const h2Lord = SIGN_LORDS[SIGN_ORDER[h2SignIdx]];
  const h9SignIdx = (ascSignIdx + 8) % 12;
  const h9Lord = SIGN_LORDS[SIGN_ORDER[h9SignIdx]];

  const primaryProgenyLords = new Set([h5Lord, "Jupiter"].filter(Boolean));
  const secondaryProgenyLords = new Set([h2Lord, h9Lord, "Venus", "Moon"].filter(Boolean));

  // 2. D1 Natal Structure
  let d1Score = 0;
  const h5Planets = planets.filter(p => p.house === 5 || p.sign === h5Sign);
  const jupiter = planets.find(p => p.name === "Jupiter");

  if (h5Planets.length > 0) {
    premises.push({ factor: `Planets occupying 5H (${h5Planets.map(p => p.name).join(", ")})`, role: "D1 5H Occupant" });
    ruleIds.push("CHILD_D1_5H_OCCUPANT");
    d1Score += 10;
  }
  if (h5Lord) {
    const lordObj = planets.find(p => p.name === h5Lord);
    if (lordObj && [1, 4, 5, 7, 9, 11].includes(lordObj.house)) {
      premises.push({ factor: `5th Lord ${h5Lord} in Kendra/Trikona (House ${lordObj.house})`, role: "5th Lord Strength" });
      ruleIds.push("CHILD_D1_5H_LORD_KENDRA");
      d1Score += 10;
    }
  }
  if (jupiter && [1, 4, 5, 7, 9, 11].includes(jupiter.house)) d1Score += 5;
  evidenceGroups.push({
    id: `EVD_CHILD_D1_${event.id}`,
    category: "D1_STRUCTURE",
    score: Math.min(25, d1Score),
    weight: 0.25
  });

  // 3. D7 Saptamsha Alignment (via Canonical Adapter)
  let d7Score = 0;
  const d7Chart = buildCanonicalVarga("D7", planets, ascLong);
  if (d7Chart && d7Chart.ascendant) {
    const d7AscSignIdx = d7Chart.ascendant.signIdx;
    const d7H5SignIdx = (d7AscSignIdx + 4) % 12;
    const d7H5LordName = SIGN_LORDS[SIGN_ORDER[d7H5SignIdx]];
    const d7H5Lord = d7Chart.getPlanet(d7H5LordName);
    const d7Jupiter = d7Chart.getPlanet("Jupiter");

    if (d7H5Lord && [1, 4, 5, 7, 9, 11].includes(d7H5Lord.house) && d7H5Lord.dignity !== "Debilitated") {
      premises.push({ factor: `D7 Saptamsha 5th Lord ${d7H5LordName} placed in House ${d7H5Lord.house}`, role: "D7 5th Lord Strength" });
      ruleIds.push("CHILD_D7_5H_LORD_PROMISE");
      d7Score += 10;
    }
    if (d7Jupiter && [1, 4, 5, 7, 9, 11].includes(d7Jupiter.house)) {
      premises.push({ factor: `D7 Jupiter in auspicious progeny house (${d7Jupiter.house})`, role: "D7 Putrakaraka" });
      ruleIds.push("CHILD_D7_JUPITER_PROMISE");
      d7Score += 10;
    }
    if (d7AscSignIdx === h5SignIdx || d7AscSignIdx === ascSignIdx) {
      d7Score += 5;
    }
  }
  evidenceGroups.push({
    id: `EVD_CHILD_D7_${event.id}`,
    category: "D7_SAPTAMSHA",
    score: Math.min(25, d7Score),
    weight: 0.25
  });

  // 4. Vimshottari MD / AD / PD Timing
  const dashaRes = calculateEventDashaHierarchy(event.parsedDate, chartData, primaryProgenyLords, secondaryProgenyLords);
  if (dashaRes.timingEvidence.length > 0) {
    premises.push(...dashaRes.timingEvidence);
    ruleIds.push(...dashaRes.ruleIds);
  } else {
    counterIndicators.push(`Operating Dasha (${dashaRes.activeMD || "—"}/${dashaRes.activeAD || "—"}) lacks direct 5H/Jupiter progeny alignment`);
  }
  evidenceGroups.push({
    id: `EVD_CHILD_DASHA_${event.id}`,
    category: "VIMSHOTTARI_DASHA",
    score: dashaRes.timingScore,
    weight: 0.30
  });

  // 5. Genuine Historical Gochara Transits (Jupiter to 5H)
  const transits = calculateEventTransits(event.parsedDate, chartData, chartData.system || "lahiri");
  const transitEval = evaluateChildBirthTransits(transits, chartData);

  if (transitEval.premises.length > 0) {
    premises.push(...transitEval.premises);
    ruleIds.push(...transitEval.ruleIds);
  }
  evidenceGroups.push({
    id: `EVD_CHILD_TRANSIT_${event.id}`,
    category: "GOCHARA_TRANSIT",
    score: transitEval.score,
    weight: 0.20
  });

  const totalPositive = evidenceGroups.reduce((acc, g) => acc + g.score, 0);
  const isContradiction = counterIndicators.length > 1 && totalPositive < 20;
  const contradictionScore = isContradiction ? 25 : (counterIndicators.length > 0 ? 10 : 0);

  return {
    eventId: event.id,
    category: "CHILD_BIRTH",
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
