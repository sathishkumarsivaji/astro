import assert from "node:assert/strict";
import { analyzeCandidateStability } from "./src/services/birthTimeRectification/engine/stabilityAnalyzer.js";

console.log("=== P0 Test: Flat-Score & Non-Discriminating Stability ===");

const flatGrid = [
  { totalMinutes: 340, timeString: "05:40", score: { totalScore: 35.0 } },
  { totalMinutes: 345, timeString: "05:45", score: { totalScore: 35.1 } },
  { totalMinutes: 350, timeString: "05:50", score: { totalScore: 35.0 } },
  { totalMinutes: 355, timeString: "05:55", score: { totalScore: 35.2 } },
  { totalMinutes: 360, timeString: "06:00", score: { totalScore: 35.0 } },
  { totalMinutes: 365, timeString: "06:05", score: { totalScore: 35.1 } }
];

const res = analyzeCandidateStability(flatGrid, flatGrid[3]);

assert.equal(res.resolution, "NOT_DISCRIMINATING", "Uniform scores must be classified as NOT_DISCRIMINATING");
assert.equal(res.minuteLevelResolutionEstablished, false, "minuteLevelResolutionEstablished must be false");
assert.equal(res.isStable, false, "Uniform plateau must not be classified as stable peak");

console.log("✓ test_rectification_flat_score passed successfully.");
