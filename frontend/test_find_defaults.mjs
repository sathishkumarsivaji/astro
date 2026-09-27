import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolveSrc = (p) => path.resolve(__dirname, p);

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
const birthProfileContent = fs.readFileSync(resolveSrc('./src/types/birthProfile.js'), 'utf8');
assertCheck(
  birthProfileContent.includes('timezoneId: null') && birthProfileContent.includes('utcOffset: null'),
  'EMPTY_BIRTH_PROFILE must not contain silent timezone defaults (must be null)'
);
assertCheck(
  birthProfileContent.includes('latitude: null') && birthProfileContent.includes('longitude: null'),
  'EMPTY_BIRTH_PROFILE must not contain hardcoded coordinates (must be null)'
);

// 2. Check time.js for strict timezone offset validation (-14 to +14)
const timeJsContent = fs.readFileSync(resolveSrc('./src/astrology/astronomy/time.js'), 'utf8');
assertCheck(
  timeJsContent.includes('tzOffset < -14 || tzOffset > 14'),
  'time.js must enforce strict timezone bounds (-14 to +14 hours)'
);

// 3. Check astroEngine.js resolveTimezone fallback & getVargaChartData
const astroEngineContent = fs.readFileSync(resolveSrc('./src/services/astroEngine.js'), 'utf8');
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
const wizardContent = fs.readFileSync(resolveSrc('./src/components/Horoscope/BirthRecoveryWizard.jsx'), 'utf8');
assertCheck(
  !wizardContent.includes('utcOffset: 5.5') && !wizardContent.includes('timezoneId: "Asia/Kolkata"'),
  'BirthRecoveryWizard must not hardcode 5.5 / Asia/Kolkata fallback'
);

// 5. Check all systems in src/astrology/systems/ consume unified observations
const lahiriContent = fs.readFileSync(resolveSrc('./src/astrology/systems/lahiri.js'), 'utf8');
const ramanContent = fs.readFileSync(resolveSrc('./src/astrology/systems/raman.js'), 'utf8');
const kpContent = fs.readFileSync(resolveSrc('./src/astrology/systems/kp.js'), 'utf8');
const tropicalContent = fs.readFileSync(resolveSrc('./src/astrology/systems/tropical.js'), 'utf8');

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
const modalContent = fs.readFileSync(resolveSrc('./src/components/Horoscope/DetailedReportModal.jsx'), 'utf8');
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

// 7. Full-Tree Automated Recursive Scanner for Forbidden Silent Defaults
console.log("\n--- Full-Tree Source File Scan for Forbidden Fallback Patterns ---");

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

const allSourceFiles = getAllFiles(resolveSrc('./src'));
let forbidden55Matches = [];
let forbiddenAsiaKolkataFallbacks = [];

const FORBIDDEN_55_REGEX = /\?\?\s*5\.5|\|\|\s*5\.5/;
const FORBIDDEN_AK_FALLBACK_REGEX = /\?\?\s*['"]Asia\/Kolkata['"]|\|\|\s*['"]Asia\/Kolkata['"]/;

for (const filePath of allSourceFiles) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');
  
  lines.forEach((line, idx) => {
    if (FORBIDDEN_55_REGEX.test(line)) {
      forbidden55Matches.push(`${filePath}:${idx + 1}: ${line.trim()}`);
    }
    if (FORBIDDEN_AK_FALLBACK_REGEX.test(line)) {
      forbiddenAsiaKolkataFallbacks.push(`${filePath}:${idx + 1}: ${line.trim()}`);
    }
  });
}

assertCheck(
  forbidden55Matches.length === 0,
  `Zero forbidden '?? 5.5' or '|| 5.5' defaults in src/ (Found ${forbidden55Matches.length}: ${forbidden55Matches.join('; ')})`
);

assertCheck(
  forbiddenAsiaKolkataFallbacks.length === 0,
  `Zero forbidden '?? "Asia/Kolkata"' or '|| "Asia/Kolkata"' defaults in src/ (Found ${forbiddenAsiaKolkataFallbacks.length})`
);

console.log(`\nScanned ${allSourceFiles.length} source files across src/ tree.`);
console.log("=============================================================");
if (violations > 0) {
  console.error(`FAILED: ${violations} architectural violations found.`);
  process.exit(1);
} else {
  console.log("SUCCESS: All architectural integrity and default-free checks passed!");
  process.exit(0);
}
