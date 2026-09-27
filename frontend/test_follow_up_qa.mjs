/**
 * ASTROVERSE — Follow-Up Questions & Answers Comprehensive Verification Suite
 *
 * Exhaustively tests:
 * A. Section-wise question generation (all chapters, all systems)
 * B. Full report question generation & dynamic data interpolation
 * C. Question deduplication & ranking
 * D. System isolation (Lahiri, KP, Raman, Tropical)
 * E. Unsupported system techniques (Tropical rejects D9/Dashas, KP rejects Shadbala)
 * F. Deterministic factual router (Ascendant, Moon, Nakshatra, Dasha, Sub-lord, System)
 * G. Anti-hallucination guards & evidence ID verification
 * H. Conversational follow-up reference resolution ("What about 2027?")
 * I. Offline / API failure deterministic fallback
 * J. Clean context builder without data leakage
 */

import {
  calculateChartBySystem,
  calculateMultiSystemBundle
} from "./src/astrology/index.js";
import {
  getSectionQuestions,
  getFullReportQuestions
} from "./src/services/followUpQuestionService.js";
import { buildFollowUpContext } from "./src/services/followUpContextBuilder.js";
import { routeFollowUpQuestion, resolveConversationalReferences } from "./src/services/followUpRouter.js";
import { answerFollowUpQuestion, validateChartClaims, buildRelevantReportContext } from "./src/services/followUpAnswerService.js";
import { ALL_REPORT_CHAPTERS } from "./src/config/reportChapters.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failedCount++;
    throw new Error(message);
  } else {
    console.log(`✓ ${message}`);
    passedCount++;
  }
}

console.log("=================================================================");
console.log(" RUNNING ASTROVERSE FOLLOW-UP Q&A VERIFICATION SUITE");
console.log("=================================================================\n");

// Baseline Birth Data
const testBirthData = {
  birthDate: "1995-10-24",
  birthTime: "10:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5,
  timezoneId: "Asia/Kolkata"
};

// Calculate charts across all 4 systems
console.log("1. Calculating authoritative benchmark charts for 4 systems...");
const bundle = calculateMultiSystemBundle(testBirthData);
const lahiriChart = bundle.systems.lahiri;
const kpChart = bundle.systems.kp;
const ramanChart = bundle.systems.raman;
const tropicalChart = bundle.systems.tropical;

assert((lahiriChart.system?.id || lahiriChart.system) === "lahiri", "Lahiri chart calculated successfully");
assert((kpChart.system?.id || kpChart.system) === "kp", "KP chart calculated successfully");
assert((ramanChart.system?.id || ramanChart.system) === "raman", "Raman chart calculated successfully");
assert((tropicalChart.system?.id || tropicalChart.system) === "tropical", "Tropical chart calculated successfully");

// -------------------------------------------------------------
// TEST A: Section-Wise Question Generation
// -------------------------------------------------------------
console.log("\n2. Testing Section-Wise Question Generation Across All Canonical Chapters...");

for (const ch of ALL_REPORT_CHAPTERS) {
  const lahiriSec = getSectionQuestions({
    sectionId: ch.id,
    systemId: "lahiri",
    chartData: lahiriChart,
    multiSystemBundle: bundle
  });

  if (ch.systems.includes("lahiri")) {
    assert(lahiriSec.applicable === true, `Chapter ${ch.id} is applicable for Lahiri`);
    assert(Array.isArray(lahiriSec.questions) && lahiriSec.questions.length > 0, `Chapter ${ch.id} generated valid questions (count: ${lahiriSec.questions.length})`);
    
    // Check no duplicate questions
    const set = new Set(lahiriSec.questions.map(q => q.text.toLowerCase().trim()));
    assert(set.size === lahiriSec.questions.length, `Chapter ${ch.id} has zero duplicate questions`);
  } else {
    assert(lahiriSec.applicable === false, `Chapter ${ch.id} is correctly marked inapplicable for Lahiri`);
  }
}

// -------------------------------------------------------------
// TEST B: System Isolation in Question Generation
// -------------------------------------------------------------
console.log("\n3. Testing System Isolation in Question Generation...");

// Tropical should NOT receive Vedic-only chapters (yogas, dosha, remedies, timeline, milestoneAudit, reasoningDossier)
const tropicalYogas = getSectionQuestions({
  sectionId: "yogas",
  systemId: "tropical",
  chartData: tropicalChart,
  multiSystemBundle: bundle
});
assert(tropicalYogas.applicable === false, "Tropical correctly rejects Vedic yogas chapter");

const tropicalTimeline = getSectionQuestions({
  sectionId: "timeline",
  systemId: "tropical",
  chartData: tropicalChart,
  multiSystemBundle: bundle
});
assert(tropicalTimeline.applicable === false, "Tropical correctly rejects Vimshottari timeline chapter");

// KP should generate KP-specific questions in Career section
const kpCareer = getSectionQuestions({
  sectionId: "career",
  systemId: "kp",
  chartData: kpChart,
  multiSystemBundle: bundle
});
assert(kpCareer.applicable === true, "KP Career section is applicable");
const hasKpSubLordQ = kpCareer.questions.some(q => q.category === "KP" || q.text.includes("sub lord"));
assert(hasKpSubLordQ, "KP Career section includes KP sub-lord questions");

// Tropical Career should NOT mention D10 or KP sub-lords
const tropCareer = getSectionQuestions({
  sectionId: "career",
  systemId: "tropical",
  chartData: tropicalChart,
  multiSystemBundle: bundle
});
assert(tropCareer.applicable === true, "Tropical Career section is applicable");
const tropHasD10 = tropCareer.questions.some(q => q.text.includes("D10") || q.text.includes("Dashamsha"));
const tropHasKp = tropCareer.questions.some(q => q.text.includes("sub lord") || q.text.includes("KP"));
assert(!tropHasD10, "Tropical Career questions strictly exclude D10 Dashamsha");
assert(!tropHasKp, "Tropical Career questions strictly exclude KP sub lords");

// -------------------------------------------------------------
// TEST C: Dynamic Data Interpolation
// -------------------------------------------------------------
console.log("\n4. Testing Dynamic Data Interpolation in Templates...");

const lahiriTimeline = getSectionQuestions({
  sectionId: "timeline",
  systemId: "lahiri",
  chartData: lahiriChart,
  multiSystemBundle: bundle
});
const curMd = lahiriChart.currentDasha?.lord;
const curAd = lahiriChart.currentDasha?.subLord;
assert(Boolean(curMd), `Lahiri chart has calculated current Mahadasha (${curMd})`);

const dashaQ = lahiriTimeline.questions.find(q => q.category === "Dasha");
assert(Boolean(dashaQ), "Timeline questions include active Dasha query");
assert(dashaQ.text.includes(curMd), `Dasha question dynamically interpolates Mahadasha: "${dashaQ.text}"`);

// -------------------------------------------------------------
// TEST D: Full Report General Questions
// -------------------------------------------------------------
console.log("\n5. Testing Full Report General Question Generation...");

const fullLahiri = getFullReportQuestions({
  systemId: "lahiri",
  chartData: lahiriChart,
  multiSystemBundle: bundle
});
assert(fullLahiri.questions.length >= 6 && fullLahiri.questions.length <= 10, `Full report returns 6-10 questions (got ${fullLahiri.questions.length})`);
assert(fullLahiri.questions.some(q => q.category === "General"), "Full report contains General synthesis questions");
assert(fullLahiri.questions.some(q => q.category === "System Comparison"), "Full report contains System Comparison questions");

const fullTropical = getFullReportQuestions({
  systemId: "tropical",
  chartData: tropicalChart,
  multiSystemBundle: bundle
});
assert(!fullTropical.questions.some(q => q.text.includes("dasha")), "Tropical full report questions strictly exclude Dasha");

// -------------------------------------------------------------
// TEST E: Deterministic Factual Router
// -------------------------------------------------------------
console.log("\n6. Testing Deterministic Factual Router...");

const lahiriContext = buildFollowUpContext({
  chartData: lahiriChart,
  activeSection: "execSummary",
  systemId: "lahiri",
  multiSystemBundle: bundle
});

// A. Ascendant
const ascRoute = routeFollowUpQuestion("What is my Ascendant?", lahiriContext);
assert(ascRoute.type === "FACTUAL", "Ascendant question routed as FACTUAL");
assert(ascRoute.status === "DETERMINISTIC_FACT", "Ascendant question status is DETERMINISTIC_FACT");
assert(ascRoute.answer.includes(lahiriChart.ascendant?.sign || lahiriChart.ascendantSign?.name), `Ascendant answer includes sign: "${ascRoute.answer}"`);

// B. Moon Sign
const moonRoute = routeFollowUpQuestion("What is my Moon sign?", lahiriContext);
assert(moonRoute.type === "FACTUAL", "Moon sign question routed as FACTUAL");
assert(moonRoute.answer.includes(lahiriChart.moon?.sign || lahiriChart.moonSign?.name), "Moon sign answer includes calculated moon sign");

// C. Nakshatra
const nakRoute = routeFollowUpQuestion("What is my Nakshatra?", lahiriContext);
assert(nakRoute.type === "FACTUAL", "Nakshatra question routed as FACTUAL");
assert(nakRoute.answer.includes(lahiriChart.moon?.nakshatra || lahiriChart.moonNakshatra?.name), "Nakshatra answer includes calculated nakshatra");

// D. Current Mahadasha
const dashaRoute = routeFollowUpQuestion("What is my current Mahadasha?", lahiriContext);
assert(dashaRoute.type === "FACTUAL", "Mahadasha question routed as FACTUAL");
assert(dashaRoute.answer.includes(curMd), `Mahadasha answer includes calculated lord: "${dashaRoute.answer}"`);

// E. Astrology System
const sysRoute = routeFollowUpQuestion("Which system am I using?", lahiriContext);
assert(sysRoute.type === "FACTUAL", "System question routed as FACTUAL");
assert(sysRoute.answer.includes("Lahiri"), "System answer identifies Lahiri");

// F. KP 10th Cusp Sub Lord
const kpContext = buildFollowUpContext({
  chartData: kpChart,
  activeSection: "career",
  systemId: "kp",
  multiSystemBundle: bundle
});
const kpSubRoute = routeFollowUpQuestion("What is my 10th cusp sub lord?", kpContext);
assert(kpSubRoute.type === "FACTUAL", "KP 10th cusp sub lord routed as FACTUAL");
const expectedSub10 = kpChart.houses?.find(h => h.house === 10)?.subLord;
assert(kpSubRoute.answer.includes(expectedSub10), `KP 10th sub lord answer contains calculated lord ${expectedSub10}: "${kpSubRoute.answer}"`);

// -------------------------------------------------------------
// TEST F: System Isolation Rejection & Anti-Hallucination
// -------------------------------------------------------------
console.log("\n7. Testing System Isolation Rejection & Anti-Hallucination...");

const tropicalContext = buildFollowUpContext({
  chartData: tropicalChart,
  activeSection: "blueprint",
  systemId: "tropical",
  multiSystemBundle: bundle
});

// Asking Tropical about D9 Navamsha
const tropD9Route = routeFollowUpQuestion("What does my D9 Navamsha indicate?", tropicalContext);
assert(tropD9Route.type === "UNSUPPORTED_SYSTEM", "Tropical D9 query routed as UNSUPPORTED_SYSTEM");
assert(tropD9Route.status === "INSUFFICIENT_DATA", "Tropical D9 query marked INSUFFICIENT_DATA");
assert(tropD9Route.answer.includes("not applicable under the selected Tropical"), "Tropical D9 query returns clear explanatory refusal");

// Asking Tropical about Vimshottari Mahadasha
const tropDashaRoute = routeFollowUpQuestion("What is my current Mahadasha?", tropicalContext);
assert(tropDashaRoute.type === "UNSUPPORTED_SYSTEM", "Tropical Mahadasha query routed as UNSUPPORTED_SYSTEM");

// Asking KP about Shadbala Virupas
const kpShadbalaRoute = routeFollowUpQuestion("What is my Shadbala strength?", kpContext);
assert(kpShadbalaRoute.type === "UNSUPPORTED_SYSTEM", "KP Shadbala query routed as UNSUPPORTED_SYSTEM");
assert(kpShadbalaRoute.answer.includes("not calculated under Krishnamurti Padhdhati"), "KP Shadbala query returns explanatory refusal");

// -------------------------------------------------------------
// TEST G: Conversational Reference Resolution
// -------------------------------------------------------------
console.log("\n8. Testing Conversational Reference Resolution...");

const conversation1 = [
  { role: "user", content: "What does my report indicate about career growth?" },
  { role: "assistant", content: "Your career analysis highlights 10th house strength and leadership progression." }
];

const ref2027 = resolveConversationalReferences("What about 2027?", conversation1, "fullReport");
assert(ref2027.isFollowUp === true, "'What about 2027?' identified as conversational follow-up");
assert(ref2027.resolvedDomain === "career", "'What about 2027?' correctly resolves to career domain");
assert(ref2027.resolvedText.includes("2027"), "Resolved text includes year 2027");

const refWhy = resolveConversationalReferences("Why Saturn?", conversation1, "career");
assert(refWhy.isFollowUp === true, "'Why Saturn?' identified as conversational follow-up");

// -------------------------------------------------------------
// TEST H: Full Answer Service Integration & Deterministic Synthesis
// -------------------------------------------------------------
console.log("\n9. Testing Full Answer Service with Grounded Synthesis & Evidence...");

// Factual question directly answered
const ansFactual = await answerFollowUpQuestion({
  question: "What is my Ascendant?",
  context: lahiriContext
});
assert(ansFactual.status === "DETERMINISTIC_FACT", "Factual answer has status DETERMINISTIC_FACT");
const expectedAsc = lahiriChart.ascendantSign?.name || lahiriChart.ascendant?.sign || "Sagittarius";
assert(ansFactual.answer.includes(expectedAsc), "Factual answer returns actual calculated Ascendant");

// Analytical question answered with report grounding (offline / fallback mode)
const ansCareer = await answerFollowUpQuestion({
  question: "What does my report indicate about career growth?",
  context: lahiriContext
});
assert(ansCareer.status === "REPORT_SUPPORTED", "Analytical answer has status REPORT_SUPPORTED");
assert(ansCareer.relevantSections.includes("career"), "Career answer cites career section");
assert(ansCareer.answer.length > 50, `Career answer has comprehensive content (length: ${ansCareer.answer.length})`);
assert(ansCareer.system === "lahiri", "Career answer maintains Lahiri system");

// Analytical health question receives medical notice
const ansHealth = await answerFollowUpQuestion({
  question: "What traditional health indicators are in my report?",
  context: lahiriContext
});
assert(ansHealth.relevantSections.includes("health"), "Health answer cites health section");
assert(/medical|மருத்துவ/i.test(ansHealth.answer), "Health answer includes mandatory traditional medical notice");

// -------------------------------------------------------------
// TEST I: Evidence ID Integrity Check
// -------------------------------------------------------------
console.log("\n10. Testing Evidence ID Integrity Check...");

// Ensure no fictitious evidence IDs
const validEvidenceSet = new Set(lahiriContext.evidence.evidenceIds);
for (const evId of ansCareer.evidenceIds) {
  assert(validEvidenceSet.has(evId), `Returned evidence ID "${evId}" exists in verified context`);
}

// -------------------------------------------------------------
// TEST J: Raman & KP Multi-System Differences
// -------------------------------------------------------------
console.log("\n11. Testing Raman & KP Multi-System Differences...");

const ramanContext = buildFollowUpContext({
  chartData: ramanChart,
  activeSection: "blueprint",
  systemId: "raman",
  multiSystemBundle: bundle
});
const ansRamanSys = await answerFollowUpQuestion({
  question: "Which system am I using?",
  context: ramanContext
});
assert(ansRamanSys.system === "raman", "Raman context preserves raman system ID");
assert(ansRamanSys.answer.includes("Raman"), "Raman answer references Raman system");

// -------------------------------------------------------------
// TEST K: Negative Testing for Absent Divisional Charts & Metrics
// -------------------------------------------------------------
console.log("\n12. Testing Negative Cases: Absent D9, D10, Shadbala, Ashtakavarga...");

const strippedChart = {
  ...lahiriChart,
  structuredVargas: null,
  divisionalCharts: null,
  shadbala: null,
  ashtakavarga: null
};

// Absent D9 -> no D9 questions in relationships
const noD9Rel = getSectionQuestions({
  sectionId: "relationships",
  systemId: "lahiri",
  chartData: strippedChart,
  multiSystemBundle: bundle
});
const hasD9Q = noD9Rel.questions.some(q => /d9|navamsha|navamsa/i.test(q.text));
assert(!hasD9Q, "When D9 is absent from chartData, D9 questions strictly do NOT appear");

// Absent D10 -> no D10 questions in career
const noD10Career = getSectionQuestions({
  sectionId: "career",
  systemId: "lahiri",
  chartData: strippedChart,
  multiSystemBundle: bundle
});
const hasD10Q = noD10Career.questions.some(q => /d10|dashamsha|dasamsha/i.test(q.text));
assert(!hasD10Q, "When D10 is absent from chartData, D10 questions strictly do NOT appear");

// Absent Shadbala/Ashtakavarga -> no Shadbala/SAV questions in technicalAppendix
const noMetricsApp = getSectionQuestions({
  sectionId: "technicalAppendix",
  systemId: "lahiri",
  chartData: strippedChart,
  multiSystemBundle: bundle
});
const hasShadbalaQ = noMetricsApp.questions.some(q => /shadbala/i.test(q.text));
const hasSavQ = noMetricsApp.questions.some(q => /ashtakavarga/i.test(q.text));
assert(!hasShadbalaQ, "When Shadbala is absent from chartData, Shadbala questions strictly do NOT appear");
assert(!hasSavQ, "When Ashtakavarga is absent from chartData, Ashtakavarga questions strictly do NOT appear");

// -------------------------------------------------------------
// TEST L: Absent Career Finding Returns INSUFFICIENT_DATA (No Hallucinated Fallback)
// -------------------------------------------------------------
console.log("\n13. Testing Absent Career Finding Returns INSUFFICIENT_DATA (No Generic Hallucination)...");

const bareChart = {
  system: { id: "lahiri", name: "Lahiri" },
  planets: [{ name: "Sun", sign: "Libra", house: 11 }]
};
const bareContext = buildFollowUpContext({
  chartData: bareChart,
  activeSection: "career",
  systemId: "lahiri"
});
const bareAns = await answerFollowUpQuestion({
  question: "What does my report indicate about career growth?",
  context: bareContext
});
assert(bareAns.status === "INSUFFICIENT_DATA", "Absent career finding returns status INSUFFICIENT_DATA");
assert(
  bareAns.answer.includes("not available in the calculated report context") || bareAns.answer.includes("கிடைக்கவில்லை"),
  "Absent career finding gives honest explanatory message"
);
assert(!bareAns.answer.includes("Supportive professional momentum"), "Eliminated generic fallback 'Supportive professional momentum'");

// -------------------------------------------------------------
// TEST M: Conversational Follow-Up with Real UI History Format
// -------------------------------------------------------------
console.log("\n14. Testing Conversational Follow-Up with Real UI History Schema...");

const uiStoredHistory = [
  {
    role: "user",
    content: "What does my report indicate about career momentum?",
    question: "What does my report indicate about career momentum?",
    answer: "Your career analysis indicates significant momentum in the 10th house.",
    system: "lahiri",
    timestamp: Date.now()
  }
];

const uiRefYear = resolveConversationalReferences("What about 2027?", uiStoredHistory, "fullReport");
assert(uiRefYear.isFollowUp === true, "UI history format correctly identifies 'What about 2027?' as follow-up");
assert(uiRefYear.resolvedDomain === "career", "UI history format correctly resolves domain to career");
assert(uiRefYear.resolvedText.includes("2027"), "Resolved text contains year 2027");

const uiRefWhy = resolveConversationalReferences("Why Saturn?", uiStoredHistory, "fullReport");
assert(uiRefWhy.isFollowUp === true, "UI history format correctly identifies 'Why Saturn?' as follow-up");

// -------------------------------------------------------------
// TEST N: Zero Synthetic Evidence IDs on Empty Ledger
// -------------------------------------------------------------
console.log("\n15. Testing Zero Synthetic Evidence IDs on Empty Ledger...");

assert(bareContext.evidence.evidenceIds.length === 0, "Bare context contains exactly 0 evidence IDs");
assert(bareAns.evidenceIds.length === 0, "Bare answer contains exactly 0 evidence IDs");
const prohibitedPrefixes = ["C01", "C02", "W01", "W02", "M01", "M02"];
for (const p of prohibitedPrefixes) {
  assert(!bareAns.evidenceIds.includes(p), `Synthetic evidence ID ${p} strictly absent from bare answer`);
}

// -------------------------------------------------------------
// TEST O: Astrological Fact & Claim Validator
// -------------------------------------------------------------
console.log("\n16. Testing Astrological Fact & Claim Validator...");

// Jupiter in lahiriChart is in Scorpio (House 1 for Sagittarius Ascendant)
const actualJup = lahiriChart.planets.find(p => p.name === "Jupiter");
assert(Boolean(actualJup), "Lahiri chart contains Jupiter");

// A. False house claim: "Jupiter is in the 10th house"
const falseHouseClaim = validateChartClaims("Jupiter is in the 10th house and guides career.", lahiriChart.planets);
assert(falseHouseClaim.isValid === false, "Claim validator catches false house assertion");
assert(falseHouseClaim.violations.length > 0, "Claim validator logs violation for false house");

// B. False sign claim: "Jupiter in Aries brings courage."
const falseSignClaim = validateChartClaims("Jupiter in Aries brings courage.", lahiriChart.planets);
assert(falseSignClaim.isValid === false, "Claim validator catches false sign assertion");
assert(falseSignClaim.violations.length > 0, "Claim validator logs violation for false sign");

// C. Accurate claim: "Jupiter in Scorpio"
const accurateClaim = validateChartClaims(`Jupiter in ${actualJup.sign} supports wisdom.`, lahiriChart.planets);
assert(accurateClaim.isValid === true, "Claim validator correctly approves true astrological placement");

// -------------------------------------------------------------
// TEST P: Expanded Claim Validator (D9, D10, KP, Dasha, Evidence, Structured)
// -------------------------------------------------------------
console.log("\n17. Testing Expanded Claim Validator (D9, D10, KP, Dasha, Evidence, Structured)...");

// A. False D9 Ascendant
const falseD9Claim = validateChartClaims("Your D9 Ascendant in Aries reveals marriage harmony.", lahiriContext);
assert(falseD9Claim.isValid === false, "Validator catches false D9 Ascendant assertion");
assert(falseD9Claim.violations.some(v => v.includes("D9 Ascendant")), "Validator logs violation for false D9 Ascendant");

// B. False D10 Ascendant
const falseD10Claim = validateChartClaims("Your D10 Ascendant is in Leo, granting executive authority.", lahiriContext);
assert(falseD10Claim.isValid === false, "Validator catches false D10 Ascendant assertion");
assert(falseD10Claim.violations.some(v => v.includes("D10 Ascendant")), "Validator logs violation for false D10 Ascendant");

// C. False KP Cusp Sub-Lord
const falseKpClaim = validateChartClaims("Your 10th cusp sub lord is Saturn.", kpContext);
assert(falseKpClaim.isValid === false, "Validator catches false KP 10th cusp sub-lord assertion");
assert(falseKpClaim.violations.some(v => v.includes("cusp 10 sub-lord")), "Validator logs violation for false KP sub-lord");

// D. False Current Mahadasha
const falseDashaClaim = validateChartClaims("Your current Mahadasha is Saturn.", lahiriContext);
assert(falseDashaClaim.isValid === false, "Validator catches false active Mahadasha assertion");
assert(falseDashaClaim.violations.some(v => v.includes("active Mahadasha")), "Validator logs violation for false Mahadasha");

// E. Unverified Evidence ID Citation
const falseEvClaim = validateChartClaims("According to Evidence C99, career will expand.", lahiriContext);
assert(falseEvClaim.isValid === false, "Validator catches fictitious evidence ID C99 citation");
assert(falseEvClaim.violations.some(v => v.includes("C99")), "Validator logs violation for unverified evidence ID");

// F. Structured Claims Validation
const validStructured = validateChartClaims("Grounded summary.", lahiriContext, [
  { type: "planet_house", planet: "Jupiter", house: actualJup.house },
  { type: "mahadasha", lord: "Jupiter" }
]);
assert(validStructured.isValid === true, "Validator approves accurate structured claims");

const invalidStructured = validateChartClaims("Grounded summary.", lahiriContext, [
  { type: "planet_house", planet: "Jupiter", house: 10 }
]);
assert(invalidStructured.isValid === false, "Validator catches contradictory structured claim");

// -------------------------------------------------------------
// TEST Q: Question-Specific Context Reducer
// -------------------------------------------------------------
console.log("\n18. Testing Question-Specific Context Reducer (Zero Blind 1200 Slicing)...");

const careerReduced = buildRelevantReportContext("What does my career look like?", lahiriContext, {
  relevantSections: ["career"]
});
assert(Boolean(careerReduced.career), "Context reducer produces targeted career block");
assert(Boolean(careerReduced.career.d10Dashamsha), "Career context includes complete D10 Dashamsha without truncation");
assert(Array.isArray(careerReduced.career.careerWindows), "Career context includes complete timing windows");

const kpReduced = buildRelevantReportContext("What does my 10th cusp indicate?", kpContext, {
  relevantSections: ["technicalAppendix", "career"]
});
assert(Boolean(kpReduced.kp), "Context reducer produces targeted KP block");
assert(Array.isArray(kpReduced.kp.cusps) && kpReduced.kp.cusps.length === 12, "KP context includes all 12 cusps completely");

// -------------------------------------------------------------
// TEST R: Zero Generic Fallback Prose in Deterministic Answers
// -------------------------------------------------------------
console.log("\n19. Testing Zero Generic Fallback Prose in Deterministic Answers...");

const emptyHealthContext = buildFollowUpContext({
  chartData: { system: { id: "lahiri", name: "Lahiri" }, ascendant: { sign: "Aries" } },
  activeSection: "health"
});
const emptyHealthAns = await answerFollowUpQuestion({
  question: "What health indicators are in my report?",
  context: emptyHealthContext
});
assert(emptyHealthAns.status === "INSUFFICIENT_DATA", "Missing health findings return status INSUFFICIENT_DATA");
assert(!emptyHealthAns.answer.includes("Mindful daily routines recommended"), "Zero 'Mindful daily routines recommended' fallback");
assert(!emptyHealthAns.answer.includes("Evaluated"), "Zero 'Evaluated' fallback in answer");

// Verify distinction between [Report Finding] and [Traditional Context]
const verifiedCareerAns = await answerFollowUpQuestion({
  question: "What does my report indicate about career growth?",
  context: lahiriContext
});
assert(verifiedCareerAns.answer.includes("[Report Finding]"), "Answer explicitly distinguishes [Report Finding]");
assert(verifiedCareerAns.answer.includes("[Traditional Context]"), "Answer explicitly distinguishes [Traditional Context]");

// -------------------------------------------------------------
// TEST S: Enhanced Full-Report Dynamic Question Generation
// -------------------------------------------------------------
console.log("\n20. Testing Enhanced Full-Report Dynamic Question Generation...");

const dynamicFullQuestions = getFullReportQuestions({
  systemId: "lahiri",
  chartData: lahiriChart,
  multiSystemBundle: bundle
});
const hasTimingWinQ = dynamicFullQuestions.questions.some(q => q.category === "Timing");
const hasYogaQ = dynamicFullQuestions.questions.some(q => q.category === "Yogas");
const hasRemedyQ = dynamicFullQuestions.questions.some(q => q.category === "Remedies");

assert(hasTimingWinQ, "Full report questions dynamically generate finding-based timing window questions");
assert(hasYogaQ, "Full report questions dynamically generate finding-based power yoga questions");
assert(hasRemedyQ, "Full report questions dynamically generate contraindicated gemstone safety questions");

// -------------------------------------------------------------
// TEST T: Comprehensive Anti-Fabrication & Strict Claim Rejection
// -------------------------------------------------------------
console.log("\n21. Testing Missing Fact Rejection, Unknown Planets, False Timing & Dasha Dates...");

// 1. Missing D10 in context + AI claims D10 Leo -> MUST REJECT
const noD10Context = buildFollowUpContext({
  chartData: {
    system: { id: "lahiri", name: "Lahiri" },
    planets: [{ name: "Sun", sign: "Libra", house: 11 }]
  },
  activeSection: "career"
});
const missingD10Check = validateChartClaims("Grounded answer.", noD10Context, [
  { type: "d10_ascendant", sign: "Leo" }
]);
assert(missingD10Check.isValid === false, "Missing D10 in context + AI claim D10 Leo is strictly rejected");
assert(missingD10Check.violations.some(v => v.includes("D10 is unavailable")), "Logs violation that D10 is unavailable");

// 2. Missing KP in context + AI claims KP sub-lord -> MUST REJECT
const missingKpCheck = validateChartClaims("Grounded answer.", noD10Context, [
  { type: "kp_sub_lord", cusp: 10, planet: "Saturn" }
]);
assert(missingKpCheck.isValid === false, "Missing KP in context + AI claim KP sub-lord is strictly rejected");
assert(missingKpCheck.violations.some(v => v.includes("KP cusps are unavailable")), "Logs violation that KP cusps are unavailable");

// 3. Unknown planet (Pluto in Sidereal chart) in structured claim -> MUST REJECT
const unknownPlanetCheck = validateChartClaims("Grounded answer.", lahiriContext, [
  { type: "planet_house", planet: "Pluto", house: 10 }
]);
assert(unknownPlanetCheck.isValid === false, "Unknown planet Pluto in structured claim is strictly rejected");
assert(unknownPlanetCheck.violations.some(v => v.includes("Unverifiable planet claim")), "Logs violation for unverifiable planet claim");

// 4. False timing window ("2030-2032") -> MUST REJECT
const falseTimingCheck = validateChartClaims("Grounded answer.", lahiriContext, [
  { type: "timing_window", years: "2030-2032" }
]);
assert(falseTimingCheck.isValid === false, "False timing window '2030-2032' is strictly rejected");
assert(falseTimingCheck.violations.some(v => v.includes("does not exist in calculated report windows")), "Logs violation for non-existent timing window");

// 5. False Dasha date / age range -> MUST REJECT
const falseDashaAgeCheck = validateChartClaims("Grounded answer.", lahiriContext, [
  { type: "mahadasha", lord: "Jupiter", startAge: 45.0, endAge: 61.0 }
]);
assert(falseDashaAgeCheck.isValid === false, "False Mahadasha age range is strictly rejected");
assert(falseDashaAgeCheck.violations.some(v => v.includes("start age") || v.includes("end age")), "Logs violation for contradicted Dasha ages");

// 6. False Ashtakavarga total (AI claims SAV 290 when actual is 337) -> MUST REJECT
const falseSavCheck = validateChartClaims("Your total SAV bindus of 290 indicate moderate strength.", lahiriContext, [
  { type: "ashtakavarga", totalBindus: 290 }
]);
assert(falseSavCheck.isValid === false, "False SAV total bindus (290 vs 337) is strictly rejected");
assert(falseSavCheck.violations.some(v => v.includes("Ashtakavarga total bindus") || v.includes("SAV total")), "Logs violation for false SAV bindu count");

// 7. Missing narrative summary in studies returns honest statement, never "Academic disposition evaluated"
const studiesNoNarrativeContext = buildFollowUpContext({
  chartData: {
    system: { id: "lahiri", name: "Lahiri" },
    domainPredictions: { studies: { topics: ["Math", "Logic"] } }
  },
  activeSection: "studies"
});
const studiesAns = await answerFollowUpQuestion({
  question: "What are my study indicators?",
  context: studiesNoNarrativeContext
});
assert(studiesAns.answer.includes("The report contains academic indicators, but no narrative academic conclusion was generated."), "Studies without narrative summary returns honest non-generic text");
assert(!studiesAns.answer.includes("Academic disposition evaluated"), "Zero 'Academic disposition evaluated' fallback");

// 8. Missing narrative summary in property returns honest statement, never "Real estate indicators evaluated"
const propNoNarrativeContext = buildFollowUpContext({
  chartData: {
    system: { id: "lahiri", name: "Lahiri" },
    masterPredictions: { property: { windows: [{ years: "2028-2030" }] } }
  },
  activeSection: "property"
});
const propAns = await answerFollowUpQuestion({
  question: "What are my property prospects?",
  context: propNoNarrativeContext
});
assert(propAns.answer.includes("The report contains property-related indicators, but no narrative property conclusion was generated."), "Property without narrative summary returns honest non-generic text");
assert(!propAns.answer.includes("Real estate indicators evaluated"), "Zero 'Real estate indicators evaluated' fallback");

// 9. Comparison point count is null if absent, never hardcoded 10
const emptyCompContext = buildFollowUpContext({
  chartData: { system: { id: "lahiri", name: "Lahiri" } },
  activeSection: "multiSystemComparison",
  multiSystemBundle: { comparison: {} }
});
assert(emptyCompContext.report.activeSectionData?.comparedPoints === null, "Multi-system comparison points is strictly null when uncalculated, never 10");

// -------------------------------------------------------------
// TEST U: Complete Section Coverage in AI Context Extractor
// -------------------------------------------------------------
console.log("\n22. Testing Complete Section Coverage in AI Context Extractor...");

// A. Panchanga
const panReduced = buildRelevantReportContext("What does my Panchanga indicate?", lahiriContext, {
  relevantSections: ["panchanga"]
});
assert(Boolean(panReduced.panchanga || lahiriContext.chart.panchanga === null), "Panchanga context is correctly handled");

// B. Blueprint / Natal Rasi
const blueprintReduced = buildRelevantReportContext("What are my exact planetary positions and avasthas?", lahiriContext, {
  relevantSections: ["blueprint"]
});
assert(Boolean(blueprintReduced.blueprint), "Blueprint context includes full planetary dataset");
assert(Array.isArray(blueprintReduced.blueprint.planets) && blueprintReduced.blueprint.planets.length > 0, "Blueprint context includes calculated natal planets");

// C. Jaimini Karakas
const jaiminiReduced = buildRelevantReportContext("What does my Jaimini Atmakaraka show?", lahiriContext, {
  relevantSections: ["jaimini"]
});
assert(Boolean(jaiminiReduced.jaimini), "Jaimini context includes karakas");

// D. Planetary Avasthas
const avasthasReduced = buildRelevantReportContext("Which planets are in Bala Avastha according to my report?", lahiriContext, {
  relevantSections: ["avasthas"]
});
assert(Boolean(avasthasReduced.avasthas || lahiriContext.chart.avasthas === null), "Avasthas context extractor is connected");

// E. Transits / Gochara
const transitReduced = buildRelevantReportContext("What does the transit section say about Saturn?", lahiriContext, {
  relevantSections: ["transits"]
});
assert(Boolean(transitReduced.transits || lahiriContext.chart.transits === null), "Transit context extractor is connected");

// F. Full Evidence Dossier & Reasoning Levels
const evidenceReduced = buildRelevantReportContext("Why did the evidence dossier reach this career prediction?", lahiriContext, {
  relevantSections: ["reasoningDossier"]
});
assert(Boolean(evidenceReduced.evidence), "Evidence dossier context extractor provides full records");
assert(Array.isArray(evidenceReduced.evidence.evidenceIds), "Evidence context contains verified evidence IDs array");

// G. Milestone Audit
const milestoneReduced = buildRelevantReportContext("What retrospective milestones are in my report?", lahiriContext, {
  relevantSections: ["milestoneAudit"]
});
assert(Boolean(milestoneReduced.milestoneAudit), "Milestone audit context is extracted");

// H. Route requiresEvidence detection
const routeWhy = routeFollowUpQuestion("Why did the report reach this career conclusion?", lahiriContext);
assert(routeWhy.requiresEvidence === true, "Questions asking 'Why did the report reach this...' correctly set requiresEvidence: true");

const routeFact = routeFollowUpQuestion("What is my Ascendant?", lahiriContext);
assert(routeFact.type === "FACTUAL", "Factual queries remain direct deterministic routes");

console.log("\n=======================================================");
console.log(` ALL FOLLOW-UP Q&A TESTS PASSED! (${passedCount} checks passed, ${failedCount} failed)`);
console.log("=======================================================\n");
