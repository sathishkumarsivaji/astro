import assert from "node:assert/strict";
import { runLeaveOneOutValidation } from "./src/services/birthTimeRectification/engine/validationEngine.js";

console.log("=== P0 Test: Leave-One-Event-Out (LOEO) Validation ===");

const events = [
  { id: "E1", type: "CAREER_START", parsedDate: new Date("2016-07-01") },
  { id: "E2", type: "MARRIAGE", parsedDate: new Date("2019-11-20") },
  { id: "E3", type: "RELOCATION", parsedDate: new Date("2021-03-15") }
];

const mockCandidate = {
  timeString: "06:00",
  totalMinutes: 360,
  score: { totalScore: 75 },
  evaluations: [
    { eventId: "E1", positiveScore: 25, contradictionScore: 0, isContradiction: false },
    { eventId: "E2", positiveScore: 30, contradictionScore: 0, isContradiction: false },
    { eventId: "E3", positiveScore: 20, contradictionScore: 0, isContradiction: false }
  ]
};

const loeoRes = runLeaveOneOutValidation({
  events,
  scoredCandidates: [mockCandidate],
  bestCandidate: mockCandidate
});

assert.equal(loeoRes.applicable, true, "LOEO should be applicable for >= 2 events");
assert.equal(loeoRes.rounds.length, 3, "Should run 3 rounds for 3 events");
assert.ok(typeof loeoRes.heldOutEventPassRate === "number", "heldOutEventPassRate must be numeric");

console.log("✓ test_rectification_loeo passed successfully.");
