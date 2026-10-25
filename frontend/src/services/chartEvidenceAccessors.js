/**
 * SKR ASTRO — Chart Evidence Accessors
 * =====================================
 * Shared accessors for divisional charts (D9, D10), KP data, Dasha,
 * and timing windows. Extracted to break circular dependency between
 * followUpAnswerService.js and evidenceRetriever.js.
 */

/**
 * Unified helper to retrieve D9 Navamsha data from context
 */
export function getD9Data(context) {
  if (!context) return { available: false, ascendant: null, navamshaLagna: null, planets: [] };
  const chart = context.chart || (context.planets ? context : null);
  if (!chart) return { available: false, ascendant: null, navamshaLagna: null, planets: [] };
  const raw = chart.vargas?.D9 || chart.vargas?.d9 || chart.divisionalCharts?.D9 || chart.divisionalCharts?.d9Navamsha || context.report?.activeSectionData?.d9Chart || null;
  if (!raw) return { available: false, ascendant: null, navamshaLagna: null, planets: [] };
  const asc = raw.ascendant?.signName || raw.ascendant?.sign || raw.ascendant?.name || (typeof raw.ascendant === "string" ? raw.ascendant : null);
  const planets = (raw.planets || []).map(p => ({
    name: p.planetName || p.name,
    sign: p.signName || p.sign,
    house: p.house || p.vargaHouse,
    dignity: p.dignity
  }));
  return { available: true, ascendant: asc, navamshaLagna: asc, planets };
}

/**
 * Unified helper to retrieve D10 Dashamsha data from context
 */
export function getD10Data(context) {
  if (!context) return { available: false, ascendant: null, dashamshaLagna: null, planets: [] };
  const chart = context.chart || (context.planets ? context : null);
  if (!chart) return { available: false, ascendant: null, dashamshaLagna: null, planets: [] };
  const raw = chart.vargas?.D10 || chart.vargas?.d10 || chart.divisionalCharts?.D10 || chart.divisionalCharts?.d10Dasamsha || context.report?.activeSectionData?.d10Chart || null;
  if (!raw) return { available: false, ascendant: null, dashamshaLagna: null, planets: [] };
  const asc = raw.ascendant?.signName || raw.ascendant?.sign || raw.ascendant?.name || (typeof raw.ascendant === "string" ? raw.ascendant : null);
  const planets = (raw.planets || []).map(p => ({
    name: p.planetName || p.name,
    sign: p.signName || p.sign,
    house: p.house || p.vargaHouse,
    dignity: p.dignity
  }));
  return { available: true, ascendant: asc, dashamshaLagna: asc, planets };
}

/**
 * Unified helper to retrieve KP cusps and sub-lords data from context
 */
export function getKPData(context) {
  if (!context || !context.chart) return { cusps: [], subLords: {}, significators: null, rulingPlanets: null };
  return {
    cusps: context.chart.kpCusps || [],
    subLords: context.chart.kpSubLords || {},
    significators: context.chart.kpSignificators || null,
    rulingPlanets: context.chart.kpRulingPlanets || null
  };
}

/**
 * Unified helper to retrieve current Dasha data from context
 */
export function getDashaData(context) {
  if (!context) return null;
  const chart = context.chart || (context.planets ? context : null);
  if (!chart) return null;
  return chart.currentDasha || null;
}

/**
 * Unified helper to retrieve all timing windows from context
 */
export function getTimingWindows(context) {
  if (!context || !context.report) return [];
  const windows = [];
  const addWins = (arr, domain) => {
    (arr || []).forEach(w => {
      if (w.years || w.ageRange || w.calendarYears) {
        windows.push({
          domain,
          years: w.years || w.calendarYears || null,
          ageRange: w.ageRange || null,
          title: w.title || null,
          nature: w.nature || w.theme || null
        });
      }
    });
  };
  addWins(context.report.career?.windows, "career");
  addWins(context.report.activeSectionData?.careerWindows, "career");
  addWins(context.report.marriage?.windows, "marriage");
  addWins(context.report.activeSectionData?.marriageWindows, "marriage");
  addWins(context.report.wealth?.windows, "property");
  addWins(context.report.activeSectionData?.acquisitionWindows, "property");
  addWins(context.report.activeSectionData?.examWindows, "studies");
  addWins(context.report.wellness?.risks, "health");
  addWins(context.report.activeSectionData?.riskWindows, "health");
  return windows;
}
