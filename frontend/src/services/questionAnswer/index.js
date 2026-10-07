/**
 * ASTROVERSE — Precision Evidence-Linked Q&A Engine
 * ===================================================
 * Main barrel export for the complete Q&A pipeline and all supporting subsystems.
 */

export { processEvidenceLinkedQA } from "./qaEngine.js";
export { normalizeQuestion } from "./questionNormalizer.js";
export { classifyIntent, QUESTION_INTENTS } from "./intentClassifier.js";
export { classifyDomains, DOMAINS } from "./domainClassifier.js";
export { extractEntities } from "./entityExtractor.js";
export { planRequiredEvidence } from "./evidencePlanner.js";
export { retrieveEvidence } from "./evidenceRetriever.js";
export { detectContradictions } from "./contradictionDetector.js";
export { classifyResolution, classifyAnswerability, TIMING_RESOLUTIONS, EVIDENCE_STATUSES, ANSWERABILITY_STATES } from "./resolutionClassifier.js";
export { synthesizeAnswer } from "./answerSynthesizer.js";
export { validateCompleteness } from "./qaCompletenessValidator.js";
export { validateSafety } from "./qaSafetyValidator.js";

// Enhanced Subsystems (Sections 1 through 32)
export { understandQuestion, checkMalformedQuestion } from "./questionUnderstandingEngine.js";
export { decomposeQuestion, combineAtomicAnswers } from "./questionDecomposer.js";
export {
  EvidenceGraph,
  EVIDENCE_CATEGORIES,
  buildChartFactId,
  buildHouseFactId,
  buildLordFactId,
  buildPlanetFactId,
  buildVargaFactId,
  buildDashaFactId,
  buildTransitFactId,
  buildKpFactId,
  buildJaiminiFactId,
  buildRuleId,
  buildCounterEvidenceId,
  buildTimingWindowId,
  buildResolutionId,
  buildAnswerId
} from "./evidenceGraph.js";
export { computeTimingWindows } from "./timingEngine.js";
export { evaluateComparison } from "./comparisonEngine.js";
export { evaluatePersonCharacteristic } from "./personCharacteristicEngine.js";
export { resolveFollowUpContext } from "./followUpMemory.js";
export { generateSectionQuestions } from "./sectionWiseQuestionGenerator.js";
export {
  buildAnswerObject,
  CONCLUSION_STATUSES,
  CONFIDENCE_CLASSES
} from "./structuredAnswerObject.js";
export { verifyGeneratedAnswer } from "./qaFirewall.js";
export { calculateQAScore } from "./qualityScorer.js";
