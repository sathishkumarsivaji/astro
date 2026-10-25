/**
 * SKR ASTRO — Canonical Evidence Graph
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

function formatProper(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Translates raw internal evidence token IDs into human-readable astrological prose.
 * Protects customer-facing output from ever leaking raw IDs like DASHA_FACT_MARS_ALL.
 */
export function humanizeEvidenceToken(tokenId, isTamil = false) {
  if (!tokenId || typeof tokenId !== "string") return "";
  const token = tokenId.trim();

  // If it's already a full human-readable sentence or doesn't look like an internal token ID
  if (!/^[A-Z0-9_]{3,}$/.test(token)) {
    return token;
  }

  // 1. DASHA_FACT tokens
  const dashaMatch = token.match(/^DASHA_FACT_([A-Z]+)(?:_([A-Z]+))?$/);
  if (dashaMatch) {
    const md = formatProper(dashaMatch[1]);
    const ad = dashaMatch[2] ? formatProper(dashaMatch[2]) : null;
    if (!ad || ad.toUpperCase() === "ALL") {
      return isTamil
        ? `${md} மகாதசை கால இயக்கம்`
        : `${md} Mahadasha period activation`;
    }
    return isTamil
      ? `${md} மகாதசை – ${ad} அந்தர்தசை காலக்கட்டம்`
      : `${md} Mahadasha – ${ad} Antardasha sub-period`;
  }

  // 2. LORD_FACT tokens
  const lordMatch = token.match(/^LORD_FACT_(?:H|L)(\d+)(?:_([A-Z]+))?$/);
  if (lordMatch) {
    const houseNum = lordMatch[1];
    const planet = lordMatch[2] ? formatProper(lordMatch[2]) : null;
    if (planet) {
      return isTamil
        ? `${houseNum}-ம் பாவக அதிபதியான ${planet} பகவான்`
        : `${houseNum}th House Lord (${planet})`;
    }
    return isTamil
      ? `${houseNum}-ம் பாவக அதிபதி தொடர்பு`
      : `${houseNum}th House Lordship`;
  }

  // 3. HOUSE_FACT tokens
  const houseMatch = token.match(/^HOUSE_FACT_H(\d+)$/);
  if (houseMatch) {
    const h = houseMatch[1];
    return isTamil
      ? `${h}-ம் பாவக ஜோதிடக் குறியீடுகள்`
      : `${h}th House astrological significations`;
  }

  // 4. PLANET_FACT tokens
  const planetMatch = token.match(/^PLANET_FACT_([A-Z]+)(?:_([A-Z]+))?$/);
  if (planetMatch) {
    const planet = formatProper(planetMatch[1]);
    return isTamil
      ? `${planet} கிரக நிலை மற்றும் காரகத்துவம்`
      : `${planet} planetary placement & significations`;
  }

  // 5. TRANSIT_FACT tokens
  const transitMatch = token.match(/^TRANSIT_FACT_([A-Z]+)(?:_([A-Z]+))?$/);
  if (transitMatch) {
    const planet = formatProper(transitMatch[1]);
    const sign = transitMatch[2] ? formatProper(transitMatch[2]) : null;
    return isTamil
      ? `கோச்சார ${planet}${sign && sign !== "Sign" ? ` (${sign} ராசி)` : ""} சஞ்சாரம்`
      : `Transit ${planet}${sign && sign !== "Sign" ? ` in ${sign}` : ""}`;
  }

  // 6. VARGA_FACT tokens
  if (token.startsWith("VARGA_FACT_")) {
    const vargaMap = {
      VARGA_FACT_D16_VEHICLE_CONFIRMED: isTamil ? "D16 சோடசாம்ச வர்க்க வாகன காரக உறுதிப்பாடு" : "D16 Shodashamsha confirmation for vehicle acquisition",
      VARGA_FACT_D4_PROPERTY_CONFIRMED: isTamil ? "D4 சதுர்த்தாம்ச வர்க்க சொத்து காரக உறுதிப்பாடு" : "D4 Chaturthamsha confirmation for real estate & fixed assets",
      VARGA_FACT_D9_7TH_CONFIRMED: isTamil ? "D9 நவாம்ச 7-ம் பாவக சுப தொடர்பு" : "D9 Navamsha confirmation for partnership harmony",
      VARGA_FACT_D10_10TH_CONFIRMED: isTamil ? "D10 தசாம்ச தொழில் ஆதிபத்திய உறுதிப்பாடு" : "D10 Dashamsha confirmation for professional enterprise",
      VARGA_FACT_D7_PROGENY_CONFIRMED: isTamil ? "D7 சப்தாம்ச புத்திர பாவ அமைவு" : "D7 Saptamsha progeny factor alignment",
      VARGA_FACT_D2_WEALTH_CONFIRMED: isTamil ? "D2 ஹோரா தன பாவ அமைவு" : "D2 Hora wealth factor alignment"
    };
    if (vargaMap[token]) return vargaMap[token];
    return isTamil ? "வர்க்கச் சக்கர உறுதிப்பாடு" : "Divisional varga confirmation";
  }

  // 7. TASK tokens
  if (token.startsWith("TASK_")) {
    const taskMap = {
      TASK_CHILDREN_COUNT: isTamil ? "குழந்தைகள் எண்ணிக்கை குறித்த பாரம்பரிய ஆய்வு" : "Children count inquiry (qualitative assessment)",
      TASK_CHILDREN_OUTLOOK: isTamil ? "புத்திர பாவ பாரம்பரிய வழிகாட்டல்" : "Children domain traditional guidance",
      TASK_HOME_CONSTRUCTION_TIMING: isTamil ? "வீடு கட்டுதல் காலக்கணிப்பு" : "Home construction timing evaluation",
      TASK_VEHICLE_PURCHASE_TIMING: isTamil ? "வாகனம் வாங்குதல் காலக்கணிப்பு" : "Vehicle purchase timing evaluation",
      TASK_BUSINESS_EXPANSION_DECISION: isTamil ? "வணிக விரிவாக்க முடிவெடுத்தல்" : "Business expansion decision assessment",
      TASK_FOREIGN_TRIP_TIMING: isTamil ? "வெளிநாட்டுப் பயண காலக்கணிப்பு" : "Foreign travel timing evaluation"
    };
    if (taskMap[token]) return taskMap[token];
  }

  // 8. General fallback for underscore tokens
  const words = token.toLowerCase().split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return words;
}
