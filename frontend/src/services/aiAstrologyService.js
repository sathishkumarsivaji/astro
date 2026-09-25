/**
 * AI Deep Astrological Reading Service
 * Integrates Google Gemini API to synthesize astronomical ephemeris data
 * into deeply personalized, multi-page classical Vedic astrology dossiers.
 */

// Server-side session & credit management: API keys are securely isolated on the backend.
let cachedSessionToken = (typeof window !== "undefined" && window.localStorage)
  ? localStorage.getItem("astro_session_token")
  : null;

/**
 * Ensures an authenticated session exists with the backend server via cryptographic handshake.
 */
export async function ensureSessionToken() {
  if (cachedSessionToken) {
    return cachedSessionToken;
  }

  const authUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_AI_PROXY_URL)
    ? import.meta.env.VITE_AI_PROXY_URL.replace(/\/generate-astrology$/, "/auth/session")
    : "http://localhost:5000/api/auth/session";

  try {
    const res = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.sessionToken) {
        cachedSessionToken = data.sessionToken;
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem("astro_session_token", data.sessionToken);
        }
        return cachedSessionToken;
      }
    }
  } catch (e) {
    // Backend offline or unreachable
  }

  return cachedSessionToken || "unauthenticated_session";
}

export function getSessionToken() {
  return cachedSessionToken || (typeof window !== "undefined" && window.localStorage?.getItem("astro_session_token")) || "unauthenticated_session";
}

export async function fetchUserCredits() {
  const token = await ensureSessionToken();
  const proxyUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_AI_PROXY_URL)
    ? import.meta.env.VITE_AI_PROXY_URL.replace(/\/generate-astrology$/, "/user/credits")
    : "http://localhost:5000/api/user/credits";

  try {
    const res = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      return typeof data.availableCredits === "number" ? data.availableCredits : null;
    }
  } catch (e) {
    // Return null if offline; do not fabricate client-side credits
  }
  return null;
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
        const houseStr = p.house || p.vargaHouse || 1;
        const dignityStr = p.dignity || "Neutral";
        return `${p.name}: in ${signStr} (House ${houseStr}, Dignity: ${dignityStr}${ret}${comb})`;
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

  const shadbalaSummary = (shadbala || []).map(s => {
    return `- ${s.planet} (${s.planetTa}): ${s.totalRupas} Rupas / ${s.requiredRupas} Required (Ratio: ${s.ratio}) - [${s.status}]`;
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
3. **முழுமையான தனிப்பயனாக்கம் (Zero Boilerplate):** பொதுவான ராசி பலன்களையோ, வார்ப்புருக்களையோ எழுதக் கூடாது. லக்னம் (${ascendantSign.name} / ${ascendantSign.tamil}), லக்னாதிபதி, ராசி & நட்சத்திரம் (${moonSign.name} / ${moonNakshatra.name} பாதம் ${moonNakshatra.pada}), 12 பாவாதிபதிகள் மற்றும் தசா-புக்திகளை நேரடியாகக் குறிப்பிடவும்.
4. **தூய தமிழ் மொழி (100% Pure Tamil Output):** முழு பதிலையும் உயர்தர, கம்பீரமான தூய தமிழில் மட்டுமே எழுத வேண்டும்.
5. **வரைவு குறிப்புகள் தடை (No Drafting Scratchpads):** ஆங்கில வரைவு குறிப்புகளோ (drafting notes / tone check / self-correction), சிந்தனைப் பத்திகளோ இடம்பெறக் கூடாது.
6. **சான்றுகள் தளம் (Evidence Ledger Integration):** சாதகமான காரணிகளையும் (Supporting Factors) சவாலான எதிர்ப்புக் காரணிகளையும் (Counter Indicators) சமநிலையுடன் விளக்கவும். பொய்யான உறுதிப்பாட்டு சதவீதங்கள் (எ.கா: 85%, 99.85%) எழுதக் கூடாது.
7. **சாஸ்திர வரம்புகள் & மரண வயது கணிப்பு தவிர்ப்பு:** இல்லாத கோச்சாரங்களையோ, மருத்துவ உத்தரவாதங்களையோ அல்லது மரண வயதையோ சுயமாக கற்பனை செய்து எழுதக் கூடாது. சாஸ்திர ரீதியான தடுப்பு ஆரோக்கிய வழிகாட்டலை மட்டுமே வழங்கவும்.
8. **காலக்கட்ட மாறாமை விதி (Deterministic Timing Invariant):** அறிக்கையில் குறிப்பிடப்படும் ஒவ்வொரு பலன் காலம், தசா-புக்தி காலங்கள், கோச்சார பெயர்ச்சிகள், வர்க்க சக்கர நிலைகள் அனைத்தும் கீழே தரப்பட்டுள்ள கணிதத் தரவுகளிலிருந்து மட்டுமே நேரடியாக எழுதப்பட வேண்டும். மாதிரி (AI model) சுயமாக எந்தவொரு காலக்கட்டத்தையோ, தேதியையோ மாற்றவோ உருவாக்கவோ கூடாது.

### ஜாதக கணித தரவுகள் (Astronomical Natal Data):
- **ஜென்ம லக்னம்:** ${ascendantSign.name} (${ascendantSign.tamil})
- **ஜென்ம ராசி & நட்சத்திரம்:** ${moonSign.name} (${moonSign.tamil}) - ${moonNakshatra.name} (${moonNakshatra.tamil}) பாதம் ${moonNakshatra.pada} (அதிபதி: ${moonNakshatra.ruler})
- **சூரிய ராசி & நட்சத்திரம்:** ${sunSign.name} (${sunSign.tamil}) - ${sunNakshatra.name} (${sunNakshatra.tamil})
- **பஞ்சாங்கம்:** ${panchangam?.tamilYear || ''} வருடம், ${panchangam?.tamilMonth || ''} மாதம், திதி: ${panchangam?.thithi || ''}, யோகம்: ${panchangam?.yogam || ''}, தசா இருப்பு: ${panchangam?.dashaBalance || ''}
- **செவ்வாய் தோஷம்:** ${doshaAnalysis?.chevvaiStatus || 'இல்லை'}
- **தற்போதைய மகா தசை:** ${currentDasha?.tamil || currentDasha?.lord} தசை (வயது ${currentDasha?.startAge} முதல் ${currentDasha?.endAge} வரை)

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

### நீங்கள் அறிக்கையில் விரிவாக எழுத வேண்டிய 16 முக்கிய அத்தியாயங்கள்:

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
- **Ascendant (Lagna):** ${ascendantSign.name} (${ascendantSign.tamil})
- **Moon Sign & Nakshatra:** ${moonSign.name} - ${moonNakshatra.name} Pada ${moonNakshatra.pada} (Ruler: ${moonNakshatra.ruler})
- **Sun Sign & Nakshatra:** ${sunSign.name} - ${sunNakshatra.name}
- **Panchangam:** Thithi: ${panchangam?.thithiEn || ''}, Yogam: ${panchangam?.yogam || ''}, Dasha Balance: ${panchangam?.dashaBalanceEn || ''}
- **Kuja (Mars) Dosha Analysis:** ${doshaAnalysis?.chevvaiStatus || 'Absent'}
- **Current Active Mahadasha:** ${currentDasha?.lord} Dasha (Ages ${currentDasha?.startAge} to ${currentDasha?.endAge})

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

### Structure Your Master Report into 18 Exhaustive Chapters Matching the System Tabs:

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
 * Invokes Google Gemini API with ephemeris data through secure backend proxy
 */
export async function generateAIDeepAstrologyReport(chartData, lang = "en", onCreditDeducted = null) {
  const isTamil = lang === "ta";
  const prompt = buildAstrologyPrompt(chartData, lang);

  // 1. Dispatch request through the secure backend proxy (keeping API keys isolated on the server)
  const proxyUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_AI_PROXY_URL) || "/api/astrology-report";
  const token = await ensureSessionToken();
  
  try {
    let proxyResponse;
    try {
      proxyResponse = await fetch(proxyUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, lang })
      });
    } catch {
      // Fallback to local express backend if vite middleware is not handling
      proxyResponse = await fetch("http://localhost:5000/api/generate-astrology", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, lang })
      });
    }

    if (proxyResponse.ok) {
      const proxyData = await proxyResponse.json();
      if (typeof onCreditDeducted === "function" && typeof proxyData.remainingCredits === "number") {
        onCreditDeducted(proxyData.remainingCredits);
      }
      if (proxyData.text) {
        return cleanAIOutput(proxyData.text, lang);
      }
    } else if (proxyResponse.status === 402) {
      const errData = await proxyResponse.json().catch(() => ({}));
      throw new Error(errData.error || (isTamil ? "போதிய இருப்பு இல்லை. தயவுசெய்து ரீசார்ஜ் செய்யவும்." : "Insufficient credits. Please recharge your reading balance."));
    } else if (proxyResponse.status === 429) {
      throw new Error(isTamil ? "அதிகப்படியான கோரிக்கைகள். 10 நிமிடங்கள் கழித்து மீண்டும் முயற்சிக்கவும்." : "Rate limit reached. Maximum 20 requests per 10 minutes.");
    } else {
      const errData = await proxyResponse.json().catch(() => ({}));
      throw new Error(errData.error || `AI Service Error (HTTP ${proxyResponse.status})`);
    }
  } catch (err) {
    if (err.message && (err.message.includes("Insufficient credits") || err.message.includes("Rate limit") || err.message.includes("AI Service Error"))) {
      throw err;
    }
    throw new Error(
      isTamil
        ? "AI சேவையகத்தை இணைக்க இயலவில்லை. தயவுசெய்து AstroVerse Backend Server இயங்குகிறதா என சரிபார்க்கவும்."
        : `Unable to connect to AI server at ${proxyUrl}. Please ensure the AstroVerse backend service is running.`
    );
  }
}

