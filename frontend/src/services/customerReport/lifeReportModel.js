/**
 * SKR ASTRO — Single Report Data Contract: LifeReportModel
 * =========================================================
 * Authoritative customer report data contract covering all 17 domains,
 * deterministic evidence chains, life timeline, safety boundaries,
 * and empirical resolution gates.
 */

export const EVIDENCE_STRENGTH = Object.freeze({
  VERY_STRONG: "VERY_STRONG",
  STRONG: "STRONG",
  MODERATE: "MODERATE",
  MIXED: "MIXED",
  LIMITED: "LIMITED",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA"
});

export const TRADITIONAL_ASSESSMENT = Object.freeze({
  FAVORABLE: "FAVORABLE",
  SUPPORTED: "SUPPORTED",
  MODERATE: "MODERATE",
  GUARDED: "GUARDED",
  LIMITED: "LIMITED",
  INSUFFICIENT: "INSUFFICIENT",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  UNASSESSED: "UNASSESSED"
});

export const EMPIRICAL_STATUS = Object.freeze({
  VALIDATED: "VALIDATED",
  EXPERIMENTAL: "EXPERIMENTAL",
  NOT_ESTABLISHED: "NOT_ESTABLISHED"
});

export const EMPIRICAL_RESOLUTION = Object.freeze({
  DAY: "DAY",
  DATE_RANGE: "DATE_RANGE",
  MONTH_RANGE: "MONTH_RANGE",
  YEAR: "YEAR",
  MULTI_YEAR_RANGE: "MULTI_YEAR_RANGE",
  NOT_ESTABLISHED: "NOT_ESTABLISHED"
});

export const RESOLUTION = Object.freeze({
  DAY: "DAY",
  DATE_RANGE: "DATE_RANGE",
  MONTH_RANGE: "MONTH_RANGE",
  YEAR: "YEAR",
  MULTI_YEAR_RANGE: "MULTI_YEAR_RANGE",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA"
});

export const RISK_SEVERITY = Object.freeze({
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH"
});

export const ALL_17_DOMAINS = Object.freeze([
  "marriage",
  "property",
  "career",
  "education",
  "children",
  "foreignTravel",
  "vehicle",
  "business",
  "job",
  "finance",
  "family",
  "leadership",
  "wellness",
  "legal",
  "spiritual",
  "caution",
  "milestones"
]);

export const DOMAIN_DISPLAY_NAMES = Object.freeze({
  marriage: {
    en: "Marriage & Partnership",
    ta: "திருமணம் மற்றும் வாழ்க்கை துணை"
  },
  property: {
    en: "Property & Real Estate",
    ta: "நிலம் மற்றும் அசையா சொத்து"
  },
  career: {
    en: "Career & Professional Trajectory",
    ta: "தொழில் மற்றும் பொது வாழ்க்கை பாதை"
  },
  education: {
    en: "Education & Intellectual Development",
    ta: "கல்வி மற்றும் அறிவுசார் வளர்ச்சி"
  },
  children: {
    en: "Children & Family Expansion",
    ta: "புத்திர பாக்கியம் மற்றும் குழந்தைகள் நலம்"
  },
  foreignTravel: {
    en: "Foreign Travel & Settlement",
    ta: "வெளிநாட்டு பயணம் மற்றும் குடியேற்றம்"
  },
  vehicle: {
    en: "Vehicle & Conveyance",
    ta: "வாகன யோகம் மற்றும் வசதிகள்"
  },
  business: {
    en: "Business & Entrepreneurship",
    ta: "சுய தொழில் மற்றும் வர்த்தகம்"
  },
  job: {
    en: "Job & Employment",
    ta: "உத்தியோகம் மற்றும் பணியிட வளர்ச்சி"
  },
  finance: {
    en: "Finance & Wealth",
    ta: "தன வரவு மற்றும் பொருளாதார வளம்"
  },
  family: {
    en: "Family & Domestic Harmony",
    ta: "குடும்பம் மற்றும் உறவுகள் நலம்"
  },
  leadership: {
    en: "Leadership & Public Influence",
    ta: "தலைமைத்துவம் மற்றும் அதிகார யோகம்"
  },
  wellness: {
    en: "Traditional Wellness & Vitality",
    ta: "ஆரோக்கியம் மற்றும் பாரம்பரிய நல்வாழ்வு"
  },
  legal: {
    en: "Legal & Dispute Resolution",
    ta: "சட்டம் மற்றும் வழக்கு தீர்வுகள்"
  },
  spiritual: {
    en: "Spiritual & Philosophical Growth",
    ta: "ஆன்மீகம் மற்றும் தத்துவ வளர்ச்சி"
  },
  caution: {
    en: "Caution & Risk Periods",
    ta: "எச்சரிக்கை மற்றும் கவனத்திற்குரிய காலங்கள்"
  },
  milestones: {
    en: "Major Life Milestones Timeline",
    ta: "முக்கிய வாழ்க்கை மைல்கற்கள் காலவரிசை"
  }
});

/**
 * Creates an authoritative LifeReportModel adhering to Section 2 of the specification.
 */
export function createLifeReportModel(params = {}) {
  return {
    clientProfile: params.clientProfile || {
      name: "Client",
      gender: "unspecified",
      birthDate: null,
      birthTime: null,
      birthPlace: null,
      latitude: null,
      longitude: null,
      timezone: null
    },
    calculationMetadata: params.calculationMetadata || {
      ayanamsha: null,
      ephemeris: null,
      calculationEngine: null,
      generatedAt: new Date().toISOString(),
      reportFingerprint: null,
      releaseVersion: null,
      modelVersion: null,
      schemaVersion: null,
      astronomyEngineVersion: null
    },
    dataQuality: params.dataQuality || {
      birthDate: null,
      birthTime: null,
      birthLocation: null,
      latitude: null,
      longitude: null,
      timezone: null,
      ayanamsha: null,
      ephemeris: null,
      calculationEngine: null,
      birthTimeSensitivity: {
        d60Sensitivity: "~2 minutes",
        d9Sensitivity: "~13.3 minutes",
        boundaryProximityAlert: false
      },
      completenessScore: null,
      completenessLabel: "UNASSESSED"
    },
    executiveSummary: params.executiveSummary || {
      coreProfileSummary: "",
      strongestThemes: [],
      personalizedThemes: [],
      currentLifePhase: null,
      nextImportantWindows: [],
      keyCautions: [],
      birthTimeReliability: {
        rating: "UNASSESSED",
        notes: []
      }
    },
    coreNatalProfile: params.coreNatalProfile || {
      ascendant: null,
      moonSign: null,
      moonNakshatra: null,
      sunSign: null,
      sunNakshatra: null,
      atmakaraka: null,
      yogakaraka: null,
      functionalLordships: null,
      shadbalaSummary: [],
      elementalDistribution: null
    },
    planetaryTable: Array.isArray(params.planetaryTable) ? params.planetaryTable : [],
    houseAnalysis: Array.isArray(params.houseAnalysis) ? params.houseAnalysis : [],
    yogaAnalysis: Array.isArray(params.yogaAnalysis) ? params.yogaAnalysis : [],
    vargaAnalysis: params.vargaAnalysis || {},
    currentDasha: params.currentDasha || null,
    currentTransits: params.currentTransits || null,
    domainReports: Array.isArray(params.domainReports) ? params.domainReports : [],
    lifeTimeline: params.lifeTimeline || {
      PAST: [],
      CURRENT: null,
      NEXT_3_YEARS: [],
      NEXT_5_YEARS: [],
      NEXT_10_YEARS: [],
      LONG_TERM: []
    },
    majorMilestones: params.majorMilestones || {
      retrospective: [],
      prospective: []
    },
    evidenceSummary: params.evidenceSummary || {
      requestedDomains: 17,
      processedDomains: Array.isArray(params.domainReports) ? params.domainReports.length : 0,
      totalDomainsAnalyzed: Array.isArray(params.domainReports) ? params.domainReports.length : 0,
      domainsWithSufficientData: Array.isArray(params.domainReports) ? params.domainReports.filter(d => d?.evidenceStrength !== "INSUFFICIENT_DATA").length : 0,
      domainsWithTraceableEvidence: Array.isArray(params.domainReports) ? params.domainReports.filter(d => (Array.isArray(d?.evidenceChain) && d.evidenceChain.length > 0) || (d?.technicalEvidence && Object.keys(d.technicalEvidence).length > 0)).length : 0,
      domainsWithInsufficientData: Array.isArray(params.domainReports) ? params.domainReports.filter(d => d?.evidenceStrength === "INSUFFICIENT_DATA").length : 0,
      empiricallyValidatedDomains: Array.isArray(params.domainReports) ? params.domainReports.filter(d => d?.empiricalStatus === "VALIDATED").length : 0,
      strongDomains: [],
      moderateDomains: [],
      cautionDomains: []
    },
    safetySummary: params.safetySummary || {
      nonMedicalNotice: "This report contains traditional astrological correspondences and is NOT medical diagnosis, prognosis, or medical advice.",
      nonFinancialNotice: "Astrological indications are traditional interpretations and do NOT constitute financial, investment, or legal guarantees.",
      nonLegalNotice: "Litigation indications are traditional thematic analyses and do NOT guarantee legal trial outcomes.",
      nonFatalisticDeclaration: "All life indications are understood as symbolic tendencies and personal agency remains sovereign."
    },
    empiricalValidationSummary: params.empiricalValidationSummary || {
      validatedDomains: [],
      experimentalDomains: ["marriage"],
      unvalidatedDomains: [
        "property", "career", "education", "children", "foreignTravel",
        "vehicle", "business", "job", "finance", "family", "leadership",
        "wellness", "legal", "spiritual", "caution", "milestones"
      ],
      notice: "Only Marriage timing has an empirical out-of-sample benchmark (Resolution: MULTI_YEAR_RANGE). All other 16 domains are presented as traditional Jyotisha rule evaluations without empirical statistical validation claims."
    },
    limitations: params.limitations || [
      "Astronomical ephemeris accuracy does not guarantee future predictive certainty.",
      "Traditional rule convergence reflects classical textual harmony, not statistical odds.",
      "Birth-time variations of even 2 minutes significantly alter the D60 Shashtiamsha divisional chart."
    ],
    technicalAppendix: params.technicalAppendix || {
      ayanamshaDefinition: "True Lahiri (Chitra Paksha) sidereal zodiac offset calculated against J2000 epoch.",
      houseSystem: "Equal-House Bhava Chalit with Whole Sign Rasi core alignment.",
      dashaYearStandard: "Vimshottari solar year standard (365.2422 days/year).",
      ephemerisLibrary: "Astronomy Engine v2.1 (VSOP87 algorithmic basis)."
    }
  };
}

/**
 * Creates an authoritative DomainReport adhering to Section 2 and 3 of the specification.
 */
export function createDomainReport(domainData = {}) {
  const domainId = domainData.domainId || "unspecified";
  const names = DOMAIN_DISPLAY_NAMES[domainId] || { en: domainId, ta: domainId };

  return {
    domainId,
    domainName: domainData.domainName || names,
    ruleId: domainData.ruleId || null,
    executiveConclusion: domainData.executiveConclusion || "",
    overallTraditionalAssessment: domainData.overallTraditionalAssessment || TRADITIONAL_ASSESSMENT.UNASSESSED,
    evidenceStrength: domainData.evidenceStrength || EVIDENCE_STRENGTH.INSUFFICIENT_DATA,
    positiveIndicators: Array.isArray(domainData.positiveIndicators) ? domainData.positiveIndicators : [],
    challengingIndicators: Array.isArray(domainData.challengingIndicators) ? domainData.challengingIndicators : [],
    neutralIndicators: Array.isArray(domainData.neutralIndicators) ? domainData.neutralIndicators : [],
    evidenceChain: Array.isArray(domainData.evidenceChain) ? domainData.evidenceChain : [],
    traditionalTimingWindows: Array.isArray(domainData.traditionalTimingWindows) ? domainData.traditionalTimingWindows : [],
    currentRelevance: domainData.currentRelevance || {
      isActiveNow: false,
      relevanceScore: "MODERATE",
      explanation: ""
    },
    futurePeriods: Array.isArray(domainData.futurePeriods) ? domainData.futurePeriods : [],
    subPhaseAnalysis: Array.isArray(domainData.subPhaseAnalysis) ? domainData.subPhaseAnalysis : [],
    contradictions: Array.isArray(domainData.contradictions) ? domainData.contradictions : [],
    resolution: domainData.resolution || RESOLUTION.MULTI_YEAR_RANGE,
    empiricalStatus: domainData.empiricalStatus || EMPIRICAL_STATUS.NOT_ESTABLISHED,
    empiricalResolution: domainData.empiricalResolution || EMPIRICAL_RESOLUTION.NOT_ESTABLISHED,
    practicalGuidance: Array.isArray(domainData.practicalGuidance) ? domainData.practicalGuidance : [],
    whatCannotBeConcluded: Array.isArray(domainData.whatCannotBeConcluded) ? domainData.whatCannotBeConcluded : [],
    customerQuestions: Array.isArray(domainData.customerQuestions) ? domainData.customerQuestions : [],
    technicalEvidence: domainData.technicalEvidence || {}
  };
}
