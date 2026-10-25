/* Pythagorean & Chaldean Numerology Engine */

const PYTHAGOREAN_MAP = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9
};

const CHALDEAN_MAP = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function reduceNumber(num, preserveMaster = true) {
  if (preserveMaster && (num === 11 || num === 22 || num === 33)) {
    return num;
  }
  while (num > 9) {
    if (preserveMaster && (num === 11 || num === 22 || num === 33)) {
      return num;
    }
    num = num
      .toString()
      .split("")
      .reduce((sum, digit) => sum + parseInt(digit, 10), 0);
  }
  return num;
}

/**
 * Transliterates Tamil Unicode characters to Latin phonetic representations.
 */
export function transliterateTamilToLatin(input) {
  if (!input || typeof input !== "string") return "";

  const independentVowels = {
    "அ": "A", "ஆ": "AA", "இ": "I", "ஈ": "EE", "உ": "U", "ஊ": "OO",
    "எ": "E", "ஏ": "E", "ஐ": "AI", "ஒ": "O", "ஓ": "O", "ஔ": "AU",
    "ஃ": "H"
  };

  const consonants = {
    "க": "K", "ங": "NG", "ச": "S", "ஞ": "NY", "ட": "T", "ண": "N",
    "த": "TH", "ந": "N", "ப": "P", "ம": "M", "ய": "Y", "ர": "R",
    "ல": "L", "வ": "V", "ழ": "ZH", "ள": "L", "ற": "R", "ன": "N",
    "ஜ": "J", "ஷ": "SH", "ஸ": "S", "ஹ": "H"
  };

  const vowelSigns = {
    "ா": "AA", "ி": "I", "ீ": "EE", "ு": "U", "ூ": "OO",
    "ெ": "E", "ே": "E", "ை": "AI", "ொ": "O", "ோ": "O", "ௌ": "AU"
  };

  let out = "";
  const chars = Array.from(input);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (independentVowels[ch]) {
      out += independentVowels[ch];
    } else if (consonants[ch]) {
      const base = consonants[ch];
      if (next === "்") {
        out += base;
        i++;
      } else if (next && vowelSigns[next]) {
        out += base + vowelSigns[next];
        i++;
      } else {
        out += base + "A";
      }
    } else if (vowelSigns[ch]) {
      out += vowelSigns[ch];
    } else if (/[a-zA-Z]/.test(ch)) {
      out += ch.toUpperCase();
    }
  }
  return out;
}

export function calculateNumerology(birthDateStr, fullName = "", system = "pythagorean", targetDate = null) {
  const validSystems = ["pythagorean", "chaldean"];
  if (!validSystems.includes(system)) {
    throw new Error(`INVALID_SYSTEM: Unsupported numerology system '${system}'. Must be 'pythagorean' or 'chaldean'.`);
  }

  // Strict Date Validation (No impossible dates like 2026-02-31, malformed dates, or NaN)
  if (!birthDateStr || typeof birthDateStr !== "string" || !birthDateStr.trim()) {
    throw new Error("INVALID_DATE: Birth date is required in YYYY-MM-DD format.");
  }
  const dateParts = birthDateStr.trim().split("-").map(Number);
  if (dateParts.length !== 3 || dateParts.some(isNaN)) {
    throw new Error(`INVALID_DATE: Malformed birth date string '${birthDateStr}'. Expected YYYY-MM-DD.`);
  }
  const [year, month, day] = dateParts;
  if (year < 1000 || year > 3000 || month < 1 || month > 12) {
    throw new Error(`INVALID_DATE: Month ${month} or Year ${year} out of valid astronomical range.`);
  }
  const maxDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > maxDays) {
    throw new Error(`INVALID_DATE: Day ${day} is invalid for month ${month} in year ${year} (max ${maxDays} days).`);
  }

  const map = system === "chaldean" ? CHALDEAN_MAP : PYTHAGOREAN_MAP;
  
  // Unicode normalization and Tamil transliteration support
  const normalizedRaw = (fullName || "").normalize("NFC");
  const processedName = /[\u0B80-\u0BFF]/.test(normalizedRaw)
    ? transliterateTamilToLatin(normalizedRaw)
    : normalizedRaw.normalize("NFKD");

  const cleanName = processedName.toUpperCase().replace(/[^A-Z]/g, "");
  const hasName = cleanName.length > 0;

  // 1. Life Path Number (Date of Birth)
  const rYear = reduceNumber(year, false);
  const rMonth = reduceNumber(month, false);
  const rDay = reduceNumber(day, false);
  const lifePathNumber = reduceNumber(rYear + rMonth + rDay, true);

  // 2. Destiny / Expression Number (All letters)
  let totalLetterScore = 0;
  let vowelScore = 0;
  let consonantScore = 0;

  if (hasName) {
    for (const char of cleanName) {
      const val = map[char] || 0;
      totalLetterScore += val;
      if (VOWELS.has(char)) {
        vowelScore += val;
      } else {
        consonantScore += val;
      }
    }
  }

  const destinyNumber = hasName ? reduceNumber(totalLetterScore, true) : null;
  const soulUrgeNumber = hasName ? reduceNumber(vowelScore, true) : null;
  const personalityNumber = hasName ? reduceNumber(consonantScore, true) : null;

  // 3. Current Personal Year / Month / Day
  const today = targetDate ? (targetDate instanceof Date ? targetDate : new Date(targetDate)) : new Date();
  if (isNaN(today.getTime())) throw new Error("INVALID_TARGET_DATE: Invalid target date provided.");
  const currentYear = today.getFullYear();
  const personalYear = reduceNumber(rDay + rMonth + reduceNumber(currentYear, false), false);
  const personalMonth = reduceNumber(personalYear + (today.getMonth() + 1), false);
  const personalDay = reduceNumber(personalMonth + today.getDate(), false);

  // 4. Numerology Profiles & Traits
  const TRAITS = {
    1: { title: "The Pioneer & Leader", traits: "Innovative, Independent, Courageous, Ambitious", planet: "Sun", stones: ["Ruby", "Amber"], colors: ["Gold", "Orange", "Yellow"], luckyDays: ["Sunday", "Monday"] },
    2: { title: "The Peacemaker & Diplomat", traits: "Intuitive, Empathetic, Harmonious, Patient", planet: "Moon", stones: ["Pearl", "Moonstone"], colors: ["White", "Silver", "Cream"], luckyDays: ["Monday", "Friday"] },
    3: { title: "The Creative Communicator", traits: "Artistic, Charismatic, Optimistic, Expressive", planet: "Jupiter", stones: ["Yellow Sapphire", "Topaz"], colors: ["Yellow", "Purple", "Pink"], luckyDays: ["Thursday", "Wednesday"] },
    4: { title: "The Master Builder", traits: "Disciplined, Methodical, Reliable, Pragmatic", planet: "Rahu / Uranus", stones: ["Hessonite", "Garnet"], colors: ["Blue", "Grey", "Earth Brown"], luckyDays: ["Saturday", "Sunday"] },
    5: { title: "The Free Spirit & Explorer", traits: "Adventurous, Versatile, Magnetic, Quick-witted", planet: "Mercury", stones: ["Emerald", "Green Tourmaline"], colors: ["Emerald Green", "Turquoise"], luckyDays: ["Wednesday", "Friday"] },
    6: { title: "The Nurturer & Healer", traits: "Compassionate, Responsible, Loving, Artistic", planet: "Venus", stones: ["Diamond", "White Sapphire"], colors: ["Pastel Blue", "Rose Pink"], luckyDays: ["Friday", "Tuesday"] },
    7: { title: "The Seeker & Mystic", traits: "Analytical, Spiritual, Introspective, Wise", planet: "Ketu / Neptune", stones: ["Cat's Eye", "Amethyst"], colors: ["Purple", "Sea Green", "White"], luckyDays: ["Monday", "Sunday"] },
    8: { title: "The Powerhouse & Strategist", traits: "Authoritative, Abundant, Resilient, Executive", planet: "Saturn", stones: ["Blue Sapphire", "Lapis Lazuli"], colors: ["Dark Navy", "Black", "Charcoal"], luckyDays: ["Saturday", "Wednesday"] },
    9: { title: "The Universal Humanitarian", traits: "Selfless, Visionary, Inspiring, Tolerant", planet: "Mars", stones: ["Red Coral", "Carnelian"], colors: ["Crimson Red", "Maroon"], luckyDays: ["Tuesday", "Thursday"] },
    11: { title: "Master Number 11: The Intuitive Illuminator", traits: "High Spiritual Intuition, Visionary Inspiration, Awakening", planet: "Uranus / Moon", stones: ["Opal", "Alexandrite"], colors: ["Silver", "Violet"], luckyDays: ["Monday", "Friday"] },
    22: { title: "Master Number 22: The Master Architect", traits: "Turns Grand Dreams into Practical Reality, Monumental Success", planet: "Pluto / Mercury", stones: ["Jade", "Blue Sapphire"], colors: ["Deep Gold", "Azure"], luckyDays: ["Saturday", "Sunday"] },
    33: { title: "Master Number 33: The Master Teacher & Healer", traits: "Universal Devotion, Compassion, Transformational Upliftment", planet: "Neptune / Venus", stones: ["Diamond", "Aquamarine"], colors: ["Pure White", "Celestial Blue"], luckyDays: ["Thursday", "Friday"] }
  };

  const lifePathInfo = TRAITS[lifePathNumber] || null;
  const destinyInfo = (hasName && destinyNumber) ? (TRAITS[destinyNumber] || null) : null;

  const harmonicNumbers = [lifePathNumber, (lifePathNumber * 3) % 9 || 9, (lifePathNumber * 7) % 9 || 7];

  return {
    system,
    tradition: system === "chaldean" ? "Chaldean Numerology Tradition" : "Pythagorean Numerology Tradition",
    epistemicStatus: "TRADITIONAL_NUMEROLOGY_SYMBOLISM",
    lifePathNumber,
    destinyNumber,
    soulUrgeNumber,
    personalityNumber,
    lifePathInfo,
    destinyInfo,
    personalYear,
    personalMonth,
    personalDay,
    luckyNumbers: harmonicNumbers, // Retained for backward compatibility
    harmonicNumbers,
    harmonicDerivation: "Harmonic frequencies calculated via single-digit modal resonance (1x, 3x, 7x modulo 9)",
    demarcationDisclaimer: "Numerological gemstone and color correspondences represent classical Western/Pythagorean symbolic associations. They must not replace Jyotisha functional lordship (Lagna Adhipati / Yogakaraka) traditional gemstone suggestions derived from your Vedic birth chart.",
    demarcationDisclaimerTa: "எண்கணித ரத்தின மற்றும் வண்ண தொடர்புகள் பாரம்பரிய மேலைநாட்டு குறியீட்டு அமைப்பாகும். இது உங்கள் வேத ஜாதகத்தின் லக்னாதிபதி / யோககாரக ரத்தின பரிந்துரைகளுக்கு மாற்றாகாது.",
    luckyColors: lifePathInfo.colors,
    luckyStones: lifePathInfo.stones,
    luckyDays: lifePathInfo.luckyDays
  };
}
