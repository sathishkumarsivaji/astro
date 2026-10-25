/**
 * SKR ASTRO — Timeline Applicability Pipeline
 * ============================================
 * Version: 2.1.0
 * 
 * Sanitizes and governs the 82-period Vimshottari timeline across all consumers
 * (UI, PDF, Customer Report, Q&A) according to strict age and life-context rules.
 * 
 * Invariants:
 * - Never assign career promotions, corporate disputes, marriages, property purchases,
 *   or academic research achievements to minors (<18).
 * - Never fabricate replacement childhood claims (no "father's promotion", no "brain development").
 * - Retain exact astronomical and dasha calculations with neutral, honest titles.
 */

import {
  EVENT_REGISTRY_VERSION,
  EVENT_DEFINITIONS,
  resolveContextStatus
} from "./eventPrerequisiteRegistry.js";
import {
  POLICY_VERSION,
  APPLICABILITY_STATUS,
  calculateExactCalendarAge,
  formatAgeIntervalDisplay,
  evaluateEventApplicability
} from "./applicabilityPolicyEngine.js";

const TAMIL_PLANET_NAMES = {
  Sun: "சூரியன்",
  Moon: "சந்திரன்",
  Mars: "செவ்வாய்",
  Mercury: "புதன்",
  Jupiter: "குரு",
  Venus: "சுக்கிரன்",
  Saturn: "சனி",
  Rahu: "ராகு",
  Ketu: "கேது"
};

/**
 * Maps stage textual clues and metadata to candidate event IDs
 */
function identifyCandidateEventTypes(stage) {
  const text = `${stage.title || ""} ${stage.theme || ""} ${stage.primaryTheme || ""} ${stage.prediction || ""}`.toLowerCase();
  const candidates = [];

  // Career / Promotion
  if (
    stage.key === "career" ||
    text.includes("vocational ascent") ||
    text.includes("leadership & institutional") ||
    text.includes("career promotion") ||
    text.includes("தொழில் முன்னேற்றம்") ||
    text.includes("உத்தியோக உயர்வு")
  ) {
    candidates.push("JOB_PROMOTION");
  }

  // Business Expansion
  if (
    text.includes("commercial contract") ||
    text.includes("business expansion") ||
    text.includes("வணிக விரிவாக்கம்")
  ) {
    candidates.push("BUSINESS_EXPANSION");
  }

  // Marriage / Matrimonial
  if (
    stage.key === "marriage" ||
    text.includes("matrimonial") ||
    text.includes("marriage") ||
    text.includes("relational alliances") ||
    text.includes("திருமண பந்தம்") ||
    text.includes("சுப விவாக")
  ) {
    candidates.push("MARRIAGE_FORMATION");
  }

  // Property / Real Estate Purchase
  if (
    stage.key === "property" ||
    text.includes("real estate") ||
    text.includes("domestic asset stabilization") ||
    text.includes("property acquisitions") ||
    text.includes("சொத்து சேர்க்கை") ||
    text.includes("மனை வாங்குதல்")
  ) {
    candidates.push("PROPERTY_PURCHASE");
  }

  // Research / Higher Education
  if (
    text.includes("research achievements") ||
    text.includes("academic/competitive achievements") ||
    text.includes("ஆராய்ச்சி வெற்றிகள்") ||
    text.includes("உயர் கல்வி")
  ) {
    candidates.push("RESEARCH_PUBLICATION");
  }

  // Dispute Management / Corporate Conflict
  if (
    stage.key === "resilience" ||
    text.includes("managing employee disputes") ||
    text.includes("overcoming friction") ||
    text.includes("போட்டிகளை சமாளி") ||
    text.includes("தடைகளை வெல்லும்")
  ) {
    candidates.push("ADULT_DISPUTE_MANAGEMENT");
  }

  return candidates.length > 0 ? candidates : ["CALCULATED_PERIOD"];
}

/**
 * Parses start and end ages from stage metadata or ageRange string
 */
function parseStageAge(stage, birthData = {}) {
  let s = stage.startAge ?? stage.pStart ?? null;
  let e = stage.endAge ?? stage.pEnd ?? null;

  if (s == null && typeof stage.ageRange === "string") {
    const parts = stage.ageRange.split("-").map(p => parseFloat(p.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      s = parts[0];
      e = parts[1];
    }
  }

  // If birthDate and stage dates exist, compute exact age
  if (birthData.birthDate && stage.startDate && stage.endDate) {
    const startAgeObj = calculateExactCalendarAge(birthData.birthDate, stage.startDate);
    const endAgeObj = calculateExactCalendarAge(birthData.birthDate, stage.endDate);
    if (startAgeObj && endAgeObj) {
      return {
        startAge: startAgeObj.fractionalYears,
        endAge: endAgeObj.fractionalYears,
        startAgeObj,
        endAgeObj
      };
    }
  }

  return {
    startAge: s != null ? Number(s) : null,
    endAge: e != null ? Number(e) : null
  };
}

/**
 * Sanitizes a single timeline stage against applicability constraints.
 *
 * @param {Object} stage - Raw stage from astroEngine or timeline
 * @param {Object} birthData - Birth information
 * @param {Object} context - Known life context
 * @param {string} lang - "en" or "ta"
 * @returns {Object} Remediated stage
 */
export function sanitizeTimelineStage(stage, birthData = {}, context = {}, lang = "en") {
  if (!stage || typeof stage !== "object") return stage;

  const isTa = lang === "ta" || stage.titleTa != null || stage.lang === "ta";
  const { startAge, endAge, startAgeObj, endAgeObj } = parseStageAge(stage, birthData);

  const mdLord = stage.operatingLord || stage.lord || stage.mahaDashaLord || "Dasha";
  const bkLord = stage.subLord || stage.activeAntar || stage.antarLord || "Sub";
  const mdTa = stage.operatingLordTamil || stage.lordTamil || TAMIL_PLANET_NAMES[mdLord] || mdLord;
  const bkTa = stage.subLordTamil || stage.antarTamil || TAMIL_PLANET_NAMES[bkLord] || bkLord;

  const ageDisplayEn = formatAgeIntervalDisplay(startAge, endAge, "en");
  const ageDisplayTa = formatAgeIntervalDisplay(startAge, endAge, "ta");

  const candidateEventTypes = identifyCandidateEventTypes(stage);
  const evaluationResults = candidateEventTypes.map(evtId =>
    evaluateEventApplicability(evtId, { startAge, endAge }, context)
  );

  const hasNotApplicable = evaluationResults.some(r => r.status === APPLICABILITY_STATUS.NOT_APPLICABLE);
  const hasContextRequired = evaluationResults.some(r => r.status === APPLICABILITY_STATUS.CONTEXT_REQUIRED);

  // If any adult claim is NOT_APPLICABLE during this stage (e.g. minor < 18):
  if (hasNotApplicable) {
    const suppressed = candidateEventTypes.filter((_, idx) =>
      evaluationResults[idx].status === APPLICABILITY_STATUS.NOT_APPLICABLE
    );

    const neutralTitleEn = `Calculated ${mdLord} MD - ${bkLord} AD Period (${ageDisplayEn})`;
    const neutralTitleTa = `கணக்கிடப்பட்ட ${mdTa} தசை - ${bkTa} புக்தி காலம் (${ageDisplayTa})`;

    const neutralDomainEn = "Calculated Planetary Period";
    const neutralDomainTa = "கணக்கிடப்பட்ட தசா-புக்தி காலம்";

    const neutralPredEn = `Classical Vimshottari period governed by ${mdLord} and ${bkLord} (Ages ${ageDisplayEn}). Calculated planetary period; adult life-stage event interpretations are inapplicable during this foundational developmental interval. Traditional astrological calculation coordinates are retained; no specific life event is asserted.`;
    const neutralPredTa = `பாரம்பரிய விம்சோத்தரி முறைப்படி ${mdTa} தசை மற்றும் ${bkTa} புக்தி இயங்கும் காலப்பகுதி (${ageDisplayTa}). கணக்கிடப்பட்ட கிரக நிலை மட்டுமே; இந்த ஆரம்ப வளர்ச்சிப் பருவத்தில் வயதுவந்தோருக்கான வாழ்க்கை நிகழ்வுகள் பொருந்தாது. எந்தவொரு தனிப்பட்ட நிகழ்வும் உறுதிப்படுத்தப்படவில்லை.`;

    const neutralGuidanceEn = "Prioritize age-appropriate developmental care, routine stability, and safe, supportive surroundings.";
    const neutralGuidanceTa = "பருவத்திற்கு ஏற்ற அமைதியான சூழல், சீரான கவனிப்பு மற்றும் குழந்தைகளின் நல்வாழ்வை பேணுவது நலம்.";

    return {
      ...stage,
      title: isTa ? neutralTitleTa : neutralTitleEn,
      titleEn: neutralTitleEn,
      titleTa: neutralTitleTa,
      theme: isTa ? neutralDomainTa : neutralDomainEn,
      primaryTheme: isTa ? neutralDomainTa : neutralDomainEn,
      secondaryThemes: isTa
        ? ["விம்சோத்தரி தசா சுழற்சி", "ஆரம்ப வளர்ச்சி நிலை"]
        : ["Vimshottari Dasha Cycle", "Developmental Foundation"],
      domain: isTa ? neutralDomainTa : neutralDomainEn,
      prediction: isTa ? neutralPredTa : neutralPredEn,
      predictionEn: neutralPredEn,
      predictionTa: neutralPredTa,
      actionableGuidance: isTa ? neutralGuidanceTa : neutralGuidanceEn,
      guidanceEn: neutralGuidanceEn,
      guidanceTa: neutralGuidanceTa,
      applicabilityStatus: APPLICABILITY_STATUS.NOT_APPLICABLE,
      calculationStatus: "CALCULATED",
      eventInferenceStatus: "EVENT_UNESTABLISHED",
      suppressedAdultEvents: suppressed,
      prerequisitesMet: false,
      ageDisplay: ageDisplayEn,
      ageDisplayTamil: ageDisplayTa,
      applicabilityNotes: isTa
        ? "வயதுக்கு பொருந்தாத பலன்கள் நீக்கப்பட்டு, நடுநிலையான தசா கணிப்பு வழங்கப்பட்டுள்ளது."
        : "Adult event interpretations suppressed due to age applicability rules.",
      applicabilityPolicyVersion: POLICY_VERSION,
      eventRegistryVersion: EVENT_REGISTRY_VERSION
    };
  }

  // If context is required (e.g. employment for promotion)
  if (hasContextRequired) {
    const contextEvts = candidateEventTypes.filter((_, idx) =>
      evaluationResults[idx].status === APPLICABILITY_STATUS.CONTEXT_REQUIRED
    );

    const qualifierEn = " (Subject to active employment / enterprise context)";
    const qualifierTa = " (வேலைவாய்ப்பு / தொழில் சூழல் தேவைப்படுகிறது)";

    return {
      ...stage,
      title: stage.title ? `${stage.title}${isTa ? qualifierTa : qualifierEn}` : stage.title,
      applicabilityStatus: APPLICABILITY_STATUS.CONTEXT_REQUIRED,
      calculationStatus: "CALCULATED",
      eventInferenceStatus: "CONDITIONAL",
      pendingPrerequisites: contextEvts,
      prerequisitesMet: false,
      ageDisplay: ageDisplayEn,
      ageDisplayTamil: ageDisplayTa,
      applicabilityPolicyVersion: POLICY_VERSION,
      eventRegistryVersion: EVENT_REGISTRY_VERSION
    };
  }

  // Adult stage with satisfied prerequisites
  return {
    ...stage,
    applicabilityStatus: APPLICABILITY_STATUS.APPLICABLE,
    calculationStatus: "CALCULATED",
    eventInferenceStatus: "TRADITIONAL_WINDOW_EVALUATED",
    prerequisitesMet: true,
    ageDisplay: ageDisplayEn,
    ageDisplayTamil: ageDisplayTa,
    applicabilityPolicyVersion: POLICY_VERSION,
    eventRegistryVersion: EVENT_REGISTRY_VERSION
  };
}

/**
 * Sanitizes an entire timeline (82 stages or lifeStages)
 *
 * @param {Object|Array} timelineOrStages - Complete timeline object or stages array
 * @param {Object} birthData - Birth information
 * @param {Object} context - Known life context
 * @param {string} [lang="en"] - "en" or "ta"
 * @returns {Object|Array} Remediated timeline or stages array
 */
export function applyTimelineApplicability(timelineOrStages, birthData = {}, context = {}, lang = "en") {
  if (!timelineOrStages) return timelineOrStages;

  const isArray = Array.isArray(timelineOrStages);
  const rawStages = isArray ? timelineOrStages : (timelineOrStages.stages || timelineOrStages.periods || []);

  const sanitizedStages = rawStages.map(st => sanitizeTimelineStage(st, birthData, context, lang));

  if (isArray) {
    return sanitizedStages;
  }

  return {
    ...timelineOrStages,
    stages: sanitizedStages,
    periods: sanitizedStages,
    applicabilityCertified: true,
    applicabilityPolicyVersion: POLICY_VERSION,
    eventRegistryVersion: EVENT_REGISTRY_VERSION,
    sanitizedAt: new Date().toISOString()
  };
}
