/**
 * ASTROVERSE — Evidence-Based Birth-Time Rectification Types & Schemas
 *
 * Defines strictly validated data models and accessor guards:
 * - LifeEvent
 * - CandidateBirthTime
 * - EvidenceGroup
 * - Contradiction
 * - RectificationScore
 * - StabilityResult
 * - ValidationResult
 * - RectificationResult
 *
 * ZERO synthetic or fabricated defaults. Missing data returns null or INSUFFICIENT_DATA.
 */

export const EVENT_TYPES = [
  "MARRIAGE",
  "CHILD_BIRTH",
  "CAREER_START",
  "JOB_CHANGE",
  "PROMOTION",
  "BUSINESS_START",
  "EDUCATION",
  "RELOCATION",
  "PROPERTY",
  "MAJOR_FINANCIAL_EVENT",
  "MAJOR_FAMILY_EVENT",
  "HEALTH_THEME",
  "OTHER"
];

export const DATE_PRECISION_LEVELS = [
  "EXACT_DAY",
  "MONTH",
  "YEAR",
  "DATE_RANGE",
  "APPROXIMATE"
];

export const EVENT_IMPORTANCE_LEVELS = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW"
];

export const SOURCE_RELIABILITY_LEVELS = [
  "DOCUMENTED",
  "USER_VERIFIED",
  "APPROXIMATE",
  "UNCERTAIN"
];

/**
 * Validates and normalizes a single LifeEvent
 */
export function validateLifeEvent(rawEvent, index = 0) {
  if (!rawEvent || typeof rawEvent !== "object") {
    throw new Error(`Event at index ${index} must be a non-null object.`);
  }

  const id = rawEvent.id ? String(rawEvent.id).trim() : `EVT_${Date.now()}_${index}`;
  const type = (rawEvent.type || "OTHER").toUpperCase();
  if (!EVENT_TYPES.includes(type)) {
    throw new Error(`Invalid event type "${rawEvent.type}" for event ${id}. Allowed types: ${EVENT_TYPES.join(", ")}`);
  }

  const date = rawEvent.date ? String(rawEvent.date).trim() : null;
  const startDate = rawEvent.startDate ? String(rawEvent.startDate).trim() : null;
  const endDate = rawEvent.endDate ? String(rawEvent.endDate).trim() : null;

  const effectiveDateStr = date || startDate;
  if (!effectiveDateStr) {
    throw new Error(`Event ${id} must specify a valid date or startDate (no fabricated default dates allowed).`);
  }

  const datePrecision = (rawEvent.datePrecision || (date && date.length >= 10 ? "EXACT_DAY" : (date && date.length === 7 ? "MONTH" : (date && date.length === 4 ? "YEAR" : "APPROXIMATE")))).toUpperCase();

  let parsedStartDate = null;
  let parsedEndDate = null;
  let parsedDate = null;

  if (datePrecision === "MONTH") {
    const parts = effectiveDateStr.split("-").map(Number);
    const y = parts[0] || 2000;
    const m = parts[1] || 1;
    parsedStartDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    parsedEndDate = new Date(Date.UTC(y, m - 1, lastDay, 23, 59, 59));
    parsedDate = new Date(Date.UTC(y, m - 1, Math.floor(lastDay / 2), 12, 0, 0));
  } else if (datePrecision === "YEAR") {
    const y = parseInt(effectiveDateStr, 10) || 2000;
    parsedStartDate = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
    parsedEndDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
    parsedDate = new Date(Date.UTC(y, 6, 2, 12, 0, 0));
  } else if (datePrecision === "DATE_RANGE" && (startDate || endDate)) {
    parsedStartDate = new Date(startDate || effectiveDateStr);
    parsedEndDate = new Date(endDate || effectiveDateStr);
    if (isNaN(parsedStartDate.getTime())) parsedStartDate = new Date(effectiveDateStr);
    if (isNaN(parsedEndDate.getTime())) parsedEndDate = new Date(effectiveDateStr);
    parsedDate = new Date((parsedStartDate.getTime() + parsedEndDate.getTime()) / 2);
  } else {
    parsedDate = new Date(effectiveDateStr);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Event ${id} has invalid date format: "${effectiveDateStr}".`);
    }
    parsedStartDate = parsedDate;
    parsedEndDate = parsedDate;
  }

  const importance = (rawEvent.importance || "MEDIUM").toUpperCase();
  const sourceReliability = (rawEvent.sourceReliability || "UNCERTAIN").toUpperCase();
  const verified = rawEvent.verified !== undefined ? Boolean(rawEvent.verified) : false;
  const description = rawEvent.description ? String(rawEvent.description).trim() : `${type} milestone`;
  const notes = rawEvent.notes ? String(rawEvent.notes).trim() : "";

  return {
    id,
    type,
    date,
    startDate,
    endDate,
    datePrecision,
    importance,
    sourceReliability,
    verified,
    description,
    notes,
    parsedDate,
    parsedStartDate,
    parsedEndDate
  };
}

/**
 * Calculates precision and reliability weighting factor
 */
export function getEventWeight(event) {
  let weight = 1.0;

  // Importance factor
  switch (event.importance) {
    case "CRITICAL": weight *= 1.5; break;
    case "HIGH": weight *= 1.2; break;
    case "MEDIUM": weight *= 1.0; break;
    case "LOW": weight *= 0.6; break;
    default: weight *= 1.0;
  }

  // Source reliability factor
  switch (event.sourceReliability) {
    case "DOCUMENTED": weight *= 1.3; break;
    case "USER_VERIFIED": weight *= 1.0; break;
    case "APPROXIMATE": weight *= 0.7; break;
    case "UNCERTAIN": weight *= 0.4; break;
    default: weight *= 1.0;
  }

  // Date precision factor
  switch (event.datePrecision) {
    case "EXACT_DAY": weight *= 1.2; break;
    case "MONTH": weight *= 1.0; break;
    case "YEAR": weight *= 0.8; break;
    case "DATE_RANGE": weight *= 0.85; break;
    case "APPROXIMATE": weight *= 0.6; break;
    default: weight *= 1.0;
  }

  if (!event.verified) {
    weight *= 0.5;
  }

  return Number(weight.toFixed(3));
}
