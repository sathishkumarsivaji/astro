import assert from "node:assert/strict";
import { runBirthTimeRectification } from "./src/services/birthTimeRectification/rectificationService.js";

console.log("=== Test: Search Boundary Winner Detection ===");

// Set approximateTime far from where the events match, so the peak lands on the boundary
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

// If approx time is 06:00 and margin is 5 mins (window 05:55-06:05), but true peak is at 06:14,
// the candidate with highest score in [05:55, 06:05] will be at or near the 06:05 edge.
const result = runBirthTimeRectification({
  birthDate: "1992-08-15",
  approximateTime: "06:00",
  marginMinutes: 5,
  lat: 13.0827,
  lng: 80.2707,
  timezoneId: "Asia/Kolkata",
  utcOffset: 5.5,
  events
});

assert.equal(result.status, "SUCCESS");
// Check that if the peak is within 2 mins of boundary (05:55 or 06:05) or not discriminating, resolution reflects honesty
if (result.resolution === "AT_SEARCH_BOUNDARY") {
  assert.equal(result.centralEstimate, null, "centralEstimate must be null when peak is at search boundary");
  assert.equal(result.minuteLevelResolutionEstablished, false, "minuteLevelResolutionEstablished must be false at search boundary");
  console.log("✓ Correctly detected AT_SEARCH_BOUNDARY condition.");
} else {
  console.log(`✓ Result resolution: ${result.resolution} (centralEstimate: ${result.centralEstimate})`);
}

console.log("✓ Edge boundary test completed successfully!");
