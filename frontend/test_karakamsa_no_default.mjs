/**
 * Mandatory Test 10: Jaimini Karakamsa Anti-Default Verification
 *
 * Asserts:
 * - Karakamsa Lagna NEVER fabricates or defaults to "Aries" when input data is missing.
 * - When planets or ascendant are missing, calculateJaiminiSystem returns status "INSUFFICIENT_DATA"
 *   and karakamsaLagna.sign = null.
 * - Proves absence of fallback fabrication in the Jaimini subsystem.
 */

import { calculateJaiminiSystem } from "./src/services/astroEngine.js";

console.log("\n" + "=".repeat(70));
console.log(" TEST 10: JAIMINI KARAKAMSA ANTI-DEFAULT / NULL PRESERVATION");
console.log("=".repeat(70));

let passes = 0;
let fails = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passes++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    fails++;
  }
}

// Case 1: Empty planets array
const resEmpty = calculateJaiminiSystem([]);
assert(resEmpty.status === "INSUFFICIENT_DATA", "Status is INSUFFICIENT_DATA for empty planets array");
assert(resEmpty.karakamsaLagna?.sign === null, "karakamsaLagna.sign is strictly null (NOT 'Aries')");
assert(resEmpty.karakamsaLagna?.signTamil === null, "karakamsaLagna.signTamil is strictly null (NOT 'மேஷம்')");
assert(resEmpty.karakamsaLagna?.status === "INSUFFICIENT_DATA", "karakamsaLagna.status is INSUFFICIENT_DATA");

// Case 2: Null / undefined input
const resNull = calculateJaiminiSystem(null);
assert(resNull.status === "INSUFFICIENT_DATA", "Status is INSUFFICIENT_DATA for null input");
assert(resNull.karakamsaLagna?.sign === null, "karakamsaLagna.sign is null for null input");

// Case 3: Valid planets array where Atmakaraka can be genuinely computed
const validPlanets = [
  { name: "Sun", longitude: 28.5 },      // 28°30' in Aries
  { name: "Moon", longitude: 45.2 },     // 15°12' in Taurus
  { name: "Mars", longitude: 62.1 },     // 2°06' in Gemini
  { name: "Mercury", longitude: 79.8 },  // 19°48' in Gemini
  { name: "Jupiter", longitude: 105.4 }, // 15°24' in Cancer
  { name: "Venus", longitude: 149.2 },   // 29°12' in Leo -> Highest degree in sign (29.2°) -> Atmakaraka!
  { name: "Saturn", longitude: 200.1 },  // 20°06' in Libra
  { name: "Rahu", longitude: 310.0 },
  { name: "Ketu", longitude: 130.0 }
];

const resValid = calculateJaiminiSystem(validPlanets, 15.0);
assert(resValid.status === "COMPLETE", "Valid chart produces COMPLETE Jaimini status");
assert(resValid.atmakaraka?.planet === "Venus", `Atmakaraka is Venus (29.2° in Leo) (got ${resValid.atmakaraka?.planet})`);
assert(resValid.karakamsaLagna?.sign !== null, `Karakamsa sign resolved to genuine calculation: ${resValid.karakamsaLagna?.sign}`);

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
