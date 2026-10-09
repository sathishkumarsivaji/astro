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

  // 2. Comprehensive Keyword & Semantic Detection across all 20 Domains
  const target = `${text} ${norm}`;
  if (/திருமண|கல்யாணம்|களத்திர|துணை|மனைவி|கணவர்|spouse|marriage|wife|husband|wedding|partner|marital/i.test(target)) {
    domains.add(DOMAINS.MARRIAGE);
  }
  if (/தொழில்|பணித்துறை|முன்னேற்றம்|நிர்வாகப்\s*பதவி|career|profession|vocation|professional|management\s*roles/i.test(target)) {
    domains.add(DOMAINS.CAREER);
  }
  if (/வேலை|உத்தியோகம்|பணி|பதவி\s*உயர்வு|ஊதிய|job|employment|workplace|salary|promotion/i.test(target)) {
    domains.add(DOMAINS.JOB);
  }
  if (/வியாபாரம்|சுயதொழில்|வணிக|கூட்டு|தொழில்\s*தொடங்க|லாபம்|business|startup|trade|entrepreneur|commerce|venture|partnership/i.test(target)) {
    domains.add(DOMAINS.BUSINESS);
  }
  if (/சொத்து|நிலம்|மனை|வீடு|அசையா|பூர்வீக|property|real\s*estate|house|land|home|renovation/i.test(target)) {
    domains.add(DOMAINS.PROPERTY);
  }
  if (/வாகன|கார்|வண்டி|ஊர்தி|vehicle|car|conveyance|automobile|transportation|driving/i.test(target)) {
    domains.add(DOMAINS.VEHICLE);
  }
  if (/பணம்|நிதி|பொருளாதார|செல்வ|சேமிப்பு|தன|finance|wealth|money|income|prosperity|dhana|invest|accumulation|2nd\s*and\s*11th/i.test(target)) {
    domains.add(DOMAINS.FINANCE);
  }
  if (/கல்வி|படி|தேர்வு|ஆராய்ச்சி|பல்கலைக்கழக|education|study|exam|academic|degree|intellectual|competitive|higher\s*study/i.test(target)) {
    domains.add(DOMAINS.EDUCATION);
  }
  if (/குழந்தை|புத்திர|பிள்ளை|மழலை|child|children|progeny|offspring/i.test(target)) {
    domains.add(DOMAINS.CHILDREN);
  }
  if (/குடும்ப|பெற்றோர்|உறவினர்|உடன்பிறந்த|ஒற்றுமை|அமைதி|family|domestic|parents|relatives|harmony/i.test(target)) {
    domains.add(DOMAINS.FAMILY);
  }
  if (/தலைமை|அதிகாரம்|ஆளுமை|நிர்வாக|அரசியல்|leadership|authority|executive|command|administrative|governance/i.test(target)) {
    domains.add(DOMAINS.LEADERSHIP);
  }
  if (/ஆரோக்கிய|உடல்\s*நல|நோய்|தேக|சுறுசுறுப்பு|வாத|பித்த|கப|ஆயுர்வேத|vitality|health|wellness|constitution|ayurvedic|dosha|recuperation|rest/i.test(target)) {
    domains.add(DOMAINS.WELLNESS);
  }
  if (/சட்டம்|வழக்கு|நீதிமன்ற|பிணக்கு|ஒப்பந்த|நிவாரணம்|legal|court|litigation|dispute|arbitration|contractual/i.test(target)) {
    domains.add(DOMAINS.LEGAL);
  }
  if (/ஆன்மீக|இஷ்ட\s*தெய்வ|ஞான|மோட்ச|தியான|யாத்திரை|spiritual|pilgrimage|deity|sadhana|moksha|philosophical/i.test(target)) {
    domains.add(DOMAINS.SPIRITUAL);
  }
  if (/எச்சரிக்கை|ஆபத்து|இடர்|சனி|சாதகமற்ற|ஏழரை|அஷ்டம|சவாலான|விவேகமாக|தவிர்க்க|பிரச்சினை|பாதுகாப்பு\s*கிரக|caution|risk|danger|obstacle|adverse|sade\s*sati|difficult|prudently/i.test(target)) {
    domains.add(DOMAINS.CAUTION);
  }
  if (/மைல்கல்|திருப்பு|திருப்ப|முக்கிய\s*கால|வயது\s*கால|அடுத்த\s*\d+\s*(?:வருட|ஆண்டு|முதல்)|ஆசைகள்|கர்ம\s*திருப்புமுனை|milestone|turning\s*point|life\s*stages|next\s*\d+\s*years|aspirations|long-term/i.test(target)) {
    domains.add(DOMAINS.MILESTONES);
  }
  if (/தசா|புக்தி|புத்தி|அந்தர|dasha|bhukti|antardasha|mahadasha|sub-period/i.test(target)) {
    domains.add(DOMAINS.DASHA);
  }
  if (/வர்க்க|நவாம்ச|தசாம்ச|சப்தாம்ச|ஷோடசவர்க்க|varga|navamsha|dashamsha|saptamsha|d9|d10|d7|divisional/i.test(target)) {
    domains.add(DOMAINS.VARGA);
  }
  if (/வெளிநாட்|வெளிநாடு|பயண|விதேசம்|சர்வதேச|foreign|travel|overseas|abroad|international|journey/i.test(target)) {
    domains.add(DOMAINS.FOREIGN_TRAVEL);
  }
  if (/ஜாதக|கிரக\s*நிலை|சுருக்கம்|லக்னாதிபதி|பொது|கர்ம\s*பாடம்|ராஜ\s*யோகம்|horoscope|birth\s*chart|natal\s*chart|overall|planetary\s*strength|lessons|trajectory/i.test(target)) {
    domains.add(DOMAINS.GENERAL);
  }

  // 3. Follow-up inheritance from previous turn if question is elliptical (e.g. "2027?", "why?")
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
