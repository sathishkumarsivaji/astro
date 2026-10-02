import assert from "node:assert/strict";
import { runBirthTimeRectification } from "./src/services/birthTimeRectification/rectificationService.js";
import { parseTimeToMinutes } from "./src/services/birthTimeRectification/engine/candidateGenerator.js";

console.log("=== Test: Margin Clamping (1m, 5m, 20m) ===");

const events = [
  {
    id: "EVT-1",
    type: "CAREER_START",
    date: "2016-07-01",
    importance: "HIGH",
    verified: true
  },
  {
    id: "EVT-2",
    type: "MARRIAGE",
    date: "2019-11-20",
    importance: "CRITICAL",
    verified: true
  }
];

const testMargins = [1, 5, 20];
const approxTime = "06:15";
const centerMin = parseTimeToMinutes(approxTime);

for (const margin of testMargins) {
  const result = runBirthTimeRectification({
    birthDate: "1992-08-15",
    approximateTime: approxTime,
    marginMinutes: margin,
    lat: 13.0827,
    lng: 80.2707,
    timezoneId: "Asia/Kolkata",
    utcOffset: 5.5,
    events
  });

  assert.equal(result.status, "SUCCESS", `Margin ${margin}m should succeed`);
  const minAllowed = centerMin - margin;
  const maxAllowed = centerMin + margin;

  for (const tc of result.topCandidates) {
    assert.ok(
      tc.totalMinutes >= minAllowed - 1e-4 && tc.totalMinutes <= maxAllowed + 1e-4,
      `Candidate ${tc.timeString} (${tc.totalMinutes}m) must be strictly within [${minAllowed}, ${maxAllowed}] for margin ${margin}m`
    );
  }

  console.log(`✓ Margin ${margin}m strictly clamped to [${minAllowed}, ${maxAllowed}] (${result.allScoredCandidatesCount} candidates evaluated).`);
}

console.log("✓ All margin clamping tests passed successfully!");
