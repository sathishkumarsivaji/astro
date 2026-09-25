import assert from 'node:assert';
import { calculateD3, calculateD9, ZODIAC_SIGNS } from './src/services/astroEngine.js';

console.log("Testing D3 Drekkana boundaries...");
const d3Tests = [
  { long: 0.0, expectedDecanate: 1, expectedSign: "Aries" },
  { long: 9.9997, expectedDecanate: 1, expectedSign: "Aries" },
  { long: 10.0, expectedDecanate: 2, expectedSign: "Leo" },
  { long: 19.9997, expectedDecanate: 2, expectedSign: "Leo" },
  { long: 20.0, expectedDecanate: 3, expectedSign: "Sagittarius" },
  { long: 29.9997, expectedDecanate: 3, expectedSign: "Sagittarius" },
  { long: 30.0, expectedDecanate: 1, expectedSign: "Taurus" },
  { long: 40.0, expectedDecanate: 2, expectedSign: "Virgo" },
  { long: 50.0, expectedDecanate: 3, expectedSign: "Capricorn" }
];

for (const t of d3Tests) {
  const res = calculateD3(t.long);
  assert.strictEqual(res.decanate, t.expectedDecanate, `D3 decanate mismatch at ${t.long}°`);
  assert.strictEqual(res.signName, t.expectedSign, `D3 sign mismatch at ${t.long}°`);
}

const vyatRes = calculateD3(35.0, { mode: "vyatyaya" });
assert.strictEqual(vyatRes.signName, "Capricorn", "Taurus 35° in vyatyaya mode must be Capricorn");
console.log("✓ All D3 Drekkana tests passed strictly.");

// Canonical 108 Navamsha sequence verification across all 12 signs
console.log("\nTesting all 108 Navamsha Padas (3°20' intervals across 360°)...");
const NAVAMSA_START_SIGNS = [
  0,  // Aries (Fire) -> starts Aries (0)
  9,  // Taurus (Earth) -> starts Capricorn (9)
  6,  // Gemini (Air) -> starts Libra (6)
  3,  // Cancer (Water) -> starts Cancer (3)
  0,  // Leo (Fire) -> starts Aries (0)
  9,  // Virgo (Earth) -> starts Capricorn (9)
  6,  // Libra (Air) -> starts Libra (6)
  3,  // Scorpio (Water) -> starts Cancer (3)
  0,  // Sagittarius (Fire) -> starts Aries (0)
  9,  // Capricorn (Earth) -> starts Capricorn (9)
  6,  // Aquarius (Air) -> starts Libra (6)
  3   // Pisces (Water) -> starts Cancer (3)
];

const padaSpan = 360 / 108; // 3.3333333333333335°
for (let signIdx = 0; signIdx < 12; signIdx++) {
  const startNavSign = NAVAMSA_START_SIGNS[signIdx];
  for (let padaInSign = 0; padaInSign < 9; padaInSign++) {
    const globalPadaIdx = signIdx * 9 + padaInSign;
    const testDeg = globalPadaIdx * padaSpan + 0.001; // epsilon inside pada
    const expectedNavSignIdx = (startNavSign + padaInSign) % 12;
    const expectedSignName = ZODIAC_SIGNS[expectedNavSignIdx].name;
    const res = calculateD9(testDeg);
    assert.strictEqual(
      res.signName,
      expectedSignName,
      `Navamsha pada ${globalPadaIdx + 1} (${testDeg.toFixed(2)}°) in ${ZODIAC_SIGNS[signIdx].name} expected ${expectedSignName}, got ${res.signName}`
    );
  }
}

console.log("✓ All 108 Navamsha Padas (100% of the 360° zodiac) verified with strict mathematical assertions.");
console.log("\n=======================================================");
console.log(" ALL D3 DREKKANA & D9 NAVAMSHA TESTS PASSED 100%!");
console.log("=======================================================");
