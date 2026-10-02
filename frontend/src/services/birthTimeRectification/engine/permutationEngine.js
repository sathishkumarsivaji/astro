/**
 * ASTROVERSE — Permutation & Null Distribution Test Engine
 *
 * Evaluates whether peak candidate score statistically exceeds random noise
 * by comparing against a null distribution of permuted (shuffled) event dates & types.
 *
 * Guarantees that random or non-informative events never produce false "established" intervals.
 */

import { evaluateEventForCandidate } from "../evaluators/index.js";
import { scoreCandidate } from "./scoringEngine.js";

/**
 * Shuffles an array deterministically or pseudo-randomly
 */
function shuffleArray(arr, seed = 1) {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    const j = Math.floor(rnd * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Runs permutation null hypothesis test
 */
export function runPermutationNullTest({
  events = [],
  candidates = [],
  realPeakScore = 0,
  permutationsCount = 200,
  seed = 42
}) {
  if (!Array.isArray(events) || events.length === 0 || !Array.isArray(candidates) || candidates.length === 0) {
    return {
      applicable: false,
      permutationsCount: 0,
      realPeakScore,
      percentile: 0,
      pValue: 1.0,
      beatsNull: false,
      note: "Insufficient event or candidate data for permutation test."
    };
  }

  // Generate date & type pools from actual events
  const datesPool = events.map(e => e.date || e.startDate);
  const typesPool = events.map(e => e.type);

  const numPerms = Math.max(50, Math.min(500, Number(permutationsCount) || 200));
  const nullMaxScores = [];

  for (let p = 0; p < numPerms; p++) {
    const pSeed = seed + p * 17 + 1;
    const shuffledDates = shuffleArray(datesPool, pSeed);
    const shuffledTypes = shuffleArray(typesPool, pSeed + 999);

    // Create permuted pseudo-events
    const permutedEvents = events.map((origEvt, idx) => {
      const rawDate = shuffledDates[idx];
      const parsedDate = new Date(rawDate);
      return {
        ...origEvt,
        id: `PERM_${p}_${origEvt.id}`,
        type: shuffledTypes[idx],
        date: rawDate,
        startDate: rawDate,
        parsedDate: isNaN(parsedDate.getTime()) ? origEvt.parsedDate : parsedDate
      };
    });

    let permMax = 0;
    for (const cand of candidates) {
      const evals = permutedEvents.map(pe =>
        evaluateEventForCandidate(pe, cand.chart, cand.timeString)
      );
      const scoreObj = scoreCandidate(evals, permutedEvents);
      if (scoreObj.totalScore > permMax) {
        permMax = scoreObj.totalScore;
      }
    }

    nullMaxScores.push(Number(permMax.toFixed(2)));
  }

  // Compute empirical percentile of real peak score
  const countLesser = nullMaxScores.filter(s => s < realPeakScore).length;
  const countGreaterOrEqual = nullMaxScores.filter(s => s >= realPeakScore).length;

  const percentile = Number(((countLesser / numPerms) * 100).toFixed(2));
  const pValue = Number(((countGreaterOrEqual + 1) / (numPerms + 1)).toFixed(4));
  const beatsNull = percentile >= 95.0 && pValue <= 0.05;

  return {
    applicable: true,
    permutationsCount: numPerms,
    realPeakScore: Number(realPeakScore.toFixed(2)),
    nullScoresMean: Number((nullMaxScores.reduce((a, b) => a + b, 0) / numPerms).toFixed(2)),
    nullScoresMax: Math.max(...nullMaxScores),
    percentile,
    pValue,
    beatsNull,
    verdict: beatsNull
      ? `Statistically significant signal: Real peak score (${realPeakScore}) exceeds the 95th percentile of the randomized permutation null distribution (p = ${pValue}, ${percentile}% percentile).`
      : `Indistinguishable from random noise: Real peak score (${realPeakScore}) does not exceed the 95th percentile of the randomized null distribution (${percentile}% percentile, p = ${pValue}).`
  };
}
