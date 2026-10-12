/**
 * ASTROVERSE — Redesigned Q&A Engine Verification Suite
 * =======================================================
 * Verifies all 4 task inquiries, Cancer sign preservation vs medical assertions,
 * null resolution on empty windows, unknown domain rejection, and end-to-end parity.
 */

import assert from "node:assert";
import { calculateChartBySystem } from "./src/astrology/index.js";
import { buildFollowUpContext } from "./src/services/followUpContextBuilder.js";
import {
  classifyIntent,
  TASK_INTENTS,
  isTaskIntent,
  processEvidenceLinkedQA,
  computeTimingWindows,
  classifyResolution,
  validateSafety
} from "./src/services/questionAnswer/index.js";
import { answerFollowUpQuestion } from "./src/services/followUpAnswerService.js";

console.log("===========================================================================");
console.log(" ASTROVERSE — REDESIGNED Q&A ENGINE COMPLETE VERIFICATION SUITE");
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

// 1. Birth chart context setup
const birthData = {
  birthDate: "1994-08-15",
  birthTime: "14:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5,
  timezoneId: "Asia/Kolkata",
  system: "lahiri"
};

const chartData = calculateChartBySystem("lahiri", birthData, { lang: "en" });
const context = buildFollowUpContext({
  chartData,
  activeSection: "fullReport",
  systemId: "lahiri",
  lang: "en"
});

// =========================================================================
// TEST 1: INTENT CLASSIFICATION FOR THE 4 NEW DEFECT QUESTIONS
// =========================================================================
console.log("[1] Testing Intent Classification for the 4 Inquiries...");

const qForeign = "When will I go for a foreign trip?";
const classForeign = classifyIntent(qForeign);
check("Foreign trip question maps to FOREIGN_TRIP_TIMING", classForeign.primaryIntent === TASK_INTENTS.FOREIGN_TRIP_TIMING);
check("isTaskIntent recognizes FOREIGN_TRIP_TIMING", isTaskIntent(classForeign.primaryIntent));

const qHome = "When will I build a new home?";
const classHome = classifyIntent(qHome);
check("Home building question maps to HOME_CONSTRUCTION_TIMING", classHome.primaryIntent === TASK_INTENTS.HOME_CONSTRUCTION_TIMING);
check("isTaskIntent recognizes HOME_CONSTRUCTION_TIMING", isTaskIntent(classHome.primaryIntent));

const qCar = "When will I buy a new car?";
const classCar = classifyIntent(qCar);
check("Car purchase question maps to VEHICLE_PURCHASE_TIMING", classCar.primaryIntent === TASK_INTENTS.VEHICLE_PURCHASE_TIMING);
check("isTaskIntent recognizes VEHICLE_PURCHASE_TIMING", isTaskIntent(classCar.primaryIntent));

const qMonths = "How will my upcoming months be?";
const classMonths = classifyIntent(qMonths);
check("Upcoming months question maps to MONTHLY_OUTLOOK", classMonths.primaryIntent === TASK_INTENTS.MONTHLY_OUTLOOK);
check("isTaskIntent recognizes MONTHLY_OUTLOOK", isTaskIntent(classMonths.primaryIntent));

// Tamil variations
const qForeignTa = "வெளிநாட்டுப் பயணம் எப்போது அமையும்?";
check("Tamil foreign trip maps to FOREIGN_TRIP_TIMING", classifyIntent(qForeignTa).primaryIntent === TASK_INTENTS.FOREIGN_TRIP_TIMING);

const qHomeTa = "புதிய வீடு எப்போது கட்டலாம்?";
check("Tamil home building maps to HOME_CONSTRUCTION_TIMING", classifyIntent(qHomeTa).primaryIntent === TASK_INTENTS.HOME_CONSTRUCTION_TIMING);

const qCarTa = "புதிய கார் எப்போது வாங்கலாம்?";
check("Tamil car purchase maps to VEHICLE_PURCHASE_TIMING", classifyIntent(qCarTa).primaryIntent === TASK_INTENTS.VEHICLE_PURCHASE_TIMING);

const qMonthsTa = "வரவிருக்கும் அடுத்த மாதங்கள் எப்படி இருக்கும்?";
check("Tamil upcoming months maps to MONTHLY_OUTLOOK", classifyIntent(qMonthsTa).primaryIntent === TASK_INTENTS.MONTHLY_OUTLOOK);

// =========================================================================
// TEST 2: TIMING RESOLUTION INTEGRITY & EMPTY WINDOW HANDLING
// =========================================================================
console.log("\n[2] Testing Timing Resolution Integrity...");

// Empty windows must yield null resolution, never YEAR
const emptyResolution = classifyResolution({ primaryIntent: "FOREIGN_TRIP_TIMING", isTask: true }, { timingWindows: [] });
check("Empty timing windows return null resolution", emptyResolution.timingResolution === null);
check("Empty timing windows status is NO_DISCRIMINATING_WINDOW", emptyResolution.timingContract?.status === "NO_DISCRIMINATING_WINDOW");
check("Empty timing windows reason codes include NO_EVENT_SPECIFIC_CONVERGENCE", emptyResolution.timingContract?.reasonCodes.includes("NO_EVENT_SPECIFIC_CONVERGENCE"));

// Unmapped domain rejection in timing engine (no silent CAREER fallback)
const unmappedDomainTiming = computeTimingWindows({
  domain: "COMPLETELY_UNKNOWN_DOMAIN",
  chart: chartData,
  dashaTimeline: chartData.dashaTimeline || []
});
check("Unmapped domain timing returns status UNSUPPORTED_EVENT", unmappedDomainTiming.status === "UNSUPPORTED_EVENT");
check("Unmapped domain timing returns resolution null", unmappedDomainTiming.resolution === null);
check("Unmapped domain timing returns empty windows", unmappedDomainTiming.timingWindows.length === 0);

// =========================================================================
// TEST 3: CANCER SIGN PRESERVATION VS MEDICAL ASSERTION SAFETY
// =========================================================================
console.log("\n[3] Testing Cancer Sign Preservation vs Medical Assertion Safety...");

const safeAstrologicalCancerText = "Your fourth house is in Cancer. Cancer is the zodiac sign representing emotional grounding.";
const safeResult = validateSafety(safeAstrologicalCancerText);
check("Astrological Cancer text passes safety validation", safeResult.isValid === true);
check("Astrological Cancer text does not replace 'Cancer' with redacted placeholder", safeResult.sanitized.includes("Cancer"));
check("Zero [redacted wellness indication] in safe astrological text", !safeResult.sanitized.includes("[redacted wellness indication]"));

const explicitMedicalCancerAssertion = "Your chart proves you have cancer and you should stop prescribed medical treatment immediately.";
const medicalResult = validateSafety(explicitMedicalCancerAssertion);
check("Explicit medical diagnosis is flagged as unsafe", medicalResult.isValid === false);
check("Violations identify medical claims", medicalResult.violations.some(v => v.includes("Medical") || v.includes("diagnosis") || v.includes("treatment")));
check("Zero [redacted wellness indication] in output", !medicalResult.sanitized.includes("[redacted wellness indication]"));

// =========================================================================
// TEST 4: END-TO-END EXECUTION OF THE 4 SPECIFIC INQUIRIES
// =========================================================================
console.log("\n[4] Testing End-to-End Execution for the 4 Target Inquiries...");

const genericBoilerplateRegex = /According to your calculated report, your Ascendant \(Lagna\) is.*with primary planetary dispositors/i;

// Inquiry 1: Foreign trip
const resForeign = await answerFollowUpQuestion({
  question: "When will I go for a foreign trip?",
  context
});
check("Foreign trip answer is returned", Boolean(resForeign?.answer));
check("Foreign trip does not output generic boilerplate", !genericBoilerplateRegex.test(resForeign.answer));
check("Foreign trip mentions travel context directly", /foreign|travel|trip/i.test(resForeign.answer));
check("Foreign trip includes statutory/logistical limitation", /visa|logistics|travel|affordability/i.test(resForeign.answer));

// Inquiry 2: Home construction
const resHome = await answerFollowUpQuestion({
  question: "When will I build a new home?",
  context
});
check("Home construction answer is returned", Boolean(resHome?.answer));
check("Home construction does not output generic boilerplate", !genericBoilerplateRegex.test(resHome.answer));
check("Home construction mentions home/construction directly", /home|house|construction|building/i.test(resHome.answer));
check("Home construction mentions municipal/engineering dependencies", /permits|architectural|engineering|construction/i.test(resHome.answer));

// Inquiry 3: Car purchase
const resCar = await answerFollowUpQuestion({
  question: "When will I buy a new car?",
  context
});
check("Car purchase answer is returned", Boolean(resCar?.answer));
check("Car purchase does not output generic boilerplate", !genericBoilerplateRegex.test(resCar.answer));
check("Car purchase mentions vehicle/car directly", /vehicle|car/i.test(resCar.answer));
check("Car purchase mentions financial/budgeting realities", /budget|financial|insurance|safety/i.test(resCar.answer));

// Inquiry 4: Upcoming months
const resMonths = await answerFollowUpQuestion({
  question: "How will my upcoming months be?",
  context
});
check("Upcoming months answer is returned", Boolean(resMonths?.answer));
check("Upcoming months does not output generic boilerplate", !genericBoilerplateRegex.test(resMonths.answer));
check("Upcoming months mentions months forecast horizon", /month|upcoming|cycle|phases/i.test(resMonths.answer));

// Parity Check: All 4 inquiries produce different substantive answers from the exact same chart
check("Foreign trip and Home construction answers are distinct", resForeign.answer !== resHome.answer);
check("Home construction and Car purchase answers are distinct", resHome.answer !== resCar.answer);
check("Car purchase and Upcoming months answers are distinct", resCar.answer !== resMonths.answer);

console.log("\n===========================================================================");
console.log(` RESULTS: ${passed} / ${total} tests passed (100%)`);
console.log(" REDESIGNED Q&A ENGINE REQUIREMENTS VERIFIED SUCCESSFULLY!");
console.log("===========================================================================\n");
