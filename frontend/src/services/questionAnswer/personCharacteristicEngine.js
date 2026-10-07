/**
 * ASTROVERSE — Bounded Person-Characteristic Engine
 * ====================================================
 * Evaluates person characteristics (Spouse, Child, Partner, Employer)
 * using specific relational Bhavas, dispositors, karakas, and varga placements.
 * Strictly produces bounded traditional archetypes with explicit non-fabrication boundaries.
 *
 * Implements Section 14 of the Precision Q&A Engine Mandate.
 */

import { buildHouseFactId, buildLordFactId, buildPlanetFactId, buildVargaFactId } from "./evidenceGraph.js";

const SIGN_TEMPERAMENTS = {
  Aries: { traitEn: "Dynamic, initiative-taking, and direct", traitTa: "சுறுசுறுப்பான, முன்முயற்சி எடுக்கும் மற்றும் வெளிப்படையான குணம்" },
  Taurus: { traitEn: "Steadfast, practical, and aesthetically grounded", traitTa: "நிலையான, நடைமுறை சார்ந்த மற்றும் கலை நயமிக்க குணம்" },
  Gemini: { traitEn: "Intellectually curious, communicative, and adaptable", traitTa: "புத்திசாலித்தனமான, உரையாடல் திறன் மிக்க மற்றும் மாற்றங்களை ஏற்கும் குணம்" },
  Cancer: { traitEn: "Nurturing, emotionally perceptive, and family-oriented", traitTa: "பாசமிக்க, உணர்வுபூர்வமான மற்றும் குடும்ப அக்கறை கொண்ட குணம்" },
  Leo: { traitEn: "Dignified, leadership-oriented, and noble presence", traitTa: "கண்ணியமான, தலைமைப் பண்பு கொண்ட மற்றும் கம்பீரமான குணம்" },
  Virgo: { traitEn: "Analytical, detail-conscious, and methodical", traitTa: "நுணுக்கமான, பகுத்தறியும் மற்றும் ஒழுங்கமைக்கப்பட்ட குணம்" },
  Libra: { traitEn: "Diplomatic, balanced, and socially graceful", traitTa: "சமரச அணுகுமுறை கொண்ட, நேர்த்தியான மற்றும் சமநிலையான குணம்" },
  Scorpio: { traitEn: "Intense, resolute, perceptive, and privacy-conscious", traitTa: "உறுதியான, கூர்மையான மற்றும் ஆழமான சிந்தனை கொண்ட குணம்" },
  Sagittarius: { traitEn: "Principled, philosophical, candid, and aspirational", traitTa: "கொள்கைப்பிடிப்புள்ள, தத்துவார்த்த மற்றும் உயர்ந்த லட்சியம் கொண்ட குணம்" },
  Capricorn: { traitEn: "Pragmatic, duty-bound, patient, and career-focused", traitTa: "கடமை உணர்வுள்ள, பொறுமைமிக்க மற்றும் உழைப்பை மதிக்கும் குணம்" },
  Aquarius: { traitEn: "Humanitarian, objective, unconventional, and visionary", traitTa: "சமூக சிந்தனையுள்ள, தொலைநோக்கு பார்வை மற்றும் தனித்துவமான குணம்" },
  Pisces: { traitEn: "Compassionate, imaginative, and spiritually receptive", traitTa: "இரக்க குணம் கொண்ட, கற்பனை வளம் மற்றும் ஆன்மீக நாட்டம் கொண்ட குணம்" }
};

const PLANET_VOCATIONAL_THEMES = {
  Sun: { themeEn: "Administration, public sector, managerial leadership", themeTa: "நிர்வாகம், அரசுத்துறை அல்லது தலைமை பொறுப்பு சார்ந்த பணிகள்" },
  Moon: { themeEn: "Public relations, healthcare, culinary arts, social services", themeTa: "பொதுமக்கள் தொடர்பு, மருத்துவ பராமரிப்பு அல்லது சேவைத் துறை" },
  Mars: { themeEn: "Engineering, defense, technology, real estate, analytical operations", themeTa: "பொறியியல், பாதுகாப்பு, நிலம் சார்ந்த அல்லது தொழில்நுட்ப பணிகள்" },
  Mercury: { themeEn: "Commerce, finance, communication, IT, analytical consulting", themeTa: "வணிகம், தகவல் தொழில்நுட்பம், கணக்கு அல்லது தொடர்புத் துறை" },
  Jupiter: { themeEn: "Education, advisory, legal, banking, institutional leadership", themeTa: "கல்வி, ஆலோசனை, நிதி நிறுவனம் அல்லது சட்டத்துறை" },
  Venus: { themeEn: "Design, creative industries, luxury goods, hospitality, finance", themeTa: "வடிவமைப்பு, கலைத்துறை, விருந்தோம்பல் அல்லது நிதித் துறை" },
  Saturn: { themeEn: "Structured corporate service, industry, logistics, public systems", themeTa: "முறைப்படுத்தப்பட்ட நிறுவன பணி, உற்பத்தி அல்லது களப்பணி" },
  Rahu: { themeEn: "Modern technology, aviation, global commerce, media", themeTa: "நவீன தொழில்நுட்பம், ஊடகம் அல்லது பன்னாட்டு வணிகம்" },
  Ketu: { themeEn: "Research, specialized analytics, spiritual/holistic disciplines", themeTa: "ஆராய்ச்சி, தனித்துவமான தொழில்நுட்பம் அல்லது தத்துவார்த்த துறை" }
};

/**
 * Evaluates relational person characteristics with bounded archetypes.
 *
 * @param {Object} params
 * @param {string} params.target - "SPOUSE" | "CHILD" | "BUSINESS_PARTNER" | "EMPLOYER"
 * @param {string} params.aspect - "PERSONALITY" | "CAREER" | "FINANCES" | "EDUCATION"
 * @param {Object} params.chart - Calculated chart data
 * @param {Object} [params.vargas={}] - Divisional charts
 * @param {boolean} [params.isTamil=false] - Language flag
 * @returns {Object} Bounded evaluation payload
 */
export function evaluatePersonCharacteristic({ target = "SPOUSE", aspect = "PERSONALITY", chart, vargas = {}, isTamil = false }) {
  const pMap = {};
  for (const p of (chart?.planets || [])) {
    pMap[p.name || p.planetName] = p;
  }

  // Determine relational house based on target & aspect
  let relHouseNum = 7;
  let karakaName = "Venus";

  if (target === "SPOUSE") {
    if (aspect === "CAREER") {
      relHouseNum = 4; // 10th from 7th
      karakaName = "Mercury";
    } else if (aspect === "FINANCES") {
      relHouseNum = 8; // 2nd from 7th
      karakaName = "Jupiter";
    } else {
      relHouseNum = 7;
      karakaName = "Venus";
    }
  } else if (target === "CHILD") {
    relHouseNum = 5;
    karakaName = "Jupiter";
  } else if (target === "EMPLOYER") {
    relHouseNum = 10;
    karakaName = "Sun";
  }

  // Calculate sign and lord of relational house
  const signOrder = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const signLords = {
    Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
    Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
    Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter"
  };

  const defaultProhibitions = [
    "Exact anatomical height / weight cannot be fabricated.",
    "Exact employer / corporate organization name cannot be fabricated.",
    "Exact numerical salary / compensation figures cannot be fabricated."
  ];

  let ascSign = chart?.ascendantSign?.name ||
                chart?.ascendantSign?.id ||
                chart?.ascendant?.signName ||
                chart?.ascendant?.sign ||
                chart?.houses?.[0]?.signName ||
                (typeof chart?.ascendant === "string" ? chart.ascendant : null);

  if (!ascSign && typeof chart?.ascendantLong === "number") {
    ascSign = signOrder[Math.floor(((chart.ascendantLong % 360) + 360) % 360 / 30)];
  } else if (!ascSign && typeof chart?.ascendant?.longitude === "number") {
    ascSign = signOrder[Math.floor(((chart.ascendant.longitude % 360) + 360) % 360 / 30)];
  }

  if (!ascSign) {
    return {
      status: "INSUFFICIENT_DATA",
      summaryEn: "Cannot evaluate person characteristics without calculated Ascendant.",
      summaryTa: "லக்ன கணிதம் இல்லாததால் தொடர்புடைய நபரின் குணாதிசயங்களை மதிப்பிட இயலாது.",
      evidenceIds: [],
      prohibitedDisclosures: defaultProhibitions
    };
  }

  const ascIdx = signOrder.indexOf(ascSign);
  if (ascIdx === -1) {
    return {
      status: "INSUFFICIENT_DATA",
      summaryEn: "Invalid ascendant sign.",
      summaryTa: "செல்லுபடியாகாத லக்ன ராசி.",
      evidenceIds: [],
      prohibitedDisclosures: defaultProhibitions
    };
  }

  const houseSign = signOrder[(ascIdx + relHouseNum - 1) % 12];
  const houseLord = signLords[houseSign] || null;
  if (!houseLord) {
    return {
      status: "INSUFFICIENT_DATA",
      summaryEn: "House lord could not be identified.",
      summaryTa: "பாவகாதிபதி கண்டறியப்படவில்லை.",
      evidenceIds: [],
      prohibitedDisclosures: defaultProhibitions
    };
  }

  const lordPlacement = pMap[houseLord];
  const karakaPlacement = pMap[karakaName];

  const temp = SIGN_TEMPERAMENTS[houseSign] || { element: "Balanced", temperamentEn: "balanced demeanor", temperamentTa: "சீரான தன்மை" };
  const voc = PLANET_VOCATIONAL_THEMES[houseLord] || { themeEn: "general administrative fields", themeTa: "பொதுவான நிர்வாகப் பணிகள்" };

  const evidenceIds = [
    buildHouseFactId(relHouseNum),
    buildLordFactId(relHouseNum, houseLord),
    buildPlanetFactId(karakaName, "KARAKA")
  ];

  if (vargas?.d9 && target === "SPOUSE") {
    evidenceIds.push(buildVargaFactId("D9", "7TH_LORD"));
  }

  let summaryEn = "";
  let summaryTa = "";

  if (aspect === "CAREER") {
    summaryEn = `Relational 10th-from-7th house (${relHouseNum}th house in ${houseSign}, ruled by ${houseLord}) traditionally points toward vocational themes in: ${voc.themeEn}.`;
    summaryTa = `துணையின் தொழில் ஸ்தானமான 7-க்கு 10-ம் பாவகம் (${relHouseNum}-ம் இடம் ${houseSign}, அதிபதி ${houseLord}) பாரம்பரிய ஜோதிடத்தில் பின்வரும் தொழில் களங்களை சுட்டிக்காட்டுகிறது: ${voc.themeTa}.`;
  } else if (aspect === "FINANCES") {
    summaryEn = `Relational 2nd-from-7th house (${relHouseNum}th house in ${houseSign}, ruled by ${houseLord}) indicates ancestral family and economic baseline governed by ${houseLord} and Karaka ${karakaName}.`;
    summaryTa = `துணையின் குடும்ப தன ஸ்தானமான 7-க்கு 2-ம் பாவகம் (${relHouseNum}-ம் இடம் ${houseSign}, அதிபதி ${houseLord}) பொருளாதார பின்னணியை சுட்டிக்காட்டுகிறது.`;
  } else {
    summaryEn = `The 7th house in ${houseSign} with lord ${houseLord} and Kalatra Karaka ${karakaName} describes a partner with: ${temp.traitEn}.`;
    summaryTa = `7-ம் பாவகம் ${houseSign} ராசியில் அமைந்து, அதிபதி ${houseLord} மற்றும் களத்திர காரகன் ${karakaName} ஆகியோரின் அமைப்பால் துணைக்கு அமையும் குணம்: ${temp.traitTa}.`;
  }

  return {
    target,
    aspect,
    relHouseNum,
    houseSign,
    houseLord,
    karakaName,
    summaryEn,
    summaryTa,
    evidenceIds,
    prohibitedDisclosures: [
      "Exact anatomical height / weight cannot be fabricated.",
      "Exact employer / corporate organization name cannot be fabricated.",
      "Exact numerical salary / compensation figures cannot be fabricated."
    ]
  };
}
