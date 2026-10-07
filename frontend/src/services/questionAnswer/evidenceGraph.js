/**
 * ASTROVERSE — Canonical Evidence Graph
 * =======================================
 * Manages the structured directed acyclic graph linking:
 * Question -> Intent -> Chart Facts -> Rules -> Counter-Evidence -> Timing Windows -> Resolution -> Answer.
 *
 * Implements Section 5 of the Precision Q&A Engine Mandate.
 */

export const EVIDENCE_CATEGORIES = Object.freeze({
  CHART_FACT: "CHART_FACT",
  HOUSE_FACT: "HOUSE_FACT",
  LORD_FACT: "LORD_FACT",
  PLANET_FACT: "PLANET_FACT",
  VARGA_FACT: "VARGA_FACT",
  DASHA_FACT: "DASHA_FACT",
  TRANSIT_FACT: "TRANSIT_FACT",
  KP_FACT: "KP_FACT",
  JAIMINI_FACT: "JAIMINI_FACT",
  RULE: "RULE",
  COUNTER_EVIDENCE: "COUNTER_EVIDENCE",
  TIMING_WINDOW: "TIMING_WINDOW",
  RESOLUTION: "RESOLUTION",
  ANSWER: "ANSWER"
});

export class EvidenceGraph {
  constructor(questionId = "DEFAULT") {
    this.questionId = questionId;
    this.nodes = new Map();
    this.edges = [];
  }

  /**
   * Adds or updates an evidence node in the graph.
   *
   * @param {Object} node
   * @param {string} node.id - Canonical ID (e.g., HOUSE_FACT_H7)
   * @param {string} node.category - From EVIDENCE_CATEGORIES
   * @param {string} node.label - Human-readable descriptor
   * @param {*} [node.value=null] - Computed astrological value
   * @param {Object} [node.metadata={}] - Additional details
   * @param {string} [node.supportType="NEUTRAL"] - "SUPPORT" | "COUNTER" | "NEUTRAL"
   * @returns {Object} Added node
   */
  addNode({ id, category, label, value = null, metadata = {}, supportType = "NEUTRAL" }) {
    if (!id || typeof id !== "string") {
      throw new Error("Evidence node requires a valid string ID.");
    }
    const node = {
      id,
      category: category || EVIDENCE_CATEGORIES.CHART_FACT,
      label: label || id,
      value,
      metadata,
      supportType, // "SUPPORT" | "COUNTER" | "NEUTRAL"
      timestamp: Date.now()
    };
    this.nodes.set(id, node);
    return node;
  }

  /**
   * Connects two evidence nodes with a directed edge.
   *
   * @param {string} fromId - Source node ID
   * @param {string} toId - Target node ID
   * @param {string} [relation="LEADS_TO"] - Relationship type
   */
  addEdge(fromId, toId, relation = "LEADS_TO") {
    if (!this.nodes.has(fromId)) {
      this.addNode({ id: fromId, category: EVIDENCE_CATEGORIES.CHART_FACT, label: fromId });
    }
    if (!this.nodes.has(toId)) {
      this.addNode({ id: toId, category: EVIDENCE_CATEGORIES.CHART_FACT, label: toId });
    }
    this.edges.push({ from: fromId, to: toId, relation });
  }

  /**
   * Retrieves a node by ID.
   */
  getNode(id) {
    return this.nodes.get(id) || null;
  }

  /**
   * Retrieves all nodes belonging to a category.
   */
  getNodesByCategory(category) {
    const res = [];
    for (const node of this.nodes.values()) {
      if (node.category === category) res.push(node);
    }
    return res;
  }

  /**
   * Retrieves supporting evidence nodes.
   */
  getSupportingNodes() {
    const res = [];
    for (const node of this.nodes.values()) {
      if (node.supportType === "SUPPORT") res.push(node);
    }
    return res;
  }

  /**
   * Retrieves counter-evidence / limiting nodes.
   */
  getCounterNodes() {
    const res = [];
    for (const node of this.nodes.values()) {
      if (node.supportType === "COUNTER") res.push(node);
    }
    return res;
  }

  /**
   * Returns an array of all node IDs.
   */
  getAllEvidenceIds() {
    return Array.from(this.nodes.keys());
  }

  /**
   * Exports serializable ledger representation.
   */
  exportLedger() {
    return {
      questionId: this.questionId,
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges]
    };
  }
}

/**
 * Standardized Canonical ID Generators
 */
export function buildChartFactId(factor) {
  return `CHART_FACT_${String(factor).toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

export function buildHouseFactId(houseNum) {
  return `HOUSE_FACT_H${houseNum}`;
}

export function buildLordFactId(houseNum, lordPlanet) {
  return `LORD_FACT_H${houseNum}_${String(lordPlanet || "UNKNOWN").toUpperCase()}`;
}

export function buildPlanetFactId(planet, prop = "POS") {
  return `PLANET_FACT_${String(planet).toUpperCase()}_${String(prop).toUpperCase()}`;
}

export function buildVargaFactId(varga, factor) {
  return `VARGA_FACT_${String(varga).toUpperCase()}_${String(factor).toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

export function buildDashaFactId(md, ad) {
  return `DASHA_FACT_${String(md).toUpperCase()}_${String(ad || "ALL").toUpperCase()}`;
}

export function buildTransitFactId(planet, sign) {
  return `TRANSIT_FACT_${String(planet).toUpperCase()}_${String(sign || "SIGN").toUpperCase()}`;
}

export function buildKpFactId(cuspNum, factor = "SUBLORD") {
  return `KP_FACT_CUSP${cuspNum}_${String(factor).toUpperCase()}`;
}

export function buildJaiminiFactId(karaka, planet) {
  return `JAIMINI_FACT_${String(karaka).toUpperCase()}_${String(planet || "PL").toUpperCase()}`;
}

export function buildRuleId(domain, code) {
  return `RULE_${String(domain).toUpperCase()}_${String(code).toUpperCase()}`;
}

export function buildCounterEvidenceId(code) {
  return `COUNTER_EVIDENCE_${String(code).toUpperCase()}`;
}

export function buildTimingWindowId(start, end) {
  return `TIMING_WINDOW_${String(start).replace(/[^0-9]/g, "")}_${String(end).replace(/[^0-9]/g, "")}`;
}

export function buildResolutionId(res) {
  return `RESOLUTION_${String(res).toUpperCase()}`;
}

export function buildAnswerId(id) {
  return `ANSWER_${String(id).toUpperCase()}`;
}
