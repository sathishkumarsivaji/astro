/**
 * SKR ASTRO — Offline Deterministic Fallback Verification Suite
 * ==============================================================
 * Verifies that when the local LLM daemon is offline, unreachable,
 * or stopped, the system gracefully falls back to deterministic parsing
 * and rendering without unhandled exceptions or service disruption.
 */

import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  getLocalAiConfig,
  checkLocalModelHealth,
  parseQuestionToSpecification,
  rephraseAnswerWithLocalLLM,
  LOCAL_INFERENCE_STATUS
} from "../src/services/localAiService.js";

async function runOfflineFallbackTests() {
  console.log("\n===========================================================================");
  console.log(" SKR ASTRO: OFFLINE DETERMINISTIC FALLBACK VERIFICATION SUITE");
  console.log("===========================================================================\n");

  const offlineConfig = {
    ...getLocalAiConfig(),
    endpoint: "http://127.0.0.1:59999", // Deliberately unreachable port
    timeoutMs: 1500
  };

  console.log("--- TEST 1: HEALTH CHECK ON UNREACHABLE ENDPOINT ---");
  const health = await checkLocalModelHealth(offlineConfig);
  console.log(`• Reported Status:  ${health.status}`);
  console.log(`• Reported Healthy: ${health.healthy}`);
  assert.equal(health.healthy, false, "Offline endpoint must report healthy === false");
  assert.equal(health.status, "OFFLINE", "Offline endpoint status must be OFFLINE");
  console.log("✓ Health check accurately reports OFFLINE without throwing.\n");

  console.log("--- TEST 2: QUESTION PARSING FALLBACK (ENGLISH & TAMIL) ---");
  const testCases = [
    {
      query: "When will my career promotion or job transition occur?",
      expectedDomain: "CAREER",
      expectedLang: "en"
    },
    {
      query: "எனது திருமண காலம் எப்போது அமையும்?",
      expectedDomain: "MARRIAGE",
      expectedLang: "ta"
    },
    {
      query: "When is my auspicious time to purchase real estate or a house?",
      expectedDomain: "PROPERTY",
      expectedLang: "en"
    },
    {
      query: "குழந்தை பிறப்பு மற்றும் சந்ததி விருத்தி எப்போது நடக்கும்?",
      expectedDomain: "FAMILY",
      expectedLang: "ta"
    }
  ];

  for (const tc of testCases) {
    const start = performance.now();
    const result = await parseQuestionToSpecification(tc.query, { config: offlineConfig });
    const elapsed = Math.round(performance.now() - start);

    console.log(`• Query: "${tc.query}"`);
    console.log(`  -> Source:    ${result.source}`);
    console.log(`  -> Status:    ${result.inferenceStatus}`);
    console.log(`  -> Latency:   ${elapsed} ms`);
    console.log(`  -> Domain:    ${result.specification.domain}`);
    console.log(`  -> Language:  ${result.specification.language}`);

    assert.equal(result.inferenceStatus, LOCAL_INFERENCE_STATUS.DETERMINISTIC_FALLBACK, "Must report DETERMINISTIC_FALLBACK");
    assert.equal(result.source, "DETERMINISTIC_PARSER", "Must originate from DETERMINISTIC_PARSER");
    assert.equal(result.specification.domain, tc.expectedDomain, `Domain should match ${tc.expectedDomain}`);
    assert.equal(result.specification.language, tc.expectedLang, `Language should match ${tc.expectedLang}`);
  }
  console.log("✓ All queries cleanly fell back to deterministic parser with correct domain extraction.\n");

  console.log("--- TEST 3: ANSWER REPHRASING FALLBACK ON UNREACHABLE ENDPOINT ---");
  const sampleAnswerObject = {
    domain: "CAREER",
    directAnswer: "Career advancement window is anticipated between 2027 and 2028.",
    timingWindows: [{ startYear: 2027, endYear: 2028 }],
    primarySignificators: ["10th lord Sun in Kendra"],
    caveats: ["Subject to individual effort and interview outcomes"],
    limitations: ["Astrological indications define favorable timing windows, not deterministic guarantees."]
  };

  const rephraseResult = await rephraseAnswerWithLocalLLM(sampleAnswerObject, {
    config: offlineConfig,
    lang: "en"
  });

  console.log(`• Rephrase result on unreachable runtime: ${rephraseResult === null ? "null (fallback to deterministic)" : JSON.stringify(rephraseResult)}`);
  assert.equal(rephraseResult, null, "In LOCAL_FIRST mode, unreachable runtime must return null to allow deterministic synthesizer to take over.");
  console.log("✓ Answer rephrasing gracefully yields null to deterministic engine.\n");

  console.log("===========================================================================");
  console.log(" ALL OFFLINE FALLBACK TESTS COMPLETED SUCCESSFULLY (100% PASS)");
  console.log("===========================================================================\n");
}

runOfflineFallbackTests().catch(err => {
  console.error("Offline fallback test failed:", err);
  process.exit(1);
});
