/**
 * ASTROVERSE — Follow-Up Report Context Builder (Strict Anti-Fabrication)
 *
 * Constructs a normalized, comprehensive context object from the already-generated
 * horoscope report. Extracts the genuine active section data and cross-domain findings.
 *
 * ANTI-FABRICATION INVARIANTS:
 * - ZERO fallback defaults (no "Aries", no "Ashwini", no default house 1, no default degree 0)
 * - ZERO synthetic Ashtakavarga 337 bindus (returns null if uncalculated)
 * - ZERO synthetic C01-W06 evidence IDs (returns empty array if uncalculated)
 * - Strict nullability: uncalculated features are represented as null or empty arrays.
 */

import { getSystemConfig } from "../config/astrologySystems.js";
import { getChapterById } from "../config/reportChapters.js";

/**
 * Extracts complete, granular data for any specified report chapter
 */
export function extractChapterData(chapterId, chartData, lang = "en", multiSystemBundle = null) {
  if (!chartData) return null;
  const isTamil = lang === "ta";

  switch (chapterId) {
    case "execSummary": {
      const raw = chartData.executiveSummary || null;
      if (!raw) return null;
      return {
        coreProfile: raw.coreProfile || null,
        strongestThemes: raw.strongestThemes || [],
        currentLifePhase: raw.currentLifePhase || null,
        birthTimeReliability: raw.birthTimeReliability || raw.birthTimeSensitivity || null,
        nextImportantWindows: raw.nextImportantWindows || [],
        keyCautions: raw.keyCautions || []
      };
    }

    case "blueprint": {
      return {
        ascendantSign: chartData.ascendantSign || null,
        moonSign: chartData.moonSign || null,
        sunSign: chartData.sunSign || null,
        moonNakshatra: chartData.moonNakshatra || null,
        sunNakshatra: chartData.sunNakshatra || null,
        nakshatraDispositors: chartData.nakshatraDispositors || null,
        planetaryAvasthas: chartData.planetaryAvasthas || null,
        jaiminiKarakas: chartData.jaiminiKarakas || null,
        atmakaraka: chartData.atmakaraka || null
      };
    }

    case "yogas": {
      const yogas = isTamil
        ? (chartData.detectedYogasTamil || chartData.vedicYogasTamil || chartData.detectedYogas)
        : (chartData.detectedYogas || chartData.vedicYogas);
      if (!yogas || yogas.length === 0) return null;
      return {
        detectedYogas: yogas.map(y => ({
          name: y.name,
          category: y.category,
          definition: y.definition || y.desc,
          manifestation: y.manifestation || null,
          strength: y.strength || null
        }))
      };
    }

    case "bhavas": {
      const bhavas = isTamil ? (chartData.bhavasDetailedTamil || chartData.bhavasDetailed) : chartData.bhavasDetailed;
      if (!bhavas || bhavas.length === 0) return null;
      return {
        bhavasDetailed: bhavas.map(b => ({
          num: b.num,
          title: b.title,
          signName: b.signName,
          lordName: b.lordName,
          lordHouse: b.lordHouse,
          lordDignity: b.lordDignity,
          occupants: b.occupants || [],
          aspectsOnHouse: b.aspectsOnHouse || [],
          prediction: b.prediction || "",
          strengthTier: b.strengthTier || null
        })),
        bhavaChalit: chartData.bhavaChalit || null
      };
    }

    case "health": {
      const dom = (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.health ||
                  (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.wellness || null;
      const risks = (isTamil ? chartData.riskMatrixTamil : chartData.riskMatrix)?.risks || null;
      if (!dom && !risks) return null;
      return {
        domainWellness: dom,
        riskWindows: risks
      };
    }

    case "studies": {
      const dom = (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.studies ||
                  (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.education || null;
      const mPred = (isTamil ? chartData.masterPredictionsTamil : chartData.masterPredictions)?.education || null;
      if (!dom && !mPred) return null;
      return {
        academicThemes: dom,
        examWindows: mPred?.windows || []
      };
    }

    case "career": {
      const pathway = (isTamil ? chartData.careerPathwayTamil : chartData.careerPathway) || null;
      const dom = (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.career || null;
      const mPred = (isTamil ? chartData.masterPredictionsTamil : chartData.masterPredictions)?.career || null;
      const d10 = chartData.structuredVargas?.D10 || chartData.divisionalCharts?.D10 || chartData.divisionalCharts?.d10Dasamsha || null;
      if (!pathway && !dom && !mPred && !d10) return null;
      return {
        careerDestinyVerdict: pathway?.careerDestinyVerdict || null,
        examObstacleVerdict: pathway?.examObstacleVerdict || null,
        careerWindows: mPred?.windows || [],
        domainSummary: dom?.summary || null,
        d10Chart: d10 ? {
          ascendant: d10.ascendant?.signName || d10.ascendant?.sign || d10.ascendant?.name || (typeof d10.ascendant === "string" ? d10.ascendant : null),
          planets: (d10.planets || []).map(p => ({
            name: p.name,
            sign: p.signName || p.sign,
            house: p.house || p.vargaHouse,
            dignity: p.dignity
          }))
        } : null
      };
    }

    case "property": {
      const dom = (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.property || null;
      const mPred = (isTamil ? chartData.masterPredictionsTamil : chartData.masterPredictions)?.property || null;
      const d4 = chartData.structuredVargas?.D4 || chartData.divisionalCharts?.d4Chaturthamsha || null;
      if (!dom && !mPred && !d4) return null;
      return {
        propertySummary: dom?.summary || null,
        acquisitionWindows: mPred?.windows || [],
        d4Ascendant: d4?.ascendant || null
      };
    }

    case "politics": {
      const dom = (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.politics || null;
      if (!dom) return null;
      return {
        governanceThemes: dom
      };
    }

    case "relationships": {
      const pathway = (isTamil ? chartData.marriagePathwayTamil : chartData.marriagePathway) || null;
      const dom = (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.relationship ||
                  (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.marriage || null;
      const mPred = (isTamil ? chartData.masterPredictionsTamil : chartData.masterPredictions)?.marriage || null;
      const d9 = chartData.structuredVargas?.D9 || chartData.divisionalCharts?.D9 || chartData.divisionalCharts?.d9Navamsha || null;
      if (!pathway && !dom && !mPred && !d9) return null;
      return {
        marriageVerdict: pathway?.verdict || null,
        spouseProfile: pathway?.spouseProfile || null,
        marriageWindows: mPred?.windows || [],
        auspiciousYears: pathway?.auspiciousAgeRange ? `${pathway.auspiciousAgeRange} (${pathway.calendarYears || ''})` : null,
        d9Chart: d9 ? {
          ascendant: d9.ascendant?.signName || d9.ascendant?.sign || d9.ascendant?.name || (typeof d9.ascendant === "string" ? d9.ascendant : null),
          planets: (d9.planets || []).map(p => ({
            name: p.name,
            sign: p.signName || p.sign,
            house: p.house || p.vargaHouse,
            dignity: p.dignity
          }))
        } : null
      };
    }

    case "panchanga": {
      const pan = isTamil ? (chartData.panchangaTamil || chartData.panchanga) : chartData.panchanga;
      if (!pan) return null;
      return {
        vara: pan.vara || pan.day || null,
        tithi: pan.tithi || null,
        nakshatra: pan.nakshatra || null,
        yoga: pan.yoga || null,
        karana: pan.karana || null,
        sunrise: pan.sunrise || null,
        sunset: pan.sunset || null,
        rahuKalam: pan.rahuKalam || null,
        gulikaKalam: pan.gulikaKalam || null,
        yamagandam: pan.yamagandam || null
      };
    }

    case "palmistry": {
      const palm = isTamil ? (chartData.palmistryAnalysisTamil || chartData.palmistryAnalysis || chartData.palmistry) : (chartData.palmistryAnalysis || chartData.palmistry);
      if (!palm) return null;
      return {
        handShape: palm.handShape || null,
        majorLines: palm.majorLines || null,
        mounts: palm.mounts || null,
        findings: palm.findings || []
      };
    }

    case "foreign": {
      const dom = (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.foreignMoksha ||
                  (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.travel || null;
      if (!dom) return null;
      return {
        foreignTravelSummary: dom
      };
    }

    case "dosha": {
      const dosha = isTamil ? (chartData.tridoshaBalanceTamil || chartData.tridoshaBalance) : chartData.tridoshaBalance;
      if (!dosha) return null;
      return {
        primaryDosha: dosha.primaryDosha || null,
        secondaryDosha: dosha.secondaryDosha || null,
        elementalDistribution: dosha.elementalDistribution || null,
        guidance: {
          vata: dosha.vata?.guidance || null,
          pitta: dosha.pitta?.guidance || null,
          kapha: dosha.kapha?.guidance || null
        }
      };
    }

    case "remedies": {
      const rem = isTamil ? (chartData.personalizedRemediesTamil || chartData.personalizedRemedies) : chartData.personalizedRemedies;
      if (!rem) return null;
      return {
        primaryGemstone: rem.primaryGemstone || null,
        gemLord: rem.gemLord || null,
        recommendedGemstones: rem.gemstonePrescription || [],
        contraindicatedGemstones: rem.contraindicatedGemstones || [],
        mantra: rem.mantra || null,
        charity: rem.charity || null
      };
    }

    case "auspicious": {
      const ausp = isTamil ? (chartData.auspiciousTimelinesTamil || chartData.auspiciousTimelines) : chartData.auspiciousTimelines;
      if (!ausp) return null;
      return {
        auspiciousWindows: ausp
      };
    }

    case "risks": {
      const risk = isTamil ? (chartData.riskMatrixTamil || chartData.riskMatrix) : chartData.riskMatrix;
      if (!risk?.risks) return null;
      return {
        vulnerabilityWindows: risk.risks.map(r => ({
          title: r.title,
          cautionLevel: r.traditionalCautionLevel,
          ageRange: r.traditionalCautionWindowAge,
          years: r.traditionalCautionCalendarYears,
          protectiveRemedy: r.protectiveRemedy
        }))
      };
    }

    case "timeline": {
      const timeline = (isTamil ? (chartData.chronologicalDashaTimelineTamil || chartData.vimshottariCycleTimelineTamil) : (chartData.chronologicalDashaTimeline || chartData.vimshottariCycleTimeline)) || chartData.timeline;
      const stages = Array.isArray(timeline) ? timeline : (timeline?.stages || []);
      if (!stages || stages.length === 0) return null;
      return {
        timelineStages: stages.slice(0, 10).map(s => ({
          stageNum: s.stageNum,
          ageRange: s.ageRange,
          calendarYears: s.calendarYears,
          dashaTrigger: s.dashaTrigger,
          primaryTheme: s.primaryTheme || s.title,
          transits: s.transitCrossings || []
        }))
      };
    }

    case "milestoneAudit": {
      const retro = isTamil ? (chartData.retrospectiveLifeAuditTamil || chartData.retrospectiveMilestonesTamil) : (chartData.retrospectiveLifeAudit || chartData.retrospectiveMilestones);
      const list = Array.isArray(retro) ? retro : (retro?.milestones || []);
      if (!list || list.length === 0) return null;
      return {
        retrospectiveMilestones: list.slice(0, 8).map(m => ({
          id: m.milestoneId,
          ageRange: m.ageRange,
          years: m.calendarYears,
          theme: m.milestoneTheme,
          prompt: m.verificationPrompt
        }))
      };
    }

    case "reasoningDossier": {
      const pkg = chartData.reportEvidencePackage?.predictionReasoningChain || chartData.reasoningDossier || null;
      if (!pkg) return null;
      return {
        chains: pkg
      };
    }

    case "technicalAppendix": {
      return {
        shadbala: Array.isArray(chartData.shadbala) ? chartData.shadbala : null,
        ashtakavarga: chartData.ashtakavarga ? {
          totalBindus: typeof chartData.ashtakavarga.totalBindus === "number" ? chartData.ashtakavarga.totalBindus : null,
          strongestHouse: chartData.ashtakavarga.strongestHouse || null,
          savTotals: chartData.ashtakavarga.savTotals || null,
          bavTables: chartData.ashtakavarga.bavTables || null
        } : null,
        conventions: chartData.conventions || null
      };
    }

    case "multiSystemComparison": {
      const comp = multiSystemBundle?.comparison || chartData.multiSystemBundle?.comparison || null;
      if (!comp) return null;
      return {
        comparedPoints: comp.totalComparedPoints ?? comp.summary?.totalPoints ?? null,
        agreementCount: comp.agreementCount ?? comp.summary?.agreementCount ?? null,
        classifications: comp.classifications || null,
        techniqueMatrix: comp.techniqueMatrix || null
      };
    }

    default:
      return null;
  }
}

/**
 * Builds the canonical context object for answering follow-up questions
 */
export function buildFollowUpContext({
  chartData,
  activeSection = "fullReport",
  systemId = null,
  multiSystemBundle = null,
  lang = null
}) {
  if (!chartData) {
    throw new Error("chartData is required to build follow-up context.");
  }

  const effectiveLang = (
    lang === "ta" ||
    chartData.lang === "ta" ||
    chartData.userLanguage === "ta" ||
    chartData.profile?.lang === "ta" ||
    Boolean(chartData.domainPredictionsTamil)
  ) ? "ta" : (lang || "en");

  const isTamil = effectiveLang === "ta";
  const effectiveSystemId = (
    systemId ||
    chartData.system?.id ||
    chartData.system ||
    chartData.profile?.system ||
    "lahiri"
  ).toLowerCase();

  const systemConfig = getSystemConfig(effectiveSystemId);
  const isTropical = effectiveSystemId === "tropical" || effectiveSystemId === "sayana" || effectiveSystemId === "western";
  const isKP = effectiveSystemId === "kp";

  // 1. Profile Metadata (strictly sanitized, no PII leakage)
  const profile = {
    birthDate: chartData.birthDateStr || chartData.birthDate || chartData.date || null,
    birthTime: chartData.birthTimeStr || chartData.birthTime || chartData.time || null,
    location: chartData.location || chartData.place || chartData.city || null,
    timezoneId: chartData.timezoneId || chartData.profile?.timezoneId || null,
    utcOffset: chartData.utcOffset ?? chartData.tz ?? chartData.profile?.utcOffset ?? null
  };

  // 2. System Configuration
  const system = {
    id: systemConfig.id,
    name: systemConfig.name,
    tamilName: systemConfig.tamilName,
    zodiacType: systemConfig.zodiacType,
    ayanamshaType: systemConfig.ayanamshaType,
    defaultHouseSystem: systemConfig.defaultHouseSystem,
    applicableTechniques: systemConfig.applicableTechniques,
    inapplicableTechniques: systemConfig.inapplicableTechniques
  };

  // 3. Strict, Non-Fabricated Chart Facts
  const planets = (chartData.planets || []).map(p => ({
    name: p.name,
    sign: p.signName || p.sign || null,
    house: typeof p.house === "number" ? p.house : null,
    degreeInSign: typeof p.degreeInSign === "number" 
      ? Number(p.degreeInSign.toFixed(2)) 
      : (typeof p.longitude === "number" ? Number((p.longitude % 30).toFixed(2)) : null),
    isRetrograde: Boolean(p.isRetrograde ?? p.retrograde),
    isCombust: Boolean(p.isCombust ?? p.combust),
    dignity: p.dignity || null,
    starLord: p.starLord || null,
    subLord: p.subLord || null,
    subSubLord: p.subSubLord || null
  }));

  // Ascendant: strictly null if uncalculated
  let ascendant = null;
  const rawAscSign = chartData.ascendantSign?.name || chartData.ascendant?.sign || chartData.ascendant?.signName || null;
  if (rawAscSign) {
    const rawDeg = typeof chartData.ascendant?.degreeInSign === "number"
      ? Number(chartData.ascendant.degreeInSign.toFixed(2))
      : (typeof chartData.ascendant?.longitude === "number" ? Number((chartData.ascendant.longitude % 30).toFixed(2)) : (typeof chartData.ascendantLong === "number" ? Number((chartData.ascendantLong % 30).toFixed(2)) : null));
    ascendant = {
      sign: rawAscSign,
      degree: rawDeg,
      nakshatra: chartData.ascendant?.nakshatra || chartData.ascendantSign?.nakshatra || null,
      pada: chartData.ascendant?.pada || chartData.ascendantSign?.pada || null
    };
  }

  // Moon: strictly null if uncalculated
  let moon = null;
  const rawMoonSign = chartData.moonSign?.name || chartData.moon?.sign || chartData.moon?.signName || null;
  if (rawMoonSign) {
    moon = {
      sign: rawMoonSign,
      nakshatra: chartData.moonNakshatra?.name || chartData.moon?.nakshatra || null,
      pada: chartData.moonNakshatra?.pada ?? chartData.moon?.pada ?? null,
      degree: typeof chartData.moon?.degreeInSign === "number" ? Number(chartData.moon.degreeInSign.toFixed(2)) : null
    };
  }

  // Sun: strictly null if uncalculated
  let sun = null;
  const rawSunSign = chartData.sunSign?.name || chartData.sun?.sign || chartData.sun?.signName || null;
  if (rawSunSign) {
    sun = {
      sign: rawSunSign,
      degree: typeof chartData.sun?.degreeInSign === "number" ? Number(chartData.sun.degreeInSign.toFixed(2)) : null
    };
  }

  // Current Dasha (strictly null for Tropical or if uncalculated)
  let currentDasha = null;
  if (!isTropical) {
    const rawCur = chartData.currentDasha || (chartData.dashaTable || []).find(d => d.isCurrent);
    if (rawCur && rawCur.lord) {
      currentDasha = {
        lord: rawCur.lord,
        tamil: rawCur.tamil || rawCur.lord,
        startAge: typeof rawCur.startAge === "number" ? rawCur.startAge : null,
        endAge: typeof rawCur.endAge === "number" ? rawCur.endAge : null,
        subLord: chartData.pratyantardasha?.subLord || rawCur.subLord || null,
        startDate: rawCur.startDate || null,
        endDate: rawCur.endDate || null
      };
    }
  }

  // KP Specific data (cusps, sub lords, significators)
  const kpCusps = isKP && Array.isArray(chartData.houses)
    ? chartData.houses.map(h => ({
        house: h.house,
        longitude: typeof h.longitude === "number" ? Number(h.longitude.toFixed(2)) : null,
        sign: h.signName || h.sign || null,
        starLord: h.starLord || null,
        subLord: h.subLord || null,
        subSubLord: h.subSubLord || null
      }))
    : [];

  const kpSubLords = {};
  if (isKP && kpCusps.length > 0) {
    kpCusps.forEach(c => {
      if (c.subLord) kpSubLords[`cusp_${c.house}`] = c.subLord;
    });
  }

  const kpSignificators = isKP && chartData.significators ? chartData.significators : null;
  const kpRulingPlanets = isKP && chartData.rulingPlanets ? chartData.rulingPlanets : null;

  // Western Aspects (for Tropical or comparison)
  const aspects = (isTropical || chartData.aspects) ? (chartData.aspects || []).slice(0, 15) : [];

  // Yogas (strictly Vedic)
  const yogas = (!isTropical && chartData.detectedYogas)
    ? chartData.detectedYogas.map(y => ({
        name: y.name,
        category: y.category,
        desc: y.desc || y.definition || "",
        manifestation: y.manifestation || null
      }))
    : [];

  // Shadbala (strictly Vedic, no fake numbers)
  const shadbala = (!isTropical && Array.isArray(chartData.shadbala))
    ? chartData.shadbala.map(s => ({
        planet: s.planet,
        totalRupas: s.totalRupas,
        requiredRupas: s.requiredRupas,
        ratio: s.ratio,
        status: s.status
      }))
    : [];

  // Ashtakavarga: STRICTLY NULL IF NOT CALCULATED (zero 337 fallback!)
  let ashtakavarga = null;
  if (!isTropical && chartData.ashtakavarga) {
    const rawTotal = chartData.ashtakavarga.totalBindus;
    ashtakavarga = {
      totalBindus: typeof rawTotal === "number" ? rawTotal : null,
      strongestHouse: chartData.ashtakavarga.strongestHouse || null,
      savTotals: chartData.ashtakavarga.savTotals || null,
      bavTables: chartData.ashtakavarga.bavTables || null
    };
  }

  // Structured Vargas (D1 through D60)
  const rawD9 = (!isTropical && (chartData.structuredVargas?.D9 || chartData.divisionalCharts?.D9 || chartData.divisionalCharts?.d9Navamsha)) || null;
  const rawD10 = (!isTropical && (chartData.structuredVargas?.D10 || chartData.divisionalCharts?.D10 || chartData.divisionalCharts?.d10Dasamsha)) || null;

  const vargas = (!isTropical && (rawD9 || rawD10))
    ? {
        d9: rawD9 ? {
          ascendant: rawD9.ascendant?.signName || rawD9.ascendant?.sign || rawD9.ascendant?.name || (typeof rawD9.ascendant === "string" ? rawD9.ascendant : null),
          planets: (rawD9.planets || []).map(p => ({
            name: p.name,
            sign: p.signName || p.sign,
            house: p.house || p.vargaHouse,
            dignity: p.dignity
          }))
        } : null,
        d10: rawD10 ? {
          ascendant: rawD10.ascendant?.signName || rawD10.ascendant?.sign || rawD10.ascendant?.name || (typeof rawD10.ascendant === "string" ? rawD10.ascendant : null),
          planets: (rawD10.planets || []).map(p => ({
            name: p.name,
            sign: p.signName || p.sign,
            house: p.house || p.vargaHouse,
            dignity: p.dignity
          }))
        } : null
      }
    : null;

  // Jaimini Atmakaraka
  const atmakaraka = (!isTropical && (chartData.atmakaraka || (chartData.jaiminiKarakas && chartData.jaiminiKarakas[0]))) || null;

  // 4. Genuine Active Section Content & All Sections Registry
  const activeChapter = getChapterById(activeSection);
  const activeSectionData = extractChapterData(activeSection, chartData, lang, multiSystemBundle);

  // Cross-domain core findings
  const domain = (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions) || {};
  const careerPathway = (isTamil ? chartData.careerPathwayTamil : chartData.careerPathway) || {};
  const marriagePathway = (isTamil ? chartData.marriagePathwayTamil : chartData.marriagePathway) || {};
  const masterPreds = (isTamil ? chartData.masterPredictionsTamil : chartData.masterPredictions) || {};
  const riskMatrix = (isTamil ? chartData.riskMatrixTamil : chartData.riskMatrix) || {};
  const remedies = (isTamil ? chartData.personalizedRemediesTamil : chartData.personalizedRemedies) || {};

  // 5. Genuine Evidence IDs (STRICTLY NO SYNTHETIC FALLBACKS)
  const availableEvidenceIds = new Set();
  const reasoningLevels = [];

  // Extract from reasoningDossier if calculated
  if (chartData.reasoningDossier?.chains) {
    Object.values(chartData.reasoningDossier.chains).forEach(chain => {
      (chain.levels || []).forEach(lvl => {
        if (lvl.evidenceId) availableEvidenceIds.add(lvl.evidenceId);
        reasoningLevels.push(lvl);
      });
    });
  }

  // Extract from reportEvidencePackage if calculated
  if (chartData.reportEvidencePackage?.predictionReasoningChain) {
    Object.values(chartData.reportEvidencePackage.predictionReasoningChain).forEach(chain => {
      (chain.levels || []).forEach(lvl => {
        if (lvl.evidenceId) availableEvidenceIds.add(lvl.evidenceId);
        reasoningLevels.push(lvl);
      });
    });
  }

  // Extract from evidenceLedger if calculated
  const rawLedger = (isTamil ? chartData.evidenceLedgerTamil : chartData.evidenceLedger) || null;
  if (rawLedger) {
    Object.values(rawLedger).forEach(domData => {
      if (domData.evidenceId) availableEvidenceIds.add(domData.evidenceId);
      if (Array.isArray(domData.supportingFactors)) {
        domData.supportingFactors.forEach(f => {
          const match = f.match(/^([A-Z]\d{2}):/);
          if (match) availableEvidenceIds.add(match[1]);
        });
      }
      if (Array.isArray(domData.counterIndicators)) {
        domData.counterIndicators.forEach(f => {
          const match = f.match(/^([A-Z]\d{2}):/);
          if (match) availableEvidenceIds.add(match[1]);
        });
      }
    });
  }

  return {
    lang,
    profile,
    system,
    chart: {
      ascendant,
      moon,
      sun,
      planets,
      currentDasha,
      kpCusps,
      kpSubLords,
      kpSignificators,
      kpRulingPlanets,
      aspects,
      yogas,
      shadbala,
      ashtakavarga,
      vargas,
      allVargas: (!isTropical && (chartData.structuredVargas || chartData.divisionalCharts)) || null,
      panchanga: (isTamil ? (chartData.panchangaTamil || chartData.panchanga) : chartData.panchanga) || chartData.panchang || null,
      jaimini: (!isTropical && (chartData.jaiminiKarakas || chartData.jaimini)) || null,
      avasthas: (!isTropical && (chartData.planetaryAvasthas || chartData.avasthas)) || null,
      dispositors: (!isTropical && chartData.nakshatraDispositors) || null,
      transits: chartData.transits || chartData.upcomingTransits || chartData.transitCrossings || null,
      timeline: (isTamil ? (chartData.chronologicalDashaTimelineTamil || chartData.vimshottariCycleTimelineTamil || chartData.timelineTamil) : (chartData.chronologicalDashaTimeline || chartData.vimshottariCycleTimeline || chartData.timeline)) || null,
      dashaTable: chartData.dashaTable || [],
      birthYear: chartData.birthYear ?? (chartData.birthDateStr ? parseInt(chartData.birthDateStr.slice(0, 4), 10) : null) ?? (chartData.birthDate ? parseInt(String(chartData.birthDate).slice(0, 4), 10) : null) ?? null,
      bhavasDetailed: (isTamil ? chartData.bhavasDetailedTamil : chartData.bhavasDetailed) || chartData.bhavasDetailed || [],
      milestones: (isTamil ? (chartData.retrospectiveLifeAuditTamil || chartData.retrospectiveMilestonesTamil) : (chartData.retrospectiveLifeAudit || chartData.retrospectiveMilestones)) || null,
      palmistry: (isTamil ? (chartData.palmistryAnalysisTamil || chartData.palmistryTamil) : (chartData.palmistryAnalysis || chartData.palmistry)) || chartData.palmistryAnalysis || chartData.palmistry || null,
      ayanamshaValue: chartData.ayanamshaValue ?? chartData.ayanamsa ?? null,
      birthDateStr: chartData.birthDateStr || null,
      birthTimeStr: chartData.birthTimeStr || null,
      birthDate: chartData.birthDate || null,
      date: chartData.date || null,
      birthTime: chartData.birthTime || chartData.time || null,
      latitude: chartData.birthLatitude ?? chartData.latitude ?? chartData.lat ?? null,
      longitude: chartData.birthLongitude ?? chartData.longitude ?? chartData.lng ?? null,
      timezoneId: chartData.timezoneId || chartData.tz || null,
      utcOffset: chartData.utcOffset ?? null,
      system: chartData.system || null,
      multiSystemBundle: multiSystemBundle || chartData.multiSystemBundle || null,
      atmakaraka: atmakaraka ? {
        planet: atmakaraka.planet || atmakaraka.name,
        sign: atmakaraka.sign || null,
        house: atmakaraka.house || null,
        degreeInSign: atmakaraka.degInSign || atmakaraka.degreeInSign || null
      } : null
    },
    report: {
      activeSectionId: activeSection,
      activeSectionTitle: activeChapter?.title || (activeSection === "fullReport" ? "Full Report General" : activeSection),
      activeSectionData,
      executiveSummary: chartData.executiveSummary || null,
      career: {
        destiny: careerPathway.careerDestinyVerdict || domain.career?.summary || null,
        windows: masterPreds.career?.windows || []
      },
      marriage: {
        verdict: marriagePathway.verdict || domain.relationship?.summary || domain.marriage?.summary || null,
        windows: masterPreds.marriage?.windows || []
      },
      wealth: {
        summary: domain.wealth?.summary || domain.property?.summary || null,
        windows: masterPreds.property?.windows || []
      },
      wellness: {
        summary: domain.health?.summary || domain.wellness?.summary || null,
        risks: riskMatrix.risks || []
      },
      studies: {
        academicThemes: (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.studies ||
                        (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.education || null,
        windows: masterPreds.education?.windows || []
      },
      politics: {
        summary: (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.politics || null
      },
      foreign: {
        summary: (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.foreignMoksha ||
                 (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions)?.travel || null
      },
      remedies: {
        primaryGemstone: remedies.primaryGemstone || null,
        gemLord: remedies.gemLord || null,
        contraindicatedGemstones: remedies.contraindicatedGemstones || [],
        mantra: remedies.mantra || null
      }
    },
    evidence: {
      evidenceIds: Array.from(availableEvidenceIds),
      reasoningLevels: reasoningLevels.slice(0, 18),
      ledger: rawLedger
    },
    multiSystemBundle: multiSystemBundle || chartData.multiSystemBundle || null,
    multiSystemAvailable: Boolean(multiSystemBundle || chartData.multiSystemBundle),
    multiSystemComparison: (multiSystemBundle?.comparison || chartData.multiSystemBundle?.comparison) || null
  };
}
