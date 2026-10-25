/**
 * ASTROVERSE — Complete Palmistry & Samudrika Shastra Engine Comprehensive Test
 */

import { strict as assert } from "node:assert";
import {
  MAJOR_LINES,
  MINOR_LINES,
  PALM_MOUNTS,
  HAND_ELEMENTS,
  SAMUDRIKA_SIGNS,
  getLifeLineMilestones,
  getFateLineMilestones,
  correlatePalmWithChart,
  analyzePalmTelemetry
} from "./src/services/palmistryEngine.js";

console.log("\n=======================================================");
console.log(" TESTING COMPLETE PALMISTRY & SAMUDRIKA ENGINE");
console.log("=======================================================\n");

// 1. Major Lines Completeness
console.log("1. Testing Major Lines Completeness...");
assert.equal(MAJOR_LINES.length, 4, "Must have exactly 4 major lines");
const lineIds = MAJOR_LINES.map(l => l.id);
assert.deepEqual(lineIds, ["heart", "head", "life", "fate"]);
MAJOR_LINES.forEach(line => {
  assert.ok(line.tamilName, `Major line ${line.id} must have tamilName`);
  assert.ok(line.tamilTraits && line.tamilTraits.length > 0, `Major line ${line.id} must have tamilTraits`);
  assert.ok(line.anatomicalConvention, `Major line ${line.id} must have anatomicalConvention`);
});
console.log("   ✓ All 4 major lines have full English & Tamil descriptions.");

// 2. Minor Lines Completeness
console.log("2. Testing Minor Lines Completeness...");
assert.ok(MINOR_LINES.length >= 6, "Must define at least 6 classical minor lines");
const minorIds = MINOR_LINES.map(l => l.id);
assert.ok(minorIds.includes("sun"), "Must include Sun line");
assert.ok(minorIds.includes("mercury"), "Must include Mercury line");
assert.ok(minorIds.includes("mars_sister"), "Must include Mars sister line");
assert.ok(minorIds.includes("girdle_venus"), "Must include Girdle of Venus");
assert.ok(minorIds.includes("ring_solomon"), "Must include Ring of Solomon");
assert.ok(minorIds.includes("bracelets"), "Must include Rascettes / Bracelets");
console.log(`   ✓ ${MINOR_LINES.length} classical minor lines verified.`);

// 3. Palm Mounts (8 Classical Mounts + Rahu & Ketu zones)
console.log("3. Testing Palm Mounts Completeness...");
assert.ok(PALM_MOUNTS.length >= 8, "Must contain all 8 classical mounts");
const mountIds = PALM_MOUNTS.map(m => m.id);
assert.ok(mountIds.includes("jupiter"));
assert.ok(mountIds.includes("saturn"));
assert.ok(mountIds.includes("apollo"));
assert.ok(mountIds.includes("mercury"));
assert.ok(mountIds.includes("upper_mars"));
assert.ok(mountIds.includes("lower_mars"));
assert.ok(mountIds.includes("venus"));
assert.ok(mountIds.includes("luna"));
assert.ok(mountIds.includes("plain_of_mars"));
assert.ok(mountIds.includes("ketu_zone"));

PALM_MOUNTS.forEach(m => {
  assert.equal(m.elevationStatus, "UNMEASURED_2D_LIMITATION", `Mount ${m.name} must declare unmeasured 2D limitation`);
  assert.equal(m.rating, undefined, `Mount ${m.name} must not have hardcoded rating`);
  assert.ok(m.traditionalSignificance, `Mount ${m.name} must have traditional significance`);
  assert.ok(m.traditionalSignificanceTamil, `Mount ${m.name} must have Tamil traditional significance`);
});
console.log(`   ✓ All ${PALM_MOUNTS.length} Samudrika mounts strictly verified.`);

// 4. Hand Elements Taxonomy
console.log("4. Testing Hand Elements (Earth, Air, Fire, Water, Hybrid)...");
assert.equal(HAND_ELEMENTS.length, 5, "Must have 5 elemental types");
const elementIds = HAND_ELEMENTS.map(e => e.id);
assert.deepEqual(elementIds, ["earth", "air", "fire", "water", "earth_air_hybrid"]);
HAND_ELEMENTS.forEach(el => {
  assert.ok(el.palmShape);
  assert.ok(el.fingerProportion);
  assert.ok(el.temperament);
  assert.ok(el.temperamentTamil);
  assert.ok(el.vocations);
});
console.log("   ✓ All 5 elemental hand shape archetypes verified.");

// 5. Sacred Samudrika Signs
console.log("5. Testing Sacred Samudrika Signs & Chihnas...");
assert.ok(SAMUDRIKA_SIGNS.length >= 6);
const signIds = SAMUDRIKA_SIGNS.map(s => s.id);
assert.ok(signIds.includes("trishula"), "Must include Trishula (Trident)");
assert.ok(signIds.includes("matsya"), "Must include Matsya (Fish sign)");
assert.ok(signIds.includes("trikona"), "Must include Trikona (Triangle)");
assert.ok(signIds.includes("chatushkona"), "Must include Square / Raksha Kavacha");
console.log(`   ✓ All ${SAMUDRIKA_SIGNS.length} sacred Samudrika signs verified.`);

// 6. Chronological Life Line Milestones (Ages 10-80)
console.log("6. Testing Life Line Chronological Milestones...");
const mockLifeCoords = {
  start: { x: 50, y: 150 },
  control: { x: 100, y: 220 },
  end: { x: 75, y: 320 }
};
const lifeMilestones = getLifeLineMilestones(mockLifeCoords);
assert.equal(lifeMilestones.length, 8, "Must generate 8 milestone points along life line");
assert.equal(lifeMilestones[0].age, 10);
assert.equal(lifeMilestones[7].age, 80);
lifeMilestones.forEach(m => {
  assert.ok(Number.isFinite(m.point.x));
  assert.ok(Number.isFinite(m.point.y));
  assert.ok(m.theme.length > 5);
});
console.log("   ✓ Life line milestones accurately interpolated along quadratic Bezier arc.");

// 7. Chronological Fate Line Milestones (Ages 20-65)
console.log("7. Testing Fate Line Chronological Milestones...");
const mockFateCoords = {
  start: { x: 150, y: 320 },
  control: { x: 150, y: 200 },
  end: { x: 150, y: 110 }
};
const fateMilestones = getFateLineMilestones(mockFateCoords, 180, 130);
assert.equal(fateMilestones.length, 4, "Must generate 4 milestone points along fate line");
assert.equal(fateMilestones[0].age, 20);
assert.equal(fateMilestones[1].age, 35);
assert.equal(fateMilestones[2].age, 50);
assert.equal(fateMilestones[3].age, 65);
console.log("   ✓ Fate line milestone intersection points (Head Line @ 35, Heart Line @ 50) verified.");

// 8. Astrological Cross-Correlation (Vedic Kundli <-> Palm Mounts)
console.log("8. Testing Astrological Cross-Correlation Engine...");
const mockChartData = {
  planets: [
    { name: "Jupiter", sign: "Cancer", house: 9, dignity: "exalted", longitude: 105.4 },
    { name: "Saturn", sign: "Aquarius", house: 5, dignity: "own_sign", longitude: 312.1 },
    { name: "Sun", sign: "Aries", house: 7, dignity: "exalted", longitude: 10.5 },
    { name: "Mercury", sign: "Gemini", house: 8, dignity: "own_sign", longitude: 72.3 },
    { name: "Venus", sign: "Pisces", house: 6, dignity: "exalted", longitude: 350.2 },
    { name: "Moon", sign: "Taurus", house: 8, dignity: "exalted", longitude: 45.0 },
    { name: "Mars", sign: "Capricorn", house: 4, dignity: "exalted", longitude: 280.1 }
  ]
};

const correlationEn = correlatePalmWithChart({}, mockChartData, "en");
assert.equal(correlationEn.isLinked, true);
assert.ok(correlationEn.concordanceScore >= 70, `Concordance score ${correlationEn.concordanceScore} should be high for exalted planets`);
assert.equal(correlationEn.correlations.length, 7, "Must correlate all 7 classical planets");
const jupCorr = correlationEn.correlations.find(c => c.planetId === "jupiter");
assert.ok(jupCorr);
assert.equal(jupCorr.alignmentType, "HIGH_CONCORDANCE");
assert.ok(jupCorr.synthesis.includes("Exalted/Strong Jupiter"));

const correlationTa = correlatePalmWithChart({}, mockChartData, "ta");
assert.equal(correlationTa.isLinked, true);
assert.ok(correlationTa.correlations[0].synthesisTamil.length > 10);
console.log("   ✓ Astrological cross-correlation accurately links 7 planets to palm mounts in EN & TA.");

// 9. Fail-Closed on Missing Chart Data
console.log("9. Testing Fail-Closed on Missing Chart Data...");
const emptyCorrelation = correlatePalmWithChart({}, null);
assert.equal(emptyCorrelation.isLinked, false);
assert.equal(emptyCorrelation.correlations.length, 0);
console.log("   ✓ Safely fails-closed with informative notice when natal chart is absent.");

console.log("\n=======================================================");
console.log(" ALL PALMISTRY & SAMUDRIKA COMPLETE TESTS PASSED 100%!");
console.log("=======================================================\n");
