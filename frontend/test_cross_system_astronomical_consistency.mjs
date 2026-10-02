/**
 * ASTROVERSE — Cross-System Astronomical Invariant & Consistency Test Suite
 *
 * Enforces the fundamental astronomical invariant:
 * Same Physical Astronomical Body + Same Epoch + Same Node Model
 * = Same Tropical Geocentric Coordinates Across ALL Systems (Lahiri, KP, Raman, Tropical)
 *
 * Tests multiple historical, present, and future epochs with both Mean and True nodes.
 */

import { calculateChartBySystem } from "./src/astrology/index.js";

const TEST_EPOCHS = [
  {
    name: "1947 Indian Independence (New Delhi)",
    birthDate: "1947-08-15",
    birthTime: "00:00",
    latitude: 28.6139,
    longitude: 77.2090,
    utcOffset: 5.5,
    timezoneId: "Asia/Kolkata"
  },
  {
    name: "1994 Chennai Morning Chart",
    birthDate: "1994-08-15",
    birthTime: "06:30",
    latitude: 13.0827,
    longitude: 80.2707,
    utcOffset: 5.5,
    timezoneId: "Asia/Kolkata"
  },
  {
    name: "2000 J2000.0 Greenwich Reference",
    birthDate: "2000-01-01",
    birthTime: "12:00",
    latitude: 51.4769,
    longitude: 0.0,
    utcOffset: 0.0,
    timezoneId: "UTC"
  },
  {
    name: "2026 New York High-DST Epoch",
    birthDate: "2026-06-15",
    birthTime: "18:30",
    latitude: 40.7128,
    longitude: -74.0060,
    utcOffset: -4.0,
    timezoneId: "America/New_York"
  },
  {
    name: "2050 Future Equinox (London BST)",
    birthDate: "2050-03-21",
    birthTime: "08:15",
    latitude: 51.5074,
    longitude: -0.1278,
    utcOffset: 0.0,
    timezoneId: "Europe/London"
  }
];

const BODIES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const SYSTEMS = ["lahiri", "kp", "raman", "tropical"];
const NODE_MODELS = ["mean", "true"];

let totalPassed = 0;
let totalFailed = 0;

console.log("\n" + "=".repeat(70));
console.log(" ASTROVERSE CROSS-SYSTEM ASTRONOMICAL INVARIANT & CONSISTENCY SUITE");
console.log("=".repeat(70));

for (const epoch of TEST_EPOCHS) {
  for (const nodeModel of NODE_MODELS) {
    console.log(`\nEpoch: ${epoch.name} | Node Model: ${nodeModel.toUpperCase()}`);
    
    // Calculate charts across all 4 systems
    const charts = {};
    for (const sys of SYSTEMS) {
      charts[sys] = calculateChartBySystem(sys, epoch, { nodeModel });
    }

    // Extract ayanamsha for each system
    const ayanamshas = {
      lahiri: charts.lahiri.ayanamsaValue ?? charts.lahiri.ayanamshaValue ?? charts.lahiri.ayanamsa,
      kp: charts.kp.ayanamsaValue ?? charts.kp.ayanamshaValue ?? charts.kp.ayanamsha ?? charts.kp.meta?.ayanamsha,
      raman: charts.raman.ayanamsaValue ?? charts.raman.ayanamshaValue ?? charts.raman.ayanamsa,
      tropical: 0.0
    };

    // If kp ayanamsha is missing from top-level, derive from Sun difference
    if (typeof ayanamshas.kp !== "number") {
      const kpSun = charts.kp.planets.find(p => p.name === "Sun").longitude;
      const tropSun = charts.tropical.planets.find(p => p.name === "Sun").longitude;
      ayanamshas.kp = (tropSun - kpSun + 360) % 360;
    }

    for (const bodyName of BODIES) {
      const tropEquivalents = {};
      for (const sys of SYSTEMS) {
        const p = charts[sys].planets.find(item => item.name === bodyName);
        if (!p) {
          console.error(`✗ Missing body ${bodyName} in system ${sys}`);
          totalFailed++;
          continue;
        }
        const siderealDeg = p.longitude;
        const ayan = ayanamshas[sys] || 0;
        const tropDeg = (siderealDeg + ayan) % 360;
        tropEquivalents[sys] = tropDeg;
      }

      // Assert all systems match Tropical system within 0.1 arcsec (0.000028°)
      const refTrop = tropEquivalents.tropical;
      let maxDiffArcSec = 0;

      for (const sys of ["lahiri", "kp", "raman"]) {
        let diffDeg = Math.abs(tropEquivalents[sys] - refTrop);
        if (diffDeg > 180) diffDeg = 360 - diffDeg;
        const diffArcSec = diffDeg * 3600;
        if (diffArcSec > maxDiffArcSec) maxDiffArcSec = diffArcSec;
      }

      if (maxDiffArcSec <= 0.1) {
        console.log(`  ✓ ${bodyName.padEnd(8)} invariant verified across 4 systems (max residual: ${maxDiffArcSec.toFixed(4)}")`);
        totalPassed++;
      } else {
        console.error(`  ✗ FAIL: ${bodyName} inconsistent across systems! Max diff: ${maxDiffArcSec.toFixed(2)}"`);
        console.error(`    Lahiri Trop:   ${tropEquivalents.lahiri.toFixed(6)}°`);
        console.error(`    KP Trop:       ${tropEquivalents.kp.toFixed(6)}°`);
        console.error(`    Raman Trop:    ${tropEquivalents.raman.toFixed(6)}°`);
        console.error(`    Tropical Trop: ${tropEquivalents.tropical.toFixed(6)}°`);
        totalFailed++;
      }
    }
  }
}

console.log("\n" + "=".repeat(70));
console.log(` SUMMARY: ${totalPassed} checks passed, ${totalFailed} checks failed.`);
console.log("=".repeat(70) + "\n");

if (totalFailed > 0) {
  process.exit(1);
}
