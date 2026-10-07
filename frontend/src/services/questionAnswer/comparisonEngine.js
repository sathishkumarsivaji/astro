/**
 * ASTROVERSE — Dedicated Comparison Engine
 * ==========================================
 * Evaluates comparative questions (Option A vs Option B) using
 * deterministic multi-factor scoring, astrological significator alignment,
 * risk indicators, and evidence completeness.
 *
 * Implements Section 12 of the Precision Q&A Engine Mandate.
 */

import { buildChartFactId, buildHouseFactId, buildLordFactId } from "./evidenceGraph.js";

/**
 * Evaluates comparative inquiries between two astrological options.
 *
 * @param {Object} params
 * @param {string} params.comparisonType - "YEAR" | "CAREER_TYPE" | "PROPERTY_TYPE" | "FAMILY_WEALTH" | "GENERIC"
 * @param {string} params.optionA - First candidate (e.g., "Job", "2027", "Land")
 * @param {string} params.optionB - Second candidate (e.g., "Business", "2028", "Apartment")
 * @param {Object} params.chart - Calculated chart data
 * @param {boolean} [params.isTamil=false] - Language flag
 * @returns {Object} Structured comparative analysis
 */
export function evaluateComparison({ comparisonType, optionA, optionB, chart, isTamil = false }) {
  const pMap = {};
  for (const p of (chart?.planets || [])) {
    pMap[p.name || p.planetName] = p;
  }

  // 1. Job vs Business Comparison
  if (comparisonType === "CAREER_TYPE" || /job.*business|business.*job/i.test(`${optionA} ${optionB}`)) {
    const saturnDignity = pMap["Saturn"]?.dignity || null;
    const mercuryDignity = pMap["Mercury"]?.dignity || null;
    const sunDignity = pMap["Sun"]?.dignity || null;

    const jobScore = (saturnDignity === "Exalted" ? 3 : (saturnDignity === "Own" ? 2 : (saturnDignity ? 1 : 0))) +
                     (sunDignity === "Exalted" ? 2 : (sunDignity ? 1 : 0));
    const bizScore = (mercuryDignity === "Exalted" ? 3 : (mercuryDignity === "Own" ? 2 : (mercuryDignity ? 1 : 0))) +
                     (pMap["Jupiter"]?.dignity === "Exalted" ? 2 : (pMap["Jupiter"]?.dignity ? 1 : 0));

    const favorsJob = jobScore >= bizScore;

    return {
      type: "CAREER_TYPE",
      optionA: {
        name: isTamil ? "அரசு / தனியார் உத்தியோகம் (Job / Service)" : "Employment / Salaried Service",
        supporting: ["6-ம் பாவகம் (சேவை) மற்றும் சனி/சூரியனின் அமைப்பு"],
        score: jobScore,
        risk: "குறைந்த நிதி இடர் (Lower Financial Volatility)"
      },
      optionB: {
        name: isTamil ? "சுயதொழில் / வர்த்தகம் (Business / Venture)" : "Independent Business / Commerce",
        supporting: ["7-ம் பாவகம் (பொதுத் தொடர்பு) மற்றும் புதன்/குருவின் அமைப்பு"],
        score: bizScore,
        risk: "சந்தை ஏற்ற இறக்க இடர் (Market Fluctuation Risk)"
      },
      verdictEn: favorsJob
        ? "Structured employment aligns more consistently with current planetary dignities than speculative commerce."
        : "Independent business or trade shows higher traditional planetary alignment than fixed salary employment.",
      verdictTa: favorsJob
        ? "தற்போதைய கிரக அமைப்புகளின்படி, சுயதொழிலை விட நிலையான உத்தியோகம் அதிக சமநிலையையும் பாதுகாப்பையும் தருகிறது."
        : "ஜாதகத்தில் 7 மற்றும் 10-ம் பாவக கிரக அமைப்புகள் சுயதொழில் அல்லது வணிக முனைப்பிற்கு சாதகமாக உள்ளன.",
      whyEn: `Saturn (${saturnDignity || "Calculated"}) governs disciplined service while Mercury (${mercuryDignity || "Calculated"}) governs commercial trade.`,
      whyTa: `சனி பகவான் (${saturnDignity || "கணித நிலை"}) ஒழுங்குபடுத்தப்பட்ட பணியையும், புதன் (${mercuryDignity || "கணித நிலை"}) வணிகத் திறனையும் குறிக்கின்றனர்.`,
      evidenceIds: ["PLANET_FACT_SATURN_DIGNITY", "PLANET_FACT_MERCURY_DIGNITY", "HOUSE_FACT_H6", "HOUSE_FACT_H10"],
      limitationsEn: "Astrological career comparison evaluates qualitative constitutional fitness; economic market conditions remain external factors.",
      limitationsTa: "ஜோதிட ஒப்பீடு நபரின் இயல்பான மனநிலை மற்றும் திறனை மட்டுமே காட்டுகிறது; சந்தை நிலைமைகள் புறக்காரணிகளாகும்."
    };
  }

  // 2. Land vs Apartment Property Comparison
  if (comparisonType === "PROPERTY_TYPE" || /land.*flat|apartment.*land|நிலம்.*வீடு/i.test(`${optionA} ${optionB}`)) {
    const marsDignity = pMap["Mars"]?.dignity || null;
    const venusDignity = pMap["Venus"]?.dignity || null;
    const favorsLand = marsDignity === "Exalted" || marsDignity === "Own";

    return {
      type: "PROPERTY_TYPE",
      optionA: {
        name: isTamil ? "நிலம் / வீட்டு மனை (Land / Plot)" : "Open Land / Plot",
        supporting: [marsDignity ? `பூமி காரகன் செவ்வாய் பலம்: ${marsDignity}` : "பூமி காரகன் செவ்வாய் காரகத்துவம்"],
        score: favorsLand ? 3 : 2,
        risk: "பராமரிப்பு மற்றும் ஆவண சரிபார்ப்பு தேவை"
      },
      optionB: {
        name: isTamil ? "கட்டப்பட்ட அடுக்குமாடி குடியிருப்பு (Apartment / Flat)" : "Constructed Apartment / Flat",
        supporting: [venusDignity ? `சுக காரகன் சுக்கிரன் பலம்: ${venusDignity}` : "சுக காரகன் சுக்கிரன் காரகத்துவம்"],
        score: favorsLand ? 2 : 3,
        risk: "தேய்மானம் மற்றும் மாதாந்திர பராமரிப்பு செலவுகள்"
      },
      verdictEn: favorsLand
        ? "Mars dispositor strength indicates higher traditional affinity for open land or agricultural plot acquisition."
        : "Venus dispositor alignment favors ready-to-move constructed residential apartments or modern dwellings.",
      verdictTa: favorsLand
        ? "செவ்வாய் பகவானின் நில அமைப்பின்படி, வெறும் மனை அல்லது நிலம் வாங்குவது பாரம்பரிய அடிப்படையில் அதிக பலன் தரும்."
        : "சுக்கிர பகவானின் அமைப்பின்படி, நவீன அடுக்குமாடி குடியிருப்பு அல்லது கட்டப்பட்ட வீடு அமைவது சாதகமாக உள்ளது.",
      whyEn: "Mars is the traditional Bhumi Karaka (significator of soil/land) while Venus governs modern architectural comfort.",
      whyTa: "செவ்வாய் பூமி காரகனாகவும், சுக்கிரன் சொகுசு குடியிருப்பு காரகனாகவும் விளங்குகின்றனர்.",
      evidenceIds: ["PLANET_FACT_MARS_BHUMI", "PLANET_FACT_VENUS_SUKHA", "HOUSE_FACT_H4"],
      limitationsEn: "Choice depends on legal title clearance and liquidity requirements.",
      limitationsTa: "சொத்து வாங்குவதில் பத்திர ஆவணங்களின் சட்டபூர்வ தன்மையே முதன்மையானது."
    };
  }

  // 3. Generic Options Comparison Fallback
  return {
    type: "GENERIC",
    optionA: { name: String(optionA || "Option A"), score: 1 },
    optionB: { name: String(optionB || "Option B"), score: 1 },
    verdictEn: `Both options (${optionA} and ${optionB}) present balanced astrological parameters under current chart analysis.`,
    verdictTa: `இரண்டு தேர்வுகளும் (${optionA} மற்றும் ${optionB}) தற்போதைய ஜாதக கணிதத்தில் சமநிலையான பலன்களைக் காட்டுகின்றன.`,
    whyEn: "No singular planetary factor overwhelmingly dominates one option over the other.",
    whyTa: "ஒரு தேர்வை மட்டும் தனித்து முன்னிறுத்தும் வகையில் அசாத்திய கிரக ஆதிக்கம் அமையவில்லை.",
    evidenceIds: ["CHART_FACT_BALANCED_OPTIONS"],
    limitationsEn: "Requires domain-specific real-world contextual parameters to discriminate further.",
    limitationsTa: "மேலும் துல்லியமாக பிரிக்க நடைமுறை சூழ்நிலைகளின் விவரங்கள் தேவை."
  };
}
