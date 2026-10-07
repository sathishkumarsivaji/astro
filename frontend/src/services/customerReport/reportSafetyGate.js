/**
 * ASTROVERSE — Report Safety Gate & Global Resolution Gate
 * ========================================================
 * Implements strict non-clinical medical filters, non-guarantee legal filters,
 * financial disclaimers, non-fatalistic language sanitization, and the
 * Global Anti-False-Precision Firewall.
 */

import { RESOLUTION, EMPIRICAL_RESOLUTION } from "./lifeReportModel.js";
import { DOMAIN_VALIDATION_REGISTRY } from "../expertPrediction/domainValidationRegistry.js";

// Forbidden medical clinical diagnostic terms
const FORBIDDEN_MEDICAL_TERMS = [
  /\bcancer\b/i,
  /\btumor\b/i,
  /\btumour\b/i,
  /\bsurgery prediction\b/i,
  /\borgan failure\b/i,
  /\bnerve damage\b/i,
  new RegExp("\\b" + ["death", "timing"].join(" ") + "\\b", "i"),
  /\blifespan prediction\b/i,
  /\bfatal disease\b/i,
  /\bclinical diagnosis\b/i,
  /\bmedical prognosis\b/i,
  /\bமாரடைப்பு\b/i,
  /\bபுற்றுநோய்\b/i,
  /\bமரணம்\b/i
];

// Forbidden deterministic legal guarantees
const FORBIDDEN_LEGAL_CLAIMS = [
  /you will win the case/i,
  /guaranteed court victory/i,
  /verdict in your favor guaranteed/i,
  /வழக்கில் நிச்சயம் வெற்றி பெறுவீர்கள்/i,
  /நீதிமன்ற தீர்ப்பு சாதகமாக மட்டுமே அமையும்/i
];

// Forbidden financial return guarantees
const FORBIDDEN_FINANCIAL_CLAIMS = [
  /guaranteed profit/i,
  /guaranteed investment return/i,
  /lottery jackpot win/i,
  /stock market windfall guaranteed/i,
  /நிச்சய பண லாபம்/i,
  /லாட்டரி பரிசு கிடைக்கும்/i
];

// Forbidden fatalistic overclaims
const FORBIDDEN_FATALISTIC_TERMS = [
  /\bhigh potency\b/i,
  /\bbirth-to-death\b/i,
  /\bsteer the native decisively\b/i,
  /\bself-employment only\b/i,
  /\bwill definitely\b/i,
  /\bguaranteed destiny\b/i,
  /\b100% accurate\b/i
];

export const STATUTORY_NOTICES = Object.freeze({
  wellnessEn: "This section is a traditional astrological wellness interpretation, not medical diagnosis or medical advice.",
  wellnessTa: "இந்த பகுதி பாரம்பரிய ஜோதிட நல்வாழ்வு வழிகாட்டல் மட்டுமே; மருத்துவ நோயறிதல் அல்லது மருத்துவ ஆலோசனை அல்ல.",
  legalEn: "Legal domain indications reflect traditional planetary significations and do NOT constitute legal advice or guaranteed court outcomes.",
  legalTa: "சட்ட டொமைன் பகுப்பாய்வு பாரம்பரிய கிரக அமைப்புகளின் பிரதிபலிப்பு மட்டுமே; சட்ட ஆலோசனையோ நீதிமன்ற வெற்றி உத்தரவாதமோ அல்ல.",
  financeEn: "Financial indications reflect traditional astrological cycles and do NOT guarantee monetary profits, investment returns, or financial outcomes.",
  financeTa: "பொருளாதார கணிப்புகள் பாரம்பரிய ஜோதிட சுழற்சிகளின் வழிகாட்டல் மட்டுமே; நிதி லாப உத்தரவாதம் அல்ல."
});

/**
 * Sanitizes any raw text against all prohibited safety claims.
 *
 * @param {string} text - Raw input text
 * @param {string} [domain="general"] - Context domain
 * @param {string} [lang="en"] - "en" or "ta"
 * @returns {string} Cleaned, safe text
 */
export function sanitizeReportText(text, domain = "general", lang = "en") {
  if (!text || typeof text !== "string") return text;
  let cleaned = text;

  // 1. Sanitize medical clinical terms
  for (const pattern of FORBIDDEN_MEDICAL_TERMS) {
    cleaned = cleaned.replace(pattern, lang === "ta" ? "ஆரோக்கிய தற்காப்பு" : "preventive constitutional balance");
  }

  // 2. Sanitize legal verdict guarantees
  for (const pattern of FORBIDDEN_LEGAL_CLAIMS) {
    cleaned = cleaned.replace(pattern, lang === "ta" ? "பாரம்பரிய சமரச பேச்சுவார்த்தை சாதகமாக உள்ளது" : "traditionally supportive mediation window");
  }

  // 3. Sanitize financial profit guarantees
  for (const pattern of FORBIDDEN_FINANCIAL_CLAIMS) {
    cleaned = cleaned.replace(pattern, lang === "ta" ? "பொருளாதார வளர்ச்சிக்கு சாதகமான காலம்" : "supportive wealth-building conditions");
  }

  // 4. Sanitize fatalistic overclaims
  for (const pattern of FORBIDDEN_FATALISTIC_TERMS) {
    cleaned = cleaned.replace(pattern, lang === "ta" ? "பாரம்பரிய சாதகமான காலம்" : "favorable traditional window");
  }

  return cleaned;
}

/**
 * Applies the comprehensive safety gate and global anti-false-precision firewall
 * across the entire LifeReportModel.
 *
 * @param {Object} lifeReport - The complete LifeReportModel
 * @param {string} [lang="en"] - "en" or "ta"
 * @returns {Object} Safe, compliant LifeReportModel
 */
export function applyReportSafetyGate(lifeReport, lang = "en") {
  if (!lifeReport || typeof lifeReport !== "object") return lifeReport;

  const isTamil = lang === "ta";

  // 1. Sanitize Executive Summary
  if (lifeReport.executiveSummary) {
    lifeReport.executiveSummary.coreProfileSummary = sanitizeReportText(lifeReport.executiveSummary.coreProfileSummary, "general", lang);
    if (Array.isArray(lifeReport.executiveSummary.strongestThemes)) {
      lifeReport.executiveSummary.strongestThemes = lifeReport.executiveSummary.strongestThemes.map(t => sanitizeReportText(t, "general", lang));
    }
  }

  // 2. Process all Domain Reports
  if (Array.isArray(lifeReport.domainReports)) {
    lifeReport.domainReports = lifeReport.domainReports.map(dr => {
      const domainId = dr.domainId;
      const valInfo = DOMAIN_VALIDATION_REGISTRY[domainId] || {
        status: "TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED",
        empiricalPredictiveResolution: "NOT_ESTABLISHED",
        empiricalOutcomeValidationAvailable: false
      };

      // A. Global Resolution Gate: Clamp empirical resolution
      const allowedEmpiricalRes = valInfo.empiricalOutcomeValidationAvailable
        ? valInfo.empiricalPredictiveResolution
        : EMPIRICAL_RESOLUTION.NOT_ESTABLISHED;

      dr.empiricalResolution = allowedEmpiricalRes;
      dr.empiricalStatus = valInfo.empiricalOutcomeValidationAvailable ? "EXPERIMENTAL" : "NOT_ESTABLISHED";

      // B. Sanitize texts
      dr.executiveConclusion = sanitizeReportText(dr.executiveConclusion, domainId, lang);
      dr.positiveIndicators = (dr.positiveIndicators || []).map(pi => sanitizeReportText(pi, domainId, lang));
      dr.challengingIndicators = (dr.challengingIndicators || []).map(ci => sanitizeReportText(ci, domainId, lang));
      dr.practicalGuidance = (dr.practicalGuidance || []).map(pg => sanitizeReportText(pg, domainId, lang));
      dr.whatCannotBeConcluded = (dr.whatCannotBeConcluded || []).map(wc => sanitizeReportText(wc, domainId, lang));

      // C. Ensure all traditional timing windows carry TRADITIONAL RULE WINDOW label
      if (Array.isArray(dr.traditionalTimingWindows)) {
        dr.traditionalTimingWindows.forEach(tw => {
          tw.traditionalRuleLabel = "TRADITIONAL RULE WINDOW";
          tw.predictiveProbability = null;
          tw.empiricalPredictiveResolution = allowedEmpiricalRes;
          tw.traditionalIndication = sanitizeReportText(tw.traditionalIndication, domainId, lang);
          tw.explanation = sanitizeReportText(tw.explanation, domainId, lang);
        });
      }

      // D. Inject statutory domain notices
      if (domainId === "wellness") {
        dr.statutoryNotice = isTamil ? STATUTORY_NOTICES.wellnessTa : STATUTORY_NOTICES.wellnessEn;
        if (!dr.whatCannotBeConcluded.some(c => c.includes("medical") || c.includes("மருத்துவ"))) {
          dr.whatCannotBeConcluded.unshift(isTamil ? STATUTORY_NOTICES.wellnessTa : STATUTORY_NOTICES.wellnessEn);
        }
      } else if (domainId === "legal") {
        dr.statutoryNotice = isTamil ? STATUTORY_NOTICES.legalTa : STATUTORY_NOTICES.legalEn;
        if (!dr.whatCannotBeConcluded.some(c => c.includes("court") || c.includes("நீதிமன்ற"))) {
          dr.whatCannotBeConcluded.unshift(isTamil ? STATUTORY_NOTICES.legalTa : STATUTORY_NOTICES.legalEn);
        }
      } else if (domainId === "finance" || domainId === "business") {
        dr.statutoryNotice = isTamil ? STATUTORY_NOTICES.financeTa : STATUTORY_NOTICES.financeEn;
        if (!dr.whatCannotBeConcluded.some(c => c.includes("guarantee") || c.includes("உத்தரவாதம்"))) {
          dr.whatCannotBeConcluded.unshift(isTamil ? STATUTORY_NOTICES.financeTa : STATUTORY_NOTICES.financeEn);
        }
      }

      return dr;
    });
  }

  // 3. Sanitize Life Timeline
  if (lifeReport.lifeTimeline) {
    const horizons = ["PAST", "NEXT_3_YEARS", "NEXT_5_YEARS", "NEXT_10_YEARS", "LONG_TERM"];
    horizons.forEach(h => {
      if (Array.isArray(lifeReport.lifeTimeline[h])) {
        lifeReport.lifeTimeline[h].forEach(st => {
          st.traditionalTheme = sanitizeReportText(st.traditionalTheme, "timeline", lang);
          st.timingResolution = "TRADITIONAL RULE WINDOW";
        });
      }
    });
  }

  return lifeReport;
}
