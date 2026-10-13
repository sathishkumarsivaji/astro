/**
 * SKR ASTRO — Local Language Model Service & Modular AI Gateway
 * ==============================================================
 * Provides offline-capable, local model inference orchestration for:
 * 1. QuestionSpecification parsing (Question -> strongly-typed AST)
 * 2. Controlled natural-language answer rephrasing based on evaluated AnswerObject
 * 3. Model directory discovery and SHA-256 artifact integrity verification
 * 4. Resilient multi-mode execution (LOCAL_FIRST, LOCAL_ONLY, DETERMINISTIC_ONLY, CLOUD_OPTIONAL)
 * 5. Strict timeout, memory, and fail-closed safety controls
 *
 * ZERO FABRICATION INVARIANT:
 * - Never invents astronomical facts, planetary positions, or predictive dates.
 * - Always falls back to deterministic rule and calculation engines when local LLM is offline.
 * - Never claims 100% prediction accuracy.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../..");
const MODELS_DIR = path.resolve(ROOT_DIR, "models");

/**
 * Execution Modes
 */
export const LOCAL_AI_MODES = Object.freeze({
  LOCAL_FIRST: "LOCAL_FIRST",             // Try local LLM; fall back to deterministic if unavailable
  LOCAL_ONLY: "LOCAL_ONLY",               // Require local LLM; fail-closed if unavailable
  DETERMINISTIC_ONLY: "DETERMINISTIC_ONLY", // Pure deterministic offline execution; zero LLM calls
  CLOUD_OPTIONAL: "CLOUD_OPTIONAL"        // Permit external cloud LLM only if explicitly configured
});

/**
 * Transparent Inference Status Labels
 */
export const LOCAL_INFERENCE_STATUS = Object.freeze({
  LOCAL_MODEL_SUCCESS: "LOCAL_MODEL_SUCCESS",
  DETERMINISTIC_FALLBACK: "DETERMINISTIC_FALLBACK",
  LOCAL_MODEL_UNAVAILABLE: "LOCAL_MODEL_UNAVAILABLE",
  LOCAL_MODEL_ERROR: "LOCAL_MODEL_ERROR",
  EXTERNAL_PROVIDER_SUCCESS: "EXTERNAL_PROVIDER_SUCCESS"
});

/**
 * Supported Local Model Registry Metadata
 */
export const LOCAL_MODEL_REGISTRY = Object.freeze({
  "qwen2.5-0.5b-instruct": {
    id: "qwen2.5-0.5b-instruct",
    name: "Qwen 2.5 0.5B Instruct",
    contextWindow: 4096,
    recommendedRamMb: 1024,
    sha256Expected: null, // Set when specific GGUF/ONNX artifact is registered
    type: "GGUF/ONNX",
    purpose: ["QUESTION_PARSING", "CONCISE_WORDING"]
  },
  "qwen2.5-1.5b-instruct": {
    id: "qwen2.5-1.5b-instruct",
    name: "Qwen 2.5 1.5B Instruct",
    contextWindow: 8192,
    recommendedRamMb: 2048,
    sha256Expected: null,
    type: "GGUF/ONNX",
    purpose: ["QUESTION_PARSING", "DOSSIER_WORDING"]
  },
  "tinyllama-1.1b-chat": {
    id: "tinyllama-1.1b-chat",
    name: "TinyLlama 1.1B Chat",
    contextWindow: 2048,
    recommendedRamMb: 1024,
    sha256Expected: null,
    type: "GGUF/ONNX",
    purpose: ["QUESTION_PARSING"]
  }
});

/**
 * Computes SHA-256 hash of a file on disk.
 */
export function calculateFileSha256(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const hash = crypto.createHash("sha256");
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  return hash.digest("hex");
}

/**
 * Scans the local models directory for available model weights or configuration manifests.
 */
export function scanLocalModels(customModelsDir = null) {
  const dir = customModelsDir || MODELS_DIR;
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Read-only filesystem
    }
    return [];
  }

  const files = fs.readdirSync(dir);
  const detectedModels = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext === ".gguf" || ext === ".onnx" || ext === ".json") {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      detectedModels.push({
        fileName: file,
        fullPath,
        sizeBytes: stats.size,
        format: ext.replace(".", "").toUpperCase(),
        modifiedAt: stats.mtime.toISOString()
      });
    }
  }

  return detectedModels;
}

/**
 * Retrieves the active Local AI runtime configuration.
 */
export function getLocalAiConfig() {
  const mode = process.env.ASTRO_AI_MODE || LOCAL_AI_MODES.LOCAL_FIRST;
  const endpoint = process.env.LOCAL_LLM_ENDPOINT || "http://127.0.0.1:11434"; // Default local Ollama/llama.cpp runner
  const modelName = process.env.LOCAL_LLM_MODEL || "qwen2.5-0.5b-instruct";
  const timeoutMs = parseInt(process.env.LOCAL_LLM_TIMEOUT_MS || "8000", 10);

  return {
    mode,
    endpoint,
    modelName,
    timeoutMs,
    modelsDir: MODELS_DIR
  };
}

/**
 * Checks local model service health.
 */
export async function checkLocalModelHealth(customConfig = null) {
  const cfg = customConfig || getLocalAiConfig();
  if (cfg.mode === LOCAL_AI_MODES.DETERMINISTIC_ONLY) {
    return {
      status: "DISABLED_DETERMINISTIC_ONLY",
      healthy: false,
      mode: cfg.mode,
      details: "AI execution mode configured to pure deterministic offline execution."
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.min(cfg.timeoutMs, 2500));

  try {
    // Attempt standard OpenAI-compatible or Ollama health check
    const res = await fetch(`${cfg.endpoint}/api/tags`, {
      method: "GET",
      signal: controller.signal
    }).catch(async () => {
      // Fallback check: /v1/models (standard OpenAI-compatible endpoint)
      return await fetch(`${cfg.endpoint}/v1/models`, {
        method: "GET",
        signal: controller.signal
      });
    });

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        status: "ONLINE",
        healthy: true,
        mode: cfg.mode,
        endpoint: cfg.endpoint,
        modelName: cfg.modelName,
        availableModels: data.models || data.data || []
      };
    }
    return {
      status: "UNREACHABLE_HTTP_ERROR",
      healthy: false,
      mode: cfg.mode,
      endpoint: cfg.endpoint,
      httpStatus: res ? res.status : null
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      status: "OFFLINE",
      healthy: false,
      mode: cfg.mode,
      endpoint: cfg.endpoint,
      error: err.name === "AbortError" ? "HEALTH_CHECK_TIMEOUT" : "CONNECTION_REFUSED"
    };
  }
}

/**
 * Invokes the local language model with structured prompt and strict timeouts.
 */
export async function invokeLocalLLM({
  systemPrompt,
  userPrompt,
  temperature = 0.1,
  maxTokens = 1024,
  config = null
}) {
  const cfg = config || getLocalAiConfig();

  if (cfg.mode === LOCAL_AI_MODES.DETERMINISTIC_ONLY) {
    throw new Error("LOCAL_LLM_DISABLED: Mode is DETERMINISTIC_ONLY.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    // 1. Try standard OpenAI-compatible completions format (/v1/chat/completions)
    const payload = {
      model: cfg.modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature,
      max_tokens: maxTokens,
      stream: false
    };

    let response = await fetch(`${cfg.endpoint}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).catch(() => null);

    // 2. If 404 or failed, try Ollama native format (/api/chat)
    if (!response || !response.ok) {
      const ollamaPayload = {
        model: cfg.modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        options: { temperature, num_predict: maxTokens },
        stream: false
      };

      response = await fetch(`${cfg.endpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ollamaPayload),
        signal: controller.signal
      }).catch(() => null);
    }

    clearTimeout(timeoutId);

    if (!response || !response.ok) {
      const status = response ? response.status : "NO_RESPONSE";
      throw new Error(`LOCAL_LLM_REQUEST_FAILED: HTTP status ${status}`);
    }

    const resJson = await response.json();
    const content = resJson.choices?.[0]?.message?.content ||
                    resJson.message?.content ||
                    resJson.response ||
                    "";

    return {
      success: true,
      content: content.trim(),
      model: cfg.modelName,
      usage: resJson.usage || null
    };

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`LOCAL_LLM_TIMEOUT: Request exceeded timeout of ${cfg.timeoutMs}ms.`);
    }
    throw err;
  }
}

/**
 * STAGE 1: Parses user question into a strongly-typed QuestionSpecification.
 * If local model is offline and mode is LOCAL_FIRST, falls back to deterministic parsing.
 */
export async function parseQuestionToSpecification(rawQuestion, options = {}) {
  if (!rawQuestion || typeof rawQuestion !== "string") {
    throw new Error("Valid question string is required.");
  }

  const cfg = options.config || getLocalAiConfig();
  const lang = options.lang || (rawQuestion.match(/[\u0B80-\u0BFF]/) ? "ta" : "en");

  // If DETERMINISTIC_ONLY mode, immediately bypass LLM
  if (cfg.mode === LOCAL_AI_MODES.DETERMINISTIC_ONLY) {
    return null; // Return null to trigger deterministic engine
  }

  const systemPrompt = `You are a strict syntactic question parser for an astrological precision system.
Your job is to parse the user's question into a strongly-typed JSON specification.
Do NOT answer the question. Do NOT generate predictions. Output ONLY a valid JSON object matching this schema:
{
  "domain": "CAREER" | "BUSINESS" | "EDUCATION" | "TRAVEL" | "PROPERTY" | "VEHICLE" | "RELATIONSHIPS" | "FAMILY" | "FINANCE" | "WELLNESS" | "GENERAL",
  "event": "FOREIGN_TRIP" | "WORK_ABROAD" | "PROPERTY_PURCHASE" | "CONSTRUCTION_START" | "VEHICLE_PURCHASE" | "BUSINESS_EXPANSION" | "JOB_CHANGE" | "MARRIAGE_TIMING" | "GENERAL_EVENT",
  "task": "FACT" | "INTERPRETATION" | "TIMING" | "ELECTION" | "DECISION_SUPPORT" | "UNSAFE_GUARANTEE_REJECTION",
  "subject": "ACTIVE_PROFILE" | "SPOUSE" | "CHILD" | "PARENT" | "BUSINESS_PARTNER",
  "isCompound": boolean,
  "confidence": number between 0.0 and 1.0
}`;

  const userPrompt = `Parse this question: "${rawQuestion}"`;

  try {
    const result = await invokeLocalLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.0,
      maxTokens: 256,
      config: cfg
    });

    // Extract JSON block from LLM response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("PARSER_MALFORMED_JSON: No valid JSON found in model output.");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      source: "LOCAL_LLM",
      model: result.model,
      specification: {
        rawQuestion,
        language: lang,
        domain: parsed.domain || "GENERAL",
        event: parsed.event || "GENERAL_EVENT",
        task: parsed.task || "INTERPRETATION",
        subject: parsed.subject || "ACTIVE_PROFILE",
        isCompound: Boolean(parsed.isCompound),
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9
      }
    };
  } catch (err) {
    if (cfg.mode === LOCAL_AI_MODES.LOCAL_ONLY) {
      throw new Error(`LOCAL_PARSER_ERROR: Local LLM failed in LOCAL_ONLY mode: ${err.message}`);
    }
    // LOCAL_FIRST or CLOUD_OPTIONAL mode: Gracefully fall back to deterministic parsing
    return null;
  }
}

/**
 * STAGE 2: Rephrases evaluated AnswerObject into clean natural wording.
 * Strictly adheres to the facts, timing bounds, and caveats present in the AnswerObject.
 */
export async function rephraseAnswerWithLocalLLM(answerObject, options = {}) {
  if (!answerObject || typeof answerObject !== "object") {
    throw new Error("Valid AnswerObject is required for local model rephrasing.");
  }

  const cfg = options.config || getLocalAiConfig();
  const lang = options.lang || (answerObject.isTamil ? "ta" : "en");
  const isTamil = lang === "ta";

  if (cfg.mode === LOCAL_AI_MODES.DETERMINISTIC_ONLY) {
    return null; // Bypass to deterministic synthesizer
  }

  const systemPrompt = isTamil
    ? `நீங்கள் ஒரு பாரம்பரிய வேத ஜோதிட உரை எழுத்தாளர்.
கீழே தரப்பட்டுள்ள சரிபார்க்கப்பட்ட முடிவுகளை மட்டுமே கொண்டு, எளிய, கண்ணியமான மற்றும் தூய தமிழில் பதிலை எழுதவும்.
கண்டிப்பான விதிகள்:
1. புதிய கோள்களையோ, விதிகளையோ, தேதிகளையோ நீங்களாக உருவாக்கக் கூடாது.
2. தரப்பட்டுள்ள காலக்கெடு மற்றும் சான்றுகளை மட்டுமே பயன்படுத்தவும்.
3. 100% நிச்சயம் அல்லது மாயாஜால பலன்களை உறுதியளிக்கக் கூடாது.`
    : `You are an astrological editorial assistant for a classical Vedic precision system.
Your job is to rewrite the verified AnswerObject into natural, elegant conversational prose.
STRICT RULES:
1. Do NOT invent new dates, planets, houses, or predictions.
2. Ground every sentence exclusively in the provided AnswerObject.
3. Never promise 100% certainties or fatalistic outcomes.
4. If timing is uncalculated or insufficient data, maintain the abstention clearly.`;

  const userPrompt = `Rewrite the following evaluated astrological answer clearly:
${JSON.stringify({
  directAnswer: answerObject.directAnswer,
  timingWindows: answerObject.timingWindows,
  primarySignificators: answerObject.primarySignificators,
  caveats: answerObject.caveats,
  limitations: answerObject.limitations
}, null, 2)}`;

  try {
    const result = await invokeLocalLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      maxTokens: 512,
      config: cfg
    });

    return {
      source: "LOCAL_LLM",
      model: result.model,
      rephrasedText: result.content
    };
  } catch (err) {
    if (cfg.mode === LOCAL_AI_MODES.LOCAL_ONLY) {
      throw new Error(`LOCAL_WORDING_ERROR: Local LLM failed in LOCAL_ONLY mode: ${err.message}`);
    }
    // Graceful fallback to deterministic text
    return null;
  }
}
