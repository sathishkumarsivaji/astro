/**
 * ASTROVERSE — Advanced Evidence-Linked Q&A Engine Orchestrator
 * ==============================================================
 * Orchestrates the full 14-stage pipeline:
 * User Question -> Normalizer -> Intent Classifier -> Domain Classifier
 * -> Entity Extractor -> Evidence Planner -> Evidence Retrieval
 * -> Sufficiency Check -> Contradiction Detector -> Resolution Classifier
 * -> Synthesizer -> Completeness Validator -> Safety Validator -> Final Answer.
 */

import { normalizeQuestion } from "./questionNormalizer.js";
import { classifyIntent } from "./intentClassifier.js";
import { classifyDomains } from "./domainClassifier.js";
import { extractEntities } from "./entityExtractor.js";
import { planRequiredEvidence } from "./evidencePlanner.js";
import { retrieveEvidence } from "./evidenceRetriever.js";
import { detectContradictions } from "./contradictionDetector.js";
import { classifyResolution } from "./resolutionClassifier.js";
import { synthesizeAnswer } from "./answerSynthesizer.js";
import { validateCompleteness } from "./qaCompletenessValidator.js";
import { validateSafety } from "./qaSafetyValidator.js";

/**
 * Executes the complete 14-stage evidence-linked Q&A pipeline.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user question
 * @param {Object} params.context - Full report context (chart, report, etc.)
 * @param {Array} [params.conversationHistory=[]] - Previous conversational turns
 * @returns {Object} Final validated answer payload
 */
export async function processEvidenceLinkedQA({ question, context, conversationHistory = [] }) {
  if (!question || typeof question !== "string") {
    throw new Error("Question string is required.");
  }
  if (!context || (!context.chart && !context.planets)) {
    throw new Error("Valid chart context is required for evidence retrieval.");
  }

  // Stage 1 & 2: Question Normalization
  const normalizedQ = normalizeQuestion(question);

  // Stage 3: Intent Classification
  const intentResult = classifyIntent(normalizedQ, conversationHistory);

  // Stage 4: Domain Classification
  const domainResult = classifyDomains(normalizedQ, intentResult, conversationHistory);

  // Stage 5: Entity / Factor Extraction
  const entities = extractEntities(normalizedQ);

  // Stage 6: Required Evidence Planning
  const plan = planRequiredEvidence({ intentResult, domainResult, entities });

  // Stage 7: Evidence Retrieval
  const evidence = retrieveEvidence(plan, context);

  // Stage 8: Evidence Sufficiency Check
  const isSufficient = evidence.status !== "INSUFFICIENT_DATA";

  // Stage 9: Contradiction Detection
  const contradictions = detectContradictions(evidence, plan);

  // Stage 10 & 11: Resolution & Status Classification
  const resolution = classifyResolution(plan, evidence);

  // Stage 12 & 13: Answer Synthesis
  let synthResult = synthesizeAnswer({
    normalizedQ,
    intentResult,
    domainResult,
    entities,
    plan,
    evidence,
    contradictions,
    resolution
  });

  // Stage 14: Answer Completeness Validation
  let completenessCheck = validateCompleteness(entities, synthResult.answer);
  if (!completenessCheck.isComplete) {
    // If incomplete, patch or regenerate missing components
    if (completenessCheck.missingEntities.includes("DISTANCE")) {
      const distNotice = normalizedQ.isTamil
        ? "\n\n[இருப்பிட தூர விளக்கம்]\nஇந்த முறையில் திசை தொடர்பான பாரம்பரிய குறியீட்டை மட்டும் விளக்க முடிகிறது. நம்பகமான கிலோமீட்டர் தூர மதிப்பீடு கணக்கிடப்படவில்லை. (distanceStatus = NOT_ESTABLISHED)"
        : "\n\n[Geographic Distance Notice]\nDistance status is NOT_ESTABLISHED: Traditional astrology provides qualitative directional indicators; quantitative kilometer distances cannot be established without fabrication.";
      synthResult.answer += distNotice;
    }
    // Re-verify completeness
    completenessCheck = validateCompleteness(entities, synthResult.answer);
  }

  // Stage 15: Safety / Anti-Fabrication Validation
  const safetyCheck = validateSafety(synthResult.answer, plan.primaryDomain);
  let finalAnswerText = synthResult.answer;
  if (!safetyCheck.isValid) {
    finalAnswerText = safetyCheck.sanitizedText;
  }

  return {
    answer: finalAnswerText,
    directAnswer: synthResult.directAnswer,
    status: resolution.evidenceStatus,
    timingResolution: resolution.timingResolution,
    evidenceStatus: resolution.evidenceStatus,
    relevantSections: synthResult.relevantSections,
    evidenceIds: synthResult.evidenceIds,
    dataUsed: synthResult.dataUsed,
    limitations: synthResult.limitations,
    pipelineAudit: {
      intent: intentResult.primaryIntent,
      domain: domainResult.primaryDomain,
      entitiesFound: {
        planets: entities.planets,
        houses: entities.houses,
        vargas: entities.vargas,
        dashaPair: entities.dashaPair
      },
      completenessPass: completenessCheck.isComplete,
      safetyPass: safetyCheck.isValid,
      resolution: resolution.timingResolution
    }
  };
}
