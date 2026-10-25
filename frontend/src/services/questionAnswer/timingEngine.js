/**
 * ASTROVERSE — Dedicated Deterministic Timing Engine
 * ====================================================
 * Evaluates event timing strictly from multi-factor convergence:
 * Natal Potential + Dasha Activation + Transit Triggers + Varga Confirmation.
 *
 * Implements Section 10, Section 11, and Section 16 of the Precision Q&A Engine Mandate.
 * ZERO hardcoded years. ZERO generic fallback dates.
 */

import { buildTimingWindowId, buildDashaFactId, buildTransitFactId } from "./evidenceGraph.js";

const SIGN_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_LORDS = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter"
};

/**
 * Maps domains to primary astrological activating houses and significators.
 */
export const DOMAIN_ACTIVATION_FACTORS = {
  MARRIAGE: { houses: [2, 7, 11], karakas: ["Venus", "Jupiter"], varga: "d9", vargaFactor: "VARGA_FACT_D9_7TH_CONFIRMED" },
  PROPERTY: { houses: [2, 4, 11], karakas: ["Mars", "Saturn", "Venus"], varga: "d4", vargaFactor: "VARGA_FACT_D4_PROPERTY_CONFIRMED" },
  CONSTRUCTION: { houses: [4, 11], karakas: ["Mars", "Saturn"], varga: "d4", vargaFactor: "VARGA_FACT_D4_PROPERTY_CONFIRMED" },
  VEHICLE: { houses: [4, 11], karakas: ["Venus", "Mars"], varga: "d16", vargaFactor: "VARGA_FACT_D16_VEHICLE_CONFIRMED" },
  CAREER: { houses: [2, 6, 10, 11], karakas: ["Saturn", "Sun", "Mercury", "Jupiter"], varga: "d10", vargaFactor: "VARGA_FACT_D10_10TH_CONFIRMED" },
  JOB: { houses: [6, 10, 11], karakas: ["Saturn", "Sun", "Mercury"], varga: "d10", vargaFactor: "VARGA_FACT_D10_10TH_CONFIRMED" },
  BUSINESS: { houses: [2, 7, 10, 11], karakas: ["Mercury", "Jupiter"], varga: "d10", vargaFactor: "VARGA_FACT_D10_10TH_CONFIRMED" },
  FINANCE: { houses: [2, 5, 9, 11], karakas: ["Jupiter", "Mercury", "Venus"], varga: "d2", vargaFactor: "VARGA_FACT_D2_WEALTH_CONFIRMED" },
  EDUCATION: { houses: [4, 5, 9], karakas: ["Mercury", "Jupiter"], varga: "d24", vargaFactor: "VARGA_FACT_D24_EDUCATION_CONFIRMED" },
  FOREIGN_TRAVEL: { houses: [3, 9, 12], karakas: ["Moon", "Rahu", "Saturn", "Jupiter"], varga: "d9", vargaFactor: "VARGA_FACT_D9_TRAVEL_CONFIRMED" },
  WORK_ABROAD: { houses: [9, 10, 12], karakas: ["Rahu", "Saturn", "Moon"], varga: "d10", vargaFactor: "VARGA_FACT_D10_FOREIGN_WORK_CONFIRMED" },
  FOREIGN_SETTLEMENT: { houses: [4, 9, 12], karakas: ["Rahu", "Saturn", "Moon"], varga: "d4", vargaFactor: "VARGA_FACT_D4_SETTLEMENT_CONFIRMED" },
  CHILDREN: { houses: [2, 5, 11], karakas: ["Jupiter"], varga: "d7", vargaFactor: "VARGA_FACT_D7_PROGENY_CONFIRMED" },
  WELLNESS: { houses: [1, 6, 8], karakas: ["Sun", "Mars"], varga: null, vargaFactor: null },
  LEGAL: { houses: [6, 8], karakas: ["Mars", "Saturn", "Rahu"], varga: null, vargaFactor: null }
};

export const CANONICAL_DOMAIN_MAP = {
  MARRIAGE: "MARRIAGE",
  RELATIONSHIP: "MARRIAGE",
  SPOUSE: "MARRIAGE",
  PROPERTY: "PROPERTY",
  REAL_ESTATE: "PROPERTY",
  LAND: "PROPERTY",
  HOUSE: "PROPERTY",
  HOME: "PROPERTY",
  CONSTRUCTION: "CONSTRUCTION",
  CONSTRUCTION_START: "CONSTRUCTION",
  CONSTRUCTION_COMPLETION: "CONSTRUCTION",
  HOUSEWARMING: "PROPERTY",
  VEHICLE: "VEHICLE",
  VEHICLE_PURCHASE: "VEHICLE",
  CAR: "VEHICLE",
  CAREER: "CAREER",
  JOB: "JOB",
  EMPLOYMENT: "JOB",
  BUSINESS: "BUSINESS",
  FINANCE: "FINANCE",
  WEALTH: "FINANCE",
  MONEY: "FINANCE",
  EDUCATION: "EDUCATION",
  STUDIES: "EDUCATION",
  FOREIGN_TRAVEL: "FOREIGN_TRAVEL",
  FOREIGN_TRIP: "FOREIGN_TRAVEL",
  TRAVEL: "FOREIGN_TRAVEL",
  WORK_ABROAD: "WORK_ABROAD",
  FOREIGN_SETTLEMENT: "FOREIGN_SETTLEMENT",
  CHILDREN: "CHILDREN",
  PROGENY: "CHILDREN",
  FAMILY_EXPANSION: "CHILDREN",
  WELLNESS: "WELLNESS",
  HEALTH: "WELLNESS",
  LEGAL: "LEGAL",
  LITIGATION: "LEGAL"
};

/**
 * Normalizes any incoming domain key into a canonical activation domain.
 * Does NOT fallback to CAREER.
 */
export function normalizeDomain(rawDomain) {
  if (!rawDomain || typeof rawDomain !== "string") return null;
  const cleaned = rawDomain.trim().toUpperCase().replace(/[-\s]+/g, "_");
  if (CANONICAL_DOMAIN_MAP[cleaned]) return CANONICAL_DOMAIN_MAP[cleaned];
  if (DOMAIN_ACTIVATION_FACTORS[cleaned]) return cleaned;
  return null;
}

/**
 * Evaluates whether transits (Jupiter, Saturn) cast authentic aspect or conjunction
 * onto target houses or their lords.
 */
function evaluateTransitAspects(transits, ascSign, targetHouses) {
  const result = {
    hasConvergence: false,
    supportingEvidence: [],
    details: []
  };

  if (!transits) return result;

  const ascIdx = (ascSign && SIGN_ORDER.indexOf(ascSign) >= 0) ? SIGN_ORDER.indexOf(ascSign) : -1;

  // 1. Jupiter Gochar
  const jupSign = transits.jupiterSign || transits.Jupiter?.sign || transits.planets?.Jupiter?.sign;
  if (jupSign && SIGN_ORDER.includes(jupSign)) {
    if (ascIdx >= 0) {
      const jupSignIdx = SIGN_ORDER.indexOf(jupSign);
      const jupHouseFromLagna = (jupSignIdx - ascIdx + 12) % 12 + 1;
      // Jupiter casts 1st (conjunction), 5th, 7th, 9th aspects
      const jupAspectHouses = [
        jupHouseFromLagna,
        (jupHouseFromLagna + 4 - 1) % 12 + 1,
        (jupHouseFromLagna + 6 - 1) % 12 + 1,
        (jupHouseFromLagna + 8 - 1) % 12 + 1
      ];
      const hits = jupAspectHouses.filter(h => targetHouses.includes(h));
      if (hits.length > 0) {
        result.hasConvergence = true;
        result.supportingEvidence.push(buildTransitFactId("JUPITER", jupSign));
        result.details.push(`Jupiter in ${jupSign} influences domain house(s) ${hits.join(", ")}`);
      }
    } else {
      // Ascendant unspecified: record fact without claiming unverified geometric aspect
      result.supportingEvidence.push(buildTransitFactId("JUPITER", jupSign));
      result.hasConvergence = true;
    }
  }

  // 2. Saturn Gochar
  const satSign = transits.saturnSign || transits.Saturn?.sign || transits.planets?.Saturn?.sign;
  if (satSign && SIGN_ORDER.includes(satSign)) {
    if (ascIdx >= 0) {
      const satSignIdx = SIGN_ORDER.indexOf(satSign);
      const satHouseFromLagna = (satSignIdx - ascIdx + 12) % 12 + 1;
      // Saturn casts 1st (conjunction), 3rd, 7th, 10th aspects
      const satAspectHouses = [
        satHouseFromLagna,
        (satHouseFromLagna + 2 - 1) % 12 + 1,
        (satHouseFromLagna + 6 - 1) % 12 + 1,
        (satHouseFromLagna + 9 - 1) % 12 + 1
      ];
      const hits = satAspectHouses.filter(h => targetHouses.includes(h));
      if (hits.length > 0) {
        result.hasConvergence = true;
        result.supportingEvidence.push(buildTransitFactId("SATURN", satSign));
        result.details.push(`Saturn in ${satSign} influences domain house(s) ${hits.join(", ")}`);
      }
    } else {
      result.supportingEvidence.push(buildTransitFactId("SATURN", satSign));
      result.hasConvergence = true;
    }
  }

  return result;
}

/**
 * Computes deterministic timing windows for a specific domain.
 *
 * @param {Object} params
 * @param {string} params.domain - Domain key
 * @param {Object} params.chart - Calculated chart data
 * @param {Array} [params.dashaTimeline=[]] - Calculated dasha periods from chart
 * @param {Object} [params.transits={}] - Transit triggers from chart
 * @param {Object} [params.vargas={}] - Divisional charts (D9, D10, etc.)
 * @param {number} [params.referenceYear] - Reference year for future-filtering
 * @param {boolean} [params.allowPast=false] - Whether to allow past completed periods
 * @returns {Object} { timingWindows: Array, resolution: string|null, status: string, explanationEn: string, explanationTa: string }
 */
export function computeTimingWindows({
  domain,
  chart,
  dashaTimeline = [],
  transits = {},
  vargas = {},
  referenceYear,
  allowPast = false
}) {
  const canonicalDomain = normalizeDomain(domain);
  if (!canonicalDomain || !DOMAIN_ACTIVATION_FACTORS[canonicalDomain]) {
    return {
      timingWindows: [],
      resolution: null,
      status: "UNSUPPORTED_EVENT",
      explanationEn: `Domain "${domain}" is not supported for deterministic timing calculation.`,
      explanationTa: `இந்த குறிப்பிட்ட நிகழ்வுக்கான காலக்கோடு கணிதம் ஆதரிக்கப்படவில்லை.`
    };
  }

  // If no dasha timeline is available
  if (!dashaTimeline || !Array.isArray(dashaTimeline) || dashaTimeline.length === 0) {
    return {
      timingWindows: [],
      resolution: "INSUFFICIENT_DATA",
      status: "INSUFFICIENT_DATA",
      explanationEn: "Dasha timeline calculation is not available for timing determination.",
      explanationTa: "தசா காலக்கோடு கணிதம் இல்லாததால் குறிப்பிட்ட காலக்கட்டத்தை நிர்ணயிக்க முடியாது."
    };
  }

  const factors = DOMAIN_ACTIVATION_FACTORS[canonicalDomain];
  const ascendantSign = chart?.ascendant?.signName || chart?.ascendant?.sign || chart?.lagna?.sign || (typeof chart?.ascendant === "string" ? chart.ascendant : null);
  const ascIdx = (ascendantSign && SIGN_ORDER.indexOf(ascendantSign) >= 0) ? SIGN_ORDER.indexOf(ascendantSign) : -1;
  const chartPlanets = Array.isArray(chart?.planets) ? chart.planets : [];

  const getPlanetActivatedHouses = (planetName) => {
    if (!planetName) return [];
    const houses = new Set();
    if (ascIdx >= 0) {
      for (let h = 1; h <= 12; h++) {
        const sign = SIGN_ORDER[(ascIdx + h - 1) % 12];
        if (SIGN_LORDS[sign] === planetName) houses.add(h);
      }
    }
    const pObj = chartPlanets.find(p => (p.name || p.planetName) === planetName);
    const pHouse = pObj?.house ?? pObj?.bhava ?? null;
    if (typeof pHouse === "number") houses.add(pHouse);
    return Array.from(houses);
  };

  // Evaluate transit relationship against domain houses
  const transitEval = evaluateTransitAspects(transits, ascendantSign, factors.houses);

  const curYear = referenceYear || (new Date().getFullYear());
  const hasFuturePeriods = dashaTimeline.some(d => {
    const ey = d.endYear || (d.endDate ? parseInt(String(d.endDate).slice(0, 4), 10) : null);
    return ey && ey >= curYear;
  });
  const filterPast = !allowPast && hasFuturePeriods;

  const candidates = [];

  // Scan dasha periods to evaluate activations
  for (const dasha of dashaTimeline) {
    const md = dasha.mahadasha || dasha.lord || "";
    const ad = dasha.antardasha || dasha.subLord || "";
    const startYear = dasha.startYear || (dasha.startDate ? parseInt(String(dasha.startDate).slice(0, 4), 10) : null);
    const endYear = dasha.endYear || (dasha.endDate ? parseInt(String(dasha.endDate).slice(0, 4), 10) : null);

    if (!startYear || !endYear) continue;

    // Filter past periods if future periods exist in timeline
    if (filterPast && endYear < curYear) {
      continue;
    }

    const isMdKaraka = factors.karakas.includes(md);
    const isAdKaraka = factors.karakas.includes(ad);
    const explicitHouses = Array.isArray(dasha.activatedHouses) ? dasha.activatedHouses : [];
    const derivedHouses = [...getPlanetActivatedHouses(md), ...getPlanetActivatedHouses(ad)];
    const dashaHouses = Array.from(new Set([...explicitHouses, ...derivedHouses]));
    const houseActivated = dashaHouses.some(h => factors.houses.includes(h));

    const isActivated = isMdKaraka || isAdKaraka || houseActivated;

    if (isActivated) {
      const supportingEvidence = [
        buildDashaFactId(md, ad)
      ];

      let score = 0;
      if (isMdKaraka) score += 3;
      if (isAdKaraka) score += 2;
      if (houseActivated) score += 3;

      // Transit trigger
      let triggerType = "DASHA_ACTIVATION";
      if (transitEval.hasConvergence) {
        supportingEvidence.push(...transitEval.supportingEvidence);
        triggerType = "DASHA_TRANSIT_CONVERGENCE";
        score += 2;
      }

      // Varga confirmation
      if (factors.varga && factors.vargaFactor && vargas?.[factors.varga]) {
        supportingEvidence.push(factors.vargaFactor);
        score += 1;
      }

      // Resolution determination based on window width
      const width = endYear - startYear;
      let windowResolution = "YEAR";
      if (dasha.startDate && dasha.endDate && String(dasha.startDate).includes("-") && width <= 1) {
        windowResolution = "MONTH_RANGE";
      } else if (width > 2) {
        windowResolution = "YEAR_RANGE";
      }

      const windowId = buildTimingWindowId(startYear, endYear);
      candidates.push({
        score,
        startYear,
        window: {
          id: windowId,
          domain: canonicalDomain,
          category: factors.category || canonicalDomain,
          windowStart: dasha.startDate || String(startYear),
          windowEnd: dasha.endDate || String(endYear),
          yearStart: startYear,
          yearEnd: endYear,
          resolution: windowResolution,
          triggerType,
          confidenceClass: (isMdKaraka && (isAdKaraka || transitEval.hasConvergence)) ? "HIGH" : "MODERATE",
          supportingEvidence,
          counterEvidence: [],
          descriptionEn: `${md} Mahadasha - ${ad || "Sub-period"} activating ${factors.houses.map(h => `${h}th`).join("/")} houses.`,
          descriptionTa: `${factors.houses.map(h => `${h}-ம்`).join("/")} பாவகங்களை இயக்கும் ${md} மகாதசை - ${ad || "அந்தர்தசை"} காலம்.`
        }
      });
    }
  }

  if (candidates.length === 0) {
    return {
      timingWindows: [],
      resolution: null,
      status: "NO_DISCRIMINATING_WINDOW",
      explanationEn: "Calculated dasha-transit timeline does not exhibit clear convergence for this specific domain.",
      explanationTa: "கணித தசா மற்றும் கோச்சார அமைப்புகளில் இந்த குறிப்பிட்ட விஷயத்திற்கான தெளிவான இணைப்பு அமையவில்லை."
    };
  }

  // Sort candidates by score descending, then startYear ascending
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.startYear - b.startYear;
  });

  const timingWindows = candidates.slice(0, 2).map(c => c.window);

  return {
    timingWindows,
    resolution: timingWindows[0].resolution,
    status: "CONVERGENCE_ESTABLISHED",
    explanationEn: `Timing convergence established across ${timingWindows.length} discrete dasha activation window(s).`,
    explanationTa: `${timingWindows.length} தசா இணைப்பு காலக்கட்டங்களில் குறிப்பிட்ட நிகழ்வுக்கான சாத்தியக்கூறு உறுதிப்படுத்தப்பட்டுள்ளது.`
  };
}
