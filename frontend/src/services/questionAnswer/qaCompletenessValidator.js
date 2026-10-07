/**
 * ASTROVERSE — Answer Completeness Validator
 * ============================================
 * Compares questionEntities against answeredEntities to verify
 * that every component requested by the user was directly answered.
 */

/**
 * Validates whether the synthesized answer addressed all requested entities.
 *
 * @param {Object} entities - Output of entityExtractor
 * @param {string} answerText - The synthesized answer string
 * @returns {Object} { isComplete: boolean, missingEntities: Array<string>, details: Object }
 */
export function validateCompleteness(entities, answerText) {
  if (!answerText || typeof answerText !== "string") {
    return { isComplete: false, missingEntities: ["EMPTY_ANSWER"], details: {} };
  }

  const req = entities?.requestedQuantities || {};
  const missing = [];
  const text = answerText.toLowerCase();

  // 1. Direction and Distance
  if (req.directionRequested) {
    const hasDirection =
      /direction|east|west|north|south|திசை|கிழக்கு|மேற்கு|வடக்கு|தெற்கு/i.test(answerText);
    if (!hasDirection) missing.push("DIRECTION");
  }

  if (req.distanceRequested) {
    const hasDistance =
      /distance|kilometer|km|not_established|தொலைவு|தூரம்|கிலோமீட்டர்|கணக்கிடப்படவில்லை/i.test(answerText);
    if (!hasDistance) missing.push("DISTANCE");
  }

  // 2. Spouse Family Wealth / Status
  if (req.familyWealthRequested) {
    const hasFamilyWealth =
      /spouse|family|wealth|standing|status|துணை|குடும்பம்|வசதி|அந்தஸ்து|பொருளாதாரம்/i.test(answerText);
    if (!hasFamilyWealth) missing.push("SPOUSE_FAMILY_STATUS");
  }

  // 3. Varga (e.g. D10)
  if (entities?.vargas && entities.vargas.length > 0) {
    for (const v of entities.vargas) {
      const vPattern = new RegExp(`\\b${v}\\b|${v === "D10" ? "தசாம்சம்|dashamsha" : ""}|${v === "D9" ? "நவாம்சம்|navamsha" : ""}`, "i");
      if (!vPattern.test(answerText)) {
        missing.push(`VARGA_${v}`);
      }
    }
  }

  // 4. Dasha Pair
  if (entities?.dashaPair) {
    const p1 = entities.dashaPair.mahadasha.toLowerCase();
    const p2 = entities.dashaPair.antardasha.toLowerCase();
    const hasP1 = text.includes(p1) || /சந்திர|சூரிய|செவ்வாய்|புதன்|குரு|சுக்கிர|சனி|ராகு|கேது/.test(answerText);
    const hasP2 = text.includes(p2) || /சந்திர|சூரிய|செவ்வாய்|புதன்|குரு|சுக்கிர|சனி|ராகு|கேது/.test(answerText);
    if (!hasP1 || !hasP2) {
      missing.push("DASHA_PAIR_COMPONENTS");
    }
  }

  return {
    isComplete: missing.length === 0,
    missingEntities: missing,
    details: {
      checkedDirection: req.directionRequested,
      checkedDistance: req.distanceRequested,
      checkedFamilyWealth: req.familyWealthRequested,
      checkedVargas: entities?.vargas || [],
      checkedDashaPair: entities?.dashaPair || null
    }
  };
}
