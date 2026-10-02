import assert from "node:assert/strict";
import { runHoldoutValidation } from "./src/services/birthTimeRectification/engine/validationEngine.js";

console.log("=== P0 Test: Holdout Split Validation (70/30) ===");

const events = [
  { id: "E1", type: "CAREER_START", parsedDate: new Date("2016-07-01") },
  { id: "E2", type: "MARRIAGE", parsedDate: new Date("2019-11-20") },
  { id: "E3", type: "RELOCATION", parsedDate: new Date("2021-03-15") },
  { id: "E4", type: "CHILD_BIRTH", parsedDate: new Date("2022-01-10") },
  { id: "E5", type: "PROMOTION", parsedDate: new Date("2023-06-01") }
];

const mockCandidates = [
  {
    timeString: "06:00",
    totalMinutes: 360,
    score: { totalScore: 75 },
    evaluations: [
      { eventId: "E1", positiveScore: 25, contradictionScore: 0 },
      { eventId: "E2", positiveScore: 30, contradictionScore: 0 },
      { eventId: "E3", positiveScore: 20, contradictionScore: 0 },
      { eventId: "E4", positiveScore: 20, contradictionScore: 0 },
      { eventId: "E5", positiveScore: 25, contradictionScore: 0 }
    ]
  }
];

const holdoutRes = runHoldoutValidation({
  events,
  scoredCandidates: mockCandidates
});

assert.equal(holdoutRes.applicable, true, "Holdout must be applicable for >= 5 events");
assert.equal(holdoutRes.trainEventsCount, 3, "70% split of 5 events gives 3 train events");
assert.equal(holdoutRes.testEventsCount, 2, "30% split of 5 events gives 2 test events");
assert.ok(typeof holdoutRes.outOfSampleEvidenceScore === "number", "outOfSampleEvidenceScore must be numeric");

console.log("✓ test_rectification_holdout passed successfully.");
