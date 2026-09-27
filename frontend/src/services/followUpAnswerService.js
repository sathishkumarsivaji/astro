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
import { REPORT_CHAPTERS } from "../config/reportChapters.js";

/**
 * Unified helper to retrieve D9 Navamsha data from context
 */
export function getD9Data(context) {
  if (!context || !context.chart) return null;
  const raw = context.chart.vargas?.d9 || context.report?.activeSectionData?.d9Chart || null;
  if (!raw) return null;
  const asc = raw.ascendant?.signName || raw.ascendant?.sign || raw.ascendant?.name || (typeof raw.ascendant === "string" ? raw.ascendant : null);
  const planets = (raw.planets || []).map(p => ({
    name: p.name,
    sign: p.signName || p.sign,
    house: p.house || p.vargaHouse,
    dignity: p.dignity
  }));
  return { ascendant: asc, planets };
}

/**
 * Unified helper to retrieve D10 Dashamsha data from context
 */
export function getD10Data(context) {
  if (!context || !context.chart) return null;
  const raw = context.chart.vargas?.d10 || context.report?.activeSectionData?.d10Chart || null;
  if (!raw) return null;
  const asc = raw.ascendant?.signName || raw.ascendant?.sign || raw.ascendant?.name || (typeof raw.ascendant === "string" ? raw.ascendant : null);
  const planets = (raw.planets || []).map(p => ({
    name: p.name,
    sign: p.signName || p.sign,
    house: p.house || p.vargaHouse,
    dignity: p.dignity
  }));
  return { ascendant: asc, planets };
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
  if (!context || !context.chart) return null;
  return context.chart.currentDasha || null;
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
      primaryGemstone: remedies.primaryGemstone ? remedies.primaryGemstone.toLowerCase() : null,
      recommended: (remedies.recommendedGemstones || []).map(g => (typeof g === "string" ? g : g.name || "").toLowerCase()),
      contraindicated: (remedies.contraindicatedGemstones || []).map(g => (typeof g === "string" ? g : g.name || "").toLowerCase())
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
    reduced.transits = context.chart.transits || context.report.activeSectionData?.transits || context.report.activeSectionData?.transitCrossings || null;
  }

  // 7. Timeline / Vimshottari Dasha
  if (relevantSections.includes("timeline") || /timeline|dasha|mahadasha|antardasha|pratyantardasha|stage/i.test(qLower)) {
    reduced.timeline = {
      currentDasha: context.chart.currentDasha || null,
      stages: context.chart.timeline || context.report.activeSectionData?.timelineStages || []
    };
  }

  // 8. Career Domain
  if (relevantSections.includes("career") || /career|job|profession|promotion|work|business|vocation/i.test(qLower)) {
    reduced.career = {
      destinyVerdict: context.report.career?.destiny || context.report.activeSectionData?.careerDestinyVerdict || null,
      examObstacleVerdict: context.report.activeSectionData?.examObstacleVerdict || null,
      careerWindows: context.report.career?.windows || context.report.activeSectionData?.careerWindows || [],
      domainSummary: context.report.activeSectionData?.domainSummary || null,
      d10Dashamsha: getD10Data(context),
      tenthHouse: (context.report.activeSectionData?.bhavasDetailed || context.chart.bhavasDetailed || []).find(b => b.num === 10) || null,
      careerEvidenceIds: (context.evidence.evidenceIds || []).filter(id => id.startsWith("C"))
    };
  }

  // 9. Relationships / Marriage Domain
  if (relevantSections.includes("relationships") || /marriage|spouse|relationship|partner|wedding/i.test(qLower)) {
    reduced.relationships = {
      marriageVerdict: context.report.marriage?.verdict || context.report.activeSectionData?.marriageVerdict || null,
      spouseProfile: context.report.activeSectionData?.spouseProfile || null,
      marriageWindows: context.report.marriage?.windows || context.report.activeSectionData?.marriageWindows || [],
      auspiciousYears: context.report.activeSectionData?.auspiciousYears || null,
      d9Navamsha: getD9Data(context),
      seventhHouse: (context.report.activeSectionData?.bhavasDetailed || context.chart.bhavasDetailed || []).find(b => b.num === 7) || null,
      relationshipEvidenceIds: (context.evidence.evidenceIds || []).filter(id => id.startsWith("M"))
    };
  }

  // 10. KP System Specifics
  if (sysId === "kp" || /sub\s*lord|significator|cusp|ruling\s+planet/i.test(qLower)) {
    reduced.kp = getKPData(context);
  }

  // 11. Bhavas / 12 Houses
  if (relevantSections.includes("bhavas") || /bhava|house|chalit|kendra|trikona|dusthana/i.test(qLower)) {
    reduced.bhavas = {
      bhavasDetailed: context.report.activeSectionData?.bhavasDetailed || context.chart.bhavasDetailed || [],
      bhavaChalit: context.report.activeSectionData?.bhavaChalit || null
    };
  }

  // 12. Yogas
  if (relevantSections.includes("yogas") || /yoga|raja\s+yoga|dhana\s+yoga/i.test(qLower)) {
    reduced.yogas = context.chart.yogas || context.report.activeSectionData?.detectedYogas || [];
  }

  // 13. Remedies
  if (relevantSections.includes("remedies") || /remedy|remedies|gemstone|mantra|charity/i.test(qLower)) {
    reduced.remedies = {
      primaryGemstone: context.report.remedies?.primaryGemstone || context.report.activeSectionData?.primaryGemstone || null,
      gemLord: context.report.remedies?.gemLord || context.report.activeSectionData?.gemLord || null,
      recommendedGemstones: context.report.remedies?.recommendedGemstones || context.report.activeSectionData?.recommendedGemstones || [],
      contraindicatedGemstones: context.report.remedies?.contraindicatedGemstones || context.report.activeSectionData?.contraindicatedGemstones || [],
      mantra: context.report.remedies?.mantra || context.report.activeSectionData?.mantra || null,
      charity: context.report.remedies?.charity || context.report.activeSectionData?.charity || null
    };
  }

  // 14. Health & Dosha
  if (relevantSections.includes("health") || relevantSections.includes("dosha") || /health|wellness|vitality|dosha/i.test(qLower)) {
    reduced.health = {
      wellnessSummary: context.report.wellness?.summary || context.report.activeSectionData?.domainWellness?.summary || null,
      riskWindows: context.report.wellness?.risks || context.report.activeSectionData?.riskWindows || [],
      dosha: context.report.activeSectionData?.primaryDosha ? {
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

  const evidenceSummary = (context.evidence.evidenceIds || []).slice(0, 12).join(", ") || "None";

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

  const prompt = `You are the AstroVerse Follow-Up Astrological Scholar answering a seeker's question about their already calculated report.

SYSTEM INSTRUCTION:
- Answer ONLY using the supplied calculated report facts, findings, and evidence in RELEVANT REPORT CONTEXT.
- ${systemNote}
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
  const isTamil = context.lang === "ta";
  const sysName = context.system.name;
  const sysId = context.system.id;
  const asc = context.chart.ascendant?.sign || null;
  const moon = context.chart.moon?.sign || null;
  const curDasha = context.chart.currentDasha?.lord;
  const curSub = context.chart.currentDasha?.subLord;

  const relevantSections = route.relevantSections || ["execSummary"];
  const evidenceIds = route.evidenceIds || [];

  let body = "";
  let status = "REPORT_SUPPORTED";

  if (relevantSections.includes("career")) {
    const careerVerdict = context.report.career?.destiny || context.report.activeSectionData?.careerDestinyVerdict;
    const d10Data = getD10Data(context);
    const d10Asc = d10Data?.ascendant;
    const careerWindows = context.report.career?.windows || context.report.activeSectionData?.careerWindows || [];

    // STRICT CHECK: If no career findings exist, refuse rather than fabricate
    if (!careerVerdict && !d10Asc && careerWindows.length === 0) {
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

    const reportFactPart = careerVerdict
      ? (isTamil ? `[அறிக்கை முடிவு] "${careerVerdict}".` : `[Report Finding] "${careerVerdict}".`)
      : (isTamil ? `[அறிக்கை முடிவு] தொழில் தொடர்பான குறிப்பிட்ட முடிவு இந்த ஜாதகத்திற்கு கணக்கிடப்படவில்லை.` : `[Report Finding] Specific career pathway verdict was not generated.`);

    const d10Note = d10Asc
      ? (isTamil ? ` தசாம்சம் (D10) லக்னம் ${d10Asc} ராசியில் அமைந்து தொழில் அதிகார நிலையைக் காட்டுகிறது.` : ` Your D10 Dashamsha ascendant in ${d10Asc} governs executive status.`)
      : "";
    const winNote = careerWindows.length > 0 && careerWindows[0].years
      ? (isTamil ? ` முக்கிய தொழில் முன்னேற்றக் காலம்: ${careerWindows[0].years}.` : ` Key supportive timing window: ${careerWindows[0].years}.`)
      : "";
    const dashaNote = curDasha 
      ? (isTamil ? ` நடப்பு ${curDasha}${curSub ? `–${curSub}` : ""} தசா காலம் பொறுப்புகளை முன்னிலைப்படுத்துகிறது.` : ` Operating ${curDasha}${curSub ? `–${curSub}` : ""} cycle defines active professional responsibilities.`)
      : "";

    body = isTamil
      ? `${reportFactPart}\n\n[பாரம்பரிய விளக்கம்] உங்கள் ${sysName} கணிதத்தின்படி, தொழில் துறை ஆய்வு 10-ம் பாவகத்தையும் லக்னத்தையும் (${asc || 'லக்னம்'}) அடிப்படையாகக் கொண்டது.${d10Note}${winNote}${dashaNote}`
      : `${reportFactPart}\n\n[Traditional Context] Under ${sysName} astrological methodology, professional trajectory synthesizes the 10th house and Ascendant (${asc || 'Lagna'}).${d10Note}${winNote}${dashaNote}`;

  } else if (relevantSections.includes("relationships")) {
    const marrVerdict = context.report.marriage?.verdict || context.report.activeSectionData?.marriageVerdict;
    const d9Data = getD9Data(context);
    const d9Asc = d9Data?.ascendant;
    const marrWindows = context.report.marriage?.windows || context.report.activeSectionData?.marriageWindows || [];

    // STRICT CHECK: If no marriage findings exist, refuse rather than fabricate
    if (!marrVerdict && !d9Asc && marrWindows.length === 0) {
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

    const reportFactPart = marrVerdict
      ? (isTamil ? `[அறிக்கை முடிவு] "${marrVerdict}".` : `[Report Finding] "${marrVerdict}".`)
      : (isTamil ? `[அறிக்கை முடிவு] திருமண முடிவு குறித்த குறிப்பிட்ட பதிவு அறிக்கையில் இல்லை.` : `[Report Finding] Specific relationship verdict was not generated.`);

    const d9Note = d9Asc
      ? (isTamil ? ` நவாம்சம் (D9) லக்னம் ${d9Asc} ராசியில் அமைந்துள்ளது.` : ` Navamsha (D9) ascendant is positioned in ${d9Asc}.`)
      : "";
    const winNote = marrWindows.length > 0 && marrWindows[0].years
      ? (isTamil ? ` சாதகமான காலம்: ${marrWindows[0].years}.` : ` Favorable timing phase: ${marrWindows[0].years}.`)
      : "";

    body = isTamil
      ? `${reportFactPart}\n\n[பாரம்பரிய விளக்கம்] உங்கள் ${sysName} அறிக்கையின்படி, திருமண மற்றும் கூட்டுறவு ஆய்வு 7-ம் பாவகத்தை அடிப்படையாகக் கொண்டது.${d9Note}${winNote}`
      : `${reportFactPart}\n\n[Traditional Context] According to classical ${sysName} methodology, partnership matters are evaluated via the 7th house and karakas.${d9Note}${winNote}`;

  } else if (relevantSections.includes("bhavas")) {
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
      ? `[அறிக்கை முடிவு] உங்கள் 12 பாவக அமைப்பில், 1-ம் வீடு (${h1?.signName || ''}) அதிபதி ${h1?.lordName || ''} (${h1?.lordDignity || ''}). 10-ம் தொழில் பாவகத்தில் ${h10?.signName || ''} அதிபதியாக ${h10?.lordName || ''} அமர்ந்துள்ளார். 7-ம் கூட்டு பாவகத்தில் ${h7?.signName || ''} அமைந்துள்ளது.`
      : `[Report Finding] Your 12-house breakdown establishes House 1 (${h1?.signName || ''}) with lord ${h1?.lordName || ''} (${h1?.lordDignity || ''}). House 10 of career is governed by ${h10?.lordName || ''} in ${h10?.signName || ''}, while House 7 of partnerships is in ${h7?.signName || ''}.`;

  } else if (relevantSections.includes("yogas")) {
    const yogas = context.chart.yogas || context.report.activeSectionData?.detectedYogas || [];
    if (yogas.length === 0) {
      body = isTamil
        ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் முக்கிய பாரம்பரிய விசேஷ யோகங்கள் எதுவும் உச்ச பலத்துடன் செயல்படவில்லை; இயல்பான கிரக அமைப்புகளின் அடிப்படையில் பலன்கள் வெளிப்படுகின்றன.`
        : `[Report Finding] No major classical power yogas met the required strength thresholds in this chart; standard planetary configurations determine outcomes.`;
    } else {
      const topYogas = yogas.slice(0, 3).map(y => `${y.name}${y.desc ? ` (${y.desc})` : ''}`).join(". ");
      body = isTamil
        ? `[அறிக்கை முடிவு] உங்கள் ஜாதகத்தில் செயல்படும் முக்கிய யோகங்கள்: ${topYogas}.`
        : `[Report Finding] Key verified yogas operating in your natal chart: ${topYogas}.`;
    }

  } else if (relevantSections.includes("remedies")) {
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
      ? (isTamil ? `பரிந்துரைக்கப்படும் முதன்மை ரத்தினம்: ${rem.primaryGemstone} (கிரக அதிபதி: ${rem.gemLord || 'லக்னாதிபதி'}).` : `Prescribed primary gemstone: ${rem.primaryGemstone} (ruled by ${rem.gemLord || 'Ascendant lord'}).`)
      : "";
    const contraNote = rem.contraindicatedGemstones?.length > 0
      ? (isTamil ? ` தவிர்க்க வேண்டிய ரத்தினங்கள்: ${rem.contraindicatedGemstones.join(", ")}.` : ` Contraindicated gemstones to avoid: ${rem.contraindicatedGemstones.join(", ")}.`)
      : "";
    const manNote = rem.mantra
      ? (isTamil ? ` பரிந்துரைக்கப்படும் சுலோகம்: ${rem.mantra}.` : ` Supportive mantra: ${rem.mantra}.`)
      : "";
    body = `[Report Finding] ${gemNote}${contraNote}${manNote}`;

  } else if (relevantSections.includes("health") || relevantSections.includes("dosha")) {
    const wellnessSummary = context.report.wellness?.summary || context.report.activeSectionData?.domainWellness?.summary;
    const doshaData = context.report.activeSectionData?.primaryDosha;

    if (!wellnessSummary && !doshaData && (!context.report.wellness?.risks || context.report.wellness.risks.length === 0)) {
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

    const reportFactPart = wellnessSummary
      ? (isTamil ? `[அறிக்கை முடிவு] "${wellnessSummary}".` : `[Report Finding] "${wellnessSummary}".`)
      : (isTamil ? `[அறிக்கை முடிவு] ஆரோக்கிய ஆய்வு குறித்த சுருக்கமான உரை முடிவு கிடைக்கவில்லை.` : `[Report Finding] The report contains wellness indicators, but no narrative wellness conclusion was generated.`);
    const doshaNote = doshaData ? ` Primary Ayurvedic Constitution: ${doshaData}.` : "";

    body = isTamil
      ? `${reportFactPart}\n\n[பாரம்பரிய விளக்கம்] உங்கள் ${sysName} அறிக்கையில் குறிப்பிடப்பட்டுள்ள பாரம்பரிய உடல்நலக் குறிப்புகள் 6 மற்றும் 8-ம் பாவக அமைப்புகளை அடிப்படையாகக் கொண்டவை.${doshaNote}`
      : `${reportFactPart}\n\n[Traditional Context] Traditional vitality indicators in your ${sysName} report evaluate 6th and 8th house symbolic correspondences.${doshaNote}`;

  } else if (relevantSections.includes("studies")) {
    const eduThemes = context.report.activeSectionData?.academicThemes;
    const examWindows = context.report.activeSectionData?.examWindows || [];

    if (!eduThemes && examWindows.length === 0) {
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

    const winStr = examWindows.length > 0 && examWindows[0].years ? ` Key exam window: ${examWindows[0].years}.` : "";
    const reportFactPart = eduThemes?.summary
      ? (isTamil ? `[அறிக்கை முடிவு] "${eduThemes.summary}".` : `[Report Finding] "${eduThemes.summary}".`)
      : (isTamil ? `[அறிக்கை முடிவு] கல்வி தொடர்பான குறிகாட்டிகள் அறிக்கையில் உள்ளன, ஆனால் சுருக்கமான உரை முடிவு உருவாக்கப்படவில்லை.` : `[Report Finding] The report contains academic indicators, but no narrative academic conclusion was generated.`);

    body = isTamil
      ? `${reportFactPart}${winStr}\n\n[பாரம்பரிய விளக்கம்] கல்வி மற்றும் அறிவுசார் ஆய்வு 4 மற்றும் 5-ம் பாவகங்களை அடிப்படையாகக் கொண்டது.`
      : `${reportFactPart}${winStr}\n\n[Traditional Context] Educational tendencies synthesize 4th and 5th house significations.`;

  } else if (relevantSections.includes("property")) {
    const propSummary = context.report.wealth?.summary || context.report.activeSectionData?.propertySummary;
    const propWindows = context.report.wealth?.windows || context.report.activeSectionData?.acquisitionWindows || [];

    if (!propSummary && propWindows.length === 0) {
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

    const winStr = propWindows.length > 0 && propWindows[0].years ? ` Acquisition window: ${propWindows[0].years}.` : "";
    const reportFactPart = propSummary
      ? (isTamil ? `[அறிக்கை முடிவு] "${propSummary}".` : `[Report Finding] "${propSummary}".`)
      : (isTamil ? `[அறிக்கை முடிவு] சொத்து தொடர்பான குறிகாட்டிகள் அறிக்கையில் உள்ளன, ஆனால் சுருக்கமான உரை முடிவு உருவாக்கப்படவில்லை.` : `[Report Finding] The report contains property-related indicators, but no narrative property conclusion was generated.`);

    body = isTamil
      ? `${reportFactPart}${winStr}\n\n[பாரம்பரிய விளக்கம்] உங்கள் சொத்து மற்றும் வாகன அமைப்பு 4-ம் பாவகத்தை அடிப்படையாகக் கொண்டது.`
      : `${reportFactPart}${winStr}\n\n[Traditional Context] Real estate and vehicle indications evaluate 4th house and 2nd/11th wealth houses.`;

  } else if (relevantSections.includes("multiSystemComparison")) {
    const ayanName = context.system.ayanamshaType || context.system.name;
    const ayanVal = context.chart.ayanamshaValue ?? context.chart.ayanamsa ?? null;
    const ayanStr = typeof ayanVal === "number" ? ` (~${ayanVal.toFixed(2)}°)` : "";

    body = isTamil
      ? `[அறிக்கை ஒப்பீடு] உங்கள் ஜாதகம் பல ஜோதிட முறைகளில் மாறுபட்ட முடிவுகளைக் காட்டுகிறது. ${context.system.name} முறையில் ${ayanName}${ayanStr} அயனாம்சம் பயன்படுத்தப்பட்டுள்ளது.\n\n[முறை விளக்கம்] லஹிரி முறை சித்திரபக்ஷ அயனாம்சத்தையும், கே.பி. முறை 249 உப அதிபதிகளையும், மேற்கத்திய சாயன முறை வசந்த விஷுவ புள்ளியை (0° மேஷம்) அடிப்படையாகக் கொள்கிறது.`
      : `[Multi-System Comparison] Your multi-system calculation reflects genuine astronomical and coordinate differences. Your report applies ${ayanName}${ayanStr} under the ${context.system.name} system.\n\n[Methodological Context] Lahiri applies Chitrapaksha sidereal ayanamsha, KP combines KP ayanamsha with Placidus cuspal sub-lords, while Western Tropical fixes 0° Aries to the Vernal Equinox without ayanamsha.`;

  } else {
    body = isTamil
      ? `[அறிக்கை முடிவு] உங்கள் ${sysName} அறிக்கையின்படி, லக்னம் ${asc || 'லக்னம்'} மற்றும் ராசி ${moon || 'ராசி'} அமைப்புகள் உங்கள் முக்கிய ஜோதிட அடித்தளத்தை உருவாக்குகின்றன. அறிக்கையில் சுட்டிக்காட்டப்பட்டுள்ள முக்கிய வாழ்க்கை அம்சங்கள் கணக்கிடப்பட்ட எபிமெரிஸ் கணிதத்தின் அடிப்படையில் விவரிக்கப்பட்டுள்ளன.`
      : `[Report Finding] According to your calculated ${sysName} report, your Ascendant (${asc || 'Lagna'}) and Moon sign (${moon || 'Rashi'}) establish your foundational astrological blueprint. Findings in the report are synthesized directly from your verified planetary placements and operating temporal cycles.`;
  }

  // Mandatory statutory notices
  let disclaimer = "";
  if (relevantSections.includes("health") || relevantSections.includes("dosha")) {
    disclaimer = isTamil
      ? " [பாரம்பரிய ஜோதிட குறியீட்டு வழிகாட்டல் மட்டுமே; மருத்துவ ஆலோசனை அல்லது நோயறிதல் அல்ல.]"
      : " [Traditional astrological interpretation only; not medical diagnosis or advice.]";
  } else if (relevantSections.includes("property")) {
    disclaimer = isTamil
      ? " [ஜோதிட குறியீட்டு ஆய்வு மட்டுமே; நிதி அல்லது முதலீட்டு ஆலோசனை அல்ல.]"
      : " [Traditional astrological interpretation; not financial or investment advice.]";
  }

  return {
    answer: body + disclaimer,
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
  const allowedEvidence = new Set(context.evidence.evidenceIds || []);
  const filteredEvidence = (Array.isArray(parsed.evidenceIds) ? parsed.evidenceIds : [])
    .filter(id => allowedEvidence.has(id));

  // If question explicitly requires evidence and verified evidence exists in context, require evidence citation
  if (route?.requiresEvidence && allowedEvidence.size > 0 && filteredEvidence.length === 0) {
    console.warn("AI response rejected because question required evidence citation but none was provided.");
    return null;
  }

  // 5. Validate Data Used
  const dataUsed = Array.isArray(parsed.dataUsed) ? parsed.dataUsed.slice(0, 6) : [];

  // 6. Apply statutory safety notices if relevant sections include health or finance
  let sanitizedAnswer = rawAnswer;
  if (filteredSections.includes("health") && !/medical advice|மருத்துவ/i.test(sanitizedAnswer)) {
    sanitizedAnswer += context.lang === "ta" 
      ? "\n\n(குறிப்பு: இது பாரம்பரிய ஜோதிட விளக்கமே தவிர மருத்துவ ஆலோசனை அல்ல; உடல்நலக் குறைபாடுகளுக்கு தகுதியான மருத்துவரை அணுகவும்.)"
      : "\n\n(Notice: Traditional astrological interpretation only; not medical diagnosis or medical advice. Consult qualified healthcare professionals for health concerns.)";
  }
  if (filteredSections.includes("property") && !/financial advice|நிதி/i.test(sanitizedAnswer)) {
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
export async function answerFollowUpQuestion({
  question,
  context,
  conversationHistory = [],
  onCreditDeducted = null
}) {
  if (!question) {
    throw new Error("Question parameter is required.");
  }
  if (!context || !context.chart) {
    throw new Error("Valid report context is required to answer follow-up question.");
  }

  const rawQ = typeof question === "string" ? question : (question.text || "");
  const route = routeFollowUpQuestion(rawQ, context, conversationHistory);

  // 1. If Deterministic Factual or Unsupported System or Ambiguous, return instantly!
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
  const proxyUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_AI_PROXY_URL) || "/api/generate-astrology";
  const prompt = buildFollowUpAIPrompt(route.resolvedText || rawQ, context, route, conversationHistory);
  let sessionToken = "unauthenticated_session";
  try {
    sessionToken = await ensureSessionToken();
  } catch {
    // Offline mode
  }

  let aiSuccess = false;
  let parsedResponse = null;

  try {
    let proxyResponse;
    try {
      proxyResponse = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        credentials: "include",
        body: JSON.stringify({ prompt, lang: context.lang || "en" })
      });
    } catch {
      // Fallback to direct localhost:5000 if vite proxy not handling
      proxyResponse = await fetch("http://localhost:5000/api/generate-astrology", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        credentials: "include",
        body: JSON.stringify({ prompt, lang: context.lang || "en" })
      });
    }

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
