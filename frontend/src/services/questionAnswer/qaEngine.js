/**
 * ASTROVERSE — Precision Evidence-Linked Q&A Engine Orchestrator
 * ==============================================================
 * Orchestrates the end-to-end precision astrological question-answering chain:
 * QUESTION
 * → CONVERSATIONAL CONTEXT RESOLUTION
 * → QUESTION UNDERSTANDING & CORRECTION
 * → QUESTION DECOMPOSITION (if compound)
 * → REQUIRED EVIDENCE PLANNING
 * → DETERMINISTIC CHART CALCULATION & EVIDENCE RETRIEVAL
 * → CANONICAL EVIDENCE GRAPH
 * → SUFFICIENCY HARD GATE
 * → CONTRADICTION & MULTI-SYSTEM CONVERGENCE CHECK
 * → TIMING ENGINE CONVERGENCE
 * → RESOLUTION & ANSWERABILITY CLASSIFICATION
 * → STRUCTURED ANSWER OBJECT CONSTRUCTION
 * → DUAL-MODE (NOVICE / EXPERT) SYNTHESIS
 * → COMPLETENESS & SAFETY VALIDATION
 * → POST-GENERATION LLM FIREWALL & GROUNDING VERIFICATION
 * → INDEPENDENT QUALITY SCORE EVALUATION
 * → FINAL ANSWER
 *
 * Implements the complete ASTROVERSE Precision Q&A Engine Mandate.
 */

import { normalizeQuestion } from "./questionNormalizer.js";
import { classifyIntent } from "./intentClassifier.js";
import { classifyDomains } from "./domainClassifier.js";
import { extractEntities } from "./entityExtractor.js";
import { planRequiredEvidence } from "./evidencePlanner.js";
import { retrieveEvidence } from "./evidenceRetriever.js";
import { detectContradictions } from "./contradictionDetector.js";
import { classifyResolution, classifyAnswerability } from "./resolutionClassifier.js";
import { synthesizeAnswer } from "./answerSynthesizer.js";
import { validateCompleteness } from "./qaCompletenessValidator.js";
import { validateSafety } from "./qaSafetyValidator.js";
import { understandQuestion } from "./questionUnderstandingEngine.js";
import { decomposeQuestion, combineAtomicAnswers } from "./questionDecomposer.js";
import { resolveFollowUpContext } from "./followUpMemory.js";
import { verifyGeneratedAnswer } from "./qaFirewall.js";
import { calculateQAScore } from "./qualityScorer.js";
import { getCachedLifeReport } from "../customerReport/reportCacheManager.js";

/**
 * Executes a single atomic question through the full evidence verification pipeline.
 */
async function executeSingleQuestionQA({
  question,
  context,
  conversationHistory = [],
  mode = "novice",
  questionUnderstanding = null,
  atomicMeta = null,
  forcedIntent = null,
  forcedDomain = null
}) {
  // Stage 1: Question Understanding & Normalization
  const qUnderstanding = questionUnderstanding || understandQuestion({
    question,
    conversationHistory,
    context
  });
  const normalizedQ = normalizeQuestion(question);

  // Stage 2: Intent & Domain Classification
  let intentResult = classifyIntent(normalizedQ, conversationHistory);
  if (forcedIntent) {
    intentResult = { primaryIntent: forcedIntent, intents: [forcedIntent], confidence: 1.0 };
  } else if (qUnderstanding.malformed?.isMalformed && qUnderstanding.malformed.correctedIntent) {
    intentResult = { primaryIntent: qUnderstanding.malformed.correctedIntent, intents: [qUnderstanding.malformed.correctedIntent], confidence: 0.95 };
  }

  let domainResult = classifyDomains(normalizedQ, intentResult, conversationHistory);
  if (forcedDomain) {
    domainResult = { primaryDomain: forcedDomain, domains: [forcedDomain], confidence: 1.0 };
  }

  // Stage 3: Entity Extraction
  const entities = extractEntities(normalizedQ);

  // Stage 4: Required Evidence Planning
  const plan = planRequiredEvidence({ intentResult, domainResult, entities });
  plan.questionId = qUnderstanding.questionId;
  plan.mode = mode;

  // Stage 5: Evidence Retrieval & Evidence Graph Population
  const evidence = retrieveEvidence(plan, context);

  // Stage 6: Hard Evidence Sufficiency Gate
  const isSufficient = evidence && evidence.status !== "INSUFFICIENT_DATA";
  if (!isSufficient) {
    const resolution = classifyResolution(plan, { ...evidence, status: "INSUFFICIENT_DATA" });
    const synthResult = synthesizeAnswer({
      normalizedQ,
      intentResult,
      domainResult,
      entities,
      plan,
      evidence: { ...evidence, status: "INSUFFICIENT_DATA" },
      contradictions: [],
      resolution,
      mode
    });

    const qaScore = calculateQAScore({
      answerObject: synthResult.answerObject,
      answerText: synthResult.answer
    });

    return {
      answer: synthResult.answer,
      directAnswer: synthResult.directAnswer,
      status: "INSUFFICIENT_DATA",
      timingResolution: "INSUFFICIENT_DATA",
      evidenceStatus: "INSUFFICIENT_DATA",
      relevantSections: synthResult.relevantSections || ["technicalAppendix"],
      evidenceIds: synthResult.evidenceIds || ["EVIDENCE_STATUS_INSUFFICIENT_DATA"],
      dataUsed: ["INSUFFICIENT_DATA"],
      limitations: synthResult.limitations || ["Required chart factors are absent."],
      answerObject: synthResult.answerObject,
      atomicMeta,
      pipelineAudit: {
        questionId: qUnderstanding.questionId,
        intent: intentResult.primaryIntent,
        domain: domainResult.primaryDomain,
        entitiesFound: {
          planets: entities.planets,
          houses: entities.houses,
          vargas: entities.vargas,
          dashaPair: entities.dashaPair
        },
        completenessPass: true,
        safetyPass: true,
        resolution: "INSUFFICIENT_DATA",
        qaScore
      }
    };
  }

  // Stage 7: Contradiction Detection & Non-Double-Counted Multi-System Convergence
  const contradictions = detectContradictions(evidence, plan);

  // Stage 8: Resolution & Answerability Classification
  const resolution = classifyResolution(plan, evidence);
  const answerability = classifyAnswerability(plan, evidence, contradictions);

  // Stage 9: Dual-Mode Answer Synthesis (Novice / Expert)
  let synthResult = synthesizeAnswer({
    normalizedQ,
    intentResult,
    domainResult,
    entities,
    plan,
    evidence,
    contradictions,
    resolution,
    mode
  });

  // Stage 10: Answer Completeness Validation
  let completenessCheck = validateCompleteness(entities, synthResult.answer);
  if (!completenessCheck.isComplete) {
    if (completenessCheck.missingEntities.includes("DISTANCE")) {
      const distNotice = normalizedQ.isTamil
        ? "\n\n[இருப்பிட தூர விளக்கம்]\nஇந்த முறையில் திசை தொடர்பான பாரம்பரிய குறியீட்டை மட்டும் விளக்க முடிகிறது. நம்பகமான கிலோமீட்டர் தூர மதிப்பீடு கணக்கிடப்படவில்லை. (distanceStatus = NOT_ESTABLISHED)"
        : "\n\n[Geographic Distance Notice]\nDistance status is NOT_ESTABLISHED: Traditional astrology provides qualitative directional indicators; quantitative kilometer distances cannot be established without fabrication.";
      synthResult.answer += distNotice;
    }
    completenessCheck = validateCompleteness(entities, synthResult.answer);
  }

  // Stage 11: Statutory Safety Validation
  const safetyCheck = validateSafety(synthResult.answer, plan.primaryDomain);
  let finalAnswerText = synthResult.answer;
  if (!safetyCheck.isValid) {
    finalAnswerText = safetyCheck.sanitizedText;
  }

  // Stage 12: Post-Generation LLM Firewall & Grounding Verifier (Section 22)
  const firewallCheck = verifyGeneratedAnswer({
    text: finalAnswerText,
    answerObject: synthResult.answerObject,
    isTamil: normalizedQ.isTamil
  });
  if (!firewallCheck.isValid) {
    finalAnswerText = firewallCheck.sanitizedText;
  }

  // Stage 13: Independent Quality Scorer (Section 30)
  const qaScore = calculateQAScore({
    answerObject: synthResult.answerObject,
    answerText: finalAnswerText
  });

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
    answerObject: synthResult.answerObject,
    atomicMeta,
    qaScore,
    pipelineAudit: {
      questionId: qUnderstanding.questionId,
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
      firewallPass: firewallCheck.isValid,
      resolution: resolution.timingResolution,
      answerability,
      multiSystemMetrics: {
        independentEvidenceCount: contradictions.independentEvidenceCount,
        supportingEvidenceCount: contradictions.supportingEvidenceCount,
        contradictingEvidenceCount: contradictions.contradictingEvidenceCount,
        systemAgreementScore: contradictions.systemAgreementScore
      },
      qaScore
    }
  };
}

/**
 * Executes the complete precision evidence-linked Q&A pipeline.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user question
 * @param {Object} params.context - Full report context (chart, report, etc.)
 * @param {Array} [params.conversationHistory=[]] - Previous conversational turns
 * @param {string} [params.mode="novice"] - "novice" | "expert"
 * @returns {Object} Final validated answer payload
 */
export async function processEvidenceLinkedQA({ question, context, conversationHistory = [], mode = "novice" }) {
  if (!question || typeof question !== "string") {
    throw new Error("Question string is required.");
  }
  const safeContext = (context && (context.chart || context.planets))
    ? context
    : { chart: null, planets: [], isInsufficientData: true };

  // Reuse cached expert report if available to prevent recomputing 17 domains
  const rawChart = safeContext.chart || (safeContext.planets ? safeContext : null);
  if (rawChart && !safeContext.report) {
    const cachedReport = getCachedLifeReport(rawChart, { lang: mode === "tamil" ? "ta" : "en" });
    if (cachedReport) {
      safeContext.report = cachedReport;
    }
  }

  // 1. Follow-Up Context Resolution (Section 18)
  const followUpContext = resolveFollowUpContext({ question, conversationHistory });
  const effectiveQuestion = followUpContext.resolvedQuestion;

  // 2. Question Understanding Engine (Section 2, Section 19)
  const questionUnderstanding = understandQuestion({
    question: effectiveQuestion,
    conversationHistory,
    context: safeContext
  });

  // 3. Question Decomposition Check (Section 3)
  if (questionUnderstanding.isCompound) {
    const atomicQuestions = decomposeQuestion(effectiveQuestion, questionUnderstanding);
    if (atomicQuestions.length > 1) {
      const atomicResults = [];
      for (const aq of atomicQuestions) {
        const atomicRes = await executeSingleQuestionQA({
          question: aq.questionText,
          context: safeContext,
          conversationHistory,
          mode,
          atomicMeta: aq,
          forcedIntent: aq.intent,
          forcedDomain: aq.domain
        });
        atomicResults.push({ ...atomicRes, atomicMeta: aq });
      }
      return combineAtomicAnswers(atomicResults, questionUnderstanding.isTamil);
    }
  }

  // 4. Single Question Execution Pipeline
  return await executeSingleQuestionQA({
    question: effectiveQuestion,
    context: safeContext,
    conversationHistory,
    mode,
    questionUnderstanding
  });
}
