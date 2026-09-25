/**
 * ASTROVERSE — Krishnamurti Padhdhati (KP) Astrology Engine
 *
 * Implements genuine KP System:
 * - KP Ayanamsha (precession rate 50.2388475"/year)
 * - Placidus Cuspal House Division (Siderealized)
 * - 249 Star Lord, Sub-Lord, and Sub-Sub Lord for all 12 Cusps & 9 Planets
 * - KP 4-Tier Significator Matrix (Occupant Star, Occupant, Lord Star, House Lord)
 * - KP Ruling Planets (RP) at birth instant
 * - Explicit omission of inapplicable classical techniques (Shadbala, Ashtakavarga)
 */

import { norm360 } from "../astronomy/time.js";
import { calculatePlacidusCusps } from "../astronomy/coordinates.js";
import { getKPSubLord, getNakshatraAndPada, SIGN_NAMES, SIGN_LORDS } from "../derived/nakshatra.js";
import { computeDetailedVimshottari, DASHA_LORDS } from "../../services/astroEngine.js";

const DAY_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export function calculateKPChart(observations, birthData) {
  const kpAyanamsha = observations.ayanamshas.kp;
  const { jd, T, lat, lng, utcDate } = observations;
  const lmst = observations.sidereal.lmstDegrees;

  // 1. Placidus Cusps in Sidereal KP
  const placidusRaw = calculatePlacidusCusps(lmst, lat, T);
  const houseCusps = [];

  for (let h = 1; h <= 12; h++) {
    const tropCusp = placidusRaw.cusps[h];
    const siderealCusp = norm360(tropCusp - kpAyanamsha);
    const subInfo = getKPSubLord(siderealCusp);
    const nakInfo = getNakshatraAndPada(siderealCusp);

    houseCusps.push({
      house: h,
      longitude: siderealCusp,
      signName: subInfo.signName,
      signLord: subInfo.signLord,
      starLord: subInfo.starLord,
      subLord: subInfo.subLord,
      subSubLord: subInfo.subSubLord,
      nakshatra: nakInfo.nakshatraName,
      pada: nakInfo.pada,
      degreeInSign: siderealCusp % 30
    });
  }

  // 2. Planets in Sidereal KP
  const planets = [];
  const planetOrder = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

  for (const name of planetOrder) {
    const raw = observations.tropicalBodies[name];
    if (!raw) continue;
    const siderealLong = norm360(raw.tropicalLongitude - kpAyanamsha);
    const subInfo = getKPSubLord(siderealLong);
    const nakInfo = getNakshatraAndPada(siderealLong);

    // Determine KP House occupied using Placidus cusp boundaries
    let occupiedHouse = 1;
    for (let h = 1; h <= 12; h++) {
      const currentCusp = houseCusps[h - 1].longitude;
      const nextCusp = houseCusps[h % 12].longitude;
      let inHouse = false;
      if (nextCusp > currentCusp) {
        inHouse = siderealLong >= currentCusp && siderealLong < nextCusp;
      } else {
        // Wraps over 0° Aries
        inHouse = siderealLong >= currentCusp || siderealLong < nextCusp;
      }
      if (inHouse) {
        occupiedHouse = h;
        break;
      }
    }

    planets.push({
      name,
      longitude: siderealLong,
      speed: raw.speed,
      isRetrograde: raw.isRetrograde,
      house: occupiedHouse,
      signName: subInfo.signName,
      signLord: subInfo.signLord,
      starLord: subInfo.starLord,
      subLord: subInfo.subLord,
      subSubLord: subInfo.subSubLord,
      nakshatra: nakInfo.nakshatraName,
      pada: nakInfo.pada,
      degreeInSign: siderealLong % 30
    });
  }

  const ascCusp = houseCusps[0];

  // 3. KP 4-Tier Significator Matrix for all 12 Houses
  // Level 1: Planets in the star of occupants
  // Level 2: Occupants of the house
  // Level 3: Planets in the star of the house lord
  // Level 4: House Lord
  const significators = {};
  for (let h = 1; h <= 12; h++) {
    const cusp = houseCusps[h - 1];
    const houseLord = cusp.signLord;
    
    // Level 2: Occupants
    const occupants = planets.filter(p => p.house === h).map(p => p.name);

    // Level 1: Planets in the star of occupants
    const inStarOfOccupants = planets.filter(p => occupants.includes(p.starLord)).map(p => p.name);

    // Level 4: House Lord
    const lord = houseLord;

    // Level 3: Planets in the star of the house lord
    const inStarOfLord = planets.filter(p => p.starLord === lord).map(p => p.name);

    significators[h] = {
      house: h,
      level1: Array.from(new Set(inStarOfOccupants)),
      level2: Array.from(new Set(occupants)),
      level3: Array.from(new Set(inStarOfLord)),
      level4: [lord]
    };
  }

  // 4. KP Ruling Planets (RP)
  // Day Lord from Local civil day of week
  const localMs = utcDate.getTime() + ((birthData.utcOffset ?? 0) * 3600000);
  const localDate = new Date(localMs);
  const dayOfWeek = localDate.getUTCDay(); // 0 = Sun, 1 = Mon...
  const dayLord = DAY_LORDS[dayOfWeek];
  const moon = planets.find(p => p.name === "Moon");

  const rulingPlanets = {
    lagnaSignLord: ascCusp.signLord,
    lagnaStarLord: ascCusp.starLord,
    lagnaSubLord: ascCusp.subLord,
    moonSignLord: moon ? moon.signLord : "N/A",
    moonStarLord: moon ? moon.starLord : "N/A",
    moonSubLord: moon ? moon.subLord : "N/A",
    dayLord
  };

  // 5. KP Vimshottari Dasha Hierarchy
  let dashaTable = [];
  if (moon) {
    const moonNakSpan = 360 / 27;
    const moonNakPos = moon.longitude % moonNakSpan;
    const balanceRatio = 1 - (moonNakPos / moonNakSpan);
    const starLord = moon.starLord;
    const birthLordIndex = DASHA_LORDS.findIndex(d => d.lord.toLowerCase() === starLord.toLowerCase());
    if (birthLordIndex !== -1) {
      const bDate = birthData.birthDate || (birthData.year ? `${birthData.year}-${String(birthData.month).padStart(2, '0')}-${String(birthData.day).padStart(2, '0')}` : "2000-01-01");
      dashaTable = computeDetailedVimshottari(birthLordIndex, balanceRatio, bDate, jd, birthData.utcOffset ?? 0);
    }
  }

  const isPolar = Math.abs(lat) >= 66.0;
  const houseSystemName = isPolar ? "Equal (Placidus Polar Fallback)" : "Placidus Cusps";

  return {
    system: {
      id: "kp",
      name: "KP (Krishnamurti Padhdhati)",
      ayanamshaName: "KP Original",
      ayanamshaValue: kpAyanamsha,
      houseSystem: houseSystemName
    },
    ascendant: ascCusp,
    houses: houseCusps,
    planets,
    significators,
    rulingPlanets,
    dashaTable,
    dasha: {
      status: "APPLICABLE",
      system: "Vimshottari (KP Nakshatra Base)",
      table: dashaTable
    },
    // Explicitly null / flagged inapplicable traditional frameworks
    shadbala: {
      status: "NOT_APPLICABLE",
      reason: "KP System uses 4-tier significators and Cuspal Sub-lords instead of Parashari Shadbala."
    },
    ashtakavarga: {
      status: "NOT_APPLICABLE",
      reason: "KP System uses Cuspal Sub-lord verification and Star/Sub transits instead of Ashtakavarga bindus."
    },
    jaimini: {
      status: "NOT_APPLICABLE",
      reason: "Jaimini Chara Karakas and Arudhas are not part of Krishnamurti Padhdhati."
    }
  };
}
