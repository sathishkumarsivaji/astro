import assert from "node:assert/strict";
import { calculateChartBySystem } from "./src/astrology/index.js";
import { attachCanonicalChartContext } from "./src/services/canonicalChartContext.js";
import { normalizeBirthProfile, validateBirthProfile } from "./src/types/birthProfile.js";

const cases = [
  {
    id: "london-dst-boundary",
    birthDate: "2024-03-31",
    birthTime: "00:30",
    birthPlace: "London, United Kingdom",
    latitude: 51.5074,
    longitude: -0.1278,
    timezoneId: "Europe/London",
    utcOffset: 0,
    system: "lahiri"
  },
  {
    id: "new-york-historical-standard",
    birthDate: "1950-11-05",
    birthTime: "01:30",
    birthPlace: "New York, United States",
    latitude: 40.7128,
    longitude: -74.006,
    timezoneId: "America/New_York",
    utcOffset: -5,
    system: "lahiri"
  },
  {
    id: "date-time-boundary",
    birthDate: "2000-01-01",
    birthTime: "00:00:00",
    birthPlace: "Chennai, India",
    latitude: 13.0827,
    longitude: 80.2707,
    timezoneId: "Asia/Kolkata",
    utcOffset: 5.5,
    system: "vedic"
  }
];

for (const input of cases) {
  const profile = normalizeBirthProfile(input);
  const validation = validateBirthProfile(profile);
  assert.equal(validation.isValid, true, `${input.id}: profile validates`);
  const chart = calculateChartBySystem(profile.system, profile);
  const restored = normalizeBirthProfile(JSON.parse(JSON.stringify(profile)));
  const restoredChart = calculateChartBySystem(restored.system, restored);
  const context = attachCanonicalChartContext(chart, profile, "2026-01-01T00:00:00.000Z");
  const restoredContext = attachCanonicalChartContext(restoredChart, restored, "2026-01-01T00:00:00.000Z");
  assert.equal(context.canonicalContext.inputHash, restoredContext.canonicalContext.inputHash, `${input.id}: restoration preserves input hash`);
  assert.equal(context.canonicalContext.chartHash, restoredContext.canonicalContext.chartHash, `${input.id}: restoration preserves chart hash`);
  assert.equal(context.calculationCertificate.utcInstant, restoredContext.calculationCertificate.utcInstant, `${input.id}: restoration preserves UTC conversion`);
}

const invalidCoordinates = normalizeBirthProfile({ ...cases[0], latitude: 91 });
assert.equal(validateBirthProfile(invalidCoordinates).isValid, false);
const invalidTime = normalizeBirthProfile({ ...cases[0], birthTime: "24:00" });
assert.equal(validateBirthProfile(invalidTime).isValid, false);
const invalidTimezone = normalizeBirthProfile({ ...cases[0], timezoneId: "Mars/Olympus" });
assert.equal(validateBirthProfile(invalidTimezone).isValid, false);
assert.throws(
  () => calculateChartBySystem("lahiri", normalizeBirthProfile({ ...cases[0], birthTime: "01:30" })),
  /NONEXISTENT_LOCAL_TIME/
);

console.log(`Historical birth-profile cases passed (${cases.length} valid cases plus invalid-input checks).`);
