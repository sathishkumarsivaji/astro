/**
 * ASTROVERSE — Marriage & Relationship Event Evaluator
 *
 * Evaluates timing and structural alignment for marriage events:
 * 1. D1: 7th house, 7th lord, Venus (Karaka for males/general), Jupiter (Karaka for females)
 * 2. D9 (Navamsha): D9 Lagna, 7th house, 7th lord in D9, Venus in Navamsha (via Canonical Varga Adapter)
 * 3. Vimshottari Dasha: MD / AD / PD active at event date connected to 7H, 7th lord, 2H, 11H, Venus
 * 4. Gochara (Transit): Genuine historical transit positions of Jupiter & Saturn at event date
 *
 * ZERO unconditional points or synthetic fallbacks.
 */

import { buildCanonicalVarga } from "../engine/rectificationVargaAdapter.js";
import { calculateEventTransits, evaluateMarriageTransits } from "../engine/transitCalculator.js";
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

export function evaluateMarriageEvent(event, chartData, candidateTime) {
  const premises = [];
  const counterIndicators = [];
  const evidenceGroups = [];
  const ruleIds = [];

  const planets = Array.isArray(chartData?.planets) ? chartData.planets : [];
  const ascLong = chartData?.ascendantLong ?? chartData?.ascendant?.longitude ?? chartData?.ascendantDeg;

  if (!chartData || planets.length === 0 || !Number.isFinite(ascLong)) {
    return {
      eventId: event.id,
      category: "MARRIAGE",
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

  // 1. Identify 7th House, 7th Lord, 2nd Lord (Family), 11th Lord (Fulfillment)
  const h7SignIdx = (ascSignIdx + 6) % 12;
  const h7Sign = SIGN_ORDER[h7SignIdx];
  const h7Lord = SIGN_LORDS[h7Sign];

  const h2SignIdx = (ascSignIdx + 1) % 12;
  const h2Lord = SIGN_LORDS[SIGN_ORDER[h2SignIdx]];

  const h11SignIdx = (ascSignIdx + 10) % 12;
  const h11Lord = SIGN_LORDS[SIGN_ORDER[h11SignIdx]];

  const primaryMarriageLords = new Set([h7Lord, "Venus"].filter(Boolean));
  const secondaryMarriageLords = new Set([h2Lord, h11Lord, "Jupiter"].filter(Boolean));

  // 2. D1 Natal Structure
  let d1Score = 0;
  const h7Planets = planets.filter(p => p.house === 7 || p.sign === h7Sign);
  const venus = planets.find(p => p.name === "Venus");

  if (h7Planets.length > 0) {
    premises.push({ factor: `Planets occupying natal 7H (${h7Planets.map(p => p.name).join(", ")})`, role: "D1 7H Occupant" });
    ruleIds.push("MARR_D1_7H_OCCUPANT");
    d1Score += 10;
  }
  if (h7Lord) {
    const lordObj = planets.find(p => p.name === h7Lord);
    if (lordObj) {
      if ([1, 4, 5, 7, 9, 10, 11].includes(lordObj.house)) {
        premises.push({ factor: `7th Lord ${h7Lord} well-placed in Kendra/Trikona (House ${lordObj.house})`, role: "7th Lord Placement" });
        ruleIds.push("MARR_D1_7H_LORD_KENDRA");
        d1Score += 10;
      }
    }
  }
  if (venus && [1, 4, 5, 7, 9, 11].includes(venus.house)) {
    d1Score += 5;
  }
  evidenceGroups.push({
    id: `EVD_MARR_D1_${event.id}`,
    category: "D1_STRUCTURE",
    score: Math.min(25, d1Score),
    weight: 0.25
  });

  // 3. D9 Navamsha Alignment (via Canonical Adapter)
  let d9Score = 0;
  const d9Chart = buildCanonicalVarga("D9", planets, ascLong);
  if (d9Chart && d9Chart.ascendant) {
    const d9AscSignIdx = d9Chart.ascendant.signIdx;
    const d9H7SignIdx = (d9AscSignIdx + 6) % 12;
    const d9H7LordName = SIGN_LORDS[SIGN_ORDER[d9H7SignIdx]];
    const d9H7Lord = d9Chart.getPlanet(d9H7LordName);
    const d9Venus = d9Chart.getPlanet("Venus");

    // Check meaningful D9 configurations:
    if (d9H7Lord && [1, 4, 5, 7, 9, 10, 11].includes(d9H7Lord.house) && d9H7Lord.dignity !== "Debilitated") {
      premises.push({ factor: `D9 Navamsha 7th Lord ${d9H7LordName} auspiciously disposed in D9 House ${d9H7Lord.house}`, role: "D9 7th Lord Dignity" });
      ruleIds.push("MARR_D9_7H_LORD_PROMISE");
      d9Score += 10;
    }
    if (d9Venus && [1, 4, 5, 7, 9, 11].includes(d9Venus.house) && d9Venus.dignity !== "Debilitated") {
      premises.push({ factor: `D9 Venus in auspicious Navamsha house (${d9Venus.house})`, role: "D9 Kalatrakaraka" });
      ruleIds.push("MARR_D9_VENUS_PROMISE");
      d9Score += 10;
    }
    // D9 Lagna connection to D1 7H
    if (d9AscSignIdx === h7SignIdx || d9AscSignIdx === ascSignIdx) {
      premises.push({ factor: `D9 Navamsha Lagna aligns with D1 relationship axis (${SIGN_ORDER[d9AscSignIdx]})`, role: "D9-D1 Lagna Resonance" });
      ruleIds.push("MARR_D9_LAGNA_RESONANCE");
      d9Score += 5;
    }
  }
  evidenceGroups.push({
    id: `EVD_MARR_D9_${event.id}`,
    category: "D9_NAVAMSHA",
    score: Math.min(25, d9Score),
    weight: 0.25
  });

  // 4. Vimshottari MD / AD / PD Timing
  const dashaRes = calculateEventDashaHierarchy(event.parsedDate, chartData, primaryMarriageLords, secondaryMarriageLords);
  if (dashaRes.timingEvidence.length > 0) {
    premises.push(...dashaRes.timingEvidence);
    ruleIds.push(...dashaRes.ruleIds);
  } else {
    counterIndicators.push(`Operating Dasha (${dashaRes.activeMD || "—"}/${dashaRes.activeAD || "—"}) lacks primary 7H/Venus connectivity`);
  }
  evidenceGroups.push({
    id: `EVD_MARR_DASHA_${event.id}`,
    category: "VIMSHOTTARI_DASHA",
    score: dashaRes.timingScore,
    weight: 0.30
  });

  // 5. Genuine Historical Gochara Transits (Jupiter & Saturn double transit)
  const transits = calculateEventTransits(event.parsedDate, chartData, chartData.system || "lahiri");
  const transitEval = evaluateMarriageTransits(transits, chartData);

  if (transitEval.premises.length > 0) {
    premises.push(...transitEval.premises);
    ruleIds.push(...transitEval.ruleIds);
  }
  evidenceGroups.push({
    id: `EVD_MARR_TRANSIT_${event.id}`,
    category: "GOCHARA_TRANSIT",
    score: transitEval.score,
    weight: 0.20
  });

  const totalPositive = evidenceGroups.reduce((acc, g) => acc + g.score, 0);
  const isContradiction = counterIndicators.length > 1 && totalPositive < 20;
  const contradictionScore = isContradiction ? 25 : (counterIndicators.length > 0 ? 10 : 0);

  return {
    eventId: event.id,
    category: "MARRIAGE",
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
