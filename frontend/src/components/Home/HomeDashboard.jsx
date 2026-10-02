import React, { useState } from "react";
import {
  Sparkles,
  Sun,
  Moon,
  Compass,
  Briefcase,
  Heart,
  Coins,
  Activity,
  ArrowRight,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  Flame,
  Award,
  HelpCircle,
  TrendingUp,
  Info
} from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";
import BirthChartForm from "../Horoscope/BirthChartForm";
import EvidenceDrawerModal from "../Common/EvidenceDrawerModal";
import { buildStructuredClaimGraph } from "../../services/claimGraphEngine";

export default function HomeDashboard({
  chartData,
  birthProfile,
  lang = "en",
  onCalculate,
  onOpenReport,
  onOpenAsk,
  onOpenCert,
  onSelectPrompt,
  userCredits
}) {
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("career");
  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const todayDate = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const formattedToday = todayDate.toLocaleDateString(isTamil ? "ta-IN" : "en-US", options);

  const curDasha = chartData?.currentDasha || null;
  const dashaLord = curDasha?.lord ?? null;
  const antardashaLord = curDasha?.bukthis?.find(b => b.isCurrent)?.lord ?? curDasha?.currentAntar ?? null;
  const moonSign = chartData?.moonSign?.name ?? (typeof chartData?.moonSign === "string" ? chartData.moonSign : null);
  const ascSign = chartData?.ascendantSign?.name ?? (typeof chartData?.ascendantSign === "string" ? chartData.ascendantSign : null);

  // Daily Curated Focus Metrics (Qualitative Traditional Indicators)
  const DAILY_THEMES = [
    {
      id: "career",
      title: isTamil ? "தொழில் & காரியம் (Career)" : "Career & Focus",
      icon: Briefcase,
      rating: "★★★★☆",
      color: "text-amber-700 bg-amber-50 border-amber-200",
      indicator: isTamil
        ? (dashaLord ? `தற்போது ${dashaLord} தசா செல்வாக்குடன் 10-ம் பாவ தொழில் சார்ந்த திட்டமிடலுக்கு சாதகமான நாள்.` : "தொழில் சார்ந்த திட்டமிடலுக்கு சாதகமான நாள்.")
        : (dashaLord ? `Active ${dashaLord} Mahadasha favors strategic execution and vocational leadership today.` : "Favorable period for strategic execution and vocational leadership.")
    },
    {
      id: "relationships",
      title: isTamil ? "உறவுகள் & குடும்பம் (Relationships)" : "Relationships & Harmony",
      icon: Heart,
      rating: "★★★★☆",
      color: "text-rose-700 bg-rose-50 border-rose-200",
      indicator: isTamil
        ? "சந்திரனின் சஞ்சாரம் உணர்ச்சிப் புரிதலையும் உரையாடல்களையும் இனிமையாக்கும்."
        : (moonSign ? `Moon transit relative to natal ${moonSign} encourages empathetic dialogue and emotional clarity.` : "Transit Moon encourages empathetic dialogue and emotional clarity.")
    },
    {
      id: "money",
      title: isTamil ? "நிதி & முதலீடு (Money & Wealth)" : "Money & Planning",
      icon: Coins,
      rating: "★★★★★",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      indicator: isTamil
        ? "அவசர நிதி முடிவுகளைத் தவிர்த்து நிலையான வரவு-செலவு திட்டமிடலுக்கு உகந்த நாள்."
        : "Favorable day for structured budgeting and evaluating long-term asset security."
    },
    {
      id: "energy",
      title: isTamil ? "உடல் ஆற்றல் & சிந்தனை (Vitality)" : "Vitality & Energy",
      icon: Activity,
      rating: "★★★☆☆",
      color: "text-purple-700 bg-purple-50 border-purple-200",
      indicator: isTamil
        ? "அமைதியான சிந்தனை, தியானம் மற்றும் உடல் புத்துணர்ச்சிக்கு முன்னுரிமை அளியுங்கள்."
        : "Chart indicates reflective, inward focus rather than high-strain physical exertion."
    }
  ];

  // Quick Curated Follow-Up Inquiries
  const CURATED_QUESTIONS = [
    {
      qEn: "When is my next major career opportunity?",
      qTa: "எனது அடுத்த முக்கியமான தொழில் வாய்ப்பு எப்போது வரும்?",
      domain: "career"
    },
    {
      qEn: "Why has my career felt slow recently?",
      qTa: "சமீபகாலமாக என் தொழிலில் ஏன் மந்தநிலை நிலவுகிறது?",
      domain: "career"
    },
    {
      qEn: "What does the year 2027 look like for me?",
      qTa: "2027-ம் ஆண்டு எனக்கு எவ்வாறு அமையக்கூடும்?",
      domain: "timeline"
    },
    {
      qEn: "Will my relationship and family life improve?",
      qTa: "எனது திருமண மற்றும் குடும்ப வாழ்க்கை எப்போது மேலோங்கும்?",
      domain: "relationships"
    },
    {
      qEn: "Explain my current Mahadasha and Antardasha.",
      qTa: "எனது தற்போதைய மகா தசை மற்றும் அந்தர தசையின் பலன்களை விளக்குங்கள்.",
      domain: "dasha"
    },
    {
      qEn: "Which upcoming years are most auspicious for property?",
      qTa: "நிலம் அல்லது வீடு வாங்க எந்த வருடங்கள் மிக சாதகமானவை?",
      domain: "property"
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. If No Chart Data: Show Friendly Welcome Onboarding Form */}
      {!chartData ? (
        <div className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto pt-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{isTamil ? "தனிப்பயனாக்கப்பட்ட ஜோதிட நுண்ணறிவு" : "Personal Astrology Intelligence"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-900 leading-tight">
              {isTamil ? "உங்கள் ஜாதகம். உங்கள் காலக்கோடு. தெளிவான விளக்கம்." : "Calculate Precisely. Explain Transparently. Understand Your Timing."}
            </h1>
            <p className="text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
              {isTamil
                ? "சுவிஸ்/நாசா எபிமெரிஸ் கணிப்புத் துல்லியம் மற்றும் வேத சாஸ்திர ஆதாரங்களுடன் கூடிய உலகத்தரம் வாய்ந்த ஜோதிட தளம்."
                : "A world-class personal astrology platform grounded in high-precision astronomy, transparent evidence chains, and AI explanations."}
            </p>
          </div>

          <BirthChartForm onCalculate={onCalculate} initialProfile={birthProfile} lang={lang} />
        </div>
      ) : (
        /* 2. Active User Dashboard: Daily Cosmic Briefing */
        <div className="space-y-8">
          {/* Top Cosmic Briefing Hero Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-amber-500/15 via-[#FFFDF9] to-orange-500/10 border border-amber-300/80 shadow-md relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/80 pb-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isTamil ? "தினசரி வானியல் சுருக்கம்" : "Your Cosmic Briefing"}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                  {isTamil ? `வணக்கம், ${birthProfile?.name || "ஜாதகர்"}!` : `Good Day, ${birthProfile?.name || "Friend"}!`}
                </h1>
                <p className="text-xs text-stone-600 font-medium">
                  {formattedToday} • {isTamil ? `லக்னம்: ${ascSign || "கணக்கிடப்படவில்லை"} | ராசி: ${moonSign || "கணக்கிடப்படவில்லை"}` : `Lagna: ${ascSign || "Not available"} | Moon: ${moonSign || "Not available"}`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={onOpenCert}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-stone-800 border border-amber-300 font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                  title="View Verified Calculation Certificate"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isTamil ? "சான்றிதழ் (Certificate)" : "Calculation Certificate"}</span>
                </button>

                <button
                  onClick={onOpenReport}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-105 flex items-center gap-2 transition-all"
                >
                  <FileText className="w-4 h-4 text-amber-100" />
                  <span>{isTamil ? "முழு அறிக்கை (Full Dossier)" : "View Full Report"}</span>
                </button>
              </div>
            </div>

            {/* 4 Life Themes Quadrant */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isTamil ? "இன்றைய தின பலன் கூறுகள் (Today's Indicators):" : "Today's Qualitative Focus Areas:"}</span>
                </h3>
                <span className="text-[11px] text-stone-500 italic">
                  {isTamil ? "பாரம்பரிய ஜோதிட குறியீடுகள் (Traditional Qualitative Guidance)" : "Traditional Qualitative Guidance"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DAILY_THEMES.map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <div
                      key={theme.id}
                      className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-sm space-y-2 hover:border-amber-300 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl ${theme.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-serif font-bold text-sm text-stone-900">{theme.title.split("(")[0]}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-600">{theme.rating}</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {theme.indicator}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* What Changed Today in Your Chart */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                    {isTamil ? "உங்கள் ஜாதகத்தில் இன்று என்ன மாறியுள்ளது?" : "What Changed in Your Chart Today?"}
                  </span>
                </div>
                <p className="text-xs text-stone-700">
                  {dashaLord && antardashaLord
                    ? (isTamil
                        ? `தற்போது இயங்கும் விம்சோத்தரி தசா: ${dashaLord} மகா தசை / ${antardashaLord} புக்தி.${moonSign ? ` சந்திரன் உங்கள் ஜென்ம ராசியான ${moonSign}-ல் சஞ்சரிக்கிறது.` : ""}`
                        : `Active Vimshottari period: ${dashaLord} Mahadasha / ${antardashaLord} Antardasha.${moonSign ? ` Moon transits relative to your natal ${moonSign} sign.` : ""}`)
                    : (isTamil
                        ? "விம்சோத்தரி தசா விவரங்கள் மற்றும் நடப்பு கோசார நிலைகள் உங்கள் முழு அறிக்கையில் கிடைக்கின்றன."
                        : "Vimshottari Dasha and active planetary transits are available in your full dossier.")}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedDomain("career");
                  setIsEvidenceOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>{isTamil ? "ஏன்? ஆதார சங்கிலி (Why?)" : "Why this matters? (Evidence)"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ask AstroVerse Quick AI Prompts */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-amber-200/90 shadow-md space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isTamil ? "ஆஸ்ட்ரோவர்ஸிடம் கேளுங்கள்" : "Ask AstroVerse"}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900">
                  {isTamil ? "உங்கள் ஜாதகம் பற்றி என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?" : "What Would You Like to Know Today?"}
                </h2>
                <p className="text-xs text-stone-600">
                  {isTamil
                    ? "கீழே உள்ள கேள்விகளில் ஒன்றை தேர்வு செய்யவும் அல்லது உங்கள் சொந்த கேள்வியை கேட்கவும்:"
                    : "Select a curated inquiry below or type any personalized astrological question:"}
                </p>
              </div>

              <button
                onClick={onOpenAsk}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition-all"
              >
                <span>{isTamil ? "முழு உரையாடல்" : "Open Full Assistant"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Prompt Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CURATED_QUESTIONS.map((item, idx) => {
                const qText = isTamil ? item.qTa : item.qEn;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectPrompt(qText)}
                    className="p-4 rounded-2xl bg-amber-50/40 hover:bg-amber-100/70 border border-amber-200/70 text-left transition-all group flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <span className="text-xs font-semibold text-stone-800 group-hover:text-amber-950 leading-snug">
                      "{qText}"
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-amber-700 font-bold">
                      <span className="uppercase tracking-wider">{item.domain}</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {isTamil ? "கேள்" : "Ask"} <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Evidence Drawer Modal */}
          <EvidenceDrawerModal
            isOpen={isEvidenceOpen}
            onClose={() => setIsEvidenceOpen(false)}
            claimGraph={chartData ? buildStructuredClaimGraph(selectedDomain, { chart: chartData, report: chartData, system: { id: chartData.system || "lahiri" } }) : null}
            domainTitle={selectedDomain === "career" ? "Career & Dasha Activation" : "Astrological Timing"}
            lang={lang}
          />
        </div>
      )}
    </div>
  );
}
