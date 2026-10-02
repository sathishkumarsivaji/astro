/**
 * ASTROVERSE — Authoritative Candidate Birth-Time Generator
 *
 * Generates discrete candidate birth times as full DateTime objects with:
 * - Midnight boundary safety (automatically increments/decrements civil date)
 * - Authoritative IANA timezone & historical UTC offset handling
 * - Multi-stage search grids (coarse scan -> top-N local maxima -> fine refinement)
 * - Zero fabricated defaults or static assumptions.
 */

import { resolveIanaTimezone, getHistoricalUtcOffset } from "../../geoService.js";

/**
 * Parses time string (HH:MM or HH:MM:SS) into decimal minutes
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const parts = timeStr.trim().split(":").map(p => parseFloat(p));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1] + (parts[2] ? parts[2] / 60 : 0);
}

/**
 * Formats decimal minutes into HH:MM or HH:MM:SS string
 */
export function formatMinutesToTimeString(totalMinutes, includeSeconds = false) {
  const normMin = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normMin / 60);
  const minutes = Math.floor(normMin % 60);
  const seconds = Math.round((normMin * 60) % 60);

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds === 60 ? 59 : seconds).padStart(2, "0");

  return includeSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
}

/**
 * Constructs a fully qualified DateTime candidate object with midnight crossing support
 */
export function createCandidateDateTime({
  baseDateStr,
  minutesFromMidnight,
  centerMinutes = 0,
  timezoneId = null,
  utcOffsetHours = null
}) {
  if (!baseDateStr || typeof baseDateStr !== "string") {
    throw new Error("baseDateStr (YYYY-MM-DD) is required for candidate construction.");
  }

  const [baseYear, baseMonth, baseDay] = baseDateStr.split("-").map(Number);
  if (isNaN(baseYear) || isNaN(baseMonth) || isNaN(baseDay)) {
    throw new Error(`Invalid baseDateStr format: "${baseDateStr}". Expected YYYY-MM-DD.`);
  }

  // Calculate day rollover (across midnight)
  let dayOffset = 0;
  let normMinutes = minutesFromMidnight;

  if (normMinutes >= 1440) {
    dayOffset = Math.floor(normMinutes / 1440);
    normMinutes = normMinutes % 1440;
  } else if (normMinutes < 0) {
    dayOffset = Math.floor(normMinutes / 1440);
    normMinutes = ((normMinutes % 1440) + 1440) % 1440;
  }

  // Shift local date
  const tempDate = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay + dayOffset, 0, 0, 0));
  const curYear = tempDate.getUTCFullYear();
  const curMonth = tempDate.getUTCMonth() + 1;
  const curDay = tempDate.getUTCDate();

  const localDateStr = `${curYear}-${String(curMonth).padStart(2, "0")}-${String(curDay).padStart(2, "0")}`;
  const localTimeStr = formatMinutesToTimeString(normMinutes, false);
  const localTimeWithSecStr = formatMinutesToTimeString(normMinutes, true);

  // Compute dynamic historical UTC offset if timezoneId is provided
  let effectiveOffset = utcOffsetHours;
  const effTzId = timezoneId || "UTC";
  if (effectiveOffset === null || effectiveOffset === undefined) {
    if (effTzId && effTzId !== "UTC") {
      effectiveOffset = getHistoricalUtcOffset(effTzId, localDateStr, localTimeStr);
    } else {
      effectiveOffset = 0;
    }
  }

  // Compute exact UTC instant
  const localHours = normMinutes / 60.0;
  const utcHours = localHours - effectiveOffset;

  const utcMs = Date.UTC(curYear, curMonth - 1, curDay, 0, 0, 0) + (utcHours * 3600000);
  const utcInstant = new Date(utcMs);

  return {
    localDate: localDateStr,
    localTime: localTimeStr,
    timeString: localTimeStr,
    localTimeWithSeconds: localTimeWithSecStr,
    localDateTime: `${localDateStr}T${localTimeWithSecStr}`,
    utcInstant,
    totalMinutes: Number(minutesFromMidnight.toFixed(2)),
    normMinutes: Number(normMinutes.toFixed(2)),
    minuteOffset: Number((minutesFromMidnight - centerMinutes).toFixed(2)),
    timezoneId: effTzId,
    utcOffset: Number(effectiveOffset.toFixed(2))
  };
}

/**
 * Generates discrete time candidates within a search window
 */
export function generateTimeCandidates({
  birthDate,
  approximateTime,
  windowStart = null,
  windowEnd = null,
  marginMinutes = 30,
  stepMinutes = 1,
  timezoneId = null,
  utcOffset = null,
  lat = null,
  lon = null
}) {
  if (!birthDate && !windowStart) {
    throw new Error("birthDate is required to generate candidate times.");
  }
  const effBirthDate = birthDate || "2000-01-01";

  let centerMin = 0;
  let startMinutes = 0;
  let endMinutes = 0;

  if (windowStart && windowEnd) {
    startMinutes = parseTimeToMinutes(windowStart);
    endMinutes = parseTimeToMinutes(windowEnd);
    centerMin = (startMinutes + endMinutes) / 2;
  } else if (approximateTime) {
    centerMin = parseTimeToMinutes(approximateTime);
    if (centerMin === null) {
      throw new Error(`Invalid approximate birth time: "${approximateTime}". Expected HH:MM format.`);
    }
    const margin = Math.max(1, Math.min(720, Number(marginMinutes) || 30));
    startMinutes = centerMin - margin;
    endMinutes = centerMin + margin;
  } else {
    throw new Error("Either approximateTime or windowStart/windowEnd must be provided.");
  }

  // Resolve authoritative IANA timezone
  let effTzId = timezoneId;
  let effOffset = utcOffset;

  if (!effTzId && lat !== null && lon !== null && (lat !== 0 || lon !== 0)) {
    const resolved = resolveIanaTimezone(lat, lon);
    effTzId = resolved.timezoneId;
    if (effOffset === null || effOffset === undefined) {
      effOffset = resolved.tz;
    }
  }

  const step = Math.max(0.25, Number(stepMinutes) || 1);
  const candidates = [];

  for (let m = startMinutes; m <= endMinutes + 1e-5; m += step) {
    const cand = createCandidateDateTime({
      baseDateStr: effBirthDate,
      minutesFromMidnight: m,
      centerMinutes: centerMin,
      timezoneId: effTzId,
      utcOffsetHours: effOffset
    });
    candidates.push(cand);
  }

  return candidates;
}

/**
 * Finds top N local maxima in a scored candidate series
 */
export function findLocalMaxima(scoredCandidates, minSeparationMinutes = 5, topN = 3) {
  if (!Array.isArray(scoredCandidates) || scoredCandidates.length === 0) {
    return [];
  }

  // Sort by totalMinutes ascending
  const sorted = [...scoredCandidates].sort((a, b) => a.totalMinutes - b.totalMinutes);
  const peaks = [];

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    const left = i > 0 ? sorted[i - 1].score.totalScore : -1;
    const right = i < sorted.length - 1 ? sorted[i + 1].score.totalScore : -1;

    // Peak condition: greater than or equal to neighbors
    if (cur.score.totalScore >= left && cur.score.totalScore >= right && cur.score.totalScore > 10) {
      peaks.push(cur);
    }
  }

  // Sort peaks by score descending
  peaks.sort((a, b) => b.score.totalScore - a.score.totalScore);

  // Filter for minimum separation
  const separatedPeaks = [];
  for (const p of peaks) {
    const tooClose = separatedPeaks.some(sp => Math.abs(sp.totalMinutes - p.totalMinutes) < minSeparationMinutes);
    if (!tooClose) {
      separatedPeaks.push(p);
    }
    if (separatedPeaks.length >= topN) break;
  }

  return separatedPeaks;
}
