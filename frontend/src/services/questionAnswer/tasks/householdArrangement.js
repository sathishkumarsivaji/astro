/**
 * SKR ASTRO — Household Residence Arrangement Task Evaluator
 * =============================================================
 * Evaluates questions regarding joint family living vs independent / nuclear household.
 *
 * Implements strict non-negotiable rules:
 * - Fail-closed: returns INSUFFICIENT_DATA with zero calculated facts if chart data is missing.
 * - Uses canonical chart accessors (never assumes array indices or default signs).
 * - Implements three-valued evidence evaluation (PRESENT, ABSENT_AFTER_EVALUATION, UNKNOWN).
 * - Absence of separative markers is NOT proof of joint family: living arrangements depend
 *   on workplace geography, housing affordability, and mutual personal decisions.
 * - NEVER substitutes D10 career commentary or vocational prestige for household residence inquiries.
 */

import { getHouseByNumber, getPlanetByName, hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

export function evaluateHouseholdArrangement({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_HOUSEHOLD_ARRANGEMENT";

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "HOUSEHOLD_RESIDENCE_ARRANGEMENT",
      taskType: "DOMESTIC_LIVING_ARRANGEMENT",
      isTamil,
      missingInputs: ["birthChart", "bhavasDetailed"],
      traditionalMethod: "4th/2nd/12th Bhava and Moon-Nodal Influence Analysis",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate household living arrangement. Accurate evaluation requires calculated 4th house (domestic residence) and 2nd house (kutumba) positions from a verified birth chart.",
      customDirectAnswerTa: "வசிப்பிட அமைப்பை (கூட்டுக் குடும்பம் அல்லது தனிக்குடித்தனம்) மதிப்பிட தேவையான 4-ம் பாவகம் மற்றும் குடும்ப ஸ்தானமான 2-ம் பாவகத்தின் கணக்கீட்டுத் தரவுகள் கிடைக்கவில்லை. பிறப்பு விவரங்களின் அடிப்படையிலான ஜாதகக் கணிப்பு அவசியமாகும்."
    });
  }

  const chart = context.chartData || context.chart || context;
  const h4 = getHouseByNumber(chart, 4);
  const h2 = getHouseByNumber(chart, 2);
  const h12 = getHouseByNumber(chart, 12);

  if (!h4 || !h2) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "HOUSEHOLD_RESIDENCE_ARRANGEMENT",
      taskType: "DOMESTIC_LIVING_ARRANGEMENT",
      isTamil,
      missingInputs: ["4thHouse", "2ndHouse"],
      traditionalMethod: "4th/2nd/12th Bhava and Moon-Nodal Influence Analysis",
      customDirectAnswerEn: "The 4th house of domestic residence or 2nd house of family unit is missing from the calculated chart data.",
      customDirectAnswerTa: "ஜாதகக் கணிப்பில் 4-ம் வசிப்பிட பாவகம் அல்லது 2-ம் குடும்ப பாவகம் விடுபட்டுள்ளது."
    });
  }

  const moon = getPlanetByName(chart, "Moon");
  const rahu = getPlanetByName(chart, "Rahu");
  const saturn = getPlanetByName(chart, "Saturn");

  const h4Sign = h4.sign || h4.signName || "4th Bhava";
  const h4Lord = h4.lord || h4.lordName || h4.ruler || null;
  const h2Sign = h2.sign || h2.signName || "2nd Bhava";
  const h2Lord = h2.lord || h2.lordName || h2.ruler || null;

  // Check nodal or separative planet connection to 4th / 12th house
  const rahuHouse = rahu?.house ?? rahu?.bhava ?? null;
  const saturnHouse = saturn?.house ?? saturn?.bhava ?? null;
  const h4Occupants = Array.isArray(h4.occupants) ? h4.occupants : [];

  let separativeStatus = "UNKNOWN";
  const hasEvaluatablePositions = (rahuHouse !== null && saturnHouse !== null) || h4Occupants.length > 0;
  if (rahu && saturn && hasEvaluatablePositions) {
    const isRahuSeparative = rahuHouse === 4 || rahuHouse === 12 || h4Occupants.some(o => /rahu|ராகு/i.test(String(o)));
    const isSaturnSeparative = saturnHouse === 4 || h4Occupants.some(o => /saturn|சனி/i.test(String(o)));
    separativeStatus = (isRahuSeparative || isSaturnSeparative) ? "PRESENT" : "ABSENT_AFTER_EVALUATION";
  } else {
    separativeStatus = "UNKNOWN";
  }

  const calculatedFacts = [
    { id: "FACT_H4_DOMESTIC_ROOTS", factor: "4th House (Domestic Residence)", sign: h4Sign, ...(h4Lord ? { lord: h4Lord } : {}) },
    { id: "FACT_H2_FAMILY_UNIT", factor: "2nd House (Kutumba)", sign: h2Sign, ...(h2Lord ? { lord: h2Lord } : {}) },
    ...(moon ? [{ id: "FACT_MOON_MATRU_SUKHA", factor: "Moon (Matru/Sukha Karaka)", dignity: moon.dignity || "NATAL" }] : []),
    { id: "FACT_INDEPENDENT_INDICATORS", factor: "Independent Residence Influences", value: separativeStatus }
  ];

  const traditionalRules = [
    { id: "RULE_4TH_HOUSE_RESIDENCE", source: "Brihat Parashara Hora Shastra", text: "4th house and its lord determine residence, home environment, and domestic comfort (Sukha)." },
    { id: "RULE_NODAL_SEPARATIVE_TENDENCY", source: "Phaladeepika", text: "Rahu or Saturn influencing the 4th house or 4th lord traditionally indicates establishing a separate home away from ancestral roots." },
    { id: "RULE_NO_D10_SUBSTITUTION", source: "Methodological Standard", text: "D10 Dashamsha pertains strictly to professional status and must never be substituted for domestic living arrangements." },
    { id: "RULE_ABSENCE_OF_SEPARATION_NOT_GUARANTEE", source: "Methodological Standard", text: "Absence of separative indicators does not prove or force a joint family; physical workplace location and financial affordability govern living arrangements." }
  ];

  const limitation = isTamil
    ? "ஜோதிட குறியீடுகள் வசிப்பிட சூழலின் பாரம்பரிய போக்கை மட்டுமே சுட்டிக்காட்டும்; கணவன்-மனைவியின் பணியிட தூரம், வாடகை மற்றும் வீட்டு வசதி, நிதி நிலைமை, முதியோரைப் பராமரிக்கும் தேவை மற்றும் இருவரின் தனிப்பட்ட பரஸ்பர சம்மதமே உண்மையான வசிப்பிடத்தை தீர்மானிக்கும். தொழில் சார்ந்த பலன்கள் இதற்கு பதிலாக பயன்படுத்தப்படுவதில்லை."
    : "Astrological indications reflect traditional archetypes of independent establishment vs ancestral living. Actual living arrangements depend strictly on workplace geography, commuting distance, financial rent/purchase affordability, elder care requirements, and mutual consent between partners. Career commentary is never substituted for residential arrangement questions.";

  let directAnswer = "";
  let reason = "";

  if (separativeStatus === "PRESENT") {
    if (isTamil) {
      directAnswer = `உங்கள் ஜாதகத்தில் 4-ம் பாவகம் (${h4Sign}${h4Lord ? `, அதிபதி: ${h4Lord}` : ""}) மற்றும் 12-ம் பாவகங்களில் ராகு/சனியின் தாக்கம் காரணமாக, திருமணத்திற்குப் பிறகு கூட்டுக் குடும்பத்தை விட தனிக்குடித்தனம் அல்லது சுயேச்சையான தனி இல்ல அமைப்பிற்கான பாரம்பரிய குறியீடுகள் காணப்படுகின்றன. இந்த மதிப்பீடு முழுக்க இல்லற வசிப்பிடத்தை மட்டுமே சார்ந்தது.`;
      reason = "4-ம் பாவகத்தில் நிலவும் பிரிவினை காரக கிரக அமைப்புகள் சுயேச்சையான வசிப்பிட போக்கை சுட்டிக்காட்டுகின்றன.";
    } else {
      directAnswer = `In your chart, the 4th house of domestic residence (${h4Sign}${h4Lord ? `, ruled by ${h4Lord}` : ""}) exhibits separative planet influences (Rahu/Saturn), indicating a classical propensity toward establishing an independent nuclear household away from the joint parental home. This evaluation focuses strictly on domestic residence.`;
      reason = "4th house and domestic axis show traditional separative indicators favoring independent household establishment.";
    }
  } else if (separativeStatus === "ABSENT_AFTER_EVALUATION") {
    if (isTamil) {
      directAnswer = `உங்கள் ஜாதகத்தில் 4-ம் பாவகம் (${h4Sign}${h4Lord ? `, அதிபதி: ${h4Lord}` : ""}) மற்றும் குடும்ப ஸ்தானமான 2-ம் பாவகத்தில் கடுமையான பிரிவினை தாக்கங்கள் எதுவும் பதிவாகவில்லை. இருப்பினும், தனிக்குடித்தன குறியீடுகள் இல்லாதிருப்பது கூட்டுக் குடும்பத்தை கட்டாயப்படுத்தாது; தம்பதியரின் பணியிட அமைவிடம் மற்றும் நடைமுறை முடிவுகளே வசிப்பிடத்தை தீர்மானிக்கும்.`;
      reason = "4-ம் பாவகத்தில் பிரிவினை காரணிகள் ஆய்வுக்குப் பின் இல்லாதிருப்பது (ABSENT_AFTER_EVALUATION) உறுதி செய்யப்பட்டது.";
    } else {
      directAnswer = `In your chart, the 4th house of domestic residence (${h4Sign}${h4Lord ? `, ruled by ${h4Lord}` : ""}) shows an absence of strong separative afflictions. However, the absence of separative indicators does not guarantee or mandate a joint family; actual residence is governed by workplace location, housing logistics, and mutual personal decisions.`;
      reason = "Evaluation confirmed that separative afflictions to the 4th house are ABSENT_AFTER_EVALUATION, indicating relational flexibility rather than a predetermined joint family constraint.";
    }
  } else {
    if (isTamil) {
      directAnswer = `உங்கள் ஜாதகத்தில் 4-ம் பாவகம் (${h4Sign}) மற்றும் 2-ம் பாவக நிலைகள் கண்டறியப்பட்டாலும், வசிப்பிட பிரிவினை கிரக காரணிகள் முழுமையாக மதிப்பீடு செய்யப்படவில்லை.`;
      reason = "நிர்ணயிக்கப்பட்ட பிரிவினை காரணிகள் அறியப்படவில்லை (UNKNOWN).";
    } else {
      directAnswer = `In your chart, the 4th house (${h4Sign}) and 2nd house are mapped, but relevant nodal separative factors remain indeterminate.`;
      reason = "Nodal and separative factors could not be evaluated definitively (UNKNOWN).";
    }
  }

  return {
    questionId,
    intent: "HOUSEHOLD_RESIDENCE_ARRANGEMENT",
    taskType: "DOMESTIC_LIVING_ARRANGEMENT",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation,
    recommendation: {
      indicatedArrangement: separativeStatus === "PRESENT" ? "INDEPENDENT_HOUSEHOLD" : (separativeStatus === "ABSENT_AFTER_EVALUATION" ? "FLEXIBLE_ARRANGEMENT" : "INDETERMINATE"),
      summary: separativeStatus === "PRESENT" ? "Propensity for independent nuclear home" : "Dependent on workplace geography and mutual consent"
    },
    candidateWindows: [],
    timingResolution: null,
    supportingClaims: calculatedFacts.map(f => `${f.factor}: ${f.sign || f.value || f.dignity}`),
    limitingClaims: [limitation],
    missingInputs: [],
    traditionalMethod: "4th/2nd/12th Bhava and Moon-Nodal Influence Analysis",
    empiricalStatus: "NOT_VALIDATED",
    calculatedFacts,
    traditionalRules
  };
}
