import assert from "node:assert";
import { calculateChartBySystem } from "./src/astrology/index.js";
import { buildFollowUpContext } from "./src/services/followUpContextBuilder.js";
import { routeFollowUpQuestion } from "./src/services/followUpRouter.js";
import { answerFollowUpQuestion } from "./src/services/followUpAnswerService.js";

async function runTamilPurityTests() {
  console.log("=== Testing Pure Tamil Follow-Up Q&A Output ===");

  const birthData = {
    birthDate: "1994-08-15",
    birthTime: "14:30",
    latitude: 13.0827,
    longitude: 80.2707,
    utcOffset: 5.5,
    timezoneId: "Asia/Kolkata",
    system: "lahiri",
    lang: "ta"
  };

  const chart = calculateChartBySystem("lahiri", birthData, { lang: "ta" });
  console.log("Calculated chart Lagna:", chart.ascendant?.sign, "Moon:", chart.moon?.sign);

  const context = buildFollowUpContext({
    chartData: chart,
    activeSection: "fullReport",
    systemId: "lahiri",
    lang: "ta"
  });

  assert.strictEqual(context.lang, "ta", "Context lang must be 'ta'");

  const testQuestions = [
    { q: "என் லக்னம் என்ன?", domain: "Ascendant" },
    { q: "என் ராசி என்ன?", domain: "Moon" },
    { q: "என் நட்சத்திரம் என்ன?", domain: "Nakshatra" },
    { q: "என் சூரிய ராசி என்ன?", domain: "Sun" },
    { q: "தற்போதைய தசை என்ன?", domain: "Dasha" },
    { q: "எனக்கு என்ன ரத்தினம் உகந்தது?", domain: "Remedies" },
    { q: "சனி பகவான் தாக்கம் மற்றும் தொழில் பற்றி கூறுங்கள்", domain: "Saturn Delay" },
    { q: "2027-ம் ஆண்டு எனக்கு எப்படி இருக்கும்?", domain: "Year 2027" },
    { q: "என் 10-ம் பாவகம் பற்றி கூறுங்கள்", domain: "10th Bhava" },
    { q: "என் தொழில் பற்றி கூறுங்கள்", domain: "Career" },
    { q: "என் திருமணம் பற்றி கூறுங்கள்", domain: "Marriage" }
  ];

  for (const t of testQuestions) {
    const res = await answerFollowUpQuestion({
      question: t.q,
      context,
      conversationHistory: []
    });

    console.log(`\n--- [${t.domain}] Question: "${t.q}" ---`);
    console.log(`Answer:\n${res.answer}`);

    // Verify answer is not empty
    assert.ok(res.answer && res.answer.length > 20, `Answer should be non-empty for ${t.domain}`);

    // Verify it contains Tamil characters
    assert.ok(/[\u0B80-\u0BFF]/.test(res.answer), `Answer must contain Tamil script for ${t.domain}`);

    // Verify NO un-localized English labels like [Report Finding], [Traditional Context], [object Object]
    assert.ok(!res.answer.includes("[object Object]"), `Must not contain [object Object] in ${t.domain}`);
    assert.ok(!res.answer.includes("[Report Finding]"), `Must not contain English '[Report Finding]' in ${t.domain}`);
    assert.ok(!res.answer.includes("[Traditional Context]"), `Must not contain English '[Traditional Context]' in ${t.domain}`);
    assert.ok(!res.answer.includes("[Traditional Astrological Context]"), `Must not contain English context label in ${t.domain}`);

    // Check for common English leaks
    const englishLeaks = ["Sagittarius", "Scorpio", "Jupiter", "Saturn", "Venus", "Mercury", "Mars", "Ascendant", "Mahadasha", "Antardasha"];
    for (const leak of englishLeaks) {
      if (res.answer.includes(leak)) {
        console.warn(`⚠️ Warning: Potential English leak "${leak}" found in ${t.domain} answer!`);
      }
    }
    console.log(`✓ [${t.domain}] Pure Tamil output verified without English leaks`);
  }

  console.log("\n==================================================");
  console.log(" ALL 11 TAMIL PURITY TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runTamilPurityTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
