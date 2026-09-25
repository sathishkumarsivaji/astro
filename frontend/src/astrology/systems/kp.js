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
      sign: subInfo.signName,
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

  // KP Event Significator Evaluation Groups
  // Evaluates primary house significator clusters for key life events:
  // - Marriage: 2 (Family), 7 (Partner), 11 (Desire fulfillment)
  // - Career: 2 (Wealth), 6 (Service/Job), 10 (Status/Profession), 11 (Gains)
  // - Property: 4 (Fixed assets), 11 (Gains), 12 (Investment)
  // - Education: 4 (Foundation), 9 (Higher learning), 11 (Success)
  // - Foreign Travel: 3 (Journeys), 9 (Long distance), 12 (Foreign lands)
  function getPlanetsForHouseGroup(houses) {
    const planetScores = {};
    for (const h of houses) {
      const sig = significators[h];
      if (!sig) continue;
      sig.level1.forEach(p => { planetScores[p] = (planetScores[p] || 0) + 4; });
      sig.level2.forEach(p => { planetScores[p] = (planetScores[p] || 0) + 3; });
      sig.level3.forEach(p => { planetScores[p] = (planetScores[p] || 0) + 2; });
      sig.level4.forEach(p => { planetScores[p] = (planetScores[p] || 0) + 1; });
    }
    return Object.entries(planetScores)
      .map(([planet, strength]) => ({ planet, strength }))
      .sort((a, b) => b.strength - a.strength);
  }

  const eventSignificators = {
    marriage: {
      houses: [2, 7, 11],
      description: "Family expansion (2nd), partner/spouse (7th), and fulfillment of desire (11th)",
      ranking: getPlanetsForHouseGroup([2, 7, 11])
    },
    career: {
      houses: [2, 6, 10, 11],
      description: "Income/Wealth (2nd), service/employment (6th), status/profession (10th), and financial gains (11th)",
      ranking: getPlanetsForHouseGroup([2, 6, 10, 11])
    },
    property: {
      houses: [4, 11, 12],
      description: "Fixed assets/vehicles (4th), gains (11th), and investment/outflow (12th)",
      ranking: getPlanetsForHouseGroup([4, 11, 12])
    },
    education: {
      houses: [4, 9, 11],
      description: "Foundational education (4th), higher research/learning (9th), and achievements (11th)",
      ranking: getPlanetsForHouseGroup([4, 9, 11])
    },
    foreignTravel: {
      houses: [3, 9, 12],
      description: "Movement (3rd), long distance travel (9th), and foreign residence (12th)",
      ranking: getPlanetsForHouseGroup([3, 9, 12])
    }
  };

  // 4. KP Ruling Planets (RP)
  // Day Lord strictly resolved from local civil calendar day of week
  const civilYear = birthData.year ?? (birthData.birthDate ? Number(birthData.birthDate.split("-")[0]) : 2000);
  const civilMonth = birthData.month ?? (birthData.birthDate ? Number(birthData.birthDate.split("-")[1]) : 1);
  const civilDay = birthData.day ?? (birthData.birthDate ? Number(birthData.birthDate.split("-")[2]) : 1);
  const localCivDate = new Date(Date.UTC(civilYear, civilMonth - 1, civilDay, 12, 0, 0));
  const dayOfWeek = localCivDate.getUTCDay(); // 0 = Sun, 1 = Mon...
  const dayLord = DAY_LORDS[dayOfWeek];
  const moon = planets.find(p => p.name === "Moon");
  const sun = planets.find(p => p.name === "Sun");

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
    ascendantSign: { name: ascCusp.signName },
    sunSign: sun ? { name: sun.signName } : null,
    moonSign: moon ? { name: moon.signName } : null,
    moonNakshatra: moon ? { name: moon.nakshatra, pada: moon.pada } : null,
    sunNakshatra: sun ? { name: sun.nakshatra, pada: sun.pada } : null,
    ayanamsa: kpAyanamsha,
    ayanamsaValue: kpAyanamsha,
    houses: houseCusps,
    planets,
    significators,
    eventSignificators,
    rulingPlanets,
    dashaTable,
    currentDasha: dashaTable?.[0] || null,
    curMd: dashaTable?.[0] || null,
    curBk: dashaTable?.[0]?.bukthis?.[0] || null,
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
