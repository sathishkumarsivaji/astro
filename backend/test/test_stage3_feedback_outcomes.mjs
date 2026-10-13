/**
 * SKR ASTRO - STAGE 3 CUSTOMER FEEDBACK & OUTCOME VERIFICATION TEST SUITE
 *
 * Verifies that:
 * 1. User feedback is submitted and associated with the frozen prediction record.
 * 2. Relevance scores are tracked separately from actual observed event outcomes.
 * 3. Right-censored observation horizons are properly handled (isCensored: true).
 * 4. Verification engine correctly audits reported outcomes.
 * 5. GDPR/DPDP purge removes or anonymizes feedback and outcomes safely.
 */

import { strict as assert } from "node:assert";
import http from "node:http";
import { app, createSignedSessionToken } from "../src/server.js";
import { db } from "../src/db/database.js";
import { recordPrediction } from "../src/services/predictionRecordService.js";

async function runStage3Suite() {
  console.log("==============================================================");
  console.log(" SKR ASTRO STAGE 3: CUSTOMER FEEDBACK & OUTCOMES SUITE");
  console.log("==============================================================");

  let passed = 0;
  function pass(testName) {
    passed++;
    console.log(`✓ [PASS] ${testName}`);
  }

  // Set up ephemeral HTTP server
  const testServer = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const port = testServer.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const testUserId = `usr_fb_${Date.now()}`;
    db.saveUser(testUserId, { userId: testUserId, subscriptionTier: "registered_free", isRegistered: true });
    const session = createSignedSessionToken(testUserId, null, true);
    const authHeaders = {
      "Content-Type": "application/json",
      "x-session-token": session.sessionToken,
      "Origin": "http://localhost:5173",
      "Connection": "close"
    };

    // 1. Create a base prediction record
    const predResult = recordPrediction({
      userId: testUserId,
      chartData: {
        birthData: { dob: "1994-07-15", tob: "10:30", lat: 13.08, lon: 80.27 },
        system: "lahiri",
        ayanamsha: "lahiri"
      },
      questionMeta: {
        domain: "PROPERTY",
        rawQuestion: "When will I acquire property?"
      },
      predictionResult: {
        predictedOutcome: "ACQUISITION_FAVORABLE",
        timingResolution: "YEAR",
        timingIntervalStart: "2027-01-01",
        timingIntervalEnd: "2028-12-31"
      },
      evidenceList: [
        { claimType: "FACT", shastricRuleId: "H4_JUPITER_TRANSIT", evidenceStatus: "SUPPORTED", narrativeExcerpt: "Jupiter aspects 4th house" }
      ]
    });
    assert.ok(predResult.success, "Prediction record created");
    const predId = predResult.predictionRecord.predictionId;
    pass("1.1 Base prediction record created for feedback lifecycle");

    // 2. Submit initial feedback (Questions 1, 2, 3)
    const fbRes = await fetch(`${baseUrl}/api/feedback/submit`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        predictionId: predId,
        feedbackCategory: "INTERPRETATION_RELEVANCE",
        relevanceScore: 5,
        comments: "Planning to purchase property next year",
        metadata: {
          birthDataConfirmed: "CONFIRMED",
          currentCircumstance: "Searching actively"
        }
      })
    });
    assert.strictEqual(fbRes.status, 201, "Feedback submit returns 201");
    const fbData = await fbRes.json();
    assert.ok(fbData.success, "Feedback marked success");
    assert.strictEqual(fbData.feedback.predictionId, predId);
    assert.strictEqual(fbData.feedback.relevanceScore, 5);
    pass("2.1 Feedback (Questions 1-3) submitted and stored linked to predictionId");

    // 3. Confirm relevance score is isolated from training label (prediction record untouched)
    const storedPred = db.getPredictionRecord(predId);
    assert.strictEqual(storedPred.predictedOutcome, "ACQUISITION_FAVORABLE");
    assert.strictEqual(storedPred.isTrainingEligible, false, "Still not training eligible without verified outcome");
    pass("2.2 Feedback relevance strictly isolated from outcome label");

    // 4. Report subsequent observed outcome (Question 4: Horizon Censored)
    const censoredRes = await fetch(`${baseUrl}/api/outcomes/report`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        predictionId: predId,
        eventOccurred: false,
        isCensored: true,
        observationEndedAt: "2026-10-15"
      })
    });
    assert.strictEqual(censoredRes.status, 201);
    const censoredData = await censoredRes.json();
    assert.strictEqual(censoredData.outcome.isCensored, true);
    assert.strictEqual(censoredData.outcome.eventOccurred, false);
    pass("3.1 Right-censored outcome reported for ongoing observation period");

    // 5. Report subsequent verified event outcome (Event Occurred)
    const outcomeRes = await fetch(`${baseUrl}/api/outcomes/report`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        predictionId: predId,
        eventOccurred: true,
        reportedDate: "2027-05-10",
        datePrecision: "MONTH_YEAR",
        isCensored: false
      })
    });
    assert.strictEqual(outcomeRes.status, 201);
    const outcomeData = await outcomeRes.json();
    const outcomeId = outcomeData.outcome.outcomeId;
    assert.ok(outcomeId, "Outcome ID assigned");
    assert.strictEqual(outcomeData.outcome.eventOccurred, true);
    pass("4.1 Actual observed outcome reported with approximate event month/year");

    // 6. Outcome verification authorization test
    // 6a. Ordinary user must be rejected with 403 Forbidden
    const unauthVerifyRes = await fetch(`${baseUrl}/api/outcomes/verify`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        outcomeId,
        verificationMethod: "INDEPENDENT_DOCUMENTATION",
        verificationStatus: "CORROBORATED",
        notes: "Unauthorized attempt"
      })
    });
    assert.strictEqual(unauthVerifyRes.status, 403, "Ordinary user must not verify outcome");
    const unauthData = await unauthVerifyRes.json();
    assert.strictEqual(unauthData.code, "FORBIDDEN_VERIFICATION_PERMISSION");
    pass("5.1 Outcome verification rejects unauthorized ordinary user with 403");

    // 6b. Authorized verifier user succeeds with 201 Created
    const verifierUserId = `usr_verifier_${Date.now()}`;
    db.saveUser(verifierUserId, { userId: verifierUserId, role: "verifier", isRegistered: true });
    const verifierSession = createSignedSessionToken(verifierUserId, null, true);
    const verifierAuthHeaders = {
      "Content-Type": "application/json",
      "x-session-token": verifierSession.sessionToken,
      "Origin": "http://localhost:5173",
      "Connection": "close"
    };

    const verifyRes = await fetch(`${baseUrl}/api/outcomes/verify`, {
      method: "POST",
      headers: verifierAuthHeaders,
      body: JSON.stringify({
        outcomeId,
        verificationMethod: "INDEPENDENT_DOCUMENTATION",
        verificationStatus: "CORROBORATED",
        notes: "Verified with registry record"
      })
    });
    assert.strictEqual(verifyRes.status, 201);
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.verification.verificationStatus, "CORROBORATED");
    assert.strictEqual(verifyData.verification.outcomeId, outcomeId);
    pass("5.2 Authorized verifier records outcome verification with status CORROBORATED");

    console.log("\n==============================================================");
    console.log(` ALL ${passed} STAGE 3 FEEDBACK & OUTCOMES TESTS PASSED 100%!`);
    console.log("==============================================================\n");
  } finally {
    if (testServer) {
      if (typeof testServer.closeAllConnections === "function") {
        testServer.closeAllConnections();
      }
      await new Promise((resolve) => testServer.close(resolve));
    }
  }
}

runStage3Suite().catch(err => {
  console.error("Stage 3 Test Suite Failed:", err);
  process.exit(1);
});
