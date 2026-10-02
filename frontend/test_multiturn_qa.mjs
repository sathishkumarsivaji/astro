import { calculateChartBySystem } from './src/astrology/index.js';
import { buildFollowUpContext } from './src/services/followUpContextBuilder.js';
import { routeFollowUpQuestion } from './src/services/followUpRouter.js';
import { answerFollowUpQuestion } from './src/services/followUpAnswerService.js';

console.log("=== Testing Multi-Turn Follow-Up Q&A Dynamism & Accuracy ===");

const birthData = {
  birthDate: "1994-08-15",
  birthTime: "14:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5,
  timezoneId: "Asia/Kolkata",
  system: "lahiri"
};

const chartEn = calculateChartBySystem("lahiri", { ...birthData, lang: "en" }, { lang: "en" });
const chartTa = calculateChartBySystem("lahiri", { ...birthData, lang: "ta" }, { lang: "ta" });

const contextEn = buildFollowUpContext({
  chartData: chartEn,
  activeSection: "fullReport",
  systemId: "lahiri",
  lang: "en"
});

const contextTa = buildFollowUpContext({
  chartData: chartTa,
  activeSection: "fullReport",
  systemId: "lahiri",
  lang: "ta"
});

async function runMultiTurnTest(lang, context) {
  console.log(`\n--- Running Multi-Turn Test in [${lang.toUpperCase()}] ---`);
  
  const history = [];
  const queries = lang === "ta" ? [
    "என் தசாம்சம் (D10) மற்றும் தசா காலக்கோடு அடிப்படையில் அடுத்த தொழில் வாய்ப்பு எப்போது?", // Turn 1: Career
    "நான் அணிய வேண்டிய முதன்மை ரத்தினம் எது மற்றும் தவிர்க்க வேண்டியவை எவை?", // Turn 2: Remedies / Gemstone
    "என் ஜாதகத்தில் முக்கிய திருமண காலக்கட்டங்கள் எவை மற்றும் நவாம்சம் (D9) என்ன கூறுகிறது?", // Turn 3: Marriage / D9
    "என் உடல் ஆரோக்கியம் மற்றும் ஆயுர்வேத பிரகிருதி அமைப்பு எப்படி உள்ளது?", // Turn 4: Health / Wellness
    "சனி பகவான் என் 10-ம் பாவகம் அல்லது தொழிலில் ஏன் செல்வாக்கு செலுத்துகிறார்?", // Turn 5: Saturn Delay
    "2027?" // Turn 6: Short follow-up year
  ] : [
    "When is my next major career opportunity according to my D10 and active Dasha?", // Turn 1: Career
    "What gemstone should I wear and which ones are contraindicated?", // Turn 2: Remedies / Gemstone
    "What are the prime marriage timing windows in my chart and what does D9 show?", // Turn 3: Marriage / D9
    "How is my physical health and constitution in this chart?", // Turn 4: Health / Wellness
    "Why is Saturn exerting influence on my 10th house or career timing?", // Turn 5: Saturn Delay
    "2027?" // Turn 6: Short follow-up year
  ];

  const answers = [];

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const route = routeFollowUpQuestion(q, context, history);
    const res = await answerFollowUpQuestion({
      question: q,
      context,
      conversationHistory: history
    });

    console.log(`\nTurn ${i + 1}: Q: "${q}"`);
    console.log(`  Route Sections: ${JSON.stringify(route.relevantSections)}`);
    console.log(`  Resolved Domain: ${route.resolvedDomain || "none"}, isFollowUp: ${route.isFollowUp}`);
    console.log(`  Answer Preview: ${res.answer.slice(0, 120)}...`);

    // Add to history
    history.push({
      role: "user",
      question: q,
      content: q,
      answer: res.answer
    });
    answers.push(res.answer);
  }

  // Verification 1: Distinctness (Turn 1 != Turn 2 != Turn 3 != Turn 4 != Turn 5)
  for (let i = 0; i < answers.length; i++) {
    for (let j = i + 1; j < answers.length; j++) {
      if (answers[i] === answers[j]) {
        throw new Error(`FAIL: Turn ${i + 1} and Turn ${j + 1} produced IDENTICAL answers!`);
      }
    }
  }
  console.log("✓ All turns produced UNIQUE answers!");

  // Verification 2: Topic matching
  // Turn 1 (Career) must mention career keywords
  if (lang === "ta") {
    if (!answers[0].includes("தொழில்") && !answers[0].includes("தசாம்சம்")) throw new Error("Turn 1 failed career keyword check");
    if (!answers[1].includes("ரத்தினம்") && !answers[1].includes("பவளம்")) throw new Error("Turn 2 failed gemstone keyword check");
    if (!answers[2].includes("திருமண") && !answers[2].includes("நவாம்சம்")) throw new Error("Turn 3 failed marriage keyword check");
    if (!answers[3].includes("ஆரோக்கியம்") && !answers[3].includes("உடல்நல")) throw new Error("Turn 4 failed health keyword check");
    if (!answers[4].includes("சனி")) throw new Error("Turn 5 failed Saturn keyword check");
    if (!answers[5].includes("2027")) throw new Error("Turn 6 failed 2027 year keyword check");
  } else {
    if (!answers[0].toLowerCase().includes("career") && !answers[0].toLowerCase().includes("d10")) throw new Error("Turn 1 failed career keyword check");
    if (!answers[1].toLowerCase().includes("gemstone") && !answers[1].toLowerCase().includes("coral")) throw new Error("Turn 2 failed gemstone keyword check");
    if (!answers[2].toLowerCase().includes("marriage") && !answers[2].toLowerCase().includes("navamsha")) throw new Error("Turn 3 failed marriage keyword check");
    if (!answers[3].toLowerCase().includes("vitality") && !answers[3].toLowerCase().includes("health")) throw new Error("Turn 4 failed health keyword check");
    if (!answers[4].toLowerCase().includes("saturn")) throw new Error("Turn 5 failed Saturn keyword check");
    if (!answers[5].toLowerCase().includes("2027")) throw new Error("Turn 6 failed 2027 year keyword check");
  }
  console.log(`✓ [${lang.toUpperCase()}] All 6 conversation turns matched their exact domain topics without repetition!`);
}

async function main() {
  await runMultiTurnTest("en", contextEn);
  await runMultiTurnTest("ta", contextTa);
  console.log("\n==================================================");
  console.log(" ALL 14 MULTI-TURN QA CHECKS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

main().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
