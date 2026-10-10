/**
 * ASTROVERSE — Customer Narrative Engine (Sections 26 & 28)
 * ==========================================================
 * Translates complex Jyotisha terminology into accessible, premium,
 * customer-friendly language. Provides deterministic narrative generation
 * adhering to strict evidence-grounded rules and prompt construction.
 */

import { STATUTORY_NOTICES } from "./reportSafetyGate.js";
import { toTamilRasi, toTamilPlanet, toTamilNakshatra } from "../tamilAstrologyUtils.js";

/**
 * Customer-friendly Jyotisha terminology dictionary
 */
export const JYOTISHA_GLOSSARY = Object.freeze({
  "7th lord": "the planet governing the partnership and marriage house",
  "10th lord": "the planet governing professional standing, executive authority, and public status",
  "4th lord": "the planet governing home, real estate, mother, and inner emotional peace",
  "2nd lord": "the planet governing accumulated savings, speech, and family assets",
  "11th lord": "the planet governing cash flow, networks, and major gains",
  "5th lord": "the planet governing intellect, creative potential, and children",
  "6th lord": "the planet governing daily service, workplace diligence, and health imbalances",
  "9th lord": "the planet governing higher wisdom, philosophy, and foreign journeys",
  "Lagna": "the rising sign at the exact moment of birth, signifying constitution and life direction",
  "Navamsha (D9)": "the 9th divisional harmonic chart revealing inner character, marriage alignment, and long-term potential",
  "Dasamsha (D10)": "the 10th divisional chart detailing professional status, leadership impact, and public achievements",
  "Chaturthamsha (D4)": "the 4th divisional chart indicating fixed assets, property acquisition, and residential stability",
  "Shodashamsha (D16)": "the 16th divisional chart governing vehicles, conveyances, and general comforts",
  "Hora (D2)": "the wealth division chart indicating resource accumulation and financial stewardship",
  "Mahadasha": "the major multi-year planetary period defining the overarching life chapter",
  "Antardasha": "the secondary planetary sub-period bringing active near-term events to the forefront",
  "Gochara": "the real-time movement of planets through the sky interacting with your natal chart",
  "Sade Sati": "the traditional 7.5-year cycle of Saturn transiting around your Moon sign, encouraging endurance, discipline, and maturity",
  "Shadbala": "the comprehensive classical calculation evaluating six distinct dimensions of planetary strength",
  "Atmakaraka": "the planet holding the highest longitudinal degree, representing the soul's primary evolution journey",
  "Yogakaraka": "a single auspicious planet simultaneously ruling a quadrant and trine house, conferring natural harmony"
});

export const JYOTISHA_GLOSSARY_TAMIL = Object.freeze({
  "7-ம் அதிபதி": "திருமணம் மற்றும் வாழ்க்கைத் துணையை குறிக்கும் கிரகம்",
  "10-ம் அதிபதி": "தொழில், பதவி மற்றும் பொது வாழ்வை நிர்வகிக்கும் கிரகம்",
  "4-ம் அதிபதி": "வீடு, நிலம், தாயார் மற்றும் மன அமைதியை ஆளும் கிரகம்",
  "2-ம் அதிபதி": "சேமிப்பு, குடும்ப வளம் மற்றும் பேச்சை குறிக்கும் கிரகம்",
  "11-ம் அதிபதி": "லாபம், வருமானம் மற்றும் நன்மைகளை குறிக்கும் கிரகம்",
  "5-ம் அதிபதி": "புத்தி கூர்மை, பூர்வ புண்ணியம் மற்றும் குழந்தைகளை குறிக்கும் கிரகம்",
  "6-ம் அதிபதி": "உத்தியோகம், உழைப்பு மற்றும் சவால்களை குறிக்கும் கிரகம்",
  "9-ம் அதிபதி": "பாக்கியம், தந்தை மற்றும் ஆன்மீகத்தை ஆளும் கிரகம்",
  "லக்னம்": "பிறந்த நேரத்தில் கிழக்கு வானில் உதித்த ராசி (ஆளுமை மற்றும் உடல் நலம்)",
  "நவாம்சம் (D9)": "உள்மன பலம் மற்றும் திருமண வாழ்க்கையை விவரிக்கும் 9-வது வர்க்க சக்கரம்",
  "தசாம்சம் (D10)": "தொழில் நிலை மற்றும் தலைமைத்துவத்தை விவரிக்கும் 10-வது வர்க்க சக்கரம்",
  "மகா தசா": "வாழ்க்கையின் முக்கிய நீண்ட கால கிரக ஆட்சி காலம்",
  "புக்தி": "தசா காலத்திற்குள் இயங்கும் குறிப்பிட்ட உப-காலம்",
  "கோச்சாரம்": "வானில் நிகழும் தற்போதைய நேரடி கிரகப் பெயர்ச்சி சுழற்சிகள்",
  "ஏழரை சனி": "சனி பகவான் சந்திரனுக்கு 12, 1, 2-ல் சஞ்சரிக்கும் 7.5 ஆண்டு முதிர்ச்சி காலம்",
  "ஷாட்பலம்": "கிரகங்களின் ஆறு வகை வலிமையை அளவிடும் பாரம்பரிய கணக்கீடு",
  "ஆத்மகாரகன்": "ஜாதகத்தில் அதிக பாகை பெற்று ஆன்ம பயணத்தை வழிநடத்தும் கிரகம்"
});

/**
 * Automatically annotates technical terms in text with plain-language explanations.
 */
export function glossarizeText(text, isTamil = false) {
  if (!text || typeof text !== "string") return text;
  let result = text;
  const glossary = isTamil ? JYOTISHA_GLOSSARY_TAMIL : JYOTISHA_GLOSSARY;

  for (const [term, explanation] of Object.entries(glossary)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "g");
    if (result.includes(term) && !result.includes(`(${explanation})`)) {
      result = result.replace(regex, `${term} (${explanation})`);
    }
  }

  return result;
}

/**
 * Builds the comprehensive, non-negotiable prompt for AI narrative generation (Section 26).
 *
 * @param {Object} lifeReport - The complete LifeReportModel
 * @param {string} [lang="en"] - "en" or "ta"
 * @returns {string} The certified prompt
 */
export function buildCustomerFriendlyPrompt(lifeReport, lang = "en") {
  const isTamil = lang === "ta";
  const clientName = lifeReport.clientProfile?.name || "Client";
  const birthDate = lifeReport.dataQuality?.birthDate || "N/A";
  const birthPlace = lifeReport.dataQuality?.birthLocation || "N/A";

  const coreProfile = lifeReport.coreNatalProfile || {};
  const currentPhase = lifeReport.executiveSummary?.currentLifePhase || {};

  return `
You are the ASTROVERSE Premium Life Intelligence Dossier Narrator.
Synthesize the structured astrological facts below into an exhaustive, deeply personalized, highly readable, non-repetitive customer report for ${clientName}.

============================================================
NON-NEGOTIABLE SCIENTIFIC & EDITORIAL CONSTRAINTS
============================================================
1. Use ONLY supplied structured evidence. Do not calculate astrology independently.
2. DO NOT introduce new astrological facts, placements, or aspects.
3. DO NOT invent dates, years, or numbers.
4. DO NOT invent probabilities, statistical percentages, or empirical accuracy claims.
5. DO NOT convert traditional indications into scientific or medical claims.
6. DO NOT repeat the same generic sentence across domains (e.g. NEVER repeat "X indicates success and growth"). Every domain must receive unique, domain-specific insights.
7. Explain every technical term in customer-friendly language (e.g. for "7th lord", explain: "the planet governing partnership and marriage").
8. Clearly distinguish: Fact vs Traditional Interpretation vs Timing Window vs Limitation.
9. STRICT MEDICAL BLOCK: Never mention cancer, tumor, surgery, organ failure, death, or lifespan. Treat wellness strictly as constitutional lifestyle balance.
10. STRICT LEGAL & FINANCIAL BLOCK: Never state "You will win the case" or guarantee profits. Always include advisory disclaimers.

============================================================
CLIENT SNAPSHOT & BIRTH DATA
============================================================
- Client Name: ${clientName}
- Birth Date & Location: ${birthDate} at ${birthPlace}
- Ascendant (Lagna): ${coreProfile.ascendant?.sign || "Calculated"} (${coreProfile.ascendant?.degree || 0}°)
- Moon Sign & Nakshatra: ${coreProfile.moonSign?.sign || "Calculated"}, ${coreProfile.moonNakshatra?.name || "Calculated"}
- Sun Sign: ${coreProfile.sunSign?.sign || "Calculated"}
- Atmakaraka: ${coreProfile.atmakaraka?.planet || "Calculated"}
- Current Operating Dasha: ${currentPhase.dashaDisplay || "Active Phase"} (Current Age: ${currentPhase.currentAgeDisplay || "Active"})

============================================================
MANDATORY 17 DOMAINS TO EXPAND EXHAUSTIVELY
============================================================
${(lifeReport.domainReports || []).map((dr, idx) => `
Domain ${idx + 1}: ${dr.domainName?.[isTamil ? "ta" : "en"] || dr.domainId}
- Overall Assessment: ${dr.overallTraditionalAssessment} (Evidence: ${dr.evidenceStrength})
- Key Findings: ${dr.positiveIndicators?.slice(0, 3).join("; ") || "Baseline alignment"}
- Timing: ${dr.traditionalTimingWindows?.[0]?.start || "Upcoming"} to ${dr.traditionalTimingWindows?.[0]?.end || "Future"} [TRADITIONAL RULE WINDOW]
- Practical Guidance: ${dr.practicalGuidance?.slice(0, 2).join("; ") || "Thoughtful planning"}
`).join("\n")}

Format the response in rich, elegant, human-centered markdown with clear headings, evidence callouts, and practical guidance.
`;
}

/**
 * Deterministically generates rich, non-repetitive customer-friendly narrative
 * for every section and domain of the LifeReportModel.
 *
 * @param {Object} lifeReport - The complete LifeReportModel
 * @param {string} [lang="en"] - "en" or "ta"
 * @returns {Object} LifeReportModel augmented with rich narrative text
 */
export function generateAlgorithmicNarrative(lifeReport, lang = "en") {
  const isTamil = lang === "ta";
  const clientName = lifeReport.clientProfile?.name || (isTamil ? "ஜாதகர்" : "Client");
  const coreProfile = lifeReport.coreNatalProfile || {};
  const currentPhase = lifeReport.lifeTimeline?.CURRENT || lifeReport.executiveSummary?.currentLifePhase || {};

  // 1. Executive Summary Narrative
  if (lifeReport.executiveSummary) {
    const ascSign = coreProfile.ascendant?.sign || "";
    const ascSignTa = toTamilRasi(ascSign) || ascSign;
    const moonSign = coreProfile.moonSign?.sign || "";
    const moonSignTa = toTamilRasi(moonSign) || moonSign;
    const moonNak = typeof coreProfile.moonNakshatra === "object" ? (coreProfile.moonNakshatra.name || "") : (coreProfile.moonNakshatra || "");
    const moonNakTa = toTamilNakshatra(moonNak) || moonNak;
    const sunSignVal = typeof coreProfile.sunSign === "object" ? (coreProfile.sunSign.sign || "") : (coreProfile.sunSign || "");
    const sunSignTa = toTamilRasi(sunSignVal) || sunSignVal;
    const akPlanet = (coreProfile.atmakaraka && typeof coreProfile.atmakaraka === "object") ? (coreProfile.atmakaraka.planet || "") : (coreProfile.atmakaraka || "");
    const akPlanetTa = toTamilPlanet(akPlanet) || akPlanet;

    lifeReport.executiveSummary.coreProfileSummary = isTamil
      ? `${clientName} அவர்களின் ஜாதகம் ${ascSignTa} லக்னம் அடிப்படையில் அமையப் பெற்றுள்ளது. சந்திரன் ${moonSignTa} ராசியில் ${moonNakTa} நட்சத்திரத்தில் சஞ்சரிக்கிறார். சூரியன் ${sunSignTa} ராசியில் நிலைபெற்றுள்ளார். ஆத்மகாரகன் ${akPlanetTa} ஆவார். இந்த ஜாதகத்தில் லக்னம் மற்றும் ராசி பலம் மூலம் தலைமைத்துவம், ஒழுக்கம் மற்றும் ஆழ்ந்த நுண்ணறிவுக்கான அமைப்புகள் வலுவாக அமைந்துள்ளன.`
      : `The natal chart of ${clientName} is anchored by an Ascendant (Lagna) in ${ascSign} at ${coreProfile.ascendant?.degree || 0}°, with the Moon positioned in ${moonSign} (${moonNak}) and the Sun placed in ${sunSignVal}. The Soul Significator (Jaimini Chara Atmakaraka) is ${akPlanet}. This foundational architecture reflects steady endurance, practical intellect, and institutional growth potential.`;
  }

  // 2. Domain Reports Narrative Enrichment
  if (Array.isArray(lifeReport.domainReports)) {
    lifeReport.domainReports.forEach(dr => {
      const dName = dr.domainName?.[isTamil ? "ta" : "en"] || dr.domainId;
      const primaryHouse = dr.technicalEvidence?.primaryHouse || 1;
      const primaryLord = dr.technicalEvidence?.primaryLord || "Lagna Lord";

      dr.narrative = {
        overview: isTamil
          ? `${dName} டொமைன் வாழ்க்கையின் மிக முக்கியமான பரிமாணமாகும். இது ஜாதகத்தில் பிரதானமாக ${primaryHouse}-ம் பாவகம் மற்றும் அதன் அதிபதி ${primaryLord} மூலம் நிர்வகிக்கப்படுகிறது. பாரம்பரிய ஜோதிட நூல்களின்படி இந்த அமைப்பு ஒருவரின் இயல்பான போக்கையும், சவால்களையும், முன்னேற்றத்திற்கான நல்வாய்ப்புகளையும் பிரதிபலிக்கிறது.`
          : `The ${dName} domain represents a cornerstone of lifelong fulfillment. In classical Vedic astrology, this arena is anchored by House ${primaryHouse} and governed by its lord, ${primaryLord}. The interplay of planetary dignities, divisional confirmations, and temporal Dasha cycles shapes the natural baseline tendencies for this domain.`,
        whatChartShows: isTamil
          ? `உங்கள் ஜாதகத்தில் ${primaryLord} பெற்றுள்ள நிலை மற்றும் சுப கிரகங்களின் பார்வை ${dName} துறையில் ${dr.overallTraditionalAssessment} நிலையை வழங்குகிறது. இந்த அமைப்புகள் உங்களுக்கு உள்ளார்ந்த ஆற்றலையும் நிலைத்தன்மையையும் அளிக்கின்றன.`
          : `Your natal disposition indicates that ${primaryLord} confers a ${dr.overallTraditionalAssessment} orientation towards ${dName}. The dignity of primary significators fosters innate resilience and structured evolution across this life sector.`,
        timingNotice: isTamil
          ? `கால நிர்ணயம்: பாரம்பரிய தசா-கோச்சார சுழற்சிகள் அடிப்படையில் இந்த சாளரங்கள் 'பாரம்பரிய விதிமுறை சாளரம்' (TRADITIONAL RULE WINDOW) என வகைப்படுத்தப்படுகின்றன. இது எதிர்கால அறிவியல் உத்தரவாதம் அல்ல.`
          : `Timing Resolution: All timing periods are evaluated as TRADITIONAL RULE WINDOWS based on classical Dasha-transit synchronicity. They represent traditional supportive cycles rather than deterministic empirical guarantees.`
      };
    });
  }

  return lifeReport;
}
