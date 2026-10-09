/**
 * ASTROVERSE — Master Birth-Time Rectification Service
 *
 * Coordinates the full evidence-based birth-time rectification workflow:
 * 1. Multi-Stage Progressive Search (Coarse Scan -> Local Maxima -> Fine Refinement)
 * 2. Canonical Varga (D1-D60) & Genuine Historical Transit Calculations
 * 3. 3-Tier Vimshottari Dasha Event Timing (MD/AD/PD)
 * 4. Chronological Contiguous Run Stability & Multimodal Peak Analysis
 * 5. Strict Tie Handling (No arbitrary minute selection among indistinguishable candidates)
 * 6. Honest Statistical Resolution (Minute-level, Candidate Interval, Multimodal, or Non-discriminating)
 * 7. Out-of-Sample Cross-Validation (LOEO & Holdout)
 *
 * ZERO synthetic fallbacks or forced claims.
 */

import { validateLifeEvent } from "./types.js";
import {
  parseTimeToMinutes,
  formatMinutesToTimeString,
  generateTimeCandidates,
  findLocalMaxima
} from "./engine/candidateGenerator.js";
import { getCachedOrComputeChart, clearChartCache } from "./engine/chartEvaluator.js";
import { evaluateEventForCandidate } from "./evaluators/index.js";
import { scoreCandidate } from "./engine/scoringEngine.js";
import { analyzeCandidateStability } from "./engine/stabilityAnalyzer.js";
import { runSensitivityAnalysis } from "./engine/sensitivityAnalyzer.js";
import { runLeaveOneOutValidation, runHoldoutValidation } from "./engine/validationEngine.js";
import { runPermutationNullTest } from "./engine/permutationEngine.js";
import { buildCanonicalVarga } from "./engine/rectificationVargaAdapter.js";
import { resolveIanaTimezone } from "../geoService.js";

/**
 * Performance metrics for rectification runs.
 */
function createPerformanceMetrics() {
  return {
    startTime: Date.now(),
    endTime: null,
    durationMs: null,
    candidateCount: 0,
    eventCount: 0,
    permutationCount: 0,
    chartCacheHits: 0,
    chartCacheMisses: 0,
    transitCacheHits: 0,
    transitCacheMisses: 0,
    peakMemoryMB: null
  };
}

/**
 * Runs complete Evidence-Based Birth-Time Rectification
 */
export function runBirthTimeRectification({
  birthDate,
  approximateTime,
  marginMinutes = 30,
  events = [],
  lat = 0,
  lng = 0,
  timezoneId = null,
  utcOffset = null,
  timezone = null,
  tz = null,
  system = "lahiri",
  lang = "en",
  options = {}
}) {
  const metrics = createPerformanceMetrics();

  if (!birthDate) {
    throw new Error("birthDate is required for birth-time rectification.");
  }
  if (!approximateTime) {
    throw new Error("approximateTime (HH:MM) is required for birth-time rectification.");
  }

  // 1. Validate & Normalize Life Events
  const rawEvents = Array.isArray(events) ? events : [];
  const validatedEvents = [];
  for (let i = 0; i < rawEvents.length; i++) {
    try {
      validatedEvents.push(validateLifeEvent(rawEvents[i], i));
    } catch (err) {
      console.warn(`[Rectification] Skipping invalid event at index ${i}:`, err.message);
    }
  }

  if (validatedEvents.length === 0) {
    metrics.endTime = Date.now();
    metrics.durationMs = metrics.endTime - metrics.startTime;
    return {
      status: "INSUFFICIENT_DATA",
      centralEstimate: null,
      rectifiedTime: null,
      candidateInterval: null,
      stableInterval: null,
      resolution: "INSUFFICIENT_DATA",
      minuteLevelResolutionEstablished: false,
      message: "No valid lifetime events provided. Rectification requires verified events.",
      evaluatedEventsCount: 0,
      evidenceLineage: [],
      summaryEn: "Rectification failed: No valid lifetime events provided.",
      summaryTa: "பிறந்த நேர திருத்தம் தோல்வியுற்றது: சரியான நிகழ்வுகள் வழங்கப்படவில்லை.",
      metrics
    };
  }

  // Resolve Timezone
  let effTzId = timezoneId;
  let effUtcOffset = utcOffset !== null && utcOffset !== undefined ? utcOffset : (timezone !== null && timezone !== undefined ? timezone : tz);
  if (effUtcOffset === null || effUtcOffset === undefined) {
    if (lat !== 0 || lng !== 0) {
      const resolved = resolveIanaTimezone(lat, lng);
      effUtcOffset = resolved.tz;
      effTzId = resolved.timezoneId;
    } else {
      effUtcOffset = 0;
      effTzId = "UTC";
    }
  }

  const centerMin = parseTimeToMinutes(approximateTime);
  const margin = Math.max(1, Math.min(360, Number(marginMinutes) || 30));
  const windowStartMin = centerMin - margin;
  const windowEndMin = centerMin + margin;

  // 2. STAGE 1: Candidate Search Grid (step = 1 min for margin <= 60)
  const initialStep = margin <= 60 ? 1 : (margin > 120 ? 10 : 5);
  const coarseCandidates = generateTimeCandidates({
    birthDate,
    approximateTime,
    marginMinutes: margin,
    stepMinutes: initialStep,
    timezoneId: effTzId,
    utcOffset: effUtcOffset,
    lat,
    lon: lng
  });

  const localChartCache = new Map();

  const evaluateCandidateItem = (cand) => {
    metrics.candidateCount++;
    let chart;
    if (localChartCache.has(cand.timeString)) {
      metrics.chartCacheHits++;
      chart = localChartCache.get(cand.timeString);
    } else {
      metrics.chartCacheMisses++;
      chart = getCachedOrComputeChart({
        birthDate: cand.localDate,
        timeString: cand.localTime,
        lat,
        lng,
        system,
        tz: effUtcOffset,
        options: { ...options, lightweight: true }
      });
      localChartCache.set(cand.timeString, chart);
    }

    const evaluations = validatedEvents.map(evt =>
      evaluateEventForCandidate(evt, chart, cand.timeString)
    );

    const score = scoreCandidate(evaluations, validatedEvents);

    return {
      ...cand,
      chart,
      evaluations,
      score
    };
  };

  const scoredCoarse = coarseCandidates.map(evaluateCandidateItem);

  // 3. STAGE 2: Identify Top N Local Maxima Peaks
  const fineCandidateMap = new Map();
  for (const c of scoredCoarse) {
    fineCandidateMap.set(c.totalMinutes, c);
  }

  if (initialStep > 1) {
    const localPeaks = findLocalMaxima(scoredCoarse, 4, 3);
    const peakCenters = localPeaks.length > 0 ? localPeaks : [scoredCoarse.reduce((a, b) => a.score.totalScore > b.score.totalScore ? a : b)];

    // Refine each peak with 1-min grid, strictly clamped within search window
    for (const peak of peakCenters) {
      const peakMin = peak.totalMinutes;
      const fineStartMin = Math.max(windowStartMin, peakMin - 6);
      const fineEndMin = Math.min(windowEndMin, peakMin + 6);
      const fineMargin = (fineEndMin - fineStartMin) / 2;
      const fineCenterTime = formatMinutesToTimeString((fineStartMin + fineEndMin) / 2);

      const fineGrid = generateTimeCandidates({
        birthDate,
        approximateTime: fineCenterTime,
        marginMinutes: fineMargin,
        stepMinutes: 1,
        timezoneId: effTzId,
        utcOffset: effUtcOffset,
        lat,
        lon: lng
      });

      for (const fg of fineGrid) {
        if (fg.totalMinutes >= windowStartMin - 1e-4 && fg.totalMinutes <= windowEndMin + 1e-4) {
          if (!fineCandidateMap.has(fg.totalMinutes)) {
            const scoredFine = evaluateCandidateItem(fg);
            fineCandidateMap.set(fg.totalMinutes, scoredFine);
          }
        }
      }
    }
  }

  // 4. Merge and sort all evaluated candidates chronologically, strictly within [windowStart, windowEnd]
  const allScoredCandidates = Array.from(fineCandidateMap.values())
    .filter(c => c.totalMinutes >= windowStartMin - 1e-4 && c.totalMinutes <= windowEndMin + 1e-4)
    .sort((a, b) => a.totalMinutes - b.totalMinutes);

  // Find absolute highest score candidate
  let peakCandidate = allScoredCandidates[0];
  for (const c of allScoredCandidates) {
    if (c.score.totalScore > peakCandidate.score.totalScore) {
      peakCandidate = c;
    }
  }

  // 5. Chronological Stability & Multimodal Region Analysis
  const stability = analyzeCandidateStability(allScoredCandidates, peakCandidate);

  // 6. Permutation Null Hypothesis Test (200 permutations)
  const maxScore = peakCandidate.score.totalScore;
  const permutationTest = runPermutationNullTest({
    events: validatedEvents,
    candidates: allScoredCandidates,
    realPeakScore: maxScore,
    permutationsCount: 200
  });

  // 7. Edge of Search Window Detection (<= 2 minutes from boundary)
  const distFromWindowEdge = Math.min(
    Math.abs(peakCandidate.totalMinutes - windowStartMin),
    Math.abs(peakCandidate.totalMinutes - windowEndMin)
  );
  const isAtSearchBoundary = distFromWindowEdge <= 2.0;

  // 8. Strict Tie Handling & Indistinguishable Candidate Check
  const scoreTolerance = 0.5;
  const tiedCandidates = allScoredCandidates.filter(
    c => Math.abs(c.score.totalScore - maxScore) <= scoreTolerance
  );

  let centralEstimate = null;
  let minuteLevelResolutionEstablished = false;
  let resolution = stability.resolution;
  let finalVerdictEn = "";
  let finalVerdictTa = "";

  if (!permutationTest.beatsNull) {
    centralEstimate = null;
    minuteLevelResolutionEstablished = false;
    resolution = "NOT_DISCRIMINATING";
    finalVerdictEn = `Minute-level rectification was not established. Real peak evidence score (${maxScore.toFixed(1)}) is indistinguishable from random permutation noise (p = ${permutationTest.pValue}, ${permutationTest.percentile}% percentile). Rectification completed.`;
    finalVerdictTa = `நிமிட அளவிலான திருத்தம் நிறுவப்படவில்லை. நிகழ்வுத் தரவுகள் சீரற்ற நிகழ்வுகளின் மதிப்பெண்ணை விட கணிசமாக வேறுபடவில்லை (p = ${permutationTest.pValue}). பிறந்த நேர திருத்தம் முடிந்தது.`;
  } else if (isAtSearchBoundary) {
    centralEstimate = null;
    minuteLevelResolutionEstablished = false;
    resolution = "AT_SEARCH_BOUNDARY";
    finalVerdictEn = `Peak candidate lies at or near (<= 2 mins) the edge of the search window (${peakCandidate.timeString}). Please widen the search window to test if a true global peak exists beyond this boundary.`;
    finalVerdictTa = `தேர்வு செய்யப்பட்ட உச்ச நேரம் (${peakCandidate.timeString}) கால வரம்பின் விளிம்பில் (<= 2 நிமிடம்) உள்ளது. எல்லைக்கு அப்பால் ஏதேனும் உச்சம் உள்ளதா என சோதிக்க கால வரம்பை விரிவுபடுத்தவும்.`;
  } else if (stability.resolution === "NOT_DISCRIMINATING") {
    centralEstimate = null;
    minuteLevelResolutionEstablished = false;
    resolution = "NOT_DISCRIMINATING";
    finalVerdictEn = "Minute-level rectification was not established. Event evidence produces uniform scores across the search window. Rectification completed.";
    finalVerdictTa = "நிமிட அளவிலான திருத்தம் நிறுவப்படவில்லை. நிகழ்வுத் தரவுகள் கால வரம்பு முழுவதும் ஒரே சீரான மதிப்பெண்ணைத் தருகின்றன. பிறந்த நேர திருத்தம் முடிந்தது.";
  } else if (stability.resolution === "MULTI_MODAL") {
    centralEstimate = null;
    minuteLevelResolutionEstablished = false;
    resolution = "MULTI_MODAL";
    finalVerdictEn = `Multiple candidate intervals identified (${stability.stableRegions.length} distinct peaks). Event evidence does not uniquely isolate a single interval. Rectification completed.`;
    finalVerdictTa = `பல சாத்தியமான கால இடைவெளிகள் அடையாளம் காணப்பட்டுள்ளன (${stability.stableRegions.length} உச்சங்கள்). பிறந்த நேர திருத்தம் முடிந்தது.`;
  } else if (tiedCandidates.length > 3 && (tiedCandidates[tiedCandidates.length - 1].totalMinutes - tiedCandidates[0].totalMinutes) >= 4) {
    centralEstimate = null;
    minuteLevelResolutionEstablished = false;
    resolution = "CANDIDATE_INTERVAL";
    finalVerdictEn = `Rectified candidate interval established: ${tiedCandidates[0].timeString}–${tiedCandidates[tiedCandidates.length - 1].timeString} (${Math.abs(tiedCandidates[tiedCandidates.length - 1].totalMinutes - tiedCandidates[0].totalMinutes)} mins). Individual minute differentiation not definitive. Rectification completed.`;
    finalVerdictTa = `திருத்தப்பட்ட சாத்தியமான கால இடைவெளி: ${tiedCandidates[0].timeString}–${tiedCandidates[tiedCandidates.length - 1].timeString}. பிறந்த நேர திருத்தம் முடிந்தது.`;
  } else if (stability.minuteLevelResolutionEstablished) {
    centralEstimate = peakCandidate.timeString;
    minuteLevelResolutionEstablished = true;
    resolution = "MINUTE_LEVEL";
    finalVerdictEn = `Focused rectified birth time established at ${peakCandidate.timeString} (stable interval: ${stability.stableIntervalStart}–${stability.stableIntervalEnd}). Rectification completed.`;
    finalVerdictTa = `திருத்தப்பட்ட பிறந்த நேரம்: ${peakCandidate.timeString} (நிலையான வரம்பு: ${stability.stableIntervalStart}–${stability.stableIntervalEnd}). பிறந்த நேர திருத்தம் முடிந்தது.`;
  } else {
    centralEstimate = null;
    minuteLevelResolutionEstablished = false;
    resolution = stability.resolution || "INTERVAL_RESOLUTION";
    finalVerdictEn = `Rectified candidate interval established: ${stability.stableIntervalStart || tiedCandidates[0]?.timeString}–${stability.stableIntervalEnd || tiedCandidates[tiedCandidates.length - 1]?.timeString} (${stability.elapsedIntervalMinutes} mins). Individual minute differentiation not definitive. Rectification completed.`;
    finalVerdictTa = `திருத்தப்பட்ட சாத்தியமான கால இடைவெளி: ${stability.stableIntervalStart || tiedCandidates[0]?.timeString}–${stability.stableIntervalEnd || tiedCandidates[tiedCandidates.length - 1]?.timeString}. பிறந்த நேர திருத்தம் முடிந்தது.`;
  }

  // 9. Sensitivity Analysis with full parameters
  const sensitivity = runSensitivityAnalysis({
    peakCandidate,
    birthDate,
    lat,
    lng,
    system,
    tz: effUtcOffset
  });

  // 10. Out-of-Sample Cross-Validation
  const loeoValidation = runLeaveOneOutValidation({
    events: validatedEvents,
    scoredCandidates: allScoredCandidates,
    bestCandidate: peakCandidate
  });

  const holdoutValidation = runHoldoutValidation({
    events: validatedEvents,
    scoredCandidates: allScoredCandidates
  });

  // 11. Multi-Dimensional Evidence Strength Classification
  let evidenceStrength = "LOW";
  if (
    loeoValidation.overfitRisk === "HIGH" ||
    loeoValidation.trainingCandidateStability < 0.5 ||
    resolution !== "MINUTE_LEVEL" ||
    !permutationTest.beatsNull
  ) {
    evidenceStrength = "LOW";
  } else if (
    validatedEvents.length >= 4 &&
    maxScore >= 45 &&
    stability.isInformative &&
    loeoValidation.heldOutEventPassRate >= 0.75
  ) {
    evidenceStrength = "HIGH";
  } else if (
    validatedEvents.length >= 2 &&
    maxScore >= 25 &&
    stability.isInformative
  ) {
    evidenceStrength = "MEDIUM";
  }

  // Top candidates for audit log (sorted by score descending)
  const topCandidatesSummary = [...allScoredCandidates]
    .sort((a, b) => b.score.totalScore - a.score.totalScore)
    .slice(0, 10)
    .map(c => ({
      timeString: c.timeString,
      localDate: c.localDate,
      totalMinutes: c.totalMinutes,
      minuteOffset: c.minuteOffset,
      totalScore: c.score.totalScore,
      positiveScore: c.score.positiveScore,
      contradictionPenalty: c.score.contradictionPenalty,
      domainDiversityCount: c.score.domainDiversityCount
    }));

  const startStr = stability.stableIntervalStart || (tiedCandidates[0]?.timeString ?? null);
  const endStr = stability.stableIntervalEnd || (tiedCandidates[tiedCandidates.length - 1]?.timeString ?? null);
  let elapsedMinutes = stability.elapsedIntervalMinutes;
  if (startStr && endStr) {
    const sMin = parseTimeToMinutes(startStr);
    const eMin = parseTimeToMinutes(endStr);
    if (sMin !== null && eMin !== null) {
      elapsedMinutes = Number(Math.abs(eMin - sMin).toFixed(2));
    }
  }

  const candidateIntervalObj = {
    start: startStr,
    end: endStr,
    elapsedMinutes,
    candidateCount: stability.candidateCount || tiedCandidates.length
  };

  const ascLong = peakCandidate.chart?.ascendantLong ?? peakCandidate.chart?.ascendantDeg ?? peakCandidate.chart?.ascendant?.longitude;
  const d9Canonical = Number.isFinite(ascLong) ? buildCanonicalVarga("D9", peakCandidate.chart?.planets, ascLong) : null;
  const bestCandidateDetails = {
    timeString: peakCandidate.timeString,
    localDate: peakCandidate.localDate,
    totalMinutes: peakCandidate.totalMinutes,
    score: peakCandidate.score,
    evaluations: peakCandidate.evaluations,
    d1AscendantSign: peakCandidate.chart?.ascendant?.sign || peakCandidate.chart?.ascendantSign?.name || "",
    d9AscendantSign: d9Canonical?.ascendant?.sign || peakCandidate.chart?.divisionalCharts?.D9?.ascendantSign || peakCandidate.chart?.divisionalCharts?.D9?.ascendant?.sign || ""
  };

  const evidenceLineage = peakCandidate.evaluations ? peakCandidate.evaluations.flatMap(e => e.evidence || e.premises || []) : [];

  metrics.endTime = Date.now();
  metrics.durationMs = metrics.endTime - metrics.startTime;
  metrics.eventCount = validatedEvents.length;
  metrics.permutationCount = 200; // Hardcoded in permutationEngine call above
  if (typeof process !== "undefined" && process.memoryUsage) {
    metrics.peakMemoryMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  }

  const canonicalResolution = resolution === "INTERVAL_RESOLUTION" ? "CANDIDATE_INTERVAL" : resolution;

  return {
    status: "SUCCESS",
    scientificStatus: "EXPERIMENTAL_BIRTH_TIME_RECTIFICATION",
    experimentalStatus: "EXPERIMENTAL_BIRTH_TIME_RECTIFICATION",
    experimentalNotice: "Independent empirical ground-truth validation is experimental. Birth-time rectification identifies candidate consistency intervals based on traditional Jyotish event-timing rules and should not be presented as guaranteed ground truth.",
    centralEstimate,
    rectifiedTime: centralEstimate, // Backward compatibility alias
    candidateInterval: candidateIntervalObj,
    stableInterval: candidateIntervalObj, // Backward compatibility alias
    bestCandidate: bestCandidateDetails, // Backward compatibility alias
    evidenceLineage, // Backward compatibility alias
    summaryEn: finalVerdictEn, // Backward compatibility alias
    summaryTa: finalVerdictTa, // Backward compatibility alias
    resolution: canonicalResolution,
    minuteLevelResolutionEstablished,
    isMultiPeak: Boolean(stability.isMultiPeak),
    evidenceStrength,
    peakScore: maxScore,
    scoreSpread: stability.scoreSpread,
    stability,
    sensitivity,
    permutationTest,
    validation: {
      leaveOneOut: loeoValidation,
      holdout: holdoutValidation
    },
    verdict: finalVerdictEn,
    verdictTamil: finalVerdictTa,
    topCandidates: topCandidatesSummary,
    allScoredCandidatesCount: allScoredCandidates.length,
    evaluatedEventsCount: validatedEvents.length,
    events: validatedEvents,
    peakChart: peakCandidate.chart,
    peakCandidateDetails: bestCandidateDetails,
    metrics
  };
}
