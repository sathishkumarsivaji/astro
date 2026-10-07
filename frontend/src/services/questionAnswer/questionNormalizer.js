/**
 * ASTROVERSE — Question Normalizer
 * =================================
 * Cleans, sanitizes, and analyzes input question strings in English and Tamil.
 * Extracts grammatical question cues, linguistic intent markers, and targets.
 */

/**
 * Normalizes question text for robust semantic matching.
 *
 * @param {string} text - Raw input question
 * @returns {Object} Normalized question representation
 */
export function normalizeQuestion(text) {
  if (!text || typeof text !== "string") {
    return {
      raw: "",
      normalized: "",
      lang: "en",
      isTamil: false,
      cues: {
        isTiming: false,
        isComparison: false,
        isDirection: false,
        isDistance: false,
        isWhy: false,
        isWhat: false,
        isHow: false,
        isWhich: false,
        isRemedy: false,
        isFollowUp: false
      }
    };
  }

  const raw = text.trim();
  // Detect Tamil script
  const isTamil = /[\u0B80-\u0BFF]/.test(raw);
  const lang = isTamil ? "ta" : "en";

  // Normalize whitespace and common punctuation
  const normalized = raw
    .toLowerCase()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[?.,!;:—–/\\()\[\]{}'"]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Detect explicit cues
  const isTiming =
    /\b(when|timing|which\s+year|which\s+period|what\s+age|timeline|date|schedule|next\s+\d+\s+years?)\b/i.test(normalized) ||
    /எப்போது|எந்த\s*கால|எந்த\s*ஆண்டு|எந்த\s*வருடம்|எந்த\s*வயது|காலக்கோடு|காலக்கட்டம்|அடுத்த\s*\d+\s*(?:வருட|ஆண்டு)/i.test(raw);

  const isComparison =
    /\b(richer|wealthier|better|worse|higher|lower|more|less|compare|comparison|versus|vs|than\s+mine)\b/i.test(normalized) ||
    /விட\s*(வசதி|அதிக|உயர்ந்த|குறைந்த)|ஒப்பி|வசதியான\s*குடும்பமாக/i.test(raw);

  const isDirection =
    /\b(direction|which\s+direction|where\s+from|which\s+side|which\s+way)\b/i.test(normalized) ||
    /எந்த\s*திசை|திசையில்|எங்கிருந்து/i.test(raw);

  const isDistance =
    /\b(distance|how\s+far|kilometers?|km|miles?|distance\s+band)\b/i.test(normalized) ||
    /எவ்வளவு\s*தூரம்|தொலைவில்|தூர|கிலோமீட்டர்/i.test(raw);

  const isWhy =
    /\b(why|how\s+come|what\s+causes|reason|rationale)\b/i.test(normalized) ||
    /ஏன்|எதனால்|காரணம்/i.test(raw);

  const isWhat =
    /\b(what|what\s+is|what\s+does)\b/i.test(normalized) ||
    /என்ன|எவை/i.test(raw);

  const isHow =
    /\b(how|in\s+what\s+manner)\b/i.test(normalized) ||
    /எப்படி|எவ்வாறு/i.test(raw);

  const isWhich =
    /\b(which)\b/i.test(normalized) ||
    /எந்த/i.test(raw);

  const isRemedy =
    /\b(remedy|remedies|gemstone|stone|mantra|pariharam|charity|donation)\b/i.test(normalized) ||
    /பரிகாரம்|ரத்தினம்|கல்|மந்திரம்|தானம்/i.test(raw);

  // Follow-up detection (elliptical queries like "2027?", "why?", "and then?")
  const isFollowUp =
    /^(20\d\d|why|what\s+about\s+20\d\d|and\s+then|what\s+else)\??$/i.test(raw) ||
    /^(20\d\d|ஏன்|பிறகு|அடுத்து)\??$/i.test(raw);

  return {
    raw,
    normalized,
    lang,
    isTamil,
    cues: {
      isTiming,
      isComparison,
      isDirection,
      isDistance,
      isWhy,
      isWhat,
      isHow,
      isWhich,
      isRemedy,
      isFollowUp
    }
  };
}
