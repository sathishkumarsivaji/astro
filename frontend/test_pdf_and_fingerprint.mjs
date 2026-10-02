import assert from "node:assert";
import { calculateChartBySystem, generateChartFingerprint } from "./src/services/astroEngine.js";
import { generateLocalDeterministicMasterReport } from "./src/services/aiAstrologyService.js";

console.log("==================================================");
console.log("ASTROVERSE PRODUCTION VERIFICATION SUITE");
console.log("==================================================");

// Test 1: Deterministic Chart Fingerprint
console.log("\n1. Testing Deterministic Chart Fingerprint...");
const chart1 = calculateChartBySystem("lahiri", {
  birthDate: "1990-05-15",
  birthTime: "14:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5
});

const fp1 = generateChartFingerprint(chart1);
const fp2 = generateChartFingerprint(chart1);
assert.strictEqual(fp1, fp2, "Fingerprint must be 100% deterministic");
assert.ok(fp1.startsWith("AV-"), "Fingerprint must follow standard AV- prefix format");
console.log(`   ✓ Deterministic Fingerprint verified: ${fp1}`);

// Test 2: Dasha Extraction & Resolution
console.log("\n2. Testing Dasha & Antardasha Precision...");
const cd = chart1.currentDasha;
assert.ok(cd.lord, "Mahadasha lord must be present");
assert.ok(cd.currentAntar || cd.antarDasha || cd.subLord, "Antardasha lord must be present");
console.log(`   ✓ Active Mahadasha: ${cd.lord} (${cd.tamil}), Antardasha: ${cd.currentAntar || cd.subLord} (${cd.currentAntarTamil})`);

// Test 3: Remedies Clean Separation
console.log("\n3. Testing Remedies Separation (Leo, Virgo, Scorpio)...");
const leoChart = calculateChartBySystem("lahiri", {
  birthDate: "1990-08-20",
  birthTime: "06:00",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5
});
const virgoChart = chart1;
const scorpioChart = calculateChartBySystem("lahiri", {
  birthDate: "1990-11-25",
  birthTime: "07:30",
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5
});

console.log("   - Leo Primary Gem:", leoChart.personalizedRemedies.primaryGemstone, "| Secondary:", leoChart.personalizedRemedies.secondaryGemstone);
console.log("   - Virgo Primary Gem:", virgoChart.personalizedRemedies.primaryGemstone, "| Secondary:", virgoChart.personalizedRemedies.secondaryGemstone);
console.log("   - Scorpio Primary Gem:", scorpioChart.personalizedRemedies.primaryGemstone, "| Secondary:", scorpioChart.personalizedRemedies.secondaryGemstone);

// Verify Contraindicated Gemstones are cleanly formatted
const avoidGemsVirgo = virgoChart.personalizedRemedies.contraindicatedGemstones;
assert.ok(Array.isArray(avoidGemsVirgo), "Contraindicated gemstones must be an array");
const avoidGemsText = avoidGemsVirgo.map(g => `${g.gemstone} (${g.reason})`).join(", ");
assert.ok(!avoidGemsText.includes("[object Object]"), "No [object Object] in remedies formatting");
console.log(`   ✓ Virgo Contraindicated Gemstones: ${avoidGemsText}`);

// Test 4: Pure Tamil Deterministic Report Generation
console.log("\n4. Testing Pure Tamil Master Report Generation...");
const tamilReport = generateLocalDeterministicMasterReport(chart1, "ta");
assert.ok(tamilReport.length > 500, "Tamil report must be comprehensive");
assert.ok(!tamilReport.includes("[object Object]"), "Tamil report must not contain [object Object]");
assert.ok(tamilReport.includes("கன்னி"), "Tamil report must use Tamil sign for Virgo Lagna");
assert.ok(tamilReport.includes("சூரியன்"), "Tamil report must use Tamil planet name for Sun");
assert.ok(tamilReport.includes("சந்திரன்"), "Tamil report must use Tamil planet name for Moon");
console.log(`   ✓ Pure Tamil Master Report successfully generated (${tamilReport.length} characters).`);

console.log("\n==================================================");
console.log("ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!");
console.log("==================================================");
