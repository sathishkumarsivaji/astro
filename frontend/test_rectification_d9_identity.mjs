import assert from "node:assert/strict";
import { calculatePlanetaryPositions } from "./src/services/astroEngine.js";
import { buildCanonicalVarga } from "./src/services/birthTimeRectification/engine/rectificationVargaAdapter.js";

console.log("=== P0 Test: Canonical D9 Navamsha Planet Identity Invariant ===");

const chart = calculatePlanetaryPositions("1992-08-15", "06:00", 13.0827, 80.2707, "lahiri", 5.5);
const d9Canonical = buildCanonicalVarga("D9", chart.planets, chart.ascendantDeg ?? chart.ascendant?.longitude ?? 0);

assert.ok(d9Canonical, "D9 Navamsha must build successfully");
const venus = d9Canonical.getPlanet("Venus");
const jupiter = d9Canonical.getPlanet("Jupiter");

assert.equal(venus.name, "Venus", "D9 Venus must have name Venus");
assert.equal(venus.planet, "Venus", "D9 Venus must have planet identifier Venus");
assert.equal(jupiter.name, "Jupiter", "D9 Jupiter must have name Jupiter");
assert.ok(typeof venus.sign === "string", "D9 Venus must have valid sign string");
assert.ok(typeof venus.house === "number", "D9 Venus must have valid house number");

console.log("✓ test_rectification_d9_identity passed successfully.");
