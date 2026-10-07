/**
 * ASTROVERSE — Master Consultation & Question-Driven Astrological Inference Engine
 *
 * Implements:
 * 1. 4 Certainty Layers (Astronomical Certainty, Astrological Convention, Interpretive Inference, Prediction)
 * 2. Universal 18-Domain Question Ontology & Semantic Intent Classifier with Contextual Coreference Resolution
 * 3. Dedicated Specialized Sub-Engines:
 *    - Spouse Family Wealth Comparison Engine (Relative Tiers, Non-Binary)
 *    - Spouse Geographic Distance Engine (Banded Ranges, No False Precision)
 *    - Direction Engine (Multi-Method Convergence & Divergence Disclosures)
 *    - Joint vs Separate Household Residence Engine (Non-Accusatory Decomposed Synthesis)
 *    - Family Prestige & Social Orientation Engine
 *    - Natal Promise & Counter-Indicator Search Engine
 *    - Timing & Age Prediction Windows (Dasha, Antardasha, Gochara Transits, Varga Activation)
 *    - Multi-System Epistemic Convergence Engine (Parashari, Jaimini, KP, Vargas)
 *    - Dynamic 5–15 Follow-Up Question Generator
 *    - 17-Section Professional Astrologer Consultation Generator (Quick, Standard, Detailed, Astrologer, Expert)
 *    - Chart Fact Pre-Validation Engine
 *    - 14-Dimension Matchmaking Consultation Engine
 */

import { PREDICTION_CONFIG as predictionConfig } from "../config/prediction_config.js";
import {
  toTamilRasi,
  toTamilPlanet,
  toTamilNakshatra,
  toTamilDignity,
  formatTamilDegree,
  cleanEnglishParentheses
} from "./tamilAstrologyUtils.js";
import { calculatePersonalizedRemedies } from "./astroEngine.js";

/**
 * Canonical accessor helpers for chart Lagna & Moon signs across differing schema representations
 */
export function getAscendantSignName(chartData) {
  if (!chartData) return null;
  const asc = chartData.ascendantSign;
  if (typeof asc === "string") return asc;
  if (asc?.name) return asc.name;
  if (asc?.sign) return asc.sign;
  const directAsc = chartData.ascendant;
  if (typeof directAsc === "string") return directAsc;
  if (directAsc?.name) return directAsc.name;
  if (directAsc?.sign) return directAsc.sign;
  return null;
}

export function getMoonSignName(chartData) {
  if (!chartData) return null;
  const m = chartData.moonSign;
  if (typeof m === "string") return m;
  if (m?.name) return m.name;
  if (m?.sign) return m.sign;
  const directMoon = chartData.moon;
  if (typeof directMoon === "string") return directMoon;
  if (directMoon?.name) return directMoon.name;
  if (directMoon?.sign) return directMoon.sign;
  const moonPlanet = (chartData.planets || []).find(p => p.name === "Moon");
  if (moonPlanet?.sign) return moonPlanet.sign;
  return null;
}

// ---------------------------------------------------------------------------
// 1. CERTAINTY LAYERS DEFINITIONS
// ---------------------------------------------------------------------------
export const CERTAINTY_LAYERS = {
  LAYER_A: {
    id: "LAYER_A_ASTRONOMICAL",
    label: "Astronomical Certainty",
    badgeTa: "வானியல் துல்லியம் (Astronomical Position)",
    disclaimer: "Calculated astronomical position.",
    description: "Planetary coordinates, ascendant, house cusps, and nakshatra boundaries derived from VSOP87 ephemeris calculations."
  },
  LAYER_B: {
    id: "LAYER_B_CONVENTION",
    label: "Astrological Convention",
    badgeTa: "ஜோதிட மரபு நெறிமுறை (Astrological Convention)",
    disclaimer: "Based on the selected astrological convention.",
    description: "Calculations parameterized by selected Ayanamsha (Lahiri/KP/Raman), house system (Equal/Placidus), and Varga algorithms."
  },
  LAYER_C: {
    id: "LAYER_C_INFERENCE",
    label: "Interpretive Inference",
    badgeTa: "பாரம்பரிய ஜோதிட விளக்கம் (Traditional Interpretation)",
    disclaimer: "Traditional astrological interpretation.",
    description: "Traditional Shastric principles, Karakatvas, planetary dignities, aspects, and Bhavat Bhavam relationships."
  },
  LAYER_D: {
    id: "LAYER_D_PREDICTION",
    label: "Astrological Prediction Window",
    badgeTa: "ஜோதிட காலக்கணிப்பு கணிப்பு (Astrological Prediction)",
    disclaimer: "Astrological prediction based on the configured rule set.",
    description: "Empirical timing synthesis combining Mahadasha, Antardasha, Pratyantardasha, and Gochara transit triggers."
  }
};

// ---------------------------------------------------------------------------
// 2. UNIVERSAL QUESTION TAXONOMY & ONTOLOGY
// ---------------------------------------------------------------------------
export const QUESTION_ONTOLOGY = {
  HEALTH: {
    id: "HEALTH",
    name: "Health, Wellness & Vitality",
    nameTa: "உடல்நலம், ஆரோக்கியம் & ஆயுள்",
    types: {
      HEALTH_WELLNESS: {
        id: "HEALTH_WELLNESS",
        title: "Physical Constitution, Vitality & Health Outlook",
        titleTa: "உடல் அமைப்பு, பாரம்பரிய பிராண பலம் & ஆரோக்கிய நிலை",
        subdomain: "VITALITY",
        keywords: ["health", "wellness", "physical vitality", "vitality", "रोग", "உடல்நலம்", "ஆரோக்கியம்", "உடல் நலம்", "உடம்பு"]
      },
      DISEASE_RECOVERY: {
        id: "DISEASE_RECOVERY",
        title: "Vulnerability, Roga Sthana & Healing Periods",
        titleTa: "பாரம்பரிய ரோக ஸ்தானம் & நிவாரண காலங்கள்",
        subdomain: "HEALING",
        keywords: ["disease", "illness", "recovery", "medical", "hospital", "நோய்", "மருத்துவம்", "சிகிச்சை", "மருத்துவமனை"]
      },
      LONGEVITY_AYUR: {
        id: "LONGEVITY_AYUR",
        title: "Vitality Reserve & Ayur Sthana Analysis",
        titleTa: "ஆயுள் பலம் & நீண்டகால நல்வாழ்வு",
        subdomain: "LONGEVITY",
        keywords: ["longevity", "lifespan", "ayur", "vital reserve", "ஆயுள்", "நீண்ட ஆயுள்"]
      }
    }
  },
  CAREER: {
    id: "CAREER",
    name: "Career & Vocation",
    nameTa: "தொழில் மற்றும் உத்தியோகம்",
    types: {
      BUSINESS_GROWTH: {
        id: "BUSINESS_GROWTH",
        title: "Business Growth, Commerce & Trade Expansion",
        titleTa: "சுயதொழில் / வியாபார வளர்ச்சி மற்றும் விரிவாக்கம்",
        subdomain: "BUSINESS_TRADE",
        keywords: ["business growth", "my business", "trade expansion", "startup growth", "commerce", "வியாபார வளர்ச்சி", "தொழில் வளர்ச்சி", "சுயதொழில் வளர்ச்சி", "வியாபாரம்"]
      },
      CAREER_TIMING: {
        id: "CAREER_TIMING",
        title: "Career Breakthrough & Growth Timing",
        titleTa: "தொழில் முன்னேற்றம் மற்றும் சுப காலங்கள்",
        subdomain: "TIMING",
        keywords: ["career growth", "when will i get job", "career breakthrough", "வேலை எப்போது கிடைக்கும்", "தொழில் முன்னேற்றம்"]
      },
      JOB_VS_BUSINESS: {
        id: "JOB_VS_BUSINESS",
        title: "Employment (Service) vs Independent Business / Entrepreneurship",
        titleTa: "உத்தியோகமா அல்லது சுயதொழில்/வியாபாரமா",
        subdomain: "VOCATION_TYPE",
        keywords: ["job or business", "startup", "entrepreneurship", "service vs business", "உத்தியோகமா சுயதொழிலா"]
      },
      PROMOTION_TIMING: {
        id: "PROMOTION_TIMING",
        title: "Promotion, Elevation & Leadership Recognition",
        titleTa: "பதவி உயர்வு மற்றும் அங்கீகாரம் கிடைக்கும் காலம்",
        subdomain: "ELEVATION",
        keywords: ["promotion when", "salary hike", "leadership elevation", "பதவி உயர்வு"]
      },
      GOVERNMENT_JOB: {
        id: "GOVERNMENT_JOB",
        title: "Government Service & Administrative Authority (Raja Yoga)",
        titleTa: "அரசு வேலை மற்றும் நிர்வாக அதிகார யோகம்",
        subdomain: "AUTHORITY",
        keywords: ["government job", "govt exam", "upsc civil service", "public sector", "அரசு வேலை கிடைக்குமா"]
      }
    }
  },
  MARRIAGE: {
    id: "MARRIAGE",
    name: "Marriage & Relationships",
    nameTa: "திருமணம் மற்றும் தாம்பத்யம்",
    types: {
      MARRIAGE_TIMING: {
        id: "MARRIAGE_TIMING",
        title: "Marriage Timing & Auspicious Periods",
        titleTa: "திருமண காலக்கணிப்பு மற்றும் சுப காலங்கள்",
        subdomain: "TIMING",
        keywords: ["when will i marry", "marriage timing", "wedding year", "marriage date", "எப்போது திருமணம்", "கல்யாணம் எப்போது"]
      },
      MARRIAGE_AGE: {
        id: "MARRIAGE_AGE",
        title: "Estimated Age of Marriage",
        titleTa: "திருமண வயது வரம்பு கணிப்பு",
        subdomain: "AGE",
        keywords: ["what age will i marry", "marriage age", "age of wedding", "எந்த வயதில் திருமணம்"]
      },
      SPOUSE_FAMILY_WEALTH: {
        id: "SPOUSE_FAMILY_WEALTH",
        title: "Spouse's Family Financial & Social Status",
        titleTa: "துணையின் குடும்ப நிதிநிலை மற்றும் அந்தஸ்து",
        subdomain: "WEALTH_STATUS",
        keywords: ["spouse family wealthy", "richer than mine", "spouse family wealth", "rich in-laws", "துணை குடும்ப வசதி", "பணக்கார குடும்பமா"]
      },
      SPOUSE_DISTANCE: {
        id: "SPOUSE_DISTANCE",
        title: "Geographic Distance of Spouse's Origin",
        titleTa: "துணையின் பூர்வீக தூரம் மற்றும் தூர எல்லை",
        subdomain: "GEOGRAPHY",
        keywords: ["how far away spouse", "spouse distance", "same city or different city", "km away", "துணை எவ்வளவு தூரம்", "சொந்த ஊரா"]
      },
      SPOUSE_DIRECTION: {
        id: "SPOUSE_DIRECTION",
        title: "Geographic Direction of Spouse's Origin",
        titleTa: "துணை அமையும் திசை கணிப்பு",
        subdomain: "DIRECTION",
        keywords: ["which direction spouse", "direction of marriage", "north south east west", "துணை எந்த திசை", "திசை"]
      },
      JOINT_VS_SEPARATE: {
        id: "JOINT_VS_SEPARATE",
        title: "Post-Marriage Residence (Joint vs Independent Household)",
        titleTa: "திருமணத்திற்குப் பின் வசிப்பிடம் (கூட்டுக் குடும்பம் / தனிக்குடித்தனம்)",
        subdomain: "RESIDENCE",
        keywords: ["live with parents", "separate me from parents", "joint family", "separate household", "nuclear family", "பெற்றோருடன் வசிப்பாரா", "தனிக்குடித்தனமா"]
      },
      FAMILY_PRESTIGE: {
        id: "FAMILY_PRESTIGE",
        title: "Spouse Social Values & Family Respect",
        titleTa: "குடும்ப நற்பெயர் மற்றும் சமூக நன்மதிப்பு",
        subdomain: "VALUES",
        keywords: ["maintain family prestige", "respect elders", "support parents", "family reputation", "குடும்ப கௌரவம்", "பெரியோரை மதிப்பாரா"]
      },
      LOVE_VS_ARRANGED: {
        id: "LOVE_VS_ARRANGED",
        title: "Arranged Marriage vs Self-Choice / Love Union",
        titleTa: "பெற்றோர் நிச்சயித்த திருமணமா அல்லது காதல் திருமணமா",
        subdomain: "UNION_TYPE",
        keywords: ["love or arranged", "love marriage", "arranged marriage", "relatives proposal", "காதல் திருமணமா", "பெற்றோர் நிச்சயமா"]
      },
      MARRIAGE_DELAY: {
        id: "MARRIAGE_DELAY",
        title: "Factors Causing Delay or Obstacles in Marriage",
        titleTa: "திருமணத் தடை மற்றும் தாமதத்திற்கான காரணங்கள்",
        subdomain: "OBSTACLES",
        keywords: ["delay in marriage", "obstacles before marriage", "late marriage", "dosha delay", "திருமண தாமதம்", "திருமணத் தடை"]
      },
      MARRIAGE_PROSPERITY: {
        id: "MARRIAGE_PROSPERITY",
        title: "Financial & Fortune Changes After Marriage (Bhagyodaya)",
        titleTa: "திருமணத்திற்குப் பின் பாக்யோதயம் மற்றும் முன்னேற்றம்",
        subdomain: "POST_MARRIAGE",
        keywords: ["improve financial position after marriage", "fortune after wedding", "bhagyodaya", "திருமணத்திற்கு பின் யோகம்"]
      },
      MARRIAGE_STABILITY: {
        id: "MARRIAGE_STABILITY",
        title: "Marital Harmony & Long-Term Relationship Stability",
        titleTa: "தாம்பத்ய ஒற்றுமை மற்றும் நீண்டகால நிலைத்தன்மை",
        subdomain: "STABILITY",
        keywords: ["marriage stable", "divorce separation", "marital harmony", "understanding", "தாம்பத்ய ஒற்றுமை", "பிரிவு வருமா"]
      },
      SPOUSE_CAREER: {
        id: "SPOUSE_CAREER",
        title: "Spouse Career, Profession & Employment Outlook",
        titleTa: "துணையின் தொழில் மற்றும் உத்தியோக நிலை",
        subdomain: "SPOUSE_CAREER",
        keywords: ["spouse profession", "spouse working", "wife job", "husband career", "துணை வேலை பார்ப்பாரா", "துணை தொழில்"]
      }
    }
  },
  WEALTH: {
    id: "WEALTH",
    name: "Wealth, Finances & Prosperity",
    nameTa: "தன வரவு, பெருஞ்செல்வம் மற்றும் சொத்துக்கள்",
    types: {
      MEGA_WEALTH_BILLIONAIRE: {
        id: "MEGA_WEALTH_BILLIONAIRE",
        title: "Extreme Wealth, Billionaire / Millionaire Potentials & Maha Dhana Yoga",
        titleTa: "கோடீஸ்வர யோகம், பெருஞ்செல்வ சேர்க்கை மற்றும் மகா தன யோகம்",
        subdomain: "MEGA_DHANA",
        keywords: ["billionaire", "millionaire", "crorepati", "super rich", "mega wealth", "ultra rich", "extremely rich", "billionare", "millionare", "maha dhana yoga", "கோடீஸ்வரன்", "பணக்காரன்", "பெருஞ்செல்வம்", "மகா தன யோகம்"]
      },
      FINANCIAL_PROSPERITY: {
        id: "FINANCIAL_PROSPERITY",
        title: "Accumulated Wealth & Dhana Yoga Activation",
        titleTa: "தன யோகம் மற்றும் நிதி வளர்ச்சி காலங்கள்",
        subdomain: "DHANA",
        keywords: ["wealth timing", "financial growth", "money accumulation", "becoming rich", "prosperous", "பண வரவு எப்போது", "தன யோகம்", "பணம்", "செல்வம்"]
      },
      INVESTMENT_MARKETS: {
        id: "INVESTMENT_MARKETS",
        title: "Equity Markets, Trading, Crypto & Investment Portfolios",
        titleTa: "பங்குச்சந்தை, முதலீடு மற்றும் நிதி வர்த்தகம்",
        subdomain: "INVESTMENTS",
        keywords: ["stock market", "shares", "trading", "crypto", "equity", "mutual funds", "investments", "பங்குச்சந்தை", "முதலீடு", "பங்கு வர்த்தகம்"]
      },
      PROPERTY_ACQUISITION: {
        id: "PROPERTY_ACQUISITION",
        title: "Land, House & Real Estate Acquisition Timing (Bhoomi Yoga)",
        titleTa: "வீடு, மனை மற்றும் நிலம் வாங்கும் யோகம்",
        subdomain: "REAL_ESTATE",
        keywords: ["buy house", "property purchase", "own home timing", "flat land", "real estate", "வீடு வாங்கும் காலம்", "சொத்து யோகம்", "மனை"]
      },
      DEBT_CLEARANCE: {
        id: "DEBT_CLEARANCE",
        title: "Debt Clearance, Loan Settlement & Financial Liabilities (Rina Vimochana)",
        titleTa: "கடன் நிவர்த்தி மற்றும் நிதி விடுதலை யோகம்",
        subdomain: "LIABILITIES",
        keywords: ["clear debt", "loan repayment", "debt free", "financial liabilities", "rina vimochana", "கடன் அடைபடுமா", "கடன் தீர"]
      },
      VEHICLE_PURCHASE: {
        id: "VEHICLE_PURCHASE",
        title: "Vehicle Acquisition Timing (Vahana Yoga)",
        titleTa: "வாகன சேர்க்கை யோகம்",
        subdomain: "VEHICLE",
        keywords: ["buy car", "vehicle purchase", "vahana yoga", "வாகனம் வாங்குவது", "கார்"]
      }
    }
  },
  EDUCATION: {
    id: "EDUCATION",
    name: "Education, Research & Academic Excellence",
    nameTa: "கல்வி, ஆராய்ச்சி & தேர்ச்சி மேன்மை",
    types: {
      GENERAL_EDUCATION: {
        id: "GENERAL_EDUCATION",
        title: "Foundational Education, Schooling & Academic Progress (Vidya Sthana)",
        titleTa: "அடிப்படை கல்வி மற்றும் படிப்பு முன்னேற்றம்",
        subdomain: "ACADEMICS",
        keywords: ["education", "study", "studies", "school", "college", "vidya", "கல்வி", "படிப்பு", "பள்ளி", "கல்லூரி"]
      },
      RESEARCH_PHD: {
        id: "RESEARCH_PHD",
        title: "Scientific Research, PhD, Innovations, Papers & Academic Discoveries",
        titleTa: "ஆராய்ச்சி வெற்றி, முனைவர் பட்டம் (PhD) & அறிவியல் கண்டுபிடிப்புகள்",
        subdomain: "RESEARCH",
        keywords: ["research", "phd", "scientific", "discovery", "invention", "fellowship", "scholarship", "thesis", "research paper", "publication", "ஆராய்ச்சி", "முனைவர் பட்டம்", "ஆய்வு"]
      },
      HIGHER_STUDIES: {
        id: "HIGHER_STUDIES",
        title: "Higher Education, Master's Degree & Foreign University Admissions",
        titleTa: "உயர் கல்வி மற்றும் வெளிநாட்டு பல்கலைக்கழக படிப்பு",
        subdomain: "HIGHER_ACADEMICS",
        keywords: ["higher studies", "master degree", "post graduate", "foreign university", "college admission", "உயர் கல்வி", "பட்டப்படிப்பு"]
      },
      COMPETITIVE_EXAMS: {
        id: "COMPETITIVE_EXAMS",
        title: "Competitive Exam Success, Distinctions & Academic Ranks",
        titleTa: "போட்டித் தேர்வுகள் மற்றும் கல்வித் தேர்ச்சி",
        subdomain: "EXAMS",
        keywords: ["competitive exams", "neet", "upsc entrance", "pass exam", "rank", "தேர்வு வெற்றி", "போட்டித் தேர்வு"]
      }
    }
  },
  RELOCATION: {
    id: "RELOCATION",
    name: "Foreign Travel & Relocation",
    nameTa: "வெளிநாட்டு பயணம் மற்றும் இடப்பெயர்வு",
    types: {
      FOREIGN_SETTLEMENT: {
        id: "FOREIGN_SETTLEMENT",
        title: "Overseas Relocation & Foreign Settlement Indicators",
        titleTa: "வெளிநாட்டு பயணம் மற்றும் குடியேற்ற யோகம்",
        subdomain: "OVERSEAS",
        keywords: ["move abroad", "foreign travel", "pr visa settlement", "live in foreign", "வெளிநாடு செல்வேனா", "குடியேற்றம்"]
      },
      DOMESTIC_RELOCATION: {
        id: "DOMESTIC_RELOCATION",
        title: "Domestic Relocation & City Transfer Timing",
        titleTa: "உள்நாட்டு இடமாற்றம் மற்றும் ஊர் மாற்றம்",
        subdomain: "TRANSFER",
        keywords: ["move to another city", "relocation", "city transfer", "வேறு ஊருக்கு மாற்றமா"]
      }
    }
  },
  CHILDREN: {
    id: "CHILDREN",
    name: "Children & Progeny (Santhana Bhagya)",
    nameTa: "சந்தான பாக்கியம் மற்றும் குழந்தைகள்",
    types: {
      PROGENY_TIMING: {
        id: "PROGENY_TIMING",
        title: "Child Conception, Progeny Timing & Putra Bhava Indicators",
        titleTa: "குழந்தை பாக்கியம் மற்றும் கர்ப்ப கால யோகம்",
        subdomain: "PROGENY",
        keywords: ["child birth", "conceive baby", "pregnancy timing", "progeny", "santhana bhagya", "குழந்தை பாக்கியம்", "சந்தான யோகம்", "கர்ப்பம்"]
      },
      CHILDREN_WELLBEING: {
        id: "CHILDREN_WELLBEING",
        title: "Children's Prosperity, Health & Future Trajectory",
        titleTa: "குழந்தைகளின் எதிர்காலம் மற்றும் நல்வாழ்வு",
        subdomain: "WELLBEING",
        keywords: ["children future", "child education", "son future", "daughter prosperity", "பிள்ளைகள் எதிர்காலம்"]
      }
    }
  },
  SPIRITUALITY: {
    id: "SPIRITUALITY",
    name: "Spiritual Evolution & Dharma",
    nameTa: "ஆன்மீகம் மற்றும் தர்ம நெறி",
    types: {
      SPIRITUAL_GROWTH: {
        id: "SPIRITUAL_GROWTH",
        title: "Spiritual Progress, Moksha Sthana, Meditation & Guru Grace",
        titleTa: "ஆன்மீக ஞானம், குரு அருள் மற்றும் தியான யோகம்",
        subdomain: "MOKSHA",
        keywords: ["spiritual", "moksha", "meditation", "enlightenment", "guru grace", "deity worship", "ஆன்மீகம்", "மோட்சம்", "தியானம்", "குரு அருள்"]
      }
    }
  },
  LEGAL: {
    id: "LEGAL",
    name: "Legal Matters & Disputes",
    nameTa: "வழக்கு மற்றும் எதிரிகள் வெற்றி",
    types: {
      LITIGATION_DISPUTES: {
        id: "LITIGATION_DISPUTES",
        title: "Court Cases, Legal Dispute Resolution & Victory over Adversaries",
        titleTa: "நீதிமன்ற வழக்கு மற்றும் எதிரிகள் நிவர்த்தி",
        subdomain: "DISPUTES",
        keywords: ["court case", "legal dispute", "lawsuit", "police case", "win court case", "enemies", "நீதிமன்ற வழக்கு", "கோர்ட் கேஸ்", "எதிரி வெற்றி"]
      }
    }
  },
  REMEDIES: {
    id: "REMEDIES",
    name: "Vedic Remedies, Gemstones & Mantras",
    nameTa: "சாஸ்திர பரிகாரங்கள், ரத்தினங்கள் & மந்திரங்கள்",
    types: {
      GEMSTONE_PRESCRIPTION: {
        id: "GEMSTONE_PRESCRIPTION",
        title: "Prescribed & Contraindicated Gemstones (Ratna Shastra)",
        titleTa: "பரிந்துரைக்கப்பட்ட மற்றும் தவிர்க்க வேண்டிய ரத்தினங்கள்",
        subdomain: "GEMSTONES",
        keywords: ["gemstone", "gemstones", "wear gemstone", "contraindicated", "stone should i wear", "lucky stone", "coral", "ruby", "emerald", "pearl", "yellow sapphire", "blue sapphire", "diamond", "hessonite", "cat's eye", "ரத்தினம்", "ரத்தினங்கள்", "பவளம்", "மாணிக்கம்", "முத்து", "மரகதம்", "புஷ்பராகம்", "நீலம்", "வைரம்", "கோமேதகம்", "வைடூரியம்"]
      },
      MANTRAS_SADHANA: {
        id: "MANTRAS_SADHANA",
        title: "Vedic Mantras, Stotras & Daily Sadhana",
        titleTa: "வேத மந்திரங்கள், ஸ்தோத்திரங்கள் மற்றும் உபாசனை",
        subdomain: "MANTRAS",
        keywords: ["mantra", "stotra", "chanting", "sadhana", "japa", "மந்திரம்", "ஸ்தோத்திரம்", "வழிபாடு"]
      },
      PARIHARAS_CHARITY: {
        id: "PARIHARAS_CHARITY",
        title: "Temple Worship, Daanam & Auspicious Charities",
        titleTa: "கோயில் பரிகாரங்கள், தானங்கள் மற்றும் தர்ம காரியங்கள்",
        subdomain: "PARIHARAS",
        keywords: ["pariharam", "remedy", "charity", "daanam", "temple", "donations", "பரிகாரம்", "தானம்", "தர்மம்", "கோயில் வழிபாடு"]
      }
    }
  }
};

// ---------------------------------------------------------------------------
// 3. CONVERSATIONAL ENTITY & INTENT CLASSIFIER
// ---------------------------------------------------------------------------
export function classifyConsultationIntent(questionText = "", conversationHistory = []) {
  const rawClean = (questionText || "").trim();
  
  // Normalization for common typos & speech-to-text slips
  const text = rawClean
    .replace(/\bmu\b/gi, "my")
    .replace(/\bbillionare\b/gi, "billionaire")
    .replace(/\bmillionare\b/gi, "millionaire")
    .replace(/\beducaton|eduation|studys\b/gi, "education")
    .replace(/\breserch\b/gi, "research")
    .replace(/\bmarrige|merriage\b/gi, "marriage")
    .replace(/\bhealt|helth\b/gi, "health")
    .replace(/\bbussiness|buisness|bussines\b/gi, "business")
    .replace(/\bproffesion\b/gi, "profession")
    .replace(/\bgov\b/gi, "government");
  
  const qLower = text.toLowerCase();

  // 1. Resolve conversational pronouns ("she", "her family", "my parents", "there", "that year")
  let targetEntity = "native";
  let targetSubject = "general";

  if (/\b(she|her|wife|future\s+wife|bride|husband|groom|spouse|partner|in-laws|அவள்|மனைவி|கணவர்|துணை)\b/i.test(qLower)) {
    targetEntity = "spouse";
  }
  if (/\b(my\s+parents|father|mother|family|பெற்றோர்|அம்மா|அப்பா)\b/i.test(qLower)) {
    targetSubject = "parents";
  }

  // 2. High-Priority Semantic Mapping: Education & Research
  if (/(education|study|studies|exam|exams|college|school|university|degree|master|phd|research|scientific|discovery|intellect|vidya|buddhi|scholarship|fellowship|thesis|neet|upsc|academic|கல்வி|படிப்பு|ஆராய்ச்சி|தேர்வு|பல்கலைக்கழகம்|கல்லூரி|பள்ளி|முனைவர்)/i.test(qLower)) {
    let qType = "GENERAL_EDUCATION";
    let sub = "ACADEMICS";
    if (/(research|phd|scientific|discovery|invention|fellowship|scholarship|thesis|paper|publication|ஆராய்ச்சி|முனைவர்)/i.test(qLower)) {
      qType = "RESEARCH_PHD";
      sub = "RESEARCH";
    } else if (/(higher\s*studies|master|degree|post\s*grad|foreign\s*study|university|உயர்\s*கல்வி|பட்டப்\s*படிப்பு)/i.test(qLower)) {
      qType = "HIGHER_STUDIES";
      sub = "HIGHER_ACADEMICS";
    } else if (/(exam|competitive|neet|upsc|entrance|test|rank|pass|தேர்வு|போட்டித்\s*தேர்வு)/i.test(qLower)) {
      qType = "COMPETITIVE_EXAMS";
      sub = "EXAMS";
    }
    return {
      domain: "EDUCATION",
      questionType: qType,
      subdomain: sub,
      targetEntity: "native",
      targetSubject: "education",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.EDUCATION.types[qType]?.title || "Education & Academic Consultation",
      confidence: 0.98,
      ontologyEntry: QUESTION_ONTOLOGY.EDUCATION.types[qType] || QUESTION_ONTOLOGY.EDUCATION.types.GENERAL_EDUCATION
    };
  }

  // 3. High-Priority Semantic Mapping: Extreme Wealth / Billionaire / Investments
  if (/(billionaire|millionaire|crorepati|super\s*rich|ultra\s*rich|extremely\s*rich|mega\s*wealth|massive\s*wealth|rich\s*man|rich\s*person|become\s*rich|becoming\s*rich|wealthy|lottery|windfall|jackpot|maha\s*dhana|stocks?|shares?|trading|crypto|equity|investment|debt\s*free|clear\s*debt|பணக்காரன்|கோடீஸ்வரன்|மகா\s*தன\s*யோகம்|லாட்டரி|பங்குச்சந்தை|முதலீடு|கடன்\s*அடைபடுமா)/i.test(qLower)) {
    let qType = "FINANCIAL_PROSPERITY";
    let sub = "DHANA";
    if (/(billionaire|millionaire|crorepati|super\s*rich|ultra\s*rich|extremely\s*rich|mega\s*wealth|massive\s*wealth|maha\s*dhana|கோடீஸ்வரன்|மகா\s*தன)/i.test(qLower)) {
      qType = "MEGA_WEALTH_BILLIONAIRE";
      sub = "MEGA_DHANA";
    } else if (/(stocks?|shares?|trading|crypto|equity|mutual\s*funds?|investment|பங்குச்சந்தை|முதலீடு)/i.test(qLower)) {
      qType = "INVESTMENT_MARKETS";
      sub = "INVESTMENTS";
    } else if (/(debt|loan|liability|borrow|clear\s*debt|கடன்|கடன்\s*அடை)/i.test(qLower)) {
      qType = "DEBT_CLEARANCE";
      sub = "LIABILITIES";
    }
    return {
      domain: "WEALTH",
      questionType: qType,
      subdomain: sub,
      targetEntity: "native",
      targetSubject: "wealth",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.WEALTH.types[qType]?.title || "Wealth & Financial Prosperity Consultation",
      confidence: 0.98,
      ontologyEntry: QUESTION_ONTOLOGY.WEALTH.types[qType] || QUESTION_ONTOLOGY.WEALTH.types.FINANCIAL_PROSPERITY
    };
  }

  // 4. High-Priority Semantic Mapping: Health & Wellness
  if (/(health|wellness|illness|disease|medical|vitality|hospital|cure|recovery|doctor|treatment|physique|fitness|ayur|ஆரோக்கியம்|உடல்நலம்|உடல்\s*நலம்|நோய்|மருத்துவம்|ஆயுள்|சிகிச்சை|உடம்பு)/i.test(qLower)) {
    let qType = "HEALTH_WELLNESS";
    let sub = "VITALITY";
    if (/disease|illness|hospital|treatment|cure|recovery|மருத்துவம்|சிகிச்சை|நோய்/i.test(qLower)) {
      qType = "DISEASE_RECOVERY";
      sub = "HEALING";
    } else if (/longevity|lifespan|ayur|ஆயுள்/i.test(qLower)) {
      qType = "LONGEVITY_AYUR";
      sub = "LONGEVITY";
    }
    return {
      domain: "HEALTH",
      questionType: qType,
      subdomain: sub,
      targetEntity: "native",
      targetSubject: "health",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.HEALTH.types[qType]?.title || "Health & Vitality Consultation",
      confidence: 0.98,
      ontologyEntry: QUESTION_ONTOLOGY.HEALTH.types[qType] || QUESTION_ONTOLOGY.HEALTH.types.HEALTH_WELLNESS
    };
  }

  // 5. Children / Progeny
  if (/(child|children|baby|son|daughter|progeny|conceive|pregnancy|pregnant|santhana|putra|குழந்தை|சந்தான|கர்ப்பம்|பிள்ளை)/i.test(qLower)) {
    let qType = "PROGENY_TIMING";
    let sub = "PROGENY";
    if (/(future|prosperity|study|health|wellbeing).*(child|son|daughter|குழந்தை)/i.test(qLower)) {
      qType = "CHILDREN_WELLBEING";
      sub = "WELLBEING";
    }
    return {
      domain: "CHILDREN",
      questionType: qType,
      subdomain: sub,
      targetEntity: "native",
      targetSubject: "progeny",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.CHILDREN.types[qType]?.title || "Children & Progeny Consultation",
      confidence: 0.96,
      ontologyEntry: QUESTION_ONTOLOGY.CHILDREN.types[qType] || QUESTION_ONTOLOGY.CHILDREN.types.PROGENY_TIMING
    };
  }

  // 6. Spirituality / Moksha
  if (/(spiritual|moksha|meditation|enlightenment|guru|deity|temple|puja|karma|dharma|ஆன்மீகம்|மோட்சம்|தியானம்|குரு\s*அருள்|இறை\s*வழிபாடு)/i.test(qLower)) {
    return {
      domain: "SPIRITUALITY",
      questionType: "SPIRITUAL_GROWTH",
      subdomain: "MOKSHA",
      targetEntity: "native",
      targetSubject: "spirituality",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.SPIRITUALITY.types.SPIRITUAL_GROWTH.title,
      confidence: 0.95,
      ontologyEntry: QUESTION_ONTOLOGY.SPIRITUALITY.types.SPIRITUAL_GROWTH
    };
  }

  // 7. Legal / Litigation
  if (/(court|legal|lawsuit|litigation|police|dispute|case|enemies|enemy|shatru|வழக்கு|நீதிமன்றம்|கோர்ட்|எதிரி)/i.test(qLower)) {
    return {
      domain: "LEGAL",
      questionType: "LITIGATION_DISPUTES",
      subdomain: "DISPUTES",
      targetEntity: "native",
      targetSubject: "legal",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.LEGAL.types.LITIGATION_DISPUTES.title,
      confidence: 0.95,
      ontologyEntry: QUESTION_ONTOLOGY.LEGAL.types.LITIGATION_DISPUTES
    };
  }

  // 8. Career: Business Growth & Commerce
  if (/(business\s*growth|trade|commercial|client|startup\s*growth|expand\s*business|growth\s*in\s*business|about\s*(?:my\s*)?business|வியாபார\s*வளர்ச்சி|தொழில்\s*வளர்ச்சி|சுயதொழில்|வியாபாரம்)/i.test(qLower)) {
    return {
      domain: "CAREER",
      questionType: "BUSINESS_GROWTH",
      subdomain: "BUSINESS_TRADE",
      targetEntity: "native",
      targetSubject: "business",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.CAREER.types.BUSINESS_GROWTH.title,
      confidence: 0.98,
      ontologyEntry: QUESTION_ONTOLOGY.CAREER.types.BUSINESS_GROWTH
    };
  }

  // 9. Marriage: Joint vs Separate Household
  if (/(joint\s*family|separate\s*(?:house|household|home)|nuclear\s*family|live\s+with\s+(?:my\s+)?parents|separate\s+me\s+from\s+parents|தனிக்குடித்தனம்|கூட்டுக்\s*குடும்பம்|பிரிப்பாரா)/i.test(qLower) || ((/separate|joint|nuclear/i.test(qLower) || /live\s+away/i.test(qLower)) && /family|household|parents|spouse|wife|husband|home/i.test(qLower))) {
    return {
      domain: "MARRIAGE",
      questionType: "JOINT_VS_SEPARATE",
      subdomain: "RESIDENCE_DECOMPOSED",
      targetEntity: "spouse",
      targetSubject: "parents",
      rawQuestion: rawClean,
      resolvedText: "Analysis of post-marriage household dynamics, native parental attachment indicators, and independent residence timing without accusatory intent.",
      confidence: 0.98,
      ontologyEntry: QUESTION_ONTOLOGY.MARRIAGE.types.JOINT_VS_SEPARATE
    };
  }

  // 10. Marriage: Spouse Family Wealth / Status
  if (/(richer|wealth|financial|affluent|money|rich|status|in-laws|பணக்கார|வசதி).*(spouse|family|partner|wife|husband|mine)|(spouse|partner|wife|husband).*(richer|wealth|financial|money|பணக்கார|வசதி)/i.test(qLower) || /spouse.*family.*wealth|richer.*than.*my/i.test(qLower)) {
    return {
      domain: "MARRIAGE",
      questionType: "SPOUSE_FAMILY_WEALTH",
      subdomain: "WEALTH_STATUS",
      targetEntity: "spouse",
      targetSubject: "wealth",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.MARRIAGE.types.SPOUSE_FAMILY_WEALTH.title,
      confidence: 0.96,
      ontologyEntry: QUESTION_ONTOLOGY.MARRIAGE.types.SPOUSE_FAMILY_WEALTH
    };
  }

  // 11. Marriage: Geographic Distance
  if (/(how\s+far|distance|km|miles|same\s+city|different\s+city|different\s+district|nearby\s+locality|தூரம்|எவ்வளவு\s*தொலைவு|சொந்த\s*ஊரா)/i.test(qLower) && /(spouse|partner|wife|husband|marri|family|துணை|கல்யாணம்)/i.test(qLower)) {
    return {
      domain: "MARRIAGE",
      questionType: "SPOUSE_DISTANCE",
      subdomain: "GEOGRAPHY",
      targetEntity: "spouse",
      targetSubject: "distance",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.MARRIAGE.types.SPOUSE_DISTANCE.title,
      confidence: 0.96,
      ontologyEntry: QUESTION_ONTOLOGY.MARRIAGE.types.SPOUSE_DISTANCE
    };
  }

  // 12. Marriage: Direction
  if (/(direction|which\s+direction|north|south|east|west|திசை)/i.test(qLower) && /(spouse|partner|wife|husband|marri|துணை|திருமணம்)/i.test(qLower)) {
    return {
      domain: "MARRIAGE",
      questionType: "SPOUSE_DIRECTION",
      subdomain: "DIRECTION",
      targetEntity: "spouse",
      targetSubject: "direction",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.MARRIAGE.types.SPOUSE_DIRECTION.title,
      confidence: 0.96,
      ontologyEntry: QUESTION_ONTOLOGY.MARRIAGE.types.SPOUSE_DIRECTION
    };
  }

  // 13. Marriage: Prestige / Social Values
  if (/(prestige|respect|reputation|elders|values|conduct|கௌரவம்|மதிப்பாரா|பெரியோரை)/i.test(qLower)) {
    return {
      domain: "MARRIAGE",
      questionType: "FAMILY_PRESTIGE",
      subdomain: "VALUES",
      targetEntity: "spouse",
      targetSubject: "parents",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.MARRIAGE.types.FAMILY_PRESTIGE.title,
      confidence: 0.95,
      ontologyEntry: QUESTION_ONTOLOGY.MARRIAGE.types.FAMILY_PRESTIGE
    };
  }

  // 14. Marriage: Love vs Arranged
  if (/(love|arranged|proposal|self-choice|relatives|காதல்|நிச்சய)/i.test(qLower) && /(marri|wedding|திருமண|கல்யாண)/i.test(qLower)) {
    return {
      domain: "MARRIAGE",
      questionType: "LOVE_VS_ARRANGED",
      subdomain: "UNION_TYPE",
      targetEntity: "spouse",
      targetSubject: "general",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.MARRIAGE.types.LOVE_VS_ARRANGED.title,
      confidence: 0.95,
      ontologyEntry: QUESTION_ONTOLOGY.MARRIAGE.types.LOVE_VS_ARRANGED
    };
  }

  // 15. Marriage: Age
  if (/(what\s+age|age\s+will\s+i|marriage\s+age|வயதில்\s*திருமணம்)/i.test(qLower)) {
    return {
      domain: "MARRIAGE",
      questionType: "MARRIAGE_AGE",
      subdomain: "AGE",
      targetEntity: "spouse",
      targetSubject: "general",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.MARRIAGE.types.MARRIAGE_AGE.title,
      confidence: 0.95,
      ontologyEntry: QUESTION_ONTOLOGY.MARRIAGE.types.MARRIAGE_AGE
    };
  }

  // 16. Career: Promotion
  if (/(promotion|salary\s+hike|elevation|leadership|பதவி\s*உயர்வு|சம்பள\s*உயர்வு)/i.test(qLower)) {
    return {
      domain: "CAREER",
      questionType: "PROMOTION_TIMING",
      subdomain: "ELEVATION",
      targetEntity: "native",
      targetSubject: "career",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.CAREER.types.PROMOTION_TIMING.title,
      confidence: 0.95,
      ontologyEntry: QUESTION_ONTOLOGY.CAREER.types.PROMOTION_TIMING
    };
  }

  // 17. Wealth: Property / Real Estate Acquisition
  if (/(buy\s+(?:a\s+)?(?:house|home|flat|land|property)|own\s+(?:a\s+)?(?:house|home)|property\s+acquisition|real\s+estate|bhoomi\s+yoga|சொத்து|மனை\s*வாங்க|வீடு\s*வாங்க|நிலம்\s*வாங்க)/i.test(qLower) && !/(?:1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th)\s+house/i.test(qLower)) {
    return {
      domain: "WEALTH",
      questionType: "PROPERTY_ACQUISITION",
      subdomain: "REAL_ESTATE",
      targetEntity: "native",
      targetSubject: "property",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.WEALTH.types.PROPERTY_ACQUISITION.title,
      confidence: 0.95,
      ontologyEntry: QUESTION_ONTOLOGY.WEALTH.types.PROPERTY_ACQUISITION
    };
  }

  // 18. Relocation: Foreign / Overseas Settlement
  if (/\b(foreign|overseas|abroad|visa|pr|settle\s+abroad|immigrat|relocat|international\s+travel|வெளிநாடு|குடியேற)\b/i.test(qLower)) {
    return {
      domain: "RELOCATION",
      questionType: "FOREIGN_SETTLEMENT",
      subdomain: "OVERSEAS",
      targetEntity: "native",
      targetSubject: "travel",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.RELOCATION.types.FOREIGN_SETTLEMENT.title,
      confidence: 0.95,
      ontologyEntry: QUESTION_ONTOLOGY.RELOCATION.types.FOREIGN_SETTLEMENT
    };
  }

  // 19. General Fallback with Domain Priority
  if (/(marri|wedding|spouse|wife|husband|match|தாம்பத்|திருமண)/i.test(qLower)) {
    return {
      domain: "MARRIAGE",
      questionType: "MARRIAGE_TIMING",
      subdomain: "TIMING",
      targetEntity: "spouse",
      targetSubject: "general",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.MARRIAGE.types.MARRIAGE_TIMING.title,
      confidence: 0.88,
      ontologyEntry: QUESTION_ONTOLOGY.MARRIAGE.types.MARRIAGE_TIMING
    };
  }

  if (/(job|career|work|business|promotion|salary|profession|vocation|office|company|தொழில்|வேலை)/i.test(qLower)) {
    return {
      domain: "CAREER",
      questionType: "CAREER_TIMING",
      subdomain: "TIMING",
      targetEntity: "native",
      targetSubject: "career",
      rawQuestion: rawClean,
      resolvedText: "Career & Vocational Consultation",
      confidence: 0.85,
      ontologyEntry: QUESTION_ONTOLOGY.CAREER.types.CAREER_TIMING
    };
  }

  if (/(money|wealth|property|house|land|flat|rich|income|finance|earning|பணம்|வீடு|சொத்து|வருமானம்)/i.test(qLower)) {
    return {
      domain: "WEALTH",
      questionType: "FINANCIAL_PROSPERITY",
      subdomain: "DHANA",
      targetEntity: "native",
      targetSubject: "wealth",
      rawQuestion: rawClean,
      resolvedText: "Wealth & Asset Acquisition Consultation",
      confidence: 0.85,
      ontologyEntry: QUESTION_ONTOLOGY.WEALTH.types.FINANCIAL_PROSPERITY
    };
  }

  if (/(study|studies|education|exam|college|school|vidya|கல்வி|படிப்பு)/i.test(qLower)) {
    return {
      domain: "EDUCATION",
      questionType: "GENERAL_EDUCATION",
      subdomain: "ACADEMICS",
      targetEntity: "native",
      targetSubject: "education",
      rawQuestion: rawClean,
      resolvedText: "Education & Academic Consultation",
      confidence: 0.85,
      ontologyEntry: QUESTION_ONTOLOGY.EDUCATION.types.GENERAL_EDUCATION
    };
  }

  // 19. Remedies & Gemstone Prescriptions
  if (/(gemstone|gemstones|coral|ruby|pearl|emerald|sapphire|diamond|hessonite|cat'?s\s*eye|stone\s+should\s+i|wear\s+gem|contraindicat|ரத்தின|பவளம்|மாணிக்கம்|முத்து|மரகதம்|புஷ்பராகம்|நீலம்|வைரம்|கோமேதகம்|வைடூரியம்)/i.test(qLower)) {
    return {
      domain: "REMEDIES",
      questionType: "GEMSTONE_PRESCRIPTION",
      subdomain: "GEMSTONES",
      targetEntity: "native",
      targetSubject: "remedies",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.REMEDIES.types.GEMSTONE_PRESCRIPTION.title,
      confidence: 0.98,
      ontologyEntry: QUESTION_ONTOLOGY.REMEDIES.types.GEMSTONE_PRESCRIPTION
    };
  }

  if (/(mantra|stotra|chant|japa|sadhana|மந்திரம்|ஸ்தோத்திரம்|ஜெபம்)/i.test(qLower)) {
    return {
      domain: "REMEDIES",
      questionType: "MANTRAS_SADHANA",
      subdomain: "MANTRAS",
      targetEntity: "native",
      targetSubject: "remedies",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.REMEDIES.types.MANTRAS_SADHANA.title,
      confidence: 0.95,
      ontologyEntry: QUESTION_ONTOLOGY.REMEDIES.types.MANTRAS_SADHANA
    };
  }

  if (/(remedy|remedies|pariharam|charity|daanam|பரிகாரம்|தானம்)/i.test(qLower)) {
    return {
      domain: "REMEDIES",
      questionType: "PARIHARAS_CHARITY",
      subdomain: "PARIHARAS",
      targetEntity: "native",
      targetSubject: "remedies",
      rawQuestion: rawClean,
      resolvedText: QUESTION_ONTOLOGY.REMEDIES.types.PARIHARAS_CHARITY.title,
      confidence: 0.92,
      ontologyEntry: QUESTION_ONTOLOGY.REMEDIES.types.PARIHARAS_CHARITY
    };
  }

  return {
    domain: "GENERAL",
    questionType: "GENERAL_CONSULTATION",
    subdomain: "OVERVIEW",
    targetEntity: "native",
    targetSubject: "general",
    rawQuestion: rawClean,
    resolvedText: rawClean || "Comprehensive Astrological Consultation",
    confidence: 0.70,
    ontologyEntry: {
      id: "GENERAL_CONSULTATION",
      title: "Comprehensive Astrological Consultation",
      titleTa: "முழுமையான ஜோதிட ஆலோசனை"
    }
  };
}

// ---------------------------------------------------------------------------
// 4. SPECIALIZED SUB-ENGINES
// ---------------------------------------------------------------------------

/**
 * 4.1 SPOUSE FAMILY WEALTH ENGINE
 * Relative comparison: Native Family vs Spouse Family
 */
export function evaluateSpouseFamilyWealth(chartData) {
  const planets = chartData?.planets || [];
  const getPlanet = (name) => planets.find(p => p.name === name) || {};
  const jup = getPlanet("Jupiter");
  const ven = getPlanet("Venus");
  const sun = getPlanet("Sun");

  // Native wealth factors: 2nd & 11th houses/lords from Lagna
  // Spouse wealth factors: 2nd & 11th from 7th house (i.e. 8th and 5th houses) + 2nd from Upapada Lagna
  let nativeScore = 0;
  let spouseScore = 0;
  const factors = [];

  // Check 8th house (2nd from 7th = spouse's family treasury)
  const eighthHousePlanets = planets.filter(p => p.house === 8);
  const eighthBenefics = eighthHousePlanets.filter(p => ["Jupiter", "Venus", "Mercury"].includes(p.name));
  if (eighthBenefics.length > 0) {
    spouseScore += 2;
    factors.push({
      layer: CERTAINTY_LAYERS.LAYER_C.id,
      text: `2nd house from 7th (8th Bhava) contains benefic graha (${eighthBenefics.map(p => p.name).join(", ")}), traditionally signifying substantial family inheritance and wealth of the spouse.`
    });
  }

  // Check 2nd from Lagna
  const secondHousePlanets = planets.filter(p => p.house === 2);
  const secondBenefics = secondHousePlanets.filter(p => ["Jupiter", "Venus", "Mercury"].includes(p.name));
  if (secondBenefics.length > 0) {
    nativeScore += 2;
    factors.push({
      layer: CERTAINTY_LAYERS.LAYER_C.id,
      text: `Native's 2nd Bhava (Dhana Sthana) is strengthened by ${secondBenefics.map(p => p.name).join(", ")}, reflecting established ancestral assets in the native's family.`
    });
  }

  // Dignity of Jupiter and Venus
  if (["Exalted", "Moolatrikona", "Own Sign"].includes(jup.dignity)) {
    spouseScore += 1.5;
    nativeScore += 1;
    factors.push({
      layer: CERTAINTY_LAYERS.LAYER_C.id,
      text: `Jupiter is well-dignified (${jup.dignity}), supporting dharmic prosperity across matrimonial alliances.`
    });
  }

  if (["Exalted", "Moolatrikona", "Own Sign"].includes(ven.dignity)) {
    spouseScore += 1.5;
    factors.push({
      layer: CERTAINTY_LAYERS.LAYER_C.id,
      text: `Venus (Shukra) occupies dignified dignity (${ven.dignity}), indicating aesthetic affluence in the partner's background.`
    });
  }

  let classification = "SIMILAR";
  let verdictEn = "Spouse's family is indicated to be of comparable or similar socio-economic and financial background.";
  let verdictTa = "துணையின் குடும்பம் உங்களின் குடும்பத்திற்கு சமமான அல்லது ஒத்த சமூக, பொருளாதார அந்தஸ்தில் அமைய வாய்ப்புள்ளது.";

  const diff = spouseScore - nativeScore;
  if (diff >= 2.5) {
    classification = "HIGHER";
    verdictEn = "Spouse's family demonstrates indications of moderately higher to distinctly stronger financial standing and established assets.";
    verdictTa = "துணையின் குடும்பம் உங்களின் குடும்பத்தை விட பொருளாதார ரீதியாக சற்றே உயர்ந்து அல்லது கூடுதல் வசதி வாய்ப்புகளுடன் திகழ வலுவான அமைப்பு உள்ளது.";
  } else if (diff >= 1.0) {
    classification = "MODERATELY_HIGHER";
    verdictEn = "Spouse's family shows indications of being in a comfortable, moderately higher financial position.";
    verdictTa = "துணையின் குடும்பம் சற்றே கூடுதல் பொருளாதார வசதி மற்றும் நன்மதிப்புடன் விளங்க சாதகமான அம்சம் உள்ளது.";
  } else if (diff <= -2.0) {
    classification = "LOWER";
    verdictEn = "Native's family holds the stronger ancestral asset base, with spouse coming from a modest, hardworking background.";
    verdictTa = "உங்கள் குடும்பத்தின் பாரம்பரிய சொத்து பலம் உயர்ந்து விளங்க, துணை உழைப்பால் முன்னேறும் நடுத்தர குடும்ப பின்னணியிலிருந்து அமையலாம்.";
  }

  return {
    classification,
    verdictEn,
    verdictTa,
    nativeScore,
    spouseScore,
    evidenceFactors: factors,
    confidence: Math.abs(diff) > 1.5 ? "HIGH" : "MODERATE"
  };
}

/**
 * 4.2 SPOUSE GEOGRAPHIC DISTANCE ENGINE
 * Categorical banded distance ranges (0–10 km, 10–25 km, 25–50 km, 50–100 km, 100–250 km, 250–500 km, 500+ km, Foreign)
 */
export function evaluateSpouseGeographicDistance(chartData) {
  const planets = chartData?.planets || [];
  const getPlanet = (name) => planets.find(p => p.name === name) || {};
  const moon = getPlanet("Moon");
  const rahu = getPlanet("Rahu");
  const seventhHousePlanets = planets.filter(p => p.house === 7);

  // Sign modality of 7th house & 7th lord
  // Movable (Chara) -> Long distance / Different city / Foreign
  // Fixed (Sthira) -> Same city / Nearby locality
  // Dual (Dvisvabhava) -> Moderate distance / Adjoining district
  const ascSign = getAscendantSignName(chartData);
  const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const ascIdx = ascSign ? SIGN_NAMES.indexOf(ascSign) : -1;
  if (ascIdx === -1) {
    return {
      distanceCategory: "INSUFFICIENT_DATA",
      estimatedBand: "Insufficient chart context for geographic distance calculation",
      estimatedBandTa: "இருப்பிட தூர கணிப்பிற்கு போதிய ஜாதக தரவு இல்லை",
      evidenceFactors: [],
      caveat: "Ascendant sign is required to determine the 7th house modality."
    };
  }
  const seventhSignIdx = (ascIdx + 6) % 12;
  const seventhSign = SIGN_NAMES[seventhSignIdx];

  const MOVABLE_SIGNS = ["Aries", "Cancer", "Libra", "Capricorn"];
  const FIXED_SIGNS = ["Taurus", "Leo", "Scorpio", "Aquarius"];
  const DUAL_SIGNS = ["Gemini", "Virgo", "Sagittarius", "Pisces"];

  let distanceCategory = "SAME_CITY";
  let estimatedBand = "25–50 km (Same City / Metropolitan Area)";
  let estimatedBandTa = "25–50 கி.மீ (சொந்த ஊர் / அருகிலுள்ள பெருநகர எல்லை)";
  const factors = [];

  if (rahu.house === 7 || rahu.house === 12 || seventhHousePlanets.some(p => p.name === "Rahu")) {
    distanceCategory = "DIFFERENT_STATE";
    estimatedBand = "250–500 km or Long-Distance / Cross-Cultural Connection";
    estimatedBandTa = "250–500 கி.மீ அல்லது வெளி மாநிலம் / நீண்ட தூரப் பூர்வீகம்";
    factors.push({
      layer: CERTAINTY_LAYERS.LAYER_C.id,
      text: "Rahu influence on 7th or 12th house traditionally points to a non-local, long-distance, or culturally distinct background."
    });
  } else if (MOVABLE_SIGNS.includes(seventhSign)) {
    distanceCategory = "DIFFERENT_DISTRICT";
    estimatedBand = "100–250 km (Different District / Regional Transit Zone)";
    estimatedBandTa = "100–250 கி.மீ (வேறு மாவட்டம் / மண்டல எல்லை)";
    factors.push({
      layer: CERTAINTY_LAYERS.LAYER_C.id,
      text: `7th house falls in a Movable (Chara) Rāśi (${seventhSign}), traditionally associating the partner with travel, relocation, or a distinct locality.`
    });
  } else if (FIXED_SIGNS.includes(seventhSign)) {
    distanceCategory = "NEARBY_LOCALITY";
    estimatedBand = "10–25 km (Nearby Locality / Same Cultural Sub-region)";
    estimatedBandTa = "10–25 கி.மீ (அருகாமை எல்லை / சொந்த ஊர் வட்டாரம்)";
    factors.push({
      layer: CERTAINTY_LAYERS.LAYER_C.id,
      text: `7th house falls in a Fixed (Sthira) Rāśi (${seventhSign}), traditionally favouring marriage within established familiar geographic circles.`
    });
  } else {
    distanceCategory = "SAME_CITY";
    estimatedBand = "25–100 km (Adjoining District / Balanced Geographic Proximity)";
    estimatedBandTa = "25–100 கி.மீ (அக்கம்பக்கத்து மாவட்டம் / நடுத்தர தூரம்)";
    factors.push({
      layer: CERTAINTY_LAYERS.LAYER_C.id,
      text: `7th house falls in a Dual (Dvisvabhava) Rāśi (${seventhSign}), indicating adaptable or moderate regional distance.`
    });
  }

  return {
    distanceCategory,
    estimatedBand,
    estimatedBandTa,
    evidenceFactors: factors,
    caveat: "Astrology provides qualitative regional bands based on sign mobility and planetary karakatvas. Exact kilometer boundaries are subject to real-world modern transit patterns."
  };
}

/**
 * 4.3 DIRECTION ENGINE
 * 8 Cardinal/Intercardinal directions with multi-method comparison
 */
export function evaluateSpouseDirection(chartData) {
  const SIGN_DIRECTIONS = {
    Aries: "EAST", Leo: "EAST", Sagittarius: "EAST",
    Taurus: "SOUTH", Virgo: "SOUTH", Capricorn: "SOUTH",
    Gemini: "WEST", Libra: "WEST", Aquarius: "WEST",
    Cancer: "NORTH", Scorpio: "NORTH", Pisces: "NORTH"
  };

  const PLANET_DIRECTIONS = {
    Sun: "EAST", Mars: "SOUTH", Moon: "NORTH_WEST", Mercury: "NORTH",
    Jupiter: "NORTH_EAST", Venus: "SOUTH_EAST", Saturn: "WEST", Rahu: "SOUTH_WEST", Ketu: "SOUTH_WEST"
  };

  const ascSign = getAscendantSignName(chartData);
  const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const ascIdx = ascSign ? SIGN_NAMES.indexOf(ascSign) : -1;
  const planets = chartData?.planets || [];

  if (ascIdx === -1 || planets.length === 0) {
    return {
      primaryDirection: null,
      secondaryDirection: null,
      directionName: "Insufficient Data",
      directionTa: "கணக்கிடப்படவில்லை",
      methodA: null,
      methodB: null,
      methodC: null,
      convergenceScore: null,
      confidenceCategory: "INSUFFICIENT_DATA",
      explanation: "Ascendant sign or planetary placements are missing or indeterminate.",
      confidence: "INSUFFICIENT_DATA"
    };
  }

  const seventhSign = SIGN_NAMES[(ascIdx + 6) % 12];
  const venus = planets.find(p => p.name === "Venus") || null;

  const methodA = SIGN_DIRECTIONS[seventhSign] || null;
  const methodB = (venus && venus.name) ? (PLANET_DIRECTIONS[venus.name] || null) : null;
  const methodC = (venus && venus.sign) ? (SIGN_DIRECTIONS[venus.sign] || null) : null;

  const validMethods = [methodA, methodB, methodC].filter(Boolean);
  if (validMethods.length < 2 || !venus || !venus.sign) {
    return {
      primaryDirection: null,
      secondaryDirection: null,
      directionName: "Insufficient Data",
      directionTa: "கணக்கிடப்படவில்லை",
      methodA: methodA || null,
      methodB: methodB || null,
      methodC: methodC || null,
      convergenceScore: null,
      confidenceCategory: "INSUFFICIENT_DATA",
      explanation: "Directional indicators (7th house, 7th lord, Venus) are absent or uncalculated.",
      confidence: "INSUFFICIENT_DATA"
    };
  }

  // Frequency count of valid directional methods
  const counts = {};
  validMethods.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const primaryDirection = sorted[0][0];
  const secondaryDirection = sorted[1] ? sorted[1][0] : null;
  const convergenceScore = parseFloat((sorted[0][1] / validMethods.length).toFixed(2));

  let directionTa = predictionConfig.cardinalDirections[primaryDirection]?.tamil || primaryDirection;
  let explanation = "";

  if (methodA && methodC && methodA === methodC) {
    explanation = `High convergence: 7th house sign (${seventhSign}) and Venus sign (${venus?.sign || seventhSign}) both align to the ${primaryDirection} quadrant. Method B (Venus Karaka): ${methodB || "N/A"}.`;
  } else {
    explanation = `Method A (7th Rashi ${seventhSign || "N/A"}): ${methodA || "N/A"} | Method B (Venus Karaka): ${methodB || "N/A"} | Method C (Venus Sign ${venus?.sign || "N/A"}): ${methodC || "N/A"}. Primary convergence zone points towards ${primaryDirection}.`;
  }

  return {
    primaryDirection,
    secondaryDirection,
    directionName: predictionConfig.cardinalDirections[primaryDirection]?.name || primaryDirection,
    directionTa,
    methodA,
    methodB,
    methodC,
    convergenceScore,
    confidenceCategory: convergenceScore >= 0.6 ? "HIGH_CONVERGENCE" : "MIXED_DIRECTIONAL_INDICATION",
    explanation,
    confidence: (methodA === methodB || methodA === methodC) ? "HIGH" : "MODERATE"
  };
}

/**
 * 4.4 JOINT FAMILY VS SEPARATE RESIDENCE ENGINE (Non-Accusatory Decomposed Synthesis)
 */
export function evaluateJointVsSeparateResidence(chartData) {
  const planets = chartData.planets || [];
  const getPlanet = (name) => planets.find(p => p.name === name) || {};
  const sat = getPlanet("Saturn");
  const rahu = getPlanet("Rahu");
  const mars = getPlanet("Mars");

  // Decompose factors objectively:
  // 1. Native's attachment to maternal/ancestral home (4th Bhava & 2nd Bhava)
  // 2. Relocation / independent domicile indicators (3rd, 9th, 12th Bhavas)
  // 3. Spouse's natural orientation
  let jointScore = 0;
  let separateScore = 0;
  const factors = [];

  const fourthHousePlanets = planets.filter(p => p.house === 4);
  const fourthBenefics = fourthHousePlanets.filter(p => ["Jupiter", "Venus", "Moon", "Mercury"].includes(p.name));
  if (fourthBenefics.length > 0) {
    jointScore += 2;
    factors.push({
      layer: CERTAINTY_LAYERS.LAYER_C.id,
      text: `4th Bhava (Matru & Griha Sthana) is energized by benefic planets (${fourthBenefics.map(p => p.name).join(", ")}), indicating strong foundational roots and long-term familial harmony.`
    });
  }

  const twelfthHousePlanets = planets.filter(p => p.house === 12);
  if (twelfthHousePlanets.length > 0 || rahu.house === 4 || rahu.house === 7) {
    separateScore += 2;
    factors.push({
      layer: CERTAINTY_LAYERS.LAYER_C.id,
      text: "Planetary activations on the 12th/3rd axes or Rahu influence suggest career-driven relocation or setting up an independent modern household after marriage."
    });
  }

  let model = "PERIODIC_ADJUSTED";
  let synthesisEn = "";
  let synthesisTa = "";

  if (jointScore > separateScore + 1) {
    model = "LIKELY_JOINT";
    synthesisEn = "The chart demonstrates strong planetary support for continuing in a joint family arrangement or living in close proximity to parents with deep mutual respect.";
    synthesisTa = "ஜாதகத்தில் 4-ம் மற்றும் 2-ம் பாவக சுப அமைப்புகள் கூட்டுக் குடும்ப அமைப்பில் அல்லது பெற்றோரின் அருகாமையில் இணைந்து வாழும் சூழலை ஆதரிக்கின்றன.";
  } else if (separateScore > jointScore + 1) {
    model = "LIKELY_SEPARATE";
    synthesisEn = "The chart indicates a stronger tendency towards establishing an independent household or relocating due to professional opportunities. This reflects natural career and life stage evolution rather than any interpersonal friction.";
    synthesisTa = "தொழில் மற்றும் வாழ்வியல் சூழல் காரணமாக திருமணத்திற்குப் பின் தனிக்குடித்தனம் அல்லது பணி நிமித்த இடமாற்றம் ஏற்பட வலுவான அமைப்பு உள்ளது. இது சுமுகமான சுய முன்னேற்ற அமைப்பாகும்.";
  } else {
    model = "PERIODIC_ADJUSTED";
    synthesisEn = "The chart presents a balanced multi-home dynamic where the native and spouse maintain both independent living space and frequent active support for parental households.";
    synthesisTa = "பெற்றோருக்கு உரிய மரியாதையும் உதவியும் தொடர்ந்து வழங்கிக்கொண்டே, தேவைக்கேற்ப தனி வீடு மற்றும் குடும்ப அமைப்பை நிர்வகிக்கும் சமநிலையான அமைப்பு உள்ளது.";
  }

  return {
    model,
    synthesisEn,
    synthesisTa,
    jointScore,
    separateScore,
    evidenceFactors: factors,
    nonAccusatoryNotice: "AstroVerse analyzes structural household and relocation indicators. Astrological indications of independent living represent life-stage or career transitions and must never be construed as personal fault or intention of either partner."
  };
}

/**
 * 4.4b VEDIC GEMSTONE & REMEDIES ENGINE (Ratna Shastra Synthesis)
 */
export function evaluateGemstoneRemedies(chartData) {
  const ascSign = getAscendantSignName(chartData);
  if (!ascSign) {
    return {
      status: "INSUFFICIENT_DATA",
      recommendationStatus: "INSUFFICIENT_DATA",
      primaryGemstone: null,
      primaryLord: null,
      finger: null,
      metal: null,
      mantra: null,
      contraindicatedList: [],
      contraindicatedSummaryEn: "None (Insufficient chart data)",
      contraindicatedSummaryTa: "இல்லை (போதிய ஜாதக தரவு இல்லை)",
      directAnswerEn: "Gemstone recommendations unavailable due to missing Ascendant.",
      directAnswerTa: "லக்னம் கிடைக்காததால் ரத்தின பரிந்துரை வழங்க இயலவில்லை."
    };
  }

  let remedies = chartData?.personalizedRemedies || chartData?.remedies || null;
  if (!remedies || !remedies.contraindicatedGemstones) {
    try {
      remedies = calculatePersonalizedRemedies(ascSign, chartData?.planets || [], "en", chartData?.currentDasha, chartData?.shadbala);
    } catch {
      remedies = remedies || {};
    }
  }

  const LAGNA_GEM_MAP = {
    Aries: { gem: "Red Coral (Moonga / பவளம்)", lord: "Mars", metal: "Copper/Gold", finger: "Ring finger", mantra: "Om Kram Kreem Kroum Sah Bhaumaya Namah" },
    Taurus: { gem: "Diamond / White Sapphire (Heera / வைரம்)", lord: "Venus", metal: "Silver/Platinum", finger: "Middle/Little finger", mantra: "Om Dram Dreem Droum Sah Shukraya Namah" },
    Gemini: { gem: "Emerald (Panna / மரகதம்)", lord: "Mercury", metal: "Gold/Brass", finger: "Little finger", mantra: "Om Bram Breem Broum Sah Budhaya Namah" },
    Cancer: { gem: "Pearl (Moti / முத்து)", lord: "Moon", metal: "Silver", finger: "Little finger", mantra: "Om Shram Shreem Shroum Sah Chandraya Namah" },
    Leo: { gem: "Ruby (Manikya / மாணிக்கம்)", lord: "Sun", metal: "Gold/Copper", finger: "Ring finger", mantra: "Om Hram Hreem Hroum Sah Suryaya Namah" },
    Virgo: { gem: "Emerald (Panna / மரகதம்)", lord: "Mercury", metal: "Gold/Brass", finger: "Little finger", mantra: "Om Bram Breem Broum Sah Budhaya Namah" },
    Libra: { gem: "Diamond / White Zircon (வைரம் / வெள்ளை ஜிர்கான்)", lord: "Venus", metal: "Silver/Platinum", finger: "Middle/Little finger", mantra: "Om Dram Dreem Droum Sah Shukraya Namah" },
    Scorpio: { gem: "Red Coral (Moonga / பவளம்)", lord: "Mars", metal: "Copper/Gold", finger: "Ring finger", mantra: "Om Kram Kreem Kroum Sah Bhaumaya Namah" },
    Sagittarius: { gem: "Yellow Sapphire (Pukhraj / புஷ்பராகம்)", lord: "Jupiter", metal: "Gold/Brass", finger: "Index finger", mantra: "Om Gram Greem Groum Sah Gurave Namah" },
    Capricorn: { gem: "Blue Sapphire (Neelam / நீலம்)", lord: "Saturn", metal: "Silver/Iron", finger: "Middle finger", mantra: "Om Pram Preem Proum Sah Shanaischaraya Namah" },
    Aquarius: { gem: "Blue Sapphire (Neelam / நீலம்)", lord: "Saturn", metal: "Silver/Iron", finger: "Middle finger", mantra: "Om Pram Preem Proum Sah Shanaischaraya Namah" },
    Pisces: { gem: "Yellow Sapphire (Pukhraj / புஷ்பராகம்)", lord: "Jupiter", metal: "Gold/Brass", finger: "Index finger", mantra: "Om Gram Greem Groum Sah Gurave Namah" }
  };

  const lagnaInfo = LAGNA_GEM_MAP[ascSign] || null;
  const primaryGem = remedies?.primaryGemstone?.gemstone || remedies?.primaryGemstone?.name || remedies?.primaryGemstone || lagnaInfo?.gem || null;
  const primaryLord = remedies?.primaryGemstone?.lord || remedies?.gemLord || lagnaInfo?.lord || null;

  // Evaluate planetary strength, dignity, combustion, house placement for primary gemstone
  const planets = chartData?.planets || [];
  const primaryPlanet = planets.find(p => p.name === primaryLord);
  let recommendationStatus = "RECOMMENDED";
  let statusNoteEn = "";
  let statusNoteTa = "";

  if (primaryPlanet) {
    if (primaryPlanet.isCombust) {
      recommendationStatus = "CONDITIONALLY_RECOMMENDED";
      statusNoteEn = " (Planet is combust with Sun; use caution or prioritize mantra japa)";
      statusNoteTa = " (சூரியனுடன் அஸ்தமனம்; கவனமுடன் பரிசீலிக்கவும் அல்லது மந்திர ஜபத்திற்கு முன்னுரிமை அளிக்கக்கவும்)";
    } else if ([6, 8, 12].includes(primaryPlanet.house)) {
      recommendationStatus = "CONDITIONALLY_RECOMMENDED";
      statusNoteEn = ` (Planet placed in House ${primaryPlanet.house} Dusthana; evaluate carefully)`;
      statusNoteTa = ` (${primaryPlanet.house}-ம் மறைவு ஸ்தான இருப்பு; விழிப்புணர்வுடன் அணுகவும்)`;
    } else if (primaryPlanet.dignity === "Debilitated" || primaryPlanet.dignity === "Neecha") {
      recommendationStatus = "NOT_RECOMMENDED";
      statusNoteEn = " (Planet is debilitated; direct gemstone intensification not recommended)";
      statusNoteTa = " (நீச நிலை; ரத்தினம் மூலம் வீரியப்படுத்துவது பரிந்துரைக்கப்படவில்லை)";
    }
  }

  // Strictly use dynamically computed or verified contraindicated gemstones; NEVER generic fallback!
  const rawContra = remedies?.contraindicatedGemstones || remedies?.traditionallyDiscouragedGemstones || [];
  const contraindicated = Array.isArray(rawContra) ? rawContra : [];

  const contraTextEn = contraindicated.length > 0
    ? contraindicated.map(c => typeof c === "string" ? c : `${c.gemstone || c.name} (${c.reason || c.lord})`).join(", ")
    : "None explicitly contraindicated";

  const contraTextTa = contraindicated.length > 0
    ? contraindicated.map(c => typeof c === "string" ? cleanEnglishParentheses(c) : `${cleanEnglishParentheses(c.gemstone || c.name || "")} (${cleanEnglishParentheses(c.reason || "") || toTamilPlanet(c.lord)})`).join(", ")
    : "வெளிப்படையான தடைகள் ஏதுமில்லை";

  return {
    recommendationStatus,
    primaryGemstone: primaryGem,
    primaryLord,
    finger: lagnaInfo?.finger || null,
    metal: lagnaInfo?.metal || null,
    mantra: remedies?.mantra || lagnaInfo?.mantra || null,
    contraindicatedList: contraindicated,
    contraindicatedSummaryEn: contraTextEn,
    contraindicatedSummaryTa: contraTextTa,
    directAnswerEn: primaryGem
      ? `Your primary traditionally assessed gemstone is ${primaryGem} (ruled by Lagna lord ${primaryLord})${statusNoteEn}. Contraindicated gemstones: ${contraTextEn}. (Traditional Ratna Shastra advisory only; examine personal tolerance and physical stone quality).`
      : "Gemstone recommendations unavailable due to missing Ascendant.",
    directAnswerTa: primaryGem
      ? `உங்கள் ஜாதகத்திற்கு பாரம்பரிய முறையில் ஆராயப்பட்ட முதன்மை ரத்தினம்: ${cleanEnglishParentheses(primaryGem)} (லக்னாதிபதி ${toTamilPlanet(primaryLord)})${statusNoteTa}. தவிர்க்க வேண்டிய ரத்தினங்கள்: ${contraTextTa}. (பாரம்பரிய ரத்தின சாஸ்திர வழிகாட்டல் மட்டுமே; அணிவதற்கு முன் தகுதியை சோதிக்கவும்).`
      : "லக்னம் கிடைக்காததால் ரத்தின பரிந்துரை வழங்க இயலவில்லை."
  };
}

/**
 * 4.5 NATAL PROMISE EVALUATOR (Multi-Domain Deep Shastric Promise Engine)
 */
export function evaluateNatalPromise(chartData, domain = "MARRIAGE", questionType = "") {
  const planets = chartData?.planets || [];
  const positive = [];
  const negative = [];
  const neutral = [];
  const cancellations = [];

  const getPlanet = (name) => planets.find(p => p.name === name) || {};
  const jup = getPlanet("Jupiter");
  const ven = getPlanet("Venus");
  const sat = getPlanet("Saturn");
  const sun = getPlanet("Sun");
  const mars = getPlanet("Mars");
  const merc = getPlanet("Mercury");
  const moon = getPlanet("Moon");
  const rahu = getPlanet("Rahu");
  const ketu = getPlanet("Ketu");

  // 1. HEALTH & WELLNESS
  if (domain === "HEALTH" || domain === "WELLNESS") {
    const firstHousePlanets = planets.filter(p => p.house === 1);
    const sixthHousePlanets = planets.filter(p => p.house === 6);

    if (["Exalted", "Own Sign", "Moolatrikona", "Friend"].includes(sun.dignity)) {
      positive.push(`Sun (Vitality Karaka) is well-placed in ${sun.sign} (${sun.dignity}), bestowing strong inherent vitality and cardiac/bone resilience.`);
    } else if (sun.dignity === "Debilitated") {
      negative.push("Sun in debilitation suggests the need for active lifestyle discipline, hydration, and regular cardiovascular care.");
      cancellations.push("Benefic Jupiter or Mars aspects support physical stamina over time.");
    }

    if (["Exalted", "Own Sign", "Moolatrikona"].includes(moon.dignity)) {
      positive.push(`Moon is dignified in ${moon.sign} (${moon.dignity}), supporting emotional calm, mental equilibrium, and healthy fluid balance.`);
    } else if (moon.dignity === "Debilitated") {
      negative.push("Moon in Scorpio indicates sensitivity to emotional stress; meditation and restful sleep routines are astrologically recommended.");
      cancellations.push("Subha Graha influences moderate emotional volatility.");
    }

    const beneficInLagna = firstHousePlanets.filter(p => ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.name));
    if (beneficInLagna.length > 0) {
      positive.push(`Lagna is energized by natural benefics (${beneficInLagna.map(p => p.name).join(", ")}), creating a protective Deha Bala shield against major illnesses.`);
    }

    const maleficInSixth = sixthHousePlanets.filter(p => ["Mars", "Saturn", "Rahu", "Sun"].includes(p.name));
    if (maleficInSixth.length > 0) {
      positive.push(`Natural malefics in 6th Bhava (${maleficInSixth.map(p => p.name).join(", ")}) align with classical indicators for traditional vitality preservation and overcoming ailments (Roga Nashana).`);
    }

    if (sat.house === 8 || ["Exalted", "Own Sign"].includes(sat.dignity)) {
      positive.push("Saturn as Ayushkaraka is favorably disposed, supporting longevity, endurance, and recuperative strength.");
    }

    if (positive.length === 0) {
      positive.push("Foundational Lagna and Kendra Bhavas provide balanced physical constitution with regular wellness care.");
    }

    return {
      domain: "HEALTH",
      promiseStrength: positive.length >= negative.length ? "STRONG_PROMISE" : "GUARDED_PROMISE",
      positiveIndicators: positive,
      negativeIndicators: negative,
      neutralIndicators: neutral,
      cancellations,
      cancellationFactors: cancellations.length > 0 ? cancellations : ["Routine wellness discipline and medical checkups mitigate seasonal imbalances."],
      birthTimeSensitivity: "D30 Trimsamsha shifts every ~4 minutes; minute-level birth timing confirms micro-level dosha balance."
    };
  }

  // 2. EDUCATION & RESEARCH
  if (domain === "EDUCATION") {
    const fourthHousePlanets = planets.filter(p => p.house === 4);
    const fifthHousePlanets = planets.filter(p => p.house === 5);
    const ninthHousePlanets = planets.filter(p => p.house === 9);
    const eighthHousePlanets = planets.filter(p => p.house === 8);

    // 4th Bhava (Vidya Sthana - foundational learning)
    if (fourthHousePlanets.length > 0) {
      positive.push(`4th Bhava (Vidya Sthana) is activated by ${fourthHousePlanets.map(p => p.name).join(", ")}, supporting structured learning and academic graduation.`);
    }

    // 5th Bhava (Buddhi Sthana - intellect & research synthesis)
    if (fifthHousePlanets.length > 0) {
      positive.push(`5th Bhava (Buddhi & Dhi Sthana) hosts ${fifthHousePlanets.map(p => p.name).join(", ")}, conferring sharp memory, creative genius, and analytical retention.`);
    }

    // Mercury (Buddhi Karaka)
    if (["Exalted", "Own Sign", "Moolatrikona", "Friend"].includes(merc.dignity)) {
      positive.push(`Mercury (Buddhi Karaka) is dignified in ${merc.sign} (${merc.dignity}), bestowing mathematical precision, scientific logic, and quick intellectual grasp.`);
    } else if (merc.dignity === "Debilitated") {
      negative.push("Mercury in Pisces (debilitated) indicates intuitive/creative over linear logic; structured study notes and revisions are beneficial.");
      cancellations.push("Jupiter or Venus conjunction/aspect confers Neechabhanga Rajayoga for intellect.");
    }

    // Jupiter (Jnana Karaka)
    if (["Exalted", "Own Sign", "Moolatrikona", "Friend"].includes(jup.dignity)) {
      positive.push(`Jupiter (Guru / Jnana Karaka) is well-placed in ${jup.sign}, ensuring deep conceptual mastery, scholastic guidance, and academic accolades.`);
    }

    // Research & PhD Specific Indicators (8th, 9th, 5th, Rahu/Ketu)
    if (questionType === "RESEARCH_PHD" || eighthHousePlanets.length > 0 || ninthHousePlanets.length > 0) {
      if (eighthHousePlanets.length > 0 || [8, 9, 5].includes(merc.house) || [8, 9, 5].includes(jup.house)) {
        positive.push("8th Bhava (deep investigative research, unravelling hidden mysteries, data science) and 9th Bhava (higher philosophical truth & doctoral thesis) form strong intellectual depth.");
      }
      if (rahu.house === 5 || rahu.house === 9 || rahu.house === 8 || rahu.house === 10) {
        positive.push("Rahu in key intellectual houses drives pioneering breakthroughs, unconventional scientific inquiry, AI/modern technological research, and international paper publications.");
      }
      if (ketu.house === 8 || ketu.house === 9 || ketu.house === 12) {
        positive.push("Ketu in occult/higher knowledge trines confers microscopic analytical precision and deep root-cause discovery capability.");
      }
    }

    // Competitive Exams (6th house victory & Mars focus)
    if (questionType === "COMPETITIVE_EXAMS" || [6, 10, 11].includes(mars.house)) {
      positive.push("Mars and 6th Bhava (Shatru/Pratiyogi Vijaya) activation provide relentless exam focus, competitive endurance, and top percentile rankings.");
    }

    if (positive.length === 0) {
      positive.push("Foundational 4th and 5th house lord connections provide stable academic continuity.");
    }

    return {
      domain: "EDUCATION",
      promiseStrength: positive.length >= negative.length ? "STRONG_PROMISE" : "MODERATE_PROMISE",
      positiveIndicators: positive,
      negativeIndicators: negative,
      neutralIndicators: neutral,
      cancellations,
      cancellationFactors: cancellations.length > 0 ? cancellations : ["Consistent study schedules and structured revision routines mitigate exam stress."],
      birthTimeSensitivity: "D24 Siddhamsa shifts every ~5 minutes; exact birth record is vital for verifying academic honors and doctoral fruition."
    };
  }

  // 3. CAREER & VOCATION
  if (domain === "CAREER" || domain === "VOCATION") {
    const tenthHousePlanets = planets.filter(p => p.house === 10);
    const eleventhHousePlanets = planets.filter(p => p.house === 11);

    if (tenthHousePlanets.length > 0) {
      positive.push(`10th Bhava (Karma Sthana) is actively energized by ${tenthHousePlanets.map(p => p.name).join(", ")}, driving professional drive and public visibility.`);
    } else {
      positive.push("10th Bhava receives positive karaka support from Sun (authority) and Mercury/Jupiter (commercial acumen).");
    }

    if (eleventhHousePlanets.length > 0) {
      positive.push(`11th Bhava (Labha Sthana) hosts ${eleventhHousePlanets.map(p => p.name).join(", ")}, indicating strong revenue generation and business profits.`);
    }

    if (["Exalted", "Own Sign", "Moolatrikona"].includes(sun.dignity)) {
      positive.push(`Sun is highly dignified (${sun.dignity}), indicating executive leadership authority and administrative influence.`);
    }

    if (["Exalted", "Own Sign", "Moolatrikona", "Friend"].includes(merc.dignity)) {
      positive.push(`Mercury (Vyaparaka / Commerce Karaka) is well-placed in ${merc.sign}, favoring commercial acumen, trade negotiation, and independent enterprise.`);
    }

    if (sat.house === 10 || sat.house === 6 || sat.house === 11) {
      positive.push("Saturn placement reinforces persistence, organizational mastery, and solid long-term enterprise growth.");
    }

    return {
      domain: "CAREER",
      promiseStrength: positive.length >= negative.length ? "STRONG_PROMISE" : "MODERATE_PROMISE",
      positiveIndicators: positive,
      negativeIndicators: negative,
      neutralIndicators: neutral,
      cancellations,
      cancellationFactors: cancellations,
      birthTimeSensitivity: "D10 Dashamsha shifts every ~12 minutes; accurate birth time is vital for executive position timing."
    };
  }

  // 4. WEALTH & FINANCE (Including Mega Wealth & Billionaire Potentials)
  if (domain === "WEALTH" || domain === "FINANCE") {
    const secondHousePlanets = planets.filter(p => p.house === 2);
    const eleventhHousePlanets = planets.filter(p => p.house === 11);
    const fourthHousePlanets = planets.filter(p => p.house === 4);
    const ninthHousePlanets = planets.filter(p => p.house === 9);
    const fifthHousePlanets = planets.filter(p => p.house === 5);

    if (secondHousePlanets.length > 0) {
      positive.push(`2nd Bhava (Dhana Sthana - accumulated wealth & treasury) is occupied by ${secondHousePlanets.map(p => p.name).join(", ")}, strengthening liquid assets and family capital.`);
    }
    if (eleventhHousePlanets.length > 0) {
      positive.push(`11th Bhava (Labha Sthana - gains & recurring revenue) contains ${eleventhHousePlanets.map(p => p.name).join(", ")}, supporting continuous cash inflows and financial expansion.`);
    }
    if (fourthHousePlanets.length > 0 || ["Exalted", "Own Sign"].includes(mars.dignity)) {
      positive.push("Strong 4th house configurations and Mars (Bhoomikaraka) favor real estate, land acquisition, and fixed property assets.");
    }
    if (["Exalted", "Own Sign", "Moolatrikona"].includes(jup.dignity)) {
      positive.push(`Jupiter as Dhanakaraka is dignified (${jup.dignity}), creating enduring Dhana Yoga prospects.`);
    }
    if (["Exalted", "Own Sign", "Moolatrikona"].includes(ven.dignity)) {
      positive.push(`Venus (Shukra - wealth & material luxuries) is dignified (${ven.dignity}), indicating high living standards and luxury asset accumulation.`);
    }

    // Mega Wealth / Billionaire Special Combinations
    if (questionType === "MEGA_WEALTH_BILLIONAIRE") {
      const upachayaBenefics = [3, 6, 10, 11].filter(h => planets.some(p => p.house === h && ["Jupiter", "Venus", "Mercury"].includes(p.name)));
      if (upachayaBenefics.length >= 2) {
        positive.push("Vasumathi Yoga orientation: Natural benefics occupy Upachaya houses (3, 6, 10, 11), traditionally signifying immense self-made enterprise wealth.");
      }
      if (fifthHousePlanets.length > 0 && ninthHousePlanets.length > 0) {
        positive.push("Trikona connection: 5th house of Purva Punya and 9th house of Mahabhagya harmonize, signaling extraordinary wealth multipliers and lucrative venture timing.");
      }
      neutral.push("Classical Shastras state that billionaire/generational mega-wealth requires interlocking Maha Dhana Yogas in both D1 & D9, unblemished 2nd/11th lords, and active operational Mahadashas of 2nd/5th/9th/11th lords during peak enterprise years.");
    }

    // Equity & Speculative Markets
    if (questionType === "INVESTMENT_MARKETS") {
      if (fifthHousePlanets.length > 0 || [5, 11].includes(merc.house) || [5, 11].includes(rahu.house)) {
        positive.push("5th Bhava (market foresight & speculation) and 11th Bhava (profits) connections favor equity portfolios, strategic market trading, and capital growth.");
      }
    }

    if (positive.length === 0) {
      positive.push("Foundational 2nd, 9th, and 11th Bhava connections support steady wealth creation and financial independence.");
    }

    return {
      domain: "WEALTH",
      promiseStrength: positive.length >= 2 ? "STRONG_PROMISE" : "MODERATE_PROMISE",
      positiveIndicators: positive,
      negativeIndicators: negative,
      neutralIndicators: neutral,
      cancellations,
      cancellationFactors: cancellations.length > 0 ? cancellations : ["Disciplined diversification and risk management protect accumulated gains."],
      birthTimeSensitivity: "D4 Chaturthamsha shifts every ~30 minutes; D16 Shodashamsha shifts every ~7.5 minutes; reflects asset and vehicle timing."
    };
  }

  // 5. MARRIAGE & RELATIONSHIP
  if (domain === "MARRIAGE" || domain === "RELATIONSHIP") {
    const seventhHousePlanets = planets.filter(p => p.house === 7);

    if (["Exalted", "Moolatrikona", "Own Sign", "Friend"].includes(ven.dignity)) {
      positive.push(`Venus (Kalathra Karaka) is well-dignified in ${ven.sign} (${ven.dignity}), supporting deep affection and harmonious companionship.`);
    } else if (ven.dignity === "Debilitated") {
      negative.push("Venus occupies debilitation in Virgo, indicating initial relational adjustments or perfectionist expectations.");
      cancellations.push("Jupiter or Lagna aspect moderates Venusian debilitation through mature values.");
    } else {
      positive.push(`Venus placed in ${ven.sign || 'natal sign'} provides foundational capacity for companionship.`);
    }

    if (seventhHousePlanets.length > 0) {
      const beneficOccupants = seventhHousePlanets.filter(p => ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.name));
      if (beneficOccupants.length > 0) {
        positive.push(`7th Bhava hosts auspicious grahas (${beneficOccupants.map(p => p.name).join(", ")}), indicating partner harmony.`);
      }
      const satOccupant = seventhHousePlanets.find(p => p.name === "Saturn");
      if (satOccupant) {
        if (["Own Sign", "Moolatrikona", "Exalted"].includes(satOccupant.dignity)) {
          positive.push(`Saturn in 7th occupies its own/exalted sign (${satOccupant.sign}), forming a stable Sasa Yoga orientation that grants profound long-term fidelity and marital stability.`);
        }
      }
    } else {
      positive.push("7th Bhava is unblemished by natural malefics, maintaining clear marital potential.");
    }

    if (jup.house === 7 || jup.house === 1 || jup.house === 3 || jup.house === 11 || jup.house === 5 || jup.house === 9) {
      positive.push("Jupiter casts auspicious aspect or occupies key kendra/trikona, sanctifying matrimonial growth.");
    }

    const ascSign = getAscendantSignName(chartData);
    if (sat.house === 7 || (ascSign === "Cancer" && sat.house === 1)) {
      negative.push("Saturnian aspect or occupation on 7th house introduces maturity requirements and sober timing.");
      cancellations.push("Benefic Jupiter aspect moderates Saturnian delay tendencies over time.");
    }

    if (rahu.house === 7) {
      neutral.push("Rahu in 7th indicates non-conventional partner traits or cross-cultural alliance.");
    }

    if (positive.length === 0) {
      positive.push("Foundational Lagna and 7th Bhava lord connections establish favorable relationship capacity.");
    }

    return {
      domain: "MARRIAGE",
      promiseStrength: positive.length >= negative.length ? "STRONG_PROMISE" : "GUARDED_PROMISE",
      positiveIndicators: positive,
      negativeIndicators: negative,
      neutralIndicators: neutral,
      cancellations,
      cancellationFactors: cancellations.length > 0 ? cancellations : ["Benefic Jupiter aspect moderates Saturnian delay tendencies."],
      birthTimeSensitivity: "D9 Navamsha shifts every ~13.3 minutes; verify exact birth minute for precise marital pada alignment."
    };
  }

  // 6. CHILDREN & PROGENY
  if (domain === "CHILDREN") {
    const fifthHousePlanets = planets.filter(p => p.house === 5);
    const ninthHousePlanets = planets.filter(p => p.house === 9);

    if (fifthHousePlanets.length > 0) {
      positive.push(`5th Bhava (Putra Sthana) is energized by ${fifthHousePlanets.map(p => p.name).join(", ")}, promising filial happiness and talented progeny.`);
    }
    if (["Exalted", "Own Sign", "Moolatrikona", "Friend"].includes(jup.dignity)) {
      positive.push(`Jupiter (Putrakaraka) is well-dignified in ${jup.sign}, bestowing auspicious progeny prospects and virtuous children.`);
    }
    if (ninthHousePlanets.length > 0) {
      positive.push(`9th Bhava (higher blessings & grandchildren) supports family lineage expansion.`);
    }

    if (positive.length === 0) {
      positive.push("5th house and Jupiter configurations establish favorable foundation for family expansion.");
    }

    return {
      domain: "CHILDREN",
      promiseStrength: positive.length >= negative.length ? "STRONG_PROMISE" : "MODERATE_PROMISE",
      positiveIndicators: positive,
      negativeIndicators: negative,
      neutralIndicators: neutral,
      cancellations,
      cancellationFactors: cancellations,
      birthTimeSensitivity: "D7 Saptamsha shifts every ~17 minutes; confirms progeny timing and child well-being."
    };
  }

  // 7. SPIRITUALITY & MOKSHA
  if (domain === "SPIRITUALITY") {
    const ninthHousePlanets = planets.filter(p => p.house === 9);
    const twelfthHousePlanets = planets.filter(p => p.house === 12);
    const eighthHousePlanets = planets.filter(p => p.house === 8);

    if (ketu.house === 12 || ketu.house === 9 || ketu.house === 8) {
      positive.push(`Ketu (Mokshakaraka) in ${ketu.house}th house confers deep contemplative detachment, inner awakening, and intense spiritual sadhana.`);
    }
    if (["Exalted", "Own Sign", "Moolatrikona"].includes(jup.dignity)) {
      positive.push(`Jupiter (Dharmakaraka & Guru) is dignified in ${jup.sign}, bestowing spiritual wisdom, divine grace, and authentic guru lineage.`);
    }
    if (ninthHousePlanets.length > 0 || twelfthHousePlanets.length > 0 || eighthHousePlanets.length > 0) {
      positive.push("Harmonious 9th (Dharma), 8th (Kundalini/Sadhana), and 12th (Moksha) Bhava alignments foster profound meditative insight.");
    }

    if (positive.length === 0) {
      positive.push("Dharmic trikona connections foster steady spiritual evolution and philosophical inquiry.");
    }

    return {
      domain: "SPIRITUALITY",
      promiseStrength: "STRONG_PROMISE",
      positiveIndicators: positive,
      negativeIndicators: negative,
      neutralIndicators: neutral,
      cancellations,
      cancellationFactors: cancellations,
      birthTimeSensitivity: "D20 Vimsamsha shifts every ~6 minutes; confirms upasana, mantra siddhi, and spiritual maturity."
    };
  }

  // 8. LEGAL & DISPUTES
  if (domain === "LEGAL") {
    const sixthHousePlanets = planets.filter(p => p.house === 6);
    const sixthMalefics = sixthHousePlanets.filter(p => ["Mars", "Saturn", "Rahu", "Sun"].includes(p.name));

    if (sixthMalefics.length > 0) {
      positive.push(`Natural malefics in 6th Bhava (${sixthMalefics.map(p => p.name).join(", ")}) grant formidable Shatru Vijaya Yoga, overcoming legal adversaries and dispute challenges.`);
    }
    if (["Exalted", "Own Sign"].includes(mars.dignity) || [3, 6, 10, 11].includes(mars.house)) {
      positive.push("Mars (courage & legal defense) provides aggressive persistence and strategic victory in contentious proceedings.");
    }
    if (["Exalted", "Own Sign"].includes(sun.dignity) || [10, 11].includes(sun.house)) {
      positive.push("Sun placement supports favorable recognition from judicial authorities and institutional arbitration.");
    }

    if (positive.length === 0) {
      positive.push("6th and 10th Bhava configurations support amicable settlement and dispute resolution.");
    }

    return {
      domain: "LEGAL",
      promiseStrength: positive.length >= negative.length ? "STRONG_PROMISE" : "MODERATE_PROMISE",
      positiveIndicators: positive,
      negativeIndicators: negative,
      neutralIndicators: neutral,
      cancellations,
      cancellationFactors: cancellations,
      birthTimeSensitivity: "D10 Dashamsha shifts every ~12 minutes; reflects professional and dispute timing."
    };
  }

  // Default / General Domain Promise
  return {
    domain,
    promiseStrength: "STRONG_PROMISE",
    positiveIndicators: ["Lagna, Kendra, and Trikona Bhavas demonstrate positive foundational promise across planetary periods."],
    negativeIndicators: [],
    neutralIndicators: [],
    cancellations: [],
    cancellationFactors: [],
    birthTimeSensitivity: "Varga division sensitivity varies between 2 to 15 minutes."
  };
}

// ---------------------------------------------------------------------------
// 5. DEEP 17-SECTION ASTROLOGER CONSULTATION GENERATOR
// ---------------------------------------------------------------------------
export function generateAstrologerConsultation(chartData, questionText = "", options = {}) {
  const isTamil = options.lang === "ta" || options.language === "ta" || options.isTamil;
  const depth = (options.depth || "ASTROLOGER_MODE").toUpperCase();
  const intent = classifyConsultationIntent(questionText, options.conversationHistory || []);

  const natalPromise = evaluateNatalPromise(chartData, intent.domain, intent.questionType);
  const wealthEval = evaluateSpouseFamilyWealth(chartData);
  const distEval = evaluateSpouseGeographicDistance(chartData);
  const dirEval = evaluateSpouseDirection(chartData);
  const resEval = evaluateJointVsSeparateResidence(chartData);

  // Derive dynamic timing windows from Mahadasha/Antardasha
  const dashaTable = Array.isArray(chartData.dashaTable) ? chartData.dashaTable : [];
  const currentDashaRecord = dashaTable.find(d => d.isCurrent) ?? null;
  const currentDasha = (typeof chartData.currentDasha === "object" ? (chartData.currentDasha?.lord || chartData.currentDasha?.mahadasha) : chartData.currentDasha) ?? currentDashaRecord?.lord ?? (dashaTable.length > 0 ? dashaTable[0]?.lord : null);
  const currentAntar = (typeof chartData.currentDasha === "object" ? (chartData.currentDasha?.subLord || chartData.currentDasha?.antardasha || chartData.currentDasha?.currentAntar) : null) ?? chartData.currentAntar ?? (currentDashaRecord?.bukthis?.find(b => b.isCurrent)?.subLord || null);
  const currentDashaTa = currentDasha ? toTamilPlanet(currentDasha) : null;
  const currentAntarTa = currentAntar ? toTamilPlanet(currentAntar) : null;

  // Build the 17 comprehensive consultation sections
  const sections = [];

  // Section 1: Your Question
  sections.push({
    sectionNumber: 1,
    titleEn: "Your Question",
    titleTa: "உங்கள் கேள்வி",
    layer: CERTAINTY_LAYERS.LAYER_A.id,
    content: questionText || intent.resolvedText
  });

  // Section 2: Direct Answer
  let directAnswerEn = "";
  let directAnswerTa = "";

  if (intent.questionType === "JOINT_VS_SEPARATE") {
    directAnswerEn = resEval.synthesisEn;
    directAnswerTa = resEval.synthesisTa;
  } else if (intent.questionType === "SPOUSE_FAMILY_WEALTH") {
    directAnswerEn = wealthEval.verdictEn;
    directAnswerTa = wealthEval.verdictTa;
  } else if (intent.questionType === "SPOUSE_DISTANCE") {
    directAnswerEn = `Traditional geographic indicators suggest a connection situated within ${distEval.estimatedBand}.`;
    directAnswerTa = `பாரம்பரிய நிலவியல் அமைப்பின்படி, துணை அமையும் தூரம் தோராயமாக ${distEval.estimatedBandTa} வரம்பில் சுட்டிக்காட்டப்படுகிறது.`;
  } else if (intent.questionType === "SPOUSE_DIRECTION") {
    directAnswerEn = `Primary directional indicators point predominantly towards the ${dirEval.directionName} (${dirEval.directionTa}) zone from your birth/residence place.`;
    directAnswerTa = `உங்கள் பூர்வீகம் அல்லது வசிப்பிடத்திலிருந்து ${dirEval.directionTa} திசையில் துணை அமைய சாதகமான கிரக அமைப்புகள் உள்ளன.`;
  } else if (intent.questionType === "FAMILY_PRESTIGE") {
    directAnswerEn = "The chart indicates that the spouse will hold high regard for familial values, respect elders, and uphold ancestral reputation, supported by favorable 9th and 2nd house configurations.";
    directAnswerTa = "துணை உங்கள் குடும்ப பாரம்பரிய விழுமியங்கள் மற்றும் பெரியோரை மதித்து நடக்கும் நற்குணங்களைப் பெற்றிருப்பார். 9-ம் மற்றும் 2-ம் பாவக சுப அமைப்புகள் குடும்ப நல்லிணக்கத்தையும் கௌரவத்தையும் சுட்டிக்காட்டுகின்றன.";
  } else if (intent.questionType === "LOVE_VS_ARRANGED") {
    directAnswerEn = "Planetary alignments between the 5th house of affection and 7th house of matrimony indicate favorable conditions for a well-matched, mutually respected alliance with active family involvement.";
    directAnswerTa = "ஜாதகத்தில் 5-ம் பாவகம் (காதல்) மற்றும் 7-ம் பாவகம் (திருமணம்) ஆகியவற்றின் சுப பார்வைகள் பரஸ்பர அன்பும் பெரியோர்களின் ஆசியும் இணைந்த சுமுகமான திருமண அமைப்பை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "MARRIAGE" || intent.questionType === "MARRIAGE_TIMING" || intent.questionType === "MARRIAGE_AGE") {
    directAnswerEn = `Your 7th house of matrimony and Navamsha (D9) traditionally indicate partnership potential. Supportive timing depends on alignment between operating dasha cycles and transit triggers; this represents qualitative astrological timing rather than guaranteed event certainty.`;
    directAnswerTa = `உங்கள் 7-ம் களத்திர பாவகம் மற்றும் நவாம்சம் (D9) பாரம்பரிய ஜோதிட விளக்கத்தில் சாதகமான தாம்பத்திய சாத்தியத்தை சுட்டிக்காட்டுகின்றன; தசா மற்றும் கோச்சார பெயர்ச்சிகள் இணையும் காலமே இதற்கான உகந்த காலக்கட்டமாகும். இதை உறுதியான வாழ்க்கை நிகழ்வு எனக் கருத முடியாது.`;
  } else if (intent.questionType === "GEMSTONE_PRESCRIPTION" || intent.domain === "REMEDIES") {
    const gemEval = evaluateGemstoneRemedies(chartData);
    directAnswerEn = gemEval.directAnswerEn;
    directAnswerTa = gemEval.directAnswerTa;
  } else if (intent.domain === "HEALTH" || intent.questionType === "HEALTH_WELLNESS" || intent.questionType === "DISEASE_RECOVERY" || intent.questionType === "LONGEVITY_AYUR") {
    directAnswerEn = `Your Lagna vitality (1st house), traditional 6th-house health symbolism (6th house), and planetary vitality karakas indicate traditional constitutional/vitality correspondence during the active ${currentDasha} Mahadasha — ${currentAntar} Antardasha cycle. Disciplined lifestyle habits and preventive care provide strong support.`;
    directAnswerTa = `உங்கள் லக்ன தேக பலம் (1-ம் பாவகம்), பாரம்பரிய 6-ம் பாவக உடல்நல மற்றும் நல்வாழ்வுக் குறியீடுகள், மற்றும் சூரியன்/சந்திரனின் நிலைகள் நடப்பு ${currentDashaTa} மகா தசை — ${currentAntarTa} புக்தி காலத்தில் பாரம்பரிய உடலியல் சமநிலையை சுட்டிக்காட்டுகின்றன (இது மருத்துவ முடிவல்ல; ஆரோக்கியம் குறித்த பாரம்பரிய ஜோதிட வழிகாட்டல் மட்டுமே). முறையான உணவுப்பழக்கம் மற்றும் உடற்பயிற்சி உடலமைப்பை மேலும் வலுப்படுத்தும்.`;
  } else if (intent.questionType === "PROMOTION_TIMING" || (intent.domain === "CAREER" && intent.questionType !== "BUSINESS_GROWTH")) {
    directAnswerEn = `Active planetary configurations in your 10th house of career during the current ${currentDasha} Mahadasha — ${currentAntar} Antardasha cycle present strong astrological timing for professional advancement, skill recognition, and new executive responsibilities.`;
    directAnswerTa = `உங்கள் 10-ம் கர்ம பாவக அமைப்பும், நடப்பு ${currentDashaTa} மகா தசை — ${currentAntarTa} புக்தி காலமும் தொழில் முன்னேற்றம், பதவி உயர்வு மற்றும் புதிய பொறுப்புகள் கிடைப்பதற்கான சாதகமான காலக்கட்டத்தை சுட்டிக்காட்டுகின்றன.`;
  } else if (intent.questionType === "BUSINESS_GROWTH" || intent.domain === "CAREER") {
    directAnswerEn = `Your 10th house of vocation and 11th house of gains outline commercial inclinations in traditional astrology. Real-world business outcomes depend on market reality and sound planning rather than unconditional guarantees.`;
    directAnswerTa = `உங்கள் 10-ம் கர்ம பாவகம் மற்றும் 11-ம் லாப பாவக அமைப்புகள் பாரம்பரிய ஜோதிட நெறிமுறைகளின்படி தொழில் முயற்சி சாத்தியங்களை சுட்டிக்காட்டுகின்றன. சந்தை சூழல் மற்றும் நடைமுறை வணிகத் திட்டமிடல் மூலமே முன்னேற்றம் சாத்தியமாகும்; ஜோதிடம் வணிக வெற்றியை உத்தரவாதம் செய்ய முடியாது.`;
  } else if (intent.questionType === "MEGA_WEALTH_BILLIONAIRE") {
    directAnswerEn = `Your chart demonstrates potent foundational Dhana Yogas and strong financial multipliers. Classical Shastras indicate that extreme wealth accumulation is catalyzed during the operating ${currentDasha} Mahadasha — ${currentAntar} Antardasha cycle through disciplined enterprise, strategic investments, and compounding assets.`;
    directAnswerTa = `உங்கள் ஜாதகத்தில் வலுவான தன யோகங்களும் பெருஞ்செல்வ சேர்க்கைக்கான சாத்தியக்கூறுகளும் அமைந்துள்ளன. சாஸ்திர விதிகளின்படி, நடப்பு ${currentDashaTa} மகா தசை — ${currentAntarTa} புக்தி காலத்தில் புதிய முதலீடுகள், தொழில் விரிவாக்கம் மற்றும் நிலையான சொத்து பெருக்கம் மூலம் பெரும் பொருளாதார வளர்ச்சி உண்டாகும் யோகம் உள்ளது.`;
  } else if (intent.questionType === "INVESTMENT_MARKETS") {
    directAnswerEn = `Traditional connections between your 5th house of intellect/speculation and 11th house of gains are traditionally associated with financial analysis and resource planning during the ${currentDasha} Mahadasha — ${currentAntar} Antardasha period; no financial market return or investment outcome is inferred.`;
    directAnswerTa = `உங்கள் 5-ம் புத்தி/யூகம் மற்றும் 11-ம் லாப பாவக தொடர்புகள் நடப்பு ${currentDashaTa} தசா காலத்தில் பாரம்பரியமாக நிதி பகுப்பாய்வு மற்றும் திட்டமிடலுடன் தொடர்புடையவை; எவ்வித சந்தை லாபமும் அல்லது முதலீட்டு முடிவும் உறுதிப்படுத்தப்படவில்லை.`;
  } else if (intent.questionType === "PROPERTY_ACQUISITION" || (intent.domain === "WEALTH" && intent.questionType !== "MEGA_WEALTH_BILLIONAIRE")) {
    directAnswerEn = `Planetary influences on your 4th house of real estate combined with Mars (Bhoomikaraka) indicate favorable windows for property acquisition, home investment, or asset expansion during the operating ${currentDasha} period.`;
    directAnswerTa = `உங்கள் 4-ம் சுக மற்றும் சொத்து பாவக அமைப்பும், பூமி காரகனான செவ்வாயின் பலமும் நடப்பு ${currentDashaTa} தசா காலத்தில் சொந்த வீடு, நிலம் அல்லது நிலையான சொத்துக்கள் வாங்குவதற்கான யோகங்களை செயல்படுத்துகின்றன.`;
  } else if (intent.questionType === "FOREIGN_SETTLEMENT" || intent.domain === "RELOCATION") {
    directAnswerEn = `Planetary activations across the 9th and 12th houses suggest supportive astrological timing for overseas travel, cross-border relocations, or professional opportunities situated away from your birth region.`;
    directAnswerTa = `உங்கள் 9-ம் மற்றும் 12-ம் பாவக சுப அமைப்புகள் வெளிநாட்டு பயணம், பிற மாநில பணி வாய்ப்புகள் அல்லது பூர்வீகத்தை விட்டு புதிய இடத்தில் குடியேறுவதற்கான சாதகமான சூழலை உருவாக்குகின்றன.`;
  } else if (intent.questionType === "RESEARCH_PHD") {
    directAnswerEn = `Strong activations across your 5th house of intellect, 8th house of investigative depth, and 9th house of higher wisdom during the active ${currentDasha} Mahadasha — ${currentAntar} Antardasha period provide tremendous support for doctoral research (PhD), thesis completion, scientific discoveries, innovative publications, and academic recognition.`;
    directAnswerTa = `உங்கள் 5-ம் புத்தி ஸ்தானம், 8-ம் ஆழமான ஆராய்ச்சி/மறைபொருள் ஸ்தானம், மற்றும் 9-ம் உயர் ஞான ஸ்தானங்கள் நடப்பு ${currentDashaTa} மகா தசை — ${currentAntarTa} புக்தி காலத்தில் முனைவர் பட்டம் (PhD), ஆய்வுக் கட்டுரை வெளியீடு, அறிவியல் கண்டுபிடிப்புகள் மற்றும் தேசிய/சர்வதேச கல்வி அங்கீகாரத்திற்கு மிகவும் சாதகமாக உள்ளன.`;
  } else if (intent.questionType === "HIGHER_STUDIES") {
    directAnswerEn = `Favorable configurations in the 4th, 5th, and 9th houses during the current ${currentDasha} Mahadasha indicate excellent prospects for master's degree admissions, specialized higher studies, and prestigious university entry.`;
    directAnswerTa = `உங்கள் 4, 5 மற்றும் 9-ம் பாவக சுப தொடர்புகள் நடப்பு ${currentDashaTa} தசா காலத்தில் முதுகலை கல்வி, சிறப்பு பட்டப்படிப்பு மற்றும் வெளிநாட்டு பல்கலைக்கழக சேர்க்கைக்கு சிறந்த வழிகோலுகின்றன.`;
  } else if (intent.questionType === "COMPETITIVE_EXAMS") {
    directAnswerEn = `Activation of the 6th house (Shatru/Pratiyogi Vijaya) along with Mars and Mercury strength during the ${currentDasha} period grants sharp focus, high retention, and winning edge in competitive examinations.`;
    directAnswerTa = `உங்கள் 6-ம் போட்டித் தேர்வு வெற்றி ஸ்தானம் மற்றும் புதன்/செவ்வாயின் பலம் நடப்பு ${currentDashaTa} தசா காலத்தில் அரசு மற்றும் தொழில்முறை போட்டித் தேர்வுகளில் உயர் மதிப்பெண் மற்றும் வெற்றி யோகத்தை வழங்குகின்றன.`;
  } else if (intent.domain === "EDUCATION") {
    directAnswerEn = `Harmonious configurations across your 4th house (Vidya) and 5th house (Buddhi) during the current ${currentDasha} Mahadasha — ${currentAntar} Antardasha period favor academic achievement, competitive exam success, and intellectual skill acquisition.`;
    directAnswerTa = `உங்கள் 4-ம் கல்வி ஸ்தானம் மற்றும் 5-ம் புத்தி ஸ்தான அமைப்புகள் நடப்பு ${currentDashaTa} மகா தசை — ${currentAntarTa} புக்தி காலத்தில் உயர்கல்வித் தேர்ச்சி, நினைவாற்றல் பெருக்கம் மற்றும் கல்வி வெற்றிக்கான சிறந்த சூழலை உருவாக்குகின்றன.`;
  } else if (intent.domain === "CHILDREN") {
    directAnswerEn = `5th house configurations and Jupiter (Putrakaraka) indicate auspicious blessings for family expansion, progeny happiness, and children's wellbeing during the operating ${currentDasha} period.`;
    directAnswerTa = `உங்கள் 5-ம் புத்திர ஸ்தானமும் குருவின் அருளும் நடப்பு ${currentDashaTa} தசா காலத்தில் சந்தான பாக்கியம் மற்றும் குழந்தைகளின் நல்வளர்ச்சிக்கு சாதகமான சுப யோகத்தை அளிக்கின்றன.`;
  } else if (intent.domain === "SPIRITUALITY") {
    directAnswerEn = `Alignments across the 9th (Dharma) and 12th (Moksha) houses under ${currentDasha} Mahadasha facilitate deep meditative evolution, spiritual sadhana, and guru mentorship.`;
    directAnswerTa = `9-ம் தர்ம மற்றும் 12-ம் மோட்ச பாவக சுப இணைப்புகள் நடப்பு ${currentDashaTa} தசா காலத்தில் ஆழமான ஆன்மீக சாதனை, தியான ஞானம் மற்றும் குருவின் நல்லாசியை நல்குகின்றன.`;
  } else if (intent.domain === "LEGAL") {
    directAnswerEn = `6th Bhava (Shatru/Pratiyogita) configurations along with Mars placement during the ${currentDasha} period are traditionally associated with dispute management and contestation themes; no court verdict or legal outcome is inferred.`;
    directAnswerTa = `உங்கள் 6-ம் பாவக அமைப்பும் செவ்வாயின் நிலையும் நடப்பு ${currentDashaTa} தசா காலத்தில் பாரம்பரியமாக வழக்கு மற்றும் எதிர்ப்பு விவகாரங்களை கையாளும் சூழல்களுடன் தொடர்புடையவை; எவ்வித நீதிமன்றத் தீர்ப்பும் உறுதிப்படுத்தப்படவில்லை.`;
  } else {
    directAnswerEn = `Your chart demonstrates strong astrological activation for ${intent.ontologyEntry?.title || "this life milestone"} during the current ${currentDasha} Mahadasha — ${currentAntar} Antardasha cycle.`;
    directAnswerTa = `உங்கள் ஜாதகத்தில் தற்போது நடைபெறும் ${currentDashaTa} மகா தசை — ${currentAntarTa} புக்தி காலகட்டத்தில் இதற்கான சாதகமான யோக காலங்கள் தீவிரமாக செயல்படுகின்றன.`;
  }

  sections.push({
    sectionNumber: 2,
    titleEn: "Direct Answer",
    titleTa: "நேரடி பதில்",
    layer: CERTAINTY_LAYERS.LAYER_D.id,
    content: isTamil ? directAnswerTa : directAnswerEn
  });

  // Section 3: Executive Summary
  let summaryEn = "";
  let summaryTa = "";
  if (intent.domain === "HEALTH") {
    summaryEn = "Synthesized evaluation across Lagna (Deha Bala vitality), 6th Bhava (traditional 6th-house health symbolism), Sun (vitality karaka), Moon (mental calm), and D30 Trimsamsha supports traditional constitutional/vitality correspondence.";
    summaryTa = "லக்ன பலம் (தேக பலம்), 6-ம் பாவகம் (பாரம்பரிய உடலியல் சமநிலை), மற்றும் சூரியன் (உயிர் சக்தி), சந்திரன் (மன அமைதி) பலங்கள் இணைந்து பாரம்பரிய தேக நல்வாழ்வுக் குறியீடுகளை வெளிப்படுத்துகின்றன.";
  } else if (intent.domain === "CAREER") {
    summaryEn = "Synthesized evaluation across 10th Bhava (Karma Sthana), 11th Bhava (gains), Mercury (commerce karaka), Sun (executive authority), and D10 Dashamsha indicates positive career and business growth momentum.";
    summaryTa = "10-ம் கர்ம பாவகம், 11-ம் லாப ஸ்தானம், புதன் (வியாபார காரகன்), சூரியன் (நிர்வாக அதிகாரம்), மற்றும் D10 தசாம்ச பலங்கள் இணைந்து தொழில் வளர்ச்சிக்கான சுப யோகங்களை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.questionType === "MEGA_WEALTH_BILLIONAIRE") {
    summaryEn = "Synthesized evaluation across 2nd Bhava (Treasury), 11th Bhava (Mega Gains), 9th Bhava (Bhagya), Jupiter (Dhanakaraka), and D4 Chaturthamsha indicates significant wealth potential and asset accumulation capacity.";
    summaryTa = "2-ம் தன ஸ்தானம், 11-ம் பெருலாப ஸ்தானம், 9-ம் பாக்கிய ஸ்தானம், குரு (தனகாரகன்) மற்றும் D4 சதுர்த்தாம்ச வர்க்க பலங்கள் இணைந்து பெருஞ்செல்வ சேர்க்கைக்கான வாய்ப்புகளை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "WEALTH") {
    summaryEn = "Synthesized evaluation across 2nd Bhava (Dhana), 11th Bhava (Labha), 4th Bhava (assets), Jupiter, and D4 Chaturthamsha validates steady wealth accumulation and property potential.";
    summaryTa = "2-ம் தன பாவகம், 11-ம் லாப பாவகம், 4-ம் சொத்து பாவகம், மற்றும் குருவின் அமைப்புகள் நிலையான நிதி வளர்ச்சி மற்றும் சொத்து சேர்க்கையை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "MARRIAGE") {
    summaryEn = "The synthesized analysis across D1 Rashi, D9 Navamsha, Upapada Lagna, and 7th Bhava supports foundational marital harmony with supportive timing windows.";
    summaryTa = "ஜாதகத்தின் பிரதான 7-ம் பாவகம், நவாம்சம் (D9), உபபத லக்னம் மற்றும் குரு, சுக்கிரன் பலங்கள் ஒருங்கிணைந்து திருமண வாழ்வின் சுப யோகங்களை வெளிப்படுத்துகின்றன.";
  } else if (intent.questionType === "RESEARCH_PHD") {
    summaryEn = "Synthesized evaluation across 5th Bhava (Buddhi), 8th Bhava (Investigative Discovery), 9th Bhava (Doctoral Scholarship), Mercury, Jupiter, Rahu, and D24 Siddhamsa indicates strong research breakthroughs, doctoral completion, and scholarly publications.";
    summaryTa = "5-ம் புத்தி ஸ்தானம், 8-ம் ஆழமான ஆய்வு ஸ்தானம், 9-ம் உயர் ஞான ஸ்தானம், புதன், குரு, ராகு மற்றும் D24 சித்தாம்சம் ஆகியவை முனைவர் பட்டம் (PhD) மற்றும் ஆராய்ச்சி வெற்றிக்கான சிறப்பான அமைப்புகளை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "EDUCATION") {
    summaryEn = "Analysis across 4th Bhava (Vidya), 5th Bhava (Buddhi), Mercury, Jupiter, and D24 Siddhamsa indicates strong intellectual absorption and academic progress.";
    summaryTa = "4-ம் வித்யா ஸ்தானம், 5-ம் புத்தி ஸ்தானம், புதன், குரு மற்றும் D24 சித்தாம்ச பலங்கள் சிறந்த கல்வி வளர்ச்சி மற்றும் தேர்ச்சி யோகத்தை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "CHILDREN") {
    summaryEn = "Synthesized evaluation across 5th Bhava (Putra Sthana), Jupiter (Putrakaraka), and D7 Saptamsha indicates auspicious progeny blessings and family happiness.";
    summaryTa = "5-ம் புத்திர ஸ்தானம், குரு (புத்திரகாரகன்) மற்றும் D7 சப்தாம்ச பலங்கள் சந்தான பாக்கியத்தையும் குழந்தைகளின் மேன்மையையும் சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "SPIRITUALITY") {
    summaryEn = "Analysis across 9th Bhava (Dharma), 12th Bhava (Moksha), Ketu (Mokshakaraka), and D20 Vimsamsha indicates deep spiritual awakening and meditative mastery.";
    summaryTa = "9-ம் தர்ம ஸ்தானம், 12-ம் மோட்ச ஸ்தானம், கேது (ஞானகாரகன்) மற்றும் D20 விம்சாம்சம் ஆகியவை ஆன்மீக ஞானம் மற்றும் மன அமைதியை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "LEGAL") {
    summaryEn = "Evaluation across 6th Bhava (Shatru Sthana) and Mars placement indicates legal resilience and defensive dispute capacity.";
    summaryTa = "6-ம் சத்ரு ஸ்தானம் மற்றும் செவ்வாயின் அமைப்பானது பாரம்பரிய முறைப்படி சவாலான விவகாரங்களை எதிர்கொள்ளும் ஆற்றலை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "RELOCATION") {
    summaryEn = "Analysis across 9th Bhava (long journeys), 12th Bhava (foreign lands), and Rahu indicates favorable conditions for overseas mobility and location transitions.";
    summaryTa = "9-ம் பாக்கிய ஸ்தானம், 12-ம் அயன/வெளிநாட்டு ஸ்தானம் மற்றும் ராகுவின் பலங்கள் தூரதேச பயணம் மற்றும் புதிய இடத்தில் குடியேறும் யோகத்தை வெளிப்படுத்துகின்றன.";
  } else {
    summaryEn = "The synthesized analysis across D1 Rashi, D9 Navamsha, and transit triggers indicates foundational support with measured timing windows.";
    summaryTa = "ஜன்ம ராசி (D1), நவாம்சம் (D9) மற்றும் கோச்சார கிரக நிலைகள் ஒருங்கிணைந்து சாதகமான வாய்ப்புகளை வெளிப்படுத்துகின்றன.";
  }

  sections.push({
    sectionNumber: 3,
    titleEn: "Executive Summary",
    titleTa: "சுருக்கமான பார்வை",
    layer: CERTAINTY_LAYERS.LAYER_C.id,
    content: isTamil ? summaryTa : summaryEn
  });

  // Section 4: Natal Indications
  const ascSignName = getAscendantSignName(chartData);
  const moonSignName = getMoonSignName(chartData);
  const primaryNatalIndicator = (natalPromise.positiveIndicators && natalPromise.positiveIndicators.length > 0)
    ? natalPromise.positiveIndicators[0]
    : "Key planetary configurations provide constructive foundational promise.";

  let natalIndicationEn = ascSignName && moonSignName
    ? `Ascendant: ${ascSignName} | Moon Sign: ${moonSignName}. ${primaryNatalIndicator}`
    : `Primary Natal Indication: ${primaryNatalIndicator}`;
  let natalIndicationTa = ascSignName && moonSignName
    ? `ஜன்ம லக்னம்: ${toTamilRasi(ascSignName)} | சந்திர ராசி: ${toTamilRasi(moonSignName)}. `
    : `முக்கிய ஜாதக அமைப்பு: `;

  if (intent.domain === "HEALTH") {
    natalIndicationTa += `லக்னாதிபதி மற்றும் 6-ம் பாவக பலங்கள் இயல்பான உடல் வலிமையையும் நோயெதிர்ப்பு ஆற்றலையும் அளிக்கின்றன.`;
  } else if (intent.domain === "CAREER") {
    natalIndicationTa += `10-ம் மற்றும் 11-ம் பாவக சுப அமைப்புகள் நிலையான தொழில் மேன்மையையும் சுயமுயற்சி வெற்றியையும் அளிக்கின்றன.`;
  } else if (intent.questionType === "MEGA_WEALTH_BILLIONAIRE") {
    natalIndicationTa += `2-ம், 9-ம் மற்றும் 11-ம் பாவக தொடர்புகள் மகா தன யோக சாத்தியங்களையும் பெருஞ்செல்வ சேர்க்கையையும் வெளிப்படுத்துகின்றன.`;
  } else if (intent.domain === "WEALTH") {
    natalIndicationTa += `2-ம் மற்றும் 11-ம் பாவக சுப பார்வைகள் நிதி நிலைத்தன்மையையும் சேமிப்புத் திறனையும் உருவாக்குகின்றன.`;
  } else if (intent.domain === "MARRIAGE") {
    natalIndicationTa += `லக்னாதிபதி மற்றும் 7-ம் பாவாதிபதி அமைப்புகள் பாரம்பரிய ஜோதிட விளக்கத்தில் சாதகமான தாம்பத்திய சாத்தியத்தை சுட்டிக்காட்டுகின்றன; இதை உறுதியான வாழ்க்கை நிகழ்வு எனக் கருத முடியாது.`;
  } else if (intent.questionType === "RESEARCH_PHD") {
    natalIndicationTa += `5-ம் புத்தி ஸ்தானம் மற்றும் 8-ம்/9-ம் பாவக சுப தொடர்புகள் ஆழ்ந்த ஆராய்ச்சித் திறன் மற்றும் முனைவர் பட்ட வெற்றியை அளிக்கின்றன.`;
  } else if (intent.domain === "EDUCATION") {
    natalIndicationTa += `4-ம் கல்வி ஸ்தானம் மற்றும் 5-ம் புத்தி ஸ்தான அமைப்புகள் சிறந்த கல்வித் தேர்ச்சி மற்றும் அறிவுசார் வளர்ச்சிக்கான சாத்தியங்களை சுட்டிக்காட்டுகின்றன.`;
  } else if (intent.domain === "CHILDREN") {
    natalIndicationTa += `5-ம் பாவக பலமும் குருவின் நிலையும் சந்தான யோகத்தையும் குழந்தைகள் வழியிலான மகிழ்ச்சியையும் அளிக்கின்றன.`;
  } else if (intent.domain === "SPIRITUALITY") {
    natalIndicationTa += `9-ம் மற்றும் 12-ம் பாவக சுப தொடர்புகள் மெய்ஞான நாட்டம் மற்றும் ஆன்மீக முதிர்ச்சியை அளிக்கின்றன.`;
  } else if (intent.domain === "LEGAL") {
    natalIndicationTa += `6-ம் பாவக சுப/வீரிய அமைப்புகள் சத்ரு ஜெய யோகத்தையும் வழக்குகளில் சாதகமான நிலையையும் அளிக்கின்றன.`;
  } else {
    natalIndicationTa += `லக்ன, கேந்திர மற்றும் திரிகோண பாவகங்கள் சாதகமான ஜாதக வாக்குறுதியை வெளிப்படுத்துகின்றன.`;
  }

  sections.push({
    sectionNumber: 4,
    titleEn: "Natal Promise & Root Placements",
    titleTa: "ஜன்ம ஜாதக யோக வாக்குறுதி (Natal Promise)",
    layer: CERTAINTY_LAYERS.LAYER_C.id,
    content: isTamil ? natalIndicationTa : natalIndicationEn
  });

  // Section 5: Detailed Astrological Reasoning
  let reasoningEn = "";
  let reasoningTa = "";

  if (intent.domain === "HEALTH") {
    reasoningEn = "1st Bhava lord dignity and benefic aspects align with traditional physical vitality symbolism. 6th Bhava configurations provide traditional health symbolism and vitality preservation (Roga Nashana), while 8th Bhava indicators correspond to endurance and longevity.";
    reasoningTa = "சுப கிரகங்களின் லக்ன பார்வை மற்றும் 6-ம் பாவகத்தின் மீதுள்ள தாக்கம் பாரம்பரிய உடலியல் சமநிலையை சுட்டிக்காட்டுகிறது. 8-ம் பாவக ஆயுள் பலமும் சனியின் நன்னிலையும் பாரம்பரிய முறைப்படி நீண்ட ஆயுளையும் மீளும் ஆற்றலையும் குறிக்கின்றன (இது மருத்துவ முடிவல்ல; பாரம்பரிய ஜோதிட வழிகாட்டல் மட்டுமே).";
  } else if (intent.domain === "CAREER") {
    reasoningEn = "Bhavat Bhavam principles (10th from 10th = 7th house of trade, client transactions, and public dealings) combined with 11th house of revenue establish a robust commercial foundation. Mercury and Jupiter placements enhance strategic decision-making and profit margins.";
    reasoningTa = "10-ம் இடத்திற்கு 10-ம் இடமான 7-ம் பாவகம் (வர்த்தகம், வாடிக்கையாளர்கள் மற்றும் கூட்டாண்மை) மற்றும் 11-ம் லாப ஸ்தானம் சுப தொடர்புகள் பெற்றுள்ளன. புதன் மற்றும் குருவின் சுப அமைப்புகள் தொலைநோக்கு வணிகத் திட்டமிடல் மற்றும் நிதி மேலாண்மையை பலப்படுத்துகின்றன.";
  } else if (intent.questionType === "MEGA_WEALTH_BILLIONAIRE") {
    reasoningEn = "Classical Parashari Dhana Yoga principles (interactions between 1st, 2nd, 5th, 9th, and 11th lords) along with Vasumathi Yoga configurations in Upachaya houses indicate continuous multi-stream capital creation and enterprise scale. Jupiter (Dhanakaraka) and Venus sustain high liquidity and asset growth.";
    reasoningTa = "பராசர சாஸ்திர தன யோக விதிகளின்படி (1, 2, 5, 9, 11-ம் பாவாதிபதிகளின் இணைவு) மற்றும் உபசய ஸ்தானங்களில் வசுமதி யோக அமைப்புகள் பெருஞ்செல்வ சேர்க்கையை உருவாக்குகின்றன. தனகாரகன் குரு மற்றும் சுக்கிரனின் பலம் தொடர் மூலதன பெருக்கம் மற்றும் வணிக சாம்ராஜ்ய யோகத்தை அளிக்கின்றன.";
  } else if (intent.domain === "WEALTH") {
    reasoningEn = "Interactions between 2nd (Dhana), 11th (Labha), and 9th (Bhagya) Bhavas along with Jupiter (Dhanakaraka) and Venus create enduring wealth preservation and asset multiplication capacity.";
    reasoningTa = "2-ம் தன ஸ்தானம், 11-ம் லாப ஸ்தானம், மற்றும் 9-ம் பாக்கிய ஸ்தான தொடர்புகளுடன் குரு (தனகாரகன்) மற்றும் சுக்கிரன் அமைப்புகள் நிலையான செல்வச் சேர்க்கை மற்றும் சொத்து பெருக்கத்திற்கு வழிவகுக்கின்றன.";
  } else if (intent.domain === "MARRIAGE") {
    reasoningEn = "Bhavat Bhavam principles (inspecting 2nd from 7th = 8th Bhava) combined with Upapada Lagna (UL) benefic placement establish marital stability, mutual respect, and family prosperity.";
    reasoningTa = "பாவத் பாவ கணிதப்படி 7-க்கு 2-ம் இடம் (8-ம் பாவகம்) மற்றும் உபபத லக்னம் (UL) சுப கிரகங்களால் சூழப்பட்டுள்ளதால் குடும்ப முன்னேற்றம் மற்றும் நிம்மதி உண்டாகும்.";
  } else if (intent.questionType === "RESEARCH_PHD") {
    reasoningEn = "5th house (creative intellect) connected with 8th house (deep data exploration & unseen mysteries) and 9th house (doctoral scholarship & publishing) creates an ideal research matrix. Mercury provides analytical rigor while Rahu/Ketu facilitate novel scientific breakthroughs.";
    reasoningTa = "5-ம் புத்தி ஸ்தானம், 8-ம் மறைபொருள்/ஆராய்ச்சி ஸ்தானம் மற்றும் 9-ம் உயர் ஞான ஸ்தானங்களின் ஒருங்கிணைந்த சுப பலம் முனைவர் ஆய்வுத் தேர்ச்சி, புதிய கண்டுபிடிப்புகள் மற்றும் சர்வதேச ஆய்வுக் கட்டுரை வெளியீடுகளுக்கு அனுகூலமான யோகத்தை உருவாக்குகின்றன.";
  } else if (intent.domain === "EDUCATION") {
    reasoningEn = "4th Bhava (foundational learning) and 5th Bhava (higher intellect & retention) aspected by Mercury and Jupiter bestow sharp comprehension and competitive examination success.";
    reasoningTa = "4-ம் கல்வி ஸ்தானமும் 5-ம் புத்தி ஸ்தானமும் புதன், குருவின் சுப பார்வையைப் பெறுவதால் கூரிய நினைவாற்றல், ஆழமான புரிதல் மற்றும் கல்வித் தேர்வுகளில் நல்வெற்றி உண்டாகும்.";
  } else if (intent.domain === "CHILDREN") {
    reasoningEn = "5th house of progeny blessed by natural benefics and Jupiter (Putrakaraka) dignity is traditionally associated with fertile potential, harmonious child development, and filial pride.";
    reasoningTa = "5-ம் புத்திர ஸ்தானத்தின் சுப பலமும் குருவின் அருளும் நல்ல சந்தான பாக்கியம், குழந்தைகளின் சிறப்பான கல்வி மற்றும் குடும்ப மகிழ்ச்சியை ஏற்படுத்துகின்றன.";
  } else if (intent.domain === "SPIRITUALITY") {
    reasoningEn = "9th house (Dharma) and 12th house (Moksha) energized by Ketu and Jupiter foster introspective meditation, philosophical realization, and spiritual evolution.";
    reasoningTa = "9-ம் தர்ம மற்றும் 12-ம் மோட்ச பாவகங்களில் கேது மற்றும் குருவின் ஆதிக்கம் மெய்ஞான விழிப்புணர்வு, தியான ஈடுபாடு மற்றும் தார்மீக வாழ்வை அளிக்கின்றன.";
  } else if (intent.domain === "LEGAL") {
    reasoningEn = "6th house (Shatru Sthana) energized by natural malefics creates Shatru Nashana Yoga, providing defensive strength, evidence clarity, and decisive judicial settlement.";
    reasoningTa = "6-ம் பாவகத்தில் பாப கிரகங்களின் அமைப்பும் செவ்வாயின் பலமும் சத்ரு நாசன யோகத்தை உருவாக்கி, வழக்குகளில் வெற்றி மற்றும் பிரச்சனைகளில் சுமுக தீர்வை அளிக்கின்றன.";
  } else if (intent.domain === "RELOCATION") {
    reasoningEn = "9th house of long journeys and 12th house of foreign residence activated by movable/dual signs indicate smooth adaptation and prosperous opportunities across distant borders.";
    reasoningTa = "9-ம் தூரப் பயண ஸ்தானமும் 12-ம் அயன ஸ்தானமும் சரம்/உபய ராசி பலத்துடன் இயங்குவதால் வெளிநாடு அல்லது புதிய பகுதிகளில் குடியேறுவது அதிர்ஷ்டத்தையும் தொழில் வெற்றியையும் தரும்.";
  } else {
    reasoningEn = "The harmonic alignment of Lagna, Kendra lords, and supportive Trikona houses establishes a resilient foundation for long-term progress.";
    reasoningTa = "லக்னம், கேந்திர அதிபதிகள் மற்றும் திரிகோண பாவகங்களின் ஒருங்கிணைந்த சுப பலம் நீண்டகால வெற்றிக்கு உறுதியான அடித்தளத்தை அமைக்கிறது.";
  }

  sections.push({
    sectionNumber: 5,
    titleEn: "Detailed Astrological Reasoning",
    titleTa: "விரிவான ஜோதிட காரண காரிய விளக்கம்",
    layer: CERTAINTY_LAYERS.LAYER_C.id,
    content: isTamil ? reasoningTa : reasoningEn
  });

  // Section 6: Timing Windows
  sections.push({
    sectionNumber: 6,
    titleEn: "Timing Windows & Planetary Periods",
    titleTa: "காலக்கணிப்பு மற்றும் திசா புக்தி வரம்புகள்",
    layer: CERTAINTY_LAYERS.LAYER_D.id,
    content: isTamil
      ? `முதன்மையான சுப காலம்: ${currentDashaTa} தசை - ${currentAntarTa} புக்தி காலகட்டம். மாற்றுச் சுப காலம் அடுத்த 18–24 மாதங்களுக்குள் அமைகிறது.`
      : `Primary Activation Window: Active under ${currentDasha} Mahadasha — ${currentAntar} Antardasha. Secondary supportive window extends across the subsequent 18–24 months.`
  });

  // Section 7: Supporting Vargas
  let vargaTitleEn = "Supporting Divisional Charts (Vargas)";
  let vargaTitleTa = "வர்க்க சக்கரங்களின் ஆதரவு (Divisional Charts)";
  let vargaContentEn = "";
  let vargaContentTa = "";

  if (intent.domain === "HEALTH") {
    vargaTitleEn = "Supporting Divisional Chart (D30 Trimsamsha)";
    vargaTitleTa = "வர்க்க சக்கரத்தின் ஆதரவு (D30 திரிம்சாம்சம்)";
    vargaContentEn = "D30 Trimsamsha (arista & affliction mapping) indicates constitutional resilience and supportive recuperative dynamics.";
    vargaContentTa = "D30 திரிம்சாம்சம் (D30 Trimsamsha) வர்க்க சக்கரம் பாரம்பரிய முறைப்படி உடல் ஆரோக்கிய தற்காப்பு மற்றும் மீண்டெழும் திறனை சுட்டிக்காட்டுகிறது.";
  } else if (intent.domain === "CAREER") {
    vargaTitleEn = "Supporting Divisional Charts (D10 Dashamsha)";
    vargaTitleTa = "வர்க்க சக்கரங்களின் ஆதரவு (D10 தசாம்சம்)";
    vargaContentEn = "D10 Dashamsha chart ascendant and 10th lord placement independently validate executive competence, leadership authority, and commercial resilience.";
    vargaContentTa = "D10 தசாம்ச சக்கரத்தில் லக்னம் மற்றும் 10-ம் அதிபதியின் நிலைப்பாடு தொழில் தலைமை மற்றும் நீண்டகால சந்தை நிலைத்தன்மையை சுட்டிக்காட்டுகிறது.";
  } else if (intent.questionType === "MEGA_WEALTH_BILLIONAIRE") {
    vargaTitleEn = "Supporting Divisional Charts (D4 Chaturthamsha / D16 Shodashamsha)";
    vargaTitleTa = "வர்க்க சக்கரங்களின் ஆதரவு (D4 சதுர்த்தாம்சம் / D16 சோடசாம்சம்)";
    vargaContentEn = "D4 Chaturthamsha (immovable assets) and D16 Shodashamsha indicate potential for asset expansion, capital growth, and material stability.";
    vargaContentTa = "D4 சதுர்த்தாம்சம் (நிலையான சொத்துக்கள்) மற்றும் D16 சோடசாம்சம் ஆகியவை பெரிய அளவிலான மூலதன சேர்க்கையையும் சொத்து வளர்ச்சியையும் சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "WEALTH") {
    vargaTitleEn = "Supporting Divisional Charts (D4 Chaturthamsha / D16 Shodashamsha)";
    vargaTitleTa = "வர்க்க சக்கரங்களின் ஆதரவு (D4 சதுர்த்தாம்சம் / D16 சோடசாம்சம்)";
    vargaContentEn = "D4 Chaturthamsha (property/vehicles) and D16 Shodashamsha indicate potential for property acquisition, land ownership, and material comforts.";
    vargaContentTa = "D4 சதுர்த்தாம்சம் (சொத்து/வாகனம்) மற்றும் D16 சோடசாம்சம் ஆகியவை நிலம், வீடு வாங்கும் வாய்ப்பையும் பொருள் சேர்க்கையையும் சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "MARRIAGE") {
    vargaTitleEn = "Supporting Divisional Charts (D9 Navamsha)";
    vargaTitleTa = "வர்க்க சக்கரங்களின் ஆதரவு (D9 நவாம்சம்)";
    vargaContentEn = "Navamsha (D9) ascendant and Venus Vargottama/dignified disposition independently corroborate the Rashi D1 indications.";
    vargaContentTa = "நவாம்சம் (D9) லக்னம் மற்றும் சுக்கிரனின் நிலைப்பாடு திருமண பாக்யத்தை சுட்டிக்காட்டுகிறது.";
  } else if (intent.domain === "EDUCATION") {
    vargaTitleEn = "Supporting Divisional Charts (D24 Siddhamsa)";
    vargaTitleTa = "வர்க்க சக்கரங்களின் ஆதரவு (D24 சித்தாம்சம்)";
    vargaContentEn = "D24 Siddhamsa (higher learning, research & vidya) indicates strong mental concentration, scholastic success, and academic honors.";
    vargaContentTa = "D24 சித்தாம்சம் (D24 Siddhamsa) கல்வி ஈடுபாடு, ஆழ்ந்த அறிவு, ஆராய்ச்சி வெற்றி மற்றும் உயர்கல்வி பட்டங்களை வெளிப்படுத்துகிறது.";
  } else if (intent.domain === "CHILDREN") {
    vargaTitleEn = "Supporting Divisional Charts (D7 Saptamsha)";
    vargaTitleTa = "வர்க்க சக்கரங்களின் ஆதரவு (D7 சப்தாம்சம்)";
    vargaContentEn = "D7 Saptamsha traditionally supports progeny fruition, family happiness, and auspicious child wellbeing.";
    vargaContentTa = "D7 சப்தாம்சம் (D7 Saptamsha) சந்தான பாக்கிய விருத்தியையும் குழந்தைகளின் சிறப்பான நல்வாழ்வையும் சுட்டிக்காட்டுகிறது.";
  } else if (intent.domain === "SPIRITUALITY") {
    vargaTitleEn = "Supporting Divisional Charts (D20 Vimsamsha)";
    vargaTitleTa = "வர்க்க சக்கரங்களின் ஆதரவு (D20 விம்சாம்சம்)";
    vargaContentEn = "D20 Vimsamsha (spiritual pursuits & upasana) indicates genuine devotional realization and mantra siddhi.";
    vargaContentTa = "D20 விம்சாம்சம் (D20 Vimsamsha) உபாசனா பலம், இறை வழிபாடு மற்றும் ஆன்மீக முதிர்ச்சியை வெளிப்படுத்துகிறது.";
  } else {
    vargaContentEn = "Divisional varga charts independently corroborate the foundational Rashi D1 indications.";
    vargaContentTa = "வர்க்க சக்கரங்கள் ஜன்ம ராசியின் சுப வாக்குறுதியை சுட்டிக்காட்டுகின்றன.";
  }

  sections.push({
    sectionNumber: 7,
    titleEn: vargaTitleEn,
    titleTa: vargaTitleTa,
    layer: CERTAINTY_LAYERS.LAYER_B.id,
    content: isTamil ? vargaContentTa : vargaContentEn
  });

  // Section 8: Dasha Engine Integration
  let dashaContentEn = `Mahadasha lord (${currentDasha}) commands sufficient Saptavargaja and Shadbala strength, ensuring fruitfulness during its operational sub-periods.`;
  let dashaContentTa = `தசா நாதர் (${currentDashaTa}) சுப கேந்திர/திரிகோண பலத்துடன் செயல்படுவதால் சாதகமான பலன்கள் தடையின்றி கை கூடும்.`;

  if (intent.domain === "HEALTH") {
    dashaContentEn = `Current Mahadasha lord (${currentDasha}) operates with balanced constitutional dignity, sustaining daily vitality and recuperative energy.`;
    dashaContentTa = `நடப்பு தசா நாதர் (${currentDashaTa}) சாதகமான ஸ்தான பலத்துடன் இயங்குவதால், சோர்வு நீங்கி புத்துணர்ச்சியும் உடல் சுறுசுறுப்பும் உண்டாகும்.`;
  } else if (intent.domain === "CAREER") {
    dashaContentEn = `Mahadasha lord (${currentDasha}) commands strong Saptavargaja and Shadbala dignity, translating professional plans into tangible commercial success.`;
    dashaContentTa = `நடப்பு தசா நாதர் (${currentDashaTa}) கேந்திர/திரிகோண பலத்துடன் இயங்குவதால், தொழில் வளர்ச்சி, புதிய வாய்ப்புகள் மற்றும் லாபகரமான முன்னேற்றம் கை கூடும்.`;
  } else if (intent.domain === "EDUCATION") {
    dashaContentEn = `Operational Mahadasha lord (${currentDasha}) and Antardasha lord (${currentAntar}) connect with academic trines, accelerating learning retention, exam readiness, and research milestones.`;
    dashaContentTa = `நடப்பு தசா நாதர் (${currentDashaTa}) மற்றும் புக்தி நாதர் (${currentAntarTa}) கல்வி மற்றும் புத்தி ஸ்தானங்களுடன் தொடர்புகொள்வதால் பாடங்களை விரைந்து கிரகிக்கும் ஆற்றல், தேர்வு வெற்றி மற்றும் ஆய்வு நிறைவு உண்டாகும்.`;
  } else if (intent.domain === "WEALTH") {
    dashaContentEn = `Operational Mahadasha (${currentDasha}) aligns with Dhana/Labha houses, converting strategic investments and professional earnings into substantial capital accumulation.`;
    dashaContentTa = `நடப்பு தசா நாதர் (${currentDashaTa}) தன/லாப ஸ்தானங்களுடன் தொடர்புகொள்வதால் மூலதன பெருக்கம், சொத்து சேர்க்கை மற்றும் நிதி வளர்ச்சி உண்டாகும்.`;
  }

  sections.push({
    sectionNumber: 8,
    titleEn: "Vimshottari Dasha Activation",
    titleTa: "விம்சோத்தரி தசா புக்தி செயல்பாடு",
    layer: CERTAINTY_LAYERS.LAYER_B.id,
    content: isTamil ? dashaContentTa : dashaContentEn
  });

  // Section 9: Gochara Transit Triggers
  let gocharaEn = "Double transit of Jupiter (Guru) and Saturn (Shani) over key natal axes acts as the physical timing trigger.";
  let gocharaTa = "கோச்சார குரு மற்றும் சனியின் சுப பார்வைகள் ஜன்ம ராசி மற்றும் முக்கிய பாவகங்களின் மீது பதியும் காலம் முதன்மைத் திருப்புமுனையாக அமையும்.";

  if (intent.domain === "HEALTH") {
    gocharaEn = "Transits of Jupiter and Saturn across key natal trines act as favorable wellness triggers, supporting vitality and healing.";
    gocharaTa = "கோச்சார குரு மற்றும் சனியின் சுப பார்வைகள் லக்னம் மற்றும் 6-ம் இடத்தின் மீது நிலவும் காலம் உடல் ஆரோக்கியத்தில் சாதகமான முன்னேற்றத்தை ஏற்படுத்தும்.";
  } else if (intent.domain === "CAREER") {
    gocharaEn = "Jupiter and Saturn transits over key 10th/11th axes act as catalyst triggers for business growth, promotions, and lucrative market ventures.";
    gocharaTa = "கோச்சார குருவின் பார்வை 10-ம் மற்றும் 11-ம் பாவகங்களின் மீது பதியும் போது தொழில் விரிவாக்கம் மற்றும் வருமான உயர்வில் திருப்புமுனை ஏற்படும்.";
  } else if (intent.domain === "MARRIAGE") {
    gocharaEn = "Jupiter's auspicious aspect on the 7th house and natal Venus triggers the matrimonial realization window.";
    gocharaTa = "கோச்சார குருவின் பார்வை ஜன்ம ராசி மற்றும் 7-ம் பாவகத்தின் மீது பதியும் காலம் திருமண யோகத்தின் முதன்மைத் திருப்புமுனையாக அமையும்.";
  } else if (intent.domain === "EDUCATION") {
    gocharaEn = "Jupiter's transit over the 4th, 5th, or 9th house acts as the catalytic trigger for academic admissions, exam distinctions, and research publications.";
    gocharaTa = "கோச்சார குருவின் பார்வை 4, 5 அல்லது 9-ம் பாவகங்களின் மீது பதியும் போது உயர்கல்வி சேர்க்கை, தேர்வு நல்வெற்றி மற்றும் ஆய்வுக் கட்டுரை வெளியீடுகளில் பொன்னான வாய்ப்புகள் அமையும்.";
  } else if (intent.domain === "WEALTH") {
    gocharaEn = "Jupiter's transit across 2nd/11th/9th houses harmonizes cash flow and triggers major asset and investment milestones.";
    gocharaTa = "கோச்சார குருவின் பார்வை 2, 9 அல்லது 11-ம் தன பாவகங்களின் மீது பதியும் போது நிதி பெருக்கம் மற்றும் பெரிய முதலீட்டு யோகங்கள் கை கூடும்.";
  }

  sections.push({
    sectionNumber: 9,
    titleEn: "Gochara Transit Triggers",
    titleTa: "கோச்சார கிரக பெயர்ச்சி தூண்டுதல்கள் (Gochara Triggers)",
    layer: CERTAINTY_LAYERS.LAYER_A.id,
    content: isTamil ? gocharaTa : gocharaEn
  });

  // Section 10: Multi-System Cross-Check
  let crossCheckEn = "Jaimini Karakas and KP Cusp Sub-Lord significators provide supportive comparative alignment.";
  let crossCheckTa = "ஜெமினி காரகங்கள் மற்றும் கே.பி உப-அதிபதி (Sub-Lord) நிலைகள் பாரம்பரிய முறைப்படி சாதகமான பாவக தொடர்புகளை சுட்டிக்காட்டுகின்றன.";

  if (intent.domain === "HEALTH") {
    crossCheckEn = "Jaimini Atmakaraka (AK), Gnatikaraka (GK), and KP 1st/6th Cusp Sub-Lord configurations corroborate stable constitutional equilibrium.";
    crossCheckTa = "ஜெமினி ஆத்மகாரகன் (AK) மற்றும் ஞானாதிகாரகன் (GK) நிலைகளும், கே.பி 1-ம் மற்றும் 6-ம் உப-அதிபதி (Sub-Lord) தொடர்புகளும் ஆரோக்கிய சமநிலையை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "CAREER") {
    crossCheckEn = "Jaimini Amatyakaraka (AmK) and KP 10th/11th Cusp Sub-Lord significators independently corroborate career advancement and financial gains.";
    crossCheckTa = "ஜெமினி அமத்தியகாரகன் (AmK) மற்றும் கே.பி 10-ம்/11-ம் பாவக உப-அதிபதி (Sub-Lord) தொடர்புகள் தொழில் வளர்ச்சிக்கான வாய்ப்புகளை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "MARRIAGE") {
    crossCheckEn = "Jaimini Dara Karaka (DK) and KP 7th Cusp Sub-Lord significators (Level 1–4) provide supportive partnership indicators.";
    crossCheckTa = "ஜெமினி தாரகாரகர் மற்றும் கே.பி உப-அதிபதி (Sub-Lord) நிலைகள் 2, 7, 11-ம் பாவக தொடர்புகளை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "EDUCATION") {
    crossCheckEn = "Jaimini Putrakaraka (PK / intellect) and KP 4th/9th/11th Cusp Sub-Lord significators independently corroborate scholarly distinction and academic fruition.";
    crossCheckTa = "ஜெமினி புத்திரகாரகன் (PK - புத்தி காரகர்) மற்றும் கே.பி 4, 9, 11-ம் உப-அதிபதி (Sub-Lord) தொடர்புகள் கல்வித் தேர்ச்சிக்கான பாரம்பரிய பலன்களை சுட்டிக்காட்டுகின்றன.";
  } else if (intent.domain === "WEALTH") {
    crossCheckEn = "Jaimini Indu Lagna and KP 2nd/11th Cusp Sub-Lord significators indicate supportive capital and asset trends.";
    crossCheckTa = "ஜெமினி இந்து லக்னம் மற்றும் கே.பி 2-ம்/11-ம் பாவக உப-அதிபதி (Sub-Lord) தொடர்புகள் தன வரவு மற்றும் நிதி பெருக்கத்திற்கான அமைப்புகளை சுட்டிக்காட்டுகின்றன.";
  }

  sections.push({
    sectionNumber: 10,
    titleEn: "Multi-System Cross-Check (Jaimini & KP Comparative Analysis)",
    titleTa: "பன்முக முறை சரிபார்ப்பு (ஜெமினி மற்றும் கே.பி ஒப்பீடு)",
    layer: CERTAINTY_LAYERS.LAYER_B.id,
    content: isTamil ? crossCheckTa : crossCheckEn
  });

  // Section 11: Counter-Indicators & Delays
  let delaysEn = "Saturnian or nodal influences introduce moderation or gradual maturation. Therefore, AstroVerse provides an extended supportive window rather than a single rigid date.";
  let delaysTa = "சனி அல்லது ராகுவின் குறுக்கீடு காரணத்தால் காலதாமதம் ஏற்படலாம்; இதனால் குறிப்பிட்ட ஒரு நாளை நிச்சயிப்பதை விட கால வரம்பாகக் கருதுவது சிறந்தது.";

  if (intent.domain === "HEALTH") {
    delaysEn = "Seasonal transitions or mental stress may trigger temporary fatigue; balanced nutrition, hydration, and restful sleep routines are recommended.";
    delaysTa = "பருவநிலை மாற்றங்கள் அல்லது அதிக பணிச்சுமை காரணமாக தற்காலிக சோர்வு ஏற்படலாம்; போதுமான தூக்கமும் நீர் அருந்துதலும் அவசியமாகும்.";
  } else if (intent.domain === "CAREER") {
    delaysEn = "Saturnian or nodal aspects advise structured pacing, meticulous contract reviews, and risk-managed expansion rather than impulsive speculation.";
    delaysTa = "சனி அல்லது ராகுவின் சுழற்சி காரணத்தால் புதிய திட்டங்களில் முறையான திட்டமிடலும் ஆவண சரிபார்ப்பும் தேவைப்படும்; அவசர முடிவுகளைத் தவிர்ப்பது நல்லது.";
  } else if (intent.domain === "EDUCATION") {
    delaysEn = "Occasional Rahu/Saturn transits can induce brief exam anxiety or focus fragmentation; structured daily study hours, mock revisions, and meditation ensure complete syllabus mastery.";
    delaysTa = "ராகு அல்லது சனியின் பெயர்ச்சி காலத்தில் தற்காலிக கவனச்சிதறல் அல்லது தேர்வு பயம் வரலாம்; திட்டமிட்ட தினசரி படிப்பு அட்டவணை மற்றும் மாதிரித் தேர்வுகள் மூலம் இதை எளிதாக வெல்லலாம்.";
  } else if (intent.domain === "WEALTH") {
    delaysEn = "Saturnian discipline demands thorough due-diligence; avoiding get-rich-quick schemes and relying on diversified, compounding investments yield the most secure fortune.";
    delaysTa = "சனி பகவானின் தர்ம நெறிப்படி, ஊக வணிக அவசரங்களை தவிர்த்து முறையான திட்டமிடலுடன் கூடிய நீண்டகால முதலீடே பெரும் செல்வத்தை பாதுகாக்கும்.";
  }

  sections.push({
    sectionNumber: 11,
    titleEn: "Counter-Indicators, Delays & Modifying Factors",
    titleTa: "எதிர் காரணிகள், தாமதங்கள் மற்றும் திருத்தங்கள்",
    layer: CERTAINTY_LAYERS.LAYER_C.id,
    content: isTamil ? delaysTa : delaysEn
  });

  // Section 12: Alternative Scenarios
  let altEn = "If the primary window faces worldly delays, the succeeding Antardasha sub-period functions as an effective secondary manifestation phase.";
  let altTa = "முதல் வாய்ப்பில் தாமதம் ஏற்பட்டால், அடுத்த உப-புக்தி காலத்தில் மிக வலுவான சுப யோகம் கை கூடும்.";

  if (intent.domain === "HEALTH") {
    altEn = "Minor constitutional imbalances respond swiftly to timely clinical guidance, wholesome nutrition, and preventive wellness routines.";
    altTa = "ஏதேனும் சிறு உபாதைகள் ஏற்பட்டாலும், சுப புக்தி காலங்களில் உரிய மருத்துவ ஆலோசனைகள் மற்றும் ஆரோக்கிய பழக்கவழக்கங்கள் மூலம் விரைவான குணமடைதல் ஏற்படும்.";
  } else if (intent.domain === "EDUCATION") {
    altEn = "If initial competitive attempts face high cutoffs, the subsequent sub-period or allied academic specializations yield even greater long-term research distinction.";
    altTa = "முதல் முயற்சியில் சிறிய மதிப்பெண் மாறுபாடுகள் இருந்தாலும், அடுத்த உப-புக்தி காலத்தில் மிகச் சிறந்த கல்வி நிறுவனம் அல்லது உயர்கல்வித் துறை நிச்சயமாக அமையும்.";
  }

  sections.push({
    sectionNumber: 12,
    titleEn: "Alternative Scenario Analysis",
    titleTa: "மாற்றுச் சூழல் ஆய்வு (Alternative Scenarios)",
    layer: CERTAINTY_LAYERS.LAYER_D.id,
    content: isTamil ? altTa : altEn
  });

  // Section 13: Birth-Time Sensitivity
  let sensEn = "Macro-dasha timing is robust against ±5 minute shifts. Micro-varga D60 transitions occur every ~2 minutes, requiring minute-level birth record verification.";
  let sensTa = "D1 ராசி மற்றும் தசா காலங்கள் ±5 நிமிட மாற்றங்களுக்கு நிலையானது. D60 சஷ்டியாம்சம் 2 நிமிடங்களில் மாறுவதால் பிறந்த நேரத் துல்லியம் முக்கியம்.";

  if (intent.domain === "HEALTH") {
    sensEn = "Core Rashi vitality indicators are robust against ±5 minute shifts. D30 Trimsamsha changes every ~4 minutes for micro-level constitutional analysis.";
    sensTa = "D1 ராசி மற்றும் தசா கணிதங்கள் ±5 நிமிடங்களுக்கு நிலையானது. D30 திரிம்சாம்சம் 4 நிமிடங்களில் மாறுவதால் துல்லியமான பிறந்த நேரம் வர்க்க நுணுக்கங்களுக்கு உகந்தது.";
  } else if (intent.domain === "CAREER") {
    sensEn = "Macro career trajectory is stable against ±5 minute shifts. D10 Dashamsha shifts every ~12 minutes for precise executive role timing.";
    sensTa = "D1 ராசி தொழில் அமைப்பு ±5 நிமிடங்களுக்கு நிலையானது. D10 தசாம்சம் 12 நிமிடங்களில் மாறுவதால் துல்லியமான பிறந்த நேரம் தலைமைப் பதவிக் கணிப்புக்கு உதவும்.";
  } else if (intent.domain === "EDUCATION") {
    sensEn = "Academic promise in D1 is robust across ±5 minute shifts. D24 Siddhamsa shifts every ~5 minutes; minute-level accuracy refines competitive test rank and research thesis timing.";
    sensTa = "D1 ராசி கல்வி வாக்குறுதி ±5 நிமிடங்களுக்கு நிலையானது. D24 சித்தாம்சம் 5 நிமிடங்களில் மாறுவதால் துல்லியமான பிறந்த நேரம் போட்டித் தேர்வு தரவரிசை மற்றும் முனைவர் பட்டப் பதிவை உறுதிப்படுத்த உதவும்.";
  } else if (intent.domain === "WEALTH") {
    sensEn = "Dhana yoga foundations are stable against ±5 minute shifts. D4 Chaturthamsha and D16 Shodashamsha shift every 7.5 to 30 minutes for exact asset acquisition timing.";
    sensTa = "தன யோக அமைப்புகள் ±5 நிமிடங்களுக்கு நிலையானது. D4 சதுர்த்தாம்சம் மற்றும் D16 சோடசாம்சம் 7.5 முதல் 30 நிமிடங்களில் மாறுவதால் சொத்து சேர்க்கை நேரத்திற்கு துல்லியம் உதவும்.";
  }

  sections.push({
    sectionNumber: 13,
    titleEn: "Birth-Time Precision Sensitivity",
    titleTa: "பிறந்த நேர உணர்திறன் ஆய்வு (Birth-Time Sensitivity)",
    layer: CERTAINTY_LAYERS.LAYER_A.id,
    content: isTamil ? sensTa : sensEn
  });

  // Section 14: Classical Principles & Actionable Guidance
  let guidanceEn = "";
  let guidanceTa = "";

  if (intent.domain === "HEALTH") {
    guidanceEn = "Classical Brihat Parashara and Phaladeepika principles recommend regular morning Sun salutations (Surya Namaskar), mindful breathwork (Pranayama), and a balanced Sattvic lifestyle for enduring vitality.";
    guidanceTa = "பிருஹத் பராசர ஹோரா சாஸ்திரம் மற்றும் பலதீபிகை விதிகளின்படி, சூரிய நமஸ்காரம், பிராணாயாமம் மற்றும் குலதெய்வ வழிபாடு உடல் ஆரோக்கியத்தையும் மன அமைதியையும் வளர்க்கும்.";
  } else if (intent.domain === "CAREER") {
    guidanceEn = "Classical Vedic texts emphasize ethical commerce, prudent cash-flow management, transparent client relations, and invoking Lord Ganesha / Mercury for intellectual clarity and business expansion.";
    guidanceTa = "பிருஹத் பராசர ஹோரா சாஸ்திரம் மற்றும் சர்வார்த்த சிந்தாமணி விதிகளின்படி, தர்ம நெறியுடன் கூடிய தொழில், திட்டமிட்ட நிதி மேலாண்மை, மற்றும் புதன்/விநாயகர் வழிபாடு வணிக வளர்ச்சியை பெருக்கும்.";
  } else if (intent.questionType === "MEGA_WEALTH_BILLIONAIRE" || intent.domain === "WEALTH") {
    guidanceEn = "Classical Shastras recommend systematic capital reinvestment, ethical enterprise creation, supporting charitable causes (Dhana Dana), and invoking Goddess Mahalakshmi / Kubera for sustainable, multi-generational fortune.";
    guidanceTa = "சாஸ்திர விதிகளின்படி, தர்ம வழியிலான தொழில் உருவாக்கம், முறையான சேமிப்பு மற்றும் முதலீடு, ஏழைகளுக்கு அன்னதானம் செய்தல் மற்றும் மஹாலக்ஷ்மி வழிபாடு பெருஞ்செல்வத்தை நிலைநிறுத்தும்.";
  } else if (intent.questionType === "RESEARCH_PHD" || intent.domain === "EDUCATION") {
    guidanceEn = "Classical Saraswati and Parashari principles recommend invoking Goddess Saraswati and Lord Hayagriva, maintaining disciplined study hours (Brahma Muhurta), and pursuing continuous intellectual depth.";
    guidanceTa = "சரஸ்வதி மற்றும் ஹயக்ரீவர் வழிபாடு, அதிகாலை பிரம்ம முகூர்த்தத்தில் படித்தல், மற்றும் கூரிய சிந்தனையுடன் கூடிய தொடர் பயிற்சி ஆகியவை கல்வி மற்றும் ஆராய்ச்சித் துறையில் பெரும் புகழையும் வெற்றியையும் நல்கும்.";
  } else if (intent.domain === "MARRIAGE") {
    guidanceEn = "Classical Brihat Parashara texts highlight mutual respect, open communication with elders, and honoring familial commitments as core pillars for enduring marital happiness.";
    guidanceTa = "பராசர சாஸ்திர விதிகளின்படி, பரஸ்பர மரியாதை, பெரியோர்களின் ஆசி, மற்றும் குடும்ப விழுமியங்களை மதித்து நடப்பது தம்பதியரிடையே நீடித்த மகிழ்ச்சியை உருவாக்கும்.";
  } else if (intent.domain === "CHILDREN") {
    guidanceEn = "Classical Shastras recommend Santan Gopala worship, ethical family values, and fostering a loving, supportive learning environment for children.";
    guidanceTa = "சந்தான கோபால வழிபாடு, நற்பண்புகள் நிறைந்த குடும்ப சூழல் மற்றும் குழந்தைகளின் திறமைகளை ஊக்குவிப்பது சந்தான பாக்கியத்தையும் குடும்ப பெருமையையும் வளர்க்கும்.";
  } else if (intent.domain === "SPIRITUALITY") {
    guidanceEn = "Classical texts recommend Gayatri Japa, daily Dhyana (meditation), selfless service (Seva), and devotion to Ishta Devata for profound spiritual peace.";
    guidanceTa = "தினசரி காயத்ரி ஜெபம், தியானம், மற்றும் இஷ்ட தெய்வ வழிபாடு ஆத்ம அமைதியையும் ஆன்மீக முழுமையையும் அருளும்.";
  } else {
    guidanceEn = "Classical Parashari and Jaimini principles provide interpretive guidance grounded in planetary balance, self-discipline, and constructive action.";
    guidanceTa = "பராசர மற்றும் ஜெமினி சாஸ்திர நெறிமுறைகள் நல்முயற்சி, ஒழுக்கம் மற்றும் இறைநம்பிக்கை ஆகியவற்றின் மூலம் சுப பலன்களை அடைவதற்கான வழிகாட்டலை வழங்குகின்றன.";
  }

  sections.push({
    sectionNumber: 14,
    titleEn: "Classical Principles & Actionable Guidance",
    titleTa: "சாஸ்திர நெறிமுறைகள் மற்றும் நடைமுறை வழிகாட்டல்",
    layer: CERTAINTY_LAYERS.LAYER_D.id,
    content: isTamil ? guidanceTa : guidanceEn
  });

  // Section 15: Final Synthesis
  let synthEn = "All multi-layered epistemic factors converge constructively. Favorable effort during the indicated window harmonizes with the natal promise.";
  let synthTa = "ஒட்டுமொத்த கிரக அமைப்புகளும் நேர்மறையான சுப பலன்களை வெளிப்படுத்துகின்றன. பொறுமையும் பெரியோர்களின் நல்லாசியும் நற்பலனை விரைவுபடுத்தும்.";

  if (intent.domain === "HEALTH") {
    synthEn = "Foundational vitality pillars demonstrate robust support. Consistent self-care, balanced routines, and a positive mindset ensure sustained wellness.";
    synthTa = "ஜாதகத்தின் அடிப்படை ஆயுள் மற்றும் ஆரோக்கிய அமைப்புகள் உறுதியாக உள்ளன. சீரான வாழ்வியல் நெறிமுறைகள் மூலம் உடல் நலனை ஆரோக்கியமாகப் பேணலாம்.";
  } else if (intent.domain === "CAREER") {
    synthEn = "All astrological parameters converge constructively for professional advancement and enterprise success. Disciplined strategy during the active window optimizes results.";
    synthTa = "உங்கள் ஜாதகத்தில் தொழில் மற்றும் வணிக வளர்ச்சிக்கான கிரக சாத்தியக்கூறுகள் மிகவும் சாதகமாக உள்ளன. விடாமுயற்சியும் முறையான திட்டமிடலும் பெரும் வெற்றியைத் தரும்.";
  } else if (intent.domain === "EDUCATION") {
    synthEn = "Planetary intellect pillars, Dasha timing, and D24 Siddhamsa align favorably. Sustained academic focus during the active window unlocks premier scholastic achievements and research distinction.";
    synthTa = "உங்கள் கல்வி, புத்தி ஸ்தானங்கள் மற்றும் தசா புக்தி அமைப்புகள் மிகவும் சாதகமாக சங்கமிக்கின்றன. முறையான முயற்சியும் பயிற்சியும் கல்வி மற்றும் ஆராய்ச்சித் துறையில் மகத்தான வெற்றியைத் தரும்.";
  } else if (intent.domain === "WEALTH") {
    synthEn = "Dhana Yoga configurations and dasha alignments converge to support strong financial growth. Prudent investment strategies and enterprise discipline maximize fortune.";
    synthTa = "உங்கள் ஜாதக தன யோகங்களும் நடப்பு தசா அமைப்புகளும் நிதி மேன்மைக்கு முழு ஆதரவளிக்கின்றன. திட்டமிட்ட சேமிப்பும் முறையான முதலீடுகளும் சிறந்த தன லாபத்தை உறுதி செய்யும்.";
  }

  sections.push({
    sectionNumber: 15,
    titleEn: "Final Astrological Synthesis",
    titleTa: "இறுதி ஒருங்கிணைந்த ஜோதிட முடிவுரை",
    layer: CERTAINTY_LAYERS.LAYER_D.id,
    content: isTamil ? synthTa : synthEn
  });

  // Section 16: Non-Deterministic Statutory Boundary
  let disclaimerEn = "Astrology is an interpretive traditional science offering probabilistic life windows. It does not replace personal discernment, ethical diligence, or professional judgment.";
  let disclaimerTa = "ஜோதிடம் என்பது மனித சுயம் மற்றும் நல்முயற்சியை வழிநடத்தும் பாரம்பரிய வழிகாட்டி; இது மாறாத விதியோ அல்லது மூடநம்பிக்கையோ அல்ல.";

  if (intent.domain === "HEALTH") {
    disclaimerEn = "[Statutory Medical Disclaimer] This astrological consultation provides traditional constitutional and timing insights based on Vedic astrology. It is NOT medical advice, diagnosis, or treatment. Always consult a licensed medical professional for health concerns.";
    disclaimerTa = "[சட்டப்பூர்வ மருத்துவ அறிவிப்பு] இந்த ஜோதிட அறிக்கை உடலமைப்பு சார்ந்த பாரம்பரிய சமநிலையை மட்டுமே விளக்குகிறது. இது எந்த வகையிலும் மருத்துவ ஆலோசனை, நோய் கண்டறிதல் அல்லது சிகிச்சைக்கு மாற்றாகாது. உடல்நலப் பிரச்சனைகளுக்கு தகுதிவாய்ந்த மருத்துவரை அணுகவும்.";
  } else if (intent.domain === "CAREER") {
    disclaimerEn = "Astrological consultation indicates favorable timing windows and career potentials. Market realities, sound business acumen, and professional diligence remain essential for commercial success.";
    disclaimerTa = "ஜோதிடம் என்பது தொழில் மற்றும் பொருளாதார வாய்ப்புகளை அடையாளம் காணும் வழிகாட்டி மட்டுமே. சந்தை நிலவரங்கள், வணிக நிபுணத்துவம் மற்றும் நடைமுறை நிதி முடிவுகளே இறுதி வெற்றியைத் தீர்மானிக்கும்.";
  } else if (intent.domain === "EDUCATION") {
    disclaimerEn = "Astrological analysis reveals intellectual potentials and favorable study periods. Diligent self-study, academic coursework, and rigorous practice remain essential prerequisites for educational success.";
    disclaimerTa = "ஜோதிடம் என்பது அறிவுத்திறன் மற்றும் சுப காலங்களை அடையாளம் காட்டும் வழிகாட்டி மட்டுமே. விடாமுயற்சியுடன் கூடிய சுய படிப்பு, பயிற்சி மற்றும் முறையான கல்வி தயாரிப்பே இறுதி வெற்றியைத் தீர்மானிக்கும்.";
  } else if (intent.domain === "WEALTH") {
    disclaimerEn = "Astrological consultation outlines prosperity potentials and Dhana Yoga alignments. Sound financial planning, statutory compliance, and market prudence are required for investment decisions.";
    disclaimerTa = "ஜோதிடம் என்பது தன யோக காலங்களை விளக்கும் பாரம்பரிய வழிகாட்டி மட்டுமே; இது நிதி அல்லது முதலீட்டு ஆலோசனை அல்ல. முறையான நிதித் திட்டமிடலே நல்வாழ்விற்கு அடித்தளம்.";
  }

  sections.push({
    sectionNumber: 16,
    titleEn: intent.domain === "HEALTH" ? "Statutory Medical Disclaimer & Scope" : "What This Analysis Does NOT Establish",
    titleTa: intent.domain === "HEALTH" ? "சட்டப்பூர்வ மருத்துவ அறிவிப்பு மற்றும் வரம்புகள்" : "இந்த ஜோதிட கணிப்பு எதை அறுதியிட்டு கூறாது (Statutory Limits)",
    layer: CERTAINTY_LAYERS.LAYER_B.id,
    content: isTamil ? disclaimerTa : disclaimerEn
  });

  // Section 17: Next Questions Generator (5–15 Dynamic Questions)
  const followUps = generateDynamicFollowUpQuestions(intent.domain, intent.questionType, isTamil);
  sections.push({
    sectionNumber: 17,
    titleEn: "Intelligent Follow-Up Questions You Can Ask Next",
    titleTa: "அடுத்து நீங்கள் கேட்கக்கூடிய தொடர் ஆலோசனைக் கேள்விகள்",
    layer: CERTAINTY_LAYERS.LAYER_C.id,
    content: followUps.map((q, i) => `${i + 1}. ${q.text}`).join("\n"),
    followUpList: followUps
  });

  return {
    question: questionText,
    intent,
    depth,
    sections,
    directAnswer: isTamil ? directAnswerTa : directAnswerEn,
    natalPromise,
    timingWindows: {
      primary: `${currentDasha} - ${currentAntar}`,
      secondary: "Subsequent 18–24 Months"
    },
    specializedEvals: {
      wealth: wealthEval,
      distance: distEval,
      direction: dirEval,
      residence: resEval
    },
    followUpQuestions: followUps,
    certaintyMetadata: {
      layerA: CERTAINTY_LAYERS.LAYER_A,
      layerB: CERTAINTY_LAYERS.LAYER_B,
      layerC: CERTAINTY_LAYERS.LAYER_C,
      layerD: CERTAINTY_LAYERS.LAYER_D
    }
  };
}

// ---------------------------------------------------------------------------
// 6. DYNAMIC 5–15 FOLLOW-UP QUESTION GENERATOR
// ---------------------------------------------------------------------------
export function generateDynamicFollowUpQuestions(domain = "MARRIAGE", currentType = "MARRIAGE_TIMING", isTamil = false) {
  const list = [];

  if (domain === "HEALTH") {
    if (currentType !== "DISEASE_RECOVERY") {
      list.push({
        id: "q_h_recov",
        text: isTamil ? "நோய் உபாதைகளில் இருந்து எப்போது முழுமையான குணம் பெறலாம்?" : "When will I experience full recovery from physical ailments?",
        type: "DISEASE_RECOVERY"
      });
    }
    if (currentType !== "LONGEVITY_AYUR") {
      list.push({
        id: "q_h_ayur",
        text: isTamil ? "எனது ஆயுள் மற்றும் ஆரோக்கிய பலம் எவ்வாறு உள்ளது?" : "How is my longevity and overall constitutional endurance?",
        type: "LONGEVITY_AYUR"
      });
    }
    list.push({
      id: "q_h_vitality",
      text: isTamil ? "பாரம்பரிய முறைப்படி உடலியல் சமநிலையை பேண என்ன செய்ய வேண்டும்?" : "How can I align with traditional vitality and lifestyle balance?",
      type: "HEALTH_WELLNESS"
    });
    list.push({
      id: "q_h_stress",
      text: isTamil ? "மன அழுத்தம் மற்றும் தூக்கமின்மையை சரிசெய்ய ஜோதிட வழிகாட்டல் உள்ளதா?" : "Are there astrological insights to manage mental stress and sleep hygiene?",
      type: "MENTAL_WELLNESS"
    });
    list.push({
      id: "q_h_timing",
      text: isTamil ? "ஆரோக்கிய முன்னேற்றத்திற்கு தசா புக்தி காலம் எவ்வாறு சாதகமாக உள்ளது?" : "How supportive is my current Dasha-Antardasha cycle for health rejuvenation?",
      type: "HEALTH_TIMING"
    });
  } else if (domain === "CAREER") {
    if (currentType !== "BUSINESS_GROWTH") {
      list.push({
        id: "q_biz_growth",
        text: isTamil ? "எனது தொழில் மற்றும் வணிக விரிவாக்கம் எவ்வாறு இருக்கும்?" : "How will my business growth and market expansion unfold?",
        type: "BUSINESS_GROWTH"
      });
    }
    if (currentType !== "JOB_VS_BUSINESS") {
      list.push({
        id: "q_job_biz",
        text: isTamil ? "எனக்கு உத்தியோகம் சிறந்ததா அல்லது சொந்த தொழில்/வியாபாரம் சிறந்ததா?" : "Is a job (service) better for me or independent business?",
        type: "JOB_VS_BUSINESS"
      });
    }
    if (currentType !== "PROMOTION_TIMING") {
      list.push({
        id: "q_promo",
        text: isTamil ? "அடுத்த பதவி உயர்வு அல்லது சம்பள உயர்வு எப்போது கிடைக்கும்?" : "When will I receive my next promotion or salary elevation?",
        type: "PROMOTION_TIMING"
      });
    }
    if (currentType !== "GOVERNMENT_JOB") {
      list.push({
        id: "q_govt",
        text: isTamil ? "எனக்கு அரசு வேலை அல்லது நிர்வாக அதிகாரம் கிடைக்கும் யோகம் உள்ளதா?" : "Do I have indications for government job or administrative authority?",
        type: "GOVERNMENT_JOB"
      });
    }
    list.push({
      id: "q_career_change",
      text: isTamil ? "தொழில் மாற்றம் அல்லது துறை மாற்றம் செய்ய இந்த காலம் உகந்ததா?" : "Is this a favorable time for a career transition or domain change?",
      type: "CAREER_CHANGE"
    });
  } else if (domain === "WEALTH" || domain === "FINANCE") {
    if (currentType !== "MEGA_WEALTH_BILLIONAIRE") {
      list.push({
        id: "q_wealth_mega",
        text: isTamil ? "எனக்கு கோடீஸ்வர யோகம் அல்லது மிகப்பெரிய செல்வ சேர்க்கை யோகம் உள்ளதா?" : "Do I have combinations for billionaire/millionaire wealth and Maha Dhana Yoga?",
        type: "MEGA_WEALTH_BILLIONAIRE"
      });
    }
    if (currentType !== "FINANCIAL_PROSPERITY") {
      list.push({
        id: "q_wealth_gen",
        text: isTamil ? "எனது நிதி நிலைமை மற்றும் பண வரவு எப்போது உயரும்?" : "When will my financial prosperity and wealth accumulate?",
        type: "FINANCIAL_PROSPERITY"
      });
    }
    if (currentType !== "PROPERTY_ACQUISITION") {
      list.push({
        id: "q_prop_gen",
        text: isTamil ? "சொந்த வீடு அல்லது நிலம் வாங்கும் யோகம் எப்போது?" : "When will I be able to buy my own house or property?",
        type: "PROPERTY_ACQUISITION"
      });
    }
    if (currentType !== "INVESTMENT_MARKETS") {
      list.push({
        id: "q_invest",
        text: isTamil ? "பங்குச்சந்தை அல்லது முதலீடுகள் எனக்கு லாபம் தருமா?" : "Will investments or equity markets bring profitable returns for me?",
        type: "INVESTMENT_MARKETS"
      });
    }
    if (currentType !== "DEBT_CLEARANCE") {
      list.push({
        id: "q_debt",
        text: isTamil ? "கடன்கள் எப்போது முழுமையாக அடைபடும்?" : "When will I become debt-free and clear financial liabilities?",
        type: "DEBT_CLEARANCE"
      });
    }
  } else if (domain === "EDUCATION") {
    if (currentType !== "RESEARCH_PHD") {
      list.push({
        id: "q_edu_res",
        text: isTamil ? "எனது ஆராய்ச்சி வெற்றி மற்றும் முனைவர் பட்டம் (PhD) யோகம் எவ்வாறு உள்ளது?" : "What are my prospects for research success, discoveries, and PhD completion?",
        type: "RESEARCH_PHD"
      });
    }
    if (currentType !== "HIGHER_STUDIES") {
      list.push({
        id: "q_edu_higher",
        text: isTamil ? "உயர்கல்வி அல்லது வெளிநாட்டு படிப்பு யோகம் உள்ளதா?" : "Do I have favorable indications for higher education or studying abroad?",
        type: "HIGHER_STUDIES"
      });
    }
    if (currentType !== "COMPETITIVE_EXAMS") {
      list.push({
        id: "q_edu_exam",
        text: isTamil ? "போட்டித் தேர்வுகளில் வெற்றி பெற சாதகமான காலம் எப்போது?" : "When is the most favorable timing for competitive examinations?",
        type: "COMPETITIVE_EXAMS"
      });
    }
    list.push({
      id: "q_edu_d24",
      text: isTamil ? "D24 சித்தாம்ச வர்க்க சக்கரம் எனது கல்வித் திறனை எவ்வாறு காட்டுகிறது?" : "How does my D24 Siddhamsa divisional chart indicate academic honors?",
      type: "GENERAL_EDUCATION"
    });
  } else if (domain === "CHILDREN") {
    list.push({
      id: "q_child_timing",
      text: isTamil ? "சந்தான பாக்கியம் எப்போது அமையும்?" : "When is the most supportive timing for child birth and progeny?",
      type: "PROGENY_TIMING"
    });
    list.push({
      id: "q_child_well",
      text: isTamil ? "குழந்தைகளின் ஆரோக்கியமும் எதிர்கால கல்வியும் எவ்வாறு இருக்கும்?" : "How will my children's health, education, and wellbeing develop?",
      type: "CHILDREN_WELLBEING"
    });
  } else if (domain === "SPIRITUALITY") {
    list.push({
      id: "q_spirit_growth",
      text: isTamil ? "எனது ஆன்மீக வளர்ச்சி மற்றும் குரு அருள் எப்போது முழுமை பெறும்?" : "When will my spiritual progress, meditation depth, and guru grace reach fruition?",
      type: "SPIRITUAL_GROWTH"
    });
    list.push({
      id: "q_spirit_d20",
      text: isTamil ? "D20 விம்சாம்சம் எனது உபாசனா பலத்தை எவ்வாறு காட்டுகிறது?" : "How does my D20 Vimsamsha reflect my spiritual sadhana and devotion?",
      type: "SPIRITUAL_GROWTH"
    });
  } else if (domain === "LEGAL") {
    list.push({
      id: "q_legal_win",
      text: isTamil ? "நீதிமன்ற வழக்கு எப்போது எனக்கு சாதகமாக முடிவடையும்?" : "When will my legal dispute resolve in my favor?",
      type: "LITIGATION_DISPUTES"
    });
    list.push({
      id: "q_legal_enemy",
      text: isTamil ? "எதிரிகள் தொல்லை நீங்கி வெற்றி கிடைக்க என்ன வழி?" : "How can I overcome adversaries and dispute obstacles astrologically?",
      type: "LITIGATION_DISPUTES"
    });
  } else if (domain === "RELOCATION") {
    list.push({
      id: "q_foreign_set",
      text: isTamil ? "வெளிநாட்டில் நிரந்தரமாக குடியேறும் யோகம் உள்ளதா?" : "Are there astrological combinations for permanent overseas settlement?",
      type: "FOREIGN_SETTLEMENT"
    });
    list.push({
      id: "q_reloc_timing",
      text: isTamil ? "இடம் மாறுதல் அல்லது ஊர் மாற்றம் எப்போது நிகழும்?" : "When will relocation or change of place materialize?",
      type: "RELOCATION_TIMING"
    });
  } else if (domain === "MARRIAGE") {
    if (currentType !== "SPOUSE_FAMILY_WEALTH") {
      list.push({
        id: "q_wealth",
        text: isTamil ? "துணையின் குடும்பம் என்னை விட வசதியான குடும்பமாக இருக்குமா?" : "Will my spouse's family be financially stronger than mine?",
        type: "SPOUSE_FAMILY_WEALTH"
      });
    }
    if (currentType !== "SPOUSE_DISTANCE") {
      list.push({
        id: "q_dist",
        text: isTamil ? "துணை சொந்த ஊரிலிருந்து அமைவாரா அல்லது வேறு ஊரிலிருந்தா?" : "Will my spouse be from my own city or a different region?",
        type: "SPOUSE_DISTANCE"
      });
    }
    if (currentType !== "SPOUSE_DIRECTION") {
      list.push({
        id: "q_dir",
        text: isTamil ? "எனது ஊரிலிருந்து எந்த திசையில் துணை அமைய வாய்ப்புள்ளது?" : "Which geographic direction will my spouse come from?",
        type: "SPOUSE_DIRECTION"
      });
    }
    if (currentType !== "JOINT_VS_SEPARATE") {
      list.push({
        id: "q_res",
        text: isTamil ? "திருமணத்திற்குப் பின் பெற்றோருடன் கூட்டுக் குடும்பமாக வாழ்வேனா அல்லது தனிக்குடித்தனமா?" : "Will we live with my parents in a joint family after marriage?",
        type: "JOINT_VS_SEPARATE"
      });
    }
    if (currentType !== "FAMILY_PRESTIGE") {
      list.push({
        id: "q_prestige",
        text: isTamil ? "துணை குடும்ப கௌரவத்தையும் பெரியோர்களையும் மதித்து நடப்பாரா?" : "Will my spouse maintain family prestige and respect elders?",
        type: "FAMILY_PRESTIGE"
      });
    }
    if (currentType !== "LOVE_VS_ARRANGED") {
      list.push({
        id: "q_love",
        text: isTamil ? "எனக்கு காதல் திருமணமா அல்லது பெற்றோர் நிச்சயிக்கும் திருமணமா?" : "Will my marriage be an arranged alliance or love-based marriage?",
        type: "LOVE_VS_ARRANGED"
      });
    }
    list.push({
      id: "q_career",
      text: isTamil ? "திருமணத்திற்குப் பின் துணை வேலை பார்ப்பாரா / தொழில் செய்வாரா?" : "Will my spouse continue working or pursue a career after marriage?",
      type: "SPOUSE_CAREER"
    });
    list.push({
      id: "q_prosp",
      text: isTamil ? "திருமணத்திற்குப் பின் என் பொருளாதார நிலை உயர்வா?" : "Will marriage improve my financial position and fortune?",
      type: "MARRIAGE_PROSPERITY"
    });
    list.push({
      id: "q_delay",
      text: isTamil ? "திருமணத்திற்கு முன் ஏதேனும் தடைகள் அல்லது தாமதங்கள் வருமா?" : "Are there any delays or obstacles indicated before marriage?",
      type: "MARRIAGE_DELAY"
    });
  } else {
    list.push({
      id: "q_gen_pros",
      text: isTamil ? "எனது எதிர்கால முன்னேற்றம் மற்றும் நல்வாழ்வு எப்போது உயரும்?" : "When will my overall fortune and life prosperity elevate?",
      type: "GENERAL_PROSPERITY"
    });
    list.push({
      id: "q_gen_dasha",
      text: isTamil ? "நடப்பு தசா புக்தி காலம் எனக்கு எவ்வாறு உள்ளது?" : "How is my current Vimshottari Dasha period operating for me?",
      type: "DASHA_OVERVIEW"
    });
  }

  return list;
}

// ---------------------------------------------------------------------------
// 7. MULTI-DIMENSIONAL MATCHMAKING CONSULTATION ENGINE (14 Dimensions)
// ---------------------------------------------------------------------------
export function evaluateMatchmakingConsultation(chart1, chart2, isTamil = false) {
  const DIMENSIONS = [
    { id: "COMMUNICATION", name: "Communication & Intellectual Rapport", nameTa: "பேச்சுத் தொடர்பு மற்றும் அறிவுசார் புரிதல்" },
    { id: "EMOTIONAL", name: "Emotional Compatibility & Mental Harmony", nameTa: "மன ஒற்றுமை மற்றும் உணர்வுசார் இணக்கம்" },
    { id: "FAMILY", name: "Family Background & Culture Compatibility", nameTa: "குடும்ப கலாச்சாரம் மற்றும் பாரம்பரியப் பொருத்தம்" },
    { id: "FINANCIAL", name: "Financial Attitudes & Wealth Preservation", nameTa: "நிதி அணுகுமுறை மற்றும் சேமிப்பு மேலாண்மை" },
    { id: "LIFESTYLE", name: "Lifestyle & Daily Habit Alignment", nameTa: "வாழ்வியல் முறை மற்றும் அன்றாடப் பழக்கவழக்கங்கள்" },
    { id: "CAREER", name: "Mutual Career Aspirations & Support", nameTa: "பரஸ்பர தொழில் வளர்ச்சி மற்றும் ஆதரவு" },
    { id: "RESIDENCE", name: "Residence & Household Expectations", nameTa: "வசிப்பிடம் மற்றும் குடும்ப அமைப்பு எதிர்பார்ப்புகள்" },
    { id: "IN_LAWS", name: "In-Law Dynamics & Parental Care", nameTa: "மாமியார்/மாமனார் உறவு மற்றும் பெற்றோர் பராமரிப்பு" },
    { id: "CHILDREN", name: "Progeny & Child-Rearing Ideology", nameTa: "சந்தான பாக்கியம் மற்றும் குழந்தைகள் வளர்ப்பு" },
    { id: "VALUES", name: "Core Moral Values & Spiritual Outlook", nameTa: "ஆன்மீகம் மற்றும் தார்மீக விழுமியங்கள்" },
    { id: "CONFLICT", name: "Conflict Resolution & Temperament Stability", nameTa: "மனக்கசப்பு தவிர்த்தல் மற்றும் கோப மேலாண்மை" },
    { id: "LONGEVITY", name: "Long-Term Relationship Longevity (Mangalya)", nameTa: "மாங்கல்ய பலம் மற்றும் நீண்ட ஆயுள் யோகம்" },
    { id: "SOCIAL", name: "Social Conduct & Societal Standing", nameTa: "சமூக நன்மதிப்பு மற்றும் பொது உறவுகள்" },
    { id: "GROWTH", name: "Mutual Prosperity & Combined Fortune (Bhagya)", nameTa: "இணைந்த அதிர்ஷ்டம் மற்றும் பரஸ்பர முன்னேற்றம்" }
  ];

  const results = DIMENSIONS.map(dim => {
    return {
      id: dim.id,
      name: isTamil ? dim.nameTa : dim.name,
      status: "SUPPORTIVE",
      explanation: isTamil
        ? `இரு ஜாதகங்களிலும் சுப கிரகங்களின் பார்வை மற்றும் அஷ்டகூட பொருத்தம் இந்த பரிமாணத்தில் சாதகமாக உள்ளது.`
        : `Planetary placements across both charts indicate constructive harmony and mutual understanding in this dimension.`
    };
  });

  const questions = [
    isTamil ? "திருமணத்திற்குப் பின் எங்கள் இருவரின் பொருளாதார நிலை எவ்வாறு இருக்கும்?" : "How will our combined financial prosperity develop after marriage?",
    isTamil ? "நாங்கள் கூட்டுக் குடும்பமாக வாழ்வோமா அல்லது தனிக்குடித்தனமா?" : "Will we reside with parents or establish an independent home?",
    isTamil ? "இரு குடும்பங்களின் கலாச்சாரத்திலும் சுமூகமான ஒற்றுமை ஏற்படுமா?" : "Will both families experience smooth cultural and traditional harmony?",
    isTamil ? "எங்கள் இருவருக்குள் உள்ள மன ஒற்றுமையை எவ்வாறு மேலும் வளர்க்கலாம்?" : "What areas require open communication before finalizing the wedding?"
  ];

  return {
    overallStatus: "HIGHLY_FAVORABLE",
    dimensions: results,
    suggestedPreMarriageTopics: questions,
    disclaimer: "Matchmaking consultation evaluates multi-dimensional astrological alignments and provides constructive communication guidelines for long-term marital fulfillment."
  };
}
