/**
 * ASTROVERSE — Expert Report Assembler
 * ======================================
 * Top-level orchestrator that runs ALL domain adapters,
 * assembles the complete Expert Mode report, and performs
 * final validation.
 *
 * Architecture:
 *   chartData → canonicalFactAdapter → domainAdapters → narrativeBuilder → ExpertReport
 */

import { createExpertReport, DOMAIN, ALL_DOMAINS, RESOLUTION, RESOLUTION_RANK, RESOLUTION_LAYERS } from "./expertPredictionSchema.js";
import { DOMAIN_VALIDATION_REGISTRY } from "./domainValidationRegistry.js";
import { extractCanonicalFacts } from "./canonicalFactAdapter.js";
import { buildDomainNarrative, DOMAIN_LABELS } from "./narrativeBuilder.js";

// Domain adapter imports
import { calculateMarriageExpert } from "./domains/marriageDomain.js";
import { calculatePropertyExpert } from "./domains/propertyDomain.js";
import { calculateCareerExpert } from "./domains/careerDomain.js";
import { calculateEducationExpert } from "./domains/educationDomain.js";
import { calculateChildrenExpert } from "./domains/childrenDomain.js";
import { calculateForeignTravelExpert } from "./domains/foreignTravelDomain.js";
import { calculateVehicleExpert } from "./domains/vehicleDomain.js";
import { calculateBusinessExpert } from "./domains/businessDomain.js";
import { calculateJobExpert } from "./domains/jobDomain.js";
import { calculateFinanceExpert } from "./domains/financeDomain.js";
import { calculateFamilyExpert } from "./domains/familyDomain.js";
import { calculateLeadershipExpert } from "./domains/leadershipDomain.js";
import { calculateHealthExpert } from "./domains/healthDomain.js";
import { calculateLegalExpert } from "./domains/legalDomain.js";
import { calculateSpiritualExpert } from "./domains/spiritualDomain.js";
import { calculateCautionExpert } from "./domains/cautionDomain.js";
import { calculateMilestoneExpert } from "./domains/milestoneDomain.js";

// ─────────────────────────────────────────────────────────────
// DOMAIN ADAPTER REGISTRY
// ─────────────────────────────────────────────────────────────

const DOMAIN_ADAPTERS = {
  [DOMAIN.MARRIAGE]:       calculateMarriageExpert,
  [DOMAIN.PROPERTY]:       calculatePropertyExpert,
  [DOMAIN.CAREER]:         calculateCareerExpert,
  [DOMAIN.EDUCATION]:      calculateEducationExpert,
  [DOMAIN.CHILDREN]:       calculateChildrenExpert,
  [DOMAIN.FOREIGN_TRAVEL]: calculateForeignTravelExpert,
  [DOMAIN.VEHICLE]:        calculateVehicleExpert,
  [DOMAIN.BUSINESS]:       calculateBusinessExpert,
  [DOMAIN.JOB]:            calculateJobExpert,
  [DOMAIN.FINANCE]:        calculateFinanceExpert,
  [DOMAIN.FAMILY]:         calculateFamilyExpert,
  [DOMAIN.LEADERSHIP]:     calculateLeadershipExpert,
  [DOMAIN.WELLNESS]:       calculateHealthExpert,
  [DOMAIN.LEGAL]:          calculateLegalExpert,
  [DOMAIN.SPIRITUAL]:      calculateSpiritualExpert,
  // Caution and Milestones need all other results — run after
};

/** Domains that depend on other domain results (run in second pass) */
const DEPENDENT_DOMAINS = {
  [DOMAIN.CAUTION]:    calculateCautionExpert,
  [DOMAIN.MILESTONES]: calculateMilestoneExpert
};

// ─────────────────────────────────────────────────────────────
// MAIN ASSEMBLER
// ─────────────────────────────────────────────────────────────

/**
 * Assembles the complete Expert Mode report for a chart.
 *
 * @param {Object} chartData - Full chart data from calculateChartBySystem()
 * @param {string} lang - "en" or "ta"
 * @param {Object} [options] - Optional: { domains: string[] } to limit which domains to run
 * @returns {Object} Complete ExpertReport
 */
export function assembleExpertReport(chartData, lang = "en", options = {}) {
  if (!chartData || !Array.isArray(chartData.planets)) {
    return createExpertReport({
      reportMeta: {
        status: "ERROR",
        error: "Invalid or missing chart data"
      }
    });
  }

  const requestedDomains = options.domains || null; // null = all domains
  const domainResults = {};
  const errors = [];

  // ── Pass 1: Independent domains ──
  for (const [domainId, adapterFn] of Object.entries(DOMAIN_ADAPTERS)) {
    if (requestedDomains && !requestedDomains.includes(domainId)) continue;

    try {
      const result = adapterFn(chartData, lang);

      // Build narrative
      const narrative = buildDomainNarrative(result);
      result.narrative = narrative;

      domainResults[domainId] = result;
    } catch (err) {
      errors.push({ domain: domainId, error: err.message });
      domainResults[domainId] = {
        domain: domainId,
        domainLabel: DOMAIN_LABELS[domainId]?.en || domainId,
        domainLabelTamil: DOMAIN_LABELS[domainId]?.ta || domainId,
        outlook: "ERROR",
        primaryWindows: [],
        cautionWindows: [],
        subPhases: [],
        resolution: "INSUFFICIENT_DATA",
        narrative: { en: `Error computing ${domainId}: ${err.message}`, ta: `${domainId} கணக்கீட்டு பிழை: ${err.message}` },
        meta: { error: err.message }
      };
    }
  }

  // ── Pass 2: Dependent domains (Caution, Milestones) ──
  for (const [domainId, adapterFn] of Object.entries(DEPENDENT_DOMAINS)) {
    if (requestedDomains && !requestedDomains.includes(domainId)) continue;

    try {
      const result = adapterFn(chartData, lang, domainResults);
      const narrative = buildDomainNarrative(result);
      result.narrative = narrative;
      domainResults[domainId] = result;
    } catch (err) {
      errors.push({ domain: domainId, error: err.message });
      domainResults[domainId] = {
        domain: domainId,
        domainLabel: DOMAIN_LABELS[domainId]?.en || domainId,
        domainLabelTamil: DOMAIN_LABELS[domainId]?.ta || domainId,
        outlook: "ERROR",
        primaryWindows: [],
        cautionWindows: [],
        subPhases: [],
        resolution: "INSUFFICIENT_DATA",
        narrative: { en: `Error: ${err.message}`, ta: `பிழை: ${err.message}` },
        meta: { error: err.message }
      };
    }
  }

  // ── Apply Anti-False-Precision Firewall (P2) ──
  applyAntiFalsePrecisionFirewall(domainResults);

  // ── Cross-domain analysis ──
  const crossDomainAnalysis = buildCrossDomainAnalysis(domainResults, lang);

  // ── Assemble final report ──
  return createExpertReport({
    chartId: chartData.chartId || null,
    birthData: {
      date: chartData.birthDateStr || null,
      time: chartData.birthTimeStr || null,
      place: chartData.birthPlace || null,
      timezone: chartData.timezoneId || chartData.ianaTimezone || null
    },
    domainResults,
    crossDomainAnalysis,
    reportMeta: {
      status: errors.length > 0 ? "PARTIAL" : "COMPLETE",
      errors: errors.length > 0 ? errors : undefined,
      lang,
      domainsComputed: Object.keys(domainResults),
      totalPrimaryWindows: Object.values(domainResults).reduce(
        (sum, d) => sum + (d.primaryWindows?.length || 0), 0
      ),
      totalCautionWindows: Object.values(domainResults).reduce(
        (sum, d) => sum + (d.cautionWindows?.length || 0), 0
      )
    }
  });
}

// ─────────────────────────────────────────────────────────────
// GLOBAL ANTI-FALSE-PRECISION FIREWALL (P2)
// ─────────────────────────────────────────────────────────────

/**
 * Global Anti-False-Precision Firewall (P2)
 * Final gate before report assembly rejecting any empirical resolution finer
 * than the validated resolution for that domain, and explicitly labeling
 * all traditional timing windows as TRADITIONAL RULE WINDOW.
 *
 * @param {Object} domainResults - Dictionary of domain expert results
 * @returns {Object} Cleaned domain results
 */
export function applyAntiFalsePrecisionFirewall(domainResults) {
  if (!domainResults || typeof domainResults !== "object") return domainResults;

  for (const [domainId, result] of Object.entries(domainResults)) {
    if (!result || typeof result !== "object") continue;

    const valInfo = DOMAIN_VALIDATION_REGISTRY[domainId];
    const allowedEmpiricalRes = (valInfo && valInfo.empiricalOutcomeValidationAvailable)
      ? valInfo.empiricalPredictiveResolution
      : "NOT_ESTABLISHED";

    // 1. Reject empirical resolution finer than validated resolution
    if (allowedEmpiricalRes === "NOT_ESTABLISHED") {
      result.empiricalPredictiveResolution = "NOT_ESTABLISHED";
      if (result.epistemicStatus) {
        result.epistemicStatus.empiricalValidationStatus = "NOT_ESTABLISHED";
      }
      result.validationStatus = "TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED";
    } else {
      const allowedRank = RESOLUTION_RANK[allowedEmpiricalRes] ?? 10;
      const currentRank = RESOLUTION_RANK[result.empiricalPredictiveResolution];
      if (currentRank === undefined || currentRank < allowedRank) {
        result.empiricalPredictiveResolution = allowedEmpiricalRes;
      }
    }

    // 2. Process timing windows: label traditional timing windows as TRADITIONAL RULE WINDOW
    const processWindowList = (windows) => {
      if (!Array.isArray(windows)) return;
      for (const w of windows) {
        if (!w || typeof w !== "object") continue;
        w.windowCategory = "TRADITIONAL_RULE_WINDOW";
        w.windowTypeLabel = "TRADITIONAL RULE WINDOW";
        w.traditionalTimingLabel = "TRADITIONAL RULE WINDOW";
        w.resolutionLayer = RESOLUTION_LAYERS.TRADITIONAL_RULE_RESOLUTION;

        if (allowedEmpiricalRes === "NOT_ESTABLISHED") {
          w.empiricalPredictiveResolution = "NOT_ESTABLISHED";
        } else {
          const wRank = RESOLUTION_RANK[w.empiricalPredictiveResolution];
          const allowedRank = RESOLUTION_RANK[allowedEmpiricalRes] ?? 10;
          if (wRank === undefined || wRank < allowedRank) {
            w.empiricalPredictiveResolution = allowedEmpiricalRes;
          }
        }
      }
    };

    processWindowList(result.primaryWindows);
    processWindowList(result.cautionWindows);
    processWindowList(result.subPhases);
  }

  return domainResults;
}

// ─────────────────────────────────────────────────────────────
// CROSS-DOMAIN ANALYSIS
// ─────────────────────────────────────────────────────────────

/**
 * Identifies cross-domain patterns:
 * - Simultaneous activation periods (e.g., career + finance peak together)
 * - Conflicting domains (e.g., property purchase during financial caution)
 * - Life-phase overview
 */
function buildCrossDomainAnalysis(domainResults, lang) {
  const isTamil = lang === "ta";
  const activationPeriods = [];
  const conflicts = [];

  // Collect all primary windows across domains
  const allWindows = [];
  for (const [domainId, result] of Object.entries(domainResults)) {
    if (!result.primaryWindows) continue;
    for (const w of result.primaryWindows) {
      if (w.startDate && w.endDate) {
        allWindows.push({
          domain: domainId,
          startDate: w.startDate,
          endDate: w.endDate,
          strength: w.strength || 0,
          confidenceType: w.confidenceType
        });
      }
    }
  }

  // Find overlapping windows across different domains
  for (let i = 0; i < allWindows.length; i++) {
    for (let j = i + 1; j < allWindows.length; j++) {
      const a = allWindows[i];
      const b = allWindows[j];
      if (a.domain === b.domain) continue;

      if (datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
        const overlapStart = a.startDate > b.startDate ? a.startDate : b.startDate;
        const overlapEnd = a.endDate < b.endDate ? a.endDate : b.endDate;

        // Check if one is a caution domain
        const isCaution = a.domain === DOMAIN.CAUTION || b.domain === DOMAIN.CAUTION;

        if (isCaution) {
          conflicts.push({
            domains: [a.domain, b.domain],
            overlapStart,
            overlapEnd,
            description: isTamil
              ? `${getDomainLabelTa(a.domain)} மற்றும் ${getDomainLabelTa(b.domain)} ஒரே காலகட்டத்தில் ஒன்றுடன் ஒன்று முரண்படுகின்றன`
              : `${getDomainLabelEn(a.domain)} and ${getDomainLabelEn(b.domain)} overlap with conflicting indicators`
          });
        } else {
          activationPeriods.push({
            domains: [a.domain, b.domain],
            overlapStart,
            overlapEnd,
            combinedStrength: (a.strength + b.strength) / 2,
            description: isTamil
              ? `${getDomainLabelTa(a.domain)} மற்றும் ${getDomainLabelTa(b.domain)} ஒரே காலகட்டத்தில் ஒரே நேரத்தில் செயல்படுகின்றன`
              : `${getDomainLabelEn(a.domain)} and ${getDomainLabelEn(b.domain)} simultaneously active`
          });
        }
      }
    }
  }

  return {
    simultaneousActivations: activationPeriods,
    crossDomainConflicts: conflicts,
    totalDomainsAnalyzed: Object.keys(domainResults).length
  };
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function datesOverlap(startA, endA, startB, endB) {
  try {
    const sA = new Date(startA).getTime();
    const eA = new Date(endA).getTime();
    const sB = new Date(startB).getTime();
    const eB = new Date(endB).getTime();
    if (isNaN(sA) || isNaN(eA) || isNaN(sB) || isNaN(eB)) return false;
    return sA <= eB && sB <= eA;
  } catch {
    return false;
  }
}

function getDomainLabelEn(domainId) {
  return DOMAIN_LABELS[domainId]?.en || domainId;
}

function getDomainLabelTa(domainId) {
  return DOMAIN_LABELS[domainId]?.ta || domainId;
}
