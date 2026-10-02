/**
 * ASTROVERSE — Transparent Scoring Engine for Birth-Time Rectification
 *
 * Implements deterministic scoring without magic numbers or default fallbacks:
 * Score = Positive Evidence (capped groups) - Contradiction Penalty - Overfit Penalty + Domain Diversity Bonus
 */

import { getEventWeight } from "../types.js";

export function scoreCandidate(eventEvaluations, rawEvents) {
  if (!Array.isArray(eventEvaluations) || eventEvaluations.length === 0) {
    return {
      totalScore: 0,
      positiveScore: 0,
      contradictionPenalty: 0,
      overfitPenalty: 0,
      domainDiversityBonus: 0,
      evaluatedEventsCount: 0,
      domainDiversityCount: 0,
      status: "INSUFFICIENT_DATA"
    };
  }

  let totalWeightedPositive = 0;
  let totalWeightedContradiction = 0;
  let totalWeight = 0;
  const activatedDomains = new Set();
  const ruleActivationFrequency = new Map();

  for (let i = 0; i < eventEvaluations.length; i++) {
    const evalRes = eventEvaluations[i];
    const rawEvt = rawEvents.find(e => e.id === evalRes.eventId) || rawEvents[i];
    const weight = rawEvt ? getEventWeight(rawEvt) : 1.0;

    totalWeight += weight;
    totalWeightedPositive += (evalRes.positiveScore || 0) * weight;
    totalWeightedContradiction += (evalRes.contradictionScore || 0) * weight;

    if (evalRes.positiveScore > 10) {
      activatedDomains.add(evalRes.category);
    }

    if (Array.isArray(evalRes.ruleIds)) {
      for (const rId of evalRes.ruleIds) {
        ruleActivationFrequency.set(rId, (ruleActivationFrequency.get(rId) || 0) + 1);
      }
    }
  }

  if (totalWeight <= 0) totalWeight = 1.0;

  const basePositive = totalWeightedPositive / totalWeight;
  const baseContradiction = (totalWeightedContradiction / totalWeight) * 0.5;

  // Domain diversity bonus: rewarding candidate consistent across 3+ distinct life domains
  const domainDiversityCount = activatedDomains.size;
  let domainDiversityBonus = 0;
  if (domainDiversityCount >= 4) domainDiversityBonus = 15;
  else if (domainDiversityCount === 3) domainDiversityBonus = 10;
  else if (domainDiversityCount === 2) domainDiversityBonus = 5;

  // Overfit penalty: penalizing excessive reliance on a single repeating sub-rule
  let overfitPenalty = 0;
  ruleActivationFrequency.forEach((count) => {
    if (count > 5) overfitPenalty += (count - 5) * 2;
  });
  overfitPenalty = Math.min(20, overfitPenalty);

  const rawTotal = basePositive - baseContradiction - overfitPenalty + domainDiversityBonus;
  const clampedScore = Math.max(0, Math.min(100, Number(rawTotal.toFixed(2))));

  return {
    totalScore: clampedScore,
    positiveScore: Number(basePositive.toFixed(2)),
    contradictionPenalty: Number(baseContradiction.toFixed(2)),
    overfitPenalty: Number(overfitPenalty.toFixed(2)),
    domainDiversityBonus,
    evaluatedEventsCount: eventEvaluations.length,
    domainDiversityCount,
    status: "EVALUATED"
  };
}
