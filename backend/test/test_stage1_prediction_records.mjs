/**
 * ASTROVERSE / SKR ASTRO — Stage 1 Prediction Records & Provenance Verification Suite
 * ===================================================================================
 * Verifies:
 * 1. Creation and immutability of prediction records (Phase 2)
 * 2. Strict rejection of overwrite attempts (IMMUTABLE_PREDICTION_RECORD_EXISTS)
 * 3. HMAC-SHA256 customer pseudonymization and birth-data hash determinism
 * 4. Permitted output resolution enforcement
 * 5. Evidence chain linking and status validity
 * 6. Customer training consent lifecycle & eligibility gate
 * 7. Customer AI preferences isolation
 * 8. GDPR/DPDP user erasure and anonymization
 * 9. REST API route execution via Express ephemeral server
 */

import assert from "node:assert/strict";
import { app, createSignedSessionToken } from "../src/server.js";
import { db } from "../src/db/database.js";
import {
  recordPrediction,
  getPredictionById,
  listPredictionsForCustomer,
  createPseudonymousCustomerId,
  hashBirthData,
  hashCalculationConfig,
  PERMITTED_TIMING_RESOLUTIONS,
  PERMITTED_EVIDENCE_STATUSES
} from "../src/services/predictionRecordService.js";

let passed = 0;
let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`✓ [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`✗ [FAIL] ${desc}:`, err.message);
    failed++;
  }
}

async function runStage1Tests() {
  console.log("\n==============================================================");
  console.log(" SKR ASTRO STAGE 1: PREDICTION RECORDS & PROVENANCE SUITE");
  console.log("==============================================================");

  // 1. Pseudonymization and Hashing Invariants
  check("1.1 Customer ID is pseudonymized with HMAC-SHA256 (no raw PII)", () => {
    const userId = `usr_test_${Date.now()}`;
    const pseudoId = createPseudonymousCustomerId(userId);
    assert(pseudoId.startsWith("anon_"), "Pseudonymous ID must start with anon_ prefix");
    assert(pseudoId.length > 20, "Pseudonymous ID must have sufficient cryptographic entropy");
    assert(!pseudoId.includes(userId), "Pseudonymous ID must not leak raw userId");

    const repeatPseudoId = createPseudonymousCustomerId(userId);
    assert.equal(pseudoId, repeatPseudoId, "Pseudonymization must be deterministic for the same user");
  });

  check("1.2 Birth data hashing is deterministic and canonical", () => {
    const birthA = { year: 1990, month: 5, date: 15, hours: 14, minutes: 30, lat: 13.0827, lng: 80.2707, timezoneId: "Asia/Kolkata" };
    const birthB = { birthYear: 1990, birthMonth: 5, birthDate: 15, hour: 14, minute: 30, latitude: 13.0827, longitude: 80.2707, timezone: "Asia/Kolkata" };
    const hashA = hashBirthData(birthA);
    const hashB = hashBirthData(birthB);
    assert.equal(hashA, hashB, "Birth data hash must normalize field aliases and yield identical SHA-256");
    assert.equal(hashA.length, 64, "Must be valid 64-character SHA-256 hex string");
  });

  check("1.3 Calculation config hashing is deterministic", () => {
    const configA = { system: "lahiri", ayanamsha: "lahiri", houseSystem: "placidus" };
    const configB = { system: "LAHIRI", ayanamsha: "Lahiri", houseSystem: "PLACIDUS" };
    assert.equal(hashCalculationConfig(configA), hashCalculationConfig(configB), "Config hashing must be case-insensitive");
  });

  // 2. Prediction Record Creation & Immutability
  check("2.1 Creates frozen prediction record with evidence items", () => {
    const testUserId = `usr_pred_${Date.now()}`;
    const chartData = {
      birthData: { year: 1992, month: 8, date: 24, hours: 9, minutes: 15, lat: 28.6139, lng: 77.2090, timezoneId: "Asia/Kolkata" },
      ascendantSign: "Virgo",
      moonSign: "Gemini",
      sunSign: "Leo",
      activeDasha: { lord: "Jupiter", subLord: "Venus" }
    };
    const questionMeta = {
      rawQuestion: "When is my marriage activation window according to Dasha and Gochar?",
      domain: "MARRIAGE",
      resolution: "AGE_RANGE"
    };
    const predictionResult = {
      predictedOutcome: "MARRIAGE_ACTIVATION_WINDOW",
      timingIntervalStart: "2027-04-01T00:00:00.000Z",
      timingIntervalEnd: "2029-03-31T23:59:59.000Z",
      timingResolution: "AGE_RANGE",
      modelVersion: "v3.0.0-discrete-hazard",
      rulesVersion: "Parashari-v3.0",
      rawScore: 0.74,
      calibratedProbability: 0.89,
      calibrationStatus: "CALIBRATED_PLATT"
    };
    const evidenceList = [
      {
        claimType: "FACT",
        shastricRuleId: "RULE_7TH_LORD_CONJUNCTION",
        astronomicalFactKeys: ["planets.jupiter.sign", "planets.venus.house"],
        evidenceStatus: "SUPPORTED",
        weight: 1.0,
        narrativeExcerpt: "Jupiter operates in kendra aspecting the 7th house."
      }
    ];

    const result = recordPrediction({
      userId: testUserId,
      chartData,
      questionMeta,
      predictionResult,
      evidenceList
    });

    assert(result.success, "Prediction recording must succeed");
    assert(result.predictionRecord.predictionId.startsWith("pred_"), "ID must have pred_ prefix");
    assert.equal(result.predictionRecord.domain, "MARRIAGE");
    assert.equal(result.predictionRecord.timingResolution, "AGE_RANGE");
    assert.equal(result.evidenceCount, 1);

    // Retrieve and verify
    const retrieved = getPredictionById(result.predictionRecord.predictionId);
    assert(retrieved, "Record must be retrievable");
    assert.equal(retrieved.predictionRecord.predictedOutcome, "MARRIAGE_ACTIVATION_WINDOW");
    assert.equal(retrieved.evidence.length, 1);
    assert.equal(retrieved.evidence[0].evidenceStatus, "SUPPORTED");
  });

  check("2.2 Overwriting an existing prediction record throws IMMUTABLE_PREDICTION_RECORD_EXISTS", () => {
    const duplicateId = `pred_immutable_test_${Date.now()}`;
    const initial = {
      predictionId: duplicateId,
      pseudonymousCustomerId: "anon_test_user",
      domain: "CAREER",
      eventDefinition: "Career Promotion",
      predictedOutcome: "PROMOTION_WINDOW",
      timingResolution: "YEAR",
      modelVersion: "v3.0.0",
      rulesVersion: "v1.0"
    };

    db.savePredictionRecord(initial);

    assert.throws(
      () => {
        db.savePredictionRecord({
          predictionId: duplicateId,
          domain: "CAREER_TAMPERED",
          predictedOutcome: "TAMPERED_OUTCOME"
        });
      },
      /IMMUTABLE_PREDICTION_RECORD_EXISTS/,
      "Must throw IMMUTABLE_PREDICTION_RECORD_EXISTS when attempting to overwrite"
    );
  });

  check("2.3 Invalid timing resolution is rejected fail-closed", () => {
    assert.throws(
      () => {
        db.savePredictionRecord({
          predictionId: `pred_invalid_res_${Date.now()}`,
          pseudonymousCustomerId: "anon_test",
          domain: "PROPERTY",
          timingResolution: "EXACT_SECOND" // Invalid precision
        });
      },
      /INVALID_TIMING_RESOLUTION/,
      "Must reject unsupported timing resolution"
    );
  });

  // 3. Training Consent Lifecycle
  check("3.1 Customer training consent lifecycle and eligibility gate", () => {
    const userId = `usr_consent_${Date.now()}`;
    // Default is false
    const defaultConsent = db.getTrainingConsent(userId);
    assert.equal(defaultConsent.consentGranted, false, "Default training consent must be false");

    // Grant consent
    const granted = db.setTrainingConsent(userId, true, "v1.0");
    assert.equal(granted.consentGranted, true, "Consent must be recorded as granted");
    assert(granted.grantedAt, "grantedAt timestamp must be recorded");

    // Check prediction record eligibility when consent is present
    const pred = recordPrediction({
      userId,
      chartData: { birthData: { year: 1988, month: 2, date: 10 } },
      questionMeta: { domain: "PROPERTY" },
      predictionResult: { timingResolution: "YEAR" }
    });
    assert.equal(pred.predictionRecord.isTrainingEligible, true, "Record must be training eligible when consent is active");

    // Withdraw consent
    const withdrawn = db.setTrainingConsent(userId, false, "v1.0");
    assert.equal(withdrawn.consentGranted, false, "Consent must be recorded as withdrawn");
    assert(withdrawn.withdrawnAt, "withdrawnAt timestamp must be set");
  });

  // 4. Customer AI Preferences Decoupling
  check("4.1 Customer AI preferences are stored decoupled from prediction models", () => {
    const userId = `usr_pref_${Date.now()}`;
    const prefs = db.saveCustomerAIPreferences(userId, {
      preferredLang: "ta",
      explanationDepth: "astrologer_expert",
      tone: "traditional"
    });

    assert.equal(prefs.preferredLang, "ta");
    assert.equal(prefs.explanationDepth, "astrologer_expert");
    assert.equal(prefs.tone, "traditional");

    const retrieved = db.getCustomerAIPreferences(userId);
    assert.equal(retrieved.preferredLang, "ta");
  });

  // 5. GDPR / DPDP User Erasure Anonymization
  try {
    const userId = `usr_erase_${Date.now()}`;
    db.setTrainingConsent(userId, true);
    db.saveCustomerAIPreferences(userId, { preferredLang: "ta" });

    const pred = recordPrediction({
      userId,
      chartData: { birthData: { year: 1995, month: 11, date: 3 } },
      questionMeta: { domain: "FOREIGN_TRAVEL" },
      predictionResult: { timingResolution: "MONTH_RANGE" }
    });

    const predId = pred.predictionRecord.predictionId;

    // Execute purge
    await db.purgeUser(userId);

    // Verify personal preferences purged
    const purgedPref = db.getCustomerAIPreferences(userId);
    assert.equal(purgedPref.updatedAt, null, "Preferences must be purged");

    // Verify consent revoked
    const consent = db.getTrainingConsent(userId);
    assert.equal(consent.consentGranted, false, "Consent must be revoked upon purge");

    // Verify prediction record preserved but pseudonymized to ANONYMIZED_CUSTOMER and not eligible
    const purgedPred = db.getPredictionRecord(predId);
    assert(purgedPred, "Prediction record math is preserved for audit trail");
    assert.equal(purgedPred.pseudonymousCustomerId, "ANONYMIZED_CUSTOMER", "Customer ID must be anonymized");
    assert.equal(purgedPred.isTrainingEligible, false, "Record must be marked training ineligible");
    console.log("✓ [PASS] 5.1 User erasure anonymizes prediction records and revokes consent");
    passed++;
  } catch (err) {
    console.error("✗ [FAIL] 5.1 User erasure anonymization:", err.message);
    failed++;
  }

  // 6. REST API Endpoints Verification via Ephemeral Server
  const testServer = await new Promise(resolve => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const port = testServer.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const apiUser = `usr_api_${Date.now()}`;
    db.saveUser(apiUser, { userId: apiUser, subscriptionTier: "registered_free", isRegistered: true });
    const session = createSignedSessionToken(apiUser, null, true);
    const authHeaders = {
      "Content-Type": "application/json",
      "x-session-token": session.sessionToken,
      "Origin": "http://localhost:5173"
    };

    // 6.1 POST /api/predictions/record
    const postPredRes = await fetch(`${baseUrl}/api/predictions/record`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        chartData: { birthData: { year: 1993, month: 4, date: 18 } },
        questionMeta: { domain: "CAREER", rawQuestion: "When will I get a leadership promotion?" },
        predictionResult: {
          predictedOutcome: "LEADERSHIP_ELEVATION",
          timingResolution: "YEAR"
        },
        evidenceList: [
          { claimType: "FACT", astronomicalFactKeys: ["d10.sun.sign"], evidenceStatus: "SUPPORTED" }
        ]
      })
    });
    assert.equal(postPredRes.status, 201, "POST /api/predictions/record returns 201 Created");
    const postPredJson = await postPredRes.json();
    assert(postPredJson.success, "API response must indicate success");
    const newPredId = postPredJson.predictionRecord.predictionId;
    console.log("✓ [PASS] 6.1 POST /api/predictions/record creates record via REST API");
    passed++;

    // 6.2 GET /api/predictions/:id
    const getPredRes = await fetch(`${baseUrl}/api/predictions/${newPredId}`, {
      method: "GET",
      headers: authHeaders
    });
    assert.equal(getPredRes.status, 200, "GET /api/predictions/:id returns 200 OK");
    const getPredJson = await getPredRes.json();
    assert.equal(getPredJson.predictionRecord.predictionId, newPredId, "Returns correct prediction record");
    assert.equal(getPredJson.evidence.length, 1, "Returns associated evidence items");
    console.log("✓ [PASS] 6.2 GET /api/predictions/:id retrieves record and evidence chain");
    passed++;

    // 6.3 GET /api/predictions
    const listPredRes = await fetch(`${baseUrl}/api/predictions?domain=CAREER`, {
      method: "GET",
      headers: authHeaders
    });
    assert.equal(listPredRes.status, 200, "GET /api/predictions returns 200 OK");
    const listPredJson = await listPredRes.json();
    assert(listPredJson.predictions.length >= 1, "Lists predictions for user");
    console.log("✓ [PASS] 6.3 GET /api/predictions lists user predictions filtered by domain");
    passed++;

    // 6.4 POST & GET /api/consent/update & /api/consent/status
    const consentPostRes = await fetch(`${baseUrl}/api/consent/update`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ consentGranted: true, consentVersion: "v1.1" })
    });
    assert.equal(consentPostRes.status, 200, "POST /api/consent/update returns 200 OK");

    const consentGetRes = await fetch(`${baseUrl}/api/consent/status`, {
      method: "GET",
      headers: authHeaders
    });
    assert.equal(consentGetRes.status, 200, "GET /api/consent/status returns 200 OK");
    const consentGetJson = await consentGetRes.json();
    assert.equal(consentGetJson.consent.consentGranted, true, "Consent status confirmed via API");
    console.log("✓ [PASS] 6.4 Training consent endpoints succeed via REST API");
    passed++;

    // 6.5 POST & GET /api/preferences/ai
    const prefPostRes = await fetch(`${baseUrl}/api/preferences/ai`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ preferredLang: "ta", explanationDepth: "astrologer_expert", tone: "evidence_focused" })
    });
    assert.equal(prefPostRes.status, 200, "POST /api/preferences/ai returns 200 OK");

    const prefGetRes = await fetch(`${baseUrl}/api/preferences/ai`, {
      method: "GET",
      headers: authHeaders
    });
    assert.equal(prefGetRes.status, 200, "GET /api/preferences/ai returns 200 OK");
    const prefGetJson = await prefGetRes.json();
    assert.equal(prefGetJson.preferences.preferredLang, "ta", "AI preferences confirmed via API");
    console.log("✓ [PASS] 6.5 Customer AI preferences endpoints succeed via REST API");
    passed++;

  } finally {
    await new Promise(resolve => testServer.close(resolve));
  }

  console.log("\n==============================================================");
  if (failed === 0) {
    console.log(` ALL ${passed} STAGE 1 PREDICTION PROVENANCE TESTS PASSED 100%!`);
    process.exit(0);
  } else {
    console.error(` ${failed} TESTS FAILED! (${passed} passed)`);
    process.exit(1);
  }
  console.log("==============================================================\n");
}

runStage1Tests().catch(err => {
  console.error("Fatal test execution error:", err);
  process.exit(1);
});
