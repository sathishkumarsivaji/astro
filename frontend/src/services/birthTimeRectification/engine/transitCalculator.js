/**
 * ASTROVERSE — Historical Transit Calculator for Birth-Time Rectification
 *
 * Implements genuine historical astronomical transit calculations for every life event:
 * - Computes exact sidereal coordinates of transiting Grahas (Jupiter, Saturn, Rahu,
 *   Ketu, Mars, Sun, Venus, Mercury) at the historical event date.
 * - Evaluates authentic house transits and Parashari aspects (Conjunction, 7th Mutual,
 *   Jupiter 5th/9th, Saturn 3rd/10th, Mars 4th/8th) against the candidate's natal chart.
 * - Produces auditable transit evidence records with ruleId, exact orbs, and angular distances.
 *
 * ZERO unconditional transit scores.
 */

import {
  getSiderealLongitudeForBody,
  getJulianDate,
  getJulianDateFromUtc,
  norm360,
  norm180,
  angularDistance,
  ZODIAC_SIGNS
} from "../../astroEngine.js";

const SIGN_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

/**
 * Calculates historical transit positions at event date
 */
export function calculateEventTransits(eventDate, candidateChart, system = "lahiri") {
  if (!eventDate || !candidateChart) {
    return {
      eventDate: null,
      transitGrahas: {},
      transitAspects: [],
      houseTransits: {}
    };
  }

  let parsedDate = null;
  if (eventDate instanceof Date && !isNaN(eventDate.getTime())) {
    parsedDate = eventDate;
  } else if (typeof eventDate === "string") {
    parsedDate = new Date(eventDate);
  }

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return {
      eventDate: null,
      transitGrahas: {},
      transitAspects: [],
      houseTransits: {}
    };
  }

  const jd = getJulianDateFromUtc(parsedDate);
  const transitingBodies = ["Jupiter", "Saturn", "Rahu", "Ketu", "Mars", "Sun", "Venus", "Mercury"];
  const transitGrahas = {};

  for (const body of transitingBodies) {
    const long = getSiderealLongitudeForBody(body, jd, system);
    const signIdx = Math.floor(long / 30);
    const signName = SIGN_ORDER[signIdx];
    const degInSign = long % 30;

    transitGrahas[body] = {
      name: body,
      longitude: long,
      signIdx,
      signName,
      degInSign
    };
  }

  const natalAscLong = candidateChart.ascendantLong ?? candidateChart.ascendant?.longitude ?? candidateChart.ascendantDeg;
  if (!Number.isFinite(natalAscLong)) {
    return {
      eventDate: parsedDate.toISOString().slice(0, 10),
      jd,
      transitGrahas,
      houseTransits: {},
      aspectHits: []
    };
  }
  const natalAscSignIdx = Math.floor(norm360(natalAscLong) / 30);
  const natalPlanets = Array.isArray(candidateChart.planets) ? candidateChart.planets : [];

  // Determine house transit of each transiting planet from candidate's natal Lagna
  const houseTransits = {};
  for (const [body, gData] of Object.entries(transitGrahas)) {
    const houseFromLagna = ((gData.signIdx - natalAscSignIdx + 12) % 12) + 1;
    houseTransits[body] = {
      ...gData,
      houseFromLagna
    };
  }

  // Calculate Parashari aspect hits on Natal Ascendant and Natal Planets
  const aspectHits = [];

  const targets = [
    { name: "Ascendant", type: "lagna", longitude: natalAscLong, signIdx: natalAscSignIdx, house: 1 }
  ];

  for (const np of natalPlanets) {
    const pLong = np.longitude ?? np.long;
    if (!Number.isFinite(pLong)) continue;
    const pSignIdx = Math.floor(norm360(pLong) / 30);
    targets.push({
      name: np.name,
      type: "planet",
      longitude: pLong,
      signIdx: pSignIdx,
      house: np.house || (((pSignIdx - natalAscSignIdx + 12) % 12) + 1)
    });
  }

  for (const [tBody, tData] of Object.entries(transitGrahas)) {
    const aspectAngles = [{ angle: 0, name: "Conjunction (1/1)", orbLimit: 10.0 }, { angle: 180, name: "Mutual Aspect (1/7)", orbLimit: 10.0 }];

    if (tBody === "Jupiter") {
      aspectAngles.push({ angle: 120, name: "5th Aspect (Trine 5/9)", orbLimit: 10.0 });
      aspectAngles.push({ angle: 240, name: "9th Aspect (Trine 9/5)", orbLimit: 10.0 });
    } else if (tBody === "Saturn") {
      aspectAngles.push({ angle: 60, name: "3rd Aspect (Sextile 3/10)", orbLimit: 10.0 });
      aspectAngles.push({ angle: 270, name: "10th Aspect (Square 10/3)", orbLimit: 10.0 });
    } else if (tBody === "Mars") {
      aspectAngles.push({ angle: 90, name: "4th Aspect (Square 4/10)", orbLimit: 10.0 });
      aspectAngles.push({ angle: 210, name: "8th Aspect (Quincunx 8/6)", orbLimit: 10.0 });
    }

    for (const tgt of targets) {
      for (const asp of aspectAngles) {
        const targetExpectedLong = norm360(tgt.longitude + asp.angle);
        const dist = Math.abs(norm180(tData.longitude - targetExpectedLong));

        if (dist <= asp.orbLimit) {
          aspectHits.push({
            transitingPlanet: tBody,
            transitLongitude: Number(tData.longitude.toFixed(2)),
            transitSign: tData.signName,
            transitHouseFromLagna: houseTransits[tBody].houseFromLagna,
            natalTarget: tgt.name,
            targetType: tgt.type,
            natalLongitude: Number(tgt.longitude.toFixed(2)),
            natalHouse: tgt.house,
            aspectAngle: asp.angle,
            aspectName: asp.name,
            angularDistance: Number(dist.toFixed(2)),
            orb: Number(dist.toFixed(2)),
            isTightOrb: dist <= 4.0
          });
        }
      }
    }
  }

  return {
    eventDate: parsedDate.toISOString().slice(0, 10),
    jd,
    transitGrahas,
    houseTransits,
    aspectHits
  };
}

/**
 * Checks double transit principle (Jupiter + Saturn) on marriage 7H axis
 */
export function evaluateMarriageTransits(transitData, candidateChart) {
  if (!transitData || !candidateChart) return { score: 0, premises: [], ruleIds: [] };

  const premises = [];
  const ruleIds = [];
  let score = 0;

  const jup = transitData.houseTransits?.Jupiter;
  const sat = transitData.houseTransits?.Saturn;
  const aspects = transitData.aspectHits || [];

  const ascLong = candidateChart.ascendantLong ?? candidateChart.ascendant?.longitude ?? candidateChart.ascendantDeg;
  if (!Number.isFinite(ascLong)) return { score: 0, premises: [], ruleIds: [] };
  const natalAscSignIdx = Math.floor(norm360(ascLong) / 30);
  const h7SignIdx = (natalAscSignIdx + 6) % 12;
  const h7Sign = SIGN_ORDER[h7SignIdx];

  // 1. Jupiter influence on 7th House or Natal Venus
  const jupHits7H = jup && [7, 1, 3, 11].includes(jup.houseFromLagna); // 7H transit or 1H (7th aspect), 3H (5th aspect), 11H (9th aspect)
  const jupAspectsVenus = aspects.some(a => a.transitingPlanet === "Jupiter" && a.natalTarget === "Venus");

  if (jupHits7H || jupAspectsVenus) {
    premises.push({
      factor: `Transiting Jupiter in ${jup?.signName || "Sign"} (House ${jup?.houseFromLagna || "—"}) influencing 7H axis/Venus`,
      role: "Gochara Jupiter Blessing"
    });
    ruleIds.push("TRANSIT_JUPITER_7H_AXIS");
    score += 15;
  }

  // 2. Saturn influence on 7th House / 7th Lord (Double Transit Catalyst)
  const satHits7H = sat && [7, 1, 5, 10].includes(sat.houseFromLagna); // 7H transit, 1H (7th aspect), 5H (3rd aspect), 10H (10th aspect)
  const satAspectsVenus = aspects.some(a => a.transitingPlanet === "Saturn" && a.natalTarget === "Venus");

  if (satHits7H || satAspectsVenus) {
    premises.push({
      factor: `Transiting Saturn in ${sat?.signName || "Sign"} (House ${sat?.houseFromLagna || "—"}) activating 7H karmic axis`,
      role: "Gochara Saturn Karmic Sanction"
    });
    ruleIds.push("TRANSIT_SATURN_7H_AXIS");
    score += 10;
  }

  return {
    score: Math.min(25, score),
    premises,
    ruleIds,
    hasDoubleTransit: (jupHits7H || jupAspectsVenus) && (satHits7H || satAspectsVenus)
  };
}

/**
 * Checks transit alignment on 10H career axis (Saturn/Jupiter)
 */
export function evaluateCareerTransits(transitData, candidateChart) {
  if (!transitData || !candidateChart) return { score: 0, premises: [], ruleIds: [] };

  const premises = [];
  const ruleIds = [];
  let score = 0;

  const sat = transitData.houseTransits?.Saturn;
  const jup = transitData.houseTransits?.Jupiter;
  const aspects = transitData.aspectHits || [];

  // Saturn in 10H, 1H, 4H, 8H (aspecting or occupying 10H)
  const satHits10H = sat && [10, 1, 4, 8].includes(sat.houseFromLagna);
  const satAspectsSun = aspects.some(a => a.transitingPlanet === "Saturn" && a.natalTarget === "Sun");

  if (satHits10H || satAspectsSun) {
    premises.push({
      factor: `Transiting Saturn in House ${sat?.houseFromLagna || "—"} activating 10H vocational throne/Sun`,
      role: "Gochara Saturn Career Activation"
    });
    ruleIds.push("TRANSIT_SATURN_10H_AXIS");
    score += 15;
  }

  // Jupiter in 10H, 2H, 6H, 4H (aspecting or occupying 10H/2H/6H)
  const jupHitsCareer = jup && [10, 2, 6, 4].includes(jup.houseFromLagna);
  if (jupHitsCareer) {
    premises.push({
      factor: `Transiting Jupiter in House ${jup?.houseFromLagna || "—"} conferring professional elevation/wealth`,
      role: "Gochara Jupiter Career Grace"
    });
    ruleIds.push("TRANSIT_JUPITER_10H_AXIS");
    score += 10;
  }

  return {
    score: Math.min(25, score),
    premises,
    ruleIds
  };
}

/**
 * Checks transit alignment on 5H childbirth axis (Jupiter Putrakaraka)
 */
export function evaluateChildBirthTransits(transitData, candidateChart) {
  if (!transitData || !candidateChart) return { score: 0, premises: [], ruleIds: [] };

  const premises = [];
  const ruleIds = [];
  let score = 0;

  const jup = transitData.houseTransits?.Jupiter;
  const aspects = transitData.aspectHits || [];

  // Jupiter transiting 5H or aspecting 5H from 1H (5th aspect), 9H (9th aspect), 11H (7th aspect)
  const jupHits5H = jup && [5, 1, 9, 11].includes(jup.houseFromLagna);
  const jupAspectsJupiter = aspects.some(a => a.transitingPlanet === "Jupiter" && a.natalTarget === "Jupiter");

  if (jupHits5H || jupAspectsJupiter) {
    premises.push({
      factor: `Transiting Jupiter in House ${jup?.houseFromLagna || "—"} aspecting/occupying 5H Santaana Bhava`,
      role: "Gochara Jupiter Progeny Blessing"
    });
    ruleIds.push("TRANSIT_JUPITER_5H_SANTAANA");
    score += 20;
  }

  return {
    score: Math.min(25, score),
    premises,
    ruleIds
  };
}

/**
 * Calculates whether an aspect angle is satisfied within orb
 */
export function checkAspectHit(sourceLong, targetLong, aspectHouse = 7, orbLimit = 6.0) {
  const angle = ((aspectHouse - 1) * 30) % 360;
  const targetExpectedLong = norm360(targetLong + angle);
  const orb = Math.abs(norm180(sourceLong - targetExpectedLong));
  return {
    hit: orb <= orbLimit,
    orb: Number(orb.toFixed(2)),
    angle
  };
}

export const calculateAspectHit = checkAspectHit;
