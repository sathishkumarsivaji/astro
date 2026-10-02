/**
 * ASTROVERSE — Out-of-Sample Cross-Validation Engine
 *
 * Implements strict out-of-sample statistical validation:
 * 1. Leave-One-Event-Out (LOEO) Cross-Validation:
 *    - For each event i, removes event i, selects optimal candidate C_i from remaining N-1 events.
 *    - Freezes C_i and tests ONLY held-out event i.
 *    - Records heldOutEvidenceScore, heldOutPass, and candidateTimeError.
 * 2. Holdout Cross-Validation (70% Train / 30% Test):
 *    - Splits events BEFORE candidate selection.
 *    - Optimizes on Train events -> Freezes training winner -> Evaluates on unseen Test events.
 *    - Computes outOfSampleEvidenceScore.
 *
 * ZERO data leakage between train and test splits.
 */

import { evaluateEventForCandidate } from "../evaluators/index.js";
import { scoreCandidate } from "./scoringEngine.js";

/**
 * Runs Leave-One-Event-Out (LOEO) Cross-Validation
 */
export function runLeaveOneOutValidation({
  events,
  scoredCandidates,
  bestCandidate
}) {
  if (!Array.isArray(events) || events.length < 3 || !bestCandidate) {
    return {
      validationType: "LEAVE_ONE_EVENT_OUT",
      applicable: false,
      totalRounds: 0,
      heldOutEventPassRate: 1.0,
      trainingCandidateStability: 1.0,
      meanHeldOutScore: 0,
      overfitRisk: "LOW",
      rounds: [],
      note: "Insufficient event count for multi-round cross-validation (< 3 verified events)."
    };
  }

  const rounds = [];
  let passedHeldOutCount = 0;
  let stableWinnerCount = 0;
  let totalHeldOutScore = 0;

  for (let i = 0; i < events.length; i++) {
    const heldOutEvent = events[i];
    const trainingEvents = events.filter((_, idx) => idx !== i);

    // 1. Select optimal candidate using ONLY trainingEvents
    let bestTrainCandidate = null;
    let maxTrainScore = -Infinity;

    for (const cand of scoredCandidates) {
      const trainEvals = cand.evaluations.filter(e => e.eventId !== heldOutEvent.id);
      const trainScoreObj = scoreCandidate(trainEvals, trainingEvents);

      if (trainScoreObj.totalScore > maxTrainScore) {
        maxTrainScore = trainScoreObj.totalScore;
        bestTrainCandidate = cand;
      }
    }

    if (!bestTrainCandidate) {
      bestTrainCandidate = bestCandidate;
    }

    // 2. Freeze bestTrainCandidate and evaluate ONLY heldOutEvent on it
    const heldOutEval = evaluateEventForCandidate(
      heldOutEvent,
      bestTrainCandidate.chart,
      bestTrainCandidate.timeString
    );

    const candidateTimeError = Math.abs(bestTrainCandidate.totalMinutes - bestCandidate.totalMinutes);
    const netHeldOutScore = (heldOutEval.positiveScore || 0) - (heldOutEval.contradictionScore || 0);
    const passedHeldOut = (candidateTimeError <= 10.0) && (heldOutEval.positiveScore >= 12) && !heldOutEval.isContradiction;
    const isWinnerStable = candidateTimeError <= 2.0;

    if (passedHeldOut) passedHeldOutCount++;
    if (isWinnerStable) stableWinnerCount++;
    totalHeldOutScore += Math.max(0, netHeldOutScore);

    rounds.push({
      round: i + 1,
      heldOutEventId: heldOutEvent.id,
      heldOutEventType: heldOutEvent.type,
      selectedTrainingTime: bestTrainCandidate.timeString,
      heldOutPositiveScore: heldOutEval.positiveScore,
      heldOutContradictionScore: heldOutEval.contradictionScore,
      netHeldOutScore,
      passedHeldOut,
      candidateTimeErrorMinutes: Number(candidateTimeError.toFixed(2)),
      winnerMatchesGlobal: isWinnerStable
    });
  }

  const heldOutEventPassRate = Number((passedHeldOutCount / events.length).toFixed(2));
  const trainingCandidateStability = Number((stableWinnerCount / events.length).toFixed(2));
  const meanHeldOutScore = Number((totalHeldOutScore / events.length).toFixed(2));

  let overfitRisk = "LOW";
  if (heldOutEventPassRate < 0.5 || trainingCandidateStability < 0.5) {
    overfitRisk = "HIGH";
  } else if (heldOutEventPassRate < 0.75 || trainingCandidateStability < 0.75) {
    overfitRisk = "MEDIUM";
  }

  return {
    validationType: "LEAVE_ONE_EVENT_OUT",
    applicable: true,
    totalRounds: events.length,
    passedHeldOutCount,
    heldOutEventPassRate,
    trainingCandidateStability,
    meanHeldOutScore,
    overfitRisk,
    rounds
  };
}

/**
 * Runs Holdout (70% Train / 30% Test) Cross-Validation
 */
export function runHoldoutValidation({
  events,
  scoredCandidates
}) {
  if (!Array.isArray(events) || events.length < 5 || !Array.isArray(scoredCandidates) || scoredCandidates.length === 0) {
    return {
      validationType: "HOLDOUT_70_30",
      applicable: false,
      trainEventsCount: 0,
      testEventsCount: 0,
      trainScore: null,
      outOfSampleEvidenceScore: null,
      testPassRate: null,
      generalizesWell: false,
      note: "Holdout validation requires at least 5 verified lifetime events."
    };
  }

  // 1. Split events BEFORE candidate selection
  const splitIdx = Math.max(3, Math.floor(events.length * 0.7));
  const trainEvents = events.slice(0, splitIdx);
  const testEvents = events.slice(splitIdx);

  // 2. Select optimal candidate using ONLY trainEvents
  let bestTrainCandidate = null;
  let maxTrainScore = -Infinity;

  for (const cand of scoredCandidates) {
    const trainEvals = cand.evaluations.filter(e => trainEvents.some(te => te.id === e.eventId));
    const trainScoreObj = scoreCandidate(trainEvals, trainEvents);

    if (trainScoreObj.totalScore > maxTrainScore) {
      maxTrainScore = trainScoreObj.totalScore;
      bestTrainCandidate = cand;
    }
  }

  if (!bestTrainCandidate) {
    bestTrainCandidate = scoredCandidates[0];
  }

  // 3. Freeze bestTrainCandidate and independently evaluate testEvents
  const testEvaluations = testEvents.map(te =>
    evaluateEventForCandidate(te, bestTrainCandidate.chart, bestTrainCandidate.timeString)
  );

  const testScoreObj = scoreCandidate(testEvaluations, testEvents);
  const outOfSampleEvidenceScore = testScoreObj.totalScore;
  const passedTestEvents = testEvaluations.filter(e => (e.positiveScore >= 12) && !e.isContradiction).length;
  const testPassRate = Number((passedTestEvents / testEvents.length).toFixed(2));

  const generalizesWell = testPassRate >= 0.6 && outOfSampleEvidenceScore >= (maxTrainScore * 0.6);

  return {
    validationType: "HOLDOUT_70_30",
    applicable: true,
    trainEventsCount: trainEvents.length,
    testEventsCount: testEvents.length,
    selectedTrainingTime: bestTrainCandidate.timeString,
    trainScore: Number(maxTrainScore.toFixed(2)),
    outOfSampleEvidenceScore: Number(outOfSampleEvidenceScore.toFixed(2)),
    testPassRate,
    generalizesWell
  };
}
