import { NAKSHATRAS, ZODIAC_SIGNS, NAKSHATRA_PADA_SYLLABLES } from "./astroEngine.js";
import { calculateChartBySystem } from "../astrology/index.js";
import { calculateNumerology } from "./numerologyEngine.js";
import { getSessionToken, ensureSessionToken } from "./aiAstrologyService.js";
import { apiFetch } from "./apiClient.js";
import { toTamilRasi } from "./tamilAstrologyUtils.js";

export { NAKSHATRA_PADA_SYLLABLES };

// Chaldean letter values for name numerology
export const CHALDEAN_VALUES = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8
};

export function calculateNameNumber(nameWithInitial) {
  const clean = (nameWithInitial || "").toUpperCase().replace(/[^A-Z]/g, "");
  let compound = 0;
  for (const char of clean) {
    compound += CHALDEAN_VALUES[char] || 0;
  }
  let single = compound;
  while (single > 9 && single !== 11 && single !== 22 && single !== 33) {
    single = single.toString().split("").reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  let root = single;
  if (root > 9) {
    root = root.toString().split("").reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return { compound, single: root, masterNumber: single > 9 ? single : null };
}

// Classical Chaldean Compound Number Meanings & Traditional Associations
export const CHALDEAN_COMPOUND_MEANINGS = {
  10: {
    title: "Wheel of Fortune",
    titleTa: "யோகச் சக்கரம்",
    blessing: "Traditionally associated with honor, self-confidence, and progressive success in endeavors.",
    blessingTa: "பாரம்பரியமாக கௌரவம், தன்னம்பிக்கை மற்றும் தொடர் முயற்சிகளில் வெற்றியுடன் தொடர்புடையது."
  },
  14: {
    title: "Movement & Magnetic Eloquence",
    titleTa: "சொல்வளமும் வணிக வெற்றியும்",
    blessing: "Traditionally associated with communicative versatility, commercial acumen, and adaptable progress.",
    blessingTa: "பாரம்பரியமாக கூர்மையான புத்தி, வணிகத் திறன் மற்றும் விரைவான முன்னேற்றத்துடன் தொடர்புடையது."
  },
  15: {
    title: "The Magician (Venusian Charisma)",
    titleTa: "சுக்கிரனின் வசீகர யோகம்",
    blessing: "Traditionally associated with artistic talent, personal charm, social warmth, and prosperity.",
    blessingTa: "பாரம்பரியமாக கலை ஆர்வம், வசீகர ஆளுமை, சமூக நன்மதிப்பு மற்றும் சுப யோகத்துடன் தொடர்புடையது."
  },
  19: {
    title: "The Prince of Heaven (Surya Tejas)",
    titleTa: "சூரிய தேஜஸ் யோகம்",
    blessing: "Traditionally associated with vitality, honorable standing, confidence, and resilience.",
    blessingTa: "பாரம்பரியமாக சூரிய பலம், உயர்ந்த அந்தஸ்து, மன உறுதி மற்றும் நற்புகழுடன் தொடர்புடையது."
  },
  20: {
    title: "The Awakening",
    titleTa: "விழிப்புணர்வு யோகம்",
    blessing: "Traditionally associated with introspective wisdom, intuition, and higher ethical purpose.",
    blessingTa: "பாரம்பரியமாக ஆன்மீக விழிப்புணர்வு, தீர்க்கமான உள்ளுணர்வு மற்றும் சீரிய சிந்தனையுடன் தொடர்புடையது."
  },
  21: {
    title: "The Crown of the Magi",
    titleTa: "வெற்றி மகுட யோகம்",
    blessing: "Traditionally associated with dedicated perseverance, steady achievements, and enduring legacy.",
    blessingTa: "பாரம்பரியமாக விடாமுயற்சி, படிப்படியான முன்னேற்றம் மற்றும் நீடித்த ஆளுமையுடன் தொடர்புடையது."
  },
  23: {
    title: "The Royal Star of the Lion",
    titleTa: "ராஜ சிம்ம யோகம்",
    blessing: "Traditionally associated with executive capability, respect from peers, and leadership vitality.",
    blessingTa: "பாரம்பரியமாக தலைமைப் பண்பு, கம்பீரமான ஆளுமை மற்றும் மக்கள் செல்வாக்குடன் தொடர்புடையது."
  },
  24: {
    title: "Fortunate Alliances",
    titleTa: "சுப பாக்கிய யோகம்",
    blessing: "Traditionally associated with supportive partnerships, domestic harmony, and steady progress.",
    blessingTa: "பாரம்பரியமாக நல்ல நட்பு, பெரியோரின் வழிகாட்டல் மற்றும் குடும்ப அமைதியுடன் தொடர்புடையது."
  },
  27: {
    title: "The Sceptre of Power",
    titleTa: "செங்கோல் ஆதிக்க யோகம்",
    blessing: "Traditionally associated with willpower, executive focus, fortitude, and decisiveness.",
    blessingTa: "பாரம்பரியமாக உறுதியான மனோபலம், நிர்வாக ஆளுமை மற்றும் தைரியத்துடன் தொடர்புடையது."
  },
  32: {
    title: "Strategic Wisdom & Influence",
    titleTa: "ராஜ தந்திர யோகம்",
    blessing: "Traditionally associated with collaborative talent, social goodwill, and persuasive expression.",
    blessingTa: "பாரம்பரியமாக மக்கள் செல்வாக்கு, ஆக்கப்பூர்வ பேச்சுத்திறன் மற்றும் சுப வளர்ச்சியுடன் தொடர்புடையது."
  },
  33: {
    title: "The Master Teacher (Brahma Yoga)",
    titleTa: "பிரம்ம ஞான யோகம்",
    blessing: "Traditionally associated with intellectual generosity, philosophical inclination, and mentorship.",
    blessingTa: "பாரம்பரியமாக ஞானம், அறநெறி, வழிகாட்டும் திறன் மற்றும் உயர்ந்த சமூக மதிப்புடன் தொடர்புடையது."
  },
  37: {
    title: "Golden Harmony & Good Fortune",
    titleTa: "சுவர்ண யோகம்",
    blessing: "Traditionally associated with balanced financial growth, domestic harmony, and fortunate alliances.",
    blessingTa: "பாரம்பரியமாக சமநிலையான வளர்ச்சி, அமைதியான இல்லறம் மற்றும் சுப வாய்ப்புகளுடன் தொடர்புடையது."
  },
  41: {
    title: "The Victorious Commander",
    titleTa: "வெற்றி தளபதி யோகம்",
    blessing: "Traditionally associated with enterprise leadership, competitive stamina, and organizational rank.",
    blessingTa: "பாரம்பரியமாக நிர்வாக யோகம், போட்டிகளை எதிர்கொள்ளும் திறன் மற்றும் பொறுப்புணர்வுடன் தொடர்புடையது."
  },
  42: {
    title: "Graceful Nobility",
    titleTa: "மங்கள யோகம்",
    blessing: "Traditionally associated with cultural refinement, peaceful disposition, and communal goodwill.",
    blessingTa: "பாரம்பரியமாக கலை ஆர்வம், மன அமைதி, உயரிய நற்குணம் மற்றும் நற்பெயருடன் தொடர்புடையது."
  },
  45: {
    title: "High Administrative Authority",
    titleTa: "நிர்வாக சக்ரவர்த்தி யோகம்",
    blessing: "Traditionally associated with administrative capability, public standing, and broad influence.",
    blessingTa: "பாரம்பரியமாக நிர்வாகத் திறன், பொது மரியாதை மற்றும் சுப யோகத்துடன் தொடர்புடையது."
  },
  46: {
    title: "Radiant Prosperity & Splendor",
    titleTa: "ஐஸ்வர்ய யோகம்",
    blessing: "Traditionally associated with commercial diligence, comfortable lifestyle, and steady material well-being.",
    blessingTa: "பாரம்பரியமாக தொழில் மேன்மை, வசதியான வாழ்க்கை மற்றும் நீடித்த சுப அமைதியுடன் தொடர்புடையது."
  },
  50: {
    title: "Dynamic Intelligence & Expansion",
    titleTa: "புத்தி பிரகாச யோகம்",
    blessing: "Traditionally associated with adaptable intellect, communicative skill, and rapid professional learning.",
    blessingTa: "பாரம்பரியமாக பன்முக அறிவாற்றல், வேகமான தொழில் முன்னேற்றம் மற்றும் சொல்வன்மையுடன் தொடர்புடையது."
  },
  51: {
    title: "The Sovereign Warrior",
    titleTa: "வீர சாம்ராஜ்ய யோகம்",
    blessing: "Traditionally associated with energetic enterprise, courage, and decisive leadership.",
    blessingTa: "பாரம்பரியமாக அஞ்சா நெஞ்சம், தளபதி யோகம் மற்றும் உற்சாகமான தலைமையுடன் தொடர்புடையது."
  }
};

// Planetary number rulers and harmonic relations
export const PLANET_NUMEROLOGY = {
  Sun: { number: 1, tamil: "சூரியன்", friends: [1, 2, 3, 5, 9], qualities: "Vitality, Leadership & Willpower" },
  Moon: { number: 2, tamil: "சந்திரன்", friends: [1, 2, 3, 5, 7], qualities: "Intuition, Tranquility & Emotional Grace" },
  Jupiter: { number: 3, tamil: "குரு", friends: [1, 2, 3, 9, 5], qualities: "Higher Wisdom, Morality & Divine Grace" },
  Rahu: { number: 4, tamil: "ராகு", friends: [1, 5, 6, 8], qualities: "Innovation, Strategic Vision & Broad Perspective" },
  Mercury: { number: 5, tamil: "புதன்", friends: [1, 5, 6, 2, 3], qualities: "Intellect, Speech, Commerce & Adaptability" },
  Venus: { number: 6, tamil: "சுக்கிரன்", friends: [1, 5, 6, 8, 9], qualities: "Art, Luxury, Magnetic Charm & Harmony" },
  Ketu: { number: 7, tamil: "கேது", friends: [1, 2, 7, 5], qualities: "Deep Insight, Spiritual Mastery & Focus" },
  Saturn: { number: 8, tamil: "சனி", friends: [3, 5, 6, 8], qualities: "Discipline, Endurance & Lasting Foundation" },
  Mars: { number: 9, tamil: "செவ்வாய்", friends: [1, 2, 3, 5, 9], qualities: "Courage, Valor, Energy & Protection" }
};

// Comprehensive, authentic 108-pada database covering EVERY single Pada of all 27 stars
const RAW_NAME_CATALOG = [
  // 1. Ashwini: Chu, Che, Cho, La
  { name: "Chulak", nameTa: "சூளக்", gender: "boy", syllable: "Chu", syllableTa: "சு", meaning: "Splendid brilliance, radiant beacon", meaningTa: "பிரகாசமான ஒளிச்சுடர்", nakshatra: "Ashwini", pada: 1 },
  { name: "Chunmun", nameTa: "சுன்முன்", gender: "girl", syllable: "Chu", syllableTa: "சு", meaning: "Sweet joyful nature", meaningTa: "இனிமையான மகிழ்ச்சி", nakshatra: "Ashwini", pada: 1 },
  { name: "Chudamani", nameTa: "சூடாமணி", gender: "unisex", syllable: "Chu", syllableTa: "சு", meaning: "Crest jewel of wisdom and divinity", meaningTa: "தலைசிறந்த மாணிக்கம், ஞான மணி", nakshatra: "Ashwini", pada: 1 },
  { name: "Chetan", nameTa: "சேத்தன்", gender: "boy", syllable: "Che", syllableTa: "சே", meaning: "Pure consciousness, spiritual vitality", meaningTa: "உணர்வு, பிராண பலம்", nakshatra: "Ashwini", pada: 2 },
  { name: "Chetana", nameTa: "சேத்தனா", gender: "girl", syllable: "Che", syllableTa: "சே", meaning: "Awakened intellect, supreme awareness", meaningTa: "விழிப்புணர்வு, ஞானம்", nakshatra: "Ashwini", pada: 2 },
  { name: "Chezhiyan", nameTa: "செழியன்", gender: "boy", syllable: "Che", syllableTa: "சே", meaning: "Prosperous sovereign, fertile king", meaningTa: "வளமை மிக்க அரசன்", nakshatra: "Ashwini", pada: 2 },
  { name: "Chola", nameTa: "சோழா", gender: "boy", syllable: "Cho", syllableTa: "சோ", meaning: "Noble king of valor and glory", meaningTa: "சோழ மன்னன், மாண்புமிகு வீரம்", nakshatra: "Ashwini", pada: 3 },
  { name: "Chokalingam", nameTa: "சொக்கலிங்கம்", gender: "boy", syllable: "Cho", syllableTa: "சோ", meaning: "Pure golden Lord Shiva of Madurai", meaningTa: "மதுரை சொக்கநாதர், தூய பொன் வடிவம்", nakshatra: "Ashwini", pada: 3 },
  { name: "Chooda", nameTa: "சூடா", gender: "girl", syllable: "Cho", syllableTa: "சோ", meaning: "Sacred jewel, auspicious radiance", meaningTa: "மங்கள ஜோதி", nakshatra: "Ashwini", pada: 3 },
  { name: "Lakshman", nameTa: "லக்ஷ்மண்", gender: "boy", syllable: "La", syllableTa: "ல", meaning: "Auspicious marks, devoted warrior brother", meaningTa: "சுப லக்ஷணம், பக்தியுள்ள மாவீரன்", nakshatra: "Ashwini", pada: 4 },
  { name: "Lavanya", nameTa: "லாவண்யா", gender: "girl", syllable: "La", syllableTa: "ல", meaning: "Graceful elegance, divine charm", meaningTa: "அழகிய வசீகரம், நளினம்", nakshatra: "Ashwini", pada: 4 },
  { name: "Lalit", nameTa: "லலித்", gender: "boy", syllable: "La", syllableTa: "ல", meaning: "Charming, handsome, refined grace", meaningTa: "அழகானவன், நற்குணம் உடையவன்", nakshatra: "Ashwini", pada: 4 },
  { name: "Lalitha", nameTa: "லலிதா", gender: "girl", syllable: "La", syllableTa: "ல", meaning: "Goddess of cosmic beauty and playfulness", meaningTa: "லலிதா திரிபுரசுந்தரி, அழகுத் தெய்வம்", nakshatra: "Ashwini", pada: 4 },

  // 2. Bharani: Lee, Lu, Le, Lo
  { name: "Leeladhar", nameTa: "லீலாதர்", gender: "boy", syllable: "Lee", syllableTa: "லீ", meaning: "Lord Krishna, creator of cosmic play", meaningTa: "மாய லீலைகள் புரியும் கிருஷ்ணர்", nakshatra: "Bharani", pada: 1 },
  { name: "Leela", nameTa: "லீலா", gender: "girl", syllable: "Lee", syllableTa: "லீ", meaning: "Divine cosmic play and charm", meaningTa: "தெய்வீக திருவிளையாடல்", nakshatra: "Bharani", pada: 1 },
  { name: "Leena", nameTa: "லீனா", gender: "girl", syllable: "Lee", syllableTa: "லீ", meaning: "Gentle devotion, graceful harmony", meaningTa: "பக்தி, மென்மை", nakshatra: "Bharani", pada: 1 },
  { name: "Luv", nameTa: "லவ்", gender: "boy", syllable: "Lu", syllableTa: "லூ", meaning: "Son of Lord Rama, hero of valor", meaningTa: "ஸ்ரீ ராமரின் மைந்தன், வீரன்", nakshatra: "Bharani", pada: 2 },
  { name: "Luhit", nameTa: "லுஹித்", gender: "boy", syllable: "Lu", syllableTa: "லூ", meaning: "Red river of dawn, auspicious flow", meaningTa: "செந்நிற பிரவாகம்", nakshatra: "Bharani", pada: 2 },
  { name: "Lekha", nameTa: "லேகா", gender: "girl", syllable: "Le", syllableTa: "லே", meaning: "Sacred writing, divine crest line", meaningTa: "புனித எழுத்து, கலைக்கோடி", nakshatra: "Bharani", pada: 3 },
  { name: "Lekhan", nameTa: "லேகன்", gender: "boy", syllable: "Le", syllableTa: "லே", meaning: "Scholar, master of words", meaningTa: "கல்விமான், எழுத்தாளர்", nakshatra: "Bharani", pada: 3 },
  { name: "Lohith", nameTa: "லோஹித்", gender: "boy", syllable: "Lo", syllableTa: "லோ", meaning: "Red ruby, Lord Shiva / Mars strength", meaningTa: "செந்நிற ரத்தினம், சிவபெருமான்", nakshatra: "Bharani", pada: 4 },
  { name: "Lokesh", nameTa: "லோகேஷ்", gender: "boy", syllable: "Lo", syllableTa: "லோ", meaning: "Sovereign ruler of all worlds", meaningTa: "அகிலத்தின் அதிபதி", nakshatra: "Bharani", pada: 4 },
  { name: "Lokita", nameTa: "லோகிதா", gender: "girl", syllable: "Lo", syllableTa: "லோ", meaning: "Enlightened observer of the cosmos", meaningTa: "உலகை நோக்கும் ஞானப் பார்வை", nakshatra: "Bharani", pada: 4 },

  // 3. Krittika: A, Ee, U, Ea
  { name: "Aarav", nameTa: "ஆரவ்", gender: "boy", syllable: "A", syllableTa: "அ", meaning: "Peaceful wisdom, harmonious melody", meaningTa: "அமைதியானவன், இனிய ராகம்", nakshatra: "Krittika", pada: 1 },
  { name: "Advik", nameTa: "அத்விக்", gender: "boy", syllable: "A", syllableTa: "அ", meaning: "Unique, matchless soul", meaningTa: "தனித்துவமானவன், ஈடு இணையற்றவன்", nakshatra: "Krittika", pada: 1 },
  { name: "Ananya", nameTa: "அனன்யா", gender: "girl", syllable: "A", syllableTa: "அ", meaning: "Unmatched beauty, Goddess Parvati", meaningTa: "ஒப்பற்றவள், அன்னை பார்வதி", nakshatra: "Krittika", pada: 1 },
  { name: "Arjun", nameTa: "அர்ஜுன்", gender: "boy", syllable: "A", syllableTa: "அ", meaning: "Peerless archer of pure light", meaningTa: "வில்லாற்றல் மிக்க வீரன்", nakshatra: "Krittika", pada: 1 },
  { name: "Ishaan", nameTa: "ஈஷான்", gender: "boy", syllable: "Ee", syllableTa: "ஈ", meaning: "Lord Shiva, dawn of celestial light", meaningTa: "ஈஸ்வரன், ஈசான்ய திசை அதிபதி", nakshatra: "Krittika", pada: 2 },
  { name: "Iniya", nameTa: "இனிய", gender: "girl", syllable: "Ee", syllableTa: "இ", meaning: "Sweet natured, endearing grace", meaningTa: "இனிமையானவள், அன்பானவள்", nakshatra: "Krittika", pada: 2 },
  { name: "Ilango", nameTa: "இளங்கோ", gender: "boy", syllable: "Ee", syllableTa: "இ", meaning: "Author of Silappathikaram, prince", meaningTa: "சிலப்பதிகாரத்தை அருளிய இளவரசர்", nakshatra: "Krittika", pada: 2 },
  { name: "Udhayan", nameTa: "உதயன்", gender: "boy", syllable: "U", syllableTa: "உ", meaning: "Rising sun of glory and fortune", meaningTa: "உதிக்கும் சூரியன், வெற்றி விடியல்", nakshatra: "Krittika", pada: 3 },
  { name: "Utkarsh", nameTa: "உத்கர்ஷ்", gender: "boy", syllable: "U", syllableTa: "உ", meaning: "Supreme excellence, high ascension", meaningTa: "உயர்ந்த மேன்மை, முன்னேற்றம்", nakshatra: "Krittika", pada: 3 },
  { name: "Uma", nameTa: "உமா", gender: "girl", syllable: "U", syllableTa: "உ", meaning: "Goddess Parvati of eternal light", meaningTa: "அன்னை பார்வதி தேவி", nakshatra: "Krittika", pada: 3 },
  { name: "Ezhil", nameTa: "எழில்", gender: "unisex", syllable: "Ea", syllableTa: "ஏ", meaning: "Radiant beauty, captivating grace", meaningTa: "அழகானவர், வசீகர ஆளுமை", nakshatra: "Krittika", pada: 4 },
  { name: "Ezhilarasi", nameTa: "எழிலரசி", gender: "girl", syllable: "Ea", syllableTa: "ஏ", meaning: "Queen of radiant elegance", meaningTa: "அழகின் அரசி", nakshatra: "Krittika", pada: 4 },
  { name: "Ekambaram", nameTa: "ஏகாம்பரம்", gender: "boy", syllable: "Ea", syllableTa: "ஏ", meaning: "Lord Shiva of Kanchipuram", meaningTa: "காஞ்சி ஏகாம்பரநாதர்", nakshatra: "Krittika", pada: 4 },

  // 4. Rohini: O, Va, Vi, Vu
  { name: "Oviya", nameTa: "ஓவியா", gender: "girl", syllable: "O", syllableTa: "ஓ", meaning: "Artistic masterpiece, celestial beauty", meaningTa: "அழகிய ஓவியம், கலைமகள்", nakshatra: "Rohini", pada: 1 },
  { name: "Omkar", nameTa: "ஓம்கார்", gender: "boy", syllable: "O", syllableTa: "ஓ", meaning: "Primordial cosmic vibration", meaningTa: "பிரணவ மந்திர நாதம், ஓங்கார வடிவம்", nakshatra: "Rohini", pada: 1 },
  { name: "Omprakash", nameTa: "ஓம் பிரகாஷ்", gender: "boy", syllable: "O", syllableTa: "ஓ", meaning: "Light of the sacred Om", meaningTa: "ஓங்காரத்தின் ஒளிச்சுடர்", nakshatra: "Rohini", pada: 1 },
  { name: "Varun", nameTa: "வருண்", gender: "boy", syllable: "Va", syllableTa: "வ", meaning: "Lord of cosmic oceans and rain", meaningTa: "மழை மற்றும் கடல் அதிபதி", nakshatra: "Rohini", pada: 2 },
  { name: "Vasanth", nameTa: "வசந்த்", gender: "boy", syllable: "Va", syllableTa: "வ", meaning: "Joyful spring season, rebirth", meaningTa: "இளவேனில் வசந்த காலம்", nakshatra: "Rohini", pada: 2 },
  { name: "Vaishnavi", nameTa: "வைஷ்ணவி", gender: "girl", syllable: "Va", syllableTa: "வ", meaning: "Goddess Lakshmi, Vishnu's power", meaningTa: "லக்ஷ்மி தேவி, நாராயண சக்தி", nakshatra: "Rohini", pada: 2 },
  { name: "Valluvan", nameTa: "வள்ளுவன்", gender: "boy", syllable: "Va", syllableTa: "வ", meaning: "Supreme philosopher poet", meaningTa: "திருவள்ளுவர், மெய்யியல் ஞானி", nakshatra: "Rohini", pada: 2 },
  { name: "Vihaan", nameTa: "விஹான்", gender: "boy", syllable: "Vi", syllableTa: "வி", meaning: "Dawn, first auspicious ray of light", meaningTa: "அதிகாலைப் பிரகாசம், விடியல்", nakshatra: "Rohini", pada: 3 },
  { name: "Vidya", nameTa: "வித்யா", gender: "girl", syllable: "Vi", syllableTa: "வி", meaning: "Supreme wisdom and knowledge", meaningTa: "கல்வி ஞானம், கலைமகள் அருள்", nakshatra: "Rohini", pada: 3 },
  { name: "Vishaal", nameTa: "விஷால்", gender: "boy", syllable: "Vi", syllableTa: "வி", meaning: "Immense, grand, magnificent soul", meaningTa: "பிரம்மாண்டமானவன், பெருந்தன்மை", nakshatra: "Rohini", pada: 3 },
  { name: "Vignesh", nameTa: "விக்னேஷ்", gender: "boy", syllable: "Vi", syllableTa: "வி", meaning: "Remover of all obstacles (Ganesha)", meaningTa: "தடைகளை நீக்கும் விநாயகர்", nakshatra: "Rohini", pada: 3 },
  { name: "Vrushabh", nameTa: "விருஷப்", gender: "boy", syllable: "Vu", syllableTa: "வு", meaning: "Taurus strength, steadfast stability", meaningTa: "ரிஷப பலம், உறுதி", nakshatra: "Rohini", pada: 4 },
  { name: "Vrushali", nameTa: "விருஷாலி", gender: "girl", syllable: "Vu", syllableTa: "வு", meaning: "Prosperous and generous goddess", meaningTa: "வளமை தரும் நற்பெண்", nakshatra: "Rohini", pada: 4 },

  // 5. Mrigashira: Ve, Vo, Ka, Kee
  { name: "Velan", nameTa: "வேலன்", gender: "boy", syllable: "Ve", syllableTa: "வே", meaning: "Lord Murugan with spear of wisdom", meaningTa: "வேல் ஏந்திய முருகப்பெருமான்", nakshatra: "Mrigashira", pada: 1 },
  { name: "Vedant", nameTa: "வேதாந்த்", gender: "boy", syllable: "Ve", syllableTa: "வே", meaning: "Supreme philosophical truth", meaningTa: "வேதங்களின் சாரம், மெய்ஞானம்", nakshatra: "Mrigashira", pada: 1 },
  { name: "Vennila", nameTa: "வெண்ணிலா", gender: "girl", syllable: "Ve", syllableTa: "வே", meaning: "Luminous white moonlight", meaningTa: "பிரகாசமான வெண்மதி", nakshatra: "Mrigashira", pada: 1 },
  { name: "Vetrivel", nameTa: "வெற்றிவேல்", gender: "boy", syllable: "Ve", syllableTa: "வே", meaning: "Victorious spear of Lord Murugan", meaningTa: "வெற்றி தரும் வேல்", nakshatra: "Mrigashira", pada: 1 },
  { name: "Voman", nameTa: "வோமன்", gender: "boy", syllable: "Vo", syllableTa: "வோ", meaning: "Noble light of honor", meaningTa: "கௌரவ ஒளி", nakshatra: "Mrigashira", pada: 2 },
  { name: "Karthik", nameTa: "கார்த்திக்", gender: "boy", syllable: "Ka", syllableTa: "கா", meaning: "Lord Murugan, bestower of courage", meaningTa: "கார்த்திகேயன், வீரத்தின் அதிபதி", nakshatra: "Mrigashira", pada: 3 },
  { name: "Kavya", nameTa: "காவ்யா", gender: "girl", syllable: "Ka", syllableTa: "கா", meaning: "Poetry in motion, eloquent lyricism", meaningTa: "கவிதை நயம், சொல்லாற்றல்", nakshatra: "Mrigashira", pada: 3 },
  { name: "Kabilan", nameTa: "கபிலன்", gender: "boy", syllable: "Ka", syllableTa: "கா", meaning: "Classical Tamil Sangam poet sage", meaningTa: "சங்க கால கபிலர் முனிவர்", nakshatra: "Mrigashira", pada: 3 },
  { name: "Keerthi", nameTa: "கீர்த்தி", gender: "girl", syllable: "Kee", syllableTa: "கீ", meaning: "Eternal fame, honor & glory", meaningTa: "புகழ், நற்பெயர், கௌரவம்", nakshatra: "Mrigashira", pada: 4 },
  { name: "Kiran", nameTa: "கிரண்", gender: "boy", syllable: "Kee", syllableTa: "கீ", meaning: "Golden sunbeam of dawn", meaningTa: "சூரியக் கதிர்", nakshatra: "Mrigashira", pada: 4 },
  { name: "Kishor", nameTa: "கிஷோர்", gender: "boy", syllable: "Kee", syllableTa: "கீ", meaning: "Ever youthful, vibrant Krishna", meaningTa: "இளமையான கிருஷ்ணர்", nakshatra: "Mrigashira", pada: 4 },

  // 6. Ardra: Ku, Gha, Ng, Chha
  { name: "Kugan", nameTa: "குகன்", gender: "boy", syllable: "Ku", syllableTa: "கு", meaning: "Lord Murugan residing in the heart", meaningTa: "இதய குகையில் உறையும் முருகன்", nakshatra: "Ardra", pada: 1 },
  { name: "Kumaran", nameTa: "குமரன்", gender: "boy", syllable: "Ku", syllableTa: "கு", meaning: "Ever youthful warrior god", meaningTa: "என்றும் இளமையான முருகன்", nakshatra: "Ardra", pada: 1 },
  { name: "Kushala", nameTa: "குஷலா", gender: "girl", syllable: "Ku", syllableTa: "கு", meaning: "Skilled, intelligent, adept", meaningTa: "திறமைசாலி, அறிவுக்கூர்மை", nakshatra: "Ardra", pada: 1 },
  { name: "Kulasekaran", nameTa: "குலசேகரன்", gender: "boy", syllable: "Ku", syllableTa: "கு", meaning: "Crest jewel of the noble clan", meaningTa: "குலத்தின் மணிமகுடம்", nakshatra: "Ardra", pada: 1 },
  { name: "Ghanashyam", nameTa: "கனஷ்யாம்", gender: "boy", syllable: "Gha", syllableTa: "க", meaning: "Lord Krishna resembling dark monsoon clouds", meaningTa: "மழை மேகம் போன்ற நீல வண்ண கிருஷ்ணர்", nakshatra: "Ardra", pada: 2 },
  { name: "Ghavin", nameTa: "கவின்", gender: "boy", syllable: "Gha", syllableTa: "க", meaning: "Beautiful, handsome, gifted", meaningTa: "அழகிய தோற்றம், கலை ஞானம்", nakshatra: "Ardra", pada: 2 },
  { name: "Gnanam", nameTa: "ஞானம்", gender: "unisex", syllable: "Ng", syllableTa: "ஞ", meaning: "Supreme transcendental wisdom", meaningTa: "மெய்ஞான அறிவு", nakshatra: "Ardra", pada: 3 },
  { name: "Gnanoli", nameTa: "ஞானஒளி", gender: "girl", syllable: "Ng", syllableTa: "ஞ", meaning: "Luminous ray of enlightenment", meaningTa: "ஞானத்தின் பேரொளி", nakshatra: "Ardra", pada: 3 },
  { name: "Chhaya", nameTa: "சாயா", gender: "girl", syllable: "Chha", syllableTa: "ச", meaning: "Protective shadow, wife of Sun", meaningTa: "சூரிய பகவானின் தேவி", nakshatra: "Ardra", pada: 4 },
  { name: "Charu", nameTa: "சாரு", gender: "girl", syllable: "Chha", syllableTa: "ச", meaning: "Delicate beauty, charm", meaningTa: "மென்மை, பேரழகு", nakshatra: "Ardra", pada: 4 },
  { name: "Chandru", nameTa: "சந்த்ரு", gender: "boy", syllable: "Chha", syllableTa: "ச", meaning: "The luminous Moon god", meaningTa: "சந்திர பகவான்", nakshatra: "Ardra", pada: 4 },

  // 7. Punarvasu: Ke, Ko, Ha, Hee
  { name: "Keshava", nameTa: "கேசவா", gender: "boy", syllable: "Ke", syllableTa: "கே", meaning: "Lord Krishna, slayer of illusion", meaningTa: "ஸ்ரீ கிருஷ்ணர், மாயையை வெல்பவர்", nakshatra: "Punarvasu", pada: 1 },
  { name: "Kethan", nameTa: "கேதன்", gender: "boy", syllable: "Ke", syllableTa: "கே", meaning: "Auspicious home, pure banner", meaningTa: "மங்கள இருப்பிடம், வெற்றிக் கொடி", nakshatra: "Punarvasu", pada: 1 },
  { name: "Kowshik", nameTa: "கௌஷிக்", gender: "boy", syllable: "Ko", syllableTa: "கோ", meaning: "Sage Vishwamitra, master of mantras", meaningTa: "விஸ்வாமித்ர முனிவர், மந்திர மேதை", nakshatra: "Punarvasu", pada: 2 },
  { name: "Komal", nameTa: "கோமல்", gender: "girl", syllable: "Ko", syllableTa: "கோ", meaning: "Gentle, pure tender grace", meaningTa: "மென்மையானவள், தாமரை போன்றவள்", nakshatra: "Punarvasu", pada: 2 },
  { name: "Kothandapani", nameTa: "கோதண்டபாணி", gender: "boy", syllable: "Ko", syllableTa: "கோ", meaning: "Lord Rama holding the celestial bow", meaningTa: "வில்லேந்திய ஸ்ரீராமர்", nakshatra: "Punarvasu", pada: 2 },
  { name: "Hari", nameTa: "ஹரி", gender: "boy", syllable: "Ha", syllableTa: "ஹ", meaning: "Lord Vishnu, remover of sorrows", meaningTa: "துன்பம் துடைக்கும் விஷ்ணு பகவான்", nakshatra: "Punarvasu", pada: 3 },
  { name: "Harini", nameTa: "ஹரிணி", gender: "girl", syllable: "Ha", syllableTa: "ஹ", meaning: "Graceful deer, Lakshmi's radiance", meaningTa: "மான் போன்ற மருண்ட அழகு, லக்ஷ்மி அருள்", nakshatra: "Punarvasu", pada: 3 },
  { name: "Harshith", nameTa: "ஹர்ஷித்", gender: "boy", syllable: "Ha", syllableTa: "ஹ", meaning: "Brimming with boundless happiness", meaningTa: "மகிழ்ச்சி நிறைந்தவன்", nakshatra: "Punarvasu", pada: 3 },
  { name: "Hitesh", nameTa: "ஹிதேஷ்", gender: "boy", syllable: "Hee", syllableTa: "ஹீ", meaning: "Lord of benevolence and goodwill", meaningTa: "நன்மை அருளும் இறைவன்", nakshatra: "Punarvasu", pada: 4 },
  { name: "Himaja", nameTa: "ஹிமஜா", gender: "girl", syllable: "Hee", syllableTa: "ஹீ", meaning: "Goddess Parvati, daughter of Himalayas", meaningTa: "இமயத்தின் மகள், பார்வதி தேவி", nakshatra: "Punarvasu", pada: 4 },

  // 8. Pushya: Hu, He, Ho, Da
  { name: "Huma", nameTa: "ஹுமா", gender: "girl", syllable: "Hu", syllableTa: "ஹு", meaning: "Bird of paradise, auspicious fortune", meaningTa: "மங்களப் பறவை, நல்யோகம்", nakshatra: "Pushya", pada: 1 },
  { name: "Hutesh", nameTa: "ஹுதேஷ்", gender: "boy", syllable: "Hu", syllableTa: "ஹு", meaning: "Protector of sacred rituals", meaningTa: "யாகத்தைக் காக்கும் அதிபதி", nakshatra: "Pushya", pada: 1 },
  { name: "Hemant", nameTa: "ஹேமந்த்", gender: "boy", syllable: "He", syllableTa: "ஹே", meaning: "Golden winter season, prosperity", meaningTa: "தங்கமயமான பருவம், ஐஸ்வர்யம்", nakshatra: "Pushya", pada: 2 },
  { name: "Hema", nameTa: "ஹேமா", gender: "girl", syllable: "He", syllableTa: "ஹே", meaning: "Golden goddess of wealth", meaningTa: "பொன்மகள், தங்கம் போன்றவள்", nakshatra: "Pushya", pada: 2 },
  { name: "Hemanthika", nameTa: "ஹேமந்திகா", gender: "girl", syllable: "He", syllableTa: "ஹே", meaning: "Golden blossoming dawn", meaningTa: "பொன் விடியல்", nakshatra: "Pushya", pada: 2 },
  { name: "Homesh", nameTa: "ஹோமேஷ்", gender: "boy", syllable: "Ho", syllableTa: "ஹோ", meaning: "Lord of sacred sacrificial fire", meaningTa: "ஹோம அக்னியின் அதிபதி", nakshatra: "Pushya", pada: 3 },
  { name: "Danush", nameTa: "தனுஷ்", gender: "boy", syllable: "Da", syllableTa: "ட", meaning: "The celestial bow of victory", meaningTa: "வெற்றி வில், குறிக்கோள்", nakshatra: "Pushya", pada: 4 },
  { name: "Dakshin", nameTa: "தக்ஷின்", gender: "boy", syllable: "Da", syllableTa: "ட", meaning: "Capable, southward divine light (Dakshinamurthy)", meaningTa: "திறமைசாலி, தட்சிணாமூர்த்தி அருள்", nakshatra: "Pushya", pada: 4 },
  { name: "Danya", nameTa: "தான்யா", gender: "girl", syllable: "Da", syllableTa: "ட", meaning: "Blessed with noble fortune and grace", meaningTa: "பாக்கியவதி, நற்குண தேவி", nakshatra: "Pushya", pada: 4 },

  // 9. Ashlesha: Dee, Du, De, Do
  { name: "Deepak", nameTa: "தீபக்", gender: "boy", syllable: "Dee", syllableTa: "டீ", meaning: "Lamp of wisdom, radiant dispeller of dark", meaningTa: "ஞான விளக்கு, ஒளிச்சுடர்", nakshatra: "Ashlesha", pada: 1 },
  { name: "Deepika", nameTa: "தீபிகா", gender: "girl", syllable: "Dee", syllableTa: "டீ", meaning: "A ray of illuminated light and beauty", meaningTa: "ஒளிக்கதிர், சுடர்", nakshatra: "Ashlesha", pada: 1 },
  { name: "Divya", nameTa: "திவ்யா", gender: "girl", syllable: "Dee", syllableTa: "டீ", meaning: "Divine, heavenly, celestial purity", meaningTa: "தெய்வீக குணம், தூய்மை", nakshatra: "Ashlesha", pada: 1 },
  { name: "Dinesh", nameTa: "தினேஷ்", gender: "boy", syllable: "Dee", syllableTa: "டீ", meaning: "Lord of the day, Sun God", meaningTa: "பகலவன், சூரிய பகவான்", nakshatra: "Ashlesha", pada: 1 },
  { name: "Durgesh", nameTa: "துர்கேஷ்", gender: "boy", syllable: "Du", syllableTa: "டூ", meaning: "Master of fortresses, Lord Shiva", meaningTa: "கோட்டைகளின் காவலன், சிவன்", nakshatra: "Ashlesha", pada: 2 },
  { name: "Durga", nameTa: "துர்கா", gender: "girl", syllable: "Du", syllableTa: "டூ", meaning: "Invincible mother of protection and power", meaningTa: "துன்பங்களை அழிக்கும் துர்க்கை அம்மன்", nakshatra: "Ashlesha", pada: 2 },
  { name: "Devan", nameTa: "தேவன்", gender: "boy", syllable: "De", syllableTa: "டே", meaning: "Divine celestial being, noble prince", meaningTa: "தெய்வீக குணம் கொண்டவன்", nakshatra: "Ashlesha", pada: 3 },
  { name: "Devika", nameTa: "தேவிகா", gender: "girl", syllable: "De", syllableTa: "டே", meaning: "Little goddess of motherly grace", meaningTa: "சிறு தேவதை, தெய்வீக பெண்", nakshatra: "Ashlesha", pada: 3 },
  { name: "Dorai", nameTa: "துரை", gender: "boy", syllable: "Do", syllableTa: "டோ", meaning: "Noble leader, prince of valor", meaningTa: "தலைவன், அரசன்", nakshatra: "Ashlesha", pada: 4 },

  // 10. Magha: Ma, Mee, Mu, Me
  { name: "Madhav", nameTa: "மாதவ்", gender: "boy", syllable: "Ma", syllableTa: "ம", meaning: "Lord Krishna, spring nectar of joy", meaningTa: "ஸ்ரீ கிருஷ்ணர், வசந்த நாயகன்", nakshatra: "Magha", pada: 1 },
  { name: "Manjari", nameTa: "மஞ்சரி", gender: "girl", syllable: "Ma", syllableTa: "ம", meaning: "Blossoming bouquet, sweet melody", meaningTa: "மலர் கொத்து, இனிய ராகம்", nakshatra: "Magha", pada: 1 },
  { name: "Mathivanan", nameTa: "மதிவாணன்", gender: "boy", syllable: "Ma", syllableTa: "ம", meaning: "One with intellect as radiant as the Moon", meaningTa: "சந்திரன் போன்ற அறிவுடையவன்", nakshatra: "Magha", pada: 1 },
  { name: "Meera", nameTa: "மீரா", gender: "girl", syllable: "Mee", syllableTa: "மீ", meaning: "Devoted mystic saint, oceanic soul", meaningTa: "பக்தி ஞானி, பெருங்கடல் போன்ற அன்பு", nakshatra: "Magha", pada: 2 },
  { name: "Mithran", nameTa: "மித்ரன்", gender: "boy", syllable: "Mee", syllableTa: "மீ", meaning: "True friend, radiant Sun of loyalty", meaningTa: "உண்மையான நண்பன், சூரியன்", nakshatra: "Magha", pada: 2 },
  { name: "Mukund", nameTa: "முகுந்த்", gender: "boy", syllable: "Mu", syllableTa: "மு", meaning: "Giver of spiritual liberation (Moksha)", meaningTa: "முக்தி அருளும் விஷ்ணு பகவான்", nakshatra: "Magha", pada: 3 },
  { name: "Murugan", nameTa: "முருகன்", gender: "boy", syllable: "Mu", syllableTa: "மு", meaning: "Supreme beauty, youth and valor", meaningTa: "அழகு, இளமை மற்றும் வீரத்தின் வடிவம்", nakshatra: "Magha", pada: 3 },
  { name: "Muthu", nameTa: "முத்து", gender: "unisex", syllable: "Mu", syllableTa: "மு", meaning: "Precious pearl of stainless purity", meaningTa: "தூய வெண் முத்து, மாசற்றவர்", nakshatra: "Magha", pada: 3 },
  { name: "Meyyappan", nameTa: "மெய்யப்பன்", gender: "boy", syllable: "Me", syllableTa: "மே", meaning: "Embodiment of eternal truth", meaningTa: "வாய்மையின் வடிவம்", nakshatra: "Magha", pada: 4 },
  { name: "Menaka", nameTa: "மேனகா", gender: "girl", syllable: "Me", syllableTa: "மே", meaning: "Celestial apsara of grace", meaningTa: "தேவலோக பேரழகி", nakshatra: "Magha", pada: 4 },
  { name: "Meghana", nameTa: "மேகனா", gender: "girl", syllable: "Me", syllableTa: "மே", meaning: "Nourishing rain cloud of life", meaningTa: "மழை மேகம், வாழ்வளிக்கும் கருணை", nakshatra: "Magha", pada: 4 },

  // 11. Purva Phalguni: Mo, Ta, Tee, Tu
  { name: "Mohan", nameTa: "மோகன்", gender: "boy", syllable: "Mo", syllableTa: "மோ", meaning: "Enchanting beauty, Lord Krishna", meaningTa: "வசீகரமானவன், மயக்கும் கிருஷ்ணர்", nakshatra: "Purva Phalguni", pada: 1 },
  { name: "Mohana", nameTa: "மோகனா", gender: "girl", syllable: "Mo", syllableTa: "மோ", meaning: "Captivating grace and charm", meaningTa: "மயக்கும் பேரழகி, இனியவள்", nakshatra: "Purva Phalguni", pada: 1 },
  { name: "Mohnish", nameTa: "மோக்னிஷ்", gender: "boy", syllable: "Mo", syllableTa: "மோ", meaning: "Lord Krishna, god of attraction", meaningTa: "கவர்ச்சியின் நாயகன்", nakshatra: "Purva Phalguni", pada: 1 },
  { name: "Tanisha", nameTa: "தனிஷா", gender: "girl", syllable: "Ta", syllableTa: "டா", meaning: "Noble ambition, fairy queen", meaningTa: "உயர்ந்த லட்சியம், பேரரசி", nakshatra: "Purva Phalguni", pada: 2 },
  { name: "Tamilmaran", nameTa: "தமிழ்மாறன்", gender: "boy", syllable: "Ta", syllableTa: "டா", meaning: "Pandya king of Tamil glory", meaningTa: "தமிழை ஆண்ட பாண்டிய மன்னன்", nakshatra: "Purva Phalguni", pada: 2 },
  { name: "Theeran", nameTa: "தீரன்", gender: "boy", syllable: "Tee", syllableTa: "டீ", meaning: "Invincible hero of courage", meaningTa: "தைரியசாலி, அஞ்சாத வீரன்", nakshatra: "Purva Phalguni", pada: 3 },
  { name: "Thiru", nameTa: "திரு", gender: "unisex", syllable: "Tee", syllableTa: "டீ", meaning: "Auspicious, sacred divine grace (Shri)", meaningTa: "மங்களம், லக்ஷ்மி கடாட்சம்", nakshatra: "Purva Phalguni", pada: 3 },
  { name: "Tushar", nameTa: "துஷார்", gender: "boy", syllable: "Tu", syllableTa: "டூ", meaning: "Pure morning dew and snow", meaningTa: "பனித்துளி, தூய்மை", nakshatra: "Purva Phalguni", pada: 4 },
  { name: "Thulasi", nameTa: "துளசி", gender: "girl", syllable: "Tu", syllableTa: "டூ", meaning: "Sacred basil, supreme devotion", meaningTa: "புனித துளசி தேவி, பக்தி", nakshatra: "Purva Phalguni", pada: 4 },

  // 12. Uttara Phalguni: Te, To, Pa, Pee
  { name: "Tejash", nameTa: "தேஜஸ்", gender: "boy", syllable: "Te", syllableTa: "டே", meaning: "Radiant solar luster, brilliance", meaningTa: "சூரிய ஒளி, பிரகாசம்", nakshatra: "Uttara Phalguni", pada: 1 },
  { name: "Thendral", nameTa: "தென்றல்", gender: "girl", syllable: "Te", syllableTa: "டே", meaning: "Gentle soothing southern breeze", meaningTa: "இதமான தென்றல் காற்று", nakshatra: "Uttara Phalguni", pada: 1 },
  { name: "Tolkappiyan", nameTa: "தொல்காப்பியன்", gender: "boy", syllable: "To", syllableTa: "டோ", meaning: "Master grammarian sage of Tamil", meaningTa: "தொல்காப்பியத்தை ஆக்கிய மாமுனி", nakshatra: "Uttara Phalguni", pada: 2 },
  { name: "Pavan", nameTa: "பவன்", gender: "boy", syllable: "Pa", syllableTa: "ப", meaning: "Sacred breeze, pure prana force", meaningTa: "புனிதமான காற்று, பிராண சக்தி", nakshatra: "Uttara Phalguni", pada: 3 },
  { name: "Parvathi", nameTa: "பார்வதி", gender: "girl", syllable: "Pa", syllableTa: "ப", meaning: "Supreme goddess of Shakti and grace", meaningTa: "ஆதிபராசக்தி, பார்வதி தேவி", nakshatra: "Uttara Phalguni", pada: 3 },
  { name: "Parthiban", nameTa: "பார்த்திபன்", gender: "boy", syllable: "Pa", syllableTa: "ப", meaning: "Sovereign king of earth, warrior", meaningTa: "பூமியை ஆளும் அரசன், அர்ஜுனன்", nakshatra: "Uttara Phalguni", pada: 3 },
  { name: "Peeran", nameTa: "பீரன்", gender: "boy", syllable: "Pee", syllableTa: "பீ", meaning: "Noble elder, enlightened soul", meaningTa: "ஞான ஆசிரியர், வழிகாட்டி", nakshatra: "Uttara Phalguni", pada: 4 },
  { name: "Pirai", nameTa: "பிறை", gender: "girl", syllable: "Pee", syllableTa: "பீ", meaning: "Auspicious crescent moon", meaningTa: "மங்களப் பிறை நிலவு", nakshatra: "Uttara Phalguni", pada: 4 },

  // 13. Hasta: Pu, Sha, Na, Tha
  { name: "Pugazh", nameTa: "புகழ்", gender: "unisex", syllable: "Pu", syllableTa: "பூ", meaning: "High renown, spotless glory", meaningTa: "நற்புகழ், உயர்ந்த பெருமை", nakshatra: "Hasta", pada: 1 },
  { name: "Puneeth", nameTa: "புனீத்", gender: "boy", syllable: "Pu", syllableTa: "பூ", meaning: "Pure, consecrated, holy soul", meaningTa: "புனிதமானவன், மாசற்றவன்", nakshatra: "Hasta", pada: 1 },
  { name: "Pushkar", nameTa: "புஷ்கர்", gender: "boy", syllable: "Pu", syllableTa: "பூ", meaning: "Sacred blue lotus, celestial lake", meaningTa: "புனித தாமரை, திருத்தலம்", nakshatra: "Hasta", pada: 1 },
  { name: "Shankar", nameTa: "சங்கர்", gender: "boy", syllable: "Sha", syllableTa: "ஷ", meaning: "Bestower of all auspicious blessings (Shiva)", meaningTa: "மங்களம் அருளும் சிவபெருமான்", nakshatra: "Hasta", pada: 2 },
  { name: "Shanmugam", nameTa: "சண்முகம்", gender: "boy", syllable: "Sha", syllableTa: "ஷ", meaning: "Six-faced Lord Murugan of supreme light", meaningTa: "ஆறுமுகப் பெருமான்", nakshatra: "Hasta", pada: 2 },
  { name: "Sharanya", nameTa: "சரண்யா", gender: "girl", syllable: "Sha", syllableTa: "ஷ", meaning: "Surrendering refuge, Goddess Durga", meaningTa: "அடைக்கலம் தரும் துர்க்கை", nakshatra: "Hasta", pada: 2 },
  { name: "Nandhini", nameTa: "நந்தினி", gender: "girl", syllable: "Na", syllableTa: "ண", meaning: "Delightful daughter, sacred Kamadhenu", meaningTa: "மகிழ்ச்சி தரும் மகள், காமதேனு", nakshatra: "Hasta", pada: 3 },
  { name: "Narmadha", nameTa: "நர்மதா", gender: "girl", syllable: "Na", syllableTa: "ண", meaning: "Sacred holy river of pure joy", meaningTa: "புனித நர்மதை நதி", nakshatra: "Hasta", pada: 3 },
  { name: "Thangavel", nameTa: "தங்கவேல்", gender: "boy", syllable: "Tha", syllableTa: "ட", meaning: "Golden spear of righteousness", meaningTa: "பொன் வேல் ஏந்திய முருகன்", nakshatra: "Hasta", pada: 4 },

  // 14. Chitra: Pe, Po, Ra, Ree
  { name: "Perarasu", nameTa: "பேரரசு", gender: "boy", syllable: "Pe", syllableTa: "பே", meaning: "Great emperor of noble realm", meaningTa: "மாபெரும் சக்ரவர்த்தி", nakshatra: "Chitra", pada: 1 },
  { name: "Ponvel", nameTa: "பொன்வேல்", gender: "boy", syllable: "Po", syllableTa: "போ", meaning: "Golden spear of Murugan", meaningTa: "தங்க வேல், வெற்றி சின்னம்", nakshatra: "Chitra", pada: 2 },
  { name: "Porkodi", nameTa: "பொற்கொடி", gender: "girl", syllable: "Po", syllableTa: "போ", meaning: "Golden graceful creeper", meaningTa: "தங்கக் கொடி போன்ற அழகு", nakshatra: "Chitra", pada: 2 },
  { name: "Rahul", nameTa: "ராகுல்", gender: "boy", syllable: "Ra", syllableTa: "ர", meaning: "Conqueror of all miseries, efficient", meaningTa: "துன்பங்களை வெல்பவன், திறமையாளன்", nakshatra: "Chitra", pada: 3 },
  { name: "Radha", nameTa: "ராதா", gender: "girl", syllable: "Ra", syllableTa: "ர", meaning: "Divine beloved, supreme prosperity", meaningTa: "ஸ்ரீ ராதா தேவி, அன்புத் தலைவி", nakshatra: "Chitra", pada: 3 },
  { name: "Rajesh", nameTa: "ராஜேஷ்", gender: "boy", syllable: "Ra", syllableTa: "ர", meaning: "King of kings, supreme monarch", meaningTa: "மன்னர்களின் தலைவன்", nakshatra: "Chitra", pada: 3 },
  { name: "Rithanya", nameTa: "ரிதன்யா", gender: "girl", syllable: "Ree", syllableTa: "ரீ", meaning: "Auspicious scholar, blessed goddess", meaningTa: "அறிவுக் செல்வி, சுபமங்கள தேவி", nakshatra: "Chitra", pada: 4 },
  { name: "Rishab", nameTa: "ரிஷப்", gender: "boy", syllable: "Ree", syllableTa: "ரீ", meaning: "Noble, supreme, celestial bull", meaningTa: "உயர்ந்தவன், நற்குண வீரன்", nakshatra: "Chitra", pada: 4 },

  // 15. Swati: Ru, Re, Ro, Taa
  { name: "Rudran", nameTa: "ருத்ரன்", gender: "boy", syllable: "Ru", syllableTa: "ரூ", meaning: "Fierce transformer, Lord Shiva", meaningTa: "வீர சிவபெருமான், ஆதிக்க சக்தி", nakshatra: "Swati", pada: 1 },
  { name: "Rukmini", nameTa: "ருக்மிணி", gender: "girl", syllable: "Ru", syllableTa: "ரூ", meaning: "Goddess Lakshmi, Krishna's queen", meaningTa: "ஸ்ரீ கிருஷ்ணரின் பட்டத்து அரசி", nakshatra: "Swati", pada: 1 },
  { name: "Renuka", nameTa: "ரேணுகா", gender: "girl", syllable: "Re", syllableTa: "ரே", meaning: "Mother of Parashurama, goddess", meaningTa: "ரேணுகா பரமேஸ்வரி அம்மன்", nakshatra: "Swati", pada: 2 },
  { name: "Revanth", nameTa: "ரேவந்த்", gender: "boy", syllable: "Re", syllableTa: "ரே", meaning: "Son of Surya, swift cosmic rider", meaningTa: "சூரியனின் மைந்தன், குதிரை வீரன்", nakshatra: "Swati", pada: 2 },
  { name: "Rohan", nameTa: "ரோஹன்", gender: "boy", syllable: "Ro", syllableTa: "ரோ", meaning: "Ascending to greatness, blossoming", meaningTa: "உயரத்திற்கு செல்பவன், நற்குண மலர்ச்சி", nakshatra: "Swati", pada: 3 },
  { name: "Roshini", nameTa: "ரோஷினி", gender: "girl", syllable: "Ro", syllableTa: "ரோ", meaning: "Luminous light, radiance", meaningTa: "பிரகாசமான ஒளி, சுடர்", nakshatra: "Swati", pada: 3 },
  { name: "Rohith", nameTa: "ரோஹித்", gender: "boy", syllable: "Ro", syllableTa: "ரோ", meaning: "Red sun of dawn, ruby grace", meaningTa: "விடியல் சூரியன், ரத்தினம்", nakshatra: "Swati", pada: 3 },
  { name: "Tharun", nameTa: "தருண்", gender: "boy", syllable: "Taa", syllableTa: "தா", meaning: "Youthful vigor, vibrant dawn", meaningTa: "இளமை பொலிவு, துடிப்பானவன்", nakshatra: "Swati", pada: 4 },
  { name: "Tharini", nameTa: "தாரிணி", gender: "girl", syllable: "Taa", syllableTa: "தா", meaning: "Saviour goddess, boat across sorrow", meaningTa: "துன்பம் கடத்தும் அன்னை", nakshatra: "Swati", pada: 4 },

  // 16. Vishakha: Tee, Tue, Teaa, To
  { name: "Theeran", nameTa: "தீரன்", gender: "boy", syllable: "Tee", syllableTa: "தீ", meaning: "Brave, invincible hero", meaningTa: "தைரியசாலி, அஞ்சாத வீரன்", nakshatra: "Vishakha", pada: 1 },
  { name: "Deepa", nameTa: "தீபா", gender: "girl", syllable: "Tee", syllableTa: "தீ", meaning: "Radiant lamp, auspicious beacon", meaningTa: "மங்கள விளக்கு, சுடரொளி", nakshatra: "Vishakha", pada: 1 },
  { name: "Thirumaran", nameTa: "திருமாறன்", gender: "boy", syllable: "Tee", syllableTa: "தீ", meaning: "Auspicious Pandya monarch", meaningTa: "லக்ஷ்மி கடாட்சம் கொண்ட மன்னன்", nakshatra: "Vishakha", pada: 1 },
  { name: "Thooyamani", nameTa: "தூயமணி", gender: "unisex", syllable: "Tue", syllableTa: "தூ", meaning: "Pure stainless gem of truth", meaningTa: "தூய்மையான மாணிக்கம்", nakshatra: "Vishakha", pada: 2 },
  { name: "Thuyan", nameTa: "தூயன்", gender: "boy", syllable: "Tue", syllableTa: "தூ", meaning: "Immaculate, pure hearted", meaningTa: "மாசற்றவன், பரிசுத்தமானவன்", nakshatra: "Vishakha", pada: 2 },
  { name: "Thenappan", nameTa: "தேனப்பன்", gender: "boy", syllable: "Teaa", syllableTa: "தே", meaning: "Sweet like honey, Lord Shiva", meaningTa: "தேன் போன்ற இனிய சிவன்", nakshatra: "Vishakha", pada: 3 },
  { name: "Thevaki", nameTa: "தேவகி", gender: "girl", syllable: "Teaa", syllableTa: "தே", meaning: "Mother of Lord Krishna, divine", meaningTa: "ஸ்ரீ கிருஷ்ணரின் அன்னை", nakshatra: "Vishakha", pada: 3 },
  { name: "Tholkappiyan", nameTa: "தொல்காப்பியன்", gender: "boy", syllable: "To", syllableTa: "தோ", meaning: "Immortal master of Tamil Sangam", meaningTa: "தமிழ் இலக்கண முனிவர்", nakshatra: "Vishakha", pada: 4 },

  // 17. Anuradha: Na, Nee, Nu, Ne
  { name: "Naveen", nameTa: "நவீன்", gender: "boy", syllable: "Na", syllableTa: "ந", meaning: "Ever new, progressive, creative", meaningTa: "புதியவன், புதுமை விரும்பி", nakshatra: "Anuradha", pada: 1 },
  { name: "Naren", nameTa: "நரேன்", gender: "boy", syllable: "Na", syllableTa: "ந", meaning: "Leader of men, Swami Vivekananda", meaningTa: "மனிதர்களின் தலைவன், விவேகானந்தர்", nakshatra: "Anuradha", pada: 1 },
  { name: "Natarajan", nameTa: "நடராஜன்", gender: "boy", syllable: "Na", syllableTa: "ந", meaning: "Cosmic king of celestial dance (Shiva)", meaningTa: "தில்லை நடராஜ பெருமான்", nakshatra: "Anuradha", pada: 1 },
  { name: "Nithya", nameTa: "நித்யா", gender: "girl", syllable: "Nee", syllableTa: "நீ", meaning: "Eternal, everlasting bliss", meaningTa: "நிலையானவள், நித்திய ஆனந்தம்", nakshatra: "Anuradha", pada: 2 },
  { name: "Nila", nameTa: "நிலா", gender: "girl", syllable: "Nee", syllableTa: "நீ", meaning: "Enchanting Moon, cool peace", meaningTa: "சந்திரன், மன அமைதி தரும் நிலவு", nakshatra: "Anuradha", pada: 2 },
  { name: "Nimalan", nameTa: "நிமலன்", gender: "boy", syllable: "Nee", syllableTa: "நீ", meaning: "Pure, stainless, Lord Shiva", meaningTa: "மாசற்றவன், சிவபெருமான்", nakshatra: "Anuradha", pada: 2 },
  { name: "Nupur", nameTa: "நூபுர்", gender: "girl", syllable: "Nu", syllableTa: "நு", meaning: "Melodious anklet of dance", meaningTa: "இனிய சிலம்பு நாதம்", nakshatra: "Anuradha", pada: 3 },
  { name: "Nuthan", nameTa: "நூதன்", gender: "boy", syllable: "Nu", syllableTa: "நு", meaning: "Fresh, auspicious beginning", meaningTa: "புதிய விடியல்", nakshatra: "Anuradha", pada: 3 },
  { name: "Nethran", nameTa: "நேத்ரன்", gender: "boy", syllable: "Ne", syllableTa: "நே", meaning: "Visionary eye, supreme seer", meaningTa: "ஞானக் கண் கொண்டவன், வழிகாட்டி", nakshatra: "Anuradha", pada: 4 },
  { name: "Nedunchezhiyan", nameTa: "நெடுஞ்செழியன்", gender: "boy", syllable: "Ne", syllableTa: "நே", meaning: "Glorious Pandya king of justice", meaningTa: "நீதி வழுவா பாண்டிய மன்னன்", nakshatra: "Anuradha", pada: 4 },

  // 18. Jyeshtha: No, Ya, Yee, Yu
  { name: "Noshit", nameTa: "நோஷித்", gender: "boy", syllable: "No", syllableTa: "நோ", meaning: "Honorable leader", meaningTa: "மாண்புமிகு தலைவன்", nakshatra: "Jyeshtha", pada: 1 },
  { name: "Yashwanth", nameTa: "யஷ்வந்த்", gender: "boy", syllable: "Ya", syllableTa: "ய", meaning: "Brimming with glory and success", meaningTa: "புகழும் வெற்றியும் நிறைந்தவன்", nakshatra: "Jyeshtha", pada: 2 },
  { name: "Yamini", nameTa: "யாமினி", gender: "girl", syllable: "Ya", syllableTa: "ய", meaning: "Serene starry night, goddess", meaningTa: "அமைதியான இரவு, ஒளி வீசும் தாரகை", nakshatra: "Jyeshtha", pada: 2 },
  { name: "Yaazhini", nameTa: "யாழினி", gender: "girl", syllable: "Ya", syllableTa: "ய", meaning: "Sweet melodious harp of Tamil music", meaningTa: "யாழ் போன்ற இனிய குரல் செல்வி", nakshatra: "Jyeshtha", pada: 2 },
  { name: "Yadhav", nameTa: "யாதவ்", gender: "boy", syllable: "Ya", syllableTa: "ய", meaning: "Lord Krishna of the Yadava lineage", meaningTa: "யாதவ குல திலகம் கிருஷ்ணர்", nakshatra: "Jyeshtha", pada: 2 },
  { name: "Yithesh", nameTa: "யீதேஷ்", gender: "boy", syllable: "Yee", syllableTa: "யீ", meaning: "Lord of pure will", meaningTa: "உறுதியான சங்கல்ப அதிபதி", nakshatra: "Jyeshtha", pada: 3 },
  { name: "Yuvraj", nameTa: "யுவராஜ்", gender: "boy", syllable: "Yu", syllableTa: "யூ", meaning: "Crown prince, future sovereign", meaningTa: "இளவரசன், சாம்ராஜ்ய அதிபதி", nakshatra: "Jyeshtha", pada: 4 },
  { name: "Yuvashri", nameTa: "யுவஸ்ரீ", gender: "girl", syllable: "Yu", syllableTa: "யூ", meaning: "Youthful prosperity and grace", meaningTa: "இளமைப் பொலிவு, லக்ஷ்மி கடாட்சம்", nakshatra: "Jyeshtha", pada: 4 },
  { name: "Yuvan", nameTa: "யுவன்", gender: "boy", syllable: "Yu", syllableTa: "யூ", meaning: "Youthful vigor, vibrant strength", meaningTa: "இளமைத் துடிப்புடையவன்", nakshatra: "Jyeshtha", pada: 4 },

  // 19. Mula: Ye, Yo, Bha, Bhee
  { name: "Yezhil", nameTa: "எழில்", gender: "unisex", syllable: "Ye", syllableTa: "யே", meaning: "Supreme elegance and charm", meaningTa: "வசீகர பேரழகு", nakshatra: "Mula", pada: 1 },
  { name: "Yogesh", nameTa: "யோகேஷ்", gender: "boy", syllable: "Yo", syllableTa: "யோ", meaning: "Lord of Yoga & Meditation (Shiva)", meaningTa: "யோகங்களின் அதிபதி, சிவபெருமான்", nakshatra: "Mula", pada: 2 },
  { name: "Yogitha", nameTa: "யோகிதா", gender: "girl", syllable: "Yo", syllableTa: "யோ", meaning: "Enlightened practitioner, focused grace", meaningTa: "யோக சாதனை புரிபவள், ஞானவதி", nakshatra: "Mula", pada: 2 },
  { name: "Yovan", nameTa: "யோவன்", gender: "boy", syllable: "Yo", syllableTa: "யோ", meaning: "Youthful hero, vigorous soul", meaningTa: "இளமைத் திறன் கொண்டவன்", nakshatra: "Mula", pada: 2 },
  { name: "Yojana", nameTa: "யோஜனா", gender: "girl", syllable: "Yo", syllableTa: "யோ", meaning: "Strategic vision, cosmic plan", meaningTa: "சிறந்த திட்டம், தீர்க்கதரிசனம்", nakshatra: "Mula", pada: 2 },
  { name: "Yoganathan", nameTa: "யோகநாதன்", gender: "boy", syllable: "Yo", syllableTa: "யோ", meaning: "Lord Shiva, master of union", meaningTa: "யோகத்தின் தலைவன் சிவபெருமான்", nakshatra: "Mula", pada: 2 },
  { name: "Bhargav", nameTa: "பார்கவ்", gender: "boy", syllable: "Bha", syllableTa: "ப", meaning: "Radiant, son of Bhrigu (Shiva/Sukra)", meaningTa: "ஒளி வீசுபவன், பிருகு மகரிஷியின் வம்சம்", nakshatra: "Mula", pada: 3 },
  { name: "Bhavani", nameTa: "பவானி", gender: "girl", syllable: "Bha", syllableTa: "ப", meaning: "Goddess of life and dynamic energy", meaningTa: "உயிரூட்டும் பவானி அம்மன்", nakshatra: "Mula", pada: 3 },
  { name: "Bharath", nameTa: "பாரத்", gender: "boy", syllable: "Bha", syllableTa: "ப", meaning: "Universal sovereign of India, devoted brother", meaningTa: "பாரத தேச மன்னன், ராமரின் தம்பி", nakshatra: "Mula", pada: 3 },
  { name: "Bheeshma", nameTa: "பீஷ்மர்", gender: "boy", syllable: "Bhee", syllableTa: "பீ", meaning: "Steadfast warrior of supreme vow", meaningTa: "உறுதியான சபதம் கொண்ட மாவீரர்", nakshatra: "Mula", pada: 4 },
  { name: "Bheem", nameTa: "பீம்", gender: "boy", syllable: "Bhee", syllableTa: "பீ", meaning: "Mighty hero of colossal strength", meaningTa: "மகா பலசாலி, வீரன்", nakshatra: "Mula", pada: 4 },

  // 20. Purva Ashadha: Bhu, Dha, Pha, Dhaa
  { name: "Bhuvanesh", nameTa: "புவனேஷ்", gender: "boy", syllable: "Bhu", syllableTa: "பூ", meaning: "Lord of all realms and earth", meaningTa: "உலகங்களின் அதிபதி", nakshatra: "Purva Ashadha", pada: 1 },
  { name: "Bhuvanika", nameTa: "புவனிகா", gender: "girl", syllable: "Bhu", syllableTa: "பூ", meaning: "Heavenly beauty of the universe", meaningTa: "பூலோகத்தின் பேரழகி", nakshatra: "Purva Ashadha", pada: 1 },
  { name: "Bhumika", nameTa: "பூமிகா", gender: "girl", syllable: "Bhu", syllableTa: "பூ", meaning: "Mother Earth, solid foundation", meaningTa: "பூமாதேவி, அஸ்திவாரம்", nakshatra: "Purva Ashadha", pada: 1 },
  { name: "Dharshan", nameTa: "தர்ஷன்", gender: "boy", syllable: "Dha", syllableTa: "தா", meaning: "Vision of the divine, spiritual sight", meaningTa: "இறை தரிசனம், நேர்த்தியான பார்வை", nakshatra: "Purva Ashadha", pada: 2 },
  { name: "Dharini", nameTa: "தாரிணி", gender: "girl", syllable: "Dha", syllableTa: "தா", meaning: "The nourishing earth goddess", meaningTa: "பூமித் தாய், காக்கும் தெய்வம்", nakshatra: "Purva Ashadha", pada: 2 },
  { name: "Dhanraj", nameTa: "தன்ராஜ்", gender: "boy", syllable: "Dha", syllableTa: "தா", meaning: "King of vast wealth and treasures", meaningTa: "செல்வங்களின் அதிபதி", nakshatra: "Purva Ashadha", pada: 2 },
  { name: "Phalguni", nameTa: "பல்குணி", gender: "girl", syllable: "Pha", syllableTa: "பா", meaning: "Auspicious star of spring fortune", meaningTa: "சுப நட்சத்திர தேவி", nakshatra: "Purva Ashadha", pada: 3 },
  { name: "Dhathri", nameTa: "தாத்ரி", gender: "girl", syllable: "Dhaa", syllableTa: "தா", meaning: "Goddess Saraswati / Mother Earth", meaningTa: "கலைமகள், பூமித்தாய்", nakshatra: "Purva Ashadha", pada: 4 },
  { name: "Dharesh", nameTa: "தாரேஷ்", gender: "boy", syllable: "Dhaa", syllableTa: "தா", meaning: "Lord of the earth", meaningTa: "பூமியின் அதிபதி", nakshatra: "Purva Ashadha", pada: 4 },

  // 21. Uttara Ashadha: Bhe, Bho, Ja, Jee
  { name: "Bheshaj", nameTa: "பேஷஜ்", gender: "boy", syllable: "Bhe", syllableTa: "பே", meaning: "Divine healer, Lord Vishnu", meaningTa: "நோய் தீர்க்கும் தன்வந்திரி பெருமாள்", nakshatra: "Uttara Ashadha", pada: 1 },
  { name: "Bhoopathi", nameTa: "பூபதி", gender: "boy", syllable: "Bho", syllableTa: "போ", meaning: "King of kings, master of earth", meaningTa: "மன்னர் மன்னன், பூமி அதிபதி", nakshatra: "Uttara Ashadha", pada: 2 },
  { name: "Bhoomika", nameTa: "பூமிகா", gender: "girl", syllable: "Bho", syllableTa: "போ", meaning: "Goddess of earth and stability", meaningTa: "பூமி தேவி, நிலைத்தன்மை", nakshatra: "Uttara Ashadha", pada: 2 },
  { name: "Jayanth", nameTa: "ஜெயந்த்", gender: "boy", syllable: "Ja", syllableTa: "ஜ", meaning: "Victorious, triumphant conqueror", meaningTa: "வெற்றி பெறுபவன், இந்திரன் மகன்", nakshatra: "Uttara Ashadha", pada: 3 },
  { name: "Janani", nameTa: "ஜனனி", gender: "girl", syllable: "Ja", syllableTa: "ஜ", meaning: "Universal mother, origin of all life", meaningTa: "அகிலத்தின் அன்னை, ஆதிபராசக்தி", nakshatra: "Uttara Ashadha", pada: 3 },
  { name: "Jagadish", nameTa: "ஜெகதீஷ்", gender: "boy", syllable: "Ja", syllableTa: "ஜ", meaning: "Ruler of the universe", meaningTa: "உலகாளும் நாயகன்", nakshatra: "Uttara Ashadha", pada: 3 },
  { name: "Jeevan", nameTa: "ஜீவன்", gender: "boy", syllable: "Jee", syllableTa: "ஜீ", meaning: "Life force, vibrant prana soul", meaningTa: "உயிர்ப்பானவன், பிராண சக்தி", nakshatra: "Uttara Ashadha", pada: 4 },
  { name: "Jeevika", nameTa: "ஜீவிகா", gender: "girl", syllable: "Jee", syllableTa: "ஜீ", meaning: "Water of life, living joy", meaningTa: "வாழ்வின் ஆதாரம், மகிழ்ச்சி", nakshatra: "Uttara Ashadha", pada: 4 },

  // 22. Shravana: Ju, Je, Jo, Gha
  { name: "Jagan", nameTa: "ஜகான்", gender: "boy", syllable: "Ju", syllableTa: "ஜு", meaning: "Universe, cosmos, Vishnu's abode", meaningTa: "பிரபஞ்சம், உலகம்", nakshatra: "Shravana", pada: 1 },
  { name: "Jugal", nameTa: "ஜுகல்", gender: "boy", syllable: "Ju", syllableTa: "ஜு", meaning: "Harmonious divine couple", meaningTa: "இணையான தெய்வீக ஜோடி", nakshatra: "Shravana", pada: 1 },
  { name: "Jeshvanth", nameTa: "ஜெஷ்வந்த்", gender: "boy", syllable: "Je", syllableTa: "ஜே", meaning: "Triumphant hero of glory", meaningTa: "வெற்றித் திருமகன்", nakshatra: "Shravana", pada: 2 },
  { name: "Jeyan", nameTa: "ஜெயன்", gender: "boy", syllable: "Je", syllableTa: "ஜே", meaning: "Ever victorious", meaningTa: "என்றும் வெற்றி காண்பவன்", nakshatra: "Shravana", pada: 2 },
  { name: "Jothir", nameTa: "ஜோதிர்", gender: "boy", syllable: "Jo", syllableTa: "ஜோ", meaning: "Self-illuminating cosmic flame", meaningTa: "சுயம்பிரகாச ஜோதி", nakshatra: "Shravana", pada: 3 },
  { name: "Jothika", nameTa: "ஜோதிகா", gender: "girl", syllable: "Jo", syllableTa: "ஜோ", meaning: "Flame of grace, luminous beauty", meaningTa: "ஒளி வீசும் சுடர், அழகு", nakshatra: "Shravana", pada: 3 },
  { name: "Ghanam", nameTa: "கனம்", gender: "unisex", syllable: "Gha", syllableTa: "க", meaning: "Majestic, profound wisdom", meaningTa: "கம்பீரம், ஆழமான ஞானம்", nakshatra: "Shravana", pada: 4 },

  // 23. Dhanishta: Ga, Gee, Gu, Ge
  { name: "Ganesh", nameTa: "கணேஷ்", gender: "boy", syllable: "Ga", syllableTa: "க", meaning: "Lord of beginnings, remover of obstacles", meaningTa: "விக்னங்களை தீர்க்கும் முழுமுதற் கடவுள்", nakshatra: "Dhanishta", pada: 1 },
  { name: "Gayathri", nameTa: "காயத்ரி", gender: "girl", syllable: "Ga", syllableTa: "க", meaning: "Veda Mata, supreme chant of light", meaningTa: "வேத அன்னை, ஒளி தரும் மந்திர தேவி", nakshatra: "Dhanishta", pada: 1 },
  { name: "Gagan", nameTa: "ககன்", gender: "boy", syllable: "Ga", syllableTa: "க", meaning: "Infinite celestial sky", meaningTa: "வானம், எல்லையற்ற விரிவு", nakshatra: "Dhanishta", pada: 1 },
  { name: "Geethan", nameTa: "கீதன்", gender: "boy", syllable: "Gee", syllableTa: "கீ", meaning: "Divine melodious song (Bhagavad Gita)", meaningTa: "தெய்வீக பாடல், பகவத் கீதையின் நாதம்", nakshatra: "Dhanishta", pada: 2 },
  { name: "Geethanjali", nameTa: "கீதாஞ்சலி", gender: "girl", syllable: "Gee", syllableTa: "கீ", meaning: "Offering of divine melodious songs", meaningTa: "இசை அஞ்சலி, பக்திப் பாடல்", nakshatra: "Dhanishta", pada: 2 },
  { name: "Giridhar", nameTa: "கிரிதர்", gender: "boy", syllable: "Gee", syllableTa: "கீ", meaning: "Lord Krishna lifting Govardhana Hill", meaningTa: "கோவர்த்தன மலையை சுமந்த கண்ணன்", nakshatra: "Dhanishta", pada: 2 },
  { name: "Guruprasad", nameTa: "குருபிரசாத்", gender: "boy", syllable: "Gu", syllableTa: "கு", meaning: "Boon and blessing of the divine Guru", meaningTa: "குருவின் திருவருள் பிரசாதம்", nakshatra: "Dhanishta", pada: 3 },
  { name: "Guhan", nameTa: "குகன்", gender: "boy", syllable: "Gu", syllableTa: "கு", meaning: "Lord Murugan residing in caves of heart", meaningTa: "இதய குகை முருகன்", nakshatra: "Dhanishta", pada: 3 },
  { name: "Geeth", nameTa: "கீத்", gender: "unisex", syllable: "Ge", syllableTa: "கே", meaning: "Sacred song of truth", meaningTa: "இனிய பாடல்", nakshatra: "Dhanishta", pada: 4 },

  // 24. Shatabhisha: Go, Sa, See, Su
  { name: "Gowtham", nameTa: "கௌதம்", gender: "boy", syllable: "Go", syllableTa: "கோ", meaning: "Dispeller of darkness, enlightened sage", meaningTa: "இருள் நீக்கும் ஞானி, புத்தர்", nakshatra: "Shatabhisha", pada: 1 },
  { name: "Gopal", nameTa: "கோபால்", gender: "boy", syllable: "Go", syllableTa: "கோ", meaning: "Protector of cows and souls (Krishna)", meaningTa: "ஆநிரை காக்கும் கோபாலன்", nakshatra: "Shatabhisha", pada: 1 },
  { name: "Gowri", nameTa: "கௌரி", gender: "girl", syllable: "Go", syllableTa: "கோ", meaning: "Fair goddess Parvati of purity", meaningTa: "கௌரி அம்மன், மங்கள தேவி", nakshatra: "Shatabhisha", pada: 1 },
  { name: "Sathya", nameTa: "சத்யா", gender: "unisex", syllable: "Sa", syllableTa: "ச", meaning: "Eternal truth and righteousness", meaningTa: "அழியாத உண்மை, தர்மம்", nakshatra: "Shatabhisha", pada: 2 },
  { name: "Sanjay", nameTa: "சஞ்சய்", gender: "boy", syllable: "Sa", syllableTa: "ச", meaning: "Triumphant, intuitive visionary", meaningTa: "வெற்றியாளன், தீர்க்கதரிசி", nakshatra: "Shatabhisha", pada: 2 },
  { name: "Sadhana", nameTa: "சாதனா", gender: "girl", syllable: "Sa", syllableTa: "ச", meaning: "Spiritual accomplishment & focus", meaningTa: "ஆன்மீக சாதனை, லட்சிய வெற்றி", nakshatra: "Shatabhisha", pada: 2 },
  { name: "Saravanan", nameTa: "சரவணன்", gender: "boy", syllable: "Sa", syllableTa: "ச", meaning: "Lord Murugan born in Saravana lake", meaningTa: "சரவணப் பொய்கையில் உதித்த முருகன்", nakshatra: "Shatabhisha", pada: 2 },
  { name: "Siddharth", nameTa: "சித்தார்த்", gender: "boy", syllable: "See", syllableTa: "சீ", meaning: "One who has accomplished supreme goals", meaningTa: "லட்சியத்தை அடைந்த ஞானி", nakshatra: "Shatabhisha", pada: 3 },
  { name: "Sivaji", nameTa: "சிவாஜி", gender: "boy", syllable: "See", syllableTa: "சீ", meaning: "Chhatrapati hero of righteous empire", meaningTa: "தர்ம சாம்ராஜ்ய சத்ரபதி", nakshatra: "Shatabhisha", pada: 3 },
  { name: "Sindhu", nameTa: "சிந்து", gender: "girl", syllable: "See", syllableTa: "சீ", meaning: "Sacred ocean, holy river", meaningTa: "புனித நதி, பெருங்கடல்", nakshatra: "Shatabhisha", pada: 3 },
  { name: "Suriya", nameTa: "சூரியா", gender: "boy", syllable: "Su", syllableTa: "சு", meaning: "The glorious Sun, source of all prana", meaningTa: "சூரிய பகவான், பிராண ஆதாரம்", nakshatra: "Shatabhisha", pada: 4 },
  { name: "Suganya", nameTa: "சுகன்யா", gender: "girl", syllable: "Su", syllableTa: "சு", meaning: "Virtuous, auspicious maiden of fortune", meaningTa: "நற்குணம் கொண்ட மங்களப் பெண்", nakshatra: "Shatabhisha", pada: 4 },
  { name: "Sundar", nameTa: "சுந்தர்", gender: "boy", syllable: "Su", syllableTa: "சு", meaning: "Handsome, radiant grace", meaningTa: "அழகிய தோற்றம், நற்பண்பு", nakshatra: "Shatabhisha", pada: 4 },

  // 25. Purva Bhadrapada: Se, So, Da, Dee
  { name: "Senthil", nameTa: "செந்தில்", gender: "boy", syllable: "Se", syllableTa: "ஸே", meaning: "Lord Murugan of Tiruchendur", meaningTa: "திருச்செந்தூர் முருகப்பெருமான்", nakshatra: "Purva Bhadrapada", pada: 1 },
  { name: "Selvan", nameTa: "செல்வன்", gender: "boy", syllable: "Se", syllableTa: "ஸே", meaning: "Prosperous son, treasure of wealth", meaningTa: "செல்வச் செழிப்புடைய மகன்", nakshatra: "Purva Bhadrapada", pada: 1 },
  { name: "Selvi", nameTa: "செல்வி", gender: "girl", syllable: "Se", syllableTa: "ஸே", meaning: "Graceful daughter of fortune", meaningTa: "செல்வ மகள், பாக்கியவதி", nakshatra: "Purva Bhadrapada", pada: 1 },
  { name: "Senguttuvan", nameTa: "செங்குட்டுவன்", gender: "boy", syllable: "Se", syllableTa: "ஸே", meaning: "Chera king who consecrated Kannagi temple", meaningTa: "கண்ணகிக்கு சிலை எடுத்த சேர மன்னன்", nakshatra: "Purva Bhadrapada", pada: 1 },
  { name: "Somesh", nameTa: "சோமேஷ்", gender: "boy", syllable: "So", syllableTa: "ஸோ", meaning: "Lord Shiva with crescent moon", meaningTa: "சந்திரனை சூடிய சிவபெருமான்", nakshatra: "Purva Bhadrapada", pada: 2 },
  { name: "Soundar", nameTa: "சௌந்தர்", gender: "boy", syllable: "So", syllableTa: "ஸோ", meaning: "Supreme handsome grace", meaningTa: "பேரழகு கொண்டவன்", nakshatra: "Purva Bhadrapada", pada: 2 },
  { name: "Soundarya", nameTa: "சௌந்தர்யா", gender: "girl", syllable: "So", syllableTa: "ஸோ", meaning: "Splendor, exquisite beauty", meaningTa: "அழகு, வசீகரம்", nakshatra: "Purva Bhadrapada", pada: 2 },
  { name: "Damodaran", nameTa: "தாமோதரன்", gender: "boy", syllable: "Da", syllableTa: "தா", meaning: "Lord Krishna bound with love's cord", meaningTa: "அன்புக் கயிற்றால் கட்டுண்ட கண்ணன்", nakshatra: "Purva Bhadrapada", pada: 3 },
  { name: "Deepan", nameTa: "தீபன்", gender: "boy", syllable: "Dee", syllableTa: "தீ", meaning: "Luminous flame of intellect", meaningTa: "ஒளிச்சுடர், ஞான விளக்கு", nakshatra: "Purva Bhadrapada", pada: 4 },

  // 26. Uttara Bhadrapada: Du, Tha, Jna, Da
  { name: "Durgesh", nameTa: "துர்கேஷ்", gender: "boy", syllable: "Du", syllableTa: "து", meaning: "Lord of fortresses, Shiva protector", meaningTa: "கோட்டைகளின் காவலன், சிவன்", nakshatra: "Uttara Bhadrapada", pada: 1 },
  { name: "Durga", nameTa: "துர்கா", gender: "girl", syllable: "Du", syllableTa: "து", meaning: "Invincible goddess of protection & power", meaningTa: "துன்பங்களை அழிக்கும் துர்க்கை அம்மன்", nakshatra: "Uttara Bhadrapada", pada: 1 },
  { name: "Thangavel", nameTa: "தங்கவேல்", gender: "boy", syllable: "Tha", syllableTa: "த", meaning: "Golden spear of righteousness", meaningTa: "பொன் வேல் ஏந்திய முருகன்", nakshatra: "Uttara Bhadrapada", pada: 2 },
  { name: "Thamarai", nameTa: "தாமரை", gender: "girl", syllable: "Tha", syllableTa: "த", meaning: "Sacred lotus, Lakshmi's abode", meaningTa: "செந்தாமரை, லக்ஷ்மி வாசம்", nakshatra: "Uttara Bhadrapada", pada: 2 },
  { name: "Gnanam", nameTa: "ஞானம்", gender: "unisex", syllable: "Jna", syllableTa: "ஞ", meaning: "Supreme cosmic wisdom", meaningTa: "மெய்ஞான அறிவு", nakshatra: "Uttara Bhadrapada", pada: 3 },
  { name: "Gnanasekar", nameTa: "ஞானசேகர்", gender: "boy", syllable: "Jna", syllableTa: "ஞ", meaning: "Crest jewel of wisdom and truth", meaningTa: "ஞானத்தின் மணிமகுடம்", nakshatra: "Uttara Bhadrapada", pada: 3 },
  { name: "Gnanavel", nameTa: "ஞானவேல்", gender: "boy", syllable: "Jna", syllableTa: "ஞ", meaning: "Spear of supreme wisdom", meaningTa: "ஞானத்தை அருளும் வேல்", nakshatra: "Uttara Bhadrapada", pada: 3 },
  { name: "Damodar", nameTa: "தாமோதர்", gender: "boy", syllable: "Da", syllableTa: "த", meaning: "Lord Krishna of boundless affection", meaningTa: "ஸ்ரீ கிருஷ்ணர்", nakshatra: "Uttara Bhadrapada", pada: 4 },

  // 27. Revati: De, Do, Cha, Chee
  { name: "Devesh", nameTa: "தேவேஷ்", gender: "boy", syllable: "De", syllableTa: "தே", meaning: "King of gods, divine light", meaningTa: "தேவர்களின் தலைவன்", nakshatra: "Revati", pada: 1 },
  { name: "Devika", nameTa: "தேவிகா", gender: "girl", syllable: "De", syllableTa: "தே", meaning: "Little goddess, motherly grace", meaningTa: "சிறு தேவதை, தெய்வீக பெண்", nakshatra: "Revati", pada: 1 },
  { name: "Devendran", nameTa: "தேவேந்திரன்", gender: "boy", syllable: "De", syllableTa: "தே", meaning: "King of heaven, sovereign leader", meaningTa: "தேவலோக சக்கரவர்த்தி", nakshatra: "Revati", pada: 1 },
  { name: "Dorairaj", nameTa: "துரைராஜ்", gender: "boy", syllable: "Do", syllableTa: "தோ", meaning: "Noble king of justice", meaningTa: "நீதி வழுவா மன்னன்", nakshatra: "Revati", pada: 2 },
  { name: "Chandran", nameTa: "சந்திரன்", gender: "boy", syllable: "Cha", syllableTa: "ச", meaning: "The luminous Moon, tranquility and peace", meaningTa: "சந்திர பகவான், மன அமைதி", nakshatra: "Revati", pada: 3 },
  { name: "Charulatha", nameTa: "சாருலதா", gender: "girl", syllable: "Cha", syllableTa: "ச", meaning: "Graceful blossoming vine of beauty", meaningTa: "அழகிய கொடி போன்ற மென்மை", nakshatra: "Revati", pada: 3 },
  { name: "Chandramouli", nameTa: "சந்திரமௌலி", gender: "boy", syllable: "Cha", syllableTa: "ச", meaning: "Lord Shiva adorned with crescent moon", meaningTa: "சந்திரனை தலையில் சூடிய சிவன்", nakshatra: "Revati", pada: 3 },
  { name: "Chezhiyan", nameTa: "செழியன்", gender: "boy", syllable: "Chee", syllableTa: "சீ", meaning: "Prosperous sovereign of fertility", meaningTa: "வளமை மிக்க பாண்டிய மன்னன்", nakshatra: "Revati", pada: 4 },
  { name: "Chinmayi", nameTa: "சின்மயி", gender: "girl", syllable: "Chee", syllableTa: "சீ", meaning: "Supreme blissful consciousness", meaningTa: "ஞானானந்த வடிவம்", nakshatra: "Revati", pada: 4 },
  { name: "Chidambaram", nameTa: "சிதம்பரம்", gender: "boy", syllable: "Chee", syllableTa: "சீ", meaning: "Cosmic space of consciousness (Nataraja)", meaningTa: "தில்லை நடராஜரின் ஞான வெளி", nakshatra: "Revati", pada: 4 }
];

export const EXPANDED_NAME_CATALOG = RAW_NAME_CATALOG.map(item => {
  const meta = NAKSHATRA_PADA_SYLLABLES[item.nakshatra];
  const canonicalSyllable = (meta && item.pada >= 1 && item.pada <= 4) ? meta.syllablesEn[item.pada - 1] : (item.syllable || "");
  const canonicalSyllableTa = (meta && item.pada >= 1 && item.pada <= 4) ? meta.syllablesTa[item.pada - 1] : (item.syllableTa || "");
  const phoneticVariants = item.phoneticVariants || (item.syllable && item.syllable !== canonicalSyllable ? [item.syllable] : []);

  return {
    ...item,
    canonicalSyllable,
    canonicalSyllableTa,
    syllable: canonicalSyllable,
    syllableTa: canonicalSyllableTa,
    phoneticVariants
  };
});

/**
 * Compute friendly harmonic numbers based on Driver (Birth Day Number), Destiny (Full DOB Number), and Lagna Lord / Rasi Lord
 */
export function getHarmoniousNumbers(driverNum, destinyNum, lagnaLord) {
  const lagnaMeta = PLANET_NUMEROLOGY[lagnaLord] || PLANET_NUMEROLOGY.Mars;
  const lagnaNum = lagnaMeta.number;

  const driverFriends = PLANET_NUMEROLOGY[Object.keys(PLANET_NUMEROLOGY).find(k => PLANET_NUMEROLOGY[k].number === driverNum)]?.friends || [1, 2, 3, 5, 9];
  const destinyFriends = PLANET_NUMEROLOGY[Object.keys(PLANET_NUMEROLOGY).find(k => PLANET_NUMEROLOGY[k].number === destinyNum)]?.friends || [1, 2, 3, 5, 9];
  const lagnaFriends = lagnaMeta.friends || [1, 2, 3, 5, 9];

  // Combined harmonic numbers
  const allHarmonics = [...new Set([...driverFriends, ...destinyFriends, ...lagnaFriends])];
  const highPriorityHarmonics = driverFriends.filter(n => destinyFriends.includes(n) || lagnaFriends.includes(n));

  return {
    highPriorityHarmonics: highPriorityHarmonics.length > 0 ? highPriorityHarmonics : [1, 3, 5, 6, 9],
    allHarmonics,
    lagnaNum,
    driverFriends,
    destinyFriends,
    lagnaFriends
  };
}

/**
 * Detailed explanation of how this name numerologically and astrologically strengthens the person
 */
export function explainNameEmpowerment({
  fullNameWithInitial,
  nameNum,
  driverNumber,
  destinyNumber,
  lagnaLord,
  lagnaLordTa,
  rasiLord,
  rasiLordTa,
  nakName,
  nakNameTa,
  pada,
  syllable,
  syllableTa,
  isTamil
}) {
  const compoundMeta = CHALDEAN_COMPOUND_MEANINGS[nameNum.compound] || {
    title: `Auspicious Vibration ${nameNum.compound}`,
    titleTa: `சுப எண் அதிர்வு ${nameNum.compound}`,
    blessing: "Empowering resonance, harmonious intellect, prosperity, and vitality.",
    blessingTa: "நற்பலன்கள், அறிவு வளர்ச்சி, தன யோகம் மற்றும் நீண்ட ஆயுள்."
  };

  const namePlanet = Object.keys(PLANET_NUMEROLOGY).find(k => PLANET_NUMEROLOGY[k].number === nameNum.single);
  if (!namePlanet) {
    throw new Error(`Invalid numerology single root digit: ${nameNum.single}`);
  }
  const planetMeta = PLANET_NUMEROLOGY[namePlanet];
  const planetTamil = planetMeta.tamil;

  if (isTamil) {
    return {
      title: `${compoundMeta.titleTa} (கூட்டு எண்: ${nameNum.compound} → மூல எண்: ${nameNum.single} - ${planetTamil})`,
      rationale: `இந்த பெயர் குழந்தையின் ஜென்ம நட்சத்திரமான ${nakNameTa || nakName} (பாதம் ${pada})-ன் தொடக்க அட்சரமான "${syllableTa}" என்ற ஒலியோடு ஒத்திசைவு கொள்கிறது. கால்டியன் எண் கணித மரபுப்படி "${fullNameWithInitial}" என்ற முழுப்பெயர் கூட்டு எண் ${nameNum.compound} (${compoundMeta.titleTa}) கொண்டு மூல எண் ${nameNum.single}-ல் நிலைபெறுகிறது. இது ${planetTamil} பகவானின் ஆற்றலை உயர்த்தி, பிறந்த தேதி எண் ${driverNumber} மற்றும் லக்னாதிபதி ${lagnaLordTa}-ன் காரகத்துவங்களோடு இணக்கமாகக் கருதப்படுகிறது. ${compoundMeta.blessingTa} எண் கணித மரபில், இவ்வதிர்வு குழந்தையின் கல்வி வளர்ச்சி, ஆளுமைத் தலைமை மற்றும் நல்வாழ்விற்கு நற்பலன் தருவதாகக் கருதப்படுகிறது.`
    };
  }

  return {
    title: `${compoundMeta.title} (Compound: ${nameNum.compound} → Single Root: ${nameNum.single} - ${namePlanet})`,
    rationale: `This name begins with the auspicious phoneme "${syllableTa} (${syllable})", aligning with the birth star ${nakName} (Pada ${pada}). In Chaldean numerology tradition, "${fullNameWithInitial}" yields Compound Number ${nameNum.compound} ("${compoundMeta.title}") resolving to Single Root Number ${nameNum.single} ruled by ${namePlanet}. This vibration harmonizes with Driver Number ${driverNumber} (Day) and the functional significations of Ascendant Lord ${lagnaLord} and Moon Lord ${rasiLord}. ${compoundMeta.blessing} In traditional numerological analysis, this vibration is considered to support cognitive development (Vidya), executive capability, vitality, and enduring prosperity.`
  };
}

/**
 * Optimize / tune name spelling by adding harmonious letters to achieve top-tier Raja Yoga Chaldean compound numbers (14, 15, 19, 21, 23, 24, 27, 32, 33, 37, 41, 42, 45, 46, 50, 51, 59)
 */
export function tuneNameForNumerology(baseName, initial = "", surname = "", targetHarmonics = [1, 3, 5, 6, 9]) {
  const cleanInitial = initial ? `${initial}.` : "";
  const fullName = [cleanInitial, baseName, surname].filter(Boolean).join(" ").trim();
  const baseNum = calculateNameNumber(fullName);
  
  const AUSPICIOUS_COMPOUNDS = [14, 15, 19, 21, 23, 24, 27, 32, 33, 37, 41, 42, 45, 46, 50, 51, 59];
  const isAlreadyOptimal = AUSPICIOUS_COMPOUNDS.includes(baseNum.compound) && targetHarmonics.includes(baseNum.single);

  const variations = [];
  variations.push({
    name: baseName,
    fullName,
    compound: baseNum.compound,
    single: baseNum.single,
    isOriginal: true,
    addedLetter: null,
    addedLetterTa: null,
    isAuspicious: AUSPICIOUS_COMPOUNDS.includes(baseNum.compound),
    isHarmonic: targetHarmonics.includes(baseNum.single),
    explanation: "Original authentic spelling",
    explanationTa: "அசல் மூலப் பெயர் எழுத்து வடிவம்"
  });

  // Phonetic letter modification rules (strictly preserving the initial starting syllable)
  const rules = [
    // Double internal vowels
    { pattern: /(?!^)(a)/i, replace: "aa", note: "Extended 'a' (+1 Sun leadership vibration)", noteTa: "'a' நீட்டிப்பு (+1 சூரிய தலைமை யோகம்)" },
    { pattern: /(?!^)(e)/i, replace: "ee", note: "Extended 'e' (+5 Mercury intelligence & speech)", noteTa: "'e' நீட்டிப்பு (+5 புதன் புத்தி பலம்)" },
    { pattern: /(?!^)(i)/i, replace: "ee", note: "Extended 'ee' (+4 Rahu strategic vision)", noteTa: "'ee' சேர்க்கை (+4 ராஜ தந்திர பலம்)" },
    { pattern: /(?!^)(i)/i, replace: "ii", note: "Extended 'ii' (+1 Sun vitality vibration)", noteTa: "'ii' நீட்டிப்பு (+1 சூரிய ஆரோக்கிய யோகம்)" },
    { pattern: /(?!^)(o)/i, replace: "oo", note: "Extended 'oo' (+7 Ketu deep spiritual focus)", noteTa: "'oo' நீட்டிப்பு (+7 கேது ஞான பலம்)" },
    { pattern: /(?!^)(u)/i, replace: "uu", note: "Extended 'uu' (+6 Venus luxury & artistic harmony)", noteTa: "'uu' நீட்டிப்பு (+6 சுக்கிர சுப யோகம்)" },
    // Soft aspirate insertions
    { pattern: /(?!^)(t)/i, replace: "th", note: "Added 'h' (+5 Mercury eloquence & wisdom)", noteTa: "'th' சேர்க்கை (+5 புதன் சொல்வன்மை)" },
    { pattern: /(?!^)(d)/i, replace: "dh", note: "Added 'h' (+5 Jupiter higher morality & luck)", noteTa: "'dh' சேர்க்கை (+5 குரு பாக்கிய யோகம்)" },
    { pattern: /(?!^)(k)/i, replace: "kh", note: "Added 'h' (+5 Mars/Sun vigor & protection)", noteTa: "'kh' சேர்க்கை (+5 வீர சக்தி யோகம்)" },
    { pattern: /(?!^)(g)/i, replace: "gh", note: "Added 'h' (+5 Auspicious Tejas brilliance)", noteTa: "'gh' சேர்க்கை (+5 தேஜஸ் பிரகாசம்)" },
    { pattern: /(?!^)(s)/i, replace: "sh", note: "Added 'h' (+5 Shiva/Murugan divine refuge)", noteTa: "'sh' சேர்க்கை (+5 ஈஸ்வர ரக்ஷா யோகம்)" },
    // Doubling consonants
    { pattern: /(?!^)(n)/i, replace: "nn", note: "Doubled 'n' (+5 Mercury commercial wealth)", noteTa: "'nn' இரட்டிப்பு (+5 புதன் தன யோகம்)" },
    { pattern: /(?!^)(r)/i, replace: "rr", note: "Doubled 'r' (+2 Mars energy & fortitude)", noteTa: "'rr' இரட்டிப்பு (+2 செவ்வாய் தைரியம்)" },
    { pattern: /(?!^)(l)/i, replace: "ll", note: "Doubled 'l' (+3 Jupiter nobility & prestige)", noteTa: "'ll' இரட்டிப்பு (+3 குரு கௌரவ யோகம்)" },
    { pattern: /(?!^)(v)/i, replace: "vv", note: "Doubled 'v' (+6 Venus magnetic charisma)", noteTa: "'vv' இரட்டிப்பு (+6 சுக்கிர வசீகரம்)" },
    { pattern: /(?!^)(m)/i, replace: "mm", note: "Doubled 'm' (+4 Earth stability & stamina)", noteTa: "'mm' இரட்டிப்பு (+4 ஸ்திர யோகம்)" },
    // Suffix extensions
    { custom: (n) => n + "a", note: "Terminal 'a' (+1 Sun exalted status)", noteTa: "இறுதி 'a' சேர்க்கை (+1 சூரிய அந்தஸ்து)" },
    { custom: (n) => n + "h", note: "Terminal 'h' (+5 Mercury communicative fame)", noteTa: "இறுதி 'h' சேர்க்கை (+5 புதன் கீர்த்தி)" },
    { custom: (n) => n + "n", note: "Terminal 'n' (+5 Mercury financial abundance)", noteTa: "இறுதி 'n' சேர்க்கை (+5 தன தான்ய யோகம்)" },
    { custom: (n) => n + "s", note: "Terminal 's' (+3 Jupiter divine blessings)", noteTa: "இறுதி 's' சேர்க்கை (+3 குரு திருவருள்)" },
    { custom: (n) => n + "r", note: "Terminal 'r' (+2 Radiant solar vigor)", noteTa: "இறுதி 'r' சேர்க்கை (+2 வீரிய பலம்)" }
  ];

  const seenVariants = new Set([baseName.toLowerCase()]);

  for (const rule of rules) {
    let candidateName = "";
    if (rule.custom) {
      candidateName = rule.custom(baseName);
    } else if (rule.pattern && baseName.match(rule.pattern)) {
      candidateName = baseName.replace(rule.pattern, rule.replace);
    }

    if (candidateName && !seenVariants.has(candidateName.toLowerCase())) {
      seenVariants.add(candidateName.toLowerCase());
      const candidateFullName = [cleanInitial, candidateName, surname].filter(Boolean).join(" ").trim();
      const num = calculateNameNumber(candidateFullName);
      const isAuspicious = AUSPICIOUS_COMPOUNDS.includes(num.compound);
      const isHarmonic = targetHarmonics.includes(num.single);

      variations.push({
        name: candidateName,
        fullName: candidateFullName,
        compound: num.compound,
        single: num.single,
        isOriginal: false,
        isAuspicious,
        isHarmonic,
        addedLetter: rule.note,
        addedLetterTa: rule.noteTa
      });
    }
  }

  const sorted = variations.sort((a, b) => {
    if (b.isAuspicious !== a.isAuspicious) return b.isAuspicious ? 1 : -1;
    if (b.isHarmonic !== a.isHarmonic) return b.isHarmonic ? 1 : -1;
    return (b.isOriginal ? 1 : 0) - (a.isOriginal ? 1 : 0);
  });

  const bestTuned = sorted.find(v => !v.isOriginal && v.isAuspicious && v.isHarmonic) || (isAlreadyOptimal ? variations[0] : sorted[0]);

  return {
    isAlreadyOptimal,
    original: variations[0],
    bestTuned,
    allTunedVariations: sorted.slice(0, 4)
  };
}

/**
 * Dynamic Vedic Phonetic Generator to ensure 10+ authentic names are ALWAYS available for ANY Pada & Gender
 */
export function generatePhoneticNamesForPada(nakName, pada, syllableEn, syllableTa, gender = "boy") {
  const BOY_SUFFIXES = [
    { en: "an", ta: "அன்", meanEn: "Noble leader", meanTa: "தலைவன்" },
    { en: "esh", ta: "ஈஷ்", meanEn: "Divine lord", meanTa: "இறைவன்" },
    { en: "raj", ta: "ராஜ்", meanEn: "Royal king", meanTa: "அரசன்" },
    { en: "vel", ta: "வேல்", meanEn: "Murugan's spear of victory", meanTa: "வெற்றி வேல்" },
    { en: "kumar", ta: "குமார்", meanEn: "Youthful prince", meanTa: "இளவரசன்" },
    { en: "dhar", ta: "தர்", meanEn: "Bearer of divine light", meanTa: "ஒளி தாங்குபவர்" },
    { en: "karan", ta: "கரன்", meanEn: "Ray of brilliant intellect", meanTa: "கதிர், செயல்வீரன்" },
    { en: "mithran", ta: "மித்ரன்", meanEn: "Devoted sun of friendship", meanTa: "நண்பன், சூரியன்" },
    { en: "vardhan", ta: "வர்தன்", meanEn: "Increaser of wealth & joy", meanTa: "செல்வத்தை பெருக்குபவர்" },
    { en: "nathan", ta: "நாதன்", meanEn: "Protector and supreme master", meanTa: "காக்கும் தலைவன்" }
  ];

  const GIRL_SUFFIXES = [
    { en: "ika", ta: "இகா", meanEn: "Little graceful light", meanTa: "சிறு சுடர், அழகு" },
    { en: "ini", ta: "இனி", meanEn: "Sweet gentle goddess", meanTa: "இனிய நற்குண தேவி" },
    { en: "shri", ta: "ஸ்ரீ", meanEn: "Lakshmi's divine grace & prosperity", meanTa: "லக்ஷ்மி கடாட்சம்" },
    { en: "priya", ta: "பிரியா", meanEn: "Beloved of all hearts", meanTa: "அன்பிற்குரியவள்" },
    { en: "vathi", ta: "வதி", meanEn: "Endowed with wisdom & fortune", meanTa: "பாக்கியவதி" },
    { en: "malar", ta: "மலர்", meanEn: "Blossoming celestial flower", meanTa: "பூ போன்ற மென்மை" },
    { en: "mathi", ta: "மதி", meanEn: "Luminous moon of intellect", meanTa: "சந்திரன் போன்ற அறிவு" },
    { en: "kodi", ta: "கொடி", meanEn: "Graceful golden vine", meanTa: "பொற்கொடி போன்ற வடிவம்" },
    { en: "arasi", ta: "அரசி", meanEn: "Noble queen of virtues", meanTa: "நற்குணங்களின் அரசி" },
    { en: "mithra", ta: "மித்ரா", meanEn: "Compassionate guide", meanTa: "அன்பான தோழி" }
  ];

  const suffixes = (gender === "girl") ? GIRL_SUFFIXES : BOY_SUFFIXES;
  const capitalizedSyl = syllableEn.charAt(0).toUpperCase() + syllableEn.slice(1).toLowerCase();

  return suffixes.map((suf, idx) => {
    const name = `${capitalizedSyl}${suf.en}`;
    const nameTa = `${syllableTa}${suf.ta}`;
    return {
      name,
      nameTa,
      gender: gender === "all" ? (idx % 2 === 0 ? "boy" : "girl") : gender,
      syllable: syllableEn,
      syllableTa,
      meaning: `${suf.meanEn} embodying ${nakName} vitality`,
      meaningTa: `${nakName} நட்சத்திர அருளோடு கூடிய ${suf.meanTa}`,
      nakshatra: nakName,
      pada,
      isDynamicallyGenerated: true
    };
  });
}

/**
 * Calculate accurate newborn horoscope, pada syllables, and name alignment
 */
export function calculateNewbornAstroProfile(input = {}) {
  const dateStr = input.dob || input.dateStr || input.birthDate;
  const timeStr = input.time || input.timeStr || input.birthTime;
  const lat = input.lat !== undefined ? Number(input.lat) : (input.latitude !== undefined ? Number(input.latitude) : null);
  const lon = input.lon !== undefined ? Number(input.lon) : (input.lng !== undefined ? Number(input.lng) : (input.longitude !== undefined ? Number(input.longitude) : null));
  const tz = input.tz !== undefined ? (typeof input.tz === "string" ? input.tz : Number(input.tz)) : (input.timezoneOffsetHours !== undefined ? Number(input.timezoneOffsetHours) : (input.timezoneId || null));

  if (!dateStr || !timeStr || lat === null || isNaN(lat) || lon === null || isNaN(lon) || tz === null || (typeof tz === "number" && isNaN(tz))) {
    throw new Error("calculateNewbornAstroProfile requires complete birth data: dob (YYYY-MM-DD), time (HH:MM), lat, lon, and tz.");
  }

  const [y, m, d] = dateStr.split("-").map(part => parseInt(part, 10));
  if (!d || !m || !y || isNaN(d) || isNaN(m) || isNaN(y)) {
    throw new Error("Invalid birth date format. Expected YYYY-MM-DD.");
  }

  const gender = input.gender || "boy";
  const initial = (input.initial || "S").trim().toUpperCase();
  const parentSurname = (input.parentSurname || input.surname || "").trim();
  const lang = input.lang || "en";
  const isTamil = lang === "ta";

  const chart = calculateChartBySystem("lahiri", {
    birthDate: dateStr,
    birthTime: timeStr,
    latitude: lat,
    longitude: lon,
    utcOffset: typeof tz === "number" ? tz : null,
    timezoneId: typeof tz === "string" ? tz : null
  });
  const { ascendantSign, moonSign, moonNakshatra } = chart;

  if (!moonNakshatra || !moonNakshatra.name) {
    throw new Error("Unable to calculate lunar nakshatra from the provided birth data.");
  }

  const pada = moonNakshatra.pada || 1;
  const nakName = moonNakshatra.name;
  const nakSyllableMeta = NAKSHATRA_PADA_SYLLABLES[nakName];
  if (!nakSyllableMeta) {
    throw new Error(`Syllable metadata not found for Nakshatra: ${nakName}`);
  }

  const auspiciousSyllableEn = nakSyllableMeta.syllablesEn[pada - 1] || nakSyllableMeta.syllablesEn[0];
  const auspiciousSyllableTa = nakSyllableMeta.syllablesTa[pada - 1] || nakSyllableMeta.syllablesTa[0];
  const allPadaSyllablesEn = nakSyllableMeta.syllablesEn;
  const allPadaSyllablesTa = nakSyllableMeta.syllablesTa;

  // Pure Birth Date Numerology (Driver = Day number, Destiny = Full Date Life Path number)
  const reduceDigits = (num) => {
    let n = num;
    while (n > 9) {
      n = n.toString().split("").reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    }
    return n;
  };
  const driverNumber = reduceDigits(d);
  const destinyNumber = reduceDigits(reduceDigits(y) + reduceDigits(m) + reduceDigits(d));

  const PLANET_TAMIL = {
    Sun: "சூரியன்", Moon: "சந்திரன்", Mars: "செவ்வாய்", Mercury: "புதன்",
    Jupiter: "குரு", Venus: "சுக்கிரன்", Saturn: "சனி", Rahu: "ராகு", Ketu: "கேது"
  };
  if (!ascendantSign || !ascendantSign.ruler) {
    throw new Error("Invalid ascendant sign: valid zodiac sign with ruler is required.");
  }
  if (!moonSign || !moonSign.ruler) {
    throw new Error("Invalid moon sign: valid zodiac sign with ruler is required.");
  }
  const lagnaLord = ascendantSign.ruler;
  const rasiLord = moonSign.ruler;
  const lagnaLordTa = PLANET_TAMIL[lagnaLord] || lagnaLord;
  const rasiLordTa = PLANET_TAMIL[rasiLord] || rasiLord;

  const { highPriorityHarmonics, allHarmonics } = getHarmoniousNumbers(driverNumber, destinyNumber, lagnaLord);

  // Helper to check if a name matches the auspicious syllable (supporting standard phonetic variants)
  const matchesSyllable = (name, syl) => {
    if (!name || !syl) return false;
    const n = name.toLowerCase();
    const s = syl.toLowerCase();
    if (n.startsWith(s)) return true;
    const PHONETIC_VARIANTS = {
      i: ["ee", "i"],
      ee: ["i", "ee"],
      e: ["ea", "e"],
      ea: ["e", "ea"],
      a: ["aa", "a"],
      aa: ["a", "aa"],
      u: ["oo", "u"],
      oo: ["u", "oo"]
    };
    for (const [key, variants] of Object.entries(PHONETIC_VARIANTS)) {
      if (s.endsWith(key)) {
        const prefix = s.slice(0, -key.length);
        for (const v of variants) {
          if (n.startsWith(prefix + v)) return true;
        }
      }
    }
    return false;
  };

  // Filter names strictly:
  // Level 1: Exact Pada match (syllable starts with auspiciousSyllableEn OR (nakshatra === nakName && pada === pada))
  let matchingNames = EXPANDED_NAME_CATALOG.filter(item => {
    if (gender !== "all" && item.gender !== "unisex" && item.gender !== gender) {
      return false;
    }
    const isExactPada = item.nakshatra === nakName && item.pada === pada;
    const isSyllablePrefix = matchesSyllable(item.name, auspiciousSyllableEn) || (item.syllable && item.syllable.toLowerCase() === auspiciousSyllableEn.toLowerCase());
    return isExactPada || isSyllablePrefix;
  });

  // Level 2: If catalog has fewer than 6 exact Pada names, generate dynamic authentic names for this exact syllable
  if (matchingNames.length < 6) {
    const generatedPhonetic = generatePhoneticNamesForPada(nakName, pada, auspiciousSyllableEn, auspiciousSyllableTa, gender);
    for (const gp of generatedPhonetic) {
      if (!matchingNames.some(m => m.name.toLowerCase() === gp.name.toLowerCase())) {
        matchingNames.push(gp);
      }
    }
  }

  // Level 3: If still fewer than 8, include other Pada syllables of the SAME star (explicitly marked as same-star alternatives)
  if (matchingNames.length < 8) {
    const starNames = EXPANDED_NAME_CATALOG.filter(item => {
      if (gender !== "all" && item.gender !== "unisex" && item.gender !== gender) return false;
      if (item.nakshatra !== nakName) return false;
      return true;
    });
    for (const sn of starNames) {
      if (!matchingNames.some(m => m.name.toLowerCase() === sn.name.toLowerCase())) {
        matchingNames.push({ ...sn, isSameStarAlternative: true });
      }
    }
  }

  // Score and enrich each name with detailed numerology, letter tuning, and astrological empowerment
  const scoredNames = matchingNames.map(item => {
    const fullNameWithInitial = [
      initial ? `${initial}.` : "",
      item.name,
      parentSurname
    ].filter(Boolean).join(" ").trim();

    const nameNum = calculateNameNumber(fullNameWithInitial);

    // Numerology letter tuning optimization
    const tuningRes = tuneNameForNumerology(item.name, initial, parentSurname, highPriorityHarmonics);
    const bestTuned = tuningRes.bestTuned;
    const isTuned = !tuningRes.isAlreadyOptimal && bestTuned && bestTuned.name !== item.name;

    const activeNum = isTuned ? { compound: bestTuned.compound, single: bestTuned.single } : nameNum;
    const activeFullName = isTuned ? bestTuned.fullName : fullNameWithInitial;

    const isExactPada = item.nakshatra === nakName && item.pada === pada;
    const isCanonicalSyllable = !isExactPada && (
      (item.syllable && item.syllable.toLowerCase() === auspiciousSyllableEn.toLowerCase()) ||
      item.name.toLowerCase().startsWith(auspiciousSyllableEn.toLowerCase())
    );
    const isPhonetic = !isExactPada && !isCanonicalSyllable && matchesSyllable(item.name, auspiciousSyllableEn);
    const isSameStar = !isExactPada && !isCanonicalSyllable && !isPhonetic && (Boolean(item.isSameStarAlternative) || item.nakshatra === nakName);

    let tier = 5;
    let tierLabelEn = "General Name";
    let tierLabelTa = "பொதுவான பெயர் பரிந்துரை";

    if (isExactPada) {
      tier = 1;
      tierLabelEn = "Exact Nakshatra + Pada";
      tierLabelTa = "நேரடி நட்சத்திர & பாத பொருத்தம்";
    } else if (isCanonicalSyllable) {
      tier = 2;
      tierLabelEn = "Canonical Syllable";
      tierLabelTa = "சுப தொடக்க எழுத்துப் பொருத்தம்";
    } else if (isPhonetic) {
      tier = 3;
      tierLabelEn = "Approved Phonetic Variant";
      tierLabelTa = "ஒலிசார் இணைப்பெயர்";
    } else if (isSameStar) {
      tier = 4;
      tierLabelEn = "Same-Star Alternative";
      tierLabelTa = "அதே நட்சத்திர மாற்றுப் பெயர்";
    }

    const isDirectPada = tier <= 2;
    const isHighHarmonic = highPriorityHarmonics.includes(activeNum.single);
    const isAllHarmonic = allHarmonics.includes(activeNum.single);
    const isAuspiciousCompound = Boolean(CHALDEAN_COMPOUND_MEANINGS[activeNum.compound]);

    const padaAlignment = isTamil ? tierLabelTa : tierLabelEn;
    const numerologyHarmonicLevel = isHighHarmonic 
      ? (isTamil ? "உயர் எண் கணித இணக்கம்" : "High Harmonic Resonant")
      : (isAllHarmonic ? (isTamil ? "எண் கணித சமநிலை" : "Harmonic Compatible") : (isTamil ? "இயல்பான அமைப்பு" : "Standard Alignment"));
    const compoundSignificance = isAuspiciousCompound 
      ? (isTamil ? "சுப யோக கூட்டு எண்" : "Auspicious Chaldean Compound")
      : (isTamil ? "வழக்கமான எண் அமைப்பு" : "Standard Compound");
    const alignmentBadge = isExactPada && (isHighHarmonic || isAllHarmonic)
      ? (isTamil ? "உத்தம நட்சத்திர & எண் கணித பொருத்தம்" : "Optimal Harmonic & Pada Alignment")
      : (isExactPada ? (isTamil ? "நேரடி பாத பொருத்தம்" : "Exact Pada Match") : (isTamil ? tierLabelTa : tierLabelEn));

    const empowermentEn = explainNameEmpowerment({
      fullNameWithInitial: activeFullName,
      nameNum: activeNum,
      driverNumber,
      destinyNumber,
      lagnaLord,
      lagnaLordTa,
      rasiLord,
      rasiLordTa,
      nakName,
      nakNameTa: moonNakshatra?.tamil || nakName,
      pada,
      syllable: auspiciousSyllableEn,
      syllableTa: auspiciousSyllableTa,
      isTamil: false
    });

    const empowermentTa = explainNameEmpowerment({
      fullNameWithInitial: activeFullName,
      nameNum: activeNum,
      driverNumber,
      destinyNumber,
      lagnaLord,
      lagnaLordTa,
      rasiLord,
      rasiLordTa,
      nakName,
      nakNameTa: moonNakshatra?.tamil || nakName,
      pada,
      syllable: auspiciousSyllableEn,
      syllableTa: auspiciousSyllableTa,
      isTamil: true
    });

    return {
      ...item,
      fullName: fullNameWithInitial,
      nameNumber: nameNum,
      compoundNumber: nameNum.compound,
      destinyNumber: nameNum.single,
      tier,
      tierLabel: isTamil ? tierLabelTa : tierLabelEn,
      // Numerology Tuned / Fortified variations
      tunedName: isTuned ? bestTuned.name : null,
      tunedFullName: isTuned ? bestTuned.fullName : null,
      tunedCompound: isTuned ? bestTuned.compound : null,
      tunedSingle: isTuned ? bestTuned.single : null,
      tunedCompoundTitle: isTuned ? (CHALDEAN_COMPOUND_MEANINGS[bestTuned.compound]?.title || `Vibration ${bestTuned.compound}`) : null,
      tunedCompoundTitleTa: isTuned ? (CHALDEAN_COMPOUND_MEANINGS[bestTuned.compound]?.titleTa || `சுப எண் ${bestTuned.compound}`) : null,
      addedLetterExplanation: isTuned ? bestTuned.addedLetter : null,
      addedLetterExplanationTa: isTuned ? bestTuned.addedLetterTa : null,
      isTuned,
      isExactPadaMatch: isExactPada,
      isDirectPadaMatch: isDirectPada,
      isHighHarmonic,
      isAllHarmonic,
      padaAlignment,
      numerologyHarmonicLevel,
      compoundSignificance,
      alignmentBadge,
      compatibilityLabel: alignmentBadge,
      syllableMatch: item.syllableTa ? `${item.syllableTa} (${item.syllable})` : item.syllable,
      compoundTitle: isTamil ? empowermentTa.title : empowermentEn.title,
      whyGreatful: empowermentEn.rationale,
      whyGreatfulTa: empowermentTa.rationale
    };
  }).sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (b.isHighHarmonic !== a.isHighHarmonic) return b.isHighHarmonic ? 1 : -1;
    return (b.isAllHarmonic ? 1 : 0) - (a.isAllHarmonic ? 1 : 0);
  });

  return {
    chart,
    lagna: ascendantSign?.name || null,
    lagnaTa: ascendantSign?.tamil || (ascendantSign?.name ? toTamilRasi(ascendantSign.name) : null),
    lagnaLord,
    lagnaLordTa,
    moonSign: moonSign?.name || null,
    moonSignTa: moonSign?.tamil || (moonSign?.name ? toTamilRasi(moonSign.name) : null),
    rasiLord,
    rasiLordTa,
    nakshatraName: nakName,
    nakshatraNameTa: moonNakshatra?.tamil || nakName,
    pada,
    auspiciousSyllableEn,
    auspiciousSyllableTa,
    allPadaSyllablesEn,
    allPadaSyllablesTa,
    nakshatraDeity: nakSyllableMeta.deity,
    nakshatraRuler: nakSyllableMeta.ruler,
    driverNumber,
    destinyNumber,
    suggestedNames: scoredNames
  };
}

/**
 * AI Bespoke Name Generation for Newborn using Gemini
 */
export async function generateAINewbornNames({
  nakshatraName = "Rohini",
  pada = 3,
  syllable = "Vi",
  syllableTa = "வி",
  gender = "boy",
  initial = "S",
  driverNumber = 1,
  destinyNumber = 1,
  lagnaLord = "Mars",
  lang = "en"
}) {
  const isTamil = lang === "ta";
  const prompt = isTamil
    ? `நட்சத்திரம்: ${nakshatraName} (பாதம் ${pada}), சுப தொடக்க எழுத்து: ${syllableTa} (${syllable}), பாலினம்: ${gender}, லக்னாதிபதி: ${lagnaLord}, எண் கணிதம்: எண் ${destinyNumber}. இந்த அமைப்பிற்கு ஏற்ற 10 தெய்வீக, நவீன மற்றும் பாரம்பரிய குழந்தைப் பெயர்களை JSON வடிவில் பட்டியலிடுக. வடிவம்: [{"name": "...", "nameTa": "...", "meaning": "...", "meaningTa": "..."}]`
    : `Nakshatra: ${nakshatraName} (Pada ${pada}), Auspicious Syllable: ${syllable} (${syllableTa}), Gender: ${gender}, Lagna Lord: ${lagnaLord}, Destiny Number: ${destinyNumber}. Generate 10 elegant, meaningful newborn baby names adhering strictly to these parameters in JSON format: [{"name": "...", "nameTa": "...", "meaning": "...", "meaningTa": "..."}]. Return valid JSON array only.`;

  const token = await ensureSessionToken();

  const response = await apiFetch("/api/generate-astrology", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    credentials: "include",
    body: JSON.stringify({
      prompt,
      lang
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || (isTamil ? "AI பெயர் பரிந்துரைகள் உருவாக்குவதில் பிழை ஏற்பட்டது." : "Failed to generate AI baby names."));
  }

  const data = await response.json();
  const rawText = data.text || "[]";
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(isTamil ? "AI பதிலில் இருந்து JSON தரவை பிரிக்க இயலவில்லை." : "Could not parse AI response JSON");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Filter and generate names for browsing catalog mode
 */
export function generateBabyNames({
  gender = "all",
  religion = "all",
  nakshatraSyllable = "",
  parentSurname = "",
  targetLifePath = 1
} = {}) {
  let filtered = EXPANDED_NAME_CATALOG;

  if (gender !== "all") {
    filtered = filtered.filter(n => n.gender === gender || n.gender === "unisex");
  }

  if (religion !== "all") {
    filtered = filtered.filter(n => n.religion === religion || n.religion === "universal" || n.religion === "vedic" || !n.religion);
  }

  if (nakshatraSyllable) {
    const targetSyl = nakshatraSyllable.toLowerCase();
    filtered = filtered.filter(n =>
      (n.syllable && n.syllable.toLowerCase() === targetSyl) ||
      n.name.toLowerCase().startsWith(targetSyl)
    );
  }

  return filtered.map(item => {
    const fullName = `${item.name} ${parentSurname}`.trim();
    const num = calculateNameNumber(fullName);
    const compoundMeta = CHALDEAN_COMPOUND_MEANINGS[num.compound];
    const isHarmonic = targetLifePath ? (num.single === targetLifePath || [1, 3, 5, 6, 9].includes(num.single)) : true;
    const compatibilityLabel = compoundMeta?.isFavorable ? "Classical Auspicious" : (isHarmonic ? "Harmonious" : "Neutral Alignment");
    return {
      ...item,
      fullName,
      compoundNumber: num.compound,
      destinyNumber: num.single,
      isHarmonic,
      compatibilityLabel,
      compoundSignificance: compoundMeta?.title || "Standard Vibration",
      isFavorableCompound: Boolean(compoundMeta?.isFavorable)
    };
  });
}
