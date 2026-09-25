/**
 * ASTROVERSE — Independent Ephemeris Reference & Multi-Epoch Verification Suite
 *
 * Validates astronomical precision and cross-system isolation across:
 * 1. Multi-epoch reference calculations (1900 to 2050)
 * 2. 5 Golden global geographic benchmark charts (IST, GMT/BST, EDT/EST, Southern Hemisphere, Polar)
 * 3. Exact boundary condition transitions (Sign, Nakshatra, Pada, D9, D60, KP Sub)
 * 4. Multi-system calculation independence & isolation
 */

import {
  getLahiriAyanamsha,
  getKPAyanamsha,
  getRamanAyanamsha,
  getAyanamshaForSystem,
  getJulianDateFromUtc,
  calculatePlanetaryPositions,
  calculateD60
} from "./src/services/astroEngine.js";

import {
  calculateChartBySystem,
  calculateMultiSystemBundle
} from "./src/astrology/index.js";

import {
  getNakshatraAndPada,
  getKPSubLord
} from "./src/astrology/derived/nakshatra.js";

import { calculatePlacidusCusps } from "./src/astrology/astronomy/coordinates.js";
import { signedAngularDifference } from "./src/astrology/comparison/compareSystems.js";

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  passedCount++;
  console.log(`✓ ${message}`);
}

console.log("=================================================================");
console.log(" RUNNING INDEPENDENT EPHEMERIS REFERENCE & MULTI-EPOCH SUITE");
console.log("=================================================================\n");

// ---------------------------------------------------------------------------
// 1. MULTI-EPOCH AYANAMSHA PRECISION (1900, 1950, 2000, 2024, 2050)
// ---------------------------------------------------------------------------
console.log("1. Multi-Epoch Ayanamsha Progression & Monotonicity Verification...");
const epochs = [
  { year: 1900, jd: 2415020.5 },
  { year: 1950, jd: 2433282.5 },
  { year: 2000, jd: 2451545.0 }, // J2000.0
  { year: 2024, jd: 2460310.5 },
  { year: 2050, jd: 2469807.5 }
];

let prevLahiri = 0;
let prevKp = 0;
let prevRaman = 0;

epochs.forEach(({ year, jd }, idx) => {
  const lahiri = getLahiriAyanamsha(jd);
  const kp = getKPAyanamsha(jd);
  const raman = getRamanAyanamsha(jd);
  const tropical = getAyanamshaForSystem(jd, "tropical");

  // Tropical is always strictly 0.0
  assert(tropical === 0.0, `Epoch ${year}: Tropical ayanamsha is strictly 0.0000°`);

  // Canonical ordering invariant: Lahiri > KP > Raman in modern epoch
  assert(lahiri > kp, `Epoch ${year}: Lahiri (${lahiri.toFixed(4)}°) > KP (${kp.toFixed(4)}°)`);
  assert(kp > raman, `Epoch ${year}: KP (${kp.toFixed(4)}°) > Raman (${raman.toFixed(4)}°)`);

  // Monotonic increase over time due to axial precession
  if (idx > 0) {
    assert(lahiri > prevLahiri, `Lahiri increases monotonically (${prevLahiri.toFixed(4)}° -> ${lahiri.toFixed(4)}°)`);
    assert(kp > prevKp, `KP increases monotonically (${prevKp.toFixed(4)}° -> ${kp.toFixed(4)}°)`);
    assert(raman > prevRaman, `Raman increases monotonically (${prevRaman.toFixed(4)}° -> ${raman.toFixed(4)}°)`);

    // Verify annual precession rate is in realistic astronomical range (~50.2" - 50.3" / yr = ~0.0139° / yr)
    const yearDiff = year - epochs[idx - 1].year;
    const lahiriRatePerYear = (lahiri - prevLahiri) / yearDiff;
    const kpRatePerYear = (kp - prevKp) / yearDiff;
    const ramanRatePerYear = (raman - prevRaman) / yearDiff;

    assert(lahiriRatePerYear >= 0.0138 && lahiriRatePerYear <= 0.0141, `Epoch ${year}: Lahiri annual rate ${lahiriRatePerYear.toFixed(6)}°/yr is accurate`);
    assert(kpRatePerYear >= 0.0138 && kpRatePerYear <= 0.0141, `Epoch ${year}: KP annual rate ${kpRatePerYear.toFixed(6)}°/yr is accurate`);
    assert(ramanRatePerYear >= 0.0138 && ramanRatePerYear <= 0.0141, `Epoch ${year}: Raman annual rate ${ramanRatePerYear.toFixed(6)}°/yr is accurate`);
  }

  prevLahiri = lahiri;
  prevKp = kp;
  prevRaman = raman;
});

// ---------------------------------------------------------------------------
// 2. FIVE GLOBAL GEOGRAPHIC BENCHMARK CHARTS
// ---------------------------------------------------------------------------
console.log("\n2. Global Geographic Benchmark Chart Verification...");

const benchmarks = [
  {
    name: "Golden Chart 1: India (Chennai, IST +5.5)",
    data: {
      birthDate: "1994-08-15",
      birthTime: "06:30",
      latitude: 13.0827,
      longitude: 80.2707,
      utcOffset: 5.5,
      timezoneId: "Asia/Kolkata"
    }
  },
  {
    name: "Golden Chart 2: UK (London, Greenwich / UTC 0.0)",
    data: {
      birthDate: "2000-01-01",
      birthTime: "12:00",
      latitude: 51.5074,
      longitude: -0.1278,
      utcOffset: 0.0,
      timezoneId: "Europe/London"
    }
  },
  {
    name: "Golden Chart 3: USA (New York, Summer EDT -4.0)",
    data: {
      birthDate: "1985-07-04",
      birthTime: "18:45",
      latitude: 40.7128,
      longitude: -74.0060,
      utcOffset: -4.0,
      timezoneId: "America/New_York"
    }
  },
  {
    name: "Golden Chart 4: Southern Hemisphere (Sydney, Australia +10.0)",
    data: {
      birthDate: "2010-06-21",
      birthTime: "08:15",
      latitude: -33.8688,
      longitude: 151.2093,
      utcOffset: 10.0,
      timezoneId: "Australia/Sydney"
    }
  },
  {
    name: "Golden Chart 5: Arctic Polar Circle (Tromsø, Norway 69.65°N - Placidus Fallback)",
    data: {
      birthDate: "2005-12-25",
      birthTime: "14:00",
      latitude: 69.6492,
      longitude: 18.9553,
      utcOffset: 1.0,
      timezoneId: "Europe/Oslo"
    }
  }
];

benchmarks.forEach((bm) => {
  console.log(`\nEvaluating ${bm.name}...`);
  const bundle = calculateMultiSystemBundle(bm.data);

  assert(bundle !== null, `${bm.name}: Multi-system bundle calculated successfully`);
  assert(bundle.systems.lahiri !== undefined, `${bm.name}: Lahiri chart generated`);
  assert(bundle.systems.kp !== undefined, `${bm.name}: KP chart generated`);
  assert(bundle.systems.raman !== undefined, `${bm.name}: Raman chart generated`);
  assert(bundle.systems.tropical !== undefined, `${bm.name}: Tropical chart generated`);

  // Check UTC offset preservation
  assert(bundle.systems.lahiri.utcOffset === bm.data.utcOffset || bundle.systems.lahiri.tz === bm.data.utcOffset, `${bm.name}: UTC offset preserved in Lahiri`);

  // Check 9 Grahas present in all systems
  const planetList = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  planetList.forEach(pName => {
    const lP = bundle.systems.lahiri.planets.find(p => p.name === pName);
    const kP = bundle.systems.kp.planets.find(p => p.name === pName);
    const rP = bundle.systems.raman.planets.find(p => p.name === pName);
    const tP = bundle.systems.tropical.planets.find(p => p.name === pName);

    assert(lP !== undefined, `${bm.name}: Lahiri has ${pName}`);
    assert(kP !== undefined, `${bm.name}: KP has ${pName}`);
    assert(rP !== undefined, `${bm.name}: Raman has ${pName}`);
    assert(tP !== undefined, `${bm.name}: Tropical has ${pName}`);

    // Invariant: Tropical longitude > Lahiri longitude (by ~23-24°)
    const lLong = lP.long ?? lP.longitude;
    const tLong = tP.longitude;
    let tropLahiriDiff = tLong - lLong;
    if (tropLahiriDiff < 0) tropLahiriDiff += 360;
    assert(tropLahiriDiff >= 20.0 && tropLahiriDiff <= 26.0, `${bm.name}: Tropical - Lahiri shift for ${pName} is ~${tropLahiriDiff.toFixed(2)}° (astronomically sound)`);
  });

  // Verify Polar Fallback in Tromsø
  if (bm.data.latitude > 66.0) {
    assert(bundle.systems.kp.system.houseSystem.includes("Polar Fallback"), `${bm.name}: KP correctly activated Polar Fallback for Placidus`);
  }
});

// ---------------------------------------------------------------------------
// 3. BOUNDARY CONDITION TESTS
// ---------------------------------------------------------------------------
console.log("\n3. Testing Astronomical Boundary Conditions...");

// 3.1 Sign Boundary: 29°59'59.9" vs 30°00'00.1" (Pisces to Aries)
const piscesEdge = 359.9999;
const ariesEdge = 0.0001;
const nakPisces = getNakshatraAndPada(piscesEdge);
const nakAries = getNakshatraAndPada(ariesEdge);

assert(nakPisces.nakshatraName === "Revati", `359.9999° is Revati (got ${nakPisces.nakshatraName})`);
assert(nakPisces.pada === 4, `359.9999° is Pada 4 (got ${nakPisces.pada})`);
assert(nakAries.nakshatraName === "Ashwini", `0.0001° is Ashwini (got ${nakAries.nakshatraName})`);
assert(nakAries.pada === 1, `0.0001° is Pada 1 (got ${nakAries.pada})`);

// 3.2 Nakshatra Boundary: 13°19'59" (Ashwini Pada 4) vs 13°20'01" (Bharani Pada 1)
const ashwiniEdge = 13.3330; // 13° 19' 58.8"
const bharaniEdge = 13.3336; // 13° 20' 01.0"
const nakAshEnd = getNakshatraAndPada(ashwiniEdge);
const nakBhaStart = getNakshatraAndPada(bharaniEdge);

assert(nakAshEnd.nakshatraName === "Ashwini" && nakAshEnd.pada === 4, `13.3330° is Ashwini Pada 4 (got ${nakAshEnd.nakshatraName} P${nakAshEnd.pada})`);
assert(nakBhaStart.nakshatraName === "Bharani" && nakBhaStart.pada === 1, `13.3336° is Bharani Pada 1 (got ${nakBhaStart.nakshatraName} P${nakBhaStart.pada})`);

// 3.3 Pada Boundary: 3°19'59" (Pada 1) vs 3°20'01" (Pada 2)
const pada1Edge = 3.3330;
const pada2Edge = 3.3336;
const p1Res = getNakshatraAndPada(pada1Edge);
const p2Res = getNakshatraAndPada(pada2Edge);

assert(p1Res.pada === 1, `3.3330° is Pada 1 (got Pada ${p1Res.pada})`);
assert(p2Res.pada === 2, `3.3336° is Pada 2 (got Pada ${p2Res.pada})`);

// 3.4 KP Sub-Lord Boundary Transitions
const sub1 = getKPSubLord(0.0001);  // Very beginning of Ketu star (Ketu sub)
const sub2 = getKPSubLord(0.8000);  // Shifted into Venus sub
assert(sub1.starLord === "Ketu" && sub1.subLord === "Ketu", `0.0001° KP is Ketu-Ketu (got ${sub1.starLord}-${sub1.subLord})`);
assert(sub2.starLord === "Ketu" && sub2.subLord === "Venus", `0.8000° KP is Ketu-Venus (got ${sub2.starLord}-${sub2.subLord})`);

// 3.5 Shashtiamsha (D60) 0°30' (0.5°) Boundary
const d60_1 = calculateD60(0.49); // First D60 (0°00' - 0°30')
const d60_2 = calculateD60(0.51); // Second D60 (0°30' - 1°00')
assert(d60_1.index === 0, `0.49° is D60 index 0 (Ghoraji) (got ${d60_1.index})`);
assert(d60_2.index === 1, `0.51° is D60 index 1 (Rakshasa) (got ${d60_2.index})`);

// ---------------------------------------------------------------------------
// 4. CROSS-SYSTEM ISOLATION & PURITY INVARIANTS
// ---------------------------------------------------------------------------
console.log("\n4. Testing Cross-System Independence & Isolation Invariants...");

const testBirth = {
  birthDate: "1990-10-24",
  birthTime: "14:15",
  latitude: 28.6139,
  longitude: 77.2090,
  utcOffset: 5.5,
  timezoneId: "Asia/Kolkata"
};

const lahiriSolo = calculateChartBySystem("lahiri", testBirth);
const kpSolo = calculateChartBySystem("kp", testBirth);
const ramanSolo = calculateChartBySystem("raman", testBirth);
const tropicalSolo = calculateChartBySystem("tropical", testBirth);

// Isolation Invariant 1: Lahiri must never leak into KP planetary longitudes
const lahiriSun = lahiriSolo.planets.find(p => p.name === "Sun").longitude ?? lahiriSolo.planets.find(p => p.name === "Sun").long;
const kpSun = kpSolo.planets.find(p => p.name === "Sun").longitude;
const ramanSun = ramanSolo.planets.find(p => p.name === "Sun").longitude ?? ramanSolo.planets.find(p => p.name === "Sun").long;
const tropicalSun = tropicalSolo.planets.find(p => p.name === "Sun").longitude;

assert(Math.abs(lahiriSun - kpSun) > 0.05, `Lahiri Sun (${lahiriSun.toFixed(4)}°) and KP Sun (${kpSun.toFixed(4)}°) are distinct`);
assert(Math.abs(lahiriSun - ramanSun) > 1.0, `Lahiri Sun (${lahiriSun.toFixed(4)}°) and Raman Sun (${ramanSun.toFixed(4)}°) differ by > 1°`);
assert(Math.abs(tropicalSun - lahiriSun) > 23.0, `Tropical Sun (${tropicalSun.toFixed(4)}°) and Lahiri Sun (${lahiriSun.toFixed(4)}°) differ by > 23°`);

// Isolation Invariant 2: Inapplicable techniques in Tropical must not crash and be cleanly flagged
assert(tropicalSolo.shadbala.status === "NOT_APPLICABLE", "Tropical cleanly flags Shadbala as NOT_APPLICABLE");
assert(tropicalSolo.ashtakavarga.status === "NOT_APPLICABLE", "Tropical cleanly flags Ashtakavarga as NOT_APPLICABLE");
assert(tropicalSolo.jaimini.status === "NOT_APPLICABLE", "Tropical cleanly flags Jaimini as NOT_APPLICABLE");
assert(tropicalSolo.dasha.status === "NOT_APPLICABLE", "Tropical cleanly flags Dasha as NOT_APPLICABLE");

// Isolation Invariant 3: Inapplicable techniques in KP must be cleanly flagged
assert(kpSolo.shadbala.status === "NOT_APPLICABLE", "KP cleanly flags Shadbala as NOT_APPLICABLE");
assert(kpSolo.ashtakavarga.status === "NOT_APPLICABLE", "KP cleanly flags Ashtakavarga as NOT_APPLICABLE");
assert(kpSolo.jaimini.status === "NOT_APPLICABLE", "KP cleanly flags Jaimini as NOT_APPLICABLE");

// Isolation Invariant 4: KP exports its own Vimshottari dasha hierarchy
assert(Array.isArray(kpSolo.dashaTable) && kpSolo.dashaTable.length > 0, "KP chart exports independent Vimshottari dasha table");

// ---------------------------------------------------------------------------
// 5. SWISS EPHEMERIS / IAU SOFA EXTERNAL REFERENCE BENCHMARKS
// ---------------------------------------------------------------------------
console.log("\n5. Testing Swiss Ephemeris / IAU SOFA Fixed External Benchmarks...");

const swissEphemerisBenchmarks = [
  {
    epoch: "J2000.0 (2000-01-01 12:00:00 UTC)",
    birthData: {
      birthDate: "2000-01-01",
      birthTime: "12:00",
      latitude: 51.4769,
      longitude: 0.0,
      utcOffset: 0.0,
      timezoneId: "UTC"
    },
    referenceTropical: {
      Sun: 280.3689,
      Moon: 223.3239,
      Mars: 327.9639,
      Mercury: 271.8889,
      Jupiter: 25.2542,
      Venus: 241.5653,
      Saturn: 40.3961,
      Rahu: 125.0445
    },
    toleranceDeg: 0.05
  },
  {
    epoch: "Mid-Century Benchmark (1950-01-01 00:00:00 UTC)",
    birthData: {
      birthDate: "1950-01-01",
      birthTime: "00:00",
      latitude: 0.0,
      longitude: 0.0,
      utcOffset: 0.0,
      timezoneId: "UTC"
    },
    referenceTropical: {
      Sun: 280.0047,
      Moon: 61.4153
    },
    toleranceDeg: 0.05
  },
  {
    epoch: "Late 20th Century Benchmark (1980-01-01 00:00:00 UTC)",
    birthData: {
      birthDate: "1980-01-01",
      birthTime: "00:00",
      latitude: 0.0,
      longitude: 0.0,
      utcOffset: 0.0,
      timezoneId: "UTC"
    },
    referenceTropical: {
      Sun: 279.7150,
      Moon: 83.1578
    },
    toleranceDeg: 0.05
  },
  {
    epoch: "Modern Epoch Benchmark (2024-01-01 00:00:00 UTC)",
    birthData: {
      birthDate: "2024-01-01",
      birthTime: "00:00",
      latitude: 0.0,
      longitude: 0.0,
      utcOffset: 0.0,
      timezoneId: "UTC"
    },
    referenceTropical: {
      Sun: 280.0389,
      Moon: 155.9928
    },
    toleranceDeg: 0.05
  }
];

swissEphemerisBenchmarks.forEach(({ epoch, birthData, referenceTropical, toleranceDeg }) => {
  const chart = calculateChartBySystem("tropical", birthData);
  for (const [body, refLong] of Object.entries(referenceTropical)) {
    const planet = chart.planets.find(p => p.name === body);
    assert(planet !== undefined, `${epoch}: ${body} computed in tropical chart`);
    const diff = Math.min(Math.abs(planet.longitude - refLong), 360 - Math.abs(planet.longitude - refLong));
    const arcsecDiff = (diff * 3600).toFixed(1);
    assert(
      diff <= toleranceDeg,
      `${epoch}: ${body} longitude ${planet.longitude.toFixed(4)}° matches Swiss Ephemeris reference ${refLong.toFixed(4)}° within ${toleranceDeg}° (actual error: ${arcsecDiff}")`
    );
  }
});

// ---------------------------------------------------------------------------
// 6. ASPECT DYNAMICS & CIRCULAR BOUNDARY CONDITIONS
// ---------------------------------------------------------------------------
console.log("\n6. Testing Aspect Dynamics: Applying vs Separating & Boundary Transitions...");

function evaluateAspect(p1, p2, aspectDef) {
  const dtHours = 1.0 / 24.0;
  let currentDiff = Math.abs(p1.longitude - p2.longitude);
  if (currentDiff > 180) currentDiff = 360 - currentDiff;
  const currentOrb = Math.abs(currentDiff - aspectDef.angle);

  const futurePos1 = (p1.longitude + (p1.speed * dtHours) + 360) % 360;
  const futurePos2 = (p2.longitude + (p2.speed * dtHours) + 360) % 360;
  let futureDiff = Math.abs(futurePos1 - futurePos2);
  if (futureDiff > 180) futureDiff = 360 - futureDiff;
  const futureOrb = Math.abs(futureDiff - aspectDef.angle);

  return {
    currentSeparation: currentDiff,
    currentOrb,
    isApplying: futureOrb < currentOrb,
    status: futureOrb < currentOrb ? "Applying" : "Separating"
  };
}

// 6.1 Applying conjunction across 360°/0° circle boundary
const conjBoundaryApplying = evaluateAspect(
  { name: "Fast", longitude: 359.5, speed: 1.0 },
  { name: "Slow", longitude: 0.5, speed: 0.2 },
  { name: "Conjunction", angle: 0, orb: 8 }
);
assert(conjBoundaryApplying.isApplying, "Conjunction across 360°/0° circle boundary is correctly identified as Applying");

// 6.2 Separating conjunction across circle boundary
const conjBoundarySeparating = evaluateAspect(
  { name: "Fast", longitude: 0.5, speed: 1.0 },
  { name: "Slow", longitude: 359.5, speed: 0.2 },
  { name: "Conjunction", angle: 0, orb: 8 }
);
assert(!conjBoundarySeparating.isApplying, "Conjunction across 360°/0° circle boundary is correctly identified as Separating");

// 6.3 Approaching 90° square
const squareApplying = evaluateAspect(
  { name: "PlanetA", longitude: 88.5, speed: 1.0 },
  { name: "PlanetB", longitude: 0.0, speed: 0.0 },
  { name: "Square", angle: 90, orb: 7 }
);
assert(squareApplying.isApplying, "Approaching 90° square is correctly identified as Applying");

// 6.4 Retrograde body creating an Applying aspect
const retroSquareApplying = evaluateAspect(
  { name: "RetroPlanet", longitude: 91.5, speed: -1.0 },
  { name: "DirectPlanet", longitude: 0.0, speed: 0.0 },
  { name: "Square", angle: 90, orb: 7 }
);
assert(retroSquareApplying.isApplying, "Retrograde planet moving backwards towards 90° is correctly identified as Applying");

// 6.5 signedAngularDifference verification
assert(signedAngularDifference(5, 355) === 10, "signedAngularDifference(5°, 355°) is +10° across 0° boundary");
assert(signedAngularDifference(355, 5) === -10, "signedAngularDifference(355°, 5°) is -10° across 0° boundary");
assert(signedAngularDifference(180, 0) === 180, "signedAngularDifference(180°, 0°) is +180°");
assert(signedAngularDifference(10, 20) === -10, "signedAngularDifference(10°, 20°) is -10°");

console.log("\n=================================================================");
console.log(` ALL ${passedCount} INDEPENDENT EPHEMERIS REFERENCE TESTS PASSED!`);
console.log("=================================================================");
