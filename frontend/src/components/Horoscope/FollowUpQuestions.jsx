import React, { useState, useEffect, useMemo } from "react";
import { MessageSquareQuote, HelpCircle, Sparkles, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import FollowUpQuestionInput from "./FollowUpQuestionInput.jsx";
import FollowUpConversation from "./FollowUpConversation.jsx";
import { getSectionQuestions, getFullReportQuestions } from "../../services/followUpQuestionService.js";
import { buildFollowUpContext } from "../../services/followUpContextBuilder.js";
import { answerFollowUpQuestion } from "../../services/followUpAnswerService.js";

export default function FollowUpQuestions({
  chartData,
  activeSection = "fullReport",
  systemId = null,
  multiSystemBundle = null,
  lang = "en",
  onSelectChapter = null,
  onCreditDeducted = null
}) {
  const isTamil = lang === "ta";
  const isFullReport = activeSection === "all" || activeSection === "fullReport";

  const chartId = chartData?.reportId || `chart_${(chartData?.birthDate || chartData?.date || "").toString()}_${chartData?.ascendantLong || chartData?.ascendant?.longitude || 0}`;
  const effectiveSystemId = (
    systemId ||
    chartData?.system?.id ||
    chartData?.system ||
    chartData?.profile?.system ||
    "lahiri"
  ).toLowerCase();

  const storageKey = `astro_followup_${chartId}_${effectiveSystemId}_${activeSection}`;

  const [history, setHistory] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const saved = window.sessionStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
      }
    } catch {
      // sessionStorage unavailable
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync with storageKey if activeSection or system changes
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const saved = window.sessionStorage.getItem(storageKey);
        setHistory(saved ? JSON.parse(saved) : []);
      }
    } catch {
      setHistory([]);
    }
    setErrorMsg("");
  }, [storageKey]);

  // Save history to sessionStorage
  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(storageKey, JSON.stringify(newHistory));
      }
    } catch {
      // Ignore
    }
  };

  const handleClearHistory = () => {
    saveHistory([]);
    setErrorMsg("");
  };

  // Generate suggested questions
  const questionData = useMemo(() => {
    if (!chartData) return { applicable: false, questions: [] };
    if (isFullReport) {
      return getFullReportQuestions({
        systemId: effectiveSystemId,
        chartData,
        lang,
        multiSystemBundle
      });
    }
    return getSectionQuestions({
      sectionId: activeSection,
      systemId: effectiveSystemId,
      chartData,
      lang,
      multiSystemBundle
    });
  }, [chartData, activeSection, effectiveSystemId, lang, multiSystemBundle, isFullReport]);

  const questions = questionData.questions || [];
  const isApplicable = questionData.applicable !== false;

  // Ask question handler
  const handleAskQuestion = async (questionText) => {
    if (!questionText || isLoading) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const context = buildFollowUpContext({
        chartData,
        activeSection: isFullReport ? "fullReport" : activeSection,
        systemId: effectiveSystemId,
        multiSystemBundle,
        lang
      });

      const response = await answerFollowUpQuestion({
        question: questionText,
        context,
        conversationHistory: history,
        onCreditDeducted
      });

      const newTurn = {
        role: "user",
        content: questionText,
        question: questionText,
        answer: response.answer,
        system: response.system,
        relevantSections: response.relevantSections,
        evidenceIds: response.evidenceIds,
        dataUsed: response.dataUsed,
        status: response.status,
        limitations: response.limitations,
        timestamp: Date.now()
      };

      // Keep up to 6 turns of conversation
      saveHistory([...history.slice(-5), newTurn]);
    } catch (err) {
      console.error("Follow-up answer error:", err);
      setErrorMsg(
        isTamil
          ? "உங்கள் அறிக்கை கிடைக்கிறது, ஆனால் பின்தொடர் கேள்வி சேவை தற்காலிகமாக கிடைக்கவில்லை."
          : (err.message || "Your report is available, but the follow-up answer service is temporarily unavailable.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isApplicable) {
    return null;
  }

  const sectionTitle = isFullReport
    ? (isTamil ? "முழு அறிக்கை பின்தொடர் கேள்விகள்" : "Ask About Your Full Report")
    : (isTamil ? "இந்த அத்தியாயம் பற்றி கேள்வி கேட்கவும்" : "Ask About This Section");

  return (
    <div
      className="follow-up-questions-container mt-6 rounded-3xl bg-[#FAF6EE] border border-amber-300/80 p-4 md:p-6 shadow-sm space-y-4"
      aria-label="AstroVerse Follow-Up Questions"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-300 shrink-0">
            <MessageSquareQuote className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-serif font-bold text-stone-900 flex items-center gap-2">
              <span>{sectionTitle}</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                AstroVerse Follow-Up
              </span>
            </h3>
            <p className="text-[11px] text-stone-600">
              {isTamil
                ? "கணக்கிடப்பட்ட அறிக்கை தரவுகளின் அடிப்படையில் உடனடி விளக்கம் பெறவும்"
                : "Ask questions grounded directly in your calculated chart and report evidence"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-amber-100/50 transition-colors"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse follow-up section" : "Expand follow-up section"}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Suggested Questions Chips */}
          {questions.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {isTamil ? "பரிந்துரைக்கப்பட்ட கேள்விகள்:" : "Suggested Questions:"}
              </span>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleAskQuestion(q.text)}
                    className="text-left px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 active:bg-amber-100 border border-amber-200 text-stone-800 text-[11px] md:text-xs shadow-2xs hover:border-amber-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed max-w-full"
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Conversation History */}
          <div aria-live="polite">
            <FollowUpConversation
              history={history}
              onClear={handleClearHistory}
              onSelectChapter={onSelectChapter}
              isTamil={isTamil}
            />
          </div>

          {/* Question Input Box */}
          <div className="pt-2">
            <FollowUpQuestionInput
              onSubmit={handleAskQuestion}
              isLoading={isLoading}
              isTamil={isTamil}
              placeholder={
                isFullReport
                  ? (isTamil ? "உங்கள் முழு அறிக்கை பற்றி எதுவும் கேளுங்கள்..." : "Ask anything about this report...")
                  : (isTamil ? "இந்த அத்தியாயம் பற்றி கேள்வி கேட்கவும்..." : "Ask a question about this section...")
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
