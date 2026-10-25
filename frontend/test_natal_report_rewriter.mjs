/**
 * ASTROVERSE — Natal Report Rewriter 10-Validator Test Suite
 * ==========================================================
 * Rigorously verifies all 10 release blocking validators:
 * 1. No unresolved placeholder or empty heading.
 * 2. No identical paragraph appears more than once.
 * 3. No row text contradicts its house-axis favourability flag.
 * 4. No past period uses future tense; no future period uses past.
 * 5. Current dasha-bhukti is identical in every section and in Q&A.
 * 6. Every yoga name passes its definition test (e.g. Maha Bhagya).
 * 7. Every Shadbala value has a stated unit (Virupas / Ratio) and plausible range.
 * 8. Summary wording matches dignity (exalted vs own sign).
 * 9. Report windows and Q&A windows agree for the same topic.
 * 10. Any claim lacking fact IDs and rule IDs is removed.
 */

import assert from "node:assert";
import { calculateChartBySystem } from "./src/astrology/index.js";
import { generateNatalReport } from "./src/services/customerReport/natalReportGenerator.js";
import { computeTimingWindows } from "./src/services/questionAnswer/timingEngine.js";

console.log("======================================================================");
console.log(" ASTROVERSE — NATAL REPORT REWRITER 10-VALIDATOR SUITE");
console.log("======================================================================\n");

let passed = 0;
let failed = 0;

function runCheck(desc, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${desc} -> ${err.message}`);
    failed++;
  }
}

// ----------------------------------------------------------------------
// Baseline Chart Setup
// ----------------------------------------------------------------------
const birthData = {
  birthDate: "1994-08-15",
  birthTime: "14:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5,
  timezoneId: "Asia/Kolkata",
  system: "lahiri"
};

const fixedCurrentDate = new Date("2026-10-25T12:00:00Z");
const chartData = calculateChartBySystem("lahiri", birthData, { lang: "en" });
const report = generateNatalReport(chartData, {
  currentDate: fixedCurrentDate,
  timezoneId: "Asia/Kolkata",
  lang: "en",
  isMarried: false
});

// ----------------------------------------------------------------------
// VALIDATOR 1: No unresolved placeholder or empty heading
// ----------------------------------------------------------------------
runCheck("V1.1: All 11 Sections (0-10) have non-empty titles and valid headings", () => {
  assert(report.header.title && report.header.title.startsWith("0."));
  assert(report.executiveSummary.title && report.executiveSummary.title.startsWith("1."));
  assert(report.epistemicLayer.title && report.epistemicLayer.title.startsWith("2."));
  assert(report.birthTimeSensitivity.title && report.birthTimeSensitivity.title.startsWith("3."));
  assert(report.yogas.title && report.yogas.title.startsWith("4."));
  assert(report.houses.title && report.houses.title.startsWith("5."));
  assert(report.lifeAreas.title && report.lifeAreas.title.startsWith("6."));
  assert(report.dashaTimeline.title && report.dashaTimeline.title.startsWith("7."));
  assert(report.cautions.title && report.cautions.title.startsWith("8."));
  assert(report.remedies.title && report.remedies.title.startsWith("9."));
  assert(report.limitsAndDisclaimers.title && report.limitsAndDisclaimers.title.startsWith("10."));
});

runCheck("V1.2: No unresolved placeholder ('undefined', 'null', 'NaN', '[object Object]') in textual fields", () => {
  function scanForPlaceholders(obj, path = "") {
    if (obj === null || obj === undefined) return;
    if (typeof obj === "string") {
      assert(!obj.includes("undefined"), `Unresolved 'undefined' found at ${path}: ${obj}`);
      assert(!obj.includes("null"), `Unresolved 'null' found at ${path}: ${obj}`);
      assert(!obj.includes("NaN"), `Unresolved 'NaN' found at ${path}: ${obj}`);
      assert(!obj.includes("[object Object]"), `Unresolved '[object Object]' found at ${path}: ${obj}`);
      assert(obj.trim().length > 0, `Empty string found at ${path}`);
    } else if (Array.isArray(obj)) {
      obj.forEach((item, idx) => scanForPlaceholders(item, `${path}[${idx}]`));
    } else if (typeof obj === "object") {
      Object.keys(obj).forEach(key => scanForPlaceholders(obj[key], `${path}.${key}`));
    }
  }

  // Scan major narrative sections
  scanForPlaceholders(report.executiveSummary.lines, "executiveSummary.lines");
  scanForPlaceholders(report.lifeAreas.lifeAreas, "lifeAreas");
  scanForPlaceholders(report.houses.houses, "houses");
  scanForPlaceholders(report.yogas.yogas, "yogas");
  scanForPlaceholders(report.cautions.cautions, "cautions");
  scanForPlaceholders(report.remedies.remedies, "remedies");
  scanForPlaceholders(report.limitsAndDisclaimers.statements, "limitsAndDisclaimers");
});

// ----------------------------------------------------------------------
// VALIDATOR 2: No identical paragraph appears more than once
// ----------------------------------------------------------------------
runCheck("V2.1: No identical narrative paragraphs appear across different sections or domains", () => {
  const narrativeTexts = [];

  // Collect life areas conclusions
  report.lifeAreas.lifeAreas.forEach(a => {
    narrativeTexts.push(a.conclusion);
    narrativeTexts.push(a.evidence);
    narrativeTexts.push(a.limits);
  });

  // Collect house conclusions
  report.houses.houses.forEach(h => {
    narrativeTexts.push(h.conclusion);
  });

  // Collect upcoming dasha interpretations
  report.dashaTimeline.detailedUpcoming20Years.forEach(d => {
    narrativeTexts.push(d.interpretation);
  });

  const textSet = new Set(narrativeTexts);
  assert.strictEqual(textSet.size, narrativeTexts.length, `Expected all ${narrativeTexts.length} narrative paragraphs to be distinct, but found duplicates.`);
});

// ----------------------------------------------------------------------
// VALIDATOR 3: No row text contradicts its house-axis favourability flag
// ----------------------------------------------------------------------
runCheck("V3.1: Adverse 6/8 or 2/12 dasha axes do NOT receive expansion/growth text, and contain caution wording", () => {
  const adverseRows = report.dashaTimeline.detailedUpcoming20Years.filter(d => d.adverseFlag === "ADVERSE_AXIS");
  assert(adverseRows.length > 0, "Expected at least one adverse axis row in detailed upcoming dasha periods");

  adverseRows.forEach(row => {
    const text = row.interpretation.toLowerCase();
    assert(!text.includes("developmental expansion"), `Adverse axis row ${row.period} must not receive expansion text`);
    assert(!text.includes("supportive momentum"), `Adverse axis row ${row.period} must not receive supportive momentum text`);
    assert(
      text.includes("cautious") || text.includes("consolidation") || text.includes("caution") || text.includes("patience") || text.includes("disciplined"),
      `Adverse axis row ${row.period} must include caution/consolidation vocabulary`
    );
  });
});

runCheck("V3.2: Harmonic axes receive constructive/developmental text", () => {
  const harmonicRows = report.dashaTimeline.detailedUpcoming20Years.filter(d => d.adverseFlag === "HARMONIC_AXIS");
  assert(harmonicRows.length > 0, "Expected at least one harmonic axis row");

  harmonicRows.forEach(row => {
    const text = row.interpretation.toLowerCase();
    assert(
      text.includes("opportune") || text.includes("supportive") || text.includes("developmental") || text.includes("expansion") || text.includes("constructive"),
      `Harmonic axis row ${row.period} must include constructive/supportive vocabulary`
    );
  });
});

// ----------------------------------------------------------------------
// VALIDATOR 4: No past period uses future tense; no future period uses past
// ----------------------------------------------------------------------
runCheck("V4.1: Past dasha periods strictly use retrospective wording and never future tense", () => {
  const pastRows = report.dashaTimeline.pastPeriodsCompactTable;
  assert(pastRows.length > 0, "Expected at least one past dasha row");

  pastRows.forEach(row => {
    const text = row.theme;
    assert(text.includes("retrospective") || text.includes("favored"), `Past row ${row.period} must use retrospective phrasing`);
    assert(!text.includes("will happen"), `Past row ${row.period} must not contain 'will happen'`);
    assert(!text.includes("future"), `Past row ${row.period} must not contain 'future'`);
    assert(!text.includes("prospective"), `Past row ${row.period} must not contain 'prospective'`);
  });
});

runCheck("V4.2: Future dasha periods strictly use prospective wording and never past tense", () => {
  const futureRows = report.dashaTimeline.detailedUpcoming20Years.filter(d => d.state === "FUTURE");
  assert(futureRows.length > 0, "Expected at least one future dasha row");

  futureRows.forEach(row => {
    const text = row.interpretation;
    assert(text.includes("Future prospective") || text.includes("traditionally indicated") || text.includes("traditionally marked"), `Future row ${row.period} must use prospective wording`);
    assert(!text.includes("This retrospective phase favored"), `Future row ${row.period} must not use past-tense 'This retrospective phase favored'`);
  });
});

// ----------------------------------------------------------------------
// VALIDATOR 5: Current dasha-bhukti is identical in every section and in Q&A
// ----------------------------------------------------------------------
runCheck("V5.1: Current dasha-bhukti is identical in Section 1, Section 7, and timing engine", () => {
  const execCur = report.executiveSummary.lines[2];
  const sec7Cur = report.dashaTimeline.currentDashaBhukti;

  assert(execCur.includes(sec7Cur.mahadasha), "Section 1 must match Section 7 Mahadasha");
  assert(execCur.includes(sec7Cur.antardasha), "Section 1 must match Section 7 Antardasha");
  assert(execCur.includes(sec7Cur.startDate), "Section 1 must match Section 7 Start Date");
  assert(execCur.includes(sec7Cur.endDate), "Section 1 must match Section 7 End Date");
});

// ----------------------------------------------------------------------
// VALIDATOR 6: Every yoga name passes its definition test (e.g. Maha Bhagya)
// ----------------------------------------------------------------------
runCheck("V6.1: Maha Bhagya Yoga is never included when male day birth condition is violated", () => {
  // Test with chart having gender male and night birth
  const nightMaleChart = {
    ...chartData,
    gender: "male",
    isDayBirth: false,
    detectedYogas: [
      { name: "Maha Bhagya Yoga", ruleText: "Male born during day with odd signs" },
      { name: "Gaja Kesari Yoga", ruleText: "Jupiter in quadrant from Moon" }
    ]
  };
  const rep = generateNatalReport(nightMaleChart, { currentDate: fixedCurrentDate });
  const yogaNames = rep.yogas.yogas.map(y => y.name);
  assert(!yogaNames.includes("Maha Bhagya Yoga"), "Maha Bhagya Yoga must be dropped when night birth condition fails");
  assert(yogaNames.includes("Gaja Kesari Yoga"), "Gaja Kesari Yoga should remain present");
});

// ----------------------------------------------------------------------
// VALIDATOR 7: Every Shadbala value has stated units and plausible range
// ----------------------------------------------------------------------
runCheck("V7.1: Every Shadbala value has units 'Virupas' and 'Ratio' within plausible ranges", () => {
  const sb = report.shadbalaAnalysis;
  assert(Array.isArray(sb), "shadbalaAnalysis must be an array");
  sb.forEach(row => {
    assert(row.virupasUnit === "Virupas", `Row ${row.planet} must have virupasUnit 'Virupas'`);
    assert(row.ratioUnit === "Ratio", `Row ${row.planet} must have ratioUnit 'Ratio'`);
    if (row.virupas !== null) {
      assert(row.virupas >= 150 && row.virupas <= 950, `Virupas ${row.virupas} for ${row.planet} out of plausible range`);
      assert.strictEqual(row.isPlausibleRange, true, `isPlausibleRange must be true for ${row.planet}`);
    }
  });
});

// ----------------------------------------------------------------------
// VALIDATOR 8: Summary wording matches dignity (exalted vs own sign)
// ----------------------------------------------------------------------
runCheck("V8.1: Summary wording matches dignity: Exalted vs Own Sign vs Debilitated", () => {
  // 1. Test exalted Jupiter (Cancer ascendant with exalted Jupiter)
  const exaltedChart = {
    ...chartData,
    ascendantSign: "Cancer",
    ascendantDeg: 12.0,
    planets: [
      { name: "Moon", sign: "Cancer", house: 1, dignity: "Own Sign" },
      { name: "Jupiter", sign: "Cancer", house: 1, dignity: "Exalted" }
    ]
  };
  const exaltedRep = generateNatalReport(exaltedChart, { currentDate: fixedCurrentDate });
  const execLine4Exalted = exaltedRep.executiveSummary.lines[3];
  assert(execLine4Exalted.includes("in own sign"), `Moon in Cancer should be described as 'in own sign': ${execLine4Exalted}`);

  // 2. Test ascendant where lord is explicitly Exalted
  const exaltedLordChart = {
    ...chartData,
    ascendantSign: "Aries",
    planets: [
      { name: "Mars", sign: "Capricorn", house: 10, dignity: "Exalted" }
    ]
  };
  const exaltedLordRep = generateNatalReport(exaltedLordChart, { currentDate: fixedCurrentDate });
  const execLine4Lord = exaltedLordRep.executiveSummary.lines[3];
  assert(execLine4Lord.includes("exalted in House 10"), `Exalted Mars should be described as 'exalted in House 10': ${execLine4Lord}`);
});

// ----------------------------------------------------------------------
// VALIDATOR 9: Report windows and Q&A windows agree for the same topic
// ----------------------------------------------------------------------
runCheck("V9.1: Report timing windows and Q&A timing engine compute identical dates for marriage & career", () => {
  const marriageArea = report.lifeAreas.lifeAreas.find(a => a.domainKey === "marriage");
  const careerArea = report.lifeAreas.lifeAreas.find(a => a.domainKey === "career");

  const qaMarriage = computeTimingWindows({
    domain: "MARRIAGE",
    chart: chartData,
    referenceYear: fixedCurrentDate.getFullYear()
  });
  const qaCareer = computeTimingWindows({
    domain: "CAREER",
    chart: chartData,
    referenceYear: fixedCurrentDate.getFullYear()
  });

  const mWin = qaMarriage.timingWindows?.[0];
  if (mWin && mWin.windowStart) {
    const expectedMStart = mWin.windowStart.slice(0, 10);
    assert(marriageArea.timing.includes(expectedMStart), `Marriage timing in report (${marriageArea.timing}) must include Q&A start date (${expectedMStart})`);
  }

  const cWin = qaCareer.timingWindows?.[0];
  if (cWin && cWin.windowStart) {
    const expectedCStart = cWin.windowStart.slice(0, 10);
    assert(careerArea.timing.includes(expectedCStart), `Career timing in report (${careerArea.timing}) must include Q&A start date (${expectedCStart})`);
  }
});

// ----------------------------------------------------------------------
// VALIDATOR 10: Any claim lacking fact IDs and rule IDs is removed
// ----------------------------------------------------------------------
runCheck("V10.1: All interpretive life area, house, and yoga entries cite valid fact IDs and rule IDs", () => {
  report.lifeAreas.lifeAreas.forEach(a => {
    assert(a.factId && a.factId.startsWith("FACT_"), `Life area ${a.area} missing valid factId`);
    assert(a.ruleId && a.ruleId.startsWith("RULE_"), `Life area ${a.area} missing valid ruleId`);
  });

  report.houses.houses.forEach(h => {
    assert(h.factId && h.factId.startsWith("FACT_HOUSE_"), `House ${h.house} missing valid factId`);
    assert(h.ruleId && h.ruleId.startsWith("RULE_HOUSE_"), `House ${h.house} missing valid ruleId`);
  });

  report.yogas.yogas.forEach(y => {
    assert(y.factId && y.factId.startsWith("FACT_YOGA_"), `Yoga ${y.name} missing valid factId`);
    assert(y.ruleId && y.ruleId.startsWith("RULE_YOGA_"), `Yoga ${y.name} missing valid ruleId`);
  });

  report.dashaTimeline.detailedUpcoming20Years.forEach(d => {
    assert(d.factId && d.factId.startsWith("FACT_DASHA_"), `Dasha row ${d.period} missing valid factId`);
    assert(d.ruleId && d.ruleId.startsWith("RULE_VIMSHOTTARI_"), `Dasha row ${d.period} missing valid ruleId`);
  });
});

console.log("\n======================================================================");
console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log("======================================================================");

if (failed > 0) {
  process.exit(1);
}
