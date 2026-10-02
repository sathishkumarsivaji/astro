/**
 * ASTROVERSE — Contradiction Engine for Birth-Time Rectification
 *
 * Distinguishes unsupporting evidence from active contradictions:
 * - Unsupporting evidence: Neutral absence of a specific planetary configuration
 * - Active contradiction: Operating in an intensely adverse Dasha / Dusthana configuration with zero supportive triggers
 */

export function detectCandidateContradictions(eventEvaluations, candidateTime) {
  const contradictions = [];

  for (const evalResult of eventEvaluations) {
    if (evalResult.isContradiction || evalResult.contradictionScore > 15) {
      contradictions.push({
        eventId: evalResult.eventId,
        category: evalResult.category,
        severity: evalResult.contradictionScore >= 25 ? "HIGH" : "MEDIUM",
        candidateTime,
        description: `Discrepancy in ${evalResult.category} timing: ${evalResult.counterIndicators.join("; ")}`,
        counterIndicators: evalResult.counterIndicators
      });
    }
  }

  return contradictions;
}
