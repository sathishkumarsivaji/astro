import assert from "node:assert/strict";
import {
  EMPTY_BIRTH_PROFILE,
  normalizeBirthProfile,
  validateBirthProfile
} from "./src/types/birthProfile.js";

const valid = normalizeBirthProfile({
  name: "  Native ",
  birthDate: "1994-08-15",
  birthTime: "06:30",
  birthPlace: "Chennai",
  latitude: "13.0827",
  longitude: "80.2707",
  utcOffset: "5.5",
  timezoneId: "Asia/Kolkata",
  system: "LAHIRI"
});

assert.equal(valid.name, "Native");
assert.equal(valid.latitude, 13.0827);
assert.equal(valid.system, "lahiri");
assert.equal(validateBirthProfile(valid).isValid, true);
assert.equal(validateBirthProfile({ ...valid, timezoneId: "Not/A_Timezone" }).isValid, false);
assert.equal(validateBirthProfile({ ...valid, utcOffset: 15 }).isValid, false);
assert.equal(normalizeBirthProfile().birthDate, EMPTY_BIRTH_PROFILE.birthDate);

console.log("Birth profile contract passed.");
