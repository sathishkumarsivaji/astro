import assert from "node:assert/strict";
import { analyzeCandidateStability } from "./src/services/birthTimeRectification/engine/stabilityAnalyzer.js";

console.log("=== P0 Test: Chronological Stability Analysis ===");

const scoredCandidates = [
  { totalMinutes: 356, timeString: "05:56", score: { totalScore: 40 } },
  { totalMinutes: 357, timeString: "05:57", score: { totalScore: 50 } },
  { totalMinutes: 358, timeString: "05:58", score: { totalScore: 78 } },
  { totalMinutes: 359, timeString: "05:59", score: { totalScore: 82 } },
  { totalMinutes: 360, timeString: "06:00", score: { totalScore: 85 } },
  { totalMinutes: 361, timeString: "06:01", score: { totalScore: 83 } },
  { totalMinutes: 362, timeString: "06:02", score: { totalScore: 79 } },
  { totalMinutes: 363, timeString: "06:03", score: { totalScore: 52 } },
  { totalMinutes: 364, timeString: "06:04", score: { totalScore: 42 } }
];

const peakCand = scoredCandidates[4]; // 06:00 (score 85)
const res = analyzeCandidateStability(scoredCandidates, peakCand);

assert.equal(res.isStable, true, "Single contiguous peak must be classified as stable");
assert.ok(res.stableIntervalStart, "Stable interval start must exist");
assert.ok(res.stableIntervalEnd, "Stable interval end must exist");
assert.ok(res.candidateCount >= 3, "Stable run candidate count must be >= 3");
assert.ok(typeof res.elapsedIntervalMinutes === "number", "Elapsed interval must be numeric");

console.log("✓ test_rectification_stability passed successfully.");
