/**
 * Health & Wellness Safety Layer
 * PREVENTS unsafe health language in predictions.
 */

import { HEALTH_FORBIDDEN_TERMS, HEALTH_SAFE_PATTERNS } from './expertPredictionSchema.js';

/**
 * Scans text for forbidden terms and returns a sanitized version.
 * @param {string} text 
 * @returns {{sanitized: string, violations: string[]}}
 */
export function sanitizeHealthText(text) {
  if (!text) return { sanitized: text, violations: [] };
  let sanitized = text;
  const violations = [];

  for (const term of HEALTH_FORBIDDEN_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    if (regex.test(sanitized)) {
      violations.push(term);
      sanitized = sanitized.replace(regex, '[RESTRICTED_TERM_REMOVED]');
    }
  }

  return { sanitized, violations };
}

/**
 * Creates safe narrative using templates for a given body region and window.
 * @param {Object} bodyRegion - From BODY_REGION_REGISTRY
 * @param {Object} window - Timing window object
 * @param {boolean} isTamil - Language flag
 * @returns {string} Safe health narrative
 */
export function buildSafeHealthNarrative(bodyRegion, window, isTamil) {
  if (!bodyRegion) {
    return isTamil 
      ? HEALTH_SAFE_PATTERNS.GENERAL_PREVENTION_TA
      : HEALTH_SAFE_PATTERNS.GENERAL_PREVENTION_EN;
  }
  
  return isTamil ? bodyRegion.safeDescriptionTa : bodyRegion.safeDescriptionEn;
}

/**
 * Final validation gate for health domain output.
 * @param {Object} domainResult - The complete health domain result
 * @returns {{isValid: boolean, violations: string[]}}
 * @throws Will throw an error if any violations are found.
 */
export function validateHealthOutput(domainResult) {
  const violations = [];
  
  // Recursively check all string properties in the domain result
  function checkNode(node) {
    if (typeof node === 'string') {
      const { violations: foundViolations } = sanitizeHealthText(node);
      violations.push(...foundViolations);
    } else if (Array.isArray(node)) {
      node.forEach(checkNode);
    } else if (node && typeof node === 'object') {
      Object.values(node).forEach(checkNode);
    }
  }

  checkNode(domainResult);

  if (violations.length > 0) {
    throw new Error(`Health safety violation detected. Found restricted terms: ${violations.join(', ')}`);
  }

  return { isValid: true, violations };
}
