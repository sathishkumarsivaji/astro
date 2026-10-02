import React from "react";
import { Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, BookOpen, Layers, Award, Clock, ArrowRight, ChevronRight } from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";

export default function EvidenceDrawerModal({
  isOpen,
  onClose,
  claimGraph,
  domainTitle = "Career & Timing",
  lang = "en"
}) {
  if (!isOpen || !claimGraph) return null;

  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const claims = claimGraph.claims || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-modal-title"
    >
      <div className="max-w-2xl w-full my-8 p-6 md:p-8 rounded-3xl bg-[#FFFDF9] border border-amber-300 relative space-y-6 shadow-2xl animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-2 text-sm font-bold rounded-full hover:bg-stone-100 transition-all"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="space-y-1 border-b border-amber-200/80 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>{isTamil ? "ஜோதிட ஆதார சங்கிலி & கணித சான்று" : "Structured Evidence Graph & Reasoning"}</span>
          </div>
          <h2 id="evidence-modal-title" className="text-2xl font-serif font-bold text-stone-900">
            {isTamil ? `ஏன் இந்த பலன்? (${domainTitle})` : `Why This Prediction? (${domainTitle})`}
          </h2>
          <p className="text-xs text-stone-600">
            {isTamil
              ? "ஆஸ்ட்ரோவர்ஸ் இயந்திரக் கற்றல் மாதிரியானது முன்கணிப்புகளைத் தானே உருவாக்குவதில்லை. இது துல்லியமான பராசர விதிகளின் அடிப்படையில் ஆதாரங்களை ஒருங்கிணைக்கிறது."
              : "AstroVerse does not invent astrological claims. Predictions are derived via deterministic multi-factor convergence rules."}
          </p>
        </div>

        {/* Convergence Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">{isTamil ? "ஆதார ஒருமைப்பாடு" : "Convergence Tier"}</span>
            <span className="font-bold text-sm text-amber-900">
              {claimGraph.overallConvergence ?? (isTamil ? "கணக்கிடப்படவில்லை" : "Not calculated")}
            </span>
            <span className="text-[10px] text-stone-500 block">
              {typeof claimGraph.overallConvergenceScore === "number" && Number.isFinite(claimGraph.overallConvergenceScore)
                ? `${(claimGraph.overallConvergenceScore * 100).toFixed(0)}% ${isTamil ? "ஒப்புதல்" : "Agreement"}`
                : (isTamil ? "ஒப்புதல் மதிப்பெண் இல்லை" : "Agreement score unavailable")}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">{isTamil ? "ஆதரவு காரணிகள்" : "Supporting Factors"}</span>
            <span className="font-bold text-sm text-emerald-800">
              {claims.reduce((acc, c) => acc + (c.premises?.length || 0), 0)} Verified
            </span>
            <span className="text-[10px] text-emerald-600 block">D1 + D10 + Dasha</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-center">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">{isTamil ? "மாற்றுக் குறியீடுகள்" : "Counter Factors"}</span>
            <span className="font-bold text-sm text-rose-800">
              {claims.reduce((acc, c) => acc + (c.counterIndicators?.length || 0), 0)} Recorded
            </span>
            <span className="text-[10px] text-rose-600 block">Delay & Aspects</span>
          </div>
        </div>

        {/* Claims DAG Node Breakdown */}
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {claims.map((claim, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                  <span>{claim.assertion}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {claim.convergenceLevel}
                </span>
              </div>

              {/* Premises */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">
                  {isTamil ? "கணக்கிடப்பட்ட மூல ஜாதக அம்சங்கள் (Premises):" : "Calculated Chart Premises:"}
                </span>
                {claim.premises.map((p, pIdx) => (
                  <div key={pIdx} className="p-2 rounded-xl bg-amber-50/40 border border-amber-200/50 flex items-center justify-between text-xs text-stone-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium">{p.factor}</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                      {p.role || p.varga}
                    </span>
                  </div>
                ))}
              </div>

              {/* Counter-indicators */}
              {claim.counterIndicators.length > 0 && (
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">
                    {isTamil ? "தாமதங்கள் மற்றும் எச்சரிக்கைகள் (Counter-indicators):" : "Counter-Indicators & Delays:"}
                  </span>
                  {claim.counterIndicators.map((c, cIdx) => (
                    <div key={cIdx} className="p-2 rounded-xl bg-rose-50/50 border border-rose-200/60 flex items-center gap-2 text-xs text-rose-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Classical Citations */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-amber-600" />
                  <span>{claim.traditionalCitations.join(" • ")}</span>
                </span>
                <span className="font-semibold text-stone-600">Sensitivity: {claim.birthTimeSensitivity}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-amber-200/80">
          <span className="text-[11px] text-stone-500 italic">
            {isTamil ? "சாஸ்திர ஆதார சரிபார்ப்பு எண்: EVD-V2-CONVERGENCE" : "Verified Evidence DAG: EVD-V2-CONVERGENCE"}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md hover:brightness-105 transition-all"
          >
            {isTamil ? "புரிந்தது" : "Understood"}
          </button>
        </div>
      </div>
    </div>
  );
}
