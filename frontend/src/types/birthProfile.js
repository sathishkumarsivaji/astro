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
  timezoneId: "Asia/Kolkata",
  utcOffset: 5.5,
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

export function validateBirthProfile(profile) {
  const errors = [];
  if (!profile) {
    return { isValid: false, errors: ["Birth profile is missing"] };
  }

  // 1. Birth Date Validation
  if (!profile.birthDate || typeof profile.birthDate !== "string") {
    errors.push("Birth date is required (YYYY-MM-DD)");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate)) {
    errors.push("Birth date must be in YYYY-MM-DD format");
  } else {
    const [y, m, d] = profile.birthDate.split("-").map(Number);
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
  if (!profile.birthTime || typeof profile.birthTime !== "string") {
    errors.push("Birth time is required (HH:MM 24-hr)");
  } else if (!/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(profile.birthTime)) {
    errors.push("Birth time must be valid 24-hour format (00:00 to 23:59)");
  }

  // 3. Latitude Validation (-90 to +90)
  if (profile.latitude === null || profile.latitude === undefined || isNaN(Number(profile.latitude))) {
    errors.push("Valid geographic latitude is required");
  } else {
    const lat = Number(profile.latitude);
    if (lat < -90 || lat > 90) {
      errors.push("Latitude must be between -90.0 and +90.0 degrees");
    }
  }

  // 4. Longitude Validation (-180 to +180)
  if (profile.longitude === null || profile.longitude === undefined || isNaN(Number(profile.longitude))) {
    errors.push("Valid geographic longitude is required");
  } else {
    const lng = Number(profile.longitude);
    if (lng < -180 || lng > 180) {
      errors.push("Longitude must be between -180.0 and +180.0 degrees");
    }
  }

  // 5. Birth Place
  if (!profile.birthPlace || typeof profile.birthPlace !== "string" || !profile.birthPlace.trim()) {
    errors.push("Birth place / city name is required");
  }

  // 6. Astrological System
  if (profile.system && profile.system !== "vedic") {
    errors.push("Astrological system must be 'vedic'");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
