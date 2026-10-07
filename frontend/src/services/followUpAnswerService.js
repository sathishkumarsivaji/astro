/**
 * ASTROVERSE — Follow-Up Answer Generation Service (100% Report-Grounded)
 *
 * Grounded strictly in the calculated report context and evidence ledger.
 * Never hallucinates planetary degrees, dashas, or uncalculated techniques.
 * Routes factual questions deterministically without AI API consumption.
 * Synthesizes analytical answers using question-specific context reduction with
 * robust deterministic fallback if the AI proxy is offline.
 */

import { routeFollowUpQuestion } from "./followUpRouter.js";
import { ensureSessionToken } from "./aiAstrologyService.js";
import { apiFetch } from "./apiClient.js";
import { REPORT_CHAPTERS } from "../config/reportChapters.js";
import {
  classifyConsultationIntent,
  generateAstrologerConsultation,
  evaluateJointVsSeparateResidence,
  evaluateSpouseFamilyWealth,
  evaluateSpouseGeographicDistance,
  evaluateSpouseDirection,
  evaluateGemstoneRemedies,
  evaluateNatalPromise,
  CERTAINTY_LAYERS,
  QUESTION_ONTOLOGY
} from "./consultationEngine.js";
import {
  toTamilRasi,
  toTamilPlanet,
  toTamilNakshatra,
  toTamilDignity,
  toTamilBhava,
  formatTamilDegree,
  cleanEnglishParentheses
} from "./tamilAstrologyUtils.js";
import { compareAstrologySystems } from "./questionAnswer/comparisonEngine.js";

/**
 * Unified helper to retrieve D9 Navamsha data from context
 */
export function getD9Data(context) {
  if (!context) return { available: false, ascendant: null, navamshaLagna: null, planets: [] };
  const chart = context.chart || (context.planets ? context : null);
  if (!chart) return { available: false, ascendant: null, navamshaLagna: null, planets: [] };
  const raw = chart.vargas?.D9 || chart.vargas?.d9 || chart.divisionalCharts?.D9 || chart.divisionalCharts?.d9Navamsha || context.report?.activeSectionData?.d9Chart || null;
  if (!raw) return { available: false, ascendant: null, navamshaLagna: null, planets: [] };
  const asc = raw.ascendant?.signName || raw.ascendant?.sign || raw.ascendant?.name || (typeof raw.ascendant === "string" ? raw.ascendant : null);
  const planets = (raw.planets || []).map(p => ({
    name: p.planetName || p.name,
    sign: p.signName || p.sign,
    house: p.house || p.vargaHouse,
    dignity: p.dignity
  }));
  return { available: true, ascendant: asc, navamshaLagna: asc, planets };
}

/**
 * Unified helper to retrieve D10 Dashamsha data from context
 */
export function getD10Data(context) {
  if (!context) return { available: false, ascendant: null, dashamshaLagna: null, planets: [] };
  const chart = context.chart || (context.planets ? context : null);
  if (!chart) return { available: false, ascendant: null, dashamshaLagna: null, planets: [] };
  const raw = chart.vargas?.D10 || chart.vargas?.d10 || chart.divisionalCharts?.D10 || chart.divisionalCharts?.d10Dasamsha || context.report?.activeSectionData?.d10Chart || null;
  if (!raw) return { available: false, ascendant: null, dashamshaLagna: null, planets: [] };
  const asc = raw.ascendant?.signName || raw.ascendant?.sign || raw.ascendant?.name || (typeof raw.ascendant === "string" ? raw.ascendant : null);
  const planets = (raw.planets || []).map(p => ({
    name: p.planetName || p.name,
    sign: p.signName || p.sign,
    house: p.house || p.vargaHouse,
    dignity: p.dignity
  }));
  return { available: true, ascendant: asc, dashamshaLagna: asc, planets };
}

/**
 * Unified helper to retrieve KP cusps and sub-lords data from context
 */
export function getKPData(context) {
  if (!context || !context.chart) return { cusps: [], subLords: {}, significators: null, rulingPlanets: null };
  return {
    cusps: context.chart.kpCusps || [],
    subLords: context.chart.kpSubLords || {},
    significators: context.chart.kpSignificators || null,
    rulingPlanets: context.chart.kpRulingPlanets || null
  };
}

/**
 * Unified helper to retrieve current Dasha data from context
 */
export function getDashaData(context) {
  if (!context) return null;
  const chart = context.chart || (context.planets ? context : null);
  if (!chart) return null;
  return chart.currentDasha || null;
}

/**
 * Unified helper to retrieve all timing windows from context
 */
export function getTimingWindows(context) {
  if (!context || !context.report) return [];
  const windows = [];
  const addWins = (arr, domain) => {
    (arr || []).forEach(w => {
      if (w.years || w.ageRange || w.calendarYears) {
        windows.push({
          domain,
          years: w.years || w.calendarYears || null,
          ageRange: w.ageRange || null,
          title: w.title || null,
          nature: w.nature || w.theme || null
        });
      }
    });
  };
  addWins(context.report.career?.windows, "career");
  addWins(context.report.activeSectionData?.careerWindows, "career");
  addWins(context.report.marriage?.windows, "marriage");
  addWins(context.report.activeSectionData?.marriageWindows, "marriage");
  addWins(context.report.wealth?.windows, "property");
  addWins(context.report.activeSectionData?.acquisitionWindows, "property");
  addWins(context.report.activeSectionData?.examWindows, "studies");
  addWins(context.report.wellness?.risks, "health");
  addWins(context.report.activeSectionData?.riskWindows, "health");
  return windows;
}

/**
 * Centralized fact registry to provide a single source of truth
 * for all chart and report claim verification.
 */
export function getReportFactRegistry(context) {
  if (!context || typeof context !== "object") return null;
  const chart = context.chart || {};
  const report = context.report || {};

  const d9 = getD9Data(context);
  const d10 = getD10Data(context);
  const kp = getKPData(context);
  const dasha = getDashaData(context);
  const timingWindows = getTimingWindows(context);
  const evidenceIds = new Set(context.evidence?.evidenceIds || []);

  const planetsMap = new Map();
  (chart.planets || []).forEach(p => {
    if (p.name) planetsMap.set(p.name.toLowerCase(), p);
  });

  const yogas = (chart.yogas || report.activeSectionData?.detectedYogas || []).map(y => (y.name || "").toLowerCase());
  const remedies = report.remedies || {};

  return {
    system: context.system?.id || "lahiri",
    ascendant: chart.ascendant || null,
    moon: chart.moon || null,
    sun: chart.sun || null,
    planets: planetsMap,
    d9,
    d10,
    kp,
    dasha,
    timingWindows,
    evidenceIds,
    shadbala: Array.isArray(chart.shadbala) ? chart.shadbala : null,
    ashtakavarga: chart.ashtakavarga || null,
    yogas,
    remedies: {
      primaryGemstone: remedies.primaryGemstone ? (typeof remedies.primaryGemstone === "string" ? remedies.primaryGemstone.toLowerCase() : (remedies.primaryGemstone.gemstone || remedies.primaryGemstone.name || "").toLowerCase()) : null,
      recommended: (remedies.recommendedGemstones || []).map(g => (typeof g === "string" ? g : (g?.gemstone || g?.name || "")).toLowerCase()),
      contraindicated: (remedies.contraindicatedGemstones || []).map(g => (typeof g === "string" ? g : (g?.gemstone || g?.name || "")).toLowerCase())
    }
  };
}

/**
 * Validates whether an answer text or structured claims contain contradictory
 * claims against actual calculated chart facts.
 * STRICT ANTI-FABRICATION:
 * - Rejects claims when the underlying fact is unavailable or uncalculated.
 * - Rejects unknown planets/entities not supported by the system.
 * - Validates timing windows, Dasha dates, SAV totals, and Shadbala metrics.
 */
export function validateChartClaims(answerText, contextOrPlanets = [], structuredClaims = []) {
  if (!answerText && (!Array.isArray(structuredClaims) || structuredClaims.length === 0)) {
    return { isValid: true, violations: [] };
  }
  const violations = [];

  const isContext = contextOrPlanets && typeof contextOrPlanets === "object" && !Array.isArray(contextOrPlanets) && contextOrPlanets.chart;
  const chartPlanets = isContext ? (contextOrPlanets.chart?.planets || []) : (Array.isArray(contextOrPlanets) ? contextOrPlanets : []);
  const context = isContext ? contextOrPlanets : null;

  const registry = context ? getReportFactRegistry(context) : null;
  const planetMap = registry ? registry.planets : new Map();
  if (!registry) {
    chartPlanets.forEach(p => {
      if (p.name) planetMap.set(p.name.toLowerCase(), p);
    });
  }

  const textToScan = answerText || "";

  // 1. Check planet in house claims: e.g. "Jupiter is in the 10th house", "Mars in 7th house"
  const houseRegex = /\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu|Uranus|Neptune|Pluto)\s+(?:is\s+in|in|occupies|placed\s+in)\s+(?:the\s+)?(?:house\s+(\d{1,2})|(\d{1,2})(?:st|nd|rd|th)\s+house)\b/gi;
  let match;
  while ((match = houseRegex.exec(textToScan)) !== null) {
    const planetName = match[1].toLowerCase();
    const claimedHouse = parseInt(match[2] || match[3], 10);
    const actual = planetMap.get(planetName);
    if (!actual) {
      violations.push(`Unverifiable planet claim: ${match[1]} (not calculated in chart).`);
    } else if (typeof actual.house === "number" && actual.house !== claimedHouse) {
      violations.push(`Claimed ${match[1]} in H${claimedHouse}, but actual is H${actual.house}`);
    }
  }

  // 2. Check planet in sign claims: e.g. "Jupiter in Aries", "Moon in Taurus"
  const signRegex = /\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu|Uranus|Neptune|Pluto)\s+(?:is\s+in|in|occupies|placed\s+in)\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/gi;
  while ((match = signRegex.exec(textToScan)) !== null) {
    const planetName = match[1].toLowerCase();
    const claimedSign = match[2].toLowerCase();
    const actual = planetMap.get(planetName);
    if (!actual) {
      violations.push(`Unverifiable planet claim: ${match[1]} (not calculated in chart).`);
    } else if (actual.sign && actual.sign.toLowerCase() !== claimedSign) {
      violations.push(`Claimed ${match[1]} in ${match[2]}, but actual sign is ${actual.sign}`);
    }
  }

  if (registry) {
    const { d9, d10, kp, dasha, timingWindows, evidenceIds, shadbala, ashtakavarga, yogas, remedies } = registry;

    // 3. D9 Navamsha claims validation
    const d9AscRegex = /\b(?:D9|Navamsha|Navamsa)\s+(?:Ascendant|rising(?:\s+sign)?)\s+(?:is\s+in|is|in)?\s*(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/gi;
    while ((match = d9AscRegex.exec(textToScan)) !== null) {
      const claimedSign = match[1].toLowerCase();
      if (!d9 || !d9.ascendant) {
        violations.push(`Claimed D9 Ascendant in ${match[1]}, but D9 Navamsha is unavailable or not calculated.`);
      } else if (d9.ascendant.toLowerCase() !== claimedSign) {
        violations.push(`Claimed D9 Ascendant in ${match[1]}, but actual is ${d9.ascendant}`);
      }
    }

    const d9PlanetRegex = /\b(?:D9|Navamsha|Navamsa)\s+(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(?:is\s+in|in|occupies)\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/gi;
    while ((match = d9PlanetRegex.exec(textToScan)) !== null) {
      const pName = match[1].toLowerCase();
      const claimedSign = match[2].toLowerCase();
      if (!d9 || !d9.planets || d9.planets.length === 0) {
        violations.push(`Claimed D9 ${match[1]} in ${match[2]}, but D9 placements are unavailable.`);
      } else {
        const actualP = d9.planets.find(p => (p.name || "").toLowerCase() === pName);
        if (!actualP) {
          violations.push(`Claimed D9 ${match[1]}, but planet placement is uncalculated in D9.`);
        } else if (actualP.sign && actualP.sign.toLowerCase() !== claimedSign) {
          violations.push(`Claimed D9 ${match[1]} in ${match[2]}, but actual is ${actualP.sign}`);
        }
      }
    }

    // 4. D10 Dashamsha claims validation
    const d10AscRegex = /\b(?:D10|Dashamsha|Dasamsha)\s+(?:Ascendant|rising(?:\s+sign)?)\s+(?:is\s+in|is|in)?\s*(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/gi;
    while ((match = d10AscRegex.exec(textToScan)) !== null) {
      const claimedSign = match[1].toLowerCase();
      if (!d10 || !d10.ascendant) {
        violations.push(`Claimed D10 Ascendant in ${match[1]}, but D10 Dashamsha is unavailable or not calculated.`);
      } else if (d10.ascendant.toLowerCase() !== claimedSign) {
        violations.push(`Claimed D10 Ascendant in ${match[1]}, but actual is ${d10.ascendant}`);
      }
    }

    const d10PlanetRegex = /\b(?:D10|Dashamsha|Dasamsha)\s+(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(?:is\s+in|in|occupies)\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/gi;
    while ((match = d10PlanetRegex.exec(textToScan)) !== null) {
      const pName = match[1].toLowerCase();
      const claimedSign = match[2].toLowerCase();
      if (!d10 || !d10.planets || d10.planets.length === 0) {
        violations.push(`Claimed D10 ${match[1]} in ${match[2]}, but D10 placements are unavailable.`);
      } else {
        const actualP = d10.planets.find(p => (p.name || "").toLowerCase() === pName);
        if (!actualP) {
          violations.push(`Claimed D10 ${match[1]}, but planet placement is uncalculated in D10.`);
        } else if (actualP.sign && actualP.sign.toLowerCase() !== claimedSign) {
          violations.push(`Claimed D10 ${match[1]} in ${match[2]}, but actual is ${actualP.sign}`);
        }
      }
    }

    // 5. KP Cusp Sub-Lord validation
    const kpSubRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s+cusp\s+sub\s*lord\s+(?:is\s+)?(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\b/gi;
    while ((match = kpSubRegex.exec(textToScan)) !== null) {
      const cuspNum = parseInt(match[1], 10);
      const claimedLord = match[2].toLowerCase();
      const actualLord = kp.subLords?.[`cusp_${cuspNum}`] ||
        kp.cusps.find(c => c.house === cuspNum)?.subLord;
      if (!actualLord) {
        violations.push(`Claimed sub-lord for cusp ${cuspNum}, but KP cusps are unavailable or uncalculated.`);
      } else if (actualLord.toLowerCase() !== claimedLord) {
        violations.push(`Claimed cusp ${cuspNum} sub-lord is ${match[2]}, but actual is ${actualLord}`);
      }
    }

    // 6. Current Mahadasha / Antardasha validation
    const mdRegex = /\b(?:current|active)\s+Mahadasha\s+(?:is\s+)?(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\b/gi;
    while ((match = mdRegex.exec(textToScan)) !== null) {
      const claimedLord = match[1].toLowerCase();
      if (!dasha || !dasha.lord) {
        violations.push(`Claimed active Mahadasha is ${match[1]}, but Dasha timeline is unavailable.`);
      } else if (dasha.lord.toLowerCase() !== claimedLord) {
        violations.push(`Claimed active Mahadasha is ${match[1]}, but actual is ${dasha.lord}`);
      }
    }

    const adRegex = /\b(?:current|active)\s+Antardasha\s+(?:is\s+)?(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\b/gi;
    while ((match = adRegex.exec(textToScan)) !== null) {
      const claimedLord = match[1].toLowerCase();
      if (!dasha || !dasha.subLord) {
        violations.push(`Claimed active Antardasha is ${match[1]}, but Antardasha timeline is unavailable.`);
      } else if (dasha.subLord.toLowerCase() !== claimedLord) {
        violations.push(`Claimed active Antardasha is ${match[1]}, but actual is ${dasha.subLord}`);
      }
    }

    // 7. Evidence ID citation validation (must exist in verified ledger)
    const evIdRegex = /\b(?:Evidence|Evidence\s+ID|Fact)\s+([A-Z]\d{2})\b/gi;
    while ((match = evIdRegex.exec(textToScan)) !== null) {
      const id = match[1].toUpperCase();
      if (!evidenceIds.has(id)) {
        violations.push(`Cited evidence ID ${id}, which does not exist in the calculated evidence ledger.`);
      }
    }

    // 8. Ashtakavarga total bindu validation
    const savRegex = /\b(?:total\s+(?:SAV|Sarvashtakavarga)\s+bindus?|total\s+bindus?)\s+(?:of\s+)?(\d{2,3})\b/gi;
    while ((match = savRegex.exec(textToScan)) !== null) {
      const claimedTotal = parseInt(match[1], 10);
      const actualTotal = ashtakavarga?.totalBindus;
      if (typeof actualTotal !== "number") {
        violations.push(`Claimed Ashtakavarga total bindus ${claimedTotal}, but SAV is uncalculated.`);
      } else if (actualTotal !== claimedTotal) {
        violations.push(`Claimed Ashtakavarga total bindus ${claimedTotal}, but actual is ${actualTotal}`);
      }
    }

    // 9. Structured claims validation if returned by AI
    if (Array.isArray(structuredClaims)) {
      for (const claim of structuredClaims) {
        if (!claim || typeof claim !== "object") continue;
        if (claim.type === "planet_house") {
          const act = planetMap.get((claim.planet || "").toLowerCase());
          if (!act) {
            violations.push(`Unverifiable planet claim: ${claim.planet}`);
          } else if (typeof act.house !== "number" || act.house !== claim.house) {
            violations.push(`Structured claim ${claim.planet} in H${claim.house} contradicted by actual H${act.house}`);
          }
        } else if (claim.type === "planet_sign") {
          const act = planetMap.get((claim.planet || "").toLowerCase());
          if (!act) {
            violations.push(`Unverifiable planet claim: ${claim.planet}`);
          } else if (!act.sign || act.sign.toLowerCase() !== (claim.sign || "").toLowerCase()) {
            violations.push(`Structured claim ${claim.planet} in ${claim.sign} contradicted by actual ${act.sign}`);
          }
        } else if (claim.type === "d10_ascendant") {
          if (!d10 || !d10.ascendant) {
            violations.push(`Structured claim D10 Ascendant cannot be verified because D10 is unavailable.`);
          } else if (d10.ascendant.toLowerCase() !== (claim.sign || "").toLowerCase()) {
            violations.push(`Structured claim D10 ascendant ${claim.sign} contradicted by actual ${d10.ascendant}`);
          }
        } else if (claim.type === "d9_ascendant") {
          if (!d9 || !d9.ascendant) {
            violations.push(`Structured claim D9 Ascendant cannot be verified because D9 is unavailable.`);
          } else if (d9.ascendant.toLowerCase() !== (claim.sign || "").toLowerCase()) {
            violations.push(`Structured claim D9 ascendant ${claim.sign} contradicted by actual ${d9.ascendant}`);
          }
        } else if (claim.type === "kp_sub_lord") {
          const act = kp.subLords?.[`cusp_${claim.cusp}`] || kp.cusps.find(c => c.house === claim.cusp)?.subLord;
          if (!act) {
            violations.push(`Structured claim cusp ${claim.cusp} sub-lord cannot be verified because KP cusps are unavailable.`);
          } else if (act.toLowerCase() !== (claim.planet || "").toLowerCase()) {
            violations.push(`Structured claim cusp ${claim.cusp} sub lord ${claim.planet} contradicted by actual ${act}`);
          }
        } else if (claim.type === "mahadasha") {
          if (!dasha || !dasha.lord) {
            violations.push(`Structured claim Mahadasha cannot be verified because Dasha is unavailable.`);
          } else if (dasha.lord.toLowerCase() !== (claim.lord || "").toLowerCase()) {
            violations.push(`Structured claim Mahadasha ${claim.lord} contradicted by actual ${dasha.lord}`);
          } else if (claim.startAge && dasha.startAge && Math.abs(claim.startAge - dasha.startAge) > 0.5) {
            violations.push(`Structured claim Mahadasha start age ${claim.startAge} contradicted by actual ${dasha.startAge}`);
          } else if (claim.endAge && dasha.endAge && Math.abs(claim.endAge - dasha.endAge) > 0.5) {
            violations.push(`Structured claim Mahadasha end age ${claim.endAge} contradicted by actual ${dasha.endAge}`);
          }
        } else if (claim.type === "report_window" || claim.type === "timing_window") {
          const claimedYr = claim.years || claim.calendarYears;
          const matchWin = timingWindows.some(w => w.years === claimedYr);
          if (!matchWin) {
            violations.push(`Structured claim timing window "${claimedYr}" does not exist in calculated report windows.`);
          }
        } else if (claim.type === "shadbala") {
          if (!shadbala || shadbala.length === 0) {
            violations.push(`Structured claim Shadbala cannot be verified because Shadbala is unavailable.`);
          } else {
            const pShad = shadbala.find(s => (s.planet || "").toLowerCase() === (claim.planet || "").toLowerCase());
            if (!pShad) {
              violations.push(`Structured claim Shadbala for ${claim.planet} is not calculated.`);
            } else if (claim.totalRupas && Math.abs(claim.totalRupas - pShad.totalRupas) > 0.1) {
              violations.push(`Structured claim Shadbala rupas ${claim.totalRupas} contradicted by actual ${pShad.totalRupas}`);
            }
          }
        } else if (claim.type === "ashtakavarga" || claim.type === "sav_bindus") {
          if (!ashtakavarga || typeof ashtakavarga.totalBindus !== "number") {
            violations.push(`Structured claim Ashtakavarga cannot be verified because SAV is unavailable.`);
          } else if (typeof claim.totalBindus === "number" && claim.totalBindus !== ashtakavarga.totalBindus) {
            violations.push(`Structured claim SAV total ${claim.totalBindus} contradicted by actual ${ashtakavarga.totalBindus}`);
          }
        } else if (claim.type === "yoga") {
          const yName = (claim.name || "").toLowerCase();
          if (!yogas.some(y => y.includes(yName) || yName.includes(y))) {
            violations.push(`Structured claim yoga "${claim.name}" is not calculated in chart yogas.`);
          }
        } else if (claim.type === "gemstone") {
          const gName = (claim.name || "").toLowerCase();
          if (claim.status === "contraindicated") {
            if (!remedies.contraindicated.some(c => c.includes(gName))) {
              violations.push(`Structured claim contraindicated gemstone "${claim.name}" is not listed in report.`);
            }
          } else if (claim.status === "recommended") {
            if (remedies.primaryGemstone !== gName && !remedies.recommended.some(r => r.includes(gName))) {
              violations.push(`Structured claim recommended gemstone "${claim.name}" is not listed in report.`);
            }
          }
        } else if (claim.type === "evidence") {
          if (!evidenceIds.has(claim.id)) {
            violations.push(`Structured claim cited unverified evidence ${claim.id}`);
          }
        }
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Question-specific context reducer: extracts complete, structured, un-truncated
 * relevant data for the specific question without arbitrary slice limits.
 */
/**
 * Question-specific context reducer: extracts complete, structured, un-truncated
 * relevant data for the specific question without arbitrary slice limits.
 * Covers all 19 canonical report chapters and specialized astrological domains.
 */
export function buildRelevantReportContext(questionText, context, route) {
  const qLower = (questionText || "").toLowerCase();
  const relevantSections = route.relevantSections || [context.report.activeSectionId || "execSummary"];
  const sysId = context.system.id;
  const sysName = context.system.name;

  const reduced = {
    system: {
      id: sysId,
      name: sysName,
      zodiacType: context.system.zodiacType,
      ayanamsha: context.system.ayanamshaType,
      houseSystem: context.system.defaultHouseSystem
    },
    ascendant: context.chart.ascendant ? {
      sign: context.chart.ascendant.sign,
      degree: context.chart.ascendant.degree,
      nakshatra: context.chart.ascendant.nakshatra || null,
      pada: context.chart.ascendant.pada || null
    } : null,
    moon: context.chart.moon ? {
      sign: context.chart.moon.sign,
      nakshatra: context.chart.moon.nakshatra || null,
      pada: context.chart.moon.pada || null
    } : null,
    sun: context.chart.sun ? {
      sign: context.chart.sun.sign,
      degree: context.chart.sun.degree || null
    } : null,
    currentDasha: context.chart.currentDasha || null,
    operatingDomain: relevantSections
  };

  // 1. Panchanga
  if (relevantSections.includes("panchanga") || /panchang|vara|tithi|karana|sunrise|sunset|rahu\s+kalam/i.test(qLower)) {
    reduced.panchanga = context.chart.panchanga || context.report.activeSectionData?.panchanga || null;
  }

  // 2. Blueprint / Natal Rasi & Karmic Disposition
  if (relevantSections.includes("blueprint") || /blueprint|natal|planetary\s+position|degree|combustion|retrograde|dispositor/i.test(qLower)) {
    reduced.blueprint = {
      ascendant: context.chart.ascendant || null,
      moon: context.chart.moon || null,
      sun: context.chart.sun || null,
      planets: context.chart.planets || [],
      nakshatraDispositors: context.chart.dispositors || null,
      planetaryAvasthas: context.chart.avasthas || null,
      atmakaraka: context.chart.atmakaraka || null
    };
  }

  // 3. Jaimini Karakas & Chara Karakas
  if (relevantSections.includes("jaimini") || /jaimini|atmakaraka|amatyakaraka|darakaraka|chara\s+karaka|upapada/i.test(qLower)) {
    reduced.jaimini = {
      karakas: context.chart.jaimini || (context.chart.atmakaraka ? [context.chart.atmakaraka] : null),
      atmakaraka: context.chart.atmakaraka || null
    };
  }

  // 4. Planetary Avasthas
  if (relevantSections.includes("avasthas") || /avastha|bala\s+avastha|kumara|yuva|vriddha|mrita|jagradadi/i.test(qLower)) {
    reduced.avasthas = context.chart.avasthas || context.report.activeSectionData?.planetaryAvasthas || null;
  }

  // 5. Vargas / Divisional Charts (D1 through D60)
  if (relevantSections.includes("vargas") || /varga|divisional|shodashavarga|d2|d3|d4|d7|d9|d10|d12|d16|d20|d24|d27|d30|d60/i.test(qLower)) {
    reduced.vargas = {
      d9: getD9Data(context),
      d10: getD10Data(context),
      allVargas: context.chart.allVargas || null
    };
  }

  // 6. Transits / Gochara & Sade Sati
  if (relevantSections.includes("transits") || /transit|gochar|sade\s+sati|saturn\s+transit|jupiter\s+transit|rahu\s+transit/i.test(qLower)) {
    reduced.transits = context.chart.transits || context.report?.activeSectionData?.transits || context.report?.activeSectionData?.transitCrossings || null;
  }

  // 7. Timeline / Vimshottari Dasha
  if (relevantSections.includes("timeline") || /timeline|dasha|mahadasha|antardasha|pratyantardasha|stage/i.test(qLower)) {
    reduced.timeline = {
      currentDasha: context.chart.currentDasha || null,
      stages: context.chart.timeline || context.report?.activeSectionData?.timelineStages || []
    };
  }

  // 8. Career Domain
  if (relevantSections.includes("career") || /career|job|profession|promotion|work|business|vocation/i.test(qLower)) {
    reduced.career = {
      destinyVerdict: context.report?.career?.destiny || context.report?.activeSectionData?.careerDestinyVerdict || null,
      examObstacleVerdict: context.report?.activeSectionData?.examObstacleVerdict || null,
      careerWindows: context.report?.career?.windows || context.report?.activeSectionData?.careerWindows || [],
      domainSummary: context.report?.activeSectionData?.domainSummary || null,
      d10Dashamsha: getD10Data(context),
      tenthHouse: (context.report?.activeSectionData?.bhavasDetailed || context.chart.bhavasDetailed || []).find(b => b.num === 10) || null,
      careerEvidenceIds: (context.evidence?.evidenceIds || []).filter(id => id.startsWith("C"))
    };
  }

  // 9. Relationships / Marriage Domain
  if (relevantSections.includes("relationships") || /marriage|spouse|relationship|partner|wedding/i.test(qLower)) {
    reduced.relationships = {
      marriageVerdict: context.report?.marriage?.verdict || context.report?.activeSectionData?.marriageVerdict || null,
      spouseProfile: context.report?.activeSectionData?.spouseProfile || null,
      marriageWindows: context.report?.marriage?.windows || context.report?.activeSectionData?.marriageWindows || [],
      auspiciousYears: context.report?.activeSectionData?.auspiciousYears || null,
      d9Navamsha: getD9Data(context),
      seventhHouse: (context.report?.activeSectionData?.bhavasDetailed || context.chart.bhavasDetailed || []).find(b => b.num === 7) || null,
      relationshipEvidenceIds: (context.evidence?.evidenceIds || []).filter(id => id.startsWith("M"))
    };
  }

  // 10. KP System Specifics
  if (sysId === "kp" || /sub\s*lord|significator|cusp|ruling\s+planet/i.test(qLower)) {
    reduced.kp = getKPData(context);
  }

  // 11. Bhavas / 12 Houses
  if (relevantSections.includes("bhavas") || /bhava|house|chalit|kendra|trikona|dusthana/i.test(qLower)) {
    reduced.bhavas = {
      bhavasDetailed: context.report?.activeSectionData?.bhavasDetailed || context.chart.bhavasDetailed || [],
      bhavaChalit: context.report?.activeSectionData?.bhavaChalit || null
    };
  }

  // 12. Yogas
  if (relevantSections.includes("yogas") || /yoga|raja\s+yoga|dhana\s+yoga/i.test(qLower)) {
    reduced.yogas = context.chart.yogas || context.report?.activeSectionData?.detectedYogas || [];
  }

  // 13. Remedies
  if (relevantSections.includes("remedies") || /remedy|remedies|gemstone|mantra|charity/i.test(qLower)) {
    reduced.remedies = {
      primaryGemstone: context.report?.remedies?.primaryGemstone || context.report?.activeSectionData?.primaryGemstone || null,
      gemLord: context.report?.remedies?.gemLord || context.report?.activeSectionData?.gemLord || null,
      recommendedGemstones: context.report?.remedies?.recommendedGemstones || context.report?.activeSectionData?.recommendedGemstones || [],
      contraindicatedGemstones: context.report?.remedies?.contraindicatedGemstones || context.report?.activeSectionData?.contraindicatedGemstones || [],
      mantra: context.report?.remedies?.mantra || context.report?.activeSectionData?.mantra || null,
      charity: context.report?.remedies?.charity || context.report?.activeSectionData?.charity || null
    };
  }

  // 14. Health & Dosha
  if (relevantSections.includes("health") || relevantSections.includes("dosha") || /health|wellness|vitality|dosha/i.test(qLower)) {
    reduced.health = {
      wellnessSummary: context.report?.wellness?.summary || context.report?.activeSectionData?.domainWellness?.summary || null,
      riskWindows: context.report?.wellness?.risks || context.report?.activeSectionData?.riskWindows || [],
      dosha: context.report?.activeSectionData?.primaryDosha ? {
        primary: context.report.activeSectionData.primaryDosha,
        secondary: context.report.activeSectionData.secondaryDosha || null,
        elemental: context.report.activeSectionData.elementalDistribution || null
      } : null
    };
  }

  // 15. Studies & Education
  if (relevantSections.includes("studies") || /education|study|exam|learning/i.test(qLower)) {
    reduced.studies = {
      academicThemes: context.report.activeSectionData?.academicThemes || null,
      examWindows: context.report.activeSectionData?.examWindows || [],
      fourthHouse: (context.report.activeSectionData?.bhavasDetailed || context.chart.bhavasDetailed || []).find(b => b.num === 4) || null,
      fifthHouse: (context.report.activeSectionData?.bhavasDetailed || context.chart.bhavasDetailed || []).find(b => b.num === 5) || null
    };
  }

  // 16. Property & Real Estate
  if (relevantSections.includes("property") || /property|wealth|real\s+estate|vehicle|finance/i.test(qLower)) {
    reduced.property = {
      propertySummary: context.report.wealth?.summary || context.report.activeSectionData?.propertySummary || null,
      acquisitionWindows: context.report.wealth?.windows || context.report.activeSectionData?.acquisitionWindows || [],
      d4Ascendant: context.report.activeSectionData?.d4Ascendant || null
    };
  }

  // 17. Politics & Public Governance
  if (relevantSections.includes("politics") || /politics|governance|public\s+service|leadership/i.test(qLower)) {
    reduced.politics = {
      governanceThemes: context.report.activeSectionData?.governanceThemes || null
    };
  }

  // 18. Foreign Travel & Moksha
  if (relevantSections.includes("foreign") || /foreign|travel|abroad|overseas|moksha/i.test(qLower)) {
    reduced.foreign = {
      foreignTravelSummary: context.report.activeSectionData?.foreignTravelSummary || null
    };
  }

  // 19. Auspicious Timing Principles
  if (relevantSections.includes("auspicious") || /auspicious|muhurta|good\s+time/i.test(qLower)) {
    reduced.auspicious = {
      auspiciousWindows: context.report.activeSectionData?.auspiciousWindows || null
    };
  }

  // 20. Caution Indicators & Risk Matrix
  if (relevantSections.includes("risks") || /risk|caution|vulnerability|danger/i.test(qLower)) {
    reduced.risks = {
      vulnerabilityWindows: context.report.activeSectionData?.vulnerabilityWindows || context.report.wellness?.risks || []
    };
  }

  // 21. Milestone Verification (Retrospective Audit)
  if (relevantSections.includes("milestoneAudit") || /milestone|past\s+event|life\s+audit|retrospective/i.test(qLower)) {
    reduced.milestoneAudit = {
      retrospectiveMilestones: context.chart.milestones || context.report.activeSectionData?.retrospectiveMilestones || []
    };
  }

  // 22. Evidence Dossier & Prediction Reasoning Chains (FULL RECORDS!)
  if (relevantSections.includes("reasoningDossier") || /evidence|reasoning|why\s+did|how\s+calculated|dossier/i.test(qLower)) {
    reduced.evidence = {
      evidenceIds: context.evidence.evidenceIds || [],
      ledger: context.evidence.ledger || null,
      reasoningLevels: context.evidence.reasoningLevels || []
    };
  }

  // 23. Palmistry
  if (relevantSections.includes("palmistry") || /palm|hand|mount|heart\s+line|head\s+line|life\s+line/i.test(qLower)) {
    reduced.palmistry = context.chart.palmistry || context.report.activeSectionData || null;
  }

  // 24. Technical Appendix & Metrics
  if (relevantSections.includes("technicalAppendix") || /shadbala|virupa|ashtakavarga|bindu/i.test(qLower)) {
    reduced.technical = {
      shadbala: context.chart.shadbala || [],
      ashtakavarga: context.chart.ashtakavarga || null,
      ayanamsha: context.chart.ayanamshaValue || null,
      conventions: context.chart.conventions || null
    };
  }

  // 25. Multi-System Comparison
  if (relevantSections.includes("multiSystemComparison") || context.multiSystemAvailable || /compare|difference/i.test(qLower)) {
    reduced.multiSystemComparison = context.multiSystemComparison || null;
  }

  // 26. Full Report / Executive Summary General Context
  if (relevantSections.includes("execSummary") || relevantSections.includes("fullReport") || relevantSections.includes("all")) {
    reduced.executiveSummary = {
      coreProfile: context.report.executiveSummary?.coreProfile || null,
      strongestThemes: context.report.executiveSummary?.strongestThemes || [],
      currentLifePhase: context.report.executiveSummary?.currentLifePhase || null,
      keyCautions: context.report.executiveSummary?.keyCautions || []
    };
  }

  return reduced;
}

/**
 * Builds a compact, structured, un-truncated prompt for follow-up analytical answers
 */
function buildFollowUpAIPrompt(questionText, context, route, conversationHistory = []) {
  const sysName = context.system.name;
  const sysId = context.system.id;

  // Extract recent conversation history (last 4 turns)
  const recentHistory = (conversationHistory || []).slice(-4).map(turn => {
    const q = turn.content || turn.question || "";
    const a = turn.answer || (turn.role === "assistant" ? turn.content : "");
    if (turn.role === "user") return `Seeker: ${q}`;
    if (turn.role === "assistant") return `Astrologer: ${a}`;
    return `Seeker: ${q}\nAstrologer: ${a}`;
  }).join("\n");

  // Format relevant chart facts with strict truthfulness (no presentation placeholders)
  const planetsSummary = (context.chart.planets || []).map(p => 
    `${p.name} in ${p.sign || 'unavailable'} (H${p.house ?? 'unavailable'}, dignity: ${p.dignity || 'unavailable'}${p.isRetrograde ? ', Retro' : ''})`
  ).join("; ") || "unavailable";

  const startAge = context.chart.currentDasha?.startAge;
  const endAge = context.chart.currentDasha?.endAge;
  const agePart = Number.isFinite(startAge) && Number.isFinite(endAge)
    ? ` (Ages ${startAge}-${endAge})`
    : "";

  const dashaSummary = context.chart.currentDasha
    ? `Active Mahadasha: ${context.chart.currentDasha.lord}${context.chart.currentDasha.subLord ? ` / Antardasha: ${context.chart.currentDasha.subLord}` : ''}${agePart}`
    : (sysId === "tropical" ? "N/A (Tropical Western system does not calculate Vimshottari Dashas)" : "None");

  const evidenceSummary = (context.evidence?.evidenceIds || []).slice(0, 12).join(", ") || "None";

  // System-specific instructions
  let systemNote = "";
  if (sysId === "tropical") {
    systemNote = "CRITICAL: This is a Tropical Western chart. Do NOT mention Vedic Vargas, Dashas, Shadbala, or Nakshatras. Base findings on Placidus houses, essential dignities, and Ptolemaic aspects.";
  } else if (sysId === "kp") {
    systemNote = "CRITICAL: This is a KP chart. Prioritize KP cusps, star lords, and sub-lords. Do NOT cite Parashari Shadbala virupas.";
  } else {
    systemNote = "CRITICAL: This is a Sidereal Vedic chart. Use Parashari, Jaimini, Dashas, and harmonic vargas as calculated in the report.";
  }

  // Question-specific context reduction (complete, zero blind truncation!)
  const relevantContext = buildRelevantReportContext(questionText, context, route);
  const relevantContextJson = JSON.stringify(relevantContext, null, 2);

  const intent = route.consultationIntent || classifyConsultationIntent(questionText, conversationHistory);
  let consultationDirectives = "";
  if (intent && intent.resolvedText) {
    consultationDirectives = `\nCONSULTATION TOPIC & INTENT:
- Target Question: "${questionText}"
- Decomposed Subject: ${intent.domain} (${intent.questionType || intent.subdomain || 'General'})
- Specific Analysis Focus: ${intent.resolvedText}
- Core Requirement: Directly answer the user's specific question using relevant houses, lords, and dasha factors. Never output a generic horoscope summary.`;
  }

  const prompt = `You are the AstroVerse Follow-Up Astrological Scholar answering a seeker's question about their already calculated report.

SYSTEM INSTRUCTION:
- Answer ONLY using the supplied calculated report facts, findings, and evidence in RELEVANT REPORT CONTEXT.
- ${systemNote}${consultationDirectives}
- DO NOT recalculate or invent any chart values, dates, degrees, or planetary positions.
- DO NOT make absolute fatalistic predictions or give medical/financial advice.
- Keep response focused, structured, and between 150 to 350 words.
- Format response strictly as a JSON object with this schema:
{
  "answer": "Your comprehensive, grounded explanation...",
  "system": "${sysId}",
  "relevantSections": ["sectionId1"],
  "evidenceIds": ["C01"],
  "dataUsed": ["Planetary placement", "Dasha period"],
  "status": "REPORT_SUPPORTED",
  "claims": [
    { "type": "planet_house", "planet": "Saturn", "house": 10 },
    { "type": "planet_sign", "planet": "Saturn", "sign": "Aquarius" }
  ],
  "limitations": []
}

GENERAL CHART FACTS:
- Selected Astrology System: ${sysName} (${sysId})
- Ascendant (Lagna): ${context.chart.ascendant?.sign || 'unavailable'}${Number.isFinite(context.chart.ascendant?.degree) ? ` at ${context.chart.ascendant.degree}°` : ''}
- Moon Sign: ${context.chart.moon?.sign || 'unavailable'}${context.chart.moon?.nakshatra ? ` (${context.chart.moon.nakshatra}${context.chart.moon?.pada ? ` Pada ${context.chart.moon.pada}` : ''})` : ''}
- Sun Sign: ${context.chart.sun?.sign || 'unavailable'}
- Natal Planetary Positions: ${planetsSummary}
- Dasha Status: ${dashaSummary}
- Available Evidence IDs: ${evidenceSummary}

RELEVANT REPORT CONTEXT (AUTHORITATIVE & UN-TRUNCATED):
${relevantContextJson}

${recentHistory ? `RECENT CONVERSATION:\n${recentHistory}\n` : ''}

USER QUESTION:
"${questionText}"

Respond ONLY with valid JSON.`;

  return prompt;
}

/**
 * Deterministic local synthesis for offline or fallback operation
 * STRICT ANTI-FABRICATION:
 * - If findings are missing, returns INSUFFICIENT_DATA rather than generic fillers.
 * - Explicitly distinguishes [Report Finding] from [Traditional Astrological Context].
 */
function generateDeterministicAnswer(questionText, context, route) {
  const cleanQ = typeof questionText === "string" ? questionText.replace(/\s*\(Context:[\s\S]*?\)$/i, "").trim() : (questionText?.text || "");
  const rawQ = cleanQ;
  const isTamil = context.lang === "ta" || /[\u0B80-\u0BFF]/.test(rawQ) || context.chart?.userLanguage === "ta";
  const sysName = isTamil ? (context.system.tamilName || context.system.name) : context.system.name;
  const sysId = context.system.id;
  const asc = context.chart.ascendant?.sign || null;
  const moon = context.chart.moon?.sign || null;
  const curDasha = context.chart.currentDasha?.lord;
  const curSub = context.chart.currentDasha?.subLord;

  const relevantSections = route.relevantSections || ["execSummary"];
  const evidenceIds = route.evidenceIds || [];

  let body = "";
  let status = "REPORT_SUPPORTED";

  const qLower = cleanQ.toLowerCase();

  // Domain intent detectors
  const hasRemediesQuery = /remedy|remedies|gemstone|mantra|charity|rudraksha|stone|ruby|pearl|coral|emerald|yellow\s*sapphire|diamond|blue\s*sapphire|gomed|cat'?s\s*eye|பரிகாரம்|ரத்தினம்|மந்திரம்/i.test(qLower);
  const hasMarriageQuery = /marri|spouse|relationship|partner|wedding|wife|husband|match|progeny|family|love|divorce|remarri|compatibility|திருமண|களத்திர|மனைவி|கணவர்|கல்யாணம்|குடும்பம்|தாம்பத்|d9|navamsha|navamsa/i.test(qLower);
  const hasHealthQuery = /health|wellness|vitality|body|diet|constitution|illness|disease|fitness|mental\s*health|stress|cure|hospital|energy|stamina|ஆரோக்கியம்|உடல்நலம்|நோய்|சுகாதாரம்|மருத்துவம்|உடற்பயிற்சி|dosha|vata|pitta|kapha|ayurved/i.test(qLower);
  const hasPropertyQuery = /wealth|money|financ|property|vehicle|car|bike|real\s*estate|house|home|land|flat|apartment|bhoomi|vahana|asset|loan|debt|bank|dhana|சொத்து|வீடு|மனை|வாகனம்|பணம்|நிதி|வங்கி|கடன்/i.test(qLower);
  const hasStudiesQuery = /education|study|studies|studying|exam|degree|college|school|university|academic|upsc|neet|competitive|higher\s+ed|course|marks|grade|கல்வி|படிப்பு|தேர்வு|கல்லூரி|பள்ளி/i.test(qLower);
  const hasCareerQuery = /career|job|profession|work|business|vocation|promotion|employment|salary|office|interview|startup|venture|trade|commerce|industry|தொழில்|வேலை|உத்தியோகம்|வியாபாரம்|சுயதொழில்|பதவி|ஊதியம்|d10|dashamsha|dasamsha/i.test(qLower);
  const hasYogasQuery = /yoga|raja\s+yoga|dhana\s+yoga|gajakesari|pancha\s+mahapurusha|strength|potential|talent|blessing|யோகம்|பலம்/i.test(qLower);
  const hasBhavasQuery = /bhava|chalit|kendra|trikona|dusthana|house\s+breakdown|பாவகம்/i.test(qLower);
  const hasPoliticsQuery = /politics|political|minister|government|leadership|power|authority|status|governance|public\s+service|அரசியல்|தலைமை|அரசு|அதிகாரம்|ஆட்சி/i.test(qLower);
  const hasForeignQuery = /foreign|overseas|travel|relocation|abroad|moksha|visa|settlement|pr\b|immigrat|passport|வெளிநாடு|பயணம்|குடியேற|விசா/i.test(qLower);

  const isRemedies = hasRemediesQuery || relevantSections[0] === "remedies" || (relevantSections.includes("remedies") && !hasCareerQuery && !hasMarriageQuery && !hasHealthQuery && !hasPropertyQuery && !hasStudiesQuery);
  const isRelationships = hasMarriageQuery || relevantSections[0] === "relationships" || (relevantSections.includes("relationships") && !hasCareerQuery && !hasHealthQuery && !hasPropertyQuery && !hasStudiesQuery);
  const isHealth = hasHealthQuery || relevantSections[0] === "health" || relevantSections[0] === "dosha" || ((relevantSections.includes("health") || relevantSections.includes("dosha")) && !hasCareerQuery && !hasPropertyQuery && !hasStudiesQuery);
  const isProperty = hasPropertyQuery || relevantSections[0] === "property" || (relevantSections.includes("property") && !hasCareerQuery && !hasStudiesQuery);
  const isStudies = hasStudiesQuery || relevantSections[0] === "studies" || (relevantSections.includes("studies") && !hasCareerQuery);
  const isCareer = hasCareerQuery || relevantSections[0] === "career" || relevantSections.includes("career");
  const isPolitics = hasPoliticsQuery || relevantSections[0] === "politics" || relevantSections.includes("politics");
  const isForeign = hasForeignQuery || relevantSections[0] === "foreign" || relevantSections.includes("foreign");
  const isYogas = hasYogasQuery || relevantSections[0] === "yogas" || (relevantSections.includes("yogas") && !hasCareerQuery);
  const isBhavas = hasBhavasQuery || relevantSections[0] === "bhavas" || (relevantSections.includes("bhavas") && !hasCareerQuery && !hasMarriageQuery && !hasHealthQuery);

  const formatWithDisclaimers = (ansBody, targetSections = []) => {
    let disc = "";
    const healthRegex = /health|vitality|wellness|disease|illness|doctor|medicine|medical|surgery|sickness|cure|hospital|constitution|dosha|vata|pitta|kapha|ayurved|ஆரோக்கிய|மருத்துவ|நோய்|சுகாதார/i;
    const propertyRegex = /wealth|financ|money|stock|stocks|investment|invest|property|real\s*estate|asset|loan|debt|dhana|bank|bhoomi|vahana|பணம்|நிதி|முதலீடு|சொத்து|வங்கி|கடன்/i;

    const isAnyHealth = isHealth || 
      targetSections.includes("health") || 
      targetSections.includes("dosha") || 
      targetSections.includes("wellness") ||
      healthRegex.test(cleanQ) || 
      healthRegex.test(ansBody);

    const isAnyProperty = isProperty || 
      targetSections.includes("property") || 
      targetSections.includes("wealth") ||
      propertyRegex.test(cleanQ) || 
      propertyRegex.test(ansBody);

    if (isAnyHealth && !/medical advice|மருத்துவ ஆலோசனை|Statutory Medical Notice|clinical diagnosis/i.test(ansBody + disc)) {
      disc += isTamil
        ? "\n\n[சட்டரீதியான அறிவிப்பு: இந்த ஜோதிடக் குறிப்புகள் பாரம்பரிய நம்பிக்கை சார்ந்தவை மட்டுமே; எந்தவொரு மருத்துவ ஆலோசனைக்கும் தகுதிவாய்ந்த மருத்துவரை அணுகவும்.]"
        : "\n\n[Statutory Medical Notice: Traditional astrological interpretation only; not clinical diagnosis or medical advice. Consult qualified healthcare professionals for health concerns.]";
    }
    if (isAnyProperty && !/financial advice|நிதி ஆலோசனை|Statutory Financial Notice/i.test(ansBody + disc)) {
      disc += isTamil
        ? "\n\n[சட்டரீதியான அறிவிப்பு: ஜோதிட குறியீட்டு ஆய்வு மட்டுமே; நிதி அல்லது முதலீட்டு ஆலோசனை அல்ல.]"
        : "\n\n[Statutory Financial Notice: Traditional astrological interpretation; not financial or investment advice.]";
    }
    return ansBody + disc;
  };

  // 0. Universal Consultation Engine Integration (High-Priority Semantic Sub-Engines)
  const hasMinChartData = Boolean(
    context.chart?.ascendant || 
    (context.chart?.bhavasDetailed && context.chart.bhavasDetailed.length > 0) ||
    (context.chart?.planets && context.chart.planets.length >= 7)
  );

  const isReportQuery = /in\s+my\s+report|my\s+report\s+indicate|from\s+my\s+report|show\s+my\s+report|அறிக்கையில்/i.test(cleanQ);
  const isSystemComparison =
    route.type === "SYSTEM_COMPARISON" ||
    /(lahiri|chitrapaksha).*(kp|krishnamurti)|(kp|krishnamurti).*(lahiri|chitrapaksha)/i.test(cleanQ) ||
    /difference.*between.*(lahiri|kp|raman|tropical)|compare.*(lahiri|kp|raman|tropical)|(changes?|switch).*(between|from).*(lahiri|kp)|why\s+do\s+(lahiri|kp|raman|tropical)\s+(and|differ)|changes?\s+signs?/i.test(cleanQ) ||
    /(லஹிரி|சித்திரபக்ஷ).*(கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி)|(கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி).*(லஹிரி|சித்திரபக்ஷ)/i.test(cleanQ) ||
    /((லஹிரி|சித்திரபக்ஷ).*மற்றும்.*(கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி))|((கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி).*மற்றும்.*(லஹிரி|சித்திரபக்ஷ))/i.test(cleanQ) ||
    /(லஹிரி|கே\.?பி|கேபி).*முறைகளுக்கு\s*இடையே.*(மாற்றங்கள்|வேறுபாடு|ஒப்பீடு)/i.test(cleanQ) ||
    /முறை.*ஒப்பீடு|வேறுபாடு.*(லஹிரி|கே\.?பி)|system.*comparison|between\s+(lahiri|kp)\s+and\s+(lahiri|kp)/i.test(cleanQ) ||
    ((/லஹிரி|சித்திரபக்ஷ/i.test(cleanQ) || /\blahiri\b/i.test(cleanQ)) && (/கே\.?பி|கேபி|கிருஷ்ணமூர்த்தி/i.test(cleanQ) || /\bkp\b/i.test(cleanQ)));

  const isTopHeadings = route.type === "TOP_HEADINGS" || /top\s+(?:three|3)?\s*(?:report\s+)?(?:headings?|sections?|topics?|chapters?)|three\s+(?:main\s+|key\s+)?(?:headings?|sections?|topics?)|முக்கிய\s*(?:3|மூன்று)?\s*தலைப்புகள்?/i.test(cleanQ);

  if (isSystemComparison) {
    const comp = compareAstrologySystems({
      chart: context.chart,
      multiSystemBundle: context.multiSystemBundle,
      isTamil
    });

    if (comp && comp.status === "SUCCESS") {
      body = isTamil ? comp.directAnswerTa : comp.directAnswerEn;
      return {
        answer: formatWithDisclaimers(body, ["multiSystemComparison", "technicalAppendix"]),
        system: sysId,
        relevantSections: ["multiSystemComparison", "technicalAppendix"],
        evidenceIds: ["AYANAMSHA_LAHIRI_KP", "HOUSE_CUSPS_PLACIDUS", "KP_CUSP_SUB_LORD_10", "KP_CUSP_SUB_LORD_7", "KP_CUSP_SUB_LORD_1", "MATERIAL_DIFFERENCE_CLASSIFIER"],
        dataUsed: [
          `Lahiri Ayanamsha: ${comp.ayanamsha.lahiriFormatted}`,
          `KP Ayanamsha: ${comp.ayanamsha.kpFormatted}`,
          `Ayanamsha Difference: ${comp.ayanamsha.diffFormatted}`,
          `KP 10th Sub-Lord: ${comp.tenthSubLord || "Not calculated"}`
        ],
        status: "REPORT_SUPPORTED",
        limitations: []
      };
    }

    const kpData = getKPData(context);
    const kpSubLords = kpData.subLords || {};
    const tenthSubLord = kpSubLords.cusp_10 || kpSubLords[10] || kpSubLords["10"] || kpSubLords["tenth"] || (kpData.cusps || []).find(c => c.house === 10)?.subLord || null;
    const h10 = (context.chart.bhavasDetailed || []).find(b => b.num === 10) || {};
    const tenthLord = h10.lordName || h10.lord || null;
    const subLordDisplayEn = tenthSubLord || "Not calculated";
    const subLordDisplayTa = tenthSubLord ? toTamilPlanet(tenthSubLord) : "கணக்கிடப்படவில்லை";
    const lordDisplayEn = tenthLord || "Not calculated";
    const lordDisplayTa = tenthLord ? toTamilPlanet(tenthLord) : "கணக்கிடப்படவில்லை";

    const bundleSystems = context.multiSystemBundle?.systems || {};
    const lahiriValNum = bundleSystems.lahiri?.ayanamshaValue ?? bundleSystems.lahiri?.ayanamsa ?? (context.system?.id === "lahiri" ? (context.chart.ayanamshaValue ?? context.chart.ayanamsa ?? null) : (context.chart.ayanamshaValue ?? context.chart.ayanamsa ?? null));
    const kpValNum = bundleSystems.kp?.ayanamshaValue ?? bundleSystems.kp?.ayanamsa ?? bundleSystems.kp?.system?.ayanamshaValue ?? (context.system?.id === "kp" ? (context.chart.ayanamshaValue ?? context.chart.ayanamsa ?? null) : null);

    const lahiriStr = typeof lahiriValNum === "number" ? `${lahiriValNum.toFixed(2)}°` : "AYANAMSHA_NOT_CALCULATED";
    const kpStr = typeof kpValNum === "number" ? `${kpValNum.toFixed(2)}°` : "AYANAMSHA_NOT_CALCULATED";
    const lahiriStrTa = typeof lahiriValNum === "number" ? `${lahiriValNum.toFixed(2)}°` : "கணக்கிடப்படவில்லை";
    const kpStrTa = typeof kpValNum === "number" ? `${kpValNum.toFixed(2)}°` : "கணக்கிடப்படவில்லை";
    const configuredHouseSystem = context.system?.houseSystem || "Whole Sign / Equal";

    body = isTamil
      ? `[அறிக்கை ஒப்பீடு] உங்கள் ஜாதகத்தில் லஹிரி (Chitrapaksha) மற்றும் கே.பி. (Krishnamurti Padhdhati) முறைகளுக்கு இடையே உள்ள முக்கிய வேறுபாடுகள்:\n\n1. அயனாம்சம்: லஹிரி முறை சித்திரபக்ஷ அயனாம்சத்தையும் (${lahiriStrTa}), கே.பி. முறை கிருஷ்ணமூர்த்தி அயனாம்சத்தையும் (${kpStrTa}) பயன்படுத்துகிறது; இரண்டும் நிரயன (Sidereal) இராசி மண்டலத்தை அடிப்படையாகக் கொண்டவை.\n2. பாவ ஆரம்ப கணிதம்: லஹிரி மரபு கட்டமைப்பில் தேர்ந்தெடுக்கப்பட்ட பாவக முறை (${configuredHouseSystem}) பயன்படுத்தப்படுகிறது; கே.பி. முறை பிளாசிடஸ் (Placidus) அரை-விகித சமன்பாட்டைப் பயன்படுத்தி 12 பாவக ஆரம்பங்களை துல்லியமாக கணக்கிடுகிறது. இதனால் சில கிரகங்கள் ராசி சக்கரத்தை விட பாவ சலித சக்கரத்தில் முந்தைய அல்லது பிந்தைய பாவகத்திற்கு மாறக்கூடும்.\n3. பலன் காணும் நெறிமுறை: லஹிரி முறையில் 10-ம் அதிபதி (${lordDisplayTa}) மற்றும் D10 தசாம்ச வர்க்க பலம் முதன்மையாக ஆராயப்படுகிறது; கே.பி. முறையில் 10-ம் பாவ உப அதிபதி (Sub-Lord: ${subLordDisplayTa}) மற்றும் 2, 6, 10, 11-ம் பாவ காரகத்துவங்கள் மூலம் தொழில் பலன்கள் முடிவெடுக்கப்படுகின்றன.\n\n[பாரம்பரிய விளக்கம்] லஹிரி முறை பராசர வர்க்க சக்கரங்கள் மற்றும் ஷட்பல வலிமைக்கு முன்னுரிமை அளிக்கிறது; கே.பி. முறை 249 உப அதிபதிகள் மற்றும் நட்சத்திர காரகத்துவங்களை மட்டுமே முதன்மையாகக் கொள்கிறது.`
      : `[Report Finding] The foundational mathematical and interpretive differences between Lahiri (Chitrapaksha) and KP (Krishnamurti Padhdhati) for your chart:\n\n1. Ayanamsha: Both systems operate in the Sidereal zodiac. Lahiri applies Chitrapaksha sidereal ayanamsha (${lahiriStr}), whereas KP applies Krishnamurti sidereal ayanamsha (${kpStr}).\n2. House Cuspal Division: Lahiri/Parashari analysis applies configured classical house division (${configuredHouseSystem}), whereas KP strictly applies Placidus semi-arc cusp division. Consequently, planets near house boundaries may shift houses in the KP Bhava Chalit chart relative to the Lahiri Rashi chart.\n3. Predictive Methodology: In Lahiri, career is evaluated via the 10th house lord (${lordDisplayEn}), mutual aspects, and D10 Dashamsha divisional chart. In KP, events depend strictly on the 10th cusp Sub-Lord (${subLordDisplayEn}) and its star lord signifying the 2, 6, 10, 11 house matrix.\n\n[Traditional Context] Lahiri emphasizes classical Vargas, Shadbala, and mutual aspects; KP relies entirely on the 249 Cuspal Sub-Lords and 4-tier house significators for binary event timing.`;

    return {
      answer: formatWithDisclaimers(body, ["multiSystemComparison", "technicalAppendix"]),
      system: sysId,
      relevantSections: ["multiSystemComparison", "technicalAppendix"],
      evidenceIds: ["AYANAMSHA_LAHIRI_KP", "HOUSE_CUSPS_PLACIDUS", "KP_CUSP_SUB_LORD_10", "HOUSE_FACT_H10"],
      dataUsed: [`Lahiri Ayanamsha: ${lahiriStr}`, `KP Ayanamsha: ${kpStr}`, "KP Placidus cusps vs Lahiri Equal Bhavas", `KP 10th Sub-Lord: ${subLordDisplayEn}`],
      status: "REPORT_SUPPORTED",
      limitations: []
    };
  }

  if (isTopHeadings) {
    body = isTamil
      ? `[அறிக்கை முடிவு] உங்கள் முழு வாழ்க்கை நுண்ணறிவு அறிக்கையில் (Full Life Intelligence Report) உள்ள 3 மிக முக்கியமான தலைப்புகள்:\n\n1. தொழில், தலைமைத்துவம் மற்றும் வாழ்வியல் சாதனை (Career & Leadership):\n• உங்கள் 10-ம் கர்ம பாவகம், தொழில் காரகர்கள் மற்றும் நடப்பு தசா சுழற்சியின் அடிப்படையில் எதிர்கால தொழில் வளர்ச்சி மற்றும் முக்கிய வாழ்வியல் மாற்றங்கள் இதில் விரிவாக ஆராயப்பட்டுள்ளன.\n\n2. இல்லற நல்வாழ்வு, திருமணம் மற்றும் உறவுகள் (Marriage & Relationships):\n• உங்கள் 7-ம் களத்திர பாவகம், நவாம்சம் (D9) மற்றும் துணைவருக்கான பொருத்தக் கூறுகள் மூலம் குடும்ப வாழ்வின் ஸ்திரத்தன்மை இதில் மதிப்பிடப்பட்டுள்ளது.\n\n3. நிதி மேலாண்மை, செல்வ வளம் மற்றும் சொத்துக்கள் (Finance & Wealth):\n• உங்கள் 2-ம் தன பாவகம், 11-ம் லாப பாவகம் மற்றும் 4-ம் சொத்து பாவக அமைப்புகள் வழியே வாழ்நாள் நிதிப் பாதுகாப்பு மற்றும் முதலீட்டு யோகங்கள் இதில் பகுப்பாய்வு செய்யப்பட்டுள்ளன.\n\n[பாரம்பரிய விளக்கம்] இந்த 3 தலைப்புகள் தனிநபர் இலக்குகள், பொருளாதார ஸ்திரத்தன்மை மற்றும் குடும்ப அமைப்பை வழிநடத்தும் முதன்மைத் தூண்களாகும்.`
      : `[Report Finding] The three most important headings in your comprehensive Life Intelligence Report are:\n\n1. Career, Leadership & Vocation (10th Bhava & Dashamsha):\n• Details your professional trajectory, leadership potential, and major karmic milestones under operating planetary cycles.\n\n2. Marriage, Family & Partnerships (7th Bhava & Navamsha D9):\n• Evaluates marital timing, compatibility patterns, and lifelong relationship dynamics.\n\n3. Finance, Wealth & Immovable Property (2nd, 11th & 4th Bhavas):\n• Analyzes wealth accumulation potential, real estate acquisition windows, and fiscal stability.\n\n[Traditional Context] These three domains form the foundational tripod of practical Jyotisha life analysis—Dharma/Karma (Career), Kama (Relationships), and Artha (Wealth).`;

    return {
      answer: formatWithDisclaimers(body, ["career", "relationships", "property"]),
      system: sysId,
      relevantSections: ["career", "relationships", "property"],
      evidenceIds: [],
      dataUsed: ["Report Structure: 17 Domains"],
      status: "REPORT_SUPPORTED",
      limitations: []
    };
  }

  const intent = route.consultationIntent || classifyConsultationIntent(cleanQ, []);
  if (!isReportQuery && hasMinChartData && intent && intent.questionType) {
    if (intent.questionType === "JOINT_VS_SEPARATE") {
      const res = evaluateJointVsSeparateResidence(context.chart);
      body = isTamil
        ? `[நேரடி பதில்] ${res.synthesisTa}\n\n[ஜோதிட காரண காரிய விளக்கம்]\n• ${res.evidenceFactors.map(f => f.text).join("\n• ")}\n\n[சாஸ்திர வழிகாட்டல்] ${res.nonAccusatoryNotice}`
        : `[Direct Answer] ${res.synthesisEn}\n\n[Astrological Reasoning]\n• ${res.evidenceFactors.map(f => f.text).join("\n• ")}\n\n[Guiding Context] ${res.nonAccusatoryNotice}`;
      return {
        answer: formatWithDisclaimers(body, ["relationships", "blueprint"]),
        system: sysId,
        relevantSections: ["relationships", "blueprint"],
        evidenceIds: (context.evidence?.evidenceIds || []).filter(id => id.startsWith("M") || id.startsWith("W")),
        dataUsed: ["4th & 2nd Bhava Root Strengths", "7th Lord Dispositor", "12th House Relocation Factors"],
        status: "REPORT_SUPPORTED",
        limitations: []
      };
    }

    if (intent.questionType === "SPOUSE_FAMILY_WEALTH") {
      const w = evaluateSpouseFamilyWealth(context.chart);
      body = isTamil
        ? `[நேரடி பதில்] ${w.verdictTa}\n\n[ஜோதிட காரண காரிய விளக்கம்]\n• ${w.evidenceFactors.map(f => f.text).join("\n• ")}`
        : `[Direct Answer] ${w.verdictEn}\n\n[Astrological Reasoning]\n• ${w.evidenceFactors.map(f => f.text).join("\n• ")}`;
      return {
        answer: formatWithDisclaimers(body, ["relationships", "property"]),
        system: sysId,
        relevantSections: ["relationships", "property"],
        evidenceIds: (context.evidence?.evidenceIds || []).filter(id => id.startsWith("M") || id.startsWith("W")),
        dataUsed: ["8th House (2nd from 7th) Treasury", "2nd Bhava Dhana Sthana", "Venus & Jupiter Dignity"],
        status: "REPORT_SUPPORTED",
        limitations: []
      };
    }

    if (intent.questionType === "SPOUSE_DISTANCE") {
      const d = evaluateSpouseGeographicDistance(context.chart);
      body = isTamil
        ? `[நேரடி பதில்] பாரம்பரிய நிலவியல் அமைப்பின்படி, துணை அமையும் தூரம் தோராயமாக ${d.estimatedBandTa} வரம்பில் சுட்டிக்காட்டப்படுகிறது.\n\n[ஜோதிட காரண காரிய விளக்கம்] ${d.caveat}`
        : `[Direct Answer] Traditional geographic indicators suggest a connection situated within ${d.estimatedBand}.\n\n[Astrological Reasoning] ${d.caveat}`;
      return {
        answer: formatWithDisclaimers(body, ["relationships", "blueprint"]),
        system: sysId,
        relevantSections: ["relationships", "blueprint"],
        evidenceIds: (context.evidence?.evidenceIds || []).filter(id => id.startsWith("M")),
        dataUsed: ["7th House Dual Sign Ratios", "9th & 12th Relocation Distance Indicators"],
        status: "REPORT_SUPPORTED",
        limitations: []
      };
    }

    if (intent.questionType === "SPOUSE_DIRECTION") {
      const dir = evaluateSpouseDirection(context.chart);
      if (!dir || !dir.primaryDirection || dir.confidenceCategory === "INSUFFICIENT_DATA") {
        body = isTamil
          ? `[நேரடி பதில்] துணை அமையக்கூடிய திசையைக் கணக்கிட தேவையான 7-ம் பாவக மற்றும் சுக்கிரனின் கிரகத் தரவுகள் போதிய அளவில் கிடைக்கவில்லை (INSUFFICIENT_DATA).\n\n[ஜோதிட காரண காரிய விளக்கம்] 7-ம் பாவக அதிபதி மற்றும் காரகக் கிரகங்களின் திசை ஒருங்கிணைவு கணக்கிடப்பட முடியாததால் ஊகங்கள் தவிர்க்கப்படுகின்றன.`
          : `[Direct Answer] Sufficient chart indicators (7th house and Venus) are not available to determine spouse direction deterministically (INSUFFICIENT_DATA).\n\n[Astrological Reasoning] Directional convergence cannot be established without verified 7th house and Venus placements.`;
        return {
          answer: formatWithDisclaimers(body, ["relationships", "blueprint"]),
          system: sysId,
          relevantSections: ["relationships", "blueprint"],
          evidenceIds: [],
          dataUsed: ["INSUFFICIENT_DATA"],
          status: "INSUFFICIENT_DATA",
          limitations: ["Incomplete directional indicators"]
        };
      }
      body = isTamil
        ? `[நேரடி பதில்] உங்கள் பூர்வீகம் அல்லது வசிப்பிடத்திலிருந்து ${dir.directionTa} (${dir.directionName}) திசையில் துணை அமைய சாதகமான கிரக அமைப்புகள் உள்ளன.\n\n[ஜோதிட காரண காரிய விளக்கம்] ${dir.explanation}`
        : `[Direct Answer] Primary directional indicators point predominantly towards the ${dir.directionName} (${dir.directionTa}) zone from your birth/residence place.\n\n[Astrological Reasoning] ${dir.explanation}`;
      return {
        answer: formatWithDisclaimers(body, ["relationships", "blueprint"]),
        system: sysId,
        relevantSections: ["relationships", "blueprint"],
        evidenceIds: (context.evidence?.evidenceIds || []).filter(id => id.startsWith("M")),
        dataUsed: ["7th Lord & Shukra Quadrant Alignment", "D9 Navamsha 7th Cusp"],
        status: "REPORT_SUPPORTED",
        limitations: []
      };
    }

    if (intent.questionType === "GEMSTONE_PRESCRIPTION" || (isRemedies && !isRelationships && !isCareer)) {
      const g = evaluateGemstoneRemedies(context.chart);
      body = isTamil
        ? `[நேரடி பதில்] ${g.directAnswerTa}\n\n[சாஸ்திர ரத்தின வழிகாட்டல்]\n• முதன்மை பரிந்துரை: ${cleanEnglishParentheses(g.primaryGemstone)} (${g.finger} விரலில் ${g.metal} உலோகத்தில் அணியவும்).\n• தவிர்க்க வேண்டியவை: ${g.contraindicatedSummaryTa}\n\n[சுலோகம் & உபாசனை] ${g.mantra}`
        : `[Direct Answer] ${g.directAnswerEn}\n\n[Gemological Shastric Guidelines]\n• Primary Recommendation: ${g.primaryGemstone} on ${g.finger} mounted in ${g.metal}.\n• Contraindicated Stones: ${g.contraindicatedSummaryEn}\n\n[Mantra & Sadhana] ${g.mantra}`;
      return {
        answer: formatWithDisclaimers(body, ["remedies"]),
        system: sysId,
        relevantSections: ["remedies"],
        evidenceIds: (context.evidence?.evidenceIds || []).filter(id => id.startsWith("M") || id.startsWith("Y")),
        dataUsed: ["Lagna Lord Gemological Placement", "Trik House Contraindications"],
        status: "REPORT_SUPPORTED",
        limitations: []
      };
    }

    // Check if query is specifically targeting Saturn/Planet influence or a Target Year or Specific House
    const isSaturnSpecific = route.isSaturnDelay || 
      (route.targetPlanet === "Saturn" && /delay|slow|obstacle|timing|why|10th|career|தாக்கம்|தாமத|ஏன்|செல்வாக்கு|காரணம்|10-ம்|தொழில்/i.test(qLower)) || 
      /why\s+(is\s+)?saturn|why\s+saturn|saturn.*(delay|influence|10th)|சனி.*(ஏன்|தாக்கம்|செல்வாக்கு|தாமத)/i.test(qLower);
    
    const queryTargetYear = route.targetYear || (qLower.match(/\b(20\d\d)\b/) ? parseInt(qLower.match(/\b(20\d\d)\b/)[1], 10) : null);
    const isYearSpecific = Boolean(queryTargetYear && (cleanQ.trim().length <= 20 || /^\s*(\b20\d\d\b|\bwhat\s+about\s+20\d\d\b|\bhow\s+about\s+20\d\d\b|\bin\s+20\d\d\b)/i.test(cleanQ) || (!hasCareerQuery && !hasMarriageQuery && !hasHealthQuery)));

    if (!isSaturnSpecific && !isYearSpecific && !route.targetHouse) {
      // For general consultation questions in QUESTION_ONTOLOGY
      const consult = generateAstrologerConsultation(context.chart, cleanQ, { lang: isTamil ? "ta" : "en", depth: "ASTROLOGER_MODE" });
      if (consult && consult.directAnswer) {
        const sec4 = consult.sections.find(s => s.sectionNumber === 4)?.content || "";
        const sec5 = consult.sections.find(s => s.sectionNumber === 5)?.content || "";
        const sec6 = consult.sections.find(s => s.sectionNumber === 6)?.content || "";
        const sec14 = consult.sections.find(s => s.sectionNumber === 14)?.content || "";

        body = isTamil
          ? `[நேரடி பதில்] ${consult.directAnswer}\n\n[ஜன்ம ஜாதக யோக வாக்குறுதி] ${sec4 || sec5}\n\n[தசா புக்தி மற்றும் காலக்கோடு] ${sec6 || `நடப்பு தசா சுழற்சி: ${toTamilPlanet(curDasha) || "தசை"}`}${sec14 ? `\n\n[சாஸ்திர வழிகாட்டல்] ${sec14}` : ""}`
          : `[Direct Answer] ${consult.directAnswer}\n\n[Natal Promise & Astrological Reasoning] ${sec4 || sec5}\n\n[Timing Windows & Dasha Triggers] ${sec6 || `Active Dasha: ${curDasha || "Dasha"}`}${sec14 ? `\n\n[Guidance & Actionable Advice] ${sec14}` : ""}`;

        let domainSections = ["execSummary", "blueprint"];
        let domainData = [`Calculated ${sysName} Natal Promise`, `Vimshottari Dasha Activation`, `18-Domain Consultation Matrix`];

        if (intent.domain === "HEALTH") {
          domainSections = ["wellness", "blueprint"];
          domainData = ["1st, 6th & 8th Bhava Vitality Analysis", "D30 Trimsamsha & Health Karakas", `Vimshottari Dasha (${curDasha})`];
        } else if (intent.domain === "CAREER") {
          domainSections = ["career", "blueprint"];
          domainData = ["10th & 11th Bhava Career Alignment", "D10 Dashamsha Authority Indicators", `Vimshottari Dasha (${curDasha})`];
        } else if (intent.domain === "WEALTH") {
          domainSections = ["wealth", "blueprint"];
          domainData = ["2nd & 11th Bhava Dhana Analysis", "D4 Chaturthamsha Real Estate Potential", `Vimshottari Dasha (${curDasha})`];
        } else if (intent.domain === "MARRIAGE") {
          domainSections = ["relationships", "blueprint"];
          domainData = ["7th Bhava & Upapada Lagna Alignment", "D9 Navamsha Matrimonial Harmony", `Vimshottari Dasha (${curDasha})`];
        } else if (intent.domain === "EDUCATION") {
          domainSections = ["education", "blueprint"];
          domainData = ["4th & 5th Bhava Vidya Analysis", "D24 Siddhamsa Academic Indicators", `Vimshottari Dasha (${curDasha})`];
        } else if (intent.domain === "RELOCATION") {
          domainSections = ["travel", "blueprint"];
          domainData = ["9th & 12th Bhava Foreign Travel Indicators", `Vimshottari Dasha (${curDasha})`];
        }

        const finalSections = relevantSections.length > 0 ? relevantSections : domainSections;
        return {
          answer: formatWithDisclaimers(body, finalSections),
          system: sysId,
          relevantSections: finalSections,
          evidenceIds: (context.evidence?.evidenceIds || []).slice(0, 6),
          dataUsed: domainData,
          status: "REPORT_SUPPORTED",
          limitations: []
        };
      }
    }
  }

  // 1. Saturn Delay & Karmic Timing Analysis
  if (route.isSaturnDelay || (route.targetPlanet === "Saturn" && /delay|slow|obstacle|timing|why|10th|career|தாக்கம்|தாமத|ஏன்|செல்வாக்கு|காரணம்|10-ம்|தொழில்/i.test(qLower)) || /why\s+(is\s+)?saturn|why\s+saturn|saturn.*(delay|influence|10th)|சனி.*(ஏன்|தாக்கம்|செல்வாக்கு|தாமத)/i.test(qLower)) {
    const saturn = (context.chart.planets || []).find(p => p.name === "Saturn");
    const saturnShad = (context.chart.shadbala || []).find(s => s.planet === "Saturn");
    const satVirupas = saturnShad ? Math.round(saturnShad.virupas || saturnShad.totalRupas || 0) : null;
    const satHouse = saturn?.house ?? (saturn ? "natal" : null);
    const satSign = saturn?.sign || "Capricorn/Aquarius";
    const satDignity = saturn?.dignity || "Neutral";
    const satRetro = saturn?.isRetrograde ? (isTamil ? ", வக்ர நிலை" : ", Retrograde") : "";
    const satDeg = typeof saturn?.degree === "number" ? (isTamil ? formatTamilDegree(saturn.degree) : ` at ${saturn.degree.toFixed(2)}°`) : "";

    const factPart = saturn
      ? (isTamil 
          ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் சனி பகவான் ${satHouse}-ம் பாவகத்தில் ${toTamilRasi(satSign)} ராசியில் (${toTamilDignity(satDignity)}${satRetro}${satDeg}) அமர்ந்துள்ளார்${satVirupas ? `, ஷட்பல பலம்: ${satVirupas} விரூபங்கள்` : ""}.`
          : `[Report Finding] In your calculated ${sysName} chart, Saturn is positioned in House ${satHouse} in ${satSign} (${satDignity}${satRetro}${satDeg})${satVirupas ? ` with a verified Shadbala strength of ${satVirupas} virupas` : ""}.`)
      : (isTamil 
          ? `[அறிக்கை முடிவு] சனி பகவானின் கர்ம காரகத்துவம் உங்கள் ஜாதகக் கணிதத்தில் ஆராயப்பட்டுள்ளது.`
          : `[Report Finding] Saturn's portfolio as Ayushkaraka and Karmakaraka is evaluated in your calculated report.`);

    body = isTamil
      ? `${factPart}\n\n[பாரம்பரிய சாஸ்திர விளக்கம்] பராசர ஹோரா சாஸ்திர விதிகளின்படி, சனி பகவான் கர்ம காரகனாகவும் காலத்தின் அதிபதியாகவும் (சனைச்சரன் - மெதுவாக நகர்பவர்) விளங்குகிறார். சனி பகவான் எந்த ஒரு நற்பலனையும் நிரந்தரமாக மறுப்பதில்லை; மாறாக, அவசர வெற்றிகளுக்குப் பதிலாக மனப்பக்குவம், ஒழுக்கம், கடுமையான உழைப்பு மற்றும் முதிர்ச்சியை சோதித்து காலதாமதத்திற்குப் பின் நீடித்த வெற்றியைத் தருகிறார். உங்கள் 10-ம் பாவகம் மற்றும் தொழில் மீது சனியின் செல்வாக்கு அமைந்தால், ஆரம்ப காலத்தில் சவால்களும் தாமதங்களும் தோன்றினாலும், விடாமுயற்சியால் கட்டமைக்கப்படும் தொழில் அடித்தளம் பிற்காலத்தில் அசைக்க முடியாத அதிகாரத்தையும் மதிப்பையும் வழங்கும்.`
      : `${factPart}\n\n[Traditional Astrological Context] Under classical Parashari principles, Saturn (Shani/Sanaischara) is the prime significator of karma, labor, endurance, and longevity (Karmakaraka & Ayushkaraka). Classical astrology emphasizes that Saturn never denies what is legitimately promised; rather, it delays fruition to enforce discipline, eradicate complacency, and test structural integrity. When Saturn influences the 10th house or career timing, early endeavors demand relentless perseverance and humility. The foundational milestones matured under Saturn's gaze ultimately yield enduring authority, professional resilience, and lifelong stability.`;

    return {
      answer: body,
      system: sysId,
      relevantSections: ["career", "blueprint", "technicalAppendix"],
      evidenceIds,
      dataUsed: [`Calculated ${sysName} Saturn Placement`, `House ${satHouse} Lordship & Dignity`],
      status: "REPORT_SUPPORTED",
      limitations: []
    };
  }

  // 2. Target Year Timing & Dasha Crossings (e.g. 2027)
  const targetYr = route.targetYear || (qLower.match(/\b(20\d\d)\b/) ? parseInt(qLower.match(/\b(20\d\d)\b/)[1], 10) : null);
  if (targetYr && !hasRemediesQuery && !hasHealthQuery && (!hasMarriageQuery || relevantSections.includes("timeline"))) {
    const stages = context.chart.timeline?.stages 
      || context.chart.chronologicalDashaTimeline?.stages 
      || context.chart.vimshottariCycleTimeline?.stages 
      || (Array.isArray(context.chart.timeline) ? context.chart.timeline : [])
      || (Array.isArray(context.chart.chronologicalDashaTimeline) ? context.chart.chronologicalDashaTimeline : []);

    const matchedStage = stages.find(s => {
      if (s.calendarYears && s.calendarYears.includes(String(targetYr))) return true;
      if (s.calendarYears) {
        const parts = s.calendarYears.split(/[-–—to]+/).map(y => parseInt(y.trim().replace(/\D/g, ""), 10));
        if (parts[0] && parts[1] && targetYr >= parts[0] && targetYr <= parts[1]) return true;
      }
      if (s.startYear && s.endYear && targetYr >= s.startYear && targetYr <= s.endYear) return true;
      return false;
    });

    const timingWins = getTimingWindows(context).filter(w => {
      if (w.years && w.years.includes(String(targetYr))) return true;
      if (w.years) {
        const parts = w.years.split(/[-–—to]+/).map(y => parseInt(y.trim().replace(/\D/g, ""), 10));
        if (parts[0] && parts[1] && targetYr >= parts[0] && targetYr <= parts[1]) return true;
      }
      return false;
    });

    // Check dashaTable if matchedStage is still null
    let dashaInfoForYear = null;
    const birthYr = context.chart.birthYear || (context.profile?.birthDate ? parseInt(String(context.profile.birthDate).slice(0, 4), 10) : null);
    const nativeAge = birthYr ? targetYr - birthYr : null;
    if (context.chart.dashaTable && Array.isArray(context.chart.dashaTable)) {
      dashaInfoForYear = context.chart.dashaTable.find(d => {
        if (d.startDate && d.endDate) {
          const sYr = parseInt(String(d.startDate).slice(0, 4), 10);
          const eYr = parseInt(String(d.endDate).slice(0, 4), 10);
          if (sYr && eYr && targetYr >= sYr && targetYr <= eYr) return true;
        }
        if (nativeAge !== null && typeof d.startAge === "number" && typeof d.endAge === "number") {
          if (nativeAge >= d.startAge && nativeAge <= d.endAge) return true;
        }
        return false;
      });
    }

    const stageTitle = matchedStage?.title ? (isTamil ? ` "${cleanEnglishParentheses(matchedStage.title)}"` : ` "${matchedStage.title}"`) : (matchedStage?.primaryTheme ? (isTamil ? ` "${cleanEnglishParentheses(matchedStage.primaryTheme)}"` : ` "${matchedStage.primaryTheme}"`) : "");
    const dashaTrig = matchedStage?.dashaTrigger 
      ? (isTamil ? ` (${cleanEnglishParentheses(matchedStage.dashaTrigger)})` : ` (${matchedStage.dashaTrigger})`)
      : (dashaInfoForYear ? (isTamil ? ` (${toTamilPlanet(dashaInfoForYear.lord)} மகா தசை)` : ` (${dashaInfoForYear.lord} Mahadasha)`) : (curDasha ? (isTamil ? ` (${toTamilPlanet(curDasha)} தசை)` : ` (${curDasha} Dasha)`) : ""));
    
    const domainTaMap = { career: "தொழில்", marriage: "திருமணம்", relationships: "திருமணம்/கூட்டுறவு", health: "ஆரோக்கியம்", property: "சொத்து/வாகனம்", wealth: "தன யோகம்", education: "கல்வி", studies: "கல்வி", foreign: "வெளிநாட்டு பயணம்" };
    const winDesc = timingWins.length > 0 ? timingWins.map(w => `${isTamil ? (domainTaMap[w.domain] || w.domain) : w.domain}: ${w.years}`).join("; ") : "";
    const ageNote = nativeAge !== null ? (isTamil ? ` (ஜாதகர் வயது ~${nativeAge})` : ` (native age ~${nativeAge})`) : "";

    body = isTamil
      ? `[அறிக்கை முடிவு] உங்கள் காலக்கோடு கணிதத்தின்படி, ${targetYr}-ம் ஆண்டு${ageNote} ${stageTitle}${dashaTrig} காலக்கட்டத்தின் கீழ் வருகிறது.${winDesc ? ` முக்கிய ஒருமுக கணிப்பு சாளரங்கள்: ${winDesc}.` : ""}\n\n[பாரம்பரிய விளக்கம்] விம்சோத்தரி தசா அமைப்பில், இந்த காலகட்டம் கிரகங்களின் தசா-அந்தர்தசா பலன்களை இயக்கும் முக்கிய மாற்றுக் கட்டமாகும். கோச்சார குரு மற்றும் சனியின் பெயர்ச்சிகள் இந்த ஆண்டில் தொழில் மற்றும் குடும்பப் பொறுப்புகளை புதிய தளத்திற்கு உயர்த்த வழிவகை செய்கின்றன.`
      : `[Report Finding] According to your chronological timeline calculation, the year ${targetYr}${ageNote} aligns with life stage${stageTitle}${dashaTrig}.${winDesc ? ` Active domain timing windows: ${winDesc}.` : ""}\n\n[Traditional Context] Under Vimshottari Dasha mechanics, the year ${targetYr} activates key planetary sub-periods supported by major transit crossings. Classical methodology indicates this phase catalyzes long-term commitments, structural professional realignment, and strategic progression in the active bhava domains.`;

    return {
      answer: body,
      system: sysId,
      relevantSections: ["timeline", "career"],
      evidenceIds,
      dataUsed: [`Timeline Stage for ${targetYr}`, `Vimshottari Dasha Calendar`],
      status: "REPORT_SUPPORTED",
      limitations: []
    };
  }

  // 3. Specific House Deep Dive (1st to 12th house)
  if (route.targetHouse) {
    const hNum = route.targetHouse;
    const bhavas = context.report.activeSectionData?.bhavasDetailed || context.chart.bhavasDetailed || [];
    const h = bhavas.find(b => b.num === hNum);
    if (h) {
      const bhavaSign = h.signName || h.sign || "";
      const bhavaLord = h.lordName || h.lord || "";
      const bhavaDignity = h.lordDignity || "";
      const bhavaPred = h.prediction || h.summary || "";

      body = isTamil
        ? `[அறிக்கை முடிவு] உங்கள் ${hNum}-ம் பாவகம் (${toTamilRasi(bhavaSign)}) அதிபதி ${toTamilPlanet(bhavaLord)} (${toTamilDignity(bhavaDignity)}). ${bhavaPred ? `அறிக்கை கணிப்பு: "${cleanEnglishParentheses(bhavaPred)}".` : ""}\n\n[பாரம்பரிய விளக்கம்] பராசர விதிகளின்படி ${hNum}-ம் பாவகம் ஜாதகரின் முக்கிய வாழ்வியல் துறைகளை நிர்வகிக்கிறது. பாவாதிபதியின் பலமும் பாவகத்தில் அமர்ந்துள்ள கிரகங்களின் நிலையும் இதன் முழு பலனை தீர்மானிக்கின்றன.`
        : `[Report Finding] Your House ${hNum} (${bhavaSign}) is governed by lord ${bhavaLord} (${bhavaDignity}). ${bhavaPred ? `Report Analysis: "${bhavaPred}".` : ""}\n\n[Traditional Context] Under classical Parashari principles, Bhava ${hNum} governs core life dimensions. The strength and dignity of ${bhavaLord} along with natal occupants determine how this house manifests throughout your life cycle.`;

      return {
        answer: body,
        system: sysId,
        relevantSections: ["bhavas"],
        evidenceIds,
        dataUsed: [`House ${hNum} Ephemeris Placement`, `Lord ${bhavaLord} Dignity`],
        status: "REPORT_SUPPORTED",
        limitations: []
      };
    }
  }

  // 4. Specific Target Planet Analysis
  if (route.targetPlanet) {
    const plName = route.targetPlanet;
    const pl = (context.chart.planets || []).find(p => p.name.toLowerCase() === plName.toLowerCase());
    const plShad = (context.chart.shadbala || []).find(s => s.planet?.toLowerCase() === plName.toLowerCase());
    const plVirupas = plShad ? Math.round(plShad.virupas || plShad.totalRupas || 0) : null;
    const plHouse = pl?.house ?? "natal";
    const plSign = pl?.sign || "natal";
    const plDignity = pl?.dignity || "Neutral";
    const plRetro = pl?.isRetrograde ? (isTamil ? ", வக்ரம்" : ", Retrograde") : "";
    const plDeg = typeof pl?.degree === "number" ? (isTamil ? formatTamilDegree(pl.degree) : ` at ${pl.degree.toFixed(2)}°`) : "";

    if (pl) {
      body = isTamil
        ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் ${toTamilPlanet(plName)} ${plHouse}-ம் பாவகத்தில் ${toTamilRasi(plSign)} ராசியில் (${toTamilDignity(plDignity)}${plRetro}${plDeg}) அமர்ந்துள்ளார்${plVirupas ? `, ஷட்பல பலம்: ${plVirupas} விரூபங்கள்` : ""}.\n\n[பாரம்பரிய விளக்கம்] ${toTamilPlanet(plName)} கிரகத்தின் காரகத்துவங்கள் மற்றும் அது ஆட்சி செய்யும் பாவகங்கள் உங்கள் ஜாதகத்தில் முக்கிய பங்கு வகிக்கின்றன. அதன் பலம் மற்றும் பார்வை நிலைகள் தொடர்புடைய வாழ்க்கை அம்சங்களை செழுமைப்படுத்துகின்றன.`
        : `[Report Finding] In your calculated chart, ${plName} is positioned in House ${plHouse} in ${plSign} (${plDignity}${plRetro}${plDeg})${plVirupas ? ` with a Shadbala strength of ${plVirupas} virupas` : ""}.\n\n[Traditional Context] Under ${sysName} principles, ${plName} governs specific psychological drives and house portfolios in your chart. Its dignity and strength determine the ease and efficacy with which its natural significations unfold.`;

      return {
        answer: body,
        system: sysId,
        relevantSections: ["blueprint", "technicalAppendix"],
        evidenceIds,
        dataUsed: [`Calculated ${plName} Placement`, `Shadbala Metrics`],
        status: "REPORT_SUPPORTED",
        limitations: []
      };
    }
  }

  // 5. Operating Dasha & Timing Cycle Analysis (only for general dasha queries, not specific domain queries)
  if (route.isDashaQuery && !hasCareerQuery && !hasMarriageQuery && !hasHealthQuery && !hasPropertyQuery && !hasStudiesQuery && !hasRemediesQuery && (curDasha || context.chart.currentDasha)) {
    const cd = context.chart.currentDasha || {};
    const dLord = cd.lord || curDasha;
    const dSub = cd.subLord || curSub || "";
    const ageSpan = cd.startAge && cd.endAge ? (isTamil ? ` (வயது ${cd.startAge} முதல் ${cd.endAge} வரை)` : ` (Ages ${cd.startAge} to ${cd.endAge})`) : "";
    const balStr = cd.balanceYears ? (isTamil ? ` (பிறப்பில் இருப்பு: ${cd.balanceYears} ஆண்டுகள்)` : ` (Balance at birth: ${cd.balanceYears} years)`) : "";

    body = isTamil
      ? `[அறிக்கை முடிவு] உங்கள் நடப்பு விம்சோத்தரி காலக்கட்டம் ${toTamilPlanet(dLord)} மகா தசை${dSub ? ` - ${toTamilPlanet(dSub)} புக்தி` : ""}${ageSpan}${balStr} ஆகும்.\n\n[பாரம்பரிய விளக்கம்] விம்சோத்தரி தசா அமைப்பின்படி, நடப்பு தசா நாதனின் ஆதிபத்தியம் மற்றும் அதன் காரகத்துவங்கள் உங்கள் தற்போதைய வாழ்க்கை நிகழ்வுகளையும் முன்னுரிமைகளையும் வழிநடத்துகின்றன. இந்த காலக்கட்டத்தில் தசா நாதனுக்குரிய நற்பண்புகளையும் கடமைகளையும் சீராக கடைப்பிடிப்பது சுப பலன்களைப் பெருக்கும்.`
      : `[Report Finding] Your active Vimshottari planetary period is ${dLord} Mahadasha${dSub ? ` — ${dSub} Antardasha` : ""}${ageSpan}${balStr}.\n\n[Traditional Context] Classical Vimshottari principles dictate that the operating Mahadasha lord awakens the specific houses it rules and occupies in your natal chart. Life themes during this cycle center around consolidating the karma and responsibilities governed by ${dLord}.`;

    return {
      answer: body,
      system: sysId,
      relevantSections: ["timeline"],
      evidenceIds,
      dataUsed: [`Current Vimshottari Dasha: ${dLord}`],
      status: "REPORT_SUPPORTED",
      limitations: []
    };
  }

  if (isRemedies) {
    const rem = context.report.remedies;
    if (!rem?.primaryGemstone && !rem?.mantra) {
      return {
        answer: isTamil
          ? `தனிப்பயனாக்கப்பட்ட பரிகாரங்கள் உங்கள் அறிக்கையில் கிடைக்கவில்லை.`
          : `Personalized remedies are not available in the calculated report context.`,
        system: sysId,
        relevantSections: ["remedies"],
        evidenceIds: [],
        dataUsed: ["Remedies check"],
        status: "INSUFFICIENT_DATA",
        limitations: ["Remedies absent."]
      };
    }

    const gemNote = rem.primaryGemstone
      ? (isTamil
          ? `பரிந்துரைக்கப்படும் முதன்மை ரத்தினம்: ${cleanEnglishParentheses(rem.primaryGemstone)} (கிரக அதிபதி: ${cleanEnglishParentheses(rem.gemLord) || 'லக்னாதிபதி'}).`
          : `Prescribed primary gemstone: ${rem.primaryGemstone} (ruled by ${rem.gemLord || 'Ascendant lord'}).`)
      : "";

    const formatContraItem = (g) => {
      if (typeof g === "string") return isTamil ? cleanEnglishParentheses(g) : g;
      if (g && typeof g === "object") {
        const name = isTamil ? cleanEnglishParentheses(g.gemstone || g.name || "") : (g.gemstone || g.name || "");
        if (isTamil) {
          const reason = g.reason ? ` (${cleanEnglishParentheses(g.reason)})` : (g.lord ? ` (${toTamilPlanet(g.lord)})` : "");
          return `${name}${reason}`.trim();
        } else {
          const reason = g.reason ? ` (${g.reason})` : (g.lord ? ` (${g.lord})` : "");
          return `${name}${reason}`.trim();
        }
      }
      return String(g);
    };

    const contraList = (rem.contraindicatedGemstones || []).map(formatContraItem).filter(Boolean);

    // Direct answer if user asked specifically about a contraindicated stone
    const specificContra = (rem.contraindicatedGemstones || []).find(g => {
      const gName = (typeof g === "string" ? g : (g?.gemstone || g?.name || "")).toLowerCase();
      const gLord = (typeof g === "object" ? (g?.lord || "") : "").toLowerCase();
      const words = gName.split(/[\s(),\/\-]+/).filter(w => w.length > 2);
      return words.some(w => qLower.includes(w)) || (gLord && qLower.includes(gLord));
    });

    let specificContraExplanation = "";
    if (specificContra && typeof specificContra === "object") {
      const sName = isTamil ? cleanEnglishParentheses(specificContra.gemstone || specificContra.name || "") : (specificContra.gemstone || specificContra.name || "");
      const sReason = specificContra.reason || "";
      const sLord = specificContra.lord || "";
      if (isTamil) {
        specificContraExplanation = ` ${sName} ரத்தினம் உங்கள் ஜாதகத்திற்கு தவிர்க்கப்பட வேண்டும், ஏனெனில் ${cleanEnglishParentheses(sReason) || `${toTamilPlanet(sLord)} கிரகம் சாதகமற்ற ஸ்தான அதிபதியாக உள்ளது`}.`;
      } else {
        specificContraExplanation = ` ${sName} is contraindicated because ${sReason || `it is ruled by ${sLord}, which governs unsupportive houses`}.`;
      }
    }

    const contraNote = contraList.length > 0
      ? (isTamil ? ` தவிர்க்க வேண்டிய ரத்தினங்கள்: ${contraList.join(", ")}.` : ` Contraindicated gemstones to avoid: ${contraList.join(", ")}.`)
      : "";
    const manNote = rem.mantra
      ? (isTamil ? ` பரிந்துரைக்கப்படும் மந்திரம்: ${rem.mantra}.` : ` Supportive mantra: ${rem.mantra}.`)
      : "";
    const prefix = isTamil ? "[அறிக்கை முடிவு]" : "[Report Finding]";
    body = `${prefix} ${gemNote}${specificContraExplanation}${contraNote}${manNote}`;

  } else if (isRelationships) {
    const marrVerdict = context.report.marriage?.verdict || context.report.activeSectionData?.marriageVerdict;
    const d9Data = getD9Data(context);
    const d9Asc = d9Data?.ascendant;
    const marrWindows = context.report.marriage?.windows || context.report.activeSectionData?.marriageWindows || [];

    if (!marrVerdict && !d9Asc && marrWindows.length === 0 && (!context.chart.bhavasDetailed || context.chart.bhavasDetailed.length === 0)) {
      return {
        answer: isTamil
          ? `திருமண மற்றும் கூட்டுறவு பற்றிய விவரமான கணிப்புகள் உங்கள் அறிக்கையில் கிடைக்கவில்லை.`
          : `Detailed relationship and partnership findings are not available in the calculated report context.`,
        system: sysId,
        relevantSections: ["relationships"],
        evidenceIds: [],
        dataUsed: ["Relationship domain check"],
        status: "INSUFFICIENT_DATA",
        limitations: ["No marriage pathway data calculated in report."]
      };
    }

    const h7 = (context.chart.bhavasDetailed || []).find(b => b.num === 7);
    const venPl = (context.chart.planets || []).find(p => p.name === "Venus");
    const jupPl = (context.chart.planets || []).find(p => p.name === "Jupiter");

    const reportFactPart = marrVerdict
      ? (isTamil ? `[அறிக்கை முடிவு] "${cleanEnglishParentheses(marrVerdict)}".` : `[Report Finding] "${marrVerdict}".`)
      : (isTamil 
          ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் திருமணக் கூறுகள்: 7-ம் களத்திர பாவகம் (${toTamilRasi(h7?.signName) || 'ராசி'}, அதிபதி: ${toTamilPlanet(h7?.lordName) || 'அதிபதி'}). களத்திர காரகனான சுக்கிரன் ${toTamilRasi(venPl?.sign) || 'ராசி'} ராசியிலும், மங்கல காரகனான குரு ${toTamilRasi(jupPl?.sign) || 'ராசி'} ராசியிலும் அமர்ந்துள்ளனர்.`
          : `[Report Finding] Relationship indicators in your chart: 7th House of Partnerships in ${h7?.signName || 'sign'} (Lord: ${h7?.lordName || 'lord'}). Kalathrakaraka Venus is in ${venPl?.sign || 'sign'} and Mangalakaraka Jupiter is in ${jupPl?.sign || 'sign'}.`);

    const d9Note = d9Asc
      ? (isTamil ? ` நவாம்சம் (D9) லக்னம் ${toTamilRasi(d9Asc)} ராசியில் அமைந்துள்ளது.` : ` Navamsha (D9) ascendant is positioned in ${d9Asc}.`)
      : "";
    const winNote = marrWindows.length > 0 && marrWindows[0].years
      ? (isTamil ? ` சாதகமான மங்கல காலம்: ${marrWindows[0].years}.` : ` Favorable timing phase: ${marrWindows[0].years}.`)
      : "";

    body = isTamil
      ? `${reportFactPart}\n\n[பாரம்பரிய விளக்கம்] உங்கள் ${sysName} அறிக்கையின்படி, திருமண மற்றும் கூட்டுறவு ஆய்வு 7-ம் பாவகத்தை அடிப்படையாகக் கொண்டது.${d9Note}${winNote}`
      : `${reportFactPart}\n\n[Traditional Context] According to classical ${sysName} methodology, partnership matters are evaluated via the 7th house and karakas.${d9Note}${winNote}`;

  } else if (isCareer) {
    const careerVerdict = context.report.career?.destiny || context.report.activeSectionData?.careerDestinyVerdict;
    const d10Data = getD10Data(context);
    const d10Asc = d10Data?.ascendant;
    const careerWindows = context.report.career?.windows || context.report.activeSectionData?.careerWindows || [];

    if (!careerVerdict && !d10Asc && careerWindows.length === 0 && (!context.chart.bhavasDetailed || context.chart.bhavasDetailed.length === 0)) {
      return {
        answer: isTamil
          ? `தொழில் துறை பற்றிய விவரமான கணிப்புகள் உங்கள் அறிக்கையில் கிடைக்கவில்லை.`
          : `Detailed career trajectory findings are not available in the calculated report context.`,
        system: sysId,
        relevantSections: ["career"],
        evidenceIds: [],
        dataUsed: ["Career domain check"],
        status: "INSUFFICIENT_DATA",
        limitations: ["No career pathway data calculated in report."]
      };
    }

    const h10 = (context.chart.bhavasDetailed || []).find(b => b.num === 10);
    const satPl = (context.chart.planets || []).find(p => p.name === "Saturn");
    const sunPl = (context.chart.planets || []).find(p => p.name === "Sun");

    const reportFactPart = careerVerdict
      ? (isTamil ? `[அறிக்கை முடிவு] "${cleanEnglishParentheses(careerVerdict)}".` : `[Report Finding] "${careerVerdict}".`)
      : (isTamil 
          ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் தொழில் கூறுகள்: 10-ம் கர்ம பாவகம் (${toTamilRasi(h10?.signName) || 'ராசி'}, அதிபதி: ${toTamilPlanet(h10?.lordName) || 'அதிபதி'}). கர்ம காரகனான சனி ${toTamilRasi(satPl?.sign) || 'ராசி'} ராசியிலும், அதிகார காரகனான சூரியன் ${toTamilRasi(sunPl?.sign) || 'ராசி'} ராசியிலும் அமர்ந்துள்ளனர்.`
          : `[Report Finding] Professional indicators in your chart: 10th House of Career in ${h10?.signName || 'sign'} (Lord: ${h10?.lordName || 'lord'}). Karmakaraka Saturn is in ${satPl?.sign || 'sign'} and Authority karaka Sun is in ${sunPl?.sign || 'sign'}.`);

    const d10Note = d10Asc
      ? (isTamil ? ` தசாம்சம் (D10) லக்னம் ${toTamilRasi(d10Asc)} ராசியில் அமைந்து தொழில் அதிகார நிலையைக் காட்டுகிறது.` : ` Your D10 Dashamsha ascendant in ${d10Asc} governs executive status.`)
      : "";
    const winNote = careerWindows.length > 0 && careerWindows[0].years
      ? (isTamil ? ` முக்கிய தொழில் முன்னேற்றக் காலம்: ${careerWindows[0].years}.` : ` Key supportive timing window: ${careerWindows[0].years}.`)
      : "";
    const isDashaCareerConnected = curDasha && (
      curDasha === h10?.lordName ||
      curDasha === "Saturn" ||
      curDasha === "Sun" ||
      (context.chart.planets || []).some(p => p.name === curDasha && p.house === 10)
    );

    const dashaNote = isDashaCareerConnected
      ? (isTamil
          ? ` நடப்பு ${toTamilPlanet(curDasha)}${curSub ? `–${toTamilPlanet(curSub)}` : ""} தசா காலம் தொழில் ஸ்தானத்துடன் தொடர்புடையதாக அமைந்து தொழில் பொறுப்புகளை முன்னிலைப்படுத்துகிறது.`
          : ` Operating ${curDasha}${curSub ? `–${curSub}` : ""} cycle connects directly with your 10th house portfolio, activating active professional responsibilities.`)
      : (curDasha
          ? (isTamil
              ? ` நடப்பு ${toTamilPlanet(curDasha)}${curSub ? `–${toTamilPlanet(curSub)}` : ""} தசா காலம் பொதுவான காலக்கட்ட சுழற்சியாக அமைகிறது; நேரடி தொழில் தாக்கங்கள் 10-ம் அதிபதி மற்றும் சனி பகவானின் தொடர்பால் தீர்மானிக்கப்படுகின்றன.`
              : ` Operating ${curDasha}${curSub ? `–${curSub}` : ""} cycle serves as the ambient timing cycle; specific career developments are governed by 10th lord ${h10?.lordName || ''} and Karmakaraka Saturn.`)
          : "");

    body = isTamil
      ? `${reportFactPart}\n\n[பாரம்பரிய விளக்கம்] உங்கள் ${sysName} கணிதத்தின்படி, தொழில் துறை ஆய்வு 10-ம் பாவகத்தையும் லக்னத்தையும் (${toTamilRasi(asc) || 'லக்னம்'}) அடிப்படையாகக் கொண்டது.${d10Note}${winNote}${dashaNote}`
      : `${reportFactPart}\n\n[Traditional Context] Under ${sysName} astrological methodology, professional trajectory synthesizes the 10th house and Ascendant (${asc || 'Lagna'}).${d10Note}${winNote}${dashaNote}`;

  } else if (isHealth) {
    const wellnessSummary = context.report.wellness?.summary || context.report.activeSectionData?.domainWellness?.summary;
    const doshaData = context.report.activeSectionData?.primaryDosha;
    const hasReportWellness = Boolean(wellnessSummary || doshaData || (context.report.wellness?.risks && context.report.wellness.risks.length > 0));

    if (!hasReportWellness && (!context.chart.bhavasDetailed || context.chart.bhavasDetailed.length === 0)) {
      return {
        answer: isTamil
          ? `பாரம்பரிய ஆரோக்கிய ஆய்வு குறித்த விவரங்கள் உங்கள் அறிக்கையில் கிடைக்கவில்லை.`
          : `Detailed vitality and wellness findings are not available in the calculated report context.`,
        system: sysId,
        relevantSections: ["health"],
        evidenceIds: [],
        dataUsed: ["Health domain check"],
        status: "INSUFFICIENT_DATA",
        limitations: ["No health findings generated."]
      };
    }

    const h6 = (context.chart.bhavasDetailed || []).find(b => b.num === 6);
    const h8 = (context.chart.bhavasDetailed || []).find(b => b.num === 8);
    const sunPl = (context.chart.planets || []).find(p => p.name === "Sun");

    const reportFactPart = wellnessSummary
      ? (isTamil ? `[அறிக்கை முடிவு] "${cleanEnglishParentheses(wellnessSummary)}".` : `[Report Finding] "${wellnessSummary}".`)
      : (hasReportWellness
          ? (isTamil ? `[அறிக்கை முடிவு] ஆரோக்கிய ஆய்வு குறித்த சுருக்கமான உரை முடிவு கிடைக்கவில்லை.` : `[Report Finding] The report contains wellness indicators, but no narrative wellness conclusion was generated.`)
          : (isTamil 
              ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் ஆரோக்கியக் கூறுகள்: 6-ம் ரோக பாவகம் (${toTamilRasi(h6?.signName) || 'ராசி'}, அதிபதி: ${toTamilPlanet(h6?.lordName) || 'அதிபதி'}), 8-ம் ஆயுள் பாவகம் (${toTamilRasi(h8?.signName) || 'ராசி'}). உடல் பல காரகனான சூரியன் ${toTamilRasi(sunPl?.sign) || 'ராசி'} ராசியில் அமைந்துள்ளது.`
              : `[Report Finding] Vitality and health indicators in your chart: 6th House of Traditional Health Symbolism/Ailments in ${h6?.signName || 'sign'} (Lord: ${h6?.lordName || 'lord'}), 8th House of Longevity in ${h8?.signName || 'sign'}. Vitality significator Sun is in ${sunPl?.sign || 'sign'}.`));
    const doshaNote = doshaData ? (isTamil ? ` முதன்மை ஆயுர்வேத பிரகிருதி: ${doshaData}.` : ` Primary Ayurvedic Constitution: ${doshaData}.`) : "";

    body = isTamil
      ? `${reportFactPart}\n\n[பாரம்பரிய விளக்கம்] உங்கள் ${sysName} அறிக்கையில் குறிப்பிடப்பட்டுள்ள பாரம்பரிய உடல்நலக் குறிப்புகள் லக்னம், சூரியன், மற்றும் 6, 8-ம் பாவக அமைப்புகளை அடிப்படையாகக் கொண்டவை.${doshaNote}`
      : `${reportFactPart}\n\n[Traditional Context] Traditional vitality indicators in your ${sysName} report evaluate Ascendant strength, Sun (vital force), and 6th/8th house symbolic correspondences.${doshaNote}`;

  } else if (isStudies) {
    const eduThemes = context.report.studies?.academicThemes || context.report.activeSectionData?.academicThemes;
    const examWindows = context.report.studies?.windows || context.report.activeSectionData?.examWindows || [];
    const hasReportStudies = Boolean(eduThemes || examWindows.length > 0 || context.report.studies || context.report.activeSectionData?.domainStudies);

    if (!hasReportStudies && (!context.chart.bhavasDetailed || context.chart.bhavasDetailed.length === 0)) {
      return {
        answer: isTamil
          ? `கல்வி ஆய்வு குறித்த விவரங்கள் உங்கள் அறிக்கையில் கிடைக்கவில்லை.`
          : `Detailed academic indicators are not available in the calculated report context.`,
        system: sysId,
        relevantSections: ["studies"],
        evidenceIds: [],
        dataUsed: ["Studies domain check"],
        status: "INSUFFICIENT_DATA",
        limitations: ["No studies findings generated."]
      };
    }

    const h4 = (context.chart.bhavasDetailed || []).find(b => b.num === 4);
    const h5 = (context.chart.bhavasDetailed || []).find(b => b.num === 5);
    const mercPl = (context.chart.planets || []).find(p => p.name === "Mercury");
    const jupPl = (context.chart.planets || []).find(p => p.name === "Jupiter");

    const winStr = examWindows.length > 0 && examWindows[0].years ? (isTamil ? ` முக்கிய தேர்வுக் காலம்: ${examWindows[0].years}.` : ` Key exam window: ${examWindows[0].years}.`) : "";
    const eduSummaryText = typeof eduThemes === "string" ? eduThemes : (eduThemes?.summary || "");
    const reportFactPart = eduSummaryText
      ? (isTamil ? `[அறிக்கை முடிவு] "${cleanEnglishParentheses(eduSummaryText)}".` : `[Report Finding] "${eduSummaryText}".`)
      : (hasReportStudies
          ? (isTamil ? `[அறிக்கை முடிவு] கல்வி தொடர்பான குறிகாட்டிகள் அறிக்கையில் உள்ளன, ஆனால் சுருக்கமான உரை முடிவு உருவாக்கப்படவில்லை.` : `[Report Finding] The report contains academic indicators, but no narrative academic conclusion was generated.`)
          : (isTamil 
              ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் கல்விக் கூறுகள்: 4-ம் ஆரம்ப/பட்டப்படிப்பு பாவகம் (${toTamilRasi(h4?.signName) || 'ராசி'}, அதிபதி: ${toTamilPlanet(h4?.lordName) || 'அதிபதி'}), 5-ம் உயர்கல்வி மற்றும் புத்தி கூர்மை பாவகம் (${toTamilRasi(h5?.signName) || 'ராசி'}). புத்தி காரகனான புதன் ${toTamilRasi(mercPl?.sign) || 'ராசி'} ராசியிலும், ஞான காரகனான குரு ${toTamilRasi(jupPl?.sign) || 'ராசி'} ராசியிலும் அமர்ந்துள்ளனர்.`
              : `[Report Finding] Academic indicators in your chart: 4th House of Foundational Learning in ${h4?.signName || 'sign'} (Lord: ${h4?.lordName || 'lord'}), 5th House of Higher Intelligence in ${h5?.signName || 'sign'}. Intellect significator Mercury is in ${mercPl?.sign || 'sign'} and Wisdom karaka Jupiter is in ${jupPl?.sign || 'sign'}.`));

    body = isTamil
      ? `${reportFactPart}${winStr}\n\n[பாரம்பரிய விளக்கம்] கல்வி, அறிவுசார் வளர்ச்சி மற்றும் போட்டித் தேர்வுகள் 4, 5-ம் பாவகங்கள் மற்றும் புதன், குரு கிரகங்களின் வலுவை அடிப்படையாகக் கொண்டவை.`
      : `${reportFactPart}${winStr}\n\n[Traditional Context] Educational tendencies and competitive examination aptitude synthesize 4th/5th house significations together with Mercury and Jupiter dignities.`;

  } else if (isProperty) {
    const propSummary = context.report.wealth?.summary || context.report.activeSectionData?.propertySummary;
    const propWindows = context.report.wealth?.windows || context.report.activeSectionData?.acquisitionWindows || [];
    const hasReportProperty = Boolean(propSummary || propWindows.length > 0 || context.report.wealth || context.report.activeSectionData?.domainWealth);

    if (!hasReportProperty && (!context.chart.bhavasDetailed || context.chart.bhavasDetailed.length === 0)) {
      return {
        answer: isTamil
          ? `சொத்து மற்றும் வாகன ஆய்வு குறித்த விவரங்கள் உங்கள் அறிக்கையில் கிடைக்கவில்லை.`
          : `Detailed property and asset findings are not available in the calculated report context.`,
        system: sysId,
        relevantSections: ["property"],
        evidenceIds: [],
        dataUsed: ["Property domain check"],
        status: "INSUFFICIENT_DATA",
        limitations: ["No property findings generated."]
      };
    }

    const h4 = (context.chart.bhavasDetailed || []).find(b => b.num === 4);
    const h2 = (context.chart.bhavasDetailed || []).find(b => b.num === 2);
    const h11 = (context.chart.bhavasDetailed || []).find(b => b.num === 11);
    const marsPl = (context.chart.planets || []).find(p => p.name === "Mars");
    const venPl = (context.chart.planets || []).find(p => p.name === "Venus");

    const winStr = propWindows.length > 0 && propWindows[0].years ? (isTamil ? ` சொத்து/வாகனம் வாங்கும் சாதக காலம்: ${propWindows[0].years}.` : ` Acquisition window: ${propWindows[0].years}.`) : "";
    const propSummaryText = typeof propSummary === "string" ? propSummary : (propSummary?.summary || "");
    const reportFactPart = propSummaryText
      ? (isTamil ? `[அறிக்கை முடிவு] "${cleanEnglishParentheses(propSummaryText)}".` : `[Report Finding] "${propSummaryText}".`)
      : (hasReportProperty
          ? (isTamil ? `[அறிக்கை முடிவு] சொத்து தொடர்பான குறிகாட்டிகள் அறிக்கையில் உள்ளன, ஆனால் சுருக்கமான உரை முடிவு உருவாக்கப்படவில்லை.` : `[Report Finding] The report contains property-related indicators, but no narrative property conclusion was generated.`)
          : (isTamil
              ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் சொத்து மற்றும் செல்வக் கூறுகள்: 4-ம் பூமி/வாகன பாவகம் (${toTamilRasi(h4?.signName) || 'ராசி'}, அதிபதி: ${toTamilPlanet(h4?.lordName) || 'அதிபதி'}), 2-ம் தன பாவகம் (${toTamilRasi(h2?.signName) || 'ராசி'}), 11-ம் லாப பாவகம் (${toTamilRasi(h11?.signName) || 'ராசி'}). பூமி காரகனான செவ்வாய் ${toTamilRasi(marsPl?.sign) || 'ராசி'} ராசியிலும், வாகன காரகனான சுக்கிரன் ${toTamilRasi(venPl?.sign) || 'ராசி'} ராசியிலும் உள்ளனர்.`
              : `[Report Finding] Wealth, property, and asset indicators in your chart: 4th House of Fixed Assets/Vehicles in ${h4?.signName || 'sign'} (Lord: ${h4?.lordName || 'lord'}), 2nd House of Accumulated Wealth (${h2?.signName || 'sign'}), and 11th House of Gains (${h11?.signName || 'sign'}). Land significator Mars is in ${marsPl?.sign || 'sign'} and Luxury/Vehicle significator Venus is in ${venPl?.sign || 'sign'}.`));

    body = isTamil
      ? `${reportFactPart}${winStr}\n\n[பாரம்பரிய விளக்கம்] உங்கள் சொத்து, நிலம், வாகன சேர்க்கை மற்றும் நிதி ஸ்திரத்தன்மை 4-ம் பாவகம், தன பாவகங்கள் (2 மற்றும் 11) மற்றும் செவ்வாய், சுக்கிரனின் சுப வலிமையை அடிப்படையாகக் கொண்டது.`
      : `${reportFactPart}${winStr}\n\n[Traditional Context] Real estate acquisitions, vehicle comfort, and financial growth are evaluated via the 4th house (Bhoomi/Vahana), 2nd/11th Dhana houses, and the supportive dignities of Mars and Venus.`;

  } else if (isPolitics) {
    const sunPl = (context.chart.planets || []).find(p => p.name === "Sun");
    const marsPl = (context.chart.planets || []).find(p => p.name === "Mars");
    const h10 = (context.chart.bhavasDetailed || []).find(b => b.num === 10);
    body = isTamil
      ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் அரசு மற்றும் தலைமைத்துவ கூறுகள்: 10-ம் தொழில் பாவகம் (${toTamilRasi(h10?.signName) || 'ராசி'}, அதிபதி: ${toTamilPlanet(h10?.lordName) || 'அதிபதி'}). அதிகார காரகனான சூரியன் ${toTamilRasi(sunPl?.sign) || 'ராசி'} ராசியிலும், செயல்வீரனான செவ்வாய் ${toTamilRasi(marsPl?.sign) || 'ராசி'} ராசியிலும் அமர்ந்துள்ளனர்.\n\n[பாரம்பரிய விளக்கம்] பொது சேவை, அரசியல் மற்றும் நிர்வாக அதிகாரம் 10-ம் பாவகம், சூரியன் மற்றும் செவ்வாயின் வலிமையால் தீர்மானிக்கப்படுகிறது. தர்ம கர்மாதிபதி யோகம் அல்லது வலுவான சூரியன் மக்கள் தொடர்பிலும் தலைமைத்துவத்திலும் முன்னேற்றத்தை அளிக்கும்.`
      : `[Report Finding] Leadership and administrative indicators in your chart: 10th House of Governance in ${h10?.signName || 'sign'} ruled by ${h10?.lordName || 'lord'}. Sovereign ruler Sun is in ${sunPl?.sign || 'sign'} and executive Mars is in ${marsPl?.sign || 'sign'}.\n\n[Traditional Context] Classical Vedic astrology evaluates public authority, governance, and institutional leadership through the 10th house, Sun (royal authority), and Mars (executive drive). Strength in these indicators supports public stewardship and administrative responsibility.`;

  } else if (isForeign) {
    const rahuPl = (context.chart.planets || []).find(p => p.name === "Rahu");
    const h9 = (context.chart.bhavasDetailed || []).find(b => b.num === 9);
    const h12 = (context.chart.bhavasDetailed || []).find(b => b.num === 12);
    body = isTamil
      ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் வெளிநாடு மற்றும் ஆன்மீக கூறுகள்: 9-ம் நீண்ட தூர பயண பாவகம் (${toTamilRasi(h9?.signName) || 'ராசி'}), 12-ம் வெளிநாட்டு வாச பாவகம் (${toTamilRasi(h12?.signName) || 'ராசி'}). தொலைதூர காரகனான ராகு ${rahuPl?.house ? `${rahuPl.house}-ம் பாவகத்தில்` : '12-ம் பாவகத்தில்'} அமர்ந்துள்ளார்.\n\n[பாரம்பரிய விளக்கம்] 9 மற்றும் 12-ம் பாவகங்கள் மற்றும் ராகுவின் சேர்க்கை வெளிநாட்டு வேலைவாய்ப்பு, உயர்கல்வி பயணம் மற்றும் ஆன்மீக நாட்டம் ஆகியவற்றை குறிக்கின்றன.`
      : `[Report Finding] Cross-border and foreign horizons in your chart: 9th House of Long-Distance Journeys (${h9?.signName || 'sign'}) and 12th House of Foreign Residence/Moksha (${h12?.signName || 'sign'}). Rahu is positioned in House ${rahuPl?.house || 'natal'}.\n\n[Traditional Context] In classical Parashari principles, relocation, overseas ventures, and spiritual horizons are activated through the harmonious interaction of the 9th and 12th houses, catalyzed by Rahu and operating dasha cycles.`;

  } else if (isYogas) {
    const yogas = context.chart.yogas || context.report.activeSectionData?.detectedYogas || [];
    if (yogas.length === 0) {
      body = isTamil
        ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் முக்கிய பாரம்பரிய விசேஷ யோகங்கள் எதுவும் உச்ச பலத்துடன் செயல்படவில்லை; இயல்பான கிரக அமைப்புகளின் அடிப்படையில் பலன்கள் வெளிப்படுகின்றன.`
        : `[Report Finding] No major classical power yogas met the required strength thresholds in this chart; standard planetary configurations determine outcomes.`;
    } else {
      const topYogas = yogas.slice(0, 3).map(y => isTamil ? cleanEnglishParentheses(y.nameTamil || y.name) : `${y.name}${y.desc ? ` (${y.desc})` : ''}`).join(". ");
      body = isTamil
        ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் செயல்படும் முக்கிய யோகங்கள்: ${topYogas}.`
        : `[Report Finding] Key verified yogas operating in your natal chart: ${topYogas}.`;
    }

  } else if (isBhavas) {
    const bhavas = context.report.activeSectionData?.bhavasDetailed || context.chart.bhavasDetailed;
    if (!bhavas || bhavas.length === 0) {
      return {
        answer: isTamil
          ? `பாவக விரிவான ஆய்வு உங்கள் அறிக்கையில் கிடைக்கவில்லை.`
          : `Detailed 12-house (bhava) analysis is not available in the calculated report context.`,
        system: sysId,
        relevantSections: ["bhavas"],
        evidenceIds: [],
        dataUsed: ["Bhavas check"],
        status: "INSUFFICIENT_DATA",
        limitations: ["Bhava details absent."]
      };
    }

    const h1 = bhavas.find(b => b.num === 1);
    const h10 = bhavas.find(b => b.num === 10);
    const h7 = bhavas.find(b => b.num === 7);
    body = isTamil
      ? `[அறிக்கை முடிவு] உங்கள் 12 பாவக அமைப்பில், 1-ம் வீடு (${toTamilRasi(h1?.signName)}) அதிபதி ${toTamilPlanet(h1?.lordName)} (${toTamilDignity(h1?.lordDignity)}). 10-ம் தொழில் பாவகத்தில் ${toTamilRasi(h10?.signName)} ராசியை ${toTamilPlanet(h10?.lordName)} ஆட்சி செய்கிறார். 7-ம் கூட்டு பாவகத்தில் ${toTamilRasi(h7?.signName)} அமைந்துள்ளது.`
      : `[Report Finding] Your 12-house breakdown establishes House 1 (${h1?.signName || ''}) with lord ${h1?.lordName || ''} (${h1?.lordDignity || ''}). House 10 of career is governed by ${h10?.lordName || ''} in ${h10?.signName || ''}, while House 7 of partnerships is in ${h7?.signName || ''}.`;

  } else if (relevantSections.includes("multiSystemComparison") || route.type === "SYSTEM_COMPARISON" || /compare|difference\s+between|versus|vs\.?|வேறுபாடு/i.test(qLower)) {
    const kpData = getKPData(context);
    const kpSubLords = kpData.subLords || {};
    const tenthSubLord = kpSubLords.cusp_10 || kpSubLords[10] || kpSubLords["10"] || kpSubLords["tenth"] || (kpData.cusps || []).find(c => c.house === 10)?.subLord || null;
    const h10 = (context.chart.bhavasDetailed || []).find(b => b.num === 10) || {};
    const tenthLord = h10.lordName || h10.lord || null;
    const subLordDisplayEn = tenthSubLord || "Not calculated";
    const subLordDisplayTa = tenthSubLord ? toTamilPlanet(tenthSubLord) : "கணக்கிடப்படவில்லை";
    const lordDisplayEn = tenthLord || "Not calculated";
    const lordDisplayTa = tenthLord ? toTamilPlanet(tenthLord) : "கணக்கிடப்படவில்லை";
    const bundleSystems = context.multiSystemBundle?.systems || {};
    const lahiriValNum = bundleSystems.lahiri?.ayanamshaValue ?? bundleSystems.lahiri?.ayanamsa ?? (context.system?.id === "lahiri" ? (context.chart.ayanamshaValue ?? context.chart.ayanamsa ?? null) : (context.chart.ayanamshaValue ?? context.chart.ayanamsa ?? null));
    const kpValNum = bundleSystems.kp?.ayanamshaValue ?? bundleSystems.kp?.ayanamsa ?? bundleSystems.kp?.system?.ayanamshaValue ?? (context.system?.id === "kp" ? (context.chart.ayanamshaValue ?? context.chart.ayanamsa ?? null) : null);

    const lahiriStr = typeof lahiriValNum === "number" ? `${lahiriValNum.toFixed(2)}°` : "AYANAMSHA_NOT_CALCULATED";
    const kpStr = typeof kpValNum === "number" ? `${kpValNum.toFixed(2)}°` : "AYANAMSHA_NOT_CALCULATED";
    const lahiriStrTa = typeof lahiriValNum === "number" ? `${lahiriValNum.toFixed(2)}°` : "கணக்கிடப்படவில்லை";
    const kpStrTa = typeof kpValNum === "number" ? `${kpValNum.toFixed(2)}°` : "கணக்கிடப்படவில்லை";
    const configuredHouseSystem = context.system?.houseSystem || "Whole Sign / Equal";

    body = isTamil
      ? `[அறிக்கை ஒப்பீடு] உங்கள் ஜாதகத்தில் லஹிரி (Chitrapaksha) மற்றும் கே.பி. (Krishnamurti Padhdhati) முறைகளுக்கு இடையே உள்ள முக்கிய வேறுபாடுகள்:\n\n1. அயனாம்சம்: லஹிரி முறை சித்திரபக்ஷ அயனாம்சத்தையும் (${lahiriStrTa}), கே.பி. முறை கிருஷ்ணமூர்த்தி அயனாம்சத்தையும் (${kpStrTa}) பயன்படுத்துகிறது; இரண்டும் நிரயன (Sidereal) இராசி மண்டலத்தை அடிப்படையாகக் கொண்டவை.\n2. பாவ ஆரம்ப கணிதம்: லஹிரி மரபு கட்டமைப்பில் தேர்ந்தெடுக்கப்பட்ட பாவக முறை (${configuredHouseSystem}) பயன்படுத்தப்படுகிறது; கே.பி. முறை பிளாசிடஸ் (Placidus) அரை-விகித சமன்பாட்டைப் பயன்படுத்தி 12 பாவக ஆரம்பங்களை துல்லியமாக கணக்கிடுகிறது. இதனால் சில கிரகங்கள் ராசி சக்கரத்தை விட பாவ சலித சக்கரத்தில் முந்தைய அல்லது பிந்தைய பாவகத்திற்கு மாறக்கூடும்.\n3. பலன் காணும் நெறிமுறை: லஹிரி முறையில் 10-ம் அதிபதி (${lordDisplayTa}) மற்றும் D10 தசாம்ச வர்க்க பலம் முதன்மையாக ஆராயப்படுகிறது; கே.பி. முறையில் 10-ம் பாவ உப அதிபதி (Sub-Lord: ${subLordDisplayTa}) மற்றும் 2, 6, 10, 11-ம் பாவ காரகத்துவங்கள் மூலம் தொழில் பலன்கள் முடிவெடுக்கப்படுகின்றன.\n\n[பாரம்பரிய விளக்கம்] லஹிரி முறை பராசர வர்க்க சக்கரங்கள் மற்றும் ஷட்பல வலிமைக்கு முன்னுரிமை அளிக்கிறது; கே.பி. முறை 249 உப அதிபதிகள் மற்றும் நட்சத்திர காரகத்துவங்களை மட்டுமே முதன்மையாகக் கொள்கிறது.`
      : `[Report Finding] The foundational mathematical and interpretive differences between Lahiri (Chitrapaksha) and KP (Krishnamurti Padhdhati) for your chart:\n\n1. Ayanamsha: Both systems operate in the Sidereal zodiac. Lahiri applies Chitrapaksha sidereal ayanamsha (${lahiriStr}), whereas KP applies Krishnamurti sidereal ayanamsha (${kpStr}).\n2. House Cuspal Division: Lahiri/Parashari analysis applies configured classical house division (${configuredHouseSystem}), whereas KP strictly applies Placidus semi-arc cusp division. Consequently, planets near house boundaries may shift houses in the KP Bhava Chalit chart relative to the Lahiri Rashi chart.\n3. Predictive Methodology: In Lahiri, career is evaluated via the 10th house lord (${lordDisplayEn}), mutual aspects, and D10 Dashamsha divisional chart. In KP, events depend strictly on the 10th cusp Sub-Lord (${subLordDisplayEn}) and its star lord signifying the 2, 6, 10, 11 house matrix.\n\n[Traditional Context] Lahiri emphasizes classical Vargas, Shadbala, and mutual aspects; KP relies entirely on the 249 Cuspal Sub-Lords and 4-tier house significators for binary event timing.`;

  } else if (route.type === "TOP_HEADINGS" || /top\s+(?:three|3)?\s*(?:report\s+)?(?:headings?|sections?|topics?|chapters?)|three\s+(?:main\s+|key\s+)?(?:headings?|sections?|topics?|chapters?)|முக்கிய\s*(?:3|மூன்று)?\s*தலைப்புகள்?/i.test(cleanQ)) {
    body = isTamil
      ? `[அறிக்கை முடிவு] உங்கள் முழு வாழ்க்கை நுண்ணறிவு அறிக்கையில் (Full Life Intelligence Report) உள்ள 3 மிக முக்கியமான தலைப்புகள்:\n\n1. தொழில், தலைமைத்துவம் மற்றும் வாழ்வியல் சாதனை (Career & Leadership):\n• உங்கள் 10-ம் கர்ம பாவகம், தொழில் காரகர்கள் மற்றும் நடப்பு தசா சுழற்சியின் அடிப்படையில் எதிர்கால தொழில் வளர்ச்சி மற்றும் முக்கிய வாழ்வியல் மாற்றங்கள் இதில் விரிவாக ஆராயப்பட்டுள்ளன.\n\n2. இல்லற நல்வாழ்வு, திருமணம் மற்றும் உறவுகள் (Marriage & Relationships):\n• உங்கள் 7-ம் களத்திர பாவகம், நவாம்சம் (D9) மற்றும் துணைவருக்கான பொருத்தக் கூறுகள் மூலம் குடும்ப வாழ்வின் ஸ்திரத்தன்மை இதில் மதிப்பிடப்பட்டுள்ளது.\n\n3. நிதி மேலாண்மை, செல்வ வளம் மற்றும் சொத்துக்கள் (Finance & Wealth):\n• உங்கள் 2-ம் தன பாவகம், 11-ம் லாப பாவகம் மற்றும் 4-ம் சொத்து பாவக அமைப்புகள் வழியே வாழ்நாள் நிதிப் பாதுகாப்பு மற்றும் முதலீட்டு யோகங்கள் இதில் பகுப்பாய்வு செய்யப்பட்டுள்ளன.\n\n[பாரம்பரிய விளக்கம்] இந்த 3 தலைப்புகள் தனிநபர் இலக்குகள், பொருளாதார ஸ்திரத்தன்மை மற்றும் குடும்ப அமைப்பை வழிநடத்தும் முதன்மைத் தூண்களாகும்.`
      : `[Report Finding] The three most important headings in your comprehensive Life Intelligence Report are:\n\n1. Career, Leadership & Vocation (10th Bhava & Dashamsha):\n• Details your professional trajectory, leadership potential, and major karmic milestones under operating planetary cycles.\n\n2. Marriage, Family & Partnerships (7th Bhava & Navamsha D9):\n• Evaluates marital timing, compatibility patterns, and lifelong relationship dynamics.\n\n3. Finance, Wealth & Immovable Property (2nd, 11th & 4th Bhavas):\n• Analyzes wealth accumulation potential, real estate acquisition windows, and fiscal stability.\n\n[Traditional Context] These three domains form the foundational tripod of practical Jyotisha life analysis—Dharma/Karma (Career), Kama (Relationships), and Artha (Wealth).`;

  } else {
    // Rich, personalized multi-factorial astrological reading synthesizing calculated facts
    const moonNak = context.chart.moon?.nakshatra || "";
    const sunSign = context.chart.sun?.sign || "";
    const topShadbala = (context.chart.shadbala || []).slice().sort((a, b) => (b.ratio || b.totalRupas || 0) - (a.ratio || a.totalRupas || 0))[0];
    const topYoga = (context.chart.yogas || [])[0];
    const lagnaLord = (context.chart.bhavasDetailed || []).find(b => b.num === 1);
    const dashaDesc = curDasha ? (curSub ? `${curDasha} Mahadasha – ${curSub} Antardasha` : `${curDasha} Mahadasha`) : "";
    const dashaDescTa = curDasha ? (curSub ? `${toTamilPlanet(curDasha)} மகா தசை – ${toTamilPlanet(curSub)} புக்தி` : `${toTamilPlanet(curDasha)} மகா தசை`) : "";

    const strengthPoints = [];
    if (topShadbala) strengthPoints.push(`${topShadbala.planet} (highest Shadbala strength)`);
    if (topYoga) strengthPoints.push(`${topYoga.name}`);
    if (lagnaLord?.lordName) strengthPoints.push(`1st House Lord ${lagnaLord.lordName} in ${lagnaLord.signName || 'D1'}`);
    const strengthStr = strengthPoints.length > 0 ? strengthPoints.join(", ") : "balanced planetary configurations";

    const strengthPointsTa = [];
    if (topShadbala) strengthPointsTa.push(`${toTamilPlanet(topShadbala.planet)} (உயர் ஷட்பல பலம்)`);
    if (topYoga) strengthPointsTa.push(`${cleanEnglishParentheses(topYoga.nameTamil || topYoga.name)}`);
    if (lagnaLord?.lordName) strengthPointsTa.push(`லக்னாதிபதி ${toTamilPlanet(lagnaLord.lordName)} (${toTamilRasi(lagnaLord.signName)})`);
    const strengthStrTa = strengthPointsTa.length > 0 ? strengthPointsTa.join(", ") : "சமச்சீரான கிரக அமைப்புகள்";

    body = isTamil
      ? `[அறிக்கை முடிவு] உங்கள் ${sysName} கணிதத்தின்படி, லக்னம் ${toTamilRasi(asc) || 'லக்னம்'}, ராசி ${toTamilRasi(moon) || 'ராசி'}${moonNak ? ` (${toTamilNakshatra(moonNak)})` : ""}, மற்றும் சூரியன் ${toTamilRasi(sunSign) || 'ராசி'} அமைப்புகள் உங்கள் முக்கிய ஜோதிட அடித்தளத்தை உருவாக்குகின்றன. உங்கள் ஜாதகத்தின் முக்கிய வலிமைத் தூண்கள்: ${strengthStrTa}.${dashaDescTa ? ` தற்போதைய இயக்க சுழற்சி: ${dashaDescTa}.` : ""}\n\n[பாரம்பரிய விளக்கம்] பராசர சாஸ்திர விதிகளின்படி, லக்னம் மற்றும் சந்திரனின் நிலைகள் உங்கள் தனித்தன்மை மற்றும் மனோதிடத்தை வடிவமைக்கின்றன. நடப்பு தசா-அந்தர்தச நாதனின் ஆதிபத்தியம் உங்கள் தற்போதைய கவனத்தையும் கர்ம கடமைகளையும் வழிநடத்துகிறது.`
      : `[Report Finding] According to your calculated ${sysName} report, your Ascendant (${asc || 'Lagna'}), Moon sign (${moon || 'Rashi'}${moonNak ? ` in ${moonNak}` : ""}), and Sun sign (${sunSign || 'Solar placement'}) establish your foundational astrological blueprint. Core planetary pillars of strength in this chart: ${strengthStr}.${dashaDesc ? ` Operating cycle: ${dashaDesc}.` : ""}\n\n[Traditional Context] Under classical Parashari principles, your Ascendant and operating dasha govern vitality, psychological inclinations, and seasonal life priorities. Verified planetary dignities directly shape how your natural potential and timing unfold.`;
  }

  return {
    answer: formatWithDisclaimers(body, relevantSections),
    system: sysId,
    relevantSections,
    evidenceIds,
    dataUsed: [`Calculated ${sysName} Chart Data`, ...relevantSections.map(s => `Chapter: ${s}`)],
    status,
    limitations: []
  };
}

/**
 * Validates and sanitizes AI response to ensure strict anti-fabrication invariants
 */
function validateAIResponse(parsed, context, route = null) {
  if (!parsed || typeof parsed !== "object") return null;

  const sysId = context.system.id;
  const rawAnswer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
  if (!rawAnswer || rawAnswer.length < 20) return null;

  // 1. Validate System ID (Anti-substitution)
  const returnedSys = (parsed.system || sysId).toLowerCase();
  if (returnedSys !== sysId && !(sysId === "lahiri" && returnedSys === "vedic")) {
    return null;
  }

  // 2. Validate Chart Claims against actual calculated chart facts and full context
  const claimCheck = validateChartClaims(rawAnswer, context, parsed.claims || []);
  if (!claimCheck.isValid) {
    console.warn("AI response rejected due to contradictory astrological claims:", claimCheck.violations);
    return null;
  }

  // 3. Validate Relevant Sections (must match known chapters)
  const validChapterIds = new Set(REPORT_CHAPTERS.map(c => c.id).concat(["execSummary", "fullReport", "all"]));
  const filteredSections = (Array.isArray(parsed.relevantSections) ? parsed.relevantSections : [])
    .filter(s => validChapterIds.has(s));

  // 4. Validate Evidence IDs (must exist in available evidence IDs; zero synthetic injection)
  const allowedEvidence = new Set(context.evidence?.evidenceIds || []);
  const filteredEvidence = (Array.isArray(parsed.evidenceIds) ? parsed.evidenceIds : [])
    .filter(id => allowedEvidence.has(id));

  // If question explicitly requires evidence and verified evidence exists in context, require evidence citation
  if (route?.requiresEvidence && allowedEvidence.size > 0 && filteredEvidence.length === 0) {
    console.warn("AI response rejected because question required evidence citation but none was provided.");
    return null;
  }

  // 5. Validate Data Used
  const dataUsed = Array.isArray(parsed.dataUsed) ? parsed.dataUsed.slice(0, 6) : [];

  // 6. Apply statutory safety notices if question or response includes health or finance keywords
  const healthRegex = /health|vitality|wellness|disease|illness|doctor|medicine|medical|surgery|sickness|cure|hospital|constitution|dosha|vata|pitta|kapha|ayurved|ஆரோக்கிய|மருத்துவ|நோய்|சுகாதார/i;
  const propertyRegex = /wealth|financ|money|stock|stocks|investment|invest|property|real\s*estate|asset|loan|debt|dhana|bank|bhoomi|vahana|பணம்|நிதி|முதலீடு|சொத்து|வங்கி|கடன்/i;

  const isAnyHealth = filteredSections.includes("health") || 
    filteredSections.includes("dosha") || 
    filteredSections.includes("wellness") || 
    healthRegex.test(route?.resolvedText || "") || 
    healthRegex.test(rawAnswer);

  const isAnyProperty = filteredSections.includes("property") || 
    filteredSections.includes("wealth") || 
    propertyRegex.test(route?.resolvedText || "") || 
    propertyRegex.test(rawAnswer);

  let sanitizedAnswer = rawAnswer;
  if (isAnyHealth && !/medical advice|மருத்துவ ஆலோசனை|Statutory Medical Notice|clinical diagnosis/i.test(sanitizedAnswer)) {
    sanitizedAnswer += context.lang === "ta" 
      ? "\n\n(குறிப்பு: இது பாரம்பரிய ஜோதிட விளக்கமே தவிர மருத்துவ ஆலோசனை அல்ல; உடல்நலக் குறைபாடுகளுக்கு தகுதியான மருத்துவரை அணுகவும்.)"
      : "\n\n(Notice: Traditional astrological interpretation only; not medical diagnosis or medical advice. Consult qualified healthcare professionals for health concerns.)";
  }
  if (isAnyProperty && !/financial advice|நிதி ஆலோசனை|Statutory Financial Notice/i.test(sanitizedAnswer)) {
    sanitizedAnswer += context.lang === "ta"
      ? "\n\n(குறிப்பு: இது ஜோதிட குறியீட்டு வழிகாட்டலே தவிர நிதி அல்லது சட்ட ஆலோசனை அல்ல.)"
      : "\n\n(Notice: Astrological interpretation only; not licensed financial or investment advice.)";
  }

  return {
    answer: sanitizedAnswer,
    system: sysId,
    relevantSections: filteredSections.length > 0 ? filteredSections : ["execSummary"],
    evidenceIds: filteredEvidence,
    dataUsed: dataUsed.length > 0 ? dataUsed : [`${context.system.name} Ephemeris`],
    status: parsed.status === "INSUFFICIENT_DATA" ? "INSUFFICIENT_DATA" : "REPORT_SUPPORTED",
    limitations: Array.isArray(parsed.limitations) ? parsed.limitations : []
  };
}

/**
 * Main entry point to answer follow-up questions
 */
export async function answerFollowUpQuestion(params, contextArg = null) {
  let question, context, conversationHistory, onCreditDeducted;
  if (typeof params === "object" && params !== null && ("question" in params || "context" in params)) {
    question = params.question;
    context = params.context;
    conversationHistory = params.conversationHistory || [];
    onCreditDeducted = params.onCreditDeducted || null;
  } else {
    question = params;
    context = contextArg;
    conversationHistory = [];
    onCreditDeducted = null;
  }
  if (!question) {
    throw new Error("Question parameter is required.");
  }
  if (!context || !context.chart) {
    throw new Error("Valid report context is required to answer follow-up question.");
  }

  const rawQ = typeof question === "string" ? question : (question.text || "");
  const route = routeFollowUpQuestion(rawQ, context, conversationHistory);

  // 1. If Deterministic Factual or Unsupported System or Ambiguous or System Comparison, return instantly!
  if (route.type === "SYSTEM_COMPARISON") {
    return generateDeterministicAnswer(route.resolvedText || rawQ, context, route);
  }

  if (route.type === "FACTUAL" || route.type === "UNSUPPORTED_SYSTEM" || route.type === "AMBIGUOUS" || route.type === "INSUFFICIENT_CONTEXT") {
    return {
      answer: route.answer || route.clarification || "Insufficient report data.",
      system: route.system || context.system.id,
      relevantSections: route.relevantSections || [],
      evidenceIds: route.evidenceIds || [],
      dataUsed: route.dataUsed || [],
      status: route.status || "DETERMINISTIC_FACT",
      limitations: route.limitations || []
    };
  }

  // 2. Analytical Question: Try calling AI Proxy with structured prompt
  const prompt = buildFollowUpAIPrompt(route.resolvedText || rawQ, context, route, conversationHistory);
  let sessionToken = null;
  try {
    sessionToken = await ensureSessionToken();
  } catch {
    // Offline mode
  }

  let aiSuccess = false;
  let parsedResponse = null;

  try {
    const headers = {};
    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }
    const proxyResponse = await apiFetch("/api/generate-astrology", {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, lang: context.lang || "en" })
    });

    if (proxyResponse && proxyResponse.ok) {
      const data = await proxyResponse.json();
      if (typeof onCreditDeducted === "function" && typeof data.remainingCredits === "number") {
        onCreditDeducted(data.remainingCredits);
      }
      if (data.text) {
        let jsonStr = data.text.trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
          try {
            const rawParsed = JSON.parse(jsonStr);
            parsedResponse = validateAIResponse(rawParsed, context, route);
            if (parsedResponse) {
              aiSuccess = true;
            }
          } catch {
            // JSON parse failed
          }
        }
      }
    }
  } catch {
    // Backend offline or network unavailable
  }

  // 3. If AI succeeded with validated response, return it
  if (aiSuccess && parsedResponse) {
    return parsedResponse;
  }

  // 4. Robust Deterministic Report Synthesis Fallback (Offline & Anti-Failure)
  return generateDeterministicAnswer(route.resolvedText || rawQ, context, route);
}

export { processEvidenceLinkedQA } from "./questionAnswer/index.js";

