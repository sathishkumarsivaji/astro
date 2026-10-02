/**
 * ASTROVERSE — Sensitivity & Perturbation Analyzer for Birth-Time Rectification
 *
 * Tests the peak candidate against small perturbations (±1m, ±5m, ±10m)
 * and measures whether fundamental astrological conclusions or divisional lagnas change.
 */

import { getCachedOrComputeChart } from "./chartEvaluator.js";
import { formatMinutesToTimeString } from "./candidateGenerator.js";
import { buildCanonicalVarga } from "./rectificationVargaAdapter.js";

function getVargaLagnaSign(chart, vargaKey) {
  if (!chart) return null;
  const planets = Array.isArray(chart.planets) ? chart.planets : [];
  const ascLong = chart.ascendantLong ?? chart.ascendant?.longitude ?? chart.ascendantDeg;
  if (!Number.isFinite(ascLong)) return null;

  if (vargaKey === "D1") {
    return chart.ascendant?.sign || chart.ascendantSign?.name || null;
  }

  const varga = buildCanonicalVarga(vargaKey, planets, ascLong);
  return varga?.ascendant?.sign || null;
}

export function analyzeCandidateSensitivity({
  peakCandidate,
  birthDate,
  lat,
  lng,
  system = "lahiri",
  tz = 5.5
}) {
  if (!peakCandidate || !peakCandidate.chart) {
    return {
      computed: false,
      sensitivityLevel: null,
      d1LagnaStable: null,
      d9LagnaStable: null,
      d60LagnaStable: null,
      perturbations: []
    };
  }

  const centerMin = peakCandidate.totalMinutes || 0;
  const offsets = [-10, -5, -1, 1, 5, 10];
  const perturbations = [];

  const baseD1Sign = getVargaLagnaSign(peakCandidate.chart, "D1");
  const baseD9Sign = getVargaLagnaSign(peakCandidate.chart, "D9");
  const baseD60Sign = getVargaLagnaSign(peakCandidate.chart, "D60");

  if (!baseD1Sign || !baseD9Sign || !baseD60Sign) {
    return {
      computed: false,
      sensitivityLevel: null,
      d1Sign: baseD1Sign || "Not Computed",
      d9Sign: baseD9Sign || "Not Computed",
      d60Sign: baseD60Sign || "Not Computed",
      d1LagnaStable: null,
      d9LagnaStable: null,
      d60LagnaStable: null,
      perturbations: []
    };
  }

  let d1Changes = 0;
  let d9Changes = 0;
  let d60Changes = 0;

  for (const off of offsets) {
    const pMin = centerMin + off;
    const pTime = formatMinutesToTimeString(pMin);
    const pChart = getCachedOrComputeChart({
      birthDate,
      timeString: pTime,
      lat,
      lng,
      system,
      tz
    });

    const pD1 = getVargaLagnaSign(pChart, "D1") || "Unknown";
    const pD9 = getVargaLagnaSign(pChart, "D9") || "Unknown";
    const pD60 = getVargaLagnaSign(pChart, "D60") || "Unknown";

    if (pD1 !== baseD1Sign) d1Changes++;
    if (pD9 !== baseD9Sign) d9Changes++;
    if (pD60 !== baseD60Sign) d60Changes++;

    perturbations.push({
      offsetMinutes: off,
      timeString: pTime,
      d1Sign: pD1,
      d9Sign: pD9,
      d60Sign: pD60
    });
  }

  let sensitivityLevel = "LOW";
  if (d1Changes > 0 || d9Changes >= 4) {
    sensitivityLevel = "HIGH";
  } else if (d9Changes > 0 || d60Changes >= 3) {
    sensitivityLevel = "MEDIUM";
  }

  return {
    computed: true,
    sensitivityLevel,
    d1Sign: baseD1Sign,
    d9Sign: baseD9Sign,
    d60Sign: baseD60Sign,
    d1LagnaStable: d1Changes === 0,
    d9LagnaStable: d9Changes === 0,
    d60LagnaStable: d60Changes === 0,
    d1Changes,
    d9Changes,
    d60Changes,
    perturbations
  };
}

export function runSensitivityAnalysis(options, timeString = "") {
  if (options && typeof options === "object" && options.peakCandidate) {
    return analyzeCandidateSensitivity(options);
  }
  return {
    computed: false,
    sensitivityLevel: null,
    baseTime: timeString,
    d1LagnaStable: null,
    d9LagnaStable: null,
    d60LagnaStable: null,
    perturbations: []
  };
}
