import assert from "node:assert/strict";
import { calculatePlanetaryPositions } from "./src/services/astroEngine.js";
import { buildCanonicalVarga } from "./src/services/birthTimeRectification/engine/rectificationVargaAdapter.js";

console.log("=== P0 Test: Canonical D7 Saptamsha Planet Identity Invariant ===");

const chart = calculatePlanetaryPositions("1992-08-15", "06:00", 13.0827, 80.2707, "lahiri", 5.5);
const d7Canonical = buildCanonicalVarga("D7", chart.planets, chart.ascendantDeg ?? chart.ascendant?.longitude ?? 0);

assert.ok(d7Canonical, "D7 Saptamsha must build successfully");
const jupiter = d7Canonical.getPlanet("Jupiter");
const mars = d7Canonical.getPlanet("Mars");

assert.equal(jupiter.name, "Jupiter", "D7 Jupiter must have name Jupiter");
assert.equal(mars.name, "Mars", "D7 Mars must have name Mars");
assert.ok(typeof jupiter.sign === "string", "D7 Jupiter must have valid sign");
assert.ok(typeof jupiter.house === "number", "D7 Jupiter must have valid house");

console.log("✓ test_rectification_d7_identity passed successfully.");
