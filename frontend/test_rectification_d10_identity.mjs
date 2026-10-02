import assert from "node:assert/strict";
import { calculatePlanetaryPositions } from "./src/services/astroEngine.js";
import { buildCanonicalVarga } from "./src/services/birthTimeRectification/engine/rectificationVargaAdapter.js";

console.log("=== P0 Test: Canonical D10 Dasamsha Planet Identity Invariant ===");

const chart = calculatePlanetaryPositions("1992-08-15", "06:00", 13.0827, 80.2707, "lahiri", 5.5);
const d10Canonical = buildCanonicalVarga("D10", chart.planets, chart.ascendantDeg ?? chart.ascendant?.longitude ?? 0);

assert.ok(d10Canonical, "D10 Dasamsha must build successfully");
const saturn = d10Canonical.getPlanet("Saturn");
const sun = d10Canonical.getPlanet("Sun");

assert.equal(saturn.name, "Saturn", "D10 Saturn must have name Saturn");
assert.equal(sun.name, "Sun", "D10 Sun must have name Sun");
assert.ok(typeof saturn.sign === "string", "D10 Saturn must have valid sign");
assert.ok(typeof saturn.house === "number", "D10 Saturn must have valid house");

console.log("✓ test_rectification_d10_identity passed successfully.");
