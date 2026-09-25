/**
 * ASTROVERSE — High-Precision Time & Coordinate Normalization Engine
 *
 * Implements strict UTC instant creation, Julian Day (JD), Julian Centuries (T),
 * and Greenwich/Local Sidereal Time (GMST / LMST) according to IAU-76 / IAU-2000 standards.
 */

import { getUtcInstantFromLocal } from "../../services/astroEngine.js";

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function norm360(d) {
  let val = d % 360;
  if (val < 0) val += 360;
  return val === -0 ? 0 : val;
}

/**
 * Validates and normalizes input birth parameters.
 * Strict check: latitude [-90, 90], longitude [-180, 180], finite utcOffset.
 */
export function normalizeBirthData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Birth data object is required");
  }

  const {
    birthDate,
    birthTime,
    latitude,
    longitude,
    utcOffset,
    timezoneId
  } = data;

  if (!birthDate || typeof birthDate !== "string" || !birthDate.trim()) {
    throw new Error("Birth date is required in YYYY-MM-DD format");
  }

  const dateParts = birthDate.trim().split("-").map(Number);
  if (dateParts.length < 3 || isNaN(dateParts[0]) || isNaN(dateParts[1]) || isNaN(dateParts[2])) {
    throw new Error(`Invalid birth date format: "${birthDate}". Expected YYYY-MM-DD.`);
  }

  const [year, month, day] = dateParts;
  if (year < 100 || year > 3000) {
    throw new Error(`Birth year out of supported range (100-3000): ${year}`);
  }
  if (month < 1 || month > 12) {
    throw new Error(`Birth month out of bounds (1-12): ${month}`);
  }

  // Strict Gregorian calendar validation (e.g. reject Feb 30, Feb 29 in non-leap year)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) {
    throw new Error(`Invalid calendar date: "${birthDate}". Month ${month} in year ${year} has ${daysInMonth} days.`);
  }

  // STRICT: Birth time is required (no silent 12:00 noon default)
  if (!birthTime || typeof birthTime !== "string" || !birthTime.trim()) {
    throw new Error("Birth time is required for astrological calculation");
  }

  const timeParts = birthTime.trim().split(":").map(Number);
  if (timeParts.length < 2 || isNaN(timeParts[0]) || isNaN(timeParts[1])) {
    throw new Error(`Invalid birth time format: "${birthTime}". Expected HH:MM or HH:MM:SS.`);
  }
  const hour = timeParts[0];
  const minute = timeParts[1];
  const second = (timeParts.length > 2 && !isNaN(timeParts[2])) ? timeParts[2] : 0;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    throw new Error(`Birth time values out of clock bounds: ${birthTime}`);
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and +90 degrees.`);
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error(`Invalid longitude: ${longitude}. Must be between -180 and +180 degrees.`);
  }

  // STRICT: Timezone or UTC offset required (no silent 5.5 IST default)
  const hasTimezoneId = Boolean(timezoneId && typeof timezoneId === "string" && timezoneId.trim());
  const tzId = hasTimezoneId ? timezoneId.trim() : null;
  const hasUtcOffset = (utcOffset !== undefined && utcOffset !== null && !isNaN(Number(utcOffset)));
  let tzOffset = hasUtcOffset ? Number(utcOffset) : null;

  if (!tzId && tzOffset === null) {
    throw new Error("Timezone or UTC offset required for astrological calculation");
  }

  let utcDate = null;

  if (tzId && tzId !== "UTC") {
    try {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      utcDate = getUtcInstantFromLocal(birthDate, timeStr, tzId, { fold: data.fold ?? 0 });
      const localMs = Date.UTC(year, month - 1, day, hour, minute, second);
      const effOffset = (localMs - utcDate.getTime()) / 3600000;
      if (tzOffset === null) {
        tzOffset = effOffset;
      }
    } catch (err) {
      // Do NOT silently catch/swallow timezone errors
      throw new Error(`Invalid or unresolvable IANA timezone "${tzId}": ${err.message}`);
    }
  } else if (tzId === "UTC" && tzOffset === null) {
    tzOffset = 0.0;
  }

  if (!utcDate) {
    if (tzOffset === null) {
      throw new Error("Timezone or UTC offset required for astrological calculation");
    }
    const decimalLocalHours = hour + minute / 60 + second / 3600;
    const decimalUTCHours = decimalLocalHours - tzOffset;
    utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    utcDate.setUTCMilliseconds(Math.round(decimalUTCHours * 3600 * 1000));
  }

  const jd = calculateJulianDate(utcDate);
  const T = (jd - 2451545.0) / 36525.0;

  return {
    birthDate,
    birthTime,
    year,
    month,
    day,
    hour,
    minute,
    second,
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    utcOffset: tzOffset,
    timezoneId: tzId || (tzOffset === 0 ? "UTC" : null),
    utcDate,
    jd,
    T
  };
}

/**
 * Calculates high-precision Julian Date from UTC Date object
 */
export function calculateJulianDate(dateObj) {
  const y = dateObj.getUTCFullYear();
  const m = dateObj.getUTCMonth() + 1;
  const d = dateObj.getUTCDate() +
            dateObj.getUTCHours() / 24 +
            dateObj.getUTCMinutes() / 1440 +
            dateObj.getUTCSeconds() / 86400 +
            dateObj.getUTCMilliseconds() / 86400000;

  let Y = y;
  let M = m;
  if (m <= 2) {
    Y -= 1;
    M += 12;
  }

  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;
}

/**
 * Calculates Greenwich Mean Sidereal Time (GMST) and Local Mean Sidereal Time (LMST) in degrees.
 */
export function calculateSiderealTime(jd, lng) {
  const T = (jd - 2451545.0) / 36525.0;
  // IAU-1982 GMST polynomial formula
  let gmstDegrees = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
                    0.000387933 * T * T - (T * T * T) / 38710000.0;
  gmstDegrees = norm360(gmstDegrees);

  const lmstDegrees = norm360(gmstDegrees + lng);
  const lmstHours = lmstDegrees / 15.0;

  return {
    gmstDegrees,
    lmstDegrees,
    lmstHours
  };
}
