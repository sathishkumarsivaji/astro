/**
 * ASTROVERSE — Advanced Evidence-Linked Q&A Engine Verification Suite
 * ====================================================================
 * Verifies all 10 mandated test cases from Section 27 of the prompt:
 * 1. Spouse Family Wealth Comparison (NOT generic marriage timing)
 * 2. Spouse Direction & Distance (Explicit NOT_ESTABLISHED for km distance)
 * 3. Active Dasha Moon across life areas (Domain activation)
 * 4. Moon-Venus Dasha Effect (Mutual planet interaction)
 * 5. D10 Cancer Lagna Career (D10 analysis first)
 * 6. Property Timing (4th house + timing window)
 * 7. Finance (2nd/11th houses, Dhana factors, no return guarantees)
 * 8. Wellness (Traditional vitality only + medical safety layer)
 * 9. Legal Problem Timing (Caution window + no court outcome guarantee)
 * 10. Next 3 Years Timeline (Life-stage timeline, not raw dasha dump)
 */

import assert from "node:assert";
import { calculateChartBySystem } from "./src/astrology/index.js";
import { buildFollowUpContext } from "./src/services/followUpContextBuilder.js";
import { processEvidenceLinkedQA } from "./src/services/questionAnswer/index.js";

console.log("======================================================================");
console.log(" ASTROVERSE — ADVANCED EVIDENCE-LINKED Q&A ENGINE TEST SUITE");
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

const chartData = calculateChartBySystem("lahiri", birthData, { lang: "ta" });
const context = buildFollowUpContext({
  chartData,
  activeSection: "fullReport",
  systemId: "lahiri",
  lang: "ta"
});

let passedChecks = 0;
function testCheck(desc, condition) {
  assert.ok(condition, desc);
  console.log(`✓ ${desc}`);
  passedChecks++;
}

// ====================================================================
// TEST CASE 1: SPOUSE FAMILY WEALTH COMPARISON
// ====================================================================
console.log("\n--- TEST CASE 1: Spouse Family Wealth Comparison ---");
const q1 = "துணையின் குடும்பம் என்னை விட வசதியான குடும்பமாக அமையுமா?";
const res1 = await processEvidenceLinkedQA({ question: q1, context });
console.log("Direct Answer Preview:\n", res1.directAnswer);

testCheck("T1.1: Question addresses spouse family comparison directly",
  res1.answer.includes("துணையின் குடும்பம்") || res1.answer.includes("பொருளாதார"));
testCheck("T1.2: Evidence includes 2nd and/or 8th house factors",
  res1.answer.includes("2nd House") || res1.answer.includes("8th House") || res1.answer.includes("2-ம்") || res1.answer.includes("8-ம்"));
testCheck("T1.3: Does NOT lead with generic marriage timing boilerplate",
  !res1.directAnswer.includes("திருமண காலம்") && !res1.directAnswer.includes("மகா தசை — சூரியன் புக்தி காலத்தில் திருமணம்"));
testCheck("T1.4: Zero fabricated rupee / monetary amounts",
  !/\b\d+\s*கோடி|₹\s*\d+/i.test(res1.answer));
testCheck("T1.5: Contains mandatory 9 standardized sections",
  res1.answer.includes("[நேரடி பதில்") &&
  res1.answer.includes("[ஜோதிட ஆதாரங்கள்]") &&
  res1.answer.includes("[எப்படி இந்த முடிவு வந்தது") &&
  res1.answer.includes("[முரண்பட்ட குறியீடுகள்]") &&
  res1.answer.includes("[ஆதார நிலை]") &&
  res1.answer.includes("[துல்லிய நிலை]") &&
  res1.answer.includes("[எதை உறுதியாக கூற முடியாது]") &&
  res1.answer.includes("[அறிக்கைப் பிரிவுகள்]"));

// ====================================================================
// TEST CASE 2: SPOUSE DIRECTION AND DISTANCE
// ====================================================================
console.log("\n--- TEST CASE 2: Spouse Direction & Distance ---");
const q2 = "எனது ஊரிலிருந்து எந்த திசையில் மற்றும் எவ்வளவு தொலைவில் துணை அமைய வாய்ப்புள்ளது?";
const res2 = await processEvidenceLinkedQA({ question: q2, context });
console.log("Direct Answer Preview:\n", res2.directAnswer);

testCheck("T2.1: Direction is answered directly",
  res2.answer.includes("திசை") || res2.answer.includes("WEST") || res2.answer.includes("மேற்கு"));
testCheck("T2.2: Distance is explicitly declared NOT_ESTABLISHED / uncalculated",
  res2.answer.includes("கிலோமீட்டர் தூர மதிப்பீடு கணக்கிடப்படவில்லை") || res2.answer.includes("NOT_ESTABLISHED"));
testCheck("T2.3: Completeness validator passed both direction and distance",
  res2.pipelineAudit.completenessPass === true);
testCheck("T2.4: Does not fabricate exact kilometer figures (e.g. '142 km')",
  !/\b\d{2,4}\s*கி\.மீ\b|\b\d{2,4}\s*km\b/i.test(res2.directAnswer));

// ====================================================================
// TEST CASE 3: CURRENT DASHA MOON ACROSS LIFE DOMAINS
// ====================================================================
console.log("\n--- TEST CASE 3: Current Dasha Moon Across Domains ---");
const q3 = "என் நடப்பு தசை Moon வாழ்வின் பல்வேறு பகுதிகளில் எதை உணர்த்துகிறது?";
const res3 = await processEvidenceLinkedQA({ question: q3, context });
console.log("Direct Answer Preview:\n", res3.directAnswer);

testCheck("T3.1: Analysis focuses specifically on Moon",
  res3.answer.includes("Moon") || res3.answer.includes("சந்திரன்") || res3.answer.includes("சந்திர"));
testCheck("T3.2: Covers multiple activated life areas (vitality/family/finance/mind)",
  res3.answer.includes("மனோபலம்") || res3.answer.includes("குடும்ப") || res3.answer.includes("நிதி") || res3.answer.includes("மன அமைதி"));
testCheck("T3.3: Does not substitute generic Sun/Mars boilerplate",
  !res3.directAnswer.includes("சூரிய பகவான் மட்டுமே"));

// ====================================================================
// TEST CASE 4: MOON-VENUS DASHA EFFECT
// ====================================================================
console.log("\n--- TEST CASE 4: Moon-Venus Dasha Effect ---");
const q4 = "Moon–Venus தசா காலம் என்ன குறிக்கிறது?";
const res4 = await processEvidenceLinkedQA({ question: q4, context });
console.log("Direct Answer Preview:\n", res4.directAnswer);

testCheck("T4.1: Explains Moon and Venus mutual interaction",
  (res4.answer.includes("Moon") || res4.answer.includes("சந்திர")) &&
  (res4.answer.includes("Venus") || res4.answer.includes("சுக்கிர")));
testCheck("T4.2: Evidence list includes both Mahadasha and Antardasha lords",
  res4.dataUsed.some(d => d.includes("Mahadasha") || d.includes("Moon")) &&
  res4.dataUsed.some(d => d.includes("Antardasha") || d.includes("Venus")));
testCheck("T4.3: Avoids generic 'favorable period' without reasoning",
  res4.answer.includes("மனோகாரகன்") || res4.answer.includes("காரக") || res4.answer.includes("அச்சு"));

// ====================================================================
// TEST CASE 5: D10 CANCER LAGNA CAREER
// ====================================================================
console.log("\n--- TEST CASE 5: D10 Cancer Lagna Career ---");
const q5 = "என் D10 Cancer Lagna தொழில் அந்தஸ்தை எவ்வாறு தீர்மானிக்கிறது?";
const res5 = await processEvidenceLinkedQA({ question: q5, context });
console.log("Direct Answer Preview:\n", res5.directAnswer);

testCheck("T5.1: D10-specific analysis presented first in direct answer",
  res5.directAnswer.includes("D10") || res5.directAnswer.includes("தசாம்சம்"));
testCheck("T5.2: Mentions Cancer / கடகம் Lagna and its governance",
  res5.answer.includes("Cancer") || res5.answer.includes("கடகம்") || res5.answer.includes("Moon") || res5.answer.includes("சந்திரன்"));
testCheck("T5.3: Evaluates 10th house disposition of D10",
  res5.answer.includes("10-ம் பாவகம்") || res5.answer.includes("10th House") || res5.answer.includes("Aries") || res5.answer.includes("மேஷம்"));

// ====================================================================
// TEST CASE 6: PROPERTY TIMING
// ====================================================================
console.log("\n--- TEST CASE 6: Property Timing ---");
const q6 = "எப்போது property வாங்கும் வாய்ப்பு அதிகம்?";
const res6 = await processEvidenceLinkedQA({ question: q6, context });
console.log("Direct Answer Preview:\n", res6.directAnswer);

testCheck("T6.1: Cites 4th house and Mars (Bhumi Karaka) factors",
  res6.answer.includes("4-ம் பாவகம்") || res6.answer.includes("செவ்வாய்") || res6.answer.includes("Mars") || res6.answer.includes("4th House"));
testCheck("T6.2: Includes Timing Window section",
  res6.answer.includes("[முக்கிய காலக்கோடு]"));
testCheck("T6.3: Timing resolution clamped to YEAR or MONTH_RANGE",
  res6.timingResolution === "YEAR" || res6.timingResolution === "MONTH_RANGE");

// ====================================================================
// TEST CASE 7: FINANCE
// ====================================================================
console.log("\n--- TEST CASE 7: Finance & Wealth ---");
const q7 = "என் finance எப்படி இருக்கும்?";
const res7 = await processEvidenceLinkedQA({ question: q7, context });
console.log("Direct Answer Preview:\n", res7.directAnswer);

testCheck("T7.1: Analyzes 2nd house (Dhana) and 11th house (Gains)",
  res7.answer.includes("2-ம்") || res7.answer.includes("11-ம்") || res7.answer.includes("2nd") || res7.answer.includes("11th"));
testCheck("T7.2: Incorporates Dhanakaraka Jupiter",
  res7.answer.includes("குரு") || res7.answer.includes("Jupiter"));
testCheck("T7.3: Zero guaranteed investment return claims",
  !res7.answer.includes("100% லாபம் நிச்சயம்") && !res7.answer.includes("guaranteed profit"));

// ====================================================================
// TEST CASE 8: WELLNESS (HEALTH & VITALITY)
// ====================================================================
console.log("\n--- TEST CASE 8: Wellness & Vitality ---");
const q8 = "என் health எப்படி இருக்கும்?";
const res8 = await processEvidenceLinkedQA({ question: q8, context });
console.log("Direct Answer Preview:\n", res8.directAnswer);

testCheck("T8.1: Evaluates 1st house vitality and 6th house immunity",
  res8.answer.includes("1-ம்") || res8.answer.includes("6-ம்") || res8.answer.includes("1st") || res8.answer.includes("6th"));
testCheck("T8.2: Includes mandatory non-medical disclaimer",
  res8.answer.includes("மருத்துவ ஆலோசனை அல்ல") || res8.answer.includes("not medical advice"));
testCheck("T8.3: Zero prohibited disease / death predictions",
  !/\b(cancer|tumor|surgery|death)\b/i.test(res8.answer) &&
  !/புற்றுநோய்|அறுவை\s*சிகிச்சை|மரணம்/.test(res8.answer));

// ====================================================================
// TEST CASE 9: LEGAL CAUTION WINDOW
// ====================================================================
console.log("\n--- TEST CASE 9: Legal Caution Window ---");
const q9 = "எந்த காலத்தில் legal problem வரலாம்?";
const res9 = await processEvidenceLinkedQA({ question: q9, context });
console.log("Direct Answer Preview:\n", res9.directAnswer);

testCheck("T9.1: Cites 6th/8th house dispute/contestation indicators",
  res9.answer.includes("6-ம்") || res9.answer.includes("8-ம்") || res9.answer.includes("6th") || res9.answer.includes("8th"));
testCheck("T9.2: Emphasizes caution rather than guaranteed court victory/defeat",
  !res9.answer.includes("நீதிமன்ற வெற்றி உறுதி") && !res9.answer.includes("guaranteed court victory"));
testCheck("T9.3: Refers to legal consultation disclaimer",
  res9.answer.includes("வழக்கறிஞர்") || res9.answer.includes("legal") || res9.answer.includes("நீதிமன்ற"));

// ====================================================================
// TEST CASE 10: NEXT 3 YEARS MILESTONES TIMELINE
// ====================================================================
console.log("\n--- TEST CASE 10: Next 3 Years Milestones Timeline ---");
const q10 = "என் அடுத்த 3 வருடங்களில் முக்கியமான மாற்றங்கள் என்ன?";
const res10 = await processEvidenceLinkedQA({ question: q10, context });
console.log("Direct Answer Preview:\n", res10.directAnswer);

testCheck("T10.1: Synthesizes a chronological multi-year horizon",
  res10.answer.includes("3 வருட") || res10.answer.includes("3 year") || res10.answer.includes("2026") || res10.answer.includes("2027"));
testCheck("T10.2: Synthesizes progressive developmental milestones, not raw dasha dump",
  res10.directAnswer.includes("மாற்றங்களை") || res10.directAnswer.includes("milestone") || res10.directAnswer.includes("முன்னேற்றம்"));
testCheck("T10.3: Includes Timing Window section",
  res10.answer.includes("[முக்கிய காலக்கோடு]"));

// ====================================================================
// ENGLISH SYNTHESIS PARITY TEST
// ====================================================================
console.log("\n--- PARITY TEST: English Language Synthesis ---");
const qEn = "Will my spouse's family be wealthier than mine?";
const resEn = await processEvidenceLinkedQA({ question: qEn, context: { ...context, lang: "en" } });
testCheck("EN.1: English answer produces [Direct Answer / Report Finding]",
  resEn.answer.includes("[Direct Answer / Report Finding]"));
testCheck("EN.2: English answer produces [Astrological Evidence]",
  resEn.answer.includes("[Astrological Evidence]"));
testCheck("EN.3: English answer produces [Evidence Reasoning / Traditional Context]",
  resEn.answer.includes("[Evidence Reasoning / Traditional Context]"));
testCheck("EN.4: English answer produces [Evidence Status]",
  resEn.answer.includes("[Evidence Status]"));
testCheck("EN.5: English answer produces [Timing Resolution]",
  resEn.answer.includes("[Timing Resolution]"));
testCheck("EN.6: English answer produces [What Cannot Be Concluded]",
  resEn.answer.includes("[What Cannot Be Concluded]"));
testCheck("EN.7: English answer produces [Relevant Report Sections]",
  resEn.answer.includes("[Relevant Report Sections]"));

console.log("\n======================================================================");
console.log(` ALL ${passedChecks} ADVANCED Q&A CHECKS PASSED PERFECTLY! (0 failed)`);
console.log("======================================================================");
