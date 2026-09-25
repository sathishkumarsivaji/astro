import React, { useState } from "react";
import {
  Sparkles,
  UserCheck,
  Briefcase,
  Heart,
  Award,
  Shield,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Home,
  GraduationCap,
  Users,
  HeartPulse,
  Info
} from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";

export default function LifeTimeline({ lifeStages, timeline, eventTiming, lang = "en" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";

  const [activeTab, setActiveTab] = useState("timeline"); // "timeline" | "events" | "overview"
  const [selectedEventDomain, setSelectedEventDomain] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState(null);

  const stageIcons = [
    UserCheck,
    Briefcase,
    Heart,
    Award,
    Shield,
    Sparkles
  ];

  const currentStages = (lifeStages || []).map(stage => ({
    period: isTamil ? (stage.tamilPeriod || stage.period) : stage.period,
    ageRange: stage.ageRange,
    years: stage.years,
    focus: isTamil ? (stage.tamilFocus || stage.focus) : stage.focus,
    prediction: isTamil ? (stage.tamilPrediction || stage.prediction) : stage.prediction
  }));

  const timelineList = Array.isArray(timeline) ? timeline : [];

  // Gather all event timing domains
  const eventDomains = [
    { key: "marriage", label: isTamil ? "திருமணம் / களத்திரம் (D9)" : "Marriage & Relationship (D9)", icon: Heart, data: eventTiming?.marriage },
    { key: "career", label: isTamil ? "தொழில் / உத்தியோகம் (D10)" : "Career & Leadership (D10)", icon: Briefcase, data: eventTiming?.career },
    { key: "property", label: isTamil ? "மனை / நிலம் / வாகனம் (D4)" : "Real Estate & Property (D4)", icon: Home, data: eventTiming?.property },
    { key: "education", label: isTamil ? "உயர் கல்வி / வித்யா (D24)" : "Higher Education (D24)", icon: GraduationCap, data: eventTiming?.education },
    { key: "progeny", label: isTamil ? "புத்திர பாக்கியம் / சந்தானம் (D7)" : "Progeny & Family (D7)", icon: Users, data: eventTiming?.progeny },
    { key: "health", label: isTamil ? "ஆரோக்கிய எச்சரிக்கை / தற்காப்பு (D6/D8)" : "Health Vulnerability & Care (D6/D8)", icon: HeartPulse, data: eventTiming?.health }
  ].filter(d => d.data && Array.isArray(d.data.candidateWindows) && d.data.candidateWindows.length > 0);

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-amber-50/80 rounded-2xl border border-amber-200/70">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 min-w-[140px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "timeline"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-amber-900 hover:bg-amber-100/70"
          }`}
        >
          <Calendar className="w-4 h-4" />
          {isTamil ? "120-ஆண்டு விம்சோத்தரி காலக்கோடு" : "120-Year Vimshottari Timeline"}
        </button>

        {eventDomains.length > 0 && (
          <button
            onClick={() => setActiveTab("events")}
            className={`flex-1 min-w-[140px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "events"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-900 hover:bg-amber-100/70"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {isTamil ? "வாழ்க்கை நிகழ்வு காலக்கட்டங்கள்" : "Dedicated Event Timing Horizons"}
          </button>
        )}

        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 min-w-[140px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "overview"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-amber-900 hover:bg-amber-100/70"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          {isTamil ? "வாழ்க்கை பருவங்கள் சுருக்கம்" : "Life Stage Overview"}
        </button>
      </div>

      {/* 1. Full 120-Year Vimshottari Timeline */}
      {activeTab === "timeline" && (
        <div className="p-6 rounded-3xl bg-white border border-amber-300 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                {isTamil ? "முழுமையான விம்சோத்தரி தசா-புக்தி காலக்கோடு (0-120 ஆண்டுகள்)" : "Complete Classical Vimshottari Dasha-Antardasha Timeline (0-120 Years)"}
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                {isTamil
                  ? "பாரம்பரிய பராசர முறைப்படி தசா, அந்தர்தசா (புக்தி), பிரத்யந்தர தசா மற்றும் கிரக பெயர்ச்சி அமைப்புகள்."
                  : "Authentic Parashari chronological timeline detailing Mahadashas, Antardashas, Pratyantardashas, and planetary transits."}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
              {timelineList.length > 0 ? `${timelineList.length} ${isTamil ? "காலக்கட்டங்கள்" : "Periods"}` : ""}
            </span>
          </div>

          <div className="relative border-l-2 border-amber-300 ml-4 md:ml-8 pl-6 md:pl-8 space-y-6 my-6">
            {timelineList.map((stage, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div key={`${stage.stageId || idx}`} className="relative group">
                  <div className="absolute -left-[35px] md:-left-[43px] top-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#FFFDF9] border-2 border-amber-500 text-amber-700 flex items-center justify-center shadow-md shadow-amber-500/10 group-hover:scale-110 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>

                  <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-amber-200/90 group-hover:border-amber-400 shadow-sm transition-all space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        {isTamil ? `வயது ${stage.ageRange}${stage.years ? ` (${stage.years})` : ''}` : `Age ${stage.ageRange}${stage.years ? ` (${stage.years})` : ''}`}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {stage.theme && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[11px] font-bold text-amber-900 border border-amber-300">
                            {stage.theme}
                          </span>
                        )}
                        {Array.isArray(stage.secondaryThemes) && stage.secondaryThemes.slice(0, 2).map((st, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 rounded-full bg-stone-100 text-[10px] font-medium text-stone-700 border border-stone-200">
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h4 className="text-base font-serif font-bold text-stone-900">
                      {stage.title}
                    </h4>

                    {stage.dashaTrigger && (
                      <p className="text-xs font-medium text-amber-700">
                        {stage.dashaTrigger}
                      </p>
                    )}

                    {stage.peakWindow && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {isTamil ? "உச்ச பிரத்யந்தர காலம்:" : "Peak Activation Sub-Window:"} <strong className="font-bold text-emerald-950">{stage.peakWindow.peakLordTamil || stage.peakWindow.peakLord} PD</strong>
                          {stage.peakWindow.peakStartDateIso && stage.peakWindow.peakEndDateIso ? ` (${stage.peakWindow.peakStartDateIso} — ${stage.peakWindow.peakEndDateIso})` : ''}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-stone-700 leading-relaxed">
                      {stage.prediction}
                    </p>

                    {/* Expandable Technical Evidence */}
                    <div className="pt-2 border-t border-amber-100">
                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded
                          ? (isTamil ? "ஜோதிட ஆதாரங்களை மறை" : "Hide Astrological Evidence")
                          : (isTamil ? "ஜோதிட ஆதாரங்கள் & பிரத்யந்தர தசா" : "View Astrological Evidence & Pratyantardashas")}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-3">
                          {stage.pratyantardashas && stage.pratyantardashas.length > 0 && (
                            <div>
                              <span className="font-bold text-stone-800 block mb-1">
                                {isTamil ? "பிரத்யந்தர தசா வரிசை:" : "Pratyantardasha Sub-Cycles:"}
                              </span>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 text-[11px]">
                                {stage.pratyantardashas.map((pd, pIdx) => (
                                  <div key={pIdx} className="p-1.5 rounded-lg bg-white/80 border border-amber-100">
                                    <span className="font-bold text-amber-900">{pd.lord}:</span> {pd.durationDays} {isTamil ? "நாட்கள்" : "days"}
                                    {pd.startDateIso ? <span className="block text-[9px] text-stone-500">{pd.startDateIso}</span> : null}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Classical Astrological Evidence Breakdown */}
                          {stage.astrologicalEvidence && (
                            <div className="space-y-2 pt-1">
                              {/* Natal Promise */}
                              {Array.isArray(stage.astrologicalEvidence.natalPromise) && stage.astrologicalEvidence.natalPromise.length > 0 && (
                                <div>
                                  <span className="font-bold text-stone-800 block text-[11px]">
                                    {isTamil ? "ஜாதக பாவக அமைப்பு (Natal Promise):" : "Natal Promise & House Lordships:"}
                                  </span>
                                  <ul className="list-disc list-inside text-stone-600 text-[11px] space-y-0.5">
                                    {stage.astrologicalEvidence.natalPromise.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Dasha Signification */}
                              {Array.isArray(stage.astrologicalEvidence.dashaSignification) && stage.astrologicalEvidence.dashaSignification.length > 0 && (
                                <div>
                                  <span className="font-bold text-stone-800 block text-[11px]">
                                    {isTamil ? "தசா-புக்தி தொடர்பு (Dasha Dynamics):" : "Dasha Sambandha & Activation:"}
                                  </span>
                                  <ul className="list-disc list-inside text-stone-600 text-[11px] space-y-0.5">
                                    {stage.astrologicalEvidence.dashaSignification.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Varga Confirmation */}
                              {Array.isArray(stage.astrologicalEvidence.vargaConfirmation) && stage.astrologicalEvidence.vargaConfirmation.length > 0 && (
                                <div>
                                  <span className="font-bold text-stone-800 block text-[11px]">
                                    {isTamil ? "வர்க்க சக்கர உறுதி (Varga Confirmation):" : "Divisional Varga Confirmations (D9/D10):"}
                                  </span>
                                  <ul className="list-disc list-inside text-stone-600 text-[11px] space-y-0.5">
                                    {stage.astrologicalEvidence.vargaConfirmation.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Transit Events */}
                              {Array.isArray(stage.astrologicalEvidence.transitEvents) && stage.astrologicalEvidence.transitEvents.length > 0 && (
                                <div>
                                  <span className="font-bold text-stone-800 block text-[11px]">
                                    {isTamil ? "துல்லிய கோச்சார பெயர்ச்சி நிகழ்வுகள் (Transit Crossings):" : "Active Transit Ingress & Aspect Crossings:"}
                                  </span>
                                  <ul className="list-disc list-inside text-stone-600 text-[11px] space-y-0.5">
                                    {stage.astrologicalEvidence.transitEvents.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Fallback if passed as simple array */}
                              {Array.isArray(stage.astrologicalEvidence) && stage.astrologicalEvidence.length > 0 && (
                                <div>
                                  <span className="font-bold text-stone-800 block text-[11px]">
                                    {isTamil ? "ஜோதிட ஆதாரங்கள்:" : "Astrological Evidence Factors:"}
                                  </span>
                                  <ul className="list-disc list-inside text-stone-600 text-[11px] space-y-0.5">
                                    {stage.astrologicalEvidence.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Dedicated Event Timing Horizons */}
      {activeTab === "events" && (
        <div className="p-6 rounded-3xl bg-white border border-amber-300 shadow-md space-y-6">
          <div>
            <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              {isTamil ? "வாழ்வியல் முக்கிய நிகழ்வுகளின் காலக்கணிப்பு" : "Dedicated Life Event Timing Horizons"}
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              {isTamil
                ? "இராசி சக்கரம் (D1) மற்றும் வர்க்க சக்கரங்கள் (D4, D7, D9, D10, D24) அடிப்படையிலான துல்லியமான காலக்கணிப்பு."
                : "Calibrated multi-varga activation windows across D1 Rasi and divisional charts (D4, D7, D9, D10, D24)."}
            </p>
          </div>

          {/* Domain Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedEventDomain("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedEventDomain === "all"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              {isTamil ? "அனைத்து துறைகளும்" : "All Event Domains"}
            </button>
            {eventDomains.map(d => (
              <button
                key={d.key}
                onClick={() => setSelectedEventDomain(d.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedEventDomain === d.key
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                }`}
              >
                <d.icon className="w-3.5 h-3.5" />
                {d.label}
              </button>
            ))}
          </div>

          {/* Render Domain Windows */}
          <div className="space-y-6">
            {eventDomains
              .filter(d => selectedEventDomain === "all" || selectedEventDomain === d.key)
              .map(domain => {
                const Icon = domain.icon;
                const windows = domain.data?.candidateWindows || [];
                const natalPromise = domain.data?.natalPromise;

                return (
                  <div key={domain.key} className="p-5 rounded-2xl bg-[#FFFDF9] border border-amber-200/90 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-serif font-bold text-stone-900">{domain.label}</h4>
                          <p className="text-xs text-stone-600">{domain.data?.summary}</p>
                        </div>
                      </div>
                      {natalPromise?.status && (
                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                          {natalPromise.status}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {windows.map((w, wIdx) => (
                        <div key={w.windowId || wIdx} className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-sm space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="text-xs font-bold text-amber-900">
                              {isTamil ? `வயது ${w.startAge.toFixed(1)} - ${w.endAge.toFixed(1)}` : `Age ${w.startAge.toFixed(1)} - ${w.endAge.toFixed(1)}`}
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              {w.lifePhase && (
                                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-medium border border-stone-200">
                                  {w.lifePhase}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                                {w.evidenceLevel}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs font-semibold text-stone-800">
                            {w.mahadashaLord} MD - {w.antardashaLord} AD
                            {w.startDateIso && w.endDateIso ? ` (${w.startDateIso} to ${w.endDateIso})` : ''}
                          </div>

                          {w.peakWindow && (
                            <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 space-y-0.5">
                              <div className="font-bold text-emerald-950 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                {isTamil ? "உச்ச காலக்கட்டம் (Peak Sub-Window):" : "Peak Activation Horizon:"} {w.peakWindow.peakLordTamil || w.peakWindow.peakLord} PD
                              </div>
                              <div className="text-[10px] text-emerald-800">
                                {w.peakWindow.peakStartDateIso} — {w.peakWindow.peakEndDateIso} (Age {w.peakWindow.peakStartAge.toFixed(1)} - {w.peakWindow.peakEndAge.toFixed(1)})
                              </div>
                              {w.peakWindow.reason && (
                                <div className="text-[10px] text-stone-600 italic">
                                  {w.peakWindow.reason}
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-stone-600 leading-relaxed">
                            {w.recommendation || w.prediction}
                          </p>

                          {w.vargaConfirmation && (
                            <div className="text-[11px] text-amber-800 flex items-center gap-1 font-medium">
                              <Info className="w-3.5 h-3.5 text-amber-600" />
                              {w.vargaConfirmation}
                            </div>
                          )}

                          {Array.isArray(w.transitConcurrence) && w.transitConcurrence.length > 0 && (
                            <div className="pt-1 border-t border-amber-50">
                              <span className="text-[10px] font-bold text-stone-700 block mb-1">
                                {isTamil ? "கோச்சார பெயர்ச்சி நிகழ்வுகள்:" : "Active Transit Crossings in Window:"}
                              </span>
                              <div className="space-y-1">
                                {w.transitConcurrence.slice(0, 3).map((tr, trIdx) => (
                                  <div key={trIdx} className="text-[10px] text-stone-600 bg-amber-50/50 px-2 py-0.5 rounded border border-amber-100 flex items-center justify-between">
                                    <span>{isTamil ? tr.summaryTa : tr.summaryEn}</span>
                                    <span className="text-[9px] font-semibold text-amber-800">{tr.motion}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. Overview Stages */}
      {activeTab === "overview" && (
        <div className="p-6 rounded-3xl bg-white border border-amber-300 shadow-md space-y-4">
          <div>
            <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              {t.sixStageTitle}
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              {t.sixStageDesc}
            </p>
          </div>

          <div className="relative border-l-2 border-amber-300 ml-4 md:ml-8 pl-6 md:pl-8 space-y-8 my-6">
            {currentStages.map((stage, idx) => {
              const Icon = stageIcons[idx] || Sparkles;
              return (
                <div key={stage.period} className="relative group">
                  <div className="absolute -left-[35px] md:-left-[43px] top-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#FFFDF9] border-2 border-amber-500 text-amber-700 flex items-center justify-center shadow-md shadow-amber-500/10 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-amber-200/90 group-hover:border-amber-400 shadow-sm transition-all space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        {isTamil ? `வயது ${stage.ageRange}${stage.years ? ` (${stage.years})` : ''}` : `Age ${stage.ageRange}${stage.years ? ` (${stage.years})` : ''}`}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-[11px] font-semibold text-amber-900 border border-amber-200">
                        {stage.focus}
                      </span>
                    </div>

                    <h4 className="text-base font-serif font-bold text-stone-900">
                      {stage.period}
                    </h4>

                    <p className="text-xs text-stone-700 leading-relaxed">
                      {stage.prediction}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
