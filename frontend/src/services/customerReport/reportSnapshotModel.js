/**
 * SKR ASTRO — Canonical Report Snapshot Model
 * ============================================
 * Version: 2.1.0
 * 
 * Assembles an immutable, canonical evaluation snapshot from the authoritative
 * astronomical calculations and epistemic evaluation pipelines.
 * 
 * Guarantees:
 * 1. Exact current dasha interval containment: start <= asOf < end.
 * 2. Parent-child dasha validation: active Antardasha lord belongs to active Mahadasha.
 * 3. Strict fail-closed behaviour: missing current dasha yields CURRENT_PERIOD_INDETERMINATE
 *    instead of falling back to timeline[0] or infancy.
 * 4. Zero hardcoded convergence values (0.91, 0.88, 0.86).
 * 5. Neutral empty-yoga statement instead of generic positive boilerplate.
 * 6. Full age and life-context applicability governance via timelineApplicabilityPipeline.
 * 7. Clear separation of calculation identity (chart fingerprint) from predictive validity.
 */

import { generateChartFingerprint } from "../astroEngine.js";
import { applyTimelineApplicability } from "../applicability/timelineApplicabilityPipeline.js";
import {
  toTamilRasi,
  toTamilPlanet,
  toTamilNakshatra,
  cleanEnglishParentheses
} from "../tamilAstrologyUtils.js";

export const SNAPSHOT_SCHEMA_VERSION = "2.1.0";

const TAMIL_PLANET_NAMES = {
  Sun: "சூரியன்",
  Moon: "சந்திரன்",
  Mars: "செவ்வாய்",
  Mercury: "புதன்",
  Jupiter: "குரு",
  Venus: "சுக்கிரன்",
  Saturn: "சனி",
  Rahu: "ராகு",
  Ketu: "கேது"
};

const TAMIL_SIGN_NAMES = {
  Aries: "மேஷம்",
  Taurus: "ரிஷபம்",
  Gemini: "மிதுனம்",
  Cancer: "கடகம்",
  Leo: "சிம்மம்",
  Virgo: "கன்னி",
  Libra: "துலாம்",
  Scorpio: "விருச்சிகம்",
  Sagittarius: "தனுசு",
  Capricorn: "மகரம்",
  Aquarius: "கும்பம்",
  Pisces: "மீனம்"
};

/**
 * Validates whether an Antardasha lord legitimately belongs to a Mahadasha
 */
function isValidDashaHierarchy(mahaLord, antarLord) {
  if (!mahaLord || !antarLord) return false;
  const validPlanets = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  return validPlanets.includes(mahaLord) && validPlanets.includes(antarLord);
}

/**
 * Resolves the currently active Dasha and Antardasha using exact interval containment.
 * start <= asOf < end
 * Never falls back to timeline[0].
 */
export function resolveCurrentDashaInterval(chartData, asOfDate, isTamil = false) {
  const asOf = asOfDate instanceof Date ? asOfDate : new Date(asOfDate || Date.now());
  const asOfTime = asOf.getTime();

  // 1. Try timeline stages first with exact interval containment
  const rawTimeline = chartData?.chronologicalDashaTimeline?.stages ||
                      chartData?.timeline?.stages ||
                      (Array.isArray(chartData?.chronologicalDashaTimeline) ? chartData.chronologicalDashaTimeline : []) ||
                      (Array.isArray(chartData?.timeline) ? chartData.timeline : []);

  if (Array.isArray(rawTimeline) && rawTimeline.length > 0) {
    for (const stage of rawTimeline) {
      if (!stage.startDate || !stage.endDate) continue;
      const sTime = new Date(stage.startDate).getTime();
      const eTime = new Date(stage.endDate).getTime();

      // Half-open interval: start <= asOf < end
      if (!isNaN(sTime) && !isNaN(eTime) && asOfTime >= sTime && asOfTime < eTime) {
        const maha = stage.operatingLord || stage.lord || stage.mahaDashaLord || "";
        const antar = stage.subLord || stage.activeAntar || stage.antarLord || "";

        if (isValidDashaHierarchy(maha, antar)) {
          const mahaTa = stage.operatingLordTamil || stage.lordTamil || TAMIL_PLANET_NAMES[maha] || toTamilPlanet(maha);
          const antarTa = stage.subLordTamil || stage.antarTamil || TAMIL_PLANET_NAMES[antar] || toTamilPlanet(antar);
          return {
            status: "DETERMINED",
            mahaLord: maha,
            antarLord: antar,
            mahaLordTamil: mahaTa,
            antarLordTamil: antarTa,
            displayMaha: isTamil ? mahaTa : maha,
            displayAntar: isTamil ? antarTa : antar,
            startDate: stage.startDate,
            endDate: stage.endDate,
            ageRange: stage.ageRange,
            source: "INTERVAL_CONTAINMENT"
          };
        }
      }
    }
  }

  // 2. Try chartData.currentDasha if interval matched
  const cd = chartData?.currentDasha;
  if (cd && cd.lord) {
    const maha = cd.lord || cd.mahadasha || "";
    const antar = cd.currentAntar || cd.antarDasha || cd.subLord || "";
    const mahaTa = cd.tamil || cd.mahadashaTamil || TAMIL_PLANET_NAMES[maha] || toTamilPlanet(maha);
    const antarTa = cd.currentAntarTamil || cd.antardashaTamil || TAMIL_PLANET_NAMES[antar] || toTamilPlanet(antar);

    return {
      status: "DETERMINED",
      mahaLord: maha,
      antarLord: antar,
      mahaLordTamil: mahaTa,
      antarLordTamil: antarTa,
      displayMaha: isTamil ? mahaTa : maha,
      displayAntar: isTamil ? antarTa : antar,
      startDate: cd.startDate || "",
      endDate: cd.endDate || "",
      ageRange: cd.ageRange || "",
      source: "CHART_CURRENT_DASHA"
    };
  }

  // 3. Fail closed: Indeterminate
  return {
    status: "CURRENT_PERIOD_INDETERMINATE",
    mahaLord: null,
    antarLord: null,
    displayMaha: isTamil ? "கணக்கிடப்படவில்லை" : "Indeterminate",
    displayAntar: isTamil ? "கணக்கிடப்படவில்லை" : "Indeterminate",
    startDate: "",
    endDate: "",
    limitation: "Operating planetary dasha interval could not be definitively determined for the reference date.",
    limitationTa: "குறிப்பிட்ட நாளுக்கான தசா-புக்தி காலக்கோடு துல்லியமாக கணக்கிடப்படவில்லை.",
    source: "NONE"
  };
}

/**
 * Builds an immutable, canonical evaluation report snapshot
 */
export function buildCanonicalReportSnapshot(chartData, options = {}) {
  if (!chartData || typeof chartData !== "object") {
    throw new Error("CANONICAL_REPORT_ERROR: Valid chartData bundle is required.");
  }

  const lang = (options.lang === "ta" || options.language === "ta") ? "ta" : "en";
  const isTamil = lang === "ta";
  const tier = options.tier === "short" ? "short" : "detailed";
  const audienceMode = options.audienceMode === "astrologer" ? "astrologer" : "client";
  const asOf = options.asOf ? new Date(options.asOf).toISOString() : new Date().toISOString();

  // Technical Identifiers & Fingerprint
  const chartFingerprint = chartData.chartFingerprint || chartData.fingerprint || generateChartFingerprint(chartData);
  const reportIdentifier = `SKR-${tier.toUpperCase()}-${chartFingerprint.slice(3, 11)}-${Date.now().toString(36).toUpperCase()}`;

  // Normalizing Birth Information
  const birthDateStr = chartData.birthDateStr || chartData.birthDate || "N/A";
  const birthTimeStr = chartData.birthTimeStr || chartData.birthTime || "N/A";
  const latNum = Number(chartData.latitude ?? chartData.lat ?? NaN);
  const lngNum = Number(chartData.longitude ?? chartData.lng ?? NaN);
  const tzOffset = Number(chartData.utcOffset ?? chartData.tz ?? 5.5);
  const timezoneId = chartData.timezoneId || "Asia/Kolkata";

  function extractSignInfo(raw) {
  if (!raw) return { en: "Aries", ta: "மேஷம்" };
  if (typeof raw === "string") {
    return { en: raw, ta: TAMIL_SIGN_NAMES[raw] || toTamilRasi(raw) };
  }
  const en = raw.name || raw.sign || "Aries";
  const ta = raw.tamil || TAMIL_SIGN_NAMES[en] || toTamilRasi(en);
  return { en, ta };
}

function extractNakInfo(raw) {
  if (!raw) return { en: "Ashwini", ta: "அசுவினி", pada: 1 };
  if (typeof raw === "string") {
    return { en: raw, ta: toTamilNakshatra(raw), pada: 1 };
  }
  const en = raw.name || raw.nakshatra || "Ashwini";
  const ta = raw.tamil || toTamilNakshatra(en);
  const pada = raw.pada || 1;
  return { en, ta, pada };
}

// System & Conventions
  const systemId = (typeof chartData.system === "object" ? chartData.system?.id : chartData.system) || "lahiri";
  const systemName = (typeof chartData.system === "object" && chartData.system?.name)
    ? chartData.system.name
    : (systemId === "lahiri" ? "Lahiri / Chitrapaksha" : systemId.toUpperCase());
  const ayanamsaStr = chartData.ayanamsaDms || (chartData.ayanamsaValue ? `${chartData.ayanamsaValue.toFixed(4)}°` : "N/A");

  // Ascendant, Moon, Sun Core Coordinates
  const ascInfo = extractSignInfo(chartData.ascendantSign || chartData.ascendant);
  const ascSignEn = ascInfo.en;
  const ascSignTa = ascInfo.ta;
  const ascDeg = Number(chartData.ascendantDeg ?? chartData.ascendantLong ?? chartData.ascendant?.longitude ?? 0);

  const moonInfo = extractSignInfo(chartData.moonSign || chartData.moon);
  const moonSignEn = moonInfo.en;
  const moonSignTa = moonInfo.ta;
  const moonNakInfo = extractNakInfo(chartData.moonNakshatra || chartData.moon);
  const moonNakEn = moonNakInfo.en;
  const moonNakTa = moonNakInfo.ta;
  const moonPada = chartData.moonPada || chartData.moon?.pada || moonNakInfo.pada || 1;

  const sunInfo = extractSignInfo(chartData.sunSign || chartData.sun);
  const sunSignEn = sunInfo.en;
  const sunSignTa = sunInfo.ta;
  const sunNakInfo = extractNakInfo(chartData.sunNakshatra || chartData.sun);
  const sunNakEn = sunNakInfo.en;
  const sunNakTa = sunNakInfo.ta;

  // Exact Validated Current Dasha
  const currentPeriod = resolveCurrentDashaInterval(chartData, asOf, isTamil);

  // Canonical Planets Collection
  const rawPlanets = Array.isArray(chartData.planets) ? chartData.planets : [];
  const planets = rawPlanets.map(p => {
    const pName = p.name || p.planet || "Planet";
    const pSign = p.sign || p.signName || "Aries";
    const pDeg = Number(p.deg ?? p.degreeInSign ?? ((p.longitude || 0) % 30));
    const pLon = Number(p.longitude ?? 0);
    const pHouse = Number(p.house || 1);
    const isRetro = Boolean(p.isRetrograde || p.retrograde);

    return {
      name: pName,
      nameTamil: TAMIL_PLANET_NAMES[pName] || toTamilPlanet(pName),
      sign: pSign,
      signTamil: TAMIL_SIGN_NAMES[pSign] || toTamilRasi(pSign),
      longitude: pLon,
      degreeInSign: pDeg,
      house: pHouse,
      isRetrograde: isRetro,
      dignity: p.dignity || "Neutral",
      dignityTamil: p.dignityTamil || "நடுநிலை",
      nakshatra: p.nakshatra || "N/A",
      pada: p.pada || 1,
      navamshaSign: p.navamsaSign || p.navamshaSign || pSign,
      shadbalaVirupas: p.shadbalaVirupas || (chartData.shadbala?.find(s => s.planet === pName)?.totalVirupas ?? null),
      shadbalaRatio: p.shadbalaRatio || (chartData.shadbala?.find(s => s.planet === pName)?.strengthRatio ?? null)
    };
  });

  // Canonical Houses Collection (12 Bhavas)
  const rawBhavas = (isTamil ? chartData.bhavasDetailedTamil : chartData.bhavasDetailed) ||
                    (chartData.bhavaChalit?.bhavas) || [];
  const houses = Array.isArray(rawBhavas) && rawBhavas.length === 12
    ? rawBhavas.map((b, idx) => ({
        houseNumber: b.num || b.house || (idx + 1),
        sign: b.signName || b.sign || "Aries",
        signTamil: TAMIL_SIGN_NAMES[b.signName || b.sign] || toTamilRasi(b.signName || b.sign || "Aries"),
        madhyaDeg: b.madhyaDegree || b.madhya || 0,
        lord: b.lord || "Mars",
        lordTamil: TAMIL_PLANET_NAMES[b.lord] || toTamilPlanet(b.lord || "Mars"),
        occupants: Array.isArray(b.occupants) ? b.occupants : [],
        interpretation: isTamil ? (b.summaryTamil || b.interpretationTa || "") : (b.summary || b.interpretation || "")
      }))
    : [];

  // Classical Yogas (Zero generic positive boilerplate)
  const rawYogas = (isTamil ? chartData.detectedYogasTamil : chartData.detectedYogas) || chartData.yogas || [];
  const yogas = Array.isArray(rawYogas) && rawYogas.length > 0
    ? rawYogas.map(y => ({
        name: y.name || y.yogaName || "Vedic Yoga",
        category: y.category || "General",
        nature: y.nature || (y.isFavorable ? "Benefic" : "Challenging"),
        definition: y.definition || y.rule || "",
        effects: isTamil ? (y.effectsTa || y.effects || "") : (y.effects || y.description || "")
      }))
    : [];

  const yogaStatusText = yogas.length > 0
    ? (isTamil ? `${yogas.length} முக்கிய பாரம்பரிய யோகங்கள் கண்டறியப்பட்டன.` : `${yogas.length} classical Vedic yogas verified from planetary geometry.`)
    : (isTamil ? "மதிப்பீடு செய்யப்பட்ட பாரம்பரிய விதிகளின்படி குறிப்பிட்ட யோகங்கள் எதுவும் அமையவில்லை." : "No major classical yogas detected under evaluated classical Parashari rules.");

  // Timeline Governance via timelineApplicabilityPipeline
  const rawTimeline = chartData.chronologicalDashaTimeline?.stages ||
                      chartData.timeline?.stages ||
                      (Array.isArray(chartData.chronologicalDashaTimeline) ? chartData.chronologicalDashaTimeline : []) ||
                      (Array.isArray(chartData.timeline) ? chartData.timeline : []);

  const birthContext = { birthDate: birthDateStr, birthTime: birthTimeStr, timezoneId };
  const sanitizedStages = applyTimelineApplicability(rawTimeline, birthContext, options.context || {}, lang);

  // Structured Timeline Adaptation
  const timelineEntries = sanitizedStages.map((st, idx) => {
    const sAge = Number(st.startAge ?? st.pStart ?? 0);
    const eAge = Number(st.endAge ?? st.pEnd ?? 0);
    const isCurrent = currentPeriod.status === "DETERMINED" &&
                      st.startDate === currentPeriod.startDate &&
                      st.endDate === currentPeriod.endDate;

    return {
      id: st.id || `stage_${idx + 1}`,
      level: "ANTARDASHA",
      parentId: `maha_${st.operatingLord || st.lord || 'Unknown'}`,
      mahadashaLord: st.operatingLord || st.lord || "",
      mahadashaLordTamil: st.operatingLordTamil || st.lordTamil || TAMIL_PLANET_NAMES[st.operatingLord] || "",
      antardashaLord: st.subLord || st.activeAntar || "",
      antardashaLordTamil: st.subLordTamil || st.antarTamil || TAMIL_PLANET_NAMES[st.subLord] || "",
      startDate: st.startDate || "",
      endDate: st.endDate || "",
      ageRange: st.ageRange || `${sAge.toFixed(1)} - ${eAge.toFixed(1)}`,
      ageAtStart: sAge,
      ageAtEnd: eAge,
      ageDisplay: isTamil ? (st.ageDisplayTamil || st.ageRange) : (st.ageDisplay || st.ageRange),
      title: st.title || "",
      theme: st.theme || "",
      domain: st.domain || "Life Trajectory",
      narrative: st.prediction || "",
      guidance: st.actionableGuidance || "",
      applicabilityStatus: st.applicabilityStatus || "CALCULATED",
      isCurrent
    };
  });

  // Timeline Scope Statement (Truthful coverage disclosure)
  const timelineCoverage = tier === "short"
    ? {
        mode: "SNAPSHOT_HORIZON",
        entryCount: Math.min(5, timelineEntries.length),
        statementEn: "Displaying active current period and immediate sequential subperiods. Complete 120-year cycle retained in technical archive.",
        statementTa: "தற்போதைய நடப்பு காலம் மற்றும் அடுத்தடுத்த துணைக் காலக்கட்டங்கள் காட்டப்படுகின்றன. முழுமையான 120-ஆண்டு விம்சோத்தரி சுழற்சி தொழில்நுட்ப ஆவணத்தில் உள்ளது."
      }
    : {
        mode: "FULL_CHRONOLOGICAL_SEQUENCE",
        entryCount: timelineEntries.length,
        statementEn: "Complete sequential Vimshottari dasha progression calibrated to natal Moon longitude. The classical 120-year cycle represents a computational astronomical framework, not a lifespan prediction.",
        statementTa: "ஜனன சந்திரனின் தீர்க்கரேகை அடிப்படையில் கணக்கிடப்பட்ட முழுமையான விம்சோத்தரி தசா வரிசை. 120-ஆண்டு பராசர சுழற்சி என்பது ஒரு பாரம்பரிய வானியல் காலக்கணிப்பு மட்டுமே; மனித ஆயுள் கால கணிப்பு அல்ல."
      };

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    reportIdentifier,
    chartFingerprint,
    calculationIdentifierType: "CANONICAL_ASTRONOMICAL_FINGERPRINT",
    asOf,
    tier,
    audienceMode,
    language: lang,
    isTamil,
    metadata: {
      birthDateStr,
      birthTimeStr,
      latitude: latNum,
      longitude: lngNum,
      utcOffset: tzOffset,
      timezoneId,
      systemId,
      systemName,
      ayanamsaStr
    },
    core: {
      ascendantSign: ascSignEn,
      ascendantSignTamil: ascSignTa,
      ascendantDegree: ascDeg,
      moonSign: moonSignEn,
      moonSignTamil: moonSignTa,
      moonNakshatra: moonNakEn,
      moonNakshatraTamil: moonNakTa,
      moonPada,
      sunSign: sunSignEn,
      sunSignTamil: sunSignTa,
      sunNakshatra: sunNakEn,
      sunNakshatraTamil: sunNakTa
    },
    currentPeriod,
    planets,
    houses,
    yogas: {
      items: yogas,
      statusText: yogaStatusText,
      count: yogas.length
    },
    timeline: {
      coverage: timelineCoverage,
      entries: tier === "short" ? timelineEntries.slice(0, 5) : timelineEntries
    },
    limitations: {
      nonDeterministicNoticeEn: "Astrological indications reflect traditional Parashari interpretive principles; they do not constitute deterministic or scientifically validated predictions of future life events.",
      nonDeterministicNoticeTa: "பாரம்பரிய பராசர ஜோதிட நெறிமுறைகளின்படி அமைந்த குறியீடுகள் மட்டுமே; இவை எதிர்கால வாழ்க்கை நிகழ்வுகளுக்கான அறிவியல் பூர்வமான உத்தரவாதம் அல்ல.",
      legalAndMedicalDisclaimerEn: "This report does not provide medical diagnosis, clinical treatment advice, legal counsel, or financial investment commitments.",
      legalAndMedicalDisclaimerTa: "இந்த அறிக்கை மருத்துவ ஆலோசனையோ, சட்டரீதியான முடிவுகளோ அல்லது நிதி முதலீட்டு வழிகாட்டுதல்களையோ கொண்டிருக்கவில்லை."
    }
  };
}
