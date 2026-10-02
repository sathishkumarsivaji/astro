/**
 * Traditional Body-Region Correspondence Registry
 * Maps astrological indicators to traditional body regions for safe wellness predictions.
 */

export const BODY_REGION_REGISTRY = [
  {
    id: "HEAD_BRAIN",
    labelEn: "Head / Brain region",
    labelTa: "தலை / மூளை பகுதி",
    associatedSigns: [0],        // Aries = index 0
    associatedHouses: [1],
    associatedPlanets: ["Sun", "Mars"],
    safeDescriptionEn: "Traditional Jyotisha body-region correspondence places greater symbolic emphasis on the head/brain region during this period.",
    safeDescriptionTa: "இந்த காலகட்டத்தில் பாரம்பரிய ஜோதிட உடல்-பகுதி தொடர்பு தலை/மூளை பகுதி மீது அதிக குறியீட்டு முக்கியத்துவம் அளிக்கிறது."
  },
  {
    id: "EYES",
    labelEn: "Eyes / Vision",
    labelTa: "கண்கள் / பார்வை",
    associatedSigns: [0],
    associatedHouses: [2, 12],
    associatedPlanets: ["Sun", "Moon"],
    safeDescriptionEn: "Greater symbolic emphasis is placed on the eyes and vision region.",
    safeDescriptionTa: "கண்கள் மற்றும் பார்வை பகுதிக்கு குறியீட்டு முக்கியத்துவம் அளிக்கப்படுகிறது."
  },
  {
    id: "EARS",
    labelEn: "Ears / Hearing",
    labelTa: "காதுகள் / கேட்டல்",
    associatedSigns: [2],        // Gemini
    associatedHouses: [3, 11],
    associatedPlanets: ["Mercury"],
    safeDescriptionEn: "Greater symbolic emphasis is placed on the ears and hearing region.",
    safeDescriptionTa: "காதுகள் மற்றும் கேட்கும் திறன் பகுதிக்கு முக்கியத்துவம் அளிக்கப்படுகிறது."
  },
  {
    id: "THROAT_NECK",
    labelEn: "Throat / Neck",
    labelTa: "தொண்டை / கழுத்து",
    associatedSigns: [1],        // Taurus
    associatedHouses: [2, 3],
    associatedPlanets: ["Venus"],
    safeDescriptionEn: "The throat and neck region is highlighted in traditional correspondences.",
    safeDescriptionTa: "தொண்டை மற்றும் கழுத்துப் பகுதி பாரம்பரிய தொடர்புகளில் முன்னிலைப்படுத்தப்படுகிறது."
  },
  {
    id: "CHEST_RESPIRATORY",
    labelEn: "Chest / Respiratory",
    labelTa: "மார்பு / சுவாச பகுதி",
    associatedSigns: [2, 3],     // Gemini, Cancer
    associatedHouses: [4],
    associatedPlanets: ["Moon", "Mercury"],
    safeDescriptionEn: "The chest and respiratory systems receive astrological focus.",
    safeDescriptionTa: "மார்பு மற்றும் சுவாச அமைப்புகளுக்கு ஜோதிட கவனம் செலுத்தப்படுகிறது."
  },
  {
    id: "HEART",
    labelEn: "Heart / Cardiovascular",
    labelTa: "இதயம் / இருதய அமைப்பு",
    associatedSigns: [4],        // Leo
    associatedHouses: [5],
    associatedPlanets: ["Sun"],
    safeDescriptionEn: "The heart and cardiovascular region is emphasized.",
    safeDescriptionTa: "இதயம் மற்றும் இருதயப் பகுதி வலியுறுத்தப்படுகிறது."
  },
  {
    id: "STOMACH",
    labelEn: "Stomach / Digestion",
    labelTa: "வயிறு / செரிமானம்",
    associatedSigns: [5],        // Virgo
    associatedHouses: [5, 6],
    associatedPlanets: ["Sun", "Jupiter"],
    safeDescriptionEn: "Traditional focus is placed on the stomach and digestive regions.",
    safeDescriptionTa: "வயிறு மற்றும் செரிமானப் பகுதிகளில் பாரம்பரிய கவனம் செலுத்தப்படுகிறது."
  },
  {
    id: "LIVER",
    labelEn: "Liver",
    labelTa: "கல்லீரல்",
    associatedSigns: [8],        // Sagittarius
    associatedHouses: [5, 9],
    associatedPlanets: ["Jupiter"],
    safeDescriptionEn: "The liver region requires attention according to classical texts.",
    safeDescriptionTa: "பழமையான நூல்களின்படி கல்லீரல் பகுதிக்கு கவனம் தேவை."
  },
  {
    id: "ABDOMEN",
    labelEn: "Lower Abdomen",
    labelTa: "கீழ் வயிறு",
    associatedSigns: [5],        // Virgo
    associatedHouses: [6],
    associatedPlanets: ["Mercury"],
    safeDescriptionEn: "The lower abdomen is highlighted in traditional charts.",
    safeDescriptionTa: "கீழ் வயிறு பாரம்பரிய வரைபடங்களில் முன்னிலைப்படுத்தப்படுகிறது."
  },
  {
    id: "KIDNEYS_URINARY",
    labelEn: "Kidneys / Urinary",
    labelTa: "சிறுநீரகம் / சிறுநீர் அமைப்பு",
    associatedSigns: [6],        // Libra
    associatedHouses: [7],
    associatedPlanets: ["Venus"],
    safeDescriptionEn: "Symbolic emphasis on the kidneys and urinary tract.",
    safeDescriptionTa: "சிறுநீரகம் மற்றும் சிறுநீர் பாதைக்கு குறியீட்டு முக்கியத்துவம்."
  },
  {
    id: "REPRODUCTIVE",
    labelEn: "Reproductive System",
    labelTa: "இனப்பெருக்க அமைப்பு",
    associatedSigns: [7],        // Scorpio
    associatedHouses: [7, 8],
    associatedPlanets: ["Venus", "Mars"],
    safeDescriptionEn: "The reproductive system region receives focus.",
    safeDescriptionTa: "இனப்பெருக்க அமைப்புப் பகுதிக்கு கவனம் செலுத்தப்படுகிறது."
  },
  {
    id: "SPINE_BONES",
    labelEn: "Spine / Bones",
    labelTa: "முதுகெலும்பு / எலும்புகள்",
    associatedSigns: [9],        // Capricorn
    associatedHouses: [10],
    associatedPlanets: ["Saturn", "Sun"],
    safeDescriptionEn: "The skeletal system and spine region are emphasized.",
    safeDescriptionTa: "எலும்புக்கூடு அமைப்பு மற்றும் முதுகெலும்பு பகுதி வலியுறுத்தப்படுகிறது."
  },
  {
    id: "JOINTS",
    labelEn: "Joints / Knees",
    labelTa: "மூட்டுகள் / முழங்கால்கள்",
    associatedSigns: [9],        // Capricorn
    associatedHouses: [10],
    associatedPlanets: ["Saturn"],
    safeDescriptionEn: "Emphasis is placed on the joints and knees.",
    safeDescriptionTa: "மூட்டுகள் மற்றும் முழங்கால்களுக்கு முக்கியத்துவம் அளிக்கப்படுகிறது."
  },
  {
    id: "SKIN",
    labelEn: "Skin",
    labelTa: "தோல்",
    associatedSigns: [9, 10],    // Capricorn, Aquarius
    associatedHouses: [6],
    associatedPlanets: ["Saturn", "Mercury"],
    safeDescriptionEn: "The skin and integumentary region are symbolically active.",
    safeDescriptionTa: "தோல் பகுதி குறியீட்டு ரீதியாக செயலில் உள்ளது."
  },
  {
    id: "MUSCLES",
    labelEn: "Muscular System",
    labelTa: "தசை அமைப்பு",
    associatedSigns: [0, 7],     // Aries, Scorpio
    associatedHouses: [3, 6],
    associatedPlanets: ["Mars"],
    safeDescriptionEn: "The muscular system is highlighted.",
    safeDescriptionTa: "தசை அமைப்பு முன்னிலைப்படுத்தப்படுகிறது."
  },
  {
    id: "NERVES",
    labelEn: "Nervous System",
    labelTa: "நரம்பு மண்டலம்",
    associatedSigns: [2, 5],     // Gemini, Virgo
    associatedHouses: [3],
    associatedPlanets: ["Mercury", "Ketu"],
    safeDescriptionEn: "The nervous system region is in focus.",
    safeDescriptionTa: "நரம்பு மண்டலப் பகுதிக்கு கவனம் செலுத்தப்படுகிறது."
  },
  {
    id: "BLOOD_CIRCULATION",
    labelEn: "Blood Circulation",
    labelTa: "இரத்த ஓட்டம்",
    associatedSigns: [4, 10],    // Leo, Aquarius
    associatedHouses: [11],
    associatedPlanets: ["Mars", "Sun", "Moon"],
    safeDescriptionEn: "Blood and circulatory rhythms receive attention.",
    safeDescriptionTa: "இரத்தம் மற்றும் சுழற்சி தாளங்களுக்கு கவனம் செலுத்தப்படுகிறது."
  },
  {
    id: "FEET_LOWER_LIMBS",
    labelEn: "Feet / Lower Limbs",
    labelTa: "பாதங்கள் / கீழ் முனைகள்",
    associatedSigns: [11],       // Pisces
    associatedHouses: [12],
    associatedPlanets: ["Saturn", "Jupiter"],
    safeDescriptionEn: "The feet and lower limbs are symbolically emphasized.",
    safeDescriptionTa: "பாதங்கள் மற்றும் கீழ் முனைகள் குறியீட்டு ரீதியாக வலியுறுத்தப்படுகின்றன."
  }
];

/**
 * Returns body regions associated with the given planets.
 * @param {string[]} planetNames - Array of planet names
 * @returns {Object[]} Matching body regions
 */
export function getBodyRegionsForPlanets(planetNames) {
  if (!planetNames || !planetNames.length) return [];
  return BODY_REGION_REGISTRY.filter(region => 
    region.associatedPlanets.some(p => planetNames.includes(p))
  );
}

/**
 * Returns body regions associated with the given houses.
 * @param {number[]} houseNums - Array of house numbers (1-12)
 * @param {number} lagnaSignIdx - Index of Lagna sign (0-11)
 * @returns {Object[]} Matching body regions
 */
export function getBodyRegionsForHouses(houseNums, lagnaSignIdx) {
  if (!houseNums || !houseNums.length) return [];
  return BODY_REGION_REGISTRY.filter(region => {
    // Check direct house association
    if (region.associatedHouses.some(h => houseNums.includes(h))) {
      return true;
    }
    // Check sign association based on house placement from lagna
    const signIndices = houseNums.map(h => (lagnaSignIdx + h - 1) % 12);
    return region.associatedSigns.some(s => signIndices.includes(s));
  });
}
