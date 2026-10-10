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
import {
  getCachedLifeReport,
  setCachedLifeReport,
  clearLifeReportCache,
  getLifeReportCacheStats,
  configureReportCacheBindings,
  computeReportInputHash
} from "./reportCacheManager.js";

// Re-export key components for clean public API
export * from "./lifeReportModel.js";
export * from "./domainReportEngine.js";
export * from "./currentPeriodEngine.js";
export * from "./milestoneTimelineEngine.js";
export * from "./antiRepetitionEngine.js";
export * from "./reportSafetyGate.js";
export * from "./customerNarrativeEngine.js";
export * from "./reportValidator.js";
export * from "./reportCacheManager.js";

/**
 * Derives personalized, evidence-backed executive themes grounded strictly in
 * confirmed natal yogas, planetary dignities, and domain report strength.
 *
 * @param {Object} chartData - Complete chart calculation payload
 * @param {Array} rawDomainReports - Array of evaluated domain reports
 * @param {Object} canonicalFacts - Canonical fact dictionary
 * @param {string} [lang="en"] - Language code ("en" | "ta")
 * @returns {Array<Object>} 1 to 3 distinct evidence-grounded themes
 */
export function derivePersonalizedExecutiveThemes(chartData = {}, rawDomainReports = [], canonicalFacts = {}, lang = "en") {
  const isTamil = lang === "ta";
  const themes = [];
  const usedDomains = new Set();

  // 1. Evaluate verified natal yogas
  const yogas = Array.isArray(chartData.detectedYogas)
    ? chartData.detectedYogas
    : (Array.isArray(chartData.vedicYogas) ? chartData.vedicYogas : []);

  for (const y of yogas) {
    if (themes.length >= 3) break;
    const yName = y.name || "";

    // Raja / Leadership / Authority Yogas
    if (/Raja Yoga|Gajakesari|Pancha Mahapurusha|Hamsa|Malavya|Ruchaka|Bhadra|Sasa/i.test(yName) && !usedDomains.has("leadership") && !usedDomains.has("career")) {
      const isGk = /Gajakesari/i.test(yName);
      themes.push({
        title: isTamil
          ? (isGk ? "கஜகேசரி யோகம்: நெறிமுறை தலைமை மற்றும் நிறுவன செல்வாக்கு" : `${yName}: தலைமைத்துவம் மற்றும் அதிகார வளர்ச்சி`)
          : (isGk ? "Gajakesari Yoga: Institutional Authority & Ethical Leadership" : `${yName}: Leadership Architecture & Sector Authority`),
        domain: "leadership",
        supportingFacts: [
          y.formation || y.description || `Classical planetary formation: ${yName}`,
          `Manifestation status: ${y.manifestation || "Active"}`
        ],
        ruleId: `RULE_YOGA_${yName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`,
        evidenceId: `EV_YOGA_${themes.length + 1}`,
        contradictoryEvidence: [],
        traditionalStatus: "FAVORABLE",
        empiricalStatus: "NOT_EMPIRICALLY_VALIDATED"
      });
      usedDomains.add("leadership");
      usedDomains.add("career");
    }
    // Dhana / Wealth / Capital Resource Yogas
    else if (/Dhana|Lakshmi|Chandra Mangala|Vasumathi/i.test(yName) && !usedDomains.has("finance")) {
      themes.push({
        title: isTamil
          ? `${yName}: திட்டமிட்ட மூலதன உருவாக்கம் மற்றும் நிதி வளம்`
          : `${yName}: Strategic Capital Accumulation & Fiscal Resilience`,
        domain: "finance",
        supportingFacts: [
          y.formation || y.description || `Classical wealth yoga: ${yName}`,
          `Strength assessment: ${y.strength || "Supported"}`
        ],
        ruleId: `RULE_YOGA_${yName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`,
        evidenceId: `EV_YOGA_${themes.length + 1}`,
        contradictoryEvidence: [],
        traditionalStatus: "FAVORABLE",
        empiricalStatus: "NOT_EMPIRICALLY_VALIDATED"
      });
      usedDomains.add("finance");
    }
    // Viparita / Resilience Yogas
    else if (/Viparita|Harsha|Sarala|Vimala|Neechabhanga/i.test(yName) && !usedDomains.has("resilience")) {
      themes.push({
        title: isTamil
          ? `${yName}: தடைகளைத் தாண்டிய மீள்தன்மை மற்றும் வெற்றி`
          : `${yName}: Strategic Resilience & Adversity Inversion`,
        domain: "career",
        supportingFacts: [
          y.formation || y.description || `Inversion yoga: ${yName}`,
          `Status: ${y.manifestation || "Active"}`
        ],
        ruleId: `RULE_YOGA_${yName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`,
        evidenceId: `EV_YOGA_${themes.length + 1}`,
        contradictoryEvidence: [],
        traditionalStatus: "FAVORABLE",
        empiricalStatus: "NOT_EMPIRICALLY_VALIDATED"
      });
      usedDomains.add("resilience");
      usedDomains.add("career");
    }
    // Budhaditya / Intellectual Yogas
    else if (/Budhaditya|Saraswati/i.test(yName) && !usedDomains.has("education")) {
      themes.push({
        title: isTamil
          ? `${yName}: கூர்மையான பகுப்பாய்வு திறன் மற்றும் அறிவுசார் தேர்ச்சி`
          : `${yName}: Analytical Intellect & Professional Specialization`,
        domain: "education",
        supportingFacts: [
          y.formation || y.description || `Intellectual yoga: ${yName}`
        ],
        ruleId: `RULE_YOGA_${yName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`,
        evidenceId: `EV_YOGA_${themes.length + 1}`,
        contradictoryEvidence: [],
        traditionalStatus: "FAVORABLE",
        empiricalStatus: "NOT_EMPIRICALLY_VALIDATED"
      });
      usedDomains.add("education");
    }
  }

  // 2. Synthesize remaining themes from strongest domain reports
  if (themes.length < 3 && Array.isArray(rawDomainReports) && rawDomainReports.length > 0) {
    const strengthScore = { VERY_STRONG: 4, STRONG: 3, MODERATE: 2, LIMITED: 1, MIXED: 1 };
    const sortedDomains = [...rawDomainReports]
      .filter(d => !usedDomains.has(d.domainId))
      .sort((a, b) => (strengthScore[b.evidenceStrength] || 0) - (strengthScore[a.evidenceStrength] || 0));

    for (const dr of sortedDomains) {
      if (themes.length >= 3) break;
      if (usedDomains.has(dr.domainId)) continue;

      const dNameEn = dr.domainName?.en || dr.domainId;
      const dNameTa = dr.domainName?.ta || dr.domainId;
      const primaryLord = dr.technicalEvidence?.primaryLord;
      const primaryHouse = dr.technicalEvidence?.primaryHouse;

      let themeTitle = "";
      switch (dr.domainId) {
        case "career":
          themeTitle = isTamil
            ? "தொழில் மற்றும் பொது வாழ்க்கை முன்னேற்றப் பாதை"
            : "Professional Trajectory & Institutional Accomplishment";
          break;
        case "finance":
          themeTitle = isTamil
            ? "திட்டமிட்ட நிதி மேலாண்மை மற்றும் பொருளாதார அடித்தளம்"
            : "Strategic Capital Allocation & Financial Stewardship";
          break;
        case "property":
          themeTitle = isTamil
            ? "நிலையான அசையா சொத்துக்கள் மற்றும் வாழ்விட பாதுகாப்பு"
            : "Tangible Asset & Real Estate Capital Consolidation";
          break;
        case "leadership":
          themeTitle = isTamil
            ? "நிறுவன தலைமைத்துவம் மற்றும் முடிவெடுக்கும் அதிகாரம்"
            : "Institutional Governance & Executive Authority";
          break;
        case "spiritual":
          themeTitle = isTamil
            ? "ஆன்மீக விழிப்புணர்வு மற்றும் தத்துவார்த்த அக வளர்ச்சி"
            : "Spiritual Evolution & Philosophical Inwardness";
          break;
        case "education":
          themeTitle = isTamil
            ? "தொடர் அறிவுசார் கற்றல் மற்றும் கல்வித் தேர்ச்சி"
            : "Advanced Knowledge Acquisition & Domain Mastery";
          break;
        case "marriage":
          themeTitle = isTamil
            ? "வாழ்க்கை துணை மற்றும் கூட்டாண்மை நல்லிணக்கம்"
            : "Partnership Equilibrium & Domestic Alignment";
          break;
        case "family":
          themeTitle = isTamil
            ? "குடும்ப பிணைப்பு மற்றும் பாரம்பரிய ஸ்திரத்தன்மை"
            : "Familial Cohesion & Lineage Foundation";
          break;
        default:
          themeTitle = isTamil
            ? `${dNameTa}: முதன்மை வாழ்க்கை பரிமாணம்`
            : `${dNameEn}: Core Life Domain Synthesis`;
      }

      themes.push({
        title: themeTitle,
        domain: dr.domainId,
        supportingFacts: [
          `Evidence strength: ${dr.evidenceStrength}`,
          primaryLord ? `Governing Lord: ${primaryLord}` : null,
          primaryHouse ? `Primary House: House ${primaryHouse}` : null,
          dr.executiveConclusion ? dr.executiveConclusion.slice(0, 100) : null
        ].filter(Boolean),
        ruleId: `RULE_DOMAIN_${dr.domainId.toUpperCase()}_STRENGTH`,
        evidenceId: `EV_DOM_${dr.domainId.toUpperCase()}_01`,
        contradictoryEvidence: dr.contradictions || [],
        traditionalStatus: dr.overallTraditionalAssessment || "SUPPORTED",
        empiricalStatus: "NOT_EMPIRICALLY_VALIDATED"
      });
      usedDomains.add(dr.domainId);
    }
  }

  // 3. Fallback: If under 1 theme, anchor strictly on Lagna / Atmakaraka
  if (themes.length === 0) {
    const lagnaSign = canonicalFacts.ascendantSign || chartData.ascendantSign || "Lagna";
    const akPlanet = canonicalFacts.atmakaraka?.planet || chartData.atmakaraka || "Atmakaraka";
    themes.push({
      title: isTamil
        ? `லக்னம் (${lagnaSign}): தனிநபர் ஆற்றல் மற்றும் சமநிலை வாழ்க்கை நெறி`
        : `Lagna (${lagnaSign}): Personal Agency & Deliberate Life Equilibrium`,
      domain: "leadership",
      supportingFacts: [
        `Ascendant Sign: ${lagnaSign}`,
        `Atmakaraka: ${akPlanet}`
      ],
      ruleId: "RULE_LAGNA_EQUILIBRIUM",
      evidenceId: "EV_NATAL_CORE_01",
      contradictoryEvidence: [],
      traditionalStatus: "SUPPORTED",
      empiricalStatus: "NOT_EMPIRICALLY_VALIDATED"
    });
  }

  return themes.slice(0, 3);
}

/**
 * Evaluates multi-factor birth-time reliability across Ascendant boundary margin,
 * D9 Navamsha boundary margin, D60 Shashtiamsha boundary margin, Moon Pada boundary,
 * and coordinate stability without binary oversimplifications.
 *
 * @param {Object} chartData - Complete chart calculation payload
 * @param {Object} canonicalFacts - Canonical fact dictionary
 * @param {string} [lang="en"] - Language code ("en" | "ta")
 * @returns {Object} { rating, score, boundaryProximityAlert, notes, factors }
 */
export function evaluateBirthTimeReliability(chartData = {}, canonicalFacts = {}, lang = "en") {
  const isTamil = lang === "ta";
  const factors = [];
  const notes = [];
  let score = 100;

  const rawAscLong = canonicalFacts.ascendantLong ?? chartData.ascendantLong ?? chartData.ascendant?.longitude;
  if (!Number.isFinite(rawAscLong)) {
    return {
      rating: "INSUFFICIENT_DATA",
      score: 0,
      boundaryProximityAlert: false,
      notes: [
        isTamil
          ? "லக்ன பாகை விபரம் இல்லாததால் பிறந்த நேர நம்பகத்தன்மையை கணக்கிட இயலவில்லை."
          : "Ascendant longitude missing; birth time reliability cannot be calculated."
      ],
      factors: []
    };
  }

  const ascDeg = ((rawAscLong % 30) + 30) % 30;
  const distToSignBoundary = Math.min(ascDeg, 30 - ascDeg);

  // 1. Ascendant Rasi boundary check (30° span; 1° ~ 4 minutes)
  const isSignBoundaryCritical = distToSignBoundary < 0.5;
  const isSignBoundaryModerate = distToSignBoundary >= 0.5 && distToSignBoundary < 1.0;

  if (isSignBoundaryCritical) {
    score -= 35;
    factors.push({
      factor: "ASCENDANT_SIGN_BOUNDARY",
      severity: "CRITICAL",
      marginDeg: parseFloat(distToSignBoundary.toFixed(2)),
      description: isTamil
        ? `லக்னம் ராசி சந்திப்பிற்கு மிக அருகில் உள்ளது (${distToSignBoundary.toFixed(2)}° விலகல்). ~2 நிமிட நேர மாற்றம் லக்ன ராசியையே மாற்றக்கூடும்.`
        : `Ascendant is within ${distToSignBoundary.toFixed(2)}° of sign boundary. A birth time difference of ~2 minutes could alter the Lagna sign.`
    });
    notes.push(isTamil
      ? "லக்னம் ராசி சந்திப்பில் உள்ளது; D1 மற்றும் அனைத்து வர்க்கங்களுக்கும் நேர சரிபார்ப்பு அவசியம்."
      : "Ascendant near sign boundary; exact minute verification advised for D1 and divisional charts."
    );
  } else if (isSignBoundaryModerate) {
    score -= 15;
    factors.push({
      factor: "ASCENDANT_SIGN_BOUNDARY",
      severity: "MODERATE",
      marginDeg: parseFloat(distToSignBoundary.toFixed(2)),
      description: isTamil
        ? `லக்னம் ராசி சந்திப்பிற்கு அருகில் உள்ளது (${distToSignBoundary.toFixed(2)}° விலகல்). ~4 நிமிட நேர மாற்றத்திற்கு உணர்திறன் கொண்டது.`
        : `Ascendant is within ${distToSignBoundary.toFixed(2)}° of sign boundary (~4 minutes sensitivity).`
    });
    notes.push(isTamil
      ? "லக்னம் ராசி சந்திப்பு எல்லையில் உள்ளது; உயர் வர்க்க சக்கரங்களில் நேர உணர்திறன் உள்ளது."
      : "Ascendant in boundary margin; fine divisional placements are sensitive."
    );
  } else {
    factors.push({
      factor: "ASCENDANT_SIGN_BOUNDARY",
      severity: "LOW",
      marginDeg: parseFloat(distToSignBoundary.toFixed(2)),
      description: isTamil
        ? `லக்னம் ராசியின் மையப்பகுதியில் நிலையாக உள்ளது (${distToSignBoundary.toFixed(2)}° விலகல்).`
        : `Ascendant well-centered in sign (${distToSignBoundary.toFixed(2)}° from boundary).`
    });
  }

  // 2. Navamsha (D9) boundary check (3° 20' = 3.333333° span; 1 Navamsha ~ 13.3 minutes)
  const navamshaSpan = 10 / 3;
  const remD9 = ascDeg % navamshaSpan;
  const distToD9Boundary = Math.min(remD9, navamshaSpan - remD9);
  const isD9Sensitive = distToD9Boundary < 0.25;

  if (isD9Sensitive) {
    score -= 15;
    factors.push({
      factor: "NAVAMSHA_D9_BOUNDARY",
      severity: "MODERATE",
      marginDeg: parseFloat(distToD9Boundary.toFixed(2)),
      description: isTamil
        ? `நவாம்ச சந்திப்பு எல்லை (${distToD9Boundary.toFixed(2)}° விலகல்). ~1 நிமிட நேர மாற்றம் D9 லக்னத்தை மாற்றக்கூடும்.`
        : `Navamsha cusp proximity (${distToD9Boundary.toFixed(2)}° margin). ~1 minute time difference may alter D9 Lagna.`
    });
    notes.push(isTamil
      ? "D9 நவாம்ச லக்னம் எல்லைப் பகுதியில் உள்ளது; நவாம்ச நேர உணர்திறன் கவனிக்கப்பட வேண்டும்."
      : "Navamsha D9 Lagna is near cusp boundary; fine D9 alignment sensitive to birth minute."
    );
  }

  // 3. Shashtiamsha (D60) boundary check (0.5° span = 30 arcminutes; 1 D60 ~ 2 minutes)
  const remD60 = ascDeg % 0.5;
  const distToD60Boundary = Math.min(remD60, 0.5 - remD60);
  const isD60Critical = distToD60Boundary < 0.05;

  if (isD60Critical) {
    score -= 15;
    factors.push({
      factor: "SHASHTIAMSHA_D60_BOUNDARY",
      severity: "HIGH",
      marginDeg: parseFloat(distToD60Boundary.toFixed(2)),
      description: isTamil
        ? `D60 ஷஷ்டியாம்ச எல்லைக்கு மிக அருகில் (${distToD60Boundary.toFixed(2)}° விலகல்). ~12 வினாடி நேர மாற்றம் D60 அதிபதியை மாற்றும்.`
        : `D60 Shashtiamsha cusp proximity (${distToD60Boundary.toFixed(2)}° margin; ~12 seconds sensitivity).`
    });
    notes.push(isTamil
      ? "D60 ஷஷ்டியாம்சம் அதிக நேர உணர்திறன் கொண்டது (~2 நிமிட மாற்றத்திற்குள் மாறும்)."
      : "D60 Shashtiamsha is highly sensitive to the exact minute of birth (~2 min lifespan)."
    );
  }

  // 4. Moon Nakshatra Pada boundary check (affects initial Vimshottari dasha balance)
  const rawMoonLong = canonicalFacts.moonLong ?? chartData.moonLong ?? chartData.moon?.longitude;
  if (Number.isFinite(rawMoonLong)) {
    const remPada = ((rawMoonLong % (10 / 3)) + (10 / 3)) % (10 / 3);
    const distToPadaBoundary = Math.min(remPada, (10 / 3) - remPada);
    if (distToPadaBoundary < 0.10) {
      score -= 15;
      factors.push({
        factor: "MOON_PADA_BOUNDARY",
        severity: "MODERATE",
        marginDeg: parseFloat(distToPadaBoundary.toFixed(2)),
        description: isTamil
          ? `சந்திரன் நட்சத்திர பாத எல்லைக்கு அருகில் (${distToPadaBoundary.toFixed(2)}° விலகல்). விம்சொத்தரி தசா இருப்பு சில மாதங்கள் மாறக்கூடும்.`
          : `Moon near Nakshatra Pada boundary (${distToPadaBoundary.toFixed(2)}° margin; Vimshottari balance sensitive).`
      });
      notes.push(isTamil
        ? "சந்திர நட்சத்திர பாதம் எல்லைப் பகுதியில் இருப்பதால், ஆரம்ப தசா இருப்பு சரிபார்க்கப்பட வேண்டும்."
        : "Moon near Pada boundary; initial Vimshottari dasha balance requires precise time verification."
      );
    }
  }

  // 5. Geographic coordinates presence
  const lat = chartData.latitude ?? chartData.lat;
  const lng = chartData.longitude ?? chartData.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    score -= 20;
    factors.push({
      factor: "COORDINATES_ABSENT",
      severity: "HIGH",
      description: isTamil ? "பிறந்த இடத்தின் அட்ச/தீர்க்க ரேகைகள் இல்லை." : "Missing geographic coordinates."
    });
  }

  if (notes.length === 0) {
    notes.push(isTamil
      ? "லக்னம் மற்றும் முக்கிய புள்ளிகள் மைய பாகையில் உள்ளன; அனைத்து வர்க்கங்களும் நிலையானவை."
      : "Ascendant and core points well-centered; divisional charts highly stable."
    );
  }

  const rating = score >= 80 ? "HIGH" : (score >= 55 ? "MODERATE" : "LOW");
  const boundaryProximityAlert = isSignBoundaryCritical || isSignBoundaryModerate || isD60Critical;

  return {
    rating,
    score: Math.max(0, Math.min(100, score)),
    boundaryProximityAlert,
    notes,
    factors
  };
}

/**
 * Generates an authoritative, certified LifeReportModel for a customer chart.
 *
 * @param {Object} chartData - Complete chart data from calculateChartBySystem()
 * @param {Object} [options={}] - Options { lang: "en" | "ta", currentDate: Date, clientName: string, bypassCache: boolean }
 * @returns {Object} Certified LifeReportModel with validation audit
 */
export function generateLifeIntelligenceReport(chartData, options = {}) {
  const lang = options.lang || "en";
  const isTamil = lang === "ta";
  const currentDate = options.currentDate || new Date();
  const clientName = options.clientName || chartData?.clientName || (isTamil ? "மதிப்பிற்குரிய ஜாதகர்" : "Valued Client");

  // Fast-path: check deterministic report cache first
  if (!options.bypassCache && chartData) {
    const cached = getCachedLifeReport(chartData, options);
    if (cached) {
      return cached;
    }
  }

  if (!chartData || !Array.isArray(chartData.planets)) {
    throw new Error("Invalid or missing chartData provided to generateLifeIntelligenceReport.");
  }

  const canonicalFacts = extractCanonicalFacts(chartData, lang);

  const tzResolved = chartData.timezoneId || chartData.ianaTimezone || chartData.tz ||
    (Number.isFinite(chartData.sourceUtcOffset) ? `UTC${chartData.sourceUtcOffset >= 0 ? '+' : ''}${chartData.sourceUtcOffset}` :
    (Number.isFinite(chartData.utcOffset) ? `UTC${chartData.utcOffset >= 0 ? '+' : ''}${chartData.utcOffset}` : null));
  if (!tzResolved) {
    throw new Error("INSUFFICIENT_DATA: Missing required timezone in chartData.");
  }

  // 1. Client Profile & Calculation Metadata
  const clientProfile = {
    name: clientName,
    gender: chartData.gender || "unspecified",
    birthDate: chartData.birthDateStr || chartData.birthDate || "N/A",
    birthTime: chartData.birthTimeStr || chartData.birthTime || "N/A",
    birthPlace: chartData.birthPlace || chartData.locationName || "N/A",
    latitude: chartData.latitude ?? chartData.lat ?? null,
    longitude: chartData.longitude ?? chartData.lng ?? null,
    timezone: tzResolved
  };

  const reportFingerprint = generateChartFingerprint ? generateChartFingerprint(chartData) : "CANONICAL_FINGERPRINT";

  const calculationMetadata = {
    ayanamsha: chartData.ayanamsha || chartData.ayanamshaName || (chartData.system === "western" ? "None (Tropical)" : "Lahiri (Chitra Paksha)"),
    astrologySystem: chartData.system || chartData.astrologySystem || "Vedic (Sidereal)",
    zodiacConvention: chartData.zodiac || (chartData.system === "western" ? "Tropical" : "Sidereal"),
    houseSystem: chartData.houseSystem || (chartData.system === "western" ? "Placidus" : "Equal / Whole Sign"),
    lunarNodeConvention: chartData.nodeType || chartData.lunarNodeConvention || "Mean Node",
    ephemeris: chartData.ephemeris || "AstronomyEngine/VSOP87",
    calculationEngine: "ASTROVERSE Core v4.2.0",
    generatedAt: new Date().toISOString(),
    reportFingerprint,
    releaseVersion: "3.0.0",
    modelVersion: "2.2.0",
    schemaVersion: "3.0",
    lang
  };

  // Evaluate multi-factor birth-time reliability
  const birthTimeEval = evaluateBirthTimeReliability(chartData, canonicalFacts, lang);

  // 2. Data Quality Panel (Section 32)
  const validatedPlanets = Array.isArray(chartData.planets)
    ? chartData.planets.filter(p => Number.isFinite(p.longitude ?? p.long))
    : [];
  const planetsCount = validatedPlanets.length;

  const validatedHouses = Array.isArray(chartData.houses)
    ? chartData.houses.filter(h => Number.isInteger(h.house) || h.sign)
    : (Array.isArray(canonicalFacts.houses) ? canonicalFacts.houses : []);
  const housesCount = validatedHouses.length;

  const hasAscendant = Number.isFinite(canonicalFacts.ascendantLong) || Number.isFinite(chartData.ascendantLong) || Number.isFinite(chartData.ascendant?.longitude);
  const hasMoon = Number.isFinite(canonicalFacts.moonLong) || Number.isFinite(chartData.moonLong) || Number.isFinite(chartData.moon?.longitude);
  const hasCoords = Number.isFinite(clientProfile.latitude) && Number.isFinite(clientProfile.longitude);
  const hasTimezone = Boolean(clientProfile.timezone);
  const hasDasha = Boolean(chartData.dashaTimeline || chartData.currentDasha || canonicalFacts.currentDasha);

  const missingInputs = [];
  const affectedSections = [];

  if (planetsCount < 9) {
    missingInputs.push(isTamil ? `முழுமையான 9 கிரக நிலைகள் (${planetsCount}/9 மட்டுமே உள்ளன)` : `Complete 9-planet celestial positions (${planetsCount}/9 present)`);
    affectedSections.push(isTamil ? "கிரக அட்டவணை மற்றும் பலங்கள்" : "Planetary Table & Dignities");
  }
  if (housesCount < 12) {
    missingInputs.push(isTamil ? `முழுமையான 12 பாவ அமைப்புகள் (${housesCount}/12 மட்டுமே உள்ளன)` : `Complete 12-house cusps (${housesCount}/12 present)`);
    affectedSections.push(isTamil ? "பாவக பகுப்பாய்வு" : "House Analysis");
  }
  if (!hasAscendant) {
    missingInputs.push(isTamil ? "லக்ன பாகை" : "Ascendant longitude");
    affectedSections.push(isTamil ? "லக்ன விபரம் & வர்க்க சக்கரங்கள்" : "Core Natal Profile & Divisional Charts");
  }
  if (!hasMoon) {
    missingInputs.push(isTamil ? "சந்திர பாகை" : "Moon longitude");
    affectedSections.push(isTamil ? "ராசி, நட்சத்திரம் & தசா காலம்" : "Moon Sign, Nakshatra & Dasha Timeline");
  }
  if (!hasCoords) {
    missingInputs.push(isTamil ? "பிறந்த இடத்தின் அட்ச/தீர்க்க ரேகைகள்" : "Birth coordinates (latitude/longitude)");
    affectedSections.push(isTamil ? "லக்னம் மற்றும் பாவக கணிப்பு" : "Ascendant & House Calculations");
  }
  if (!hasDasha) {
    missingInputs.push(isTamil ? "விம்சொத்தரி தசா கால அட்டவணை" : "Vimshottari Dasha timeline");
    affectedSections.push(isTamil ? "நடப்பு தசா காலம் & முக்கிய காலக்கட்டங்கள்" : "Current Life Phase & Milestone Timeline");
  }

  const completenessScore = parseFloat((
    (Math.min(9, planetsCount) / 9) * 0.30 +
    (Math.min(12, housesCount) / 12) * 0.20 +
    (hasAscendant ? 0.15 : 0) +
    (hasMoon ? 0.15 : 0) +
    (hasCoords && hasTimezone ? 0.10 : 0) +
    (hasDasha ? 0.10 : 0)
  ).toFixed(2));

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
      boundaryProximityAlert: birthTimeEval.boundaryProximityAlert,
      factors: birthTimeEval.factors
    },
    missingInputs,
    affectedSections,
    completenessScore,
    completenessLabel: completenessScore >= 0.9 ? "EXCELLENT" : (completenessScore >= 0.7 ? "GOOD" : "PARTIAL")
  };

  // 3. Core Natal Profile
  const rawAscLong = canonicalFacts.ascendantLong ?? chartData.ascendantLong ?? chartData.ascendant?.longitude;
  const hasAsc = Number.isFinite(rawAscLong);
  const ascLong = hasAsc ? rawAscLong : null;
  const ascSignIdx = hasAsc
    ? Math.floor((((ascLong % 360) + 360) % 360) / 30) % 12
    : (Number.isInteger(canonicalFacts.ascendantSignIdx) ? canonicalFacts.ascendantSignIdx : null);

  const rawMoonLong = canonicalFacts.moonLong ?? chartData.moonLong ?? chartData.moon?.longitude;
  const hasMoonPosition = Number.isFinite(rawMoonLong);
  const moonLong = hasMoonPosition ? rawMoonLong : null;
  const moonSignIdx = hasMoonPosition
    ? Math.floor((((moonLong % 360) + 360) % 360) / 30) % 12
    : (Number.isInteger(canonicalFacts.moonSignIdx) ? canonicalFacts.moonSignIdx : null);

  const coreNatalProfile = {
    ascendant: {
      sign: canonicalFacts.ascendantSign || (ascSignIdx != null ? ZODIAC_SIGNS[ascSignIdx]?.name : null) || "",
      degree: hasAsc ? parseFloat((((ascLong % 30) + 30) % 30).toFixed(2)) : null,
      longitude: ascLong,
      lord: canonicalFacts.ascendantLord || ""
    },
    moonSign: {
      sign: canonicalFacts.moon?.signName || (moonSignIdx != null ? ZODIAC_SIGNS[moonSignIdx]?.name : null) || "",
      degree: hasMoonPosition ? parseFloat((((moonLong % 30) + 30) % 30).toFixed(2)) : null,
      longitude: moonLong,
      lord: chartData.moonSignLord || ""
    },
    moonNakshatra: {
      name: chartData.moonNakshatra || "",
      pada: Number.isInteger(chartData.moonPada) ? chartData.moonPada : null,
      lord: chartData.moonNakshatraLord || ""
    },
    sunSign: {
      sign: chartData.sunSign || "",
      degree: Number.isFinite(chartData.sunLong) ? parseFloat((((chartData.sunLong % 30) + 30) % 30).toFixed(2)) : null,
      lord: chartData.sunSignLord || ""
    },
    sunNakshatra: {
      name: chartData.sunNakshatra || ""
    },
    atmakaraka: chartData.atmakaraka || (canonicalFacts.jaiminiKarakas && canonicalFacts.jaiminiKarakas[0]) || null,
    yogakaraka: chartData.yogakaraka || null,
    functionalLordships: chartData.functionalLordships || null,
    shadbalaSummary: chartData.shadbala || [],
    elementalDistribution: chartData.elementalDistribution || null
  };

  // 4. Planetary Table
  const planetaryTable = (chartData.planets || []).map(p => {
    const rawLong = p.longitude ?? p.long;
    const hasLong = Number.isFinite(rawLong);
    const rawSpeed = p.speed ?? p.speedDegDay;
    const hasSpeed = Number.isFinite(rawSpeed);
    const hasHouse = Number.isInteger(p.house);
    const hasPada = Number.isInteger(p.pada);

    return {
      name: p.name,
      nameTa: p.tamil || p.name,
      longitude: hasLong ? rawLong : null,
      deg: p.degreeInSign ?? (hasLong ? parseFloat((((rawLong % 30) + 30) % 30).toFixed(2)) : null),
      sign: p.sign || p.signName || "",
      house: hasHouse ? p.house : null,
      nakshatra: p.nakshatra || "",
      pada: hasPada ? p.pada : null,
      dignity: p.dignity || "Neutral",
      isRetrograde: Boolean(p.isRetrograde ?? p.retrograde),
      isCombust: Boolean(p.isCombust ?? p.combust),
      speedDegDay: hasSpeed ? rawSpeed : null,
      shadbalaVirupas: p.shadbalaVirupas ?? null,
      shadbalaRatio: p.shadbalaRatio ?? null
    };
  });

  // 5. House Analysis
  const rawHouses = (Array.isArray(chartData.houses) && chartData.houses.length === 12)
    ? chartData.houses
    : (Array.isArray(canonicalFacts.houses) && canonicalFacts.houses.length > 0 ? canonicalFacts.houses : []);

  const houseAnalysis = rawHouses.map((h, idx) => ({
    houseNumber: h.house || idx + 1,
    sign: h.sign || (ascSignIdx != null ? ZODIAC_SIGNS[(ascSignIdx + idx) % 12]?.name : "") || "",
    lord: h.lordName || canonicalFacts.houseLords?.[idx + 1] || "",
    planets: Array.isArray(h.planets) ? h.planets : [],
    aspectsReceived: Array.isArray(h.aspectsReceived) ? h.aspectsReceived : [],
    traditionalAssessment: Array.isArray(h.planets) && h.planets.length > 0 ? "Active Activation" : "Steady Disposition"
  }));

  // 6. Yoga Analysis
  const yogaAnalysis = (chartData.detectedYogas || chartData.vedicYogas || []).map(y => ({
    name: y.name || null,
    nameTa: y.nameTamil || y.name || null,
    category: y.category || null,
    formation: y.formation || y.description || null,
    manifestationStatus: y.manifestation || null,
    strengthScore: y.strength || null
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

  // 12. Executive Summary Assembly with Personalized Themes
  const personalizedThemes = derivePersonalizedExecutiveThemes(chartData, rawDomainReports, canonicalFacts, lang);

  const executiveSummary = {
    coreProfileSummary: "",
    strongestThemes: personalizedThemes.map(t => t.title),
    personalizedThemes,
    currentLifePhase,
    nextImportantWindows: nextImportantPeriods.slice(0, 4),
    keyCautions: currentLifePhase.currentCautionAreas || [],
    birthTimeReliability: {
      rating: birthTimeEval.rating,
      score: birthTimeEval.score,
      notes: birthTimeEval.notes,
      factors: birthTimeEval.factors
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

  // Persist into deterministic cache
  setCachedLifeReport(chartData, options, lifeReport);

  return lifeReport;
}
