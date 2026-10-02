import assert from "node:assert/strict";
import { resolveIanaTimezone } from "./src/services/geoService.js";
import { generateTimeCandidates } from "./src/services/birthTimeRectification/engine/candidateGenerator.js";

console.log("=== P0 Test: Timezone & DST Resolution Integrity ===");

const chennaiTz = resolveIanaTimezone(13.0827, 80.2707);
assert.equal(chennaiTz.timezoneId, "Asia/Kolkata", "Chennai must resolve to Asia/Kolkata");
assert.equal(chennaiTz.tz, 5.5, "Chennai must have +5.5 UTC offset");

const nyTz = resolveIanaTimezone(40.7128, -74.0060);
assert.equal(nyTz.timezoneId, "America/New_York", "New York must resolve to America/New_York");

const londonTz = resolveIanaTimezone(51.5074, -0.1278);
assert.equal(londonTz.timezoneId, "Europe/London", "London must resolve to Europe/London");

const candidates = generateTimeCandidates({
  birthDate: "1995-06-15",
  approximateTime: "14:30",
  marginMinutes: 10,
  stepMinutes: 5,
  lat: 40.7128,
  lon: -74.0060
});

assert.equal(candidates.length, 5, "Candidate search grid must span 5 steps");
assert.equal(candidates[0].timezoneId, "America/New_York", "Candidates must carry resolved timezone ID");

console.log("✓ test_rectification_timezone_dst passed successfully.");
