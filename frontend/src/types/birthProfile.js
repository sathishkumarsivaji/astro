/**
 * Master Birth Profile Definition & Validation
 * Single source of truth for native birth data across all Astro modules.
 */

export const EMPTY_BIRTH_PROFILE = {
  name: "",
  gender: "male",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  latitude: null,
  longitude: null,
  timezoneId: null,
  utcOffset: null,
  system: "vedic",
  isDemo: false
};

export const DEMO_BIRTH_PROFILE = {
  name: "Demo Chart",
  nameTa: "மாதிரி ஜாதகம்",
  gender: "male",
  birthDate: "1994-08-15",
  birthTime: "06:30",
  birthPlace: "Chennai, Tamil Nadu, India",
  latitude: 13.0827,
  longitude: 80.2707,
  timezoneId: "Asia/Kolkata",
  utcOffset: 5.5,
  system: "vedic",
  isDemo: true
};

export function normalizeBirthProfile(profile = {}) {
  const normalized = {
    ...EMPTY_BIRTH_PROFILE,
    ...profile,
    name: typeof profile.name === "string" ? profile.name.trim() : "",
    birthDate: typeof profile.birthDate === "string" ? profile.birthDate.trim() : "",
    birthTime: typeof profile.birthTime === "string" ? profile.birthTime.trim() : "",
    birthPlace: typeof profile.birthPlace === "string" ? profile.birthPlace.trim() : "",
    latitude: profile.latitude === null || profile.latitude === undefined || profile.latitude === ""
      ? null
      : Number(profile.latitude),
    longitude: profile.longitude === null || profile.longitude === undefined || profile.longitude === ""
      ? null
      : Number(profile.longitude),
    utcOffset: profile.utcOffset === null || profile.utcOffset === undefined || profile.utcOffset === ""
      ? null
      : Number(profile.utcOffset),
    timezoneId: typeof profile.timezoneId === "string" && profile.timezoneId.trim()
      ? profile.timezoneId.trim()
      : null,
    system: typeof profile.system === "string" ? profile.system.toLowerCase() : EMPTY_BIRTH_PROFILE.system,
    birthTimePrecision: profile.birthTimePrecision || "MINUTE",
    timezoneSource: profile.timezoneSource || (profile.timezoneId ? "profile" : "missing"),
    coordinateSource: profile.coordinateSource || (profile.latitude !== null && profile.longitude !== null ? "profile" : "missing")
  };

  return Object.freeze(normalized);
}

function isValidTimezoneId(timezoneId) {
  if (!timezoneId) return true;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezoneId }).format();
    return true;
  } catch {
    return false;
  }
}

export function validateBirthProfile(profile) {
  const errors = [];
  if (!profile) {
    return { isValid: false, errors: ["Birth profile is missing"] };
  }
  const normalized = normalizeBirthProfile(profile);

  // 1. Birth Date Validation
  if (!normalized.birthDate || typeof normalized.birthDate !== "string") {
    errors.push("Birth date is required (YYYY-MM-DD)");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized.birthDate)) {
    errors.push("Birth date must be in YYYY-MM-DD format");
  } else {
    const [y, m, d] = normalized.birthDate.split("-").map(Number);
    if (y < 1800 || y > 2200) {
      errors.push("Birth year must be between 1800 and 2200");
    }
    if (m < 1 || m > 12) {
      errors.push("Birth month must be between 01 and 12");
    } else {
      const daysInMonth = new Date(y, m, 0).getDate();
      if (d < 1 || d > daysInMonth) {
        errors.push(`Invalid day ${d} for month ${m} (must be 1-${daysInMonth})`);
      }
    }
  }

  // 2. Birth Time Validation
  if (!normalized.birthTime || typeof normalized.birthTime !== "string") {
    errors.push("Birth time is required (HH:MM 24-hr)");
  } else if (!/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(normalized.birthTime)) {
    errors.push("Birth time must be valid 24-hour format (00:00 to 23:59)");
  }

  // 3. Latitude Validation (-90 to +90)
  if (normalized.latitude === null || normalized.latitude === undefined || !Number.isFinite(normalized.latitude)) {
    errors.push("Valid geographic latitude is required");
  } else {
    const lat = normalized.latitude;
    if (lat < -90 || lat > 90) {
      errors.push("Latitude must be between -90.0 and +90.0 degrees");
    }
  }

  // 4. Longitude Validation (-180 to +180)
  if (normalized.longitude === null || normalized.longitude === undefined || !Number.isFinite(normalized.longitude)) {
    errors.push("Valid geographic longitude is required");
  } else {
    const lng = normalized.longitude;
    if (lng < -180 || lng > 180) {
      errors.push("Longitude must be between -180.0 and +180.0 degrees");
    }
  }

  // 5. Birth Place
  if (!normalized.birthPlace || typeof normalized.birthPlace !== "string") {
    errors.push("Birth place / city name is required");
  }

  // 6. Astrological System
  const validSystems = ["vedic", "lahiri", "kp", "raman", "tropical", "sayana", "western"];
  if (normalized.system && !validSystems.includes(normalized.system)) {
    errors.push(`Astrological system must be one of: ${validSystems.join(", ")}`);
  }
  if (!isValidTimezoneId(normalized.timezoneId)) {
    errors.push(`Timezone must be a valid IANA identifier: ${normalized.timezoneId}`);
  }
  if (normalized.utcOffset !== null && (!Number.isFinite(normalized.utcOffset) || normalized.utcOffset < -14 || normalized.utcOffset > 14)) {
    errors.push("UTC offset must be between -14 and +14 hours");
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedProfile: normalized
  };
}
