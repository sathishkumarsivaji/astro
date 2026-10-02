/**
 * ASTROVERSE — Chronological Stability & Multimodal Interval Analyzer
 *
 * Implements rigorous chronological run-length stability analysis:
 * - Sorts candidates strictly by totalMinutes ascending (NEVER score-sorted).
 * - Identifies distinct contiguous chronological high-scoring runs (stableRegions).
 * - Correctly computes elapsedIntervalMinutes = Math.abs(end - start) and candidateCount separately.
 * - Distinguishes stable discriminating peaks from flat non-discriminating plateaus.
 * - Detects multimodal/multi-peak distributions and prevents arbitrary single-minute forced claims.
 */

export function analyzeCandidateStability(scoredCandidates, peakCandidate, scoreTolerance = 0.5) {
  if (!Array.isArray(scoredCandidates) || scoredCandidates.length === 0 || !peakCandidate) {
    return {
      isStable: false,
      isInformative: false,
      stabilityLevel: "LOW",
      resolution: "INSUFFICIENT_DATA",
      minuteLevelResolutionEstablished: false,
      stableRegions: [],
      stableIntervalStart: null,
      stableIntervalEnd: null,
      elapsedIntervalMinutes: 0,
      candidateCount: 0,
      scoreSpread: 0,
      neighborConsistency: 0,
      explanation: "No candidate evaluation data available."
    };
  }

  // 1. STRICT REQUIREMENT: Sort candidates by totalMinutes ASCENDING
  const chronoSorted = [...scoredCandidates].sort((a, b) => a.totalMinutes - b.totalMinutes);

  const scores = chronoSorted.map(c => c.score.totalScore);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const scoreSpread = Number((maxScore - minScore).toFixed(2));

  // Compute standard deviation of scores
  const meanScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - meanScore, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // 2. Check for Flat / Non-Discriminating Score Distribution (P0-4 & P0-23)
  if (scoreSpread <= 2.5 || stdDev < 0.8 || maxScore === minScore) {
    return {
      isStable: false,
      isInformative: false,
      stabilityLevel: "NON_DISCRIMINATING",
      resolution: "NOT_DISCRIMINATING",
      minuteLevelResolutionEstablished: false,
      stableRegions: [],
      stableIntervalStart: null,
      stableIntervalEnd: null,
      elapsedIntervalMinutes: Number(Math.abs(chronoSorted[chronoSorted.length - 1].totalMinutes - chronoSorted[0].totalMinutes).toFixed(2)),
      candidateCount: chronoSorted.length,
      scoreSpread,
      neighborConsistency: 1.0,
      explanation: "Stable but non-discriminating: Event evidence produces approximately uniform scores across the search window. Minute-level resolution was not established."
    };
  }

  // 3. Find Contiguous Chronological High-Scoring Runs (Threshold = maxScore * 0.95)
  const threshold = Math.max(10, maxScore * 0.95);
  const foundRuns = [];
  let currentRun = [];

  for (let i = 0; i < chronoSorted.length; i++) {
    const cand = chronoSorted[i];
    const isQualifying = cand.score.totalScore >= threshold;

    if (isQualifying) {
      if (currentRun.length === 0) {
        currentRun.push(cand);
      } else {
        const prev = currentRun[currentRun.length - 1];
        const step = cand.totalMinutes - prev.totalMinutes;
        // Check if contiguous (allowing slight step variations up to 2.5 mins)
        if (step <= 2.5) {
          currentRun.push(cand);
        } else {
          if (currentRun.length > 0) {
            foundRuns.push(buildRegion(currentRun));
            currentRun = [cand];
          }
        }
      }
    } else {
      if (currentRun.length > 0) {
        foundRuns.push(buildRegion(currentRun));
        currentRun = [];
      }
    }
  }

  if (currentRun.length > 0) {
    foundRuns.push(buildRegion(currentRun));
  }

  function buildRegion(run) {
    const start = run[0];
    const end = run[run.length - 1];
    let peakInRun = run[0];
    for (const c of run) {
      if (c.score.totalScore > peakInRun.score.totalScore) {
        peakInRun = c;
      }
    }
    const elapsed = Math.abs(end.totalMinutes - start.totalMinutes);
    return {
      start: start.timeString,
      end: end.timeString,
      startMinutes: start.totalMinutes,
      endMinutes: end.totalMinutes,
      candidateCount: run.length,
      elapsedMinutes: Number(elapsed.toFixed(2)),
      peakTime: peakInRun.timeString,
      peakScore: peakInRun.score.totalScore
    };
  }

  // Filter for valid stable regions (requiring candidateCount >= 2)
  const stableRegions = foundRuns.filter(r => r.candidateCount >= 2);

  // 4. Multimodal / Multi-Peak Analysis
  if (stableRegions.length >= 2) {
    // Sort regions by peakScore descending, then candidateCount descending
    stableRegions.sort((a, b) => b.peakScore - a.peakScore || b.candidateCount - a.candidateCount);
    const topRegion = stableRegions[0];

    return {
      isStable: false,
      isInformative: true,
      isMultiPeak: true,
      stabilityLevel: "MULTI_MODAL",
      resolution: "MULTI_MODAL",
      minuteLevelResolutionEstablished: false,
      stableRegions,
      stableIntervalStart: null,
      stableIntervalEnd: null,
      elapsedIntervalMinutes: topRegion.elapsedMinutes,
      candidateCount: topRegion.candidateCount,
      scoreSpread,
      neighborConsistency: 0.75,
      explanation: `Multiple distinct high-scoring candidate intervals identified (${stableRegions.length} separate regions). Evidence remains multimodal.`
    };
  }

  if (stableRegions.length === 1) {
    const region = stableRegions[0];
    const isMinuteLevel = region.elapsedMinutes <= 2.0 && scoreSpread >= 5.0 && region.candidateCount >= 2;
    const isHighStability = region.candidateCount >= 3 && region.elapsedMinutes <= 6.0;

    return {
      isStable: true,
      isInformative: true,
      isMultiPeak: false,
      stabilityLevel: isHighStability ? "HIGH" : "MEDIUM",
      resolution: isMinuteLevel ? "MINUTE_LEVEL" : "INTERVAL_RESOLUTION",
      minuteLevelResolutionEstablished: isMinuteLevel,
      stableRegions,
      stableIntervalStart: region.start,
      stableIntervalEnd: region.end,
      elapsedIntervalMinutes: region.elapsedMinutes,
      candidateCount: region.candidateCount,
      scoreSpread,
      neighborConsistency: 0.90,
      explanation: isMinuteLevel
        ? `Focused candidate peak identified at ${region.peakTime} (stable interval: ${region.start}–${region.end}).`
        : `Stable candidate interval established across ${region.start}–${region.end} (${region.elapsedMinutes} mins). Individual minute differentiation not definitive.`
    };
  }

  // Fallback for isolated single spike without neighbor support
  return {
    isStable: false,
    isInformative: true,
    isMultiPeak: false,
    stabilityLevel: "ISOLATED_SPIKE",
    resolution: "UNRESOLVED",
    minuteLevelResolutionEstablished: false,
    stableRegions: [],
    stableIntervalStart: null,
    stableIntervalEnd: null,
    elapsedIntervalMinutes: 0,
    candidateCount: 1,
    scoreSpread,
    neighborConsistency: 0.4,
    explanation: "Isolated score spike without contiguous neighbor validation."
  };
}
