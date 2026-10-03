/**
 * ASTROVERSE — Server-Side AI Evidence Gate
 *
 * Backend must NEVER return raw AI text. Every AI response must pass through:
 * 1. Claim extraction — identify any astronomical/astrological claims
 * 2. Unsupported claim scan — flag claims with no evidence backing
 * 3. Health/legal/financial safety scan — ensure no diagnostic/advisory language
 * 4. Narrative sanitization — remove categorical prediction language
 *
 * This is the LAST LINE OF DEFENSE before AI text reaches the client.
 */

// Forbidden patterns in AI output
const FORBIDDEN_PATTERNS = [
  // Categorical prediction language
  /\bwill definitely\b/gi,
  /\bwill certainly\b/gi,
  /\bguarantees\b/gi,
  /\bensures\b/gi,
  /\bdestined to\b/gi,
  /\binevitable\b/gi,
  /\bcertain to\b/gi,
  /\bproves that\b/gi,
  /\bscientifically proven\b/gi,
  /\bmedically confirmed\b/gi,
];

// Health safety patterns
const HEALTH_DIAGNOSTIC_PATTERNS = [
  /\byou (will |may )?have [A-Z][a-z]+ (disease|cancer|syndrome|disorder)/gi,
  /\byou (will |should )?take [A-Z][a-z]+ (medicine|medication|drug|tablet)/gi,
  /\bdiagnos(is|ed|e)\b/gi,
  /\bprescri(be|ption|bed)\b/gi,
  /\bsurgery is (needed|required|indicated)\b/gi,
];

// Financial advisory patterns  
const FINANCIAL_ADVISORY_PATTERNS = [
  /\binvest in [A-Z]/gi,
  /\bbuy (stocks?|shares?|bonds?)\b/gi,
  /\bsell (stocks?|shares?|bonds?)\b/gi,
  /\b(guaranteed|certain) returns?\b/gi,
];

// Fabricated astronomical value patterns
const FABRICATED_VALUE_PATTERNS = [
  /\b\d{1,3}°\s*\d{1,2}'\s*\d{1,2}(\.\d+)?"\b/, // DMS format that AI might fabricate
  /longitude[:\s]+\d+\.\d{4,}/gi, // High-precision longitude AI might invent
];

/**
 * Sanitizes AI text by replacing forbidden patterns with safe alternatives.
 */
function sanitizeAIText(text) {
  const violations = [];
  let sanitized = text;
  
  const replacements = [
    [/\bwill definitely\b/gi, 'is indicated to'],
    [/\bwill certainly\b/gi, 'is strongly indicated to'],
    [/\bguarantees\b/gi, 'supports'],
    [/\bensures\b/gi, 'is traditionally associated with'],
    [/\bdestined to\b/gi, 'traditionally indicated for'],
    [/\binevitable\b/gi, 'strongly indicated'],
    [/\bcertain to\b/gi, 'indicated to'],
    [/\bproves that\b/gi, 'supports the interpretation that'],
    [/\bscientifically proven\b/gi, 'traditionally interpreted'],
    [/\bmedically confirmed\b/gi, 'noted in traditional practice'],
  ];
  
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(sanitized)) {
      violations.push(`Replaced forbidden pattern: ${pattern.source}`);
      sanitized = sanitized.replace(pattern, replacement);
    }
  }
  
  return { sanitized, violations };
}

/**
 * Scans for health/legal/financial safety violations.
 */
function scanSafety(text) {
  const violations = [];
  
  for (const pattern of HEALTH_DIAGNOSTIC_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      violations.push({ type: 'HEALTH_DIAGNOSTIC', pattern: pattern.source });
    }
  }
  
  for (const pattern of FINANCIAL_ADVISORY_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      violations.push({ type: 'FINANCIAL_ADVISORY', pattern: pattern.source });
    }
  }
  
  return violations;
}

/**
 * Main AI evidence gate function.
 * Call this on any AI-generated text BEFORE returning to the client.
 */
export function validateAndSanitizeAIResponse(rawText, chartContext = null) {
  if (!rawText || typeof rawText !== 'string') {
    return { 
      text: '', 
      isValid: false, 
      violations: ['Empty or non-string AI response'],
      sanitized: false 
    };
  }
  
  // 1. Sanitize forbidden prediction language
  const { sanitized, violations: sanitizationViolations } = sanitizeAIText(rawText);
  
  // 2. Safety scan
  const safetyViolations = scanSafety(sanitized);

  // 3. Grounding scan if chartContext provided
  const groundingViolations = [];
  if (chartContext && Array.isArray(chartContext.planets)) {
    const planetMap = new Map();
    for (const p of chartContext.planets) {
      if (p?.name) {
        planetMap.set(p.name.toLowerCase(), {
          house: typeof p.house === 'number' ? p.house : p.houseNum,
          sign: p.sign || p.signName
        });
      }
    }
    const regex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(?:is\s+)?(?:placed\s+in|in|occupies)\s+(?:the\s+)?(?:house\s+)?(1[0-2]|[1-9])(?:st|nd|rd|th)?(?:\s+house)?/gi;
    let m;
    while ((m = regex.exec(sanitized)) !== null) {
      const pName = m[1].toLowerCase();
      const assertedHouse = parseInt(m[2], 10);
      const fact = planetMap.get(pName);
      if (fact && fact.house != null && fact.house !== assertedHouse) {
        groundingViolations.push(`UNSUPPORTED_CLAIM: ${m[1]} is in House ${fact.house}, not House ${assertedHouse}`);
      }
    }
  }
  
  // 4. Add mandatory disclaimers if health/financial content detected
  let finalText = sanitized;
  const hasHealthContent = safetyViolations.some(v => v.type === 'HEALTH_DIAGNOSTIC');
  const hasFinancialContent = safetyViolations.some(v => v.type === 'FINANCIAL_ADVISORY');
  
  if (hasHealthContent) {
    finalText += '\n\n⚠️ Notice: Traditional astrological interpretation only. This does NOT constitute medical diagnosis, treatment recommendation, or health advice. Always consult qualified medical professionals.';
  }
  if (hasFinancialContent) {
    finalText += '\n\n⚠️ Notice: Traditional astrological interpretation only. This does NOT constitute financial advice, investment recommendation, or trading guidance. Consult qualified financial advisors.';
  }
  
  return {
    text: finalText,
    isValid: safetyViolations.length === 0 && groundingViolations.length === 0,
    violations: [
      ...sanitizationViolations,
      ...safetyViolations.map(v => `${v.type}: ${v.pattern}`),
      ...groundingViolations
    ],
    sanitized: sanitizationViolations.length > 0,
    disclaimersAdded: hasHealthContent || hasFinancialContent
  };
}
