/**
 * ASTROVERSE — Entity / Factor Extractor
 * =======================================
 * Extracts astrological entities, divisional charts, planetary periods,
 * query targets, and requested quantities from normalized questions.
 */

const PLANET_NAMES = [
  { id: "Sun", en: ["sun", "surya"], ta: ["சூரியன்", "சூரிய", "ஞாயிறு"] },
  { id: "Moon", en: ["moon", "chandra", "soma"], ta: ["சந்திரன்", "சந்திர", "திங்கள்"] },
  { id: "Mars", en: ["mars", "mangal", "kuja", "angarak"], ta: ["செவ்வாய்", "செவ்வாய"] },
  { id: "Mercury", en: ["mercury", "budha"], ta: ["புதன்", "புத"] },
  { id: "Jupiter", en: ["jupiter", "guru", "brihaspati"], ta: ["குரு", "வியாழன்"] },
  { id: "Venus", en: ["venus", "shukra"], ta: ["சுக்கிரன்", "சுக்கிர", "வெள்ளி"] },
  { id: "Saturn", en: ["saturn", "shani"], ta: ["சனி", "சனீஸ்வரன்"] },
  { id: "Rahu", en: ["rahu"], ta: ["ராகு"] },
  { id: "Ketu", en: ["ketu"], ta: ["கேது"] }
];

const SIGN_NAMES = [
  { id: "Aries", en: ["aries", "mesha"], ta: ["மேஷம்", "மேஷ"] },
  { id: "Taurus", en: ["taurus", "vrishabha"], ta: ["ரிஷபம்", "ரிஷப"] },
  { id: "Gemini", en: ["gemini", "mithuna"], ta: ["மிதுனம்", "மிதுன"] },
  { id: "Cancer", en: ["cancer", "karka", "kataka"], ta: ["கடகம்", "கடக"] },
  { id: "Leo", en: ["leo", "simha"], ta: ["சிம்மம்", "சிம்ம"] },
  { id: "Virgo", en: ["virgo", "kanya"], ta: ["கன்னி"] },
  { id: "Libra", en: ["libra", "tula"], ta: ["துலாம்", "துலா"] },
  { id: "Scorpio", en: ["scorpio", "vrischika"], ta: ["விருச்சிகம்", "விருச்சிக"] },
  { id: "Sagittarius", en: ["sagittarius", "dhanu", "dhanus"], ta: ["தனுசு", "தனு"] },
  { id: "Capricorn", en: ["capricorn", "makara"], ta: ["மகரம்", "மகர"] },
  { id: "Aquarius", en: ["aquarius", "kumbha"], ta: ["கும்பம்", "கும்ப"] },
  { id: "Pisces", en: ["pisces", "meena"], ta: ["மீனம்", "மீன"] }
];

const VARGA_MAP = {
  d1: "D1", rasi: "D1", ராசி: "D1",
  d2: "D2", hora: "D2", ஹோரை: "D2",
  d3: "D3", drekkana: "D3", திரேக்காணம்: "D3",
  d4: "D4", chaturthamsha: "D4", சதுர்த்தாம்சம்: "D4",
  d7: "D7", saptamsha: "D7", சப்தாம்சம்: "D7",
  d9: "D9", navamsha: "D9", நவாம்சம்: "D9", navamsa: "D9",
  d10: "D10", dashamsha: "D10", dasamsha: "D10", தசாம்சம்: "D10",
  d12: "D12", dwadashamsha: "D12", துவாதசாம்சம்: "D12",
  d16: "D16", shodashamsha: "D16", சோடசாம்சம்: "D16",
  d20: "D20", vimshamsha: "D20", விம்சாம்சம்: "D20",
  d24: "D24", chaturvimshamsha: "D24", சதுர்விம்சாம்சம்: "D24",
  d27: "D27", saptavimshamsha: "D27",
  d30: "D30", trimsamsha: "D30", திரிம்சாம்சம்: "D30",
  d60: "D60", shashtiamsha: "D60", சஷ்டியாம்சம்: "D60"
};

/**
 * Extracts entities from normalized question text.
 *
 * @param {Object} normalizedQ - Output of normalizeQuestion
 * @returns {Object} Extracted entities and targets
 */
export function extractEntities(normalizedQ) {
  const raw = normalizedQ?.raw || "";
  const norm = normalizedQ?.normalized || "";
  const cues = normalizedQ?.cues || {};

  // 1. Planets extraction
  const planets = [];
  for (const p of PLANET_NAMES) {
    const hasEn = p.en.some(name => new RegExp(`\\b${name}\\b`, "i").test(norm));
    const hasTa = p.ta.some(name => raw.includes(name));
    if (hasEn || hasTa) {
      planets.push(p.id);
    }
  }

  // 2. Signs extraction
  const signs = [];
  for (const s of SIGN_NAMES) {
    const hasEn = s.en.some(name => new RegExp(`\\b${name}\\b`, "i").test(norm));
    const hasTa = s.ta.some(name => raw.includes(name));
    if (hasEn || hasTa) {
      signs.push(s.id);
    }
  }

  // 3. Houses extraction (1 to 12)
  const houses = [];
  const houseRegex = /\b([1-9]|1[0-2])(?:st|nd|rd|th)?\s*(?:house|bhava|cusp)\b/gi;
  let match;
  while ((match = houseRegex.exec(norm)) !== null) {
    const h = parseInt(match[1], 10);
    if (!houses.includes(h)) houses.push(h);
  }
  const taHouseRegex = /([1-9]|1[0-2])\s*[-–]?\s*ம்\s*(?:வீடு|பாவகம்|இடம்)/g;
  while ((match = taHouseRegex.exec(raw)) !== null) {
    const h = parseInt(match[1], 10);
    if (!houses.includes(h)) houses.push(h);
  }

  if (/\b(lagna|ascendant)\b/i.test(norm) || /லக்ன/i.test(raw)) {
    if (!houses.includes(1)) houses.push(1);
  }
  if (/களத்திர|துணை|spouse|partner/i.test(raw) || /\b(spouse|partner|wife|husband|7th)\b/i.test(norm)) {
    if (!houses.includes(7)) houses.push(7);
  }
  if (/கர்ம|தொழில்|career|10th/i.test(raw) || /\b(career|job|profession|10th)\b/i.test(norm)) {
    if (!houses.includes(10)) houses.push(10);
  }
  if (/சுக|சொத்து|தாயார்|4th/i.test(raw) || /\b(property|vehicle|mother|4th)\b/i.test(norm)) {
    if (!houses.includes(4)) houses.push(4);
  }
  if (/தன|குடும்ப|2nd/i.test(raw) || /\b(wealth|money|2nd)\b/i.test(norm)) {
    if (!houses.includes(2)) houses.push(2);
  }
  if (/லாப|11th/i.test(raw) || /\b(gains|11th)\b/i.test(norm)) {
    if (!houses.includes(11)) houses.push(11);
  }

  // 4. Lords
  const lords = [];
  if (/\b(lagna\s*lord|ascendant\s*lord)\b/i.test(norm) || /லக்னாதிபதி/i.test(raw)) lords.push("LagnaLord");
  if (/\b(7th\s*lord)\b/i.test(norm) || /7-ம்\s*அதிபதி|ஏழாம்\s*அதிபதி|களத்திராதிபதி/i.test(raw)) lords.push("7thLord");
  if (/\b(10th\s*lord)\b/i.test(norm) || /10-ம்\s*அதிபதி|பத்தாம்\s*அதிபதி|கர்மாதிபதி/i.test(raw)) lords.push("10thLord");
  if (/\b(4th\s*lord)\b/i.test(norm) || /4-ம்\s*அதிபதி|நான்காம்\s*அதிபதி|சுகாதிபதி/i.test(raw)) lords.push("4thLord");
  if (/\b(2nd\s*lord)\b/i.test(norm) || /2-ம்\s*அதிபதி|இரண்டாம்\s*அதிபதி|தனாதிபதி/i.test(raw)) lords.push("2ndLord");

  // 5. Vargas
  const vargas = [];
  for (const [key, vargaCode] of Object.entries(VARGA_MAP)) {
    if (new RegExp(`\\b${key}\\b`, "i").test(norm) || raw.includes(key)) {
      if (!vargas.includes(vargaCode)) vargas.push(vargaCode);
    }
  }

  // 6. Dasha Pairs / Planetary periods
  let dashaPair = null;
  const dashaMatch = norm.match(/\b(sun|moon|mars|mercury|jupiter|venus|saturn|rahu|ketu)\s*[-–/]\s*(sun|moon|mars|mercury|jupiter|venus|saturn|rahu|ketu)\b/i);
  if (dashaMatch) {
    const p1 = PLANET_NAMES.find(p => p.en.includes(dashaMatch[1].toLowerCase()))?.id || dashaMatch[1];
    const p2 = PLANET_NAMES.find(p => p.en.includes(dashaMatch[2].toLowerCase()))?.id || dashaMatch[2];
    dashaPair = { mahadasha: p1, antardasha: p2 };
  } else {
    // Check Tamil planet pair (e.g. சந்திர-சுக்கிர or Moon–Venus)
    const taDashaMatch = raw.match(/(சூரியன்|சந்திரன்|செவ்வாய்|புதன்|குரு|சுக்கிரன்|சனி|ராகு|கேது)\s*[-–/]\s*(சூரியன்|சந்திரன்|செவ்வாய்|புதன்|குரு|சுக்கிரன்|சனி|ராகு|கேது)/);
    if (taDashaMatch) {
      const p1 = PLANET_NAMES.find(p => p.ta.includes(taDashaMatch[1]))?.id || taDashaMatch[1];
      const p2 = PLANET_NAMES.find(p => p.ta.includes(taDashaMatch[2]))?.id || taDashaMatch[2];
      dashaPair = { mahadasha: p1, antardasha: p2 };
    } else if (planets.length >= 2 && (norm.includes("dasha") || norm.includes("period") || raw.includes("தசா") || raw.includes("தசை") || raw.includes("காலம்"))) {
      dashaPair = { mahadasha: planets[0], antardasha: planets[1] };
    }
  }

  // 7. Time periods & Years
  const years = [];
  const yearRegex = /\b(19\d\d|20\d\d)\b/g;
  while ((match = yearRegex.exec(raw)) !== null) {
    const yr = parseInt(match[1], 10);
    if (!years.includes(yr)) years.push(yr);
  }
  let durationYears = null;
  const durMatch = norm.match(/next\s*([1-9]|10)\s*years?/i) || raw.match(/அடுத்த\s*([1-9]|10)\s*(?:வருட|ஆண்டு)/);
  if (durMatch) {
    durationYears = parseInt(durMatch[1], 10);
  }

  // 8. Directions
  const directions = [];
  if (/\b(north|east|west|south|north-east|south-east|north-west|south-west)\b/i.test(norm)) {
    const dirMatch = norm.match(/\b(north-east|south-east|north-west|south-west|north|east|west|south)\b/gi);
    if (dirMatch) dirMatch.forEach(d => directions.push(d.toUpperCase()));
  }
  if (/வடகிழக்கு/i.test(raw)) directions.push("NORTH_EAST");
  else if (/தென்கிழக்கு/i.test(raw)) directions.push("SOUTH_EAST");
  else if (/வடமேற்கு/i.test(raw)) directions.push("NORTH_WEST");
  else if (/தென்மேற்கு/i.test(raw)) directions.push("SOUTH_WEST");
  else {
    if (/வடக்கு/i.test(raw)) directions.push("NORTH");
    if (/தெற்கு/i.test(raw)) directions.push("SOUTH");
    if (/கிழக்கு/i.test(raw)) directions.push("EAST");
    if (/மேற்கு/i.test(raw)) directions.push("WEST");
  }

  // 9. Comparison & Specific targets
  const isSpouseFamilyComparison =
    (/spouse.*family|wife.*family|husband.*family|துணையின்\s*குடும்பம்/i.test(raw) ||
     /மாமியார்|மாமனார்/i.test(raw)) &&
    (cues.isComparison || /வசதியான\s*குடும்பமாக/i.test(raw) || /richer|wealthier|status/i.test(norm));

  // 10. Specific Requested Quantities / Flags
  const directionRequested = cues.isDirection || /திசை|எந்த\s*திசை/i.test(raw);
  const distanceRequested = cues.isDistance || /தூரம்|தொலைவு|கிலோமீட்டர்/i.test(raw);
  const timingRequested = cues.isTiming || /எப்போது|எந்த\s*கால|எந்த\s*ஆண்டு/i.test(raw);
  const comparisonRequested = cues.isComparison || isSpouseFamilyComparison;
  const remedyRequested = cues.isRemedy || /பரிகாரம்|ரத்தினம்/i.test(raw);
  const vargaRequested = vargas.length > 0;
  const dashaRequested = dashaPair !== null || /தசா|தசை|நடப்பு\s*தசை|current\s*dasha/i.test(raw);
  const familyWealthRequested = isSpouseFamilyComparison;

  return {
    planets,
    signs,
    houses,
    lords,
    vargas,
    dashaPair,
    years,
    durationYears,
    directions,
    requestedQuantities: {
      directionRequested,
      distanceRequested,
      timingRequested,
      comparisonRequested,
      remedyRequested,
      vargaRequested,
      dashaRequested,
      familyWealthRequested
    }
  };
}
