/**
 * SKR ASTRO — Temporal Resolver for Actionable Tasks
 * ====================================================
 * Resolves local dates, weeks, and timeframes for action-oriented tasks.
 * Distinguishes action location / timezone from birthplace timezone.
 *
 * Inputs:
 * { question, referenceInstant, actionTimezone, actionLocation, weekStartPreference }
 *
 * Outputs:
 * {
 *   localStartDate: string (YYYY-MM-DD),
 *   localEndDate: string (YYYY-MM-DD),
 *   startInstantUTC: string (ISO),
 *   endInstantUTC: string (ISO),
 *   timezoneId: string,
 *   location: string,
 *   source: "USER_CURRENT_LOCATION" | "CONFIGURED_LOCATION" | "FALLBACK_ACTION_TIMEZONE",
 *   kind: "LOCAL_DATE" | "LOCAL_WEEK" | "CUSTOM_RANGE" | "UNSPECIFIED",
 *   relativeExpression: string,
 *   weekdayName: string,
 *   dayOfWeek: number (0=Sun, 1=Mon, ..., 6=Sat),
 *   unresolvedFields: Array<string>
 * }
 */

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_TA = ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"];

/**
 * Formats a Date object in a specific IANA timezone into parts.
 */
function getZonedParts(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      weekday: "long"
    });
    const parts = formatter.formatToParts(date);
    const map = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }
    const year = parseInt(map.year, 10);
    const month = parseInt(map.month, 10);
    const day = parseInt(map.day, 10);
    const hour = parseInt(map.hour, 10);
    const minute = parseInt(map.minute, 10);
    const second = parseInt(map.second, 10);
    const weekday = map.weekday;
    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayOfWeek = WEEKDAYS.indexOf(weekday);
    return { year, month, day, hour, minute, second, weekday, ymd, dayOfWeek };
  } catch {
    // Fallback if timezone invalid
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = date.getUTCDay();
    return {
      year: y,
      month: m,
      day: d,
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
      weekday: WEEKDAYS[dayOfWeek],
      ymd,
      dayOfWeek
    };
  }
}

/**
 * Resolves temporal timeframe from a question string and optional reference context.
 *
 * @param {Object} params
 * @param {string} params.question - Raw or normalized question
 * @param {Date|string|number} [params.referenceInstant] - Injected reference clock (defaults to now)
 * @param {string} [params.actionTimezone] - Timezone of action (e.g. "Asia/Kolkata", "America/New_York")
 * @param {string} [params.actionLocation] - Name/city of action location
 * @param {string} [params.weekStartPreference="Monday"] - "Monday" | "Sunday"
 * @returns {Object} Structured temporal resolution
 */
export function resolveTemporalTimeframe({
  question = "",
  referenceInstant = null,
  actionTimezone = null,
  actionLocation = null,
  weekStartPreference = "Monday"
} = {}) {
  const raw = String(question || "").toLowerCase();
  const refDate = referenceInstant
    ? (referenceInstant instanceof Date ? referenceInstant : new Date(referenceInstant))
    : new Date();

  // Validate reference Date
  const validRefDate = isNaN(refDate.getTime()) ? new Date() : refDate;

  // Validate action timezone
  let tz = actionTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const unresolvedFields = [];
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    unresolvedFields.push("invalid_timezone");
    tz = "UTC";
  }

  const loc = actionLocation || (actionTimezone ? actionTimezone.split("/").pop().replace(/_/g, " ") : "Current Location");

  const zoned = getZonedParts(validRefDate, tz);

  // Detect timeframe kind
  const isToday = /\b(today|tonight|this\s+evening|this\s+morning)\b/i.test(raw) || /இன்று|இன்றைக்கு|இன்றைய|இரவு/i.test(raw);
  const isThisWeek = /\b(this\s+week|current\s+week)\b/i.test(raw) || /இந்த\s*வாரம்|இந்தவாரம்/i.test(raw);
  const isTomorrow = /\b(tomorrow)\b/i.test(raw) || /நாளை|நாளைக்கு/i.test(raw);

  let kind = "UNSPECIFIED";
  let relativeExpression = "unspecified";
  let localStartDate = zoned.ymd;
  let localEndDate = zoned.ymd;
  let weekdayName = zoned.weekday;
  let dayOfWeek = zoned.dayOfWeek;

  if (isToday) {
    kind = "LOCAL_DATE";
    relativeExpression = "today";
    localStartDate = zoned.ymd;
    localEndDate = zoned.ymd;
  } else if (isTomorrow) {
    kind = "LOCAL_DATE";
    relativeExpression = "tomorrow";
    // Add 1 day
    const nextDayDate = new Date(validRefDate.getTime() + 24 * 60 * 60 * 1000);
    const nextZoned = getZonedParts(nextDayDate, tz);
    localStartDate = nextZoned.ymd;
    localEndDate = nextZoned.ymd;
    weekdayName = nextZoned.weekday;
    dayOfWeek = nextZoned.dayOfWeek;
  } else if (isThisWeek) {
    kind = "LOCAL_WEEK";
    relativeExpression = "this week";

    // Calculate start and end of week based on weekStartPreference
    const startOffset = weekStartPreference === "Sunday"
      ? zoned.dayOfWeek
      : (zoned.dayOfWeek === 0 ? 6 : zoned.dayOfWeek - 1); // Monday start: Mon=0, Sun=6

    const weekStartDate = new Date(validRefDate.getTime() - startOffset * 24 * 60 * 60 * 1000);
    const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);

    const startZoned = getZonedParts(weekStartDate, tz);
    const endZoned = getZonedParts(weekEndDate, tz);

    localStartDate = startZoned.ymd;
    localEndDate = endZoned.ymd;
  } else {
    // Check if explicit weekday mentioned
    let mentionedDay = -1;
    WEEKDAYS.forEach((w, idx) => {
      if (raw.includes(w.toLowerCase())) mentionedDay = idx;
    });
    if (mentionedDay !== -1) {
      kind = "LOCAL_DATE";
      relativeExpression = WEEKDAYS[mentionedDay];
      weekdayName = WEEKDAYS[mentionedDay];
      dayOfWeek = mentionedDay;
    } else {
      unresolvedFields.push("timeframe_unspecified");
    }
  }

  // Calculate true startInstantUTC and endInstantUTC in target timezone
  function localBoundaryToUTC(ymdStr, isEnd, timeZone) {
    try {
      const [y, m, d] = ymdStr.split('-').map(Number);
      const targetHour = isEnd ? 23 : 0;
      const targetMinute = isEnd ? 59 : 0;
      const targetSecond = isEnd ? 59 : 0;
      const guess = new Date(Date.UTC(y, m - 1, d, targetHour, targetMinute, targetSecond));
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
      });
      const parts = fmt.formatToParts(guess);
      const p = {};
      for (const part of parts) p[part.type] = part.value;
      const localUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
      const diff = localUtc - guess.getTime();
      return new Date(guess.getTime() - diff).toISOString();
    } catch {
      return validRefDate.toISOString();
    }
  }

  const startInstantUTC = localBoundaryToUTC(localStartDate, false, tz);
  const endInstantUTC = localBoundaryToUTC(localEndDate, true, tz);

  return {
    localStartDate,
    localEndDate,
    startInstantUTC,
    endInstantUTC,
    timezoneId: actionTimezone || tz,
    location: loc,
    source: actionLocation ? "CONFIGURED_LOCATION" : (actionTimezone ? "FALLBACK_ACTION_TIMEZONE" : "USER_CURRENT_LOCATION"),
    kind,
    relativeExpression,
    weekdayName,
    weekdayNameTa: WEEKDAYS_TA[dayOfWeek] || "",
    dayOfWeek,
    unresolvedFields
  };
}
