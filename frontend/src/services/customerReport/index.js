/**
 * ASTROVERSE — Customer Life Intelligence Report Service
 * ========================================================
 * Unified entry point orchestrating the complete customer report pipeline:
 *
 * Deterministic Astrology Engine
 *         ↓
 * Structured Chart Facts
 *         ↓
 * Evidence Chain Builder
 *         ↓
 * Domain Analysis Engine (All 17 Domains)
 *         ↓
 * Timing Engine & Current Period Engine
 *         ↓
 * Resolution / Empirical Gate
 *         ↓
 * Safety Gate (Non-Clinical / Non-Guarantee)
 *         ↓
 * Anti-Repetition Diversifier
 *         ↓
 * Customer Narrative Generator
 *         ↓
 * 16-Check Report Validator
 *         ↓
 * Certified LifeReportModel
 */

import { createLifeReportModel } from "./lifeReportModel.js";
import { generateAll17DomainReports } from "./domainReportEngine.js";
import { calculateCurrentLifePhase } from "./currentPeriodEngine.js";
import { buildMilestoneLifeTimeline } from "./milestoneTimelineEngine.js";
import { diversifyDomainReports } from "./antiRepetitionEngine.js";
import { applyReportSafetyGate } from "./reportSafetyGate.js";
import { generateAlgorithmicNarrative } from "./customerNarrativeEngine.js";
import { validateLifeReport } from "./reportValidator.js";
import { extractCanonicalFacts } from "../expertPrediction/canonicalFactAdapter.js";
import { generateChartFingerprint, ZODIAC_SIGNS } from "../astroEngine.js";

// Re-export key components for clean public API
export * from "./lifeReportModel.js";
export * from "./domainReportEngine.js";
export * from "./currentPeriodEngine.js";
export * from "./milestoneTimelineEngine.js";
export * from "./antiRepetitionEngine.js";
export * from "./reportSafetyGate.js";
export * from "./customerNarrativeEngine.js";
export * from "./reportValidator.js";

/**
 * Generates an authoritative, certified LifeReportModel for a customer chart.
 *
 * @param {Object} chartData - Complete chart data from calculateChartBySystem()
 * @param {Object} [options={}] - Options { lang: "en" | "ta", currentDate: Date, clientName: string }
 * @returns {Object} Certified LifeReportModel with validation audit
 */
export function generateLifeIntelligenceReport(chartData, options = {}) {
  const lang = options.lang || "en";
  const isTamil = lang === "ta";
  const currentDate = options.currentDate || new Date();
  const clientName = options.clientName || chartData.clientName || (isTamil ? "மதிப்பிற்குரிய ஜாதகர்" : "Valued Client");

  if (!chartData || !Array.isArray(chartData.planets)) {
    throw new Error("Invalid or missing chartData provided to generateLifeIntelligenceReport.");
  }

  const canonicalFacts = extractCanonicalFacts(chartData, lang);

  // 1. Client Profile & Calculation Metadata
  const clientProfile = {
    name: clientName,
    gender: chartData.gender || "unspecified",
    birthDate: chartData.birthDateStr || chartData.birthDate || "N/A",
    birthTime: chartData.birthTimeStr || chartData.birthTime || "N/A",
    birthPlace: chartData.birthPlace || chartData.locationName || "N/A",
    latitude: chartData.latitude ?? chartData.lat ?? null,
    longitude: chartData.longitude ?? chartData.lng ?? null,
    timezone: chartData.timezoneId || chartData.ianaTimezone || chartData.tz || "Asia/Kolkata"
  };

  const reportFingerprint = generateChartFingerprint ? generateChartFingerprint(chartData) : "CANONICAL_FINGERPRINT";

  const calculationMetadata = {
    ayanamsha: "Lahiri (Chitra Paksha)",
    ephemeris: "AstronomyEngine/VSOP87",
    calculationEngine: "ASTROVERSE Core v4.2.0",
    generatedAt: new Date().toISOString(),
    reportFingerprint,
    releaseVersion: "3.0.0",
    modelVersion: "2.2.0",
    schemaVersion: "3.0",
    lang
  };

  // 2. Data Quality Panel (Section 32)
  const planetsCount = chartData.planets.length;
  const housesCount = chartData.houses?.length || 12;
  const completenessScore = parseFloat(Math.min(1.0, (planetsCount / 9) * 0.6 + (housesCount / 12) * 0.4).toFixed(2));

  const dataQuality = {
    birthDate: clientProfile.birthDate,
    birthTime: clientProfile.birthTime,
    birthLocation: clientProfile.birthPlace,
    latitude: clientProfile.latitude,
    longitude: clientProfile.longitude,
    timezone: clientProfile.timezone,
    ayanamsha: calculationMetadata.ayanamsha,
    ephemeris: calculationMetadata.ephemeris,
    calculationEngine: calculationMetadata.calculationEngine,
    birthTimeSensitivity: {
      d60Sensitivity: "~2 minutes",
      d9Sensitivity: "~13.3 minutes",
      boundaryProximityAlert: Boolean(chartData.ascendantLong && (chartData.ascendantLong % 30 < 1.0 || chartData.ascendantLong % 30 > 29.0))
    },
    completenessScore,
    completenessLabel: completenessScore >= 0.9 ? "EXCELLENT" : (completenessScore >= 0.7 ? "GOOD" : "PARTIAL")
  };

  // 3. Core Natal Profile
  const ascLong = canonicalFacts.ascendantLong || 0;
  const ascSignIdx = canonicalFacts.ascendantSignIdx || 0;
  const moonLong = canonicalFacts.moonLong || 0;
  const moonSignIdx = canonicalFacts.moonSignIdx || 0;

  const coreNatalProfile = {
    ascendant: {
      sign: canonicalFacts.ascendantSign || ZODIAC_SIGNS[ascSignIdx]?.name || "",
      degree: parseFloat((ascLong % 30).toFixed(2)),
      longitude: ascLong,
      lord: canonicalFacts.ascendantLord || ""
    },
    moonSign: {
      sign: canonicalFacts.moon?.signName || ZODIAC_SIGNS[moonSignIdx]?.name || "",
      degree: parseFloat((moonLong % 30).toFixed(2)),
      longitude: moonLong,
      lord: chartData.moonSignLord || ""
    },
    moonNakshatra: {
      name: chartData.moonNakshatra || "",
      pada: chartData.moonPada || 1,
      lord: chartData.moonNakshatraLord || ""
    },
    sunSign: {
      sign: chartData.sunSign || "",
      degree: parseFloat((chartData.sunLong ? chartData.sunLong % 30 : 15).toFixed(2)),
      lord: chartData.sunSignLord || ""
    },
    sunNakshatra: {
      name: chartData.sunNakshatra || ""
    },
    atmakaraka: chartData.atmakaraka || (canonicalFacts.jaiminiKarakas && canonicalFacts.jaiminiKarakas[0]) || null,
    yogakaraka: chartData.yogakaraka || null,
    functionalLordships: chartData.functionalLordships || null,
    shadbalaSummary: chartData.shadbala || [],
    elementalDistribution: chartData.elementalDistribution || { fire: 3, air: 2, water: 2, earth: 3 }
  };

  // 4. Planetary Table
  const planetaryTable = (chartData.planets || []).map(p => ({
    name: p.name,
    nameTa: p.tamil || p.name,
    longitude: p.longitude ?? p.long ?? 0,
    deg: p.degreeInSign ?? parseFloat(((p.longitude ?? 0) % 30).toFixed(2)),
    sign: p.sign || p.signName || "",
    house: p.house || 1,
    nakshatra: p.nakshatra || "",
    pada: p.pada || 1,
    dignity: p.dignity || "Neutral",
    isRetrograde: Boolean(p.isRetrograde ?? p.retrograde),
    isCombust: Boolean(p.isCombust ?? p.combust),
    speedDegDay: p.speed ?? 1.0,
    shadbalaVirupas: p.shadbalaVirupas ?? null,
    shadbalaRatio: p.shadbalaRatio ?? null
  }));

  // 5. House Analysis
  const rawHouses = (chartData.houses && chartData.houses.length === 12) ? chartData.houses : (canonicalFacts.houses || []);
  const houseAnalysis = rawHouses.map((h, idx) => ({
    houseNumber: h.house || idx + 1,
    sign: h.sign || ZODIAC_SIGNS[(ascSignIdx + idx) % 12]?.name || "Sign",
    lord: h.lordName || canonicalFacts.houseLords?.[idx + 1] || "Lord",
    planets: h.planets || [],
    aspectsReceived: h.aspectsReceived || [],
    traditionalAssessment: h.planets?.length > 0 ? "Active Activation" : "Steady Disposition"
  }));

  // 6. Yoga Analysis
  const yogaAnalysis = (chartData.detectedYogas || chartData.vedicYogas || []).map(y => ({
    name: y.name || "Classical Yoga",
    nameTa: y.nameTamil || y.name,
    category: y.category || "Raja Yoga",
    formation: y.formation || y.description || "Planetary alignment",
    manifestationStatus: y.manifestation || "Fully Active",
    strengthScore: y.strength || "Strong"
  }));

  // 7. Varga Analysis
  const vargaAnalysis = chartData.structuredVargas || chartData.divisionalCharts || {};

  // 8. Current Period Engine (Section 21)
  const currentLifePhase = calculateCurrentLifePhase(chartData, currentDate, lang);

  // 9. Domain Reports Engine (All 17 Domains)
  let rawDomainReports = generateAll17DomainReports(chartData, lang, currentDate);

  // 10. Anti-Repetition Diversifier (Section 27)
  rawDomainReports = diversifyDomainReports(rawDomainReports);

  // 11. Milestone Timeline Engine (Sections 20 & 22)
  const { lifeTimeline, nextImportantPeriods, majorMilestones } = buildMilestoneLifeTimeline(
    chartData,
    rawDomainReports,
    currentLifePhase,
    lang
  );

  // 12. Executive Summary Assembly
  const executiveSummary = {
    coreProfileSummary: "",
    strongestThemes: [
      isTamil ? "தலைமைத்துவம் மற்றும் தொழில் முன்னேற்றம்" : "Leadership & Institutional Career Growth",
      isTamil ? "நிலையான குடும்ப மற்றும் பொருளாதார அடித்தளம்" : "Stable Domestic & Financial Foundation",
      isTamil ? "ஆன்மீகம் மற்றும் தத்துவ தேடல்" : "Spiritual Evolution & Philosophical Inwardness"
    ],
    currentLifePhase,
    nextImportantWindows: nextImportantPeriods.slice(0, 4),
    keyCautions: currentLifePhase.currentCautionAreas || [],
    birthTimeReliability: {
      rating: dataQuality.birthTimeSensitivity.boundaryProximityAlert ? "MODERATE" : "HIGH",
      notes: [
        dataQuality.birthTimeSensitivity.boundaryProximityAlert
          ? (isTamil ? "லக்னம் ராசி சந்திப்பில் உள்ளது; D60 வர்க்கத்தில் நேர துல்லியம் தேவை." : "Ascendant near sign boundary; D60 sensitive to exact birth minute.")
          : (isTamil ? "லக்னம் மைய பாகையில் உள்ளது; அனைத்து வர்க்கங்களும் நிலையானவை." : "Ascendant well-centered; divisional charts highly stable.")
      ]
    }
  };

  // 13. Assemble Initial LifeReportModel
  const lifeReport = createLifeReportModel({
    clientProfile,
    calculationMetadata,
    dataQuality,
    executiveSummary,
    coreNatalProfile,
    planetaryTable,
    houseAnalysis,
    yogaAnalysis,
    vargaAnalysis,
    currentDasha: {
      lord: currentLifePhase.mahadasha,
      currentAntar: currentLifePhase.antardasha,
      currentPratyantar: currentLifePhase.pratyantardasha,
      startDate: currentLifePhase.startDate,
      endDate: currentLifePhase.endDate
    },
    currentTransits: currentLifePhase.currentTransits,
    domainReports: rawDomainReports,
    lifeTimeline,
    majorMilestones,
    evidenceSummary: {
      totalDomainsAnalyzed: 17,
      strongDomains: rawDomainReports.filter(d => d.evidenceStrength === "VERY_STRONG" || d.evidenceStrength === "STRONG").map(d => d.domainId),
      moderateDomains: rawDomainReports.filter(d => d.evidenceStrength === "MODERATE").map(d => d.domainId),
      cautionDomains: rawDomainReports.filter(d => d.evidenceStrength === "MIXED" || d.evidenceStrength === "LIMITED").map(d => d.domainId)
    }
  });

  // 14. Apply Safety Gate & Global Resolution Gate (Sections 16, 17, 25)
  applyReportSafetyGate(lifeReport, lang);

  // 15. Generate Customer-Friendly Narrative
  generateAlgorithmicNarrative(lifeReport, lang);

  // 16. Run 16-Check Validation Suite (Section 33 & 34)
  const validationAudit = validateLifeReport(lifeReport, { lang });
  lifeReport.validationAudit = validationAudit;
  lifeReport.isCertified = validationAudit.isValid;

  return lifeReport;
}
