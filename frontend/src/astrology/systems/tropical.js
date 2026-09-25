/**
 * ASTROVERSE — Tropical / Sayana (Western Astrology) Engine
 *
 * Implements genuine Western Tropical system:
 * - 0° Aries tied strictly to the Vernal Equinox (Zero Ayanamsha)
 * - Tropical Placidus House Cusps
 * - Classical Ptolemaic Aspects with Orbs & Applying/Separating dynamics
 * - Western Essential Dignities (Rulership, Exaltation, Detriment, Fall)
 * - Explicit disclaimers and flags for Vedic-only techniques
 */

import { norm360 } from "../astronomy/time.js";
import { calculatePlacidusCusps } from "../astronomy/coordinates.js";
import { SIGN_NAMES } from "../derived/nakshatra.js";

const WESTERN_ASPECTS = [
  { name: "Conjunction", angle: 0, orb: 8.0, nature: "Major Neutral/Potent" },
  { name: "Sextile", angle: 60, orb: 6.0, nature: "Harmonious" },
  { name: "Square", angle: 90, orb: 7.0, nature: "Challenging / Dynamic" },
  { name: "Trine", angle: 120, orb: 8.0, nature: "Benefic / Flow" },
  { name: "Opposition", angle: 180, orb: 8.0, nature: "Polarizing / Awareness" }
];

const ESSENTIAL_DIGNITIES = {
  Sun: { rulership: ["Leo"], exaltation: "Aries", detriment: ["Aquarius"], fall: "Libra" },
  Moon: { rulership: ["Cancer"], exaltation: "Taurus", detriment: ["Capricorn"], fall: "Scorpio" },
  Mercury: { rulership: ["Gemini", "Virgo"], exaltation: "Virgo", detriment: ["Sagittarius", "Pisces"], fall: "Pisces" },
  Venus: { rulership: ["Taurus", "Libra"], exaltation: "Pisces", detriment: ["Aries", "Scorpio"], fall: "Virgo" },
  Mars: { rulership: ["Aries", "Scorpio"], exaltation: "Capricorn", detriment: ["Taurus", "Libra"], fall: "Cancer" },
  Jupiter: { rulership: ["Sagittarius", "Pisces"], exaltation: "Cancer", detriment: ["Gemini", "Virgo"], fall: "Capricorn" },
  Saturn: { rulership: ["Capricorn", "Aquarius"], exaltation: "Libra", detriment: ["Cancer", "Leo"], fall: "Aries" }
};

export function calculateTropicalChart(observations, birthData) {
  const { jd, T, lat, lng } = observations;
  const lmst = observations.sidereal.lmstDegrees;

  // 1. Tropical Placidus Cusps
  const placidusRaw = calculatePlacidusCusps(lmst, lat, T);
  const houseCusps = [];

  for (let h = 1; h <= 12; h++) {
    const cuspDeg = placidusRaw.cusps[h];
    const signIdx = Math.floor(cuspDeg / 30);
    houseCusps.push({
      house: h,
      longitude: cuspDeg,
      signIndex: signIdx,
      signName: SIGN_NAMES[signIdx],
      degreeInSign: cuspDeg % 30
    });
  }

  // 2. Tropical Planets
  const planetNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Uranus", "Neptune", "Pluto", "Rahu", "Ketu"];
  const planets = [];

  for (const name of planetNames) {
    const raw = observations.tropicalBodies[name];
    if (!raw) continue;
    const long = norm360(raw.tropicalLongitude);
    const signIdx = Math.floor(long / 30);
    const signName = SIGN_NAMES[signIdx];

    // Determine occupied house from Placidus cusps
    let occupiedHouse = 1;
    for (let h = 1; h <= 12; h++) {
      const currentCusp = houseCusps[h - 1].longitude;
      const nextCusp = houseCusps[h % 12].longitude;
      let inHouse = false;
      if (nextCusp > currentCusp) {
        inHouse = long >= currentCusp && long < nextCusp;
      } else {
        inHouse = long >= currentCusp || long < nextCusp;
      }
      if (inHouse) {
        occupiedHouse = h;
        break;
      }
    }

    // Essential Dignity evaluation
    let dignity = "Peregrine";
    const digRules = ESSENTIAL_DIGNITIES[name];
    if (digRules) {
      if (digRules.rulership.includes(signName)) dignity = "Domicile (Ruler)";
      else if (digRules.exaltation === signName) dignity = "Exaltation";
      else if (digRules.detriment.includes(signName)) dignity = "Detriment";
      else if (digRules.fall === signName) dignity = "Fall";
    }

    planets.push({
      name,
      longitude: long,
      speed: raw.speed,
      isRetrograde: raw.isRetrograde,
      house: occupiedHouse,
      signIndex: signIdx,
      sign: signName,
      signName,
      degreeInSign: long % 30,
      dignity
    });
  }

  // 3. Western Aspects Matrix
  const aspects = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const asp of WESTERN_ASPECTS) {
        const orbDist = Math.abs(diff - asp.angle);
        if (orbDist <= asp.orb) {
          // Applying vs Separating:
          // Rigorous numerical derivative of angular separation error:
          // Project forward by dt = 1 hour (1/24 day) using each body's true speed (deg/day)
          const dtHours = 1.0 / 24.0;
          const futurePos1 = norm360(p1.longitude + (p1.speed * dtHours));
          const futurePos2 = norm360(p2.longitude + (p2.speed * dtHours));
          let futureDiff = Math.abs(futurePos1 - futurePos2);
          if (futureDiff > 180) futureDiff = 360 - futureDiff;
          const futureOrb = Math.abs(futureDiff - asp.angle);

          const isApplying = futureOrb < orbDist;

          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            aspect: asp.name,
            angle: asp.angle,
            actualSeparation: diff,
            orb: orbDist,
            nature: asp.nature,
            status: isApplying ? "Applying" : "Separating"
          });
          break;
        }
      }
    }
  }

  const ascCusp = houseCusps[0];
  const mcCusp = houseCusps[9];
  const sun = planets.find(p => p.name === "Sun");
  const moon = planets.find(p => p.name === "Moon");

  return {
    system: {
      id: "tropical",
      name: "Tropical / Sayana (Western)",
      ayanamshaName: "None (Sayana)",
      ayanamshaValue: 0.0,
      houseSystem: "Placidus"
    },
    ascendant: ascCusp,
    ascendantSign: { name: ascCusp.signName, index: ascCusp.signIndex },
    midheaven: mcCusp,
    sunSign: sun ? { name: sun.signName, index: sun.signIndex } : null,
    moonSign: moon ? { name: moon.signName, index: moon.signIndex } : null,
    ayanamsa: 0.0,
    ayanamsaValue: 0.0,
    houses: houseCusps,
    planets,
    aspects,
    dashaTable: [],
    currentDasha: null,
    curMd: null,
    curBk: null,
    // Explicitly null / flagged inapplicable Vedic frameworks
    shadbala: {
      status: "NOT_APPLICABLE",
      reason: "Tropical Western astrology uses Essential and Accidental Dignities instead of Parashari Shadbala."
    },
    ashtakavarga: {
      status: "NOT_APPLICABLE",
      reason: "Ashtakavarga is an exclusively Vedic lunar-sidereal mathematical framework."
    },
    jaimini: {
      status: "NOT_APPLICABLE",
      reason: "Jaimini Sutras and Chara Karakas belong exclusively to the Vedic sidereal tradition."
    },
    dasha: {
      status: "NOT_APPLICABLE",
      reason: "Vimshottari Dasha requires sidereal Moon nakshatra divisions not utilized in Sayana astrology."
    },
    vargas: {
      status: "NOT_APPLICABLE",
      reason: "Harmonic divisional charts (D1–D60) are specific to Indian Parasara Jyotisha."
    },
    panchanga: {
      status: "NOT_APPLICABLE",
      reason: "Vedic Panchanga (Tithi, Nakshatra, Yoga, Karana) requires sidereal coordinates."
    }
  };
}
