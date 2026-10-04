/**
 * Checks if two evidence nodes belong to the same independence group.
 * @param {Object} nodeA 
 * @param {Object} nodeB 
 * @returns {boolean} True if they share a group ID.
 */
export function isDoubleCount(nodeA, nodeB) {
  const gA = nodeA.groupId || nodeA.independenceGroupId;
  const gB = nodeB.groupId || nodeB.independenceGroupId;
  return Boolean(gA && gB && gA === gB);
}

/**
 * Calculates the adjusted strength of evidence by penalizing correlated indicators
 * and strictly normalizing the final output to 0.0 <= adjustedStrength <= 1.0.
 *
 * @param {Array} evidenceNodes 
 * @param {Array} independenceGroups 
 * @returns {Object} Metrics regarding evidence independence and strength.
 */
export function calculateIndependentEvidence(evidenceNodes = [], independenceGroups = []) {
  const groupMap = new Map();
  const groupDefMap = new Map();

  independenceGroups.forEach(g => {
    if (g && g.groupId) groupDefMap.set(g.groupId, g);
  });

  let totalRaw = 0;

  evidenceNodes.forEach(node => {
    const s = typeof node.value === 'number' ? node.value : (typeof node.strength === 'number' ? node.strength : 1);
    totalRaw += s;

    const gId = node.groupId || node.independenceGroupId || 'ungrouped';
    if (!groupMap.has(gId)) {
      groupMap.set(gId, []);
    }
    groupMap.get(gId).push({ ...node, strength: s });
  });

  const independentCount = groupMap.size;
  let rawGroupSum = 0;

  // Calculate adjusted strength by diminishing returns for multiple nodes in same group
  groupMap.forEach((nodes, groupId) => {
    nodes.sort((a, b) => b.strength - a.strength);

    const groupDef = groupDefMap.get(groupId);
    const classWeights = {
      INDEPENDENT: 1.0,
      CONDITIONALLY_INDEPENDENT: 0.85,
      PARTIALLY_DEPENDENT: 0.50,
      DEPENDENT: 0.20
    };
    const indepScore = typeof groupDef?.independenceScore === 'number'
      ? groupDef.independenceScore
      : (groupDef?.dependencyClass ? (classWeights[groupDef.dependencyClass] ?? 1.0) : 1.0);

    let groupStrength = 0;
    nodes.forEach((node, index) => {
      // Primary node gets full weight, subsequent nodes get diminished weight
      groupStrength += node.strength * Math.pow(0.5, index);
    });

    rawGroupSum += groupStrength * indepScore;
  });

  const correlationPenalty = Math.max(0, totalRaw - rawGroupSum);

  // Normalize final strength strictly to [0.0, 1.0] via asymptotic saturation
  let adjustedStrength = 0;
  if (independentCount > 0 && rawGroupSum > 0) {
    adjustedStrength = 1.0 - Math.exp(-rawGroupSum / 2.0);
  }
  adjustedStrength = Number(Math.max(0.0, Math.min(1.0, adjustedStrength)).toFixed(3));

  return {
    independentCount,
    totalRaw,
    correlationPenalty,
    adjustedStrength
  };
}
