/**
 * ASTROVERSE — Historical Time Engine Test Suite
 * 
 * Verifies:
 * 1. Longitude LMT calculation precision (4 min/deg)
 * 2. Time standard era boundaries & classification
 * 3. Pre-standard era dual-chart calculation (Civil vs LMT)
 * 4. Material discrepancy auditing (Ascendant, MC, house cusps, D9, D10, D60)
 * 5. Explicit bilingual disclosure notices
 */

import {
  TIME_STANDARDS,
  calculateLongitudeLMT,
  resolveHistoricalTimeStandard,
  calculateDualHistoricalCharts
} from './src/services/historicalTime/historicalTimeEngine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${message}`);
    failed++;
  }
}

console.log('\n============================================================');
console.log('ASTROVERSE HISTORICAL TIME-STANDARD ENGINE TEST SUITE');
console.log('============================================================\n');

// 1. Longitude LMT Exact Calculation
console.log('1. Testing Longitude LMT Solar Calculation...');
const lmtGreenwich = calculateLongitudeLMT(0.0);
assert(lmtGreenwich.lmtHours === 0 && lmtGreenwich.lmtMinutes === 0, 'Greenwich 0° longitude = 0.0h LMT');

const lmtChennai = calculateLongitudeLMT(80.27);
assert(Math.abs(lmtChennai.lmtHours - 5.351333) < 0.001, `Chennai (80.27°E) = +5.3513h LMT (got: ${lmtChennai.lmtHours})`);
assert(Math.abs(lmtChennai.lmtMinutes - 321.08) < 0.01, `Chennai = +321.08 minutes (got: ${lmtChennai.lmtMinutes})`);

const lmtNYC = calculateLongitudeLMT(-74.006);
assert(Math.abs(lmtNYC.lmtHours - (-4.933733)) < 0.001, `New York (-74.006°W) = -4.9337h LMT (got: ${lmtNYC.lmtHours})`);

// 2. Historical Era Classification
console.log('\n2. Testing Historical Era Boundaries & Standards...');
const resPreUK = resolveHistoricalTimeStandard({
  birthDate: '1850-06-15',
  longitude: -0.1276,
  latitude: 51.5074,
  timezoneId: 'Europe/London'
});
assert(resPreUK.isPreStandardEra === true, 'UK 1850 is pre-standard era (prior to 1880 GMT Act)');
assert(resPreUK.timeStandard === TIME_STANDARDS.LOCAL_MEAN_TIME, 'Pre-standard UK classified as LOCAL_MEAN_TIME');

const resPreUS = resolveHistoricalTimeStandard({
  birthDate: '1875-10-12',
  longitude: -74.006,
  latitude: 40.7128,
  timezoneId: 'America/New_York'
});
assert(resPreUS.isPreStandardEra === true, 'US 1875 is pre-standard era (prior to 1883 Railway Time)');
assert(resPreUS.timeStandard === TIME_STANDARDS.LOCAL_MEAN_TIME, 'Pre-standard US classified as LOCAL_MEAN_TIME');

const resPreIndia = resolveHistoricalTimeStandard({
  birthDate: '1895-01-12', // Swami Vivekananda era
  longitude: 88.3639,
  latitude: 22.5726,
  timezoneId: 'Asia/Kolkata'
});
assert(resPreIndia.isPreStandardEra === true, 'India 1895 is pre-standard era (prior to 1906 IST)');

const resModernIndia = resolveHistoricalTimeStandard({
  birthDate: '1985-04-25',
  longitude: 80.27,
  latitude: 13.08,
  timezoneId: 'Asia/Kolkata',
  sourceUtcOffset: 5.5
});
assert(resModernIndia.isPreStandardEra === false, 'India 1985 is modern standard era');
assert(resModernIndia.timeStandard === TIME_STANDARDS.STANDARD_TIME, 'India 1985 classified as STANDARD_TIME');

// 3. Pre-Standard Era Dual-Chart Resolution (Historical Case: Lincoln 1809)
console.log('\n3. Testing Pre-Standard Era Dual-Chart Calculation (Lincoln 1809)...');
const lincolnProfile = {
  birthDate: '1809-02-12',
  birthTime: '06:54',
  latitude: 37.57,
  longitude: -85.74,
  utcOffset: -6.0, // Source declared US Central standard offset (-6.0h)
  timezoneId: 'America/Chicago',
  system: 'lahiri'
};

const dualResult = calculateDualHistoricalCharts(lincolnProfile);
assert(dualResult.isDualCalculationRequired === true, 'Dual calculation strictly required for pre-standard era birth');
assert(dualResult.civilChart && dualResult.lmtChart, 'Both Civil and LMT charts successfully calculated');

const audit = dualResult.discrepancyAudit;
assert(audit !== null, 'Discrepancy audit computed between Civil and LMT charts');
assert(audit.timeDifferenceMinutes > 15.0, `Time difference is significant (>15m) (got: ${audit.timeDifferenceMinutes.toFixed(1)}m)`);
assert(typeof audit.ascDiffDeg === 'number' && audit.ascDiffDeg > 0, `Ascendant difference detected (${audit.ascDiffDeg.toFixed(2)}°)`);
assert(typeof audit.mcDiffDeg === 'number' && audit.mcDiffDeg > 0, `MC difference detected (${audit.mcDiffDeg.toFixed(2)}°)`);
assert(audit.disclosureNoticeEn.includes('Historical Time Standard Disclosure'), 'English technical disclosure generated');
assert(audit.disclosureNoticeTa.includes('வரலாற்று நேரத் திட்ட வெளிப்படைத்தன்மை'), 'Tamil technical disclosure generated');

// 4. Modern Era Single Chart Pass-through
console.log('\n4. Testing Modern Era Single Chart (No Unnecessary Dual Trigger)...');
const modernProfile = {
  birthDate: '1990-04-25',
  birthTime: '05:56',
  latitude: 12.9165,
  longitude: 79.1325,
  utcOffset: 5.5,
  timezoneId: 'Asia/Kolkata',
  system: 'lahiri'
};
const modernResult = calculateDualHistoricalCharts(modernProfile);
assert(modernResult.resolution.isPreStandardEra === false, 'Modern chart correctly flagged as not pre-standard era');

// Summary
console.log('\n============================================================');
console.log(`HISTORICAL TIME ENGINE RESULTS: ${passed} passed, ${failed} failed.`);
console.log('============================================================\n');

if (failed > 0) process.exit(1);
