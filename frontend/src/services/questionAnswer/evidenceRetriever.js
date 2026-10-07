/**
 * ASTROVERSE — Evidence Retriever
 * =================================
 * Retrieves structured chart facts, divisional placements, planetary periods,
 * directional convergence, and report findings strictly aligned with the Evidence Plan.
 * Populates canonical EvidenceGraph, calculatedFacts, and traditionalRules.
 *
 * Implements Section 4, Section 5, Section 6, and Section 7 of the Mandate.
 */

import {
  evaluateSpouseFamilyWealth,
  evaluateSpouseDirection,
  evaluateSpouseGeographicDistance
} from "../consultationEngine.js";
import { getD9Data, getD10Data, getDashaData, getTimingWindows, getKPData } from "../followUpAnswerService.js";
import {
  EvidenceGraph,
  EVIDENCE_CATEGORIES,
  buildChartFactId,
  buildHouseFactId,
  buildLordFactId,
  buildPlanetFactId,
  buildVargaFactId,
  buildDashaFactId,
  buildRuleId
} from "./evidenceGraph.js";
import { computeTimingWindows } from "./timingEngine.js";
import { compareAstrologySystems } from "./comparisonEngine.js";

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

  const evidenceGraph = new EvidenceGraph(plan?.primaryIntent || "QA");
  const calculatedFacts = [];
  const traditionalRules = [];

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
      reportSections: [],
      calculatedFacts: [],
      traditionalRules: [],
      evidenceGraph
    };
  }

  // 1. Planetary Mapping
  const planetMap = {};
  for (const p of rawPlanets) {
    const pName = p.name || p.planetName;
    if (pName) {
      const pFact = {
        name: pName,
        sign: p.signName || p.sign,
        house: p.house || p.bhava,
        degree: typeof p.degree === "number" ? p.degree : (p.longitude ? p.longitude % 30 : null),
        dignity: p.dignity || null,
        dignityStatus: p.dignity ? "CALCULATED" : "NOT_CALCULATED",
        isRetrograde: Boolean(p.isRetrograde || p.speed < 0),
        nakshatra: p.nakshatra || null,
        pada: p.pada || null
      };
      planetMap[pName] = pFact;

      // Add to canonical calculatedFacts & evidenceGraph
      const factId = buildPlanetFactId(pName, pFact.dignity || "POS");
      calculatedFacts.push({
        id: factId,
        factor: pName,
        sign: pFact.sign,
        house: pFact.house,
        dignity: pFact.dignity,
        dignityStatus: pFact.dignityStatus,
        degree: pFact.degree
      });
      evidenceGraph.addNode({
        id: factId,
        category: EVIDENCE_CATEGORIES.PLANET_FACT,
        label: `${pName} in ${pFact.sign} (House ${pFact.house})`,
        value: pFact
      });
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
        const hFact = {
          house: h,
          sign,
          lord,
          occupants,
          lordPlanet: planetMap[lord] || null
        };
        houseMap[h] = hFact;

        const houseFactId = buildHouseFactId(h);
        calculatedFacts.push({
          id: houseFactId,
          factor: `House_${h}`,
          sign,
          lord,
          occupants
        });
        evidenceGraph.addNode({
          id: houseFactId,
          category: EVIDENCE_CATEGORIES.HOUSE_FACT,
          label: `House ${h} in ${sign} ruled by ${lord}`,
          value: hFact
        });
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

  if (d9Info?.ascendant) {
    const d9Id = buildVargaFactId("D9", "ASC");
    calculatedFacts.push({ id: d9Id, factor: "D9_Ascendant", sign: d9Info.ascendant });
    evidenceGraph.addNode({ id: d9Id, category: EVIDENCE_CATEGORIES.VARGA_FACT, label: `D9 Navamsha Lagna ${d9Info.ascendant}`, value: d9Info.ascendant });
  }

  // 4. Dashas & Timing Windows
  const activeDasha = getDashaData(context);
  let timingWindows = getTimingWindows(context);

  // If report timing windows are empty, evaluate dynamically via timingEngine
  if ((!timingWindows || timingWindows.length === 0) && (chart.dashas || chart.dashaTimeline)) {
    const dynTiming = computeTimingWindows({
      domain: plan.primaryDomain,
      chart,
      dashaTimeline: chart.dashaTimeline || chart.dashas || [],
      vargas
    });
    if (dynTiming.timingWindows && dynTiming.timingWindows.length > 0) {
      timingWindows = dynTiming.timingWindows;
    }
  }

  if (activeDasha?.mahadasha) {
    const dashaId = buildDashaFactId(activeDasha.mahadasha, activeDasha.antardasha);
    calculatedFacts.push({
      id: dashaId,
      factor: "Active_Dasha",
      mahadasha: activeDasha.mahadasha,
      antardasha: activeDasha.antardasha
    });
    evidenceGraph.addNode({
      id: dashaId,
      category: EVIDENCE_CATEGORIES.DASHA_FACT,
      label: `Active Dasha: ${activeDasha.mahadasha} - ${activeDasha.antardasha}`,
      value: activeDasha
    });
  }

  // 5. Direction Analysis
  let directionAnalysis = null;
  if (plan.requiredDirectionAnalysis) {
    const seventhSign = houseMap[7]?.sign || null;
    const seventhLord = houseMap[7]?.lord || null;
    const seventhLordPlacement = (seventhLord && planetMap[seventhLord]) ? planetMap[seventhLord].sign : null;
    const venusPlacement = (planetMap["Venus"] && planetMap["Venus"].sign) ? planetMap["Venus"].sign : null;

    const houseDir = seventhSign ? SIGN_DIRECTIONS[seventhSign] : null;
    const lordDir = seventhLordPlacement ? SIGN_DIRECTIONS[seventhLordPlacement] : null;
    const venusDir = planetMap["Venus"] ? (PLANET_DIRECTIONS["Venus"] || "SOUTH_EAST") : null;
    const venusSignDir = venusPlacement ? SIGN_DIRECTIONS[venusPlacement] : null;
    const d9LagnaDir = (d9Info && d9Info.ascendant) ? SIGN_DIRECTIONS[d9Info.ascendant] : null;

    const indicators = [
      { factor: "7th House Sign", sign: seventhSign, direction: houseDir },
      { factor: "7th Lord Sign", sign: seventhLordPlacement, direction: lordDir },
      { factor: "Venus Karaka", sign: "Karaka", direction: venusDir },
      { factor: "Venus Sign", sign: venusPlacement, direction: venusSignDir },
      { factor: "D9 Navamsha Lagna", sign: d9Info?.ascendant, direction: d9LagnaDir }
    ].filter(i => Boolean(i.direction));

    if (indicators.length < 2 || !planetMap["Venus"] || !seventhLordPlacement) {
      directionAnalysis = {
        primaryDirection: null,
        secondaryDirection: null,
        convergenceScore: null,
        indicators: indicators,
        conflictingIndicators: [],
        confidenceCategory: "INSUFFICIENT_DATA"
      };
    } else {
      const dirCounts = {};
      indicators.forEach(i => {
        dirCounts[i.direction] = (dirCounts[i.direction] || 0) + 1;
      });

      const sortedDirs = Object.entries(dirCounts).sort((a, b) => b[1] - a[1]);
      const primaryDirection = sortedDirs[0] ? sortedDirs[0][0] : null;
      const secondaryDirection = sortedDirs[1] ? sortedDirs[1][0] : null;
      const convergenceScore = indicators.length > 0 ? ((dirCounts[primaryDirection] || 0) / indicators.length) : null;

      const conflicting = indicators.filter(i => i.direction !== primaryDirection);

      directionAnalysis = {
        primaryDirection,
        secondaryDirection,
        convergenceScore: convergenceScore != null ? parseFloat(convergenceScore.toFixed(2)) : null,
        indicators,
        conflictingIndicators: conflicting,
        confidenceCategory: (convergenceScore != null && convergenceScore >= 0.6) ? "HIGH_CONVERGENCE" : "MIXED_DIRECTIONAL_INDICATION"
      };
    }
  }

  // 6. Distance Analysis (Strict Invariant: No fabrication of km)
  let distanceAnalysis = null;
  if (plan.requiredDistanceAnalysis) {
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
    const user2nd = houseMap[2] || {};
    const user2ndLord = planetMap[user2nd.lord] || {};
    const userFamilyFactors = [
      user2nd.sign ? `2nd House in ${user2nd.sign} (Lord: ${user2nd.lord || "Unspecified"})` : "2nd House data not calculated",
      user2nd.occupants?.length ? `Occupants in 2nd: ${user2nd.occupants.join(", ")}` : "2nd House unoccupied",
      user2ndLord.dignity ? `2nd Lord dignity: ${user2ndLord.dignity}` : null
    ].filter(Boolean);

    const spouse8th = houseMap[8] || {};
    const spouse8thLord = planetMap[spouse8th.lord] || {};
    const spouseFamilyFactors = [
      spouse8th.sign ? `8th House (2nd from 7th) in ${spouse8th.sign} (Lord: ${spouse8th.lord || "Unspecified"})` : "8th House data not calculated",
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
  let vargaMissing = false;
  if (plan.requiredVargas.includes("D10") || plan.primaryIntent === "VARGA_INTERPRETATION") {
    const calculatedD10Asc = d10Info.ascendant || null;
    const userClaimedSign = plan.userClaimedSign || null;

    if (!calculatedD10Asc) {
      vargaMissing = true;
      vargaAnalysis = {
        varga: "D10",
        lagna: null,
        userClaimedSign,
        userClaimMismatch: false,
        status: "INSUFFICIENT_DATA"
      };
    } else {
      let d1010thSign = null;
      let d10LagnaLord = null;
      let d1010thLord = null;
      const d10AscIdx = SIGN_ORDER.indexOf(calculatedD10Asc);
      if (d10AscIdx !== -1) {
        d10LagnaLord = SIGN_LORDS[calculatedD10Asc];
        const tenthIdx = (d10AscIdx + 9) % 12;
        d1010thSign = SIGN_ORDER[tenthIdx];
        d1010thLord = SIGN_LORDS[d1010thSign];
      }
      const d10Planets = d10Info.planets || [];

      const d10Sun = d10Planets.find(p => (p.name || p.planetName) === "Sun") || null;
      const d10Saturn = d10Planets.find(p => (p.name || p.planetName) === "Saturn") || null;
      const d10Mercury = d10Planets.find(p => (p.name || p.planetName) === "Mercury") || null;

      const userClaimMismatch = Boolean(userClaimedSign && userClaimedSign.toLowerCase() !== calculatedD10Asc.toLowerCase());

      vargaAnalysis = {
        varga: "D10",
        lagna: calculatedD10Asc,
        lagnaLord: d10LagnaLord,
        tenthHouseSign: d1010thSign,
        tenthLord: d1010thLord,
        planetsInD10: d10Planets,
        userClaimedSign,
        userClaimMismatch,
        d10SunPlacement: d10Sun,
        d10SaturnPlacement: d10Saturn,
        d10MercuryPlacement: d10Mercury,
        d1SunPlacement: planetMap["Sun"] || null,
        d1SaturnPlacement: planetMap["Saturn"] || null,
        d1MercuryPlacement: planetMap["Mercury"] || null,
        sunPlacement: d10Sun,
        saturnPlacement: d10Saturn,
        mercuryPlacement: d10Mercury
      };

      const d10Id = buildVargaFactId("D10", "ASC");
      calculatedFacts.push({ id: d10Id, factor: "D10_Ascendant", sign: calculatedD10Asc, lord: d10LagnaLord });
      evidenceGraph.addNode({ id: d10Id, category: EVIDENCE_CATEGORIES.VARGA_FACT, label: `D10 Dashamsha Lagna ${calculatedD10Asc}`, value: calculatedD10Asc });
    }
  }

  // 9. Dasha Interaction Analysis
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

  // 10. KP and Multi-System Data (Dedicated Material Difference Comparison)
  let systemComparison = null;
  if (plan.requiredMultiSystem || plan.specificFactors?.includes("LAHIRI_VS_KP_AYANAMSHA") || plan.primaryIntent === "SYSTEM_COMPARISON") {
    systemComparison = compareAstrologySystems({
      chart,
      multiSystemBundle: context.multiSystemBundle,
      isTamil: context.lang === "ta"
    });
    if (systemComparison.status === "SUCCESS") {
      const sysFactId = "SYSTEM_COMPARISON_LAHIRI_KP";
      calculatedFacts.push({
        id: sysFactId,
        factor: "System_Comparison_Lahiri_KP",
        value: systemComparison
      });
      evidenceGraph.addNode({
        id: sysFactId,
        category: EVIDENCE_CATEGORIES.CHART_FACT,
        label: `Lahiri vs KP Ayanamsha: ${systemComparison.ayanamsha.diffFormatted}`,
        value: systemComparison
      });
    }
  }

  const kpData = getKPData(context);
  const bundleSystems = context.multiSystemBundle?.systems || {};
  const lahiriAyanVal = systemComparison?.ayanamsha?.lahiri ?? bundleSystems.lahiri?.ayanamshaValue ?? bundleSystems.lahiri?.ayanamsa ?? (context.system?.id === "lahiri" ? (context.chart?.ayanamshaValue ?? context.chart?.ayanamsa ?? null) : null);
  const kpAyanVal = systemComparison?.ayanamsha?.kp ?? bundleSystems.kp?.ayanamshaValue ?? bundleSystems.kp?.ayanamsa ?? bundleSystems.kp?.system?.ayanamshaValue ?? (context.system?.id === "kp" ? (context.chart?.ayanamshaValue ?? context.chart?.ayanamsa ?? null) : null);

  // 11. Traditional Rules Association (Fact / Interpretation Separation)
  if (plan.primaryDomain === "marriage") {
    traditionalRules.push({
      id: buildRuleId("MARRIAGE", "7TH_LORD_ACTIVATION"),
      ruleName: "Kalatra Bhava Activation",
      shastra: "Brihat Parashara Hora Shastra",
      condition: "7th house lord dasha activates alliance potential",
      traditionalInterpretation: "Dasha of 7th lord or planets associated with 7th house brings relational opportunities."
    });
  } else if (plan.primaryDomain === "career") {
    traditionalRules.push({
      id: buildRuleId("CAREER", "10TH_LORD_D10_ALIGNMENT"),
      ruleName: "Dashamsha Karma Varga Rule",
      shastra: "Phaladeepika Chapter 15",
      condition: "D10 Lagna and 10th lord signify professional execution",
      traditionalInterpretation: "D10 divisional strength indicates vocational leadership and workplace execution."
    });
  }

  // 12. Relevant Report Sections
  const reportSections = [];
  const domain = plan.primaryDomain;
  if (plan.primaryIntent === "SYSTEM_COMPARISON") reportSections.push("multiSystemComparison", "technicalAppendix", "blueprint");
  else if (domain === "career" || domain === "job" || domain === "business") reportSections.push("career", "vocation");
  else if (domain === "marriage") reportSections.push("relationships", "marriage");
  else if (domain === "property" || domain === "vehicle") reportSections.push("property", "assets");
  else if (domain === "finance") reportSections.push("finance", "wealth");
  else if (domain === "wellness") reportSections.push("health", "wellness");
  else if (domain === "legal" || domain === "caution") reportSections.push("caution", "dosha");
  else if (domain === "dasha" || domain === "milestones") reportSections.push("timeline", "dasha");
  else reportSections.push("blueprint", "overview");

  let status = "SUPPORTED";
  const isDashaQuery = Boolean(plan.requiredDashas || plan.primaryIntent === "CURRENT_DASHA" || plan.primaryIntent === "DASHA_EFFECT");
  const dashaMissing = isDashaQuery && !activeDasha && !dashaInteraction;
  const isDirQuery = Boolean(plan.primaryIntent === "SPOUSE_DIRECTION" || plan.requiredDirectionAnalysis);
  const dirMissing = isDirQuery && (!directionAnalysis || directionAnalysis.confidenceCategory === "INSUFFICIENT_DATA" || !directionAnalysis.primaryDirection);

  if (vargaMissing || dashaMissing || dirMissing || !ascSign) {
    status = "INSUFFICIENT_DATA";
  } else if (plan.primaryIntent === "SPOUSE_DISTANCE" || distanceAnalysis?.distanceStatus === "NOT_ESTABLISHED") {
    status = "NOT_DISCRIMINATING";
  }

  return {
    status,
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
    vargaMissing,
    dashaInteraction,
    kpData,
    systemComparison,
    lahiriAyanamsha: lahiriAyanVal,
    kpAyanamsha: kpAyanVal,
    reportSections,
    calculatedFacts,
    traditionalRules,
    evidenceGraph,
    chart
  };
}
