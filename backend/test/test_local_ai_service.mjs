/**
 * SKR ASTRO — Stage 2b: Local AI Service & Built-In Model Gateway Suite
 * ======================================================================
 * Tests offline local language model service, question understanding,
 * evidence gate integration, and fail-closed safety controls.
 */

import assert from "node:assert/strict";
import { app } from "../src/server.js";
import {
  getLocalAiConfig,
  checkLocalModelHealth,
  scanLocalModels,
  parseQuestionToSpecification,
  rephraseAnswerWithLocalLLM,
  LOCAL_AI_MODES,
  LOCAL_MODEL_REGISTRY,
  calculateFileSha256
} from "../src/services/localAiService.js";
import http from "node:http";

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function runTests() {
  console.log("\n==============================================================");
  console.log(" SKR ASTRO: LOCAL AI SERVICE & OFFLINE GATEWAY SUITE");
  console.log("==============================================================");

  // Test 1: Configuration & Registry Export
  console.log("1. Testing Local AI Configuration & Registry Metadata...");
  const config = getLocalAiConfig();
  assert.ok(config.mode, "Active mode must be defined");
  assert.ok(config.endpoint, "Endpoint must be defined");
  assert.ok(LOCAL_MODEL_REGISTRY["qwen2.5-0.5b-instruct"], "Qwen registry entry exists");
  assert.equal(LOCAL_AI_MODES.LOCAL_FIRST, "LOCAL_FIRST");
  assert.equal(LOCAL_AI_MODES.DETERMINISTIC_ONLY, "DETERMINISTIC_ONLY");
  console.log("✓ Local AI configuration and model registry verified");

  // Test 2: Local Model Directory Scanning
  console.log("2. Testing Local Model Directory Discovery & Integrity...");
  const detected = scanLocalModels();
  assert.ok(Array.isArray(detected), "scanLocalModels returns an array");
  console.log(`✓ Detected ${detected.length} model artifacts in models directory`);

  // Test 3: Health Check Handling (Offline & Disabled Modes)
  console.log("3. Testing Local Model Health Checks & Fallback...");
  const offlineHealth = await checkLocalModelHealth({
    mode: LOCAL_AI_MODES.LOCAL_FIRST,
    endpoint: "http://127.0.0.1:59999", // Intentional offline port
    timeoutMs: 500
  });
  assert.equal(offlineHealth.healthy, false, "Offline runner must report healthy: false");
  assert.equal(offlineHealth.status, "OFFLINE");

  const disabledHealth = await checkLocalModelHealth({
    mode: LOCAL_AI_MODES.DETERMINISTIC_ONLY,
    endpoint: "http://127.0.0.1:11434",
    timeoutMs: 500
  });
  assert.equal(disabledHealth.healthy, false);
  assert.equal(disabledHealth.status, "DISABLED_DETERMINISTIC_ONLY");
  console.log("✓ Offline health check fails gracefully without exceptions");

  // Test 4: Question Specification Parsing Fallback
  console.log("4. Testing Question Parsing Fallback in DETERMINISTIC_ONLY mode...");
  const deterministicParsed = await parseQuestionToSpecification("When will I get married?", {
    config: { mode: LOCAL_AI_MODES.DETERMINISTIC_ONLY }
  });
  assert.equal(deterministicParsed, null, "DETERMINISTIC_ONLY mode must return null for deterministic engine fallback");
  console.log("✓ Question parsing adheres to deterministic fallback policy");

  // Test 5: Rephrasing Fallback
  console.log("5. Testing Answer Rephrasing Fallback...");
  const sampleAnswerObj = {
    directAnswer: "Jupiter Dasha supports career promotion between 2027 and 2029.",
    timingWindows: [{ startDate: "2027-01-01", endDate: "2029-12-31" }],
    caveats: ["Subject to planetary dignity"]
  };
  const rephrasedFallback = await rephraseAnswerWithLocalLLM(sampleAnswerObj, {
    config: { mode: LOCAL_AI_MODES.DETERMINISTIC_ONLY }
  });
  assert.equal(rephrasedFallback, null, "DETERMINISTIC_ONLY mode returns null for deterministic text fallback");
  console.log("✓ Answer rephrasing adheres to deterministic fallback policy");

  // HTTP API Tests
  await startServer();

  try {
    // Test 6: GET /api/ai/local-status
    console.log("6. Testing GET /api/ai/local-status endpoint...");
    const statusRes = await fetch(`${baseUrl}/api/ai/local-status`);
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.ok(statusData.mode);
    assert.ok(statusData.supportedRegistry);
    assert.ok(Array.isArray(statusData.detectedModels));
    console.log("✓ GET /api/ai/local-status returned 200 with runtime diagnostics");

    // Test 7: POST /api/ai/parse-question
    console.log("7. Testing POST /api/ai/parse-question endpoint...");
    const parseRes = await fetch(`${baseUrl}/api/ai/parse-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Will I travel abroad next year?", lang: "en" })
    });
    assert.equal(parseRes.status, 200);
    const parseData = await parseRes.json();
    assert.equal(parseData.success, true);
    assert.ok(parseData.specification);
    assert.ok(parseData.specification.rawQuestion);
    console.log("✓ POST /api/ai/parse-question returned valid QuestionSpecification");

    // Test 8: POST /api/ai/rephrase-answer with Evidence Gate Verification
    console.log("8. Testing POST /api/ai/rephrase-answer with Evidence Gate protection...");
    const authRes = await fetch(`${baseUrl}/api/auth/guest`, { method: "POST" });
    const setCookie = authRes.headers.get("set-cookie") || "";
    const cookiePart = setCookie.split(";")[0] || "";

    const rephraseRes = await fetch(`${baseUrl}/api/ai/rephrase-answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookiePart,
        "Sec-Fetch-Site": "same-origin"
      },
      body: JSON.stringify({
        answerObject: sampleAnswerObj,
        lang: "en",
        chartContext: {
          planets: [{ name: "Jupiter", house: 10, sign: "Sagittarius" }]
        }
      })
    });
    assert.equal(rephraseRes.status, 200);
    const rephraseData = await rephraseRes.json();
    assert.equal(rephraseData.success, true);
    assert.ok(rephraseData.text);
    assert.ok(rephraseData._evidenceGate);
    console.log("✓ POST /api/ai/rephrase-answer validated text through server-side Evidence Gate");

  } finally {
    await stopServer();
  }

  console.log("\n==============================================================");
  console.log(" ALL 8 LOCAL AI SERVICE TESTS PASSED 100%!");
  console.log("==============================================================\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
