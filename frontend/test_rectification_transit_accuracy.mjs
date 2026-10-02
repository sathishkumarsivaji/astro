import assert from "node:assert/strict";
import { calculatePlanetaryPositions } from "./src/services/astroEngine.js";
import { calculateEventTransits, checkAspectHit } from "./src/services/birthTimeRectification/engine/transitCalculator.js";

console.log("=== P0 Test: Genuine Historical Transit Calculation ===");

const natalChart = calculatePlanetaryPositions("1992-08-15", "06:00", 13.0827, 80.2707, "lahiri", 5.5);
const transits = calculateEventTransits(new Date("2019-11-20"), natalChart, "lahiri");

assert.ok(transits.transitGrahas?.Jupiter, "Transiting Jupiter must be computed");
assert.ok(transits.transitGrahas?.Saturn, "Transiting Saturn must be computed");
assert.ok(typeof transits.transitGrahas.Jupiter.longitude === "number", "Jupiter longitude must be numeric");
assert.ok(typeof transits.transitGrahas.Saturn.longitude === "number", "Saturn longitude must be numeric");

const aspectConj = checkAspectHit(120.0, 120.0, 1, 6.0);
assert.equal(aspectConj.hit, true, "Exact conjunction must register as hit");
assert.ok(aspectConj.orb < 0.01, "Exact conjunction orb must be near 0");

const aspectExact7H = checkAspectHit(300.0, 120.0, 7, 6.0);
assert.equal(aspectExact7H.hit, true, "Exact 7th house aspect must register as hit");
assert.ok(aspectExact7H.orb < 0.01, "Exact aspect orb must be near 0");

const aspectMiss = checkAspectHit(120.0, 200.0, 7, 6.0);
assert.equal(aspectMiss.hit, false, "Out of orb aspect must not register as hit");

console.log("✓ test_rectification_transit_accuracy passed successfully.");
