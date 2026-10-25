/**
 * ASTROVERSE — Event Prerequisite Registry
 * =========================================
 * Version: 2.1.0
 * 
 * Defines deterministic prerequisites, minimum/maximum operational ages,
 * required life context, and explicit disqualification boundaries for life events.
 * 
 * Strict Invariants:
 * - Never assign adult career, marriage, property, or advanced research events to minors (<18).
 * - Never invent surrogate childhood predictions (e.g., father's promotion, parent's marriage).
 * - Unknown context must NEVER be treated as present.
 */

export const EVENT_REGISTRY_VERSION = "2.1.0";

export const CONTEXT_STATUS = Object.freeze({
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  UNKNOWN: "UNKNOWN"
});

export const EVENT_CATEGORIES = Object.freeze({
  CAREER: "CAREER",
  BUSINESS: "BUSINESS",
  RELATIONSHIP: "RELATIONSHIP",
  FINANCIAL_ASSETS: "FINANCIAL_ASSETS",
  EDUCATION: "EDUCATION",
  WELLNESS: "WELLNESS",
  GOVERNANCE: "GOVERNANCE",
  ASTRONOMICAL: "ASTRONOMICAL"
});

export const EVENT_DEFINITIONS = Object.freeze({
  JOB_PROMOTION: {
    id: "JOB_PROMOTION",
    category: EVENT_CATEGORIES.CAREER,
    minAge: 18,
    maxAge: null, // No arbitrary upper limit
    requiredContext: ["employment"],
    scope: "ADULT_EMPLOYMENT",
    actor: "NATIVE",
    inapplicableReason: "Subject is below minimum adult employment age (18 years); career promotion inapplicable.",
    inapplicableReasonTa: "ஜாதகர் 18 வயதுக்குட்பட்டவர்; உத்தியோக உயர்வு பலன் பொருந்தாது."
  },
  BUSINESS_EXPANSION: {
    id: "BUSINESS_EXPANSION",
    category: EVENT_CATEGORIES.BUSINESS,
    minAge: 18,
    maxAge: null,
    requiredContext: ["business_ownership"],
    scope: "ADULT_ENTERPRISE",
    actor: "NATIVE",
    inapplicableReason: "Subject is below adult enterprise age or lacks business ownership context.",
    inapplicableReasonTa: "வணிக உரிமையாளர் சூழல் இல்லாத நிலையில் வணிக விரிவாக்கப் பலன் பொருந்தாது."
  },
  RESEARCH_PUBLICATION: {
    id: "RESEARCH_PUBLICATION",
    category: EVENT_CATEGORIES.EDUCATION,
    minAge: 18,
    maxAge: null, // Older adults CAN pursue research
    requiredContext: ["academic_or_researcher"],
    scope: "HIGHER_ACADEMIC",
    actor: "NATIVE",
    inapplicableReason: "Specialized academic research achievements and publications are inapplicable during childhood.",
    inapplicableReasonTa: "ஆராய்ச்சி வெற்றிகள் மற்றும் வெளியீடுகள் ஆரம்ப குழந்தை பருவத்தில் பொருந்தாது."
  },
  MARRIAGE_FORMATION: {
    id: "MARRIAGE_FORMATION",
    category: EVENT_CATEGORIES.RELATIONSHIP,
    minAge: 18,
    maxAge: null,
    requiredContext: [],
    scope: "ADULT_MATRIMONY",
    actor: "NATIVE",
    inapplicableReason: "Matrimonial negotiations and marriage formation are strictly prohibited for minors (<18 years). Child marriage content is never permitted.",
    inapplicableReasonTa: "18 வயதுக்குட்பட்ட மைனர் பருவத்தில் திருமண பேச்சுவார்த்தைகள் முற்றிலும் பொருந்தாது."
  },
  MARITAL_RELATIONSHIP_OUTLOOK: {
    id: "MARITAL_RELATIONSHIP_OUTLOOK",
    category: EVENT_CATEGORIES.RELATIONSHIP,
    minAge: 18,
    maxAge: null,
    requiredContext: ["marital_status_married"],
    scope: "EXISTING_MARRIAGE",
    actor: "NATIVE_AND_SPOUSE",
    inapplicableReason: "Marital relationship dynamics require verified existing marital status.",
    inapplicableReasonTa: "திருமண பந்தம் நிறுவப்படாத நிலையில் இல்லற இணக்க பலன் பொருந்தாது."
  },
  PROPERTY_PURCHASE: {
    id: "PROPERTY_PURCHASE",
    category: EVENT_CATEGORIES.FINANCIAL_ASSETS,
    minAge: 18,
    maxAge: null,
    requiredContext: [],
    scope: "LEGAL_ACQUISITION",
    actor: "NATIVE",
    inapplicableReason: "Independent real estate acquisitions, title contracts, and vehicle purchases require adult legal capacity.",
    inapplicableReasonTa: "சொத்து மற்றும் வாகன பதிவுக்கான சட்டரீதியான வயது (18) தேவைப்படுகிறது."
  },
  ADULT_DISPUTE_MANAGEMENT: {
    id: "ADULT_DISPUTE_MANAGEMENT",
    category: EVENT_CATEGORIES.GOVERNANCE,
    minAge: 18,
    maxAge: null,
    requiredContext: ["employment_or_business"],
    scope: "ORGANIZATIONAL_DUTY",
    actor: "NATIVE",
    inapplicableReason: "Managing corporate employee disputes, workplace litigation, and executive conflict are adult organizational duties.",
    inapplicableReasonTa: "பணியாளர் மேலாண்மை மற்றும் நிறுவன வழக்குகள் வயதுவந்தோருக்கான பொறுப்பாகும்."
  },
  RETIREMENT: {
    id: "RETIREMENT",
    category: EVENT_CATEGORIES.CAREER,
    minAge: 45,
    maxAge: null,
    requiredContext: ["employment"],
    scope: "LATE_CAREER",
    actor: "NATIVE",
    inapplicableReason: "Retirement cannot be inferred from age alone and is inapplicable in early career or childhood.",
    inapplicableReasonTa: "ஓய்வுபெறும் நிலை ஆரம்ப பருவத்தில் பொருந்தாது; வேலைவாய்ப்பு பின்னணி தேவை."
  },
  FOUNDATIONAL_EDUCATION: {
    id: "FOUNDATIONAL_EDUCATION",
    category: EVENT_CATEGORIES.EDUCATION,
    minAge: 3,
    maxAge: 18,
    requiredContext: [],
    scope: "SCHOOLING",
    actor: "NATIVE",
    inapplicableReason: "Schooling education applies between early childhood and completion of secondary education.",
    inapplicableReasonTa: "பள்ளிப் பருவம் 3 முதல் 18 வயது வரையிலான காலத்தில் பொருந்தும்."
  },
  HIGHER_EDUCATION: {
    id: "HIGHER_EDUCATION",
    category: EVENT_CATEGORIES.EDUCATION,
    minAge: 16,
    maxAge: null, // Older adults can also study!
    requiredContext: [],
    scope: "COLLEGE_UNIVERSITY",
    actor: "NATIVE",
    inapplicableReason: "Higher education (collegiate/university study) requires attainment of secondary school graduation age.",
    inapplicableReasonTa: "உயர் கல்வி கல்லூரிப் பருவத்திற்குரியது (16 வயதுக்கு மேல்)."
  },
  CALCULATED_PERIOD: {
    id: "CALCULATED_PERIOD",
    category: EVENT_CATEGORIES.ASTRONOMICAL,
    minAge: 0,
    maxAge: null,
    requiredContext: [],
    scope: "NON_EVENT_TIMELINE",
    actor: "NATIVE",
    inapplicableReason: null,
    inapplicableReasonTa: null
  }
});

/**
 * Normalizes user context and resolves status (PRESENT, ABSENT, UNKNOWN)
 *
 * @param {Object} contextMap - Context object with flags or status values
 * @param {string} key - The context prerequisite key
 * @returns {string} CONTEXT_STATUS
 */
export function resolveContextStatus(contextMap = {}, key) {
  if (!contextMap || typeof contextMap !== "object") return CONTEXT_STATUS.UNKNOWN;

  const val = contextMap[key];
  if (val === true || val === "PRESENT" || val === "present") return CONTEXT_STATUS.PRESENT;
  if (val === false || val === "ABSENT" || val === "absent") return CONTEXT_STATUS.ABSENT;

  // Key-specific aliases
  if (key === "employment" && contextMap.employed === true) return CONTEXT_STATUS.PRESENT;
  if (key === "employment" && contextMap.employed === false) return CONTEXT_STATUS.ABSENT;
  if (key === "business_ownership" && contextMap.businessOwner === true) return CONTEXT_STATUS.PRESENT;
  if (key === "business_ownership" && contextMap.businessOwner === false) return CONTEXT_STATUS.ABSENT;
  if (key === "academic_or_researcher" && contextMap.isResearcher === true) return CONTEXT_STATUS.PRESENT;
  if (key === "marital_status_married" && contextMap.isMarried === true) return CONTEXT_STATUS.PRESENT;
  if (key === "marital_status_married" && contextMap.isMarried === false) return CONTEXT_STATUS.ABSENT;

  return CONTEXT_STATUS.UNKNOWN;
}
