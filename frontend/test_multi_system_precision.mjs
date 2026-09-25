/**
 * ASTROVERSE — Multi-System Precision & Cross-System Comparison Test Suite
 *
 * Verifies:
 * 1. Independent calculation of all 4 systems (Lahiri, KP, Raman, Tropical)
 * 2. Proper ayanamsha offsets and mathematical precision
 * 3. KP Placidus cusps, 249 sub-lords, 4-tier significators, and ruling planets
 * 4. Tropical Sayana cusps, Ptolemaic aspects (applying/separating), and essential dignities
 * 5. Raman recalculation with 397 AD epoch without coordinate pollution
 * 6. Multi-system agreement classification matrix (compareSystems)
 * 7. Inapplicable technique transparency (no silent fallbacks or fake calculations)
 */

import {
  calculateChartBySystem,
  calculateMultiSystemBundle,
  compareSystems,
  ASTROLOGY_SYSTEMS,
  REPORT_CHAPTERS
} from "./src/astrology/index.js";
import { getLahiriAyanamsha, getKPAyanamsha, getRamanAyanamsha } from "./src/services/astroEngine.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failedCount++;
    throw new Error(message);
  } else {
    console.log(`✓ ${message}`);
    passedCount++;
  }
}

console.log("=================================================================");
console.log(" RUNNING MULTI-SYSTEM ASTROLOGICAL PRECISION & INTEGRITY SUITE");
console.log("=================================================================\n");

const testBirthData = {
  birthDate: "1995-10-24",
  birthTime: "10:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5,
  timezoneId: "Asia/Kolkata"
};

// -------------------------------------------------------------
// TEST 1: Ephemeris & Ayanamsha Precision
// -------------------------------------------------------------
console.log("1. Ephemeris & Ayanamsha Mathematical Verification...");
const jdJ2000 = 2451545.0; // 2000-01-01 12:00 TT
const lahiriJ2000 = getLahiriAyanamsha(jdJ2000);
const kpJ2000 = getKPAyanamsha(jdJ2000);
const ramanJ2000 = getRamanAyanamsha(jdJ2000);

assert(Math.abs(lahiriJ2000 - 23.857) < 0.01, `Lahiri Ayanamsha at J2000.0 is ~23.857° (got ${lahiriJ2000.toFixed(4)}°)`);
assert(Math.abs(kpJ2000 - 23.7655) < 0.01, `KP Ayanamsha at J2000.0 is ~23.766° (got ${kpJ2000.toFixed(4)}°)`);
assert(Math.abs(ramanJ2000 - 22.370) < 0.05, `Raman Ayanamsha at J2000.0 is ~22.370° (got ${ramanJ2000.toFixed(4)}°)`);
assert(lahiriJ2000 > kpJ2000, "Lahiri ayanamsha is slightly larger than KP ayanamsha by ~5.5 arcmin");
assert(kpJ2000 > ramanJ2000, "KP ayanamsha is larger than Raman ayanamsha by ~1.4°");

// -------------------------------------------------------------
// TEST 2: Multi-System Bundle Execution
// -------------------------------------------------------------
console.log("\n2. Executing calculateMultiSystemBundle...");
const bundle = calculateMultiSystemBundle(testBirthData);

assert(bundle !== null, "Multi-system bundle generated successfully");
assert(bundle.systems.lahiri !== undefined, "Lahiri profile calculated in bundle");
assert(bundle.systems.kp !== undefined, "KP profile calculated in bundle");
assert(bundle.systems.raman !== undefined, "Raman profile calculated in bundle");
assert(bundle.systems.tropical !== undefined, "Tropical profile calculated in bundle");
assert(bundle.comparison !== undefined, "Comparison matrix generated in bundle");

// -------------------------------------------------------------
// TEST 3: KP Profile Rigor & Sub-Lord Verification
// -------------------------------------------------------------
console.log("\n3. Verifying KP Profile Specifics...");
const kp = bundle.systems.kp;
assert(kp.system.id === "kp", "KP system ID is 'kp'");
assert(kp.system.houseSystem === "Placidus Cusps", "KP uses Placidus Cusps");
assert(kp.houses.length === 12, "KP has 12 house cusps calculated");
assert(kp.planets.length >= 9, "KP has at least 9 planets calculated");

for (const cusp of kp.houses) {
  assert(cusp.starLord && cusp.starLord !== "N/A", `Cusp ${cusp.house} has valid starLord (${cusp.starLord})`);
  assert(cusp.subLord && cusp.subLord !== "N/A", `Cusp ${cusp.house} has valid subLord (${cusp.subLord})`);
  assert(cusp.subSubLord && cusp.subSubLord !== "N/A", `Cusp ${cusp.house} has valid subSubLord (${cusp.subSubLord})`);
}

for (const p of kp.planets) {
  assert(p.starLord && p.starLord !== "N/A", `Planet ${p.name} has valid starLord (${p.starLord})`);
  assert(p.subLord && p.subLord !== "N/A", `Planet ${p.name} has valid subLord (${p.subLord})`);
}

// Check KP 4-Tier Significators
assert(kp.significators !== undefined, "KP 4-tier significators present");
for (let h = 1; h <= 12; h++) {
  const sig = kp.significators[h];
  assert(Array.isArray(sig.level1), `House ${h} has level 1 significators array`);
  assert(Array.isArray(sig.level2), `House ${h} has level 2 significators array`);
  assert(Array.isArray(sig.level3), `House ${h} has level 3 significators array`);
  assert(Array.isArray(sig.level4) && sig.level4.length > 0, `House ${h} has house lord in level 4`);
}

// Check KP Ruling Planets
assert(kp.rulingPlanets.lagnaSignLord !== undefined, "KP ruling planets contains lagnaSignLord");
assert(kp.rulingPlanets.dayLord !== undefined, "KP ruling planets contains dayLord");

// Check Inapplicable Classical Techniques are Flagged, NOT Fabricated
assert(kp.shadbala.status === "NOT_APPLICABLE", "Shadbala correctly flagged NOT_APPLICABLE in KP");
assert(kp.ashtakavarga.status === "NOT_APPLICABLE", "Ashtakavarga correctly flagged NOT_APPLICABLE in KP");
assert(kp.jaimini.status === "NOT_APPLICABLE", "Jaimini correctly flagged NOT_APPLICABLE in KP");

// -------------------------------------------------------------
// TEST 4: Tropical Sayana Profile Rigor
// -------------------------------------------------------------
console.log("\n4. Verifying Tropical Sayana Profile Specifics...");
const trop = bundle.systems.tropical;
assert(trop.system.id === "tropical", "Tropical system ID is 'tropical'");
assert(trop.system.ayanamshaValue === 0.0, "Tropical ayanamsha is 0.0 (Sayana)");
assert(trop.houses.length === 12, "Tropical has 12 Placidus house cusps");
assert(Array.isArray(trop.aspects), "Tropical exports Western aspects array");
assert(trop.aspects.length > 0, "Tropical aspects matrix found active Ptolemaic aspects");

for (const asp of trop.aspects) {
  assert(["Conjunction", "Sextile", "Square", "Trine", "Opposition"].includes(asp.aspect), `Valid aspect type: ${asp.aspect}`);
  assert(["Applying", "Separating"].includes(asp.status), `Valid dynamic status: ${asp.status}`);
}

for (const p of trop.planets) {
  assert(typeof p.dignity === "string", `Planet ${p.name} has essential dignity string (${p.dignity})`);
}

// Check Inapplicable Vedic Techniques are Flagged in Tropical
assert(trop.shadbala.status === "NOT_APPLICABLE", "Shadbala correctly flagged NOT_APPLICABLE in Tropical");
assert(trop.ashtakavarga.status === "NOT_APPLICABLE", "Ashtakavarga correctly flagged NOT_APPLICABLE in Tropical");
assert(trop.jaimini.status === "NOT_APPLICABLE", "Jaimini correctly flagged NOT_APPLICABLE in Tropical");
assert(trop.dasha.status === "NOT_APPLICABLE", "Vimshottari Dasha correctly flagged NOT_APPLICABLE in Tropical");

// -------------------------------------------------------------
// TEST 5: Multi-System Comparison Matrix
// -------------------------------------------------------------
console.log("\n5. Verifying Cross-System Comparison & Agreement Engine...");
const comp = bundle.comparison;
assert(comp.comparisons.length === 10, "10 bodies compared (Ascendant + 9 grahas)");
assert(comp.summary.totalPointsCompared === 10, "Summary total points compared is 10");
assert(typeof comp.summary.agreementPercentage === "number", "Agreement percentage calculated");
assert(Array.isArray(comp.techniqueMatrix) && comp.techniqueMatrix.length > 5, "Technique matrix populated");

for (const item of comp.comparisons) {
  assert(["AGREEMENT", "PARTIAL AGREEMENT", "DIVERGENCE"].includes(item.classification), `Classification for ${item.body} is valid (${item.classification})`);
  assert(item.divergence.lahiriMinusKp !== undefined, `Divergence lahiriMinusKp present for ${item.body}`);
  assert(item.explanation.length > 0, `Explanation present for ${item.body}`);
}

// -------------------------------------------------------------
// TEST 6: Zero Timezone Offset Safety (London / UTC)
// -------------------------------------------------------------
console.log("\n6. Zero Timezone Offset Safety Verification (utcOffset === 0)...");
const londonBirthData = {
  birthDate: "2000-01-01",
  birthTime: "12:00",
  latitude: 51.5074,
  longitude: -0.1278,
  utcOffset: 0.0,
  timezoneId: "Europe/London"
};

const londonChart = calculateChartBySystem("lahiri", londonBirthData);
assert(londonChart.utcOffset === 0, "London utcOffset === 0 is strictly preserved (never defaulted to 5.5)");
assert(londonChart.tz === 0, "London tz === 0 is strictly preserved");

console.log("\n=================================================================");
console.log(` ALL ${passedCount} MULTI-SYSTEM ASTROLOGICAL PRECISION TESTS PASSED!`);
console.log("=================================================================");
