/**
 * ASTROVERSE — Career & Professional Event Evaluator
 *
 * Evaluates timing and structural alignment for career milestones:
 * 1. D1: 10th house, 10th lord, 1st/6th/11th houses, Sun (authority), Saturn (karma/vocation)
 * 2. D10 (Dasamsha): D10 Lagna, 10th house in D10, 10th lord in D10, Sun/Saturn placements
 * 3. Vimshottari Dasha: MD / AD / PD active at event date connected to 10H, 10th lord, Sun, Saturn
 * 4. Gochara (Transit): Genuine historical transit positions of Saturn and Jupiter at event date
 *
 * ZERO unconditional points or synthetic fallbacks.
 */

import { buildCanonicalVarga } from "../engine/rectificationVargaAdapter.js";
import { calculateEventTransits, evaluateCareerTransits } from "../engine/transitCalculator.js";
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

export function evaluateCareerEvent(event, chartData, candidateTime) {
  const premises = [];
  const counterIndicators = [];
  const evidenceGroups = [];
  const ruleIds = [];

  const planets = Array.isArray(chartData?.planets) ? chartData.planets : [];
  const ascLong = chartData?.ascendantLong ?? chartData?.ascendant?.longitude ?? chartData?.ascendantDeg;

  if (!chartData || planets.length === 0 || !Number.isFinite(ascLong)) {
    return {
      eventId: event.id,
      category: "CAREER",
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

  // 1. Identify 10th House (Karma), 10th Lord, 1st Lord, 6th Lord, 11th Lord
  const h10SignIdx = (ascSignIdx + 9) % 12;
  const h10Sign = SIGN_ORDER[h10SignIdx];
  const h10Lord = SIGN_LORDS[h10Sign];

  const h1Lord = SIGN_LORDS[ascSign];
  const h6SignIdx = (ascSignIdx + 5) % 12;
  const h6Lord = SIGN_LORDS[SIGN_ORDER[h6SignIdx]];
  const h11SignIdx = (ascSignIdx + 10) % 12;
  const h11Lord = SIGN_LORDS[SIGN_ORDER[h11SignIdx]];

  const primaryCareerLords = new Set([h10Lord, "Sun", "Saturn"].filter(Boolean));
  const secondaryCareerLords = new Set([h1Lord, h6Lord, h11Lord, "Mercury", "Jupiter"].filter(Boolean));

  // 2. D1 Natal Structure
  let d1Score = 0;
  const h10Planets = planets.filter(p => p.house === 10 || p.sign === h10Sign);
  const sun = planets.find(p => p.name === "Sun");
  const saturn = planets.find(p => p.name === "Saturn");

  if (h10Planets.length > 0) {
    premises.push({ factor: `Planets in 10th Bhava (${h10Planets.map(p => p.name).join(", ")})`, role: "D1 10H Occupant" });
    ruleIds.push("CAREER_D1_10H_OCCUPANT");
    d1Score += 10;
  }
  if (h10Lord) {
    const lordObj = planets.find(p => p.name === h10Lord);
    if (lordObj && [1, 4, 5, 9, 10, 11].includes(lordObj.house)) {
      premises.push({ factor: `10th Lord ${h10Lord} in auspicious house (${lordObj.house})`, role: "10th Lord Strength" });
      ruleIds.push("CAREER_D1_10H_LORD_KENDRA");
      d1Score += 10;
    }
  }
  if (sun && [1, 10, 11].includes(sun.house)) d1Score += 5;
  evidenceGroups.push({
    id: `EVD_CAREER_D1_${event.id}`,
    category: "D1_STRUCTURE",
    score: Math.min(25, d1Score),
    weight: 0.25
  });

  // 3. D10 Dasamsha Alignment (via Canonical Adapter)
  let d10Score = 0;
  const d10Chart = buildCanonicalVarga("D10", planets, ascLong);
  if (d10Chart && d10Chart.ascendant) {
    const d10AscSignIdx = d10Chart.ascendant.signIdx;
    const d10H10SignIdx = (d10AscSignIdx + 9) % 12;
    const d10H10LordName = SIGN_LORDS[SIGN_ORDER[d10H10SignIdx]];
    const d10H10Lord = d10Chart.getPlanet(d10H10LordName);
    const d10Saturn = d10Chart.getPlanet("Saturn");
    const d10Sun = d10Chart.getPlanet("Sun");

    if (d10H10Lord && [1, 4, 5, 9, 10, 11].includes(d10H10Lord.house) && d10H10Lord.dignity !== "Debilitated") {
      premises.push({ factor: `D10 Dasamsha 10th Lord ${d10H10LordName} in House ${d10H10Lord.house}`, role: "D10 10th Lord Strength" });
      ruleIds.push("CAREER_D10_10H_LORD_PROMISE");
      d10Score += 10;
    }
    if (d10Saturn && [1, 4, 5, 9, 10, 11].includes(d10Saturn.house)) {
      premises.push({ factor: `D10 Saturn in vocational Kendra/Trikona (House ${d10Saturn.house})`, role: "D10 Karmakaraka" });
      ruleIds.push("CAREER_D10_SATURN_PROMISE");
      d10Score += 10;
    }
    if (d10Sun && [1, 5, 9, 10].includes(d10Sun.house)) {
      d10Score += 5;
    }
  }
  evidenceGroups.push({
    id: `EVD_CAREER_D10_${event.id}`,
    category: "D10_DASAMSHA",
    score: Math.min(25, d10Score),
    weight: 0.25
  });

  // 4. Vimshottari MD / AD / PD Timing
  const dashaRes = calculateEventDashaHierarchy(event.parsedDate, chartData, primaryCareerLords, secondaryCareerLords);
  if (dashaRes.timingEvidence.length > 0) {
    premises.push(...dashaRes.timingEvidence);
    ruleIds.push(...dashaRes.ruleIds);
  } else {
    counterIndicators.push(`Operating Dasha (${dashaRes.activeMD || "—"}/${dashaRes.activeAD || "—"}) lacks direct 10H/Sun/Saturn alignment`);
  }
  evidenceGroups.push({
    id: `EVD_CAREER_DASHA_${event.id}`,
    category: "VIMSHOTTARI_DASHA",
    score: dashaRes.timingScore,
    weight: 0.30
  });

  // 5. Genuine Historical Gochara Transits (Saturn & Jupiter)
  const transits = calculateEventTransits(event.parsedDate, chartData, chartData.system || "lahiri");
  const transitEval = evaluateCareerTransits(transits, chartData);

  if (transitEval.premises.length > 0) {
    premises.push(...transitEval.premises);
    ruleIds.push(...transitEval.ruleIds);
  }
  evidenceGroups.push({
    id: `EVD_CAREER_TRANSIT_${event.id}`,
    category: "GOCHARA_TRANSIT",
    score: transitEval.score,
    weight: 0.20
  });

  const totalPositive = evidenceGroups.reduce((acc, g) => acc + g.score, 0);
  const isContradiction = counterIndicators.length > 1 && totalPositive < 20;
  const contradictionScore = isContradiction ? 25 : (counterIndicators.length > 0 ? 10 : 0);

  return {
    eventId: event.id,
    category: "CAREER",
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
