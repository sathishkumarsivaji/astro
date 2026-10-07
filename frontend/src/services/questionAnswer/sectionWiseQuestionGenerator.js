/**
 * ASTROVERSE — Dynamic Section-Wise Report Q&A Generator
 * ========================================================
 * Generates dynamically adapted suggested questions for each report section
 * (Marriage, Career, Property, Finance) customized to actual chart configurations.
 *
 * Implements Section 20 of the Precision Q&A Engine Mandate.
 */

/**
 * Generates dynamically adapted questions for a given report section.
 *
 * @param {string} section - "marriage" | "career" | "property" | "finance"
 * @param {Object} chart - Calculated chart data
 * @param {string} [lang="en"] - "en" | "ta"
 * @returns {Array<Object>} Array of suggested questions
 */
export function generateSectionQuestions(section = "marriage", chart = null, lang = "en") {
  const isTamil = lang === "ta";
  const pMap = {};
  for (const p of (chart?.planets || [])) {
    pMap[p.name || p.planetName] = p;
  }

  const normalizedSection = (section || "marriage").toLowerCase();

  // =========================================================================
  // 1. MARRIAGE & RELATIONSHIPS SECTION
  // =========================================================================
  if (normalizedSection.includes("marriage") || normalizedSection.includes("relationship")) {
    const questions = [
      {
        id: "MARRIAGE_Q1",
        questionEn: "When is marriage most likely according to my dasha timeline?",
        questionTa: "எனது தசா காலக்கோட்டின்படி திருமணம் எப்போது நடைபெற வாய்ப்புள்ளது?",
        intent: "TIMING"
      },
      {
        id: "MARRIAGE_Q2",
        questionEn: "Is marriage indicated as early, average, or delayed?",
        questionTa: "திருமணம் விரைவில், சராசரியாக அல்லது காலதாமதமாக அமையுமா?",
        intent: "GENERAL_INTERPRETATION"
      },
      {
        id: "MARRIAGE_Q3",
        questionEn: "What personality traits are indicated for my future spouse?",
        questionTa: "எனது வருங்கால துணையின் குணநலன்கள் எவ்வாறு அமையும்?",
        intent: "SPOUSE_CHARACTERISTICS"
      },
      {
        id: "MARRIAGE_Q4",
        questionEn: "Will my spouse have a job or independent career?",
        questionTa: "எனது துணை உத்தியோகம் அல்லது சுயதொழில் செய்பவராக இருப்பாரா?",
        intent: "SPOUSE_CHARACTERISTICS"
      },
      {
        id: "MARRIAGE_Q5",
        questionEn: "Will my spouse come from a wealthy family background?",
        questionTa: "துணையின் குடும்பம் என்னை விட வசதியான குடும்பமாக அமையுமா?",
        intent: "SPOUSE_FAMILY"
      },
      {
        id: "MARRIAGE_Q6",
        questionEn: "What direction or geographic connection is indicated for my spouse?",
        questionTa: "துணை அமையும் திசை மற்றும் இருப்பிட தொடர்பு என்ன?",
        intent: "SPOUSE_DIRECTION"
      },
      {
        id: "MARRIAGE_Q7",
        questionEn: "What astrological evidence supports the marriage timing conclusion?",
        questionTa: "திருமண காலக்கட்ட கணிப்பை உறுதிப்படுத்தும் ஜோதிட சான்றுகள் யாவை?",
        intent: "WHY_QUESTION"
      }
    ];

    // Dynamic Chart-Specific Adaptations
    if (pMap["Saturn"]?.house === 7 || pMap["Saturn"]?.sign === "Leo") {
      questions.push({
        id: "MARRIAGE_DYN_SATURN",
        questionEn: "How does Saturn's connection to the 7th house affect marriage timing?",
        questionTa: "7-ம் பாவகத்துடன் சனியின் தொடர்பு திருமண காலத்தை எவ்வாறு மாற்றுகிறது?",
        intent: "WHY_QUESTION",
        dynamicFactor: "SATURN_7TH_HOUSE"
      });
    }
    if (pMap["Venus"]?.dignity === "Exalted") {
      questions.push({
        id: "MARRIAGE_DYN_VENUS",
        questionEn: "How does exalted Venus in your chart enhance relational harmony?",
        questionTa: "உச்சம் பெற்ற சுக்கிர பகவான் உங்கள் தாம்பத்திய நல்லிணக்கத்தை எவ்வாறு உயர்த்துகிறார்?",
        intent: "PLANET_INTERPRETATION",
        dynamicFactor: "EXALTED_VENUS"
      });
    }

    return questions;
  }

  // =========================================================================
  // 2. CAREER & VOCATION SECTION
  // =========================================================================
  if (normalizedSection.includes("career") || normalizedSection.includes("job") || normalizedSection.includes("work")) {
    const questions = [
      {
        id: "CAREER_Q1",
        questionEn: "Which career direction is best aligned with my chart potential?",
        questionTa: "எனது ஜாதக அமைப்புக்கு சிறந்த தொழில் துறை எது?",
        intent: "CAREER"
      },
      {
        id: "CAREER_Q2",
        questionEn: "Am I better suited for government service, private corporate, or business?",
        questionTa: "அரசுப்பணி, தனியார் உத்தியோகம் அல்லது சுயதொழில் - இதில் எது சிறந்தது?",
        intent: "COMPARISON"
      },
      {
        id: "CAREER_Q3",
        questionEn: "When is the next favorable window for a job transition or promotion?",
        questionTa: "வேலை மாற்றம் அல்லது பதவி உயர்வுக்கு அடுத்த சாதகமான காலம் எப்போது?",
        intent: "TIMING"
      },
      {
        id: "CAREER_Q4",
        questionEn: "Are there foreign employment or overseas opportunities indicated?",
        questionTa: "வெளிநாட்டு வேலை அல்லது வெளிநாடு செல்லும் யோகம் உள்ளதா?",
        intent: "FOREIGN_TRAVEL"
      },
      {
        id: "CAREER_Q5",
        questionEn: "What are the strongest career milestone years in the next decade?",
        questionTa: "அடுத்த பத்தாண்டுகளில் எனது தொழிலில் மிகப்பெரிய திருப்புமுனை ஆண்டுகள் எவை?",
        intent: "MAJOR_MILESTONE"
      }
    ];

    // Dynamic Chart-Specific Adaptations
    if (pMap["Sun"]?.dignity === "Exalted" || pMap["Sun"]?.house === 10) {
      questions.push({
        id: "CAREER_DYN_SUN",
        questionEn: "Does the prominent Sun placement indicate leadership or government authority?",
        questionTa: "சூரியனின் வலுவான நிலை தலைமைப் பொறுப்பு அல்லது அரசு அதிகாரத்தை சுட்டிக்காட்டுகிறதா?",
        intent: "LEADERSHIP",
        dynamicFactor: "PROMINENT_SUN_10TH"
      });
    }

    return questions;
  }

  // =========================================================================
  // 3. PROPERTY & REAL ESTATE SECTION
  // =========================================================================
  if (normalizedSection.includes("property") || normalizedSection.includes("asset")) {
    return [
      {
        id: "PROP_Q1",
        questionEn: "Is property or real estate acquisition supported in my chart?",
        questionTa: "எனது ஜாதகத்தில் வீடு அல்லது நிலம் வாங்கும் யோகம் உள்ளதா?",
        intent: "PROPERTY"
      },
      {
        id: "PROP_Q2",
        questionEn: "Does the chart favor purchasing open land or a constructed apartment?",
        questionTa: "நிலம் வாங்குவது நல்லதா அல்லது கட்டப்பட்ட வீடு வாங்குவது நல்லதா?",
        intent: "COMPARISON"
      },
      {
        id: "PROP_Q3",
        questionEn: "When is the strongest timing window for purchasing property?",
        questionTa: "சொத்து வாங்குவதற்கு மிக சாதகமான காலக்கட்டம் எப்போது?",
        intent: "TIMING"
      },
      {
        id: "PROP_Q4",
        questionEn: "Will property acquisition be supported through mortgage or personal savings?",
        questionTa: "சொத்து சேர்க்கை கடன் மூலமாக அமையுமா அல்லது சேமிப்பு மூலமாகவா?",
        intent: "FINANCE"
      }
    ];
  }

  // =========================================================================
  // 4. FINANCE & WEALTH SECTION
  // =========================================================================
  return [
    {
      id: "FIN_Q1",
      questionEn: "What is the long-term wealth accumulation potential of my chart?",
      questionTa: "நீண்ட கால அடிப்படையில் எனது நிதி மற்றும் செல்வ வளர்ச்சி எவ்வாறு இருக்கும்?",
      intent: "FINANCE"
    },
    {
      id: "FIN_Q2",
      questionEn: "When are the strongest income growth periods indicated?",
      questionTa: "வருமான உயர்வுக்கான மிக வலுவான காலக்கட்டங்கள் எவை?",
      intent: "TIMING"
    },
    {
      id: "FIN_Q3",
      questionEn: "What cautionary financial periods require disciplined expense control?",
      questionTa: "நிதி விவகாரங்களில் மிகுந்த கவனத்துடன் செயல்பட வேண்டிய காலகட்டங்கள் எவை?",
      intent: "CAUTION"
    }
  ];
}
