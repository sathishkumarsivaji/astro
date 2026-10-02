import React, { useState, useMemo } from "react";
import { MessageSquare, Sparkles, Send, ArrowRight, ShieldCheck, Compass, BookOpen, Layers, CheckCircle2, FileText, History, HelpCircle, ChevronRight, Sliders } from "lucide-react";
import FollowUpQuestions from "../Horoscope/FollowUpQuestions";
import HistoricalReplayModal from "../Horoscope/HistoricalReplayModal";
import { QUESTION_ONTOLOGY, CERTAINTY_LAYERS, generateAstrologerConsultation } from "../../services/consultationEngine.js";
import { TRANSLATIONS } from "../../services/localization";

export default function AskAstroVerseView({
  chartData,
  lang = "en",
  initialQuery = null,
  onOpenReport = null,
  onNavigateToChart = null,
  onLoadDemoChart = null,
  userCredits = null,
  onCreditDeducted = null
}) {
  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [promptInput, setPromptInput] = useState(initialQuery || "");
  const [selectedDepth, setSelectedDepth] = useState("ASTROLOGER_MODE");
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [selectedDomainKey, setSelectedDomainKey] = useState("MARRIAGE");
  const [showReplayModal, setShowReplayModal] = useState(false);

  const SUGGESTIONS = [
    {
      labelEn: "Marriage Timing & Age",
      labelTa: "திருமண காலக்கணிப்பு & வயது",
      queryEn: "When will I get married and at what age is the primary activation window?",
      queryTa: "எனக்கு எப்போது திருமணம் நடக்கும் மற்றும் எந்த வயதில் சாதகமான சுப காலம் அமைகிறது?"
    },
    {
      labelEn: "Spouse Family Wealth",
      labelTa: "துணையின் குடும்ப வசதி",
      queryEn: "Will my spouse's family be financially stronger than mine or comparable?",
      queryTa: "துணையின் குடும்பம் என்னை விட வசதியான குடும்பமாக அமையுமா அல்லது ஒத்த நிலையிலா?"
    },
    {
      labelEn: "Spouse Direction & Distance",
      labelTa: "துணை அமையும் திசை & தூரம்",
      queryEn: "Which geographic direction and distance band will my spouse come from?",
      queryTa: "எனது ஊரிலிருந்து எந்த திசையில் மற்றும் எவ்வளவு தொலைவில் துணை அமைய வாய்ப்புள்ளது?"
    },
    {
      labelEn: "Joint Family vs Separate Home",
      labelTa: "கூட்டுக் குடும்பமா / தனிக்குடித்தனமா",
      queryEn: "Will we live with my parents in a joint family or establish an independent household?",
      queryTa: "திருமணத்திற்குப் பின் பெற்றோருடன் கூட்டுக் குடும்பமாக வாழ்வேனா அல்லது தனிக்குடித்தனமா?"
    },
    {
      labelEn: "Career Growth in 2027",
      labelTa: "2027-ல் தொழில் வளர்ச்சி",
      queryEn: "When is my next major career opportunity according to my D10 and active Dasha?",
      queryTa: "என் தசாம்சம் (D10) மற்றும் தசா காலக்கோடு அடிப்படையில் அடுத்த தொழில் வாய்ப்பு எப்போது?"
    }
  ];

  const handleSuggestionClick = (query) => {
    setPromptInput(query);
  };

  const domainList = Object.entries(QUESTION_ONTOLOGY);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#FFFDF9] to-orange-500/10 border border-amber-300/80 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
            <span>{isTamil ? "ஆஸ்ட்ரோவர்ஸ் ஆழ்ந்த ஜோதிட ஆலோசனை மையம்" : "AstroVerse Deep Consultation Engine"}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReplayModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isTamil ? "வரலாற்று மறுஆய்வு (Backtest Replay)" : "Historical Backtest Replay"}</span>
            </button>

            {onOpenReport && chartData && (
              <button
                onClick={onOpenReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-stone-700 hover:text-stone-900 border border-amber-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>{isTamil ? "முழு அறிக்கை பார்க்க" : "View Full Report"}</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            {isTamil ? "உங்கள் ஜாதகம். உங்கள் கேள்விகள். முழுமையான ஜோதிட ஆலோசனை." : "Your Chart. Your Questions. Complete Astrological Consultation."}
          </h1>
          <p className="text-xs text-stone-600 max-w-3xl leading-relaxed mt-1">
            {isTamil
              ? "ஆஸ்ட்ரோவர்ஸ் அனுபவம் வாய்ந்த ஜோதிடரைப் போல உங்கள் கேள்விகளை ஆராய்கிறது: ஜன்ம வாக்குறுதி (Natal Promise), தசா புக்தி, கோச்சார தூண்டுதல்கள் மற்றும் வர்க்க சக்கரங்களை (D1-D60) ஒருங்கிணைத்து துல்லியமான காரண காரிய விளக்கத்தை அளிக்கிறது."
              : "AstroVerse operates like an expert consulting astrologer: determining natal promise, verifying dasha and transit triggers, cross-checking Vargas (D1–D60), searching counter-indicators, and explaining uncertainty transparently without false precision."}
          </p>
        </div>

        {/* 4 Certainty Layers Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
          <div className="p-2 rounded-xl bg-white/80 border border-amber-200/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <div>
              <div className="font-bold text-stone-900">Layer A: Astronomical</div>
              <div className="text-[10px] text-stone-500">Calculated position</div>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/80 border border-amber-200/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <div>
              <div className="font-bold text-stone-900">Layer B: Convention</div>
              <div className="text-[10px] text-stone-500">Lahiri / KP / Varga</div>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/80 border border-amber-200/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <div>
              <div className="font-bold text-stone-900">Layer C: Inference</div>
              <div className="text-[10px] text-stone-500">Shastric Karakatvas</div>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/80 border border-amber-200/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <div>
              <div className="font-bold text-stone-900">Layer D: Prediction</div>
              <div className="text-[10px] text-stone-500">Dasha / Transit Window</div>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1">
            {isTamil ? "முக்கிய கேள்விகள்:" : "Consultation Topics:"}
          </span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(isTamil ? s.queryTa : s.queryEn)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-200/90 text-stone-800 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            >
              {isTamil ? s.labelTa : s.labelEn}
            </button>
          ))}
          <button
            onClick={() => setShowQuestionBank(!showQuestionBank)}
            className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isTamil ? "100+ கேள்வி வங்கி (Question Bank)" : "Browse 100+ Question Bank"}</span>
          </button>
        </div>

        {/* Question Bank Accordion */}
        {showQuestionBank && (
          <div className="p-4 rounded-2xl bg-white border border-amber-300 shadow-sm space-y-4 animate-fadeIn">
            <div className="flex flex-wrap gap-2 border-b border-stone-100 pb-3">
              {domainList.map(([domKey, domObj]) => (
                <button
                  key={domKey}
                  onClick={() => setSelectedDomainKey(domKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDomainKey === domKey
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {isTamil ? domObj.nameTa : domObj.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {Object.entries(QUESTION_ONTOLOGY[selectedDomainKey]?.types || {}).map(([typeKey, typeObj]) => (
                <button
                  key={typeKey}
                  onClick={() => {
                    handleSuggestionClick(typeObj.keywords[0]);
                    setShowQuestionBank(false);
                  }}
                  className="p-2.5 rounded-xl text-left bg-amber-50/40 hover:bg-amber-100/70 border border-amber-200/60 text-stone-800 text-xs transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="font-semibold">{isTamil ? typeObj.titleTa : typeObj.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Embedded Follow-Up Conversational Q&A Component */}
      {chartData ? (
        <div className="rounded-3xl bg-white border border-amber-200/90 shadow-md overflow-hidden p-2 md:p-4">
          <FollowUpQuestions
            chartData={chartData}
            activeSection="fullReport"
            lang={lang}
            initialQuestion={promptInput}
            onSelectChapter={onOpenReport ? () => onOpenReport() : null}
            onCreditDeducted={onCreditDeducted}
          />
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-amber-200 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold text-stone-900">
            {isTamil ? "உரையாடலைத் தொடங்க ஜாதகத்தை கணிக்கவும்" : "Calculate Horoscope to Begin Consultation"}
          </h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
            {isTamil
              ? "உங்கள் பிறந்த நாள், நேரம் மற்றும் இடத்தை உள்ளிட்டு ஜாதகத்தை கணிக்கவும் அல்லது மாதிரி ஜாதகத்தை உடனே சோதிக்கவும்."
              : "Please enter your birth details or load the sample chart to activate chart-aware AI consultation answers."}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {onLoadDemoChart && (
              <button
                onClick={onLoadDemoChart}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition-all cursor-pointer"
              >
                {isTamil ? "மாதிரி ஜாதகத்தை ஏற்று (Demo)" : "Load Sample Chart (Chennai 1994)"}
              </button>
            )}
            {onNavigateToChart && (
              <button
                onClick={onNavigateToChart}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-stone-800 border border-amber-300 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                {isTamil ? "ஜாதகப் படிவத்திற்குச் செல்க" : "Go to Birth Form"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Historical Replay Modal */}
      <HistoricalReplayModal
        isOpen={showReplayModal}
        onClose={() => setShowReplayModal(false)}
        lang={lang}
      />
    </div>
  );
}
