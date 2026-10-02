/**
 * ASTROVERSE — Authoritative Unified API Client
 *
 * Single environment-aware HTTP client for all frontend API communication.
 * Eliminates ad-hoc localhost URL fallbacks and provides standard timeouts,
 * cookie credentials, and structured JSON parsing.
 */

const rawBaseUrl = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

/**
 * Returns full qualified URL for an API endpoint path
 */
export function apiUrl(path) {
  if (!path.startsWith("/")) {
    throw new Error(`API path must start with "/": ${path}`);
  }
  return `${API_BASE_URL}${path}`;
}

/**
 * Executes a fetch request with environment base URL, credentials, and timeout
 */
export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type") && !(typeof FormData !== "undefined" && options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 30_000;
  const timeoutId = typeof window !== "undefined" && window.setTimeout
    ? window.setTimeout(() => controller.abort(new Error("Request timed out")), timeoutMs)
    : setTimeout(() => controller.abort(new Error("Request timed out")), timeoutMs);

  let onCallerAbort = null;
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort(options.signal.reason);
    } else {
      onCallerAbort = () => controller.abort(options.signal.reason);
      options.signal.addEventListener("abort", onCallerAbort, { once: true });
    }
  }

  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal
    });
    return response;
  } finally {
    if (options.signal && onCallerAbort) {
      options.signal.removeEventListener("abort", onCallerAbort);
    }
    if (typeof window !== "undefined" && window.clearTimeout) {
      window.clearTimeout(timeoutId);
    } else {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Executes an API request and parses JSON payload, throwing on non-2xx status
 */
export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
  let payload = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      payload = { error: "Failed to parse JSON response" };
    }
  } else {
    payload = { error: await response.text() };
  }

  if (!response.ok) {
    const error = new Error(
      payload?.error || payload?.message || `API request failed: ${response.status}`
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
