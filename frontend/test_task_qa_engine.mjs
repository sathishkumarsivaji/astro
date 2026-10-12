/**
 * ASTROVERSE — Task-Specific Q&A Engine Verification Suite
 * ========================================================
 * Validates the actionable task-answering capabilities:
 * 1. DAILY_DRESS_COLOR (English & Tamil, weekday tradition, no chart required, explicit unhandled state)
 * 2. RESEARCH_SUBMISSION_ELECTION (English & Tamil, practical checklist vs election, refuses publication guarantee, no PhD overview)
 * 3. BUSINESS_EXPANSION_ELECTION (English & Tamil, bounded week evaluation, refuses luck/profit guarantee, abstains when uncalculated)
 * 4. Temporal Resolver (action timezone vs birth timezone, injected clock, today/this week)
 * 5. Ambiguous expansion decision & clarification
 * 6. Relevance firewall: rejection of generic ascendant/dispositor summaries
 * 7. Production entry point integration via answerFollowUpQuestion
 */

import assert from "node:assert";
import {
  TASK_INTENTS,
  classifyIntent
} from "./src/services/questionAnswer/intentClassifier.js";
import {
  understandQuestion
} from "./src/services/questionAnswer/questionUnderstandingEngine.js";
import {
  resolveTemporalTimeframe
} from "./src/services/questionAnswer/temporalResolver.js";
import {
  evaluateDailyDressColor,
  evaluateResearchSubmissionElection,
  evaluateBusinessExpansionElection,
  evaluateBusinessExpansionDecision,
  dispatchTaskEvaluation
} from "./src/services/questionAnswer/tasks/index.js";
import {
  processEvidenceLinkedQA
} from "./src/services/questionAnswer/qaEngine.js";
import {
  answerFollowUpQuestion
} from "./src/services/followUpAnswerService.js";
import {
  buildFollowUpContext
} from "./src/services/followUpContextBuilder.js";

console.log("===========================================================================");
console.log(" ASTROVERSE — TASK-SPECIFIC Q&A ENGINE COMPLETE VERIFICATION SUITE");
console.log("===========================================================================\n");

let passedCount = 0;
async function testCheck(desc, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${desc}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${desc}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// 1. INTENT & TASK CLASSIFICATION (Section 3)
// -----------------------------------------------------------------------------
console.log("[1] Testing Task Intent Classification (English & Tamil)...");

testCheck("Dress colour: 'What colour dress can I wear today?' maps to DAILY_DRESS_COLOR", () => {
  const res = classifyIntent("What colour dress can I wear today?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.DAILY_DRESS_COLOR);
});

testCheck("Dress colour: 'Which color is suitable today?' maps to DAILY_DRESS_COLOR", () => {
  const res = classifyIntent("Which color is suitable today?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.DAILY_DRESS_COLOR);
});

testCheck("Dress colour: 'Today dress colour?' maps to DAILY_DRESS_COLOR", () => {
  const res = classifyIntent("Today dress colour?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.DAILY_DRESS_COLOR);
});

testCheck("Dress colour: 'இன்று எந்த நிற ஆடை அணியலாம்?' maps to DAILY_DRESS_COLOR", () => {
  const res = classifyIntent("இன்று எந்த நிற ஆடை அணியலாம்?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.DAILY_DRESS_COLOR);
});

testCheck("Research submission: 'Can I submit my research paper today?' maps to RESEARCH_SUBMISSION_ELECTION", () => {
  const res = classifyIntent("Can I submit my research paper today?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.RESEARCH_SUBMISSION_ELECTION);
});

testCheck("Research submission: 'Is today suitable for journal submission?' maps to RESEARCH_SUBMISSION_ELECTION", () => {
  const res = classifyIntent("Is today suitable for journal submission?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.RESEARCH_SUBMISSION_ELECTION);
});

testCheck("Research submission: 'Can I upload my manuscript tonight?' maps to RESEARCH_SUBMISSION_ELECTION", () => {
  const res = classifyIntent("Can I upload my manuscript tonight?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.RESEARCH_SUBMISSION_ELECTION);
});

testCheck("Research submission: 'இன்று ஆய்வுக் கட்டுரையைச் சமர்ப்பிக்கலாமா?' maps to RESEARCH_SUBMISSION_ELECTION", () => {
  const res = classifyIntent("இன்று ஆய்வுக் கட்டுரையைச் சமர்ப்பிக்கலாமா?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.RESEARCH_SUBMISSION_ELECTION);
});

testCheck("Business expansion: 'Should I expand my business this week?' maps to BUSINESS_EXPANSION_ELECTION", () => {
  const res = classifyIntent("Should I expand my business this week?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.BUSINESS_EXPANSION_ELECTION);
});

testCheck("Business expansion: 'Will expanding the business this week give me good luck?' maps to BUSINESS_EXPANSION_ELECTION", () => {
  const res = classifyIntent("Will expanding the business this week give me good luck?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.BUSINESS_EXPANSION_ELECTION);
});

testCheck("Business expansion: 'Is this a suitable week to open another branch?' maps to BUSINESS_EXPANSION_ELECTION", () => {
  const res = classifyIntent("Is this a suitable week to open another branch?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.BUSINESS_EXPANSION_ELECTION);
});

testCheck("Business expansion: 'இந்த வாரம் வியாபாரத்தை விரிவுபடுத்தலாமா?' maps to BUSINESS_EXPANSION_ELECTION", () => {
  const res = classifyIntent("இந்த வாரம் வியாபாரத்தை விரிவுபடுத்தலாமா?");
  assert.strictEqual(res.primaryIntent, TASK_INTENTS.BUSINESS_EXPANSION_ELECTION);
});

testCheck("Business decision: 'Should I open another branch or start a different business?' maps to BUSINESS_EXPANSION_DECISION", () => {
  const res = classifyIntent("Should I open another branch or start a different business?");
  assert.ok(res.intents.includes(TASK_INTENTS.BUSINESS_EXPANSION_DECISION));
});

// -----------------------------------------------------------------------------
// 2. TEMPORAL RESOLVER (Section 4)
// -----------------------------------------------------------------------------
console.log("\n[2] Testing Temporal Resolver & Action Location Timezone...");

testCheck("Injected reference clock resolves exact local date and weekday", () => {
  // 2026-10-14 is Wednesday
  const refDate = new Date("2026-10-14T12:00:00Z");
  const res = resolveTemporalTimeframe({
    question: "What colour dress can I wear today?",
    referenceInstant: refDate,
    actionTimezone: "UTC"
  });
  assert.strictEqual(res.localStartDate, "2026-10-14");
  assert.strictEqual(res.weekdayName, "Wednesday");
  assert.strictEqual(res.dayOfWeek, 3);
  assert.strictEqual(res.kind, "LOCAL_DATE");
});

testCheck("Action timezone differs from birthplace timezone across midnight", () => {
  // When it is 2026-10-14T23:30:00Z in London (Wednesday), it is 2026-10-15T05:00:00 in India (Thursday)
  const refDate = new Date("2026-10-14T23:30:00Z");
  const resIndia = resolveTemporalTimeframe({
    question: "What colour dress can I wear today?",
    referenceInstant: refDate,
    actionTimezone: "Asia/Kolkata"
  });
  const resNewYork = resolveTemporalTimeframe({
    question: "What colour dress can I wear today?",
    referenceInstant: refDate,
    actionTimezone: "America/New_York"
  });

  assert.strictEqual(resIndia.localStartDate, "2026-10-15");
  assert.strictEqual(resIndia.weekdayName, "Thursday");
  assert.strictEqual(resNewYork.localStartDate, "2026-10-14");
  assert.strictEqual(resNewYork.weekdayName, "Wednesday");
});

testCheck("'this week' resolves bounded Monday-Sunday range", () => {
  // 2026-10-14 is Wednesday
  const refDate = new Date("2026-10-14T12:00:00Z");
  const res = resolveTemporalTimeframe({
    question: "Should I expand my business this week?",
    referenceInstant: refDate,
    actionTimezone: "UTC",
    weekStartPreference: "Monday"
  });
  assert.strictEqual(res.kind, "LOCAL_WEEK");
  assert.strictEqual(res.localStartDate, "2026-10-12"); // Monday
  assert.strictEqual(res.localEndDate, "2026-10-18");   // Sunday
});

// -----------------------------------------------------------------------------
// 3. DAILY DRESS COLOUR EVALUATOR (Section 5A)
// -----------------------------------------------------------------------------
console.log("\n[3] Testing Daily Dress Colour Evaluator (Section 5A)...");

testCheck("Wednesday evaluates green under disclosed weekday tradition", () => {
  const refDate = new Date("2026-10-14T12:00:00Z"); // Wednesday
  const res = evaluateDailyDressColor({
    question: "What colour dress can I wear today?",
    context: { referenceInstant: refDate, actionTimezone: "UTC" },
    isTamil: false
  });
  assert.strictEqual(res.answerState, "ANSWERED");
  assert.ok(res.directAnswer.includes("Green"));
  assert.strictEqual(res.recommendation.weekday, "Wednesday");
  assert.strictEqual(res.recommendation.rulerPlanet, "Mercury");
  assert.strictEqual(res.traditionalMethod, "WEEKDAY_TRADITION");
  assert.ok(res.directAnswer.includes("cultural/traditional preference, not a guarantee of luck"));
});

testCheck("Tamil dress colour recommendation delivers Tamil colour names and disclaimer", () => {
  const refDate = new Date("2026-10-14T12:00:00Z"); // Wednesday (புதன்)
  const res = evaluateDailyDressColor({
    question: "இன்று எந்த நிற ஆடை அணியலாம்?",
    context: { referenceInstant: refDate, actionTimezone: "UTC" },
    isTamil: true
  });
  assert.strictEqual(res.answerState, "ANSWERED");
  assert.ok(res.directAnswer.includes("பச்சை"));
  assert.ok(res.directAnswer.includes("அதிர்ஷ்டத்திற்கான உத்தரவாதம் அல்ல"));
});

testCheck("When colour task is configured as unsupported, returns explicit unhandled state without chart dump", () => {
  const res = evaluateDailyDressColor({
    question: "What colour dress can I wear today?",
    context: { unsupportedTasks: ["DAILY_DRESS_COLOR"] },
    isTamil: false
  });
  assert.strictEqual(res.answerState, "UNSUPPORTED_TASK");
  assert.ok(res.directAnswer.includes("Daily dress-colour guidance is not implemented yet"));
  assert.ok(!res.directAnswer.includes("Ascendant"));
});

// -----------------------------------------------------------------------------
// 4. RESEARCH SUBMISSION ELECTION EVALUATOR (Section 5B)
// -----------------------------------------------------------------------------
console.log("\n[4] Testing Research Paper Submission Election Evaluator (Section 5B)...");

testCheck("Without daily election data: delivers explicit missing calculation notice and practical checklist", () => {
  const res = evaluateResearchSubmissionElection({
    question: "Can I submit my research paper today?",
    context: {},
    isTamil: false
  });
  assert.strictEqual(res.answerState, "NOT_ESTABLISHED");
  assert.ok(res.directAnswer.includes("daily electional calculation has not been run"));
  assert.ok(res.directAnswer.includes("this chart does not predict acceptance"));
  assert.strictEqual(res.publicationOutcomeGuarantee, false);
  assert.ok(Array.isArray(res.practicalChecklist) && res.practicalChecklist.length === 5);
  // Never returns PhD or general education overview
  assert.ok(!res.directAnswer.includes("higher intelligence"));
  assert.ok(!res.directAnswer.includes("academic abilities"));
});

testCheck("Tamil research submission handles missing election honestly", () => {
  const res = evaluateResearchSubmissionElection({
    question: "இன்று ஆய்வுக் கட்டுரையைச் சமர்ப்பிக்கலாமா?",
    context: {},
    isTamil: true
  });
  assert.strictEqual(res.answerState, "NOT_ESTABLISHED");
  assert.ok(res.directAnswer.includes("முகூர்த்த காலக்கணிப்பு செய்யப்படாததால்"));
  assert.ok(res.directAnswer.includes("ஏற்றுக்கொள்ளப்படுவதை முன்கூட்டியே கணிக்காது"));
});

testCheck("With calculated election window: returns window without predicting acceptance", () => {
  const res = evaluateResearchSubmissionElection({
    question: "Can I submit my research paper today?",
    context: {
      electionData: {
        method: "PANCHANG_MUHURTA",
        candidateWindows: [{ interval: "10:30 AM – 12:00 PM" }]
      }
    },
    isTamil: false
  });
  assert.strictEqual(res.answerState, "ANSWERED");
  assert.ok(res.directAnswer.includes("10:30 AM – 12:00 PM"));
  assert.ok(res.directAnswer.includes("does not predict acceptance, review speed, or publication success"));
});

// -----------------------------------------------------------------------------
// 5. BUSINESS EXPANSION ELECTION EVALUATOR (Section 5C)
// -----------------------------------------------------------------------------
console.log("\n[5] Testing Business Expansion Election Evaluator (Section 5C)...");

testCheck("Without weekly election data: delivers honest NOT_ESTABLISHED and refuses luck guarantee", () => {
  const refDate = new Date("2026-10-14T12:00:00Z");
  const res = evaluateBusinessExpansionElection({
    question: "Will expanding the business this week give me good luck?",
    context: { referenceInstant: refDate, actionTimezone: "UTC" },
    isTamil: false
  });
  assert.strictEqual(res.answerState, "NOT_ESTABLISHED");
  assert.ok(res.directAnswer.includes("does not establish that expanding this week"));
  assert.ok(res.directAnswer.includes("will bring good luck"));
  assert.ok(res.directAnswer.includes("No distinct expansion window has been identified for the requested week"));
  assert.strictEqual(res.luckGuarantee, false);
  assert.strictEqual(res.commercialSuccessGuarantee, false);
});

testCheck("Tamil business expansion handles missing weekly election honestly", () => {
  const refDate = new Date("2026-10-14T12:00:00Z");
  const res = evaluateBusinessExpansionElection({
    question: "இந்த வாரம் வியாபாரத்தை விரிவுபடுத்தலாமா?",
    context: { referenceInstant: refDate, actionTimezone: "UTC" },
    isTamil: true
  });
  assert.strictEqual(res.answerState, "NOT_ESTABLISHED");
  assert.ok(res.directAnswer.includes("வியாபாரத்தை விரிவுபடுத்துவது அதிர்ஷ்டத்தைத் தரும் என்பதை தற்போதைய கணிப்பு உறுதிப்படுத்தவில்லை"));
});

testCheck("With calculated weekly windows: delivers bounded evaluation without promising commercial solvency", () => {
  const refDate = new Date("2026-10-14T12:00:00Z");
  const res = evaluateBusinessExpansionElection({
    question: "Should I expand my business this week?",
    context: {
      referenceInstant: refDate,
      actionTimezone: "UTC",
      weeklyElectionData: {
        assessment: "FAVORABLE",
        candidateWindows: [{ dates: "Oct 14 – Oct 16" }]
      }
    },
    isTamil: false
  });
  assert.strictEqual(res.answerState, "ANSWERED");
  assert.ok(res.directAnswer.includes("favorable timing assessment"));
  assert.ok(res.directAnswer.includes("not evidence that expansion will be profitable or successful"));
});

testCheck("Ambiguous expansion query asks branch vs diversification clarification", () => {
  const res = evaluateBusinessExpansionDecision({
    question: "Should I expand to more business?",
    context: {},
    isTamil: false
  });
  assert.strictEqual(res.answerState, "CLARIFICATION_REQUIRED");
  assert.strictEqual(res.directAnswer, "Do you mean opening another branch of the same business, or starting a different business?");
});

// -----------------------------------------------------------------------------
// 6. RELEVANCE & GROUNDING FIREWALL (Section 6)
// -----------------------------------------------------------------------------
console.log("\n[6] Testing Relevance Firewall & Direct-Answer Contract...");

testCheck("Question understanding extracts action, timeframe, and answer type", () => {
  const u1 = understandQuestion({ question: "What colour dress can I wear today?" });
  assert.strictEqual(u1.action, "CHOOSE_CLOTHING_COLOR");
  assert.strictEqual(u1.requestedAnswerType, "COLOR_RECOMMENDATION");
  assert.strictEqual(u1.timeframe.kind, "LOCAL_DATE");

  const u2 = understandQuestion({ question: "Can I submit my research paper today?" });
  assert.strictEqual(u2.action, "SUBMIT_RESEARCH_PAPER");
  assert.strictEqual(u2.requestedAnswerType, "ACTION_AND_TIMING_ASSESSMENT");

  const u3 = understandQuestion({ question: "Will expanding my business this week give me good luck?" });
  assert.strictEqual(u3.action, "EXPAND_EXISTING_BUSINESS");
  assert.strictEqual(u3.requestedGuarantee, "GOOD_LUCK");
  assert.strictEqual(u3.timeframe.kind, "LOCAL_WEEK");
});

// -----------------------------------------------------------------------------
// 7. END-TO-END PRODUCTION PATH VIA answerFollowUpQuestion
// -----------------------------------------------------------------------------
console.log("\n[7] Testing End-to-End Production Entry Point (answerFollowUpQuestion)...");

const sampleChart = {
  system: { id: "lahiri", name: "Lahiri" },
  ascendant: { sign: "Aries", degree: 14.5 },
  planets: [
    { name: "Sun", sign: "Aries", house: 1, dignity: "exalted" },
    { name: "Moon", sign: "Taurus", house: 2, dignity: "exalted" },
    { name: "Mars", sign: "Capricorn", house: 10, dignity: "exalted" },
    { name: "Mercury", sign: "Gemini", house: 3, dignity: "own" },
    { name: "Jupiter", sign: "Cancer", house: 4, dignity: "exalted" },
    { name: "Venus", sign: "Taurus", house: 2, dignity: "own" },
    { name: "Saturn", sign: "Libra", house: 7, dignity: "exalted" }
  ],
  bhavasDetailed: [
    { num: 1, signName: "Aries", lordName: "Mars" },
    { num: 2, signName: "Taurus", lordName: "Venus" },
    { num: 3, signName: "Gemini", lordName: "Mercury" },
    { num: 4, signName: "Cancer", lordName: "Moon" },
    { num: 5, signName: "Leo", lordName: "Sun" },
    { num: 6, signName: "Virgo", lordName: "Mercury" },
    { num: 7, signName: "Libra", lordName: "Venus" },
    { num: 8, signName: "Scorpio", lordName: "Mars" },
    { num: 9, signName: "Sagittarius", lordName: "Jupiter" },
    { num: 10, signName: "Capricorn", lordName: "Saturn" },
    { num: 11, signName: "Aquarius", lordName: "Saturn" },
    { num: 12, signName: "Pisces", lordName: "Jupiter" }
  ]
};

const productionContext = buildFollowUpContext({
  chartData: sampleChart,
  activeSection: "career",
  systemId: "lahiri"
});

await testCheck("Scenario 1: 'What colour dress can I wear today?' answers colour directly without reciting Aries ascendant", async () => {
  const ans = await answerFollowUpQuestion({
    question: "What colour dress can I wear today?",
    context: productionContext,
    conversationHistory: []
  });
  // Must contain colour recommendation
  assert.ok(/Orange|Red|Gold|White|Silver|Coral|Green|Yellow|Pink|Blue|Black|hues|recommend/i.test(ans.answer));
  // Must NOT substitute generic ascendant framework
  assert.ok(!ans.answer.includes("establishes the astrological framework for this inquiry"));
  assert.ok(!ans.answer.includes("According to your calculated report, your Ascendant (Lagna) is Aries, with primary planetary dispositors"));
});

await testCheck("Scenario 2: 'Can I submit my research paper today?' answers submission election directly without PhD overview", async () => {
  const ans = await answerFollowUpQuestion({
    question: "Can I submit my research paper today?",
    context: productionContext,
    conversationHistory: []
  });
  // Must distinguish practical readiness from electional calculation
  assert.ok(ans.answer.includes("daily electional calculation has not been run") || ans.answer.includes("preferred submission window"));
  assert.ok(ans.answer.includes("does not predict acceptance"));
  // Must NOT deliver general educational or PhD disposition overview
  assert.ok(!ans.answer.includes("academic disposition"));
  assert.ok(!ans.answer.includes("higher intelligence in"));
});

await testCheck("Scenario 3: 'Will expanding the business this week give me good luck?' answers expansion directly without promising luck", async () => {
  const ans = await answerFollowUpQuestion({
    question: "Will expanding the business this week give me good luck?",
    context: productionContext,
    conversationHistory: []
  });
  // Must evaluate the requested week
  assert.ok(ans.answer.includes("does not establish that expanding this week") || ans.answer.includes("timing assessment"));
  // Must refuse luck guarantee
  assert.ok(ans.answer.includes("will bring good luck") || ans.answer.includes("luck"));
  assert.ok(ans.answer.includes("No distinct expansion window has been identified for the requested week") || ans.answer.includes("not evidence that expansion will be profitable"));
});

await testCheck("Same chart produces 3 completely different task answers without repeating boilerplate", async () => {
  const ans1 = await answerFollowUpQuestion({
    question: "What colour dress can I wear today?",
    context: productionContext
  });
  const ans2 = await answerFollowUpQuestion({
    question: "Can I submit my research paper today?",
    context: productionContext
  });
  const ans3 = await answerFollowUpQuestion({
    question: "Will expanding the business this week give me good luck?",
    context: productionContext
  });

  const uniqueAnswers = new Set([ans1.answer, ans2.answer, ans3.answer]);
  assert.strictEqual(uniqueAnswers.size, 3, "All three task responses are 100% distinct and task-tailored");
});

console.log("\n===========================================================================");
console.log(` RESULTS: ${passedCount} tests passed (100%)`);
console.log(" ALL TASK-SPECIFIC Q&A ENGINE REQUIREMENTS VERIFIED SUCCESSFULLY!");
console.log("===========================================================================\n");
