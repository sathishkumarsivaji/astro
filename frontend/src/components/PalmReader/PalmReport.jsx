import React, { useState } from "react";
import { Download, Heart, Brain, Activity, Compass } from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";

export default function PalmReport({ telemetry, onRetake, lang = "en" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";

  if (!telemetry) return null;
  const { handType, handDuality, mounts, lines, confidenceScore, handShape } = telemetry;

  const MOUNT_NAMES_TAMIL = {
    "Mount of Jupiter": "குரு மேடு (வியாழன்)",
    "Mount of Saturn": "சனி மேடு",
    "Mount of Apollo (Sun)": "சூரிய மேடு",
    "Mount of Mercury": "புதன் மேடு",
    "Mount of Venus": "சுக்கிர மேடு",
    "Mount of Luna (Moon)": "சந்திர மேடு"
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Report Header Card */}
      <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-300">
                {telemetry?.readingMode === "telemetry_assisted"
                  ? (isTamil ? "வழிகாட்டல் கைரேகை ஆய்வு" : "Telemetry-Assisted Palm Feature Analysis")
                  : (isTamil ? "மாதிரி கைரேகை ஆய்வு (முன்வடிவம்)" : "Illustrative Palmistry Prototype")}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-300">
                {confidenceScore !== null ? `${confidenceScore}% ${t.accuracy}` : (isTamil ? "மாதிரி ஆய்வு (அளவீடு இல்லை)" : "Illustrative Archetype (Not Measured)")}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
              {isTamil ? (handType === "left" ? "இடது கை: பிறவி யோகம் & பூர்வ புண்ணியம்" : "வலது கை: செயல் விதி & தற்கால வாழ்க்கை") : handDuality.role}
            </h2>
            <p className="text-sm text-stone-700 mt-2 max-w-xl leading-relaxed">
              {isTamil 
                ? (handType === "left" 
                    ? "உங்கள் பூர்வ புண்ணிய ஆற்றல், பிறவி குணங்கள் மற்றும் ஆழ்மன விருப்பங்களை காட்டுகிறது." 
                    : "நீங்கள் சுயமாக உழைத்து உருவாக்கிய விதியை, தொழில் வெற்றியை மற்றும் தற்கால வாழ்க்கை போக்கை காட்டுகிறது.")
                : handDuality.summary}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRetake}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-800 text-xs font-semibold border border-amber-300 transition-all shadow-sm"
            >
              {t.scanOtherHand}
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t.downloadReport}
            </button>
          </div>
        </div>

        {/* Hand Shape Tag */}
        <div className="mt-6 pt-4 border-t border-amber-200 flex flex-wrap items-center gap-6 text-xs text-stone-600">
          <div>
            <span className="text-stone-500 uppercase tracking-wider block text-[10px]">{t.elementalShape}</span>
            <span className="font-semibold text-stone-800 text-sm">
              {isTamil ? "நிலம்-காற்று இணைந்த கை (நடைமுறை ஞானி)" : handShape}
            </span>
          </div>
          <div>
            <span className="text-stone-500 uppercase tracking-wider block text-[10px]">{t.dominantMount}</span>
            <span className="font-semibold text-amber-700 text-sm">
              {isTamil ? "புதன் மேடு (குறிப்பு)" : "Mount of Mercury (Reference)"}
            </span>
          </div>
          <div>
            <span className="text-stone-500 uppercase tracking-wider block text-[10px]">{t.primaryArc}</span>
            <span className="font-semibold text-emerald-700 text-sm">
              {isTamil ? "தடையற்ற நீண்ட ஆயுள் ரேகை" : "Unbroken Vitality Arc"}
            </span>
          </div>
        </div>
      </div>

      {/* Core Personality Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-rose-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-600" />
          </div>
          <h4 className="font-serif font-bold text-stone-900">{t.emotionalPattern}</h4>
          <p className="text-xs text-stone-700 leading-relaxed">
            {isTamil 
              ? "ஆழ்ந்த பாசமும் விசுவாசமும் கொண்டவர். உறவுகளில் நேர்மையை விரும்புபவர். மன அழுத்தமின்றி சமநிலையோடு முடிவெடுப்பது நல்லது." 
              : `${handDuality.emotionalNature} High empathy allows you to form deep soul-bonds.`}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-sky-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
            <Brain className="w-5 h-5 text-sky-600" />
          </div>
          <h4 className="font-serif font-bold text-stone-900">{t.careerDrive}</h4>
          <p className="text-xs text-stone-700 leading-relaxed">
            {isTamil 
              ? "புத்தி ரேகையின் வளைவு சிறந்த வணிக புத்திசாலித்தனத்தையும், நிர்வாக ஆளுமையையும், கலை மற்றும் தொழில்நுட்ப அறிவையும் குறிக்கிறது." 
              : `${handDuality.careerDrive} Head line slope signifies rapid conceptual thinking.`}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-emerald-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="font-serif font-bold text-stone-900">{t.vitalityHealth}</h4>
          <p className="text-xs text-stone-700 leading-relaxed">
            {isTamil 
              ? "சாமுத்ரிகா சாஸ்திரப்படி இயற்கை பிராண சக்தி மற்றும் உடல் சமநிலை உண்டு. தொடர் யோகாசனம் மற்றும் இயற்கை வாழ்வியல் உடலை புத்துணர்ச்சியுடன் வைத்திருக்கும்." 
              : `${handDuality.lifeVitality} Natural Pranic vitality and somatic balance sustained through disciplined grounding routines.`}
          </p>
        </div>
      </div>

      {/* Mount Elevation Analytics */}
      <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600" />
            {t.mountElevations}
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">
            {isTamil 
              ? "பாரம்பரிய சாமுத்ரிகா சாஸ்திர குறிப்பு அளவீடுகள் (மாதிரி ஆய்வு, பயோமெட்ரிக் அளவீடு அல்ல)" 
              : "Classical Samudrika Shastra benchmark indices (Illustrative archetypal reference, not a measured biometric reading)"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {mounts.map(mount => (
            <div
              key={mount.name}
              className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2 hover:border-amber-400 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-800">
                  {isTamil ? (MOUNT_NAMES_TAMIL[mount.name] || mount.name) : mount.name}
                </span>
                <span className="text-xs font-bold text-amber-700">{mount.prominence || (isTamil ? "சாஸ்திர மாதிரி" : "Classical Benchmark")}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-amber-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${mount.rating}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-600">{mount.attributes}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Left vs Right Hand Principle */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-100/70 via-purple-50 to-orange-50 border border-amber-300 shadow-sm flex items-start gap-4">
        <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 mt-1">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-stone-900">
            {t.karmicDualityTitle}
          </h4>
          <p className="text-xs text-stone-700 mt-1 leading-relaxed">
            {t.karmicDualityDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
