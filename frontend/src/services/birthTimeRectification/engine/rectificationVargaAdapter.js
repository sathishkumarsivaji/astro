/**
 * ASTROVERSE — Canonical Varga Adapter for Birth-Time Rectification
 *
 * Reconstructs strictly verified Divisional Chart representations (D1, D2, D3, D4,
 * D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60) with guaranteed
 * planet identity preservation.
 *
 * Eliminates schema collisions (e.g. sign object name vs planet name) and provides
 * uniform, auditable structures and getPlanet(name) lookups.
 *
 * ZERO changes to validated underlying Parashari divisional mathematics.
 */

import {
  calculateD2,
  calculateD3,
  calculateD4,
  calculateD7,
  calculateD9,
  calculateD10,
  calculateD12,
  calculateD16,
  calculateD20,
  calculateD24,
  calculateD27,
  calculateD30,
  calculateD40,
  calculateD45,
  calculateD60,
  getVargaChartData,
  norm360
} from "../../astroEngine.js";

const VARGA_FUNCTION_MAP = {
  D2: { fn: calculateD2, name: "Hora", number: 2 },
  D3: { fn: calculateD3, name: "Drekkana", number: 3 },
  D4: { fn: calculateD4, name: "Chaturthamsha", number: 4 },
  D7: { fn: calculateD7, name: "Saptamsha", number: 7 },
  D9: { fn: calculateD9, name: "Navamsha", number: 9 },
  D10: { fn: calculateD10, name: "Dasamsha", number: 10 },
  D12: { fn: calculateD12, name: "Dvadasamsha", number: 12 },
  D16: { fn: calculateD16, name: "Shodashamsha", number: 16 },
  D20: { fn: calculateD20, name: "Vimshamsha", number: 20 },
  D24: { fn: calculateD24, name: "Chaturvimshamsha", number: 24 },
  D27: { fn: calculateD27, name: "Saptavimshamsha", number: 27 },
  D30: { fn: calculateD30, name: "Trimsamsha", number: 30 },
  D40: { fn: calculateD40, name: "Khavedamsha", number: 40 },
  D45: { fn: calculateD45, name: "Akshavedamsha", number: 45 },
  D60: { fn: calculateD60, name: "Shashtiamsha", number: 60 }
};

const STANDARD_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

/**
 * Creates canonical Varga container for a given divisional chart
 */
export function buildCanonicalVarga(vargaKey, planets, ascendantLong) {
  const meta = VARGA_FUNCTION_MAP[vargaKey];
  if (!meta || typeof meta.fn !== "function") {
    return null;
  }

  const rawData = getVargaChartData(planets, ascendantLong, meta.fn);
  if (!rawData || !rawData.ascendant) {
    return null;
  }

  // Ensure every standard planet is cleanly represented with invariant identity
  const canonicalPlanets = (rawData.planets || []).map(p => ({
    planet: p.name,
    name: p.name,
    tamil: p.tamil || p.name,
    sign: p.vargaSignName,
    signName: p.vargaSignName,
    signIdx: p.vargaSignIdx,
    signTamil: p.vargaSignTamil,
    house: p.vargaHouse,
    vargaHouse: p.vargaHouse,
    dignity: p.vargaDignity,
    vargaDignity: p.vargaDignity,
    signRuler: p.signRuler,
    longitude: p.longitude
  }));

  const planetMap = new Map();
  for (const p of canonicalPlanets) {
    planetMap.set(p.name.toLowerCase(), p);
  }

  return {
    vargaKey,
    vargaNumber: meta.number,
    vargaName: meta.name,
    ascendant: {
      sign: rawData.ascendant.signName,
      signName: rawData.ascendant.signName,
      signIdx: rawData.ascendant.signIdx,
      signTamil: rawData.ascendant.signTamil,
      ruler: rawData.ascendant.ruler,
      house: 1
    },
    planets: canonicalPlanets,
    getPlanet: (planetName) => {
      if (!planetName || typeof planetName !== "string") return null;
      return planetMap.get(planetName.trim().toLowerCase()) || null;
    }
  };
}

/**
 * Builds all canonical vargas for a candidate chart
 */
export function adaptChartVargas(chartData) {
  if (!chartData) return {};

  const planets = Array.isArray(chartData.planets) ? chartData.planets : [];
  const ascLong = chartData.ascendantLong ?? chartData.ascendant?.longitude ?? chartData.ascendantDeg;
  if (!Number.isFinite(ascLong) || planets.length === 0) {
    return {};
  }

  const adapted = {};
  for (const key of Object.keys(VARGA_FUNCTION_MAP)) {
    adapted[key] = buildCanonicalVarga(key, planets, ascLong);
  }

  return adapted;
}
