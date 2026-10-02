import assert from "node:assert/strict";
import { analyzeCandidateStability } from "./src/services/birthTimeRectification/engine/stabilityAnalyzer.js";

console.log("=== P0 Test: Multi-Peak & Multimodal Separation ===");

const multiPeakGrid = [
  // Peak A (05:40 - 05:44)
  { totalMinutes: 340, timeString: "05:40", score: { totalScore: 69.0 } },
  { totalMinutes: 342, timeString: "05:42", score: { totalScore: 71.0 } },
  { totalMinutes: 344, timeString: "05:44", score: { totalScore: 68.5 } },
  // Valley (05:48 - 05:54)
  { totalMinutes: 348, timeString: "05:48", score: { totalScore: 20.0 } },
  { totalMinutes: 350, timeString: "05:50", score: { totalScore: 18.0 } },
  { totalMinutes: 354, timeString: "05:54", score: { totalScore: 22.0 } },
  // Peak B (06:00 - 06:04)
  { totalMinutes: 360, timeString: "06:00", score: { totalScore: 70.0 } },
  { totalMinutes: 362, timeString: "06:02", score: { totalScore: 72.0 } },
  { totalMinutes: 364, timeString: "06:04", score: { totalScore: 69.0 } }
];

const peakCand = multiPeakGrid[7]; // 06:02 (72.0)
const res = analyzeCandidateStability(multiPeakGrid, peakCand);

assert.ok(res.stableRegions.length >= 2, `Expected >= 2 stable regions, got ${res.stableRegions.length}`);
assert.equal(res.resolution, "MULTI_MODAL", "Should be MULTI_MODAL when separated by low-scoring valley");
assert.equal(res.isMultiPeak, true, "isMultiPeak must be true");

console.log("✓ test_rectification_multipeak passed successfully.");
