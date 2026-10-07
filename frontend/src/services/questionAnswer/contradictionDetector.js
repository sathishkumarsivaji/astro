/**
 * ASTROVERSE — Contradiction & Multi-System Convergence Engine
 * =============================================================
 * Identifies directional divergences, planetary dignity conflicts,
 * and timing resolution mismatches across retrieved evidence.
 * Computes non-double-counted multi-system convergence metrics:
 * independentEvidenceCount, supportingEvidenceCount, contradictingEvidenceCount,
 * systemAgreementScore, supportScore, counterScore, netSignal, and confidenceClass.
 *
 * Implements Section 7 and Section 8 of the Precision Q&A Engine Mandate.
 */

/**
 * Evaluates contradictions and multi-system convergence across retrieved evidence.
 *
 * @param {Object} evidence - Output from retrieveEvidence
 * @param {Object} plan - Output from planRequiredEvidence
 * @returns {Object} Detected contradictions, convergence scores, and explanatory notes
 */
export function detectContradictions(evidence, plan) {
  const contradictions = [];
  const counterweights = [];

  // Track distinct root entities to prevent double-counting
  const uniqueRootFactors = new Set();
  let supportingCount = 0;
  let counterCount = 0;

  // 1. Directional Contradictions
  if (evidence.directionAnalysis) {
    const { primaryDirection, conflictingIndicators } = evidence.directionAnalysis;
    if (primaryDirection) {
      uniqueRootFactors.add("DIR_CONVERGENCE");
      supportingCount += 2;
    }
    if (conflictingIndicators && conflictingIndicators.length > 0) {
      const conflictList = conflictingIndicators.map(c => `${c.factor} (${c.direction})`).join(", ");
      contradictions.push({
        type: "DIRECTION_DIVERGENCE",
        severity: "MODERATE",
        textEn: `Primary convergence points towards ${primaryDirection}, but counter-indicators exist: ${conflictList}.`,
        textTa: `முதன்மை ஒருங்கிணைவு ${primaryDirection} திசையை காட்டினாலும், மாற்றுக் குறியீடுகளும் (${conflictList}) உள்ளன.`
      });
      counterCount += conflictingIndicators.length;
    }
  }

  // 2. Dasha Dignity and Axis Tensions
  if (evidence.dashaInteraction) {
    const { mahadashaLord, antardashaLord, axisRelationship } = evidence.dashaInteraction;
    uniqueRootFactors.add(`DASHA_${mahadashaLord?.name}_${antardashaLord?.name}`);

    if (axisRelationship === "6/8_SHADASHTAKA" || axisRelationship === "2/12_DWIRDWADASA") {
      contradictions.push({
        type: "DASHA_AXIS_FRICTION",
        severity: "HIGH",
        textEn: `Mahadasha lord (${mahadashaLord.name}) and Antardasha lord (${antardashaLord.name}) are positioned in an adverse ${axisRelationship.replace(/_/g, " ")} axis, requiring deliberate balance during this period.`,
        textTa: `மகாதசா அதிபதி (${mahadashaLord.name}) மற்றும் அந்தர்தசா அதிபதி (${antardashaLord.name}) இடையே ${axisRelationship.replace(/_/g, " ")} அச்சு தொடர்பு காணப்படுவதால், இக்காலத்தில் சீரான திட்டமிடல் மற்றும் எச்சரிக்கை தேவை.`
      });
      counterCount += 2;
    } else {
      supportingCount += 2;
    }

    if (mahadashaLord?.dignity === "Debilitated" || antardashaLord?.dignity === "Debilitated") {
      const debPlanet = mahadashaLord.dignity === "Debilitated" ? mahadashaLord.name : antardashaLord.name;
      counterweights.push({
        type: "PLANET_DEBILITATION",
        severity: "HIGH",
        textEn: `${debPlanet} is in debilitated dignity, moderating swift outcomes and indicating internal effort is required.`,
        textTa: `${debPlanet} நீச பலத்தில் இருப்பதால், பலன்கள் தாமதமாகவோ அல்லது கூடுதல் உழைப்பிற்கு பிறகோ கிடைக்கலாம்.`
      });
      counterCount += 1;
    }
  }

  // 3. Varga vs Rasi Misalignment (e.g. D10 vs D1)
  if (evidence.vargaAnalysis && evidence.vargaAnalysis.varga === "D10") {
    uniqueRootFactors.add("VARGA_D10_EXECUTION");

    if (evidence.vargaAnalysis.userClaimMismatch) {
      const claimed = evidence.vargaAnalysis.userClaimedSign;
      const actual = evidence.vargaAnalysis.lagna;
      contradictions.push({
        type: "USER_CLAIM_CHART_MISMATCH",
        severity: "HIGH",
        textEn: `User inquiry specified ${claimed} as D10 Lagna, but calculated chart proves D10 Lagna is ${actual}.`,
        textTa: `கேள்வியில் D10 லக்னம் ${claimed} என்று குறிப்பிடப்பட்டுள்ளது; ஆனால் கணக்கிடப்பட்ட ஜாதகத்தில் D10 லக்னம் ${actual} ஆகும்.`
      });
      counterCount += 2;
    }

    const d10Lord = evidence.vargaAnalysis.tenthLord;
    const rasi10thLord = evidence.houseMap?.[10]?.lord;
    if (d10Lord && rasi10thLord && d10Lord !== rasi10thLord) {
      counterweights.push({
        type: "D1_D10_LORD_DIVERGENCE",
        severity: "LOW",
        textEn: `D1 10th lord is ${rasi10thLord} while D10 10th lord is ${d10Lord}, demonstrating that external career status (D1) and inner professional execution (D10) are governed by distinct planetary energies.`,
        textTa: `ராசியில் 10-ம் அதிபதி ${rasi10thLord} ஆகவும், தசாம்சத்தில் 10-ம் அதிபதி ${d10Lord} ஆகவும் இருப்பதால், வெளிப்படையான பணி அந்தஸ்தும் தொழில்முறை செயல்பாடும் வெவ்வேறு கிரக தாக்கங்களை கொண்டுள்ளன.`
      });
    }
    supportingCount += 1;
  }

  // 4. Comparative Family Wealth Balance
  if (evidence.comparisonAnalysis) {
    const { nativeScore, spouseScore } = evidence.comparisonAnalysis;
    uniqueRootFactors.add("COMPARATIVE_WEALTH");
    if (Math.abs(nativeScore - spouseScore) < 1.0) {
      counterweights.push({
        type: "BALANCED_SOCIOECONOMIC_STANDING",
        severity: "INFO",
        textEn: "Both charts show balanced asset foundations without disproportionate disparity.",
        textTa: "இரு குடும்பங்களின் பூர்வீக மற்றும் பொருளாதார அமைப்புகளும் அதிக இடைவெளியின்றி சமநிலையில் காணப்படுகின்றன."
      });
      supportingCount += 1;
    }
  }

  // Multi-System Convergence & Signal Computation
  const independentEvidenceCount = Math.max(1, uniqueRootFactors.size);
  const supportingEvidenceCount = supportingCount;
  const contradictingEvidenceCount = counterCount;

  const totalEvaluated = supportingEvidenceCount + contradictingEvidenceCount;
  const systemAgreementScore = totalEvaluated > 0
    ? Number((supportingEvidenceCount / totalEvaluated).toFixed(2))
    : 0.5;

  const supportScore = supportingEvidenceCount;
  const counterScore = contradictingEvidenceCount;
  const netDiff = supportScore - counterScore;

  let netSignal = "BALANCED";
  let confidenceClass = "MODERATE";

  if (evidence.status === "INSUFFICIENT_DATA") {
    netSignal = "INSUFFICIENT";
    confidenceClass = "INSUFFICIENT_DATA";
  } else if (netDiff >= 3) {
    netSignal = "POSITIVE";
    confidenceClass = "HIGH";
  } else if (netDiff >= 1) {
    netSignal = "MODERATE_POSITIVE";
    confidenceClass = "MODERATE";
  } else if (netDiff <= -2) {
    netSignal = "CHALLENGING";
    confidenceClass = "MODERATE";
  }

  return {
    hasContradictions: contradictions.length > 0 || counterweights.length > 0,
    contradictions,
    counterweights,
    independentEvidenceCount,
    supportingEvidenceCount,
    contradictingEvidenceCount,
    systemAgreementScore,
    supportScore,
    counterScore,
    netSignal,
    confidenceClass,
    summaryEn: contradictions.map(c => c.textEn).concat(counterweights.map(c => c.textEn)).join(" "),
    summaryTa: contradictions.map(c => c.textTa).concat(counterweights.map(c => c.textTa)).join(" ")
  };
}
