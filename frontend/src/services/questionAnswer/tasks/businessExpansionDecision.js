/**
 * ASTROVERSE — Business Expansion vs Diversification Decision Evaluator
 * ======================================================================
 * Resolves ambiguity between expanding an existing enterprise (e.g. opening another branch)
 * versus diversifying into an entirely new sector or distinct business line.
 *
 * Implements Section 5C & Section 6 of the User-Facing Task Answering Mandate.
 */

/**
 * Evaluates the business expansion vs diversification decision task.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user question
 * @param {Object} [params.context] - Execution context
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluateBusinessExpansionDecision({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_BUSINESS_DECISION";
  const raw = String(question || "").toLowerCase();

  // Check if user specifically clarified branch vs different business
  const isBranchExplicit = /\b(branch|store|location|outlet|அலுவலகம்|கிளை)\b/i.test(raw);
  const isDifferentBusinessExplicit = /\b(different\s+business|new\s+industry|another\s+field|diversif|வேறு\s*தொழில்|புதிய\s*துறை)\b/i.test(raw);

  if (!isBranchExplicit && !isDifferentBusinessExplicit) {
    const directAnswer = isTamil
      ? "நீங்கள் ஏற்கனவே உள்ள தொழிலில் மற்றொரு கிளையைத் திறக்க விரும்புகிறீர்களா, அல்லது முற்றிலும் வேறுபட்ட புதிய தொழிலைத் தொடங்க விரும்புகிறீர்களா?"
      : "Do you mean opening another branch of the same business, or starting a different business?";

    const reason = isTamil
      ? "ஏற்கனவே உள்ள தொழிலை விரிவுபடுத்துவது 7 மற்றும் 10-ம் பாவகங்களின் வலுவை அடிப்படையாகக் கொண்டது; புதிய தொழிலில் இறங்குவது (பன்முகப்படுத்தல்) 3, 5 மற்றும் 9-ம் பாவகங்கள் மற்றும் கூடுதல் மூலதனத்தை சார்ந்தது."
      : "Scaling an existing business synthesizes established 7th and 10th house infrastructure; diversifying into a different industry requires distinct significators and alternate capital risk management.";

    const limitation = isTamil
      ? "சரியான வணிக வகையை தெளிவுபடுத்தாமல் துல்லியமான ஜோதிட ஒப்பீட்டை வழங்க முடியாது."
      : "Astrological trade assessment requires distinguishing between operational branch scaling and new industry diversification.";

    return {
      questionId,
      intent: "BUSINESS_EXPANSION_DECISION",
      answerState: "CLARIFICATION_REQUIRED",
      directAnswer,
      reason,
      limitation,
      recommendation: null,
      clarificationPrompt: directAnswer,
      options: isTamil
        ? ["தற்போதைய தொழிலில் புதிய கிளை", "முற்றிலும் வேறுபட்ட புதிய தொழில்"]
        : ["Opening another branch of the same business", "Starting a completely different business"],
      supportingClaims: [],
      limitingClaims: [limitation],
      missingInputs: ["Clarification: Branch scaling vs New industry diversification"],
      traditionalMethod: "JYOTISH_COMMERCIAL_SYNTHESIS",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // If user clarified branch expansion
  if (isBranchExplicit) {
    const directAnswer = isTamil
      ? "தற்போதைய தொழிலில் மற்றொரு கிளையைத் தொடங்குவதற்கு உங்கள் 7-ம் வணிக பாவகம் மற்றும் 10-ம் நிர்வாக பாவகம் ஆதரவாக உள்ளதா என்பதை ஆராய வேண்டும்."
      : "Evaluating branch expansion for your existing business assesses your 7th house of trade partners and 10th house of institutional management.";

    return {
      questionId,
      intent: "BUSINESS_EXPANSION_DECISION",
      answerState: "PARTIALLY_ANSWERED",
      directAnswer,
      recommendation: { type: "BRANCH_EXPANSION" },
      supportingClaims: ["Targeting existing enterprise branch scaling"],
      limitingClaims: ["Requires operational feasibility and capital readiness"],
      missingInputs: [],
      traditionalMethod: "JYOTISH_COMMERCIAL_SYNTHESIS",
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // If user clarified new industry diversification
  const directAnswer = isTamil
    ? "புதிய துறையில் இறங்குவது பன்முகப்படுத்தல் (diversification) ஆய்வை கோருகிறது; இதற்கு புதிய துறை காரக கிரகங்களின் வலுவை ஆராய வேண்டும்."
    : "Entering a new industry requires evaluating sector-specific planetary significators and assessing enterprise risk appetite.";

  return {
    questionId,
    intent: "BUSINESS_DIVERSIFICATION_DECISION",
    answerState: "PARTIALLY_ANSWERED",
    directAnswer,
    recommendation: { type: "NEW_INDUSTRY_DIVERSIFICATION" },
    supportingClaims: ["Targeting new sector diversification"],
    limitingClaims: ["Requires sector-specific market analysis and capital reserve readiness"],
    missingInputs: [],
    traditionalMethod: "JYOTISH_COMMERCIAL_SYNTHESIS",
    empiricalStatus: "NOT_VALIDATED"
  };
}
