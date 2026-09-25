/**
 * ASTROVERSE — Multi-System Astrological Comparison & Cross-System Agreement Engine
 *
 * Compares calculated charts across Lahiri, KP, Raman, and Tropical:
 * - Planetary position & house differences
 * - Agreement classification: AGREEMENT, PARTIAL AGREEMENT, SYSTEM-SPECIFIC, DIVERGENCE, NOT COMPARABLE
 * - Technique applicability matrix
 */

import { degToDms, norm360 } from "../../services/astroEngine.js";

/**
 * Calculates shortest angular distance between two longitudes on a 360° circle
 */
export function angularDistance(a, b) {
  const d = Math.abs(norm360(a) - norm360(b));
  return Math.min(d, 360 - d);
}

export function compareSystems({ lahiriChart, kpChart, ramanChart, tropicalChart }) {
  if (!lahiriChart || !kpChart) {
    throw new Error("At least Lahiri and KP charts are required for multi-system comparison.");
  }

  const bodies = ["Ascendant", "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  const comparisons = [];

  let fullAgreementCount = 0;
  let partialAgreementCount = 0;
  let divergenceCount = 0;
  let signAgreementCount = 0;
  let houseAgreementCount = 0;
  let totalAngularDiff = 0;
  let maxAngularDifference = 0;
  let comparableCount = 0;

  for (const name of bodies) {
    let lahiriPos, kpPos, ramanPos, tropPos;

    if (name === "Ascendant") {
      const lLong = lahiriChart.ascendantLong ?? lahiriChart.ascendant?.longitude;
      const kLong = kpChart.ascendant?.longitude;
      const rLong = ramanChart ? (ramanChart.ascendantLong ?? ramanChart.ascendant?.longitude) : null;
      const tLong = tropicalChart ? tropicalChart.ascendant?.longitude : null;

      if (lLong === undefined || lLong === null || kLong === undefined || kLong === null) {
        comparisons.push({
          body: name,
          lahiri: null,
          kp: null,
          raman: null,
          tropical: null,
          divergence: { lahiriMinusKp: "N/A", lahiriMinusRaman: "N/A", tropicalMinusLahiri: "N/A" },
          classification: "NOT_COMPARABLE",
          explanation: "Ascendant coordinate missing in one or more primary charts."
        });
        continue;
      }

      lahiriPos = {
        longitude: lLong,
        sign: lahiriChart.ascendantSign?.name ?? lahiriChart.ascendant?.signName ?? "N/A",
        house: 1,
        nakshatra: lahiriChart.ascendantNakshatra?.name ?? "N/A",
        pada: lahiriChart.ascendantNakshatra?.pada ?? null
      };
      kpPos = {
        longitude: kLong,
        sign: kpChart.ascendant?.signName ?? "N/A",
        house: 1,
        starLord: kpChart.ascendant?.starLord ?? "N/A",
        subLord: kpChart.ascendant?.subLord ?? "N/A"
      };
      ramanPos = ramanChart ? {
        longitude: rLong,
        sign: ramanChart.ascendantSign?.name ?? ramanChart.ascendant?.signName ?? "N/A",
        house: 1
      } : null;
      tropPos = tropicalChart ? {
        longitude: tLong,
        sign: tropicalChart.ascendant?.signName ?? "N/A",
        house: 1
      } : null;
    } else {
      const lPlanet = (lahiriChart.planets || []).find(p => p.name === name);
      const kpPlanet = (kpChart.planets || []).find(p => p.name === name);
      const rPlanet = ramanChart ? ((ramanChart.planets || []).find(p => p.name === name)) : null;
      const tPlanet = tropicalChart ? ((tropicalChart.planets || []).find(p => p.name === name)) : null;

      if (!lPlanet || !kpPlanet) {
        comparisons.push({
          body: name,
          lahiri: lPlanet ? { longitude: lPlanet.long, sign: lPlanet.sign, house: lPlanet.house } : null,
          kp: kpPlanet ? { longitude: kpPlanet.longitude, sign: kpPlanet.signName, house: kpPlanet.house } : null,
          raman: rPlanet ? { longitude: rPlanet.long, sign: rPlanet.sign, house: rPlanet.house } : null,
          tropical: tPlanet ? { longitude: tPlanet.longitude, sign: tPlanet.signName, house: tPlanet.house } : null,
          divergence: { lahiriMinusKp: "N/A", lahiriMinusRaman: "N/A", tropicalMinusLahiri: "N/A" },
          classification: "NOT_COMPARABLE",
          explanation: `Planetary data for ${name} unavailable in one or more primary charts.`
        });
        continue;
      }

      lahiriPos = {
        longitude: lPlanet.long ?? lPlanet.longitude,
        sign: lPlanet.sign ?? lPlanet.signName ?? "N/A",
        house: lPlanet.house ?? null,
        nakshatra: lPlanet.nakshatra ?? "N/A",
        pada: lPlanet.nakshatraPada ?? lPlanet.pada ?? null
      };

      kpPos = {
        longitude: kpPlanet.longitude,
        sign: kpPlanet.signName ?? "N/A",
        house: kpPlanet.house ?? null,
        starLord: kpPlanet.starLord ?? "N/A",
        subLord: kpPlanet.subLord ?? "N/A"
      };

      ramanPos = rPlanet ? {
        longitude: rPlanet.long ?? rPlanet.longitude,
        sign: rPlanet.sign ?? rPlanet.signName ?? "N/A",
        house: rPlanet.house ?? null
      } : null;

      tropPos = tPlanet ? {
        longitude: tPlanet.longitude,
        sign: tPlanet.signName ?? "N/A",
        house: tPlanet.house ?? null,
        dignity: tPlanet.dignity ?? "Peregrine"
      } : null;
    }

    comparableCount++;

    // Compare Sidereal Systems (Lahiri vs KP vs Raman)
    const sameSignLahiriKp = lahiriPos.sign !== "N/A" && kpPos.sign !== "N/A" && lahiriPos.sign === kpPos.sign;
    const sameHouseLahiriKp = lahiriPos.house !== null && kpPos.house !== null && lahiriPos.house === kpPos.house;
    const sameSignLahiriRaman = ramanPos ? (lahiriPos.sign !== "N/A" && ramanPos.sign !== "N/A" && lahiriPos.sign === ramanPos.sign) : true;
    const sameHouseLahiriRaman = ramanPos ? (lahiriPos.house !== null && ramanPos.house !== null && lahiriPos.house === ramanPos.house) : true;

    if (sameSignLahiriKp && sameSignLahiriRaman) signAgreementCount++;
    if (sameHouseLahiriKp && sameHouseLahiriRaman) houseAgreementCount++;

    const angDiffKp = angularDistance(lahiriPos.longitude, kpPos.longitude);
    totalAngularDiff += angDiffKp;
    if (angDiffKp > maxAngularDifference) maxAngularDifference = angDiffKp;

    let classification = "AGREEMENT";
    let explanation = "Positions and house assignments coincide across sidereal models.";

    if (sameSignLahiriKp && sameHouseLahiriKp && sameSignLahiriRaman && sameHouseLahiriRaman) {
      classification = "AGREEMENT";
      fullAgreementCount++;
      explanation = "Harmonious: Same zodiac sign and identical house placement in all sidereal systems.";
    } else if (sameSignLahiriKp || sameHouseLahiriKp) {
      classification = "PARTIAL AGREEMENT";
      partialAgreementCount++;
      explanation = `Partial convergence: ${sameSignLahiriKp ? "Identical sign" : "Different sign"}, ${sameHouseLahiriKp ? "identical house" : "house boundary shift due to Placidus cusps"}.`;
    } else {
      classification = "DIVERGENCE";
      divergenceCount++;
      explanation = "Divergence: Sign or house changed due to distinct ayanamsha offset or cuspal geometry.";
    }

    comparisons.push({
      body: name,
      lahiri: {
        ...lahiriPos,
        formatted: degToDms(lahiriPos.longitude)
      },
      kp: {
        ...kpPos,
        formatted: degToDms(kpPos.longitude)
      },
      raman: ramanPos ? {
        ...ramanPos,
        formatted: degToDms(ramanPos.longitude)
      } : null,
      tropical: tropPos ? {
        ...tropPos,
        formatted: degToDms(tropPos.longitude)
      } : null,
      divergence: {
        lahiriMinusKp: (lahiriPos.longitude - kpPos.longitude).toFixed(4),
        lahiriMinusRaman: ramanPos ? (lahiriPos.longitude - ramanPos.longitude).toFixed(4) : "N/A",
        tropicalMinusLahiri: tropPos ? (tropPos.longitude - lahiriPos.longitude).toFixed(4) : "N/A"
      },
      classification,
      explanation
    });
  }

  // Technique Applicability Matrix
  const techniqueMatrix = [
    { technique: "Vedic Nakshatras & 108 Padas", lahiri: "Applicable (Standard)", kp: "Applicable (Star Base)", raman: "Applicable", tropical: "Inapplicable (Sayana)" },
    { technique: "Placidus House Cusps", lahiri: "Equal / Whole Sign Default", kp: "Core Foundation (Placidus)", raman: "Whole Sign / Sripati", tropical: "Standard (Placidus)" },
    { technique: "249 Cuspal Sub-Lords", lahiri: "Not Used", kp: "Core Methodology", raman: "Not Used", tropical: "Not Used" },
    { technique: "4-Tier House Significators", lahiri: "Not Used", kp: "Primary Predictive Engine", raman: "Not Used", tropical: "Not Used" },
    { technique: "Six-fold Shadbala Suite", lahiri: "Full 6-Fold Calculation", kp: "Inapplicable (Not Used)", raman: "Full 6-Fold Calculation", tropical: "Inapplicable" },
    { technique: "Ashtakavarga (337 Bindus)", lahiri: "Full 7-Graha BAV + SAV", kp: "Inapplicable (Not Used)", raman: "Full 7-Graha BAV + SAV", tropical: "Inapplicable" },
    { technique: "Jaimini Chara Karakas", lahiri: "7-Karaka Canonical System", kp: "Inapplicable", raman: "7-Karaka Canonical System", tropical: "Inapplicable" },
    { technique: "Vargas (D1 to D60 Deities)", lahiri: "16 Classical Shodashavargas", kp: "Replaced by Sub-Lords", raman: "16 Classical Shodashavargas", tropical: "Inapplicable" },
    { technique: "Vimshottari Dasha Suite", lahiri: "120-Year Solar Framework", kp: "120-Year KP Timing", raman: "120-Year Solar Framework", tropical: "Inapplicable" },
    { technique: "Ptolemaic Western Aspects", lahiri: "Drik Bala Aspect Virupas", kp: "Western Aspects Secondary", raman: "Drik Bala Aspect Virupas", tropical: "Core Geometric Aspects & Orbs" },
    { technique: "Western Essential Dignities", lahiri: "Uchcha / Neecha / Moolatrikona", kp: "Planet / Sub Nature", raman: "Uchcha / Neecha / Moolatrikona", tropical: "Domicile, Exaltation, Detriment, Fall" }
  ];

  return {
    summary: {
      totalPointsCompared: bodies.length,
      fullAgreementCount,
      partialAgreementCount,
      divergenceCount,
      signAgreementCount,
      houseAgreementCount,
      meanLahiriKpAngularDifference: (totalAngularDiff / Math.max(1, comparableCount)).toFixed(4),
      meanAbsoluteAngularDifference: (totalAngularDiff / Math.max(1, comparableCount)).toFixed(4),
      maxAngularDifference: maxAngularDifference.toFixed(4),
      agreementPercentage: Math.round((fullAgreementCount / Math.max(1, comparableCount)) * 100),
      lahiriAyanamsha: (typeof lahiriChart.ayanamsa === "number" || typeof lahiriChart.ayanamsaValue === "number")
        ? degToDms(lahiriChart.ayanamsa ?? lahiriChart.ayanamsaValue)
        : "N/A",
      kpAyanamsha: (typeof kpChart.system?.ayanamshaValue === "number")
        ? degToDms(kpChart.system.ayanamshaValue)
        : "N/A",
      ramanAyanamsha: ramanChart && (typeof ramanChart.ayanamsa === "number" || typeof ramanChart.ayanamsaValue === "number")
        ? degToDms(ramanChart.ayanamsa ?? ramanChart.ayanamsaValue)
        : "N/A"
    },
    comparisons,
    techniqueMatrix
  };
}
