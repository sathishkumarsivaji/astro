import fs from 'node:fs';
import path from 'node:path';

let violations = 0;

function assertCheck(condition, description) {
  if (!condition) {
    console.error(`❌ VIOLATION: ${description}`);
    violations++;
  } else {
    console.log(`✓ PASS: ${description}`);
  }
}

console.log("=== SCANNING FOR SILENT DEFAULTS & ARCHITECTURAL INTEGRITY ===");

// 1. Check EMPTY_BIRTH_PROFILE in src/types/birthProfile.js
const birthProfileContent = fs.readFileSync('./src/types/birthProfile.js', 'utf8');
assertCheck(
  birthProfileContent.includes('timezoneId: null') && birthProfileContent.includes('utcOffset: null'),
  'EMPTY_BIRTH_PROFILE must not contain silent timezone defaults (must be null)'
);
assertCheck(
  birthProfileContent.includes('latitude: null') && birthProfileContent.includes('longitude: null'),
  'EMPTY_BIRTH_PROFILE must not contain hardcoded coordinates (must be null)'
);

// 2. Check time.js for strict timezone offset validation (-14 to +14)
const timeJsContent = fs.readFileSync('./src/astrology/astronomy/time.js', 'utf8');
assertCheck(
  timeJsContent.includes('tzOffset < -14 || tzOffset > 14'),
  'time.js must enforce strict timezone bounds (-14 to +14 hours)'
);

// 3. Check astroEngine.js resolveTimezone fallback & getVargaChartData
const astroEngineContent = fs.readFileSync('./src/services/astroEngine.js', 'utf8');
assertCheck(
  !astroEngineContent.includes('resolveTimezone(tz = 5.5'),
  'resolveTimezone in astroEngine.js must not default tz to 5.5'
);
assertCheck(
  astroEngineContent.includes('export function getVargaChartData('),
  'getVargaChartData function must be defined and exported in astroEngine.js'
);
assertCheck(
  astroEngineContent.includes('status: "INSUFFICIENT_DATA"'),
  'getVargaChartData must return INSUFFICIENT_DATA status when vargaFn or ascendantLong is invalid'
);

// 4. Check BirthRecoveryWizard.jsx does not silently inject Chennai / 5.5
const wizardContent = fs.readFileSync('./src/components/Horoscope/BirthRecoveryWizard.jsx', 'utf8');
assertCheck(
  !wizardContent.includes('utcOffset: 5.5') && !wizardContent.includes('timezoneId: "Asia/Kolkata"'),
  'BirthRecoveryWizard must not hardcode 5.5 / Asia/Kolkata fallback'
);

// 5. Check all systems in src/astrology/systems/ consume unified observations
const lahiriContent = fs.readFileSync('./src/astrology/systems/lahiri.js', 'utf8');
const ramanContent = fs.readFileSync('./src/astrology/systems/raman.js', 'utf8');
const kpContent = fs.readFileSync('./src/astrology/systems/kp.js', 'utf8');
const tropicalContent = fs.readFileSync('./src/astrology/systems/tropical.js', 'utf8');

assertCheck(
  lahiriContent.includes('observationsOrBirthData') && lahiriContent.includes('calculatePlanetaryPositions'),
  'Lahiri system must support unified observations pass-through'
);
assertCheck(
  ramanContent.includes('observationsOrBirthData') && ramanContent.includes('calculatePlanetaryPositions'),
  'Raman system must support unified observations pass-through'
);
assertCheck(
  kpContent.includes('calculateKPChart(observations'),
  'KP system must accept observations parameter'
);
assertCheck(
  tropicalContent.includes('calculateTropicalChart(observations'),
  'Tropical system must accept observations parameter'
);

// 6. Check DetailedReportModal.jsx chapters guard against cross-system leakage
const modalContent = fs.readFileSync('./src/components/Horoscope/DetailedReportModal.jsx', 'utf8');
assertCheck(
  modalContent.includes('const isChapterApplicable = (id) => systemChapterIds.has(id);'),
  'DetailedReportModal must define isChapterApplicable checking systemChapterIds'
);
assertCheck(
  modalContent.includes('isChapterApplicable("execSummary")') &&
  modalContent.includes('isChapterApplicable("blueprint")') &&
  modalContent.includes('isChapterApplicable("yogas")') &&
  modalContent.includes('isChapterApplicable("bhavas")') &&
  modalContent.includes('isChapterApplicable("multiSystemComparison")'),
  'DetailedReportModal chapters must be guarded by isChapterApplicable'
);

console.log("\n=============================================================");
if (violations > 0) {
  console.error(`FAILED: ${violations} architectural violations found.`);
  process.exit(1);
} else {
  console.log("SUCCESS: All architectural integrity and default-free checks passed!");
  process.exit(0);
}
