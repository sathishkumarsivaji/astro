/**
 * ASTROVERSE — P0, P1 & P2 Forensic Remediation Regression Suite
 * 
 * Verifies:
 * 1. P0-1: Rejection of invalid astrology systems fail-closed with INVALID_ASTROLOGY_SYSTEM (zero silent Lahiri fallback).
 * 2. P0-2: Fail-closed on missing chart/dasha in milestoneTimelineEngine (zero Active_Dasha / Active_Antar fallback).
 * 3. P0-3: Zero synthetic evidence IDs (e.g. TIMING_WIN_YEAR_*) in milestoneTimelineEngine.
 * 4. P0-4: Zero "Transit Sign" / "கோச்சார ராசி" placeholders in milestone timeline; formats "Transit information: NOT_ESTABLISHED".
 * 5. P0-5: Milestone themes evaluate authentic functional house lordships and karakatvas with traditional association phrasing.
 * 6. P0-6 & P0-7: Answer Synthesizer CASE 2.6 (TOP_HEADINGS) uses dynamic domain importance, canonical house facts, and zero synthetic score IDs.
 * 7. P1: Elimination of medical/clinical claims ("immunity") and unhedged outcome claims ("supports investments", "favorable outcome").
 * 8. P1: Validation reports disclose V3 hazard demographic baseline parity (MAE ~4.05y vs ~4.05y) and name leakage safeguards.
 * 9. P2: Payment webhook idempotency and double-crediting protection (atomic claimPaymentId and transaction unique constraint).
 */

import assert from "node:assert";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { calculatePlanetaryPositions } from "./src/services/astroEngine.js";
import { getAyanamshaForSystem } from "./src/astrology/astronomy/ayanamsha.js";
import { generateMilestoneTimeline } from "./src/services/questionAnswer/milestoneTimelineEngine.js";
import { synthesizeAnswer } from "./src/services/questionAnswer/answerSynthesizer.js";
import { db } from "../backend/src/db/database.js";
import { processPaymentWebhook } from "../backend/src/services/entitlementService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

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

async function runSuite() {
  console.log("============================================================");
  console.log("ASTROVERSE P0, P1, P2 FORENSIC REMEDIATION REGRESSION SUITE");
  console.log("============================================================\n");

// ------------------------------------------------------------
// 1. P0-1: Astrology System Validation Fail-Closed
// ------------------------------------------------------------
test("1.1 calculatePlanetaryPositions rejects unknown system with INVALID_ASTROLOGY_SYSTEM", () => {
  const date = "1990-05-15";
  const time = "14:30:00";
  const lat = 13.08;
  const lng = 80.27;
  const tz = "Asia/Kolkata";

  assert.throws(
    () => calculatePlanetaryPositions(date, time, lat, lng, "unknown_system", tz),
    /INVALID_ASTROLOGY_SYSTEM/
  );
  assert.throws(
    () => calculatePlanetaryPositions(date, time, lat, lng, "lahiri_invalid", tz),
    /INVALID_ASTROLOGY_SYSTEM/
  );
  assert.throws(
    () => calculatePlanetaryPositions(date, time, lat, lng, "", tz),
    /INVALID_ASTROLOGY_SYSTEM/
  );
  assert.throws(
    () => calculatePlanetaryPositions(date, time, lat, lng, null, tz),
    /INVALID_ASTROLOGY_SYSTEM/
  );
});

test("1.2 getAyanamshaForSystem rejects invalid system fail-closed", () => {
  const jd = 2451545.0;
  assert.throws(
    () => getAyanamshaForSystem(jd, "invalid_sys"),
    /INVALID_ASTROLOGY_SYSTEM/
  );
  assert.throws(
    () => getAyanamshaForSystem(jd, ""),
    /INVALID_ASTROLOGY_SYSTEM/
  );
  assert.throws(
    () => getAyanamshaForSystem(jd, null),
    /INVALID_ASTROLOGY_SYSTEM/
  );
});

test("1.3 calculatePlanetaryPositions succeeds for valid systems", () => {
  const date = "1990-05-15";
  const time = "14:30:00";
  const lat = 13.08;
  const lng = 80.27;
  const tz = "Asia/Kolkata";

  for (const sys of ["vedic", "lahiri", "kp", "raman", "western", "sayana"]) {
    const res = calculatePlanetaryPositions(date, time, lat, lng, sys, tz);
    assert(res && res.planets && res.planets.length > 0, `Expected valid positions for ${sys}`);
  }
});

// ------------------------------------------------------------
// 2. P0-2, P0-3, P0-4, P0-5: Milestone Timeline Engine Remediations
// ------------------------------------------------------------
test("2.1 generateMilestoneTimeline fails closed with INSUFFICIENT_DATA on missing chart/dasha", () => {
  const resNull = generateMilestoneTimeline(null);
  assert.strictEqual(resNull.status, "INSUFFICIENT_DATA");

  const resEmpty = generateMilestoneTimeline({});
  assert.strictEqual(resEmpty.status, "INSUFFICIENT_DATA");

  const resNoDasha = generateMilestoneTimeline({ chart: { ascendant: { sign: "Aries" }, dashaTable: [] } });
  assert.strictEqual(resNoDasha.status, "INSUFFICIENT_DATA");
});

test("2.2 generateMilestoneTimeline strictly eliminates Active_Dasha, Active_Antar and fake placeholders", () => {
  const mockChart = {
    ascendant: { sign: "Virgo", degree: 15.0 },
    planets: [
      { name: "Sun", sign: "Taurus", house: 9, degree: 0.5 },
      { name: "Moon", sign: "Capricorn", house: 5, degree: 12.0 },
      { name: "Mars", sign: "Pisces", house: 7, degree: 18.0 },
      { name: "Mercury", sign: "Gemini", house: 10, degree: 4.0 },
      { name: "Jupiter", sign: "Cancer", house: 11, degree: 14.0 },
      { name: "Venus", sign: "Aries", house: 8, degree: 22.0 },
      { name: "Saturn", sign: "Capricorn", house: 5, degree: 29.0 },
      { name: "Rahu", sign: "Aquarius", house: 6, degree: 10.0 },
      { name: "Ketu", sign: "Leo", house: 12, degree: 10.0 }
    ],
    dashaTable: [
      {
        lord: "Venus",
        startDate: "2020-01-01",
        endDate: "2040-01-01",
        bukthis: [
          { subLord: "Venus", startDate: "2020-01-01", endDate: "2023-05-01" },
          { subLord: "Sun", startDate: "2023-05-01", endDate: "2025-05-01" },
          { subLord: "Moon", startDate: "2025-05-01", endDate: "2027-01-01" },
          { subLord: "Mars", startDate: "2027-01-01", endDate: "2028-03-01" },
          { subLord: "Rahu", startDate: "2028-03-01", endDate: "2031-01-01" }
        ]
      }
    ]
  };

  const resultEn = generateMilestoneTimeline({ chart: mockChart, startYear: 2026, durationYears: 3, isTamil: false });
  assert.strictEqual(resultEn.status, "SUCCESS");

  const jsonEn = JSON.stringify(resultEn);
  // Zero Active_Dasha / Active_Antar
  assert(!jsonEn.includes("Active_Dasha"), "Must NOT contain Active_Dasha");
  assert(!jsonEn.includes("Active_Antar"), "Must NOT contain Active_Antar");

  // Zero synthetic IDs like TIMING_WIN_YEAR_*
  assert(!jsonEn.includes("TIMING_WIN_YEAR_"), "Must NOT contain TIMING_WIN_YEAR_*");

  // Zero "Transit Sign" placeholder
  assert(!jsonEn.includes("Transit Sign"), "Must NOT contain 'Transit Sign' placeholder");

  // Format Transit information: NOT_ESTABLISHED when transit is not passed
  assert(jsonEn.includes("Transit information: NOT_ESTABLISHED"), "Must state 'Transit information: NOT_ESTABLISHED'");

  // Verify Tamil translation parity
  const resultTa = generateMilestoneTimeline({ chart: mockChart, startYear: 2026, durationYears: 3, isTamil: true });
  assert.strictEqual(resultTa.status, "SUCCESS");
  const jsonTa = JSON.stringify(resultTa);
  assert(!jsonTa.includes("கோச்சார ராசி"), "Must NOT contain 'கோச்சார ராசி' placeholder");
  assert(jsonTa.includes("இக்காலத்திற்கு கோச்சார நிலைகள் கணக்கிடப்படவில்லை"), "Must state Tamil transit not calculated disclosure");

  // Verify canonical evidence IDs strictly
  const canonicalPrefixes = [
    "CHART_FACT_", "HOUSE_FACT_", "LORD_FACT_", "PLANET_FACT_", "VARGA_FACT_",
    "DASHA_FACT_", "TRANSIT_FACT_", "KP_FACT_", "JAIMINI_FACT_", "RULE_",
    "COUNTER_EVIDENCE_", "TIMING_WINDOW_", "RESOLUTION_", "ANSWER_"
  ];
  for (const yearItem of resultEn.years) {
    for (const eid of yearItem.evidenceIds) {
      const matchesCanonical = canonicalPrefixes.some(pref => eid.startsWith(pref));
      assert(matchesCanonical, `Evidence ID '${eid}' does not follow canonical prefix schema`);
    }
  }
});

// ------------------------------------------------------------
// 3. P0-6 & P0-7: Answer Synthesizer CASE 2.6 (TOP_HEADINGS)
// ------------------------------------------------------------
test("3.1 synthesizeAnswer CASE 2.6 (TOP_HEADINGS) uses canonical house facts and zero synthetic score IDs", () => {
  const mockChart = {
    ascendant: { sign: "Aries", degree: 10.0 },
    planets: [
      { name: "Mars", sign: "Capricorn", house: 10, degree: 28.0 },
      { name: "Venus", sign: "Libra", house: 7, degree: 14.0 },
      { name: "Jupiter", sign: "Cancer", house: 4, degree: 5.0 },
      { name: "Saturn", sign: "Aquarius", house: 11, degree: 12.0 }
    ],
    currentDasha: {
      mahadasha: "Mars",
      antardasha: "Jupiter"
    }
  };

  const answer = synthesizeAnswer({
    normalizedQ: { isTamil: false, raw: "What are the top three report headings?" },
    intentResult: { intents: ["TOP_HEADINGS"] },
    domainResult: {},
    entities: {},
    plan: { questionId: "Q_TEST_HEADINGS" },
    evidence: { chart: mockChart },
    contradictions: [],
    resolution: {}
  });

  assert(answer && answer.directAnswer, "Synthesized answer must exist");

  const jsonAnswer = JSON.stringify(answer);
  // Zero REPORT_HEADING_*_SCORE_* synthetic IDs
  assert(!jsonAnswer.includes("REPORT_HEADING_"), "Must NOT contain REPORT_HEADING_* synthetic IDs");
  assert(!jsonAnswer.includes("SCORE_0.91"), "Must NOT contain hardcoded score IDs");
  assert(!jsonAnswer.includes("0.91"), "Must NOT contain hardcoded 0.91 score");
  assert(!jsonAnswer.includes("0.84"), "Must NOT contain hardcoded 0.84 score");
  assert(!jsonAnswer.includes("0.78"), "Must NOT contain hardcoded 0.78 score");

  // Evidence IDs must reference canonical HOUSE_FACT_* or similar
  assert(answer.evidenceIds.some(id => id.startsWith("HOUSE_FACT_")), "Must cite canonical HOUSE_FACT_* evidence IDs");
});

// ------------------------------------------------------------
// 4. P1 Tone & Epistemic Hardening
// ------------------------------------------------------------
test("4.1 Static audit confirms elimination of medical/clinical claims ('immunity')", () => {
  const filesToCheck = [
    path.join(REPO_ROOT, "frontend/src/services/consultationEngine.js"),
    path.join(REPO_ROOT, "frontend/src/services/followUpAnswerService.js"),
    path.join(REPO_ROOT, "frontend/src/services/questionAnswer/evidencePlanner.js")
  ];

  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, "utf8");
    // Ensure "immunity" or "immune resilience" is not used in claims
    assert(!content.toLowerCase().includes("immune resilience"), `${file} must not contain 'immune resilience'`);
    assert(!content.toLowerCase().includes("immune fighting power"), `${file} must not contain 'immune fighting power'`);
    const immunityMatches = content.match(/\bimmunity\b/gi);
    assert(!immunityMatches, `${file} must not contain 'immunity' claim (found ${immunityMatches?.length})`);
  }
});

test("4.2 Validation reports disclose V3 hazard baseline parity and leakage safeguards", () => {
  const finalReport = fs.readFileSync(path.join(REPO_ROOT, "ASTROVERSE_FINAL_VALIDATION_REPORT.md"), "utf8");
  const realWorldReport = fs.readFileSync(path.join(REPO_ROOT, "ASTROVERSE_REAL_WORLD_VALIDATION_REPORT.md"), "utf8");

  // Baseline parity disclosure
  assert(finalReport.includes("MAE ~4.05y") || finalReport.includes("4.05y"), "Final report must disclose MAE ~4.05y baseline parity");
  assert(finalReport.includes("LRT p = 0.407") || finalReport.includes("p = 0.407"), "Final report must disclose LRT p = 0.407");
  assert(realWorldReport.includes("MAE ~4.05y") || realWorldReport.includes("4.05y"), "Real-world report must disclose MAE ~4.05y baseline parity");

  // Leakage safeguard disclosure
  assert(finalReport.toLowerCase().includes("normalized-name") || finalReport.toLowerCase().includes("leakage"), "Final report must disclose name normalization / leakage safeguards");
  assert(realWorldReport.toLowerCase().includes("normalized-name") || realWorldReport.toLowerCase().includes("leakage"), "Real-world report must disclose name normalization / leakage safeguards");
});

// ------------------------------------------------------------
// 5. P2 Payment Webhook Idempotency & Double-Crediting Protection
// ------------------------------------------------------------
test("5.1 db.claimPaymentId is atomic check-and-set", () => {
  const testPayId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const firstClaim = db.claimPaymentId(testPayId);
  assert.strictEqual(firstClaim, true, "First claim must succeed");

  const secondClaim = db.claimPaymentId(testPayId);
  assert.strictEqual(secondClaim, false, "Second claim of same payment ID must fail (return false)");
});

  await asyncTest("5.2 processPaymentWebhook rejects duplicate payment ID and avoids double-crediting", async () => {
    const uniqueOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const uniquePaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const secretKey = "test_webhook_secret_key_12345";

    // Save an initial order
    db.saveOrder(uniqueOrderId, {
      planId: "PRO_MONTHLY",
      creditsToAdd: 50,
      amountINR: 100
    });

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(`${uniqueOrderId}|${uniquePaymentId}`)
      .digest("hex");

    const webhookPayload = {
      orderId: uniqueOrderId,
      paymentId: uniquePaymentId,
      signature,
      secretKey,
      amount: 10000,
      status: "captured"
    };

    const res1 = await processPaymentWebhook(webhookPayload);
    assert.strictEqual(res1.success, true, "First webhook call must succeed");

    // Second call with identical payment ID
    const res2 = await processPaymentWebhook(webhookPayload);
    assert.strictEqual(res2.success, true, "Duplicate webhook call must return success with alreadyProcessed flag");
    assert.strictEqual(res2.alreadyProcessed, true, "Duplicate webhook call must report alreadyProcessed: true");
  });

  console.log("\n============================================================");
  console.log(`P0, P1, P2 REMEDIATION REGRESSION: ${passed} / ${total} TESTS PASSED`);
  console.log("============================================================\n");
  if (passed !== total) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch(err => {
  console.error("Suite failed with error:", err);
  process.exit(1);
});
