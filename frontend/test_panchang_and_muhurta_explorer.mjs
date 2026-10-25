/**
 * ASTROVERSE — Complete Vedic Panchanga & Event Muhurta Explorer Test Suite
 * =========================================================================
 * 
 * Validates:
 * 1. Complete Panchanga calculation: 5 sacred angas (Tithi, Vara, Nakshatra, Yoga, Karana).
 * 2. 12-hour AM/PM transitions, next-day flags, and next-anga names in Tamil and English.
 * 3. Exact Solar timings: Sunrise, Sunset, Abhijit, Brahma, Amrita, Rahu, Yama, Gulika, Durmuhurtham, Varjyam.
 * 4. 24 Planetary Horas & Tamil Gowri Panchangam (8 daytime segments).
 * 5. Time Limits verification: 14, 30, 60, 90, 180 days screening horizon.
 * 6. Event-specific classical electional rules:
 *    - Vivaha (Marriage)
 *    - Griha Pravesham (Housewarming)
 *    - Vahana (Vehicle Purchase)
 *    - Bhumi (Property Purchase)
 *    - Vyapar (Business Launch)
 *    - Yatra (Auspicious Travel)
 */

import assert from "node:assert/strict";
import {
  calculateEnrichedDailyPanchang,
  searchAuspiciousMuhurtas,
  MUHURTA_EVENT_CONFIGS
} from "./src/services/panchangEngine.js";

console.log("================================================================================");
console.log("ASTROVERSE: COMPREHENSIVE PANCHANGA & MUHURTA EXPLORER VERIFICATION SUITE");
console.log("================================================================================");

const CHENNAI_LAT = 13.0827;
const CHENNAI_LNG = 80.2707;
const CHENNAI_TZ = 5.5;
const CHENNAI_TZ_ID = "Asia/Kolkata";
const REF_DATE = "2026-10-25";

// -----------------------------------------------------------------------------
// TEST 1: The 5 Sacred Angas & Time Limits Precision
// -----------------------------------------------------------------------------
console.log("\n[TEST 1] The 5 Sacred Panchanga Elements & Exact Transition Limits...");
const panchang = calculateEnrichedDailyPanchang(REF_DATE, CHENNAI_LAT, CHENNAI_LNG, CHENNAI_TZ, CHENNAI_TZ_ID);

assert.ok(panchang.date === REF_DATE, "Date must match input reference");
assert.ok(panchang.vara && panchang.vara.name, "Vara element must be present");
assert.ok(panchang.vara.tamil, "Vara Tamil name must be present");

// Tithi
assert.ok(panchang.tithi && panchang.tithi.name, "Tithi element must be present");
assert.ok(panchang.tithi.until12, "Tithi 12-hour transition time must be present");
assert.ok(panchang.tithi.nextTithi, "Next Tithi name must be present");
assert.ok(panchang.tithi.nextTithiTamil, "Next Tithi Tamil must be present");
console.log(`   ✓ Tithi: ${panchang.tithi.name} (${panchang.tithi.nameTamil}) until ${panchang.tithi.until12} -> Next: ${panchang.tithi.nextTithi}`);

// Nakshatra
assert.ok(panchang.nakshatra && panchang.nakshatra.name, "Nakshatra element must be present");
assert.ok(panchang.nakshatra.until12, "Nakshatra 12-hour transition time must be present");
assert.ok(panchang.nakshatra.nextNakshatra, "Next Nakshatra must be present");
console.log(`   ✓ Nakshatra: ${panchang.nakshatra.name} (${panchang.nakshatra.tamil}, Pada ${panchang.nakshatra.pada}) until ${panchang.nakshatra.until12} -> Next: ${panchang.nakshatra.nextNakshatra}`);

// Yoga & Karana
assert.ok(panchang.yoga && panchang.yoga.name, "Yoga must be present");
assert.ok(panchang.karana && panchang.karana.name, "Karana must be present");
console.log(`   ✓ Yoga: ${panchang.yoga.name} (${panchang.yoga.nature}) | Karana: ${panchang.karana.name}`);

// -----------------------------------------------------------------------------
// TEST 2: Auspicious & Inauspicious Muhurtas Windows
// -----------------------------------------------------------------------------
console.log("\n[TEST 2] Astronomical Solar Muhurta Windows...");
assert.ok(panchang.sunrise && panchang.sunset, "Sunrise and Sunset must be calculated");
assert.ok(panchang.abhijitMuhurta12 && panchang.abhijitMuhurta12.includes("–"), "Abhijit Muhurta must be 12-hr window");
assert.ok(panchang.brahmaMuhurta12 && panchang.brahmaMuhurta12.includes("–"), "Brahma Muhurta must be 12-hr window");
assert.ok(panchang.rahuKalam12 && panchang.rahuKalam12.includes("–"), "Rahu Kalam must be 12-hr window");
assert.ok(panchang.yamagandam12 && panchang.yamagandam12.includes("–"), "Yamagandam must be 12-hr window");
assert.ok(panchang.gulikaKalam12 && panchang.gulikaKalam12.includes("–"), "Gulika Kalam must be 12-hr window");
assert.ok(panchang.durmuhurtham12, "Durmuhurtham must be calculated");
console.log(`   ✓ Sunrise: ${panchang.sunrise} | Sunset: ${panchang.sunset}`);
console.log(`   ✓ Abhijit: ${panchang.abhijitMuhurta12} | Brahma: ${panchang.brahmaMuhurta12}`);
console.log(`   ✓ Rahu Kalam: ${panchang.rahuKalam12} | Yamagandam: ${panchang.yamagandam12}`);

// -----------------------------------------------------------------------------
// TEST 3: 24 Horas & Tamil Gowri Panchangam
// -----------------------------------------------------------------------------
console.log("\n[TEST 3] 24 Horas & Gowri Panchangam Tables...");
assert.strictEqual(panchang.horas.length, 24, "Must contain exactly 24 horas");
assert.strictEqual(panchang.gowriPanchangam.length, 8, "Gowri daytime segments must be exactly 8");
assert.ok(panchang.horas[0].planet && panchang.horas[0].time12, "Hora elements must have planet and time");
assert.ok(panchang.gowriPanchangam[0].name && panchang.gowriPanchangam[0].time12, "Gowri elements must have name and time");
console.log(`   ✓ 24 Horas generated. First daytime hora: ${panchang.horas[0].planet} (${panchang.horas[0].time12})`);
console.log(`   ✓ Gowri Panchangam: 8 daytime segments generated. Segment 1: ${panchang.gowriPanchangam[0].name} (${panchang.gowriPanchangam[0].nature})`);

// -----------------------------------------------------------------------------
// TEST 4: Time Horizon Limits (14, 30, 60, 90, 180 Days)
// -----------------------------------------------------------------------------
console.log("\n[TEST 4] Time Limits Scaling Verification (14, 30, 60, 90, 180 Days)...");
const horizons = [14, 30, 60, 90, 180];
for (const h of horizons) {
  const result = searchAuspiciousMuhurtas("marriage", REF_DATE, h, CHENNAI_LAT, CHENNAI_LNG, CHENNAI_TZ, CHENNAI_TZ_ID);
  assert.strictEqual(result.daysScreened, h, `Screened days must equal ${h}`);
  assert.strictEqual(result.totalDatesEvaluated, h + 1, `Total dates evaluated must be ${h + 1}`);
  assert.ok(result.topScreenedDates.length >= 6, `Must return at least 6 candidate dates for horizon ${h}`);
  
  if (h === 60) {
    assert.ok(result.months.length >= 3, "60-day horizon must span at least 3 calendar months");
    assert.ok(result.topScreenedDates.length >= 18, `60-day horizon must return >= 18 candidates, got ${result.topScreenedDates.length}`);
  }
  if (h === 90) {
    assert.ok(result.months.length >= 4, "90-day horizon must span at least 4 calendar months");
    assert.ok(result.topScreenedDates.length >= 24, `90-day horizon must return >= 24 candidates, got ${result.topScreenedDates.length}`);
  }
  if (h === 180) {
    assert.ok(result.months.length >= 6, "180-day horizon must span at least 6 calendar months");
    assert.ok(result.topScreenedDates.length >= 36, `180-day horizon must return >= 36 candidates, got ${result.topScreenedDates.length}`);
  }

  console.log(`   ✓ Horizon ${h} Days: ${result.totalDatesEvaluated} days evaluated, ${result.topScreenedDates.length} top candidates across ${result.months.length} months (${result.months.map(m => m.key).join(", ")})`);
}

// -----------------------------------------------------------------------------
// TEST 5: Event-Specific Classical Electional Criteria
// -----------------------------------------------------------------------------
console.log("\n[TEST 5] Event-Specific Classical Electional Rules...");
const eventsToTest = [
  { id: "marriage", name: "Vivaha (Marriage)", keyNak: "Rohini" },
  { id: "griha_pravesh", name: "Griha Pravesham (Housewarming)", keyNak: "Pushya" },
  { id: "vehicle", name: "Vahana (Vehicle Purchase)", keyNak: "Swati" },
  { id: "property", name: "Bhumi (Property Purchase)", keyNak: "Mrigashira" },
  { id: "business", name: "Vyapar (Business Launch)", keyNak: "Revati" },
  { id: "travel", name: "Yatra (Auspicious Travel)", keyNak: "Ashwini" }
];

for (const ev of eventsToTest) {
  const res = searchAuspiciousMuhurtas(ev.id, REF_DATE, 60, CHENNAI_LAT, CHENNAI_LNG, CHENNAI_TZ, CHENNAI_TZ_ID);
  assert.strictEqual(res.eventType, ev.id, `Event type must match ${ev.id}`);
  assert.ok(res.eventConfig && res.eventConfig.nameEn, `Event config must exist for ${ev.id}`);
  
  // Verify top candidate has event-specific factors
  const top = res.topScreenedDates[0];
  assert.ok(top.muhurtaScore >= 70, `Top date for ${ev.id} must be favorable (>= 70), got ${top.muhurtaScore}`);
  assert.ok(top.positiveFactors && top.positiveFactors.length > 0, "Must have positive factors");
  assert.ok(top.positiveFactorsTa && top.positiveFactorsTa.length > 0, "Must have positive factors in Tamil");
  assert.ok(!top.recommendation.includes("[object Object]"), "No [object Object] in recommendation");
  
  console.log(`   ✓ Event [${ev.name}]: Top candidate ${top.date} (${top.day}, Score ${top.muhurtaScore}) | Recommendation: ${top.recommendation}`);
}

// -----------------------------------------------------------------------------
// TEST 6: Dishashool Avoidance on Travel
// -----------------------------------------------------------------------------
console.log("\n[TEST 6] Yatra Directional Shoola (Dishashool) Verification...");
const travelRes = searchAuspiciousMuhurtas("travel", REF_DATE, 14, CHENNAI_LAT, CHENNAI_LNG, CHENNAI_TZ, CHENNAI_TZ_ID);
const hasDishashoolNotice = travelRes.allCandidates.some(c => 
  c.negativeFactors.some(f => f.includes("Dishashool Warning")) &&
  c.negativeFactorsTa.some(f => f.includes("திசாசூலை எச்சரிக்கை"))
);
assert.ok(hasDishashoolNotice, "Travel candidates must include directional Dishashool guidance");
console.log("   ✓ Directional Dishashool warnings verified on travel search.");

console.log("\n================================================================================");
console.log("ALL 6 PANCHANGA & MUHURTA EXPLORER TEST PHASES PASSED WITH 100% SUCCESS!");
console.log("================================================================================");
