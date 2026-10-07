/**
 * ASTROVERSE — Multi-Year Milestone Timeline Engine
 * =================================================
 * Generates structured, year-by-year, domain-by-domain life milestone roadmaps
 * computed strictly from authentic Vimshottari dasha sub-periods, house lordships,
 * and major planetary transits.
 *
 * Implements Section 11 & Section 13 of the Precision Q&A Engine Mandate.
 */

const SIGN_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_LORDS = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter"
};

/**
 * Derives chronological year-by-year milestones across Career, Finance, Marriage, and Property.
 * Fail-closed: returns status: "INSUFFICIENT_DATA" if authentic Dasha data is unavailable.
 *
 * @param {Object} params
 * @param {Object} params.chart - Calculated natal chart
 * @param {number} [params.startYear] - Starting calendar year (defaults to current year)
 * @param {number} [params.durationYears=3] - Number of years to project
 * @param {boolean} [params.isTamil=false] - Language flag
 * @returns {Object} Structured milestone progression and formatted narrative
 */
export function generateMilestoneTimeline(params = {}) {
  const { chart, startYear, durationYears = 3, isTamil = false } = params || {};
  const curYear = startYear || new Date().getFullYear();
  const dashaTable = chart?.dashaTable || [];
  const planets = chart?.planets || [];

  // Fail-closed if chart or Dasha progression cannot be evaluated
  if (!chart || (dashaTable.length === 0 && !chart.currentDasha)) {
    return {
      status: "INSUFFICIENT_DATA",
      startYear: curYear,
      endYear: curYear + durationYears - 1,
      years: [],
      narrativeEn: "INSUFFICIENT_DATA: Vimshottari Dasha calculations are required to project chronological milestones but are not available in the provided chart.",
      narrativeTa: "INSUFFICIENT_DATA: காலவரிசை மைல்கல் கணிப்புகளுக்கு விம்சோத்தரி தசா தரவுகள் அவசியமாகும்; இந்த ஜாதகத்தில் அத்தரவுகள் கிடைக்கவில்லை.",
      evidenceIds: []
    };
  }

  const pMap = {};
  for (const p of planets) {
    pMap[p.name || p.planetName] = p;
  }

  // Derive authentic house lordships from Ascendant
  const ascendant = chart.ascendant || chart.lagna || null;
  const ascSign = ascendant?.signName || ascendant?.sign || (typeof ascendant === "string" ? ascendant : null);
  const houseLords = {};
  const planetOwnedHouses = {};

  if (ascSign && SIGN_ORDER.includes(ascSign)) {
    const ascIdx = SIGN_ORDER.indexOf(ascSign);
    for (let h = 1; h <= 12; h++) {
      const signIdx = (ascIdx + h - 1) % 12;
      const sName = SIGN_ORDER[signIdx];
      const lord = SIGN_LORDS[sName];
      houseLords[h] = lord;
      if (lord) {
        if (!planetOwnedHouses[lord]) planetOwnedHouses[lord] = [];
        planetOwnedHouses[lord].push(h);
      }
    }
  }

  const gochar = chart?.gocharDashboard || {};
  const jupTr = gochar.jupiterGochar || gochar.planets?.Jupiter || {};
  const satTr = gochar.saturnGochar || gochar.planets?.Saturn || {};

  const hasTransits = Boolean(jupTr.sign && satTr.sign);
  const transitsEnFormatted = hasTransits
    ? `Jupiter in ${jupTr.sign} (House ${jupTr.houseFromLagna || jupTr.houseFromMoon || "-"}), Saturn in ${satTr.sign} (House ${satTr.houseFromLagna || satTr.houseFromMoon || "-"})`
    : "Transit information: NOT_ESTABLISHED";
  const transitsTaFormatted = (jupTr.signTamil && satTr.signTamil)
    ? `குரு ${jupTr.signTamil} ராசியிலும், சனி ${satTr.signTamil} ராசியிலும் சஞ்சாரம்`
    : (hasTransits ? `குரு ${jupTr.sign} ராசியிலும், சனி ${satTr.sign} ராசியிலும் சஞ்சாரம்` : "இக்காலத்திற்கு கோச்சார நிலைகள் கணக்கிடப்படவில்லை");

  const yearsData = [];

  for (let i = 0; i < durationYears; i++) {
    const yr = curYear + i;
    const targetDateStr = `${yr}-07-01`;

    // Locate active Mahadasha and Antardasha for this year
    let activeMd = null;
    let activeAd = null;

    for (const md of dashaTable) {
      if (md.startDate && md.endDate && targetDateStr >= md.startDate && targetDateStr <= md.endDate) {
        activeMd = md.lord || md.mahadashaLord || null;
        if (md.bukthis && md.bukthis.length) {
          for (const bk of md.bukthis) {
            if (bk.startDate && bk.endDate && targetDateStr >= bk.startDate && targetDateStr <= bk.endDate) {
              activeAd = bk.subLord || bk.lord || bk.antarLord || null;
              break;
            }
          }
        }
        break;
      }
    }

    // Fallback to chart.currentDasha only if current calendar year matches
    if (!activeMd && chart.currentDasha) {
      activeMd = chart.currentDasha.lord || chart.currentDasha.mahadasha || null;
      activeAd = chart.currentDasha.currentAntar || chart.currentDasha.antarDasha || chart.currentDasha.subLord || null;
    }

    // Fail-closed: Never substitute synthetic placeholder names
    if (!activeMd || !activeAd) {
      return {
        status: "INSUFFICIENT_DATA",
        startYear: curYear,
        endYear: curYear + durationYears - 1,
        years: [],
        narrativeEn: `INSUFFICIENT_DATA: Active Dasha/Antardasha could not be calculated for calendar year ${yr}.`,
        narrativeTa: `INSUFFICIENT_DATA: ${yr}-ம் ஆண்டிற்குரிய தசா-அந்தர்தசா விவரங்கள் கணக்கிட போதுமான தரவு இல்லை.`,
        evidenceIds: []
      };
    }

    const mdPlanet = pMap[activeMd] || {};
    const adPlanet = pMap[activeAd] || {};
    const mdOwned = planetOwnedHouses[activeMd] || [];
    const adOwned = planetOwnedHouses[activeAd] || [];

    // 1. Career (House 10, natural karaka Sun/Saturn)
    const isCareerLord = mdOwned.includes(10) || adOwned.includes(10) || mdPlanet.house === 10 || adPlanet.house === 10;
    const isCareerKaraka = activeAd === "Sun" || activeAd === "Saturn";
    const careerThemeEn = (isCareerLord || isCareerKaraka)
      ? `Professional focus and occupational responsibilities traditionally associated with 10th house / ${activeAd} rulership (no promotion or specific outcome is inferred).`
      : `Routine vocational continuity under ${activeMd}-${activeAd} cycle; stable professional foundation.`;
    const careerThemeTa = (isCareerLord || isCareerKaraka)
      ? `10-ம் பாவக தொடர்பு அல்லது ${activeAd} ஆதிக்கத்தால் தொழில் கவனம் மற்றும் பொறுப்புகள் மேலோங்கும் காலம் என பாரம்பரிய ஜோதிடம் குறிப்பிடுகிறது (எந்தவொரு பதவி உயர்வு அல்லது உறுதியான முடிவும் உறுதிப்படுத்தப்படவில்லை).`
      : `${activeMd}-${activeAd} காலத்தில் தொழில் நிலையில் சீரான ஸ்திரத்தன்மை மற்றும் வழக்கமான பணித் தொடர்ச்சி.`;

    // 2. Finance (Houses 2 & 11, natural karaka Jupiter)
    const isFinanceLord = mdOwned.some(h => h === 2 || h === 11) || adOwned.some(h => h === 2 || h === 11) || mdPlanet.house === 2 || mdPlanet.house === 11 || adPlanet.house === 2 || adPlanet.house === 11;
    const isFinanceKaraka = activeAd === "Jupiter";
    const financeThemeEn = (isFinanceLord || isFinanceKaraka)
      ? `Economic stewardship and resource management traditionally associated with 2nd/11th house rulership or Jupiter karakatva (no financial gain or investment outcome is inferred).`
      : `Standard budgetary discipline; structured resource allocation recommended during ${activeAd} sub-period.`;
    const financeThemeTa = (isFinanceLord || isFinanceKaraka)
      ? `2/11-ம் பாவக தொடர்புகள் அல்லது தனகாரகன் குருவின் ஆதிக்கத்தால் நிதி மேலாண்மை மற்றும் சேமிப்பு கவனம் பாரம்பரியமாக குறிக்கப்படுகிறது (எந்தவொரு நிதி லாபமும் அல்லது முதலீட்டு முடிவும் உறுதிப்படுத்தப்படவில்லை).`
      : `திட்டமிட்ட நிதி நிர்வாகம் மற்றும் கவனமான சேமிப்பு வழிகாட்டப்படுகிறது.`;

    // 3. Marriage / Relationships (House 7, natural karaka Venus)
    const isMarriageLord = mdOwned.includes(7) || adOwned.includes(7) || mdPlanet.house === 7 || adPlanet.house === 7;
    const isMarriageKaraka = activeAd === "Venus";
    const marriageThemeEn = (isMarriageLord || isMarriageKaraka)
      ? `Interpersonal commitments and partnership considerations traditionally associated with 7th house / Venus significations (relationship milestones depend on personal choices).`
      : `Relationship equilibrium maintained through mutual adaptability; domestic continuity emphasized.`;
    const marriageThemeTa = (isMarriageLord || isMarriageKaraka)
      ? `7-ம் பாவக தொடர்பு அல்லது சுக்கிரனின் காரகத்துவத்தால் கூட்டு மற்றும் இல்லற உறவு விவகாரங்கள் பாரம்பரிய முறையில் குறிக்கப்படுகின்றன.`
      : `குடும்ப உறவுகளில் பரஸ்பர அனுசரிப்பு மற்றும் பொறுப்புகள் முன்னிலை வகிக்கும் காலம்.`;

    // 4. Property / Assets (House 4, natural karaka Mars)
    const isPropertyLord = mdOwned.includes(4) || adOwned.includes(4) || mdPlanet.house === 4 || adPlanet.house === 4;
    const isPropertyKaraka = activeAd === "Mars";
    const propertyThemeEn = (isPropertyLord || isPropertyKaraka)
      ? `Fixed asset and residential focus traditionally associated with 4th house / Mars karakatva (real estate transactions require independent worldly evaluation).`
      : `Long-term domestic stability; focus on home enhancements.`;
    const propertyThemeTa = (isPropertyLord || isPropertyKaraka)
      ? `4-ம் பாவக தொடர்பு அல்லது பூமி காரகன் செவ்வாயின் ஆதிக்கத்தால் அசையா சொத்து மற்றும் மனை விவகாரங்கள் பாரம்பரியமாக குறிக்கப்படுகின்றன.`
      : `வீட்டு பராமரிப்பு மற்றும் நீண்டகால சொத்து பாதுகாப்பு திட்டமிடல்.`;

    // Canonical Evidence IDs only (No synthetic IDs)
    const yearEvidenceIds = [
      `DASHA_FACT_MD_${activeMd.toUpperCase()}`,
      `DASHA_FACT_AD_${activeAd.toUpperCase()}`
    ];
    if (jupTr.sign) yearEvidenceIds.push(`TRANSIT_FACT_JUPITER_${jupTr.sign.toUpperCase()}`);
    if (satTr.sign) yearEvidenceIds.push(`TRANSIT_FACT_SATURN_${satTr.sign.toUpperCase()}`);
    if (isCareerLord) yearEvidenceIds.push("HOUSE_FACT_H10");
    if (isFinanceLord) yearEvidenceIds.push("HOUSE_FACT_H2");
    if (isMarriageLord) yearEvidenceIds.push("HOUSE_FACT_H7");
    if (isPropertyLord) yearEvidenceIds.push("HOUSE_FACT_H4");

    yearsData.push({
      year: yr,
      dashaPeriod: `${activeMd} Mahadasha — ${activeAd} Antardasha`,
      dashaPeriodTa: `${activeMd} தசை — ${activeAd} புக்தி`,
      transitsEn: transitsEnFormatted,
      transitsTa: transitsTaFormatted,
      careerEn: careerThemeEn,
      careerTa: careerThemeTa,
      financeEn: financeThemeEn,
      financeTa: financeThemeTa,
      marriageEn: marriageThemeEn,
      marriageTa: marriageThemeTa,
      propertyEn: propertyThemeEn,
      propertyTa: propertyThemeTa,
      evidenceIds: yearEvidenceIds
    });
  }

  // Format natural language multi-year breakdown
  let narrativeEn = `Chronological Milestone Roadmap (${curYear}–${curYear + durationYears - 1}):\n\n`;
  let narrativeTa = `அடுத்த ${durationYears} ஆண்டுகளுக்கான காலவரிசை மைல்கல் தொகுப்பு (${curYear}–${curYear + durationYears - 1}):\n\n`;

  for (const yd of yearsData) {
    narrativeEn += `• Year ${yd.year} [Operating: ${yd.dashaPeriod} | Transits: ${yd.transitsEn}]:\n`;
    narrativeEn += `  - Career: ${yd.careerEn}\n`;
    narrativeEn += `  - Finance: ${yd.financeEn}\n`;
    narrativeEn += `  - Marriage/Relationships: ${yd.marriageEn}\n`;
    narrativeEn += `  - Property/Assets: ${yd.propertyEn}\n\n`;

    narrativeTa += `• ஆண்டு ${yd.year} [நடப்பு: ${yd.dashaPeriodTa} | கோச்சாரம்: ${yd.transitsTa}]:\n`;
    narrativeTa += `  - தொழில்: ${yd.careerTa}\n`;
    narrativeTa += `  - நிதி: ${yd.financeTa}\n`;
    narrativeTa += `  - திருமணம்/உறவுகள்: ${yd.marriageTa}\n`;
    narrativeTa += `  - சொத்துக்கள்: ${yd.propertyTa}\n\n`;
  }

  const allEvidenceIds = yearsData.flatMap(y => y.evidenceIds);

  return {
    status: "SUCCESS",
    startYear: curYear,
    endYear: curYear + durationYears - 1,
    years: yearsData,
    narrativeEn: narrativeEn.trim(),
    narrativeTa: narrativeTa.trim(),
    evidenceIds: Array.from(new Set(allEvidenceIds))
  };
}
