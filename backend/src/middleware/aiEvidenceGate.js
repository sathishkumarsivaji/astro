/**
 * ASTROVERSE — Server-Side AI Evidence Gate & Epistemic Grounding Pipeline
 *
 * Backend must NEVER return ungrounded or contradictory AI text. Every AI response must pass through:
 * 1. Claim extraction — identify astronomical placements, signs, and dasha claims
 * 2. Evidence verification — verify assertions against authentic calculated chartContext
 * 3. Contradiction & unsupported claim redaction — remove/replace claims that contradict chart facts
 * 4. Fabricated value detection — scan and redact invented high-precision DMS or longitudes
 * 5. Statutory safety scan — detect health diagnostic, financial advisory, and legal advisory language
 * 6. Narrative sanitization — replace categorical/fatalistic language with calibrated traditional phrasing
 * 7. Statutory disclaimers — inject mandatory legal, medical, and financial disclaimers
 *
 * This is the LAST LINE OF DEFENSE before AI text reaches the client.
 */

const PLANET_NAMES = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'
];

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Forbidden categorical prediction language
const FORBIDDEN_PATTERNS = [
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
  /\b100%\s+accurate\b/gi,
  /\b100%\s+accuracy\b/gi,
  /\babsolute\s+certainty\b/gi,
  /\bexact\s+prediction\b/gi
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

// Legal advisory patterns
const LEGAL_ADVISORY_PATTERNS = [
  /\bfile (a )?(lawsuit|suit|case|petition)\b/gi,
  /\byou (will |should )?(win|lose) (the|your) (case|trial|lawsuit|litigation)\b/gi,
  /\blegal (advice|counsel|representation)\b/gi,
  /\bcourt will rule in your favor\b/gi,
  /\bsettle out of court\b/gi,
  /\bguaranteed legal victory\b/gi,
  /\bbypass legal proceedings\b/gi
];

// Fabricated astronomical value patterns
const FABRICATED_VALUE_PATTERNS = [
  /\b\d{1,3}°\s*\d{1,2}'\s*\d{1,2}(?:\.\d+)?"/g, // DMS format that AI might fabricate
  /longitude[:\s]+\d+\.\d{4,}/gi,                 // High-precision longitude AI might invent
];

function normalizePlanetName(name) {
  if (!name) return '';
  const lower = name.toLowerCase();
  const match = PLANET_NAMES.find(p => p.toLowerCase() === lower);
  return match || name;
}

/**
 * Sanitizes AI text by replacing forbidden categorical patterns with safe alternatives.
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
    [/\b100%\s+accurate\b/gi, 'methodologically aligned'],
    [/\b100%\s+accuracy\b/gi, 'traditional rule convergence'],
    [/\babsolute\s+certainty\b/gi, 'strong traditional alignment'],
    [/\bexact\s+prediction\b/gi, 'calculated timing window']
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
 * Scans for health, legal, and financial safety violations.
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

  for (const pattern of LEGAL_ADVISORY_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      violations.push({ type: 'LEGAL_ADVISORY', pattern: pattern.source });
    }
  }
  
  return violations;
}

/**
 * Scans for fabricated high-precision astronomical coordinates not backed by calculated chart.
 */
function scanFabricatedValues(text, chartContext) {
  const fabricated = [];
  let sanitized = text;

  for (const pattern of FABRICATED_VALUE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(sanitized)) !== null) {
      const coordStr = match[0];
      let matchesCalculated = false;
      if (chartContext && Array.isArray(chartContext.planets)) {
        for (const p of chartContext.planets) {
          if (p.longitude != null) {
            const degInt = Math.floor(p.longitude);
            if (coordStr.includes(String(degInt)) || coordStr.includes(p.longitude.toFixed(2))) {
              matchesCalculated = true;
              break;
            }
          }
        }
      }
      if (!matchesCalculated) {
        fabricated.push({ type: 'FABRICATED_ASTRONOMICAL_VALUE', value: coordStr });
        sanitized = sanitized.replace(coordStr, '[UNVERIFIED_COORDINATE_REDACTED]');
      }
    }
  }

  return { sanitized, fabricated };
}

/**
 * Builds a fast lookup map for planets from chartContext.
 */
function buildPlanetFactMap(chartContext) {
  const map = new Map();
  if (!chartContext) return map;

  const planetList = Array.isArray(chartContext.planets)
    ? chartContext.planets
    : (chartContext.planets instanceof Map ? Array.from(chartContext.planets.values()) : []);

  for (const p of planetList) {
    if (!p || !p.name) continue;
    const name = normalizePlanetName(p.name);
    map.set(name, {
      name,
      house: typeof p.house === 'number' ? p.house : (typeof p.houseNum === 'number' ? p.houseNum : null),
      sign: p.sign || p.signName || null,
      longitude: p.longitude ?? null,
      isRetrograde: Boolean(p.isRetrograde || p.retrograde)
    });
  }
  return map;
}

/**
 * Main AI evidence gate function.
 * Call this on any AI-generated text BEFORE returning to the client.
 */
export function validateAndSanitizeAIResponse(rawText, chartContext = null, options = {}) {
  if (!rawText || typeof rawText !== 'string') {
    return { 
      text: '', 
      isValid: false, 
      violations: ['Empty or non-string AI response'],
      sanitized: false,
      verifiedClaims: [],
      unsupportedClaims: [],
      contradictoryClaims: [],
      disclaimersAdded: false
    };
  }
  
  // 1. Sanitize forbidden prediction language
  const { sanitized: textAfterLanguageScan, violations: sanitizationViolations } = sanitizeAIText(rawText);
  let workingText = textAfterLanguageScan;

  // 2. Safety scan (Health, Financial, Legal)
  const safetyViolations = scanSafety(workingText);

  // 3. Fabricated coordinate scan
  const { sanitized: textAfterFabricationScan, fabricated: fabricatedViolations } = scanFabricatedValues(workingText, chartContext);
  workingText = textAfterFabricationScan;

  // 4. Grounding verification against calculated chart data
  const verifiedClaims = [];
  const unsupportedClaims = [];
  const contradictoryClaims = [];

  if (chartContext) {
    const planetFacts = buildPlanetFactMap(chartContext);
    const evidenceNodeIds = new Set(
      Array.isArray(chartContext.evidenceNodes)
        ? chartContext.evidenceNodes.map(n => n.nodeId || n.evidenceId)
        : (Array.isArray(chartContext.evidenceIds) ? chartContext.evidenceIds : [])
    );

    // 4A. Planet-to-house assertions
    const houseRegex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(?:is\s+)?(?:placed\s+in|in|occupies)\s+(?:the\s+)?(?:house\s+)?(1[0-2]|[1-9])(?:st|nd|rd|th)?(?:\s+house)?/gi;
    let m;
    while ((m = houseRegex.exec(workingText)) !== null) {
      const pName = normalizePlanetName(m[1]);
      const assertedHouse = parseInt(m[2], 10);
      const fact = planetFacts.get(pName);

      if (!fact || fact.house == null) {
        unsupportedClaims.push({
          claimText: m[0],
          reason: `PLANET_NOT_FOUND_IN_CHART: Cannot verify ${pName}`,
          status: 'UNSUPPORTED_CLAIM'
        });
      } else if (fact.house === assertedHouse) {
        const evId = Array.from(evidenceNodeIds).find(id => id.toLowerCase().includes(pName.toLowerCase())) || `EV_PLANET_${pName.toUpperCase()}_H${fact.house}`;
        verifiedClaims.push({
          claimText: m[0],
          matchedFactor: `${pName} in House ${fact.house}`,
          evidenceIds: [evId],
          status: 'VERIFIED'
        });
      } else {
        contradictoryClaims.push({
          claimText: m[0],
          reason: `Calculated ${pName} is in House ${fact.house}, not House ${assertedHouse}`,
          status: 'CONTRADICTS_CALCULATED_CHART'
        });
      }
    }

    // 4B. Planet-to-sign assertions
    const signsPattern = SIGN_NAMES.join('|');
    const signRegex = new RegExp(`(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\\s+(?:is\\s+)?(?:placed\\s+in\\s+|in\\s+)(${signsPattern})`, 'gi');
    let sm;
    while ((sm = signRegex.exec(workingText)) !== null) {
      const pName = normalizePlanetName(sm[1]);
      const assertedSign = sm[2];
      const fact = planetFacts.get(pName);

      if (fact && fact.sign) {
        if (fact.sign.toLowerCase() === assertedSign.toLowerCase()) {
          const evId = Array.from(evidenceNodeIds).find(id => id.toLowerCase().includes(pName.toLowerCase())) || `EV_PLANET_${pName.toUpperCase()}_${fact.sign.toUpperCase()}`;
          verifiedClaims.push({
            claimText: sm[0],
            matchedFactor: `${pName} in ${fact.sign}`,
            evidenceIds: [evId],
            status: 'VERIFIED'
          });
        } else {
          contradictoryClaims.push({
            claimText: sm[0],
            reason: `Calculated ${pName} is in ${fact.sign}, not ${assertedSign}`,
            status: 'CONTRADICTS_CALCULATED_CHART'
          });
        }
      }
    }

    // 4C. Dasha lord assertions
    const dashaRegex = /(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\s+(Mahadasha|Antardasha|Dasha|Bhukti)/gi;
    const dashaTable = chartContext.dashaTable || [];
    const tableLords = new Set(dashaTable.map(d => d.lord || d.mahadashaLord || d.mdLord).filter(Boolean).map(l => l.toLowerCase()));
    let dm;
    while ((dm = dashaRegex.exec(workingText)) !== null) {
      const pName = normalizePlanetName(dm[1]);
      if (tableLords.size > 0 && !tableLords.has(pName.toLowerCase())) {
        contradictoryClaims.push({
          claimText: dm[0],
          reason: `${pName} is not in calculated Vimshottari Dasha sequence`,
          status: 'CONTRADICTS_CALCULATED_CHART'
        });
      } else if (tableLords.has(pName.toLowerCase())) {
        verifiedClaims.push({
          claimText: dm[0],
          matchedFactor: `${pName} in calculated Dasha table`,
          evidenceIds: [`EV_DASHA_${pName.toUpperCase()}`],
          status: 'VERIFIED'
        });
      }
    }

    // REJECT / REDACT unsupported and contradictory claims from narrative text
    for (const c of contradictoryClaims) {
      if (c.claimText && workingText.includes(c.claimText)) {
        workingText = workingText.split(c.claimText).join(`[REMOVED: CONTRADICTORY CLAIM (${c.reason})]`);
      }
    }
    for (const u of unsupportedClaims) {
      if (u.claimText && workingText.includes(u.claimText)) {
        workingText = workingText.split(u.claimText).join(`[REMOVED: UNSUPPORTED CLAIM (${u.reason})]`);
      }
    }
  }

  // 5. Add mandatory statutory disclaimers if health, financial, or legal content detected
  let finalText = workingText;
  const hasHealthContent = safetyViolations.some(v => v.type === 'HEALTH_DIAGNOSTIC');
  const hasFinancialContent = safetyViolations.some(v => v.type === 'FINANCIAL_ADVISORY');
  const hasLegalContent = safetyViolations.some(v => v.type === 'LEGAL_ADVISORY');

  if (hasHealthContent) {
    finalText += '\n\n⚠️ Statutory Notice: Traditional astrological interpretation only. This does NOT constitute medical diagnosis, treatment recommendation, or health advice. Always consult qualified medical professionals.';
  }
  if (hasFinancialContent) {
    finalText += '\n\n⚠️ Statutory Notice: Traditional astrological interpretation only. This does NOT constitute financial advice, investment recommendation, or trading guidance. Consult qualified financial advisors.';
  }
  if (hasLegalContent) {
    finalText += '\n\n⚠️ Statutory Notice: Traditional astrological interpretation only. This does NOT constitute legal advice or formal attorney counsel. Always consult qualified legal professionals for legal matters.';
  }

  const isValid = safetyViolations.length === 0 &&
                  fabricatedViolations.length === 0 &&
                  contradictoryClaims.length === 0;

  return {
    text: finalText,
    isValid,
    violations: [
      ...sanitizationViolations,
      ...safetyViolations.map(v => `${v.type}: ${v.pattern}`),
      ...fabricatedViolations.map(v => `${v.type}: ${v.value}`),
      ...contradictoryClaims.map(c => `${c.status}: ${c.claimText} — ${c.reason}`),
      ...unsupportedClaims.map(u => `${u.status}: ${u.claimText} — ${u.reason}`)
    ],
    sanitized: sanitizationViolations.length > 0 ||
               fabricatedViolations.length > 0 ||
               contradictoryClaims.length > 0 ||
               unsupportedClaims.length > 0,
    verifiedClaims,
    unsupportedClaims,
    contradictoryClaims,
    disclaimersAdded: hasHealthContent || hasFinancialContent || hasLegalContent
  };
}
