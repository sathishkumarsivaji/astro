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

export function calculateNumerology(birthDateStr, fullName = "", system = "pythagorean") {
  const map = system === "chaldean" ? CHALDEAN_MAP : PYTHAGOREAN_MAP;
  const cleanName = (fullName || "").toUpperCase().replace(/[^A-Z]/g, "");
  const hasName = cleanName.length > 0;

  // 1. Life Path Number (Date of Birth)
  const [year, month, day] = birthDateStr.split("-").map(Number);
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
  const today = new Date();
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

  const lifePathInfo = TRAITS[lifePathNumber] || TRAITS[1];
  const destinyInfo = TRAITS[destinyNumber] || TRAITS[1];

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
