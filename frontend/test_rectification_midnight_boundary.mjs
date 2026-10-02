import assert from "node:assert/strict";
import { createCandidateDateTime } from "./src/services/birthTimeRectification/engine/candidateGenerator.js";

console.log("=== P0 Test: Midnight Boundary & Civil Date Rollover ===");

// Midnight forward rollover (23:50 + 30m = 00:20 next day)
const rollForward = createCandidateDateTime({
  baseDateStr: "1992-08-15",
  minutesFromMidnight: 1460, // 24h 20m = 00:20 next day
  centerMinutes: 1430,
  timezoneId: "Asia/Kolkata",
  utcOffsetHours: 5.5
});

assert.equal(rollForward.localDate, "1992-08-16", "Date must increment across midnight forward");
assert.equal(rollForward.localTime, "00:20", "Time must wrap around to 00:20");

// Midnight backward rollover (00:10 - 30m = 23:40 previous day)
const rollBackward = createCandidateDateTime({
  baseDateStr: "1992-08-15",
  minutesFromMidnight: -20, // -20m = 23:40 previous day
  centerMinutes: 10,
  timezoneId: "Asia/Kolkata",
  utcOffsetHours: 5.5
});

assert.equal(rollBackward.localDate, "1992-08-14", "Date must decrement across midnight backward");
assert.equal(rollBackward.localTime, "23:40", "Time must wrap around to 23:40");

console.log("✓ test_rectification_midnight_boundary passed successfully.");
