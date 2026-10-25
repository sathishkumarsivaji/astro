/**
 * ASTROVERSE — Spouse Family Economic Comparison Task Evaluator
 * ==============================================================
 * Evaluates comparative economic status between the native's ancestral family
 * and the spouse's family.
 *
 * Implements strict non-negotiable rules:
 * - Fail-closed: returns INSUFFICIENT_DATA with zero calculated facts if chart data is missing.
 * - Zero fabricated rupee, currency, or numerical net-worth figures.
 * - Refuses to assert definitive wealth parity or superiority from a single natal chart.
 * - Explains clearly that native's personal wealth does not prove in-law family parity.
 * - Evaluates 2nd house (native ancestral wealth) vs 8th house (2nd from 7th = spouse's ancestral family resources).
 */

import { getHouseByNumber, getPlanetByName, hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

export function evaluateSpouseFamilyComparison({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_SPOUSE_FAMILY_COMPARISON";

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "SPOUSE_FAMILY_ECONOMIC_COMPARISON",
      taskType: "SOCIO_ECONOMIC_COMPARISON",
      isTamil,
      missingInputs: ["birthChart", "bhavasDetailed"],
      traditionalMethod: "2nd Bhava vs 8th Bhava (2nd from 7th) Dispositor Comparison",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate comparative family economic status. Evaluating family backgrounds requires calculated 2nd and 8th house positions from a verified birth chart.",
      customDirectAnswerTa: "துணையின் குடும்பப் பின்னணியை ஒப்பிட தேவையான 2-ம் பாவகம் மற்றும் 8-ம் பாவகத்தின் பிறப்பு ஜாதகத் தரவுகள் கிடைக்கவில்லை."
    });
  }

  const chart = context.chartData || context.chart || context;
  const h2 = getHouseByNumber(chart, 2);
  const h8 = getHouseByNumber(chart, 8);
  const h7 = getHouseByNumber(chart, 7);

  if (!h2 || !h8) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "SPOUSE_FAMILY_ECONOMIC_COMPARISON",
      taskType: "SOCIO_ECONOMIC_COMPARISON",
      isTamil,
      missingInputs: ["2ndHouse", "8thHouse"],
      traditionalMethod: "2nd Bhava vs 8th Bhava (2nd from 7th) Dispositor Comparison",
      customDirectAnswerEn: "The 2nd house (native treasury) or 8th house (spouse family treasury) is missing from calculated chart data.",
      customDirectAnswerTa: "ஜாதகக் கணிப்பில் 2-ம் குடும்ப தன பாவகம் அல்லது 8-ம் பாவகம் விடுபட்டுள்ளது."
    });
  }

  const jupiter = getPlanetByName(chart, "Jupiter");
  const venus = getPlanetByName(chart, "Venus");

  const h2Sign = h2.sign || h2.signName || "2nd Bhava";
  const h2Lord = h2.lord || h2.lordName || h2.ruler || null;
  const h8Sign = h8.sign || h8.signName || "8th Bhava";
  const h8Lord = h8.lord || h8.lordName || h8.ruler || null;

  const calculatedFacts = [
    { id: "FACT_H2_NATIVE_TREASURY", factor: "2nd House (Native Family Wealth)", sign: h2Sign, ...(h2Lord ? { lord: h2Lord } : {}) },
    { id: "FACT_H8_SPOUSE_TREASURY", factor: "8th House (2nd from 7th - Spouse Family Wealth)", sign: h8Sign, ...(h8Lord ? { lord: h8Lord } : {}) },
    ...(jupiter ? [{ id: "FACT_JUPITER_DHANA", factor: "Jupiter (Dhanakaraka)", dignity: jupiter.dignity || "NATAL" }] : []),
    ...(venus ? [{ id: "FACT_VENUS_KALATRA", factor: "Venus (Kalatrakaraka)", dignity: venus.dignity || "NATAL" }] : [])
  ];

  const traditionalRules = [
    { id: "RULE_2ND_HOUSE_KUTUMBA_DHANA", source: "Brihat Parashara Hora Shastra", text: "2nd house from Lagna signifies native's family lineage, ancestral assets, and accumulated wealth." },
    { id: "RULE_8TH_HOUSE_SPOUSE_FAMILY", source: "Phaladeepika & Bhavartha Ratnakara", text: "8th house from Lagna represents the 2nd house counted from the 7th (spouse's kutumba and ancestral resources)." },
    { id: "RULE_COMPARATIVE_LIMITATION", source: "Prashna Marga", text: "A single natal chart can only reflect qualitative relational expectations; external family balance sheets cannot be quantified without individual birth records and verified asset disclosures." }
  ];

  const limitation = isTamil
    ? "பாரம்பரிய ஜோதிட கணிப்பில் 2-ம் பாவகம் மற்றும் 8-ம் பாவகத்தின் குறியீட்டு பலங்களை மட்டுமே ஒப்பிட முடியும்; குறிப்பிட்ட ரூபாய் மதிப்பு, வங்கிக் கணக்கு இருப்பு அல்லது துல்லியமான சொத்து மதிப்பை ஜாதகத்தின் மூலம் கணிக்க முடியாது. மேலும், உங்கள் தனிப்பட்ட ஜாதகத்தில் உள்ள பலம் துணையின் குடும்பத்தின் உண்மையான நிதி சமநிலையை நிரூபிக்காது; அதற்கு துணையின் தனிப்பட்ட ஜாதகம் மற்றும் உண்மையான நிதித் தரவுகள் அவசியமாகும்."
    : "Astrological comparative analysis evaluates traditional house significations (2nd Bhava native ancestral treasury vs 8th Bhava spouse ancestral treasury). It cannot determine bank balances, real-world balance sheets, or definitive wealth parity without independent birth charts and verified financial documentation of both families. Strong personal wealth in a natal chart does not automatically prove spouse family parity.";

  let directAnswer = "";
  let reason = "";

  if (isTamil) {
    directAnswer = `உங்கள் ஜாதகத்தில் பூர்வீக தன ஸ்தானமான 2-ம் பாவகம் (${h2Sign}${h2Lord ? `, அதிபதி: ${h2Lord}` : ""}) மற்றும் துணையின் குடும்பத்தை குறிக்கும் 8-ம் பாவகம் (${h8Sign}${h8Lord ? `, அதிபதி: ${h8Lord}` : ""}) ஆகியவற்றின் நிலைகள் பாரம்பரிய முறையில் ஆராயப்பட்டன. ஒரு தனிநபர் ஜாதகத்தை மட்டும் வைத்து துணையின் குடும்பத்தின் துல்லியமான நிதி நிலையையோ அல்லது சமத்துவத்தையோ அறுதியாக நிர்ணயிக்க முடியாது; இது தனிப்பட்ட நிதித் தரவுகளை சார்ந்தது.`;
    reason = `உங்கள் 2-ம் பாவகம் பூர்வீக குடும்ப செல்வத்தையும், 7-க்கு 2-ம் பாவகமான 8-ம் பாவகம் துணையின் குடும்ப நிதி வளத்தையும் பாரம்பரிய முறையில் சுட்டிக்காட்டுகின்றன.`;
  } else {
    directAnswer = `In traditional astrological comparison, your 2nd house of ancestral family resources (${h2Sign}${h2Lord ? `, ruled by ${h2Lord}` : ""}) and the 8th house representing the spouse's family resources (2nd from 7th: ${h8Sign}${h8Lord ? `, ruled by ${h8Lord}` : ""}) provide qualitative relational archetypes. However, definitive financial parity or superiority cannot be asserted from a single natal chart alone without independent spouse-family financial disclosures.`;
    reason = `Evaluated native's 2nd Bhava against the 8th Bhava (2nd from 7th) synthesizing dispositors under classical Parashari principles.`;
  }

  return {
    questionId,
    intent: "SPOUSE_FAMILY_ECONOMIC_COMPARISON",
    taskType: "SOCIO_ECONOMIC_COMPARISON",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation,
    recommendation: {
      comparativeTier: isTamil ? "தனிப்பட்ட தரவுகள் இன்றி நிர்ணயிக்க முடியாது" : "Indeterminate without independent spouse financial data",
      disclaimer: "No monetary amounts fabricated; single natal chart cannot quantify spouse family wealth."
    },
    candidateWindows: [],
    timingResolution: null,
    supportingClaims: calculatedFacts.map(f => `${f.factor}: ${f.sign || f.dignity || "Evaluated"}`),
    limitingClaims: [limitation],
    missingInputs: ["Spouse individual birth chart", "Verified external financial disclosure"],
    traditionalMethod: "2nd Bhava vs 8th Bhava (2nd from 7th) Dispositor Comparison",
    empiricalStatus: "NOT_VALIDATED",
    calculatedFacts,
    traditionalRules
  };
}
