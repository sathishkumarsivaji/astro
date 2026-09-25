import { calculatePlanetaryPositions, calculateAshtakootaMatch } from './src/services/astroEngine.js';
import { validateBirthProfile, EMPTY_BIRTH_PROFILE, DEMO_BIRTH_PROFILE } from './src/types/birthProfile.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    passed++;
  } else {
    console.error(`FAIL: ${message}`);
    failed++;
  }
}

console.log("=== 1. BIRTH PROFILE VALIDATION TESTS ===");
const validRes = validateBirthProfile(DEMO_BIRTH_PROFILE);
assert(validRes.isValid === true, "DEMO_BIRTH_PROFILE is valid");

const emptyRes = validateBirthProfile(EMPTY_BIRTH_PROFILE);
assert(emptyRes.isValid === false, "EMPTY_BIRTH_PROFILE is invalid");
assert(emptyRes.errors.length >= 4, "EMPTY_BIRTH_PROFILE catches date, time, lat, lng, place errors");

const leapFebRes = validateBirthProfile({
  ...DEMO_BIRTH_PROFILE,
  birthDate: "2023-02-29" // Not a leap year
});
assert(leapFebRes.isValid === false, "2023-02-29 is rejected as non-leap year day");

const leapFeb2024 = validateBirthProfile({
  ...DEMO_BIRTH_PROFILE,
  birthDate: "2024-02-29" // Valid leap year
});
assert(leapFeb2024.isValid === true, "2024-02-29 is accepted as valid leap year day");

const badTime = validateBirthProfile({
  ...DEMO_BIRTH_PROFILE,
  birthTime: "24:00"
});
assert(badTime.isValid === false, "24:00 is rejected as birth time");

const badLat = validateBirthProfile({
  ...DEMO_BIRTH_PROFILE,
  latitude: 91.5
});
assert(badLat.isValid === false, "Latitude > 90 is rejected");

console.log("\n=== 2. BENCHMARK VELLORE NATAL CHART (25-Apr-1990 05:56 IST) ===");
const chart1990 = calculatePlanetaryPositions("1990-04-25", "05:56", 12.9165, 79.1325, "vedic", 5.5);

assert(chart1990 !== null && chart1990 !== undefined, "Planetary calculation succeeded");

// Ascendant in Aries
const ascLong = chart1990.ascendantLong;
const ascSign = chart1990.ascendantSign;
console.log(`Ascendant: ${ascLong.toFixed(4)} deg (${ascSign.name})`);
assert(ascSign.name === "Aries", `Lagna must be Aries (got ${ascSign.name})`);
assert(ascLong >= 9.5 && ascLong <= 10.5, `Lagna sidereal longitude should be ~9.88 deg Aries (got ${ascLong.toFixed(2)})`);

// Sun in Aries
const sun = chart1990.planets.find(p => p.name === "Sun");
console.log(`Sun: ${sun.longitude.toFixed(4)} deg (${sun.sign})`);
assert(sun.sign === "Aries", `Sun must be in Aries (got ${sun.sign})`);
assert(chart1990.panchangam.tamilMonth === "சித்திரை" || chart1990.panchangam.tamilMonth === "Chithirai", `Tamil Month should be Chithirai (got ${chart1990.panchangam.tamilMonth})`);

// Moon in Aries / Ashwini
const moon = chart1990.planets.find(p => p.name === "Moon");
console.log(`Moon: ${moon.longitude.toFixed(4)} deg (${moon.sign}), Nakshatra: ${chart1990.panchangam.nakshatra}`);
assert(moon.sign === "Aries", `Moon must be in Aries (got ${moon.sign})`);
assert(chart1990.panchangam.nakshatra.includes("Ashwini") || chart1990.panchangam.nakshatra.includes("அசுவினி"), `Moon nakshatra should be Ashwini (got ${chart1990.panchangam.nakshatra})`);

// Tamil Year: 1990-04-25 is Pramodoota (Tamil cycle year 4)
console.log(`Tamil Year: ${chart1990.panchangam.tamilYear}`);
assert(chart1990.panchangam.tamilYear.includes("பிரமோதூத") || chart1990.panchangam.tamilYear.includes("Pramodoota") || chart1990.panchangam.tamilYear.includes("Pramodhaduta"), `Tamil Year should be Pramodoota (got ${chart1990.panchangam.tamilYear})`);

console.log("\n=== 3. PRE-MESHA SANKRANTI SOLAR YEAR TEST (10-Jan-1988) ===");
// 10-Jan-1988 is before April 14, 1988. In 60-year Jovian/Tamil cycle, 1987-1988 is Prabhava (year 0).
// Vibhava starts mid-April 1988.
const chartPreMesha = calculatePlanetaryPositions("1988-01-10", "10:00", 12.9165, 79.1325, "vedic", 5.5);
console.log(`Pre-Mesha Tamil Year: ${chartPreMesha.panchangam.tamilYear}`);
assert(chartPreMesha.panchangam.tamilYear.includes("பிரபவ") || chartPreMesha.panchangam.tamilYear.includes("Prabhava"), `Pre-Mesha 1988-01-10 should retain previous Tamil year Prabhava (got ${chartPreMesha.panchangam.tamilYear})`);

console.log("\n=== 4. ASHTAKOOTA MATCHING TEST ===");
const matchResult = calculateAshtakootaMatch("Ashwini", "Bharani", "Aries", "Aries");
console.log(`Match points: ${matchResult.totalScore} / ${matchResult.maxScore} (${matchResult.percentage}%)`);
const scoreNum = parseFloat(matchResult.totalScore);
assert(!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 36, `Ashtakoota points are bounded 0-36 (got ${matchResult.totalScore})`);
assert(matchResult.kutas && matchResult.kutas.length === 8, "Ashtakoota has 8 koota categories");

console.log(`\n========================================`);
console.log(`SUMMARY: Passed: ${passed}, Failed: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
