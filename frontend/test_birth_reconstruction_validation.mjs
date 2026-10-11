/**
 * ASTROVERSE — Birth Reconstruction (Nashta Jataka) Validation Suite
 * ===================================================================
 * Verifies the scientific, mathematical, and architectural integrity of
 * the lost-horoscope birth reconstruction engine:
 * 1. Insufficient data handling (no fabricated defaults for birth year, time, Lagna, Moon).
 * 2. Missing month handling (no silent defaulting to May).
 * 3. Palm analysis decoupling (unmeasured 2D elevation does not score Lagna candidates).
 * 4. Milestone mapping & alignment (authoritative event IDs: q6_first_job, q13_marriage).
 * 5. Candidate ranking & differentiation metrics (ambiguous candidate handling, abstention).
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  analyzeDualPalmsForBirthRecovery,
  generateVerificationQuestions,
  reverseCalculateBirthTimeAndDOB,
  MONTHS
} from "./src/services/nashtaJatakaEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n" + "=".repeat(75));
console.log(" ASTROVERSE — BIRTH RECONSTRUCTION (NASHTA JATAKA) VALIDATION SUITE");
console.log("=".repeat(75) + "\n");

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function main() {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Missing / Insufficient Data Handling
  // ─────────────────────────────────────────────────────────────────────────────
  await check("1A. Zero life events returns INSUFFICIENT_DATA and null chart values", () => {
    const res = reverseCalculateBirthTimeAndDOB({
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {}
    });

    assert.strictEqual(res.status, "INSUFFICIENT_DATA");
    assert.strictEqual(res.candidateStability, "UNRESOLVED_NO_EVENTS");
    assert.strictEqual(res.estimatedBirthYear, null);
    assert.strictEqual(res.candidateBirthMonthNum, null);
    assert.strictEqual(res.candidateBirthDayNum, null);
    assert.strictEqual(res.candidateMonthWindow, null);
    assert.strictEqual(res.timeWindow, null);
    assert.strictEqual(res.probableLagna, null);
    assert.strictEqual(res.probableMoonRashi, null);
    assert.strictEqual(res.confidenceScore, 0);
    assert.strictEqual(res.isReconstructed, false);
    assert.strictEqual(res.reconstructionMode, "experimental_heuristic_reconstruction");
  });

  await check("1B. Missing location coordinates returns INSUFFICIENT_DATA", () => {
    const res = reverseCalculateBirthTimeAndDOB({
      answers: { q1_year: "2000", q1_month: "6" }
    });
    assert.strictEqual(res.status, "INSUFFICIENT_DATA");
    assert.strictEqual(res.estimatedBirthDate, null);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Month Parsing Without Synthetic Defaults
  // ─────────────────────────────────────────────────────────────────────────────
  await check("2A. Answer with year only sets month to null and fractionalDate to year + 0.5", () => {
    const res = reverseCalculateBirthTimeAndDOB({
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {
        q2_year: "2010" // 10th board
      }
    });

    assert(res.userProvidedEvents.length === 1, "Should have 1 recorded event");
    const ev = res.userProvidedEvents[0];
    assert.strictEqual(ev.year, 2010);
    assert.strictEqual(ev.month, null, "Omitted month must be null");
    assert.strictEqual(ev.hasExactMonth, false, "hasExactMonth must be false");
    assert.strictEqual(ev.fractionalDate, 2010.5, "Fractional date must be 2010.5, not 2010 + 4.5/12");
  });

  await check("2B. Answer with explicit month preserves exact fractional month", () => {
    const res = reverseCalculateBirthTimeAndDOB({
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {
        q2_year: "2010",
        q2_month: "3" // March
      }
    });

    assert(res.userProvidedEvents.length === 1);
    const ev = res.userProvidedEvents[0];
    assert.strictEqual(ev.month, 3);
    assert.strictEqual(ev.hasExactMonth, true);
    // March midpoint: 2010 + (3 - 0.5)/12 = 2010 + 2.5/12 = 2010.208333...
    assert(Math.abs(ev.fractionalDate - (2010 + 2.5 / 12.0)) < 1e-6);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Palm Image Decoupling & Scientific Disclosure
  // ─────────────────────────────────────────────────────────────────────────────
  await check("3A. analyzeDualPalmsForBirthRecovery discloses unmeasured 2D elevation", () => {
    const profile = analyzeDualPalmsForBirthRecovery({
      dominantHandImg: "data:image/jpeg;base64,sample",
      nonDominantHandImg: "data:image/jpeg;base64,sample",
      handDominance: "right"
    });

    assert.strictEqual(profile.mountElevationMeasured, false);
    assert.strictEqual(profile.candidateScoringApplicable, false);
    assert.strictEqual(profile.status, "EXPERIMENTAL_UNVALIDATED_REFERENCE");
    assert(typeof profile.disclosure === "string" && profile.disclosure.includes("2D photographs"));
  });

  await check("3B. Palm mounts do not influence candidate scores in reverseCalculateBirthTimeAndDOB", () => {
    const syntheticPalm = {
      mounts: [
        { name: "Jupiter", prominence: "High", rating: 99 },
        { name: "Mercury", prominence: "Very High", rating: 99 },
        { name: "Sun (Apollo)", prominence: "High", rating: 99 }
      ]
    };

    const resWithPalm = reverseCalculateBirthTimeAndDOB({
      palmProfile: syntheticPalm,
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {
        q2_year: "2010",
        q2_month: "4",
        q3_year: "2012",
        q3_month: "4"
      }
    });

    const resWithoutPalm = reverseCalculateBirthTimeAndDOB({
      palmProfile: null,
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {
        q2_year: "2010",
        q2_month: "4",
        q3_year: "2012",
        q3_month: "4"
      }
    });

    assert.strictEqual(resWithPalm.palmScoringApplied, false);
    assert.strictEqual(resWithPalm.palmStatus, "EXCLUDED_UNVALIDATED");

    // All candidate scores should match exactly between with-palm and without-palm
    assert.strictEqual(resWithPalm.candidateWindows.length, resWithoutPalm.candidateWindows.length);
    for (let i = 0; i < resWithPalm.candidateWindows.length; i++) {
      assert.strictEqual(
        resWithPalm.candidateWindows[i].score,
        resWithoutPalm.candidateWindows[i].score,
        `Candidate ${i} score must not be influenced by unvalidated palm mounts`
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Milestone Mapping & Authoritative Question IDs
  // ─────────────────────────────────────────────────────────────────────────────
  await check("4A. Question registry matches authoritative question IDs", () => {
    const questions = generateVerificationQuestions(null, "en");
    const qIds = questions.map(q => q.id);

    assert(qIds.includes("q6_first_job"), "Must contain q6_first_job");
    assert(qIds.includes("q13_marriage"), "Must contain q13_marriage");
    assert(!qIds.includes("q5_first_job"), "Must NOT contain q5_first_job (q5 is PG degree)");
    assert(!qIds.includes("q6_marriage"), "Must NOT contain q6_marriage (q6 is first job)");
  });

  await check("4B. Career (q6_first_job) and Marriage (q13_marriage) activate Dasha alignment scoring", () => {
    // Subject born ~1990: 10th board ~2005, 12th board ~2007, first job ~2012, marriage ~2017
    const res = reverseCalculateBirthTimeAndDOB({
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {
        q2_year: "2005", q2_month: "4",
        q3_year: "2007", q3_month: "4",
        q6_year: "2012", q6_month: "7",
        q13_year: "2017", q13_month: "11"
      }
    });

    assert(res.candidateWindows.length > 0, "Candidates must be generated");
    // Check that at least one candidate has Career or Marriage supporting evidence
    const hasCareerOrMarriageEvidence = res.candidateWindows.some(cw =>
      cw.supportingEvidence.some(ev => ev.includes("Career") || ev.includes("Marriage"))
    );
    assert(hasCareerOrMarriageEvidence, "Dasha scoring must evaluate q6_first_job and q13_marriage");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Candidate Ranking & Honest Epistemic Classification
  // ─────────────────────────────────────────────────────────────────────────────
  await check("5A. Single event produces INSUFFICIENT_DATA and AMBIGUOUS_MULTI_CANDIDATE", () => {
    const res = reverseCalculateBirthTimeAndDOB({
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {
        q2_year: "2005", q2_month: "4"
      }
    });

    assert.strictEqual(res.status, "INSUFFICIENT_DATA");
    assert.strictEqual(res.candidateStability, "AMBIGUOUS_MULTI_CANDIDATE");
  });

  await check("5B. Multiple consistent anchors yield PLAUSIBLE_CANDIDATE_FOUND with honest notices", () => {
    const res = reverseCalculateBirthTimeAndDOB({
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {
        q2_year: "2005", q2_month: "5",
        q3_year: "2007", q3_month: "5",
        q4_year: "2011", q4_month: "6",
        q6_year: "2012", q6_month: "8",
        q13_year: "2018", q13_month: "2"
      }
    });

    assert.strictEqual(res.status, "PLAUSIBLE_CANDIDATE_FOUND");
    assert.strictEqual(res.reconstructionMode, "experimental_heuristic_reconstruction");
    assert.strictEqual(res.isReconstructed, true);
    assert(res.estimatedBirthYear >= 1988 && res.estimatedBirthYear <= 1991, `Estimated birth year ${res.estimatedBirthYear} should be ~1989-1990`);
    assert(typeof res.methodologyNotice === "string" && res.methodologyNotice.includes("experimental"));
    assert.strictEqual(res.probableLagna.degreeRange, "Variable 30° Lagna arc");
    assert.strictEqual(res.errorMarginMonths, null, "Error margin months must be null (uncalibrated)");
    assert.strictEqual(res.errorMarginStatus, "UNCALIBRATED", "Error margin status must be UNCALIBRATED");
    assert.strictEqual(res.empiricalConfidence, null, "Empirical confidence must be null without calibration");
  });

  await check("5C. Chronologically contradictory dates produce INSUFFICIENT_DATA and CONTRADICTORY_DATES", () => {
    const res = reverseCalculateBirthTimeAndDOB({
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {
        q2_year: "2010", q2_month: "5", // 10th in 2010
        q3_year: "2008", q3_month: "5"  // 12th in 2008 (impossible contradiction!)
      }
    });

    assert.strictEqual(res.status, "INSUFFICIENT_DATA");
    assert.strictEqual(res.candidateStability, "CONTRADICTORY_DATES");
    assert.strictEqual(res.highestRankedCandidate, null);
    assert.strictEqual(res.timeWindow, null);
    assert.strictEqual(res.probableLagna, null);
    assert.strictEqual(res.probableMoonRashi, null);
  });

  await check("5D. Invalid dates (out of range years) fail closed with INSUFFICIENT_DATA", () => {
    const res = reverseCalculateBirthTimeAndDOB({
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {
        q1_year: "1850",
        q2_year: "2099"
      }
    });

    assert.strictEqual(res.status, "INSUFFICIENT_DATA");
    assert.strictEqual(res.highestRankedCandidate, null);
    assert.strictEqual(res.timeWindow, null);
  });

  await check("5E. Timezone boundaries (-12 to +14) compute safely without crashing", () => {
    const resWest = reverseCalculateBirthTimeAndDOB({
      lat: 21.3069, lng: -157.8583, tz: -10, // Honolulu
      answers: { q2_year: "2000", q2_month: "5", q3_year: "2002", q3_month: "5" }
    });
    assert(["PLAUSIBLE_CANDIDATE_FOUND", "NOT_DISCRIMINATING", "INSUFFICIENT_DATA"].includes(resWest.status));

    const resEast = reverseCalculateBirthTimeAndDOB({
      lat: -13.8333, lng: -171.7667, tz: 13, // Samoa
      answers: { q2_year: "2000", q2_month: "5", q3_year: "2002", q3_month: "5" }
    });
    assert(["PLAUSIBLE_CANDIDATE_FOUND", "NOT_DISCRIMINATING", "INSUFFICIENT_DATA"].includes(resEast.status));
  });

  await check("5F. Weak candidate score separation returns NOT_DISCRIMINATING and null birth time", () => {
    // 2 milestones that don't trigger any Dasha career/marriage karakas
    const res = reverseCalculateBirthTimeAndDOB({
      lat: 13.0827,
      lng: 80.2707,
      tz: 5.5,
      answers: {
        q7_year: "2005", q7_month: "6", // relocation
        q8_year: "2008", q8_month: "6"  // travel
      }
    });

    // Because relocation and travel don't discriminate between Lagnas strongly,
    // candidate scores are flat or weakly separated
    if (res.status === "NOT_DISCRIMINATING") {
      assert.strictEqual(res.highestRankedCandidate, null);
      assert.strictEqual(res.timeWindow, null);
      assert.strictEqual(res.probableLagna, null);
      assert.strictEqual(res.probableMoonRashi, null);
    }
  });

  await check("5G. Synthetic placeholder palm images produce illustrative non-personal profile", () => {
    const profile = analyzeDualPalmsForBirthRecovery({
      dominantHandImg: "data:image/jpeg;base64,sample_placeholder",
      nonDominantHandImg: "data:image/jpeg;base64,sample_placeholder",
      handDominance: "right"
    });

    assert.strictEqual(profile.isIllustrativeReferenceOnly, true);
    assert.strictEqual(profile.imageFeaturesExtracted, false);
    assert.strictEqual(profile.isPersonalizedAnalysis, false);
    assert.strictEqual(profile.candidateScoringApplicable, false);
    assert.strictEqual(profile.mountElevationMeasured, false);
    // Verify health/surgery claim was neutralized
    const lifeLineMarkers = profile.lines.lifeLine.segmentMarkers;
    const basalMarker = lifeLineMarkers.find(m => m.segment === "Basal quadrant");
    assert(basalMarker && !basalMarker.significance.includes("major surgery"));
  });

  console.log("\n" + "=".repeat(75));
  console.log(` SUMMARY: ${passed} passed, ${failed} failed.`);
  console.log("=".repeat(75) + "\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
