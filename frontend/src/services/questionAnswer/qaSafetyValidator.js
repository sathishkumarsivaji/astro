/**
 * ASTROVERSE — Q&A Safety & Anti-Fabrication Validator
 * =====================================================
 * Enforces strict safety protocols across life domains.
 * Blocks medical diagnosis, mortality/surgery claims, guaranteed legal wins,
 * financial return guarantees, and fabrication when data is absent.
 *
 * Strictly distinguishes astrological zodiac placements (e.g. sign of Cancer)
 * from pathological clinical claims (e.g. cancer diagnosis, tumor, oncology).
 */

const FORBIDDEN_MEDICAL_DIAGNOSIS_PATTERNS = [
  /\b(?:proves?\s+(?:that\s+)?(?:you|native)\s+have\s+cancer|diagnos\w*.*cancer|cure\s+cancer|suffering\s+from\s+cancer|cancer\s+(?:disease|tumor|tumour|stage|patient|diagnosis|treatment|chemo|oncology)|has\s+cancer|contract\s+cancer)\b/i,
  /\b(malignan\w*|tumor\w*|carcinoma|leukemia|sarcoma|melanoma)\b/i,
  /\b(surgery|operation|amputat)\b/i,
  /\b(death|fatal|die|mortality|lifespan\s*end)\b/i,
  /\b(organ\s*failure|kidney\s*failure|heart\s*attack|stroke)\b/i,
  /\b(neurological\s*injury|brain\s*damage)\b/i,
  /\b(stop\s+prescribed\s+treatment|discontinue\s+medication|avoid\s+doctor)\b/i,
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
 * Checks whether an occurrence of the word "cancer" in text refers strictly
 * to the astrological zodiac sign (Cancer / Kataka) rather than a pathology.
 *
 * @param {string} text - Proposed text snippet
 * @returns {boolean} True if "cancer" is used solely in an astrological context
 */
export function isZodiacCancer(text) {
  if (!/\bcancer\b/i.test(text)) return false;

  const zodiacPatterns = [
    /\b(?:house|cusp|sign|in|ascendant|lagna|rising|moon|sun|mercury|venus|mars|jupiter|saturn|rahu|ketu|navamsha|rashi|rasi|zodiac|kataka|karkata)\s+(?:of\s+)?cancer\b/i,
    /\bcancer\s+(?:is\s+the\s+zodiac\s+sign|is\s+in|sign|rashi|rasi|house|cusp|lagna|ascendant|rising|navamsha|moon|sun|mercury|venus|mars|jupiter|saturn|rahu|ketu|kataka|karkata)\b/i,
    /\bcancer\s*\([A-Za-z\s]+\)/i,
    /\b(?:fourth|first|second|third|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+house\s+(?:is\s+)?in\s+cancer\b/i,
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:house|cusp)\s+(?:is\s+)?in\s+cancer\b/i,
    /\bcancer\s+is\s+the\s+zodiac\s+sign\s+shown\s+in\s+this\s+chart\b/i
  ];

  const hasZodiacContext = zodiacPatterns.some(p => p.test(text));
  const hasMedicalDiagnosticContext = FORBIDDEN_MEDICAL_DIAGNOSIS_PATTERNS.some(p => p.test(text));

  return hasZodiacContext && !hasMedicalDiagnosticContext;
}

/**
 * Validates text against safety protocols with context-aware zodiac sign preservation.
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
  const isTamil = /[\u0B80-\u0BFF]/.test(sanitizedText);

  // 1. Wellness safety (Context-Aware: preserves astrological sign Cancer)
  if (/\bcancer\b/i.test(sanitizedText)) {
    if (!isZodiacCancer(sanitizedText)) {
      for (const pattern of FORBIDDEN_MEDICAL_DIAGNOSIS_PATTERNS) {
        if (pattern.test(sanitizedText)) {
          violations.push(`Forbidden wellness claim detected: ${pattern}`);
          sanitizedText = sanitizedText.replace(pattern, isTamil
            ? "பாரம்பரிய ஜோதிட கணிப்பு மருத்துவ நோயறிதலை அளிக்காது"
            : "Astrological indicators do not constitute medical diagnosis"
          );
        }
      }
      if (/\bcancer\b/i.test(sanitizedText) && !isZodiacCancer(sanitizedText)) {
        violations.push("Forbidden pathological diagnosis: cancer");
        sanitizedText = sanitizedText.replace(/\bcancer\b/gi, isTamil
          ? "பாரம்பரிய ஜோதிட குறியீடு"
          : "astrological indication"
        );
      }
    }
  }

  // Other forbidden wellness claims (surgery, fatalistic mortality, organ failure, etc.)
  for (const pattern of FORBIDDEN_MEDICAL_DIAGNOSIS_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      violations.push(`Forbidden wellness claim detected: ${pattern}`);
      sanitizedText = sanitizedText.replace(pattern, isTamil
        ? "பாரம்பரிய ஜோதிட கணிப்பு மருத்துவ நோயறிதலை அளிக்காது"
        : "Astrological correspondence does not evaluate clinical pathology"
      );
    }
  }

  // 2. Legal safety
  for (const pattern of FORBIDDEN_LEGAL_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      violations.push(`Forbidden legal outcome guarantee detected: ${pattern}`);
      sanitizedText = sanitizedText.replace(pattern, isTamil
        ? "சட்ட ஆலோசனை மற்றும் தகுந்த விழிப்புணர்வுடன் அணுக வேண்டிய காலம்"
        : "Astrology cannot guarantee legal trial outcomes; licensed legal counsel must be consulted"
      );
    }
  }

  // 3. Finance safety
  for (const pattern of FORBIDDEN_FINANCE_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      violations.push(`Forbidden financial return guarantee detected: ${pattern}`);
      sanitizedText = sanitizedText.replace(pattern, isTamil
        ? "பொருளாதார வளர்ச்சிக்கு சாதகமான சாத்தியக்கூறுகள்"
        : "Astrological factors evaluate potential; financial returns cannot be guaranteed"
      );
    }
  }

  // 4. Children gender safety
  for (const pattern of FORBIDDEN_CHILDREN_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      violations.push(`Forbidden gender prediction detected: ${pattern}`);
      sanitizedText = sanitizedText.replace(pattern, isTamil
        ? "சந்தான பாக்கிய அமைப்புகள்"
        : "family welfare indicators"
      );
    }
  }

  // 5. Deterministic language safety
  for (const pattern of FORBIDDEN_DETERMINISTIC_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      violations.push(`Forbidden deterministic assertion detected: ${pattern}`);
      sanitizedText = sanitizedText.replace(pattern, isTamil
        ? "பாரம்பரிய ஜோதிட கணிப்பு வழிகாட்டுகிறது"
        : "traditional astrological correspondence indicates"
      );
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    sanitizedText,
    sanitized: sanitizedText
  };
}
