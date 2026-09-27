/**
 * ASTROVERSE — High-Precision Ephemeris & Astronomical Observation Layer
 *
 * Wraps astronomy-engine for geocentric ecliptic coordinates, velocities,
 * lunar node calculations (Mean and True), and ayanamsha evaluation.
 * Implements an observation cache to prevent redundant recalculation.
 */

import * as Astronomy from "astronomy-engine";
import { norm360, DEG2RAD, RAD2DEG, calculateSiderealTime } from "./time.js";
import { calculateAscendantAndMC } from "./coordinates.js";

// Ephemeris Observation Cache (keyed by JD rounded to 1ms equivalent)
const observationCache = new Map();

import {
  getLahiriAyanamsha,
  getKPAyanamsha,
  getRamanAyanamsha,
  getAyanamshaForSystem
} from "./ayanamsha.js";

export {
  getLahiriAyanamsha,
  getKPAyanamsha,
  getRamanAyanamsha,
  getAyanamshaForSystem
};

/**
 * Pure Astronomical Body Calculation (Tropical geocentric ecliptic)
 */
function calculateTropicalBody(bodyName, dateObj) {
  try {
    const geo = Astronomy.GeoVector(bodyName, dateObj, true);
    const ecl = Astronomy.Ecliptic(geo);
    
    // Calculate speed using offset by +0.01 days (~14.4 minutes)
    const dtDays = 0.01;
    const datePlus = new Date(dateObj.getTime() + dtDays * 86400000);
    const geoPlus = Astronomy.GeoVector(bodyName, datePlus, true);
    const eclPlus = Astronomy.Ecliptic(geoPlus);
    
    let diff = eclPlus.elon - ecl.elon;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    const speed = diff / dtDays; // degrees per day

    return {
      name: bodyName,
      tropicalLongitude: norm360(ecl.elon),
      latitude: ecl.elat,
      speed,
      isRetrograde: speed < 0
    };
  } catch (err) {
    throw new Error(`Failed to calculate ephemeris for ${bodyName}: ${err.message}`);
  }
}

/**
 * Calculate Lunar Nodes (Mean and True)
 */
function calculateLunarNodes(T, dateObj, nodeModel = "mean") {
  // Mean Rahu (apparent geocentric longitude)
  const omega = norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000.0);
  const meanRahu = norm360(omega);
  const meanKetu = norm360(meanRahu + 180);

  // Periodic perturbations to calculate True (Oscillating) Node (Jean Meeus Astronomical Algorithms)
  const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T) * DEG2RAD;
  const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T) * DEG2RAD;
  const Mprime = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T) * DEG2RAD;
  const F = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T) * DEG2RAD;

  const deltaNodeDeg = -1.4979 * Math.sin(2 * (F - D))
    - 0.1500 * Math.sin(M)
    - 0.1226 * Math.sin(2 * F)
    + 0.1176 * Math.sin(2 * D)
    - 0.0801 * Math.sin(2 * (F - Mprime));

  const trueRahu = norm360(meanRahu + deltaNodeDeg);
  const trueKetu = norm360(trueRahu + 180);

  const selectedModel = (nodeModel || "mean").toLowerCase() === "true" ? "true" : "mean";
  const rahuLong = selectedModel === "true" ? trueRahu : meanRahu;
  const ketuLong = selectedModel === "true" ? trueKetu : meanKetu;

  // Mean node daily speed is always retrograde (~ -0.05295 deg/day)
  const nodeSpeed = -1934.136261 / 36525.0;

  return {
    rahu: {
      name: "Rahu",
      tropicalLongitude: rahuLong,
      meanLongitude: meanRahu,
      trueLongitude: trueRahu,
      nodeModel: selectedModel,
      latitude: 0,
      speed: nodeSpeed,
      isRetrograde: true
    },
    ketu: {
      name: "Ketu",
      tropicalLongitude: ketuLong,
      meanLongitude: meanKetu,
      trueLongitude: trueKetu,
      nodeModel: selectedModel,
      latitude: 0,
      speed: nodeSpeed,
      isRetrograde: true
    },
    meanRahu,
    meanKetu,
    trueRahu,
    trueKetu,
    nodeModel: selectedModel
  };
}

/**
 * Main Ephemeris Retrieval with Caching
 */
export function getAstronomicalObservations(birthData) {
  const { jd, T, lat, lng, utcDate } = birthData;
  const cacheKey = `${jd.toFixed(6)}_${lat.toFixed(4)}_${lng.toFixed(4)}`;

  if (observationCache.has(cacheKey)) {
    return observationCache.get(cacheKey);
  }

  // Sidereal times
  const sidereal = calculateSiderealTime(jd, lng);

  // Ascendant and MC (Tropical)
  const angles = calculateAscendantAndMC(sidereal.lmstDegrees, lat, T);

  // Major bodies
  const standardBodies = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Uranus", "Neptune", "Pluto"];
  const bodies = {};

  for (const bName of standardBodies) {
    bodies[bName] = calculateTropicalBody(bName, utcDate);
  }

  // Nodes
  const nodes = calculateLunarNodes(T, utcDate);
  bodies["Rahu"] = nodes.rahu;
  bodies["Ketu"] = nodes.ketu;

  // Ayanamshas
  const lahiriAyanamsha = getLahiriAyanamsha(jd);
  const kpAyanamsha = getKPAyanamsha(jd);
  const ramanAyanamsha = getRamanAyanamsha(jd);

  const observation = {
    jd,
    T,
    lat,
    lng,
    utcDate,
    sidereal,
    tropicalAngles: angles,
    tropicalBodies: bodies,
    ayanamshas: {
      lahiri: lahiriAyanamsha,
      kp: kpAyanamsha,
      raman: ramanAyanamsha,
      tropical: 0.0
    }
  };

  // Limit cache size to 100 entries to prevent memory leaks
  if (observationCache.size > 100) {
    const firstKey = observationCache.keys().next().value;
    observationCache.delete(firstKey);
  }
  observationCache.set(cacheKey, observation);

  return observation;
}
