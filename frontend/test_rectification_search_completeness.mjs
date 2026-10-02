import assert from "node:assert/strict";
import { generateTimeCandidates, findLocalMaxima } from "./src/services/birthTimeRectification/engine/candidateGenerator.js";

console.log("=== P0 Test: Multi-Stage Search Completeness ===");

const candidates = generateTimeCandidates({
  birthDate: "1995-05-15",
  approximateTime: "12:00",
  marginMinutes: 30,
  stepMinutes: 5,
  timezoneId: "Asia/Kolkata",
  utcOffset: 5.5
});

// 12:00 ± 30m with step 5 -> [-30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30] = 13 samples
assert.equal(candidates.length, 13, "Coarse grid must contain exactly 13 candidate points");
assert.equal(candidates[0].timeString, "11:30", "Grid start must be 11:30");
assert.equal(candidates[6].timeString, "12:00", "Grid center must be 12:00");
assert.equal(candidates[12].timeString, "12:30", "Grid end must be 12:30");

// Test local maxima finding
const mockScored = candidates.map((c, i) => ({
  ...c,
  score: { totalScore: (i === 3 || i === 9) ? 80 : 20 }
}));

const maxima = findLocalMaxima(mockScored, 10, 2);
assert.equal(maxima.length, 2, "Must identify both local maxima");
assert.ok(maxima.some(m => m.timeString === "11:45"), "Must detect 11:45 maximum");
assert.ok(maxima.some(m => m.timeString === "12:15"), "Must detect 12:15 maximum");

console.log("✓ test_rectification_search_completeness passed successfully.");
