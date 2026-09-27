import React, { useState } from "react";
import { MessageSquare, Sparkles, Send, ArrowRight, ShieldCheck, Compass, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import FollowUpConversation from "../Horoscope/FollowUpConversation";
import { TRANSLATIONS } from "../../services/localization";

export default function AskAstroVerseView({
  chartData,
  lang = "en",
  initialQuery = null,
  onOpenReport = null
}) {
  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [promptInput, setPromptInput] = useState(initialQuery || "");

  const SUGGESTIONS = [
    {
      labelEn: "Career Growth in 2027",
      labelTa: "2027-ல் தொழில் வளர்ச்சி",
      queryEn: "When is my next major career opportunity according to my D10 and active Dasha?",
      queryTa: "என் தசாம்சம் (D10) மற்றும் தசா காலக்கோடு அடிப்படையில் அடுத்த தொழில் வாய்ப்பு எப்போது?"
    },
    {
      labelEn: "Why Saturn Delay?",
      labelTa: "சனி பகவான் தாக்கம் ஏன்?",
      queryEn: "Why is Saturn exerting influence on my 10th house or career timing?",
      queryTa: "சனி பகவான் என் 10-ம் பாவகம் அல்லது தொழிலில் ஏன் செல்வாக்கு செலுத்துகிறார்?"
    },
    {
      labelEn: "Marriage & 7th Lord",
      labelTa: "திருமண காலம் & 7-ம் அதிபதி",
      queryEn: "What are the prime marriage timing windows in my chart and what does D9 show?",
      queryTa: "என் ஜாதகத்தில் முக்கிய திருமண காலக்கட்டங்கள் எவை மற்றும் நவாம்சம் (D9) என்ன கூறுகிறது?"
    },
    {
      labelEn: "Property & Vehicles",
      labelTa: "பூமி & சொத்து யோகம்",
      queryEn: "Which upcoming years indicate favorable indicators for property acquisition?",
      queryTa: "நிலம் அல்லது வீடு வாங்க எந்த காலகட்டம் சாதகமாக உள்ளது?"
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#FFFDF9] to-orange-500/10 border border-amber-300/80 shadow-md space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
          <span>{isTamil ? "ஆஸ்ட்ரோவர்ஸ் உரையாடல் ஆலோசகர்" : "AstroVerse Conversational Intelligence"}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
          {isTamil ? "உங்கள் ஜாதகம். உங்கள் கேள்விகள். தெளிவான விளக்கம்." : "Your Chart. Your Timing. Your Questions. Explained."}
        </h1>
        <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">
          {isTamil
            ? "ஆஸ்ட்ரோவர்ஸ் AI ஒரு கற்பனையான ஜோதிடர் அல்ல; இது உங்கள் துல்லியமான எபிமெரிஸ் கணக்கீடுகள் மற்றும் சாஸ்திர ஆதார சங்கிலிகளை (Evidence Chains) விளக்கும் நுண்ணறிவு வழிகாட்டியாகும்."
            : "The LLM does not invent astrology; it explains your mathematically verified birth chart, active dasha periods, and evidence convergence."}
        </p>

        {/* Quick Suggestion Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1">
            {isTamil ? "பரிந்துரைகள்:" : "Suggested:"}
          </span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setPromptInput(isTamil ? s.queryTa : s.queryEn)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-200/90 text-stone-800 text-xs font-semibold transition-all shadow-2xs"
            >
              {isTamil ? s.labelTa : s.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Follow-Up Conversational Q&A Component */}
      {chartData ? (
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-amber-200/90 shadow-md">
          <FollowUpConversation
            chartData={chartData}
            activeSectionId="fullReport"
            lang={lang}
            initialQuestion={promptInput}
          />
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-amber-200 text-center space-y-3 shadow-sm">
          <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-lg font-serif font-bold text-stone-900">
            {isTamil ? "உரையாடலைத் தொடங்க ஜாதகத்தை கணிக்கவும்" : "Calculate Horoscope to Begin AI Conversation"}
          </h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            {isTamil
              ? "முகப்புப் பக்கத்தில் உங்கள் பிறந்த நாள், நேரம் மற்றும் இடத்தை உள்ளிட்டு ஜாதகத்தை கணிக்கவும்."
              : "Please enter your birth details in the Home or My Chart tab to activate personal chart-aware conversation."}
          </p>
        </div>
      )}
    </div>
  );
}
