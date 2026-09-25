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
  if (!data) {
    throw new Error("Birth data object is required");
  }

  const {
    birthDate,
    birthTime = "12:00",
    latitude,
    longitude,
    utcOffset,
    timezoneId = "UTC"
  } = data;

  if (!birthDate || typeof birthDate !== "string") {
    throw new Error("Invalid birth date: expected string in YYYY-MM-DD format");
  }

  const dateParts = birthDate.split("-").map(Number);
  if (dateParts.length < 3 || isNaN(dateParts[0]) || isNaN(dateParts[1]) || isNaN(dateParts[2])) {
    throw new Error(`Invalid birth date format: "${birthDate}". Expected YYYY-MM-DD.`);
  }

  const [year, month, day] = dateParts;
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Birth date values out of calendar bounds: ${birthDate}`);
  }

  const timeParts = (birthTime || "12:00").split(":").map(Number);
  const hour = isNaN(timeParts[0]) ? 12 : timeParts[0];
  const minute = isNaN(timeParts[1]) ? 0 : timeParts[1];
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

  // CRITICAL: utcOffset = 0.0 is completely valid (UTC/GMT/London) and MUST NOT fall back to 5.5
  let tzOffset = (utcOffset !== undefined && utcOffset !== null && !isNaN(Number(utcOffset))) ? Number(utcOffset) : null;
  let utcDate = null;

  if (timezoneId && timezoneId !== "UTC") {
    try {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      utcDate = getUtcInstantFromLocal(birthDate, timeStr, timezoneId, { fold: data.fold ?? 0 });
      const localMs = Date.UTC(year, month - 1, day, hour, minute, second);
      const effOffset = (localMs - utcDate.getTime()) / 3600000;
      if (tzOffset === null) {
        tzOffset = effOffset;
      }
    } catch (_err) {
      // If error (e.g. unknown timezone ID or gap), fallback to numerical offset
    }
  }

  if (!utcDate) {
    if (tzOffset === null) {
      tzOffset = 5.5;
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
    timezoneId,
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
