import assert from "node:assert/strict";
import { runBirthTimeRectification } from "./src/services/birthTimeRectification/rectificationService.js";
import { runPermutationNullTest } from "./src/services/birthTimeRectification/engine/permutationEngine.js";

console.log("=== Test: Permutation Null Distribution & Random Noise Rejection ===");

// 1. Direct Permutation Null Engine Test
const mockCandidates = [
  { timeString: "06:00", chart: { planets: [], ascendantDeg: 120 } },
  { timeString: "06:05", chart: { planets: [], ascendantDeg: 121 } }
];

const mockEvents = [
  { id: "MOCK-1", type: "CAREER_START", date: "2015-05-01", importance: "HIGH" },
  { id: "MOCK-2", type: "MARRIAGE", date: "2018-11-20", importance: "CRITICAL" }
];

const permTest = runPermutationNullTest({
  events: mockEvents,
  candidates: mockCandidates,
  realPeakScore: 10,
  permutationsCount: 100
});

assert.ok(permTest.applicable, "Permutation test must be applicable");
assert.equal(permTest.permutationsCount, 100, "Must run exactly 100 permutations");
assert.ok(typeof permTest.pValue === "number", "pValue must be a number");
assert.ok(typeof permTest.percentile === "number", "percentile must be a number");

// 2. Full Rectification with Random / Non-Informative Events
const randomEvents = [
  { id: "RND-1", type: "OTHER", date: "2014-02-11", description: "Random non-astrological note" },
  { id: "RND-2", type: "RELOCATION", date: "2017-08-04", description: "Another random milestone" }
];

const rectResult = runBirthTimeRectification({
  birthDate: "1992-08-15",
  approximateTime: "06:00",
  marginMinutes: 15,
  lat: 13.0827,
  lng: 80.2707,
  timezoneId: "Asia/Kolkata",
  utcOffset: 5.5,
  events: randomEvents
});

assert.equal(rectResult.status, "SUCCESS");
assert.ok(rectResult.permutationTest, "Permutation test result must be included in output");
assert.equal(rectResult.minuteLevelResolutionEstablished, false, "Random events must NOT establish minute-level resolution");
assert.equal(rectResult.centralEstimate, null, "Central estimate must be null when signal is not discriminating or noise");

console.log("✓ Permutation null distribution test passed successfully!");
