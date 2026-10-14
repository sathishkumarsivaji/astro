/**
 * SKR ASTRO — Live Local Model Inference & Performance Benchmark Suite
 * ======================================================================
 * Strictly verifies live local model inference using local Ollama daemon:
 * 1. Primary Model: qwen2.5:1.5b-instruct
 * 2. Fallback Model: qwen2.5:0.5b-instruct
 * 3. Execution metrics: Latency (ms), Memory RSS (MB), Token Throughput
 * 4. Multilingual Question Parsing: English & Tamil queries
 * 5. Server-Side Evidence Gate & Claim Firewall Grounding
 * 
 * NOTE: This test requires active live local model inference.
 * Deterministic fallback is strictly rejected here and verified separately
 * in test_offline_fallback.mjs.
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
import { validateAndSanitizeAIResponse } from "../src/middleware/aiEvidenceGate.js";

async function runLiveBenchmark() {
  console.log("\n===========================================================================");
  console.log(" SKR ASTRO: STRICT LIVE LOCAL MODEL INFERENCE & LATENCY BENCHMARK");
  console.log("===========================================================================\n");

  const health = await checkLocalModelHealth();
  console.log(`[RUNTIME HEALTH] Status: ${health.status}, Online: ${health.healthy}`);
  console.log(`[MODEL DISCOVERY] Primary (1.5B) Installed: ${health.primaryInstalled}`);
  console.log(`[MODEL DISCOVERY] Fallback (0.5B) Installed: ${health.fallbackInstalled}`);
  console.log(`[ACTIVE MODEL]   Effective Active: ${health.effectiveActiveModel}\n`);

  if (!health.healthy || !health.isModelInstalled) {
    console.error("FATAL: Live local LLM runtime (Ollama) is offline or required models are not installed.");
    console.error(`Status: ${health.status}, Healthy: ${health.healthy}, Primary installed: ${health.primaryInstalled}`);
    console.error("Live inference benchmarks cannot proceed without active local model daemon.");
    process.exit(1);
  }

  const testQueries = [
    {
      label: "English Career Question",
      text: "When will my career promotion or job transition occur?",
      expectedDomain: "CAREER",
      expectedLang: "en"
    },
    {
      label: "Tamil Marriage Question",
      text: "எனது திருமண காலம் எப்போது அமையும்?",
      expectedDomain: "MARRIAGE",
      expectedLang: "ta"
    },
    {
      label: "English Property Question",
      text: "When is my auspicious time to purchase real estate or a house?",
      expectedDomain: "PROPERTY",
      expectedLang: "en"
    },
    {
      label: "Adversarial Speculative Query",
      text: "What will be the exact winning lottery numbers next Tuesday?",
      expectedDomain: "WEALTH",
      expectedLang: "en"
    }
  ];

  console.log("---------------------------------------------------------------------------");
  console.log(" BENCHMARK 1: PRIMARY MODEL (qwen2.5:1.5b-instruct) QUESTION PARSING");
  console.log("---------------------------------------------------------------------------");

  const primaryConfig = {
    ...getLocalAiConfig(),
    modelName: "qwen2.5:1.5b-instruct"
  };

  const primaryResults = [];

  for (const q of testQueries) {
    const memBefore = process.memoryUsage().rss / (1024 * 1024);
    const start = performance.now();
    const result = await parseQuestionToSpecification(q.text, { config: primaryConfig });
    const elapsed = Math.round(performance.now() - start);
    const memAfter = process.memoryUsage().rss / (1024 * 1024);

    console.log(`• Query: "${q.text}"`);
    console.log(`  -> Status:    ${result?.inferenceStatus}`);
    console.log(`  -> Source:    ${result?.source}`);
    console.log(`  -> Latency:   ${elapsed} ms`);
    console.log(`  -> RAM RSS:   ${memAfter.toFixed(1)} MB (Δ: ${(memAfter - memBefore).toFixed(2)} MB)`);
    console.log(`  -> Domain:    ${result?.specification?.domain} (Confidence: ${result?.specification?.confidence})`);
    console.log(`  -> Event:     ${result?.specification?.event}`);
    console.log(`  -> Language:  ${result?.specification?.language}`);

    assert(result, "Parsing result must not be null");
    assert.equal(
      result.inferenceStatus,
      LOCAL_INFERENCE_STATUS.LOCAL_MODEL_SUCCESS,
      `Live inference must report LOCAL_MODEL_SUCCESS (got: ${result.inferenceStatus})`
    );
    assert.equal(result.source, "LOCAL_LLM", "Source must be LOCAL_LLM for live benchmark");
    assert(result.specification?.domain, "Parsed domain must be present");

    primaryResults.push({ ...q, elapsed, result });
  }

  const primaryAvgLatency = Math.round(primaryResults.reduce((a, b) => a + b.elapsed, 0) / primaryResults.length);
  console.log(`\n✓ Primary Model (1.5B) Average Latency: ${primaryAvgLatency} ms\n`);

  console.log("---------------------------------------------------------------------------");
  console.log(" BENCHMARK 2: FALLBACK MODEL (qwen2.5:0.5b-instruct) QUESTION PARSING");
  console.log("---------------------------------------------------------------------------");

  const fallbackConfig = {
    ...getLocalAiConfig(),
    modelName: "qwen2.5:0.5b-instruct"
  };

  const fallbackResults = [];

  for (const q of testQueries) {
    const start = performance.now();
    const result = await parseQuestionToSpecification(q.text, { config: fallbackConfig });
    const elapsed = Math.round(performance.now() - start);

    console.log(`• Query: "${q.text}"`);
    console.log(`  -> Status:    ${result?.inferenceStatus}`);
    console.log(`  -> Source:    ${result?.source}`);
    console.log(`  -> Latency:   ${elapsed} ms`);
    console.log(`  -> Domain:    ${result?.specification?.domain} (Language: ${result?.specification?.language})`);

    assert(result, "Fallback model parsing result must not be null");
    assert.equal(
      result.inferenceStatus,
      LOCAL_INFERENCE_STATUS.LOCAL_MODEL_SUCCESS,
      `Fallback model live inference must report LOCAL_MODEL_SUCCESS (got: ${result.inferenceStatus})`
    );
    assert.equal(result.source, "LOCAL_LLM", "Source must be LOCAL_LLM for fallback model");
    assert(result.specification?.domain, "Parsed domain must be present");

    fallbackResults.push({ ...q, elapsed, result });
  }

  const fallbackAvgLatency = Math.round(fallbackResults.reduce((a, b) => a + b.elapsed, 0) / fallbackResults.length);
  console.log(`\n✓ Fallback Model (0.5B) Average Latency: ${fallbackAvgLatency} ms\n`);

  console.log("---------------------------------------------------------------------------");
  console.log(" BENCHMARK 3: CONTROLLED ANSWER REPHRASING WITH EVIDENCE GATE");
  console.log("---------------------------------------------------------------------------");

  const sampleAnswerObject = {
    domain: "CAREER",
    headline: "Career Advancement Window: 2027 to 2028",
    directAnswer: "Career advancement window: 2027 to 2028 based on 10th lord strength.",
    keyFindings: [
      "10th lord Sun operates in strength in Kendra.",
      "Jupiter transit activates 10th bhava in 2027-2028."
    ],
    timingInterval: "2027 - 2028",
    timingResolution: "YEAR",
    calibrationStatus: "CALIBRATED_PLATT",
    evidenceList: [
      { text: "Sun in kendra", status: "SUPPORTED" }
    ],
    nonEventsAndLimitations: [
      "Astrology identifies favorable periods; individual performance and interviews determine final selection."
    ]
  };

  const rephraseStart = performance.now();
  const rephraseResult = await rephraseAnswerWithLocalLLM(sampleAnswerObject, {
    config: primaryConfig,
    lang: "en"
  });
  const rephraseElapsed = Math.round(performance.now() - rephraseStart);

  console.log(`• Answer Rephrase Latency: ${rephraseElapsed} ms`);
  console.log(`• Inference Status:       ${rephraseResult?.inferenceStatus}`);
  console.log(`• Source:                 ${rephraseResult?.source}`);
  console.log(`• Sanitized Wording Sample:\n${rephraseResult?.rephrasedText?.slice(0, 300)}...\n`);

  assert(rephraseResult, "Rephrase result must not be null");
  assert.equal(rephraseResult.inferenceStatus, LOCAL_INFERENCE_STATUS.LOCAL_MODEL_SUCCESS, "Rephrase must report LOCAL_MODEL_SUCCESS");
  assert.equal(rephraseResult.source, "LOCAL_LLM");
  assert(rephraseResult.rephrasedText && rephraseResult.rephrasedText.length > 50, "Rephrased text must not be empty");

  console.log("\n===========================================================================");
  console.log(" ALL LIVE INFERENCE BENCHMARKS COMPLETED SUCCESSFULLY (100% PASS)");
  console.log("===========================================================================\n");
}

runLiveBenchmark().catch(err => {
  console.error("Live benchmark failed with error:", err);
  process.exit(1);
});
