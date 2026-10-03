/**
 * ASTROVERSE — Expert Prediction System Entry Point
 * ===================================================
 *
 * Public API for the Expert Mode prediction layer.
 *
 * Usage:
 *   import { generateExpertReport } from './services/expertPrediction';
 *   const report = generateExpertReport(chartData, 'en');
 *
 * Architecture:
 *   This system is a CONSUMER of the existing validated astrology engine.
 *   Zero modifications to existing validated calculation logic.
 *   All existing regression tests remain unchanged and passing.
 */

// Re-export schema types for consumers
export {
  RESOLUTION, RESOLUTION_RANK, SUB_PHASE_STATUS, CONFIDENCE_TYPE,
  DOMAIN, ALL_DOMAINS,
  DOMAIN_HOUSES, DOMAIN_KARAKAS, DOMAIN_VARGAS, DOMAIN_SUB_PHASES,
  createTimingWindow, createDomainResult, createExpertReport,
  createEvidenceNode, createIndependenceGroup,
  HEALTH_FORBIDDEN_TERMS, HEALTH_SAFE_PATTERNS
} from "./expertPredictionSchema.js";

// Re-export 17-Domain validation registry
export {
  DOMAIN_VALIDATION_STATUS,
  DOMAIN_VALIDATION_REGISTRY,
  getDomainValidationInfo,
  getAllDomainValidationEntries,
  getDomainValidationSummary
} from "./domainValidationRegistry.js";

// Re-export canonical fact adapter
export { extractCanonicalFacts } from "./canonicalFactAdapter.js";

// Re-export report assembler
export { assembleExpertReport } from "./expertReportAssembler.js";

// Re-export narrative builder
export { buildDomainNarrative, DOMAIN_LABELS, RESOLUTION_LABELS } from "./narrativeBuilder.js";

// Re-export health safety
export { sanitizeHealthText, validateHealthOutput } from "./healthSafetyLayer.js";

// Re-export Life Event and Muhurta Engines
export { calculateLifeEventTiming, runDomainTiming } from "./lifeEventTimingEngine.js";
export { calculateElectionalMuhurta } from "./muhurtaEngine.js";

// ─────────────────────────────────────────────────────────────
// PRIMARY PUBLIC API
// ─────────────────────────────────────────────────────────────

import { assembleExpertReport } from "./expertReportAssembler.js";

/**
 * Generate the complete Expert Mode prediction report.
 *
 * This is the main entry point for the Expert prediction system.
 * It takes a fully calculated chart (from calculateChartBySystem)
 * and produces a comprehensive, evidence-linked, bilingual prediction report
 * covering all 17 life domains.
 *
 * @param {Object} chartData - Output of calculateChartBySystem()
 * @param {string} [lang="en"] - Language: "en" or "ta"
 * @param {Object} [options] - Optional configuration
 * @param {string[]} [options.domains] - Specific domains to compute (default: all)
 * @returns {ExpertReport} Complete expert report with all domain results
 *
 * @example
 * import { generateExpertReport } from './services/expertPrediction';
 * import { calculateChartBySystem } from './astrology';
 *
 * const chart = calculateChartBySystem('lahiri', birthData);
 * const expertReport = generateExpertReport(chart, 'en');
 *
 * // Access specific domains
 * const marriage = expertReport.domainResults.marriage;
 * const property = expertReport.domainResults.property;
 *
 * // Get bilingual narrative
 * console.log(marriage.narrative.en);
 * console.log(marriage.narrative.ta);
 *
 * // Check cross-domain patterns
 * console.log(expertReport.crossDomainAnalysis);
 */
export function generateExpertReport(chartData, lang = "en", options = {}) {
  return assembleExpertReport(chartData, lang, options);
}

/**
 * Generate Expert Mode report for a single domain.
 *
 * @param {Object} chartData - Output of calculateChartBySystem()
 * @param {string} domainId - Domain ID from DOMAIN enum
 * @param {string} [lang="en"] - Language
 * @returns {ExpertReport} Report with single domain result
 */
export function generateDomainReport(chartData, domainId, lang = "en") {
  return assembleExpertReport(chartData, lang, { domains: [domainId] });
}
