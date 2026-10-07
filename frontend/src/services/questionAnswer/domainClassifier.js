/**
 * ASTROVERSE — Domain Classifier
 * ===============================
 * Maps questions to one or more specific life domains.
 * Ensures questions are answered strictly within relevant domain boundaries.
 */

export const DOMAINS = Object.freeze({
  MARRIAGE: "marriage",
  PROPERTY: "property",
  CAREER: "career",
  EDUCATION: "education",
  CHILDREN: "children",
  FOREIGN_TRAVEL: "foreignTravel",
  VEHICLE: "vehicle",
  BUSINESS: "business",
  JOB: "job",
  FINANCE: "finance",
  FAMILY: "family",
  LEADERSHIP: "leadership",
  WELLNESS: "wellness",
  LEGAL: "legal",
  SPIRITUAL: "spiritual",
  CAUTION: "caution",
  MILESTONES: "milestones",
  DASHA: "dasha",
  VARGA: "varga",
  GENERAL: "general"
});

/**
 * Classifies which domains a question pertains to.
 *
 * @param {Object} normalizedQ - Normalized question
 * @param {Object} intentResult - Classified intent
 * @param {Array} [history=[]] - Conversation history
 * @returns {Object} { primaryDomain, domains: Array<string> }
 */
export function classifyDomains(normalizedQ, intentResult, history = []) {
  const text = normalizedQ.raw || "";
  const norm = normalizedQ.normalized || "";
  const intents = new Set(intentResult?.intents || []);

  const domains = new Set();

  // 1. Map directly from intent if specialized
  if (intents.has("SPOUSE_FAMILY") || intents.has("SPOUSE_DIRECTION") || intents.has("SPOUSE_DISTANCE") || intents.has("SPOUSE_CHARACTERISTICS") || intents.has("MARRIAGE")) {
    domains.add(DOMAINS.MARRIAGE);
    if (intents.has("SPOUSE_FAMILY")) {
      domains.add(DOMAINS.FAMILY);
      domains.add(DOMAINS.FINANCE);
    }
  }

  if (intents.has("CAREER") || intents.has("JOB") || intents.has("BUSINESS")) {
    if (intents.has("JOB")) domains.add(DOMAINS.JOB);
    if (intents.has("BUSINESS")) domains.add(DOMAINS.BUSINESS);
    domains.add(DOMAINS.CAREER);
  }

  if (intents.has("PROPERTY")) domains.add(DOMAINS.PROPERTY);
  if (intents.has("VEHICLE")) domains.add(DOMAINS.VEHICLE);
  if (intents.has("FINANCE")) domains.add(DOMAINS.FINANCE);
  if (intents.has("EDUCATION")) domains.add(DOMAINS.EDUCATION);
  if (intents.has("CHILDREN")) domains.add(DOMAINS.CHILDREN);
  if (intents.has("FOREIGN_TRAVEL")) domains.add(DOMAINS.FOREIGN_TRAVEL);
  if (intents.has("FAMILY")) domains.add(DOMAINS.FAMILY);
  if (intents.has("LEADERSHIP")) domains.add(DOMAINS.LEADERSHIP);
  if (intents.has("WELLNESS")) domains.add(DOMAINS.WELLNESS);
  if (intents.has("LEGAL")) domains.add(DOMAINS.LEGAL);
  if (intents.has("SPIRITUAL")) domains.add(DOMAINS.SPIRITUAL);
  if (intents.has("CAUTION")) domains.add(DOMAINS.CAUTION);
  if (intents.has("MAJOR_MILESTONE") || /milestone|next\s*\d+\s*years|அடுத்த\s*\d+\s*(?:வருட|ஆண்டு)|முக்கியமான\s*மாற்றங்கள்/i.test(text)) {
    domains.add(DOMAINS.MILESTONES);
  }
  if (intents.has("CURRENT_DASHA") || intents.has("DASHA_EFFECT")) domains.add(DOMAINS.DASHA);
  if (intents.has("VARGA_INTERPRETATION")) domains.add(DOMAINS.VARGA);

  // 2. Keyword detection
  if (/திருமண|கல்யாணம்|களத்திர|spouse|marriage|wife|husband|wedding/i.test(text)) {
    domains.add(DOMAINS.MARRIAGE);
  }
  if (/தொழில்|career|profession|vocation/i.test(text)) {
    domains.add(DOMAINS.CAREER);
  }
  if (/வேலை|உத்தியோகம்|job|employment/i.test(text)) {
    domains.add(DOMAINS.JOB);
  }
  if (/வியாபாரம்|சுயதொழில்|business|startup|trade/i.test(text)) {
    domains.add(DOMAINS.BUSINESS);
  }
  if (/சொத்து|நிலம்|மனை|வீடு|property|real\s*estate|house|land/i.test(text)) {
    domains.add(DOMAINS.PROPERTY);
  }
  if (/வாகனம்|கார்|vehicle|car|conveyance/i.test(text)) {
    domains.add(DOMAINS.VEHICLE);
  }
  if (/பணம்|நிதி|பொருளாதாரம்|finance|wealth|money/i.test(text)) {
    domains.add(DOMAINS.FINANCE);
  }
  if (/கல்வி|படிப்பு|தேர்வு|education|study|exam/i.test(text)) {
    domains.add(DOMAINS.EDUCATION);
  }
  if (/குழந்தை|புத்திர|பிள்ளை|child|children|progeny/i.test(text)) {
    domains.add(DOMAINS.CHILDREN);
  }
  if (/வெளிநாடு|பயணம்|foreign|travel|overseas|abroad/i.test(text)) {
    domains.add(DOMAINS.FOREIGN_TRAVEL);
  }
  if (/ஆரோக்கியம்|உடல்நலம்|நோய்|health|wellness|vitality/i.test(text)) {
    domains.add(DOMAINS.WELLNESS);
  }
  if (/சட்டம்|வழக்கு|நீதிமன்றம்|legal|court|litigation/i.test(text)) {
    domains.add(DOMAINS.LEGAL);
  }
  if (/ஆன்மீகம்|spiritual|meditation|moksha/i.test(text)) {
    domains.add(DOMAINS.SPIRITUAL);
  }
  if (/எச்சரிக்கை|ஆபத்து|இடர்|caution|risk|danger/i.test(text)) {
    domains.add(DOMAINS.CAUTION);
  }
  if (/மைல்கல்|திருப்புமுனை|milestone|next\s*\d+\s*years|அடுத்த\s*\d+\s*ஆண்டுகள்/i.test(text)) {
    domains.add(DOMAINS.MILESTONES);
  }

  // 3. Follow-up inheritence from previous turn if question is elliptical (e.g. "2027?", "why?")
  if (domains.size === 0 && history && history.length > 0) {
    const lastTurn = history[history.length - 1];
    if (lastTurn && lastTurn.domain) {
      domains.add(lastTurn.domain);
    }
  }

  if (domains.size === 0) {
    domains.add(DOMAINS.GENERAL);
  }

  const domainsArr = Array.from(domains);
  const primaryDomain = domainsArr[0] || DOMAINS.GENERAL;

  return {
    primaryDomain,
    domains: domainsArr
  };
}
