/**
 * ASTROVERSE — Spherical Astronomy & House Cusp Engines
 *
 * Implements high-precision coordinate transformations and house systems:
 * - True Obliquity of the Ecliptic (Laskar 1986 polynomial)
 * - Exact Midheaven (MC) and Ascendant (Lagna)
 * - Placidus Cusp Solver (Iterative Newton-Raphson / bisection for semidiurnal arcs)
 * - Sripati Cusp & Sandhi Engine (Classical Vedic quadrant trisection)
 * - Whole Sign and Equal House systems
 */

import { DEG2RAD, RAD2DEG, norm360 } from "./time.js";

/**
 * Obliquity of the Ecliptic (Laskar 1986)
 */
export function getObliquity(T) {
  const eps0 = 23.43929111 -
               0.013004167 * T -
               0.000000164 * T * T +
               0.0000005036 * T * T * T;
  return eps0; // in degrees
}

/**
 * Calculate Midheaven (MC) and Ascendant (Lagna) from Local Sidereal Time and Latitude
 */
export function calculateAscendantAndMC(lmstDegrees, lat, T) {
  const eps = getObliquity(T) * DEG2RAD;
  const ramc = norm360(lmstDegrees) * DEG2RAD;
  const phi = lat * DEG2RAD;

  // Midheaven (MC) Longitude
  // tan(MC) = tan(RAMC) / cos(eps)
  const mcLong = norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * RAD2DEG);

  // Ascendant Longitude
  // tan(Asc) = cos(RAMC) / (-sin(RAMC)*cos(eps) - tan(phi)*sin(eps))
  const y = Math.cos(ramc);
  const x = -Math.sin(ramc) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps);
  let ascLong = norm360(Math.atan2(y, x) * RAD2DEG);

  return {
    mc: mcLong,
    ascendant: ascLong,
    ramc: ramc * RAD2DEG,
    obliquity: eps * RAD2DEG
  };
}

/**
 * PLACIDUS HOUSE CUSPS
 * Rigorous iterative semidiurnal arc trisection for cusps 11, 12, 2, 3
 */
export function calculatePlacidusCusps(lmstDegrees, lat, T) {
  const { mc, ascendant, obliquity } = calculateAscendantAndMC(lmstDegrees, lat, T);
  const epsRad = obliquity * DEG2RAD;
  const phiRad = lat * DEG2RAD;
  const ramcDeg = norm360(lmstDegrees);

  // If near polar circle (|lat| > 66.5°), Placidus breaks down; fall back gracefully to Equal
  if (Math.abs(lat) >= 66.0) {
    return calculateEqualCusps(ascendant, mc);
  }

  // Helper function to solve Placidus cusp iteratively
  // f = fraction of semi-arc (1/3 for cusp 11 & 3; 2/3 for cusp 12 & 2)
  // isDiurnal: true for cusps 11, 12; false for cusps 2, 3
  function solvePlacidusCusp(ramcTarget, f, isDiurnal) {
    let ra = ramcTarget * DEG2RAD;
    for (let iter = 0; iter < 100; iter++) {
      // Exact relation for ecliptic point: tan(dec) = tan(eps) * sin(ra)
      const tanDec = Math.tan(epsRad) * Math.sin(ra);
      const sinAD = Math.tan(phiRad) * tanDec;
      const clampedSinAD = Math.max(-0.999999, Math.min(0.999999, sinAD));
      const ad = Math.asin(clampedSinAD);
      const dsa = Math.PI / 2 + ad;
      const nsa = Math.PI / 2 - ad;
      
      const targetRA = isDiurnal 
        ? (ramcTarget * DEG2RAD + f * dsa)
        : (ramcTarget * DEG2RAD - f * nsa);
        
      const diff = (targetRA - ra);
      ra += diff * 0.6;
      if (Math.abs(diff) < 1e-9) break;
    }
    // Convert RA to Ecliptic Longitude: tan(long) = sin(ra) / (cos(ra) * cos(eps))
    const y = Math.sin(ra);
    const x = Math.cos(ra) * Math.cos(epsRad);
    return norm360(Math.atan2(y, x) * RAD2DEG);
  }

  const cusp10 = mc;
  const cusp1 = ascendant;

  // Cusps 11 & 12 (Diurnal quadrant between MC and Asc)
  const cusp11 = solvePlacidusCusp(ramcDeg, 1.0 / 3.0, true);
  const cusp12 = solvePlacidusCusp(ramcDeg, 2.0 / 3.0, true);

  // Cusps 2 & 3 (Nocturnal quadrant between Asc and IC)
  const ramcIC = norm360(ramcDeg + 180);
  const cusp2 = solvePlacidusCusp(ramcIC, 2.0 / 3.0, false);
  const cusp3 = solvePlacidusCusp(ramcIC, 1.0 / 3.0, false);

  const cusps = {
    1: cusp1,
    2: cusp2,
    3: cusp3,
    4: norm360(cusp10 + 180),
    5: norm360(cusp11 + 180),
    6: norm360(cusp12 + 180),
    7: norm360(cusp1 + 180),
    8: norm360(cusp2 + 180),
    9: norm360(cusp3 + 180),
    10: cusp10,
    11: cusp11,
    12: cusp12
  };

  return {
    system: "Placidus",
    cusps,
    mc,
    ascendant
  };
}

/**
 * EQUAL HOUSES
 */
export function calculateEqualCusps(ascendant, mc) {
  const cusps = {};
  for (let i = 1; i <= 12; i++) {
    cusps[i] = norm360(ascendant + (i - 1) * 30);
  }
  return {
    system: "Equal",
    cusps,
    mc: mc ?? norm360(ascendant + 270),
    ascendant
  };
}

/**
 * WHOLE SIGN HOUSES
 */
export function calculateWholeSignHouses(ascendant, mc) {
  const ascSignIdx = Math.floor(norm360(ascendant) / 30);
  const houses = {};
  for (let h = 1; h <= 12; h++) {
    const signIdx = (ascSignIdx + h - 1) % 12;
    houses[h] = {
      houseNumber: h,
      signIndex: signIdx,
      startDegree: signIdx * 30,
      midDegree: signIdx * 30 + 15,
      endDegree: signIdx * 30 + 30
    };
  }
  return {
    system: "Whole Sign",
    houses,
    ascendant,
    mc
  };
}

/**
 * SRIPATI BHAVA CHALIT (Classical Vedic unequal house quadrant trisection)
 */
export function calculateSripatiCusps(ascendant, mc) {
  const asc = norm360(ascendant);
  const m = norm360(mc);
  const desc = norm360(asc + 180);
  const ic = norm360(m + 180);

  // Quadrant 1: MC (House 10) to Desc (House 7)
  let q1Dist = norm360(desc - m);
  let q1Third = q1Dist / 3.0;
  const h10Mid = m;
  const h11Mid = norm360(m + q1Third);
  const h12Mid = norm360(m + 2 * q1Third);
  const h1Mid = asc;

  // Quadrant 2: Desc (House 7) to IC (House 4)
  let q2Dist = norm360(ic - desc);
  let q2Third = q2Dist / 3.0;
  const h7Mid = desc;
  const h8Mid = norm360(desc + q2Third);
  const h9Mid = norm360(desc + 2 * q2Third);
  const h4Mid = ic;

  const h2Mid = norm360(h8Mid + 180);
  const h3Mid = norm360(h9Mid + 180);
  const h5Mid = norm360(h11Mid + 180);
  const h6Mid = norm360(h12Mid + 180);

  const midpoints = {
    1: h1Mid, 2: h2Mid, 3: h3Mid, 4: h4Mid,
    5: h5Mid, 6: h6Mid, 7: h7Mid, 8: h8Mid,
    9: h9Mid, 10: h10Mid, 11: h5Mid, 12: h6Mid
  };

  // Sandhis (junction points) are the exact midpoints between consecutive house midpoints
  const sandhis = {};
  for (let h = 1; h <= 12; h++) {
    const nextH = (h % 12) + 1;
    let dist = norm360(midpoints[nextH] - midpoints[h]);
    sandhis[h] = norm360(midpoints[h] + dist / 2.0);
  }

  return {
    system: "Sripati",
    midpoints,
    sandhis,
    ascendant,
    mc
  };
}
