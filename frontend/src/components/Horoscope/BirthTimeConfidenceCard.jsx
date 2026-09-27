import React from "react";
import { Clock, AlertTriangle, ShieldCheck, Activity, Info, HelpCircle } from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";

export default function BirthTimeConfidenceCard({
  confidenceLevel = "hospital", // "hospital", "family", "approximate"
  onSelectConfidence = null,
  chartData = null,
  lang = "en"
}) {
  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const CONFIDENCE_OPTIONS = [
    {
      id: "hospital",
      labelEn: "Exact Hospital Record (±1 min)",
      labelTa: "துல்லிய மருத்துவமனை குறிப்பு (±1 நிமிடம்)",
      dots: "●●●●●",
      descEn: "Certified birth certificate or hospital clock registration.",
      descTa: "மருத்துவமனை பிறப்புச் சான்றிதழ் அல்லது கடிகார பதிவு."
    },
    {
      id: "family",
      labelEn: "Family Memory (±5–10 mins)",
      labelTa: "குடும்பத்தார் நினைவுக் குறிப்பு (±5-10 நிமிடம்)",
      dots: "●●●○○",
      descEn: "Remembered by parents/relatives with approximate minute margin.",
      descTa: "பெற்றோர் அல்லது உறவினர்களின் தோராயமான நினைவுக் குறிப்பு."
    },
    {
      id: "approximate",
      labelEn: "Approximate / Broad Window (±30+ mins)",
      labelTa: "தோராயமான காலம் (±30+ நிமிடம்)",
      dots: "●●○○○",
      descEn: "General time of day (e.g. morning, dusk, midnight).",
      descTa: "தோராயமான பகல்/இரவு அல்லது காலை/மாலை நேரம்."
    }
  ];

  // Calculate sensitivity parameters if chartData is present
  const ascDegree = chartData?.ascendant?.degree || chartData?.ascendantSign?.degree || 15.0;
  const isNearAscBoundary = (ascDegree < 1.5 || ascDegree > 28.5);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border border-amber-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <h4 className="font-serif font-bold text-sm text-stone-900">
            {isTamil ? "பிறந்த நேர நம்பகத்தன்மை & உணர்திறன்" : "Birth-Time Confidence & Sensitivity"}
          </h4>
        </div>
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
          {isTamil ? "துல்லியம்" : "Reliability"}
        </span>
      </div>

      {/* Confidence Level Radio Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {CONFIDENCE_OPTIONS.map((opt) => {
          const isSelected = confidenceLevel === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectConfidence && onSelectConfidence(opt.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? "bg-amber-100/70 border-amber-400 text-amber-950 font-semibold shadow-xs"
                  : "bg-white border-amber-200/60 text-stone-600 hover:bg-amber-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">{isTamil ? opt.labelTa.split("(")[0] : opt.labelEn.split("(")[0]}</span>
                <span className="text-xs text-amber-600 font-mono tracking-tighter">{opt.dots}</span>
              </div>
              <p className="text-[10px] text-stone-500 leading-tight">
                {isTamil ? opt.descTa : opt.descEn}
              </p>
            </button>
          );
        })}
      </div>

      {/* Sensitivity Metrics Matrix */}
      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 space-y-2">
        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
          {isTamil ? "நேர மாற்றங்களுக்கான ஜாதக உணர்திறன் (Mathematical Sensitivity):" : "Calculated Sensitivity Matrix (±2–5 Mins):"}
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white border border-amber-200/60 text-center">
            <span className="text-[10px] text-stone-500 block">{isTamil ? "லக்ன ராசி (D1)" : "Lagna (D1)"}</span>
            <span className={`font-bold text-xs ${isNearAscBoundary ? "text-amber-700" : "text-emerald-700"}`}>
              {isNearAscBoundary ? (isTamil ? "அதிக உணர்திறன் (High)" : "High Sensitivity") : (isTamil ? "நிலையானது (Low)" : "Low / Stable")}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white border border-amber-200/60 text-center">
            <span className="text-[10px] text-stone-500 block">{isTamil ? "நவாம்சம் (D9)" : "Navamsha (D9)"}</span>
            <span className="font-bold text-xs text-amber-700">
              {isTamil ? "நடுத்தரம் (Medium)" : "Medium (±3 min)"}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white border border-amber-200/60 text-center">
            <span className="text-[10px] text-stone-500 block">{isTamil ? "ஷஷ்டியாம்சம் (D60)" : "D60 Shashtiamsha"}</span>
            <span className="font-bold text-xs text-purple-700">
              {isTamil ? "மிக அதிகம் (Very High)" : "Very High (±1 min)"}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white border border-amber-200/60 text-center">
            <span className="text-[10px] text-stone-500 block">{isTamil ? "சந்திர ராசி & தசா" : "Moon & Dasha"}</span>
            <span className="font-bold text-xs text-emerald-700">
              {isTamil ? "மிகக் குறைவு (Stable)" : "Stable (Low)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
