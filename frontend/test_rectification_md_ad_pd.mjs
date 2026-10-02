import assert from "node:assert/strict";
import { calculatePlanetaryPositions } from "./src/services/astroEngine.js";
import { calculateEventDashaHierarchy } from "./src/services/birthTimeRectification/engine/dashaTimingCalculator.js";

console.log("=== P0 Test: 3-Tier Vimshottari Event Timing (MD/AD/PD) ===");

const chart = calculatePlanetaryPositions("1992-08-15", "06:00", 13.0827, 80.2707, "lahiri", 5.5);
const dashaRes = calculateEventDashaHierarchy(new Date("2019-11-20"), chart, ["Saturn", "Venus"], ["Mercury"]);

assert.ok(dashaRes.activeMD, "Active Mahadasha lord must be resolved");
assert.ok(dashaRes.activeAD, "Active Antardasha lord must be resolved");
assert.ok(typeof dashaRes.timingScore === "number", "Timing score must be numeric");
assert.ok(Array.isArray(dashaRes.timingEvidence), "Timing evidence must be an array");

console.log("✓ test_rectification_md_ad_pd passed successfully.");
