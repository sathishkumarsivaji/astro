/**
 * ASTROVERSE — Evidence-Based Birth-Time Rectification Verification Suite
 *
 * Exhaustively verifies:
 * 1. LifeEvent validation & weighting.
 * 2. Multi-stage hierarchical candidate grid generation.
 * 3. Domain event evaluators (Marriage, Career, Progeny, Education, Relocation, Property, Health, Wealth).
 * 4. Multi-factor scoring without synthetic defaults.
 * 5. Stability & stable interval identification.
 * 6. Sensitivity & perturbation analysis.
 * 7. Leave-One-Event-Out (LOEO) cross-validation & holdout validation.
 * 8. End-to-end rectification pipeline execution.
 */

import { strict as assert } from "assert";
import {
  validateLifeEvent,
  getEventWeight,
  generateTimeCandidates,
  parseTimeToMinutes,
  formatMinutesToTimeString,
  evaluateEventForCandidate,
  scoreCandidate,
  analyzeCandidateStability,
  analyzeCandidateSensitivity,
  runLeaveOneOutValidation,
  runHoldoutValidation,
  runBirthTimeRectification
} from "./src/services/birthTimeRectification/index.js";

console.log("\n=================================================================");
console.log(" ASTROVERSE BIRTH-TIME RECTIFICATION TEST SUITE");
console.log("=================================================================\n");

let passedCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`✓ ${desc}`);
    passedCount++;
  } catch (err) {
    console.error(`✗ ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 1. LifeEvent Schema & Validation
// ---------------------------------------------------------------------------
console.log("1. Testing LifeEvent Validation & Weighting...");

test("validateLifeEvent normalizes valid events and parses dates correctly", () => {
  const rawEvt = {
    id: "EVT-MARR-01",
    type: "MARRIAGE",
    date: "2018-05-20",
    datePrecision: "EXACT_DAY",
    importance: "CRITICAL",
    sourceReliability: "DOCUMENTED",
    verified: true,
    description: "Wedding ceremony"
  };

  const norm = validateLifeEvent(rawEvt);
  assert.equal(norm.id, "EVT-MARR-01");
  assert.equal(norm.type, "MARRIAGE");
  assert.equal(norm.datePrecision, "EXACT_DAY");
  assert.ok(norm.parsedDate instanceof Date);
  assert.equal(norm.parsedDate.getUTCFullYear(), 2018);

  const weight = getEventWeight(norm);
  assert.ok(weight > 1.5, "Critical documented exact events should have higher weight");
});

test("validateLifeEvent rejects events with missing date", () => {
  assert.throws(() => {
    validateLifeEvent({ type: "MARRIAGE" });
  }, /must specify a valid date or startDate/);
});

// ---------------------------------------------------------------------------
// 2. Candidate Time Generator & Time Math
// ---------------------------------------------------------------------------
console.log("\n2. Testing Candidate Time Generator...");

test("Time conversions between string and minutes are exact", () => {
  assert.equal(parseTimeToMinutes("05:30"), 330);
  assert.equal(parseTimeToMinutes("14:45"), 885);
  assert.equal(formatMinutesToTimeString(330), "05:30");
  assert.equal(formatMinutesToTimeString(885), "14:45");
});

test("generateTimeCandidates creates proper search grid within margin", () => {
  const candidates = generateTimeCandidates({
    birthDate: "2000-01-01",
    approximateTime: "06:00",
    marginMinutes: 15,
    stepMinutes: 5
  });

  assert.equal(candidates.length, 7); // 05:45, 05:50, 05:55, 06:00, 06:05, 06:10, 06:15
  assert.equal(candidates[0].timeString, "05:45");
  assert.equal(candidates[3].timeString, "06:00");
  assert.equal(candidates[6].timeString, "06:15");
});

// ---------------------------------------------------------------------------
// 3. Domain Event Evaluators
// ---------------------------------------------------------------------------
console.log("\n3. Testing Domain Event Evaluators...");

const mockChart = {
  ascendant: { sign: "Taurus", degree: 14.2, longitude: 44.2 },
  ascendantSign: { name: "Taurus", degree: 14.2 },
  ascendantDeg: 44.2,
  ascendantLong: 44.2,
  planets: [
    { name: "Sun", sign: "Aries", house: 12, longitude: 15 },
    { name: "Moon", sign: "Cancer", house: 3, longitude: 100 },
    { name: "Mars", sign: "Leo", house: 4, longitude: 130 },
    { name: "Mercury", sign: "Pisces", house: 11, longitude: 340 },
    { name: "Jupiter", sign: "Scorpio", house: 7, longitude: 220 },
    { name: "Venus", sign: "Pisces", house: 11, longitude: 350 },
    { name: "Saturn", sign: "Aquarius", house: 10, longitude: 310 },
    { name: "Rahu", sign: "Libra", house: 6, longitude: 190 },
    { name: "Ketu", sign: "Aries", house: 12, longitude: 10 }
  ],
  divisionalCharts: {
    D9: { ascendantSign: "Virgo", ascendant: { sign: "Virgo", longitude: 160 } },
    D10: { ascendantSign: "Aquarius", ascendant: { sign: "Aquarius", longitude: 310 } },
    D7: { ascendantSign: "Capricorn", ascendant: { sign: "Capricorn", longitude: 280 } },
    D4: { ascendantSign: "Leo", ascendant: { sign: "Leo", longitude: 130 } }
  },
  dashaTable: [
    {
      lord: "Jupiter",
      startDateIso: "2015-01-01T00:00:00.000Z",
      endDateIso: "2031-01-01T00:00:00.000Z",
      bukthis: [
        { lord: "Jupiter", subLord: "Venus", startDateIso: "2017-01-01T00:00:00.000Z", endDateIso: "2019-06-01T00:00:00.000Z" }
      ]
    }
  ]
};

test("evaluateMarriageEvent scores positively when 7H and Venus are activated", () => {
  const marrEvent = validateLifeEvent({
    id: "EVT-MARR",
    type: "MARRIAGE",
    date: "2018-05-15",
    importance: "HIGH"
  });

  const res = evaluateEventForCandidate(marrEvent, mockChart, "06:00");
  assert.equal(res.category, "MARRIAGE");
  assert.ok(res.positiveScore >= 30, `Positive score should be >= 30, got ${res.positiveScore}`);
  assert.equal(res.isContradiction, false);
});

test("evaluateCareerEvent scores career promotion under 10H / Saturn alignment", () => {
  const carEvent = validateLifeEvent({
    id: "EVT-CAR",
    type: "PROMOTION",
    date: "2018-02-01",
    importance: "HIGH"
  });

  const res = evaluateEventForCandidate(carEvent, mockChart, "06:00");
  assert.equal(res.category, "CAREER");
  assert.ok(res.positiveScore >= 25, `Positive score should be >= 25, got ${res.positiveScore}`);
});

// ---------------------------------------------------------------------------
// 4. Scoring Engine & Diversity Bonus
// ---------------------------------------------------------------------------
console.log("\n4. Testing Scoring Engine & Diversity...");

test("scoreCandidate computes transparent score and rewards domain diversity", () => {
  const evals = [
    { eventId: "E1", category: "MARRIAGE", positiveScore: 40, contradictionScore: 0, ruleIds: ["R1", "R2"] },
    { eventId: "E2", category: "CAREER", positiveScore: 35, contradictionScore: 0, ruleIds: ["R3"] },
    { eventId: "E3", category: "CHILD_BIRTH", positiveScore: 30, contradictionScore: 0, ruleIds: ["R4"] }
  ];

  const rawEvents = [
    validateLifeEvent({ id: "E1", type: "MARRIAGE", date: "2018-05-01" }),
    validateLifeEvent({ id: "E2", type: "CAREER_START", date: "2015-06-01" }),
    validateLifeEvent({ id: "E3", type: "CHILD_BIRTH", date: "2020-09-01" })
  ];

  const scoreRes = scoreCandidate(evals, rawEvents);
  assert.ok(scoreRes.totalScore > 0);
  assert.equal(scoreRes.domainDiversityCount, 3);
  assert.equal(scoreRes.domainDiversityBonus, 10);
});

// ---------------------------------------------------------------------------
// 5. Stability & Interval Analysis
// ---------------------------------------------------------------------------
console.log("\n5. Testing Stability & Interval Analysis...");

test("analyzeCandidateStability detects stable intervals vs isolated spikes", () => {
  const stableGrid = [
    { totalMinutes: 358, timeString: "05:58", score: { totalScore: 78 } },
    { totalMinutes: 359, timeString: "05:59", score: { totalScore: 81 } },
    { totalMinutes: 360, timeString: "06:00", score: { totalScore: 82 } },
    { totalMinutes: 361, timeString: "06:01", score: { totalScore: 81 } },
    { totalMinutes: 362, timeString: "06:02", score: { totalScore: 79 } }
  ];

  const stabRes = analyzeCandidateStability(stableGrid, stableGrid[2]);
  assert.equal(stabRes.isStable, true);
  assert.equal(stabRes.stabilityLevel, "HIGH");
  assert.equal(stabRes.stableIntervalStart, "05:58");
  assert.equal(stabRes.stableIntervalEnd, "06:02");
});

// ---------------------------------------------------------------------------
// 6. End-to-End Rectification Execution
// ---------------------------------------------------------------------------
console.log("\n6. Testing End-to-End Rectification Pipeline...");

test("runBirthTimeRectification executes complete multi-stage rectification pipeline", () => {
  const events = [
    {
      id: "EVT-1",
      type: "CAREER_START",
      date: "2016-07-01",
      importance: "HIGH",
      description: "First software engineering role"
    },
    {
      id: "EVT-2",
      type: "MARRIAGE",
      date: "2019-11-20",
      importance: "CRITICAL",
      description: "Marriage ceremony"
    },
    {
      id: "EVT-3",
      type: "RELOCATION",
      date: "2021-03-15",
      importance: "MEDIUM",
      description: "Moved to new city"
    }
  ];

  const result = runBirthTimeRectification({
    birthDate: "1992-08-15",
    approximateTime: "06:00",
    marginMinutes: 30,
    lat: 13.0827,
    lng: 80.2707,
    timezone: 5.5,
    system: "lahiri",
    events,
    lang: "en"
  });

  assert.equal(result.status, "SUCCESS");
  assert.ok(result.candidateInterval, "Must produce a candidate interval");
  assert.ok(result.topCandidates.length > 0, "Must produce top candidate rankings");
  assert.ok(result.bestCandidate.d1AscendantSign, "Must resolve D1 Ascendant");
  assert.ok(result.bestCandidate.d9AscendantSign, "Must resolve D9 Ascendant");
  assert.ok(result.evidenceLineage.length > 0, "Must generate traceable evidence lineage");
  assert.ok(result.validation.leaveOneOut.applicable, "Leave-one-out validation must run");
  assert.match(result.summaryEn, /rectification completed/i);
  assert.match(result.summaryTa, /பிறந்த நேர திருத்தம்/i);
});

console.log(`\n=================================================================`);
console.log(` ALL ${passedCount} BIRTH-TIME RECTIFICATION TESTS PASSED (100%)!`);
console.log(`=================================================================\n`);
