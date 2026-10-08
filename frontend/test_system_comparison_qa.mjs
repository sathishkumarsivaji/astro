/**
 * ASTROVERSE — System Comparison Q&A Regression Test Suite
 * =========================================================
 * Test ID: SYSTEM_COMPARISON_LAHIRI_KP_001
 *
 * Verifies that multi-system comparison questions (specifically Lahiri vs KP)
 * are accurately classified as SYSTEM_COMPARISON, routed deterministically,
 * evaluated via compareAstrologySystems, and rendered with the mandatory
 * 6-section direct answer structure in both Tamil and English without
 * unprompted generic dasha openings, "18–24 months" fabrications, or topic drift.
 */

import assert from "node:assert";
import { calculateChartBySystem } from "./src/astrology/index.js";
import { buildFollowUpContext } from "./src/services/followUpContextBuilder.js";
import { classifyIntent } from "./src/services/questionAnswer/intentClassifier.js";
import { routeFollowUpQuestion } from "./src/services/followUpRouter.js";
import { classifyConsultationIntent, generateAstrologerConsultation } from "./src/services/consultationEngine.js";
import { compareAstrologySystems, classifyMaterialDifference, formatDms } from "./src/services/questionAnswer/comparisonEngine.js";
import { answerFollowUpQuestion } from "./src/services/followUpAnswerService.js";

console.log("===========================================================================");
console.log(" ASTROVERSE — REGRESSION TEST: SYSTEM_COMPARISON_LAHIRI_KP_001");
console.log("===========================================================================\n");

let passed = 0;
let total = 0;

function check(label, condition) {
  total++;
  if (condition) {
    console.log(`  ✓ [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${label}`);
    throw new Error(`Assertion failed: ${label}`);
  }
}

// -----------------------------------------------------------------------------
// 1. Chart & Context Setup (Chennai 1994)
// -----------------------------------------------------------------------------
const birthData = {
  birthDate: "1994-08-15",
  birthTime: "14:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5,
  timezoneId: "Asia/Kolkata",
  system: "lahiri"
};

const lahiriChart = calculateChartBySystem("lahiri", birthData, { lang: "ta" });
const kpChart = calculateChartBySystem("kp", birthData, { lang: "ta" });

const contextTa = buildFollowUpContext({
  chartData: lahiriChart,
  activeSection: "fullReport",
  systemId: "lahiri",
  lang: "ta"
});

const contextEn = buildFollowUpContext({
  chartData: lahiriChart,
  activeSection: "fullReport",
  systemId: "lahiri",
  lang: "en"
});

const queryTa = "லஹிரி மற்றும் கே.பி. முறைகளுக்கு இடையே என் ஜாதகத்தில் உள்ள முக்கிய மாற்றங்கள் என்ன?";
const queryEn = "What are the key changes in my horoscope between Lahiri and KP systems?";

// -----------------------------------------------------------------------------
// 2. Intent Classification Invariants
// -----------------------------------------------------------------------------
console.log("[1] Testing Intent Classification for Lahiri vs KP queries...");

const intentQATa = classifyIntent(queryTa);
check("QA IntentClassifier classifies Tamil query as SYSTEM_COMPARISON", intentQATa.primaryIntent === "SYSTEM_COMPARISON");

const intentQAEn = classifyIntent(queryEn);
check("QA IntentClassifier classifies English query as SYSTEM_COMPARISON", intentQAEn.primaryIntent === "SYSTEM_COMPARISON");

const routeTa = routeFollowUpQuestion(queryTa, contextTa);
check("FollowUpRouter routes Tamil query to SYSTEM_COMPARISON", routeTa.type === "SYSTEM_COMPARISON");

const routeEn = routeFollowUpQuestion(queryEn, contextEn);
check("FollowUpRouter routes English query to SYSTEM_COMPARISON", routeEn.type === "SYSTEM_COMPARISON");

const consultIntentTa = classifyConsultationIntent(queryTa);
check("ConsultationEngine classifies Tamil query domain as SYSTEM_COMPARISON", consultIntentTa.domain === "SYSTEM_COMPARISON");

const consultIntentEn = classifyConsultationIntent(queryEn);
check("ConsultationEngine classifies English query domain as SYSTEM_COMPARISON", consultIntentEn.domain === "SYSTEM_COMPARISON");

// -----------------------------------------------------------------------------
// 3. Mathematical Comparison Engine Invariants
// -----------------------------------------------------------------------------
console.log("\n[2] Testing compareAstrologySystems mathematical engine...");

const compResult = compareAstrologySystems({
  chart: lahiriChart,
  isTamil: true
});

check("compareAstrologySystems returns status SUCCESS", compResult.status === "SUCCESS");
check("Ayanamsha difference is non-zero (> 0.05° and < 0.15°)", compResult.ayanamsha.differenceDeg > 0.05 && compResult.ayanamsha.differenceDeg < 0.15);
check("Formatted difference contains degrees and arcminutes", /°.*'/.test(compResult.ayanamsha.diffFormatted));
check("10 celestial bodies computed in comparison ledger", compResult.bodies.length === 10);
check("Ascendant included in body comparisons", compResult.bodies.some(b => b.name === "Ascendant"));
check("Moon included in body comparisons", compResult.bodies.some(b => b.name === "Moon"));
check("KP Cuspal Sub-Lords calculated for 1st cusp", compResult.cuspalSubLords[1]?.subLord != null);
check("KP Cuspal Sub-Lords calculated for 7th cusp", compResult.cuspalSubLords[7]?.subLord != null);
check("KP Cuspal Sub-Lords calculated for 10th cusp", compResult.cuspalSubLords[10]?.subLord != null);
check("Effective house systems reported for Lahiri and KP", compResult.effectiveHouseSystems?.lahiri.includes("Whole Sign") && compResult.effectiveHouseSystems?.kp.includes("Placidus"));
check("Complete KP significator chain computed for 10th cusp", compResult.significatorChains?.cusp10?.subPlanetStarLord != null && compResult.significatorChains?.cusp10?.subSignifiedHouses != null);
check("Chart-specific timing comparison computed", compResult.timingComparison?.lahiri?.mahadasha != null && compResult.timingComparison?.kp?.mahadasha != null);

// -----------------------------------------------------------------------------
// 4. Material Difference Classifier Invariants
// -----------------------------------------------------------------------------
console.log("\n[3] Testing classifyMaterialDifference boundary checks...");

const bodyNoDiff = classifyMaterialDifference(
  { name: "Sun", longitude: 121.5, sign: "Leo", nakshatra: "Magha", pada: 1, house: 5 },
  { name: "Sun", longitude: 121.41, sign: "Leo", nakshatra: "Magha", pada: 1, house: 5 }
);
check("Small longitude offset within boundary is NO_MATERIAL_DIFFERENCE", bodyNoDiff.isMaterial === false && bodyNoDiff.classification === "NO_MATERIAL_DIFFERENCE");

const bodyHouseShift = classifyMaterialDifference(
  { name: "Sun", longitude: 121.5, sign: "Leo", nakshatra: "Magha", pada: 1, house: 5 },
  { name: "Sun", longitude: 121.41, sign: "Leo", nakshatra: "Magha", pada: 1, house: 4 }
);
check("House difference triggers HOUSE_SYSTEM_DIFFERENCE", bodyHouseShift.isMaterial === true && bodyHouseShift.classification === "HOUSE_SYSTEM_DIFFERENCE");

const bodySignShift = classifyMaterialDifference(
  { name: "Sun", longitude: 120.02, sign: "Leo", nakshatra: "Magha", pada: 1, house: 5 },
  { name: "Sun", longitude: 119.95, sign: "Cancer", nakshatra: "Ashlesha", pada: 4, house: 4 }
);
check("Sign crossing triggers SIGN_CHANGE", bodySignShift.isMaterial === true && bodySignShift.classification === "SIGN_CHANGE");

// -----------------------------------------------------------------------------
// 5. Follow-Up Q&A Answer Verification (Tamil)
// -----------------------------------------------------------------------------
console.log("\n[4] Testing answerFollowUpQuestion with Tamil query...");

const followUpTa = await answerFollowUpQuestion(queryTa, contextTa);
const answerTa = followUpTa.answer;

check("Tamil answer has Section 1: அயனாம்சம்", answerTa.includes("1. அயனாம்சம்"));
check("Tamil answer has Section 2: கிரக நிலைகள் & லக்னம்", answerTa.includes("2. கிரக நிலைகள் & லக்னம்"));
check("Tamil answer has Section 3: நட்சத்திரம் / பாதம்", answerTa.includes("3. நட்சத்திரம் / பாதம்"));
check("Tamil answer has Section 4: கே.பி. உப அதிபதி", answerTa.includes("4. கே.பி. உப அதிபதி"));
check("Tamil answer has Section 5: காலக்கணிப்பு முறைமை", answerTa.includes("5. காலக்கணிப்பு முறைமை"));
check("Tamil answer has Section 6: முடிவு", answerTa.includes("6. முடிவு"));

// Anti-Fabrication checks for Tamil
check("No unprompted Dasha opening in Tamil answer", !answerTa.startsWith("தற்போது நடைபெறும்"));
check("No hardcoded 18-24 months in Tamil answer", !answerTa.includes("18–24") && !answerTa.includes("18-24"));
check("No generic marriage promise in Tamil answer", !answerTa.includes("தாம்பத்திய சாத்தியத்தை") && !answerTa.includes("திருமண வாழ்வின்"));
check("Evidence IDs include canonical SYSTEM_COMPARISON tags", followUpTa.evidenceIds.includes("AYANAMSHA_LAHIRI_KP") && followUpTa.evidenceIds.includes("MATERIAL_DIFFERENCE_CLASSIFIER"));

// -----------------------------------------------------------------------------
// 6. Follow-Up Q&A Answer Verification (English)
// -----------------------------------------------------------------------------
console.log("\n[5] Testing answerFollowUpQuestion with English query...");

const followUpEn = await answerFollowUpQuestion(queryEn, contextEn);
const answerEn = followUpEn.answer;

check("English answer has Section 1: Ayanamsha", answerEn.includes("1. Ayanamsha"));
check("English answer has Section 2: Planetary Longitudes & Ascendant", answerEn.includes("2. Planetary Longitudes & Ascendant"));
check("English answer has Section 3: Nakshatra & Pada Boundary Analysis", answerEn.includes("3. Nakshatra & Pada Boundary Analysis"));
check("English answer has Section 4: KP Sub-Lord Significators", answerEn.includes("4. KP Sub-Lord Significators"));
check("English answer has Section 5: Timing Methodology", answerEn.includes("5. Timing Methodology"));
check("English answer has Section 6: Conclusion", answerEn.includes("6. Conclusion"));

// Anti-Fabrication checks for English
check("No hardcoded 18-24 months in English answer", !answerEn.includes("18–24") && !answerEn.includes("18-24"));
check("No unprompted generic dasha opening in English answer", !answerEn.startsWith("Your chart demonstrates strong astrological activation during the current"));

// -----------------------------------------------------------------------------
// 7. Consultation Engine Direct Verification
// -----------------------------------------------------------------------------
console.log("\n[6] Testing generateAstrologerConsultation for system comparison...");

const consultResTa = generateAstrologerConsultation(lahiriChart, queryTa, { lang: "ta" });
check("Consultation direct answer in Tamil contains Ayanamsha section", consultResTa.directAnswer.includes("1. அயனாம்சம்"));
check("Consultation direct answer in Tamil reports effective house system", consultResTa.directAnswer.includes("Lahiri effective house system"));
check("Consultation direct answer in Tamil explains 249 sub divisions", consultResTa.directAnswer.includes("249"));
check("Consultation direct answer in Tamil contains KP significator chain", consultResTa.directAnswer.includes("குறிக்கும் பாவகங்கள்"));
check("Consultation timing windows do not contain 18-24 months", !JSON.stringify(consultResTa.timingWindows).includes("18–24") && !JSON.stringify(consultResTa.timingWindows).includes("18-24"));

const consultResEn = generateAstrologerConsultation(lahiriChart, queryEn, { lang: "en" });
check("Consultation direct answer in English contains Ayanamsha section", consultResEn.directAnswer.includes("1. Ayanamsha"));
check("Consultation direct answer in English reports effective house system", consultResEn.directAnswer.includes("Lahiri effective house system"));
check("Consultation direct answer in English explains 249 sub divisions", consultResEn.directAnswer.includes("249"));
check("Consultation direct answer in English contains KP significator chain", consultResEn.directAnswer.includes("signifies houses"));
check("Consultation timing windows do not contain 18-24 months", !JSON.stringify(consultResEn.timingWindows).includes("18–24") && !JSON.stringify(consultResEn.timingWindows).includes("18-24"));

console.log(`\n===========================================================================`);
console.log(` ALL ${passed}/${total} SYSTEM COMPARISON Q&A REGRESSION CHECKS PASSED.`);
console.log(`===========================================================================\n`);
