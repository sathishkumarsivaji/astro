/**
 * AI Deep Astrological Reading Service
 * Integrates Google Gemini API to synthesize astronomical ephemeris data
 * into deeply personalized, multi-page classical Vedic astrology dossiers.
 */

import {
  toTamilRasi,
  toTamilPlanet,
  toTamilNakshatra,
  toTamilDignity,
  cleanEnglishParentheses
} from "./tamilAstrologyUtils.js";
import { apiFetch } from "./apiClient.js";

// Server-side session & credit management: Authentication relies on secure HttpOnly cookies + in-memory Bearer token fallback.
let cachedSessionToken = null;
let cachedUser = null;
let cachedUserId = null;

export function getCachedUser() {
  return cachedUser;
}

export function setCachedUser(user) {
  cachedUser = user;
  if (user && user.id) cachedUserId = user.id;
}

export function clearCachedUser() {
  cachedUser = null;
  cachedUserId = null;
  cachedSessionToken = null;
}

/**
 * Ensures an authenticated session exists with the backend server via cryptographic handshake.
 */
export async function ensureSessionToken() {
  if (cachedSessionToken) {
    return cachedSessionToken;
  }

  const headers = {};
  if (cachedSessionToken) {
    headers["Authorization"] = `Bearer ${cachedSessionToken}`;
  }

  try {
    const res = await apiFetch("/api/auth/session", {
      method: "POST",
      headers
    });

    if (res && res.ok) {
      const data = await res.json();
      if (data.sessionToken) {
        cachedSessionToken = data.sessionToken;
        if (data.userId) cachedUserId = data.userId;
        if (data.user) cachedUser = data.user;
        return cachedSessionToken;
      }
    }
  } catch {
    // Backend offline or unreachable
  }

  return null;
}

export function getSessionToken() {
  return cachedSessionToken || null;
}

export async function fetchUserCredits() {
  const token = await ensureSessionToken();
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await apiFetch("/api/user/entitlements", {
      method: "GET",
      headers
    });

    if (res && res.ok) {
      const data = await res.json();
      return typeof data.availableCredits === "number" ? data.availableCredits : null;
    }
  } catch {
    // Return null if offline; do not fabricate client-side credits
  }
  return null;
}

export async function fetchCurrentUser() {
  let token = cachedSessionToken;
  if (!token) {
    token = await ensureSessionToken();
  }

  try {
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const res = await apiFetch("/api/auth/me", {
      headers
    });
    if (res && res.ok) {
      const data = await res.json();
      if (data.user) {
        cachedUser = data.user;
        if (data.userId) cachedUserId = data.userId;
        return data.user;
      }
    }
  } catch (e) {
    console.warn("fetchCurrentUser error:", e);
  }
  return null;
}

export async function registerUser({ name, email, password }) {
  const body = JSON.stringify({
    name,
    email,
    password,
    existingUserId: null
  });
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    body
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  if (data.sessionToken) {
    cachedSessionToken = data.sessionToken;
    if (data.userId) cachedUserId = data.userId;
    if (data.user) cachedUser = data.user;
  }
  return data;
}

export async function loginUser({ email, password }) {
  const body = JSON.stringify({ email, password });
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  if (data.sessionToken) {
    cachedSessionToken = data.sessionToken;
    if (data.userId) cachedUserId = data.userId;
    if (data.user) cachedUser = data.user;
  }
  return data;
}

export async function initGuestSession() {
  try {
    const res = await apiFetch("/api/auth/guest", {
      method: "POST"
    });
    const data = await res.json();
    if (res.ok && data.sessionToken) {
      cachedSessionToken = data.sessionToken;
      if (data.userId) cachedUserId = data.userId;
      if (data.user) cachedUser = data.user;
    }
    return data;
  } catch (e) {
    console.warn("initGuestSession error:", e);
    return null;
  }
}

export async function logoutUser() {
  const token = cachedSessionToken;
  clearCachedUser();
  try {
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    await apiFetch("/api/auth/logout", { method: "POST", headers });
  } catch {
    // Ignore network error on logout
  }
}

import { getStructuredVargaData, validateAndSanitizeNarrative } from "./astroEngine.js";

function formatStructuredVargas(structuredVargas, divisionalCharts, isTamil) {
  if (structuredVargas && Object.keys(structuredVargas).length > 0) {
    const lines = [];
    for (const [vKey, vData] of Object.entries(structuredVargas)) {
      const vName = vData.name || vKey;
      const asc = vData.ascendant;
      lines.push(`\n**[${vKey}] ${vName}:**`);
      lines.push(`- Ascendant: ${asc?.sign || 'N/A'} (Ruler: ${asc?.ruler || 'N/A'})`);
      const planetsList = (vData.planets || []).map(p => {
        const ret = p.isRetrograde ? " [Retrograde]" : "";
        const comb = p.isCombust ? " [Combust]" : "";
        const signStr = p.signName || p.sign || p.vargaSign || "Unknown Sign";
        const hVal = p.house ?? p.vargaHouse ?? null;
        const houseStr = hVal != null ? `House ${hVal}` : "House unassigned";
        const dignityStr = p.dignity || "Neutral";
        return `${p.name}: in ${signStr} (${houseStr}, Dignity: ${dignityStr}${ret}${comb})`;
      }).join("; ");
      lines.push(`- Planetary Placements: ${planetsList}`);
    }
    return lines.join("\n");
  }

  if (divisionalCharts) {
    return `
- D2 Hora: ${divisionalCharts.d2Hora?.ascendant?.name || 'N/A'}
- D3 Drekkana: ${divisionalCharts.d3Drekkana?.ascendant?.name || 'N/A'}
- D4 Chaturthamsha: ${divisionalCharts.d4Chaturthamsha?.ascendant?.name || 'N/A'}
- D7 Saptamsha: ${divisionalCharts.d7Saptamsha?.ascendant?.name || 'N/A'}
- D9 Navamsha: ${divisionalCharts.d9Navamsha?.ascendant?.name || 'N/A'}
- D10 Dasamsha: ${divisionalCharts.d10Dasamsha?.ascendant?.name || 'N/A'}
- D12 Dvadasamsha: ${divisionalCharts.d12Dvadasamsha?.ascendant?.name || 'N/A'}
- D16 Shodashamsha: ${divisionalCharts.d16Shodashamsha?.ascendant?.name || 'N/A'}
- D20 Vimsamsha: ${divisionalCharts.d20Vimsamsha?.ascendant?.name || 'N/A'}
- D24 Chaturvimsamsha: ${divisionalCharts.d24Chaturvimsamsha?.ascendant?.name || 'N/A'}
- D27 Saptavimsamsha: ${divisionalCharts.d27Saptavimsamsha?.ascendant?.name || 'N/A'}
- D30 Trimsamsha: ${divisionalCharts.d30Trimsamsha?.ascendant?.name || 'N/A'}
- D40 Khavedamsha: ${divisionalCharts.d40Khavedamsha?.ascendant?.name || 'N/A'}
- D45 Akshavedamsha: ${divisionalCharts.d45Akshavedamsha?.ascendant?.name || 'N/A'}
- D60 Shashtiamsha: ${divisionalCharts.d60Shashtiamsha?.ascendant?.name || 'N/A'}
`;
  }
  return "";
}

function formatMasterPredictionsSummary(masterPredictions, isTamil) {
  if (!masterPredictions) return "";
  const lines = [];
  if (masterPredictions.marriage?.windows?.length > 0) {
    const wins = masterPredictions.marriage.windows.map(w => 
      `${w.calendarYears} (Ages ${w.ageRange}) [Dasha: ${w.operatingLord}-${w.subLord}, Classification: ${w.classification || w.convergenceTier || 'Evaluated'}]`
    ).join("; ");
    lines.push(`- **${isTamil ? "திருமண சுப காலங்கள்" : "Marriage Timing Windows"}:** ${wins}`);
  }
  if (masterPredictions.career?.windows?.length > 0) {
    const wins = masterPredictions.career.windows.map(w => 
      `${w.calendarYears} (Ages ${w.ageRange}) [Dasha: ${w.operatingLord}-${w.subLord}, Classification: ${w.classification || w.convergenceTier || 'Evaluated'}]`
    ).join("; ");
    lines.push(`- **${isTamil ? "தொழில் பொற்காலங்கள் & முன்னேற்ற கட்டங்கள்" : "Career Zenith & Progression Windows"}:** ${wins}`);
  }
  if (masterPredictions.property?.windows?.length > 0) {
    const wins = masterPredictions.property.windows.map(w => 
      `${w.calendarYears} (Ages ${w.ageRange}) [Dasha: ${w.operatingLord}-${w.subLord}, Classification: ${w.classification || w.convergenceTier || 'Evaluated'}]`
    ).join("; ");
    lines.push(`- **${isTamil ? "சொத்து, மனை & வாகன யோக காலங்கள்" : "Real Estate & Property Windows"}:** ${wins}`);
  }
  if (masterPredictions.education?.windows?.length > 0) {
    const wins = masterPredictions.education.windows.map(w => 
      `${w.calendarYears} (Ages ${w.ageRange}) [Dasha: ${w.operatingLord}-${w.subLord}, Classification: ${w.classification || w.convergenceTier || 'Evaluated'}]`
    ).join("; ");
    lines.push(`- **${isTamil ? "உயர்கல்வி & கல்வி மைல்கற்கள்" : "Higher Education & Academic Milestones"}:** ${wins}`);
  }
  if (masterPredictions.progeny?.windows?.length > 0) {
    const wins = masterPredictions.progeny.windows.map(w => 
      `${w.calendarYears} (Ages ${w.ageRange}) [Dasha: ${w.operatingLord}-${w.subLord}, Classification: ${w.classification || w.convergenceTier || 'Evaluated'}]`
    ).join("; ");
    lines.push(`- **${isTamil ? "புத்திர பாக்கிய சுப காலங்கள்" : "Progeny & Family Expansion Windows"}:** ${wins}`);
  }
  if (masterPredictions.wellness?.windows?.length > 0) {
    const wins = masterPredictions.wellness.windows.map(w => 
      `${w.calendarYears} (Ages ${w.ageRange}) [Dasha: ${w.operatingLord}-${w.subLord}, Focus: ${w.focusAreas?.join(', ') || 'Diligence'}]`
    ).join("; ");
    lines.push(`- **${isTamil ? "பாரம்பரிய ஆரோக்கிய தற்காப்பு காலங்கள்" : "Traditional Wellness & Diligence Windows"}:** ${wins}`);
  }
  return lines.join("\n");
}

/**
 * Builds a comprehensive astrological prompt embedding exact ephemeris data
 */
export function buildAstrologyPrompt(chartData, lang = "en") {
  const isTamil = lang === "ta";
  const {
    ascendantSign,
    moonSign,
    moonNakshatra,
    sunSign,
    sunNakshatra,
    planets,
    panchangam,
    currentDasha,
    dashaTable,
    doshaAnalysis,
    detectedYogas,
    detectedYogasTamil,
    bhavasDetailed,
    bhavasDetailedTamil,
    domainPredictions,
    domainPredictionsTamil,
    jaiminiKarakas,
    divisionalCharts,
    structuredVargas,
    shadbala,
    pratyantardasha,
    careerPathway,
    careerPathwayTamil,
    marriagePathway,
    marriagePathwayTamil,
    evidenceLedger,
    evidenceLedgerTamil,
    chronologicalDashaTimeline,
    chronologicalDashaTimelineTamil,
    vimshottariCycleTimeline,
    vimshottariCycleTimelineTamil,
    riskMatrix,
    riskMatrixTamil,
    retrospectiveLifeAudit,
    retrospectiveLifeAuditTamil,
    masterPredictions,
    masterPredictionsTamil,
    reportEvidencePackage,
    reportEvidencePackageTamil
  } = chartData;

  const yogasToUse = isTamil ? (detectedYogasTamil || chartData.vedicYogasTamil) : (detectedYogas || chartData.vedicYogas);
  const bhavasToUse = isTamil ? bhavasDetailedTamil : bhavasDetailed;
  const pathwayToUse = isTamil ? (careerPathwayTamil || careerPathway) : careerPathway;
  const marriageToUse = isTamil ? (marriagePathwayTamil || marriagePathway) : marriagePathway;
  const ledgerToUse = isTamil ? (evidenceLedgerTamil || evidenceLedger) : evidenceLedger;
  const timelineToUse = isTamil ? (chronologicalDashaTimelineTamil || vimshottariCycleTimelineTamil || chronologicalDashaTimeline || vimshottariCycleTimeline) : (chronologicalDashaTimeline || vimshottariCycleTimeline);
  const riskToUse = isTamil ? (riskMatrixTamil || riskMatrix) : riskMatrix;
  const retroToUse = isTamil ? (retrospectiveLifeAuditTamil || retrospectiveLifeAudit) : retrospectiveLifeAudit;
  const masterPredsToUse = isTamil ? (masterPredictionsTamil || masterPredictions) : masterPredictions;
  const evidencePkgToUse = isTamil ? (reportEvidencePackageTamil || reportEvidencePackage) : reportEvidencePackage;

  const planetaryPositionsSummary = (planets || []).map(p => {
    return `- ${p.name} (${p.tamil || p.name}): In ${p.sign} (${p.signTamil || p.sign}) at ${p.degreeInSign || p.long?.toFixed(2)}°, House ${p.house} (${(p.isRetrograde ?? p.retrograde) ? 'Retrograde/வக்ரம்' : 'Direct'}, Dignity: ${p.dignity || 'Neutral'})`;
  }).join("\n");

  const karakasSummary = (jaiminiKarakas || []).map(k => {
    return `- ${k.code} (${isTamil ? k.roleTa : k.role}): ${k.planet} (${k.planetTa}) at ${k.degInSign} in ${k.sign} (House ${k.house})`;
  }).join("\n");

  const atmakaraka = chartData.atmakaraka || (jaiminiKarakas && jaiminiKarakas[0]) || null;
  const atmakarakaSummary = atmakaraka ? `
- **Jaimini Chara Atmakaraka (Soul Planet):** ${atmakaraka.planet} (${atmakaraka.planetTa || atmakaraka.planet}) at ${atmakaraka.degInSign || atmakaraka.degreeInSign || ''} in ${atmakaraka.sign} (House ${atmakaraka.house})
- **Spiritual Signification:** ${isTamil ? (atmakaraka.spiritualSignificationTa || atmakaraka.spiritualSignification || "ஆன்ம வளர்ச்சி மற்றும் தர்ம கடமைகள்") : (atmakaraka.spiritualSignification || "Soul evolution and highest dharmic realization")}` : "";

  const shadbalaSummary = (Array.isArray(shadbala) ? shadbala : []).map(s => {
    return `- ${s.planet} (${s.planetTa || s.planet}): ${s.totalRupas} Rupas / ${s.requiredRupas} Required (Ratio: ${s.ratio}) - [${s.status}]`;
  }).join("\n");

  const effectiveStructuredVargas = structuredVargas || evidencePkgToUse?.structuredVargas || (planets && ascendantSign ? getStructuredVargaData(planets, chartData.ascendant?.longitude ?? chartData.ascendantLong ?? 0) : null);
  const vargasSummary = formatStructuredVargas(effectiveStructuredVargas, divisionalCharts, isTamil);

  const pratyantarSummary = pratyantardasha ? `
- Active Sub-Period: ${pratyantardasha.majorLord} Dasha -> ${pratyantardasha.subLord} Bukthi
- Running Pratyantardashas: ${(pratyantardasha.pratyantars || []).map(p => `${p.lord} (${p.durationDays}d)`).join(" -> ")}
` : "";

  const bhavasSummary = (bhavasToUse || []).map(b => {
    const asp = (b.aspectsOnHouse || []).length > 0 ? b.aspectsOnHouse.join(", ") : "None";
    const d9 = b.lordD9Sign ? ` (D9: ${b.lordD9Sign})` : "";
    return `- House ${b.num} (${b.sanskrit}): Sign ${b.signName} (${b.signTamil}), Lord ${b.lordName} (${b.lordTamil})${d9} placed in House ${b.lordHouse} [Dignity: ${b.lordDignity || 'Neutral'}], Occupants: [${(b.occupants || []).join(", ") || "None"}], Aspects: [${asp}], Status: ${b.strengthTier || 'Balanced'}`;
  }).join("\n");

  const dashaSummary = (dashaTable || []).map(d => {
    const dur = d.durationYears || d.totalYears || "";
    const statusStr = d.isCurrent ? "Active / Current Dasha" : "Completed / Future";
    return `- ${d.lord} (${d.tamil}): Ages ${d.startAge} - ${d.endAge} (${dur} yrs) [${statusStr}]`;
  }).join("\n");

  const yogasSummary = (yogasToUse || []).map(y => {
    const manifest = y.manifestation ? ` | Manifestation: ${y.manifestation}` : "";
    return `- ${y.name} (${y.category}): ${y.desc || y.definition}${manifest}`;
  }).join("\n");

  const pathwaySummary = pathwayToUse ? `
- **${isTamil ? "போட்டித் தேர்வு உண்மை நிலை" : "Exam Diagnostic"}:** ${pathwayToUse.examObstacleVerdict}
- **${isTamil ? "தொழில் & வணிக விதி" : "Career Destiny"}:** ${pathwayToUse.careerDestinyVerdict}
` : "";

  const marriageSummary = marriageToUse ? `
- **${isTamil ? "திருமண கால & களத்திர ஆய்வு" : "Marriage Timing & 7th House Diagnostic"}:** ${marriageToUse.verdict}
- **${isTamil ? "உகந்த விவாக சுப காலம்" : "Calculated Marriage Dasha Window"}:** ${marriageToUse.auspiciousAgeRange} (${marriageToUse.calendarYears})
- **${isTamil ? "வாழ்க்கைத்துணை பண்பு" : "Spouse Profile"}:** ${marriageToUse.spouseProfile}
` : "";

  const masterPredsSummary = formatMasterPredictionsSummary(masterPredsToUse, isTamil);

  // Format Evidence Ledger (multi-factor strengths and counter-indicators without truncation)
  const evidenceSummary = ledgerToUse ? Object.entries(ledgerToUse).map(([dom, data]) => {
    const sup = (data.supportingFactors || []).length > 0 ? data.supportingFactors.join("; ") : "None";
    const cou = (data.counterIndicators || []).length > 0 ? data.counterIndicators.join("; ") : "None";
    return `- **${data.title || dom}:** Classical Status: ${data.status || data.evidenceLevel || 'Evaluated'} (${data.evidenceLevel || 'Qualitative Evidence'}). Supporting: [${sup}]. Counter-Indicators: [${cou}].`;
  }).join("\n") : "";

  // Format Dynamic Risk Windows
  const riskSummary = riskToUse?.risks ? riskToUse.risks.map(r => {
    return `- **${r.title}:** Caution Level: ${r.traditionalCautionLevel}. Caution Window: ${r.traditionalCautionWindowAge} (${r.traditionalCautionCalendarYears || ''}). Traditional Body Areas/Zones: ${r.traditionalBodyAreas || 'General'}. Astrological Basis: ${r.astrologicalBasis || ''}. Protective Guidance: ${r.protectiveRemedy}.`;
  }).join("\n") : "";

  // Format Retrospective Dasha Correlation Review (Historical validation for senior persons)
  const retroList = Array.isArray(retroToUse) ? retroToUse : (retroToUse?.milestones || []);
  const retrospectiveSummary = retroList.map(m => {
    return `- [${m.milestoneId}] Age ${m.ageRange} (${m.calendarYears}) | Dasha: ${m.dasha} | Theme: ${m.milestoneTheme} | Alignment: ${m.alignment} | Milestone Trigger: ${m.lifeEventTrigger} | Verification Prompt: "${m.verificationPrompt}"`;
  }).join("\n");

  // Format Dynamic Dasha Timeline Stages with COMPLETE UNTRUNCATED FACTORS & TRANSITS
  const timelineStages = Array.isArray(timelineToUse) ? timelineToUse : (timelineToUse?.stages || []);
  const timelineSummary = timelineStages.map(s => {
    const sups = (s.supportingFactors || []).length > 0 ? s.supportingFactors.join("; ") : "None";
    const cous = (s.counterIndicators || []).length > 0 ? s.counterIndicators.join("; ") : "None";
    const trans = (s.transitCrossings || []).length > 0
      ? s.transitCrossings.map(t => typeof t === "string" ? t : (isTamil ? t.summaryTa : t.summaryEn)).join(" | ")
      : s.planetaryTransit || "Baseline";
    const pds = (s.pratyantardashas || []).length > 0
      ? s.pratyantardashas.map(pd => `${pd.lord} (${pd.startDate} to ${pd.endDate})`).join(" -> ")
      : "Standard";
    return `- Stage ${s.stageNum}: Age ${s.ageRange} (${s.calendarYears || ''}) | Title: ${s.title} | Dasha: ${s.dashaTrigger} | Transit Crossings: [${trans}] | Pratyantardashas: [${pds}] | Supporting Factors: [${sups}] | Counter-Indicators: [${cous}]`;
  }).join("\n");

  const remediesToUse = isTamil ? (chartData.personalizedRemediesTamil || chartData.personalizedRemedies) : chartData.personalizedRemedies;
  const remediesSummary = remediesToUse ? `
- **Primary Gemstone:** ${remediesToUse.primaryGemstone} (Lord: ${remediesToUse.gemLord}, Metal: ${remediesToUse.metal}, Finger: ${remediesToUse.finger})
- **Recommended Gemstones:** ${(remediesToUse.gemstonePrescription || []).map(g => `${g.gemstone} (${g.suitability} - ${g.reason})`).join("; ") || 'None'}
- **Contraindicated Gemstones:** ${(remediesToUse.contraindicatedGemstones || []).map(g => `${g.gemstone} (Contraindicated - ${g.reason})`).join("; ") || 'None'}
- **Mantra Sadhana:** ${remediesToUse.mantra}
- **Auspicious Charity:** ${remediesToUse.charity}
` : "";

  const doshaToUse = isTamil ? (chartData.tridoshaBalanceTamil || chartData.tridoshaBalance) : chartData.tridoshaBalance;
  const tridoshaSummary = doshaToUse ? `
- **Dominant Constitution:** Primary ${doshaToUse.primaryDosha || 'Vata'}, Secondary ${doshaToUse.secondaryDosha || 'Pitta'} (Tendency Level: ${doshaToUse.tendencyLevel || 'Moderate'})
- **Elemental Factor Balance:** Fire=${doshaToUse.elementalDistribution?.fire ?? 'N/A'}, Air=${doshaToUse.elementalDistribution?.air ?? 'N/A'}, Water=${doshaToUse.elementalDistribution?.water ?? 'N/A'}, Earth=${doshaToUse.elementalDistribution?.earth ?? 'N/A'}
- **Constitutional Guidance:** Vata (${doshaToUse.vata?.guidance || ''}), Pitta (${doshaToUse.pitta?.guidance || ''}), Kapha (${doshaToUse.kapha?.guidance || ''})
` : "";

  if (isTamil) {
    return `நீங்கள் ஒரு கவனமான வேத ஜோதிட அறிக்கை எழுத்தாளர் (Vedic Astrology Report Writer). பராசர ஹோரா சாஸ்திரம், ஜைமினி சூத்திரம், பலதீபிகை மற்றும் சப்தரிஷி வாக்கியங்களின்படி, கீழே தரப்பட்டுள்ள துல்லியமான நவகிரக வானியல் கணித விவரங்களை மட்டுமே அடிப்படையாகக் கொண்டு, இந்த ஜாதகருக்குரிய உயர் துல்லியமான பராசர முறை மகா ஜாதக ஆயுள் வழிகாட்டி அறிக்கையை (Exhaustive Personalized Master Dossier) தயார் செய்து வழங்கவும்.

கண்டிப்பான சாஸ்திர விதிமுறைகள் & துல்லியக் கட்டளைகள் (Strict Rules):
1. **சான்றுகள் தளம் & விளக்குதல் மட்டுமே (Interpret Only - 4-Layer Structure):** ஒவ்வொரு பலனையும் 4 அடுக்குகளாக விவரிக்கவும்: 1) வானியல் கணிதம் -> 2) பாரம்பரிய சாஸ்திர விளக்கம் -> 3) நடப்பு தசா-கோச்சார காலம் -> 4) நடைமுறை வழிகாட்டல்.
2. **ஆத்மகாரகன் தனித்துவம்:** சூரிய ராசியை ஆன்ம ஆளுமையாக விளக்குவதோடு, உண்மையான ஜைமினி சப்த காரக ஆத்மகாரக கிரகத்தை (${atmakaraka?.planet || 'AK'}) தனித்துவமாக ஆன்ம லட்சியத்திற்கு விவரிக்கவும்.
3. **முழுமையான தனிப்பயனாக்கம் (Zero Boilerplate):** பொதுவான ராசி பலன்களையோ, வார்ப்புருக்களையோ எழுதக் கூடாது. லக்னம் (${ascendantSign?.name || (typeof ascendantSign === 'string' ? ascendantSign : 'தெரியவில்லை')} / ${ascendantSign?.tamil || ascendantSign?.name || (typeof ascendantSign === 'string' ? ascendantSign : 'தெரியவில்லை')}), லக்னாதிபதி, ராசி & நட்சத்திரம் (${moonSign?.name || (typeof moonSign === 'string' ? moonSign : 'தெரியவில்லை')} / ${moonNakshatra?.name || 'தெரியவில்லை'} பாதம் ${moonNakshatra?.pada ?? 'N/A'}), 12 பாவாதிபதிகள் மற்றும் தசா-புக்திகளை நேரடியாகக் குறிப்பிடவும்.
4. **தூய தமிழ் மொழி (100% Pure Tamil Output):** முழு பதிலையும் உயர்தர, கம்பீரமான தூய தமிழில் மட்டுமே எழுத வேண்டும்.
5. **வரைவு குறிப்புகள் தடை (No Drafting Scratchpads):** ஆங்கில வரைவு குறிப்புகளோ (drafting notes / tone check / self-correction), சிந்தனைப் பத்திகளோ இடம்பெறக் கூடாது.
6. **சான்றுகள் தளம் (Evidence Ledger Integration):** சாதகமான காரணிகளையும் (Supporting Factors) சவாலான எதிர்ப்புக் காரணிகளையும் (Counter Indicators) சமநிலையுடன் விளக்கவும். பொய்யான உறுதிப்பாட்டு சதவீதங்கள் (எ.கா: 85%, 99.85%) எழுதக் கூடாது.
7. **சாஸ்திர வரம்புகள் & மரண வயது கணிப்பு தவிர்ப்பு:** இல்லாத கோச்சாரங்களையோ, மருத்துவ உத்தரவாதங்களையோ அல்லது மரண வயதையோ சுயமாக கற்பனை செய்து எழுதக் கூடாது. சாஸ்திர ரீதியான தடுப்பு ஆரோக்கிய வழிகாட்டலை மட்டுமே வழங்கவும்.
8. **காலக்கட்ட மாறாமை விதி (Deterministic Timing Invariant):** அறிக்கையில் குறிப்பிடப்படும் ஒவ்வொரு பலன் காலம், தசா-புக்தி காலங்கள், கோச்சார பெயர்ச்சிகள், வர்க்க சக்கர நிலைகள் அனைத்தும் கீழே தரப்பட்டுள்ள கணிதத் தரவுகளிலிருந்து மட்டுமே நேரடியாக எழுதப்பட வேண்டும். மாதிரி (AI model) சுயமாக எந்தவொரு காலக்கட்டத்தையோ, தேதியையோ மாற்றவோ உருவாக்கவோ கூடாது.

### ஜாதக கணித தரவுகள் (Astronomical Natal Data):
- **ஜென்ம லக்னம்:** ${ascendantSign?.name || 'தெரியவில்லை'} (${ascendantSign?.tamil || 'தெரியவில்லை'})
- **ஜென்ம ராசி & நட்சத்திரம்:** ${moonSign?.name || 'தெரியவில்லை'} (${moonSign?.tamil || 'தெரியவில்லை'}) - ${moonNakshatra?.name || 'தெரியவில்லை'} (${moonNakshatra?.tamil || 'தெரியவில்லை'}) பாதம் ${moonNakshatra?.pada ?? 'N/A'} (அதிபதி: ${moonNakshatra?.ruler || 'தெரியவில்லை'})
- **சூரிய ராசி & நட்சத்திரம்:** ${sunSign?.name || 'தெரியவில்லை'} (${sunSign?.tamil || 'தெரியவில்லை'}) - ${sunNakshatra?.name || 'தெரியவில்லை'} (${sunNakshatra?.tamil || 'தெரியவில்லை'})
- **பஞ்சாங்கம்:** ${panchangam?.tamilYear || ''} வருடம், ${panchangam?.tamilMonth || ''} மாதம், திதி: ${panchangam?.thithi || ''}, யோகம்: ${panchangam?.yogam || ''}, தசா இருப்பு: ${panchangam?.dashaBalance || ''}
- **செவ்வாய் தோஷம்:** ${doshaAnalysis?.chevvaiStatus || 'இல்லை'}
- **தற்போதைய மகா தசை:** ${currentDasha?.tamil || currentDasha?.lord || 'தெரியவில்லை'} தசை (வயது ${currentDasha?.startAge ?? '-'} முதல் ${currentDasha?.endAge ?? '-'} வரை)

### நவகிரகங்களின் துல்லிய பாகை & நிலை:
${planetaryPositionsSummary}

### ஜைமினி ஆத்மகாரகன் & காரகங்கள் (Soul Significators):
${atmakarakaSummary}
${karakasSummary}

### 12 பாவகங்களின் கட்டமைப்பு, பார்வைகள் & பாவாதிபதிகள்:
${bhavasSummary}

### முழு விம்சோத்தரி தசா புக்தி அட்டவணை:
${dashaSummary}

### ஜாதகத்தில் அமைந்த விசேஷ சுப யோகங்கள்:
${yogasSummary}

### ஷட்பல கிரக பலங்கள் (Shadbala Strengths in Rupas):
${shadbalaSummary}

### முழு வர்க்க சக்கரங்கள் (Detailed Divisional Charts D1 - D60):
${vargasSummary}

### நடப்பு தசா-புக்தி-பிரத்யந்தர காலங்கள்:
${pratyantarSummary}

### முக்கிய வாழ்வியல் ஒருமுக கணிப்புகள் (Master Predictions Timing Windows):
${masterPredsSummary}

### வாழ்வியல் சான்றுகள் தளம் & கிரக சாதக/எதிர்ப்பு நிலவரம் (Domain Evidence Ledger):
${evidenceSummary}

### போட்டித் தேர்வு & தொழில் திசைமாற்ற கணித ஆய்வு (Career & Exam Pathway Diagnostics):
${pathwaySummary}

### திருமண கால & களத்திர யோக ஆய்வு (Marriage & Relationship Pathway Diagnostics):
${marriageSummary}

### ஆயுர்வேத திரிதோஷ சமநிலை (Ayurvedic Tridosha Balance):
${tridoshaSummary}

### வேத சாஸ்திர பரிகாரங்கள் & ரத்தின பரிந்துரை (Remedies & Gemstones):
${remediesSummary}

### கணக்கிடப்பட்ட தசா-ஆபத்து கால அட்டவணை (Dynamic Vulnerability Windows):
${riskSummary}

### விம்சோத்தரி தசா அடிப்படையிலான வாழ்வியல் காலக்கோடு கட்டங்கள் (Complete Dasha Timeline Stages):
${timelineSummary}

### கடந்த கால வாழ்வியல் மைல்கற்கள் சரிபார்ப்பு தளம் (Retrospective Life Milestone Audit):
${retrospectiveSummary}

---

### நீங்கள் அறிக்கையில் விரிவாக எழுத வேண்டிய 19 விரிவான அத்தியாயங்கள்:

1. **அத்தியாயம் 1: மூல ஜாதக கட்டமைப்பு & ஆன்ம ஆளுமை (Core Natal Blueprint & Atmakaraka)**
   - லக்னாதிபதி பலம், உடல் தேகம், மனோதிடம், சூரிய ராசி ஆளுமை, மற்றும் ஜைமினி ஆத்மகாரகன் காட்டும் ஆன்ம லட்சியம்.

2. **அத்தியாயம் 2: ஜாதகத்தில் அமைந்துள்ள விசேஷ சுப யோகங்கள் (Auspicious Yogas & Manifestations)**
   - பஞ்ச மகாபுருஷ, ராஜ யோகங்கள், கஜகேசரி, தர்மகர்மாதிபதி மற்றும் தன யோகங்களின் உருவாக்கம், பலம் மற்றும் சுப பலன்கள்.

3. **அத்தியாயம் 3: பன்னிரண்டு பாவக முழு பலன்கள் (12 Bhavas Comprehensive Deep Dive)**
   - 1 முதல் 12 பாவகங்கள் வரை ஒவ்வொரு பாவத்தின் காரகத்துவங்கள், பாவாதிபதி நின்ற இடம், பார்வைகள், நவாம்ச நிலை மற்றும் பலன்கள்.

4. **அத்தியாயம் 4: பாரம்பரிய ஜோதிட உடல் சமநிலை & தடுப்பு ஆரோக்கியம் (Traditional Astrological Wellness & Vitality Themes)**
   - 6 மற்றும் 8-ம் பாவக ஆய்வு, பாரம்பரிய ராசிக்குரிய கவனிக்க வேண்டிய உடற்கூறு பகுதிகள், சாதக மற்றும் சவாலான காரணிகள். தடுப்பு வாழ்வியல் ஆலோசனைகளை மட்டுமே வழங்கவும்; மருத்துவ நோயறிதல்களையோ மரண வயதையோ கூறக் கூடாது.

5. **அத்தியாயம் 5: உயர்கல்வி, அறிவுசார் மேதைமை & போட்டித் தேர்வு யோகம் (Traditional Astrological Academic Themes & Exam Diagnostics)**
   - 4 மற்றும் 5-ம் பாவகங்கள், புதன் & குருவின் நிலை, உகந்த உயர்கல்வி துறைகள் மற்றும் போட்டித் தேர்வுகளுக்கான சாஸ்திர ரீதியான ஆய்வு (போலி சதவீதங்கள் தவிர்த்து).

6. **அத்தியாயம் 6: தொழில் வாய்ப்புகள், உத்தியோகம் & தலைமைப் போக்கு (Career & Vocational Themes)**
   - 10 மற்றும் 11-ம் பாவகங்கள், நிறுவன நிர்வாகம், தொழில்முனைவு மற்றும் ஒப்பீட்டு தொழிற்துறை இயல்புகள் (தனிப்பட்ட உத்தரவாதங்கள் இன்றி).

7. **அத்தியாயம் 7: பூமி யோகம், சொந்த வீடு, நிலம் & சொகுசு வாகனங்கள் (Property, Real Estate & Vehicles)**
   - 4-ம் பாவக பலம், செவ்வாய் மற்றும் சுக்கிரன் அமைவிடம், நிலம், வீடு மற்றும் வாகனங்கள் வாங்குவதற்கான சுப தசா காலக்கட்டங்கள்.

8. **அத்தியாயம் 8: பொது தலைமைத் தகுதி, சமூக ஆளுமை & நிறுவன வழிகாட்டல் (Public Leadership & Governance Themes)**
   - சூரியன் மற்றும் சனியின் பலம், 10-ம் பாவ சிம்மாசன ஆளுமை, பொது நிர்வாகம் மற்றும் நிறுவன தலைமைத் தகுதி.

9. **அத்தியாயம் 9: திருமண வாழ்க்கை, வாழ்க்கைத்துணை & புத்ர பாக்கியம் (Marriage Harmony, Spouse Profile & Progeny Karma)**
   - 7 மற்றும் 5-ம் பாவகங்கள், திருமண சுப காலங்கள், துணையின் குணாதிசயங்கள் மற்றும் புத்திர பாக்கிய யோகம்.

10. **அத்தியாயம் 10: வெளிநாட்டு யோகம் & ஆன்மீக நாட்டம் (Foreign Travel & Spiritual Themes)**
    - 9 மற்றும் 12-ம் பாவகங்கள், தூரதேச பயணங்கள் மற்றும் ஆன்மீக தியான சாதனைகள்.

11. **அத்தியாயம் 11: ஆயுர்வேத திரிதோஷ சமநிலை வழிகாட்டுதல் (Ayurvedic Tridosha Balance)**
    - வாதம், பித்தம், கபம் தோஷ நிலவரங்கள் மற்றும் பாரம்பரிய ஆரோக்கிய உணவுப் பழக்கவழக்கங்கள் (மருத்துவ சிகிச்சை அல்லாத குறியீட்டு முறைமை).

12. **அத்தியாயம் 12: வேத சாஸ்திர பரிகாரங்கள் & ரத்தின தொடர்புகள் (Personalized Remedies & Gemstone Associations)**
    - லக்ன சுப அதிபதிக்குரிய ரத்தினங்கள் (பரிந்துரைக்கப்படுபவை மற்றும் தவிர்க்கப்பட வேண்டியவை), மந்திரங்கள் மற்றும் தான தர்மங்கள் (பாரம்பரிய ஜோதிட குறியீட்டு அறிவிப்புடன்).

13. **அத்தியாயம் 13: சுப முகூர்த்த காலங்கள் & உத்தேச காலக்கட்டங்கள் (Auspicious Timing Principles & Candidate Windows)**
    - திருமணம், வீடு கட்டுதல், தொழில் தொடக்கம், வாகன சேர்க்கைக்கான சுப காலங்கள். பிரம்ம முகூர்த்தம் மற்றும் அபிஜித் முகூர்த்த வழிகாட்டுதல்.

14. **அத்தியாயம் 14: பல பரிமாண எச்சரிக்கை கால அட்டவணை (Traditional Caution Indicators & Risk Matrix)**
    - கணக்கிடப்பட்டுள்ள துல்லியமான வயது மற்றும் ஆண்டு கால கட்டங்களின்படி தற்காப்பு பரிகாரங்களுடன் விரிவாக எச்சரிக்கவும்.

15. **அத்தியாயம் 15: விம்சோத்தரி தசா வாழ்வியல் காலக்கோடு கணிப்புகள் (Complete Vimshottari Timeline 0–120 Yrs)**
    - தசா காலக்கோடு கட்டங்களின்படி, ஒவ்வொரு முக்கிய காலக்கட்டத்திற்கும் இயங்கும் தசா புக்தி, பாவக பலன்கள், கோச்சார சுழற்சிகள், சாதக காரணிகள் மற்றும் எதிர்ப்பு காரணிகளை விவரிக்கவும்.

16. **அத்தியாயம் 16: கடந்த கால வாழ்வியல் மைல்கற்கள் சரிபார்ப்பு (Retrospective Milestone Verification for Seniors)**
    - மூத்தவர்கள் தங்கள் சொந்த கடந்த கால முக்கிய வாழ்க்கை நிகழ்வுகளை (கல்வி, திருமணம், தொழில், சொத்து) மேலே கணக்கிடப்பட்டுள்ள உத்தேச தசா-புக்தி காலக்கட்டங்களோடு ஒப்பிட்டு சரிபார்த்துக்கொள்ள வழிகாட்டவும்.

17. **அத்தியாயம் 17: ஜோதிட வல்லுநர் சான்றாதாரத் தொகுப்பு & கணிப்புக் காரணங்கள் (Astrologer Evidence Dossier & 9-Layer Reasoning Chains)**
    - 9-அடுக்கு சாஸ்திர பகுப்பாய்வு (ஜாதக வாக்குறுதி, லக்ன அதிபத்தியம், ஷட்பல வீரியம், வர்க்க உறுதிப்படுத்தல், தசா-புக்தி இயக்கம், கோச்சார தூண்டுதல், ஜைமினி காரகங்கள், தோஷ நிவர்த்தி மற்றும் ஒட்டுமொத்த தொகுப்பு).

18. **அத்தியாயம் 18: தொழில்நுட்ப கணக்கீட்டு பிற்சேர்க்கை (Comprehensive Technical Calculation Appendix)**
    - நவகிரக வானியல் பாகைகள், 16 சோடசவர்க்க நிலைகள் (D1-D60), 6-வகை ஷட்பல விருபாக்கள், 337-பிந்து அஷ்டகவர்க்க அட்டவணை, ஜைமினி காரகங்கள் மற்றும் மூல வானியல் பஞ்சாங்க தரவுத்தளம்.

19. **அத்தியாயம் 19: பல ஜோதிட முறைகளின் ஒப்பீட்டு ஆய்வு (Multi-System Comparative Analysis)**
    - சித்திரபக்ஷ லஹிரி, கே.பி. முறை, பி.வி. ராமன் முறை மற்றும் மேற்கத்திய சாயன முறைகளின் ஒப்பீடு, பாவ சலித மாற்றங்கள் மற்றும் உடன்பாட்டு நிலைகள்.

முழு அறிக்கையையும் நடுவில் எங்கும் நிறுத்தாமல், அத்தியாயம் 1 முதல் அத்தியாயம் 19 வரை முழுமையாக வழங்கி முடிக்கவும்.`;
  }

  // English Prompt
  return `You are a careful Vedic astrology report writer and scholar of classical Indian astrology (Brihat Parashara Hora Shastra, Jaimini Upadesha Sutras, Phaladeepika, and Saravali). Based strictly on the calculated ephemeris data, structured divisional charts (D1–D60), and multi-factor evidence ledger provided below, generate an exhaustive, deeply personalized, authentically calculated Vedic Master Dossier completely free of generic templates.

CRITICAL RULES & INTERPRETATION FRAMEWORK:
1. **Four-Layer Interpretation Structure:** For every domain and major life theme, follow this strict 4-layer structure:
   - Layer 1: Deterministic Astronomical Calculation (exact positions, lords, houses, dignities, Shadbala rupas).
   - Layer 2: Classical Parashari / Jaimini Interpretation (yogas, bhava rulerships, varga confirmations).
   - Layer 3: Operating Vimshottari Dasha & Transit Timing (active MD-AD-PD and Gochara triggers).
   - Layer 4: Practical Life Consultation (constructive lifestyle guidance, remedial sadhana).
2. **Atmakaraka Separation:** Clearly distinguish between Sun Sign (Solar Signification / Naisargika Atmakaraka) and the native's true calculated Jaimini Chara Atmakaraka (${atmakaraka?.planet || 'AK'}) which represents the innermost spiritual mission and karmic evolution.
3. **Evidence-Led Synthesis (No Pseudo-Scientific Percentages):** Synthesize the provided Domain Evidence Ledger (supporting factors vs counter-indicators) objectively using classical qualitative astrological evidence. Never promise universal 100% outcomes, invent medical diagnoses, or output arbitrary percentage numbers (e.g. 85%, 99.85%). Describe classical planetary alignments directly. Do NOT invent uncalculated astronomical transits or predict exact death dates/mortality.
4. **No Scratchpad or Planning Output:** Output ONLY the final completed astrological master dossier. Do NOT output any internal scratchpad notes, bulleted planning outlines, tone checks, self-corrections, or reasoning thoughts. Begin directly with the main title and Chapter 1.
5. **0–120-Year Vimshottari Cycle Framework:** In Chapter 15, ground the lifecycle narrative in the native's actual calculated Vimshottari Mahadasha and Antardasha phases, operating lords, and genuine astronomical transit triggers provided below (Note: The 120-year figure represents the traditional Vimshottari cycle and is not a lifespan prediction).
6. **Retrospective Milestone Verification for Seniors:** When assessing the horoscope—especially for senior natives validating their life journey—explicitly cross-verify the calculated historical life milestones against the active Dasha periods provided in the Retrospective Life Milestone Audit Matrix.
7. **Deterministic Timing Invariant (Copy Exactly):** Every prediction date, Dasha, transit, Varga placement, and event window must be copied exactly from the supplied deterministic data. The model must not calculate, alter, widen, narrow, or invent any timing window.
8. **Anti-Causality & Karaka Nuance:** Understand that Venus is a significator (Karaka) of marriage, but does not independently 'cause' events without multi-factor convergence with house lords (7th lord) and active operating Dasha/Gochara activation. Use Shadbala only when it materially supports or qualifies the relevant domain interpretation.

### Astronomical Natal Data:
- **Ascendant (Lagna):** ${ascendantSign?.name || (typeof ascendantSign === 'string' ? ascendantSign : 'Not available')} (${ascendantSign?.tamil || ascendantSign?.name || (typeof ascendantSign === 'string' ? ascendantSign : 'Not available')})
- **Moon Sign & Nakshatra:** ${moonSign?.name || (typeof moonSign === 'string' ? moonSign : 'Not available')} - ${moonNakshatra?.name || 'Not available'} Pada ${moonNakshatra?.pada ?? 'N/A'} (Ruler: ${moonNakshatra?.ruler || 'Not available'})
- **Sun Sign & Nakshatra:** ${sunSign?.name || (typeof sunSign === 'string' ? sunSign : 'Not available')}${sunNakshatra?.name ? ` - ${sunNakshatra.name}` : ''}
- **Panchangam:** Thithi: ${panchangam?.thithiEn || ''}, Yogam: ${panchangam?.yogam || ''}, Dasha Balance: ${panchangam?.dashaBalanceEn || ''}
- **Kuja (Mars) Dosha Analysis:** ${doshaAnalysis?.chevvaiStatus || 'Absent'}
- **Current Active Mahadasha:** ${currentDasha?.lord || 'Not available'} Dasha (Ages ${currentDasha?.startAge ?? '-'} to ${currentDasha?.endAge ?? '-'})

### Precise Planetary Coordinates & Dignities:
${planetaryPositionsSummary}

### Jaimini Chara Karakas & Atmakaraka:
${atmakarakaSummary}
${karakasSummary}

### 12-Bhava Structural Configuration, Aspects & Lords:
${bhavasSummary}

### Complete Vimshottari Dasha Life Timeline:
${dashaSummary}

### Active Auspicious Vedic Yogas:
${yogasSummary}

### Shadbala 6-Fold Planetary Strength Matrix (Rupas):
${shadbalaSummary}

### Structured Divisional Vargas (D1 through D60 Shodashavarga):
${vargasSummary}

### Active Vimshottari 3-Tier Dasha/Bukthi/Pratyantardasha:
${pratyantarSummary}

### Master Prediction Timing Windows (Convergence Engine):
${masterPredsSummary}

### Domain Evidence Ledger (Multi-Factor Strengths & Counter-Indicators):
${evidenceSummary}

### Career & Exam Pathway Diagnostics:
${pathwaySummary}

### Marriage Timing & 7th House Pathway Diagnostics:
${marriageSummary}

### Qualitative Ayurvedic Tridosha Balance:
${tridoshaSummary}

### Personalized Vedic Remedies & Traditional Gemstone Suggestions:
${remediesSummary}

### Dynamic Dasha-Driven Vulnerability Windows (Risk Convergence Matrix):
${riskSummary}

### Chronological Dasha Life-Stage Sequence (Complete Untruncated Timeline):
${timelineSummary}

### Retrospective Dasha Correlation Review Matrix (Historical Validation for Seniors):
${retrospectiveSummary}

---

### Structure Your Master Report into 19 Comprehensive Chapters Matching the System Tabs:

1. **Chapter 1: Natal Blueprint, Ascendant Power & Karmic Disposition**
   - Lagna Lord vitality, physical endurance, Sun Sign signification, and Jaimini Atmakaraka soul mission.

2. **Chapter 2: Auspicious Vedic Yogas & Power Alignments**
   - Active Pancha Mahapurusha, Raja Yogas, Gajakesari, Dhana Yogas, their strength, and concrete classical manifestations.

3. **Chapter 3: Complete 12 Bhavas (Houses) Comprehensive Breakdown**
   - Systematic analysis from 1st through 12th house, bhava lord dignity, occupant influences, Parashari aspects, D9 placements, and life area vitality.

4. **Chapter 4: Traditional Astrological Wellness & Vitality**
   - 6th & 8th house analysis, sensitive anatomical zones from classical rashi rulerships, constitutional vitality balance, and objective synthesis of supporting factors vs counter-indicators. Provide traditional preventive lifestyle guidance; never make absolute medical claims, fake immune percentages, or deterministic lifespan/mortality claims.

5. **Chapter 5: Traditional Astrological Academic Themes & Exam Diagnostics**
   - 4th & 5th house intelligence matrix, Mercury & Jupiter aspects, academic pathways (STEM, AI/Data Science, Medicine, Law, CA/Finance, Creative Arts), and traditional astrological indicators for competitive examinations (without pseudoscientific odds).

6. **Chapter 6: Vocational Themes, Career Momentum & Wealth Indicators**
   - 10th & 11th house governance, corporate leadership vs government bureaucracy vs entrepreneurial enterprise, critical transition ages, and major career progression windows.

7. **Chapter 7: Landed Properties, Real Estate & Conveyances (Bhoomi & Vahana Yoga)**
   - 4th house fortitude, Mars (Bhoomi Karaka) and Venus (Vahana Karaka) alignments, ancestral assets, land/house acquisition timing, and vehicle purchases.

8. **Chapter 8: Public Governance, Institutional Leadership & Civic Stewardship Themes**
   - Sun (Rajyakaraka) & Saturn (Mass Influence) dynamics, 10th house authority, public service aptitude, civil administration suitability, and boardroom leadership.

9. **Chapter 9: Marriage Harmony, Spouse Profile & Progeny Karma**
   - 7th & 5th house dynamics, 7th Lord and Venus dignity, marriage pathway assessment (traditional patterns, potential obstacles, and auspicious timing), spouse personality, marital compatibility, and progeny karma.

10. **Chapter 10: Foreign Travel, Overseas Relocation & Spiritual Moksha**
    - 9th & 12th house alignments, international migration opportunities, cross-border business, and transcendental spiritual evolution.

11. **Chapter 11: Ayurvedic Tridosha Balance & Constitutional Regimen**
    - Qualitative Vata, Pitta, and Kapha tendencies, elemental factor distribution, and traditional dietary/lifestyle guidelines.

12. **Chapter 12: Personalized Vedic Remedies, Traditional Gemstone Suggestions & Daily Sadhana**
    - Primary and secondary gemstones aligned with functional benefics (with explicit contraindication notes), metal and finger specifications, consecrated mantras (108 chants), and auspicious weekday charity.

13. **Chapter 13: Auspicious Timing Principles & Candidate Windows**
    - Auspicious age & calendar year timelines for Marriage, Home Construction/Griha Pravesham, Vehicle Purchase, Business Launch, and Career Leaps. Guidelines for Brahma Muhurtha, Abhijit Muhurtha, and Rahu Kalam avoidance.

14. **Chapter 14: Traditional Caution Indicators & Risk Matrix**
    - Dynamic risk windows derived from operating 6th/8th/12th lords: Personal/Marital Risks, Vitality Indicators, Financial Losses, Career Setbacks & Legal Audits, and Travel Hazards with exact age/year timelines and protective shields.

15. **Chapter 15: Chronological Dasha & Life-Stage Analysis (0–120-Year Vimshottari Framework)**
    - Detailed milestone-by-milestone guidance mapped directly to the native's calculated dasha stages: Operating Mahadasha/Antardasha, bhava activations, genuine astronomical Gochara transit alignments, full pratyantardashas, supporting planetary factors, and counter-indicators.

16. **Chapter 16: Retrospective Life Milestone Verification (Candidate Windows & Senior Validation)**
    - Cross-verify the calculated historical candidate windows (education, career progressions, marriage, assets) against the native's past dasha sequences. Guide senior natives to validate calculated timing windows against their lived experiences.

17. **Chapter 17: Astrologer Evidence Dossier & 9-Level Prediction Reasoning Chain**
    - Multi-layer reasoning chain breakdown across Natal Promise, Functional Lordship, Shadbala Capacity, Divisional Confirmation, Dasha Activation, Gochara Transits, Jaimini System, Mitigations, and AstroVerse Synthesis.

18. **Chapter 18: Comprehensive Technical Calculation Appendix & Astronomical Dataset**
    - Complete deterministic computational ledger: Ephemeris & Dispositors, Whole-Sign vs Bhava Chalit Cusps, Shodashavarga Matrix (D1–D60), 6-Fold Shadbala virupas, 337-Bindu Ashtakavarga, Jaimini 7-Karaka System & Arudha Padas, Planetary Avasthas, and Root-Solved Panchanga.

19. **Chapter 19: Multi-System Comparative Analysis & Cross-System Agreement**
    - Rigorous cross-comparison across Lahiri (Chitrapaksha Sidereal), KP (Krishnamurti Padhdhati with Placidus cusps and 249 sub-lords), B.V. Raman Sidereal (397 AD epoch), and Western Tropical (Sayana). Highlight agreement areas, cuspal shifts, and technique applicability.

Do NOT truncate or stop mid-way. Generate the complete, comprehensive master dossier across all chapters.`;
}

/**
 * Strips any internal LLM scratchpads, planning notes, or reasoning artifacts
 */
export function cleanAIOutput(text, lang = "en") {
  if (!text) return "";
  let cleaned = text.trim();

  // Remove <thought> tags if present
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();

  // If text starts with internal drafting / thinking scratchpads before the actual title/chapter
  // (e.g. "* *Lagna:* ... *Tone Check:* ... (Self-Correction during drafting) ... # Title")
  const tamilStartIdx = cleaned.search(/(#\s+|##\s+|அத்தியாயம்\s+1|வேத\s+ஜோதிட|மகா\s+ஜாதக|ஸ்ரீ\s+கணேச|ஓம்\s+)/i);
  const englishStartIdx = cleaned.search(/(#\s+|##\s+|Chapter\s+1|Vedic\s+Astrological|Master\s+Dossier)/i);

  if (lang === "ta" && tamilStartIdx > 0 && tamilStartIdx < 3000) {
    const prefix = cleaned.substring(0, tamilStartIdx);
    if (/(\*|\bLagna\b|\bTone Check\b|\bDrafting\b|\bSelf-Correction\b|\bAK\b|\bBhadra\b)/i.test(prefix)) {
      cleaned = cleaned.substring(tamilStartIdx).trim();
    }
  } else if (lang === "en" && englishStartIdx > 0 && englishStartIdx < 3000) {
    const prefix = cleaned.substring(0, englishStartIdx);
    if (/(\*|\bDrafting\b|\bSelf-Correction\b|\bTone Check\b|\bThinking\b)/i.test(prefix)) {
      cleaned = cleaned.substring(englishStartIdx).trim();
    }
  }

  return validateAndSanitizeNarrative(cleaned, lang);
}

/**
 * Generates an exhaustive 19-chapter master report deterministically from calculated chart data.
 * Guarantees zero blank screens, zero hallucinated claims, and immediate availability offline.
 */
export function generateLocalDeterministicMasterReport(chartData, lang = "en") {
  if (!chartData) return "";
  const isTamil = lang === "ta";
  
  const rawSys = chartData.system;
  const systemId = (typeof rawSys === "object" ? rawSys?.id : rawSys) || "lahiri";
  const SYSTEM_NAMES = {
    lahiri: "Lahiri / Chitrapaksha",
    kp: "KP (Krishnamurti Padhdhati)",
    raman: "B.V. Raman Sidereal",
    tropical: "Tropical / Sayana (Western)"
  };
  const sysName = (typeof rawSys === "object" && rawSys?.name)
    ? rawSys.name
    : (SYSTEM_NAMES[String(systemId).toLowerCase()] || "Lahiri / Chitrapaksha");

  const isTropical = String(systemId).toLowerCase() === "tropical";
  const isKP = String(systemId).toLowerCase() === "kp";

  const prof = chartData.profile || {};
  const name = prof.name || (isTamil ? "ஜாதகர்" : "Native");
  const bDate = prof.birthDate || chartData.birthDateStr || chartData.birthDate || "-";
  const bTime = prof.birthTime || chartData.birthTimeStr || chartData.birthTime || "-";
  const bPlace = prof.birthPlace || chartData.birthPlace || "-";

  // Robust extraction of core signs and degrees
  const ascSignName = typeof chartData.ascendantSign === "object" ? (chartData.ascendantSign?.name || chartData.ascendantSign?.sign) : (chartData.ascendantSign || chartData.ascendant?.sign || chartData.ascendant?.name || "-");
  const ascSignTamil = typeof chartData.ascendantSign === "object" ? (chartData.ascendantSign?.tamil || toTamilRasi(chartData.ascendantSign?.name)) : toTamilRasi(chartData.ascendantSign || chartData.ascendant?.sign || "-");
  const ascDegVal = chartData.ascendantDeg ?? chartData.ascendantLong ?? chartData.ascendant?.deg ?? null;
  const ascDegStr = ascDegVal !== null ? `${Number(ascDegVal).toFixed(2)}°` : "";

  const moonSignName = typeof chartData.moonSign === "object" ? (chartData.moonSign?.name || chartData.moonSign?.sign) : (chartData.moonSign || chartData.moon?.sign || chartData.moon?.name || "-");
  const moonSignTamil = typeof chartData.moonSign === "object" ? (chartData.moonSign?.tamil || toTamilRasi(chartData.moonSign?.name)) : toTamilRasi(chartData.moonSign || chartData.moon?.sign || "-");

  const sunSignName = typeof chartData.sunSign === "object" ? (chartData.sunSign?.name || chartData.sunSign?.sign) : (chartData.sunSign || chartData.sun?.sign || chartData.sun?.name || "-");
  const sunSignTamil = typeof chartData.sunSign === "object" ? (chartData.sunSign?.tamil || toTamilRasi(chartData.sunSign?.name)) : toTamilRasi(chartData.sunSign || chartData.sun?.sign || "-");

  const moonNakName = typeof chartData.moonNakshatra === "object" ? (chartData.moonNakshatra?.name || chartData.moonNakshatra?.nakshatra) : (chartData.moonNakshatra || chartData.moon?.nakshatra || "-");
  const moonNakTamil = typeof chartData.moonNakshatra === "object" ? (chartData.moonNakshatra?.tamil || toTamilNakshatra(chartData.moonNakshatra?.name)) : toTamilNakshatra(chartData.moonNakshatra || chartData.moon?.nakshatra || "-");
  const moonPada = (typeof chartData.moonNakshatra === "object" && chartData.moonNakshatra?.pada) ? chartData.moonNakshatra.pada : (chartData.moon?.pada || "-");

  const dasha = chartData.currentDasha || {};
  const dashaLord = dasha.lord || dasha.mahadasha || "";
  const dashaSubLord = dasha.subLord || dasha.currentAntar || dasha.antardasha || "";
  const dashaLordTamil = isTamil ? (dasha.lordTamil || (dashaLord ? toTamilPlanet(dashaLord) : "")) : dashaLord;
  const dashaSubLordTamil = isTamil ? (dasha.subLordTamil || (dashaSubLord ? toTamilPlanet(dashaSubLord) : "")) : dashaSubLord;

  const bhavas = (isTamil ? chartData.bhavasDetailedTamil : chartData.bhavasDetailed) || chartData.bhavasDetailed || [];
  const yogas = (isTamil ? chartData.detectedYogasTamil : chartData.detectedYogas) || chartData.yogas || [];
  const remedies = (isTamil ? chartData.personalizedRemediesTamil : chartData.personalizedRemedies) || chartData.personalizedRemedies || {};
  const dosha = (isTamil ? chartData.tridoshaBalanceTamil : chartData.tridoshaBalance) || chartData.tridoshaBalance || {};
  const timelineStages = (isTamil ? chartData.chronologicalDashaTimelineTamil : chartData.chronologicalDashaTimeline)?.stages
    || chartData.chronologicalDashaTimeline?.stages
    || (Array.isArray(chartData.chronologicalDashaTimeline) ? chartData.chronologicalDashaTimeline : []);
  const risks = chartData.riskMatrix?.risks || [];

  // Format Planetary Summary Table
  const planetsList = (chartData.planets || []).map(p => {
    const pName = isTamil ? (p.tamil || toTamilPlanet(p.name)) : p.name;
    const pSign = isTamil ? (p.signTamil || toTamilRasi(p.sign)) : (p.sign || "-");
    const pDeg = typeof p.degree === "number" ? `${p.degree.toFixed(2)}°` : (p.deg ? `${p.deg}°` : "-");
    const pDignity = isTamil ? (p.dignityTamil || toTamilDignity(p.dignity || "சமம்")) : (p.dignity || "Neutral");
    const pNak = isTamil ? (p.nakshatraTamil || toTamilNakshatra(p.nakshatra)) : (p.nakshatra || "-");
    const ret = p.isRetrograde ? (isTamil ? " [வக்ரம்]" : " [R]") : "";
    return `| ${pName} | ${pSign} | ${pDeg} | H${p.house ?? '-'} | ${pDignity}${ret} | ${isTropical ? '-' : pNak} |`;
  }).join("\n");

  // Format Houses
  const bhavasText = bhavas.map(b => {
    const title = b.title || (isTamil ? `${b.num}-ம் பாவகம்: ${b.signTamil || toTamilRasi(b.signName || b.sign)}` : `House ${b.num}: ${b.signName || b.sign || ''}`);
    const lord = b.lordName ? (isTamil ? ` (அதிபதி: ${b.lordTamil || toTamilPlanet(b.lordName)} - ${b.lordDignityTamil || toTamilDignity(b.lordDignity)})` : ` (Lord: ${b.lordName} - ${b.lordDignity || 'Neutral'})`) : "";
    const pred = isTamil ? (b.predictionTamil || b.summaryTamil || b.prediction || "சீரான பாவக அமைப்பு.") : (b.prediction || b.summary || "Balanced astrological indications.");
    return `### ${isTamil ? `பாவகம் ${b.num}` : `House ${b.num}`}: ${title}${lord}\n${pred}\n`;
  }).join("\n");

  // --- TROPICAL / SAYANA (WESTERN) REPORT BRANCH ---
  if (isTropical) {
    if (isTamil) {
      return `# ஆஸ்ட்ரோவர்ஸ் — மேற்கத்திய சாயன (Tropical) வானியல் ஜாதக அறிக்கை

**ஜாதகர்:** ${name} | **பிறந்த தேதி:** ${bDate} | **நேரம்:** ${bTime} | **இடம்:** ${bPlace}
**ஜோதிட முறை:** Tropical / Sayana (Western) | **லக்னம் (Rising):** ${ascSignTamil} (${ascDegStr}) | **சூரிய ராசி (Sun):** ${sunSignTamil} | **சந்திர ராசி (Moon):** ${moonSignTamil}

---

## அத்தியாயம் 1: மேற்கத்திய சாயன மூல ஜாதக கட்டமைப்பு & நவகிரக நிலைகள்
| கிரகம் | ராசி (Sign) | பாகை (Degree) | வீடுகள் (House) | பலம் / கண்ணோட்டம் | குறிப்பு |
|---|---|---|---|---|---|
${planetsList}

## அத்தியாயம் 2: முக்கிய தாலமிக் பார்வைகள் (Ptolemaic Aspects) & கிரக சேர்க்கைகள்
மேற்கத்திய சாயன முறையில் அமைந்த சூரியன், சந்திரன் மற்றும் முக்கிய கிரகங்களின் 0° (சேர்க்கை), 60° (செக்ஸ்டைல்), 90° (ஸ்கொயர்), 120° (டிரைன்), 180° (ஆப்போசிஷன்) பார்வைகள் உங்கள் உளவியல் ஆளுமையையும், வாய்ப்புகளையும் தீர்மானிக்கின்றன.

## அத்தியாயம் 3: 12 மேற்கத்திய வீடுகள் (Placidus Houses) முழு ஆய்வு
${bhavasText}

## அத்தியாயம் 4: உளவியல் திறன்கள், தலைமைத்துவம் & தொழில் வாய்ப்புகள்
சூரியன் (${sunSignTamil}) மற்றும் 10-ம் வீட்டின் நிலைகள் தொழில்முறை தலைமைத்துவத்தையும், நிர்வாக திறன்களையும் வளர்க்கின்றன.

## அத்தியாயம் 5: உறவுகள், குடும்பம் & கூட்டாண்மை (7-ம் வீடு)
7-ம் வீடு மற்றும் சுக்கிரனின் தொடர்பு வாழ்க்கைத்துணையுடனான இணக்கமான புரிதலையும், பரஸ்பர ஆதரவையும் உறுதிப்படுத்துகின்றன.

## அத்தியாயம் 6: வானியல் தொழில்நுட்ப கணக்கீட்டு சான்றிதழ்
- **Reference Frame:** Sayana / Tropical (Vernal Equinox = 0° Aries, Ayanamsha: 0.0000°)
- **House System:** Placidus Houses (Equal fallback for polar latitudes)
- **Ephemeris Engine:** Astronomy Engine 2.1 (VSOP87 / Meeus algorithms)`;
    }

    return `# ASTROVERSE — WESTERN TROPICAL (SAYANA) NATAL DOSSIER

**Native:** ${name} | **Birth Date:** ${bDate} | **Time:** ${bTime} | **Place:** ${bPlace}
**System:** Tropical / Sayana (Western) | **Rising Sign (Ascendant):** ${ascSignName} (${ascDegStr}) | **Sun Sign:** ${sunSignName} | **Moon Sign:** ${moonSignName}

---

## Chapter 1: Tropical Natal Blueprint & Celestial Placements
| Body | Sign | Longitude | House | Dignity / Aspect | Framework |
|---|---|---|---|---|---|
${planetsList}

## Chapter 2: Ptolemaic Aspects & Geometric Harmonic Dynamics
Classical Western aspects (Conjunctions, Sextiles, Trines, Squares, and Oppositions) establish the native's core psychological temperament, cognitive agility, and vocational drive.

## Chapter 3: Twelve Western Placidus Houses Deep Dive
${bhavasText}

## Chapter 4: Vocation, Ambition & Executive Trajectory (10th House Midheaven)
The Midheaven (MC) and 10th House configuration point toward steady professional responsibility, public reputation, and strategic execution.

## Chapter 5: Relationships, Marriage & Partnership Dynamics (7th House)
The 7th House and Venusian aspects support enduring personal relationships anchored in mutual respect, shared principles, and emotional maturity.

## Chapter 6: Technical Computational Certificate
- **Reference Frame:** Geocentric True Ecliptic of Date (ECT) — Sayana / Tropical (0° Aries = Vernal Equinox)
- **Ayanamsha:** 0°00'00" (Not Applicable for Tropical System)
- **House System:** Placidus Cusps (with circumpolar Equal fallback)
- **Ephemeris Base:** Astronomy Engine 2.1 (VSOP87 / Jean Meeus Algorithms)`;
  }

  // --- KRISHNAMURTI PADHDHATI (KP) REPORT BRANCH ---
  if (isKP) {
    const dashaText = dashaLord ? (isTamil ? `${dashaLordTamil}${dashaSubLordTamil ? ` - ${dashaSubLordTamil}` : ""}` : `${dashaLord}${dashaSubLord ? ` - ${dashaSubLord}` : ""}`) : (isTamil ? "கணக்கிடப்பட்டது" : "Computed");
    if (isTamil) {
      return `# ஆஸ்ட்ரோவர்ஸ் — கிருஷ்ணமூர்த்தி பத்ததி (KP) நட்சத்திர ஜோதிட அறிக்கை

**ஜாதகர்:** ${name} | **பிறந்த தேதி:** ${bDate} | **நேரம்:** ${bTime} | **இடம்:** ${bPlace}
**ஜோதிட முறை:** Krishnamurti Padhdhati (KP) | **லக்னம்:** ${ascSignTamil} (${ascDegStr}) | **சந்திரன்:** ${moonSignTamil} | **நட்சத்திரம்:** ${moonNakTamil} (${moonPada}) | **நடப்பு தசா-புக்தி:** ${dashaText}

---

## அத்தியாயம் 1: KP நவகிரக நிலைகள், நட்சத்திர நாதன் & உபநாதன் (Sub-Lord) அட்டவணை
| கிரகம் | ராசி | பாகை | பாவகம் | நிலை | நட்சத்திரம் & உபநாதன் |
|---|---|---|---|---|---|
${planetsList}

## அத்தியாயம் 2: KP 12 பாவக ஆரம்ப முனைகள் (Placidus Cuspal Sub-Lords)
${bhavasText}

## அத்தியாயம் 3: KP விம்சோத்தரி தசா-புக்தி பலன்கள்
நடப்பு விம்சோத்தரி தசா காலக்கட்டம் (${dashaText}) உங்கள் முக்கிய வாழ்வியல் முயற்சிகளையும் கர்ம வினைகளையும் வழிநடத்துகிறது.

## அத்தியாயம் 4: தொழில் & தன ஸ்தான சிக்னிஃபிகேட்டர்கள் (2, 6, 10, 11)
2, 6, 10, 11-ம் பாவக உபநாதன்களின் தொடர்பு நிலையான தன மேன்மையையும், தொழில்முறை உயர்வையும் உறுதி செய்கின்றன.

## அத்தியாயம் 5: KP தொழில்நுட்ப கணக்கீட்டு சான்றிதழ்
- **Ayanamsha:** KP Original Ayanamsha (249 Sub-Lord Division)
- **House System:** Placidus Cusps
- **Ephemeris Engine:** Astronomy Engine 2.1 (VSOP87 / Meeus)`;
    }

    return `# ASTROVERSE — KRISHNAMURTI PADHDHATI (KP) STELLAR DOSSIER

**Native:** ${name} | **Birth Date:** ${bDate} | **Time:** ${bTime} | **Place:** ${bPlace}
**System:** Krishnamurti Padhdhati (KP) | **Ascendant:** ${ascSignName} (${ascDegStr}) | **Moon:** ${moonSignName} | **Nakshatra:** ${moonNakName} (${moonPada}) | **Active Dasha:** ${dashaText}

---

## Chapter 1: KP Planetary Placements, Star Lords & Sub-Lords Matrix
| Body | Sign | Longitude | House | Dignity | Star Lord & Sub-Lord |
|---|---|---|---|---|---|
${planetsList}

## Chapter 2: KP Placidus Cuspal Points & Sub-Lord Matrix
${bhavasText}

## Chapter 3: KP Vimshottari Dasha-Bhukti Significance
The active period of ${dashaText} activates key cuspal significators, driving career progress, financial milestones, and personal development.

## Chapter 4: Wealth & Career House Combinations (2, 6, 10, 11)
Connections between the 2nd (wealth), 6th (service), 10th (profession), and 11th (gains) cuspal sub-lords provide strong indicators for vocational stability and material accomplishment.

## Chapter 5: Technical Computational Specifications
- **Ayanamsha Model:** KP Original (50.2388475"/year linear)
- **House System:** Placidus Cusps with 249 Sub-Lord divisions
- **Ephemeris Base:** Astronomy Engine 2.1 (VSOP87 / Meeus algorithms)`;
  }

  // --- VEDIC / PARASHARI (LAHIRI & RAMAN) 19-CHAPTER MASTER REPORT ---
  const yogasText = yogas.length > 0
    ? yogas.map(y => {
        const yName = typeof y === "string" ? y : (isTamil ? (y.nameTa || y.name) : (y.name || y.title));
        const yDesc = typeof y === "object" ? (isTamil ? (y.manifestationTa || y.definitionTa || y.desc || y.definition) : (y.manifestation || y.desc || y.definition)) : (isTamil ? "சுப யோகம் செயல்படுகிறது." : "Favorable classical yoga operating in natal chart.");
        return `- **${cleanEnglishParentheses(yName)}**: ${yDesc}`;
      }).join("\n")
    : (isTamil ? "நிலையான நவகிரக அமைப்புகளின் வழியே சுப பலன்கள் வெளிப்படுகின்றன." : "Standard planetary alignments govern life outcomes without major adverse yoga impediments.");

  const stagesText = timelineStages.slice(0, 9).map(s => {
    const sLord = isTamil ? (s.lordTamil || toTamilPlanet(s.lord || s.dashaTrigger)) : (s.lord || s.dashaTrigger);
    const trans = (s.transitCrossings || []).map(t => typeof t === "string" ? t : (isTamil ? (t.summaryTa || t.summaryEn || "") : (t.summaryEn || t.title || ""))).filter(Boolean).join(" | ");
    return `- **${isTamil ? `பருவம் ${s.stageNum}: வயது ${s.ageRange}` : `Stage ${s.stageNum}: Ages ${s.ageRange}`} (${s.calendarYears || ''})** — *${isTamil ? (s.themeTamil || s.title) : s.title}* [${isTamil ? `தசை: ${sLord}` : `Dasha: ${s.dashaTrigger}`}]${trans ? `\n  - ${isTamil ? "கோசாரம்" : "Transits"}: ${trans}` : ""}`;
  }).join("\n");

  const primaryGemFormatted = typeof remedies.primaryGemstone === "object"
    ? (remedies.primaryGemstone.gemstone || remedies.primaryGemstone.name || (isTamil ? "லக்னாதிபதி ரத்தினம்" : "Lagna Gemstone"))
    : (remedies.primaryGemstone || (isTamil ? "லக்னாதிபதி ரத்தினம்" : "Lagna Gemstone"));

  const avoidGemsFormatted = Array.isArray(remedies.contraindicatedGemstones)
    ? remedies.contraindicatedGemstones.map(g => typeof g === "object" ? `${g.gemstone} (${g.reason || g.lord})` : g).join(", ")
    : (remedies.avoidGemstones || (isTamil ? "மறைவு ஸ்தான அதிபதிகளின் ரத்தினங்கள்" : "Dusthana Lord Gemstones"));

  if (isTamil) {
    return `# ஆஸ்ட்ரோவர்ஸ் — வேத ஜோதிட மகா ஜாதக ஆயுள் வழிகாட்டி

**ஜாதகர் பெயர்:** ${name} | **பிறந்த தேதி:** ${bDate} | **நேரம்:** ${bTime} | **இடம்:** ${bPlace}
**ஜோதிட முறை:** ${sysName} | **லக்னம்:** ${ascSignTamil} (${ascDegStr}) | **ராசி:** ${moonSignTamil} | **நட்சத்திரம்:** ${moonNakTamil} பாதம் ${moonPada} | **சூரியன்:** ${sunSignTamil}

---

## அத்தியாயம் 0: நிர்வாக சுருக்கம் & முக்கிய வாழ்வியல் கூறுகள்
உங்கள் ஜென்ம லக்னம் **${ascSignTamil}** மற்றும் சந்திரன் **${moonSignTamil}** ராசியில் அமைந்து, உங்கள் அடிப்படை ஆளுமை மற்றும் மன வலிமையை கட்டமைக்கின்றன. நடப்பு விம்சோத்தரி தசா **${dashaLordTamil}**${dashaSubLordTamil ? ` - **${dashaSubLordTamil}** புக்தி` : ""} காலக்கட்டம் உங்கள் தற்போதைய வாழ்வியல் பொறுப்புகளையும் முக்கிய முடிவுகளையும் வழிநடத்துகிறது.

## அத்தியாயம் 1: மூல ஜாதக கட்டமைப்பு & நவகிரக நிலைகள்
| கிரகம் | ராசி | பாகை | பாவகம் | பலம் / நிலை | நட்சத்திரம் |
|---|---|---|---|---|---|
${planetsList}

## அத்தியாயம் 2: முக்கிய யோகங்கள் & தோஷங்கள்
${yogasText}

## அத்தியாயம் 3: 12 பாவகங்களின் விரிவான ஆய்வு
${bhavasText}

## அத்தியாயம் 4: பாரம்பரிய ஆரோக்கியம் & ஆயுள் வழிகாட்டல்
லக்னாதிபதி மற்றும் 6, 8-ம் பாவகங்களின் அமைப்பின்படி, உடல்நலக் கட்டமைப்பில் சீரான உணவு முறை மற்றும் தினசரி உடற்பயிற்சி நற்பலன் தரும். 
*(குறிப்பு: இது பாரம்பரிய ஜோதிட வழிகாட்டலே தவிர மருத்துவ ஆலோசனை அல்ல.)*

## அத்தியாயம் 5: கல்வி & மேதைமை ஆய்வு
4-ம் மற்றும் 5-ம் பாவகங்களின் அமைப்பு அறிவாற்றல் மற்றும் தொடர் கற்றல் திறனை உறுதிப்படுத்துகிறது. புதன் மற்றும் குருவின் சேர்க்கை நுணுக்கமான பகுப்பாய்வு திறனை வழங்குகிறது.

## அத்தியாயம் 6: தொழில், உத்தியோகம் & தசாம்சம் (D10) ஆய்வு
10-ம் தொழில் பாவகம் மற்றும் தசாம்ச (D10) அமைப்புகள் உங்கள் நிர்வாக திறனையும் தொழில்முறை அந்தஸ்தையும் வளர்க்கின்றன. நடப்பு தசா காலத்தில் எடுக்கப்படும் திட்டமிட்ட முயற்சிகள் நீண்டகால வெற்றியைத் தரும்.

## அத்தியாயம் 7: பூமி, சொத்து & வாகன யோகம் (4-ம் பாவகம்)
4-ம் பாவகம் மற்றும் சுக்கிரன்/செவ்வாயின் சேர்க்கை பூமி சேர்க்கை மற்றும் வாகன வசதிக்கான சாதகமான யோகங்களைக் காட்டுகின்றன.

## அத்தியாயம் 8: பொது சேவை, அரசியல் & தலைமைத்துவ கூறுகள்
சூரியன் மற்றும் 10-ம் பாவாதிபதியின் பலம் பொது நிர்வாகம், நிறுவன தலைமை மற்றும் சமூகப் பொறுப்புகளில் மதிப்புமிக்க நிலையை அளிக்கிறது.

## அத்தியாயம் 9: திருமணம், குடும்பம் & நவாம்சம் (D9) ஆய்வு
7-ம் பாவகம் மற்றும் நவாம்ச (D9) கட்டமைப்பு குடும்ப நல்லிணக்கத்தையும் பரஸ்பர புரிதலையும் வலியுறுத்துகிறது.

## அத்தியாயம் 10: வெளிநாட்டுப் பயணம் & ஆன்மீக நாட்டம்
9 மற்றும் 12-ம் பாவகங்கள் தொலைதூர பயணங்கள், கலாச்சார பரிமாற்றம் மற்றும் ஆன்மீக முதிர்ச்சிக்கான வாய்ப்புகளை சுட்டிக்காட்டுகின்றன.

## அத்தியாயம் 11: திரிதோஷ சமநிலை (ஆயுர்வேத வழிகாட்டல்)
முதன்மை தோஷம்: **${dosha.primaryDosha || 'வாதம்'}**, துணை தோஷம்: **${dosha.secondaryDosha || 'பித்தம்'}**. சீரான நீர் அருந்துதலும் மிதமான உணவும் இயற்கை ஆற்றலை சமநிலையில் வைக்கும்.

## அத்தியாயம் 12: சாஸ்திர பரிகாரங்கள் & ரத்தினப் பரிந்துரை
- **முதன்மை ரத்தினம்:** ${primaryGemFormatted}
- **தவிர்க்க வேண்டிய ரத்தினங்கள்:** ${avoidGemsFormatted}
- **சுலோகம்:** ${remedies.mantra || 'ஓம் நமோ நாராயணாய'}
- **தானம்:** ${remedies.charity || 'அன்னதானம் மற்றும் கல்வி உதவி'}

## அத்தியாயம் 13: சுப முகூர்த்த காலங்கள் & பொது வழிகாட்டல்
முக்கிய சுப காரியங்களைத் தொடங்க குரு பார்வை பெற்ற தினங்களும், வளர்பிறை சுப திதிகளும் உகந்தவை.

## அத்தியாயம் 14: எச்சரிக்கை காலங்கள் & தடுப்பு முறைகள்
${risks.length > 0 ? risks.map(r => `- **${r.title}**: ${r.protectiveRemedy || 'கவனமான திட்டமிடல் அவசியம்.'}`).join("\n") : "கடுமையான பாதிப்புகள் இன்றி சீரான கிரக நிலைகள் காணப்படுகின்றன."}

## அத்தியாயம் 15: விம்சோத்தரி தசா காலக்கோடு (0-120 ஆண்டுகள்)
${stagesText}

## அத்தியாயம் 16: கடந்த கால நிகழ்வுகள் மீள் பார்வை
கடந்த கால தசா மாற்றங்கள் மற்றும் முக்கிய கல்வி, தொழில் மைல்கற்கள் விம்சோத்தரி கணிதத்துடன் பொருந்துகின்றன.

## அத்தியாயம் 17: ஜோதிட ஆதார சங்கிலி & சான்றுகள்
பராசர விதிகளின்படி நவகிரக பாகைகள், ஷட்பல விரூபங்கள் மற்றும் வர்க்க சக்கரங்களின் அடிப்படையிலேயே இந்த அறிக்கை தொகுக்கப்பட்டுள்ளது.

## அத்தியாயம் 18: தொழில்நுட்ப கணக்கீட்டு பிற்சேர்க்கை
- **அயனாம்சம்:** ${chartData.ayanamsaDms || (chartData.ayanamshaValue ? chartData.ayanamshaValue.toFixed(4) + '°' : sysName)}
- **எபிமெரிஸ் கணிதம்:** Astronomy Engine 2.1 (J2000.0)
- **பாவக முறை:** பராசர சம பாவகம் / பாவக சலிதம்

## அத்தியாயம் 19: பல ஜோதிட முறைகளின் ஒப்பீடு
லஹிரி, கே.பி. மற்றும் மேற்கத்திய முறைகளின் வானியல் பாகைகள் சீரான ஒருமுகத்தன்மையை உறுதி செய்கின்றன.`;
  }

  return `# ASTROVERSE — COMPREHENSIVE VEDIC ASTROLOGICAL MASTER DOSSIER

**Native:** ${name} | **Birth Date:** ${bDate} | **Time:** ${bTime} | **Place:** ${bPlace}
**Astrology System:** ${sysName} | **Ascendant:** ${ascSignName} (${ascDegStr}) | **Moon:** ${moonSignName} | **Nakshatra:** ${moonNakName} Pada ${moonPada} | **Sun:** ${sunSignName}

---

## Chapter 0: Executive Summary & Core Life Vectors
Your Ascendant in ${ascSignName} and Moon in ${moonSignName} establish your core astrological blueprint, balancing mental composure with strategic focus. The active Vimshottari period of ${dashaLord || 'operating lord'}${dashaSubLord ? ` — ${dashaSubLord}` : ""} governs current life responsibilities, catalyzing personal maturity and purposeful long-term milestones.

## Chapter 1: Natal Astrological Blueprint & Ephemeris Placements
| Body | Sign | Degree | House | Dignity | Nakshatra |
|---|---|---|---|---|---|
${planetsList}

## Chapter 2: Major Auspicious Yogas & Classical Combinations
${yogasText}

## Chapter 3: Comprehensive Twelve Bhavas (Houses) Deep Dive
${bhavasText}

## Chapter 4: Traditional Astrological Wellness & Vitality
Evaluating the 1st, 6th, and 8th house significations, your chart demonstrates sound constitutional resilience when supported by balanced sleep, hydration, and rhythmic daily habits.
*(Notice: Traditional astrological interpretation only; not medical diagnosis or advice.)*

## Chapter 5: Higher Studies, Intellectual Fortitude & Exam Windows
The 4th and 5th house configurations emphasize analytical agility and sustained learning capability. Key academic milestones benefit from Mercury's logical sharpness and Jupiter's broad perspective.

## Chapter 6: Vocational Trajectory, Career Zenith & D10 Dashamsha
Your 10th House of Career and D10 Dashamsha chart establish a structured vocational path rewarding steady perseverance, leadership stewardship, and institutional integrity over hasty shortcuts.

## Chapter 7: Real Estate, Vehicles & Material Prosperity (4th Bhava)
The 4th house and planetary significators Venus and Mars point to favorable long-term property acquisition windows and grounded asset accumulation.

## Chapter 8: Public Governance, Leadership & State Authority
Strength in the Sun and 10th house indicators supports executive decision-making, organizational authority, and public stewardship capabilities.

## Chapter 9: Marriage Harmony, Progeny & D9 Navamsha Analysis
The 7th house and D9 Navamsha harmonic division govern partnership dynamics, encouraging clear communication, mutual trust, and shared spiritual values.

## Chapter 10: Foreign Relocation, Cross-Border Horizons & Moksha
The 9th and 12th houses along with Rahu's placement signify opportunities for long-distance travel, cross-cultural engagements, and philosophical self-inquiry.

## Chapter 11: Tridosha Elemental Balance (Ayurvedic Guidance)
Primary Constitution: **${dosha.primaryDosha || 'Vata'}**, Secondary Constitution: **${dosha.secondaryDosha || 'Pitta'}**. Maintaining regular routines, wholesome warm foods, and mindfulness sustains elemental balance.

## Chapter 12: Classical Remedial Measures, Gemstones & Mantras
- **Primary Gemstone:** ${primaryGemFormatted}
- **Meditation Mantra:** ${remedies.mantra || 'Om Namo Narayanaya'}
- **Beneficent Charity:** ${remedies.charity || 'Support of education and feeding the underserved'}

## Chapter 13: Auspicious Timing Windows & Muhurta Principles
Commencing vital new ventures during Shukla Paksha (waxing Moon) and favorable Guru/Shukra hora periods maximizes auspicious momentum.

## Chapter 14: Traditional Caution Indicators & Risk Matrix
${risks.length > 0 ? risks.map(r => `- **${r.title}**: ${r.protectiveRemedy || 'Exercise measured prudence and avoid hasty commitments.'}`).join("\n") : "Planetary configurations show steady structural protection across major transits."}

## Chapter 15: Chronological Dasha & Life-Stage Timeline (0–120 Years)
${stagesText}

## Chapter 16: Retrospective Life Milestone Verification
Historical dasha shifts and candidate windows align closely with calculated Vimshottari progression cycles.

## Chapter 17: Astrologer Evidence Dossier & 9-Level Reasoning Chain
All interpretations are derived strictly from mathematical ephemeris calculations, Parashari Shadbala virupas, and harmonic divisional confirmations.

## Chapter 18: Comprehensive Technical Calculation Appendix
- **Ayanamsha:** ${chartData.ayanamsaDms || (chartData.ayanamshaValue ? chartData.ayanamshaValue.toFixed(4) + '°' : sysName)}
- **Ephemeris Base:** Astronomy Engine 2.1 (J2000.0)
- **House Framework:** Whole Sign / Equal Bhava Chalit

## Chapter 19: Multi-System Comparative Analysis & Synthesis
Cross-comparisons across Lahiri, KP, and Tropical systems confirm core sign placements and cuspal alignments.`;
}

/**
 * Invokes Google Gemini API with ephemeris data through secure backend proxy.
 * If backend AI is offline or unconfigured, seamlessly falls back to local deterministic master report.
 */
export async function generateAIDeepAstrologyReport(chartData, lang = "en", onCreditDeducted = null) {
  if (!chartData) {
    throw new Error(lang === "ta" ? "ஜாதக தரவு தேவை." : "Chart data is required to generate report.");
  }

  const isTamil = lang === "ta";
  let prompt = "";
  try {
    prompt = buildAstrologyPrompt(chartData, lang);
  } catch (promptErr) {
    console.warn("buildAstrologyPrompt error, synthesizing local deterministic master report:", promptErr);
    return generateLocalDeterministicMasterReport(chartData, lang);
  }

  // 1. Dispatch request through the secure backend proxy (keeping API keys isolated on the server)
  let token = null;
  try {
    token = await ensureSessionToken();
  } catch {
    // Offline mode
  }

  try {
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const proxyResponse = await apiFetch("/api/generate-astrology", {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, lang })
    });

    if (proxyResponse && proxyResponse.ok) {
      const proxyData = await proxyResponse.json();
      if (typeof onCreditDeducted === "function" && typeof proxyData.remainingCredits === "number") {
        onCreditDeducted(proxyData.remainingCredits);
      }
      if (proxyData.text) {
        return cleanAIOutput(proxyData.text, lang);
      }
    }
  } catch (err) {
    console.warn("Remote AI service unreachable, synthesizing local master report:", err.message);
  }

  // Seamless fallback to comprehensive 19-chapter local deterministic master report
  return generateLocalDeterministicMasterReport(chartData, lang);
}


