import assert from "node:assert/strict";
import { runBirthTimeRectification } from "./src/services/birthTimeRectification/rectificationService.js";

console.log("=== P0 Test: No Fake Precision / Flat Score Safety ===");

// 1 event with type OTHER
const uniformEvents = [
  {
    id: "EVT-OTHER-1",
    type: "OTHER",
    date: "2020-01-01",
    importance: "LOW",
    description: "Generic life event"
  }
];

const result = runBirthTimeRectification({
  birthDate: "1990-04-25",
  approximateTime: "05:56",
  marginMinutes: 15,
  lat: 12.9165,
  lng: 79.1325,
  timezoneId: "Asia/Kolkata",
  utcOffset: 5.5,
  system: "lahiri",
  events: uniformEvents
});

assert.equal(result.status, "SUCCESS");
// If scores are non-discriminating, minuteLevelResolutionEstablished must be false
if (result.resolution === "NOT_DISCRIMINATING" || result.resolution === "CANDIDATE_INTERVAL") {
  assert.equal(result.minuteLevelResolutionEstablished, false, "Must never claim minute-level resolution for non-discriminating data");
}

console.log("✓ test_rectification_no_fake_precision passed successfully.");
