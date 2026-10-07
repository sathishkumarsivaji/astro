/**
 * ASTROVERSE — Evidence Retriever
 * =================================
 * Retrieves structured chart facts, divisional placements, planetary periods,
 * directional convergence, and report findings strictly aligned with the Evidence Plan.
 */

import {
  evaluateSpouseFamilyWealth,
  evaluateSpouseDirection,
  evaluateSpouseGeographicDistance
} from "../consultationEngine.js";
import { getD9Data, getD10Data, getDashaData, getTimingWindows } from "../followUpAnswerService.js";

const SIGN_DIRECTIONS = {
  Aries: "EAST", Leo: "EAST", Sagittarius: "EAST",
  Taurus: "SOUTH", Virgo: "SOUTH", Capricorn: "SOUTH",
  Gemini: "WEST", Libra: "WEST", Aquarius: "WEST",
  Cancer: "NORTH", Scorpio: "NORTH", Pisces: "NORTH"
};

const PLANET_DIRECTIONS = {
  Sun: "EAST", Mars: "SOUTH", Moon: "NORTH_WEST", Mercury: "NORTH",
  Jupiter: "NORTH_EAST", Venus: "SOUTH_EAST", Saturn: "WEST", Rahu: "SOUTH_WEST", Ketu: "SOUTH_WEST"
};

const SIGN_LORDS = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter"
};

const SIGN_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

/**
 * Retrieves required chart evidence according to the evidence plan.
 *
 * @param {Object} plan - Output from planRequiredEvidence
 * @param {Object} context - Report context containing chart, report, etc.
 * @returns {Object} Structured evidence payload
 */
export function retrieveEvidence(plan, context) {
  const chart = context?.chart || (context?.planets ? context : null);
  const rawPlanets = chart?.planets || [];
  const ascendant = chart?.ascendant || chart?.lagna || null;
  const ascSign = ascendant?.signName || ascendant?.sign || (typeof ascendant === "string" ? ascendant : null);

  // If no planets and no ascendant, evidence is insufficient
  if (!chart || (rawPlanets.length === 0 && !ascSign)) {
    return {
      status: "INSUFFICIENT_DATA",
      planets: {},
      houses: {},
      vargas: {},
      dashas: null,
      directionAnalysis: null,
      distanceAnalysis: null,
      comparisonAnalysis: null,
      vargaAnalysis: null,
      reportSections: []
    };
  }

  // 1. Planetary Mapping
  const planetMap = {};
  for (const p of rawPlanets) {
    const pName = p.name || p.planetName;
    if (pName) {
      planetMap[pName] = {
        name: pName,
        sign: p.signName || p.sign,
        house: p.house || p.bhava,
        degree: typeof p.degree === "number" ? p.degree : (p.longitude ? p.longitude % 30 : null),
        dignity: p.dignity || "Neutral",
        isRetrograde: Boolean(p.isRetrograde || p.speed < 0),
        nakshatra: p.nakshatra || null,
        pada: p.pada || null
      };
    }
  }

  // 2. House Calculation & Sign Lords
  const houseMap = {};
  if (ascSign) {
    const ascIdx = SIGN_ORDER.indexOf(ascSign);
    if (ascIdx !== -1) {
      for (let h = 1; h <= 12; h++) {
        const signIdx = (ascIdx + h - 1) % 12;
        const sign = SIGN_ORDER[signIdx];
        const lord = SIGN_LORDS[sign];
        const occupants = rawPlanets.filter(p => (p.house || p.bhava) === h).map(p => p.name || p.planetName);
        houseMap[h] = {
          house: h,
          sign,
          lord,
          occupants,
          lordPlanet: planetMap[lord] || null
        };
      }
    }
  }

  // 3. Vargas (D9, D10)
  const d9Info = getD9Data(context);
  const d10Info = getD10Data(context);
  const vargas = {
    D9: d9Info,
    D10: d10Info
  };

  // 4. Dashas & Timing Windows
  const activeDasha = getDashaData(context);
  const timingWindows = getTimingWindows(context);

  // 5. Direction Analysis
  let directionAnalysis = null;
  if (plan.requiredDirectionAnalysis) {
    const seventhSign = houseMap[7]?.sign || null;
    const seventhLord = houseMap[7]?.lord || null;
    const seventhLordPlacement = planetMap[seventhLord]?.sign || null;
    const venusPlacement = planetMap["Venus"]?.sign || null;

    const houseDir = seventhSign ? SIGN_DIRECTIONS[seventhSign] : null;
    const lordDir = seventhLordPlacement ? SIGN_DIRECTIONS[seventhLordPlacement] : null;
    const venusDir = PLANET_DIRECTIONS["Venus"] || "SOUTH_EAST";
    const venusSignDir = venusPlacement ? SIGN_DIRECTIONS[venusPlacement] : null;
    const d9LagnaDir = d9Info?.ascendant ? SIGN_DIRECTIONS[d9Info.ascendant] : null;

    const indicators = [
      { factor: "7th House Sign", sign: seventhSign, direction: houseDir },
      { factor: "7th Lord Sign", sign: seventhLordPlacement, direction: lordDir },
      { factor: "Venus Karaka", sign: "Karaka", direction: venusDir },
      { factor: "Venus Sign", sign: venusPlacement, direction: venusSignDir },
      { factor: "D9 Navamsha Lagna", sign: d9Info?.ascendant, direction: d9LagnaDir }
    ].filter(i => Boolean(i.direction));

    // Count direction frequency
    const dirCounts = {};
    indicators.forEach(i => {
      dirCounts[i.direction] = (dirCounts[i.direction] || 0) + 1;
    });

    const sortedDirs = Object.entries(dirCounts).sort((a, b) => b[1] - a[1]);
    const primaryDirection = sortedDirs[0] ? sortedDirs[0][0] : "NORTH";
    const secondaryDirection = sortedDirs[1] ? sortedDirs[1][0] : null;
    const convergenceScore = indicators.length > 0 ? ((dirCounts[primaryDirection] || 1) / indicators.length) : 0.5;

    const conflicting = indicators.filter(i => i.direction !== primaryDirection);

    directionAnalysis = {
      primaryDirection,
      secondaryDirection,
      convergenceScore: parseFloat(convergenceScore.toFixed(2)),
      indicators,
      conflictingIndicators: conflicting,
      confidenceCategory: convergenceScore >= 0.6 ? "HIGH_CONVERGENCE" : "MIXED_DIRECTIONAL_INDICATION"
    };
  }

  // 6. Distance Analysis (Strict Invariant: No fabrication of km)
  let distanceAnalysis = null;
  if (plan.requiredDistanceAnalysis) {
    // Check consultation engine distance helper
    const rawDist = evaluateSpouseGeographicDistance(chart);
    distanceAnalysis = {
      distanceStatus: "NOT_ESTABLISHED",
      caveat: "இந்த முறையில் திசை தொடர்பான பாரம்பரிய குறியீட்டை மட்டும் விளக்க முடிகிறது. நம்பகமான கிலோமீட்டர் தூர மதிப்பீடு கணக்கிடப்படவில்லை.",
      caveatEn: "Traditional astrology indicates regional/mobility indications, but exact quantitative kilometer distances cannot be established without empirical fabrication.",
      traditionalBand: rawDist?.estimatedBand || null,
      traditionalBandTa: rawDist?.estimatedBandTa || null
    };
  }

  // 7. Comparative Family Wealth Analysis
  let comparisonAnalysis = null;
  if (plan.requiredComparison) {
    const rawWealth = evaluateSpouseFamilyWealth(chart);
    // User Family indicators: 2nd house from Lagna, 2nd lord, Jupiter
    const user2nd = houseMap[2] || {};
    const user2ndLord = planetMap[user2nd.lord] || {};
    const userFamilyFactors = [
      `2nd House in ${user2nd.sign || "unknown"} (lord: ${user2nd.lord || "unknown"})`,
      user2nd.occupants?.length ? `Occupants in 2nd: ${user2nd.occupants.join(", ")}` : "2nd House unoccupied",
      user2ndLord.dignity ? `2nd Lord dignity: ${user2ndLord.dignity}` : null
    ].filter(Boolean);

    // Spouse Family indicators: 8th house (2nd from 7th), 8th lord, Venus
    const spouse8th = houseMap[8] || {};
    const spouse8thLord = planetMap[spouse8th.lord] || {};
    const spouseFamilyFactors = [
      `8th House (2nd from 7th) in ${spouse8th.sign || "unknown"} (lord: ${spouse8th.lord || "unknown"})`,
      spouse8th.occupants?.length ? `Occupants in 8th: ${spouse8th.occupants.join(", ")}` : "8th House unoccupied",
      spouse8thLord.dignity ? `8th Lord dignity: ${spouse8thLord.dignity}` : null
    ].filter(Boolean);

    let relativeTier = "RELATIVELY_SIMILAR";
    if (rawWealth.classification === "HIGHER" || rawWealth.classification === "MODERATELY_HIGHER") {
      relativeTier = "RELATIVELY_STRONGER";
    } else if (rawWealth.classification === "LOWER") {
      relativeTier = "RELATIVELY_WEAKER";
    }

    comparisonAnalysis = {
      relativeTier,
      rawClassification: rawWealth.classification,
      verdictEn: rawWealth.verdictEn,
      verdictTa: rawWealth.verdictTa,
      userFamilyIndicators: userFamilyFactors,
      spouseFamilyIndicators: spouseFamilyFactors,
      nativeScore: rawWealth.nativeScore,
      spouseScore: rawWealth.spouseScore,
      evidenceFactors: rawWealth.evidenceFactors
    };
  }

  // 8. D10 Analysis
  let vargaAnalysis = null;
  if (plan.requiredVargas.includes("D10") || plan.primaryIntent === "VARGA_INTERPRETATION") {
    const d10Asc = plan.specifiedSign || d10Info.ascendant || (ascSign ? "Cancer" : null); // D10 Lagna
    let d1010thSign = null;
    let d10LagnaLord = null;
    let d1010thLord = null;
    if (d10Asc) {
      const d10AscIdx = SIGN_ORDER.indexOf(d10Asc);
      if (d10AscIdx !== -1) {
        d10LagnaLord = SIGN_LORDS[d10Asc];
        const tenthIdx = (d10AscIdx + 9) % 12;
        d1010thSign = SIGN_ORDER[tenthIdx];
        d1010thLord = SIGN_LORDS[d1010thSign];
      }
    }
    const d10Planets = d10Info.planets || [];

    vargaAnalysis = {
      varga: "D10",
      lagna: d10Asc,
      lagnaLord: d10LagnaLord,
      tenthHouseSign: d1010thSign,
      tenthLord: d1010thLord,
      planetsInD10: d10Planets,
      sunPlacement: planetMap["Sun"] || null,
      saturnPlacement: planetMap["Saturn"] || null,
      mercuryPlacement: planetMap["Mercury"] || null
    };
  }

  // 9. Dasha Interaction Analysis (e.g. Moon-Venus or Active Dasha)
  let dashaInteraction = null;
  const p1Name = plan.dashaPair?.mahadasha || activeDasha?.mahadasha || null;
  const p2Name = plan.dashaPair?.antardasha || activeDasha?.antardasha || null;
  if (p1Name && p2Name && planetMap[p1Name] && planetMap[p2Name]) {
    const p1 = planetMap[p1Name];
    const p2 = planetMap[p2Name];
    const h1 = p1.house || 1;
    const h2 = p2.house || 1;
    let distance = Math.abs(h1 - h2) + 1;
    if (distance > 6) distance = 14 - distance;

    let axisRelationship = "MUTUAL_ASPECT";
    if (h1 === h2) axisRelationship = "1/1_CONJUNCTION";
    else if ((Math.abs(h1 - h2) === 6)) axisRelationship = "1/7_OPPOSITION";
    else if ((Math.abs(h1 - h2) === 2 || Math.abs(h1 - h2) === 10)) axisRelationship = "3/11_UPACHAYA";
    else if ((Math.abs(h1 - h2) === 4 || Math.abs(h1 - h2) === 8)) axisRelationship = "5/9_TRIKONA";
    else if ((Math.abs(h1 - h2) === 5 || Math.abs(h1 - h2) === 7)) axisRelationship = "6/8_SHADASHTAKA";
    else if ((Math.abs(h1 - h2) === 1 || Math.abs(h1 - h2) === 11)) axisRelationship = "2/12_DWIRDWADASA";

    // Activated domains based on houses
    const activatedHouses = [h1, h2];
    const activatedDomains = [];
    if (activatedHouses.includes(1)) activatedDomains.push("vitality_identity");
    if (activatedHouses.includes(2) || activatedHouses.includes(11)) activatedDomains.push("finance_wealth");
    if (activatedHouses.includes(4)) activatedDomains.push("property_vehicles");
    if (activatedHouses.includes(7)) activatedDomains.push("marriage_partnerships");
    if (activatedHouses.includes(10)) activatedDomains.push("career_status");
    if (activatedHouses.includes(6) || activatedHouses.includes(8)) activatedDomains.push("health_transformation");

    dashaInteraction = {
      mahadashaLord: p1,
      antardashaLord: p2,
      axisRelationship,
      activatedDomains,
      p1LordOf: Object.values(houseMap).filter(h => h.lord === p1Name).map(h => h.house),
      p2LordOf: Object.values(houseMap).filter(h => h.lord === p2Name).map(h => h.house)
    };
  }

  // 10. Relevant Report Sections
  const reportSections = [];
  const domain = plan.primaryDomain;
  if (domain === "career" || domain === "job" || domain === "business") reportSections.push("career", "vocation");
  else if (domain === "marriage") reportSections.push("relationships", "marriage");
  else if (domain === "property" || domain === "vehicle") reportSections.push("property", "assets");
  else if (domain === "finance") reportSections.push("finance", "wealth");
  else if (domain === "wellness") reportSections.push("health", "wellness");
  else if (domain === "legal" || domain === "caution") reportSections.push("caution", "dosha");
  else if (domain === "dasha" || domain === "milestones") reportSections.push("timeline", "dasha");
  else reportSections.push("blueprint", "overview");

  return {
    status: "SUPPORTED",
    ascendant: ascSign,
    planetMap,
    houseMap,
    vargas,
    activeDasha,
    timingWindows,
    directionAnalysis,
    distanceAnalysis,
    comparisonAnalysis,
    vargaAnalysis,
    dashaInteraction,
    reportSections
  };
}
