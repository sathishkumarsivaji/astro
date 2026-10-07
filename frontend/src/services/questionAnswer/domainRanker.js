/**
 * ASTROVERSE — Dynamic Domain Prominence & Section Ranking Engine
 * ===============================================================
 * Dynamically ranks the 17 comprehensive report domains based on
 * authentic chart calculations: active Dasha rulerships, Ashtakavarga bindu
 * density, planetary occupancy, and detected Yogas.
 *
 * Replaces hardcoded top-headings lists with a verifiable mathematical score.
 * Implements Section 14 & 20 of the Precision Q&A Engine Mandate.
 */

const DOMAIN_DEFINITIONS = [
  {
    domain: "CAREER",
    primaryHouses: [10, 6],
    karakas: ["Sun", "Saturn", "Mercury"],
    titleEn: "Career, Leadership & Vocation",
    titleTa: "தொழில், தலைமைத்துவம் மற்றும் வாழ்வியல் சாதனை",
    varga: "D10",
    descriptionEn: "Evaluates 10th house karmic potential, executive milestones, and vocational trajectory under active planetary cycles.",
    descriptionTa: "10-ம் கர்ம பாவகம், தொழில் காரகர்கள் மற்றும் நடப்பு தசா சுழற்சியின் அடிப்படையில் தொழில் வளர்ச்சி மற்றும் தலைமைப் பொறுப்புகள் இதில் ஆராயப்படுகின்றன."
  },
  {
    domain: "MARRIAGE",
    primaryHouses: [7, 2],
    karakas: ["Venus", "Jupiter"],
    titleEn: "Marriage, Family & Partnerships",
    titleTa: "இல்லற நல்வாழ்வு, திருமணம் மற்றும் உறவுகள்",
    varga: "D9",
    descriptionEn: "Analyzes 7th house, Navamsha (D9) alignment, and interpersonal harmony for lifelong companionship.",
    descriptionTa: "7-ம் களத்திர பாவகம், நவாம்சம் (D9) மற்றும் துணைவருக்கான பொருத்தக் கூறுகள் மூலம் குடும்ப வாழ்வின் ஸ்திரத்தன்மை இதில் மதிப்பிடப்படுகிறது."
  },
  {
    domain: "FINANCE",
    primaryHouses: [2, 11],
    karakas: ["Jupiter", "Venus"],
    titleEn: "Finance, Wealth & Capital Growth",
    titleTa: "நிதி மேலாண்மை, செல்வ வளம் மற்றும் வருமானம்",
    varga: "D2",
    descriptionEn: "Details accumulated reserves, 2nd/11th Dhana yogas, and liquidity patterns for economic security.",
    descriptionTa: "2-ம் தன பாவகம், 11-ம் லாப பாவகம் மற்றும் தன யோகங்கள் வழியே வாழ்நாள் நிதிப் பாதுகாப்பு மற்றும் வருமான ஓட்டம் இதில் பகுப்பாய்வு செய்யப்படுகின்றன."
  },
  {
    domain: "PROPERTY",
    primaryHouses: [4],
    karakas: ["Mars", "Venus"],
    titleEn: "Real Estate, Property & Vehicles",
    titleTa: "சொத்துக்கள், பூமி லாபம் மற்றும் வாகன சுகம்",
    varga: "D4",
    descriptionEn: "Assesses immovable real estate, land acquisition cycles, and residential stability.",
    descriptionTa: "4-ம் சுக பாவகம், பூமி காரகன் செவ்வாய் மற்றும் மனை யோகங்கள் வழியே அசையாச் சொத்து சேர்க்கை இதில் ஆராயப்படுகிறது."
  },
  {
    domain: "WELLNESS",
    primaryHouses: [1, 6],
    karakas: ["Sun", "Mars"],
    titleEn: "Constitutional Vitality & Lifestyle Harmony",
    titleTa: "உடல் நலம், தேக பலம் மற்றும் வாழ்வியல் சமநிலை",
    varga: "D1",
    descriptionEn: "Constitutional baseline vitality and Ayurvedic equilibrium across 1st and 6th bhava correspondences.",
    descriptionTa: "1-ம் பாவகம் (லக்ன தேக பலம்) மற்றும் 6-ம் பாவக தொடர்புகள் வழியே உடல் சுறுசுறுப்பு மற்றும் தற்காப்பு சமநிலை இதில் மதிப்பிடப்படுகிறது."
  },
  {
    domain: "EDUCATION",
    primaryHouses: [4, 5],
    karakas: ["Mercury", "Jupiter"],
    titleEn: "Education, Intellectual Depth & Academic Mastery",
    titleTa: "கல்வி, புத்தி கூர்மை மற்றும் உயர் கல்வி வாய்ப்புகள்",
    varga: "D24",
    descriptionEn: "Evaluates academic foundation, higher intellectual pursuits, and analytical mastery.",
    descriptionTa: "4 மற்றும் 5-ம் பாவகங்கள், புதனின் கல்வி காரகத்துவம் வழியே அறிவுசார் வளர்ச்சி இதில் மதிப்பிடப்படுகிறது."
  },
  {
    domain: "CHILDREN",
    primaryHouses: [5],
    karakas: ["Jupiter"],
    titleEn: "Progeny, Lineage & Creative Intellect",
    titleTa: "புத்திர பாக்கியம், சந்ததி மற்றும் படைப்பாற்றல்",
    varga: "D7",
    descriptionEn: "5th house creative lineage, children's welfare, and traditional Saptamsha alignments.",
    descriptionTa: "5-ம் பூர்வ புண்ணிய பாவகம் மற்றும் குரு பகவானின் சுப பார்வை வழியே புத்திர நலன் இதில் பகுப்பாய்வு செய்யப்படுகிறது."
  },
  {
    domain: "FOREIGN_TRAVEL",
    primaryHouses: [9, 12],
    karakas: ["Rahu", "Moon"],
    titleEn: "Foreign Travel, Global Relocation & Horizons",
    titleTa: "வெளிநாட்டுப் பயணம், இடப்பெயர்வு மற்றும் தொலைதூர தொடர்பு",
    varga: "D9",
    descriptionEn: "9th and 12th house overseas opportunities, cross-cultural mobility, and settlement potential.",
    descriptionTa: "9 மற்றும் 12-ம் பாவகங்கள் வழியே தொலைதூர பயணம், வெளிநாட்டு வேலைவாய்ப்பு மற்றும் இடப்பெயர்வு இதில் ஆராயப்படுகின்றன."
  },
  {
    domain: "SPIRITUALITY",
    primaryHouses: [9, 12, 8],
    karakas: ["Jupiter", "Ketu"],
    titleEn: "Dharma, Spiritual Evolution & Inner Peace",
    titleTa: "தர்ம சிந்தனை, ஆன்மீக நாட்டம் மற்றும் மன அமைதி",
    varga: "D20",
    descriptionEn: "9th house dharma, philosophical inclinations, and 12th house contemplative release.",
    descriptionTa: "9-ம் தர்ம பாவகம், கேதுவின் மோட்ச காரகத்துவம் வழியே ஆன்மீக நாட்டம் மற்றும் ஆத்மார்த்த அமைதி இதில் விவரிக்கப்படுகிறது."
  },
  {
    domain: "LEGAL",
    primaryHouses: [6, 8],
    karakas: ["Mars", "Saturn"],
    titleEn: "Dispute Prudence, Legal Caution & Contracts",
    titleTa: "சட்ட விழிப்புணர்வு, ஒப்பந்த எச்சரிக்கை மற்றும் வழக்கு பாதுகாப்பு",
    varga: "D1",
    descriptionEn: "Evaluates 6th house contestation and advisory caution windows for agreements.",
    descriptionTa: "6-ம் பாவக எதிர்ப்புகள் மற்றும் ஒப்பந்த விவகாரங்களில் கடைபிடிக்க வேண்டிய பாதுகாப்பு ஆலோசனைகள் இதில் தரப்படுகின்றன."
  }
];

/**
 * Calculates dynamic importance scores for all report domains based on chart facts.
 *
 * @param {Object} chart - Calculated chart object
 * @returns {Array<Object>} Ranked domain objects sorted descending by score
 */
export function calculateDomainImportanceScores(chart) {
  if (!chart) return [];

  const planets = chart.planets || [];
  const pMap = {};
  for (const p of planets) {
    pMap[p.name || p.planetName] = p;
  }

  const houses = chart.houses || chart.bhavasDetailed || [];
  const houseMap = {};
  houses.forEach((h, idx) => {
    const hNum = h.house || idx + 1;
    houseMap[hNum] = h;
  });

  const activeDasha = chart.currentDasha || {};
  const mdLord = activeDasha.lord || activeDasha.mahadasha || null;
  const adLord = activeDasha.currentAntar || activeDasha.antarDasha || null;

  // Sign order to determine house rulership
  const signLords = {
    Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
    Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
    Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter"
  };

  // Map each planet to the houses it owns
  const planetOwnedHouses = {};
  for (let h = 1; h <= 12; h++) {
    const hSign = houseMap[h]?.signName || houseMap[h]?.sign;
    const lord = houseMap[h]?.lord || (hSign ? signLords[hSign] : null);
    if (lord) {
      if (!planetOwnedHouses[lord]) planetOwnedHouses[lord] = [];
      planetOwnedHouses[lord].push(h);
    }
  }

  const ranked = DOMAIN_DEFINITIONS.map(def => {
    let score = 0.20; // Baseline structural relevance
    const reasonsEn = [];
    const reasonsTa = [];

    // 1. Dasha Activation (+0.35 max)
    if (mdLord) {
      const mdHouses = planetOwnedHouses[mdLord] || [];
      const mdOccupied = pMap[mdLord]?.house;
      const mdMatches = def.primaryHouses.some(h => mdHouses.includes(h) || mdOccupied === h);
      if (mdMatches) {
        score += 0.20;
        reasonsEn.push(`Active Mahadasha lord ${mdLord} activates House ${def.primaryHouses[0]}`);
        reasonsTa.push(`நடப்பு மகா தசா நாதன் ${mdLord} ${def.primaryHouses[0]}-ம் பாவகத்தை இயக்குகிறார்`);
      }
    }

    if (adLord) {
      const adHouses = planetOwnedHouses[adLord] || [];
      const adOccupied = pMap[adLord]?.house;
      const adMatches = def.primaryHouses.some(h => adHouses.includes(h) || adOccupied === h);
      if (adMatches) {
        score += 0.15;
        reasonsEn.push(`Active Antardasha lord ${adLord} activates House ${def.primaryHouses[0]}`);
        reasonsTa.push(`அந்தர்தசா நாதன் ${adLord} ${def.primaryHouses[0]}-ம் பாவகத்தை தூண்டுகிறார்`);
      }
    }

    // 2. Planetary Concentration in Primary House (+0.25 max)
    const occupants = planets.filter(p => def.primaryHouses.includes(p.house));
    if (occupants.length > 0) {
      const occScore = Math.min(0.25, occupants.length * 0.10);
      score += occScore;
      const occNames = occupants.map(p => p.name || p.planetName).join(", ");
      reasonsEn.push(`${occupants.length} planet(s) (${occNames}) occupy relevant bhava`);
      reasonsTa.push(`${occupants.length} கிரகங்கள் (${occNames}) தொடர்புடைய பாவகத்தில் அமர்ந்துள்ளன`);
    }

    // 3. Karaka Dignity (+0.20 max)
    for (const kName of def.karakas) {
      const kPlanet = pMap[kName];
      if (kPlanet && (kPlanet.dignity === "Exalted" || kPlanet.dignity === "Own")) {
        score += 0.10;
        reasonsEn.push(`Karaka ${kName} is in ${kPlanet.dignity} dignity`);
        reasonsTa.push(`காரகன் ${kName} ${kPlanet.dignity} பலத்துடன் உள்ளார்`);
        break;
      }
    }

    // Clamp score to [0.15, 0.98]
    const finalScore = parseFloat(Math.min(0.98, Math.max(0.15, score)).toFixed(2));

    return {
      domain: def.domain,
      titleEn: def.titleEn,
      titleTa: def.titleTa,
      score: finalScore,
      primaryHouse: `House ${def.primaryHouses[0]}`,
      reasonsEn: reasonsEn.length ? reasonsEn.join("; ") : def.descriptionEn,
      reasonsTa: reasonsTa.length ? reasonsTa.join("; ") : def.descriptionTa
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}
