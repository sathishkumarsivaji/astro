/**
 * ASTROVERSE — Research Paper Submission Election Task Evaluator
 * ===============================================================
 * Evaluates academic action election timing (muhurta) while strictly separating:
 * 1. Practical manuscript & submission readiness checklist (not inferable from chart)
 * 2. Traditional electional/muhurta calculation for the action date & location
 *
 * Never promises journal acceptance, review speed, or publication outcome.
 * Never converts natal Mercury/Jupiter placements into an uncalculated "submit today" election.
 *
 * Implements Section 5B of the User-Facing Task Answering Mandate.
 */

import { resolveTemporalTimeframe } from "../temporalResolver.js";

export const PRACTICAL_SUBMISSION_CHECKLIST = Object.freeze([
  { id: "MANUSCRIPT_COMPLETE", labelEn: "Manuscript completeness & final proofreading", labelTa: "கட்டுரை முழுமை மற்றும் இறுதி சரிபார்ப்பு" },
  { id: "JOURNAL_FORMATTING", labelEn: "Target journal guidelines & citation style compliance", labelTa: "ஆய்விதழ் வழிகாட்டுதல் மற்றும் குறிப்புகள் பொருத்தம்" },
  { id: "CO_AUTHOR_APPROVAL", labelEn: "Written approval from all co-authors", labelTa: "அனைத்து இணை-ஆசிரியர்களின் ஒப்புதல்" },
  { id: "SUPPLEMENTARY_FILES", labelEn: "Required data availability statements, code, and supplementary files", labelTa: "தேவையான தரவு அறிக்கைகள் மற்றும் கூடுதல் ஆவணங்கள்" },
  { id: "SUBMISSION_DEADLINE", labelEn: "Verification of journal call deadline and submission timezone", labelTa: "ஆய்விதழ் சமர்ப்பிப்பு இறுதி நேரம் மற்றும் நேர மண்டல சரிபார்ப்பு" }
]);

/**
 * Evaluates the research paper submission election task.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user inquiry
 * @param {Object} [params.context] - Execution context (chart, panchang, muhurta, readiness)
 * @param {boolean} [params.isTamil=false] - Language preference
 * @returns {Object} Standardized Task Result
 */
export function evaluateResearchSubmissionElection({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_RESEARCH_SUBMISSION";

  // Resolve timeframe at action location
  const timeframe = resolveTemporalTimeframe({
    question,
    referenceInstant: context.referenceInstant || context.currentTime || null,
    actionTimezone: context.actionTimezone || context.timezone || null,
    actionLocation: context.actionLocation || context.currentCity || null,
    weekStartPreference: context.weekStartPreference || "Monday"
  });

  // Check if daily electional / Muhurta calculation is provided in context
  const electionData = context.electionData || context.muhurta || null;
  const hasDailyElection = Boolean(electionData && Array.isArray(electionData.candidateWindows) && electionData.candidateWindows.length > 0);

  // Check practical readiness inputs provided by user
  const userReadinessInput = context.submissionReadiness || null;
  const isReadinessVerified = userReadinessInput && userReadinessInput.isReady === true;

  if (!hasDailyElection) {
    const directAnswer = isTamil
      ? "இன்றைய தினத்திற்கான முகூர்த்த காலக்கணிப்பு செய்யப்படாததால், ஆய்வுக் கட்டுரை சமர்ப்பிக்க ஜோதிட ரீதியான உகந்த நேரத்தை உறுதி செய்ய முடியாது. கட்டுரை தயாரிப்பு நிலை மற்றும் ஆய்விதழின் சமர்ப்பிப்பு கெடு ஆகியவை தனிப்பட்ட நடைமுறை காரணிகள்; உங்கள் ஜாதகம் கட்டுரை ஏற்றுக்கொள்ளப்படுவதை முன்கூட்டியே கணிக்காது."
      : "I cannot establish an astrologically preferred submission time for today because the daily electional calculation has not been run. Manuscript readiness and the journal deadline are separate from astrological timing; this chart does not predict acceptance.";

    const reason = isTamil
      ? "ஒரு குறிப்பிட்ட நாளுக்கான முகூர்த்த ஆய்வு திதி, வார, நட்சத்திர, யோக, கரண சுப நிலைகள் மற்றும் ராகு காலம், எமகண்டம் போன்ற விலக்கப்பட்ட நேரங்களை துல்லியமாக கணக்கிட வேண்டும். பொதுவான ஜாதக புதன்/குரு நிலைகள் ஒரு குறிப்பிட்ட தினத்தின் சமர்ப்பிப்பு நேரத்தை தீர்மானிக்காது."
      : "Traditional electional astrology requires calculating exact local Panchanga factors (Tithi, Nakshatra, Yoga, Karana) and eliminating inauspicious segments (Rahu Kalam, Yamaganda) for your action location. Natal chart placements cannot substitute for real-time electional calculations.";

    const limitation = isTamil
      ? "ஜோதிட காலக்கோடு கட்டுரை ஏற்றுக்கொள்ளப்படுதல், மதிப்பாய்வு வேகம் அல்லது வெளியீட்டு வெற்றியை எந்த வகையிலும் உறுதி செய்யாது. புறநிலை ஆய்விதழ் விதிகளும் ஆய்வின் தரமுமே முடிவை தீர்மானிக்கும்."
      : "Astrological election does not predict or guarantee journal acceptance, review speed, or editorial outcome. The manuscript's scientific merit and journal criteria govern decisions.";

    return {
      questionId,
      intent: "RESEARCH_SUBMISSION_ELECTION",
      answerState: "NOT_ESTABLISHED",
      directAnswer,
      reason,
      limitation,
      practicalChecklist: PRACTICAL_SUBMISSION_CHECKLIST,
      recommendation: null,
      evaluatedTimeframe: timeframe,
      supportingClaims: [],
      limitingClaims: [
        "Daily electional calculation has not been run for the action date.",
        "Manuscript readiness cannot be inferred from a natal chart.",
        limitation
      ],
      missingInputs: [
        "Daily Muhurta / Panchang calculation for action date & location",
        "User verification of manuscript readiness"
      ],
      traditionalMethod: "MUHURTA_ELECTION",
      publicationOutcomeGuarantee: false,
      empiricalStatus: "NOT_VALIDATED"
    };
  }

  // Daily election calculation is present
  const bestWindow = electionData.candidateWindows[0];
  const windowStr = bestWindow.interval || `${bestWindow.start} – ${bestWindow.end}`;

  const directAnswer = isTamil
    ? `தேர்ந்தெடுக்கப்பட்ட பாரம்பரிய முகூர்த்த கணிப்பின்படி, இன்று உகந்த சமர்ப்பிப்பு காலக்கோடு ${windowStr} ஆகும். இது கட்டுரை ஏற்றுக்கொள்ளப்படுதல், மதிப்பாய்வு வேகம் அல்லது வெளியீட்டு வெற்றியை உறுதி செய்யாது.`
    : `Under the selected traditional method, ${windowStr} is the preferred submission window today. This does not predict acceptance, review speed, or publication success.`;

  const reason = isTamil
    ? `இந்த காலக்கோடு உள்ளூர் பஞ்சாங்க சுப யோகம் மற்றும் விலக்கப்பட்ட நேரங்களை (ராகு காலம், எமகண்டம்) தவிர்த்து கணக்கிடப்பட்டது.`
    : `This electional window was determined by filtering out local inauspicious intervals (Rahu Kalam, Yamaganda) and verifying favorable Tithi and Nakshatra alignments for ${timeframe.localStartDate}.`;

  const limitation = isTamil
    ? "நடைமுறை ஆவணத் தயார்நிலை மற்றும் ஆய்விதழ் சமர்ப்பிப்பு விதிகளுக்கு முதலிடம் கொடுங்கள். ஜோதிட கணிப்பு ஆய்விதழ் ஏற்பை நிர்ணயிக்காது."
    : "Practical manuscript readiness, co-author consensus, and journal deadlines must always take precedence. Astrological timing carries no guarantee of publication.";

  return {
    questionId,
    intent: "RESEARCH_SUBMISSION_ELECTION",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation,
    practicalChecklist: PRACTICAL_SUBMISSION_CHECKLIST,
    recommendation: {
      action: "SUBMIT_RESEARCH_PAPER",
      evaluatedDate: timeframe.localStartDate,
      preferredWindow: windowStr,
      candidateWindows: electionData.candidateWindows
    },
    evaluatedTimeframe: timeframe,
    supportingClaims: [
      `Evaluated Action: SUBMIT_RESEARCH_PAPER`,
      `Evaluated Date: ${timeframe.localStartDate}`,
      `Selected Window: ${windowStr}`
    ],
    limitingClaims: [limitation],
    missingInputs: isReadinessVerified ? [] : ["User manuscript checklist confirmation"],
    traditionalMethod: electionData.method || "PANCHANG_MUHURTA",
    publicationOutcomeGuarantee: false,
    empiricalStatus: "NOT_VALIDATED"
  };
}
