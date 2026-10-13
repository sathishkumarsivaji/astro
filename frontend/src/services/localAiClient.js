/**
 * SKR ASTRO — Client-Side Local AI Integration Client
 * ====================================================
 * Connects frontend services to the backend Local AI Gateway:
 * 1. Checks local model health and discovery status
 * 2. Requests local model QuestionSpecification parsing
 * 3. Requests local model AnswerObject rephrasing with server Evidence Gate
 * 4. Gracefully degrades to deterministic client engines when backend is offline
 */

import { apiFetch } from "./apiClient.js";

/**
 * Fetches the active status of the Local AI model and discovery directory.
 */
export async function getLocalModelStatus() {
  try {
    const res = await apiFetch("/api/ai/local-status", {
      method: "GET",
      timeoutMs: 1500
    });
    if (res && res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline or unreachable
  }
  return {
    mode: "DETERMINISTIC_OFFLINE",
    health: { healthy: false, status: "BACKEND_UNREACHABLE" },
    detectedModels: []
  };
}

/**
 * Sends user question to backend for local model parsing into QuestionSpecification.
 * If backend/model is offline, returns null to trigger client deterministic parser.
 */
export async function parseQuestionWithLocalModel(question, lang = "en") {
  if (!question || typeof question !== "string") {
    return null;
  }

  try {
    const res = await apiFetch("/api/ai/parse-question", {
      method: "POST",
      body: JSON.stringify({ question, lang }),
      timeoutMs: 3000
    });

    if (res && res.ok) {
      const data = await res.json();
      if (data.success && data.specification) {
        return {
          source: data.source,
          model: data.model,
          specification: data.specification
        };
      }
    }
  } catch {
    // Network or server timeout; seamlessly fall back to client deterministic parser
  }
  return null;
}

/**
 * Requests local model natural rephrasing of an evaluated AnswerObject.
 * Returns null if model is offline or rephrasing fails, falling back to deterministic text.
 */
export async function rephraseAnswerWithLocalModel(answerObject, lang = "en", chartContext = null) {
  if (!answerObject || typeof answerObject !== "object") {
    return null;
  }

  try {
    const res = await apiFetch("/api/ai/rephrase-answer", {
      method: "POST",
      body: JSON.stringify({ answerObject, lang, chartContext }),
      timeoutMs: 4000
    });

    if (res && res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        return {
          source: data.source,
          model: data.model,
          text: data.text,
          evidenceGate: data._evidenceGate
        };
      }
    }
  } catch {
    // Fall back to deterministic synthesized text
  }
  return null;
}
