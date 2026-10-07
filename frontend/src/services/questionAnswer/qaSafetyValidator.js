/**
 * ASTROVERSE — Q&A Safety & Anti-Fabrication Validator
 * =====================================================
 * Enforces strict safety protocols across life domains.
 * Blocks medical diagnosis, mortality/surgery claims, guaranteed legal wins,
 * financial return guarantees, and fabrication when data is absent.
 */

const FORBIDDEN_WELLNESS_PATTERNS = [
  /\b(cancer|malignan|tumor)\b/i,
  /\b(surgery|operation|amputat)\b/i,
  /\b(death|fatal|die|mortality|lifespan\s*end)\b/i,
  /\b(organ\s*failure|kidney\s*failure|heart\s*attack|stroke)\b/i,
  /\b(neurological\s*injury|brain\s*damage)\b/i,
  /புற்றுநோய்|அறுவை\s*சிகிச்சை|மரணம்|உயிரிழப்பு|மாரடைப்பு|பக்கவாதம்|உறுப்பு\s*செயலிழப்பு/
];

const FORBIDDEN_LEGAL_PATTERNS = [
  /\b(guarantee.*win|guaranteed\s*verdict|court\s*victory\s*guaranteed)\b/i,
  /நீதிமன்ற\s*வெற்றி\s*உறுதி|வழக்கில்\s*நிச்சயம்\s*வெற்றி/
];

const FORBIDDEN_FINANCE_PATTERNS = [
  /\b(guaranteed\s*profit|guaranteed\s*return|100%\s*gain|sure\s*profit)\b/i,
  /உறுதியான\s*லாபம்|நிச்சய\s*வருமானம்/
];

const FORBIDDEN_CHILDREN_PATTERNS = [
  /\b(boy\s*only|girl\s*only|gender\s*guarantee|male\s*child\s*guaranteed|female\s*child\s*guaranteed)\b/i,
  /ஆண்\s*குழந்தை\s*மட்டுமே|பெண்\s*குழந்தை\s*மட்டுமே|பாலின\s*உறுதி/
];

const FORBIDDEN_DETERMINISTIC_PATTERNS = [
  /\b(proves\s+that|proves\s+definitively|guarantees\s+that|guarantees\s+success|will\s+definitely\s+occur|confirmed\s+outcome|absolute\s+certainty)\b/i,
  /நிச்சயமாக\s*நடக்கும்|உறுதியாக\s*நிரூபிக்கிறது|விதியை\s*மாற்ற\s*முடியாது|கட்டாயம்\s*நடக்கும்/
];

/**
 * Validates text against safety protocols.
 *
 * @param {string} text - Proposed answer text
 * @param {string} domain - Domain name
 * @returns {Object} { isValid: boolean, violations: Array<string>, sanitizedText: string }
 */
export function validateSafety(text, domain) {
  if (!text || typeof text !== "string") {
    return { isValid: true, violations: [], sanitizedText: "" };
  }

  const violations = [];
  let sanitizedText = text;

  // 1. Wellness safety
  for (const pattern of FORBIDDEN_WELLNESS_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      violations.push(`Forbidden wellness claim detected: ${pattern}`);
      sanitizedText = sanitizedText.replace(pattern, "[redacted wellness indication]");
    }
  }

  // 2. Legal safety
  for (const pattern of FORBIDDEN_LEGAL_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      violations.push(`Forbidden legal outcome guarantee detected: ${pattern}`);
      sanitizedText = sanitizedText.replace(pattern, "சட்ட ஆலோசனை மற்றும் தகுந்த விழிப்புணர்வுடன் அணுக வேண்டிய காலம்");
    }
  }

  // 3. Finance safety
  for (const pattern of FORBIDDEN_FINANCE_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      violations.push(`Forbidden financial return guarantee detected: ${pattern}`);
      sanitizedText = sanitizedText.replace(pattern, "பொருளாதார வளர்ச்சிக்கு சாதகமான சாத்தியக்கூறுகள்");
    }
  }

  // 4. Children gender safety
  for (const pattern of FORBIDDEN_CHILDREN_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      violations.push(`Forbidden gender prediction detected: ${pattern}`);
      sanitizedText = sanitizedText.replace(pattern, "சந்தான பாக்கிய அமைப்புகள்");
    }
  }

  // 5. Deterministic language safety (Mandate 12)
  for (const pattern of FORBIDDEN_DETERMINISTIC_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      violations.push(`Forbidden deterministic assertion detected: ${pattern}`);
      sanitizedText = sanitizedText.replace(pattern, "பாரம்பரிய ஜோதிட கணிப்பு வழிகாட்டுகிறது");
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    sanitizedText
  };
}
