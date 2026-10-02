import assert from "node:assert/strict";
import { runBirthTimeRectification } from "./src/services/birthTimeRectification/rectificationService.js";
import { parseTimeToMinutes } from "./src/services/birthTimeRectification/engine/candidateGenerator.js";
import { getCachedOrComputeChart } from "./src/services/birthTimeRectification/engine/chartEvaluator.js";

console.log("=== Test: Ground Truth Positive Control & Noise Rejection ===");

// 1. Compute True Ground Truth Chart at T = 06:14:00
const trueBirthDate = "1992-08-15";
const trueBirthTime = "06:14";
const lat = 13.0827;
const lng = 80.2707;
const tz = 5.5;
const timezoneId = "Asia/Kolkata";

const trueChart = getCachedOrComputeChart({
  birthDate: trueBirthDate,
  timeString: trueBirthTime,
  lat,
  lng,
  tz,
  system: "lahiri"
});

assert.ok(trueChart, "True ground truth chart must calculate successfully");
const trueMinutes = parseTimeToMinutes(trueBirthTime);

// 2. Synthesize Ground-Truth Tailored Life Events from Chart Dasha & Historical Transits (Explicit Synthetic Positive Control)
const groundTruthEvents = [
  {
    id: "EVT-GT-CAREER",
    type: "CAREER_START",
    date: "2016-07-01",
    importance: "HIGH",
    sourceReliability: "SYNTHETIC_GROUND_TRUTH",
    provenance: "SYNTHETIC_POSITIVE_CONTROL",
    isSynthetic: true,
    verified: true,
    description: "Principal engineering milestone aligned with 10H Saturn & Sun Dasha (Synthetic Control)"
  },
  {
    id: "EVT-GT-MARRIAGE",
    type: "MARRIAGE",
    date: "2019-11-20",
    importance: "CRITICAL",
    sourceReliability: "SYNTHETIC_GROUND_TRUTH",
    provenance: "SYNTHETIC_POSITIVE_CONTROL",
    isSynthetic: true,
    verified: true,
    description: "Traditional marriage ceremony aligned with Jupiter double transit (Synthetic Control)"
  },
  {
    id: "EVT-GT-CHILD",
    type: "CHILD_BIRTH",
    date: "2021-08-14",
    importance: "HIGH",
    sourceReliability: "SYNTHETIC_GROUND_TRUTH",
    provenance: "SYNTHETIC_POSITIVE_CONTROL",
    isSynthetic: true,
    verified: true,
    description: "First progeny milestone aligned with 5H / Jupiter transit (Synthetic Control)"
  },
  {
    id: "EVT-GT-RELOCATION",
    type: "RELOCATION",
    date: "2023-03-10",
    importance: "MEDIUM",
    sourceReliability: "SYNTHETIC_GROUND_TRUTH",
    provenance: "SYNTHETIC_POSITIVE_CONTROL",
    isSynthetic: true,
    verified: true,
    description: "Metropolitan relocation aligned with 4H/9H activation (Synthetic Control)"
  }
];

// Test 1: Ground Truth Window Recovery Test (06:10 +/- 15 mins -> [05:55, 06:25])
const resultCovering = runBirthTimeRectification({
  birthDate: trueBirthDate,
  approximateTime: "06:10",
  marginMinutes: 15,
  lat,
  lng,
  timezoneId,
  utcOffset: tz,
  events: groundTruthEvents
});

assert.equal(resultCovering.status, "SUCCESS");
assert.ok(resultCovering.allScoredCandidatesCount > 0, "Candidates must be evaluated");

// Verify candidate interval start, end, and elapsedMinutes are mathematically consistent
assert.ok(typeof resultCovering.candidateInterval.elapsedMinutes === "number", "elapsedMinutes must be a number");
if (resultCovering.candidateInterval.start && resultCovering.candidateInterval.end) {
  const sM = parseTimeToMinutes(resultCovering.candidateInterval.start);
  const eM = parseTimeToMinutes(resultCovering.candidateInterval.end);
  assert.equal(resultCovering.candidateInterval.elapsedMinutes, Number(Math.abs(eM - sM).toFixed(2)), "Interval start/end/elapsed must be exactly consistent");
}

// Check that the top candidate ranking sets cover within +/- 3 mins of the ground truth time
const topCandidateMinutes = resultCovering.topCandidates.map(c => c.totalMinutes);
const minDistanceToTrueTime = Math.min(...topCandidateMinutes.map(m => Math.abs(m - trueMinutes)));
assert.ok(minDistanceToTrueTime <= 3.0, `Top candidates must contain candidates within 3 mins of true birth time (got ${minDistanceToTrueTime.toFixed(1)} mins)`);
console.log(`✓ Known ground truth time ${trueBirthTime} candidate proximity verified within ${minDistanceToTrueTime.toFixed(1)} mins.`);

// Test 2: Mismatched Window Rejection (03:00 +/- 10 mins -> [02:50, 03:10])
const resultMismatched = runBirthTimeRectification({
  birthDate: trueBirthDate,
  approximateTime: "03:00",
  marginMinutes: 10,
  lat,
  lng,
  timezoneId,
  utcOffset: tz,
  events: groundTruthEvents
});

assert.equal(resultMismatched.status, "SUCCESS");
assert.equal(resultMismatched.minuteLevelResolutionEstablished, false, "Mismatched window must not establish minute-level resolution");
assert.equal(resultMismatched.centralEstimate, null, "Mismatched window centralEstimate must be null");
console.log("✓ Mismatched window correctly rejected from claiming false precision.");

// Test 3: 100 Seeded Random Event Trials (Noise Rejection Rate >= 95%)
console.log("Running 100 seeded random event trials for noise rejection...");
let noiseRejectionCount = 0;
const totalTrials = 100;

for (let trial = 0; trial < totalTrials; trial++) {
  // Generate random non-astrological events with shifted random years/types
  const seedYear1 = 2000 + (trial % 20);
  const seedYear2 = 2005 + ((trial * 7) % 18);
  const trialEvents = [
    { id: `NOISE_${trial}_1`, type: "OTHER", date: `${seedYear1}-04-12`, importance: "MEDIUM" },
    { id: `NOISE_${trial}_2`, type: "RELOCATION", date: `${seedYear2}-09-21`, importance: "LOW" }
  ];

  const trialRes = runBirthTimeRectification({
    birthDate: trueBirthDate,
    approximateTime: "06:14",
    marginMinutes: 10,
    lat,
    lng,
    timezoneId,
    utcOffset: tz,
    events: trialEvents
  });

  // Random noise must NOT claim established minute-level resolution
  if (!trialRes.minuteLevelResolutionEstablished && trialRes.centralEstimate === null) {
    noiseRejectionCount++;
  }
}

const rejectionRate = (noiseRejectionCount / totalTrials) * 100;
console.log(`Noise rejection rate: ${rejectionRate}% (${noiseRejectionCount}/${totalTrials})`);
assert.ok(rejectionRate >= 95.0, `Noise rejection rate must be >= 95% (got ${rejectionRate}%)`);
console.log("✓ 100-trial random noise rejection verified at >= 95% threshold.");

console.log("✓ All ground truth recovery & noise rejection tests passed successfully!");
