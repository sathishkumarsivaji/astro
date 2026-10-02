/**
 * ASTROVERSE — Muhurta Engine (Electional Timing Layer)
 * =====================================================
 * Distinct from the LifeEventTimingEngine.
 *
 * CRITICAL SEPARATION RULE:
 * 1. LifeEventTimingEngine calculates WHEN the karma ripens / when an event is indicated
 *    (e.g., Property acquisition indicated between July 2028 and November 2028).
 * 2. MuhurtaEngine calculates OPTIMAL ELECTIONAL MOMENTS (day/time window) for deliberate action
 *    (e.g., Agreement signing, deed registration, house warming, marriage muhurta)
 *    ONLY WITHIN OR ADJACENT TO A SUPPORTED LIFE-EVENT WINDOW.
 *
 * It NEVER turns a broad astrological natal period into a fabricated "exact" date.
 * If the life-event window is too broad (e.g. > 90 days or YEAR level), it declares:
 *   status: "REQUIRES_NARROW_WINDOW_SELECTION"
 * and does NOT fabricate an exact day.
 */

import { RESOLUTION, CONFIDENCE_TYPE } from './expertPredictionSchema.js';
import { calculateEventMuhurta } from '../astroEngine.js';

// Domain to Muhurta Event Type mapping
const DOMAIN_MUHURTA_EVENT_MAP = Object.freeze({
  marriage: 'Marriage',
  property: 'Property Registration',
  vehicle: 'Vehicle Purchase',
  business: 'Business Inception',
  education: 'Academic Initiation',
  job: 'Job Joining',
  finance: 'Financial Investment',
  spiritual: 'Spiritual Initiation'
});

/**
 * Calculates Muhurta electional windows for an established life-event window.
 *
 * @param {Object} params
 * @param {string} params.domain - Domain ID (marriage, property, etc.)
 * @param {Object} params.timingWindow - Supported ExpertTimingWindow from LifeEventTimingEngine
 * @param {Object} params.location - { latitude, longitude, timezoneOffsetHours, timezoneId }
 * @param {string} [params.subPhase] - Target sub-phase (e.g. 'registration', 'purchaseContract')
 * @param {boolean} [params.isTamil=false] - Language flag
 * @returns {Object} MuhurtaResult
 */
export function calculateElectionalMuhurta({
  domain,
  timingWindow,
  location = {},
  subPhase = null,
  isTamil = false
}) {
  if (!timingWindow || !timingWindow.startDate || !timingWindow.endDate) {
    return {
      status: 'INSUFFICIENT_DATA',
      domain,
      subPhase,
      muhurtaCandidates: [],
      reasonEn: 'No qualified life-event window provided for Muhurta screening.',
      reasonTa: 'முகூர்த்த கணிப்பிற்கு போதிய வாழ்க்கை நிகழ்வு சாளரம் இல்லை.'
    };
  }

  const sDate = new Date(timingWindow.startDate);
  const eDate = new Date(timingWindow.endDate);
  const diffDays = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24));

  // If window is wider than 90 days, we advise selecting a specific month/season first
  if (diffDays > 90) {
    return {
      status: 'REQUIRES_NARROW_WINDOW_SELECTION',
      domain,
      subPhase,
      lifeEventWindow: {
        startDate: timingWindow.startDate,
        endDate: timingWindow.endDate,
        resolution: timingWindow.resolution
      },
      muhurtaCandidates: [],
      guidanceEn: `The life-event timing window spans ${diffDays} days (${timingWindow.resolution}). For authentic Muhurta election, please specify a target 15-to-30 day range within this auspicious period.`,
      guidanceTa: `வாழ்க்கை நிகழ்வு சாளரம் ${diffDays} நாட்கள் நீள்கிறது. துல்லியமான முகூர்த்த கணிப்பிற்கு, இந்த சுப காலத்திற்குள் 15-30 நாட்கள் வரம்பை தேர்ந்தெடுக்கவும்.`
    };
  }

  const missing = [];
  if (typeof location.latitude !== 'number' || !Number.isFinite(location.latitude)) missing.push('latitude');
  if (typeof location.longitude !== 'number' || !Number.isFinite(location.longitude)) missing.push('longitude');
  const tz = location.timezoneOffsetHours ?? location.utcOffset ?? location.tz;
  if (typeof tz !== 'number' || !Number.isFinite(tz)) missing.push('timezoneOffsetHours');

  if (missing.length > 0) {
    return {
      status: 'INSUFFICIENT_DATA',
      domain,
      subPhase,
      missing,
      muhurtaCandidates: [],
      reasonEn: `Muhurta calculation requires verified latitude, longitude, and timezone offset. Missing: ${missing.join(', ')}.`,
      reasonTa: `முகூர்த்த கணிப்பிற்கு சரியான அட்சரேகை, தீர்க்கரேகை மற்றும் நேர மண்டல விவரங்கள் தேவை. விடுபட்டவை: ${missing.join(', ')}.`
    };
  }

  const eventType = DOMAIN_MUHURTA_EVENT_MAP[domain] || 'General Auspicious Action';
  const lat = location.latitude;
  const lng = location.longitude;
  const timezoneId = location.timezoneId || location.ianaTimezone || null;

  try {
    // Run existing validated calculateEventMuhurta
    const rawMuhurta = calculateEventMuhurta(
      eventType,
      timingWindow.startDate,
      timingWindow.endDate,
      lat,
      lng,
      tz,
      timezoneId
    );

    const candidates = (rawMuhurta.candidates || []).map((c) => ({
      muhurtaId: `muh_${domain}_${(c.date || '').replace(/-/g, '')}`,
      date: c.date,
      score: c.score,
      quality: c.score >= 80 ? 'EXCELLENT' : c.score >= 65 ? 'GOOD' : 'ACCEPTABLE',
      resolution: RESOLUTION.DAY,
      tithi: c.tithi,
      nakshatra: c.nakshatra,
      yoga: c.yoga,
      karana: c.karana,
      positiveFactors: c.positiveFactors || [],
      negativeFactors: c.negativeFactors || [],
      type: 'ELECTIONAL_MUHURTA'
    }));

    return {
      status: candidates.length > 0 ? 'SUPPORTED' : 'NOT_ESTABLISHED',
      domain,
      subPhase,
      eventType,
      resolution: RESOLUTION.DAY,
      lifeEventWindowId: timingWindow.windowId,
      muhurtaCandidates: candidates.slice(0, 5), // Top 5 screened dates
      summaryEn: `Identified ${candidates.length} candidate Muhurta day(s) for ${eventType} within the calculated life-event window.`,
      summaryTa: `கணக்கிடப்பட்ட சுப காலத்திற்குள் ${candidates.length} முகூர்த்த தினங்கள் கண்டறியப்பட்டுள்ளன.`
    };
  } catch (err) {
    return {
      status: 'CALCULATION_ERROR',
      domain,
      subPhase,
      error: err.message,
      muhurtaCandidates: []
    };
  }
}
