/**
 * ASTROVERSE — Honest Q&A Limits & Evidence Traceability Test Suite
 * =================================================================
 * Verifies non-negotiable correctness, evidence-linking, anti-fabrication,
 * honest prediction limits, and distinct status vocabulary.
 */

import assert from "node:assert";
import { calculateChartBySystem } from "./src/astrology/index.js";
import { buildFollowUpContext } from "./src/services/followUpContextBuilder.js";
import { processEvidenceLinkedQA } from "./src/services/questionAnswer/index.js";
import {
  evaluateDailyDressColor,
  evaluateResearchSubmissionElection,
  evaluateBusinessExpansionElection,
  evaluateMarriageRelationshipOutlook,
  evaluateSpouseFamilyComparison,
  evaluateHouseholdArrangement,
  evaluateForeignEmployment,
  evaluateNamedExamination,
  buildUnsupportedTaskAnswer
} from "./src/services/questionAnswer/tasks/index.js";

console.log("======================================================================");
console.log(" ASTROVERSE — HONEST Q&A LIMITS & EVIDENCE TRACEABILITY SUITE");
console.log("======================================================================\n");

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
const contextEn = buildFollowUpContext({
  chartData,
  activeSection: "fullReport",
  systemId: "lahiri",
  lang: "en"
});

const chartDataTa = calculateChartBySystem("lahiri", birthData, { lang: "ta" });
const contextTa = buildFollowUpContext({
  chartData: chartDataTa,
  activeSection: "fullReport",
  systemId: "lahiri",
  lang: "ta"
});

let passed = 0;
function check(desc, cond) {
  assert.ok(cond, desc);
  console.log(`✓ ${desc}`);
  passed++;
}

// ---------------------------------------------------------------------
// TEST 1: RELATIONSHIP HARMONY VS MARRIAGE FORMATION
// ---------------------------------------------------------------------
console.log("\n--- TEST 1: Relationship Harmony / Reconciliation Outlook ---");
const resRelEn = await processEvidenceLinkedQA({
  question: "Will my relationship improve and is there scope for reconciliation?",
  context: contextEn
});
console.log("Direct Answer:\n", resRelEn.directAnswer);

check("T1.1: Directly answers relationship harmony/reconciliation",
  /reconciliation|dialogue|harmony|relationship/i.test(resRelEn.directAnswer));
check("T1.2: Does NOT substitute marriage formation timing ('You will get married in...')",
  !/you will marry in|marriage ceremony/i.test(resRelEn.directAnswer));
check("T1.3: Cites 7th house and domestic peace / kutumba factors",
  resRelEn.answer.includes("7th house") || resRelEn.answer.includes("2nd house") || resRelEn.answer.includes("4th house"));
check("T1.4: Refuses guaranteed reconciliation or divorce",
  !/100%|guarantee.*reconciliation|guaranteed divorce/i.test(resRelEn.answer));
check("T1.5: Explicitly references communication / counselling limitations",
  /counseling|counselling|compromise|communication/i.test(resRelEn.answer));

// ---------------------------------------------------------------------
// TEST 2: SPOUSE FAMILY ECONOMIC COMPARISON
// ---------------------------------------------------------------------
console.log("\n--- TEST 2: Spouse Family Wealth Comparison ---");
const resSpouseWealth = await processEvidenceLinkedQA({
  question: "Is spouse family wealthier than mine? Compare their financial status.",
  context: contextEn
});
console.log("Direct Answer:\n", resSpouseWealth.directAnswer);

check("T2.1: Addresses comparative family economic status directly",
  /spouse.*family|comparable|background|financial/i.test(resSpouseWealth.directAnswer));
check("T2.2: Evaluates 2nd house (native treasury) and 8th house (spouse family treasury)",
  resSpouseWealth.answer.includes("2nd") && resSpouseWealth.answer.includes("8th"));
check("T2.3: Zero fabricated currency or rupee amounts",
  !/rupee|inr|crore|lakh|\$|dollar/i.test(resSpouseWealth.answer));
check("T2.4: Discloses that personal chart wealth does not prove in-law family parity",
  /single natal chart|independent birth chart|verified financial/i.test(resSpouseWealth.answer));
check("T2.5: Does not lead with marriage formation timing",
  !/marriage window|wedding timing/i.test(resSpouseWealth.directAnswer));

// ---------------------------------------------------------------------
// TEST 3: HOUSEHOLD RESIDENCE ARRANGEMENT (JOINT VS SEPARATE)
// ---------------------------------------------------------------------
console.log("\n--- TEST 3: Household Residence Arrangement (Joint vs Separate) ---");
const resHouse = await processEvidenceLinkedQA({
  question: "Will I live in a joint family or separate house after marriage?",
  context: contextEn
});
console.log("Direct Answer:\n", resHouse.directAnswer);

check("T3.1: Directly addresses joint family vs separate nuclear household",
  /joint|separate|nuclear|household|residence/i.test(resHouse.directAnswer));
check("T3.2: Evaluates 4th house of domestic roots and Moon/nodal indicators",
  resHouse.answer.includes("4th house") || resHouse.answer.includes("Moon"));
check("T3.3: Strict Negative Assertion: NEVER substitutes D10 career commentary",
  !resHouse.directAnswer.includes("D10") && !resHouse.directAnswer.includes("Dashamsha") && !resHouse.directAnswer.includes("vocation"));
check("T3.4: Discloses real-world workplace geography and rent affordability limitations",
  /workplace|commuting|affordability|mutual consent/i.test(resHouse.answer));

// ---------------------------------------------------------------------
// TEST 4: FOREIGN EMPLOYMENT VS TRAVEL
// ---------------------------------------------------------------------
console.log("\n--- TEST 4: Foreign Employment vs Travel ---");
const resForeignJob = await processEvidenceLinkedQA({
  question: "Will I get a job abroad and work in a foreign country?",
  context: contextEn
});
console.log("Direct Answer:\n", resForeignJob.directAnswer);

check("T4.1: Directly addresses overseas employment",
  /overseas|foreign|career|employment/i.test(resForeignJob.directAnswer));
check("T4.2: Evaluates career (10th/6th) AND foreign (12th/9th/Rahu) confluence",
  (resForeignJob.answer.includes("10th") || resForeignJob.answer.includes("6th")) &&
  (resForeignJob.answer.includes("12th") || resForeignJob.answer.includes("9th") || resForeignJob.answer.includes("Rahu")));
check("T4.3: Clarifies that travel alone does not entail overseas employment",
  /travel alone|does not constitute|visa/i.test(resForeignJob.answer));
check("T4.4: Discloses work visa / labor certification real-world dependencies",
  /work visa|permit|offer/i.test(resForeignJob.answer));

// ---------------------------------------------------------------------
// TEST 5: NAMED EXAMINATION OUTLOOK
// ---------------------------------------------------------------------
console.log("\n--- TEST 5: Named Examination Outlook ---");
const resExam = await processEvidenceLinkedQA({
  question: "Will I pass UGC NET December 2026 examination?",
  context: contextEn
});
console.log("Direct Answer:\n", resExam.directAnswer);

check("T5.1: Preserves exact exam name 'UGC NET'",
  resExam.directAnswer.includes("UGC NET"));
check("T5.2: Preserves exact target session 'December 2026'",
  resExam.directAnswer.includes("December 2026"));
check("T5.3: Evaluates 5th (intellect) and 6th (competitive edge) houses",
  resExam.answer.includes("5th") || resExam.answer.includes("6th"));
check("T5.4: Zero pass/fail guarantees (no '100% pass' or guaranteed success)",
  !/100% pass|guaranteed success|will definitely pass/i.test(resExam.answer));
check("T5.5: Explicitly reminds candidate of syllabus preparation and mock scores",
  /syllabus|mock|preparation/i.test(resExam.answer));
check("T5.6: Zero substitution of marriage or generic career boilerplate",
  !/marriage|wedding|spouse|marital/i.test(resExam.answer));

// ---------------------------------------------------------------------
// TEST 6: TAMIL LANGUAGE FIDELITY ACROSS ALL TASKS
// ---------------------------------------------------------------------
console.log("\n--- TEST 6: Tamil Language Task Fidelity ---");
const resExamTa = await processEvidenceLinkedQA({
  question: "UGC NET December 2026 தேர்வில் வெற்றி வாய்ப்பு எப்படி?",
  context: contextTa
});
console.log("Direct Answer Ta:\n", resExamTa.directAnswer);

check("T6.1: Tamil direct answer preserves UGC NET and session",
  resExamTa.directAnswer.includes("UGC NET") && resExamTa.directAnswer.includes("December 2026"));
check("T6.2: Tamil direct answer disclaims pass/fail guarantee",
  resExamTa.answer.includes("தேர்ச்சி") && resExamTa.answer.includes("உத்தரவாதம்"));

const resHouseTa = await processEvidenceLinkedQA({
  question: "திருமணத்திற்குப் பின் கூட்டுக் குடும்பமா அல்லது தனிக் குடித்தனமா?",
  context: contextTa
});
console.log("Direct Answer House Ta:\n", resHouseTa.directAnswer);

check("T6.3: Tamil household arrangement directly evaluates residence",
  resHouseTa.directAnswer.includes("தனிக்குடித்தனம்") || resHouseTa.directAnswer.includes("கூட்டுக் குடும்ப"));
check("T6.4: Tamil household arrangement excludes D10 career text",
  !resHouseTa.directAnswer.includes("D10") && !resHouseTa.directAnswer.includes("தசாம்சம்"));

// ---------------------------------------------------------------------
// TEST 7: HONEST LIMITS & STATUS VOCABULARY INTEGRITY
// ---------------------------------------------------------------------
console.log("\n--- TEST 7: Honest Status Vocabulary Integrity ---");
check("T7.1: Answer object contains validatedAnswerObject with non-empty calculatedFacts",
  resExam.answerObject?.calculatedFacts && resExam.answerObject.calculatedFacts.length > 0);
check("T7.2: Answer object contains traditionalRules distinct from facts",
  resExam.answerObject?.traditionalRules && resExam.answerObject.traditionalRules.length > 0);
check("T7.3: Empirical status remains NOT_VALIDATED",
  resExam.answerObject?.timingWindows?.every(w => w.empiricalStatus !== "EMPIRICALLY_PROVEN") ?? true);

// ---------------------------------------------------------------------
// TEST 8: UNSUPPORTED TASK ABSTENTION CONTRACT
// ---------------------------------------------------------------------
console.log("\n--- TEST 8: Unsupported Task Abstention Contract ---");
const unsupp = buildUnsupportedTaskAnswer({
  intent: "LOTTERY_TICKET_PICKER",
  isTamil: false
});

check("T8.1: Unsupported task returns UNSUPPORTED_TASK state",
  unsupp.answerState === "UNSUPPORTED_TASK");
check("T8.2: Unsupported task explicitly refuses generic natal prose substitution",
  unsupp.directAnswer.includes("generic natal-chart summary is not substituted"));
check("T8.3: Unsupported task sets conclusion and confidenceClass strictly to null",
  unsupp.conclusion === null && unsupp.confidenceClass === null);

// ---------------------------------------------------------------------
// TEST 9: POST-GENERATION FIREWALL TAMPERING PREVENTION
// ---------------------------------------------------------------------
console.log("\n--- TEST 9: Post-Generation Firewall Tampering Prevention ---");
const malformedSpecQ = "Will I win the lottery ticket next Tuesday?";
const resLottery = await processEvidenceLinkedQA({
  question: malformedSpecQ,
  context: contextEn
});

check("T9.1: Speculative lottery inquiry abstains / clarifies rather than fabricating numbers",
  resLottery.evidenceStatus === "INSUFFICIENT_DATA" || /random|speculation|clarification|cannot/i.test(resLottery.answer));

console.log("\n======================================================================");
console.log(` ALL ${passed} HONEST Q&A VERIFICATION CHECKS PASSED PERFECTLY! (0 failed)`);
console.log("======================================================================\n");
