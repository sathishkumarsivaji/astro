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
 * Calculate Lunar Nodes (Mean and True) - Authoritative Unified Implementation
 */
export function calculateLunarNodes(T, dateObj, nodeModel = "mean") {
  // Mean Lunar Node polynomial (Chapront 2002 / IAU Standard J2000 anchor 125.04455°)
  const meanRahuTrop = norm360(125.04455 - 1934.136261 * T + 0.0020754 * T * T + (T * T * T) / 467441.0 - (T * T * T * T) / 60616000.0);
  const meanKetuTrop = norm360(meanRahuTrop + 180);

  // True (Osculating) Ascending Node of the Moon computed from instantaneous orbital angular momentum vector h = r x v
  let trueRahuTrop;
  try {
    const deltaSec = 60;
    const v0 = Astronomy.Ecliptic(Astronomy.GeoVector("Moon", new Date(dateObj.getTime() - deltaSec * 1000), true)).vec;
    const v1 = Astronomy.Ecliptic(Astronomy.GeoVector("Moon", new Date(dateObj.getTime() + deltaSec * 1000), true)).vec;
    const rx = (v0.x + v1.x) / 2, ry = (v0.y + v1.y) / 2, rz = (v0.z + v1.z) / 2;
    const vx = (v1.x - v0.x) / (2 * deltaSec), vy = (v1.y - v0.y) / (2 * deltaSec), vz = (v1.z - v0.z) / (2 * deltaSec);
    const hx = ry * vz - rz * vy, hy = rz * vx - rx * vz;
    trueRahuTrop = norm360(Math.atan2(hx, -hy) * (180 / Math.PI));
  } catch (err) {
    // Fallback: Periodic perturbations to calculate True (Oscillating) Node (Jean Meeus Astronomical Algorithms Ch. 47)
    const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T) * DEG2RAD;
    const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T) * DEG2RAD;
    const Mprime = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T) * DEG2RAD;
    const F = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T) * DEG2RAD;
    const deltaNodeDeg = -1.4979 * Math.sin(2 * (D - F))
      - 0.1500 * Math.sin(M)
      - 0.1226 * Math.sin(2 * D)
      + 0.1176 * Math.sin(2 * F)
      - 0.0801 * Math.sin(2 * (D - Mprime));
    trueRahuTrop = norm360(meanRahuTrop + deltaNodeDeg);
  }
  const trueKetuTrop = norm360(trueRahuTrop + 180);

  const selectedModel = (nodeModel || "mean").toLowerCase() === "true" ? "true" : "mean";
  const rahuLong = selectedModel === "true" ? trueRahuTrop : meanRahuTrop;
  const ketuLong = selectedModel === "true" ? trueKetuTrop : meanKetuTrop;

  // Mean node daily speed is always retrograde (~ -0.05295 deg/day)
  const nodeSpeed = -1934.136261 / 36525.0;

  return {
    rahu: {
      name: "Rahu",
      tropicalLongitude: rahuLong,
      meanLongitude: meanRahuTrop,
      trueLongitude: trueRahuTrop,
      nodeModel: selectedModel,
      latitude: 0,
      speed: nodeSpeed,
      isRetrograde: true
    },
    ketu: {
      name: "Ketu",
      tropicalLongitude: ketuLong,
      meanLongitude: meanKetuTrop,
      trueLongitude: trueKetuTrop,
      nodeModel: selectedModel,
      latitude: 0,
      speed: nodeSpeed,
      isRetrograde: true
    },
    meanRahu: meanRahuTrop,
    meanKetu: meanKetuTrop,
    trueRahu: trueRahuTrop,
    trueKetu: trueKetuTrop,
    nodeModel: selectedModel
  };
}

/**
 * Main Ephemeris Retrieval with Caching
 */
export function getAstronomicalObservations(birthData, options = {}) {
  const { jd, T, lat, lng, utcDate } = birthData;
  const nodeModel = (options?.nodeModel || birthData?.nodeModel || "mean").toLowerCase() === "true" ? "true" : "mean";
  const cacheKey = `${jd.toFixed(6)}_${lat.toFixed(4)}_${lng.toFixed(4)}_${nodeModel}`;

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

  // Authoritative Unified Nodes with selected model
  const nodes = calculateLunarNodes(T, utcDate, nodeModel);
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
    nodes,
    nodeModel,
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
