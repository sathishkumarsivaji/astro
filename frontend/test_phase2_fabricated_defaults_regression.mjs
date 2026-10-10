/**
 * ASTROVERSE — Phase 2 Fabricated Defaults Regression Suite
 * ============================================================
 * Verifies the removal and non-recurrence of all 8 fabricated defaults
 * identified across UI, customer reports, Q&A, and empirical engines.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

console.log("\n" + "=".repeat(75));
console.log(" ASTROVERSE — PHASE 2 FABRICATED DEFAULTS REGRESSION SUITE");
console.log("=".repeat(75) + "\n");

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function main() {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. BirthRecoveryWizard.jsx: No "06:45" fallback
  // ─────────────────────────────────────────────────────────────────────────────
  await check("1. BirthRecoveryWizard: Zero '06:45' fallback string in source code", () => {
    const wizardPath = path.join(__dirname, "src/components/Horoscope/BirthRecoveryWizard.jsx");
    const content = fs.readFileSync(wizardPath, "utf8");
    assert(!content.includes('"06:45"'), "BirthRecoveryWizard.jsx must not contain hardcoded '06:45' fallback");
    assert(!content.includes("'06:45'"), "BirthRecoveryWizard.jsx must not contain hardcoded '06:45' fallback");
  });

// ─────────────────────────────────────────────────────────────────────────────
// 2. customerReport/index.js: No fabricated chart facts
// ─────────────────────────────────────────────────────────────────────────────
  await check("2A. customerReport/index.js: Missing Sun degree does not default to 15", async () => {
    const { generateLifeIntelligenceReport } = await import("./src/services/customerReport/index.js");
    const minimalChart = {
      planets: [
        { name: "Sun", longitude: 10.5, house: 1, sign: "Aries", speed: 1.0 },
        { name: "Moon", longitude: 45.2, house: 2, sign: "Taurus", speed: 13.0 }
      ],
      houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, sign: "Aries", lordName: "Mars" })),
      ascendantLong: 0,
      timezoneId: "Asia/Kolkata"
    };
    // Delete sunLong to verify no default 15
    delete minimalChart.sunLong;

    const report = generateLifeIntelligenceReport(minimalChart, { bypassCache: true });
    assert.notStrictEqual(report.coreNatalProfile.sunSign.degree, 15, "Sun degree must not default to 15 when sunLong is missing");
  });

  await check("2B. customerReport/index.js: Missing elementalDistribution is not invented as {fire:3, air:2, water:2, earth:3}", async () => {
    const { generateLifeIntelligenceReport } = await import("./src/services/customerReport/index.js");
    const minimalChart = {
      planets: [
        { name: "Sun", longitude: 10.5, house: 1, sign: "Aries" },
        { name: "Moon", longitude: 45.2, house: 2, sign: "Taurus" }
      ],
      houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, sign: "Aries", lordName: "Mars" })),
      ascendantLong: 0,
      timezoneId: "Asia/Kolkata"
    };

    const report = generateLifeIntelligenceReport(minimalChart, { bypassCache: true });
    const elem = report.coreNatalProfile.elementalDistribution;
    const isInvented = elem && elem.fire === 3 && elem.air === 2 && elem.water === 2 && elem.earth === 3;
    assert(!isInvented, "elementalDistribution must not be invented with hardcoded {fire:3, air:2, water:2, earth:3}");
  });

  await check("2C. customerReport/index.js: Missing planet fields (house, pada, speed) do not default to 1, 1, 1.0", async () => {
    const { generateLifeIntelligenceReport } = await import("./src/services/customerReport/index.js");
    const minimalChart = {
      planets: [
        { name: "Mars" } // Missing longitude, house, pada, speed
      ],
      houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, sign: "Aries", lordName: "Mars" })),
      ascendantLong: 0,
      timezoneId: "Asia/Kolkata"
    };

    const report = generateLifeIntelligenceReport(minimalChart, { bypassCache: true });
    const mars = report.planetaryTable.find(p => p.name === "Mars");
    assert(mars, "Mars must exist in table");
    assert.notStrictEqual(mars.house, 1, "Missing planet house must not default to 1");
    assert.notStrictEqual(mars.pada, 1, "Missing planet pada must not default to 1");
    assert.notStrictEqual(mars.speedDegDay, 1.0, "Missing planet speed must not default to 1.0");
  });

  await check("2D. customerReport/index.js: Missing yoga details do not default to 'Raja Yoga', 'Fully Active', etc.", async () => {
    const { generateLifeIntelligenceReport } = await import("./src/services/customerReport/index.js");
    const minimalChart = {
      planets: [{ name: "Sun", house: 1, longitude: 10 }],
      houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, sign: "Aries", lordName: "Mars" })),
      ascendantLong: 0,
      timezoneId: "Asia/Kolkata",
      detectedYogas: [{ name: "Custom Yoga" }] // missing category, formation, manifestation, strength
    };

    const report = generateLifeIntelligenceReport(minimalChart, { bypassCache: true });
    const customY = report.yogaAnalysis.find(y => y.name === "Custom Yoga");
    assert(customY, "Custom Yoga must exist");
    assert.notStrictEqual(customY.category, "Raja Yoga", "Missing yoga category must not default to Raja Yoga");
    assert.notStrictEqual(customY.manifestationStatus, "Fully Active", "Missing yoga manifestation must not default to Fully Active");
    assert.notStrictEqual(customY.strengthScore, "Strong", "Missing yoga strength must not default to Strong");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. domainReportEngine.js: No default house 1 substitution
  // ─────────────────────────────────────────────────────────────────────────────
  await check("3. domainReportEngine.js: Domain with no relevant houses does not substitute house 1", () => {
    const code = fs.readFileSync(path.join(__dirname, "src/services/customerReport/domainReportEngine.js"), "utf8");
    assert(!code.includes("const primaryHouse = houses[0] || 1;"), "Must not contain 'const primaryHouse = houses[0] || 1;'");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. evidenceChainBuilder.js: No generic [1, 7, 10] or ['Jupiter'] substitution
  // ─────────────────────────────────────────────────────────────────────────────
  await check("4. evidenceChainBuilder.js: Unknown domain does not substitute [1, 7, 10] or ['Jupiter']", async () => {
    const { buildEvidenceChain } = await import("./src/services/expertPrediction/evidenceChainBuilder.js");
    const chain = buildEvidenceChain("non_existent_unsupported_domain_xyz", {
      ascendant: { sign: "Aries", longitude: 15.0 },
      houseLords: { 1: "Mars", 7: "Venus", 10: "Saturn" }
    }, { mdLord: "Sun" });

    const houseNode = chain.evidenceNodes.find(n => n.nodeId.includes("ev_3_house"));
    assert(houseNode, "House node should exist");
    assert(!houseNode.description.includes("1, 7, 10"), "Unknown domain must not substitute generic houses [1, 7, 10]");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. evidenceRetriever.js: No planet.house || 1 fallback
  // ─────────────────────────────────────────────────────────────────────────────
  await check("5. evidenceRetriever.js: Missing planet house is not converted to 1", () => {
    const code = fs.readFileSync(path.join(__dirname, "src/services/questionAnswer/evidenceRetriever.js"), "utf8");
    assert(!code.includes("const h1 = p1.house || 1;"), "Must not contain 'const h1 = p1.house || 1;'");
    assert(!code.includes("const h2 = p2.house || 1;"), "Must not contain 'const h2 = p2.house || 1;'");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. consultationEngine.js: evaluateSpouseFamilyWealth returns INSUFFICIENT_DATA
  // ─────────────────────────────────────────────────────────────────────────────
  await check("6. consultationEngine.js: evaluateSpouseFamilyWealth returns INSUFFICIENT_DATA when chart facts absent", async () => {
    const { evaluateSpouseFamilyWealth } = await import("./src/services/consultationEngine.js");
    const resEmpty = evaluateSpouseFamilyWealth({});
    assert.strictEqual(resEmpty.classification, "INSUFFICIENT_DATA", "Must return INSUFFICIENT_DATA for empty chartData");
    assert.strictEqual(resEmpty.confidence, "INSUFFICIENT_DATA", "Must return confidence INSUFFICIENT_DATA for empty chartData");

    const resNoPlanets = evaluateSpouseFamilyWealth({ planets: [] });
    assert.strictEqual(resNoPlanets.classification, "INSUFFICIENT_DATA", "Must return INSUFFICIENT_DATA for empty planets array");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. empiricalEvaluationEngine.js: No 0.842 or 1950 fallbacks
  // ─────────────────────────────────────────────────────────────────────────────
  await check("7A. empiricalEvaluationEngine.js: Empty cohort does not fallback to 0.842", () => {
    const code = fs.readFileSync(path.join(__dirname, "src/services/realWorldValidation/empiricalEvaluationEngine.js"), "utf8");
    assert(!code.includes("total > 0 ? events / total : 0.842;"), "Must not contain fallback base rate 0.842");
  });

  await check("7B. empiricalEvaluationEngine.js: Missing birth year does not silently fallback to 1950", () => {
    const code = fs.readFileSync(path.join(__dirname, "src/services/realWorldValidation/empiricalEvaluationEngine.js"), "utf8");
    assert(!code.includes("const bYear = r.birthYear || 1950;"), "Must not contain 'const bYear = r.birthYear || 1950;'");
    assert(!code.includes("const bYear = record.birthYear || 1950;"), "Must not contain 'const bYear = record.birthYear || 1950;'");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. discreteHazardSurvivalEngine.js: No currentAge || 45.0 fallback
  // ─────────────────────────────────────────────────────────────────────────────
  await check("8. discreteHazardSurvivalEngine.js: Missing currentAge does not silently impute 45.0", () => {
    const code = fs.readFileSync(path.join(__dirname, "src/services/realWorldValidation/discreteHazardSurvivalEngine.js"), "utf8");
    assert(!code.includes("const cAge = rec.currentAge || 45.0;"), "Must not contain 'const cAge = rec.currentAge || 45.0;'");
  });

  console.log("\n" + "=".repeat(75));
  console.log(` SUMMARY: ${passed} passed, ${failed} failed.`);
  console.log("=".repeat(75) + "\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
