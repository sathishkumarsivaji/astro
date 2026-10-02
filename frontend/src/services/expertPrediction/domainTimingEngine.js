/**
 * ASTROVERSE — Expert Mode Generic Domain Timing Engine
 * ======================================================
 * Orchestrates the complete domain timing pipeline:
 *   1. Extract relevant dasha periods
 *   2. Check divisional chart confirmation
 *   3. Find transit concurrences
 *   4. Build evidence chains
 *   5. Evaluate independence
 *   6. Classify resolution
 *   7. Analyze contradictions (WHY NOT)
 *   8. Rank and classify windows
 *   9. Evaluate sub-phases
 *
 * This engine delegates to the existing astroEngine for all astronomical
 * calculations. It NEVER duplicates them.
 */

import {
  DOMAIN, DOMAIN_HOUSES, DOMAIN_KARAKAS, DOMAIN_VARGAS, DOMAIN_SUB_PHASES,
  RESOLUTION, SUB_PHASE_STATUS, CONFIDENCE_TYPE,
  createTimingWindow, createDomainResult, generateDeterministicId
} from "./expertPredictionSchema.js";

import {
  extractCanonicalFacts, findRelevantDashaPeriods, getHouseLord,
  getHouseOccupants, getVargaChart, getPlanet
} from "./canonicalFactAdapter.js";

import { classifyResolution } from "./resolutionClassifier.js";
import { buildEvidenceChain } from "./evidenceChainBuilder.js";
import { calculateIndependentEvidence } from "./independenceController.js";
import { analyzeContradictions } from "./contradictionEngine.js";
import { rankAndClassifyWindows } from "./windowRanker.js";

import {
  findMajorTransitEventsForWindow, calculatePratyantardasha,
  rankPratyantardashasForDomain, julianDateToDate, ZODIAC_SIGNS
} from "../astroEngine.js";

// ─────────────────────────────────────────────────────────────
// MAIN ENGINE
// ─────────────────────────────────────────────────────────────

/**
 * Runs the complete domain timing analysis.
 *
 * @param {string} domain - Domain ID from DOMAIN enum
 * @param {Object} canonicalFacts - From extractCanonicalFacts()
 * @param {Object} domainConfig - Domain-specific configuration:
 *   { relevantHouses, relevantKarakas, relevantVargas, subPhaseRules,
 *     domainLabel, domainLabelTamil, existingWindows }
 * @param {string} lang - "en" or "ta"
 * @returns {Object} ExpertDomainResult
 */
export function runDomainTiming(domainOrFacts, factsOrConfig, configOrLang, maybeLang = "en") {
  let domain;
  let canonicalFacts;
  let domainConfig;
  let lang = "en";

  if (typeof domainOrFacts === "string") {
    domain = domainOrFacts;
    canonicalFacts = factsOrConfig || {};
    domainConfig = configOrLang || {};
    lang = typeof maybeLang === "boolean" ? (maybeLang ? "ta" : "en") : (maybeLang || "en");
  } else {
    // Called as runDomainTiming(canonicalFacts, domainConfig, lang)
    canonicalFacts = domainOrFacts || {};
    domainConfig = factsOrConfig || {};
    domain = domainConfig.domain || DOMAIN.CAREER;
    lang = typeof configOrLang === "boolean" ? (configOrLang ? "ta" : "en") : (configOrLang || "en");
  }

  const isTamil = lang === "ta";
  const {
    relevantHouses = domainConfig.houses || DOMAIN_HOUSES[domain] || [],
    relevantKarakas = domainConfig.karakas ? { primary: domainConfig.karakas, secondary: [] } : (DOMAIN_KARAKAS[domain] || { primary: [], secondary: [] }),
    relevantVargas = domainConfig.varga ? [domainConfig.varga] : (domainConfig.relevantVargas || DOMAIN_VARGAS[domain] || []),
    subPhaseRules = domainConfig.rules || {},
    domainLabel = domainConfig.domainLabel || domain,
    domainLabelTamil = domainConfig.domainLabelTamil || domain,
    natalPromise = domainConfig.natalPromise || null
  } = domainConfig;

  const rawExisting = domainConfig.legacyTiming || domainConfig.existingWindows || null;
  const existingWindows = Array.isArray(rawExisting)
    ? rawExisting
    : (Array.isArray(rawExisting?.candidateWindows)
        ? rawExisting.candidateWindows
        : (Array.isArray(rawExisting?.timingWindows)
            ? rawExisting.timingWindows
            : (Array.isArray(rawExisting?.windows) ? rawExisting.windows : [])));


  const allWindows = [];
  const allEvidenceNodes = [];
  const allIndependenceGroups = [];
  const subPhases = DOMAIN_SUB_PHASES[domain] || [];

  // ── Determine relevant lords ──
  const relevantLords = buildRelevantLordsList(canonicalFacts, relevantHouses, relevantKarakas);

  // ── If existing windows provided, adapt them ──
  if (existingWindows && Array.isArray(existingWindows) && existingWindows.length > 0) {
    for (const ew of existingWindows) {
      const expertWindow = adaptExistingWindow(ew, domain, canonicalFacts, relevantVargas, isTamil);
      allWindows.push(expertWindow);
    }
  }

  // ── Find additional dasha periods not covered by existing windows ──
  const dashaPeriods = findRelevantDashaPeriods(canonicalFacts.dashaTable, relevantLords);

  for (const dashaMatch of dashaPeriods) {
    // Skip if this dasha period is already covered by an existing window
    if (existingWindows && isAlreadyCovered(dashaMatch, existingWindows)) continue;

    const jdStart = dashaMatch.jdStart;
    const jdEnd = dashaMatch.jdEnd;
    const hasExactDates = Number.isFinite(jdStart) && Number.isFinite(jdEnd) && jdEnd > jdStart;

    // ── Varga confirmation ──
    const vargaConfirmations = [];
    for (const vargaKey of relevantVargas) {
      const vChart = getVargaChart(canonicalFacts, vargaKey);
      if (vChart && vChart.status !== "CALCULATION_ERROR" && vChart.status !== "INSUFFICIENT_DATA") {
        const mdPlanet = vChart.getPlanet?.(dashaMatch.mdLord);
        const adPlanet = vChart.getPlanet?.(dashaMatch.adLord);
        const isActivated = checkVargaActivation(vChart, dashaMatch, relevantHouses, domain);
        vargaConfirmations.push({
          varga: vargaKey,
          isActivated,
          mdPlacement: mdPlanet ? { house: mdPlanet.vargaHouse, dignity: mdPlanet.vargaDignity } : null,
          adPlacement: adPlanet ? { house: adPlanet.vargaHouse, dignity: adPlanet.vargaDignity } : null
        });
      }
    }

    // ── Transit concurrence ──
    let transitConcurrence = [];
    let transitMissingTz = false;
    if (hasExactDates) {
      const tzOffset = canonicalFacts.timezoneOffsetHours;
      if (typeof tzOffset !== "number" || !Number.isFinite(tzOffset)) {
        transitMissingTz = true;
      } else {
        try {
          const tzId = canonicalFacts.timezoneId || null;
          transitConcurrence = findMajorTransitEventsForWindow(
            canonicalFacts.planets, canonicalFacts.ascendantLong,
            jdStart, jdEnd, domain, tzOffset, tzId
          );
        } catch (_err) {
          transitConcurrence = [];
        }
      }
    }

    // ── Pratyantardasha ranking ──
    let pdRanking = { rankedPDs: [], peakPD: null, peakWindow: null };
    if (hasExactDates && dashaMatch.durationDays) {
      try {
        const pds = calculatePratyantardasha(
          dashaMatch.adLord,
          dashaMatch.durationDays || ((dashaMatch.endAge - dashaMatch.startAge) * 365.2422),
          isTamil, dashaMatch.startAge, jdStart
        );
        const ctx = { planets: canonicalFacts.planets, ascendantLong: canonicalFacts.ascendantLong };
        pdRanking = rankPratyantardashasForDomain(pds, domain, ctx, dashaMatch.adLord, jdStart, jdEnd);
      } catch (_err) {
        // PD ranking failed — continue without it
      }
    }

    // ── Classify resolution ──
    const startDateIso = hasExactDates ? julianDateToDate(jdStart).toISOString().slice(0, 10) : null;
    const endDateIso = hasExactDates ? julianDateToDate(jdEnd).toISOString().slice(0, 10) : null;

    const resolution = classifyResolution({
      startDate: startDateIso,
      endDate: endDateIso,
      dashaFacts: { md: { lord: dashaMatch.mdLord }, ad: { lord: dashaMatch.adLord }, pd: pdRanking.peakPD || null },
      transitFacts: transitConcurrence,
      vargaFacts: vargaConfirmations,
      peakWindow: pdRanking.peakWindow
    });

    // ── Contradictions / WHY NOT ──
    const contradictions = analyzeContradictions(
      domain, canonicalFacts, dashaMatch, transitConcurrence, vargaConfirmations
    );
    if (transitMissingTz) {
      contradictions.whatPreventsGreaterPrecision.push({
        factorId: "PRECISION_NO_TIMEZONE",
        description: "Timezone offset missing; transit crossing analysis requires verified timezone.",
        descriptionTamil: "நேர மண்டல விவரம் இல்லை; துல்லியமான கோச்சார கணிப்பிற்கு நேர மண்டலம் தேவை.",
        severity: "HIGH",
        type: "PRECISION_LIMIT"
      });
    }

    // ── Determine confidence type ──
    const hasVargaActivation = vargaConfirmations.some(v => v.isActivated);
    const hasTransits = transitConcurrence.length > 0;
    const hasPeak = pdRanking.peakWindow !== null;
    let confidenceType = CONFIDENCE_TYPE.CANDIDATE_WINDOW;

    if (contradictions.cautionFactors?.length > 0) {
      confidenceType = CONFIDENCE_TYPE.GUARDED_PERIOD;
    } else if (hasVargaActivation && hasTransits && hasPeak) {
      confidenceType = CONFIDENCE_TYPE.PEAK_CONVERGENCE;
    } else if (hasVargaActivation && hasTransits) {
      confidenceType = CONFIDENCE_TYPE.STRONG_CONVERGENCE;
    } else if (dashaMatch.isBothRelevant && (hasVargaActivation || hasTransits)) {
      confidenceType = CONFIDENCE_TYPE.PRIMARY_ACTIVATION;
    }

    // ── Build evidence chain ──
    const { evidenceNodes, independenceGroups } = buildEvidenceChain(
      domain, canonicalFacts, dashaMatch, transitConcurrence, vargaConfirmations, {
        relevantHouses,
        relevantLords,
        relevantKarakas,
        pdRanking,
        resolution,
        confidenceType
      }
    );
    allEvidenceNodes.push(...evidenceNodes);
    allIndependenceGroups.push(...independenceGroups);

    // ── Calculate independence-adjusted strength ──
    const { adjustedStrength } = calculateIndependentEvidence(evidenceNodes, independenceGroups);

    // ── Build WHY supported ──
    const whySupported = [];
    if (dashaMatch.isMdRelevant) {
      whySupported.push({
        description: `${dashaMatch.mdLord} Mahadasha activates ${domain} houses`,
        descriptionTamil: `${dashaMatch.mdTamil} மகா தசா ${domain} பாவகங்களை இயக்குகிறது`
      });
    }
    if (dashaMatch.isBkRelevant) {
      whySupported.push({
        description: `${dashaMatch.adLord} Antardasha connects with ${domain} significators`,
        descriptionTamil: `${dashaMatch.adTamil} அந்தர்தசா ${domain} காரக தொடர்பு`
      });
    }
    if (hasVargaActivation) {
      const vargaNames = vargaConfirmations.filter(v => v.isActivated).map(v => v.varga).join(", ");
      whySupported.push({
        description: `${vargaNames} divisional chart corroborates domain activation according to classical tradition`,
        descriptionTamil: `${vargaNames} வர்க்க சக்கரம் பாரம்பரிய முறைப்படி இயக்கத்தை ஆதரிக்கிறது`
      });
    }
    if (hasTransits) {
      whySupported.push({
        description: `${transitConcurrence.length} major transit crossings coincide`,
        descriptionTamil: `${transitConcurrence.length} முக்கிய கோச்சார பெயர்ச்சிகள் ஒத்துப்போகின்றன`
      });
    }

    // ── Create timing window ──
    const window = createTimingWindow({
      windowId: `${domain}_exp_${allWindows.length + 1}`,
      domain,
      startDate: startDateIso,
      endDate: endDateIso,
      resolution,
      strength: adjustedStrength,
      confidenceType,
      natalFacts: relevantLords.map(l => ({ planet: l, role: "domain_lord" })),
      dashaFacts: {
        md: { lord: dashaMatch.mdLord, tamil: dashaMatch.mdTamil },
        ad: { lord: dashaMatch.adLord, tamil: dashaMatch.adTamil },
        pd: pdRanking.peakPD ? { lord: pdRanking.peakPD.lord, tamil: pdRanking.peakPD.tamil } : null
      },
      transitFacts: transitConcurrence.slice(0, 5),
      vargaFacts: vargaConfirmations,
      contradictions: contradictions.whyNotStronger || [],
      whySupported,
      whyNotStronger: contradictions.whyNotStronger || [],
      whatPreventsGreaterPrecision: contradictions.whatPreventsGreaterPrecision || [],
      independenceGroups,
      evidenceIds: evidenceNodes.map(n => n.nodeId)
    });

    allWindows.push(window);
  }

  // ── Rank all windows ──
  const { primaryWindows, cautionWindows, bestResolution } = rankAndClassifyWindows(allWindows, domain);

  // ── Natal Promise Gating ──
  let outlook = "INSUFFICIENT_DATA";
  if (natalPromise && (natalPromise.isDenied === true || natalPromise.status === "DENIED")) {
    primaryWindows.length = 0;
    outlook = "NOT_ESTABLISHED";
  } else if (primaryWindows.length > 0) {
    const hasPeakOrStrong = primaryWindows.some(w =>
      w.confidenceType === CONFIDENCE_TYPE.PEAK_CONVERGENCE ||
      w.confidenceType === CONFIDENCE_TYPE.STRONG_CONVERGENCE
    );
    outlook = hasPeakOrStrong ? "SUPPORTED" : "PARTIAL";
  }

  // ── Evaluate sub-phases ──
  const subPhaseResults = evaluateSubPhases(subPhases, subPhaseRules, primaryWindows, canonicalFacts, domain, isTamil, domainConfig);

  // ── Build WHY NOT for domain ──
  const domainWhyNot = {
    whyNotStronger: [],
    whatPreventsGreaterPrecision: []
  };
  for (const w of allWindows) {
    if (w.whyNotStronger) domainWhyNot.whyNotStronger.push(...w.whyNotStronger);
    if (w.whatPreventsGreaterPrecision) domainWhyNot.whatPreventsGreaterPrecision.push(...w.whatPreventsGreaterPrecision);
  }
  // Deduplicate
  domainWhyNot.whyNotStronger = deduplicateByDescription(domainWhyNot.whyNotStronger);
  domainWhyNot.whatPreventsGreaterPrecision = deduplicateByDescription(domainWhyNot.whatPreventsGreaterPrecision);

  const dataCompleteness = calculateDomainCompleteness(canonicalFacts, relevantVargas);

  const result = createDomainResult({
    domain,
    domainLabel,
    domainLabelTamil,
    outlook,
    natalPromise: natalPromise || {},
    primaryWindows,
    cautionWindows,
    subPhases: subPhaseResults,
    whyNot: domainWhyNot,
    evidenceChain: allEvidenceNodes,
    independenceGroups: allIndependenceGroups,
    resolution: bestResolution || RESOLUTION.INSUFFICIENT_DATA,
    meta: {
      dataCompleteness,
      calculationVersion: "5.0.0",
      ruleVersion: "1.0.0",
      ephemerisVersion: canonicalFacts?.ephemerisVersion || "AstronomyEngine/VSOP87"
    }
  });
  result.timingWindows = primaryWindows;
  result.score = primaryWindows.length > 0 ? (primaryWindows[0].strength ? Math.round(primaryWindows[0].strength * 100) : 75) : 50;
  return result;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Builds the list of planet names relevant to a domain
 * based on house lordships and karakas.
 */
function buildRelevantLordsList(canonicalFacts, relevantHouses, relevantKarakas) {
  const lords = new Set();

  // Add house lords
  for (const hNum of relevantHouses) {
    const house = canonicalFacts.houses?.[hNum - 1];
    if (house?.lordName) lords.add(house.lordName);
  }

  // Add primary and secondary karakas
  if (relevantKarakas.primary) {
    for (const k of relevantKarakas.primary) lords.add(k);
  }
  if (relevantKarakas.secondary) {
    for (const k of relevantKarakas.secondary) lords.add(k);
  }

  return [...lords];
}

/**
 * Checks if a dasha period is already covered by existing windows.
 */
function isAlreadyCovered(dashaMatch, existingWindows) {
  if (!Array.isArray(existingWindows) || existingWindows.length === 0) return false;
  return existingWindows.some(ew =>
    ew.mahadashaLord === dashaMatch.mdLord &&
    ew.antardashaLord === dashaMatch.adLord &&
    Math.abs((ew.startAge || 0) - (dashaMatch.startAge || 0)) < 0.5
  );
}

/**
 * Checks if MD/AD lord activates relevant houses in a varga chart.
 */
function checkVargaActivation(vChart, dashaMatch, relevantHouses, domain) {
  if (!vChart?.getPlanet) return false;

  const mdPl = vChart.getPlanet(dashaMatch.mdLord);
  const adPl = vChart.getPlanet(dashaMatch.adLord);

  // Check if MD or AD lord occupies a domain-relevant house in the varga
  const mdInRelevant = mdPl && relevantHouses.includes(mdPl.vargaHouse);
  const adInRelevant = adPl && relevantHouses.includes(adPl.vargaHouse);

  // Check if MD or AD lord is the varga lagna lord or relevant house lord
  const vLagnaRuler = vChart.ascendant?.ruler;
  const mdIsVLagna = dashaMatch.mdLord === vLagnaRuler;
  const adIsVLagna = dashaMatch.adLord === vLagnaRuler;

  return mdInRelevant || adInRelevant || mdIsVLagna || adIsVLagna;
}

/**
 * Adapts an existing window (from calculateMarriageTimingEvents, etc.)
 * into the Expert Mode window format.
 */
function adaptExistingWindow(existingWindow, domain, canonicalFacts, relevantVargas, isTamil) {
  const ew = existingWindow;

  // Map existing classification to confidence type
  let confidenceType = CONFIDENCE_TYPE.CANDIDATE_WINDOW;
  if (ew.classification === "Peak Convergence Window") confidenceType = CONFIDENCE_TYPE.PEAK_CONVERGENCE;
  else if (ew.classification === "Strong Convergence Window") confidenceType = CONFIDENCE_TYPE.STRONG_CONVERGENCE;
  else if (ew.classification === "Primary Activation Window") confidenceType = CONFIDENCE_TYPE.PRIMARY_ACTIVATION;
  else if (ew.classification === "Guarded Period") confidenceType = CONFIDENCE_TYPE.GUARDED_PERIOD;

  // Build WHY supported from existing evidence factors
  const whySupported = (ew.supportingFactors || []).map(f => ({
    description: f,
    descriptionTamil: f // Already bilingual in existing engine
  }));

  return createTimingWindow({
    windowId: ew.windowId || generateDeterministicId(`${domain}_existing`, ew.startDateIso || ew.localStartDate, ew.endDateIso || ew.localEndDate, ew.mahadashaLord, ew.antardashaLord),
    domain,
    startDate: ew.startDateIso || ew.localStartDate || null,
    endDate: ew.endDateIso || ew.localEndDate || null,
    resolution: ew.peakWindow ? RESOLUTION.DATE_RANGE : RESOLUTION.MONTH_RANGE,
    strength: confidenceType === CONFIDENCE_TYPE.PEAK_CONVERGENCE ? 0.9 :
              confidenceType === CONFIDENCE_TYPE.STRONG_CONVERGENCE ? 0.75 :
              confidenceType === CONFIDENCE_TYPE.PRIMARY_ACTIVATION ? 0.6 : 0.4,
    confidenceType,
    dashaFacts: {
      md: { lord: ew.mahadashaLord, tamil: ew.mahadashaLord },
      ad: { lord: ew.antardashaLord, tamil: ew.antardashaLord },
      pd: ew.peakWindow ? { lord: ew.peakWindow.pdLord || ew.peakWindow.lord, tamil: ew.peakWindow.pdLord } : null
    },
    transitFacts: ew.transitConcurrence || [],
    vargaFacts: ew.vargaActivation ? [{ varga: relevantVargas[0], isActivated: true }] : [],
    contradictions: (ew.counterIndicators || []).map(c => ({
      description: c,
      descriptionTamil: c,
      severity: "MEDIUM",
      type: "AFFLICTION"
    })),
    whySupported,
    whyNotStronger: (ew.counterIndicators || []).map(c => ({
      description: c,
      descriptionTamil: c,
      severity: "MEDIUM",
      type: "AFFLICTION"
    })),
    whatPreventsGreaterPrecision: ew.peakWindow ? [] : [{
      description: "Dasha period spans multiple months without PD-level narrowing",
      descriptionTamil: "தசா காலம் PD-நிலை குறுக்கல் இல்லாமல் பல மாதங்கள் நீடிக்கிறது",
      severity: "LOW",
      type: "PRECISION_LIMIT"
    }]
  });
}

/**
 * Calculates domain data completeness based on available astrological facts.
 */
function calculateDomainCompleteness(canonicalFacts, relevantVargas = []) {
  if (!canonicalFacts || typeof canonicalFacts !== 'object') return 0.0;
  let score = 0;
  let total = 6;
  if (canonicalFacts.planets?.length >= 9) score += 1;
  if (canonicalFacts.houses?.length === 12) score += 1;
  if (canonicalFacts.ascendant && canonicalFacts.ascendant.longitude != null) score += 1;
  if (canonicalFacts.dashaTable && canonicalFacts.dashaTable.length > 0) score += 1;
  if (canonicalFacts.timezoneOffsetHours != null && Number.isFinite(canonicalFacts.timezoneOffsetHours)) score += 1;
  
  if (relevantVargas.length === 0) {
    score += 1;
  } else {
    const presentVargas = relevantVargas.filter(v => getVargaChart(canonicalFacts, v) != null).length;
    score += presentVargas / relevantVargas.length;
  }
  return Number((score / total).toFixed(2));
}

/**
 * Evaluates sub-phases based on canonical rules, active window evidence, and astrological context.
 * Each sub-phase is SUPPORTED / NOT_ESTABLISHED / INSUFFICIENT_DATA.
 */
function evaluateSubPhases(subPhases, subPhaseRules, primaryWindows, canonicalFacts, domain, isTamil, domainConfig = {}) {
  const parentWindow = primaryWindows[0] || null;

  // Build active planets, houses, and factors from active window and chart
  const activePlanetsSet = new Set();
  if (parentWindow?.dashaFacts?.md?.lord) activePlanetsSet.add(parentWindow.dashaFacts.md.lord);
  if (parentWindow?.dashaFacts?.ad?.lord) activePlanetsSet.add(parentWindow.dashaFacts.ad.lord);
  if (parentWindow?.dashaFacts?.pd?.lord) activePlanetsSet.add(parentWindow.dashaFacts.pd.lord);
  (parentWindow?.transitFacts || []).forEach(t => {
    const p = t.transitingPlanet || t.planet;
    if (p) activePlanetsSet.add(p);
  });
  (parentWindow?.natalFacts || []).forEach(f => {
    if (f.planet) activePlanetsSet.add(f.planet);
  });

  const activeHousesSet = new Set();
  for (let h = 1; h <= 12; h++) {
    const l = canonicalFacts?.houseLords?.[h] || canonicalFacts?.houses?.[h - 1]?.lordName;
    if (l && activePlanetsSet.has(l)) activeHousesSet.add(h);
  }
  (canonicalFacts?.planets || []).forEach(pl => {
    if (activePlanetsSet.has(pl.name) && pl.house) activeHousesSet.add(pl.house);
  });
  (parentWindow?.transitFacts || []).forEach(t => {
    if (t.house) activeHousesSet.add(t.house);
    if (t.targetHouse) activeHousesSet.add(t.targetHouse);
  });

  const activeFactorsSet = new Set([...activePlanetsSet]);
  activeHousesSet.forEach(h => activeFactorsSet.add(`H${h}`));
  const houseLords = canonicalFacts?.houseLords || {};
  Object.entries(houseLords).forEach(([hNum, lord]) => {
    if (activeHousesSet.has(Number(hNum))) activeFactorsSet.add(lord);
  });

  const subPhaseContext = {
    domain,
    canonicalFacts,
    facts: canonicalFacts,
    parentWindow,
    window: parentWindow || {},
    primaryWindows,
    relevantHouses: domainConfig.relevantHouses || DOMAIN_HOUSES[domain] || [],
    relevantHouseLords: (domainConfig.relevantHouses || []).map(h => canonicalFacts?.houseLords?.[h]).filter(Boolean),
    relevantKarakas: domainConfig.relevantKarakas || DOMAIN_KARAKAS[domain] || { primary: [], secondary: [] },
    activePlanets: Array.from(activePlanetsSet),
    activeHouses: Array.from(activeHousesSet),
    activeFactors: Array.from(activeFactorsSet),
    activeDasha: {
      md: parentWindow?.dashaFacts?.md || null,
      ad: parentWindow?.dashaFacts?.ad || null,
      pd: parentWindow?.dashaFacts?.pd || null
    },
    transitFacts: parentWindow?.transitFacts || [],
    vargaFacts: parentWindow?.vargaFacts || [],
    contradictions: parentWindow?.contradictions || [],
    whySupported: parentWindow?.whySupported || [],
    whyNotStronger: parentWindow?.whyNotStronger || [],
    timingStart: parentWindow?.startDate || null,
    timingEnd: parentWindow?.endDate || null,
    startDate: parentWindow?.startDate || null,
    endDate: parentWindow?.endDate || null,
    age: canonicalFacts?.age || null,
    isTamil
  };

  // Support legacy analyzeSubPhases if present on config
  let legacyAnalyzed = null;
  if (typeof domainConfig.analyzeSubPhases === 'function') {
    try {
      legacyAnalyzed = domainConfig.analyzeSubPhases(parentWindow || {}, canonicalFacts);
    } catch (_) {}
  }

  return subPhases.map(phaseId => {
    const rule = subPhaseRules?.[phaseId];
    let status = SUB_PHASE_STATUS.NOT_ESTABLISHED;
    let window = null;
    let label = humanizePhaseId(phaseId, false);
    let labelTamil = humanizePhaseId(phaseId, true);
    let why = [];
    let whyNot = [];
    let strength = 0;
    let resolution = parentWindow?.resolution || RESOLUTION.DATE_RANGE;

    let evaluation = null;
    if (rule) {
      if (typeof rule.evaluate === "function") {
        try {
          evaluation = rule.evaluate({ context: subPhaseContext, parentWindow, canonicalFacts });
        } catch (_) {}
        if (!evaluation || !evaluation.status) {
          try {
            evaluation = rule.evaluate(subPhaseContext);
          } catch (_) {}
        }
        if (!evaluation || !evaluation.status) {
          try {
            evaluation = rule.evaluate(primaryWindows, canonicalFacts, isTamil);
          } catch (_) {}
        }
      } else if (typeof rule === "function") {
        try {
          evaluation = rule({ context: subPhaseContext, parentWindow, canonicalFacts });
        } catch (_) {}
        if (!evaluation || !evaluation.status) {
          try {
            evaluation = rule(subPhaseContext);
          } catch (_) {}
        }
        if (!evaluation || !evaluation.status) {
          try {
            evaluation = rule(primaryWindows, canonicalFacts, isTamil);
          } catch (_) {}
        }
      }
    }

    // Fallback to legacy analyzeSubPhases result if no rule matched
    if (!evaluation && legacyAnalyzed) {
      evaluation = legacyAnalyzed[phaseId] || legacyAnalyzed[subPhases.indexOf(phaseId)];
    }

    if (evaluation) {
      status = evaluation.status || evaluation.level || SUB_PHASE_STATUS.NOT_ESTABLISHED;
      window = evaluation.window || (status === SUB_PHASE_STATUS.SUPPORTED ? parentWindow : null);
      label = evaluation.label || label;
      labelTamil = evaluation.labelTamil || labelTamil;
      strength = evaluation.strength != null ? evaluation.strength : (status === SUB_PHASE_STATUS.SUPPORTED ? (parentWindow?.strength || 0.75) : 0);
      resolution = evaluation.resolution || (window?.resolution || resolution);
      
      const rawWhy = evaluation.why || evaluation.whySupported || evaluation.evidence;
      why = Array.isArray(rawWhy) ? rawWhy : (rawWhy ? [rawWhy] : []);
      const rawWhyNot = evaluation.whyNot || evaluation.whyNotStronger;
      whyNot = Array.isArray(rawWhyNot) ? rawWhyNot : (rawWhyNot ? [rawWhyNot] : []);
    } else if (primaryWindows.length > 0) {
      status = SUB_PHASE_STATUS.NOT_ESTABLISHED;
    } else {
      status = SUB_PHASE_STATUS.INSUFFICIENT_DATA;
    }

    return {
      subPhaseId: phaseId,
      status,
      label,
      labelTamil,
      window,
      strength: Math.max(0, Math.min(1, strength)),
      resolution,
      whySupported: why,
      whyNotStronger: whyNot
    };
  });
}

function humanizePhaseId(phaseId, isTamil) {
  // Convert camelCase to readable
  const readable = phaseId.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim();
  return readable; // Tamil humanization would require a lookup table
}

function deduplicateByDescription(items) {
  const seen = new Set();
  return (items || []).filter(item => {
    const key = item.description || item.factorId || JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
