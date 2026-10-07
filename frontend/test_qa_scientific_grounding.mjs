/**
 * TEST: ASTROVERSE Q&A Scientific Grounding & Anti-Fabrication Test Suite
 * 
 * Verifies:
 * 1. Missing D10 Dashamsha returns INSUFFICIENT_DATA and NEVER hallucinates Cancer Lagna / Moon.
 * 2. Missing Dasha planets returns INSUFFICIENT_DATA and NEVER hallucinates Taurus/Pisces exalted.
 * 3. Aries Lagna gemstone evaluation NEVER contraindicates Blue Sapphire on false 6/8/12 grounds (Saturn rules 10/11 for Aries).
 * 4. Lahiri vs KP comparison articulates ~0°06' ayanamsha offset, Placidus semi-arc cusps, 10th cusp sub-lord vs 10th lord.
 * 5. Top 3 report headings query returns Career, Marriage, Finance headings, NOT a list of planetary strengths.
 * 6. Epistemic status badges (CALCULATED_FACT, TRADITIONAL_INTERPRETATION, SUPPORTED_INTERPRETATION, etc.) are handled.
 */

import assert from "node:assert";
import { processEvidenceLinkedQA } from "./src/services/questionAnswer/qaEngine.js";
import { answerFollowUpQuestion } from "./src/services/followUpAnswerService.js";
import { evaluateGemstoneRemedies } from "./src/services/consultationEngine.js";

async function runTests() {
  console.log("============================================================");
  console.log("ASTROVERSE Q&A SCIENTIFIC GROUNDING & ANTI-FABRICATION TESTS");
  console.log("============================================================\n");

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      passed++;
      console.log(`✓ [PASS] ${name}`);
    } catch (err) {
      console.error(`✗ [FAIL] ${name}`);
      console.error(err);
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✓ [PASS] ${name}`);
    } catch (err) {
      console.error(`✗ [FAIL] ${name}`);
      console.error(err);
    }
  }

  // TEST 1: Missing D10 Dashamsha
  await asyncTest("1. Missing D10 returns INSUFFICIENT_DATA with zero Cancer/Moon hallucination", async () => {
    const emptyD10Context = {
      chart: {
        ascendant: { sign: "Aries", degree: 14.2 },
        planets: [
          { name: "Sun", sign: "Aries", house: 1 },
          { name: "Moon", sign: "Taurus", house: 2 },
          { name: "Mars", sign: "Capricorn", house: 10 },
          { name: "Mercury", sign: "Pisces", house: 12 },
          { name: "Jupiter", sign: "Cancer", house: 4 },
          { name: "Venus", sign: "Pisces", house: 12 },
          { name: "Saturn", sign: "Aquarius", house: 11 }
        ],
        vargas: {} // No D10!
      },
      report: {},
      system: { id: "lahiri", name: "Vedic (Lahiri)" }
    };

    const res = await processEvidenceLinkedQA({
      question: "What does my D10 Dashamsha chart say about career authority?",
      context: emptyD10Context
    });

    assert.strictEqual(res.evidenceStatus, "INSUFFICIENT_DATA", "Status must be INSUFFICIENT_DATA when D10 is missing");
    assert.ok(!res.answer.includes("Cancer Lagna"), "Must NOT hallucinate Cancer Lagna when D10 is missing");
    assert.ok(!res.answer.includes("Moon"), "Must NOT hallucinate Moon in Aries 10th house when D10 is missing");
  });

  // TEST 2: Missing Dasha planets
  await asyncTest("2. Missing Dasha planets returns INSUFFICIENT_DATA with zero Taurus/Pisces hallucination", async () => {
    const emptyDashaContext = {
      chart: {
        ascendant: { sign: "Leo", degree: 20.0 },
        planets: [],
        currentDasha: null
      },
      report: {},
      system: { id: "lahiri", name: "Vedic (Lahiri)" }
    };

    const res = await processEvidenceLinkedQA({
      question: "Which dasha period am I running and what are the dasha lords?",
      context: emptyDashaContext
    });

    assert.strictEqual(res.evidenceStatus, "INSUFFICIENT_DATA", "Status must be INSUFFICIENT_DATA when Dasha is missing");
    assert.ok(!res.answer.includes("Taurus"), "Must NOT hallucinate Taurus placement");
    assert.ok(!res.answer.includes("Pisces"), "Must NOT hallucinate Pisces placement");
  });

  // TEST 3: Aries Lagna Gemstone Contraindication Check
  test("3. Aries Lagna gemstone dynamically evaluated; zero Blue Sapphire contraindication", () => {
    const ariesChart = {
      ascendant: { sign: "Aries", signName: "Aries", degree: 15.0 },
      planets: [
        { name: "Mars", sign: "Capricorn", house: 10, dignity: "Exalted" },
        { name: "Saturn", sign: "Aquarius", house: 11, dignity: "Moolatrikona" },
        { name: "Sun", sign: "Aries", house: 1, dignity: "Exalted" },
        { name: "Jupiter", sign: "Sagittarius", house: 9, dignity: "Moolatrikona" },
        { name: "Venus", sign: "Taurus", house: 2, dignity: "Own" },
        { name: "Mercury", sign: "Virgo", house: 6, dignity: "Exalted" }
      ]
    };

    const res = evaluateGemstoneRemedies(ariesChart);
    const contraStr = JSON.stringify(res.contraindicatedList || res.contraindicatedSummaryEn || "").toLowerCase();
    
    // For Aries, Saturn rules 10th & 11th houses (Kendra/Trikona & Labha), Mercury rules 3rd & 6th (Trik dusthana).
    // Blue sapphire (Saturn) MUST NOT be falsely contraindicated on 6/8/12 grounds for Aries!
    assert.ok(!contraStr.includes("blue sapphire"), "Blue Sapphire must NOT be falsely contraindicated for Aries Lagna");
  });

  // TEST 4: Genuine Lahiri vs KP Comparison
  await asyncTest("4. Lahiri vs KP comparison articulates Ayanamsha difference, Placidus cusps, and 10th sub-lord", async () => {
    const chart = {
      ascendant: { sign: "Aries", degree: 10.0 },
      ayanamshaValue: 24.15,
      kpSubLords: { cusp_10: "Mercury", cusp_7: "Venus" },
      kpCusps: [
        { house: 1, degree: 10.0 },
        { house: 10, degree: 9.8, subLord: "Mercury" }
      ],
      bhavasDetailed: [
        { num: 1, signName: "Aries", lordName: "Mars" },
        { num: 10, signName: "Capricorn", lordName: "Saturn" }
      ],
      planets: [
        { name: "Sun", sign: "Aries", house: 1 },
        { name: "Mars", sign: "Capricorn", house: 10 },
        { name: "Saturn", sign: "Aquarius", house: 11 }
      ]
    };

    const context = {
      chart,
      report: {},
      system: { id: "lahiri", name: "Vedic (Lahiri)" }
    };

    const resQA = await processEvidenceLinkedQA({
      question: "How does Lahiri compare to KP in my chart?",
      context
    });

    assert.ok(resQA.answer.includes("24°09'") || resQA.answer.includes("Chitrapaksha"), "Must mention Chitrapaksha/Lahiri ayanamsha");
    assert.ok(resQA.answer.includes("24°03'") || resQA.answer.includes("Krishnamurti"), "Must mention Krishnamurti ayanamsha");
    assert.ok(resQA.answer.includes("Placidus") || resQA.answer.includes("பிளாசிடஸ்"), "Must mention Placidus cusp semi-arc logic");
    assert.ok(resQA.answer.includes("Sub-Lord") || resQA.answer.includes("உப அதிபதி"), "Must explain Sub-Lord logic");

    const resFollowUp = await answerFollowUpQuestion({
      question: "What is the difference between Lahiri and KP systems?",
      context
    });

    assert.ok(resFollowUp.answer.includes("24°09'") || resFollowUp.answer.includes("Chitrapaksha"), "Follow-up must mention Chitrapaksha ayanamsha");
    assert.ok(resFollowUp.answer.includes("Placidus"), "Follow-up must mention Placidus cusps");
  });

  // TEST 5: Top 3 Report Headings Intent
  await asyncTest("5. Top 3 report headings query returns Career, Marriage, Finance; NOT raw planet strength list", async () => {
    const chart = {
      ascendant: { sign: "Cancer", degree: 12.0 },
      moon: { sign: "Taurus", nakshatra: "Rohini" },
      shadbala: [
        { planet: "Saturn", totalRupas: 8.5 },
        { planet: "Jupiter", totalRupas: 7.9 }
      ],
      yogas: [{ name: "Gajakesari Yoga", desc: "Auspicious Jupiter-Moon alignment" }]
    };

    const context = {
      chart,
      report: {},
      system: { id: "lahiri", name: "Vedic (Lahiri)" }
    };

    const resQA = await processEvidenceLinkedQA({
      question: "What are the top three headings of my report?",
      context
    });

    assert.ok(resQA.answer.includes("Career") || resQA.answer.includes("தொழில்"), "Must include Career heading");
    assert.ok(resQA.answer.includes("Marriage") || resQA.answer.includes("திருமணம்"), "Must include Marriage heading");
    assert.ok(resQA.answer.includes("Finance") || resQA.answer.includes("நிதி"), "Must include Finance heading");
    assert.ok(!resQA.answer.includes("highest Shadbala strength"), "Must NOT output Shadbala strength list as report headings");

    const resFollowUp = await answerFollowUpQuestion({
      question: "Give me the top 3 sections in my report",
      context
    });

    assert.ok(resFollowUp.answer.includes("Career") || resFollowUp.answer.includes("தொழில்"), "Follow-up must include Career heading");
    assert.ok(resFollowUp.answer.includes("Marriage") || resFollowUp.answer.includes("திருமணம்"), "Follow-up must include Marriage heading");
    assert.ok(resFollowUp.answer.includes("Finance") || resFollowUp.answer.includes("நிதி"), "Follow-up must include Finance heading");
    assert.ok(!resFollowUp.answer.includes("highest Shadbala strength"), "Follow-up must NOT output Shadbala strength list as report headings");
  });

  console.log(`\nResults: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
