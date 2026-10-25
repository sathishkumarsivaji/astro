/**
 * ASTROVERSE — Canonical Chart Accessors Test Suite
 * ==================================================
 * Tests:
 * 1. getHouseByNumber: resolves 1..12 by explicit house/bhava property,
 *    handles shuffled arrays, 1-based/0-based keyed objects,
 *    never assumes array index, returns null if missing (no Aries fallback).
 * 2. getPlanetByName: case-insensitive, aliases (Tamil/Sanskrit),
 *    supports array or keyed object, returns null if missing (no Mars fallback).
 * 3. getPlanetLongitude: normalizes [0, 360), handles strings, returns null if invalid.
 * 4. getPlanetHouse: returns integer 1..12 or null.
 * 5. getDashaTimeline: returns array or [].
 * 6. getDivisionalChart: resolves D1..D60, aliases (navamsha/dasamsha), returns null if missing.
 */

import assert from "node:assert/strict";
import {
  getHouseByNumber,
  getPlanetByName,
  getPlanetLongitude,
  getPlanetHouse,
  getDashaTimeline,
  getDivisionalChart,
  getAscendantName,
  getMoonSignName
} from "./src/types/chartAccessors.js";

import * as serviceAccessors from "./src/services/chartAccessors.js";

console.log("=================================================");
console.log("RUNNING CANONICAL CHART ACCESSORS TEST SUITE");
console.log("=================================================");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// 1. Service Re-export Parity
test("1.1 Service chartAccessors.js exports same API as types/chartAccessors.js", () => {
  assert.equal(typeof serviceAccessors.getHouseByNumber, "function");
  assert.equal(typeof serviceAccessors.getPlanetByName, "function");
  assert.equal(typeof serviceAccessors.getPlanetLongitude, "function");
  assert.equal(typeof serviceAccessors.getPlanetHouse, "function");
  assert.equal(typeof serviceAccessors.getDashaTimeline, "function");
  assert.equal(typeof serviceAccessors.getDivisionalChart, "function");
  assert.equal(serviceAccessors.getHouseByNumber, getHouseByNumber);
});

// 2. getHouseByNumber
test("2.1 Returns null for invalid chart or invalid house numbers", () => {
  assert.equal(getHouseByNumber(null, 1), null);
  assert.equal(getHouseByNumber(undefined, 4), null);
  assert.equal(getHouseByNumber({}, 0), null);
  assert.equal(getHouseByNumber({}, 13), null);
  assert.equal(getHouseByNumber({}, -1), null);
  assert.equal(getHouseByNumber({}, "abc"), null);
  assert.equal(getHouseByNumber({}, null), null);
  assert.equal(getHouseByNumber({}, 4), null); // Empty chart returns null, never Aries
});

test("2.2 Resolves house from shuffled array by explicit house property (never by array index)", () => {
  const shuffledHouses = [
    { house: 10, sign: "Capricorn", lord: "Saturn" },
    { house: 1, sign: "Aries", lord: "Mars" },
    { house: 4, sign: "Cancer", lord: "Moon" },
    { house: 7, sign: "Libra", lord: "Venus" }
  ];
  const chart = { houses: shuffledHouses };

  const h4 = getHouseByNumber(chart, 4);
  assert.ok(h4);
  assert.equal(h4.house, 4);
  assert.equal(h4.sign, "Cancer");
  assert.equal(h4.lord, "Moon");

  const h10 = getHouseByNumber(chart, 10);
  assert.ok(h10);
  assert.equal(h10.house, 10);

  // Missing house 5 in partial array returns null
  assert.equal(getHouseByNumber(chart, 5), null);
});

test("2.3 Resolves house from bhava property and bhavaData collections", () => {
  const chart = {
    bhavasDetailed: [
      { bhava: 2, sign: "Taurus", lord: "Venus" },
      { bhava: 8, sign: "Scorpio", lord: "Mars" }
    ]
  };
  const h2 = getHouseByNumber(chart, 2);
  assert.ok(h2);
  assert.equal(h2.bhava, 2);
  assert.equal(h2.sign, "Taurus");

  const h8 = getHouseByNumber(chart, 8);
  assert.ok(h8);
  assert.equal(h8.bhava, 8);
  assert.equal(h8.sign, "Scorpio");
});

test("2.4 Resolves house from keyed object", () => {
  const chart = {
    houses: {
      "4": { sign: "Cancer", lord: "Moon" },
      house12: { sign: "Pisces", lord: "Jupiter" }
    }
  };
  const h4 = getHouseByNumber(chart, 4);
  assert.ok(h4);
  assert.equal(h4.sign, "Cancer");

  const h12 = getHouseByNumber(chart, 12);
  assert.ok(h12);
  assert.equal(h12.sign, "Pisces");
});

// 3. getPlanetByName
test("3.1 Returns null for missing planet or missing chart (never fabricates default Mars/Sun)", () => {
  assert.equal(getPlanetByName(null, "Sun"), null);
  assert.equal(getPlanetByName({}, "Mars"), null);
  assert.equal(getPlanetByName({ planets: [] }, "Jupiter"), null);
});

test("3.2 Resolves planets case-insensitively and via Tamil/Sanskrit aliases", () => {
  const chart = {
    planets: [
      { name: "Jupiter", sign: "Pisces", house: 9, longitude: 345.5 },
      { name: "Mars", sign: "Capricorn", house: 10, longitude: 282.1 },
      { name: "Rahu", sign: "Aries", house: 1, longitude: 15.3 }
    ]
  };

  // Case insensitive
  assert.equal(getPlanetByName(chart, "jupiter")?.sign, "Pisces");
  assert.equal(getPlanetByName(chart, "JUPITER")?.sign, "Pisces");
  assert.equal(getPlanetByName(chart, "MaRs")?.sign, "Capricorn");

  // Sanskrit / Tamil aliases
  assert.equal(getPlanetByName(chart, "Guru")?.sign, "Pisces");
  assert.equal(getPlanetByName(chart, "குரு")?.sign, "Pisces");
  assert.equal(getPlanetByName(chart, "Kuja")?.sign, "Capricorn");
  assert.equal(getPlanetByName(chart, "செவ்வாய்")?.sign, "Capricorn");
  assert.equal(getPlanetByName(chart, "ராகு")?.sign, "Aries");

  // Non-existent planet returns null
  assert.equal(getPlanetByName(chart, "Venus"), null);
});

test("3.3 Resolves planets from keyed object or planetaryPositions", () => {
  const chart = {
    planetaryPositions: {
      Sun: { sign: "Leo", house: 5, longitude: 135.0 },
      Moon: { sign: "Cancer", house: 4, longitude: 102.5 }
    }
  };

  assert.equal(getPlanetByName(chart, "sun")?.house, 5);
  assert.equal(getPlanetByName(chart, "சந்திரன்")?.sign, "Cancer");
});

// 4. getPlanetLongitude
test("4.1 Returns normalized [0, 360) longitude or null", () => {
  const chart = {
    planets: [
      { name: "Sun", longitude: 120.5 },
      { name: "Moon", lon: -30 }, // negative angle normalized to 330
      { name: "Mars", absoluteDegree: 390 }, // > 360 normalized to 30
      { name: "Mercury", degree: "45.2" }, // string number
      { name: "Venus", longitude: "invalid" }, // invalid string
      { name: "Saturn" } // missing degree
    ]
  };

  assert.equal(getPlanetLongitude(chart, "Sun"), 120.5);
  assert.equal(getPlanetLongitude(chart, "Moon"), 330);
  assert.equal(getPlanetLongitude(chart, "Mars"), 30);
  assert.equal(getPlanetLongitude(chart, "Mercury"), 45.2);
  assert.equal(getPlanetLongitude(chart, "Venus"), null);
  assert.equal(getPlanetLongitude(chart, "Saturn"), null);
  assert.equal(getPlanetLongitude(chart, "Jupiter"), null);
  assert.equal(getPlanetLongitude(null, "Sun"), null);
});

// 5. getPlanetHouse
test("5.1 Returns 1..12 house integer or null", () => {
  const chart = {
    planets: [
      { name: "Sun", house: 1 },
      { name: "Moon", bhava: 12 },
      { name: "Mars", currentHouse: "7" },
      { name: "Mercury", house: 0 }, // invalid 0
      { name: "Jupiter", house: 13 } // invalid 13
    ]
  };

  assert.equal(getPlanetHouse(chart, "Sun"), 1);
  assert.equal(getPlanetHouse(chart, "Moon"), 12);
  assert.equal(getPlanetHouse(chart, "Mars"), 7);
  assert.equal(getPlanetHouse(chart, "Mercury"), null);
  assert.equal(getPlanetHouse(chart, "Jupiter"), null);
  assert.equal(getPlanetHouse(chart, "Saturn"), null);
  assert.equal(getPlanetHouse(null, "Sun"), null);
});

// 6. getDashaTimeline
test("6.1 Returns dasha array or empty array", () => {
  const timeline = [{ lord: "Saturn", startAge: 20, endAge: 39 }];
  assert.deepEqual(getDashaTimeline({ dashaTimeline: timeline }), timeline);
  assert.deepEqual(getDashaTimeline({ dashaTable: timeline }), timeline);
  assert.deepEqual(getDashaTimeline({}), []);
  assert.deepEqual(getDashaTimeline(null), []);
});

// 7. getDivisionalChart
test("7.1 Resolves divisional charts by D-number or alias", () => {
  const chart = {
    vargas: {
      D9: { ascendant: "Pisces", planets: [] },
      D10: { ascendant: "Aries", planets: [] }
    }
  };

  assert.equal(getDivisionalChart(chart, "D9")?.ascendant, "Pisces");
  assert.equal(getDivisionalChart(chart, "d9")?.ascendant, "Pisces");
  assert.equal(getDivisionalChart(chart, "navamsha")?.ascendant, "Pisces");
  assert.equal(getDivisionalChart(chart, "D10")?.ascendant, "Aries");
  assert.equal(getDivisionalChart(chart, "dasamsha")?.ascendant, "Aries");
  assert.equal(getDivisionalChart(chart, "D7"), null);
  assert.equal(getDivisionalChart(null, "D9"), null);
});

console.log("=================================================");
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}
