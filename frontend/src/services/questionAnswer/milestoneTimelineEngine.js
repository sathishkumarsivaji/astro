/**
 * ASTROVERSE — Multi-Year Milestone Timeline Engine
 * =================================================
 * Generates structured, year-by-year, domain-by-domain life milestone roadmaps
 * computed strictly from authentic Vimshottari dasha sub-periods and major planetary transits.
 *
 * Implements Section 11 & Section 13 of the Precision Q&A Engine Mandate.
 */

/**
 * Derives chronological year-by-year milestones across Career, Finance, Marriage, and Property.
 *
 * @param {Object} params
 * @param {Object} params.chart - Calculated natal chart
 * @param {number} [params.startYear] - Starting calendar year (defaults to current year)
 * @param {number} [params.durationYears=3] - Number of years to project
 * @param {boolean} [params.isTamil=false] - Language flag
 * @returns {Object} Structured milestone progression and formatted narrative
 */
export function generateMilestoneTimeline({ chart, startYear, durationYears = 3, isTamil = false }) {
  const curYear = startYear || new Date().getFullYear();
  const dashaTable = chart?.dashaTable || [];
  const planets = chart?.planets || [];
  const pMap = {};
  for (const p of planets) {
    pMap[p.name || p.planetName] = p;
  }

  const gochar = chart?.gocharDashboard || {};
  const jupTr = gochar.jupiterGochar || gochar.planets?.Jupiter || {};
  const satTr = gochar.saturnGochar || gochar.planets?.Saturn || {};

  const yearsData = [];

  for (let i = 0; i < durationYears; i++) {
    const yr = curYear + i;
    const targetDateStr = `${yr}-07-01`;

    // Locate active Mahadasha and Antardasha for this year
    let activeMd = chart?.currentDasha?.lord || chart?.currentDasha?.mahadasha || null;
    let activeAd = chart?.currentDasha?.currentAntar || chart?.currentDasha?.antarDasha || chart?.currentDasha?.subLord || null;
    let adEndDate = null;

    for (const md of dashaTable) {
      if (md.startDate && md.endDate && targetDateStr >= md.startDate && targetDateStr <= md.endDate) {
        activeMd = md.lord || md.mahadashaLord || activeMd;
        if (md.bukthis && md.bukthis.length) {
          for (const bk of md.bukthis) {
            if (bk.startDate && bk.endDate && targetDateStr >= bk.startDate && targetDateStr <= bk.endDate) {
              activeAd = bk.subLord || bk.lord || bk.antarLord || activeAd;
              adEndDate = bk.endDate;
              break;
            }
          }
        }
        break;
      }
    }

    if (!activeMd) activeMd = "Active_Dasha";
    if (!activeAd) activeAd = "Active_Antar";

    const mdPlanet = pMap[activeMd] || {};
    const adPlanet = pMap[activeAd] || {};

    // Domain evaluation for this year
    const careerThemeEn = (activeAd === "Sun" || activeAd === "Saturn" || activeAd === "Mars" || adPlanet.house === 10)
      ? `High occupational focus under ${activeAd} rulership; executive and leadership responsibilities activated.`
      : `Steady professional stabilization under ${activeMd}-${activeAd} period.`;
    const careerThemeTa = (activeAd === "Sun" || activeAd === "Saturn" || activeAd === "Mars" || adPlanet.house === 10)
      ? `${activeAd} பகவானின் ஆதிக்கத்தில் தொழில் உயர்வு, தலைமைப் பொறுப்புகள் மற்றும் முக்கிய நிர்வாக மாற்றங்கள்.`
      : `${activeMd}-${activeAd} காலத்தில் தொழில் நிலையில் சீரான ஸ்திரத்தன்மை.`;

    const financeThemeEn = (activeAd === "Jupiter" || activeAd === "Venus" || activeAd === "Mercury" || adPlanet.house === 2 || adPlanet.house === 11)
      ? `Accelerated liquidity and resource retention supported by benefic ${activeAd} sub-period.`
      : `Balanced economic management; structured budgeting recommended during ${activeAd} sub-period.`;
    const financeThemeTa = (activeAd === "Jupiter" || activeAd === "Venus" || activeAd === "Mercury" || adPlanet.house === 2 || adPlanet.house === 11)
      ? `சுப கிரகமான ${activeAd} அந்தர்தசையால் பணப்புழக்கம் மற்றும் பொருளாதார வளர்ச்சி அதிகரிப்பு.`
      : `திட்டமிட்ட நிதி நிர்வாகம் மற்றும் கவனமான சேமிப்பு வழிகாட்டப்படுகிறது.`;

    const marriageThemeEn = (activeAd === "Venus" || activeAd === "Jupiter" || activeAd === "Moon" || adPlanet.house === 7)
      ? `Key partnership milestone window; interpersonal harmony and alliance formation favored.`
      : `Relationship stability maintained through mutual understanding; domestic duties prominent.`;
    const marriageThemeTa = (activeAd === "Venus" || activeAd === "Jupiter" || activeAd === "Moon" || adPlanet.house === 7)
      ? `திருமணம், புதிய கூட்டு மற்றும் இல்லற சுப காரியங்களுக்கான முதன்மையான சாதகமான காலம்.`
      : `குடும்ப உறவுகளில் பரஸ்பர அனுசரிப்பு மற்றும் பொறுப்புகள் முன்னிலை வகிக்கும் காலம்.`;

    const propertyThemeEn = (activeAd === "Mars" || activeAd === "Saturn" || adPlanet.house === 4)
      ? `Strong real estate and asset acquisition indicators activated under ${activeAd} dispositorship.`
      : `Long-term asset consolidation; focus on home enhancements.`;
    const propertyThemeTa = (activeAd === "Mars" || activeAd === "Saturn" || adPlanet.house === 4)
      ? `பூமி காரகன் அல்லது 4-ம் பாவக தொடர்பால் அசையா சொத்துக்கள் வாங்குவதற்கான சாதகமான முயற்சி.`
      : `வீட்டு பராமரிப்பு மற்றும் நீண்டகால சொத்து பாதுகாப்பு திட்டமிடல்.`;

    yearsData.push({
      year: yr,
      dashaPeriod: `${activeMd} Mahadasha — ${activeAd} Antardasha`,
      dashaPeriodTa: `${activeMd} தசை — ${activeAd} புக்தி`,
      transitsEn: `Jupiter in ${jupTr.sign || "Transit Sign"} (House ${jupTr.houseFromLagna || jupTr.houseFromMoon || "-"}), Saturn in ${satTr.sign || "Transit Sign"} (House ${satTr.houseFromLagna || satTr.houseFromMoon || "-"})`,
      transitsTa: `குரு ${jupTr.signTamil || "கோச்சார ராசி"} ராசியிலும், சனி ${satTr.signTamil || "கோச்சார ராசி"} ராசியிலும் சஞ்சாரம்`,
      careerEn: careerThemeEn,
      careerTa: careerThemeTa,
      financeEn: financeThemeEn,
      financeTa: financeThemeTa,
      marriageEn: marriageThemeEn,
      marriageTa: marriageThemeTa,
      propertyEn: propertyThemeEn,
      propertyTa: propertyThemeTa,
      evidenceIds: [
        `DASHA_FACT_MD_${activeMd.toUpperCase()}`,
        `DASHA_FACT_AD_${activeAd.toUpperCase()}`,
        `TIMING_WIN_YEAR_${yr}`
      ]
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
    startYear: curYear,
    endYear: curYear + durationYears - 1,
    years: yearsData,
    narrativeEn: narrativeEn.trim(),
    narrativeTa: narrativeTa.trim(),
    evidenceIds: Array.from(new Set(allEvidenceIds))
  };
}
