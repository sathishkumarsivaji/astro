/**
 * ASTROVERSE — Post-Generation LLM Firewall & Grounding Verifier
 * ===============================================================
 * Validates generated answer text against the structured Answer Object.
 * Enforces zero fabrication of uncalculated planets, ungrounded dates,
 * deterministic assertions, or tampered INSUFFICIENT_DATA states.
 *
 * Implements Section 22 and Section 31 of the Precision Q&A Engine Mandate.
 */

const FORBIDDEN_DETERMINISTIC_PATTERNS = [
  /\b(?:proves\s+that|guarantees\s+that|will\s+definitely\s+occur|100%\s+certain)\b/i,
  /\b(?:unconditionally\s+ensures|undeniable\s+certainty|guaranteed\s+success)\b/i,
  /(?:நிச்சயமாக\s*நடக்கும்|உறுதியாக\s*நடைபெறும்|100%\s*உறுதி|நிச்சயமான\s*வெற்றி)/
];

/**
 * Validates generated text against the canonical Answer Object.
 *
 * @param {Object} params
 * @param {string} params.text - Output text produced by language layer
 * @param {Object} params.answerObject - Validated pre-synthesis Answer Object
 * @param {boolean} [params.isTamil=false] - Language flag
 * @returns {Object} Verification result { isValid: boolean, sanitizedText: string, violations: Array }
 */
export function verifyGeneratedAnswer({ text, answerObject, isTamil = false }) {
  if (!text || typeof text !== "string") {
    return { isValid: false, sanitizedText: "", violations: ["Output text is empty or invalid."] };
  }

  const violations = [];
  let sanitized = text;

  // 1. TAMPER CHECK: INSUFFICIENT_DATA changed to likely/favorable
  if (answerObject.answerability === "INSUFFICIENT_DATA") {
    if (/\b(?:likely\s+to\s+occur|highly\s+favorable\s+period|promising\s+outcome)\b/i.test(text) &&
        !/\bcannot\b/i.test(text)) {
      violations.push("CRITICAL_TAMPER: INSUFFICIENT_DATA state converted into positive prediction.");
      sanitized = isTamil
        ? "[நேரடி பதில்]\nஇந்த கேள்விக்கு கிடைக்கக்கூடிய ஜாதகத் தரவுகள் போதுமானதாக இல்லை.\n[ஆதார நிலை]\nINSUFFICIENT_DATA"
        : "[Direct Answer]\nSufficient chart data is not available to answer this question deterministically.\n[Evidence Status]\nINSUFFICIENT_DATA";
    }
  }

  // 2. TIMING CHECK: Introduction of fabricated years absent from timingWindows
  const mentionedYears = (text.match(/\b(20[2-4][0-9])\b/g) || []).map(Number);
  if (mentionedYears.length > 0) {
    const validYears = new Set();

    // Add years from timingWindows
    for (const tw of (answerObject.timingWindows || [])) {
      const s = parseInt(String(tw.windowStart).slice(0, 4), 10);
      const e = parseInt(String(tw.windowEnd).slice(0, 4), 10);
      if (s) validYears.add(s);
      if (e) validYears.add(e);
      if (s && e) {
        for (let y = s; y <= e; y++) validYears.add(y);
      }
    }

    // Add years from question
    const qYears = (answerObject.question.rawQuestion.match(/\b(20[2-4][0-9])\b/g) || []).map(Number);
    qYears.forEach(y => validYears.add(y));

    // Current year baseline
    validYears.add(new Date().getFullYear());

    for (const my of mentionedYears) {
      if (!validYears.has(my)) {
        violations.push(`FABRICATED_DATE: Generated text introduced year ${my} absent from calculated timing windows.`);
      }
    }
  }

  // 3. DETERMINISTIC LANGUAGE CHECK
  for (const pat of FORBIDDEN_DETERMINISTIC_PATTERNS) {
    if (pat.test(sanitized)) {
      violations.push("DETERMINISTIC_ASSERTION: Generated text contains forbidden deterministic phrasing.");
      sanitized = sanitized
        .replace(/will definitely occur/gi, "is traditionally indicated as favorable")
        .replace(/proves that/gi, "traditionally suggests that")
        .replace(/guaranteed success/gi, "favorable potential")
        .replace(/guarantees/gi, "indicates potential for")
        .replace(/guaranteed/gi, "indicated")
        .replace(/100% certain/gi, "traditionally aligned")
        .replace(/unconditionally ensures/gi, "supports")
        .replace(/undeniable certainty/gi, "strong potential")
        .replace(/நிச்சயமாக\s*நடக்கும்/g, "பாரம்பரிய அடிப்படையில் சாதகமாக அமைய வாய்ப்புள்ளது")
        .replace(/உறுதியாக\s*நடைபெறும்/g, "பாரம்பரிய கணிதத்தில் சாதகமான தாக்கத்தை ஏற்படுத்துகிறது")
        .replace(/100%\s*உறுதி/g, "பாரம்பரிய சுட்டிக்காட்டுதல்")
        .replace(/நிச்சயமான\s*வெற்றி/g, "சாதகமான வாய்ப்புகள்");
    }
  }

  // 4. PLANETARY GROUNDING CHECK
  // Prohibit Western non-classical outer planets if asserted as fact
  if (/\b(?:pluto|neptune|uranus)\b/i.test(sanitized)) {
    violations.push("UNGROUNDED_PLANET: Non-classical planet asserted in traditional Jyotish context.");
    sanitized = sanitized.replace(/\b(?:pluto|neptune|uranus)\b/gi, "uncalculated factor");
  }

  return {
    isValid: violations.length === 0,
    sanitizedText: sanitized,
    violations
  };
}
